// "Print this sheet": prints only the sheet whose button was pressed (the calendar page holds two), then puts the
// page back. The print styles live in global.css (body[data-print-only] and [data-print-target]).
for (const button of document.querySelectorAll<HTMLButtonElement>("button[data-print]")) {
  button.addEventListener("click", () => {
    const target = document.querySelector(`[data-sheet="${button.dataset.print}"]`)
    target?.setAttribute("data-print-target", "")
    document.body.setAttribute("data-print-only", "")
    window.print()
  })
}
addEventListener("afterprint", () => {
  document.body.removeAttribute("data-print-only")
  for (const el of document.querySelectorAll("[data-print-target]")) el.removeAttribute("data-print-target")
})
