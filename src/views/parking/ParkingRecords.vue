<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">停车记录管理</div>
      <div class="header-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索车牌号"
          clearable
          style="width: 240px; margin-right: 12px"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="statusFilter" placeholder="状态筛选" clearable style="width: 140px; margin-right: 12px">
          <el-option label="停车中" value="parking" />
          <el-option label="已缴费" value="paid" />
          <el-option label="已完成" value="completed" />
        </el-select>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>
    </div>

    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <div class="stat-card blue">
          <div class="stat-label">停车中</div>
          <div class="stat-value">{{ parkingCount }}</div>
          <div class="stat-footer">
            <el-icon><Timer /></el-icon>
            正在停车
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card orange">
          <div class="stat-label">已缴费</div>
          <div class="stat-value">{{ paidCount }}</div>
          <div class="stat-footer">
            <el-icon><Wallet /></el-icon>
            待出场
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card green">
          <div class="stat-label">已完成</div>
          <div class="stat-value">{{ completedCount }}</div>
          <div class="stat-footer">
            <el-icon><CircleCheck /></el-icon>
            已离场
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card purple">
          <div class="stat-label">今日收入</div>
          <div class="stat-value">¥{{ todayRevenue }}</div>
          <div class="stat-footer">
            <el-icon><Money /></el-icon>
            停车收费
          </div>
        </div>
      </el-col>
    </el-row>

    <el-table :data="filteredRecords" stripe style="width: 100%">
      <el-table-column prop="licensePlate" label="车牌号" width="120">
        <template #default="{ row }">
          <span class="plate-number">{{ row.licensePlate }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="spaceId" label="车位号" width="100">
        <template #default="{ row }">
          {{ getSpaceNumber(row.spaceId) }}
        </template>
      </el-table-column>
      <el-table-column label="会员等级" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.memberLevel" :type="getLevelTagType(row.memberLevel)">
            {{ getLevelName(row.memberLevel) }}
          </el-tag>
          <span v-else class="text-gray">临时车</span>
        </template>
      </el-table-column>
      <el-table-column prop="entryTime" label="入场时间" width="180" />
      <el-table-column prop="exitTime" label="出场时间" width="180">
        <template #default="{ row }">
          {{ row.exitTime || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="停车时长" width="120">
        <template #default="{ row }">
          {{ formatDuration(row.duration, row.entryTime) }}
        </template>
      </el-table-column>
      <el-table-column label="费用明细" min-width="200">
        <template #default="{ row }">
          <div v-if="row.status !== 'parking'" class="fee-detail">
            <div class="fee-line">
              <span>总计：</span>
              <span class="fee-total">¥{{ row.totalFee }}</span>
            </div>
            <div v-if="row.discount > 0" class="fee-line discount">
              <span>会员减免：</span>
              <span>-¥{{ row.discount }}</span>
              <el-tag size="small" :type="getLevelTagType(row.memberLevel || '')">
                {{ getLevelName(row.memberLevel || '') }}
              </el-tag>
            </div>
            <div class="fee-line actual">
              <span>实收：</span>
              <span class="fee-actual">¥{{ row.actualFee }}</span>
            </div>
          </div>
          <div v-else class="fee-detail">
            <el-tag type="info">计费中...</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <span :class="['status-tag', getStatusClass(row.status)]">
            {{ getStatusName(row.status) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="row.status === 'parking'"
            type="primary"
            size="small"
            @click="handleExit(row)"
          >
            出场结算
          </el-button>
          <el-button
            v-else-if="row.status === 'paid'"
            type="success"
            size="small"
            @click="handleComplete(row)"
          >
            确认出场
          </el-button>
          <el-button
            type="info"
            size="small"
            @click="handleViewDetail(row)"
          >
            详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[10, 20, 50, 100]"
      :total="filteredRecords.length"
      layout="total, sizes, prev, pager, next, jumper"
      style="margin-top: 20px; justify-content: flex-end"
    />

    <el-dialog v-model="exitDialogVisible" title="出场结算" width="600px">
      <el-form v-if="currentRecord" label-width="120px">
        <el-form-item label="车牌号">
          <el-input :model-value="currentRecord.licensePlate" disabled />
        </el-form-item>
        <el-form-item label="入场时间">
          <el-input :model-value="currentRecord.entryTime" disabled />
        </el-form-item>
        <el-form-item label="出场时间">
          <el-input :model-value="exitTime" disabled />
        </el-form-item>
        <el-form-item label="停车时长">
          <el-input :model-value="formatDuration(currentRecord.duration, currentRecord.entryTime)" disabled />
        </el-form-item>
        <el-form-item v-if="currentRecord.memberLevel" label="会员等级">
          <el-tag :type="getLevelTagType(currentRecord.memberLevel)">
            {{ getLevelName(currentRecord.memberLevel) }} - 免费 {{ getFreeHours(currentRecord.memberLevel) }} 小时
          </el-tag>
        </el-form-item>
        <el-divider />
        <el-form-item label="费用计算">
          <div class="fee-calculation">
            <div class="calc-row">
              <span>基础费用：</span>
              <span>¥{{ feeInfo.totalFee }}</span>
            </div>
            <div v-if="feeInfo.discount > 0" class="calc-row discount">
              <span>会员减免：</span>
              <span>-¥{{ feeInfo.discount }}</span>
            </div>
            <div class="calc-row total">
              <span>应缴费用：</span>
              <span class="amount">¥{{ feeInfo.actualFee }}</span>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exitDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmExit">
          确认缴费出场
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMallStore } from '@/stores/mall'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Timer, Wallet, CircleCheck, Money } from '@element-plus/icons-vue'
import type { ParkingRecord, Member } from '@/types'
import dayjs from 'dayjs'

const mallStore = useMallStore()

const searchKeyword = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const exitDialogVisible = ref(false)
const currentRecord = ref<ParkingRecord | null>(null)
const exitTime = ref('')
const feeInfo = ref({ totalFee: 0, discount: 0, actualFee: 0 })

const parkingCount = computed(() =>
  mallStore.parkingRecords.filter(r => r.status === 'parking').length
)

const paidCount = computed(() =>
  mallStore.parkingRecords.filter(r => r.status === 'paid').length
)

const completedCount = computed(() =>
  mallStore.parkingRecords.filter(r => r.status === 'completed').length
)

const todayRevenue = computed(() =>
  mallStore.parkingRecords
    .filter(r => r.status === 'completed' || r.status === 'paid')
    .reduce((sum, r) => sum + r.actualFee, 0)
)

const filteredRecords = computed(() => {
  let records = [...mallStore.parkingRecords]
  if (searchKeyword.value) {
    records = records.filter(r =>
      r.licensePlate.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }
  if (statusFilter.value) {
    records = records.filter(r => r.status === statusFilter.value)
  }
  return records.sort((a, b) =>
    dayjs(b.entryTime).valueOf() - dayjs(a.entryTime).valueOf()
  )
})

const getSpaceNumber = (spaceId: string) => {
  const space = mallStore.parkingSpaces.find(s => s.id === spaceId)
  return space?.number || spaceId
}

const getLevelName = (level: string) => {
  const map: Record<string, string> = {
    diamond: '钻石',
    platinum: '铂金',
    gold: '黄金',
    silver: '银卡',
    normal: '普通'
  }
  return map[level] || '-'
}

const getLevelTagType = (level: string) => {
  const map: Record<string, any> = {
    diamond: 'danger',
    platinum: 'warning',
    gold: 'warning',
    silver: 'info',
    normal: ''
  }
  return map[level] || 'info'
}

const getFreeHours = (level: string) => {
  const map: Record<string, number> = {
    normal: 0,
    silver: 2,
    gold: 4,
    platinum: 6,
    diamond: 8
  }
  return map[level] || 0
}

const getStatusName = (status: string) => {
  const map: Record<string, string> = {
    parking: '停车中',
    paid: '已缴费',
    completed: '已完成'
  }
  return map[status] || status
}

const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    parking: 'warning',
    paid: 'info',
    completed: 'success'
  }
  return map[status] || 'default'
}

const formatDuration = (duration?: number, entryTime?: string) => {
  if (duration !== undefined) {
    const hours = Math.floor(duration / 60)
    const minutes = duration % 60
    return `${hours}小时${minutes}分钟`
  }
  if (entryTime) {
    const diff = dayjs().diff(dayjs(entryTime), 'minute')
    const hours = Math.floor(diff / 60)
    const minutes = diff % 60
    return `${hours}小时${minutes}分钟`
  }
  return '-'
}

const handleSearch = () => {
  currentPage.value = 1
  ElMessage.success('搜索完成')
}

const handleExit = (record: ParkingRecord) => {
  currentRecord.value = record
  exitTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss')
  feeInfo.value = mallStore.calculateParkingFee(
    record.entryTime,
    record.memberLevel as Member['level']
  )
  exitDialogVisible.value = true
}

const handleConfirmExit = () => {
  if (currentRecord.value) {
    mallStore.processParkingExit(currentRecord.value.licensePlate)
    ElMessage.success(`车辆 ${currentRecord.value.licensePlate} 已完成结算`)
    exitDialogVisible.value = false
    currentRecord.value = null
  }
}

const handleComplete = (record: ParkingRecord) => {
  ElMessageBox.confirm(`确认车辆 ${record.licensePlate} 已出场？`, '确认出场', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'info'
  }).then(() => {
    const idx = mallStore.parkingRecords.findIndex(r => r.id === record.id)
    if (idx > -1) {
      mallStore.parkingRecords[idx].status = 'completed'
    }
    ElMessage.success('出场确认成功')
  }).catch(() => {})
}

const handleViewDetail = (record: ParkingRecord) => {
  ElMessageBox.alert(
    `
    <div style="text-align: left;">
      <p><strong>车牌号：</strong>${record.licensePlate}</p>
      <p><strong>车位号：</strong>${getSpaceNumber(record.spaceId)}</p>
      <p><strong>入场时间：</strong>${record.entryTime}</p>
      <p><strong>出场时间：</strong>${record.exitTime || '-'}</p>
      <p><strong>停车时长：</strong>${formatDuration(record.duration, record.entryTime)}</p>
      <p><strong>会员等级：</strong>${getLevelName(record.memberLevel || '')}</p>
      <p><strong>总费用：</strong>¥${record.totalFee}</p>
      <p><strong>会员减免：</strong>¥${record.discount}</p>
      <p><strong>实际收费：</strong>¥${record.actualFee}</p>
      <p><strong>状态：</strong>${getStatusName(record.status)}</p>
    </div>
    `,
    '停车详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭'
    }
  )
}
</script>

<style lang="scss" scoped>
.stats-row {
  margin-bottom: 24px;
}

.header-actions {
  display: flex;
  align-items: center;
}

.plate-number {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #1e40af;
}

.text-gray {
  color: #94a3b8;
}

.fee-detail {
  font-size: 12px;

  .fee-line {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 2px;

    &.discount {
      color: #059669;
    }

    &.actual {
      font-weight: 600;
      margin-top: 4px;
    }
  }

  .fee-total {
    color: #64748b;
    text-decoration: line-through;
  }

  .fee-actual {
    color: #dc2626;
    font-size: 14px;
  }
}

.fee-calculation {
  width: 100%;
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;

  .calc-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    font-size: 14px;

    &.discount {
      color: #059669;
    }

    &.total {
      border-top: 1px solid #e2e8f0;
      margin-top: 8px;
      padding-top: 16px;
      font-weight: 600;
      font-size: 16px;

      .amount {
        color: #dc2626;
        font-size: 20px;
      }
    }
  }
}
</style>
