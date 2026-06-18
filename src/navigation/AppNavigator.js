import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

import HomeScreen from '../screens/HomeScreen';
import MinhasOcorrenciasScreen from '../screens/MinhasOcorrenciasScreen';
import NovaOcorrenciaScreen from '../screens/NovaOcorrenciaScreen';
import PerfilScreen from '../screens/PerfilScreen';
import DetalheOcorrenciaScreen from '../screens/DetalheOcorrenciaScreen';
import GestaoUsuariosScreen from '../screens/admin/GestaoUsuariosScreen';
import DetalheUsuarioScreen from '../screens/admin/DetalheUsuarioScreen';
import CreditosScreen from '../screens/CreditosScreen';
import MeusDadosScreen from '../screens/MeusDadosScreen';
import AlterarSenhaScreen from '../screens/AlterarSenhaScreen';
import SuporteScreen from '../screens/SuporteScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom || 12 }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const isCenter = route.name === 'Nova Ocorrência';

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (isCenter) {
          return (
            <View key={route.key} style={styles.fabWrapper}>
              <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.85}>
                <Ionicons name="add" size={32} color="#fff" />
              </TouchableOpacity>
            </View>
          );
        }

        let iconName;
        if (route.name === 'Dashboard') iconName = isFocused ? 'home' : 'home-outline';
        else if (route.name === 'MinhasOcorrencias') iconName = isFocused ? 'list' : 'list-outline';
        else if (route.name === 'Perfil') iconName = isFocused ? 'person' : 'person-outline';

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={onPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name={iconName}
              size={24}
              color={isFocused ? '#EF1D26' : '#999999'}
            />
            <View style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {/* Label como linha ativa embaixo */}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" component={HomeScreen} />
      <Tab.Screen name="MinhasOcorrencias" component={MinhasOcorrenciasScreen} />
      <Tab.Screen name="Nova Ocorrência" component={NovaOcorrenciaScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F8F8' }}>
        <ActivityIndicator size="large" color="#EF1D26" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {usuario == null ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="DetalheOcorrencia"
            component={DetalheOcorrenciaScreen}
            options={{
              headerShown: true,
              title: 'Detalhes',
              headerBackTitleVisible: false,
              headerTintColor: '#EF1D26',
              headerShadowVisible: false,
              headerStyle: { backgroundColor: '#F8F8F8' },
            }}
          />
          <Stack.Screen
            name="GestaoUsuarios"
            component={GestaoUsuariosScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="DetalheUsuario"
            component={DetalheUsuarioScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Creditos"
            component={CreditosScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MeusDados"
            component={MeusDadosScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AlterarSenha"
            component={AlterarSenhaScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Suporte"
            component={SuporteScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  tabLabel: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  tabLabelActive: {
    backgroundColor: '#EF1D26',
  },
  fabWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: -28,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EF1D26',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#EF1D26',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});
