/*
 * RelaGrid DSL parser.
 *
 * Grammar (one statement per line):
 *   grid <cols>x<rows>
 *   theme light|dark
 *   title "図のタイトル"        (canvas header)
 *   source "出典・参考"        (canvas footer, small)
 *   textscale 1.3            (title/label/note text size multiplier, 0.6-2.5, default 1)
 *   zone <A1:B2> ["label"] [color=<name>]
 *   node <id> <A1> [icon=<name>] [size=<n>] [color=<name>] ["label"]
 *   note <targetId> ["text"] [pos=top|bottom|left|right]
 *   <fromId> <op> <toId> ["label"] [style=solid|dashed] [width=<n>] [color=<name>]
 *     op is one of: -> <- <-> --
 *   # line comment (also allowed at end of a line, outside quotes)
 */
(function (global) {
  'use strict';

  var M = global.RelaGrid.model;
  var EDGE_OPS = ['<->', '->', '<-', '--'];
  var KEYWORDS = ['grid', 'theme', 'title', 'textscale', 'source', 'zone', 'node', 'note'];
  var ID_PATTERN = /^[A-Za-z_][A-Za-z0-9_-]*$/;
  var MAX_COLS = 26, MAX_ROWS = 30;

  // ノードIDとして使える名前か（空白・記号・予約語は不可）。GUIの入力検証でも使う。
  function isValidId(id) {
    return ID_PATTERN.test(id) && KEYWORDS.indexOf(id) === -1;
  }

  function stripComment(line) {
    var inQuotes = false;
    for (var i = 0; i < line.length; i++) {
      var c = line[i];
      if (c === '\\' && inQuotes) i++;   // 引用符内のエスケープ(\" や \\)は2文字を1単位として読み飛ばす
      else if (c === '"') inQuotes = !inQuotes;
      else if (c === '#' && !inQuotes) return line.slice(0, i);
    }
    return line;
  }

  function tokenize(line) {
    var tokens = [];
    var re = /"((?:[^"\\]|\\.)*)"|(\S+)/g;
    var m;
    while ((m = re.exec(line))) {
      if (m[1] !== undefined) tokens.push({ type: 'string', value: m[1].replace(/\\(["\\])/g, '$1') });
      else tokens.push({ type: 'word', value: m[2] });
    }
    return tokens;
  }

  function splitAttr(word) {
    var idx = word.indexOf('=');
    if (idx === -1) return null;
    return [word.slice(0, idx), word.slice(idx + 1)];
  }

  function parseGrid(tokens, model) {
    if (tokens.length < 2) throw new Error('grid requires a size, e.g. "grid 4x3"');
    var m = /^(\d+)x(\d+)$/i.exec(tokens[1].value);
    if (!m) throw new Error('invalid grid size "' + tokens[1].value + '" (expected e.g. 4x3)');
    var cols = parseInt(m[1], 10), rows = parseInt(m[2], 10);
    if (cols < 1 || rows < 1 || cols > MAX_COLS || rows > MAX_ROWS) {
      throw new Error('grid size out of range (' + cols + 'x' + rows + '; allowed 1-' + MAX_COLS + ' columns x 1-' + MAX_ROWS + ' rows)');
    }
    model.grid = { cols: cols, rows: rows };
  }

  function parseZone(tokens, model) {
    if (tokens.length < 2) throw new Error('zone requires a range, e.g. "zone A1:B2"');
    var range = M.parseRange(tokens[1].value);
    var label = '', color = 'slate';
    for (var i = 2; i < tokens.length; i++) {
      var t = tokens[i];
      if (t.type === 'string') label = t.value;
      else {
        var kv = splitAttr(t.value);
        if (kv && kv[0] === 'color') color = kv[1];
      }
    }
    model.zones.push({ id: 'zone' + (model.zones.length + 1), range: range, label: label, color: color });
  }

  function parseNode(tokens, model) {
    if (tokens.length < 3) throw new Error('node requires an id and position, e.g. "node api B1"');
    var id = tokens[1].value;
    if (tokens[1].type !== 'word' || !isValidId(id)) {
      throw new Error('invalid node id "' + id + '" (use letters, digits, _ or -, starting with a letter or _; reserved words are not allowed)');
    }
    if (M.findNode(model, id)) throw new Error('duplicate node id "' + id + '"');
    var pos = M.parseGridRef(tokens[2].value);
    var icon = 'box', size = 1, color = 'slate', label = id;
    for (var i = 3; i < tokens.length; i++) {
      var t = tokens[i];
      if (t.type === 'string') label = t.value;
      else {
        var kv = splitAttr(t.value);
        if (!kv) continue;
        if (kv[0] === 'icon') icon = kv[1];
        else if (kv[0] === 'size') size = parseFloat(kv[1]) || 1;
        else if (kv[0] === 'color') color = kv[1];
      }
    }
    model.nodes.push({ id: id, col: pos.col, row: pos.row, icon: icon, size: size, color: color, label: label });
  }

  function parseNote(tokens, model) {
    if (tokens.length < 2) throw new Error('note requires a target node id, e.g. \'note api "SLA 99.9%"\'');
    var target = tokens[1].value;
    var text = '', pos = 'right';
    for (var i = 2; i < tokens.length; i++) {
      var t = tokens[i];
      if (t.type === 'string') text = t.value;
      else {
        var kv = splitAttr(t.value);
        if (kv && kv[0] === 'pos') pos = kv[1];
      }
    }
    model.notes.push({ id: 'note' + (model.notes.length + 1), target: target, text: text, pos: pos });
  }

  function parseEdge(tokens, model) {
    if (tokens.length < 3 || tokens[0].type !== 'word' || tokens[2].type !== 'word') {
      throw new Error('unrecognized statement (expected a keyword or "<id> <op> <id>")');
    }
    var from = tokens[0].value, op = tokens[1].value, to = tokens[2].value;
    if (EDGE_OPS.indexOf(op) === -1) {
      throw new Error('unknown edge operator "' + op + '" (use one of -> <- <-> --)');
    }
    var label = '', style = 'solid', width = 1, color = 'slate';
    for (var i = 3; i < tokens.length; i++) {
      var t = tokens[i];
      if (t.type === 'string') label = t.value;
      else {
        var kv = splitAttr(t.value);
        if (!kv) continue;
        if (kv[0] === 'style') style = kv[1];
        else if (kv[0] === 'width') width = parseFloat(kv[1]) || 1;
        else if (kv[0] === 'color') color = kv[1];
      }
    }
    model.edges.push({ id: 'edge' + (model.edges.length + 1), from: from, to: to, op: op, label: label, style: style, width: width, color: color });
  }

  function parseDSL(text) {
    var model = M.createDefaultModel();
    var errors = [];
    var lines = (text || '').split('\n');
    lines.forEach(function (raw, idx) {
      var line = stripComment(raw).trim();
      if (!line) return;
      var tokens = tokenize(line);
      if (!tokens.length) return;
      var head = tokens[0].value;
      try {
        if (head === 'grid') parseGrid(tokens, model);
        else if (head === 'theme') model.theme = tokens[1] ? tokens[1].value : 'light';
        else if (head === 'title') model.title = tokens.slice(1).map(function (t) { return t.value; }).join(' ');
        else if (head === 'textscale') model.textScale = Math.min(2.5, Math.max(0.6, parseFloat(tokens[1] && tokens[1].value) || 1));
        else if (head === 'source') model.source = tokens.slice(1).map(function (t) { return t.value; }).join(' ');
        else if (head === 'zone') parseZone(tokens, model);
        else if (head === 'node') parseNode(tokens, model);
        else if (head === 'note') parseNote(tokens, model);
        else parseEdge(tokens, model);
      } catch (e) {
        errors.push({ line: idx + 1, message: e.message, text: raw });
      }
    });

    var warnings = [];
    var nodeIds = {};
    model.nodes.forEach(function (n) { nodeIds[n.id] = true; });
    var RGns = global.RelaGrid;
    function has(obj, key) { return !!obj && Object.prototype.hasOwnProperty.call(obj, key); }
    function checkColor(name, what) {
      if (RGns.colorNames && RGns.colorNames.indexOf(name) === -1) warnings.push(what + ' has unknown color "' + name + '" (using slate)');
    }
    if (model.theme !== 'light' && model.theme !== 'dark') warnings.push('unknown theme "' + model.theme + '" (using light)');
    model.zones.forEach(function (z) { checkColor(z.color, 'zone ' + M.formatRange(z.range)); });
    model.nodes.forEach(function (n) {
      if (RGns.icons && !has(RGns.icons, n.icon)) warnings.push('node "' + n.id + '" has unknown icon "' + n.icon + '" (using box)');
      checkColor(n.color, 'node "' + n.id + '"');
    });
    model.edges.forEach(function (e) {
      checkColor(e.color, 'edge ' + e.from + ' ' + e.op + ' ' + e.to);
      if (e.style !== 'solid' && e.style !== 'dashed') warnings.push('edge ' + e.from + ' ' + e.op + ' ' + e.to + ' has unknown style "' + e.style + '" (using solid)');
    });
    model.notes.forEach(function (n) {
      if (['top', 'bottom', 'left', 'right'].indexOf(n.pos) === -1) warnings.push('note for "' + n.target + '" has unknown pos "' + n.pos + '" (using right)');
    });

    var cellOwner = {};
    model.nodes.forEach(function (n) {
      var key = n.col + ',' + n.row;
      if (cellOwner[key]) warnings.push('nodes "' + cellOwner[key] + '" and "' + n.id + '" share the same cell ' + M.formatGridRef(n.col, n.row));
      else cellOwner[key] = n.id;
      if (n.col < 1 || n.row < 1 || n.col > model.grid.cols || n.row > model.grid.rows) {
        warnings.push('node "' + n.id + '" is outside the grid (' + M.formatGridRef(n.col, n.row) + ')');
      }
    });
    model.edges.forEach(function (e) {
      if (e.from === e.to) warnings.push('edge "' + e.from + '" connects a node to itself (not drawn)');
      if (!nodeIds[e.from]) warnings.push('edge references unknown node "' + e.from + '"');
      if (!nodeIds[e.to]) warnings.push('edge references unknown node "' + e.to + '"');
    });
    model.notes.forEach(function (n) {
      if (!nodeIds[n.target]) warnings.push('note references unknown node "' + n.target + '"');
    });

    return { model: model, errors: errors, warnings: warnings };
  }

  global.RelaGrid = global.RelaGrid || {};
  global.RelaGrid.parseDSL = parseDSL;
  global.RelaGrid.EDGE_OPS = EDGE_OPS;
  global.RelaGrid.isValidId = isValidId;
  global.RelaGrid.GRID_LIMITS = { cols: MAX_COLS, rows: MAX_ROWS };
})(window);
