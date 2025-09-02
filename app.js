let ModuleReady = null;

function initWasm() {
    if (typeof createModule !== 'function') {
        console.warn('createModule() не найден. Проверьте сборку operations.js');
        renderAll();
        return;
    }
    ModuleReady = createModule().then((m) => {
        // Если это сборка C-API, предоставим обёртки
        if (typeof m.cwrap === 'function') {
            m.rank = m.cwrap('rank_m', 'number', ['number']);
            m.createMatrix  = m.cwrap('create_matrix',  'number', ['number','number']);
            m.destroyMatrix = m.cwrap('destroy_matrix', null,     ['number']);
            m.getRows       = m.cwrap('get_rows',       'number', ['number']);
            m.getCols       = m.cwrap('get_cols',       'number', ['number']);
            m.setElement    = m.cwrap('set_element',    null,     ['number','number','number','number']);
            m.getElement    = m.cwrap('get_element',    'number', ['number','number','number']);
            m.add           = m.cwrap('add_m',          'number', ['number','number']);
            m.sub           = m.cwrap('sub_m',          'number', ['number','number']);
            m.mul           = m.cwrap('mul_m',          'number', ['number','number']);
            m.transpose     = m.cwrap('transpose_m',    'number', ['number']);
            m.det           = m.cwrap('det_m',          'number', ['number']);
            m.inv           = m.cwrap('inv_m',          'number', ['number']);
            m.power         = m.cwrap('power_m',        'number', ['number','number']);
        }
        window.MatrixModule = m;
        renderAll();
        return m;
    }).catch((e) => {
        console.error('WASM инициализация не удалась:', e);
        showError('Не удалось инициализировать WebAssembly. Проверьте operations.js.');
        renderAll();
    });
}

// UI bootstrap
function renderAll() {
    setupNav();
    showSection('operations');
    buildSizeControls();
    renderMatrices();
    renderOperationButtons();
}

function setupNav() {
    const btns = document.querySelectorAll('.nav-btn');
    btns.forEach(btn => btn.addEventListener('click', () => showSection(btn.dataset.target)));
}

function showSection(which){
    const sections = {
        operations: document.getElementById('operations-section'),
        guide:      document.getElementById('guide-section'),
        about:      document.getElementById('about-section'),
        learn:      document.getElementById('learn-section'),
    };
    Object.values(sections).forEach(s => s && (s.hidden = true));
    if (sections[which]) sections[which].hidden = false;
    // Теория видна только на главной
    if (sections.learn) sections.learn.hidden = (which !== 'operations');
}


function buildSizeControls() {
    const applyBtn = document.getElementById('apply-size');
    applyBtn?.addEventListener('click', () => {
        renderMatrices();
        clearResult();
    });
}

function matrixSizeA() {
    const r = clampInt(document.getElementById('rowsA-input')?.value, 1, 10, 2);
    const c = clampInt(document.getElementById('colsA-input')?.value, 1, 10, 2);
    return { rows: r, cols: c };
}
function matrixSizeB() {
    const r = clampInt(document.getElementById('rowsB-input')?.value, 1, 10, 2);
    const c = clampInt(document.getElementById('colsB-input')?.value, 1, 10, 2);
    return { rows: r, cols: c };
}
function clampInt(v, min, max, fallback) {
    const n = parseInt(v ?? '', 10);
    if (Number.isNaN(n)) return fallback;
    return Math.max(min, Math.min(max, n));
}

function renderMatrices() {
    const { rows: rA, cols: cA } = matrixSizeA();
    const { rows: rB, cols: cB } = matrixSizeB();
    renderMatrixGrid(document.getElementById('matrixA'), rA, cA, 'A');
    renderMatrixGrid(document.getElementById('matrixB'), rB, cB, 'B');
}

function renderMatrixGrid(container, rows, cols, name) {
    if (!container) return;
    container.innerHTML = '';

    // динамический «минимум» ширины ячейки
    const min = cols >= 10 ? 44 : (cols >= 8 ? 52 : 64);
    container.style.gridTemplateColumns = `repeat(${cols}, minmax(${min}px, 1fr))`;

    // компактный режим для крупных матриц
    container.classList.toggle('compact', cols >= 8);

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.step = 'any';
            input.value = '0';
            input.dataset.row = String(i);
            input.dataset.col = String(j);
            input.ariaLabel = `Элемент ${name}[${i + 1},${j + 1}]`;
            container.appendChild(input);
        }
    }
}

// Read matrices
function getMatrixData(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return { rows: 0, cols: 0, data: [] };
    const inputs = container.querySelectorAll('input');
    if (!inputs.length) return { rows: 0, cols: 0, data: [] };

    const rows = Math.max(...Array.from(inputs, input => parseInt(input.dataset.row))) + 1;
    const cols = Math.max(...Array.from(inputs, input => parseInt(input.dataset.col))) + 1;

    const data = Array.from({ length: rows }, () => Array(cols).fill(0));
    inputs.forEach(inp => {
        const r = parseInt(inp.dataset.row, 10);
        const c = parseInt(inp.dataset.col, 10);
        const val = parseFloat((inp.value || '0').replace(',', '.'));
        data[r][c] = Number.isFinite(val) ? val : 0;
    });
    return { rows, cols, data };
}

// Buttons
function renderOperationButtons() {
    const ops = document.getElementById('operations');
    ops.innerHTML = '';

    // Power controls
    const powerWrap = document.createElement('div');
    powerWrap.className = 'power-wrap';
    const powerLabel = document.createElement('label');
    powerLabel.textContent = 'Степень(k):';
    const powerInput = document.createElement('input');
    powerInput.type = 'number';
    powerInput.step = '1';
    powerInput.value = '2';
    powerInput.id = 'power-exp';
    powerInput.className = 'power-input';

    powerWrap.appendChild(powerLabel);
    powerWrap.appendChild(powerInput);
    ops.appendChild(powerWrap);

    const buttons = [
        { id: 'rank', label: 'rank(A)', handler: onRankA },
        { id: 'add', label: 'A + B', handler: onAdd },
        { id: 'sub', label: 'A − B', handler: onSub },
        { id: 'mul', label: 'A × B', handler: onMul },
        { id: 'transpose', label: 'Transpose(A)', handler: onTransposeA },
        { id: 'det', label: 'det(A)', handler: onDetA },
        { id: 'inv', label: 'A⁻¹', handler: onInvA },
        { id: 'pow', label: 'A^k', handler: onPowA },

    ];

    buttons.forEach(({ id, label, handler }) => {
        const btn = document.createElement('button');
        btn.className = 'op-btn';
        btn.id = `op-${id}`;
        btn.textContent = label;
        btn.addEventListener('click', handler);
        ops.appendChild(btn);
    });
}

function clearResult() {
    document.getElementById('result').innerHTML = '';
}
function showError(msg) {
    const box = document.createElement('div');
    box.className = 'error';
    box.textContent = msg;
    const result = document.getElementById('result');
    result.innerHTML = '';
    result.appendChild(box);
}
function showMatrix(matrix) {
    const result = document.getElementById('result');
    result.innerHTML = '';
    const el = renderPMatrix(matrix, matrix[0]?.length >= 8 ? 'compact' : '');
    result.appendChild(el);
}


async function ensureModule() {
    if (ModuleReady) { await ModuleReady; }
    return window.MatrixModule;
}

// Converters JS <-> WASM
function toWasmMatrix(mod, js) {
    const { rows, cols, data } = js;
    const ptr = mod.createMatrix(rows, cols);
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            mod.setElement(ptr, i, j, data[i][j]);
        }
    }
    return ptr;
}
function fromWasmMatrix(mod, ptr) {
    const rows = mod.getRows(ptr);
    const cols = mod.getCols(ptr);
    const out = Array.from({ length: rows }, () => Array(cols).fill(0));
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            out[i][j] = mod.getElement(ptr, i, j);
        }
    }
    return out;
}

// Handlers
async function onAdd() {
    try {
        const mod = await ensureModule();
        const A = getMatrixData('matrixA');
        const B = getMatrixData('matrixB');
        if (A.rows !== B.rows || A.cols !== B.cols) {
            showError('Для A + B размеры должны совпадать.');
            return;
        }
        const aPtr = toWasmMatrix(mod, A);
        const bPtr = toWasmMatrix(mod, B);
        const rPtr = mod.add(aPtr, bPtr);
        const out = fromWasmMatrix(mod, rPtr);
        showMatrix(out);
        mod.destroyMatrix(aPtr); mod.destroyMatrix(bPtr); mod.destroyMatrix(rPtr);
    } catch (e) { console.error(e); showError('Ошибка при сложении.'); }
}
async function onSub() {
    try {
        const mod = await ensureModule();
        const A = getMatrixData('matrixA');
        const B = getMatrixData('matrixB');
        if (A.rows !== B.rows || A.cols !== B.cols) {
            showError('Для A − B размеры должны совпадать.');
            return;
        }
        const aPtr = toWasmMatrix(mod, A);
        const bPtr = toWasmMatrix(mod, B);
        const rPtr = mod.sub(aPtr, bPtr);
        const out = fromWasmMatrix(mod, rPtr);
        showMatrix(out);
        mod.destroyMatrix(aPtr); mod.destroyMatrix(bPtr); mod.destroyMatrix(rPtr);
    } catch (e) { console.error(e); showError('Ошибка при вычитании.'); }
}
async function onMul() {
    try {
        const mod = await ensureModule();
        const A = getMatrixData('matrixA');
        const B = getMatrixData('matrixB');
        if (A.cols !== B.rows) {
            showError('Для A × B число столбцов A должно равняться числу строк B.');
            return;
        }
        const aPtr = toWasmMatrix(mod, A);
        const bPtr = toWasmMatrix(mod, B);
        const rPtr = mod.mul(aPtr, bPtr);
        const out = fromWasmMatrix(mod, rPtr);
        showMatrix(out);
        mod.destroyMatrix(aPtr); mod.destroyMatrix(bPtr); mod.destroyMatrix(rPtr);
    } catch (e) { console.error(e); showError('Ошибка при умножении.'); }
}
async function onTransposeA() {
    try {
        const mod = await ensureModule();
        const A = getMatrixData('matrixA');
        const aPtr = toWasmMatrix(mod, A);
        const rPtr = mod.transpose(aPtr);
        const out = fromWasmMatrix(mod, rPtr);
        showMatrix(out);
        mod.destroyMatrix(aPtr); mod.destroyMatrix(rPtr);
    } catch (e) { console.error(e); showError('Ошибка при транспонировании.'); }
}
async function onDetA() {
    try {
        const mod = await ensureModule();
        const A = getMatrixData('matrixA');
        if (A.rows !== A.cols) {
            showError('det(A): матрица должна быть квадратной.');
            return;
        }
        const aPtr = toWasmMatrix(mod, A);
        const d = mod.det(aPtr);
        clearResult();
        const el = document.createElement('div');
        el.textContent = `det(A) = ${d}`;
        document.getElementById('result').appendChild(el);
        mod.destroyMatrix(aPtr);
    } catch (e) { console.error(e); showError('Ошибка при детерминанте.'); }
}
async function onInvA() {
    try {
        const mod = await ensureModule();
        const A = getMatrixData('matrixA');
        if (A.rows !== A.cols) {
            showError('A⁻¹: матрица должна быть квадратной.');
            return;
        }
        const aPtr = toWasmMatrix(mod, A);
        const rPtr = mod.inv(aPtr);
        const out = fromWasmMatrix(mod, rPtr);
        showMatrix(out);
        mod.destroyMatrix(aPtr); mod.destroyMatrix(rPtr);
    } catch (e) { console.error(e); showError('Матрица, возможно, вырождена.'); }
}
async function onPowA() {
    try {
        const mod = await ensureModule();
        const A = getMatrixData('matrixA');
        if (A.rows !== A.cols) {
            showError('A^k: матрица должна быть квадратной.');
            return;
        }
        const k = parseInt(document.getElementById('power-exp').value || '2', 10);
        if (!Number.isFinite(k)) {
            showError('Введите целую степень k.');
            return;
        }
        const aPtr = toWasmMatrix(mod, A);
        const rPtr = mod.power(aPtr, k);
        const out = fromWasmMatrix(mod, rPtr);
        showMatrix(out);
        mod.destroyMatrix(aPtr); mod.destroyMatrix(rPtr);
    } catch (e) { console.error(e); showError('Ошибка при возведении в степень.'); }
}
async function onRankA() {
    try {
        const mod = await ensureModule();
        const A = getMatrixData('matrixA');
        const aPtr = toWasmMatrix(mod, A);
        const r = mod.rank(aPtr);
        clearResult();
        const el = document.createElement('div');
        el.textContent = `rank(A) = ${r}`;
        document.getElementById('result').appendChild(el);
        mod.destroyMatrix(aPtr);
    } catch (e) { console.error(e); showError('Ошибка при вычислении ранга.'); }
}
function renderPMatrix(data, cls = "") {
    const cols = data[0]?.length ?? 0;
    const wrap = document.createElement('span');
    wrap.className = `pmatrix ${cls}`.trim();
    wrap.innerHTML = `
    <span class="paren left">
      <svg viewBox="0 0 10 100" preserveAspectRatio="none">
        <path d="M8,2 C3,20 3,80 8,98" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </span>
    <span class="cells" style="--cols:${cols}">
      ${data.flat().map(v => `<span>${v}</span>`).join('')}
    </span>
    <span class="paren right">
      <svg viewBox="0 0 10 100" preserveAspectRatio="none">
        <path d="M2,2 C7,20 7,80 2,98" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </span>`;
    return wrap;
}
ModuleReady = createModule({
    locateFile: (path) => './' + path   // operations.wasm лежит рядом с operations.js
}).then(/* ... */);


window.addEventListener('load', initWasm);
