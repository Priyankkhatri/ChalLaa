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
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';

const ROLE_FILTERS = [
  { id: 'all', label: 'All Errands' },
  { id: 'posted', label: 'Posted by Me' },
  { id: 'accepted', label: 'Accepted (Runner)' },
];

const STATUS_COLORS = {
  posted: { bg: '#DBEAFE', text: '#1D4ED8', label: 'Posted' },
  accepted: { bg: '#FEF3C7', text: '#B45309', label: 'Accepted' },
  in_progress: { bg: '#E0E7FF', text: '#4338CA', label: 'In Progress' },
  delivered: { bg: '#DCFCE7', text: '#047857', label: 'Delivered' },
  cancelled: { bg: '#FEE2E2', text: '#B91C1C', label: 'Cancelled' },
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
  }, [selectedRole]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyErrands();
  };

  const renderErrandItem = ({ item }) => {
    const isRequester = item.requesterId?._id === user?._id || item.requesterId === user?._id;
    const isRunner = item.runnerId?._id === user?._id || item.runnerId === user?._id;

    const statusStyle = STATUS_COLORS[item.status] || STATUS_COLORS.posted;

    const otherPerson = isRequester ? item.runnerId : item.requesterId;
    const otherRoleLabel = isRequester ? 'Runner' : 'Requester';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => router.push(`/errand/${item._id}`)}
      >
        <View style={styles.cardHeader}>
          {/* My Role Badge */}
          <View style={[styles.roleBadge, isRequester ? styles.roleRequester : styles.roleRunner]}>
            <Ionicons
              name={isRequester ? 'person-outline' : 'bicycle-outline'}
              size={12}
              color={isRequester ? Colors.primaryDark : Colors.secondaryDark}
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
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
              {statusStyle.label}
            </Text>
          </View>
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="pricetag-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.detailText}>Budget: ₹{item.budget || 0}</Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="folder-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{item.category?.toUpperCase() || 'GENERAL'}</Text>
          </View>
        </View>

        {otherPerson ? (
          <View style={styles.counterpartyRow}>
            <Ionicons name="people-outline" size={14} color={Colors.primary} />
            <Text style={styles.counterpartyText}>
              {otherRoleLabel}: <Text style={styles.counterpartyName}>{otherPerson.name || 'Peer'}</Text>
            </Text>
          </View>
        ) : (
          <View style={styles.counterpartyRow}>
            <Ionicons name="hourglass-outline" size={14} color={Colors.accent} />
            <Text style={styles.counterpartyText}>Waiting for a runner to accept...</Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.timeText}>
            {new Date(item.createdAt).toLocaleDateString()} at{' '}
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>

          <View style={styles.viewDetailsRow}>
            <Text style={styles.viewDetailsText}>Details</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Role Segmented Filter */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {ROLE_FILTERS.map((filter) => {
            const active = selectedRole === filter.id;
            return (
              <TouchableOpacity
                key={filter.id}
                style={[styles.filterTab, active && styles.filterTabActive]}
                onPress={() => setSelectedRole(filter.id)}
              >
                <Text style={[styles.filterTabText, active && styles.filterTabTextActive]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
              <Ionicons name="clipboard-outline" size={56} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Errands Found</Text>
              <Text style={styles.emptySubtitle}>
                {selectedRole === 'posted'
                  ? "You haven't posted any errands yet. Need something picked up from the market or mess?"
                  : selectedRole === 'accepted'
                  ? "You haven't accepted any errands yet. Check the nearby feed to help out a peer!"
                  : "You don't have any active or past errands yet."}
              </Text>
              <View style={styles.emptyActionsRow}>
                <TouchableOpacity
                  style={styles.actionBtnPrimary}
                  onPress={() => router.push('/errand/post')}
                >
                  <Ionicons name="add" size={16} color={Colors.white} />
                  <Text style={styles.actionBtnPrimaryText}>Post Errand</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtnSecondary}
                  onPress={() => router.push('/(tabs)')}
                >
                  <Ionicons name="compass-outline" size={16} color={Colors.primary} />
                  <Text style={styles.actionBtnSecondaryText}>Discover</Text>
                </TouchableOpacity>
              </View>
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
  filterBar: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.sm,
  },
  filterScroll: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  listContent: {
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
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  roleRequester: {
    backgroundColor: Colors.primaryLight,
  },
  roleRunner: {
    backgroundColor: '#DCFCE7',
  },
  roleBadgeText: {
    fontSize: Typography.xs - 2,
    fontWeight: 'bold',
  },
  roleTextRequester: {
    color: Colors.primaryDark,
  },
  roleTextRunner: {
    color: Colors.secondaryDark,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  statusBadgeText: {
    fontSize: Typography.xs - 2,
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: Typography.base,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  counterpartyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  counterpartyText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
  counterpartyName: {
    fontWeight: 'bold',
    color: Colors.text,
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
  timeText: {
    fontSize: Typography.xs - 2,
    color: Colors.textMuted,
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
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
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  emptyState: {
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  emptyActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  actionBtnPrimaryText: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: 'bold',
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  actionBtnSecondaryText: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: 'bold',
  },
});
