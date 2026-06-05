import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { api, ApiInternship } from '../../services/api';

export default function FirmProfile(): React.JSX.Element {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [postings, setPostings] = useState<ApiInternship[]>([]);

  useEffect(() => {
    api.internships.mine().then(setPostings).catch(() => {});
  }, []);

  const activeCount = postings.filter((posting) => posting.status === 'active').length;
  const applicantCount = postings.reduce((total, posting) => total + (posting.applicant_count ?? 0), 0);

  const confirmLogout = () => {
    Alert.alert('Logout', 'Do you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => { logout(); router.replace('/login'); } },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <Text style={styles.brand}>InternConnect</Text>
          <Text style={styles.headerLabel}>Firm Profile</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(company)/profile_public')}>
          <Ionicons name="settings-outline" size={22} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <View style={styles.banner}>
        <View style={styles.bannerPlaceholder}>
          <Ionicons name="business-outline" size={24} color="#DBEAFE" />
          <Text style={styles.bannerPlaceholderText}>Company Overview</Text>
        </View>
      </View>

      <View style={styles.logoRow}>
        <View style={styles.logoWrap}>
          {user?.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={styles.logoImage} />
          ) : (
            <View style={styles.logoFallback}>
              <Ionicons name="business-outline" size={34} color="#0F4BCC" />
            </View>
          )}
        </View>
        <View style={styles.logoTextWrap}>
          <Text style={styles.logoCompany}>{user?.companyName || user?.name || 'Company'}</Text>
          <Text style={styles.logoSub}>{user?.industry || 'Industry not set'}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <SectionTitle icon="briefcase-outline" title="Company Details" />
        <InfoField label="Company Name" value={user?.companyName || user?.name || 'Company'} />
        <InfoField label="Industry" value={user?.industry || 'Not provided'} />
        <InfoField label="Location" value={user?.address || 'Not provided'} />
        <InfoField label="Email" value={user?.email || ''} />
      </View>

      <View style={styles.card}>
        <SectionTitle icon="briefcase-outline" title="Posting Summary" />
        <InfoField label="Active Postings" value={String(activeCount)} />
        <InfoField label="Total Applicants" value={String(applicantCount)} />
        <InfoField label="Latest Posting" value={postings[0]?.title || 'No postings yet'} />
      </View>

      <TouchableOpacity style={styles.publicBtn} onPress={() => router.push('/(company)/profile_public')}><Text style={styles.publicText}>View Public Profile</Text></TouchableOpacity>
      <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout}><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
    </ScrollView>
  );
}

function SectionTitle({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) {
  return (
    <View style={styles.sectionTitleWrap}>
      <Ionicons name={icon} size={18} color="#0F4BCC" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.readOnlyField}>
        <Text style={styles.readOnlyText}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FB' },
  content: { paddingBottom: 28, paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 18, paddingBottom: 12 },
  headerBrand: { gap: 4 },
  brand: { fontSize: 20, fontWeight: '800', color: '#0F4BCC' },
  headerLabel: { fontSize: 32, fontWeight: '800', color: '#0F172A' },
  banner: { height: 130, borderRadius: 20, backgroundColor: '#0F4BCC', marginBottom: -28 },
  bannerPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  bannerPlaceholderText: { color: '#DBEAFE', fontSize: 12, fontWeight: '700' },
  logoRow: { marginTop: -20, marginBottom: 2, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4 },
  logoWrap: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#FFFFFF', borderWidth: 3, borderColor: '#FFFFFF', overflow: 'hidden' },
  logoImage: { width: '100%', height: '100%' },
  logoFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6FF' },
  logoTextWrap: { flex: 1 },
  logoCompany: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  logoSub: { fontSize: 12, color: '#475569', marginTop: 4 },
  card: { marginTop: 14, backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#D7DCE6', padding: 16 },
  sectionTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  readOnlyField: { minHeight: 50, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 14, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: '#F8FAFC' },
  readOnlyText: { fontSize: 16, color: '#111827', fontWeight: '600' },
  publicBtn: { marginTop: 10, backgroundColor: '#DBEAFE', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  publicText: { color: '#0F4BCC', fontSize: 16, fontWeight: '800' },
  logoutBtn: { marginTop: 10, borderRadius: 16, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#EF4444', backgroundColor: '#FFFFFF' },
  logoutText: { color: '#EF4444', fontSize: 16, fontWeight: '800' },
});