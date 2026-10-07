/* RelaGrid: named color palette, per theme (light / dark). */
(function (global) {
  'use strict';

  var LIGHT = {
    slate:  { stroke: '#475569', zoneFill: 'rgba(100,116,139,0.14)', zoneStroke: 'rgba(100,116,139,0.45)' },
    blue:   { stroke: '#2563eb', zoneFill: 'rgba(37,99,235,0.12)',  zoneStroke: 'rgba(37,99,235,0.4)' },
    green:  { stroke: '#16a34a', zoneFill: 'rgba(22,163,74,0.12)',  zoneStroke: 'rgba(22,163,74,0.4)' },
    red:    { stroke: '#dc2626', zoneFill: 'rgba(220,38,38,0.12)',  zoneStroke: 'rgba(220,38,38,0.4)' },
    orange: { stroke: '#ea580c', zoneFill: 'rgba(234,88,12,0.12)',  zoneStroke: 'rgba(234,88,12,0.4)' },
    purple: { stroke: '#7c3aed', zoneFill: 'rgba(124,58,237,0.12)', zoneStroke: 'rgba(124,58,237,0.4)' },
    teal:   { stroke: '#0d9488', zoneFill: 'rgba(13,148,136,0.12)', zoneStroke: 'rgba(13,148,136,0.4)' },
    pink:   { stroke: '#db2777', zoneFill: 'rgba(219,39,119,0.12)', zoneStroke: 'rgba(219,39,119,0.4)' },
    yellow: { stroke: '#a16207', zoneFill: 'rgba(161,98,7,0.12)',   zoneStroke: 'rgba(161,98,7,0.4)' }
  };

  var DARK = {
    slate:  { stroke: '#94a3b8', zoneFill: 'rgba(148,163,184,0.16)', zoneStroke: 'rgba(148,163,184,0.4)' },
    blue:   { stroke: '#60a5fa', zoneFill: 'rgba(96,165,250,0.16)',  zoneStroke: 'rgba(96,165,250,0.4)' },
    green:  { stroke: '#4ade80', zoneFill: 'rgba(74,222,128,0.16)',  zoneStroke: 'rgba(74,222,128,0.4)' },
    red:    { stroke: '#f87171', zoneFill: 'rgba(248,113,113,0.16)', zoneStroke: 'rgba(248,113,113,0.4)' },
    orange: { stroke: '#fb923c', zoneFill: 'rgba(251,146,60,0.16)',  zoneStroke: 'rgba(251,146,60,0.4)' },
    purple: { stroke: '#a78bfa', zoneFill: 'rgba(167,139,250,0.16)', zoneStroke: 'rgba(167,139,250,0.4)' },
    teal:   { stroke: '#2dd4bf', zoneFill: 'rgba(45,212,191,0.16)',  zoneStroke: 'rgba(45,212,191,0.4)' },
    pink:   { stroke: '#f472b6', zoneFill: 'rgba(244,114,182,0.16)', zoneStroke: 'rgba(244,114,182,0.4)' },
    yellow: { stroke: '#facc15', zoneFill: 'rgba(250,204,21,0.16)',  zoneStroke: 'rgba(250,204,21,0.4)' }
  };

  var THEME_BASE = {
    light: { bg: '#ffffff', nodeFill: '#ffffff', text: '#0f172a', subtleText: '#64748b', grid: 'rgba(15,23,42,0.08)', labelBg: 'rgba(255,255,255,0.92)' },
    dark:  { bg: '#0f172a', nodeFill: '#1e293b', text: '#e2e8f0', subtleText: '#94a3b8', grid: 'rgba(226,232,240,0.10)', labelBg: 'rgba(15,23,42,0.88)' }
  };

  var COLOR_NAMES = ['slate', 'blue', 'green', 'red', 'orange', 'purple', 'teal', 'pink', 'yellow'];

  function getPalette(theme) {
    return theme === 'dark' ? DARK : LIGHT;
  }

  function getColor(theme, name) {
    var p = getPalette(theme);
    return hasOwn(p, name) ? p[name] : p.slate;
  }

  function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  // パレットにある色名ならそのまま、なければ slate。SVGのid等に使っても安全な名前を返す。
  function normalizeColorName(name) {
    return COLOR_NAMES.indexOf(name) !== -1 ? name : 'slate';
  }

  function getBase(theme) {
    return THEME_BASE[theme === 'dark' ? 'dark' : 'light'];
  }

  global.RelaGrid = global.RelaGrid || {};
  global.RelaGrid.colorNames = COLOR_NAMES;
  global.RelaGrid.getColor = getColor;
  global.RelaGrid.normalizeColorName = normalizeColorName;
  global.RelaGrid.getThemeBase = getBase;
})(window);
