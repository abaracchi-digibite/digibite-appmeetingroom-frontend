<template>
  <MainLayout>
    <div class="forbidden-container">
      <div class="forbidden-content">
        <div class="forbidden-icon">
          <i class="pi pi-shield" />
        </div>
        <div class="forbidden-code">403</div>
        <h2 class="forbidden-heading">{{ t('errors.forbiddenTitle') }}</h2>
        <p class="forbidden-description">
          {{ t('errors.forbiddenDescription') }}
        </p>
        <div class="forbidden-actions">
          <RouterLink to="/dashboard" class="forbidden-btn forbidden-btn-primary">
            <i class="pi pi-home" />
            {{ t('common.backToDashboard') }}
          </RouterLink>
          <button type="button" class="forbidden-btn forbidden-btn-ghost" @click="goBack">
            <i class="pi pi-arrow-left" />
            {{ t('common.back') }}
          </button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/layouts/MainLayout.vue'

const { t } = useI18n()
const router = useRouter()

function goBack(): void {
  if (window.history.length > 1) router.back()
  else router.push('/dashboard')
}
</script>

<style scoped>
.forbidden-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 200px);
  padding: 2rem;
}

.forbidden-content {
  text-align: center;
  max-width: 480px;
}

.forbidden-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(239, 68, 68, 0.06));
  color: #dc2626;
  font-size: 2.2rem;
  margin: 0 auto 1.25rem;
  box-shadow: 0 8px 24px -8px rgba(239, 68, 68, 0.4);
}

.forbidden-code {
  font-size: 3.5rem;
  font-weight: 800;
  color: #cbd5e1;
  letter-spacing: -0.04em;
  line-height: 1;
  margin-bottom: 0.75rem;
}

.forbidden-heading {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.6rem;
}

.forbidden-description {
  font-size: 0.95rem;
  color: #64748b;
  line-height: 1.55;
  margin: 0 0 1.75rem;
}

.forbidden-actions {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  justify-content: center;
}

.forbidden-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.6rem 1.1rem;
  border-radius: 0.55rem;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  text-decoration: none;
  transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.15s, box-shadow 0.15s;
  font-family: inherit;
}

.forbidden-btn-primary {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #ffffff;
  box-shadow: 0 4px 10px -3px rgba(79, 70, 229, 0.4);
}

.forbidden-btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px -4px rgba(79, 70, 229, 0.5);
}

.forbidden-btn-ghost {
  background: transparent;
  color: #475569;
  border-color: #e2e8f0;
}

.forbidden-btn-ghost:hover {
  background: #f8fafc;
  color: #1e293b;
  border-color: #cbd5e1;
}

/* Dark mode */
.dark .forbidden-btn-ghost {
  color: var(--text-secondary);
  border-color: var(--border-default);
}

.dark .forbidden-btn-ghost:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
  border-color: var(--border-strong);
}
</style>
