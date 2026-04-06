import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkPin = async () => {
      const pinSet = await AsyncStorage.getItem('pin_set');
      if (pinSet === 'true') {
        router.replace('/login');
      } else {
        router.replace('/setup-pin');
      }
    };
    checkPin();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2c3e50" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
});