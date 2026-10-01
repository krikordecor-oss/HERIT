import { selectTarget, normalizeHeading, haversineMeters } from './targeting.js';
import { loadBuildingsNear } from './buildings.js';

const $ = id => document.getElementById(id);
const state={position:null,heading:null,features:[],watchId:null,lastLoadPosition:null,loading:false,currentHit:null,currentConfidence:null};

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
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=0.7').catch(()=>{}));
}
