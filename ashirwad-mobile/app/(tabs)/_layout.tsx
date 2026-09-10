import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { View, Platform, Text } from 'react-native';
import { useTheme } from '../../store/themeStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Radius } from '../../constants/Colors';

function TabIcon({ name, label, focused }: { name: any; label: string; focused: boolean }) {
  const { colors, isDark } = useTheme();

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', minWidth: 54, paddingTop: 4 }}>
      <View
        style={{
          width: 44,
          height: 30,
          borderRadius: Radius.full,
          backgroundColor: focused ? colors.accentGlow : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: focused ? (isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)') : 'transparent',
          marginBottom: 3,
        }}
      >
        <Feather
          name={name}
          size={19}
          color={focused ? colors.accentLight : colors.textMuted}
          strokeWidth={focused ? 2.4 : 1.8}
        />
      </View>
      <Text
        style={{
          fontSize: 10,
          fontWeight: focused ? '700' : '500',
          letterSpacing: 0.2,
          color: focused ? colors.accentLight : colors.textMuted,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 24 : 16);
  const tabBarHeight = 58 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: bottomInset + 2,
          paddingTop: 4,
          elevation: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.35 : 0.06,
          shadowRadius: 16,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name="grid" label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ focused }) => <TabIcon name="package" label="Products" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: 'Sales',
          tabBarIcon: ({ focused }) => <TabIcon name="trending-up" label="Sales" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="purchases"
        options={{
          title: 'Purchases',
          tabBarIcon: ({ focused }) => <TabIcon name="shopping-cart" label="Purchases" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ focused }) => <TabIcon name="more-horizontal" label="More" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

