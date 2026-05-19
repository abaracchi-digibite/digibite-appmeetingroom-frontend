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

            <!-- ===== Card 1: Identità (read-only) ===== -->
            <div class="settings-card">
              <div class="card-content">
                <div class="subsection-label">{{ t('settings.companyIdentity') }}</div>

                <div class="company-identity-grid">
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
              </div>
            </div>

            <!-- ===== Card 2: Loghi ===== -->
            <div class="settings-card">
              <div class="card-content">
                <div class="subsection-label">{{ t('settings.companyLogos') }}</div>
                <p class="form-hint company-subsection-hint">{{ t('settings.logoUploadHint') }}</p>

                <ul class="logo-row-list">
                  <!-- Logo principale -->
                  <li class="logo-row">
                    <div class="logo-row-preview logo-row-preview-wide">
                      <img
                          v-if="companyLogoUrl"
                          :src="companyLogoUrl"
                          :alt="t('settings.mainLogo')"
                          class="logo-img"
                      />
                      <div v-else class="logo-row-empty">
                        <i class="pi pi-image" />
                      </div>
                    </div>
                    <div class="logo-row-body">
                      <div class="logo-row-text">
                        <strong class="logo-row-title">{{ t('settings.mainLogo') }}</strong>
                        <p class="logo-row-desc">{{ t('settings.mainLogoDesc') }}</p>
                        <span class="logo-row-status" :class="{ 'logo-row-status--empty': !companyLogoUrl }">
                          <i :class="companyLogoUrl ? 'pi pi-check-circle' : 'pi pi-exclamation-circle'" />
                          {{ companyLogoUrl ? t('settings.logoLoaded') : t('settings.noLogo') }}
                        </span>
                      </div>
                      <div class="logo-row-actions">
                        <button
                            type="button"
                            class="btn-save-branding"
                            :disabled="uploadingMainLogo"
                            @click="pickMainLogo"
                        >
                          <i v-if="uploadingMainLogo" class="pi pi-spin pi-spinner" />
                          <i v-else :class="companyLogoUrl ? 'pi pi-refresh' : 'pi pi-upload'" />
                          {{
                            uploadingMainLogo
                                ? t('settings.uploadingLogo')
                                : (companyLogoUrl ? t('settings.replaceLogo') : t('settings.uploadMainLogo'))
                          }}
                        </button>
                        <input
                            ref="mainLogoInput"
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                            class="hidden-file-input"
                            @change="handleMainLogoSelected"
                        />
                      </div>
                    </div>
                  </li>

                  <!-- Logo compatto -->
                  <li class="logo-row">
                    <div class="logo-row-preview logo-row-preview-square">
                      <img
                          v-if="companyCompactLogoUrl"
                          :src="companyCompactLogoUrl"
                          :alt="t('settings.compactLogo')"
                          class="logo-img"
                      />
                      <div v-else class="logo-row-empty">
                        <span>{{ tenantInitials }}</span>
                      </div>
                    </div>
                    <div class="logo-row-body">
                      <div class="logo-row-text">
                        <strong class="logo-row-title">{{ t('settings.compactLogo') }}</strong>
                        <p class="logo-row-desc">{{ t('settings.compactLogoDesc') }}</p>
                        <span class="logo-row-status" :class="{ 'logo-row-status--empty': !companyCompactLogoUrl }">
                          <i :class="companyCompactLogoUrl ? 'pi pi-check-circle' : 'pi pi-exclamation-circle'" />
                          {{ companyCompactLogoUrl ? t('settings.logoLoaded') : t('settings.noLogo') }}
                        </span>
                      </div>
                      <div class="logo-row-actions">
                        <button
                            type="button"
                            class="btn-save-branding"
                            :disabled="uploadingCompactLogo"
                            @click="pickCompactLogo"
                        >
                          <i v-if="uploadingCompactLogo" class="pi pi-spin pi-spinner" />
                          <i v-else :class="companyCompactLogoUrl ? 'pi pi-refresh' : 'pi pi-upload'" />
                          {{
                            uploadingCompactLogo
                                ? t('settings.uploadingLogo')
                                : (companyCompactLogoUrl ? t('settings.replaceLogo') : t('settings.uploadCompactLogo'))
                          }}
                        </button>
                        <input
                            ref="compactLogoInput"
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                            class="hidden-file-input"
                            @change="handleCompactLogoSelected"
                        />
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <!-- ===== Card 3: Brand & Email di sistema ===== -->
            <div class="settings-card">
              <div class="card-content">
                <div class="subsection-label">{{ t('settings.brandColors') }}</div>

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

                <hr class="appreception-divider" />

                <div class="subsection-label">{{ t('settings.systemEmail') }}</div>

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

                <div class="appreception-footer">
                  <span v-if="brandingSaved" class="branding-saved-msg">
                    <i class="pi pi-check-circle" />
                    {{ t('settings.brandingSaved') }}
                  </span>
                  <span v-else-if="brandingError" class="branding-error-msg">
                    <i class="pi pi-exclamation-circle" />
                    {{ brandingError }}
                  </span>
                  <div class="appreception-actions">
                    <button
                        type="button"
                        class="btn-save-branding"
                        :disabled="savingBranding"
                        @click="saveBranding"
                    >
                      <i v-if="savingBranding" class="pi pi-spin pi-spinner" />
                      <i v-else class="pi pi-check" />
                      {{ savingBranding ? t('settings.saving') : t('settings.saveBranding') }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TENANT SECTION (Admin only) -->
          <div v-if="activeSection === 'tenant' && isAdmin" class="settings-section">
            <div class="section-header">
              <h2 class="section-title">{{ t('settings.emailSettings') }}</h2>
              <p class="section-description">{{ t('settings.emailSettingsDesc') }}</p>
            </div>

            <!-- Loading state -->
            <div v-if="emailLoading" class="settings-card email-glass-card email-loading-card">
              <div class="card-content email-loading">
                <i class="pi pi-spin pi-spinner" />
                <span>{{ t('common.loading') }}</span>
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
                              <p class="form-hint">{{ t('settings.smtpSslHint') }}</p>
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
                        <span class="email-section-badge"><i class="pi pi-refresh" /> {{ t('common.retry') }}</span>
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
                  <button class="btn-secondary" @click="openChangePasswordDialog">
                    {{ t('common.edit') }}
                  </button>
                </div>

              </div>
            </div>
          </div>

          <!-- ------ SSO SECTION (Admin only) - redesigned ------------------------------------------------------------------------------------------- -->
          <div v-if="activeSection === 'sso' && isAdmin" class="settings-section">
            <div class="section-header">
              <h2 class="section-title">{{ t('sso.settings.title') }}</h2>
              <p class="section-description">{{ t('sso.settings.description') }}</p>
            </div>

            <div v-if="ssoLoading" class="settings-card">
              <div class="card-content sso-loading-row">
                <ProgressSpinner style="width:36px;height:36px" strokeWidth="5" />
                <span>{{ t('common.loading') }}</span>
              </div>
            </div>

            <template v-else>
              <div class="settings-card">
                <div class="card-content">
                  <!-- Toggle abilita SSO -->
                  <div class="appreception-toggle-row">
                    <div class="appreception-toggle-text">
                      <span class="appreception-toggle-label">{{ t('sso.settings.enableSso') }}</span>
                      <span class="appreception-toggle-help">{{ t('sso.settings.description') }}</span>
                    </div>
                    <PrimeToggleSwitch v-model="ssoForm.isEnabled" :aria-label="t('sso.settings.enableSso')" />
                  </div>

                  <hr class="appreception-divider" />

                  <!-- Callback URL (read-only con copia) -->
                  <div class="subsection-label">{{ t('sso.settings.callbackUrlLabel') }}</div>
                  <div class="form-group">
                    <div class="sso-copy-row">
                      <input
                          :value="ssoCallbackUrl"
                          type="text"
                          class="form-input"
                          readonly
                      />
                      <button
                          type="button"
                          class="btn-secondary sso-copy-btn"
                          @click="copySsoCallback"
                      >
                        <i class="pi pi-copy" />
                        {{ t('common.copy') }}
                      </button>
                    </div>
                    <p class="form-hint">{{ t('sso.settings.callbackUrlDescription') }}</p>
                  </div>

                  <hr class="appreception-divider" />

                  <!-- Provider OIDC -->
                  <div class="subsection-label">{{ t('sso.settings.providerSection') }}</div>

                  <div class="form-group">
                    <label class="form-label">{{ t('sso.settings.quickPresets') }}</label>
                    <div class="sso-preset-row">
                      <button
                          v-for="p in ssoPresets"
                          :key="p.id"
                          type="button"
                          class="btn-secondary sso-preset-btn"
                          @click="applySsoPreset(p)"
                      >
                        {{ p.name }}
                      </button>
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label">
                      {{ t('sso.settings.authority') }}
                      <span class="required-star">*</span>
                    </label>
                    <input
                        v-model="ssoForm.authority"
                        type="url"
                        class="form-input"
                        :class="{ 'input-error': errors.authority && touched.authority }"
                        placeholder="https://login.microsoftonline.com/{tenant}/v2.0"
                        autocomplete="off"
                        spellcheck="false"
                        @blur="touched.authority = true"
                    />
                    <p class="form-hint">{{ t('sso.settings.authorityHint') }}</p>
                    <p v-if="errors.authority && touched.authority" class="error-text">
                      {{ t('sso.settings.errors.authorityRequired') }}
                    </p>
                  </div>

                  <hr class="appreception-divider" />

                  <!-- Credenziali -->
                  <div class="subsection-label">{{ t('sso.settings.credentialsSection') }}</div>

                  <div class="appreception-toggle-row">
                    <div class="appreception-toggle-text">
                      <span class="appreception-toggle-label">{{ t('sso.settings.publicClient') }}</span>
                      <span class="appreception-toggle-help">{{ t('sso.settings.publicClientHint') }}</span>
                    </div>
                    <PrimeToggleSwitch v-model="ssoForm.isPublicClient" :aria-label="t('sso.settings.publicClient')" />
                  </div>

                  <div class="form-group">
                    <label class="form-label">
                      {{ t('sso.settings.clientId') }}
                      <span class="required-star">*</span>
                    </label>
                    <input
                        v-model="ssoForm.clientId"
                        type="text"
                        class="form-input"
                        :class="{ 'input-error': errors.clientId && touched.clientId }"
                        :placeholder="t('sso.settings.clientIdPlaceholder')"
                        autocomplete="off"
                        spellcheck="false"
                        @blur="touched.clientId = true"
                    />
                    <p v-if="errors.clientId && touched.clientId" class="error-text">
                      {{ t('sso.settings.errors.clientIdRequired') }}
                    </p>
                  </div>

                  <div v-if="!ssoForm.isPublicClient" class="form-group">
                    <label class="form-label">{{ t('sso.settings.clientSecret') }}</label>
                    <input
                        v-model="ssoForm.clientSecret"
                        type="password"
                        class="form-input"
                        :class="{ 'input-error': errors.clientSecret && touched.clientSecret }"
                        :placeholder="ssoHasSecret ? t('sso.settings.clientSecretReplacePlaceholder') : t('sso.settings.clientSecretPlaceholder')"
                        autocomplete="new-password"
                        spellcheck="false"
                        @blur="touched.clientSecret = true"
                    />
                    <p v-if="ssoHasSecret" class="form-hint">
                      <i class="pi pi-lock" /> {{ t('sso.settings.clientSecretKeepHint') }}
                    </p>
                    <p v-if="errors.clientSecret && touched.clientSecret" class="error-text">
                      {{ t('sso.settings.errors.clientSecretRequired') }}
                    </p>
                  </div>

                  <div class="form-group">
                    <label class="form-label">{{ t('sso.settings.scopes') }}</label>
                    <input
                        v-model="ssoForm.scopes"
                        type="text"
                        class="form-input"
                        :class="{ 'input-error': errors.scopes && touched.scopes }"
                        placeholder="openid profile email"
                        autocomplete="off"
                        spellcheck="false"
                        @blur="touched.scopes = true"
                    />
                    <p class="form-hint">{{ t('sso.settings.scopesHint') }}</p>
                    <p v-if="errors.scopes && touched.scopes" class="error-text">
                      {{ t('sso.settings.errors.scopesRequired') }}
                    </p>
                  </div>

                  <hr class="appreception-divider" />

                  <!-- Opzioni -->
                  <div class="subsection-label">{{ t('sso.settings.optionsSection') }}</div>

                  <div class="form-group">
                    <label class="form-label">{{ t('sso.settings.buttonLabel') }}</label>
                    <input
                        v-model="ssoForm.buttonLabel"
                        type="text"
                        class="form-input"
                        :placeholder="t('sso.settings.buttonLabelPlaceholder')"
                        autocomplete="off"
                    />
                    <p class="form-hint">{{ t('sso.settings.buttonLabelHint') }}</p>
                  </div>

                  <div class="appreception-toggle-row">
                    <div class="appreception-toggle-text">
                      <span class="appreception-toggle-label">{{ t('sso.settings.requireSsoOnly') }}</span>
                      <span class="appreception-toggle-help">{{ t('sso.settings.requireSsoOnlyHint') }}</span>
                    </div>
                    <PrimeToggleSwitch v-model="ssoForm.requireSsoOnly" :aria-label="t('sso.settings.requireSsoOnly')" />
                  </div>

                  <div class="appreception-toggle-row">
                    <div class="appreception-toggle-text">
                      <span class="appreception-toggle-label">{{ t('sso.settings.jitProvisioning') }}</span>
                      <span class="appreception-toggle-help">{{ t('sso.settings.jitDescription') }}</span>
                    </div>
                    <PrimeToggleSwitch v-model="ssoForm.jitProvisioning" :aria-label="t('sso.settings.jitProvisioning')" />
                  </div>

                  <div v-if="ssoForm.jitProvisioning" class="form-group">
                    <label class="form-label">{{ t('sso.settings.jitDefaultRole') }}</label>
                    <select v-model="ssoForm.jitDefaultRole" class="form-input">
                      <option v-for="role in ssoRoles" :key="role.value" :value="role.value">{{ role.label }}</option>
                    </select>
                  </div>

                  <hr class="appreception-divider" />

                  <!-- Mappatura claim -->
                  <div class="subsection-label">{{ t('sso.settings.claimMappingTitle') }}</div>
                  <p class="form-hint company-subsection-hint">
                    {{ t('sso.settings.claimMappingDescription') }}
                  </p>

                  <div class="form-group">
                    <label class="form-label">{{ t('sso.settings.claimEmail') }}</label>
                    <input v-model="ssoForm.claimEmail" type="text" class="form-input" placeholder="email" autocomplete="off" spellcheck="false" />
                  </div>

                  <div class="form-group">
                    <label class="form-label">{{ t('sso.settings.claimName') }}</label>
                    <input v-model="ssoForm.claimName" type="text" class="form-input" placeholder="name" autocomplete="off" spellcheck="false" />
                  </div>

                  <!-- Footer: esito test + bottoni azione -->
                  <div class="appreception-footer">
                    <span v-if="ssoTestResult" class="sso-test-result-inline" :class="ssoTestResult.success ? 'ok' : 'ko'">
                      <i :class="ssoTestResult.success ? 'pi pi-check-circle' : 'pi pi-times-circle'" />
                      {{ ssoTestResult.success
                          ? t('sso.settings.testOk')
                          : t('sso.settings.testKo') }}
                    </span>
                    <div class="appreception-actions">
                      <button
                          v-if="ssoHasSecret"
                          type="button"
                          class="btn-save-branding btn-save-branding-danger"
                          @click="deleteSsoConfig"
                      >
                        <i class="pi pi-trash" />
                        {{ t('sso.settings.deleteConfig') }}
                      </button>
                      <button
                          type="button"
                          class="btn-secondary"
                          :disabled="ssoTesting || !ssoForm.authority"
                          @click="testSsoConnection"
                      >
                        <i v-if="ssoTesting" class="pi pi-spin pi-spinner" />
                        <i v-else class="pi pi-bolt" />
                        {{ t('sso.settings.testConnection') }}
                      </button>
                      <button
                          type="button"
                          class="btn-save-branding"
                          :disabled="ssoSaving"
                          @click="onSsoSaveClick"
                      >
                        <i v-if="ssoSaving" class="pi pi-spin pi-spinner" />
                        <i v-else class="pi pi-check" />
                        {{ t('common.save') }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
          <!-- ------ fine SSO SECTION ------------------------------------------------------------------------------------------------ -->

          <!-- ------ AppReception (integrazione client REST per-tenant) ------------------------------------------------------------------ -->
          <div v-if="activeSection === 'appReception' && isAdmin" class="settings-section">
            <div class="section-header">
              <h2 class="section-title">{{ t('settings.appReception') }}</h2>
              <p class="section-description">{{ t('settings.appReceptionDesc') }}</p>
            </div>

            <div class="settings-card appreception-card">
              <div class="card-content">
                <!-- Toggle abilita: switch PrimeVue (chiaro e accessibile) -->
                <div class="appreception-toggle-row">
                  <div class="appreception-toggle-text">
                    <span class="appreception-toggle-label">{{ t('settings.appReceptionEnable') }}</span>
                    <span class="appreception-toggle-help">{{ t('settings.appReceptionEnableHelp') }}</span>
                  </div>
                  <PrimeToggleSwitch v-model="appReceptionForm.isEnabled" :aria-label="t('settings.appReceptionEnable')" />
                </div>

                <hr class="appreception-divider" />

                <!-- Connessione -->
                <div class="subsection-label">{{ t('settings.appReceptionConnection') }}</div>

                <div class="form-group">
                  <label class="form-label">{{ t('settings.appReceptionBaseUrl') }}</label>
                  <input
                      v-model="appReceptionForm.baseUrl"
                      type="url"
                      class="form-input"
                      placeholder="https://reception.customer.com"
                  />
                  <p class="form-hint">{{ t('settings.appReceptionBaseUrlHelp') }}</p>
                </div>

                <div class="form-group">
                  <label class="form-label">{{ t('settings.appReceptionUsername') }}</label>
                  <input
                      v-model="appReceptionForm.username"
                      type="text"
                      class="form-input"
                      autocomplete="off"
                  />
                </div>

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

                <hr class="appreception-divider" />

                <!-- Avanzato -->
                <div class="subsection-label">{{ t('settings.appReceptionAdvanced') }}</div>

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

                <!-- Footer: timestamp + bottoni Save/Delete -->
                <div class="appreception-footer">
                  <span v-if="appReceptionCurrent" class="appreception-meta">
                    <i class="pi pi-clock" />
                    {{ t('settings.appReceptionLastUpdate') }}: {{ formatAppReceptionDate(appReceptionCurrent.updatedAt) }}
                  </span>
                  <div class="appreception-actions">
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
                </div>
              </div>
            </div>
          </div>
          <!-- ------ fine AppReception SECTION ------------------------------------------------------------------------------------------------ -->

        </main>
      </div>
    </div>
    <!-- ─── Change Password Dialog ─────────────────────────────── -->
    <AppDialog
        v-model:visible="changePasswordVisible"
        :header="t('settings.changePasswordTitle')"
        icon="pi pi-lock"
        size="sm"
    >
      <template #default>
        <div class="dlg-field">
          <label class="dlg-label">{{ t('settings.currentPassword') }} <span class="required-star">*</span></label>
          <input
              v-model="changePwdForm.currentPassword"
              type="password"
              class="dlg-input"
              autocomplete="current-password"
          />
        </div>
        <div class="dlg-field">
          <label class="dlg-label">{{ t('settings.newPassword') }} <span class="required-star">*</span></label>
          <input
              v-model="changePwdForm.newPassword"
              type="password"
              class="dlg-input"
              autocomplete="new-password"
          />
        </div>
        <div class="dlg-field">
          <label class="dlg-label">{{ t('settings.confirmNewPassword') }} <span class="required-star">*</span></label>
          <input
              v-model="changePwdForm.confirmNewPassword"
              type="password"
              class="dlg-input"
              autocomplete="new-password"
          />
        </div>
        <p v-if="changePwdError" class="dlg-error-text">{{ changePwdError }}</p>
      </template>
      <template #footer>
        <Button
            :label="t('common.cancel')"
            severity="secondary"
            text
            :disabled="changePwdSaving"
            @click="changePasswordVisible = false"
        />
        <Button
            :label="changePwdSaving ? t('settings.saving') : t('settings.changePassword')"
            icon="pi pi-lock"
            :loading="changePwdSaving"
            @click="submitChangePassword"
        />
      </template>
    </AppDialog>
    <!-- ─── Fine Change Password Dialog ─────────────────────────── -->
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
import { authApi } from '@/api/auth.api'
// Divider import removed (unused)
import ProgressSpinner from 'primevue/progressspinner'
import PrimeToggleSwitch from 'primevue/toggleswitch'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import AppDialog from '@/components/common/AppDialog.vue'

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

const ssoRoles = computed(() => [
  { label: t('users.roles.viewer'),      value: 'Tenant.Member' },
  { label: t('users.roles.contributor'), value: 'Tenant.Contributor' },
  { label: 'Tenant.ResourceAdmin',       value: 'Tenant.ResourceAdmin' },
  { label: 'Tenant.Admin',               value: 'Tenant.Admin' },
  { label: t('users.roles.owner'),       value: 'Tenant.Owner' },
])

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
      detail:   `${t('sso.settings.fillRequired')}: ${missing.join(', ')}`,
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
  if (roles.includes('Platform.Owner')) return t('users.roles.platformOwner')
  if (roles.includes('Tenant.Owner')) return t('users.roles.owner')
  if (roles.includes('Tenant.Contributor')) return t('users.roles.contributor')
  return t('users.roles.viewer')
})

// Solo SysAdmin (Platform.Owner) o Admin del tenant (Tenant.Owner) vedono
// le sezioni "Azienda", "Tenant", "Single Sign-On" e "AppReception".
// Uso hasMinTenantRole('Owner') così durante impersonification del SuperAdmin
// il check ricade sui ruoli del tenant target (vedere come quel ruolo).
const isAdmin = computed(() => authStore.hasMinTenantRole('Owner'))

const tenantId = computed(() => authStore.currentTenantId ?? '–')

const currentTenant = computed(() => tenantsStore.currentTenant ?? tenantsStore.tenants[0] ?? null)

const companyName = computed(() => currentTenant.value?.name ?? t('common.unknown'))
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
        : { success: false, message: t('settings.testFailed', { error: result.error ?? t('common.unknown') }) }
  } catch (err: unknown) {
    testResult.value = {
      success: false,
      message: t('settings.testFailed', { error: err instanceof Error ? err.message : t('common.unknown') }),
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
  return d.toLocaleDateString(locale.value, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '–'
  const d = new Date(date)
  return d.toLocaleDateString(locale.value, {
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
  try { return new Date(iso).toLocaleString(locale.value) } catch { return iso }
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

// ─── Change Password ──────────────────────────────────────────────────────
const changePasswordVisible = ref(false)
const changePwdSaving = ref(false)
const changePwdError = ref('')

const changePwdForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
})

function openChangePasswordDialog(): void {
  changePwdForm.value = { currentPassword: '', newPassword: '', confirmNewPassword: '' }
  changePwdError.value = ''
  changePasswordVisible.value = true
}

async function submitChangePassword(): Promise<void> {
  changePwdError.value = ''

  if (!changePwdForm.value.currentPassword || !changePwdForm.value.newPassword || !changePwdForm.value.confirmNewPassword) {
    changePwdError.value = t('settings.fillAllFields')
    return
  }
  if (changePwdForm.value.newPassword.length < 8) {
    changePwdError.value = t('settings.passwordTooShort')
    return
  }
  if (changePwdForm.value.newPassword !== changePwdForm.value.confirmNewPassword) {
    changePwdError.value = t('settings.passwordMismatch')
    return
  }

  changePwdSaving.value = true
  try {
    await authApi.changePassword(changePwdForm.value.currentPassword, changePwdForm.value.newPassword)
    changePasswordVisible.value = false
    toast.add({ severity: 'success', summary: t('common.saved'), detail: t('settings.passwordChanged'), life: 3500 })
  } catch {
    changePwdError.value = t('settings.changePasswordError')
  } finally {
    changePwdSaving.value = false
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
