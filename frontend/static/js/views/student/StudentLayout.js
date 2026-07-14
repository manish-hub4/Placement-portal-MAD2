// static/js/views/student/StudentLayout.js
const StudentLayout = {
  setup() {
    const router = VueRouter.useRouter()
    const route  = VueRouter.useRoute()
    const { computed } = Vue

    const navItems = [
      { path: '/student',             name: 'student-dashboard',    icon: 'bi-speedometer2', label: 'Dashboard'    },
      { path: '/student/drives',      name: 'student-drives',       icon: 'bi-briefcase',    label: 'Browse Drives' },
      { path: '/student/applications',name: 'student-applications', icon: 'bi-file-earmark-person', label: 'My Applications' },
      { path: '/student/profile',     name: 'student-profile',      icon: 'bi-person',       label: 'My Profile'   },
    ]

    const pageTitle = computed(() => {
      const item = navItems.find(n => route.path === n.path || (n.path !== '/student' && route.path.startsWith(n.path)))
      return item ? item.label : 'Student Panel'
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
              <small>Student Panel</small>
            </div>
          </div>
        </div>
        <div class="pp-sidebar-section mt-2">Navigation</div>
        <nav>
          <a v-for="item in navItems" :key="item.path"
            class="pp-nav-link"
            :class="{ active: route.path === item.path || (item.path !== '/student' && route.path.startsWith(item.path)) }"
            @click="router.push(item.path)">
            <i class="bi" :class="item.icon"></i>
            {{ item.label }}
          </a>
        </nav>
        <div class="pp-sidebar-bottom">
          <div class="pp-nav-link text-muted" @click="router.push('/')">
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
