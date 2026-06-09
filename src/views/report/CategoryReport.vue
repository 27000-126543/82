<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">业态分析报表</div>
      <div class="header-actions">
        <el-button type="primary" @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <div class="table-card">
      <div class="card-header">
        <div class="card-title">各业态数据对比</div>
      </div>
      <el-table :data="categoryData" border stripe style="width: 100%">
        <el-table-column prop="category" label="业态" width="150" align="center">
          <template #default="scope">
            <div class="category-cell">
              <span :class="['category-dot', getCategoryColor(scope.row.category)]"></span>
              {{ scope.row.category }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="shopCount" label="店铺数" width="120" align="center">
          <template #default="scope">
            <el-tag type="primary" effect="light">{{ scope.row.shopCount }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalRent" label="租金收入(元)" align="center">
          <template #default="scope">
            <span class="rent-highlight">¥{{ formatNumber(scope.row.totalRent) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="passengerFlow" label="客流(人次)" align="center">
          <template #default="scope">
            {{ formatNumber(scope.row.passengerFlow) }}
          </template>
        </el-table-column>
        <el-table-column prop="avgEfficiency" label="坪效(元/㎡)" align="center">
          <template #default="scope">
            <span :class="['efficiency-badge', getEfficiencyClass(scope.row.avgEfficiency)]">
              {{ scope.row.avgEfficiency.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="12">
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title">业态收入占比饼图</div>
          </div>
          <div ref="rentPieRef" class="chart-container"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title">业态坪效对比柱状图</div>
          </div>
          <div ref="efficiencyBarRef" class="chart-container"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="24">
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title">业态客流趋势折线图</div>
            <div class="chart-legend">
              <span v-for="(cat, _idx) in categories" :key="cat" class="legend-item">
                <span :class="['legend-dot', getCategoryColor(cat)]"></span>
                {{ cat }}
              </span>
            </div>
          </div>
          <div ref="flowTrendRef" class="chart-container trend-chart"></div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useMallStore } from '@/stores/mall'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const mallStore = useMallStore()

const rentPieRef = ref<HTMLElement | null>(null)
const efficiencyBarRef = ref<HTMLElement | null>(null)
const flowTrendRef = ref<HTMLElement | null>(null)

let rentPieChart: echarts.ECharts | null = null
let efficiencyBarChart: echarts.ECharts | null = null
let flowTrendChart: echarts.ECharts | null = null

const categoryColors: Record<string, string> = {
  '服装': '#3b82f6',
  '餐饮': '#10b981',
  '数码': '#f59e0b',
  '娱乐': '#ef4444',
  '零售': '#8b5cf6',
  '运动': '#ec4899'
}

const reportData = computed(() => mallStore.getReportData('本月'))

const categoryData = computed(() => reportData.value.categories)

const categories = computed(() => categoryData.value.map(c => c.category))

const formatNumber = (num: number) => num.toLocaleString('zh-CN')

const getCategoryColor = (category: string) => {
  return categoryColors[category] || '#64748b'
}

const getEfficiencyClass = (value: number) => {
  const maxEfficiency = Math.max(...categoryData.value.map(c => c.avgEfficiency))
  const minEfficiency = Math.min(...categoryData.value.map(c => c.avgEfficiency))
  const range = maxEfficiency - minEfficiency
  if (value >= maxEfficiency - range * 0.2) return 'high'
  if (value <= minEfficiency + range * 0.2) return 'low'
  return 'medium'
}

const handleResize = () => {
  rentPieChart?.resize()
  efficiencyBarChart?.resize()
  flowTrendChart?.resize()
}

const handleRefresh = () => {
  initCharts()
  ElMessage.success('数据已刷新')
}

const initRentPieChart = () => {
  if (!rentPieRef.value) return
  if (!rentPieChart) {
    rentPieChart = echarts.init(rentPieRef.value)
  }

  const pieData = categoryData.value.map(c => ({
    name: c.category,
    value: c.totalRent,
    itemStyle: { color: getCategoryColor(c.category) }
  }))

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#1e293b' },
      formatter: (params: any) => `<div style="padding: 4px;">
        <div style="font-weight: 600; margin-bottom: 4px;">${params.name}</div>
        <div>租金收入：¥${params.value.toLocaleString()}</div>
        <div>占比：${params.percent}%</div>
      </div>`
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: '#64748b', fontSize: 12 }
    },
    series: [{
      name: '业态收入',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['40%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        position: 'outside',
        formatter: '{b}\n{d}%',
        color: '#64748b',
        fontSize: 11
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold'
        },
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.2)'
        }
      },
      data: pieData
    }]
  }

  rentPieChart.setOption(option)
}

const initEfficiencyBarChart = () => {
  if (!efficiencyBarRef.value) return
  if (!efficiencyBarChart) {
    efficiencyBarChart = echarts.init(efficiencyBarRef.value)
  }

  const categoriesList = categoryData.value.map(c => c.category)
  const efficiencyData = categoryData.value.map(c => c.avgEfficiency)
  const colors = categoryData.value.map(c => getCategoryColor(c.category))

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#1e293b' },
      formatter: (params: any) => {
        const data = params[0]
        return `<div style="padding: 4px;">
          <div style="font-weight: 600; margin-bottom: 4px;">${data.name}</div>
          <div style="color: ${data.color};">坪效：${data.value.toFixed(2)} 元/㎡</div>
        </div>`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: categoriesList,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#64748b', fontSize: 12 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLabel: { color: '#64748b', fontSize: 11 }
    },
    series: [{
      name: '坪效',
      type: 'bar',
      data: efficiencyData.map((val, idx) => ({
        value: val,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: colors[idx] },
            { offset: 1, color: colors[idx] + '80' }
          ]),
          borderRadius: [6, 6, 0, 0]
        }
      })),
      barWidth: '50%',
      label: {
        show: true,
        position: 'top',
        formatter: '{c}',
        color: '#1e293b',
        fontSize: 11,
        fontWeight: 600
      }
    }]
  }

  efficiencyBarChart.setOption(option)
}

const initFlowTrendChart = () => {
  if (!flowTrendRef.value) return
  if (!flowTrendChart) {
    flowTrendChart = echarts.init(flowTrendRef.value)
  }

  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

  const series = categoryData.value.map(cat => ({
    name: cat.category,
    type: 'line' as const,
    smooth: true,
    data: months.map(() => Math.floor(Math.random() * 5000) + cat.passengerFlow * 0.8),
    itemStyle: { color: getCategoryColor(cat.category) },
    lineStyle: { width: 2 },
    symbol: 'circle',
    symbolSize: 6
  }))

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#1e293b' }
    },
    legend: {
      show: false
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '5%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: months,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#64748b', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLabel: { color: '#64748b', fontSize: 11 }
    },
    series
  }

  flowTrendChart.setOption(option)
}

const initCharts = () => {
  initRentPieChart()
  initEfficiencyBarChart()
  initFlowTrendChart()
}

watch(() => reportData.value.categories, () => {
  initCharts()
}, { deep: true })

onMounted(() => {
  initCharts()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  rentPieChart?.dispose()
  efficiencyBarChart?.dispose()
  flowTrendChart?.dispose()
})
</script>

<style lang="scss" scoped>
.header-actions {
  display: flex;
  align-items: center;
}

.table-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e2e8f0;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }
  }
}

.category-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  .category-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }
}

.rent-highlight {
  color: #3b82f6;
  font-weight: 600;
}

.efficiency-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;

  &.high {
    background: #dcfce7;
    color: #166534;
  }

  &.medium {
    background: #fef3c7;
    color: #92400e;
  }

  &.low {
    background: #fee2e2;
    color: #991b1b;
  }
}

.chart-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e2e8f0;

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .chart-title {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }

    .chart-legend {
      display: flex;
      gap: 16px;

      .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #64748b;

        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
      }
    }
  }

  .chart-container {
    width: 100%;
    height: 300px;

    &.trend-chart {
      height: 350px;
    }
  }
}
</style>
