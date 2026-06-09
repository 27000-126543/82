<template>
  <div class="equipment-monitor">
    <div class="page-header">
      <h2>设备实时监测</h2>
      <div class="refresh-info">
        <el-tag :type="refreshing ? 'warning' : 'success'" size="small">
          {{ refreshing ? '刷新中...' : '实时更新中' }}
        </el-tag>
        <span class="last-update">最后更新: {{ lastUpdateTime }}</span>
      </div>
    </div>

    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card running">
          <div class="stat-content">
            <div class="stat-icon">
              <component :is="'VideoPlay'" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.running }}</div>
              <div class="stat-label">运行中</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card standby">
          <div class="stat-content">
            <div class="stat-icon">
              <component :is="'Clock'" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.standby }}</div>
              <div class="stat-label">待机</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card maintenance">
          <div class="stat-content">
            <div class="stat-icon">
              <component :is="'Tools'" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.maintenance }}</div>
              <div class="stat-label">维护中</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card fault">
          <div class="stat-content">
            <div class="stat-icon">
              <component :is="'Warning'" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.fault }}</div>
              <div class="stat-label">故障</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="equipment-card">
      <el-tabs v-model="activeType" class="equipment-tabs">
        <el-tab-pane label="电梯" name="elevator">
          <div class="equipment-grid">
            <div
              v-for="eq in filteredEquipments"
              :key="eq.id"
              class="equipment-item"
              :class="eq.status"
            >
              <div class="equipment-header">
                <div class="equipment-name">{{ eq.name }}</div>
                <el-tag
                  :type="getStatusType(eq.status)"
                  :class="['status-tag', { blink: eq.status === 'fault' }]"
                  effect="dark"
                >
                  {{ getStatusText(eq.status) }}
                </el-tag>
              </div>
              <div class="equipment-info">
                <div class="info-row">
                  <span class="info-label">位置:</span>
                  <span class="info-value">{{ eq.location }} {{ eq.floor }}楼</span>
                </div>
                <div class="info-row">
                  <span class="info-label">运行时长:</span>
                  <span class="info-value">{{ formatRunHours(eq.runHours) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">下次维保:</span>
                  <span class="info-value">{{ eq.nextMaintenance }}</span>
                </div>
                <div class="info-row" v-if="eq.speed !== undefined">
                  <span class="info-label">速度:</span>
                  <span class="info-value">{{ eq.speed }} m/s</span>
                </div>
                <div class="info-row" v-if="eq.temperature !== undefined">
                  <span class="info-label">温度:</span>
                  <span class="info-value" :class="{ warning: eq.temperature > 26 }">
                    {{ eq.temperature }}°C
                  </span>
                </div>
                <div class="info-row fault-info" v-if="eq.faultCode">
                  <span class="info-label">故障代码:</span>
                  <span class="info-value fault">{{ eq.faultCode }}</span>
                </div>
              </div>
              <div class="equipment-actions">
                <el-button size="small" type="primary" @click="handleAddRunHours(eq)">
                  +100小时
                </el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="扶梯" name="escalator">
          <div class="equipment-grid">
            <div
              v-for="eq in filteredEquipments"
              :key="eq.id"
              class="equipment-item"
              :class="eq.status"
            >
              <div class="equipment-header">
                <div class="equipment-name">{{ eq.name }}</div>
                <el-tag
                  :type="getStatusType(eq.status)"
                  :class="['status-tag', { blink: eq.status === 'fault' }]"
                  effect="dark"
                >
                  {{ getStatusText(eq.status) }}
                </el-tag>
              </div>
              <div class="equipment-info">
                <div class="info-row">
                  <span class="info-label">位置:</span>
                  <span class="info-value">{{ eq.location }} {{ eq.floor }}楼</span>
                </div>
                <div class="info-row">
                  <span class="info-label">运行时长:</span>
                  <span class="info-value">{{ formatRunHours(eq.runHours) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">下次维保:</span>
                  <span class="info-value">{{ eq.nextMaintenance }}</span>
                </div>
                <div class="info-row" v-if="eq.speed !== undefined">
                  <span class="info-label">速度:</span>
                  <span class="info-value">{{ eq.speed }} m/s</span>
                </div>
                <div class="info-row" v-if="eq.temperature !== undefined">
                  <span class="info-label">温度:</span>
                  <span class="info-value" :class="{ warning: eq.temperature > 26 }">
                    {{ eq.temperature }}°C
                  </span>
                </div>
                <div class="info-row fault-info" v-if="eq.faultCode">
                  <span class="info-label">故障代码:</span>
                  <span class="info-value fault">{{ eq.faultCode }}</span>
                </div>
              </div>
              <div class="equipment-actions">
                <el-button size="small" type="primary" @click="handleAddRunHours(eq)">
                  +100小时
                </el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="空调" name="air_conditioner">
          <div class="equipment-grid">
            <div
              v-for="eq in filteredEquipments"
              :key="eq.id"
              class="equipment-item"
              :class="eq.status"
            >
              <div class="equipment-header">
                <div class="equipment-name">{{ eq.name }}</div>
                <el-tag
                  :type="getStatusType(eq.status)"
                  :class="['status-tag', { blink: eq.status === 'fault' }]"
                  effect="dark"
                >
                  {{ getStatusText(eq.status) }}
                </el-tag>
              </div>
              <div class="equipment-info">
                <div class="info-row">
                  <span class="info-label">位置:</span>
                  <span class="info-value">{{ eq.location }} {{ eq.floor }}楼</span>
                </div>
                <div class="info-row">
                  <span class="info-label">运行时长:</span>
                  <span class="info-value">{{ formatRunHours(eq.runHours) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">下次维保:</span>
                  <span class="info-value">{{ eq.nextMaintenance }}</span>
                </div>
                <div class="info-row" v-if="eq.speed !== undefined">
                  <span class="info-label">速度:</span>
                  <span class="info-value">{{ eq.speed }} m/s</span>
                </div>
                <div class="info-row" v-if="eq.temperature !== undefined">
                  <span class="info-label">温度:</span>
                  <span class="info-value" :class="{ warning: eq.temperature > 26 }">
                    {{ eq.temperature }}°C
                  </span>
                </div>
                <div class="info-row fault-info" v-if="eq.faultCode">
                  <span class="info-label">故障代码:</span>
                  <span class="info-value fault">{{ eq.faultCode }}</span>
                </div>
              </div>
              <div class="equipment-actions">
                <el-button size="small" type="primary" @click="handleAddRunHours(eq)">
                  +100小时
                </el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMallStore } from '@/stores/mall'
import { ElMessage } from 'element-plus'
import type { Equipment } from '@/types'
import dayjs from 'dayjs'

const store = useMallStore()

const activeType = ref<'elevator' | 'escalator' | 'air_conditioner'>('elevator')
const refreshing = ref(false)
const lastUpdateTime = ref('')

const stats = computed(() => ({
  running: store.equipments.filter((e: Equipment) => e.status === 'running').length,
  standby: store.equipments.filter((e: Equipment) => e.status === 'standby').length,
  maintenance: store.equipments.filter((e: Equipment) => e.status === 'maintenance').length,
  fault: store.equipments.filter((e: Equipment) => e.status === 'fault').length
}))

const filteredEquipments = computed(() =>
  store.equipments.filter((e: Equipment) => e.type === activeType.value)
)

function getStatusType(status: Equipment['status']) {
  const map: Record<Equipment['status'], string> = {
    running: 'success',
    standby: 'info',
    maintenance: 'warning',
    fault: 'danger'
  }
  return map[status]
}

function getStatusText(status: Equipment['status']) {
  const map: Record<Equipment['status'], string> = {
    running: '运行',
    standby: '待机',
    maintenance: '维护',
    fault: '故障'
  }
  return map[status]
}

function formatRunHours(hours: number) {
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  if (days > 0) {
    return `${days}天${remainingHours}小时`
  }
  return `${hours}小时`
}

function handleAddRunHours(equipment: Equipment) {
  const result = store.updateEquipmentRunHours(equipment.id, 100)
  ElMessage.success(`已为 ${equipment.name} 增加 100 小时运行时长`)
  if (result.orderCreated && result.team) {
    setTimeout(() => {
      ElMessage.success(`已自动生成维保工单，已分配给${result.team}`)
    }, 500)
  }
}

let refreshTimer: number | null = null

function refreshData() {
  refreshing.value = true
  const beforeCount = store.maintenanceOrders.length

  store.equipments.forEach((eq: Equipment) => {
    if (eq.status === 'running') {
      eq.runHours += Math.floor(Math.random() * 5)
      if (eq.temperature !== undefined) {
        eq.temperature = Math.round((eq.temperature + (Math.random() - 0.5)) * 10) / 10
      }
      if (eq.speed !== undefined && eq.type !== 'air_conditioner') {
        eq.speed = Math.round((eq.speed + (Math.random() - 0.5) * 0.1) * 10) / 10
      }
    }
  })

  store.checkAndCreateMaintenanceOrders()

  const afterCount = store.maintenanceOrders.length
  if (afterCount > beforeCount) {
    const newOrder = store.maintenanceOrders[0]
    ElMessage.success(`自动生成维保工单：${newOrder.equipmentName} - 已分配给${newOrder.assigneeTeam}`)
  }

  lastUpdateTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss')
  setTimeout(() => {
    refreshing.value = false
  }, 500)
}

onMounted(() => {
  lastUpdateTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss')
  refreshTimer = window.setInterval(refreshData, 5000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<style lang="scss" scoped>
.equipment-monitor {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h2 {
    margin: 0;
    font-size: 20px;
    color: #1e293b;
  }

  .refresh-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .last-update {
      font-size: 13px;
      color: #64748b;
    }
  }
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  border: none;
  border-radius: 12px;
  overflow: hidden;

  :deep(.el-card__body) {
    padding: 20px;
  }

  &.running {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    .stat-icon, .stat-value, .stat-label { color: #fff; }
  }

  &.standby {
    background: linear-gradient(135deg, #64748b 0%, #475569 100%);
    .stat-icon, .stat-value, .stat-label { color: #fff; }
  }

  &.maintenance {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    .stat-icon, .stat-value, .stat-label { color: #fff; }
  }

  &.fault {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    .stat-icon, .stat-value, .stat-label { color: #fff; }
  }

  .stat-content {
    display: flex;
    align-items: center;
    gap: 16px;

    .stat-icon {
      font-size: 36px;
      opacity: 0.9;
    }

    .stat-info {
      .stat-value {
        font-size: 32px;
        font-weight: 700;
        line-height: 1.2;
      }

      .stat-label {
        font-size: 13px;
        opacity: 0.9;
      }
    }
  }
}

.equipment-card {
  border: none;
  border-radius: 12px;

  :deep(.el-card__body) {
    padding: 0;
  }

  :deep(.el-tabs__header) {
    margin: 0;
    padding: 0 20px;
    background: #f8fafc;
    border-radius: 12px 12px 0 0;
  }

  :deep(.el-tabs__nav-wrap::after) {
    display: none;
  }
}

.equipment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 20px;
}

.equipment-item {
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  background: #fff;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }

  &.running {
    border-color: #10b981;
  }

  &.standby {
    border-color: #64748b;
  }

  &.maintenance {
    border-color: #f59e0b;
  }

  &.fault {
    border-color: #ef4444;
    animation: faultPulse 2s infinite;
  }

  .equipment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f1f5f9;

    .equipment-name {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }

    .status-tag.blink {
      animation: blink 1s infinite;
    }
  }

  .equipment-info {
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;

      .info-label {
        color: #64748b;
      }

      .info-value {
        color: #1e293b;
        font-weight: 500;

        &.warning {
          color: #f59e0b;
        }

        &.fault {
          color: #ef4444;
          font-weight: 600;
        }
      }

      &.fault-info {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px dashed #fecaca;
        background: #fef2f2;
        padding: 8px;
        border-radius: 6px;
      }
    }
  }

  .equipment-actions {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #f1f5f9;
    display: flex;
    justify-content: flex-end;
  }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes faultPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
}
</style>
