import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { api, uploadDocument, ApiInternship } from '@/services/api';

interface NavItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress: () => void;
}

export default function ApplyPage(): React.JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [coverLetter, setCoverLetter] = useState<string>('');
  const [agreed, setAgreed] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [workSampleFile, setWorkSampleFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [resumeFile, setResumeFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [internship, setInternship] = useState<ApiInternship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Check if user is logged in and fetch internship data
  useEffect(() => {
    if (!user) {
      Alert.alert('Login Required', 'You must login to apply for internships', [
        { text: 'Login', onPress: () => router.replace('/login') },
        { text: 'Cancel', onPress: () => router.back(), style: 'cancel' },
      ]);
    }
  }, [user, router]);

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

  const handlePickWorkSample = async (): Promise<void> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        // Check file size (limit to 10MB)
        if (asset.size && asset.size > 10 * 1024 * 1024) {
          Alert.alert('File too large', 'Work sample must be smaller than 10MB');
          return;
        }
        setWorkSampleFile(asset);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handlePickResume = async (): Promise<void> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        // Check file size (limit to 10MB)
        if (asset.size && asset.size > 10 * 1024 * 1024) {
          Alert.alert('File too large', 'Resume must be smaller than 10MB');
          return;
        }
        setResumeFile(asset);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!agreed) {
      Alert.alert('Terms Required', 'Please agree to the Terms of Service to continue.');
      return;
    }
    if (!internship) {
      Alert.alert('Error', 'Internship data not loaded');
      return;
    }
    
    try {
      setSubmitting(true);
      // Upload whichever file was picked to Supabase Storage first
      let documentUrl: string | undefined;
      const fileToUpload = workSampleFile || resumeFile;
      if (fileToUpload) {
        documentUrl = await uploadDocument(
          fileToUpload.uri,
          fileToUpload.name ?? 'document.pdf',
          fileToUpload.mimeType ?? 'application/pdf'
        );
      }
      const result = await api.applications.create(internship.id, coverLetter, documentUrl);
      
      // Create success notification
      try {
        await api.notifications.create(
          result.id,
          internship.firm_name || internship.company_name,
          internship.title
        );
      } catch (notifErr) {
        console.warn('Failed to create notification:', notifErr);
        // Don't fail the entire flow if notification creation fails
      }
      
      setSubmitted(true);
      Alert.alert('Application sent successfully', `Your application has been sent to ${internship.firm_name || internship.company_name}.`, [
        { text: 'OK', onPress: () => router.push('/(tabs)/myapplications') }
      ]);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
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
  const durationText = internship.duration || '3 Months';
  const paidText = internship.is_paid ? 'Paid' : 'Unpaid';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#2563EB" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Apply for Role</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* MAIN FORM CARD */}
        <View style={styles.formCard}>

          {/* Company logo */}
          <View style={styles.companyLogoBox}>
            <View style={styles.companyLogo}>
              <Ionicons name="briefcase" size={32} color="#fff" />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.applyTitle}>
            {internship.title}
          </Text>
          <Text style={styles.companyName}>{companyName}</Text>

          {/* Meta */}
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color="#64748B" />
              <Text style={styles.metaText}>{internship.location}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="#64748B" />
              <Text style={styles.metaText}>{durationText} • {paidText}</Text>
            </View>
          </View>

          <View style={styles.matchBadge}>
            <Ionicons name="star" size={13} color="#059669" />
            <Text style={styles.matchText}>98% Match Score</Text>
          </View>

          <View style={styles.divider} />

          {/* COVER LETTER */}
          <View>
            <View style={styles.fieldHeader}>
              <Text style={styles.fieldLabel}>Cover Letter</Text>
              <Text style={styles.fieldHint}>Optional but recommended</Text>
            </View>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={6}
              placeholder={`Tell ${companyName} why you're a great fit for this role...`}
              placeholderTextColor="#CBD5E1"
              value={coverLetter}
              onChangeText={setCoverLetter}
              textAlignVertical="top"
            />
            <Text style={styles.proTip}>
              <Text style={styles.proTipBold}>💡 Pro Tip:</Text>
              {' '}Highlight your Figma skills and UX process.
            </Text>
          </View>

          {/* CV UPLOAD */}
          <View style={styles.uploadSection}>
            <Text style={styles.fieldLabel}>Resume (CV)</Text>
            <TouchableOpacity style={styles.dropZone} onPress={handlePickResume}>
              <Ionicons name="cloud-upload-outline" size={28} color="#2563EB" />
              <Text style={styles.dropTitle}>Click to upload or drag and drop</Text>
              <Text style={styles.dropSub}>PDF, DOCX (Max. 10MB)</Text>
            </TouchableOpacity>

            {resumeFile && (
              <View style={styles.fileRow}>
                <View style={styles.fileIcon}>
                  <Ionicons name="document-outline" size={18} color="#2563EB" />
                </View>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName}>{resumeFile.name}</Text>
                  <Text style={styles.fileMeta}>{resumeFile.size ? `${(resumeFile.size / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'} • Uploaded</Text>
                </View>
                <TouchableOpacity onPress={() => setResumeFile(null)}>
                  <Ionicons name="close" size={18} color="#DC2626" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* WORK SAMPLE UPLOAD */}
          <View style={styles.uploadSection}>
            <Text style={styles.fieldLabel}>Work Sample / Portfolio (Optional)</Text>
            <TouchableOpacity style={styles.dropZone} onPress={handlePickWorkSample}>
              <Ionicons name="document-attach-outline" size={28} color="#059669" />
              <Text style={styles.dropTitle}>Click to upload or drag and drop</Text>
              <Text style={styles.dropSub}>PDF, DOCX (Max. 10MB)</Text>
            </TouchableOpacity>

            {workSampleFile && (
              <View style={styles.fileRow}>
                <View style={[styles.fileIcon, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="document-outline" size={18} color="#059669" />
                </View>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName}>{workSampleFile.name}</Text>
                  <Text style={styles.fileMeta}>{workSampleFile.size ? `${(workSampleFile.size / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'} • Uploaded</Text>
                </View>
                <TouchableOpacity onPress={() => setWorkSampleFile(null)}>
                  <Ionicons name="close" size={18} color="#DC2626" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* TERMS CHECKBOX */}
          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setAgreed((prev) => !prev)}
            activeOpacity={0.7}
            disabled={submitting}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.checkText}>
              I agree to InternConnect's{' '}
              <Text style={styles.checkLink}>Terms of Service</Text>
              {' '}and allow {companyName} to view my profile.
            </Text>
          </TouchableOpacity>

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            style={[styles.submitBtn, submitted && styles.submitBtnDone]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={submitting || submitted}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name={submitted ? 'checkmark-circle' : 'send'} size={18} color="#fff" />
                <Text style={styles.submitText}>
                  {submitted ? 'Application Sent!' : 'Submit Application'}
                </Text>
              </>
            )}
          </TouchableOpacity>

        </View>

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

const NavItem: React.FC<NavItemProps> = ({ icon, label, onPress }) => {
  return (
    <TouchableOpacity style={styles.navItem} onPress={onPress}>
      <Ionicons name={icon} size={22} color="#999" />
      <Text style={styles.navLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

//////////////////////////////////////////////////////
// STYLES
//////////////////////////////////////////////////////

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

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

  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },

  formCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },

  companyLogoBox: {
    alignItems: 'center',
    marginVertical: 8,
  },

  companyLogo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  applyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'center',
  },

  companyName: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },

  metaContainer: {
    gap: 8,
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  metaText: {
    fontSize: 13,
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
    alignSelf: 'center',
  },

  matchText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },

  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },

  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },

  fieldHint: {
    fontSize: 11,
    color: '#94A3B8',
  },

  textArea: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 120,
  },

  proTip: {
    fontSize: 12,
    color: '#64748B',
    backgroundColor: '#FFFBEB',
    borderRadius: 6,
    padding: 10,
    marginTop: 8,
  },

  proTipBold: {
    fontWeight: '600',
    color: '#92400E',
  },

  uploadSection: {
    gap: 10,
    marginTop: 8,
  },

  dropZone: {
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
    paddingVertical: 20,
    alignItems: 'center',
    gap: 6,
  },

  dropTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0F172A',
  },

  dropSub: {
    fontSize: 11,
    color: '#64748B',
  },

  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },

  fileIcon: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  fileInfo: {
    flex: 1,
    gap: 2,
  },

  fileName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },

  fileMeta: {
    fontSize: 11,
    color: '#94A3B8',
  },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginVertical: 8,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },

  checkboxChecked: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },

  checkText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
    flex: 1,
  },

  checkLink: {
    color: '#2563EB',
    fontWeight: '600',
  },

  submitBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },

  submitBtnDone: {
    backgroundColor: '#059669',
  },

  submitText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
