"use strict";

// Dark mode via CSS inversion: invert the whole page, then re-invert media
// so images and video keep their original colours.
//
// Media is re-inverted exactly once. Elements that are media themselves
// (img, video, ...) are matched by selector; elements that only *display*
// media through a CSS background-image are detected at runtime and tagged
// with MEDIA_ATTR. Anything nested inside re-inverted media is reset so it
// is not inverted a second time.
const STYLE_ID = "dark-mode-anywhere-style";
const MEDIA_ATTR = "data-dma-media";
const MEDIA_SELECTORS = ["img", "video", "canvas", "embed", "object", "iframe", "svg image", `[${MEDIA_ATTR}]`];
const MEDIA = MEDIA_SELECTORS.join(", ");
const CSS = `
html {
  background-color: #fff !important;
  filter: invert(1) hue-rotate(180deg) !important;
}
${MEDIA} {
  filter: invert(1) hue-rotate(180deg) !important;
}
${MEDIA_SELECTORS.map((m) => `:is(${MEDIA}) ${m}`).join(", ")} {
  filter: none !important;
}
`;

const host = location.hostname || location.protocol;
let observer = null;
const pending = new Set();
let timer = null;

// A background image counts as media when the element has no text of its own
// (otherwise it is a layout container whose text must still be darkened).
function tagIfBackgroundMedia(el) {
  if (el.nodeType !== 1 || el.hasAttribute(MEDIA_ATTR)) return;
  if (!/^(DIV|SPAN|A|FIGURE|LI|I|SECTION|P)$/.test(el.tagName)) return;
  const bg = getComputedStyle(el).backgroundImage;
  if (bg && bg.includes("url(") && el.textContent.trim() === "") {
    el.setAttribute(MEDIA_ATTR, "");
  }
}

function scan(root) {
  tagIfBackgroundMedia(root);
  if (root.querySelectorAll) root.querySelectorAll("*").forEach(tagIfBackgroundMedia);
}

function flush() {
  timer = null;
  const nodes = [...pending];
  pending.clear();
  nodes.forEach((n) => n.isConnected && scan(n));
}

function queue(node) {
  pending.add(node);
  if (!timer) timer = setTimeout(flush, 150);
}

function startObserver() {
  if (observer) return;
  observer = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === "childList") r.addedNodes.forEach((n) => n.nodeType === 1 && queue(n));
      else queue(r.target);
    }
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "style"],
  });
  queue(document.documentElement);
}

function stopObserver() {
  if (observer) observer.disconnect();
  observer = null;
  pending.clear();
}

function setDark(enabled) {
  const existing = document.getElementById(STYLE_ID);
  if (!enabled) {
    if (existing) existing.remove();
    stopObserver();
    return;
  }
  if (!existing) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
  }
  startObserver();
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
