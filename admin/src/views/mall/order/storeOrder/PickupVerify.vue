<template>
  <ContentWrap>
    <el-card shadow="never">
      <template #header>
        <span>商家核销 · 自取</span>
      </template>
      <el-form label-width="90px" style="max-width: 480px">
        <el-form-item label="取餐码">
          <el-input
            v-model="code"
            placeholder="例如 0084 或取餐号"
            maxlength="16"
            clearable
            @keyup.enter="onVerify"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="onVerify">已取餐</el-button>
        </el-form-item>
      </el-form>
      <el-alert
        v-if="okMsg"
        :title="okMsg"
        type="success"
        show-icon
        :closable="false"
        style="margin-top: 12px; max-width: 480px"
      />
    </el-card>
  </ContentWrap>
</template>

<script setup lang="ts">
import * as StoreOrderApi from '@/api/mall/order/storeOrder'

defineOptions({ name: 'PickupVerify' })

const message = useMessage()
const code = ref('')
const loading = ref(false)
const okMsg = ref('')

const onVerify = async () => {
  if (!code.value?.trim()) {
    message.warning('请输入取餐码')
    return
  }
  loading.value = true
  okMsg.value = ''
  try {
    const id = await StoreOrderApi.verifyPickup(code.value.trim())
    okMsg.value = `核销成功 · 订单 #${id}`
    message.success('已取餐')
    code.value = ''
  } catch (e: any) {
    message.error(e?.msg || e?.message || '核销失败')
  } finally {
    loading.value = false
  }
}
</script>
