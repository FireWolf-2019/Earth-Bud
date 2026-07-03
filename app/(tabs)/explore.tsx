import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

import { EcoColors } from '@/constants/theme';
import {
  useAppStore,
  FootprintData,
  calculateFootprint,
  FootprintResult,
} from '@/store/app-store';

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionIcon}>{icon}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function OptionRow({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <View style={styles.optionRow}>
      <Text style={styles.optionLabel}>{label}</Text>
      <View style={styles.optionButtons}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.optBtn, selected === opt.value && styles.optBtnActive]}
            onPress={() => onSelect(opt.value)}>
            <Text style={[styles.optBtnText, selected === opt.value && styles.optBtnTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function StepRow({
  label,
  value,
  unit,
  onDecrement,
  onIncrement,
}: {
  label: string;
  value: number;
  unit: string;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <View style={styles.stepRow}>
      <Text style={styles.optionLabel}>{label}</Text>
      <View style={styles.stepper}>
        <TouchableOpacity style={styles.stepBtn} onPress={onDecrement}>
          <Ionicons name="remove" size={18} color={EcoColors.primary} />
        </TouchableOpacity>
        <Text style={styles.stepValue}>
          {value} <Text style={styles.stepUnit}>{unit}</Text>
        </Text>
        <TouchableOpacity style={styles.stepBtn} onPress={onIncrement}>
          <Ionicons name="add" size={18} color={EcoColors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.stepRow}>
      <Text style={styles.optionLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: EcoColors.gray300, true: EcoColors.green400 }}
        thumbColor={value ? EcoColors.primary : EcoColors.gray400}
      />
    </View>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(value / max, 1);
  return (
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          { width: `${pct * 100}%` as any, backgroundColor: color },
        ]}
      />
    </View>
  );
}

function CompareBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const fillHeight = Math.max((value / max) * 80, 4);
  return (
    <View style={styles.compareBarCol}>
      <Text style={styles.compareBarValue}>{value}t</Text>
      <View style={styles.compareBarTrack}>
        <View style={[styles.compareBarFill, { height: fillHeight, backgroundColor: color }]} />
      </View>
      <Text style={styles.compareBarLabel}>{label}</Text>
    </View>
  );
}

function getInsight(r: FootprintResult): string {
  if (r.total < 5)
    return "Outstanding! Your footprint is well below the global average. You're leading by example.";
  if (r.total < 10)
    return `Your biggest opportunity is ${getBiggest(r)}. Small changes there could save 1+ ton annually.`;
  if (r.total < 16)
    return `You're below the US average! Focus on ${getBiggest(r)} to get closer to a sustainable 2.5 tons.`;
  return `Your footprint is above the US average. ${getBiggest(r)} is your largest category — check the Actions tab for practical steps.`;
}

function getBiggest(r: FootprintResult): string {
  const cats: Record<string, number> = {
    transport: r.transport,
    home: r.home,
    diet: r.diet,
    shopping: r.shopping,
  };
  return Object.entries(cats).sort(([, a], [, b]) => b - a)[0][0];
}

function ResultCard({ result }: { result: FootprintResult }) {
  const statusColor =
    result.total <= 5
      ? EcoColors.success
      : result.total <= 10
      ? EcoColors.warning
      : EcoColors.danger;

  const breakdown = [
    { label: 'Transport', value: result.transport, color: EcoColors.catOcean, emoji: '🚗' },
    { label: 'Home', value: result.home, color: EcoColors.catEnergy, emoji: '🏠' },
    { label: 'Diet', value: result.diet, color: EcoColors.catWildlife, emoji: '🥗' },
    { label: 'Shopping', value: result.shopping, color: EcoColors.catPolicy, emoji: '🛍️' },
  ];

  const maxBar = Math.max(...breakdown.map(b => b.value), 0.1);

  return (
    <View style={styles.resultCard}>
      <LinearGradient
        colors={[statusColor + '15', statusColor + '05']}
        style={styles.resultGradient}>
        {/* Total + Earths */}
        <View style={styles.resultTop}>
          <View>
            <Text style={styles.resultLabel}>Your Annual Footprint</Text>
            <Text style={[styles.resultTons, { color: statusColor }]}>
              {result.total}
              <Text style={styles.resultUnit}> tons CO₂</Text>
            </Text>
          </View>
          <View style={styles.earthBox}>
            <Text style={styles.earthEmoji}>🌍</Text>
            <Text style={[styles.earthCount, { color: statusColor }]}>{result.earthsNeeded}x</Text>
            <Text style={styles.earthLabel}>Earths</Text>
          </View>
        </View>

        {/* Bar comparison */}
        <View style={styles.compareRow}>
          <CompareBar label="You" value={result.total} max={20} color={statusColor} />
          <CompareBar label="US Avg" value={16} max={20} color={EcoColors.catEnergy} />
          <CompareBar label="World" value={4} max={20} color={EcoColors.secondary} />
          <CompareBar label="Target" value={2.5} max={20} color={EcoColors.success} />
        </View>

        {/* Breakdown bars */}
        <Text style={styles.breakdownLabel}>Breakdown</Text>
        {breakdown.map(b => (
          <View key={b.label} style={styles.breakdownRow}>
            <Text style={styles.breakdownEmoji}>{b.emoji}</Text>
            <Text style={styles.breakdownName}>{b.label}</Text>
            <ProgressBar value={b.value} max={maxBar} color={b.color} />
            <Text style={[styles.breakdownValue, { color: b.color }]}>{b.value}t</Text>
          </View>
        ))}

        {/* Insight */}
        <View style={styles.insightBox}>
          <Ionicons name="bulb-outline" size={16} color={EcoColors.secondary} />
          <Text style={styles.insightText}>{getInsight(result)}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function FootprintScreen() {
  const { state, dispatch } = useAppStore();
  const [data, setData] = useState<FootprintData>(state.footprintData);
  const [showResults, setShowResults] = useState(state.footprintCompleted);

  function update<K extends keyof FootprintData>(key: K, value: FootprintData[K]) {
    setData(prev => ({ ...prev, [key]: value }));
  }

  function calculate() {
    dispatch({ type: 'SET_FOOTPRINT', payload: data });
    dispatch({ type: 'SET_FOOTPRINT_COMPLETED', payload: true });
    setShowResults(true);
  }

  const result = calculateFootprint(data);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[EcoColors.green800, EcoColors.green600]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}>
        <Text style={styles.headerTitle}>Your Carbon Footprint</Text>
        <Text style={styles.headerSub}>
          Understand your environmental impact and find where to improve
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {showResults ? (
          <>
            <ResultCard result={result} />
            <TouchableOpacity style={styles.recalcBtn} onPress={() => setShowResults(false)}>
              <Ionicons name="refresh-outline" size={16} color={EcoColors.primary} />
              <Text style={styles.recalcText}>Update My Answers</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Transportation */}
            <View style={styles.section}>
              <SectionHeader icon="🚗" title="Transportation" />
              <StepRow
                label="Car miles per week"
                value={data.carMilesPerWeek}
                unit="mi/wk"
                onDecrement={() =>
                  update('carMilesPerWeek', Math.max(0, data.carMilesPerWeek - 25))
                }
                onIncrement={() => update('carMilesPerWeek', data.carMilesPerWeek + 25)}
              />
              <StepRow
                label="Flights per year"
                value={data.flightsPerYear}
                unit="flights"
                onDecrement={() => update('flightsPerYear', Math.max(0, data.flightsPerYear - 1))}
                onIncrement={() => update('flightsPerYear', data.flightsPerYear + 1)}
              />
              <ToggleRow
                label="Use public transit regularly"
                value={data.usesPublicTransit}
                onChange={v => update('usesPublicTransit', v)}
              />
            </View>

            {/* Home Energy */}
            <View style={styles.section}>
              <SectionHeader icon="🏠" title="Home Energy" />
              <StepRow
                label="Electricity (kWh/month)"
                value={data.electricityKwhPerMonth}
                unit="kWh"
                onDecrement={() =>
                  update('electricityKwhPerMonth', Math.max(0, data.electricityKwhPerMonth - 100))
                }
                onIncrement={() =>
                  update('electricityKwhPerMonth', data.electricityKwhPerMonth + 100)
                }
              />
              <OptionRow
                label="Natural gas / heating use"
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Med' },
                  { value: 'high', label: 'High' },
                ]}
                selected={data.gasUsage}
                onSelect={v => update('gasUsage', v as FootprintData['gasUsage'])}
              />
            </View>

            {/* Diet */}
            <View style={styles.section}>
              <SectionHeader icon="🥗" title="Diet" />
              <OptionRow
                label="What best describes your diet?"
                options={[
                  { value: 'vegan', label: 'Vegan' },
                  { value: 'vegetarian', label: 'Veg' },
                  { value: 'flexitarian', label: 'Flex' },
                  { value: 'omnivore', label: 'Omni' },
                  { value: 'heavy-meat', label: 'Meat+' },
                ]}
                selected={data.dietType}
                onSelect={v => update('dietType', v as FootprintData['dietType'])}
              />
              <OptionRow
                label="How often do you throw away uneaten food?"
                options={[
                  { value: 'rarely', label: 'Rarely' },
                  { value: 'sometimes', label: 'Sometimes' },
                  { value: 'often', label: 'Often' },
                ]}
                selected={data.foodWasteFrequency}
                onSelect={v => update('foodWasteFrequency', v as FootprintData['foodWasteFrequency'])}
              />
            </View>

            {/* Shopping */}
            <View style={styles.section}>
              <SectionHeader icon="🛍️" title="Shopping & Lifestyle" />
              <OptionRow
                label="How often do you buy new things?"
                options={[
                  { value: 'minimal', label: 'Minimal' },
                  { value: 'average', label: 'Average' },
                  { value: 'frequent', label: 'Frequent' },
                ]}
                selected={data.shoppingFrequency}
                onSelect={v => update('shoppingFrequency', v as FootprintData['shoppingFrequency'])}
              />
            </View>

            {/* Live preview */}
            <View style={styles.previewCard}>
              <Text style={styles.previewLabel}>Estimated total</Text>
              <Text style={styles.previewValue}>{result.total} tons CO₂/year</Text>
              <Text style={styles.previewSub}>
                {result.earthsNeeded} Earths needed ·{' '}
                {result.vsAverage < 1
                  ? `${Math.round((1 - result.vsAverage) * 100)}% below US avg`
                  : `${Math.round((result.vsAverage - 1) * 100)}% above US avg`}
              </Text>
            </View>

            <TouchableOpacity style={styles.calcBtn} onPress={calculate}>
              <LinearGradient
                colors={[EcoColors.green700, EcoColors.green500]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.calcBtnGrad}>
                <Ionicons name="calculator-outline" size={20} color="#fff" />
                <Text style={styles.calcBtnText}>Calculate My Footprint</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: EcoColors.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
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
    lineHeight: 18,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: EcoColors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: EcoColors.border,
    shadowColor: EcoColors.green800,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: EcoColors.green100,
  },
  sectionIcon: { fontSize: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: EcoColors.text },
  optionRow: { marginBottom: 14 },
  optionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: EcoColors.textSecondary,
    marginBottom: 8,
  },
  optionButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  optBtn: {
    flex: 1,
    minWidth: 50,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: EcoColors.border,
    backgroundColor: EcoColors.green50,
    alignItems: 'center',
  },
  optBtnActive: { backgroundColor: EcoColors.primary, borderColor: EcoColors.primary },
  optBtnText: { fontSize: 12, fontWeight: '600', color: EcoColors.textSecondary },
  optBtnTextActive: { color: '#fff' },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: EcoColors.green50,
    borderWidth: 1.5,
    borderColor: EcoColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    fontSize: 15,
    fontWeight: '700',
    color: EcoColors.primary,
    minWidth: 70,
    textAlign: 'center',
  },
  stepUnit: { fontSize: 11, fontWeight: '400', color: EcoColors.textMuted },
  previewCard: {
    backgroundColor: EcoColors.primaryPale,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: EcoColors.green300,
  },
  previewLabel: { fontSize: 12, color: EcoColors.textSecondary, fontWeight: '500', marginBottom: 4 },
  previewValue: { fontSize: 24, fontWeight: '800', color: EcoColors.primary },
  previewSub: { fontSize: 12, color: EcoColors.textSecondary, marginTop: 4 },
  calcBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 8 },
  calcBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  calcBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  recalcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 4,
  },
  recalcText: { color: EcoColors.primary, fontSize: 14, fontWeight: '600' },
  // Result Card
  resultCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: EcoColors.border,
    marginBottom: 16,
  },
  resultGradient: { padding: 20 },
  resultTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  resultLabel: {
    fontSize: 12,
    color: EcoColors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  resultTons: { fontSize: 36, fontWeight: '900' },
  resultUnit: { fontSize: 16, fontWeight: '400', color: EcoColors.textSecondary },
  earthBox: { alignItems: 'center' },
  earthEmoji: { fontSize: 32 },
  earthCount: { fontSize: 20, fontWeight: '800', marginTop: 2 },
  earthLabel: { fontSize: 11, color: EcoColors.textMuted },
  compareRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: EcoColors.border,
    height: 130,
  },
  compareBarCol: { alignItems: 'center', flex: 1 },
  compareBarValue: {
    fontSize: 11,
    fontWeight: '700',
    color: EcoColors.textSecondary,
    marginBottom: 4,
  },
  compareBarTrack: {
    width: 24,
    height: 80,
    backgroundColor: EcoColors.gray200,
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  compareBarFill: { width: '100%', borderRadius: 12 },
  compareBarLabel: {
    fontSize: 10,
    color: EcoColors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  breakdownLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: EcoColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  breakdownEmoji: { fontSize: 16, width: 22 },
  breakdownName: { fontSize: 13, color: EcoColors.text, width: 68 },
  breakdownValue: { fontSize: 13, fontWeight: '700', width: 34, textAlign: 'right' },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: EcoColors.gray200,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
  insightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: EcoColors.secondaryPale,
    borderRadius: 12,
  },
  insightText: { flex: 1, fontSize: 13, color: EcoColors.secondary, lineHeight: 19 },
});
