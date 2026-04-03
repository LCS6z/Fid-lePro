import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard-client" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard-commercant" options={{ headerShown: false }} />
        <Stack.Screen name="inscription-client" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}