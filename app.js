const tools = [
  {
    id: 'textfsm',
    title: 'TextFSM Parser',
    description: 'Parse CLI output with a TextFSM template.',
    useCase: 'Use case: turn repeated show-command output into structured rows you can loop over in automation.',
    chooser: 'Best for: stable line-oriented CLI formats. Alternative: use TTP when output shape varies a lot.',
    endpoint: '/api/textfsm',
    fields: [
      { key: 'template', label: 'Template', type: 'textarea', value: 'Value INTERFACE (\\S+)\nValue IP_ADDRESS (\\S+)\nValue STATUS (up|down|administratively down)\nValue PROTOCOL (up|down)\n\nStart\n  ^${INTERFACE}\\s+${IP_ADDRESS}\\s+YES\\s+\\S+\\s+${STATUS}\\s+${PROTOCOL} -> Record' },
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
      { key: 'xpath', label: 'XPath', type: 'input', value: '//interface[enabled=\"true\"]/name/text()' }
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
      { key: 'schema', label: 'Schema (JSON)', type: 'textarea', value: '{\n  "$schema": "https://json-schema.org/draft/2020-12/schema",\n  "type": "object",\n  "required": ["hostname", "mgmt_ip", "role", "interfaces"],\n  "properties": {\n    "hostname": {"type": "string", "minLength": 3},\n    "mgmt_ip": {"type": "string", "pattern": "^\\\\d+\\\\.\\\\d+\\\\.\\\\d+\\\\.\\\\d+$"},\n    "role": {"type": "string", "enum": ["edge", "core", "access"]},\n    "interfaces": {\n      "type": "array",\n      "minItems": 1,\n      "items": {\n        "type": "object",\n        "required": ["name", "enabled"],\n        "properties": {\n          "name": {"type": "string"},\n          "enabled": {"type": "boolean"},\n          "description": {"type": "string"}\n        }\n      }\n    }\n  }\n}' },
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
      { key: 'expression', label: 'JMESPath', type: 'input', value: 'interfaces[?enabled && counters.in_errors > `0`].{name:name,in_errors:counters.in_errors}' }
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
      { key: 'template', label: 'Template', type: 'textarea', value: 'hostname {{ hostname }}\n!\ninterface Loopback0\n ip address {{ loopback.ip }} {{ loopback.mask }}\n description Router-ID\n!\n{% for intf in interfaces %}interface {{ intf.name }}\n description {{ intf.description }}\n ip address {{ intf.ip }} {{ intf.mask }}\n{% if intf.shutdown %} shutdown\n{% else %} no shutdown\n{% endif %}!\n{% endfor %}' },
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
      { key: 'template', label: 'TTP Template', type: 'textarea', value: '<group name=\"interfaces\">\ninterface {{ name }}\n description {{ description | ORPHRASE }}\n ip address {{ ip }} {{ mask }}\n {{ state | ORPHRASE }}\n!</group>' },
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
      { key: 'code_pad', label: 'Code Pad (multiline)', type: 'textarea', value: 'def hot_interfaces():\n    t = var2["threshold"]\n    return [i["name"] for i in value["interfaces"] if i["in_util"] > t]\n\nprint("Hot interfaces:", hot_interfaces())' },
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
      { key: 'pattern', label: 'Pattern', type: 'input', value: '(?ms)^interface\\s+(\\S+)\\n\\s+ip address\\s+(\\d+\\.\\d+\\.\\d+\\.\\d+)\\s+(\\d+\\.\\d+\\.\\d+\\.\\d+)\\n\\s+description\\s+(.+?)\\n!' },
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
