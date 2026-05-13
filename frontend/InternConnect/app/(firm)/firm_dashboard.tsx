import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { api, ApiApplicant, ApiInternship } from '../../services/api';

type ApplicantCard = ApiApplicant & { postingTitle: string };

export default function FirmDashboard(): React.JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const [postings, setPostings] = useState<ApiInternship[]>([]);
  const [applicants, setApplicants] = useState<ApplicantCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const mine = await api.internships.mine();
      setPostings(mine);

      const applicantLists = await Promise.all(
        mine.map(async (posting) => {
          const rows = await api.applications.forPosting(posting.id);
          return rows.map((row) => ({ ...row, postingTitle: posting.title }));
        })
      );

      setApplicants(applicantLists.flat());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activePostings = useMemo(() => postings.filter((posting) => posting.status === 'active').length, [postings]);
  const totalApplicants = applicants.length;
  const newToday = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return applicants.filter((applicant) => new Date(applicant.applied_at) >= start).length;
  }, [applicants]);
  const interviews = applicants.filter((applicant) => applicant.status === 'Interviewing').length;
  const recentApplications = applicants.slice(0, 3);

  const metrics = [
    { title: 'ACTIVE POSTINGS', value: String(activePostings), icon: 'briefcase-outline', color: '#0F4BCC' },
    { title: 'TOTAL APPLICANTS', value: String(totalApplicants), icon: 'people-outline', color: '#1E8E5A' },
    { title: 'NEW TODAY', value: String(newToday), icon: 'flash-outline', color: '#0F4BCC', highlight: true },
    { title: 'INTERVIEWS', value: String(interviews), icon: 'calendar-outline', color: '#B45309' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.brandWrap}>
            <View style={styles.brandIcon}>
              {user?.profilePicture ? (
                <Image source={{ uri: user.profilePicture }} style={styles.brandIconImage} />
              ) : (
                <Text style={styles.brandIconText}>{(user?.companyName || user?.name || 'F').charAt(0).toUpperCase()}</Text>
              )}
            </View>
            <Text style={styles.brand}>InternConnect</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/notifications')}>
            <Ionicons name="notifications-outline" size={26} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Welcome back, {user?.name || 'Firm'}.</Text>
          <Text style={styles.heroText}>Here is your hiring activity for today.</Text>
        </View>

        <View style={styles.grid}>
          {metrics.map((metric) => (
            <TouchableOpacity key={metric.title} style={[styles.metricCard, metric.highlight && styles.metricHighlight]} onPress={() => router.push('/(firm)/firm_postings')}>
              <Ionicons name={metric.icon as any} size={24} color={metric.highlight ? '#FFFFFF' : metric.color} />
              <Text style={[styles.metricTitle, metric.highlight && styles.metricTitleLight]}>{metric.title}</Text>
              <Text style={[styles.metricValue, metric.highlight && styles.metricValueLight]}>{metric.value}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Applications</Text>
          <TouchableOpacity onPress={() => router.push('/(firm)/firm_applicants')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#0F4BCC" style={{ marginTop: 24 }} />
        ) : error ? (
          <View style={styles.emptyState}>
            <Ionicons name="cloud-offline-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : recentApplications.length > 0 ? recentApplications.map((item) => (
          <TouchableOpacity key={item.id} style={styles.applicationCard} onPress={() => router.push('/(firm)/firm_applicants')}>
            <View style={styles.avatar}>
              {item.profile_picture ? (
                <Image source={{ uri: item.profile_picture }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
              )}
            </View>
            <View style={styles.applicationInfo}>
              <Text style={styles.applicationName}>{item.name}</Text>
              <Text style={styles.applicationRole}>{item.postingTitle}</Text>
            </View>
            <View style={styles.applicationMeta}>
              <View style={styles.matchPill}>
                <Text style={styles.matchText}>{item.status}</Text>
              </View>
              <Text style={styles.timeText}>{new Date(item.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
            </View>
          </TouchableOpacity>
        )) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No applications yet.</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(firm)/firm_post_new')}>
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FB' },
  scrollContent: { paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  brandWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E6EEF9', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  brandIconImage: { width: '100%', height: '100%' },
  brandIconText: { color: '#0F4BCC', fontWeight: '800' },
  brand: { fontSize: 19, fontWeight: '800', color: '#0052CC' },
  hero: { paddingHorizontal: 18, paddingTop: 24, paddingBottom: 12 },
  heroTitle: { fontSize: 32, fontWeight: '800', color: '#0F172A', lineHeight: 38 },
  heroText: { marginTop: 8, fontSize: 17, lineHeight: 24, color: '#475569' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingHorizontal: 18, marginTop: 18 },
  metricCard: { width: '47%', minHeight: 128, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#D7DCE6', padding: 16, shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  metricHighlight: { backgroundColor: '#0052CC', borderColor: '#0052CC' },
  metricTitle: { marginTop: 16, fontSize: 14, letterSpacing: 1.1, color: '#374151', fontWeight: '700' },
  metricTitleLight: { color: '#DCE7FF' },
  metricValue: { marginTop: 8, fontSize: 34, fontWeight: '800', color: '#0F172A' },
  metricValueLight: { color: '#FFFFFF' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, marginTop: 26, marginBottom: 12 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  viewAll: { fontSize: 16, fontWeight: '700', color: '#0F4BCC' },
  applicationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 18, marginBottom: 12, borderRadius: 18, borderWidth: 1, borderColor: '#D7DCE6', padding: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 14, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: '#0F172A', fontWeight: '800' },
  applicationInfo: { flex: 1 },
  applicationName: { fontSize: 18, fontWeight: '800', color: '#111827' },
  applicationRole: { marginTop: 4, fontSize: 15, color: '#4B5563' },
  applicationMeta: { alignItems: 'flex-end', gap: 8 },
  matchPill: { backgroundColor: '#6EE7B7', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  matchText: { color: '#14532D', fontSize: 13, fontWeight: '800' },
  timeText: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
  emptyState: { alignItems: 'center', marginHorizontal: 18, marginTop: 18, backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#D7DCE6', padding: 18 },
  emptyText: { color: '#64748B', textAlign: 'center' },
  retryBtn: { marginTop: 12, backgroundColor: '#0052CC', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: '#FFFFFF', fontWeight: '700' },
  fab: { position: 'absolute', right: 20, bottom: 86, width: 62, height: 62, borderRadius: 31, backgroundColor: '#0052CC', justifyContent: 'center', alignItems: 'center', shadowColor: '#0052CC', shadowOpacity: 0.28, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
});