<template>
  <div class="approval-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">入驻审批管理</span>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="新商户入驻申请" name="newTenant">
          <el-table :data="filteredNewTenantApplications" stripe border>
            <el-table-column prop="shopName" label="商铺名称" min-width="120" />
            <el-table-column prop="floor" label="楼层" width="80">
              <template #default="{ row }">
                {{ row.floor }}楼
              </template>
            </el-table-column>
            <el-table-column prop="area" label="面积(㎡)" width="100" />
            <el-table-column prop="category" label="业态" width="100" />
            <el-table-column prop="tenantName" label="租户名称" min-width="120" />
            <el-table-column prop="phone" label="联系方式" width="130" />
            <el-table-column label="拟租赁期限" min-width="200">
              <template #default="{ row }">
                {{ row.proposedStart }} ~ {{ row.proposedEnd }}
              </template>
            </el-table-column>
            <el-table-column prop="proposedRent" label="拟月租金" width="120">
              <template #default="{ row }">
                ¥{{ row.proposedRent.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column label="当前状态" width="120">
              <template #default="{ row }">
                <el-tag :type="newTenantStatusType[row.status as keyof typeof newTenantStatusText]" effect="dark">
                  {{ newTenantStatusText[row.status as keyof typeof newTenantStatusText] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="当前审批" width="120">
              <template #default="{ row }">
                <span v-if="row.status !== 'approved' && row.status !== 'rejected'">
                  {{ row.approvals[row.currentStep - 1]?.role || '-' }}
                </span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="申请时间" width="170" />
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="handleViewDetail('newTenant', row)">详情</el-button>
                <el-button 
                  type="success" 
                  link 
                  v-if="canApprove(row)"
                  @click="handleApprove('newTenant', row)"
                >
                  通过
                </el-button>
                <el-button 
                  type="danger" 
                  link 
                  v-if="canApprove(row)"
                  @click="handleReject('newTenant', row)"
                >
                  驳回
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="续约申请" name="renewal">
          <el-table :data="filteredRenewalApplications" stripe border>
            <el-table-column prop="shopName" label="商铺名称" min-width="120" />
            <el-table-column prop="tenantName" label="租户名称" min-width="120" />
            <el-table-column prop="currentContractEnd" label="原合同到期" width="120" />
            <el-table-column label="拟续约期限" min-width="200">
              <template #default="{ row }">
                {{ row.proposedStart }} ~ {{ row.proposedEnd }}
              </template>
            </el-table-column>
            <el-table-column prop="proposedRent" label="拟月租金" width="120">
              <template #default="{ row }">
                ¥{{ row.proposedRent.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column label="当前状态" width="120">
              <template #default="{ row }">
                <el-tag :type="renewalStatusType[row.status as keyof typeof renewalStatusText]" effect="dark">
                  {{ renewalStatusText[row.status as keyof typeof renewalStatusText] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="当前审批" width="120">
              <template #default="{ row }">
                <span v-if="row.status === 'pending'">
                  {{ getCurrentRenewalApproval(row)?.role || '-' }}
                </span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="申请时间" width="170" />
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="handleViewDetail('renewal', row)">详情</el-button>
                <el-button 
                  type="success" 
                  link 
                  v-if="canApproveRenewal(row)"
                  @click="handleApprove('renewal', row)"
                >
                  通过
                </el-button>
                <el-button 
                  type="danger" 
                  link 
                  v-if="canApproveRenewal(row)"
                  @click="handleReject('renewal', row)"
                >
                  驳回
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="detailDialogVisible" title="申请详情" width="700px">
      <div v-if="currentApplication" class="detail-content">
        <el-descriptions v-if="applicationType === 'newTenant'" :column="2" border>
          <el-descriptions-item label="商铺名称">{{ (currentApplication as NewTenantApplication).shopName }}</el-descriptions-item>
          <el-descriptions-item label="租户名称">{{ (currentApplication as NewTenantApplication).tenantName }}</el-descriptions-item>
          <el-descriptions-item label="楼层">{{ (currentApplication as NewTenantApplication).floor }}楼</el-descriptions-item>
          <el-descriptions-item label="面积">{{ (currentApplication as NewTenantApplication).area }}㎡</el-descriptions-item>
          <el-descriptions-item label="业态">{{ (currentApplication as NewTenantApplication).category }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ (currentApplication as NewTenantApplication).contact }}</el-descriptions-item>
          <el-descriptions-item label="联系方式">{{ (currentApplication as NewTenantApplication).phone }}</el-descriptions-item>
          <el-descriptions-item label="营业执照">{{ (currentApplication as NewTenantApplication).businessLicense }}</el-descriptions-item>
          <el-descriptions-item label="拟租赁期限" :span="2">
            {{ (currentApplication as NewTenantApplication).proposedStart }} ~ {{ (currentApplication as NewTenantApplication).proposedEnd }}
          </el-descriptions-item>
          <el-descriptions-item label="拟月租金">¥{{ currentApplication.proposedRent.toLocaleString() }}</el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ currentApplication.createTime }}</el-descriptions-item>
          <el-descriptions-item label="状态" :span="2">
            <el-tag :type="applicationType === 'newTenant' ? newTenantStatusType[(currentApplication as NewTenantApplication).status] : renewalStatusType[(currentApplication as RenewalApplication).status]" effect="dark">
              {{ applicationType === 'newTenant' ? newTenantStatusText[(currentApplication as NewTenantApplication).status] : renewalStatusText[(currentApplication as RenewalApplication).status] }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <el-descriptions v-else :column="2" border>
          <el-descriptions-item label="商铺名称">{{ (currentApplication as RenewalApplication).shopName }}</el-descriptions-item>
          <el-descriptions-item label="租户名称">{{ (currentApplication as RenewalApplication).tenantName }}</el-descriptions-item>
          <el-descriptions-item label="原合同到期">{{ (currentApplication as RenewalApplication).currentContractEnd }}</el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ currentApplication.createTime }}</el-descriptions-item>
          <el-descriptions-item label="拟续约期限" :span="2">
            {{ currentApplication.proposedStart }} ~ {{ currentApplication.proposedEnd }}
          </el-descriptions-item>
          <el-descriptions-item label="拟月租金">¥{{ currentApplication.proposedRent.toLocaleString() }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="renewalStatusType[(currentApplication as RenewalApplication).status]" effect="dark">
              {{ renewalStatusText[(currentApplication as RenewalApplication).status] }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div class="approval-flow">
          <h4>审批流程</h4>
          <div class="timeline">
            <div 
              v-for="approval in currentApplication.approvals" 
              :key="approval.step" 
              class="timeline-item"
              :class="{ 
                'is-active': getStepStatus(approval) === 'process', 
                'is-done': getStepStatus(approval) === 'finish', 
                'is-rejected': getStepStatus(approval) === 'error' 
              }"
            >
              <div class="timeline-node">
                <el-icon v-if="getStepStatus(approval) === 'finish'"><CircleCheckFilled /></el-icon>
                <el-icon v-else-if="getStepStatus(approval) === 'error'"><CircleCloseFilled /></el-icon>
                <span v-else>{{ approval.step }}</span>
              </div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="role">{{ approval.role }}</span>
                  <span class="status">{{ getApprovalStatusText(approval.status) }}</span>
                </div>
                <div v-if="approval.approver" class="approver">审批人: {{ approval.approver }}</div>
                <div v-if="approval.comment" class="comment">意见: {{ approval.comment }}</div>
                <div v-if="approval.time" class="time">{{ approval.time }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button 
          type="success" 
          v-if="canApproveCurrent()"
          @click="handleApproveCurrent"
        >
          <el-icon><Check /></el-icon>
          审批通过
        </el-button>
        <el-button 
          type="danger" 
          v-if="canApproveCurrent()"
          @click="handleRejectCurrent"
        >
          <el-icon><Close /></el-icon>
          审批驳回
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="approvalDialogVisible" :title="isReject ? '审批驳回' : '审批通过'" width="500px">
      <el-form :model="approvalForm" :rules="approvalRules" ref="approvalFormRef" label-width="80px">
        <el-form-item label="审批意见" prop="comment">
          <el-input 
            v-model="approvalForm.comment" 
            type="textarea" 
            :rows="4" 
            :placeholder="isReject ? '请输入驳回原因' : '请输入审批意见（选填）'"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approvalDialogVisible = false">取消</el-button>
        <el-button :type="isReject ? 'danger' : 'success'" @click="handleSubmitApproval">
          {{ isReject ? '确认驳回' : '确认通过' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMallStore } from '@/stores/mall'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Check, Close, CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import type { NewTenantApplication, RenewalApplication, ApprovalRecord } from '@/types'

const store = useMallStore()

const activeTab = ref('newTenant')
const statusFilter = ref('')

const applicationType = ref<'newTenant' | 'renewal'>('newTenant')
const currentApplication = ref<NewTenantApplication | RenewalApplication | null>(null)
const detailDialogVisible = ref(false)
const approvalDialogVisible = ref(false)
const isReject = ref(false)
const approvalFormRef = ref<FormInstance>()

const approvalForm = ref({
  comment: ''
})

const approvalRules: FormRules = {
  comment: [
    { 
      validator: (_rule, value, callback) => {
        if (isReject.value && !value.trim()) {
          callback(new Error('请输入驳回原因'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const filteredNewTenantApplications = computed(() => {
  if (!statusFilter.value) return store.newTenantApplications
  return store.newTenantApplications.filter(a => a.status === statusFilter.value)
})

const filteredRenewalApplications = computed(() => {
  if (!statusFilter.value) return store.renewalApplications
  return store.renewalApplications.filter(a => a.status === statusFilter.value)
})

const newTenantStatusType: Record<NewTenantApplication['status'], string> = {
  pending: 'info',
  floor_manager: 'warning',
  operation_manager: 'warning',
  gm: 'warning',
  approved: 'success',
  rejected: 'danger'
}

const newTenantStatusText: Record<NewTenantApplication['status'], string> = {
  pending: '待提交',
  floor_manager: '楼层经理审批',
  operation_manager: '运营经理审批',
  gm: '总经理审批',
  approved: '已通过',
  rejected: '已驳回'
}

const renewalStatusType: Record<RenewalApplication['status'], string> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  completed: 'success'
}

const renewalStatusText: Record<RenewalApplication['status'], string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
  completed: '已完成'
}

function handleTabChange(tab: string) {
  activeTab.value = tab
}

function canApprove(row: NewTenantApplication): boolean {
  return row.status !== 'approved' && row.status !== 'rejected'
}

function canApproveRenewal(row: RenewalApplication): boolean {
  return row.status === 'pending'
}

function getCurrentRenewalApproval(row: RenewalApplication): ApprovalRecord | undefined {
  return row.approvals.find(a => a.status === 'pending')
}

function getCurrentStep(application: NewTenantApplication | RenewalApplication): number {
  if ('currentStep' in application) {
    return application.currentStep ?? 1
  }
  const pendingIndex = application.approvals.findIndex(a => a.status === 'pending')
  return pendingIndex === -1 ? application.approvals.length : pendingIndex + 1
}

function getStepStatus(approval: ApprovalRecord): string {
  if (approval.status === 'approved') return 'finish'
  if (approval.status === 'rejected') return 'error'
  if (approval.status === 'pending') return 'wait'
  return 'wait'
}

function getApprovalStatusText(status: ApprovalRecord['status']): string {
  const map = { pending: '待审批', approved: '已通过', rejected: '已驳回' }
  return map[status]
}

function handleViewDetail(type: 'newTenant' | 'renewal', row: NewTenantApplication | RenewalApplication) {
  applicationType.value = type
  currentApplication.value = row
  detailDialogVisible.value = true
}

function handleApprove(type: 'newTenant' | 'renewal', row: NewTenantApplication | RenewalApplication) {
  applicationType.value = type
  currentApplication.value = row
  isReject.value = false
  approvalForm.value = { comment: '' }
  approvalDialogVisible.value = true
}

function handleReject(type: 'newTenant' | 'renewal', row: NewTenantApplication | RenewalApplication) {
  applicationType.value = type
  currentApplication.value = row
  isReject.value = true
  approvalForm.value = { comment: '' }
  approvalDialogVisible.value = true
}

function canApproveCurrent(): boolean {
  if (!currentApplication.value) return false
  if (applicationType.value === 'newTenant') {
    const app = currentApplication.value as NewTenantApplication
    return app.status !== 'approved' && app.status !== 'rejected'
  } else {
    const app = currentApplication.value as RenewalApplication
    return app.status === 'pending'
  }
}

function handleApproveCurrent() {
  if (!currentApplication.value) return
  isReject.value = false
  approvalForm.value = { comment: '' }
  approvalDialogVisible.value = true
}

function handleRejectCurrent() {
  if (!currentApplication.value) return
  isReject.value = true
  approvalForm.value = { comment: '' }
  approvalDialogVisible.value = true
}

async function handleSubmitApproval() {
  if (!approvalFormRef.value || !currentApplication.value) return
  
  const valid = await approvalFormRef.value.validate().catch(() => false)
  if (!valid) return

  const step = getCurrentStep(currentApplication.value)

  if (isReject.value) {
    store.rejectApplication(
      applicationType.value,
      currentApplication.value.id,
      step,
      approvalForm.value.comment
    )
    ElMessage.success('已驳回')
  } else {
    store.approveApplication(
      applicationType.value,
      currentApplication.value.id,
      step,
      approvalForm.value.comment || '同意'
    )
    ElMessage.success('已通过')
  }

  approvalDialogVisible.value = false
  detailDialogVisible.value = false
}
</script>

<style scoped lang="scss">
.approval-management {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      font-size: 16px;
      font-weight: 600;
    }
  }

  .detail-content {
    .approval-flow {
      margin-top: 24px;

      h4 {
        margin: 0 0 16px;
        font-size: 14px;
        font-weight: 600;
      }

      .timeline {
        .timeline-item {
          display: flex;
          gap: 16px;
          padding-bottom: 24px;
          position: relative;

          &:last-child {
            padding-bottom: 0;

            &::before {
              display: none;
            }
          }

          &::before {
            content: '';
            position: absolute;
            left: 14px;
            top: 32px;
            bottom: 0;
            width: 2px;
            background: #e4e7ed;
          }

          &.is-done {
            &::before {
              background: #67c23a;
            }

            .timeline-node {
              background: #67c23a;
              border-color: #67c23a;
              color: #fff;
            }
          }

          &.is-active {
            .timeline-node {
              background: #409eff;
              border-color: #409eff;
              color: #fff;
            }
          }

          &.is-rejected {
            .timeline-node {
              background: #f56c6c;
              border-color: #f56c6c;
              color: #fff;
            }
          }

          .timeline-node {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 2px solid #dcdfe6;
            background: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 600;
            flex-shrink: 0;
            z-index: 1;

            .el-icon {
              font-size: 18px;
            }
          }

          .timeline-content {
            flex: 1;
            padding-top: 4px;

            .timeline-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 4px;

              .role {
                font-weight: 600;
                font-size: 14px;
              }

              .status {
                font-size: 12px;
                padding: 2px 8px;
                border-radius: 4px;
                background: #f0f2f5;
              }
            }

            .approver,
            .comment,
            .time {
              font-size: 12px;
              color: #606266;
              margin-top: 2px;
            }

            .time {
              color: #909399;
            }
          }
        }
      }
    }
  }
}
</style>
