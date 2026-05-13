import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#0052CC',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#1A1A1A',
  mediumGray: '#666666',
  lightGray: '#F5F5F5',
  lightBg: '#F8F9FE',
  borderGray: '#E0E0E0',
  success: '#10B981',
  textSecondary: '#666666',
  textLight: '#999999',
};

const SVG_SNOWFLAKE = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22%3E%3Cdefs%3E%3ClinearGradient id=%22grad1%22 x1=%220%25%22 y1=%220%25%22 x2=%22100%25%22 y2=%22100%25%22%3E%3Cstop offset=%220%25%22 style=%22stop-color:%23E8F4F8;stop-opacity:1%22 /%3E%3Cstop offset=%22100%25%22 style=%22stop-color:%23B3D9E8;stop-opacity:1%22 /%3E%3C/linearGradient%3E%3C/defs%3E%3Cg stroke=%22%230052CC%22 stroke-width=%222%22 fill=%22none%22 stroke-linecap=%22round%22%3E%3Cline x1=%22100%22 y1=%2220%22 x2=%22100%22 y2=%22180%22/%3E%3Cline x1=%2220%22 y1=%22100%22 x2=%22180%22 y2=%22100%22/%3E%3Cline x1=%2250%22 y1=%2250%22 x2=%22150%22 y2=%22150%22/%3E%3Cline x1=%22150%22 y1=%2250%22 x2=%2250%22 y2=%22150%22/%3E%3Cline x1=%22100%22 y1=%2250%22 x2=%2285%22 y2=%2270%22/%3E%3Cline x1=%22100%22 y1=%2250%22 x2=%22115%22 y2=%2270%22/%3E%3Cline x1=%22100%22 y1=%22150%22 x2=%2285%22 y2=%22130%22/%3E%3Cline x1=%22100%22 y1=%22150%22 x2=%22115%22 y2=%22130%22/%3E%3Cline x1=%2250%22 y1=%22100%22 x2=%2270%22 y2=%2285%22/%3E%3Cline x1=%2250%22 y1=%22100%22 x2=%2270%22 y2=%22115%22/%3E%3Cline x1=%22150%22 y1=%22100%22 x2=%22130%22 y2=%2285%22/%3E%3Cline x1=%22150%22 y1=%22100%22 x2=%22130%22 y2=%22115%22/%3E%3Cline x1=%2275%22 y1=%2275%22 x2=%2265%22 y2=%2260%22/%3E%3Cline x1=%2275%22 y1=%2275%22 x2=%2290%22 y2=%2280%22/%3E%3Cline x1=%22125%22 y1=%22125%22 x2=%22135%22 y2=%22140%22/%3E%3Cline x1=%22125%22 y1=%22125%22 x2=%22110%22 y2=%22120%22/%3E%3Cline x1=%22125%22 y1=%2275%22 x2=%22135%22 y2=%2260%22/%3E%3Cline x1=%22125%22 y1=%2275%22 x2=%22110%22 y2=%2280%22/%3E%3Cline x1=%2275%22 y1=%22125%22 x2=%2260%22 y2=%22140%22/%3E%3Cline x1=%2275%22 y1=%22125%22 x2=%2280%22 y2=%22110%22/%3E%3Ccircle cx=%22100%22 cy=%22100%22 r=%226%22 fill=%22%230052CC%22 opacity=%220.8%22/%3E%3C/g%3E%3C/svg%3E';

const IconSnowflake = () => <Image source={{ uri: SVG_SNOWFLAKE }} style={{ width: 24, height: 24 }} />;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      const loggedInUser = await login(email, password);
      router.replace(loggedInUser.type === 'firm' ? '/(firm)/firm_dashboard' : '/(tabs)/intern_dashboard');
    } catch (error: any) {
      Alert.alert('Login Failed', error?.message || 'Please check your credentials and try again');
    }
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <IconSnowflake />
            </View>
            <Text style={styles.logo}>InternConnect</Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Please enter your details to sign in to your account.</Text>

          {/* Email Field */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="alex@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          {/* Password Field */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor={COLORS.textLight}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.eyeIcon}>{showPassword ? '👁' : '👁'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Remember Me & Forgot Password */}
          <View style={styles.optionsRow}>
            <TouchableOpacity 
              style={styles.rememberMeContainer}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.rememberMeText}>Remember me</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.forgotPassword}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity 
            style={[styles.loginButton, isLoading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Login →</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Buttons */}
          <View style={styles.socialButtons}>
            <TouchableOpacity style={styles.socialButton}>
              <Text style={[styles.socialButtonText, { color: '#4285F4' }]}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Text style={[styles.socialButtonText, { color: '#0A66C2' }]}>LinkedIn</Text>
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={styles.signUpLink}>Create an account</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerBrand}>InternConnect</Text>
            <Text style={styles.footerText}>© 2024 InternConnect. All rights reserved.</Text>
            <View style={styles.footerLinks}>
              <TouchableOpacity><Text style={styles.footerLink}>Privacy Policy</Text></TouchableOpacity>
              <Text style={styles.footerDot}>•</Text>
              <TouchableOpacity><Text style={styles.footerLink}>Terms of Service</Text></TouchableOpacity>
              <Text style={styles.footerDot}>•</Text>
              <TouchableOpacity><Text style={styles.footerLink}>Help Center</Text></TouchableOpacity>
              <Text style={styles.footerDot}>•</Text>
              <TouchableOpacity><Text style={styles.footerLink}>Contact Us</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGray,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  headerLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  content: {
    padding: 24,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8,
  },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    fontSize: 14,
    color: COLORS.black,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.black,
  },
  eyeIcon: {
    fontSize: 18,
    paddingHorizontal: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  rememberMeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  forgotPassword: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  loginButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.borderGray,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  socialButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    alignItems: 'center',
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  signUpText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  signUpLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderGray,
  },
  footerBrand: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: 8,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 12,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  footerLink: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  footerDot: {
    fontSize: 12,
    color: COLORS.borderGray,
  },
});
