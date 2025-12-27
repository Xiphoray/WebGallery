# 使用官方 Node.js 镜像作为基础镜像
FROM node:20-slim

# 设置环境变量的默认值
# 容器内部使用的默认端口
ENV BACKEND_PORT 3573
ENV FRONTEND_PORT 3574
# 容器内部的图片挂载路径
ENV IMAGE_ROOT /app/data/images
# 容器内部的前端构建目录路径
ENV FRONTEND_DIR /app/frontend/dist

# --------------------------
# 1. 复制所有代码并安装依赖
# --------------------------
WORKDIR /app

# 复制 package.json 文件并安装依赖
# 注意：这里需要复制所有子项目的 package.json
COPY album-backend/package.json ./album-backend/
COPY album-frontend/package.json ./album-frontend/
COPY album-frontend/index.html ./album-frontend/
COPY album-frontend/vite.config.js ./album-frontend/
COPY album-frontend/tailwind.config.js ./album-frontend/
COPY album-frontend/postcss.config.js ./album-frontend/
COPY album-frontend/src ./album-frontend/src
COPY album-frontend/public ./album-frontend/public

# 安装全局依赖 (如 npm-run-all)
RUN npm install -g npm-run-all

# 安装后端依赖
WORKDIR /app/album-backend
RUN npm install

# 安装前端依赖
WORKDIR /app/album-frontend
RUN npm install

# --------------------------
# 2. 构建前端静态文件
# --------------------------
# 回到前端目录
WORKDIR /app/album-frontend
RUN npm run build


# --------------------------
# 3. 复制所有代码 (包括 server.js)
# --------------------------
WORKDIR /app
COPY album-backend/ ./album-backend/


# --------------------------
# 4. 配置入口点
# --------------------------
# 声明容器内部监听的端口
EXPOSE 3573
EXPOSE 3574

# 启动命令：同时运行后端服务和前端的静态文件服务
# 我们让 Vite preview 来服务前端的静态文件
WORKDIR /app/album-frontend
ENTRYPOINT ["npm-run-all", "-p", "backend:start", "frontend:serve"] 
# 注意：这里的脚本需要你在 album-frontend/package.json 中定义
