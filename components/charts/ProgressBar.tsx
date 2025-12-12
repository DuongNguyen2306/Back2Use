import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ProgressBarProps {
  value: number;
  maxValue: number;
  height?: number;
  color?: string;
  showLabel?: boolean;
  label?: string;
}

export default function ProgressBar({
  value,
  maxValue,
  height = 8,
  color = '#00704A',
  showLabel = true,
  label,
}: ProgressBarProps) {
  const percentage = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;

  return (
    <View style={styles.container}>
      {showLabel && (
        <Text style={styles.label}>{label || `${value} times`}</Text>
      )}
      <View style={[styles.track, { height }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${percentage}%`,
              height,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  track: {
    width: '100%',
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 4,
  },
});

