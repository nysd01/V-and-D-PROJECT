import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, TextInput, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { api, uploadAvatar, ApiApplication, ApiInternship } from '../../services/api';

export default function Profile(): React.JSX.Element {
  const router = useRouter();
  const { user, logout, updateProfile, refreshUser } = useAuth();

  const [apps, setApps] = useState<ApiApplication[]>([]);
  const [firmPostings, setFirmPostings] = useState<ApiInternship[]>([]);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUniversity, setEditUniversity] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editIndustry, setEditIndustry] = useState('');
  const [editAddress, setEditAddress] = useState('');

  useEffect(() => {
    if (user?.type === 'intern') api.applications.list().then(setApps).catch(() => {});
    if (user?.type === 'firm') api.internships.mine().then(setFirmPostings).catch(() => {});
  }, [user]);

  const startEdit = () => {
    setEditName(user?.name ?? '');
    setEditUniversity(user?.university ?? '');
    setEditCompany(user?.companyName ?? '');
    setEditIndustry(user?.industry ?? '');
    setEditAddress(user?.address ?? '');
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: Record<string, string> = { name: editName };
      if (user?.type === 'intern') updates.university = editUniversity;
      if (user?.type === 'firm') {
        updates.companyName = editCompany;
        updates.industry = editIndustry;
        updates.address = editAddress;
      }
      await api.auth.updateMe(updates);
      await refreshUser();
      setEditing(false);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow access to your photo library to upload a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const mime = asset.mimeType ?? 'image/jpeg';
    const ext = mime.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';

    setUploadingAvatar(true);
    try {
      const url = await uploadAvatar(asset.uri, `avatar.${ext}`, mime);
      updateProfile({ profilePicture: url });
      await refreshUser();
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Could not upload photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogout = async () => { await logout(); router.replace('/login'); };

  const totalApps   = apps.length;
  const accepted    = apps.filter((a) => a.status === 'Accepted').length;
  const interviews  = apps.filter((a) => a.status === 'Interviewing').length;
  const activePosts = firmPostings.filter((p) => p.status === 'active').length;
  const applicants  = firmPostings.reduce((s, p) => s + (p.applicant_count ?? 0), 0);

  const displayName = user?.name ?? 'User';
  const displaySub  = user?.type === 'intern'
    ? (user?.university ?? 'University not set')
    : (user?.companyName ?? user?.name ?? 'Company');

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Profile</Text>
            <Text style={styles.headerSubtitle}>Your account & settings</Text>
          </View>
          <TouchableOpacity onPress={editing ? handleSave : startEdit} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <View style={styles.editBtn}>
                <Ionicons name={editing ? 'checkmark' : 'create-outline'} size={16} color="#2563EB" />
                <Text style={styles.editBtnText}>{editing ? 'Save' : 'Edit'}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.coverGradient}>
            <Text style={styles.coverLabel}>{user?.type === 'firm' ? 'Firm Account' : 'Intern Account'}</Text>
          </View>

          <View style={styles.profileHeader}>
            {/* Avatar with upload button */}
            <TouchableOpacity style={styles.avatarContainer} onPress={handlePickAvatar} disabled={uploadingAvatar}>
              {uploadingAvatar ? (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              ) : user?.profilePicture ? (
                <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.cameraOverlay}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            </TouchableOpacity>

            <View style={styles.userInfo}>
              {editing ? (
                <TextInput
                  style={styles.editInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Full name"
                  placeholderTextColor="#94A3B8"
                />
              ) : (
                <Text style={styles.userName}>{displayName}</Text>
              )}
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

        {/* Edit fields */}
        {editing && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Edit Information</Text>
            {user?.type === 'intern' && (
              <View style={styles.settingItem}>
                <View style={styles.settingIcon}><Ionicons name="school-outline" size={20} color="#2563EB" /></View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>University</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editUniversity}
                    onChangeText={setEditUniversity}
                    placeholder="Your university"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>
            )}
            {user?.type === 'firm' && (
              <>
                <View style={styles.settingItem}>
                  <View style={styles.settingIcon}><Ionicons name="business-outline" size={20} color="#2563EB" /></View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>Company Name</Text>
                    <TextInput style={styles.editInput} value={editCompany} onChangeText={setEditCompany} placeholder="Company name" placeholderTextColor="#94A3B8" />
                  </View>
                </View>
                <View style={styles.settingItem}>
                  <View style={styles.settingIcon}><Ionicons name="briefcase-outline" size={20} color="#2563EB" /></View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>Industry</Text>
                    <TextInput style={styles.editInput} value={editIndustry} onChangeText={setEditIndustry} placeholder="Industry" placeholderTextColor="#94A3B8" />
                  </View>
                </View>
                <View style={styles.settingItem}>
                  <View style={styles.settingIcon}><Ionicons name="location-outline" size={20} color="#2563EB" /></View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>Address</Text>
                    <TextInput style={styles.editInput} value={editAddress} onChangeText={setEditAddress} placeholder="Address" placeholderTextColor="#94A3B8" />
                  </View>
                </View>
              </>
            )}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Account info (read-only) */}
        {!editing && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Account Information</Text>
            <SettingItem icon="mail-outline" title="Email" subtitle={user?.email ?? ''} />
            {user?.type === 'intern' && (
              <SettingItem icon="school-outline" title="University" subtitle={displaySub} />
            )}
            {user?.type === 'firm' && user?.industry ? (
              <SettingItem icon="briefcase-outline" title="Industry" subtitle={user.industry} />
            ) : null}
            {user?.type === 'firm' && user?.address ? (
              <SettingItem icon="location-outline" title="Address" subtitle={user.address} />
            ) : null}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Account</Text>
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/about')}>
            <View style={[styles.settingIcon, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="information-circle-outline" size={20} color="#2563EB" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>About Us</Text>
              <Text style={styles.settingSubtitle}>Meet the team behind InternConnect</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>
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

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.statCard}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const SettingItem = ({ icon, title, subtitle }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string }) => (
  <View style={styles.settingItem}>
    <View style={styles.settingIcon}><Ionicons name={icon} size={20} color="#2563EB" /></View>
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle}>{title}</Text>
      {subtitle ? <Text style={styles.settingSubtitle}>{subtitle}</Text> : null}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0F172A' },
  headerSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  editBtnText: { fontSize: 13, fontWeight: '700', color: '#2563EB' },
  profileCard: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  coverGradient: { height: 100, borderRadius: 10, backgroundColor: '#0F4BCC', justifyContent: 'flex-end', padding: 12, marginBottom: 14 },
  coverLabel: { color: '#DBEAFE', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  profileHeader: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  avatarContainer: { position: 'relative', alignSelf: 'flex-start' },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  cameraOverlay: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#2563EB', borderRadius: 12, padding: 4, borderWidth: 2, borderColor: '#fff' },
  userInfo: { flex: 1, justifyContent: 'center', gap: 4 },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  userTitle: { fontSize: 13, color: '#64748B' },
  roleBadge: { alignSelf: 'flex-start', backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
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
  editInput: { fontSize: 14, color: '#0F172A', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginTop: 4 },
  saveBtn: { backgroundColor: '#2563EB', margin: 16, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelBtn: { marginHorizontal: 16, marginBottom: 14, alignItems: 'center' },
  cancelBtnText: { color: '#64748B', fontSize: 14 },
  logoutRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  logoutText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#DC2626' },
  footer: { paddingVertical: 20, paddingHorizontal: 16, alignItems: 'center', gap: 4 },
  footerText: { fontSize: 12, color: '#64748B' },
  footerVersion: { fontSize: 11, color: '#94A3B8' },
});
