import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EcoColors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';

const { width: W, height: H } = Dimensions.get('window');
const SPRING = { damping: 18, stiffness: 115, mass: 0.8 };

// ── Slide data ─────────────────────────────────────────────────────────────────

interface Slide {
  id: string;
  icon: string;
  gradient: [string, string];
  pill?: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    id: 'mission',
    icon: '🌍',
    gradient: [EcoColors.green900, '#0D5C2A'],
    title: 'Awareness meets action',
    body: 'Every environmental challenge begins with a lack of awareness and ends with collective action. This app is your bridge between knowing the problem and doing something about it.',
  },
  {
    id: 'learn',
    icon: '📚',
    gradient: ['#14532D', '#15803D'],
    pill: 'Tab 1 — Learn',
    title: 'Understand the planet',
    body: 'Explore concise breakdowns of global climate change and dive into interactive tutorials on major earth systems to build your environmental knowledge.',
  },
  {
    id: 'footprint',
    icon: '🌿',
    gradient: ['#0C4A6E', '#0369A1'],
    pill: 'Tab 2 — Footprint',
    title: 'Know your impact',
    body: 'Calculate your personal carbon footprint across transport, home energy, diet, food waste, and lifestyle. Understanding your baseline is the first step to reducing it.',
  },
  {
    id: 'actions',
    icon: '⚡',
    gradient: ['#14532D', '#166534'],
    pill: 'Tab 3 — Actions',
    title: 'Build sustainable habits',
    body: 'Browse research-backed eco-habits — composting, cycling, plant-rich eating, and more. Each action shows the science behind it, your CO₂ potential, and exactly how to start.',
  },
  {
    id: 'tracker',
    icon: '📊',
    gradient: ['#164E63', '#0369A1'],
    pill: 'Tab 4 — Tracker',
    title: 'Track your consistency',
    body: 'Log daily eco-actions, visualise your streaks, and watch cumulative CO₂ savings grow. See what your habits could mean at the scale of a million people.',
  },
  {
    id: 'ecobot',
    icon: '🤖',
    gradient: ['#0C4A6E', '#14532D'],
    pill: 'Tab 5 — EcoBot',
    title: 'Your AI eco-guide',
    body: 'EcoBot learns from your app activity and tailors its suggestions — recommending relevant readings, nudging habits back on track, and answering any environmental question you have.',
  },
];

// ── Slide component ────────────────────────────────────────────────────────────

function SlideItem({ item, isActive }: { item: Slide; isActive: boolean }) {
  const iconTY    = useSharedValue(70);
  const iconScale = useSharedValue(0.55);
  const iconOp    = useSharedValue(0);
  const pillTY    = useSharedValue(30);
  const pillOp    = useSharedValue(0);
  const titleTY   = useSharedValue(44);
  const titleOp   = useSharedValue(0);
  const bodyTY    = useSharedValue(30);
  const bodyOp    = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      iconTY.value    = withSpring(0, SPRING);
      iconScale.value = withSpring(1, SPRING);
      iconOp.value    = withTiming(1, { duration: 380 });
      pillTY.value    = withDelay(80,  withSpring(0, SPRING));
      pillOp.value    = withDelay(80,  withTiming(1, { duration: 320 }));
      titleTY.value   = withDelay(150, withSpring(0, SPRING));
      titleOp.value   = withDelay(150, withTiming(1, { duration: 320 }));
      bodyTY.value    = withDelay(260, withSpring(0, SPRING));
      bodyOp.value    = withDelay(260, withTiming(1, { duration: 320 }));
    } else {
      iconTY.value    = 70;
      iconScale.value = 0.55;
      iconOp.value    = 0;
      pillTY.value    = 30;
      pillOp.value    = 0;
      titleTY.value   = 44;
      titleOp.value   = 0;
      bodyTY.value    = 30;
      bodyOp.value    = 0;
    }
    // Shared values are stable refs (Reanimated), not reactive state —
    // only `isActive` should retrigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const iconStyle  = useAnimatedStyle(() => ({
    transform: [{ translateY: iconTY.value }, { scale: iconScale.value }],
    opacity: iconOp.value,
  }));
  const pillStyle  = useAnimatedStyle(() => ({
    transform: [{ translateY: pillTY.value }],
    opacity: pillOp.value,
  }));
  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: titleTY.value }],
    opacity: titleOp.value,
  }));
  const bodyStyle  = useAnimatedStyle(() => ({
    transform: [{ translateY: bodyTY.value }],
    opacity: bodyOp.value,
  }));

  return (
    <LinearGradient
      colors={item.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.slide}>
      <View style={styles.slideContent}>
        <Animated.Text style={[styles.slideIcon, iconStyle]}>
          {item.icon}
        </Animated.Text>

        {item.pill ? (
          <Animated.View style={[styles.pill, pillStyle]}>
            <Text style={styles.pillText}>{item.pill}</Text>
          </Animated.View>
        ) : (
          <View style={styles.pillSpacer} />
        )}

        <Animated.Text style={[styles.slideTitle, titleStyle]}>
          {item.title}
        </Animated.Text>
        <Animated.Text style={[styles.slideBody, bodyStyle]}>
          {item.body}
        </Animated.Text>
      </View>
    </LinearGradient>
  );
}

// ── Animated progress dot ──────────────────────────────────────────────────────

function Dot({ active }: { active: boolean }) {
  const w  = useSharedValue(active ? 24 : 8);
  const op = useSharedValue(active ? 1 : 0.4);

  useEffect(() => {
    w.value  = withSpring(active ? 24 : 8, { damping: 16, stiffness: 150 });
    op.value = withTiming(active ? 1 : 0.4, { duration: 220 });
    // Shared values are stable refs (Reanimated); only `active` matters here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const style = useAnimatedStyle(() => ({ width: w.value, opacity: op.value }));

  return <Animated.View style={[styles.dot, style]} />;
}

// ── Main screen ────────────────────────────────────────────────────────────────

export default function TutorialScreen() {
  const { dispatch } = useAppStore();
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState(0);
  const listRef = useRef<FlatList>(null);

  const viewConfig  = useRef({ itemVisiblePercentThreshold: 60 }).current;
  const onViewable  = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActive(viewableItems[0].index);
    }
  }, []);

  function finish() {
    dispatch({ type: 'SET_TUTORIAL_SEEN', payload: true });
    router.replace('/(tabs)');
  }

  function goNext() {
    if (active < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: active + 1, animated: true });
    } else {
      finish();
    }
  }

  const isLast = active === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={s => s.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={viewConfig}
        renderItem={({ item, index }) => (
          <SlideItem item={item} isActive={index === active} />
        )}
        style={StyleSheet.absoluteFill}
        scrollEventThrottle={16}
      />

      {/* Skip — top right inside safe area */}
      <View style={[styles.skipWrapper, { top: insets.top + 10 }]}>
        <TouchableOpacity onPress={finish} style={styles.skipBtn} activeOpacity={0.75}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Footer — dots + next button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => <Dot key={i} active={i === active} />)}
        </View>

        <TouchableOpacity onPress={goNext} style={styles.nextBtn} activeOpacity={0.85}>
          <Text style={styles.nextText}>{isLast ? 'Get started' : 'Next'}</Text>
          <Ionicons
            name={isLast ? 'checkmark-circle-outline' : 'arrow-forward-outline'}
            size={20}
            color={EcoColors.green800}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: EcoColors.green900,
  },
  // Slide
  slide: {
    width: W,
    height: H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideContent: {
    width: W * 0.82,
    alignItems: 'center',
    paddingBottom: 180,
  },
  slideIcon: {
    fontSize: 96,
    marginBottom: 24,
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  pillText: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  pillSpacer: {
    height: 30,
    marginBottom: 20,
  },
  slideTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: 18,
  },
  slideBody: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.80)',
    textAlign: 'center',
    lineHeight: 24,
  },
  // Skip
  skipWrapper: {
    position: 'absolute',
    right: 20,
  },
  skipBtn: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  skipText: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    fontWeight: '600',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 18,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    gap: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '800',
    color: EcoColors.green800,
  },
});
