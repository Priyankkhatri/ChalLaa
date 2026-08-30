import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../services/socket';
import { sendLocalNotification } from '../../services/notifications';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';

import TrackingSection from '../../components/TrackingSection';

const STATUS_STEPS = ['posted', 'accepted', 'in_progress', 'delivered'];

export default function ErrandDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();

  const [errand, setErrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Active sub-view tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'tracking' | 'proof' | 'chat'

  const fetchErrandDetail = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get(`/errands/${id}`);
      setErrand(response.data.errand);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load errand details';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchErrandDetail();

    // Socket.io room subscription
    const socket = getSocket();
    socket.emit('join_errand_room', { errandId: id, userId: user?._id });

    const handleSyncStatus = () => {
      fetchErrandDetail();
    };

    socket.on('sync_status_requested', handleSyncStatus);

    return () => {
      socket.emit('leave_errand_room', { errandId: id });
      socket.off('sync_status_requested', handleSyncStatus);
    };
  }, [id, fetchErrandDetail, user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchErrandDetail();
  };

  // Accept Errand Action (Runner)
  const handleAcceptErrand = async () => {
    Alert.alert(
      'Accept Errand',
      'Are you heading out and ready to complete this errand for your peer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept Task',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await api.patch(`/errands/${id}/accept`);
              setErrand(res.data.errand);
              await sendLocalNotification(
                '🏃 Errand Accepted!',
                `You are now the runner for "${res.data.errand.title}". You can coordinate via in-app chat.`
              );
              getSocket().emit('request_status_sync', { errandId: id });
              Alert.alert('Success', 'You have accepted this errand!');
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to accept errand');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // Update Errand Status (in_progress, delivered, cancelled)
  const handleUpdateStatus = async (newStatus) => {
    const statusLabels = {
      in_progress: 'Start Errand & Stream Location',
      delivered: 'Mark Errand as Delivered',
      cancelled: 'Cancel Errand',
    };

    Alert.alert(
      statusLabels[newStatus] || 'Update Status',
      `Are you sure you want to change status to "${newStatus.replace('_', ' ')}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await api.patch(`/errands/${id}/status`, { status: newStatus });
              setErrand(res.data.errand);

              const notifBodies = {
                in_progress: `Runner is now heading out for "${res.data.errand.title}".`,
                delivered: `Errand "${res.data.errand.title}" has been marked as delivered!`,
                cancelled: `Errand "${res.data.errand.title}" was cancelled.`,
              };

              await sendLocalNotification(
                `Errand Status: ${newStatus.replace('_', ' ').toUpperCase()}`,
                notifBodies[newStatus] || 'Errand status has updated.'
              );

              getSocket().emit('request_status_sync', { errandId: id });
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to update status');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading errand details...</Text>
      </View>
    );
  }

  if (error || !errand) {
    return (
      <View style={styles.centerError}>
        <Ionicons name="alert-circle-outline" size={56} color={Colors.danger} />
        <Text style={styles.errorTitle}>Errand Not Found</Text>
        <Text style={styles.errorSubtitle}>{error || 'Could not find the requested errand.'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isRequester = errand.requesterId?._id === user?._id || errand.requesterId === user?._id;
  const isRunner = errand.runnerId?._id === user?._id || errand.runnerId === user?._id;
  const currentStepIndex = STATUS_STEPS.indexOf(errand.status);

  return (
    <View style={styles.container}>
      {/* Sub-view Navigation Tabs */}
      <View style={styles.tabNav}>
        <TouchableOpacity
          style={[styles.tabNavItem, activeTab === 'overview' && styles.tabNavItemActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Ionicons
            name="information-circle-outline"
            size={16}
            color={activeTab === 'overview' ? Colors.primary : Colors.textSecondary}
          />
          <Text
            style={[styles.tabNavText, activeTab === 'overview' && styles.tabNavTextActive]}
          >
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabNavItem, activeTab === 'chat' && styles.tabNavItemActive]}
          onPress={() => setActiveTab('chat')}
        >
          <Ionicons
            name="chatbubbles-outline"
            size={16}
            color={activeTab === 'chat' ? Colors.primary : Colors.textSecondary}
          />
          <Text style={[styles.tabNavText, activeTab === 'chat' && styles.tabNavTextActive]}>
            Chat
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabNavItem, activeTab === 'tracking' && styles.tabNavItemActive]}
          onPress={() => setActiveTab('tracking')}
        >
          <Ionicons
            name="navigate-outline"
            size={16}
            color={activeTab === 'tracking' ? Colors.primary : Colors.textSecondary}
          />
          <Text
            style={[styles.tabNavText, activeTab === 'tracking' && styles.tabNavTextActive]}
          >
            Live GPS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabNavItem, activeTab === 'proof' && styles.tabNavItemActive]}
          onPress={() => setActiveTab('proof')}
        >
          <Ionicons
            name="camera-outline"
            size={16}
            color={activeTab === 'proof' ? Colors.primary : Colors.textSecondary}
          />
          <Text style={[styles.tabNavText, activeTab === 'proof' && styles.tabNavTextActive]}>
            Proof & Bill
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {activeTab === 'tracking' ? (
          <TrackingSection errand={errand} currentUser={user} />
        ) : activeTab === 'overview' ? (
          <>
            {/* Errand Header Card */}
            <View style={styles.card}>
              <View style={styles.headerTopRow}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>
                    {errand.category?.toUpperCase() || 'GENERAL'}
                  </Text>
                </View>
                <View style={styles.budgetBadge}>
                  <Text style={styles.budgetText}>Budget: ₹{errand.budget || 0}</Text>
                </View>
              </View>

              <Text style={styles.title}>{errand.title}</Text>
              {errand.description ? (
                <Text style={styles.description}>{errand.description}</Text>
              ) : null}

              <View style={styles.addressRow}>
                <Ionicons name="location" size={16} color={Colors.primary} />
                <Text style={styles.addressText}>{errand.address || 'Campus Hostels'}</Text>
              </View>
            </View>

            {/* Status Lifecycle Stepper Timeline */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Status Lifecycle</Text>

              {errand.status === 'cancelled' ? (
                <View style={styles.cancelledBanner}>
                  <Ionicons name="close-circle" size={20} color={Colors.danger} />
                  <Text style={styles.cancelledText}>This errand has been CANCELLED.</Text>
                </View>
              ) : (
                <View style={styles.stepperContainer}>
                  {STATUS_STEPS.map((step, idx) => {
                    const isCompleted = currentStepIndex >= idx;
                    const isCurrent = currentStepIndex === idx;

                    const stepTitles = {
                      posted: 'Posted',
                      accepted: 'Accepted',
                      in_progress: 'In Progress',
                      delivered: 'Delivered',
                    };

                    return (
                      <View key={step} style={styles.stepItem}>
                        <View
                          style={[
                            styles.stepCircle,
                            isCompleted && styles.stepCircleCompleted,
                            isCurrent && styles.stepCircleCurrent,
                          ]}
                        >
                          {isCompleted ? (
                            <Ionicons name="checkmark" size={14} color={Colors.white} />
                          ) : (
                            <Text style={styles.stepNumber}>{idx + 1}</Text>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.stepLabel,
                            isCurrent && styles.stepLabelCurrent,
                            isCompleted && styles.stepLabelCompleted,
                          ]}
                        >
                          {stepTitles[step]}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Status History Log with Timestamps */}
              <View style={styles.historyBox}>
                <Text style={styles.historyTitle}>Activity Log</Text>
                {errand.statusHistory?.map((hist, index) => (
                  <View key={index} style={styles.historyRow}>
                    <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.historyText}>
                      <Text style={styles.historyStatus}>{hist.status.toUpperCase()}:</Text>{' '}
                      {new Date(hist.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      - {new Date(hist.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* People Involved (Requester & Runner Cards) */}
            <View style={styles.peopleSection}>
              {/* Requester Card */}
              <View style={styles.personCard}>
                <Text style={styles.personRoleLabel}>Requester (Posted By)</Text>
                <View style={styles.personDetailsRow}>
                  <View style={styles.personAvatar}>
                    <Text style={styles.personAvatarText}>
                      {errand.requesterId?.name ? errand.requesterId.name.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  </View>
                  <View style={styles.personInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.personName}>{errand.requesterId?.name || 'Peer'}</Text>
                      {errand.requesterId?.isVerified ? (
                        <Ionicons name="checkmark-circle" size={14} color={Colors.secondaryDark} />
                      ) : null}
                    </View>
                    <Text style={styles.personSubtext}>
                      Hostel: {errand.requesterId?.hostelOrCollegeId || 'Hostel Campus'}
                    </Text>
                    <Text style={styles.personKarma}>⭐ {errand.requesterId?.karmaScore ?? 100} Karma</Text>
                  </View>

                  {errand.requesterId?.phone && !isRequester ? (
                    <TouchableOpacity
                      style={styles.callBtn}
                      onPress={() => Linking.openURL(`tel:${errand.requesterId.phone}`)}
                    >
                      <Ionicons name="call" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              {/* Runner Card */}
              <View style={styles.personCard}>
                <Text style={styles.personRoleLabel}>Runner (Fulfilling Task)</Text>
                {errand.runnerId ? (
                  <View style={styles.personDetailsRow}>
                    <View style={[styles.personAvatar, { backgroundColor: '#DCFCE7' }]}>
                      <Text style={[styles.personAvatarText, { color: Colors.secondaryDark }]}>
                        {errand.runnerId?.name ? errand.runnerId.name.charAt(0).toUpperCase() : 'R'}
                      </Text>
                    </View>
                    <View style={styles.personInfo}>
                      <View style={styles.nameRow}>
                        <Text style={styles.personName}>{errand.runnerId?.name || 'Runner'}</Text>
                        {errand.runnerId?.isVerified ? (
                          <Ionicons name="checkmark-circle" size={14} color={Colors.secondaryDark} />
                        ) : null}
                      </View>
                      <Text style={styles.personSubtext}>
                        Hostel: {errand.runnerId?.hostelOrCollegeId || 'Hostel Campus'}
                      </Text>
                      <Text style={styles.personKarma}>⭐ {errand.runnerId?.karmaScore ?? 100} Karma</Text>
                    </View>

                    {errand.runnerId?.phone && !isRunner ? (
                      <TouchableOpacity
                        style={styles.callBtn}
                        onPress={() => Linking.openURL(`tel:${errand.runnerId.phone}`)}
                      >
                        <Ionicons name="call" size={16} color={Colors.primary} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : (
                  <View style={styles.unassignedBox}>
                    <Ionicons name="hourglass-outline" size={20} color={Colors.accent} />
                    <Text style={styles.unassignedText}>
                      Waiting for a peer to accept this errand.
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Dynamic Lifecycle Action Buttons */}
            <View style={styles.actionSection}>
              {/* Case 1: Errand is posted and user is not requester -> User can accept */}
              {errand.status === 'posted' && !isRequester ? (
                <TouchableOpacity
                  style={[styles.primaryActionBtn, actionLoading && styles.btnDisabled]}
                  onPress={handleAcceptErrand}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <>
                      <Ionicons name="bicycle" size={20} color={Colors.white} />
                      <Text style={styles.primaryActionBtnText}>Accept Errand (Become Runner)</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : null}

              {/* Case 2: Errand is accepted and user is runner -> Runner starts task */}
              {errand.status === 'accepted' && isRunner ? (
                <TouchableOpacity
                  style={[styles.primaryActionBtn, actionLoading && styles.btnDisabled]}
                  onPress={() => handleUpdateStatus('in_progress')}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <>
                      <Ionicons name="navigate" size={20} color={Colors.white} />
                      <Text style={styles.primaryActionBtnText}>Start Errand & Share Live Location</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : null}

              {/* Case 3: Errand is in_progress and user is runner -> Runner completes task */}
              {errand.status === 'in_progress' && isRunner ? (
                <TouchableOpacity
                  style={[
                    styles.primaryActionBtn,
                    { backgroundColor: Colors.secondary },
                    actionLoading && styles.btnDisabled,
                  ]}
                  onPress={() => handleUpdateStatus('delivered')}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <>
                      <Ionicons name="checkmark-done" size={20} color={Colors.white} />
                      <Text style={styles.primaryActionBtnText}>Mark as Delivered</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : null}

              {/* Case 4: Errand is delivered and user is requester -> Settlement & rating */}
              {errand.status === 'delivered' ? (
                <View style={styles.deliveredSuccessBox}>
                  <Ionicons name="checkmark-circle" size={28} color={Colors.secondaryDark} />
                  <Text style={styles.deliveredSuccessText}>
                    Errand Completed Successfully!
                  </Text>
                </View>
              ) : null}

              {/* Cancel button if applicable before completion */}
              {(errand.status === 'posted' || errand.status === 'accepted') && (isRequester || isRunner) ? (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => handleUpdateStatus('cancelled')}
                  disabled={actionLoading}
                >
                  <Text style={styles.cancelBtnText}>Cancel Errand</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabNav: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 2,
  },
  tabNavItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabNavItemActive: {
    borderBottomColor: Colors.primary,
  },
  tabNavText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabNavTextActive: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  categoryBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  categoryBadgeText: {
    fontSize: Typography.xs - 2,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  budgetBadge: {
    backgroundColor: '#DCFCE7',
    borderColor: Colors.secondary,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  budgetText: {
    fontSize: Typography.sm,
    fontWeight: 'bold',
    color: Colors.secondaryDark,
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  description: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  addressText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    flex: 1,
  },
  sectionTitle: {
    fontSize: Typography.base,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    marginBottom: 4,
  },
  stepCircleCompleted: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepCircleCurrent: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  stepNumber: {
    fontSize: Typography.xs,
    fontWeight: 'bold',
    color: Colors.textSecondary,
  },
  stepLabel: {
    fontSize: Typography.xs - 2,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  stepLabelCompleted: {
    color: Colors.text,
    fontWeight: '600',
  },
  stepLabelCurrent: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.dangerBg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  cancelledText: {
    color: Colors.danger,
    fontSize: Typography.sm,
    fontWeight: 'bold',
  },
  historyBox: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  historyTitle: {
    fontSize: Typography.xs,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginVertical: 2,
  },
  historyStatus: {
    fontWeight: 'bold',
    color: Colors.text,
  },
  historyText: {
    fontSize: Typography.xs - 1,
    color: Colors.textSecondary,
  },
  peopleSection: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  personCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  personRoleLabel: {
    fontSize: Typography.xs - 1,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  personDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  personAvatarText: {
    fontSize: Typography.base,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  personInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  personName: {
    fontSize: Typography.sm,
    fontWeight: 'bold',
    color: Colors.text,
  },
  personSubtext: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
  personKarma: {
    fontSize: Typography.xs - 1,
    color: '#B45309',
    fontWeight: '600',
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unassignedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.warningBg,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  unassignedText: {
    fontSize: Typography.xs,
    color: '#B45309',
  },
  actionSection: {
    marginTop: Spacing.xs,
    gap: Spacing.sm,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: BorderRadius.md,
  },
  primaryActionBtnText: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: 'bold',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  deliveredSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.successBg,
    borderColor: Colors.secondary,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  deliveredSuccessText: {
    color: Colors.secondaryDark,
    fontSize: Typography.sm,
    fontWeight: 'bold',
  },
  cancelBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.sm,
  },
  cancelBtnText: {
    color: Colors.danger,
    fontSize: Typography.xs,
    fontWeight: 'bold',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: Typography.sm,
  },
  centerError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.xl,
  },
  errorTitle: {
    fontSize: Typography.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  errorSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  backButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
});
