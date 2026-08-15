import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig({
  // 相对路径，便于部署到任意子路径（GitHub Pages 等）
  base: './',
  plugins: [preact()],
})
