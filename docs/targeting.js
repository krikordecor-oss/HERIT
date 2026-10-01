const R = 6371000;
const toRad = d => d * Math.PI / 180;
const toDeg = r => r * 180 / Math.PI;

export function normalizeHeading(deg){ return ((deg % 360) + 360) % 360; }
export function angularDiff(a,b){ return Math.abs(((a-b+540)%360)-180); }

export function haversineMeters(a,b){
  const p1=toRad(a.lat), p2=toRad(b.lat), dp=toRad(b.lat-a.lat), dl=toRad(b.lon-a.lon);
  const s=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
  return 2*R*Math.asin(Math.sqrt(s));
}
export function bearingDeg(a,b){
  const p1=toRad(a.lat), p2=toRad(b.lat), dl=toRad(b.lon-a.lon);
  const y=Math.sin(dl)*Math.cos(p2);
  const x=Math.cos(p1)*Math.sin(p2)-Math.sin(p1)*Math.cos(p2)*Math.cos(dl);
  return normalizeHeading(toDeg(Math.atan2(y,x)));
}
export function toLocalMeters(origin, p){
  const lat0=toRad(origin.lat);
  return {
    x: toRad(p.lon-origin.lon)*R*Math.cos(lat0),
    y: toRad(p.lat-origin.lat)*R
  };
}
function raySegmentIntersection(dir, a, b){
  const sx=b.x-a.x, sy=b.y-a.y;
  const cross = dir.x*sy-dir.y*sx;
  if (Math.abs(cross) < 1e-9) return null;
  const t=(a.x*sy-a.y*sx)/cross;
  const u=(a.x*dir.y-a.y*dir.x)/cross;
  if (t >= 0 && u >= 0 && u <= 1) return t;
  return null;
}
function centroid(points){
  if (!points.length) return {x:0,y:0};
  const s=points.reduce((acc,p)=>({x:acc.x+p.x,y:acc.y+p.y}),{x:0,y:0});
  return {x:s.x/points.length,y:s.y/points.length};
}
function geometryRings(geometry){
  if (!geometry) return [];
  if (geometry.type === 'Polygon') return geometry.coordinates;
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.flat();
  return [];
}
function geometryPoints(geometry){
  if (!geometry) return [];
  if (geometry.type === 'Point') return [geometry.coordinates];
  if (geometry.type === 'MultiPoint') return geometry.coordinates;
  return [];
}
function coordinateToLatLon(c){ return { lon:c[0], lat:c[1] }; }

export function selectTarget({origin, heading, features, maxDistance=180, fallbackConeDeg=10, pointConeDeg=7}){
  const h=normalizeHeading(heading);
  const rad=toRad(h);
  const dir={x:Math.sin(rad), y:Math.cos(rad)};
  const direct=[];
  const fallback=[];

  for (const feature of features || []){
    const geometry=feature.geometry;
    const rings=geometryRings(geometry);
    const pointCoords=geometryPoints(geometry);

    if (rings.length){
      let bestT=Infinity;
      const all=[];
      for (const ring of rings){
        const pts=ring.map(c=>toLocalMeters(origin,coordinateToLatLon(c)));
        all.push(...pts);
        for (let i=0;i<pts.length-1;i++){
          const t=raySegmentIntersection(dir,pts[i],pts[i+1]);
          if (t!=null && t<bestT) bestT=t;
        }
      }
      const c=centroid(all);
      const cDist=Math.hypot(c.x,c.y);
      const cBearing=normalizeHeading(toDeg(Math.atan2(c.x,c.y)));
      const diff=angularDiff(h,cBearing);

      if (bestT<=maxDistance){
        direct.push({feature,distance:bestT,angle:diff,mode:'ray'});
      } else if (cDist<=maxDistance && diff<=fallbackConeDeg){
        fallback.push({feature,distance:cDist,angle:diff,score:cDist+diff*4,mode:'cone'});
      }
      continue;
    }

    for (const coord of pointCoords){
      const pt=toLocalMeters(origin,coordinateToLatLon(coord));
      const dist=Math.hypot(pt.x,pt.y);
      const b=normalizeHeading(toDeg(Math.atan2(pt.x,pt.y)));
      const diff=angularDiff(h,b);
      if (dist<=maxDistance && diff<=pointConeDeg){
        fallback.push({feature,distance:dist,angle:diff,score:dist+diff*5+12,mode:'point'});
      }
    }
  }

  direct.sort((a,b)=>a.distance-b.distance);
  if (direct[0]) return direct[0];
  fallback.sort((a,b)=>a.score-b.score);
  return fallback[0] || null;
}