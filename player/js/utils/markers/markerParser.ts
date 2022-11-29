function parsePayloadLines(payload: string) {
  const lines = payload.split("\r\n");
  const keys = {};
  let line: string[];
  let keysCount = 0;
  for (const rawLine of lines) {
    line = rawLine.split(":");
    if (line.length === 2) {
      keys[line[0]!] = line[1]!.trim();
      keysCount += 1;
    }
  }
  if (keysCount === 0) throw new Error();

  return keys;
}

export default function markerParser(_markers) {
  const markers: { time: any; duration: any; payload: any }[] = [];
  for (const _marker of _markers) {
    const markerData: { time: any; duration: any; payload: any } = {
      time: _marker.tm,
      duration: _marker.dr,
      payload: undefined,
    };
    try {
      markerData.payload = JSON.parse(_marker.cm);
    } catch (_) {
      try {
        markerData.payload = parsePayloadLines(_marker.cm);
      } catch (__) {
        markerData.payload = { name: _marker.cm };
      }
    }
    markers.push(markerData);
  }
  return markers;
}
