<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import viteLogo from '../assets/vite.svg'
import heroImg from '../assets/hero.png'
import vueLogo from '../assets/vue.svg'

const count = ref(0)
const { t } = useI18n()
</script>

<template>
  <section id="center">
    <div class="hero">
      <img :src="heroImg" class="base" width="170" height="179" alt="" />
      <img :src="vueLogo" class="framework" :alt="t('helloWorld.vueLogoAlt')" />
      <img :src="viteLogo" class="vite" :alt="t('helloWorld.viteLogoAlt')" />
    </div>
    <div>
      <h1>{{ t('helloWorld.getStarted') }}</h1>
      <p v-html="t('helloWorld.editAndHMR')"></p>
    </div>
    <button class="counter" @click="count++">Count is {{ count }}</button>
  </section>

  <div class="ticks"></div>

  <section id="next-steps">
    <div id="docs">
      <svg class="icon" role="presentation" aria-hidden="true">
        <use href="/icons.svg#documentation-icon"></use>
      </svg>
      <h2>{{ t('helloWorld.documentation') }}</h2>
      <p>{{ t('helloWorld.qna') }}</p>
      <ul>
        <li>
          <a href="https://vite.dev/" target="_blank">
            <img class="logo" :src="viteLogo" alt="" />
            {{ t('helloWorld.exploreVite') }}
          </a>
        </li>
        <li>
          <a href="https://vuejs.org/" target="_blank">
            <img class="button-icon" :src="vueLogo" alt="" />
            {{ t('helloWorld.learnMore') }}
          </a>
        </li>
      </ul>
    </div>
    <div id="social">
      <svg class="icon" role="presentation" aria-hidden="true">
        <use href="/icons.svg#social-icon"></use>
      </svg>
      <h2>{{ t('helloWorld.connectWithUs') }}</h2>
      <p>{{ t('helloWorld.joinViteCommunity') }}</p>
      <ul>
        <li>
          <a href="https://github.com/vitejs/vite" target="_blank">
            <svg class="button-icon" role="presentation" aria-hidden="true">
              <use href="/icons.svg#github-icon"></use>
            </svg>
            {{ t('helloWorld.github') }}
          </a>
        </li>
        <li>
          <a href="https://chat.vite.dev/" target="_blank">
            <svg class="button-icon" role="presentation" aria-hidden="true">
              <use href="/icons.svg#discord-icon"></use>
            </svg>
            {{ t('helloWorld.discord') }}
          </a>
        </li>
        <li>
          <a href="https://x.com/vite_js" target="_blank">
            <svg class="button-icon" role="presentation" aria-hidden="true">
              <use href="/icons.svg#x-icon"></use>
            </svg>
            {{ t('helloWorld.xcom') }}
          </a>
        </li>
        <li>
          <a href="https://bsky.app/profile/vite.dev" target="_blank">
            <svg class="button-icon" role="presentation" aria-hidden="true">
              <use href="/icons.svg#bluesky-icon"></use>
            </svg>
            {{ t('helloWorld.bluesky') }}
          </a>
        </li>
      </ul>
    </div>
  </section>

  <div class="ticks"></div>
  <section id="spacer"></section>
</template>
