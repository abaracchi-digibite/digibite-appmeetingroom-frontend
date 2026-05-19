import { createI18n } from 'vue-i18n'
import type { I18n } from 'vue-i18n'
import it from './locales/it'
import en from './locales/en'

export type MessageSchema = typeof it

/**
 * Lista delle lingue disponibili nell'applicazione.
 * Single source of truth: per aggiungere una nuova lingua basta importare
 * il file di traduzione, aggiungerlo a `messages` e a questo array. La UI
 * (es. selettore lingua nel menu utente) si aggiorna automaticamente.
 */
export interface AvailableLocale {
  value: string
  /** Nome nativo (es. "Italiano", "English", "Français") — non tradotto. */
  label: string
}

export const AVAILABLE_LOCALES: AvailableLocale[] = [
  { value: 'it', label: 'Italiano' },
  { value: 'en', label: 'English' },
]

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
