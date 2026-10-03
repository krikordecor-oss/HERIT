// HERIT Lens v2.17 resilience: the field scanner must boot even when cloud/CDN is unavailable.
let cloudModule=null;
const cloudUnavailable=()=>Promise.reject(new Error('Services cloud temporairement indisponibles.'));
async function loadCloud(){
  if(cloudModule)return cloudModule;
  try{ cloudModule=await import('./cloud.js?v=2.19-address2'); return cloudModule; }
  catch(err){ console.warn('[HERIT] Cloud unavailable; local scanner remains active.',err); return null; }
}
const cloudCall=(name)=>(...args)=>loadCloud().then(m=>m?.[name]?m[name](...args):cloudUnavailable());
const cloudGetSession=cloudCall('cloudGetSession');
const cloudSignIn=cloudCall('cloudSignIn');
const cloudSignUp=cloudCall('cloudSignUp');
const cloudSignOut=cloudCall('cloudSignOut');
const cloudResendConfirmation=cloudCall('cloudResendConfirmation');
const cloudIngestScan=cloudCall('cloudIngestScan');
const cloudIngestObservation=cloudCall('cloudIngestObservation');
const cloudLibrary=cloudCall('cloudLibrary');
const cloudOpportunity=cloudCall('cloudOpportunity');
const cloudProspects=cloudCall('cloudProspects');
const cloudEnrichBuilding=cloudCall('cloudEnrichBuilding');
const cloudGlobalEnrich=cloudCall('cloudGlobalEnrich');
const cloudBuildingContext=cloudCall('cloudBuildingContext');
const cloudConstructionHistory=cloudCall('cloudConstructionHistory');
const cloudBuildingBrief=cloudCall('cloudBuildingBrief');
const cloudOvertureZone=cloudCall('cloudOvertureZone');
const cloudOnAuthChange=(cb)=>{ let subscription={unsubscribe(){}}; loadCloud().then(m=>{ if(m?.cloudOnAuthChange){ const r=m.cloudOnAuthChange(cb); subscription=r?.data?.subscription||r?.subscription||subscription; } }); return {data:{subscription}}; };
import { I18N, SUPPORTED_LANGUAGES, getPreferredLocale, localeLabel, applyTranslations } from './i18n.js?v=1.0';
import { selectTarget, normalizeHeading, haversineMeters } from './targeting.js';
import { loadBuildingsNear } from './buildings.js';

const $ = id => document.getElementById(id);
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
const state={position:null,heading:null,features:[],watchId:null,lastLoadPosition:null,loading:false,currentHit:null,currentConfidence:null,geoContext:null};

function sourceFactEl(){
  return $('sourceFact') || document.querySelector('.targetFacts > div:nth-child(2) strong');
}
function initScannerIdleState(){
  const source=sourceFactEl();
  if(source)source.textContent='—';
  const reload=$('reloadBtn');
  if(reload){
    reload.disabled=true;
    reload.classList.add('disabledControl');
    reload.setAttribute('aria-disabled','true');
  }
}
initScannerIdleState();

function openMenu(){ $('drawer').classList.remove('hidden'); $('drawer').setAttribute('aria-hidden','false'); }
function closeMenu(){ $('drawer').classList.add('hidden'); $('drawer').setAttribute('aria-hidden','true'); }
$('menuBtn').addEventListener('click',openMenu);
$('scannerMenuBtn').addEventListener('click',openMenu);
$('closeMenu').addEventListener('click',closeMenu);
$('drawerBackdrop').addEventListener('click',closeMenu);

function openSheet(){
  if(!state.currentHit)return;
  const hit=state.currentHit, p=hit.feature.properties||{};
  $('sheetTitle').textContent=labelFor(hit.feature);
  $('sheetRnb').textContent=p.rnb_id||p.id||hit.feature.id||'—';
  $('sheetDistance').textContent=`${Math.round(hit.distance)} m`;
  $('sheetMode').textContent=modeLabel(hit.mode);
  $('sheetConfidence').textContent=state.currentConfidence!=null?`${state.currentConfidence}%`:'—';
  $('sheetAccuracy').textContent=state.position?`±${Math.round(state.position.accuracy)} m`:'—';
  $('sheetNearby').textContent=`${state.features.length}`;
  if($('identityConfidence')) $('identityConfidence').textContent=state.currentConfidence!=null?`${state.currentConfidence}%`:'—';
  if($('identityStatus')) $('identityStatus').textContent=state.currentConfidence>=82?'Identité confirmée':'Identité probable';
  if($('identityEvidence')) $('identityEvidence').textContent=(p.rnb_id?'RNB':'Source bâtiment')+' · provenance conservée';
  if($('weatherPressure')) $('weatherPressure').textContent='—';
  if($('weatherMomentum')) $('weatherMomentum').textContent='—';
  if($('weatherFront')) $('weatherFront').textContent='—';
  if($('weatherForecast')) $('weatherForecast').textContent='En apprentissage';
  if($('weatherReason')) $('weatherReason').textContent='Aucune prédiction n’est affichée sans preuve Replay suffisante.';
  $('buildingSheet').classList.remove('hidden');
  $('buildingSheet').setAttribute('aria-hidden','false');
}
function closeSheet(){
  $('buildingSheet').classList.add('hidden');
  $('buildingSheet').setAttribute('aria-hidden','true');
}
$('openBuildingBtn').addEventListener('click',()=>openSheet());
$('closeSheet').addEventListener('click',closeSheet);
$('sheetBackdrop').addEventListener('click',closeSheet);

async function startCamera(){
  const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
  $('camera').srcObject=stream;
}
function deviceHeading(e){
  if(typeof e.webkitCompassHeading==='number') return normalizeHeading(e.webkitCompassHeading);
  if(typeof e.alpha==='number') return normalizeHeading(360-e.alpha);
  return null;
}
async function requestOrientation(){
  if(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function'){
    const p=await DeviceOrientationEvent.requestPermission();
    if(p!=='granted') throw new Error('Autorisation orientation refusée');
  }
  window.addEventListener('deviceorientation',e=>{
    const h=deviceHeading(e);
    if(h!=null){state.heading=h;$('heading').textContent=`${h.toFixed(0)}°`;updateTarget();}
  },true);
}
async function maybeReloadBuildings(force=false){
  if(!state.position||state.loading)return;
  const moved=state.lastLoadPosition?haversineMeters(state.lastLoadPosition,state.position):Infinity;
  if(!force&&moved<18&&state.features.length)return;
  state.loading=true;$('rnbStatus').textContent='RNB…';
  try{
    state.features=await loadBuildingsNear(state.position.lat,state.position.lon,{radiusM:140,force});
    let sourceLabel='RNB';
    if((!state.features||!state.features.length) && cloudSession?.user){
      try{
        const g=await cloudOvertureZone({
          lat:state.position.lat,
          lon:state.position.lon,
          radius_m:140,
          country_code:state.geoContext?.country_code||null
        });
        if(g?.status==='ready' && Array.isArray(g.features) && g.features.length){
          state.features=g.features;
          sourceLabel='Overture';
        }else if(g?.status==='queued' || g?.status==='processing'){
          $('sensorStatus').textContent='Données mondiales en préparation';
        }
      }catch(e){
        console.warn('HERIT Overture fallback',e);
      }
    }
    state.lastLoadPosition={lat:state.position.lat,lon:state.position.lon};
    $('rnbStatus').textContent=`${state.features.length} bât.`;
    $('sensorStatus').textContent=state.features.length ? sourceLabel+' connecté' : 'Aucun bâtiment';
    updateTarget();
  }catch(e){
    try{
      if(cloudSession?.user){
        const g=await cloudOvertureZone({
          lat:state.position.lat,lon:state.position.lon,radius_m:140,
          country_code:state.geoContext?.country_code||null
        });
        if(g?.status==='ready' && Array.isArray(g.features) && g.features.length){
          state.features=g.features;
          state.lastLoadPosition={lat:state.position.lat,lon:state.position.lon};
          $('rnbStatus').textContent=`${state.features.length} bât.`;
          $('sensorStatus').textContent='Overture connecté';
          updateTarget();
          return;
        }
        $('rnbStatus').textContent='GLOBAL…';
        $('targetMeta').textContent='Zone mondiale en préparation.';
        return;
      }
    }catch(globalErr){console.warn('HERIT global fallback',globalErr);}
    $('rnbStatus').textContent='RNB erreur';
    $('targetMeta').textContent=`Erreur RNB : ${e.message||e}`;
  }finally{state.loading=false;}
}
function startGPS(){
  if(!navigator.geolocation)throw new Error('GPS indisponible');
  state.watchId=navigator.geolocation.watchPosition(async p=>{
    state.position={lat:p.coords.latitude,lon:p.coords.longitude,accuracy:p.coords.accuracy};
    $('gps').textContent=`${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}`;
    $('accuracy').textContent=`±${Math.round(p.coords.accuracy)} m`;
    $('accuracyFact').textContent=`±${Math.round(p.coords.accuracy)} m`;
    await maybeReloadBuildings(false);updateTarget();
  },err=>{$('targetMeta').textContent=`Erreur GPS : ${err.message}`;},{
    enableHighAccuracy:true,maximumAge:1000,timeout:12000
  });
}
function labelFor(feature){
  const p=feature.properties||{};
  return p.address||p.adresse||p.rnb_id||p.id||feature.id||'Bâtiment';
}
function modeLabel(mode){
  if(mode==='ray')return'Intersection directe';
  if(mode==='point')return'Point RNB';
  return'Cône de secours';
}
const targetingHistory=[];
let stableTargetKey=null;
let stableSince=0;

function targetKey(hit){
  if(!hit)return null;
  const p=hit.feature?.properties||{};
  return String(p.rnb_id||p.gers_id||p.id||hit.feature?.id||labelFor(hit.feature));
}
function pushTargetSample(hit){
  const now=Date.now();
  targetingHistory.push({
    ts:now,
    key:targetKey(hit),
    heading:Number(state.heading),
    accuracy:Number(state.position?.accuracy||99),
    distance:Number(hit?.distance||999),
    angle:Number(hit?.angle||99)
  });
  while(targetingHistory.length && now-targetingHistory[0].ts>3500)targetingHistory.shift();
}
function stabilizationMetrics(hit){
  if(!hit||targetingHistory.length<3)return {stable:false,durationMs:0,consistency:0,headingSpread:99};
  const key=targetKey(hit);
  const same=targetingHistory.filter(x=>x.key===key);
  const consistency=same.length/targetingHistory.length;
  const hs=same.map(x=>x.heading).filter(Number.isFinite);
  let headingSpread=99;
  if(hs.length>=2){
    const base=hs[0];
    headingSpread=Math.max(...hs.map(h=>Math.abs(((h-base+540)%360)-180)));
  }
  if(key!==stableTargetKey){
    stableTargetKey=key;
    stableSince=Date.now();
  }
  const durationMs=Date.now()-stableSince;
  const stable=consistency>=0.8 && headingSpread<=4 && durationMs>=2500;
  return {stable,durationMs,consistency,headingSpread};
}
function confidenceFor(hit){
  if(!hit||!state.position)return null;
  const acc=Number(state.position.accuracy||20);
  let score=hit.mode==='ray'?96:hit.mode==='cone'?82:76;
  score-=Math.min(25,Math.max(0,acc-3)*1.7);
  score-=Math.min(18,(hit.angle||0)*1.4);

  const m=stabilizationMetrics(hit);
  if(m.consistency>=0.8)score+=4;
  if(m.headingSpread<=3)score+=4;
  if(m.stable)score+=6;
  if(acc>12)score-=8;
  if(acc>20)score-=10;

  return Math.max(25,Math.min(99,Math.round(score)));
}
function paintConfidence(score){
  const b=$('confidenceBadge');
  if(score==null){b.textContent='—';b.className='confidence neutral';return;}
  b.textContent=`${score}%`;
  b.className='confidence '+(score>=82?'good':score>=65?'medium':'low');
}
let scannerCardExpanded=false;
function setDetectedCardState(active){
  const card=document.querySelector('.targetCard');
  if(!card)return;
  card.classList.toggle('detectedCompact',!!active);
  card.classList.toggle('detectedExpanded',!!active&&scannerCardExpanded);
  const toggle=$('compactToggleBtn');
  if(toggle){
    toggle.classList.toggle('hidden',!active);
    toggle.textContent=scannerCardExpanded?'⌄':'⌃';
    toggle.setAttribute('aria-expanded',scannerCardExpanded?'true':'false');
  }
}
function updateTarget(){
  if(!state.position||state.heading==null)return;
  const hit=selectTarget({origin:state.position,heading:state.heading,features:state.features,maxDistance:180,fallbackConeDeg:9,pointConeDeg:7});
  pushTargetSample(hit);
  state.currentHit=hit||null;
  state.currentConfidence=confidenceFor(hit);
  paintConfidence(state.currentConfidence);

  const sm=stabilizationMetrics(hit);
  const sb=$('stabilizeBadge');
  if(sb){
    if(hit && !sm.stable){
      const left=Math.max(0,Math.ceil((2500-sm.durationMs)/1000));
      sb.textContent=left>0?('Stabilisation '+left+' s'):'Stabilisation…';
      sb.classList.remove('hidden');
    }else{
      sb.classList.add('hidden');
    }
  }

  if(!hit){
    setDetectedCardState(false);
    $('targetName').textContent='Aucun bâtiment';
    { const s=sourceFactEl(); if(s)s.textContent='—'; }
    $('targetMeta').textContent=state.features.length?'Vise une façade au centre de l’écran.':'Chargement des bâtiments autour de toi…';
    $('distanceFact').textContent='—';
    $('openBuildingBtn').classList.add('hidden');
  }else{
    setDetectedCardState(true);
    $('scannerHint')?.classList.add('hidden');
    const p=hit.feature.properties||{};
    $('targetName').textContent=labelFor(hit.feature);
    { const s=sourceFactEl(); if(s)s.textContent=p.rnb_id?'RNB':(p.source||'GLOBAL'); }
    const sm=stabilizationMetrics(hit);
    const acc=Number(state.position?.accuracy||99);
    let statusLabel='Cible probable';
    if(sm.stable && state.currentConfidence>=90 && acc<=5)statusLabel='Bâtiment identifié';
    else if(state.currentConfidence>=68)statusLabel='Bâtiment probable';
    $('targetMeta').textContent=statusLabel+' · '+(p.rnb_id?`RNB ${p.rnb_id}`:(p.gers_id||'source globale'));
    $('distanceFact').textContent=`${Math.round(hit.distance)} m`;
    $('openBuildingBtn').classList.remove('hidden');
  }
  $('debug').textContent=JSON.stringify({heading:state.heading,position:state.position,buildings:state.features.length,confidence:state.currentConfidence,hit:hit?{name:labelFor(hit.feature),rnb_id:hit.feature.properties?.rnb_id,distance:hit.distance,angle:hit.angle,mode:hit.mode}:null},null,2);
}
$('enterBtn').addEventListener('click',()=>{$('welcome').classList.add('hidden');$('scanner').classList.remove('hidden');});
$('startBtn').addEventListener('click',async()=>{
  try{
    $('startBtn').disabled=true;$('startBtn').textContent='Initialisation…';
    $('scannerHint')?.classList.add('hidden');
    { const s=sourceFactEl(); if(s)s.textContent='—'; }
    await Promise.all([startCamera(),requestOrientation()]);
    startGPS();
    $('sensorStatus').textContent='GPS en cours…';
    $('startBtn').classList.add('hidden');
    if($('reloadBtn')){ $('reloadBtn').classList.remove('disabledControl'); $('reloadBtn').disabled=false; $('reloadBtn').setAttribute('aria-disabled','false'); }
  }catch(e){
    $('scannerHint')?.classList.remove('hidden');
    $('sensorStatus').textContent='Erreur';$('targetMeta').textContent=e.message||String(e);
    $('startBtn').disabled=false;$('startBtn').textContent='Réessayer';
  }
});
$('reloadBtn').addEventListener('click',async()=>{
  if($('reloadBtn').disabled||!state.position)return;
  await maybeReloadBuildings(true);
});

// HERIT Lens 0.7 — mode métier, historique et favoris locaux
const STORAGE_MODE='herit.mode';
const STORAGE_SAVED='herit.savedBuildings';
const STORAGE_HISTORY='herit.history';

function getMode(){ return localStorage.getItem(STORAGE_MODE)||'Immobilier'; }
function setMode(mode){
  localStorage.setItem(STORAGE_MODE,mode);
  $('modeLabel').textContent=mode;
  $('scannerMode').textContent=mode;
  document.querySelectorAll('.modeList button').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
}
function readList(key){
  try{return JSON.parse(localStorage.getItem(key)||'[]');}catch{return[];}
}
function writeList(key,list){localStorage.setItem(key,JSON.stringify(list.slice(0,100)));}
function buildingSnapshot(){
  const hit=state.currentHit;
  if(!hit)return null;
  const p=hit.feature.properties||{};
  return {
    id:p.rnb_id||p.id||hit.feature.id||labelFor(hit.feature),
    label:labelFor(hit.feature),
    rnb_id:p.rnb_id||null,
    distance:Math.round(hit.distance),
    confidence:state.currentConfidence,
    mode:getMode(),
    scanned_at:new Date().toISOString()
  };
}
function upsertById(key,item){
  const list=readList(key).filter(x=>x.id!==item.id);
  list.unshift(item);writeList(key,list);return list;
}
function isSaved(id){return readList(STORAGE_SAVED).some(x=>x.id===id);}
function refreshSaveButton(){
  const item=buildingSnapshot(),btn=$('saveBuildingBtn');
  if(!btn||!item)return;
  const saved=isSaved(item.id);
  btn.textContent=saved?'Bâtiment surveillé':'Surveiller ce bâtiment';
  btn.classList.toggle('saved',saved);
}
function openModeSheet(){
  closeMenu();
  $('modeSheet').classList.remove('hidden');
  $('modeSheet').setAttribute('aria-hidden','false');
  setMode(getMode());
}
function closeModeSheet(){
  $('modeSheet').classList.add('hidden');
  $('modeSheet').setAttribute('aria-hidden','true');
}
$('modeBtn')?.addEventListener('click',openModeSheet);
$('closeMode')?.addEventListener('click',closeModeSheet);
$('modeBackdrop')?.addEventListener('click',closeModeSheet);
document.querySelectorAll('.modeList button').forEach(b=>b.addEventListener('click',()=>{
  setMode(b.dataset.mode);
  if($('modeSheet')?.classList.contains('firstRunActive')){
    const btn=$('confirmModeBtn');
    if(btn)btn.textContent='Continuer avec '+b.dataset.mode;
  }else{
    closeModeSheet();
  }
}));
$('saveBuildingBtn')?.addEventListener('click',()=>{
  const item=buildingSnapshot(); if(!item)return;
  const list=readList(STORAGE_SAVED);
  if(list.some(x=>x.id===item.id)) writeList(STORAGE_SAVED,list.filter(x=>x.id!==item.id));
  else upsertById(STORAGE_SAVED,item);
  refreshSaveButton();
});
const originalOpenSheet=openSheet;
openSheet=function(){
  originalOpenSheet();
  const item=buildingSnapshot();
  if(item)upsertById(STORAGE_HISTORY,item);
  refreshSaveButton();
};
setMode(getMode());

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=2.19-address2').catch(()=>{}));
}


// HERIT Lens 0.8 — reverse geocoding officiel, onboarding métier, séparation Free/Pro
const ADDRESS_CACHE='herit.addressCache';
const FIRST_RUN='herit.onboarded';

function geometryCenter(feature){
  const g=feature?.geometry;
  if(!g)return null;
  if(g.type==='Point')return {lon:g.coordinates[0],lat:g.coordinates[1]};
  let coords=[];
  if(g.type==='Polygon')coords=g.coordinates?.[0]||[];
  if(g.type==='MultiPolygon')coords=(g.coordinates||[]).flatMap(p=>p?.[0]||[]);
  if(!coords.length)return null;
  let lon=0,lat=0,n=0;
  for(const c of coords){if(Array.isArray(c)&&Number.isFinite(c[0])&&Number.isFinite(c[1])){lon+=c[0];lat+=c[1];n++;}}
  return n?{lon:lon/n,lat:lat/n}:null;
}
function readAddressCache(){try{return JSON.parse(localStorage.getItem(ADDRESS_CACHE)||'{}')}catch{return{}}}
function writeAddressCache(c){localStorage.setItem(ADDRESS_CACHE,JSON.stringify(c))}
async function addressFromRnb(feature){
  const p=feature?.properties||{};
  const id=p.rnb_id||feature?.id||p.id;
  if(!id)return null;
  try{
    const url='https://rnb-api.beta.gouv.fr/api/alpha/buildings/'+encodeURIComponent(id)+'/';
    const r=await fetchWithTimeout(url,{headers:{Accept:'application/json'},cache:'no-store'},4000);
    if(!r.ok)return null;
    const data=await r.json();
    const a=data.addresses?.[0]||data.address||null;
    if(!a)return null;
    const streetLine=[
      a.street_number||a.number||'',
      a.street_rep||a.rep||'',
      a.street||a.street_name||a.road||''
    ].filter(Boolean).join(' ').replace(/\s+/g,' ').trim();
    const label=a.full_address||a.label||a.address||a.street_address||streetLine||null;
    if(!label)return null;
    return {
      label,
      city:a.city||a.city_name||a.commune||'',
      postcode:a.postcode||a.postal_code||a.city_zipcode||'',
      citycode:a.city_insee_code||a.citycode||null,
      ban_id:a.ban_id||a.id||null,
      source:'RNB'
    };
  }catch{return null;}
}
async function reverseAddress(feature){
  const p=feature?.properties||{};
  const existing=p.address||p.adresse||null;
  if(existing)return {label:existing,city:p.city||p.commune||'',postcode:p.postcode||p.code_postal||'',source:'RNB'};
  const id=p.rnb_id||feature?.id||'unknown';
  const cache=readAddressCache(); if(cache[id])return cache[id];
  const c=geometryCenter(feature); if(!c)return null;
  try{
    const url=`https://data.geopf.fr/geocodage/reverse?lon=${encodeURIComponent(c.lon)}&lat=${encodeURIComponent(c.lat)}&limit=1`;
    const r=await fetchWithTimeout(url,{headers:{Accept:'application/json'},cache:'no-store'},5000);
    if(!r.ok)throw new Error('geocoding '+r.status);
    const data=await r.json();
    const f=data.features?.[0]||data.results?.[0]||null;
    if(!f)return null;
    const prop=f.properties||f;
    const result={
      label:prop.label||prop.name||prop.street||'Adresse proche',
      city:prop.city||prop.citycode||prop.municipality||'',
      postcode:prop.postcode||'',
      source:'BAN',
      ban_id:prop.id||prop.banId||null,
      citycode:prop.citycode||prop.city_code||null
    };
    cache[id]=result;writeAddressCache(cache);return result;
  }catch{return null;}
}
const MODE_MODULES={
  Immobilier:[
    ['Identité & adresse','RNB + BAN','free'],
    ['DPE & GES','Diagnostic énergétique','pro'],
    ['DVF & dernière mutation','Historique transactionnel','pro'],
    ['Comparables & valeur','Estimation HERIT','pro']
  ],
  Collectivité:[
    ['Identité RNB','Référentiel bâtiment','free'],
    ['Cadastre & parcelle','Lien bâtiment/parcelle','pro'],
    ['PLU & urbanisme','Zonage et règles','pro'],
    ['Contrôle terrain','Anomalies et remontées','pro']
  ],
  Rénovation:[
    ['Identité & adresse','Base bâtiment','free'],
    ['DPE & énergie','Performance connue','pro'],
    ['Risques','Argile, inondation, radon…','pro'],
    ['Potentiel travaux','Pré-analyse HERIT','pro']
  ],
  Investissement:[
    ['Identité & adresse','Base bâtiment','free'],
    ['Dernières ventes','DVF','pro'],
    ['Valeur & comparables','Analyse de marché','pro'],
    ['Opportunity Score','Scoring HERIT','pro']
  ]
};
function renderModeModules(){
  const root=$('modeModules'); if(!root)return;
  const rows=MODE_MODULES[getMode()]||MODE_MODULES.Immobilier;
  root.innerHTML=rows.map(([name,desc,tier])=>`<div class="moduleCard"><div><strong>${name}</strong><span>${desc}</span></div><span class="moduleTag ${tier}">${tier==='free'?'INCLUS':'PRO'}</span></div>`).join('');
}
const openSheet08=openSheet;
async function resolvePublicBuildingSheet(hit){
  const addressEl=$('sheetAddress'), localityEl=$('sheetLocality'), countryEl=$('sheetCountry');
  if(addressEl)addressEl.textContent='Recherche de l’adresse…';
  if(localityEl)localityEl.textContent='Résolution des sources publiques…';
  if(countryEl)countryEl.textContent='—';
  if(!hit?.feature)return;

  const deadline=new Promise(resolve=>setTimeout(()=>resolve({deadline:true}),6500));
  const sources=Promise.allSettled([
    addressFromRnb(hit.feature),
    reverseAddress(hit.feature),
    resolveBuildingGeoContext(hit.feature)
  ]).then(([rnbResult,banResult,geoResult])=>({
    rnbAddress:rnbResult.status==='fulfilled'?rnbResult.value:null,
    ban:banResult.status==='fulfilled'?banResult.value:null,
    geo:geoResult.status==='fulfilled'?geoResult.value:null
  }));
  const resolved=await Promise.race([sources,deadline]);
  if(resolved?.deadline){
    if(addressEl)addressEl.textContent='Adresse temporairement indisponible';
    if(localityEl)localityEl.textContent='Bâtiment identifié par son ID RNB · réessayer plus tard';
    if(countryEl)countryEl.textContent='—';
    return;
  }

  const {rnbAddress,ban,geo}=resolved;
  state.geoContext=geo||null;
  const a=rnbAddress||ban||(geo?{
    label:[geo.house_number,geo.road].filter(Boolean).join(' ')||geo.display_name,
    city:geo.city, postcode:geo.postcode, source:'OpenStreetMap / Nominatim'
  }:null);
  if(countryEl)countryEl.textContent=geo?.country||geo?.country_code||((rnbAddress||ban)?'France':'—');
  if(!a){
    if(addressEl)addressEl.textContent='Adresse non déterminée';
    if(localityEl)localityEl.textContent='Bâtiment identifié par son ID RNB';
    return;
  }
  state.banContext=a;
  if(addressEl)addressEl.textContent=a.label||'Adresse non disponible';
  if(localityEl)localityEl.textContent=[a.postcode,a.city].filter(Boolean).join(' ')||('Source '+(a.source||'publique'));
  const item=buildingSnapshot();
  if(item){item.label=a.label||item.label;item.address=a.label||null;upsertById(STORAGE_HISTORY,item);}
}
openSheet=async function(){
  openSheet08();
  renderModeModules();
  const hit=state.currentHit;
  await resolvePublicBuildingSheet(hit);
};
const setMode08=setMode;
setMode=function(mode){setMode08(mode);renderModeModules();};

function finishFirstRun(){
  localStorage.setItem(FIRST_RUN,'1');
  $('modeSheet')?.classList.remove('firstRunActive');
  $('modeOnboardingActions')?.classList.add('hidden');
  closeModeSheet();
}
function maybeFirstRun(){
  if(localStorage.getItem(FIRST_RUN))return;
  const sheet=$('welcomeOnboarding');
  if(!sheet)return;
  sheet.classList.remove('hidden');
  sheet.setAttribute('aria-hidden','false');
}
setTimeout(maybeFirstRun,300);


// HERIT Lens 0.9 — observations terrain structurées
const STORAGE_OBSERVATIONS='herit.observations';
let speechRecognition=null;

function observationBuildingId(){
  const hit=state.currentHit;if(!hit)return null;
  const p=hit.feature.properties||{};
  return p.rnb_id||p.id||hit.feature.id||labelFor(hit.feature);
}
function openObservation(){
  const id=observationBuildingId();if(!id)return;
  const p=state.currentHit.feature.properties||{};
  $('observationBuilding').textContent=p.rnb_id?('RNB '+p.rnb_id):labelFor(state.currentHit.feature);
  $('observationText').value='';
  $('voiceStatus').textContent='La dictée vocale utilise les capacités disponibles sur l’appareil. Si elle n’est pas prise en charge, saisissez le texte.';
  $('observationSheet').classList.remove('hidden');
  $('observationSheet').setAttribute('aria-hidden','false');
}
function closeObservation(){
  if(speechRecognition){try{speechRecognition.stop()}catch{}}
  $('observationSheet').classList.add('hidden');
  $('observationSheet').setAttribute('aria-hidden','true');
}
function saveObservation(){
  const text=$('observationText').value.trim();
  const id=observationBuildingId();
  if(!text||!id)return;
  const hit=state.currentHit,p=hit.feature.properties||{};
  const entry={
    observation_id:'obs_'+Date.now()+'_'+Math.random().toString(36).slice(2,8),
    building_id:id,
    rnb_id:p.rnb_id||null,
    building_label:labelFor(hit.feature),
    text:text,
    status:'declared',
    confidence_status:'to_verify',
    evidence:'none',
    visibility:'private',
    safety_status:'pending_review',
    source:'user_observation',
    professional_mode:getMode(),
    ui_locale:typeof currentLocale==='function'?currentLocale():document.documentElement.lang,
    speech_locale:typeof currentSpeechLocale==='function'?currentSpeechLocale():document.documentElement.lang,
    original_language:typeof currentSpeechLocale==='function'?currentSpeechLocale():document.documentElement.lang,
    building_country_code:state.geoContext?.country_code||null,
    building_country:state.geoContext?.country||null,
    created_at:new Date().toISOString(),
    targeting:{
      confidence:state.currentConfidence,
      distance_m:Math.round(hit.distance),
      gps_accuracy_m:state.position?Math.round(state.position.accuracy):null,
      heading_deg:state.heading!=null?Math.round(state.heading):null
    }
  };
  const list=readList(STORAGE_OBSERVATIONS);
  list.unshift(entry);writeList(STORAGE_OBSERVATIONS,list);
  $('voiceStatus').textContent='Observation enregistrée sur cet appareil avec provenance et statut « Déclarée · À vérifier ».';
  $('observationText').value='';
}
function startVoiceObservation(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){
    $('voiceStatus').textContent='Dictée vocale non disponible ici. Utilisez le clavier ou la dictée native de l’iPhone.';
    $('observationText').focus();
    return;
  }
  try{
    speechRecognition=new SR();
    speechRecognition.lang=currentSpeechLocale();
    speechRecognition.interimResults=true;
    speechRecognition.continuous=false;
    let finalText='';
    speechRecognition.onstart=()=>{
      $('voiceObservationBtn').classList.add('listening');
      $('voiceObservationBtn').textContent='● Écoute…';
      $('voiceStatus').textContent='Parlez naturellement. HERIT prépare une observation déclarative.';
    };
    speechRecognition.onresult=e=>{
      let interim='';
      for(let i=e.resultIndex;i<e.results.length;i++){
        const t=e.results[i][0].transcript;
        if(e.results[i].isFinal)finalText+=t+' '; else interim+=t;
      }
      $('observationText').value=(finalText+interim).trim();
    };
    speechRecognition.onerror=e=>{
      $('voiceStatus').textContent='Dictée interrompue : '+(e.error||'erreur')+'. Vous pouvez continuer au clavier.';
    };
    speechRecognition.onend=()=>{
      $('voiceObservationBtn').classList.remove('listening');
      $('voiceObservationBtn').textContent='🎙️ Dicter';
    };
    speechRecognition.start();
  }catch{
    $('voiceStatus').textContent='Impossible de lancer la dictée. Utilisez la dictée native du clavier iPhone.';
  }
}
$('addObservationBtn')?.addEventListener('click',openObservation);
$('closeObservation')?.addEventListener('click',closeObservation);
$('observationBackdrop')?.addEventListener('click',closeObservation);
$('saveObservationBtn')?.addEventListener('click',saveObservation);
$('voiceObservationBtn')?.addEventListener('click',startVoiceObservation);


// HERIT Lens 1.0 — internationalisation mondiale
const STORAGE_LOCALE='herit.locale';
const STORAGE_SPEECH_LOCALE='herit.speechLocale';
const GEO_CACHE_KEY='herit.geoContextCache';
let lastNominatimAt=0;

function currentLocale(){
  return localStorage.getItem(STORAGE_LOCALE)||getPreferredLocale();
}
function currentSpeechLocale(){
  return localStorage.getItem(STORAGE_SPEECH_LOCALE)||currentLocale();
}
function setSpeechLocale(locale){
  localStorage.setItem(STORAGE_SPEECH_LOCALE,locale);
  const label=localeLabel(locale);
  if($('speechLanguageLabel'))$('speechLanguageLabel').textContent=label;
  renderSpeechLanguageList(locale);
}
function readGeoCache(){try{return JSON.parse(localStorage.getItem(GEO_CACHE_KEY)||'{}')}catch{return{}}}
function writeGeoCache(v){localStorage.setItem(GEO_CACHE_KEY,JSON.stringify(v))}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
async function fetchWithTimeout(url,options={},timeoutMs=5000){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{return await fetch(url,{...options,signal:controller.signal});}
  finally{clearTimeout(timer);}
}
async function nominatimReverse(lat,lon){
  const key=lat.toFixed(5)+','+lon.toFixed(5);
  const cache=readGeoCache(); if(cache[key])return cache[key];
  const wait=Math.max(0,1100-(Date.now()-lastNominatimAt)); if(wait)await sleep(wait);
  lastNominatimAt=Date.now();
  const url='https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat='+encodeURIComponent(lat)+'&lon='+encodeURIComponent(lon)+'&accept-language='+encodeURIComponent(currentLocale());
  const r=await fetchWithTimeout(url,{headers:{Accept:'application/json'},cache:'no-store'},5000);
  if(!r.ok)throw new Error('Global geocoder '+r.status);
  const d=await r.json();
  const a=d.address||{};
  const out={
    display_name:d.display_name||'',
    country:a.country||'',
    country_code:(a.country_code||'').toUpperCase(),
    city:a.city||a.town||a.village||a.municipality||'',
    postcode:a.postcode||'',
    road:a.road||a.pedestrian||a.residential||'',
    house_number:a.house_number||'',
    provider:'OpenStreetMap / Nominatim'
  };
  cache[key]=out;writeGeoCache(cache);return out;
}
async function resolveBuildingGeoContext(feature){
  const c=geometryCenter(feature); if(!c)return null;
  try{return await nominatimReverse(c.lat,c.lon)}catch{return null}
}
function setLocale(locale){
  localStorage.setItem(STORAGE_LOCALE,locale);
  document.documentElement.lang=locale;
  const rtl=/^(ar|he|fa|ur)/i.test(locale);
  document.documentElement.dir=rtl?'rtl':'ltr';
  document.body.classList.toggle('rtl',rtl);
  $('languageLabel').textContent=localeLabel(locale);
  renderLanguageList(locale);
  applyTranslations(locale);
}
function renderLanguageList(active){
  const root=$('languageList'); if(!root)return;
  root.innerHTML=SUPPORTED_LANGUAGES.map(l=>'<button data-locale="'+l.code+'" class="'+(l.code===active?'active':'')+'"><strong>'+l.native+'</strong><small>'+l.name+'</small></button>').join('');
  root.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{setLocale(b.dataset.locale);closeLanguageSheet();}));
}
function renderSpeechLanguageList(active){
  const root=$('speechLanguageList');if(!root)return;
  root.innerHTML=SUPPORTED_LANGUAGES.map(l=>'<button data-locale="'+l.code+'" class="'+(l.code===active?'active':'')+'"><strong>'+l.native+'</strong><small>'+l.name+'</small></button>').join('');
  root.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{setSpeechLocale(b.dataset.locale);closeSpeechLanguageSheet();}));
}
function openSpeechLanguageSheet(){
  closeMenu();renderSpeechLanguageList(currentSpeechLocale());
  $('speechLanguageSheet').classList.remove('hidden');$('speechLanguageSheet').setAttribute('aria-hidden','false');
}
function closeSpeechLanguageSheet(){
  $('speechLanguageSheet').classList.add('hidden');$('speechLanguageSheet').setAttribute('aria-hidden','true');
}
function openLanguageSheet(){
  closeMenu();
  renderLanguageList(currentLocale());
  $('languageSheet').classList.remove('hidden');
  $('languageSheet').setAttribute('aria-hidden','false');
}
function closeLanguageSheet(){
  $('languageSheet').classList.add('hidden');
  $('languageSheet').setAttribute('aria-hidden','true');
}
$('languageBtn')?.addEventListener('click',openLanguageSheet);
$('closeLanguage')?.addEventListener('click',closeLanguageSheet);
$('languageBackdrop')?.addEventListener('click',closeLanguageSheet);
$('speechLanguageBtn')?.addEventListener('click',openSpeechLanguageSheet);
$('closeSpeechLanguage')?.addEventListener('click',closeSpeechLanguageSheet);
$('speechLanguageBackdrop')?.addEventListener('click',closeSpeechLanguageSheet);
setLocale(currentLocale());
setSpeechLocale(currentSpeechLocale());



// HERIT Lens 1.2 — compte et synchronisation cloud
let cloudSession=null;
let lastCloudScanKey=null;
state.currentCloudScanId=null;
state.currentCloudBuildingId=null;

function openAuthSheet(){
  closeMenu();
  $('authSheet').classList.remove('hidden');
  $('authSheet').setAttribute('aria-hidden','false');
}
function closeAuthSheet(){
  $('authSheet').classList.add('hidden');
  $('authSheet').setAttribute('aria-hidden','true');
}
function renderAuth(session){
  cloudSession=session||null;
  const user=session?.user;
  $('authSignedOut').classList.toggle('hidden',!!user);
  $('authSignedIn').classList.toggle('hidden',!user);
  $('accountLabel').textContent=user?'Connecté':'Se connecter';
  if(user)$('accountEmail').textContent=user.email||user.id;
}
async function initCloudAuth(){
  try{renderAuth(await cloudGetSession());}catch(e){$('authStatus').textContent='Cloud indisponible : '+(e.message||e);}
  cloudOnAuthChange((_event,session)=>renderAuth(session));
}
$('accountBtn')?.addEventListener('click',openAuthSheet);
$('closeAuth')?.addEventListener('click',closeAuthSheet);
$('authBackdrop')?.addEventListener('click',closeAuthSheet);
$('togglePasswordBtn')?.addEventListener('click',()=>{
  const input=$('authPassword'),btn=$('togglePasswordBtn');
  if(!input||!btn)return;
  const show=input.type==='password';
  input.type=show?'text':'password';
  btn.setAttribute('aria-pressed',show?'true':'false');
  btn.setAttribute('aria-label',show?'Masquer le mot de passe':'Afficher le mot de passe');
  btn.textContent=show?'🙈':'👁';
});
$('signInBtn')?.addEventListener('click',async()=>{
  const email=$('authEmail').value.trim(),password=$('authPassword').value;
  $('authStatus').textContent='Connexion…';
  $('resendConfirmBtn')?.classList.add('hidden');
  try{
    const s=await cloudSignIn(email,password);
    renderAuth(s);
    $('authStatus').textContent='Connecté à HERIT Cloud.';
  }catch(e){
    const msg=e?.message||String(e);
    if(/email not confirmed/i.test(msg)){
      $('authStatus').textContent='Votre e-mail n’est pas encore confirmé. Ouvrez le message reçu de HERIT puis cliquez sur le lien de confirmation.';
      $('resendConfirmBtn')?.classList.remove('hidden');
    }else{
      $('authStatus').textContent=msg;
    }
  }
});
$('resendConfirmBtn')?.addEventListener('click',async()=>{
  const email=$('authEmail').value.trim();
  if(!email){$('authStatus').textContent='Saisissez votre e-mail HERIT.';return;}
  $('authStatus').textContent='Envoi du nouvel e-mail de confirmation…';
  try{
    await cloudResendConfirmation(email);
    $('authStatus').textContent='E-mail de confirmation renvoyé. Vérifiez aussi le dossier Spam/Indésirables.';
  }catch(e){
    $('authStatus').textContent=e?.message||String(e);
  }
});
$('signUpBtn')?.addEventListener('click',async()=>{
  const email=$('authEmail').value.trim(),password=$('authPassword').value;
  $('authStatus').textContent='Création du compte…';
  try{
    const s=await cloudSignUp(email,password);
    renderAuth(s);
    $('authStatus').textContent=s?.user&&!s?.access_token?'Compte créé. Vérifiez votre e-mail si une confirmation est demandée.':'Compte HERIT créé.';
  }catch(e){$('authStatus').textContent=e.message||String(e);}
});
$('signOutBtn')?.addEventListener('click',async()=>{await cloudSignOut();renderAuth(null);$('authStatus').textContent='Déconnecté.';});

function buildingCloudPayload(){
  const hit=state.currentHit;if(!hit)return null;
  const p=hit.feature.properties||{},c=geometryCenter(hit.feature);
  if(!c)return null;
  const external=p.rnb_id?('rnb:'+p.rnb_id):('geo:'+c.lat.toFixed(6)+','+c.lon.toFixed(6));
  return {
    building:{
      external_key:external,
      country_code:state.geoContext?.country_code||null,
      primary_source:p.rnb_id?'RNB':'HERIT_TARGETING',
      primary_source_id:p.rnb_id||null,
      address_original:state.geoContext?.display_name||p.address||p.adresse||null,
      address_normalized:state.geoContext?.display_name||null,
      locality:state.geoContext?.city||null,
      postal_code:state.banContext?.postcode||state.geoContext?.postcode||null,
      ban_id:state.banContext?.ban_id||null,
      insee_code:state.banContext?.citycode||null,
      latitude:c.lat,longitude:c.lon
    },
    scan:{
      user_latitude:state.position?.lat??null,
      user_longitude:state.position?.lon??null,
      gps_accuracy_m:state.position?.accuracy??null,
      heading_deg:state.heading,
      distance_m:hit.distance,
      targeting_confidence:state.currentConfidence,
      detection_mode:hit.mode,
      device_locale:currentLocale(),
      speech_locale:currentSpeechLocale()
    }
  };
}
async function syncCurrentScan(){
  if(!cloudSession?.user||!state.currentHit)return;
  const payload=buildingCloudPayload();if(!payload)return;
  const key=payload.building.external_key;
  if(lastCloudScanKey===key&&state.currentCloudScanId)return;
  try{
    const result=await cloudIngestScan(payload);
    state.currentCloudScanId=result.scan_id||null;
    state.currentCloudBuildingId=result.building_id||null;
    lastCloudScanKey=key;
  }catch(e){console.warn('HERIT cloud scan sync',e);}
}
const openSheet12=openSheet;
openSheet=async function(){
  // Public identity is the critical path. Cloud/Pro enrichment is best-effort only.
  const localSheetPromise=Promise.resolve(openSheet12()).catch(e=>{
    console.warn('HERIT local sheet',e);
    if($('sheetAddress'))$('sheetAddress').textContent='Adresse temporairement indisponible';
    if($('sheetLocality'))$('sheetLocality').textContent='Le bâtiment reste utilisable via son ID RNB';
  });
  queueMicrotask(()=>Promise.allSettled([
    syncCurrentScan(),
    refreshBuildingFacts(),
    refreshConstructionHistory(),
    refreshFutureContext(),
    refreshOpportunityScore(),
    refreshBuildingBrief()
  ]));
  await localSheetPromise;
};

$('saveObservationBtn')?.addEventListener('click',()=>{
  setTimeout(async()=>{
    if(!cloudSession?.user)return;
    const list=readList(STORAGE_OBSERVATIONS),o=list[0]; if(!o||!state.currentHit)return;
    const payload=buildingCloudPayload(); if(!payload)return;
    try{
      await syncCurrentScan();
      await cloudIngestObservation({
        building_external_key:payload.building.external_key,
        scan_id:state.currentCloudScanId,
        text_original:o.text,
        original_language:o.original_language||currentSpeechLocale(),
        confidence_score:state.currentConfidence,
        professional_mode:getMode()
      });
    }catch(e){console.warn('HERIT cloud observation sync',e);}
  },0);
});
initCloudAuth();


async function syncCloudSavedState(saved){
  if(!cloudSession?.user||!state.currentCloudBuildingId)return;
  try{await cloudLibrary(saved?'save':'unsave',{building_id:state.currentCloudBuildingId});}
  catch(e){console.warn('HERIT cloud library sync',e);}
}
const saveBtnCloud=$('saveBuildingBtn');
if(saveBtnCloud){
  saveBtnCloud.addEventListener('click',()=>{
    setTimeout(async()=>{
      const item=buildingSnapshot(); if(!item)return;
      await syncCurrentScan();
      await syncCloudSavedState(isSaved(item.id));
    },0);
  });
}

async function refreshOpportunityScore(){
  const scoreEl=$('opportunityScore'),textEl=$('opportunityText');
  if(!scoreEl||!textEl)return;
  if(!cloudSession?.user){scoreEl.textContent='—';textEl.textContent='Connectez-vous pour calculer le potentiel de ce bâtiment.';return;}
  if(!state.currentCloudBuildingId){scoreEl.textContent='—';textEl.textContent='Synchronisation du bâtiment…';return;}
  scoreEl.textContent='…'; textEl.textContent='Analyse des données disponibles…';
  try{
    const r=await cloudOpportunity(state.currentCloudBuildingId,'real_estate');
    if(r.score_state!=='computed'){
      scoreEl.textContent='—';
      textEl.textContent='Données insuffisantes pour un score fiable. HERIT n’invente pas de note.';
      return;
    }
    scoreEl.textContent=Math.round(r.score)+'/100';
    const reasons=(r.reasons||[]).slice(0,2).map(x=>x.label).join(' · ');
    textEl.textContent=(reasons||'Score calculé')+' · confiance '+Math.round(r.confidence_score||0)+'%';
  }catch(e){
    scoreEl.textContent='—'; textEl.textContent='Score temporairement indisponible.';
    console.warn('HERIT opportunity score',e);
  }
}

$('addProspectBtn')?.addEventListener('click',async()=>{
  const btn=$('addProspectBtn');
  if(!cloudSession?.user){
    const original=btn.textContent;
    btn.textContent='Compte requis pour la synchro Pro';
    setTimeout(()=>{btn.textContent=original;},1800);
    return;
  }
  await syncCurrentScan();
  if(!state.currentCloudBuildingId)return;
  const original=btn.textContent; btn.disabled=true; btn.textContent='Ajout…';
  try{
    let data=await cloudProspects('list');
    let list=(data.lists||[])[0];
    if(!list){
      const created=await cloudProspects('create_list',{name:'Prospects',vertical:'real_estate'});
      list=created.list;
    }
    await cloudProspects('add',{list_id:list.id,building_id:state.currentCloudBuildingId});
    btn.textContent='Ajouté aux prospects';
    setTimeout(()=>{btn.textContent=original;btn.disabled=false;},1600);
  }catch(e){
    btn.textContent='Erreur — réessayer';btn.disabled=false;
    console.warn('HERIT prospect add',e);
  }
});


async function refreshBuildingFacts(){
  const textEl=$('buildingFactsText'),badge=$('buildingFactsBadge');
  if(!textEl||!badge)return;
  if(!cloudSession?.user){textEl.textContent='Connectez-vous pour enrichir ce bâtiment.';badge.textContent='DATA';return;}
  if(!state.currentCloudBuildingId){textEl.textContent='Synchronisation du bâtiment…';badge.textContent='…';return;}
  textEl.textContent='Interrogation des sources bâtimentaires…';badge.textContent='…';
  try{
    const country=String(state.geoContext?.country_code||'').toUpperCase();
    const r=country==='FR'
      ? await cloudEnrichBuilding(state.currentCloudBuildingId)
      : await cloudGlobalEnrich(state.currentCloudBuildingId);
    if(r.state!=='enriched'){
      badge.textContent='—';
      textEl.textContent=r.state==='adapter_not_active'
        ? 'Connecteur pays en préparation.'
        : 'Aucune donnée complémentaire fiable trouvée pour ce bâtiment.';
      return;
    }
    const f=r.facts||{},parts=[];
    if(f.dpe_class)parts.push('DPE '+f.dpe_class);
    if(f.construction_year)parts.push('Constr. '+f.construction_year);
    if(f.dwelling_count!=null)parts.push(f.dwelling_count+' log.');
    if(f.footprint_surface_m2!=null)parts.push(Math.round(Number(f.footprint_surface_m2))+' m² emprise');
    if(r.country==='GB')parts.push((r.planning_entities||0)+' contrainte(s) urbanisme');
    if(r.country==='NL'&&Array.isArray(r.facts))parts.push('BAG enrichi');
    if(r.country==='US'){
      if(r.flood_polygon_match===false)parts.push('Aucun polygone FEMA trouvé');
      if(r.flood_zone)parts.push('Zone FEMA '+r.flood_zone);
      if(r.sfha)parts.push('SFHA '+r.sfha);
    }
    badge.textContent=r.source==='nl-bag'?'BAG':r.source==='gb-planning'?'UK':r.source==='us-fema-nfhl'?'FEMA':'BDNB';
    textEl.textContent=(parts.length?parts.join(' · '):'Données officielles trouvées')+' · '+(r.source||r.source_name||'HERIT');
  }catch(e){
    badge.textContent='—';textEl.textContent='Enrichissement temporairement indisponible.';
    console.warn('HERIT enrichment',e);
  }
}


async function refreshFutureContext(){
  const textEl=$('futureContextText'),badge=$('futureContextBadge');
  if(!textEl||!badge)return;
  if(!cloudSession?.user){textEl.textContent='Connectez-vous pour ouvrir le Building Graph.';badge.textContent='GRAPH';return;}
  if(!state.currentCloudBuildingId){textEl.textContent='Synchronisation du bâtiment…';badge.textContent='…';return;}
  try{
    const r=await cloudBuildingContext(state.currentCloudBuildingId);
    const ctx=r?.context||{};
    const timeline=Array.isArray(ctx.timeline)?ctx.timeline.length:0;
    const components=Array.isArray(ctx.components)?ctx.components.length:0;
    const transactions=Array.isArray(ctx.transactions)?ctx.transactions.length:0;
    const anchors=Array.isArray(ctx.spatial_anchors)?ctx.spatial_anchors.length:0;
    badge.textContent='GRAPH';
    textEl.textContent=timeline+' événement'+(timeline>1?'s':'')+' · '+transactions+' transaction'+(transactions>1?'s':'')+' · '+components+' composant'+(components>1?'s':'')+' · '+anchors+' ancre'+(anchors>1?'s':'')+' spatiale'+(anchors>1?'s':'');
  }catch(e){
    badge.textContent='—';textEl.textContent='Building Graph temporairement indisponible.';
    console.warn('HERIT future context',e);
  }
}


async function refreshConstructionHistory(){
  const textEl=$('constructionHistoryText'),badge=$('constructionHistoryBadge');
  if(!textEl||!badge)return;
  if(!cloudSession?.user){
    textEl.textContent='Connectez-vous pour consulter les autorisations récentes.';
    badge.textContent='5 ANS';
    return;
  }
  if(!state.currentCloudBuildingId){
    textEl.textContent='Synchronisation du bâtiment…';
    badge.textContent='…';
    return;
  }
  try{
    const r=await cloudConstructionHistory(state.currentCloudBuildingId);
    const recent=Array.isArray(r?.recent_events)?r.recent_events:[];
    if(!recent.length){
      badge.textContent='0';
      textEl.textContent='Aucun événement SITADEL rattaché sur les 5 dernières années.';
      return;
    }
    const e=recent[0];
    const bits=[];
    if(e.authorization_type)bits.push(e.authorization_type);
    if(e.event_type)bits.push(e.event_type);
    if(e.event_date)bits.push(String(e.event_date).slice(0,10));
    if(e.housing_units!=null)bits.push(e.housing_units+' log.');
    badge.textContent=String(recent.length);
    textEl.textContent=bits.join(' · ')+' · source SITADEL/SDES';
  }catch(e){
    badge.textContent='—';
    textEl.textContent='Historique construction temporairement indisponible.';
    console.warn('HERIT construction history',e);
  }
}


function wireModuleCards(){
  const bind=(id,action)=>{
    const el=$(id); if(!el||el.dataset.wired==='1')return;
    el.dataset.wired='1'; el.setAttribute('role','button'); el.setAttribute('tabindex','0');
    const run=()=>action();
    el.addEventListener('click',run);
    el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();run();}});
  };
  bind('constructionHistoryCard',refreshConstructionHistory);
  bind('futureContextCard',refreshFutureContext);
}
wireModuleCards();

async function refreshBuildingBrief(){
  const card=$('buildingBriefCard'),title=$('buildingBriefTitle'),summary=$('buildingBriefSummary'),badge=$('buildingBriefBadge'),signals=$('buildingBriefSignals');
  if(!card||!title||!summary||!badge||!signals)return;
  if(!cloudSession?.user){
    title.textContent='Synthèse décisionnelle';
    summary.textContent='Connectez-vous pour générer le brief bâtiment.';
    badge.textContent='—%';signals.innerHTML='';return;
  }
  if(!state.currentCloudBuildingId){
    summary.textContent='Synchronisation du bâtiment…';badge.textContent='…';return;
  }
  try{
    const r=await cloudBuildingBrief(state.currentCloudBuildingId);
    title.textContent=r.title||'Synthèse décisionnelle';
    summary.textContent=r.summary||'Données insuffisantes pour une synthèse.';
    badge.textContent=Math.round(r.completeness||0)+'%';
    const items=[];
    for(const x of (r.highlights||[]).slice(0,3))items.push('<span class="briefSignal">'+escapeHtml(String(x))+'</span>');
    for(const x of (r.cautions||[]).slice(0,2))items.push('<span class="briefSignal caution">'+escapeHtml(String(x))+'</span>');
    if(!items.length)items.push('<span class="briefSignal muted">Données à compléter</span>');
    signals.innerHTML=items.join('');
  }catch(e){
    summary.textContent='Brief temporairement indisponible.';
    badge.textContent='—%';
    console.warn('HERIT building brief',e);
  }
}

let pendingOnboardingMode='Immobilier';
document.querySelectorAll('[data-onboard-mode]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    pendingOnboardingMode=btn.dataset.onboardMode||'Immobilier';
    document.querySelectorAll('[data-onboard-mode]').forEach(x=>x.classList.toggle('active',x===btn));
    const c=$('onboardingContinue');
    if(c)c.textContent='Continuer avec '+pendingOnboardingMode;
  });
});
function closeWelcomeOnboarding(){
  const sheet=$('welcomeOnboarding');
  if(sheet){sheet.classList.add('hidden');sheet.setAttribute('aria-hidden','true');}
  localStorage.setItem(FIRST_RUN,'1');
}
$('onboardingContinue')?.addEventListener('click',()=>{
  setMode(pendingOnboardingMode);
  closeWelcomeOnboarding();
});
$('onboardingSkip')?.addEventListener('click',()=>{
  setMode('Immobilier');
  closeWelcomeOnboarding();
});

$('compactToggleBtn')?.addEventListener('click',()=>{
  scannerCardExpanded=!scannerCardExpanded;
  setDetectedCardState(!!state.currentHit);
});
