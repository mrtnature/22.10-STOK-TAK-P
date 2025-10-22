import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function WebOnlyScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="phone-portrait" size={80} color="#1E3A8A" />
      <Text style={styles.title}>ERP-STOK</Text>
      <Text style={styles.subtitle}>Mobil Uygulama</Text>
      <Text style={styles.message}>
        Bu uygulama sadece mobil cihazlarda çalışır.
      </Text>
      <Text style={styles.instruction}>
        Lütfen iOS veya Android cihazınızda Expo Go uygulaması ile QR kodu tarayın.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E3A8A',
    marginTop: 24,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 8,
  },
  message: {
    fontSize: 18,
    color: '#111827',
    marginTop: 32,
    textAlign: 'center',
  },
  instruction: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
});
