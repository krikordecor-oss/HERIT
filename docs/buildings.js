const RNB_ITEMS = 'https://rnb-api.beta.gouv.fr/api/alpha/ogc/collections/buildings/items';
const DEFAULT_RADIUS_M = 140;
let cache = [];
let lastQuery = null;

export function setBuildingFeatures(features){ cache = features || []; }

function metersToLatDeg(m){ return m / 111320; }
function metersToLonDeg(m, lat){
  const c = Math.max(0.15, Math.cos(lat * Math.PI / 180));
  return m / (111320 * c);
}
function bboxAround(lat, lon, radiusM){
  const dLat = metersToLatDeg(radiusM);
  const dLon = metersToLonDeg(radiusM, lat);
  return [lon-dLon, lat-dLat, lon+dLon, lat+dLat];
}
function queryKey(lat, lon, radiusM){
  return `${lat.toFixed(4)}:${lon.toFixed(4)}:${radiusM}`;
}
function normalizeFeature(feature){
  if (!feature || !feature.geometry) return null;
  const p = feature.properties || {};
  return {
    ...feature,
    properties: {
      ...p,
      rnb_id: p.rnb_id || feature.id || p.id || null,
      status: p.status || p.statut || null
    }
  };
}
async function loadLocalFallback(){
  try {
    const r = await fetch('./buildings.geojson', {cache:'no-store'});
    if (!r.ok) return [];
    const geo = await r.json();
    return (geo.features || []).map(normalizeFeature).filter(Boolean);
  } catch (_) {
    return [];
  }
}
export async function loadBuildingsNear(lat, lon, {radiusM=DEFAULT_RADIUS_M, force=false}={}){
  const key = queryKey(lat, lon, radiusM);
  if (!force && key === lastQuery && cache.length) return cache;
  const bbox = bboxAround(lat, lon, radiusM).map(v => v.toFixed(7)).join(',');
  const url = `${RNB_ITEMS}?bbox=${encodeURIComponent(bbox)}&limit=100`;
  try {
    const r = await fetch(url, {
      headers: {'Accept':'application/geo+json, application/json'},
      cache:'no-store'
    });
    if (!r.ok) throw new Error(`RNB HTTP ${r.status}`);
    const geo = await r.json();
    const features = (geo.features || []).map(normalizeFeature).filter(Boolean);
    cache = features;
    lastQuery = key;
    return cache;
  } catch (err) {
    console.warn('RNB indisponible, fallback local :', err);
    const local = await loadLocalFallback();
    if (local.length) {
      cache = local;
      lastQuery = key;
      return cache;
    }
    throw err;
  }
}