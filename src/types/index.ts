export interface Shop {
  id: string
  name: string
  floor: number
  area: number
  category: string
  tenantName: string
  contact: string
  phone: string
  contractStart: string
  contractEnd: string
  monthlyRent: number
  status: 'normal' | 'expiring' | 'expired' | 'vacant'
  businessData: {
    dailyRevenue: number[]
    monthlyRevenue: number
    customerFlow: number
  }
  renewalReminder?: boolean
}

export interface RenewalApplication {
  id: string
  shopId: string
  shopName: string
  tenantName: string
  currentContractEnd: string
  proposedStart: string
  proposedEnd: string
  proposedRent: number
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  currentStep?: number
  approvals: ApprovalRecord[]
  createTime: string
}

export interface NewTenantApplication {
  id: string
  shopName: string
  floor: number
  area: number
  category: string
  tenantName: string
  contact: string
  phone: string
  businessLicense: string
  proposedStart: string
  proposedEnd: string
  proposedRent: number
  status: 'pending' | 'floor_manager' | 'operation_manager' | 'gm' | 'approved' | 'rejected'
  currentStep: number
  approvals: ApprovalRecord[]
  createTime: string
}

export interface ApprovalRecord {
  step: number
  role: string
  approver: string
  status: 'pending' | 'approved' | 'rejected'
  comment: string
  time: string
}

export interface Equipment {
  id: string
  name: string
  type: 'elevator' | 'escalator' | 'air_conditioner'
  location: string
  floor: number
  status: 'running' | 'standby' | 'maintenance' | 'fault'
  runHours: number
  lastMaintenance: string
  nextMaintenance: string
  temperature?: number
  speed?: number
  faultCode?: string
}

export interface MaintenanceOrder {
  id: string
  equipmentId: string
  equipmentName: string
  type: 'routine' | 'fault' | 'preventive'
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigneeTeam: string
  assignee: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  createTime: string
  startTime?: string
  completeTime?: string
  partsUsed: string[]
  cost: number
}

export interface SparePart {
  id: string
  name: string
  spec: string
  quantity: number
  safeStock: number
  unit: string
  location: string
  lastRestock: string
}

export interface ParkingSpace {
  id: string
  number: string
  floor: number
  zone: string
  status: 'available' | 'occupied' | 'reserved' | 'maintenance'
  licensePlate?: string
  entryTime?: string
  memberId?: string
  memberLevel?: string
}

export interface ParkingRecord {
  id: string
  licensePlate: string
  spaceId: string
  entryTime: string
  exitTime?: string
  duration?: number
  totalFee: number
  discount: number
  actualFee: number
  memberId?: string
  memberLevel?: string
  status: 'parking' | 'paid' | 'completed'
  paymentReminder?: boolean
}

export interface Member {
  id: string
  name: string
  phone: string
  level: 'normal' | 'silver' | 'gold' | 'platinum' | 'diamond'
  plateNumber: string
  freeParkingHours: number
  points: number
}

export interface PassengerFlow {
  id: string
  zone: string
  floor: number
  currentCount: number
  capacity: number
  threshold: number
  trend: 'increasing' | 'stable' | 'decreasing'
  hourlyData: number[]
  dailyTotal: number
  evacuationAlert?: boolean
}

export interface CleaningStaff {
  id: string
  name: string
  phone: string
  team: string
  skills: string[]
}

export interface CleaningSchedule {
  id: string
  staffId: string
  staffName: string
  date: string
  shift: 'morning' | 'afternoon' | 'night'
  zone: string
  status: 'scheduled' | 'adjusting' | 'completed'
  swapRequest?: SwapRequest
}

export interface SwapRequest {
  id: string
  scheduleId: string
  requesterId: string
  requesterName: string
  targetStaffId: string
  targetStaffName: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  createTime: string
}

export interface ReportData {
  period: string
  floors: FloorReport[]
  categories: CategoryReport[]
  overall: {
    totalRent: number
    totalPassengerFlow: number
    avgEfficiency: number
    totalEnergy: number
    maintenanceRate: number
  }
}

export interface FloorReport {
  floor: number
  totalRent: number
  passengerFlow: number
  avgEfficiency: number
  energyConsumption: number
  maintenanceRate: number
}

export interface CategoryReport {
  category: string
  shopCount: number
  totalRent: number
  passengerFlow: number
  avgEfficiency: number
}

export interface MapZone {
  id: string
  name: string
  floor: number
  x: number
  y: number
  width: number
  height: number
  type: 'shop' | 'corridor' | 'entrance' | 'facility'
  passengerFlow: number
  capacity: number
  equipments: Equipment[]
}

export interface Notification {
  id: string
  type: 'renewal' | 'approval' | 'equipment' | 'parking' | 'passenger' | 'maintenance' | 'stock'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  read: boolean
  time: string
  link?: string
}
