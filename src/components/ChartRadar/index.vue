<template>
  <div
    ref="chartContainer"
    class="m-chart-radar"
    :style="{ width: computedWidth, height: computedHeight, backgroundColor: backgroundColor }"
  ></div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import * as echarts from "echarts";
import type { RadarSeriesOption } from "echarts";
import { useResizeObserver } from "@vueuse/core";
import type { ChartRadarProps, ChartRadarSeries } from "./types";

defineOptions({
  name: "MChartRadar",
});

const props = withDefaults(defineProps<ChartRadarProps>(), {
  series: () => [
    {
      name: "系列1",
      data: [100, 80, 90, 70, 85],
    },
  ],
  indicators: () => [
    { name: "指标1", max: 100 },
    { name: "指标2", max: 100 },
    { name: "指标3", max: 100 },
    { name: "指标4", max: 100 },
    { name: "指标5", max: 100 },
  ],
  colors: () => [
    "rgba(66, 133, 244, 0.8)", // 蓝色
    "rgba(255, 193, 7, 0.8)", // 黄色
    "rgba(76, 175, 80, 0.8)", // 绿色
    "rgba(255, 99, 132, 0.8)", // 红色
    "rgba(153, 102, 255, 0.8)", // 紫色
  ],
  showLegend: true,
  legendPosition: "top",
  height: 400,
  width: "100%",
  backgroundColor: "transparent",
  center: () => ["50%", "50%"],
  radius: "75%",
  startAngle: 90,
  showSplitLine: true,
  splitLineStyle: () => ({
    color: "rgba(0, 0, 0, 0.1)",
    width: 1,
    type: "dashed",
  }),
  showAxisLine: true,
  axisLineStyle: () => ({
    color: "rgba(0, 0, 0, 0.2)",
    width: 1,
    type: "solid",
  }),
  showIndicatorName: true,
  indicatorNameStyle: () => ({
    color: "#666",
    fontSize: 14,
    fontWeight: "normal",
  }),
  showSplitArea: true,
  splitAreaStyle: () => ({
    color: ["rgba(250, 250, 250, 0.3)", "rgba(200, 200, 200, 0.3)"],
  }),
  showTooltip: true,
  tooltipFormatter: undefined,
  showLabel: false,
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

// 构建 ECharts 配置
const buildOption = (): echarts.EChartsOption => {
  // 如果传入了 options，直接使用 options
  if (props.options) {
    return props.options;
  }

  const seriesData = props.series || [];
  const indicators = props.indicators || [];

  // 转换系列数据格式
  const echartsSeries: RadarSeriesOption[] = seriesData.map(
    (item: ChartRadarSeries, index: number) => {
      const seriesColor = item.color || props.colors[index % props.colors.length];

      return {
        name: item.name,
        type: "radar",
        data: [
          {
            value: item.data,
            name: item.name,
            itemStyle: {
              color: seriesColor,
            },
            areaStyle: item.areaStyle
              ? {
                  color: seriesColor,
                  opacity: item.areaOpacity || 0.3,
                }
              : undefined,
            lineStyle: {
              color: seriesColor,
              width: item.lineWidth || 2,
              type: item.lineType || "solid",
            },
            symbol: item.showSymbol !== false ? (item.symbol || "circle") : "none",
            symbolSize: item.symbolSize || 4,
            label: {
              show: props.showLabel,
            },
          },
        ],
      } as RadarSeriesOption;
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

  // 构建雷达图指示器配置
  const radarIndicator = indicators.map((indicator) => ({
    name: indicator.name,
    max: indicator.max,
    min: indicator.min || 0,
  }));

  const option: echarts.EChartsOption = {
    backgroundColor: props.backgroundColor,
    color: props.colors,
    legend: legendConfig,
    tooltip: props.showTooltip
      ? {
          trigger: "item",
          formatter: props.tooltipFormatter || ((params: any) => {
            if (Array.isArray(params)) {
              let result = `${params[0].name}<br/>`;
              params.forEach((item: any) => {
                result += `${item.seriesName}: ${item.value[item.dataIndex]}<br/>`;
              });
              return result;
            }
            return `${params.name}<br/>${params.seriesName}: ${params.value[params.dataIndex]}`;
          }),
        }
      : {
          show: false,
        },
    radar: {
      center: props.center,
      radius: props.radius,
      startAngle: props.startAngle,
      indicator: radarIndicator,
      splitNumber: 5,
      shape: "polygon",
      splitArea: props.showSplitArea
        ? {
            show: true,
            areaStyle: props.splitAreaStyle,
          }
        : {
            show: false,
          },
      splitLine: props.showSplitLine
        ? {
            show: true,
            lineStyle: props.splitLineStyle,
          }
        : {
            show: false,
          },
      axisLine: props.showAxisLine
        ? {
            show: true,
            lineStyle: props.axisLineStyle,
          }
        : {
            show: false,
          },
      axisName: props.showIndicatorName
        ? {
            show: true,
            formatter: (name?: string) => name || "",
            color: props.indicatorNameStyle?.color || "#666",
            fontSize: props.indicatorNameStyle?.fontSize || 14,
            fontWeight: props.indicatorNameStyle?.fontWeight || "normal",
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
    console.warn("ChartRadar: chartContainer is not available");
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
    console.error("ChartRadar initialization error:", error);
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
    console.error("ChartRadar update error:", error);
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
    props.indicators,
    props.colors,
    props.showLegend,
    props.legendPosition,
    props.backgroundColor,
    props.center,
    props.radius,
    props.startAngle,
    props.showSplitLine,
    props.splitLineStyle,
    props.showAxisLine,
    props.axisLineStyle,
    props.showIndicatorName,
    props.indicatorNameStyle,
    props.showSplitArea,
    props.splitAreaStyle,
    props.showTooltip,
    props.tooltipFormatter,
    props.showLabel,
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
.m-chart-radar {
  @apply w-full h-full;
}
</style>
