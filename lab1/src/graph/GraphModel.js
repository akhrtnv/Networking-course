export class GraphModel {
  constructor(maxVertices = 10) {
    this.maxVertices = maxVertices;
    this.vertices = []; // [{ id, x, y, label }]
    this.edges = [];    // [{ from, to, weight }]
    this._nextId = 0;
  }

  get size() { return this.vertices.length; }

  findVertex(id) { return this.vertices.find(v => v.id === id); }

  getFreeId() {
    for (let id = 0; id < this.maxVertices; id++) {
      if (!this.findVertex(id)) return id;
    }
  }

  addVertex(x = 100 + Math.random() * 600, y = 100 + Math.random() * 400) {
    if (this.size >= this.maxVertices) return null;
    //const id = this._nextId++;
    const id = this.getFreeId()
    this.vertices.push({ id, x, y });
    return id;
  }

  removeVertex(id) {
    const idx = this.vertices.findIndex(v => v.id === id);
    if (idx === -1) return;
    this.vertices.splice(idx, 1);
    // Remove attached edges
    this.edges = this.edges.filter(e => e.from !== id && e.to !== id);
  }

  addEdge(from, to, weight = 1) {
    if (from === to) return;  // No self-loop for simplicity
    if (!this.findVertex(from) || !this.findVertex(to)) return;
    const existing = this.edges.find(e => e.from === from && e.to === to);
    if (existing) { existing.weight = weight; return; }
    this.edges.push({ from, to, weight: Number(weight) });
  }

  removeEdge(from, to) {
    this.edges = this.edges.filter(e => !(e.from === from && e.to === to));
  }

  setEdgeWeight(from, to, weight) {
    const e = this.edges.find(e => e.from === from && e.to === to);
    if (e) e.weight = Number(weight);
  }

  checkEdgeWeight(input) {
    if (input === null) return 'null';
    
    const s = input.trim();
    if (s === '') return 'empty';

    const n = Number(s.replace(',', '.'));
    if (!Number.isFinite(n)) {
      return 'not-a-num';
    } else if (n < 0) {
      return 'neg-weigth';
    } else {
      return 'correct';
    }
  }

  toMatrix() {
    const ids = this.vertices.map(v => v.id);
    const index = new Map(ids.map((id, i) => [id, i]));
    const n = ids.length;
    const M = Array.from({ length: n }, () => Array.from({ length: n }, () => Infinity));
    for (let i = 0; i < n; i++) M[i][i] = 0;
    for (const e of this.edges) {
      if (!index.has(e.from) || !index.has(e.to)) continue;
      M[index.get(e.from)][index.get(e.to)] = Number(e.weight);
    }
    return { matrix: M, order: ids }; // order: vertex id order
  }

  fromMatrix(M) {
    const n = Math.min(M.length, this.maxVertices);
    // Normalize vertices count to n
    this.vertices = [];
    this.edges = [];
    
    //this._nextId = 0;
    
    for (let i = 0; i < n; i++) this.addVertex(140 + (i%5)*120, 120 + Math.floor(i/5)*160);
    // Fill edges
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const w = M[i][j];
        if (w !== null && w !== "" && isFinite(Number(w))) {
          const weight = Number(w);
          if (weight >= 0) this.addEdge(i, j, weight);
        }
      }
    }
  }

  getAdjacencyList() {
    const n = this.size;
    const adj = new Map(this.vertices.map(v => [v.id, []]));
    for (const e of this.edges) {
      adj.get(e.from).push({ to: e.to, weight: e.weight });
    }
    return adj;
  }
}

