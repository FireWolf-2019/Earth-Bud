import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EcoColors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';

export default function LaunchScreen() {
  const { state, hydrated } = useAppStore();

  useEffect(() => {
    if (!hydrated) return;
    if (!state.tutorialSeen) router.replace('/tutorial');
  }, [hydrated, state.tutorialSeen]);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[EcoColors.green900, EcoColors.green800, EcoColors.green600]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}>

        {/* Tutorial shortcut */}
        <TouchableOpacity
          onPress={() => router.push('/tutorial')}
          style={styles.tutorialBtn}
          activeOpacity={0.75}>
          <Ionicons name="help-circle-outline" size={26} color="rgba(255,255,255,0.75)" />
        </TouchableOpacity>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>🌍</Text>
          <Text style={styles.heroLine}>Your planet.</Text>
          <Text style={styles.heroLine}>Your impact.</Text>
          <Text style={styles.heroSub}>
            Every journey starts with understanding the problem.
          </Text>
        </View>

        {/* Single start button */}
        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.85}>
          <Text style={styles.startEmoji}>📚</Text>
          <View style={styles.startTextGroup}>
            <Text style={styles.startLabel}>Begin Learning</Text>
            <Text style={styles.startDesc}>Understand the planet first</Text>
          </View>
          <Ionicons name="arrow-forward-outline" size={22} color={EcoColors.green800} />
        </TouchableOpacity>

      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: EcoColors.green900,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  tutorialBtn: {
    position: 'absolute',
    top: 12,
    right: 0,
    padding: 4,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 24,
  },
  heroEmoji: {
    fontSize: 100,
    marginBottom: 28,
  },
  heroLine: {
    fontSize: 46,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 56,
    letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 15,
    color: EcoColors.green200,
    marginTop: 20,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EcoColors.green200,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 14,
    shadowColor: EcoColors.green900,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  startEmoji: {
    fontSize: 32,
  },
  startTextGroup: {
    flex: 1,
  },
  startLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: EcoColors.green800,
  },
  startDesc: {
    fontSize: 13,
    color: EcoColors.textMuted,
    marginTop: 2,
  },
});
