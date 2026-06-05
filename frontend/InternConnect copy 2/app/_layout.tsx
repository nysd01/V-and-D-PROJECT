import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/context/AuthContext';

export const unstable_settings = {
  anchor: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          {/* Tab screens */}
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(firm)" />
          <Stack.Screen name="(company)" />

          {/* Stack screens — pushed on top of tabs */}
          <Stack.Screen name="internship_detail" />
          <Stack.Screen name="apply" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="index" />

          {/* Modal screens */}
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>

        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}