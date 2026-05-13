import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { ApiInternship } from '@/types';

export default function FirmProfilePublic(): React.JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const [postings, setPostings] = useState<ApiInternship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.internships.mine().then(setPostings).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={22} color="#FFFFFF" /></TouchableOpacity>
        <Text style={styles.topTitle}>Firm Profile</Text>
        <TouchableOpacity onPress={() => router.push('/(firm)/firm_profile')}><Ionicons name="pencil" size={20} color="#FFFFFF" /></TouchableOpacity>
      </View>

      <View style={styles.hero} />
      <View style={styles.profileBadge}><Text style={styles.profileInitial}>F</Text></View>

      <Text style={styles.companyName}>{user?.companyName || 'Company Name'}</Text>
      <Text style={styles.tagline}>Technology & Software • San Francisco, CA • www.company.io</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Company Bio</Text>
        <Text style={styles.bioText}>{user?.companyName || 'This company'} is actively hiring through InternConnect.</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.sectionTitle}>Recent Postings</Text>
        </View>
        {loading ? (
          <ActivityIndicator size="small" color="#0F4BCC" style={{ marginTop: 12 }} />
        ) : postings.length > 0 ? (
          postings.slice(0, 3).map((posting) => (
            <View key={posting.id} style={styles.postingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.postingTitle}>{posting.title}</Text>
                <Text style={styles.postingMeta}>{posting.location || posting.work_type} • {posting.status === 'active' ? 'Open' : 'Closed'}</Text>
              </View>
              <View style={styles.matchPill}><Text style={styles.matchText}>{posting.applicant_count ?? 0} applicants</Text></View>
            </View>
          ))
        ) : (
          <Text style={styles.bioText}>No postings have been published yet.</Text>
        )}
        <TouchableOpacity style={styles.postBtn} onPress={() => router.push('/(firm)/firm_post_new')}>
          <Ionicons name="add" size={18} color="#0F4BCC" />
          <Text style={styles.postBtnText}>Post New Internship</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FB' },
  content: { paddingBottom: 28, paddingHorizontal: 14 },
  topBar: { height: 54, borderRadius: 18, backgroundColor: '#0F4BCC', marginTop: 10, marginBottom: -22, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 },
  topTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  hero: { height: 170, borderRadius: 22, backgroundColor: '#0B1220', marginTop: 18 },
  profileBadge: { width: 86, height: 86, borderRadius: 24, backgroundColor: '#FFFFFF', alignSelf: 'flex-start', marginTop: -42, marginLeft: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#0F172A', shadowOpacity: 0.15, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  profileInitial: { fontSize: 38, fontWeight: '900', color: '#0F4BCC' },
  companyName: { marginTop: 18, fontSize: 28, fontWeight: '900', color: '#0F172A' },
  tagline: { marginTop: 8, fontSize: 15, lineHeight: 22, color: '#475569' },
  card: { marginTop: 14, backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#D7DCE6', padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  bioText: { marginTop: 10, fontSize: 15, lineHeight: 22, color: '#334155' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { color: '#0F4BCC', fontSize: 15, fontWeight: '800' },
  postingRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', padding: 12, marginTop: 10 },
  postingTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  postingMeta: { marginTop: 4, fontSize: 13, color: '#64748B' },
  matchPill: { backgroundColor: '#6EE7B7', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  matchText: { color: '#14532D', fontSize: 12, fontWeight: '800' },
  postBtn: { marginTop: 12, borderRadius: 14, borderWidth: 1, borderColor: '#C7D2FE', borderStyle: 'dashed', paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, backgroundColor: '#F8FAFF' },
  postBtnText: { color: '#0F4BCC', fontSize: 15, fontWeight: '800' },
});
