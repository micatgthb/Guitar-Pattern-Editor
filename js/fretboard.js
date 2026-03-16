const strings = ["e", "B", "G", "D", "A", "E"];

const tuning = {
  e: "E",
  B: "B",
  G: "G",
  D: "D",
  A: "A",
  E: "E"
};

let grid;

function getNote(openNote, fret) {
  const start = chromatic.indexOf(openNote);
  return chromatic[(start + fret) % 12];
}

function build(){

grid = document.getElementById("grid");

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

  strings.forEach((stringName) => {
    const label = document.createElement("div");
    label.className = "cell string";
    label.textContent = stringName;
    grid.appendChild(label);

    frets.forEach((fret) => {
      const cell = document.createElement("div");
      cell.className = "cell";

      if (fret === 0) cell.classList.add("nut");

      cell.dataset.note = getNote(tuning[stringName], fret);
      cell.dataset.fret = String(fret);

      grid.appendChild(cell);
    });
  });
  if (!grid.dataset.clickBound) {
    grid.addEventListener("click", handleCellClick);
    grid.dataset.clickBound = "true";
  }

}

function createMarker(note, interval, displayMode) {
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
  return dot;
}

function clearGrid() {
  const cells = document.querySelectorAll('.cell:not(.header):not(.string)');
  cells.forEach((c) => {
    c.innerHTML = "";
  });
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
  const cell = event.target.closest(".cell");
  if (!cell) return;
  if (cell.classList.contains("header") || cell.classList.contains("string")) return;
  if (!cell.dataset.note) return;

  if (cell.innerHTML.trim() !== "") {
    cell.innerHTML = "";
    return;
  }

  const displayMode = document.getElementById("displayMode").value;
  const root = document.getElementById("root").value;
  const rootIndex = chromatic.indexOf(root);
  const note = cell.dataset.note;
  const noteIndex = chromatic.indexOf(note);
  const interval = (noteIndex - rootIndex + 12) % 12;

  cell.appendChild(createMarker(note, interval, displayMode));

}
