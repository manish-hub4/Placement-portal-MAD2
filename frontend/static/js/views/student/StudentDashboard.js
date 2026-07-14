// static/js/views/student/StudentDashboard.js
const StudentDashboard = {
  setup() {
    const { ref, onMounted } = Vue
    const toast   = Vue.inject('toast')
    const router  = VueRouter.useRouter()
    const loading = ref(true)
    const data    = ref(null)

    async function fetchData() {
      loading.value = true
      try {
        const res = await studentDashboard()
        data.value = res.data
      } catch { toast.error('Error', 'Failed to load dashboard') }
      finally { loading.value = false }
    }

    onMounted(fetchData)
    return { loading, data, router }
  },
  template: `
    <div>
      <pp-loading v-if="loading" />
      <div v-else-if="data">
        <!-- Welcome Banner -->
        <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);border-radius:16px;padding:28px 32px;color:#fff;margin-bottom:24px">
          <h4 class="fw-800 mb-1">Welcome back, {{ data.student.first_name }}! 👋</h4>
          <p class="mb-0 opacity-75">{{ data.student.branch || 'Student' }} • CGPA {{ data.student.cgpa || '—' }} • Batch {{ data.student.graduation_year || '—' }}</p>
        </div>

        <!-- Stats -->
        <div class="row g-3 mb-4">
          <div class="col-6 col-lg-3">
            <pp-stat-card :value="data.stats.total_applied" label="Total Applied"
              icon="bi-send-fill" color="#1e40af" bg-color="#dbeafe"/>
          </div>
          <div class="col-6 col-lg-3">
            <pp-stat-card :value="data.stats.shortlisted" label="Shortlisted"
              icon="bi-list-check" color="#b45309" bg-color="#fef3c7"/>
          </div>
          <div class="col-6 col-lg-3">
            <pp-stat-card :value="data.stats.selected" label="Selected 🎉"
              icon="bi-trophy-fill" color="#065f46" bg-color="#d1fae5"/>
          </div>
          <div class="col-6 col-lg-3">
            <pp-stat-card :value="data.stats.rejected" label="Rejected"
              icon="bi-x-circle" color="#991b1b" bg-color="#fee2e2"/>
          </div>
        </div>

        <div class="row g-4">
          <!-- Upcoming Drives -->
          <div class="col-lg-7">
            <div class="pp-card">
              <div class="pp-card-header">
                <h5><i class="bi bi-briefcase me-2"></i>Upcoming Drives</h5>
                <button @click="router.push('/student/drives')" class="btn btn-sm btn-primary">Browse All</button>
              </div>
              <div class="pp-card-body p-0">
                <div v-if="!data.upcoming_drives.length" class="empty-state py-4">
                  <i class="bi bi-briefcase" style="font-size:2rem;color:#94a3b8"></i>
                  <p class="mt-2 text-muted small">No upcoming drives matching your profile</p>
                </div>
                <div v-else>
                  <div v-for="d in data.upcoming_drives" :key="d.id"
                    class="d-flex align-items-center justify-content-between px-4 py-3 border-bottom"
                    style="cursor:pointer" @click="router.push('/student/drives')">
                    <div>
                      <div class="fw-600">{{ d.job_title }}</div>
                      <div class="small text-muted">{{ d.company_name }} • {{ d.job_type }}</div>
                    </div>
                    <div class="text-end">
                      <div class="pp-drive-deadline small">
                        <i class="bi bi-clock me-1"></i>{{ d.application_deadline }}
                      </div>
                      <span class="badge bg-light text-dark small">Min CGPA {{ d.min_cgpa }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Applications -->
          <div class="col-lg-5">
            <div class="pp-card">
              <div class="pp-card-header">
                <h5><i class="bi bi-clock-history me-2"></i>Recent Applications</h5>
                <button @click="router.push('/student/applications')" class="btn btn-sm btn-outline-primary">View All</button>
              </div>
              <div class="pp-card-body p-0">
                <div v-if="!data.recent_applications.length" class="empty-state py-4">
                  <p class="text-muted small">No applications yet</p>
                </div>
                <div v-for="a in data.recent_applications" :key="a.id"
                  class="d-flex align-items-center justify-content-between px-4 py-3 border-bottom">
                  <div>
                    <div class="fw-600 small">{{ a.drive_title }}</div>
                    <div class="small text-muted">{{ a.company_name }}</div>
                  </div>
                  <span class="status-badge" :class="'badge-' + a.status.toLowerCase()">{{ a.status }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}
