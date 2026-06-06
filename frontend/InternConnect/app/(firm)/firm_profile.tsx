import React, { useEffect, useState } from 'react';
import {
  Alert, Image, ScrollView, StyleSheet, Text,
  TouchableOpacity, View, TextInput, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { api, uploadAvatar, ApiInternship } from '../../services/api';

export default function FirmProfile(): React.JSX.Element {
  const router = useRouter();
  const { user, logout, updateProfile, refreshUser } = useAuth();
  const [postings, setPostings] = useState<ApiInternship[]>([]);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editIndustry, setEditIndustry] = useState('');
  const [editAddress, setEditAddress] = useState('');

  useEffect(() => {
    api.internships.mine().then(setPostings).catch(() => {});
  }, []);

  const startEdit = () => {
    setEditName(user?.name ?? '');
    setEditCompany(user?.companyName ?? '');
    setEditIndustry(user?.industry ?? '');
    setEditAddress(user?.address ?? '');
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.auth.updateMe({
        name: editName,
        companyName: editCompany,
        industry: editIndustry,
        address: editAddress,
      });
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
      Alert.alert('Permission required', 'Allow access to your photo library to upload a logo.');
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

  const confirmLogout = () => {
    Alert.alert('Logout', 'Do you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await logout();
        router.push('/');
      } },
    ]);
  };

  const activeCount    = postings.filter((p) => p.status === 'active').length;
  const applicantCount = postings.reduce((s, p) => s + (p.applicant_count ?? 0), 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <Text style={styles.brand}>InternConnect</Text>
          <Text style={styles.headerLabel}>Firm Profile</Text>
        </View>
        <TouchableOpacity onPress={editing ? handleSave : startEdit} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#0F4BCC" />
          ) : (
            <View style={styles.editBtn}>
              <Ionicons name={editing ? 'checkmark' : 'create-outline'} size={16} color="#0F4BCC" />
              <Text style={styles.editBtnText}>{editing ? 'Save' : 'Edit'}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Banner + Logo */}
      <View style={styles.banner}>
        <View style={styles.bannerPlaceholder}>
          <Ionicons name="business-outline" size={24} color="#DBEAFE" />
          <Text style={styles.bannerPlaceholderText}>Company Overview</Text>
        </View>
      </View>

      <View style={styles.logoRow}>
        <TouchableOpacity style={styles.logoWrap} onPress={handlePickAvatar} disabled={uploadingAvatar}>
          {uploadingAvatar ? (
            <View style={[styles.logoFallback, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator size="small" color="#0F4BCC" />
            </View>
          ) : user?.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={styles.logoImage} />
          ) : (
            <View style={styles.logoFallback}>
              <Ionicons name="business-outline" size={34} color="#0F4BCC" />
            </View>
          )}
          <View style={styles.cameraOverlay}>
            <Ionicons name="camera" size={12} color="#fff" />
          </View>
        </TouchableOpacity>
        <View style={styles.logoTextWrap}>
          {editing ? (
            <TextInput
              style={styles.editInput}
              value={editCompany}
              onChangeText={setEditCompany}
              placeholder="Company name"
              placeholderTextColor="#94A3B8"
            />
          ) : (
            <Text style={styles.logoCompany}>{user?.companyName || user?.name || 'Company'}</Text>
          )}
          {editing ? (
            <TextInput
              style={[styles.editInput, { marginTop: 4 }]}
              value={editIndustry}
              onChangeText={setEditIndustry}
              placeholder="Industry"
              placeholderTextColor="#94A3B8"
            />
          ) : (
            <Text style={styles.logoSub}>{user?.industry || 'Industry not set'}</Text>
          )}
        </View>
      </View>

      {/* Company Details */}
      <View style={styles.card}>
        <SectionTitle icon="briefcase-outline" title="Company Details" />
        {editing ? (
          <>
            <View style={{ marginTop: 14 }}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput style={styles.fieldInput} value={editName} onChangeText={setEditName} placeholder="Your name" placeholderTextColor="#94A3B8" />
            </View>
            <View style={{ marginTop: 14 }}>
              <Text style={styles.fieldLabel}>Address</Text>
              <TextInput style={styles.fieldInput} value={editAddress} onChangeText={setEditAddress} placeholder="City, Country" placeholderTextColor="#94A3B8" />
            </View>
          </>
        ) : (
          <>
            <InfoField label="Company Name" value={user?.companyName || user?.name || 'Company'} />
            <InfoField label="Industry" value={user?.industry || 'Not provided'} />
            <InfoField label="Location" value={user?.address || 'Not provided'} />
            <InfoField label="Email" value={user?.email || ''} />
          </>
        )}
        {editing && (
          <>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Posting Summary */}
      <View style={styles.card}>
        <SectionTitle icon="briefcase-outline" title="Posting Summary" />
        <InfoField label="Active Postings" value={String(activeCount)} />
        <InfoField label="Total Applicants" value={String(applicantCount)} />
        <InfoField label="Latest Posting" value={postings[0]?.title || 'No postings yet'} />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
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
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  editBtnText: { fontSize: 13, fontWeight: '700', color: '#0F4BCC' },
  banner: { height: 130, borderRadius: 20, backgroundColor: '#0F4BCC', marginBottom: -28 },
  bannerPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  bannerPlaceholderText: { color: '#DBEAFE', fontSize: 12, fontWeight: '700' },
  logoRow: { marginTop: -20, marginBottom: 2, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4 },
  logoWrap: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#fff', borderWidth: 3, borderColor: '#fff', overflow: 'hidden', position: 'relative' },
  logoImage: { width: '100%', height: '100%' },
  logoFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6FF' },
  cameraOverlay: { position: 'absolute', bottom: 2, right: 2, backgroundColor: '#0F4BCC', borderRadius: 10, padding: 3, borderWidth: 1.5, borderColor: '#fff' },
  logoTextWrap: { flex: 1 },
  logoCompany: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  logoSub: { fontSize: 12, color: '#475569', marginTop: 4 },
  card: { marginTop: 14, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#D7DCE6', padding: 16 },
  sectionTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  readOnlyField: { minHeight: 48, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: '#F8FAFC' },
  readOnlyText: { fontSize: 15, color: '#111827', fontWeight: '600' },
  fieldInput: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#0F172A', backgroundColor: '#fff' },
  editInput: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#0F172A', backgroundColor: '#fff' },
  saveBtn: { backgroundColor: '#0F4BCC', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelBtnText: { color: '#64748B', fontSize: 14 },
  logoutBtn: { marginTop: 10, borderRadius: 16, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#EF4444', backgroundColor: '#fff' },
  logoutText: { color: '#EF4444', fontSize: 16, fontWeight: '800' },
});
