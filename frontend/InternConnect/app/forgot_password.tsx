import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '@/services/api';

type Step = 'email' | 'code' | 'done';

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async () => {
    if (!email.trim()) { Alert.alert('Error', 'Enter your email address'); return; }
    setLoading(true);
    try {
      const res = await api.auth.forgotPassword(email.trim().toLowerCase());
      setResetCode(res.code);
      Alert.alert(
        'Code Generated',
        `Your reset code is: ${res.code}\n\n(In production this would be emailed to you.)`,
        [{ text: 'OK', onPress: () => setStep('code') }]
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code.trim()) { Alert.alert('Error', 'Enter the reset code'); return; }
    if (newPassword.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.auth.resetPassword(email.trim().toLowerCase(), code.trim(), newPassword);
      setStep('done');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.iconWrap}>
          <Ionicons name="lock-closed-outline" size={36} color="#2563EB" />
        </View>

        {step === 'done' ? (
          <>
            <Text style={styles.title}>Password Updated!</Text>
            <Text style={styles.sub}>Your password has been reset successfully. You can now log in.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/login')}>
              <Text style={styles.primaryBtnText}>Back to Login</Text>
            </TouchableOpacity>
          </>
        ) : step === 'email' ? (
          <>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.sub}>Enter your email and we'll generate a reset code for you.</Text>

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity style={[styles.primaryBtn, loading && { opacity: 0.6 }]} onPress={handleRequestCode} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Get Reset Code</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkBtn} onPress={() => router.back()}>
              <Text style={styles.linkText}>Back to Login</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>Enter Reset Code</Text>
            <Text style={styles.sub}>Enter the 6-digit code and your new password.</Text>

            <Text style={styles.label}>Reset Code</Text>
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={setCode}
              placeholder="6-digit code"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              maxLength={6}
            />

            <Text style={styles.label}>New Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Min. 6 characters"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repeat password"
              placeholderTextColor="#94A3B8"
              secureTextEntry={!showPassword}
            />

            <TouchableOpacity style={[styles.primaryBtn, loading && { opacity: 0.6 }]} onPress={handleResetPassword} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Reset Password</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkBtn} onPress={() => setStep('email')}>
              <Text style={styles.linkText}>Request a new code</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingTop: 16 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  iconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginVertical: 24,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginBottom: 8 },
  sub: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#0F172A', marginBottom: 16,
  },
  passwordRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10,
    paddingHorizontal: 14, marginBottom: 16,
  },
  passwordInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#0F172A' },
  eyeBtn: { padding: 4 },
  primaryBtn: {
    backgroundColor: '#2563EB', borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginTop: 4,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkBtn: { alignItems: 'center', paddingVertical: 14 },
  linkText: { color: '#2563EB', fontSize: 14, fontWeight: '600' },
});
