const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const context = vm.createContext({ document: { addEventListener() {} } })
vm.runInContext(fs.readFileSync('js/tab.js', 'utf8'), context)
const run = code => vm.runInContext(code, context)

test('durations use exact integer ticks, including whole notes', () => {
  assert.equal(run("sequenceTicks(['1','2','4','8','16'].map(duration => ({duration})))"), 31)
})
test('four complete bars fit, then further input is rejected', () => {
  assert.equal(run("tabPlacement(Array(3).fill({duration:'1'}), '1')"), '')
  assert.match(run("tabPlacement(Array(4).fill({duration:'1'}), '16')"), /voll/)
})
test('a note cannot be appended across a barline', () => {
  assert.match(run("tabPlacement(Array(7).fill({duration:'8'}), '4')"), /Takt/)
  assert.equal(run("tabPlacement(Array(7).fill({duration:'8'}), '8')"), '')
})
test('rests occupy the same rhythmic space as notes', () => {
  assert.equal(run("sequenceTicks([{rest:true,duration:'2'}, {string:'0',fret:'3',duration:'2'}])"), 16)
})
test('legacy entries without duration retain the previous eighth-note default', () => {
  assert.equal(run('tabTicks({})'), 2)
})
test('invalid durations are rejected', () => {
  assert.match(run("tabPlacement([], '3')"), /gültigen/)
})

const controls = { instrument: { value: 'guitar', dataset: {} }, root: { value: 'C' },
  scale: { value: 'major' }, bpm: { value: '80' } }
const saved = new Map()
let timerCallback
const audio = []
const appContext = vm.createContext({
  document: { addEventListener() {}, getElementById: id => controls[id] },
  localStorage: { setItem: (k,v) => saved.set(k,v), getItem: k => saved.get(k) },
  prompt: () => 'test-tab', alert() {},
  setTimeout: callback => { timerCallback = callback; return 1 }, clearTimeout() {},
  console: { log() {} }
})
vm.runInContext(fs.readFileSync('js/fretboard.js', 'utf8'), appContext)
const appRun = code => vm.runInContext(code, appContext)
appContext.captureTone = (frequency, duration) => audio.push({frequency, duration})
appRun('playTone = captureTone; updateAll = () => {}; syncSequenceView = () => {}; clearSequence = () => { stopPlayback(); sequence = [] }')

test('save and load preserve repeated notes, per-note durations and rests', () => {
  appRun("sequence = [{string:'0',fret:'3',note:'G',order:1,duration:'4'}, {string:'0',fret:'3',note:'G',order:2,duration:'8'}, {rest:true,order:3,duration:'2'}]; savePattern()")
  const original = saved.get('pattern_test-tab')
  appRun("sequence = []; loadPattern('test-tab'); savePattern()")
  assert.equal(saved.get('pattern_test-tab'), original)
})
test('playback respects string octave, rests and note duration', () => {
  audio.length = 0
  appRun('startPlayback()')
  assert.ok(Math.abs(audio[0].frequency - 391.995) < .01)
  assert.equal(audio[0].duration, .75)
  timerCallback()
  assert.equal(audio[1].duration, .375)
  timerCallback()
  assert.equal(audio.length, 2, 'rest must not create an oscillator')
  appRun('stopPlayback()')
})
