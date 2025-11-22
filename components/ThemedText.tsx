import { Text, type TextProps, StyleSheet } from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';
import { defaultTextStyle } from '@/constants';

type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? defaultTextStyle : styles[type],
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: defaultTextStyle,
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    ...defaultTextStyle,
  },
  defaultSemiBold: {
    fontSize: 16,
    fontWeight: '600',
    ...defaultTextStyle,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    ...defaultTextStyle,
  },
  link: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0a7ea4',
    ...defaultTextStyle,
  },
});