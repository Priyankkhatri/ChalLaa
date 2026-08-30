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
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
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
        <Lock size={64} color={Colors.danger} />
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
      <View style={styles.tabNav}>
        <TouchableOpacity
          style={[styles.tabNavItem, activeTab === 'disputes' && styles.tabNavItemActive]}
          onPress={() => setActiveTab('disputes')}
        >
          <ShieldAlert
            size={16}
            color={activeTab === 'disputes' ? Colors.danger : Colors.textSecondary}
          />
          <Text style={[styles.tabNavText, activeTab === 'disputes' && styles.tabNavTextActive]}>
            Disputes ({disputes.filter((d) => d.status === 'open').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabNavItem, activeTab === 'users' && styles.tabNavItemActive]}
          onPress={() => setActiveTab('users')}
        >
          <Users
            size={16}
            color={activeTab === 'users' ? Colors.primary : Colors.textSecondary}
          />
          <Text style={[styles.tabNavText, activeTab === 'users' && styles.tabNavTextActive]}>
            Students ({users.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabNavItem, activeTab === 'errands' && styles.tabNavItemActive]}
          onPress={() => setActiveTab('errands')}
        >
          <ListOrdered
            size={16}
            color={activeTab === 'errands' ? Colors.primary : Colors.textSecondary}
          />
          <Text style={[styles.tabNavText, activeTab === 'errands' && styles.tabNavTextActive]}>
            Errands ({errands.length})
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
        {/* KPI Metrics Grid */}
        {stats ? (
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{stats.totalUsers}</Text>
              <Text style={styles.kpiLabel}>Total Students</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={[styles.kpiValue, { color: Colors.primary }]}>{stats.activeErrands}</Text>
              <Text style={styles.kpiLabel}>Active Tasks</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={[styles.kpiValue, { color: Colors.secondaryDark }]}>
                {stats.completedErrands}
              </Text>
              <Text style={styles.kpiLabel}>Delivered</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={[styles.kpiValue, { color: Colors.danger }]}>{stats.openDisputes}</Text>
              <Text style={styles.kpiLabel}>Open Disputes</Text>
            </View>
          </View>
        ) : null}

        {/* 1. DISPUTES TAB */}
        {activeTab === 'disputes' ? (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeading}>Campus Dispute Moderation</Text>

            {loading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing.xl }} />
            ) : disputes.length > 0 ? (
              disputes.map((dispute) => {
                const isResolved = dispute.status === 'resolved';
                const isDismissed = dispute.status === 'dismissed';

                return (
                  <View key={dispute._id} style={styles.itemCard}>
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
                        >
                          <Text style={styles.dismissBtnText}>Dismiss Report</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.resolveBtn}
                          onPress={() => handleResolveDispute(dispute._id, 'resolved')}
                          disabled={actionLoading === `dispute_${dispute._id}`}
                        >
                          <Text style={styles.resolveBtnText}>Resolve & Close</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyCard}>
                <CheckCircle2 size={44} color={Colors.secondaryDark} />
                <Text style={styles.emptyTitle}>No Open Disputes</Text>
                <Text style={styles.emptySubtitle}>All peer issues have been reviewed and resolved.</Text>
              </View>
            )}
          </View>
        ) : null}

        {/* 2. USERS TAB */}
        {activeTab === 'users' ? (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeading}>Student Verification & Directory</Text>

            <View style={styles.searchBox}>
              <Search size={16} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by student name or hostel ID..."
                placeholderTextColor={Colors.textMuted}
                value={searchUser}
                onChangeText={setSearchUser}
              />
            </View>

            {filteredUsers.map((u) => (
              <View key={u._id} style={styles.userCard}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>{u.name ? u.name.charAt(0).toUpperCase() : 'U'}</Text>
                </View>

                <View style={styles.userInfo}>
                  <View style={styles.userNameRow}>
                    <Text style={styles.userNameText}>{u.name}</Text>
                    {u.isVerified ? (
                      <CheckCircle2 size={13} color={Colors.secondaryDark} />
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
                >
                  {actionLoading === `user_${u._id}` ? (
                    <ActivityIndicator size="small" color={u.isVerified ? Colors.white : Colors.primary} />
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
                style={styles.errandModerationCard}
                onPress={() => router.push(`/errand/${e._id}`)}
              >
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
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.subtle,
  },
  kpiValue: {
    fontSize: Typography.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  kpiLabel: {
    fontSize: Typography.xs - 3,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: 2,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sectionContainer: {
    gap: Spacing.sm,
  },
  sectionHeading: {
    fontSize: Typography.base,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.text,
  },
  itemCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.subtle,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  disputeReasonBadge: {
    backgroundColor: Colors.dangerLight,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  disputeReasonText: {
    fontSize: Typography.xs - 2,
    fontWeight: 'bold',
    color: Colors.dangerDark,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusBadgeSuccess: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeDismissed: {
    backgroundColor: '#F1F5F9',
  },
  statusBadgeOpen: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeText: {
    fontSize: Typography.xs - 2,
    fontWeight: 'bold',
  },
  statusTextSuccess: {
    color: Colors.secondaryDark,
  },
  statusTextDismissed: {
    color: Colors.textSecondary,
  },
  statusTextOpen: {
    color: '#B45309',
  },
  disputeDescription: {
    fontSize: Typography.sm,
    color: Colors.text,
    fontStyle: 'italic',
    marginVertical: Spacing.xs,
  },
  disputePartyInfo: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
    gap: 2,
  },
  partyText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
  bold: {
    fontWeight: 'bold',
    color: Colors.text,
  },
  disputeActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  dismissBtn: {
    flex: 1,
    height: 38,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissBtnText: {
    fontSize: Typography.xs,
    fontWeight: 'bold',
    color: Colors.textSecondary,
  },
  resolveBtn: {
    flex: 1,
    height: 38,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resolveBtnText: {
    fontSize: Typography.xs,
    fontWeight: 'bold',
    color: Colors.white,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.subtle,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  userAvatarText: {
    fontSize: Typography.base,
    fontWeight: 'bold',
    color: Colors.primary,
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
    fontWeight: 'bold',
    color: Colors.text,
  },
  userSubtext: {
    fontSize: Typography.xs - 1,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  userKarma: {
    fontSize: Typography.xs - 2,
    color: '#B45309',
    fontWeight: '600',
    marginTop: 2,
  },
  verifyBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  verifyBtnActive: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  verifyBtnInactive: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
  },
  verifyBtnText: {
    fontSize: Typography.xs - 1,
    fontWeight: 'bold',
  },
  verifyBtnTextActive: {
    color: Colors.secondaryDark,
  },
  verifyBtnTextInactive: {
    color: Colors.primary,
  },
  errandModerationCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.subtle,
  },
  errandModerationTitle: {
    fontSize: Typography.sm,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  budgetBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  budgetText: {
    fontSize: Typography.xs - 1,
    fontWeight: 'bold',
    color: Colors.secondaryDark,
  },
  errandModerationSub: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  errandModerationDate: {
    fontSize: Typography.xs - 2,
    color: Colors.textMuted,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  emptyTitle: {
    fontSize: Typography.base,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  restrictedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  restrictedTitle: {
    fontSize: Typography.lg,
    fontWeight: 'bold',
    color: Colors.danger,
    marginTop: Spacing.md,
  },
  restrictedSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  backBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
  },
  backBtnText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
});
