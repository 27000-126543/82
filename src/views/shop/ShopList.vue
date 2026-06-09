<template>
  <div class="shop-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">商铺信息列表</span>
          <div class="header-buttons">
            <el-button type="warning" @click="handleNewTenantApplication">
              <el-icon><Plus /></el-icon>
              新商户入驻申请
            </el-button>
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              新增商铺
            </el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="商铺名称">
          <el-input v-model="searchForm.name" placeholder="请输入商铺名称" clearable />
        </el-form-item>
        <el-form-item label="楼层">
          <el-select v-model="searchForm.floor" placeholder="请选择楼层" clearable>
            <el-option v-for="floor in floorOptions" :key="floor" :label="floor + '楼'" :value="floor" />
          </el-select>
        </el-form-item>
        <el-form-item label="业态">
          <el-select v-model="searchForm.category" placeholder="请选择业态" clearable>
            <el-option v-for="cat in categoryOptions" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>

      <el-table :data="filteredShops" stripe border>
        <el-table-column prop="name" label="商铺名称" min-width="120" />
        <el-table-column prop="floor" label="楼层" width="80">
          <template #default="{ row }">
            {{ row.floor }}楼
          </template>
        </el-table-column>
        <el-table-column prop="area" label="面积(㎡)" width="100" />
        <el-table-column prop="category" label="业态" width="100" />
        <el-table-column prop="tenantName" label="租户名称" min-width="120" />
        <el-table-column prop="phone" label="联系方式" width="130" />
        <el-table-column label="合同起止日期" min-width="200">
          <template #default="{ row }">
            {{ row.contractStart }} ~ {{ row.contractEnd }}
          </template>
        </el-table-column>
        <el-table-column prop="monthlyRent" label="月租金(元)" width="120">
          <template #default="{ row }">
            {{ row.monthlyRent.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="经营数据" min-width="200">
          <template #default="{ row }">
            <div class="business-data">
              <div>月营收: ¥{{ row.businessData.monthlyRevenue.toLocaleString() }}</div>
              <div>客流: {{ row.businessData.customerFlow.toLocaleString() }}人/月</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType[row.status as keyof typeof statusTagType]" effect="dark">
              {{ statusText[row.status as keyof typeof statusText] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="success" link v-if="row.status !== 'vacant'" @click="handleViewBusiness(row)">经营数据</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑商铺' : '新增商铺'" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="商铺名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入商铺名称" />
        </el-form-item>
        <el-form-item label="楼层" prop="floor">
          <el-select v-model="form.floor" placeholder="请选择楼层" style="width: 100%">
            <el-option v-for="floor in floorOptions" :key="floor" :label="floor + '楼'" :value="floor" />
          </el-select>
        </el-form-item>
        <el-form-item label="面积(㎡)" prop="area">
          <el-input-number v-model="form.area" :min="1" :max="10000" style="width: 100%" />
        </el-form-item>
        <el-form-item label="业态" prop="category">
          <el-input v-model="form.category" placeholder="请输入业态" />
        </el-form-item>
        <el-form-item label="租户名称" prop="tenantName">
          <el-input v-model="form.tenantName" placeholder="请输入租户名称" />
        </el-form-item>
        <el-form-item label="联系人" prop="contact">
          <el-input v-model="form.contact" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系方式" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入联系方式" />
        </el-form-item>
        <el-form-item label="合同开始" prop="contractStart">
          <el-date-picker v-model="form.contractStart" type="date" placeholder="选择开始日期" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="合同结束" prop="contractEnd">
          <el-date-picker v-model="form.contractEnd" type="date" placeholder="选择结束日期" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="月租金(元)" prop="monthlyRent">
          <el-input-number v-model="form.monthlyRent" :min="0" :max="10000000" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="正常" value="normal" />
            <el-option label="即将到期" value="expiring" />
            <el-option label="已过期" value="expired" />
            <el-option label="空置" value="vacant" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="businessDialogVisible" title="经营数据详情" width="500px">
      <div v-if="currentShop" class="business-detail">
        <div class="detail-item">
          <span class="label">商铺名称:</span>
          <span class="value">{{ currentShop.name }}</span>
        </div>
        <div class="detail-item">
          <span class="label">月营收:</span>
          <span class="value revenue">¥{{ currentShop.businessData.monthlyRevenue.toLocaleString() }}</span>
        </div>
        <div class="detail-item">
          <span class="label">月客流:</span>
          <span class="value">{{ currentShop.businessData.customerFlow.toLocaleString() }}人</span>
        </div>
        <div class="detail-item" style="margin-top: 20px">
          <span class="label">近7日营收:</span>
        </div>
        <div class="daily-revenue">
          <div v-for="(rev, idx) in currentShop.businessData.dailyRevenue" :key="idx" class="daily-item">
            <span class="day">第{{ idx + 1 }}天</span>
            <span class="rev">¥{{ rev.toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="applicationDialogVisible" title="新商户入驻申请" width="650px">
      <el-form :model="applicationForm" :rules="applicationRules" ref="applicationFormRef" label-width="120px">
        <el-form-item label="商铺名称" prop="shopName">
          <el-input v-model="applicationForm.shopName" placeholder="请输入商铺名称" />
        </el-form-item>
        <el-form-item label="楼层" prop="floor">
          <el-select v-model="applicationForm.floor" placeholder="请选择楼层" style="width: 100%">
            <el-option v-for="f in [-1, 1, 2, 3, 4, 5]" :key="f" :label="f === -1 ? 'B1层' : f + '层'" :value="f" />
          </el-select>
        </el-form-item>
        <el-form-item label="面积(㎡)" prop="area">
          <el-input-number v-model="applicationForm.area" :min="1" :max="10000" style="width: 100%" />
        </el-form-item>
        <el-form-item label="业态" prop="category">
          <el-input v-model="applicationForm.category" placeholder="请输入业态，如：服装/餐饮/数码/运动/娱乐/零售" />
        </el-form-item>
        <el-form-item label="租户名称" prop="tenantName">
          <el-input v-model="applicationForm.tenantName" placeholder="请输入租户名称" />
        </el-form-item>
        <el-form-item label="联系人" prop="contact">
          <el-input v-model="applicationForm.contact" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="applicationForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="营业执照号" prop="businessLicense">
          <el-input v-model="applicationForm.businessLicense" placeholder="请输入营业执照号" />
        </el-form-item>
        <el-form-item label="拟租赁开始日期" prop="proposedStart">
          <el-date-picker v-model="applicationForm.proposedStart" type="date" placeholder="选择开始日期" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="拟租赁结束日期" prop="proposedEnd">
          <el-date-picker v-model="applicationForm.proposedEnd" type="date" placeholder="选择结束日期" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="拟月租金(元)" prop="proposedRent">
          <el-input-number v-model="applicationForm.proposedRent" :min="0" :max="10000000" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="applicationDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleApplicationSubmit">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMallStore } from '@/stores/mall'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import type { Shop } from '@/types'

const store = useMallStore()
const router = useRouter()

const searchForm = ref({
  name: '',
  floor: null as number | null,
  category: ''
})

const floorOptions = computed(() => {
  const floors = new Set(store.shops.map(s => s.floor))
  return Array.from(floors).sort((a, b) => a - b)
})

const categoryOptions = computed(() => {
  const cats = new Set(store.shops.map(s => s.category))
  return Array.from(cats)
})

const filteredShops = computed(() => {
  return store.shops.filter(shop => {
    const matchName = !searchForm.value.name || shop.name.includes(searchForm.value.name)
    const matchFloor = searchForm.value.floor === null || shop.floor === searchForm.value.floor
    const matchCategory = !searchForm.value.category || shop.category === searchForm.value.category
    return matchName && matchFloor && matchCategory
  })
})

const statusTagType: Record<Shop['status'], string> = {
  normal: 'success',
  expiring: 'warning',
  expired: 'danger',
  vacant: 'info'
}

const statusText: Record<Shop['status'], string> = {
  normal: '正常',
  expiring: '即将到期',
  expired: '已过期',
  vacant: '空置'
}

const dialogVisible = ref(false)
const businessDialogVisible = ref(false)
const applicationDialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')
const formRef = ref<FormInstance>()
const applicationFormRef = ref<FormInstance>()
const currentShop = ref<Shop | null>(null)

const defaultForm = () => ({
  name: '',
  floor: 1,
  area: 100,
  category: '',
  tenantName: '',
  contact: '',
  phone: '',
  contractStart: dayjs().format('YYYY-MM-DD'),
  contractEnd: dayjs().add(1, 'year').format('YYYY-MM-DD'),
  monthlyRent: 10000,
  status: 'normal' as Shop['status']
})

const form = ref(defaultForm())

const rules: FormRules = {
  name: [{ required: true, message: '请输入商铺名称', trigger: 'blur' }],
  floor: [{ required: true, message: '请选择楼层', trigger: 'change' }],
  area: [{ required: true, message: '请输入面积', trigger: 'blur' }],
  category: [{ required: true, message: '请输入业态', trigger: 'blur' }],
  tenantName: [{ required: true, message: '请输入租户名称', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系方式', trigger: 'blur' }],
  contractStart: [{ required: true, message: '请选择合同开始日期', trigger: 'change' }],
  contractEnd: [{ required: true, message: '请选择合同结束日期', trigger: 'change' }],
  monthlyRent: [{ required: true, message: '请输入月租金', trigger: 'blur' }]
}

const defaultApplicationForm = () => ({
  shopName: '',
  floor: 1,
  area: 100,
  category: '',
  tenantName: '',
  contact: '',
  phone: '',
  businessLicense: '',
  proposedStart: dayjs().format('YYYY-MM-DD'),
  proposedEnd: dayjs().add(1, 'year').format('YYYY-MM-DD'),
  proposedRent: 10000
})

const applicationForm = ref(defaultApplicationForm())

const applicationRules: FormRules = {
  shopName: [{ required: true, message: '请输入商铺名称', trigger: 'blur' }],
  floor: [{ required: true, message: '请选择楼层', trigger: 'change' }],
  area: [{ required: true, message: '请输入面积', trigger: 'blur' }],
  category: [{ required: true, message: '请输入业态', trigger: 'blur' }],
  tenantName: [{ required: true, message: '请输入租户名称', trigger: 'blur' }],
  contact: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  businessLicense: [{ required: true, message: '请输入营业执照号', trigger: 'blur' }],
  proposedStart: [{ required: true, message: '请选择拟租赁开始日期', trigger: 'change' }],
  proposedEnd: [{ required: true, message: '请选择拟租赁结束日期', trigger: 'change' }],
  proposedRent: [{ required: true, message: '请输入拟月租金', trigger: 'blur' }]
}

function handleSearch() {}

function handleReset() {
  searchForm.value = { name: '', floor: null, category: '' }
}

function handleAdd() {
  isEdit.value = false
  form.value = defaultForm()
  dialogVisible.value = true
}

function handleEdit(row: Shop) {
  isEdit.value = true
  editId.value = row.id
  form.value = {
    name: row.name,
    floor: row.floor,
    area: row.area,
    category: row.category,
    tenantName: row.tenantName,
    contact: row.contact,
    phone: row.phone,
    contractStart: row.contractStart,
    contractEnd: row.contractEnd,
    monthlyRent: row.monthlyRent,
    status: row.status
  }
  dialogVisible.value = true
}

function handleViewBusiness(row: Shop) {
  currentShop.value = row
  businessDialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  if (isEdit.value) {
    store.updateShop(editId.value, form.value)
    ElMessage.success('编辑成功')
  } else {
    store.addShop({
      ...form.value,
      businessData: {
        dailyRevenue: [0, 0, 0, 0, 0, 0, 0],
        monthlyRevenue: 0,
        customerFlow: 0
      }
    })
    ElMessage.success('新增成功')
  }

  dialogVisible.value = false
}

function handleNewTenantApplication() {
  applicationForm.value = defaultApplicationForm()
  applicationDialogVisible.value = true
}

async function handleApplicationSubmit() {
  if (!applicationFormRef.value) return
  const valid = await applicationFormRef.value.validate().catch(() => false)
  if (!valid) return

  const success = store.createNewTenantApplication(applicationForm.value)
  if (success) {
    ElMessage.success('入驻申请提交成功')
    applicationDialogVisible.value = false
    router.push('/shop/approval')
  } else {
    ElMessage.error('提交失败，该商铺已有待审批的入驻申请')
  }
}
</script>

<style scoped lang="scss">
.shop-list {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      font-size: 16px;
      font-weight: 600;
    }

    .header-buttons {
      display: flex;
      gap: 8px;
    }
  }

  .search-form {
    margin-bottom: 20px;
  }

  .business-data {
    font-size: 12px;
    line-height: 1.8;
  }

  .business-detail {
    padding: 10px 0;

    .detail-item {
      display: flex;
      align-items: center;
      margin-bottom: 12px;

      .label {
        width: 100px;
        color: #666;
      }

      .value {
        flex: 1;
        font-weight: 500;

        &.revenue {
          color: #67c23a;
          font-size: 18px;
        }
      }
    }

    .daily-revenue {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;

      .daily-item {
        padding: 10px;
        background: #f5f7fa;
        border-radius: 4px;
        text-align: center;

        .day {
          display: block;
          font-size: 12px;
          color: #909399;
          margin-bottom: 4px;
        }

        .rev {
          font-weight: 600;
          color: #409eff;
        }
      }
    }
  }
}
</style>
