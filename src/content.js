"use strict";

// Dark mode via CSS inversion: invert the whole page, then re-invert media
// so images and video keep their original colours.
const STYLE_ID = "dark-mode-anywhere-style";
const CSS = `
html {
  background-color: #fff !important;
  filter: invert(1) hue-rotate(180deg) !important;
}
img, picture, video, canvas, svg image, iframe,
[style*="background-image"] {
  filter: invert(1) hue-rotate(180deg) !important;
}
`;

const host = location.hostname || location.protocol;

function setDark(enabled) {
  const existing = document.getElementById(STYLE_ID);
  if (!enabled) {
    if (existing) existing.remove();
    return;
  }
  if (existing) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  (document.head || document.documentElement).appendChild(style);
}

// Site-specific setting wins over the global default.
function isDark(settings) {
  const sites = settings.sites || {};
  return host in sites ? sites[host] : Boolean(settings.defaultDark);
}

async function refresh() {
  const settings = await browser.storage.local.get({ defaultDark: false, sites: {} });
  setDark(isDark(settings));
}

browser.storage.onChanged.addListener(refresh);
refresh();
