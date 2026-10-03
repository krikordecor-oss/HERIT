const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../app.js'), 'utf8');
function fn(name) {
  const start = source.search(new RegExp(`(?:async )?function ${name}\\(`));
  assert.ok(start >= 0, name);
  return source.slice(start, source.indexOf('\n}', start) + 2);
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function harness(extra = {}) {
  const nodes = {};
  const history = [];
  const state = { sheetRevision: 1, currentHit: { feature: { properties: { rnb_id: 'A' } } } };
  const ctx = vm.createContext({
    state, console, Promise, setTimeout: () => 0, cloudSession: { user: {} },
    $: id => nodes[id] ||= { textContent: '', innerHTML: '' },
    addressFromRnb: async () => null, reverseAddress: async () => null,
    resolveBuildingGeoContext: async () => null, buildingSnapshot: () => ({ id: 'A' }),
    upsertById: (_, item) => history.push(item), STORAGE_HISTORY: 'history', ...extra
  });
  vm.runInContext(fn('featureAddress'), ctx);
  return { ctx, nodes, state, history, run: name => vm.runInContext(fn(name), ctx) };
}
test('late public address cannot overwrite a newly opened building or history', async () => {
  const old = deferred();
  const h = harness({ addressFromRnb: () => old.promise }); h.run('resolvePublicBuildingSheet');
  const pending = h.ctx.resolvePublicBuildingSheet(h.state.currentHit);
  h.state.sheetRevision++; h.nodes.sheetAddress.textContent = 'New building';
  old.resolve({ label: 'Old address' }); await pending;
  assert.equal(h.nodes.sheetAddress.textContent, 'New building');
  assert.equal(h.state.geoContext, undefined); assert.equal(h.history.length, 0);
});
test('linked address is primary; nearby address never stored as verified', async () => {
  const exact = harness({ addressFromRnb: async () => ({ label: '12 rue Test', source: 'RNB' }) });
  exact.run('resolvePublicBuildingSheet'); await exact.ctx.resolvePublicBuildingSheet(exact.state.currentHit);
  assert.equal(exact.nodes.sheetTitle.textContent, '12 rue Test');
  const nearby = harness({ reverseAddress: async () => ({ label: '14 rue Test', source: 'Géoplateforme' }) });
  nearby.run('resolvePublicBuildingSheet'); await nearby.ctx.resolvePublicBuildingSheet(nearby.state.currentHit);
  assert.equal(nearby.nodes.sheetTitle.textContent, 'Bâtiment sélectionné');
  assert.match(nearby.nodes.sheetAddress.textContent, /Adresse proche/);
  assert.equal(nearby.history[0].address, null);
});
test('missing address and malformed feature addresses remain truthful', async () => {
  const h = harness(); h.run('resolvePublicBuildingSheet');
  assert.equal(h.ctx.featureAddress({ properties: { address: { label: 'Object' } } }), null);
  await h.ctx.resolvePublicBuildingSheet(h.state.currentHit);
  assert.equal(h.nodes.sheetAddress.textContent, 'Adresse non déterminée');
});
test('late cloud identity cannot attach previous building id to new sheet', async () => {
  const old = deferred();
  const h = harness({ cloudIngestScan: () => old.promise, lastCloudScanKey: null,
    buildingCloudPayload: () => ({ building: { external_key: 'A' } }) });
  h.run('syncCurrentScan'); const pending = h.ctx.syncCurrentScan();
  h.state.sheetRevision++; old.resolve({ scan_id: 'old', building_id: 'wrong' }); await pending;
  assert.equal(h.state.currentCloudBuildingId, undefined);
});
for (const [name, api, textId] of [
  ['refreshOpportunityScore', 'cloudOpportunity', 'opportunityText'],
  ['refreshBuildingFacts', 'cloudEnrichBuilding', 'buildingFactsText'],
  ['refreshFutureContext', 'cloudBuildingContext', 'futureContextText'],
  ['refreshConstructionHistory', 'cloudConstructionHistory', 'constructionHistoryText'],
  ['refreshBuildingBrief', 'cloudBuildingBrief', 'buildingBriefSummary']
]) {
  for (const failure of [false, true]) test(`${name} ignores stale ${failure ? 'error' : 'success'}`, async () => {
    const old = deferred(); const h = harness({ [api]: () => old.promise });
    h.state.currentCloudBuildingId = 'A'; h.state.geoContext = { country_code: 'FR' };
    h.run(name); const pending = h.ctx[name]();
    h.state.sheetRevision++; h.nodes[textId].textContent = 'New result';
    failure ? old.reject(new Error('offline')) : old.resolve({}); await pending;
    assert.equal(h.nodes[textId].textContent, 'New result');
  });
}
test('sheet keeps selected building while phone moves', () => {
  let calls = 0; const h = harness({ selectTarget: () => { calls++; } });
  h.ctx.$('buildingSheet').classList = { contains: () => false };
  h.state.position = { lat: 45, lon: 5 }; h.state.heading = 10;
  const before = h.state.currentHit; h.run('updateTarget'); h.ctx.updateTarget();
  assert.equal(calls, 0); assert.equal(h.state.currentHit, before);
});
test('public identity finishes before sync; sync finishes before enrichment', async () => {
  const identity = deferred(), synced = deferred(), events = [];
  const h = harness({ openSheet12: () => { events.push('identity'); return identity.promise; },
    syncCurrentScan: () => { events.push('sync'); return synced.promise; } });
  for (const name of ['refreshBuildingFacts','refreshConstructionHistory','refreshFutureContext','refreshOpportunityScore','refreshBuildingBrief'])
    h.ctx[name] = async () => { events.push(name); };
  const start = source.indexOf('openSheet=async function(){', source.indexOf('const openSheet12='));
  vm.runInContext(source.slice(start, source.indexOf('\n};', start) + 3), h.ctx);
  const pending = h.ctx.openSheet(); assert.deepEqual(events, ['identity']);
  identity.resolve(); await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(events, ['identity', 'sync']);
  synced.resolve(); await pending; assert.equal(events.length, 7);
});

test('saved snapshot keeps linked address only for the active sheet', () => {
  const h = harness({ getMode: () => 'Immobilier' });
  let hidden = false;
  h.ctx.$('buildingSheet').classList = { contains: () => hidden };
  h.state.currentHit.distance = 10;
  h.state.banContext = { label: '12 rue Test', approximate: false };
  h.run('labelFor'); h.run('buildingSnapshot');
  assert.equal(h.ctx.buildingSnapshot().label, '12 rue Test');
  hidden = true;
  assert.equal(h.ctx.buildingSnapshot().label, 'A');
  hidden = false; h.state.banContext.approximate = true;
  assert.equal(h.ctx.buildingSnapshot().address, null);
});
