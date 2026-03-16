function initControls(){

const rootSelect=document.getElementById("root")
const scaleSelect=document.getElementById("scale")
const positionSelect=document.getElementById("position")

// Tonarten

chromatic.forEach(note=>{
let option=document.createElement("option")
option.value=note
option.textContent=note
rootSelect.appendChild(option)
})

// Skalen

Object.keys(scalePatterns).forEach(scale=>{
let option=document.createElement("option")
option.value=scale
option.textContent=scale.replace("_"," ")
scaleSelect.appendChild(option)
})

// Positionen

let all=document.createElement("option")
all.value="all"
all.textContent="alle"
positionSelect.appendChild(all)

for(let i=1;i<=5;i++){

let option=document.createElement("option")
option.value=i
option.textContent="Position "+i
positionSelect.appendChild(option)

}

}

function initButtons(){

document.getElementById("applyScaleBtn")
.addEventListener("click",()=>{
applyScale()
})

document.getElementById("rebuildBtn")
.addEventListener("click",()=>{
build()
})

document.getElementById("clearBtn")
.addEventListener("click",()=>{
clearGrid()
})

}

// Start erst wenn DOM fertig ist

window.addEventListener("load",()=>{

initControls()
initButtons()

build()

})
