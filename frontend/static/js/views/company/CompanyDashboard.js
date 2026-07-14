// static/js/views/company/CompanyDashboard.js
const CompanyDashboard = {
  setup() {
    const { ref, onMounted } = Vue
    const toast   = Vue.inject('toast')
    const router  = VueRouter.useRouter()
    const loading = ref(true)
    const data    = ref(null)

    async function fetchData() {
      loading.value = true
      try {
        const res = await companyDashboard()
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
        <!-- Approval alert -->
        <div v-if="data.company.approval_status === 'Pending'" class="alert alert-warning mb-4">
          <i class="bi bi-clock-history me-2"></i>
          <strong>Pending Approval:</strong> Your company registration is awaiting admin review.
          You will be notified once approved.
        </div>
        <div v-if="data.company.approval_status === 'Rejected'" class="alert alert-danger mb-4">
          <i class="bi bi-x-circle me-2"></i>
          <strong>Registration Rejected.</strong>
          Remarks: {{ data.company.admin_remarks || 'No remarks provided.' }}
        </div>

        <!-- Stats -->
        <div class="row g-3 mb-4">
          <div class="col-6 col-lg-3">
            <pp-stat-card :value="data.stats.total_drives" label="My Drives"
              icon="bi-briefcase-fill" color="#1e40af" bg-color="#dbeafe"/>
          </div>
          <div class="col-6 col-lg-3">
            <pp-stat-card :value="data.stats.total_applications" label="Total Applicants"
              icon="bi-people-fill" color="#065f46" bg-color="#d1fae5"/>
          </div>
          <div class="col-6 col-lg-3">
            <pp-stat-card :value="data.stats.shortlisted" label="Shortlisted"
              icon="bi-list-check" color="#b45309" bg-color="#fef3c7"/>
          </div>
          <div class="col-6 col-lg-3">
            <pp-stat-card :value="data.stats.selected" label="Selected"
              icon="bi-trophy-fill" color="#065f46" bg-color="#d1fae5"/>
          </div>
        </div>

        <div class="row g-4">
          <!-- Recent Drives -->
          <div class="col-lg-7">
            <div class="pp-card">
              <div class="pp-card-header">
                <h5><i class="bi bi-briefcase me-2"></i>My Drives</h5>
                <button @click="router.push('/company/drives')" class="btn btn-sm btn-primary">View All</button>
              </div>
              <div class="pp-card-body p-0">
                <table class="pp-table">
                  <thead><tr><th>Job Title</th><th>Deadline</th><th>Applicants</th><th>Status</th></tr></thead>
                  <tbody>
                    <tr v-for="d in data.recent_drives" :key="d.id">
                      <td class="fw-600">{{ d.job_title }}</td>
                      <td>{{ d.application_deadline }}</td>
                      <td>{{ d.applications_count }}</td>
                      <td><span class="status-badge" :class="'badge-' + d.status.toLowerCase()">{{ d.status }}</span></td>
                    </tr>
                    <tr v-if="!data.recent_drives.length">
                      <td colspan="4" class="text-center text-muted py-4">No drives yet</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Company Info -->
          <div class="col-lg-5">
            <div class="pp-card">
              <div class="pp-card-header">
                <h5><i class="bi bi-building me-2"></i>Company Info</h5>
                <button @click="router.push('/company/profile')" class="btn btn-sm btn-outline-primary">Edit</button>
              </div>
              <div class="pp-card-body">
                <dl class="row small mb-0">
                  <dt class="col-5 text-muted">Status</dt>
                  <dd class="col-7"><span class="status-badge" :class="'badge-' + data.company.approval_status.toLowerCase()">{{ data.company.approval_status }}</span></dd>
                  <dt class="col-5 text-muted">Industry</dt>
                  <dd class="col-7">{{ data.company.industry || '—' }}</dd>
                  <dt class="col-5 text-muted">HR Name</dt>
                  <dd class="col-7">{{ data.company.hr_name || '—' }}</dd>
                  <dt class="col-5 text-muted">HR Email</dt>
                  <dd class="col-7 text-truncate">{{ data.company.hr_email || '—' }}</dd>
                  <dt class="col-5 text-muted">Website</dt>
                  <dd class="col-7"><a v-if="data.company.website" :href="data.company.website" target="_blank" class="small">Visit</a><span v-else>—</span></dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}
