const test = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('./server');

test('OPTIONS preflight returns CORS headers for the GitHub Pages origin', async () => {
  const server = app.listen(0);

  try {
    await new Promise((resolve) => server.once('listening', resolve));
    const { port } = server.address();

    const response = await fetch(`http://127.0.0.1:${port}/login`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://johndaro7.github.io',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
    });

    assert.equal(response.status, 204);
    assert.equal(response.headers.get('access-control-allow-origin'), 'https://johndaro7.github.io');
    assert.match(response.headers.get('access-control-allow-methods') || '', /POST/i);
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});
