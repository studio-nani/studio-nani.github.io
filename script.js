const ALLOWED_SOURCES = ["tiktok", "youtube", "instagram", "other"];
const ALLOWED_LANGS = ["ko", "en", "ja"];
const STORE_MEDIUM = "profile_link";
const CAMPAIGN = "studio_nani";

function getParams() {
  return new URLSearchParams(window.location.search);
}

function resolveSource() {
  const params = getParams();
  const source = (params.get("src") || params.get("utm_source") || "other").toLowerCase();
  return ALLOWED_SOURCES.includes(source) ? source : "other";
}

function resolveLanguage() {
  const params = getParams();
  const queryLang = (params.get("lang") || "").toLowerCase();
  if (ALLOWED_LANGS.includes(queryLang)) return queryLang;

  const storedLang = (window.localStorage.getItem("studio-nani-lang") || "").toLowerCase();
  if (ALLOWED_LANGS.includes(storedLang)) return storedLang;

  const browser = (navigator.language || "ko").toLowerCase();
  if (browser.startsWith("en")) return "en";
  if (browser.startsWith("ja")) return "ja";
  return "ko";
}

let currentSource = resolveSource();
let currentLang = resolveLanguage();

function setLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  window.localStorage.setItem("studio-nani-lang", lang);

  const params = getParams();
  params.set("lang", lang);
  if (currentSource !== "other") params.set("src", currentSource);
  window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
}

function localize() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const value = el.dataset[`i18n${currentLang.toUpperCase()}`];
    if (value) el.textContent = value;
  });

  document.querySelectorAll(".lang-btn").forEach((button) => {
    const isActive = button.dataset.lang === currentLang;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function withUtm(url, app, store) {
  try {
    const target = new URL(url);
    target.searchParams.set("utm_source", currentSource);
    target.searchParams.set("utm_medium", STORE_MEDIUM);
    target.searchParams.set("utm_campaign", CAMPAIGN);
    target.searchParams.set("utm_content", `${app}_${store}`);
    return target.toString();
  } catch (_error) {
    return url;
  }
}

function hydrateStoreLinks() {
  document.querySelectorAll("a[data-store-link]").forEach((link) => {
    const app = link.dataset.app || "studio_nani";
    const store = link.dataset.store || "store";
    link.href = withUtm(link.href, app, store);
  });
}

function propagateSource() {
  document.querySelectorAll("a[data-propagate-source]").forEach((link) => {
    try {
      const target = new URL(link.getAttribute("href"), window.location.origin);
      if (currentSource !== "other") target.searchParams.set("src", currentSource);
      target.searchParams.set("lang", currentLang);
      link.href = `${target.pathname}${target.search}${target.hash}`;
    } catch (_error) {
      // Leave the original href intact.
    }
  });
}

function bindLanguageSwitch() {
  document.querySelectorAll(".lang-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const lang = button.dataset.lang;
      if (!ALLOWED_LANGS.includes(lang) || lang === currentLang) return;
      setLanguage(lang);
      localize();
      propagateSource();
      hydrateStoreLinks();
    });
  });
}

document.documentElement.lang = currentLang;
bindLanguageSwitch();
localize();
propagateSource();
hydrateStoreLinks();
