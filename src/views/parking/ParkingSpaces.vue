<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">车位状态管理</div>
      <el-button type="primary" @click="handleRefresh">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <div class="stat-card blue">
          <div class="stat-label">总车位</div>
          <div class="stat-value">{{ mallStore.totalSpaces }}</div>
          <div class="stat-footer">
            <el-icon><Van /></el-icon>
            车位总数
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card red">
          <div class="stat-label">已占用</div>
          <div class="stat-value">{{ mallStore.occupiedSpaces }}</div>
          <div class="stat-footer">
            <el-icon><Warning /></el-icon>
            占用车位
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card green">
          <div class="stat-label">空闲</div>
          <div class="stat-value">{{ mallStore.availableSpaces }}</div>
          <div class="stat-footer">
            <el-icon><CircleCheck /></el-icon>
            可用车位
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card orange">
          <div class="stat-label">使用率</div>
          <div class="stat-value">{{ usageRate }}%</div>
          <div class="stat-footer">
            <el-icon><DataLine /></el-icon>
            实时数据
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="floor-switch">
      <el-radio-group v-model="currentFloor" size="large">
        <el-radio-button :label="-1">B1 层</el-radio-button>
        <el-radio-button :label="-2">B2 层</el-radio-button>
        <el-radio-button :label="-3">B3 层</el-radio-button>
      </el-radio-group>
      <div class="floor-info">
        <span>共 {{ floorSpaces.length }} 个车位</span>
        <span class="divider">|</span>
        <span>已停 {{ floorOccupied }} 辆</span>
        <span class="divider">|</span>
        <span>空闲 {{ floorAvailable }} 个</span>
      </div>
    </div>

    <div class="parking-grid">
      <div
        v-for="space in floorSpaces"
        :key="space.id"
        :class="['parking-space', space.status]"
        @click="handleSpaceClick(space)"
      >
        <div class="number">{{ space.number }}</div>
        <div v-if="space.status === 'occupied'" class="plate">{{ space.licensePlate }}</div>
        <div v-if="space.status === 'occupied' && space.memberLevel" :class="['level', space.memberLevel]">
          {{ getLevelName(space.memberLevel) }}
        </div>
        <div v-if="space.status === 'reserved'" class="plate">预留</div>
        <div v-if="space.status === 'maintenance'" class="plate">维护</div>
      </div>
    </div>

    <el-dialog v-model="entryDialogVisible" title="车牌识别入场" width="500px">
      <el-form :model="entryForm" label-width="100px">
        <el-form-item label="车位号">
          <el-input v-model="entryForm.spaceNumber" disabled />
        </el-form-item>
        <el-form-item label="车牌号">
          <el-input
            v-model="entryForm.plateNumber"
            placeholder="请输入车牌号或自动识别"
            maxlength="10"
            @input="checkPlateDuplicate"
          >
            <template #append>
              <el-button @click="handleRecognize">
                <el-icon><Camera /></el-icon>
                识别
              </el-button>
            </template>
          </el-input>
          <div v-if="plateDuplicateError" class="plate-error">
            <el-icon color="#f56c6c"><Warning /></el-icon>
            <span>{{ plateDuplicateError }}</span>
          </div>
        </el-form-item>
        <el-form-item label="识别结果">
          <el-tag v-if="recognizedMember" type="success">
            会员：{{ recognizedMember.name }} ({{ getLevelName(recognizedMember.level) }})
          </el-tag>
          <el-tag v-else type="info">临时车辆</el-tag>
        </el-form-item>
        <el-form-item label="入场时间">
          <el-input v-model="currentTime" disabled />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="entryDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!entryForm.plateNumber || plateDuplicateError" @click="handleEntryConfirm">
          确认入场
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMallStore } from '@/stores/mall'
import { ElMessage } from 'element-plus'
import { Refresh, Van, Warning, CircleCheck, DataLine, Camera } from '@element-plus/icons-vue'
import type { ParkingSpace, Member } from '@/types'

const mallStore = useMallStore()

const currentFloor = ref(-1)
const entryDialogVisible = ref(false)
const currentTime = ref('')
const recognizedMember = ref<Member | null>(null)

const entryForm = ref({
  spaceId: '',
  spaceNumber: '',
  plateNumber: ''
})

const usageRate = computed(() => {
  if (mallStore.totalSpaces === 0) return 0
  return Math.round((mallStore.occupiedSpaces / mallStore.totalSpaces) * 100)
})

const floorSpaces = computed(() =>
  mallStore.parkingSpaces.filter(s => s.floor === currentFloor.value)
)

const floorOccupied = computed(() =>
  floorSpaces.value.filter(s => s.status === 'occupied').length
)

const floorAvailable = computed(() =>
  floorSpaces.value.filter(s => s.status === 'available').length
)

const getLevelName = (level: string) => {
  const map: Record<string, string> = {
    diamond: '钻石',
    platinum: '铂金',
    gold: '黄金',
    silver: '银卡',
    normal: '普通'
  }
  return map[level] || level
}

const updateTime = () => {
  currentTime.value = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const handleRefresh = () => {
  updateTime()
  ElMessage.success('数据已刷新')
}

const handleSpaceClick = (space: ParkingSpace) => {
  if (space.status === 'available') {
    entryForm.value = {
      spaceId: space.id,
      spaceNumber: space.number,
      plateNumber: ''
    }
    recognizedMember.value = null
    plateDuplicateError.value = ''
    entryDialogVisible.value = true
    updateTime()
  } else if (space.status === 'occupied') {
    ElMessage.info(`车位 ${space.number} 已被 ${space.licensePlate} 占用`)
  }
}

const handleRecognize = () => {
  const plates = ['京A12345', '京B67890', '沪A11111', '粤A22222', '苏A33333', '京C55555', '京D66666']
  const randomPlate = plates[Math.floor(Math.random() * plates.length)]
  entryForm.value.plateNumber = randomPlate

  const member = mallStore.members.find(m => m.plateNumber === randomPlate)
  recognizedMember.value = member || null

  checkPlateDuplicate()

  if (member) {
    ElMessage.success(`识别成功：${member.name} (${getLevelName(member.level)})`)
  } else {
    ElMessage.info('识别成功：临时车辆')
  }
}

const plateDuplicateError = ref('')

const checkPlateDuplicate = () => {
  const plate = entryForm.value.plateNumber.trim()
  if (!plate) {
    plateDuplicateError.value = ''
    return
  }
  const existingParking = mallStore.parkingSpaces.find(
    s => s.licensePlate === plate && s.status === 'occupied'
  )
  const existingRecord = mallStore.parkingRecords.find(
    r => r.licensePlate === plate && r.status === 'parking'
  )
  if (existingParking) {
    plateDuplicateError.value = `该车牌已占用车位 ${existingParking.number}，不能重复入场`
  } else if (existingRecord) {
    plateDuplicateError.value = '该车牌已有停车记录，不能重复入场'
  } else {
    plateDuplicateError.value = ''
  }
}

const handleEntryConfirm = () => {
  if (!entryForm.value.plateNumber) {
    ElMessage.warning('请输入车牌号')
    return
  }
  const result = mallStore.processParkingEntry(entryForm.value.plateNumber, entryForm.value.spaceId)
  if (result.success) {
    ElMessage.success(result.message || `车辆 ${entryForm.value.plateNumber} 已入场`)
    entryDialogVisible.value = false
  } else {
    ElMessage.error(result.message || '入场失败')
  }
}

onMounted(() => {
  updateTime()
})
</script>

<style lang="scss" scoped>
.plate-error {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #f56c6c;
  font-size: 12px;
  margin-top: 4px;
}

.stats-row {
  margin-bottom: 24px;
}

.floor-switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;

  .floor-info {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    color: #64748b;

    .divider {
      color: #cbd5e1;
    }
  }
}

.parking-space {
  .number {
    font-weight: 600;
    font-size: 12px;
  }

  .plate {
    font-size: 10px;
    margin-top: 2px;
  }

  .level {
    font-size: 9px;
    padding: 1px 4px;
    border-radius: 3px;
    margin-top: 2px;

    &.diamond {
      background: #e9d5ff;
      color: #7c3aed;
    }

    &.platinum {
      background: #ffedd5;
      color: #c2410c;
    }

    &.gold {
      background: #fef3c7;
      color: #a16207;
    }

    &.silver {
      background: #f1f5f9;
      color: #475569;
    }

    &.normal {
      background: #dbeafe;
      color: #1d4ed8;
    }
  }
}
</style>
