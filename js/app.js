console.log("APP START")

function initControls(){

const rootSelect=document.getElementById("root")
const scaleSelect=document.getElementById("scale")

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

}

// Start erst wenn DOM fertig ist

window.addEventListener("load",()=>{

initControls()

updateAll(true)
renderTab()

})
