import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  ShieldAlert,
  Users,
  ListOrdered,
  Lock,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Search,
  ShieldCheck,
  Trash2,
  ExternalLink,
  Clock,
  Sparkles,
} from 'lucide-react-native';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { LiquidGlassCard } from '../../components/ui/LiquidGlass';

/**
 * Admin Dashboard Screen
 * Campus moderation panel for student ID verification, dispute investigation, and metrics.
 */
export default function AdminDashboardScreen() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('disputes'); // 'disputes' | 'users' | 'errands'

  // Data states
  const [disputes, setDisputes] = useState([]);
  const [users, setUsers] = useState([]);
  const [errands, setErrands] = useState([]);
  const [searchUser, setSearchUser] = useState('');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchAdminData = useCallback(async () => {
    try {
      const [statsRes, disputesRes, usersRes, errandsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/disputes'),
        api.get('/admin/users'),
        api.get('/admin/errands'),
      ]);

      setStats(statsRes.data.stats);
      setDisputes(disputesRes.data.disputes);
      setUsers(usersRes.data.users);
      setErrands(errandsRes.data.errands);
    } catch (error) {
      console.warn('[Admin data fetch error]', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminData();
    } else {
      setLoading(false);
    }
  }, [user, fetchAdminData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAdminData();
  };

  const handleToggleVerify = async (userId, currentVerified) => {
    setActionLoading(`user_${userId}`);
    try {
      await api.patch(`/admin/users/${userId}/verify`);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isVerified: !currentVerified } : u))
      );
      Alert.alert('Success', `Student verification status updated.`);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update verification');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolveDispute = async (disputeId, newStatus) => {
    Alert.alert(
      `${newStatus === 'resolved' ? 'Resolve' : 'Dismiss'} Dispute`,
      `Are you sure you want to mark this dispute as ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setActionLoading(`dispute_${disputeId}`);
            try {
              await api.patch(`/admin/disputes/${disputeId}/resolve`, {
                status: newStatus,
                adminNotes: `Handled by admin on ${new Date().toLocaleDateString()}`,
              });
              setDisputes((prev) =>
                prev.map((d) => (d._id === disputeId ? { ...d, status: newStatus } : d))
              );
              Alert.alert('Success', `Dispute has been ${newStatus}.`);
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to resolve dispute');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  if (user?.role !== 'admin') {
    return (
      <View style={styles.restrictedContainer}>
        <Lock size={64} color="#F87171" />
        <Text style={styles.restrictedTitle}>Admin Access Required</Text>
        <Text style={styles.restrictedSubtitle}>
          You do not have administrative privileges to access the campus moderation panel.
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Return to Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const filteredUsers = users.filter((u) => {
    const term = searchUser.toLowerCase();
    return (
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.hostelOrCollegeId?.toLowerCase().includes(term)
    );
  });

  return (
    <View style={styles.container}>
      {/* Sub-tab Navigation */}
      <View style={styles.tabNavWrapper}>
        <BlurView intensity={Platform.OS === 'ios' ? 35 : 55} tint="dark" style={styles.tabBlur}>
          <View style={styles.tabNav}>
            <TouchableOpacity
              style={[styles.tabNavItem, activeTab === 'disputes' && styles.tabNavItemActive]}
              onPress={() => setActiveTab('disputes')}
              activeOpacity={0.8}
            >
              <ShieldAlert
                size={15}
                color={activeTab === 'disputes' ? Colors.inkBlack : '#F87171'}
                strokeWidth={2.4}
              />
              <Text style={[styles.tabNavText, activeTab === 'disputes' && styles.tabNavTextActive]}>
                Disputes ({disputes.filter((d) => d.status === 'open').length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabNavItem, activeTab === 'users' && styles.tabNavItemActive]}
              onPress={() => setActiveTab('users')}
              activeOpacity={0.8}
            >
              <Users
                size={15}
                color={activeTab === 'users' ? Colors.inkBlack : Colors.powderBlue}
                strokeWidth={2.4}
              />
              <Text style={[styles.tabNavText, activeTab === 'users' && styles.tabNavTextActive]}>
                Students ({users.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabNavItem, activeTab === 'errands' && styles.tabNavItemActive]}
              onPress={() => setActiveTab('errands')}
              activeOpacity={0.8}
            >
              <ListOrdered
                size={15}
                color={activeTab === 'errands' ? Colors.inkBlack : Colors.powderBlue}
                strokeWidth={2.4}
              />
              <Text style={[styles.tabNavText, activeTab === 'errands' && styles.tabNavTextActive]}>
                Errands ({errands.length})
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
        {/* KPI Metrics Grid */}
        {stats ? (
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{stats.totalUsers}</Text>
              <Text style={styles.kpiLabel}>Students</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={[styles.kpiValue, { color: Colors.powderBlue }]}>{stats.activeErrands}</Text>
              <Text style={styles.kpiLabel}>Active</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={[styles.kpiValue, { color: Colors.drySage }]}>
                {stats.completedErrands}
              </Text>
              <Text style={styles.kpiLabel}>Delivered</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={[styles.kpiValue, { color: '#F87171' }]}>{stats.openDisputes}</Text>
              <Text style={styles.kpiLabel}>Disputes</Text>
            </View>
          </View>
        ) : null}

        {/* 1. DISPUTES TAB */}
        {activeTab === 'disputes' ? (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeading}>Campus Dispute Moderation</Text>

            {loading ? (
              <ActivityIndicator color={Colors.powderBlue} style={{ marginVertical: Spacing.xl }} />
            ) : disputes.length > 0 ? (
              disputes.map((dispute) => {
                const isResolved = dispute.status === 'resolved';
                const isDismissed = dispute.status === 'dismissed';

                return (
                  <View key={dispute._id} style={styles.cardOuter}>
                    <LiquidGlassCard variant="default">
                      <View style={styles.cardHeaderRow}>
                        <View style={styles.disputeReasonBadge}>
                          <Text style={styles.disputeReasonText}>
                            {dispute.reason.replace('_', ' ').toUpperCase()}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.statusBadge,
                            isResolved
                              ? styles.statusBadgeSuccess
                              : isDismissed
                              ? styles.statusBadgeDismissed
                              : styles.statusBadgeOpen,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              isResolved
                                ? styles.statusTextSuccess
                                : isDismissed
                                ? styles.statusTextDismissed
                                : styles.statusTextOpen,
                            ]}
                          >
                            {dispute.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.disputeDescription}>"{dispute.description}"</Text>

                      <View style={styles.disputePartyInfo}>
                        <Text style={styles.partyText}>
                          <Text style={styles.bold}>Reporter:</Text> {dispute.reportedBy?.name} (
                          {dispute.reportedBy?.phone || 'No phone'})
                        </Text>
                        <Text style={styles.partyText}>
                          <Text style={styles.bold}>Target Peer:</Text> {dispute.againstUser?.name} (
                          {dispute.againstUser?.phone || 'No phone'})
                        </Text>
                        {dispute.errandId ? (
                          <Text style={styles.partyText}>
                            <Text style={styles.bold}>Errand:</Text> {dispute.errandId.title} (₹
                            {dispute.errandId.budget})
                          </Text>
                        ) : null}
                      </View>

                      {/* Action buttons */}
                      {dispute.status === 'open' || dispute.status === 'in_review' ? (
                        <View style={styles.disputeActionsRow}>
                          <TouchableOpacity
                            style={styles.dismissBtn}
                            onPress={() => handleResolveDispute(dispute._id, 'dismissed')}
                            disabled={actionLoading === `dispute_${dispute._id}`}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.dismissBtnText}>Dismiss Report</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.resolveBtn}
                            onPress={() => handleResolveDispute(dispute._id, 'resolved')}
                            disabled={actionLoading === `dispute_${dispute._id}`}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.resolveBtnText}>Resolve & Close</Text>
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </LiquidGlassCard>
                  </View>
                );
              })
            ) : (
              <LiquidGlassCard variant="default">
                <View style={styles.emptyCard}>
                  <CheckCircle2 size={44} color={Colors.drySage} />
                  <Text style={styles.emptyTitle}>No Open Disputes</Text>
                  <Text style={styles.emptySubtitle}>All peer issues have been reviewed and resolved.</Text>
                </View>
              </LiquidGlassCard>
            )}
          </View>
        ) : null}

        {/* 2. USERS TAB */}
        {activeTab === 'users' ? (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeading}>Student Verification & Directory</Text>

            <View style={styles.searchBox}>
              <Search size={16} color={Colors.powderBlue} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by student name or hostel ID..."
                placeholderTextColor={Colors.textMuted}
                value={searchUser}
                onChangeText={setSearchUser}
              />
            </View>

            {filteredUsers.map((u) => (
              <View key={u._id} style={styles.cardOuter}>
                <LiquidGlassCard variant="default">
                  <View style={styles.userCardContent}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>{u.name ? u.name.charAt(0).toUpperCase() : 'U'}</Text>
                    </View>

                    <View style={styles.userInfo}>
                      <View style={styles.userNameRow}>
                        <Text style={styles.userNameText}>{u.name}</Text>
                        {u.isVerified ? (
                          <CheckCircle2 size={13} color={Colors.drySage} />
                        ) : null}
                      </View>
                      <Text style={styles.userSubtext}>
                        {u.email} • {u.hostelOrCollegeId || 'No ID'}
                      </Text>
                      <Text style={styles.userKarma}>⭐ {u.karmaScore ?? 100} Karma Points</Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.verifyBtn,
                        u.isVerified ? styles.verifyBtnActive : styles.verifyBtnInactive,
                      ]}
                      onPress={() => handleToggleVerify(u._id, u.isVerified)}
                      disabled={actionLoading === `user_${u._id}`}
                      activeOpacity={0.8}
                    >
                      {actionLoading === `user_${u._id}` ? (
                        <ActivityIndicator size="small" color={u.isVerified ? Colors.inkBlack : Colors.powderBlue} />
                      ) : (
                        <Text
                          style={[
                            styles.verifyBtnText,
                            u.isVerified ? styles.verifyBtnTextActive : styles.verifyBtnTextInactive,
                          ]}
                        >
                          {u.isVerified ? 'Verified' : 'Verify ID'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </LiquidGlassCard>
              </View>
            ))}
          </View>
        ) : null}

        {/* 3. ERRANDS TAB */}
        {activeTab === 'errands' ? (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeading}>Global Errand Moderation</Text>

            {errands.map((e) => (
              <TouchableOpacity
                key={e._id}
                style={styles.cardOuter}
                onPress={() => router.push(`/errand/${e._id}`)}
                activeOpacity={0.85}
              >
                <LiquidGlassCard variant="default">
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.errandModerationTitle}>{e.title}</Text>
                    <View style={styles.budgetBadge}>
                      <Text style={styles.budgetText}>₹{e.budget}</Text>
                    </View>
                  </View>

                  <Text style={styles.errandModerationSub}>
                    Status: <Text style={styles.bold}>{e.status.toUpperCase()}</Text> • Requester:{' '}
                    {e.requesterId?.name || 'Student'}
                  </Text>
                  <Text style={styles.errandModerationDate}>
                    Posted on {new Date(e.createdAt).toLocaleString()}
                  </Text>
                </LiquidGlassCard>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.inkBlack,
  },
  tabNavWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(52, 73, 102, 0.35)',
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
  kpiGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: 'rgba(52, 73, 102, 0.35)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  kpiValue: {
    fontSize: Typography.lg,
    fontWeight: '800',
    color: Colors.porcelain,
  },
  kpiLabel: {
    fontSize: Typography.xs - 3,
    color: Colors.powderBlue,
    textTransform: 'uppercase',
    marginTop: 2,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  sectionContainer: {
    gap: Spacing.sm,
  },
  sectionHeading: {
    fontSize: Typography.base,
    fontWeight: '800',
    color: Colors.porcelain,
    marginBottom: Spacing.xs,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    backgroundColor: 'rgba(13, 24, 33, 0.65)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.porcelain,
  },
  cardOuter: {
    marginBottom: Spacing.xs,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  disputeReasonBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  disputeReasonText: {
    fontSize: Typography.xs - 2,
    fontWeight: '800',
    color: '#F87171',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  statusBadgeSuccess: {
    backgroundColor: 'rgba(191, 204, 148, 0.15)',
    borderColor: Colors.glassSageBorder,
  },
  statusBadgeDismissed: {
    backgroundColor: 'rgba(52, 73, 102, 0.3)',
    borderColor: Colors.glassBorder,
  },
  statusBadgeOpen: {
    backgroundColor: 'rgba(180, 205, 237, 0.15)',
    borderColor: 'rgba(180, 205, 237, 0.3)',
  },
  statusBadgeText: {
    fontSize: Typography.xs - 2,
    fontWeight: '800',
  },
  statusTextSuccess: {
    color: Colors.drySage,
  },
  statusTextDismissed: {
    color: Colors.powderBlue,
  },
  statusTextOpen: {
    color: Colors.powderBlue,
  },
  disputeDescription: {
    fontSize: Typography.sm,
    color: Colors.porcelain,
    fontStyle: 'italic',
    marginVertical: Spacing.xs,
    lineHeight: 18,
  },
  disputePartyInfo: {
    backgroundColor: 'rgba(13, 24, 33, 0.55)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
    gap: 3,
    borderWidth: 1,
    borderColor: 'rgba(52, 73, 102, 0.35)',
  },
  partyText: {
    fontSize: Typography.xs,
    color: Colors.powderBlue,
  },
  bold: {
    fontWeight: '800',
    color: Colors.porcelain,
  },
  disputeActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  dismissBtn: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(52, 73, 102, 0.45)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissBtnText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.powderBlue,
  },
  resolveBtn: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.powderBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resolveBtnText: {
    fontSize: Typography.xs,
    fontWeight: '800',
    color: Colors.inkBlack,
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(180, 205, 237, 0.15)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  userAvatarText: {
    fontSize: Typography.base,
    fontWeight: '800',
    color: Colors.powderBlue,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userNameText: {
    fontSize: Typography.sm,
    fontWeight: '800',
    color: Colors.porcelain,
  },
  userSubtext: {
    fontSize: Typography.xs - 1,
    color: Colors.powderBlue,
    marginTop: 1,
  },
  userKarma: {
    fontSize: Typography.xs - 2,
    color: Colors.drySage,
    fontWeight: '700',
    marginTop: 2,
  },
  verifyBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  verifyBtnActive: {
    backgroundColor: Colors.drySage,
  },
  verifyBtnInactive: {
    backgroundColor: 'rgba(52, 73, 102, 0.4)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  verifyBtnText: {
    fontSize: Typography.xs - 1,
    fontWeight: '800',
  },
  verifyBtnTextActive: {
    color: Colors.inkBlack,
  },
  verifyBtnTextInactive: {
    color: Colors.powderBlue,
  },
  errandModerationTitle: {
    fontSize: Typography.sm,
    fontWeight: '800',
    color: Colors.porcelain,
    flex: 1,
  },
  budgetBadge: {
    backgroundColor: 'rgba(191, 204, 148, 0.15)',
    borderWidth: 1,
    borderColor: Colors.glassSageBorder,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  budgetText: {
    fontSize: Typography.xs - 1,
    fontWeight: '800',
    color: Colors.drySage,
  },
  errandModerationSub: {
    fontSize: Typography.xs,
    color: Colors.powderBlue,
    marginTop: 4,
  },
  errandModerationDate: {
    fontSize: Typography.xs - 2,
    color: 'rgba(240, 244, 239, 0.55)',
    marginTop: 2,
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: Typography.base,
    fontWeight: '800',
    color: Colors.porcelain,
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.xs,
    color: Colors.powderBlue,
    marginTop: 2,
    textAlign: 'center',
  },
  restrictedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.inkBlack,
  },
  restrictedTitle: {
    fontSize: Typography.lg,
    fontWeight: '800',
    color: '#F87171',
    marginTop: Spacing.md,
  },
  restrictedSubtitle: {
    fontSize: Typography.sm,
    color: Colors.powderBlue,
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  backBtn: {
    backgroundColor: Colors.powderBlue,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.full,
  },
  backBtnText: {
    color: Colors.inkBlack,
    fontWeight: '800',
  },
});
