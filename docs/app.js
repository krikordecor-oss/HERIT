import { I18N, SUPPORTED_LANGUAGES, getPreferredLocale, localeLabel, applyTranslations } from './i18n.js?v=1.0';
import { selectTarget, normalizeHeading, haversineMeters } from './targeting.js';
import { loadBuildingsNear } from './buildings.js';

const $ = id => document.getElementById(id);
const state={position:null,heading:null,features:[],watchId:null,lastLoadPosition:null,loading:false,currentHit:null,currentConfidence:null,geoContext:null};

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
  $('buildingSheet').classList.remove('hidden');
  $('buildingSheet').setAttribute('aria-hidden','false');
}
function closeSheet(){
  $('buildingSheet').classList.add('hidden');
  $('buildingSheet').setAttribute('aria-hidden','true');
}
$('openBuildingBtn').addEventListener('click',openSheet);
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
    state.lastLoadPosition={lat:state.position.lat,lon:state.position.lon};
    $('rnbStatus').textContent=`${state.features.length} bât.`;
    $('sensorStatus').textContent='RNB connecté';
    updateTarget();
  }catch(e){
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
function confidenceFor(hit){
  if(!hit||!state.position)return null;
  const acc=Number(state.position.accuracy||20);
  let score=hit.mode==='ray'?96:hit.mode==='cone'?82:76;
  score-=Math.min(25,Math.max(0,acc-3)*1.7);
  score-=Math.min(18,(hit.angle||0)*1.4);
  return Math.max(35,Math.min(98,Math.round(score)));
}
function paintConfidence(score){
  const b=$('confidenceBadge');
  if(score==null){b.textContent='—';b.className='confidence neutral';return;}
  b.textContent=`${score}%`;
  b.className='confidence '+(score>=82?'good':score>=65?'medium':'low');
}
function updateTarget(){
  if(!state.position||state.heading==null)return;
  const hit=selectTarget({origin:state.position,heading:state.heading,features:state.features,maxDistance:180,fallbackConeDeg:9,pointConeDeg:7});
  state.currentHit=hit||null;
  state.currentConfidence=confidenceFor(hit);
  paintConfidence(state.currentConfidence);

  if(!hit){
    $('targetName').textContent='Aucun bâtiment';
    $('targetMeta').textContent=state.features.length?'Vise une façade au centre de l’écran.':'Chargement des bâtiments autour de toi…';
    $('distanceFact').textContent='—';
    $('openBuildingBtn').classList.add('hidden');
  }else{
    const p=hit.feature.properties||{};
    $('targetName').textContent=labelFor(hit.feature);
    $('targetMeta').textContent=p.rnb_id?`RNB ${p.rnb_id}`:'Bâtiment identifié par le RNB';
    $('distanceFact').textContent=`${Math.round(hit.distance)} m`;
    $('openBuildingBtn').classList.remove('hidden');
  }
  $('debug').textContent=JSON.stringify({heading:state.heading,position:state.position,buildings:state.features.length,confidence:state.currentConfidence,hit:hit?{name:labelFor(hit.feature),rnb_id:hit.feature.properties?.rnb_id,distance:hit.distance,angle:hit.angle,mode:hit.mode}:null},null,2);
}
$('enterBtn').addEventListener('click',()=>{$('welcome').classList.add('hidden');$('scanner').classList.remove('hidden');});
$('startBtn').addEventListener('click',async()=>{
  try{
    $('startBtn').disabled=true;$('startBtn').textContent='Initialisation…';
    await Promise.all([startCamera(),requestOrientation()]);
    startGPS();
    $('sensorStatus').textContent='GPS en cours…';
    $('startBtn').classList.add('hidden');
  }catch(e){
    $('sensorStatus').textContent='Erreur';$('targetMeta').textContent=e.message||String(e);
    $('startBtn').disabled=false;$('startBtn').textContent='Réessayer';
  }
});
$('reloadBtn').addEventListener('click',async()=>{await maybeReloadBuildings(true);});

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
  btn.textContent=saved?'Bâtiment enregistré':'Enregistrer ce bâtiment';
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
document.querySelectorAll('.modeList button').forEach(b=>b.addEventListener('click',()=>{setMode(b.dataset.mode);closeModeSheet();}));
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
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=0.9').catch(()=>{}));
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
async function reverseAddress(feature){
  const p=feature?.properties||{};
  const existing=p.address||p.adresse||null;
  if(existing)return {label:existing,city:p.city||p.commune||'',postcode:p.postcode||p.code_postal||'',source:'RNB'};
  const id=p.rnb_id||feature?.id||'unknown';
  const cache=readAddressCache(); if(cache[id])return cache[id];
  const c=geometryCenter(feature); if(!c)return null;
  try{
    const url=`https://data.geopf.fr/geocodage/reverse?lon=${encodeURIComponent(c.lon)}&lat=${encodeURIComponent(c.lat)}&limit=1`;
    const r=await fetch(url,{headers:{Accept:'application/json'},cache:'no-store'});
    if(!r.ok)throw new Error('geocoding '+r.status);
    const data=await r.json();
    const f=data.features?.[0]||data.results?.[0]||null;
    if(!f)return null;
    const prop=f.properties||f;
    const result={
      label:prop.label||prop.name||prop.street||'Adresse proche',
      city:prop.city||prop.citycode||prop.municipality||'',
      postcode:prop.postcode||'',
      source:'BAN'
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
openSheet=async function(){
  openSheet08();
  renderModeModules();
  $('sheetAddress').textContent='Recherche de l’adresse…';
  $('sheetLocality').textContent='Source BAN / Géoplateforme';
  const hit=state.currentHit;if(!hit)return;
  state.geoContext=await resolveBuildingGeoContext(hit.feature);
  if($('sheetCountry'))$('sheetCountry').textContent=state.geoContext?.country||state.geoContext?.country_code||'—';
  const a=state.geoContext?.country_code==='FR' ? await reverseAddress(hit.feature) : (state.geoContext?{
    label:[state.geoContext.house_number,state.geoContext.road].filter(Boolean).join(' ')||state.geoContext.display_name,
    city:state.geoContext.city,
    postcode:state.geoContext.postcode,
    source:'OpenStreetMap / Nominatim'
  }:null);
  if(a){
    $('sheetAddress').textContent=a.label||'Adresse non disponible';
    $('sheetLocality').textContent=[a.postcode,a.city].filter(Boolean).join(' ')||'Base Adresse Nationale';
    const item=buildingSnapshot();
    if(item){
      item.label=a.label||item.label;
      item.address=a.label||null;
      upsertById(STORAGE_HISTORY,item);
    }
  }else{
    $('sheetAddress').textContent='Adresse non déterminée';
    $('sheetLocality').textContent='Le bâtiment reste identifié par son ID RNB';
  }
};
const setMode08=setMode;
setMode=function(mode){setMode08(mode);renderModeModules();};

function maybeFirstRun(){
  if(localStorage.getItem(FIRST_RUN))return;
  openModeSheet();
  const intro=document.querySelector('.modeIntro');
  if(intro)intro.textContent='Première utilisation : choisissez votre métier. Vous pourrez le changer à tout moment.';
  const finish=()=>localStorage.setItem(FIRST_RUN,'1');
  document.querySelectorAll('.modeList button').forEach(b=>b.addEventListener('click',finish,{once:true}));
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
async function nominatimReverse(lat,lon){
  const key=lat.toFixed(5)+','+lon.toFixed(5);
  const cache=readGeoCache(); if(cache[key])return cache[key];
  const wait=Math.max(0,1100-(Date.now()-lastNominatimAt)); if(wait)await sleep(wait);
  lastNominatimAt=Date.now();
  const url='https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat='+encodeURIComponent(lat)+'&lon='+encodeURIComponent(lon)+'&accept-language='+encodeURIComponent(currentLocale());
  const r=await fetch(url,{headers:{Accept:'application/json'},cache:'no-store'});
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

