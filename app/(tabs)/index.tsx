import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Animated,
  Easing,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';

import { EcoColors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';

// ── Module Data ───────────────────────────────────────────────────────────────

interface Chapter {
  title: string;
  content: string;
}

interface Module {
  id: string;
  name: string;
  hook: string;
  emoji: string;
  gradient: [string, string];
  chapters: Chapter[];
}

const MODULES: Module[] = [
  {
    id: 'atmosphere',
    name: 'The Atmosphere',
    hook: "Earth's invisible shield that makes life possible",
    emoji: '🌤️',
    gradient: ['#38BDF8', '#0284C7'],
    chapters: [
      {
        title: 'What is it?',
        content:
          "Earth's atmosphere is a thin blanket of gases held in place by gravity, extending about 480 km above our surface. Despite its vast reach, 99% of its mass sits within just 32 km — a layer no thicker relative to Earth than the skin of an apple. It is composed of 78% nitrogen, 21% oxygen, and 1% of other gases including argon, water vapour, and carbon dioxide.",
      },
      {
        title: 'How it works',
        content:
          "The atmosphere acts as Earth's thermostat and shield simultaneously. The greenhouse effect — where gases like CO₂ and water vapour trap outgoing heat — keeps our planet at a habitable average of 15°C rather than a frigid -18°C. The stratosphere's ozone layer absorbs 97–99% of the sun's ultraviolet radiation. Temperature gradients between the equator and poles drive wind systems that redistribute heat and moisture across the globe, creating the weather patterns that shape all life on Earth.",
      },
      {
        title: "Why it's remarkable",
        content:
          "Without the atmosphere, Earth would be a barren rock bombarded by radiation, incapable of holding liquid water. The ozone layer — if compressed to sea level, it would be just 3mm thick — is the only thing between us and doses of UV radiation that would destroy DNA. The precise balance of atmospheric gases is extraordinary: slightly more CO₂ and we would be Venus; slightly less and we would be Mars.",
      },
      {
        title: 'Where things stand today',
        content:
          "Atmospheric CO₂ has risen from 280 ppm before industrialisation to over 424 ppm today — the highest in at least 3 million years. The good news is the ozone layer is actively recovering: the Montreal Protocol (1987), which banned ozone-depleting chemicals, is one of humanity's most successful international agreements. Scientists project the ozone hole over Antarctica will fully heal by 2066.",
      },
      {
        title: 'Reasons for hope',
        content:
          "Renewable energy is growing faster than any energy source in history, beginning to slow the rise of CO₂. Carbon capture technology is advancing rapidly. And the ozone recovery is living proof that when humanity acts collectively on an atmospheric crisis, we can reverse real damage. The atmosphere is resilient — it just needs reduced pressure and time.",
      },
    ],
  },
  {
    id: 'forests',
    name: 'Forests & Ecosystems',
    hook: 'The living networks that connect and sustain all life',
    emoji: '🌲',
    gradient: ['#4ADE80', '#15803D'],
    chapters: [
      {
        title: 'What is it?',
        content:
          "Forests cover about 31% of Earth's land surface — approximately 4 billion hectares. They are complex, layered ecosystems supporting an estimated 80% of all terrestrial species, from soil bacteria to apex predators. An ecosystem is a community of living organisms interacting with each other and their physical environment as one interconnected system.",
      },
      {
        title: 'How it works',
        content:
          "Forests function through intricate webs of energy and material exchange. Trees capture solar energy through photosynthesis, converting CO₂ into biomass while releasing oxygen. Their roots communicate through underground fungal networks — the 'Wood Wide Web' — sharing nutrients and chemical signals between trees. Every species plays a role: remove one, and ripple effects cascade unpredictably through the whole system.",
      },
      {
        title: "Why it's remarkable",
        content:
          "A single hectare of tropical rainforest can host over 400 tree species — more than all of temperate North America. One teaspoon of healthy forest soil contains more organisms than there are people on Earth. Over 75% of the world's flowering plants depend on animal pollinators. Fig trees and fig wasps have co-evolved for 75 million years in a relationship so specialised that each fig species has its own dedicated wasp.",
      },
      {
        title: 'Where things stand today',
        content:
          "The world loses about 4.7 million hectares of forest per year — primarily to agriculture. But the picture is improving in many regions. Amazon deforestation fell 32% in 2025. Reforestation movements are gaining momentum globally, and regenerative agriculture is offering ways to farm productively while rebuilding natural ecosystems alongside crops.",
      },
      {
        title: 'Reasons for hope',
        content:
          "Rewilding projects across Europe are returning wolves, lynx, and beavers to landscapes that haven't seen them in centuries — with dramatic ecosystem recoveries following. The Trillion Tree Campaign has already mobilised the planting of over 14 billion trees. Indigenous-managed territories consistently show the best forest health worldwide, and recognition of indigenous land rights is growing internationally.",
      },
    ],
  },
  {
    id: 'oceans',
    name: 'Oceans & Water',
    hook: "Earth's great regulator of climate, weather, and life",
    emoji: '🌊',
    gradient: ['#0EA5E9', '#0C4A6E'],
    chapters: [
      {
        title: 'What is it?',
        content:
          "Earth's five interconnected oceans cover 71% of our planet's surface and contain 97% of all water on Earth. The average depth is 3.7 km, plunging to nearly 11 km at the Mariana Trench. Oceans are not simply habitat — they are Earth's primary climate regulator, heat sink, and one of the largest sources of the oxygen we breathe.",
      },
      {
        title: 'How it works',
        content:
          "Oceans regulate climate through the thermohaline circulation — a global conveyor belt of currents driven by differences in water temperature and salinity. This system distributes heat from the tropics to the poles, making Northern Europe far warmer than its latitude would otherwise allow. Oceans absorb about 90% of the excess heat generated by our activities and roughly 25% of CO₂ emissions.",
      },
      {
        title: "Why it's remarkable",
        content:
          "Over 80% of the ocean remains unexplored. New species are discovered on virtually every deep-sea expedition. Bioluminescent creatures light the perpetual darkness of the deep. The blue whale — the largest animal ever to exist on Earth — navigates using vocalisations that travel thousands of miles. Hydrothermal vents sustain entire ecosystems powered not by sunlight but by chemical energy.",
      },
      {
        title: 'Where things stand today',
        content:
          "Oceans are warming and becoming more acidic as they absorb CO₂, stressing coral reefs and shell-forming organisms. But plastic pollution has been declining in heavily targeted areas. Marine protected areas now cover about 8% of ocean surface, with international agreements pushing toward 30% by 2030. Coral restoration science is producing heat-resistant varieties with genuine long-term promise.",
      },
      {
        title: 'Reasons for hope',
        content:
          "The ocean is profoundly resilient. Marine protected areas recover remarkably quickly — some reefs see fish populations double within a decade of protection. Whale populations, once devastated by hunting, are recovering across multiple species. The global momentum toward ocean protection is stronger than it has ever been.",
      },
    ],
  },
  {
    id: 'biodiversity',
    name: 'Biodiversity',
    hook: 'The web of life — where every thread matters',
    emoji: '🦋',
    gradient: ['#86EFAC', '#059669'],
    chapters: [
      {
        title: 'What is it?',
        content:
          "Biodiversity refers to the variety of life on Earth — estimated at 8.7 million species, of which only about 1.2 million have been formally described. It exists at three levels: genetic diversity within species, species diversity within ecosystems, and ecosystem diversity across the planet. Each level reinforces the others, creating the resilience that allows life to adapt and persist.",
      },
      {
        title: 'How it works',
        content:
          "Biodiversity underpins 'ecosystem services' — the processes that make Earth habitable. Bees and other pollinators support roughly 75% of global food crops. Forests filter water and regulate rainfall. Mangroves protect coastlines from storms more effectively than concrete seawalls. Microbes in soil and ocean drive the nutrient cycles that all other life depends on.",
      },
      {
        title: "Why it's remarkable",
        content:
          "When wolves were reintroduced to Yellowstone in 1995, they transformed not just prey populations but river courses — elk behaviour changed, riverbanks stabilised, trees regrew, and beaver populations returned. This 'trophic cascade' showed that top predators don't just control prey; they sculpt entire landscapes. Life has colonised every conceivable niche: boiling hydrothermal vents, Antarctic ice, the upper stratosphere.",
      },
      {
        title: 'Where things stand today',
        content:
          "Species are being lost at a rate 100–1,000× the natural background rate, driven by habitat loss, invasive species, pollution, and climate change. But there are remarkable success stories: humpback whales have recovered from near-extinction, California condors were brought back from just 27 individuals in 1987, and wolves are naturally expanding their range across Europe.",
      },
      {
        title: 'Reasons for hope',
        content:
          "Conservation science has advanced enormously. Environmental DNA (eDNA) testing can detect species from water or soil samples. The 30x30 initiative — protecting 30% of land and ocean by 2030 — has gathered over 100 country commitments. Protected areas, when properly managed and funded, genuinely work.",
      },
    ],
  },
  {
    id: 'carbon',
    name: 'The Carbon Cycle',
    hook: 'How carbon moves through Earth — and why it matters',
    emoji: '🔄',
    gradient: ['#A8A29E', '#44403C'],
    chapters: [
      {
        title: 'What is it?',
        content:
          "The carbon cycle is the continuous movement of carbon atoms between the atmosphere, land, oceans, and living things. Carbon is the backbone of all life on Earth — it forms every protein, every cell, every fossil fuel. The cycle operates on timescales from seconds (photosynthesis) to millions of years (geological processes).",
      },
      {
        title: 'How it works',
        content:
          "Plants draw CO₂ from the atmosphere through photosynthesis, converting it into sugars and organic matter. Animals eat plants, incorporating that carbon into their bodies. When organisms die, decomposers break them down, releasing CO₂ back to the atmosphere or locking carbon into soil. Oceans absorb atmospheric CO₂, where it is used by marine life or sinks to the ocean floor.",
      },
      {
        title: "Why it's remarkable",
        content:
          "Every carbon atom in your body has been recycled through billions of years of living and dead organisms — you literally share atoms with ancient forests and long-extinct creatures. The natural carbon cycle is exquisitely balanced. Photosynthesis and respiration together process roughly 120 billion tons of carbon every single year.",
      },
      {
        title: 'Where things stand today',
        content:
          "Human activities add about 10 billion tons of carbon to the atmosphere annually, exceeding what natural sinks can absorb. But soil carbon restoration, afforestation, and ocean protection are all increasing natural carbon uptake. Direct air capture technology, while still expensive, is scaling faster than expected.",
      },
      {
        title: 'Reasons for hope',
        content:
          "Natural carbon sinks are larger than previously thought. Boreal forests, restored wetlands, and ocean phytoplankton can sequester enormous amounts of carbon. Agricultural soil restoration, applied globally, could sequester up to 1.85 billion tons of carbon per year. The carbon cycle, disrupted by human activity, can be aided back toward balance by deliberate human action.",
      },
    ],
  },
  {
    id: 'soil',
    name: 'Soil & Land',
    hook: "The living skin beneath our feet — Earth's quiet foundation",
    emoji: '🌱',
    gradient: ['#D97706', '#92400E'],
    chapters: [
      {
        title: 'What is it?',
        content:
          "Soil is Earth's thin living skin — typically just 15–35 cm deep — and one of the most complex ecosystems on the planet. It is composed of mineral particles, organic matter, water, air, and an extraordinary density of living organisms. Covering about 25% of Earth's land, healthy soil is the foundation of all terrestrial food webs, agriculture, and freshwater systems.",
      },
      {
        title: 'How it works',
        content:
          "Soil forms over thousands of years through the weathering of rock and the accumulation of organic matter. Soil organisms — bacteria, fungi, nematodes, earthworms — break down organic material into nutrients that plants can absorb. Fungal networks (mycorrhizae) extend into plant roots, dramatically expanding their ability to take up water and nutrients in exchange for sugars.",
      },
      {
        title: "Why it's remarkable",
        content:
          "One gram of healthy soil contains more bacteria than there are people on Earth. An earthworm processes its own weight in organic matter daily. It takes up to 1,000 years for nature to build just 2–3 cm of topsoil — yet we can lose that in a single season of intensive farming. Despite this fragility, degraded soils can begin recovering in years to decades with the right practices.",
      },
      {
        title: 'Where things stand today',
        content:
          "About one-third of Earth's soils are degraded by intensive agriculture, erosion, and chemical overuse. But regenerative agriculture — cover cropping, reduced tillage, composting, diverse crop rotation — is gaining rapid adoption worldwide. Farmers using these practices consistently report improved yields over time alongside dramatically reduced input costs.",
      },
      {
        title: 'Reasons for hope',
        content:
          "Over 2 million acres of US Midwest farmland have transitioned to regenerative practices, with measurable improvements in soil carbon. The soil restoration movement is growing from the ground up — driven by farmers who see healthier land producing better results. Soil that took centuries to deplete can begin recovering within a few years of better management.",
      },
    ],
  },
  {
    id: 'energy',
    name: 'Renewable Energy',
    hook: 'How humanity is learning to power itself with nature',
    emoji: '☀️',
    gradient: ['#FDE68A', '#D97706'],
    chapters: [
      {
        title: 'What is it?',
        content:
          "Renewable energy comes from naturally replenished sources: sunlight, wind, water, geothermal heat, and biomass. Unlike fossil fuels — which took millions of years to form and release carbon when burned — renewables produce energy without depleting a resource or emitting CO₂. The transition from fossil fuels to renewables is the central technological challenge and opportunity of our generation.",
      },
      {
        title: 'How it works',
        content:
          "Solar panels convert photons from sunlight directly into electricity using photovoltaic cells made primarily of silicon. Wind turbines convert the kinetic energy of moving air into electrical power. Hydropower captures the potential energy of falling or flowing water. As batteries improve, these sources can be stored for when the sun isn't shining or the wind isn't blowing.",
      },
      {
        title: "Why it's remarkable",
        content:
          "The solar energy reaching Earth's surface in one hour exceeds all energy consumed by human civilisation in an entire year. The cost of solar electricity has fallen over 90% in the past decade — making it the cheapest electricity source in history across much of the world. In 2023, renewables added more capacity globally than all fossil fuel plants combined — a historic first.",
      },
      {
        title: 'Where things stand today',
        content:
          "Renewable energy is the fastest-growing energy sector globally. Over 40% of global electricity now comes from low-carbon sources. Installed renewable capacity has surpassed coal globally for the first time. Battery storage costs are falling almost as fast as solar did, unlocking 24/7 clean power.",
      },
      {
        title: 'Reasons for hope',
        content:
          "The energy transition is happening faster than almost any expert predicted even a decade ago. Every record broken — lowest cost, highest capacity — accelerates the next. Electric vehicles are following the same cost curve as solar. The question is no longer whether the transition happens — it is how fast.",
      },
    ],
  },
];

// ── Challenge Panel Data ──────────────────────────────────────────────────────

interface StatRow {
  emoji: string;
  value: string;
  label: string;
}

interface ChallengeSlide {
  id: string;
  chipLabel: string;
  gradient: [string, string, ...string[]];
  heroText?: string;
  heroCaption?: string;
  title: string;
  body: string;
  statRows?: StatRow[];
  showCta?: boolean;
}

const CHALLENGE_SLIDES: ChallengeSlide[] = [
  {
    id: 'warming',
    chipLabel: 'GLOBAL TEMPERATURE RISE',
    gradient: ['#0C4A6E', '#1E3A5F', '#92400E'],
    heroText: '+1.2°C',
    heroCaption: 'since pre-industrial times',
    title: 'A Warming World',
    body: "Earth's average temperature has risen 1.2°C over the last century and a half. That number seems small — its consequences are not.",
  },
  {
    id: 'co2',
    chipLabel: 'ATMOSPHERIC CO₂',
    gradient: ['#14532D', '#1C3A2A', '#44403C'],
    heroText: '424 ppm',
    heroCaption: 'highest in 3 million years',
    title: 'Driven By Us',
    body: 'Carbon dioxide in our atmosphere has reached levels unseen in 3 million years. Every year we burn fossil fuels, that number climbs further from the balance that made life possible.',
  },
  {
    id: 'stakes',
    chipLabel: "WHAT'S AT STAKE",
    gradient: ['#0C4A6E', '#0E4D4D', '#064E3B'],
    title: "What's at Stake",
    body: 'A warmer world reshapes every system Earth depends on — not just temperatures.',
    statRows: [
      { emoji: '🧊', value: '3.7mm', label: 'Sea level rise per year' },
      { emoji: '🔥', value: '5×', label: 'More extreme weather since 1970' },
      { emoji: '🐾', value: '1M+', label: 'Species at risk of extinction' },
    ],
  },
  {
    id: 'hope',
    chipLabel: 'REASONS TO ACT',
    gradient: ['#14532D', '#15803D', '#16A34A'],
    heroText: '↓ 90%',
    heroCaption: 'solar energy cost drop this decade',
    title: 'The Turn Has Begun',
    body: 'Renewables are now the cheapest electricity in history. The tools to turn this around exist — and the momentum is real.',
    showCta: true,
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

type SubTab = 'challenge' | 'modules';

function SubTabBar({
  active,
  onChange,
}: {
  active: SubTab;
  onChange: (t: SubTab) => void;
}) {
  const tabs: { key: SubTab; label: string }[] = [
    { key: 'challenge', label: 'The Challenge' },
    { key: 'modules', label: 'Modules' },
  ];
  return (
    <View style={styles.subTabBar}>
      {tabs.map(t => (
        <TouchableOpacity
          key={t.key}
          style={[styles.subTabBtn, active === t.key && styles.subTabBtnActive]}
          onPress={() => onChange(t.key)}
          activeOpacity={0.75}>
          <Text style={[styles.subTabText, active === t.key && styles.subTabTextActive]}>
            {t.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Challenge Panels ──────────────────────────────────────────────────────────

function SlideHeroPulse({ text }: { text: string }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.04,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulse]);

  return (
    <Animated.Text style={[styles.slideHero, { transform: [{ scale: pulse }] }]}>
      {text}
    </Animated.Text>
  );
}

function ChallengePanel({ onGoToModules }: { onGoToModules: () => void }) {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const x = e.nativeEvent.contentOffset.x;
    setActiveIndex(Math.round(x / width));
  }

  return (
    <View style={styles.challengeWrapper}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}>
        {CHALLENGE_SLIDES.map(slide => (
          <LinearGradient
            key={slide.id}
            colors={slide.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.4, y: 1 }}
            style={[styles.slide, { width }]}>

            {/* Top chip */}
            <View style={styles.slideChip}>
              <Text style={styles.slideChipText}>{slide.chipLabel}</Text>
            </View>

            {/* Hero number or stat rows */}
            {slide.statRows ? (
              <View style={styles.statRowsContainer}>
                {slide.statRows.map(row => (
                  <View key={row.label} style={styles.statRow}>
                    <Text style={styles.statEmoji}>{row.emoji}</Text>
                    <Text style={styles.statValue}>{row.value}</Text>
                    <Text style={styles.statLabel}>{row.label}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.heroBlock}>
                <SlideHeroPulse text={slide.heroText!} />
                <Text style={styles.slideCaption}>{slide.heroCaption}</Text>
              </View>
            )}

            {/* Title + body */}
            <View style={styles.slideTextBlock}>
              <Text style={styles.slideTitle}>{slide.title}</Text>
              <Text style={styles.slideBody}>{slide.body}</Text>
            </View>

            {/* CTA (last slide only) */}
            {slide.showCta && (
              <TouchableOpacity
                style={styles.slideCta}
                onPress={onGoToModules}
                activeOpacity={0.85}>
                <Text style={styles.slideCtaText}>Explore the Modules</Text>
                <Ionicons name="arrow-forward" size={16} color={EcoColors.green700} />
              </TouchableOpacity>
            )}

            {/* Swipe hint on first slide */}
            {slide.id === 'warming' && (
              <View style={styles.swipeHint}>
                <Text style={styles.swipeHintText}>swipe to explore</Text>
                <Ionicons name="chevron-forward" size={13} color="rgba(255,255,255,0.5)" />
              </View>
            )}
          </LinearGradient>
        ))}
      </ScrollView>

      {/* Dot indicator */}
      <View style={styles.dots}>
        {CHALLENGE_SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

// ── Module Card & Lesson Modal ────────────────────────────────────────────────

function ModuleCard({
  module,
  completed,
  onPress,
}: {
  module: Module;
  completed: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.moduleCard} onPress={onPress} activeOpacity={0.85}>
      <LinearGradient
        colors={module.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.moduleGradient}>
        <Text style={styles.moduleEmoji}>{module.emoji}</Text>
        {completed && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
          </View>
        )}
      </LinearGradient>
      <View style={styles.moduleInfo}>
        <Text style={styles.moduleName}>{module.name}</Text>
        <Text style={styles.moduleHook} numberOfLines={2}>{module.hook}</Text>
        <View style={styles.moduleFooter}>
          <Text style={styles.moduleChapters}>{module.chapters.length} chapters</Text>
          <Ionicons name="chevron-forward" size={14} color={EcoColors.textMuted} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function FloatingEmoji({ emoji }: { emoji: string }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: -12,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [anim]);

  return (
    <Animated.Text style={[styles.lessonEmoji, { transform: [{ translateY: anim }] }]}>
      {emoji}
    </Animated.Text>
  );
}

function LessonModal({
  module,
  onClose,
}: {
  module: Module | null;
  onClose: () => void;
}) {
  const { dispatch } = useAppStore();

  useEffect(() => {
    if (module) {
      dispatch({ type: 'MARK_MODULE_VIEWED', payload: module.id });
    }
    // Only re-fire when the module identity (id) changes, not on every
    // re-render — `dispatch` is a stable useReducer reference.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module?.id, dispatch]);

  if (!module) return null;

  function handleScrollEnd() {
    dispatch({ type: 'COMPLETE_MODULE', payload: module!.id });
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.lessonContainer}>
        <View style={styles.lessonHeader}>
          <TouchableOpacity onPress={onClose} style={styles.lessonCloseBtn}>
            <Ionicons name="close" size={24} color={EcoColors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          onScrollEndDrag={handleScrollEnd}
          scrollEventThrottle={400}>
          <LinearGradient
            colors={module.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.lessonHero}>
            <FloatingEmoji emoji={module.emoji} />
            <Text style={styles.lessonHeroName}>{module.name}</Text>
            <Text style={styles.lessonHeroHook}>{module.hook}</Text>
          </LinearGradient>

          <View style={styles.chaptersContainer}>
            {module.chapters.map((ch, i) => (
              <View key={i} style={styles.chapter}>
                <View style={styles.chapterNumberRow}>
                  <View style={styles.chapterDot} />
                  <Text style={styles.chapterNumber}>Chapter {i + 1}</Text>
                </View>
                <Text style={styles.chapterTitle}>{ch.title}</Text>
                <Text style={styles.chapterContent}>{ch.content}</Text>
              </View>
            ))}

            <TouchableOpacity
              style={styles.involvedBanner}
              onPress={() => { onClose(); router.push('/(tabs)/actions'); }}
              activeOpacity={0.85}>
              <LinearGradient
                colors={[EcoColors.green700, EcoColors.green500]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.involvedGradient}>
                <Ionicons name="flash" size={20} color="#fff" />
                <View style={styles.involvedText}>
                  <Text style={styles.involvedTitle}>Want to get involved?</Text>
                  <Text style={styles.involvedSub}>See actions you can take today →</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function EducationScreen() {
  const { state } = useAppStore();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('challenge');
  const [activeModule, setActiveModule] = useState<Module | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[EcoColors.green800, EcoColors.green600]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}>
        <Text style={styles.headerTitle}>Our Planet</Text>
        <Text style={styles.headerSub}>Explore the systems that make Earth extraordinary</Text>
      </LinearGradient>

      <SubTabBar active={activeSubTab} onChange={setActiveSubTab} />

      {/* The Challenge */}
      {activeSubTab === 'challenge' && (
        <ChallengePanel onGoToModules={() => setActiveSubTab('modules')} />
      )}

      {/* Modules */}
      {activeSubTab === 'modules' && (
        <FlatList
          data={MODULES}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listPad}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ModuleCard
              module={item}
              completed={state.completedModules.includes(item.id)}
              onPress={() => setActiveModule(item)}
            />
          )}
        />
      )}

      <LessonModal module={activeModule} onClose={() => setActiveModule(null)} />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: EcoColors.background },

  // Header
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: EcoColors.green200, marginTop: 3 },

  // Sub-tab bar
  subTabBar: {
    flexDirection: 'row',
    backgroundColor: EcoColors.white,
    borderBottomWidth: 1,
    borderBottomColor: EcoColors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  subTabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: EcoColors.green50,
    borderWidth: 1,
    borderColor: EcoColors.border,
  },
  subTabBtnActive: { backgroundColor: EcoColors.primary, borderColor: EcoColors.primary },
  subTabText: { fontSize: 12, fontWeight: '600', color: EcoColors.textSecondary },
  subTabTextActive: { color: '#fff' },

  listPad: { padding: 16, paddingBottom: 32 },

  // Challenge panels
  challengeWrapper: { flex: 1 },
  slide: {
    flex: 1,
    paddingHorizontal: 28,
    paddingVertical: 32,
    justifyContent: 'space-evenly',
  },
  slideChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  slideChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1.2,
  },
  heroBlock: { alignItems: 'flex-start', gap: 6 },
  slideHero: {
    fontSize: 72,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -2,
    lineHeight: 80,
  },
  slideCaption: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  slideTextBlock: { gap: 10 },
  slideTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  slideBody: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 23,
    fontWeight: '400',
  },
  statRowsContainer: { gap: 16 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  statEmoji: { fontSize: 28, width: 36 },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
    width: 72,
  },
  statLabel: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
  },
  slideCta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  slideCtaText: { fontSize: 14, fontWeight: '700', color: EcoColors.green700 },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
  },
  swipeHintText: { fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: '500' },

  // Dot indicator
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 7,
    backgroundColor: EcoColors.background,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: EcoColors.green200,
  },
  dotActive: {
    width: 22,
    backgroundColor: EcoColors.primary,
  },

  // Module cards
  moduleCard: {
    flexDirection: 'row',
    backgroundColor: EcoColors.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: EcoColors.green800,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: EcoColors.border,
  },
  moduleGradient: {
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  moduleEmoji: { fontSize: 36 },
  completedBadge: { position: 'absolute', top: 6, right: 6 },
  moduleInfo: { flex: 1, padding: 14, justifyContent: 'space-between' },
  moduleName: { fontSize: 16, fontWeight: '700', color: EcoColors.text, marginBottom: 4 },
  moduleHook: { fontSize: 13, color: EcoColors.textSecondary, lineHeight: 18, flex: 1 },
  moduleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  moduleChapters: { fontSize: 11, color: EcoColors.textMuted, fontWeight: '500' },

  // Lesson modal
  lessonContainer: { flex: 1, backgroundColor: EcoColors.white },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: EcoColors.border,
  },
  lessonCloseBtn: { padding: 4 },
  lessonHero: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 10,
  },
  lessonEmoji: { fontSize: 72 },
  lessonHeroName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  lessonHeroHook: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 20,
  },
  chaptersContainer: { padding: 20, gap: 24 },
  chapter: { gap: 6 },
  chapterNumberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chapterDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: EcoColors.primary },
  chapterNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: EcoColors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chapterTitle: { fontSize: 18, fontWeight: '700', color: EcoColors.text, lineHeight: 24 },
  chapterContent: { fontSize: 15, color: EcoColors.textSecondary, lineHeight: 24 },
  involvedBanner: { borderRadius: 16, overflow: 'hidden', marginTop: 8 },
  involvedGradient: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  involvedText: { flex: 1 },
  involvedTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  involvedSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
});
