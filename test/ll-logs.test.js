const assert = require('node:assert');
const test = require('node:test');
const llog = require('../src/utils/ll-utilities/ll-logs');

test('blue logs colored string', () => {
  const original = console.log;
  let output;
  console.log = (msg) => { output = msg; };
  llog.blue('hello');
  console.log = original;
  assert.strictEqual(output, '\u001b[34mhello\u001b[0m');
});

test('cyan logs colored object', () => {
  const original = console.log;
  let output;
  console.log = (msg) => { output = msg; };
  llog.cyan({ a: 1 });
  console.log = original;
  assert.strictEqual(output, '\u001b[36m{\n    "a": 1\n}\u001b[0m');
});
