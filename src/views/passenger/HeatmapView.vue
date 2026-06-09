<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">客流热力图</div>
      <div class="header-actions">
        <el-select v-model="selectedFloor" placeholder="选择楼层" size="large" style="width: 160px; margin-right: 12px">
          <el-option label="全部楼层" :value="null" />
          <el-option label="B1层" :value="-1" />
          <el-option label="1层" :value="1" />
          <el-option label="2层" :value="2" />
          <el-option label="3层" :value="3" />
          <el-option label="4层" :value="4" />
          <el-option label="5层" :value="5" />
        </el-select>
        <el-button type="primary" @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <div class="stat-card blue">
          <div class="stat-label">今日总客流</div>
          <div class="stat-value">{{ totalDailyFlow.toLocaleString() }}</div>
          <div class="stat-footer">
            <el-icon><User /></el-icon>
            累计人次
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card orange">
          <div class="stat-label">峰值时段</div>
          <div class="stat-value">{{ peakHour }}</div>
          <div class="stat-footer">
            <el-icon><TrendCharts /></el-icon>
            客流最高
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card green">
          <div class="stat-label">热门区域</div>
          <div class="stat-value">{{ hotZone }}</div>
          <div class="stat-footer">
            <el-icon><Location /></el-icon>
            最受欢迎
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card purple">
          <div class="stat-label">平均密度</div>
          <div class="stat-value">{{ avgDensity }}%</div>
          <div class="stat-footer">
            <el-icon><DataAnalysis /></el-icon>
            空间利用
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="heatmap-container">
      <div class="heatmap-header">
        <div class="heatmap-title">{{ selectedFloor ? `${selectedFloor === -1 ? 'B1' : selectedFloor + ''}层` : '全楼层' }} 24小时客流热力图</div>
        <div class="heatmap-legend">
          <span class="legend-label">客流密度：</span>
          <div class="legend-bar">
            <span class="legend-min">低</span>
            <div class="gradient-bar"></div>
            <span class="legend-max">高</span>
          </div>
        </div>
      </div>
      <div ref="heatmapRef" class="heatmap-chart"></div>
    </div>

    <el-row :gutter="16" class="zone-stats">
      <el-col :span="8" v-for="zone in zoneRanking" :key="zone.zone">
        <div :class="['zone-card', { 'alert': zone.evacuationAlert }]">
          <div class="zone-rank">{{ zone.rank }}</div>
          <div class="zone-info">
            <div class="zone-name">{{ zone.zone }}</div>
            <div class="zone-meta">
              <span class="floor-badge">F{{ zone.floor === -1 ? 'B1' : zone.floor }}</span>
              <span class="zone-count">{{ zone.dailyTotal.toLocaleString() }} 人次</span>
            </div>
          </div>
          <div class="zone-heat">
            <div class="heat-bar">
              <div
                class="heat-fill"
                :style="{
                  width: (zone.dailyTotal / maxZoneFlow * 100) + '%',
                  background: getHeatColor(zone.dailyTotal / maxZoneFlow)
                }"
              ></div>
            </div>
            <span class="heat-percent">{{ Math.round(zone.dailyTotal / maxZoneFlow * 100) }}%</span>
          </div>
          <el-tag v-if="zone.evacuationAlert" type="danger" class="zone-alert">
            <el-icon><Warning /></el-icon>
            客流超限
          </el-tag>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useMallStore } from '@/stores/mall'
import { ElMessage } from 'element-plus'
import { Refresh, User, TrendCharts, Location, DataAnalysis, Warning } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const mallStore = useMallStore()

const selectedFloor = ref<number | null>(null)
const heatmapRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const totalDailyFlow = computed(() =>
  mallStore.passengerFlows.reduce((sum, f) => sum + f.dailyTotal, 0)
)

const filteredFlows = computed(() => {
  if (selectedFloor.value === null) {
    return mallStore.passengerFlows
  }
  return mallStore.passengerFlows.filter(f => f.floor === selectedFloor.value)
})

const peakHour = computed(() => {
  const hourlyTotals = Array.from({ length: 24 }, () => 0)
  filteredFlows.value.forEach(f => {
    f.hourlyData.forEach((val, idx) => {
      hourlyTotals[idx] += val
    })
  })
  const maxIdx = hourlyTotals.indexOf(Math.max(...hourlyTotals))
  return `${String(maxIdx).padStart(2, '0')}:00`
})

const hotZone = computed(() => {
  if (filteredFlows.value.length === 0) return '-'
  const hottest = filteredFlows.value.reduce((prev, curr) =>
    curr.dailyTotal > prev.dailyTotal ? curr : prev
  )
  return hottest.zone
})

const avgDensity = computed(() => {
  if (filteredFlows.value.length === 0) return 0
  const ratios = filteredFlows.value.map(f => f.currentCount / f.capacity)
  return Math.round(ratios.reduce((a, b) => a + b, 0) / ratios.length * 100)
})

const zoneRanking = computed(() => {
  return [...filteredFlows.value]
    .sort((a, b) => b.dailyTotal - a.dailyTotal)
    .map((f, idx) => ({
      ...f,
      rank: idx + 1
    }))
})

const maxZoneFlow = computed(() => {
  if (zoneRanking.value.length === 0) return 1
  return zoneRanking.value[0].dailyTotal
})

const getHeatColor = (ratio: number) => {
  if (ratio >= 0.8) return '#ef4444'
  if (ratio >= 0.6) return '#f59e0b'
  if (ratio >= 0.4) return '#eab308'
  if (ratio >= 0.2) return '#84cc16'
  return '#22c55e'
}

const handleRefresh = () => {
  mallStore.updatePassengerFlow()
  initHeatmap()
  ElMessage.success('数据已刷新')
}

const initHeatmap = () => {
  if (!heatmapRef.value) return

  if (!chartInstance) {
    chartInstance = echarts.init(heatmapRef.value)
  }

  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
  const zones = filteredFlows.value.map(f => f.zone)

  const data: number[][] = []
  filteredFlows.value.forEach((flow, yIdx) => {
    flow.hourlyData.forEach((val, xIdx) => {
      data.push([xIdx, yIdx, val])
    })
  })

  const maxVal = Math.max(...data.map(d => d[2]))

  const option: echarts.EChartsOption = {
    tooltip: {
      position: 'top',
      formatter: (params: any) => {
        const hour = hours[params.value[0]]
        const zone = zones[params.value[1]]
        const count = params.value[2]
        return `<div style="padding: 8px;">
          <div style="font-weight: 600; margin-bottom: 4px;">${zone}</div>
          <div style="color: #64748b;">时段：${hour}</div>
          <div style="color: #1e293b; font-weight: 600;">客流：${count} 人次</div>
        </div>`
      }
    },
    grid: {
      left: '120px',
      right: '5%',
      bottom: '15%',
      top: '5%'
    },
    xAxis: {
      type: 'category',
      data: hours,
      splitArea: { show: true },
      axisLabel: {
        rotate: 45,
        fontSize: 10,
        color: '#64748b'
      },
      axisLine: { lineStyle: { color: '#e2e8f0' } }
    },
    yAxis: {
      type: 'category',
      data: zones,
      splitArea: { show: true },
      axisLabel: {
        fontSize: 12,
        color: '#1e293b',
        fontWeight: 500
      },
      axisLine: { lineStyle: { color: '#e2e8f0' } }
    },
    visualMap: {
      min: 0,
      max: maxVal,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      inRange: {
        color: ['#22c55e', '#84cc16', '#eab308', '#f59e0b', '#ef4444']
      },
      textStyle: { color: '#64748b' }
    },
    series: [
      {
        name: '客流',
        type: 'heatmap',
        data,
        label: {
          show: true,
          fontSize: 9,
          color: '#1e293b',
          formatter: (params: any) => {
            const val = params.value[2]
            if (val > maxVal * 0.5) {
              return val
            }
            return ''
          }
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        }
      }
    ]
  }

  chartInstance.setOption(option, true)
}

const handleResize = () => {
  chartInstance?.resize()
}

watch(selectedFloor, () => {
  initHeatmap()
})

onMounted(() => {
  initHeatmap()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
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

.heatmap-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  margin-bottom: 24px;

  .heatmap-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .heatmap-title {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }

    .heatmap-legend {
      display: flex;
      align-items: center;
      gap: 12px;

      .legend-label {
        font-size: 12px;
        color: #64748b;
      }

      .legend-bar {
        display: flex;
        align-items: center;
        gap: 8px;

        .legend-min, .legend-max {
          font-size: 11px;
          color: #64748b;
        }

        .gradient-bar {
          width: 120px;
          height: 12px;
          border-radius: 6px;
          background: linear-gradient(90deg, #22c55e 0%, #84cc16 25%, #eab308 50%, #f59e0b 75%, #ef4444 100%);
        }
      }
    }
  }

  .heatmap-chart {
    width: 100%;
    height: 400px;
  }
}

.zone-stats {
  .zone-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: white;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    margin-bottom: 16px;
    position: relative;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &.alert {
      border-color: #fca5a5;
      background: #fef2f2;
    }

    .zone-rank {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 16px;
      flex-shrink: 0;
    }

    &:nth-child(2) .zone-rank {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    }

    &:nth-child(3) .zone-rank {
      background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%);
    }

    .zone-info {
      flex: 1;
      min-width: 0;

      .zone-name {
        font-weight: 600;
        color: #1e293b;
        font-size: 14px;
        margin-bottom: 4px;
      }

      .zone-meta {
        display: flex;
        align-items: center;
        gap: 8px;

        .floor-badge {
          background: #f1f5f9;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          color: #64748b;
        }

        .zone-count {
          font-size: 12px;
          color: #64748b;
        }
      }
    }

    .zone-heat {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 120px;

      .heat-bar {
        flex: 1;
        height: 8px;
        background: #e2e8f0;
        border-radius: 4px;
        overflow: hidden;

        .heat-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease;
        }
      }

      .heat-percent {
        font-size: 11px;
        color: #64748b;
        width: 36px;
        text-align: right;
      }
    }

    .zone-alert {
      position: absolute;
      top: 8px;
      right: 8px;
      font-size: 10px;
    }
  }
}
</style>
