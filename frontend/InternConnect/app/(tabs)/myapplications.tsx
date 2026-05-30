import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, TextInput, Modal,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api, ApiApplication } from '../../services/api';

const LOGO_COLORS = ['#2563EB', '#DC2626', '#059669', '#7C3AED', '#0F172A', '#4B5563', '#D97706', '#0891B2'];
function logoBg(id: number) { return LOGO_COLORS[id % LOGO_COLORS.length]; }
function logoText(name: string) { return name.slice(0, 2).toUpperCase(); }
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Interviewing: { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
  Pending:      { bg: '#FEF9C3', text: '#92400E', border: '#FDE68A' },
  Accepted:     { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
  Rejected:     { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
};

type FilterKey = 'All' | 'Interviewing' | 'Pending' | 'Accepted';

// Extended type to include detail fields returned from the API
type AppWithDetail = ApiApplication & {
  cover_letter?: string;
  document_url?: string;
  interview_scheduled_at?: string;
};

// ─── Detail Modal ──────────────────────────────────────────────────────────
function ApplicationDetailModal({ app, onClose, onWithdraw }: {
  app: AppWithDetail;
  onClose: () => void;
  onWithdraw: (id: number) => void;
}) {
  const companyLabel = app.company_name || app.firm_name;
  const statusStyle = STATUS_STYLES[app.status] ?? STATUS_STYLES.Pending;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={dm.container}>
        <View style={dm.header}>
          <TouchableOpacity onPress={onClose} style={dm.closeBtn}>
            <Ionicons name="close" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={dm.headerTitle}>Application Detail</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={dm.content}>
          {/* Company logo + title */}
          <View style={[dm.logoWrap, { backgroundColor: logoBg(app.internship_id) }]}>
            <Text style={dm.logoText}>{logoText(companyLabel)}</Text>
          </View>
          <Text style={dm.title}>{app.title}</Text>
          <Text style={dm.company}>{companyLabel}</Text>

          {/* Status badge */}
          <View style={[dm.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
            <View style={[dm.statusDot, { backgroundColor: statusStyle.text }]} />
            <Text style={[dm.statusText, { color: statusStyle.text }]}>{app.status}</Text>
          </View>

          {/* Meta info grid */}
          <View style={dm.metaGrid}>
            <MetaCell icon="location-outline" label="Location" value={app.location || '—'} />
            <MetaCell icon="briefcase-outline" label="Work Type" value={app.work_type || '—'} />
            <MetaCell icon="cash-outline" label="Compensation" value={app.is_paid ? 'Paid' : 'Unpaid'} />
            <MetaCell icon="time-outline" label="Duration" value={app.duration || '—'} />
          </View>

          {/* Applied date */}
          <InfoRow icon="calendar-outline" label="Applied On" value={formatDate(app.applied_at)} />

          {/* Interview time */}
          {(app as any).interview_scheduled_at ? (
            <View style={dm.interviewBanner}>
              <Ionicons name="calendar" size={18} color="#7C3AED" />
              <View style={{ flex: 1 }}>
                <Text style={dm.interviewLabel}>Interview Scheduled</Text>
                <Text style={dm.interviewTime}>{formatDateTime((app as any).interview_scheduled_at)}</Text>
              </View>
            </View>
          ) : app.status === 'Interviewing' ? (
            <View style={[dm.interviewBanner, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="calendar-outline" size={18} color="#2563EB" />
              <Text style={[dm.interviewLabel, { color: '#2563EB', marginLeft: 8 }]}>Interview details coming soon</Text>
            </View>
          ) : null}

          {/* Cover letter */}
          {(app as any).cover_letter ? (
            <View style={dm.section}>
              <Text style={dm.sectionTitle}>Cover Letter</Text>
              <Text style={dm.coverLetter}>{(app as any).cover_letter}</Text>
            </View>
          ) : null}

          {/* Document */}
          {(app as any).document_url ? (
            <TouchableOpacity
              style={dm.docBtn}
              onPress={async () => {
                const url = (app as any).document_url;
                if (!url || url.startsWith('file://')) {
                  Alert.alert('Not available', 'This document cannot be viewed remotely.');
                  return;
                }
                try { await WebBrowser.openBrowserAsync(url); } catch { Alert.alert('Error', 'Could not open document'); }
              }}
            >
              <Ionicons name="document-text-outline" size={18} color="#0F4BCC" />
              <Text style={dm.docBtnText}>View Submitted Document / CV</Text>
              <Ionicons name="open-outline" size={16} color="#0F4BCC" />
            </TouchableOpacity>
          ) : null}

          {/* Status timeline */}
          <View style={dm.section}>
            <Text style={dm.sectionTitle}>Application Timeline</Text>
            <TimelineStep label="Applied" date={formatDate(app.applied_at)} done />
            <TimelineStep label="Under Review" date="" done={app.status !== 'Pending'} />
            <TimelineStep label="Interview" date={(app as any).interview_scheduled_at ? formatDateTime((app as any).interview_scheduled_at) : ''} done={app.status === 'Interviewing' || app.status === 'Accepted'} />
            <TimelineStep label="Decision" date="" done={app.status === 'Accepted' || app.status === 'Rejected'} last />
          </View>

          {/* Withdraw */}
          {app.status !== 'Accepted' && app.status !== 'Rejected' ? (
            <TouchableOpacity style={dm.withdrawBtn} onPress={() => { onClose(); onWithdraw(app.id); }}>
              <Text style={dm.withdrawText}>Withdraw Application</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

function MetaCell({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={dm.metaCell}>
      <Ionicons name={icon} size={16} color="#64748B" />
      <Text style={dm.metaCellLabel}>{label}</Text>
      <Text style={dm.metaCellValue}>{value}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={dm.infoRow}>
      <Ionicons name={icon} size={16} color="#64748B" />
      <Text style={dm.infoRowLabel}>{label}</Text>
      <Text style={dm.infoRowValue}>{value}</Text>
    </View>
  );
}

function TimelineStep({ label, date, done, last }: { label: string; date: string; done: boolean; last?: boolean }) {
  return (
    <View style={dm.timelineStep}>
      <View style={{ alignItems: 'center', width: 20 }}>
        <View style={[dm.timelineDot, done && dm.timelineDotDone]} />
        {!last && <View style={[dm.timelineLine, done && dm.timelineLineDone]} />}
      </View>
      <View style={{ flex: 1, paddingBottom: last ? 0 : 16 }}>
        <Text style={[dm.timelineLabel, done && dm.timelineLabelDone]}>{label}</Text>
        {date ? <Text style={dm.timelineDate}>{date}</Text> : null}
      </View>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────
export default function MyApplications(): React.JSX.Element {
  const router = useRouter();
  const [apps, setApps] = useState<AppWithDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('All');
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState<AppWithDetail | null>(null);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setApps(await api.applications.list() as AppWithDetail[]);
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
        text: 'Withdraw', style: 'destructive',
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
    const q = search.trim().toLowerCase();
    return apps.filter((a) => {
      const matchesFilter = activeFilter === 'All' || a.status === activeFilter;
      const matchesSearch = !q || [a.title, a.company_name, a.firm_name, a.location, a.status]
        .some((s) => (s ?? '').toLowerCase().includes(q));
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
          <StatCard label="Total"      value={String(apps.length)} icon="document-text-outline" />
          <StatCard label="Interviews" value={String(interviewing)} icon="chatbubble-outline" />
          <StatCard label="Accepted"   value={String(accepted)} icon="checkmark-circle-outline" />
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
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterTabs}>
          {(['All', 'Interviewing', 'Pending', 'Accepted'] as FilterKey[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, activeFilter === f && styles.filterTabActiveStyle]}
              onPress={() => setActiveFilter(f)}
            >
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
              <AppCard
                key={item.id}
                item={item}
                onWithdraw={handleWithdraw}
                onViewDetail={() => setSelectedApp(item)}
              />
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

      {selectedApp && (
        <ApplicationDetailModal
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onWithdraw={handleWithdraw}
        />
      )}
    </View>
  );
}

const StatCard = ({ label, value, icon }: { label: string; value: string; icon: any }) => (
  <View style={styles.statCard}>
    <View style={{ flex: 1 }}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
    <Ionicons name={icon} size={22} color="#2563EB" />
  </View>
);

const AppCard = ({ item, onWithdraw, onViewDetail }: { item: AppWithDetail; onWithdraw: (id: number) => void; onViewDetail: () => void }) => {
  const statusStyle = STATUS_STYLES[item.status] ?? STATUS_STYLES.Pending;
  const companyLabel = item.company_name || item.firm_name;
  return (
    <TouchableOpacity style={styles.appCard} onPress={onViewDetail} activeOpacity={0.8}>
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
      <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border, borderWidth: 1 }]}>
        <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
      </View>
      <View style={styles.appActions}>
        <TouchableOpacity style={styles.withdrawBtn} onPress={(e) => { e.stopPropagation?.(); onWithdraw(item.id); }}>
          <Text style={styles.withdrawText}>Withdraw</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.detailsBtn} onPress={onViewDetail}>
          <Ionicons name="eye-outline" size={14} color="#fff" />
          <Text style={styles.detailsText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0F172A' },
  headerSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  headerBtn: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB' },
  statCard: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 0.5, borderColor: '#E5E7EB' },
  statLabel: { fontSize: 10, color: '#888', letterSpacing: 0.5 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#2563EB', marginTop: 2 },
  filterTabs: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB', gap: 4 },
  filterTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  filterTabActiveStyle: { backgroundColor: '#EFF6FF' },
  filterTabActive: { fontSize: 13, fontWeight: '700', color: '#2563EB' },
  filterTabText: { fontSize: 13, color: '#64748B' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 12, marginBottom: 6, paddingHorizontal: 14, height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#fff' },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A' },
  cardsContainer: { paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  emptyText: { fontSize: 13, color: '#64748B', textAlign: 'center' },
  browseBtn: { marginTop: 8, backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  browseBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  appCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: '#E5E7EB' },
  appLogo: { width: 52, height: 52, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  appLogoText: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  appTitle: { fontSize: 17, fontWeight: 'bold', color: '#0F172A', marginBottom: 4 },
  appCompany: { fontSize: 13, color: '#2563EB', fontWeight: '500', marginBottom: 8 },
  appMeta: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: '#888' },
  statusBadge: { paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  statusText: { fontSize: 13, fontWeight: '600' },
  appActions: { flexDirection: 'row', gap: 10 },
  withdrawBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 0.5, borderColor: '#D1D5DB', alignItems: 'center', backgroundColor: '#fff' },
  withdrawText: { fontSize: 13, color: '#444', fontWeight: '500' },
  detailsBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#2563EB', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  detailsText: { fontSize: 13, color: '#fff', fontWeight: 'bold' },
});

// Detail modal styles
const dm = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  closeBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  content: { padding: 20, paddingBottom: 40 },
  logoWrap: { width: 72, height: 72, borderRadius: 16, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 14 },
  logoText: { fontSize: 22, fontWeight: '800', color: '#fff' },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginBottom: 4 },
  company: { fontSize: 15, color: '#2563EB', fontWeight: '600', textAlign: 'center', marginBottom: 16 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginBottom: 20 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 14, fontWeight: '700' },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  metaCell: { width: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', gap: 4 },
  metaCellLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  metaCellValue: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10 },
  infoRowLabel: { flex: 1, fontSize: 13, color: '#64748B' },
  infoRowValue: { fontSize: 13, fontWeight: '600', color: '#0F172A' },
  interviewBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F5F3FF', borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#DDD6FE' },
  interviewLabel: { fontSize: 12, color: '#7C3AED', fontWeight: '600' },
  interviewTime: { fontSize: 14, fontWeight: '800', color: '#5B21B6', marginTop: 2 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 14 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  coverLetter: { fontSize: 14, color: '#374151', lineHeight: 22 },
  docBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EFF6FF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#BFDBFE', marginBottom: 14 },
  docBtnText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#0F4BCC' },
  timelineStep: { flexDirection: 'row', gap: 12 },
  timelineDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#E2E8F0', marginTop: 2 },
  timelineDotDone: { backgroundColor: '#2563EB' },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#E2E8F0', marginTop: 4, alignSelf: 'center' },
  timelineLineDone: { backgroundColor: '#2563EB' },
  timelineLabel: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },
  timelineLabelDone: { color: '#0F172A' },
  timelineDate: { fontSize: 12, color: '#64748B', marginTop: 2 },
  withdrawBtn: { marginTop: 10, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#DC2626', backgroundColor: '#fff' },
  withdrawText: { color: '#DC2626', fontSize: 15, fontWeight: '700' },
});
