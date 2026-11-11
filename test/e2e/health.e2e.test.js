const { api } = require('./helpers');

describe('E2E - Health check', () => {
  it('GET /health responde 200 con estado UP sin requerir token', async () => {
    const res = await api().get('/health');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body).toEqual({ status: 'UP' });
  });
});
