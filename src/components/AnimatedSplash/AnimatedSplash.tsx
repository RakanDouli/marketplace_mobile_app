/**
 * AnimatedSplash Component
 * Custom animated splash screen with logo draw/fill animation
 *
 * Features:
 * - Primary background color
 * - White logo icon that draws in (stroke animation) - bottom to top
 * - Fill animation after stroke completes
 * - Welcome text fade in
 * - Version number display
 * - Fade out transition when app is ready
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Path, G } from 'react-native-svg';
import Constants from 'expo-constants';

// Primary color from theme
const PRIMARY_COLOR = 'rgb(61, 92, 182)';

// Get app version from app.json
const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

// Get screen dimensions for responsive sizing
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Create animated path component with reanimated
const AnimatedPath = Animated.createAnimatedComponent(Path);

interface AnimatedSplashProps {
  isReady: boolean;
  onAnimationComplete: () => void;
}

// Individual animated path component
const AnimatedStrokePath: React.FC<{
  d: string;
  strokeProgress: Animated.SharedValue<number>;
  fillProgress: Animated.SharedValue<number>;
  strokeLength: number;
  delay: number;
  totalDuration: number;
  fillRule?: 'nonzero' | 'evenodd';
}> = ({ d, strokeProgress, fillProgress, strokeLength, delay, totalDuration, fillRule }) => {
  const animatedProps = useAnimatedProps(() => {
    // Calculate stroke offset based on progress
    // Each path takes 1/7 of the total time, offset by delay
    const pathDuration = totalDuration / 7;
    const pathStart = delay * pathDuration;
    const currentTime = strokeProgress.value * totalDuration;

    // Calculate progress for this specific path
    const pathProgress = Math.max(0, Math.min(1, (currentTime - pathStart) / pathDuration));
    const strokeDashoffset = strokeLength * (1 - pathProgress);

    return {
      strokeDashoffset,
      fillOpacity: fillProgress.value,
    };
  });

  return (
    <AnimatedPath
      d={d}
      stroke="#FFFFFF"
      strokeWidth={1.5}
      strokeDasharray={strokeLength}
      fill="#FFFFFF"
      fillRule={fillRule}
      animatedProps={animatedProps}
    />
  );
};

export const AnimatedSplash: React.FC<AnimatedSplashProps> = ({
  isReady,
  onAnimationComplete,
}) => {
  // Animation values
  const strokeProgress = useSharedValue(0);
  const fillProgress = useSharedValue(0);
  const containerOpacity = useSharedValue(1);
  const welcomeOpacity = useSharedValue(0);

  // Total stroke duration in ms
  const STROKE_DURATION = 3500;
  const FILL_DURATION = 150; // Fast fill

  // Responsive logo size - use percentage of available space
  // Logo viewBox is 60x148, so aspect ratio is 60/148 = 0.405
  const logoHeight = Math.min(180, SCREEN_HEIGHT * 0.22);
  const logoWidth = logoHeight * (60 / 148);

  // Logo paths - BOTTOM TO TOP order (circle first, then stripes going up)
  const strokePaths = [
    // 0: Circle/bottom part (location pin) - FIRST
    { d: "M49.7246 78.4792C54.4908 76.7829 59.5 80.3176 59.5 85.3767C59.4998 88.4531 57.576 91.2013 54.6855 92.2546L47.6104 94.8318C54.8262 100.209 59.4999 108.809 59.5 118.5C59.5 134.792 46.2924 148 30 148C13.7076 148 0.5 134.792 0.5 118.5C0.500045 114.342 1.36183 110.385 2.91406 106.798C1.44819 105.45 0.5 103.515 0.5 101.289C0.500167 98.1179 2.49517 95.2898 5.48242 94.2263L49.7246 78.4792ZM29.5 103C21.2158 103 14.5002 109.716 14.5 118C14.5 126.284 21.2157 133 29.5 133C37.7843 133 44.5 126.284 44.5 118C44.4998 109.716 37.7842 103 29.5 103Z", length: 450, delay: 0, fillRule: 'evenodd' as const },
    // 1: Bottom diagonal stripe
    { d: "M10.5635 85.3328L54.6858 69.2543C57.5764 68.201 59.5 65.4527 59.5 62.3762C59.5 57.317 54.4908 53.7829 49.7246 55.4794L5.48291 71.2264C2.49533 72.2898 0.5 75.1179 0.5 78.2891C0.5 83.4938 5.67343 87.1148 10.5635 85.3328Z", length: 200, delay: 1 },
    // 2: Left vertical bar
    { d: "M11.5 57.035V23.2009C11.5 19.5743 8.05162 16.9405 4.55285 17.8947C2.16002 18.5473 0.5 20.7206 0.5 23.2009V57.035C0.5 60.7408 4.09035 63.3861 7.62972 62.288C9.93129 61.574 11.5 59.4448 11.5 57.035Z", length: 120, delay: 2 },
    // 3: Middle stripe (3rd from top)
    { d: "M24.2609 56.6615L56.152 45.631C58.1558 44.9379 59.5 43.0507 59.5 40.9304C59.5 37.527 56.1586 35.1289 52.9342 36.2182L20.9645 47.0187C18.8939 47.7183 17.5 49.6605 17.5 51.8461C17.5 55.3481 20.9513 57.8063 24.2609 56.6615Z", length: 150, delay: 3 },
    // 4: Second stripe from top
    { d: "M24.2609 39.6615L56.152 28.631C58.1558 27.9379 59.5 26.0507 59.5 23.9304C59.5 20.527 56.1586 18.1289 52.9342 19.2182L20.9645 30.0187C18.8939 30.7183 17.5 32.6605 17.5 34.8461C17.5 38.3481 20.9513 40.8063 24.2609 39.6615Z", length: 150, delay: 4 },
    // 5: Top stripe (topmost) - LAST
    { d: "M24.2609 22.6615L56.152 11.631C58.1558 10.9379 59.5 9.05069 59.5 6.93037C59.5 3.52696 56.1586 1.12886 52.9342 2.21818L20.9645 13.0187C18.8939 13.7183 17.5 15.6605 17.5 17.8461C17.5 21.3481 20.9513 23.8063 24.2609 22.6615Z", length: 150, delay: 5 },
  ];

  useEffect(() => {
    // Step 1: Stroke animation (3500ms) - bottom to top
    strokeProgress.value = withTiming(1, {
      duration: STROKE_DURATION,
      easing: Easing.linear,
    });

    // Step 2: Fill - starts AFTER stroke finishes, fast (150ms)
    fillProgress.value = withDelay(
      STROKE_DURATION,
      withTiming(1, {
        duration: FILL_DURATION,
        easing: Easing.out(Easing.ease),
      })
    );

    // Step 3: Welcome text fades in after fill completes
    welcomeOpacity.value = withDelay(
      STROKE_DURATION + FILL_DURATION + 100,
      withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.ease),
      })
    );
  }, []);

  useEffect(() => {
    if (isReady) {
      // Wait for full animation including welcome text, then fade out
      containerOpacity.value = withDelay(
        STROKE_DURATION + FILL_DURATION + 700,
        withTiming(0, {
          duration: 400,
          easing: Easing.out(Easing.ease)
        }, () => {
          runOnJS(onAnimationComplete)();
        })
      );
    }
  }, [isReady]);

  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const welcomeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: welcomeOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Svg
            width={logoWidth}
            height={logoHeight}
            viewBox="0 0 60 148"
            fill="none"
            style={styles.svg}
          >
            <G>
              {/* Stroke paths - animate drawing bottom to top */}
              {strokePaths.map((path, index) => (
                <AnimatedStrokePath
                  key={`stroke-${index}`}
                  d={path.d}
                  strokeProgress={strokeProgress}
                  fillProgress={fillProgress}
                  strokeLength={path.length}
                  delay={path.delay}
                  totalDuration={STROKE_DURATION}
                  fillRule={path.fillRule}
                />
              ))}
            </G>
          </Svg>
        </View>

        {/* Welcome text */}
        <Animated.View style={[styles.textContainer, welcomeAnimatedStyle]}>
          <Animated.Text style={styles.welcomeText}>
            أهلاً بك في شام باي
          </Animated.Text>
          <Animated.Text style={styles.versionText}>
            الإصدار {APP_VERSION}
          </Animated.Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: PRIMARY_COLOR,
    zIndex: 9999,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  svg: {
    overflow: 'visible',
  },
  textContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  versionText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '400',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default AnimatedSplash;
