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
import { createStockItem, updateStockItem, recordStockIn } from '../lib/database';
import { format } from 'date-fns';

interface StockFormProps {
  item?: any;
  onClose: () => void;
}

export default function StockForm({ item, onClose }: StockFormProps) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [unit, setUnit] = useState('adet');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [criticalQty, setCriticalQty] = useState('');
  const [supplier, setSupplier] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    if (item) {
      setName(item.name);
      setSku(item.sku || '');
      setUnit(item.unit);
      setCriticalQty(item.critical_qty.toString());
      // For edit, we don't pre-fill quantity and price
    }
  }, [item]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Ürün adı zorunludur.');
      return;
    }
    if (!unit.trim()) {
      Alert.alert('Hata', 'Birim zorunludur.');
      return;
    }

    try {
      if (item) {
        // Update existing item
        await updateStockItem(item.id, {
          name: name.trim(),
          sku: sku.trim(),
          unit: unit.trim(),
          critical_qty: parseFloat(criticalQty) || 0,
        });

        // If quantity and price are provided, record stock in
        if (quantity && unitPrice) {
          await recordStockIn(
            item.id,
            parseFloat(quantity),
            parseFloat(unitPrice),
            supplier.trim(),
            date
          );
        }

        Alert.alert('Başarılı', 'Stok güncellendi.');
      } else {
        // Create new item
        if (!quantity || !unitPrice) {
          Alert.alert('Hata', 'Miktar ve birim fiyat zorunludur.');
          return;
        }

        const itemId = await createStockItem({
          name: name.trim(),
          sku: sku.trim(),
          unit: unit.trim(),
          critical_qty: parseFloat(criticalQty) || 0,
          on_hand_qty: 0,
          avg_cost: 0,
        });

        await recordStockIn(
          itemId,
          parseFloat(quantity),
          parseFloat(unitPrice),
          supplier.trim(),
          date
        );

        Alert.alert('Başarılı', 'Yeni stok eklendi.');
      }

      onClose();
    } catch (error) {
      console.error('Stock form error:', error);
      Alert.alert('Hata', 'Bir hata oluştu.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{item ? 'Stok Düzenle' : 'Yeni Stok Ekle'}</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <View style={styles.field}>
          <Text style={styles.label}>
            Ürün Adı <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Örn: Pamuk Kumaş"
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>SKU</Text>
          <TextInput
            style={styles.input}
            value={sku}
            onChangeText={setSku}
            placeholder="Örn: KMS-001"
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>
              Miktar <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="0"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>
              Birim <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={unit}
              onChangeText={setUnit}
              placeholder="adet/metre"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            Birim Fiyat (₺) <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={unitPrice}
            onChangeText={setUnitPrice}
            placeholder="0.00"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Kritik Stok Seviyesi</Text>
          <TextInput
            style={styles.input}
            value={criticalQty}
            onChangeText={setCriticalQty}
            placeholder="0"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Tedarikçi</Text>
          <TextInput
            style={styles.input}
            value={supplier}
            onChangeText={setSupplier}
            placeholder="Tedarikçi adı"
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            Tarih <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>{item ? 'Güncelle' : 'Kaydet'}</Text>
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
  },
  form: {
    flex: 1,
    padding: SPACING.lg,
  },
  field: {
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
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
  submitButton: {
    backgroundColor: COLORS.primary,
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
