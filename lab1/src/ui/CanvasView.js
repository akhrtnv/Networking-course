const VERTEX_R = 18;

export class CanvasView {
  constructor(canvas, model) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.model = model;
    this.mode = 'idle';
    this.highlightPath = []; // [id]
    this.drag = { active: false, id: null, dx: 0, dy: 0 };
    this.pendingEdge = { from: null };
    this.start = null;
    this.end = null;
    this.onContextMenu = null;
    this.onChanged = null;

    this._setupResize();
    this._bindEvents();
    this.draw();
  }

  setMode(mode) {
    this.mode = mode
    // Cancel unfinished edge if leaving add-edge mode
    this.pendingEdge.from = null;
  }

  setStart(id) { this.start = id; this.draw(); }
  
  setEnd(id) { this.end = id; this.draw(); }

  setHighlight(path) { this.highlightPath = path || []; this.draw(); }

  _bindEvents() {
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const p = this._toCanvas(e);
      const hitV = this._hitVertex(p.x, p.y);
      const hitE = this._hitEdge(p.x, p.y);
      if (this.onContextMenu) this.onContextMenu({ x: e.offsetX, y: e.offsetY, hitV, hitE });
    });

    // Left button
    this.canvas.addEventListener('mousedown', (e) => {
      const p = this._toCanvas(e);
      const hitV = this._hitVertex(p.x, p.y);
      if (e.button === 0) {
        if (this.mode === 'add-edge') {
          if (this.pendingEdge.from === null && hitV) {
            this.pendingEdge.from = hitV.id;
            this._changed('edge-pending');
          } else if (this.pendingEdge.from !== null && hitV) {
            const raw = prompt('Вес дуги (неотрицательный)');
            const status = this.model.checkEdgeWeight(raw);
            if (status === 'correct') {
              this.model.addEdge(this.pendingEdge.from, hitV.id, Number(raw));
            }
            this.setMode('idle')
            this._changed(status);
          }
        } else if (hitV) {
          this.drag = { active: true, id: hitV.id, dx: p.x - hitV.x, dy: p.y - hitV.y };
        }
      }
    });

    // Left button released
    window.addEventListener('mouseup', () => { if (this.drag.active) { this.drag.active = false; this._changed('vertex-moved'); } });
    
    window.addEventListener('mousemove', (e) => {
      if (!this.drag.active) return;
      const p = this._toCanvas(e);
      const v = this.model.findVertex(this.drag.id);
      if (!v) return;
      v.x = p.x - this.drag.dx; v.y = p.y - this.drag.dy;
      this.draw();
    });
  }

  _changed(reason) { this.draw(); if (this.onChanged) this.onChanged(reason); }

  // Convert to canvas coordinates
  _toCanvas(e) {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const scaleX = (this.canvas.width / dpr) / rect.width;
    const scaleY = (this.canvas.height / dpr) / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  _hitVertex(x, y) {
    for (let i = this.model.vertices.length - 1; i >= 0; i--) {
      const v = this.model.vertices[i];
      const dx = x - v.x, dy = y - v.y;
      if (Math.hypot(dx, dy) <= VERTEX_R + 2) return v;
    }
    return null;
  }

  _hitEdge(x, y) {
    const thresh = 6;
    for (const e of this.model.edges) {
      const a = this.model.findVertex(e.from);
      const b = this.model.findVertex(e.to);
      if (!a || !b) continue;
      if (this._pointSegDist(x, y, a.x, a.y, b.x, b.y) <= thresh) return e;
    }
    return null;
  }

  // Check proximity to any directed edge line segment
  _pointSegDist(px, py, x1, y1, x2, y2) {
    const vx = x2 - x1, vy = y2 - y1;
    const wx = px - x1, wy = py - y1;
    const c1 = vx*wx + vy*wy;
    if (c1 <= 0) return Math.hypot(px - x1, py - y1);
    const c2 = vx*vx + vy*vy;
    if (c2 <= c1) return Math.hypot(px - x2, py - y2);
    const t = c1 / c2;
    const projx = x1 + t * vx, projy = y1 + t * vy;
    return Math.hypot(px - projx, py - projy);
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this._drawGrid();
    this._drawEdges();
    this._drawVertices();
  }

  _drawGrid() {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < this.canvas.width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.canvas.height); ctx.stroke(); }
    for (let y = 0; y < this.canvas.height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.canvas.width, y); ctx.stroke(); }
    ctx.restore();
  }

  _drawVertices() {
    const ctx = this.ctx;
    for (const v of this.model.vertices) {
      const isStart = this.start === v.id;
      const isEnd = this.end === v.id;
      const isNewEdgeVert = this.pendingEdge.from === v.id;
      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = isNewEdgeVert ? 'yellow' : isStart ? '#19c37d' : isEnd ? '#ff6b6b' : '#7aa2ff';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 6;
      ctx.arc(v.x, v.y, VERTEX_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#0a0d1c';
      ctx.font = 'bold 14px ui-sans-serif, system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(v.id), v.x, v.y);
    }
  }

  _drawEdges() {
    const ctx = this.ctx;
    const pathSet = new Set();
    for (let i = 0; i < this.highlightPath.length - 1; i++) {
      pathSet.add(`${this.highlightPath[i]}->${this.highlightPath[i+1]}`);
    }
    for (const e of this.model.edges) {
      const a = this.model.findVertex(e.from);
      const b = this.model.findVertex(e.to);
      if (!a || !b) continue;
      const key = `${e.from}->${e.to}`;
      const highlighted = pathSet.has(key);
      this._drawArrow(a.x, a.y, b.x, b.y, highlighted ? '#ffc857' : 'rgba(255,255,255,0.7)');
      // Weight label
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      ctx.save();
      ctx.fillStyle = highlighted ? '#ffc857' : 'rgba(255,255,255,0.8)';
      ctx.font = '13px ui-sans-serif, system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(String(e.weight), mx, my - 8);
      ctx.restore();
    }
  }

  _drawArrow(x1, y1, x2, y2, color) {
    const ctx = this.ctx;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    // Define points considering the radius of vertices
    const sx = x1 + Math.cos(angle) * VERTEX_R;
    const sy = y1 + Math.sin(angle) * VERTEX_R;
    const ex = x2 - Math.cos(angle) * (VERTEX_R + 6);
    const ey = y2 - Math.sin(angle) * (VERTEX_R + 6);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    // Arrowhead
    const ah = 10;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - ah * Math.cos(angle - Math.PI / 6), ey - ah * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(ex - ah * Math.cos(angle + Math.PI / 6), ey - ah * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  _setupResize() {
    const resize = () => {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));
      if (this.canvas.width !== w || this.canvas.height !== h) {
        this.canvas.width = w;
        this.canvas.height = h;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };
    this._ro = new ResizeObserver(() => { resize(); this.draw(); });
    this._ro.observe(this.canvas);
    resize();
  }
}
