import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, Alert, Image, ActivityIndicator, Modal, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { uploadFileToWebDAV } from './FileUploadScreen';

const ReportFormScreen = ({ route }) => {
  const { reportId, title } = route.params;
  const { colors } = useTheme();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [allowDateEdit, setAllowDateEdit] = useState(false);
  const [isCheckingReport, setIsCheckingReport] = useState(false);

  // 获取昨天的日期
  const getYesterdayDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  };

  // 表单数据状态
  const [formData, setFormData] = useState({
    id: '',
    // 默认使用昨天的日期，而不是当天
    date: getYesterdayDate(),
    operator: '',
    inflow: '',
    outflow: '',
    in_quality: '',
    out_quality: '',
    water_quality_anomalies: '',
    equipment_status: '',
    equipment_issues: '',
    carbon_source: '',
    phosphorus_removal: '',
    disinfectant: '',
    chemical_effect: '',
    sludge_quantity: '',
    other_notes: '',
    report_id: '',
    imagesurl: ''
  });

  // 检查是否已提交报告
  const checkExistingReport = async () => {
    if (!formData.operator || !formData.date) return false;
    
    setIsCheckingReport(true);
    try {
      const response = await axios.get(`https://nodered.jzz77.cn:9003/api/reports/check?date=${formData.date}&operator=${formData.operator}`);
      
      if (response.data && response.data.exists) {
        Alert.alert('提示', `${formData.operator}已经提交过${formData.date}的日报，不能重复提交`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('检查报告失败:', error);
      return false;
    } finally {
      setIsCheckingReport(false);
    }
  };

  // 处理表单提交
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (submitting || isCheckingReport) return;
    
    // 验证必填字段
    if (!formData.date || !formData.operator) {
      Alert.alert('错误', '日期和值班员为必填项');
      return;
    }
    
    // 检查是否已提交过报告
    const reportExists = await checkExistingReport();
    if (reportExists) return;
    
    setSubmitting(true);
    try {
      // 生成唯一的生产报告ID
      const date = formData.date;
      const timestamp = Date.now();
      const reportId = `PROD_REPORT_${date}_${timestamp}`;
      
      // 先上传图片，使用报告ID作为标识
      let imageUrls = [];
      if (images.length > 0) {
        imageUrls = await uploadImages(reportId);
      }

      // 准备提交的数据，确保所有字段都正确映射
      const processedData = {
        id: reportId,
        date: formData.date,
        operator: formData.operator,
        inflow: formData.inflow || '0',
        outflow: formData.outflow || '0',
        in_quality: formData.in_quality || '',
        out_quality: formData.out_quality || '',
        water_quality_anomalies: formData.water_quality_anomalies || '',
        equipment_status: formData.equipment_status || '',
        equipment_issues: formData.equipment_issues || '',
        carbon_source: formData.carbon_source || '0',
        phosphorus_removal: formData.phosphorus_removal || '0',
        disinfectant: formData.disinfectant || '0',
        chemical_effect: formData.chemical_effect || '',
        sludge_quantity: formData.sludge_quantity || '0',
        other_notes: formData.other_notes || '',
        report_id: reportId,
        imagesurl: imageUrls.join(','),
      };

      // 提交到服务器
      const response = await axios.post('https://nodered.jzz77.cn:9003/api/reports', processedData);
      
      if (response.status === 201) {
        Alert.alert('成功', '报告已提交');
        // 只在成功时清空图片和表单数据
        setImages([]);
        setFormData({
          id: '',
          date: getYesterdayDate(),
          operator: '',
          inflow: '',
          outflow: '',
          in_quality: '',
          out_quality: '',
          water_quality_anomalies: '',
          equipment_status: '',
          equipment_issues: '',
          carbon_source: '',
          phosphorus_removal: '',
          disinfectant: '',
          chemical_effect: '',
          sludge_quantity: '',
          other_notes: '',
          report_id: '',
          imagesurl: ''
        });
        // 重置日期编辑状态
        setAllowDateEdit(false);
      } else {
        throw new Error('提交失败');
      }
    } catch (error) {
      console.error('提交失败:', error);
      const errorMessage = error.response?.data?.message || '提交失败，请检查数据格式是否正确';
      Alert.alert('错误', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // 处理导出PDF
  const handleExportPDF = () => {
    // TODO: 实现PDF导出功能
    Alert.alert('提示', 'PDF导出功能开发中');
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      // 确保选择的日期不能是今天或未来的日期
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate >= today) {
        Alert.alert('错误', '只能选择今天之前的日期');
        return;
      }
      
      setFormData({ ...formData, date: selectedDate.toISOString().split('T')[0] });
    }
  };

  const renderFormField = (label, key, placeholder, keyboardType = 'default', isNumeric = false) => (
    <View style={styles.formGroup}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        style={[styles.input, { 
          backgroundColor: colors.card,
          color: colors.text,
          borderColor: colors.border
        }]}
        value={formData[key]}
        onChangeText={(text) => setFormData({ ...formData, [key]: text })}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType}
      />
    </View>
  );

  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  // 处理图片点击，显示大图
  const handleImagePress = (uri) => {
    setSelectedImage(uri);
    setImageModalVisible(true);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('需要权限', '请允许访问相册以选择图片');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('需要权限', '请允许访问相机以拍摄照片');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const uploadImages = async (reportId) => {
    try {
      const uploadPromises = images.map(async (uri, index) => {
        // 使用生产报告ID生成唯一的图片文件名
        const timestamp = Date.now();
        const imageFileName = `PROD_${reportId}_IMAGE_${index + 1}_${timestamp}.jpg`;
        
        const file = {
          uri,
          name: imageFileName,
          type: 'image/jpeg'
        };
        
        // 上传到 Nextcloud，使用报告ID作为标识
        return await uploadFileToWebDAV(file, 'reports', reportId);
      });
  
      const imageUrls = await Promise.all(uploadPromises);
      return imageUrls;
    } catch (error) {
      console.error('上传图片失败:', error);
      throw error;
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>基本信息</Text>
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>日期</Text>
            <View style={styles.dateContainer}>
              <TouchableOpacity 
                style={[
                  styles.dateInput, 
                  { 
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    justifyContent: 'center',
                    flex: 1
                  },
                  !allowDateEdit && { opacity: 0.7 }
                ]}
                onPress={() => allowDateEdit && setShowDatePicker(true)}
                disabled={!allowDateEdit}
              >
                <Text style={{ color: colors.text }}>{formData.date}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dateEditButton, { backgroundColor: colors.primary }]}
                onPress={() => setAllowDateEdit(!allowDateEdit)}
              >
                <Ionicons 
                  name={allowDateEdit ? "checkmark-outline" : "create-outline"} 
                  size={18} 
                  color="#FFFFFF" 
                />
              </TouchableOpacity>
            </View>
            {showDatePicker && (
              <DateTimePicker
                value={new Date(formData.date)}
                mode="date"
                display="default"
                onChange={onDateChange}
                maximumDate={new Date(new Date().setDate(new Date().getDate() - 1))} // 设置最大日期为昨天
              />
            )}
          </View>
          {renderFormField('值班员', 'operator', '请输入值班员姓名')}
        </View>

        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>进出水情况</Text>
          {renderFormField('进水流量累计 (m³)', 'inflow', '请输入进水流量累计量', 'numeric', true)}
          {renderFormField('出水流量累计 (m³)', 'outflow', '请输入出水流量累计量', 'numeric', true)}
          <Text style={[styles.subSectionTitle, { color: colors.text }]}>进水情况</Text>
          {renderFormField('进水水质', 'in_quality', '填写进水COD, 氨氮, 总磷, 总氮平均值')}
          <Text style={[styles.subSectionTitle, { color: colors.text }]}>出水情况</Text>
          {renderFormField('出水水质', 'out_quality', '填写出水COD, 氨氮, 总磷, 总氮平均值')}
          {renderFormField('水质异常情况', 'water_quality_anomalies', '如有异常情况，请描述')}
        </View>

        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>设备运行情况</Text>
          {renderFormField('主要设备运行状态', 'equipment_status', '描述设备运行情况，是否正常等')}
          {renderFormField('设备故障或问题', 'equipment_issues', '如有设备故障，请描述')}
        </View>

        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>药剂投加情况</Text>
          {renderFormField('碳源投加量 (L)', 'carbon_source', '请输入碳源投加量', 'numeric', true)}
          {renderFormField('除磷剂投加量 (L)', 'phosphorus_removal', '请输入除磷剂投加量', 'numeric', true)}
          {renderFormField('消毒剂投加量 (L)', 'disinfectant', '请输入消毒剂投加量', 'numeric', true)}
          {renderFormField('药剂投加效果', 'chemical_effect', '描述药剂的投加效果')}
        </View>

        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>污泥车间</Text>
          {renderFormField('产泥量 (吨)', 'sludge_quantity', '请输入污泥车间产泥量', 'numeric', true)}
        </View>

        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>其他情况</Text>
          {renderFormField('其他备注', 'other_notes', '填写备注信息或需要注意的信息')}
        </View>

        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>现场照片</Text>
          <View style={styles.imageButtonContainer}>
            <TouchableOpacity 
              style={[styles.imageButton, { backgroundColor: colors.primary }]}
              onPress={pickImage}
            >
              <Ionicons name="images" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>选择图片</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.imageButton, { backgroundColor: colors.primary }]}
              onPress={takePhoto}
            >
              <Ionicons name="camera" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>拍照</Text>
            </TouchableOpacity>
          </View>
          {images.length > 0 && (
            <ScrollView horizontal style={styles.imagePreviewContainer}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imagePreview}>
                  <TouchableOpacity onPress={() => handleImagePress(uri)}>
                    <Image source={{ uri }} style={styles.previewImage} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => {
                      const newImages = [...images];
                      newImages.splice(index, 1);
                      setImages(newImages);
                    }}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF5252" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
          
          {/* 图片查看模态框 */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={imageModalVisible}
            onRequestClose={() => setImageModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setImageModalVisible(false)}
              >
                <Ionicons name="close-circle" size={32} color="#fff" />
              </TouchableOpacity>
              <View style={styles.modalImageContainer}>
                {selectedImage && (
                  <Image 
                    source={{ uri: selectedImage }} 
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                )}
              </View>
            </View>
          </Modal>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.submitButton, { 
              backgroundColor: colors.primary,
              opacity: submitting ? 0.7 : 1
            }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="save" size={24} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>提交报告</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  form: {
    padding: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    height: 45,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#2196F3',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  imageButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  imagePreview: {
    width: 100,
    height: 100,
    marginRight: 10,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 2,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  imagePreview: {
    width: 100,
    height: 100,
    marginRight: 10,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImageContainer: {
    width: screenWidth,
    height: screenHeight * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateInput: {
    height: 45,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginRight: 10,
  },
  dateEditButton: {
    height: 45,
    width: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ReportFormScreen;