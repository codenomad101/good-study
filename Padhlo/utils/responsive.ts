import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 12/13/14)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// Responsive scaling functions
export const scaleWidth = (size: number): number => {
  return (SCREEN_WIDTH / BASE_WIDTH) * size;
};

export const scaleHeight = (size: number): number => {
  return (SCREEN_HEIGHT / BASE_HEIGHT) * size;
};

export const scaleFont = (size: number): number => {
  const scale = Math.min(SCREEN_WIDTH / BASE_WIDTH, SCREEN_HEIGHT / BASE_HEIGHT);
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Device type detection
export const isTablet = (): boolean => {
  return SCREEN_WIDTH >= 768;
};

export const isSmallScreen = (): boolean => {
  return SCREEN_WIDTH < 375;
};

export const isLargeScreen = (): boolean => {
  return SCREEN_WIDTH > 414;
};

// Responsive spacing
export const getResponsiveSpacing = (baseSpacing: number): number => {
  if (isSmallScreen()) {
    return baseSpacing * 0.8;
  } else if (isLargeScreen()) {
    return baseSpacing * 1.2;
  }
  return baseSpacing;
};

// Responsive font sizes
export const getResponsiveFontSize = (baseSize: number): number => {
  if (isSmallScreen()) {
    return baseSize * 0.9;
  } else if (isLargeScreen()) {
    return baseSize * 1.1;
  }
  return baseSize;
};

// Screen dimensions
export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT;

// Common responsive values
export const responsiveValues = {
  padding: {
    small: scaleWidth(8),
    medium: scaleWidth(16),
    large: scaleWidth(24),
    xlarge: scaleWidth(32),
  },
  margin: {
    small: scaleHeight(8),
    medium: scaleHeight(16),
    large: scaleHeight(24),
    xlarge: scaleHeight(32),
  },
  fontSize: {
    xs: scaleFont(12),
    sm: scaleFont(14),
    small: scaleFont(14),
    base: scaleFont(16),
    medium: scaleFont(16),
    lg: scaleFont(18),
    large: scaleFont(18),
    xl: scaleFont(20),
    xlarge: scaleFont(20),
    '2xl': scaleFont(24),
    '3xl': scaleFont(28),
    '4xl': scaleFont(32),
  },
  borderRadius: {
    small: scaleWidth(4),
    medium: scaleWidth(8),
    large: scaleWidth(12),
    xlarge: scaleWidth(16),
  },
};
