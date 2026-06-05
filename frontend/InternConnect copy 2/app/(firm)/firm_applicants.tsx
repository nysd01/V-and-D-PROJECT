import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { api, ApiApplicant, ApiInternship } from '../../services/api';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const DEFAULT_AVATAR = 'https://i.pravatar.cc/150?img=0';

export default function FirmApplicants(): React.JSX.Element {
  const router = useRouter();
  const { id, title } = useLocalSearchParams<{ id: string; title: string }>();

  const [filter, setFilter] = useState<'all' | 'Pending' | 'Accepted'>('all');
  const [search, setSearch] = useState('');
  const [applicants, setApplicants] = useState<ApiApplicant[]>([]);
  const [posting, setPosting] = useState<ApiInternship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchApplicants = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [postingData, data] = await Promise.all([
        api.internships.get(id),
        api.applications.forPosting(id),
      ]);
      setPosting(postingData);
      setApplicants(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load applicants');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchApplicants(); }, [fetchApplicants]);
  useFocusEffect(
    useCallback(() => {
      fetchApplicants();
    }, [fetchApplicants])
  );

  const handleStatusChange = async (applicationId: number, newStatus: string) => {
    try {
      await api.applications.updateStatus(applicationId, newStatus);
      setApplicants((prev) =>
        prev.map((a) => a.id === applicationId ? { ...a, status: newStatus as ApiApplicant['status'] } : a)
      );
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not update status');
    }
  };

  const handleClosePosting = async () => {
    if (!id || !posting) return;

    const nextStatus = posting.status === 'active' ? 'closed' : 'active';
    const actionLabel = nextStatus === 'closed' ? 'Close Application' : 'Re-open Application';

    Alert.alert(
      actionLabel,
      nextStatus === 'closed'
        ? `Are you sure you want to close applications for "${posting.title}"? New interns will no longer be able to apply.`
        : `Are you sure you want to re-open applications for "${posting.title}"? Interns will be able to apply again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionLabel,
          style: nextStatus === 'closed' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              const updated = await api.internships.updateStatus(id, nextStatus);
              setPosting((prev) => (prev ? { ...prev, status: updated.status } : prev));
              await fetchApplicants();
            } catch (e: unknown) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Could not update application status');
            }
          },
        },
      ]
    );
  };

  const handleDeletePosting = async () => {
    if (!id || !posting) return;

    Alert.alert(
      'Delete Posting',
      `Are you sure you want to permanently delete "${posting.title}"? This will also remove all applications for this posting.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.internships.delete(id);
              Alert.alert('Deleted', 'The posting was deleted successfully.', [
                { text: 'OK', onPress: () => router.push('/(firm)/firm_postings') },
              ]);
            } catch (e: unknown) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Could not delete posting');
            }
          },
        },
      ]
    );
  };

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return applicants.filter((a) => {
      const matchesFilter = filter === 'all' || a.status === filter;
      const matchesSearch = !query
        || a.name.toLowerCase().includes(query)
        || a.email.toLowerCase().includes(query)
        || (a.university || '').toLowerCase().includes(query)
        || (a.cover_letter || '').toLowerCase().includes(query)
        || a.status.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [filter, applicants, search]);

  const pendingCount   = applicants.filter((a) => a.status === 'Pending').length;
  const acceptedCount  = applicants.filter((a) => a.status === 'Accepted').length;

  if (!id) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#475569' }}>No posting selected.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#0F4BCC', fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Applicants</Text>
          <TouchableOpacity onPress={fetchApplicants}>
            <Ionicons name="refresh-outline" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {title ? (
          <Text style={styles.subtitle}>Reviewing candidates for {title}.</Text>
        ) : null}

        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search applicants..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {posting ? (
          <View style={styles.postingActionsWrap}>
            <TouchableOpacity
              style={[styles.closePostingBtn, posting.status === 'closed' && styles.reopenPostingBtn]}
              onPress={handleClosePosting}
              activeOpacity={0.85}
            >
              <Ionicons
                name={posting.status === 'active' ? 'close-circle-outline' : 'refresh-outline'}
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.closePostingText}>
                {posting.status === 'active' ? 'Close Application' : 'Re-open Application'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deletePostingBtn}
              onPress={handleDeletePosting}
              activeOpacity={0.85}
            >
              <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
              <Text style={styles.deletePostingText}>Delete Posting</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.filters}>
          {(['all', 'Pending', 'Accepted'] as const).map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.filterChip, filter === item && styles.filterChipActive]}
              onPress={() => setFilter(item)}
            >
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
                {item === 'all'
                  ? `All (${applicants.length})`
                  : item === 'Pending'
                  ? `Pending (${pendingCount})`
                  : `Accepted (${acceptedCount})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#0F4BCC" style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={styles.emptyState}>
            <Ionicons name="cloud-offline-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchApplicants}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : visible.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No applicants yet</Text>
          </View>
        ) : (
          visible.map((applicant) => {
            const isRejected = applicant.status === 'Rejected';
            const isAccepted = applicant.status === 'Accepted';
            return (
              <View key={applicant.id} style={styles.card}>
                <View style={styles.topRow}>
                  <Image
                    source={{ uri: applicant.profile_picture || DEFAULT_AVATAR }}
                    style={styles.avatar}
                  />
                  <View style={styles.info}>
                    <Text style={styles.name}>{applicant.name}</Text>
                    <Text style={styles.school}>{applicant.university || 'University not provided'}</Text>
                    <Text style={styles.email}>{applicant.email}</Text>
                  </View>
                  <View style={[
                    styles.statusPill,
                    isRejected && styles.rejectedPill,
                    isAccepted && styles.acceptedPill,
                  ]}>
                    <Text style={[
                      styles.statusPillText,
                      isRejected && styles.rejectedText,
                      isAccepted && styles.acceptedText,
                    ]}>
                      {applicant.status}
                    </Text>
                  </View>
                </View>

                {applicant.cover_letter ? (
                  <Text style={styles.coverLetter} numberOfLines={2}>
                    "{applicant.cover_letter}"
                  </Text>
                ) : null}

                <Text style={styles.appliedDate}>Applied {formatDate(applicant.applied_at)}</Text>

                {isRejected ? (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.outlineAction}
                      onPress={() => handleStatusChange(applicant.id, 'Pending')}
                    >
                      <Text style={styles.outlineActionText}>Re-evaluate</Text>
                    </TouchableOpacity>
                  </View>
                ) : isAccepted ? (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => handleStatusChange(applicant.id, 'Rejected')}
                    >
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.interviewBtn}
                      onPress={() => handleStatusChange(applicant.id, 'Interviewing')}
                    >
                      <Text style={styles.interviewBtnText}>Set Interviewing</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => handleStatusChange(applicant.id, 'Accepted')}
                    >
                      <Text style={styles.acceptBtnText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => handleStatusChange(applicant.id, 'Rejected')}
                    >
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.interviewBtn}
                      onPress={() => handleStatusChange(applicant.id, 'Interviewing')}
                    >
                      <Text style={styles.interviewBtnText}>Interview</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
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
    paddingHorizontal: 18, paddingTop: 18, paddingBottom: 12,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  subtitle: { paddingHorizontal: 18, paddingTop: 10, fontSize: 16, lineHeight: 23, color: '#475569' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 18, marginTop: 14,
    paddingHorizontal: 14, height: 48,
    borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A' },
  postingActionsWrap: {
    paddingHorizontal: 18,
    marginTop: 16,
    gap: 10,
  },
  closePostingBtn: {
    backgroundColor: '#C81E1E',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  reopenPostingBtn: {
    backgroundColor: '#0F4BCC',
  },
  deletePostingBtn: {
    backgroundColor: '#7F1D1D',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  closePostingText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  deletePostingText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  filters: { flexDirection: 'row', gap: 12, paddingHorizontal: 18, marginTop: 24, marginBottom: 12 },
  filterChip: {
    borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFFFFF',
    borderRadius: 999, paddingHorizontal: 18, paddingVertical: 12,
  },
  filterChipActive: { backgroundColor: '#0F4BCC', borderColor: '#0F4BCC' },
  filterText: { fontSize: 16, fontWeight: '700', color: '#374151' },
  filterTextActive: { color: '#FFFFFF' },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyText: { fontSize: 14, color: '#64748B', textAlign: 'center' },
  retryBtn: { marginTop: 8, backgroundColor: '#0F4BCC', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '700' },
  card: {
    marginHorizontal: 18, marginTop: 12, backgroundColor: '#FFFFFF',
    borderRadius: 20, borderWidth: 1, borderColor: '#CBD5E1', padding: 16,
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { width: 58, height: 58, borderRadius: 29, marginRight: 14, backgroundColor: '#E5E7EB' },
  info: { flex: 1 },
  name: { fontSize: 20, fontWeight: '800', color: '#111827' },
  school: { marginTop: 4, fontSize: 15, color: '#4B5563' },
  email: { marginTop: 2, fontSize: 13, color: '#6B7280' },
  statusPill: {
    backgroundColor: '#FEF3C7', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
  },
  rejectedPill: { backgroundColor: '#F8D7DA' },
  acceptedPill: { backgroundColor: '#6EE7B7' },
  statusPillText: { color: '#92400E', fontWeight: '700', fontSize: 13 },
  rejectedText: { color: '#9F1239' },
  acceptedText: { color: '#14532D' },
  coverLetter: { marginTop: 12, fontSize: 14, color: '#475569', fontStyle: 'italic', lineHeight: 20 },
  appliedDate: { marginTop: 8, fontSize: 12, color: '#94A3B8' },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  acceptBtn: { flex: 1, borderRadius: 14, paddingVertical: 12, backgroundColor: '#0F4BCC', alignItems: 'center' },
  acceptBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  rejectBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 12,
    borderWidth: 1.5, borderColor: '#C81E1E', backgroundColor: '#FFFFFF', alignItems: 'center',
  },
  rejectBtnText: { color: '#C81E1E', fontSize: 15, fontWeight: '800' },
  interviewBtn: { flex: 1, borderRadius: 14, paddingVertical: 12, backgroundColor: '#7C3AED', alignItems: 'center' },
  interviewBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  outlineAction: {
    flex: 1, borderRadius: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: '#94A3B8', backgroundColor: '#FFFFFF', alignItems: 'center',
  },
  outlineActionText: { color: '#475569', fontWeight: '800', fontSize: 15 },
});
