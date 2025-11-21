# 🖼️ Digital Photo Frame / 网页电子相框

[![GitHub license](https://img.shields.io/github/license/Xiphoray/Digital-Photo-Frame?style=flat-square)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/Xiphoray/Digital-Photo-Frame?style=flat-square&color=FFC300)](https://github.com/Xiphoray/Digital-Photo-Frame/stargazers)
[![Docker Pulls](https://img.shields.io/docker/pulls/Xiphoray/photo-album-combined?style=flat-square&color=2496ED)](https://hub.docker.com/r/Xiphoray/photo-album-combined)
[![Language](https://img.shields.io/badge/Language-Vue%20%7C%20Node-4FC08D?style=flat-square)](https://vuejs.org/)

**Digital Photo Frame** 是一个基于现代化 Web 技术栈构建的、自托管的、具有高度可定制性的数字相册应用。它专为在树莓派、旧平板或电脑上全屏运行而设计，旨在提供一个美观、流畅且内存友好的方式来循环展示您的家庭照片。

## ✨ 核心特性 (Key Features)

* **双向滑动队列 (Queue-based Sliding):** 采用 Pinia Store 实现图片队列的“滑动窗口”模式，支持历史记录回退，并自动管理内存（通过 `URL.revokeObjectURL` 机制）。
* **冷启动优化 (Cold Start Optimization):** 无需等待整个队列加载完成，加载第一张图片后即可立即渲染，保障快速启动体验。
* **高度可定制化 UI (Highly Customizable UI):** 支持主题（日间/夜间/自动）、两种切换动画（滑动/渐隐）和两种图片显示模式（铺满/适应）。
* **资源高效管理 (Efficient Resource Management):** 后端随机读取图片并以二进制流返回，前端预加载机制确保切换流畅，同时及时销毁旧图片 URL 释放内存。
* **Docker 快速部署 (Easy Docker Deployment):** 提供单体 Docker 镜像，只需简单配置端口和图片源路径即可运行。
* **响应式设计 (Responsive Design):** 完美适配手机、平板和桌面设备。

## 🛠️ 技术栈 (Technology Stack)

| 模块 (Module) | 技术 (Technology) | 描述 (Description) |
| :--- | :--- | :--- |
| **前端框架** | `Vue 3` (Composition API) | 快速、响应式的前端视图层。 |
| **状态管理** | `Pinia` | 极简、类型安全的全局状态管理。 |
| **样式/UI** | `Tailwind CSS`, `PostCSS` | 快速、实用的原子化 CSS 框架。 |
| **构建工具** | `Vite` | 极速的构建和开发体验。 |
| **后端服务** | `Node.js`, `Express` | 轻量级的后端 API，负责文件扫描和图片流传输。 |

## 🚀 部署指南 (Deployment Guide)

本项目推荐使用 Docker 部署，因为它能将前后端环境和配置统一打包。

### 1. 先决条件

* 已安装 Docker 和 Docker Compose。
* 宿主机上存储图片的目录路径（例如 `/home/user/my_photos`）。

### 2. 构建单体镜像

在项目根目录（包含 `Dockerfile` 和 `docker-compose.yml` 的位置）执行构建命令。由于 Docker 版本可能默认使用 Buildx，请使用以下命令确保构建成功并将镜像加载到本地：

```bash
docker buildx build --load -t photo-album-combined .
````

### 3\. 运行容器 (使用 Docker Compose)

创建 `.env` 文件来配置您的主机端口和图片路径：

**`.env` 示例：**

```bash
# 宿主机上访问前端的端口
HOST_FRONTEND_PORT=3574

# 宿主机上访问后端的端口 (如需直连 API)
HOST_BACKEND_PORT=3573

# ⚠️ 宿主机上存放图片文件的绝对路径
# 必须替换为您实际的图片目录路径！
IMAGE_SOURCE_PATH=/home/user/my_photos

FRONTEND_ORIGIN: https://domain.com

```

运行服务：

```bash
docker-compose up -d
```

### 4\. 访问应用

打开浏览器访问配置的前端端口：`http://localhost:3574` (或您配置的端口)。

-----


## 🤝 贡献 (Contribution)

欢迎任何形式的贡献，包括 Bug 修复、功能增强或文档改进。

1.  Fork 本仓库。
2.  创建您的特性分支 (`git checkout -b feature/AmazingFeature`)。
3.  提交您的修改 (`git commit -m 'Add some AmazingFeature'`)。
4.  推送到分支 (`git push origin feature/AmazingFeature`)。
5.  打开一个 Pull Request。

-----
