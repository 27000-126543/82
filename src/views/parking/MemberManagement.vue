<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">会员管理</div>
      <div class="header-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索姓名/手机/车牌"
          clearable
          style="width: 280px; margin-right: 12px"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="levelFilter" placeholder="等级筛选" clearable style="width: 140px; margin-right: 12px">
          <el-option label="钻石会员" value="diamond" />
          <el-option label="铂金会员" value="platinum" />
          <el-option label="黄金会员" value="gold" />
          <el-option label="银卡会员" value="silver" />
          <el-option label="普通会员" value="normal" />
        </el-select>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>
    </div>

    <el-row :gutter="16" class="stats-row">
      <el-col :span="4">
        <div class="stat-card purple">
          <div class="stat-label">钻石会员</div>
          <div class="stat-value">{{ diamondCount }}</div>
          <div class="stat-footer">
            <el-icon><Medal /></el-icon>
            8小时免费
          </div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card orange">
          <div class="stat-label">铂金会员</div>
          <div class="stat-value">{{ platinumCount }}</div>
          <div class="stat-footer">
            <el-icon><Medal /></el-icon>
            6小时免费
          </div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card" style="background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%);">
          <div class="stat-label">黄金会员</div>
          <div class="stat-value">{{ goldCount }}</div>
          <div class="stat-footer">
            <el-icon><Trophy /></el-icon>
            4小时免费
          </div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card" style="background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);">
          <div class="stat-label">银卡会员</div>
          <div class="stat-value">{{ silverCount }}</div>
          <div class="stat-footer">
            <el-icon><Star /></el-icon>
            2小时免费
          </div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card blue">
          <div class="stat-label">普通会员</div>
          <div class="stat-value">{{ normalCount }}</div>
          <div class="stat-footer">
            <el-icon><User /></el-icon>
            0小时免费
          </div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card green">
          <div class="stat-label">会员总数</div>
          <div class="stat-value">{{ mallStore.members.length }}</div>
          <div class="stat-footer">
            <el-icon><UserFilled /></el-icon>
            总会员数
          </div>
        </div>
      </el-col>
    </el-row>

    <el-table :data="filteredMembers" stripe style="width: 100%">
      <el-table-column label="会员信息" width="220">
        <template #default="{ row }">
          <div class="member-info">
            <el-avatar :size="44" :style="{ background: getLevelColor(row.level) }">
              {{ row.name.charAt(0) }}
            </el-avatar>
            <div class="info">
              <div class="name">{{ row.name }}</div>
              <div class="phone">{{ row.phone }}</div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="会员等级" width="140">
        <template #default="{ row }">
          <span :class="['level-badge', row.level]">
            <el-icon v-if="row.level === 'diamond'"><Medal /></el-icon>
            <el-icon v-else-if="row.level === 'platinum'"><Trophy /></el-icon>
            <el-icon v-else-if="row.level === 'gold'"><Trophy /></el-icon>
            <el-icon v-else-if="row.level === 'silver'"><Star /></el-icon>
            <el-icon v-else><User /></el-icon>
            {{ getLevelName(row.level) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="车牌号" width="140">
        <template #default="{ row }">
          <span class="plate-number">{{ row.plateNumber }}</span>
        </template>
      </el-table-column>
      <el-table-column label="免费停车时长" width="150">
        <template #default="{ row }">
          <div class="free-hours">
            <el-tag :type="getLevelTagType(row.level)" size="large">
              {{ row.freeParkingHours }} 小时/次
            </el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="当前积分" width="140">
        <template #default="{ row }">
          <span class="points">{{ row.points.toLocaleString() }}</span>
        </template>
      </el-table-column>
      <el-table-column label="等级权益">
        <template #default="{ row }">
          <div class="benefits">
            <el-tag size="small" type="success">
              停车免费 {{ row.freeParkingHours }} 小时
            </el-tag>
            <el-tag size="small" type="warning" style="margin-left: 8px">
              积分 {{ getPointsMultiplier(row.level) }} 倍
            </el-tag>
            <el-tag v-if="row.level === 'diamond' || row.level === 'platinum'" size="small" type="danger" style="margin-left: 8px">
              专属客服
            </el-tag>
            <el-tag v-if="row.level === 'diamond'" size="small" type="info" style="margin-left: 8px">
              VIP休息室
            </el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="handleEdit(row)">
            编辑
          </el-button>
          <el-button type="info" size="small" @click="handleViewDetail(row)">
            详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[10, 20, 50, 100]"
      :total="filteredMembers.length"
      layout="total, sizes, prev, pager, next, jumper"
      style="margin-top: 20px; justify-content: flex-end"
    />

    <el-dialog v-model="detailDialogVisible" title="会员详情" width="500px">
      <el-descriptions :column="1" border v-if="currentMember">
        <el-descriptions-item label="姓名">
          {{ currentMember.name }}
        </el-descriptions-item>
        <el-descriptions-item label="手机号">
          {{ currentMember.phone }}
        </el-descriptions-item>
        <el-descriptions-item label="会员等级">
          <el-tag :type="getLevelTagType(currentMember.level)">
            {{ getLevelName(currentMember.level) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="车牌号">
          {{ currentMember.plateNumber }}
        </el-descriptions-item>
        <el-descriptions-item label="免费停车时长">
          {{ currentMember.freeParkingHours }} 小时/次
        </el-descriptions-item>
        <el-descriptions-item label="当前积分">
          {{ currentMember.points.toLocaleString() }} 分
        </el-descriptions-item>
        <el-descriptions-item label="会员权益">
          <div class="benefits-detail">
            <p>• 停车免费 {{ currentMember.freeParkingHours }} 小时</p>
            <p>• 消费积分 {{ getPointsMultiplier(currentMember.level) }} 倍累计</p>
            <p v-if="currentMember.level === 'diamond' || currentMember.level === 'platinum'">• 专属客服服务</p>
            <p v-if="currentMember.level === 'diamond'">• VIP休息室免费使用</p>
            <p v-if="currentMember.level === 'diamond' || currentMember.level === 'platinum'">• 生日专属礼品</p>
          </div>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMallStore } from '@/stores/mall'
import { ElMessage } from 'element-plus'
import { Search, Medal, Trophy, Star, User, UserFilled } from '@element-plus/icons-vue'
import type { Member } from '@/types'

const mallStore = useMallStore()

const searchKeyword = ref('')
const levelFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const detailDialogVisible = ref(false)
const currentMember = ref<Member | null>(null)

const diamondCount = computed(() =>
  mallStore.members.filter(m => m.level === 'diamond').length
)

const platinumCount = computed(() =>
  mallStore.members.filter(m => m.level === 'platinum').length
)

const goldCount = computed(() =>
  mallStore.members.filter(m => m.level === 'gold').length
)

const silverCount = computed(() =>
  mallStore.members.filter(m => m.level === 'silver').length
)

const normalCount = computed(() =>
  mallStore.members.filter(m => m.level === 'normal').length
)

const filteredMembers = computed(() => {
  let members = [...mallStore.members]
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    members = members.filter(m =>
      m.name.toLowerCase().includes(keyword) ||
      m.phone.includes(keyword) ||
      m.plateNumber.toLowerCase().includes(keyword)
    )
  }
  if (levelFilter.value) {
    members = members.filter(m => m.level === levelFilter.value)
  }
  const levelOrder: Record<string, number> = {
    diamond: 0,
    platinum: 1,
    gold: 2,
    silver: 3,
    normal: 4
  }
  return members.sort((a, b) => levelOrder[a.level] - levelOrder[b.level])
})

const getLevelName = (level: string) => {
  const map: Record<string, string> = {
    diamond: '钻石会员',
    platinum: '铂金会员',
    gold: '黄金会员',
    silver: '银卡会员',
    normal: '普通会员'
  }
  return map[level] || level
}

const getLevelColor = (level: string) => {
  const map: Record<string, string> = {
    diamond: '#8b5cf6',
    platinum: '#f59e0b',
    gold: '#eab308',
    silver: '#64748b',
    normal: '#3b82f6'
  }
  return map[level] || '#3b82f6'
}

const getLevelTagType = (level: string) => {
  const map: Record<string, any> = {
    diamond: 'danger',
    platinum: 'warning',
    gold: 'warning',
    silver: 'info',
    normal: ''
  }
  return map[level] || 'info'
}

const getPointsMultiplier = (level: string) => {
  const map: Record<string, number> = {
    diamond: 3,
    platinum: 2.5,
    gold: 2,
    silver: 1.5,
    normal: 1
  }
  return map[level] || 1
}

const handleSearch = () => {
  currentPage.value = 1
  ElMessage.success('搜索完成')
}

const handleEdit = (member: Member) => {
  ElMessage.info(`编辑会员：${member.name}`)
}

const handleViewDetail = (member: Member) => {
  currentMember.value = member
  detailDialogVisible.value = true
}
</script>

<style lang="scss" scoped>
.stats-row {
  margin-bottom: 24px;
}

.header-actions {
  display: flex;
  align-items: center;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 12px;

  .info {
    .name {
      font-weight: 600;
      color: #1e293b;
      font-size: 14px;
    }

    .phone {
      font-size: 12px;
      color: #64748b;
    }
  }
}

.plate-number {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #1e40af;
  background: #dbeafe;
  padding: 4px 10px;
  border-radius: 4px;
}

.points {
  font-weight: 700;
  color: #f59e0b;
  font-size: 16px;
}

.level-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;

  &.diamond {
    background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
    color: #7c3aed;
  }

  &.platinum {
    background: linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%);
    color: #c2410c;
  }

  &.gold {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    color: #a16207;
  }

  &.silver {
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
    color: #475569;
  }

  &.normal {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    color: #1d4ed8;
  }
}

.benefits {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.free-hours {
  font-weight: 600;
}

.benefits-detail {
  p {
    margin: 4px 0;
    color: #64748b;
    font-size: 13px;
  }
}
</style>
