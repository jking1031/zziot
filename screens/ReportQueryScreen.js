import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Share, Image, Linking, ActivityIndicator, Modal, Dimensions } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { getFileList } from './FileUploadScreen';  // 添加导入
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

const ReportQueryScreen = () => {
  const { colors } = useTheme();
  const [startDate, setStartDate] = useState(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [selectedSite, setSelectedSite] = useState('gt');
  const [reports, setReports] = useState([]);
  const [expandedReportId, setExpandedReportId] = useState(null);
  const viewShotRefs = useRef({});
  const [reportImages, setReportImages] = useState({}); // 添加图片状态
  const [loadingImages, setLoadingImages] = useState({});
  const [imageLoadErrors, setImageLoadErrors] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  useEffect(() => {
    // 清除之前的图片缓存
    setReportImages({});
  }, [selectedSite]); // 当切换站点时清除缓存

  // 快捷日期选择
  const selectDateRange = (range) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (range) {
      case '7days':
        start.setDate(today.getDate() - 7);
        break;
      case '15days':
        start.setDate(today.getDate() - 15);
        break;
      case '30days':
        start.setDate(today.getDate() - 30);
        break;
      default:
        break;
    }

    setStartDate(start);
    setEndDate(end);
  };

  // 格式化日期显示
  const formatDate = (date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short'
    });
  };

  // 获取报告数据
  const fetchReports = async () => {
    try {
      const adjustedStartDate = new Date(startDate.getTime() + 8 * 60 * 60 * 1000);
      const adjustedEndDate = new Date(endDate.getTime() + 8 * 60 * 60 * 1000);
      const apiUrl = selectedSite === 'gt' ? 
        'https://nodered.jzz77.cn:9003/api/reports/query' : 
        'https://nodered.jzz77.cn:9003/api/reports5000t';
      
      const response = await axios.get(apiUrl, {
        params: {
          startDate: adjustedStartDate.toLocaleDateString('zh-CN'),
          endDate: adjustedEndDate.toLocaleDateString('zh-CN')
        }
      });

      // 处理图片URL
      const processedReports = response.data.map(report => ({
        ...report,
        images: report.imagesurl ? report.imagesurl.split(',').filter(url => url) : []
      }));

      setReports(processedReports);
    } catch (error) {
      console.error('获取报告失败:', error);
    }
  };

  // 获取报告相关的图片
  const fetchReportImages = async (report) => {
    try {
      setLoadingImages(prev => ({ ...prev, [report.id]: true }));
      
      // 从报告数据中获取图片URL列表
      let imageUrls = [];
      if (report.images && Array.isArray(report.images)) {
        imageUrls = report.images;
      }

      // 如果报告中有图片URL，直接使用
      if (imageUrls.length > 0) {
        const files = imageUrls.map(url => ({
          url,
          filename: url.split('/').pop(),
          isImage: true
        }));
        setReportImages(prev => ({
          ...prev,
          [report.id]: files
        }));
      } else {
        // 否则从 Nextcloud 获取图片
        const date = new Date(report.date).toISOString().split('T')[0];
        const reportId = report.id; // 使用报告的ID
        const files = await getFileList('reports', reportId);
        setReportImages(prev => ({
          ...prev,
          [report.id]: files
        }));
      }
    } catch (error) {
      console.error('获取报告图片失败:', error);
    } finally {
      setLoadingImages(prev => ({ ...prev, [report.id]: false }));
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
  const toggleReportExpand = async (reportId) => {
    setExpandedReportId(expandedReportId === reportId ? null : reportId);
    if (expandedReportId !== reportId) {
      const report = reports.find(r => r.id === reportId);
      if (report && !reportImages[reportId]) {
        await fetchReportImages(report);
      }
    }
  };

  // 渲染高铁污水厂报告卡片
  const renderGTReportCard = (report) => {
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
              <Text style={[styles.infoText, { color: colors.text }]}>进水流量: {report.inflow || 0} m³</Text>
              <Text style={[styles.infoText, { color: colors.text }]}>出水流量: {report.outflow || 0} m³</Text>
              <Text style={[styles.infoText, { color: colors.text }]}>进水QUALITY: {report.in_quality || '无数据'}</Text>
              <Text style={[styles.infoText, { color: colors.text }]}>出水QUALITY: {report.out_quality || '无数据'}</Text>
              {report.water_quality_anomalies && (
                <Text style={[styles.infoText, { color: colors.text }]}>
                  水质异常: {report.water_quality_anomalies}
                </Text>
              )}
            </View>

            <View style={styles.infoSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>设备运行情况</Text>
              <Text style={[styles.infoText, { color: colors.text }]}>
                设备状态: {report.equipment_status || '无数据'}
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
                碳源投加量: {report.carbon_source || 0} L
              </Text>
              <Text style={[styles.infoText, { color: colors.text }]}>
                除磷剂投加量: {report.phosphorus_removal || 0} L
              </Text>
              <Text style={[styles.infoText, { color: colors.text }]}>
                消毒剂投加量: {report.disinfectant || 0} L
              </Text>
              <Text style={[styles.infoText, { color: colors.text }]}>
                药剂效果: {report.chemical_effect || '无数据'}
              </Text>
            </View>

            <View style={styles.infoSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>污泥情况</Text>
              <Text style={[styles.infoText, { color: colors.text }]}>
                产泥量: {report.sludge_quantity || 0} 吨
              </Text>
            </View>

            {report.other_notes && (
              <View style={styles.infoSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>其他备注</Text>
                <Text style={[styles.infoText, { color: colors.text }]}>{report.other_notes}</Text>
              </View>
            )}

            {loadingImages[report.id] ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text }]}>正在加载图片...</Text>
              </View>
            ) : report.images?.length > 0 && (
              <View style={styles.infoSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>现场图片</Text>
                <ScrollView horizontal style={styles.imageContainer}>
                  {report.images.map((url, index) => (
                    <View key={index} style={styles.imageWrapper}>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedImage(url);
                          setModalVisible(true);
                        }}
                      >
                        <Image
                          source={{
                            uri: url,
                            headers: {
                              'Authorization': 'Basic ' + btoa('jzz7777:12101108'),
                              'OCS-APIRequest': 'true',
                              'Cache-Control': 'no-cache',
                              'Pragma': 'no-cache'
                            }
                          }}
                          style={styles.reportImage}
                          resizeMode="cover"
                          onLoadStart={() => {
                            setLoadingImages(prev => ({ ...prev, [url]: true }));
                            setImageLoadErrors(prev => ({ ...prev, [url]: 0 }));
                          }}
                          onLoadEnd={() => {
                            setLoadingImages(prev => ({ ...prev, [url]: false }));
                          }}
                          onError={(error) => {
                            console.error(`Image loading error for ${url}:`, error);
                            setImageLoadErrors(prev => ({
                              ...prev,
                              [url]: (prev[url] || 0) + 1
                            }));
                            setLoadingImages(prev => ({ ...prev, [url]: false }));
                            Alert.alert('图片加载失败', '请检查网络连接或稍后重试');
                          }}
                        />
                      </TouchableOpacity>
                      {loadingImages[url] && (
                        <View style={styles.imageLoadingOverlay}>
                          <ActivityIndicator size="small" color="#fff" />
                        </View>
                      )}
                      {imageLoadErrors[url] > 0 && !loadingImages[url] && (
                        <TouchableOpacity
                          style={styles.retryButton}
                          onPress={() => {
                            setImageLoadErrors(prev => ({...prev, [url]: 0}));
                            setLoadingImages(prev => ({ ...prev, [url]: true }));
                          }}
                        >
                          <Ionicons name="reload" size={20} color="#fff" />
                          <Text style={styles.retryText}>重试</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </ScrollView>
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

  // 渲染5000吨处理站报告卡片
  const render5000ReportCard = (report) => {
    const isExpanded = expandedReportId === report.id;
    const reportDate = new Date(report.date).toLocaleDateString('zh-CN');

    // 修改renderReportImages函数
    const renderReportImages = (report) => {
      const images = reportImages[report.id] || [];
      if (images.length === 0) return null;
    
      return (
        <View style={styles.infoSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>现场图片</Text>
          <ScrollView horizontal style={styles.imageContainer}>
            {images.map((file, index) => (
              file.isImage ? (
                <View key={index} style={styles.imageWrapper}>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedImage(file.thumbnailUrl || file.url);
                      setModalVisible(true);
                    }}
                  >
                    <Image
                      source={{
                        uri: file.thumbnailUrl || file.url, // 优先使用缩略图
                        headers: {
                          'Authorization': 'Basic ' + btoa('jzz7777:12101108'),
                          'OCS-APIRequest': 'true',
                        }
                      }}
                      style={styles.reportImage}
                      resizeMode="cover"
                      onError={(error) => {
                        console.error(`Image loading error for ${file.url}:`, error);
                        setImageLoadErrors(prev => ({
                          ...prev,
                          [file.url]: (prev[file.url] || 0) + 1
                        }));
                      }}
                    />
                  </TouchableOpacity>
                  {imageLoadErrors[file.url] > 0 && (
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={() => {
                        setImageLoadErrors(prev => ({...prev, [file.url]: 0}));
                      }}
                    >
                      <Ionicons name="reload" size={20} color="#fff" />
                      <Text style={styles.retryText}>重试</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : null
            ))}
          </ScrollView>
        </View>
      );
    };

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
              <Text style={[styles.infoText, { color: colors.text }]}>出水QUALITY: {report.out_quality}</Text>
              {report.water_quality_anomalies && (
                <Text style={[styles.infoText, { color: colors.text }]}>
                  水质异常: {report.water_quality_anomalies}
                </Text>
              )}
            </View>

            <View style={styles.infoSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>设备运行情况</Text>
              <Text style={[styles.infoText, { color: colors.text }]}>
                曝气系统: {report.aeration_system_status}
              </Text>
              <Text style={[styles.infoText, { color: colors.text }]}>
                反洗系统: {report.backwash_system_status}
              </Text>
              <Text style={[styles.infoText, { color: colors.text }]}>
                进水泵系统: {report.inlet_pump_status}
              </Text>
              <Text style={[styles.infoText, { color: colors.text }]}>
                磁混系统: {report.magnetic_mixing_status}
              </Text>
              <Text style={[styles.infoText, { color: colors.text }]}>
                水箱状态: {report.water_tank_status}
              </Text>
            </View>

            <View style={styles.infoSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>药剂投加情况</Text>
              <Text style={[styles.infoText, { color: colors.text }]}>
                絮凝剂投加量: {report.flocculant_dosage} L
              </Text>
              <Text style={[styles.infoText, { color: colors.text }]}>
                磁粉投加量: {report.magnetic_powder_dosage} kg
              </Text>
              <Text style={[styles.infoText, { color: colors.text }]}>
                药剂库存: {report.chemical_inventory}
              </Text>
            </View>

            {report.other_notes && (
              <View style={styles.infoSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>其他备注</Text>
                <Text style={[styles.infoText, { color: colors.text }]}>{report.other_notes}</Text>
              </View>
            )}

            {renderReportImages(report)}

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

  // 添加图片查看Modal
  const renderImageViewerModal = () => {
    const handleCloseModal = () => {
      setModalVisible(false);
      setSelectedImage(null);
    };

    const handleShareImage = async () => {
      try {
        if (!selectedImage) return;
        
        const fileUri = await FileSystem.downloadAsync(
          selectedImage,
          FileSystem.cacheDirectory + 'report_image_' + Date.now() + '.jpg',
          {
            headers: {
              'Authorization': 'Basic ' + btoa('jzz7777:12101108'),
              'OCS-APIRequest': 'true'
            }
          }
        );
        await Share.share({
          url: fileUri.uri,
          message: `运行报告图片`
        });
      } catch (error) {
        console.error('分享图片失败:', error);
        Alert.alert('错误', '分享图片失败: ' + error.message);
      }
    };

    return (
      <Modal
        visible={modalVisible}
        transparent={true}
        onRequestClose={handleCloseModal}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={{
              position: 'absolute',
              top: 40,
              right: 20,
              zIndex: 20,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              borderRadius: 20,
              padding: 8
            }}
            onPress={handleCloseModal}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.modalImageContainer}>
            <Image
              source={{
                uri: selectedImage,
                headers: {
                  'Authorization': 'Basic ' + btoa('jzz7777:12101108'),
                  'OCS-APIRequest': 'true',
                  'Cache-Control': 'no-cache',
                  'Pragma': 'no-cache'
                }
              }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          </View>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalActionButton}
              onPress={handleShareImage}
              activeOpacity={0.7}
            >
              <Ionicons name="share-outline" size={24} color="#fff" />
              <Text style={styles.modalActionText}>分享</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalActionButton}
              onPress={handleCloseModal}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color="#fff" />
              <Text style={styles.modalActionText}>关闭</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.datePickerContainer}>
          <View style={styles.quickSelectButtons}>
            <TouchableOpacity 
              style={[styles.quickSelectButton, { backgroundColor: colors.primary }]}
              onPress={() => selectDateRange('7days')}
            >
              <Text style={styles.quickSelectButtonText}>近7天</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickSelectButton, { backgroundColor: colors.primary }]}
              onPress={() => selectDateRange('15days')}
            >
              <Text style={styles.quickSelectButtonText}>近15天</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickSelectButton, { backgroundColor: colors.primary }]}
              onPress={() => selectDateRange('30days')}
            >
              <Text style={styles.quickSelectButtonText}>近30天</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.dateInputsContainer}>
            <View style={styles.datePickersWrapper}>
              <TouchableOpacity 
                style={[styles.datePickerButton, { backgroundColor: colors.card }]}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Ionicons name="calendar" size={20} color={colors.text} style={styles.dateIcon} />
                <Text style={[styles.dateText, { color: colors.text }]}>
                  {formatDate(startDate)}
                </Text>
              </TouchableOpacity>

              <Text style={[styles.dateRangeSeparator, { color: colors.text }]}>至</Text>

              <TouchableOpacity 
                style={[styles.datePickerButton, { backgroundColor: colors.card }]}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Ionicons name="calendar" size={20} color={colors.text} style={styles.dateIcon} />
                <Text style={[styles.dateText, { color: colors.text }]}>
                  {formatDate(endDate)}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.searchButton, { backgroundColor: colors.primary }]}
              onPress={fetchReports}
            >
              <Ionicons name="search" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
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

      <View style={styles.siteSelector}>
        <TouchableOpacity 
          style={[styles.siteButton, selectedSite === 'gt' && styles.selectedSiteButton]}
          onPress={() => {
            setSelectedSite('gt');
            setReports([]);
          }}
        >
          <Text style={[styles.siteButtonText, selectedSite === 'gt' && styles.selectedSiteButtonText]}>高铁污水厂</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.siteButton, selectedSite === '5000' && styles.selectedSiteButton]}
          onPress={() => {
            setSelectedSite('5000');
            setReports([]);
          }}
        >
          <Text style={[styles.siteButtonText, selectedSite === '5000' && styles.selectedSiteButtonText]}>5000吨处理站</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content}>
        {reports.map(report => selectedSite === 'gt' ? renderGTReportCard(report) : render5000ReportCard(report))}
      </ScrollView>
      {renderImageViewerModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImageContainer: {
    width: '100%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalFooter: {
    position: 'absolute',
    bottom: '10%',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'transparent',
    gap: 20,
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  modalActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  modalActions: {
    flexDirection: 'row',
  },
  modalImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '80%',
  },
  imageActionButtons: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    flexDirection: 'row',
    zIndex: 1,
  },
  imageActionButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    padding: 5,
    marginLeft: 5,
  },
  header: {
    padding: 16,
  },
  datePickerContainer: {
    marginBottom: 16,
  },
  quickSelectButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quickSelectButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  quickSelectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  dateInputsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  datePickersWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  datePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  dateIcon: {
    marginRight: 8,
  },
  dateText: {
    fontSize: 14,
  },
  dateRangeSeparator: {
    marginHorizontal: 8,
    fontSize: 14,
  },
  searchButton: {
    padding: 12,
    borderRadius: 8,
  },
  siteSelector: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 0,
  },
  siteButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  selectedSiteButton: {
    backgroundColor: '#2196F3',
  },
  siteButtonText: {
    fontSize: 14,
    color: '#666',
  },
  selectedSiteButtonText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 0,
  },
  card: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardDate: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardOperator: {
    fontSize: 14,
  },
  cardContent: {
    padding: 16,
  },
  infoSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  shareButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  imageContainer: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10,
    minHeight: 120,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 10,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  reportImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  imageExpandButton: {
    position: 'absolute',
    right: 5,
    bottom: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    padding: 5,
    zIndex: 1,
  },
  retryButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{translateX: -30}, {translateY: -15}],
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 12,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  shareButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  imageContainer: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10,
    minHeight: 120,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 10,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  reportImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  imageExpandButton: {
    position: 'absolute',
    right: 5,
    bottom: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    padding: 5,
    zIndex: 1,
  },
  retryButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{translateX: -30}, {translateY: -15}],
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 12,
  },
});

export default ReportQueryScreen;