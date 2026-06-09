<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">疏散报警管理</div>
      <div class="header-actions">
        <el-tag type="danger" effect="dark" v-if="pendingEvacuationTasks.length > 0" class="alert-count">
          <el-icon><Warning /></el-icon>
          {{ pendingEvacuationTasks.length }} 个待处理任务
        </el-tag>
        <el-tag type="warning" effect="dark" v-if="inProgressTasks.length > 0" class="alert-count" style="margin-left: 8px;">
          <el-icon><Loading /></el-icon>
          {{ inProgressTasks.length }} 个处理中
        </el-tag>
        <el-button type="primary" @click="handleRefresh" style="margin-left: 12px">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <div class="stat-card red">
          <div class="stat-label">待处理任务</div>
          <div class="stat-value">{{ pendingTasks.length }}</div>
          <div class="stat-footer">
            <el-icon><Bell /></el-icon>
            需要指派
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card orange">
          <div class="stat-label">处理中</div>
          <div class="stat-value">{{ inProgressTasks.length }}</div>
          <div class="stat-footer">
            <el-icon><Loading /></el-icon>
            正在处置
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card green">
          <div class="stat-label">已完成</div>
          <div class="stat-value">{{ completedTasks.length }}</div>
          <div class="stat-footer">
            <el-icon><CircleCheck /></el-icon>
            已处置完成
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card purple">
          <div class="stat-label">今日总报警</div>
          <div class="stat-value">{{ todayAlertCount }}</div>
          <div class="stat-footer">
            <el-icon><Warning /></el-icon>
            今日累计
          </div>
        </div>
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab" class="alerts-tabs">
      <el-tab-pane :label="`待处理 (${pendingTasks.length})`" name="pending">
        <el-empty v-if="pendingTasks.length === 0" description="暂无待处理疏散任务" />
        <div v-else class="alerts-list">
          <div
            v-for="task in pendingTasks"
            :key="task.id"
            class="alert-card"
          >
            <div class="alert-header">
              <div class="alert-title">
                <el-icon class="alert-icon"><Warning /></el-icon>
                <span>{{ task.zone }} 客流超限报警</span>
                <el-tag type="danger" effect="dark" size="small" style="margin-left: 8px;">
                  待指派
                </el-tag>
              </div>
              <el-tag type="info" class="alert-time">
                创建时间：{{ task.createTime }}
              </el-tag>
            </div>
            <div class="alert-body">
              <div class="alert-info">
                <div class="info-item">
                  <span class="info-label">报警人数</span>
                  <span class="info-value danger">{{ task.currentCount }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">最大容量</span>
                  <span class="info-value">{{ task.capacity }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">占比</span>
                  <span class="info-value danger">{{ getTaskRatio(task) }}%</span>
                </div>
                <div class="info-item">
                  <span class="info-label">所在楼层</span>
                  <span class="info-value">{{ task.floor === -1 ? 'B1层' : task.floor + '层' }}</span>
                </div>
              </div>
              <div v-if="task.evacuateRoute || task.evacuateMethod" class="task-info">
                <el-descriptions :column="3" size="small" border>
                  <el-descriptions-item label="指派人员">
                    {{ task.securityStaffName || '待指派' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="疏散方式">
                    {{ getEvacuateMethodText(task.evacuateMethod) }}
                  </el-descriptions-item>
                  <el-descriptions-item label="疏散路线">
                    {{ task.evacuateRoute || '待指定' }}
                  </el-descriptions-item>
                </el-descriptions>
              </div>
              <div v-if="task.remark" class="task-remark">
                <el-icon><Document /></el-icon>
                <span>备注：{{ task.remark }}</span>
              </div>
            </div>
            <div class="alert-footer">
              <div class="floor-info">
                <el-tag size="small" type="info">
                  <el-icon><Location /></el-icon>
                  {{ task.floor === -1 ? 'B1层' : task.floor + '层' }}
                </el-tag>
              </div>
              <div class="alert-actions">
                <el-button type="primary" size="small" @click="handleStartTask(task)">
                  <el-icon><VideoPlay /></el-icon>
                  开始处理
                </el-button>
                <el-button type="success" size="small" @click="handleCompleteTask(task)">
                  <el-icon><CircleCheck /></el-icon>
                  标记完成
                </el-button>
                <el-button type="info" size="small" @click="handleViewDetail(task)">
                  <el-icon><View /></el-icon>
                  查看详情
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane :label="`处理中 (${inProgressTasks.length})`" name="in_progress">
        <el-empty v-if="inProgressTasks.length === 0" description="暂无处理中任务" />
        <div v-else class="alerts-list">
          <div
            v-for="task in inProgressTasks"
            :key="task.id"
            class="alert-card pulse"
          >
            <div class="alert-header">
              <div class="alert-title">
                <el-icon class="alert-icon"><Loading /></el-icon>
                <span>{{ task.zone }} 疏散进行中</span>
                <el-tag type="warning" effect="dark" size="small" style="margin-left: 8px;">
                  处理中
                </el-tag>
              </div>
              <el-tag type="warning" class="alert-time">
                开始时间：{{ task.startTime }}
              </el-tag>
            </div>
            <div class="alert-body">
              <div class="alert-info">
                <div class="info-item">
                  <span class="info-label">报警人数</span>
                  <span class="info-value danger">{{ task.currentCount }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">处置人员</span>
                  <span class="info-value">{{ task.securityStaffName || '未指派' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">疏散方式</span>
                  <span class="info-value">{{ getEvacuateMethodText(task.evacuateMethod) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">已用时</span>
                  <span class="info-value">{{ getDuration(task.startTime) }}</span>
                </div>
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill warning"
                  style="width: 60%;"
                ></div>
              </div>
            </div>
            <div class="alert-footer">
              <div class="floor-info">
                <el-tag size="small">
                  <el-icon><Location /></el-icon>
                  {{ task.floor === -1 ? 'B1层' : task.floor + '层' }}
                </el-tag>
                <span class="trend-info">
                  <el-icon><Guide /></el-icon>
                  疏散路线：{{ task.evacuateRoute || '待指定' }}
                </span>
              </div>
              <div class="alert-actions">
                <el-button type="success" size="small" @click="handleCompleteTask(task)">
                  <el-icon><CircleCheck /></el-icon>
                  标记完成
                </el-button>
                <el-button type="info" size="small" @click="handleViewDetail(task)">
                  <el-icon><View /></el-icon>
                  查看详情
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane :label="`处理记录 (${completedTasks.length})`" name="completed">
        <el-empty v-if="completedTasks.length === 0" description="暂无处理记录" />
        <el-table v-else :data="completedTasks" stripe style="width: 100%">
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
          <el-table-column label="容量占比" width="100">
            <template #default="{ row }">
              {{ getTaskRatio(row) }}%
            </template>
          </el-table-column>
          <el-table-column prop="securityStaffName" label="处置人员" width="120" />
          <el-table-column label="处置方式" width="120">
            <template #default="{ row }">
              <el-tag :type="getResolveTagType(row.resolveMethod)">
                {{ row.resolveMethod || getEvacuateMethodText(row.evacuateMethod) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column prop="completeTime" label="完成时间" width="180" />
          <el-table-column prop="operator" label="处理人" width="120" />
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleViewDetail(row)">
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="completeDialogVisible" title="完成疏散任务" width="500px">
      <el-form :model="completeForm" :rules="completeRules" ref="completeFormRef" label-width="100px">
        <el-form-item label="报警区域">
          <el-input :model-value="currentTask?.zone" disabled />
        </el-form-item>
        <el-form-item label="报警人数">
          <el-input :model-value="currentTask?.currentCount" disabled />
        </el-form-item>
        <el-form-item label="处置人员">
          <el-input :model-value="currentTask?.securityStaffName || '未指派'" disabled />
        </el-form-item>
        <el-form-item label="处理方式" prop="resolveMethod">
          <el-select v-model="completeForm.resolveMethod" placeholder="请选择处理方式" style="width: 100%">
            <el-option label="广播引导疏散" value="广播引导疏散" />
            <el-option label="人工引导疏散" value="人工引导疏散" />
            <el-option label="紧急疏散" value="紧急疏散" />
            <el-option label="客流自然回落" value="客流自然回落" />
            <el-option label="安保人员处置" value="安保人员处置" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理备注">
          <el-input v-model="completeForm.remark" type="textarea" :rows="3" placeholder="请输入处理备注（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeDialogVisible = false">取消</el-button>
        <el-button type="success" @click="handleConfirmComplete">
          <el-icon><CircleCheck /></el-icon>
          确认完成
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="疏散任务详情" width="600px">
      <div v-if="currentTask" class="task-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="任务编号">
            {{ currentTask.id }}
          </el-descriptions-item>
          <el-descriptions-item label="任务状态">
            <el-tag :type="getTaskStatusTag(currentTask.status)">
              {{ getTaskStatusText(currentTask.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="报警区域">
            {{ currentTask.zone }}
          </el-descriptions-item>
          <el-descriptions-item label="所在楼层">
            {{ currentTask.floor === -1 ? 'B1层' : currentTask.floor + '层' }}
          </el-descriptions-item>
          <el-descriptions-item label="报警人数">
            <span class="text-danger">{{ currentTask.currentCount }} 人</span>
          </el-descriptions-item>
          <el-descriptions-item label="最大容量">
            {{ currentTask.capacity }} 人
          </el-descriptions-item>
          <el-descriptions-item label="占比">
            <span class="text-danger">{{ getTaskRatio(currentTask) }}%</span>
          </el-descriptions-item>
          <el-descriptions-item label="指派人员">
            {{ currentTask.securityStaffName || '未指派' }}
          </el-descriptions-item>
          <el-descriptions-item label="疏散方式" :span="2">
            {{ getEvacuateMethodText(currentTask.evacuateMethod) }}
          </el-descriptions-item>
          <el-descriptions-item label="疏散路线" :span="2">
            {{ currentTask.evacuateRoute || '未指定' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">
            {{ currentTask.createTime }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentTask.startTime" label="开始时间" :span="2">
            {{ currentTask.startTime }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentTask.completeTime" label="完成时间" :span="2">
            {{ currentTask.completeTime }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentTask.resolveMethod" label="处理方式" :span="2">
            {{ currentTask.resolveMethod }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentTask.operator" label="处理人" :span="2">
            {{ currentTask.operator }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentTask.remark" label="备注" :span="2">
            {{ currentTask.remark }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMallStore } from '@/stores/mall'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Refresh, Warning, Bell, CircleCheck, Location, Guide, Document, View, VideoPlay, Loading } from '@element-plus/icons-vue'
import type { EvacuationTask } from '@/types'
import dayjs from 'dayjs'

const mallStore = useMallStore()

const activeTab = ref('pending')
const completeDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const completeFormRef = ref<FormInstance>()
const currentTask = ref<EvacuationTask | null>(null)

const completeForm = ref({
  resolveMethod: '',
  remark: ''
})

const completeRules: FormRules = {
  resolveMethod: [
    { required: true, message: '请选择处理方式', trigger: 'change' }
  ]
}

const pendingEvacuationTasks = computed(() =>
  mallStore.evacuationTasks.filter(t => t.status === 'pending')
)

const inProgressTasks = computed(() =>
  mallStore.evacuationTasks.filter(t => t.status === 'in_progress')
)

const pendingTasks = computed(() =>
  mallStore.evacuationTasks.filter(t => t.status === 'pending')
)

const completedTasks = computed(() =>
  mallStore.evacuationTasks.filter(t => t.status === 'completed')
)

const todayAlertCount = computed(() => {
  const today = dayjs().format('YYYY-MM-DD')
  return mallStore.evacuationTasks.filter(t =>
    dayjs(t.createTime).format('YYYY-MM-DD') === today
  ).length
})

const getTaskRatio = (task: EvacuationTask) => {
  if (task.capacity === 0) return 0
  return Math.round((task.currentCount / task.capacity) * 100)
}

const getEvacuateMethodText = (method?: string) => {
  const map: Record<string, string> = {
    broadcast: '广播引导',
    manual: '人工引导',
    emergency: '紧急疏散'
  }
  return map[method || ''] || '未指定'
}

const getTaskStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待处理',
    in_progress: '处理中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

const getTaskStatusTag = (status: string) => {
  const map: Record<string, string> = {
    pending: 'danger',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'info'
  }
  return map[status] || 'info'
}

const getResolveTagType = (method?: string) => {
  if (!method) return 'info'
  if (method.includes('疏散')) return 'warning'
  if (method.includes('安保')) return 'danger'
  return 'success'
}

const getDuration = (startTime?: string) => {
  if (!startTime) return '--'
  const minutes = dayjs().diff(dayjs(startTime), 'minute')
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}小时${mins}分钟`
}

const handleRefresh = () => {
  mallStore.updatePassengerFlow()
  ElMessage.success('数据已刷新')
}

const handleStartTask = (task: EvacuationTask) => {
  ElMessageBox.confirm(
    `确定开始处理 ${task.zone} 的疏散任务吗？`,
    '开始处理',
    {
      confirmButtonText: '确认开始',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    mallStore.startEvacuationTask(task.id)
    ElMessage.success('任务已开始处理')
  }).catch(() => {})
}

const handleCompleteTask = (task: EvacuationTask) => {
  currentTask.value = task
  completeForm.value = {
    resolveMethod: '',
    remark: ''
  }
  completeDialogVisible.value = true
}

const handleConfirmComplete = async () => {
  if (!completeFormRef.value || !currentTask.value) return

  const valid = await completeFormRef.value.validate().catch(() => false)
  if (!valid) return

  mallStore.completeEvacuationTask(
    currentTask.value.id,
    completeForm.value.resolveMethod,
    completeForm.value.remark
  )

  ElMessage.success('疏散任务已完成，告警已清除')
  completeDialogVisible.value = false
}

const handleViewDetail = (task: EvacuationTask) => {
  currentTask.value = task
  detailDialogVisible.value = true
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
      border-color: #fbbf24;
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
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

      .task-info {
        margin-bottom: 12px;
      }

      .task-remark {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        padding: 10px 12px;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 6px;
        font-size: 12px;
        color: #475569;

        .el-icon {
          margin-top: 2px;
          flex-shrink: 0;
          color: #64748b;
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

          &.warning {
            background: linear-gradient(90deg, #fbbf24, #f59e0b);
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
          color: #64748b;
        }
      }

      .alert-actions {
        display: flex;
        gap: 8px;
      }
    }
  }
}

.task-detail {
  .text-danger {
    color: #dc2626;
    font-weight: 600;
  }
}

@keyframes pulse-border {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4);
    border-color: #fbbf24;
  }
  50% {
    box-shadow: 0 0 0 8px rgba(245, 158, 11, 0);
    border-color: #f59e0b;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px) rotate(-5deg); }
  75% { transform: translateX(2px) rotate(5deg); }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.text-danger {
  color: #dc2626;
  font-weight: 600;
}

.rotate {
  animation: rotate 1s linear infinite;
}
</style>
