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
import * as Linking from 'expo-linking';
import { COLORS, SPACING, SHADOWS, TYPOGRAPHY } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import { updateOrder } from '../../lib/database';
import Modal from 'react-native-modal';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  ordered: { label: 'Sipariş Alındı', color: COLORS.warning, icon: 'cart' as const, nextStatus: 'production' },
  production: { label: 'Üretimde', color: COLORS.primary, icon: 'construct' as const, nextStatus: 'shipped' },
  shipped: { label: 'Kargoda', color: COLORS.primaryLight, icon: 'airplane' as const, nextStatus: 'completed' },
  completed: { label: 'Tamamlandı', color: COLORS.success, icon: 'checkmark-circle' as const, nextStatus: null },
};

export default function SalesScreen() {
  const router = useRouter();
  const { orders, refreshOrders } = useApp();
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [shippingInfo, setShippingInfo] = useState({ shipper: '', tracking_code: '' });

  const handleViewDetail = (order: any) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
  };

  const handleStatusChange = async (order: any) => {
    const statusConfig = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
    if (!statusConfig.nextStatus) return;

    const nextStatusConfig = STATUS_CONFIG[statusConfig.nextStatus as keyof typeof STATUS_CONFIG];

    if (statusConfig.nextStatus === 'shipped') {
      // Ask for shipping info
      Alert.prompt(
        'Kargo Bilgileri',
        'Kargo şirketini girin:',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Devam',
            onPress: (shipper) => {
              Alert.prompt(
                'Takip Kodu',
                'Takip kodunu girin:',
                [
                  { text: 'İptal', style: 'cancel' },
                  {
                    text: 'Güncelle',
                    onPress: async (trackingCode) => {
                      await updateOrderStatus(order, statusConfig.nextStatus, shipper, trackingCode);
                    },
                  },
                ],
                'plain-text'
              );
            },
          },
        ],
        'plain-text'
      );
      return;
    }

    Alert.alert(
      'Durum Güncellemesi',
      `Sipariş durumunu "${nextStatusConfig.label}" olarak güncellemek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Güncelle',
          onPress: () => updateOrderStatus(order, statusConfig.nextStatus),
        },
      ]
    );
  };

  const updateOrderStatus = async (
    order: any,
    newStatus: string | null,
    shipper?: string,
    trackingCode?: string
  ) => {
    if (!newStatus) return;

    try {
      const updateData: any = { status: newStatus };
      if (shipper) updateData.shipper = shipper;
      if (trackingCode) updateData.tracking_code = trackingCode;

      await updateOrder(order.id, updateData);
      await refreshOrders();

      // Offer to send email
      const nextStatusConfig = STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG];
      Alert.alert(
        'Başarılı',
        `Sipariş durumu "${nextStatusConfig.label}" olarak güncellendi. Müşteriye e-posta göndermek ister misiniz?`,
        [
          { text: 'Hayır' },
          {
            text: 'E-posta Gönder',
            onPress: () => sendEmail(order, newStatus, shipper, trackingCode),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Hata', 'Durum güncellenemedi.');
    }
  };

  const sendEmail = (
    order: any,
    status: string,
    shipper?: string,
    trackingCode?: string
  ) => {
    const statusConfig = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
    const subject = `Sipariş Durumu: ${statusConfig.label}`;
    let body = `Merhaba ${order.customer_name},\n\n`;
    body += `Siparişiniz (${order.template_name}) "${statusConfig.label}" durumuna geçti.\n\n`;

    if (shipper && trackingCode) {
      body += `Kargo Bilgileri:\n`;
      body += `Kargo Şirketi: ${shipper}\n`;
      body += `Takip Kodu: ${trackingCode}\n\n`;
    }

    body += `Teşekkür ederiz.`;

    const emailUrl = `mailto:${order.customer_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    Linking.openURL(emailUrl).catch(() => {
      Alert.alert('Hata', 'E-posta uygulaması açılamadı.');
    });
  };

  const calculateProfit = (order: any) => {
    // This would need to fetch template items and calculate cost
    // For now, we'll show a placeholder
    return 0;
  };

  const renderItem = ({ item }: { item: any }) => {
    const statusConfig = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG];

    return (
      <TouchableOpacity
        style={styles.itemCard}
        onPress={() => handleViewDetail(item)}
        activeOpacity={0.7}
      >
        <View style={styles.itemHeader}>
          <View style={styles.itemTitleRow}>
            <Ionicons name={statusConfig.icon} size={24} color={statusConfig.color} />
            <View style={styles.itemTitleContainer}>
              <Text style={styles.itemName}>{item.customer_name}</Text>
              <Text style={styles.itemTemplate}>{item.template_name}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '15' }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.itemDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Satış Fiyatı</Text>
            <Text style={styles.detailValue}>₺{item.sale_price.toFixed(2)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Tarih</Text>
            <Text style={styles.detailValue}>
              {format(new Date(item.created_at), 'dd/MM/yyyy')}
            </Text>
          </View>
        </View>

        {statusConfig.nextStatus && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: statusConfig.color }]}
            onPress={(e) => {
              e.stopPropagation();
              handleStatusChange(item);
            }}
          >
            <Text style={styles.actionButtonText}>
              {STATUS_CONFIG[statusConfig.nextStatus as keyof typeof STATUS_CONFIG].label} Olarak İşaretle
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Satış & Kârlılık</Text>
        <View style={{ width: 40 }} />
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>Henüz sipariş yok</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  itemTitleContainer: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  itemName: {
    ...TYPOGRAPHY.h3,
  },
  itemTemplate: {
    ...TYPOGRAPHY.caption,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    marginTop: SPACING.xs,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: SPACING.xs,
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
});
