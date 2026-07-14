// static/js/views/HomeView.js
const HomeView = {
  setup() {
    const router = VueRouter.useRouter()
    const features = [
      { icon: 'bi-building', title: 'For Companies', desc: 'Register, post placement drives and manage applicants easily.' },
      { icon: 'bi-mortarboard', title: 'For Students', desc: 'Browse drives, apply with one click, and track your applications.' },
      { icon: 'bi-shield-check', title: 'For Admin', desc: 'Approve companies, manage drives and view placement analytics.' },
    ]
    return { features, router }
  },
  template: `
    <div class="pp-hero">
      <div style="position:relative;z-index:1;width:100%">
        <div class="container">
          <div class="pp-hero-badge mb-3">🎓 Institute Placement Portal</div>
          <h1 class="mb-3">Your Gateway to <span>Campus Placements</span></h1>
          <p class="mx-auto">Connect students with top companies. Manage drives, applications, and placements — all in one powerful platform.</p>
          <div class="d-flex gap-3 justify-content-center flex-wrap mb-5">
            <button @click="router.push('/auth')" class="btn btn-light btn-lg fw-bold px-5" style="border-radius:50px">
              <i class="bi bi-rocket-takeoff me-2"></i>Get Started
            </button>
            <button @click="router.push('/auth')" class="btn btn-outline-light btn-lg px-5" style="border-radius:50px">
              <i class="bi bi-box-arrow-in-right me-2"></i>Sign In
            </button>
          </div>

          <div class="row g-4 mt-2">
            <div class="col-md-4" v-for="f in features" :key="f.title">
              <div class="pp-feature-card">
                <i class="bi" :class="f.icon"></i>
                <h5>{{ f.title }}</h5>
                <p>{{ f.desc }}</p>
              </div>
            </div>
          </div>

          <div class="row g-3 mt-5 text-center">
            <div class="col-4">
              <div style="color:#fff;font-size:2rem;font-weight:800">500+</div>
              <div style="color:#94a3b8;font-size:0.8rem">Students Placed</div>
            </div>
            <div class="col-4">
              <div style="color:#fff;font-size:2rem;font-weight:800">100+</div>
              <div style="color:#94a3b8;font-size:0.8rem">Partner Companies</div>
            </div>
            <div class="col-4">
              <div style="color:#fff;font-size:2rem;font-weight:800">50+</div>
              <div style="color:#94a3b8;font-size:0.8rem">Active Drives</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}
