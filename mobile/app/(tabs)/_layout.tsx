import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Platform } from 'react-native';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({
  name,
  color,
  size,
}: {
  name: IoniconsName;
  color: string;
  size: number;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mes cartes',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="card-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="qrcode"
        options={{
          title: 'Mon QR',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="qr-code-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="avis"
        options={{
          title: 'Avis',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="star-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
