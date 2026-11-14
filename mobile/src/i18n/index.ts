import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { el } from './locales/el';
import { en } from './locales/en';

// Greek is the source of truth: `en` has to match its shape to compile, and
// it is what shows if a key is ever missing at runtime.
// eslint-disable-next-line import/no-named-as-default-member -- i18next exports its instance's methods by name as well
void i18n.use(initReactI18next).init({
  resources: {
    el: { translation: el },
    en: { translation: en },
  },
  lng: 'el',
  fallbackLng: 'el',
  interpolation: {
    // React escapes what it renders, so escaping here would double it.
    escapeValue: false,
  },
});

export default i18n;
