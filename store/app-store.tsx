import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useReducer } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

export interface FootprintData {
  carMilesPerWeek: number;
  flightsPerYear: number;
  usesPublicTransit: boolean;
  electricityKwhPerMonth: number;
  gasUsage: 'none' | 'low' | 'medium' | 'high';
  dietType: 'vegan' | 'vegetarian' | 'flexitarian' | 'omnivore' | 'heavy-meat';
  shoppingFrequency: 'minimal' | 'average' | 'frequent';
}

export interface CustomBlog {
  id: string;
  title: string;
  author: string;
  content: string;
  date: string;
  category: string;
}

export interface ActionLog {
  date: string;       // 'YYYY-MM-DD'
  actionId: string;
  completed: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AppState {
  userName: string;
  footprintData: FootprintData;
  footprintCompleted: boolean;
  customBlogs: CustomBlog[];
  activeActions: string[];
  actionLogs: ActionLog[];
  chatHistory: ChatMessage[];
  anthropicApiKey: string;
  viewedArticles: string[];
  viewedActionIds: string[];
}

// ── Initial State ─────────────────────────────────────────────────────────────

const DEFAULT_FOOTPRINT: FootprintData = {
  carMilesPerWeek: 100,
  flightsPerYear: 2,
  usesPublicTransit: false,
  electricityKwhPerMonth: 900,
  gasUsage: 'medium',
  dietType: 'omnivore',
  shoppingFrequency: 'average',
};

const INITIAL_STATE: AppState = {
  userName: '',
  footprintData: DEFAULT_FOOTPRINT,
  footprintCompleted: false,
  customBlogs: [],
  activeActions: [],
  actionLogs: [],
  chatHistory: [],
  anthropicApiKey: '',
  viewedArticles: [],
  viewedActionIds: [],
};

// ── Actions ───────────────────────────────────────────────────────────────────

type AppAction =
  | { type: 'HYDRATE'; payload: AppState }
  | { type: 'SET_USER_NAME'; payload: string }
  | { type: 'SET_FOOTPRINT'; payload: FootprintData }
  | { type: 'SET_FOOTPRINT_COMPLETED'; payload: boolean }
  | { type: 'ADD_BLOG'; payload: CustomBlog }
  | { type: 'DELETE_BLOG'; payload: string }
  | { type: 'TOGGLE_ACTION'; payload: string }
  | { type: 'LOG_ACTION'; payload: ActionLog }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'CLEAR_CHAT' }
  | { type: 'SET_API_KEY'; payload: string }
  | { type: 'MARK_ARTICLE_VIEWED'; payload: string }
  | { type: 'MARK_ACTION_VIEWED'; payload: string };

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...INITIAL_STATE, ...action.payload };
    case 'SET_USER_NAME':
      return { ...state, userName: action.payload };
    case 'SET_FOOTPRINT':
      return { ...state, footprintData: action.payload };
    case 'SET_FOOTPRINT_COMPLETED':
      return { ...state, footprintCompleted: action.payload };
    case 'ADD_BLOG':
      return { ...state, customBlogs: [action.payload, ...state.customBlogs] };
    case 'DELETE_BLOG':
      return { ...state, customBlogs: state.customBlogs.filter(b => b.id !== action.payload) };
    case 'TOGGLE_ACTION': {
      const id = action.payload;
      const active = state.activeActions.includes(id)
        ? state.activeActions.filter(a => a !== id)
        : [...state.activeActions, id];
      return { ...state, activeActions: active };
    }
    case 'LOG_ACTION': {
      const log = action.payload;
      const filtered = state.actionLogs.filter(
        l => !(l.date === log.date && l.actionId === log.actionId)
      );
      return { ...state, actionLogs: [...filtered, log] };
    }
    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatHistory: [...state.chatHistory.slice(-49), action.payload] };
    case 'CLEAR_CHAT':
      return { ...state, chatHistory: [] };
    case 'SET_API_KEY':
      return { ...state, anthropicApiKey: action.payload };
    case 'MARK_ARTICLE_VIEWED':
      return {
        ...state,
        viewedArticles: state.viewedArticles.includes(action.payload)
          ? state.viewedArticles
          : [...state.viewedArticles, action.payload],
      };
    case 'MARK_ACTION_VIEWED':
      return {
        ...state,
        viewedActionIds: state.viewedActionIds.includes(action.payload)
          ? state.viewedActionIds
          : [...state.viewedActionIds, action.payload],
      };
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = '@eco_app_state_v1';

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  // Hydrate from storage on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try {
          const saved = JSON.parse(raw) as Partial<AppState>;
          dispatch({ type: 'HYDRATE', payload: { ...INITIAL_STATE, ...saved } });
        } catch {
          // ignore corrupt data
        }
      }
    });
  }, []);

  // Persist on every state change
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used inside AppProvider');
  return ctx;
}

// ── Carbon Footprint Calculator ───────────────────────────────────────────────

export interface FootprintResult {
  total: number;
  transport: number;
  home: number;
  diet: number;
  shopping: number;
  earthsNeeded: number;
  vsAverage: number; // ratio vs US average of 16 tons
}

const GAS_MULT: Record<FootprintData['gasUsage'], number> = {
  none: 0, low: 0.6, medium: 1.2, high: 2.0,
};
const DIET_TONS: Record<FootprintData['dietType'], number> = {
  vegan: 1.5, vegetarian: 1.7, flexitarian: 2.2, omnivore: 3.3, 'heavy-meat': 5.0,
};
const SHOP_TONS: Record<FootprintData['shoppingFrequency'], number> = {
  minimal: 0.9, average: 2.3, frequent: 4.1,
};

export function calculateFootprint(data: FootprintData): FootprintResult {
  const transitFactor = data.usesPublicTransit ? 0.72 : 1.0;
  const carTons = (data.carMilesPerWeek * 52 * 0.404) / 1000;
  const flightTons = data.flightsPerYear * 0.9;
  const transport = (carTons + flightTons) * transitFactor;

  const elecTons = (data.electricityKwhPerMonth * 12 * 0.42) / 1000;
  const gasTons = GAS_MULT[data.gasUsage];
  const home = elecTons + gasTons;

  const diet = DIET_TONS[data.dietType];
  const shopping = SHOP_TONS[data.shoppingFrequency];

  const total = transport + home + diet + shopping;
  const earthsNeeded = parseFloat((total / 3.8).toFixed(1)); // 3.8 tons = 1-Earth share
  const vsAverage = parseFloat((total / 16).toFixed(2));

  return {
    total: parseFloat(total.toFixed(1)),
    transport: parseFloat(transport.toFixed(1)),
    home: parseFloat(home.toFixed(1)),
    diet: parseFloat(diet.toFixed(1)),
    shopping: parseFloat(shopping.toFixed(1)),
    earthsNeeded,
    vsAverage,
  };
}

// ── Actions Data ──────────────────────────────────────────────────────────────

export interface EcoAction {
  id: string;
  title: string;
  category: 'Food' | 'Transport' | 'Home' | 'Lifestyle';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  co2SavedPerYear: number; // tons
  emoji: string;
  background: string;
  importance: string;
  steps: string[];
  collectiveImpact: string;
}

export const ECO_ACTIONS: EcoAction[] = [
  {
    id: 'composting',
    title: 'Start Composting',
    category: 'Lifestyle',
    difficulty: 'Easy',
    co2SavedPerYear: 0.2,
    emoji: '♻️',
    background: 'Food waste in landfills decomposes anaerobically, releasing methane — a greenhouse gas 80× more potent than CO₂ over 20 years. In the US, food waste accounts for 8% of total greenhouse gas emissions.',
    importance: 'Composting diverts organic waste from landfills, eliminates methane production, and creates nutrient-rich soil that stores carbon and reduces the need for synthetic fertilizers.',
    steps: [
      'Get a compost bin or designate a corner of your yard',
      'Add "greens" (food scraps, coffee grounds) and "browns" (cardboard, dry leaves) in 1:2 ratio',
      'Keep it moist and turn weekly for airflow',
      'In 2–3 months, use finished compost in your garden or donate to a community garden',
    ],
    collectiveImpact: 'If 1 million people composted, we could divert 2.3 million tons of waste from landfills annually.',
  },
  {
    id: 'bike-commute',
    title: 'Bike or Walk Instead of Drive',
    category: 'Transport',
    difficulty: 'Medium',
    co2SavedPerYear: 1.2,
    emoji: '🚲',
    background: 'Transportation accounts for 29% of US greenhouse gas emissions — the largest sector. The average American car emits 4.6 metric tons of CO₂ per year.',
    importance: 'Replacing just one car trip per day with cycling or walking can cut your transport emissions by up to 67%. It also reduces air pollutants that affect local health.',
    steps: [
      'Identify which errands or commutes are under 3 miles (easily bikeable)',
      'Get a bike or e-bike, or find a local bike-share program',
      'Plan a safe route using a cycling app like Google Maps bike mode',
      'Start with one day per week and build up gradually',
    ],
    collectiveImpact: 'If 1 million commuters switched one day per week to cycling, it would remove 630,000 tons of CO₂ annually.',
  },
  {
    id: 'plant-trees',
    title: 'Plant Trees',
    category: 'Lifestyle',
    difficulty: 'Easy',
    co2SavedPerYear: 0.06,
    emoji: '🌳',
    background: 'Forests absorb about 2.6 billion tons of CO₂ per year globally. A single mature tree absorbs roughly 48 lbs (22 kg) of CO₂ per year and can store over 1 ton of CO₂ over its lifetime.',
    importance: 'Trees sequester carbon, provide habitat for wildlife, reduce urban heat islands, filter air pollutants, and protect watersheds. Planting native species has additional biodiversity benefits.',
    steps: [
      'Choose native tree species suited to your region (consult local nurseries)',
      'Plant in fall or spring when soil moisture is ideal',
      'Dig a hole 2× as wide as the root ball, no deeper',
      'Water weekly for the first year — the critical establishment period',
      'Or donate to tree-planting orgs like One Tree Planted or Trees for the Future',
    ],
    collectiveImpact: 'Planting 1 billion trees globally could absorb 205 billion tons of carbon over the coming decades.',
  },
  {
    id: 'reduce-meat',
    title: 'Eat Less Meat',
    category: 'Food',
    difficulty: 'Medium',
    co2SavedPerYear: 0.9,
    emoji: '🥦',
    background: 'Animal agriculture produces 14.5% of global greenhouse gases. Beef production alone requires 20× more land and emits 20× more greenhouse gases per gram of protein compared to plant proteins.',
    importance: 'Shifting to a plant-rich diet is one of the highest-impact individual actions available. Even reducing meat consumption by 50% significantly lowers your dietary carbon footprint.',
    steps: [
      'Start with Meatless Monday — one day per week without meat',
      'Explore plant-based proteins: lentils, beans, tofu, tempeh, chickpeas',
      'When eating meat, choose chicken or pork over beef (3–4× lower emissions)',
      'Try plant-based substitutes for familiar meals (bean tacos, lentil bolognese)',
      'Reduce food waste, as wasted food means wasted emissions',
    ],
    collectiveImpact: 'If every American skipped beef once per week, it would equal taking 7.6 million cars off the road.',
  },
  {
    id: 'reduce-energy',
    title: 'Reduce Home Energy Use',
    category: 'Home',
    difficulty: 'Easy',
    co2SavedPerYear: 0.6,
    emoji: '⚡',
    background: 'Residential buildings account for 20% of US CO₂ emissions. Heating, cooling, and water heating are the biggest consumers. Many simple behavior changes cost nothing.',
    importance: 'Energy efficiency is the cheapest and fastest path to emissions reduction. It lowers bills while reducing fossil fuel dependence.',
    steps: [
      'Set your thermostat 2°F lower in winter and higher in summer',
      'Switch to LED bulbs (use 75% less energy than incandescent)',
      'Unplug devices and chargers when not in use (phantom load adds up)',
      'Wash clothes in cold water and line-dry when possible',
      'Seal drafts around windows and doors with weatherstripping',
    ],
    collectiveImpact: 'If every US household reduced energy use by 15%, we\'d cut emissions equivalent to 40 million cars.',
  },
  {
    id: 'reusable-items',
    title: 'Switch to Reusables',
    category: 'Lifestyle',
    difficulty: 'Easy',
    co2SavedPerYear: 0.15,
    emoji: '🍶',
    background: 'Single-use plastics account for 40% of all plastic produced. Plastic takes 400–1,000 years to break down and most ends up in landfills or oceans. Production also requires fossil fuels.',
    importance: 'Reusable alternatives eliminate ongoing plastic production and disposal. A reusable bag used 52 times a year offsets the carbon cost of making it within months.',
    steps: [
      'Carry a reusable water bottle (saves an average of 156 plastic bottles/year)',
      'Keep reusable grocery bags by the door or in your car',
      'Switch to a reusable coffee cup (saves 365 cups/year)',
      'Use beeswax wraps or silicone bags instead of plastic wrap',
      'Choose products with minimal or recyclable packaging',
    ],
    collectiveImpact: 'If 1 million people switched to reusable bottles, we\'d prevent 156 million plastic bottles from entering the waste stream each year.',
  },
  {
    id: 'renewable-energy',
    title: 'Switch to Renewable Energy',
    category: 'Home',
    difficulty: 'Hard',
    co2SavedPerYear: 2.0,
    emoji: '☀️',
    background: 'Electricity generation is responsible for 25% of US greenhouse gas emissions. Solar power costs have fallen 90% in the last decade, making it cost-competitive with fossil fuels in most regions.',
    importance: 'Switching to solar or a green energy plan is one of the highest-impact home decisions you can make, eliminating the carbon footprint of your entire electrical usage.',
    steps: [
      'Check your electricity provider for a green energy option (often no upfront cost)',
      'Request a home energy audit (many utilities offer free audits)',
      'Get solar quotes from 3 installers — compare cost, warranties, and financing',
      'Consider community solar if rooftop solar isn\'t feasible',
      'If renting, ask your landlord about green energy options or look for RECs',
    ],
    collectiveImpact: 'If 10% of US homes switched to solar, it would prevent 85 million tons of CO₂ annually.',
  },
  {
    id: 'water-conservation',
    title: 'Conserve Water',
    category: 'Home',
    difficulty: 'Easy',
    co2SavedPerYear: 0.1,
    emoji: '💧',
    background: 'Water treatment and distribution account for 3–4% of US energy consumption. Heating water is also a major home energy use. Freshwater scarcity affects 2 billion people globally.',
    importance: 'Reducing water use cuts both water scarcity impacts and the energy needed to treat and distribute water. Hot water reduction directly cuts your carbon footprint.',
    steps: [
      'Install low-flow showerheads and faucet aerators (saves 700 gallons/month)',
      'Fix leaky faucets — a dripping tap can waste 3,000 gallons per year',
      'Take shorter showers (each minute saved = ~2 gallons)',
      'Only run dishwashers and washing machines with full loads',
      'Collect rainwater for garden watering',
    ],
    collectiveImpact: 'If every US household reduced water use by 10%, it would save the energy equivalent of powering 1.5 million homes.',
  },
  {
    id: 'buy-local',
    title: 'Buy Local & Seasonal Food',
    category: 'Food',
    difficulty: 'Easy',
    co2SavedPerYear: 0.25,
    emoji: '🥕',
    background: 'The average meal in the US travels 1,500 miles to reach your plate. Food transportation, refrigeration, and out-of-season greenhouse growing all add significant carbon costs.',
    importance: 'Buying local reduces transportation emissions, supports regional farmers, and seasonal eating aligns with natural growing cycles that require fewer energy inputs.',
    steps: [
      'Visit your local farmers\' market — find one at localfarmers.org',
      'Join a CSA (Community Supported Agriculture) box for weekly local produce',
      'Learn which fruits and vegetables are in season in your region',
      'Choose local options at grocery stores (look for the state of origin)',
      'Grow a small herb or vegetable garden if you have space',
    ],
    collectiveImpact: 'If every American replaced one imported meal per week with local food, it would save 6 million tons of transport emissions annually.',
  },
  {
    id: 'public-transit',
    title: 'Use Public Transit',
    category: 'Transport',
    difficulty: 'Medium',
    co2SavedPerYear: 2.4,
    emoji: '🚌',
    background: 'A single commuter switching from driving alone to public transit can reduce CO₂ emissions by more than 4,800 pounds per year — equivalent to planting a small forest.',
    importance: 'Public transit is 45× safer and produces far less CO₂ per passenger-mile than single-occupancy vehicles. It also reduces urban congestion and air pollution.',
    steps: [
      'Download your city\'s transit app and plan your first route',
      'Try transit for one commute per week to start',
      'Get a monthly pass to make it economical',
      'Use the time for reading, music, or catching up on podcasts',
      'Combine with biking using bike-on-bus or bike-share options',
    ],
    collectiveImpact: 'If 1% more Americans regularly used public transit, it would reduce CO₂ by 37 million tons per year.',
  },
];

// ── News Data ─────────────────────────────────────────────────────────────────

export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  date: string;
  category: string;
  summary: string;
  readTime: string;
  isUserBlog?: boolean;
}

export const MOCK_NEWS: NewsArticle[] = [
  {
    id: 'n1',
    title: 'Global Renewable Energy Capacity Surpasses Coal for the First Time',
    source: 'Clean Energy Monitor',
    date: '2026-06-15',
    category: 'Energy',
    summary: 'The International Energy Agency reports that installed renewable energy capacity has crossed 4,000 GW globally, overtaking coal for the first time in history. Solar alone added 450 GW in 2025, driven by rapid cost declines and government incentives across 80 countries.',
    readTime: '4 min',
  },
  {
    id: 'n2',
    title: 'Amazon Rainforest Shows Signs of Recovery in Key Protected Zones',
    source: 'Environmental Science Journal',
    date: '2026-06-14',
    category: 'Wildlife',
    summary: 'New satellite imagery and ground surveys reveal that deforestation in the Brazilian Amazon fell by 32% in 2025 compared to the previous year. Protected indigenous territories show the strongest recovery, with canopy cover increasing and biodiversity returning in previously degraded areas.',
    readTime: '5 min',
  },
  {
    id: 'n3',
    title: 'Ocean Plastic Cleanup Project Removes 10 Million Pounds from Pacific',
    source: 'Ocean Health Network',
    date: '2026-06-13',
    category: 'Ocean',
    summary: 'The Ocean Cleanup organization announced a landmark achievement, having removed over 10 million pounds of plastic from the Great Pacific Garbage Patch. Their latest autonomous systems intercepted plastic before it entered ocean gyres, preventing an estimated 40% more waste from accumulating.',
    readTime: '3 min',
  },
  {
    id: 'n4',
    title: 'UN Climate Summit Sets Ambitious 2035 Methane Reduction Targets',
    source: 'Global Policy Review',
    date: '2026-06-12',
    category: 'Policy',
    summary: '140 nations signed the landmark Geneva Methane Accord, pledging to cut methane emissions by 45% from 2020 levels by 2035. Methane is 80× more potent than CO₂ over 20 years, and experts say rapid reductions are the fastest path to slowing near-term warming.',
    readTime: '6 min',
  },
  {
    id: 'n5',
    title: 'Record-Breaking Coral Reef Restoration Off Florida Keys',
    source: 'Marine Ecology Today',
    date: '2026-06-11',
    category: 'Ocean',
    summary: 'Scientists have successfully transplanted over 100,000 heat-resistant coral fragments to the Florida Reef Tract, the largest coral restoration effort in US history. The heat-tolerant coral strains were selectively bred to survive the warmer ocean temperatures projected through 2050.',
    readTime: '4 min',
  },
  {
    id: 'n6',
    title: 'Electric Vehicle Sales Hit 40% of New Car Market in Europe',
    source: 'Mobility Futures',
    date: '2026-06-10',
    category: 'Energy',
    summary: 'Europe crossed a major milestone as EV sales reached 40% market share in May 2026, up from 25% a year prior. Norway leads with 95% EV adoption. Analysts attribute the surge to competitive pricing, expanded charging infrastructure, and new EU regulations phasing out combustion engines by 2030.',
    readTime: '4 min',
  },
  {
    id: 'n7',
    title: 'New Study: Urban Trees Cut Heat-Related Deaths by 36%',
    source: 'Public Health & Environment',
    date: '2026-06-09',
    category: 'Climate',
    summary: 'A landmark study across 93 cities found that urban tree canopy coverage reduced heat-related mortality by up to 36% during extreme heat events. Cities with over 30% tree cover showed the strongest effects. Researchers recommend tree-planting as a critical climate adaptation strategy.',
    readTime: '5 min',
  },
  {
    id: 'n8',
    title: 'India Hits 500 GW Renewable Energy Milestone Ahead of Schedule',
    source: 'Asia Climate Report',
    date: '2026-06-08',
    category: 'Energy',
    summary: 'India reached 500 gigawatts of installed renewable capacity, meeting its 2030 target four years early. The country now generates 45% of its electricity from clean sources. A new national plan targets 1,000 GW by 2030, alongside massive investments in green hydrogen and battery storage.',
    readTime: '3 min',
  },
  {
    id: 'n9',
    title: 'Wildfires in Canada Burn Record 8 Million Acres; Smoke Reaches Europe',
    source: 'Climate Crisis Wire',
    date: '2026-06-07',
    category: 'Climate',
    summary: 'An unprecedented early wildfire season in Canada has already burned 8 million acres by June, fueled by record spring temperatures and drought conditions linked to climate change. Air quality alerts have been issued across 12 US states, and smoke plumes have reached as far as Western Europe.',
    readTime: '5 min',
  },
  {
    id: 'n10',
    title: 'Regenerative Agriculture Expanding Rapidly Across US Midwest',
    source: 'Sustainable Farming Weekly',
    date: '2026-06-06',
    category: 'Wildlife',
    summary: 'Over 2 million acres of Midwest farmland have transitioned to regenerative practices including cover cropping, reduced tillage, and rotational grazing. Early data shows a 20–30% increase in soil carbon sequestration and significant improvements in soil health, water retention, and biodiversity.',
    readTime: '4 min',
  },
];
