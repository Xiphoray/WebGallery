<script setup>
import { computed } from 'vue';
import { useAlbumStore } from '../stores/albumStore';

const store = useAlbumStore();

// 1. 根据配置计算图片应该使用的 CSS object-fit 属性
const imageFitClass = computed(() => {
    // 'cover' 对应等比例拉伸铺满全屏
    // 'contain' 对应等比例拉伸单边铺满屏幕
    return store.config.displayMode === 'cover' 
        ? 'object-cover' 
        : 'object-contain';
});

// 2. 根据配置计算切换动画的名称
const transitionName = computed(() => {
    // 渐隐模式不变
    if (store.config.transitionMode === 'fade') {
        return 'fade';
    }
    
    // ✨ 滑动模式时，根据 store.slideDirection 动态返回类名
    return `slide-${store.slideDirection}`;
});

// 3. 计算当前应该渲染的图片ID
// 我们使用图片对象的 ID 作为 Transition 的 Key，这样 Vue 才能检测到元素变化并触发动画
const currentImageKey = computed(() => {
    // 确保在队列可用时返回 ID
    const currentImg = store.imgQueue[store.currentIndex];
    return currentImg ? currentImg.id : 'placeholder';
});

// 4. 获取当前显示的图片URL
const currentImageUrl = computed(() => store.currentImageUrl);

// 5. 错误处理：当图片URL为空时显示占位符
const hasImage = computed(() => !!currentImageUrl.value);

</script>

<template>
    <div class="absolute inset-0 w-full h-full overflow-hidden">

        <Transition :name="transitionName">
            <div 
                v-if="!hasImage" 
                :key="'placeholder'" 
                class="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-800 transition-colors"
            >
                <span class="text-xl text-gray-500">
                    {{ store.isLoadingInitial ? '正在连接后端并加载图片...' : '图片加载失败或队列为空' }}
                </span>
            </div>
            
            <img 
                v-else
                :key="currentImageKey" 
                :src="currentImageUrl"
                alt="Display Image"
                class="w-full h-full transition-opacity duration-500"
                :class="[
                    imageFitClass,
                    'absolute inset-0' 
                ]"
            />
        </Transition>
    </div>
</template>

<style>
/* ---------------------------------------------------- */
/* 动画样式：Fade (渐隐渐显) */
/* ---------------------------------------------------- */
.fade-enter-active,
.fade-leave-active {
    /* 动画总时长设为 500ms (与 class 中的 transition-opacity duration-500 对应) */
    transition: opacity 0.5s ease; 
}

/* 旧图离开时渐隐 */
.fade-leave-to {
    opacity: 0;
}

/* 新图进入时渐显 */
.fade-enter-from {
    opacity: 0;
}

/* ---------------------------------------------------- */
/* 动画样式：Slide-Next (向左滑动) */
/* ---------------------------------------------------- */
.slide-next-enter-active,
.slide-next-leave-active {
    /* position: absolute; */
    transition: transform 0.8s ease-in-out;
    /* width: 100%;*/
    /* height: 100%;*/
    /* opacity: 1;*/
    z-index: 10;
}

/* 新图进入 (从右侧滑入) */
.slide-next-enter-from {
    transform: translateX(100%);
}

/* 旧图离开 (向左侧滑出) */
.slide-next-leave-to {
    transform: translateX(-100%);
}

/* ---------------------------------------------------- */
/* 动画样式：Slide-Prev (向右滑动) */
/* ---------------------------------------------------- */
.slide-prev-enter-active,
.slide-prev-leave-active {
    /* position: absolute; */
    transition: transform 0.8s ease-in-out;
    /* width: 100%;*/
    /* height: 100%;*/
    /* opacity: 1;*/
    z-index: 10;
}

/* 新图进入 (从左侧滑入) */
.slide-prev-enter-from {
    transform: translateX(-100%);
}

/* 旧图离开 (向右侧滑出) */
.slide-prev-leave-to {
    transform: translateX(100%);
}
</style>
