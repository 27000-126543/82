<template>
  <div class="page-container" ref="reportContent">
    <div class="page-header">
      <div class="page-title">综合统计报表</div>
      <div class="header-actions">
        <el-radio-group v-model="period" size="large" style="margin-right: 12px">
          <el-radio-button label="本月"></el-radio-button>
          <el-radio-button label="上月"></el-radio-button>
          <el-radio-button label="本季度"></el-radio-button>
          <el-radio-button label="自定义"></el-radio-button>
        </el-radio-group>
        <el-date-picker
          v-if="period === '自定义'"
          v-model="customRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          size="large"
          style="margin-right: 12px; width: 280px"
        />
        <el-button type="primary" @click="handleExport" :loading="exporting">
          <el-icon><Download /></el-icon>
          导出PDF月度报告
        </el-button>
      </div>
    </div>

    <el-row :gutter="16" class="stats-row">
      <el-col :span="4.8">
        <div class="stat-card blue">
          <div class="stat-label">总租金收入</div>
          <div class="stat-value">¥{{ formatNumber(reportData.overall.totalRent) }}</div>
          <div class="stat-footer">
            <el-icon><Money /></el-icon>
            元
          </div>
        </div>
      </el-col>
      <el-col :span="4.8">
        <div class="stat-card orange">
          <div class="stat-label">总客流量</div>
          <div class="stat-value">{{ formatNumber(reportData.overall.totalPassengerFlow) }}</div>
          <div class="stat-footer">
            <el-icon><User /></el-icon>
            人次
          </div>
        </div>
      </el-col>
      <el-col :span="4.8">
        <div class="stat-card green">
          <div class="stat-label">平均坪效</div>
          <div class="stat-value">{{ reportData.overall.avgEfficiency.toFixed(2) }}</div>
          <div class="stat-footer">
            <el-icon><TrendCharts /></el-icon>
            元/㎡
          </div>
        </div>
      </el-col>
      <el-col :span="4.8">
        <div class="stat-card purple">
          <div class="stat-label">总能耗</div>
          <div class="stat-value">{{ formatNumber(Math.round(reportData.overall.totalEnergy)) }}</div>
          <div class="stat-footer">
            <el-icon><Lightning /></el-icon>
            kWh
          </div>
        </div>
      </el-col>
      <el-col :span="4.8">
        <div class="stat-card red">
          <div class="stat-label">维修及时率</div>
          <div class="stat-value">{{ (reportData.overall.maintenanceRate * 100).toFixed(1) }}%</div>
          <div class="stat-footer">
            <el-icon><Tools /></el-icon>
            及时完成
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="12">
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title">租金收入趋势</div>
          </div>
          <div ref="rentTrendRef" class="chart-container"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title">客流密度趋势</div>
          </div>
          <div ref="flowDensityRef" class="chart-container"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="24">
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title">各楼层坪效对比</div>
          </div>
          <div ref="floorEfficiencyRef" class="chart-container"></div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useMallStore } from '@/stores/mall'
import { ElMessage } from 'element-plus'
import { Download, Money, User, TrendCharts, Lightning, Tools } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { ReportData } from '@/types'

const mallStore = useMallStore()

const period = ref('本月')
const customRange = ref<[Date, Date] | null>(null)
const exporting = ref(false)
const reportContent = ref<HTMLElement | null>(null)

const rentTrendRef = ref<HTMLElement | null>(null)
const flowDensityRef = ref<HTMLElement | null>(null)
const floorEfficiencyRef = ref<HTMLElement | null>(null)

let rentChart: echarts.ECharts | null = null
let flowChart: echarts.ECharts | null = null
let floorChart: echarts.ECharts | null = null

const reportData = computed<ReportData>(() => mallStore.getReportData(period.value))

const formatNumber = (num: number) => {
  return num.toLocaleString('zh-CN')
}

const handleResize = () => {
  rentChart?.resize()
  flowChart?.resize()
  floorChart?.resize()
}

const initRentTrendChart = () => {
  if (!rentTrendRef.value) return
  if (!rentChart) {
    rentChart = echarts.init(rentTrendRef.value)
  }

  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const data = months.map(() => Math.floor(Math.random() * 500000) + 2000000)

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
      data: months,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#64748b', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLabel: {
        color: '#64748b',
        fontSize: 11,
        formatter: (value: number) => {
          if (value >= 10000) {
            return value / 10000 + '万'
          }
          return value.toString()
        }
      }
    },
    series: [{
      name: '租金收入',
      type: 'line',
      smooth: true,
      data,
      itemStyle: { color: '#3b82f6' },
      lineStyle: { width: 3 },
      areaStyle: {
        opacity: 0.15,
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(59, 130, 246, 0.4)' },
          { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
        ])
      },
      symbol: 'circle',
      symbolSize: 8
    }]
  }

  rentChart.setOption(option)
}

const initFlowDensityChart = () => {
  if (!flowDensityRef.value) return
  if (!flowChart) {
    flowChart = echarts.init(flowDensityRef.value)
  }

  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const data = months.map(() => Math.floor(Math.random() * 30000) + 40000)

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#1e293b' }
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
    series: [{
      name: '客流密度',
      type: 'line',
      smooth: true,
      data,
      itemStyle: { color: '#10b981' },
      lineStyle: { width: 3 },
      areaStyle: {
        opacity: 0.15,
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(16, 185, 129, 0.4)' },
          { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
        ])
      },
      symbol: 'circle',
      symbolSize: 8
    }]
  }

  flowChart.setOption(option)
}

const initFloorEfficiencyChart = () => {
  if (!floorEfficiencyRef.value) return
  if (!floorChart) {
    floorChart = echarts.init(floorEfficiencyRef.value)
  }

  const floorNames: Record<number, string> = {
    '-1': 'B1层',
    '1': '1层',
    '2': '2层',
    '3': '3层',
    '4': '4层',
    '5': '5层'
  }

  const floors = reportData.value.floors.map(f => floorNames[f.floor])
  const data = reportData.value.floors.map(f => f.avgEfficiency)

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
          <div style="color: #8b5cf6;">坪效：${data.value.toFixed(2)} 元/㎡</div>
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
      axisLabel: { color: '#64748b', fontSize: 11 }
    },
    series: [{
      name: '坪效',
      type: 'bar',
      data,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#8b5cf6' },
          { offset: 1, color: '#a78bfa' }
        ]),
        borderRadius: [6, 6, 0, 0]
      },
      barWidth: '40%',
      label: {
        show: true,
        position: 'top',
        formatter: '{c}',
        color: '#1e293b',
        fontSize: 12,
        fontWeight: 600
      }
    }]
  }

  floorChart.setOption(option)
}

const handleExport = async () => {
  if (!reportContent.value) return

  exporting.value = true
  try {
    const canvas = await html2canvas(reportContent.value, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
    const x = (pdfWidth - imgWidth * ratio) / 2
    const y = (pdfHeight - imgHeight * ratio) / 2

    pdf.addImage(imgData, 'PNG', x, y, imgWidth * ratio, imgHeight * ratio)
    pdf.save(`综合统计报表_${new Date().toLocaleDateString('zh-CN')}.pdf`)

    ElMessage.success('PDF导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('PDF导出失败，请重试')
  } finally {
    exporting.value = false
  }
}

watch(period, () => {
  initFloorEfficiencyChart()
})

onMounted(() => {
  initRentTrendChart()
  initFlowDensityChart()
  initFloorEfficiencyChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  rentChart?.dispose()
  flowChart?.dispose()
  floorChart?.dispose()
})
</script>

<style lang="scss" scoped>
.stats-row {
  margin-bottom: 16px;
}

.header-actions {
  display: flex;
  align-items: center;
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
  }
}
</style>
