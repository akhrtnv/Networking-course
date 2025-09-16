export function Dijkstra(graph, startId, endId) {
  const vertices = graph.vertices.map(v => v.id);
  if (!vertices.includes(startId) || !vertices.includes(endId)) {
    return { distance: Infinity, path: [], prev: new Map(), visited: new Set() };
  }

  const adj = graph.getAdjacencyList();
  const dist = new Map(vertices.map(id => [id, Infinity]));
  const prev = new Map(vertices.map(id => [id, null]));
  const visited = new Set();
  dist.set(startId, 0);

  while (visited.size < vertices.length) {
    let u = null;
    let best = Infinity;
    for (const id of vertices) {
      if (!visited.has(id) && dist.get(id) < best) { best = dist.get(id); u = id; }
    }
    if (u === null || best === Infinity) break;
    visited.add(u);
    for (const { to, weight } of adj.get(u)) {
      if (weight < 0) continue; // ignore negative weights for safety
      const alt = dist.get(u) + weight;
      if (alt < dist.get(to)) {
        dist.set(to, alt);
        prev.set(to, u);
      }
    }
  }

  // Build path
  const path = [];
  if (dist.get(endId) !== Infinity) {
    let cur = endId;
    while (cur !== null) { path.push(cur); cur = prev.get(cur); }
    path.reverse();
  }
  return { distance: dist.get(endId), path, prev, visited };
}

