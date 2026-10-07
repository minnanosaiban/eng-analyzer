/* RelaGrid: model -> live SVG renderer. */
(function (global) {
  'use strict';

  var RG = global.RelaGrid;
  var M = RG.model;
  var SVGNS = 'http://www.w3.org/2000/svg';

  var LAYOUT = {
    cellW: 168, cellH: 132, marginX: 80, marginY: 68, baseR: 26
  };
  RG.LAYOUT = LAYOUT;

  function el(tag, attrs) {
    var e = document.createElementNS(SVGNS, tag);
    if (attrs) {
      for (var k in attrs) {
        if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
      }
    }
    return e;
  }

  // 文字倍率（DSLの textscale）。未設定・不正値は1。
  function textScaleOf(model) {
    var s = Number(model && model.textScale);
    return s > 0 ? s : 1;
  }

  // DOMなしで幅を見積もる（全角=font-size、半角=0.56倍）。タイトル・出典の折り返し用。
  function estimateWidth(str, size) {
    var w = 0;
    for (var i = 0; i < str.length; i++) w += str.charCodeAt(i) > 255 ? size : size * 0.56;
    return w;
  }
  function wrapText(text, size, maxWidth) {
    var lines = [], cur = '';
    String(text || '').split('\\n').forEach(function (para) {   // DSLでは改行を \n（バックスラッシュ+n）と書く（noteと同じ）
      cur = '';
      for (var i = 0; i < para.length; i++) {
        var next = cur + para.charAt(i);
        if (cur && estimateWidth(next, size) > maxWidth) { lines.push(cur); cur = para.charAt(i); }
        else cur = next;
      }
      lines.push(cur);
    });
    return lines;
  }

  function computeLayout(model) {
    var cols = Math.max(1, model.grid.cols), rows = Math.max(1, model.grid.rows);
    var ts = textScaleOf(model);
    var width = LAYOUT.marginX * 2 + cols * LAYOUT.cellW;
    var titleFont = 20 * ts, titleLineH = titleFont * 1.35;
    var sourceFont = 11 * ts, sourceLineH = sourceFont * 1.45;
    // 図が細長い（縦版など）ときにタイトル・出典がはみ出さないよう、幅に合わせて折り返す。
    var titleLines = model.title ? wrapText(model.title, titleFont * 1.05, width - 60) : [];
    var sourceLines = model.source ? wrapText(model.source, sourceFont, width - 40) : [];
    var titleH = titleLines.length ? Math.round(titleLines.length * titleLineH + 17) : 0;
    var sourceH = sourceLines.length ? Math.round(sourceLines.length * sourceLineH + 6) : 0;
    var top = LAYOUT.marginY + titleH;
    var height = top + rows * LAYOUT.cellH + LAYOUT.marginY + sourceH;
    return {
      cols: cols, rows: rows, width: width, height: height, top: top,
      ts: ts, titleFont: titleFont, titleLineH: titleLineH, titleLines: titleLines,
      sourceFont: sourceFont, sourceLineH: sourceLineH, sourceLines: sourceLines,
      cellCenter: function (col, row) {
        return {
          x: LAYOUT.marginX + (col - 0.5) * LAYOUT.cellW,
          y: top + (row - 0.5) * LAYOUT.cellH
        };
      },
      cellTopLeft: function (col, row) {
        return { x: LAYOUT.marginX + (col - 1) * LAYOUT.cellW, y: top + (row - 1) * LAYOUT.cellH };
      },
      pointToCell: function (x, y) {
        var col = Math.floor((x - LAYOUT.marginX) / LAYOUT.cellW) + 1;
        var row = Math.floor((y - top) / LAYOUT.cellH) + 1;
        col = Math.min(Math.max(col, 1), cols);
        row = Math.min(Math.max(row, 1), rows);
        return { col: col, row: row };
      }
    };
  }
  RG.computeLayout = computeLayout;

  function ensureMarkers(defs, theme, usedColors) {
    var made = {};
    usedColors.forEach(function (name) {
      var c = RG.getColor(theme, name);
      ['end', 'start'].forEach(function (dir) {
        var id = 'arrow-' + dir + '-' + name;
        if (made[id]) return;
        made[id] = true;
        var marker = el('marker', {
          id: id, viewBox: '0 0 10 10', refX: dir === 'end' ? 9 : 1, refY: 5,
          markerWidth: 7, markerHeight: 7, orient: dir === 'end' ? 'auto' : 'auto-start-reverse'
        });
        var path = el('path', { d: 'M0 0 L10 5 L0 10 z', fill: c.stroke });
        marker.appendChild(path);
        defs.appendChild(marker);
      });
    });
  }

  function addLabelBg(group, textEl, pending) {
    // Caller must not have appended textEl yet: this appends the
    // background rect first so it paints behind the text added after.
    var rect = el('rect', { class: 'label-bg', rx: 4, ry: 4 });
    group.appendChild(rect);
    pending.push({ rect: rect, text: textEl });
  }

  function render(container, model, options) {
    options = options || {};
    var theme = options.theme || model.theme || 'light';
    var base = RG.getThemeBase(theme);
    var layout = computeLayout(model);
    var selection = options.selection || null;

    var svg = el('svg', {
      xmlns: SVGNS,
      viewBox: '0 0 ' + layout.width + ' ' + layout.height,
      width: layout.width, height: layout.height,
      class: 'rg-canvas rg-theme-' + theme,
      'font-family': "'Segoe UI', 'Hiragino Sans', 'Noto Sans JP', 'Yu Gothic UI', 'Meiryo', sans-serif"
    });

    var defs = el('defs');
    svg.appendChild(defs);
    var usedColors = {};
    model.edges.forEach(function (e) { usedColors[RG.normalizeColorName(e.color)] = true; });
    ensureMarkers(defs, theme, Object.keys(usedColors).length ? Object.keys(usedColors) : ['slate']);

    var bg = el('rect', { x: 0, y: 0, width: layout.width, height: layout.height, fill: base.bg, class: 'rg-bg' });
    svg.appendChild(bg);

    var ts = layout.ts;
    layout.titleLines.forEach(function (line, i) {
      var titleEl = el('text', { x: layout.width / 2, y: 20 + layout.titleFont + i * layout.titleLineH, 'text-anchor': 'middle', 'font-size': layout.titleFont, 'font-weight': 800, fill: base.text, class: 'rg-title' });
      titleEl.textContent = line;
      svg.appendChild(titleEl);
    });
    layout.sourceLines.forEach(function (line, i) {
      var fromBottom = layout.sourceLines.length - 1 - i;
      var sourceEl = el('text', { x: layout.width - 20, y: layout.height - 10 - fromBottom * layout.sourceLineH, 'text-anchor': 'end', 'font-size': layout.sourceFont, fill: base.subtleText, class: 'rg-source' });
      sourceEl.textContent = line;
      svg.appendChild(sourceEl);
    });

    // Invisible per-cell hit targets (bottom-most interactive layer).
    var cellsLayer = el('g', { class: 'rg-cells' });
    for (var r = 1; r <= layout.rows; r++) {
      for (var c = 1; c <= layout.cols; c++) {
        var tl = layout.cellTopLeft(c, r);
        cellsLayer.appendChild(el('rect', {
          x: tl.x, y: tl.y, width: LAYOUT.cellW, height: LAYOUT.cellH,
          fill: 'transparent', 'data-kind': 'cell', 'data-col': c, 'data-row': r
        }));
      }
    }
    svg.appendChild(cellsLayer);

    // Grid guide lines (toggleable).
    var gridLayer = el('g', { class: 'rg-grid', style: options.showGrid ? '' : 'display:none' });
    var gridBottom = layout.top + layout.rows * LAYOUT.cellH;
    for (var gc = 0; gc <= layout.cols; gc++) {
      var x = LAYOUT.marginX + gc * LAYOUT.cellW;
      gridLayer.appendChild(el('line', { x1: x, y1: layout.top, x2: x, y2: gridBottom, stroke: base.grid, 'stroke-width': 1 }));
    }
    for (var gr = 0; gr <= layout.rows; gr++) {
      var y = layout.top + gr * LAYOUT.cellH;
      gridLayer.appendChild(el('line', { x1: LAYOUT.marginX, y1: y, x2: layout.width - LAYOUT.marginX, y2: y, stroke: base.grid, 'stroke-width': 1 }));
    }
    svg.appendChild(gridLayer);

    var pendingLabels = [];

    // Cell highlight + zone-drag preview helper elements, controlled directly
    // by the editor (app.js) during drag/draw without a full re-render.
    var highlight = el('rect', { id: 'rg-cell-highlight', width: LAYOUT.cellW - 8, height: LAYOUT.cellH - 8, rx: 10, fill: 'none', stroke: '#2563eb', 'stroke-width': 2, 'stroke-dasharray': '6 4', style: 'display:none; pointer-events:none;' });
    svg.appendChild(highlight);
    var zonePreview = el('rect', { id: 'rg-zone-preview', rx: 16, fill: 'rgba(37,99,235,0.12)', stroke: '#2563eb', 'stroke-width': 2, 'stroke-dasharray': '6 4', style: 'display:none; pointer-events:none;' });
    svg.appendChild(zonePreview);

    // Zones.
    var zonesLayer = el('g', { class: 'rg-zones' });
    model.zones.forEach(function (z) {
      var col = RG.getColor(theme, z.color);
      var tl = layout.cellTopLeft(z.range.c1, z.range.r1);
      var br = layout.cellTopLeft(z.range.c2 + 1, z.range.r2 + 1);
      var pad = 10;
      var g = el('g', { class: 'rg-zone' + (selection && selection.type === 'zone' && selection.id === z.id ? ' selected' : ''), 'data-kind': 'zone', 'data-id': z.id });
      g.appendChild(el('rect', {
        x: tl.x + pad, y: tl.y + pad, width: br.x - tl.x - pad * 2, height: br.y - tl.y - pad * 2,
        rx: 18, fill: col.zoneFill, stroke: col.zoneStroke, 'stroke-width': 1.5
      }));
      if (z.label) {
        var t = el('text', { x: tl.x + pad + 14, y: tl.y + pad + 12 + 12 * ts, 'font-size': 13 * ts, 'font-weight': 700, fill: base.text, class: 'rg-zone-label' });
        t.textContent = z.label;
        g.appendChild(t);
      }
      zonesLayer.appendChild(g);
    });
    svg.appendChild(zonesLayer);

    // Edges.
    var edgesLayer = el('g', { class: 'rg-edges' });
    var nodeById = {};
    model.nodes.forEach(function (n) { nodeById[n.id] = n; });

    model.edges.forEach(function (e) {
      var a = nodeById[e.from], b = nodeById[e.to];
      if (!a || !b || a === b) return;   // 自己ループは描画しない
      var col = RG.getColor(theme, e.color);
      var pa = layout.cellCenter(a.col, a.row), pb = layout.cellCenter(b.col, b.row);
      var dx = pb.x - pa.x, dy = pb.y - pa.y;
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;
      var ux = dx / dist, uy = dy / dist;
      var ra = LAYOUT.baseR * (a.size || 1), rb = LAYOUT.baseR * (b.size || 1);
      var start = { x: pa.x + ux * ra, y: pa.y + uy * ra };
      var end = { x: pb.x - ux * rb, y: pb.y - uy * rb };

      var g = el('g', { class: 'rg-edge' + (selection && selection.type === 'edge' && selection.id === e.id ? ' selected' : ''), 'data-kind': 'edge', 'data-id': e.id });

      var markerColor = RG.normalizeColorName(e.color);
      var markerStart = (e.op === '<-' || e.op === '<->') ? 'url(#arrow-start-' + markerColor + ')' : null;
      var markerEnd = (e.op === '->' || e.op === '<->') ? 'url(#arrow-end-' + markerColor + ')' : null;

      // Wide invisible hit path for easier selection.
      g.appendChild(el('line', { x1: start.x, y1: start.y, x2: end.x, y2: end.y, stroke: 'transparent', 'stroke-width': 16 }));

      var visLine = el('line', {
        x1: start.x, y1: start.y, x2: end.x, y2: end.y,
        stroke: col.stroke, 'stroke-width': e.width || 1,
        'stroke-dasharray': e.style === 'dashed' ? '6 5' : null,
        'marker-start': markerStart, 'marker-end': markerEnd
      });
      g.appendChild(visLine);

      if (e.label) {
        var mx = (pa.x + pb.x) / 2, my = (pa.y + pb.y) / 2;
        var text = el('text', { x: mx, y: my, 'text-anchor': 'middle', 'dominant-baseline': 'middle', 'font-size': 12 * ts, 'font-weight': 600, fill: base.text });
        text.textContent = e.label;
        addLabelBg(g, text, pendingLabels);
        g.appendChild(text);
      }
      edgesLayer.appendChild(g);
    });
    svg.appendChild(edgesLayer);

    // Nodes.
    var nodesLayer = el('g', { class: 'rg-nodes' });
    model.nodes.forEach(function (n) {
      var col = RG.getColor(theme, n.color);
      var center = layout.cellCenter(n.col, n.row);
      var radius = LAYOUT.baseR * (n.size || 1);
      var nodeClass = 'rg-node';
      if (selection && selection.type === 'node' && selection.id === n.id) nodeClass += ' selected';
      if (options.connectFrom === n.id) nodeClass += ' connecting';
      var g = el('g', {
        class: nodeClass,
        transform: 'translate(' + center.x + ',' + center.y + ')',
        'data-kind': 'node', 'data-id': n.id
      });
      g.appendChild(el('circle', { r: radius, fill: base.nodeFill, stroke: col.stroke, 'stroke-width': 2.2 }));
      var iconSize = radius * 1.15;
      var iconG = el('g', {
        transform: 'translate(' + (-iconSize / 2) + ',' + (-iconSize / 2) + ') scale(' + (iconSize / 24) + ')',
        fill: 'none', stroke: 'currentColor', color: col.stroke,
        'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
      });
      iconG.innerHTML = Object.prototype.hasOwnProperty.call(RG.icons, n.icon) ? RG.icons[n.icon] : RG.icons.box;
      g.appendChild(iconG);

      if (n.label) {
        var labelText = el('text', { x: 0, y: radius + 6 + 12 * ts, 'text-anchor': 'middle', 'font-size': 12.5 * ts, 'font-weight': 700, fill: base.text });
        labelText.textContent = n.label;
        var bgRect = el('rect', { class: 'label-bg', rx: 3, ry: 3 });
        g.appendChild(bgRect);
        g.appendChild(labelText);
        pendingLabels.push({ rect: bgRect, text: labelText });
      }
      nodesLayer.appendChild(g);
    });
    svg.appendChild(nodesLayer);

    // Notes. Box size depends on the actual text, so geometry (leader line,
    // box, line positions) is only finalized in the measurement pass below
    // once the text nodes are attached to the document and can be measured.
    var notesLayer = el('g', { class: 'rg-notes' });
    var pendingNotes = [];
    model.notes.forEach(function (note) {
      var target = nodeById[note.target];
      if (!target) return;
      var col = RG.getColor(theme, target.color);
      var center = layout.cellCenter(target.col, target.row);
      var radius = LAYOUT.baseR * (target.size || 1);
      var dir = note.pos || 'right';
      var offX = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
      var offY = dir === 'top' ? -1 : dir === 'bottom' ? 1 : 0;
      if (offX === 0 && offY === 0) offX = 1;

      var g = el('g', { class: 'rg-note' + (selection && selection.type === 'note' && selection.id === note.id ? ' selected' : ''), 'data-kind': 'note', 'data-id': note.id });
      var leaderLine = el('line', { stroke: col.stroke, 'stroke-width': 1.2, 'stroke-dasharray': '3 3' });
      g.appendChild(leaderLine);
      var boxRect = el('rect', { rx: 8, fill: base.labelBg, stroke: col.stroke, 'stroke-width': 1.2 });
      g.appendChild(boxRect);
      var lines = String(note.text || '').split('\\n');
      var textEls = lines.map(function (lineStr) {
        var t = el('text', { 'text-anchor': 'middle', 'font-size': 11 * ts, fill: base.text });
        t.textContent = lineStr;
        g.appendChild(t);
        return t;
      });
      notesLayer.appendChild(g);
      pendingNotes.push({ textEls: textEls, boxRect: boxRect, leaderLine: leaderLine, center: center, radius: radius, offX: offX, offY: offY, hasLabel: !!target.label });
    });
    svg.appendChild(notesLayer);

    container.innerHTML = '';
    container.appendChild(svg);

    // Second pass: notes are sized to fit their measured text, then the
    // label backgrounds are sized now that text is laid out in the DOM.
    var lineHeight = 15 * ts, padX = 10, padY = 8;
    pendingNotes.forEach(function (pn) {
      var maxWidth = 0;
      pn.textEls.forEach(function (t) {
        try { var bb = t.getBBox(); if (bb.width > maxWidth) maxWidth = bb.width; } catch (err) { /* ignore */ }
      });
      var boxW = Math.max(60, maxWidth + padX * 2);
      var boxH = pn.textEls.length * lineHeight + padY * 2 - 4;
      // Node labels sit just below the circle, so a bottom note must clear them.
      var gapY = pn.offY > 0 && pn.hasLabel ? 12 + 18 * ts : 14;
      var anchor = { x: pn.center.x + pn.offX * (pn.radius + 14), y: pn.center.y + pn.offY * (pn.radius + gapY) };
      var boxX = anchor.x + (pn.offX > 0 ? 0 : pn.offX < 0 ? -boxW : -boxW / 2);
      var boxY = anchor.y + (pn.offY > 0 ? 0 : pn.offY < 0 ? -boxH : -boxH / 2);
      pn.boxRect.setAttribute('x', boxX);
      pn.boxRect.setAttribute('y', boxY);
      pn.boxRect.setAttribute('width', boxW);
      pn.boxRect.setAttribute('height', boxH);
      // Start below the label for bottom notes so the leader never crosses it.
      var leaderStartY = pn.offY > 0 && pn.hasLabel ? pn.radius + 6 + 18 * ts : pn.radius;
      pn.leaderLine.setAttribute('x1', pn.center.x + pn.offX * pn.radius);
      pn.leaderLine.setAttribute('y1', pn.center.y + pn.offY * leaderStartY);
      pn.leaderLine.setAttribute('x2', boxX + boxW / 2);
      pn.leaderLine.setAttribute('y2', boxY + boxH / 2);
      pn.textEls.forEach(function (t, i) {
        t.setAttribute('x', boxX + boxW / 2);
        t.setAttribute('y', boxY + padY + 8 + 1 * ts + i * lineHeight);
      });
    });

    // Third pass: size label backgrounds now that text is laid out in the DOM.
    pendingLabels.forEach(function (p) {
      try {
        var bbox = p.text.getBBox();
        var padX = 5, padY = 2;
        p.rect.setAttribute('x', bbox.x - padX);
        p.rect.setAttribute('y', bbox.y - padY);
        p.rect.setAttribute('width', bbox.width + padX * 2);
        p.rect.setAttribute('height', bbox.height + padY * 2);
        p.rect.setAttribute('fill', base.labelBg);
      } catch (err) { /* getBBox can throw if not rendered; ignore */ }
    });

    return svg;
  }

  RG.render = render;
})(window);
