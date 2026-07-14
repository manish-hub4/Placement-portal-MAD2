// static/js/views/company/CompanyDrives.js
const CompanyDrives = {
  setup() {
    const { ref, reactive, onMounted } = Vue
    const toast   = Vue.inject('toast')
    const loading = ref(true)
    const drives  = ref([])
    const showForm= ref(false)
    const editMode= ref(false)
    const editId  = ref(null)
    const submitting = ref(false)
    const branches = ['CSE','IT','ECE','EEE','ME','CE','CH','BT','MBA','MCA','Other']

    const form = reactive({
      job_title: '', job_description: '', job_type: 'Full-time',
      location: '', salary_min: '', salary_max: '',
      eligible_branches: [], min_cgpa: 0, eligible_year: '',
      min_tenth_percent: 0, min_twelfth_percent: 0,
      application_deadline: '', max_applications: ''
    })

    function resetForm() {
      Object.assign(form, {
        job_title: '', job_description: '', job_type: 'Full-time',
        location: '', salary_min: '', salary_max: '',
        eligible_branches: [], min_cgpa: 0, eligible_year: '',
        min_tenth_percent: 0, min_twelfth_percent: 0,
        application_deadline: '', max_applications: ''
      })
    }

    async function fetchDrives() {
      loading.value = true
      try {
        const res = await companyDrives()
        drives.value = res.data.drives
      } catch (e) {
        if (e.response?.status !== 403) toast.error('Error', 'Failed to load drives')
      } finally { loading.value = false }
    }

    async function submitDrive() {
      submitting.value = true
      try {
        if (editMode.value) {
          await companyUpdateDrive(editId.value, form)
          toast.success('Updated', 'Drive updated successfully')
        } else {
          await companyCreateDrive(form)
          toast.success('Submitted', 'Drive submitted for admin approval')
        }
        showForm.value = false
        editMode.value = false
        resetForm()
        fetchDrives()
      } catch (e) {
        toast.error('Error', e.response?.data?.error || 'Failed to save drive')
      } finally { submitting.value = false }
    }

    function editDrive(drive) {
      Object.assign(form, {
        job_title:           drive.job_title,
        job_description:     drive.job_description,
        job_type:            drive.job_type,
        location:            drive.location || '',
        salary_min:          drive.salary_min || '',
        salary_max:          drive.salary_max || '',
        eligible_branches:   drive.eligible_branches || [],
        min_cgpa:            drive.min_cgpa,
        eligible_year:       drive.eligible_year || '',
        min_tenth_percent:   drive.min_tenth_percent || 0,
        min_twelfth_percent: drive.min_twelfth_percent || 0,
        application_deadline:drive.application_deadline,
        max_applications:    drive.max_applications || '',
      })
      editId.value = drive.id
      editMode.value = true
      showForm.value = true
    }

    async function closeDrive(id) {
      if (!confirm('Close this drive? Students will no longer be able to apply.')) return
      try {
        await companyUpdateDrive(id, { status: 'Closed' })
        toast.success('Closed', 'Drive is now closed')
        fetchDrives()
      } catch { toast.error('Error', 'Failed to close drive') }
    }

    onMounted(fetchDrives)
    return {
      loading, drives, showForm, editMode, submitting, form, branches,
      fetchDrives, submitDrive, editDrive, closeDrive, resetForm
    }
  },
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h5 class="mb-0">My Placement Drives ({{ drives.length }})</h5>
        <button @click="() => { resetForm(); editMode=false; showForm=!showForm }" class="btn-pp-primary">
          <i class="bi bi-plus-lg me-1"></i>{{ showForm ? 'Cancel' : 'Create Drive' }}
        </button>
      </div>

      <!-- Create/Edit Form -->
      <div v-if="showForm" class="pp-card mb-4">
        <div class="pp-card-header">
          <h5>{{ editMode ? 'Edit Drive' : 'Create New Drive' }}</h5>
        </div>
        <div class="pp-card-body">
          <form @submit.prevent="submitDrive">
            <div class="row g-3">
              <div class="col-12">
                <label class="pp-form-label">Job Title *</label>
                <input v-model="form.job_title" type="text" class="pp-form-control" required>
              </div>
              <div class="col-12">
                <label class="pp-form-label">Job Description *</label>
                <textarea v-model="form.job_description" class="pp-form-control" rows="4" required></textarea>
              </div>
              <div class="col-md-4">
                <label class="pp-form-label">Job Type</label>
                <select v-model="form.job_type" class="pp-form-control">
                  <option>Full-time</option>
                  <option>Internship</option>
                  <option>Contract</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="pp-form-label">Location</label>
                <input v-model="form.location" type="text" class="pp-form-control" placeholder="City or Remote">
              </div>
              <div class="col-md-4">
                <label class="pp-form-label">Application Deadline *</label>
                <input v-model="form.application_deadline" type="date" class="pp-form-control" required>
              </div>
              <div class="col-md-3">
                <label class="pp-form-label">Min Salary (₹)</label>
                <input v-model="form.salary_min" type="number" class="pp-form-control" placeholder="e.g. 300000">
              </div>
              <div class="col-md-3">
                <label class="pp-form-label">Max Salary (₹)</label>
                <input v-model="form.salary_max" type="number" class="pp-form-control" placeholder="e.g. 700000">
              </div>
              <div class="col-md-3">
                <label class="pp-form-label">Min CGPA</label>
                <input v-model="form.min_cgpa" type="number" step="0.1" min="0" max="10" class="pp-form-control">
              </div>
              <div class="col-md-3">
                <label class="pp-form-label">Graduation Year</label>
                <input v-model="form.eligible_year" type="number" class="pp-form-control" placeholder="e.g. 2025">
              </div>
              <div class="col-md-3">
                <label class="pp-form-label">Min 10th %</label>
                <input v-model="form.min_tenth_percent" type="number" min="0" max="100" class="pp-form-control">
              </div>
              <div class="col-md-3">
                <label class="pp-form-label">Min 12th %</label>
                <input v-model="form.min_twelfth_percent" type="number" min="0" max="100" class="pp-form-control">
              </div>
              <div class="col-md-3">
                <label class="pp-form-label">Max Applications</label>
                <input v-model="form.max_applications" type="number" class="pp-form-control" placeholder="Unlimited">
              </div>
              <div class="col-md-3">
                <label class="pp-form-label">Eligible Branches</label>
                <select v-model="form.eligible_branches" multiple class="pp-form-control" style="height:80px">
                  <option v-for="b in branches" :key="b" :value="b">{{ b }}</option>
                </select>
                <small class="text-muted">Ctrl+click to select multiple</small>
              </div>
            </div>
            <div class="mt-4 d-flex gap-2">
              <button type="submit" class="btn-pp-primary px-4" :disabled="submitting">
                <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
                {{ editMode ? 'Update Drive' : 'Submit for Approval' }}
              </button>
              <button type="button" @click="showForm=false" class="btn btn-outline-secondary">Cancel</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Drives Table -->
      <pp-loading v-if="loading" />
      <div v-else-if="!drives.length" class="empty-state">
        <i class="bi bi-briefcase"></i>
        <p>No drives created yet. Click "Create Drive" to get started.</p>
      </div>
      <div v-else class="row g-3">
        <div class="col-12" v-for="d in drives" :key="d.id">
          <div class="pp-card">
            <div class="pp-card-body">
              <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
                <div>
                  <span class="status-badge mb-2 d-inline-block" :class="'badge-' + d.status.toLowerCase()">{{ d.status }}</span>
                  <h5 class="mb-1 fw-700">{{ d.job_title }}</h5>
                  <div class="pp-drive-meta">
                    <span><i class="bi bi-geo-alt me-1"></i>{{ d.location || 'Any' }}</span>
                    <span><i class="bi bi-briefcase me-1"></i>{{ d.job_type }}</span>
                    <span><i class="bi bi-calendar me-1"></i>Deadline: {{ d.application_deadline }}</span>
                    <span><i class="bi bi-people me-1"></i>{{ d.applications_count }} applicants</span>
                    <span v-if="d.salary_min"><i class="bi bi-currency-rupee"></i>{{ d.salary_min }} – {{ d.salary_max }}</span>
                  </div>
                  <div class="mt-2">
                    <span v-for="b in d.eligible_branches" :key="b" class="badge bg-light text-dark me-1">{{ b }}</span>
                    <span class="badge bg-light text-dark">Min CGPA: {{ d.min_cgpa }}</span>
                  </div>
                </div>
                <div class="d-flex gap-2">
                  <button @click="editDrive(d)" class="btn btn-sm btn-outline-primary" :disabled="d.status==='Closed'">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button @click="closeDrive(d.id)" class="btn btn-sm btn-outline-warning" :disabled="d.status==='Closed'">
                    <i class="bi bi-lock"></i> Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}
