import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';

const ReportFormScreen = ({ route }) => {
  const { reportId, title } = route.params;
  const { colors } = useTheme();

  const [showDatePicker, setShowDatePicker] = useState(false);

  // 表单数据状态
  const [formData, setFormData] = useState({
    id: '',
    date: new Date().toISOString().split('T')[0],
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
    other_notes: ''
  });

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      // 处理数值类型字段，将空字符串转换为0
      const processedData = {
        ...formData,
        inflow: formData.inflow === '' ? '0' : formData.inflow,
        outflow: formData.outflow === '' ? '0' : formData.outflow,
        carbon_source: formData.carbon_source === '' ? '0' : formData.carbon_source,
        phosphorus_removal: formData.phosphorus_removal === '' ? '0' : formData.phosphorus_removal,
        disinfectant: formData.disinfectant === '' ? '0' : formData.disinfectant,
        sludge_quantity: formData.sludge_quantity === '' ? '0' : formData.sludge_quantity
      };

      const response = await axios.post('http://112.28.56.235:13100/api/reports', processedData);
      if (response.status === 201) {
        Alert.alert('成功', '报告已提交');
      }
    } catch (error) {
      console.error('提交失败:', error);
      const errorMessage = error.response?.data?.message || '提交失败，请检查数据格式是否正确';
      Alert.alert('错误', errorMessage);
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
            <TouchableOpacity 
              style={[styles.input, { 
                backgroundColor: colors.card,
                borderColor: colors.border,
                justifyContent: 'center'
              }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: colors.text }}>{formData.date}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={new Date(formData.date)}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}
          </View>
          {renderFormField('值班员', 'operator', '请输入值班员姓名')}
        </View>

        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>进出水情况</Text>
          {renderFormField('进水流量累计 (m³)', 'inflow', '请输入进水流量累计量', 'numeric', true)}
          {renderFormField('出水流量累计 (m³)', 'outflow', '请输入出水流量累计量', 'numeric', true)}
          <Text style={[styles.subSectionTitle, { color: colors.text }]}>进水水质</Text>
          {renderFormField('进水水质', 'in_quality', '填写进水COD, 氨氮, 总磷, 总氮平均值')}
          <Text style={[styles.subSectionTitle, { color: colors.text }]}>出水水质</Text>
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
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
          >
            <Ionicons name="save" size={24} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>提交报告</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

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
});

export default ReportFormScreen;