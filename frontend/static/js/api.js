// static/js/api.js — Axios instance + all API wrapper functions

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

// Attach JWT automatically on every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('access_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// On 401, clear auth and redirect home (unless it's the login call)
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && err.config?.url !== '/login') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.hash = '/'
    }
    return Promise.reject(err)
  }
)

// ── Auth ─────────────────────────────────────────────────────────────────────
const authRegister   = d  => api.post('/register', d)
const authLogin      = d  => api.post('/login', d)
const authRefresh    = () => api.post('/refresh')
const authMe         = () => api.get('/me')
const authLogout     = () => api.post('/logout')

// ── Admin ─────────────────────────────────────────────────────────────────────
const adminDashboard      = ()       => api.get('/admin/dashboard')
const adminAnalytics      = ()       => api.get('/admin/analytics')
const adminSearch         = (q, t)   => api.get('/admin/search', { params: { q, type: t } })

const adminCompanies      = p        => api.get('/admin/companies', { params: p })
const adminGetCompany     = id       => api.get(`/admin/companies/${id}`)
const adminUpdateCompany  = (id, d)  => api.put(`/admin/companies/${id}`, d)
const adminDeleteCompany  = id       => api.delete(`/admin/companies/${id}`)

const adminStudents       = p        => api.get('/admin/students', { params: p })
const adminGetStudent     = id       => api.get(`/admin/students/${id}`)
const adminUpdateStudent  = (id, d)  => api.put(`/admin/students/${id}`, d)
const adminDeleteStudent  = id       => api.delete(`/admin/students/${id}`)

const adminDrives         = p        => api.get('/admin/drives', { params: p })
const adminGetDrive       = id       => api.get(`/admin/drives/${id}`)
const adminUpdateDrive    = (id, d)  => api.put(`/admin/drives/${id}`, d)

const adminApplications   = p        => api.get('/admin/applications', { params: p })

const adminTriggerReminders    = () => api.post('/admin/tasks/reminders')
const adminTriggerMonthlyReport= () => api.post('/admin/tasks/monthly-report')
const adminTaskStatus          = id => api.get(`/admin/tasks/status/${id}`)
const adminClearCache          = () => api.post('/admin/cache/clear')

// ── Company ───────────────────────────────────────────────────────────────────
const companyDashboard    = ()       => api.get('/company/dashboard')
const companyProfile      = ()       => api.get('/company/profile')
const companyUpdateProfile= d        => api.put('/company/profile', d)

const companyDrives       = p        => api.get('/company/drives', { params: p })
const companyCreateDrive  = d        => api.post('/company/drives', d)
const companyGetDrive     = id       => api.get(`/company/drives/${id}`)
const companyUpdateDrive  = (id, d)  => api.put(`/company/drives/${id}`, d)

const companyApplications = (driveId, p) => api.get(`/company/drives/${driveId}/applications`, { params: p })
const companyUpdateApp    = (driveId, appId, d) => api.put(`/company/drives/${driveId}/applications/${appId}`, d)

// ── Student ───────────────────────────────────────────────────────────────────
const studentDashboard    = ()       => api.get('/student/dashboard')
const studentProfile      = ()       => api.get('/student/profile')
const studentUpdateProfile= d        => api.put('/student/profile', d)

const studentDrives       = p        => api.get('/student/drives', { params: p })
const studentGetDrive     = id       => api.get(`/student/drives/${id}`)
const studentApply        = (id, d)  => api.post(`/student/drives/${id}/apply`, d)

const studentApplications = p        => api.get('/student/applications', { params: p })
const studentGetApp       = id       => api.get(`/student/applications/${id}`)
const studentWithdrawApp  = id       => api.delete(`/student/applications/${id}`)
const studentExportApps   = ()       => api.post('/student/applications/export')
