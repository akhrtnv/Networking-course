import assert from 'node:assert/strict';
import { GraphModel } from '../src/graph/GraphModel.js';
import { Dijkstra } from '../src/graph/Dijkstra.js';

function createGraph(n) {
  const g = new GraphModel(n);
  for (let i = 0; i < n; i++) g.addVertex(100 + i * 10, 100);
  return g;
}

async function test(name, fn) {
  try {
    await fn();
    console.log('✓', name);
  } catch (err) {
    console.error('✗', name);
    console.error(err && err.stack ? err.stack : err);
    process.exitCode = 1;
  }
}

// 1) Simple shortest path
await test('finds shortest path in simple graph', () => {
  const g = createGraph(3); // ids: 0,1,2
  g.addEdge(0, 1, 1);
  g.addEdge(0, 2, 5);
  g.addEdge(1, 2, 1);
  const res = Dijkstra(g, 0, 2);
  assert.equal(res.distance, 2);
  assert.deepEqual(res.path, [0, 1, 2]);
});

// 2) Start equals end
await test('returns zero distance when start==end', () => {
  const g = createGraph(1); // id: 0
  const res = Dijkstra(g, 0, 0);
  assert.equal(res.distance, 0);
  assert.deepEqual(res.path, [0]);
});

// 3) Missing vertices
await test('returns Infinity and empty path for missing vertices', () => {
  const g = createGraph(2); // ids: 0,1
  const res = Dijkstra(g, 0, 99);
  assert.equal(res.distance, Infinity);
  assert.deepEqual(res.path, []);
});

// 4) Disconnected graph
await test('returns Infinity when no path exists', () => {
  const g = createGraph(3); // 0,1,2
  g.addEdge(0, 1, 10);
  const res = Dijkstra(g, 0, 2);
  assert.equal(res.distance, Infinity);
  assert.deepEqual(res.path, []);
});

// 5) Negative edges are ignored
await test('ignores negative-weight edges for safety', () => {
  const g = createGraph(3);
  g.addEdge(0, 1, 1);
  g.addEdge(1, 2, -5); // should be ignored by dijkstra()
  g.addEdge(0, 2, 5);
  const res = Dijkstra(g, 0, 2);
  assert.equal(res.distance, 5);
  assert.deepEqual(res.path, [0, 2]);
});

// 6) Cycle handling
await test('handles cycles and still finds optimal path', () => {
  const g = createGraph(3);
  g.addEdge(0, 1, 2);
  g.addEdge(1, 0, 2);
  g.addEdge(1, 2, 2);
  g.addEdge(0, 2, 10);
  const res = Dijkstra(g, 0, 2);
  assert.equal(res.distance, 4);
  assert.deepEqual(res.path, [0, 1, 2]);
});

if (!process.exitCode) {
  console.log('\nAll Dijkstra tests passed.');
}
