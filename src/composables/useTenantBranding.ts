/**
 * useTenantBranding - Composable per l'applicazione del branding tenant.
 *
 * Gestisce due scenari:
 * 1. App autenticata: chiama GET /api/tenant/branding (richiede JWT)
 *    - applica l'intero set di CSS variables + font + custom CSS
 * 2. Login page (AuthLayout): chiama GET /api/auth/tenant-branding (pubblico)
 *    - applica logo, colori base e sfondo della login page
 *
 * Come funziona il branding:
 * ---------------------------------------------------------------------
 * Il backend restituisce i valori hex configurati dall'admin (es. #e63946).
 * Questo composable inietta le CSS custom properties su <html> (documentElement):
 *
 *   document.documentElement.style.setProperty('--color-primary', '#e63946')
 *
 * Tutti i componenti che usano var(--color-primary) vedono il nuovo colore
 * immediatamente - senza ricarica della pagina.
 *
 * Variabili aggiornate:
 *   --color-primary        - primaryColor del tenant
 *   --color-secondary      - secondaryColor del tenant
 *   --color-accent         - accentColor del tenant
 *   --p-primary-color      - colore primario PrimeVue (pulsanti, focus ring)
 *   --p-font-family        - fontFamily del tenant
 *   customCss              - iniettato come <style id="tenant-custom-css">
 *   favicon                - <link rel="icon"> aggiornato dinamicamente
 * ---------------------------------------------------------------------
 */

import { ref, readonly } from 'vue'
import { apiClient } from '@/api/client'

// -- Tipi ---------------------------------------------------------------------

export interface TenantBranding {
  logoUrl:            string | null
  primaryColor:       string | null
  secondaryColor:     string | null
  accentColor:        string | null
  fontFamily:         string | null
  faviconUrl:         string | null
  loginBackgroundUrl: string | null
  darkPrimaryColor:   string | null
  darkSecondaryColor: string | null
  darkAccentColor:    string | null
  customCss:          string | null
}

export interface PublicTenantBranding {
  tenantName:         string | null
  logoUrl:            string | null
  primaryColor:       string | null
  secondaryColor:     string | null
  accentColor:        string | null
  loginBackgroundUrl: string | null
  faviconUrl:         string | null
}

// -- Stato globale condiviso (singleton) --------------------------------------

const _logoUrl     = ref<string | null>(null)
const _tenantName  = ref<string | null>(null)
const _applied     = ref(false)

// -- Composable ----------------------------------------------------------------

export function useTenantBranding() {

  // -- Fetch e applica branding autenticato (app principale) -----------------

  /**
   * Carica il branding del tenant corrente e lo applica all'interfaccia.
   * Da chiamare in App.vue una volta che l'utente - autenticato.
   * Silenzioso in caso di errore (es. tenant senza branding configurato).
   */
  async function applyAuthenticatedBranding(): Promise<void> {
    try {
      const response = await apiClient.get<TenantBranding>('/tenant/branding')
      const branding = response.data.data
      if (!branding) return

      applyBrandingVars(branding)
      _logoUrl.value = branding.logoUrl
      _applied.value = true
    } catch {
      // Nessun branding configurato o errore di rete - usa i default
    }
  }

  // -- Fetch e applica branding pubblico (login page) ------------------------

  /**
   * Carica il branding pubblico del tenant dal dominio corrente.
   * Da chiamare in AuthLayout.vue prima del login.
   * Non richiede autenticazione - usa il dominio per risolvere il tenant.
   */
  async function applyPublicBranding(): Promise<PublicTenantBranding | null> {
    try {
      const response = await apiClient.get<PublicTenantBranding>('/auth/tenant-branding')
      const branding = response.data.data
      if (!branding) return null

      // Applica solo colori base e font (non custom CSS n- favicon in login page)
      if (branding.primaryColor)   setCssVar('--color-primary',    branding.primaryColor)
      if (branding.primaryColor)   setCssVar('--p-primary-color',  branding.primaryColor)
      if (branding.secondaryColor) setCssVar('--color-secondary',  branding.secondaryColor)
      if (branding.accentColor)    setCssVar('--color-accent',     branding.accentColor)

      _logoUrl.value    = branding.logoUrl
      _tenantName.value = branding.tenantName

      return branding
    } catch {
      return null
    }
  }

  // -- Reactive refs in sola lettura (per template) -------------------------

  return {
    logoUrl:    readonly(_logoUrl),
    tenantName: readonly(_tenantName),
    applied:    readonly(_applied),
    applyAuthenticatedBranding,
    applyPublicBranding,
  }
}

// -- Funzioni interne ----------------------------------------------------------

/**
 * Applica l'intero set di CSS variables e side effects (font, favicon, custom CSS).
 */
function applyBrandingVars(b: TenantBranding): void {
  const isDark = document.documentElement.classList.contains('dark')

  // Colori primari (rispetta dark mode se configurata)
  const primary   = (isDark && b.darkPrimaryColor)   ? b.darkPrimaryColor   : b.primaryColor
  const secondary = (isDark && b.darkSecondaryColor) ? b.darkSecondaryColor : b.secondaryColor
  const accent    = (isDark && b.darkAccentColor)    ? b.darkAccentColor    : b.accentColor

  if (primary)   {
    setCssVar('--color-primary',   primary)
    setCssVar('--p-primary-color', primary)   // PrimeVue Aura theme
  }
  if (secondary) setCssVar('--color-secondary', secondary)
  if (accent)    setCssVar('--color-accent',    accent)

  // Font family
  if (b.fontFamily) {
    setCssVar('--p-font-family', b.fontFamily)
  }

  // Favicon dinamico
  if (b.faviconUrl) {
    setFavicon(b.faviconUrl)
  }

  // Custom CSS tenant (iniettato come tag <style>)
  if (b.customCss) {
    injectCustomCss(b.customCss)
  }
}

/** Imposta una CSS custom property sul :root (documentElement). */
function setCssVar(name: string, value: string): void {
  document.documentElement.style.setProperty(name, value)
}

/** Aggiorna dinamicamente il favicon della pagina. */
function setFavicon(url: string): void {
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  link.href = url
}

/**
 * Inietta il CSS personalizzato del tenant come tag <style> nel <head>.
 * Usa un ID fisso per evitare duplicati su re-render.
 */
function injectCustomCss(css: string): void {
  const existing = document.getElementById('tenant-custom-css')
  if (existing) {
    existing.textContent = css
  } else {
    const style = document.createElement('style')
    style.id = 'tenant-custom-css'
    style.textContent = css
    document.head.appendChild(style)
  }
}
