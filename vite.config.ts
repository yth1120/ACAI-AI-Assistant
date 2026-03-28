import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: './',
  build: {
    outDir: 'dist-vue',
    emptyOutDir: true,
    // 生产环境移除 console
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    // 代码分割优化
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-naive': ['naive-ui'],
          'vendor-utils': ['axios', 'eventsource-parser']
        }
      }
    }
  },
  server: {
    port: 5173,
    // 预加载模块以提升性能
    warmup: {
      clientFiles: [
        './src/main.ts',
        './src/App.vue',
        './src/views/*.vue'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  // CSS 优化
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true
      }
    }
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'naive-ui', 'axios']
  }
})
