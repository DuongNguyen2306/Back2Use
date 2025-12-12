import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

interface SimpleBarChartProps {
  data: BarChartData[];
  maxValue?: number;
  height?: number;
  showValues?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_PADDING = 20;
const BAR_SPACING = 8;

export default function SimpleBarChart({ 
  data, 
  maxValue, 
  height = 200,
  showValues = true 
}: SimpleBarChartProps) {
  // Calculate max value if not provided
  const calculatedMax = maxValue || Math.max(...data.map(d => d.value), 1);
  const chartWidth = SCREEN_WIDTH - (CHART_PADDING * 2) - 40; // Account for padding
  const barWidth = (chartWidth - (BAR_SPACING * (data.length - 1))) / data.length;

  return (
    <View style={[styles.container, { height }]}>
      {/* Y-axis labels */}
      <View style={styles.yAxisContainer}>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const value = Math.round(calculatedMax * ratio);
          return (
            <Text key={ratio} style={styles.yAxisLabel}>
              {value}
            </Text>
          );
        })}
      </View>

      {/* Chart area */}
      <View style={styles.chartArea}>
        {/* Grid lines */}
        <View style={styles.gridContainer}>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <View
              key={index}
              style={[
                styles.gridLine,
                { bottom: `${ratio * 100}%` },
              ]}
            />
          ))}
        </View>

        {/* Bars */}
        <View style={styles.barsContainer}>
          {data.map((item, index) => {
            const barHeight = (item.value / calculatedMax) * (height - 60); // Account for labels
            const barColor = item.color || '#00704A';
            
            return (
              <View key={index} style={styles.barWrapper}>
                <View style={styles.barContainer}>
                  {showValues && item.value > 0 && (
                    <Text style={styles.barValue}>{item.value}</Text>
                  )}
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(barHeight, 4), // Minimum 4px height
                        width: barWidth,
                        backgroundColor: barColor,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel} numberOfLines={1}>
                  {item.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: CHART_PADDING,
    paddingVertical: 10,
  },
  yAxisContainer: {
    width: 30,
    justifyContent: 'space-between',
    paddingBottom: 30,
  },
  yAxisLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'right',
  },
  chartArea: {
    flex: 1,
    position: 'relative',
  },
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 30,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
    paddingBottom: 30,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: BAR_SPACING / 2,
  },
  barContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
  bar: {
    borderRadius: 4,
    marginBottom: 4,
  },
  barValue: {
    fontSize: 10,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  barLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
});

