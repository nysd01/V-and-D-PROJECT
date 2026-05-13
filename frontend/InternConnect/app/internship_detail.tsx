import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api, ApiInternship } from '@/services/api';

interface Requirement {
  id: number;
  text: string;
}

interface CompanyInfoRow {
  id: number;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

interface SimilarInternship {
  id: number;
  title: string;
  company: string;
  match: string;
  tags: string[];
  logo: string;
  logoColor: string;
  logoBg: string;
}

interface TagBadgeProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

interface RequirementItemProps {
  text: string;
}

interface SimilarCardProps {
  item: SimilarInternship;
}

interface NavItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress?: () => void;
}

const REQUIREMENTS: Requirement[] = [
  { id: 1, text: 'Currently enrolled in a Design or CS program.' },
  { id: 2, text: 'Strong portfolio demonstrating UI/UX skills.' },
  { id: 3, text: 'Proficiency in Figma and Prototyping tools.' },
  { id: 4, text: 'Excellent communication and problem-solving.' },
];

const COMPANY_INFO: CompanyInfoRow[] = [
  { id: 1, icon: 'business-outline', label: 'Industry', value: 'Enterprise Software' },
  { id: 2, icon: 'people-outline', label: 'Team Size', value: '500-1000 employees' },
  { id: 3, icon: 'globe-outline', label: 'Website', value: 'www.stellarsystems.com' },
];

const SIMILAR: SimilarInternship[] = [
  {
    id: 1,
    title: 'UI Designer Intern',
    company: 'Creative Flow Studio',
    match: '92%',
    tags: ['Paid', 'On-site'],
    logo: 'CF',
    logoColor: '#fff',
    logoBg: '#2563EB',
  },
  {
    id: 2,
    title: 'UX Research Intern',
    company: 'NextGen Labs',
    match: '89%',
    tags: ['Paid', 'Remote'],
    logo: 'NL',
    logoColor: '#fff',
    logoBg: '#059669',
  },
  {
    id: 3,
    title: 'Visual Design Intern',
    company: 'Lightbulb Media',
    match: '85%',
    tags: ['Unpaid', 'Hybrid'],
    logo: 'LM',
    logoColor: '#fff',
    logoBg: '#7C3AED',
  },
];

export default function InternshipDetail(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [applied, setApplied] = useState<boolean>(false);
  const [internship, setInternship] = useState<ApiInternship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInternship = async () => {
      if (!id) {
        setError('No internship selected');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await api.internships.get(parseInt(id));
        setInternship(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load internship');
      } finally {
        setLoading(false);
      }
    };
    fetchInternship();
  }, [id]);

  const handleApply = () => {
    router.push({ pathname: '/apply', params: { id: id || '' } });
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (error || !internship) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="alert-circle-outline" size={48} color="#DC2626" />
        <Text style={styles.errorText}>{error || 'Failed to load internship'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const companyName = internship.firm_name || internship.company_name;
  const paidText = internship.is_paid ? 'Paid' : 'Unpaid';
  const durationText = internship.duration || '3 Months';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HEADER WITH BACK BUTTON */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#2563EB" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Opportunity</Text>
          <TouchableOpacity>
            <Ionicons name="heart-outline" size={24} color="#999" />
          </TouchableOpacity>
        </View>

        {/* JOB HERO CARD */}
        <View style={styles.heroCard}>
          {/* Company row */}
          <View style={styles.heroTop}>
            <View style={styles.heroLogo}>
              <Ionicons name="briefcase-outline" size={24} color="#2563EB" />
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroTitle}>{internship.title}</Text>
              <Text style={styles.heroCompany}>{companyName}</Text>
              <View style={styles.heroMeta}>
                <Ionicons name="location-outline" size={12} color="#666" />
                <Text style={styles.heroMetaText}>{internship.location}</Text>
              </View>
            </View>
          </View>

          {/* Match badge */}
          <View style={styles.matchBadge}>
            <Ionicons name="star" size={14} color="#059669" />
            <Text style={styles.matchText}>98% Match Score</Text>
          </View>

          {/* Job details */}
          <View style={styles.detailsGrid}>
            <DetailBox icon="cash-outline" label={paidText} value="" />
            <DetailBox icon="calendar-outline" label="Duration" value={durationText} />
            <DetailBox icon="home-outline" label="Type" value={internship.work_type} />
          </View>

          {/* Apply button */}
          <TouchableOpacity
            style={[styles.applyBtn, applied && styles.applyBtnApplied]}
            onPress={handleApply}
          >
            <Ionicons name="checkmark-circle" size={16} color="#fff" />
            <Text style={styles.applyText}>
              {applied ? 'Applied' : 'Apply Now'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* DESCRIPTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.bodyText}>
            {internship.description}
          </Text>
        </View>

        {/* REQUIREMENTS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requirements</Text>
          {internship.requirements && internship.requirements.split('\n').filter(r => r.trim()).map((req, idx) => (
            <RequirementItem key={idx} text={req.trim()} />
          ))}
        </View>

        {/* COMPANY INFO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Info</Text>
          {COMPANY_INFO.map((row, idx) => (
            <View key={row.id}>
              <InfoRow icon={row.icon} label={row.label} value={row.value} />
              {idx < COMPANY_INFO.length - 1 && <View style={styles.infoDivider} />}
            </View>
          ))}
        </View>

        {/* SIMILAR INTERNSHIPS */}
        <View style={styles.similarSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Similar Opportunities</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/browse')}>
              <Text style={styles.seeAllLink}>See All</Text>
            </TouchableOpacity>
          </View>
          {SIMILAR.map((item) => (
            <SimilarCard key={item.id} item={item} />
          ))}
        </View>

        <View style={styles.spacer} />

      </ScrollView>

      {/* BOTTOM NAVIGATION */}
      <View style={styles.navbar}>
        <NavItem 
          icon="grid-outline" 
          label="Dashboard" 
          onPress={() => router.push('/(tabs)/intern_dashboard')}
        />
        <NavItem 
          icon="search-outline" 
          label="Browse" 
          onPress={() => router.push('/(tabs)/browse')}
        />
        <NavItem 
          icon="document-text-outline" 
          label="Applications" 
          onPress={() => router.push('/(tabs)/myapplications')}
        />
        <NavItem 
          icon="notifications-outline" 
          label="Updates" 
          onPress={() => router.push('/(tabs)/notifications')}
        />
        <NavItem 
          icon="person-outline" 
          label="Profile" 
          onPress={() => router.push('/(tabs)/profile')}
        />
      </View>
    </View>
  );
}
//////////////////////////////////////////////////////
// COMPONENTS
//////////////////////////////////////////////////////

const DetailBox: React.FC<{ icon: keyof typeof Ionicons.glyphMap; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <View style={styles.detailBox}>
    <View style={styles.detailIcon}>
      <Ionicons name={icon} size={16} color="#2563EB" />
    </View>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const TagBadge: React.FC<TagBadgeProps> = ({ icon, label }) => (
  <View style={styles.tagChip}>
    <Ionicons name={icon} size={13} color="#444" />
    <Text style={styles.tagChipText}>{label}</Text>
  </View>
);

const RequirementItem: React.FC<RequirementItemProps> = ({ text }) => (
  <View style={styles.reqRow}>
    <Ionicons name="checkmark-circle" size={18} color="#059669" />
    <Text style={styles.reqText}>{text}</Text>
  </View>
);

const InfoRow: React.FC<{ icon: keyof typeof Ionicons.glyphMap; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIconBox}>
      <Ionicons name={icon} size={18} color="#2563EB" />
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const SimilarCard: React.FC<SimilarCardProps> = ({ item }) => (
  <TouchableOpacity style={styles.similarCard} activeOpacity={0.7}>
    <View style={[styles.simLogo, { backgroundColor: item.logoBg }]}>
      <Text style={[styles.simLogoText, { color: item.logoColor }]}>{item.logo}</Text>
    </View>
    <View style={styles.simInfo}>
      <Text style={styles.simTitle}>{item.title}</Text>
      <Text style={styles.simCompany}>{item.company}</Text>
      <View style={styles.simTags}>
        {item.tags.map((tag) => (
          <View key={tag} style={styles.simTag}>
            <Text style={styles.simTagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </View>
    <View style={styles.simMatchBadge}>
      <Text style={styles.simMatchText}>{item.match}</Text>
    </View>
  </TouchableOpacity>
);

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onPress }) => (
  <TouchableOpacity style={styles.navItem} onPress={onPress}>
    <Ionicons name={icon} size={22} color={active ? '#2563EB' : '#999'} />
    <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

//////////////////////////////////////////////////////
// STYLES
//////////////////////////////////////////////////////

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  /* HEADER */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },

  /* HERO CARD */
  heroCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  heroLogo: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  heroInfo: {
    flex: 1,
    gap: 4,
  },

  heroTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },

  heroCompany: {
    fontSize: 13,
    color: '#64748B',
  },

  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },

  heroMetaText: {
    fontSize: 12,
    color: '#64748B',
  },

  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },

  matchText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },

  detailsGrid: {
    flexDirection: 'row',
    gap: 8,
  },

  detailBox: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },

  detailIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  detailLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },

  detailValue: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
  },

  applyBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },

  applyBtnApplied: {
    backgroundColor: '#059669',
  },

  applyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  /* SECTIONS */
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },

  seeAllLink: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },

  bodyText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },

  reqRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginVertical: 6,
  },

  reqText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginTop: 2,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },

  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },

  infoValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
    marginTop: 2,
  },

  infoDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },

  similarSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },

  similarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  simLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  simLogoText: {
    fontSize: 11,
    fontWeight: 'bold',
  },

  simInfo: {
    flex: 1,
    gap: 3,
  },

  simTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },

  simCompany: {
    fontSize: 11,
    color: '#64748B',
  },

  simTags: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },

  simTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  simTagText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '500',
  },

  simMatchBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  simMatchText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },

  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },

  tagChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },

  spacer: {
    height: 20,
  },

  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },

  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 2,
    flex: 1,
  },

  navLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '500',
  },

  navLabelActive: {
    color: '#2563EB',
  },

  errorText: {
    fontSize: 14,
    color: '#DC2626',
    marginTop: 16,
    textAlign: 'center',
  },

  retryBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },

  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
});

