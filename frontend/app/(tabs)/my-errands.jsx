import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  User,
  Bike,
  Clock,
  Navigation,
  CheckCircle2,
  XCircle,
  Calendar,
  ArrowRight,
  Plus,
  ClipboardList,
} from 'lucide-react-native';
import { router } from 'expo-router';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { LiquidGlassCard, LiquidCanvas } from '../../components/ui/LiquidGlass';

const ROLE_FILTERS = [
  { id: 'all', label: 'All Tasks' },
  { id: 'posted', label: 'Requested by Me' },
  { id: 'accepted', label: 'I am Running' },
];

const STATUS_CONFIG = {
  posted: { bg: 'rgba(180, 205, 237, 0.15)', text: Colors.powderBlue, label: 'Posted', icon: Clock },
  accepted: { bg: 'rgba(191, 204, 148, 0.18)', text: Colors.drySage, label: 'Accepted', icon: Bike },
  in_progress: { bg: 'rgba(52, 73, 102, 0.45)', text: Colors.porcelain, label: 'In Progress', icon: Navigation },
  delivered: { bg: 'rgba(191, 204, 148, 0.25)', text: Colors.drySage, label: 'Delivered', icon: CheckCircle2 },
  cancelled: { bg: 'rgba(239, 68, 68, 0.15)', text: '#F87171', label: 'Cancelled', icon: XCircle },
};

export default function MyErrandsScreen() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [errands, setErrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRole, setSelectedRole] = useState('all');

  const fetchMyErrands = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError(null);
      const params = {};
      if (selectedRole !== 'all') {
        params.role = selectedRole;
      }
      const response = await api.get('/errands/mine', { params });
      setErrands(response.data.errands || []);
    } catch (err) {
      if (err.response?.status !== 401) {
        const msg = err.response?.data?.message || err.message || 'Failed to load your errands';
        setError(msg);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, selectedRole]);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      setLoading(true);
      fetchMyErrands();
    }
  }, [isAuthenticated, authLoading, selectedRole, fetchMyErrands]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyErrands();
  };

  const renderErrandItem = ({ item }) => {
    const isRequester = item.requesterId?._id === user?._id || item.requesterId === user?._id;
    const statusConf = STATUS_CONFIG[item.status] || STATUS_CONFIG.posted;
    const StatusIcon = statusConf.icon;
    const otherPerson = isRequester ? item.runnerId : item.requesterId;
    const otherRoleLabel = isRequester ? 'Runner' : 'Requester';

    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => router.push(`/errand/${item._id}`)}
        style={styles.cardOuter}
      >
        <LiquidGlassCard variant="default">
          {/* Card Header */}
          <View style={styles.cardHeader}>
            {/* Role Badge */}
            <View style={[styles.roleBadge, isRequester ? styles.roleRequester : styles.roleRunner]}>
              {isRequester ? (
                <User size={12} color={Colors.powderBlue} />
              ) : (
                <Bike size={12} color={Colors.drySage} />
              )}
              <Text
                style={[
                  styles.roleBadgeText,
                  isRequester ? styles.roleTextRequester : styles.roleTextRunner,
                ]}
              >
                {isRequester ? 'My Request' : 'I am Runner'}
              </Text>
            </View>

            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: statusConf.bg }]}>
              <StatusIcon size={12} color={statusConf.text} />
              <Text style={[styles.statusBadgeText, { color: statusConf.text }]}>
                {statusConf.label}
              </Text>
            </View>
          </View>

          <Text style={styles.errandTitle} numberOfLines={2}>
            {item.title}
          </Text>

          {/* Details Row */}
          <View style={styles.detailsRow}>
            <View style={styles.budgetBox}>
              <Text style={styles.budgetLabel}>Offer</Text>
              <Text style={styles.budgetValue}>₹{item.budget || 0}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.personBox}>
              <Text style={styles.personLabel}>{otherRoleLabel}</Text>
              <Text style={styles.personValue} numberOfLines={1}>
                {otherPerson ? otherPerson.name : 'Waiting for runner...'}
              </Text>
            </View>
          </View>

          {/* Card Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.dateRow}>
              <Calendar size={12} color={Colors.powderBlue} />
              <Text style={styles.dateText}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.viewDetailsRow}>
              <Text style={styles.viewDetailsText}>Open Task</Text>
              <ArrowRight size={13} color={Colors.powderBlue} strokeWidth={2.8} />
            </View>
          </View>
        </LiquidGlassCard>
      </TouchableOpacity>
    );
  };

  return (
    <LiquidCanvas style={styles.container}>
      {/* Liquid Glass Segmented Capsule */}
      <View style={styles.segmentedWrapper}>
        <BlurView intensity={Platform.OS === 'ios' ? 30 : 60} tint="dark" style={styles.segmentedBlur}>
          <View style={styles.segmentedControl}>
            {ROLE_FILTERS.map((f) => {
              const isSelected = selectedRole === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.segmentBtn, isSelected && styles.segmentBtnActive]}
                  onPress={() => setSelectedRole(f.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentText, isSelected && styles.segmentTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </BlurView>
      </View>

      {/* Main List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.powderBlue} />
          <Text style={styles.loadingText}>Loading your errands...</Text>
        </View>
      ) : (
        <FlatList
          data={errands}
          keyExtractor={(item) => item._id}
          renderItem={renderErrandItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.powderBlue]}
              tintColor={Colors.powderBlue}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <ClipboardList size={36} color={Colors.powderBlue} />
              </View>
              <Text style={styles.emptyTitle}>No Errands Found</Text>
              <Text style={styles.emptySubtitle}>
                {selectedRole === 'posted'
                  ? "You haven't posted any errand requests yet."
                  : selectedRole === 'accepted'
                  ? "You haven't accepted any errands to run yet."
                  : 'You have no active or completed errands at the moment.'}
              </Text>

              <TouchableOpacity
                style={styles.emptyPostBtnWrapper}
                onPress={() => router.push('/errand/post')}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={Colors.gradientPrimary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.emptyPostBtn}
                >
                  <Plus size={16} color={Colors.inkBlack} strokeWidth={2.8} />
                  <Text style={styles.emptyPostBtnText}>Post a Request</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </LiquidCanvas>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  segmentedWrapper: {
    margin: Spacing.md,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: Colors.glassBorder,
    ...(Platform.OS === 'web' ? {
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
    } : {}),
    ...Shadows.subtle,
  },
  segmentedBlur: {
    width: '100%',
  },
  segmentedControl: {
    flexDirection: 'row',
    padding: 4,
    backgroundColor: 'rgba(52, 73, 102, 0.25)',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: Spacing.sm - 1,
    alignItems: 'center',
    borderRadius: BorderRadius.full,
  },
  segmentBtnActive: {
    backgroundColor: Colors.powderBlue,
  },
  segmentText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.porcelain,
  },
  segmentTextActive: {
    color: Colors.inkBlack,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl + 40,
    gap: Spacing.md,
  },
  cardOuter: {
    marginBottom: Spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  roleRequester: {
    backgroundColor: 'rgba(180, 205, 237, 0.12)',
    borderColor: 'rgba(180, 205, 237, 0.25)',
  },
  roleRunner: {
    backgroundColor: 'rgba(191, 204, 148, 0.12)',
    borderColor: Colors.glassSageBorder,
  },
  roleBadgeText: {
    fontSize: Typography.xs - 2,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  roleTextRequester: {
    color: Colors.powderBlue,
  },
  roleTextRunner: {
    color: Colors.drySage,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  statusBadgeText: {
    fontSize: Typography.xs - 2,
    fontWeight: '800',
  },
  errandTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.porcelain,
    marginVertical: Spacing.xs,
    letterSpacing: -0.2,
  },
  detailsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(13, 24, 33, 0.55)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(52, 73, 102, 0.35)',
  },
  budgetBox: {
    paddingRight: Spacing.md,
  },
  budgetLabel: {
    fontSize: Typography.xs - 3,
    color: Colors.powderBlue,
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  budgetValue: {
    fontSize: Typography.sm + 1,
    fontWeight: '800',
    color: Colors.drySage,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(52, 73, 102, 0.5)',
    marginRight: Spacing.md,
  },
  personBox: {
    flex: 1,
  },
  personLabel: {
    fontSize: Typography.xs - 3,
    color: Colors.powderBlue,
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  personValue: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.porcelain,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm + 2,
    paddingTop: Spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(52, 73, 102, 0.35)',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    fontSize: Typography.xs - 2,
    color: Colors.textMuted,
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: Typography.xs,
    fontWeight: '800',
    color: Colors.powderBlue,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.sm,
    color: Colors.powderBlue,
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyIconBox: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(52, 73, 102, 0.45)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: '800',
    color: Colors.porcelain,
  },
  emptySubtitle: {
    fontSize: Typography.xs,
    color: 'rgba(240, 244, 239, 0.7)',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  emptyPostBtnWrapper: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    ...Shadows.glow,
  },
  emptyPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.full,
  },
  emptyPostBtnText: {
    color: Colors.inkBlack,
    fontSize: Typography.sm,
    fontWeight: '800',
  },
});
