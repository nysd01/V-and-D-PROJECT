import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type NotifType = 'match' | 'viewed' | 'interview' | 'submitted' | 'profile';

interface Notification {
  id: number;
  type: NotifType;
  title: string;
  time: string;
  body: string;
  boldWords: string[];
  unread: boolean;
  actionLabel?: string;
  actionStyle?: 'primary' | 'ghost';
  secondaryLabel?: string;
}

interface NavItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
}

const ICON_CONFIG: Record<NotifType, { icon: keyof typeof Ionicons.glyphMap; bg: string; color: string }> = {
  match: { icon: 'sparkles', bg: '#2563EB', color: '#fff' },
  viewed: { icon: 'eye-outline', bg: '#EFF6FF', color: '#2563EB' },
  interview: { icon: 'calendar-outline', bg: '#ECFDF5', color: '#059669' },
  submitted: { icon: 'document-outline', bg: '#F3F4F6', color: '#555' },
  profile: { icon: 'information-circle-outline', bg: '#F3F4F6', color: '#888' },
};

const INITIAL_NOTIFS: Notification[] = [
  {
    id: 1,
    type: 'match',
    title: 'New match found',
    time: '2 hours ago',
    body: "You've been matched with Creative Solutions for a UX Design Intern role. Your skills match 94% of their requirements.",
    boldWords: ['Creative Solutions', 'UX Design Intern'],
    unread: true,
    actionLabel: 'View Details',
    actionStyle: 'primary',
    secondaryLabel: 'Dismiss',
  },
  {
    id: 2,
    type: 'viewed',
    title: 'Application viewed',
    time: '5 hours ago',
    body: 'A recruiter from TechNova Systems just viewed your application for the Summer Engineering internship.',
    boldWords: ['TechNova Systems'],
    unread: true,
  },
  {
    id: 3,
    type: 'interview',
    title: 'Interview request',
    time: 'Yesterday',
    body: 'Congratulations! Global Finance Corp would like to schedule a 30-minute screening call for the Junior Analyst position.',
    boldWords: ['Global Finance Corp'],
    unread: true,
    actionLabel: 'Pick a Time Slot',
    actionStyle: 'primary',
  },
  {
    id: 4,
    type: 'submitted',
    title: 'Application submitted',
    time: '2 days ago',
    body: 'Your application for Social Media Intern at BuzzMedia has been successfully received.',
    boldWords: ['Social Media Intern', 'BuzzMedia'],
    unread: false,
  },
  {
    id: 5,
    type: 'profile',
    title: 'Profile update',
    time: '4 days ago',
    body: 'Your profile was updated with new skills. Recruiter visibility increased by 15%.',
    boldWords: [],
    unread: false,
  },
];

function BoldText({ text, boldWords }: { text: string; boldWords: string[] }): React.JSX.Element {
  if (!boldWords.length) return <Text style={styles.notifBody}>{text}</Text>;

  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    let earliestIndex = -1;
    let earliestWord = '';

    for (const word of boldWords) {
      const idx = remaining.indexOf(word);
      if (idx !== -1 && (earliestIndex === -1 || idx < earliestIndex)) {
        earliestIndex = idx;
        earliestWord = word;
      }
    }

    if (earliestIndex === -1) {
      parts.push(<Text key={key++} style={styles.notifBody}>{remaining}</Text>);
      break;
    }

    if (earliestIndex > 0) {
      parts.push(
        <Text key={key++} style={styles.notifBody}>
          {remaining.slice(0, earliestIndex)}
        </Text>
      );
    }
    parts.push(
      <Text key={key++} style={styles.notifBodyBold}>
        {earliestWord}
      </Text>
    );
    remaining = remaining.slice(earliestIndex + earliestWord.length);
  }

  return <Text style={styles.notifBody}>{parts}</Text>;
}

export default function Updates(): React.JSX.Element {
  const [notifs, setNotifs] = useState<Notification[]>(INITIAL_NOTIFS);

  const markAllRead = (): void => {
    setNotifs((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const dismiss = (id: number): void => {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = notifs.filter((n) => n.unread).length;

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
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Updates</Text>
            <Text style={styles.pageSubtitle}>
              Stay informed about your{'\n'}application status and matches.
            </Text>
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markReadBtn} onPress={markAllRead}>
              <Ionicons name="checkmark-done-outline" size={14} color="#2563EB" />
              <Text style={styles.markReadText}>Mark{'\n'}all as{'\n'}read</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* NOTIFICATIONS */}
        <View style={styles.notifList}>
          {notifs.map((notif) => {
            const iconCfg = ICON_CONFIG[notif.type];
            return (
              <View
                key={notif.id}
                style={[styles.notifCard, notif.unread && styles.notifCardUnread]}
              >
                <View style={styles.notifHeader}>
                  <View style={[styles.notifIconBox, { backgroundColor: iconCfg.bg }]}>
                    <Ionicons name={iconCfg.icon} size={18} color={iconCfg.color} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={styles.notifTitleRow}>
                      <Text style={styles.notifTitle}>{notif.title}</Text>
                      <View style={styles.notifTimeRow}>
                        <Text style={styles.notifTime}>{notif.time}</Text>
                        {notif.unread && <View style={styles.unreadDot} />}
                      </View>
                    </View>
                  </View>
                </View>

                <BoldText text={notif.body} boldWords={notif.boldWords} />

                {notif.actionLabel && (
                  <View style={styles.notifActions}>
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        notif.actionStyle === 'primary'
                          ? notif.type === 'interview'
                            ? styles.actionBtnGreen
                            : styles.actionBtnBlue
                          : styles.actionBtnGhost,
                      ]}
                    >
                      {notif.type === 'interview' && (
                        <Ionicons name="calendar-outline" size={13} color="#fff" style={{ marginRight: 4 }} />
                      )}
                      <Text
                        style={[
                          styles.actionBtnText,
                          notif.actionStyle === 'primary'
                            ? styles.actionBtnTextWhite
                            : styles.actionBtnTextDark,
                        ]}
                      >
                        {notif.actionLabel}
                      </Text>
                    </TouchableOpacity>
                    {notif.secondaryLabel && (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnGhost]}
                        onPress={() => dismiss(notif.id)}
                      >
                        <Text style={styles.actionBtnTextDark}>{notif.secondaryLabel}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>InternConnect</Text>
          <Text style={styles.footerTagline}>
            Building the bridge between ambitious students and high-velocity recruitment teams across the globe.
          </Text>
          <View style={styles.footerLinks}>
            <Text style={styles.footerLink}>Privacy Policy</Text>
            <Text style={styles.footerLink}>Terms of Service</Text>
            <Text style={styles.footerLink}>Help Center</Text>
            <Text style={styles.footerLink}>Contact Us</Text>
          </View>
          <Text style={styles.footerCopy}>© 2024 InternConnect. All rights reserved.</Text>
        </View>

      </ScrollView>

      {/* BOTTOM NAV */}
    
    </View>
  );
}

//////////////////////////////////////////////////////
// COMPONENTS
//////////////////////////////////////////////////////

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

  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    paddingBottom: 16,
    gap: 12,
  },
  pageTitle: { fontSize: 28, fontWeight: 'bold', color: '#0F172A' },
  pageSubtitle: { fontSize: 13, color: '#555', lineHeight: 19, marginTop: 4 },
  markReadBtn: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    gap: 4,
    minWidth: 64,
  },
  markReadText: { fontSize: 11, color: '#2563EB', textAlign: 'center', lineHeight: 15 },

  notifList: { paddingHorizontal: 16, gap: 10, marginBottom: 20 },
  notifCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  notifCardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
  },
  notifHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  notifIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  notifTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  notifTitle: { fontSize: 14, fontWeight: 'bold', color: '#0F172A', flex: 1 },
  notifTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8 },
  notifTime: { fontSize: 11, color: '#888' },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },
  notifBody: { fontSize: 13, color: '#444', lineHeight: 19, marginBottom: 10 },
  notifBodyBold: { fontSize: 13, color: '#111', fontWeight: 'bold', lineHeight: 19 },

  notifActions: { flexDirection: 'row', gap: 10, marginTop: 2 },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtnBlue: { backgroundColor: '#2563EB' },
  actionBtnGreen: { backgroundColor: '#059669' },
  actionBtnGhost: {
    borderWidth: 0.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
  },
  actionBtnText: { fontSize: 13, fontWeight: '600' },
  actionBtnTextWhite: { color: '#fff' },
  actionBtnTextDark: { color: '#333' },

  footer: { paddingHorizontal: 18, paddingVertical: 20, gap: 6 },
  footerBrand: { fontSize: 14, fontWeight: 'bold', color: '#111' },
  footerTagline: { fontSize: 12, color: '#666', lineHeight: 18 },
  footerLinks: { flexDirection: 'row', gap: 14, flexWrap: 'wrap', marginTop: 8 },
  footerLink: { fontSize: 12, color: '#555' },
  footerCopy: { fontSize: 11, color: '#999', marginTop: 4 },

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
