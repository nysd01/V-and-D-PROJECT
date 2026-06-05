import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api, ApiApplication } from '../../services/api';

const LOGO_COLORS = ['#2563EB', '#DC2626', '#059669', '#7C3AED', '#0F172A', '#4B5563', '#D97706', '#0891B2'];
function logoBg(id: number) { return LOGO_COLORS[id % LOGO_COLORS.length]; }
function logoText(name: string) { return name.slice(0, 2).toUpperCase(); }
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Interviewing: { bg: '#EFF6FF', text: '#2563EB' },
  Pending:      { bg: '#FEF9C3', text: '#92400E' },
  Accepted:     { bg: '#ECFDF5', text: '#059669' },
  Rejected:     { bg: '#FEF2F2', text: '#DC2626' },
};

type FilterKey = 'All' | 'Interviewing' | 'Pending' | 'Accepted';

interface StatCardProps {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface AppCardProps {
  item: ApiApplication;
  onWithdraw: (id: number) => void;
}

export default function MyApplications(): React.JSX.Element {
  const router = useRouter();
  const [apps, setApps] = useState<ApiApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('All');
  const [search, setSearch] = useState('');

  const fetchApps = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.applications.list();
      setApps(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const handleWithdraw = (id: number) => {
    Alert.alert('Withdraw Application', 'Are you sure you want to withdraw this application?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Withdraw',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.applications.withdraw(id);
            setApps((prev) => prev.filter((a) => a.id !== id));
          } catch (e: unknown) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Could not withdraw');
          }
        },
      },
    ]);
  };

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return apps.filter((a) => {
      const matchesFilter = activeFilter === 'All' || a.status === activeFilter;
      const matchesSearch = !query
        || a.title.toLowerCase().includes(query)
        || (a.company_name || a.firm_name).toLowerCase().includes(query)
        || a.location.toLowerCase().includes(query)
        || a.status.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, apps, search]);

  const interviewing = apps.filter((a) => a.status === 'Interviewing').length;
  const accepted = apps.filter((a) => a.status === 'Accepted').length;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Applications</Text>
            <Text style={styles.headerSubtitle}>Track your progress</Text>
          </View>
          <TouchableOpacity style={styles.headerBtn} onPress={fetchApps}>
            <Ionicons name="refresh-outline" size={22} color="#2563EB" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Total"      value={apps.length.toString()} icon="document-text-outline" />
          <StatCard label="Interviews" value={interviewing.toString()} icon="chatbubble-outline" />
          <StatCard label="Accepted"   value={accepted.toString()} icon="checkmark-circle-outline" />
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search applications..."
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

        <View style={styles.filterTabs}>
          {(['All', 'Interviewing', 'Pending', 'Accepted'] as FilterKey[]).map((f) => (
            <TouchableOpacity key={f} style={styles.filterTab} onPress={() => setActiveFilter(f)}>
              <Text style={activeFilter === f ? styles.filterTabActive : styles.filterTabText}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.cardsContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
          ) : error ? (
            <View style={styles.emptyState}>
              <Ionicons name="cloud-offline-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Could not connect</Text>
              <Text style={styles.emptyText}>{error}</Text>
              <TouchableOpacity style={styles.browseBtn} onPress={fetchApps}>
                <Text style={styles.browseBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : visible.length > 0 ? (
            visible.map((item) => (
              <AppCard key={item.id} item={item} onWithdraw={handleWithdraw} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Applications</Text>
              <Text style={styles.emptyText}>Start browsing to apply for internships</Text>
              <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(tabs)/browse')}>
                <Text style={styles.browseBtnText}>Browse Opportunities</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon }) => (
  <View style={styles.statCard}>
    <View style={{ flex: 1 }}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
    <Ionicons name={icon} size={22} color="#2563EB" />
  </View>
);

const AppCard: React.FC<AppCardProps> = ({ item, onWithdraw }) => {
  const statusStyle = STATUS_STYLES[item.status] ?? STATUS_STYLES.Pending;
  const companyLabel = item.company_name || item.firm_name;
  return (
    <View style={styles.appCard}>
      <View style={[styles.appLogo, { backgroundColor: logoBg(item.internship_id) }]}>
        <Text style={styles.appLogoText}>{logoText(companyLabel)}</Text>
      </View>
      <Text style={styles.appTitle}>{item.title}</Text>
      <Text style={styles.appCompany}>{companyLabel}</Text>
      <View style={styles.appMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={12} color="#888" />
          <Text style={styles.metaText}>Applied: {formatDate(item.applied_at)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={12} color="#888" />
          <Text style={styles.metaText}>{item.location}</Text>
        </View>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
        <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
      </View>
      <View style={styles.appActions}>
        <TouchableOpacity style={styles.withdrawBtn} onPress={() => onWithdraw(item.id)}>
          <Text style={styles.withdrawText}>Withdraw</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.detailsBtn}>
          <Text style={styles.detailsText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FB' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0F172A' },
  headerSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  headerBtn: {
    width: 40, height: 40, borderRadius: 8,
    backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row', paddingHorizontal: 16, gap: 10,
    paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB',
  },
  statCard: {
    flex: 1, backgroundColor: '#F8FAFC', borderRadius: 12,
    padding: 12, flexDirection: 'row', alignItems: 'center',
    borderWidth: 0.5, borderColor: '#E5E7EB',
  },
  statLabel: { fontSize: 10, color: '#888', letterSpacing: 0.5 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#2563EB', marginTop: 2 },
  filterTabs: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB', gap: 4,
  },
  filterTab: { paddingHorizontal: 10, paddingVertical: 6 },
  filterTabActive: { fontSize: 13, fontWeight: '700', color: '#2563EB', borderBottomWidth: 2, borderBottomColor: '#2563EB' },
  filterTabText: { fontSize: 13, color: '#64748B' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 12, marginBottom: 6,
    paddingHorizontal: 14, height: 48,
    borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A' },
  cardsContainer: { paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  emptyText: { fontSize: 13, color: '#64748B', textAlign: 'center' },
  browseBtn: { marginTop: 8, backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  browseBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  appCard: {
    backgroundColor: '#fff', borderRadius: 14,
    padding: 16, borderWidth: 0.5, borderColor: '#E5E7EB',
  },
  appLogo: {
    width: 52, height: 52, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  appLogoText: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  appTitle: { fontSize: 17, fontWeight: 'bold', color: '#0F172A', marginBottom: 4 },
  appCompany: { fontSize: 13, color: '#2563EB', fontWeight: '500', marginBottom: 8 },
  appMeta: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: '#888' },
  statusBadge: { paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  statusText: { fontSize: 13, fontWeight: '600' },
  appActions: { flexDirection: 'row', gap: 10 },
  withdrawBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    borderWidth: 0.5, borderColor: '#D1D5DB', alignItems: 'center', backgroundColor: '#fff',
  },
  withdrawText: { fontSize: 13, color: '#444', fontWeight: '500' },
  detailsBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#2563EB', alignItems: 'center' },
  detailsText: { fontSize: 13, color: '#fff', fontWeight: 'bold' },
});
