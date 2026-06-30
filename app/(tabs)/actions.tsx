import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

import { EcoColors } from '@/constants/theme';
import { useAppStore, ECO_ACTIONS, EcoAction } from '@/store/app-store';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CATEGORIES = ['All', 'Food', 'Transport', 'Home', 'Lifestyle'];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];

const DIFFICULTY_FILTER_COLORS: Record<string, string> = {
  Easy:   EcoColors.success,
  Medium: EcoColors.warning,
  Hard:   EcoColors.danger,
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy:   EcoColors.success,
  Medium: EcoColors.warning,
  Hard:   EcoColors.danger,
};

const CATEGORY_ICONS: Record<string, string> = {
  Food:      '🥦',
  Transport: '🚲',
  Home:      '🏠',
  Lifestyle: '♻️',
};

function DifficultyBadge({ level }: { level: string }) {
  const color = DIFFICULTY_COLORS[level] ?? EcoColors.primary;
  return (
    <View style={[styles.diffBadge, { backgroundColor: color + '20', borderColor: color }]}>
      <Text style={[styles.diffBadgeText, { color }]}>{level}</Text>
    </View>
  );
}

function StepItem({ step, index }: { step: string; index: number }) {
  return (
    <View style={styles.stepItem}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{index + 1}</Text>
      </View>
      <Text style={styles.stepText}>{step}</Text>
    </View>
  );
}

function ActionCard({
  action,
  isCommitted,
  onToggleCommit,
  defaultExpanded,
}: {
  action: EcoAction;
  isCommitted: boolean;
  onToggleCommit: () => void;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);
  const { dispatch } = useAppStore();

  function toggle() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => !prev);
    dispatch({ type: 'MARK_ACTION_VIEWED', payload: action.id });
  }

  const catColor = EcoColors.catWildlife;

  return (
    <View style={[styles.actionCard, isCommitted && styles.actionCardCommitted]}>
      {isCommitted && (
        <View style={styles.committedBanner}>
          <Ionicons name="checkmark-circle" size={14} color={EcoColors.primary} />
          <Text style={styles.committedText}>In your tracker</Text>
        </View>
      )}

      <TouchableOpacity style={styles.actionCardHeader} onPress={toggle} activeOpacity={0.8}>
        <Text style={styles.actionEmoji}>{action.emoji}</Text>
        <View style={styles.actionInfo}>
          <Text style={styles.actionTitle}>{action.title}</Text>
          <View style={styles.actionMeta}>
            <DifficultyBadge level={action.difficulty} />
            <Text style={styles.co2Text}>
              💚 saves ~{action.co2SavedPerYear}t CO₂/yr
            </Text>
          </View>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={EcoColors.textMuted}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedBody}>
          {/* Background */}
          <View style={styles.infoBlock}>
            <Text style={styles.infoBlockTitle}>Background</Text>
            <Text style={styles.infoBlockText}>{action.background}</Text>
          </View>

          {/* Importance */}
          <View style={[styles.infoBlock, { backgroundColor: EcoColors.green50 }]}>
            <Text style={styles.infoBlockTitle}>Why It Matters</Text>
            <Text style={styles.infoBlockText}>{action.importance}</Text>
          </View>

          {/* Steps */}
          <View style={styles.infoBlock}>
            <Text style={styles.infoBlockTitle}>How To Start</Text>
            {action.steps.map((step, i) => (
              <StepItem key={i} step={step} index={i} />
            ))}
          </View>

          {/* Collective impact */}
          <View style={[styles.infoBlock, { backgroundColor: EcoColors.secondaryPale }]}>
            <View style={styles.collectiveRow}>
              <Ionicons name="people-outline" size={16} color={EcoColors.secondary} />
              <Text style={styles.collectiveTitle}>Collective Impact</Text>
            </View>
            <Text style={[styles.infoBlockText, { color: EcoColors.secondary }]}>
              {action.collectiveImpact}
            </Text>
          </View>

          {/* Commit button */}
          <TouchableOpacity
            style={[styles.commitBtn, isCommitted && styles.commitBtnActive]}
            onPress={onToggleCommit}>
            {isCommitted ? (
              <>
                <Ionicons name="checkmark-circle" size={18} color={EcoColors.primary} />
                <Text style={[styles.commitBtnText, { color: EcoColors.primary }]}>
                  Committed! Tap to remove
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text style={styles.commitBtnText}>Add to My Tracker</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function ActionsScreen() {
  const { state, dispatch } = useAppStore();
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeDifficulty, setActiveDifficulty] = useState('All');

  const filtered = ECO_ACTIONS.filter(a => {
    const catMatch = activeCategory === 'All' || a.category === activeCategory;
    const diffMatch = activeDifficulty === 'All' || a.difficulty === activeDifficulty;
    return catMatch && diffMatch;
  });

  const totalPotentialSavings = filtered.reduce((sum, a) => sum + a.co2SavedPerYear, 0);
  const committedCount = state.activeActions.filter(id =>
    ECO_ACTIONS.find(a => a.id === id)
  ).length;

  function toggleCommit(id: string) {
    dispatch({ type: 'TOGGLE_ACTION', payload: id });
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[EcoColors.green800, EcoColors.green600]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}>
        <Text style={styles.headerTitle}>Take Action</Text>
        <Text style={styles.headerSub}>
          Practical steps to reduce your environmental impact
        </Text>
        <View style={styles.headerStats}>
          <View style={styles.headerStat}>
            <Text style={styles.headerStatValue}>{committedCount}</Text>
            <Text style={styles.headerStatLabel}>Committed</Text>
          </View>
          <View style={styles.headerStatDiv} />
          <View style={styles.headerStat}>
            <Text style={styles.headerStatValue}>
              {state.activeActions
                .reduce((s, id) => s + (ECO_ACTIONS.find(a => a.id === id)?.co2SavedPerYear ?? 0), 0)
                .toFixed(1)}t
            </Text>
            <Text style={styles.headerStatLabel}>CO₂ savings/yr</Text>
          </View>
          <View style={styles.headerStatDiv} />
          <View style={styles.headerStat}>
            <Text style={styles.headerStatValue}>{ECO_ACTIONS.length}</Text>
            <Text style={styles.headerStatLabel}>Total Actions</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Filters */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[styles.filterChip, activeCategory === cat && styles.filterChipActive]}>
              {CATEGORY_ICONS[cat] ? (
                <Text style={styles.catIcon}>{CATEGORY_ICONS[cat]}</Text>
              ) : null}
              <Text
                style={[
                  styles.filterChipText,
                  activeCategory === cat && styles.filterChipTextActive,
                ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.diffFilterRow}>
          {DIFFICULTIES.map(diff => {
            const isActive = activeDifficulty === diff;
            const color = DIFFICULTY_FILTER_COLORS[diff];
            return (
              <TouchableOpacity
                key={diff}
                onPress={() => setActiveDifficulty(diff)}
                style={[
                  styles.diffChip,
                  isActive && color
                    ? { backgroundColor: color + '22', borderColor: color }
                    : isActive
                    ? styles.diffChipActiveAll
                    : null,
                ]}>
                {color && <View style={[styles.diffDot, { backgroundColor: color }]} />}
                <Text
                  style={[
                    styles.diffChipText,
                    isActive && { color: color ?? EcoColors.primary, fontWeight: '700' },
                  ]}>
                  {diff}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {activeCategory !== 'All' && (
          <View style={styles.categoryBanner}>
            <Text style={styles.categoryBannerText}>
              {CATEGORY_ICONS[activeCategory]} {activeCategory} actions · up to{' '}
              {totalPotentialSavings.toFixed(1)} tons CO₂ saved/year
            </Text>
          </View>
        )}

        {filtered.map(action => (
          <ActionCard
            key={action.id}
            action={action}
            isCommitted={state.activeActions.includes(action.id)}
            onToggleCommit={() => toggleCommit(action.id)}
          />
        ))}

        <View style={styles.bottomNote}>
          <Ionicons name="leaf" size={16} color={EcoColors.green400} />
          <Text style={styles.bottomNoteText}>
            Every action counts. Even one change ripples through your community.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: EcoColors.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    color: EcoColors.green200,
    marginTop: 4,
    marginBottom: 14,
  },
  headerStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  headerStat: { flex: 1, alignItems: 'center' },
  headerStatValue: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerStatLabel: { fontSize: 11, color: EcoColors.green200, marginTop: 2 },
  headerStatDiv: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  filterBar: {
    backgroundColor: EcoColors.white,
    borderBottomWidth: 1,
    borderBottomColor: EcoColors.border,
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: EcoColors.green50,
    borderWidth: 1,
    borderColor: EcoColors.border,
    gap: 4,
    marginRight: 4,
  },
  filterChipActive: { backgroundColor: EcoColors.primary, borderColor: EcoColors.primary },
  catIcon: { fontSize: 14 },
  filterChipText: { fontSize: 13, fontWeight: '500', color: EcoColors.textSecondary },
  filterChipTextActive: { color: '#fff' },
  diffFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  diffChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: EcoColors.green50,
    borderWidth: 1,
    borderColor: EcoColors.border,
    gap: 5,
  },
  diffChipActiveAll: {
    backgroundColor: EcoColors.primaryPale,
    borderColor: EcoColors.primary,
  },
  diffDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  diffChipText: { fontSize: 12, fontWeight: '500', color: EcoColors.textSecondary },
  list: { padding: 16, paddingBottom: 40 },
  categoryBanner: {
    backgroundColor: EcoColors.primaryPale,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: EcoColors.green200,
  },
  categoryBannerText: {
    fontSize: 13,
    color: EcoColors.primary,
    fontWeight: '600',
  },
  actionCard: {
    backgroundColor: EcoColors.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: EcoColors.border,
    marginBottom: 12,
    shadowColor: EcoColors.green800,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  actionCardCommitted: {
    borderColor: EcoColors.green400,
  },
  committedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: EcoColors.primaryPale,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: EcoColors.green200,
  },
  committedText: {
    fontSize: 11,
    fontWeight: '700',
    color: EcoColors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  actionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  actionEmoji: { fontSize: 28 },
  actionInfo: { flex: 1 },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: EcoColors.text,
    marginBottom: 6,
  },
  actionMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  diffBadge: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  diffBadgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  co2Text: { fontSize: 12, color: EcoColors.textSecondary },
  expandedBody: {
    borderTopWidth: 1,
    borderTopColor: EcoColors.border,
    padding: 16,
    gap: 12,
  },
  infoBlock: {
    backgroundColor: EcoColors.gray100,
    borderRadius: 12,
    padding: 12,
  },
  infoBlockTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: EcoColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  infoBlockText: {
    fontSize: 13,
    color: EcoColors.text,
    lineHeight: 19,
  },
  stepItem: { flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'flex-start' },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: EcoColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  stepNumText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  stepText: { flex: 1, fontSize: 13, color: EcoColors.text, lineHeight: 19 },
  collectiveRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  collectiveTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: EcoColors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  commitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: EcoColors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 4,
  },
  commitBtnActive: {
    backgroundColor: EcoColors.primaryPale,
    borderWidth: 1.5,
    borderColor: EcoColors.primary,
  },
  commitBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  bottomNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
    paddingHorizontal: 8,
  },
  bottomNoteText: {
    flex: 1,
    fontSize: 13,
    color: EcoColors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 19,
  },
});
