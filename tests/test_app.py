"""Endpoint tests for the toolkit. Run with: pytest"""
import json

import pytest

from app import app


@pytest.fixture()
def client():
    app.config["TESTING"] = True
    return app.test_client()


def post(client, endpoint, **payload):
    return client.post(endpoint, json=payload).get_json()


# --- Page ---------------------------------------------------------------------

def test_index_page_loads(client):
    res = client.get("/")
    assert res.status_code == 200
    assert b"/static/app.js" in res.data


def test_static_assets_served(client):
    assert client.get("/static/app.js").status_code == 200
    assert client.get("/static/style.css").status_code == 200


# --- TextFSM / TTP / XPath / JMESPath / Regex ----------------------------------

def test_textfsm(client):
    template = "Value NAME (\\S+)\nValue IP (\\S+)\n\nStart\n  ^interface ${NAME}\n  ^ ip address ${IP} -> Record\n"
    text = "interface Gi0/0\n ip address 10.0.0.1\ninterface Gi0/1\n ip address 10.0.0.2\n"
    data = post(client, "/api/textfsm", template=template, text=text)
    assert data["ok"] is True
    assert data["headers"] == ["NAME", "IP"]
    assert data["records"] == [{"NAME": "Gi0/0", "IP": "10.0.0.1"}, {"NAME": "Gi0/1", "IP": "10.0.0.2"}]


def test_textfsm_requires_input(client):
    assert post(client, "/api/textfsm", template="", text="x")["ok"] is False


def test_ttp(client):
    template = "<group name=\"interfaces\">\ninterface {{ name }}\n ip address {{ ip }} {{ mask }}\n</group>"
    data = post(client, "/api/ttp", template=template, data="interface Gi0/0\n ip address 10.0.0.1 255.255.255.0\n")
    assert data["ok"] is True
    assert "Gi0/0" in json.dumps(data["result"])


def test_xpath(client):
    xml = "<r><i><n>a</n><e>true</e></i><i><n>b</n><e>false</e></i></r>"
    data = post(client, "/api/xpath", xml=xml, xpath="//i[e='true']/n/text()")
    assert data == {"ok": True, "count": 1, "results": ["a"]}


def test_xpath_invalid_xml(client):
    assert post(client, "/api/xpath", xml="<r>", xpath="//r")["ok"] is False


def test_jmespath(client):
    data = post(client, "/api/jmespath", data='{"a": [{"b": 1}, {"b": 2}]}', expression="a[].b")
    assert data == {"ok": True, "result": [1, 2]}


def test_regex(client):
    data = post(client, "/api/regex", pattern=r"Gi(\d+)/(\d+)", text="Gi0/1 Gi0/2")
    assert data["ok"] is True
    assert data["count"] == 2
    assert data["matches"][0]["groups"] == ["0", "1"]


def test_regex_invalid_pattern(client):
    assert post(client, "/api/regex", pattern="(", text="x")["ok"] is False


# --- Validation / conversion / models ------------------------------------------

def test_json_schema_valid_and_invalid(client):
    schema = '{"type": "object", "required": ["hostname"]}'
    assert post(client, "/api/json-schema", schema=schema, data='{"hostname": "r1"}')["valid"] is True
    bad = post(client, "/api/json-schema", schema=schema, data="{}")
    assert bad["ok"] is True and bad["valid"] is False


@pytest.mark.parametrize("source,target,content,check", [
    ("json", "yaml", '{"a": 1}', "a: 1"),
    ("yaml", "json", "a: 1", '"a": 1'),
    ("json", "xml", '{"root": {"a": "1"}}', "<a>1</a>"),
])
def test_convert(client, source, target, content, check):
    data = post(client, "/api/convert", source_format=source, target_format=target, content=content)
    assert data["ok"] is True
    assert check in data["result"]


def test_data_model_json_schema_and_pydantic(client):
    sample = '{"hostname": "r1", "asn": 65001}'
    js = post(client, "/api/data-model", sample_format="json", model_type="json_schema", sample_data=sample)
    assert js["ok"] is True and js["result"]["validation"]["valid"] is True
    py = post(client, "/api/data-model", sample_format="json", model_type="pydantic", sample_data=sample)
    assert py["ok"] is True and "BaseModel" in py["result"]["generated_model"]
    drift = post(client, "/api/data-model", sample_format="json", model_type="json_schema",
                 sample_data=sample, validate_data='{"hostname": "r2", "asn": "x"}')
    assert drift["result"]["validation"]["valid"] is False


def test_base64_round_trip(client):
    enc = post(client, "/api/base64", mode="encode", text="hello")["result"]
    assert post(client, "/api/base64", mode="decode", text=enc)["result"] == "hello"


# --- J2 Renderer: default mode (must not change) ---------------------------------

def test_jinja2_default_trims_blocks(client):
    template = "{{ a }}\n{% if true %}\nx\n{% endif %}\n"
    data = post(client, "/api/jinja2", template=template, variables='{"a": 1}')
    assert data == {"ok": True, "result": "1\nx\n"}


def test_jinja2_default_is_strict(client):
    data = post(client, "/api/jinja2", template="{{ missing }}", variables="{}")
    assert data["ok"] is False
    assert "'missing' is undefined" in data["error"]


def test_jinja2_default_yaml_variables(client):
    data = post(client, "/api/jinja2", template="{{ h }}", variables="h: r1", variables_format="yaml")
    assert data["result"] == "r1"


@pytest.mark.parametrize("flag", [False, "false", "", None])
def test_jinja2_netbox_flag_off_keeps_default(client, flag):
    data = post(client, "/api/jinja2", template="{{ missing }}", variables="{}", netbox_mode=flag)
    assert data["ok"] is False


# --- J2 Renderer: NetBox mode ----------------------------------------------------

def nb(client, template, variables="{}", **extra):
    return post(client, "/api/jinja2", template=template, variables=variables, netbox_mode=True, **extra)


def test_netbox_mode_keeps_whitespace(client):
    data = nb(client, "{{ a }}\n{% if true %}\nx\n{% endif %}\n", '{"a": 1}')
    assert data["result"] == "1\n\nx\n"


def test_netbox_mode_undefined_renders_empty(client):
    assert nb(client, "[{{ missing }}]")["result"] == "[]"


def test_netbox_mode_is_sandboxed(client):
    data = nb(client, "{{ ''.__class__.__mro__ }}")
    assert data["ok"] is False
    assert "SecurityError" in data["error"]


def test_netbox_mode_env_filter(client):
    assert nb(client, "{{ 'HOME' | env }}")["result"] == "None"


def test_netbox_mode_crlf_to_lf(client):
    assert nb(client, "a\r\nb")["result"] == "a\nb"


def test_netbox_mode_error_line_numbers(client):
    assert nb(client, "a\n\n{% for x in %}")["error"].startswith("Template line 3:")
    assert nb(client, "a\n\n\n{{ x.y.z }}", '{"x": {}}')["error"].startswith("Template line 4:")


def test_netbox_mode_model_namespace_hint(client):
    error = nb(client, "{% for p in ipam.Prefix.objects.all() %}{% endfor %}")["error"]
    assert "'ipam' is undefined" in error
    assert "NetBox model namespace" in error


def test_netbox_mode_requires_mapping(client):
    assert "mapping" in nb(client, "a", "[1]")["error"]


# --- Python Playground --------------------------------------------------------------

def test_python_playground_session(client):
    init = post(client, "/api/python-playground", action="init", var1='{"a": 2}', var2="", var3="")
    assert init["ok"] is True
    sid = init["session_id"]
    out = post(client, "/api/python-playground", action="exec", session_id=sid, function_code="value['a'] * 21")
    assert out["result"]["result"] == 42
    printed = post(client, "/api/python-playground", action="exec", session_id=sid, function_code="print('hi')")
    assert printed["result"]["stdout"] == "hi\n"
    post(client, "/api/python-playground", action="reset", session_id=sid)
    gone = post(client, "/api/python-playground", action="exec", session_id=sid, function_code="1")
    assert gone["ok"] is False


def test_python_playground_lint(client):
    bad = post(client, "/api/python-playground", action="lint", function_code="def f(:\n  pass", var1="", var2="", var3="")
    assert bad["result"]["syntax"]["valid"] is False
    assert bad["result"]["syntax"]["line"] == 1


# --- Regex Tester: Python engine, flags, replace, timeout, portability ---------------

import shutil

import regex_engine

needs_grep = pytest.mark.skipif(shutil.which("grep") is None, reason="grep not installed")


def levels(data):
    return {p["id"]: p["level"] for p in data["portability"]}


def test_regex_spans_and_named_groups(client):
    data = post(client, "/api/regex", pattern=r"(?P<intf>Gi\S+) (\d+)?", text="Gi0/1 x")
    m = data["matches"][0]
    assert m["groups"] == ["Gi0/1", None]
    assert m["spans"] == [[0, 5], None]
    assert m["named"] == {"intf": "Gi0/1"}
    assert data["group_names"] == {"1": "intf"}


def test_regex_flags(client):
    assert post(client, "/api/regex", pattern="gi", text="Gi0/1")["count"] == 0
    assert post(client, "/api/regex", pattern="gi", text="Gi0/1", flags="i")["count"] == 1
    assert post(client, "/api/regex", pattern="^b", text="a\nb", flags="m")["count"] == 1
    assert post(client, "/api/regex", pattern="a.b", text="a\nb", flags="s")["count"] == 1


def test_regex_replace(client):
    data = post(client, "/api/regex", pattern=r"Gi(\d+)/(\d+)", text="Gi0/1 Gi0/2",
                replace_enabled=True, replacement=r"GigabitEthernet\1/\2")
    assert data["replaced"] == "GigabitEthernet0/1 GigabitEthernet0/2"
    assert data["replace_count"] == 2
    deleted = post(client, "/api/regex", pattern=r"\s+", text="a b", replace_enabled=True, replacement="")
    assert deleted["replaced"] == "ab"
    off = post(client, "/api/regex", pattern="a", text="a", replace_enabled=False, replacement="x")
    assert "replaced" not in off


def test_regex_timeout_stops_catastrophic_pattern(client, monkeypatch):
    monkeypatch.setattr(regex_engine, "TIMEOUT_SECONDS", 0.5)
    data = post(client, "/api/regex", pattern=r"(a+)+$", text="a" * 40 + "b")
    assert data["ok"] is False and data["timeout"] is True
    # The server keeps working afterwards.
    assert post(client, "/api/regex", pattern=r"\d", text="a1")["count"] == 1


def test_regex_pattern_error_still_reports_portability(client):
    data = post(client, "/api/regex", pattern=r"(?<name>x)", text="x")
    assert data["ok"] is False
    assert levels(data)["python"] == "error"


def test_regex_cisco_rules(client):
    digits = post(client, "/api/regex", pattern=r"\d+", text="65001")
    assert levels(digits)["cisco"] == "error"
    as_path = post(client, "/api/regex", pattern=r"^65001_[0-9]+$", text="65001_65002")
    assert levels(as_path)["cisco"] == "ok"
    cisco = next(p for p in as_path["portability"] if p["id"] == "cisco")
    assert any("separator" in h for h in cisco["hints"])


@needs_grep
def test_regex_grep_real_engine(client):
    digits = post(client, "/api/regex", pattern=r"\d+", text="abc 123\nxyz")
    assert levels(digits)["grep_p"] == "ok"
    assert levels(digits)["grep_e"] == "error"
    lazy = post(client, "/api/regex", pattern=r"a+?", text="aa\nb")
    assert levels(lazy)["grep_e"] == "error"
    plain = post(client, "/api/regex", pattern=r"[0-9]+", text="abc 123\nxyz")
    assert levels(plain)["grep_e"] == "ok"


def test_regex_features_detection():
    f = regex_engine.features
    assert {"digit", "lazy"} <= f(r"\d+?")
    assert "lookaround" in f(r"(?=x)a")
    assert "named_group" in f(r"(?P<a>x)")
    assert "noncapture" in f(r"(?:x)")
    assert "backref" in f(r"(a)\1")
    assert "interval" in f(r"a{2,3}")
    assert "interval" not in f(r"a+b*c?")
    assert "posix_class" in f(r"[[:digit:]]")
    assert "underscore" in f(r"_65001_")


def test_regex_line_anchor_note(client):
    data = post(client, "/api/regex", pattern=r"^65001_[0-9]+$", text="65001_65002\n65002_65001")
    python = next(p for p in data["portability"] if p["id"] == "python")
    assert any("multiline" in h for h in python["hints"])
    assert python["level"] == "ok"
    with_m = post(client, "/api/regex", pattern=r"^65001_[0-9]+$", text="65001_65002\n65002_65001", flags="m")
    assert with_m["count"] == 1
    assert not next(p for p in with_m["portability"] if p["id"] == "python")["hints"]
