const assertJwtSecret = require('../utils/assertJwtSecret');

describe('Arranque del servidor', () => {
  test('lanza error si falta jwt.secret (config real sin el valor)', () => {
    const configSinSecreto = { has: () => false, get: () => undefined };
    expect(() => assertJwtSecret(configSinSecreto)).toThrow(/jwt\.secret/);
  });

  test('no lanza error si jwt.secret sí está definido', () => {
    const configConSecreto = { has: () => true, get: () => 'algun-secreto' };
    expect(() => assertJwtSecret(configConSecreto)).not.toThrow();
  });

  test('respeta PORT: custom-environment-variables.json mapea PORT a server.port', () => {
    const originalPort = process.env.PORT;
    process.env.PORT = '4321';
    jest.resetModules();

    const config = require('config');
    expect(config.get('server.port')).toBe(4321);

    process.env.PORT = originalPort;
    jest.resetModules();
  });
});