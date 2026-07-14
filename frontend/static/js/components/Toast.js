// static/js/components/Toast.js
const ToastComponent = {
  props: { toast: Object },
  setup(props) {
    const icons = {
      success: 'bi-check-circle-fill',
      error:   'bi-x-circle-fill',
      info:    'bi-info-circle-fill',
      warning: 'bi-exclamation-triangle-fill',
    }
    return { icons }
  },
  template: `
    <div class="pp-toast" :class="toast.type">
      <i class="bi pp-toast-icon" :class="icons[toast.type] || 'bi-bell-fill'"></i>
      <div>
        <div class="pp-toast-title">{{ toast.title }}</div>
        <div class="pp-toast-msg" v-if="toast.message">{{ toast.message }}</div>
      </div>
    </div>
  `
}
