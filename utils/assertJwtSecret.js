function assertJwtSecret(config) {
  if (!config.has('jwt.secret') || !config.get('jwt.secret')) {
    throw new Error('No se pudo iniciar el servidor: falta "jwt.secret" en la configuración.');
  }
}

module.exports = assertJwtSecret;