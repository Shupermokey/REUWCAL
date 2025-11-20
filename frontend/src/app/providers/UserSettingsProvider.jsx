import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserSettings } from '../../services/firestoreService';
import { useAuth } from './AuthProvider';

const UserSettingsContext = createContext({
  settings: {
    accountingFormat: false,
  },
  setSettings: () => {},
});

export function UserSettingsProvider({ children }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    accountingFormat: false,
  });

  useEffect(() => {
    if (!user) return;

    const loadSettings = async () => {
      try {
        const userSettings = await getUserSettings(user.uid);
        if (userSettings) {
          setSettings(prev => ({ ...prev, ...userSettings }));
        }
      } catch (err) {
        console.error('Error loading user settings:', err);
      }
    };

    loadSettings();
  }, [user]);

  return (
    <UserSettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings() {
  return useContext(UserSettingsContext);
}
