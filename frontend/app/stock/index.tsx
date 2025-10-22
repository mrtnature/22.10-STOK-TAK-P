import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS, TYPOGRAPHY } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import { deleteStockItem } from '../../lib/database';
import Modal from 'react-native-modal';
import StockForm from '../../components/StockForm';

export default function StockScreen() {
  const router = useRouter();
  const { stockItems, refreshStock } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const handleAdd = () => {
    setEditingItem(null);
    setModalVisible(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setModalVisible(true);
  };

  const handleDelete = (item: any) => {
    Alert.alert(
      'Silme Onayı',
      `${item.name} ürününü silmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStockItem(item.id);
              await refreshStock();
            } catch (error) {
              Alert.alert('Hata', 'Silme işlemi sırasında bir hata oluştu.');
            }
          },
        },
      ]
    );
  };

  const handleFormClose = async () => {
    setModalVisible(false);
    setEditingItem(null);
    await refreshStock();
  };

  const renderItem = ({ item }: { item: any }) => {
    const isCritical = item.on_hand_qty < item.critical_qty;

    return (
      <View style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <View style={styles.itemTitleRow}>
            <Text style={styles.itemName}>{item.name}</Text>
            {isCritical && (
              <View style={styles.criticalBadge}>
                <Ionicons name="warning" size={14} color="#FFFFFF" />
                <Text style={styles.criticalText}>Kritik</Text>
              </View>
            )}
          </View>
          {item.sku && <Text style={styles.itemSku}>SKU: {item.sku}</Text>}
        </View>

        <View style={styles.itemDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Miktar</Text>
            <Text style={[styles.detailValue, isCritical && styles.criticalValue]}>
              {item.on_hand_qty} {item.unit}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Kritik Seviye</Text>
            <Text style={styles.detailValue}>
              {item.critical_qty} {item.unit}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Ort. Maliyet</Text>
            <Text style={styles.detailValue}>₺{item.avg_cost.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.itemActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.primaryLight + '15' }]}
            onPress={() => handleEdit(item)}
          >
            <Ionicons name="pencil" size={18} color={COLORS.primaryLight} />
            <Text style={[styles.actionText, { color: COLORS.primaryLight }]}>Düzenle</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.danger + '15' }]}
            onPress={() => handleDelete(item)}
          >
            <Ionicons name="trash" size={18} color={COLORS.danger} />
            <Text style={[styles.actionText, { color: COLORS.danger }]}>Sil</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stok Takip</Text>
        <TouchableOpacity onPress={handleAdd} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {stockItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>Henüz stok öğesi yok</Text>
          <Text style={styles.emptySubtext}>Yeni stok eklemek için + butonuna basın</Text>
        </View>
      ) : (
        <FlatList
          data={stockItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        isVisible={modalVisible}
        onBackdropPress={() => setModalVisible(false)}
        style={styles.modal}
        avoidKeyboard
      >
        <View style={styles.modalContent}>
          <StockForm item={editingItem} onClose={handleFormClose} />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    width: 40,
    alignItems: 'flex-end',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  itemCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  itemHeader: {
    marginBottom: SPACING.md,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  itemName: {
    ...TYPOGRAPHY.h3,
    flex: 1,
  },
  criticalBadge: {
    backgroundColor: COLORS.danger,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: SPACING.sm,
  },
  criticalText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  itemSku: {
    ...TYPOGRAPHY.caption,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  criticalValue: {
    color: COLORS.danger,
  },
  itemActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    ...TYPOGRAPHY.h3,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    ...TYPOGRAPHY.caption,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
});
