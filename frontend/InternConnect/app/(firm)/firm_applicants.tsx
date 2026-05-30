import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, Alert, TextInput, Modal, Platform,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { api, ApiApplicant, ApiInternship } from '../../services/api';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatInterviewTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const DEFAULT_AVATAR = 'https://i.pravatar.cc/150?img=0';

// ─── Interview Scheduling Modal ────────────────────────────────────────────
interface InterviewModalProps {
  visible: boolean;
  applicantName: string;
  onConfirm: (isoDate: string) => void;
  onClose: () => void;
}

function InterviewModal({ visible, applicantName, onConfirm, onClose }: InterviewModalProps) {
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const [date, setDate] = useState(
    `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate() + 1)}`
  );
  const [time, setTime] = useState('10:00');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    const iso = `${date}T${time}:00`;
    const parsed = new Date(iso);
    if (isNaN(parsed.getTime())) {
      setError('Invalid date or time. Use YYYY-MM-DD and HH:MM.');
      return;
    }
    if (parsed <= new Date()) {
      setError('Interview must be scheduled in the future.');
      return;
    }
    setError('');
    onConfirm(parsed.toISOString());
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={ms.backdrop}>
        <View style={ms.sheet}>
          <Text style={ms.title}>Schedule Interview</Text>
          <Text style={ms.sub}>with {applicantName}</Text>

          <Text style={ms.label}>Date (YYYY-MM-DD)</Text>
          <TextInput
            style={ms.input}
            value={date}
            onChangeText={setDate}
            placeholder="e.g. 2025-07-15"
            placeholderTextColor="#94A3B8"
            keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
          />

          <Text style={ms.label}>Time (HH:MM, 24h)</Text>
          <TextInput
            style={ms.input}
            value={time}
            onChangeText={setTime}
            placeholder="e.g. 14:30"
            placeholderTextColor="#94A3B8"
            keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
          />

          {error ? <Text style={ms.error}>{error}</Text> : null}

          <View style={ms.btnRow}>
            <TouchableOpacity style={ms.cancelBtn} onPress={onClose}>
              <Text style={ms.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ms.confirmBtn} onPress={handleConfirm}>
              <Text style={ms.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────
export default function FirmApplicants(): React.JSX.Element {
  const router = useRouter();
  const { id, title } = useLocalSearchParams<{ id: string; title: string }>();

  const [filter, setFilter] = useState<'all' | 'Pending' | 'Accepted'>('all');
  const [search, setSearch] = useState('');
  const [applicants, setApplicants] = useState<ApiApplicant[]>([]);
  const [posting, setPosting] = useState<ApiInternship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [interviewTarget, setInterviewTarget] = useState<ApiApplicant | null>(null);
  const [detailApplicant, setDetailApplicant] = useState<ApiApplicant | null>(null);

  const fetchApplicants = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [postingData, data] = await Promise.all([
        api.internships.get(id),
        api.applications.forPosting(id),
      ]);
      setPosting(postingData);
      setApplicants(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load applicants');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchApplicants(); }, [fetchApplicants]);
  useFocusEffect(useCallback(() => { fetchApplicants(); }, [fetchApplicants]));

  const handleStatusChange = async (applicationId: number, newStatus: string, interview_scheduled_at?: string) => {
    try {
      await api.applications.updateStatus(applicationId, newStatus, interview_scheduled_at ?? null);
      setApplicants((prev) =>
        prev.map((a) =>
          a.id === applicationId
            ? { ...a, status: newStatus as ApiApplicant['status'], interview_scheduled_at: interview_scheduled_at ?? a.interview_scheduled_at }
            : a
        )
      );
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not update status');
    }
  };

  const handleScheduleInterview = async (isoDate: string) => {
    if (!interviewTarget) return;
    setInterviewTarget(null);
    await handleStatusChange(interviewTarget.id, 'Interviewing', isoDate);
  };

  const handleViewDocument = async (url: string) => {
    if (!url || url.startsWith('file://')) {
      Alert.alert('Not available', 'This document was submitted before cloud uploads were enabled and cannot be viewed remotely.');
      return;
    }
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Alert.alert('Error', 'Could not open document.');
    }
  };

  const handleClosePosting = async () => {
    if (!id || !posting) return;
    const nextStatus = posting.status === 'active' ? 'closed' : 'active';
    Alert.alert(
      nextStatus === 'closed' ? 'Close Application' : 'Re-open Application',
      nextStatus === 'closed'
        ? `Close applications for "${posting.title}"?`
        : `Re-open applications for "${posting.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: nextStatus === 'closed' ? 'Close' : 'Re-open',
          style: nextStatus === 'closed' ? 'destructive' : 'default',
          onPress: async () => {
            const updated = await api.internships.updateStatus(id, nextStatus);
            setPosting((prev) => prev ? { ...prev, status: updated.status } : prev);
          },
        },
      ]
    );
  };

  const handleDeletePosting = async () => {
    if (!id || !posting) return;
    Alert.alert('Delete Posting', `Permanently delete "${posting.title}" and all its applications?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await api.internships.delete(id);
          Alert.alert('Deleted', 'Posting deleted.', [{ text: 'OK', onPress: () => router.push('/(firm)/firm_postings') }]);
        },
      },
    ]);
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return applicants.filter((a) => {
      const matchFilter = filter === 'all' || a.status === filter;
      const matchSearch = !q || [a.name, a.email, a.university ?? '', a.cover_letter ?? '', a.status]
        .some((s) => s.toLowerCase().includes(q));
      return matchFilter && matchSearch;
    });
  }, [filter, applicants, search]);

  const pendingCount  = applicants.filter((a) => a.status === 'Pending').length;
  const acceptedCount = applicants.filter((a) => a.status === 'Accepted').length;

  if (!id) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ color: '#475569' }}>No posting selected.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Applicants</Text>
          <TouchableOpacity onPress={fetchApplicants}>
            <Ionicons name="refresh-outline" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {title ? <Text style={styles.subtitle}>Reviewing candidates for {title}.</Text> : null}

        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search applicants..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Posting actions */}
        {posting && (
          <View style={styles.postingActionsWrap}>
            <TouchableOpacity
              style={[styles.closePostingBtn, posting.status === 'closed' && styles.reopenPostingBtn]}
              onPress={handleClosePosting}
            >
              <Ionicons name={posting.status === 'active' ? 'close-circle-outline' : 'refresh-outline'} size={18} color="#fff" />
              <Text style={styles.actionBtnText}>{posting.status === 'active' ? 'Close Applications' : 'Re-open'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deletePostingBtn} onPress={handleDeletePosting}>
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Delete Posting</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Filters */}
        <View style={styles.filters}>
          {(['all', 'Pending', 'Accepted'] as const).map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.filterChip, filter === item && styles.filterChipActive]}
              onPress={() => setFilter(item)}
            >
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
                {item === 'all' ? `All (${applicants.length})` : item === 'Pending' ? `Pending (${pendingCount})` : `Accepted (${acceptedCount})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List */}
        {loading ? (
          <ActivityIndicator size="large" color="#0F4BCC" style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={styles.emptyState}>
            <Ionicons name="cloud-offline-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchApplicants}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : visible.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No applicants yet</Text>
          </View>
        ) : visible.map((applicant) => (
          <ApplicantCard
            key={applicant.id}
            applicant={applicant}
            onStatusChange={handleStatusChange}
            onScheduleInterview={() => setInterviewTarget(applicant)}
            onViewDocument={handleViewDocument}
            onViewDetail={() => setDetailApplicant(applicant)}
          />
        ))}
      </ScrollView>

      {interviewTarget && (
        <InterviewModal
          visible
          applicantName={interviewTarget.name}
          onConfirm={handleScheduleInterview}
          onClose={() => setInterviewTarget(null)}
        />
      )}

      {detailApplicant && (
        <ApplicantDetailModal
          applicant={detailApplicant}
          postingTitle={posting?.title ?? ''}
          onClose={() => setDetailApplicant(null)}
          onStatusChange={async (id, status) => {
            await handleStatusChange(id, status);
            setDetailApplicant((prev) => prev ? { ...prev, status: status as ApiApplicant['status'] } : null);
          }}
          onScheduleInterview={() => { setDetailApplicant(null); setInterviewTarget(detailApplicant); }}
          onViewDocument={handleViewDocument}
        />
      )}
    </View>
  );
}

// ─── Applicant Card ────────────────────────────────────────────────────────
interface CardProps {
  applicant: ApiApplicant;
  onStatusChange: (id: number, status: string) => void;
  onScheduleInterview: () => void;
  onViewDocument: (url: string) => void;
  onViewDetail: () => void;
}

function ApplicantCard({ applicant, onStatusChange, onScheduleInterview, onViewDocument, onViewDetail }: CardProps) {
  const isRejected    = applicant.status === 'Rejected';
  const isAccepted    = applicant.status === 'Accepted';
  const isInterviewing = applicant.status === 'Interviewing';

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.topRow} onPress={onViewDetail} activeOpacity={0.7}>
        <Image source={{ uri: applicant.profile_picture || DEFAULT_AVATAR }} style={styles.avatar} />
        <View style={styles.info}>
          <Text style={styles.name}>{applicant.name}</Text>
          <Text style={styles.school}>{applicant.university || 'University not provided'}</Text>
          <Text style={styles.email}>{applicant.email}</Text>
        </View>
        <View style={[styles.statusPill, isRejected && styles.rejectedPill, isAccepted && styles.acceptedPill, isInterviewing && styles.interviewingPill]}>
          <Text style={[styles.statusPillText, isRejected && styles.rejectedText, isAccepted && styles.acceptedText, isInterviewing && styles.interviewingText]}>
            {applicant.status}
          </Text>
        </View>
      </TouchableOpacity>

      {applicant.cover_letter ? (
        <Text style={styles.coverLetter} numberOfLines={2}>"{applicant.cover_letter}"</Text>
      ) : null}

      {/* Interview time */}
      {applicant.interview_scheduled_at ? (
        <View style={styles.interviewBadge}>
          <Ionicons name="calendar-outline" size={14} color="#7C3AED" />
          <Text style={styles.interviewBadgeText}>
            Interview: {formatInterviewTime(applicant.interview_scheduled_at)}
          </Text>
        </View>
      ) : null}

      {/* Document */}
      {applicant.document_url ? (
        <TouchableOpacity style={styles.docBtn} onPress={() => onViewDocument(applicant.document_url!)}>
          <Ionicons name="document-text-outline" size={16} color="#0F4BCC" />
          <Text style={styles.docBtnText}>View Document / CV</Text>
          <Ionicons name="open-outline" size={14} color="#0F4BCC" />
        </TouchableOpacity>
      ) : null}

      <Text style={styles.appliedDate}>Applied {formatDate(applicant.applied_at)}</Text>

      {/* Action buttons */}
      {isRejected ? (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.outlineAction} onPress={() => onStatusChange(applicant.id, 'Pending')}>
            <Text style={styles.outlineActionText}>Re-evaluate</Text>
          </TouchableOpacity>
        </View>
      ) : isInterviewing ? (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.acceptBtn} onPress={() => onStatusChange(applicant.id, 'Accepted')}>
            <Text style={styles.acceptBtnText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectBtn} onPress={() => onStatusChange(applicant.id, 'Rejected')}>
            <Text style={styles.rejectBtnText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.interviewBtn} onPress={onScheduleInterview}>
            <Ionicons name="calendar-outline" size={14} color="#fff" />
            <Text style={styles.interviewBtnText}>Reschedule</Text>
          </TouchableOpacity>
        </View>
      ) : isAccepted ? (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.rejectBtn} onPress={() => onStatusChange(applicant.id, 'Rejected')}>
            <Text style={styles.rejectBtnText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.interviewBtn} onPress={onScheduleInterview}>
            <Ionicons name="calendar-outline" size={14} color="#fff" />
            <Text style={styles.interviewBtnText}>Schedule Interview</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.acceptBtn} onPress={() => onStatusChange(applicant.id, 'Accepted')}>
            <Text style={styles.acceptBtnText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectBtn} onPress={() => onStatusChange(applicant.id, 'Rejected')}>
            <Text style={styles.rejectBtnText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.interviewBtn} onPress={onScheduleInterview}>
            <Ionicons name="calendar-outline" size={14} color="#fff" />
            <Text style={styles.interviewBtnText}>Interview</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Applicant Detail Modal ────────────────────────────────────────────────
function ApplicantDetailModal({ applicant, postingTitle, onClose, onStatusChange, onScheduleInterview, onViewDocument }: {
  applicant: ApiApplicant;
  postingTitle: string;
  onClose: () => void;
  onStatusChange: (id: number, status: string) => Promise<void>;
  onScheduleInterview: () => void;
  onViewDocument: (url: string) => void;
}) {
  const [updating, setUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(applicant.status);

  const changeStatus = async (status: string) => {
    setUpdating(true);
    await onStatusChange(applicant.id, status);
    setCurrentStatus(status as ApiApplicant['status']);
    setUpdating(false);
  };

  const statusColors: Record<string, { bg: string; text: string }> = {
    Pending:      { bg: '#FEF3C7', text: '#92400E' },
    Interviewing: { bg: '#EDE9FE', text: '#5B21B6' },
    Accepted:     { bg: '#D1FAE5', text: '#065F46' },
    Rejected:     { bg: '#FEE2E2', text: '#991B1B' },
  };
  const sc = statusColors[currentStatus] ?? statusColors.Pending;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#F5F7FB' }}>
        <View style={adm.header}>
          <TouchableOpacity onPress={onClose} style={adm.closeBtn}>
            <Ionicons name="close" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={adm.headerTitle}>Applicant Detail</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adm.content}>
          {/* Profile */}
          <View style={adm.profileRow}>
            <Image source={{ uri: applicant.profile_picture || DEFAULT_AVATAR }} style={adm.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={adm.name}>{applicant.name}</Text>
              <Text style={adm.email}>{applicant.email}</Text>
              {applicant.university ? <Text style={adm.university}>{applicant.university}</Text> : null}
            </View>
            <View style={[adm.statusPill, { backgroundColor: sc.bg }]}>
              <Text style={[adm.statusText, { color: sc.text }]}>{currentStatus}</Text>
            </View>
          </View>

          {/* Posting context */}
          <View style={adm.section}>
            <Text style={adm.sectionLabel}>Applied For</Text>
            <Text style={adm.sectionValue}>{postingTitle}</Text>
            <Text style={adm.sectionLabel}>Applied On</Text>
            <Text style={adm.sectionValue}>{formatDate(applicant.applied_at)}</Text>
          </View>

          {/* Interview time */}
          {applicant.interview_scheduled_at ? (
            <View style={adm.interviewBox}>
              <Ionicons name="calendar" size={18} color="#7C3AED" />
              <View style={{ flex: 1 }}>
                <Text style={adm.interviewLabel}>Interview Scheduled</Text>
                <Text style={adm.interviewTime}>{formatInterviewTime(applicant.interview_scheduled_at)}</Text>
              </View>
            </View>
          ) : null}

          {/* Cover letter */}
          {applicant.cover_letter ? (
            <View style={adm.coverCard}>
              <Text style={adm.coverTitle}>Cover Letter</Text>
              <Text style={adm.coverText}>{applicant.cover_letter}</Text>
            </View>
          ) : (
            <View style={adm.coverCard}>
              <Text style={adm.coverTitle}>Cover Letter</Text>
              <Text style={[adm.coverText, { color: '#94A3B8', fontStyle: 'italic' }]}>No cover letter provided</Text>
            </View>
          )}

          {/* Document */}
          {applicant.document_url && !applicant.document_url.startsWith('file://') ? (
            <TouchableOpacity style={adm.docBtn} onPress={() => onViewDocument(applicant.document_url!)}>
              <Ionicons name="document-text-outline" size={18} color="#0F4BCC" />
              <Text style={adm.docBtnText}>Download CV / Document</Text>
              <Ionicons name="open-outline" size={16} color="#0F4BCC" />
            </TouchableOpacity>
          ) : (
            <View style={[adm.docBtn, { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }]}>
              <Ionicons name="document-outline" size={18} color="#94A3B8" />
              <Text style={[adm.docBtnText, { color: '#94A3B8' }]}>No document submitted</Text>
            </View>
          )}

          {/* Actions */}
          <Text style={adm.actionsTitle}>Update Status</Text>
          {updating ? (
            <ActivityIndicator size="large" color="#0F4BCC" style={{ marginTop: 16 }} />
          ) : (
            <View style={adm.actionGrid}>
              {currentStatus !== 'Accepted' && (
                <TouchableOpacity style={[adm.actionBtn, { backgroundColor: '#0F4BCC' }]} onPress={() => changeStatus('Accepted')}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={adm.actionBtnText}>Accept</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={adm.actionBtn} onPress={onScheduleInterview}>
                <Ionicons name="calendar-outline" size={18} color="#fff" />
                <Text style={adm.actionBtnText}>Schedule Interview</Text>
              </TouchableOpacity>
              {currentStatus !== 'Pending' && (
                <TouchableOpacity style={[adm.actionBtn, { backgroundColor: '#6B7280' }]} onPress={() => changeStatus('Pending')}>
                  <Ionicons name="time-outline" size={18} color="#fff" />
                  <Text style={adm.actionBtnText}>Set Pending</Text>
                </TouchableOpacity>
              )}
              {currentStatus !== 'Rejected' && (
                <TouchableOpacity style={[adm.actionBtn, { backgroundColor: '#DC2626' }]} onPress={() => changeStatus('Rejected')}>
                  <Ionicons name="close-circle-outline" size={18} color="#fff" />
                  <Text style={adm.actionBtnText}>Reject</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const adm = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  closeBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  content: { padding: 18, paddingBottom: 40 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#E5E7EB' },
  name: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  email: { fontSize: 13, color: '#64748B', marginTop: 2 },
  university: { fontSize: 13, color: '#2563EB', fontWeight: '500', marginTop: 2 },
  statusPill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
  statusText: { fontSize: 12, fontWeight: '700' },
  section: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 14 },
  sectionLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  sectionValue: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  interviewBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F5F3FF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#DDD6FE', marginBottom: 14 },
  interviewLabel: { fontSize: 12, color: '#7C3AED', fontWeight: '600' },
  interviewTime: { fontSize: 14, fontWeight: '800', color: '#5B21B6' },
  coverCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 14 },
  coverTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10 },
  coverText: { fontSize: 14, color: '#374151', lineHeight: 22 },
  docBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EFF6FF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#BFDBFE', marginBottom: 20 },
  docBtnText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#0F4BCC' },
  actionsTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  actionGrid: { gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#7C3AED', borderRadius: 14, paddingVertical: 14 },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FB' },
  content: { paddingBottom: 24 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, paddingTop: 18, paddingBottom: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  subtitle: { paddingHorizontal: 18, paddingTop: 10, fontSize: 16, lineHeight: 23, color: '#475569' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 18, marginTop: 14,
    paddingHorizontal: 14, height: 48,
    borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#fff',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A' },
  postingActionsWrap: { paddingHorizontal: 18, marginTop: 16, gap: 10 },
  closePostingBtn: {
    backgroundColor: '#C81E1E', borderRadius: 14, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  reopenPostingBtn: { backgroundColor: '#0F4BCC' },
  deletePostingBtn: {
    backgroundColor: '#7F1D1D', borderRadius: 14, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  filters: { flexDirection: 'row', gap: 12, paddingHorizontal: 18, marginTop: 24, marginBottom: 12 },
  filterChip: { borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 18, paddingVertical: 12 },
  filterChipActive: { backgroundColor: '#0F4BCC', borderColor: '#0F4BCC' },
  filterText: { fontSize: 16, fontWeight: '700', color: '#374151' },
  filterTextActive: { color: '#fff' },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyText: { fontSize: 14, color: '#64748B', textAlign: 'center' },
  retryBtn: { marginTop: 8, backgroundColor: '#0F4BCC', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '700' },
  card: {
    marginHorizontal: 18, marginTop: 12, backgroundColor: '#fff',
    borderRadius: 20, borderWidth: 1, borderColor: '#CBD5E1', padding: 16,
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { width: 58, height: 58, borderRadius: 29, marginRight: 14, backgroundColor: '#E5E7EB' },
  info: { flex: 1 },
  name: { fontSize: 20, fontWeight: '800', color: '#111827' },
  school: { marginTop: 4, fontSize: 15, color: '#4B5563' },
  email: { marginTop: 2, fontSize: 13, color: '#6B7280' },
  statusPill: { backgroundColor: '#FEF3C7', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  rejectedPill: { backgroundColor: '#F8D7DA' },
  acceptedPill: { backgroundColor: '#6EE7B7' },
  interviewingPill: { backgroundColor: '#EDE9FE' },
  statusPillText: { color: '#92400E', fontWeight: '700', fontSize: 13 },
  rejectedText: { color: '#9F1239' },
  acceptedText: { color: '#14532D' },
  interviewingText: { color: '#5B21B6' },
  coverLetter: { marginTop: 12, fontSize: 14, color: '#475569', fontStyle: 'italic', lineHeight: 20 },
  interviewBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10,
    backgroundColor: '#F5F3FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7,
  },
  interviewBadgeText: { fontSize: 13, color: '#7C3AED', fontWeight: '600', flex: 1 },
  docBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10,
    backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  docBtnText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#0F4BCC' },
  appliedDate: { marginTop: 8, fontSize: 12, color: '#94A3B8' },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  acceptBtn: { flex: 1, borderRadius: 12, paddingVertical: 11, backgroundColor: '#0F4BCC', alignItems: 'center' },
  acceptBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  rejectBtn: { flex: 1, borderRadius: 12, paddingVertical: 11, borderWidth: 1.5, borderColor: '#C81E1E', backgroundColor: '#fff', alignItems: 'center' },
  rejectBtnText: { color: '#C81E1E', fontSize: 14, fontWeight: '800' },
  interviewBtn: { flex: 1, borderRadius: 12, paddingVertical: 11, backgroundColor: '#7C3AED', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 5 },
  interviewBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  outlineAction: { flex: 1, borderRadius: 12, paddingVertical: 11, borderWidth: 1, borderColor: '#94A3B8', backgroundColor: '#fff', alignItems: 'center' },
  outlineActionText: { color: '#475569', fontWeight: '800', fontSize: 14 },
});

const ms = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  sheet: { width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 24 },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  sub: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 4, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#0F172A', marginBottom: 14,
  },
  error: { color: '#DC2626', fontSize: 13, marginBottom: 10 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '700', color: '#475569' },
  confirmBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, backgroundColor: '#7C3AED', alignItems: 'center' },
  confirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
