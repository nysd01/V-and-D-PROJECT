import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#2563EB',
  primaryLight: '#EFF6FF',
  primaryDark: '#0F4BCC',
  bg: '#F8FAFC',
  white: '#FFFFFF',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  surface: '#F1F5F9',
  accent: '#10B981',
};

const MEMBERS = [
  {
    name: 'Noumbissi Yamdjeuson\nStanley Derek',
    id: 'ICTU20233752',
    role: 'Full Stack Developer & Team Lead',
    image: require('../assets/images/noumbissi.png'),
    bio: 'Stanley leads the architecture and backend development of InternConnect. He designed the RESTful API, database schema, and deployment pipeline. Passionate about building scalable systems and clean code, he brings the technical vision of the project to life.',
    skills: ['Node.js', 'Docker', 'Kubernetes', 'CI/CD'],
  },
  {
    name: 'Mbuna Verlaine Claude',
    id: 'ICTU20233988',
    role: 'Frontend Developer & UI/UX Designer',
    image: require('../assets/images/mbuna.png'),
    bio: 'Verlaine crafted the entire user experience of InternConnect, from the login flow to the internship dashboard. He built the cross-platform mobile and web frontend using React Native and Expo, ensuring a seamless experience for both interns and firms.',
    skills: ['React Native', 'Expo', 'UI/UX', 'TypeScript'],
  },
];

export default function AboutPage() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero Banner */}
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Ionicons name="briefcase" size={32} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>InternConnect</Text>
          <Text style={styles.heroTagline}>Bridging the gap between talent and opportunity</Text>
          <View style={styles.heroDivider} />
          <Text style={styles.heroDescription}>
            A platform designed to help students find internships and firms discover the next generation of talent — built with passion at ICTU.
          </Text>
        </View>

        {/* Mission */}
        <View style={styles.missionCard}>
          <View style={styles.missionIcon}>
            <Ionicons name="rocket-outline" size={22} color={COLORS.primary} />
          </View>
          <View style={styles.missionText}>
            <Text style={styles.missionTitle}>Our Mission</Text>
            <Text style={styles.missionBody}>
              To simplify the internship process for students and companies alike — from discovery to application, all in one place.
            </Text>
          </View>
        </View>

        {/* Team Section */}
        <Text style={styles.sectionLabel}>Meet the Team</Text>

        {MEMBERS.map((member, index) => (
          <View key={member.id} style={styles.memberCard}>
            {/* Color bar */}
            <View style={[styles.memberAccent, { backgroundColor: index === 0 ? COLORS.primaryDark : COLORS.accent }]} />

            {/* Top row: photo + identity */}
            <View style={styles.memberTop}>
              <View style={styles.memberAvatarWrapper}>
                <Image source={member.image} style={styles.memberAvatar} />
                <View style={[styles.memberIndexBadge, { backgroundColor: index === 0 ? COLORS.primaryDark : COLORS.accent }]}>
                  <Text style={styles.memberIndexText}>{index + 1}</Text>
                </View>
              </View>

              <View style={styles.memberIdentity}>
                <Text style={styles.memberName}>{member.name}</Text>
                <View style={styles.idRow}>
                  <Ionicons name="card-outline" size={13} color={COLORS.textMuted} />
                  <Text style={styles.memberId}>{member.id}</Text>
                </View>
                <View style={[styles.rolePill, { backgroundColor: index === 0 ? COLORS.primaryLight : '#ECFDF5' }]}>
                  <Text style={[styles.roleText, { color: index === 0 ? COLORS.primary : COLORS.accent }]}>
                    {member.role}
                  </Text>
                </View>
              </View>
            </View>

            {/* Bio */}
            <Text style={styles.memberBio}>{member.bio}</Text>

            {/* Skills */}
            <View style={styles.skillsRow}>
              {member.skills.map((skill) => (
                <View key={skill} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Tech Stack */}
        <Text style={styles.sectionLabel}>Built With</Text>
        <View style={styles.techGrid}>
          {[
            { icon: 'logo-react', label: 'React Native' },
            { icon: 'server-outline', label: 'Node.js' },
            { icon: 'cube-outline', label: 'Docker' },
            { icon: 'git-branch-outline', label: 'Kubernetes' },
            { icon: 'construct-outline', label: 'Jenkins' },
            { icon: 'cloud-outline', label: 'Supabase' },
          ].map((tech) => (
            <View key={tech.label} style={styles.techChip}>
              <Ionicons name={tech.icon as any} size={16} color={COLORS.primary} />
              <Text style={styles.techLabel}>{tech.label}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerInstitution}>ICT University · Software Architecture</Text>
          <Text style={styles.footerYear}>Spring 2026 · Version 1.0.0</Text>
          <Text style={styles.footerCopy}>© 2026 InternConnect. All rights reserved.</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },

  scroll: { paddingBottom: 40 },

  // Hero
  hero: {
    backgroundColor: COLORS.primaryDark,
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  heroBadge: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  heroTagline: { fontSize: 13, color: '#BFDBFE', marginTop: 6, textAlign: 'center' },
  heroDivider: { width: 40, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 14, borderRadius: 2 },
  heroDescription: { fontSize: 13, color: '#DBEAFE', textAlign: 'center', lineHeight: 20 },

  // Mission
  missionCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    alignItems: 'flex-start',
  },
  missionIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  missionText: { flex: 1 },
  missionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  missionBody: { fontSize: 13, color: COLORS.textMuted, lineHeight: 20 },

  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: COLORS.textMuted,
    letterSpacing: 0.8, textTransform: 'uppercase',
    marginHorizontal: 16, marginBottom: 10,
  },

  // Member card
  memberCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  memberAccent: { height: 5 },
  memberTop: {
    flexDirection: 'row',
    padding: 16,
    gap: 14,
    alignItems: 'flex-start',
  },
  memberAvatarWrapper: { position: 'relative' },
  memberAvatar: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 2, borderColor: COLORS.border,
  },
  memberIndexBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.white,
  },
  memberIndexText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  memberIdentity: { flex: 1, gap: 4 },
  memberName: { fontSize: 16, fontWeight: '700', color: COLORS.text, lineHeight: 22 },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  memberId: { fontSize: 12, color: COLORS.textMuted, fontFamily: 'monospace' },
  rolePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, marginTop: 2,
  },
  roleText: { fontSize: 11, fontWeight: '700' },

  memberBio: {
    fontSize: 13, color: COLORS.textMuted, lineHeight: 20,
    paddingHorizontal: 16, paddingBottom: 12,
  },

  skillsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    paddingHorizontal: 16, paddingBottom: 16,
  },
  skillChip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
  },
  skillText: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },

  // Tech grid
  techGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 16, marginBottom: 16,
  },
  techChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.border,
  },
  techLabel: { fontSize: 12, fontWeight: '600', color: COLORS.text },

  footer: {
    alignItems: 'center', paddingHorizontal: 16,
    paddingTop: 8, gap: 4,
  },
  footerInstitution: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  footerYear: { fontSize: 12, color: COLORS.textMuted },
  footerCopy: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
});
