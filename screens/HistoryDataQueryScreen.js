import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const HistoryDataQueryScreen = () => {
  const { isDarkMode, colors } = useTheme();
  const [selectedTable, setSelectedTable] = useState('leiji');
  const [queryType, setQueryType] = useState('raw');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDate, setShowStartDate] = useState(false);
  const [showStartTime, setShowStartTime] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [showEndTime, setShowEndTime] = useState(false);
  const [queryResults, setQueryResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [columnMappings, setColumnMappings] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [currentSelectType, setCurrentSelectType] = useState(null);
  const [dataInterval, setDataInterval] = useState('5');

  const handleIntervalChange = (value) => {
    setDataInterval(value);
  };

  const tableOptions = [
    { label: '各设施处理量', value: 'leiji' },
    { label: '高铁厂运行数据', value: 'gt_data' },
    { label: '5000吨运行数据', value: 'yj_5000' },
    { label: '化验数据', value: 'huayan_data' },
  ];

  const queryTypeOptions = [
    { label: '实时数据', value: 'raw' },
  ];

  const intervalOptions = [
    { label: '5分钟', value: '5' },
    { label: '30分钟', value: '30' },
    { label: '60分钟', value: '60' }
  ];

  const onDateChange = (event, selectedDate, type) => {
    if (event.type === 'dismissed') {
      setShowStartDate(false);
      setShowStartTime(false);
      setShowEndDate(false);
      setShowEndTime(false);
      return;
    }

    const currentDate = selectedDate || (type.startsWith('start') ? startDate : endDate);

    if (type === 'startDate') {
      setStartDate(currentDate);
      setShowStartDate(false);
    } else if (type === 'startTime') {
      const newDate = new Date(startDate);
      newDate.setHours(currentDate.getHours());
      newDate.setMinutes(currentDate.getMinutes());
      setStartDate(newDate);
      setShowStartTime(false);
    } else if (type === 'endDate') {
      setEndDate(currentDate);
      setShowEndDate(false);
    } else if (type === 'endTime') {
      const newDate = new Date(endDate);
      newDate.setHours(currentDate.getHours());
      newDate.setMinutes(currentDate.getMinutes());
      setEndDate(newDate);
      setShowEndTime(false);
    }
  };

  useEffect(() => {
    const loadMappings = async () => {
      try {
        const mappings = require('./columnMappings.json');
        setColumnMappings(mappings);
      } catch (error) {
        Alert.alert('错误', '加载列映射配置失败');
        console.error('Error loading mappings:', error);
      }
    };
    loadMappings();
  }, []);

  const handleQuery = async () => {
    try {
      // 为开始时间和结束时间增加8小时以适应时区差异
      const adjustedStartDate = new Date(startDate.getTime() + 8 * 60 * 60 * 1000);
      const adjustedEndDate = new Date(endDate.getTime() + 8 * 60 * 60 * 1000);

      const response = await fetch('http://112.28.56.235:13100/query', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dbName: 'nodered',
          tableName: selectedTable,
          queryType: queryType,
          startDate: adjustedStartDate.toISOString(),
          endDate: adjustedEndDate.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('网络请求失败');
      }

      const data = await response.json();
      const filteredData = filterDataByInterval(data);
      setQueryResults(filteredData);
      setCurrentPage(1);
    } catch (error) {
      Alert.alert('错误', error.message);
    }
  };

  const filterDataByInterval = (data) => {
    const intervalMinutes = parseInt(dataInterval);
    const intervalMilliseconds = intervalMinutes * 60 * 1000;
    const filteredData = [];
    let lastTime = null;

    data.forEach(row => {
      const rowTime = new Date(row.time);
      if (!lastTime || (rowTime - lastTime) >= intervalMilliseconds) {
        filteredData.push(row);
        lastTime = rowTime;
      }
    });

    return filteredData;
  };

  const renderTableHeader = () => {
    if (queryResults.length === 0) return null;
    const mappings = columnMappings[selectedTable] || {};

    return (
      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, styles.timeCell]}>时间</Text>
        {Object.keys(mappings).map(key => {
          if (key !== 'time') {
            return (
              <Text key={key} style={styles.headerCell}>
                {mappings[key]}
              </Text>
            );
          }
          return null;
        })}
      </View>
    );
  };

  const renderTableData = () => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const pageData = queryResults.slice(startIndex, endIndex);

    return pageData.map((row, index) => (
      <View key={index} style={[styles.tableRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
        <Text style={[styles.cell, styles.timeCell]}>
          {new Date(row.time).toLocaleString('zh-CN', { hour12: false })}
        </Text>
        {Object.keys(columnMappings[selectedTable] || {}).map(key => {
          if (key !== 'time') {
            return (
              <Text key={key} style={styles.cell}>
                {typeof row[key] === 'number' ? row[key].toFixed(2) : row[key]}
              </Text>
            );
          }
          return null;
        })}
      </View>
    ));
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < Math.ceil(queryResults.length / rowsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const pickerSelectStyles = {
    inputIOS: {
      fontSize: 14,
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      color: colors.text,
      backgroundColor: colors.card,
      paddingRight: 30,
      marginBottom: 8,
      minHeight: 45
    },
    inputAndroid: {
      fontSize: 14,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      color: colors.text,
      backgroundColor: colors.card,
      paddingRight: 30,
      marginBottom: 8,
      minHeight: 45
    },
    iconContainer: {
      top: 12,
      right: 10,
    },
    placeholder: {
      color: colors.text,
      fontSize: 14
    }
  };

  const renderModal = () => {
    const getOptions = () => {
      switch (currentSelectType) {
        case 'table':
          return tableOptions;
        case 'queryType':
          return queryTypeOptions;
        case 'interval':
          return intervalOptions;
        default:
          return [];
      }
    };

    const handleSelect = (value) => {
      switch (currentSelectType) {
        case 'table':
          setSelectedTable(value);
          break;
        case 'queryType':
          setQueryType(value);
          break;
        case 'interval':
          setDataInterval(value);
          break;
      }
      setModalVisible(false);
    };

    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>
              {currentSelectType === 'table' ? '选择查询内容' :
               currentSelectType === 'queryType' ? '选择查询方式' :
               currentSelectType === 'interval' ? '选择数据间隔' : ''}
            </Text>
            <View style={styles.optionsContainer}>
              {getOptions().map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    (currentSelectType === 'table' && selectedTable === option.value) ||
                    (currentSelectType === 'queryType' && queryType === option.value) ||
                    (currentSelectType === 'interval' && dataInterval === option.value)
                      ? styles.optionButtonSelected
                      : null
                  ]}
                  onPress={() => handleSelect(option.value)}
                >
                  <Text style={[
                    styles.optionButtonText,
                    (currentSelectType === 'table' && selectedTable === option.value) ||
                    (currentSelectType === 'queryType' && queryType === option.value) ||
                    (currentSelectType === 'interval' && dataInterval === option.value)
                      ? styles.optionButtonTextSelected
                      : null
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const styles = StyleSheet.create({
    rowContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 12
    },
    displayBox: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12
    },
    displayText: {
      color: colors.text,
      fontSize: 14
    },
    selectButton: {
      backgroundColor: colors.primary,
      padding: 12,
      borderRadius: 8,
      minWidth: 80,
      alignItems: 'center'
    },
    tableContainer: {
      backgroundColor: colors.card,
      borderRadius: 12,
      overflow: 'hidden',
      marginTop: 16,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 8,
    },
    headerCell: {
      color: colors.white,
      fontSize: 14,
      fontWeight: '600',
      width: 120,
      textAlign: 'center',
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    evenRow: {
      backgroundColor: colors.card,
    },
    oddRow: {
      backgroundColor: colors.background,
    },
    cell: {
      color: colors.text,
      fontSize: 14,
      width: 120,
      textAlign: 'center',
    },
    timeCell: {
      width: 180,
    },
    paginationContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 16,
      backgroundColor: colors.card,
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    paginationButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
      marginHorizontal: 8,
    },
    paginationButtonDisabled: {
      backgroundColor: colors.border,
    },
    paginationButtonText: {
      color: colors.white,
      fontSize: 14,
      fontWeight: '500',
    },
    paginationInfo: {
      padding: 12,
      backgroundColor: colors.card,
      alignItems: 'center',
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 16,
    },
    queryCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    queryScrollView: {
      maxHeight: 400,
    },
    section: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      marginBottom: 8,
      color: colors.text,
      fontWeight: '500',
    },
    timeRangeContainer: {
      marginBottom: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12
    },
    timeInput: {
      flex: 1,
      flexDirection: 'column',
      gap: 8
    },
    timeLabel: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 4
    },
    dateButton: {
      flex: 1,
      backgroundColor: colors.card,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center'
    },
    dateButtonText: {
      color: colors.text,
      fontSize: 14,
      textAlign: 'center'
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
      gap: 12,
    },
    button: {
      flex: 1,
      backgroundColor: colors.primary,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    buttonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalView: {
      width: '100%',
      backgroundColor: colors.background,
      borderRadius: 12,
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
      color: colors.text,
    },
    optionsContainer: {
      marginBottom: 20,
    },
    optionButton: {
      backgroundColor: colors.card,
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    optionButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    optionButtonText: {
      color: colors.text,
      fontSize: 14,
      textAlign: 'center',
    },
    optionButtonTextSelected: {
      color: colors.white,
      fontWeight: '500',
    },
    modalButton: {
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    modalButtonCancel: {
      backgroundColor: colors.border,
    },
    modalButtonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '500',
    },
    selectButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.card,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 8,
    },
    selectButtonText: {
      flex: 1,
      color: colors.text,
      fontSize: 14,
    },
    selectButtonIcon: {
      marginLeft: 8,
      color: colors.text,
    },
    buttonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '600',
    },
    modalButton: {
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    modalButtonCancel: {
      backgroundColor: colors.border,
    },
    modalButtonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '500',
    },
  });

  const handleExportAndShare = async () => {
    try {
      if (queryResults.length === 0) {
        Alert.alert('提示', '没有可导出的数据');
        return;
      }

      // 根据选择的时间间隔过滤数据
      const dataToExport = filterDataByInterval(queryResults);

      // 准备Excel数据
      const mappings = columnMappings[selectedTable] || {};
      const ws = XLSX.utils.json_to_sheet(dataToExport.map(row => {
        const formattedRow = {};
        formattedRow['时间'] = new Date(row.time).toLocaleString('zh-CN', { hour12: false });
        Object.keys(mappings).forEach(key => {
          if (key !== 'time') {
            formattedRow[mappings[key]] = typeof row[key] === 'number' ? row[key].toFixed(2) : row[key];
          }
        });
        return formattedRow;
      }));

      // 创建工作簿
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '历史数据查询结果');

      // 生成Excel文件
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const fileName = `历史数据_${new Date().getTime()}.xlsx`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      // 保存文件
      await FileSystem.writeAsStringAsync(filePath, wbout, {
        encoding: FileSystem.EncodingType.Base64
      });

      // 分享文件
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: '分享数据文件'
      });

      // 删除临时文件
      await FileSystem.deleteAsync(filePath);
    } catch (error) {
      console.error('导出分享失败:', error);
      Alert.alert('错误', '导出分享失败: ' + error.message);
    }
  };

  return (
    <ScrollView>
      <View style={styles.container}>
        <View style={styles.queryCard}>
          <ScrollView style={styles.queryScrollView}>
            {renderModal()}
          {/* 查询内容选择 */}
          <View style={styles.rowContainer}>
            <View style={styles.displayBox}>
              <Text style={styles.displayText}>
                {tableOptions.find(option => option.value === selectedTable)?.label || '请选择查询内容'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => {
                setCurrentSelectType('table');
                setModalVisible(true);
              }}
            >
              <Text style={styles.buttonText}>选择</Text>
            </TouchableOpacity>
          </View>

          {/* 查询方式选择 */}
          <View style={styles.rowContainer}>
            <View style={styles.displayBox}>
              <Text style={styles.displayText}>
                {queryTypeOptions.find(option => option.value === queryType)?.label || '请选择查询方式'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => {
                setCurrentSelectType('queryType');
                setModalVisible(true);
              }}
            >
              <Text style={styles.buttonText}>选择</Text>
            </TouchableOpacity>
          </View>

          {/* 间隔时间选择 */}
          <View style={styles.rowContainer}>
            <View style={styles.displayBox}>
              <Text style={styles.displayText}>
                {intervalOptions.find(option => option.value === dataInterval)?.label || '请选择间隔时间'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => {
                setCurrentSelectType('interval');
                setModalVisible(true);
              }}
            >
              <Text style={styles.buttonText}>选择</Text>
            </TouchableOpacity>
          </View>

          {/* 时间范围选择 */}
          <View style={styles.timeRangeContainer}>
            <View style={styles.timeInput}>
              <Text style={styles.timeLabel}>开始时间</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowStartDate(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {startDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowStartTime(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {startDate.toLocaleTimeString()}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.timeInput}>
              <Text style={styles.timeLabel}>结束时间</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowEndDate(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {endDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowEndTime(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {endDate.toLocaleTimeString()}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

            

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={handleQuery}>
                <Text style={styles.buttonText}>查询</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleExportAndShare}>
                <Text style={styles.buttonText}>导出分享</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {queryResults.length > 0 && (
          <ScrollView style={styles.dataContainer}>
            <View>
              <View style={styles.paginationInfo}>
                <Text>总记录数: {queryResults.length} | 当前页: {currentPage} / {Math.ceil(queryResults.length / rowsPerPage)}</Text>
              </View>
              <View style={styles.tableContainer}>
                <ScrollView horizontal>
                  <View>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.headerCell, styles.timeCell]}>时间</Text>
                      {Object.keys(columnMappings[selectedTable] || {}).map(key => {
                        if (key !== 'time') {
                          return (
                            <Text key={key} style={styles.headerCell}>
                              {columnMappings[selectedTable][key]}
                            </Text>
                          );
                        }
                        return null;
                      })}
                    </View>
                    <ScrollView style={styles.tableBody}>
                      {queryResults.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((row, index) => (
                        <View key={index} style={[styles.tableRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
                          <Text style={[styles.cell, styles.timeCell]}>
                            {new Date(row.time).toLocaleString('zh-CN', { hour12: false })}
                          </Text>
                          {Object.keys(columnMappings[selectedTable] || {}).map(key => {
                            if (key !== 'time') {
                              return (
                                <Text key={key} style={styles.cell}>
                                  {typeof row[key] === 'number' ? row[key].toFixed(2) : row[key]}
                                </Text>
                              );
                            }
                            return null;
                          })}
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                </ScrollView>
                <View style={styles.paginationContainer}>
                  <TouchableOpacity
                    style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                    onPress={handlePrevPage}
                    disabled={currentPage === 1}
                  >
                    <Text style={styles.paginationButtonText}>上一页</Text>
                  </TouchableOpacity>
                  <Text style={[styles.paginationButtonText, { marginHorizontal: 10 }]}>{currentPage} / {Math.ceil(queryResults.length / rowsPerPage)}</Text>
                  <TouchableOpacity
                    style={[styles.paginationButton, currentPage >= Math.ceil(queryResults.length / rowsPerPage) && styles.paginationButtonDisabled]}
                    onPress={handleNextPage}
                    disabled={currentPage >= Math.ceil(queryResults.length / rowsPerPage)}
                  >
                    <Text style={styles.paginationButtonText}>下一页</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        )}

        {showStartDate && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={(event, date) => onDateChange(event, date, 'startDate')}
          />
        )}
        {showStartTime && (
          <DateTimePicker
            value={startDate}
            mode="time"
            display="default"
            onChange={(event, date) => onDateChange(event, date, 'startTime')}
          />
        )}
        {showEndDate && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={(event, date) => onDateChange(event, date, 'endDate')}
          />
        )}
        {showEndTime && (
          <DateTimePicker
            value={endDate}
            mode="time"
            display="default"
            onChange={(event, date) => onDateChange(event, date, 'endTime')}
          />
        )}
      </View>
    </ScrollView>
  );
};

export default HistoryDataQueryScreen;