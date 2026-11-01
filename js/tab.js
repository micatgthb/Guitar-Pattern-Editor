// Rhythm is stored as sixteenth-note ticks: 16 ticks per 4/4 bar.
const TAB_DURATIONS = { '1': 16, '2': 8, '4': 4, '8': 2, '16': 1 }
const TAB_LIMIT = 64

function tabTicks(step){ return TAB_DURATIONS[step.duration] || 2 }
function sequenceTicks(steps){ return steps.reduce((sum, step) => sum + tabTicks(step), 0) }
function tabPlacement(steps, duration){
  const used = sequenceTicks(steps)
  const ticks = TAB_DURATIONS[duration]
  if(!ticks) return 'Bitte einen gültigen Notenwert wählen.'
  if(used + ticks > TAB_LIMIT) return 'Die vier Takte sind voll. Bitte zuerst einen Eintrag löschen oder kürzen.'
  if(used % 16 + ticks > 16) return 'Dieser Notenwert passt nicht mehr in den Takt. Bitte einen kürzeren Wert wählen.'
  return ''
}

function appendTabStep(step){
  const error = tabPlacement(sequence, step.duration)
  if(error){ document.getElementById('tab-status').textContent = error; return false }
  stopPlayback()
  sequence.push({ ...step, order: nextSequenceNumber() })
  return true
}

function syncSequenceView(){
  // Recreate sequence markers after scale or fret-range changes.
  sequence.filter(p => !p.rest).forEach(p => {
    const cell = document.querySelector(`#grid .cell[data-string="${Number(p.string)}"][data-fret="${Number(p.fret)}"]`)
    if(cell && !cell.querySelector('.dot')){
      const root = chromatic.indexOf(document.getElementById('root').value)
      const interval = (chromatic.indexOf(cell.dataset.note) - root + 12) % 12
      cell.appendChild(createMarker(cell.dataset.note, interval, document.getElementById('displayMode').value))
    }
  })
  refreshMarkerOrders()
  drawSequenceLines()
  renderTab()
}

function svgElement(tag, attrs = {}, text){
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag)
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value))
  if(text !== undefined) el.textContent = text
  return el
}

function renderTab(){
  const target = document.getElementById('tab-score')
  if(!target) return
  const steps = getSortedSequence()
  const strings = getInstrument().strings
  const barHeight = strings.length * 23 + 94
  const ticks = sequenceTicks(steps)
  // Preserve older saved sequences even if they exceed the new four-bar limit.
  const bars = Math.max(4, Math.ceil(ticks / 16))
  const svg = svgElement('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: `0 0 860 ${bars * barHeight + 46}`, role: 'img', 'aria-label': 'Tabulatur im Vier-Viertel-Takt' })
  svg.appendChild(svgElement('rect', { width: '100%', height: '100%', fill: 'white' }))
  const text = (x, y, value, size = 13) => svg.appendChild(svgElement('text', { x, y, 'font-size': size, 'font-family': 'Arial, sans-serif', fill: '#222' }, value))
  const line = (x1, y1, x2, y2, stroke = '#777') => svg.appendChild(svgElement('line', { x1, y1, x2, y2, stroke }))
  text(20, 25, `TAB · 4/4 · ${document.getElementById('bpm').value || 80} BPM`, 18)
  for(let bar = 0; bar < bars; bar++){
    const top = 48 + bar * barHeight
    text(20, top + 14, `Takt ${bar + 1}`, 14)
    for(let beat = 0; beat < 4; beat++) text(78 + beat * 184, top + 32, String(beat + 1))
    strings.forEach((name, index) => {
      const y = top + 73 + index * 23
      text(24, y + 4, name, 15)
      line(62, y, 818, y)
    })
    line(62, top + 73, 62, top + 73 + (strings.length - 1) * 23, '#222')
    line(818, top + 73, 818, top + 73 + (strings.length - 1) * 23, '#222')
  }
  let position = 0
  steps.forEach(step => {
    const length = tabTicks(step)
    // Split legacy notes at a barline for display; a continuation is marked explicitly.
    let remaining = length
    let continued = false
    while(remaining > 0){
      const bar = Math.floor(position / 16)
      const offset = position % 16
      const part = Math.min(remaining, 16 - offset)
      const top = 48 + bar * barHeight
      const x = 78 + offset * 46
      text(x - 4, top + 53, continued ? 'weiter' : `1/${step.duration || '8'}`, 11)
      if(step.rest){ text(x - 3, top + 88, 'P', 17) }
      else {
        const y = top + 73 + Number(step.string) * 23
        svg.appendChild(svgElement('rect', { x: x - 6, y: y - 11, width: 30, height: 21, fill: 'white' }))
        text(x - 3, y + 5, continued ? '~' : step.fret, 17)
      }
      position += part
      remaining -= part
      continued = true
    }
  })
  target.replaceChildren(svg)
  document.getElementById('tab-status').textContent = ticks > TAB_LIMIT
    ? `Geladene Sequenz: ${ticks / 4} Viertelschläge. Mehr als vier Takte; alle Einträge bleiben erhalten.`
    : `${ticks / 4} von 16 Viertelschlägen belegt · ${sequence.length} Einträge. Leere Taktbereiche sind noch nicht eingegeben. P = Pause.`
  const editor = document.getElementById('sequence-editor')
  editor.replaceChildren()
  steps.forEach((step, index) => {
    const li = document.createElement('li')
    const label = document.createElement('span')
    label.textContent = step.rest ? 'Pause ' : `${strings[Number(step.string)]}-Saite · Bund ${step.fret} `
    const select = document.createElement('select')
    select.setAttribute('aria-label', `Notenwert für Eintrag ${index + 1}`)
    Object.keys(TAB_DURATIONS).forEach(value => {
      const option = new Option(`1/${value}`, value)
      select.add(option)
    })
    select.value = step.duration || '8'
    select.addEventListener('change', () => {
      const candidate = steps.map((p, i) => i === index ? { ...p, duration: select.value } : p)
      let prefix = []
      for(const item of candidate){
        const error = tabPlacement(prefix, item.duration || '8')
        if(error){ select.value = step.duration || '8'; document.getElementById('tab-status').textContent = error; return }
        prefix.push(item)
      }
      stopPlayback()
      step.duration = select.value
      syncSequenceView()
    })
    const remove = document.createElement('button')
    remove.textContent = 'Löschen'
    remove.setAttribute('aria-label', `Eintrag ${index + 1} löschen`)
    remove.addEventListener('click', () => {
      stopPlayback()
      sequence.splice(sequence.indexOf(step), 1)
      renumberSequence()
      syncSequenceView()
    })
    li.append(label, select, remove)
    editor.appendChild(li)
  })
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('addRestBtn').addEventListener('click', () => {
    if(appendTabStep({ rest: true, duration: document.getElementById('durationSelect').value })) syncSequenceView()
  })
  document.getElementById('bpm').addEventListener('change', () => { stopPlayback(); renderTab() })
  document.getElementById('exportTabBtn').addEventListener('click', () => {
    const svg = document.querySelector('#tab-score svg')
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'guitar-tab.svg'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  })
  document.getElementById('printTabBtn').addEventListener('click', () => window.print())
  renderTab()
})
