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
import { deleteCustomer } from '../../lib/database';
import Modal from 'react-native-modal';
import CustomerForm from '../../components/CustomerForm';

export default function CustomersScreen() {
  const router = useRouter();
  const { customers, refreshCustomers } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);

  const handleAdd = () => {
    setEditingCustomer(null);
    setModalVisible(true);
  };

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setModalVisible(true);
  };

  const handleDelete = (customer: any) => {
    Alert.alert(
      'Silme Onayı',
      `${customer.name} müşterisini silmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCustomer(customer.id);
              await refreshCustomers();
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
    setEditingCustomer(null);
    await refreshCustomers();
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Ionicons name="person-circle" size={48} color={COLORS.primaryLight} />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          {item.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call" size={14} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>{item.phone}</Text>
            </View>
          )}
          {item.email && (
            <View style={styles.infoRow}>
              <Ionicons name="mail" size={14} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>{item.email}</Text>
            </View>
          )}
        </View>
      </View>

      {item.address && (
        <View style={styles.addressContainer}>
          <Ionicons name="location" size={14} color={COLORS.textSecondary} />
          <Text style={styles.addressText}>{item.address}</Text>
        </View>
      )}

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Müşteri Bilgileri</Text>
        <TouchableOpacity onPress={handleAdd} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {customers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>Henüz müşteri yok</Text>
          <Text style={styles.emptySubtext}>Yeni müşteri eklemek için + butonuna basın</Text>
        </View>
      ) : (
        <FlatList
          data={customers}
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
          <CustomerForm customer={editingCustomer} onClose={handleFormClose} />
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
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  itemInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  itemName: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoText: {
    ...TYPOGRAPHY.caption,
    marginLeft: 4,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 6,
    marginBottom: SPACING.md,
  },
  addressText: {
    ...TYPOGRAPHY.caption,
    marginLeft: 4,
    flex: 1,
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
