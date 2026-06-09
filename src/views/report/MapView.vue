<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">平面图监控</div>
      <div class="header-actions">
        <el-radio-group v-model="currentFloor" size="large" @change="handleFloorChange">
          <el-radio-button :label="-1">B1层</el-radio-button>
          <el-radio-button :label="1">1层</el-radio-button>
          <el-radio-button :label="2">2层</el-radio-button>
          <el-radio-button :label="3">3层</el-radio-button>
          <el-radio-button :label="4">4层</el-radio-button>
          <el-radio-button :label="5">5层</el-radio-button>
        </el-radio-group>
        <el-button type="primary" @click="handleRefresh" style="margin-left: 12px">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <div class="map-wrapper">
      <div class="map-legend">
        <div class="legend-title">图例说明</div>
        <div class="legend-section">
          <div class="legend-label">客流密度</div>
          <div class="legend-gradient">
            <div class="gradient-bar"></div>
            <div class="gradient-labels">
              <span>低</span>
              <span>中</span>
              <span>高</span>
            </div>
          </div>
        </div>
        <div class="legend-section">
          <div class="legend-label">区域类型</div>
          <div class="legend-items">
            <div class="legend-item">
              <span class="legend-color shop"></span>
              <span>店铺</span>
            </div>
            <div class="legend-item">
              <span class="legend-color corridor"></span>
              <span>通道</span>
            </div>
            <div class="legend-item">
              <span class="legend-color entrance"></span>
              <span>入口</span>
            </div>
            <div class="legend-item">
              <span class="legend-color facility"></span>
              <span>设施</span>
            </div>
          </div>
        </div>
        <div class="legend-section">
          <div class="legend-label">客流数据来源</div>
          <div class="legend-items">
            <div class="legend-item">
              <el-tag type="success" size="small">实时客流</el-tag>
              <span>公共区域</span>
            </div>
            <div class="legend-item">
              <el-tag type="warning" size="small">商铺静态</el-tag>
              <span>已接入店铺</span>
            </div>
            <div class="legend-item">
              <el-tag type="info" size="small">未接入</el-tag>
              <span>无实时数据</span>
            </div>
          </div>
        </div>
        <div class="legend-section">
          <div class="legend-label">设备状态</div>
          <div class="legend-items">
            <div class="legend-item">
              <span class="legend-dot running"></span>
              <span>运行中</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot standby"></span>
              <span>待机</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot maintenance"></span>
              <span>维护中</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot fault"></span>
              <span>故障</span>
            </div>
          </div>
        </div>
        <div class="legend-section">
          <div class="legend-label">告警状态</div>
          <div class="legend-items">
            <div class="legend-item">
              <span class="legend-alert"></span>
              <span>客流超限告警</span>
            </div>
          </div>
        </div>
      </div>

      <div class="map-container">
        <div class="map-header">
          <span class="floor-name">{{ floorName }} 平面图</span>
          <span class="update-time">更新时间：{{ updateTime }}</span>
        </div>
        <div class="map-content">
          <div
            v-for="zone in floorZones"
            :key="zone.id"
            :class="['map-zone', zone.type, { 
              'alert-blink': zone.evacuationAlert && zone.flowSource === 'realtime',
              'density-alert': zone.flowSource === 'realtime' && zone.passengerFlow / zone.capacity >= 0.85,
              'shop-static': zone.flowSource === 'shop',
              'flow-unavailable': zone.flowSource === 'unavailable'
            }]"
            :style="getZoneStyle(zone)"
            @click="handleZoneClick(zone)"
          >
            <span class="zone-name">{{ zone.name }}</span>
            <span class="zone-flow" :class="{ 'dimmed': zone.flowSource !== 'realtime' }">
              {{ zone.flowSource === 'unavailable' ? '--' : Math.round(zone.passengerFlow / zone.capacity * 100) + '%' }}
            </span>
            <span v-if="zone.flowSource === 'shop'" class="flow-badge shop">商铺</span>
            <span v-else-if="zone.flowSource === 'unavailable'" class="flow-badge unavailable">未接入</span>
            <div v-if="zone.equipments && zone.equipments.length > 0" class="zone-equipment">
              <div
                v-for="eq in zone.equipments.slice(0, 3)"
                :key="eq.id"
                :class="['eq-indicator', eq.status]"
                :title="`${eq.name}: ${getStatusText(eq.status)}`"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="selectedZone?.name || '区域详情'"
      width="650px"
      class="zone-detail-dialog"
    >
      <div v-if="selectedZone" class="zone-detail">
        <div class="detail-section">
          <div class="section-title">
            <el-icon><InfoFilled /></el-icon>
            基本信息
          </div>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="区域名称">
              {{ selectedZone.name }}
            </el-descriptions-item>
            <el-descriptions-item label="区域类型">
              <el-tag :type="getZoneTypeTag(selectedZone.type)">
                {{ getZoneTypeText(selectedZone.type) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="所在楼层">
              {{ floorName }}
            </el-descriptions-item>
            <el-descriptions-item label="面积">
              {{ selectedZone.width * selectedZone.height / 100 }} ㎡
            </el-descriptions-item>
            <el-descriptions-item label="客流数据来源" :span="2">
              <el-tag v-if="selectedZone.flowSource === 'realtime'" type="success">
                <el-icon><Connection /></el-icon>
                实时客流监控
              </el-tag>
              <el-tag v-else-if="selectedZone.flowSource === 'shop'" type="warning">
                <el-icon><DataAnalysis /></el-icon>
                商铺经营统计数据
              </el-tag>
              <el-tag v-else type="info">
                <el-icon><Warning /></el-icon>
                未接入实时客流系统
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section">
          <div class="section-title">
            <el-icon><User /></el-icon>
            客流数据
            <el-tag v-if="selectedZone.flowSource === 'realtime'" type="success" size="small" style="margin-left: 8px;">
              实时客流
            </el-tag>
            <el-tag v-else-if="selectedZone.flowSource === 'shop'" type="warning" size="small" style="margin-left: 8px;">
              商铺统计客流
            </el-tag>
            <el-tag v-else type="info" size="small" style="margin-left: 8px;">
              未接入
            </el-tag>
          </div>
          <div class="flow-stats">
            <div class="flow-stat">
              <div class="stat-label">当前客流</div>
              <div class="stat-value" :class="{ 'text-muted': selectedZone.flowSource === 'unavailable' }">
                {{ selectedZone.flowSource === 'unavailable' ? '--' : selectedZone.passengerFlow }}
              </div>
            </div>
            <div class="flow-stat">
              <div class="stat-label">最大容量</div>
              <div class="stat-value">{{ selectedZone.capacity }}</div>
            </div>
            <div class="flow-stat">
              <div class="stat-label">占用率</div>
              <div class="stat-value">
                <el-progress
                  :percentage="selectedZone.flowSource === 'unavailable' ? 0 : Math.round(selectedZone.passengerFlow / selectedZone.capacity * 100)"
                  :color="getFlowColor(selectedZone.flowSource === 'unavailable' ? 0 : selectedZone.passengerFlow / selectedZone.capacity)"
                  :status="selectedZone.flowSource === 'unavailable' ? 'exception' : undefined"
                />
              </div>
            </div>
          </div>
          <div v-if="selectedZone.flowSource === 'unavailable'" class="flow-notice unavailable">
            <el-icon><InfoFilled /></el-icon>
            <span>该区域暂未接入实时客流监控系统，当前显示容量为预设值，客流数据待接入</span>
          </div>
          <div v-else-if="selectedZone.flowSource === 'shop'" class="flow-notice shop">
            <el-icon><InfoFilled /></el-icon>
            <span>该区域为独立商铺，客流数据来自经营统计，公共区域客流告警不会影响本区域状态</span>
          </div>
          <div v-else-if="selectedZone.evacuationAlert" class="flow-notice alert">
            <el-icon><Warning /></el-icon>
            <span>当前客流已超过安全阈值，建议立即启动疏散预案</span>
          </div>
          <div v-else class="flow-notice normal">
            <el-icon><CircleCheck /></el-icon>
            <span>客流状态正常，实时数据每5秒自动刷新</span>
          </div>
        </div>

        <div class="detail-section">
          <div class="section-title">
            <el-icon><Tools /></el-icon>
            关联设备
          </div>
          <el-empty v-if="!selectedZone.equipments || selectedZone.equipments.length === 0" description="暂无接入设备" :image-size="80" />
          <el-table v-else :data="selectedZone.equipments" size="small" border>
            <el-table-column prop="name" label="设备名称" />
            <el-table-column prop="type" label="设备类型">
              <template #default="scope">
                {{ getEquipmentTypeText(scope.row.type) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="运行状态" width="120">
              <template #default="scope">
                <span :class="['status-tag', scope.row.status]">
                  {{ getStatusText(scope.row.status) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="runHours" label="运行时长">
              <template #default="scope">
                {{ scope.row.runHours.toLocaleString() }} 小时
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div v-if="selectedZone.flowSource === 'realtime' && selectedZone.evacuationAlert" class="detail-section action-section">
          <div class="section-title">
            <el-icon><Warning /></el-icon>
            应急处置
            <el-tag type="danger" effect="dark" size="small" style="margin-left: 8px;">
              客流超限告警中
            </el-tag>
          </div>
          <div class="action-buttons">
            <el-button type="danger" @click="openEvacuationDialog">
              <el-icon><Guide /></el-icon>
              发起疏散任务
            </el-button>
            <el-button type="warning" @click="handleCallSecurity">
              <el-icon><Phone /></el-icon>
              一键呼叫安保
            </el-button>
            <el-button type="info" @click="handleViewAlertList">
              <el-icon><List /></el-icon>
              查看所有告警
            </el-button>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="evacuationDialogVisible"
      title="发起疏散任务"
      width="550px"
      class="evacuation-dialog"
    >
      <el-form :model="evacuationForm" :rules="evacuationRules" ref="evacuationFormRef" label-width="100px">
        <el-form-item label="告警区域">
          <el-input :model-value="selectedZone?.name" disabled />
        </el-form-item>
        <el-form-item label="当前人数">
          <el-input :model-value="selectedZone?.passengerFlow" disabled />
        </el-form-item>
        <el-form-item label="容量占比">
          <el-tag type="danger" effect="dark">
            {{ selectedZone ? Math.round(selectedZone.passengerFlow / selectedZone.capacity * 100) : 0 }}%
          </el-tag>
        </el-form-item>
        <el-form-item label="指派安保" prop="securityStaffId">
          <el-select v-model="evacuationForm.securityStaffId" placeholder="请选择安保人员" style="width: 100%">
            <el-option
              v-for="staff in availableSecurityStaff"
              :key="staff.id"
              :label="`${staff.name} - ${staff.status === 'on_duty' ? '在岗' : '忙碌'}`"
              :value="staff.id"
              :disabled="staff.status !== 'on_duty'"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="疏散方式" prop="evacuateMethod">
          <el-radio-group v-model="evacuationForm.evacuateMethod">
            <el-radio value="broadcast">广播引导</el-radio>
            <el-radio value="manual">人工引导</el-radio>
            <el-radio value="emergency">紧急疏散</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="疏散路线" prop="evacuateRoute">
          <el-select v-model="evacuationForm.evacuateRoute" placeholder="请选择疏散路线" style="width: 100%">
            <el-option label="1号安全出口" value="1号安全出口" />
            <el-option label="2号安全出口" value="2号安全出口" />
            <el-option label="3号安全出口" value="3号安全出口" />
            <el-option label="就近疏散" value="就近疏散" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理备注">
          <el-input v-model="evacuationForm.remark" type="textarea" :rows="3" placeholder="请输入处理备注（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="evacuationDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="handleSubmitEvacuation">
          <el-icon><Warning /></el-icon>
          提交疏散任务
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMallStore } from '@/stores/mall'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Refresh, InfoFilled, User, Tools, Warning, Guide, Phone, List, Connection, DataAnalysis, CircleCheck } from '@element-plus/icons-vue'
import type { MapZone, Equipment, EvacuationTask } from '@/types'

const router = useRouter()

interface MapZoneWithFlow extends MapZone {
  flowZoneName?: string
  evacuationAlert?: boolean
  hasIndependentFlow?: boolean
  flowSource?: 'realtime' | 'shop' | 'unavailable'
  flowData?: {
    zone: string
    currentCount: number
    capacity: number
    threshold: number
    trend?: string
  } | null
  passengerFlowId?: string
}

const mallStore = useMallStore()

const currentFloor = ref(1)
const updateTime = ref('')
const dialogVisible = ref(false)
const selectedZone = ref<MapZoneWithFlow | null>(null)
const refreshCounter = ref(0)

const evacuationDialogVisible = ref(false)
const evacuationFormRef = ref<FormInstance>()
const evacuationForm = ref({
  securityStaffId: '',
  securityStaffName: '',
  evacuateMethod: 'broadcast' as EvacuationTask['evacuateMethod'],
  evacuateRoute: '',
  remark: ''
})

const evacuationRules: FormRules = {
  securityStaffId: [
    { required: true, message: '请选择安保人员', trigger: 'change' }
  ],
  evacuateMethod: [
    { required: true, message: '请选择疏散方式', trigger: 'change' }
  ],
  evacuateRoute: [
    { required: true, message: '请选择疏散路线', trigger: 'change' }
  ]
}

const floorNames: Record<number, string> = {
  '-1': 'B1层',
  '1': '1层',
  '2': '2层',
  '3': '3层',
  '4': '4层',
  '5': '5层'
}

const floorName = computed(() => floorNames[currentFloor.value] || '')

const publicZoneFlowMapping: Record<string, string> = {
  '主中庭': '1楼中庭',
  '2楼中庭': '2楼服饰区',
  '正门入口': '1楼正门'
}

const zoneHasIndependentFlow: Record<string, boolean> = {
  '主中庭': true,
  '2楼中庭': true,
  '正门入口': true,
  '优衣库': false,
  '星巴克': false,
  'Apple Store': false,
  'H&M': false,
  '喜茶': false,
  '海底捞火锅': false,
  '万达影城': false
}

const zoneEquipmentMapping: Record<string, string[]> = {
  '主中庭': ['E004', 'E005', 'E007'],
  '2楼中庭': ['E005', 'E006', 'E008'],
  '正门入口': [],
  '优衣库': ['E001', 'E004'],
  '星巴克': ['E001', 'E007'],
  'Apple Store': ['E002', 'E007'],
  'H&M': ['E005', 'E008'],
  '喜茶': ['E008'],
  '海底捞火锅': ['E009'],
  '万达影城': ['E002']
}

const availableSecurityStaff = computed(() =>
  mallStore.securityStaff.filter(s => s.status !== 'off_duty')
)

const currentMapZones = computed<MapZoneWithFlow[]>(() => {
  void refreshCounter.value
  return mallStore.mapZones.map(zone => {
    const isPublicZone = zone.type === 'corridor' || zone.type === 'entrance'
    const hasIndependentFlow = zoneHasIndependentFlow[zone.name] ?? isPublicZone
    const mappedZoneName = publicZoneFlowMapping[zone.name] || zone.name

    let flowSource: 'realtime' | 'shop' | 'unavailable' = 'unavailable'
    let flowData = null
    let passengerFlowId: string | undefined

    if (isPublicZone && hasIndependentFlow) {
      flowData = mallStore.passengerFlows.find(
        pf => pf.floor === zone.floor && pf.zone === mappedZoneName
      )
      if (flowData) {
        flowSource = 'realtime'
        passengerFlowId = flowData.id
      }
    } else if (zone.type === 'shop' && zone.passengerFlow > 0) {
      flowSource = 'shop'
    }

    const equipmentIds = zoneEquipmentMapping[zone.name] || []
    const zoneEquipments = equipmentIds.length > 0
      ? equipmentIds
          .map(id => mallStore.equipments.find(e => e.id === id))
          .filter((e): e is Equipment => e !== undefined)
      : []

    return {
      ...zone,
      passengerFlow: flowData?.currentCount ?? zone.passengerFlow,
      capacity: flowData?.capacity ?? zone.capacity,
      evacuationAlert: flowData?.evacuationAlert ?? false,
      flowZoneName: isPublicZone ? mappedZoneName : zone.name,
      hasIndependentFlow,
      flowSource,
      flowData,
      passengerFlowId,
      equipments: zoneEquipments
    }
  })
})

const floorZones = computed(() =>
  currentMapZones.value.filter(z => z.floor === currentFloor.value)
)

const getHeatColor = (ratio: number, type: string, flowSource: string) => {
  if (flowSource === 'unavailable') {
    return '#e5e7eb'
  }
  if (flowSource === 'shop') {
    return '#93c5fd'
  }

  const baseColors: Record<string, string[]> = {
    shop: ['#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6'],
    corridor: ['#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b'],
    entrance: ['#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399', '#10b981'],
    facility: ['#fef3c7', '#fde68a', '#fcd34d', '#fbbf24', '#f59e0b']
  }

  const colors = baseColors[type] || baseColors.shop
  const index = Math.min(Math.floor(ratio * colors.length), colors.length - 1)
  return colors[Math.max(0, index)]
}

const getZoneStyle = (zone: MapZoneWithFlow) => {
  const ratio = zone.flowSource === 'unavailable' ? 0 : zone.passengerFlow / zone.capacity
  const baseColor = getHeatColor(ratio, zone.type, zone.flowSource || 'unavailable')
  const opacity = zone.flowSource === 'unavailable' ? 0.4 : 0.7 + ratio * 0.3

  return {
    left: zone.x + 'px',
    top: zone.y + 'px',
    width: zone.width + 'px',
    height: zone.height + 'px',
    background: `linear-gradient(135deg, ${baseColor}dd 0%, ${baseColor}99 100%)`,
    opacity
  }
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    running: '运行中',
    standby: '待机',
    maintenance: '维护中',
    fault: '故障'
  }
  return map[status] || status
}

const getEquipmentTypeText = (type: string) => {
  const map: Record<string, string> = {
    elevator: '电梯',
    escalator: '扶梯',
    air_conditioner: '中央空调'
  }
  return map[type] || type
}

const getZoneTypeText = (type: string) => {
  const map: Record<string, string> = {
    shop: '店铺',
    corridor: '通道',
    entrance: '入口',
    facility: '设施'
  }
  return map[type] || type
}

const getZoneTypeTag = (type: string) => {
  const map: Record<string, string> = {
    shop: 'primary',
    corridor: 'info',
    entrance: 'success',
    facility: 'warning'
  }
  return map[type] || 'info'
}

const getFlowColor = (ratio: number) => {
  if (ratio >= 0.85) return '#ef4444'
  if (ratio >= 0.7) return '#f59e0b'
  if (ratio >= 0.5) return '#eab308'
  return '#10b981'
}

const updateTimeDisplay = () => {
  updateTime.value = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const handleFloorChange = () => {
  mallStore.currentFloor = currentFloor.value
}

const handleRefresh = () => {
  refreshCounter.value++
  mallStore.updatePassengerFlow()
  mallStore.checkAndCreateMaintenanceOrders()
  updateTimeDisplay()
  ElMessage.success('数据已刷新')
}

const handleZoneClick = (zone: MapZoneWithFlow) => {
  selectedZone.value = zone
  dialogVisible.value = true
}

const openEvacuationDialog = () => {
  if (!selectedZone.value?.passengerFlowId) {
    ElMessage.warning('该区域无法发起疏散任务')
    return
  }
  evacuationForm.value = {
    securityStaffId: '',
    securityStaffName: '',
    evacuateMethod: 'broadcast',
    evacuateRoute: '',
    remark: ''
  }
  evacuationDialogVisible.value = true
}

const handleCallSecurity = () => {
  if (!selectedZone.value?.passengerFlowId) return

  const onDutyStaff = mallStore.securityStaff.find(s => s.status === 'on_duty')
  if (!onDutyStaff) {
    ElMessage.warning('暂无在岗安保人员')
    return
  }

  ElMessageBox.confirm(
    `确定呼叫 ${onDutyStaff.name} 前往 ${selectedZone.value.name} 处置吗？`,
    '呼叫安保',
    {
      confirmButtonText: '确认呼叫',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const task = mallStore.createEvacuationTask(selectedZone.value!.passengerFlowId!, {
      securityStaffId: onDutyStaff.id,
      securityStaffName: onDutyStaff.name,
      evacuateMethod: 'manual',
      evacuateRoute: '就近疏散',
      remark: `一键呼叫安保处置`
    })

    if (task) {
      mallStore.startEvacuationTask(task.id)
      ElMessage.success(`已呼叫 ${onDutyStaff.name} 前往处置`)
    }
  }).catch(() => {})
}

const handleViewAlertList = () => {
  dialogVisible.value = false
  router.push('/passenger/alerts')
}

const handleSubmitEvacuation = async () => {
  if (!evacuationFormRef.value || !selectedZone.value?.passengerFlowId) return

  const valid = await evacuationFormRef.value.validate().catch(() => false)
  if (!valid) return

  const staff = mallStore.securityStaff.find(s => s.id === evacuationForm.value.securityStaffId)

  const task = mallStore.createEvacuationTask(selectedZone.value.passengerFlowId!, {
    securityStaffId: evacuationForm.value.securityStaffId,
    securityStaffName: staff?.name,
    evacuateMethod: evacuationForm.value.evacuateMethod,
    evacuateRoute: evacuationForm.value.evacuateRoute,
    remark: evacuationForm.value.remark
  })

  if (task) {
    ElMessage.success('疏散任务已创建，相关人员已收到通知')
    evacuationDialogVisible.value = false
    dialogVisible.value = false
  } else {
    ElMessage.error('该区域已有待处理的疏散任务')
  }
}

let updateTimer: number | null = null

onMounted(() => {
  updateTimeDisplay()
  currentFloor.value = mallStore.currentFloor
  updateTimer = window.setInterval(() => {
    mallStore.updatePassengerFlow()
    updateTimeDisplay()
  }, 5000)
})

onUnmounted(() => {
  if (updateTimer) {
    clearInterval(updateTimer)
  }
})
</script>

<style lang="scss" scoped>
.header-actions {
  display: flex;
  align-items: center;
}

.map-wrapper {
  display: flex;
  gap: 16px;
  height: calc(100vh - 200px);
}

.map-legend {
  width: 220px;
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  flex-shrink: 0;

  .legend-title {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e2e8f0;
  }

  .legend-section {
    margin-bottom: 16px;

    .legend-label {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 8px;
      font-weight: 500;
    }

    .legend-gradient {
      .gradient-bar {
        height: 12px;
        border-radius: 6px;
        background: linear-gradient(90deg, #22c55e 0%, #eab308 50%, #ef4444 100%);
      }

      .gradient-labels {
        display: flex;
        justify-content: space-between;
        margin-top: 4px;
        font-size: 10px;
        color: #94a3b8;
      }
    }

    .legend-items {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: #64748b;

        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 4px;

          &.shop {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          }

          &.corridor {
            background: linear-gradient(135deg, #64748b 0%, #475569 100%);
          }

          &.entrance {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          }

          &.facility {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          }
        }

        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;

          &.running {
            background: #10b981;
          }

          &.standby {
            background: #64748b;
          }

          &.maintenance {
            background: #f59e0b;
          }

          &.fault {
            background: #ef4444;
            animation: blink 1s infinite;
          }
        }

        .legend-alert {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          border: 2px solid #ef4444;
          animation: alertBlink 1s infinite;
        }
      }
  }
}

.map-container {
  flex: 1;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .map-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;

    .floor-name {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }

    .update-time {
      font-size: 12px;
      color: #94a3b8;
    }
  }

  .map-content {
    flex: 1;
    position: relative;
    background: #f8fafc;
    overflow: auto;
    min-height: 500px;
  }
}

.map-zone {
  position: absolute;
  border: 2px solid rgba(255, 255, 255, 0.8);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: scale(1.05);
    z-index: 10;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
    border-color: rgba(255, 255, 255, 1);
  }

  &.flow-unavailable {
    color: #94a3b8;
    text-shadow: none;
    border-style: dashed;
  }

  &.shop-static {
    border-color: rgba(255, 255, 255, 0.9);
  }

  &.alert-blink {
    border: 3px solid #ef4444;
    animation: alertBlink 1s infinite;
    z-index: 5;
  }

  &.density-alert {
    border: 3px solid #ef4444;
    animation: alertBlink 1s infinite;
    z-index: 5;
  }

  .zone-name {
    font-size: 12px;
    text-align: center;
    padding: 0 4px;
  }

  .zone-flow {
    font-size: 10px;
    opacity: 0.9;
    margin-top: 2px;

    &.dimmed {
      opacity: 0.6;
    }
  }

  .flow-badge {
    position: absolute;
    bottom: 4px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 9px;
    padding: 1px 6px;
    border-radius: 3px;
    background: rgba(0, 0, 0, 0.3);

    &.shop {
      background: #f59e0b;
    }

    &.unavailable {
      background: #64748b;
    }
  }

  .zone-equipment {
    position: absolute;
    top: -8px;
    right: -8px;
    display: flex;
    gap: 2px;

    .eq-indicator {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);

      &.running {
        background: #10b981;
      }

      &.fault {
        background: #ef4444;
        animation: blink 1s infinite;
      }

      &.maintenance {
        background: #f59e0b;
      }

      &.standby {
        background: #64748b;
      }
    }
  }
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.5; }
}

@keyframes alertBlink {
  0%, 100% {
    border-color: #ef4444;
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  50% {
    border-color: #dc2626;
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
  }
}

.zone-detail {
  .detail-section {
    margin-bottom: 20px;

    .section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 12px;
    }

    &.action-section {
      background: linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%);
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 16px;
    }
  }

  .flow-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;

    .flow-stat {
      background: #f8fafc;
      border-radius: 8px;
      padding: 16px;
      text-align: center;

      .stat-label {
        font-size: 12px;
        color: #64748b;
        margin-bottom: 8px;
      }

      .stat-value {
        font-size: 24px;
        font-weight: 700;
        color: #1e293b;

        &.text-muted {
          color: #94a3b8;
        }
      }
    }
  }

  .flow-notice {
    margin-top: 12px;
    padding: 12px;
    border-radius: 4px;
    font-size: 12px;
    display: flex;
    align-items: flex-start;
    gap: 6px;

    .el-icon {
      margin-top: 1px;
      flex-shrink: 0;
    }

    &.unavailable {
      background: #f1f5f9;
      border-left: 3px solid #64748b;
      color: #475569;
    }

    &.shop {
      background: #fffbeb;
      border-left: 3px solid #f59e0b;
      color: #92400e;
    }

    &.alert {
      background: #fef2f2;
      border-left: 3px solid #ef4444;
      color: #991b1b;
    }

    &.normal {
      background: #f0fdf4;
      border-left: 3px solid #10b981;
      color: #166534;
    }
  }

  .action-buttons {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  :deep(.el-descriptions__label) {
    background: #f8fafc;
    width: 100px;
  }
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;

  &.running {
    background: #dcfce7;
    color: #166534;
  }

  &.standby {
    background: #f1f5f9;
    color: #475569;
  }

  &.maintenance {
    background: #fef3c7;
    color: #92400e;
  }

  &.fault {
    background: #fee2e2;
    color: #991b1b;
  }
}

.text-muted {
  color: #94a3b8;
}
</style>
