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

const componentEntries = {
  button: resolve(__dirname, 'src/components/Button/index.vue'),
  input: resolve(__dirname, 'src/components/Input/index.vue'),
  'chart-bar': resolve(__dirname, 'src/components/ChartBar/index.vue'),
  'chart-bar-3d': resolve(__dirname, 'src/components/ChartBar3D/index.vue'),
  'chart-pie': resolve(__dirname, 'src/components/ChartPie/index.vue'),
  'chart-pie-3d': resolve(__dirname, 'src/components/ChartPie3D/index.vue'),
  'chart-line': resolve(__dirname, 'src/components/ChartLine/index.vue'),
  'chart-map-cq': resolve(__dirname, 'src/components/ChartMapCq/index.vue'),
  'chart-map-cq-3d': resolve(__dirname, 'src/components/ChartMapCq3D/index.vue'),
  'chart-word-cloud': resolve(__dirname, 'src/components/ChartWordCloud/index.vue'),
  'chart-graph': resolve(__dirname, 'src/components/ChartGraph/index.vue'),
  'chart-radar': resolve(__dirname, 'src/components/ChartRadar/index.vue'),
  'chart-tree': resolve(__dirname, 'src/components/ChartTree/index.vue'),
  'chart-sunburst': resolve(__dirname, 'src/components/ChartSunburst/index.vue'),
  'chart-kline': resolve(__dirname, 'src/components/ChartKLine/index.vue'),
  'chart-pictorial-bar': resolve(__dirname, 'src/components/ChartPictorialBar/index.vue'),
  'chart-funnel': resolve(__dirname, 'src/components/ChartFunnel/index.vue'),
  'chart-gauge': resolve(__dirname, 'src/components/ChartGauge/index.vue'),
  'responsive-page': resolve(__dirname, 'src/components/ResponsivePage/index.vue'),
  'scroll-box': resolve(__dirname, 'src/components/ScrollBox/index.vue'),
  'ellipsis-text': resolve(__dirname, 'src/components/EllipsisText/index.vue'),
  'gradation-text': resolve(__dirname, 'src/components/GradationText/index.vue')
}

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: [
        'vue',
        {
          vue: ['defineOptions', 'defineProps', 'defineEmits', 'defineExpose', 'withDefaults', 'defineModel']
        }
      ],
      dts: false,
      vueTemplate: true
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: componentEntries,
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`
    },
    rollupOptions: {
      external,
      output: {
        assetFileNames: 'component-style.css',
        chunkFileNames: 'chunks/[name]-[hash].js'
      }
    },
    sourcemap: true
  }
})
