<template>
  <Dialog
    :visible="visible"
    :modal="modal"
    :closable="closable"
    :close-on-escape="closeOnEscape"
    :dismissable-mask="dismissableMask"
    :style="computedStyle"
    :content-class="contentClass"
    :pt="passThrough"
    @update:visible="(v: boolean) => $emit('update:visible', v)"
  >
    <!-- Custom Header -->
    <template #header>
      <div class="app-dialog-header">
        <div v-if="icon" class="app-dialog-header-icon" :class="`app-dialog-icon-${severity}`">
          <i :class="icon" />
        </div>
        <div class="app-dialog-header-titles">
          <h3 class="app-dialog-title">
            <slot name="title">{{ header }}</slot>
          </h3>
          <p v-if="subtitle || $slots.subtitle" class="app-dialog-subtitle">
            <slot name="subtitle">{{ subtitle }}</slot>
          </p>
        </div>
      </div>
    </template>

    <!-- Default content slot -->
    <div class="app-dialog-body">
      <slot />
    </div>

    <!-- Footer slot passthrough -->
    <template v-if="$slots.footer" #footer>
      <div class="app-dialog-footer">
        <slot name="footer" />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Dialog from 'primevue/dialog'

type Severity = 'primary' | 'success' | 'info' | 'warning' | 'danger' | 'neutral'
type Size = 'sm' | 'md' | 'lg' | 'xl'

interface Props {
  visible: boolean
  header?: string
  subtitle?: string
  icon?: string
  severity?: Severity
  size?: Size
  modal?: boolean
  closable?: boolean
  closeOnEscape?: boolean
  dismissableMask?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  header: '',
  subtitle: '',
  icon: '',
  severity: 'primary',
  size: 'md',
  modal: true,
  closable: true,
  closeOnEscape: true,
  dismissableMask: false,
})

defineEmits<{
  'update:visible': [value: boolean]
}>()

const sizeMap: Record<Size, string> = {
  sm: '420px',
  md: '600px',
  lg: '800px',
  xl: '1024px',
}

const computedStyle = computed(() => ({
  width: '92vw',
  maxWidth: sizeMap[props.size],
}))

const contentClass = 'app-dialog-content'

// PassThrough overrides to reduce default PrimeVue chrome
const passThrough = {
  root: { class: 'app-dialog-root' },
  header: { class: 'app-dialog-header-slot' },
  content: { class: 'app-dialog-content-slot' },
  footer: { class: 'app-dialog-footer-slot' },
}
</script>

<style scoped src="./AppDialog.css"></style>

