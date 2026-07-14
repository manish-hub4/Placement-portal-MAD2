// static/js/views/AuthView.js
const AuthView = {
  setup() {
    const { ref, reactive, computed } = Vue
    const router = VueRouter.useRouter()
    const route  = VueRouter.useRoute()
    const toast  = Vue.inject('toast')

    const mode = ref('login')  // 'login' | 'register-student' | 'register-company'
    const loading = ref(false)
    const error   = ref('')

    const loginForm = reactive({ username: '', password: '' })
    const studentForm = reactive({
      username: '', email: '', password: '', confirm_password: '',
      first_name: '', last_name: '', phone: '', roll_number: '',
      branch: '', cgpa: '', graduation_year: new Date().getFullYear() + 1
    })
    const companyForm = reactive({
      username: '', email: '', password: '', confirm_password: '',
      company_name: '', industry: '', website: '', hr_name: '', hr_phone: ''
    })

    const branches = ['CSE','IT','ECE','EEE','ME','CE','CH','BT','MBA','MCA','Other']

    async function handleLogin() {
      error.value = ''
      if (!loginForm.username || !loginForm.password) {
        error.value = 'Username and password are required'; return
      }
      loading.value = true
      const res = await auth.login({ username: loginForm.username, password: loginForm.password })
      loading.value = false
      if (res.ok) {
        toast.success('Welcome back!', `Logged in as ${auth.user.username}`)
        const dest = route.query.redirect || { admin: '/admin', company: '/company', student: '/student' }[auth.role] || '/'
        router.push(dest)
      } else {
        error.value = res.message
      }
    }

    async function handleStudentRegister() {
      error.value = ''
      if (studentForm.password !== studentForm.confirm_password) {
        error.value = 'Passwords do not match'; return
      }
      loading.value = true
      const res = await auth.register({ ...studentForm, role: 'student' })
      loading.value = false
      if (res.ok) {
        toast.success('Registered!', 'Please login with your credentials.')
        mode.value = 'login'
      } else {
        error.value = res.message
      }
    }

    async function handleCompanyRegister() {
      error.value = ''
      if (companyForm.password !== companyForm.confirm_password) {
        error.value = 'Passwords do not match'; return
      }
      loading.value = true
      const res = await auth.register({ ...companyForm, role: 'company' })
      loading.value = false
      if (res.ok) {
        toast.success('Registration submitted!', 'Wait for admin approval before logging in.')
        mode.value = 'login'
      } else {
        error.value = res.message
      }
    }

    return {
      mode, loading, error, loginForm, studentForm, companyForm,
      branches, handleLogin, handleStudentRegister, handleCompanyRegister
    }
  },
  template: `
    <div class="pp-auth-wrapper">
      <div style="width:100%;max-width:520px">
        <div class="text-center mb-4">
          <a href="#/" class="text-decoration-none">
            <span style="color:#93c5fd;font-size:1.5rem;font-weight:800">🎓 Placement Portal</span>
          </a>
        </div>
        <div class="pp-auth-card">
          <!-- Header tabs -->
          <div class="pp-auth-header">
            <h3>{{ mode === 'login' ? 'Welcome Back' : mode === 'register-student' ? 'Student Registration' : 'Company Registration' }}</h3>
            <p>{{ mode === 'login' ? 'Sign in to your account' : 'Create your account to get started' }}</p>
          </div>

          <!-- Mode switcher -->
          <div class="d-flex border-bottom">
            <button @click="mode='login'" class="btn flex-fill rounded-0 py-3 fw-600"
              :class="mode==='login' ? 'btn-primary text-white' : 'btn-white text-muted'">
              <i class="bi bi-box-arrow-in-right me-1"></i> Login
            </button>
            <button @click="mode='register-student'" class="btn flex-fill rounded-0 py-3"
              :class="mode==='register-student' ? 'btn-primary text-white' : 'btn-white text-muted'">
              <i class="bi bi-mortarboard me-1"></i> Student
            </button>
            <button @click="mode='register-company'" class="btn flex-fill rounded-0 py-3"
              :class="mode==='register-company' ? 'btn-primary text-white' : 'btn-white text-muted'">
              <i class="bi bi-building me-1"></i> Company
            </button>
          </div>

          <div class="pp-auth-body">
            <!-- Error -->
            <div v-if="error" class="alert alert-danger py-2 small mb-3">
              <i class="bi bi-exclamation-circle me-1"></i>{{ error }}
            </div>

            <!-- LOGIN FORM -->
            <form v-if="mode==='login'" @submit.prevent="handleLogin">
              <div class="mb-3">
                <label class="pp-form-label">Username</label>
                <input v-model="loginForm.username" type="text" class="pp-form-control" placeholder="Enter username" required>
              </div>
              <div class="mb-4">
                <label class="pp-form-label">Password</label>
                <input v-model="loginForm.password" type="password" class="pp-form-control" placeholder="Enter password" required>
              </div>
              <button type="submit" class="btn-pp-primary w-100 py-3" :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                {{ loading ? 'Signing in...' : 'Sign In' }}
              </button>
              <div class="text-center mt-3">
                <small class="text-muted">Admin: <code>admin / Admin@123</code></small>
              </div>
            </form>

            <!-- STUDENT REGISTER FORM -->
            <form v-if="mode==='register-student'" @submit.prevent="handleStudentRegister">
              <div class="row g-3">
                <div class="col-6">
                  <label class="pp-form-label">First Name *</label>
                  <input v-model="studentForm.first_name" type="text" class="pp-form-control" required>
                </div>
                <div class="col-6">
                  <label class="pp-form-label">Last Name *</label>
                  <input v-model="studentForm.last_name" type="text" class="pp-form-control" required>
                </div>
                <div class="col-6">
                  <label class="pp-form-label">Username *</label>
                  <input v-model="studentForm.username" type="text" class="pp-form-control" required>
                </div>
                <div class="col-6">
                  <label class="pp-form-label">Email *</label>
                  <input v-model="studentForm.email" type="email" class="pp-form-control" required>
                </div>
                <div class="col-6">
                  <label class="pp-form-label">Password *</label>
                  <input v-model="studentForm.password" type="password" class="pp-form-control" required>
                </div>
                <div class="col-6">
                  <label class="pp-form-label">Confirm Password *</label>
                  <input v-model="studentForm.confirm_password" type="password" class="pp-form-control" required>
                </div>
                <div class="col-6">
                  <label class="pp-form-label">Roll Number</label>
                  <input v-model="studentForm.roll_number" type="text" class="pp-form-control">
                </div>
                <div class="col-6">
                  <label class="pp-form-label">Branch</label>
                  <select v-model="studentForm.branch" class="pp-form-control">
                    <option value="">Select Branch</option>
                    <option v-for="b in branches" :key="b" :value="b">{{ b }}</option>
                  </select>
                </div>
                <div class="col-6">
                  <label class="pp-form-label">CGPA</label>
                  <input v-model="studentForm.cgpa" type="number" step="0.01" min="0" max="10" class="pp-form-control">
                </div>
                <div class="col-6">
                  <label class="pp-form-label">Graduation Year</label>
                  <input v-model="studentForm.graduation_year" type="number" class="pp-form-control">
                </div>
              </div>
              <button type="submit" class="btn-pp-primary w-100 py-3 mt-4" :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                {{ loading ? 'Registering...' : 'Register as Student' }}
              </button>
            </form>

            <!-- COMPANY REGISTER FORM -->
            <form v-if="mode==='register-company'" @submit.prevent="handleCompanyRegister">
              <div class="row g-3">
                <div class="col-12">
                  <label class="pp-form-label">Company Name *</label>
                  <input v-model="companyForm.company_name" type="text" class="pp-form-control" required>
                </div>
                <div class="col-6">
                  <label class="pp-form-label">Username *</label>
                  <input v-model="companyForm.username" type="text" class="pp-form-control" required>
                </div>
                <div class="col-6">
                  <label class="pp-form-label">Email *</label>
                  <input v-model="companyForm.email" type="email" class="pp-form-control" required>
                </div>
                <div class="col-6">
                  <label class="pp-form-label">Password *</label>
                  <input v-model="companyForm.password" type="password" class="pp-form-control" required>
                </div>
                <div class="col-6">
                  <label class="pp-form-label">Confirm Password *</label>
                  <input v-model="companyForm.confirm_password" type="password" class="pp-form-control" required>
                </div>
                <div class="col-6">
                  <label class="pp-form-label">Industry</label>
                  <input v-model="companyForm.industry" type="text" class="pp-form-control" placeholder="e.g. IT, Finance">
                </div>
                <div class="col-6">
                  <label class="pp-form-label">Website</label>
                  <input v-model="companyForm.website" type="url" class="pp-form-control" placeholder="https://...">
                </div>
                <div class="col-6">
                  <label class="pp-form-label">HR Name</label>
                  <input v-model="companyForm.hr_name" type="text" class="pp-form-control">
                </div>
                <div class="col-6">
                  <label class="pp-form-label">HR Phone</label>
                  <input v-model="companyForm.hr_phone" type="tel" class="pp-form-control">
                </div>
              </div>
              <div class="alert alert-info py-2 mt-3 small">
                <i class="bi bi-info-circle me-1"></i>Your registration will need admin approval before you can create drives.
              </div>
              <button type="submit" class="btn-pp-primary w-100 py-3 mt-2" :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                {{ loading ? 'Submitting...' : 'Submit Registration' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
}
