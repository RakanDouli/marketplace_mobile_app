/**
 * Loading Component
 * Animated loading indicator with two types:
 * - Default: Three-dot pulsating animation
 * - SVG: Brand icon with draw/reveal animation
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../theme';

// Create animated path component
const AnimatedPath = Animated.createAnimatedComponent(Path);

interface LoadingProps {
  /** Loading type - default is dots, set to "svg" for brand icon animation */
  type?: 'dots' | 'svg';
  /** Size of the loader */
  size?: 'sm' | 'md' | 'lg';
  /** Custom color (defaults to primary) */
  color?: string;
  /** Additional styles */
  style?: ViewStyle;
}

// Size configurations
const SIZE_CONFIG = {
  sm: { dotSize: 4, gap: 3, svgHeight: 24 },
  md: { dotSize: 6, gap: 4, svgHeight: 40 },
  lg: { dotSize: 8, gap: 5, svgHeight: 60 },
};

// Animated dot component
const AnimatedDot: React.FC<{
  size: number;
  color: string;
  delay: number;
}> = ({ size, color, delay }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.5, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};

// Three-dot loading animation
const DotsLoading: React.FC<{
  size: 'sm' | 'md' | 'lg';
  color: string;
}> = ({ size, color }) => {
  const config = SIZE_CONFIG[size];

  return (
    <View style={[styles.dotsContainer, { gap: config.gap }]}>
      <AnimatedDot size={config.dotSize} color={color} delay={0} />
      <AnimatedDot size={config.dotSize} color={color} delay={160} />
      <AnimatedDot size={config.dotSize} color={color} delay={320} />
    </View>
  );
};

// SVG Brand Icon Loading Animation
const BrandIconLoading: React.FC<{
  size: 'sm' | 'md' | 'lg';
  color: string;
}> = ({ size, color }) => {
  const config = SIZE_CONFIG[size];
  const strokeWidth = size === 'sm' ? 1.5 : 2;
  const pathLength = 500;
  const animationDuration = 3000;

  // Shared values for each path's stroke dash offset
  const path1Offset = useSharedValue(pathLength);
  const path2Offset = useSharedValue(pathLength);
  const path3Offset = useSharedValue(pathLength);
  const path4Offset = useSharedValue(pathLength);
  const path5Offset = useSharedValue(pathLength);
  const path6Offset = useSharedValue(pathLength);

  useEffect(() => {
    // Animation sequence: draw in, hold, draw out
    const createAnimation = (delay: number) =>
      withDelay(
        delay,
        withRepeat(
          withSequence(
            // Draw in (0 to 40% of cycle)
            withTiming(0, {
              duration: animationDuration * 0.4,
              easing: Easing.inOut(Easing.ease),
            }),
            // Hold (40% to 60% of cycle)
            withTiming(0, {
              duration: animationDuration * 0.2,
              easing: Easing.linear,
            }),
            // Draw out (60% to 100% of cycle)
            withTiming(pathLength, {
              duration: animationDuration * 0.4,
              easing: Easing.inOut(Easing.ease),
            })
          ),
          -1,
          false
        )
      );

    // Wave bottom-to-top: path6 → path1 → path4 → path3 → path2 → path5
    path6Offset.value = createAnimation(0);
    path1Offset.value = createAnimation(300);
    path4Offset.value = createAnimation(600);
    path3Offset.value = createAnimation(900);
    path2Offset.value = createAnimation(1200);
    path5Offset.value = createAnimation(1500);
  }, []);

  // Animated styles for each path
  const animatedProps1 = useAnimatedStyle(() => ({
    strokeDashoffset: path1Offset.value,
  }));
  const animatedProps2 = useAnimatedStyle(() => ({
    strokeDashoffset: path2Offset.value,
  }));
  const animatedProps3 = useAnimatedStyle(() => ({
    strokeDashoffset: path3Offset.value,
  }));
  const animatedProps4 = useAnimatedStyle(() => ({
    strokeDashoffset: path4Offset.value,
  }));
  const animatedProps5 = useAnimatedStyle(() => ({
    strokeDashoffset: path5Offset.value,
  }));
  const animatedProps6 = useAnimatedStyle(() => ({
    strokeDashoffset: path6Offset.value,
  }));

  // Calculate width based on aspect ratio (60/148)
  const svgWidth = (config.svgHeight * 60) / 148;

  return (
    <View style={styles.svgContainer}>
      <Svg
        width={svgWidth}
        height={config.svgHeight}
        viewBox="0 0 60 148"
        fill="none"
      >
        {/* Bottom large shape - path1 */}
        <AnimatedPath
          d="M10.5635 85.3328L54.6858 69.2543C57.5764 68.201 59.5 65.4527 59.5 62.3762C59.5 57.317 54.4908 53.7829 49.7246 55.4794L5.48291 71.2264C2.49533 72.2898 0.5 75.1179 0.5 78.2891C0.5 83.4938 5.67343 87.1148 10.5635 85.3328Z"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={pathLength}
          animatedProps={animatedProps1}
        />
        {/* Top bar - path2 */}
        <AnimatedPath
          d="M24.2609 22.6615L56.152 11.631C58.1558 10.9379 59.5 9.05069 59.5 6.93037C59.5 3.52696 56.1586 1.12886 52.9342 2.21818L20.9645 13.0187C18.8939 13.7183 17.5 15.6605 17.5 17.8461C17.5 21.3481 20.9513 23.8063 24.2609 22.6615Z"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={pathLength}
          animatedProps={animatedProps2}
        />
        {/* Second bar - path3 */}
        <AnimatedPath
          d="M24.2609 39.6615L56.152 28.631C58.1558 27.9379 59.5 26.0507 59.5 23.9304C59.5 20.527 56.1586 18.1289 52.9342 19.2182L20.9645 30.0187C18.8939 30.7183 17.5 32.6605 17.5 34.8461C17.5 38.3481 20.9513 40.8063 24.2609 39.6615Z"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={pathLength}
          animatedProps={animatedProps3}
        />
        {/* Third bar - path4 */}
        <AnimatedPath
          d="M24.2609 56.6615L56.152 45.631C58.1558 44.9379 59.5 43.0507 59.5 40.9304C59.5 37.527 56.1586 35.1289 52.9342 36.2182L20.9645 47.0187C18.8939 47.7183 17.5 49.6605 17.5 51.8461C17.5 55.3481 20.9513 57.8063 24.2609 56.6615Z"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={pathLength}
          animatedProps={animatedProps4}
        />
        {/* Left vertical bar - path5 */}
        <AnimatedPath
          d="M11.5 57.035V23.2009C11.5 19.5743 8.05162 16.9405 4.55285 17.8947C2.16002 18.5473 0.5 20.7206 0.5 23.2009V57.035C0.5 60.7408 4.09035 63.3861 7.62972 62.288C9.93129 61.574 11.5 59.4448 11.5 57.035Z"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={pathLength}
          animatedProps={animatedProps5}
        />
        {/* Bottom circle with hole - path6 */}
        <AnimatedPath
          d="M49.7246 78.4792C54.4908 76.7829 59.5 80.3176 59.5 85.3767C59.4998 88.4531 57.576 91.2013 54.6855 92.2546L47.6104 94.8318C54.8262 100.209 59.4999 108.809 59.5 118.5C59.5 134.792 46.2924 148 30 148C13.7076 148 0.5 134.792 0.5 118.5C0.500045 114.342 1.36183 110.385 2.91406 106.798C1.44819 105.45 0.5 103.515 0.5 101.289C0.500167 98.1179 2.49517 95.2898 5.48242 94.2263L49.7246 78.4792ZM29.5 103C21.2158 103 14.5002 109.716 14.5 118C14.5 126.284 21.2157 133 29.5 133C37.7843 133 44.5 126.284 44.5 118C44.4998 109.716 37.7842 103 29.5 103Z"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          fillRule="evenodd"
          clipRule="evenodd"
          strokeDasharray={pathLength}
          animatedProps={animatedProps6}
        />
      </Svg>
    </View>
  );
};

export const Loading: React.FC<LoadingProps> = ({
  type = 'dots',
  size = 'lg',
  color,
  style,
}) => {
  const theme = useTheme();
  const loadingColor = color || theme.colors.primary;

  return (
    <View style={[styles.container, style]}>
      {type === 'svg' ? (
        <BrandIconLoading size={size} color={loadingColor} />
      ) : (
        <DotsLoading size={size} color={loadingColor} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Loading;
