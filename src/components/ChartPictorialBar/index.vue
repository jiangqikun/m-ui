<template>
  <div
    ref="chartContainer"
    class="m-chart-pictorial-bar"
    :style="{ width: computedWidth, height: computedHeight, backgroundColor: backgroundColor }"
  ></div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import * as echarts from "echarts";
import type { PictorialBarSeriesOption } from "echarts";
import { useResizeObserver } from "@vueuse/core";
import type { ChartPictorialBarProps, ChartPictorialBarSeries } from "./types";

defineOptions({
  name: "MChartPictorialBar",
});

const props = withDefaults(defineProps<ChartPictorialBarProps>(), {
  series: () => [
    {
      name: "系列1",
      data: [20, 30, 10, 10, 30],
    },
  ],
  categories: () => ["运行", "空闲", "停机", "待机", "空运行"],
  colors: () => [
    "rgba(76, 175, 80, 0.8)", // 绿色
    "rgba(33, 150, 243, 0.8)", // 蓝色
    "rgba(158, 158, 158, 0.8)", // 灰色
    "rgba(255, 193, 7, 0.8)", // 黄色
    "rgba(255, 152, 0, 0.8)", // 橙色
  ],
  showLegend: false,
  legendPosition: "top",
  height: 400,
  width: "100%",
  backgroundColor: "rgba(173, 216, 230, 0.3)",
  showGrid: true,
  gridLineStyle: () => ({
    color: "rgba(0, 0, 0, 0.1)",
    width: 1,
    type: "dashed",
  }),
  showTooltip: true,
  tooltipFormatter: undefined,
  showLabel: true,
  yAxisMin: 0,
  yAxisMax: undefined,
  yAxisSplitNumber: 6,
  grid: () => ({
    left: "10%",
    right: "10%",
    top: "15%",
    bottom: "15%",
  }),
  xAxis: () => ({
    show: true,
    axisLabel: {
      rotate: 0,
      interval: "auto",
    },
  }),
  yAxis: () => ({
    show: true,
    name: "",
    nameLocation: "end",
    nameTextStyle: {
      color: "#666",
      fontSize: 12,
    },
  }),
  barGap: 0,
  barCategoryGap: "20%",
  animation: true,
  animationDuration: 1000,
});

const chartContainer = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

// 计算图表实际宽度
const computedWidth = computed(() => {
  if (typeof props.width === "number") {
    return `${props.width}px`;
  }
  return props.width;
});

// 计算图表实际高度
const computedHeight = computed(() => {
  if (typeof props.height === "number") {
    return `${props.height}px`;
  }
  return props.height;
});

// 生成锥形 SVG 路径（钟形曲线）
const generateConePath = (): string => {
  // 使用贝塞尔曲线创建平滑的钟形曲线路径
  // 路径从底部开始，经过顶部中心点，再回到底部，形成钟形
  // 坐标范围：x: 0-100, y: 0-100 (底部是100，顶部是0)
  // M 0,100: 移动到左下角
  // Q 30,70 50,0: 二次贝塞尔曲线到顶部中心
  // T 100,100: 平滑曲线到右下角
  // Z: 闭合路径
  return `M 0,100 Q 30,70 50,0 T 100,100 Z`;
};

// 构建 ECharts 配置
const buildOption = (): echarts.EChartsOption => {
  // 如果传入了 options，直接使用 options
  if (props.options) {
    return props.options;
  }

  const seriesData = props.series || [];
  const categories = props.categories || [];

  // 转换系列数据格式
  const echartsSeries: PictorialBarSeriesOption[] = seriesData.map(
    (item: ChartPictorialBarSeries, seriesIndex: number) => {
      const seriesColor = item.color || props.colors[seriesIndex % props.colors.length];
      
      // 生成锥形路径
      const symbolPath = item.symbolPath || generateConePath();
      // 如果用户提供了 symbol，直接使用；否则使用 path:// 前缀的路径
      const finalSymbol = item.symbol || `path://${symbolPath}`;
      
      // 转换数据格式
      const data: NonNullable<PictorialBarSeriesOption["data"]> = item.data.map((value: number) => {
        return {
          value: value,
          itemStyle: {
            color: seriesColor,
          },
          label: props.showLabel
            ? {
                show: true,
                position: 'top' as const,
                formatter: (params: any) => {
                  return `${params.value}%`;
                },
                color: '#333',
                fontSize: 12,
              }
            : {
                show: false,
              },
        };
      });

      const seriesConfig: PictorialBarSeriesOption = {
        name: item.name,
        type: "pictorialBar",
        data: data,
        symbol: finalSymbol,
        symbolSize: item.symbolSize || [60, 100],
        symbolPosition: item.symbolPosition || 'end',
        symbolRotate: item.symbolRotate || 0,
        symbolOffset: item.symbolOffset || [0, 0],
        barGap: typeof props.barGap === 'number' ? `${props.barGap}%` : props.barGap,
        barCategoryGap: typeof props.barCategoryGap === 'string' 
          ? props.barCategoryGap 
          : `${props.barCategoryGap}%`,
        animation: props.animation,
        animationDuration: props.animationDuration,
      };
      
      // 如果使用自定义路径，可能需要设置 symbolRepeat
      if (!item.symbol || item.symbol.startsWith('path://') || finalSymbol.startsWith('path://')) {
        // 对于锥形路径，让形状填充整个柱子高度
        seriesConfig.symbolRepeat = false;
        seriesConfig.symbolClip = false;
      }
      
      return seriesConfig;
    }
  );

  // 构建图例配置
  const legendConfig = props.showLegend
    ? {
        show: true,
        orient: (props.legendPosition === "left" || props.legendPosition === "right" ? "vertical" : "horizontal") as "vertical" | "horizontal",
        left: props.legendPosition === "left" ? "left" : props.legendPosition === "right" ? "right" : "center",
        top: props.legendPosition === "top" ? "top" : props.legendPosition === "bottom" ? "bottom" : "middle",
        textStyle: {
          color: "#666",
          fontSize: 14,
        },
      }
    : {
        show: false,
      };

  const option: echarts.EChartsOption = {
    backgroundColor: props.backgroundColor,
    legend: legendConfig,
    tooltip: props.showTooltip
      ? {
          trigger: "axis",
          axisPointer: {
            type: "shadow",
          },
          formatter: props.tooltipFormatter || ((params: any) => {
            if (Array.isArray(params)) {
              let result = `${params[0].axisValue}<br/>`;
              params.forEach((param: any) => {
                result += `${param.seriesName}: ${param.value}%<br/>`;
              });
              return result;
            }
            return "";
          }),
        }
      : {
          show: false,
        },
    grid: {
      left: props.grid?.left || "10%",
      right: props.grid?.right || "10%",
      top: props.grid?.top || "15%",
      bottom: props.grid?.bottom || "15%",
    },
    xAxis: {
      type: "category",
      data: categories,
      show: props.xAxis?.show !== false,
      axisLabel: props.xAxis?.axisLabel || {
        rotate: 0,
        interval: "auto",
      },
      axisLine: {
        lineStyle: {
          color: "#666",
        },
      },
    },
    yAxis: {
      type: "value",
      show: props.yAxis?.show !== false,
      name: props.yAxis?.name || "",
      nameLocation: props.yAxis?.nameLocation || "end",
      nameTextStyle: props.yAxis?.nameTextStyle || {
        color: "#666",
        fontSize: 12,
      },
      min: props.yAxisMin,
      max: props.yAxisMax,
      splitNumber: props.yAxisSplitNumber,
      axisLabel: {
        formatter: (value: number) => {
          return `${value}%`;
        },
        color: "#666",
        fontSize: 12,
      },
      splitLine: props.showGrid
        ? {
            show: true,
            lineStyle: props.gridLineStyle,
          }
        : {
            show: false,
          },
    },
    series: echartsSeries,
    animation: props.animation,
    animationDuration: props.animationDuration,
    animationEasing: "cubicOut",
  };

  return option;
};

// 初始化图表
const initChart = () => {
  if (!chartContainer.value) {
    console.warn("ChartPictorialBar: chartContainer is not available");
    return;
  }

  try {
    // 如果已经存在实例，先销毁
    if (chartInstance) {
      chartInstance.dispose();
      chartInstance = null;
    }

    chartInstance = echarts.init(chartContainer.value);
    const option = buildOption();
    chartInstance.setOption(option);
  } catch (error) {
    console.error("ChartPictorialBar initialization error:", error);
  }
};

// 更新图表
const updateChart = () => {
  if (!chartInstance) {
    // 如果实例不存在，尝试重新初始化
    initChart();
    return;
  }
  try {
    const option = buildOption();
    chartInstance.setOption(option, true);
  } catch (error) {
    console.error("ChartPictorialBar update error:", error);
  }
};

// 响应式调整
useResizeObserver(chartContainer, () => {
  if (chartInstance) {
    chartInstance.resize();
  }
});

// 监听尺寸变化
watch(
  () => [props.width, props.height],
  () => {
    if (chartInstance) {
      setTimeout(() => {
        chartInstance?.resize();
      }, 100);
    }
  }
);

onMounted(() => {
  // 使用 nextTick 确保 DOM 已经渲染完成
  nextTick(() => {
    initChart();
  });
});

// 监听数据变化
watch(
  () => [
    props.series,
    props.categories,
    props.colors,
    props.showLegend,
    props.legendPosition,
    props.backgroundColor,
    props.showGrid,
    props.gridLineStyle,
    props.showTooltip,
    props.tooltipFormatter,
    props.showLabel,
    props.yAxisMin,
    props.yAxisMax,
    props.yAxisSplitNumber,
    props.grid,
    props.xAxis,
    props.yAxis,
    props.barGap,
    props.barCategoryGap,
    props.animation,
    props.animationDuration,
    props.options,
  ],
  () => {
    updateChart();
  },
  { deep: true }
);

onBeforeUnmount(() => {
  // 清理图表实例
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
});
</script>

<style lang="scss" scoped>
.m-chart-pictorial-bar {
  @apply w-full h-full;
}
</style>
