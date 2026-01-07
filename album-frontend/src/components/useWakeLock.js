import { ref, onUnmounted } from 'vue';

export function useWakeLock() {
  const wakeLock = ref(null);

  // 请求唤醒锁
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLock.value = await navigator.wakeLock.request('screen');
        console.log('屏幕唤醒锁已激活');

        // 监听锁被释放（例如用户切换标签页）
        wakeLock.value.addEventListener('release', () => {
          console.log('屏幕唤醒锁已释放');
        });
      } else {
        console.warn('当前浏览器不支持 Wake Lock API');
      }
    } catch (err) {
      console.error(`${err.name}, ${err.message}`);
    }
  };

  // 释放唤醒锁
  const releaseWakeLock = async () => {
    if (wakeLock.value !== null) {
      await wakeLock.value.release();
      wakeLock.value = null;
    }
  };

  // 建议：当页面不可见（最小化/切走）重新回到页面时，需要重新申请锁
  const handleVisibilityChange = async () => {
    if (wakeLock.value !== null && document.visibilityState === 'visible') {
      await requestWakeLock();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  onUnmounted(() => {
    releaseWakeLock();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  });

  return { requestWakeLock, releaseWakeLock };
}
