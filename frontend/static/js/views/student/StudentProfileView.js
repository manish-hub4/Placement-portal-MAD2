// static/js/views/student/StudentProfileView.js
const StudentProfileView = {
  setup() {
    const { ref, reactive, onMounted } = Vue
    const toast   = Vue.inject('toast')
    const loading = ref(true)
    const saving  = ref(false)
    const profile = ref(null)

    const branches = ['CSE','IT','ECE','EEE','ME','CE','CH','BT','MBA','MCA','Other']

    const form = reactive({
      first_name:'', last_name:'', phone:'', roll_number:'',
      branch:'', cgpa:'', tenth_percent:'', twelfth_percent:'',
      graduation_year:'', gender:'', dob:'', skills:''
    })

    async function fetchProfile() {
      loading.value = true
      try {
        const res = await studentProfile()
        profile.value = res.data
        Object.assign(form, {
          first_name:      res.data.first_name || '',
          last_name:       res.data.last_name || '',
          phone:           res.data.phone || '',
          roll_number:     res.data.roll_number || '',
          branch:          res.data.branch || '',
          cgpa:            res.data.cgpa || '',
          tenth_percent:   res.data.tenth_percent || '',
          twelfth_percent: res.data.twelfth_percent || '',
          graduation_year: res.data.graduation_year || '',
          gender:          res.data.gender || '',
          dob:             res.data.dob || '',
          skills:          res.data.skills || '',
        })
      } catch { toast.error('Error', 'Failed to load profile') }
      finally { loading.value = false }
    }

    async function saveProfile() {
      saving.value = true
      try {
        const res = await studentUpdateProfile(form)
        profile.value = res.data
        toast.success('Saved', 'Profile updated successfully')
      } catch (e) {
        toast.error('Error', e.response?.data?.error || 'Save failed')
      } finally { saving.value = false }
    }

    onMounted(fetchProfile)
    return { loading, saving, profile, form, branches, saveProfile }
  },
  template: `
    <div>
      <pp-loading v-if="loading" />
      <div v-else>
        <!-- Account Status Alert -->
        <div v-if="!profile?.is_active" class="alert alert-danger mb-4 d-flex align-items-center gap-2">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <div>
            <strong>Account Inactive:</strong>
            Your profile is currently inactive. You will not be able to apply for drives until activated by Admin.
          </div>
        </div>

        <div class="row g-4">
          <!-- Profile Form -->
          <div class="col-lg-8">
            <div class="pp-card">
              <div class="pp-card-header">
                <h5><i class="bi bi-person me-2"></i>My Profile</h5>
                <span class="status-badge" :class="profile?.is_active ? 'badge-approved' : 'badge-rejected'">
                  {{ profile?.is_active ? 'Active' : 'Inactive' }}
                </span>
              </div>
              <div class="pp-card-body">
                <form @submit.prevent="saveProfile">
                  <div class="row g-3">
                    <div class="col-md-6">
                      <label class="pp-form-label">First Name *</label>
                      <input v-model="form.first_name" type="text" class="pp-form-control" required>
                    </div>
                    <div class="col-md-6">
                      <label class="pp-form-label">Last Name *</label>
                      <input v-model="form.last_name" type="text" class="pp-form-control" required>
                    </div>
                    <div class="col-md-6">
                      <label class="pp-form-label">Email <small class="text-muted">(Read-only)</small></label>
                      <input type="email" class="pp-form-control bg-light" :value="profile?.user?.email" readonly>
                    </div>
                    <div class="col-md-6">
                      <label class="pp-form-label">Phone</label>
                      <input v-model="form.phone" type="tel" class="pp-form-control">
                    </div>

                    <div class="col-12 mt-4">
                      <h6 class="fw-700 border-bottom pb-2">Academic Details</h6>
                    </div>
                    <div class="col-md-6">
                      <label class="pp-form-label">Roll Number</label>
                      <input v-model="form.roll_number" type="text" class="pp-form-control">
                    </div>
                    <div class="col-md-6">
                      <label class="pp-form-label">Branch</label>
                      <select v-model="form.branch" class="pp-form-control">
                        <option value="">Select Branch</option>
                        <option v-for="b in branches" :key="b" :value="b">{{ b }}</option>
                      </select>
                    </div>
                    <div class="col-md-6">
                      <label class="pp-form-label">Graduation Year</label>
                      <input v-model="form.graduation_year" type="number" class="pp-form-control" placeholder="e.g. 2025">
                    </div>
                    <div class="col-md-6">
                      <label class="pp-form-label">Current CGPA</label>
                      <input v-model="form.cgpa" type="number" step="0.01" min="0" max="10" class="pp-form-control">
                    </div>
                    <div class="col-md-6">
                      <label class="pp-form-label">10th Percentage</label>
                      <input v-model="form.tenth_percent" type="number" step="0.01" min="0" max="100" class="pp-form-control">
                    </div>
                    <div class="col-md-6">
                      <label class="pp-form-label">12th Percentage</label>
                      <input v-model="form.twelfth_percent" type="number" step="0.01" min="0" max="100" class="pp-form-control">
                    </div>

                    <div class="col-12 mt-4">
                      <h6 class="fw-700 border-bottom pb-2">Additional Information</h6>
                    </div>
                    <div class="col-md-6">
                      <label class="pp-form-label">Date of Birth</label>
                      <input v-model="form.dob" type="date" class="pp-form-control">
                    </div>
                    <div class="col-md-6">
                      <label class="pp-form-label">Gender</label>
                      <select v-model="form.gender" class="pp-form-control">
                        <option value="">Select</option>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div class="col-12">
                      <label class="pp-form-label">Skills</label>
                      <textarea v-model="form.skills" class="pp-form-control" rows="3"
                        placeholder="e.g. Python, Java, React, SQL (comma separated)"></textarea>
                    </div>
                  </div>
                  <div class="mt-4">
                    <button type="submit" class="btn-pp-primary px-5" :disabled="saving">
                      <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                      {{ saving ? 'Saving...' : 'Save Profile' }}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <!-- Academic Summary Card -->
          <div class="col-lg-4">
            <div class="pp-card sticky-top" style="top:90px">
              <div class="pp-card-header"><h5><i class="bi bi-mortarboard me-2"></i>Summary</h5></div>
              <div class="pp-card-body text-center">
                <div style="width:80px;height:80px;border-radius:50%;background:#e0e7ff;color:#3730a3;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:2.5rem;font-weight:800">
                  {{ profile?.first_name?.charAt(0) || 'S' }}
                </div>
                <h5 class="fw-700">{{ profile?.first_name }} {{ profile?.last_name }}</h5>
                <p class="text-muted small mb-4">{{ profile?.branch }} • {{ profile?.graduation_year }}</p>

                <div class="row g-2 mb-3">
                  <div class="col-4">
                    <div class="p-2 bg-light rounded border">
                      <div class="small text-muted mb-1">CGPA</div>
                      <div class="fw-700 text-primary">{{ profile?.cgpa || '—' }}</div>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="p-2 bg-light rounded border">
                      <div class="small text-muted mb-1">10th %</div>
                      <div class="fw-700 text-primary">{{ profile?.tenth_percent || '—' }}</div>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="p-2 bg-light rounded border">
                      <div class="small text-muted mb-1">12th %</div>
                      <div class="fw-700 text-primary">{{ profile?.twelfth_percent || '—' }}</div>
                    </div>
                  </div>
                </div>

                <div class="text-start small text-muted">
                  <div class="mb-2"><i class="bi bi-hash me-2"></i>{{ profile?.roll_number || 'No Roll Number' }}</div>
                  <div class="mb-2"><i class="bi bi-envelope me-2"></i>{{ profile?.user?.email }}</div>
                  <div v-if="profile?.phone"><i class="bi bi-telephone me-2"></i>{{ profile.phone }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}
