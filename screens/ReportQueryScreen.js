import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';

const ReportQueryScreen = ({ navigation }) => {
  const [viewShotRefs, setViewShotRefs] = useState({});
  const { colors } = useTheme();
  const [reports, setReports] = useState([]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [expandedReportId, setExpandedReportId] = useState(null);

  // 获取报告数据
  const fetchReports = async () => {
    try {
      const adjustedStartDate = new Date(startDate.getTime() + 8 * 60 * 60 * 1000);
      const adjustedEndDate = new Date(endDate.getTime() + 8 * 60 * 60 * 1000);
      const response = await axios.get('http://112.28.56.235:13100/api/reports', {
        params: {
          startDate: adjustedStartDate.toLocaleDateString('zh-CN'),
          endDate: adjustedEndDate.toLocaleDateString('zh-CN')
        }
      });
      setReports(response.data);
    } catch (error) {
      console.error('获取报告失败:', error);
      Alert.alert('错误', '获取报告失败，请稍后重试');
    }
  };

  // 处理日期选择
  const onStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const onEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  // 处理报告展开/收起
  const toggleReportExpand = (reportId) => {
    setExpandedReportId(expandedReportId === reportId ? null : reportId);
  };

  // 渲染报告卡片
  const renderReportCard = (report) => {
    const isExpanded = expandedReportId === report.id;
    const reportDate = new Date(report.date).toLocaleDateString('zh-CN');

    return (
      <ViewShot
        key={report.id}
        ref={ref => viewShotRefs[report.id] = ref}
        options={{
          format: 'jpg',
          quality: 0.9,
          result: 'data-uri'
        }}
        style={[styles.card, { backgroundColor: colors.card }]}>
        <TouchableOpacity 
          style={styles.cardHeader} 
          onPress={() => toggleReportExpand(report.id)}
        >
          <View style={styles.cardHeaderLeft}>
            <Text style={[styles.cardDate, { color: colors.text }]}>{reportDate}</Text>
            <Text style={[styles.cardOperator, { color: colors.textSecondary }]}>
              值班员: {report.operator}
            </Text>
          </View>
          <Ionicons 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={24} 
            color={colors.text} 
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.cardContent}>
            <View style={styles.infoSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>进出水情况</Text>
              <Text style={[styles.infoText, { color: colors.text }]}>进水流量: {report.inflow} m³</Text>
              <Text style={[styles.infoText, { color: colors.text }]}>出水流量: {report.outflow} m³</Text>
              <Text style={[styles.infoText, { color: colors.text }]}>进水水质: {report.in_quality}</Text>
              <Text style={[styles.infoText, { color: colors.text }]}>出水水质: {report.out_quality}</Text>
              {report.water_quality_anomalies && (
                <Text style={[styles.infoText, { color: colors.text }]}>
                  水质异常: {report.water_quality_anomalies}
                </Text>
              )}
            </View>

            <View style={styles.infoSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>设备运行情况</Text>
              <Text style={[styles.infoText, { color: colors.text }]}>
                设备状态: {report.equipment_status}
              </Text>
              {report.equipment_issues && (
                <Text style={[styles.infoText, { color: colors.text }]}>
                  设备故障: {report.equipment_issues}
                </Text>
              )}
            </View>

            <View style={styles.infoSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>药剂投加情况</Text>
              <Text style={[styles.infoText, { color: colors.text }]}>
                碳源投加量: {report.carbon_source} L
              </Text>
              <Text style={[styles.infoText, { color: colors.text }]}>
                除磷剂投加量: {report.phosphorus_removal} L
              </Text>
              <Text style={[styles.infoText, { color: colors.text }]}>
                消毒剂投加量: {report.disinfectant} L
              </Text>
              <Text style={[styles.infoText, { color: colors.text }]}>
                药剂效果: {report.chemical_effect}
              </Text>
            </View>

            <View style={styles.infoSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>污泥情况</Text>
              <Text style={[styles.infoText, { color: colors.text }]}>
                产泥量: {report.sludge_quantity} 吨
              </Text>
            </View>

            {report.other_notes && (
              <View style={styles.infoSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>其他备注</Text>
                <Text style={[styles.infoText, { color: colors.text }]}>{report.other_notes}</Text>
              </View>
            )}

            <View style={styles.shareButtonsContainer}>
              <TouchableOpacity 
                style={[styles.shareButton, { backgroundColor: colors.primary }]}
                onPress={async () => {
                  try {
                    const uri = await viewShotRefs[report.id].capture();
                    await Share.share({
                      url: uri,
                      title: `运行报告 - ${reportDate}`,
                      message: `运行报告 - ${reportDate}`
                    });
                  } catch (error) {
                    console.error('分享失败:', error);
                    Alert.alert('错误', '分享失败，请稍后重试');
                  }
                }}
              >
                <Ionicons name="image" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>分享报告</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ViewShot>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.datePickerContainer}>
          <TouchableOpacity 
            style={[styles.datePickerButton, { backgroundColor: colors.card }]}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Ionicons name="calendar" size={20} color={colors.text} style={styles.dateIcon} />
            <Text style={[styles.dateText, { color: colors.text }]}>
              {startDate.toLocaleDateString('zh-CN')}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.dateRangeSeparator, { color: colors.text }]}>至</Text>

          <TouchableOpacity 
            style={[styles.datePickerButton, { backgroundColor: colors.card }]}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Ionicons name="calendar" size={20} color={colors.text} style={styles.dateIcon} />
            <Text style={[styles.dateText, { color: colors.text }]}>
              {endDate.toLocaleDateString('zh-CN')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.searchButton, { backgroundColor: colors.primary }]}
            onPress={fetchReports}
          >
            <Ionicons name="search" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={onStartDateChange}
          />
        )}

        {showEndDatePicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={onEndDateChange}
          />
        )}
      </View>

      <ScrollView style={styles.content}>
        {reports.map(report => renderReportCard(report))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  dateIcon: {
    marginRight: 5,
  },
  dateText: {
    fontSize: 14,
  },
  dateRangeSeparator: {
    marginHorizontal: 5,
  },
  searchButton: {
    padding: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  card: {
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardDate: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cardOperator: {
    fontSize: 14,
  },
  cardContent: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  infoSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 5,
  },
  shareButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingHorizontal: 10,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  buttonIcon: {
    marginRight: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ReportQueryScreen;