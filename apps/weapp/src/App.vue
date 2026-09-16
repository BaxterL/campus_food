<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app';
import { useSessionStore } from '@/stores/session';

onLaunch(() => {
  const session = useSessionStore();
  if (session.isLoggedIn) {
    session.refreshProfile().catch(() => {
      session.logout();
    });
  }
});
</script>

<style lang="scss">
@import './uni.scss';
</style>
