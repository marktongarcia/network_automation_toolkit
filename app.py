#!/usr/bin/env python3

import base64
import ast
import builtins
import contextlib
import io
import json
import math
import os
import datetime
import ipaddress
import itertools
import functools
import collections
import random
import keyword
import re
import traceback
import uuid
from typing import Any

import jmespath
import textfsm
import xmltodict
import yaml
from flask import Flask, jsonify, render_template, request
from jinja2 import Environment, StrictUndefined
from jsonschema import ValidationError, validate
from lxml import etree
from ttp import ttp

app = Flask(__name__)
FUNCTION_REPL_SESSIONS = {}


def parse_playground_var(raw_text: str):
    text = (raw_text or "").strip()
    if not text:
        return {"value": None, "type": "NoneType", "warning": "Empty value loaded as None."}

    try:
        value = ast.literal_eval(text)
        return {"value": value, "type": type(value).__name__, "warning": ""}
    except Exception:
        pass

    try:
        value = json.loads(text)
        return {"value": value, "type": type(value).__name__, "warning": ""}
    except Exception:
        pass

    # Fallback to raw string so session can still start with user input.
    return {
        "value": raw_text,
        "type": "str",
        "warning": "Could not parse as Python literal/JSON. Loaded as plain string.",
    }


@app.get("/")
def index() -> str:
    return render_template("index.html")


def error_response(message: str, status_code: int = 400):
    return jsonify({"ok": False, "error": message}), status_code


def parse_structured_input(format_name: str, content: str) -> Any:
    fmt = format_name.lower()
    if fmt == "json":
        return json.loads(content)
    if fmt in {"yaml", "yml"}:
        return yaml.safe_load(content)
    if fmt == "xml":
        return xmltodict.parse(content)
    raise ValueError(f"Unsupported format: {format_name}")


def dump_structured_output(format_name: str, data: Any) -> str:
    fmt = format_name.lower()
    if fmt == "json":
        return json.dumps(data, indent=2, ensure_ascii=False)
    if fmt in {"yaml", "yml"}:
        return yaml.safe_dump(data, sort_keys=False, allow_unicode=True)
    if fmt == "xml":
        if isinstance(data, dict) and len(data) == 1:
            return xmltodict.unparse(data, pretty=True)
        return xmltodict.unparse({"root": data}, pretty=True)
    raise ValueError(f"Unsupported format: {format_name}")


def infer_json_schema(value: Any) -> dict:
    if isinstance(value, dict):
        properties = {k: infer_json_schema(v) for k, v in value.items()}
        return {
            "type": "object",
            "properties": properties,
            "required": list(value.keys()),
            "additionalProperties": False,
        }
    if isinstance(value, list):
        if not value:
            return {"type": "array", "items": {}}
        item_schemas = [infer_json_schema(item) for item in value]
        unique = []
        seen = set()
        for schema in item_schemas:
            sig = json.dumps(schema, sort_keys=True)
            if sig not in seen:
                seen.add(sig)
                unique.append(schema)
        if len(unique) == 1:
            return {"type": "array", "items": unique[0]}
        return {"type": "array", "items": {"anyOf": unique}}
    if isinstance(value, bool):
        return {"type": "boolean"}
    if isinstance(value, int):
        return {"type": "integer"}
    if isinstance(value, float):
        return {"type": "number"}
    if isinstance(value, str):
        return {"type": "string"}
    if value is None:
        return {"type": "null"}
    return {"type": "string"}


def _safe_identifier(name: str) -> str:
    cleaned = re.sub(r"\W+", "_", name).strip("_") or "field"
    if cleaned[0].isdigit():
        cleaned = f"field_{cleaned}"
    if keyword.iskeyword(cleaned):
        cleaned = f"{cleaned}_"
    return cleaned


def _class_name_from_key(key: str) -> str:
    words = re.split(r"[^a-zA-Z0-9]+", key)
    base = "".join(w.capitalize() for w in words if w) or "Model"
    if base[0].isdigit():
        base = f"Model{base}"
    return base


def generate_pydantic_model(sample: Any, root_name: str = "RootModel") -> str:
    class_defs = []
    used_names = set()
    needs_field_alias = False

    def unique_class_name(base: str) -> str:
        candidate = base
        idx = 2
        while candidate in used_names:
            candidate = f"{base}{idx}"
            idx += 1
        used_names.add(candidate)
        return candidate

    def infer_type(val: Any, key_hint: str) -> str:
        nonlocal needs_field_alias
        if isinstance(val, dict):
            class_name = unique_class_name(_class_name_from_key(key_hint))
            fields = []
            for raw_key, raw_value in val.items():
                field_name = _safe_identifier(raw_key)
                if field_name != raw_key:
                    needs_field_alias = True
                    fields.append(
                        f"    {field_name}: {infer_type(raw_value, raw_key)} = Field(alias={json.dumps(raw_key)})"
                    )
                else:
                    fields.append(f"    {field_name}: {infer_type(raw_value, raw_key)}")
            if not fields:
                fields = ["    pass"]
            class_defs.append((class_name, fields))
            return class_name
        if isinstance(val, list):
            if not val:
                return "List[Any]"
            non_none = [item for item in val if item is not None]
            if not non_none:
                return "List[Any]"
            # Use first non-null sample item as representative element type.
            first_type = infer_type(non_none[0], key_hint)
            return f"List[{first_type}]"
        if isinstance(val, bool):
            return "bool"
        if isinstance(val, int):
            return "int"
        if isinstance(val, float):
            return "float"
        if isinstance(val, str):
            return "str"
        if val is None:
            return "Any"
        return "Any"

    root_type = infer_type(sample, root_name)
    lines = ["from typing import Any, List", ""]
    if needs_field_alias:
        lines.append("from pydantic import BaseModel, Field")
    else:
        lines.append("from pydantic import BaseModel")
    lines.append("")

    for class_name, fields in class_defs:
        lines.append(f"class {class_name}(BaseModel):")
        lines.extend(fields)
        lines.append("")

    lines.append(f"# Root sample type: {root_type}")
    if root_type in used_names:
        lines.append(f"{root_name} = {root_type}")
    else:
        lines.append(f"# Non-object root example. Suggested annotation: {root_type}")
    return "\n".join(lines).strip()


@app.post("/api/textfsm")
def textfsm_parser():
    payload = request.get_json(silent=True) or {}
    template = payload.get("template", "")
    raw_text = payload.get("text", "")

    if not template.strip() or not raw_text.strip():
        return error_response("Template and text are required.")

    try:
        parser = textfsm.TextFSM(io.StringIO(template))
        rows = parser.ParseText(raw_text)
        records = [dict(zip(parser.header, row)) for row in rows]
        return jsonify({"ok": True, "headers": parser.header, "rows": rows, "records": records})
    except Exception as exc:
        return error_response(str(exc))


@app.post("/api/xpath")
def xpath_tester():
    payload = request.get_json(silent=True) or {}
    xml_text = payload.get("xml", "")
    expression = payload.get("xpath", "")

    if not xml_text.strip() or not expression.strip():
        return error_response("XML and XPath expression are required.")

    try:
        root = etree.fromstring(xml_text.encode("utf-8"))
        matches = root.xpath(expression)
        output = []
        for item in matches:
            if isinstance(item, etree._Element):
                output.append(etree.tostring(item, encoding="unicode", pretty_print=True).strip())
            else:
                output.append(str(item))
        return jsonify({"ok": True, "count": len(matches), "results": output})
    except Exception as exc:
        return error_response(str(exc))


@app.post("/api/json-schema")
def json_schema_validator():
    payload = request.get_json(silent=True) or {}
    schema_text = payload.get("schema", "")
    data_text = payload.get("data", "")

    if not schema_text.strip() or not data_text.strip():
        return error_response("Schema and data are required.")

    try:
        schema = json.loads(schema_text)
        data = json.loads(data_text)
        validate(instance=data, schema=schema)
        return jsonify({"ok": True, "valid": True, "message": "Valid JSON for provided schema."})
    except ValidationError as exc:
        return jsonify({"ok": True, "valid": False, "message": exc.message, "path": list(exc.path)})
    except Exception as exc:
        return error_response(str(exc))


@app.post("/api/jmespath")
def jmespath_validator():
    payload = request.get_json(silent=True) or {}
    data_text = payload.get("data", "")
    expression = payload.get("expression", "")

    if not data_text.strip() or not expression.strip():
        return error_response("JSON data and JMESPath expression are required.")

    try:
        data = json.loads(data_text)
        result = jmespath.search(expression, data)
        return jsonify({"ok": True, "result": result})
    except Exception as exc:
        return error_response(str(exc))


@app.post("/api/convert")
def converter():
    payload = request.get_json(silent=True) or {}
    source_format = payload.get("source_format", "")
    target_format = payload.get("target_format", "")
    content = payload.get("content", "")

    if not source_format or not target_format:
        return error_response("Source and target format are required.")
    if not content.strip():
        return error_response("Content is required.")

    try:
        parsed = parse_structured_input(source_format, content)
        output = dump_structured_output(target_format, parsed)
        return jsonify({"ok": True, "result": output})
    except Exception as exc:
        return error_response(str(exc))


@app.post("/api/data-model")
def data_model_workbench():
    payload = request.get_json(silent=True) or {}
    sample_format = payload.get("sample_format", "json")
    model_type = payload.get("model_type", "json_schema")
    sample_data_text = payload.get("sample_data", "")
    validate_data_text = payload.get("validate_data", "")
    validate_format = payload.get("validate_format", sample_format)

    if not sample_data_text.strip():
        return error_response("Sample data is required.")

    try:
        sample_data = parse_structured_input(sample_format, sample_data_text)
        schema = infer_json_schema(sample_data)

        if model_type == "json_schema":
            generated_model = json.dumps(schema, indent=2, ensure_ascii=False)
        elif model_type == "pydantic":
            generated_model = generate_pydantic_model(sample_data)
        else:
            return error_response("model_type must be json_schema or pydantic.")

        target_data = sample_data
        if validate_data_text.strip():
            target_data = parse_structured_input(validate_format, validate_data_text)

        try:
            validate(instance=target_data, schema=schema)
            validation_result = {"valid": True, "message": "Validation passed."}
        except ValidationError as exc:
            validation_result = {
                "valid": False,
                "message": exc.message,
                "path": list(exc.path),
            }

        return jsonify(
            {
                "ok": True,
                "result": {
                    "model_type": model_type,
                    "generated_model": generated_model,
                    "validation": validation_result,
                },
            }
        )
    except Exception as exc:
        return error_response(str(exc))


@app.post("/api/jinja2")
def jinja2_renderer():
    payload = request.get_json(silent=True) or {}
    template_text = payload.get("template", "")
    vars_text = payload.get("variables", "{}")
    vars_format = payload.get("variables_format", "json")

    if not template_text.strip():
        return error_response("Template is required.")

    try:
        variables = parse_structured_input(vars_format, vars_text)
        if variables is None:
            variables = {}
        env = Environment(undefined=StrictUndefined, trim_blocks=True, lstrip_blocks=True)
        template = env.from_string(template_text)
        rendered = template.render(**variables)
        return jsonify({"ok": True, "result": rendered})
    except Exception as exc:
        return error_response(str(exc))


@app.post("/api/ttp")
def ttp_parser():
    payload = request.get_json(silent=True) or {}
    template_text = payload.get("template", "")
    data_text = payload.get("data", "")

    if not template_text.strip() or not data_text.strip():
        return error_response("TTP template and data are required.")

    try:
        parser = ttp(data=data_text, template=template_text)
        parser.parse()
        result_json = parser.result(format="json")
        parsed_result = [json.loads(item) for item in result_json]
        return jsonify({"ok": True, "result": parsed_result})
    except Exception as exc:
        return error_response(str(exc))


@app.post("/api/python-playground")
@app.post("/api/function-tester")
def python_playground():
    payload = request.get_json(silent=True) or {}
    action = payload.get("action", "exec")

    def make_globals(var1_value, var2_value, var3_value):
        return {
            "__builtins__": builtins.__dict__,
            "json": json,
            "re": re,
            "math": math,
            "datetime": datetime,
            "ipaddress": ipaddress,
            "itertools": itertools,
            "functools": functools,
            "collections": collections,
            "random": random,
            "value": var1_value,
            "var1": var1_value,
            "var2": var2_value,
            "var3": var3_value,
        }

    def serialize(value):
        try:
            json.dumps(value)
            return value
        except TypeError:
            return repr(value)

    if action == "inspect":
        var1_info = parse_playground_var(payload.get("var1", ""))
        var2_info = parse_playground_var(payload.get("var2", ""))
        var3_info = parse_playground_var(payload.get("var3", ""))
        return jsonify(
            {
                "ok": True,
                "result": {
                    "var1": {"type": var1_info["type"], "warning": var1_info["warning"]},
                    "var2": {"type": var2_info["type"], "warning": var2_info["warning"]},
                    "var3": {"type": var3_info["type"], "warning": var3_info["warning"]},
                },
            }
        )

    if action == "init":
        try:
            var1_info = parse_playground_var(payload.get("var1", ""))
            var2_info = parse_playground_var(payload.get("var2", ""))
            var3_info = parse_playground_var(payload.get("var3", ""))
        except Exception as exc:
            return error_response(str(exc))

        session_id = str(uuid.uuid4())
        FUNCTION_REPL_SESSIONS[session_id] = {
            "globals": make_globals(var1_info["value"], var2_info["value"], var3_info["value"])
        }
        summary_lines = [
            "Session started. `value` aliases `var1`.",
            f"var1 type: {var1_info['type']}",
            f"var2 type: {var2_info['type']}",
            f"var3 type: {var3_info['type']}",
        ]
        if var1_info["warning"]:
            summary_lines.append(f"var1 warning: {var1_info['warning']}")
        if var2_info["warning"]:
            summary_lines.append(f"var2 warning: {var2_info['warning']}")
        if var3_info["warning"]:
            summary_lines.append(f"var3 warning: {var3_info['warning']}")
        return jsonify(
            {
                "ok": True,
                "session_id": session_id,
                "result": "\n".join(summary_lines),
            }
        )

    if action == "reset":
        session_id = payload.get("session_id", "")
        FUNCTION_REPL_SESSIONS.pop(session_id, None)
        return jsonify({"ok": True, "result": "Session reset."})

    if action == "lint":
        code_text = payload.get("function_code", "")
        var1_info = parse_playground_var(payload.get("var1", ""))
        var2_info = parse_playground_var(payload.get("var2", ""))
        var3_info = parse_playground_var(payload.get("var3", ""))

        syntax = {"valid": True, "message": "Syntax OK.", "line": None, "offset": None}
        if code_text.strip():
            try:
                ast.parse(code_text)
            except SyntaxError as exc:
                syntax = {
                    "valid": False,
                    "message": exc.msg or "invalid syntax",
                    "line": exc.lineno,
                    "offset": exc.offset,
                }
        else:
            syntax["message"] = "Code pad is empty."

        return jsonify(
            {
                "ok": True,
                "result": {
                    "syntax": syntax,
                    "var1": {"type": var1_info["type"], "warning": var1_info["warning"]},
                    "var2": {"type": var2_info["type"], "warning": var2_info["warning"]},
                    "var3": {"type": var3_info["type"], "warning": var3_info["warning"]},
                },
            }
        )

    if action != "exec":
        return error_response("Unsupported action. Use init, lint, exec, or reset.")

    session_id = payload.get("session_id", "")
    code_text = payload.get("function_code", "")
    if not session_id:
        return error_response("No active session. Click Start Session first.")
    if session_id not in FUNCTION_REPL_SESSIONS:
        return error_response("Session not found. Start a new session.")
    if not code_text.strip():
        return error_response("Code input is required.")

    session_globals = FUNCTION_REPL_SESSIONS[session_id]["globals"]
    stdout_buffer = io.StringIO()
    stderr_buffer = io.StringIO()

    result = None
    has_result = False
    try:
        with contextlib.redirect_stdout(stdout_buffer), contextlib.redirect_stderr(stderr_buffer):
            try:
                exec(code_text, session_globals)
                if not stdout_buffer.getvalue().strip() and not stderr_buffer.getvalue().strip():
                    try:
                        result = eval(code_text, session_globals)
                        has_result = True
                    except SyntaxError:
                        pass
            except SyntaxError:
                result = eval(code_text, session_globals)
                has_result = True
    except Exception:
        stderr_buffer.write(traceback.format_exc())

    payload_out = {"stdout": stdout_buffer.getvalue(), "stderr": stderr_buffer.getvalue()}
    if has_result:
        payload_out["result"] = serialize(result)

    if not payload_out["stdout"] and not payload_out["stderr"] and not has_result:
        payload_out["stdout"] = "(no output)"

    return jsonify({"ok": True, "session_id": session_id, "result": payload_out})


@app.post("/api/regex")
def regex_tester():
    payload = request.get_json(silent=True) or {}
    pattern = payload.get("pattern", "")
    text = payload.get("text", "")

    if not pattern:
        return error_response("Regex pattern is required.")

    try:
        compiled = re.compile(pattern)
        matches = [
            {
                "match": m.group(0),
                "groups": list(m.groups()),
                "start": m.start(),
                "end": m.end(),
            }
            for m in compiled.finditer(text)
        ]
        return jsonify({"ok": True, "count": len(matches), "matches": matches})
    except Exception as exc:
        return error_response(str(exc))


@app.post("/api/base64")
def base64_tool():
    payload = request.get_json(silent=True) or {}
    mode = payload.get("mode", "encode")
    text = payload.get("text", "")

    try:
        if mode == "encode":
            result = base64.b64encode(text.encode("utf-8")).decode("utf-8")
        elif mode == "decode":
            result = base64.b64decode(text.encode("utf-8")).decode("utf-8")
        else:
            return error_response("Mode must be 'encode' or 'decode'.")
        return jsonify({"ok": True, "result": result})
    except Exception as exc:
        return error_response(str(exc))


if __name__ == "__main__":
    debug_enabled = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(host="127.0.0.1", port=5000, debug=debug_enabled)
