import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { api, ApiApplication, ApiInternship } from '../../services/api';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
}

export default function Profile(): React.JSX.Element {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [apps, setApps] = useState<ApiApplication[]>([]);
  const [firmPostings, setFirmPostings] = useState<ApiInternship[]>([]);

  useEffect(() => {
    if (user?.type === 'intern') {
      api.applications.list().then(setApps).catch(() => {});
    }
    if (user?.type === 'firm') {
      api.internships.mine().then(setFirmPostings).catch(() => {});
    }
  }, [user]);

  const totalApps = apps.length;
  const accepted = apps.filter((a) => a.status === 'Accepted').length;
  const interviews = apps.filter((a) => a.status === 'Interviewing').length;
  const activePosts = firmPostings.filter((posting) => posting.status === 'active').length;
  const applicants = firmPostings.reduce((total, posting) => total + (posting.applicant_count ?? 0), 0);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const displayName = user?.name ?? 'User';
  const displayEmail = user?.email ?? '';
  const displaySub = user?.type === 'intern'
    ? (user?.university ?? 'University not set')
    : (user?.companyName ?? user?.name ?? 'Company');

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Profile</Text>
            <Text style={styles.headerSubtitle}>Your account & settings</Text>
          </View>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.coverWrap}>
            <View style={styles.coverGradient}>
              <Text style={styles.coverLabel}>{user?.type === 'firm' ? 'Firm Account' : 'Intern Account'}</Text>
            </View>
          </View>

          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {user?.profilePicture ? (
                <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userTitle}>{displaySub}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{user?.type === 'intern' ? 'Intern' : 'Firm'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {user?.type === 'intern' ? (
            <View style={styles.statsRow}>
              <StatCard label="Applications" value={String(totalApps)} />
              <StatCard label="Interviews" value={String(interviews)} />
              <StatCard label="Accepted" value={String(accepted)} />
            </View>
          ) : (
            <View style={styles.statsRow}>
              <StatCard label="Active Posts" value={String(activePosts)} />
              <StatCard label="Applicants" value={String(applicants)} />
              <StatCard label="Accepted" value="—" />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Account Information</Text>
          <SettingItem icon="mail-outline" title="Email" subtitle={displayEmail} />
          {user?.type === 'intern' ? (
            <SettingItem icon="school-outline" title="University" subtitle={displaySub} />
          ) : (
            <SettingItem icon="business-outline" title="Company" subtitle={displaySub} />
          )}
          {user?.type === 'firm' && user?.industry ? (
            <SettingItem icon="briefcase-outline" title="Industry" subtitle={user.industry} />
          ) : null}
          {user?.type === 'firm' && user?.address ? (
            <SettingItem icon="location-outline" title="Address" subtitle={user.address} />
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Preferences</Text>
          <SettingItem
            icon="notifications-outline"
            title="Notifications"
            onPress={() => router.push('/(tabs)/notifications')}
            trailing={<Ionicons name="chevron-forward" size={16} color="#999" />}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Account</Text>
          <SettingItem
            icon="information-circle-outline"
            title="About InternConnect"
            onPress={() => Alert.alert('About', 'Version 1.0.0')}
            trailing={<Ionicons name="chevron-forward" size={16} color="#999" />}
          />
          <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
            <View style={[styles.settingIcon, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="log-out-outline" size={20} color="#DC2626" />
            </View>
            <Text style={styles.logoutText}>Logout</Text>
            <Ionicons name="chevron-forward" size={16} color="#DC2626" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 InternConnect. All rights reserved.</Text>
          <Text style={styles.footerVersion}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const StatCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.statCard}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const SettingItem: React.FC<SettingItemProps> = ({ icon, title, subtitle, onPress, trailing }) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
    <View style={styles.settingIcon}>
      <Ionicons name={icon} size={20} color="#2563EB" />
    </View>
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle}>{title}</Text>
      {subtitle ? <Text style={styles.settingSubtitle}>{subtitle}</Text> : null}
    </View>
    {trailing ?? null}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0F172A' },
  headerSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  profileCard: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  coverWrap: { height: 130, borderRadius: 10, overflow: 'hidden', backgroundColor: '#EFF6FF', marginBottom: 14 },
  coverGradient: { flex: 1, justifyContent: 'flex-end', padding: 16, backgroundColor: '#0F4BCC' },
  coverLabel: { color: '#DBEAFE', fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  profileHeader: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  avatarContainer: { alignItems: 'center', position: 'relative' },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  userInfo: { flex: 1, justifyContent: 'center', gap: 4 },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  userTitle: { fontSize: 13, color: '#64748B' },
  roleBadge: { alignSelf: 'flex-start', backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 2 },
  roleBadgeText: { fontSize: 11, color: '#2563EB', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  statCard: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 8, padding: 10, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#2563EB' },
  statLabel: { fontSize: 10, color: '#64748B', marginTop: 4, textAlign: 'center' },
  section: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  sectionHeader: { fontSize: 13, fontWeight: '600', color: '#0F172A', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  settingItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 12 },
  settingIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: 14, fontWeight: '500', color: '#0F172A' },
  settingSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  logoutRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  logoutText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#DC2626' },
  footer: { paddingVertical: 20, paddingHorizontal: 16, alignItems: 'center', gap: 4 },
  footerText: { fontSize: 12, color: '#64748B' },
  footerVersion: { fontSize: 11, color: '#94A3B8' },
});