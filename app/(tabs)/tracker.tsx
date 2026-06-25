import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { EcoColors } from '@/constants/theme';
import { ActionLog, ECO_ACTIONS, useAppStore } from '@/store/app-store';

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function getWeekDates(): string[] {
  const today = new Date();
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + mondayOffset + i);
    return d.toISOString().split('T')[0];
  });
}

function getDayLabel(dateIso: string): string {
  const d = new Date(dateIso);
  const today = todayStr();
  if (dateIso === today) return 'Today';
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

function getLongestStreakEver(logs: ActionLog[], actionId: string): number {
  const dates = [...new Set(
    logs.filter(l => l.actionId === actionId && l.completed).map(l => l.date)
  )].sort();

  if (dates.length === 0) return 0;

  let maxStreak = 1;
  let current = 1;
  for (let i = 1; i < dates.length; i++) {
    const diffDays = Math.round(
      (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / 86400000
    );
    if (diffDays === 1) {
      current++;
      if (current > maxStreak) maxStreak = current;
    } else if (diffDays > 1) {
      current = 1;
    }
  }
  return maxStreak;
}

const ENCOURAGING = [
  "Every small step adds up — keep going!",
  "You're making a real difference. The planet thanks you!",
  "Consistency is the key to lasting change. You've got this!",
  "Your actions inspire others around you. Lead by example!",
  "Sustainability is a journey, not a destination. Enjoy the ride!",
  "Science shows habits stick after 21 days. Keep building yours!",
  "You're part of a global movement. Every action matters!",
];

// ── Sub-components ────────────────────────────────────────────────────────────

function WeekGrid({
  dates,
  logs,
  actionId,
}: {
  dates: string[];
  logs: ActionLog[];
  actionId: string;
}) {
  const logSet = new Set(
    logs.filter(l => l.actionId === actionId && l.completed).map(l => l.date)
  );
  const today = todayStr();

  return (
    <View style={styles.weekGrid}>
      {dates.map((date) => {
        const done = logSet.has(date);
        const isToday = date === today;
        const isFuture = date > today;
        return (
          <View key={date} style={styles.dayCol}>
            <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>{getDayLabel(date)}</Text>
            <View style={[styles.dayCellOuter, isToday && styles.dayCellToday]}>
              <View style={[styles.dayCell, done && styles.dayCellDone, isFuture && styles.dayCellFuture]}>
                {done && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function StreakBadge({ count }: { count: number }) {
  const color = count >= 7 ? EcoColors.catEnergy : count >= 3 ? EcoColors.primary : EcoColors.textMuted;
  return (
    <View style={[styles.streakBadge, { borderColor: color }]}>
      <Text style={[styles.streakNum, { color }]}>{count}</Text>
      <Text style={[styles.streakLabel, { color }]}>🔥</Text>
    </View>
  );
}

function ActionTrackerCard({
  actionId,
  logs,
  weekDates,
  onLog,
}: {
  actionId: string;
  logs: ActionLog[];
  weekDates: string[];
  onLog: (completed: boolean) => void;
}) {
  const action = ECO_ACTIONS.find(a => a.id === actionId);
  if (!action) return null;

  const today = todayStr();
  const todayDone = logs.some(l => l.actionId === actionId && l.date === today && l.completed);

  let streak = 0;
  const checkDate = new Date();
  while (true) {
    const ds = checkDate.toISOString().split('T')[0];
    const done = logs.some(l => l.actionId === actionId && l.date === ds && l.completed);
    if (!done) break;
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  const weekDone = weekDates.filter(d =>
    logs.some(l => l.actionId === actionId && l.date === d && l.completed)
  ).length;

  return (
    <View style={[styles.trackerCard, todayDone && styles.trackerCardDone]}>
      <View style={styles.trackerCardTop}>
        <Text style={styles.trackerEmoji}>{action.emoji}</Text>
        <View style={styles.trackerInfo}>
          <Text style={styles.trackerTitle}>{action.title}</Text>
          <Text style={styles.trackerSub}>
            {weekDone}/7 this week · saves ~{action.co2SavedPerYear}t CO₂/yr
          </Text>
        </View>
        <StreakBadge count={streak} />
      </View>

      <WeekGrid dates={weekDates} logs={logs} actionId={actionId} />

      <TouchableOpacity
        style={[styles.logBtn, todayDone && styles.logBtnDone]}
        onPress={() => onLog(!todayDone)}>
        <Ionicons
          name={todayDone ? 'checkmark-circle' : 'ellipse-outline'}
          size={18}
          color={todayDone ? EcoColors.primary : EcoColors.textMuted}
        />
        <Text style={[styles.logBtnText, todayDone && styles.logBtnTextDone]}>
          {todayDone ? "Done today!" : "Mark done today"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function ProgressRing({ percentage, size = 100 }: { percentage: number; size?: number }) {
  const p = Math.min(Math.max(percentage, 0), 100);
  const sw = size / 8;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: sw,
          borderColor: EcoColors.gray200,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: size - sw * 2,
          height: size - sw * 2,
          borderRadius: (size - sw * 2) / 2,
          backgroundColor: EcoColors.primaryPale,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text style={{ fontSize: size / 4, fontWeight: '900', color: EcoColors.primary }}>{p}%</Text>
        <Text style={{ fontSize: size / 10, color: EcoColors.textMuted, marginTop: 2 }}>weekly</Text>
      </View>
    </View>
  );
}

function SegmentControl({
  tabs,
  selected,
  onSelect,
}: {
  tabs: string[];
  selected: number;
  onSelect: (i: number) => void;
}) {
  return (
    <View style={styles.segmentWrap}>
      {tabs.map((tab, i) => (
        <TouchableOpacity
          key={tab}
          style={[styles.segmentItem, selected === i && styles.segmentItemActive]}
          onPress={() => onSelect(i)}
          activeOpacity={0.7}>
          <Text style={[styles.segmentText, selected === i && styles.segmentTextActive]}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Tab Views ─────────────────────────────────────────────────────────────────

function ThisWeekTab({
  encouragement,
  todayDoneCount,
  totalCommitted,
  weeklyPct,
  co2SavedWeek,
  collectiveMT,
}: {
  encouragement: string;
  todayDoneCount: number;
  totalCommitted: number;
  weeklyPct: number;
  co2SavedWeek: number;
  collectiveMT: number;
}) {
  const carsOff = Math.round(collectiveMT / 4.6).toLocaleString();

  return (
    <View style={styles.tabContent}>
      <LinearGradient
        colors={[EcoColors.green600, EcoColors.green500]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.encourageCard}>
        <Ionicons name="leaf" size={20} color="#fff" />
        <Text style={styles.encourageText}>{encouragement}</Text>
      </LinearGradient>

      <Text style={styles.sectionTitle}>This Week's Impact</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{todayDoneCount}/{totalCommitted}</Text>
          <Text style={styles.statLabel}>Done Today</Text>
        </View>
        <View style={styles.statCard}>
          <ProgressRing percentage={weeklyPct} size={80} />
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: EcoColors.secondary }]}>
            {co2SavedWeek}
          </Text>
          <Text style={styles.statLabel}>tons CO₂</Text>
          <Text style={styles.statSub}>saved this week</Text>
        </View>
      </View>

      <View style={styles.collectiveCard}>
        <View style={styles.collectiveHeader}>
          <Ionicons name="earth" size={20} color={EcoColors.secondary} />
          <Text style={styles.collectiveTitle}>Collective Impact</Text>
        </View>
        <Text style={styles.collectiveText}>
          If 1 million people tracked like you this week, we'd save{' '}
          <Text style={styles.collectiveHighlight}>{collectiveMT.toLocaleString()} metric tons</Text>{' '}
          of CO₂ — equivalent to taking{' '}
          <Text style={styles.collectiveHighlight}>{carsOff} cars</Text>{' '}
          off the road for a year.
        </Text>
      </View>
    </View>
  );
}

function MyActionsTab({
  activeActions,
  actionLogs,
  weekDates,
  onLog,
}: {
  activeActions: string[];
  actionLogs: ActionLog[];
  weekDates: string[];
  onLog: (id: string, completed: boolean) => void;
}) {
  const today = todayStr();

  if (activeActions.length === 0) {
    return (
      <View style={styles.tabContent}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🌱</Text>
          <Text style={styles.emptyTitle}>No actions yet</Text>
          <Text style={styles.emptyText}>
            Head to the Actions tab to commit to eco-habits, then track them here daily.
          </Text>
        </View>
      </View>
    );
  }

  const todayDoneCount = activeActions.filter(id =>
    actionLogs.some(l => l.actionId === id && l.date === today && l.completed)
  ).length;

  return (
    <View style={styles.tabContent}>
      <View style={styles.actionsHeader}>
        <Text style={styles.sectionTitle}>My Committed Actions</Text>
        <View style={styles.todayBadge}>
          <Ionicons name="checkmark-circle" size={14} color={EcoColors.primary} />
          <Text style={styles.todayBadgeText}>{todayDoneCount}/{activeActions.length} today</Text>
        </View>
      </View>
      {activeActions.map(id => (
        <ActionTrackerCard
          key={id}
          actionId={id}
          logs={actionLogs}
          weekDates={weekDates}
          onLog={completed => onLog(id, completed)}
        />
      ))}
    </View>
  );
}

function LifetimeTab({
  lifetimeTotalActions,
  lifetimeCO2Saved,
  lifetimeActiveDays,
  lifetimeTreesEquiv,
  longestStreakEver,
  totalCommitted,
}: {
  lifetimeTotalActions: number;
  lifetimeCO2Saved: number;
  lifetimeActiveDays: number;
  lifetimeTreesEquiv: number;
  longestStreakEver: number;
  totalCommitted: number;
}) {
  const milestones = [
    { icon: '🌱', label: 'First action completed', done: lifetimeTotalActions >= 1 },
    { icon: '🔥', label: '7-day streak on any action', done: longestStreakEver >= 7 },
    { icon: '🌿', label: '25 total actions completed', done: lifetimeTotalActions >= 25 },
    { icon: '🌳', label: '50 total actions completed', done: lifetimeTotalActions >= 50 },
    { icon: '⚡', label: 'Committed to 5+ eco-habits', done: totalCommitted >= 5 },
    { icon: '💧', label: '0.1 ton CO₂ saved lifetime', done: lifetimeCO2Saved >= 0.1 },
    { icon: '☀️', label: '0.5 ton CO₂ saved lifetime', done: lifetimeCO2Saved >= 0.5 },
    { icon: '🌍', label: '1 ton CO₂ saved lifetime', done: lifetimeCO2Saved >= 1.0 },
    { icon: '🚀', label: '30-day streak on any action', done: longestStreakEver >= 30 },
    { icon: '🏆', label: '5 tons CO₂ saved lifetime', done: lifetimeCO2Saved >= 5.0 },
  ];

  const achieved = milestones.filter(m => m.done).length;

  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Lifetime Stats</Text>

      <View style={styles.lifetimeGrid}>
        <View style={[styles.lifetimeStat, { borderColor: EcoColors.green200 }]}>
          <Text style={styles.lifetimeStatValue}>{lifetimeTotalActions}</Text>
          <Text style={styles.lifetimeStatLabel}>Actions{'\n'}Completed</Text>
          <Text style={styles.lifetimeStatIcon}>✅</Text>
        </View>
        <View style={[styles.lifetimeStat, { borderColor: EcoColors.blue200 }]}>
          <Text style={[styles.lifetimeStatValue, { color: EcoColors.secondary }]}>
            {lifetimeCO2Saved}
          </Text>
          <Text style={styles.lifetimeStatLabel}>Tons CO₂{'\n'}Saved</Text>
          <Text style={styles.lifetimeStatIcon}>🌫️</Text>
        </View>
        <View style={[styles.lifetimeStat, { borderColor: EcoColors.green200 }]}>
          <Text style={styles.lifetimeStatValue}>{lifetimeActiveDays}</Text>
          <Text style={styles.lifetimeStatLabel}>Active{'\n'}Eco-Days</Text>
          <Text style={styles.lifetimeStatIcon}>📅</Text>
        </View>
        <View style={[styles.lifetimeStat, { borderColor: EcoColors.catEnergy + '66' }]}>
          <Text style={[styles.lifetimeStatValue, { color: EcoColors.catEnergy }]}>
            {lifetimeTreesEquiv}
          </Text>
          <Text style={styles.lifetimeStatLabel}>Trees{'\n'}Equivalent</Text>
          <Text style={styles.lifetimeStatIcon}>🌳</Text>
        </View>
      </View>

      {/* Best streak card */}
      <LinearGradient
        colors={longestStreakEver >= 7
          ? [EcoColors.catEnergy, '#f59e0b']
          : [EcoColors.green600, EcoColors.green500]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.streakCard}>
        <View style={styles.streakCardLeft}>
          <Text style={styles.streakCardNum}>{longestStreakEver}</Text>
          <Text style={styles.streakCardLabel}>day longest{'\n'}streak ever 🔥</Text>
        </View>
        <View style={styles.streakCardRight}>
          <Text style={styles.streakCardHint}>
            {longestStreakEver === 0
              ? 'Log an action today to start your streak!'
              : longestStreakEver < 7
              ? `${7 - longestStreakEver} more days to unlock the 🔥 streak badge`
              : longestStreakEver < 30
              ? `${30 - longestStreakEver} more days to hit the 🚀 30-day milestone`
              : 'Incredible consistency — you\'re a climate champion!'}
          </Text>
        </View>
      </LinearGradient>

      {/* Milestones */}
      <View style={styles.milestonesCard}>
        <View style={styles.milestonesHeaderRow}>
          <Text style={styles.milestonesTitle}>Impact Milestones</Text>
          <Text style={styles.milestonesCount}>{achieved}/{milestones.length}</Text>
        </View>
        {milestones.map(m => (
          <View key={m.label} style={[styles.milestoneRow, m.done && styles.milestoneRowDone]}>
            <Text style={styles.milestoneIcon}>{m.icon}</Text>
            <Text style={[styles.milestoneLabel, m.done && styles.milestoneLabelDone]}>
              {m.label}
            </Text>
            {m.done ? (
              <Ionicons name="checkmark-circle" size={18} color={EcoColors.primary} />
            ) : (
              <View style={styles.milestoneEmpty} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

const TABS = ['My Actions', 'This Week', 'Lifetime'];

export default function TrackerScreen() {
  const { state, dispatch } = useAppStore();
  const { activeActions, actionLogs } = state;

  const [tabIndex, setTabIndex] = useState(0);

  const weekDates = useMemo(() => getWeekDates(), []);
  const today = todayStr();

  const encouragement = useMemo(() => {
    return ENCOURAGING[new Date().getDate() % ENCOURAGING.length];
  }, []);

  function logAction(actionId: string, completed: boolean) {
    dispatch({ type: 'LOG_ACTION', payload: { date: today, actionId, completed } });
  }

  // ── Weekly stats ────────────────────────────────────────────────────────────
  const totalCommitted = activeActions.length;

  const todayDoneCount = activeActions.filter(id =>
    actionLogs.some(l => l.actionId === id && l.date === today && l.completed)
  ).length;

  const weeklyPossible = totalCommitted * 7;
  const weeklyDone = weekDates.reduce(
    (sum, date) =>
      sum + activeActions.filter(id =>
        actionLogs.some(l => l.actionId === id && l.date === date && l.completed)
      ).length,
    0
  );
  const weeklyPct = weeklyPossible > 0 ? Math.round((weeklyDone / weeklyPossible) * 100) : 0;

  const co2SavedWeek = parseFloat(
    activeActions
      .reduce((sum, id) => {
        const action = ECO_ACTIONS.find(a => a.id === id);
        if (!action) return sum;
        const doneThisWeek = weekDates.filter(d =>
          actionLogs.some(l => l.actionId === id && l.date === d && l.completed)
        ).length;
        return sum + (action.co2SavedPerYear / 365) * doneThisWeek;
      }, 0)
      .toFixed(3)
  );

  const collectiveMT = parseFloat((co2SavedWeek * 1_000_000).toFixed(0));

  // ── Lifetime stats ──────────────────────────────────────────────────────────
  const lifetimeTotalActions = actionLogs.filter(l => l.completed).length;

  const lifetimeCO2Saved = parseFloat(
    actionLogs
      .filter(l => l.completed)
      .reduce((sum, log) => {
        const action = ECO_ACTIONS.find(a => a.id === log.actionId);
        return action ? sum + action.co2SavedPerYear / 365 : sum;
      }, 0)
      .toFixed(3)
  );

  const lifetimeActiveDays = new Set(
    actionLogs.filter(l => l.completed).map(l => l.date)
  ).size;

  const lifetimeTreesEquiv = Math.round(lifetimeCO2Saved / 0.022);

  const longestStreakEver = useMemo(() => {
    const allActionIds = [...new Set(actionLogs.map(l => l.actionId))];
    return allActionIds.reduce((best, id) => Math.max(best, getLongestStreakEver(actionLogs, id)), 0);
  }, [actionLogs]);

  const bestCurrentStreak = useMemo(() => {
    return activeActions.reduce((best, id) => {
      let streak = 0;
      const checkDate = new Date();
      while (true) {
        const ds = checkDate.toISOString().split('T')[0];
        if (!actionLogs.some(l => l.actionId === id && l.date === ds && l.completed)) break;
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
      return Math.max(best, streak);
    }, 0);
  }, [activeActions, actionLogs]);

  // ── Share ──────────────────────────────────────────────────────────────────
  async function handleShare() {
    const name = state.userName ? `${state.userName}'s` : 'My';
    const carsOff = Math.round(collectiveMT / 4.6).toLocaleString();

    const lines = [
      `🌍 ${name} Eco Progress`,
      '',
      `📅 This week: ${weeklyDone}/${weeklyPossible} actions (${weeklyPct}%)`,
      `🌱 CO₂ saved this week: ${co2SavedWeek > 0 ? `${co2SavedWeek} tons` : 'building momentum'}`,
      `⚡ Active eco-habits: ${totalCommitted}`,
      '',
      `🏆 Lifetime: ${lifetimeTotalActions} actions · ${lifetimeCO2Saved} tons CO₂ saved`,
      `📅 Active eco-days: ${lifetimeActiveDays}`,
      `🌳 Trees equivalent: ${lifetimeTreesEquiv}`,
    ];

    if (bestCurrentStreak > 0) {
      lines.push(`🔥 Current streak: ${bestCurrentStreak} day${bestCurrentStreak !== 1 ? 's' : ''}`);
    }

    if (collectiveMT > 0) {
      lines.push(
        '',
        `🌐 If 1 million people tracked like this, we'd save ${collectiveMT.toLocaleString()} metric tons of CO₂ — equal to taking ${carsOff} cars off the road for a year.`
      );
    }

    lines.push('', 'Join me in protecting our planet! 🌿');

    try {
      await Share.share({ message: lines.join('\n') });
    } catch {
      // user cancelled — no action needed
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[EcoColors.green800, EcoColors.green600]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>My Progress</Text>
            <Text style={styles.headerSub}>Track your eco-actions & lifetime impact</Text>
          </View>
          <TouchableOpacity onPress={handleShare} style={styles.shareBtn} accessibilityLabel="Share my progress">
            <Ionicons name="share-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <SegmentControl tabs={TABS} selected={tabIndex} onSelect={setTabIndex} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {tabIndex === 0 && (
          <MyActionsTab
            activeActions={activeActions}
            actionLogs={actionLogs}
            weekDates={weekDates}
            onLog={logAction}
          />
        )}
        {tabIndex === 1 && (
          <ThisWeekTab
            encouragement={encouragement}
            todayDoneCount={todayDoneCount}
            totalCommitted={totalCommitted}
            weeklyPct={weeklyPct}
            co2SavedWeek={co2SavedWeek}
            collectiveMT={collectiveMT}
          />
        )}
        {tabIndex === 2 && (
          <LifetimeTab
            lifetimeTotalActions={lifetimeTotalActions}
            lifetimeCO2Saved={lifetimeCO2Saved}
            lifetimeActiveDays={lifetimeActiveDays}
            lifetimeTreesEquiv={lifetimeTreesEquiv}
            longestStreakEver={longestStreakEver}
            totalCommitted={totalCommitted}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: EcoColors.background },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: EcoColors.green200, marginTop: 4 },
  shareBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Segment control
  segmentWrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 12,
    padding: 3,
    marginBottom: 4,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentItemActive: {
    backgroundColor: '#fff',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
  },
  segmentTextActive: {
    color: EcoColors.green700 ?? EcoColors.green800,
  },

  // Shared layout
  content: { paddingBottom: 40 },
  tabContent: { padding: 16, gap: 14 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: EcoColors.text,
    marginBottom: 2,
  },

  // Encourage
  encourageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    padding: 14,
  },
  encourageText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },

  // Stats row
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: EcoColors.white,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: EcoColors.border,
    shadowColor: EcoColors.green800,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  statValue: { fontSize: 22, fontWeight: '900', color: EcoColors.primary },
  statLabel: { fontSize: 11, color: EcoColors.textMuted, fontWeight: '500', marginTop: 2, textAlign: 'center' },
  statSub: { fontSize: 10, color: EcoColors.textMuted },

  // Collective
  collectiveCard: {
    backgroundColor: EcoColors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: EcoColors.blue200,
    shadowColor: EcoColors.blue900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  collectiveHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  collectiveTitle: { fontSize: 14, fontWeight: '700', color: EcoColors.secondary },
  collectiveText: { fontSize: 13, color: EcoColors.text, lineHeight: 20 },
  collectiveHighlight: { fontWeight: '700', color: EcoColors.secondary },

  // My Actions tab
  actionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  todayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: EcoColors.primaryPale,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  todayBadgeText: { fontSize: 12, fontWeight: '600', color: EcoColors.primary },

  // Tracker cards
  trackerCard: {
    backgroundColor: EcoColors.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: EcoColors.border,
    shadowColor: EcoColors.green800,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  trackerCardDone: { borderColor: EcoColors.green400 },
  trackerCardTop: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  trackerEmoji: { fontSize: 24 },
  trackerInfo: { flex: 1 },
  trackerTitle: { fontSize: 14, fontWeight: '700', color: EcoColors.text },
  trackerSub: { fontSize: 11, color: EcoColors.textMuted, marginTop: 2 },
  streakBadge: {
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  streakNum: { fontSize: 16, fontWeight: '900' },
  streakLabel: { fontSize: 14, marginTop: -2 },
  weekGrid: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 10, gap: 4 },
  dayCol: { flex: 1, alignItems: 'center', gap: 4 },
  dayLabel: { fontSize: 9, color: EcoColors.textMuted, fontWeight: '500' },
  dayLabelToday: { color: EcoColors.primary, fontWeight: '700' },
  dayCellOuter: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  dayCellToday: { borderWidth: 2, borderColor: EcoColors.primary, borderRadius: 8 },
  dayCell: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: EcoColors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellDone: { backgroundColor: EcoColors.primary },
  dayCellFuture: { backgroundColor: EcoColors.gray100 },
  logBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: EcoColors.border,
    paddingVertical: 12,
  },
  logBtnDone: { backgroundColor: EcoColors.primaryPale },
  logBtnText: { fontSize: 13, color: EcoColors.textMuted, fontWeight: '600' },
  logBtnTextDone: { color: EcoColors.primary },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: EcoColors.text },
  emptyText: {
    fontSize: 13,
    color: EcoColors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 280,
  },

  // Lifetime tab
  lifetimeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  lifetimeStat: {
    width: '47%',
    backgroundColor: EcoColors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    alignItems: 'flex-start',
    shadowColor: EcoColors.green800,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
    gap: 2,
  },
  lifetimeStatValue: {
    fontSize: 28,
    fontWeight: '900',
    color: EcoColors.primary,
    letterSpacing: -1,
  },
  lifetimeStatLabel: {
    fontSize: 12,
    color: EcoColors.textMuted,
    fontWeight: '500',
    lineHeight: 16,
  },
  lifetimeStatIcon: {
    fontSize: 20,
    marginTop: 4,
  },

  // Streak card
  streakCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  streakCardLeft: { alignItems: 'center', minWidth: 60 },
  streakCardNum: { fontSize: 36, fontWeight: '900', color: '#fff' },
  streakCardLabel: { fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '600', textAlign: 'center' },
  streakCardRight: { flex: 1 },
  streakCardHint: { fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 19 },

  // Milestones
  milestonesCard: {
    backgroundColor: EcoColors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: EcoColors.border,
  },
  milestonesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  milestonesTitle: { fontSize: 14, fontWeight: '700', color: EcoColors.text },
  milestonesCount: {
    fontSize: 13,
    fontWeight: '700',
    color: EcoColors.primary,
    backgroundColor: EcoColors.primaryPale,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: EcoColors.gray100,
  },
  milestoneRowDone: { backgroundColor: EcoColors.primaryPale + '55' },
  milestoneIcon: { fontSize: 18, width: 26 },
  milestoneLabel: { flex: 1, fontSize: 13, color: EcoColors.textMuted },
  milestoneLabelDone: { color: EcoColors.text, fontWeight: '600' },
  milestoneEmpty: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: EcoColors.gray300,
  },
});
