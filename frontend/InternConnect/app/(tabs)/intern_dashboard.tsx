import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { api, ApiApplication, ApiInternship } from '../../services/api';

export default function Dashboard(): React.JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const [apps, setApps] = useState<ApiApplication[]>([]);
  const [roles, setRoles] = useState<ApiInternship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [applicationData, roleData] = await Promise.all([
        api.applications.list(),
        api.internships.list(),
      ]);
      setApps(applicationData);
      setRoles(roleData);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeRoles = useMemo(() => roles.filter((role) => role.status === 'active'), [roles]);
  const totalSent = apps.length;
  const pending = apps.filter((app) => app.status === 'Pending').length;
  const accepted = apps.filter((app) => app.status === 'Accepted').length;
  const recentApps = useMemo(() => apps.slice(0, 3), [apps]);
  const recommended = useMemo(() => activeRoles.slice(0, 3), [activeRoles]);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.logo}>InternConnect</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={() => router.push('/(tabs)/browse')}>
              <Ionicons name="search-outline" size={20} color="#2563EB" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
              {user?.profilePicture ? (
                <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar}>
                  <Ionicons name="person-circle" size={28} color="#2563EB" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Welcome back, {user?.name || 'Alex'}!</Text>
          <Text style={styles.welcomeText}>
            You have {pending} pending application{pending === 1 ? '' : 's'} and {activeRoles.length} live opportunity{activeRoles.length === 1 ? '' : 'ies'} to explore.
          </Text>

          <TouchableOpacity style={styles.recommendBtn} onPress={() => router.push('/(tabs)/browse')}>
            <Text style={styles.recommendText}>View Recommendations</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <StatBox title="APPLICATIONS SENT" value={String(totalSent)} color="#2563EB" />
          <StatBox title="PENDING" value={String(pending)} color="#DC2626" />
        </View>

        <View style={styles.statsRow}>
          <StatBox title="ACCEPTED" value={String(accepted)} color="#059669" />
          <StatBox title="OPEN ROLES" value={String(activeRoles.length)} color="#000" />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended for You</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/browse')}>
            <Text style={styles.viewAll}>View all →</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" style={{ marginVertical: 24 }} />
        ) : error ? (
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity style={styles.recommendBtn} onPress={fetchData}>
              <Text style={styles.recommendText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : recommended.length > 0 ? (
          recommended.map((role) => (
            <TouchableOpacity
              key={role.id}
              onPress={() => router.push({ pathname: '/internship_detail', params: { id: String(role.id) } })}
            >
              <JobCard
                title={role.title}
                company={role.company_name || role.firm_name || 'Company'}
                location={role.location}
                workType={role.work_type}
                paid={role.is_paid}
                duration={role.duration}
                firmLogo={role.firm_logo_url}
              />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyText}>No live roles are available right now.</Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Applications</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/myapplications')}>
            <Text style={styles.viewAll}>See History</Text>
          </TouchableOpacity>
        </View>

        {recentApps.length > 0 ? recentApps.map((application) => (
          <ApplicationRow
            key={application.id}
            company={application.company_name || application.firm_name || 'Company'}
            role={application.title}
            status={application.status}
            date={new Date(application.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          />
        )) : (
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyText}>No applications yet.</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerTitle}>InternConnect</Text>
          <Text style={styles.footerText}>© 2024 InternConnect. All rights reserved.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const StatBox = ({ title, value, color }: { title: string; value: string; color: string }) => (
  <View style={styles.statBox}>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
  </View>
);

const JobCard = ({
  title,
  company,
  location,
  workType,
  paid,
  duration,
  firmLogo,
}: {
  title: string;
  company: string;
  location?: string;
  workType: string;
  paid: boolean;
  duration?: string;
  firmLogo?: string;
}) => (
  <View style={styles.jobCard}>
    <View style={styles.jobTop}>
      <View style={styles.jobIcon}>
        {firmLogo ? (
          <Image 
            source={{ uri: firmLogo }} 
            style={{ width: 36, height: 36, borderRadius: 10 }}
          />
        ) : (
          <Ionicons name="briefcase" size={20} color="#2563EB" />
        )}
      </View>
      <Text style={styles.match}>{paid ? 'Paid' : 'Unpaid'}</Text>
    </View>

    <Text style={styles.jobTitle}>{title}</Text>
    <Text style={styles.jobCompany}>{company} • {location || workType} • {duration || 'Duration not set'}</Text>

    <View style={styles.tags}>
      <Tag text={workType} />
      <Tag text={paid ? 'Paid' : 'Unpaid'} />
    </View>
  </View>
);

const Tag = ({ text }: { text: string }) => (
  <View style={styles.tag}>
    <Text style={styles.tagText}>{text}</Text>
  </View>
);

const ApplicationRow = ({ company, role, status, date }: { company: string; role: string; status: string; date: string }) => (
  <View style={styles.appRow}>
    <View style={styles.appIcon} />
    <View style={{ flex: 1 }}>
      <Text style={styles.appCompany}>{company}</Text>
      <Text style={styles.appRole}>{role}</Text>
    </View>
    <View style={{ alignItems: 'flex-end' }}>
      <Text style={styles.appDate}>{status}</Text>
      <Text style={styles.appDate}>{date}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  logo: { fontSize: 18, fontWeight: 'bold', color: '#2563EB' },
  headerIcons: { flexDirection: 'row', gap: 15, alignItems: 'center' },
  avatar: { width: 30, height: 30, backgroundColor: '#ccc', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  welcomeCard: { backgroundColor: '#2563EB', margin: 20, borderRadius: 12, padding: 20 },
  welcomeTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  welcomeText: { color: '#E0E7FF', marginTop: 8 },
  recommendBtn: { backgroundColor: '#fff', padding: 10, borderRadius: 8, marginTop: 15, alignSelf: 'flex-start' },
  recommendText: { color: '#2563EB', fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 20 },
  statBox: { backgroundColor: '#fff', padding: 15, borderRadius: 10, width: '48%', marginBottom: 10 },
  statTitle: { fontSize: 10, color: '#888' },
  statValue: { fontSize: 20, fontWeight: 'bold', marginTop: 5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', margin: 20, alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold' },
  viewAll: { color: '#2563EB', fontWeight: 'bold' },
  emptyBlock: { alignItems: 'center', marginHorizontal: 20, marginVertical: 10, padding: 18, borderRadius: 12, backgroundColor: '#fff' },
  emptyText: { color: '#64748B', textAlign: 'center' },
  jobCard: { backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 14, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 1 },
  jobTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  jobIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#E5EEFF' },
  match: { color: '#2563EB', fontWeight: 'bold' },
  jobTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 12 },
  jobCompany: { marginTop: 4, color: '#475569' },
  tags: { flexDirection: 'row', gap: 8, marginTop: 12 },
  tag: { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  tagText: { color: '#3730A3', fontSize: 12, fontWeight: '600' },
  appRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 12, backgroundColor: '#fff', padding: 14, borderRadius: 12 },
  appIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#E5E7EB', marginRight: 12 },
  appCompany: { fontSize: 14, fontWeight: '700' },
  appRole: { color: '#475569', marginTop: 2 },
  appDate: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  footer: { paddingVertical: 30, alignItems: 'center' },
  footerTitle: { fontSize: 16, fontWeight: 'bold', color: '#2563EB' },
  footerText: { fontSize: 12, color: '#64748B', marginTop: 4 },
});