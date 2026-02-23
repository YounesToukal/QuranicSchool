import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'ar' : 'fr';
    i18n.changeLanguage(newLang);
    document.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-white/15 transition-all duration-200 hover:scale-105 active:scale-95 ring-1 ring-white/10 hover:ring-white/20"
      aria-label="Toggle language"
      title="Changer la langue / تغيير اللغة"
    >
      <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
      <span className="font-semibold uppercase text-sm tracking-wider">{i18n.language}</span>
    </button>
  );
}
