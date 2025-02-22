import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [followSystem, setFollowSystem] = useState(true);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
    setFollowSystem(false);
  };

  const toggleFollowSystem = () => {
    setFollowSystem(prev => !prev);
    if (!followSystem) {
      setIsDarkMode(systemColorScheme === 'dark');
    }
  };

  useEffect(() => {
    if (followSystem) {
      setIsDarkMode(systemColorScheme === 'dark');
    }
  }, [systemColorScheme, followSystem]);

  const theme = {
    isDarkMode,
    toggleTheme,
    followSystem,
    toggleFollowSystem,
    colors: {
      background: isDarkMode ? '#1a1a1a' : '#f5f5f5',
      card: isDarkMode ? '#2a2a2a' : '#ffffff',
      text: isDarkMode ? '#ffffff' : '#333333',
      headerBackground: isDarkMode ? '#1a1a1a' : '#2196F3',
      headerText: '#ffffff',
      tabBarBackground: isDarkMode ? '#1a1a1a' : '#ffffff',
      tabBarActive: isDarkMode ? '#81b0ff' : '#2196F3',
      tabBarInactive: isDarkMode ? '#666666' : 'gray',
      primary: isDarkMode ? '#81b0ff' : '#2196F3',
      border: isDarkMode ? '#444444' : '#dddddd'
    },
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};