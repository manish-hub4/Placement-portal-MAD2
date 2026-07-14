// static/js/store.js — Reactive auth store

const auth = Vue.reactive({
  user:    null,
  token:   null,
  loading: false,

  get isLoggedIn() { return !!this.token },
  get role()       { return this.user?.role || null },
  get profile()    { return this.user?.profile || null },

  async restore() {
    const token = localStorage.getItem('access_token')
    const user  = localStorage.getItem('user')
    if (token && user) {
      this.token = token
      this.user  = JSON.parse(user)
      try {
        const res = await authMe()
        this.user = res.data.user || res.data
        localStorage.setItem('user', JSON.stringify(this.user))
      } catch {
        this.clear()
      }
    }
  },

  async login(credentials) {
    this.loading = true
    try {
      const res = await authLogin(credentials)
      this.token = res.data.access_token
      this.user  = res.data.user
      localStorage.setItem('access_token', this.token)
      localStorage.setItem('user', JSON.stringify(this.user))
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.response?.data?.error || 'Login failed' }
    } finally {
      this.loading = false
    }
  },

  async register(data) {
    this.loading = true
    try {
      const res = await authRegister(data)
      return { ok: true, message: res.data.message }
    } catch (err) {
      return { ok: false, message: err.response?.data?.error || 'Registration failed' }
    } finally {
      this.loading = false
    }
  },

  async logout() {
    try { await authLogout() } catch {}
    this.clear()
  },

  clear() {
    this.user  = null
    this.token = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
  }
})
