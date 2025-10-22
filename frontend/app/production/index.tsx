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
import { deleteTemplate } from '../../lib/database';
import Modal from 'react-native-modal';
import TemplateForm from '../../components/TemplateForm';
import ProductionFlow from '../../components/ProductionFlow';

export default function ProductionScreen() {
  const router = useRouter();
  const { templates, refreshTemplates } = useApp();
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [produceModalVisible, setProduceModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const handleAdd = () => {
    setEditingTemplate(null);
    setFormModalVisible(true);
  };

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    setFormModalVisible(true);
  };

  const handleDelete = (template: any) => {
    Alert.alert(
      'Silme Onayı',
      `${template.name} şablonunu silmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTemplate(template.id);
              await refreshTemplates();
            } catch (error) {
              Alert.alert('Hata', 'Silme işlemi sırasında bir hata oluştu.');
            }
          },
        },
      ]
    );
  };

  const handleProduce = (template: any) => {
    setSelectedTemplate(template);
    setProduceModalVisible(true);
  };

  const handleFormClose = async () => {
    setFormModalVisible(false);
    setEditingTemplate(null);
    await refreshTemplates();
  };

  const handleProduceClose = async () => {
    setProduceModalVisible(false);
    setSelectedTemplate(null);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Ionicons name="construct" size={24} color={COLORS.accent} />
        <Text style={styles.itemName}>{item.name}</Text>
      </View>

      <View style={styles.itemActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.accent + '15' }]}
          onPress={() => handleProduce(item)}
        >
          <Ionicons name="play" size={18} color={COLORS.accent} />
          <Text style={[styles.actionText, { color: COLORS.accent }]}>Üret</Text>
        </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Üretim Süreçleri</Text>
        <TouchableOpacity onPress={handleAdd} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {templates.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="construct-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>Henüz şablon yok</Text>
          <Text style={styles.emptySubtext}>Yeni şablon eklemek için + butonuna basın</Text>
        </View>
      ) : (
        <FlatList
          data={templates}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        isVisible={formModalVisible}
        onBackdropPress={() => setFormModalVisible(false)}
        style={styles.modal}
        avoidKeyboard
      >
        <View style={styles.modalContent}>
          <TemplateForm template={editingTemplate} onClose={handleFormClose} />
        </View>
      </Modal>

      <Modal
        isVisible={produceModalVisible}
        onBackdropPress={() => setProduceModalVisible(false)}
        style={styles.modal}
        avoidKeyboard
      >
        <View style={styles.modalContent}>
          <ProductionFlow template={selectedTemplate} onClose={handleProduceClose} />
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
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  itemName: {
    ...TYPOGRAPHY.h3,
    marginLeft: SPACING.sm,
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
