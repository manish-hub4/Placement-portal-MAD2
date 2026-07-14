// static/js/views/admin/AdminStudents.js
const AdminStudents = {
  setup() {
    const { ref, onMounted } = Vue
    const toast = Vue.inject('toast')

    const students = ref([])
    const total    = ref(0)
    const loading  = ref(true)
    const search   = ref('')
    const branch   = ref('')
    const page     = ref(1)
    const selected = ref(null)
    const showModal= ref(false)

    const branches = ['CSE','IT','ECE','EEE','ME','CE','CH','BT','MBA','MCA','Other']

    async function fetchStudents() {
      loading.value = true
      try {
        const res = await adminStudents({ search: search.value, branch: branch.value, page: page.value })
        students.value = res.data.students
        total.value    = res.data.total
      } catch { toast.error('Error', 'Failed to load students') }
      finally { loading.value = false }
    }

    async function openModal(student) {
      loading.value = true
      try {
        const res = await adminGetStudent(student.id)
        selected.value = res.data
        showModal.value = true
      } catch { toast.error('Error', 'Failed to load student details') }
      finally { loading.value = false }
    }

    async function toggleActive(student) {
      try {
        await adminUpdateStudent(student.id, { is_active: !student.is_active })
        toast.success(student.is_active ? 'Deactivated' : 'Activated', student.full_name)
        fetchStudents()
      } catch { toast.error('Error', 'Action failed') }
    }

    async function deleteStudent(id) {
      if (!confirm('Delete this student permanently?')) return
      try {
        await adminDeleteStudent(id)
        toast.success('Deleted', 'Student removed')
        fetchStudents()
      } catch { toast.error('Error', 'Delete failed') }
    }

    onMounted(fetchStudents)
    return {
      students, total, loading, search, branch, page, branches,
      selected, showModal, fetchStudents, openModal, toggleActive, deleteStudent
    }
  },
  template: `
    <div>
      <div class="pp-card">
        <div class="pp-card-header">
          <h5><i class="bi bi-people me-2"></i>Students ({{ total }})</h5>
          <div class="d-flex gap-2 flex-wrap">
            <select v-model="branch" @change="fetchStudents" class="pp-form-control" style="width:130px">
              <option value="">All Branches</option>
              <option v-for="b in branches" :key="b" :value="b">{{ b }}</option>
            </select>
            <input v-model="search" @keyup.enter="fetchStudents" type="text"
              class="pp-form-control" placeholder="Search name / roll no..." style="width:220px">
            <button @click="fetchStudents" class="btn btn-primary btn-sm px-3">
              <i class="bi bi-search"></i>
            </button>
          </div>
        </div>
        <div class="pp-card-body p-0">
          <pp-loading v-if="loading" />
          <table v-else class="pp-table">
            <thead><tr>
              <th>Name</th><th>Roll No</th><th>Branch</th><th>CGPA</th>
              <th>Grad Year</th><th>Applications</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              <tr v-for="s in students" :key="s.id">
                <td>
                  <div class="fw-600">{{ s.full_name }}</div>
                  <div class="small text-muted">{{ s.email }}</div>
                </td>
                <td>{{ s.roll_number || '—' }}</td>
                <td>{{ s.branch || '—' }}</td>
                <td><span class="badge bg-info text-dark">{{ s.cgpa || '—' }}</span></td>
                <td>{{ s.graduation_year || '—' }}</td>
                <td><span class="badge bg-secondary">{{ s.applications_count }}</span></td>
                <td>
                  <span class="status-badge" :class="s.is_active ? 'badge-approved' : 'badge-rejected'">
                    {{ s.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td>
                  <div class="d-flex gap-1">
                    <button @click="openModal(s)" class="btn btn-sm btn-outline-primary" title="View Details">
                      <i class="bi bi-eye"></i>
                    </button>
                    <button @click="toggleActive(s)" class="btn btn-sm"
                      :class="s.is_active ? 'btn-outline-warning' : 'btn-outline-success'" title="Toggle Active">
                      <i class="bi" :class="s.is_active ? 'bi-person-dash' : 'bi-person-check'"></i>
                    </button>
                    <button @click="deleteStudent(s.id)" class="btn btn-sm btn-outline-danger" title="Delete">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!students.length">
                <td colspan="8" class="text-center text-muted py-5">No students found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Student Detail Modal -->
      <div v-if="showModal && selected" class="modal d-block" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header" style="background:#1e40af;color:#fff">
              <h5 class="modal-title">{{ selected.full_name }}</h5>
              <button @click="showModal=false" class="btn-close btn-close-white"></button>
            </div>
            <div class="modal-body">
              <div class="row g-3 mb-4">
                <div class="col-6"><strong>Email:</strong> {{ selected.email }}</div>
                <div class="col-6"><strong>Phone:</strong> {{ selected.phone || '—' }}</div>
                <div class="col-6"><strong>Roll No:</strong> {{ selected.roll_number || '—' }}</div>
                <div class="col-6"><strong>Branch:</strong> {{ selected.branch || '—' }}</div>
                <div class="col-4"><strong>CGPA:</strong> {{ selected.cgpa }}</div>
                <div class="col-4"><strong>10th %:</strong> {{ selected.tenth_percent || '—' }}</div>
                <div class="col-4"><strong>12th %:</strong> {{ selected.twelfth_percent || '—' }}</div>
                <div class="col-6"><strong>Grad Year:</strong> {{ selected.graduation_year }}</div>
                <div class="col-6"><strong>Gender:</strong> {{ selected.gender || '—' }}</div>
                <div class="col-12"><strong>Skills:</strong> {{ selected.skills || '—' }}</div>
              </div>
              <h6 class="mb-3">Application History ({{ selected.applications?.length || 0 }})</h6>
              <table class="pp-table">
                <thead><tr><th>Company</th><th>Drive</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                  <tr v-for="a in selected.applications" :key="a.id">
                    <td>{{ a.company_name }}</td>
                    <td>{{ a.drive_title }}</td>
                    <td>{{ a.application_date }}</td>
                    <td><span class="status-badge" :class="'badge-' + a.status.toLowerCase()">{{ a.status }}</span></td>
                  </tr>
                  <tr v-if="!selected.applications?.length">
                    <td colspan="4" class="text-center text-muted py-3">No applications</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}
