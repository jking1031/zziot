import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Switch, ScrollView, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode, toggleTheme, followSystem, toggleFollowSystem, colors } = useTheme();
  const [language, setLanguage] = useState('中文');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const { user, updateUserInfo, logout } = useAuth();
  const [userInfo, setUserInfo] = useState({
    avatar_seed: user?.avatar_seed || Math.random().toString(36).substring(2, 15),
    username: user?.username || '',
    department: user?.department || '',
    phone: user?.phone || ''
  });

  useEffect(() => {
    if (user) {
      setUserInfo({
        avatar_seed: user.avatar_seed || Math.random().toString(36).substring(2, 15),
        username: user.username || '',
        department: user.department || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === '中文' ? 'English' : '中文');
    // TODO: 实现语言切换逻辑
  };

  const generateNewAvatar = async () => {
    const newSeed = Math.random().toString(36).substring(2, 15);
    const success = await updateUserInfo({ 
      avatar_seed: newSeed
    });
    
    if (success) {
      setUserInfo(prev => ({
        ...prev,
        avatar_seed: newSeed
      }));
    } else {
      Alert.alert('错误', '生成新头像失败，请稍后重试');
    }
  };

  const saveAvatar = async () => {
    setShowAvatarModal(false);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 用户基本信息卡片 */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: `https://api.dicebear.com/7.x/pixel-art/png?seed=${userInfo.avatar_seed}` }}
            style={styles.avatar} 
          />
          <TouchableOpacity style={styles.editButton} onPress={() => setShowAvatarModal(true)}>
            <Ionicons name="pencil" size={20} color={isDarkMode ? '#fff' : '#666'} />
          </TouchableOpacity>
        </View>
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.text }]}>用户名</Text>
            <Text style={[styles.value, { color: colors.text }]}>{userInfo.username}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.text }]}>部门</Text>
            <Text style={[styles.value, { color: colors.text }]}>{userInfo.department}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.text }]}>联系方式</Text>
            <Text style={[styles.value, { color: colors.text }]}>{userInfo.phone}</Text>
          </View>
        </View>
      </View>

      {/* 主题设置卡片 */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>主题设置</Text>
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>跟随系统主题</Text>
          <Switch
            value={followSystem}
            onValueChange={toggleFollowSystem}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={followSystem ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
        <View style={[styles.settingRow, { opacity: followSystem ? 0.5 : 1 }]}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>暗黑模式</Text>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isDarkMode ? '#f5dd4b' : '#f4f3f4'}
            disabled={followSystem}
          />
        </View>
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>界面语言</Text>
          <TouchableOpacity onPress={toggleLanguage} style={[styles.languageButton, { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' }]}>
            <Text style={[styles.languageText, { color: colors.text }]}>{language}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 头像选择模态框 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAvatarModal}
        onRequestClose={() => setShowAvatarModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>更换头像</Text>
            <Image 
              source={{ uri: `https://api.dicebear.com/7.x/pixel-art/png?seed=${userInfo.avatar_seed}` }}
              style={styles.previewAvatar} 
            />
            <View style={styles.avatarButtons}>
              <TouchableOpacity style={[styles.generateButton, { width: '100%' }]} onPress={generateNewAvatar}>
                <Text style={styles.generateButtonText}>生成新头像</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setShowAvatarModal(false)}
              >
                <Text style={styles.modalButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={saveAvatar}
              >
                <Text style={styles.modalButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* 退出账号按钮 */}
      <TouchableOpacity 
        style={[styles.logoutButton, { backgroundColor: '#ff4444' }]} 
        onPress={() => {
          Alert.alert(
            '退出确认',
            '确定要退出登录吗？',
            [
              { text: '取消', style: 'cancel' },
              { 
                text: '确定', 
                onPress: async () => {
                  await logout();
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }]
                  });
                }
              }
            ]
          );
        }}
      >
        <Ionicons name="log-out-outline" size={24} color="#fff" style={styles.logoutIcon} />
        <Text style={styles.logoutText}>退出账号</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
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
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editButton: {
    position: 'absolute',
    right: -20,
    top: 0,
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 20,
  },
  infoContainer: {
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  label: {
    fontSize: 16,
  },
  value: {
    fontSize: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  settingLabel: {
    fontSize: 16,
  },
  languageButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  languageText: {
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  previewAvatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
  },
  avatarButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  generateButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    width: '48%',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  pickImageButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    width: '48%',
  },
  pickImageButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
    width: '45%',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;