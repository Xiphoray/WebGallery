<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useAlbumStore } from '../stores/albumStore';

const store = useAlbumStore();

// 内部状态，用于显示日期和时间
const currentTime = ref(new Date());

/**
 * 格式化日期和星期
 */
const formatDate = (date) => {
    // 星期数组
    const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    
    // YYYY-MM-DD
    const dateStr = date.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    }).replace(/\//g, '-'); 
    
    // 星期
    const dayOfWeek = weekdays[date.getDay()];

    return { dateStr, dayOfWeek };
};

// 计时器 ID
let timerId = null;

/**
 * 每秒钟更新一次时间
 */
const updateTime = () => {
    currentTime.value = new Date();
};

onMounted(() => {
    // 启动计时器，每秒更新一次
    timerId = setInterval(updateTime, 1000); 
});

onBeforeUnmount(() => {
    // 组件销毁前清除计时器
    if (timerId) {
        clearInterval(timerId);
    }
});

// 计算属性，用于显示格式化的日期/星期
const formattedDate = computed(() => {
    return formatDate(currentTime.value);
});
</script>

<template>
    <div class="absolute inset-0 z-10 pointer-events-none">
        <div class="w-full h-full relative">
            
            <div 
                class="absolute left-0 top-0 h-full w-1/7 cursor-pointer pointer-events-auto"
                :class="{'opacity-0 hover:opacity-10 transition-opacity duration-300': true, 
                         'bg-black/30': store.canGoPrev }" 
                @click="store.prevImage()"
            >
                <span v-if="store.canGoPrev" class="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl opacity-0 hover:opacity-100 transition-opacity">
                    &#9664; </span>
            </div>

            <div 
                class="absolute right-0 top-0 h-full w-1/7 cursor-pointer pointer-events-auto"
                :class="{'opacity-0 hover:opacity-10 transition-opacity duration-300': true, 
                         'bg-black/30': true }" 
                @click="store.nextImage()"
            >
                 <span class="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl opacity-0 hover:opacity-100 transition-opacity">
                    &#9654; </span>
            </div>
            
        </div>

        <div 
            class="fixed bottom-6 right-6 p-4 rounded-xl shadow-xl font-primary font-bold z-20 pointer-events-none"
            :class="{
                // 亚克力效果
                'bg-black/40 backdrop-blur-sm': true,
                // 字体颜色和大小
                'text-white': true,
            }"
        >
            <div class="text-2xl tracking-wider">
                {{ formattedDate.dateStr }}
            </div>
            <div class="text-xl mt-1 opacity-80">
                {{ formattedDate.dayOfWeek }}
            </div>
        </div>
        
    </div>
</template>