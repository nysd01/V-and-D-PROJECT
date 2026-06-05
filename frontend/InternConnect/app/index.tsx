import React, { useState, useRef, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import Suit360 from '@/components/Suit360';

const { width } = Dimensions.get('window');

// ─── Design Tokens ────────────────────────────────────
const C = {
  ink: '#0A0A14',
  navy: '#0D1B3E',
  blue: '#0052CC',
  blueMid: '#EEF4FF',
  mint: '#00C896',
  mintLight: '#E6FFF9',
  amber: '#FFB800',
  white: '#FFFFFF',
  offWhite: '#F7F8FC',
  gray100: '#F1F3F9',
  gray300: '#D0D5E8',
  gray500: '#8890A8',
  gray700: '#3D4560',
};

// ─── Gyroscope 3D Office Card ─────────────────────────
function GyroOfficeCard() {
  return null;
}

// ─── Data ─────────────────────────────────────────────
const INTERN_STEPS = [
  { n: '01', title: 'Build Your Profile',     body: 'Import your skills, GPA, and portfolio in 60 seconds. Our AI parses everything automatically.',                  accent: C.blue  },
  { n: '02', title: 'Get Precision-Matched',  body: 'Our engine scores 500+ listings against your profile and surfaces only high-compatibility roles.',                accent: C.mint  },
  { n: '03', title: 'Apply in One Tap',       body: 'Your profile packet reaches hiring managers instantly. Track every stage in your dashboard.',                     accent: C.amber },
];
const FIRM_STEPS = [
  { n: '01', title: 'Post Your Role',         body: "Define the role in plain language. Our system extracts required skills and seniority automatically.",             accent: C.blue  },
  { n: '02', title: 'Review Vetted Talent',   body: 'Receive a curated shortlist of pre-scored candidates ranked by compatibility with your needs.',                   accent: C.mint  },
  { n: '03', title: 'Hire with Confidence',   body: 'Interview, select, and onboard top talent. Build a recurring pipeline for future hiring cycles.',                 accent: C.amber },
];
const INTERN_OPPS = [
  { id: '1', abbr: 'UX', abbrevBg: '#EEF4FF', abbrevColor: C.blue,    match: '98%', matchBg: C.mint,    title: 'UX Research Intern',    company: 'Design Studios Inc.', tags: ['Remote', 'Paid', 'Summer 2024']      },
  { id: '2', abbr: 'DA', abbrevBg: '#E6FFF9', abbrevColor: C.mint,    match: '91%', matchBg: C.blue,    title: 'Growth Data Analyst',   company: 'TechPulse Global',    tags: ['San Francisco', 'Hybrid']            },
  { id: '3', abbr: 'FE', abbrevBg: '#FFF8E6', abbrevColor: '#D97706', match: '87%', matchBg: '#D97706', title: 'Junior Frontend Dev',   company: 'Nexus Systems',       tags: ['Remote', 'Relocation Package']       },
];
const FIRM_OPPS = [
  { id: '1', abbr: '12', abbrevBg: '#EEF4FF', abbrevColor: C.blue,    match: '60+', matchBg: C.mint,    title: 'Matched Candidates Today',       company: 'Across all open roles',           tags: ['Engineering', 'Design', 'Marketing'] },
  { id: '2', abbr: '3d', abbrevBg: '#E6FFF9', abbrevColor: C.mint,    match: '94%', matchBg: C.blue,    title: 'Avg. Time to First Interview',    company: 'vs. 18 days industry average',    tags: ['Faster Hiring', 'Pre-vetted']        },
  { id: '3', abbr: '↑',  abbrevBg: '#FFF8E6', abbrevColor: '#D97706', match: '60%', matchBg: '#D97706', title: 'Reduction in Sourcing Time',      company: 'Reported by partner firms',       tags: ['Efficiency', 'Cost Saving']          },
];
const INTERN_TESTIMONIALS = [
  { id: '1', name: 'Sarah Jenkins', role: 'Design Intern → Google', text: "InternConnect didn't just find me a role. They found me my dream. The match score was spot on.", rating: 5, initials: 'SJ', bg: C.blueMid  },
  { id: '2', name: 'Marcus Osei',   role: 'SWE Intern → Stripe',   text: "I applied to 3 roles, got 2 interviews, and landed my top choice. The precision targeting is unlike anything else.", rating: 5, initials: 'MO', bg: C.mintLight },
];
const FIRM_TESTIMONIALS = [
  { id: '1', name: 'David Lawson', role: 'Talent Lead at Stripe', text: "The quality of candidates we receive is unparalleled. It's cut our sourcing time by 60%.", rating: 5, initials: 'DL', bg: C.blueMid  },
  { id: '2', name: 'Priya Nair',   role: 'Head of People, Vercel', text: "We scaled our intern program 3x without adding a single recruiter. InternConnect's pipeline is that good.", rating: 5, initials: 'PN', bg: C.mintLight },
];
const INTERN_STATS = [{ n: '500+', label: 'Live Roles' }, { n: '94%', label: 'Match Rate' }, { n: '48h', label: 'Avg Response' }];
const FIRM_STATS   = [{ n: '1,200+', label: 'Vetted Interns' }, { n: '300+', label: 'Partner Firms' }, { n: '60%', label: 'Less Sourcing' }];

// ─── Main Page ────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [mode, setMode] = useState<'intern' | 'firm'>('intern');
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.replace(user.type === 'firm' ? '/(firm)/firm_dashboard' : '/(tabs)/intern_dashboard');
    }
  }, [user]);

  const switchMode = (next: 'intern' | 'firm') => {
    if (next === mode) return;
    Animated.spring(slideAnim, { toValue: next === 'firm' ? 1 : 0, useNativeDriver: false, tension: 80, friction: 12 }).start();
    setMode(next);
  };

  const isIntern = mode === 'intern';
  const steps        = isIntern ? INTERN_STEPS        : FIRM_STEPS;
  const opps         = isIntern ? INTERN_OPPS         : FIRM_OPPS;
  const testimonials = isIntern ? INTERN_TESTIMONIALS : FIRM_TESTIMONIALS;
  const stats        = isIntern ? INTERN_STATS        : FIRM_STATS;

  const pillLeft = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [3, (width - 48) / 2 + 3],
  });

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

        {/* HEADER */}
        <View style={s.header}>
          <View style={s.headerBrand}>
            <View style={s.logoMark}><Text style={s.logoMarkText}>IC</Text></View>
            <Text style={s.brandName}>InternConnect</Text>
          </View>
          <View style={s.headerActions}>
            <TouchableOpacity onPress={() => router.push('/about')}>
              <Text style={s.loginLink}>About</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={s.loginLink}>Log in</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.joinBtn} onPress={() => router.push('/register')}>
              <Text style={s.joinBtnText}>Join Free</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* TOGGLE */}
        <View style={s.toggleWrap}>
          <View style={s.toggleTrack}>
            <Animated.View style={[s.togglePill, { left: pillLeft, width: (width - 48) / 2 - 3 }]} />
            <TouchableOpacity style={s.toggleOption} onPress={() => switchMode('intern')}>
              <Text style={[s.toggleText, isIntern && s.toggleTextActive]}>I'm an Intern</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.toggleOption} onPress={() => switchMode('firm')}>
              <Text style={[s.toggleText, !isIntern && s.toggleTextActive]}>I'm a Firm</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* HERO — text + gyro card side by side */}
        <View style={s.hero}>
          <View style={s.heroBubble1} />
          <View style={s.heroBubble2} />

          {/* Left: text */}
          <View style={s.heroText}>
            <View style={s.heroBadge}>
              <View style={s.heroBadgeDot} />
              <Text style={s.heroBadgeText}>
                {isIntern ? '500+ roles matched this week' : '1,200+ candidates ready now'}
              </Text>
            </View>
            <Text style={s.heroHeading}>
              {isIntern ? 'Find Your\nDream\nInternship.' : 'Build Your\nIntern\nPipeline.'}
            </Text>
            <Text style={s.heroSub}>
              {isIntern
                ? 'Precision-matched opportunities for ambitious students.'
                : 'Pre-vetted, skill-scored talent delivered to your desk.'}
            </Text>
            <TouchableOpacity style={s.heroPrimary} onPress={() => router.push('/register')}>
              <Text style={s.heroPrimaryText}>{isIntern ? 'Find My Match →' : 'Post a Role →'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.heroGhost}>
              <Text style={s.heroGhostText}>{isIntern ? 'Browse Roles' : 'See Pricing'}</Text>
            </TouchableOpacity>
          </View>

          {/* Right: 360° Suit Card */}
          <View style={s.gyroCol}>
            <Suit360 />
          </View>
        </View>

        {/* STATS */}
        <View style={s.statsBar}>
          {stats.map((st, i) => (
            <React.Fragment key={st.label}>
              <View style={s.statItem}>
                <Text style={s.statNum}>{st.n}</Text>
                <Text style={s.statLabel}>{st.label}</Text>
              </View>
              {i < stats.length - 1 && <View style={s.statDiv} />}
            </React.Fragment>
          ))}
        </View>

        {/* HOW IT WORKS */}
        <View style={s.section}>
          <View style={s.pill}><Text style={s.pillText}>HOW IT WORKS</Text></View>
          <Text style={s.secHead}>{isIntern ? 'Three steps to hired.' : 'Three steps to staffed.'}</Text>
          <Text style={s.secSub}>{isIntern ? 'No endless forms. No black holes. Just results.' : 'No recruiters needed. No time wasted. Just talent.'}</Text>
          {steps.map((step, i) => (
            <View key={step.n} style={s.stepRow}>
              <View style={[s.stepBox, { borderColor: step.accent }]}>
                <Text style={[s.stepNum, { color: step.accent }]}>{step.n}</Text>
              </View>
              <View style={s.stepBody}>
                <Text style={s.stepTitle}>{step.title}</Text>
                <Text style={s.stepDesc}>{step.body}</Text>
              </View>
              {i < steps.length - 1 && <View style={[s.stepLine, { backgroundColor: step.accent + '28' }]} />}
            </View>
          ))}
        </View>

        {/* OPPORTUNITIES */}
        <View style={[s.section, { backgroundColor: C.navy }]}>
          <View style={[s.pill, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
            <Text style={[s.pillText, { color: 'rgba(255,255,255,0.45)' }]}>
              {isIntern ? 'TOP MATCHES' : 'PLATFORM METRICS'}
            </Text>
          </View>
          <Text style={[s.secHead, { color: C.white }]}>{isIntern ? 'Roles closing soon.' : 'Results that speak.'}</Text>
          <Text style={[s.secSub, { color: 'rgba(255,255,255,0.5)' }]}>
            {isIntern ? 'High-compatibility matches based on your profile.' : 'Real numbers from firms using InternConnect today.'}
          </Text>
          {opps.map((opp) => (
            <TouchableOpacity key={opp.id} style={s.oppCard} onPress={() => isIntern && router.push('/internship_detail')} activeOpacity={0.85}>
              <View style={s.oppTop}>
                <View style={[s.oppIcon, { backgroundColor: opp.abbrevBg }]}>
                  <Text style={[s.oppIconText, { color: opp.abbrevColor }]}>{opp.abbr}</Text>
                </View>
                <View style={[s.oppPill, { backgroundColor: opp.matchBg }]}>
                  <Text style={s.oppPillText}>{opp.match}{isIntern ? ' match' : ''}</Text>
                </View>
              </View>
              <Text style={s.oppTitle}>{opp.title}</Text>
              <Text style={s.oppCo}>{opp.company}</Text>
              <View style={s.oppTags}>
                {opp.tags.map((t) => <View key={t} style={s.oppTag}><Text style={s.oppTagText}>{t}</Text></View>)}
              </View>
              {isIntern && (
                <TouchableOpacity style={s.oppApply} onPress={() => router.push('/apply')}>
                  <Text style={s.oppApplyText}>Apply Now →</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={s.viewAll} onPress={() => router.push('/(tabs)/browse')}>
            <Text style={s.viewAllText}>{isIntern ? 'Browse all opportunities →' : 'View full platform stats →'}</Text>
          </TouchableOpacity>
        </View>

        {/* TESTIMONIALS */}
        <View style={s.section}>
          <View style={s.pill}><Text style={s.pillText}>TESTIMONIALS</Text></View>
          <Text style={s.secHead}>{isIntern ? 'They landed. You will too.' : 'Firms love us.'}</Text>
          {testimonials.map((t) => (
            <View key={t.id} style={s.tCard}>
              <View style={s.stars}>{[...Array(t.rating)].map((_, i) => <Text key={i} style={s.star}>★</Text>)}</View>
              <Text style={s.tText}>"{t.text}"</Text>
              <View style={s.tAuthor}>
                <View style={[s.tAvatar, { backgroundColor: t.bg }]}>
                  <Text style={s.tAvatarText}>{t.initials}</Text>
                </View>
                <View>
                  <Text style={s.tName}>{t.name}</Text>
                  <Text style={s.tRole}>{t.role}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={s.cta}>
          <View style={s.ctaBubble} />
          <Text style={s.ctaHead}>{isIntern ? 'Your career starts\nwith one match.' : 'Your best hire is\nalready waiting.'}</Text>
          <Text style={s.ctaSub}>{isIntern ? 'Join 1,200+ students who found their internship on InternConnect.' : 'Join 300+ firms building their talent pipeline with InternConnect.'}</Text>
          <TouchableOpacity style={s.ctaBtn} onPress={() => router.push('/register')}>
            <Text style={s.ctaBtnText}>{isIntern ? 'Get Matched Free →' : 'Start Hiring Free →'}</Text>
          </TouchableOpacity>
        </View>

        {/* FOOTER */}
        <View style={s.footer}>
          <View style={s.ftBrand}>
            <View style={s.ftMark}><Text style={s.ftMarkText}>IC</Text></View>
            <Text style={s.ftName}>InternConnect</Text>
          </View>
          <Text style={s.ftDesc}>Bridging the gap between education and industry through intelligent matching.</Text>
          <View style={s.ftGrid}>
            <View style={s.ftCol}>
              <Text style={s.ftHead}>PLATFORM</Text>
              <Text style={s.ftLink}>How it Works</Text>
              <Text style={s.ftLink}>Pricing</Text>
              <Text style={s.ftLink}>Success Stories</Text>
              <TouchableOpacity onPress={() => router.push('/about')}>
                <Text style={[s.ftLink, { color: C.mint }]}>About Us</Text>
              </TouchableOpacity>
            </View>
            <View style={s.ftCol}>
              <Text style={s.ftHead}>SUPPORT</Text>
              <Text style={s.ftLink}>Help Center</Text>
              <Text style={s.ftLink}>Contact</Text>
            </View>
            <View style={s.ftCol}>
              <Text style={s.ftHead}>LEGAL</Text>
              <Text style={s.ftLink}>Terms</Text>
              <Text style={s.ftLink}>Privacy</Text>
              <Text style={s.ftLink}>Cookies</Text>
            </View>
          </View>
          <Text style={s.ftCopy}>© 2024 InternConnect. All rights reserved.</Text>
        </View>

      </ScrollView>
    </View>
  );
}

// ─── Gyro Card Styles ─────────────────────────────────
const g = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  ring1: { position: 'absolute', width: 210, height: 210, borderRadius: 105, borderWidth: 1, borderColor: 'rgba(0,82,204,0.14)' },
  ring2: { position: 'absolute', width: 172, height: 172, borderRadius: 86,  borderWidth: 1, borderColor: 'rgba(0,200,150,0.10)' },

  card: {
    width: 170,
    height: 218,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0A0F2E',
    shadowColor: C.blue,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.55,
    shadowRadius: 28,
    elevation: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,82,204,0.35)',
  },
  shimmer: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.07)',
    zIndex: 20,
  },

  // Sky
  sky: { height: 64, backgroundColor: '#070C22', overflow: 'hidden', position: 'relative' },
  star: { position: 'absolute', borderRadius: 2, backgroundColor: '#fff' },
  moon: {
    position: 'absolute', width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#FFF3AA', right: 12, top: 10,
    shadowColor: '#FFF3AA', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 8,
  },
  horizonGlow: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 14,
    backgroundColor: 'rgba(0,82,204,0.18)',
  },

  // Building
  building: { marginHorizontal: 16, position: 'relative', flexDirection: 'row', alignItems: 'flex-end' },
  buildingSide: {
    width: 10, height: 72,
    backgroundColor: '#0D1630',
    marginBottom: 0,
    transform: [{ skewY: '-60deg' }],
    marginRight: -2,
    opacity: 0.9,
  },
  buildingFront: { flex: 1, backgroundColor: '#1A2540', borderTopLeftRadius: 3, borderTopRightRadius: 3, padding: 5, gap: 3 },
  roof: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-end', height: 18, paddingHorizontal: 4, position: 'relative' },
  antenna: { position: 'absolute', left: '50%', top: -10, width: 2, height: 14, backgroundColor: '#3A4A6A' },
  antennaBlink: {
    position: 'absolute', left: '50%', top: -13, marginLeft: -1,
    width: 4, height: 4, borderRadius: 2, backgroundColor: '#FF4444',
    shadowColor: '#FF4444', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 5,
  },
  roofLightLeft:  { width: 5, height: 5, borderRadius: 3, backgroundColor: '#FFD97A', shadowColor: '#FFD97A', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 5, marginRight: 4 },
  roofLightRight: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.mint,   shadowColor: C.mint,   shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 5 },
  floor: { flexDirection: 'row', gap: 3 },
  win:   { flex: 1, height: 9, borderRadius: 1 },
  lobby: { height: 14, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 4, paddingHorizontal: 8 },
  lobbyDoor: { width: 12, height: 14, borderTopLeftRadius: 6, borderTopRightRadius: 6, backgroundColor: 'rgba(163,200,255,0.25)' },
  lobbyLight: { position: 'absolute', bottom: -1, width: 20, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,217,122,0.3)' },

  // Street
  street: { height: 30, backgroundColor: '#0F151F', position: 'relative', flexDirection: 'row', alignItems: 'flex-end', paddingBottom: 2 },
  roadMark: { position: 'absolute', width: 8, height: 2, backgroundColor: 'rgba(255,255,255,0.12)', bottom: 8, borderRadius: 1 },
  lamp: { position: 'absolute', alignItems: 'center', bottom: 0 },
  lampPole: { width: 2, height: 16, backgroundColor: '#3A4A6A' },
  lampHead: { width: 8, height: 3, borderRadius: 2, backgroundColor: '#3A4A6A' },
  lampGlow: { width: 10, height: 4, borderRadius: 3, backgroundColor: '#FFD97A', shadowColor: '#FFD97A', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6 },
  car:      { position: 'absolute', width: 22, height: 9,  borderRadius: 3, bottom: 3 },
  carWindow:{ position: 'absolute', top: 1, left: 3, right: 6, height: 4, borderRadius: 1 },
  carWheel: { position: 'absolute', bottom: -2, width: 5, height: 5, borderRadius: 3, backgroundColor: '#1A1A2E' },

  // Badge
  badge: {
    position: 'absolute', bottom: 34, right: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderWidth: 1, borderColor: 'rgba(0,200,150,0.4)',
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    zIndex: 15,
  },
  badgePulse: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.mint, shadowColor: C.mint, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 4 },
  badgeText:  { color: C.mint, fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },

  // Footer bar
  footer: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10, paddingVertical: 7,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  footerDot:   { width: 4, height: 4, borderRadius: 2, backgroundColor: C.mint },
  footerTitle: { color: C.white, fontSize: 9, fontWeight: '700', letterSpacing: 0.4, flex: 1 },
  footerHint:  { color: 'rgba(255,255,255,0.3)', fontSize: 8 },
});

// ─── Main Styles ──────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.white },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.gray300 },
  headerBrand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.blue, justifyContent: 'center', alignItems: 'center' },
  logoMarkText: { color: C.white, fontWeight: '800', fontSize: 13 },
  brandName: { fontSize: 17, fontWeight: '800', color: C.ink },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  loginLink: { fontSize: 14, color: C.gray500, fontWeight: '500' },
  joinBtn: { backgroundColor: C.ink, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  joinBtnText: { color: C.white, fontSize: 13, fontWeight: '700' },

  // Toggle
  toggleWrap: { paddingHorizontal: 24, paddingVertical: 18 },
  toggleTrack: { flexDirection: 'row', backgroundColor: C.gray100, borderRadius: 14, padding: 3, height: 46, position: 'relative' },
  togglePill: { position: 'absolute', top: 3, height: 40, backgroundColor: C.ink, borderRadius: 11 },
  toggleOption: { flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  toggleText: { fontSize: 14, fontWeight: '600', color: C.gray500 },
  toggleTextActive: { color: C.white },

  // Hero — two-column on wider screens, stacked on narrow
  hero: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 12,
    overflow: 'hidden',
    alignItems: 'center',
  },
  heroBubble1: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: C.blueMid, top: -50, right: -50, opacity: 0.55 },
  heroBubble2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: C.mintLight, bottom: 40, left: -30, opacity: 0.4 },
  heroText: { flex: 1, minWidth: 150 },
  gyroCol: { width: width < 400 ? width - 40 : 190, alignSelf: 'center' },

  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: C.mintLight, alignSelf: 'flex-start', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 20, marginBottom: 14 },
  heroBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.mint },
  heroBadgeText: { fontSize: 11, color: C.mint, fontWeight: '600' },
  heroHeading: { fontSize: 30, fontWeight: '800', color: C.ink, lineHeight: 36, letterSpacing: -0.5, marginBottom: 10 },
  heroSub: { fontSize: 13, color: C.gray500, lineHeight: 20, marginBottom: 20 },
  heroPrimary: { backgroundColor: C.blue, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  heroPrimaryText: { color: C.white, fontSize: 15, fontWeight: '700' },
  heroGhost: { borderWidth: 1.5, borderColor: C.gray300, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  heroGhostText: { color: C.gray700, fontSize: 14, fontWeight: '600' },

  // Stats
  statsBar: { flexDirection: 'row', backgroundColor: C.ink, paddingVertical: 24, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'space-between' },
  statItem: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: 22, fontWeight: '800', color: C.white },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 3, fontWeight: '500' },
  statDiv: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' },

  // Sections
  section: { paddingHorizontal: 24, paddingVertical: 40 },
  pill: { backgroundColor: C.gray100, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 12 },
  pillText: { fontSize: 10, fontWeight: '700', color: C.gray500, letterSpacing: 1 },
  secHead: { fontSize: 26, fontWeight: '800', color: C.ink, lineHeight: 32, marginBottom: 8 },
  secSub: { fontSize: 13, color: C.gray500, lineHeight: 20, marginBottom: 28 },

  // Steps
  stepRow: { position: 'relative', flexDirection: 'row', gap: 14, paddingBottom: 26 },
  stepBox: { width: 42, height: 42, borderRadius: 12, borderWidth: 2, justifyContent: 'center', alignItems: 'center', flexShrink: 0, backgroundColor: C.white },
  stepNum: { fontSize: 12, fontWeight: '800' },
  stepBody: { flex: 1, paddingTop: 8 },
  stepTitle: { fontSize: 15, fontWeight: '700', color: C.ink, marginBottom: 4 },
  stepDesc: { fontSize: 12, color: C.gray500, lineHeight: 18 },
  stepLine: { position: 'absolute', left: 20, top: 42, width: 2, bottom: 0 },

  // Opp cards (dark bg)
  oppCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.11)', borderRadius: 14, padding: 14, marginBottom: 12 },
  oppTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  oppIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  oppIconText: { fontSize: 13, fontWeight: '800' },
  oppPill: { paddingHorizontal: 11, paddingVertical: 4, borderRadius: 20 },
  oppPillText: { color: C.white, fontSize: 11, fontWeight: '700' },
  oppTitle: { fontSize: 14, fontWeight: '700', color: C.white, marginBottom: 3 },
  oppCo: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 10 },
  oppTags: { flexDirection: 'row', gap: 5, flexWrap: 'wrap', marginBottom: 10 },
  oppTag: { backgroundColor: 'rgba(255,255,255,0.07)', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 5 },
  oppTagText: { fontSize: 10, color: 'rgba(255,255,255,0.55)' },
  oppApply: { backgroundColor: C.blue, paddingVertical: 11, borderRadius: 9, alignItems: 'center' },
  oppApplyText: { color: C.white, fontSize: 13, fontWeight: '700' },
  viewAll: { alignItems: 'center', paddingTop: 6 },
  viewAllText: { color: C.mint, fontSize: 13, fontWeight: '600' },

  // Testimonials
  tCard: { backgroundColor: C.offWhite, borderRadius: 14, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: C.gray300 },
  stars: { flexDirection: 'row', gap: 3, marginBottom: 10 },
  star: { fontSize: 13, color: C.amber },
  tText: { fontSize: 13, color: C.gray700, lineHeight: 20, fontStyle: 'italic', marginBottom: 14 },
  tAuthor: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tAvatar: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  tAvatarText: { fontSize: 12, fontWeight: '800', color: C.blue },
  tName: { fontSize: 13, fontWeight: '700', color: C.ink },
  tRole: { fontSize: 11, color: C.gray500, marginTop: 1 },

  // CTA
  cta: { backgroundColor: C.blue, marginHorizontal: 20, marginVertical: 28, borderRadius: 20, padding: 26, overflow: 'hidden' },
  ctaBubble: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.06)', top: -30, right: -30 },
  ctaHead: { fontSize: 24, fontWeight: '800', color: C.white, lineHeight: 30, marginBottom: 8 },
  ctaSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 19, marginBottom: 20 },
  ctaBtn: { backgroundColor: C.white, paddingVertical: 13, borderRadius: 11, alignItems: 'center' },
  ctaBtnText: { color: C.blue, fontSize: 14, fontWeight: '800' },

  // Footer
  footer: { backgroundColor: C.ink, paddingHorizontal: 24, paddingTop: 36, paddingBottom: 36 },
  ftBrand: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10 },
  ftMark: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.blue, justifyContent: 'center', alignItems: 'center' },
  ftMarkText: { color: C.white, fontWeight: '800', fontSize: 10 },
  ftName: { fontSize: 14, fontWeight: '800', color: C.white },
  ftDesc: { fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 18, marginBottom: 22 },
  ftGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22 },
  ftCol: { gap: 7 },
  ftHead: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.28)', letterSpacing: 1, marginBottom: 2 },
  ftLink: { fontSize: 12, color: 'rgba(255,255,255,0.55)' },
  ftCopy: { fontSize: 10, color: 'rgba(255,255,255,0.18)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', paddingTop: 16 },
});
