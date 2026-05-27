<template>
  <div
    ref="chartContainer"
    class="m-chart-kline"
    :style="{ width: computedWidth, height: computedHeight, backgroundColor: backgroundColor }"
  ></div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import * as echarts from "echarts";
import type { CandlestickSeriesOption, BarSeriesOption } from "echarts";
import { useResizeObserver } from "@vueuse/core";
import type { ChartKLineProps, ChartKLineDataItem } from "./types";

defineOptions({
  name: "MChartKLine",
});

const props = withDefaults(defineProps<ChartKLineProps>(), {
  data: () => [
    { date: "2024-01-01", value: [100, 120, 95, 125], volume: 1000 },
    { date: "2024-01-02", value: [120, 110, 105, 125], volume: 1200 },
    { date: "2024-01-03", value: [110, 130, 108, 135], volume: 1500 },
    { date: "2024-01-04", value: [130, 125, 120, 135], volume: 1100 },
    { date: "2024-01-05", value: [125, 140, 122, 145], volume: 1800 },
  ],
  categories: () => [],
  showVolume: true,
  showLegend: false,
  legendPosition: "top",
  height: 400,
  width: "100%",
  backgroundColor: "transparent",
  showGrid: true,
  gridLineStyle: () => ({
    color: "rgba(0, 0, 0, 0.1)",
    width: 1,
    type: "dashed",
  }),
  showTooltip: true,
  tooltipFormatter: undefined,
  yAxisMin: undefined,
  yAxisMax: undefined,
  yAxisSplitNumber: 5,
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
  kLineColors: () => ({
    upColor: "#EC0000",
    downColor: "#00DA3C",
    borderColor: "#8A0000",
  }),
  volumeColors: () => ({
    upColor: "#EC0000",
    downColor: "#00DA3C",
  }),
  dataZoom: false,
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

  const data = props.data || [];
  const categories = props.categories && props.categories.length > 0 
    ? props.categories 
    : data.map((item) => item.date);

  // 转换 K 线数据格式
  const kLineData = data.map((item: ChartKLineDataItem) => item.value);

  // 转换成交量数据格式
  const volumeData = data.map((item: ChartKLineDataItem) => {
    const [open, close] = item.value;
    const isUp = close >= open;
    return {
      value: item.volume || 0,
      itemStyle: {
        color: isUp ? props.volumeColors.upColor : props.volumeColors.downColor,
      },
    };
  });

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

  // 构建数据缩放配置
  const dataZoomConfig = props.dataZoom
    ? [
        {
          type: typeof props.dataZoom === "object" && props.dataZoom.type ? props.dataZoom.type : "slider",
          show: typeof props.dataZoom === "object" ? props.dataZoom.show !== false : true,
          start: typeof props.dataZoom === "object" ? props.dataZoom.start : 0,
          end: typeof props.dataZoom === "object" ? props.dataZoom.end : 100,
          xAxisIndex: [0, 1], // 同时控制 K 线图和成交量图的 X 轴
        },
      ]
    : undefined;

  // 构建系列配置
  const series: (CandlestickSeriesOption | BarSeriesOption)[] = [
    {
      name: "K线",
      type: "candlestick",
      data: kLineData,
      itemStyle: {
        color: props.kLineColors.upColor,
        color0: props.kLineColors.downColor,
        borderColor: props.kLineColors.borderColor,
        borderColor0: props.kLineColors.borderColor,
      },
      animation: props.animation,
      animationDuration: props.animationDuration,
    } as CandlestickSeriesOption,
  ];

  // 如果显示成交量，添加成交量柱状图
  if (props.showVolume) {
    series.push({
      name: "成交量",
      type: "bar",
      data: volumeData,
      xAxisIndex: 1,
      yAxisIndex: 1,
      animation: props.animation,
      animationDuration: props.animationDuration,
    } as BarSeriesOption);
  }

  const option: echarts.EChartsOption = {
    backgroundColor: props.backgroundColor,
    legend: legendConfig,
    tooltip: props.showTooltip
      ? {
          trigger: "axis",
          axisPointer: {
            type: "cross",
          },
          formatter: props.tooltipFormatter || ((params: any) => {
            if (Array.isArray(params)) {
              const kLineParam = params.find((p: any) => p.seriesName === "K线");
              const volumeParam = params.find((p: any) => p.seriesName === "成交量");
              if (kLineParam) {
                const [open, close, low, high] = kLineParam.value;
                let result = `${kLineParam.axisValue}<br/>`;
                result += `开盘: ${open}<br/>`;
                result += `收盘: ${close}<br/>`;
                result += `最低: ${low}<br/>`;
                result += `最高: ${high}`;
                if (volumeParam) {
                  result += `<br/>成交量: ${volumeParam.value}`;
                }
                return result;
              }
            }
            return "";
          }),
        }
      : {
          show: false,
        },
    grid: props.showVolume
      ? [
          {
            left: props.grid?.left || "10%",
            right: props.grid?.right || "10%",
            top: props.grid?.top || "15%",
            bottom: props.grid?.bottom || "60%",
          },
          {
            left: props.grid?.left || "10%",
            right: props.grid?.right || "10%",
            top: props.grid?.top || "75%",
            bottom: props.grid?.bottom || "15%",
          },
        ]
      : [
          {
            left: props.grid?.left || "10%",
            right: props.grid?.right || "10%",
            top: props.grid?.top || "15%",
            bottom: props.grid?.bottom || "15%",
          },
        ],
    xAxis: (props.showVolume
      ? [
          {
            type: "category",
            data: categories,
            boundaryGap: false,
            axisLine: { onZero: false },
            splitLine: { show: false },
            splitNumber: 20,
            min: "dataMin",
            max: "dataMax",
            show: props.xAxis?.show !== false,
            axisLabel: props.xAxis?.axisLabel || {
              rotate: 0,
              interval: "auto",
            },
          },
          {
            type: "category",
            gridIndex: 1,
            data: categories,
            boundaryGap: false,
            axisLine: { onZero: false },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            splitNumber: 20,
            min: "dataMin",
            max: "dataMax",
          },
        ]
      : [
          {
            type: "category",
            data: categories,
            boundaryGap: false,
            axisLine: { onZero: false },
            splitLine: { show: false },
            splitNumber: 20,
            min: "dataMin",
            max: "dataMax",
            show: props.xAxis?.show !== false,
            axisLabel: props.xAxis?.axisLabel || {
              rotate: 0,
              interval: "auto",
            },
          },
        ]) as echarts.EChartsOption["xAxis"],
    yAxis: props.showVolume
      ? [
          {
            scale: true,
            splitArea: {
              show: true,
            },
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
          {
            scale: true,
            gridIndex: 1,
            splitNumber: 2,
            axisLabel: { show: false },
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { show: false },
          },
        ]
      : [
          {
            scale: true,
            splitArea: {
              show: true,
            },
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
        ] as echarts.EChartsOption["yAxis"],
    dataZoom: dataZoomConfig,
    series: series,
    animation: props.animation,
    animationDuration: props.animationDuration,
    animationEasing: "cubicOut",
  };

  return option;
};

// 初始化图表
const initChart = () => {
  if (!chartContainer.value) {
    console.warn("ChartKLine: chartContainer is not available");
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
    console.error("ChartKLine initialization error:", error);
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
    console.error("ChartKLine update error:", error);
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
    props.data,
    props.categories,
    props.showVolume,
    props.showLegend,
    props.legendPosition,
    props.backgroundColor,
    props.showGrid,
    props.gridLineStyle,
    props.showTooltip,
    props.tooltipFormatter,
    props.yAxisMin,
    props.yAxisMax,
    props.yAxisSplitNumber,
    props.grid,
    props.xAxis,
    props.yAxis,
    props.kLineColors,
    props.volumeColors,
    props.dataZoom,
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
.m-chart-kline {
  @apply w-full h-full;
}
</style>
