import * as SecureStore from 'expo-secure-store';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { colors } from '@/constants/colors';

export default function Index() {
  const [target, setTarget] = useState<'/onboarding' | '/login' | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync('onboarding_done').then(done => {
      setTarget(done ? '/login' : '/onboarding');
    });
  }, []);

  if (!target) {
    return <View style={{ flex: 1, backgroundColor: colors.primary }} />;
  }

  return <Redirect href={target} />;
}
