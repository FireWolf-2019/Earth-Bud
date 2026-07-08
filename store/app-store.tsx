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
  foodWasteFrequency: 'rarely' | 'sometimes' | 'often';
  shoppingFrequency: 'minimal' | 'average' | 'frequent';
}

export interface EduNote {
  id: string;
  content: string;
  date: string;
  moduleTag?: string;
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
  eduNotes: EduNote[];
  completedModules: string[];
  viewedModules: string[];
  activeActions: string[];
  actionLogs: ActionLog[];
  chatHistory: ChatMessage[];
  viewedActionIds: string[];
  tutorialSeen: boolean;
}

// ── Initial State ─────────────────────────────────────────────────────────────

const DEFAULT_FOOTPRINT: FootprintData = {
  carMilesPerWeek: 100,
  flightsPerYear: 2,
  usesPublicTransit: false,
  electricityKwhPerMonth: 900,
  gasUsage: 'medium',
  dietType: 'omnivore',
  foodWasteFrequency: 'sometimes',
  shoppingFrequency: 'average',
};

const INITIAL_STATE: AppState = {
  userName: '',
  footprintData: DEFAULT_FOOTPRINT,
  footprintCompleted: false,
  eduNotes: [],
  completedModules: [],
  viewedModules: [],
  activeActions: [],
  actionLogs: [],
  chatHistory: [],
  viewedActionIds: [],
  tutorialSeen: false,
};

// ── Actions ───────────────────────────────────────────────────────────────────

type AppAction =
  | { type: 'HYDRATE'; payload: AppState }
  | { type: 'SET_USER_NAME'; payload: string }
  | { type: 'SET_FOOTPRINT'; payload: FootprintData }
  | { type: 'SET_FOOTPRINT_COMPLETED'; payload: boolean }
  | { type: 'ADD_NOTE'; payload: EduNote }
  | { type: 'UPDATE_NOTE'; payload: EduNote }
  | { type: 'DELETE_NOTE'; payload: string }
  | { type: 'MARK_MODULE_VIEWED'; payload: string }
  | { type: 'COMPLETE_MODULE'; payload: string }
  | { type: 'TOGGLE_ACTION'; payload: string }
  | { type: 'LOG_ACTION'; payload: ActionLog }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'CLEAR_CHAT' }
  | { type: 'MARK_ACTION_VIEWED'; payload: string }
  | { type: 'SET_TUTORIAL_SEEN'; payload: boolean };

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
    case 'ADD_NOTE':
      return { ...state, eduNotes: [action.payload, ...state.eduNotes] };
    case 'UPDATE_NOTE':
      return {
        ...state,
        eduNotes: state.eduNotes.map(n => n.id === action.payload.id ? action.payload : n),
      };
    case 'DELETE_NOTE':
      return { ...state, eduNotes: state.eduNotes.filter(n => n.id !== action.payload) };
    case 'MARK_MODULE_VIEWED':
      return {
        ...state,
        viewedModules: state.viewedModules.includes(action.payload)
          ? state.viewedModules
          : [...state.viewedModules, action.payload],
      };
    case 'COMPLETE_MODULE':
      return {
        ...state,
        completedModules: state.completedModules.includes(action.payload)
          ? state.completedModules
          : [...state.completedModules, action.payload],
      };
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
    case 'MARK_ACTION_VIEWED':
      return {
        ...state,
        viewedActionIds: state.viewedActionIds.includes(action.payload)
          ? state.viewedActionIds
          : [...state.viewedActionIds, action.payload],
      };
    case 'SET_TUTORIAL_SEEN':
      return { ...state, tutorialSeen: action.payload };
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = '@eco_app_state_v1';

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  hydrated: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [hydrated, setHydrated] = React.useState(false);

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
      setHydrated(true);
    });
  }, []);

  // Persist on every state change — but only after hydration has completed.
  // Otherwise this fires once on mount with INITIAL_STATE and can clobber the
  // user's saved data before the HYDRATE dispatch lands.
  //
  // chatHistory is intentionally excluded from persistence: an EcoBot
  // conversation is session-only, so restarting the app returns the user to a
  // fresh prompt screen rather than reopening the last chat.
  useEffect(() => {
    if (!hydrated) return;
    const { chatHistory: _chatHistory, ...persisted } = state;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persisted)).catch(() => {});
  }, [state, hydrated]);

  return <AppContext.Provider value={{ state, dispatch, hydrated }}>{children}</AppContext.Provider>;
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
const FOOD_WASTE_TONS: Record<FootprintData['foodWasteFrequency'], number> = {
  rarely: 0.1, sometimes: 0.4, often: 0.9,
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

  const diet = DIET_TONS[data.dietType] + FOOD_WASTE_TONS[data.foodWasteFrequency];
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
  {
    id: 'reduce-food-waste',
    title: 'Reduce Food Waste',
    category: 'Food',
    difficulty: 'Easy',
    co2SavedPerYear: 0.3,
    emoji: '🍽️',
    background: 'About one-third of all food produced globally is wasted — responsible for 8% of global greenhouse gas emissions. In the US, the average household throws away $1,500 of food per year.',
    importance: 'Wasted food means wasted land, water, energy, and emissions. Preventing food waste before it happens is far more impactful than composting it afterward.',
    steps: [
      'Plan meals for the week before grocery shopping to avoid over-buying',
      'Store food correctly — keep herbs in water, move older items to the front of the fridge',
      'Use the "first in, first out" rule: eat what you bought first',
      'Repurpose leftovers into new meals (roast veg becomes soup, stale bread becomes croutons)',
      'Freeze anything you won\'t eat before it expires',
    ],
    collectiveImpact: 'If 1 million households halved their food waste, it would prevent 300,000 tons of CO₂ and save $750 million in wasted food annually.',
  },
  {
    id: 'buy-secondhand',
    title: 'Buy Secondhand & Reduce Fast Fashion',
    category: 'Lifestyle',
    difficulty: 'Easy',
    co2SavedPerYear: 0.7,
    emoji: '👕',
    background: 'The fashion industry produces 10% of global carbon emissions — more than aviation and shipping combined. Fast fashion brands release up to 52 "micro-seasons" per year, accelerating overproduction and waste.',
    importance: 'Buying secondhand extends the life of existing garments, avoiding the emissions of producing new ones. A single cotton t-shirt requires 2,700 litres of water and emits 2.1 kg of CO₂ to manufacture.',
    steps: [
      'Try thrift stores, charity shops, or apps like Depop, ThredUp, or Poshmark before buying new',
      'Before buying, ask: do I need this, or do I just want it right now?',
      'Repair clothes instead of replacing them — YouTube has tutorials for most fixes',
      'Organise a clothing swap with friends or colleagues',
      'When buying new, choose quality over quantity and look for sustainable brands',
    ],
    collectiveImpact: 'If 1 million people bought one secondhand item instead of new each month, it would prevent 840,000 tons of CO₂ and save 2.7 billion litres of water annually.',
  },
  {
    id: 'reduce-flying',
    title: 'Reduce Flights',
    category: 'Transport',
    difficulty: 'Hard',
    co2SavedPerYear: 2.0,
    emoji: '✈️',
    background: 'Aviation accounts for about 2.5% of global CO₂ emissions, but its total warming effect is estimated to be 3–4× higher when non-CO₂ impacts like contrails are included. A single transatlantic flight can emit more than a month of driving.',
    importance: 'Cutting even one long-haul flight per year is one of the highest-impact individual actions available. For frequent flyers, this dwarfs most other lifestyle changes combined.',
    steps: [
      'Consider train or bus travel for journeys under 500 miles — often comparable in time',
      'Consolidate trips: take fewer, longer vacations rather than many short ones',
      'Choose direct flights over connections — take-off and landing are the most emission-intensive phases',
      'If flying is unavoidable, offset through high-quality verified projects (Gold Standard or VCS certified)',
      'Advocate at work for video conferencing as a first resort for meetings',
    ],
    collectiveImpact: 'If 1 million frequent flyers eliminated one long-haul flight per year, it would save 2 million tons of CO₂ — equivalent to taking 430,000 cars off the road.',
  },
  {
    id: 'led-smart-plugs',
    title: 'Switch to LED & Cut Standby Power',
    category: 'Home',
    difficulty: 'Easy',
    co2SavedPerYear: 0.15,
    emoji: '💡',
    background: 'Lighting accounts for 15% of household electricity use. LEDs use 75% less energy than incandescent bulbs. Standby power ("vampire load") from electronics left plugged in accounts for 5–10% of home energy use.',
    importance: 'LED and standby fixes are the quickest, cheapest home changes with immediate bill and emissions savings. They require no behaviour change — just a one-time switch.',
    steps: [
      'Replace any remaining incandescent or halogen bulbs with LEDs (they pay back in months)',
      'Use smart power strips in your entertainment centre and office to cut standby load',
      'Unplug phone chargers, toasters, and other devices when not actively in use',
      'Enable energy-saving sleep modes on computers and monitors',
      'Install a smart thermostat to reduce heating and cooling when you\'re away',
    ],
    collectiveImpact: 'If every US household switched all bulbs to LED, it would save 44 billion kWh of electricity and prevent 30 million tons of CO₂ per year.',
  },
  {
    id: 'reduce-plastic',
    title: 'Go Beyond Reusables: Cut Single-Use Plastic',
    category: 'Lifestyle',
    difficulty: 'Easy',
    co2SavedPerYear: 0.1,
    emoji: '🚫',
    background: 'Over 380 million tonnes of plastic are produced each year; 50% is single-use. Plastic production is projected to account for 20% of global oil consumption by 2050. Microplastics are now found in human blood, breast milk, and the deep ocean.',
    importance: 'Refusing single-use plastic reduces fossil fuel extraction, prevents ocean pollution, and eliminates microplastic contamination at the source. Small daily choices add up to billions of pieces of prevented plastic.',
    steps: [
      'Switch to bar soap, shampoo bars, and refillable cleaning products to eliminate plastic bottles',
      'Buy loose produce instead of pre-packaged — bring mesh bags to the store',
      'Refuse plastic cutlery and straws; carry a small kit if you need them on the go',
      'Choose products with cardboard, glass, or aluminium packaging over plastic',
      'Find local refill stations for cleaning products and personal care items',
    ],
    collectiveImpact: 'If 1 million people eliminated 10 single-use plastic items per week, we\'d prevent 520 million plastic items from reaching landfill or oceans each year.',
  },
  {
    id: 'weatherize-home',
    title: 'Weatherize & Insulate Your Home',
    category: 'Home',
    difficulty: 'Medium',
    co2SavedPerYear: 0.5,
    emoji: '🏠',
    background: 'Up to 30% of home heating and cooling energy is lost through gaps, cracks, and poor insulation. The average US home has enough air leaks to equal leaving a window open all year.',
    importance: 'Weatherizing is a one-time investment with decades of compounding savings. It cuts bills, improves comfort, and reduces the amount of energy your home needs regardless of its source.',
    steps: [
      'Do a draft audit: hold a candle near windows, doors, and electrical outlets on a windy day',
      'Apply weatherstripping to door frames and window sashes (under $30, takes an hour)',
      'Caulk gaps around pipes, vents, and utility lines entering the house',
      'Add loft/attic insulation — the highest-return insulation upgrade',
      'Check if your state or utility offers rebates or free weatherization programs for qualifying households',
    ],
    collectiveImpact: 'If 1 million US homes were properly weatherized, it would eliminate 500,000 tons of CO₂ and save households an average of $350 per year on energy bills.',
  },
  {
    id: 'grow-food',
    title: 'Grow Your Own Food',
    category: 'Food',
    difficulty: 'Medium',
    co2SavedPerYear: 0.15,
    emoji: '🌱',
    background: 'Home-grown food has near-zero food miles, no packaging, and no cold-chain refrigeration. Gardens also sequester carbon in soil, support pollinators, and reduce stormwater runoff.',
    importance: 'Growing even a fraction of your own food builds a direct relationship with nature, reduces reliance on industrial food systems, and can meaningfully cut grocery packaging and transport emissions.',
    steps: [
      'Start small: a pot of herbs on a windowsill (basil, mint, chives) requires no outdoor space',
      'Try a raised bed for tomatoes, lettuce, courgettes, or beans — high yield, low effort',
      'Use compost from your compost bin to build healthy soil',
      'Connect with a community garden if you don\'t have outdoor space',
      'Preserve surplus produce by freezing, pickling, or sharing with neighbours',
    ],
    collectiveImpact: 'If 1 million households grew even 5% of their own food, it would eliminate 150,000 tons of transport and packaging emissions and strengthen local food resilience.',
  },
  {
    id: 'eco-volunteer',
    title: 'Volunteer for Local Eco-Projects',
    category: 'Lifestyle',
    difficulty: 'Easy',
    co2SavedPerYear: 0.05,
    emoji: '🤝',
    background: 'Community environmental action — beach cleanups, urban tree planting, river restoration — delivers ecological benefits that no individual habit change can replicate. Volunteers also multiply impact by inspiring others.',
    importance: 'Individual action matters, but collective action at a local level is essential for ecosystem restoration. Volunteering builds community, strengthens your environmental commitment, and creates visible change.',
    steps: [
      'Search for local environmental groups on Meetup, Eventbrite, or your council\'s website',
      'Join organisations like The Conservation Volunteers, local wildlife trusts, or Surfers Against Sewage',
      'Commit to one event per month — consistency compounds over a year',
      'Bring a friend: social participation makes habits stick and doubles the impact',
      'If no local group exists, start a neighbourhood cleanup with a NextDoor or WhatsApp post',
    ],
    collectiveImpact: 'If 1 million people volunteered one day per month for eco-restoration, it would add up to 12 million volunteer days per year — enough to restore thousands of acres of degraded habitat.',
  },
  {
    id: 'carpool',
    title: 'Carpool or Rideshare',
    category: 'Transport',
    difficulty: 'Easy',
    co2SavedPerYear: 0.6,
    emoji: '🚗',
    background: 'The average US car carries only 1.5 people. If every car carried just one extra passenger, we\'d effectively halve road transport emissions overnight. Carpooling also reduces congestion and parking demand.',
    importance: 'For people who can\'t cycle or access public transit, carpooling is the most accessible way to cut transport emissions without changing your destination or schedule.',
    steps: [
      'Ask colleagues if anyone lives near you — even one shared commute per week helps',
      'Use apps like BlaBlaCar, Waze Carpool, or your employer\'s rideshare board',
      'Coordinate school runs with nearby parents to halve trips',
      'For road trips, fill empty seats via carpooling platforms instead of driving alone',
      'Agree on a fair cost-split for fuel to keep it sustainable long term',
    ],
    collectiveImpact: 'If 1 million solo commuters shared their ride just twice a week, it would remove the equivalent of 600,000 tons of CO₂ from the atmosphere annually.',
  },
  {
    id: 'digital-footprint',
    title: 'Shrink Your Digital Carbon Footprint',
    category: 'Lifestyle',
    difficulty: 'Easy',
    co2SavedPerYear: 0.1,
    emoji: '📱',
    background: 'The internet and digital devices account for about 4% of global greenhouse gas emissions — on par with the aviation industry. Streaming video alone generates 300 million tonnes of CO₂ per year. Data centres consumed 200 TWh of electricity in 2022.',
    importance: 'Digital emissions are invisible but fast-growing. Small changes in streaming quality, email habits, and device usage collectively reduce the energy demand of the data centres powering our digital lives.',
    steps: [
      'Lower streaming quality from 4K to HD when picture detail doesn\'t matter',
      'Clear your email inbox and unsubscribe from newsletters you don\'t read (storage has a carbon cost)',
      'Use Wi-Fi instead of mobile data — it\'s roughly 4× more energy-efficient',
      'Extend the life of your devices — manufacturing a new smartphone emits ~70 kg CO₂',
      'Close unused browser tabs and quit apps you\'re not using to reduce background processing',
    ],
    collectiveImpact: 'If 1 million people reduced daily screen time by 30 minutes and lowered streaming quality, it would save an estimated 100,000 tons of CO₂ per year from data centre demand.',
  },
];

