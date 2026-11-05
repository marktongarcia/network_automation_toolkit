const tools = [
  {
    id: 'textfsm',
    title: 'TextFSM Parser',
    description: 'Parse CLI output with a TextFSM template.',
    useCase: 'Use case: turn repeated show-command output into structured rows you can loop over in automation.',
    chooser: 'Best for: stable line-oriented CLI formats. Alternative: use TTP when output shape varies a lot.',
    endpoint: '/api/textfsm',
    fields: [
      { key: 'template', label: 'Template', type: 'code-editor', mode: 'textfsm', rows: 10, value: 'Value INTERFACE (\\S+)\nValue IP_ADDRESS (\\S+)\nValue STATUS (up|down|administratively down)\nValue PROTOCOL (up|down)\n\nStart\n  ^${INTERFACE}\\s+${IP_ADDRESS}\\s+YES\\s+\\S+\\s+${STATUS}\\s+${PROTOCOL} -> Record' },
      { key: 'text', label: 'Raw Text', type: 'textarea', value: 'Interface              IP-Address      OK? Method Status                Protocol\nGigabitEthernet0/0     10.10.10.1      YES manual up                    up\nGigabitEthernet0/1     172.16.20.1     YES manual up                    up\nGigabitEthernet0/2     unassigned      YES unset  administratively down down\nLoopback0              192.168.255.1   YES manual up                    up' }
    ]
  },
  {
    id: 'xpath',
    title: 'XPath Tester',
    description: 'Run XPath expressions on XML.',
    useCase: 'Use case: quickly extract specific values from NETCONF/XML payloads without writing full scripts.',
    chooser: 'Best for: XML/NETCONF trees. Alternative: convert to JSON first, then use JMESPath for JSON-centric workflows.',
    endpoint: '/api/xpath',
    fields: [
      { key: 'xml', label: 'XML', type: 'textarea', value: '<rpc-reply>\n  <data>\n    <interfaces>\n      <interface>\n        <name>GigabitEthernet0/0</name>\n        <enabled>true</enabled>\n        <ipv4>\n          <address>\n            <ip>10.10.10.1</ip>\n            <prefix-length>30</prefix-length>\n          </address>\n        </ipv4>\n      </interface>\n      <interface>\n        <name>Loopback0</name>\n        <enabled>true</enabled>\n        <ipv4>\n          <address>\n            <ip>192.168.255.1</ip>\n            <prefix-length>32</prefix-length>\n          </address>\n        </ipv4>\n      </interface>\n    </interfaces>\n  </data>\n</rpc-reply>' },
      { key: 'xpath', label: 'XPath', type: 'code-editor', mode: 'xpath', rows: 3, value: '//interface[enabled=\"true\"]/name/text()' }
    ]
  },
  {
    id: 'json-schema',
    title: 'JSON Schema Validator',
    description: 'Validate JSON data against JSON Schema.',
    useCase: 'Use case: enforce data contracts before sending inventory, intent, or API payloads to downstream tools.',
    chooser: 'Best for: validating structure and required fields. Alternative: use Python Playground for custom business-rule checks.',
    endpoint: '/api/json-schema',
    fields: [
      { key: 'schema', label: 'Schema (JSON)', type: 'code-editor', mode: 'json-schema', rows: 16, value: '{\n  "$schema": "https://json-schema.org/draft/2020-12/schema",\n  "type": "object",\n  "required": ["hostname", "mgmt_ip", "role", "interfaces"],\n  "properties": {\n    "hostname": {"type": "string", "minLength": 3},\n    "mgmt_ip": {"type": "string", "pattern": "^\\\\d+\\\\.\\\\d+\\\\.\\\\d+\\\\.\\\\d+$"},\n    "role": {"type": "string", "enum": ["edge", "core", "access"]},\n    "interfaces": {\n      "type": "array",\n      "minItems": 1,\n      "items": {\n        "type": "object",\n        "required": ["name", "enabled"],\n        "properties": {\n          "name": {"type": "string"},\n          "enabled": {"type": "boolean"},\n          "description": {"type": "string"}\n        }\n      }\n    }\n  }\n}' },
      { key: 'data', label: 'Data (JSON)', type: 'textarea', value: '{\n  "hostname": "R1-EDGE",\n  "mgmt_ip": "10.0.0.10",\n  "role": "edge",\n  "interfaces": [\n    {\n      "name": "GigabitEthernet0/0",\n      "enabled": true,\n      "description": "WAN_TO_ISP"\n    },\n    {\n      "name": "GigabitEthernet0/1",\n      "enabled": true,\n      "description": "LAN_USERS"\n    }\n  ]\n}' }
    ]
  },
  {
    id: 'jmespath',
    title: 'JMESPath Validator',
    description: 'Evaluate JMESPath expressions on JSON.',
    useCase: 'Use case: filter large JSON responses (facts, telemetry, API output) to only what your playbook needs.',
    chooser: 'Best for: querying/filtering JSON. Alternative: use Python Playground when query logic becomes procedural.',
    endpoint: '/api/jmespath',
    fields: [
      { key: 'data', label: 'Data (JSON)', type: 'textarea', value: '{\n  "hostname": "R1-EDGE",\n  "interfaces": [\n    {"name": "GigabitEthernet0/0", "enabled": true, "counters": {"in_errors": 0, "out_errors": 2}},\n    {"name": "GigabitEthernet0/1", "enabled": true, "counters": {"in_errors": 4, "out_errors": 1}},\n    {"name": "GigabitEthernet0/2", "enabled": false, "counters": {"in_errors": 0, "out_errors": 0}}\n  ]\n}' },
      { key: 'expression', label: 'JMESPath', type: 'code-editor', mode: 'jmespath', rows: 3, value: 'interfaces[?enabled && counters.in_errors > `0`].{name:name,in_errors:counters.in_errors}' }
    ]
  },
  {
    id: 'convert',
    title: 'Data Format Converter',
    description: 'Convert between JSON, XML, and YAML.',
    useCase: 'Use case: normalize data formats between systems, such as YAML vars to JSON APIs or XML exports to JSON.',
    chooser: 'Best for: fast format translation. Alternative: keep source format and use XPath/JMESPath directly when conversion is unnecessary.',
    endpoint: '/api/convert',
    fields: [
      { key: 'source_format', label: 'Source Format', type: 'select', options: ['json', 'xml', 'yaml'], value: 'json' },
      { key: 'target_format', label: 'Target Format', type: 'select', options: ['json', 'xml', 'yaml'], value: 'yaml' },
      { key: 'content', label: 'Content', type: 'textarea', value: '{\n  "device": {\n    "hostname": "R1-EDGE",\n    "site": "NYC1",\n    "asn": 65001,\n    "interfaces": [\n      {"name": "GigabitEthernet0/0", "ip": "10.10.10.1/30"},\n      {"name": "GigabitEthernet0/1", "ip": "172.16.20.1/24"}\n    ]\n  }\n}' }
    ]
  },
  {
    id: 'data-model',
    title: 'Data Model Workbench',
    description: 'Infer a model from sample data and validate payloads against it.',
    useCase: 'Use case: bootstrap JSON Schema or Pydantic models from real payloads, then test new data before coding.',
    chooser: 'Best for: designing/validating data contracts quickly. Alternative: Python Playground for fully custom validation logic.',
    endpoint: '/api/data-model',
    fields: [
      { key: 'sample_format', label: 'Sample Format', type: 'select', options: ['json', 'yaml'], value: 'json' },
      { key: 'model_type', label: 'Generate', type: 'select', options: ['json_schema', 'pydantic'], value: 'json_schema' },
      { key: 'validate_format', label: 'Validate Data Format', type: 'select', options: ['json', 'yaml'], value: 'json' },
      { key: 'sample_data', label: 'Sample Data', type: 'textarea', value: '{\n  "hostname": "R1-EDGE",\n  "site": "NYC1",\n  "asn": 65001,\n  "interfaces": [\n    {\n      "name": "GigabitEthernet0/0",\n      "enabled": true,\n      "ip": "10.10.10.1/30"\n    },\n    {\n      "name": "GigabitEthernet0/1",\n      "enabled": true,\n      "ip": "172.16.20.1/24"\n    }\n  ]\n}' },
      { key: 'validate_data', label: 'Validate Data (Optional)', type: 'textarea', value: '{\n  "hostname": "R2-EDGE",\n  "site": "SFO1",\n  "asn": 65010,\n  "interfaces": [\n    {\n      "name": "GigabitEthernet0/0",\n      "enabled": true,\n      "ip": "10.20.30.1/30"\n    }\n  ]\n}' }
    ]
  },
  {
    id: 'jinja2',
    title: 'J2 Renderer',
    description: 'Render Jinja2 templates with JSON/YAML variables.',
    useCase: 'Use case: preview generated configs locally before pushing to devices or committing templates.',
    chooser: 'Best for: deterministic text generation from structured vars. Alternative: Python Playground when output is non-template logic.',
    endpoint: '/api/jinja2',
    fields: [
      { key: 'template', label: 'Template', type: 'code-editor', mode: 'jinja2', rows: 14, value: 'hostname {{ hostname }}\n!\ninterface Loopback0\n ip address {{ loopback.ip }} {{ loopback.mask }}\n description Router-ID\n!\n{% for intf in interfaces %}interface {{ intf.name }}\n description {{ intf.description }}\n ip address {{ intf.ip }} {{ intf.mask }}\n{% if intf.shutdown %} shutdown\n{% else %} no shutdown\n{% endif %}!\n{% endfor %}' },
      { key: 'variables_format', label: 'Variables Format', type: 'select', options: ['json', 'yaml'], value: 'json' },
      { key: 'variables', label: 'Variables', type: 'textarea', value: '{\n  "hostname": "R1-EDGE",\n  "loopback": {\n    "ip": "192.168.255.1",\n    "mask": "255.255.255.255"\n  },\n  "interfaces": [\n    {\n      "name": "GigabitEthernet0/0",\n      "description": "WAN_TO_ISP",\n      "ip": "10.10.10.1",\n      "mask": "255.255.255.252",\n      "shutdown": false\n    },\n    {\n      "name": "GigabitEthernet0/1",\n      "description": "LAN_USERS",\n      "ip": "172.16.20.1",\n      "mask": "255.255.255.0",\n      "shutdown": false\n    }\n  ]\n}' }
    ]
  },
  {
    id: 'ttp',
    title: 'TTP Parser',
    description: 'Parse text data with TTP template.',
    useCase: 'Use case: parse semi-structured CLI output into named fields when TextFSM is not the best fit.',
    chooser: 'Best for: hierarchical or less rigid CLI output. Alternative: TextFSM for highly regular command output.',
    endpoint: '/api/ttp',
    fields: [
      { key: 'template', label: 'TTP Template', type: 'code-editor', mode: 'ttp', rows: 10, value: '<group name=\"interfaces\">\ninterface {{ name }}\n description {{ description | ORPHRASE }}\n ip address {{ ip }} {{ mask }}\n {{ state | ORPHRASE }}\n!</group>' },
      { key: 'data', label: 'Data', type: 'textarea', value: 'interface GigabitEthernet0/0\n description WAN_TO_ISP\n ip address 10.10.10.1 255.255.255.252\n no shutdown\n!\ninterface GigabitEthernet0/1\n description LAN_USERS\n ip address 172.16.20.1 255.255.255.0\n no shutdown\n!\ninterface GigabitEthernet0/2\n description UNUSED_PORT\n ip address 0.0.0.0 0.0.0.0\n shutdown\n!' }
    ]
  },
  {
    id: 'python-playground',
    title: 'Python Playground',
    description: 'Session-based Python REPL with value preloaded for quick experiments.',
    useCase: 'Use case: rapidly test imports, expressions, and data transforms on value before moving code into your project.',
    chooser: 'Best for: ad-hoc Python logic and exploratory testing. Alternative: JMESPath/Jinja2 for simpler declarative transforms.',
    endpoint: '/api/python-playground',
    fields: [
      { key: 'var1', label: 'var1', type: 'textarea', value: '{\n  "hostname": "R1-EDGE",\n  "interfaces": [\n    {"name": "GigabitEthernet0/0", "in_util": 72.5},\n    {"name": "GigabitEthernet0/1", "in_util": 28.0},\n    {"name": "GigabitEthernet0/2", "in_util": 4.2}\n  ]\n}' },
      { key: 'var2', label: 'var2', type: 'textarea', value: '{"threshold": 50, "ticket_prefix": "NOC"}' },
      { key: 'var3', label: 'var3', type: 'textarea', value: '["GigabitEthernet0/0", "GigabitEthernet0/1"]' },
      { key: 'code_pad', label: 'Code Pad (multiline)', type: 'code-editor', mode: 'python', rows: 12, value: 'def hot_interfaces():\n    t = var2["threshold"]\n    return [i["name"] for i in value["interfaces"] if i["in_util"] > t]\n\nprint("Hot interfaces:", hot_interfaces())' },
      { key: 'note', label: 'Note', type: 'note', value: 'Interactive mode: start a session, load multiline code from Code Pad, then run quick commands in prompt below. value is an alias for var1. var2 and var3 are also available.' }
    ]
  },
  {
    id: 'regex',
    title: 'Regex Tester',
    description: 'Match regular expressions against text.',
    useCase: 'Use case: iterate on regex patterns for parsing interfaces, IPs, and tags from raw text.',
    chooser: 'Best for: token extraction from strings. Alternative: TextFSM/TTP when you need complete record parsing.',
    endpoint: '/api/regex',
    fields: [
      { key: 'pattern', label: 'Pattern', type: 'regex-editor', value: '(?ms)^interface\\s+(\\S+)\\n\\s+ip address\\s+(\\d+\\.\\d+\\.\\d+\\.\\d+)\\s+(\\d+\\.\\d+\\.\\d+\\.\\d+)\\n\\s+description\\s+(.+?)\\n!' },
      { key: 'text', label: 'Text', type: 'textarea', value: 'interface GigabitEthernet0/0\n ip address 10.10.10.1 255.255.255.0\n description WAN_LINK_TO_ISP\n!\ninterface GigabitEthernet0/1\n ip address 172.16.20.1 255.255.255.0\n description LAN_USERS_VLAN20\n!\ninterface Loopback0\n ip address 192.168.255.1 255.255.255.255\n description ROUTER_ID\n!' }
    ]
  },
  {
    id: 'base64',
    title: 'Base64 Utility',
    description: 'Encode/decode Base64 quickly.',
    useCase: 'Use case: inspect encoded secrets/tokens and prepare payload fields that require Base64.',
    chooser: 'Best for: simple encode/decode operations. Alternative: Python Playground if you need chained transforms around Base64 data.',
    endpoint: '/api/base64',
    fields: [
      { key: 'mode', label: 'Mode', type: 'select', options: ['encode', 'decode'], value: 'encode' },
      { key: 'text', label: 'Text', type: 'textarea', value: '{\"token\":\"noc-automation\",\"scope\":\"read:interfaces\",\"expires\":\"2026-12-31T23:59:59Z\"}' }
    ]
  }
];

const tabRoot = document.getElementById('tabs');
const panelRoot = document.getElementById('panels');
const panelTemplate = document.getElementById('panel-template');
const themeSelect = document.getElementById('theme-select');
let pythonPlaygroundSessionId = null;
let pythonPlaygroundVarTypes = { var1: '?', var2: '?', var3: '?' };
const j2FallbackVars = {
  json: '{\n  "hostname": "R1-EDGE",\n  "loopback": {\n    "ip": "192.168.255.1",\n    "mask": "255.255.255.255"\n  },\n  "interfaces": [\n    {\n      "name": "GigabitEthernet0/0",\n      "description": "WAN_TO_ISP",\n      "ip": "10.10.10.1",\n      "mask": "255.255.255.252",\n      "shutdown": false\n    },\n    {\n      "name": "GigabitEthernet0/1",\n      "description": "LAN_USERS",\n      "ip": "172.16.20.1",\n      "mask": "255.255.255.0",\n      "shutdown": false\n    }\n  ]\n}',
  yaml: 'hostname: R1-EDGE\nloopback:\n  ip: 192.168.255.1\n  mask: 255.255.255.255\ninterfaces:\n  - name: GigabitEthernet0/0\n    description: WAN_TO_ISP\n    ip: 10.10.10.1\n    mask: 255.255.255.252\n    shutdown: false\n  - name: GigabitEthernet0/1\n    description: LAN_USERS\n    ip: 172.16.20.1\n    mask: 255.255.255.0\n    shutdown: false\n'
};
// Sample used by the J2 Renderer when NetBox mode is ticked. Variables are shaped like NetBox REST API data.
const j2NetboxSample = {
  template: "{#- NetBox sample. Variables are shaped like NetBox REST API data (dcim + ipam). -#}\nhostname {{ device.name }}\n! {{ device.device_type.manufacturer.name }} {{ device.device_type.model }} | site {{ device.site.name }} | role {{ device.role.name }} | {{ device.status.label }}\n!\n{%- for vlan in vlans %}\nvlan {{ vlan.vid }}\n   name {{ vlan.name }}\n{%- endfor %}\n!\n{%- for intf in interfaces %}\ninterface {{ intf.name }}\n{%- if intf.description %}\n   description {{ intf.description }}\n{%- endif %}\n{%- if intf.mode and intf.mode.value == \"access\" %}\n   switchport access vlan {{ intf.untagged_vlan.vid }}\n{%- endif %}\n{%- for ip in ip_addresses if ip.assigned_object.name == intf.name %}\n   ip address {{ ip.address }}\n{%- endfor %}\n   {{ \"no shutdown\" if intf.enabled else \"shutdown\" }}\n!\n{%- endfor %}\n{%- for p in prefixes %}\nip prefix-list {{ device.site.slug | upper }}-LOCAL seq {{ loop.index * 10 }} permit {{ p.prefix }}\n{%- endfor %}\n!\nsnmp-server location {{ device.custom_fields.snmp_location | default(\"unknown\", true) }}\n",
  json: "{\n  \"device\": {\n    \"id\": 101,\n    \"name\": \"lab-leaf-01\",\n    \"device_type\": {\n      \"manufacturer\": {\n        \"name\": \"Arista\",\n        \"slug\": \"arista\"\n      },\n      \"model\": \"DCS-7050SX3-48YC8\"\n    },\n    \"role\": {\n      \"name\": \"Leaf\",\n      \"slug\": \"leaf\"\n    },\n    \"platform\": {\n      \"name\": \"EOS\",\n      \"slug\": \"eos\"\n    },\n    \"site\": {\n      \"name\": \"Lab DC1\",\n      \"slug\": \"lab-dc1\"\n    },\n    \"status\": {\n      \"value\": \"active\",\n      \"label\": \"Active\"\n    },\n    \"primary_ip4\": {\n      \"address\": \"10.255.0.11/32\"\n    },\n    \"custom_fields\": {\n      \"snmp_location\": \"Lab DC1, Row A, Rack 3\"\n    }\n  },\n  \"interfaces\": [\n    {\n      \"name\": \"Ethernet1\",\n      \"description\": \"uplink to lab-spine-01\",\n      \"enabled\": true,\n      \"mode\": null\n    },\n    {\n      \"name\": \"Ethernet2\",\n      \"description\": \"server01\",\n      \"enabled\": true,\n      \"mode\": {\n        \"value\": \"access\",\n        \"label\": \"Access\"\n      },\n      \"untagged_vlan\": {\n        \"vid\": 110,\n        \"name\": \"SERVERS\"\n      }\n    },\n    {\n      \"name\": \"Ethernet3\",\n      \"description\": \"\",\n      \"enabled\": false,\n      \"mode\": null\n    },\n    {\n      \"name\": \"Loopback0\",\n      \"description\": \"router-id\",\n      \"enabled\": true,\n      \"mode\": null\n    }\n  ],\n  \"ip_addresses\": [\n    {\n      \"address\": \"10.0.1.1/31\",\n      \"assigned_object\": {\n        \"name\": \"Ethernet1\"\n      }\n    },\n    {\n      \"address\": \"10.255.0.11/32\",\n      \"assigned_object\": {\n        \"name\": \"Loopback0\"\n      }\n    }\n  ],\n  \"vlans\": [\n    {\n      \"vid\": 110,\n      \"name\": \"SERVERS\"\n    },\n    {\n      \"vid\": 120,\n      \"name\": \"STORAGE\"\n    }\n  ],\n  \"prefixes\": [\n    {\n      \"prefix\": \"10.110.0.0/24\",\n      \"vlan\": {\n        \"vid\": 110\n      },\n      \"status\": {\n        \"value\": \"active\"\n      }\n    },\n    {\n      \"prefix\": \"10.120.0.0/24\",\n      \"vlan\": {\n        \"vid\": 120\n      },\n      \"status\": {\n        \"value\": \"active\"\n      }\n    }\n  ]\n}",
  yaml: "# Shaped like NetBox REST API objects: /api/dcim/devices/, /api/dcim/interfaces/,\n# /api/ipam/ip-addresses/, /api/ipam/vlans/, /api/ipam/prefixes/ (trimmed to useful fields).\ndevice:\n  id: 101\n  name: lab-leaf-01\n  device_type:\n    manufacturer: {name: Arista, slug: arista}\n    model: DCS-7050SX3-48YC8\n  role: {name: Leaf, slug: leaf}\n  platform: {name: EOS, slug: eos}\n  site: {name: Lab DC1, slug: lab-dc1}\n  status: {value: active, label: Active}\n  primary_ip4: {address: 10.255.0.11/32}\n  custom_fields:\n    snmp_location: Lab DC1, Row A, Rack 3\ninterfaces:\n  - name: Ethernet1\n    description: uplink to lab-spine-01\n    enabled: true\n    mode: null\n  - name: Ethernet2\n    description: server01\n    enabled: true\n    mode: {value: access, label: Access}\n    untagged_vlan: {vid: 110, name: SERVERS}\n  - name: Ethernet3\n    description: \"\"\n    enabled: false\n    mode: null\n  - name: Loopback0\n    description: router-id\n    enabled: true\n    mode: null\nip_addresses:\n  - address: 10.0.1.1/31\n    assigned_object: {name: Ethernet1}\n  - address: 10.255.0.11/32\n    assigned_object: {name: Loopback0}\nvlans:\n  - {vid: 110, name: SERVERS}\n  - {vid: 120, name: STORAGE}\nprefixes:\n  - {prefix: 10.110.0.0/24, vlan: {vid: 110}, status: {value: active}}\n  - {prefix: 10.120.0.0/24, vlan: {vid: 120}, status: {value: active}}\n"
};
const dataModelFallback = {
  sample: {
    json: '{\n  "hostname": "R1-EDGE",\n  "site": "NYC1",\n  "asn": 65001,\n  "interfaces": [\n    {\n      "name": "GigabitEthernet0/0",\n      "enabled": true,\n      "ip": "10.10.10.1/30"\n    },\n    {\n      "name": "GigabitEthernet0/1",\n      "enabled": true,\n      "ip": "172.16.20.1/24"\n    }\n  ]\n}',
    yaml: 'hostname: R1-EDGE\nsite: NYC1\nasn: 65001\ninterfaces:\n  - name: GigabitEthernet0/0\n    enabled: true\n    ip: 10.10.10.1/30\n  - name: GigabitEthernet0/1\n    enabled: true\n    ip: 172.16.20.1/24\n'
  },
  validate: {
    json: '{\n  "hostname": "R2-EDGE",\n  "site": "SFO1",\n  "asn": 65010,\n  "interfaces": [\n    {\n      "name": "GigabitEthernet0/0",\n      "enabled": true,\n      "ip": "10.20.30.1/30"\n    }\n  ]\n}',
    yaml: 'hostname: R2-EDGE\nsite: SFO1\nasn: 65010\ninterfaces:\n  - name: GigabitEthernet0/0\n    enabled: true\n    ip: 10.20.30.1/30\n'
  }
};

function currentTimeStamp() {
  return new Date().toLocaleTimeString([], { hour12: false });
}

function appendTerminalEntry(outputEl, message, options = {}) {
  const { spacer = false } = options;
  const prefix = `[${currentTimeStamp()}] `;
  const normalized = String(message ?? '').replace(/\r\n/g, '\n').replace(/\n$/, '');
  const lines = normalized ? normalized.split('\n') : [''];
  if (spacer && outputEl.textContent) {
    outputEl.textContent += '\n';
  }
  lines.forEach((line, index) => {
    const pad = index === 0 ? prefix : ' '.repeat(prefix.length);
    outputEl.textContent += `${pad}${line}\n`;
  });
  outputEl.scrollTop = outputEl.scrollHeight;
}

function parseVarTypesFromSessionSummary(summary) {
  const parsed = { var1: '?', var2: '?', var3: '?' };
  const text = String(summary || '');
  const regex = /var([123]) type:\s*([^\n]+)/g;
  let match = regex.exec(text);
  while (match) {
    parsed[`var${match[1]}`] = match[2].trim();
    match = regex.exec(text);
  }
  return parsed;
}

function renderPythonSessionStatus(statusEl) {
  const state = pythonPlaygroundSessionId ? `active (${pythonPlaygroundSessionId.slice(0, 8)}...)` : 'inactive';
  statusEl.textContent = `Session: ${state} | var1:${pythonPlaygroundVarTypes.var1} var2:${pythonPlaygroundVarTypes.var2} var3:${pythonPlaygroundVarTypes.var3} | Shortcuts: Enter run prompt, Ctrl+Enter run Code Pad, Ctrl+L clear output`;
}

function isEnterPress(event) {
  return event.key === 'Enter' || event.code === 'Enter' || event.code === 'NumpadEnter';
}

function isCodePadRunShortcut(event) {
  return isEnterPress(event) && (event.ctrlKey || event.metaKey);
}

async function execPythonPlayground(tool, inputs, outputEl, codeText, options = {}) {
  const focusPrompt = () => {
    if (inputs.__py_command) {
      inputs.__py_command.focus();
      inputs.__py_command.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };
  const { prefix = '>>> ', clearPrompt = false } = options;
  const code = (codeText || '').trim();

  if (!pythonPlaygroundSessionId) {
    appendTerminalEntry(outputEl, '[error] No active session. Click Start Session first.', { spacer: true });
    focusPrompt();
    return;
  }
  if (!code) {
    appendTerminalEntry(outputEl, '[error] Code input is empty.', { spacer: true });
    focusPrompt();
    return;
  }

  const payload = {
    action: 'exec',
    session_id: pythonPlaygroundSessionId,
    function_code: codeText
  };

  appendTerminalEntry(outputEl, `${prefix}${code}`, { spacer: true });
  appendTerminalEntry(outputEl, '... running ...');

  try {
    const res = await fetch(tool.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.ok) {
      appendTerminalEntry(outputEl, `[error] ${data.error}`);
    } else {
      const out = data.result || {};
      if (out.stdout) appendTerminalEntry(outputEl, out.stdout);
      if (Object.prototype.hasOwnProperty.call(out, 'result')) {
        appendTerminalEntry(outputEl, `[result] ${pretty(out.result)}`);
      }
      if (out.stderr) appendTerminalEntry(outputEl, `[stderr]\n${out.stderr}`);
    }
    if (clearPrompt && inputs.__py_command) {
      inputs.__py_command.value = '';
    }
    focusPrompt();
  } catch (err) {
    appendTerminalEntry(outputEl, `[error] Request failed: ${err}`);
    focusPrompt();
  }
}

function pretty(value) {
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function highlightRegexPattern(pattern) {
  const lookaroundPrefixes = ['(?<=', '(?<!', '(?=', '(?!', '(?:', '(?P<', '(?<'];
  let i = 0;
  let html = '';

  while (i < pattern.length) {
    const char = pattern[i];
    const rest = pattern.slice(i);

    if (char === '\\') {
      const token = pattern.slice(i, Math.min(i + 2, pattern.length));
      html += `<span class="rgx-esc">${escapeHtml(token)}</span>`;
      i += token.length;
      continue;
    }

    if (char === '[') {
      let j = i + 1;
      while (j < pattern.length) {
        if (pattern[j] === '\\') {
          j += 2;
          continue;
        }
        if (pattern[j] === ']') {
          j += 1;
          break;
        }
        j += 1;
      }
      const token = pattern.slice(i, j);
      html += `<span class="rgx-class">${escapeHtml(token)}</span>`;
      i = j;
      continue;
    }

    const quantifier = rest.match(/^\{\d+(,\d*)?\}\??/);
    if (quantifier) {
      html += `<span class="rgx-quant">${escapeHtml(quantifier[0])}</span>`;
      i += quantifier[0].length;
      continue;
    }

    if (char === '(') {
      const prefix = lookaroundPrefixes.find((candidate) => rest.startsWith(candidate));
      if (prefix) {
        html += `<span class="rgx-group">${escapeHtml(prefix)}</span>`;
        i += prefix.length;
      } else {
        html += '<span class="rgx-group">(</span>';
        i += 1;
      }
      continue;
    }

    if (char === ')') {
      html += '<span class="rgx-group">)</span>';
      i += 1;
      continue;
    }

    if (char === '^' || char === '$') {
      html += `<span class="rgx-anchor">${char}</span>`;
      i += 1;
      continue;
    }

    if (char === '*' || char === '+' || char === '?') {
      html += `<span class="rgx-quant">${char}</span>`;
      i += 1;
      continue;
    }

    if (char === '|') {
      html += '<span class="rgx-op">|</span>';
      i += 1;
      continue;
    }

    if (char === '.') {
      html += '<span class="rgx-op">.</span>';
      i += 1;
      continue;
    }

    html += escapeHtml(char);
    i += 1;
  }

  return html;
}

function createRegexCheatsheet() {
  const wrap = document.createElement('details');
  wrap.className = 'regex-cheatsheet';

  const summary = document.createElement('summary');
  summary.textContent = 'Regex quick help / cheatsheet';
  wrap.appendChild(summary);

  const content = document.createElement('div');
  content.className = 'regex-cheatsheet-content';
  content.innerHTML = `
    <div class="regex-cheatsheet-table-wrap">
      <table class="regex-cheatsheet-table">
        <thead>
          <tr>
            <th>Pattern</th>
            <th>Meaning</th>
            <th>Example</th>
          </tr>
        </thead>
        <tbody>
          <tr class="section-row"><td colspan="3">Character Classes</td></tr>
          <tr><td><code>\\d</code></td><td>Digit</td><td><code>VLAN\\d+</code></td></tr>
          <tr><td><code>\\w</code></td><td>Word character (a-z, A-Z, 0-9, _)</td><td><code>\\w+_ID</code></td></tr>
          <tr><td><code>\\s</code></td><td>Whitespace</td><td><code>ip\\s+address</code></td></tr>
          <tr><td><code>[A-Z0-9_]</code></td><td>Custom class</td><td><code>HOST_[A-Z0-9_]+</code></td></tr>
          <tr><td><code>[^ ]</code></td><td>Negated class (not a space)</td><td><code>[^\\s]+</code></td></tr>

          <tr class="section-row"><td colspan="3">Anchors and Boundaries</td></tr>
          <tr><td><code>^</code></td><td>Start of line</td><td><code>^interface</code></td></tr>
          <tr><td><code>$</code></td><td>End of line</td><td><code>up$</code></td></tr>
          <tr><td><code>\\b</code></td><td>Word boundary</td><td><code>\\bip\\b</code></td></tr>

          <tr class="section-row"><td colspan="3">Quantifiers</td></tr>
          <tr><td><code>*</code></td><td>0 or more</td><td><code>\\d*</code></td></tr>
          <tr><td><code>+</code></td><td>1 or more</td><td><code>\\d+</code></td></tr>
          <tr><td><code>?</code></td><td>0 or 1 (or lazy modifier)</td><td><code>\\w+?</code></td></tr>
          <tr><td><code>{m,n}</code></td><td>Between m and n</td><td><code>\\d{1,3}</code></td></tr>

          <tr class="section-row"><td colspan="3">Groups and Logic</td></tr>
          <tr><td><code>(...)</code></td><td>Capturing group</td><td><code>(GigabitEthernet\\d+/\\d+)</code></td></tr>
          <tr><td><code>(?:...)</code></td><td>Non-capturing group</td><td><code>(?:up|down)</code></td></tr>
          <tr><td><code>|</code></td><td>OR alternation</td><td><code>up|down</code></td></tr>
          <tr><td><code>.</code></td><td>Any character</td><td><code>desc.+</code></td></tr>

          <tr class="section-row"><td colspan="3">Lookarounds and Flags</td></tr>
          <tr><td><code>(?=...)</code></td><td>Positive lookahead</td><td><code>\\d+(?=Mbps)</code></td></tr>
          <tr><td><code>(?!...)</code></td><td>Negative lookahead</td><td><code>interface(?!\\s+Loopback)</code></td></tr>
          <tr><td><code>(?&lt;=...)</code></td><td>Positive lookbehind</td><td><code>(?&lt;=ip\\saddress\\s)\\S+</code></td></tr>
          <tr><td><code>(?&lt;!...)</code></td><td>Negative lookbehind</td><td><code>(?&lt;!admin\\s)down</code></td></tr>
          <tr><td><code>(?i) (?m) (?s)</code></td><td>Ignore case, multiline, dotall</td><td><code>(?mi)^interface</code></td></tr>
          <tr><td><code>\\.</code> <code>\\(</code></td><td>Escape special chars literally</td><td><code>10\\.10\\.10\\.1</code></td></tr>
        </tbody>
      </table>
    </div>
    <p class="regex-tip">Tip: for network parsing, anchor blocks with <code>^interface</code> and make inner matches lazy with <code>.+?</code> when boundaries repeat.</p>
  `;
  wrap.appendChild(content);
  return wrap;
}

function parseInlineRegexFlags(pattern) {
  const inline = pattern.match(/^\(\?([a-zA-Z]+)\)/);
  if (!inline) {
    return { source: pattern, flags: '' };
  }

  const supported = new Set(['i', 'm', 's', 'u', 'y', 'g']);
  const parsedFlags = Array.from(inline[1]).filter((flag) => supported.has(flag)).join('');
  return {
    source: pattern.slice(inline[0].length),
    flags: parsedFlags
  };
}

const regexIndicesSupported = (() => {
  try {
    return new RegExp('.', 'd').hasIndices === true;
  } catch (err) {
    return false;
  }
})();

function buildMatchInnerHtml(text, matchStart, matchEnd, groups, matchId) {
  const innerGroups = (groups || [])
    .filter((g) => Number.isInteger(g.start) && Number.isInteger(g.end) && g.start >= matchStart && g.end <= matchEnd && g.end > g.start)
    .sort((a, b) => a.start - b.start || b.end - a.end);

  const nonOverlapping = [];
  let cursor = matchStart;
  innerGroups.forEach((g) => {
    if (g.start < cursor) return;
    nonOverlapping.push(g);
    cursor = g.end;
  });

  let html = '';
  cursor = matchStart;
  nonOverlapping.forEach((g) => {
    html += escapeHtml(text.slice(cursor, g.start));
    const groupClass = `rgx-group-hit rgx-group-p${(g.group - 1) % 10}`;
    const part = escapeHtml(text.slice(g.start, g.end)) || ' ';
    html += `<span class="${groupClass}" data-mid="${matchId}" data-gid="${g.group}">${part}</span>`;
    cursor = g.end;
  });
  html += escapeHtml(text.slice(cursor, matchEnd));
  return html;
}

function buildRegexTextHighlights(text, rawPattern) {
  if (!rawPattern.trim()) {
    return { ok: true, html: escapeHtml(text), status: 'Enter a pattern to preview matches.', meta: [] };
  }

  const parsed = parseInlineRegexFlags(rawPattern);
  const flags = Array.from(new Set(`${parsed.flags}g${regexIndicesSupported ? 'd' : ''}`)).join('');
  let regex;

  try {
    regex = new RegExp(parsed.source, flags);
  } catch (err) {
    return { ok: false, html: escapeHtml(text), status: `Pattern error: ${err.message}`, meta: [] };
  }

  const segments = [];
  const matches = [];
  let nextStart = 0;
  let hit;
  while ((hit = regex.exec(text)) !== null) {
    const indexRange = regexIndicesSupported && hit.indices && hit.indices[0] ? hit.indices[0] : null;
    const start = indexRange ? indexRange[0] : hit.index;
    const end = indexRange ? indexRange[1] : start + hit[0].length;
    if (end < start) {
      break;
    }
    const groups = [];
    for (let i = 1; i < hit.length; i += 1) {
      const groupValue = hit[i];
      let gStart = null;
      let gEnd = null;
      if (regexIndicesSupported && hit.indices && hit.indices[i]) {
        gStart = hit.indices[i][0];
        gEnd = hit.indices[i][1];
      }
      groups.push({
        group: i,
        value: groupValue,
        start: Number.isInteger(gStart) ? gStart : null,
        end: Number.isInteger(gEnd) ? gEnd : null
      });
    }
    matches.push({
      id: matches.length,
      start,
      end,
      value: hit[0],
      groups
    });
    if (hit[0] === '') {
      regex.lastIndex += 1;
      if (regex.lastIndex > text.length) break;
    }
  }

  if (matches.length === 0) {
    return { ok: true, html: escapeHtml(text), status: 'No matches yet.', meta: [] };
  }

  let groupCount = 0;
  matches.forEach((matchInfo, idx) => {
    segments.push(escapeHtml(text.slice(nextStart, matchInfo.start)));
    const matchClass = `rgx-hit rgx-hit-p${idx % 10}`;
    const inner = buildMatchInnerHtml(text, matchInfo.start, matchInfo.end, matchInfo.groups, matchInfo.id);
    segments.push(`<span class="${matchClass}" data-mid="${matchInfo.id}">${inner || ' '}</span>`);
    nextStart = matchInfo.end;
    groupCount += matchInfo.groups.filter((g) => g.value !== undefined && g.value !== null).length;
  });
  segments.push(escapeHtml(text.slice(nextStart)));

  return {
    ok: true,
    html: segments.join(''),
    status: `${matches.length} match${matches.length === 1 ? '' : 'es'} and ${groupCount} group${groupCount === 1 ? '' : 's'} highlighted in real-time.`,
    meta: matches
  };
}

const toolCheatsheetRows = {
  xpath: [
    ['Path Basics', '//node', 'Search anywhere in document', '//interface/name'],
    ['Path Basics', '/root/node', 'Absolute path from root', '/rpc-reply/data/interfaces'],
    ['Filters', "[name='Lo0']", 'Predicate filter by value', "//interface[name='Loopback0']"],
    ['Filters', '[@attr="x"]', 'Filter by attribute', '//entry[@name="mgmt"]'],
    ['Functions', 'text()', 'Extract text node', '//name/text()'],
    ['Functions', 'contains(a,b)', 'Substring check', "//description[contains(.,'WAN')]"],
    ['Functions', 'starts-with(a,b)', 'Prefix match', "//name[starts-with(.,'Gig')]"],
    ['Indexes', '[1]', 'First element (XPath is 1-based)', '//interface[1]']
  ],
  jmespath: [
    ['Selections', 'interfaces[*].name', 'Project list field', 'interfaces[*].name'],
    ['Filters', '[?enabled==`true`]', 'Filter array values', 'interfaces[?enabled==`true`]'],
    ['Objects', '{n:name,e:enabled}', 'Create mapped object', 'interfaces[].{n:name,e:enabled}'],
    ['Pipe', 'expr | expr', 'Chain expressions', 'interfaces | length(@)'],
    ['Functions', 'length(@)', 'Count items/characters', 'length(interfaces)'],
    ['Functions', 'sort_by(arr,&key)', 'Sort by key', 'sort_by(interfaces,&name)'],
    ['Contains', 'contains(arr,x)', 'Membership test', "contains(tags, 'edge')"],
    ['Literals', '`123` / `true`', 'Literal numeric/bool', 'errors > `0`']
  ],
  'json-schema': [
    ['Core', '"type"', 'Defines allowed type', '"type": "object"'],
    ['Core', '"properties"', 'Defines object keys', '"properties": { ... }'],
    ['Core', '"required"', 'Mandatory fields', '"required": ["hostname"]'],
    ['Arrays', '"items"', 'Schema for each array item', '"items": { "type":"object" }'],
    ['Validation', '"enum"', 'Allowed values only', '"enum": ["edge","core"]'],
    ['Validation', '"pattern"', 'Regex validation for strings', '"pattern":"^\\\\d+\\\\.\\\\d+..."'],
    ['Validation', '"minLength"/"maxLength"', 'String size constraints', '"minLength": 3'],
    ['Control', '"additionalProperties"', 'Allow or block unknown keys', '"additionalProperties": false']
  ],
  textfsm: [
    ['Declarations', 'Value NAME (regex)', 'Capture field declaration', 'Value IFACE (\\S+)'],
    ['States', 'Start', 'Initial parsing state', 'Start'],
    ['Records', '-> Record', 'Emit parsed row', '^... -> Record'],
    ['Variables', '${NAME}', 'Reference captured value', '^${IFACE}\\s+${IP}'],
    ['Patterns', '^', 'Start-of-line anchor', '^Interface\\s+'],
    ['Actions', '-> Continue', 'Stay in current state', '^\\s+ -> Continue'],
    ['Actions', '-> Clear', 'Clear values before continue', '^! -> Clear'],
    ['Flow', '-> StateName', 'Transition to another state', '^foo -> NextState'],
    ['Templates', 'NTC library', 'Reference templates by platform/command and paste into Template field', 'https://github.com/networktocode/ntc-templates/tree/master/ntc_templates/templates']
  ],
  ttp: [
    ['Groups', '<group name="x">', 'Define capture section', '<group name="interfaces">'],
    ['Variables', '{{ var }}', 'Capture value token', 'interface {{ name }}'],
    ['Filters', '{{ desc | ORPHRASE }}', 'Apply built-in extractor', '{{ ip | PHRASE }}'],
    ['Hierarchy', '<group name="a.b">', 'Nested output keys', '<group name="ifaces.core">'],
    ['Literals', 'plain text', 'Must match text literally', 'ip address'],
    ['End', '</group>', 'Close group section', '</group>']
  ],
  jinja2: [
    ["Output", "{{ var }}", "Print a variable", "{{ hostname }}"],
    ["Output", "obj.key / obj[\"key\"]", "Dict key or attribute; brackets for keys with dashes or spaces", "{{ device[\"serial-number\"] }}"],
    ["Output", "list[0] / list[-1]", "Index into a list; negative counts from the end", "{{ ntp_servers[-1] }}"],
    ["Output", "a ~ b", "Join into one string (converts numbers)", "{{ \"Vlan\" ~ vlans[0].id }}"],
    ["Output", "x if cond else y", "Inline if", "{{ \"no shutdown\" if interfaces[0].enabled else \"shutdown\" }}"],
    ["Comment", "{# ... #}", "Comment; never appears in the output", "{# TODO: add QoS #}"],
    ["Loop", "{% for x in xs %}...{% endfor %}", "Loop over a list", "{% for i in interfaces %}interface {{ i.name }}\n{% endfor %}"],
    ["Loop", "{% for x in xs if cond %}", "Loop over matching items only", "{% for i in interfaces if i.enabled %}{{ i.name }} {% endfor %}"],
    ["Loop", "{% for ... %}{% else %}", "else runs when the list is empty", "{% for s in [] %}ntp server {{ s }}{% else %}! no NTP{% endfor %}"],
    ["Loop", "{% for k, v in d.items() %}", "Loop over a dict", "{% for name, vid in vlan_map.items() %}vlan {{ vid }} name {{ name }}\n{% endfor %}"],
    ["Loop", "loop.index / loop.index0", "Position, 1-based / 0-based", "{% for p in prefixes %}seq {{ loop.index * 10 }} permit {{ p }}\n{% endfor %}"],
    ["Loop", "loop.first / loop.last / loop.length", "First / last item, item count (e.g. JSON commas)", "[{% for s in ntp_servers %}\"{{ s }}\"{{ \",\" if not loop.last }}{% endfor %}]"],
    ["Condition", "{% if %}{% elif %}{% else %}{% endif %}", "Conditional block", "{% if interfaces[1].mode == \"access\" %}access{% elif interfaces[1].mode == \"trunk\" %}trunk{% else %}routed{% endif %}"],
    ["Tests", "x is defined / is not defined", "Variable exists?", "{% if snmp is defined %}snmp-server community {{ snmp.community }}{% endif %}"],
    ["Tests", "x is none", "Value is null / None", "{{ \"no IP\" if interfaces[2].ip is none }}"],
    ["Tests", "x in list / string / dict", "Membership", "{{ \"yes\" if \"10.0.0.1\" in ntp_servers }}"],
    ["Variables", "{% set x = value %}", "Assign a variable", "{% set mgmt_vlan = 99 %}vlan {{ mgmt_vlan }}"],
    ["Variables", "namespace(...)", "Keep a value changed inside a loop (a plain set inside a loop is lost)", "{% set ns = namespace(up=0) %}{% for i in interfaces if i.enabled %}{% set ns.up = ns.up + 1 %}{% endfor %}{{ ns.up }} up"],
    ["Variables", "{% set x %}...{% endset %}", "Capture rendered text into a variable", "{% set banner %}Managed by automation{% endset %}{{ banner | upper }}"],
    ["Text", "v | default(\"x\", true)", "Fallback when undefined; with true also when empty or None", "{{ interfaces[2].description | default(\"unused\", true) }}"],
    ["Text", "upper / lower / title / trim", "Change case, strip spaces", "{{ hostname | upper }}"],
    ["Text", "replace(\"a\", \"b\")", "Replace text", "{{ interfaces[0].name | replace(\"GigabitEthernet\", \"Gi\") }}"],
    ["Text", "x.split(\"/\")[0]", "Python string methods work (split, startswith, ...)", "{{ interfaces[0].ip.split(\"/\")[0] }}"],
    ["Text", "\"%-12s %s\" | format(a, b)", "printf-style formatting, e.g. padded columns", "{{ \"%-22s %s\" | format(interfaces[0].name, interfaces[0].description) }}"],
    ["Text", "indent(n) / indent(n, first=true)", "Indent every line after the first (or all lines)", "{{ \"a\\nb\" | indent(2, first=true) }}"],
    ["Lists", "join(\", \")", "List to string", "{{ ntp_servers | join(\", \") }}"],
    ["Lists", "length / first / last", "Count, first / last item", "{{ interfaces | length }}"],
    ["Lists", "selectattr / rejectattr", "Keep / drop items by attribute test", "{{ interfaces | selectattr(\"enabled\") | map(attribute=\"name\") | list }}"],
    ["Lists", "selectattr(\"k\", \"eq\", v)", "Keep items where an attribute equals a value", "{{ interfaces | selectattr(\"mode\", \"eq\", \"access\") | map(attribute=\"name\") | join(\",\") }}"],
    ["Lists", "map(attribute=\"k\")", "Pick one attribute from every item", "{{ vlans | map(attribute=\"id\") | join(\",\") }}"],
    ["Lists", "sort(attribute=\"k\") / unique", "Sort, remove duplicates", "{{ vlans | sort(attribute=\"id\", reverse=true) | map(attribute=\"name\") | join(\" \") }}"],
    ["Lists", "groupby(\"k\")", "Group items by an attribute", "{% for mode, items in interfaces | groupby(\"mode\") %}{{ mode }}: {{ items | length }}\n{% endfor %}"],
    ["Lists", "sum(attribute=\"k\")", "Add up a numeric attribute", "{{ interfaces | sum(attribute=\"speed\") }}"],
    ["Convert", "int / float / string / list", "Change type", "{{ \"100\" | int + 1 }}"],
    ["Convert", "tojson", "Value as JSON (quotes, lists, null); escapes ' as \\u0027", "{{ ntp_servers | tojson }}"],
    ["Macro", "{% macro f(a) %}...{% endmacro %}", "Reusable block; call it like a function", "{% macro desc(t) %}description {{ t | upper }}{% endmacro %}{{ desc(\"uplink\") }}"],
    ["Whitespace", "{%- ... -%} / {{- ... -}}", "Remove whitespace and newlines before / after the tag", "{%- for x in y -%}"],
    ["Whitespace", "trim_blocks", "Normal mode drops the newline after a block tag; NetBox mode keeps it", "{% if x %}\\n...{% endif %}"],
    ["Raw", "{% raw %}...{% endraw %}", "Output Jinja syntax literally", "{% raw %}{{ not rendered }}{% endraw %}"],
    ["NetBox", "\"NAME\" | env", "Environment variable, only if allowed by JINJA_ENVIRONMENT_PARAMS (None here)", "{{ \"SITE_CODE\" | env }}"],
    ["NetBox", "device / virtualmachine", "Set by NetBox when rendering a device / VM config: the real object, not a dict", "{{ device.name }}"],
    ["NetBox", "ipam.Prefix.objects.filter(...)", "Database query: works only inside NetBox. Never name your own variables ipam, dcim, ...", "{% for p in ipam.Prefix.objects.filter(status=\"active\") %}"]
  ],
  'python-playground': [
    ['Flow', 'for / if / def', 'Core control structures', 'for i in value["interfaces"]'],
    ['Collections', 'list/dict comprehensions', 'Compact transforms', '[i["name"] for i in ...]'],
    ['Debug', 'print(...)', 'Inspect intermediate values', 'print(type(value))'],
    ['Safety', '.get("key")', 'Avoid KeyError on optional keys', 'value.get("hostname")'],
    ['Sorting', 'sorted(data,key=...)', 'Deterministic ordering', 'sorted(intfs, key=lambda x: x["name"])'],
    ['JSON', 'json.dumps(x,indent=2)', 'Pretty print objects', 'json.dumps(value, indent=2)']
  ]
};

function highlightByRules(text, rules) {
  let i = 0;
  let html = '';
  while (i < text.length) {
    const rest = text.slice(i);
    let found = false;
    for (const rule of rules) {
      const match = rest.match(rule.regex);
      if (!match) continue;
      html += `<span class="${rule.className}">${escapeHtml(match[0])}</span>`;
      i += match[0].length;
      found = true;
      break;
    }
    if (!found) {
      html += escapeHtml(text[i]);
      i += 1;
    }
  }
  return html;
}

function highlightJsonLike(text, schemaMode = false) {
  const schemaKeys = new Set(['$schema', 'type', 'properties', 'required', 'items', 'enum', 'pattern', 'additionalProperties', 'minLength', 'maxLength', 'minimum', 'maximum']);
  let i = 0;
  let html = '';
  while (i < text.length) {
    const rest = text.slice(i);
    const stringMatch = rest.match(/^"(?:\\.|[^"\\])*"/);
    if (stringMatch) {
      const token = stringMatch[0];
      let className = 'syn-string';
      const keyName = token.slice(1, -1);
      const after = text.slice(i + token.length).match(/^\s*:/);
      if (schemaMode && after && schemaKeys.has(keyName)) className = 'syn-keyword';
      html += `<span class="${className}">${escapeHtml(token)}</span>`;
      i += token.length;
      continue;
    }
    const numberMatch = rest.match(/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/);
    if (numberMatch) {
      html += `<span class="syn-number">${escapeHtml(numberMatch[0])}</span>`;
      i += numberMatch[0].length;
      continue;
    }
    const boolNull = rest.match(/^(true|false|null)\b/);
    if (boolNull) {
      html += `<span class="syn-keyword">${boolNull[1]}</span>`;
      i += boolNull[1].length;
      continue;
    }
    const punct = rest.match(/^[\[\]{}:,]/);
    if (punct) {
      html += `<span class="syn-operator">${punct[0]}</span>`;
      i += 1;
      continue;
    }
    html += escapeHtml(text[i]);
    i += 1;
  }
  return html;
}

function getSyntaxHighlightHtml(mode, text) {
  if (mode === 'regex') return highlightRegexPattern(text);
  if (mode === 'json-schema') return highlightJsonLike(text, true);
  if (mode === 'json') return highlightJsonLike(text, false);

  const rulesByMode = {
    xpath: [
      { regex: /^"(?:\\.|[^"\\])*"|^'(?:\\.|[^'\\])*'/, className: 'syn-string' },
      { regex: /^\/{1,2}|^\.\.|^::|^\*|^@|^\[|^\]|^\(|^\)|^\|/, className: 'syn-operator' },
      { regex: /^(?:text|contains|starts-with|name|normalize-space|count)(?=\()/, className: 'syn-keyword' },
      { regex: /^-?\d+(?:\.\d+)?/, className: 'syn-number' },
      { regex: /^[a-zA-Z_][\w:-]*/, className: 'syn-name' }
    ],
    jmespath: [
      { regex: /^"(?:\\.|[^"\\])*"|^'(?:\\.|[^'\\])*'|^`[^`]*`/, className: 'syn-string' },
      { regex: /^(?:\[\?\]|\[\*\]|\[\]|\{|\}|\[|\]|\(|\)|\|\||\||&&|==|!=|>=|<=|>|<|:|,|\.)/, className: 'syn-operator' },
      { regex: /^(?:length|sort_by|contains|starts_with|to_string|to_number)(?=\()/, className: 'syn-keyword' },
      { regex: /^-?\d+(?:\.\d+)?/, className: 'syn-number' },
      { regex: /^[a-zA-Z_][\w-]*/, className: 'syn-name' }
    ],
    textfsm: [
      { regex: /^\$\{[A-Z0-9_]+\}/, className: 'syn-variable' },
      { regex: /^(?:Value|Start|End|EOF|Record|Clear|Continue)\b/, className: 'syn-keyword' },
      { regex: /^->\s*\w+/, className: 'syn-keyword' },
      { regex: /^(?:\^|\$|\\[wsdS]|[(){}|+*?])/, className: 'syn-operator' },
      { regex: /^"(?:\\.|[^"\\])*"|^'(?:\\.|[^'\\])*'/, className: 'syn-string' },
      { regex: /^[A-Z_][A-Z0-9_]*/, className: 'syn-name' }
    ],
    ttp: [
      { regex: /^<\/?group(?:\s+[^>]*)?>/, className: 'syn-keyword' },
      { regex: /^\{\{[^}]+\}\}/, className: 'syn-variable' },
      { regex: /^\|/, className: 'syn-operator' },
      { regex: /^"(?:\\.|[^"\\])*"|^'(?:\\.|[^'\\])*'/, className: 'syn-string' }
    ],
    jinja2: [
      { regex: /^\{#[\s\S]*?#\}/, className: 'syn-comment' },
      { regex: /^\{\%[\s\S]*?\%\}/, className: 'syn-keyword' },
      { regex: /^\{\{[\s\S]*?\}\}/, className: 'syn-variable' },
      { regex: /^"(?:\\.|[^"\\])*"|^'(?:\\.|[^'\\])*'/, className: 'syn-string' },
      { regex: /^\b(?:for|in|if|else|elif|endif|endfor|set|block|extends|include|macro)\b/, className: 'syn-keyword' },
      { regex: /^\|/, className: 'syn-operator' }
    ],
    python: [
      { regex: /^#.*$/, className: 'syn-comment' },
      { regex: /^"""[\s\S]*?"""|^'''[\s\S]*?'''/, className: 'syn-string' },
      { regex: /^"(?:\\.|[^"\\])*"|^'(?:\\.|[^'\\])*'/, className: 'syn-string' },
      { regex: /^\b(?:def|for|if|elif|else|return|import|from|in|not|and|or|while|try|except|with|as|lambda|True|False|None|class)\b/, className: 'syn-keyword' },
      { regex: /^-?\d+(?:\.\d+)?/, className: 'syn-number' },
      { regex: /^(?:==|!=|>=|<=|\+|-|\*|\/|%|=|:|\(|\)|\[|\]|\{|\}|,|\.)/, className: 'syn-operator' }
    ]
  };
  const rules = rulesByMode[mode];
  return rules ? highlightByRules(text, rules) : escapeHtml(text);
}

function createCodeEditor(field, inputs) {
  const editor = document.createElement('div');
  editor.className = 'live-code-editor';
  editor.dataset.mode = field.mode || 'plain';
  const rows = field.rows || 6;
  const minHeightPx = Math.max(rows * 22, 120);
  editor.style.minHeight = `${minHeightPx}px`;

  const gutter = document.createElement('pre');
  gutter.className = 'live-code-gutter';
  gutter.setAttribute('aria-hidden', 'true');

  const stage = document.createElement('div');
  stage.className = 'live-code-stage';

  const highlightLayer = document.createElement('pre');
  highlightLayer.className = 'live-code-highlight';
  highlightLayer.setAttribute('aria-hidden', 'true');

  const input = document.createElement('textarea');
  input.className = 'live-code-input';
  input.value = field.value || '';
  input.rows = rows;
  input.spellcheck = false;
  input.wrap = 'off';
  highlightLayer.style.minHeight = `${minHeightPx}px`;
  gutter.style.minHeight = `${minHeightPx}px`;

  const syncGutter = () => {
    const lineCount = input.value.split('\n').length;
    let numbers = '';
    for (let i = 1; i <= lineCount; i += 1) {
      numbers += `${i}\n`;
    }
    gutter.textContent = numbers || '1\n';
  };

  const syncHighlight = () => {
    highlightLayer.innerHTML = getSyntaxHighlightHtml(field.mode || 'plain', input.value);
    if (!input.value.endsWith('\n')) {
      highlightLayer.innerHTML += '\n';
    }
    syncGutter();
  };

  input.addEventListener('input', syncHighlight);
  input.addEventListener('scroll', () => {
    highlightLayer.scrollTop = input.scrollTop;
    highlightLayer.scrollLeft = input.scrollLeft;
    gutter.scrollTop = input.scrollTop;
  });
  syncHighlight();

  stage.appendChild(highlightLayer);
  stage.appendChild(input);
  editor.appendChild(gutter);
  editor.appendChild(stage);
  inputs[field.key] = input;
  return editor;
}

function createToolCheatsheet(toolId) {
  const rows = toolCheatsheetRows[toolId];
  if (!rows) return null;

  const wrap = document.createElement('details');
  wrap.className = 'regex-cheatsheet';

  const summary = document.createElement('summary');
  summary.textContent = 'Quick help / cheatsheet';
  wrap.appendChild(summary);

  const content = document.createElement('div');
  content.className = 'regex-cheatsheet-content';
  const body = rows.map((r) => `<tr><td>${escapeHtml(r[0])}</td><td><code>${escapeHtml(r[1])}</code></td><td>${escapeHtml(r[2])}</td><td><code>${escapeHtml(r[3])}</code></td></tr>`).join('');
  content.innerHTML = `
    <div class="regex-cheatsheet-table-wrap">
      <table class="regex-cheatsheet-table tool-cheatsheet-table">
        <thead>
          <tr>
            <th>Group</th>
            <th>Syntax</th>
            <th>Meaning</th>
            <th>Example</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `;
  wrap.appendChild(content);
  return wrap;
}

function initTheme() {
  if (!themeSelect) return;

  const allowedThemes = new Set(['sand', 'solarized', 'light', 'dark']);
  const savedTheme = localStorage.getItem('nat_theme');
  const initialTheme = allowedThemes.has(savedTheme) ? savedTheme : 'sand';
  document.body.dataset.theme = initialTheme;
  themeSelect.value = initialTheme;

  themeSelect.addEventListener('change', () => {
    const selected = themeSelect.value;
    const nextTheme = allowedThemes.has(selected) ? selected : 'sand';
    document.body.dataset.theme = nextTheme;
    localStorage.setItem('nat_theme', nextTheme);
  });
}

function createField(field, inputs) {
  const wrap = document.createElement('div');
  wrap.className = 'field';
  if (field.key) {
    wrap.dataset.key = field.key;
  }

  if (field.type === 'note') {
    const p = document.createElement('p');
    p.className = 'note';
    p.textContent = field.value;
    wrap.appendChild(p);
    return wrap;
  }

  const label = document.createElement('label');
  label.textContent = field.label;
  wrap.appendChild(label);

  let input;
  if (field.type === 'textarea') {
    input = document.createElement('textarea');
    input.value = field.value || '';
  } else if (field.type === 'code-editor') {
    wrap.appendChild(createCodeEditor(field, inputs));
    return wrap;
  } else if (field.type === 'regex-editor') {
    const editor = document.createElement('div');
    editor.className = 'regex-pattern-editor';

    const highlightLayer = document.createElement('pre');
    highlightLayer.className = 'regex-highlight';
    highlightLayer.setAttribute('aria-hidden', 'true');

    input = document.createElement('textarea');
    input.className = 'regex-pattern-input';
    input.value = field.value || '';
    input.spellcheck = false;
    input.rows = 4;
    input.wrap = 'off';

    const syncHighlight = () => {
      highlightLayer.innerHTML = highlightRegexPattern(input.value);
      if (!input.value.endsWith('\n')) {
        highlightLayer.innerHTML += '\n';
      }
    };

    input.addEventListener('input', syncHighlight);
    input.addEventListener('scroll', () => {
      highlightLayer.scrollTop = input.scrollTop;
      highlightLayer.scrollLeft = input.scrollLeft;
    });
    syncHighlight();

    editor.appendChild(highlightLayer);
    editor.appendChild(input);
    wrap.appendChild(editor);
    inputs[field.key] = input;
    return wrap;
  } else if (field.type === 'select') {
    input = document.createElement('select');
    (field.options || []).forEach((opt) => {
      const o = document.createElement('option');
      o.value = opt;
      o.textContent = opt;
      if (opt === field.value) o.selected = true;
      input.appendChild(o);
    });
  } else {
    input = document.createElement('input');
    input.value = field.value || '';
  }

  wrap.appendChild(input);
  inputs[field.key] = input;
  return wrap;
}

function debounce(fn, waitMs) {
  let timer = null;
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), waitMs);
  };
}

function collectPayload(inputs, extras = {}) {
  const payload = {};
  Object.entries(inputs).forEach(([key, el]) => {
    if (key.startsWith('__')) return;
    payload[key] = inputValue(el);
  });
  return { ...payload, ...extras };
}

// Checkboxes send true/false; every other input sends its text value.
function inputValue(el) {
  return el.type === 'checkbox' ? el.checked : el.value;
}

// J2 Renderer: opt-in NetBox mode. Ticking it swaps in the NetBox sample (device + IPAM data) and
// renders the way NetBox does. Unticking it restores the default sample. Edited content is only
// replaced after confirmation. With the box unticked, rendering is unchanged.
function j2SampleVars(inputs, format) {
  return inputs.netbox_mode && inputs.netbox_mode.checked ? j2NetboxSample[format] : j2FallbackVars[format];
}

function attachNetboxControls(tool, inputs, panel) {
  const row = document.createElement('div');
  row.className = 'live-preview-controls netbox-controls';

  const label = document.createElement('label');
  label.className = 'live-preview-toggle';
  label.title = 'Loads a NetBox-style sample (device, interfaces, IPAM) and renders like NetBox 4.7.4: sandboxed, no trim_blocks/lstrip_blocks, missing variables render empty, line numbers in errors.';
  const toggle = document.createElement('input');
  toggle.type = 'checkbox';
  toggle.checked = false;
  const labelText = document.createElement('span');
  labelText.textContent = 'NetBox mode';
  label.appendChild(toggle);
  label.appendChild(labelText);
  inputs.netbox_mode = toggle;

  const hint = document.createElement('span');
  hint.className = 'live-preview-status';
  const setHint = () => {
    hint.textContent = toggle.checked
      ? 'NetBox sample loaded; rendering like NetBox (sandboxed, no whitespace trimming).'
      : 'Off: standard rendering.';
  };
  setHint();

  const defaultTemplate = (tool.fields.find((f) => f.key === 'template') || {}).value || '';
  const knownTemplates = [defaultTemplate, j2NetboxSample.template];
  const knownVars = [j2FallbackVars.json, j2FallbackVars.yaml, j2NetboxSample.json, j2NetboxSample.yaml,
    (tool.fields.find((f) => f.key === 'variables') || {}).value || ''];
  const isPristine = () => {
    const tpl = inputs.template.value;
    const vars = inputs.variables.value;
    return (!tpl.trim() || knownTemplates.includes(tpl)) && (!vars.trim() || knownVars.includes(vars));
  };

  toggle.addEventListener('change', () => {
    setHint();
    if (!isPristine() && !window.confirm('Replace the template and variables with the ' + (toggle.checked ? 'NetBox' : 'default') + ' sample? Your edits will be lost.')) {
      return;
    }
    inputs.template.value = toggle.checked ? j2NetboxSample.template : defaultTemplate;
    inputs.variables.value = j2SampleVars(inputs, inputs.variables_format.value);
    inputs.template.dispatchEvent(new Event('input'));
    inputs.variables.dispatchEvent(new Event('input'));
  });

  row.appendChild(label);
  row.appendChild(hint);
  panel.querySelector('.grid').before(row);
}

const autoPreviewConfigs = {
  xpath: { delayMs: 250, required: ['xml', 'xpath'] },
  jmespath: { delayMs: 250, required: ['data', 'expression'] },
  'json-schema': { delayMs: 650, required: ['schema', 'data'] },
  jinja2: { delayMs: 700, required: ['template'] },
  textfsm: { delayMs: 900, required: ['template', 'text'] },
  ttp: { delayMs: 900, required: ['template', 'data'] },
  regex: { delayMs: 220, required: ['pattern'] }
};

// Show an error as readable text (line breaks kept) instead of a JSON blob.
function showOutput(outputEl, text, isError = false) {
  outputEl.textContent = text;
  outputEl.classList.toggle('is-error', isError);
}

function errorText(data) {
  return data && data.error ? `Error: ${data.error}` : pretty(data);
}

function formatAutoPreviewOutput(toolId, data) {
  if (!data || data.ok !== true) {
    return errorText(data);
  }
  if (toolId === 'xpath') {
    return pretty({ count: data.count, results: data.results });
  }
  if (toolId === 'jmespath') {
    return pretty(data.result);
  }
  if (toolId === 'json-schema') {
    return pretty({
      valid: data.valid,
      message: data.message,
      path: data.path || []
    });
  }
  if (toolId === 'jinja2') {
    return `${data.result || ''}`;
  }
  if (toolId === 'textfsm') {
    return pretty({
      headers: data.headers,
      record_count: (data.records || []).length,
      records: data.records || []
    });
  }
  if (toolId === 'ttp') {
    return pretty(data.result);
  }
  if (toolId === 'regex') {
    return pretty({
      count: data.count,
      matches: data.matches || []
    });
  }
  return pretty(data);
}

function attachAutoPreview(tool, inputs, outputEl, panel) {
  const config = autoPreviewConfigs[tool.id];
  if (!config) return;

  const controls = document.createElement('div');
  controls.className = 'live-preview-controls';

  const label = document.createElement('label');
  label.className = 'live-preview-toggle';
  const toggle = document.createElement('input');
  toggle.type = 'checkbox';
  toggle.checked = true;
  const labelText = document.createElement('span');
  labelText.textContent = 'Auto preview';
  label.appendChild(toggle);
  label.appendChild(labelText);

  const status = document.createElement('span');
  status.className = 'live-preview-status';
  status.textContent = 'Auto preview is on.';

  controls.appendChild(label);
  controls.appendChild(status);
  panel.querySelector('.actions').appendChild(controls);

  let activeRequestId = 0;
  const runPreview = async () => {
    if (!toggle.checked) {
      status.textContent = 'Auto preview paused.';
      status.classList.remove('error');
      return;
    }

    const missing = (config.required || []).find((key) => !inputs[key] || !inputs[key].value.trim());
    if (missing) {
      status.textContent = `Waiting for ${missing}...`;
      status.classList.remove('error');
      return;
    }

    const reqId = ++activeRequestId;
    status.textContent = 'Previewing...';
    status.classList.remove('error');
    try {
      const res = await fetch(tool.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(collectPayload(inputs))
      });
      const data = await res.json();
      if (reqId !== activeRequestId) return;

      showOutput(outputEl, formatAutoPreviewOutput(tool.id, data), !data.ok);
      if (data.ok) {
        status.textContent = 'Preview updated.';
        status.title = '';
        status.classList.remove('error');
      } else {
        status.textContent = (data.error || 'Preview error.').split('\n')[0];
        status.title = data.error || '';
        status.classList.add('error');
      }
    } catch (err) {
      if (reqId !== activeRequestId) return;
      status.textContent = `Preview failed: ${err}`;
      status.classList.add('error');
    }
  };

  const schedulePreview = debounce(runPreview, config.delayMs || 500);
  Object.entries(inputs).forEach(([key, el]) => {
    if (key.startsWith('__')) return;
    const evt = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(evt, schedulePreview);
  });
  toggle.addEventListener('change', () => {
    if (toggle.checked) {
      runPreview();
    } else {
      status.textContent = 'Auto preview paused.';
      status.classList.remove('error');
    }
  });

  runPreview();
}

function attachPythonLintPreview(tool, inputs, panel) {
  if (tool.id !== 'python-playground' || !inputs.code_pad) return;

  const controls = document.createElement('div');
  controls.className = 'live-preview-controls';

  const label = document.createElement('label');
  label.className = 'live-preview-toggle';
  const toggle = document.createElement('input');
  toggle.type = 'checkbox';
  toggle.checked = true;
  const labelText = document.createElement('span');
  labelText.textContent = 'Live lint';
  label.appendChild(toggle);
  label.appendChild(labelText);

  const status = document.createElement('span');
  status.className = 'live-preview-status';
  status.textContent = 'Live lint is on.';

  controls.appendChild(label);
  controls.appendChild(status);
  panel.querySelector('.actions').appendChild(controls);

  let activeLintId = 0;
  const runLint = async () => {
    if (!toggle.checked) {
      status.textContent = 'Live lint paused.';
      status.classList.remove('error');
      return;
    }

    const reqId = ++activeLintId;
    try {
      const res = await fetch(tool.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'lint',
          function_code: inputs.code_pad.value,
          var1: inputs.var1?.value || '',
          var2: inputs.var2?.value || '',
          var3: inputs.var3?.value || ''
        })
      });
      const data = await res.json();
      if (reqId !== activeLintId) return;

      if (!data.ok) {
        status.textContent = data.error || 'Lint failed.';
        status.classList.add('error');
        return;
      }

      const lint = data.result || {};
      const syntax = lint.syntax || {};
      const var1 = lint.var1 || {};
      const var2 = lint.var2 || {};
      const var3 = lint.var3 || {};
      const message = syntax.valid
        ? `Python syntax OK | var1:${var1.type || '?'} var2:${var2.type || '?'} var3:${var3.type || '?'}`
        : `Syntax error line ${syntax.line || '?'}: ${syntax.message || 'invalid syntax'}`;
      status.textContent = message;
      status.classList.toggle('error', !syntax.valid);
    } catch (err) {
      if (reqId !== activeLintId) return;
      status.textContent = `Lint failed: ${err}`;
      status.classList.add('error');
    }
  };

  const scheduleLint = debounce(runLint, 350);
  [inputs.code_pad, inputs.var1, inputs.var2, inputs.var3].forEach((el) => {
    if (!el) return;
    el.addEventListener('input', scheduleLint);
  });
  toggle.addEventListener('change', () => {
    if (toggle.checked) runLint();
    else {
      status.textContent = 'Live lint paused.';
      status.classList.remove('error');
    }
  });

  runLint();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getTextareaMetrics(textarea) {
  const style = getComputedStyle(textarea);
  const font = style.font || `${style.fontSize} ${style.fontFamily}`;
  const lineHeight = Number.parseFloat(style.lineHeight) || (Number.parseFloat(style.fontSize) || 16) * 1.45;
  const paddingLeft = Number.parseFloat(style.paddingLeft) || 0;
  const paddingTop = Number.parseFloat(style.paddingTop) || 0;
  const probe = document.createElement('span');
  probe.textContent = 'M';
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.whiteSpace = 'pre';
  probe.style.font = font;
  document.body.appendChild(probe);
  const charWidth = probe.getBoundingClientRect().width || 8;
  probe.remove();
  return { lineHeight, charWidth, paddingLeft, paddingTop };
}

function indexFromMouseInTextarea(event, textarea) {
  const rect = textarea.getBoundingClientRect();
  const metrics = getTextareaMetrics(textarea);
  const x = event.clientX - rect.left + textarea.scrollLeft - metrics.paddingLeft;
  const y = event.clientY - rect.top + textarea.scrollTop - metrics.paddingTop;

  const col = Math.max(0, Math.floor(x / metrics.charWidth));
  const row = Math.max(0, Math.floor(y / metrics.lineHeight));
  const lines = textarea.value.split('\n');
  const safeRow = clamp(row, 0, Math.max(lines.length - 1, 0));

  let idx = 0;
  for (let i = 0; i < safeRow; i += 1) {
    idx += lines[i].length + 1;
  }
  idx += clamp(col, 0, lines[safeRow].length);
  return idx;
}

function escapeTip(value) {
  return escapeHtml(String(value ?? ''));
}

function buildRegexHoverHtml(matchInfo, hoveredGroupId = null) {
  if (!matchInfo) return '';

  const groupRows = (matchInfo.groups || []).map((g) => {
    const hasPos = Number.isInteger(g.start) && Number.isInteger(g.end);
    const pos = hasPos ? `[${g.start}, ${g.end})` : '[?, ?)';
    const mark = hoveredGroupId === g.group ? ' <strong>(hovered)</strong>' : '';
    const val = g.value === undefined || g.value === null ? '(no capture)' : g.value;
    return `<li><code>Group ${g.group}</code>${mark} ${escapeTip(pos)} = <code>${escapeTip(val)}</code></li>`;
  }).join('');

  return `
    <div class="regex-tip-title">Match ${matchInfo.id + 1}</div>
    <div><code>Range</code> ${escapeTip(`[${matchInfo.start}, ${matchInfo.end})`)}</div>
    <div><code>Text</code> <code>${escapeTip(matchInfo.value)}</code></div>
    <div class="regex-tip-groups-label">Groups</div>
    <ul class="regex-tip-groups">${groupRows || '<li><code>(none)</code></li>'}</ul>
  `;
}

async function runTool(tool, inputs, outputEl) {
  if (tool.id === 'python-playground') {
    await execPythonPlayground(tool, inputs, outputEl, inputs.__py_command?.value || '', { clearPrompt: true });
    return;
  }

  const payload = {};
  Object.entries(inputs).forEach(([key, el]) => {
    payload[key] = inputValue(el);
  });

  showOutput(outputEl, 'Running...');

  try {
    const res = await fetch(tool.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data && data.ok === true) {
      if (Object.prototype.hasOwnProperty.call(data, 'result')) {
        showOutput(outputEl, pretty(data.result));
      } else {
        showOutput(outputEl, pretty(data));
      }
      return;
    }
    showOutput(outputEl, errorText(data), true);
  } catch (err) {
    showOutput(outputEl, `Request failed: ${err}`, true);
  }
}

// Copy button shown on hover in the top-right corner of an output box.
function attachCopyButton(outputEl) {
  const wrap = document.createElement('div');
  wrap.className = 'output-wrap';
  outputEl.before(wrap);
  wrap.appendChild(outputEl);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'copy-output';
  btn.textContent = 'Copy';
  btn.title = 'Copy output to clipboard';
  btn.addEventListener('click', async () => {
    const text = outputEl.textContent || '';
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      // Fallback for browsers that block the async clipboard API (e.g. plain http on a LAN address).
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    btn.textContent = 'Copied';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = 'Copy';
      btn.classList.remove('copied');
    }, 1200);
  });
  wrap.appendChild(btn);
}

const ACTIVE_TAB_KEY = 'nat_active_tab';

function setActive(id) {
  document.querySelectorAll('#tabs button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === id);
  });

  document.querySelectorAll('.panel').forEach((panel) => {
    panel.hidden = panel.dataset.panel !== id;
  });
  try {
    localStorage.setItem(ACTIVE_TAB_KEY, id);
  } catch (err) {
    // Storage unavailable (private mode): the tab just isn't remembered.
  }
}

function init() {
  tools.forEach((tool, idx) => {
    const tab = document.createElement('button');
    tab.textContent = tool.title;
    tab.dataset.tab = tool.id;
    tab.addEventListener('click', () => setActive(tool.id));
    tabRoot.appendChild(tab);

    const panel = panelTemplate.content.firstElementChild.cloneNode(true);
    panel.dataset.panel = tool.id;
    panel.querySelector('h2').textContent = tool.title;
    panel.querySelector('.desc').textContent = tool.description;
    panel.querySelector('.usecase').textContent = tool.useCase || '';
    panel.querySelector('.chooser').textContent = tool.chooser || '';

    const inputs = {};
    const grid = panel.querySelector('.grid');
    tool.fields.forEach((field) => {
      grid.appendChild(createField(field, inputs));
    });

    const outputEl = panel.querySelector('.output');
    const runBtn = panel.querySelector('.run');
    if (tool.id === 'python-playground') {
      runBtn.remove();

      const terminalTools = document.createElement('div');
      terminalTools.className = 'terminal-tools';

      const clearBtn = document.createElement('button');
      clearBtn.textContent = 'Clear Screen';
      clearBtn.type = 'button';
      clearBtn.className = 'run ghost';
      clearBtn.addEventListener('click', () => {
        outputEl.textContent = '';
        appendTerminalEntry(outputEl, 'Terminal cleared. Session state unchanged.');
      });

      const focusPromptBtn = document.createElement('button');
      focusPromptBtn.textContent = 'Focus Prompt';
      focusPromptBtn.type = 'button';
      focusPromptBtn.className = 'run secondary';
      focusPromptBtn.addEventListener('click', () => {
        commandInput.focus();
        commandInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });

      const loadPadBtn = document.createElement('button');
      loadPadBtn.textContent = 'Load Code Pad';
      loadPadBtn.type = 'button';
      loadPadBtn.className = 'run';
      loadPadBtn.addEventListener('click', async () => {
        await execPythonPlayground(tool, inputs, outputEl, inputs.code_pad?.value || '', { prefix: '[pad] ' });
      });

      terminalTools.appendChild(clearBtn);
      terminalTools.appendChild(focusPromptBtn);
      terminalTools.appendChild(loadPadBtn);

      const commandWrap = document.createElement('div');
      commandWrap.className = 'terminal-input-wrap';
      const commandLabel = document.createElement('label');
      commandLabel.textContent = 'Command Prompt';
      const commandInput = document.createElement('input');
      commandInput.type = 'text';
      commandInput.className = 'terminal-input';
      commandInput.placeholder = 'Type Python and press Enter (Ctrl+L clears output)';
      commandInput.addEventListener('keydown', (event) => {
        if (event.key.toLowerCase() === 'l' && event.ctrlKey) {
          event.preventDefault();
          outputEl.textContent = '';
          appendTerminalEntry(outputEl, 'Terminal cleared. Session state unchanged.');
          return;
        }
        if (isEnterPress(event)) {
          event.preventDefault();
          runTool(tool, inputs, outputEl);
        }
      });
      if (inputs.code_pad) {
        inputs.code_pad.addEventListener('keydown', async (event) => {
          if (isCodePadRunShortcut(event)) {
            event.preventDefault();
            await execPythonPlayground(tool, inputs, outputEl, inputs.code_pad.value, { prefix: '[pad] ' });
          }
        });
      }
      commandWrap.appendChild(commandLabel);
      commandWrap.appendChild(commandInput);
      panel.appendChild(terminalTools);
      panel.appendChild(commandWrap);
      inputs.__py_command = commandInput;

      const sessionStatus = document.createElement('p');
      sessionStatus.className = 'python-session-status';
      panel.appendChild(sessionStatus);
      renderPythonSessionStatus(sessionStatus);

      const startBtn = document.createElement('button');
      startBtn.textContent = 'Start Session';
      startBtn.type = 'button';
      startBtn.className = 'run secondary';
      startBtn.addEventListener('click', async () => {
        const focusPrompt = () => {
          if (inputs.__py_command) {
            inputs.__py_command.focus();
            inputs.__py_command.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        };
        const payload = {
          action: 'init',
          var1: inputs.var1.value,
          var2: inputs.var2.value,
          var3: inputs.var3.value
        };
        try {
          const res = await fetch(tool.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (data.ok) {
            pythonPlaygroundSessionId = data.session_id;
            pythonPlaygroundVarTypes = parseVarTypesFromSessionSummary(data.result);
            renderPythonSessionStatus(sessionStatus);
            outputEl.textContent = '';
            appendTerminalEntry(outputEl, `Session: ${pythonPlaygroundSessionId}`);
            appendTerminalEntry(outputEl, data.result);
            focusPrompt();
          } else {
            appendTerminalEntry(outputEl, `[error] ${data.error}`, { spacer: true });
            focusPrompt();
          }
        } catch (err) {
          appendTerminalEntry(outputEl, `[error] Request failed: ${err}`, { spacer: true });
          focusPrompt();
        }
      });

      const checkVarsBtn = document.createElement('button');
      checkVarsBtn.textContent = 'Check Vars';
      checkVarsBtn.type = 'button';
      checkVarsBtn.className = 'run secondary';
      checkVarsBtn.addEventListener('click', async () => {
        const focusPrompt = () => {
          if (inputs.__py_command) {
            inputs.__py_command.focus();
            inputs.__py_command.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        };
        const payload = {
          action: 'inspect',
          var1: inputs.var1.value,
          var2: inputs.var2.value,
          var3: inputs.var3.value
        };
        try {
          const res = await fetch(tool.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (!data.ok) {
            outputEl.textContent += `\n[error] ${data.error}\n`;
            focusPrompt();
            return;
          }
          const info = data.result || {};
          const v1 = info.var1 || {};
          const v2 = info.var2 || {};
          const v3 = info.var3 || {};
          pythonPlaygroundVarTypes = {
            var1: v1.type || 'unknown',
            var2: v2.type || 'unknown',
            var3: v3.type || 'unknown'
          };
          renderPythonSessionStatus(sessionStatus);
          appendTerminalEntry(outputEl, `[var check] var1: ${v1.type || 'unknown'}${v1.warning ? ` | warning: ${v1.warning}` : ''}`, { spacer: true });
          appendTerminalEntry(outputEl, `[var check] var2: ${v2.type || 'unknown'}${v2.warning ? ` | warning: ${v2.warning}` : ''}`);
          appendTerminalEntry(outputEl, `[var check] var3: ${v3.type || 'unknown'}${v3.warning ? ` | warning: ${v3.warning}` : ''}`);
          focusPrompt();
        } catch (err) {
          appendTerminalEntry(outputEl, `[error] Request failed: ${err}`, { spacer: true });
          focusPrompt();
        }
      });

      const resetBtn = document.createElement('button');
      resetBtn.textContent = 'Reset Session';
      resetBtn.type = 'button';
      resetBtn.className = 'run ghost';
      resetBtn.addEventListener('click', async () => {
        const focusPrompt = () => {
          if (inputs.__py_command) {
            inputs.__py_command.focus();
            inputs.__py_command.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        };
        if (!pythonPlaygroundSessionId) {
          appendTerminalEntry(outputEl, 'No active session.', { spacer: true });
          focusPrompt();
          return;
        }
        const payload = { action: 'reset', session_id: pythonPlaygroundSessionId };
        try {
          const res = await fetch(tool.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          pythonPlaygroundSessionId = null;
          pythonPlaygroundVarTypes = { var1: '?', var2: '?', var3: '?' };
          renderPythonSessionStatus(sessionStatus);
          appendTerminalEntry(outputEl, data.result || 'Session reset.', { spacer: true });
          focusPrompt();
        } catch (err) {
          appendTerminalEntry(outputEl, `[error] Request failed: ${err}`, { spacer: true });
          focusPrompt();
        }
      });

      panel.querySelector('.actions').prepend(startBtn);
      panel.querySelector('.actions').appendChild(checkVarsBtn);
      panel.querySelector('.actions').appendChild(resetBtn);
      outputEl.textContent = '';
      appendTerminalEntry(outputEl, 'Start Session to load `value`, then use Command Prompt below.');
      attachPythonLintPreview(tool, inputs, panel);
    }
    if (tool.id === 'jinja2') {
      attachNetboxControls(tool, inputs, panel);
      const fmtSelect = inputs.variables_format;
      const varsInput = inputs.variables;
      fmtSelect.dataset.prevFormat = fmtSelect.value;
      fmtSelect.addEventListener('change', async () => {
        const sourceFormat = fmtSelect.dataset.prevFormat || 'json';
        const targetFormat = fmtSelect.value;
        const currentContent = varsInput.value;

        if (!currentContent.trim()) {
          varsInput.value = j2SampleVars(inputs, targetFormat);
          fmtSelect.dataset.prevFormat = targetFormat;
          return;
        }

        try {
          const res = await fetch('/api/convert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              source_format: sourceFormat,
              target_format: targetFormat,
              content: currentContent
            })
          });
          const data = await res.json();
          if (data.ok && data.result) {
            varsInput.value = data.result;
          } else {
            varsInput.value = j2SampleVars(inputs, targetFormat);
          }
        } catch (err) {
          varsInput.value = j2SampleVars(inputs, targetFormat);
        }
        fmtSelect.dataset.prevFormat = targetFormat;
      });
    }
    if (tool.id === 'data-model') {
      const convertFieldByFormat = async (formatSelect, contentInput, fallbackSet) => {
        const sourceFormat = formatSelect.dataset.prevFormat || 'json';
        const targetFormat = formatSelect.value;
        const currentContent = contentInput.value;

        if (!currentContent.trim()) {
          contentInput.value = fallbackSet[targetFormat];
          formatSelect.dataset.prevFormat = targetFormat;
          return;
        }

        try {
          const res = await fetch('/api/convert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              source_format: sourceFormat,
              target_format: targetFormat,
              content: currentContent
            })
          });
          const data = await res.json();
          if (data.ok && data.result) {
            contentInput.value = data.result;
          } else {
            contentInput.value = fallbackSet[targetFormat];
          }
        } catch (err) {
          contentInput.value = fallbackSet[targetFormat];
        }
        formatSelect.dataset.prevFormat = targetFormat;
      };

      const sampleFmt = inputs.sample_format;
      const sampleInput = inputs.sample_data;
      sampleFmt.dataset.prevFormat = sampleFmt.value;
      sampleFmt.addEventListener('change', async () => {
        await convertFieldByFormat(sampleFmt, sampleInput, dataModelFallback.sample);
      });

      const validateFmt = inputs.validate_format;
      const validateInput = inputs.validate_data;
      validateFmt.dataset.prevFormat = validateFmt.value;
      validateFmt.addEventListener('change', async () => {
        await convertFieldByFormat(validateFmt, validateInput, dataModelFallback.validate);
      });
    }
    if (toolCheatsheetRows[tool.id]) {
      const cheatsheet = createToolCheatsheet(tool.id);
      if (cheatsheet) {
        panel.querySelector('.grid').after(cheatsheet);
      }
    }
    if (tool.id === 'regex') {
      const patternInput = inputs.pattern;
      const textInput = inputs.text;
      const textField = panel.querySelector('.field[data-key="text"]');

      if (patternInput && textInput && textField) {
        let latestMatchMeta = [];
        const editor = document.createElement('div');
        editor.className = 'regex-text-editor';

        const highlightLayer = document.createElement('pre');
        highlightLayer.className = 'regex-text-highlight';
        highlightLayer.setAttribute('aria-hidden', 'true');

        textInput.classList.add('regex-text-input');
        textInput.spellcheck = false;
        textInput.wrap = 'off';

        textInput.parentNode.insertBefore(editor, textInput);
        editor.appendChild(highlightLayer);
        editor.appendChild(textInput);

        const status = document.createElement('p');
        status.className = 'regex-live-status';
        textField.appendChild(status);

        const hoverTip = document.createElement('div');
        hoverTip.className = 'regex-hover-tip';
        hoverTip.hidden = true;
        document.body.appendChild(hoverTip);

        const hideTip = () => {
          hoverTip.hidden = true;
        };

        const showTipAt = (x, y, html) => {
          hoverTip.innerHTML = html;
          hoverTip.hidden = false;
          const margin = 14;
          const rect = hoverTip.getBoundingClientRect();
          const left = Math.min(x + margin, window.innerWidth - rect.width - 8);
          const top = Math.min(y + margin, window.innerHeight - rect.height - 8);
          hoverTip.style.left = `${Math.max(8, left)}px`;
          hoverTip.style.top = `${Math.max(8, top)}px`;
        };

        const findHoverTarget = (index) => {
          for (const m of latestMatchMeta) {
            if (index >= m.start && index < m.end) {
              let hoveredGroupId = null;
              for (const g of (m.groups || [])) {
                if (Number.isInteger(g.start) && Number.isInteger(g.end) && index >= g.start && index < g.end) {
                  hoveredGroupId = g.group;
                  break;
                }
              }
              return { match: m, groupId: hoveredGroupId };
            }
          }
          return null;
        };

        textInput.addEventListener('mousemove', (event) => {
          if (!latestMatchMeta.length) {
            hideTip();
            return;
          }
          const idx = indexFromMouseInTextarea(event, textInput);
          const target = findHoverTarget(idx);
          if (!target) {
            hideTip();
            return;
          }
          showTipAt(event.clientX, event.clientY, buildRegexHoverHtml(target.match, target.groupId));
        });
        textInput.addEventListener('mouseleave', hideTip);
        textInput.addEventListener('blur', hideTip);
        textInput.addEventListener('scroll', hideTip);

        const syncHighlights = () => {
          const result = buildRegexTextHighlights(textInput.value, patternInput.value);
          highlightLayer.innerHTML = result.html;
          if (!textInput.value.endsWith('\n')) {
            highlightLayer.innerHTML += '\n';
          }
          latestMatchMeta = result.meta || [];
          status.textContent = result.status;
          status.classList.toggle('error', !result.ok);
          if (!result.ok) {
            hideTip();
          }
        };

        textInput.addEventListener('scroll', () => {
          highlightLayer.scrollTop = textInput.scrollTop;
          highlightLayer.scrollLeft = textInput.scrollLeft;
        });
        textInput.addEventListener('input', syncHighlights);
        patternInput.addEventListener('input', syncHighlights);
        syncHighlights();
      }

      panel.querySelector('.grid').after(createRegexCheatsheet());
    }
    attachAutoPreview(tool, inputs, outputEl, panel);
    if (tool.id !== 'python-playground') {
      runBtn.addEventListener('click', () => runTool(tool, inputs, outputEl));
      runBtn.title = 'Run (Ctrl+Enter)';
      panel.addEventListener('keydown', (event) => {
        if (isCodePadRunShortcut(event)) {
          event.preventDefault();
          runTool(tool, inputs, outputEl);
        }
      });
    }
    attachCopyButton(outputEl);

    panelRoot.appendChild(panel);
  });

  let savedTab = null;
  try {
    savedTab = localStorage.getItem(ACTIVE_TAB_KEY);
  } catch (err) {
    savedTab = null;
  }
  setActive(tools.some((t) => t.id === savedTab) ? savedTab : tools[0].id);
}

initTheme();
init();
