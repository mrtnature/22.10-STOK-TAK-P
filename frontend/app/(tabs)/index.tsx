import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS, TYPOGRAPHY } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import Modal from 'react-native-modal';
import { markAllNotificationsAsRead, markNotificationAsRead } from '../../lib/database';
import { format } from 'date-fns';

export default function HomeScreen() {
  const router = useRouter();
  const { stockItems, templates, customers, orders, notifications, unreadCount, refreshNotifications } = useApp();
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);

  const handleShowNotifications = async () => {
    setNotificationModalVisible(true);
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    await refreshNotifications();
  };

  const cards = [
    {
      title: 'Stok Takip',
      icon: 'cube' as const,
      color: COLORS.primary,
      route: '/stock',
      count: stockItems.length,
      label: 'Ürün',
    },
    {
      title: 'Üretim Süreçleri',
      icon: 'construct' as const,
      color: COLORS.accent,
      route: '/production',
      count: templates.length,
      label: 'Şablon',
    },
    {
      title: 'Satış & Kârlılık',
      icon: 'trending-up' as const,
      color: COLORS.warning,
      route: '/sales',
      count: orders.length,
      label: 'Sipariş',
    },
    {
      title: 'Müşteri Bilgileri',
      icon: 'people' as const,
      color: COLORS.primaryLight,
      route: '/customers',
      count: customers.length,
      label: 'Müşteri',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ERP-STOK</Text>
        <TouchableOpacity onPress={handleShowNotifications} style={styles.notificationButton}>
          <Ionicons name="notifications" size={24} color="#FFFFFF" />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.welcomeText}>Hoş Geldiniz</Text>
        <Text style={styles.subtitleText}>Sisteminizi yönetmek için bir kart seçin</Text>

        <View style={styles.cardsContainer}>
          {cards.map((card, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.card, { borderLeftColor: card.color }]}
              onPress={() => router.push(card.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: card.color + '15' }]}>
                <Ionicons name={card.icon} size={32} color={card.color} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <View style={styles.cardStats}>
                  <Text style={styles.cardCount}>{card.count}</Text>
                  <Text style={styles.cardLabel}>{card.label}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal
        isVisible={notificationModalVisible}
        onBackdropPress={() => setNotificationModalVisible(false)}
        onSwipeComplete={() => setNotificationModalVisible(false)}
        swipeDirection="down"
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Bildirimler</Text>
            {notifications.length > 0 && (
              <TouchableOpacity onPress={handleMarkAllRead}>
                <Text style={styles.markAllRead}>Tümünü Okundu İşaretle</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.notificationList}>
            {notifications.length === 0 ? (
              <View style={styles.emptyNotifications}>
                <Ionicons name="notifications-off" size={48} color={COLORS.textSecondary} />
                <Text style={styles.emptyText}>Bildirim bulunmuyor</Text>
              </View>
            ) : (
              notifications.map((notif) => (
                <View
                  key={notif.id}
                  style={[
                    styles.notificationItem,
                    !notif.read_at && styles.unreadNotification,
                  ]}
                >
                  <View style={styles.notificationHeader}>
                    <Ionicons
                      name={notif.type === 'critical_stock' ? 'warning' : 'information-circle'}
                      size={20}
                      color={notif.type === 'critical_stock' ? COLORS.warning : COLORS.primary}
                    />
                    <Text style={styles.notificationTitle}>{notif.title}</Text>
                  </View>
                  <Text style={styles.notificationMessage}>{notif.message}</Text>
                  <Text style={styles.notificationDate}>
                    {format(new Date(notif.created_at), 'dd/MM/yyyy HH:mm')}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setNotificationModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>Kapat</Text>
          </TouchableOpacity>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  notificationButton: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  welcomeText: {
    ...TYPOGRAPHY.h1,
    marginBottom: SPACING.xs,
  },
  subtitleText: {
    ...TYPOGRAPHY.caption,
    marginBottom: SPACING.lg,
  },
  cardsContainer: {
    gap: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    ...SHADOWS.card,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.xs,
  },
  cardStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  cardCount: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: SPACING.xs,
  },
  cardLabel: {
    ...TYPOGRAPHY.caption,
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
  },
  markAllRead: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  notificationList: {
    maxHeight: 400,
  },
  emptyNotifications: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    ...TYPOGRAPHY.caption,
    marginTop: SPACING.md,
  },
  notificationItem: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  unreadNotification: {
    backgroundColor: COLORS.primaryLight + '10',
    borderLeftColor: COLORS.warning,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  notificationTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  notificationMessage: {
    ...TYPOGRAPHY.caption,
    marginBottom: SPACING.xs,
  },
  notificationDate: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
  },
  closeButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
