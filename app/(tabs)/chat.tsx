import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

import { EcoColors } from '@/constants/theme';
import {
  useAppStore,
  calculateFootprint,
  ECO_ACTIONS,
  AppState,
  ChatMessage,
} from '@/store/app-store';

// Base URL of our server-side proxy (see /api/chat.ts). The OpenAI key lives on
// the server, never in this bundle. Set EXPO_PUBLIC_API_URL in .env.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

// Build context-aware suggested queries from user state
function getSuggestedQueries(
  viewedModules: string[],
  viewedActionIds: string[],
  activeActions: string[],
  footprintCompleted: boolean
): string[] {
  const suggestions: string[] = [];

  if (footprintCompleted) {
    suggestions.push('How can I reduce my carbon footprint the most?');
    suggestions.push('What\'s the fastest way to cut my transport emissions?');
  }

  if (activeActions.length > 0) {
    const firstName = ECO_ACTIONS.find(a => a.id === activeActions[0])?.title;
    if (firstName) {
      suggestions.push(`Tips to stay consistent with: ${firstName}`);
    }
  }

  if (viewedModules.length > 0) {
    suggestions.push('Tell me more about how Earth\'s systems are connected.');
  }

  if (viewedActionIds.length > 0) {
    suggestions.push('Which eco-actions have the biggest impact?');
  }

  const general = [
    'What is climate change and why does it matter?',
    'How can I live more sustainably?',
    'How does diet affect the environment?',
    'What can one person do to help the planet?',
    'Explain the greenhouse effect simply.',
  ];

  for (const g of general) {
    if (suggestions.length >= 5) break;
    suggestions.push(g);
  }

  return suggestions.slice(0, 5);
}

function buildSystemPrompt(state: AppState): string {
  const lines: string[] = [
    'You are EcoBot, a friendly and knowledgeable environmental AI assistant built into a sustainability app.',
    'Help users understand environmental issues, take action, and build sustainable habits.',
    'Be encouraging, clear, and practical. Keep responses short and mobile-friendly (under 80 words). If the user explicitly asks for more detail, you may expand.',
    'Use emojis sparingly to make responses engaging.',
    '',
    '## User Context',
  ];

  if (state.footprintCompleted) {
    const fp = calculateFootprint(state.footprintData);
    lines.push(
      `- Carbon footprint: ${fp.total} tons CO₂/year (${fp.vsAverage}× the US average of 16t)`
    );
    lines.push(
      `- Breakdown — Transport: ${fp.transport}t | Home: ${fp.home}t | Diet: ${fp.diet}t | Shopping: ${fp.shopping}t`
    );
    lines.push(`- Earth consumption rate: ${fp.earthsNeeded} Earths/year`);
    lines.push(`- Diet: ${state.footprintData.dietType}`);
    lines.push(`- Drives: ${state.footprintData.carMilesPerWeek} miles/week`);
    lines.push(`- Flights/year: ${state.footprintData.flightsPerYear}`);
  } else {
    lines.push('- Carbon footprint: not yet calculated (user can do this in the Footprint tab)');
  }

  if (state.activeActions.length > 0) {
    const names = state.activeActions
      .map(id => ECO_ACTIONS.find(a => a.id === id)?.title ?? id)
      .join(', ');
    lines.push(`- Committed eco-actions: ${names}`);
  } else {
    lines.push('- No eco-actions committed yet');
  }

  if (state.viewedModules.length > 0) {
    lines.push(`- Has explored ${state.viewedModules.length} education module(s) in the app`);
  }

  if (state.viewedActionIds.length > 0) {
    lines.push(`- Has explored ${state.viewedActionIds.length} eco-action(s) in the app`);
  }

  lines.push('');
  lines.push(
    'Personalize your advice using this context. Reference their footprint numbers when relevant. If they have active actions, encourage consistency and provide practical tips.'
  );

  return lines.join('\n');
}

// ── Chat Bubble ───────────────────────────────────────────────────────────────

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowBot]}>
      {!isUser && (
        <View style={styles.botAvatar}>
          <Text style={styles.botAvatarText}>🌿</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextBot]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

// ── Main Chat Screen ──────────────────────────────────────────────────────────

export default function ChatScreen() {
  const { state, dispatch } = useAppStore();
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const suggestions = getSuggestedQueries(
    state.viewedModules,
    state.viewedActionIds,
    state.activeActions,
    state.footprintCompleted
  );

  useEffect(() => {
    if (state.chatHistory.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [state.chatHistory.length]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    if (!API_URL) {
      Alert.alert(
        'EcoBot Unavailable',
        'The assistant is not configured yet. Set EXPO_PUBLIC_API_URL to your deployed proxy URL.'
      );
      return;
    }

    setInputText('');
    setLoading(true);

    const userMsg: ChatMessage = {
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: userMsg });

    try {
      const messages = [
        { role: 'system', content: buildSystemPrompt(state) },
        ...state.chatHistory.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: trimmed },
      ];

      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });

      const data = await response.json().catch(() => ({})) as {
        reply?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data?.error ?? `HTTP ${response.status}`);
      }

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.reply ?? '',
        timestamp: Date.now(),
      };
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: assistantMsg });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('EcoBot Error', `Could not get a response: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    dispatch({ type: 'CLEAR_CHAT' });
  }

  const showWelcome = state.chatHistory.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <LinearGradient
        colors={[EcoColors.green800, EcoColors.green600]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>EcoBot</Text>
            <Text style={styles.headerSub}>AI sustainability assistant</Text>
          </View>
          <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
            <Ionicons name="close-outline" size={24} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}>

        {/* Messages list */}
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag">

          {showWelcome && (
            <View style={styles.welcomeSection}>
              <View style={styles.welcomeIcon}>
                <Text style={styles.welcomeIconText}>🌿</Text>
              </View>
              <Text style={styles.welcomeTitle}>Hi! I&apos;m EcoBot</Text>
              <Text style={styles.welcomeBody}>
                Ask me anything about the environment, climate change, or how to live more
                sustainably. I have context from your footprint and eco-actions.
              </Text>
              <Text style={styles.suggestionsLabel}>Suggested questions</Text>
              <View style={styles.suggestions}>
                {suggestions.map((q, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.suggestionChip}
                    onPress={() => sendMessage(q)}
                    activeOpacity={0.7}>
                    <Text style={styles.suggestionChipText}>{q}</Text>
                    <Ionicons name="arrow-forward" size={13} color={EcoColors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {state.chatHistory.map((msg, i) => (
            <ChatBubble key={i} message={msg} />
          ))}

          {loading && (
            <View style={[styles.bubbleRow, styles.bubbleRowBot]}>
              <View style={styles.botAvatar}>
                <Text style={styles.botAvatarText}>🌿</Text>
              </View>
              <View style={[styles.bubble, styles.bubbleBot, styles.typingBubble]}>
                <ActivityIndicator size="small" color={EcoColors.primary} />
                <Text style={styles.typingText}>EcoBot is thinking…</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input bar */}
        <View style={styles.inputBar}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask EcoBot anything…"
              placeholderTextColor={EcoColors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={() => sendMessage(inputText)}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!inputText.trim() || loading) && styles.sendBtnDisabled]}
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim() || loading}>
              <Ionicons name="send" size={17} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.tempNotice}>EcoBot can make mistakes. Check important info.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: EcoColors.background },
  flex: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
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
    marginTop: 2,
  },
  clearBtn: {
    padding: 8,
    marginTop: 4,
  },

  // Messages area
  messages: { flex: 1 },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
    gap: 0,
  },

  // Welcome / suggestions
  welcomeSection: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 24,
  },
  welcomeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: EcoColors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  welcomeIconText: { fontSize: 28 },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: EcoColors.text,
    marginBottom: 8,
  },
  welcomeBody: {
    fontSize: 13,
    color: EcoColors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  suggestionsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: EcoColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  suggestions: { width: '100%', gap: 8 },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: EcoColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: EcoColors.green200,
    paddingVertical: 11,
    paddingHorizontal: 14,
    gap: 8,
  },
  suggestionChipText: {
    flex: 1,
    fontSize: 13,
    color: EcoColors.primary,
    fontWeight: '500',
    lineHeight: 18,
  },

  // Chat bubbles
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
    gap: 8,
  },
  bubbleRowUser: { justifyContent: 'flex-end' },
  bubbleRowBot: { justifyContent: 'flex-start' },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: EcoColors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  botAvatarText: { fontSize: 15 },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: EcoColors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: EcoColors.white,
    borderWidth: 1,
    borderColor: EcoColors.border,
    borderBottomLeftRadius: 4,
    shadowColor: EcoColors.green800,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextUser: { color: '#fff' },
  bubbleTextBot: { color: EcoColors.text },

  // Typing indicator
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  typingText: {
    fontSize: 13,
    color: EcoColors.textMuted,
    fontStyle: 'italic',
  },

  tempNotice: {
    fontSize: 11,
    color: EcoColors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },

  // Input bar
  inputBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 12 : 16,
    backgroundColor: EcoColors.white,
    borderTopWidth: 1,
    borderTopColor: EcoColors.border,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: EcoColors.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: EcoColors.border,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    color: EcoColors.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: EcoColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendBtnDisabled: { opacity: 0.4 },
});
