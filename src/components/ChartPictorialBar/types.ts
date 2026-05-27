export interface ChartPictorialBarSeries {
  /** 系列名称 */
  name: string
  /** 数据数组 */
  data: number[]
  /** 自定义颜色（可选） */
  color?: string
  /** 形状类型：'rect' | 'roundRect' | 'triangle' | 'diamond' | 'pin' | 'arrow' | 'circle' | 'roundRect' | 'image' | 'path' */
  symbol?: string
  /** 形状大小 */
  symbolSize?: number | [number, number]
  /** 形状位置：'start' | 'end' | 'center' */
  symbolPosition?: 'start' | 'end' | 'center'
  /** 形状旋转角度 */
  symbolRotate?: number
  /** 形状偏移 */
  symbolOffset?: [number, number]
  /** 自定义 SVG 路径 */
  symbolPath?: string
}

export interface ChartPictorialBarProps {
  /** 系列数据，默认一个系列 */
  series?: ChartPictorialBarSeries[]
  /** X轴类别数据 */
  categories?: string[]
  /** 颜色数组，默认三个颜色 */
  colors?: string[]
  /** 是否显示图例 */
  showLegend?: boolean
  /** 图例位置 */
  legendPosition?: 'top' | 'bottom' | 'left' | 'right'
  /** 图表高度 */
  height?: number | string
  /** 图表宽度 */
  width?: number | string
  /** 背景颜色 */
  backgroundColor?: string
  /** 是否显示网格 */
  showGrid?: boolean
  /** 网格线样式 */
  gridLineStyle?: {
    color?: string
    width?: number
    type?: 'solid' | 'dashed' | 'dotted'
  }
  /** 是否显示工具提示 */
  showTooltip?: boolean
  /** 工具提示格式化函数 */
  tooltipFormatter?: (params: any) => string
  /** 是否显示数据标签 */
  showLabel?: boolean
  /** Y轴最小值 */
  yAxisMin?: number
  /** Y轴最大值 */
  yAxisMax?: number
  /** Y轴分割段数 */
  yAxisSplitNumber?: number
  /** 网格配置 */
  grid?: {
    left?: string | number
    right?: string | number
    top?: string | number
    bottom?: string | number
  }
  /** X轴配置 */
  xAxis?: {
    show?: boolean
    axisLabel?: {
      rotate?: number
      interval?: number | 'auto'
    }
  }
  /** Y轴配置 */
  yAxis?: {
    show?: boolean
    name?: string
    nameLocation?: 'start' | 'middle' | 'end'
    nameTextStyle?: {
      color?: string
      fontSize?: number
    }
  }
  /** 柱子间距 */
  barGap?: number
  /** 同一类别柱子间距 */
  barCategoryGap?: number | string
  /** 是否启用动画 */
  animation?: boolean
  /** 动画持续时间（毫秒） */
  animationDuration?: number
  /** 完全自定义的 ECharts 配置项，传入后将以 options 为准，忽略其他属性。参考：https://echarts.apache.org/zh/option.html#series-pictorialBar.type */
  options?: any
}
