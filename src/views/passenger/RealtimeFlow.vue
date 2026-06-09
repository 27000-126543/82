<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">实时客流统计</div>
      <div class="header-actions">
        <el-tag type="info" effect="light">
          <el-icon><Clock /></el-icon>
          最后更新：{{ lastUpdateTime }}
        </el-tag>
        <el-button type="primary" @click="handleRefresh" style="margin-left: 12px">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <div class="stat-card blue">
          <div class="stat-label">当前客流</div>
          <div class="stat-value">{{ totalCurrentCount }}</div>
          <div class="stat-footer">
            <el-icon><User /></el-icon>
            实时人数
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card orange">
          <div class="stat-label">总容量</div>
          <div class="stat-value">{{ totalCapacity }}</div>
          <div class="stat-footer">
            <el-icon><OfficeBuilding /></el-icon>
            最大承载
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card green">
          <div class="stat-label">整体占比</div>
          <div class="stat-value">{{ overallRatio }}%</div>
          <div class="stat-footer">
            <el-icon><DataLine /></el-icon>
            平均使用率
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card red">
          <div class="stat-label">预警区域</div>
          <div class="stat-value">{{ alertZones.length }}</div>
          <div class="stat-footer">
            <el-icon><Warning /></el-icon>
            超阈值区域
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="floor-filter">
      <span class="filter-label">楼层筛选：</span>
      <el-radio-group v-model="floorFilter" size="large">
        <el-radio-button :label="null">全部</el-radio-button>
        <el-radio-button :label="-1">B1层</el-radio-button>
        <el-radio-button :label="1">1层</el-radio-button>
        <el-radio-button :label="2">2层</el-radio-button>
        <el-radio-button :label="3">3层</el-radio-button>
        <el-radio-button :label="4">4层</el-radio-button>
        <el-radio-button :label="5">5层</el-radio-button>
      </el-radio-group>
    </div>

    <el-row :gutter="16" class="flow-grid">
      <el-col :xs="12" :sm="8" :md="6" :lg="6" v-for="flow in filteredFlows" :key="flow.id">
        <div :class="['flow-gauge', { 'alert-highlight': flow.evacuationAlert }]">
          <div class="gauge-label">{{ flow.zone }}</div>
          <div class="gauge-value">
            {{ flow.currentCount }}
            <span class="gauge-cap">/ {{ flow.capacity }}</span>
          </div>
          <div class="gauge-bar">
            <div
              :class="['gauge-fill', getGaugeFillClass(flow)]"
              :style="{ width: getRatio(flow) + '%' }"
            ></div>
          </div>
          <div class="gauge-info">
            <span>{{ getRatio(flow) }}%</span>
            <span>容量阈值：{{ flow.threshold }}</span>
          </div>
          <div :class="['trend', flow.trend]">
            <el-icon v-if="flow.trend === 'increasing'"><Top /></el-icon>
            <el-icon v-else-if="flow.trend === 'decreasing'"><Bottom /></el-icon>
            <el-icon v-else><Minus /></el-icon>
            {{ getTrendText(flow.trend) }}
          </div>
          <div v-if="flow.evacuationAlert" class="alert-badge">
            <el-icon><Bell /></el-icon>
            客流超限
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="flow-trend-chart">
      <div class="chart-header">
        <div class="chart-title">今日客流趋势</div>
        <div class="chart-legend">
          <span class="legend-item">
            <span class="legend-dot blue"></span>
            1层
          </span>
          <span class="legend-item">
            <span class="legend-dot green"></span>
            2层
          </span>
          <span class="legend-item">
            <span class="legend-dot orange"></span>
            3层
          </span>
          <span class="legend-item">
            <span class="legend-dot red"></span>
            4层
          </span>
          <span class="legend-item">
            <span class="legend-dot purple"></span>
            5层
          </span>
        </div>
      </div>
      <div ref="chartRef" class="chart-container"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useMallStore } from '@/stores/mall'
import { ElMessage } from 'element-plus'
import { Refresh, User, OfficeBuilding, DataLine, Warning, Clock, Top, Bottom, Minus, Bell } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const mallStore = useMallStore()

const floorFilter = ref<number | null>(null)
const lastUpdateTime = ref('')
const chartRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null
let updateTimer: number | null = null

const totalCurrentCount = computed(() =>
  mallStore.passengerFlows.reduce((sum, f) => sum + f.currentCount, 0)
)

const totalCapacity = computed(() =>
  mallStore.passengerFlows.reduce((sum, f) => sum + f.capacity, 0)
)

const overallRatio = computed(() => {
  if (totalCapacity.value === 0) return 0
  return Math.round((totalCurrentCount.value / totalCapacity.value) * 100)
})

const alertZones = computed(() =>
  mallStore.passengerFlows.filter(f => f.evacuationAlert)
)

const filteredFlows = computed(() => {
  if (floorFilter.value === null) {
    return [...mallStore.passengerFlows].sort((a, b) => {
      if (a.evacuationAlert && !b.evacuationAlert) return -1
      if (!a.evacuationAlert && b.evacuationAlert) return 1
      return getRatio(b) - getRatio(a)
    })
  }
  return mallStore.passengerFlows.filter(f => f.floor === floorFilter.value)
})

const getRatio = (flow: any) => {
  if (flow.capacity === 0) return 0
  return Math.round((flow.currentCount / flow.capacity) * 100)
}

const getGaugeFillClass = (flow: any) => {
  const ratio = getRatio(flow)
  if (ratio >= 85) return 'danger'
  if (ratio >= 70) return 'warning'
  return 'normal'
}

const getTrendText = (trend: string) => {
  const map: Record<string, string> = {
    increasing: '上升',
    decreasing: '下降',
    stable: '平稳'
  }
  return map[trend] || trend
}

const updateTime = () => {
  lastUpdateTime.value = new Date().toLocaleString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const handleRefresh = () => {
  mallStore.updatePassengerFlow()
  updateTime()
  ElMessage.success('数据已刷新')
}

const initChart = () => {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)

  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
  const floors = [1, 2, 3, 4, 5]
  const floorNames: Record<number, string> = {
    1: '1层',
    2: '2层',
    3: '3层',
    4: '4层',
    5: '5层'
  }
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  const series = floors.map((floor, idx) => {
    const flowData = mallStore.passengerFlows.find(f => f.floor === floor)
    return {
      name: floorNames[floor],
      type: 'line' as const,
      smooth: true,
      data: flowData?.hourlyData || hours.map(() => Math.floor(Math.random() * 500) + 100),
      itemStyle: { color: colors[idx] },
      lineStyle: { width: 2 },
      areaStyle: {
        opacity: 0.1,
        color: colors[idx]
      }
    }
  })

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
      boundaryGap: false,
      data: hours,
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

  chartInstance.setOption(option)
}

const handleResize = () => {
  chartInstance?.resize()
}

watch(floorFilter, () => {
  initChart()
})

onMounted(() => {
  updateTime()
  initChart()
  window.addEventListener('resize', handleResize)

  updateTimer = window.setInterval(() => {
    mallStore.updatePassengerFlow()
    updateTime()
  }, 5000)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
  if (updateTimer) {
    clearInterval(updateTimer)
  }
})
</script>

<style lang="scss" scoped>
.stats-row {
  margin-bottom: 24px;
}

.header-actions {
  display: flex;
  align-items: center;
}

.floor-filter {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;

  .filter-label {
    font-size: 14px;
    color: #64748b;
    font-weight: 500;
  }
}

.flow-grid {
  margin-bottom: 24px;
}

.flow-gauge {
  margin-bottom: 16px;
  position: relative;

  &.alert-highlight {
    background: #fef2f2;
    border: 2px solid #fca5a5;
    animation: pulse-border 2s infinite;
  }

  .gauge-cap {
    font-size: 14px;
    color: #94a3b8;
    font-weight: 400;
  }

  .alert-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    background: #ef4444;
    color: white;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 4px;
    animation: blink 1s infinite;
  }
}

@keyframes pulse-border {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
  }
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.7; }
}

.flow-trend-chart {
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

          &.blue { background: #3b82f6; }
          &.green { background: #10b981; }
          &.orange { background: #f59e0b; }
          &.red { background: #ef4444; }
          &.purple { background: #8b5cf6; }
        }
      }
    }
  }

  .chart-container {
    width: 100%;
    height: 300px;
  }
}
</style>
