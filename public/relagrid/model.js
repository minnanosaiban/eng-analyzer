/* RelaGrid: diagram data model + grid-reference helpers. */
(function (global) {
  'use strict';

  function colToNum(letters) {
    var n = 0;
    letters = letters.toUpperCase();
    for (var i = 0; i < letters.length; i++) {
      n = n * 26 + (letters.charCodeAt(i) - 64);
    }
    return n;
  }

  function numToCol(n) {
    var s = '';
    while (n > 0) {
      var r = (n - 1) % 26;
      s = String.fromCharCode(65 + r) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s;
  }

  function parseGridRef(ref) {
    var m = /^([A-Za-z]+)(\d+)$/.exec(ref.trim());
    if (!m) throw new Error('invalid grid reference "' + ref + '" (expected e.g. A1)');
    return { col: colToNum(m[1]), row: parseInt(m[2], 10) };
  }

  function formatGridRef(col, row) {
    return numToCol(col) + row;
  }

  function parseRange(range) {
    var parts = range.split(':');
    if (parts.length !== 2) throw new Error('invalid range "' + range + '" (expected e.g. A1:B2)');
    var a = parseGridRef(parts[0]);
    var b = parseGridRef(parts[1]);
    return {
      c1: Math.min(a.col, b.col), r1: Math.min(a.row, b.row),
      c2: Math.max(a.col, b.col), r2: Math.max(a.row, b.row)
    };
  }

  function formatRange(range) {
    return formatGridRef(range.c1, range.r1) + ':' + formatGridRef(range.c2, range.r2);
  }

  function createDefaultModel() {
    return {
      grid: { cols: 4, rows: 3 },
      theme: 'light',
      title: '',
      source: '',
      textScale: 1,
      zones: [],
      nodes: [],
      edges: [],
      notes: []
    };
  }

  function cloneModel(model) {
    return JSON.parse(JSON.stringify(model));
  }

  function nextId(model, prefix) {
    var existing = {};
    (model.nodes || []).forEach(function (n) { existing[n.id] = true; });
    var i = 1;
    while (existing[prefix + i]) i++;
    return prefix + i;
  }

  // 配列内で未使用の "<prefix><n>" を返す（edge / note / zone 用）。DSLパース後のID(edge1, edge2...)と形式をそろえる。
  function nextElementId(items, prefix) {
    var existing = {};
    (items || []).forEach(function (x) { existing[x.id] = true; });
    var i = 1;
    while (existing[prefix + i]) i++;
    return prefix + i;
  }

  function findNode(model, id) {
    for (var i = 0; i < model.nodes.length; i++) {
      if (model.nodes[i].id === id) return model.nodes[i];
    }
    return null;
  }

  function nodeAt(model, col, row) {
    for (var i = 0; i < model.nodes.length; i++) {
      if (model.nodes[i].col === col && model.nodes[i].row === row) return model.nodes[i];
    }
    return null;
  }

  global.RelaGrid = global.RelaGrid || {};
  global.RelaGrid.model = {
    colToNum: colToNum,
    numToCol: numToCol,
    parseGridRef: parseGridRef,
    formatGridRef: formatGridRef,
    parseRange: parseRange,
    formatRange: formatRange,
    createDefaultModel: createDefaultModel,
    cloneModel: cloneModel,
    nextId: nextId,
    nextElementId: nextElementId,
    findNode: findNode,
    nodeAt: nodeAt
  };
})(window);
