import {
  calculateFootprint,
  reducer,
  AppState,
  FootprintData,
  ChatMessage,
} from './app-store';

const BASE: FootprintData = {
  carMilesPerWeek: 100,
  flightsPerYear: 2,
  usesPublicTransit: false,
  electricityKwhPerMonth: 900,
  gasUsage: 'medium',
  dietType: 'omnivore',
  foodWasteFrequency: 'sometimes',
  shoppingFrequency: 'average',
};

describe('calculateFootprint', () => {
  it('matches the hand-computed total for the default profile', () => {
    const result = calculateFootprint(BASE);

    // transport: (100*52*0.404/1000 + 2*0.9) * 1.0 = 2.1008 + 1.8 = 3.9008
    // home: (900*12*0.42/1000) + 1.2 = 4.536 + 1.2 = 5.736
    // diet: 3.3 + 0.4 = 3.7
    // shopping: 2.3
    // total: 3.9008 + 5.736 + 3.7 + 2.3 = 15.6368 -> 15.6
    expect(result.total).toBeCloseTo(15.6, 1);
    expect(result.transport).toBeCloseTo(3.9, 1);
    expect(result.home).toBeCloseTo(5.7, 1);
    expect(result.diet).toBeCloseTo(3.7, 1);
    expect(result.shopping).toBeCloseTo(2.3, 1);
  });

  it('derives earthsNeeded and vsAverage from total', () => {
    const result = calculateFootprint(BASE);
    expect(result.earthsNeeded).toBeCloseTo(result.total / 3.8, 1);
    expect(result.vsAverage).toBeCloseTo(result.total / 16, 1);
  });

  it('reduces transport emissions when public transit is used', () => {
    const withTransit = calculateFootprint({ ...BASE, usesPublicTransit: true });
    const withoutTransit = calculateFootprint({ ...BASE, usesPublicTransit: false });
    expect(withTransit.transport).toBeLessThan(withoutTransit.transport);
  });

  it('produces zero transport and home-gas emissions for a zero-usage profile', () => {
    const result = calculateFootprint({
      ...BASE,
      carMilesPerWeek: 0,
      flightsPerYear: 0,
      electricityKwhPerMonth: 0,
      gasUsage: 'none',
    });
    expect(result.transport).toBe(0);
    expect(result.home).toBe(0);
  });

  it('orders diet footprint from vegan (lowest) to heavy-meat (highest)', () => {
    const vegan = calculateFootprint({ ...BASE, dietType: 'vegan' });
    const vegetarian = calculateFootprint({ ...BASE, dietType: 'vegetarian' });
    const flexitarian = calculateFootprint({ ...BASE, dietType: 'flexitarian' });
    const omnivore = calculateFootprint({ ...BASE, dietType: 'omnivore' });
    const heavyMeat = calculateFootprint({ ...BASE, dietType: 'heavy-meat' });

    expect(vegan.diet).toBeLessThan(vegetarian.diet);
    expect(vegetarian.diet).toBeLessThan(flexitarian.diet);
    expect(flexitarian.diet).toBeLessThan(omnivore.diet);
    expect(omnivore.diet).toBeLessThan(heavyMeat.diet);
  });

  it('increases home footprint monotonically with gas usage tier', () => {
    const none = calculateFootprint({ ...BASE, gasUsage: 'none' });
    const low = calculateFootprint({ ...BASE, gasUsage: 'low' });
    const medium = calculateFootprint({ ...BASE, gasUsage: 'medium' });
    const high = calculateFootprint({ ...BASE, gasUsage: 'high' });

    expect(none.home).toBeLessThan(low.home);
    expect(low.home).toBeLessThan(medium.home);
    expect(medium.home).toBeLessThan(high.home);
  });
});

const INITIAL_STATE: AppState = {
  userName: '',
  footprintData: BASE,
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

describe('reducer', () => {
  it('sets the user name', () => {
    const next = reducer(INITIAL_STATE, { type: 'SET_USER_NAME', payload: 'Ada' });
    expect(next.userName).toBe('Ada');
  });

  it('prepends new notes so the most recent is first', () => {
    const first = reducer(INITIAL_STATE, {
      type: 'ADD_NOTE',
      payload: { id: '1', content: 'first', date: '2026-01-01' },
    });
    const second = reducer(first, {
      type: 'ADD_NOTE',
      payload: { id: '2', content: 'second', date: '2026-01-02' },
    });
    expect(second.eduNotes.map(n => n.id)).toEqual(['2', '1']);
  });

  it('deletes a note by id', () => {
    const withNote = reducer(INITIAL_STATE, {
      type: 'ADD_NOTE',
      payload: { id: '1', content: 'note', date: '2026-01-01' },
    });
    const withoutNote = reducer(withNote, { type: 'DELETE_NOTE', payload: '1' });
    expect(withoutNote.eduNotes).toEqual([]);
  });

  it('does not duplicate a module marked viewed twice', () => {
    const once = reducer(INITIAL_STATE, { type: 'MARK_MODULE_VIEWED', payload: 'water-cycle' });
    const twice = reducer(once, { type: 'MARK_MODULE_VIEWED', payload: 'water-cycle' });
    expect(twice.viewedModules).toEqual(['water-cycle']);
  });

  it('toggles an active action on and off', () => {
    const added = reducer(INITIAL_STATE, { type: 'TOGGLE_ACTION', payload: 'composting' });
    expect(added.activeActions).toEqual(['composting']);

    const removed = reducer(added, { type: 'TOGGLE_ACTION', payload: 'composting' });
    expect(removed.activeActions).toEqual([]);
  });

  it('replaces an existing log for the same date and action instead of duplicating', () => {
    const logged = reducer(INITIAL_STATE, {
      type: 'LOG_ACTION',
      payload: { date: '2026-01-01', actionId: 'composting', completed: true },
    });
    const relogged = reducer(logged, {
      type: 'LOG_ACTION',
      payload: { date: '2026-01-01', actionId: 'composting', completed: false },
    });
    expect(relogged.actionLogs).toHaveLength(1);
    expect(relogged.actionLogs[0].completed).toBe(false);
  });

  it('caps chat history at 50 messages, dropping the oldest', () => {
    let state = INITIAL_STATE;
    for (let i = 0; i < 55; i++) {
      const message: ChatMessage = { role: 'user', content: `msg ${i}`, timestamp: i };
      state = reducer(state, { type: 'ADD_CHAT_MESSAGE', payload: message });
    }
    expect(state.chatHistory).toHaveLength(50);
    expect(state.chatHistory[0].content).toBe('msg 5');
    expect(state.chatHistory[49].content).toBe('msg 54');
  });

  it('clears chat history', () => {
    const withMessage = reducer(INITIAL_STATE, {
      type: 'ADD_CHAT_MESSAGE',
      payload: { role: 'user', content: 'hi', timestamp: 0 },
    });
    const cleared = reducer(withMessage, { type: 'CLEAR_CHAT' });
    expect(cleared.chatHistory).toEqual([]);
  });

  it('merges HYDRATE payload over the initial state defaults', () => {
    const hydrated = reducer(INITIAL_STATE, {
      type: 'HYDRATE',
      payload: { ...INITIAL_STATE, userName: 'Restored' },
    });
    expect(hydrated.userName).toBe('Restored');
    expect(hydrated.footprintCompleted).toBe(false);
  });
});
