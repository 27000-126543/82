<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">疏散报警管理</div>
      <div class="header-actions">
        <el-tag type="danger" effect="dark" v-if="activeAlerts.length > 0" class="alert-count">
          <el-icon><Warning /></el-icon>
          {{ activeAlerts.length }} 个待处理报警
        </el-tag>
        <el-button type="danger" @click="handleCallAllSecurity" :disabled="activeAlerts.length === 0" style="margin-left: 12px">
          <el-icon><Phone /></el-icon>
          一键呼叫全部安保
        </el-button>
        <el-button type="primary" @click="handleRefresh" style="margin-left: 12px">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <div class="stat-card red">
          <div class="stat-label">待处理报警</div>
          <div class="stat-value">{{ activeAlerts.length }}</div>
          <div class="stat-footer">
            <el-icon><Bell /></el-icon>
            需要处理
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card orange">
          <div class="stat-label">今日总报警</div>
          <div class="stat-value">{{ todayAlerts }}</div>
          <div class="stat-footer">
            <el-icon><Warning /></el-icon>
            今日累计
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card green">
          <div class="stat-label">已处理</div>
          <div class="stat-value">{{ resolvedAlerts.length }}</div>
          <div class="stat-footer">
            <el-icon><CircleCheck /></el-icon>
            已处置完成
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card purple">
          <div class="stat-label">平均响应时间</div>
          <div class="stat-value">{{ avgResponseTime }}分钟</div>
          <div class="stat-footer">
            <el-icon><Timer /></el-icon>
            处理效率
          </div>
        </div>
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab" class="alerts-tabs">
      <el-tab-pane label="待处理报警" name="active">
        <el-empty v-if="activeAlerts.length === 0" description="暂无待处理报警" />
        <div v-else class="alerts-list">
          <div
            v-for="alert in activeAlerts"
            :key="alert.id"
            :class="['alert-card', { 'pulse': alert.evacuationAlert }]"
          >
            <div class="alert-header">
              <div class="alert-title">
                <el-icon class="alert-icon"><Warning /></el-icon>
                <span>{{ alert.zone }} 客流超限报警</span>
              </div>
              <el-tag type="danger" effect="dark" class="alert-time">
                {{ getAlertTime(alert) }}
              </el-tag>
            </div>
            <div class="alert-body">
              <div class="alert-info">
                <div class="info-item">
                  <span class="info-label">当前人数</span>
                  <span class="info-value danger">{{ alert.currentCount }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">容量阈值</span>
                  <span class="info-value">{{ alert.threshold }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">最大容量</span>
                  <span class="info-value">{{ alert.capacity }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">占比</span>
                  <span class="info-value danger">{{ getRatio(alert) }}%</span>
                </div>
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill danger"
                  :style="{ width: getRatio(alert) + '%' }"
                ></div>
                <div class="threshold-line" :style="{ left: (alert.threshold / alert.capacity * 100) + '%' }">
                  <span class="threshold-label">阈值</span>
                </div>
              </div>
            </div>
            <div class="alert-footer">
              <div class="floor-info">
                <el-tag size="small">
                  <el-icon><Location /></el-icon>
                  {{ alert.floor === -1 ? 'B1层' : alert.floor + '层' }}
                </el-tag>
                <span class="trend-info" :class="alert.trend">
                  <el-icon v-if="alert.trend === 'increasing'"><Top /></el-icon>
                  <el-icon v-else-if="alert.trend === 'decreasing'"><Bottom /></el-icon>
                  <el-icon v-else><Minus /></el-icon>
                  客流{{ getTrendText(alert.trend) }}
                </span>
              </div>
              <div class="alert-actions">
                <el-button type="warning" size="small" @click="handleCallSecurity(alert)">
                  <el-icon><Phone /></el-icon>
                  呼叫安保
                </el-button>
                <el-button type="primary" size="small" @click="handleEvacuate(alert)">
                  <el-icon><Guide /></el-icon>
                  引导疏散
                </el-button>
                <el-button type="success" size="small" @click="handleResolve(alert)">
                  <el-icon><CircleCheck /></el-icon>
                  标记已处理
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="处理记录" name="resolved">
        <el-empty v-if="resolvedAlerts.length === 0" description="暂无处理记录" />
        <el-table v-else :data="resolvedAlerts" stripe style="width: 100%">
          <el-table-column prop="zone" label="报警区域" width="150" />
          <el-table-column label="楼层" width="100">
            <template #default="{ row }">
              {{ row.floor === -1 ? 'B1层' : row.floor + '层' }}
            </template>
          </el-table-column>
          <el-table-column label="报警人数" width="100">
            <template #default="{ row }">
              <span class="text-danger">{{ row.currentCount }}</span>
            </template>
          </el-table-column>
          <el-table-column label="容量阈值" width="100">
            <template #default="{ row }">
              {{ row.threshold }}
            </template>
          </el-table-column>
          <el-table-column label="占比" width="100">
            <template #default="{ row }">
              {{ getRatio(row) }}%
            </template>
          </el-table-column>
          <el-table-column prop="resolveTime" label="处理时间" width="180" />
          <el-table-column prop="resolveMethod" label="处理方式" width="120">
            <template #default="{ row }">
              <el-tag :type="getResolveTagType(row.resolveMethod)">
                {{ row.resolveMethod }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="operator" label="处理人" width="120" />
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="callDialogVisible" title="呼叫安保人员" width="500px">
      <el-form label-width="100px">
        <el-form-item label="报警区域">
          <el-input :model-value="currentAlert?.zone" disabled />
        </el-form-item>
        <el-form-item label="当前人数">
          <el-input :model-value="currentAlert?.currentCount" disabled />
        </el-form-item>
        <el-form-item label="安保人员">
          <el-select v-model="selectedSecurity" placeholder="选择安保人员" style="width: 100%">
            <el-option label="安保队长 - 王队长" value="王队长" />
            <el-option label="安保队员 - 李队员" value="李队员" />
            <el-option label="安保队员 - 张队员" value="张队员" />
            <el-option label="安保队员 - 刘队员" value="刘队员" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="callRemark" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="callDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmCall">
          <el-icon><Phone /></el-icon>
          确认呼叫
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="evacuateDialogVisible" title="引导疏散" width="500px">
      <el-form label-width="100px">
        <el-form-item label="报警区域">
          <el-input :model-value="currentAlert?.zone" disabled />
        </el-form-item>
        <el-form-item label="疏散方式">
          <el-radio-group v-model="evacuateMethod">
            <el-radio value="broadcast">广播引导</el-radio>
            <el-radio value="manual">人工引导</el-radio>
            <el-radio value="emergency">紧急疏散</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="疏散路线">
          <el-select v-model="evacuateRoute" placeholder="选择疏散路线" style="width: 100%">
            <el-option label="1号安全出口" value="1号安全出口" />
            <el-option label="2号安全出口" value="2号安全出口" />
            <el-option label="3号安全出口" value="3号安全出口" />
            <el-option label="就近疏散" value="就近疏散" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="evacuateRemark" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="evacuateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmEvacuate">
          <el-icon><Guide /></el-icon>
          开始疏散
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMallStore } from '@/stores/mall'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Warning, Bell, CircleCheck, Timer, Phone, Location, Top, Bottom, Minus, Guide } from '@element-plus/icons-vue'
import type { PassengerFlow } from '@/types'
import dayjs from 'dayjs'

const mallStore = useMallStore()

const activeTab = ref('active')
const callDialogVisible = ref(false)
const evacuateDialogVisible = ref(false)
const currentAlert = ref<PassengerFlow | null>(null)
const selectedSecurity = ref('')
const callRemark = ref('')
const evacuateMethod = ref('broadcast')
const evacuateRoute = ref('')
const evacuateRemark = ref('')
const todayAlerts = ref(5)
const avgResponseTime = ref(8)

interface ResolvedAlert extends PassengerFlow {
  resolveTime: string
  resolveMethod: string
  operator: string
  remark: string
}

const resolvedAlerts = ref<ResolvedAlert[]>([
  {
    id: 'PF008', zone: '2楼服饰区', floor: 2, currentCount: 780, capacity: 900,
    threshold: 720, trend: 'decreasing', hourlyData: [], dailyTotal: 7800,
    resolveTime: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    resolveMethod: '引导疏散', operator: '王队长', remark: '已完成疏散'
  },
  {
    id: 'PF009', zone: '3楼运动区', floor: 3, currentCount: 620, capacity: 700,
    threshold: 560, trend: 'stable', hourlyData: [], dailyTotal: 5200,
    resolveTime: dayjs().subtract(4, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    resolveMethod: '呼叫安保', operator: '李队员', remark: '已恢复正常'
  }
])

const activeAlerts = computed(() =>
  mallStore.passengerFlows.filter(f => f.evacuationAlert)
)

const getRatio = (flow: PassengerFlow) => {
  if (flow.capacity === 0) return 0
  return Math.round((flow.currentCount / flow.capacity) * 100)
}

const getAlertTime = (_flow: PassengerFlow) => {
  const alertTime = dayjs().subtract(Math.floor(Math.random() * 60) + 1, 'minute')
  return alertTime.format('HH:mm:ss')
}

const getTrendText = (trend: string) => {
  const map: Record<string, string> = {
    increasing: '上升',
    decreasing: '下降',
    stable: '平稳'
  }
  return map[trend] || trend
}

const getResolveTagType = (method: string) => {
  if (method.includes('疏散')) return 'warning'
  if (method.includes('安保')) return 'danger'
  return 'success'
}

const handleRefresh = () => {
  mallStore.updatePassengerFlow()
  ElMessage.success('数据已刷新')
}

const handleCallSecurity = (alert: PassengerFlow) => {
  currentAlert.value = alert
  selectedSecurity.value = ''
  callRemark.value = ''
  callDialogVisible.value = true
}

const handleCallAllSecurity = () => {
  ElMessageBox.confirm(
    `确定要向 ${activeAlerts.value.length} 个报警区域同时呼叫安保吗？`,
    '一键呼叫安保',
    {
      confirmButtonText: '确认呼叫',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success('已向所有安保人员发出呼叫')
  }).catch(() => {})
}

const handleConfirmCall = () => {
  if (!selectedSecurity.value) {
    ElMessage.warning('请选择安保人员')
    return
  }
  if (currentAlert.value) {
    const idx = mallStore.passengerFlows.findIndex(p => p.id === currentAlert.value!.id)
    if (idx > -1) {
      mallStore.passengerFlows[idx].evacuationAlert = false
      resolvedAlerts.value.unshift({
        ...currentAlert.value,
        resolveTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        resolveMethod: '呼叫安保',
        operator: selectedSecurity.value,
        remark: callRemark.value
      })
    }
  }
  ElMessage.success(`已呼叫 ${selectedSecurity.value} 前往处置`)
  callDialogVisible.value = false
}

const handleEvacuate = (alert: PassengerFlow) => {
  currentAlert.value = alert
  evacuateMethod.value = 'broadcast'
  evacuateRoute.value = ''
  evacuateRemark.value = ''
  evacuateDialogVisible.value = true
}

const handleConfirmEvacuate = () => {
  if (!evacuateRoute.value) {
    ElMessage.warning('请选择疏散路线')
    return
  }
  if (currentAlert.value) {
    const idx = mallStore.passengerFlows.findIndex(p => p.id === currentAlert.value!.id)
    if (idx > -1) {
      mallStore.passengerFlows[idx].evacuationAlert = false
      resolvedAlerts.value.unshift({
        ...currentAlert.value,
        resolveTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        resolveMethod: '引导疏散',
        operator: '当前用户',
        remark: `${evacuateMethod.value} - ${evacuateRoute.value} - ${evacuateRemark.value}`
      })
    }
  }
  ElMessage.success('疏散引导已启动')
  evacuateDialogVisible.value = false
}

const handleResolve = (alert: PassengerFlow) => {
  ElMessageBox.confirm(
    `确定标记 ${alert.zone} 报警为已处理吗？`,
    '确认处理',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    const idx = mallStore.passengerFlows.findIndex(p => p.id === alert.id)
    if (idx > -1) {
      mallStore.passengerFlows[idx].evacuationAlert = false
      resolvedAlerts.value.unshift({
        ...alert,
        resolveTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        resolveMethod: '手动标记',
        operator: '当前用户',
        remark: '客流已恢复正常'
      })
    }
    ElMessage.success('报警已标记为已处理')
  }).catch(() => {})
}

let updateTimer: number | null = null

onMounted(() => {
  updateTimer = window.setInterval(() => {
    mallStore.updatePassengerFlow()
  }, 5000)
})

onUnmounted(() => {
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

  .alert-count {
    animation: blink 1s infinite;
  }
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.7; }
}

.alerts-tabs {
  .alerts-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .alert-card {
    background: white;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 20px;
    background: linear-gradient(135deg, #fff5f5 0%, #fef2f2 100%);

    &.pulse {
      animation: pulse-border 2s infinite;
    }

    .alert-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .alert-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
        color: #991b1b;

        .alert-icon {
          font-size: 20px;
          animation: shake 0.5s infinite;
        }
      }

      .alert-time {
        font-size: 12px;
      }
    }

    .alert-body {
      margin-bottom: 16px;

      .alert-info {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 16px;

        .info-item {
          text-align: center;
          padding: 12px;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 8px;

          .info-label {
            display: block;
            font-size: 12px;
            color: #64748b;
            margin-bottom: 4px;
          }

          .info-value {
            font-size: 20px;
            font-weight: 700;
            color: #1e293b;

            &.danger {
              color: #dc2626;
            }
          }
        }
      }

      .progress-bar {
        position: relative;
        height: 12px;
        background: #fee2e2;
        border-radius: 6px;
        overflow: visible;

        .progress-fill {
          height: 100%;
          border-radius: 6px;
          transition: width 0.5s ease;

          &.danger {
            background: linear-gradient(90deg, #f87171, #ef4444);
          }
        }

        .threshold-line {
          position: absolute;
          top: -4px;
          height: 20px;
          width: 2px;
          background: #991b1b;

          .threshold-label {
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            background: #991b1b;
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            white-space: nowrap;
          }
        }
      }
    }

    .alert-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .floor-info {
        display: flex;
        align-items: center;
        gap: 12px;

        .trend-info {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;

          &.increasing {
            color: #dc2626;
          }

          &.decreasing {
            color: #16a34a;
          }

          &.stable {
            color: #64748b;
          }
        }
      }

      .alert-actions {
        display: flex;
        gap: 8px;
      }
    }
  }
}

@keyframes pulse-border {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
    border-color: #fca5a5;
  }
  50% {
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
    border-color: #ef4444;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px) rotate(-5deg); }
  75% { transform: translateX(2px) rotate(5deg); }
}

.text-danger {
  color: #dc2626;
  font-weight: 600;
}
</style>
