<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">楼层分析报表</div>
      <div class="header-actions">
        <el-button type="primary" @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <div class="table-card">
      <div class="card-header">
        <div class="card-title">各楼层数据对比</div>
      </div>
      <el-table :data="tableData" border stripe style="width: 100%">
        <el-table-column prop="floorName" label="楼层" width="120" align="center" />
        <el-table-column prop="totalRent" label="租金收入(元)" align="center">
          <template #default="scope">
            <span class="highlight">¥{{ formatNumber(scope.row.totalRent) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="passengerFlow" label="客流(人次)" align="center">
          <template #default="scope">
            {{ formatNumber(scope.row.passengerFlow) }}
          </template>
        </el-table-column>
        <el-table-column prop="avgEfficiency" label="坪效(元/㎡)" align="center">
          <template #default="scope">
            <span :class="['efficiency-tag', getEfficiencyClass(scope.row.avgEfficiency)]">
              {{ scope.row.avgEfficiency.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="energyConsumption" label="能耗(kWh)" align="center">
          <template #default="scope">
            {{ Math.round(scope.row.energyConsumption).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="maintenanceRate" label="维修及时率" align="center">
          <template #default="scope">
            <el-progress
              :percentage="Math.round(scope.row.maintenanceRate * 100)"
              :color="getProgressColor(scope.row.maintenanceRate)"
              :stroke-width="12"
            />
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="12">
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title">楼层收入柱状图</div>
          </div>
          <div ref="rentBarRef" class="chart-container"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title">楼层客流饼图</div>
          </div>
          <div ref="flowPieRef" class="chart-container"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="24">
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title">楼层坪效雷达图</div>
          </div>
          <div ref="efficiencyRadarRef" class="chart-container radar-chart"></div>
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

const rentBarRef = ref<HTMLElement | null>(null)
const flowPieRef = ref<HTMLElement | null>(null)
const efficiencyRadarRef = ref<HTMLElement | null>(null)

let rentBarChart: echarts.ECharts | null = null
let flowPieChart: echarts.ECharts | null = null
let efficiencyRadarChart: echarts.ECharts | null = null

const floorNames: Record<number, string> = {
  '-1': 'B1层',
  '1': '1层',
  '2': '2层',
  '3': '3层',
  '4': '4层',
  '5': '5层'
}

const reportData = computed(() => mallStore.getReportData('本月'))

const tableData = computed(() =>
  reportData.value.floors.map(f => ({
    ...f,
    floorName: floorNames[f.floor]
  }))
)

const formatNumber = (num: number) => num.toLocaleString('zh-CN')

const getEfficiencyClass = (value: number) => {
  const maxEfficiency = Math.max(...reportData.value.floors.map(f => f.avgEfficiency))
  const minEfficiency = Math.min(...reportData.value.floors.map(f => f.avgEfficiency))
  const range = maxEfficiency - minEfficiency
  if (value >= maxEfficiency - range * 0.2) return 'high'
  if (value <= minEfficiency + range * 0.2) return 'low'
  return 'medium'
}

const getProgressColor = (rate: number) => {
  const percentage = rate * 100
  if (percentage >= 95) return '#10b981'
  if (percentage >= 85) return '#f59e0b'
  return '#ef4444'
}

const handleResize = () => {
  rentBarChart?.resize()
  flowPieChart?.resize()
  efficiencyRadarChart?.resize()
}

const handleRefresh = () => {
  initCharts()
  ElMessage.success('数据已刷新')
}

const initRentBarChart = () => {
  if (!rentBarRef.value) return
  if (!rentBarChart) {
    rentBarChart = echarts.init(rentBarRef.value)
  }

  const floors = tableData.value.map(f => f.floorName)
  const rentData = tableData.value.map(f => f.totalRent)

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
          <div style="color: #3b82f6;">租金收入：¥${data.value.toLocaleString()}</div>
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
      data: floors,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#64748b', fontSize: 12 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLabel: {
        color: '#64748b',
        fontSize: 11,
        formatter: (value: number) => {
          if (value >= 10000) return value / 10000 + '万'
          return value.toString()
        }
      }
    },
    series: [{
      name: '租金收入',
      type: 'bar',
      data: rentData,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#3b82f6' },
          { offset: 1, color: '#60a5fa' }
        ]),
        borderRadius: [6, 6, 0, 0]
      },
      barWidth: '50%',
      label: {
        show: true,
        position: 'top',
        formatter: (params: any) => {
          if (params.value >= 10000) return (params.value / 10000).toFixed(1) + '万'
          return params.value
        },
        color: '#1e293b',
        fontSize: 11,
        fontWeight: 600
      }
    }]
  }

  rentBarChart.setOption(option)
}

const initFlowPieChart = () => {
  if (!flowPieRef.value) return
  if (!flowPieChart) {
    flowPieChart = echarts.init(flowPieRef.value)
  }

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
  const pieData = tableData.value.map((f, idx) => ({
    name: f.floorName,
    value: f.passengerFlow,
    itemStyle: { color: colors[idx % colors.length] }
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
        <div>客流：${params.value.toLocaleString()} 人次</div>
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
      name: '楼层客流',
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['40%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        position: 'inside',
        formatter: '{d}%',
        color: '#fff',
        fontSize: 12,
        fontWeight: 600
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold'
        }
      },
      data: pieData
    }]
  }

  flowPieChart.setOption(option)
}

const initEfficiencyRadarChart = () => {
  if (!efficiencyRadarRef.value) return
  if (!efficiencyRadarChart) {
    efficiencyRadarChart = echarts.init(efficiencyRadarRef.value)
  }

  const floors = tableData.value.map(f => f.floorName)
  const maxEfficiency = Math.max(...tableData.value.map(f => f.avgEfficiency)) * 1.2

  const option: echarts.EChartsOption = {
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#1e293b' },
      formatter: (params: any) => {
        let html = `<div style="padding: 4px;"><div style="font-weight: 600; margin-bottom: 8px;">楼层坪效对比</div>`
        params.data.value.forEach((val: number, idx: number) => {
          html += `<div style="margin-bottom: 4px;">${floors[idx]}：${val.toFixed(2)} 元/㎡</div>`
        })
        html += `</div>`
        return html
      }
    },
    legend: {
      data: ['坪效'],
      bottom: '5%',
      textStyle: { color: '#64748b' }
    },
    radar: {
      indicator: floors.map(f => ({ name: f, max: maxEfficiency })),
      shape: 'polygon',
      splitNumber: 4,
      axisName: {
        color: '#64748b',
        fontSize: 12
      },
      splitLine: {
        lineStyle: { color: '#e2e8f0' }
      },
      splitArea: {
        show: true,
        areaStyle: { color: ['rgba(59, 130, 246, 0.05)', 'rgba(59, 130, 246, 0.1)'] }
      },
      axisLine: {
        lineStyle: { color: '#cbd5e1' }
      }
    },
    series: [{
      name: '坪效',
      type: 'radar',
      data: [{
        value: tableData.value.map(f => f.avgEfficiency),
        name: '坪效',
        areaStyle: {
          color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
            { offset: 0, color: 'rgba(139, 92, 246, 0.3)' },
            { offset: 1, color: 'rgba(139, 92, 246, 0.1)' }
          ])
        },
        lineStyle: { color: '#8b5cf6', width: 2 },
        itemStyle: { color: '#8b5cf6' }
      }]
    }]
  }

  efficiencyRadarChart.setOption(option)
}

const initCharts = () => {
  initRentBarChart()
  initFlowPieChart()
  initEfficiencyRadarChart()
}

watch(() => reportData.value.floors, () => {
  initCharts()
}, { deep: true })

onMounted(() => {
  initCharts()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  rentBarChart?.dispose()
  flowPieChart?.dispose()
  efficiencyRadarChart?.dispose()
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

.highlight {
  color: #3b82f6;
  font-weight: 600;
}

.efficiency-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
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
  }

  .chart-container {
    width: 100%;
    height: 300px;

    &.radar-chart {
      height: 400px;
    }
  }
}
</style>
