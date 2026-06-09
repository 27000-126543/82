<template>
  <div class="cleaning-staff">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">保洁人员管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增人员
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="姓名">
          <el-input v-model="searchForm.name" placeholder="请输入姓名" clearable />
        </el-form-item>
        <el-form-item label="班组">
          <el-select v-model="searchForm.team" placeholder="全部班组" clearable>
            <el-option label="一组" value="一组" />
            <el-option label="二组" value="二组" />
            <el-option label="机动组" value="机动组" />
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

      <el-table :data="filteredStaff" stripe border>
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="phone" label="电话" width="150" />
        <el-table-column prop="team" label="班组" width="120">
          <template #default="{ row }">
            <el-tag :type="teamTagType[row.team]" effect="dark">
              {{ row.team }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="技能标签" min-width="300">
          <template #default="{ row }">
            <el-tag v-for="skill in row.skills" :key="skill" class="skill-tag">
              {{ skill }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{}">
            <el-tag type="success" effect="dark">在岗</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑人员' : '新增人员'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入电话" />
        </el-form-item>
        <el-form-item label="班组" prop="team">
          <el-select v-model="form.team" placeholder="请选择班组" style="width: 100%">
            <el-option label="一组" value="一组" />
            <el-option label="二组" value="二组" />
            <el-option label="机动组" value="机动组" />
          </el-select>
        </el-form-item>
        <el-form-item label="技能标签" prop="skills">
          <el-select v-model="form.skills" multiple placeholder="请选择技能" style="width: 100%">
            <el-option label="日常清洁" value="日常清洁" />
            <el-option label="玻璃清洁" value="玻璃清洁" />
            <el-option label="地面打蜡" value="地面打蜡" />
            <el-option label="卫生间清洁" value="卫生间清洁" />
            <el-option label="地毯清洁" value="地毯清洁" />
            <el-option label="高空清洁" value="高空清洁" />
            <el-option label="外墙清洗" value="外墙清洗" />
            <el-option label="石材养护" value="石材养护" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useMallStore } from '@/stores/mall'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import type { CleaningStaff } from '@/types'

const store = useMallStore()

const searchForm = reactive({
  name: '',
  team: ''
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')
const formRef = ref<FormInstance>()

const teamTagType: Record<string, string> = {
  '一组': 'primary',
  '二组': 'success',
  '机动组': 'warning'
}

const defaultForm = () => ({
  name: '',
  phone: '',
  team: '一组',
  skills: ['日常清洁'] as string[]
})

const form = reactive(defaultForm())

const rules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入电话', trigger: 'blur' }],
  team: [{ required: true, message: '请选择班组', trigger: 'change' }],
  skills: [{ required: true, message: '请选择至少一个技能', trigger: 'change' }]
}

const filteredStaff = computed(() => {
  return store.cleaningStaff.filter(staff => {
    const matchName = !searchForm.name || staff.name.includes(searchForm.name)
    const matchTeam = !searchForm.team || staff.team === searchForm.team
    return matchName && matchTeam
  })
})

function handleSearch() {}

function handleReset() {
  searchForm.name = ''
  searchForm.team = ''
}

function handleAdd() {
  isEdit.value = false
  Object.assign(form, defaultForm())
  dialogVisible.value = true
}

function handleEdit(row: CleaningStaff) {
  isEdit.value = true
  editId.value = row.id
  form.name = row.name
  form.phone = row.phone
  form.team = row.team
  form.skills = [...row.skills]
  dialogVisible.value = true
}

function handleDelete(row: CleaningStaff) {
  ElMessageBox.confirm(`确定要删除 ${row.name} 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = store.cleaningStaff.findIndex(s => s.id === row.id)
    if (index > -1) {
      store.cleaningStaff.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {})
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  if (isEdit.value) {
    const index = store.cleaningStaff.findIndex(s => s.id === editId.value)
    if (index > -1) {
      store.cleaningStaff[index] = {
        ...store.cleaningStaff[index],
        name: form.name,
        phone: form.phone,
        team: form.team,
        skills: [...form.skills]
      }
    }
    ElMessage.success('编辑成功')
  } else {
      const newStaff: CleaningStaff = {
        id: 'CS' + Math.random().toString(36).substring(2, 6).toUpperCase(),
        name: form.name,
        phone: form.phone,
        team: form.team,
        skills: [...form.skills]
      }
      store.cleaningStaff.push(newStaff)
      ElMessage.success('新增成功')
    }

  dialogVisible.value = false
}
</script>

<style scoped lang="scss">
.cleaning-staff {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      font-size: 16px;
      font-weight: 600;
    }
  }

  .search-form {
    margin-bottom: 20px;
  }

  .skill-tag {
    margin-right: 8px;
    margin-bottom: 4px;
  }
}
</style>
