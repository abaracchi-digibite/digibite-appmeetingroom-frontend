<template>
  <Dialog
    :visible="visible"
    modal
    header-icon="pi pi-exclamation-triangle"
    header="Confirm Delete"
    :style="{ width: '90%', maxWidth: '400px' }"
    @update:visible="$emit('cancel')"
  >
    <div class="dialog-content">
      <div class="warning-icon">
        <i class="pi pi-trash"></i>
      </div>
      <p class="confirm-message">
        {{ $t('common.confirm') }}: {{ confirmMessage }}
      </p>
      <p class="warning-text">
        {{ $t('common.warning') || 'This action cannot be undone.' }}
      </p>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <Button
          :label="$t('common.cancel')"
          icon="pi pi-times"
          severity="secondary"
          @click="$emit('cancel')"
          :disabled="loading"
        />
        <Button
          :label="$t('common.delete')"
          icon="pi pi-trash"
          severity="danger"
          @click="$emit('confirm')"
          :loading="loading"
          :disabled="loading"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

export interface Props {
  visible: boolean
  entityName: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

defineEmits<{
  confirm: []
  cancel: []
}>()

const { t } = useI18n()

const confirmMessage = computed(() => {
  return `${t('common.delete')} ${props.entityName}?`
})
</script>

<style scoped src="./ConfirmDeleteDialog.css"></style>

