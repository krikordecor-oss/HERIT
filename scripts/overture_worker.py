#!/usr/bin/env python3
import json
import os
import subprocess
import tempfile
import urllib.request
import urllib.parse

BACKEND = "https://qzqqrwyaejtsbcwbrwue.supabase.co/functions/v1/overture-worker"
AUDIENCE = "herit-overture-worker"

def oidc_token():
    base = os.environ["ACTIONS_ID_TOKEN_REQUEST_URL"]
    sep = "&" if "?" in base else "?"
    req = urllib.request.Request(
        base + sep + "audience=" + urllib.parse.quote(AUDIENCE),
        headers={"Authorization": "Bearer " + os.environ["ACTIONS_ID_TOKEN_REQUEST_TOKEN"]},
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.load(response)["value"]

def post(token, payload):
    req = urllib.request.Request(
        BACKEND,
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers={
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json",
            "User-Agent": "HERIT-Overture-Worker/1.0",
        },
    )
    with urllib.request.urlopen(req, timeout=180) as response:
        return json.load(response)

def feature_bbox(feature):
    b = feature.get("bbox")
    if isinstance(b, list) and len(b) >= 4:
        return [float(x) for x in b[:4]]
    geom = feature.get("geometry") or {}
    coords = geom.get("coordinates")
    if not coords:
        return None

    xs, ys = [], []
    def walk(v):
        if isinstance(v, list):
            if len(v) >= 2 and isinstance(v[0], (int, float)) and isinstance(v[1], (int, float)):
                xs.append(float(v[0])); ys.append(float(v[1]))
            else:
                for x in v:
                    walk(x)
    walk(coords)
    if not xs:
        return None
    return [min(xs), min(ys), max(xs), max(ys)]

def centroid(b):
    if not b:
        return (None, None)
    return ((b[1] + b[3]) / 2, (b[0] + b[2]) / 2)

def main():
    token = oidc_token()
    claim = post(token, {"action": "claim"})
    job = claim.get("job")
    if not job:
        print("No queued Overture zone.")
        return

    request_id = job["id"]
    try:
        bb = job["bbox"]
        if not isinstance(bb, list) or len(bb) != 4:
            raise RuntimeError("invalid_bbox")
        bbox_arg = ",".join(str(float(x)) for x in bb)

        with tempfile.TemporaryDirectory() as td:
            output = os.path.join(td, "buildings.geojson")
            subprocess.run(
                [
                    "overturemaps", "download",
                    "--bbox=" + bbox_arg,
                    "-f", "geojson",
                    "--type=building",
                    "-o", output,
                ],
                check=True,
                timeout=600,
            )

            with open(output, "r", encoding="utf-8") as fh:
                data = json.load(fh)

            features = data.get("features", []) if isinstance(data, dict) else []
            buildings = []
            for f in features[:1500]:
                props = f.get("properties") or {}
                gers_id = f.get("id") or props.get("id")
                if not gers_id:
                    continue
                b = feature_bbox(f)
                lat, lon = centroid(b)
                buildings.append({
                    "gers_id": str(gers_id),
                    "country_code": job.get("country_code"),
                    "centroid_lat": lat,
                    "centroid_lon": lon,
                    "height_m": props.get("height"),
                    "num_floors": props.get("num_floors"),
                    "class": props.get("class"),
                    "subtype": props.get("subtype"),
                    "bbox": b,
                    "geometry": f.get("geometry"),
                    "source_record": {
                        "sources": props.get("sources"),
                        "version": props.get("version"),
                        "level": props.get("level"),
                        "has_parts": props.get("has_parts"),
                    },
                })

        result = post(token, {
            "action": "submit",
            "request_id": request_id,
            "buildings": buildings,
        })
        print(json.dumps({
            "request_id": request_id,
            "release_id": job.get("release_id"),
            "result_count": result.get("result_count", 0),
        }))
    except Exception as exc:
        try:
            post(token, {
                "action": "fail",
                "request_id": request_id,
                "error": str(exc),
            })
        finally:
            raise

if __name__ == "__main__":
    main()
