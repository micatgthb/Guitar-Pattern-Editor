function updateExportHeader(){

const root = document.getElementById("root").value
const scale = document.getElementById("scale").value
const position = document.getElementById("position").value
const start = document.getElementById("startFret").value
const end = document.getElementById("endFret").value

if(!root || !scale) return

let scaleName = scale.replace("_"," ")

let posText = ""
if(position && position !== "all"){
posText = " – Position " + position
}

const header =
root + " " + scaleName + posText + " – Frets " + start + "-" + end

document.getElementById("exportHeader").innerText = header

}


document.getElementById("exportPngBtn").addEventListener("click",()=>{

updateExportHeader()

const target = document.getElementById("exportArea")

setTimeout(()=>{

  html2canvas(target).then(canvas=>{

  const dataUrl = canvas.toDataURL("image/png")

  /* iPhone / iPad */

  if(/iPhone|iPad|iPod/i.test(navigator.userAgent)){

  window.open(dataUrl)

  return
  }

  /* andere Geräte */

  const root = document.getElementById("root").value
  const scale = document.getElementById("scale").value

  let filename = "guitar_pattern"

  if(root && scale){
  filename = root + "_" + scale.replace("_","") + "_pattern"
  }

  const link = document.createElement("a")
  link.download = filename + ".png"
  link.href = dataUrl
  link.click()

  })

},100)

})


function attachHeaderUpdates(){

const ids = [
"root",
"scale",
"position",
"startFret",
"endFret"
]

ids.forEach(id=>{

const el = document.getElementById(id)

if(el){
el.addEventListener("change",updateExportHeader)
}

})

}

window.addEventListener("DOMContentLoaded",()=>{

attachHeaderUpdates()
updateExportHeader()

})
