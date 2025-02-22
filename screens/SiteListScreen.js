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

              </View>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.statusContainer, { backgroundColor: colors.card }]}>
        <View style={styles.statusRow}>
          <View style={[styles.connectionStatus, { backgroundColor: isConnected ? '#4CAF50' : '#FF5252' }]} />
          <Text style={[styles.connectionText, { color: colors.text }]}>
            {isConnected ? '已连接' : '未连接'}
          </Text>
        </View>
        <Text style={[styles.lastUpdateText, { color: colors.text }]}>
          {lastUpdateTime ? `最后更新: ${lastUpdateTime.toLocaleString('zh-CN', { hour12: false })}` : '暂无更新'}
        </Text>
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
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionText: {
    marginLeft: 8,
    fontSize: 14,
  },
  lastUpdateText: {
    fontSize: 14,
    opacity: 0.8,
  },
  connectionStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 10
  },
  listContainer: {
    paddingBottom: 20,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  alarmCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF5252',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  siteName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  cardContent: {
    marginTop: 4,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contentColumn: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 14,
    opacity: 0.8,
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.6,
  }
});

// 只有一个默认导出
// 导出组件和样式
export { SiteListScreen as default, styles };