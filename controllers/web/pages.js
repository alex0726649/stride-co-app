// Secciones del prototipo que no se implementan en este entregable.
// Responden 200 con la página "Próximamente" para que el menú no tenga enlaces rotos.
function comingSoon(req, res) {
  res.render('coming-soon', { title: req.__('pages.comingSoon.title') });
}

module.exports = { comingSoon };
