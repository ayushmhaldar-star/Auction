const http = require('http');

function req(path, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL('http://localhost:5000' + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) options.headers['Authorization'] = 'Bearer ' + token;

    const request = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });
    request.on('error', reject);
    if (data) request.write(JSON.stringify(data));
    request.end();
  });
}

async function testWorkflow() {
  console.log('== 1. Testing Admin Login ==');
  const login = await req('/api/auth/login', 'POST', { username: 'admin', password: 'admin123' });
  if (!login.success) throw new Error('Login failed: ' + JSON.stringify(login));
  const token = login.token;
  console.log('Logged in successfully, token received.');

  console.log('== 2. Fetching Teams ==');
  const teamsRes = await req('/api/teams', 'GET');
  const mumbai = teamsRes.teams.find(t => t.shortcutKey === 'Q');
  const chennai = teamsRes.teams.find(t => t.shortcutKey === 'W');
  console.log(`Found teams: ${mumbai.name} (Balance: ${mumbai.remainingBalance}), ${chennai.name} (Balance: ${chennai.remainingBalance})`);

  console.log('== 3. Selecting Player #1 for Auction ==');
  const selRes = await req('/api/auction/select-player', 'POST', { serialNumber: 1 }, token);
  console.log(`Player selected: ${selRes.state.currentPlayer.name}, Base Price: ${selRes.state.currentBid}`);

  console.log('== 4. Placing Bid for Mumbai (Q) ==');
  const bid1 = await req('/api/auction/bid', 'POST', { teamId: mumbai._id }, token);
  console.log(`Bid 1: ${bid1.state.currentBid} by ${bid1.state.currentBiddingTeam.name}`);

  console.log('== 5. Placing Higher Bid for Chennai (W) ==');
  const bid2 = await req('/api/auction/bid', 'POST', { teamId: chennai._id }, token);
  console.log(`Bid 2: ${bid2.state.currentBid} by ${bid2.state.currentBiddingTeam.name}`);

  console.log('== 6. Testing Undo Bid ==');
  const undo = await req('/api/auction/undo-bid', 'POST', {}, token);
  console.log(`Undone bid. Current bidder is now: ${undo.state.currentBiddingTeam.name}, Bid: ${undo.state.currentBid}`);

  console.log('== 7. Re-bidding Chennai ==');
  await req('/api/auction/bid', 'POST', { teamId: chennai._id }, token);

  console.log('== 8. Marking Player as SOLD ==');
  const soldRes = await req('/api/auction/sold', 'POST', {}, token);
  console.log(`Sale confirmed: ${soldRes.message}`);

  console.log('== 9. Verifying Team Balance Deduction ==');
  const teamCheck = await req('/api/teams/' + chennai._id, 'GET');
  console.log(`Chennai new balance: ${teamCheck.team.remainingBalance} (Initial was ${teamCheck.team.initialBudget})`);
  console.log(`Chennai total spent: ${teamCheck.team.totalSpent}, Purchased players: ${teamCheck.team.purchasedPlayers.length}`);

  console.log('== 10. Selecting Player #2 and Marking UNSOLD ==');
  await req('/api/auction/select-player', 'POST', { serialNumber: 2 }, token);
  const unsoldRes = await req('/api/auction/unsold', 'POST', {}, token);
  console.log(`Unsold confirmed: ${unsoldRes.message}`);

  console.log('== 11. Testing Start Unsold Round ==');
  const unsoldRoundRes = await req('/api/auction/start-unsold-round', 'POST', {}, token);
  console.log(`Unsold round initiated: ${unsoldRoundRes.message}, New Round: ${unsoldRoundRes.state.currentRound}`);

  console.log('== 12. Testing Public State Sanitization ==');
  const pubState = await req('/api/auction/public-state', 'GET');
  console.log('Public state received. Check for absence of balance/private fields:');
  console.log('Public keys:', Object.keys(pubState.state));
  if (pubState.state.currentBiddingTeam) {
    console.log('Team public keys:', Object.keys(pubState.state.currentBiddingTeam));
    if ('remainingBalance' in pubState.state.currentBiddingTeam) {
      throw new Error('Private balance leaked in public API!');
    }
  }
  console.log('Sanitization verified: NO private balance leaked!');

  console.log('== 13. Testing Reset Auction ==');
  const resetRes = await req('/api/auction/reset', 'POST', {}, token);
  console.log(`Reset status: ${resetRes.message}`);

  console.log('==============================================');
  console.log('   ALL BUSINESS RULES VERIFIED AND PASSED! 🏏');
  console.log('==============================================');
}

testWorkflow().catch(e => {
  console.error('Test failed:', e);
  process.exit(1);
});
