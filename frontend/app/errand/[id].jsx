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
import { LinearGradient } from 'expo-linear-gradient';
import {
  Info,
  MessageSquare,
  Navigation,
  Camera,
  MapPin,
  Check,
  CheckCheck,
  Clock,
  User,
  Bike,
  CheckCircle2,
  Phone,
  Hourglass,
  Star,
  ShieldAlert,
  AlertCircle,
  ArrowLeft,
  XCircle,
} from 'lucide-react-native';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../services/socket';
import { sendLocalNotification } from '../../services/notifications';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';

import TrackingSection from '../../components/TrackingSection';
import ProofSection from '../../components/ProofSection';
import ChatSection from '../../components/ChatSection';
import RatingModal from '../../components/RatingModal';
import DisputeModal from '../../components/DisputeModal';

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

  // Rating & Dispute modals
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [disputeModalVisible, setDisputeModalVisible] = useState(false);

  const fetchErrandDetail = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get(`/errands/${id}`);
      setErrand(response.data.errand);
    } catch (err) {
      console.warn('[Fetch errand detail error]', err);
      setError(err.response?.data?.message || 'Failed to load errand details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchErrandDetail();
  }, [fetchErrandDetail]);

  useEffect(() => {
    if (!errand?._id) return;

    const socket = getSocket();
    const roomName = `errand_${errand._id}`;

    socket.emit('join_errand_room', {
      errandId: errand._id,
      user: { _id: user?._id, name: user?.name },
    });

    const handleStatusUpdated = (data) => {
      if (data.errandId === errand._id) {
        setErrand((prev) => (prev ? { ...prev, status: data.status } : prev));
        sendLocalNotification(
          'Errand Status Updated',
          `This errand is now ${data.status.replace('_', ' ').toUpperCase()}`,
          { errandId: errand._id, status: data.status }
        );
      }
    };

    socket.on('errand_status_updated', handleStatusUpdated);

    return () => {
      socket.emit('leave_errand_room', { errandId: errand._id });
      socket.off('errand_status_updated', handleStatusUpdated);
    };
  }, [errand?._id, user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchErrandDetail();
  };

  const handleAcceptErrand = async () => {
    Alert.alert(
      'Accept Errand',
      `Are you ready to fulfill this errand for ₹${errand.budget || 0}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept Errand 🏃',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await api.patch(`/errands/${errand._id}/status`, {
                status: 'accepted',
              });
              setErrand(res.data.errand);
              Alert.alert('Errand Accepted!', 'You are now the active runner for this task.');
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to accept errand.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleUpdateStatus = async (newStatus) => {
    const statusLabels = {
      in_progress: 'In Progress (Start GPS Tracking)',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };

    Alert.alert(
      'Update Errand Status',
      `Move this errand to "${statusLabels[newStatus] || newStatus}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await api.patch(`/errands/${errand._id}/status`, {
                status: newStatus,
              });
              setErrand(res.data.errand);

              if (newStatus === 'delivered') {
                setRatingModalVisible(true);
              }
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to update status.');
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
        <AlertCircle size={52} color={Colors.danger} />
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
          <Info size={16} color={activeTab === 'overview' ? Colors.primary : Colors.textSecondary} />
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
          <MessageSquare size={16} color={activeTab === 'chat' ? Colors.primary : Colors.textSecondary} />
          <Text style={[styles.tabNavText, activeTab === 'chat' && styles.tabNavTextActive]}>
            Chat
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabNavItem, activeTab === 'tracking' && styles.tabNavItemActive]}
          onPress={() => setActiveTab('tracking')}
        >
          <Navigation size={16} color={activeTab === 'tracking' ? Colors.primary : Colors.textSecondary} />
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
          <Camera size={16} color={activeTab === 'proof' ? Colors.primary : Colors.textSecondary} />
          <Text style={[styles.tabNavText, activeTab === 'proof' && styles.tabNavTextActive]}>
            Proof & Bill
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
        ) : activeTab === 'proof' ? (
          <ProofSection errand={errand} currentUser={user} onErrandUpdated={setErrand} />
        ) : activeTab === 'chat' ? (
          <ChatSection errand={errand} currentUser={user} />
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
                <MapPin size={16} color={Colors.primary} />
                <Text style={styles.addressText}>{errand.address || 'Campus Hostels'}</Text>
              </View>
            </View>

            {/* Status Lifecycle Stepper Timeline */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Status Lifecycle</Text>

              {errand.status === 'cancelled' ? (
                <View style={styles.cancelledBanner}>
                  <XCircle size={20} color={Colors.danger} />
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
                            <Check size={14} color={Colors.white} strokeWidth={3} />
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
                    <Clock size={13} color={Colors.textSecondary} />
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
                        <CheckCircle2 size={13} color={Colors.secondaryDark} />
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
                      <Phone size={16} color={Colors.primary} />
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
                          <CheckCircle2 size={13} color={Colors.secondaryDark} />
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
                        <Phone size={16} color={Colors.primary} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : (
                  <View style={styles.unassignedBox}>
                    <Hourglass size={18} color={Colors.accent} />
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
                  onPress={handleAcceptErrand}
                  disabled={actionLoading}
                  style={styles.primaryActionWrapper}
                >
                  <LinearGradient
                    colors={Colors.gradientPrimary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.primaryActionBtn, actionLoading && styles.btnDisabled]}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color={Colors.white} />
                    ) : (
                      <>
                        <Bike size={20} color={Colors.white} />
                        <Text style={styles.primaryActionBtnText}>Accept Errand (Become Runner)</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ) : null}

              {/* Case 2: Errand is accepted and user is runner -> Runner starts task */}
              {errand.status === 'accepted' && isRunner ? (
                <TouchableOpacity
                  onPress={() => handleUpdateStatus('in_progress')}
                  disabled={actionLoading}
                  style={styles.primaryActionWrapper}
                >
                  <LinearGradient
                    colors={Colors.gradientPrimary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.primaryActionBtn, actionLoading && styles.btnDisabled]}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color={Colors.white} />
                    ) : (
                      <>
                        <Navigation size={20} color={Colors.white} />
                        <Text style={styles.primaryActionBtnText}>Start Errand & Share Live Location</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ) : null}

              {/* Case 3: Errand is in_progress and user is runner -> Runner completes task */}
              {errand.status === 'in_progress' && isRunner ? (
                <TouchableOpacity
                  onPress={() => handleUpdateStatus('delivered')}
                  disabled={actionLoading}
                  style={styles.primaryActionWrapper}
                >
                  <LinearGradient
                    colors={Colors.gradientSuccess}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.primaryActionBtn, actionLoading && styles.btnDisabled]}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color={Colors.white} />
                    ) : (
                      <>
                        <CheckCheck size={20} color={Colors.white} strokeWidth={2.5} />
                        <Text style={styles.primaryActionBtnText}>Mark as Delivered</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ) : null}

              {/* Case 4: Errand is delivered -> Rate peer and award karma */}
              {errand.status === 'delivered' ? (
                <>
                  <View style={styles.deliveredSuccessBox}>
                    <CheckCircle2 size={26} color={Colors.secondaryDark} />
                    <Text style={styles.deliveredSuccessText}>
                      Errand Completed Successfully!
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setRatingModalVisible(true)}
                    style={styles.primaryActionWrapper}
                  >
                    <LinearGradient
                      colors={Colors.gradientAccent}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.primaryActionBtn}
                    >
                      <Star size={18} color={Colors.white} fill={Colors.white} />
                      <Text style={styles.primaryActionBtnText}>Rate Peer & Award Karma</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : null}

              {/* Dispute / Issue reporting link */}
              {(isRequester || isRunner) && errand.status !== 'posted' ? (
                <TouchableOpacity
                  style={styles.disputeLinkBtn}
                  onPress={() => setDisputeModalVisible(true)}
                >
                  <ShieldAlert size={14} color={Colors.textMuted} />
                  <Text style={styles.disputeLinkText}>Report an issue with this errand</Text>
                </TouchableOpacity>
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

      {/* Modals */}
      <RatingModal
        visible={ratingModalVisible}
        errand={errand}
        currentUser={user}
        onClose={() => setRatingModalVisible(false)}
        onRatingSubmitted={fetchErrandDetail}
      />

      <DisputeModal
        visible={disputeModalVisible}
        errand={errand}
        onClose={() => setDisputeModalVisible(false)}
      />
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
    paddingHorizontal: Spacing.sm,
    ...Shadows.subtle,
  },
  tabNavItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.md,
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
    paddingBottom: Spacing.xxl + 20,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.card,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  categoryBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  categoryBadgeText: {
    color: Colors.primary,
    fontSize: Typography.xs - 2,
    fontWeight: 'bold',
  },
  budgetBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  budgetText: {
    color: Colors.secondaryDark,
    fontSize: Typography.xs,
    fontWeight: 'bold',
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
    lineHeight: 18,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
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
    marginBottom: Spacing.md,
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleCurrent: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  stepCircleCompleted: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepNumber: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    fontWeight: 'bold',
  },
  stepLabel: {
    fontSize: Typography.xs - 2,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  stepLabelCurrent: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  stepLabelCompleted: {
    color: Colors.text,
    fontWeight: '600',
  },
  historyBox: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  historyTitle: {
    fontSize: Typography.xs,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  historyText: {
    fontSize: Typography.xs - 1,
    color: Colors.textSecondary,
  },
  historyStatus: {
    fontWeight: 'bold',
    color: Colors.text,
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.dangerLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  cancelledText: {
    color: Colors.dangerDark,
    fontSize: Typography.xs,
    fontWeight: 'bold',
  },
  peopleSection: {
    gap: Spacing.sm,
  },
  personCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.subtle,
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
    fontSize: Typography.xs - 1,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  personKarma: {
    fontSize: Typography.xs - 2,
    color: '#B45309',
    fontWeight: '600',
    marginTop: 2,
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
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  unassignedText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  actionSection: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  primaryActionWrapper: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.glow,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    height: 50,
  },
  primaryActionBtnText: {
    color: Colors.white,
    fontSize: Typography.sm + 1,
    fontWeight: 'bold',
  },
  deliveredSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: '#ECFDF5',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  deliveredSuccessText: {
    color: Colors.secondaryDark,
    fontSize: Typography.sm,
    fontWeight: 'bold',
  },
  disputeLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.xs,
  },
  disputeLinkText: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  cancelBtnText: {
    color: Colors.danger,
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: Spacing.xl,
  },
  errorTitle: {
    fontSize: Typography.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  errorSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
