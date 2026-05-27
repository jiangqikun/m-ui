import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'

const external = [
  'vue',
  'echarts',
  'echarts-gl',
  'echarts-wordcloud',
  '@vueuse/core',
  'lodash/debounce'
]

const globals = {
  vue: 'Vue',
  echarts: 'echarts',
  '@vueuse/core': 'VueUse',
  'lodash/debounce': 'debounce'
}

const autoImportPlugin = () => AutoImport({
  imports: [
    'vue',
    {
      vue: ['defineOptions', 'defineProps', 'defineEmits', 'defineExpose', 'withDefaults', 'defineModel']
    }
  ],
  dts: true,
  vueTemplate: true,
  eslintrc: {
    enabled: false
  }
})

export default defineConfig({
  server: {
      host: true,
      open: true,
  },
  plugins: [
    vue(),
    autoImportPlugin()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MUI',
      fileName: (format) => `m-ui.${format === 'es' ? 'js' : 'umd.cjs'}`,
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external,
      output: {
        globals,
        exports: 'named',
        assetFileNames: 'style.css'
      }
    },
    cssCodeSplit: false,
    sourcemap: true
  }
})
