
var vows = require('vows'),
  assert = require('assert'),
  ned = require('../src/ned');

vows.describe('Using ned').addBatch({
  'when making 2 replacements on test': {
    topic: {
      argv: ['node', 'ned', '-1', 't', 'is the b', '-n', '1..1', 't', '$&!', '^', 'ned '],
      input: 'test'
    },
    'we expect "test" to become "ned is the best!"': function(process) {
      assert.equal(ned(process), 'ned is the best!')
    },
  },
  'when removing consecutive spaces': {
    topic: {
      argv: ['node', 'ned', ' +', ' '],
      input: 'this   is   a    test'
    },
    'we expect "this   is   a    test" to become "this is a test"': function(process) {
      assert.equal(ned(process), 'this is a test')
    },
  },
  'when searching the entire document': {
    topic: {
      argv: ['node', 'ned', '-m', '^second', 'first'],
      input: "second line\nsecond line"
    },
    'we expect "second line\\nsecond line" to become "first line\\n second line"': function(process) {
      assert.equal(ned(process), "first line\nsecond line")
    },
  },
  'when suppressing output': {
    topic: {
      argv: ['node', 'ned', '-D', '2$'],
      input: 'test1\ntest2\ntest3'
    },
    'we expect "test1\\ntest2\\ntest3" to become "test1\\ntest3"': function(process) {
      assert.equal(ned(process), 'test1\ntest3')
    },
  },
  'when suppressing output with trailing newline': {
    topic: {
      argv: ['node', 'ned', '-D', '2$'],
      input: "test1\ntest2\ntest3\n"
    },
    'we expect "test1\\ntest2\\ntest3\\n" to become "test1\\ntest3\\n"': function(process) {
      assert.equal(ned(process), "test1\ntest3\n")
    },
  },
  'when grepping output': {
    topic: {
      argv: ['node', 'ned', '2$'],
      input: "test1\ntest2\ntest3"
    },
    'we expect "test1\\ntest2\\ntest3" to become "test2"': function(process) {
      assert.equal(ned(process), 'test2')
    },
  },
  'when grepping output, case insensitive': {
    topic: {
      argv: ['node', 'ned', '-i', 'abc'],
      input: "abc\nABC\nAbC\ndef"
    },
    'we expect "abc\\nABC\\nAbC\\ndef" to become "abc\\nABC\\nAbC"': function(process) {
      assert.equal(ned(process), 'abc\nABC\nAbC')
    },
  },
  'when grepping output AND': {
    topic: {
      argv: ['node', 'ned', '-P', 'good', '-P', '[13]'],
      input: "good1\nbad1\ngood2\nbad2\ngood3\nbad3"
    },
    'we expect "good1\nbad1\ngood2\nbad2\ngood3\nbad3" to become "good1\ngood3"': function(process) {
      assert.equal(ned(process), 'good1\ngood3')
    },
  },
  'when grepping output OR': {
    topic: {
      argv: ['node', 'ned', '-P', 'good', '[13]'],
      input: "good1\nbad1\ngood2\nbad2\ngood3\nbad3"
    },
    'we expect "good1\nbad1\ngood2\nbad2\ngood3\nbad3" to become "good1\\nbad1\\ngood2\\ngood3\\nbad3"': function(process) {
      assert.equal(ned(process), 'good1\nbad1\ngood2\ngood3\nbad3')
    },
  },
  'when grepping output with trailing newline': {
    topic: {
      argv: ['node', 'ned', '2$'],
      input: "test1\ntest2\ntest3\n"
    },
    'we expect "test1\\ntest2\\ntest3\\n" to become "test2\\n"': function(process) {
      assert.equal(ned(process), "test2\n")
    },
  },
}).export(module);
