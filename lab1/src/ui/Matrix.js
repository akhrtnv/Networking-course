export class Matrix {
  constructor(container, model) {
    this.container = container;
    this.table = document.createElement('table');
    this.table.className = 'matrix';
    container.appendChild(this.table);
    this.size = 0;
    this.inputs = []; // 2D
    this.model = model;
    this.onChanged = null; // () => void
    this.onCellEdit = null; // (i,j,value:string) => void
    this._suspend = 0; // suppress events when syncing from model
    this._debounceTimer = null;
  }

  draw() {
    this.table.innerHTML = '';  // Delete page table
    const { matrix, order } = this.model.toMatrix();
    if (matrix.length === 0) { return };
    this._suspend++;
    try {
      // setSize triggers full table render to match matrix size
      this._drawTable(matrix.length, order);
      for (let i = 0; i < this.size; i++) {
        for (let j = 0; j < this.size; j++) {
          const val = matrix[i][j];
          this.inputs[i][j].value = (i === j) ? '0' : (isFinite(val) ? String(val) : '');
        }
      }
    } finally {
      this._suspend--;
    }
  }

  _drawTable(n, order) {
    this.size = n;
    this._render(order);
  }

  _render(order) {
    this.inputs = [];
    const cols = Math.max(1, this.size + 1);
    const cg = document.createElement('colgroup');
    const w = (100 / cols).toFixed(6) + '%';
    for (let i = 0; i < cols; i++) { const c = document.createElement('col'); c.style.width = w; cg.appendChild(c); }
    this.table.appendChild(cg);

    // Fill column headers
    const thead = document.createElement('thead');
    const hrow = document.createElement('tr');
    hrow.appendChild(document.createElement('th')); // Empty corner
    for (let i = 0; i < this.size; i++) {
      const th = document.createElement('th'); th.textContent = String(order[i]); th.className = 'header'; hrow.appendChild(th);
    }
    thead.appendChild(hrow);
    this.table.appendChild(thead);

    // Fill table body
    const tbody = document.createElement('tbody');
    for (let i = 0; i < this.size; i++) {
      const row = document.createElement('tr');
      const th = document.createElement('th'); th.textContent = String(order[i]); th.className = 'header'; row.appendChild(th);
      const rowInputs = [];
      for (let j = 0; j < this.size; j++) {
        const td = document.createElement('td');
        const input = document.createElement('input');
        input.placeholder = i === j ? '0' : '';
        if (i === j) { input.readOnly = true; td.className = 'diag'; }
        input.inputMode = 'numeric';
        // On user edits: update model and notify listeners
        input.addEventListener('input', () => this._handleInputDebounced(i, j, input));
        input.addEventListener('change', () => this._handleInput(i, j, input));
        td.appendChild(input);
        row.appendChild(td);
        rowInputs.push(input);
      }
      tbody.appendChild(row);
      this.inputs.push(rowInputs);
    }
    this.table.appendChild(tbody);
  }

  _handleInputDebounced(i, j, inputEl) {
    if (this._suspend) return;
    if (this._debounceTimer) clearTimeout(this._debounceTimer);
    const val = inputEl.value;
    this._debounceTimer = setTimeout(() => {
      this._applyCellEdit(i, j, val);
      if (this.onCellEdit) this.onCellEdit(i, j, val);
      if (this.onChanged) this.onChanged();
    }, 120);
  }

  _handleInput(i, j, inputEl) {
    if (this._suspend) return;
    const val = inputEl.value;
    this._applyCellEdit(i, j, val);
    if (this.onCellEdit) this.onCellEdit(i, j, val);
    if (this.onChanged) this.onChanged();
  }

  _applyCellEdit(i, j, rawVal) {
    if (!this.model) return;
    if (i === j) return; // diagonal is fixed
    const { order } = this.model.toMatrix();
    const from = order[i];
    const to = order[j];
    const s = String(rawVal).trim();
    if (s === '' || !isFinite(Number(s)) || Number(s) < 0) {
      this.model.removeEdge(from, to);
      this._suspend++;
      try { this.inputs[i][j].value = ''; } finally { this._suspend--; }
    } else {
      const w = Number(s);
      this.model.addEdge(from, to, w);
      this._suspend++;
      try { this.inputs[i][j].value = String(w); } finally { this._suspend--; }
    }
  }
}
