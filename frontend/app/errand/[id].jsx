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
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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
import { LiquidGlassCard, LiquidCanvas } from '../../components/ui/LiquidGlass';

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
              const res = await api.patch(`/errands/${errand._id}/accept`);
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
        <ActivityIndicator size="large" color={Colors.powderBlue} />
        <Text style={styles.loadingText}>Loading errand details...</Text>
      </View>
    );
  }

  if (error || !errand) {
    return (
      <View style={styles.centerError}>
        <AlertCircle size={52} color="#F87171" />
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
    <LiquidCanvas style={styles.container}>
      {/* Liquid Glass Navigation Sub-tabs */}
      <View style={styles.tabNavWrapper}>
        <BlurView intensity={Platform.OS === 'ios' ? 35 : 55} tint="dark" style={styles.tabBlur}>
          <View style={styles.tabNav}>
            <TouchableOpacity
              style={[styles.tabNavItem, activeTab === 'overview' && styles.tabNavItemActive]}
              onPress={() => setActiveTab('overview')}
              activeOpacity={0.8}
            >
              <Info
                size={15}
                color={activeTab === 'overview' ? Colors.inkBlack : Colors.powderBlue}
                strokeWidth={2.4}
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
              activeOpacity={0.8}
            >
              <MessageSquare
                size={15}
                color={activeTab === 'chat' ? Colors.inkBlack : Colors.powderBlue}
                strokeWidth={2.4}
              />
              <Text style={[styles.tabNavText, activeTab === 'chat' && styles.tabNavTextActive]}>
                Chat
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabNavItem, activeTab === 'tracking' && styles.tabNavItemActive]}
              onPress={() => setActiveTab('tracking')}
              activeOpacity={0.8}
            >
              <Navigation
                size={15}
                color={activeTab === 'tracking' ? Colors.inkBlack : Colors.powderBlue}
                strokeWidth={2.4}
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
              activeOpacity={0.8}
            >
              <Camera
                size={15}
                color={activeTab === 'proof' ? Colors.inkBlack : Colors.powderBlue}
                strokeWidth={2.4}
              />
              <Text style={[styles.tabNavText, activeTab === 'proof' && styles.tabNavTextActive]}>
                Proof & Bill
              </Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.powderBlue]}
            tintColor={Colors.powderBlue}
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
            <LiquidGlassCard variant="default">
              <View style={styles.headerTopRow}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>
                    {errand.category?.toUpperCase() || 'GENERAL'}
                  </Text>
                </View>
                <View style={styles.budgetBadge}>
                  <Text style={styles.budgetLabel}>Budget</Text>
                  <Text style={styles.budgetText}>₹{errand.budget || 0}</Text>
                </View>
              </View>

              <Text style={styles.title}>{errand.title}</Text>
              {errand.description ? (
                <Text style={styles.description}>{errand.description}</Text>
              ) : null}

              <View style={styles.addressRow}>
                <MapPin size={15} color={Colors.powderBlue} />
                <Text style={styles.addressText}>{errand.address || 'Campus Hostels'}</Text>
              </View>
            </LiquidGlassCard>

            {/* Status Lifecycle Stepper Timeline */}
            <LiquidGlassCard variant="default">
              <Text style={styles.sectionTitle}>Status Lifecycle</Text>

              {errand.status === 'cancelled' ? (
                <View style={styles.cancelledBanner}>
                  <XCircle size={20} color="#F87171" />
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
                            <Check size={14} color={Colors.inkBlack} strokeWidth={3.2} />
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
                    <Clock size={12} color={Colors.powderBlue} />
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
            </LiquidGlassCard>

            {/* People Involved (Requester & Runner Cards) */}
            <View style={styles.peopleSection}>
              {/* Requester Card */}
              <LiquidGlassCard variant="default">
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
                        <CheckCircle2 size={13} color={Colors.drySage} />
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
                      activeOpacity={0.8}
                    >
                      <Phone size={15} color={Colors.powderBlue} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </LiquidGlassCard>

              {/* Runner Card */}
              <LiquidGlassCard variant="default">
                <Text style={styles.personRoleLabel}>Runner (Fulfilling Task)</Text>
                {errand.runnerId ? (
                  <View style={styles.personDetailsRow}>
                    <View style={[styles.personAvatar, { backgroundColor: 'rgba(191, 204, 148, 0.2)' }]}>
                      <Text style={[styles.personAvatarText, { color: Colors.drySage }]}>
                        {errand.runnerId?.name ? errand.runnerId.name.charAt(0).toUpperCase() : 'R'}
                      </Text>
                    </View>
                    <View style={styles.personInfo}>
                      <View style={styles.nameRow}>
                        <Text style={styles.personName}>{errand.runnerId?.name || 'Runner'}</Text>
                        {errand.runnerId?.isVerified ? (
                          <CheckCircle2 size={13} color={Colors.drySage} />
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
                        activeOpacity={0.8}
                      >
                        <Phone size={15} color={Colors.powderBlue} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : (
                  <View style={styles.unassignedBox}>
                    <Hourglass size={16} color={Colors.powderBlue} />
                    <Text style={styles.unassignedText}>
                      Waiting for a peer to accept this errand.
                    </Text>
                  </View>
                )}
              </LiquidGlassCard>
            </View>

            {/* Dynamic Lifecycle Action Buttons */}
            <View style={styles.actionSection}>
              {/* Case 1: Errand is posted and user is not requester -> User can accept */}
              {errand.status === 'posted' && !isRequester ? (
                <TouchableOpacity
                  onPress={handleAcceptErrand}
                  disabled={actionLoading}
                  style={styles.primaryActionWrapper}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={Colors.gradientPrimary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.primaryActionBtn, actionLoading && styles.btnDisabled]}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color={Colors.inkBlack} />
                    ) : (
                      <>
                        <Bike size={20} color={Colors.inkBlack} strokeWidth={2.4} />
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
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={Colors.gradientPrimary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.primaryActionBtn, actionLoading && styles.btnDisabled]}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color={Colors.inkBlack} />
                    ) : (
                      <>
                        <Navigation size={18} color={Colors.inkBlack} strokeWidth={2.4} />
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
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={Colors.gradientSageGlow}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.primaryActionBtn, actionLoading && styles.btnDisabled]}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color={Colors.inkBlack} />
                    ) : (
                      <>
                        <CheckCheck size={20} color={Colors.inkBlack} strokeWidth={2.6} />
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
                    <CheckCircle2 size={24} color={Colors.drySage} />
                    <Text style={styles.deliveredSuccessText}>
                      Errand Completed Successfully!
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setRatingModalVisible(true)}
                    style={styles.primaryActionWrapper}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={Colors.gradientSageGlow}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.primaryActionBtn}
                    >
                      <Star size={18} color={Colors.inkBlack} fill={Colors.inkBlack} />
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
                  activeOpacity={0.8}
                >
                  <ShieldAlert size={14} color={Colors.powderBlue} />
                  <Text style={styles.disputeLinkText}>Report an issue with this errand</Text>
                </TouchableOpacity>
              ) : null}

              {/* Cancel button if applicable before completion */}
              {(errand.status === 'posted' || errand.status === 'accepted') && (isRequester || isRunner) ? (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => handleUpdateStatus('cancelled')}
                  disabled={actionLoading}
                  activeOpacity={0.8}
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
    </LiquidCanvas>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabNavWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(52, 73, 102, 0.35)',
    ...(Platform.OS === 'web' ? {
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    } : {}),
  },
  tabBlur: {
    width: '100%',
  },
  tabNav: {
    flexDirection: 'row',
    padding: Spacing.xs + 2,
    backgroundColor: 'rgba(13, 24, 33, 0.45)',
  },
  tabNavItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  tabNavItemActive: {
    backgroundColor: Colors.powderBlue,
  },
  tabNavText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.porcelain,
  },
  tabNavTextActive: {
    color: Colors.inkBlack,
    fontWeight: '800',
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl + 40,
    gap: Spacing.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  categoryBadge: {
    backgroundColor: 'rgba(180, 205, 237, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(180, 205, 237, 0.25)',
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  categoryBadgeText: {
    color: Colors.powderBlue,
    fontSize: Typography.xs - 2,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  budgetBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    backgroundColor: 'rgba(191, 204, 148, 0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.glassSageBorder,
  },
  budgetLabel: {
    color: Colors.drySage,
    fontSize: Typography.xs - 3,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  budgetText: {
    color: Colors.drySage,
    fontSize: Typography.sm + 1,
    fontWeight: '800',
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: '800',
    color: Colors.porcelain,
    marginTop: Spacing.xs,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: Typography.sm,
    color: 'rgba(240, 244, 239, 0.75)',
    marginTop: 4,
    lineHeight: 18,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(52, 73, 102, 0.35)',
  },
  addressText: {
    fontSize: Typography.xs,
    color: Colors.powderBlue,
    flex: 1,
  },
  sectionTitle: {
    fontSize: Typography.base,
    fontWeight: '800',
    color: Colors.porcelain,
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
    backgroundColor: 'rgba(52, 73, 102, 0.35)',
    borderWidth: 1.5,
    borderColor: Colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleCurrent: {
    borderColor: Colors.powderBlue,
    backgroundColor: 'rgba(180, 205, 237, 0.25)',
  },
  stepCircleCompleted: {
    backgroundColor: Colors.powderBlue,
    borderColor: Colors.powderBlue,
  },
  stepNumber: {
    fontSize: Typography.xs,
    color: Colors.powderBlue,
    fontWeight: '800',
  },
  stepLabel: {
    fontSize: Typography.xs - 2,
    color: Colors.powderBlue,
    textAlign: 'center',
  },
  stepLabelCurrent: {
    color: Colors.porcelain,
    fontWeight: '800',
  },
  stepLabelCompleted: {
    color: Colors.powderBlue,
    fontWeight: '700',
  },
  historyBox: {
    backgroundColor: 'rgba(13, 24, 33, 0.55)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(52, 73, 102, 0.35)',
  },
  historyTitle: {
    fontSize: Typography.xs,
    fontWeight: '800',
    color: Colors.powderBlue,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 3,
  },
  historyText: {
    fontSize: Typography.xs - 1,
    color: 'rgba(240, 244, 239, 0.8)',
  },
  historyStatus: {
    fontWeight: '800',
    color: Colors.porcelain,
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  cancelledText: {
    color: '#F87171',
    fontSize: Typography.xs,
    fontWeight: '800',
  },
  peopleSection: {
    gap: Spacing.sm,
  },
  personRoleLabel: {
    fontSize: Typography.xs - 1,
    fontWeight: '800',
    color: Colors.powderBlue,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
    letterSpacing: 0.4,
  },
  personDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(180, 205, 237, 0.15)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  personAvatarText: {
    fontSize: Typography.base,
    fontWeight: '800',
    color: Colors.powderBlue,
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
    fontSize: Typography.sm + 1,
    fontWeight: '800',
    color: Colors.porcelain,
  },
  personSubtext: {
    fontSize: Typography.xs - 1,
    color: Colors.powderBlue,
    marginTop: 1,
  },
  personKarma: {
    fontSize: Typography.xs - 2,
    color: Colors.drySage,
    fontWeight: '700',
    marginTop: 2,
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(180, 205, 237, 0.15)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
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
    color: Colors.powderBlue,
    fontStyle: 'italic',
  },
  actionSection: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  primaryActionWrapper: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    ...Shadows.glow,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    height: 52,
  },
  primaryActionBtnText: {
    color: Colors.inkBlack,
    fontSize: Typography.sm + 1,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  deliveredSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(191, 204, 148, 0.15)',
    padding: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.glassSageBorder,
  },
  deliveredSuccessText: {
    color: Colors.drySage,
    fontSize: Typography.sm,
    fontWeight: '800',
  },
  disputeLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: Spacing.xs,
  },
  disputeLinkText: {
    fontSize: Typography.xs,
    color: Colors.powderBlue,
    textDecorationLine: 'underline',
  },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  cancelBtnText: {
    color: '#F87171',
    fontSize: Typography.xs,
    fontWeight: '700',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.inkBlack,
  },
  loadingText: {
    marginTop: Spacing.sm,
    color: Colors.powderBlue,
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  centerError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.inkBlack,
  },
  errorTitle: {
    fontSize: Typography.lg,
    fontWeight: '800',
    color: Colors.porcelain,
    marginTop: Spacing.sm,
  },
  errorSubtitle: {
    fontSize: Typography.sm,
    color: Colors.powderBlue,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  backButton: {
    backgroundColor: Colors.powderBlue,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.full,
  },
  backButtonText: {
    color: Colors.inkBlack,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
