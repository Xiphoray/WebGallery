/** @type {import('tailwindcss').Config} */
export default {
  // 扫描所有 Vue 和 JS 文件中的 class
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // 启用手动暗黑模式 (支持 day/night 切换)
  theme: {
    extend: {
      fontFamily: {
        // 需求指定的字体: SegoeUI-Bold 和 Roboto Bold
        // 我们定义为 'primary'，默认回退到 sans-serif
        primary: ['"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      colors: {
        // 可以在这里定义一些自定义颜色，不过 Tailwind 默认的足够用
      }
    },
  },
  plugins: [],
}