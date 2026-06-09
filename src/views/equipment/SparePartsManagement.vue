<template>
  <div class="spare-parts-management">
    <div class="page-header">
      <h2>备件管理</h2>
      <el-button type="primary" @click="openRestockDialog">
        <component :is="'Plus'" style="margin-right: 6px;" />
        采购入库
      </el-button>
    </div>

    <el-card v-if="store.lowStockParts.length > 0" class="warning-card">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <component :is="'Warning'" class="warning-icon" />
            <span>低库存预警</span>
            <el-tag type="danger" size="small" effect="dark">
              {{ store.lowStockParts.length }} 项
            </el-tag>
          </div>
        </div>
      </template>
      <div class="warning-list">
        <div
          v-for="part in store.lowStockParts"
          :key="part.id"
          class="warning-item"
          :class="getStockUrgencyClass(part)"
        >
          <div class="warning-info">
            <span class="part-name">{{ part.name }}</span>
            <span class="part-spec">({{ part.spec }})</span>
          </div>
          <div class="stock-info">
            <span class="current-stock">当前: {{ part.quantity }}{{ part.unit }}</span>
            <span class="safe-stock">/ 安全库存: {{ part.safeStock }}{{ part.unit }}</span>
          </div>
          <el-button type="primary" size="small" @click="quickRestock(part)">
            立即补货
          </el-button>
        </div>
      </div>
    </el-card>

    <el-card class="table-card">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="库存状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width: 140px;">
            <el-option label="充足" value="sufficient" />
            <el-option label="不足" value="insufficient" />
            <el-option label="紧缺" value="critical" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="filterForm.keyword"
            placeholder="搜索备件名称/规格"
            clearable
            style="width: 200px;"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="applyFilter">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="filteredParts" stripe style="width: 100%; margin-top: 20px;">
        <el-table-column prop="id" label="编号" width="100" />
        <el-table-column prop="name" label="备件名称" width="140" />
        <el-table-column prop="spec" label="规格" width="120" />
        <el-table-column label="库存数量" width="140">
          <template #default="{ row }">
            <span :class="getStockQuantityClass(row)">
              {{ row.quantity }} {{ row.unit }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="安全库存" width="120">
          <template #default="{ row }">
            {{ row.safeStock }} {{ row.unit }}
          </template>
        </el-table-column>
        <el-table-column label="库存状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStockStatusType(row)" effect="dark" size="small">
              {{ getStockStatusText(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="库位" width="120" />
        <el-table-column prop="lastRestock" label="上次补货" width="160" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              link
              @click="openRestockDialog(row)"
            >
              补货
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="restockDialogVisible"
      :title="isQuickRestock ? '快速补货' : '采购入库'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="restockForm" :rules="restockRules" ref="restockFormRef" label-width="100px">
        <el-form-item v-if="!isQuickRestock" label="选择备件" prop="partId">
          <el-select v-model="restockForm.partId" placeholder="请选择备件" style="width: 100%;" @change="onPartChange">
            <el-option
              v-for="part in store.spareParts"
              :key="part.id"
              :label="`${part.name} (${part.spec}) - 当前库存: ${part.quantity}${part.unit}`"
              :value="part.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="isQuickRestock && currentPart" label="备件名称">
          <el-input :value="`${currentPart.name} (${currentPart.spec})`" disabled />
        </el-form-item>
        <el-form-item v-if="isQuickRestock && currentPart" label="当前库存">
          <el-input :value="`${currentPart.quantity} ${currentPart.unit}`" disabled />
        </el-form-item>
        <el-form-item label="补货数量" prop="quantity">
          <el-input-number
            v-model="restockForm.quantity"
            :min="1"
            :max="1000"
            style="width: 100%;"
          />
          <span v-if="currentPart" style="margin-left: 8px; color: #64748b;">
            {{ currentPart.unit }}
          </span>
        </el-form-item>
        <el-form-item v-if="!isQuickRestock" label="供应商">
          <el-input v-model="restockForm.supplier" placeholder="请输入供应商名称" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="restockForm.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="restockDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRestock">确认入库</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useMallStore } from '@/stores/mall'
import type { SparePart } from '@/types'
import dayjs from 'dayjs'

const store = useMallStore()

const restockDialogVisible = ref(false)
const isQuickRestock = ref(false)
const currentPart = ref<SparePart | null>(null)
const restockFormRef = ref<FormInstance>()

const filterForm = reactive({
  status: '',
  keyword: ''
})

const restockForm = reactive({
  partId: '',
  quantity: 1,
  supplier: '',
  remark: ''
})

const restockRules = computed<FormRules>(() => ({
  partId: isQuickRestock.value ? [] : [{ required: true, message: '请选择备件', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入补货数量', trigger: 'blur' }]
}))

const filteredParts = computed(() => {
  return store.spareParts.filter((part: SparePart) => {
    if (filterForm.status) {
      const ratio = part.quantity / part.safeStock
      if (filterForm.status === 'sufficient' && ratio < 1) return false
      if (filterForm.status === 'insufficient' && (ratio >= 1 || ratio < 0.5)) return false
      if (filterForm.status === 'critical' && ratio >= 0.5) return false
    }
    if (filterForm.keyword) {
      const keyword = filterForm.keyword.toLowerCase()
      if (!part.name.toLowerCase().includes(keyword) &&
          !part.spec.toLowerCase().includes(keyword)) {
        return false
      }
    }
    return true
  })
})

function getStockStatus(part: SparePart) {
  const ratio = part.quantity / part.safeStock
  if (ratio >= 1) return 'sufficient'
  if (ratio >= 0.5) return 'insufficient'
  return 'critical'
}

function getStockStatusText(part: SparePart) {
  const status = getStockStatus(part)
  const map: Record<string, string> = {
    sufficient: '充足',
    insufficient: '不足',
    critical: '紧缺'
  }
  return map[status] || status
}

function getStockStatusType(part: SparePart) {
  const status = getStockStatus(part)
  const map: Record<string, string> = {
    sufficient: 'success',
    insufficient: 'warning',
    critical: 'danger'
  }
  return map[status] || ''
}

function getStockQuantityClass(part: SparePart) {
  const status = getStockStatus(part)
  return {
    'text-success': status === 'sufficient',
    'text-warning': status === 'insufficient',
    'text-danger': status === 'critical'
  }
}

function getStockUrgencyClass(part: SparePart) {
  const status = getStockStatus(part)
  return {
    'urgency-low': status === 'insufficient',
    'urgency-high': status === 'critical'
  }
}

function onPartChange(id: string) {
  const part = store.spareParts.find(p => p.id === id)
  if (part) {
    currentPart.value = part
  }
}

function openRestockDialog(part?: SparePart) {
  if (part) {
    isQuickRestock.value = true
    currentPart.value = { ...part }
    restockForm.partId = part.id
  } else {
    isQuickRestock.value = false
    currentPart.value = null
    restockForm.partId = ''
  }
  restockForm.quantity = 1
  restockForm.supplier = ''
  restockForm.remark = ''
  restockDialogVisible.value = true
}

function quickRestock(part: SparePart) {
  openRestockDialog(part)
}

function submitRestock() {
  if (!restockFormRef.value) return
  restockFormRef.value.validate((valid) => {
    if (valid) {
      if (!isQuickRestock.value && !restockForm.partId) {
        ElMessage.warning('请选择备件')
        return
      }
      const partId = isQuickRestock.value && currentPart.value
        ? currentPart.value.id
        : restockForm.partId
      const part = store.spareParts.find(p => p.id === partId)
      if (part) {
        part.quantity += restockForm.quantity
        part.lastRestock = dayjs().format('YYYY-MM-DD')
        store.addNotification({
          type: 'stock',
          title: '备件入库',
          message: `${part.name} (${part.spec}) 已入库 ${restockForm.quantity}${part.unit}`,
          priority: 'low'
        })
      }
      restockDialogVisible.value = false
      ElMessage.success('入库成功')
    }
  })
}

function applyFilter() {}

function resetFilter() {
  filterForm.status = ''
  filterForm.keyword = ''
}
</script>

<style lang="scss" scoped>
.spare-parts-management {
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
}

.warning-card {
  border: 1px solid #fecaca;
  border-radius: 12px;
  margin-bottom: 20px;
  background: #fef2f2;

  :deep(.el-card__header) {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    border-bottom: 1px solid #fecaca;
    border-radius: 12px 12px 0 0;
    padding: 16px 20px;
  }

  :deep(.el-card__body) {
    padding: 16px 20px;
  }

  .card-header {
    .header-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 16px;
      font-weight: 600;
      color: #dc2626;

      .warning-icon {
        font-size: 20px;
      }
    }
  }
}

.warning-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.warning-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
  border-left: 4px solid #f59e0b;

  &.urgency-high {
    border-left-color: #ef4444;
    background: linear-gradient(90deg, #fef2f2 0%, #fff 100%);
  }

  &.urgency-low {
    border-left-color: #f59e0b;
    background: linear-gradient(90deg, #fffbeb 0%, #fff 100%);
  }

  .warning-info {
    .part-name {
      font-weight: 600;
      color: #1e293b;
      margin-right: 6px;
    }

    .part-spec {
      color: #64748b;
      font-size: 13px;
    }
  }

  .stock-info {
    font-size: 13px;

    .current-stock {
      color: #ef4444;
      font-weight: 600;
    }

    .safe-stock {
      color: #64748b;
    }
  }
}

.table-card {
  border: none;
  border-radius: 12px;

  :deep(.el-card__body) {
    padding: 20px;
  }
}

.filter-form {
  margin-bottom: 0;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}

.text-success {
  color: #10b981;
  font-weight: 600;
}

.text-warning {
  color: #f59e0b;
  font-weight: 600;
}

.text-danger {
  color: #ef4444;
  font-weight: 600;
}
</style>
