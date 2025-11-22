import { StyleSheet } from 'react-native';
import { Fonts } from './fonts';

// Global text styles with Poppins font
export const GlobalTextStyles = StyleSheet.create({
  // Headers
  h1: {
    fontFamily: Fonts.extraBold,
    fontSize: 32,
    lineHeight: 40,
  },
  h2: {
    fontFamily: Fonts.bold,
    fontSize: 24,
    lineHeight: 32,
  },
  h3: {
    fontFamily: Fonts.semiBold,
    fontSize: 20,
    lineHeight: 28,
  },
  h4: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
    lineHeight: 24,
  },
  
  // Body text
  body: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyBold: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    lineHeight: 24,
  },
  
  // Small text
  small: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  smallMedium: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  smallBold: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    lineHeight: 20,
  },
  
  // Caption
  caption: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  captionMedium: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  captionBold: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    lineHeight: 16,
  },
  
  // Button text
  button: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  buttonSmall: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
  },
});

// Default font family for all Text components
export const defaultTextStyle = {
  fontFamily: Fonts.regular,
};

