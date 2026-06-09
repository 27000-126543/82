import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: '运营概览', icon: 'DataBoard' }
  },
  {
    path: '/shop',
    name: 'ShopManagement',
    meta: { title: '商铺租赁管理', icon: 'Shop' },
    children: [
      {
        path: 'list',
        name: 'ShopList',
        component: () => import('@/views/shop/ShopList.vue'),
        meta: { title: '商铺信息' }
      },
      {
        path: 'renewal',
        name: 'RenewalManagement',
        component: () => import('@/views/shop/RenewalManagement.vue'),
        meta: { title: '续约管理' }
      },
      {
        path: 'approval',
        name: 'ApprovalManagement',
        component: () => import('@/views/shop/ApprovalManagement.vue'),
        meta: { title: '入驻审批' }
      }
    ]
  },
  {
    path: '/equipment',
    name: 'EquipmentManagement',
    meta: { title: '设备管理', icon: 'Cpu' },
    children: [
      {
        path: 'monitor',
        name: 'EquipmentMonitor',
        component: () => import('@/views/equipment/EquipmentMonitor.vue'),
        meta: { title: '实时监测' }
      },
      {
        path: 'maintenance',
        name: 'MaintenanceManagement',
        component: () => import('@/views/equipment/MaintenanceManagement.vue'),
        meta: { title: '维保工单' }
      },
      {
        path: 'spare-parts',
        name: 'SparePartsManagement',
        component: () => import('@/views/equipment/SparePartsManagement.vue'),
        meta: { title: '备件管理' }
      }
    ]
  },
  {
    path: '/parking',
    name: 'ParkingManagement',
    meta: { title: '车位管理', icon: 'Van' },
    children: [
      {
        path: 'spaces',
        name: 'ParkingSpaces',
        component: () => import('@/views/parking/ParkingSpaces.vue'),
        meta: { title: '车位状态' }
      },
      {
        path: 'records',
        name: 'ParkingRecords',
        component: () => import('@/views/parking/ParkingRecords.vue'),
        meta: { title: '停车记录' }
      },
      {
        path: 'members',
        name: 'MemberManagement',
        component: () => import('@/views/parking/MemberManagement.vue'),
        meta: { title: '会员管理' }
      }
    ]
  },
  {
    path: '/passenger',
    name: 'PassengerFlow',
    meta: { title: '客流统计', icon: 'User' },
    children: [
      {
        path: 'realtime',
        name: 'RealtimeFlow',
        component: () => import('@/views/passenger/RealtimeFlow.vue'),
        meta: { title: '实时统计' }
      },
      {
        path: 'heatmap',
        name: 'HeatmapView',
        component: () => import('@/views/passenger/HeatmapView.vue'),
        meta: { title: '热力图' }
      },
      {
        path: 'alerts',
        name: 'EvacuationAlerts',
        component: () => import('@/views/passenger/EvacuationAlerts.vue'),
        meta: { title: '疏散报警' }
      }
    ]
  },
  {
    path: '/cleaning',
    name: 'CleaningManagement',
    meta: { title: '保洁排班', icon: 'Brush' },
    children: [
      {
        path: 'schedule',
        name: 'CleaningSchedule',
        component: () => import('@/views/cleaning/CleaningSchedule.vue'),
        meta: { title: '排班管理' }
      },
      {
        path: 'staff',
        name: 'CleaningStaff',
        component: () => import('@/views/cleaning/CleaningStaff.vue'),
        meta: { title: '人员管理' }
      },
      {
        path: 'swap',
        name: 'SwapApproval',
        component: () => import('@/views/cleaning/SwapApproval.vue'),
        meta: { title: '调班审批' }
      }
    ]
  },
  {
    path: '/report',
    name: 'ReportCenter',
    meta: { title: '统计报表', icon: 'TrendCharts' },
    children: [
      {
        path: 'overview',
        name: 'ReportOverview',
        component: () => import('@/views/report/ReportOverview.vue'),
        meta: { title: '综合统计' }
      },
      {
        path: 'floor',
        name: 'FloorReport',
        component: () => import('@/views/report/FloorReport.vue'),
        meta: { title: '楼层分析' }
      },
      {
        path: 'category',
        name: 'CategoryReport',
        component: () => import('@/views/report/CategoryReport.vue'),
        meta: { title: '业态分析' }
      },
      {
        path: 'map',
        name: 'MapView',
        component: () => import('@/views/report/MapView.vue'),
        meta: { title: '平面图监控' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
