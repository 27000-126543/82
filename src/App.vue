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
          :class="{ unread: !n.read, clickable: n.link }"
          @click="handleNotificationClick(n)"
        >
          <div class="notification-header">
            <div class="notification-title">
              <span class="priority-tag" :class="n.priority">{{ getPriorityText(n.priority) }}</span>
              {{ n.title }}
              <el-tag v-if="!n.read" type="danger" size="small" effect="dark" style="margin-left: 6px;">
                新消息
              </el-tag>
            </div>
            <span class="notification-time">{{ n.time }}</span>
          </div>
          <div class="notification-message">{{ n.message }}</div>
          <div v-if="n.link" class="notification-footer">
            <span class="link-hint">
              <el-icon><Position /></el-icon>
              点击查看详情
            </span>
            <el-tag v-if="isProcessedNotification(n)" type="success" size="small">
              已处理
            </el-tag>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMallStore } from '@/stores/mall'
import { Position } from '@element-plus/icons-vue'
import type { Notification } from '@/types'

const route = useRoute()
const router = useRouter()
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

function isProcessedNotification(n: Notification) {
  if (n.type !== 'passenger') return false
  if (!n.read) return false

  const processedKeywords = ['完成', '已处理', '已读']
  return processedKeywords.some(keyword => n.title.includes(keyword) || n.message.includes(keyword))
}

function handleNotificationClick(n: Notification) {
  if (!n.read) {
    markRead(n.id)
  }

  if (n.link) {
    showNotifications.value = false
    router.push(n.link)
  }
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

<style lang="scss" scoped>
.notification-item {
  padding: 14px 16px;
  border-radius: 8px;
  margin-bottom: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;

  &.unread {
    background: #eff6ff;
    border-color: #bfdbfe;
  }

  &.clickable {
    cursor: pointer;

    &:hover {
      background: #f1f5f9;
      transform: translateX(4px);
    }
  }

  .notification-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;

    .notification-title {
      display: flex;
      align-items: center;
      font-weight: 600;
      color: #1e293b;
      font-size: 14px;

      .priority-tag {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
        margin-right: 8px;

        &.urgent {
          background: #fee2e2;
          color: #dc2626;
        }

        &.high {
          background: #fef3c7;
          color: #d97706;
        }

        &.medium {
          background: #dbeafe;
          color: #2563eb;
        }

        &.low {
          background: #d1fae5;
          color: #059669;
        }
      }
    }

    .notification-time {
      font-size: 11px;
      color: #94a3b8;
      flex-shrink: 0;
      margin-left: 12px;
    }
  }

  .notification-message {
    font-size: 13px;
    color: #475569;
    line-height: 1.5;
    margin-bottom: 8px;
  }

  .notification-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 8px;
    border-top: 1px dashed #e2e8f0;

    .link-hint {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #3b82f6;

      .el-icon {
        font-size: 12px;
      }
    }
  }
}
</style>
