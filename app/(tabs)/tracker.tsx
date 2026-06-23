import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

import { EcoColors } from '@/constants/theme';
import { useAppStore, ECO_ACTIONS, ActionLog } from '@/store/app-store';

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function dateStr(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeekDates(): string[] {
  const today = new Date();
  const day = today.getDay(); // 0=Sun
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
      {dates.map((date, i) => {
        const done = logSet.has(date);
        const isToday = date === today;
        const isFuture = date > today;
        return (
          <View key={date} style={styles.dayCol}>
            <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>{getDayLabel(date)}</Text>
            <View
              style={[
                styles.dayCellOuter,
                isToday && styles.dayCellToday,
              ]}>
              <View
                style={[
                  styles.dayCell,
                  done && styles.dayCellDone,
                  isFuture && styles.dayCellFuture,
                ]}>
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

  // Calculate streak
  let streak = 0;
  let checkDate = new Date();
  while (true) {
    const ds = checkDate.toISOString().split('T')[0];
    const done = logs.some(l => l.actionId === actionId && l.date === ds && l.completed);
    if (!done) break;
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Week completion count
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
      {/* Track ring */}
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
      {/* Progress indicator — simplified visual */}
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
        <Text style={{ fontSize: size / 4, fontWeight: '900', color: EcoColors.primary }}>
          {p}%
        </Text>
        <Text style={{ fontSize: size / 10, color: EcoColors.textMuted, marginTop: 2 }}>
          weekly
        </Text>
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function TrackerScreen() {
  const { state, dispatch } = useAppStore();
  const { activeActions, actionLogs } = state;

  const weekDates = useMemo(() => getWeekDates(), []);
  const today = todayStr();

  const encouragement = useMemo(() => {
    const idx = new Date().getDate() % ENCOURAGING.length;
    return ENCOURAGING[idx];
  }, []);

  function logAction(actionId: string, completed: boolean) {
    dispatch({
      type: 'LOG_ACTION',
      payload: { date: today, actionId, completed },
    });
  }

  // Stats
  const totalCommitted = activeActions.length;
  const todayDoneCount = activeActions.filter(id =>
    actionLogs.some(l => l.actionId === id && l.date === today && l.completed)
  ).length;
  const weeklyPossible = totalCommitted * 7;
  const weeklyDone = weekDates.reduce(
    (sum, date) =>
      sum +
      activeActions.filter(id =>
        actionLogs.some(l => l.actionId === id && l.date === date && l.completed)
      ).length,
    0
  );
  const weeklyPct = weeklyPossible > 0 ? Math.round((weeklyDone / weeklyPossible) * 100) : 0;

  // CO2 saved this week (rough estimate: daily / 7 * days done)
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

  // Collective impact (if 1M people did this)
  const collectiveMT = parseFloat((co2SavedWeek * 1_000_000).toFixed(0));

  // Best current streak across all active actions
  const bestStreak = useMemo(() => {
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

  async function handleShare() {
    const name = state.userName ? `${state.userName}'s` : 'My';
    const co2Display = co2SavedWeek > 0 ? `${co2SavedWeek} tons` : 'building momentum';
    const carsOff = Math.round(collectiveMT / 4.6).toLocaleString();

    const lines = [
      `🌍 ${name} Weekly Eco Progress`,
      '',
      `✅ Weekly actions: ${weeklyDone}/${weeklyPossible} completed (${weeklyPct}%)`,
      `🌱 CO₂ saved this week: ${co2Display}`,
      `⚡ Active eco-habits: ${totalCommitted}`,
      `📅 Today: ${todayDoneCount}/${totalCommitted} done`,
    ];

    if (bestStreak > 0) {
      lines.push(`🔥 Best current streak: ${bestStreak} day${bestStreak !== 1 ? 's' : ''}`);
    }

    if (collectiveMT > 0) {
      lines.push(
        '',
        `🌐 If 1 million people tracked like this, we'd save ${collectiveMT.toLocaleString()} metric tons of CO₂ — equal to taking ${carsOff} cars off the road for a year.`,
      );
    }

    lines.push('', 'Join me in protecting our planet! 🌿');

    try {
      await Share.share({ message: lines.join('\n') });
    } catch {
      // user cancelled or dismissed — no action needed
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
            <Text style={styles.headerSub}>Track your eco-actions week by week</Text>
          </View>
          <TouchableOpacity onPress={handleShare} style={styles.shareBtn} accessibilityLabel="Share my progress">
            <Ionicons name="share-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Encouraging message */}
        <LinearGradient
          colors={[EcoColors.green600, EcoColors.green500]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.encourageCard}>
          <Ionicons name="leaf" size={20} color="#fff" />
          <Text style={styles.encourageText}>{encouragement}</Text>
        </LinearGradient>

        {/* Stats row */}
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
            <Text style={styles.statLabel}>tons saved</Text>
            <Text style={styles.statSub}>this week</Text>
          </View>
        </View>

        {/* Collective impact */}
        <View style={styles.collectiveCard}>
          <View style={styles.collectiveHeader}>
            <Ionicons name="earth" size={20} color={EcoColors.secondary} />
            <Text style={styles.collectiveTitle}>Collective Impact</Text>
          </View>
          <Text style={styles.collectiveText}>
            If 1 million people tracked like you this week, we'd save{' '}
            <Text style={styles.collectiveHighlight}>{collectiveMT.toLocaleString()} metric tons</Text>{' '}
            of CO₂ — equivalent to taking{' '}
            <Text style={styles.collectiveHighlight}>
              {Math.round(collectiveMT / 4.6).toLocaleString()} cars
            </Text>{' '}
            off the road for a year.
          </Text>
        </View>

        {/* Action tracker cards */}
        {activeActions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyTitle}>No actions yet</Text>
            <Text style={styles.emptyText}>
              Head to the Actions tab to commit to eco-habits, then track them here daily.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>My Committed Actions</Text>
            {activeActions.map(id => (
              <ActionTrackerCard
                key={id}
                actionId={id}
                logs={actionLogs}
                weekDates={weekDates}
                onLog={completed => logAction(id, completed)}
              />
            ))}
          </>
        )}

        {/* Impact milestones */}
        <View style={styles.milestonesCard}>
          <Text style={styles.milestonesTitle}>Impact Milestones</Text>
          {[
            { icon: '🌱', label: 'First action logged', done: weeklyDone >= 1 },
            { icon: '🔥', label: '7-day streak on any action', done: false },
            { icon: '🌳', label: '10 actions logged total', done: weeklyDone >= 10 },
            { icon: '⚡', label: 'Committed to 5+ actions', done: totalCommitted >= 5 },
            { icon: '🌍', label: '0.1 ton CO₂ saved this week', done: co2SavedWeek >= 0.1 },
          ].map(m => (
            <View key={m.label} style={styles.milestoneRow}>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  content: { padding: 16, paddingBottom: 40, gap: 14 },
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
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
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
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: EcoColors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: EcoColors.textMuted,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  statSub: { fontSize: 10, color: EcoColors.textMuted },
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
  collectiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  collectiveTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: EcoColors.secondary,
  },
  collectiveText: {
    fontSize: 13,
    color: EcoColors.text,
    lineHeight: 20,
  },
  collectiveHighlight: {
    fontWeight: '700',
    color: EcoColors.secondary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: EcoColors.text,
    marginBottom: 2,
  },
  trackerCard: {
    backgroundColor: EcoColors.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: EcoColors.border,
    marginBottom: 0,
    shadowColor: EcoColors.green800,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  trackerCardDone: {
    borderColor: EcoColors.green400,
  },
  trackerCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
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
  weekGrid: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 4,
  },
  dayCol: { flex: 1, alignItems: 'center', gap: 4 },
  dayLabel: { fontSize: 9, color: EcoColors.textMuted, fontWeight: '500' },
  dayLabelToday: { color: EcoColors.primary, fontWeight: '700' },
  dayCellOuter: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: EcoColors.primary,
    borderRadius: 8,
  },
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: EcoColors.text },
  emptyText: {
    fontSize: 13,
    color: EcoColors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 280,
  },
  milestonesCard: {
    backgroundColor: EcoColors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: EcoColors.border,
  },
  milestonesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: EcoColors.text,
    marginBottom: 12,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: EcoColors.gray100,
  },
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
