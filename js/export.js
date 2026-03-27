document.addEventListener("DOMContentLoaded", () => {

  const exportBtn = document.getElementById("exportPngBtn")
  const board = document.getElementById("board-wrapper")

  if(!exportBtn || !board) return

  exportBtn.addEventListener("click", async () => {

    // 👉 kleine Sicherheit: kurz warten bis alles gerendert ist
    await new Promise(r => requestAnimationFrame(r))

    const canvas = await html2canvas(board, {
      backgroundColor: null,
      scale: 2, // 👉 höhere Auflösung
      useCORS: true
    })

    const link = document.createElement("a")
    link.download = buildFilename()
    link.href = canvas.toDataURL("image/png")
    link.click()

  })

})

/* ===== DATEINAME ===== */

function buildFilename(){

  const root = document.getElementById("root")?.value || "root"
  const scale = document.getElementById("scale")?.value || "scale"
  const instrument = document.getElementById("instrument")?.value || "inst"

  return `${instrument}_${root}_${scale}.png`
}
