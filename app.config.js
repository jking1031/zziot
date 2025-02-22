export default {
  expo: {
    name: 'ZZIOT',
    slug: 'zziot',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    assetBundlePatterns: [
      '**/*'
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.zziot.app',
      buildNumber: '1',
      infoPlist: {
        NSCameraUsageDescription: '此应用需要访问相机以扫描二维码',
        NSPhotoLibraryUsageDescription: '此应用需要访问照片以上传图片',
        NSLocationWhenInUseUsageDescription: '此应用需要访问位置信息以显示站点位置',
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      package: 'com.zziot.app',
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      permissions: [
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'ACCESS_FINE_LOCATION'
      ]
    },
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      eas: {
        projectId: "2fddd55d-e4c9-49dd-bcb8-b13091433ca1"
      }
    },
    plugins: [
      [
        "expo-camera",
        {
          "cameraPermission": "此应用需要访问相机以扫描二维码"
        }
      ]
    ],
    updates: {
      fallbackToCacheTimeout: 0,
      url: 'your-update-url'
    },

  }
}