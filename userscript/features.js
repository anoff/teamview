// Feature (plugin) manager, register different features to load into the teamview userscript

const list = {}

function importAll (r) {
  r.keys().forEach((key) => (list[key] = r(key)))
}

function init () {
  importAll(require.context('./features/', true, /\.js$/))
  console.log(list)
}

module.exports = {
  init,
  list
}
