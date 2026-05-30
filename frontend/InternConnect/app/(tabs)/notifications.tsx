import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api, ApiNotification } from '../../services/api';

const TYPE_COLORS = {
  success: { bg: '#ECFDF5', icon: '#059669' },
  info: { bg: '#EFF6FF', icon: '#2563EB' },
  warning: { bg: '#FFFBEB', icon: '#D97706' },
  alert: { bg: '#FEF2F2', icon: '#DC2626' },
};

type FilterTab = 'All' | 'Unread' | 'Applications';

export default function Notifications(): React.JSX.Element {
  const router = useRouter();
  const [notifs, setNotifs] = useState<ApiNotification[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setNotifs(await api.notifications.list());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = useMemo(() => notifs.filter((n) => !n.read).length, [notifs]);

  const visible = useMemo(() => {
    if (activeTab === 'Unread') return notifs.filter((n) => !n.read);
    if (activeTab === 'Applications') return notifs.filter((n) =>
      ['success', 'warning', 'alert'].includes(n.type)
    );
    return notifs;
  }, [notifs, activeTab]);

  const markAsRead = (id: number | string) => {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const deleteNotification = (id: number | string) => {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    Alert.alert('Dismissed', 'Notification removed from this view');
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Updates</Text>
            <Text style={styles.headerSubtitle}>
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up'}
            </Text>
          </View>
          <TouchableOpacity style={styles.headerBtn} onPress={fetchNotifications}>
            <Ionicons name="refresh-outline" size={22} color="#2563EB" />
          </TouchableOpacity>
        </View>

        <View style={styles.filterTabs}>
          {(['All', 'Unread', 'Applications'] as FilterTab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.filterTab, activeTab === tab && styles.filterTabActiveStyle]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={activeTab === tab ? styles.filterTabActive : styles.filterTabText}>
                {tab}{tab === 'Unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 32 }} />
        ) : error ? (
          <View style={styles.emptyState}>
            <Ionicons name="cloud-offline-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Could not connect</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchNotifications}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : visible.length > 0 ? (
          <View style={styles.notificationsContainer}>
            {visible.map((notification) => (
              <NotificationCard
                key={String(notification.id)}
                notification={notification}
                onPress={() => markAsRead(notification.id)}
                onDelete={() => deleteNotification(notification.id)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyText}>You&apos;re all caught up. New updates will appear here.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => router.push('/(tabs)/browse')}>
              <Text style={styles.retryText}>Browse Roles</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

type NotificationCardProps = {
  notification: ApiNotification;
  onPress: () => void;
  onDelete: () => void;
};

function NotificationCard({ notification, onPress, onDelete }: NotificationCardProps): React.JSX.Element {
  const colors = TYPE_COLORS[notification.type];

  return (
    <TouchableOpacity
      style={[styles.notificationCard, !notification.read && styles.notificationCardUnread]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.notificationIcon, { backgroundColor: colors.bg }]}>
        <Ionicons name={notification.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.icon} />
      </View>

      <View style={styles.notificationContent}>
        <View style={styles.titleRow}>
          <Text style={styles.notificationTitle}>{notification.title}</Text>
          {!notification.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notificationMessage}>{notification.message}</Text>
        <Text style={styles.notificationTime}>{notification.timestamp}</Text>
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={onDelete}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close" size={16} color="#999" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0F172A' },
  headerSubtitle: { fontSize: 12, color: '#2563EB', marginTop: 2, fontWeight: '500' },
  headerBtn: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  filterTabs: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  filterTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#F1F5F9' },
  filterTabActiveStyle: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  filterTabActive: { fontSize: 13, fontWeight: '600', color: '#2563EB' },
  filterTabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  notificationsContainer: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  notificationCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, padding: 12, alignItems: 'flex-start', gap: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  notificationCardUnread: { backgroundColor: '#F8FAFC', borderColor: '#2563EB', borderWidth: 1.5 },
  notificationIcon: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  notificationContent: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  notificationTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#0F172A' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563EB', marginLeft: 8 },
  notificationMessage: { fontSize: 13, color: '#475569', lineHeight: 18 },
  notificationTime: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  deleteBtn: { padding: 4, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  emptyText: { fontSize: 14, color: '#64748B', textAlign: 'center' },
  retryBtn: { marginTop: 8, backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '700' },
});