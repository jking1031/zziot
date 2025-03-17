import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, RefreshControl, Alert, Modal, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const MessageQueryScreen = () => {
  const { colors } = useTheme();
  const [messages, setMessages] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [isStartDate, setIsStartDate] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const tabs = [
    { id: 'all', label: '全部消息' },
    { id: 'alarm', label: '报警消息' },
    { id: 'warning', label: '预警消息' },
    { id: 'other', label: '其他消息' }
  ];

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hour}:${minute}`;
  };

  useEffect(() => {
    loadCachedMessages();
  }, []);

  const loadCachedMessages = async () => {
    try {
      const cachedData = await AsyncStorage.getItem('queriedMessages');
      if (cachedData) {
        const { messages: cachedMessages, timestamp } = JSON.parse(cachedData);
        // 检查缓存是否在24小时内
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          setMessages(cachedMessages);
          updatePagination(cachedMessages);
        }
      }
    } catch (error) {
      console.error('加载缓存消息失败:', error);
    }
  };

  const updatePagination = (messageList) => {
    setTotalPages(Math.ceil(messageList.length / itemsPerPage));
  };

  const fetchMessages = async () => {
    setRefreshing(true);
    // 为开始时间和结束时间增加8小时以适应时区差异
    const adjustedStartDate = new Date(startDate.getTime() + 8 * 60 * 60 * 1000);
    const adjustedEndDate = new Date(endDate.getTime() + 8 * 60 * 60 * 1000);
    
    try {
      const response = await axios.get('https://nodered.jzz77.cn:9003/api/messagesquery', {
        params: {
          startDate: adjustedStartDate.toISOString(),
          endDate: adjustedEndDate.toISOString(),
          type: activeTab === 'all' ? undefined : activeTab
        },
        timeout: 5000
      });
      
      console.log('API Response:', response.data); // 调试日志
      
      if (response.data) {
        let newMessages = [];
        if (Array.isArray(response.data)) {
          // 保持原始数组顺序
          newMessages = [...response.data];
        } else if (Array.isArray(response.data.messages)) {
          // 保持原始数组顺序
          newMessages = [...response.data.messages];
        } else {
          throw new Error('无效的响应数据格式');
        }
        
        console.log('处理后的消息数据:', newMessages); // 调试日志
        
        setMessages(newMessages);
        updatePagination(newMessages);
        setCurrentPage(1);
        
        // 缓存查询结果
        await AsyncStorage.setItem('queriedMessages', JSON.stringify({
          messages: newMessages,
          timestamp: Date.now()
        }));
      } else {
        throw new Error('未收到有效的响应数据');
      }
    } catch (error) {
      console.error('查询消息失败:', error);
      Alert.alert('错误', error.message || '查询消息失败，请稍后重试');
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    // 下拉刷新时使用当前的查询条件重新获取数据
    if (messages.length > 0) {
      fetchMessages();
    } else {
      setRefreshing(false);
    }
  }, [startDate, endDate, activeTab, messages.length]);

  const renderMessageItem = useCallback(({ item }) => (
    <TouchableOpacity 
      style={[styles.messageItem, { backgroundColor: colors.card }]}
    >
      <View style={styles.messageHeader}>
        <View style={styles.titleContainer}>
          <Ionicons 
            name={item.type === 'alarm' ? 'warning' : 'information-circle'} 
            size={24} 
            color={item.type === 'alarm' ? '#FF5252' : '#2196F3'} 
          />
          <Text style={[styles.messageTitle, { color: colors.text }]}>{item.title}</Text>
        </View>
        <Text style={[styles.messageTime, { color: colors.textSecondary }]}>
          {formatDate(new Date(item.timestamp))}
        </Text>
      </View>
      <Text style={[styles.messageContent, { color: colors.text }]}>{item.content}</Text>
    </TouchableOpacity>
  ), [colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.queryForm}>
        <View style={styles.dateContainer}>
          <TouchableOpacity 
            style={[styles.dateButton, { backgroundColor: colors.card }]}
            onPress={() => {
              setSelectedDate(startDate);
              setSelectedTime(startDate);
              setShowStartPicker(true);
            }}
          >
            <Text style={[styles.dateButtonText, { color: colors.text }]}>
              开始: {formatDate(startDate)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.dateButton, { backgroundColor: colors.card }]}
            onPress={() => {
              setSelectedDate(endDate);
              setSelectedTime(endDate);
              setShowEndPicker(true);
            }}
          >
            <Text style={[styles.dateButtonText, { color: colors.text }]}>
              结束: {formatDate(endDate)}
            </Text>
          </TouchableOpacity>
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={showStartPicker || showEndPicker}
          onRequestClose={() => {
            setShowStartPicker(false);
            setShowEndPicker(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalView, { backgroundColor: colors.card }]}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={() => {
                  setShowStartPicker(false);
                  setShowEndPicker(false);
                }}>
                  <Text style={[styles.closeButton, { color: colors.text }]}>关闭</Text>
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {showStartPicker ? '选择开始时间' : '选择结束时间'}
                </Text>
                <TouchableOpacity onPress={() => {
                  const finalDate = new Date(selectedDate);
                  finalDate.setHours(selectedTime.getHours());
                  finalDate.setMinutes(selectedTime.getMinutes());
                  if (showStartPicker) {
                    setStartDate(finalDate);
                    setShowStartPicker(false);
                  } else {
                    setEndDate(finalDate);
                    setShowEndPicker(false);
                  }
                }}>
                  <Text style={[styles.confirmButton, { color: colors.primary }]}>确定</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.dateTimeContainer}>
                <View style={styles.pickerContainer}>
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="spinner"
                    onChange={(event, date) => {
                      if (date) setSelectedDate(date);
                    }}
                    style={styles.picker}
                  />
                </View>
                <View style={styles.pickerContainer}>
                  <DateTimePicker
                    value={selectedTime}
                    mode="time"
                    display="spinner"
                    onChange={(event, time) => {
                      if (time) setSelectedTime(time);
                    }}
                    style={styles.picker}
                  />
                </View>
              </View>
            </View>
          </View>
        </Modal>

        <View style={[styles.tabContainer, { backgroundColor: colors.card }]}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.activeTab]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === tab.id ? colors.primary : colors.textSecondary }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.queryButton, { backgroundColor: colors.primary }]}
          onPress={fetchMessages}
        >
          <Text style={styles.queryButtonText}>查询</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={messages
          // 保持原始数组顺序，只根据tab和分页进行过滤
          .slice()
          .filter(message => activeTab === 'all' ? true : message.type === activeTab)
          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.text}
          />
        }
        contentContainerStyle={styles.listContainer}
        ListFooterComponent={
          messages.filter(message => activeTab === 'all' ? true : message.type === activeTab).length > itemsPerPage ? (
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                onPress={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <Text style={styles.paginationButtonText}>上一页</Text>
              </TouchableOpacity>
              <Text style={[styles.paginationText, { color: colors.text }]}>
                {currentPage} / {totalPages}
              </Text>
              <TouchableOpacity
                style={[styles.paginationButton, currentPage >= totalPages && styles.paginationButtonDisabled]}
                onPress={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage >= totalPages}
              >
                <Text style={styles.paginationButtonText}>下一页</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  paginationButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  paginationButtonDisabled: {
    backgroundColor: '#ccc',
  },
  paginationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  paginationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  container: {
    flex: 1,
  },
  queryForm: {
    padding: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  dateButtonText: {
    fontSize: 14,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    marginBottom: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: 'rgba(33, 150, 243, 0.15)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  queryButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  queryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  messageItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  messageTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  messageTime: {
    fontSize: 12,
  },
  messageContent: {
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: '90%',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateTimeContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  pickerContainer: {
    width: '100%',
    backgroundColor: 'transparent',
    marginVertical: 8,
  },
  picker: {
    width: '100%',
    height: 200,
  },
});

export default MessageQueryScreen;