import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
  SafeAreaView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

import { EcoColors } from '@/constants/theme';
import { useAppStore, MOCK_NEWS, CustomBlog, NewsArticle } from '@/store/app-store';

const CATEGORIES = ['All', 'Climate', 'Wildlife', 'Ocean', 'Energy', 'Policy', 'Blog'];

const CATEGORY_COLORS: Record<string, string> = {
  Climate:  EcoColors.catClimate,
  Wildlife: EcoColors.catWildlife,
  Ocean:    EcoColors.catOcean,
  Energy:   EcoColors.catEnergy,
  Policy:   EcoColors.catPolicy,
  Blog:     EcoColors.catBlog,
};

function CategoryBadge({ category }: { category: string }) {
  const color = CATEGORY_COLORS[category] ?? EcoColors.primary;
  return (
    <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{category}</Text>
    </View>
  );
}

function NewsCard({
  article,
  onPress,
  featured,
}: {
  article: NewsArticle;
  onPress: () => void;
  featured?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.card, featured && styles.featuredCard]}
      onPress={onPress}
      activeOpacity={0.82}>
      {featured && (
        <LinearGradient
          colors={[EcoColors.green700, EcoColors.green500]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.featuredBanner}>
          <Ionicons name="star" size={12} color="#fff" />
          <Text style={styles.featuredLabel}>Featured</Text>
        </LinearGradient>
      )}
      <View style={styles.cardBody}>
        <CategoryBadge category={article.category} />
        <Text style={[styles.cardTitle, featured && styles.featuredTitle]} numberOfLines={3}>
          {article.title}
        </Text>
        <Text style={styles.cardSummary} numberOfLines={featured ? 3 : 2}>
          {article.summary}
        </Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardSource}>{article.source}</Text>
          <Text style={styles.cardDot}>·</Text>
          <Text style={styles.cardDate}>{formatDate(article.date)}</Text>
          <Text style={styles.cardDot}>·</Text>
          <Ionicons name="time-outline" size={12} color={EcoColors.textMuted} />
          <Text style={styles.cardReadTime}> {article.readTime}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ArticleModal({
  article,
  onClose,
}: {
  article: NewsArticle | null;
  onClose: () => void;
}) {
  if (!article) return null;
  const color = CATEGORY_COLORS[article.category] ?? EcoColors.primary;
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
            <Ionicons name="close" size={24} color={EcoColors.text} />
          </TouchableOpacity>
          <CategoryBadge category={article.category} />
        </View>
        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.modalTitle}>{article.title}</Text>
          <View style={styles.modalMeta}>
            <Text style={styles.cardSource}>{article.source}</Text>
            <Text style={styles.cardDot}>·</Text>
            <Text style={styles.cardDate}>{formatDate(article.date)}</Text>
            <Text style={styles.cardDot}>·</Text>
            <Text style={styles.cardReadTime}>{article.readTime} read</Text>
          </View>
          <View style={[styles.modalDivider, { backgroundColor: color + '40' }]} />
          <Text style={styles.modalBody}>{article.summary}</Text>
          {article.isUserBlog ? null : (
            <View style={styles.readMoreBox}>
              <Ionicons name="globe-outline" size={16} color={EcoColors.secondary} />
              <Text style={styles.readMoreText}>
                Full article available via the source publication.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function AddBlogModal({ onClose }: { onClose: () => void }) {
  const { dispatch } = useAppStore();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Blog');

  function submit() {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Required', 'Please fill in the title and content.');
      return;
    }
    const blog: CustomBlog = {
      id: `blog_${Date.now()}`,
      title: title.trim(),
      author: author.trim() || 'Anonymous',
      content: content.trim(),
      date: new Date().toISOString().split('T')[0],
      category,
    };
    dispatch({ type: 'ADD_BLOG', payload: blog });
    onClose();
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
            <Ionicons name="close" size={24} color={EcoColors.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle2}>Add a Blog Post</Text>
          <TouchableOpacity onPress={submit} style={styles.submitBtn}>
            <Text style={styles.submitBtnText}>Post</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.inputLabel}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="What's this post about?"
            placeholderTextColor={EcoColors.textMuted}
          />
          <Text style={styles.inputLabel}>Your Name</Text>
          <TextInput
            style={styles.input}
            value={author}
            onChangeText={setAuthor}
            placeholder="Anonymous"
            placeholderTextColor={EcoColors.textMuted}
          />
          <Text style={styles.inputLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
            {['Blog', 'Climate', 'Wildlife', 'Ocean', 'Energy', 'Policy'].map(cat => (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategory(cat)}
                style={[
                  styles.catChip,
                  category === cat && styles.catChipActive,
                ]}>
                <Text
                  style={[
                    styles.catChipText,
                    category === cat && styles.catChipTextActive,
                  ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={styles.inputLabel}>Content *</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={content}
            onChangeText={setContent}
            placeholder="Share your environmental insights, experience, or ideas..."
            placeholderTextColor={EcoColors.textMuted}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function NewsScreen() {
  const { state, dispatch } = useAppStore();
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [showAddBlog, setShowAddBlog] = useState(false);

  const blogArticles: NewsArticle[] = state.customBlogs.map(b => ({
    id: b.id,
    title: b.title,
    source: b.author,
    date: b.date,
    category: b.category,
    summary: b.content,
    readTime: `${Math.max(1, Math.ceil(b.content.split(' ').length / 200))} min`,
    isUserBlog: true,
  }));

  const allArticles = [...blogArticles, ...MOCK_NEWS];

  const filtered =
    activeCategory === 'All'
      ? allArticles
      : allArticles.filter(a => a.category === activeCategory);

  function openArticle(article: NewsArticle) {
    dispatch({ type: 'MARK_ARTICLE_VIEWED', payload: article.id });
    setSelectedArticle(article);
  }

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[EcoColors.green800, EcoColors.green600]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>EcoNews</Text>
            <Text style={styles.headerSub}>Environmental awareness, daily</Text>
          </View>
          <TouchableOpacity style={styles.addBlogBtn} onPress={() => setShowAddBlog(true)}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addBlogText}>Add Blog</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Category filter */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[
                styles.filterChip,
                activeCategory === cat && styles.filterChipActive,
              ]}>
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
      </View>

      {/* Articles list */}
      <FlatList
        data={rest}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          featured ? (
            <NewsCard article={featured} onPress={() => openArticle(featured)} featured />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="leaf-outline" size={48} color={EcoColors.green300} />
            <Text style={styles.emptyText}>No articles in this category yet.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <NewsCard article={item} onPress={() => openArticle(item)} />
        )}
      />

      <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
      {showAddBlog && <AddBlogModal onClose={() => setShowAddBlog(false)} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: EcoColors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    color: EcoColors.green200,
    marginTop: 2,
  },
  addBlogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 4,
  },
  addBlogText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  filterContainer: {
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
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: EcoColors.green50,
    borderWidth: 1,
    borderColor: EcoColors.border,
    marginRight: 4,
  },
  filterChipActive: {
    backgroundColor: EcoColors.primary,
    borderColor: EcoColors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: EcoColors.textSecondary,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: EcoColors.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: EcoColors.border,
    marginBottom: 12,
    shadowColor: EcoColors.green800,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  featuredCard: {
    borderColor: EcoColors.green400,
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  featuredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  featuredLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardBody: {
    padding: 16,
    gap: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: EcoColors.text,
    lineHeight: 22,
  },
  featuredTitle: {
    fontSize: 18,
    lineHeight: 26,
  },
  cardSummary: {
    fontSize: 13,
    color: EcoColors.textSecondary,
    lineHeight: 19,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 2,
    marginTop: 2,
  },
  cardSource: {
    fontSize: 12,
    color: EcoColors.textMuted,
    fontWeight: '500',
  },
  cardDot: {
    color: EcoColors.textMuted,
    fontSize: 12,
    marginHorizontal: 2,
  },
  cardDate: {
    fontSize: 12,
    color: EcoColors.textMuted,
  },
  cardReadTime: {
    fontSize: 12,
    color: EcoColors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    color: EcoColors.textMuted,
    fontSize: 15,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: EcoColors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: EcoColors.border,
    gap: 12,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScroll: {
    flex: 1,
    padding: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: EcoColors.text,
    lineHeight: 30,
    marginBottom: 10,
  },
  modalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 2,
    marginBottom: 14,
  },
  modalDivider: {
    height: 2,
    borderRadius: 1,
    marginBottom: 16,
  },
  modalBody: {
    fontSize: 15,
    color: EcoColors.text,
    lineHeight: 24,
  },
  readMoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    padding: 14,
    backgroundColor: EcoColors.secondaryPale,
    borderRadius: 12,
  },
  readMoreText: {
    flex: 1,
    fontSize: 13,
    color: EcoColors.secondary,
    fontStyle: 'italic',
  },
  // Add Blog Modal
  modalTitle2: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: EcoColors.text,
  },
  submitBtn: {
    backgroundColor: EcoColors.primary,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: EcoColors.textSecondary,
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: EcoColors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: EcoColors.text,
    backgroundColor: EcoColors.green50,
  },
  inputMultiline: {
    minHeight: 160,
    paddingTop: 12,
  },
  catRow: {
    flexGrow: 0,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: EcoColors.green50,
    borderWidth: 1,
    borderColor: EcoColors.border,
    marginRight: 8,
  },
  catChipActive: {
    backgroundColor: EcoColors.primary,
    borderColor: EcoColors.primary,
  },
  catChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: EcoColors.textSecondary,
  },
  catChipTextActive: {
    color: '#fff',
  },
});
