// static/js/views/admin/AdminCompanies.js
const AdminCompanies = {
  setup() {
    const { ref, onMounted, reactive } = Vue
    const toast = Vue.inject('toast')

    const companies  = ref([])
    const total      = ref(0)
    const loading    = ref(true)
    const search     = ref('')
    const statusFilter = ref('')
    const page       = ref(1)
    const selected   = ref(null)
    const showModal  = ref(false)
    const remarks    = ref('')

    async function fetchCompanies() {
      loading.value = true
      try {
        const res = await adminCompanies({ search: search.value, status: statusFilter.value, page: page.value })
        companies.value = res.data.companies
        total.value     = res.data.total
      } catch { toast.error('Error', 'Failed to load companies') }
      finally { loading.value = false }
    }

    function openModal(company) {
      selected.value = { ...company }
      remarks.value  = company.admin_remarks || ''
      showModal.value = true
    }

    async function updateCompany(status) {
      try {
        await adminUpdateCompany(selected.value.id, { approval_status: status, admin_remarks: remarks.value })
        toast.success('Updated', `Company ${status}`)
        showModal.value = false
        fetchCompanies()
      } catch { toast.error('Error', 'Update failed') }
    }

    async function toggleBlacklist(company) {
      const newState = !company.is_blacklisted
      try {
        await adminUpdateCompany(company.id, { is_blacklisted: newState })
        toast.success(newState ? 'Blacklisted' : 'Restored', company.company_name)
        fetchCompanies()
      } catch { toast.error('Error', 'Action failed') }
    }

    async function deleteCompany(id) {
      if (!confirm('Delete this company permanently?')) return
      try {
        await adminDeleteCompany(id)
        toast.success('Deleted', 'Company removed')
        fetchCompanies()
      } catch { toast.error('Error', 'Delete failed') }
    }

    onMounted(fetchCompanies)
    return {
      companies, total, loading, search, statusFilter, page,
      selected, showModal, remarks,
      fetchCompanies, openModal, updateCompany, toggleBlacklist, deleteCompany
    }
  },
  template: `
    <div>
      <div class="pp-card mb-4">
        <div class="pp-card-header">
          <h5><i class="bi bi-building me-2"></i>Companies ({{ total }})</h5>
          <div class="d-flex gap-2">
            <select v-model="statusFilter" @change="fetchCompanies" class="pp-form-control" style="width:160px">
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
            <input v-model="search" @keyup.enter="fetchCompanies" type="text"
              class="pp-form-control" placeholder="Search companies..." style="width:220px">
            <button @click="fetchCompanies" class="btn btn-primary btn-sm px-3">
              <i class="bi bi-search"></i>
            </button>
          </div>
        </div>
        <div class="pp-card-body p-0">
          <pp-loading v-if="loading" />
          <table v-else class="pp-table">
            <thead><tr>
              <th>Company</th><th>Industry</th><th>HR Contact</th>
              <th>Drives</th><th>Status</th><th>Blacklist</th><th>Actions</th>
            </tr></thead>
            <tbody>
              <tr v-for="c in companies" :key="c.id">
                <td>
                  <div class="fw-600">{{ c.company_name }}</div>
                  <div class="small text-muted">{{ c.email }}</div>
                </td>
                <td>{{ c.industry || '—' }}</td>
                <td>{{ c.hr_name || '—' }}</td>
                <td><span class="badge bg-primary">{{ c.drives_count }}</span></td>
                <td>
                  <span class="status-badge" :class="'badge-' + c.approval_status.toLowerCase()">{{ c.approval_status }}</span>
                </td>
                <td>
                  <span v-if="c.is_blacklisted" class="status-badge badge-rejected">Blacklisted</span>
                  <span v-else class="text-success small">Active</span>
                </td>
                <td>
                  <div class="d-flex gap-1">
                    <button @click="openModal(c)" class="btn btn-sm btn-outline-primary" title="Review">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button @click="toggleBlacklist(c)" class="btn btn-sm"
                      :class="c.is_blacklisted ? 'btn-outline-success' : 'btn-outline-warning'" title="Toggle Blacklist">
                      <i class="bi" :class="c.is_blacklisted ? 'bi-check-circle' : 'bi-slash-circle'"></i>
                    </button>
                    <button @click="deleteCompany(c.id)" class="btn btn-sm btn-outline-danger" title="Delete">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!companies.length">
                <td colspan="7" class="text-center text-muted py-5">No companies found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Review Modal -->
      <div v-if="showModal && selected" class="modal d-block" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header" style="background:#1e40af;color:#fff">
              <h5 class="modal-title">Review: {{ selected.company_name }}</h5>
              <button @click="showModal=false" class="btn-close btn-close-white"></button>
            </div>
            <div class="modal-body">
              <div class="row g-3 mb-3">
                <div class="col-6"><strong>Industry:</strong> {{ selected.industry || '—' }}</div>
                <div class="col-6"><strong>Website:</strong> <a :href="selected.website" target="_blank">{{ selected.website || '—' }}</a></div>
                <div class="col-6"><strong>HR Name:</strong> {{ selected.hr_name || '—' }}</div>
                <div class="col-6"><strong>HR Email:</strong> {{ selected.hr_email || '—' }}</div>
                <div class="col-6"><strong>Size:</strong> {{ selected.company_size || '—' }}</div>
                <div class="col-6"><strong>HQ:</strong> {{ selected.headquarters || '—' }}</div>
                <div class="col-12"><strong>Description:</strong> {{ selected.description || '—' }}</div>
              </div>
              <div class="mb-3">
                <label class="pp-form-label">Admin Remarks</label>
                <textarea v-model="remarks" class="pp-form-control" rows="3" placeholder="Add remarks (optional)"></textarea>
              </div>
              <div class="d-flex gap-2">
                <button @click="updateCompany('Approved')" class="btn btn-success flex-fill">
                  <i class="bi bi-check-lg me-1"></i> Approve
                </button>
                <button @click="updateCompany('Rejected')" class="btn btn-danger flex-fill">
                  <i class="bi bi-x-lg me-1"></i> Reject
                </button>
                <button @click="updateCompany('Pending')" class="btn btn-outline-secondary">
                  Reset to Pending
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}
