import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import type { Shop, RenewalApplication, NewTenantApplication, Equipment, MaintenanceOrder, SparePart, ParkingSpace, ParkingRecord, Member, PassengerFlow, CleaningStaff, CleaningSchedule, SwapRequest, Notification, MapZone } from '@/types'
import { mockShops, mockRenewalApplications, mockNewTenantApplications, mockEquipments, mockMaintenanceOrders, mockSpareParts, mockParkingSpaces, mockParkingRecords, mockMembers, mockPassengerFlows, mockCleaningStaff, mockCleaningSchedules, mockMapZones, mockNotifications } from '@/mock/data'

const generateId = () => Math.random().toString(36).substring(2, 10)

export const useMallStore = defineStore('mall', () => {
  const shops = ref<Shop[]>([...mockShops])
  const renewalApplications = ref<RenewalApplication[]>([...mockRenewalApplications])
  const newTenantApplications = ref<NewTenantApplication[]>([...mockNewTenantApplications])
  const equipments = ref<Equipment[]>([...mockEquipments])
  const maintenanceOrders = ref<MaintenanceOrder[]>([...mockMaintenanceOrders])
  const spareParts = ref<SparePart[]>([...mockSpareParts])
  const parkingSpaces = ref<ParkingSpace[]>([...mockParkingSpaces])
  const parkingRecords = ref<ParkingRecord[]>([...mockParkingRecords])
  const members = ref<Member[]>([...mockMembers])
  const passengerFlows = ref<PassengerFlow[]>([...mockPassengerFlows])
  const cleaningStaff = ref<CleaningStaff[]>([...mockCleaningStaff])
  const cleaningSchedules = ref<CleaningSchedule[]>([...mockCleaningSchedules])
  const swapRequests = ref<SwapRequest[]>([])
  const notifications = ref<Notification[]>([...mockNotifications])
  const mapZones = ref<MapZone[]>([...mockMapZones])
  const currentFloor = ref<number>(1)

  const expiringShops = computed(() =>
    shops.value.filter(s => s.status === 'expiring' || s.renewalReminder)
  )

  const pendingApprovals = computed(() =>
    [...newTenantApplications.value.filter(a => a.status !== 'approved' && a.status !== 'rejected'),
     ...renewalApplications.value.filter(a => a.status === 'pending')]
  )

  const faultEquipments = computed(() =>
    equipments.value.filter(e => e.status === 'fault')
  )

  const lowStockParts = computed(() =>
    spareParts.value.filter(p => p.quantity < p.safeStock)
  )

  const evacuationZones = computed(() =>
    passengerFlows.value.filter(p => p.evacuationAlert)
  )

  const unreadNotifications = computed(() =>
    notifications.value.filter(n => !n.read)
  )

  const occupiedSpaces = computed(() =>
    parkingSpaces.value.filter(s => s.status === 'occupied').length
  )

  const totalSpaces = computed(() => parkingSpaces.value.length)

  const availableSpaces = computed(() =>
    parkingSpaces.value.filter(s => s.status === 'available').length
  )

  function checkRenewalStatus(shop: Shop): Pick<Shop, 'status' | 'renewalReminder'> {
    const daysToExpire = dayjs(shop.contractEnd).diff(dayjs(), 'day')
    const avgRevenue = shop.businessData.dailyRevenue.reduce((a, b) => a + b, 0) / shop.businessData.dailyRevenue.length
    const revenueThreshold = shop.monthlyRent * 0.8 / 30

    if (daysToExpire <= 0) {
      return { status: 'expired', renewalReminder: true }
    } else if (daysToExpire <= 90 || (daysToExpire <= 180 && avgRevenue < revenueThreshold)) {
      return { status: 'expiring', renewalReminder: true }
    }
    return { status: 'normal', renewalReminder: false }
  }

  function addShop(shop: Omit<Shop, 'id'>) {
    const newShop: Shop = { ...shop, id: generateId() }
    const renewalStatus = checkRenewalStatus(newShop)
    Object.assign(newShop, renewalStatus)
    shops.value.push(newShop)

    if (renewalStatus.renewalReminder) {
      addNotification({
        type: 'renewal',
        title: '续约提醒',
        message: `${newShop.name} 合同将于${dayjs(newShop.contractEnd).diff(dayjs(), 'day')}天后到期，请及时处理`,
        priority: 'high'
      })
    }
  }

  function updateShop(id: string, data: Partial<Shop>) {
    const index = shops.value.findIndex(s => s.id === id)
    if (index > -1) {
      const original = { ...shops.value[index] }
      const updated = { ...original, ...data }
      const renewalStatus = checkRenewalStatus(updated)
      Object.assign(updated, renewalStatus)
      shops.value[index] = updated

      const wasReminder = original.renewalReminder
      const isReminder = renewalStatus.renewalReminder

      if (isReminder && !wasReminder) {
        addNotification({
          type: 'renewal',
          title: '续约提醒',
          message: `${updated.name} 合同将于${dayjs(updated.contractEnd).diff(dayjs(), 'day')}天后到期，请及时处理`,
          priority: 'high'
        })
      } else if (!isReminder && wasReminder) {
        notifications.value = notifications.value.filter(
          n => !(n.type === 'renewal' && n.message.includes(updated.name))
        )
      }
    }
  }

  function createNewTenantApplication(data: Omit<NewTenantApplication, 'id' | 'status' | 'currentStep' | 'approvals' | 'createTime'>) {
    const existingPending = newTenantApplications.value.find(
      a => a.shopName === data.shopName && (a.status === 'pending' || a.status === 'floor_manager' || a.status === 'operation_manager' || a.status === 'gm')
    )
    if (existingPending) return false

    const app: NewTenantApplication = {
      ...data,
      id: generateId(),
      status: 'floor_manager',
      currentStep: 1,
      createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      approvals: [
        { step: 1, role: '楼层经理', approver: '', status: 'pending', comment: '', time: '' },
        { step: 2, role: '运营经理', approver: '', status: 'pending', comment: '', time: '' },
        { step: 3, role: '总经理', approver: '', status: 'pending', comment: '', time: '' }
      ]
    }
    newTenantApplications.value.unshift(app)
    addNotification({
      type: 'approval',
      title: '新商户入驻申请',
      message: `${data.shopName} 入驻申请已提交，待楼层经理审批`,
      priority: 'medium'
    })
    return true
  }

  function createRenewalApplication(shopId: string, proposedStart: string, proposedEnd: string, proposedRent: number) {
    const shop = shops.value.find(s => s.id === shopId)
    if (!shop) return

    const existing = renewalApplications.value.find(
      r => r.shopId === shopId && (r.status === 'pending' || r.status === 'approved')
    )
    if (existing) return

    const app: RenewalApplication = {
      id: generateId(),
      shopId,
      shopName: shop.name,
      tenantName: shop.tenantName,
      currentContractEnd: shop.contractEnd,
      proposedStart,
      proposedEnd,
      proposedRent,
      status: 'pending',
      createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      approvals: [
        { step: 1, role: '楼层经理', approver: '', status: 'pending', comment: '', time: '' },
        { step: 2, role: '运营经理', approver: '', status: 'pending', comment: '', time: '' },
        { step: 3, role: '总经理', approver: '', status: 'pending', comment: '', time: '' }
      ]
    }

    renewalApplications.value.unshift(app)
    addNotification({
      type: 'approval',
      title: '续约申请',
      message: `${shop.name} 续约申请已提交，待审批`,
      priority: 'medium'
    })
  }

  function approveApplication(type: 'renewal' | 'newTenant', id: string, step: number, comment: string) {
    const list = type === 'renewal' ? renewalApplications : newTenantApplications
    const app = list.value.find(a => a.id === id)
    if (app) {
      const approval = app.approvals.find(a => a.step === step)
      if (approval) {
        approval.status = 'approved'
        approval.comment = comment
        approval.time = dayjs().format('YYYY-MM-DD HH:mm:ss')
        approval.approver = '当前用户'

        if (step === app.approvals.length) {
          app.status = 'approved'
          if ('currentStep' in app) {
            app.currentStep = step
          }
          addNotification({
            type: 'approval',
            title: '审批完成',
            message: `${type === 'renewal' ? '续约' : '新商户入驻'}申请已通过所有审批`,
            priority: 'medium'
          })
        } else {
          if ('currentStep' in app) {
            app.currentStep = step + 1
          }
          if (type === 'newTenant') {
            const statusMap: Record<number, NewTenantApplication['status']> = {
              1: 'operation_manager',
              2: 'gm'
            }
            app.status = statusMap[step] || 'pending'
          }
        }
      }
    }
  }

  function rejectApplication(type: 'renewal' | 'newTenant', id: string, step: number, comment: string) {
    const list = type === 'renewal' ? renewalApplications : newTenantApplications
    const app = list.value.find(a => a.id === id)
    if (app) {
      const approval = app.approvals.find(a => a.step === step)
      if (approval) {
        approval.status = 'rejected'
        approval.comment = comment
        approval.time = dayjs().format('YYYY-MM-DD HH:mm:ss')
        approval.approver = '当前用户'
        app.status = 'rejected'
      }
    }
  }

  function updateEquipmentStatus(id: string, status: Equipment['status']) {
    const eq = equipments.value.find(e => e.id === id)
    if (eq) {
      eq.status = status
      if (status === 'fault') {
        addNotification({
          type: 'equipment',
          title: '设备故障告警',
          message: `${eq.name} 发生故障，请及时处理`,
          priority: 'urgent'
        })
      }
    }
  }

  function createMaintenanceOrder(order: Omit<MaintenanceOrder, 'id' | 'createTime' | 'status'>) {
    const newOrder: MaintenanceOrder = {
      ...order,
      id: 'MO' + generateId().toUpperCase(),
      createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      status: 'pending'
    }
    maintenanceOrders.value.unshift(newOrder)
    addNotification({
      type: 'maintenance',
      title: '新维保工单',
      message: `${order.equipmentName} 有新的${order.type === 'fault' ? '故障' : order.type === 'routine' ? '例行' : '预防性'}维保工单`,
      priority: order.priority
    })
  }

  function updateMaintenanceOrder(id: string, data: Partial<MaintenanceOrder>) {
    const index = maintenanceOrders.value.findIndex(o => o.id === id)
    if (index > -1) {
      maintenanceOrders.value[index] = { ...maintenanceOrders.value[index], ...data }
    }
  }

  function calculateParkingFee(entryTime: string, memberLevel?: Member['level']): { totalFee: number; discount: number; actualFee: number } {
    const duration = dayjs().diff(dayjs(entryTime), 'minute')
    const hours = Math.ceil(duration / 60)
    const rate = 10
    const totalFee = hours * rate

    const freeHours = {
      normal: 0, silver: 2, gold: 4, platinum: 6, diamond: 8
    }[memberLevel || 'normal']

    const discount = Math.min(freeHours * rate, totalFee)
    return { totalFee, discount, actualFee: totalFee - discount }
  }

  function processParkingEntry(plateNumber: string, spaceId: string): { success: boolean; message: string } {
    const existingParking = parkingSpaces.value.find(s => s.licensePlate === plateNumber && s.status === 'occupied')
    if (existingParking) {
      return { success: false, message: `车牌 ${plateNumber} 已占用车位 ${existingParking.number}，不能重复入场` }
    }

    const existingRecord = parkingRecords.value.find(r => r.licensePlate === plateNumber && r.status === 'parking')
    if (existingRecord) {
      return { success: false, message: `车牌 ${plateNumber} 已有停车记录，不能重复入场` }
    }

    const member = members.value.find(m => m.plateNumber === plateNumber)
    const space = parkingSpaces.value.find(s => s.id === spaceId)
    if (!space) {
      return { success: false, message: '车位不存在' }
    }
    if (space.status !== 'available') {
      return { success: false, message: '车位已被占用' }
    }

    space.status = 'occupied'
    space.licensePlate = plateNumber
    space.entryTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    if (member) {
      space.memberId = member.id
      space.memberLevel = member.level
    }

    const record: ParkingRecord = {
      id: generateId(),
      licensePlate: plateNumber,
      spaceId,
      entryTime: space.entryTime,
      totalFee: 0, discount: 0, actualFee: 0,
      memberId: member?.id,
      memberLevel: member?.level,
      status: 'parking'
    }
    parkingRecords.value.unshift(record)

    return { success: true, message: '入场成功' }
  }

  const maintenanceThresholds = {
    elevator: { hours: 12000, interval: 'monthly' },
    escalator: { hours: 15000, interval: 'monthly' },
    air_conditioner: { hours: 25000, interval: 'quarterly' }
  } as const

  const equipmentTeams = {
    elevator: '电梯组',
    escalator: '电梯组',
    air_conditioner: '空调组'
  } as const

  function checkAndCreateMaintenanceOrders() {
    const today = dayjs().format('YYYY-MM-DD')

    equipments.value.forEach(eq => {
      const threshold = maintenanceThresholds[eq.type]
      if (!threshold) return

      const hoursSinceLastMaintenance = eq.runHours
      const needsMaintenance = hoursSinceLastMaintenance >= threshold.hours
      const isMaintenanceDue = dayjs(eq.nextMaintenance).valueOf() <= dayjs(today).valueOf()

      if (needsMaintenance || isMaintenanceDue) {
        const existingOrder = maintenanceOrders.value.find(
          o => o.equipmentId === eq.id &&
               o.type === 'preventive' &&
               (o.status === 'pending' || o.status === 'in_progress') &&
               dayjs(o.createTime).isSame(today, 'month')
        )

        if (!existingOrder) {
          const team = equipmentTeams[eq.type] || '机电组'
          const assigneeMap: Record<string, string> = {
            '电梯组': '王师傅',
            '空调组': '李师傅',
            '机电组': '张师傅'
          }

          createMaintenanceOrder({
            equipmentId: eq.id,
            equipmentName: eq.name,
            type: 'preventive',
            description: `运行时长达到${eq.runHours}小时，需要进行预防性维保${needsMaintenance ? '（运行时长超限）' : '（到达维保日期）'}`,
            priority: needsMaintenance ? 'high' : 'medium',
            assigneeTeam: team,
            assignee: assigneeMap[team] || '未分配',
            partsUsed: [],
            cost: 0
          })

          eq.nextMaintenance = dayjs(eq.nextMaintenance).add(1, 'month').format('YYYY-MM-DD')
        }
      }
    })
  }

  function updateEquipmentRunHours(id: string, hours: number): { orderCreated: boolean; team?: string } {
    const eq = equipments.value.find(e => e.id === id)
    if (!eq) return { orderCreated: false }

    const beforeCount = maintenanceOrders.value.length
    const team = equipmentTeams[eq.type] || '机电组'

    eq.runHours += hours
    checkAndCreateMaintenanceOrders()

    const afterCount = maintenanceOrders.value.length
    const orderCreated = afterCount > beforeCount

    return { orderCreated, team }
  }

  function processParkingExit(plateNumber: string) {
    const record = parkingRecords.value.find(r => r.licensePlate === plateNumber && r.status === 'parking')
    const space = parkingSpaces.value.find(s => s.licensePlate === plateNumber && s.status === 'occupied')

    if (record && space) {
      const fee = calculateParkingFee(record.entryTime, record.memberLevel as Member['level'])
      record.exitTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
      record.duration = dayjs().diff(dayjs(record.entryTime), 'minute')
      record.totalFee = fee.totalFee
      record.discount = fee.discount
      record.actualFee = fee.actualFee
      record.status = 'paid'

      space.status = 'available'
      delete space.licensePlate
      delete space.entryTime
      delete space.memberId
      delete space.memberLevel
    }
  }

  function updatePassengerFlow() {
    passengerFlows.value.forEach(pf => {
      const change = Math.floor(Math.random() * 100) - 40
      pf.currentCount = Math.max(0, Math.min(pf.capacity, pf.currentCount + change))
      pf.trend = change > 20 ? 'increasing' : change < -20 ? 'decreasing' : 'stable'
      pf.dailyTotal += Math.abs(change)

      const ratio = pf.currentCount / pf.capacity
      pf.evacuationAlert = ratio >= 0.85
      if (pf.evacuationAlert) {
        const existingAlert = notifications.value.find(
          n => n.type === 'passenger' && n.message.includes(pf.zone) && !n.read
        )
        if (!existingAlert) {
          addNotification({
            type: 'passenger',
            title: '客流超限预警',
            message: `${pf.zone}当前客流已超过阈值，请注意疏散`,
            priority: 'high'
          })
        }
      }
    })
  }

  function generateCleaningSchedule() {
    const newSchedules: CleaningSchedule[] = []
    const shifts: CleaningSchedule['shift'][] = ['morning', 'afternoon', 'night']
    const zones = ['1楼', '2楼', '3楼', '4楼', '5楼', '-1楼', '公共区域', '卫生间']

    for (let day = 7; day < 14; day++) {
      cleaningStaff.value.forEach((staff, idx) => {
        if (Math.random() > 0.3) {
          newSchedules.push({
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
    cleaningSchedules.value.push(...newSchedules)
  }

  function requestSwap(scheduleId: string, targetStaffId: string, reason: string) {
    const schedule = cleaningSchedules.value.find(s => s.id === scheduleId)
    const targetStaff = cleaningStaff.value.find(s => s.id === targetStaffId)
    const requester = cleaningStaff.value.find(s => s.id === schedule?.staffId)

    if (schedule && targetStaff && requester) {
      schedule.status = 'adjusting'
      const request: SwapRequest = {
        id: generateId(),
        scheduleId,
        requesterId: requester.id,
        requesterName: requester.name,
        targetStaffId: targetStaff.id,
        targetStaffName: targetStaff.name,
        reason,
        status: 'pending',
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
      }
      swapRequests.value.push(request)
      schedule.swapRequest = request

      addNotification({
        type: 'approval',
        title: '调班申请',
        message: `${requester.name} 申请与 ${targetStaff.name} 调班，待审批`,
        priority: 'medium'
      })
    }
  }

  function approveSwap(requestId: string) {
    const request = swapRequests.value.find(r => r.id === requestId)
    if (request) {
      request.status = 'approved'
      const schedule = cleaningSchedules.value.find(s => s.id === request.scheduleId)
      if (schedule) {
        schedule.status = 'scheduled'
        schedule.staffId = request.targetStaffId
        schedule.staffName = request.targetStaffName
        delete schedule.swapRequest
      }
    }
  }

  function rejectSwap(requestId: string) {
    const request = swapRequests.value.find(r => r.id === requestId)
    if (request) {
      request.status = 'rejected'
      const schedule = cleaningSchedules.value.find(s => s.id === request.scheduleId)
      if (schedule) {
        schedule.status = 'scheduled'
        delete schedule.swapRequest
      }
    }
  }

  function addNotification(data: Omit<Notification, 'id' | 'time' | 'read'>) {
    notifications.value.unshift({
      ...data,
      id: generateId(),
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      read: false
    })
  }

  function markNotificationRead(id: string) {
    const n = notifications.value.find(n => n.id === id)
    if (n) n.read = true
  }

  function markAllNotificationsRead() {
    notifications.value.forEach(n => n.read = true)
  }

  function getReportData(period: string) {
    const floors = [-1, 1, 2, 3, 4, 5].map(floor => {
      const floorShops = shops.value.filter(s => s.floor === floor)
      const totalRent = floorShops.reduce((sum, s) => sum + s.monthlyRent, 0)
      const totalArea = floorShops.reduce((sum, s) => sum + s.area, 0)
      const flowData = passengerFlows.value.find(p => p.floor === floor)
      const eqData = equipments.value.filter(e => e.floor === floor)
      const completedOrders = maintenanceOrders.value.filter(
        o => o.status === 'completed' && eqData.some(e => e.id === o.equipmentId)
      ).length
      const totalOrders = maintenanceOrders.value.filter(
        o => eqData.some(e => e.id === o.equipmentId)
      ).length

      return {
        floor,
        totalRent,
        passengerFlow: flowData?.dailyTotal || 0,
        avgEfficiency: totalArea > 0 ? Math.round(totalRent / totalArea * 100) / 100 : 0,
        energyConsumption: floorShops.length * 500 + Math.random() * 1000,
        maintenanceRate: totalOrders > 0 ? Math.round(completedOrders / totalOrders * 100) / 100 : 1
      }
    })

    const categories = Array.from(new Set(shops.value.map(s => s.category))).map(cat => {
      const catShops = shops.value.filter(s => s.category === cat)
      const totalRent = catShops.reduce((sum, s) => sum + s.monthlyRent, 0)
      const totalArea = catShops.reduce((sum, s) => sum + s.area, 0)
      const flowData = passengerFlows.value.filter(p => catShops.some(_s => p.zone.includes(cat)))

      return {
        category: cat,
        shopCount: catShops.length,
        totalRent,
        passengerFlow: flowData.reduce((sum, p) => sum + p.dailyTotal, 0),
        avgEfficiency: totalArea > 0 ? Math.round(totalRent / totalArea * 100) / 100 : 0
      }
    })

    return {
      period,
      floors,
      categories,
      overall: {
        totalRent: floors.reduce((sum, f) => sum + f.totalRent, 0),
        totalPassengerFlow: floors.reduce((sum, f) => sum + f.passengerFlow, 0),
        avgEfficiency: Math.round(floors.reduce((sum, f) => sum + f.avgEfficiency, 0) / floors.length * 100) / 100,
        totalEnergy: floors.reduce((sum, f) => sum + f.energyConsumption, 0),
        maintenanceRate: Math.round(floors.reduce((sum, f) => sum + f.maintenanceRate, 0) / floors.length * 100) / 100
      }
    }
  }

  return {
    shops, renewalApplications, newTenantApplications, equipments,
    maintenanceOrders, spareParts, parkingSpaces, parkingRecords, members,
    passengerFlows, cleaningStaff, cleaningSchedules, swapRequests,
    notifications, mapZones, currentFloor,
    expiringShops, pendingApprovals, faultEquipments, lowStockParts,
    evacuationZones, unreadNotifications, occupiedSpaces, totalSpaces, availableSpaces,
    addShop, updateShop, checkRenewalStatus, createNewTenantApplication,
    createRenewalApplication, approveApplication, rejectApplication,
    updateEquipmentStatus, createMaintenanceOrder, updateMaintenanceOrder,
    checkAndCreateMaintenanceOrders, updateEquipmentRunHours,
    calculateParkingFee, processParkingEntry, processParkingExit,
    updatePassengerFlow, generateCleaningSchedule, requestSwap, approveSwap, rejectSwap,
    addNotification, markNotificationRead, markAllNotificationsRead, getReportData
  }
})
