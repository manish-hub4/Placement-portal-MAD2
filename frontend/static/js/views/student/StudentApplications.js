// static/js/views/student/StudentApplications.js
const StudentApplications = {
  setup() {
    const { ref, onMounted } = Vue
    const toast    = Vue.inject('toast')
    const loading  = ref(true)
    const apps     = ref([])
    const statusF  = ref('')
    const exporting= ref(false)
    const selApp   = ref(null)
    const showModal= ref(false)

    async function fetchApps() {
      loading.value = true
      try {
        const res = await studentApplications({ status: statusF.value })
        apps.value = res.data.applications
      } catch { toast.error('Error', 'Failed to load applications') }
      finally { loading.value = false }
    }

    async function exportCSV() {
      exporting.value = true
      try {
        await studentExportApps()
        toast.success('Export Started!', 'You will receive a CSV via email shortly.')
      } catch (e) {
        toast.error('Error', e.response?.data?.error || 'Export failed')
      } finally { exporting.value = false }
    }

    async function withdraw(app) {
      if (!confirm(`Withdraw application for "${app.drive_title}"?`)) return
      try {
        await studentWithdrawApp(app.id)
        toast.success('Withdrawn', 'Application withdrawn successfully')
        fetchApps()
      } catch (e) {
        toast.error('Error', e.response?.data?.error || 'Withdrawal failed')
      }
    }

    function viewDetail(app) {
      selApp.value = app
      showModal.value = true
    }

    const statusColors = {
      Applied: '#1e40af', Shortlisted: '#92400e',
      Interview: '#3730a3', Selected: '#065f46', Rejected: '#991b1b'
    }
    const statusIcons = {
      Applied: 'bi-send', Shortlisted: 'bi-list-check',
      Interview: 'bi-camera-video', Selected: 'bi-trophy', Rejected: 'bi-x-circle'
    }

    onMounted(fetchApps)
    return {
      loading, apps, statusF, exporting, selApp, showModal,
      statusColors, statusIcons,
      fetchApps, exportCSV, withdraw, viewDetail
    }
  },
  template: `
    <div>
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div class="d-flex align-items-center gap-3">
          <h5 class="mb-0">My Applications ({{ apps.length }})</h5>
          <select v-model="statusF" @change="fetchApps" class="pp-form-control" style="width:150px">
            <option value="">All Status</option>
            <option>Applied</option>
            <option>Shortlisted</option>
            <option>Interview</option>
            <option>Selected</option>
            <option>Rejected</option>
          </select>
        </div>
        <button @click="exportCSV" class="btn btn-outline-primary btn-sm" :disabled="exporting">
          <span v-if="exporting" class="spinner-border spinner-border-sm me-2"></span>
          <i v-else class="bi bi-download me-1"></i>
          {{ exporting ? 'Exporting...' : 'Export CSV via Email' }}
        </button>
      </div>

      <pp-loading v-if="loading" />
      <div v-else-if="!apps.length" class="empty-state">
        <i class="bi bi-file-earmark-person"></i>
        <p>No applications found. Start browsing drives!</p>
      </div>
      <div v-else class="row g-3">
        <div class="col-12" v-for="a in apps" :key="a.id">
          <div class="pp-card">
            <div class="pp-card-body">
              <div class="d-flex justify-content-between align-items-start flex-wrap gap-3">
                <div class="flex-grow-1">
                  <div class="d-flex align-items-center gap-2 mb-2">
                    <span class="status-badge" :class="'badge-' + a.status.toLowerCase()">
                      <i class="bi me-1" :class="statusIcons[a.status]"></i>{{ a.status }}
                    </span>
                    <span class="text-muted small">Applied on {{ a.application_date }}</span>
                  </div>
                  <h5 class="fw-700 mb-1">{{ a.drive_title }}</h5>
                  <div class="text-muted small mb-2">{{ a.company_name }}</div>

                  <!-- Interview info -->
                  <div v-if="a.status === 'Interview' && a.interview_date"
                    class="alert alert-info py-2 px-3 d-inline-flex align-items-center gap-2 small mb-2">
                    <i class="bi bi-camera-video-fill"></i>
                    <span>
                      <strong>Interview:</strong> {{ a.interview_date?.slice(0,10) }}
                      <span v-if="a.interview_mode"> ({{ a.interview_mode }})</span>
                    </span>
                  </div>

                  <!-- Company remarks -->
                  <div v-if="a.company_remarks" class="text-muted small">
                    <i class="bi bi-chat-quote me-1"></i><em>{{ a.company_remarks }}</em>
                  </div>
                </div>
                <div class="d-flex gap-2">
                  <button @click="viewDetail(a)" class="btn btn-sm btn-outline-primary">
                    <i class="bi bi-eye"></i> Details
                  </button>
                  <button v-if="a.status === 'Applied'" @click="withdraw(a)"
                    class="btn btn-sm btn-outline-danger">
                    <i class="bi bi-x-lg"></i> Withdraw
                  </button>
                </div>
              </div>

              <!-- Status Progress Bar -->
              <div class="mt-3 pt-3 border-top">
                <div class="d-flex justify-content-between small text-muted mb-1">
                  <span v-for="s in ['Applied','Shortlisted','Interview','Selected']" :key="s"
                    :class="{ 'fw-700 text-primary': a.status === s, 'text-success fw-700': s==='Selected' && a.status==='Selected' }">
                    {{ s }}
                  </span>
                </div>
                <div class="progress" style="height:6px;border-radius:3px">
                  <div class="progress-bar" :class="{
                    'bg-primary': a.status==='Applied',
                    'bg-warning':  a.status==='Shortlisted',
                    'bg-info':     a.status==='Interview',
                    'bg-success':  a.status==='Selected',
                    'bg-danger':   a.status==='Rejected'
                  }" :style="{
                    width: a.status==='Applied' ? '10%' : a.status==='Shortlisted' ? '40%' :
                           a.status==='Interview' ? '70%' : a.status==='Selected' ? '100%' :
                           a.status==='Rejected' ? '100%' : '0%'
                  }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Detail Modal -->
      <div v-if="showModal && selApp" class="modal d-block" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header" style="background:#1e40af;color:#fff">
              <h5 class="modal-title">{{ selApp.drive_title }}</h5>
              <button @click="showModal=false" class="btn-close btn-close-white"></button>
            </div>
            <div class="modal-body">
              <div class="row g-2 small mb-3">
                <div class="col-6"><strong>Company:</strong> {{ selApp.company_name }}</div>
                <div class="col-6"><strong>Status:</strong>
                  <span class="status-badge ms-1" :class="'badge-' + selApp.status.toLowerCase()">{{ selApp.status }}</span>
                </div>
                <div class="col-6"><strong>Applied:</strong> {{ selApp.application_date }}</div>
                <div class="col-6"><strong>Last Updated:</strong> {{ selApp.updated_at?.slice(0,10) }}</div>
                <div v-if="selApp.interview_date" class="col-12">
                  <strong>Interview:</strong> {{ selApp.interview_date?.slice(0,16).replace('T',' ') }} ({{ selApp.interview_mode }})
                </div>
              </div>
              <div v-if="selApp.cover_letter" class="mb-3">
                <strong class="small">Your Cover Letter:</strong>
                <p class="small text-muted mt-1 bg-light p-2 rounded">{{ selApp.cover_letter }}</p>
              </div>
              <div v-if="selApp.company_remarks" class="mb-3">
                <strong class="small">Company Feedback:</strong>
                <p class="small text-muted mt-1 bg-light p-2 rounded">{{ selApp.company_remarks }}</p>
              </div>
            </div>
            <div class="modal-footer">
              <button @click="showModal=false" class="btn btn-outline-secondary">Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}
