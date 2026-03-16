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

let sequence = []

function nextSequenceNumber(){
  return sequence.length + 1
}

function addSequencePoint(cell){

  const data = {
    string: cell.dataset.string,
    fret: cell.dataset.fret,
    note: cell.dataset.note,
    order: nextSequenceNumber(),
    duration: "8"
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

function handleCellClick(event) {
  
  console.log("click detected")
  const cell = event.target.closest(".cell");
  if (!cell) return;
  if (cell.classList.contains("header") || cell.classList.contains("string")) return;
  if (!cell.dataset.note) return;

if (cell.innerHTML.trim() !== "") {

 removeSequencePoint(cell)

cell.innerHTML = ""

refreshMarkerOrders()
drawSequenceLines()
  return

}

  const displayMode = document.getElementById("displayMode").value;
  const root = document.getElementById("root").value;
  const rootIndex = chromatic.indexOf(root);
  const note = cell.dataset.note;
  const noteIndex = chromatic.indexOf(note);
  const interval = (noteIndex - rootIndex + 12) % 12;

 addSequencePoint(cell)
refreshMarkerOrders()

const order = sequence.length

cell.appendChild(
  createMarker(note, interval, displayMode, order)
)

drawSequenceLines()
console.log(sequence)

}

function drawSequenceLines(){

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

  const markers = document.querySelectorAll("#grid .dot[data-order]")

  markers.forEach(marker=>{
    const cell = marker.closest(".cell")

    const string = cell.dataset.string
    const fret = cell.dataset.fret

    const point = sequence.find(p =>
      p.string === string && p.fret === fret
    )

    if(point){
      marker.dataset.order = point.order
    }

  })

}

document.addEventListener("DOMContentLoaded",()=>{

build()
applyScale()
drawSequenceLines()

const inst=document.getElementById("instrument")

if(inst){

inst.addEventListener("change",()=>{

build()
applyScale()
drawSequenceLines()

})

}

})
