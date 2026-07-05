# =============================================================================
# Vue3 前端 Docker 镜像 — 多阶段构建
# Stage 1: Node 构建
# Stage 2: Nginx 运行
# =============================================================================
# ---- Stage 1: Build ----
FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖
COPY frontend/package*.json ./
RUN npm install --registry=https://registry.npmmirror.com

# 复制源码并构建
COPY frontend/ .
RUN npm run build

# ---- Stage 2: Serve ----
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
