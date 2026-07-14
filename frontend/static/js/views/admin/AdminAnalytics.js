// static/js/views/admin/AdminAnalytics.js
const AdminAnalytics = {
  setup() {
    const { ref, onMounted } = Vue
    const toast   = Vue.inject('toast')
    const loading = ref(true)
    const data    = ref(null)

    async function fetchData() {
      loading.value = true
      try {
        const res = await adminAnalytics()
        data.value = res.data
      } catch { toast.error('Error', 'Failed to load analytics') }
      finally { loading.value = false }
    }

    onMounted(fetchData)
    return { loading, data, fetchData }
  },
  template: `
    <div>
      <pp-loading v-if="loading" />
      <div v-else-if="data">
        <!-- Top Stats -->
        <div class="row g-3 mb-4">
          <div class="col-6 col-lg-3">
            <pp-stat-card :value="data.total_students" label="Total Students" icon="bi-people-fill" color="#1e40af" bg-color="#dbeafe"/>
          </div>
          <div class="col-6 col-lg-3">
            <pp-stat-card :value="data.total_companies" label="Approved Companies" icon="bi-building-fill" color="#065f46" bg-color="#d1fae5"/>
          </div>
          <div class="col-6 col-lg-3">
            <pp-stat-card :value="data.total_drives" label="Approved Drives" icon="bi-briefcase-fill" color="#7c3aed" bg-color="#ede9fe"/>
          </div>
          <div class="col-6 col-lg-3">
            <pp-stat-card :value="data.placement_rate + '%'" label="Placement Rate" icon="bi-trophy-fill" color="#b45309" bg-color="#fef3c7"/>
          </div>
        </div>

        <div class="row g-4">
          <!-- Applications by Status -->
          <div class="col-lg-6">
            <div class="pp-card h-100">
              <div class="pp-card-header"><h5><i class="bi bi-pie-chart me-2"></i>Applications by Status</h5></div>
              <div class="pp-card-body">
                <div v-for="(count, status) in data.applications_by_status" :key="status" class="mb-3">
                  <div class="d-flex justify-content-between mb-1">
                    <span class="small fw-600">{{ status }}</span>
                    <span class="small text-muted">{{ count }}</span>
                  </div>
                  <div class="progress" style="height:8px;border-radius:4px">
                    <div class="progress-bar" :class="{
                      'bg-primary':  status==='Applied',
                      'bg-warning':  status==='Shortlisted',
                      'bg-info':     status==='Interview',
                      'bg-success':  status==='Selected',
                      'bg-danger':   status==='Rejected'
                    }" :style="{ width: Math.max(count / Math.max(...Object.values(data.applications_by_status)) * 100, 2) + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Drives by Status -->
          <div class="col-lg-6">
            <div class="pp-card h-100">
              <div class="pp-card-header"><h5><i class="bi bi-bar-chart me-2"></i>Drives by Status</h5></div>
              <div class="pp-card-body">
                <div v-for="(count, status) in data.drives_by_status" :key="status" class="mb-3">
                  <div class="d-flex justify-content-between mb-1">
                    <span class="small fw-600">{{ status }}</span>
                    <span class="small text-muted">{{ count }}</span>
                  </div>
                  <div class="progress" style="height:8px;border-radius:4px">
                    <div class="progress-bar bg-primary"
                      :style="{ width: Math.max(count / Math.max(...Object.values(data.drives_by_status)) * 100, 2) + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Top Companies -->
          <div class="col-lg-6">
            <div class="pp-card">
              <div class="pp-card-header"><h5><i class="bi bi-building me-2"></i>Top Companies by Applications</h5></div>
              <div class="pp-card-body p-0">
                <table class="pp-table">
                  <thead><tr><th>#</th><th>Company</th><th>Applications</th></tr></thead>
                  <tbody>
                    <tr v-for="(c, i) in data.top_companies" :key="i">
                      <td><span class="badge bg-primary">{{ i+1 }}</span></td>
                      <td class="fw-600">{{ c.name }}</td>
                      <td><span class="badge bg-secondary">{{ c.count }}</span></td>
                    </tr>
                    <tr v-if="!data.top_companies.length">
                      <td colspan="3" class="text-center text-muted py-4">No data yet</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Branch-wise Selection -->
          <div class="col-lg-6">
            <div class="pp-card">
              <div class="pp-card-header"><h5><i class="bi bi-mortarboard me-2"></i>Branch-wise Selections</h5></div>
              <div class="pp-card-body p-0">
                <table class="pp-table">
                  <thead><tr><th>Branch</th><th>Selected</th></tr></thead>
                  <tbody>
                    <tr v-for="b in data.branch_selection" :key="b.branch">
                      <td class="fw-600">{{ b.branch || 'Unknown' }}</td>
                      <td><span class="badge bg-success">{{ b.count }}</span></td>
                    </tr>
                    <tr v-if="!data.branch_selection.length">
                      <td colspan="2" class="text-center text-muted py-4">No selections yet</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div class="text-end mt-3">
          <button @click="fetchData" class="btn btn-outline-secondary btn-sm">
            <i class="bi bi-arrow-clockwise me-1"></i> Refresh
          </button>
        </div>
      </div>
    </div>
  `
}
