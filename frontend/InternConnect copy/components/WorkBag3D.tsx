import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { Gyroscope } from 'expo-sensors';

export function WorkBag3D(): React.JSX.Element {
  const tiltX = useRef(new Animated.Value(0)).current;
  const tiltY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let sub: ReturnType<typeof Gyroscope.addListener> | null = null;
    let loop: Animated.CompositeAnimation | null = null;

    const startFallback = () => {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(tiltY, { toValue: 12, duration: 2200, useNativeDriver: false }),
          Animated.timing(tiltX, { toValue: -6, duration: 1200, useNativeDriver: false }),
          Animated.timing(tiltY, { toValue: -12, duration: 2200, useNativeDriver: false }),
          Animated.timing(tiltX, { toValue: 6, duration: 1200, useNativeDriver: false }),
        ])
      );
      loop.start();
    };

    const start = async () => {
      if (Platform.OS === 'web') {
        startFallback();
        return;
      }

      const available = await Gyroscope.isAvailableAsync().catch(() => false);
      if (!available) {
        startFallback();
        return;
      }

      try {
        Gyroscope.setUpdateInterval(18);
        sub = Gyroscope.addListener(({ x, y }) => {
          const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

          Animated.spring(tiltX, {
            toValue: clamp(-x * 26, -20, 20),
            useNativeDriver: false,
            tension: 45,
            friction: 8,
          }).start();

          Animated.spring(tiltY, {
            toValue: clamp(y * 26, -20, 20),
            useNativeDriver: false,
            tension: 45,
            friction: 8,
          }).start();
        });
      } catch {
        startFallback();
      }
    };

    start();

    return () => {
      sub?.remove();
      loop?.stop();
    };
  }, [tiltX, tiltY]);

  const rotateX = tiltX.interpolate({ inputRange: [-20, 20], outputRange: ['-16deg', '16deg'] });
  const rotateY = tiltY.interpolate({ inputRange: [-20, 20], outputRange: ['-16deg', '16deg'] });

  return (
    <View style={styles.frame}>
      <View style={styles.halo} />

      <Animated.View
        style={[
          styles.bag,
          {
            transform: [{ perspective: 900 }, { rotateX }, { rotateY }],
          },
        ]}
      >
        <View style={styles.handle} />

        <View style={styles.topBar} />

        <View style={styles.body}>
          <View style={styles.logoPlate}>
            <Text style={styles.logoText}>PRO WORK BAG</Text>
          </View>

          <View style={styles.centerStripe} />

          <View style={styles.pocket}>
            <View style={styles.zipLine} />
          </View>
        </View>

        <View style={styles.sideDepth} />
      </Animated.View>

      <View style={styles.shadow} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: 300,
    borderRadius: 18,
    backgroundColor: '#F4F8FC',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  halo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(3, 105, 161, 0.12)',
    top: 40,
  },

  bag: {
    width: 180,
    height: 210,
    position: 'relative',
  },

  handle: {
    position: 'absolute',
    top: -34,
    left: 24,
    width: 132,
    height: 62,
    borderTopWidth: 8,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderColor: '#183247',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },

  topBar: {
    height: 8,
    backgroundColor: '#BC9B5E',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },

  body: {
    flex: 1,
    backgroundColor: '#224D66',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 1,
    borderColor: '#1A3C52',
    padding: 12,
    justifyContent: 'space-between',
  },

  logoPlate: {
    alignSelf: 'center',
    backgroundColor: '#17394D',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  logoText: {
    fontSize: 10,
    letterSpacing: 0.8,
    color: '#D4E4F2',
    fontWeight: '700',
  },

  centerStripe: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0EA5E9',
    marginTop: 8,
    marginBottom: 8,
  },

  pocket: {
    height: 54,
    borderRadius: 8,
    backgroundColor: '#1C4158',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  zipLine: {
    height: 3,
    borderRadius: 2,
    backgroundColor: '#C5A66A',
  },

  sideDepth: {
    position: 'absolute',
    right: -14,
    top: 14,
    width: 14,
    height: 174,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 10,
    backgroundColor: '#18384B',
  },

  shadow: {
    position: 'absolute',
    bottom: 26,
    width: 170,
    height: 12,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.16)',
  },
});
