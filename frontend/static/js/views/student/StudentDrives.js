// static/js/views/student/StudentDrives.js
const StudentDrives = {
  setup() {
    const { ref, onMounted } = Vue
    const toast    = Vue.inject('toast')
    const loading  = ref(true)
    const drives   = ref([])
    const search   = ref('')
    const jobType  = ref('')
    const eligOnly = ref(false)
    const selDrive = ref(null)
    const showModal= ref(false)
    const cover    = ref('')
    const applying = ref(false)

    async function fetchDrives() {
      loading.value = true
      try {
        const res = await studentDrives({
          search: search.value,
          job_type: jobType.value,
          eligible_only: eligOnly.value
        })
        drives.value = res.data.drives
      } catch { toast.error('Error', 'Failed to load drives') }
      finally { loading.value = false }
    }

    function openApply(drive) {
      selDrive.value = drive
      cover.value    = ''
      showModal.value = true
    }

    async function applyDrive() {
      applying.value = true
      try {
        await studentApply(selDrive.value.id, { cover_letter: cover.value })
        toast.success('Applied! 🎉', `Application submitted for ${selDrive.value.job_title}`)
        showModal.value = false
        fetchDrives()
      } catch (e) {
        toast.error('Error', e.response?.data?.error || 'Application failed')
      } finally { applying.value = false }
    }

    onMounted(fetchDrives)
    return {
      loading, drives, search, jobType, eligOnly,
      selDrive, showModal, cover, applying,
      fetchDrives, openApply, applyDrive
    }
  },
  template: `
    <div>
      <!-- Filters -->
      <div class="pp-card mb-4">
        <div class="pp-card-body">
          <div class="row g-3 align-items-end">
            <div class="col-md-5">
              <label class="pp-form-label">Search Drives</label>
              <input v-model="search" type="text" class="pp-form-control"
                placeholder="Job title, location..." @keyup.enter="fetchDrives">
            </div>
            <div class="col-md-3">
              <label class="pp-form-label">Job Type</label>
              <select v-model="jobType" class="pp-form-control">
                <option value="">All Types</option>
                <option>Full-time</option>
                <option>Internship</option>
                <option>Contract</option>
              </select>
            </div>
            <div class="col-md-2 d-flex align-items-center gap-2 pt-3">
              <input type="checkbox" v-model="eligOnly" id="eligOnly" class="form-check-input mt-0">
              <label for="eligOnly" class="small fw-600 mb-0">Eligible only</label>
            </div>
            <div class="col-md-2">
              <button @click="fetchDrives" class="btn-pp-primary w-100">
                <i class="bi bi-search me-1"></i>Search
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="d-flex justify-content-between align-items-center mb-3">
        <p class="text-muted small mb-0">{{ drives.length }} drive(s) found</p>
      </div>

      <pp-loading v-if="loading" />
      <div v-else-if="!drives.length" class="empty-state">
        <i class="bi bi-briefcase"></i>
        <p>No drives match your criteria.</p>
      </div>
      <div v-else class="row g-3">
        <div class="col-12" v-for="d in drives" :key="d.id">
          <div class="pp-drive-card" :class="{ 'border-success': d.already_applied }">
            <div class="d-flex justify-content-between align-items-start flex-wrap gap-3">
              <div class="flex-grow-1">
                <div class="pp-drive-company">{{ d.company_name }}</div>
                <div class="pp-drive-title">{{ d.job_title }}</div>
                <div class="pp-drive-meta">
                  <span><i class="bi bi-briefcase me-1"></i>{{ d.job_type }}</span>
                  <span v-if="d.location"><i class="bi bi-geo-alt me-1"></i>{{ d.location }}</span>
                  <span v-if="d.salary_min"><i class="bi bi-currency-rupee"></i>{{ (d.salary_min/100000).toFixed(1) }}L – {{ (d.salary_max/100000).toFixed(1) }}L</span>
                  <span><i class="bi bi-people me-1"></i>{{ d.applications_count }} applied</span>
                </div>
                <div class="d-flex flex-wrap gap-2 mt-2">
                  <span v-for="b in d.eligible_branches" :key="b" class="badge bg-primary bg-opacity-10 text-primary">{{ b }}</span>
                  <span class="badge bg-secondary bg-opacity-10 text-secondary">Min CGPA: {{ d.min_cgpa }}</span>
                  <span v-if="d.eligible_year" class="badge bg-secondary bg-opacity-10 text-secondary">Batch {{ d.eligible_year }}</span>
                </div>
                <!-- Eligibility warning -->
                <div v-if="!d.is_eligible && !d.already_applied" class="alert alert-warning py-1 px-2 mt-2 small d-inline-block mb-0">
                  <i class="bi bi-exclamation-triangle me-1"></i>{{ d.eligibility_reason }}
                </div>
              </div>
              <div class="text-end d-flex flex-column align-items-end gap-2">
                <div class="pp-drive-deadline">
                  <i class="bi bi-calendar me-1"></i>Deadline: {{ d.application_deadline }}
                </div>
                <div v-if="d.already_applied">
                  <span class="status-badge badge-applied"><i class="bi bi-check me-1"></i>Applied</span>
                </div>
                <button v-else @click="openApply(d)"
                  :disabled="!d.is_eligible"
                  class="btn btn-primary btn-sm px-4"
                  :title="!d.is_eligible ? d.eligibility_reason : ''">
                  <i class="bi bi-send me-1"></i>Apply Now
                </button>
              </div>
            </div>
            <div class="mt-3 pt-3 border-top">
              <p class="small text-muted text-truncate-2 mb-0">{{ d.job_description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Apply Modal -->
      <div v-if="showModal && selDrive" class="modal d-block" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header" style="background:#1e40af;color:#fff">
              <h5 class="modal-title">Apply: {{ selDrive.job_title }}</h5>
              <button @click="showModal=false" class="btn-close btn-close-white"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3 p-3 bg-light rounded">
                <div class="fw-600">{{ selDrive.company_name }}</div>
                <div class="small text-muted">{{ selDrive.job_type }} • {{ selDrive.location || 'Remote' }}</div>
                <div class="small text-danger mt-1"><i class="bi bi-clock me-1"></i>Deadline: {{ selDrive.application_deadline }}</div>
              </div>
              <div>
                <label class="pp-form-label">Cover Letter (Optional)</label>
                <textarea v-model="cover" class="pp-form-control" rows="5"
                  placeholder="Write a brief note about why you're a great fit for this role..."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button @click="showModal=false" class="btn btn-outline-secondary">Cancel</button>
              <button @click="applyDrive" class="btn btn-primary px-4" :disabled="applying">
                <span v-if="applying" class="spinner-border spinner-border-sm me-2"></span>
                {{ applying ? 'Submitting...' : 'Submit Application' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}
