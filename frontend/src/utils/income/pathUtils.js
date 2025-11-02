export function getNodeAtPath(obj, path) {
  if (!path) return obj;
  return path.split(".").reduce((cur, k) => (cur ? cur[k] : undefined), obj);
}

export function setNodeAtPath(obj, path, val) {
  const keys = path.split(".");
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!cur[k] || typeof cur[k] !== "object") cur[k] = {};
    cur = cur[k];
  }
  cur[keys.at(-1)] = val;
}
