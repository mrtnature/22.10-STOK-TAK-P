import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { getTemplateItems, createOrder, createCustomer, recordStockOut, getStockItem } from '../lib/database';
import { useApp } from '../contexts/AppContext';

interface ProductionFlowProps {
  template: any;
  onClose: () => void;
}

export default function ProductionFlow({ template, onClose }: ProductionFlowProps) {
  const { refreshOrders, refreshStock, refreshCustomers, refreshNotifications } = useApp();
  const [templateItems, setTemplateItems] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [salePrice, setSalePrice] = useState('');

  useEffect(() => {
    loadTemplateData();
  }, [template]);

  const loadTemplateData = async () => {
    const items = await getTemplateItems(template.id);
    setTemplateItems(items);
  };

  const calculateTotalCost = () => {
    return templateItems.reduce((total, item) => total + item.qty * item.avg_cost, 0);
  };

  const handleProduce = async () => {
    if (!customerName.trim()) {
      Alert.alert('Hata', 'Müşteri adı zorunludur.');
      return;
    }
    if (!salePrice || parseFloat(salePrice) <= 0) {
      Alert.alert('Hata', 'Satış fiyatı zorunludur.');
      return;
    }

    // Check stock availability
    for (const item of templateItems) {
      const stockItem = await getStockItem(item.item_id);
      if (!stockItem || stockItem.on_hand_qty < item.qty) {
        Alert.alert(
          'Yetersiz Stok',
          `${item.name} için yeterli stok yok. Gerekli: ${item.qty} ${item.unit}, Mevcut: ${stockItem?.on_hand_qty || 0} ${item.unit}`
        );
        return;
      }
    }

    Alert.alert(
      'Üretim Onayı',
      'Üretimi başlatmak istediğinizden emin misiniz? Stok otomatik olarak düşülecektir.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Üret',
          onPress: async () => {
            try {
              // Create or get customer
              const customerId = await createCustomer({
                name: customerName.trim(),
                email: email.trim(),
                phone: phone.trim(),
                address: address.trim(),
              });

              // Deduct stock
              for (const item of templateItems) {
                await recordStockOut(
                  item.item_id,
                  item.qty,
                  new Date().toISOString(),
                  `Üretim: ${template.name}`
                );
              }

              // Create order
              await createOrder({
                customer_id: customerId,
                template_id: template.id,
                status: 'ordered',
                sale_price: parseFloat(salePrice),
                shipper: '',
                tracking_code: '',
              });

              await refreshOrders();
              await refreshStock();
              await refreshCustomers();
              await refreshNotifications();

              Alert.alert('Başarılı', 'Üretim tamamlandı ve sipariş oluşturuldu.');
              onClose();
            } catch (error: any) {
              console.error('Production flow error:', error);
              Alert.alert('Hata', error.message || 'Bir hata oluştu.');
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Üretim: {template.name}</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kullanılacak Malzemeler</Text>
          <View style={styles.itemsList}>
            {templateItems.map((item, index) => (
              <View key={index} style={styles.item}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQty}>
                  {item.qty} {item.unit}
                </Text>
                <Text style={styles.itemCost}>₺{(item.qty * item.avg_cost).toFixed(2)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Toplam Maliyet:</Text>
              <Text style={styles.totalValue}>₺{calculateTotalCost().toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Müşteri Bilgileri</Text>

          <View style={styles.field}>
            <Text style={styles.label}>
              Ad Soyad <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Müşteri adı"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Telefon</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="05XX XXX XX XX"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>E-posta</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="ornek@mail.com"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Adres</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={address}
              onChangeText={setAddress}
              placeholder="Teslimat adresi"
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Satış Fiyatı (₺) <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={salePrice}
              onChangeText={setSalePrice}
              placeholder="0.00"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleProduce}>
          <Text style={styles.submitButtonText}>Üretimi Tamamla ve Sipariş Oluştur</Text>
        </TouchableOpacity>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    flex: 1,
  },
  form: {
    flex: 1,
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.md,
  },
  itemsList: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.md,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemName: {
    ...TYPOGRAPHY.body,
    flex: 2,
  },
  itemQty: {
    ...TYPOGRAPHY.caption,
    flex: 1,
    textAlign: 'right',
  },
  itemCost: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 2,
    borderTopColor: COLORS.border,
  },
  totalLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  totalValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
  },
  field: {
    marginBottom: SPACING.md,
  },
  label: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  required: {
    color: COLORS.danger,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: COLORS.accent,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
