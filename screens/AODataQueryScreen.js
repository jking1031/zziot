import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';
import { Dimensions } from 'react-native';

const AODataQueryScreen = () => {
  const { isDarkMode, colors } = useTheme();
  const [selectedAO, setSelectedAO] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aoData, setAoData] = useState([]);
  const [showAOPicker, setShowAOPicker] = useState(false);


  const poolConfigs = {
    '1#AO池': [
      { name: '厌氧池', key: 'anaerobic' },
      { name: '第一好氧池', key: 'aerobic_1' },
      { name: '第一缺氧池a', key: 'anoxic_1a' },
      { name: '第一缺氧池b', key: 'anoxic_1b' },
      { name: '第二好氧池', key: 'aerobic_2' },
      { name: '第二缺氧池a', key: 'anoxic_2a' },
      { name: '第二缺氧池b', key: 'anoxic_2b' },
      { name: '第三好氧池', key: 'aerobic_3' },
      { name: '第三缺氧池a', key: 'anoxic_3a' },
      { name: '第三缺氧池b', key: 'anoxic_3b' },
      { name: '第四好氧池', key: 'aerobic_4' }
    ],
    '2#AO池': [
      { name: '厌氧池', key: 'anaerobic' },
      { name: '第一好氧池', key: 'aerobic_1' },
      { name: '第一缺氧池a', key: 'anoxic_1a' },
      { name: '第一缺氧池b', key: 'anoxic_1b' },
      { name: '第二好氧池', key: 'aerobic_2' },
      { name: '第二缺氧池a', key: 'anoxic_2a' },
      { name: '第二缺氧池b', key: 'anoxic_2b' },
      { name: '第三好氧池', key: 'aerobic_3' },
      { name: '第三缺氧池a', key: 'anoxic_3a' },
      { name: '第三缺氧池b', key: 'anoxic_3b' },
      { name: '第四好氧池', key: 'aerobic_4' }
    ],
    '3#AO池': [
      { name: '厌氧池', key: 'anaerobic' },
      { name: '第一好氧池a', key: 'aerobic_1a' },
      { name: '第一好氧池b', key: 'aerobic_1b' },
      { name: '第一缺氧池a', key: 'anoxic_1a' },
      { name: '第一缺氧池b', key: 'anoxic_1b' },
      { name: '第二好氧池a', key: 'aerobic_2a' },
      { name: '第二好氧池b', key: 'aerobic_2b' },
      { name: '第二缺氧池a', key: 'anoxic_2a' },
      { name: '第二缺氧池b', key: 'anoxic_2b' },
      { name: '第三好氧池a', key: 'aerobic_3a' },
      { name: '第三好氧池b', key: 'aerobic_3b' },
      { name: '第三缺氧池a', key: 'anoxic_3a' },
      { name: '第三缺氧池b', key: 'anoxic_3b' },
      { name: '第四好氧池a', key: 'aerobic_4a' },
      { name: '第四好氧池b', key: 'aerobic_4b' }
    ]
  };

  const aoOptions = Object.keys(poolConfigs);

  const onStartDateChange = (event, selectedDate) => {
    setShowStartPicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const onEndDateChange = (event, selectedDate) => {
    setShowEndPicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const fetchAOData = async () => {
    if (!selectedAO || !startDate || !endDate) {
      alert('请填写完整查询条件');
      return;
    }

    setLoading(true);
    try {
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      const response = await fetch(
        `http://112.28.56.235:13100/api/sub-pools?aoName=${encodeURIComponent(selectedAO)}&startDate=${formattedStartDate}&endDate=${formattedEndDate}`
      );
      
      if (!response.ok) {
        throw new Error('数据获取失败');
      }
      
      const data = await response.json();
      
      // 获取当前选中AO池的配置
      const currentConfig = poolConfigs[selectedAO] || [];
      if (currentConfig.length === 0) {
        throw new Error('未找到对应的AO池配置');
      }

      // 创建映射关系
      const poolMapping = {};
      currentConfig.forEach(pool => {
        poolMapping[pool.name] = pool.key;
      });

      // 按日期分组数据
      const groupedData = {};
      data.forEach(record => {
        const date = record.submit_time.split('T')[0];
        if (!groupedData[date]) {
          groupedData[date] = {
            date: date,
            values: {}
          };
          // 初始化所有子池的值为0
          currentConfig.forEach(pool => {
            groupedData[date].values[pool.key] = 0;
          });
        }

        // 根据poolName更新对应的数值
        const columnKey = poolMapping[record.poolName];
        if (columnKey) {
          groupedData[date].values[columnKey] = parseFloat(record.doValue);
        }
      });

      // 转换为数组格式
      const formattedData = Object.values(groupedData)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(item => ({
          date: item.date,
          values: currentConfig.map(pool => item.values[pool.key] || 0)
        }));

      setAoData(formattedData);
    } catch (error) {
      console.error('数据获取失败:', error);
      alert('数据获取失败，请重试');
    } finally {
      setLoading(false);
    }
  };



  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.queryForm}>
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>选择AO池</Text>
          <TouchableOpacity
            style={[styles.aoButton, { backgroundColor: colors.card }]}
            onPress={() => setShowAOPicker(true)}
          >
            <Text style={[styles.aoButtonText, { color: colors.text }]}>
              {selectedAO || '请选择AO池'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dateContainer}>
          <View style={[styles.dateGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={[styles.label, { color: colors.text }]}>开始日期</Text>
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: colors.card }]}
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={[styles.dateButtonText, { color: colors.text }]}>
                {startDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                onChange={onStartDateChange}
              />
            )}
          </View>

          <View style={[styles.dateGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={[styles.label, { color: colors.text }]}>结束日期</Text>
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: colors.card }]}
              onPress={() => setShowEndPicker(true)}
            >
              <Text style={[styles.dateButtonText, { color: colors.text }]}>
                {endDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                onChange={onEndDateChange}
              />
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.queryButton, { backgroundColor: colors.primary }]}
          onPress={fetchAOData}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.queryButtonText}>查询</Text>
          )}
        </TouchableOpacity>
      </View>



      <Modal
        animationType="slide"
        transparent={true}
        visible={showAOPicker}
        onRequestClose={() => setShowAOPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalView, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>选择AO池</Text>
            <View style={styles.sampleButtonsGrid}>
              {aoOptions.map((ao) => (
                <TouchableOpacity
                  key={ao}
                  style={[styles.sampleButton, { borderColor: colors.border }]}
                  onPress={() => {
                    setSelectedAO(ao);
                    setShowAOPicker(false);
                  }}
                >
                  <Text style={[styles.sampleButtonText, { color: colors.text }]}>{ao}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowAOPicker(false)}
              >
                <Text style={styles.modalButtonText}>取消</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>



      {aoData.length > 0 && (
        <ScrollView horizontal>
          <View style={styles.tableContainer}>
            <View style={[styles.tableHeader, { backgroundColor: colors.primary }]}>
              <Text style={[styles.headerCell, styles.dateCell]}>日期</Text>
              {poolConfigs[selectedAO]?.map((pool) => (
                <Text key={pool.key} style={[styles.headerCell, styles.valueCell]}>{pool.name}</Text>
              ))}
            </View>
            {aoData.map((data, index) => (
              <View
                key={data.date}
                style={[styles.tableRow, { backgroundColor: colors.card }]}
              >
                <Text style={[styles.cell, styles.dateCell, { color: colors.text }]}>{data.date}</Text>
                {data.values.map((value, i) => (
                  <Text key={i} style={[styles.cell, styles.valueCell, { color: colors.text }]}>{value.toFixed(2)}</Text>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  queryForm: {
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dateGroup: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  aoButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  aoButtonText: {
    fontSize: 16,
  },
  dateButton: {
    padding: 12,
    borderRadius: 8,
  },
  dateButtonText: {
    fontSize: 16,
  },
  queryButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  queryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: '80%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  sampleButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sampleButton: {
    width: '48%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  sampleButtonText: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    marginHorizontal: 8,
  },
  modalButtonCancel: {
    backgroundColor: '#FF6B6B',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  tableContainer: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
  },
  tableRow: {
    flexDirection: 'row',
  },
  headerCell: {
    padding: 12,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  cell: {
    padding: 12,
    textAlign: 'center',
    fontSize: 16
  },
  dateCell: {
    width: 120,
  },
  valueCell: {
    width: 100,
  },

  tableContainer: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
  },
  tableRow: {
    flexDirection: 'row',
  },
  headerCell: {
    padding: 12,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  cell: {
    padding: 12,
    textAlign: 'center',
    fontSize: 16
  },
  dateCell: {
    width: 120,
  },
  valueCell: {
    width: 100,
  },
});

export default AODataQueryScreen;