import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(),
	VitePWA({
      	registerType: 'autoUpdate',
      	manifest: require('./public/manifest.json'),
     	 workbox: {
       	 // 可根据需要自定义缓存策略
     	 }
   	 })],
  base: './', // 或者 base: '' 确保所有资源使用相对路径
  server: {
    host: '0.0.0.0',
    port: 3574,
    allowedHosts: true
  }

})
