import { createI18n } from 'vue-i18n'
import type { I18n } from 'vue-i18n'
import it from './locales/it'
import en from './locales/en'

export type MessageSchema = typeof it

const i18n: I18n = createI18n({
  legacy: false,
  locale: 'it',
  fallbackLocale: 'en',
  messages: {
    it,
    en,
  },
  globalInjection: true,
  missingWarn: false,
  fallbackWarn: false,
})

export default i18n
export { it, en }
