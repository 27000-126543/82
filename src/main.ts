import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart, PieChart, HeatmapChart, GaugeChart } from 'echarts/charts'
import {
  TitleComponent, TooltipComponent, LegendComponent, GridComponent,
  VisualMapComponent, DataZoomComponent
} from 'echarts/components'

import App from './App.vue'
import router from './router'
import './styles/index.scss'

use([
  CanvasRenderer,
  BarChart, LineChart, PieChart, HeatmapChart, GaugeChart,
  TitleComponent, TooltipComponent, LegendComponent, GridComponent,
  VisualMapComponent, DataZoomComponent
])

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.component('VChart', VChart)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

app.mount('#app')
