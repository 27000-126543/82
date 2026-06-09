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
              'alert-blink': zone.evacuationAlert,
              'density-alert': zone.passengerFlow / zone.capacity >= 0.85
            }]"
            :style="getZoneStyle(zone)"
            @click="handleZoneClick(zone)"
          >
            <span class="zone-name">{{ zone.name }}</span>
            <span class="zone-flow">{{ Math.round(zone.passengerFlow / zone.capacity * 100) }}%</span>
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
      width="600px"
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
            <el-descriptions-item label="对应客流区域" :span="2">
              <el-tag type="info">{{ selectedZone.flowZoneName || selectedZone.name }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section">
          <div class="section-title">
            <el-icon><User /></el-icon>
            客流数据
          </div>
          <div class="flow-stats">
            <div class="flow-stat">
              <div class="stat-label">当前客流</div>
              <div class="stat-value">{{ selectedZone.passengerFlow }}</div>
            </div>
            <div class="flow-stat">
              <div class="stat-label">最大容量</div>
              <div class="stat-value">{{ selectedZone.capacity }}</div>
            </div>
            <div class="flow-stat">
              <div class="stat-label">占用率</div>
              <div class="stat-value">
                <el-progress
                  :percentage="Math.round(selectedZone.passengerFlow / selectedZone.capacity * 100)"
                  :color="getFlowColor(selectedZone.passengerFlow / selectedZone.capacity)"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="detail-section" v-if="selectedZone.equipments && selectedZone.equipments.length > 0">
          <div class="section-title">
            <el-icon><Tools /></el-icon>
            设备列表
          </div>
          <el-table :data="selectedZone.equipments" size="small" border>
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
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMallStore } from '@/stores/mall'
import { ElMessage } from 'element-plus'
import { Refresh, InfoFilled, User, Tools } from '@element-plus/icons-vue'
import type { MapZone, Equipment } from '@/types'

interface MapZoneWithFlow extends MapZone {
  flowZoneName?: string
  evacuationAlert?: boolean
}

const mallStore = useMallStore()

const currentFloor = ref(1)
const updateTime = ref('')
const dialogVisible = ref(false)
const selectedZone = ref<MapZoneWithFlow | null>(null)
const refreshCounter = ref(0)

const floorNames: Record<number, string> = {
  '-1': 'B1层',
  '1': '1层',
  '2': '2层',
  '3': '3层',
  '4': '4层',
  '5': '5层'
}

const floorName = computed(() => floorNames[currentFloor.value] || '')

const zoneFlowMapping: Record<string, string> = {
  '主中庭': '1楼中庭',
  '2楼中庭': '2楼服饰区',
  '正门入口': '1楼正门',
  '优衣库': '1楼中庭',
  '星巴克': '1楼中庭',
  'Apple Store': '1楼正门',
  'H&M': '2楼服饰区',
  '喜茶': '2楼服饰区',
  '海底捞火锅': '4楼餐饮区',
  '万达影城': '5楼影院区'
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

const currentMapZones = computed<MapZoneWithFlow[]>(() => {
  void refreshCounter.value
  return mallStore.mapZones.map(zone => {
    const mappedZoneName = zoneFlowMapping[zone.name] || zone.name

    const flowData = mallStore.passengerFlows.find(
      pf => pf.floor === zone.floor && pf.zone === mappedZoneName
    )

    const equipmentIds = zoneEquipmentMapping[zone.name] || []
    const zoneEquipments = equipmentIds.length > 0
      ? equipmentIds
          .map(id => mallStore.equipments.find(e => e.id === id))
          .filter((e): e is Equipment => e !== undefined)
      : mallStore.equipments.filter(
          eq => eq.floor === zone.floor &&
                (zone.name.includes(eq.location) ||
                 eq.location.includes(zone.name) ||
                 zone.type === 'corridor' ||
                 zone.type === 'entrance')
        )

    return {
      ...zone,
      passengerFlow: flowData?.currentCount ?? zone.passengerFlow,
      capacity: flowData?.capacity ?? zone.capacity,
      evacuationAlert: flowData?.evacuationAlert ?? false,
      flowZoneName: mappedZoneName,
      equipments: zoneEquipments.length > 0 ? zoneEquipments : zone.equipments
    }
  })
})

const floorZones = computed(() =>
  currentMapZones.value.filter(z => z.floor === currentFloor.value)
)

const getHeatColor = (ratio: number, type: string) => {
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

const getZoneStyle = (zone: MapZone) => {
  const ratio = zone.passengerFlow / zone.capacity
  const baseColor = getHeatColor(ratio, zone.type)
  return {
    left: zone.x + 'px',
    top: zone.y + 'px',
    width: zone.width + 'px',
    height: zone.height + 'px',
    background: `linear-gradient(135deg, ${baseColor}dd 0%, ${baseColor}99 100%)`,
    opacity: 0.7 + ratio * 0.3
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

const handleZoneClick = (zone: MapZone) => {
  selectedZone.value = zone
  dialogVisible.value = true
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
  width: 200px;
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
      }
    }
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
</style>
