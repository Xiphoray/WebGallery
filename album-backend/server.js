const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const fg = require('fast-glob'); // 快速文件扫描
const mime = require('mime-types'); // 获取文件MIME类型
const config = require('./config.json'); // 读取配置

const app = express();
const PORT = process.env.BACKEND_PORT ? parseInt(process.env.BACKEND_PORT) : 3573;
const IMAGE_ROOT = process.env.IMAGE_ROOT || config.imageRoot;
const SCAN_SUBDIRS = process.env.SCAN_SUBDIRS === 'true' || config.scanSubdirectories;

// ✨ 确保 CORS 配置支持前端端口（如果前端端口改变，CORS 需要调整）
// 在单容器部署中，如果前端通过 Nginx 代理，CORS 不是问题。
// 但如果直接访问 3573，则需要确保 CORS 允许该端口：
app.use(cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3573', // 默认允许 3573端口访问
}));

// 内存中的图片路径列表
let imageCache = [];

/**
 * 核心功能：扫描图片
 * 使用 fast-glob 进行高效递归扫描
 */
async function scanImages() {
    console.log('🔍 正在扫描图片目录:', IMAGE_ROOT);
    const startTime = Date.now();

    try {
        // 定义匹配模式：是否包含子文件夹
        // **/*.{ext} 代表递归匹配所有子目录
        // *.{ext} 代表只匹配当前目录
        const pattern = config.scanSubdirectories 
            ? '**/*.{jpg,jpeg,png,JPG,JPEG,PNG}' 
            : '*.{jpg,jpeg,png,JPG,JPEG,PNG}';

        // 执行扫描
        const files = await fg(pattern, {
            cwd: IMAGE_ROOT, // 扫描根目录
            absolute: true,        // 返回绝对路径
            onlyFiles: true        // 只返回文件
        });

        imageCache = files;
        const duration = (Date.now() - startTime) / 1000;
        console.log(`✅ 扫描完成! 耗时 ${duration}s`);
        console.log(`📸 共找到 ${imageCache.length} 张图片`);

    } catch (err) {
        console.error('❌ 扫描出错:', err);
    }
}

// ================= API 接口定义 =================

/**
 * 接口 1: 获取随机图片
 * GET /api/image/random
 */
app.get('/api/image/random', (req, res) => {
    if (imageCache.length === 0) {
        return res.status(404).send('No images found in the configured directory.');
    }

    // 1. 随机抽取一个索引
    const randomIndex = Math.floor(Math.random() * imageCache.length);
    const imagePath = imageCache[randomIndex];

    // 2. 检查文件是否存在 (防止扫描后文件被手动删除)
    if (!fs.existsSync(imagePath)) {
        console.warn('⚠️ 文件丢失，从缓存中移除:', imagePath);
        imageCache.splice(randomIndex, 1); // 修正缓存
        return res.status(404).send('Image not found on disk');
    }

    // 3. 获取 MIME 类型 (例如 image/jpeg)
    const mimeType = mime.lookup(imagePath) || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);

    // 4. 创建读取流并 Pipe (管道) 到 Response
    // 这种方式内存占用极低，不会把整个图片读入内存
    const stream = fs.createReadStream(imagePath);
    stream.pipe(res);
    
    // 错误处理
    stream.on('error', (err) => {
        console.error('Stream error:', err);
        res.status(500).end();
    });
});

/**
 * 接口 2: 获取配置信息 (可选)
 * GET /api/config
 * 用于前端显示扫描状态
 */
app.get('/api/config', (req, res) => {
    res.json({
        totalImages: imageCache.length,
        rootDirectory: IMAGE_ROOT,
        scannedAt: new Date().toISOString()
    });
});

// ================= 启动服务 =================

app.listen(PORT, async () => {
    console.log(`🚀 后端服务已启动: http://0.0.0.0:${PORT}`);
    // 服务启动时立即执行一次扫描
    await scanImages();
});