<template>
  <div class="swap-approval">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">调班审批</span>
          <div class="header-actions">
            <el-radio-group v-model="statusFilter" size="default">
              <el-radio-button value="">全部</el-radio-button>
              <el-radio-button value="pending">待审批</el-radio-button>
              <el-radio-button value="approved">已通过</el-radio-button>
              <el-radio-button value="rejected">已驳回</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <el-table :data="filteredRequests" stripe border>
        <el-table-column prop="requesterName" label="申请人" width="120" />
        <el-table-column prop="targetStaffName" label="目标人员" width="120" />
        <el-table-column label="原排班信息" min-width="250">
          <template #default="{ row }">
            <div class="schedule-info">
              <div v-if="getScheduleById(row.scheduleId)">
                <span class="label">日期:</span>
                <span>{{ getScheduleById(row.scheduleId)?.date }}</span>
              </div>
              <div v-if="getScheduleById(row.scheduleId)">
                <span class="label">班次:</span>
                <el-tag :type="shiftTagType[getScheduleById(row.scheduleId)?.shift || 'morning']" size="small">
                  {{ shiftText[getScheduleById(row.scheduleId)?.shift || 'morning'] }}
                </el-tag>
              </div>
              <div v-if="getScheduleById(row.scheduleId)">
                <span class="label">区域:</span>
                <span>{{ getScheduleById(row.scheduleId)?.zone }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="申请原因" min-width="200" show-overflow-tooltip />
        <el-table-column prop="createTime" label="申请时间" width="180" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType[row.status]" effect="dark">
              {{ statusText[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">查看流程</el-button>
            <el-button type="success" link v-if="row.status === 'pending'" @click="handleApprove(row)">通过</el-button>
            <el-button type="danger" link v-if="row.status === 'pending'" @click="handleReject(row)">驳回</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="filteredRequests.length === 0" description="暂无调班申请" />
    </el-card>

    <el-dialog v-model="approvalDialogVisible" :title="isReject ? '驳回申请' : '通过申请'" width="500px">
      <el-form :model="approvalForm" :rules="approvalRules" ref="approvalFormRef" label-width="100px">
        <el-form-item label="审批意见" prop="comment">
          <el-input v-model="approvalForm.comment" type="textarea" :rows="3" :placeholder="isReject ? '请输入驳回原因' : '请输入审批意见（选填）'" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approvalDialogVisible = false">取消</el-button>
        <el-button :type="isReject ? 'danger' : 'primary'" @click="handleSubmitApproval">
          {{ isReject ? '确认驳回' : '确认通过' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="flowDialogVisible" title="审批流程" width="600px">
      <div v-if="currentRequest" class="flow-detail">
        <div class="info-section">
          <div class="info-title">申请信息</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">申请人:</span>
              <span class="value">{{ currentRequest.requesterName }}</span>
            </div>
            <div class="info-item">
              <span class="label">目标人员:</span>
              <span class="value">{{ currentRequest.targetStaffName }}</span>
            </div>
            <div class="info-item">
              <span class="label">申请时间:</span>
              <span class="value">{{ currentRequest.createTime }}</span>
            </div>
            <div class="info-item">
              <span class="label">当前状态:</span>
              <el-tag :type="statusTagType[currentRequest.status]" effect="dark">
                {{ statusText[currentRequest.status] }}
              </el-tag>
            </div>
          </div>
        </div>

        <div class="info-section">
          <div class="info-title">申请原因</div>
          <div class="reason-text">{{ currentRequest.reason }}</div>
        </div>

        <div class="info-section">
          <div class="info-title">审批流程</div>
          <div class="approval-flow">
            <div class="approval-step" :class="currentRequest.status === 'pending' ? 'current' : currentRequest.status === 'approved' ? 'approved' : 'rejected'">
              <div class="step-number">1</div>
              <div class="step-role">保洁主管</div>
              <div class="step-approver">{{ currentRequest.status === 'pending' ? '待审批' : '系统自动' }}</div>
              <div class="step-time" v-if="currentRequest.status !== 'pending'">{{ currentRequest.createTime }}</div>
              <div class="step-comment" v-if="currentRequest.status === 'rejected'">{{ approvalForm.comment || '驳回' }}</div>
              <div class="step-comment" v-if="currentRequest.status === 'approved'">{{ approvalForm.comment || '通过' }}</div>
            </div>
            <div class="step-arrow">
              <el-icon><ArrowRight /></el-icon>
            </div>
            <div class="approval-step" :class="currentRequest.status === 'approved' ? 'approved' : 'pending'">
              <div class="step-number">2</div>
              <div class="step-role">完成</div>
              <div class="step-approver">{{ currentRequest.status === 'approved' ? '已完成' : '等待中' }}</div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useMallStore } from '@/stores/mall'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { ArrowRight } from '@element-plus/icons-vue'
import type { SwapRequest, CleaningSchedule } from '@/types'

const store = useMallStore()

const statusFilter = ref('')
const approvalDialogVisible = ref(false)
const flowDialogVisible = ref(false)
const isReject = ref(false)
const currentRequest = ref<SwapRequest | null>(null)
const approvalFormRef = ref<FormInstance>()

const approvalForm = reactive({
  comment: ''
})

const approvalRules: FormRules = {
  comment: [
    {
      validator: (_rule, value, callback) => {
        if (isReject.value && !value) {
          callback(new Error('请输入驳回原因'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const shiftText: Record<string, string> = {
  morning: '早班',
  afternoon: '中班',
  night: '晚班'
}

const shiftTagType: Record<string, string> = {
  morning: 'primary',
  afternoon: 'warning',
  night: 'info'
}

const statusText: Record<string, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回'
}

const statusTagType: Record<string, string> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger'
}

const filteredRequests = computed(() => {
  if (!statusFilter.value) {
    return store.swapRequests
  }
  return store.swapRequests.filter(r => r.status === statusFilter.value)
})

function getScheduleById(scheduleId: string): CleaningSchedule | undefined {
  return store.cleaningSchedules.find(s => s.id === scheduleId)
}

function handleView(row: SwapRequest) {
  currentRequest.value = row
  flowDialogVisible.value = true
}

function handleApprove(row: SwapRequest) {
  isReject.value = false
  currentRequest.value = row
  approvalForm.comment = ''
  approvalDialogVisible.value = true
}

function handleReject(row: SwapRequest) {
  isReject.value = true
  currentRequest.value = row
  approvalForm.comment = ''
  approvalDialogVisible.value = true
}

async function handleSubmitApproval() {
  if (!approvalFormRef.value || !currentRequest.value) return
  const valid = await approvalFormRef.value.validate().catch(() => false)
  if (!valid) return

  if (isReject.value) {
    store.rejectSwap(currentRequest.value.id)
    ElMessage.success('已驳回申请')
  } else {
    store.approveSwap(currentRequest.value.id)
    ElMessage.success('已通过申请')
  }

  approvalDialogVisible.value = false
}
</script>

<style scoped lang="scss">
.swap-approval {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      font-size: 16px;
      font-weight: 600;
    }
  }

  .schedule-info {
    font-size: 12px;
    line-height: 1.8;

    .label {
      color: #64748b;
      margin-right: 6px;
    }
  }

  .flow-detail {
    .info-section {
      margin-bottom: 24px;

      .info-title {
        font-size: 14px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid #e2e8f0;
      }

      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;

        .info-item {
          display: flex;
          align-items: center;
          gap: 8px;

          .label {
            color: #64748b;
            min-width: 70px;
          }

          .value {
            font-weight: 500;
            color: #1e293b;
          }
        }
      }

      .reason-text {
        padding: 12px;
        background: #f8fafc;
        border-radius: 6px;
        color: #475569;
        line-height: 1.6;
      }
    }
  }
}
</style>
