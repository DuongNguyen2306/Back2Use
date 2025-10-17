import { useEffect, useState } from 'react';
import { i18n, Language, Translations } from '../lib/i18n';

export function useI18n() {
  const [language, setLanguage] = useState<Language>(i18n.getLanguage());
  const [translations, setTranslations] = useState<Translations>(i18n.getTranslations());

  useEffect(() => {
    const unsubscribe = i18n.subscribe((newLanguage) => {
      setLanguage(newLanguage);
      setTranslations(i18n.getTranslations());
    });

    return unsubscribe;
  }, []);

  const changeLanguage = async (newLanguage: Language) => {
    await i18n.setLanguage(newLanguage);
  };

  const t = (key: keyof Translations) => {
    return translations[key] as any;
  };

  return {
    language,
    translations,
    changeLanguage,
    t,
  };
}
