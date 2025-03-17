import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { StyleSheet, View, Text, TouchableOpacity, Image, Switch, ScrollView, Modal, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';

// 角色ID与角色信息的映射
const roleMap = {
  1: { name: '管理员', description: '系统最高权限，可访问所有功能' },
  2: { name: '部门管理员', description: '管理部门内的用户和数据' },
  3: { name: '运行班组', description: '运行相关功能的操作权限' },
  4: { name: '化验班组', description: '化验数据及相关功能的操作权限' },
  5: { name: '机电班组', description: '机电设备及相关功能的操作权限' },
  6: { name: '污泥车间', description: '污泥处理相关功能的操作权限' },
  7: { name: '5000吨处理站', description: '处理站相关功能的操作权限' },
  8: { name: '附属设施', description: '附属设施相关功能的操作权限' },
  9: { name: '备用权限', description: '未来扩展使用的备用权限组' },
};

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode, toggleTheme, followSystem, toggleFollowSystem, colors } = useTheme();
  const [language, setLanguage] = useState('中文');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const { user, updateUserInfo, logout, userRoles, getUserRoles, isAdmin } = useAuth();
  const [userInfo, setUserInfo] = useState({
    avatar_seed: user?.avatar_seed || Math.random().toString(36).substring(2, 15),
    username: user?.username || '',
    department: user?.department || '',
    phone: user?.phone || '',
    company: user?.company || ''
  });
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    if (user) {
      setUserInfo({
        avatar_seed: user.avatar_seed || Math.random().toString(36).substring(2, 15),
        username: user.username || '',
        department: user.department || '',
        phone: user.phone || '',
        company: user.company || ''
      });
      // 获取用户角色
      fetchUserRoles();
    }
  }, [user]);

  // 获取用户角色
  const fetchUserRoles = async () => {
    if (!user || !user.id) return;
    
    setLoadingRoles(true);
    try {
      // 特别说明角色是从本地数据获取的
      console.log('从本地用户数据中获取角色信息');
      console.log('用户数据:', JSON.stringify(user));
      
      // 检查并输出is_name字段
      if (user.is_name !== undefined) {
        console.log('用户is_name字段:', user.is_name, '类型:', typeof user.is_name);
      } else {
        console.log('用户数据中不存在is_name字段');
      }
      
      // 获取角色
      const fetchedRoles = await getUserRoles(user.id);
      setRoles(fetchedRoles);
      
      console.log('获取到用户角色:', JSON.stringify(fetchedRoles));
      
      // 如果用户是管理员但没有任何角色，确保显示管理员角色
      if (fetchedRoles.length === 0 && isAdmin) {
        console.log('用户是管理员但没有角色，设置为管理员角色');
        setRoles([{ id: 1, name: '管理员' }]);
      }
    } catch (error) {
      console.error('获取用户角色失败:', error);
      
      // 错误发生时，如果用户是管理员，显示管理员角色
      if (isAdmin) {
        setRoles([{ id: 1, name: '管理员' }]);
      }
    } finally {
      setLoadingRoles(false);
    }
  };

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
            <Text style={[styles.label, { color: colors.text }]}>员工</Text>
            <Text style={[styles.value, { color: colors.text }]}>{userInfo.username}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.text }]}>单位</Text>
            <Text style={[styles.value, { color: colors.text }]}>{userInfo.company || '未设置'}</Text>
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

      {/* 用户角色卡片 */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.roleHeaderContainer}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>角色权限</Text>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={fetchUserRoles}
            disabled={loadingRoles}
          >
            <Ionicons 
              name="refresh-circle" 
              size={24} 
              color={loadingRoles ? "#999" : "#FF6700"} 
            />
          </TouchableOpacity>
        </View>
        
        {loadingRoles ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#FF6700" />
            <Text style={[styles.loadingText, { color: colors.text }]}>加载角色信息...</Text>
          </View>
        ) : isAdmin && (!roles || roles.length === 0) ? (
          // 对于管理员用户，即使API获取角色失败也显示管理员角色
          <View style={styles.roleItem}>
            <View style={styles.roleHeader}>
              <Ionicons 
                name="shield-checkmark" 
                size={20} 
                color="#FF6700" 
                style={styles.roleIcon} 
              />
              <Text style={[styles.roleName, { color: colors.text }]}>管理员</Text>
            </View>
            <Text style={[styles.roleDescription, { color: colors.textSecondary }]}>
              系统最高权限，可访问所有功能
            </Text>
          </View>
        ) : roles && roles.length > 0 ? (
          <>
            {roles.map((role, index) => {
              // 尝试获取角色ID，role可能是对象或数字
              const roleId = typeof role === 'object' ? role.id || role.role_id : role;
              const roleInfo = roleMap[roleId] || { name: `未知角色(ID:${roleId})`, description: '未定义的角色权限' };
              
              return (
                <View key={index} style={styles.roleItem}>
                  <View style={styles.roleHeader}>
                    <Ionicons 
                      name="shield-checkmark" 
                      size={20} 
                      color="#FF6700" 
                      style={styles.roleIcon} 
                    />
                    <Text style={[styles.roleName, { color: colors.text }]}>{roleInfo.name}</Text>
                  </View>
                  <Text style={[styles.roleDescription, { color: colors.textSecondary }]}>
                    {roleInfo.description}
                  </Text>
                </View>
              );
            })}
          </>
        ) : (
          <Text style={[styles.noRolesText, { color: colors.textSecondary }]}>
            暂无分配角色权限
          </Text>
        )}
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

      {/* 版本信息卡片 */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>关于应用</Text>
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>当前版本</Text>
          <Text style={[styles.versionText, { color: colors.text }]}>v{Constants.expoConfig.version}</Text>
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
                  // 清理本地用户信息状态
                  setUserInfo({
                    avatar_seed: Math.random().toString(36).substring(2, 15),
                    username: '',
                    department: '',
                    phone: '',
                    company: ''
                  });
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }]
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
  versionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // 角色卡片样式
  roleItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  roleIcon: {
    marginRight: 8,
  },
  roleName: {
    fontSize: 16,
    fontWeight: '600',
  },
  roleDescription: {
    fontSize: 14,
    marginLeft: 28,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
  },
  noRolesText: {
    textAlign: 'center',
    padding: 12,
    fontSize: 14,
  },
  roleHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  refreshButton: {
    padding: 5,
  },
});

export default ProfileScreen;