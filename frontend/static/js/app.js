// static/js/app.js — Vue App bootstrap

const { createApp, ref, provide, onMounted } = Vue

const App = {
  setup() {
    const toasts = ref([])

    function addToast(type, title, message, duration = 4000) {
      const id = Date.now() + Math.random()
      toasts.value.push({ id, type, title, message })
      setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id)
      }, duration)
    }

    const toast = {
      success: (title, msg) => addToast('success', title, msg),
      error:   (title, msg) => addToast('error',   title, msg),
      info:    (title, msg) => addToast('info',     title, msg),
      warning: (title, msg) => addToast('warning',  title, msg),
    }

    provide('toast', toast)
    provide('auth',  auth)

    onMounted(() => auth.restore())

    return { toasts }
  },

  template: `
    <router-view />
    <div class="pp-toast-container">
      <pp-toast v-for="t in toasts" :key="t.id" :toast="t" />
    </div>
  `
}

const app = createApp(App)
app.use(router)

// Register global components
app.component('pp-toast',          ToastComponent)
app.component('pp-stat-card',      StatCard)
app.component('pp-loading',        LoadingSpinner)
app.component('pp-navbar',         AppNavbar)

app.mount('#app')
