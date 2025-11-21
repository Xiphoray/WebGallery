import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: './', // 或者 base: '' 确保所有资源使用相对路径
  server: {
    host: '0.0.0.0',
    port: 3574,
    allowedHosts: true
  }

})
