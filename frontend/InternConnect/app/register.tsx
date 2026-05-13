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
  mediumGray: '#666666',
  borderGray: '#E0E0E0',
  textLight: '#999999',
};

const SVG_SNOWFLAKE = 'data:image/svg+xml,...'; // keep yours

const IconSnowflake = () => (
  <Image source={{ uri: SVG_SNOWFLAKE }} style={{ width: 24, height: 24 }} />
);

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuth();

  const [userType, setUserType] = useState(null);

  // Intern fields
  const [fullName, setFullName] = useState('');
  const [university, setUniversity] = useState('');

  // Firm fields
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [address, setAddress] = useState('');

  // Shared
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleCreateAccount = async () => {
    if (!userType) {
      Alert.alert('Error', 'Please select if you are an Intern or Firm');
      return;
    }

    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    if (userType === 'intern' && !fullName) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    if (userType === 'firm' && !companyName) {
      Alert.alert('Error', 'Please enter company name');
      return;
    }

    try {
      const createdUser = await register({
        userType,
        email,
        password,
        fullName: userType === 'intern' ? fullName : undefined,
        university: userType === 'intern' ? university : undefined,
        companyName: userType === 'firm' ? companyName : undefined,
        industry: userType === 'firm' ? industry : undefined,
        address: userType === 'firm' ? address : undefined,
      });

      router.replace(createdUser.type === 'firm' ? '/(firm)/firm_dashboard' : '/(tabs)/intern_dashboard');
    } catch (error: any) {
      Alert.alert('Registration Failed', error?.message || 'Please try again');
    }
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container}>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <IconSnowflake />
            <Text style={styles.logo}>InternConnect</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Get Started</Text>

          {/* ROLE SWITCH */}
          <View style={styles.roleButtons}>
            <TouchableOpacity
              style={[styles.roleButton, userType === 'intern' && styles.active]}
              onPress={() => setUserType('intern')}
            >
              <Text style={userType === 'intern' ? styles.activeText : styles.text}>
                Intern
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleButton, userType === 'firm' && styles.active]}
              onPress={() => setUserType('firm')}
            >
              <Text style={userType === 'firm' ? styles.activeText : styles.text}>
                Firm
              </Text>
            </TouchableOpacity>
          </View>

          {/* ================= INTERN FORM ================= */}
          {userType === 'intern' && (
            <>
              <Input label="Full Name" value={fullName} setValue={setFullName} placeholder="John Doe" />
              <Input label="Email" value={email} setValue={setEmail} placeholder="john@email.com" />
              <Input label="University" value={university} setValue={setUniversity} placeholder="University Name" />
              <Input label="Password" value={password} setValue={setPassword} placeholder="••••••" secure />
            </>
          )}

          {/* ================= FIRM FORM ================= */}
          {userType === 'firm' && (
            <>
              <Input label="Company Name" value={companyName} setValue={setCompanyName} placeholder="Tech Corp Ltd" />
              <Input label="Email" value={email} setValue={setEmail} placeholder="company@email.com" />
              <Input label="Industry" value={industry} setValue={setIndustry} placeholder="Software / Finance / etc" />
              <Input label="Company Address" value={address} setValue={setAddress} placeholder="City, Country" />
              <Input label="Password" value={password} setValue={setPassword} placeholder="••••••" secure />
            </>
          )}

          {/* BUTTON */}
          <TouchableOpacity 
            style={[styles.createButton, isLoading && { opacity: 0.6 }]}
            onPress={handleCreateAccount}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.createText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* LOGIN */}
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={{ textAlign: 'center', marginTop: 15 }}>
              Already have an account? <Text style={{ color: COLORS.primary }}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

/* 🔹 Reusable Input Component */
const Input = ({ label, value, setValue, placeholder, secure }) => (
  <View style={{ marginBottom: 15 }}>
    <Text style={{ marginBottom: 5 }}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={setValue}
      placeholder={placeholder}
      secureTextEntry={secure}
      placeholderTextColor="#999"
    />
  </View>
);

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fff' },

  container: { flex: 1 },

  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },

  logo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },

  content: {
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  roleButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },

  roleButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    alignItems: 'center',
  },

  active: {
    backgroundColor: '#E8F0FF',
    borderColor: COLORS.primary,
  },

  text: {
    color: '#666',
  },

  activeText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
  },

  createButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },

  createText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});