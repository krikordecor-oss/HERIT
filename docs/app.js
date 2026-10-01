import { selectTarget, normalizeHeading, haversineMeters } from './targeting.js';
import { loadBuildingsNear } from './buildings.js';

const $ = id => document.getElementById(id);
const state={position:null,heading:null,features:[],watchId:null,lastLoadPosition:null,loading:false};

function openMenu(){
  $('drawer').classList.remove('hidden');
  $('drawer').setAttribute('aria-hidden','false');
}
function closeMenu(){
  $('drawer').classList.add('hidden');
  $('drawer').setAttribute('aria-hidden','true');
}
$('menuBtn').addEventListener('click',openMenu);
$('scannerMenuBtn').addEventListener('click',openMenu);
$('closeMenu').addEventListener('click',closeMenu);
$('drawerBackdrop').addEventListener('click',closeMenu);

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
  if(mode==='ray')return'intersection directe';
  if(mode==='point')return'point RNB';
  return'cône de secours';
}
function updateTarget(){
  if(!state.position||state.heading==null)return;
  const hit=selectTarget({origin:state.position,heading:state.heading,features:state.features,maxDistance:180,fallbackConeDeg:9,pointConeDeg:7});
  if(!hit){
    $('targetName').textContent='Aucun bâtiment';
    $('targetMeta').textContent=state.features.length?'Aucun bâtiment dans l’axe de visée.':'Chargement des bâtiments autour de toi…';
  }else{
    const p=hit.feature.properties||{};
    $('targetName').textContent=labelFor(hit.feature);
    $('targetMeta').textContent=`${Math.round(hit.distance)} m · ${modeLabel(hit.mode)}${p.rnb_id?` · RNB ${p.rnb_id}`:''}`;
  }
  $('debug').textContent=JSON.stringify({heading:state.heading,position:state.position,buildings:state.features.length,hit:hit?{name:labelFor(hit.feature),rnb_id:hit.feature.properties?.rnb_id,distance:hit.distance,angle:hit.angle,mode:hit.mode}:null},null,2);
}
$('enterBtn').addEventListener('click',()=>{
  $('welcome').classList.add('hidden');
  $('scanner').classList.remove('hidden');
});
$('startBtn').addEventListener('click',async()=>{
  try{
    $('startBtn').disabled=true;$('startBtn').textContent='Initialisation…';
    await Promise.all([startCamera(),requestOrientation()]);
    startGPS();$('sensorStatus').textContent='GPS en cours…';$('startBtn').textContent='HERIT Lens actif';
  }catch(e){
    $('sensorStatus').textContent='Erreur';$('targetMeta').textContent=e.message||String(e);
    $('startBtn').disabled=false;$('startBtn').textContent='Réessayer';
  }
});
$('reloadBtn').addEventListener('click',async()=>{await maybeReloadBuildings(true);});