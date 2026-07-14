// static/js/components/AppNavbar.js
const AppNavbar = {
  props: {
    title: { type: String, default: 'Dashboard' }
  },
  setup() {
    const auth  = Vue.inject('auth')
    const toast = Vue.inject('toast')
    const router = VueRouter.useRouter()

    async function logout() {
      await auth.logout()
      toast.success('Signed out', 'You have been logged out.')
      router.push('/')
    }

    return { auth, logout }
  },
  template: `
    <div class="pp-topbar">
      <h5 class="pp-topbar-title">
        <slot name="title">{{ title }}</slot>
      </h5>
      <div class="d-flex align-items-center gap-3">
        <span class="text-muted small d-none d-md-inline">
          <i class="bi bi-person-circle me-1"></i>
          {{ auth.user?.username }}
          <span class="badge ms-1" :class="{
            'bg-primary': auth.role === 'admin',
            'bg-success': auth.role === 'company',
            'bg-info text-dark': auth.role === 'student'
          }">{{ auth.role }}</span>
        </span>
        <button @click="logout" class="btn btn-sm btn-outline-secondary">
          <i class="bi bi-box-arrow-right me-1"></i> Sign Out
        </button>
      </div>
    </div>
  `
}
