<template>
  <div class="maintenance-management">
    <div class="page-header">
      <h2>维保工单管理</h2>
      <el-button type="primary" @click="openCreateDialog">
        <component :is="'Plus'" style="margin-right: 6px;" />
        创建工单
      </el-button>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="工单状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width: 140px;">
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="filterForm.priority" placeholder="全部优先级" clearable style="width: 140px;">
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>
        </el-form-item>
        <el-form-item label="工单类型">
          <el-select v-model="filterForm.type" placeholder="全部类型" clearable style="width: 140px;">
            <el-option label="例行保养" value="routine" />
            <el-option label="故障维修" value="fault" />
            <el-option label="预防性维护" value="preventive" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="filterForm.keyword"
            placeholder="搜索工单编号/设备名称"
            clearable
            style="width: 200px;"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="applyFilter">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table :data="filteredOrders" stripe style="width: 100%;">
        <el-table-column prop="id" label="工单编号" width="140" />
        <el-table-column prop="equipmentName" label="设备名称" width="140" />
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getOrderTypeColor(row.type)" size="small">
              {{ getOrderTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority)" effect="dark" size="small">
              {{ getPriorityText(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assigneeTeam" label="指派班组" width="120" />
        <el-table-column prop="assignee" label="指派人员" width="120" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              link
              @click="openProcessDialog(row)"
              :disabled="row.status === 'completed' || row.status === 'cancelled'"
            >
              处理
            </el-button>
            <el-button
              type="primary"
              size="small"
              link
              @click="viewDetail(row)"
            >
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="createDialogVisible"
      title="创建维保工单"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="100px">
        <el-form-item label="选择设备" prop="equipmentId">
          <el-select v-model="createForm.equipmentId" placeholder="请选择设备" style="width: 100%;" @change="onEquipmentChange">
            <el-option
              v-for="eq in store.equipments"
              :key="eq.id"
              :label="eq.name"
              :value="eq.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="工单类型" prop="type">
          <el-select v-model="createForm.type" placeholder="请选择类型" style="width: 100%;">
            <el-option label="例行保养" value="routine" />
            <el-option label="故障维修" value="fault" />
            <el-option label="预防性维护" value="preventive" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-radio-group v-model="createForm.priority">
            <el-radio-button value="low">低</el-radio-button>
            <el-radio-button value="medium">中</el-radio-button>
            <el-radio-button value="high">高</el-radio-button>
            <el-radio-button value="urgent">紧急</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="问题描述" prop="description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="请详细描述问题"
          />
        </el-form-item>
        <el-form-item label="指派班组" prop="assigneeTeam">
          <el-select v-model="createForm.assigneeTeam" placeholder="请选择班组" style="width: 100%;">
            <el-option label="电梯组" value="电梯组" />
            <el-option label="空调组" value="空调组" />
            <el-option label="机电组" value="机电组" />
          </el-select>
        </el-form-item>
        <el-form-item label="指派人员" prop="assignee">
          <el-input v-model="createForm.assignee" placeholder="请输入指派人员" />
        </el-form-item>
        <el-form-item label="预估费用">
          <el-input-number v-model="createForm.cost" :min="0" :precision="2" />
          <span style="margin-left: 8px; color: #64748b;">元</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreate">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="processDialogVisible"
      title="处理工单"
      width="560px"
      :close-on-click-modal="false"
    >
      <div v-if="currentOrder" class="order-detail">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="工单编号">{{ currentOrder.id }}</el-descriptions-item>
          <el-descriptions-item label="设备名称">{{ currentOrder.equipmentName }}</el-descriptions-item>
          <el-descriptions-item label="工单类型">
            <el-tag :type="getOrderTypeColor(currentOrder.type)" size="small">
              {{ getOrderTypeText(currentOrder.type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag :type="getPriorityType(currentOrder.priority)" effect="dark" size="small">
              {{ getPriorityText(currentOrder.priority) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="问题描述" :span="2">{{ currentOrder.description }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentOrder.createTime }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="getStatusType(currentOrder.status)" size="small">
              {{ getStatusText(currentOrder.status) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <el-form :model="processForm" :rules="processRules" ref="processFormRef" label-width="100px" style="margin-top: 20px;">
        <el-form-item label="工单状态" prop="status">
          <el-radio-group v-model="processForm.status">
            <el-radio-button value="in_progress">开始处理</el-radio-button>
            <el-radio-button value="completed">完成</el-radio-button>
            <el-radio-button value="cancelled">取消</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="更换备件" v-if="processForm.status === 'completed'">
          <el-select
            v-model="selectedParts"
            multiple
            filterable
            placeholder="请选择使用的备件"
            style="width: 100%;"
          >
            <el-option
              v-for="part in store.spareParts"
              :key="part.id"
              :label="`${part.name} (${part.spec}) - 库存: ${part.quantity}${part.unit}`"
              :value="part.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="处理备注" prop="remark">
          <el-input
            v-model="processForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入处理备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="processDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitProcess">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="工单详情" width="560px">
      <div v-if="currentOrder">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="工单编号">{{ currentOrder.id }}</el-descriptions-item>
          <el-descriptions-item label="设备名称">{{ currentOrder.equipmentName }}</el-descriptions-item>
          <el-descriptions-item label="工单类型">
            <el-tag :type="getOrderTypeColor(currentOrder.type)" size="small">
              {{ getOrderTypeText(currentOrder.type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag :type="getPriorityType(currentOrder.priority)" effect="dark" size="small">
              {{ getPriorityText(currentOrder.priority) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="指派班组">{{ currentOrder.assigneeTeam }}</el-descriptions-item>
          <el-descriptions-item label="指派人员">{{ currentOrder.assignee }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="getStatusType(currentOrder.status)" size="small">
              {{ getStatusText(currentOrder.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="费用">¥{{ currentOrder.cost }}</el-descriptions-item>
          <el-descriptions-item label="问题描述" :span="2">{{ currentOrder.description }}</el-descriptions-item>
          <el-descriptions-item label="使用备件" :span="2">
            <el-tag v-for="p in currentOrder.partsUsed" :key="p" size="small" style="margin-right: 6px;">
              {{ p }}
            </el-tag>
            <span v-if="!currentOrder.partsUsed || currentOrder.partsUsed.length === 0" style="color: #94a3b8;">
              无
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentOrder.createTime }}</el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ currentOrder.startTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="完成时间">{{ currentOrder.completeTime || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useMallStore } from '@/stores/mall'
import type { MaintenanceOrder, Equipment } from '@/types'
import dayjs from 'dayjs'

const store = useMallStore()

const createDialogVisible = ref(false)
const processDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const currentOrder = ref<MaintenanceOrder | null>(null)
const createFormRef = ref<FormInstance>()
const processFormRef = ref<FormInstance>()
const selectedParts = ref<string[]>([])

const filterForm = reactive({
  status: '',
  priority: '',
  type: '',
  keyword: ''
})

const createForm = reactive({
  equipmentId: '',
  equipmentName: '',
  type: '' as MaintenanceOrder['type'],
  description: '',
  priority: 'medium' as MaintenanceOrder['priority'],
  assigneeTeam: '',
  assignee: '',
  cost: 0
})

const processForm = reactive({
  status: 'in_progress' as MaintenanceOrder['status'],
  remark: ''
})

const createRules: FormRules = {
  equipmentId: [{ required: true, message: '请选择设备', trigger: 'change' }],
  type: [{ required: true, message: '请选择工单类型', trigger: 'change' }],
  description: [{ required: true, message: '请输入问题描述', trigger: 'blur' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
  assigneeTeam: [{ required: true, message: '请选择指派班组', trigger: 'change' }],
  assignee: [{ required: true, message: '请输入指派人员', trigger: 'blur' }]
}

const processRules: FormRules = {
  status: [{ required: true, message: '请选择工单状态', trigger: 'change' }],
  remark: [{ required: true, message: '请输入处理备注', trigger: 'blur' }]
}

const filteredOrders = computed(() => {
  return store.maintenanceOrders.filter((order: MaintenanceOrder) => {
    if (filterForm.status && order.status !== filterForm.status) return false
    if (filterForm.priority && order.priority !== filterForm.priority) return false
    if (filterForm.type && order.type !== filterForm.type) return false
    if (filterForm.keyword) {
      const keyword = filterForm.keyword.toLowerCase()
      if (!order.id.toLowerCase().includes(keyword) &&
          !order.equipmentName.toLowerCase().includes(keyword)) {
        return false
      }
    }
    return true
  })
})

function onEquipmentChange(id: string) {
  const eq = store.equipments.find((e: Equipment) => e.id === id)
  if (eq) {
    createForm.equipmentName = eq.name
  }
}

function getOrderTypeText(type: MaintenanceOrder['type']) {
  const map: Record<MaintenanceOrder['type'], string> = {
    routine: '例行保养',
    fault: '故障维修',
    preventive: '预防性维护'
  }
  return map[type] || type
}

function getOrderTypeColor(type: MaintenanceOrder['type']) {
  const map: Record<MaintenanceOrder['type'], string> = {
    routine: 'info',
    fault: 'danger',
    preventive: 'warning'
  }
  return map[type] || ''
}

function getPriorityText(priority: MaintenanceOrder['priority']) {
  const map: Record<MaintenanceOrder['priority'], string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急'
  }
  return map[priority] || priority
}

function getPriorityType(priority: MaintenanceOrder['priority']) {
  const map: Record<MaintenanceOrder['priority'], string> = {
    low: 'success',
    medium: 'primary',
    high: 'warning',
    urgent: 'danger'
  }
  return map[priority] || ''
}

function getStatusText(status: MaintenanceOrder['status']) {
  const map: Record<MaintenanceOrder['status'], string> = {
    pending: '待处理',
    in_progress: '处理中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

function getStatusType(status: MaintenanceOrder['status']) {
  const map: Record<MaintenanceOrder['status'], string> = {
    pending: 'warning',
    in_progress: 'primary',
    completed: 'success',
    cancelled: 'info'
  }
  return map[status] || ''
}

function openCreateDialog() {
  Object.assign(createForm, {
    equipmentId: '',
    equipmentName: '',
    type: '' as MaintenanceOrder['type'],
    description: '',
    priority: 'medium' as MaintenanceOrder['priority'],
    assigneeTeam: '',
    assignee: '',
    cost: 0
  })
  createDialogVisible.value = true
}

function submitCreate() {
  if (!createFormRef.value) return
  createFormRef.value.validate((valid) => {
    if (valid) {
      store.createMaintenanceOrder({
        equipmentId: createForm.equipmentId,
        equipmentName: createForm.equipmentName,
        type: createForm.type,
        description: createForm.description,
        priority: createForm.priority,
        assigneeTeam: createForm.assigneeTeam,
        assignee: createForm.assignee,
        partsUsed: [],
        cost: createForm.cost
      })
      createDialogVisible.value = false
      ElMessage.success('工单创建成功')
    }
  })
}

function openProcessDialog(order: MaintenanceOrder) {
  currentOrder.value = { ...order }
  processForm.status = order.status === 'pending' ? 'in_progress' : order.status
  processForm.remark = ''
  selectedParts.value = []
  processDialogVisible.value = true
}

function submitProcess() {
  if (!processFormRef.value || !currentOrder.value) return
  processFormRef.value.validate((valid) => {
    if (valid) {
      const updateData: Partial<MaintenanceOrder> = {
        status: processForm.status
      }
      if (processForm.status === 'in_progress' && !currentOrder.value?.startTime) {
        updateData.startTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
      }
      if (processForm.status === 'completed') {
        updateData.completeTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
        updateData.partsUsed = selectedParts.value
      }
      store.updateMaintenanceOrder(currentOrder.value!.id, updateData)
      processDialogVisible.value = false
      ElMessage.success('工单处理成功')
    }
  })
}

function viewDetail(order: MaintenanceOrder) {
  currentOrder.value = { ...order }
  detailDialogVisible.value = true
}

function applyFilter() {}

function resetFilter() {
  filterForm.status = ''
  filterForm.priority = ''
  filterForm.type = ''
  filterForm.keyword = ''
}
</script>

<style lang="scss" scoped>
.maintenance-management {
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

.filter-card,
.table-card {
  border: none;
  border-radius: 12px;
  margin-bottom: 20px;

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

.order-detail {
  margin-bottom: 20px;
}
</style>
