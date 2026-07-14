// static/js/views/admin/AdminLayout.js
const AdminLayout = {
  setup() {
    const router   = VueRouter.useRouter()
    const route    = VueRouter.useRoute()
    const { computed } = Vue

    const navItems = [
      { path: '/admin',           name: 'admin-dashboard',  icon: 'bi-speedometer2', label: 'Dashboard'   },
      { path: '/admin/companies', name: 'admin-companies',  icon: 'bi-building',     label: 'Companies'   },
      { path: '/admin/students',  name: 'admin-students',   icon: 'bi-people',       label: 'Students'    },
      { path: '/admin/drives',    name: 'admin-drives',     icon: 'bi-briefcase',    label: 'Drives'      },
      { path: '/admin/analytics', name: 'admin-analytics',  icon: 'bi-bar-chart-line', label: 'Analytics' },
    ]

    const pageTitle = computed(() => {
      const item = navItems.find(n => route.name === n.name)
      return item ? item.label : 'Admin Panel'
    })

    return { navItems, route, router, pageTitle }
  },
  template: `
    <div class="pp-layout">
      <aside class="pp-sidebar">
        <div class="pp-sidebar-brand">
          <div class="d-flex align-items-center gap-2">
            <span style="font-size:1.4rem">🎓</span>
            <div>
              <h4>PlacementHub</h4>
              <small>Admin Panel</small>
            </div>
          </div>
        </div>
        <div class="pp-sidebar-section mt-2">Navigation</div>
        <nav>
          <a v-for="item in navItems" :key="item.path"
            class="pp-nav-link"
            :class="{ active: route.path === item.path || (item.path !== '/admin' && route.path.startsWith(item.path)) }"
            @click="router.push(item.path)">
            <i class="bi" :class="item.icon"></i>
            {{ item.label }}
          </a>
        </nav>
        <div class="pp-sidebar-bottom">
          <div class="pp-nav-link text-danger" style="cursor:pointer" @click="router.push('/')">
            <i class="bi bi-house"></i> Home
          </div>
        </div>
      </aside>
      <div class="pp-content">
        <pp-navbar :title="pageTitle" />
        <main class="pp-page">
          <router-view />
        </main>
      </div>
    </div>
  `
}
