// static/js/views/admin/AdminDrives.js
const AdminDrives = {
  setup() {
    const { ref, onMounted } = Vue
    const toast = Vue.inject('toast')

    const drives   = ref([])
    const total    = ref(0)
    const loading  = ref(true)
    const search   = ref('')
    const statusF  = ref('')
    const selected = ref(null)
    const showModal= ref(false)
    const remarks  = ref('')

    async function fetchDrives() {
      loading.value = true
      try {
        const res = await adminDrives({ search: search.value, status: statusF.value })
        drives.value = res.data.drives
        total.value  = res.data.total
      } catch { toast.error('Error', 'Failed to load drives') }
      finally { loading.value = false }
    }

    async function openModal(drive) {
      loading.value = true
      try {
        const res = await adminGetDrive(drive.id)
        selected.value = res.data
        remarks.value  = drive.admin_remarks || ''
        showModal.value = true
      } catch { toast.error('Error', 'Failed to load drive details') }
      finally { loading.value = false }
    }

    async function updateDrive(status) {
      try {
        await adminUpdateDrive(selected.value.id, { status, admin_remarks: remarks.value })
        toast.success('Updated', `Drive ${status}`)
        showModal.value = false
        fetchDrives()
      } catch { toast.error('Error', 'Update failed') }
    }

    onMounted(fetchDrives)
    return {
      drives, total, loading, search, statusF, selected, showModal, remarks,
      fetchDrives, openModal, updateDrive
    }
  },
  template: `
    <div>
      <div class="pp-card">
        <div class="pp-card-header">
          <h5><i class="bi bi-briefcase me-2"></i>Placement Drives ({{ total }})</h5>
          <div class="d-flex gap-2">
            <select v-model="statusF" @change="fetchDrives" class="pp-form-control" style="width:160px">
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Closed">Closed</option>
            </select>
            <input v-model="search" @keyup.enter="fetchDrives" type="text"
              class="pp-form-control" placeholder="Search drives..." style="width:200px">
            <button @click="fetchDrives" class="btn btn-primary btn-sm px-3">
              <i class="bi bi-search"></i>
            </button>
          </div>
        </div>
        <div class="pp-card-body p-0">
          <pp-loading v-if="loading" />
          <table v-else class="pp-table">
            <thead><tr>
              <th>Job Title</th><th>Company</th><th>Type</th><th>Deadline</th>
              <th>Min CGPA</th><th>Applicants</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              <tr v-for="d in drives" :key="d.id">
                <td>
                  <div class="fw-600">{{ d.job_title }}</div>
                  <div class="small text-muted">{{ d.location || 'Remote' }}</div>
                </td>
                <td>{{ d.company_name }}</td>
                <td><span class="badge bg-info text-dark">{{ d.job_type }}</span></td>
                <td>
                  <span :class="{ 'text-danger fw-600': new Date(d.application_deadline) < new Date() }">
                    {{ d.application_deadline }}
                  </span>
                </td>
                <td>{{ d.min_cgpa }}</td>
                <td><span class="badge bg-secondary">{{ d.applications_count }}</span></td>
                <td>
                  <span class="status-badge" :class="'badge-' + d.status.toLowerCase()">{{ d.status }}</span>
                </td>
                <td>
                  <button @click="openModal(d)" class="btn btn-sm btn-outline-primary">
                    <i class="bi bi-pencil"></i> Review
                  </button>
                </td>
              </tr>
              <tr v-if="!drives.length">
                <td colspan="8" class="text-center text-muted py-5">No drives found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Drive Review Modal -->
      <div v-if="showModal && selected" class="modal d-block" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header" style="background:#1e40af;color:#fff">
              <h5 class="modal-title">Review: {{ selected.job_title }}</h5>
              <button @click="showModal=false" class="btn-close btn-close-white"></button>
            </div>
            <div class="modal-body">
              <div class="row g-3 mb-3">
                <div class="col-6"><strong>Company:</strong> {{ selected.company_name }}</div>
                <div class="col-6"><strong>Job Type:</strong> {{ selected.job_type }}</div>
                <div class="col-6"><strong>Location:</strong> {{ selected.location || '—' }}</div>
                <div class="col-6"><strong>Deadline:</strong> {{ selected.application_deadline }}</div>
                <div class="col-4"><strong>Min CGPA:</strong> {{ selected.min_cgpa }}</div>
                <div class="col-4"><strong>Grad Year:</strong> {{ selected.eligible_year || 'Any' }}</div>
                <div class="col-4"><strong>Max Apps:</strong> {{ selected.max_applications || 'Unlimited' }}</div>
                <div class="col-6">
                  <strong>Salary:</strong>
                  {{ selected.salary_min && selected.salary_max ? '₹' + selected.salary_min + ' - ₹' + selected.salary_max : '—' }}
                </div>
                <div class="col-6">
                  <strong>Branches:</strong>
                  <span v-for="b in selected.eligible_branches" :key="b" class="badge bg-light text-dark me-1">{{ b }}</span>
                  <span v-if="!selected.eligible_branches?.length">All</span>
                </div>
                <div class="col-12">
                  <strong>Description:</strong>
                  <p class="mt-1 text-muted small">{{ selected.job_description }}</p>
                </div>
              </div>
              <div class="mb-3">
                <label class="pp-form-label">Admin Remarks</label>
                <textarea v-model="remarks" class="pp-form-control" rows="2" placeholder="Optional remarks..."></textarea>
              </div>
              <div class="d-flex gap-2">
                <button @click="updateDrive('Approved')" class="btn btn-success flex-fill">
                  <i class="bi bi-check-lg me-1"></i> Approve
                </button>
                <button @click="updateDrive('Rejected')" class="btn btn-danger flex-fill">
                  <i class="bi bi-x-lg me-1"></i> Reject
                </button>
                <button @click="updateDrive('Closed')" class="btn btn-secondary">
                  Close Drive
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}
