<template>
  <MainLayout>
    <div class="checkin-page">
      <div class="checkin-container">
        <!-- Header -->

        <!-- Main Card -->
        <div class="checkin-card">
          <!-- Input Section -->
          <div class="input-section">
            <label class="input-label">{{ t('checkin.scanLabel') }}</label>
            <input
              ref="qrInput"
              v-model="qrCode"
              type="text"
              class="qr-input"
              :placeholder="t('checkin.scanPlaceholder')"
              @blur="handleCheckIn"
              @keyup.enter="handleCheckIn"
              autofocus
            />
          </div>

          <!-- Result Section -->
          <transition name="fade">
            <div v-if="checkInResult" class="result-section">
              <!-- Success State -->
              <div v-if="checkInResult.isSuccess" class="result success">
                <div class="result-icon">
                  <i class="pi pi-check-circle" />
                </div>
                <div class="result-content">
                  <h3>{{ t('checkin.success') }}</h3>
                  <div class="result-details">
                    <div class="detail-row">
                      <span class="detail-label">{{ t('checkin.participant') }}:</span>
                      <span class="detail-value">{{ checkInResult.participantName }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">{{ t('checkin.booking') }}:</span>
                      <span class="detail-value">{{ checkInResult.bookingTitle }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">{{ t('checkin.checkinTime') }}:</span>
                      <span class="detail-value">{{ checkInResult.checkInTime ? formatTime(checkInResult.checkInTime) : '-' }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Error State -->
              <div v-else class="result error">
                <div class="result-icon">
                  <i class="pi pi-exclamation-circle" />
                </div>
                <div class="result-content">
                  <h3>{{ t('checkin.invalid') }}</h3>
                  <p>{{ checkInResult.errorMessage }}</p>
                </div>
              </div>
            </div>
          </transition>

          <!-- Clear Button (when result is shown) -->
          <div v-if="checkInResult" class="action-section">
            <PrimeButton
              :label="t('checkin.scanNext')"
              icon="pi pi-arrow-right"
              @click="resetForNextScan"
              class="btn-next"
            />
          </div>
        </div>


        <!-- ------ Sezione fotocamera QR (--8.7 DRF) ------------------------------------------------------------------------------------ -->
        <div class="checkin-card camera-card">
          <div class="camera-header">
            <h3 class="camera-title">
              <i class="pi pi-camera" />
              {{ t('checkin.cameraTitle') }}
            </h3>
            <p class="camera-subtitle">{{ t('checkin.cameraSubtitle') }}</p>
          </div>

          <!-- Anteprima video + canvas nascosto per decodifica -->
          <div class="camera-viewport" v-show="cameraActive">
            <video ref="videoRef" autoplay playsinline muted class="camera-video" />
            <canvas ref="canvasRef" class="camera-canvas" />
            <div class="camera-overlay">
              <div class="camera-frame" />
            </div>
            <div v-if="scanningActive" class="scanning-bar" />
          </div>

          <!-- Feedback scansione -->
          <p v-if="cameraActive && !checkInResult" class="camera-hint">
            {{ t('checkin.cameraPunt') }}
          </p>

          <!-- Bottoni -->
          <div class="camera-actions">
            <PrimeButton
              v-if="!cameraActive"
              :label="t('checkin.cameraStart')"
              icon="pi pi-camera"
              class="btn-camera-start"
              @click="startCamera"
            />
            <PrimeButton
              v-else
              :label="t('checkin.cameraStop')"
              icon="pi pi-times"
              severity="secondary"
              outlined
              @click="stopCamera"
            />
          </div>
          <p v-if="cameraError" class="camera-error">{{ cameraError }}</p>
        </div>

        <!-- Instructions -->
        <div class="checkin-instructions">
          <h4>{{ t('checkin.instructions') }}</h4>
          <ul>
            <li>{{ t('checkin.step1') }}</li>
            <li>{{ t('checkin.step2') }}</li>
            <li>{{ t('checkin.step3') }}</li>
          </ul>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import MainLayout from '@/layouts/MainLayout.vue'
import PrimeButton from 'primevue/button'
import { useBookingsStore } from '@/stores/bookings.store'

const { t, locale } = useI18n()
const toast = useToast()
const bookingsStore = useBookingsStore()

interface CheckInResult {
  isSuccess: boolean
  participantName?: string
  bookingTitle?: string
  checkInTime?: string | null
  errorMessage?: string
}

const qrInput = ref<HTMLInputElement | null>(null)
const qrCode = ref('')
const checkInResult = ref<CheckInResult | null>(null)
let clearTimeoutId: ReturnType<typeof setTimeout> | null = null

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString(locale.value, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return dateStr
  }
}

async function handleCheckIn(): Promise<void> {
  const code = qrCode.value.trim()
  if (!code) {
    return
  }

  try {
    const participant = await bookingsStore.checkIn(code)

    checkInResult.value = {
      isSuccess: true,
      participantName: (participant.userId
        || `${participant.visitorFirstName ?? ''} ${participant.visitorLastName ?? ''}`.trim()
        || t('common.defaultUser')) as string,
      bookingTitle: t('common.loadFailed'), // The API response may include booking info
      checkInTime: new Date().toISOString(),
    }

    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('checkin.successMessage'),
      life: 3000,
    })

    // Auto-clear after 3 seconds
    if (clearTimeoutId) clearTimeout(clearTimeoutId)
    clearTimeoutId = setTimeout(() => {
      resetForNextScan()
    }, 3000)
  } catch (err: any) {
    console.error('Check-in failed:', err)

    checkInResult.value = {
      isSuccess: false,
      errorMessage: err.message || t('checkin.errorMessage'),
    }

    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('checkin.errorMessage'),
      life: 5000,
    })
  }
}

function resetForNextScan(): void {
  qrCode.value = ''
  checkInResult.value = null
  if (clearTimeoutId) clearTimeout(clearTimeoutId)
  stopCamera()
  qrInput.value?.focus()
}

// ------ Fotocamera QR (--8.7 DRF) ------------------------------------------------------------------------------------------------------------------------------------------------------
const videoRef      = ref<HTMLVideoElement | null>(null)
const canvasRef     = ref<HTMLCanvasElement | null>(null)
const cameraActive  = ref(false)
const scanningActive = ref(false)
const cameraError   = ref<string | null>(null)
let mediaStream: MediaStream | null = null
let scanInterval: ReturnType<typeof setInterval> | null = null
let jsQR: ((data: Uint8ClampedArray, width: number, height: number) => { data: string } | null) | null = null

/**
 * Carica jsQR dinamicamente (evita problemi SSR e bundle size).
 * jsQR - una libreria vanilla JS per leggere QR code da imageData.
 */
async function loadJsQR(): Promise<void> {
  if (jsQR) return
  try {
    // Usa CDN unpkg - gi- accessibile dall'app
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/jsqr@1.4.0/dist/jsQR.js'
      script.onload = () => {
        jsQR = (window as any).jsQR
        resolve()
      }
      script.onerror = () => reject(new Error('jsQR load failed'))
      document.head.appendChild(script)
    })
  } catch {
    cameraError.value = t('checkin.cameraLoadError')
  }
}

async function startCamera(): Promise<void> {
  cameraError.value = null
  await loadJsQR()
  if (!jsQR) return

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    })
    if (!videoRef.value) return
    videoRef.value.srcObject = mediaStream
    cameraActive.value = true

    // Attende che il video sia pronto prima di iniziare a scansionare
    videoRef.value.addEventListener('loadedmetadata', () => {
      scanningActive.value = true
      scanInterval = setInterval(scanFrame, 200)
    }, { once: true })
  } catch (err: any) {
    cameraError.value = err.name === 'NotAllowedError'
      ? t('checkin.cameraPermissionDenied')
      : t('checkin.cameraNotAvailable')
  }
}

function stopCamera(): void {
  if (scanInterval) { clearInterval(scanInterval); scanInterval = null }
  if (mediaStream) { mediaStream.getTracks().forEach(t => t.stop()); mediaStream = null }
  if (videoRef.value) videoRef.value.srcObject = null
  cameraActive.value = false
  scanningActive.value = false
}

function scanFrame(): void {
  if (!videoRef.value || !canvasRef.value || !jsQR) return
  const video = videoRef.value
  if (video.readyState !== video.HAVE_ENOUGH_DATA) return

  const canvas = canvasRef.value
  canvas.width  = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const result = jsQR(imageData.data, imageData.width, imageData.height)

  if (result?.data) {
    // QR trovato: fermo la scansione, eseguo il check-in e riavvio dopo
    scanningActive.value = false
    if (scanInterval) { clearInterval(scanInterval); scanInterval = null }
    qrCode.value = result.data
    handleCheckIn().finally(() => {
      // Riavvia la scansione dopo 3 secondi (stesso timeout del check-in manuale)
      if (cameraActive.value) {
        clearTimeoutId = setTimeout(() => {
          if (cameraActive.value) {
            scanningActive.value = true
            scanInterval = setInterval(scanFrame, 200)
          }
        }, 3000)
      }
    })
  }
}

// Pulizia alla distruzione del componente
onUnmounted(() => { stopCamera() })


onMounted(() => {
  qrInput.value?.focus()
})
</script>

<style scoped src="./CheckInView.css"></style>

