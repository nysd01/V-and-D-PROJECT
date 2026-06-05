import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';

const CATEGORIES = ['Engineering', 'Product Design', 'Marketing', 'Data Science', 'Product Management'];
const WORK_TYPES = ['Remote', 'Hybrid', 'In-person'] as const;

type WorkType = typeof WORK_TYPES[number];

interface FormState {
  title: string;
  category: string;
  description: string;
  requirements: string;
  location: string;
  duration: string;
  work_type: WorkType;
  is_paid: boolean;
}

export default function FirmPostNew(): React.JSX.Element {
  const router = useRouter();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>({
    title: '',
    category: '',
    description: '',
    requirements: '',
    location: '',
    duration: '',
    work_type: 'Remote',
    is_paid: true,
  });

  const set = (field: keyof FormState) => (value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const submit = async () => {
    if (!form.title || !form.category || !form.description) {
      Alert.alert('Missing fields', 'Title, category and description are required.');
      return;
    }
    setSubmitting(true);
    try {
      await api.internships.create({
        title: form.title,
        category: form.category,
        description: form.description,
        requirements: form.requirements,
        location: form.location || form.work_type,
        duration: form.duration,
        work_type: form.work_type,
        is_paid: form.is_paid,
      });
      Alert.alert('Posted!', 'Your internship has been published.', [
        { text: 'OK', onPress: () => router.push('/(firm)/firm_postings') },
      ]);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not post internship');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post New Internship</Text>
        <View style={{ width: 22 }} />
      </View>

      <Text style={styles.helper}>Create a clear internship listing in three quick steps.</Text>

      {/* SECTION 1 */}
      <Section index="1" title="General Information">
        <Field
          label="Internship Title *"
          value={form.title}
          onChangeText={set('title')}
          placeholder="e.g. Product Design Intern"
        />

        <Text style={styles.label}>Category *</Text>
        <TouchableOpacity style={styles.select} onPress={() => setCategoryOpen((prev) => !prev)}>
          <Text style={[styles.selectText, !form.category && styles.placeholder]}>
            {form.category || 'Select Category'}
          </Text>
          <Ionicons name={categoryOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#475569" />
        </TouchableOpacity>
        {categoryOpen && (
          <View style={styles.dropdown}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={styles.dropdownItem}
                onPress={() => { set('category')(cat); setCategoryOpen(false); }}
              >
                <Text style={styles.dropdownText}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.label}>Work Type</Text>
        <View style={styles.chipRow}>
          {WORK_TYPES.map((wt) => (
            <TouchableOpacity
              key={wt}
              style={[styles.chip, form.work_type === wt && styles.chipActive]}
              onPress={() => set('work_type')(wt)}
            >
              <Text style={[styles.chipText, form.work_type === wt && styles.chipTextActive]}>{wt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Compensation</Text>
        <View style={styles.chipRow}>
          <TouchableOpacity
            style={[styles.chip, form.is_paid && styles.chipActive]}
            onPress={() => set('is_paid')(true)}
          >
            <Text style={[styles.chipText, form.is_paid && styles.chipTextActive]}>Paid</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, !form.is_paid && styles.chipActive]}
            onPress={() => set('is_paid')(false)}
          >
            <Text style={[styles.chipText, !form.is_paid && styles.chipTextActive]}>Unpaid</Text>
          </TouchableOpacity>
        </View>
      </Section>

      {/* SECTION 2 */}
      <Section index="2" title="Internship Details">
        <Field
          label="Description *"
          multiline
          value={form.description}
          onChangeText={set('description')}
          placeholder="Describe the role and responsibilities..."
        />
        <Field
          label="Requirements"
          multiline
          value={form.requirements}
          onChangeText={set('requirements')}
          placeholder="Skills, education level, tools..."
        />
      </Section>

      {/* SECTION 3 */}
      <Section index="3" title="Logistics">
        <Field
          label="Location"
          value={form.location}
          onChangeText={set('location')}
          placeholder="City, Country (or leave blank for Remote)"
          icon="location-outline"
        />
        <Field
          label="Duration"
          value={form.duration}
          onChangeText={set('duration')}
          placeholder="e.g. 12 weeks"
          icon="time-outline"
        />
      </Section>

      <TouchableOpacity
        style={[styles.primaryBtn, submitting && { opacity: 0.6 }]}
        onPress={submit}
        disabled={submitting}
      >
        <Text style={styles.primaryText}>{submitting ? 'Posting...' : 'Post Now'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()}>
        <Text style={styles.secondaryText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Section({ index, title, children }: { index: string; title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.indexBadge}><Text style={styles.indexText}>{index}</Text></View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Field({
  label, value, onChangeText, placeholder, multiline, icon,
}: {
  label: string; value: string;
  onChangeText: (text: string) => void;
  placeholder: string; multiline?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, multiline && styles.textAreaWrap]}>
        {icon ? <Ionicons name={icon} size={16} color="#64748B" style={{ marginRight: 8 }} /> : null}
        <TextInput
          style={[styles.input, multiline && styles.textArea]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          multiline={multiline}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FB' },
  content: { paddingHorizontal: 16, paddingBottom: 28 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 18, paddingBottom: 6,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  helper: { fontSize: 16, lineHeight: 24, color: '#475569', marginBottom: 18 },
  section: { marginTop: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  indexBadge: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#0F4BCC',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  indexText: { color: '#FFFFFF', fontWeight: '800' },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 18,
    borderWidth: 1, borderColor: '#D7DCE6', padding: 14,
  },
  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', minHeight: 52,
    borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 14,
    paddingHorizontal: 12, backgroundColor: '#F8FAFC',
  },
  textAreaWrap: { alignItems: 'flex-start', paddingTop: 12, minHeight: 104 },
  input: { flex: 1, fontSize: 16, color: '#0F172A' },
  textArea: { minHeight: 78, textAlignVertical: 'top' },
  select: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    minHeight: 52, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 14,
    paddingHorizontal: 12, backgroundColor: '#F8FAFC',
  },
  selectText: { fontSize: 16, color: '#0F172A' },
  placeholder: { color: '#94A3B8' },
  dropdown: {
    marginTop: 10, borderRadius: 14, borderWidth: 1,
    borderColor: '#CBD5E1', backgroundColor: '#FFFFFF', overflow: 'hidden',
  },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  dropdownText: { fontSize: 15, color: '#111827', fontWeight: '600' },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#F8FAFC',
  },
  chipActive: { backgroundColor: '#0F4BCC', borderColor: '#0F4BCC' },
  chipText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  chipTextActive: { color: '#FFFFFF' },
  primaryBtn: {
    marginTop: 22, borderRadius: 16, paddingVertical: 16,
    backgroundColor: '#0F4BCC', alignItems: 'center',
  },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  secondaryBtn: {
    marginTop: 10, borderRadius: 16, paddingVertical: 16,
    backgroundColor: '#DBEAFE', alignItems: 'center',
  },
  secondaryText: { color: '#0F4BCC', fontSize: 16, fontWeight: '800' },
});
