<template>
  <div class="cleaning-schedule">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">保洁排班管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="handleGenerate">
              <el-icon><MagicStick /></el-icon>
              自动生成排班
            </el-button>
            <el-button @click="handlePrevWeek">
              <el-icon><ArrowLeft /></el-icon>
              上一周
            </el-button>
            <el-button @click="handleNextWeek">
              下一周
              <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="人员">
          <el-select v-model="filterForm.staffId" placeholder="全部人员" clearable style="width: 150px">
            <el-option v-for="staff in cleaningStaff" :key="staff.id" :label="staff.name" :value="staff.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="班次">
          <el-select v-model="filterForm.shift" placeholder="全部班次" clearable style="width: 150px">
            <el-option label="早班" value="morning" />
            <el-option label="中班" value="afternoon" />
            <el-option label="晚班" value="night" />
          </el-select>
        </el-form-item>
        <el-form-item label="区域">
          <el-select v-model="filterForm.zone" placeholder="全部区域" clearable style="width: 150px">
            <el-option v-for="zone in zoneOptions" :key="zone" :label="zone" :value="zone" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleFilter">
            <el-icon><Search /></el-icon>
            筛选
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>

      <div class="shift-legend">
        <div class="legend-item">
          <span class="legend-dot morning"></span>
          <span>早班 (06:00-14:00)</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot afternoon"></span>
          <span>中班 (10:00-18:00)</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot night"></span>
          <span>晚班 (18:00-24:00)</span>
        </div>
      </div>

      <div class="schedule-calendar">
        <div class="calendar-header" v-for="(day, idx) in weekDays" :key="idx">
          <div>{{ day.label }}</div>
          <div class="date">{{ day.date }}</div>
        </div>
        <div class="calendar-cell" v-for="(day, idx) in weekDays" :key="'cell-' + idx">
          <div class="date-label">{{ day.dateText }}</div>
          <div v-for="schedule in getSchedulesByDate(day.date)" :key="schedule.id"
               class="schedule-item"
               :class="[schedule.shift, { adjusting: schedule.status === 'adjusting' }]"
               @click="handleSwap(schedule)">
            <div class="staff-name">{{ schedule.staffName }}</div>
            <div class="zone">{{ schedule.zone }}</div>
            <div v-if="schedule.status === 'adjusting'" class="adjusting-tag">调班中</div>
          </div>
        </div>
      </div>
    </el-card>

    <el-dialog v-model="swapDialogVisible" title="发起调班申请" width="500px">
      <el-form :model="swapForm" :rules="swapRules" ref="swapFormRef" label-width="100px">
        <el-form-item label="申请人">
          <el-input :value="currentSchedule?.staffName" disabled />
        </el-form-item>
        <el-form-item label="原排班">
          <el-input :value="currentSchedule ? `${currentSchedule.date} ${shiftText[currentSchedule.shift]} ${currentSchedule.zone}` : ''" disabled />
        </el-form-item>
        <el-form-item label="目标人员" prop="targetStaffId">
          <el-select v-model="swapForm.targetStaffId" placeholder="请选择调班人员" style="width: 100%">
            <el-option v-for="staff in availableStaff" :key="staff.id" :label="staff.name" :value="staff.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="调班原因" prop="reason">
          <el-input v-model="swapForm.reason" type="textarea" :rows="3" placeholder="请输入调班原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="swapDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitSwap">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useMallStore } from '@/stores/mall'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { MagicStick, ArrowLeft, ArrowRight, Search, Refresh } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import type { CleaningSchedule } from '@/types'

const store = useMallStore()

const currentWeekStart = ref(dayjs().startOf('week'))
const swapDialogVisible = ref(false)
const currentSchedule = ref<CleaningSchedule | null>(null)
const swapFormRef = ref<FormInstance>()

const filterForm = reactive({
  staffId: '',
  shift: '',
  zone: ''
})

const swapForm = reactive({
  targetStaffId: '',
  reason: ''
})

const swapRules: FormRules = {
  targetStaffId: [{ required: true, message: '请选择目标人员', trigger: 'change' }],
  reason: [{ required: true, message: '请输入调班原因', trigger: 'blur' }]
}

const cleaningStaff = computed(() => store.cleaningStaff)

const zoneOptions = computed(() => {
  const zones = new Set(store.cleaningSchedules.map(s => s.zone))
  return Array.from(zones)
})

const weekDays = computed(() => {
  return Array.from({ length: 7 }, (_, i) => {
    const day = currentWeekStart.value.add(i, 'day')
    const weekDayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return {
      label: weekDayLabels[i],
      date: day.format('YYYY-MM-DD'),
      dateText: day.format('MM/DD')
    }
  })
})

const shiftText: Record<string, string> = {
  morning: '早班',
  afternoon: '中班',
  night: '晚班'
}

const filteredSchedules = computed(() => {
  return store.cleaningSchedules.filter(schedule => {
    const matchStaff = !filterForm.staffId || schedule.staffId === filterForm.staffId
    const matchShift = !filterForm.shift || schedule.shift === filterForm.shift
    const matchZone = !filterForm.zone || schedule.zone === filterForm.zone
    return matchStaff && matchShift && matchZone
  })
})

const availableStaff = computed(() => {
  if (!currentSchedule.value) return []
  return store.cleaningStaff.filter(s => s.id !== currentSchedule.value?.staffId)
})

function getSchedulesByDate(date: string) {
  return filteredSchedules.value.filter(s => s.date === date)
}

function handleGenerate() {
  store.generateCleaningSchedule()
  ElMessage.success('排班已根据客流预测自动生成')
}

function handlePrevWeek() {
  currentWeekStart.value = currentWeekStart.value.subtract(7, 'day')
}

function handleNextWeek() {
  currentWeekStart.value = currentWeekStart.value.add(7, 'day')
}

function handleFilter() {}

function handleReset() {
  filterForm.staffId = ''
  filterForm.shift = ''
  filterForm.zone = ''
}

function handleSwap(schedule: CleaningSchedule) {
  if (schedule.status === 'adjusting') {
    ElMessage.warning('该排班正在调班审批中')
    return
  }
  currentSchedule.value = schedule
  swapForm.targetStaffId = ''
  swapForm.reason = ''
  swapDialogVisible.value = true
}

async function handleSubmitSwap() {
  if (!swapFormRef.value || !currentSchedule.value) return
  const valid = await swapFormRef.value.validate().catch(() => false)
  if (!valid) return

  store.requestSwap(currentSchedule.value.id, swapForm.targetStaffId, swapForm.reason)
  ElMessage.success('调班申请已提交，待审批')
  swapDialogVisible.value = false
}
</script>

<style scoped lang="scss">
.cleaning-schedule {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      font-size: 16px;
      font-weight: 600;
    }

    .header-actions {
      display: flex;
      gap: 10px;
    }
  }

  .filter-form {
    margin-bottom: 20px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 8px;
  }

  .shift-legend {
    display: flex;
    gap: 30px;
    margin-bottom: 20px;
    padding: 12px 16px;
    background: #f8fafc;
    border-radius: 8px;

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #475569;

      .legend-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;

        &.morning {
          background: #3b82f6;
        }

        &.afternoon {
          background: #f59e0b;
        }

        &.night {
          background: #6366f1;
        }
      }
    }
  }
}
</style>
