(function () {
var KEY = 'daybook.v1';
var COLOURS = 6;
var state = { tasks: [], filter: 'all', editing: null };
var $ = function (s) { return document.querySelector(s); };

function pad(n) { return String(n).padStart(2, '0'); }
function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function offset(n) { var d = new Date(); d.setDate(d.getDate() + n); return ymd(d); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }

function load() {
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) {
      var p = JSON.parse(raw);
      if (p && Array.isArray(p.tasks)) return p.tasks;
    }
  } catch (e) {}
  return null;
}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify({ tasks: state.tasks })); } catch (e) {}
}
function seed() {
  var now = Date.now();
  return [
    { id: uid(), text: 'Send the revised quote to Meera', done: false, due: offset(0), pri: 'high', color: 0, sample: true, created: now - 5 },
    { id: uid(), text: 'Pay the electricity bill', done: false, due: offset(-2), pri: 'high', color: 1, sample: true, created: now - 4 },
    { id: uid(), text: 'Book a dentist appointment', done: false, due: offset(1), pri: 'normal', color: 3, sample: true, created: now - 3 },
    { id: uid(), text: 'Plan the Saturday grocery run', done: false, due: offset(3), pri: 'low', color: 2, sample: true, created: now - 2 },
    { id: uid(), text: 'Call mum and wish her a happy birthday', done: false, due: '', pri: 'normal', color: 4, sample: true, created: now - 6 },
    { id: uid(), text: 'Reply to the landlord about the lease', done: true, due: offset(-1), pri: 'normal', color: 5, sample: true, created: now - 1 }
  ];
}

function find(id) { return state.tasks.filter(function (t) { return t.id === id; })[0]; }
function colourOf(t) { return typeof t.color === 'number' ? t.color % COLOURS : hash(t.id) % COLOURS; }

function dueInfo(due) {
  if (!due) return null;
  var today = ymd(new Date());
  var p = due.split('-').map(Number);
  var nice = new Date(p[0], p[1] - 1, p[2]).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  if (due < today) return { text: 'Overdue · ' + nice, cls: 'late' };
  if (due === today) return { text: 'Due today', cls: 'today' };
  if (due === offset(1)) return { text: 'Due tomorrow', cls: '' };
  return { text: 'Due ' + nice, cls: '' };
}

function sorted(arr) {
  return arr.slice().sort(function (a, b) {
    if (a.done !== b.done) return a.done ? 1 : -1;
    var ad = a.due || '9999', bd = b.due || '9999';
    if (ad !== bd) return ad < bd ? -1 : 1;
    return b.created - a.created;
  });
}

function el(tag, cls, text) {
  var n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function finishEdit(id, save, value) {
  if (state.editing !== id) return;
  state.editing = null;
  var t = find(id);
  if (save && t && value.trim()) { t.text = value.trim(); persist(); }
  render();
}

function metaFor(t) {
  var meta = el('div', 'meta');
  var di = dueInfo(t.due);
  if (di) meta.appendChild(el('span', 'chip ' + di.cls, di.text));
  if (t.pri === 'high') meta.appendChild(el('span', 'chip high', 'High'));
  if (t.pri === 'low') meta.appendChild(el('span', 'chip', 'Low'));
  return meta;
}

function buildNote(t) {
  var li = el('li', 'note c' + colourOf(t) + (t.done ? ' done' : ''));
  li.style.setProperty('--r', (((hash(t.id) % 7) - 3) * 0.7).toFixed(1) + 'deg');

  var top = el('div', 'top');
  var cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = t.done;
  cb.dataset.id = t.id;
  cb.setAttribute('aria-label', (t.done ? 'Mark not done: ' : 'Mark done: ') + t.text);
  top.appendChild(cb);
  top.appendChild(metaFor(t));
  li.appendChild(top);

  if (state.editing === t.id) {
    var ta = document.createElement('textarea');
    ta.className = 'edit-input';
    ta.value = t.text;
    ta.maxLength = 200;
    ta.setAttribute('aria-label', 'Edit note');
    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); finishEdit(t.id, true, ta.value); }
      else if (e.key === 'Escape') { e.preventDefault(); finishEdit(t.id, false, ''); }
    });
    ta.addEventListener('blur', function () { finishEdit(t.id, true, ta.value); });
    li.appendChild(ta);
  } else {
    li.appendChild(el('div', 'text', t.text));
  }

  var actions = el('div', 'actions');
  var edit = el('button', 'act', 'Edit');
  edit.type = 'button'; edit.dataset.act = 'edit'; edit.dataset.id = t.id;
  edit.setAttribute('aria-label', 'Edit ' + t.text);
  var del = el('button', 'act del', 'Delete');
  del.type = 'button'; del.dataset.act = 'del'; del.dataset.id = t.id;
  del.setAttribute('aria-label', 'Delete ' + t.text);
  actions.appendChild(edit); actions.appendChild(del);
  li.appendChild(actions);
  return li;
}

function render() {
  var total = state.tasks.length;
  var done = state.tasks.filter(function (t) { return t.done; }).length;
  var active = total - done;

  $('#c-all').textContent = total;
  $('#c-active').textContent = active;
  $('#c-done').textContent = done;
  document.querySelectorAll('.tab').forEach(function (b) {
    b.setAttribute('aria-pressed', String(b.dataset.filter === state.filter));
  });

  var pct = total ? Math.round(done / total * 100) : 0;
  $('#progress-text').textContent = total ? done + ' of ' + total + ' done' : 'No notes yet';
  $('#bar-fill').style.width = pct + '%';
  $('#bar').setAttribute('aria-valuenow', String(pct));

  $('#sample-note').hidden = !state.tasks.some(function (t) { return t.sample; });
  $('#clear-done').disabled = done === 0;
  $('#pdf-btn').disabled = total === 0;

  var shown = state.tasks.filter(function (t) {
    return state.filter === 'all' ? true : state.filter === 'done' ? t.done : !t.done;
  });
  var list = $('#list');
  list.textContent = '';
  if (!shown.length) {
    var li = el('li', 'empty');
    var title, body;
    if (!total) { title = 'The board is empty'; body = 'Write your first sticky note above.'; }
    else if (state.filter === 'done') { title = 'Nothing finished yet'; body = 'Tick a note and it will show up here.'; }
    else { title = 'All clear'; body = 'Every note is done.'; }
    li.appendChild(el('strong', null, title));
    li.appendChild(document.createTextNode(body));
    list.appendChild(li);
  } else {
    sorted(shown).forEach(function (t) { list.appendChild(buildNote(t)); });
  }

  if (state.editing) {
    var ei = list.querySelector('.edit-input');
    if (ei) { ei.focus(); ei.setSelectionRange(ei.value.length, ei.value.length); }
  }
}

function commit() { persist(); render(); }

function chosenColour() {
  var r = document.querySelector('input[name="note-colour"]:checked');
  return r ? Number(r.value) : 0;
}

/* PDF export: capture an off-screen copy of the whole board, then lay the notes out on A4 pages. */
function setStatus(msg) {
  var s = $('#pdf-status');
  s.textContent = msg || '';
  s.hidden = !msg;
}

function buildExportNote(t) {
  var n = el('div', 'note c' + colourOf(t) + (t.done ? ' done' : ''));
  var top = el('div', 'top');
  var tick = el('span', 'tick' + (t.done ? ' on' : ''));
  if (t.done) {
    tick.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  }
  top.appendChild(tick);
  top.appendChild(metaFor(t));
  n.appendChild(top);
  n.appendChild(el('div', 'text', t.text));
  return n;
}

async function buildPdf() {
  var JsPDF = window.jspdf && window.jspdf.jsPDF;
  if (!JsPDF || !window.html2canvas) throw new Error('PDF library missing');
  if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) {} }

  var root = el('div', 'export-root');
  root.id = 'export-root';
  var head = document.querySelector('header').cloneNode(true);
  head.querySelectorAll('[id]').forEach(function (n) { n.removeAttribute('id'); });
  root.appendChild(head);
  var grid = el('div', 'export-grid');
  sorted(state.tasks).forEach(function (t) {
    var cell = el('div', 'export-cell');
    cell.appendChild(buildExportNote(t));
    grid.appendChild(cell);
  });
  root.appendChild(grid);
  var mark = el('div', 'export-mark');
  mark.innerHTML = document.querySelector('.logo-mark').outerHTML;
  root.appendChild(mark);
  document.body.appendChild(root);

  try {
    var W = root.offsetWidth, H = root.offsetHeight;
    var scale = Math.max(1, Math.min(2, 14000 / H));
    var canvas = await window.html2canvas(root, {
      scale: scale, backgroundColor: null, logging: false, useCORS: true, windowWidth: 1000,
      onclone: function (doc) { var r = doc.getElementById('export-root'); if (r) r.style.left = '0px'; }
    });
    var k = canvas.width / W;
    function crop(x, y, w, h) {
      var c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(w * k));
      c.height = Math.max(1, Math.round(h * k));
      c.getContext('2d').drawImage(canvas, Math.round(x * k), Math.round(y * k), c.width, c.height, 0, 0, c.width, c.height);
      return c.toDataURL('image/png');
    }

    var PW = 210, PH = 297, M = 10, FOOT = 8;
    var mm = (PW - 2 * M) / W;
    var pdf = new JsPDF({ unit: 'mm', format: 'a4', compress: true });
    var pages = 0;
    function newPage() {
      if (pages > 0) pdf.addPage();
      pages++;
      pdf.setFillColor(237, 244, 250);
      pdf.rect(0, 0, PW, PH, 'F');
      pdf.setFillColor(200, 215, 229);
      for (var yy = 6; yy < PH; yy += 5.2) {
        for (var xx = 6; xx < PW; xx += 5.2) pdf.rect(xx, yy, 0.45, 0.45, 'F');
      }
      return M;
    }

    var y = newPage();
    pdf.addImage(crop(head.offsetLeft, head.offsetTop, head.offsetWidth, head.offsetHeight), 'PNG',
      M + head.offsetLeft * mm, y, head.offsetWidth * mm, head.offsetHeight * mm, undefined, 'FAST');
    y += head.offsetHeight * mm + 4;

    var cells = Array.prototype.slice.call(grid.children);
    for (var i = 0; i < cells.length; i += 3) {
      var row = cells.slice(i, i + 3);
      var rh = row[0].offsetHeight * mm;
      if (y + rh > PH - M - FOOT) y = newPage();
      row.forEach(function (c) {
        pdf.addImage(crop(c.offsetLeft, c.offsetTop, c.offsetWidth, c.offsetHeight), 'PNG',
          M + c.offsetLeft * mm, y, c.offsetWidth * mm, c.offsetHeight * mm, undefined, 'FAST');
      });
      y += rh;
    }

    var markImg = crop(mark.offsetLeft, mark.offsetTop, mark.offsetWidth, mark.offsetHeight);
    var total = pdf.getNumberOfPages();
    for (var p = 1; p <= total; p++) {
      pdf.setPage(p);
      pdf.addImage(markImg, 'PNG', M - 1.2, PH - 13, 9, 9, undefined, 'FAST');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(94, 98, 112);
      pdf.text('Sticky Board', M + 8, PH - 7.6);
      pdf.text('Page ' + p + ' of ' + total, PW - M, PH - 7.6, { align: 'right' });
    }
    return pdf.output('blob');
  } finally {
    root.remove();
  }
}

async function saveFile(blob, filename) {
  var inViewer = !!(window.claude && window.claude.use);
  var dl = null;
  if (inViewer) { try { dl = await window.claude.use('downloads'); } catch (e) { dl = null; } }
  if (dl) { await dl.save({ filename: filename, data: blob }); return; }
  if (inViewer) { var err = new Error('Downloads are not available in this view'); err.code = 'unavailable'; throw err; }
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
}

/* Events */
$('#pdf-btn').addEventListener('click', async function () {
  var btn = this;
  if (!state.tasks.length) return;
  btn.disabled = true;
  setStatus('Building your PDF...');
  try {
    var blob = await buildPdf();
    var name = 'sticky-board-' + ymd(new Date()) + '.pdf';
    await saveFile(blob, name);
    setStatus('PDF ready: ' + name);
  } catch (e) {
    if (e && e.code === 'declined') setStatus('Download cancelled.');
    else if (e && e.code === 'unavailable') setStatus('Saving files is not available in this view. Open the page in your browser to download the PDF.');
    else setStatus('Could not make the PDF. Check your connection and try again.');
  } finally {
    btn.disabled = state.tasks.length === 0;
  }
});

$('#composer').addEventListener('submit', function (e) {
  e.preventDefault();
  var input = $('#new-text');
  var text = input.value.trim();
  if (!text) { $('#form-error').hidden = false; input.focus(); return; }
  $('#form-error').hidden = true;
  var colour = chosenColour();
  state.tasks.push({
    id: uid(), text: text, done: false,
    due: $('#new-due').value || '', pri: $('#new-pri').value,
    color: colour, sample: false, created: Date.now()
  });
  input.value = '';
  $('#new-due').value = '';
  $('#new-pri').value = 'normal';
  var next = document.getElementById('sw' + ((colour + 1) % COLOURS));
  if (next) next.checked = true;
  if (state.filter === 'done') state.filter = 'all';
  commit();
  input.focus();
});
$('#new-text').addEventListener('input', function () { $('#form-error').hidden = true; });

$('#list').addEventListener('change', function (e) {
  var cb = e.target.closest('input[type="checkbox"]');
  if (!cb) return;
  var t = find(cb.dataset.id);
  if (t) { t.done = cb.checked; commit(); }
});
$('#list').addEventListener('click', function (e) {
  var b = e.target.closest('button[data-act]');
  if (!b) return;
  var id = b.dataset.id;
  if (b.dataset.act === 'del') {
    state.tasks = state.tasks.filter(function (t) { return t.id !== id; });
    if (state.editing === id) state.editing = null;
    commit();
  } else if (b.dataset.act === 'edit') {
    state.editing = id;
    render();
  }
});
$('#tabs').addEventListener('click', function (e) {
  var b = e.target.closest('.tab');
  if (!b) return;
  state.filter = b.dataset.filter;
  render();
});
$('#clear-done').addEventListener('click', function () {
  state.tasks = state.tasks.filter(function (t) { return !t.done; });
  commit();
});
$('#remove-samples').addEventListener('click', function () {
  state.tasks = state.tasks.filter(function (t) { return !t.sample; });
  commit();
});
document.addEventListener('keydown', function (e) {
  var tag = (e.target && e.target.tagName) || '';
  if (e.key === '/' && tag !== 'INPUT' && tag !== 'SELECT' && tag !== 'TEXTAREA') {
    e.preventDefault();
    $('#new-text').focus();
  }
});

/* Boot */
$('#today-label').textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
var saved = load();
if (saved === null) { state.tasks = seed(); persist(); } else { state.tasks = saved; }
render();
})();
