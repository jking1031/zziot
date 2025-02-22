import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import useWebSocket from '../hooks/useWebSocket';

// 导入WS_CONFIG配置
import { WS_CONFIG } from '../hooks/useWebSocket';

function SiteListScreen({ navigation }) {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [sites, setSites] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [hasRequestedInitialData, setHasRequestedInitialData] = useState(false);

  // 使用自定义Hook管理WebSocket连接
  const handleWebSocketMessage = useCallback((data) => {
    if (data.id && data.name) {
      // 更新单个站点数据
      setSites(prevSites => {
        const existingSiteIndex = prevSites.findIndex(site => site.id === data.id);
        if (existingSiteIndex >= 0) {
          // 更新现有站点
          const updatedSites = [...prevSites];
          updatedSites[existingSiteIndex] = {
            ...data,
            lastUpdate: new Date()
          };
          return updatedSites;
        } else {
          // 添加新站点
          return [...prevSites, { ...data, lastUpdate: new Date() }];
        }
      });
      setLastUpdateTime(new Date());
    }
  }, []);

  const { isConnected, sendMessage } = useWebSocket(WS_CONFIG.sitesPath, null, handleWebSocketMessage);

  // 连接成功后请求初始数据
  useEffect(() => {
    if (isConnected && !hasRequestedInitialData) {
      console.log('站点列表连接成功，请求初始数据');
      sendMessage({ type: 'refresh' });
      setHasRequestedInitialData(true);
    }
  }, [isConnected, sendMessage, hasRequestedInitialData]);

  // 刷新数据
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      sendMessage({ type: 'refresh' });
    } catch (error) {
      console.error('刷新站点数据失败:', error);
    } finally {
      setRefreshing(false);
    }
  }, [sendMessage]);

  // 渲染站点卡片
  const renderSiteCard = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('站点详情', { siteId: item.id, siteName: item.name })}
    >
      <View style={[
        styles.card,
        { backgroundColor: colors.card },
        item.alarm === "设施报警" && styles.alarmCard
      ]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.siteName, { color: colors.text }]}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: item.status === "在线" ? '#4CAF50' : '#FF5252' }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.contentRow}>
            <View style={styles.contentColumn}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.text }]}>地址：</Text>
                <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>{item.address}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.text }]}>处理量：</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{item.totalInflow}吨</Text>
              </View>
            </View>
            <View style={styles.contentColumn}>
              {item.alarm && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: item.alarm === "设施正常" ? '#4CAF50' : '#FF5252' }]}>状态：</Text>
                  <Text style={[styles.infoValue, { color: item.alarm === "设施正常" ? '#4CAF50' : '#FF5252' }]}>{item.alarm}</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.text }]}>更新：</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {item.lastUpdate ? item.lastUpdate.toLocaleTimeString() : '暂无更新'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <Ionicons name="search" size={20} color={colors.text} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholderTextColor={colors.text + '80'}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="搜索站点"
        />
        <View style={[styles.connectionStatus, { backgroundColor: isConnected ? '#4CAF50' : '#FF5252' }]} />
      </View>
      <FlatList
        data={sites}
        renderItem={renderSiteCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196F3']}
            tintColor={colors.text}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={64} color={colors.text + '80'} />
            <Text style={[styles.emptyText, { color: colors.text }]}>暂无站点数据</Text>
          </View>
        }
      />
    </View>
  );
};

// styles 应该与组件一起作为默认导出的一部分
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  listContainer: {
    flexGrow: 1,
  },
  card: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  alarmCard: {
    borderColor: '#FF5252',
    borderWidth: 2
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  siteName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardContent: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    width: 60,
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 10,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contentColumn: {
    flex: 1,
    marginHorizontal: 5,
  },
  connectionStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 10
  }
});

// 只有一个默认导出
// 导出组件和样式
export { SiteListScreen as default, styles };
