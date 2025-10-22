import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS, SPACING, SHADOWS, TYPOGRAPHY } from '../../constants/theme';
import { exportDatabase, importDatabase } from '../../lib/database';
import { useApp } from '../../contexts/AppContext';
import { format } from 'date-fns';

export default function SettingsScreen() {
  const { refreshAll } = useApp();
  const [loading, setLoading] = useState(false);

  const handleBackup = async () => {
    try {
      setLoading(true);
      const data = await exportDatabase();
      const fileName = `erpstok_backup_${format(new Date(), 'yyyyMMdd_HHmm')}.json`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(data, null, 2));

      Alert.alert(
        'Başarılı',
        `Yedek dosyası oluşturuldu: ${fileName}`,
        [
          {
            text: 'Paylaş',
            onPress: () => handleShareBackup(filePath),
          },
          { text: 'Tamam' },
        ]
      );
    } catch (error) {
      console.error('Backup error:', error);
      Alert.alert('Hata', 'Yedekleme sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleShareBackup = async (filePath?: string) => {
    try {
      setLoading(true);
      let fileToShare = filePath;

      if (!fileToShare) {
        // Find most recent backup
        const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory!);
        const backupFiles = files.filter(f => f.startsWith('erpstok_backup_'));
        if (backupFiles.length === 0) {
          Alert.alert('Hata', 'Paylaşılacak yedek dosyası bulunamadı. Önce yedek oluşturun.');
          return;
        }
        backupFiles.sort().reverse();
        fileToShare = `${FileSystem.documentDirectory}${backupFiles[0]}`;
      }

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileToShare);
      } else {
        Alert.alert('Hata', 'Paylaşım bu cihazda desteklenmiyor.');
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Hata', 'Paylaşım sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      setLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const data = JSON.parse(fileContent);

      Alert.alert(
        'Onay',
        'Yedek dosyasını yüklemek istediğinizden emin misiniz? Mevcut veriler birleştirilecektir.',
        [
          {
            text: 'İptal',
            style: 'cancel',
          },
          {
            text: 'Yükle',
            onPress: async () => {
              try {
                await importDatabase(data);
                await refreshAll();
                Alert.alert('Başarılı', 'Yedek başarıyla yüklendi.');
              } catch (error) {
                console.error('Import error:', error);
                Alert.alert('Hata', 'Yedek yükleme sırasında bir hata oluştu.');
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Hata', 'Dosya seçimi sırasında bir hata oluştu.');
      setLoading(false);
    }
  };

  const settingsOptions = [
    {
      title: 'Yedek Al',
      subtitle: 'Tüm verileri JSON olarak dışa aktar',
      icon: 'download' as const,
      color: COLORS.primary,
      onPress: handleBackup,
    },
    {
      title: 'Yedeği Paylaş',
      subtitle: 'Son yedeği WhatsApp, e-posta ile paylaş',
      icon: 'share-social' as const,
      color: COLORS.accent,
      onPress: () => handleShareBackup(),
    },
    {
      title: 'Yedek Yükle',
      subtitle: 'JSON dosyasından verileri içe aktar',
      icon: 'cloud-upload' as const,
      color: COLORS.warning,
      onPress: handleImport,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yedekleme ve Geri Yükleme</Text>
          {settingsOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionCard}
              onPress={option.onPress}
              disabled={loading}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: option.color + '15' }]}>
                <Ionicons name={option.icon} size={24} color={option.color} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
              </View>
              {loading ? (
                <ActivityIndicator size="small" color={option.color} />
              ) : (
                <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoSection}>
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Yedek dosyaları cihazınızda saklanır ve WhatsApp, e-posta gibi uygulamalar ile
            paylaşılabilir. Verileriniz sadece bu cihazda tutulur.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>ERP-STOK v1.0.0</Text>
          <Text style={styles.footerSubtext}>Offline-first Stok Yönetim Sistemi</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.md,
  },
  optionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.card,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionSubtitle: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
  },
  infoSection: {
    backgroundColor: COLORS.primaryLight + '15',
    borderRadius: 8,
    padding: SPACING.md,
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  infoText: {
    ...TYPOGRAPHY.caption,
    flex: 1,
    marginLeft: SPACING.sm,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  footerText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  footerSubtext: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    marginTop: SPACING.xs,
  },
});
