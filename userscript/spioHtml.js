module.exports.report2html = function report2html (report) {
  function addSection (data) {
    let html = ''
    let ix = 0
    for (const k in data) {
      if (ix % 2 === 0) {
        if (ix > 0) {
          html += '</div>\n'
        }
        html += '<div class="spyRaportContainerRow clearfix">\n'
      }
      html += `<div class="spyRaportContainerCell">${k}</div>\n`
      html += `<div class="spyRaportContainerCell">${data[k].toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</div>\n`
      ix += 1
    }
    html += '</div>\n'
    return html
  }
  return `
  <div class="spyRaport">
  <div class="spyRaportHead">${report.date}</a></div>
  <div class="spyRaportContainer">
    <div class="spyRaportContainerHead spyRaportContainerHeadClass900">Resources</div>
    ${addSection(report.resources)}
  </div>
  <div class="spyRaportContainer">
    <div class="spyRaportContainerHead spyRaportContainerHeadClass200">Ships</div>
    ${addSection(report.ships)}
  </div>
  <div class="spyRaportContainer">
    <div class="spyRaportContainerHead spyRaportContainerHeadClass400">Planetary Defense</div>
    ${addSection(report.defense)}
  </div>
  <div class="spyRaportContainer">
    <div class="spyRaportContainerHead spyRaportContainerHeadClass0">Buildings</div>
    ${addSection(report.buildings)}
  </div>
  <div class="spyRaportContainer">
    <div class="spyRaportContainerHead spyRaportContainerHeadClass100">Research</div>
    ${addSection(report.research)}
  </div>
</div>
  `.replaceAll('"', "'")
}
