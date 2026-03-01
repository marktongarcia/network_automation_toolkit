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
const j2FallbackVars = {
  json: '{\n  "hostname": "R1-EDGE",\n  "loopback": {\n    "ip": "192.168.255.1",\n    "mask": "255.255.255.255"\n  },\n  "interfaces": [\n    {\n      "name": "GigabitEthernet0/0",\n      "description": "WAN_TO_ISP",\n      "ip": "10.10.10.1",\n      "mask": "255.255.255.252",\n      "shutdown": false\n    },\n    {\n      "name": "GigabitEthernet0/1",\n      "description": "LAN_USERS",\n      "ip": "172.16.20.1",\n      "mask": "255.255.255.0",\n      "shutdown": false\n    }\n  ]\n}',
  yaml: 'hostname: R1-EDGE\nloopback:\n  ip: 192.168.255.1\n  mask: 255.255.255.255\ninterfaces:\n  - name: GigabitEthernet0/0\n    description: WAN_TO_ISP\n    ip: 10.10.10.1\n    mask: 255.255.255.252\n    shutdown: false\n  - name: GigabitEthernet0/1\n    description: LAN_USERS\n    ip: 172.16.20.1\n    mask: 255.255.255.0\n    shutdown: false\n'
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
    outputEl.textContent += '\n[error] No active session. Click Start Session first.\n';
    outputEl.scrollTop = outputEl.scrollHeight;
    focusPrompt();
    return;
  }
  if (!code) {
    outputEl.textContent += '\n[error] Code input is empty.\n';
    outputEl.scrollTop = outputEl.scrollHeight;
    focusPrompt();
    return;
  }

  const payload = {
    action: 'exec',
    session_id: pythonPlaygroundSessionId,
    function_code: codeText
  };

  outputEl.textContent += `\n${prefix}${code}\n`;
  outputEl.textContent += '... running ...\n';
  outputEl.scrollTop = outputEl.scrollHeight;

  try {
    const res = await fetch(tool.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.ok) {
      outputEl.textContent += `[error] ${data.error}\n`;
    } else {
      const out = data.result || {};
      if (out.stdout) outputEl.textContent += out.stdout.endsWith('\n') ? out.stdout : `${out.stdout}\n`;
      if (Object.prototype.hasOwnProperty.call(out, 'result')) {
        outputEl.textContent += `${pretty(out.result)}\n`;
      }
      if (out.stderr) outputEl.textContent += `[stderr]\n${out.stderr}`;
    }
    if (clearPrompt && inputs.__py_command) {
      inputs.__py_command.value = '';
    }
    outputEl.scrollTop = outputEl.scrollHeight;
    focusPrompt();
  } catch (err) {
    outputEl.textContent += `[error] Request failed: ${err}\n`;
    outputEl.scrollTop = outputEl.scrollHeight;
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

function buildRegexTextHighlights(text, rawPattern) {
  if (!rawPattern.trim()) {
    return { ok: true, html: escapeHtml(text), status: 'Enter a pattern to preview matches.' };
  }

  const parsed = parseInlineRegexFlags(rawPattern);
  const flags = Array.from(new Set(`${parsed.flags}g`)).join('');
  let regex;

  try {
    regex = new RegExp(parsed.source, flags);
  } catch (err) {
    return { ok: false, html: escapeHtml(text), status: `Pattern error: ${err.message}` };
  }

  const segments = [];
  const matches = [];
  let nextStart = 0;
  let hit;
  while ((hit = regex.exec(text)) !== null) {
    const start = hit.index;
    const end = start + hit[0].length;
    if (end < start) {
      break;
    }
    matches.push({ start, end });
    if (hit[0] === '') {
      regex.lastIndex += 1;
      if (regex.lastIndex > text.length) break;
    }
  }

  if (matches.length === 0) {
    return { ok: true, html: escapeHtml(text), status: 'No matches yet.' };
  }

  matches.forEach((range, idx) => {
    segments.push(escapeHtml(text.slice(nextStart, range.start)));
    const matchText = escapeHtml(text.slice(range.start, range.end));
    const className = idx % 2 === 0 ? 'rgx-hit rgx-hit-a' : 'rgx-hit rgx-hit-b';
    segments.push(`<span class="${className}">${matchText || ' '}</span>`);
    nextStart = range.end;
  });
  segments.push(escapeHtml(text.slice(nextStart)));

  return {
    ok: true,
    html: segments.join(''),
    status: `${matches.length} match${matches.length === 1 ? '' : 'es'} highlighted in real-time.`
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
    ['Flow', '-> StateName', 'Transition to another state', '^foo -> NextState']
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
    ['Output', '{{ var }}', 'Render variable value', '{{ hostname }}'],
    ['Control', '{% for x in xs %}', 'Loop block', '{% for i in interfaces %}'],
    ['Control', '{% if cond %}', 'Conditional block', '{% if intf.shutdown %}'],
    ['Filters', '{{ v|default("x") }}', 'Apply filter to value', '{{ desc|upper }}'],
    ['Whitespace', '{%- ... -%}', 'Trim surrounding whitespace', '{%- for x in y -%}'],
    ['Access', 'obj.key / arr[0]', 'Dot/index navigation', '{{ loopback.ip }}']
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

  const highlightLayer = document.createElement('pre');
  highlightLayer.className = 'live-code-highlight';
  highlightLayer.setAttribute('aria-hidden', 'true');

  const input = document.createElement('textarea');
  input.className = 'live-code-input';
  input.value = field.value || '';
  input.rows = rows;
  input.spellcheck = false;
  highlightLayer.style.minHeight = `${minHeightPx}px`;

  const syncHighlight = () => {
    highlightLayer.innerHTML = getSyntaxHighlightHtml(field.mode || 'plain', input.value);
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

async function runTool(tool, inputs, outputEl) {
  if (tool.id === 'python-playground') {
    await execPythonPlayground(tool, inputs, outputEl, inputs.__py_command?.value || '', { clearPrompt: true });
    return;
  }

  const payload = {};
  Object.entries(inputs).forEach(([key, el]) => {
    payload[key] = el.value;
  });

  outputEl.textContent = 'Running...';

  try {
    const res = await fetch(tool.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data && data.ok === true) {
      if (Object.prototype.hasOwnProperty.call(data, 'result')) {
        outputEl.textContent = pretty(data.result);
      } else {
        outputEl.textContent = pretty(data);
      }
      return;
    }
    outputEl.textContent = pretty(data);
  } catch (err) {
    outputEl.textContent = `Request failed: ${err}`;
  }
}

function setActive(id) {
  document.querySelectorAll('#tabs button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === id);
  });

  document.querySelectorAll('.panel').forEach((panel) => {
    panel.hidden = panel.dataset.panel !== id;
  });
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
        outputEl.textContent = 'Terminal cleared. Session is still active.';
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
      commandInput.placeholder = 'Type Python and press Enter (example: print(value))';
      commandInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          runTool(tool, inputs, outputEl);
        }
      });
      if (inputs.code_pad) {
        inputs.code_pad.addEventListener('keydown', async (event) => {
          if (event.key === 'Enter' && event.ctrlKey) {
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
            outputEl.textContent = `Session: ${pythonPlaygroundSessionId}\n${data.result}\n`;
            focusPrompt();
          } else {
            outputEl.textContent += `\n[error] ${data.error}\n`;
            focusPrompt();
          }
        } catch (err) {
          outputEl.textContent += `\n[error] Request failed: ${err}\n`;
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
          outputEl.textContent += `\n[var check] var1: ${v1.type || 'unknown'}${v1.warning ? ` | warning: ${v1.warning}` : ''}\n`;
          outputEl.textContent += `[var check] var2: ${v2.type || 'unknown'}${v2.warning ? ` | warning: ${v2.warning}` : ''}\n`;
          outputEl.textContent += `[var check] var3: ${v3.type || 'unknown'}${v3.warning ? ` | warning: ${v3.warning}` : ''}\n`;
          outputEl.scrollTop = outputEl.scrollHeight;
          focusPrompt();
        } catch (err) {
          outputEl.textContent += `\n[error] Request failed: ${err}\n`;
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
          outputEl.textContent += '\nNo active session.\n';
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
          outputEl.textContent += `\n${data.result || 'Session reset.'}\n`;
          focusPrompt();
        } catch (err) {
          outputEl.textContent += `\n[error] Request failed: ${err}\n`;
          focusPrompt();
        }
      });

      panel.querySelector('.actions').prepend(startBtn);
      panel.querySelector('.actions').appendChild(checkVarsBtn);
      panel.querySelector('.actions').appendChild(resetBtn);
      outputEl.textContent = 'Start Session to load `value`, then use Command Prompt below.';
    }
    if (tool.id === 'jinja2') {
      const fmtSelect = inputs.variables_format;
      const varsInput = inputs.variables;
      fmtSelect.dataset.prevFormat = fmtSelect.value;
      fmtSelect.addEventListener('change', async () => {
        const sourceFormat = fmtSelect.dataset.prevFormat || 'json';
        const targetFormat = fmtSelect.value;
        const currentContent = varsInput.value;

        if (!currentContent.trim()) {
          varsInput.value = j2FallbackVars[targetFormat];
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
            varsInput.value = j2FallbackVars[targetFormat];
          }
        } catch (err) {
          varsInput.value = j2FallbackVars[targetFormat];
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
        const editor = document.createElement('div');
        editor.className = 'regex-text-editor';

        const highlightLayer = document.createElement('pre');
        highlightLayer.className = 'regex-text-highlight';
        highlightLayer.setAttribute('aria-hidden', 'true');

        textInput.classList.add('regex-text-input');
        textInput.spellcheck = false;

        textInput.parentNode.insertBefore(editor, textInput);
        editor.appendChild(highlightLayer);
        editor.appendChild(textInput);

        const status = document.createElement('p');
        status.className = 'regex-live-status';
        textField.appendChild(status);

        const syncHighlights = () => {
          const result = buildRegexTextHighlights(textInput.value, patternInput.value);
          highlightLayer.innerHTML = result.html;
          if (!textInput.value.endsWith('\n')) {
            highlightLayer.innerHTML += '\n';
          }
          status.textContent = result.status;
          status.classList.toggle('error', !result.ok);
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
    if (tool.id !== 'python-playground') {
      runBtn.addEventListener('click', () => runTool(tool, inputs, outputEl));
    }

    panelRoot.appendChild(panel);

    if (idx === 0) {
      setActive(tool.id);
    }
  });
}

initTheme();
init();
