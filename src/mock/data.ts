import dayjs from 'dayjs'
import type {
  Shop, RenewalApplication, NewTenantApplication, Equipment,
  MaintenanceOrder, SparePart, ParkingSpace, ParkingRecord, Member,
  PassengerFlow, CleaningStaff, CleaningSchedule, MapZone, Notification
} from '@/types'

const generateId = () => Math.random().toString(36).substring(2, 10)

export const mockShops: Shop[] = [
  {
    id: 'S001', name: '优衣库', floor: 1, area: 500, category: '服装',
    tenantName: '迅销集团', contact: '张经理', phone: '13800138001',
    contractStart: '2023-01-01', contractEnd: '2026-12-31',
    monthlyRent: 150000, status: 'normal',
    businessData: { dailyRevenue: [35000, 42000, 38000, 45000, 52000, 48000, 55000], monthlyRevenue: 315000, customerFlow: 12500 }
  },
  {
    id: 'S002', name: '海底捞火锅', floor: 4, area: 800, category: '餐饮',
    tenantName: '海底捞餐饮', contact: '李店长', phone: '13800138002',
    contractStart: '2022-06-01', contractEnd: '2026-06-30',
    monthlyRent: 240000, status: 'expiring',
    businessData: { dailyRevenue: [85000, 92000, 88000, 95000, 102000, 128000, 135000], monthlyRevenue: 725000, customerFlow: 8500 },
    renewalReminder: true
  },
  {
    id: 'S003', name: '星巴克', floor: 1, area: 150, category: '餐饮',
    tenantName: '星巴克中国', contact: '王店长', phone: '13800138003',
    contractStart: '2023-03-01', contractEnd: '2027-02-28',
    monthlyRent: 75000, status: 'normal',
    businessData: { dailyRevenue: [28000, 32000, 30000, 35000, 38000, 42000, 45000], monthlyRevenue: 250000, customerFlow: 6200 }
  },
  {
    id: 'S004', name: 'H&M', floor: 2, area: 1200, category: '服装',
    tenantName: '海恩斯莫里斯', contact: '赵经理', phone: '13800138004',
    contractStart: '2021-09-01', contractEnd: '2026-08-31',
    monthlyRent: 360000, status: 'expiring',
    businessData: { dailyRevenue: [55000, 58000, 52000, 60000, 65000, 72000, 78000], monthlyRevenue: 440000, customerFlow: 15800 },
    renewalReminder: true
  },
  {
    id: 'S005', name: 'Apple Store', floor: 1, area: 600, category: '数码',
    tenantName: '苹果中国', contact: '陈经理', phone: '13800138005',
    contractStart: '2023-06-01', contractEnd: '2028-05-31',
    monthlyRent: 300000, status: 'normal',
    businessData: { dailyRevenue: [120000, 135000, 128000, 145000, 160000, 180000, 195000], monthlyRevenue: 1063000, customerFlow: 9800 }
  },
  {
    id: 'S006', name: '万达影城', floor: 5, area: 2000, category: '娱乐',
    tenantName: '万达院线', contact: '刘经理', phone: '13800138006',
    contractStart: '2022-01-01', contractEnd: '2027-01-31',
    monthlyRent: 500000, status: 'normal',
    businessData: { dailyRevenue: [45000, 52000, 48000, 65000, 85000, 120000, 130000], monthlyRevenue: 545000, customerFlow: 22000 }
  },
  {
    id: 'S007', name: '永辉超市', floor: -1, area: 3000, category: '零售',
    tenantName: '永辉超市', contact: '周店长', phone: '13800138007',
    contractStart: '2021-03-01', contractEnd: '2026-02-28',
    monthlyRent: 450000, status: 'expiring',
    businessData: { dailyRevenue: [180000, 195000, 188000, 210000, 230000, 260000, 280000], monthlyRevenue: 1543000, customerFlow: 35000 },
    renewalReminder: true
  },
  {
    id: 'S008', name: '喜茶', floor: 2, area: 80, category: '餐饮',
    tenantName: '喜茶', contact: '吴店长', phone: '13800138008',
    contractStart: '2024-01-01', contractEnd: '2028-12-31',
    monthlyRent: 48000, status: 'normal',
    businessData: { dailyRevenue: [18000, 22000, 20000, 25000, 28000, 32000, 35000], monthlyRevenue: 180000, customerFlow: 4500 }
  }
]

export const mockRenewalApplications: RenewalApplication[] = [
  {
    id: generateId(), shopId: 'S002', shopName: '海底捞火锅', tenantName: '海底捞餐饮',
    currentContractEnd: '2026-06-30', proposedStart: '2026-07-01', proposedEnd: '2029-06-30',
    proposedRent: 260000, status: 'pending', createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    approvals: [
      { step: 1, role: '楼层经理', approver: '', status: 'pending', comment: '', time: '' },
      { step: 2, role: '运营经理', approver: '', status: 'pending', comment: '', time: '' },
      { step: 3, role: '总经理', approver: '', status: 'pending', comment: '', time: '' }
    ]
  },
  {
    id: generateId(), shopId: 'S004', shopName: 'H&M', tenantName: '海恩斯莫里斯',
    currentContractEnd: '2026-08-31', proposedStart: '2026-09-01', proposedEnd: '2029-08-31',
    proposedRent: 380000, status: 'pending', createTime: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    approvals: [
      { step: 1, role: '楼层经理', approver: '张三', status: 'approved', comment: '经营状况良好，建议续约', time: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss') },
      { step: 2, role: '运营经理', approver: '', status: 'pending', comment: '', time: '' },
      { step: 3, role: '总经理', approver: '', status: 'pending', comment: '', time: '' }
    ]
  }
]

export const mockNewTenantApplications: NewTenantApplication[] = [
  {
    id: generateId(), shopName: '李宁旗舰店', floor: 3, area: 400, category: '运动',
    tenantName: '李宁体育', contact: '孙经理', phone: '13900139001', businessLicense: '91110000123456789X',
    proposedStart: '2026-07-01', proposedEnd: '2029-06-30', proposedRent: 180000,
    status: 'floor_manager', currentStep: 1, createTime: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
    approvals: [
      { step: 1, role: '楼层经理', approver: '', status: 'pending', comment: '', time: '' },
      { step: 2, role: '运营经理', approver: '', status: 'pending', comment: '', time: '' },
      { step: 3, role: '总经理', approver: '', status: 'pending', comment: '', time: '' }
    ]
  },
  {
    id: generateId(), shopName: '小米之家', floor: 2, area: 250, category: '数码',
    tenantName: '小米科技', contact: '钱经理', phone: '13900139002', businessLicense: '91110000987654321X',
    proposedStart: '2026-08-01', proposedEnd: '2029-07-31', proposedRent: 120000,
    status: 'operation_manager', currentStep: 2, createTime: dayjs().subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss'),
    approvals: [
      { step: 1, role: '楼层经理', approver: '李四', status: 'approved', comment: '品牌影响力大，有助于提升商场形象', time: dayjs().subtract(4, 'day').format('YYYY-MM-DD HH:mm:ss') },
      { step: 2, role: '运营经理', approver: '', status: 'pending', comment: '', time: '' },
      { step: 3, role: '总经理', approver: '', status: 'pending', comment: '', time: '' }
    ]
  }
]

export const mockEquipments: Equipment[] = [
  { id: 'E001', name: '1号客梯', type: 'elevator', location: 'A座', floor: 1, status: 'running', runHours: 12580, lastMaintenance: '2026-05-15', nextMaintenance: '2026-06-15', speed: 2.5 },
  { id: 'E002', name: '2号客梯', type: 'elevator', location: 'A座', floor: 1, status: 'running', runHours: 12450, lastMaintenance: '2026-05-15', nextMaintenance: '2026-06-15', speed: 2.5 },
  { id: 'E003', name: '3号货梯', type: 'elevator', location: 'B座', floor: -1, status: 'standby', runHours: 8920, lastMaintenance: '2026-05-20', nextMaintenance: '2026-06-20', speed: 1.5 },
  { id: 'E004', name: '1号扶梯', type: 'escalator', location: '中庭', floor: 1, status: 'running', runHours: 15680, lastMaintenance: '2026-05-10', nextMaintenance: '2026-06-10', speed: 0.5 },
  { id: 'E005', name: '2号扶梯', type: 'escalator', location: '中庭', floor: 2, status: 'running', runHours: 15200, lastMaintenance: '2026-05-10', nextMaintenance: '2026-06-10', speed: 0.5 },
  { id: 'E006', name: '3号扶梯', type: 'escalator', location: '中庭', floor: 3, status: 'maintenance', runHours: 14800, lastMaintenance: '2026-05-10', nextMaintenance: '2026-06-10', speed: 0.5 },
  { id: 'E007', name: '1号中央空调', type: 'air_conditioner', location: '主楼', floor: 1, status: 'running', runHours: 25800, lastMaintenance: '2026-04-01', nextMaintenance: '2026-07-01', temperature: 24 },
  { id: 'E008', name: '2号中央空调', type: 'air_conditioner', location: '副楼', floor: 1, status: 'running', runHours: 24500, lastMaintenance: '2026-04-01', nextMaintenance: '2026-07-01', temperature: 23 },
  { id: 'E009', name: '3号中央空调', type: 'air_conditioner', location: 'B座', floor: 1, status: 'fault', runHours: 26100, lastMaintenance: '2026-04-01', nextMaintenance: '2026-07-01', temperature: 28, faultCode: 'E-101' }
]

export const mockMaintenanceOrders: MaintenanceOrder[] = [
  {
    id: 'MO001', equipmentId: 'E006', equipmentName: '3号扶梯', type: 'routine',
    description: '月度例行保养', priority: 'medium', assigneeTeam: '电梯组', assignee: '王师傅',
    status: 'in_progress', createTime: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    startTime: dayjs().format('YYYY-MM-DD HH:mm:ss'), partsUsed: [], cost: 0
  },
  {
    id: 'MO002', equipmentId: 'E009', equipmentName: '3号中央空调', type: 'fault',
    description: '压缩机故障，需要更换', priority: 'urgent', assigneeTeam: '空调组', assignee: '李师傅',
    status: 'pending', createTime: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    partsUsed: ['压缩机', '制冷剂'], cost: 25000
  },
  {
    id: 'MO003', equipmentId: 'E001', equipmentName: '1号客梯', type: 'preventive',
    description: '运行时长达到12000小时，建议更换钢丝绳', priority: 'high', assigneeTeam: '电梯组', assignee: '张师傅',
    status: 'pending', createTime: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    partsUsed: ['电梯钢丝绳'], cost: 8000
  }
]

export const mockSpareParts: SparePart[] = [
  { id: 'P001', name: '电梯钢丝绳', spec: '8mm', quantity: 5, safeStock: 10, unit: '卷', location: 'A库-01', lastRestock: '2026-05-01' },
  { id: 'P002', name: '压缩机', spec: '5P', quantity: 2, safeStock: 3, unit: '台', location: 'B库-03', lastRestock: '2026-04-15' },
  { id: 'P003', name: '制冷剂', spec: 'R410A', quantity: 8, safeStock: 5, unit: 'kg', location: 'B库-05', lastRestock: '2026-05-20' },
  { id: 'P004', name: '扶梯梯级', spec: '1000mm', quantity: 12, safeStock: 20, unit: '个', location: 'A库-05', lastRestock: '2026-03-10' },
  { id: 'P005', name: '空调滤网', spec: '800x600', quantity: 3, safeStock: 15, unit: '片', location: 'B库-07', lastRestock: '2026-02-28' },
  { id: 'P006', name: '电梯门机', spec: '标准型', quantity: 1, safeStock: 5, unit: '套', location: 'A库-03', lastRestock: '2026-01-15' }
]

export const mockParkingSpaces: ParkingSpace[] = Array.from({ length: 100 }, (_, i) => {
  const floor = i < 40 ? -1 : i < 70 ? -2 : -3
  const zones = ['A区', 'B区', 'C区', 'D区']
  const zone = zones[Math.floor(Math.random() * zones.length)]
  const statuses: ParkingSpace['status'][] = ['available', 'occupied', 'available', 'available', 'occupied', 'available']
  const status = statuses[Math.floor(Math.random() * statuses.length)]
  return {
    id: `PS${String(i + 1).padStart(3, '0')}`,
    number: `P${floor}-${String(i + 1).padStart(3, '0')}`,
    floor, zone, status,
    ...(status === 'occupied' && {
      licensePlate: ['京A', '京B', '沪A', '粤A', '苏A'][Math.floor(Math.random() * 5)] + String(Math.floor(Math.random() * 90000) + 10000),
      entryTime: dayjs().subtract(Math.floor(Math.random() * 180), 'minute').format('YYYY-MM-DD HH:mm:ss'),
      memberLevel: ['normal', 'silver', 'gold', 'platinum', 'diamond'][Math.floor(Math.random() * 5)]
    })
  }
})

export const mockParkingRecords: ParkingRecord[] = [
  {
    id: generateId(), licensePlate: '京A12345', spaceId: 'PS001',
    entryTime: dayjs().subtract(120, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    totalFee: 20, discount: 10, actualFee: 10, memberLevel: 'gold',
    status: 'parking', paymentReminder: true
  },
  {
    id: generateId(), licensePlate: '沪B67890', spaceId: 'PS045',
    entryTime: dayjs().subtract(240, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    totalFee: 40, discount: 0, actualFee: 40,
    status: 'parking', paymentReminder: true
  }
]

export const mockMembers: Member[] = [
  { id: 'M001', name: '张三', phone: '13800138001', level: 'diamond', plateNumber: '京A12345', freeParkingHours: 8, points: 58000 },
  { id: 'M002', name: '李四', phone: '13800138002', level: 'platinum', plateNumber: '京B67890', freeParkingHours: 6, points: 32000 },
  { id: 'M003', name: '王五', phone: '13800138003', level: 'gold', plateNumber: '沪A11111', freeParkingHours: 4, points: 15000 },
  { id: 'M004', name: '赵六', phone: '13800138004', level: 'silver', plateNumber: '粤A22222', freeParkingHours: 2, points: 5000 },
  { id: 'M005', name: '钱七', phone: '13800138005', level: 'normal', plateNumber: '苏A33333', freeParkingHours: 0, points: 500 }
]

const generateHourlyData = () => Array.from({ length: 24 }, () => Math.floor(Math.random() * 500) + 100)

export const mockPassengerFlows: PassengerFlow[] = [
  { id: 'PF001', zone: '1楼中庭', floor: 1, currentCount: 850, capacity: 1000, threshold: 800, trend: 'increasing', hourlyData: generateHourlyData(), dailyTotal: 8500, evacuationAlert: true },
  { id: 'PF002', zone: '1楼正门', floor: 1, currentCount: 450, capacity: 800, threshold: 640, trend: 'stable', hourlyData: generateHourlyData(), dailyTotal: 6200 },
  { id: 'PF003', zone: '2楼服饰区', floor: 2, currentCount: 620, capacity: 900, threshold: 720, trend: 'stable', hourlyData: generateHourlyData(), dailyTotal: 7800 },
  { id: 'PF004', zone: '3楼运动区', floor: 3, currentCount: 380, capacity: 700, threshold: 560, trend: 'decreasing', hourlyData: generateHourlyData(), dailyTotal: 5200 },
  { id: 'PF005', zone: '4楼餐饮区', floor: 4, currentCount: 720, capacity: 800, threshold: 640, trend: 'increasing', hourlyData: generateHourlyData(), dailyTotal: 9500, evacuationAlert: true },
  { id: 'PF006', zone: '5楼影院区', floor: 5, currentCount: 280, capacity: 500, threshold: 400, trend: 'increasing', hourlyData: generateHourlyData(), dailyTotal: 3800 },
  { id: 'PF007', zone: '-1楼超市区', floor: -1, currentCount: 580, capacity: 800, threshold: 640, trend: 'stable', hourlyData: generateHourlyData(), dailyTotal: 8900 }
]

export const mockCleaningStaff: CleaningStaff[] = [
  { id: 'CS001', name: '王阿姨', phone: '13600136001', team: '一组', skills: ['日常清洁', '玻璃清洁'] },
  { id: 'CS002', name: '李阿姨', phone: '13600136002', team: '一组', skills: ['日常清洁', '地面打蜡'] },
  { id: 'CS003', name: '张阿姨', phone: '13600136003', team: '一组', skills: ['日常清洁', '卫生间清洁'] },
  { id: 'CS004', name: '刘阿姨', phone: '13600136004', team: '二组', skills: ['日常清洁', '玻璃清洁'] },
  { id: 'CS005', name: '陈阿姨', phone: '13600136005', team: '二组', skills: ['日常清洁', '地毯清洁'] },
  { id: 'CS006', name: '赵阿姨', phone: '13600136006', team: '二组', skills: ['日常清洁', '地面打蜡'] },
  { id: 'CS007', name: '孙师傅', phone: '13600136007', team: '机动组', skills: ['高空清洁', '外墙清洗'] },
  { id: 'CS008', name: '周师傅', phone: '13600136008', team: '机动组', skills: ['高空清洁', '石材养护'] }
]

export const mockCleaningSchedules: CleaningSchedule[] = []
const zones = ['1楼', '2楼', '3楼', '4楼', '5楼', '-1楼', '公共区域', '卫生间']
const shifts: CleaningSchedule['shift'][] = ['morning', 'afternoon', 'night']
for (let day = 0; day < 7; day++) {
  mockCleaningStaff.forEach((staff, idx) => {
    if (Math.random() > 0.3) {
      mockCleaningSchedules.push({
        id: generateId(),
        staffId: staff.id,
        staffName: staff.name,
        date: dayjs().add(day, 'day').format('YYYY-MM-DD'),
        shift: shifts[idx % 3],
        zone: zones[Math.floor(Math.random() * zones.length)],
        status: 'scheduled'
      })
    }
  })
}

export const mockMapZones: MapZone[] = [
  { id: 'Z001', name: '优衣库', floor: 1, x: 50, y: 50, width: 200, height: 150, type: 'shop', passengerFlow: 850, capacity: 500, equipments: [mockEquipments[0], mockEquipments[3]] },
  { id: 'Z002', name: '星巴克', floor: 1, x: 270, y: 50, width: 120, height: 100, type: 'shop', passengerFlow: 320, capacity: 80, equipments: [mockEquipments[0]] },
  { id: 'Z003', name: 'Apple Store', floor: 1, x: 410, y: 50, width: 180, height: 150, type: 'shop', passengerFlow: 580, capacity: 300, equipments: [mockEquipments[1]] },
  { id: 'Z004', name: '主中庭', floor: 1, x: 200, y: 220, width: 300, height: 200, type: 'corridor', passengerFlow: 1200, capacity: 1000, equipments: [mockEquipments[3], mockEquipments[4], mockEquipments[6]] },
  { id: 'Z005', name: '正门入口', floor: 1, x: 300, y: 430, width: 100, height: 60, type: 'entrance', passengerFlow: 2000, capacity: 500, equipments: [] },
  { id: 'Z006', name: 'H&M', floor: 2, x: 50, y: 50, width: 250, height: 180, type: 'shop', passengerFlow: 720, capacity: 600, equipments: [mockEquipments[4]] },
  { id: 'Z007', name: '喜茶', floor: 2, x: 320, y: 50, width: 100, height: 80, type: 'shop', passengerFlow: 280, capacity: 50, equipments: [mockEquipments[7]] },
  { id: 'Z008', name: '2楼中庭', floor: 2, x: 180, y: 250, width: 280, height: 180, type: 'corridor', passengerFlow: 950, capacity: 900, equipments: [mockEquipments[4], mockEquipments[5]] },
  { id: 'Z009', name: '海底捞火锅', floor: 4, x: 50, y: 50, width: 300, height: 200, type: 'shop', passengerFlow: 680, capacity: 400, equipments: [mockEquipments[8]] },
  { id: 'Z010', name: '万达影城', floor: 5, x: 50, y: 50, width: 400, height: 250, type: 'shop', passengerFlow: 380, capacity: 600, equipments: [mockEquipments[1]] }
]

export const mockNotifications: Notification[] = [
  { id: generateId(), type: 'renewal', title: '续约提醒', message: '海底捞火锅合同将于30天后到期，请及时处理续约事宜', priority: 'high', read: false, time: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss') },
  { id: generateId(), type: 'equipment', title: '设备故障告警', message: '3号中央空调压缩机故障，需要紧急维修', priority: 'urgent', read: false, time: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss') },
  { id: generateId(), type: 'passenger', title: '客流超限预警', message: '1楼中庭当前客流已超过阈值，请注意疏导', priority: 'high', read: false, time: dayjs().subtract(30, 'minute').format('YYYY-MM-DD HH:mm:ss') },
  { id: generateId(), type: 'stock', title: '备件库存预警', message: '电梯钢丝绳库存已低于安全库存，请及时采购', priority: 'medium', read: true, time: dayjs().subtract(3, 'hour').format('YYYY-MM-DD HH:mm:ss') },
  { id: generateId(), type: 'parking', title: '停车缴费提醒', message: '车牌京A12345停车已超过2小时，请提醒车主缴费', priority: 'low', read: true, time: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss') },
  { id: generateId(), type: 'approval', title: '新商户入驻审批', message: '李宁旗舰店入驻申请待审批', priority: 'medium', read: true, time: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss') }
]
