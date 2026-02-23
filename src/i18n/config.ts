import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './locales/fr.json';
import ar from './locales/ar.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      ar: { translation: ar },
    },
    lng: 'ar',
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false,
    },
  });

// Handle language changes with RTL and font switching
i18n.on('languageChanged', (lng) => {
  const isRTL = lng === 'ar';
  
  // Update document direction and lang
  document.documentElement.lang = lng;
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  
  // Update font family on body
  if (isRTL) {
    document.body.classList.remove('font-montserrat');
    document.body.classList.add('font-amiri');
  } else {
    document.body.classList.remove('font-amiri');
    document.body.classList.add('font-montserrat');
  }
});

// Set initial language settings
const currentLang = i18n.language || 'fr';
const isRTL = currentLang === 'ar';
document.documentElement.lang = currentLang;
document.documentElement.dir = isRTL ? 'rtl' : 'ltr';

export default i18n;
