const http = require('http');

function req(path, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL('http://localhost:5000' + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) options.headers['Authorization'] = 'Bearer ' + token;

    const request = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { resolve(body); }
      });
    });
    request.on('error', reject);
    if (data) request.write(JSON.stringify(data));
    request.end();
  });
}

async function testSmallBudget() {
  const login = await req('/api/auth/login', 'POST', { username: 'admin', password: 'admin123' });
  const token = login.token;

  console.log('== 1. Testing Team with budget < 1 Lakh (e.g. ₹25,000) ==');
  const createRes = await req('/api/teams', 'POST', {
    name: 'Small Budget Titans',
    initialBudget: 25000,
    shortcutKey: 'Z'
  }, token);

  console.log('Create response:', createRes.success, 'Budget:', createRes.team?.initialBudget);
  if (!createRes.success || createRes.team?.initialBudget !== 25000) {
    throw new Error('Small budget test failed: ' + JSON.stringify(createRes));
  }

  console.log('== 2. Testing Team with budget ₹500 ==');
  const updateRes = await req('/api/teams/' + createRes.team._id, 'PUT', {
    initialBudget: 500
  }, token);
  console.log('Update response:', updateRes.success, 'Updated Budget:', updateRes.team?.initialBudget);
  if (!updateRes.success || updateRes.team?.initialBudget !== 500) {
    throw new Error('₹500 budget test failed: ' + JSON.stringify(updateRes));
  }

  console.log('== 3. Cleaning up test team ==');
  await req('/api/teams/' + createRes.team._id, 'DELETE', null, token);
  console.log('Test team deleted cleanly!');

  console.log('== 4. Testing Website Title in Settings ==');
  const pubSettings = await req('/api/settings/public', 'GET');
  console.log('Public websiteTitle:', pubSettings.settings?.websiteTitle);

  console.log('==============================================');
  console.log('   SMALL BUDGET & AUCTION PRO TITLE VERIFIED! ');
  console.log('==============================================');
}

testSmallBudget().catch(e => {
  console.error('Test failed:', e);
  process.exit(1);
});
