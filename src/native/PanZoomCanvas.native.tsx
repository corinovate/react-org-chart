import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export interface PanZoomCanvasProps {
  contentWidth: number;
  contentHeight: number;
  children: React.ReactNode;
  minScale?: number;
  maxScale?: number;
}

function ZoomButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.zoomButton}>
      <Text style={styles.zoomButtonText}>{label}</Text>
    </Pressable>
  );
}

export function PanZoomCanvas({
  contentWidth,
  contentHeight,
  children,
  minScale = 0.2,
  maxScale = 2.5,
}: PanZoomCanvasProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const savedScale = useSharedValue(1);

  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);
  const [hasFitOnce, setHasFitOnce] = useState(false);

  const fitToScreen = (animated: boolean) => {
    if (!containerSize || contentWidth === 0 || contentHeight === 0) return;
    const fit =
      Math.min(containerSize.width / contentWidth, containerSize.height / contentHeight, 1) * 0.92;
    const clamped = Math.max(minScale, Math.min(maxScale, fit));
    const targetX = (containerSize.width - contentWidth * clamped) / 2;
    const targetY = (containerSize.height - contentHeight * clamped) / 2;
    if (animated) {
      scale.value = withTiming(clamped, { duration: 220 });
      translateX.value = withTiming(targetX, { duration: 220 });
      translateY.value = withTiming(targetY, { duration: 220 });
    } else {
      scale.value = clamped;
      translateX.value = targetX;
      translateY.value = targetY;
    }
    savedScale.value = clamped;
    savedTranslateX.value = targetX;
    savedTranslateY.value = targetY;
  };

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setContainerSize({ width, height });
  };

  // Fit-to-screen on first layout, and re-fit whenever the tree's overall
  // size changes (e.g. a person was added) — mirrors PanZoomCanvas.tsx (web).
  useEffect(() => {
    if (!containerSize) return;
    fitToScreen(hasFitOnce);
    setHasFitOnce(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerSize, contentWidth, contentHeight]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(minScale, Math.min(maxScale, savedScale.value * e.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
  }));

  const zoomBy = (factor: number) => {
    const next = Math.max(minScale, Math.min(maxScale, savedScale.value * factor));
    scale.value = withTiming(next, { duration: 150 });
    savedScale.value = next;
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
      <GestureDetector gesture={composedGesture}>
        {/* transformOrigin: '0 0' makes the scale transform compose the same way as the
            web canvas's CSS translate+scale (anchored at the content's top-left), which
            the fitToScreen/zoomBy math above assumes. Requires RN 0.73+ / Fabric — on an
            older RN runtime the scale will visually anchor at center instead. */}
        <Animated.View
          style={[{ width: contentWidth, height: contentHeight, transformOrigin: '0 0' }, animatedStyle]}
        >
          {children}
        </Animated.View>
      </GestureDetector>
      <View style={styles.controls}>
        <ZoomButton label="+" onPress={() => zoomBy(1.3)} />
        <ZoomButton label="–" onPress={() => zoomBy(1 / 1.3)} />
        <ZoomButton label="⤢" onPress={() => fitToScreen(true)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  controls: { position: 'absolute', right: 16, bottom: 16, gap: 6 },
  zoomButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#141008',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  zoomButtonText: { fontSize: 16 },
});
