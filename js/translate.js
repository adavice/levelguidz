function getPreferredLanguage(translations) {
  const stored = localStorage.getItem('siteLang');
  if (stored && translations[stored]) return stored;
  const browserLang = navigator.language.slice(0, 2);
  return translations[browserLang] ? browserLang : 'en';
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
