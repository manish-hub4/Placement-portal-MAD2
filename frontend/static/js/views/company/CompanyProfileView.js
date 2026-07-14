// static/js/views/company/CompanyProfileView.js
const CompanyProfileView = {
  setup() {
    const { ref, reactive, onMounted } = Vue
    const toast   = Vue.inject('toast')
    const loading = ref(true)
    const saving  = ref(false)
    const profile = ref(null)

    const form = reactive({
      company_name:'', industry:'', website:'', hr_name:'',
      hr_email:'', hr_phone:'', description:'', company_size:'', headquarters:''
    })

    async function fetchProfile() {
      loading.value = true
      try {
        const res = await companyProfile()
        profile.value = res.data
        Object.assign(form, {
          company_name:  res.data.company_name  || '',
          industry:      res.data.industry      || '',
          website:       res.data.website       || '',
          hr_name:       res.data.hr_name       || '',
          hr_email:      res.data.hr_email      || '',
          hr_phone:      res.data.hr_phone      || '',
          description:   res.data.description   || '',
          company_size:  res.data.company_size  || '',
          headquarters:  res.data.headquarters  || '',
        })
      } catch { toast.error('Error', 'Failed to load profile') }
      finally { loading.value = false }
    }

    async function saveProfile() {
      saving.value = true
      try {
        const res = await companyUpdateProfile(form)
        profile.value = res.data
        toast.success('Saved', 'Profile updated successfully')
      } catch (e) {
        toast.error('Error', e.response?.data?.error || 'Save failed')
      } finally { saving.value = false }
    }

    onMounted(fetchProfile)
    return { loading, saving, profile, form, saveProfile }
  },
  template: `
    <div>
      <pp-loading v-if="loading" />
      <div v-else>
        <div class="row g-4">
          <!-- Profile Form -->
          <div class="col-lg-8">
            <div class="pp-card">
              <div class="pp-card-header">
                <h5><i class="bi bi-building me-2"></i>Company Profile</h5>
                <span class="status-badge" :class="'badge-' + (profile?.approval_status || 'pending').toLowerCase()">
                  {{ profile?.approval_status }}
                </span>
              </div>
              <div class="pp-card-body">
                <form @submit.prevent="saveProfile">
                  <div class="row g-3">
                    <div class="col-12">
                      <label class="pp-form-label">Company Name *</label>
                      <input v-model="form.company_name" type="text" class="pp-form-control" required>
                    </div>
                    <div class="col-md-6">
                      <label class="pp-form-label">Industry</label>
                      <input v-model="form.industry" type="text" class="pp-form-control" placeholder="e.g. IT, Finance, Manufacturing">
                    </div>
                    <div class="col-md-6">
                      <label class="pp-form-label">Company Size</label>
                      <select v-model="form.company_size" class="pp-form-control">
                        <option value="">Select size</option>
                        <option>1-50</option>
                        <option>51-200</option>
                        <option>201-500</option>
                        <option>500-1000</option>
                        <option>1000+</option>
                      </select>
                    </div>
                    <div class="col-md-6">
                      <label class="pp-form-label">Website</label>
                      <input v-model="form.website" type="url" class="pp-form-control" placeholder="https://...">
                    </div>
                    <div class="col-md-6">
                      <label class="pp-form-label">Headquarters</label>
                      <input v-model="form.headquarters" type="text" class="pp-form-control" placeholder="City, Country">
                    </div>
                    <div class="col-md-4">
                      <label class="pp-form-label">HR Name</label>
                      <input v-model="form.hr_name" type="text" class="pp-form-control">
                    </div>
                    <div class="col-md-4">
                      <label class="pp-form-label">HR Email</label>
                      <input v-model="form.hr_email" type="email" class="pp-form-control">
                    </div>
                    <div class="col-md-4">
                      <label class="pp-form-label">HR Phone</label>
                      <input v-model="form.hr_phone" type="tel" class="pp-form-control">
                    </div>
                    <div class="col-12">
                      <label class="pp-form-label">Company Description</label>
                      <textarea v-model="form.description" class="pp-form-control" rows="4"
                        placeholder="Tell students about your company, culture, and what you do..."></textarea>
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

          <!-- Status Card -->
          <div class="col-lg-4">
            <div class="pp-card">
              <div class="pp-card-header"><h5><i class="bi bi-info-circle me-2"></i>Account Status</h5></div>
              <div class="pp-card-body">
                <div class="text-center mb-4">
                  <div style="width:70px;height:70px;border-radius:50%;background:#dbeafe;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:2rem">
                    🏢
                  </div>
                  <h5 class="fw-700">{{ profile?.company_name }}</h5>
                  <span class="status-badge" :class="'badge-' + (profile?.approval_status || '').toLowerCase()">
                    {{ profile?.approval_status }}
                  </span>
                </div>
                <div v-if="profile?.admin_remarks" class="alert alert-info py-2 small">
                  <strong>Admin Remarks:</strong> {{ profile.admin_remarks }}
                </div>
                <ul class="list-unstyled small text-muted">
                  <li class="mb-2"><i class="bi bi-calendar me-2"></i>Registered: {{ profile?.created_at?.slice(0,10) }}</li>
                  <li class="mb-2"><i class="bi bi-briefcase me-2"></i>Total Drives: {{ profile?.drives_count }}</li>
                  <li v-if="profile?.website"><i class="bi bi-globe me-2"></i><a :href="profile.website" target="_blank">Visit Website</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}
