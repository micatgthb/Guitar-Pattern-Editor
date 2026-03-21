const instruments = {

  guitar:{
    strings:["e","B","G","D","A","E"],
    tuning:{
      e:"E",
      B:"B",
      G:"G",
      D:"D",
      A:"A",
      E:"E"
    }
  },

  bass:{
    strings:["G","D","A","E"],
    tuning:{
      G:"G",
      D:"D",
      A:"A",
      E:"E"
    }
  }

}
const noteToFreqMap = {
  C:261.63, "C#":277.18, D:293.66, "D#":311.13,
  E:329.63, F:349.23, "F#":369.99, G:392.00,
  "G#":415.30, A:440.00, "A#":466.16, B:493.88
}

function noteToFreq(note){
  return noteToFreqMap[note] || 440
}

let audioCtx = null

function getAudioContext(){
  if(!audioCtx){
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioCtx
}

function playTone(freq, duration = 0.3){

  const ctx = getAudioContext()

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = "sine"
  osc.frequency.value = freq

  gain.gain.setValueAtTime(0.001, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start()
  osc.stop(ctx.currentTime + duration)
}

function startPlayback(){

  if(sequence.length === 0) return

  const bpm = parseInt(document.getElementById("bpm")?.value || 80)
  const seq = getSortedSequence()

  playbackIndex = 0

  stopPlayback() // sicherheitshalber

  function playNext(){

    const step = seq[playbackIndex]
    if(!step) return

    const freq = noteToFreq(step.note)
    const durationMs = getDurationMs(step.duration, bpm)

    playTone(freq, durationMs / 1000)

    playbackIndex++
    if(playbackIndex >= seq.length){
      playbackIndex = 0 // LOOP
    }

    playbackInterval = setTimeout(playNext, durationMs)

  }

  playNext()
}

function stopPlayback(){
  if(playbackInterval){
    clearTimeout(playbackInterval)
    playbackInterval = null
  }
}

let sequence = []
let sequenceMode = false

function nextSequenceNumber(){
  return sequence.length + 1
}

let playbackInterval = null
let playbackIndex = 0

function getSortedSequence(){
  return [...sequence].sort((a,b)=>a.order - b.order)
}

function getDurationMs(duration, bpm){

  const beat = 60000 / bpm

  switch(duration){
    case "2": return beat * 2
    case "4": return beat
    case "8": return beat / 2
    case "16": return beat / 4
    default: return beat / 2
  }
}

function updateSequenceButton(){

  const btn = document.getElementById("sequenceModeBtn")
  if(!btn) return

  btn.classList.toggle("active", sequenceMode)

  btn.textContent = sequenceMode
  ? "Sequence Mode: ON"
  : "Sequence Mode: OFF"

}

function addSequencePoint(cell){

  const duration = document.getElementById("durationSelect")?.value || "8"

  const data = {
    string: cell.dataset.string,
    fret: cell.dataset.fret,
    note: cell.dataset.note,
    order: nextSequenceNumber(),
    duration: duration
  }

  sequence.push(data)
}

function removeSequencePoint(cell){

  const string = cell.dataset.string
  const fret = cell.dataset.fret

  sequence = sequence.filter(p =>
    !(p.string === string && p.fret === fret)
  )

  renumberSequence()

}

function renumberSequence(){

  sequence.forEach((p,i)=>{
    p.order = i + 1
  })

}

function clearSequence(){
  sequence = []

  document.querySelectorAll("#grid .dot").forEach(marker => {
    delete marker.dataset.order
    marker.querySelectorAll(".order-label").forEach(el => el.remove())
  })

  const svg = document.getElementById("sequenceLayer")
  if(svg){
    svg.innerHTML = ""
  }
}

function getInstrument(){
  const sel=document.getElementById("instrument")
  if(!sel) return instruments.guitar
  return instruments[sel.value] || instruments.guitar
}

let grid;

function getNote(openNote, fret) {
  const start = chromatic.indexOf(openNote);
  return chromatic[(start + fret) % 12];
}

function build(){

  console.log("build called")

grid = document.getElementById("grid");
  console.log("grid:", grid)

const instrument = getInstrument()
const strings = instrument.strings
const tuning = instrument.tuning

const startFret = parseInt(document.getElementById("startFret").value, 10);
const endFret = parseInt(document.getElementById("endFret").value, 10);
  const frets = [];
  for (let f = startFret; f <= endFret; f++) {
    frets.push(f);
  }

  grid.innerHTML = "";
  grid.style.gridTemplateColumns = `60px repeat(${frets.length}, 60px)`;

  const corner = document.createElement("div");
  corner.className = "cell header";
  grid.appendChild(corner);

  frets.forEach((fret) => {
    const h = document.createElement("div");
    h.className = "cell header";
    h.textContent = fret;

    if ([3, 5, 7, 9].includes(fret)) {
      const m = document.createElement("div");
      m.className = "fret-marker";
      h.appendChild(m);
    }

    if (fret === 12) {
      const d = document.createElement("div");
      d.className = "double-marker";

      const m1 = document.createElement("div");
      const m2 = document.createElement("div");
      m1.className = "fret-marker";
      m2.className = "fret-marker";

      d.appendChild(m1);
      d.appendChild(m2);
      h.appendChild(d);
    }

    grid.appendChild(h);
  });

  strings.forEach((stringName, stringIndex) => {

  const label = document.createElement("div");
  label.className = "cell string";
  label.textContent = stringName;

  if(instrument === instruments.bass){
  label.classList.add("bass-string-"+(stringIndex+1))
}

  grid.appendChild(label);

    frets.forEach((fret) => {
      const cell = document.createElement("div");
      cell.className = "cell";

      if (fret === 0) cell.classList.add("nut");

      cell.dataset.note = getNote(tuning[stringName], fret);
      cell.dataset.fret = String(fret);
      cell.dataset.string = String(stringIndex);

      grid.appendChild(cell);
    });
  });
 if (!grid.dataset.clickBound) {
  grid.addEventListener("click", handleCellClick);
  grid.dataset.clickBound = "true";
}
  console.log("click listener attached")

}

function createMarker(note, interval, displayMode, order = null) {
  const svgNS = "http://www.w3.org/2000/svg";

  const dot = document.createElement("div");
  dot.className = "dot";

  const svg = document.createElementNS(svgNS, "svg");
svg.setAttribute("viewBox", "0 0 100 100");
svg.setAttribute("width","36");
svg.setAttribute("height","36");

  svg.classList.add("shape");

  svg.style.overflow="visible";

  let shape;
  let stroke = "#666";
  let strokeWidth = "4";
  let textColor = "#111";

  if (interval === 0) {
    shape = document.createElementNS(svgNS, "circle");
    shape.setAttribute("cx", "50");
    shape.setAttribute("cy", "50");
    shape.setAttribute("r", "42");
    stroke = "#c00000";
    strokeWidth = "8";
    textColor = "#c00000";
  } else if (interval === 3 || interval === 4) {
    shape = document.createElementNS(svgNS, "polygon");
    shape.setAttribute("points", "50,8 92,88 8,88");
    stroke = "#000";
    strokeWidth = "8";
  } else if (interval === 7) {
    shape = document.createElementNS(svgNS, "polygon");
    shape.setAttribute("points", "50,8 90,36 75,88 25,88 10,36");
    stroke = "#000";
    strokeWidth = "8";
  } else {
    shape = document.createElementNS(svgNS, "circle");
    shape.setAttribute("cx", "50");
    shape.setAttribute("cy", "50");
    shape.setAttribute("r", "42");
  }

  shape.setAttribute("fill", "none");
  shape.setAttribute("stroke", stroke);
  shape.setAttribute("stroke-width", strokeWidth);
  shape.setAttribute("stroke-linejoin", "round");
  shape.setAttribute("stroke-linecap", "round");
  svg.appendChild(shape);

  const text = document.createElementNS(svgNS, "text");
  text.setAttribute("x", "50");
  text.setAttribute("y", "54");
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("dominant-baseline", "middle");
  text.setAttribute("font-size", "30");
  text.setAttribute("font-weight", "600");
  text.setAttribute("fill", textColor);
  text.textContent = displayMode === "intervals" ? intervalNames[interval] : note;
  svg.appendChild(text);

  dot.appendChild(svg);
  if(order !== null){
  dot.dataset.order = String(order)
}
  
if(order !== null){

  const orderLabel = document.createElement("div")
  orderLabel.className = "order-label"
  orderLabel.textContent = order

  dot.appendChild(orderLabel)

}
  
  return dot;
}

function clearGrid() {
  const cells = document.querySelectorAll('.cell:not(.header):not(.string)');
  cells.forEach((c) => {
    c.innerHTML = "";
  });

  const svg = document.getElementById("sequenceLayer")
  if(svg){
    svg.innerHTML = ""
  }
}

function applyScale(){

stopPlayback()
clearGrid()

const root = document.getElementById("root").value
const scale = document.getElementById("scale").value
const displayMode = document.getElementById("displayMode").value

if(!root || !scale) return

const rootIndex = chromatic.indexOf(root)
const pattern = scalePatterns[scale]

if(!pattern) return

const scaleNotes = pattern.map(i => chromatic[(rootIndex+i)%12])

const cells = document.querySelectorAll("#grid .cell")

cells.forEach(cell=>{

if(cell.classList.contains("header")) return
if(cell.classList.contains("string")) return

const note = cell.dataset.note
if(!note) return

if(!scaleNotes.includes(note)) return

const noteIndex = chromatic.indexOf(note)
const interval = (noteIndex-rootIndex+12)%12

cell.appendChild(
createMarker(note,interval,displayMode)
)

})

}

function handleCellClick(event){

  const cell = event.target.closest(".cell")
  if(!cell) return
  if(cell.classList.contains("header")) return
  if(cell.classList.contains("string")) return
  if(!cell.dataset.note) return

  const displayMode = document.getElementById("displayMode").value
  const root = document.getElementById("root").value
  const rootIndex = chromatic.indexOf(root)

  const note = cell.dataset.note
  const noteIndex = chromatic.indexOf(note)
  const interval = (noteIndex - rootIndex + 12) % 12

  const existingMarker = cell.querySelector(".dot")
  const existingOrder = existingMarker?.dataset.order

  if(sequenceMode){

    if(!existingMarker) return

    if(!existingOrder){
      addSequencePoint(cell)
    } else {
      removeSequencePoint(cell)
    }

    refreshMarkerOrders()
    drawSequenceLines()
    return
  }

  if(existingMarker){
    cell.innerHTML = ""
    return
  }

  const marker = createMarker(note, interval, displayMode)
  cell.appendChild(marker)
}

function drawSequenceLines(){

  if(!sequenceMode) return

  const svg = document.getElementById("sequenceLayer")
  const grid = document.getElementById("grid")

  if(!svg || !grid) return

  svg.innerHTML = ""

  const rect = grid.getBoundingClientRect()

  svg.setAttribute("width", rect.width)
  svg.setAttribute("height", rect.height)
  svg.style.width = rect.width + "px"
  svg.style.height = rect.height + "px"
  svg.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`)

  const markers = Array.from(grid.querySelectorAll(".dot[data-order]"))

  if(markers.length < 2) return

  markers.sort((a,b) => Number(a.dataset.order) - Number(b.dataset.order))

  const gridRect = grid.getBoundingClientRect()

  markers.forEach((marker, i) => {

    if(i === markers.length - 1) return

    const next = markers[i + 1]

    const a = marker.getBoundingClientRect()
    const b = next.getBoundingClientRect()

    const x1 = a.left - gridRect.left + a.width / 2
    const y1 = a.top - gridRect.top + a.height / 2

    const x2 = b.left - gridRect.left + b.width / 2
    const y2 = b.top - gridRect.top + b.height / 2

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line")

    line.setAttribute("x1", x1)
    line.setAttribute("y1", y1)
    line.setAttribute("x2", x2)
    line.setAttribute("y2", y2)

    line.setAttribute("stroke", "#666")
    line.setAttribute("stroke-width", "2")
    line.setAttribute("stroke-linecap", "round")

    svg.appendChild(line)

  })

}

function refreshMarkerOrders(){

  const markers = document.querySelectorAll("#grid .dot")

  markers.forEach(marker => {
    const cell = marker.closest(".cell")
    if(!cell) return

    const string = cell.dataset.string
    const fret = cell.dataset.fret

    const point = sequence.find(p =>
      p.string === string && p.fret === fret
    )

    marker.querySelectorAll(".order-label").forEach(el => el.remove())

    if(point){
      marker.dataset.order = String(point.order)

      const label = document.createElement("div")
      label.className = "order-label"
      label.textContent = point.order
      marker.appendChild(label)
    } else {
      delete marker.dataset.order
    }
  })
}

function drawStrings(){

  const svg = document.getElementById("stringLayer")
  const grid = document.getElementById("grid")

  if(!svg || !grid) return

  svg.innerHTML = ""

  const rect = grid.getBoundingClientRect()

  svg.setAttribute("width", rect.width)
  svg.setAttribute("height", rect.height)
  svg.style.width = rect.width + "px"
  svg.style.height = rect.height + "px"
  svg.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`)

  const strings = Array.from(grid.querySelectorAll(".cell.string"))

  const gridRect = grid.getBoundingClientRect()

  strings.forEach(label => {

    const r = label.getBoundingClientRect()

    const y = r.top - gridRect.top + r.height / 2

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line")

    line.setAttribute("x1", 0) // Start nach Label
    line.setAttribute("x2", rect.width)

    line.setAttribute("y1", y)
    line.setAttribute("y2", y)

    line.setAttribute("stroke", "#999")
    line.setAttribute("stroke-width", "2")

    svg.appendChild(line)

  })

}

function savePattern(){

  const name = prompt("Name des Patterns?")
  if(!name) return

  const data = {
    sequence: sequence,
    instrument: document.getElementById("instrument")?.value,
    root: document.getElementById("root")?.value,
    scale: document.getElementById("scale")?.value,
    bpm: document.getElementById("bpm")?.value
  }

  localStorage.setItem("pattern_" + name, JSON.stringify(data))

  alert("Gespeichert: " + name)
}

function loadPattern(name){

  stopPlayback()   // 👉 HIER hinzufügen

  const raw = localStorage.getItem("pattern_" + name)
  if(!raw) return

  const data = JSON.parse(raw)
  clearSequence() // 👉 GANZ wichtig!

  sequence = data.sequence || []

  // UI wiederherstellen
  if(data.instrument){
    document.getElementById("instrument").value = data.instrument
  }

  if(data.root){
    document.getElementById("root").value = data.root
  }

  if(data.scale){
    document.getElementById("scale").value = data.scale
  }

  if(data.bpm){
    document.getElementById("bpm").value = data.bpm
  }

  // neu aufbauen
  build()
  drawStrings()
  applyScale()
  refreshMarkerOrders()
  drawSequenceLines()
}

function listPatterns(){

  const list = []

  for(let i=0;i<localStorage.length;i++){
    const key = localStorage.key(i)
    if(key.startsWith("pattern_")){
      list.push(key.replace("pattern_",""))
    }
  }

  return list
}

function showLoadMenu(){

  const patterns = listPatterns()

  if(patterns.length === 0){
    alert("Keine gespeicherten Patterns")
    return
  }

  const name = prompt("Pattern laden:\n\n" + patterns.join("\n"))

  if(name){
    loadPattern(name)
  }
}


document.addEventListener("DOMContentLoaded",()=>{

  const seqBtn = document.getElementById("sequenceModeBtn")
  const clearBtn = document.getElementById("clearSequenceBtn")
  const inst = document.getElementById("instrument")

  const playBtn = document.getElementById("playBtn")
  const stopBtn = document.getElementById("stopBtn")

  const scaleSelect = document.getElementById("scale")

  const saveBtn = document.getElementById("saveBtn")
const loadBtn = document.getElementById("loadBtn")

if(saveBtn){
  saveBtn.addEventListener("click", savePattern)
}

if(loadBtn){
  loadBtn.addEventListener("click", showLoadMenu)
}

if(scaleSelect){
  scaleSelect.addEventListener("change", ()=>{

    stopPlayback()   // wichtig!

    applyScale()
    drawSequenceLines()

  })
}

const rootSelect = document.getElementById("root")

if(rootSelect){
  rootSelect.addEventListener("change", ()=>{
    stopPlayback()
    applyScale()
    drawSequenceLines()
  })
}

if(playBtn){
  playBtn.addEventListener("click", ()=>{
    startPlayback()
  })
}

if(stopBtn){
  stopBtn.addEventListener("click", ()=>{
    stopPlayback()
  })
}

  if(seqBtn){
    seqBtn.addEventListener("click", (e) => {
      e.preventDefault()

      sequenceMode = !sequenceMode

      const grid = document.getElementById("grid")
      if(grid){
        grid.classList.toggle("sequence-mode", sequenceMode)
      }

      if(!sequenceMode){
        clearSequence()
      }

      updateSequenceButton()

      if(clearBtn){
        clearBtn.disabled = !sequenceMode
      }
    })
  }

  if(clearBtn){
    clearBtn.disabled = !sequenceMode

    clearBtn.addEventListener("click", (e) => {
      e.preventDefault()
      clearSequence()
    })
  }

  build()
  drawStrings()
  applyScale()
  drawSequenceLines()
  updateSequenceButton()
  

  if(inst){
    inst.addEventListener("change",()=>{
      stopPlayback()
      build()
      drawStrings()
      applyScale()
      drawSequenceLines()
    })
  }
})

