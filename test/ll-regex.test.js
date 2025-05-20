const assert = require('node:assert');
const test = require('node:test');
const regex = require('../src/utils/ll-utilities/ll-regex');

test('everything regex matches strings', () => {
  assert.ok(regex.everything.test('hello'));
  assert.ok(regex.everything.test('')); // empty string
  assert.ok(regex.everything.test('12345'));
});
