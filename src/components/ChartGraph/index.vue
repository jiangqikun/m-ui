<template>
  <div
    ref="chartContainer"
    class="m-chart-graph"
    :style="{ width: computedWidth, height: computedHeight, backgroundColor: backgroundColor }"
  ></div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import * as echarts from "echarts";
import type { GraphSeriesOption } from "echarts";
import { useResizeObserver } from "@vueuse/core";
import type { ChartGraphProps, ChartGraphNode, ChartGraphLink } from "./types";

defineOptions({
  name: "MChartGraph",
});

const props = withDefaults(defineProps<ChartGraphProps>(), {
  nodes: () => [
    { name: "节点1", value: 1 },
    { name: "节点2", value: 2 },
    { name: "节点3", value: 3 },
  ],
  links: () => [
    { source: "节点1", target: "节点2" },
    { source: "节点2", target: "节点3" },
  ],
  categories: () => [],
  layout: "force",
  forceLayout: true,
  forceConfig: () => ({
    repulsion: 50,
    gravity: 0.1,
    edgeLength: 30,
    layoutIterations: 50,
  }),
  showLabel: true,
  labelFontSize: 12,
  showLegend: false,
  legendPosition: "top",
  height: "400px",
  width: "100%",
  backgroundColor: "transparent",
  draggable: true,
  roam: false,
  nodeSize: 20,
  nodeColor: "#5470C6",
  linkColor: "#91CC75",
  linkWidth: 1,
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

  const nodes = props.nodes || [];
  const links = props.links || [];
  const categories = props.categories || [];

  // 转换节点数据
  const seriesNodes = nodes.map((node: ChartGraphNode) => ({
    name: node.name,
    value: node.value,
    category: node.category,
    x: node.x,
    y: node.y,
    symbolSize: node.symbolSize || (typeof props.nodeSize === "number" ? props.nodeSize : props.nodeSize[0]),
    itemStyle: node.itemStyle || {
      color: props.nodeColor,
    },
    label: node.label !== undefined
      ? node.label
      : {
          show: props.showLabel,
          fontSize: props.labelFontSize,
        },
  }));

  // 转换边数据
  const seriesLinks = links.map((link: ChartGraphLink) => ({
    source: link.source,
    target: link.target,
    value: link.value,
    lineStyle: link.lineStyle || {
      color: props.linkColor,
      width: props.linkWidth,
    },
    label: link.label,
  }));

  // 构建图例配置
  const legendConfig = props.showLegend && categories.length > 0
    ? {
        show: true,
        data: categories.map((cat) => cat.name),
        orient: (props.legendPosition === "left" || props.legendPosition === "right" ? "vertical" : "horizontal") as "vertical" | "horizontal",
        left: props.legendPosition === "left" ? "left" : props.legendPosition === "right" ? "right" : "center",
        top: props.legendPosition === "top" ? "top" : props.legendPosition === "bottom" ? "bottom" : "middle",
      }
    : {
        show: false,
      };

  // 构建力引导布局配置
  const forceConfig = props.forceLayout && props.layout === "force"
    ? {
        layout: "force" as const,
        force: {
          repulsion: props.forceConfig?.repulsion || 50,
          gravity: props.forceConfig?.gravity || 0.1,
          edgeLength: props.forceConfig?.edgeLength || 30,
          layoutIterations: props.forceConfig?.layoutIterations || 50,
        },
      }
    : {
        layout: props.layout as "none" | "circular" | "force",
      };

  const option: echarts.EChartsOption = {
    backgroundColor: props.backgroundColor,
    legend: legendConfig,
    tooltip: {
      trigger: "item",
      formatter: (params: any) => {
        if (params.dataType === "node") {
          return `${params.data.name}<br/>${params.data.value ? `值: ${params.data.value}` : ""}`;
        } else if (params.dataType === "edge") {
          return `${params.data.source} → ${params.data.target}`;
        }
        return "";
      },
    },
    series: [
      {
        type: "graph",
        layout: forceConfig.layout,
        ...(forceConfig.force ? { force: forceConfig.force } : {}),
        data: seriesNodes,
        links: seriesLinks,
        categories: categories.map((cat) => ({
          name: cat.name,
          itemStyle: cat.itemStyle || {},
        })),
        roam: props.roam,
        draggable: props.draggable,
        focusNodeAdjacency: true,
        lineStyle: {
          color: props.linkColor,
          width: props.linkWidth,
          curveness: 0,
        },
        emphasis: {
          focus: "adjacency",
          lineStyle: {
            width: 4,
          },
        },
        animation: props.animation,
        animationDuration: props.animationDuration,
        animationEasing: "cubicOut",
      } as GraphSeriesOption,
    ],
  };

  return option;
};

// 初始化图表
const initChart = () => {
  if (!chartContainer.value) {
    console.warn("ChartGraph: chartContainer is not available");
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
    console.error("ChartGraph initialization error:", error);
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
    console.error("ChartGraph update error:", error);
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
    props.nodes,
    props.links,
    props.categories,
    props.layout,
    props.forceLayout,
    props.forceConfig,
    props.showLabel,
    props.labelFontSize,
    props.showLegend,
    props.legendPosition,
    props.backgroundColor,
    props.draggable,
    props.roam,
    props.nodeSize,
    props.nodeColor,
    props.linkColor,
    props.linkWidth,
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
.m-chart-graph {
  @apply w-full h-full;
}
</style>
