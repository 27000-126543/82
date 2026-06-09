<template>
  <div class="dashboard">
    <div class="stats-grid">
      <div class="stat-card blue">
        <div class="stat-label">今日总客流</div>
        <div class="stat-value">{{ totalPassengerFlow.toLocaleString() }}</div>
        <div class="stat-footer">
          <el-icon><TrendCharts /></el-icon>
          较昨日 {{ passengerFlowTrend > 0 ? '+' : '' }}{{ passengerFlowTrend }}%
        </div>
      </div>
      <div class="stat-card green">
        <div class="stat-label">今日租金收入</div>
        <div class="stat-value">¥{{ todayRent.toLocaleString() }}</div>
        <div class="stat-footer">
          <el-icon><Money /></el-icon>
          本月累计 ¥{{ monthRent.toLocaleString() }}
        </div>
      </div>
      <div class="stat-card orange">
        <div class="stat-label">设备在线率</div>
        <div class="stat-value">{{ equipmentOnlineRate }}%</div>
        <div class="stat-footer">
          <el-icon><Cpu /></el-icon>
          {{ onlineEquipments }}/{{ totalEquipments }} 台在线
        </div>
      </div>
      <div class="stat-card red">
        <div class="stat-label">车位使用率</div>
        <div class="stat-value">{{ parkingUsageRate }}%</div>
        <div class="stat-footer">
          <el-icon><Van /></el-icon>
          {{ occupiedSpaces }}/{{ totalSpaces }} 个已占用
        </div>
      </div>
      <div class="stat-card purple">
        <div class="stat-label">保洁完成率</div>
        <div class="stat-value">{{ cleaningCompletionRate }}%</div>
        <div class="stat-footer">
          <el-icon><Brush /></el-icon>
          {{ completedSchedules }}/{{ totalSchedules }} 项已完成
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">待审批数量</div>
        <div class="stat-value">{{ pendingApprovals.length }}</div>
        <div class="stat-footer">
          <el-icon><Document /></el-icon>
          含 {{ pendingSwapCount }} 个调班申请
        </div>
      </div>
    </div>

    <div class="charts-row">
      <el-card class="chart-card">
        <template #header>
          <div class="card-title">客流趋势（近7天）</div>
        </template>
        <v-chart :option="flowTrendOption" autoresize />
      </el-card>
      <el-card class="chart-card">
        <template #header>
          <div class="card-title">业态收入分布</div>
        </template>
        <v-chart :option="categoryPieOption" autoresize />
      </el-card>
    </div>

    <div class="charts-row">
      <el-card class="chart-card">
        <template #header>
          <div class="card-title">楼层客流分布</div>
        </template>
        <v-chart :option="floorBarOption" autoresize />
      </el-card>
      <el-card class="chart-card">
        <template #header>
          <div class="card-title">设备状态分布</div>
        </template>
        <v-chart :option="equipmentPieOption" autoresize />
      </el-card>
    </div>

    <div class="bottom-row">
      <el-card class="todo-card">
        <template #header>
          <div class="card-title">
            <el-icon><Warning /></el-icon>
            待办事项
          </div>
        </template>
        <el-tabs v-model="activeTab">
          <el-tab-pane label="续约提醒" name="renewal">
            <div class="todo-list">
              <div v-for="shop in expiringShops" :key="shop.id" class="todo-item">
                <div class="todo-icon warning">
                  <el-icon><Bell /></el-icon>
                </div>
                <div class="todo-content">
                  <div class="todo-title">{{ shop.name }}</div>
                  <div class="todo-desc">合同将于 {{ shop.contractEnd }} 到期</div>
                </div>
                <el-button type="primary" size="small" link>处理</el-button>
              </div>
              <div v-if="expiringShops.length === 0" class="empty">暂无续约提醒</div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="设备故障" name="equipment">
            <div class="todo-list">
              <div v-for="eq in faultEquipments" :key="eq.id" class="todo-item">
                <div class="todo-icon danger">
                  <el-icon><WarningFilled /></el-icon>
                </div>
                <div class="todo-content">
                  <div class="todo-title">{{ eq.name }}</div>
                  <div class="todo-desc">{{ eq.location }} - 故障代码: {{ eq.faultCode || '未知' }}</div>
                </div>
                <el-button type="primary" size="small" link>处理</el-button>
              </div>
              <div v-if="faultEquipments.length === 0" class="empty">暂无设备故障</div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="库存预警" name="stock">
            <div class="todo-list">
              <div v-for="part in lowStockParts" :key="part.id" class="todo-item">
                <div class="todo-icon warning">
                  <el-icon><Box /></el-icon>
                </div>
                <div class="todo-content">
                  <div class="todo-title">{{ part.name }}</div>
                  <div class="todo-desc">当前库存: {{ part.quantity }}{{ part.unit }} / 安全库存: {{ part.safeStock }}{{ part.unit }}</div>
                </div>
                <el-button type="primary" size="small" link>采购</el-button>
              </div>
              <div v-if="lowStockParts.length === 0" class="empty">暂无库存预警</div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="待审批" name="approval">
            <div class="todo-list">
              <div v-for="app in pendingApprovals" :key="app.id" class="todo-item">
                <div class="todo-icon info">
                  <el-icon><Document /></el-icon>
                </div>
                <div class="todo-content">
                  <div class="todo-title">{{ app.shopName }}</div>
                  <div class="todo-desc">{{ 'proposedRent' in app ? '续约申请' : '新商户入驻' }} - {{ app.createTime }}</div>
                </div>
                <el-button type="primary" size="small" link>审批</el-button>
              </div>
              <div v-if="pendingApprovals.length === 0" class="empty">暂无待审批事项</div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-card>

      <el-card class="alert-card">
        <template #header>
          <div class="card-title">
            <el-icon><BellFilled /></el-icon>
            实时告警
          </div>
        </template>
        <div class="alert-scroll">
          <div class="alert-wrapper" :style="{ transform: `translateY(-${scrollOffset}px)` }">
            <div v-for="(alert, idx) in scrollingAlerts" :key="idx" class="alert-item" :class="alert.priority">
              <div class="alert-icon">
                <el-icon v-if="alert.priority === 'urgent'"><WarningFilled /></el-icon>
                <el-icon v-else-if="alert.priority === 'high'"><Warning /></el-icon>
                <el-icon v-else><InfoFilled /></el-icon>
              </div>
              <div class="alert-content">
                <div class="alert-title">{{ alert.title }}</div>
                <div class="alert-desc">{{ alert.message }}</div>
                <div class="alert-time">{{ alert.time }}</div>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMallStore } from '@/stores/mall'
import dayjs from 'dayjs'

const store = useMallStore()

const activeTab = ref('renewal')
const scrollOffset = ref(0)
let scrollTimer: number | null = null

const totalPassengerFlow = computed(() => {
  return store.passengerFlows.reduce((sum, p) => sum + p.dailyTotal, 0)
})

const passengerFlowTrend = computed(() => {
  return Math.floor(Math.random() * 20) - 5
})

const todayRent = computed(() => {
  return Math.floor(store.shops.reduce((sum, s) => sum + s.monthlyRent, 0) / 30)
})

const monthRent = computed(() => {
  return store.shops.reduce((sum, s) => sum + s.monthlyRent, 0)
})

const totalEquipments = computed(() => store.equipments.length)
const onlineEquipments = computed(() => store.equipments.filter(e => e.status === 'running' || e.status === 'standby').length)
const equipmentOnlineRate = computed(() => Math.round(onlineEquipments.value / totalEquipments.value * 100))

const totalSpaces = computed(() => store.totalSpaces)
const occupiedSpaces = computed(() => store.occupiedSpaces)
const parkingUsageRate = computed(() => Math.round(occupiedSpaces.value / totalSpaces.value * 100))

const totalSchedules = computed(() => store.cleaningSchedules.length)
const completedSchedules = computed(() => store.cleaningSchedules.filter(s => s.status === 'completed').length)
const cleaningCompletionRate = computed(() => totalSchedules.value > 0 ? Math.round(completedSchedules.value / totalSchedules.value * 100) : 0)

const pendingSwapCount = computed(() => store.swapRequests.filter(r => r.status === 'pending').length)

const expiringShops = computed(() => store.expiringShops)
const faultEquipments = computed(() => store.faultEquipments)
const lowStockParts = computed(() => store.lowStockParts)
const pendingApprovals = computed(() => store.pendingApprovals)

const flowTrendOption = computed(() => {
  const days = Array.from({ length: 7 }, (_, i) => dayjs().subtract(6 - i, 'day').format('MM-DD'))
  const data = Array.from({ length: 7 }, () => Math.floor(Math.random() * 5000) + 8000)
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: days },
    yAxis: { type: 'value' },
    series: [{
      name: '客流',
      type: 'line',
      smooth: true,
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
          ]
        }
      },
      lineStyle: { color: '#3b82f6', width: 2 },
      itemStyle: { color: '#3b82f6' },
      data
    }]
  }
})

const categoryPieOption = computed(() => {
  const categoryMap = new Map<string, number>()
  store.shops.forEach(shop => {
    const current = categoryMap.get(shop.category) || 0
    categoryMap.set(shop.category, current + shop.monthlyRent)
  })
  const data = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }))
  return {
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['60%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold' }
      },
      labelLine: { show: false },
      data
    }]
  }
})

const floorBarOption = computed(() => {
  const floors = ['-1楼', '1楼', '2楼', '3楼', '4楼', '5楼']
  const data = floors.map(() => Math.floor(Math.random() * 3000) + 2000)
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: floors },
    yAxis: { type: 'value' },
    series: [{
      name: '客流',
      type: 'bar',
      barWidth: '50%',
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#10b981' },
            { offset: 1, color: '#059669' }
          ]
        },
        borderRadius: [4, 4, 0, 0]
      },
      data
    }]
  }
})

const equipmentPieOption = computed(() => {
  const statusMap = {
    running: { name: '运行中', count: 0, color: '#10b981' },
    standby: { name: '待机', count: 0, color: '#64748b' },
    maintenance: { name: '维护中', count: 0, color: '#f59e0b' },
    fault: { name: '故障', count: 0, color: '#ef4444' }
  }
  store.equipments.forEach(eq => statusMap[eq.status].count++)
  const data = Object.values(statusMap).map(item => ({
    name: item.name,
    value: item.count,
    itemStyle: { color: item.color }
  }))
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c}台 ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie',
      radius: '65%',
      center: ['60%', '50%'],
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      emphasis: {
        itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.2)' }
      },
      data
    }]
  }
})

const scrollingAlerts = computed(() => {
  const alerts = store.notifications.filter(n => n.priority !== 'low').slice(0, 10)
  return [...alerts, ...alerts]
})

function startScroll() {
  scrollTimer = window.setInterval(() => {
    scrollOffset.value += 1
    if (scrollOffset.value >= scrollingAlerts.value.length / 2 * 90) {
      scrollOffset.value = 0
    }
  }, 50)
}

onMounted(() => {
  startScroll()
})

onUnmounted(() => {
  if (scrollTimer) {
    clearInterval(scrollTimer)
  }
})
</script>

<style scoped lang="scss">
.dashboard {
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 16px;
    margin-bottom: 20px;
  }

  .charts-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;

    .chart-card {
      height: 320px;

      :deep(.el-card__body) {
        height: calc(100% - 57px);
      }
    }
  }

  .card-title {
    font-size: 16px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .bottom-row {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 20px;

    .todo-card, .alert-card {
      min-height: 350px;
    }
  }

  .todo-list {
    min-height: 260px;

    .todo-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid #f1f5f9;

      &:last-child {
        border-bottom: none;
      }

      .todo-icon {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        color: white;
        flex-shrink: 0;

        &.warning {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }

        &.danger {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }

        &.info {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        }
      }

      .todo-content {
        flex: 1;

        .todo-title {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .todo-desc {
          font-size: 12px;
          color: #64748b;
        }
      }
    }

    .empty {
      text-align: center;
      color: #94a3b8;
      padding: 40px 0;
    }
  }

  .alert-scroll {
    height: 280px;
    overflow: hidden;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 40px;
      background: linear-gradient(transparent, white);
      pointer-events: none;
    }
  }

  .alert-wrapper {
    transition: transform 0.05s linear;
  }

  .alert-item {
    display: flex;
    gap: 12px;
    padding: 12px;
    margin-bottom: 8px;
    border-radius: 8px;

    &.urgent {
      background: #fef2f2;
      border-left: 3px solid #ef4444;
    }

    &.high {
      background: #fffbeb;
      border-left: 3px solid #f59e0b;
    }

    &.medium {
      background: #eff6ff;
      border-left: 3px solid #3b82f6;
    }

    .alert-icon {
      flex-shrink: 0;
      font-size: 20px;

      .urgent & {
        color: #ef4444;
      }

      .high & {
        color: #f59e0b;
      }

      .medium & {
        color: #3b82f6;
      }
    }

    .alert-content {
      flex: 1;

      .alert-title {
        font-weight: 600;
        font-size: 13px;
        color: #1e293b;
        margin-bottom: 2px;
      }

      .alert-desc {
        font-size: 12px;
        color: #64748b;
        line-height: 1.4;
        margin-bottom: 2px;
      }

      .alert-time {
        font-size: 11px;
        color: #94a3b8;
      }
    }
  }
}
</style>
