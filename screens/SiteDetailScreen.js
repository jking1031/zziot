import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, Modal, TextInput, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import useWebSocket, { WS_CONFIG } from '../hooks/useWebSocket';

function SiteDetailScreen({ route, navigation }) {
  const { colors, isDarkMode } = useTheme();
  const { siteId, siteName } = route.params;
  const [refreshing, setRefreshing] = useState(false);
  const [inData, setInData] = useState([]);
  const [outData, setOutData] = useState([]);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [devices, setDevices] = useState([]);
  const [deviceFrequency, setDeviceFrequency] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [newFrequency, setNewFrequency] = useState('');
  const [isValve, setIsValve] = useState([]);

  // 使用WebSocket连接
  const { isConnected, sendMessage } = useWebSocket(WS_CONFIG.siteDetailPath, siteId, (data) => {
    if (data) {
      if (data.indata) {
        setInData(data.indata);
        setLastUpdateTime(new Date());
      }
      if (data.outdata) {
        setOutData(data.outdata);
        setLastUpdateTime(new Date());
      }
      if (data.devices) {
        setDevices(data.devices);
      }
      if (data.deviceFrequency) {
        setDeviceFrequency(data.deviceFrequency);
      }
      if (data.isValve) {
        setIsValve(data.isValve);
      }
    }
  });

  useEffect(() => {
    // 设置导航标题
    navigation.setOptions({
      title: siteName || '站点详情'
    });

    // 发送初始化请求
    sendMessage({ type: 'getSiteDetail', siteId });

    return () => {
      // 组件卸载时，确保WebSocket连接被正确关闭
      // useWebSocket的cleanup会处理连接的关闭
      // manualDisconnectRef会被设置为true，防止重新连接
    };
  }, [navigation, siteId, siteName]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    sendMessage({ type: 'getSiteDetail', siteId });
    setRefreshing(false);
  }, [sendMessage, siteId]);

  const renderDataCard = (item, index) => (
    <View
      key={`${item.name}-${index}`}
      style={[
        styles.card,
        { backgroundColor: colors.card },
        item.alarm === 1 && styles.alarmCard
      ]}
    >
      <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
      <View style={styles.dataContainer}>
        <Text style={[styles.dataValue, { color: item.alarm === 1 ? '#FF5252' : colors.text }]}>
          {item.data.toFixed(2)}
        </Text>
        <Text style={[styles.dataUnit, { color: colors.text }]}>{item.dw}</Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196F3']}
            tintColor={colors.text}
          />
        }
      >
      <View style={styles.connectionStatusContainer}>
        <View style={[styles.connectionStatus, { backgroundColor: isConnected ? '#4CAF50' : '#FF5252' }]} />
        <Text style={[styles.connectionText, { color: colors.text }]}>
          {isConnected ? '已连接' : '未连接'}
        </Text>
        {lastUpdateTime && (
          <Text style={[styles.lastUpdateText, { color: colors.text }]}>
            最后更新：{lastUpdateTime.toLocaleString('zh-CN', { hour12: false })}
          </Text>
        )}
      </View>

      {inData.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>进水数据</Text>
          <View style={styles.cardGrid}>
            {inData.map(renderDataCard)}
          </View>
        </View>
      )}

      {outData.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>出水数据</Text>
          <View style={styles.cardGrid}>
            {outData.map(renderDataCard)}
          </View>
        </View>
      )}

      {deviceFrequency.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>设备频率</Text>
          <View style={styles.cardGrid}>
            {deviceFrequency.map((item) => (
              <TouchableOpacity
                key={item.name}
                style={[styles.card, { backgroundColor: colors.card }]}
                onPress={() => {
                  setSelectedDevice(item);
                  setNewFrequency(item.sethz?.toString() || '');
                  setModalVisible(true);
                }}
              >
                <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
                <View style={styles.dataContainer}>
                  <Text style={[styles.dataValue, { color: colors.text }]}>
                    {item.hz?.toFixed(2) || '0.00'}
                  </Text>
                  <Text style={[styles.dataUnit, { color: colors.text }]}>Hz</Text>
                </View>
                {item.sethz !== undefined && (
                  <Text style={[styles.frequencySetpoint, { color: colors.text }]}>
                    设定值: {item.sethz?.toFixed(2) || '0.00'} Hz
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {devices.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>设备控制</Text>
          <View style={styles.cardGrid}>
            {devices.map((device) => (
              <View
                key={device.name}
                style={[styles.card, { backgroundColor: colors.card }, device.fault === 1 && styles.alarmCard]}
              >
                <Text style={[styles.cardTitle, { color: colors.text }]}>{device.name}</Text>
                <View style={styles.deviceControlContainer}>
                  <View style={styles.statusContainer}>
                    <Text style={[styles.deviceStatus, { color: device.run ? '#4CAF50' : '#FF5252' }]}>
                      {device.run ? '运行中' : '已停止'}
                    </Text>
                    {device.fault === 1 && (
                      <Text style={styles.alarmStatus}>报警</Text>
                    )}
                  </View>
                  <View style={styles.controlButtonContainer}>
                    <Text
                      style={[styles.controlButton, { backgroundColor: device.run ? '#FF5252' : '#4CAF50' }]}
                      onPress={() => {
                        sendMessage({
                          type: 'deviceControl',
                          deviceName: device.name,
                          action: device.run ? 'stop' : 'start'
                        });
                      }}
                    >
                      {device.run ? '停止' : '启动'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
      {isValve.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>阀门控制</Text>
          <View style={styles.cardGrid}>
            {isValve.map((valve) => (
              <View
                key={valve.name}
                style={[styles.card, { backgroundColor: colors.card }, valve.fault === 1 && styles.alarmCard]}
              >
                <Text style={[styles.cardTitle, { color: colors.text }]}>{valve.name}</Text>
                <View style={styles.deviceControlContainer}>
                  <View style={styles.statusContainer}>
                    <Text style={[styles.deviceStatus, { color: valve.open ? '#4CAF50' : valve.close ? '#FF5252' : '#FFA000' }]}>
                      {valve.open ? '开到位' : valve.close ? '关到位' : '状态未知'}
                    </Text>
                    {valve.fault === 1 && (
                      <Text style={styles.alarmStatus}>故障</Text>
                    )}
                  </View>
                  <View style={styles.controlButtonContainer}>
                    <TouchableOpacity
                      onPress={() => {
                        sendMessage({
                          type: 'valveControl',
                          valveName: valve.name,
                          action: valve.open ? 'close' : 'open',
                          openKey: valve.openKey,
                          closeKey: valve.closeKey
                        });
                      }}
                      disabled={valve.fault === 1}
                    >
                      <Text
                        style={[
                          styles.controlButton,
                          { backgroundColor: valve.open ? '#FF5252' : '#4CAF50' },
                          valve.fault === 1 && { opacity: 0.5 }
                        ]}
                      >
                        {valve.open ? '关闭' : '开启'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
      </ScrollView>
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {selectedDevice?.name} - 频率设定
            </Text>
            <TextInput
              style={[styles.frequencyInput, { 
                borderColor: colors.border,
                backgroundColor: colors.background,
                color: colors.text
              }]}
              placeholder="请输入频率值"
              placeholderTextColor={colors.text}
              keyboardType="numeric"
              value={newFrequency}
              onChangeText={setNewFrequency}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => {
                  if (selectedDevice && newFrequency) {
                    sendMessage({
                      type: 'setFrequency',
                      deviceName: selectedDevice.name,
                      frequency: parseFloat(newFrequency)
                    });
                    setModalVisible(false);
                  }
                }}
              >
                <Text style={styles.modalButtonText}>确认</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  connectionStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  connectionStatus: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  connectionText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 'auto',
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#666666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.5,
    opacity: 0.9,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFFFFF',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.2,
    opacity: 0.9,
  },
  dataContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  dataValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 3,
    letterSpacing: 0.3,
  },
  dataUnit: {
    fontSize: 11,
    opacity: 0.8,
  },
  deviceControlContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  deviceStatus: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 6,
    letterSpacing: 0.2,
  },
  alarmStatus: {
    color: '#FF5252',
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: 'rgba(255, 82, 82, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  controlButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    overflow: 'hidden',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  frequencySetpoint: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.8,
    letterSpacing: 0.1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  frequencyInput: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#FF5252',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  modalButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default SiteDetailScreen;