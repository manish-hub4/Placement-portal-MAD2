// static/js/views/admin/AdminDashboard.js
const AdminDashboard = {
  setup() {
    const { ref, onMounted } = Vue
    const toast   = Vue.inject('toast')
    const loading = ref(true)
    const data    = ref(null)

    async function fetchData() {
      loading.value = true
      try {
        const res = await adminDashboard()
        data.value = res.data
      } catch {
        toast.error('Error', 'Failed to load dashboard data')
      } finally {
        loading.value = false
      }
    }

    async function triggerReminders() {
      try {
        const res = await adminTriggerReminders()
        toast.success('Task dispatched', `Task ID: ${res.data.task_id}`)
      } catch { toast.error('Error', 'Failed to trigger reminders') }
    }

    async function triggerReport() {
      try {
        const res = await adminTriggerMonthlyReport()
        toast.success('Task dispatched', `Monthly report task ID: ${res.data.task_id}`)
      } catch { toast.error('Error', 'Failed to trigger report') }
    }

    async function clearCache() {
      try {
        await adminClearCache()
        toast.success('Cache cleared', 'Redis cache has been flushed')
      } catch { toast.error('Error', 'Failed to clear cache') }
    }

    onMounted(fetchData)
    return { loading, data, triggerReminders, triggerReport, clearCache }
  },
  template: `
    <div>
      <pp-loading v-if="loading" />
      <div v-else-if="data">
        <!-- Stat Cards -->
        <div class="row g-3 mb-4">
          <div class="col-6 col-lg-3">
            <pp-stat-card :value="data.stats.total_students" label="Total Students"
              icon="bi-people-fill" color="#1e40af" bg-color="#dbeafe"/>
          </div>
          <div class="col-6 col-lg-3">
            <pp-stat-card :value="data.stats.total_companies" label="Companies"
              icon="bi-building-fill" color="#065f46" bg-color="#d1fae5"/>
          </div>
          <div class="col-6 col-lg-3">
            <pp-stat-card :value="data.stats.total_drives" label="Total Drives"
              icon="bi-briefcase-fill" color="#7c3aed" bg-color="#ede9fe"/>
          </div>
          <div class="col-6 col-lg-3">
            <pp-stat-card :value="data.stats.selected_students" label="Students Selected"
              icon="bi-trophy-fill" color="#b45309" bg-color="#fef3c7"/>
          </div>
        </div>

        <!-- Pending approvals alert -->
        <div v-if="data.stats.pending_companies > 0 || data.stats.pending_drives > 0"
          class="alert alert-warning d-flex align-items-center gap-2 mb-4">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <span>
            <strong>Pending Approvals:</strong>
            {{ data.stats.pending_companies }} company registrations,
            {{ data.stats.pending_drives }} placement drives awaiting your review.
          </span>
        </div>

        <div class="row g-4 mb-4">
          <!-- Recent Drives -->
          <div class="col-lg-7">
            <div class="pp-card">
              <div class="pp-card-header">
                <h5><i class="bi bi-briefcase me-2"></i>Recent Drives</h5>
              </div>
              <div class="pp-card-body p-0">
                <table class="pp-table">
                  <thead><tr>
                    <th>Job Title</th><th>Company</th><th>Status</th><th>Applicants</th>
                  </tr></thead>
                  <tbody>
                    <tr v-for="d in data.recent_drives" :key="d.id">
                      <td class="fw-600">{{ d.job_title }}</td>
                      <td>{{ d.company_name }}</td>
                      <td>
                        <span class="status-badge" :class="'badge-' + d.status.toLowerCase()">{{ d.status }}</span>
                      </td>
                      <td>{{ d.applications_count }}</td>
                    </tr>
                    <tr v-if="!data.recent_drives.length">
                      <td colspan="4" class="text-center text-muted py-4">No drives yet</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="col-lg-5">
            <div class="pp-card h-100">
              <div class="pp-card-header"><h5><i class="bi bi-lightning me-2"></i>Quick Actions</h5></div>
              <div class="pp-card-body d-flex flex-column gap-3">
                <button @click="triggerReminders" class="btn btn-outline-primary d-flex align-items-center gap-2">
                  <i class="bi bi-bell"></i> Send Daily Reminders
                </button>
                <button @click="triggerReport" class="btn btn-outline-success d-flex align-items-center gap-2">
                  <i class="bi bi-file-earmark-bar-graph"></i> Generate Monthly Report
                </button>
                <button @click="clearCache" class="btn btn-outline-warning d-flex align-items-center gap-2">
                  <i class="bi bi-arrow-clockwise"></i> Clear Redis Cache
                </button>
                <hr class="my-0"/>
                <div class="small text-muted">
                  <div class="d-flex justify-content-between mb-1">
                    <span>Pending Companies</span>
                    <strong class="text-warning">{{ data.stats.pending_companies }}</strong>
                  </div>
                  <div class="d-flex justify-content-between">
                    <span>Pending Drives</span>
                    <strong class="text-warning">{{ data.stats.pending_drives }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Applications -->
        <div class="pp-card">
          <div class="pp-card-header"><h5><i class="bi bi-file-earmark-person me-2"></i>Recent Applications</h5></div>
          <div class="pp-card-body p-0">
            <table class="pp-table">
              <thead><tr>
                <th>Student</th><th>Drive</th><th>Company</th><th>Date</th><th>Status</th>
              </tr></thead>
              <tbody>
                <tr v-for="a in data.recent_applications" :key="a.id">
                  <td>{{ a.student_name }}</td>
                  <td>{{ a.drive_title }}</td>
                  <td>{{ a.company_name }}</td>
                  <td>{{ a.application_date }}</td>
                  <td>
                    <span class="status-badge" :class="'badge-' + a.status.toLowerCase()">{{ a.status }}</span>
                  </td>
                </tr>
                <tr v-if="!data.recent_applications.length">
                  <td colspan="5" class="text-center text-muted py-4">No applications yet</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
}
