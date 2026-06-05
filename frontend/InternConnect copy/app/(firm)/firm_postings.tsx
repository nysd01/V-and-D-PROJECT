import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { api, ApiInternship } from '../../services/api';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function FirmPostings(): React.JSX.Element {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [search, setSearch] = useState('');
  const [postings, setPostings] = useState<ApiInternship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPostings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.internships.mine();
      setPostings(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load postings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPostings(); }, [fetchPostings]);
  useFocusEffect(
    useCallback(() => {
      fetchPostings();
    }, [fetchPostings])
  );

  const handleDeletePosting = async (posting: ApiInternship) => {
    Alert.alert('Delete Posting', `Are you sure you want to permanently delete "${posting.title}"? This will also remove its applications.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.internships.delete(posting.id);
            setPostings((prev) => prev.filter((p) => p.id !== posting.id));
            await fetchPostings();
          } catch (e: unknown) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Could not delete posting');
          }
        },
      },
    ]);
  };

  const filtered = useMemo(() => {
    return postings.filter((p) => {
      const matchesFilter = selectedFilter === 'all' || p.status === selectedFilter;
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase())
        || p.category.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [search, selectedFilter, postings]);

  const activeCount = postings.filter((p) => p.status === 'active').length;
  const closedCount = postings.filter((p) => p.status === 'closed').length;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Postings</Text>
          <TouchableOpacity onPress={fetchPostings}>
            <Ionicons name="refresh-outline" size={26} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={22} color="#6B7280" />
          <TextInput
            placeholder="Search internships..."
            placeholderTextColor="#6B7280"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.filters}>
          {(['all', 'active', 'closed'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, selectedFilter === filter && styles.filterChipActive]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>
                {filter === 'all' ? `All (${postings.length})` : filter === 'active' ? `Active (${activeCount})` : `Closed (${closedCount})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.newBtn} onPress={() => router.push('/(firm)/firm_post_new')}>
          <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.newBtnText}>Post New Internship</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#0F4BCC" style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={styles.emptyState}>
            <Ionicons name="cloud-offline-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchPostings}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No postings found</Text>
          </View>
        ) : (
          filtered.map((posting) => (
            <View key={posting.id} style={styles.card}>
              <Text style={styles.category}>{posting.category}</Text>
              <View style={styles.cardTop}>
                <Text style={styles.title}>{posting.title}</Text>
                <View style={[styles.statusPill, posting.status === 'active' ? styles.active : styles.closed]}>
                  <Text style={[styles.statusText, posting.status === 'closed' && styles.statusTextClosed]}>
                    {posting.status === 'active' ? 'Active' : 'Closed'}
                  </Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View>
                  <Text style={styles.metaLabel}>Posted On</Text>
                  <Text style={styles.metaValue}>{formatDate(posting.posted_on)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.metaLabel}>Applicants</Text>
                  <Text style={styles.metaValue}>{posting.applicant_count ?? 0}</Text>
                </View>
              </View>

              <View style={styles.actions}>
                {posting.status === 'active' ? (
                  <>
                    <TouchableOpacity
                      style={styles.secondaryBtn}
                      onPress={() => handleDeletePosting(posting)}
                    >
                      <Ionicons name="close-circle-outline" size={18} color="#111827" />
                      <Text style={styles.secondaryText}>Delete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.primaryBtn}
                      onPress={() => router.push({
                        pathname: '/(firm)/firm_applicants',
                        params: { id: posting.id, title: posting.title },
                      })}
                    >
                      <Ionicons name="eye-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.primaryText}>View Applicants</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => handleDeletePosting(posting)}>
                      <Ionicons name="trash-outline" size={18} color="#111827" />
                      <Text style={styles.secondaryText}>Delete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.secondaryBtn, styles.reportBtn]}
                      onPress={() => router.push({
                        pathname: '/(firm)/firm_applicants',
                        params: { id: posting.id, title: posting.title },
                      })}
                    >
                      <Ionicons name="bar-chart-outline" size={18} color="#6B7280" />
                      <Text style={[styles.secondaryText, styles.reportText]}>View Report</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FB' },
  content: { paddingBottom: 24 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, paddingTop: 18, paddingBottom: 10,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 38, fontWeight: '800', color: '#0F172A' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    marginHorizontal: 18, marginTop: 18, borderWidth: 1, borderColor: '#CBD5E1',
    borderRadius: 16, paddingHorizontal: 16, height: 58,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 18, color: '#111827' },
  filters: { flexDirection: 'row', paddingHorizontal: 18, gap: 12, marginTop: 22, marginBottom: 12 },
  filterChip: {
    borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFFFFF',
    borderRadius: 999, paddingHorizontal: 18, paddingVertical: 12,
  },
  filterChipActive: { backgroundColor: '#0F4BCC', borderColor: '#0F4BCC' },
  filterText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  filterTextActive: { color: '#FFFFFF' },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: 18, marginBottom: 4,
    backgroundColor: '#059669', borderRadius: 14, paddingVertical: 14,
  },
  newBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyText: { fontSize: 14, color: '#64748B', textAlign: 'center' },
  retryBtn: { marginTop: 8, backgroundColor: '#0F4BCC', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '700' },
  card: {
    marginHorizontal: 18, backgroundColor: '#FFFFFF',
    borderRadius: 20, borderWidth: 1, borderColor: '#CBD5E1', padding: 18, marginTop: 12,
  },
  category: { fontSize: 14, letterSpacing: 1.2, color: '#0F4BCC', fontWeight: '800' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 8 },
  title: { flex: 1, fontSize: 28, fontWeight: '800', color: '#111827', paddingRight: 10 },
  statusPill: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  active: { backgroundColor: '#6EE7B7' },
  closed: { backgroundColor: '#E2E8F0' },
  statusText: { fontSize: 15, fontWeight: '700', color: '#14532D' },
  statusTextClosed: { color: '#475569' },
  metaRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 18, borderTopWidth: 1, borderBottomWidth: 1,
    borderTopColor: '#E5E7EB', borderBottomColor: '#E5E7EB', marginTop: 18,
  },
  metaLabel: { fontSize: 14, color: '#6B7280' },
  metaValue: { marginTop: 4, fontSize: 17, color: '#111827', fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  secondaryBtn: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 8, borderWidth: 1, borderColor: '#94A3B8', borderRadius: 14,
    paddingVertical: 14, backgroundColor: '#FFFFFF',
  },
  secondaryText: { fontSize: 15, fontWeight: '700', color: '#111827' },
  primaryBtn: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 8, borderRadius: 14, paddingVertical: 14, backgroundColor: '#0F4BCC',
  },
  primaryText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  reportBtn: { backgroundColor: '#D9E2F2', borderColor: '#D9E2F2' },
  reportText: { color: '#6B7280' },
});
