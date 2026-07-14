// static/js/router.js — Vue Router with navigation guards

const { createRouter, createWebHashHistory } = VueRouter

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { public: true }
    },
    {
      path: '/auth',
      name: 'auth',
      component: AuthView,
      meta: { public: true }
    },

    // ── Admin Routes ──────────────────────────────────────────
    {
      path: '/admin',
      component: AdminLayout,
      meta: { role: 'admin' },
      children: [
        { path: '',           name: 'admin-dashboard',   component: AdminDashboard },
        { path: 'companies',  name: 'admin-companies',   component: AdminCompanies },
        { path: 'students',   name: 'admin-students',    component: AdminStudents  },
        { path: 'drives',     name: 'admin-drives',      component: AdminDrives    },
        { path: 'analytics',  name: 'admin-analytics',   component: AdminAnalytics },
      ]
    },

    // ── Company Routes ────────────────────────────────────────
    {
      path: '/company',
      component: CompanyLayout,
      meta: { role: 'company' },
      children: [
        { path: '',             name: 'company-dashboard',    component: CompanyDashboard    },
        { path: 'profile',      name: 'company-profile',      component: CompanyProfileView  },
        { path: 'drives',       name: 'company-drives',       component: CompanyDrives       },
        { path: 'applications', name: 'company-applications', component: CompanyApplications },
      ]
    },

    // ── Student Routes ────────────────────────────────────────
    {
      path: '/student',
      component: StudentLayout,
      meta: { role: 'student' },
      children: [
        { path: '',             name: 'student-dashboard',    component: StudentDashboard    },
        { path: 'drives',       name: 'student-drives',       component: StudentDrives       },
        { path: 'applications', name: 'student-applications', component: StudentApplications },
        { path: 'profile',      name: 'student-profile',      component: StudentProfileView  },
      ]
    },

    // Catch-all
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ],
  scrollBehavior: () => ({ top: 0 })
})

// Navigation guard
router.beforeEach(async (to) => {
  const token = localStorage.getItem('access_token')
  const user  = (() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null') }
    catch { return null }
  })()

  if (to.meta.public) return true

  if (!token || !user) {
    return { path: '/auth', query: { redirect: to.fullPath } }
  }

  if (to.meta.role && user.role !== to.meta.role) {
    const dash = { admin: '/admin', company: '/company', student: '/student' }
    return { path: dash[user.role] || '/' }
  }

  return true
})
