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
  // Determine language: prefer stored value; if none, use browser language
  // when a translation exists for it, and persist that choice so subsequent
  // loads honor the auto-detected language.
  let lang = getPreferredLanguage(translations);
  const storedLang = localStorage.getItem('siteLang');
  if (!storedLang) {
    try {
      const browserLang = (navigator && navigator.language) ? navigator.language.slice(0, 2) : null;
      if (browserLang && translations && translations[browserLang]) {
        lang = browserLang;
        localStorage.setItem('siteLang', browserLang);
      }
    } catch (e) { /* ignore */ }
  }
  if (langSelector) langSelector.value = lang;
  translatePage(translations, lang);

  // If language selector options include data-flag, use it to style the selector
  function updateSelectorFlag(selector) {
    try {
      const opt = selector.options[selector.selectedIndex];
      const flag = opt && opt.getAttribute('data-flag');
      if (flag) {
        selector.style.backgroundImage = `url('${flag}')`;
        selector.style.backgroundSize = '20px 14px';
        selector.style.backgroundPosition = 'left 6px center';
        selector.style.paddingLeft = '2.2rem';
      } else {
        selector.style.backgroundImage = '';
      }
    } catch (e) { /* ignore */ }
  }
  if (langSelector) updateSelectorFlag(langSelector);

  if (langSelector) {
    langSelector.addEventListener('change', () => {
      const selected = langSelector.value;
      localStorage.setItem('siteLang', selected);
      translatePage(translations, selected);
  updateSelectorFlag(langSelector);
    });
  }

  // If a custom flag select widget is available, initialize it so pages don't
  // need to include the widget script manually. Guard with a global flag so
  // multiple calls are safe.
  try {
    if (typeof document !== 'undefined' && !window._flagSelectInitialized) {
      import('./flagSelect.js').then(mod => {
        try {
          if (mod && typeof mod.default === 'function') {
            mod.default('languageSelector');
            window._flagSelectInitialized = true;
          }
        } catch (e) { /* ignore widget init errors */ }
      }).catch(() => { /* ignore missing module */ });
    }
  } catch (e) { /* ignore dynamic import environment issues */ }
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
