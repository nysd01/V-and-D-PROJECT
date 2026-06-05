import React from 'react';
import { Stack } from 'expo-router';

export default function CompanyLayout(): React.JSX.Element {
  return <Stack screenOptions={{ headerShown: false }} />;
}
