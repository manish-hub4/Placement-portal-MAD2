// static/js/components/StatCard.js
const StatCard = {
  props: {
    value:   { type: [Number, String], default: 0 },
    label:   { type: String, required: true },
    icon:    { type: String, default: 'bi-bar-chart' },
    color:   { type: String, default: '#1e40af' },
    bgColor: { type: String, default: '#dbeafe' },
  },
  template: `
    <div class="pp-stat-card">
      <div class="pp-stat-icon" :style="{ background: bgColor, color: color }">
        <i class="bi" :class="icon"></i>
      </div>
      <div>
        <div class="pp-stat-value">{{ value }}</div>
        <div class="pp-stat-label">{{ label }}</div>
      </div>
    </div>
  `
}
