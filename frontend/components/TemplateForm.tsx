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
import { Picker } from '@react-native-picker/picker';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { createTemplate, updateTemplate, getTemplateItems } from '../lib/database';
import { useApp } from '../contexts/AppContext';

interface TemplateFormProps {
  template?: any;
  onClose: () => void;
}

export default function TemplateForm({ template, onClose }: TemplateFormProps) {
  const { stockItems } = useApp();
  const [name, setName] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ item_id: number; qty: number; name: string; unit: string; avg_cost: number }[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [qty, setQty] = useState('');

  useEffect(() => {
    if (template) {
      loadTemplate();
    }
  }, [template]);

  const loadTemplate = async () => {
    if (!template) return;
    setName(template.name);
    const items = await getTemplateItems(template.id);
    setSelectedItems(
      items.map((item) => ({
        item_id: item.item_id,
        qty: item.qty,
        name: item.name,
        unit: item.unit,
        avg_cost: item.avg_cost,
      }))
    );
  };

  const handleAddItem = () => {
    if (!selectedItemId) {
      Alert.alert('Hata', 'Lütfen bir ürün seçin.');
      return;
    }
    if (!qty || parseFloat(qty) <= 0) {
      Alert.alert('Hata', 'Geçerli bir miktar girin.');
      return;
    }

    const stockItem = stockItems.find((item) => item.id === selectedItemId);
    if (!stockItem) return;

    setSelectedItems([
      ...selectedItems,
      {
        item_id: selectedItemId,
        qty: parseFloat(qty),
        name: stockItem.name,
        unit: stockItem.unit,
        avg_cost: stockItem.avg_cost,
      },
    ]);
    setSelectedItemId(null);
    setQty('');
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const calculateTotalCost = () => {
    return selectedItems.reduce((total, item) => total + item.qty * item.avg_cost, 0);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Şablon adı zorunludur.');
      return;
    }
    if (selectedItems.length === 0) {
      Alert.alert('Hata', 'En az bir ürün ekleyin.');
      return;
    }

    try {
      const items = selectedItems.map((item) => ({
        item_id: item.item_id,
        qty: item.qty,
      }));

      if (template) {
        await updateTemplate(template.id, name.trim(), items);
        Alert.alert('Başarılı', 'Şablon güncellendi.');
      } else {
        await createTemplate(name.trim(), items);
        Alert.alert('Başarılı', 'Yeni şablon oluşturuldu.');
      }

      onClose();
    } catch (error) {
      console.error('Template form error:', error);
      Alert.alert('Hata', 'Bir hata oluştu.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {template ? 'Şablon Düzenle' : 'Yeni Şablon Oluştur'}
        </Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <View style={styles.field}>
          <Text style={styles.label}>
            Şablon Adı <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Örn: T-Shirt Üretimi"
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ürünler Ekle</Text>

          <View style={styles.addItemContainer}>
            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Ürün Seç</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedItemId}
                  onValueChange={(value) => setSelectedItemId(value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Ürün seçin..." value={null} color={COLORS.textSecondary} />
                  {stockItems.map((item) => (
                    <Picker.Item
                      key={item.id}
                      label={`${item.name} (${item.on_hand_qty} ${item.unit})`}
                      value={item.id}
                      color={COLORS.text}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.qtyContainer}>
              <Text style={styles.label}>Miktar</Text>
              <TextInput
                style={styles.input}
                value={qty}
                onChangeText={setQty}
                placeholder="0"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity style={styles.addItemButton} onPress={handleAddItem}>
              <Ionicons name="add-circle" size={32} color={COLORS.accent} />
            </TouchableOpacity>
          </View>

          {selectedItems.length > 0 && (
            <View style={styles.selectedItemsList}>
              {selectedItems.map((item, index) => (
                <View key={index} style={styles.selectedItem}>
                  <View style={styles.selectedItemInfo}>
                    <Text style={styles.selectedItemName}>{item.name}</Text>
                    <Text style={styles.selectedItemDetails}>
                      {item.qty} {item.unit} × ₺{item.avg_cost.toFixed(2)} = ₺
                      {(item.qty * item.avg_cost).toFixed(2)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveItem(index)}>
                    <Ionicons name="close-circle" size={24} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              ))}

              <View style={styles.totalCost}>
                <Text style={styles.totalCostLabel}>Toplam Maliyet:</Text>
                <Text style={styles.totalCostValue}>₺{calculateTotalCost().toFixed(2)}</Text>
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>{template ? 'Güncelle' : 'Oluştur'}</Text>
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
  label: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    color: COLORS.text,
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
  section: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.md,
  },
  addItemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  pickerContainer: {
    flex: 2,
  },
  pickerWrapper: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    color: COLORS.text,
  },
  qtyContainer: {
    flex: 1,
  },
  addItemButton: {
    padding: SPACING.xs,
  },
  selectedItemsList: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.md,
  },
  selectedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectedItemInfo: {
    flex: 1,
  },
  selectedItemName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  selectedItemDetails: {
    ...TYPOGRAPHY.caption,
  },
  totalCost: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 2,
    borderTopColor: COLORS.border,
  },
  totalCostLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  totalCostValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
