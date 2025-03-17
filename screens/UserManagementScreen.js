import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Modal, 
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
  StatusBar,
  Switch,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';

// 角色定义
const ROLES = {
  1: { name: '管理员', color: '#4CAF50' },
  2: { name: '部门管理员', color: '#2196F3' },
  3: { name: '运行班组', color: '#FF9800' },
  4: { name: '化验班组', color: '#9C27B0' },
  5: { name: '机电班组', color: '#E91E63' },
  6: { name: '污泥车间', color: '#795548' },
  7: { name: '5000吨处理站', color: '#607D8B' },
  8: { name: '附属设施', color: '#00BCD4' },
  9: { name: '备用权限', color: '#FF5722' },
};

const UserManagementScreen = () => {
  const { colors, isDarkMode } = useTheme();
  const { isAdmin, user } = useAuth();
  const navigation = useNavigation();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [userToChangeRole, setUserToChangeRole] = useState(null);
  
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
    company: '',
    department: '',
    is_admin: 0
  });

  // 检查是否是管理员，如果不是则返回
  useEffect(() => {
    // 只有管理员(is_admin值为1)才能访问此页面
    if (!isAdmin || (user?.is_admin !== 1 && user?.is_admin !== true)) {
      Alert.alert('提示', '只有管理员才能访问此页面');
      navigation.goBack();
    }
  }, [isAdmin, navigation, user]);

  // 获取角色名称
  const getRoleName = (roleId) => {
    if (roleId === true) return ROLES[1].name; // 处理布尔类型的管理员标记
    const role = ROLES[roleId] || ROLES[0];
    return role.name || '普通用户';
  };

  // 获取角色颜色
  const getRoleColor = (roleId) => {
    if (roleId === true) return ROLES[1].color; // 处理布尔类型的管理员标记
    const role = ROLES[roleId] || ROLES[0];
    return role.color || '#9E9E9E';
  };

  // 设置标题和状态栏
  useEffect(() => {
    if (Platform.OS === 'ios') {
      navigation.setOptions({
        title: '用户管理',
        headerRight: () => (
          <TouchableOpacity
            style={{ marginRight: 15 }}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add-circle" size={24} color={colors.primary} />
          </TouchableOpacity>
        ),
      });
    }
    
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(isDarkMode ? '#121212' : '#FFFFFF');
      StatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content');
    }
  }, [navigation, colors, isDarkMode]);

  // 获取用户列表
  const fetchUsers = useCallback(async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) {
      setLoading(true);
    }
    try {
      const response = await axios.get('https://nodered.jzz77.cn:9003/api/users', {
        timeout: 10000
      });
      
      if (response.data && Array.isArray(response.data)) {
        console.log('获取到用户列表:', response.data.length);
        setUsers(response.data);
      } else {
        console.log('服务器返回的用户数据格式不正确:', response.data);
        Alert.alert('错误', '获取用户列表失败，请稍后再试');
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      Alert.alert('错误', '获取用户列表失败，请检查网络连接');
    } finally {
      setLoading(false);
      if (!showLoadingIndicator) {
        setRefreshing(false);
      }
    }
  }, []);

  // 初始加载用户列表
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 下拉刷新
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers(false);
  }, [fetchUsers]);

  // 添加用户
  const handleAddUser = async () => {
    // 验证表单
    const { username, email, password, phone } = newUser;
    if (!username || !email || !password || !phone) {
      Alert.alert('提示', '请完善必填信息（用户名、邮箱、密码、手机号）');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('https://nodered.jzz77.cn:9003/api/users', newUser, {
        timeout: 10000
      });

      if (response.status === 201 || response.status === 200) {
        Alert.alert('成功', '用户添加成功');
        setNewUser({
          username: '',
          email: '',
          password: '',
          phone: '',
          company: '',
          department: '',
          is_admin: 0
        });
        setShowAddModal(false);
        fetchUsers();
      }
    } catch (error) {
      console.error('添加用户失败:', error);
      Alert.alert('错误', error.response?.data?.message || '添加用户失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  // 删除用户
  const handleDeleteUser = async (userId) => {
    Alert.alert(
      '确认删除',
      '确定要删除此用户吗？此操作不可撤销。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await axios.delete(`https://nodered.jzz77.cn:9003/api/users/${userId}`, {
                timeout: 10000
              });
              Alert.alert('成功', '用户已成功删除');
              fetchUsers();
            } catch (error) {
              console.error('删除用户失败:', error);
              Alert.alert('错误', '删除用户失败，请稍后再试');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // 打开编辑用户模态框
  const openEditModal = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  // 更新用户信息
  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      const response = await axios.put(
        `https://nodered.jzz77.cn:9003/api/users/${selectedUser.id}`, 
        selectedUser,
        { timeout: 10000 }
      );

      if (response.status === 200) {
        Alert.alert('成功', '用户信息已更新');
        setShowEditModal(false);
        fetchUsers();
      }
    } catch (error) {
      console.error('更新用户信息失败:', error);
      Alert.alert('错误', '更新用户信息失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  // 打开角色选择模态框
  const openRoleModal = (user) => {
    setUserToChangeRole(user);
    setShowRoleModal(true);
  };

  // 更改用户角色
  const changeUserRole = async (roleId) => {
    if (!userToChangeRole) return;

    try {
      const response = await axios.put(
        `https://nodered.jzz77.cn:9003/api/users/${userToChangeRole.id}/admin-status`,
        { is_admin: roleId },
        { timeout: 10000 }
      );

      if (response.status === 200) {
        // 更新本地用户列表
        setUsers(users.map(u => 
          u.id === userToChangeRole.id ? { ...u, is_admin: roleId } : u
        ));
        setShowRoleModal(false);
      }
    } catch (error) {
      console.error('更新用户角色失败:', error);
      Alert.alert('错误', '更新用户角色失败，请稍后再试');
    }
  };

  // 渲染用户项
  const renderUserItem = ({ item }) => {
    // 防止删除自己
    const isCurrentUser = user && item.id === user.id;
    // 获取角色信息
    const roleId = typeof item.is_admin === 'boolean' ? (item.is_admin ? 1 : 0) : item.is_admin;
    
    return (
      <View style={[styles.userItem, { backgroundColor: colors.card }]}>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text }]}>
            {item.username} {isCurrentUser ? '(你)' : ''}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{item.email}</Text>
          <View style={styles.userDetails}>
            <Text style={[styles.userDetail, { color: colors.textSecondary }]}>
              {item.company || '无公司'} | {item.department || '无部门'}
            </Text>
            <View style={[styles.adminBadge, { backgroundColor: getRoleColor(roleId) }]}>
              <Text style={styles.adminBadgeText}>
                {getRoleName(roleId)}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => openRoleModal(item)}
          >
            <Ionicons 
              name="shield" 
              size={22} 
              color={getRoleColor(roleId)} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => openEditModal(item)}
          >
            <Ionicons name="create-outline" size={22} color="#2196F3" />
          </TouchableOpacity>
          
          {!isCurrentUser && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleDeleteUser(item.id)}
            >
              <Ionicons name="trash-outline" size={22} color="#FF5252" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Android 标题栏
  const AndroidHeader = () => (
    <View style={[styles.androidHeader, { backgroundColor: colors.card }]}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>用户管理</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <Ionicons name="add-circle" size={24} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );

  // 渲染角色选择项
  const renderRoleItem = (roleId) => {
    const role = ROLES[roleId];
    const isSelected = userToChangeRole && 
                      (userToChangeRole.is_admin === roleId || 
                      (userToChangeRole.is_admin === true && roleId === 1));
    
    return (
      <TouchableOpacity
        key={roleId}
        style={[
          styles.roleItem,
          isSelected && { backgroundColor: `${role.color}20` }
        ]}
        onPress={() => changeUserRole(roleId)}
      >
        <View style={[styles.roleBadge, { backgroundColor: role.color }]}>
          <Ionicons name="shield" size={18} color="#fff" />
        </View>
        <Text style={[styles.roleItemText, { color: colors.text }]}>
          {role.name}
        </Text>
        {isSelected && (
          <Ionicons 
            name="checkmark-circle" 
            size={22} 
            color={role.color} 
            style={{ marginLeft: 'auto' }}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {Platform.OS === 'android' && <AndroidHeader />}
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>加载中...</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people" size={60} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                暂无用户数据
              </Text>
            </View>
          }
        />
      )}

      {/* 添加用户模态框 */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>添加新用户</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>用户名 *</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#ddd' 
                  }]}
                  placeholder="请输入用户名"
                  placeholderTextColor={colors.textSecondary}
                  value={newUser.username}
                  onChangeText={(text) => setNewUser({...newUser, username: text})}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>邮箱 *</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#ddd' 
                  }]}
                  placeholder="请输入邮箱"
                  placeholderTextColor={colors.textSecondary}
                  value={newUser.email}
                  onChangeText={(text) => setNewUser({...newUser, email: text})}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>密码 *</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#ddd' 
                  }]}
                  placeholder="请设置密码"
                  placeholderTextColor={colors.textSecondary}
                  value={newUser.password}
                  onChangeText={(text) => setNewUser({...newUser, password: text})}
                  secureTextEntry
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>手机号码 *</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#ddd' 
                  }]}
                  placeholder="请输入手机号码"
                  placeholderTextColor={colors.textSecondary}
                  value={newUser.phone}
                  onChangeText={(text) => setNewUser({...newUser, phone: text})}
                  keyboardType="phone-pad"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>公司</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#ddd' 
                  }]}
                  placeholder="请输入公司名称"
                  placeholderTextColor={colors.textSecondary}
                  value={newUser.company}
                  onChangeText={(text) => setNewUser({...newUser, company: text})}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>部门</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#ddd' 
                  }]}
                  placeholder="请输入部门"
                  placeholderTextColor={colors.textSecondary}
                  value={newUser.department}
                  onChangeText={(text) => setNewUser({...newUser, department: text})}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>用户角色</Text>
                <View style={styles.roleSelector}>
                  {Object.keys(ROLES).map(roleId => {
                    const role = ROLES[roleId];
                    return (
                      <TouchableOpacity
                        key={roleId}
                        style={[
                          styles.roleChip,
                          { borderColor: role.color },
                          newUser.is_admin === parseInt(roleId) && { backgroundColor: `${role.color}20` }
                        ]}
                        onPress={() => setNewUser({...newUser, is_admin: parseInt(roleId)})}
                      >
                        <Text 
                          style={[
                            styles.roleChipText, 
                            { color: role.color }
                          ]}
                        >
                          {role.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
            
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleAddUser}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>添加用户</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 编辑用户模态框 */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        {selectedUser && (
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>编辑用户</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>用户名</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#ddd' 
                    }]}
                    value={selectedUser.username}
                    onChangeText={(text) => setSelectedUser({...selectedUser, username: text})}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>邮箱</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#ddd' 
                    }]}
                    value={selectedUser.email}
                    onChangeText={(text) => setSelectedUser({...selectedUser, email: text})}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>手机号码</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#ddd' 
                    }]}
                    value={selectedUser.phone}
                    onChangeText={(text) => setSelectedUser({...selectedUser, phone: text})}
                    keyboardType="phone-pad"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>公司</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#ddd' 
                    }]}
                    value={selectedUser.company}
                    onChangeText={(text) => setSelectedUser({...selectedUser, company: text})}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>部门</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#ddd' 
                    }]}
                    value={selectedUser.department}
                    onChangeText={(text) => setSelectedUser({...selectedUser, department: text})}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>用户角色</Text>
                  <View style={styles.roleSelector}>
                    {Object.keys(ROLES).map(roleId => {
                      const role = ROLES[roleId];
                      const isSelected = selectedUser.is_admin === parseInt(roleId) || 
                                        (selectedUser.is_admin === true && parseInt(roleId) === 1);
                      return (
                        <TouchableOpacity
                          key={roleId}
                          style={[
                            styles.roleChip,
                            { borderColor: role.color },
                            isSelected && { backgroundColor: `${role.color}20` }
                          ]}
                          onPress={() => setSelectedUser({...selectedUser, is_admin: parseInt(roleId)})}
                        >
                          <Text 
                            style={[
                              styles.roleChipText, 
                              { color: role.color }
                            ]}
                          >
                            {role.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>
              
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={handleUpdateUser}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>保存修改</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

      {/* 角色选择模态框 */}
      <Modal
        visible={showRoleModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { 
            backgroundColor: colors.card,
            width: '80%',
            maxHeight: 500
          }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>选择用户角色</Text>
              <TouchableOpacity onPress={() => setShowRoleModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={{ marginBottom: 20 }}>
              {Object.keys(ROLES).map(roleId => renderRoleItem(parseInt(roleId)))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  androidHeader: {
    height: 56 + (Platform.OS === 'android' ? StatusBar.currentHeight : 0),
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 6,
  },
  userDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  userDetail: {
    fontSize: 12,
    marginRight: 8,
  },
  adminBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingLeft: 12,
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  formContainer: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  roleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    margin: 4,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  roleItemText: {
    fontSize: 16,
    marginLeft: 12,
  },
  roleBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default UserManagementScreen; 