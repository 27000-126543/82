<template>
  <div class="layout-container">
    <header class="layout-header">
      <div class="logo">
        <component :is="'OfficeBuilding'" class="icon" />
        <span>购物中心智慧运营调度系统</span>
      </div>
      <div class="header-right">
        <div class="notification" @click="showNotifications = true">
          <component :is="'Bell'" />
          <span v-if="unreadCount > 0" class="badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
        </div>
        <div class="user-info">
          <div class="avatar">管</div>
          <span class="name">系统管理员</span>
        </div>
      </div>
    </header>

    <div class="layout-body">
      <aside class="layout-sidebar">
        <el-menu
          :default-active="activeMenu"
          router
          :collapse="false"
          background-color="transparent"
          text-color="#94a3b8"
          active-text-color="#ffffff"
        >
          <el-menu-item index="/dashboard">
            <component :is="'DataBoard'" />
            <span>运营概览</span>
          </el-menu-item>

          <el-sub-menu index="shop">
            <template #title>
              <component :is="'Shop'" />
              <span>商铺租赁管理</span>
            </template>
            <el-menu-item index="/shop/list">商铺信息</el-menu-item>
            <el-menu-item index="/shop/renewal">续约管理</el-menu-item>
            <el-menu-item index="/shop/approval">入驻审批</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="equipment">
            <template #title>
              <component :is="'Cpu'" />
              <span>设备管理</span>
            </template>
            <el-menu-item index="/equipment/monitor">实时监测</el-menu-item>
            <el-menu-item index="/equipment/maintenance">维保工单</el-menu-item>
            <el-menu-item index="/equipment/spare-parts">备件管理</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="parking">
            <template #title>
              <component :is="'Van'" />
              <span>车位管理</span>
            </template>
            <el-menu-item index="/parking/spaces">车位状态</el-menu-item>
            <el-menu-item index="/parking/records">停车记录</el-menu-item>
            <el-menu-item index="/parking/members">会员管理</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="passenger">
            <template #title>
              <component :is="'User'" />
              <span>客流统计</span>
            </template>
            <el-menu-item index="/passenger/realtime">实时统计</el-menu-item>
            <el-menu-item index="/passenger/heatmap">热力图</el-menu-item>
            <el-menu-item index="/passenger/alerts">疏散报警</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="cleaning">
            <template #title>
              <component :is="'Brush'" />
              <span>保洁排班</span>
            </template>
            <el-menu-item index="/cleaning/schedule">排班管理</el-menu-item>
            <el-menu-item index="/cleaning/staff">人员管理</el-menu-item>
            <el-menu-item index="/cleaning/swap">调班审批</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="report">
            <template #title>
              <component :is="'TrendCharts'" />
              <span>统计报表</span>
            </template>
            <el-menu-item index="/report/overview">综合统计</el-menu-item>
            <el-menu-item index="/report/floor">楼层分析</el-menu-item>
            <el-menu-item index="/report/category">业态分析</el-menu-item>
            <el-menu-item index="/report/map">平面图监控</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </aside>

      <main class="layout-main">
        <router-view />
      </main>
    </div>

    <el-drawer
      v-model="showNotifications"
      title="消息通知"
      size="420px"
      class="notification-drawer"
    >
      <div style="padding: 0 20px 20px;">
        <div style="margin-bottom: 16px; text-align: right;">
          <el-button size="small" @click="markAllRead">全部已读</el-button>
        </div>
        <div v-if="notifications.length === 0" style="text-align: center; padding: 40px; color: #94a3b8;">
          暂无通知消息
        </div>
        <div
          v-for="n in notifications"
          :key="n.id"
          class="notification-item"
          :class="{ unread: !n.read }"
          @click="markRead(n.id)"
        >
          <div class="notification-header">
            <div class="notification-title">
              <span class="priority-tag" :class="n.priority">{{ getPriorityText(n.priority) }}</span>
              {{ n.title }}
            </div>
            <span class="notification-time">{{ n.time }}</span>
          </div>
          <div class="notification-message">{{ n.message }}</div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMallStore } from '@/stores/mall'

const route = useRoute()
const store = useMallStore()

const activeMenu = computed(() => route.path)
const unreadCount = computed(() => store.unreadNotifications.length)
const notifications = computed(() => store.notifications)
const showNotifications = ref(false)

function getPriorityText(priority: string) {
  const map: Record<string, string> = {
    urgent: '紧急', high: '高', medium: '中', low: '低'
  }
  return map[priority] || priority
}

function markRead(id: string) {
  store.markNotificationRead(id)
}

function markAllRead() {
  store.markAllNotificationsRead()
}

let timer: number | null = null

onMounted(() => {
  timer = window.setInterval(() => {
    store.updatePassengerFlow()
  }, 5000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>
