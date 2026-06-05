import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api, ApiInternship } from '../../services/api';

const FILTERS = ['All', 'Paid', 'Remote', 'Hybrid', 'In-person'];

const LOGO_COLORS = ['#2563EB', '#DC2626', '#059669', '#7C3AED', '#0F172A', '#4B5563', '#D97706', '#0891B2'];
function logoBg(id: number) { return LOGO_COLORS[id % LOGO_COLORS.length]; }
function logoText(name: string) { return name.slice(0, 2).toUpperCase(); }
function formatTags(item: ApiInternship): string[] {
  const tags: string[] = [];
  if (item.duration) tags.push(item.duration);
  tags.push(item.is_paid ? 'Paid' : 'Unpaid');
  tags.push(item.work_type);
  return tags;
}

interface CardProps {
  item: ApiInternship;
  saved: boolean;
  onSave: () => void;
}

export default function Browse(): React.JSX.Element {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [saved, setSaved] = useState<Record<number, boolean>>({});
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [internships, setInternships] = useState<ApiInternship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.internships.list(search, selectedFilter);
      setInternships(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load internships');
    } finally {
      setLoading(false);
    }
  }, [search, selectedFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const toggleSave = (id: number) => setSaved((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Browse</Text>
            <Text style={styles.headerSubtitle}>Find your next opportunity</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="options-outline" size={22} color="#2563EB" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={16} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search internships..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, selectedFilter === filter && styles.filterChipActive]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.cardsContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
          ) : error ? (
            <View style={styles.emptyState}>
              <Ionicons name="cloud-offline-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Could not connect</Text>
              <Text style={styles.emptyText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : internships.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No internships found</Text>
              <Text style={styles.emptyText}>Try a different search or filter</Text>
            </View>
          ) : (
            internships.map((item) => (
              <InternshipCard
                key={item.id}
                item={item}
                saved={!!saved[item.id]}
                onSave={() => toggleSave(item.id)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const InternshipCard: React.FC<CardProps> = ({ item, saved, onSave }) => {
  const router = useRouter();
  const companyLabel = item.company_name || item.firm_name;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: '/internship_detail', params: { id: item.id } })}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <View style={[styles.companyLogo, { backgroundColor: logoBg(item.id) }]}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
              {logoText(companyLabel)}
            </Text>
          </View>

          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardCompany}>{companyLabel}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color="#666" />
              <Text style={styles.location}>{item.location}</Text>
            </View>
          </View>
        </View>

        <View style={styles.tagsRow}>
          {formatTags(item).map((tag, idx) => (
            <View key={idx} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => router.push({ pathname: '/apply', params: { id: item.id } })}
          >
            <Text style={styles.applyText}>Apply</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onSave} style={styles.saveBtn}>
            <Ionicons
              name={saved ? 'heart' : 'heart-outline'}
              size={20}
              color={saved ? '#DC2626' : '#999'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0F172A' },
  headerSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  headerIcons: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 8,
    backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center',
  },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F1F5F9', borderRadius: 10,
    paddingHorizontal: 12, height: 44, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A' },
  filterContainer: {
    paddingVertical: 8, paddingHorizontal: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  filterContent: { gap: 8, paddingRight: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0',
  },
  filterChipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  filterText: { fontSize: 12, fontWeight: '500', color: '#64748B' },
  filterTextActive: { color: '#fff' },
  cardsContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  emptyText: { fontSize: 13, color: '#64748B', textAlign: 'center' },
  retryBtn: {
    marginTop: 8, paddingHorizontal: 24, paddingVertical: 10,
    backgroundColor: '#2563EB', borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, marginBottom: 12,
    overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0',
  },
  cardContent: { padding: 14, gap: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  companyLogo: { width: 48, height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#0F172A' },
  cardCompany: { fontSize: 12, color: '#64748B' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  location: { fontSize: 11, color: '#64748B' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  tagText: { fontSize: 11, color: '#475569', fontWeight: '500' },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  applyBtn: { flex: 1, backgroundColor: '#2563EB', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  applyText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  saveBtn: {
    width: 40, height: 40, borderRadius: 8,
    backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center',
  },
});
