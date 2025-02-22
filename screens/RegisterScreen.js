import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [department, setDepartment] = useState('');
  const [avatarSeed] = useState(Math.random().toString(36).substring(2, 15));
  const [usernameError, setUsernameError] = useState('');

  const validateUsername = (text) => {
    const chineseRegex = /^[\u4e00-\u9fff]{2,4}$/;
    if (!chineseRegex.test(text) && text !== '') {
      setUsernameError('用户名必须是2-4个汉字');
      return false;
    }
    setUsernameError('');
    return true;
  };

  const handleRegister = async () => {
    try {
      if (!validateUsername(username)) {
        Alert.alert('错误', '请输入正确的用户名');
        return;
      }
      if (!username || !email || !password || !confirmPassword || !phone || !company || !department) {
        Alert.alert('错误', '请填写完整的注册信息');
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert('错误', '两次输入的密码不一致');
        return;
      }

      const response = await fetch('http://112.28.56.235:13100/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
          phone,
          company,
          department,
          avatar_seed: avatarSeed
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '注册失败');
      }

      Alert.alert('成功', '注册成功', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Login')
        }
      ]);
    } catch (error) {
      Alert.alert('错误', error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="person-add-outline" size={100} color="#2196F3" />
      </View>
      <View style={styles.form}>
        <Text style={styles.inputLabel}>请输入您的真实姓名</Text>
        <TextInput
          style={[styles.input, usernameError ? styles.inputError : null]}
          placeholder="姓名"
          value={username}
          onChangeText={(text) => {
            setUsername(text);
            validateUsername(text);
          }}
          autoCapitalize="none"
        />
        {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}
        <TextInput
          style={styles.input}
          placeholder="邮箱"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="密码"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="确认密码"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="电话"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="公司"
          value={company}
          onChangeText={setCompany}
        />
        <TextInput
          style={styles.input}
          placeholder="部门"
          value={department}
          onChangeText={setDepartment}
        />
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>注册</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginText}>已有账号？立即登录</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  form: {
    width: '100%',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2196F3',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    marginTop: 15,
    alignItems: 'center',
  },
  loginText: {
    color: '#2196F3',
    fontSize: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  inputError: {
    borderColor: '#ff0000',
  },
  errorText: {
    color: '#ff0000',
    fontSize: 12,
    marginBottom: 10,
  },
});

export default RegisterScreen;