<template>
  <MainLayout>
    <div class="detail-container">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <!-- <h1 class="text-3xl font-bold text-slate-900 mb-2">{{ plant?.name || t('plants.title') }}</h1> -->
          <p class="text-slate-600" v-if="plant">{{ plant.address }}, {{ plant.city }}</p>
        </div>
        <Button
          :label="t('common.back')"
          icon="pi pi-arrow-left"
          @click="goBack"
          severity="secondary"
        />
      </div>

      <!-- Plant Info Card -->
      <Card class="shadow-lg mb-6">
        <template #title>{{ t('plants.title') }} - {{ t('common.edit') }}</template>
        <template #content>
          <form @submit.prevent="savePlant" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">
                  {{ t('plants.name') }} *
                </label>
                <InputText
                  v-model="formData.name"
                  :placeholder="t('plants.name')"
                  class="w-full"
                  :class="{ 'ng-invalid': v$.name.$error }"
                  @blur="v$.name.$touch()"
                />
                <small v-if="v$.name.$error" class="text-red-500">
                  {{ t('common.error') }}: {{ t('plants.name') }}
                </small>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">
                  {{ t('plants.timezone') }} *
                </label>
                <Dropdown
                  v-model="formData.timeZone"
                  :options="timezones"
                  :placeholder="t('plants.timezone')"
                  class="w-full"
                  :class="{ 'ng-invalid': v$.timeZone.$error }"
                  @blur="v$.timeZone.$touch()"
                />
                <small v-if="v$.timeZone.$error" class="text-red-500">
                  {{ t('common.error') }}: {{ t('plants.timezone') }}
                </small>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">
                  {{ t('plants.address') }}
                </label>
                <InputText
                  v-model="formData.address"
                  :placeholder="t('plants.address')"
                  class="w-full"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">
                  {{ t('plants.city') }}
                </label>
                <InputText
                  v-model="formData.city"
                  :placeholder="t('plants.city')"
                  class="w-full"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">
                  {{ t('plants.country') }}
                </label>
                <InputText
                  v-model="formData.country"
                  :placeholder="t('plants.country')"
                  class="w-full"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">
                  Logo URL
                </label>
                <InputText
                  v-model="formData.logoUrl"
                  placeholder="https://example.com/logo.png"
                  class="w-full"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">
                  {{ t('plants.operatingHours') }}
                </label>
                <InputText
                  v-model="formData.defaultOperatingHours"
                  placeholder="09:00-18:00"
                  class="w-full"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">
                  <i class="pi pi-link" /> {{ t('plants.appReceptionPlantId') }}
                </label>
                <InputNumber
                  v-model="formData.appReceptionPlantId"
                  :useGrouping="false"
                  :min="0"
                  placeholder="—"
                  class="w-full"
                />
                <small class="text-xs text-slate-500">{{ t('plants.appReceptionPlantIdHelp') }}</small>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">
                  {{ t('common.status') }}
                </label>
                <div class="flex items-center gap-2">
                  <Checkbox v-model="formData.isActive" input-id="isActive" binary />
                  <label for="isActive" class="text-sm font-medium text-slate-700">
                    {{ formData.isActive ? t('plants.active') : t('common.no') }}
                  </label>
                </div>
              </div>
            </div>

            <div class="flex gap-3 pt-4">
              <Button
                type="submit"
                :label="t('common.save')"
                icon="pi pi-check"
                severity="success"
                :loading="plantsStore.loading"
              />
              <Button
                type="button"
                :label="t('common.cancel')"
                icon="pi pi-times"
                severity="secondary"
                @click="goBack"
              />
            </div>
          </form>
        </template>
      </Card>

      <!-- Resources Section -->
      <Card class="shadow-lg" v-if="plant">
        <template #title>{{ t('resources.title') }} ({{ plantResources.length }})</template>
        <template #content>
          <DataTable
            :value="plantResources"
            :loading="plantsStore.loading"
            paginator
            :rows="5"
            class="p-datatable-striped"
          >
            <Column field="name" :header="t('resources.name')" />
            <Column field="resourceTypeId" :header="t('resources.type')" />
            <Column field="capacity" :header="t('resources.capacity')" />
            <Column field="status" :header="t('common.status')">
              <template #body="{ data }">
                <Tag
                  :value="data.status"
                  :severity="data.status === 'Available' ? 'success' : 'warning'"
                />
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import { usePlantsStore } from '@/stores/plants.store'
import { useResourcesStore } from '@/stores/resources.store'
import MainLayout from '@/layouts/MainLayout.vue'
import type { UpdatePlantDto } from '@/types/plant'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dropdown from 'primevue/dropdown'
import Tag from 'primevue/tag'
import Card from 'primevue/card'
import Checkbox from 'primevue/checkbox'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const plantsStore = usePlantsStore()
const resourcesStore = useResourcesStore()

const timezones = [
  'UTC',
  'Europe/Rome',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
]

const formData = ref<UpdatePlantDto>({
  name: '',
  address: '',
  city: '',
  country: '',
  timeZone: 'UTC',
  logoUrl: '',
  isActive: true,
  defaultOperatingHours: '',
  appReceptionPlantId: null,
})

const rules = {
  name: { required },
  timeZone: { required },
}

const v$ = useVuelidate(rules, formData as any)

// Computed
const plant = computed(() => {
  const id = route.params.id as string
  return plantsStore.plantById(id)
})

const plantResources = computed(() => {
  const id = route.params.id as string
  return resourcesStore.resourcesByPlant(id)
})

// Methods
const goBack = () => {
  router.push('/plants')
}

const savePlant = async () => {
  const isFormValid = await v$.value.$validate()
  if (!isFormValid) return

  try {
    const id = route.params.id as string
    const dto: UpdatePlantDto = formData.value
    await plantsStore.update(id, dto)
    goBack()
  } catch (error) {
    console.error('Error saving plant:', error)
  }
}

// Lifecycle
onMounted(async () => {
  try {
    const id = route.params.id as string
    const loadedPlant = await plantsStore.fetchById(id)
    formData.value = {
      name: loadedPlant.name,
      address: loadedPlant.address,
      city: loadedPlant.city,
      country: loadedPlant.country,
      timeZone: loadedPlant.timeZone,
      logoUrl: loadedPlant.logoUrl,
      isActive: loadedPlant.isActive,
      defaultOperatingHours: loadedPlant.defaultOperatingHours,
      appReceptionPlantId: loadedPlant.appReceptionPlantId ?? null,
    }

    // Load plant resources
    await resourcesStore.fetchResourcesByPlant(id)
  } catch (error) {
    console.error('Error loading plant:', error)
  }
})
</script>

<style scoped src="./SiteDetailView.css"></style>

