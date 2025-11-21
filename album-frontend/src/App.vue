<script setup>
import { onMounted, watch } from 'vue';
import { useAlbumStore } from './stores/albumStore';
import SettingsModal from './components/SettingsModal.vue';
import ImageDisplay from './components/ImageDisplay.vue';
import Controls from './components/Controls.vue';

const store = useAlbumStore();

/**
 * 根据 store.config.colorMode 动态切换 Tailwind 的 dark 模式
 * Day Mode (白天): 移除 'dark' class
 * Night Mode (夜晚): 添加 'dark' class
 * Auto Mode (自动): 根据系统偏好设置
 */
const updateColorMode = (mode) => {
    const root = document.documentElement;
    
    // 移除系统监听器以防重复
    if (window.matchMedia('(prefers-color-scheme: dark)').onchange) {
         window.matchMedia('(prefers-color-scheme: dark)').onchange = null;
    }

    if (mode === 'day') {
        root.classList.remove('dark');
    } else if (mode === 'night') {
        root.classList.add('dark');
    } else if (mode === 'auto') {
        // 自动模式：根据系统设置
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const applySystemMode = (e) => {
            if (e.matches) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        };
        
        applySystemMode(mediaQuery); // 立即应用一次
        mediaQuery.onchange = applySystemMode; // 监听系统变化
    }
};


// 1. 组件挂载时，初始化 Store
onMounted(() => {
    store.initialize();
});

// 2. 监听配置中的颜色模式，实时更新 UI
watch(() => store.config.colorMode, (newMode) => {
    updateColorMode(newMode);
}, { immediate: true }); // 立即执行一次

// 3. 监听初始化状态：如果尚未初始化，则阻止渲染核心内容
// Note: SettingsModal 会根据 store.config.hasInitialized 自动显示
</script>

<template>
    <!-- 主容器：根据配置切换背景色 -->
    <div 
        :class="{ 
            // 切换黑夜/白天背景色
            'bg-white dark:bg-gray-900': true,
            // 确保内容铺满全屏
            'h-screen w-screen overflow-hidden': true,
            // 优化过渡效果
            'transition-colors duration-500': true 
        }"
    >
        
        <!-- 核心内容区域 (只有在初始化完成且不处于初始加载时才显示) -->
        <template v-if="!store.isLoadingInitial && store.config.hasInitialized">
            <!-- 1. 图片展示区 -->
            <ImageDisplay />
        </template>
        <template v-if="store.config.hasInitialized">
            <!-- 2. 控制覆盖层 (日期/切换按钮) -->
            <Controls />
        </template>
        <!-- 加载中提示 -->
        <div 
            v-if="store.isLoadingInitial && store.config.hasInitialized" 
            class="h-full w-full flex items-center justify-center text-gray-700 dark:text-gray-300 transition-opacity"
        >
            <svg class="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>相册正在加载中... (Loading Album)</span>
        </div>

        <!-- 3. 设置弹窗 (始终渲染，它自己会根据状态判断是否显示) -->
        <SettingsModal />
        
    </div>
</template>