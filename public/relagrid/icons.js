/* RelaGrid: built-in icon set.
 * Each icon is a small set of primitive SVG shapes drawn in a 24x24 box,
 * stroke-based (like an outline icon font) so a single `color` can be
 * applied to fill/stroke from the node that uses it. Hand-drawn, no
 * external icon library, so the app has zero runtime dependencies.
 */
(function (global) {
  'use strict';

  var icons = {
    box: '<path d="M12 3 20.5 7.5v9L12 21 3.5 16.5v-9z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>',

    user: '<circle cx="12" cy="8" r="3.4"/><path d="M5 20c0-3.6 3.1-6.2 7-6.2s7 2.6 7 6.2"/>',

    users: '<circle cx="9" cy="8.2" r="3"/><path d="M3 20c0-3.1 2.7-5.2 6-5.2s6 2.1 6 5.2"/>' +
      '<circle cx="17.3" cy="9" r="2.3"/><path d="M15.6 15.1c2.7.4 4.6 2.1 4.6 4.9"/>',

    laptop: '<rect x="4" y="5" width="16" height="10" rx="1.2"/><path d="M2 19.2h20l-1.8-3H3.8z"/>',

    mobile: '<rect x="8" y="3" width="8" height="18" rx="1.6"/><line x1="11" y1="18" x2="13" y2="18"/>',

    server: '<rect x="4" y="4" width="16" height="6.2" rx="1.4"/><rect x="4" y="13.8" width="16" height="6.2" rx="1.4"/>' +
      '<circle cx="7.3" cy="7.1" r="0.9" fill="currentColor" stroke="none"/>' +
      '<circle cx="7.3" cy="16.9" r="0.9" fill="currentColor" stroke="none"/>',

    database: '<ellipse cx="12" cy="6" rx="7" ry="2.6"/><path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6"/>' +
      '<path d="M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6"/>',

    cloud: '<path d="M7.2 18a4.4 4.4 0 0 1-.4-8.8 5.6 5.6 0 0 1 10.9-1.6A4.1 4.1 0 0 1 17 18z"/>',

    globe: '<circle cx="12" cy="12" r="8.2"/><ellipse cx="12" cy="12" rx="3.2" ry="8.2"/><line x1="3.8" y1="12" x2="20.2" y2="12"/>',

    lock: '<rect x="5" y="11" width="14" height="9" rx="1.6"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',

    unlock: '<rect x="5" y="11" width="14" height="9" rx="1.6"/><path d="M8 11V8a4 4 0 0 1 7.4-1.6"/>',

    mail: '<rect x="3" y="5" width="18" height="14" rx="1.4"/><path d="M3.4 6l8.6 6.6L20.6 6"/>',

    bolt: '<path d="M13.2 2 4.6 14h5.7l-1 8 8.6-12h-5.7z"/>',

    gear: '<circle cx="12" cy="12" r="3.1"/><path d="M12 2.5v3.2M12 18.3v3.2M4.5 4.5l2.3 2.3M17.2 17.2l2.3 2.3' +
      'M1.5 12h3.2M19.3 12h3.2M4.5 19.5l2.3-2.3M17.2 6.8l2.3-2.3"/>',

    plug: '<path d="M9 2v6M15 2v6M6 8h12v3a6 6 0 0 1-12 0z"/><path d="M12 17v5"/>',

    queue: '<rect x="3" y="5" width="5.5" height="14" rx="1"/><rect x="9.3" y="5" width="5.5" height="14" rx="1"/><rect x="15.6" y="5" width="4" height="14" rx="1"/>',

    chart: '<line x1="4" y1="20" x2="20.5" y2="20"/><rect x="6" y="12" width="3" height="8"/><rect x="11" y="7.5" width="3" height="12.5"/><rect x="16" y="14.5" width="3" height="5.5"/>',

    folder: '<path d="M3 7.2c0-.7.6-1.2 1.2-1.2H9l2 2h8.8c.7 0 1.2.5 1.2 1.2v9.6c0 .7-.5 1.2-1.2 1.2H4.2C3.5 20 3 19.5 3 18.8z"/>',

    file: '<path d="M6 2.2h7.2l4.8 4.8v14.8H6z"/><path d="M13.2 2.2v4.8H18"/>',

    shield: '<path d="M12 2.3 4.3 5.4v5.7c0 5 3.4 8.7 7.7 10.6 4.3-1.9 7.7-5.6 7.7-10.6V5.4z"/>',

    bell: '<path d="M6 16v-4.8a6 6 0 0 1 12 0V16l2 3H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',

    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6.8v5.6l4 2.2"/>',

    warning: '<path d="M12 3 2.2 20h19.6z"/><line x1="12" y1="9.2" x2="12" y2="14.4"/><circle cx="12" cy="17.2" r="0.55" fill="currentColor" stroke="none"/>',

    check: '<circle cx="12" cy="12" r="9"/><path d="M7.8 12.4 10.6 15.2 16.4 8.8"/>',

    x: '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',

    refresh: '<path d="M4.2 12a7.8 7.8 0 0 1 13.6-5.2M19.8 4.4v5.4h-5.4"/><path d="M19.8 12a7.8 7.8 0 0 1-13.6 5.2M4.2 19.6v-5.4h5.4"/>',

    browser: '<rect x="3" y="4.2" width="18" height="15.6" rx="1.6"/><line x1="3" y1="8.4" x2="21" y2="8.4"/><circle cx="6" cy="6.3" r="0.6" fill="currentColor" stroke="none"/>',

    terminal: '<rect x="3" y="4" width="18" height="16" rx="1.6"/><path d="M7 9.2 11 12l-4 2.8"/><line x1="12.5" y1="15" x2="17.2" y2="15"/>',

    code: '<path d="M9 8 4 12l5 4M15 8l5 4-5 4"/>',

    git: '<circle cx="6" cy="6" r="2.1"/><circle cx="6" cy="18" r="2.1"/><circle cx="18" cy="13" r="2.1"/><path d="M6 8.1V17M6 8.1c0 5 12 1 12 3"/>',

    cpu: '<rect x="6" y="6" width="12" height="12" rx="1.2"/><rect x="9.3" y="9.3" width="5.4" height="5.4"/>' +
      '<path d="M9 2.2v3M15 2.2v3M9 18.8v3M15 18.8v3M2.2 9h3M2.2 15h3M18.8 9h3M18.8 15h3"/>',

    disk: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.6"/><path d="M3 12h6M15 12h6"/>',

    wifi: '<path d="M3.2 9a13.6 13.6 0 0 1 17.6 0M6.5 12.9a9 9 0 0 1 11 0M9.9 16.7a4.2 4.2 0 0 1 4.2 0"/>' +
      '<circle cx="12" cy="20" r="0.6" fill="currentColor" stroke="none"/>',

    pin: '<path d="M12 21.3s7-6.6 7-11.3a7 7 0 0 0-14 0c0 4.7 7 11.3 7 11.3z"/><circle cx="12" cy="10" r="2.4"/>',

    card: '<rect x="3" y="6" width="18" height="12" rx="1.6"/><line x1="3" y1="10.2" x2="21" y2="10.2"/><line x1="6" y1="15" x2="10.2" y2="15"/>',

    search: '<circle cx="10.4" cy="10.4" r="6.6"/><line x1="15.3" y1="15.3" x2="21" y2="21"/>',

    filter: '<path d="M3 4.2h18l-7 8.2v6.1l-4 2v-8.1z"/>',

    link: '<path d="M8.2 12a4 4 0 0 1 4-4h2.2a4 4 0 0 1 0 8H13"/><path d="M15.8 12a4 4 0 0 1-4 4H9.6a4 4 0 0 1 0-8H11"/>',

    plus: '<circle cx="12" cy="12" r="9"/><line x1="12" y1="7" x2="12" y2="17"/><line x1="7" y1="12" x2="17" y2="12"/>'
  };

  var order = [
    'box', 'user', 'users', 'laptop', 'mobile', 'browser', 'server', 'database',
    'cloud', 'globe', 'wifi', 'plug', 'queue', 'gear', 'cpu', 'disk',
    'lock', 'unlock', 'shield', 'mail', 'bell', 'clock', 'bolt', 'refresh',
    'chart', 'folder', 'file', 'card', 'pin', 'search', 'filter', 'link',
    'git', 'code', 'terminal', 'check', 'x', 'warning', 'plus'
  ];

  global.RelaGrid = global.RelaGrid || {};
  global.RelaGrid.icons = icons;
  global.RelaGrid.iconOrder = order;
})(window);
