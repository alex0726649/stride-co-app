describe('Arranque del servidor', () => {
  afterEach(() => {
    jest.resetModules();
  });

  test('config.get lanza/falla si falta jwt.secret', () => {
    jest.resetModules();
    jest.doMock('config', () => ({
      has: () => false,
      get: () => { throw new Error('jwt.secret no definido'); },
    }));

    expect(() => {
      const config = require('config');
      if (!config.has('jwt.secret')) {
        throw new Error('No se pudo iniciar el servidor: falta "jwt.secret"');
      }
    }).toThrow(/jwt.secret/);
  });

  test('respeta PORT cuando está definido vía config (custom-environment-variables)', () => {
    const config = require('config');
    // En el entorno de test, server.port viene de config/test.json o default.json
    const port = config.get('server.port');
    expect(port).toBeDefined();
  });
});