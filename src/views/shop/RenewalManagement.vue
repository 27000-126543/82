<template>
  <div class="renewal-management">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="8">
        <el-card class="stat-card expiring">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ expiringCount }}</div>
              <div class="stat-label">即将到期</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card pending">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ pendingCount }}</div>
              <div class="stat-label">续约中</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card completed">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ completedCount }}</div>
              <div class="stat-label">已完成</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="mt-20">
      <template #header>
        <div class="card-header">
          <span class="title">待续约商铺</span>
        </div>
      </template>

      <el-table :data="expiringShops" stripe border>
        <el-table-column prop="name" label="商铺名称" min-width="120" />
        <el-table-column prop="floor" label="楼层" width="80">
          <template #default="{ row }">
            {{ row.floor }}楼
          </template>
        </el-table-column>
        <el-table-column prop="category" label="业态" width="100" />
        <el-table-column prop="tenantName" label="租户名称" min-width="120" />
        <el-table-column prop="phone" label="联系方式" width="130" />
        <el-table-column prop="contractEnd" label="合同到期日" width="120" />
        <el-table-column label="剩余天数" width="100">
          <template #default="{ row }">
            <el-tag :type="getRemainingDays(row.contractEnd) <= 30 ? 'danger' : 'warning'" effect="dark">
              {{ getRemainingDays(row.contractEnd) }}天
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="monthlyRent" label="当前月租金" width="120">
          <template #default="{ row }">
            ¥{{ row.monthlyRent.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="月营收" width="130">
          <template #default="{ row }">
            ¥{{ row.businessData.monthlyRevenue.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              link 
              :disabled="hasPendingApplication(row.id)"
              @click="handleCreateRenewal(row)"
            >
              {{ hasPendingApplication(row.id) ? '申请中' : '发起续约' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card class="mt-20">
      <template #header>
        <div class="card-header">
          <span class="title">续约申请列表</span>
          <el-select v-model="statusFilter" placeholder="状态筛选" style="width: 150px">
            <el-option label="全部" value="" />
            <el-option label="待审批" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已驳回" value="rejected" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </div>
      </template>

      <el-table :data="filteredApplications" stripe border>
        <el-table-column prop="shopName" label="商铺名称" min-width="120" />
        <el-table-column prop="tenantName" label="租户名称" min-width="120" />
        <el-table-column prop="currentContractEnd" label="原合同到期" width="120" />
        <el-table-column label="拟续约期限" min-width="220">
          <template #default="{ row }">
            {{ row.proposedStart }} ~ {{ row.proposedEnd }}
          </template>
        </el-table-column>
        <el-table-column prop="proposedRent" label="拟月租金" width="120">
          <template #default="{ row }">
            ¥{{ row.proposedRent.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="applicationStatusType[row.status as keyof typeof applicationStatusType]" effect="dark">
              {{ applicationStatusText[row.status as keyof typeof applicationStatusText] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="当前进度" min-width="200">
          <template #default="{ row }">
            <el-steps :active="getCurrentStep(row)" :space="100" align-center size="small">
              <el-step 
                v-for="approval in row.approvals" 
                :key="approval.step" 
                :title="approval.role"
                :status="getStepStatus(approval)"
              />
            </el-steps>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="申请时间" width="170" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="renewalDialogVisible" title="发起续约申请" width="500px">
      <el-form :model="renewalForm" :rules="renewalRules" ref="renewalFormRef" label-width="100px">
        <el-form-item label="商铺名称">
          <el-input v-model="renewalForm.shopName" disabled />
        </el-form-item>
        <el-form-item label="租户名称">
          <el-input v-model="renewalForm.tenantName" disabled />
        </el-form-item>
        <el-form-item label="原合同到期">
          <el-input v-model="renewalForm.currentContractEnd" disabled />
        </el-form-item>
        <el-form-item label="续约开始" prop="proposedStart">
          <el-date-picker 
            v-model="renewalForm.proposedStart" 
            type="date" 
            placeholder="选择开始日期" 
            value-format="YYYY-MM-DD" 
            style="width: 100%" 
          />
        </el-form-item>
        <el-form-item label="续约结束" prop="proposedEnd">
          <el-date-picker 
            v-model="renewalForm.proposedEnd" 
            type="date" 
            placeholder="选择结束日期" 
            value-format="YYYY-MM-DD" 
            style="width: 100%" 
          />
        </el-form-item>
        <el-form-item label="拟月租金(元)" prop="proposedRent">
          <el-input-number 
            v-model="renewalForm.proposedRent" 
            :min="0" 
            :max="10000000" 
            style="width: 100%" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="renewalDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitRenewal">提交申请</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="续约申请详情" width="600px">
      <div v-if="currentApplication" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="商铺名称">{{ currentApplication.shopName }}</el-descriptions-item>
          <el-descriptions-item label="租户名称">{{ currentApplication.tenantName }}</el-descriptions-item>
          <el-descriptions-item label="原合同到期">{{ currentApplication.currentContractEnd }}</el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ currentApplication.createTime }}</el-descriptions-item>
          <el-descriptions-item label="拟续约期限">{{ currentApplication.proposedStart }} ~ {{ currentApplication.proposedEnd }}</el-descriptions-item>
          <el-descriptions-item label="拟月租金">¥{{ currentApplication.proposedRent.toLocaleString() }}</el-descriptions-item>
          <el-descriptions-item label="状态" :span="2">
            <el-tag :type="applicationStatusType[currentApplication.status]" effect="dark">
              {{ applicationStatusText[currentApplication.status] }}
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
              :class="{ 'is-active': getStepStatus(approval) === 'process', 'is-done': getStepStatus(approval) === 'finish', 'is-rejected': getStepStatus(approval) === 'error' }"
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
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMallStore } from '@/stores/mall'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Clock, Document, CircleCheck, CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import type { Shop, RenewalApplication, ApprovalRecord } from '@/types'

const store = useMallStore()

const statusFilter = ref('')

const expiringShops = computed(() => store.expiringShops)

const expiringCount = computed(() => store.expiringShops.length)

const pendingCount = computed(() => 
  store.renewalApplications.filter(a => a.status === 'pending').length
)

const completedCount = computed(() => 
  store.renewalApplications.filter(a => a.status === 'approved' || a.status === 'completed').length
)

const filteredApplications = computed(() => {
  if (!statusFilter.value) return store.renewalApplications
  return store.renewalApplications.filter(a => a.status === statusFilter.value)
})

const applicationStatusType: Record<RenewalApplication['status'], string> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  completed: 'success'
}

const applicationStatusText: Record<RenewalApplication['status'], string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
  completed: '已完成'
}

function getRemainingDays(endDate: string): number {
  return dayjs(endDate).diff(dayjs(), 'day')
}

function hasPendingApplication(shopId: string): boolean {
  return store.renewalApplications.some(
    a => a.shopId === shopId && (a.status === 'pending' || a.status === 'approved')
  )
}

function getCurrentStep(app: RenewalApplication): number {
  const pendingIndex = app.approvals.findIndex(a => a.status === 'pending')
  if (pendingIndex === -1) {
    return app.status === 'rejected' 
      ? app.approvals.findIndex(a => a.status === 'rejected') + 1
      : app.approvals.length
  }
  return pendingIndex
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

const renewalDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const currentShop = ref<Shop | null>(null)
const currentApplication = ref<RenewalApplication | null>(null)
const renewalFormRef = ref<FormInstance>()

const renewalForm = ref({
  shopId: '',
  shopName: '',
  tenantName: '',
  currentContractEnd: '',
  proposedStart: '',
  proposedEnd: '',
  proposedRent: 0
})

const renewalRules: FormRules = {
  proposedStart: [{ required: true, message: '请选择续约开始日期', trigger: 'change' }],
  proposedEnd: [{ required: true, message: '请选择续约结束日期', trigger: 'change' }],
  proposedRent: [{ required: true, message: '请输入拟月租金', trigger: 'blur' }]
}

function handleCreateRenewal(shop: Shop) {
  currentShop.value = shop
  renewalForm.value = {
    shopId: shop.id,
    shopName: shop.name,
    tenantName: shop.tenantName,
    currentContractEnd: shop.contractEnd,
    proposedStart: dayjs(shop.contractEnd).add(1, 'day').format('YYYY-MM-DD'),
    proposedEnd: dayjs(shop.contractEnd).add(3, 'year').format('YYYY-MM-DD'),
    proposedRent: Math.round(shop.monthlyRent * 1.05)
  }
  renewalDialogVisible.value = true
}

async function handleSubmitRenewal() {
  if (!renewalFormRef.value || !currentShop.value) return
  const valid = await renewalFormRef.value.validate().catch(() => false)
  if (!valid) return

  store.createRenewalApplication(
    currentShop.value.id,
    renewalForm.value.proposedStart,
    renewalForm.value.proposedEnd,
    renewalForm.value.proposedRent
  )

  ElMessage.success('续约申请已提交')
  renewalDialogVisible.value = false
}

function handleViewDetail(app: RenewalApplication) {
  currentApplication.value = app
  detailDialogVisible.value = true
}
</script>

<style scoped lang="scss">
.renewal-management {
  .stats-row {
    margin-bottom: 20px;
  }

  .stat-card {
    .stat-content {
      display: flex;
      align-items: center;
      gap: 20px;

      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        color: #fff;

        .el-icon {
          font-size: 32px;
        }
      }

      .stat-info {
        .stat-value {
          font-size: 28px;
          font-weight: 700;
          line-height: 1.2;
        }

        .stat-label {
          font-size: 14px;
          color: #909399;
          margin-top: 4px;
        }
      }
    }

    &.expiring .stat-icon {
      background: linear-gradient(135deg, #e6a23c, #f56c6c);
    }

    &.pending .stat-icon {
      background: linear-gradient(135deg, #409eff, #67c23a);
    }

    &.completed .stat-icon {
      background: linear-gradient(135deg, #67c23a, #909399);
    }
  }

  .mt-20 {
    margin-top: 20px;
  }

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
