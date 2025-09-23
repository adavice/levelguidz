export const languageConfig = {
  en: { name: "English", flag: "css/assets/flag-icons/flags/4x3/gb.svg" },
  ro: { name: "Română", flag: "css/assets/flag-icons/flags/4x3/ro.svg" },
  se: { name: "Svenska", flag: "css/assets/flag-icons/flags/4x3/se.svg" },
};

function generateLanguageOptions(translations, selector) {
  if (!selector || !translations) return;

  // Clear existing options
  selector.innerHTML = "";

  // Only render options for en, ro, se if they have translations
  const allowedLanguages = ["en", "ro", "se"];

  allowedLanguages.forEach((langCode) => {
    if (translations[langCode]) {
      const config = languageConfig[langCode];
      if (config) {
        const option = document.createElement("option");
        option.value = langCode;
        option.textContent = config.name;
        option.setAttribute("data-flag-image", config.flag);
        option.title = config.name;
        option.setAttribute("aria-label", config.name);
        // Add a data attribute to identify which flag image to show
        option.setAttribute("data-flag-src", config.flag);
        selector.appendChild(option);
      }
    }
  });
}

function updateSelectorWithFlag(selector) {
  try {
    const selectedOption = selector.options[selector.selectedIndex];
    const flagImage = selectedOption?.getAttribute("data-flag-image");

    if (flagImage) {
      // Set background image directly
      selector.style.backgroundImage = `url('${flagImage}')`;
      selector.style.backgroundSize = "20px 14px";
      selector.style.backgroundPosition = "left 6px center";
      selector.style.backgroundRepeat = "no-repeat";
      selector.style.paddingLeft = "2.2rem";
    } else {
      // Fallback to placeholder
      selector.style.backgroundImage = "url('css/assets/flag-icons/flags/4x3/xx.svg')";
      selector.style.paddingLeft = "2.2rem";
    }
  } catch (e) {
    /* ignore */
  }
}

export function getPreferredLanguage(translations) {
  const stored = localStorage.getItem("siteLang");
  if (stored && translations && translations[stored]) return stored;
  const browserLang = navigator.language.slice(0, 2);
  return translations && translations[browserLang] ? browserLang : "en";
}

function translatePage(translations, lang) {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });
}

function createCustomLanguageSelector(translations, originalSelector) {
  if (!originalSelector || !translations) return;

  // Create custom dropdown wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'custom-language-selector';

  // Create trigger button
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'language-selector py-0';

  // Create flag image element
  const flagImg = document.createElement('img');
  flagImg.style.cssText = `
    width: 20px;
    height: 14px;
    object-fit: cover;
    border-radius: 2px;
  `;

  // Append flag image to trigger button
  trigger.appendChild(flagImg);

  // Create dropdown menu with Bootstrap classes
  const dropdown = document.createElement('div');
  dropdown.className = 'custom-lang-dropdown d-none';

  const allowedLanguages = ["en", "ro", "se"];
  let selectedLang = getPreferredLanguage(translations);

  // Build dropdown items from the existing languageConfig (only for available translations)
  allowedLanguages.forEach((langCode) => {
    if (translations[langCode]) {
      const config = languageConfig[langCode];
      if (config) {
        const item = document.createElement('div');
        item.className = 'custom-lang-item';

        item.innerHTML = `
          <img src="${config.flag}" alt="${config.name}" style="width: 20px; height: 14px; object-fit: cover;">
          <span>${config.name}</span>
        `;

        item.addEventListener('click', () => {
          selectedLang = langCode;
          // Update original select (keeps form compatibility) which will also update trigger via the change listener below
          originalSelector.value = langCode;
          originalSelector.dispatchEvent(new Event('change', { bubbles: true }));
          dropdown.classList.remove('d-block');
          dropdown.classList.add('d-none');
          localStorage.setItem('siteLang', langCode);
        });

        item.addEventListener('mouseenter', () => {
          item.style.backgroundColor = 'rgba(255,255,255,0.1)';
        });

        item.addEventListener('mouseleave', () => {
          item.style.backgroundColor = '';
        });

        dropdown.appendChild(item);
      }
    }
  });

  function updateTrigger() {
    const config = languageConfig[selectedLang];
    if (config) {
      flagImg.src = config.flag;
      flagImg.alt = config.name;
      trigger.setAttribute('title', config.name);
      trigger.setAttribute('aria-label', config.name);
    }
  }

  // Toggle dropdown using Bootstrap classes
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (dropdown.classList.contains('d-none')) {
      dropdown.classList.remove('d-none');
      dropdown.classList.add('d-block');
    } else {
      dropdown.classList.remove('d-block');
      dropdown.classList.add('d-none');
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      dropdown.classList.remove('d-block');
      dropdown.classList.add('d-none');
    }
  });

  wrapper.appendChild(trigger);
  wrapper.appendChild(dropdown);

  // Replace original selector using Bootstrap classes
  originalSelector.classList.add('d-none');
  originalSelector.parentNode.insertBefore(wrapper, originalSelector);

  // Keep the trigger in sync when the original select changes (programmatic or user-driven)
  originalSelector.addEventListener('change', () => {
    selectedLang = originalSelector.value;
    updateTrigger();
  });

  // Initialize with current language
  updateTrigger();
}

export function setupTranslation(translations) {
  const langSelector = document.getElementById("languageSelector");

  // Populate the original select with options first so change events work
  if (langSelector && translations) {
    generateLanguageOptions(translations, langSelector);
  }

  // Create custom language selector with images (this will hide the original select)
  if (langSelector && translations) {
    createCustomLanguageSelector(translations, langSelector);
  }

  // Determine language: prefer stored value; if none, use browser language
  let lang = getPreferredLanguage(translations);
  const storedLang = localStorage.getItem("siteLang");
  if (!storedLang) {
    try {
      const browserLang =
        navigator && navigator.language ? navigator.language.slice(0, 2) : null;
      if (browserLang && translations && translations[browserLang]) {
        lang = browserLang;
        localStorage.setItem("siteLang", browserLang);
      }
    } catch (e) {
      /* ignore */
    }
  }

  // Set value and translate
  if (langSelector) {
    langSelector.value = lang;
    // trigger change so both hidden select handlers and custom trigger update run
    langSelector.dispatchEvent(new Event('change', { bubbles: true }));
  }
  translatePage(translations, lang);

  // Update selector with flag styling for the (possibly visible) original select
  if (langSelector) updateSelectorWithFlag(langSelector);

  if (langSelector) {
    langSelector.addEventListener("change", () => {
      const selected = langSelector.value;
      localStorage.setItem("siteLang", selected);
      translatePage(translations, selected);
      updateSelectorWithFlag(langSelector);
      try {
        window.dispatchEvent(
          new CustomEvent("siteLanguageChanged", { detail: { lang: selected } })
        );
      } catch (e) {
        /* ignore */
      }
    });
  }

  // Attempt safe initializer if provided externally, do not import
  try {
    if (typeof document !== 'undefined' && !window._flagSelectInitialized) {
      try {
        if (typeof window.initFlagSelect === 'function') {
          window.initFlagSelect('languageSelector');
          window._flagSelectInitialized = true;
        } else if (typeof initFlagSelect === 'function') {
          initFlagSelect('languageSelector');
          window._flagSelectInitialized = true;
        }
      } catch (e) { /* ignore widget init errors */ }
    }
  } catch (e) { /* ignore dynamic import environment issues */ }

  try {
    window.dispatchEvent(
      new CustomEvent("siteLanguageChanged", { detail: { lang } })
    );
  } catch (e) {
    /* ignore */
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
    if (typeof namespaceOrTranslations === "string") {
      translations = getRegisteredTranslations(namespaceOrTranslations);
    } else if (
      namespaceOrTranslations &&
      typeof namespaceOrTranslations === "object"
    ) {
      translations = namespaceOrTranslations;
    }
    if (!translations) return key;
    const lang = getPreferredLanguage(translations);
    return (translations[lang] && translations[lang][key]) || key;
  } catch (e) {
    return key;
  }
}

