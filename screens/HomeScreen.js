import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, Text, ImageBackground, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import * as Location from 'expo-location';
import ProfileScreen from './ProfileScreen';
import SiteListScreen from './SiteListScreen';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

const Tab = createBottomTabNavigator();

// 天气组件
const WeatherInfo = () => {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState('101010100');
  const [loading, setLoading] = useState(true);
  const [cityName, setCityName] = useState('');

  useEffect(() => {
    const getLocationPermission = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('需要位置权限来获取本地天气信息');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const locationInfo = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });

        if (locationInfo && locationInfo.length > 0) {
          const city = locationInfo[0].city || locationInfo[0].subregion || locationInfo[0].region || '北京';
          setCityName(city.replace(/(市|区|省)$/, ''));
          setLocation('101010100'); // 使用默认location ID，后续可以根据实际需求修改
        }
      } catch (error) {
        console.error('获取位置信息失败:', error);
        setCityName('北京');
        setError('获取位置信息失败，显示默认城市天气');
      }
    };

    getLocationPermission();
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      try {
        const API_KEY = '02cfe95fe68b42fe9985bcd568e9cfbd';
        const response = await axios.get(
          `https://devapi.qweather.com/v7/weather/now?location=${location}&key=${API_KEY}`,
          {
            headers: {
              'Accept': 'application/json'
            }
          }
        );

        if (response.data && response.data.code === '200') {
          const weatherData = response.data.now;
          setWeather({
            temp: weatherData.temp,
            text: weatherData.text,
            humidity: weatherData.humidity + '%',
            windSpeed: weatherData.windSpeed + 'km/h'
          });
          setError(null);
          setLoading(false);
        } else {
          setError('获取天气数据失败：' + response.data.code);
          setLoading(false);
        }
      } catch (error) {
        console.error('天气API请求失败:', error);
        if (error.response) {
          setError(`天气服务暂时不可用 (${error.response.status})`);
        } else if (error.request) {
          setError('网络连接失败，请检查网络设置');
        } else {
          setError('获取天气信息时出现错误，请稍后重试');
        }
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [location]);

  return (
    <View style={styles.weatherContainer}>
      {error ? (
        <Text style={[styles.weatherText, styles.errorText]}>{error}</Text>
      ) : loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : weather ? (
        <View style={styles.weatherContent}>
          <Text style={styles.cityName}>{cityName || '未知城市'}</Text>
          <View style={styles.weatherHeader}>
            <Ionicons name="cloud" size={40} color="#fff" />
            <Text style={styles.tempText}>{weather.temp}°C</Text>
          </View>
          <Text style={styles.weatherDesc}>{weather.text}</Text>
          <View style={styles.weatherDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="water" size={16} color="#fff" style={styles.detailIcon} />
              <Text style={styles.detailText}>湿度: {weather.humidity}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="speedometer" size={16} color="#fff" style={styles.detailIcon} />
              <Text style={styles.detailText}>风速: {weather.windSpeed}</Text>
            </View>
          </View>
        </View>
      ) : (
        <Text style={styles.weatherText}>正在获取天气信息...</Text>
      )}
    </View>
  );
};

// 主页面组件
const MainTab = () => {
  const navigation = useNavigation();
  return (
    <ImageBackground
      source={require('../assets/background.jpg')}
      style={styles.backgroundImage}
    >
      <ScrollView style={styles.scrollView}>
        <WeatherInfo />
        <View style={styles.navigationContainer}>
          <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('站点列表')}>
            <Ionicons name="list" size={40} color="#fff" />
            <Text style={styles.navButtonText}>站点列表</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('数据中心')}>
            <Ionicons name="analytics" size={40} color="#fff" />
            <Text style={styles.navButtonText}>数据中心</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('工具箱')}>
            <Ionicons name="construct" size={40} color="#fff" />
            <Text style={styles.navButtonText}>工具箱</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

// 设置组件
const SettingsTab = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>设置</Text>
    </View>
  );
};

const HomeScreen = () => {
  const { isDarkMode, colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === '主页') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === '个人中心') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === '设置') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: isDarkMode ? '#333' : '#e0e0e0',
        },
      })}
    >
      <Tab.Screen 
        name="主页" 
        component={MainTab} 
        options={{ 
          title: '正泽物联',
          headerStyle: {
            backgroundColor: colors.headerBackground,
            height: 100,
            elevation: 0,
            shadowOpacity: 0
          },
          headerTintColor: colors.headerText,
          headerTitleStyle: {
            fontWeight: 'bold'
          }
        }} 
      />
      <Tab.Screen 
        name="个人中心" 
        component={ProfileScreen} 
        options={{
          headerStyle: {
            backgroundColor: colors.headerBackground,
            height: 100,
            elevation: 0,
            shadowOpacity: 0
          },
          headerTintColor: colors.headerText,
          headerTitleStyle: {
            fontWeight: 'bold'
          }
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollView: {
    flex: 1,
  },
  weatherContainer: {
    padding: 10,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    margin: 25,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weatherContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tempText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  weatherDesc: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
  weatherDetails: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginLeft: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  detailText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 3,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    marginTop: 8,
  },
  detailIcon: {
    marginRight: 2,
  },
  weatherText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  cityName: {
    color: '#fff',
    fontSize: 14,
    marginRight: 5,
  },
  navigationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 20,
    marginTop: 1,
  },
  navButton: {
    backgroundColor: 'rgba(33, 150, 243, 0.8)',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    width: '48%',
    marginBottom: 15,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  text: {
    fontSize: 20,
    color: '#333',
  },
});

export default HomeScreen;