import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import translationEN from './locales/en/translation.json';

// Only English to lighten the load and standardize scientific terms
const resources = {
    en: {
        translation: translationEN,
    },
};

console.log("i18n: Starting initialization...");
i18n
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        lng: 'en',
        debug: false,

        interpolation: {
            escapeValue: false,
        },
    }).then(() => {
        console.log("i18n: Initialization complete.");
    });

// Force LTR and English
document.documentElement.dir = 'ltr';
document.documentElement.lang = 'en';

export default i18n;
