import { defineStore } from 'pinia';
import { useLocalStorage } from '@vueuse/core';

// 默认配置 (与需求文档中的默认值一致)
const DEFAULT_CONFIG = {
    transitionMode: 'slide',   // 'slide' | 'fade'
    displayMode: 'contain',    // 'cover' (全屏) | 'contain' (居中)
    refreshDuration: 5,        // 刷新时长
    refreshUnit: 'minute',     // 'second' | 'minute'
    colorMode: 'night',        // 'day' | 'night' | 'auto'
    hasInitialized: false,     // 首次打开标识
};

const QUEUE_SIZE = 7;
const CURRENT_INDEX = 4; // 队列中，当前显示图片的位置索引

// -------------------------------------------------------------
// Helper: 计算刷新时长（毫秒）
// -------------------------------------------------------------
const getDurationMs = (duration, unit) => {
    const factor = (unit === 'minute') ? 60000 : 1000;
    return duration * factor;
};

// -------------------------------------------------------------
// Store 定义
// -------------------------------------------------------------

export const useAlbumStore = defineStore('album', {
    state: () => ({
        // 配置状态 (使用 useLocalStorage 自动同步到浏览器)
        config: useLocalStorage('album-config', DEFAULT_CONFIG), 
        
        // 核心图片队列: { id: number, blobUrl: string, blob: Blob }
        imgQueue: [], 
        
        // 游标，指向 imgQueue 中当前屏幕显示的图片索引
        currentIndex: CURRENT_INDEX, 
        
        // 首次加载状态 (用于显示进度条)
        isLoadingInitial: true, 
        
        // 自动播放定时器 ID
        autoplayTimer: null,

        // 默认为 'next' (向左滑入/出)，'prev' 则为向右滑入/出
        slideDirection: 'next',

        // ✨ 新增：最终确定的 API Base URL
        activeApiBase: '',
    }),

    getters: {
        // 获取当前显示的图片 URL
        currentImageUrl: (state) => {
            if (state.imgQueue.length === 0) return null;
            // 冷启动状态下，如果队列不满，我们渲染第一个可用的图片
            const index = state.imgQueue.length <= CURRENT_INDEX 
                ? state.imgQueue.length - 1 
                : state.currentIndex;
            
            return state.imgQueue[index]?.blobUrl || null;
        },
        
        // 检查是否可以点击“返回上一张”
        canGoPrev: (state) => state.currentIndex > 0,
        
        // 检查队列是否已满 7 张图
        isQueueFull: (state) => state.imgQueue.length === QUEUE_SIZE,
    },

    actions: {

        /**
         * ✨ NEW: 测试单个 API 地址是否可用
         */
        async testConnection(baseUrl) {
            if (!baseUrl) return false;
            try {
                // 设置 2 秒超时，防止测试卡太久
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);

                // 请求 /api/config
                const res = await fetch(`${baseUrl}/api/config`, { 
                    method: 'GET',
                    signal: controller.signal 
                });
                
                clearTimeout(timeoutId);
                return res.ok; // 如果返回 200 OK，则连接成功
            } catch (e) {
                return false;
            }
        },

        /**
         * ✨ NEW: 决定最佳 API 地址 (核心逻辑)
         */
        async determineApiUrl() {
            // 1. 从 window.env 读取运行时配置
            const localApi = window.env?.API_LOCAL;
            const domainApi = window.env?.API_DOMAIN;

            console.log('正在测试 API 连接...', { localApi, domainApi });

            // 2. 优先测试本地地址
            if (localApi) {
                const isLocalOk = await this.testConnection(localApi);
                if (isLocalOk) {
                    console.log(`✅ 选中本地 API: ${localApi}`);
                    this.activeApiBase = localApi;
                    return;
                }
                console.warn(`❌ 本地 API (${localApi}) 无法连接`);
            }

            // 3. 如果本地失败，测试域名地址
            if (domainApi) {
                const isDomainOk = await this.testConnection(domainApi);
                if (isDomainOk) {
                    console.log(`✅ 选中域名 API: ${domainApi}`);
                    this.activeApiBase = domainApi;
                    return;
                }
                console.warn(`❌ 域名 API (${domainApi}) 无法连接`);
            }

            // 4. 都不行，或者没配置，使用相对路径 (同源策略)
            console.log('⚠️ 使用默认相对路径 /api');
            this.activeApiBase = ''; 
        },

        // =========================================================
        // A. 图片获取与内存管理
        // =========================================================

        /**
         * 从后端获取一张图片，创建 Blob URL 并返回。
         * 负责处理 Blob URL 的创建，但不负责 revoke。
         */
        async fetchImage() {
            const url = `${this.activeApiBase}/api/image/random`;
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error('Backend fetch failed');

                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                
                return {
                    id: Date.now() + Math.random(), // 唯一ID用于 Vue Key
                    blobUrl,
                    blob, // 保留原始 Blob 对象 (备用)
                };

            } catch (error) {
                console.error('Error fetching image:', error);
                // 可以返回一个错误图片 URL
                return null;
            }
        },

        /**
         * 释放给定的 Blob URL 占用的内存。
         * @param {string} url - 需要释放的 URL.
         */
        revokeUrl(url) {
            if (url) {
                URL.revokeObjectURL(url);
                // console.log('Revoked URL:', url); // 用于调试
            }
        },

        // =========================================================
        // B. 队列操作逻辑
        // =========================================================

        /**
         * 填充队列 (用于初始化和冷启动)。
         * @param {number} targetCount - 目标要加载的图片数量。
         */
        async fillQueue(targetCount) {
            const promises = [];
            
            for (let i = 0; i < targetCount; i++) {
                promises.push(this.fetchImage());
            }

            const results = await Promise.all(promises);
            const newImages = results.filter(img => img !== null);
            
            this.imgQueue.push(...newImages);
        },

        /**
         * ✨ NEW: 启动完整的应用流程（清空队列、加载、启动定时器）
         */
        async startAppFlow() {
            this.isLoadingInitial = true;

            // 1. 清理现有队列和内存
            this.imgQueue.forEach(item => this.revokeUrl(item.blobUrl));
            this.imgQueue = [];
            this.currentIndex = CURRENT_INDEX;

            // 2. ✨ 优化加载：优先加载第 4 张图 (只加载 1 张)
            await this.fillQueue(1); 
            
            // 3. 立即关闭加载状态，允许渲染 (解决问题3：优先显示)
            this.isLoadingInitial = false;

            // 4. 启动后台加载（加载剩下的 6 张）
            if (this.imgQueue.length === 1) {
                 // 非阻塞式加载剩下的图片，用户已经可以看到第一张图了
                 this.fillQueue(QUEUE_SIZE - 1); 
            }
            
            // 5. 启动自动播放
            this.startAutoplay();
        },

        /**
         * 切换到下一张图片。
         * 实现了“滑动窗口”和“历史记录”逻辑。
         */
        async nextImage() {
            
            this.slideDirection = 'next';
            // 情况 1: 用户处于“历史记录”中 (只需要向前移动游标)
            if (this.currentIndex < CURRENT_INDEX) {
                this.currentIndex++;
                return;
            }

            // 情况 2: 用户处于“最新位置” (需要整体左移，并补充新图)
            if (this.currentIndex === CURRENT_INDEX) {
                
                // 1. 预加载策略: 如果队列未满或刚满，立即加载下一张
                if (this.imgQueue.length === QUEUE_SIZE) {
                    this.preloadNext(QUEUE_SIZE); 
                }

                // 2. 销毁: 释放队头图片的内存
                const oldImg = this.imgQueue[0];
                if (oldImg) {
                    this.revokeUrl(oldImg.blobUrl);
                }

                // 3. 移动: 整体左移，队尾的新图会作为 Index 6 自动滑入
                this.imgQueue.shift();

                // 4. 补充: 请求后端新图片，添加到数组末尾
                const newImg = await this.fetchImage();
                if (newImg) {
                    this.imgQueue.push(newImg);
                } else {
                    // 如果获取失败，用一个空对象或占位符补充，保证队列长度
                    this.imgQueue.push({ blobUrl: null });
                }
                
                // 渲染：无需修改 currentIndex，因为队列整体移动，原来的 Index 5 自动变为了 Index 4
            }
        },

        /**
         * 切换到上一张图片 (只移动游标)。
         */
        prevImage() {
            if (this.currentIndex > 0) {
                this.slideDirection = 'prev';
                this.currentIndex--;
            }
        },
        
        /**
         * 预加载下一张图片 (在 Index 6 显示时触发)。
         * 注意：在这个 7 槽模型中，我们总是在 `nextImage` 逻辑中获取新图并补充到队尾。
         * 这个函数主要作为对 `nextImage` 逻辑的封装，确保队列始终在准备下一张图。
         * 如果 imgQueue 长度小于 QUEUE_SIZE，应该优先调用 fillQueue。
         * @param {number} targetIndex - 触发预加载的索引。
         */
        async preloadNext(targetIndex = QUEUE_SIZE) {
            // 确保我们总是在队列满员的情况下工作
            if (this.imgQueue.length === targetIndex) {
                 // 预加载到第 8 个位置，等待下一次 shift 
                 // 在此模型中，预加载逻辑已经集成在 nextImage 的 shift/push 流程中了。
                 // 理论上，当 imgQueue[6] 显示时 (即 currentIndex 变到 5，下一次就到 4，然后 shift)，
                 // nextImage 已经包含了 fetch 逻辑。因此这里不需要额外的复杂预加载逻辑。
                 // 保持 nextImage 的自洽性即可。
            }
        },


        // =========================================================
        // C. 核心流程控制
        // =========================================================

        /**
         * 启动自动播放定时器。
         */
        startAutoplay() {
            this.stopAutoplay(); // 先清除旧的定时器
            
            const ms = getDurationMs(this.config.refreshDuration, this.config.refreshUnit);
            
            if (ms > 0) {
                this.autoplayTimer = setInterval(() => {
                    this.nextImage();
                }, ms);
            }
        },

        /**
         * 停止自动播放定时器。
         */
        stopAutoplay() {
            if (this.autoplayTimer) {
                clearInterval(this.autoplayTimer);
                this.autoplayTimer = null;
            }
        },

        saveConfig(newConfig) {
            // 1. 更新配置并标记为已初始化
            this.config = { ...this.config, ...newConfig, hasInitialized: true };
            // 注意：此时我们还没有重启计时器，也没有清理队列。
        },

        restartAutoplay() {
            this.startAutoplay();
        },

        /**
         * 调整 initialize 逻辑 (仅在配置完成后调用 startAppFlow)
         */
        async initialize() {
            await this.determineApiUrl();
            if (this.config.hasInitialized) {
                await this.startAppFlow();
            } else {
                // 首次打开，只显示设置弹窗
                this.isLoadingInitial = false; 
            }
        },

    },
});