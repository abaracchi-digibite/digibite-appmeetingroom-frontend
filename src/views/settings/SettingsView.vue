<template>
  <MainLayout>
    <div class="settings-page">
      <!-- Main Container -->
      <div class="settings-container">
        <!-- Left Navigation Menu -->
        <aside class="settings-nav">
          <nav class="nav-list">
            <button
                v-for="section in sections"
                :key="section.id"
                class="nav-item"
                :class="{ active: activeSection === section.id }"
                ::title="t('views.settings.sectionLabel')"
                @click="activeSection = section.id"
            >
              <i :class="section.icon" class="nav-icon" />
              <span class="nav-label">{{ section.label }}</span>
            </button>
          </nav>
        </aside>

        <!-- Right Content Area -->
        <main class="settings-content">
          <!-- PROFILE SECTION -->
          <div v-if="activeSection === 'profile'" class="settings-section">
            <div class="section-header">
              <h2 class="section-title">{{ t('settings.profile') }}</h2>
              <p class="section-description">{{ t('settings.profileDesc') }}</p>
            </div>

            <div class="settings-card">
              <div class="card-content">
                <!-- Avatar & Email -->
                <div class="profile-info-box">
                  <div class="profile-avatar">{{ userInitials }}</div>
                  <div class="profile-details">
                    <p class="profile-email">{{ userEmail }}</p>
                    <p class="profile-role">{{ primaryRole }}</p>
                  </div>
                </div>

                <!-- Account Meta -->
                <div class="meta-section">
                  <div class="meta-row">
                    <span class="meta-label">{{ t('settings.tenantId') }}</span>
                    <code class="meta-value">{{ tenantId }}</code>
                  </div>
                  <div class="meta-row">
                    <span class="meta-label">{{ t('settings.roles') }}</span>
                    <div class="role-badges">
                      <span v-for="role in userRoles" :key="role" class="role-badge">
                        {{ role }}
                      </span>
                    </div>
                  </div>
                  <div v-if="accountCreatedAt" class="meta-row">
                    <span class="meta-label">{{ t('settings.memberSince') }}</span>
                    <span class="meta-value">{{ formatDate(accountCreatedAt) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- COMPANY SECTION (Admin only) -->
          <div v-if="activeSection === 'company' && isAdmin" class="settings-section">
            <div class="section-header">
              <h2 class="section-title">{{ t('settings.company') }}</h2>
              <p class="section-description">{{ t('settings.companyDesc') }}</p>
            </div>

            <div class="settings-card">
              <div class="card-content">
                <div class="company-overview-grid">
                  <div class="company-info-stack">
                    <div class="form-group">
                      <label class="form-label">{{ t('settings.companyName') }}</label>
                      <div class="form-value">{{ companyName }}</div>
                    </div>

                    <div class="form-group">
                      <label class="form-label">{{ t('settings.companyId') }}</label>
                      <code class="form-value code">{{ tenantId }}</code>
                    </div>

                    <div v-if="planInfo" class="form-group">
                      <label class="form-label">{{ t('settings.plan') }}</label>
                      <div class="form-value">{{ planInfo }}</div>
                    </div>
                  </div>

                  <div class="sidebar-preview-card">
                    <div class="sidebar-preview-copy">
                      <h3>{{ t('settings.logoUsageTitle') }}</h3>
                      <p>{{ t('settings.logoUsageDesc') }}</p>
                    </div>

                    <div class="sidebar-preview-grid">
                      <div class="sidebar-preview-panel">
                        <span class="sidebar-preview-label">{{ t('settings.mainLogo') }}</span>
                        <div class="sidebar-preview-shell sidebar-preview-shell-expanded">
                          <div class="sidebar-preview-brand-row">
                            <div v-if="companyLogoUrl" class="sidebar-preview-main-logo">
                              <img :src="companyLogoUrl" :alt="t('settings.mainLogo')" class="logo-img" />
                            </div>
                            <div v-else class="sidebar-preview-fallback">
                              <span>{{ tenantInitials }}</span>
                            </div>
                            <span class="sidebar-preview-name">{{ companyName }}</span>
                          </div>
                        </div>
                      </div>

                      <div class="sidebar-preview-panel">
                        <span class="sidebar-preview-label">{{ t('settings.compactLogo') }}</span>
                        <div class="sidebar-preview-shell sidebar-preview-shell-compact">
                          <div v-if="companyCompactLogoUrl" class="sidebar-preview-compact-logo">
                            <img :src="companyCompactLogoUrl" :alt="t('settings.compactLogo')" class="logo-img" />
                          </div>
                          <div v-else class="sidebar-preview-fallback sidebar-preview-fallback-compact">
                            <span>{{ tenantInitials }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Branding / Grafica Section -->
            <div class="section-header" style="margin-top: 2rem;">
              <h2 class="section-title">{{ t('settings.branding') }}</h2>
              <p class="section-description">{{ t('settings.brandingDesc') }}</p>
            </div>

            <div class="settings-card">
              <div class="card-content">
                <div class="branding-upload-block">
                  <label class="form-label">{{ t('settings.companyLogos') }}</label>
                  <p class="form-hint">{{ t('settings.logoUploadHint') }}</p>

                  <div class="logo-upload-grid">
                    <div class="logo-upload-card">
                      <div class="logo-upload-header">
                        <div>
                          <strong>{{ t('settings.mainLogo') }}</strong>
                          <p>{{ t('settings.mainLogoDesc') }}</p>
                        </div>
                        <button
                            type="button"
                            class="btn-save-branding"
                            :disabled="uploadingMainLogo"
                            @click="pickMainLogo"
                        >
                          <i v-if="uploadingMainLogo" class="pi pi-spin pi-spinner" />
                          <i v-else class="pi pi-upload" />
                          {{ uploadingMainLogo ? t('settings.uploadingLogo') : t('settings.uploadMainLogo') }}
                        </button>
                        <input
                            ref="mainLogoInput"
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                            class="hidden-file-input"
                            @change="handleMainLogoSelected"
                        />
                      </div>
                      <div class="logo-preview-container">
                        <div v-if="companyLogoUrl" class="logo-preview has-logo logo-preview-large">
                          <img :src="companyLogoUrl" :alt="t('settings.mainLogo')" class="logo-img" />
                        </div>
                        <div v-else class="logo-preview empty logo-preview-large">
                          <i class="pi pi-image" />
                          <span>{{ t('settings.noLogo') }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="logo-upload-card">
                      <div class="logo-upload-header">
                        <div>
                          <strong>{{ t('settings.compactLogo') }}</strong>
                          <p>{{ t('settings.compactLogoDesc') }}</p>
                        </div>
                        <button
                            type="button"
                            class="btn-save-branding"
                            :disabled="uploadingCompactLogo"
                            @click="pickCompactLogo"
                        >
                          <i v-if="uploadingCompactLogo" class="pi pi-spin pi-spinner" />
                          <i v-else class="pi pi-upload" />
                          {{ uploadingCompactLogo ? t('settings.uploadingLogo') : t('settings.uploadCompactLogo') }}
                        </button>
                        <input
                            ref="compactLogoInput"
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                            class="hidden-file-input"
                            @change="handleCompactLogoSelected"
                        />
                      </div>
                      <div class="logo-preview-container">
                        <div v-if="companyCompactLogoUrl" class="logo-preview has-logo logo-preview-square">
                          <img :src="companyCompactLogoUrl" :alt="t('settings.compactLogo')" class="logo-img" />
                        </div>
                        <div v-else class="logo-preview empty logo-preview-square">
                          <i class="pi pi-image" />
                          <span>{{ tenantInitials }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Primary Color -->
                <div class="form-group">
                  <label class="form-label">{{ t('settings.primaryColor') }}</label>
                  <div class="color-picker-row">
                    <input
                        v-model="brandingForm.primaryColor"
                        type="color"
                        class="color-input"
                    />
                    <input
                        v-model="brandingForm.primaryColor"
                        type="text"
                        class="form-input flex-1"
                        placeholder="#2563eb"
                    />
                  </div>
                  <p class="form-hint">{{ t('settings.primaryColorHint') }}</p>
                </div>

                <!-- Secondary Color -->
                <div class="form-group">
                  <label class="form-label">{{ t('settings.secondaryColor') }}</label>
                  <div class="color-picker-row">
                    <input
                        v-model="brandingForm.secondaryColor"
                        type="color"
                        class="color-input"
                    />
                    <input
                        v-model="brandingForm.secondaryColor"
                        type="text"
                        class="form-input flex-1"
                        placeholder="#0d9488"
                    />
                  </div>
                  <p class="form-hint">{{ t('settings.secondaryColorHint') }}</p>
                </div>

                <div class="branding-meaning-box">
                  <h3 class="preview-title">{{ t('settings.colorsMeaningTitle') }}</h3>
                  <div class="branding-usage-grid">
                    <div class="branding-usage-card">
                      <span class="branding-usage-badge">{{ t('settings.primary') }}</span>
                      <p>{{ t('settings.primaryColorMeaning') }}</p>
                    </div>
                    <div class="branding-usage-card">
                      <span class="branding-usage-badge branding-usage-badge-secondary">{{ t('settings.secondary') }}</span>
                      <p>{{ t('settings.secondaryColorMeaning') }}</p>
                    </div>
                    <div class="branding-usage-card branding-usage-card-wide">
                      <span class="branding-usage-badge branding-usage-badge-neutral">{{ t('settings.logoPreview') }}</span>
                      <p>{{ t('settings.colorsReferencesExtra') }}</p>
                    </div>
                  </div>
                </div>

                <!-- Sender Email -->
                <div class="form-group">
                  <label class="form-label">{{ t('settings.senderEmail') }}</label>
                  <input
                      v-model="brandingForm.senderEmail"
                      type="email"
                      class="form-input"
                        :placeholder="t('views.settings.noreplyEmail')"
                  />
                  <p class="form-hint">{{ t('settings.senderEmailDesc') }}</p>
                </div>

                <!-- Sender Name -->
                <div class="form-group">
                  <label class="form-label">{{ t('settings.senderName') }}</label>
                  <input
                      v-model="brandingForm.senderName"
                      type="text"
                      class="form-input"
                      :placeholder="t('settings.senderNamePlaceholder')"
                  />
                  <p class="form-hint">{{ t('settings.senderNameDesc') }}</p>
                </div>

                <!-- Branding Preview -->
                <div class="branding-preview">
                  <h3 class="preview-title">{{ t('settings.colorPreview') }}</h3>
                  <div class="branding-preview-colors">
                    <div
                        class="color-box-preview"
                        :style="{ background: brandingForm.primaryColor || '#2563eb' }"
                    >
                      <span>{{ t('settings.primary') }}</span>
                      <span class="color-hex">{{ brandingForm.primaryColor || '#2563eb' }}</span>
                    </div>
                    <div
                        class="color-box-preview"
                        :style="{ background: brandingForm.secondaryColor || '#0d9488' }"
                    >
                      <span>{{ t('settings.secondary') }}</span>
                      <span class="color-hex">{{ brandingForm.secondaryColor || '#0d9488' }}</span>
                    </div>
                  </div>
                </div>

                <!-- Save Button -->
                <div class="branding-actions">
                  <button
                      class="btn-save-branding"
                      :disabled="savingBranding"
                      @click="saveBranding"
                  >
                    <i v-if="savingBranding" class="pi pi-spin pi-spinner" />
                    <i v-else class="pi pi-check" />
                    {{ savingBranding ? t('settings.saving') : t('settings.saveBranding') }}
                  </button>
                  <span v-if="brandingSaved" class="branding-saved-msg">
                    <i class="pi pi-check-circle" />
                    {{ t('settings.brandingSaved') }}
                  </span>
                  <span v-if="brandingError" class="branding-error-msg">
                    <i class="pi pi-exclamation-circle" />
                    {{ brandingError }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- TENANT SECTION (Admin only) -->
          <div v-if="activeSection === 'tenant' && isAdmin" class="settings-section email-control-room">
            <div class="section-header">
              <h2 class="section-title">{{ t('settings.emailSettings') }}</h2>
              <p class="section-description">{{ t('settings.emailSettingsDesc') }}</p>
            </div>

            <section class="email-hero-card" aria-labelledby="email-hero-title">
              <div class="email-hero-glow email-hero-glow-one" />
              <div class="email-hero-glow email-hero-glow-two" />
              <div class="email-hero-content">
                <div class="email-hero-kicker">
                  <span class="email-live-dot" />
                  {{ t('settings.emailProvider') }}
                </div>
                <h2 id="email-hero-title" class="email-hero-title">{{ t('emailHeroTitle') }}</h2>
                <p class="email-hero-description">{{ t('emailHeroDescription') }}</p>
              </div>
              <div class="email-hero-panel" aria-hidden="true">
                <div class="email-orbit email-orbit-large" />
                <div class="email-orbit email-orbit-small" />
                <div class="email-envelope">
                  <i class="pi pi-envelope" />
                </div>
                <div class="email-auth-chip email-auth-chip-top">
                  <i class="pi pi-lock" /> TLS
                </div>
                <div class="email-auth-chip email-auth-chip-bottom">
                  <i class="pi pi-send" /> SMTP
                </div>
              </div>
            </section>

            <!-- Loading state -->
            <div v-if="emailLoading" class="settings-card email-glass-card email-loading-card">
              <div class="card-content email-loading">
                <i class="pi pi-spin pi-spinner" />
                <span>{{ t('common.loading', 'Caricamento...') }}</span>
              </div>
            </div>

            <template v-else>
              <div class="email-layout">
                <div class="email-main-stack">
                  <!-- Info: nessuna config salvata -->
                  <div v-if="emailLoaded && !emailCurrentlySaved" class="settings-card email-glass-card email-empty-card">
                    <div class="card-content">
                      <div class="email-card-headline">
                        <div class="email-icon-tile email-icon-tile-blue">
                          <i class="pi pi-info-circle" />
                        </div>
                        <div>
                          <span class="email-card-eyebrow">{{ t('emailSetupRequired') }}</span>
                          <h3>{{ t('settings.noEmailSettings') }}</h3>
                          <p>{{ t('emailSetupRequiredDesc') }}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Esito ultimo test -->
                  <div
                      v-if="emailCurrentlySaved && emailLastTest.at"
                      class="settings-card email-glass-card email-status-card email-last-test-card"
                      :class="emailLastTest.success ? 'email-last-test-card-ok' : 'email-last-test-card-ko'"
                  >
                    <div class="card-content email-last-test-content">
                      <div class="email-last-test-main">
                        <div class="email-last-test-icon" :class="emailLastTest.success ? 'ok' : 'ko'">
                          <i :class="emailLastTest.success ? 'pi pi-check' : 'pi pi-times'" />
                        </div>

                        <div class="email-last-test-copy">
                          <span class="email-card-eyebrow">{{ t('emailLastTestTitle') }}</span>
                          <h3>{{ emailLastTest.success ? t('settings.lastTestOk') : t('settings.lastTestKo') }}</h3>
                          <p>{{ emailLastTest.success ? t('settings.emailTestSuccessDesc') : t('settings.emailTestFailedDesc') }}</p>
                        </div>
                      </div>

                      <div class="email-last-test-meta">
                        <span class="email-last-test-state" :class="emailLastTest.success ? 'ok' : 'ko'">
                          <i :class="emailLastTest.success ? 'pi pi-check-circle' : 'pi pi-exclamation-triangle'" />
                           {{ emailLastTest.success ? t('settings.emailTestStateOperational') : t('settings.emailTestStateToVerify') }}
                        </span>
                        <span class="email-last-test-date">
                          <i class="pi pi-clock" />
                          {{ formatDateTime(emailLastTest.at) }}
                        </span>
                      </div>
                    </div>

                    <div v-if="!emailLastTest.success && emailLastTest.error" class="email-last-test-error email-error-panel">
                      <i class="pi pi-info-circle" />
                      <span>{{ emailLastTest.error }}</span>
                    </div>
                  </div>

                  <!-- Form principale -->
                  <div class="settings-card email-glass-card email-form-card">
                    <div class="card-content">
                      <div class="email-form-section-title">
                        <div>
                          <span>{{ t('settings.emailProvider') }}</span>
                          <p>{{ t('settings.emailSetupIntro') }}</p>
                        </div>
                        <div class="email-provider-pills" role="group" :aria-label="t('settings.emailProvider')">
                          <button
                              type="button"
                              class="email-provider-pill"
                              :class="{ active: emailForm.provider === 'Smtp' }"
                              @click="emailForm.provider = 'Smtp'"
                          >
                            <i class="pi pi-server" />
                            {{ t('settings.emailProviderSmtp') }}
                          </button>
                          <button
                              type="button"
                              class="email-provider-pill"
                              :class="{ active: emailForm.provider === 'SendGrid' }"
                              @click="emailForm.provider = 'SendGrid'"
                          >
                            <i class="pi pi-send" />
                            {{ t('settings.emailProviderSendGrid') }}
                          </button>
                        </div>
                      </div>

                      <!-- Campi comuni -->
                      <div class="email-field-grid">
                        <div class="email-field-card">
                          <label class="form-label">{{ t('settings.fromEmail') }} <span class="required-star">*</span></label>
                          <input
                              v-model="emailForm.fromEmail"
                              type="email"
                              class="email-native-input"
                                  :placeholder="t('views.settings.noreplyEmail')"
                          />
                          <p class="form-hint">{{ t('views.settings.senderEmailDesc') }}</p>
                        </div>
                        <div class="email-field-card">
                          <label class="form-label">{{ t('settings.fromName') }} <span class="required-star">*</span></label>
                          <input
                              v-model="emailForm.fromName"
                              type="text"
                              class="email-native-input"
                              :placeholder="t('views.settings.companyNameExample')"
                          />
                            <p class="form-hint">{{ t('views.settings.senderNameDesc') }}</p>
                        </div>
                      </div>

                      <!-- SMTP -->
                      <template v-if="emailForm.provider === 'Smtp'">
                        <div class="email-form-section-title email-form-section-title-compact">
                          <div>
                            <span>{{ t('settings.smtpSection') }}</span>
                            <p>{{ t('views.settings.smtpHostPortCredentialsDesc') }}</p>
                          </div>
                          <span class="email-section-badge"><i class="pi pi-shield" /> {{ t('views.settings.tlsRecommended') }}</span>
                        </div>

                        <div class="email-field-grid">
                          <div class="email-field-card email-field-card-wide">
                            <label class="form-label">{{ t('settings.smtpHost') }}</label>
                            <input
                                v-model="emailForm.smtpHost"
                                type="text"
                                class="email-native-input"
                                :placeholder="t('views.settings.smtpHostExample')"
                            />
                            <p class="form-hint">{{ t('views.settings.smtpHostDesc') }}</p>
                          </div>
                          <div class="email-field-card">
                            <label class="form-label">{{ t('settings.smtpPort') }}</label>
                            <input
                                v-model.number="emailForm.smtpPort"
                                type="number"
                                class="email-native-input"
                                placeholder="587"
                                min="1"
                                max="65535"
                            />
                          </div>
                        </div>

                        <div class="email-field-grid">
                          <div class="email-field-card">
                            <label class="form-label">{{ t('settings.smtpUsername') }}</label>
                            <input
                                v-model="emailForm.smtpUsername"
                                type="text"
                                class="email-native-input"
                                autocomplete="off"
                                :placeholder="t('views.settings.smtpUsernameExample')"
                            />
                          </div>
                          <div class="email-field-card">
                            <label class="form-label">{{ t('settings.smtpPassword') }}</label>
                            <input
                                v-model="emailForm.smtpPassword"
                                type="password"
                                class="email-native-input"
                                autocomplete="new-password"
                                :placeholder="t('views.settings.smtpPasswordLabel')"
                            />
                          </div>
                        </div>

                        <div class="email-field-grid email-field-grid-compact">
                          <div class="email-field-card">
                            <label class="form-label">{{ t('settings.smtpTimeout') }}</label>
                            <input
                                v-model.number="emailForm.smtpTimeoutMs"
                                type="number"
                                class="email-native-input"
                                placeholder="30000"
                                min="1000"
                            />
                            <p class="form-hint">{{ t('views.settings.smtpTimeoutDesc') }}</p>
                          </div>
                          <div class="email-switch-card">
                            <div class="email-switch-copy">
                              <label class="form-label">{{ t('settings.smtpEnableSsl') }}</label>
                              <p class="form-hint">Cifra la connessione con SSL/TLS quando supportato dal provider.</p>
                            </div>
                            <label class="email-native-switch">
                              <input v-model="emailForm.smtpEnableSsl" type="checkbox" />
                              <span class="email-native-switch-track">
                                <span class="email-native-switch-thumb" />
                              </span>
                            </label>
                          </div>
                        </div>
                      </template>

                      <!-- SENDGRID -->
                      <template v-if="emailForm.provider === 'SendGrid'">
                        <div class="email-form-section-title email-form-section-title-compact">
                          <div>
                            <span>{{ t('settings.sendGridSection') }}</span>
                            <p>{{ t('settings.sendGridSectionDesc') }}</p>
                          </div>
                          <span class="email-section-badge"><i class="pi pi-key" /> API</span>
                        </div>

                        <div class="email-field-grid email-field-grid-single">
                          <div class="email-field-card">
                            <label class="form-label">{{ t('settings.sendGridApiKey') }}</label>
                            <input
                                v-model="emailForm.sendGridApiKey"
                                type="password"
                                class="email-native-input"
                                autocomplete="new-password"
                                :placeholder="t('settings.sendGridApiKeyPlaceholder')"
                            />
                          </div>
                        </div>

                        <div class="email-switch-card email-switch-card-full">
                          <div class="email-switch-copy">
                            <label class="form-label">{{ t('settings.sendGridSandbox') }}</label>
                            <p class="form-hint">{{ t('settings.sendGridSandboxDesc') }}</p>
                          </div>
                          <label class="email-native-switch">
                            <input v-model="emailForm.sendGridSandboxMode" type="checkbox" />
                            <span class="email-native-switch-track">
                              <span class="email-native-switch-thumb" />
                            </span>
                          </label>
                        </div>
                      </template>

                      <!-- RETRY -->
                      <div class="email-form-section-title email-form-section-title-compact">
                        <div>
                          <span>{{ t('settings.retrySection') }}</span>
                          <p>{{ t('settings.retrySectionDesc') }}</p>
                        </div>
                        <span class="email-section-badge"><i class="pi pi-refresh" /> Retry</span>
                      </div>
                      <div class="email-field-grid">
                        <div class="email-field-card">
                          <label class="form-label">{{ t('settings.maxRetries') }}</label>
                          <input
                              v-model.number="emailForm.maxRetries"
                              type="number"
                              class="email-native-input"
                              min="0"
                              max="10"
                          />
                        </div>
                        <div class="email-field-card">
                          <label class="form-label">{{ t('settings.retryDelay') }}</label>
                          <input
                              v-model.number="emailForm.retryDelayMs"
                              type="number"
                              class="email-native-input"
                              min="100"
                              :placeholder="t('settings.retryDelayPlaceholder')"
                          />
                        </div>
                      </div>

                      <!-- Pulsanti salva / elimina -->
                      <div class="email-actions-bar">
                        <button
                            type="button"
                            class="btn-save-branding btn-email-primary"
                            :disabled="emailSaving"
                            @click="saveEmailSettings"
                        >
                          <i v-if="emailSaving" class="pi pi-spin pi-spinner" />
                          <i v-else class="pi pi-save" />
                          {{ emailSaving ? t('settings.saving') : t('settings.saveEmailSettings') }}
                        </button>
                        <button
                            v-if="emailCurrentlySaved"
                            type="button"
                            class="btn-delete-email"
                            :disabled="emailDeleting"
                            @click="deleteEmailSettings"
                        >
                          <i v-if="emailDeleting" class="pi pi-spin pi-spinner" />
                          <i v-else class="pi pi-trash" />
                          {{ t('settings.deleteEmailSettings') }}
                        </button>
                        <span v-if="emailSaved" class="branding-saved-msg">
                          <i class="pi pi-check-circle" />
                          {{ t('settings.emailSettingsSaved') }}
                        </span>
                        <span v-if="emailSaveError" class="branding-error-msg">
                          <i class="pi pi-exclamation-circle" />
                          {{ emailSaveError }}
                        </span>
                        <span v-if="emailDeleted" class="branding-saved-msg">
                          <i class="pi pi-check-circle" />
                          {{ t('settings.emailSettingsDeleted') }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <aside class="email-side-stack">
                  <div class="settings-card email-glass-card email-help-card">
                    <div class="card-content">
                      <div class="email-help-hero">
                        <div class="email-help-icon">
                          <i class="pi pi-compass" />
                        </div>
                        <div class="email-help-title-block">
                          <h3>{{ t('settings.emailSetupGuideTitle') }}</h3>
                          <p>{{ t('settings.emailSetupGuideDesc') }}</p>
                        </div>
                        <span class="email-help-badge">4 step</span>
                      </div>
                      <div class="email-help-steps">
                        <div class="email-help-step">
                          <span class="email-help-step-number">1</span>
                          <div class="email-help-step-copy">
                            <strong>{{ t('settings.emailSetupSteps.identityTitle') }}</strong>
                            <span>{{ t('settings.emailSetupSteps.identityDesc') }}</span>
                          </div>
                        </div>
                        <div class="email-help-step">
                          <span class="email-help-step-number">2</span>
                          <div class="email-help-step-copy">
                            <strong>{{ t('settings.emailSetupSteps.serverTitle') }}</strong>
                            <span>{{ t('settings.emailSetupSteps.serverDesc') }}</span>
                          </div>
                        </div>
                        <div class="email-help-step">
                          <span class="email-help-step-number">3</span>
                          <div class="email-help-step-copy">
                            <strong>{{ t('settings.emailSetupSteps.credentialsTitle') }}</strong>
                            <span>{{ t('settings.emailSetupSteps.credentialsDesc') }}</span>
                          </div>
                        </div>
                        <div class="email-help-step">
                          <span class="email-help-step-number">4</span>
                          <div class="email-help-step-copy">
                            <strong>{{ t('settings.emailSetupSteps.testTitle') }}</strong>
                            <span>{{ t('settings.emailSetupSteps.testDesc') }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="settings-card email-glass-card email-test-card">
                    <div class="card-content">
                      <div class="email-card-headline">
                        <div class="email-icon-tile email-icon-tile-blue">
                          <i class="pi pi-send" />
                        </div>
                        <div>
                          <span class="email-card-eyebrow">{{ t('settings.testSectionEyebrow') }}</span>
                          <h3>{{ t('settings.testSection') }}</h3>
                          <p>{{ t('settings.testSectionDesc') }}</p>
                        </div>
                      </div>

                      <div class="email-field-card email-test-input-card">
                        <label class="form-label">{{ t('settings.testEmailAddress') }}</label>
                        <input
                            v-model="testRecipient"
                            type="email"
                            class="email-native-input"
                            :placeholder="t('settings.testEmailPlaceholder')"
                        />
                      </div>

                      <button
                          type="button"
                          class="btn-send-test btn-email-test"
                          :disabled="testSending || !testRecipient"
                          @click="sendTestEmail"
                      >
                        <i v-if="testSending" class="pi pi-spin pi-spinner" />
                        <i v-else class="pi pi-send" />
                        {{ testSending ? t('settings.testSending') : t('settings.sendTestEmail') }}
                      </button>

                      <div
                          v-if="testResult"
                          class="test-result email-test-result"
                          :class="testResult.success ? 'test-ok' : 'test-ko'"
                      >
                        <i :class="testResult.success ? 'pi pi-check-circle' : 'pi pi-times-circle'" />
                        {{ testResult.message }}
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </template>
          </div>


          <!-- LANGUAGE SECTION -->
          <div v-if="activeSection === 'language'" class="settings-section">
            <div class="section-header">
              <h2 class="section-title">{{ t('settings.language') }}</h2>
              <p class="section-description">{{ t('settings.languageDesc') }}</p>
            </div>

            <div class="settings-card">
              <div class="card-content">
                <div class="preference-row">
                  <div class="preference-info">
                    <span class="preference-label">
                      <i class="pi pi-globe" />
                      {{ t('settings.interfaceLanguage') }}
                    </span>
                    <span class="preference-description">{{ t('settings.languageChoose') }}</span>
                  </div>
                  <div class="locale-toggle">
                    <button
                        class="locale-option"
                        :class="{ active: currentLocale === 'it' }"
                        @click="setLocale('it')"
                    >
                      {{ t('nav.localeIt') }}
                    </button>
                    <button
                        class="locale-option"
                        :class="{ active: currentLocale === 'en' }"
                        @click="setLocale('en')"
                    >
                      {{ t('nav.localeEn') }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- SECURITY SECTION -->
          <div v-if="activeSection === 'security'" class="settings-section">
            <div class="section-header">
              <h2 class="section-title">{{ t('settings.security') }}</h2>
              <p class="section-description">{{ t('settings.securityDesc') }}</p>
            </div>

            <div class="settings-card">
              <div class="card-content">
                <!-- Last Login -->
                <div v-if="lastLoginAt" class="info-row">
                  <div class="info-label">
                    <i class="pi pi-clock" />
                    {{ t('settings.lastLogin') }}
                  </div>
                  <span class="info-value">{{ formatDateTime(lastLoginAt) }}</span>
                </div>

                <!-- Active Sessions Info -->
                <div class="info-row">
                  <div class="info-label">
                    <i class="pi pi-shield" />
                    {{ t('settings.activeSessions') }}
                  </div>
                  <span class="info-value">{{ t('settings.oneSession') }}</span>
                </div>

                <!-- Password Change -->
                <div class="action-row">
                  <div class="action-info">
                    <span class="action-label">
                      <i class="pi pi-lock" />
                      {{ t('settings.changePassword') }}
                    </span>
                    <span class="action-description">{{ t('settings.changePasswordDesc') }}</span>
                  </div>
                  <button class="btn-secondary" disabled :title="t('settings.notAvailable')">
                    {{ t('common.edit') }}
                  </button>
                </div>

              </div>
            </div>
          </div>

          <!-- ------ SSO SECTION (Admin only) - redesigned ------------------------------------------------------------------------------------------- -->
          <div v-if="activeSection === 'sso' && isAdmin" class="settings-section sso-section sso-control-room">
            <div class="sso-hero-card">
              <div class="sso-hero-glow sso-hero-glow-one" />
              <div class="sso-hero-glow sso-hero-glow-two" />
              <div class="sso-hero-content">
                <div class="sso-hero-kicker">
                  <span class="sso-live-dot" />
                  {{ ssoForm.isEnabled ? t('common.enabled') : t('common.disabled') }}
                </div>
                <h2 class="sso-hero-title">{{ t('sso.settings.title') }}</h2>
                <p class="sso-hero-description">{{ t('sso.settings.description') }}</p>
              </div>
              <div class="sso-hero-panel" aria-hidden="true">
                <div class="sso-orbit sso-orbit-large" />
                <div class="sso-orbit sso-orbit-small" />
                <div class="sso-shield">
                  <i class="pi pi-shield" />
                </div>
                <div class="sso-auth-chip sso-auth-chip-top"><i class="pi pi-check-circle" /> OIDC</div>
                <div class="sso-auth-chip sso-auth-chip-bottom"><i class="pi pi-lock" /> {{ t('sso.settings.secureBadge') }}</div>
              </div>
            </div>

            <div v-if="ssoLoading" class="settings-card sso-loading-card">
              <div class="card-content">
                <ProgressSpinner style="width:44px;height:44px" strokeWidth="5" />
                <span>{{ t('common.loading', 'Caricamento...') }}</span>
              </div>
            </div>

            <template v-else>
              <section class="sso-layout">
                <div class="sso-main-stack">
                  <div class="settings-card sso-glass-card sso-status-card">
                    <div class="card-content">
                      <div class="sso-status-copy">
                        <div class="sso-icon-tile"><i class="pi pi-sign-in" /></div>
                        <div>
                          <div class="sso-card-eyebrow">{{ t('sso.settings.enableSso') }}</div>
                          <h3>{{ ssoForm.isEnabled ? t('common.enabled') : t('common.disabled') }}</h3>
                          <p>{{ t('sso.settings.description') }}</p>
                        </div>
                      </div>
                      <div class="sso-status-actions">
                        <label class="sso-native-switch" :aria-label="t('sso.settings.enableSso')">
                          <input v-model="ssoForm.isEnabled" type="checkbox" />
                          <span class="sso-native-switch-track"><span class="sso-native-switch-thumb" /></span>
                        </label>
                        <Button :label="t('sso.settings.testConnection')" icon="pi pi-bolt" outlined :loading="ssoTesting" :disabled="!ssoForm.authority" @click="testSsoConnection" />
                        <Button :label="t('common.save')" icon="pi pi-check" :loading="ssoSaving" severity="primary" @click="onSsoSaveClick" />
                      </div>
                    </div>
                  </div>

                  <div class="settings-card sso-glass-card sso-callback-card">
                    <div class="card-content">
                      <div class="sso-card-headline">
                        <div class="sso-icon-tile sso-icon-tile-blue"><i class="pi pi-link" /></div>
                        <div>
                          <div class="sso-card-eyebrow">{{ t('sso.settings.callbackUrlLabel') }}</div>
                          <h3>{{ t('sso.settings.callbackUrlLabel') }}</h3>
                          <p>{{ t('sso.settings.callbackUrlDescription') }}</p>
                        </div>
                      </div>
                      <div class="sso-copy-box">
                        <code>{{ ssoCallbackUrl }}</code>
                        <Button icon="pi pi-copy" rounded text severity="secondary" @click="copySsoCallback" />
                      </div>
                    </div>
                  </div>

                  <div class="settings-card sso-form-card sso-glass-card">
                    <div class="card-content">
                      <div class="sso-form-section-title">
                        <div>
                          <span>{{ t('sso.settings.providerSection') }}</span>
                          <p>{{ t('sso.settings.quickPresets') }}</p>
                        </div>
                        <div class="sso-provider-pills">
                          <Button v-for="p in ssoPresets" :key="p.id" :label="p.name" size="small" outlined :class="['preset-'+p.id]" @click="applySsoPreset(p)" />
                        </div>
                      </div>

                      <div class="sso-field-grid sso-field-grid-single">
                        <div class="sso-field-card">
                          <label class="form-label">{{ t('sso.settings.authority') }} <span class="required-star">*</span></label>
                          <input
                              v-model="ssoForm.authority"
                              type="url"
                              class="form-input sso-native-input"
                              :class="[errors.authority && touched.authority ? 'input-error' : '']"
                              placeholder="https://login.microsoftonline.com/{tenant}/v2.0"
                              autocomplete="off"
                              spellcheck="false"
                              @blur="touched.authority = true"
                          />
                          <small class="form-hint">{{ t('sso.settings.authorityHint') }}</small>
                          <small v-if="errors.authority && touched.authority" class="error-text">{{ t('sso.settings.errors.authorityRequired', 'Inserisci l\'Authority (Issuer URL).') }}</small>
                        </div>
                      </div>

                      <div class="sso-mini-grid">
                        <div class="sso-switch-card">
                          <div class="sso-switch-copy">
                            <div class="form-label">{{ t('sso.settings.publicClient') }}</div>
                            <small class="form-hint">{{ t('sso.settings.publicClientHint') }}</small>
                          </div>
                          <label class="sso-native-switch" :aria-label="t('sso.settings.publicClient')">
                            <input v-model="ssoForm.isPublicClient" type="checkbox" />
                            <span class="sso-native-switch-track"><span class="sso-native-switch-thumb" /></span>
                          </label>
                        </div>
                      </div>

                      <div class="sso-field-grid">
                        <div class="sso-field-card">
                          <label class="form-label">{{ t('sso.settings.clientId') }} <span class="required-star">*</span></label>
                          <input v-model="ssoForm.clientId" type="text" class="form-input sso-native-input" :class="[errors.clientId && touched.clientId ? 'input-error' : '']" placeholder="client-id-generato-dal-provider" autocomplete="off" spellcheck="false" @blur="touched.clientId = true" />
                          <small v-if="errors.clientId && touched.clientId" class="error-text">{{ t('sso.settings.errors.clientIdRequired', 'Inserisci il Client ID.') }}</small>
                        </div>
                        <div v-if="!ssoForm.isPublicClient" class="sso-field-card">
                          <label class="form-label">{{ t('sso.settings.clientSecret') }}</label>
                          <input v-model="ssoForm.clientSecret" type="password" class="form-input sso-native-input" :class="[errors.clientSecret && touched.clientSecret ? 'input-error' : '']" :placeholder="ssoHasSecret ? 'Secret già salvato: scrivi per sostituirlo' : t('sso.settings.clientSecretPlaceholder')" autocomplete="new-password" spellcheck="false" @blur="touched.clientSecret = true" />
                          <small class="form-hint">{{ ssoHasSecret ? t('sso.settings.clientSecretKeepHint') : '' }}</small>
                          <small v-if="errors.clientSecret && touched.clientSecret" class="error-text">{{ t('sso.settings.errors.clientSecretRequired', 'Inserisci il Client Secret.') }}</small>
                        </div>
                      </div>

                      <div class="sso-field-grid sso-field-grid-single">
                        <div class="sso-field-card">
                          <label class="form-label">{{ t('sso.settings.scopes') }}</label>
                          <input v-model="ssoForm.scopes" type="text" class="form-input sso-native-input" :class="[errors.scopes && touched.scopes ? 'input-error' : '']" placeholder="openid profile email" autocomplete="off" spellcheck="false" @blur="touched.scopes = true" />
                          <small class="form-hint">{{ t('sso.settings.scopesHint') }}</small>
                          <small v-if="errors.scopes && touched.scopes" class="error-text">{{ t('sso.settings.errors.scopesRequired', 'Specifica almeno uno scope (es. openid profile email).') }}</small>
                        </div>
                      </div>

                      <div class="sso-mini-grid">
                        <div class="sso-field-card">
                          <label class="form-label">{{ t('sso.settings.buttonLabel') }}</label>
                          <input v-model="ssoForm.buttonLabel" type="text" class="form-input-full sso-native-input" :placeholder="t('sso.settings.buttonLabelPlaceholder')" autocomplete="off" />
                          <small class="form-hint">{{ t('sso.settings.buttonLabelHint') }}</small>
                        </div>
                        <div class="sso-switch-card">
                          <div class="sso-switch-copy">
                            <div class="form-label">{{ t('sso.settings.requireSsoOnly') }}</div>
                            <small class="form-hint">{{ t('sso.settings.requireSsoOnlyHint') }}</small>
                          </div>
                          <label class="sso-native-switch" :aria-label="t('sso.settings.requireSsoOnly')">
                            <input v-model="ssoForm.requireSsoOnly" type="checkbox" />
                            <span class="sso-native-switch-track"><span class="sso-native-switch-thumb" /></span>
                          </label>
                        </div>
                      </div>

                      <div class="sso-mini-grid">
                        <div class="sso-switch-card">
                          <div class="sso-switch-copy">
                            <div class="form-label">{{ t('sso.settings.jitProvisioning') }}</div>
                            <small class="form-hint">{{ t('sso.settings.jitDescription') }}</small>
                          </div>
                          <label class="sso-native-switch" :aria-label="t('sso.settings.jitProvisioning')">
                            <input v-model="ssoForm.jitProvisioning" type="checkbox" />
                            <span class="sso-native-switch-track"><span class="sso-native-switch-thumb" /></span>
                          </label>
                        </div>
                        <div v-if="ssoForm.jitProvisioning" class="sso-field-card">
                          <label class="form-label">{{ t('sso.settings.jitDefaultRole') }}</label>
                          <select v-model="ssoForm.jitDefaultRole" class="form-input-full sso-native-input sso-native-select">
                            <option v-for="role in ssoRoles" :key="role.value" :value="role.value">{{ role.label }}</option>
                          </select>
                        </div>
                      </div>

                      <div class="sso-form-section-title sso-form-section-title-compact">
                        <div>
                          <span>{{ t('sso.settings.claimMappingTitle', 'Mappatura claim') }}</span>
                          <p>{{ t('sso.settings.claimMappingDescription', "Associa i claim dell'identity provider ai campi utente di Digibite.") }}</p>
                        </div>
                      </div>

                      <div class="sso-field-grid">
                        <div class="sso-field-card">
                          <label class="form-label">{{ t('sso.settings.claimEmail') }}</label>
                          <input v-model="ssoForm.claimEmail" type="text" class="form-input sso-native-input" placeholder="email" autocomplete="off" spellcheck="false" />
                        </div>
                        <div class="sso-field-card">
                          <label class="form-label">{{ t('sso.settings.claimName') }}</label>
                          <input v-model="ssoForm.claimName" type="text" class="form-input sso-native-input" placeholder="name" autocomplete="off" spellcheck="false" />
                        </div>
                      </div>

                      <div v-if="ssoTestResult" class="sso-test-result" :class="ssoTestResult.success ? 'ok' : 'ko'">
                        <i :class="ssoTestResult.success ? 'pi pi-check-circle' : 'pi pi-times-circle'" />
                        <span>{{ ssoTestResult.success ? t('sso.settings.testOk', 'Connessione verificata') : t('sso.settings.testKo', 'Connessione non riuscita') }}</span>
                      </div>

                      <div class="sso-actions-bar">
                        <Button :label="t('common.save')" icon="pi pi-check" @click="onSsoSaveClick" />
                        <Button v-if="ssoHasSecret" :label="t('sso.settings.deleteConfig')" icon="pi pi-trash" severity="danger" outlined @click="deleteSsoConfig" />
                      </div>
                    </div>
                  </div>
                </div>

                <aside class="sso-side-stack">
                  <div class="settings-card sso-help-card sso-glass-card">
                    <div class="card-content">
                      <div class="sso-help-hero">
                        <div class="sso-help-title-block">
                          <span class="sso-card-eyebrow">{{ t('sso.settings.helpEyebrow') }}</span>
                          <h3>{{ t('sso.settings.helpTitle') }}</h3>
                          <p>{{ t('sso.settings.helpDesc') }}</p>
                        </div>
                        <span class="sso-help-badge"><i class="pi pi-sparkles" /> 3 step</span>
                      </div>

                      <div class="sso-help-steps" :aria-label="t('sso.settings.helpChecklistAriaLabel')">
                        <div class="sso-help-step">
                          <span class="sso-help-step-number">1</span>
                          <div class="sso-help-step-copy">
                            <strong>{{ t('sso.settings.helpProviderTitle') }}</strong>
                            <span>{{ t('sso.settings.helpProviderDesc') }}</span>
                          </div>
                        </div>
                        <div class="sso-help-step">
                          <span class="sso-help-step-number">2</span>
                          <div class="sso-help-step-copy">
                            <strong>{{ t('sso.settings.helpCredentialsTitle') }}</strong>
                            <span>{{ t('sso.settings.helpCredentialsDesc') }}</span>
                          </div>
                        </div>
                        <div class="sso-help-step">
                          <span class="sso-help-step-number">3</span>
                          <div class="sso-help-step-copy">
                            <strong>{{ t('sso.settings.helpVerifyTitle') }}</strong>
                            <span>{{ t('sso.settings.helpVerifyDesc') }}</span>
                          </div>
                        </div>
                      </div>

                      <div class="sso-provider-reference">
                        <div class="sso-provider-reference-title"><i class="pi pi-link" /> {{ t('sso.settings.commonAuthorityUrls') }}</div>
                        <div class="sso-provider-reference-list">
                          <div class="sso-provider-reference-item">
                            <span><i class="pi pi-building" /> Azure AD</span>
                            <code>https://login.microsoftonline.com/{tenant}/v2.0</code>
                          </div>
                          <div class="sso-provider-reference-item">
                            <span><i class="pi pi-globe" /> Google</span>
                            <code>https://accounts.google.com</code>
                          </div>
                          <div class="sso-provider-reference-item">
                            <span><i class="pi pi-key" /> Keycloak</span>
                            <code>https://{host}/realms/{realm}</code>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>
              </section>
            </template>
          </div>
          <!-- ------ fine SSO SECTION (redesigned) ------------------------------------------------------------------------------------------------ -->

          <!-- ------ AppReception (integrazione client REST per-tenant) ------------------------------------------------------------------ -->
          <div v-if="activeSection === 'appReception' && isAdmin" class="settings-section">
            <div class="section-header">
              <h2 class="section-title">{{ t('settings.appReception') }}</h2>
              <p class="section-description">{{ t('settings.appReceptionDesc') }}</p>
            </div>

            <div class="settings-card">
              <div class="card-content">
              <!-- Toggle abilita integrazione -->
              <div class="form-group">
                <label class="checkbox-row">
                  <input v-model="appReceptionForm.isEnabled" type="checkbox" class="checkbox-input" />
                  <span>{{ t('settings.appReceptionEnable') }}</span>
                </label>
                <p class="form-hint">{{ t('settings.appReceptionEnableHelp') }}</p>
              </div>

              <!-- Base URL -->
              <div class="form-group">
                <label class="form-label">{{ t('settings.appReceptionBaseUrl') }}</label>
                <input
                    v-model="appReceptionForm.baseUrl"
                    type="url"
                    class="form-input"
                    placeholder="https://reception.cliente.com"
                />
                <p class="form-hint">{{ t('settings.appReceptionBaseUrlHelp') }}</p>
              </div>

              <!-- Username -->
              <div class="form-group">
                <label class="form-label">{{ t('settings.appReceptionUsername') }}</label>
                <input
                    v-model="appReceptionForm.username"
                    type="text"
                    class="form-input"
                    autocomplete="off"
                />
              </div>

              <!-- Password -->
              <div class="form-group">
                <label class="form-label">{{ t('settings.appReceptionPassword') }}</label>
                <input
                    v-model="appReceptionForm.password"
                    type="password"
                    class="form-input"
                    autocomplete="new-password"
                    :placeholder="appReceptionCurrent?.hasPassword ? t('settings.appReceptionPasswordKeep') : ''"
                />
                <p v-if="appReceptionCurrent?.hasPassword" class="form-hint">
                  <i class="pi pi-lock" /> {{ t('settings.appReceptionPasswordExisting') }}
                </p>
              </div>

              <!-- Attendees field id -->
              <div class="form-group">
                <label class="form-label">{{ t('settings.appReceptionAttendeesFieldId') }}</label>
                <input
                    v-model.number="appReceptionForm.attendeesFieldId"
                    type="number"
                    min="0"
                    class="form-input"
                    placeholder="—"
                />
                <p class="form-hint">{{ t('settings.appReceptionAttendeesFieldIdHelp') }}</p>
              </div>

              <!-- Cron schedule (avanzato) -->
              <div class="form-group">
                <label class="form-label">{{ t('settings.appReceptionJobScheduleCron') }}</label>
                <input
                    v-model="appReceptionForm.jobScheduleCron"
                    type="text"
                    class="form-input"
                    placeholder="0 */5 * * * ?"
                />
                <p class="form-hint">{{ t('settings.appReceptionJobScheduleHelp') }}</p>
              </div>

              <div class="branding-actions">
                <button
                    v-if="appReceptionCurrent"
                    type="button"
                    class="btn-save-branding btn-save-branding-danger"
                    :disabled="appReceptionDeleting"
                    @click="deleteAppReception"
                >
                  <i v-if="appReceptionDeleting" class="pi pi-spin pi-spinner" />
                  <i v-else class="pi pi-trash" />
                  {{ t('common.delete') }}
                </button>
                <button
                    type="button"
                    class="btn-save-branding"
                    :disabled="appReceptionSaving"
                    @click="saveAppReception"
                >
                  <i v-if="appReceptionSaving" class="pi pi-spin pi-spinner" />
                  <i v-else class="pi pi-check" />
                  {{ t('common.save') }}
                </button>
              </div>

              <p v-if="appReceptionCurrent" class="form-hint" style="margin-top: 0.75rem;">
                <i class="pi pi-clock" />
                {{ t('settings.appReceptionLastUpdate') }}: {{ formatAppReceptionDate(appReceptionCurrent.updatedAt) }}
              </p>
              </div>
            </div>
          </div>
          <!-- ------ fine AppReception SECTION ------------------------------------------------------------------------------------------------ -->

        </main>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { useTenantsStore } from '@/stores/tenants.store'
import MainLayout from '@/layouts/MainLayout.vue'
import { emailSettingsApi } from '@/api/email-settings.api'
import type { TenantEmailSettingsInput, TenantEmailSettingsResponse } from '@/api/email-settings.api'
import { ssoApi } from '@/api/sso.api'
import type { SsoConnectionTestResult } from '@/api/sso.api'
import { appReceptionApi } from '@/api/app-reception.api'
import type { AppReceptionConfigInput, AppReceptionConfigResponse } from '@/types/app-reception'
// Divider import removed (unused)
import ProgressSpinner from 'primevue/progressspinner'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const { t, locale } = useI18n()
const authStore = useAuthStore()
const uiStore = useUiStore()
const tenantsStore = useTenantsStore()
const toast   = useToast()
const confirm = useConfirm()

// ------ SSO State ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const ssoLoading    = ref(false)
const ssoSaving     = ref(false)
const ssoTesting    = ref(false)
const ssoHasSecret  = ref(false)
const ssoCallbackUrl = ref('')
const ssoTestResult  = ref<SsoConnectionTestResult | null>(null)

const ssoForm = ref({
  isEnabled:       false,
  authority:       '',
  clientId:        '',
  clientSecret:    '',
  isPublicClient:  false,
  scopes:          'openid profile email',
  jitProvisioning: false,
  jitDefaultRole:  'Tenant.Member',
  claimEmail:      'email',
  claimName:       'name',
  requireSsoOnly:  false,
  buttonLabel:     '',
})

const ssoRoles = [
  { label: 'Tenant.Member',        value: 'Tenant.Member' },
  { label: 'Tenant.Contributor',   value: 'Tenant.Contributor' },
  { label: 'Tenant.ResourceAdmin', value: 'Tenant.ResourceAdmin' },
  { label: 'Tenant.Admin',         value: 'Tenant.Admin' },
  { label: 'Tenant.Owner',         value: 'Tenant.Owner' },
]

const ssoPresets = [
  { id: 'azure',    name: 'Microsoft Azure AD',  authority: 'https://login.microsoftonline.com/{tenant-id}/v2.0', claimName: 'name' },
  { id: 'google',   name: 'Google Workspace',    authority: 'https://accounts.google.com',                        claimName: 'name' },
  { id: 'okta',     name: 'Okta',                authority: 'https://{your-domain}.okta.com/oauth2/default',      claimName: 'name' },
  { id: 'keycloak', name: 'Keycloak',            authority: 'https://{host}/realms/{realm}',                      claimName: 'preferred_username' },
]

// ----- Validation / touched state for better UX -----------------------------------------------------------------
const touched = ref({ authority: false, clientId: false, clientSecret: false, scopes: false })

const errors = computed(() => {
  const a = (ssoForm.value.authority ?? '').toString().trim() === ''
  const c = (ssoForm.value.clientId ?? '').toString().trim() === ''
  const sc = (ssoForm.value.scopes ?? '').toString().trim() === ''
  // clientSecret required only when there's no saved secret
  // clientSecret non richiesto se è un client pubblico (PKCE-only)
  const csRequired = !ssoForm.value.isPublicClient
                     && !ssoHasSecret.value
                     && (ssoForm.value.clientSecret ?? '').toString().trim() === ''
  return {
    authority: a,
    clientId: c,
    clientSecret: csRequired,
    scopes: sc,
  }
})

const isFormValid = computed(() => {
  const e = errors.value
  return !e.authority && !e.clientId && !e.clientSecret
})

async function loadSsoConfig(): Promise<void> {
  ssoLoading.value = true
  ssoTestResult.value = null
  try {
    const data = await ssoApi.getTenantConfig()
    ssoHasSecret.value   = data.hasClientSecret
    ssoCallbackUrl.value = data.callbackUrl
    ssoForm.value = {
      isEnabled:       data.isEnabled,
      authority:       data.authority,
      clientId:        data.clientId,
      clientSecret:    '',
      isPublicClient:  data.isPublicClient ?? false,
      scopes:          data.scopes,
      jitProvisioning: data.jitProvisioning,
      jitDefaultRole:  data.jitDefaultRole,
      claimEmail:      data.claimEmail,
      claimName:       data.claimName,
      requireSsoOnly:  data.requireSsoOnly,
      buttonLabel:     data.buttonLabel ?? '',
    }
  } catch {
    toast.add({ severity: 'error', summary: t('common.error'), detail: t('sso.settings.loadError'), life: 4000 })
  } finally {
    ssoLoading.value = false
  }
}

function applySsoPreset(preset: typeof ssoPresets[0]): void {
  ssoForm.value.authority  = preset.authority
  ssoForm.value.claimName  = preset.claimName
  toast.add({ severity: 'info', summary: t('sso.settings.presetApplied', { name: preset.name }), detail: t('sso.settings.presetAppliedDetail'), life: 3000 })
}

async function testSsoConnection(): Promise<void> {
  ssoTestResult.value = null
  ssoTesting.value = true
  try {
    ssoTestResult.value = await ssoApi.testTenantConnection(
        ssoForm.value.authority,
        ssoForm.value.clientId,
        ssoForm.value.clientSecret || '(existing)',
    )
  } finally {
    ssoTesting.value = false
  }
}

function onSsoSaveClick(): void {
  // Marca tutti i campi come touched per mostrare gli errori inline
  touched.value.authority    = true
  touched.value.clientId     = true
  touched.value.clientSecret = true
  touched.value.scopes       = true

  if (!isFormValid.value) {
    const missing: string[] = []
    if (errors.value.authority)    missing.push(t('sso.settings.authority'))
    if (errors.value.clientId)     missing.push(t('sso.settings.clientId'))
    if (errors.value.clientSecret) missing.push(t('sso.settings.clientSecret'))
    if (errors.value.scopes)       missing.push(t('sso.settings.scopes'))
    toast.add({
      severity: 'warn',
      summary:  t('common.error'),
      detail:   `${t('sso.settings.fillRequired', 'Compila i campi obbligatori')}: ${missing.join(', ')}`,
      life:     4000,
    })
    return
  }

  saveSsoConfig()
}

async function saveSsoConfig(): Promise<void> {
  ssoSaving.value = true
  try {
    await ssoApi.saveTenantConfig({
      isEnabled:       ssoForm.value.isEnabled,
      authority:       ssoForm.value.authority,
      clientId:        ssoForm.value.clientId,
      clientSecret:    ssoForm.value.clientSecret || null,
      isPublicClient:  ssoForm.value.isPublicClient,
      scopes:          ssoForm.value.scopes,
      jitProvisioning: ssoForm.value.jitProvisioning,
      jitDefaultRole:  ssoForm.value.jitDefaultRole,
      claimEmail:      ssoForm.value.claimEmail,
      claimName:       ssoForm.value.claimName,
      requireSsoOnly:  ssoForm.value.requireSsoOnly,
      buttonLabel:     ssoForm.value.buttonLabel || null,
    })
    await loadSsoConfig()
    toast.add({ severity: 'success', summary: t('common.saved'), detail: t('sso.settings.saveSuccess'), life: 3000 })
  } catch {
    toast.add({ severity: 'error', summary: t('common.error'), detail: t('sso.settings.saveError'), life: 4000 })
  } finally {
    ssoSaving.value = false
  }
}

function deleteSsoConfig(): void {
  confirm.require({
    message:      t('sso.settings.deleteConfirmMessage'),
    header:       t('sso.settings.deleteConfirmTitle'),
    icon:         'pi pi-exclamation-triangle',
    acceptClass:  'p-button-danger',
    accept: async () => {
      try {
        await ssoApi.deleteTenantConfig()
        await loadSsoConfig()
        toast.add({ severity: 'success', summary: t('common.deleted'), detail: t('sso.settings.deleteSuccess'), life: 3000 })
      } catch {
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('sso.settings.deleteError'), life: 4000 })
      }
    },
  })
}

async function copySsoCallback(): Promise<void> {
  await navigator.clipboard.writeText(ssoCallbackUrl.value).catch(() => {})
  toast.add({ severity: 'success', summary: t('common.copied'), life: 2000 })
}

// ------ State ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const activeSection = ref<string>('profile')

// ------ Sections Configuration ---------------------------------------------------------------------------------------------------------------------------------------------------
const sections = computed(() => {
  const allSections = [
    {
      id: 'profile' as const,
      label: t('settings.profile'),
      icon: 'pi pi-user',
    },
    {
      id: 'company' as const,
      label: t('settings.company'),
      icon: 'pi pi-building',
    },
    {
      id: 'tenant' as const,
      label: t('settings.tenant'),
      icon: 'pi pi-envelope',
    },
    {
      id: 'language' as const,
      label: t('settings.language'),
      icon: 'pi pi-globe',
    },
    {
      id: 'security' as const,
      label: t('settings.security'),
      icon: 'pi pi-lock',
    },
    {
      id: 'sso' as const,
      label: t('sso.settings.title'),
      icon: 'pi pi-sign-in',
    },
    {
      id: 'appReception' as const,
      label: t('settings.appReception'),
      icon: 'pi pi-link',
    },
  ]

  // Filter admin-only sections
  return allSections.filter(section => {
    if (section.id === 'company' || section.id === 'tenant'
        || section.id === 'sso' || section.id === 'appReception') {
      return isAdmin.value
    }
    return true
  })
})

// ------ Computed ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const currentLocale = computed(() => locale.value)

const userEmail = computed(() => authStore.user?.email ?? '')
const userRoles = computed(() => authStore.userRoles)
const userInitials = computed(() => {
  const email = userEmail.value
  return email.slice(0, 2).toUpperCase() || 'U'
})

const primaryRole = computed(() => {
  const roles = userRoles.value
  if (roles.includes('Platform.Owner')) return 'SuperAdmin'
  if (roles.includes('Tenant.Owner')) return 'Admin Tenant'
  if (roles.includes('Tenant.Contributor')) return 'Contributor'
  return 'Lettore'
})

const isAdmin = computed(() => {
  const roles = userRoles.value
  return roles.includes('Platform.Owner') || roles.includes('Tenant.Owner')
})

const tenantId = computed(() => authStore.currentTenantId ?? '–')

const currentTenant = computed(() => tenantsStore.currentTenant ?? tenantsStore.tenants[0] ?? null)

const companyName = computed(() => currentTenant.value?.name ?? 'Sconosciuto')
const companyLogoUrl = computed(() => currentTenant.value?.logoUrl ?? null)
const companyCompactLogoUrl = computed(() => currentTenant.value?.compactLogoUrl ?? null)
const tenantInitials = computed(() => {
  const value = companyName.value.trim()
  if (!value) return 'AZ'
  const parts = value.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return value.slice(0, 2).toUpperCase()
})

const planInfo = computed(() => {
  // planId non - pi- disponibile nel modello Tenant
  return null
})

const accountCreatedAt = computed(() => currentTenant.value?.createdAt ?? null)
const lastLoginAt = computed(() => null)

// ------ Email Settings State ---------------------------------------------------------------------------------------------------------------------------------------------------------
const emailLoading = ref(false)
const emailSaving = ref(false)
const emailSaved = ref(false)
const emailSaveError = ref('')
const emailDeleting = ref(false)
const emailDeleted = ref(false)
const emailLoaded = ref(false)

const emailForm = ref<TenantEmailSettingsInput>({
  provider: 'Smtp',
  fromEmail: '',
  fromName: '',
  smtpHost: '',
  smtpPort: 587,
  smtpUsername: '',
  smtpPassword: '',
  smtpEnableSsl: true,
  smtpTimeoutMs: 30000,
  sendGridApiKey: '',
  sendGridSandboxMode: false,
  maxRetries: 3,
  retryDelayMs: 1000,
})

// Esito dell'ultimo test (caricato dalla config salvata)
const emailLastTest = ref<{at?: string; success?: boolean; error?: string}>({})

// Campo destinatario per il test
const testRecipient = ref('')
const testSending = ref(false)
const testResult = ref<{success: boolean; message: string} | null>(null)

const emailCurrentlySaved = ref<TenantEmailSettingsResponse | null>(null)

async function loadEmailSettings() {
  emailLoading.value = true
  emailSaveError.value = ''
  try {
    const data = await emailSettingsApi.get()
    if (data) {
      emailCurrentlySaved.value = data
      emailForm.value = {
        provider: data.provider,
        fromEmail: data.fromEmail,
        fromName: data.fromName,
        smtpHost: data.smtpHost ?? '',
        smtpPort: data.smtpPort ?? 587,
        smtpUsername: data.smtpUsername ?? '',
        smtpPassword: data.smtpPassword ?? '',
        smtpEnableSsl: data.smtpEnableSsl,
        smtpTimeoutMs: data.smtpTimeoutMs,
        sendGridApiKey: data.sendGridApiKey ?? '',
        sendGridSandboxMode: data.sendGridSandboxMode,
        maxRetries: data.maxRetries,
        retryDelayMs: data.retryDelayMs,
      }
      emailLastTest.value = {
        at: data.lastTestAt,
        success: data.lastTestSuccess,
        error: data.lastTestError ?? undefined,
      }
    }
    emailLoaded.value = true
  } catch {
    emailLoaded.value = true
  } finally {
    emailLoading.value = false
  }
}

async function saveEmailSettings() {
  emailSaving.value = true
  emailSaved.value = false
  emailSaveError.value = ''
  try {
    const saved = await emailSettingsApi.upsert(emailForm.value)
    emailCurrentlySaved.value = saved
    emailLastTest.value = {
      at: saved.lastTestAt,
      success: saved.lastTestSuccess,
      error: saved.lastTestError ?? undefined,
    }
    emailSaved.value = true
    setTimeout(() => { emailSaved.value = false }, 3500)
  } catch (err: unknown) {
    emailSaveError.value = err instanceof Error ? err.message : t('settings.emailSettingsSaveError')
  } finally {
    emailSaving.value = false
  }
}

async function deleteEmailSettings() {
  if (!window.confirm(t('settings.deleteEmailSettingsConfirm'))) return
  emailDeleting.value = true
  emailDeleted.value = false
  try {
    await emailSettingsApi.remove()
    emailCurrentlySaved.value = null
    emailLastTest.value = {}
    emailDeleted.value = true
    emailLoaded.value = false
    // reset form to defaults
    emailForm.value = {
      provider: 'Smtp',
      fromEmail: '',
      fromName: '',
      smtpHost: '',
      smtpPort: 587,
      smtpUsername: '',
      smtpPassword: '',
      smtpEnableSsl: true,
      smtpTimeoutMs: 30000,
      sendGridApiKey: '',
      sendGridSandboxMode: false,
      maxRetries: 3,
      retryDelayMs: 1000,
    }
    setTimeout(() => { emailDeleted.value = false; emailLoaded.value = true }, 3000)
  } catch (err: unknown) {
    emailSaveError.value = err instanceof Error ? err.message : t('settings.saveError')
  } finally {
    emailDeleting.value = false
  }
}

async function sendTestEmail() {
  if (!testRecipient.value) return
  testSending.value = true
  testResult.value = null
  try {
    const result = await emailSettingsApi.test({
      to: testRecipient.value,
      config: emailForm.value,
    })
    testResult.value = result.success
        ? { success: true, message: t('settings.testSuccess') }
        : { success: false, message: t('settings.testFailed', { error: result.error ?? 'unknown error' }) }
  } catch (err: unknown) {
    testResult.value = {
      success: false,
      message: t('settings.testFailed', { error: err instanceof Error ? err.message : 'unknown error' }),
    }
  } finally {
    testSending.value = false
  }
}

// ------ Branding Form State ------------------------------------------------------------------------------------------------------------------------------------------------------------
const brandingForm = ref({
  primaryColor: '#2563eb',
  secondaryColor: '#0d9488',
  senderEmail: '',
  senderName: '',
})

const mainLogoInput = ref<HTMLInputElement | null>(null)
const compactLogoInput = ref<HTMLInputElement | null>(null)
const uploadingMainLogo = ref(false)
const uploadingCompactLogo = ref(false)

// ------ Saving State ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const savingBranding = ref(false)
const brandingSaved = ref(false)
const brandingError = ref('')

// ------ Methods ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function setLocale(loc: 'it' | 'en') {
  locale.value = loc
  uiStore.setLocale(loc)
}

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '–'
  const d = new Date(date)
  return d.toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '–'
  const d = new Date(date)
  return d.toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function pickMainLogo() {
  mainLogoInput.value?.click()
}

function pickCompactLogo() {
  compactLogoInput.value?.click()
}

async function handleMainLogoSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  uploadingMainLogo.value = true
  brandingError.value = ''
  try {
    await tenantsStore.uploadCurrentTenantLogo(file)
  } catch (err: unknown) {
    brandingError.value = err instanceof Error ? err.message : t('settings.saveError')
  } finally {
    uploadingMainLogo.value = false
    if (mainLogoInput.value) mainLogoInput.value.value = ''
  }
}

async function handleCompactLogoSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  uploadingCompactLogo.value = true
  brandingError.value = ''
  try {
    await tenantsStore.uploadCurrentTenantCompactLogo(file)
  } catch (err: unknown) {
    brandingError.value = err instanceof Error ? err.message : t('settings.saveError')
  } finally {
    uploadingCompactLogo.value = false
    if (compactLogoInput.value) compactLogoInput.value.value = ''
  }
}

function saveBranding() {
  savingBranding.value = true
  brandingSaved.value = false
  brandingError.value = ''

  tenantsStore.updateCurrentTenantSettings({
    primaryColor: brandingForm.value.primaryColor || undefined,
    secondaryColor: brandingForm.value.secondaryColor || undefined,
    senderEmail: brandingForm.value.senderEmail || undefined,
    senderName: brandingForm.value.senderName || undefined,
  }).then(() => {
    brandingSaved.value = true
    savingBranding.value = false
    setTimeout(() => { brandingSaved.value = false }, 3000)
  }).catch((err: unknown) => {
    brandingError.value = err instanceof Error ? err.message : t('settings.saveError')
    savingBranding.value = false
  })
}

// ─── AppReception integration (per-tenant REST client) ─────────────
const appReceptionCurrent = ref<AppReceptionConfigResponse | null>(null)
const appReceptionSaving = ref(false)
const appReceptionDeleting = ref(false)
const appReceptionForm = ref<{
  isEnabled: boolean
  baseUrl: string
  username: string
  password: string
  jobScheduleCron: string
  attendeesFieldId: number | null
}>({
  isEnabled: false,
  baseUrl: '',
  username: '',
  password: '',
  jobScheduleCron: '0 */5 * * * ?',
  attendeesFieldId: null,
})

function formatAppReceptionDate(iso: string): string {
  try { return new Date(iso).toLocaleString('it-IT') } catch { return iso }
}

async function loadAppReception(): Promise<void> {
  try {
    const data = await appReceptionApi.get()
    appReceptionCurrent.value = data
    if (data) {
      appReceptionForm.value = {
        isEnabled: data.isEnabled,
        baseUrl: data.baseUrl ?? '',
        username: data.username ?? '',
        password: '',
        jobScheduleCron: data.jobScheduleCron ?? '0 */5 * * * ?',
        attendeesFieldId: data.attendeesFieldId ?? null,
      }
    }
  } catch (e) {
    console.error('Failed to load AppReception config', e)
  }
}

async function saveAppReception(): Promise<void> {
  appReceptionSaving.value = true
  try {
    const dto: AppReceptionConfigInput = {
      isEnabled: appReceptionForm.value.isEnabled,
      baseUrl: appReceptionForm.value.baseUrl?.trim() || null,
      username: appReceptionForm.value.username?.trim() || null,
      password: appReceptionForm.value.password ? appReceptionForm.value.password : null,
      jobScheduleCron: appReceptionForm.value.jobScheduleCron?.trim() || null,
      attendeesFieldId: appReceptionForm.value.attendeesFieldId ?? null,
    }
    appReceptionCurrent.value = await appReceptionApi.upsert(dto)
    appReceptionForm.value.password = ''
    toast.add({ severity: 'success', summary: t('settings.appReceptionSaved'), life: 2500 })
  } catch (e: any) {
    console.error('Failed to save AppReception config', e)
    const msg = e?.response?.data?.message || t('common.errorSaving')
    toast.add({ severity: 'error', summary: msg, life: 4000 })
  } finally {
    appReceptionSaving.value = false
  }
}

async function deleteAppReception(): Promise<void> {
  if (!window.confirm(t('settings.appReceptionDeleteConfirm'))) return
  appReceptionDeleting.value = true
  try {
    await appReceptionApi.delete()
    appReceptionCurrent.value = null
    appReceptionForm.value = {
      isEnabled: false, baseUrl: '', username: '', password: '',
      jobScheduleCron: '0 */5 * * * ?', attendeesFieldId: null,
    }
    toast.add({ severity: 'success', summary: t('settings.appReceptionDeleted'), life: 2500 })
  } catch (e) {
    console.error('Failed to delete AppReception config', e)
    toast.add({ severity: 'error', summary: t('common.errorDeleting'), life: 3500 })
  } finally {
    appReceptionDeleting.value = false
  }
}

function initBrandingForm() {
  const tenant = currentTenant.value
  if (tenant) {
    brandingForm.value.primaryColor = tenant.primaryColor ?? '#2563eb'
    brandingForm.value.secondaryColor = tenant.secondaryColor ?? '#0d9488'
    brandingForm.value.senderEmail = tenant.senderEmail ?? ''
    brandingForm.value.senderName = tenant.senderName ?? ''
  }
}

onMounted(() => {
  // Usa l'endpoint self-service per caricare i dati del tenant corrente
  // (funziona per Tenant.Owner, Tenant.Contributor e Platform.Owner)
  tenantsStore.fetchCurrentTenant().then(() => {
    initBrandingForm()
  }).catch(() => {
    // Fallback: prova l'endpoint superadmin (solo per Platform.Owner)
    tenantsStore.fetchAllTenants().then(() => {
      initBrandingForm()
    }).catch(() => {})
  })

  // Carica configurazione email, SSO e AppReception (solo per admin)
  if (isAdmin.value) {
    loadEmailSettings()
    loadSsoConfig()
    loadAppReception()
  }
})
</script>

<style scoped src="./SettingsView.css"></style>
