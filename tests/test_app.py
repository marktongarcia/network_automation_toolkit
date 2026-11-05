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
