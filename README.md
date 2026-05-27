# M-UI

一个基于 Vue3 的组件库，重点提供数据可视化组件和少量基础 UI 组件。

## 特性

- 🎨 丰富的组件
- 📦 按需引入
- 🔷 TypeScript 支持
- 🎯 Vue3 Composition API
- 📱 响应式设计
- 🚀 基于 Vite 构建

## 安装

```bash
npm install @jqkgg/m-ui
```

## 快速开始

📖 [使用文档](https://jqkgg.github.io/m-ui/)

### 完整引入

```javascript
import { createApp } from 'vue'
import MUI from '@jqkgg/m-ui'
import '@jqkgg/m-ui/style.css'

const app = createApp(App)
app.use(MUI)
app.mount('#app')
```

### 从主入口按需引入

```javascript
import { MButton, MInput, MChartBar } from '@jqkgg/m-ui'
import '@jqkgg/m-ui/style.css'
```

### 按组件子路径引入

```javascript
import MChartBar from '@jqkgg/m-ui/chart-bar'
import '@jqkgg/m-ui/component-style.css'
```

### 依赖安装

组件库依赖以下包，使用前请确保已安装：

```bash
# Vue 3（必需）
npm install vue@^3.0.0

# ECharts（图表组件需要）
npm install echarts@^5.0.0

# 3D 图表组件需要
npm install echarts-gl@^2.0.0

# 词云组件需要
npm install echarts-wordcloud@^2.0.0
```

## 使用示例

### Button 按钮

```vue
<template>
  <MButton type="primary" @click="handleClick">主要按钮</MButton>
</template>

<script setup>
import { MButton } from '@jqkgg/m-ui'

const handleClick = () => {
  console.log('按钮被点击')
}
</script>
```

### Input 输入框

```vue
<template>
  <MInput v-model="value" placeholder="请输入内容" />
</template>

<script setup>
import { ref } from 'vue'
import { MInput } from '@jqkgg/m-ui'

const value = ref('')
</script>
```

### ChartBar 柱状图

```vue
<template>
  <MChartBar
    :series="[
      { name: '系列1', data: [100, 200, 300, 400, 500] }
    ]"
    :categories="['类别1', '类别2', '类别3', '类别4', '类别5']"
  />
</template>

<script setup>
import { MChartBar } from '@jqkgg/m-ui'
</script>
```

**注意**：使用 ChartBar 组件前，请确保已安装 `echarts`：

```bash
npm install echarts@^5.0.0
```

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器（查看组件演示）
npm run dev

# 构建组件库
npm run build

# 启动文档开发服务器
npm run dev:docs

# 构建文档
npm run build:docs
```

## 组件

- 基础组件：Button、Input
- 容器组件：ResponsivePage、ScrollBox
- 文本组件：EllipsisText、GradationText
- 图表组件：ChartBar、ChartBar3D、ChartPie、ChartPie3D、ChartLine、ChartMapCq、ChartMapCq3D、ChartWordCloud、ChartGraph、ChartRadar、ChartTree、ChartSunburst、ChartKLine、ChartPictorialBar、ChartFunnel、ChartGauge

## 浏览器支持

现代浏览器和 IE11+（需要 polyfills）

## 技术栈

- Vue 3
- TypeScript
- Vite
- Tailwind CSS
- SCSS
- VitePress（文档）

## License

MIT

