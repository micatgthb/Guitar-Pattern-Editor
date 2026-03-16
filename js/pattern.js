document.addEventListener("DOMContentLoaded", initPatternControls);

function initPatternControls(){

const saveBtn = document.getElementById("savePatternBtn");
const loadBtn = document.getElementById("loadPatternBtn");

if(saveBtn){
saveBtn.addEventListener("click", savePattern);
}

if(loadBtn){
loadBtn.addEventListener("click", loadPattern);
}

updatePatternList();

}


function savePattern(){

alert("Speichern gedrückt")

const name = document.getElementById("patternName").value

if(!name){
alert("Bitte Namen eingeben")
return
}

const pattern=[]

const cells=document.querySelectorAll(".cell")

cells.forEach(cell=>{

if(!cell.dataset.note) return

const marker = cell.querySelector(".dot")

if(!marker) return

pattern.push({
fret:cell.dataset.fret,
note:cell.dataset.note
})

})

localStorage.setItem(
"pattern_"+name,
JSON.stringify(pattern)
)

updatePatternList()

}


function loadPattern(){

const select=document.getElementById("patternList")

const name=select.value

if(!name) return

const data=localStorage.getItem("pattern_"+name)

if(!data) return

const pattern=JSON.parse(data)

clearGrid()

pattern.forEach(p=>{

const cells=document.querySelectorAll(".cell")

cells.forEach(cell=>{

if(cell.dataset.note===p.note && cell.dataset.fret===p.fret){

const root=document.getElementById("root").value
const displayMode=document.getElementById("displayMode").value

const rootIndex=chromatic.indexOf(root)
const noteIndex=chromatic.indexOf(p.note)

const interval=(noteIndex-rootIndex+12)%12

cell.appendChild(
createMarker(p.note,interval,displayMode)
)

}

})

})

}


function updatePatternList(){

const select=document.getElementById("patternList")

select.innerHTML=""

Object.keys(localStorage).forEach(key=>{

if(!key.startsWith("pattern_")) return

const name=key.replace("pattern_","")

const option=document.createElement("option")

option.value=name
option.textContent=name

select.appendChild(option)

})

}
