import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';

const ROLE_FILTERS = [
  { id: 'all', label: 'All Tasks' },
  { id: 'posted', label: 'Requested by Me' },
  { id: 'accepted', label: 'I am Running' },
];

const STATUS_CONFIG = {
  posted: { bg: '#EFF6FF', text: '#2563EB', label: 'Posted', icon: 'time-outline' },
  accepted: { bg: '#FEF3C7', text: '#D97706', label: 'Accepted', icon: 'bicycle-outline' },
  in_progress: { bg: '#EEF2FF', text: '#4F46E5', label: 'In Progress', icon: 'navigate-outline' },
  delivered: { bg: '#ECFDF5', text: '#059669', label: 'Delivered', icon: 'checkmark-circle-outline' },
  cancelled: { bg: '#FEE2E2', text: '#DC2626', label: 'Cancelled', icon: 'close-circle-outline' },
};

export default function MyErrandsScreen() {
  const { user } = useAuth();
  const [errands, setErrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRole, setSelectedRole] = useState('all');

  const fetchMyErrands = useCallback(async () => {
    try {
      setError(null);
      const params = {};
      if (selectedRole !== 'all') {
        params.role = selectedRole;
      }
      const response = await api.get('/errands/mine', { params });
      setErrands(response.data.errands || []);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load your errands';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedRole]);

  useEffect(() => {
    setLoading(true);
    fetchMyErrands();
  }, [selectedRole, fetchMyErrands]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyErrands();
  };

  const renderErrandItem = ({ item }) => {
    const isRequester = item.requesterId?._id === user?._id || item.requesterId === user?._id;
    const isRunner = item.runnerId?._id === user?._id || item.runnerId === user?._id;

    const statusConf = STATUS_CONFIG[item.status] || STATUS_CONFIG.posted;
    const otherPerson = isRequester ? item.runnerId : item.requesterId;
    const otherRoleLabel = isRequester ? 'Runner' : 'Requester';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => router.push(`/errand/${item._id}`)}
      >
        <View style={styles.cardHeader}>
          {/* My Role Badge */}
          <View style={[styles.roleBadge, isRequester ? styles.roleRequester : styles.roleRunner]}>
            <Ionicons
              name={isRequester ? 'person' : 'bicycle'}
              size={12}
              color={isRequester ? Colors.primary : Colors.secondaryDark}
            />
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
            <Ionicons name={statusConf.icon} size={12} color={statusConf.text} />
            <Text style={[styles.statusBadgeText, { color: statusConf.text }]}>
              {statusConf.label}
            </Text>
          </View>
        </View>

        <Text style={styles.errandTitle}>{item.title}</Text>

        <View style={styles.detailsRow}>
          <View style={styles.budgetBox}>
            <Text style={styles.budgetLabel}>Budget</Text>
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

        <View style={styles.cardFooter}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.dateText}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.viewDetailsRow}>
            <Text style={styles.viewDetailsText}>Open Task</Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Segmented Role Filter Tabs */}
      <View style={styles.segmentedControl}>
        {ROLE_FILTERS.map((f) => {
          const isSelected = selectedRole === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              style={[styles.segmentBtn, isSelected && styles.segmentBtnActive]}
              onPress={() => setSelectedRole(f.id)}
            >
              <Text style={[styles.segmentText, isSelected && styles.segmentTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Main List */}
      {loading && !refreshing ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your errands...</Text>
        </View>
      ) : (
        <FlatList
          data={errands}
          keyExtractor={(item) => item._id}
          renderItem={renderErrandItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="clipboard-outline" size={40} color={Colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No Errands in this View</Text>
              <Text style={styles.emptySubtitle}>
                {selectedRole === 'posted'
                  ? 'You haven\'t posted any errand requests yet.'
                  : selectedRole === 'accepted'
                  ? 'You haven\'t accepted any errands as a runner yet.'
                  : 'You have no active or completed errands.'}
              </Text>

              <TouchableOpacity
                style={styles.emptyPostBtn}
                onPress={() => router.push('/errand/post')}
              >
                <Ionicons name="add-circle" size={18} color={Colors.white} />
                <Text style={styles.emptyPostBtnText}>Post a Request</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    margin: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  segmentBtnActive: {
    backgroundColor: Colors.primary,
    ...Shadows.subtle,
  },
  segmentText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
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
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  roleRequester: {
    backgroundColor: Colors.primaryLight,
  },
  roleRunner: {
    backgroundColor: Colors.secondaryLight,
  },
  roleBadgeText: {
    fontSize: Typography.xs - 2,
    fontWeight: 'bold',
  },
  roleTextRequester: {
    color: Colors.primary,
  },
  roleTextRunner: {
    color: Colors.secondaryDark,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  statusBadgeText: {
    fontSize: Typography.xs - 2,
    fontWeight: 'bold',
  },
  errandTitle: {
    fontSize: Typography.base,
    fontWeight: 'bold',
    color: Colors.text,
    marginVertical: Spacing.xs,
  },
  detailsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
    alignItems: 'center',
  },
  budgetBox: {
    paddingRight: Spacing.md,
  },
  budgetLabel: {
    fontSize: Typography.xs - 2,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  budgetValue: {
    fontSize: Typography.sm,
    fontWeight: 'bold',
    color: Colors.secondaryDark,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
    marginRight: Spacing.md,
  },
  personBox: {
    flex: 1,
  },
  personLabel: {
    fontSize: Typography.xs - 2,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  personValue: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    fontWeight: 'bold',
    color: Colors.primary,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  emptyPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
  },
  emptyPostBtnText: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: 'bold',
  },
});
