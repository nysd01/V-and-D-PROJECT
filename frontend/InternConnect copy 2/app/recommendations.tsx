import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SkillGap {
  id: number;
  skill: string;
  status: string;
  statusColor: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
}

interface MoreMatch {
  id: number;
  title: string;
  company: string;
  tags: string[];
  match: number;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
}

interface NavItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
}

interface MatchRingProps {
  percent: number;
  size?: number;
}

const SKILL_GAPS: SkillGap[] = [
  {
    id: 1,
    skill: 'Auto-layout',
    status: 'Expert',
    statusColor: '#059669',
    icon: 'checkmark-circle',
    iconColor: '#059669',
  },
  {
    id: 2,
    skill: 'Animation',
    status: '+15% Match',
    statusColor: '#2563EB',
    icon: 'trending-up',
    iconColor: '#DC2626',
  },
];

const MORE_MATCHES: MoreMatch[] = [
  {
    id: 1,
    title: 'Visual Design Intern',
    company: 'Creative Bloom Agency',
    tags: ['REMOTE', 'FULL-TIME'],
    match: 85,
    icon: 'person-outline',
    iconColor: '#2563EB',
    iconBg: '#EFF6FF',
  },
  {
    id: 2,
    title: 'UX Research Associate',
    company: 'DataFlow Dynamics',
    tags: ['NEW YORK', 'SUMMER 2024'],
    match: 78,
    icon: 'flash-outline',
    iconColor: '#7C3AED',
    iconBg: '#F5F3FF',
  },
  {
    id: 3,
    title: 'Interface Design Lead',
    company: 'Nebula Cloud',
    tags: ['AUSTIN', 'PAID'],
    match: 92,
    icon: 'people-outline',
    iconColor: '#059669',
    iconBg: '#ECFDF5',
  },
];

export default function Recommendations(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Ionicons name="git-network-outline" size={18} color="#2563EB" />
            <Text style={styles.logoText}>InternConnect</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="menu-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* PAGE TITLE */}
        <View style={styles.titleBlock}>
          <Text style={styles.pageTitle}>Matched For You</Text>
          <Text style={styles.pageSubtitle}>
            Based on your skills in UI/UX Design, Prototyping, and Design Systems,
            we've found these high-compatibility opportunities.
          </Text>
          <TouchableOpacity style={styles.updateBtn}>
            <Ionicons name="refresh-outline" size={14} color="#333" />
            <Text style={styles.updateText}>Update Profile</Text>
          </TouchableOpacity>
        </View>

        {/* FEATURED CARD */}
        <View style={styles.featuredCard}>
          <View style={styles.featuredTop}>
            <View style={styles.featuredLogoBox}>
              <Ionicons name="rocket-outline" size={22} color="#2563EB" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.featuredTitle}>Senior Product{'\n'}Design Intern</Text>
              <Text style={styles.featuredCompany}>Stellar Tech Systems</Text>
            </View>
            <MatchRing percent={98} size={52} />
          </View>

          {/* Skill tags */}
          <View style={styles.skillTags}>
            {['Figma', 'Design Systems', 'React Basics', 'User Research'].map((t) => (
              <View key={t} style={styles.skillTag}>
                <Text style={styles.skillTagText}>{t}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.featuredDesc}>
            Join our high-velocity design team to shape the future of decentralized...
          </Text>

          <View style={styles.divider} />

          <View style={styles.featuredBottom}>
            <View style={styles.featuredMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={12} color="#666" />
                <Text style={styles.metaText}>San Francisco{'\n'}(Hybrid)</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="cash-outline" size={12} color="#666" />
                <Text style={styles.metaText}>$45 -{'\n'}$55/hr</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.applyBtn}>
              <Text style={styles.applyText}>Apply{'\n'}Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SMART MATCH ENGINE BANNER */}
        <View style={styles.smartBanner}>
          <Ionicons name="sparkles" size={22} color="#fff" style={{ marginBottom: 8 }} />
          <Text style={styles.smartTitle}>Smart Match Engine</Text>
          <Text style={styles.smartDesc}>
            We've analyzed 42 new roles today that fit your specific skill profile and career goals.
          </Text>
          <View style={styles.smartBar}>
            <View style={styles.smartBarFill} />
          </View>
        </View>

        {/* TOP SKILL GAPS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Skill Gaps</Text>
          {SKILL_GAPS.map((gap) => (
            <View key={gap.id} style={styles.gapRow}>
              <Ionicons name={gap.icon} size={18} color={gap.iconColor} />
              <Text style={styles.gapSkill}>{gap.skill}</Text>
              <Text style={[styles.gapStatus, { color: gap.statusColor }]}>
                {gap.status}
              </Text>
            </View>
          ))}
        </View>

        {/* MORE HIGH MATCHES */}
        <View style={styles.moreSection}>
          <Text style={styles.moreSectionTitle}>More High Matches</Text>
          {MORE_MATCHES.map((item) => (
            <TouchableOpacity key={item.id} style={styles.moreCard}>
              <View style={[styles.moreIcon, { backgroundColor: item.iconBg }]}>
                <Ionicons name={item.icon} size={18} color={item.iconColor} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.moreTitle}>{item.title}</Text>
                <Text style={styles.moreCompany}>{item.company}</Text>
                <View style={styles.moreTags}>
                  {item.tags.map((tag) => (
                    <Text key={tag} style={styles.moreTag}>{tag}</Text>
                  ))}
                </View>
              </View>
              <MatchRing percent={item.match} size={42} />
            </TouchableOpacity>
          ))}
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>InternConnect</Text>
          <Text style={styles.footerCopy}>© 2024 InternConnect. All rights reserved.</Text>
          <View style={styles.footerLinks}>
            <Text style={styles.footerLink}>Privacy Policy</Text>
            <Text style={styles.footerLink}>Terms of Service</Text>
            <Text style={styles.footerLink}>Help Center</Text>
            <Text style={styles.footerLink}>Contact Us</Text>
          </View>
        </View>

      </ScrollView>

      
    </View>
  );
}

//////////////////////////////////////////////////////
// COMPONENTS
//////////////////////////////////////////////////////

const MatchRing: React.FC<MatchRingProps> = ({ percent, size = 52 }) => {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (percent / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <svg
        width={size}
        height={size}
        style={{ position: 'absolute' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={4}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#059669"
          strokeWidth={4}
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <Text style={{ fontSize: size > 46 ? 13 : 11, fontWeight: 'bold', color: '#111' }}>
        {percent}%
      </Text>
    </View>
  );
};

const NavItem: React.FC<NavItemProps> = ({ icon, label, active }) => (
  <View style={styles.navItem}>
    <Ionicons name={icon} size={20} color={active ? '#2563EB' : '#777'} />
    <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
  </View>
);

//////////////////////////////////////////////////////
// STYLES
//////////////////////////////////////////////////////

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FB' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#F5F7FB',
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoText: { fontSize: 16, fontWeight: 'bold', color: '#2563EB' },

  titleBlock: { paddingHorizontal: 18, paddingBottom: 16 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#0F172A', marginBottom: 8 },
  pageSubtitle: { fontSize: 13, color: '#555', lineHeight: 20, marginBottom: 14 },
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#D1D5DB',
  },
  updateText: { fontSize: 13, color: '#333', fontWeight: '500' },

  featuredCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  featuredTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  featuredLogoBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredTitle: { fontSize: 15, fontWeight: 'bold', color: '#0F172A', lineHeight: 21 },
  featuredCompany: { fontSize: 12, color: '#2563EB', fontWeight: '500', marginTop: 3 },
  skillTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  skillTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  skillTagText: { fontSize: 11, color: '#444' },
  featuredDesc: { fontSize: 13, color: '#555', lineHeight: 19, marginBottom: 12 },
  divider: { height: 0.5, backgroundColor: '#E5E7EB', marginBottom: 12 },
  featuredBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  featuredMeta: { flexDirection: 'row', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  metaText: { fontSize: 11, color: '#555', lineHeight: 16 },
  applyBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyText: { color: '#fff', fontWeight: 'bold', fontSize: 13, textAlign: 'center' },

  smartBanner: {
    backgroundColor: '#2563EB',
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
  },
  smartTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 6 },
  smartDesc: { fontSize: 13, color: '#BFDBFE', lineHeight: 19, marginBottom: 12 },
  smartBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
  },
  smartBarFill: {
    height: 4,
    width: '65%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },

  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#111', marginBottom: 12 },
  gapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#F3F4F6',
  },
  gapSkill: { flex: 1, fontSize: 13, color: '#333' },
  gapStatus: { fontSize: 13, fontWeight: '600' },

  moreSection: { paddingHorizontal: 16, marginBottom: 20 },
  moreSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#0F172A', marginBottom: 12 },
  moreCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  moreIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreTitle: { fontSize: 13, fontWeight: 'bold', color: '#111' },
  moreCompany: { fontSize: 11, color: '#666', marginTop: 2, marginBottom: 6 },
  moreTags: { flexDirection: 'row', gap: 8 },
  moreTag: { fontSize: 10, color: '#888', fontWeight: '500', letterSpacing: 0.3 },

  footer: { paddingHorizontal: 18, paddingVertical: 20 },
  footerBrand: { fontSize: 14, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  footerCopy: { fontSize: 11, color: '#999', marginBottom: 12 },
  footerLinks: { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },
  footerLink: { fontSize: 12, color: '#555' },

  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  navItem: { alignItems: 'center', gap: 3 },
  navLabel: { fontSize: 10, color: '#777' },
  navLabelActive: { color: '#2563EB', fontWeight: '500' },
});
