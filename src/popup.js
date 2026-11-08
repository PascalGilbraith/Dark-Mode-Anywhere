"use strict";

const siteBox = document.getElementById("site");
const allBox = document.getElementById("all");
const hostLabel = document.getElementById("host");

async function init() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  let host = "";
  try {
    const url = new URL(tab.url);
    if (/^https?:$/.test(url.protocol)) host = url.hostname;
    else if (url.protocol === "file:") host = url.protocol;
  } catch (e) {
    // No usable tab URL (e.g. about: pages)
  }

  const settings = await browser.storage.local.get({ defaultDark: false, sites: {} });
  allBox.checked = settings.defaultDark;

  if (host) {
    hostLabel.textContent = host;
    siteBox.checked = host in settings.sites ? settings.sites[host] : settings.defaultDark;
  } else {
    hostLabel.textContent = "this page (unsupported)";
    siteBox.disabled = true;
  }

  siteBox.addEventListener("change", async () => {
    const current = await browser.storage.local.get({ sites: {} });
    current.sites[host] = siteBox.checked;
    await browser.storage.local.set({ sites: current.sites });
  });

  allBox.addEventListener("change", async () => {
    await browser.storage.local.set({ defaultDark: allBox.checked });
    // Per-site choices still win, so reflect the effective state for this site.
    if (host) {
      const s = await browser.storage.local.get({ sites: {} });
      if (!(host in s.sites)) siteBox.checked = allBox.checked;
    }
  });
}

init();
