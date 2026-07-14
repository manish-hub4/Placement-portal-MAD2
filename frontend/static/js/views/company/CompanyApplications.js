// static/js/views/company/CompanyApplications.js
const CompanyApplications = {
  setup() {
    const { ref, onMounted } = Vue
    const toast   = Vue.inject('toast')
    const loading = ref(true)
    const drives  = ref([])
    const apps    = ref([])
    const selDrive= ref(null)
    const selApp  = ref(null)
    const showModal = ref(false)
    const statusUpd = ref('')
    const remarksUpd= ref('')
    const interviewDate = ref('')
    const interviewMode = ref('Online')
    const submitting = ref(false)

    async function fetchDrives() {
      loading.value = true
      try {
        const res = await companyDrives({ status: 'Approved' })
        drives.value = res.data.drives
        if (drives.value.length && !selDrive.value) {
          selDrive.value = drives.value[0].id
          await fetchApps()
        }
      } catch { toast.error('Error', 'Failed to load drives') }
      finally { loading.value = false }
    }

    async function fetchApps() {
      if (!selDrive.value) return
      loading.value = true
      try {
        const res = await companyApplications(selDrive.value)
        apps.value = res.data.applications
      } catch { toast.error('Error', 'Failed to load applications') }
      finally { loading.value = false }
    }

    function openModal(app) {
      selApp.value    = app
      statusUpd.value = app.status
      remarksUpd.value= app.company_remarks || ''
      interviewDate.value = app.interview_date ? app.interview_date.slice(0,16) : ''
      interviewMode.value = app.interview_mode || 'Online'
      showModal.value = true
    }

    async function updateApp() {
      submitting.value = true
      try {
        await companyUpdateApp(selDrive.value, selApp.value.id, {
          status:         statusUpd.value,
          company_remarks: remarksUpd.value,
          interview_date: interviewDate.value || undefined,
          interview_mode: interviewMode.value,
        })
        toast.success('Updated', `Status → ${statusUpd.value}`)
        showModal.value = false
        fetchApps()
      } catch (e) {
        toast.error('Error', e.response?.data?.error || 'Update failed')
      } finally { submitting.value = false }
    }

    onMounted(fetchDrives)
    return {
      loading, drives, apps, selDrive, selApp, showModal,
      statusUpd, remarksUpd, interviewDate, interviewMode, submitting,
      fetchApps, openModal, updateApp
    }
  },
  template: `
    <div>
      <!-- Drive Selector -->
      <div class="pp-card mb-4">
        <div class="pp-card-body d-flex align-items-center gap-3 flex-wrap">
          <label class="fw-600 mb-0">Select Drive:</label>
          <select v-model="selDrive" @change="fetchApps" class="pp-form-control" style="max-width:350px">
            <option v-for="d in drives" :key="d.id" :value="d.id">{{ d.job_title }} ({{ d.applications_count }} apps)</option>
            <option v-if="!drives.length" :value="null">No approved drives</option>
          </select>
          <div class="ms-auto d-flex gap-2 flex-wrap">
            <span class="badge bg-primary">Applied: {{ apps.filter(a=>a.status==='Applied').length }}</span>
            <span class="badge bg-warning text-dark">Shortlisted: {{ apps.filter(a=>a.status==='Shortlisted').length }}</span>
            <span class="badge bg-info text-dark">Interview: {{ apps.filter(a=>a.status==='Interview').length }}</span>
            <span class="badge bg-success">Selected: {{ apps.filter(a=>a.status==='Selected').length }}</span>
            <span class="badge bg-danger">Rejected: {{ apps.filter(a=>a.status==='Rejected').length }}</span>
          </div>
        </div>
      </div>

      <pp-loading v-if="loading" />
      <div v-else-if="!apps.length" class="empty-state">
        <i class="bi bi-inbox"></i>
        <p>No applications received yet for this drive.</p>
      </div>
      <div v-else class="pp-card">
        <div class="pp-card-body p-0">
          <table class="pp-table">
            <thead><tr>
              <th>Student</th><th>Roll No</th><th>Branch</th><th>CGPA</th>
              <th>Applied On</th><th>Status</th><th>Interview</th><th>Actions</th>
            </tr></thead>
            <tbody>
              <tr v-for="a in apps" :key="a.id">
                <td>
                  <div class="fw-600">{{ a.student_name }}</div>
                  <div class="small text-muted">{{ a.student_email }}</div>
                </td>
                <td>{{ a.student_roll || '—' }}</td>
                <td>{{ a.student_branch || '—' }}</td>
                <td>
                  <span class="badge" :class="a.student_cgpa >= 8 ? 'bg-success' : a.student_cgpa >= 6 ? 'bg-warning text-dark' : 'bg-danger'">
                    {{ a.student_cgpa || '—' }}
                  </span>
                </td>
                <td>{{ a.application_date }}</td>
                <td>
                  <span class="status-badge" :class="'badge-' + a.status.toLowerCase()">{{ a.status }}</span>
                </td>
                <td>
                  <span v-if="a.interview_date" class="small text-info">
                    <i class="bi bi-calendar-event me-1"></i>{{ a.interview_date?.slice(0,10) }}
                  </span>
                  <span v-else class="text-muted small">—</span>
                </td>
                <td>
                  <button @click="openModal(a)" class="btn btn-sm btn-outline-primary">
                    <i class="bi bi-pencil"></i> Update
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Update Modal -->
      <div v-if="showModal && selApp" class="modal d-block" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header" style="background:#1e40af;color:#fff">
              <h5 class="modal-title">Update: {{ selApp.student_name }}</h5>
              <button @click="showModal=false" class="btn-close btn-close-white"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="pp-form-label">Application Status</label>
                <select v-model="statusUpd" class="pp-form-control">
                  <option>Applied</option>
                  <option>Shortlisted</option>
                  <option>Interview</option>
                  <option>Selected</option>
                  <option>Rejected</option>
                </select>
              </div>
              <div v-if="statusUpd === 'Interview'" class="row g-3 mb-3">
                <div class="col-8">
                  <label class="pp-form-label">Interview Date & Time</label>
                  <input v-model="interviewDate" type="datetime-local" class="pp-form-control">
                </div>
                <div class="col-4">
                  <label class="pp-form-label">Mode</label>
                  <select v-model="interviewMode" class="pp-form-control">
                    <option>Online</option>
                    <option>In-person</option>
                    <option>Phone</option>
                  </select>
                </div>
              </div>
              <div class="mb-3">
                <label class="pp-form-label">Remarks (for student)</label>
                <textarea v-model="remarksUpd" class="pp-form-control" rows="3" placeholder="Optional feedback..."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button @click="showModal=false" class="btn btn-outline-secondary">Cancel</button>
              <button @click="updateApp" class="btn btn-primary" :disabled="submitting">
                <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}
