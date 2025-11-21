<script setup>
import { ref, watch, onMounted } from 'vue';
import { useAlbumStore } from '../stores/albumStore';
import { Save } from 'lucide-vue-next'; // 引入保存图标

const store = useAlbumStore();

// 内部状态，用于绑定表单输入
const form = ref({
    transitionMode: 'slide',
    displayMode: 'contain',
    refreshDuration: 5,
    refreshUnit: 'minute',
    colorMode: 'night',
    // 注意: 后端的 imageRoot 路径配置不在这里，而是固定的。
    // 如果需要前端可配置图片根路径，需要后端提供 /api/config/update 接口，此处暂不实现。
});

const isModalOpen = ref(true);
const validationError = ref('');

// 缓存旧配置，用于比较 (在 mounted 时加载)
let oldConfig = {};

// =========================================================
// 初始化与加载
// =========================================================

onMounted(() => {
    // 1. 用 store 中的配置初始化表单
    form.value = { ...store.config };
    
    // 2. 缓存当前配置，用于比较
    oldConfig = { ...store.config }; 
    
    // 3. 首次启动流程
    if (!store.config.hasInitialized) {
        isModalOpen.value = true;
    } else {
        isModalOpen.value = false;
    }
});


// =========================================================
// 验证与保存
// =========================================================

/**
 * 验证表单数据。
 */
const validateForm = () => {
    // 检查刷新时长是否为有效数字且大于 0
    const duration = form.value.refreshDuration;
    if (isNaN(duration) || duration <= 0) {
        validationError.value = '刷新时长必须是一个大于 0 的有效数字。';
        return false;
    }
    validationError.value = '';
    return true;
};

/**
 * 保存配置并关闭模态框。
 */
const saveConfig = () => {
    if (!validateForm()) {
        return;
    }

    // 1. 临时保存新配置
    const newConfig = { ...form.value, hasInitialized: true };
    const isFirstInit = !store.config.hasInitialized; // 检查是否为首次初始化

    // 2. 检查是否需要重启定时器
    const durationChanged = 
        newConfig.refreshDuration !== oldConfig.refreshDuration ||
        newConfig.refreshUnit !== oldConfig.refreshUnit;

    // 3. 调用 Store 的 Action，保存新配置
    store.saveConfig(newConfig);

    // 4. ✨ 重点：如果时长改变或首次启动，需要触发完整流程 (解决问题1)
    if (isFirstInit) {
        // 首次启动，需要加载图片和启动定时器
        store.startAppFlow(); 
    } else if (durationChanged) {
        // 否则，只需要重启定时器
        store.restartAutoplay();
    }
    
    // 5. 更新缓存的旧配置
    oldConfig = newConfig;

    // 6. 关闭模态框
    isModalOpen.value = false;
};

// =========================================================
// 监听 Store 状态，用于初次启动控制
// =========================================================

// 监听 store 的初始化状态，如果初始化完成但 config.hasInitialized 为 false，则重新打开设置
watch(() => store.config.hasInitialized, (isInitialized) => {
    if (!isInitialized) {
        isModalOpen.value = true;
    }
}, { immediate: true });
</script>

<template>
    <div 
        v-if="isModalOpen" 
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
    >
        <div class="w-full max-w-lg bg-white/20 dark:bg-gray-800/20 p-8 rounded-2xl shadow-2xl">
            
            <h2 class="font-primary text-3xl font-bold mb-6 text-white dark:text-gray-100">
                相册设置 (Photo Frame Settings)
            </h2>
            <p v-if="!store.config.hasInitialized" class="text-yellow-200 mb-4">
                👋 欢迎! 请先完成配置以启动相册。
            </p>

            <form @submit.prevent="saveConfig" class="space-y-6">
                
                <div class="flex flex-col space-y-2">
                    <label class="text-white dark:text-gray-200 text-sm font-semibold">
                        自动刷新频率 (Auto Refresh)
                    </label>
                    <div class="flex space-x-2">
                        <input 
                            v-model.number="form.refreshDuration"
                            type="number" 
                            min="1"
                            class="flex-1 p-3 rounded-lg bg-white/50 text-black placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700/50 dark:text-white"
                            placeholder="输入时长"
                        />
                        <select 
                            v-model="form.refreshUnit" 
                            class="p-3 rounded-lg bg-white/50 text-black dark:bg-gray-700/50 dark:text-white focus:outline-none"
                        >
                            <option value="minute">分钟 (Minute)</option>
                            <option value="second">秒 (Second)</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label class="text-white dark:text-gray-200 text-sm font-semibold mb-2 block">
                        图片显示模式 (Fit Mode)
                    </label>
                    <div class="flex space-x-4">
                        <label class="flex items-center space-x-2 text-white dark:text-gray-200">
                            <input type="radio" v-model="form.displayMode" value="cover" class="form-radio text-blue-500">
                            <span>铺满全屏 (Cover)</span>
                        </label>
                        <label class="flex items-center space-x-2 text-white dark:text-gray-200">
                            <input type="radio" v-model="form.displayMode" value="contain" class="form-radio text-blue-500">
                            <span>单边铺满 (Contain)</span>
                        </label>
                    </div>
                </div>
                
                <div>
                    <label class="text-white dark:text-gray-200 text-sm font-semibold mb-2 block">
                        图片切换效果 (Transition)
                    </label>
                    <div class="flex space-x-4">
                        <label class="flex items-center space-x-2 text-white dark:text-gray-200">
                            <input type="radio" v-model="form.transitionMode" value="slide" class="form-radio text-blue-500">
                            <span>滑动 (Slide)</span>
                        </label>
                        <label class="flex items-center space-x-2 text-white dark:text-gray-200">
                            <input type="radio" v-model="form.transitionMode" value="fade" class="form-radio text-blue-500">
                            <span>渐隐 (Fade)</span>
                        </label>
                    </div>
                </div>
                
                <div>
                    <label class="text-white dark:text-gray-200 text-sm font-semibold mb-2 block">
                        背景颜色模式 (Color Mode)
                    </label>
                    <div class="flex space-x-4">
                        <label class="flex items-center space-x-2 text-white dark:text-gray-200">
                            <input type="radio" v-model="form.colorMode" value="day" class="form-radio text-blue-500">
                            <span>白天 (Day)</span>
                        </label>
                        <label class="flex items-center space-x-2 text-white dark:text-gray-200">
                            <input type="radio" v-model="form.colorMode" value="night" class="form-radio text-blue-500">
                            <span>夜晚 (Night)</span>
                        </label>
                        <label class="flex items-center space-x-2 text-white dark:text-gray-200">
                            <input type="radio" v-model="form.colorMode" value="auto" class="form-radio text-blue-500">
                            <span>自动 (Auto)</span>
                        </label>
                    </div>
                </div>

                <p v-if="validationError" class="text-red-400 text-sm font-medium">
                    {{ validationError }}
                </p>

                <div class="flex justify-end pt-4">
                    <button 
                        type="submit" 
                        class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-primary font-bold rounded-xl shadow-lg transition duration-150 flex items-center space-x-2"
                    >
                        <Save :size="18" />
                        <span>确认参数并启动</span>
                    </button>
                </div>

            </form>
        </div>
    </div>

    <button 
        v-if="!isModalOpen && store.config.hasInitialized"
        @click="isModalOpen = true"
        class="fixed top-4 right-4 z-40 p-3 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm transition duration-300 text-white shadow-xl"
    >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 0-.61.64l-.56 1.12a2 2 0 0 0 .74 2.25l.33.21a2 2 0 0 1 .73 1.54v.61a2 2 0 0 1-.73 1.54l-.33.21a2 2 0 0 0-.74 2.25l.56 1.12a2 2 0 0 0 .61.64l.43.25a2 2 0 0 1 1 1.73v.18a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 0 .61-.64l.56-1.12a2 2 0 0 0-.74-2.25l-.33-.21a2 2 0 0 1-.73-1.54v-.61a2 2 0 0 1 .73-1.54l.33-.21a2 2 0 0 0 .74-2.25l-.56-1.12a2 2 0 0 0-.61-.64l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
    </button>
</template>

<style scoped>
/* 自定义 radio 按钮样式，确保在亚克力背景下可见 */
.form-radio {
    /* 隐藏浏览器默认样式 */
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    
    /* 尺寸和边框 */
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 50%;
    border: 2px solid theme('colors.white'); /* 白色边框 */
    background-color: transparent;
    cursor: pointer;
    transition: all 0.2s;
}

/* 选中时的样式 */
.form-radio:checked {
    border-color: theme('colors.blue.500'); /* 选中后蓝色边框 */
    background-color: theme('colors.blue.500'); /* 填充蓝色 */
    /* 添加内阴影模拟被按下的效果或突出点 */
    box-shadow: 0 0 0 2px theme('colors.white') inset;
}
</style>