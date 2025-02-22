import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import SiteListScreen from './screens/SiteListScreen';
import SiteDetailScreen from './screens/SiteDetailScreen';
import DataCenterScreen from './screens/DataCenterScreen';
import DataQueryScreen from './screens/DataQueryScreen';
import ReportScreen from './screens/ReportScreen';
import ReportFormScreen from './screens/ReportFormScreen';
import LabDataEntryScreen from './screens/LabDataEntryScreen';
import DataQueryCenterScreen from './screens/DataQueryCenterScreen';
import DataEntryCenter from './screens/DataEntryCenter';
import ReportQueryScreen from './screens/ReportQueryScreen';
import AODataEntryScreen from './screens/AODataEntryScreen';
import AODataQueryScreen from './screens/AODataQueryScreen';
import HistoryDataQueryScreen from './screens/HistoryDataQueryScreen';
import CarbonCalcScreen from './screens/CarbonCalcScreen';
import BoxScreen from './screens/BoxScreen';
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Login"
          screenOptions={{
            headerStyle: {
              backgroundColor: 'rgba(33, 150, 243, 0.8)',
              height: 65,
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 0
            },
            headerBackground: () => (
              <View style={{
                flex: 1,
                backgroundColor: 'rgba(33, 150, 243, 0.8)'
              }} />
            ),
            headerTitleContainerStyle: {
              paddingTop: 0,
              paddingBottom: 0
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 18
            },
          }}
        >
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ title: '登录' }}
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen} 
            options={{ title: '注册' }}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ 
              title: '主页',
              headerShown: false,
              headerLeft: null
            }}
          />
          <Stack.Screen
            name="站点列表"
            component={SiteListScreen}
            options={{ 
              title: '站点列表',
              headerShown: true
            }}
          />
          <Stack.Screen
            name="站点详情"
            component={SiteDetailScreen}
            options={{ 
              title: '站点详情',
              headerShown: true
            }}
          />
          <Stack.Screen
            name="数据中心"
            component={DataCenterScreen}
            options={{ 
              title: '数据中心',
              headerShown: true
            }}
          />
          <Stack.Screen
            name="历史数据查询"
            component={DataQueryScreen}
            options={{ 
              title: '历史数据查询',
              headerShown: true
            }}
          />
          <Stack.Screen
            name="碳源计算"
            component={CarbonCalcScreen}
            options={{ 
              title: '碳源投加量计算',
              headerShown: true
            }}
          />
          <Stack.Screen
            name="工具箱"
            component={BoxScreen}
            options={{
              title: '工具箱',
              headerShown: true
            }}
          />

         <Stack.Screen
            name="运行填报"
            component={ReportScreen}
            options={{ 
              title: '运行填报',
              headerShown: true
            }}
          />
          <Stack.Screen
            name="ReportForm"
            component={ReportFormScreen}
            options={{ 
              title: '填写报告',
              headerShown: true
            }}
          />
          <Stack.Screen
            name="化验数据填报"
            component={LabDataEntryScreen}
            options={{ 
              title: '化验数据填写',
              headerShown: true
            }}
          />
          <Stack.Screen
            name="AO池数据填报"
            component={AODataEntryScreen}
            options={{
              title: 'AO池数据填报',
              headerShown: true
            }}
          />
          <Stack.Screen
            name="数据查询中心"
            component={DataQueryCenterScreen}
            options={{
              title: '数据查询中心',
              headerShown: true
            }}
          />
          <Stack.Screen
            name="数据填报中心"
            component={DataEntryCenter}
            options={{
              title: '数据填报中心',
              headerShown: true
            }}
          />
          <Stack.Screen
            name="报告查询"
            component={ReportQueryScreen}
            options={{
              title: '报告查询',
              headerShown: true
            }}
          />

          <Stack.Screen
            name="AO池数据查询"
            component={AODataQueryScreen}
            options={{
              title: 'AO池数据查询',
              headerShown: true
            }}
          />
          <Stack.Screen
            name="数据查询"
            component={HistoryDataQueryScreen}
            options={{
              title: '数据查询',
              headerShown: true
            }}
          />
        </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </ThemeProvider>
  );
}
