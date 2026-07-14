// static/js/components/LoadingSpinner.js
const LoadingSpinner = {
  props: { text: { type: String, default: 'Loading...' } },
  template: `
    <div class="pp-loader">
      <div class="text-center">
        <div class="pp-spinner mx-auto mb-3"></div>
        <p class="text-muted small">{{ text }}</p>
      </div>
    </div>
  `
}
