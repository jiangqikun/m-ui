<template>
  <div
    ref="chartContainer"
    :class="['m-chart-map-cq-3d']"
    :style="{
      width: computedWidth,
      height: computedHeight,
      backgroundColor: backgroundColor,
    }"
  ></div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import * as echarts from "echarts";
import "echarts-gl";
import { useResizeObserver } from "@vueuse/core";
import type { ChartMapCq3DProps, ChartMapCq3DDataItem, ChartMapCq3DRange } from "./types";

defineOptions({
  name: "MChartMapCq3D",
});

// 默认颜色范围（序时进度）
const defaultRangesConfig: ChartMapCq3DRange[] = [
  { min: -Infinity, max: -9, color: "#FF4D4F", label: "<-10" },
  { min: -10, max: 0, color: "#FF7A45", label: "-10 ~ 0" },
  { min: 1, max: 10, color: "#FFD666", label: "1 ~ 10" },
  { min: 11, max: 50, color: "#1890FF", label: "11 ~ 50" },
  { min: 51, max: Infinity, color: "#52C41A", label: ">50" },
];

const props = withDefaults(defineProps<ChartMapCq3DProps>(), {
  data: () => [],
  geoJson: undefined,
  mapName: "chongqing",
  ranges: undefined,
  defaultRanges: true,
  showLabel: true,
  labelStyle: () => ({
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "normal",
  }),
  showLegend: true,
  legendPosition: "right",
  legendTitle: "序时进度",
  height: 600,
  width: "100%",
  backgroundColor: "transparent",
  areaStyle: () => ({
    areaColor: "#5b9bd5",
    borderColor: "#fff",
    borderWidth: 1,
  }),
  emphasis: () => ({
    areaColor: "#ffff00",
    borderColor: "#fff",
    borderWidth: 2,
  }),
  showTooltip: true,
  tooltipFormatter: undefined,
  roam: true,
  heightScale: 0.1,
  minHeight: 0,
  maxHeight: 100,
  light: () => ({
    main: {
      intensity: 1,
      shadow: true,
    },
    ambient: {
      intensity: 0.3,
    },
  }),
  viewControl: () => ({
    alpha: 35,
    beta: 0,
    distance: 100,
    minDistance: 40,
    maxDistance: 200,
    rotateSensitivity: 1,
    zoomSensitivity: 1,
    panSensitivity: 1,
    autoRotate: false,
    autoRotateDirection: "cw",
    autoRotateSpeed: 10,
  }),
});

const chartContainer = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;
let mapRegistered = false;
const defaultGeoJson = ref<any>(null);
const isLoadingGeoJson = ref(false);
const debugLog = (..._args: unknown[]) => {};

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

// 获取颜色范围配置
const ranges = computed(() => {
  if (props.ranges && props.ranges.length > 0) {
    return props.ranges;
  }
  if (props.defaultRanges) {
    return defaultRangesConfig;
  }
  return [];
});

// 根据值获取颜色
const getColorByValue = (value: number): string => {
  const rangeList = ranges.value;
  for (let i = 0; i < rangeList.length; i++) {
    const range = rangeList[i];
    const isLast = i === rangeList.length - 1;
    if (value >= range.min && (isLast ? value <= range.max : value < range.max)) {
      return range.color;
    }
  }
  // 默认颜色
  return "#CCCCCC";
};

// 根据值计算高度
const getHeightByValue = (value: number): number => {
  if (value === undefined || value === null || typeof value !== "number") {
    return props.minHeight || 0;
  }

  // 计算数据范围
  const dataValues = props.data?.map((item: ChartMapCq3DDataItem) => item.value).filter((v: any) => typeof v === "number") || [];
  const minValue = dataValues.length > 0 ? Math.min(...dataValues) : 0;
  const maxValue = dataValues.length > 0 ? Math.max(...dataValues) : 100;

  // 如果所有值相同，返回最小高度
  if (minValue === maxValue) {
    return props.minHeight || 0;
  }

  // 归一化到 0-1
  const normalized = (value - minValue) / (maxValue - minValue);
  
  // 映射到高度范围
  const minH = props.minHeight || 0;
  const maxH = props.maxHeight || 100;
  const height = minH + normalized * (maxH - minH);
  
  // 应用高度缩放
  return height * (props.heightScale || 0.1);
};

// 加载默认GeoJSON数据
const loadDefaultGeoJson = async (): Promise<any> => {
  if (defaultGeoJson.value) {
    return defaultGeoJson.value;
  }

  if (isLoadingGeoJson.value) {
    // 如果正在加载，等待加载完成
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (defaultGeoJson.value) {
          clearInterval(checkInterval);
          resolve(defaultGeoJson.value);
        }
      }, 100);
    });
  }

  isLoadingGeoJson.value = true;

  try {
    // 方式1：尝试从本地文件加载（如果文件存在）
    try {
      const localResponse = await fetch("/src/assets/geo/chongqing.json");
      if (localResponse.ok) {
        const localGeoJson = await localResponse.json();
        defaultGeoJson.value = localGeoJson;
        isLoadingGeoJson.value = false;
        return localGeoJson;
      }
    } catch (localError) {
      // 本地文件不存在，继续尝试从API加载
      debugLog("本地GeoJSON文件不存在，尝试从阿里云API加载...");
    }

    // 方式2：从阿里云DataV API加载
    const response = await fetch(
      "https://geo.datav.aliyun.com/areas_v3/bound/500000_full.json"
    );
    if (response.ok) {
      const geoData = await response.json();
      defaultGeoJson.value = geoData;
      isLoadingGeoJson.value = false;
      return geoData;
    } else {
      throw new Error("无法从阿里云API加载地图数据");
    }
  } catch (error) {
    isLoadingGeoJson.value = false;
    console.error("ChartMapCq3D: 加载默认GeoJSON数据失败", error);
    console.warn("ChartMapCq3D: 请提供geoJson属性或确保网络连接正常");
    return null;
  }
};

// 注册地图
const registerMap = async () => {
  if (mapRegistered) {
    return;
  }

  try {
    // 如果提供了geoJson，直接注册
    if (props.geoJson) {
      echarts.registerMap(props.mapName, props.geoJson);
      mapRegistered = true;
      return;
    }

    // 否则尝试加载默认GeoJSON数据
    const geoData = await loadDefaultGeoJson();
    if (geoData) {
      echarts.registerMap(props.mapName, geoData);
      mapRegistered = true;
      return;
    }

    // 如果都失败了，尝试检查是否已经注册过
    mapRegistered = true;
  } catch (error) {
    console.warn("ChartMapCq3D: 地图注册失败，请确保已提供geoJson或已注册地图", error);
  }
};

// 构建 ECharts 配置
const buildOption = (): echarts.EChartsOption => {
  // 转换数据格式，应用颜色和高度
  const seriesData = (props.data || []).map((item: ChartMapCq3DDataItem) => {
    // 如果有自定义颜色，直接使用；否则根据数据值计算颜色
    let color = props.areaStyle?.areaColor || "#5b9bd5"; // 默认颜色
    if (item.color) {
      color = item.color;
    } else if (
      item.value !== undefined &&
      item.value !== null &&
      typeof item.value === "number"
    ) {
      color = getColorByValue(item.value);
    }

    // 计算高度
    let height = props.minHeight || 0;
    if (item.height !== undefined && item.height !== null) {
      height = item.height * (props.heightScale || 0.1);
    } else if (
      item.value !== undefined &&
      item.value !== null &&
      typeof item.value === "number"
    ) {
      height = getHeightByValue(item.value);
    }

    return {
      name: item.name,
      value: item.value,
      height: height,
      itemStyle: {
        color: color,
        borderColor: props.areaStyle?.borderColor || "#fff",
        borderWidth: props.areaStyle?.borderWidth || 1,
      },
      emphasis: {
        itemStyle: {
          color: props.emphasis?.areaColor || "#ffff00",
          borderColor: props.emphasis?.borderColor || "#fff",
          borderWidth: props.emphasis?.borderWidth || 2,
        },
      },
      label: {
        show: props.showLabel,
        fontSize: props.labelStyle?.fontSize || 10,
        fontWeight: props.labelStyle?.fontWeight || "normal",
        color: props.labelStyle?.color || "#ffffff",
      },
    };
  });

  // 图例配置
  const legendGraphic =
    props.showLegend && ranges.value.length > 0
      ? (() => {
          const isVertical =
            props.legendPosition === "left" || props.legendPosition === "right";
          const itemHeight = 20;
          const itemGap = 8;
          const iconSize = 14;
          const padding = 15;
          const textGap = 6;
          const fontSize = 12;

          // 估算每个图例项的宽度（图标 + 间距 + 文字）
          const estimateTextWidth = (text: string) => text.length * fontSize * 0.6;
          const maxTextWidth = Math.max(
            ...ranges.value.map((r: ChartMapCq3DRange) => estimateTextWidth(r.label))
          );
          const itemWidth = iconSize + textGap + maxTextWidth;

          // 计算总尺寸
          const totalWidth = isVertical
            ? itemWidth
            : ranges.value.length * (itemWidth + itemGap) - itemGap;
          const totalHeight = isVertical
            ? ranges.value.length * (itemHeight + itemGap) - itemGap
            : itemHeight;

          // 计算位置和偏移
          let left: string | number | undefined = undefined;
          let right: string | number | undefined = undefined;
          let top: string | number | undefined = undefined;
          let bottom: string | number | undefined = undefined;
          let offsetX = 0;
          let offsetY = 0;

          if (props.legendPosition === "left") {
            left = padding;
            top = "50%";
            offsetY = -totalHeight / 2;
          } else if (props.legendPosition === "right") {
            right = padding;
            top = "50%";
            offsetX = 0;
            offsetY = -totalHeight / 2;
          } else if (props.legendPosition === "top") {
            left = "50%";
            top = padding;
            offsetX = -totalWidth / 2;
          } else {
            // bottom
            left = "50%";
            bottom = padding;
            offsetX = -totalWidth / 2;
            offsetY = 0;
          }

          const children: any[] = [];
          ranges.value.forEach((range: ChartMapCq3DRange, index: number) => {
            const y = isVertical ? index * (itemHeight + itemGap) + offsetY : offsetY;
            const x = isVertical ? offsetX : index * (itemWidth + itemGap) + offsetX;

            const centerY = y + itemHeight / 2;
            const rectTop = centerY - iconSize / 2;

            // 颜色块
            children.push({
              type: "rect",
              left: x,
              top: rectTop,
              shape: {
                width: iconSize,
                height: iconSize,
                r: 2,
              },
              style: {
                fill: range.color,
                stroke: "#fff",
                lineWidth: 1,
              },
            });

            // 文字标签
            children.push({
              type: "text",
              left: x + iconSize + textGap,
              top: centerY - 5,
              style: {
                text: range.label,
                fill: "#333",
                fontSize: fontSize,
                textAlign: "left",
                textVerticalAlign: "middle",
              },
            });
          });

          const groupConfig: any = {
            type: "group",
            children,
          };

          if (left !== undefined) {
            groupConfig.left = typeof left === "string" ? left : `${left}px`;
          }
          if (right !== undefined) {
            groupConfig.right = typeof right === "string" ? right : `${right}px`;
          }
          if (top !== undefined) {
            groupConfig.top = typeof top === "string" ? top : `${top}px`;
          }
          if (bottom !== undefined) {
            groupConfig.bottom = typeof bottom === "string" ? bottom : `${bottom}px`;
          }

          return groupConfig;
        })()
      : null;

  const option: echarts.EChartsOption = {
    backgroundColor: props.backgroundColor,
    tooltip: props.showTooltip
      ? {
          trigger: "item",
          formatter:
            props.tooltipFormatter ||
            ((params: any) => {
              const name = params.name || "";
              const value = params.value !== undefined ? params.value : "";
              return `${name}<br/>${value}`;
            }),
        }
      : {
          show: false,
        },
    geo3D: {
      map: props.mapName,
      roam: props.roam,
      boxHeight: 0,
      regionHeight: (params: any) => {
        const dataItem = seriesData.find((item: any) => item.name === params.name);
        return dataItem?.height || props.minHeight || 0;
      },
      itemStyle: {
        color: (params: any) => {
          const dataItem = seriesData.find((item: any) => item.name === params.name);
          return dataItem?.itemStyle?.color || props.areaStyle?.areaColor || "#5b9bd5";
        },
        borderColor: props.areaStyle?.borderColor || "#fff",
        borderWidth: props.areaStyle?.borderWidth || 1,
        opacity: 0.8,
      },
      emphasis: {
        itemStyle: {
          color: (params: any) => {
            const dataItem = seriesData.find((item: any) => item.name === params.name);
            return dataItem?.emphasis?.itemStyle?.color || props.emphasis?.areaColor || "#ffff00";
          },
          borderColor: props.emphasis?.borderColor || "#fff",
          borderWidth: props.emphasis?.borderWidth || 2,
        },
      },
      label: {
        show: props.showLabel,
        fontSize: props.labelStyle?.fontSize || 10,
        fontWeight: props.labelStyle?.fontWeight || "normal",
        color: props.labelStyle?.color || "#ffffff",
      },
      light: {
        main: {
          intensity: props.light?.main?.intensity || 1,
          shadow: props.light?.main?.shadow !== false,
        },
        ambient: {
          intensity: props.light?.ambient?.intensity || 0.3,
        },
      },
      viewControl: {
        alpha: props.viewControl?.alpha ?? 35,
        beta: props.viewControl?.beta ?? 0,
        distance: props.viewControl?.distance ?? 100,
        minDistance: props.viewControl?.minDistance ?? 40,
        maxDistance: props.viewControl?.maxDistance ?? 200,
        rotateSensitivity: props.viewControl?.rotateSensitivity ?? 1,
        zoomSensitivity: props.viewControl?.zoomSensitivity ?? 1,
        panSensitivity: props.viewControl?.panSensitivity ?? 1,
        autoRotate: props.viewControl?.autoRotate || false,
        autoRotateDirection: props.viewControl?.autoRotateDirection || "cw",
        autoRotateSpeed: props.viewControl?.autoRotateSpeed || 10,
      },
    },
    series: [
      {
        type: "map3D",
        map: props.mapName,
        data: seriesData,
        itemStyle: {
          color: (params: any) => {
            const dataItem = seriesData.find((item: any) => item.name === params.name);
            return dataItem?.itemStyle?.color || props.areaStyle?.areaColor || "#5b9bd5";
          },
          borderColor: props.areaStyle?.borderColor || "#fff",
          borderWidth: props.areaStyle?.borderWidth || 1,
          opacity: 0.8,
        },
        emphasis: {
          itemStyle: {
            color: (params: any) => {
              const dataItem = seriesData.find((item: any) => item.name === params.name);
              return dataItem?.emphasis?.itemStyle?.color || props.emphasis?.areaColor || "#ffff00";
            },
            borderColor: props.emphasis?.borderColor || "#fff",
            borderWidth: props.emphasis?.borderWidth || 2,
          },
        },
        label: {
          show: props.showLabel,
          fontSize: props.labelStyle?.fontSize || 10,
          fontWeight: props.labelStyle?.fontWeight || "normal",
          color: props.labelStyle?.color || "#ffffff",
        },
      },
    ] as any,
    graphic: legendGraphic ? [legendGraphic] : [],
  };

  return option;
};

// 初始化图表
const initChart = async () => {
  if (!chartContainer.value) {
    console.warn("ChartMapCq3D: chartContainer is not available");
    return;
  }

  try {
    // 注册地图（异步）
    await registerMap();

    // 如果已经存在实例，先销毁
    if (chartInstance) {
      chartInstance.dispose();
      chartInstance = null;
    }

    chartInstance = echarts.init(chartContainer.value);
    const option = buildOption();
    chartInstance.setOption(option);
  } catch (error) {
    console.error("ChartMapCq3D initialization error:", error);
  }
};

// 更新图表
const updateChart = () => {
  if (!chartInstance) {
    initChart();
    return;
  }
  try {
    const option = buildOption();
    chartInstance.setOption(option, true);
  } catch (error) {
    console.error("ChartMapCq3D update error:", error);
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
  nextTick(() => {
    initChart();
  });
});

// 监听数据变化
watch(
  () => [
    props.data,
    props.geoJson,
    props.ranges,
    props.showLabel,
    props.showLegend,
    props.legendPosition,
    props.backgroundColor,
    props.areaStyle,
    props.emphasis,
    props.roam,
    props.heightScale,
    props.minHeight,
    props.maxHeight,
    props.light,
    props.viewControl,
  ],
  async () => {
    // 如果geoJson变化，需要重新注册地图
    if (props.geoJson !== undefined) {
      mapRegistered = false;
      defaultGeoJson.value = null;
      await registerMap();
    }
    updateChart();
  },
  { deep: true }
);

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
});
</script>

<style lang="scss" scoped>
.m-chart-map-cq-3d {
  width: 100%;
  height: 100%;
}
</style>
