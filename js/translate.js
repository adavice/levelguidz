export function getPreferredLanguage(translations) {
  const stored = localStorage.getItem('siteLang');
  if (stored && translations && translations[stored]) return stored;
  const browserLang = navigator.language.slice(0, 2);
  return (translations && translations[browserLang]) ? browserLang : 'en';
}

function translatePage(translations, lang) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });
}

export function setupTranslation(translations) {
  const langSelector = document.getElementById('languageSelector');
  const lang = getPreferredLanguage(translations);
  if (langSelector) langSelector.value = lang;
  translatePage(translations, lang);

  if (langSelector) {
    langSelector.addEventListener('change', () => {
      const selected = langSelector.value;
      localStorage.setItem('siteLang', selected);
      translatePage(translations, selected);
    });
  }
}

// Simple registry to allow different modules to register translation maps
const _registry = {};

export function registerTranslations(namespace, translations) {
  if (!namespace || !translations) return;
  _registry[namespace] = translations;
}

export function getRegisteredTranslations(namespace) {
  return _registry[namespace] || null;
}

/**
 * t(key, namespace?) -> returns translated string for key.
 * If namespace is provided, it looks up translations from the registered namespace.
 * Otherwise, it searches the provided translations object if passed as second arg.
 */
export function t(key, namespaceOrTranslations) {
  try {
    let translations = null;
    if (typeof namespaceOrTranslations === 'string') {
      translations = getRegisteredTranslations(namespaceOrTranslations);
    } else if (namespaceOrTranslations && typeof namespaceOrTranslations === 'object') {
      translations = namespaceOrTranslations;
    }
    if (!translations) return key;
    const lang = getPreferredLanguage(translations);
    return (translations[lang] && translations[lang][key]) || key;
  } catch (e) {
    return key;
  }
}
