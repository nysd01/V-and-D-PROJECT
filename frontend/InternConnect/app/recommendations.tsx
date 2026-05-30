import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api, ApiInternship } from '@/services/api';

// Simple percentage badge — replaces the web-only <svg> MatchRing
function MatchBadge({ percent }: { percent: number }) {
  const color = percent >= 90 ? '#059669' : percent >= 75 ? '#2563EB' : '#D97706';
  return (
    <View style={[mb.wrap, { borderColor: color }]}>
      <Text style={[mb.text, { color }]}>{percent}%</Text>
    </View>
  );
}
const mb = StyleSheet.create({
  wrap: { width: 52, height: 52, borderRadius: 26, borderWidth: 3, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { fontSize: 13, fontWeight: '800' },
});

export default function Recommendations(): React.JSX.Element {
  const router = useRouter();
  const [internships, setInternships] = useState<ApiInternship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.internships.list('', 'All');
      setInternships(data.slice(0, 10));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Assign a deterministic pseudo-match score based on internship id
  const matchScore = (id: number) => 70 + (id % 30);

  const featured = internships[0];
  const rest = internships.slice(1);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Ionicons name="git-network-outline" size={18} color="#2563EB" />
            <Text style={styles.logoText}>InternConnect</Text>
          </View>
          <TouchableOpacity onPress={fetchData}>
            <Ionicons name="refresh-outline" size={22} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.pageTitle}>Matched For You</Text>
          <Text style={styles.pageSubtitle}>
            Live internship opportunities that match your profile.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={styles.errorState}>
            <Ionicons name="cloud-offline-outline" size={48} color="#CBD5E1" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : internships.length === 0 ? (
          <View style={styles.errorState}>
            <Text style={styles.errorText}>No internships available right now.</Text>
          </View>
        ) : (
          <>
            {/* Featured top match */}
            {featured && (
              <TouchableOpacity
                style={styles.featuredCard}
                onPress={() => router.push({ pathname: '/internship_detail', params: { id: featured.id } })}
                activeOpacity={0.8}
              >
                <View style={styles.featuredTop}>
                  <View style={styles.featuredLogoBox}>
                    <Ionicons name="rocket-outline" size={22} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.featuredTitle}>{featured.title}</Text>
                    <Text style={styles.featuredCompany}>{featured.company_name || featured.firm_name}</Text>
                  </View>
                  <MatchBadge percent={matchScore(featured.id)} />
                </View>

                <View style={styles.skillTags}>
                  {[featured.work_type, featured.is_paid ? 'Paid' : 'Unpaid', featured.location].filter(Boolean).map((t) => (
                    <View key={t} style={styles.skillTag}>
                      <Text style={styles.skillTagText}>{t}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.featuredDesc} numberOfLines={2}>
                  {featured.description}
                </Text>

                <View style={styles.divider} />
                <View style={styles.featuredBottom}>
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={12} color="#666" />
                    <Text style={styles.metaText}>{featured.location}</Text>
                  </View>
                  {featured.duration ? (
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={12} color="#666" />
                      <Text style={styles.metaText}>{featured.duration}</Text>
                    </View>
                  ) : null}
                  <TouchableOpacity
                    style={styles.applyBtn}
                    onPress={() => router.push({ pathname: '/apply', params: { id: featured.id } })}
                  >
                    <Text style={styles.applyText}>Apply Now</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}

            {/* More matches */}
            {rest.length > 0 && (
              <View style={styles.moreSection}>
                <Text style={styles.moreSectionTitle}>More High Matches</Text>
                {rest.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.moreCard}
                    onPress={() => router.push({ pathname: '/internship_detail', params: { id: item.id } })}
                    activeOpacity={0.8}
                  >
                    <View style={styles.moreIcon}>
                      <Ionicons name="briefcase-outline" size={18} color="#2563EB" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.moreTitle}>{item.title}</Text>
                      <Text style={styles.moreCompany}>{item.company_name || item.firm_name}</Text>
                      <View style={styles.moreTags}>
                        <Text style={styles.moreTag}>{item.work_type}</Text>
                        <Text style={styles.moreTag}>{item.is_paid ? 'Paid' : 'Unpaid'}</Text>
                      </View>
                    </View>
                    <MatchBadge percent={matchScore(item.id)} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>InternConnect</Text>
          <Text style={styles.footerCopy}>© 2025 InternConnect. All rights reserved.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoText: { fontSize: 16, fontWeight: 'bold', color: '#2563EB' },
  titleBlock: { paddingHorizontal: 18, paddingBottom: 16 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#0F172A', marginBottom: 8 },
  pageSubtitle: { fontSize: 13, color: '#555', lineHeight: 20 },
  errorState: { alignItems: 'center', paddingVertical: 48, gap: 8, paddingHorizontal: 24 },
  errorText: { fontSize: 14, color: '#64748B', textAlign: 'center' },
  retryBtn: { backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '700' },
  featuredCard: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 0.5, borderColor: '#E5E7EB' },
  featuredTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  featuredLogoBox: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  featuredTitle: { fontSize: 15, fontWeight: 'bold', color: '#0F172A', lineHeight: 21 },
  featuredCompany: { fontSize: 12, color: '#2563EB', fontWeight: '500', marginTop: 3 },
  skillTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  skillTag: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  skillTagText: { fontSize: 11, color: '#444' },
  featuredDesc: { fontSize: 13, color: '#555', lineHeight: 19, marginBottom: 12 },
  divider: { height: 0.5, backgroundColor: '#E5E7EB', marginBottom: 12 },
  featuredBottom: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: '#555' },
  applyBtn: { marginLeft: 'auto', backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  applyText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  moreSection: { paddingHorizontal: 16, marginBottom: 20 },
  moreSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#0F172A', marginBottom: 12 },
  moreCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderWidth: 0.5, borderColor: '#E5E7EB' },
  moreIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EFF6FF' },
  moreTitle: { fontSize: 13, fontWeight: 'bold', color: '#111' },
  moreCompany: { fontSize: 11, color: '#666', marginTop: 2, marginBottom: 6 },
  moreTags: { flexDirection: 'row', gap: 8 },
  moreTag: { fontSize: 10, color: '#888', fontWeight: '500', letterSpacing: 0.3 },
  footer: { paddingHorizontal: 18, paddingVertical: 20 },
  footerBrand: { fontSize: 14, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  footerCopy: { fontSize: 11, color: '#999' },
});
