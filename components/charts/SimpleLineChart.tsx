import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

interface LineChartData {
  label: string;
  value: number;
}

interface LineDataset {
  data: LineChartData[];
  color: string;
  label?: string;
}

interface SimpleLineChartProps {
  data?: LineChartData[]; // Optional when using datasets
  datasets?: LineDataset[]; // For multiple lines (e.g., Income and Expenses)
  maxValue?: number;
  height?: number;
  lineColor?: string;
  showDots?: boolean;
  showGrid?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_PADDING = 20;
const CHART_HEIGHT = 150;

export default function SimpleLineChart({
  data,
  datasets,
  maxValue,
  height = CHART_HEIGHT,
  lineColor = '#00704A',
  showDots = true,
  showGrid = true,
}: SimpleLineChartProps) {
  // Support both single line (data) and multiple lines (datasets)
  const hasDatasets = datasets && datasets.length > 0;
  const singleData = !hasDatasets ? data : null;
  
  if (!hasDatasets && (!singleData || singleData.length === 0)) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  // Calculate max value across all datasets
  let calculatedMax = maxValue;
  if (!calculatedMax) {
    if (hasDatasets) {
      const allValues = datasets.flatMap(ds => ds.data.map(d => d.value));
      calculatedMax = Math.max(...allValues, 1);
    } else {
      calculatedMax = Math.max(...singleData!.map(d => d.value), 1);
    }
  }

  const chartWidth = SCREEN_WIDTH - (CHART_PADDING * 2) - 40;
  const chartHeight = height - 40;
  
  // Use first dataset or single data for labels and spacing
  const labelData = hasDatasets ? datasets[0].data : singleData!;
  const pointSpacing = chartWidth / (labelData.length - 1 || 1);

  // Calculate points for each dataset
  const allPoints = hasDatasets
    ? datasets.map(dataset => 
        dataset.data.map((item, index) => {
          const x = index * pointSpacing;
          const y = chartHeight - (item.value / calculatedMax) * chartHeight;
          return { x, y, value: item.value, label: item.label, color: dataset.color };
        })
      )
    : [singleData!.map((item, index) => {
        const x = index * pointSpacing;
        const y = chartHeight - (item.value / calculatedMax) * chartHeight;
        return { x, y, value: item.value, label: item.label, color: lineColor };
      })];

  return (
    <View style={[styles.container, { height }]}>
      <View style={[styles.chartArea, { height: chartHeight, width: chartWidth }]}>
        {/* Grid lines */}
        {showGrid && [0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
          const y = (ratio * chartHeight);
          return (
            <View
              key={index}
              style={[
                styles.gridLine,
                {
                  top: y,
                  width: chartWidth,
                },
              ]}
            />
          );
        })}

        {/* Simplified line visualization using connected dots - render each dataset */}
        <View style={styles.lineContainer}>
          {allPoints.map((points, datasetIndex) => (
            <React.Fragment key={datasetIndex}>
              {points.map((point, index) => {
                if (index === 0) return null;
                const prevPoint = points[index - 1];
                const distance = Math.sqrt(
                  Math.pow(point.x - prevPoint.x, 2) + Math.pow(point.y - prevPoint.y, 2)
                );
                
                return (
                  <View
                    key={`line-${datasetIndex}-${index}`}
                    style={[
                      styles.lineSegment,
                      {
                        left: prevPoint.x,
                        top: prevPoint.y,
                        width: distance,
                        height: 3,
                        backgroundColor: point.color,
                        transform: [
                          { 
                            rotate: `${Math.atan2(point.y - prevPoint.y, point.x - prevPoint.x) * (180 / Math.PI)}deg` 
                          }
                        ],
                      },
                    ]}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </View>

        {/* Dots - render for each dataset */}
        {showDots && allPoints.map((points, datasetIndex) => (
          <React.Fragment key={`dots-${datasetIndex}`}>
            {points.map((point, index) => (
              <View
                key={`dot-${datasetIndex}-${index}`}
                style={[
                  styles.dot,
                  {
                    left: point.x - 4,
                    top: point.y - 4,
                    backgroundColor: point.color,
                  },
                ]}
              />
            ))}
          </React.Fragment>
        ))}
      </View>

      {/* X-axis labels */}
      <View style={styles.xAxisContainer}>
        {labelData.map((item, index) => (
          <Text key={index} style={styles.xAxisLabel} numberOfLines={1}>
            {item.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: CHART_PADDING,
    paddingVertical: 10,
  },
  chartArea: {
    position: 'relative',
    marginBottom: 20,
  },
  gridLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  lineContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  lineSegment: {
    position: 'absolute',
    transformOrigin: 'left center',
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  xAxisContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  xAxisLabel: {
    fontSize: 10,
    color: '#6B7280',
    flex: 1,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 50,
  },
});

