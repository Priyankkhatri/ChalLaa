import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Receipt, CheckCircle2, Clock, Wallet, CheckCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';

/**
 * ExpenseSection Component
 * Real-time ledger for itemized out-of-pocket expenses and reimbursement settlements.
 */
export default function ExpenseSection({ errand, currentUser }) {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ totalAmount: 0, pendingAmount: 0, settledAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [settlingId, setSettlingId] = useState(null);

  // Form states (for runner)
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const isRunner = errand?.runnerId?._id === currentUser?._id || errand?.runnerId === currentUser?._id;
  const isRequester = errand?.requesterId?._id === currentUser?._id || errand?.requesterId === currentUser?._id;

  const fetchExpenses = useCallback(async () => {
    try {
      const response = await api.get(`/expenses/errand/${errand._id}`);
      setExpenses(response.data.transactions || []);
      setSummary({
        totalAmount: response.data.totalAmount || 0,
        pendingAmount: response.data.pendingAmount || 0,
        settledAmount: response.data.settledAmount || 0,
      });
    } catch (error) {
      console.warn('[Fetch expenses error]', error);
    } finally {
      setLoading(false);
    }
  }, [errand._id]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Runner logs new expense
  const handleLogExpense = async () => {
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid expense amount in ₹.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/expenses', {
        errandId: errand._id,
        amount: numericAmount,
        notes: notes.trim(),
      });
      setAmount('');
      setNotes('');
      await fetchExpenses();
      Alert.alert('Expense Logged', `Logged ₹${numericAmount}. Requester can now review and reimburse.`);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to log expense');
    } finally {
      setSubmitting(false);
    }
  };

  // Requester settles/reimburses expense
  const handleSettleExpense = async (transactionId, expenseAmount) => {
    Alert.alert(
      'Confirm Reimbursement',
      `Have you paid ₹${expenseAmount} to the runner via cash / UPI?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Reimbursed',
          onPress: async () => {
            setSettlingId(transactionId);
            try {
              await api.patch(`/expenses/${transactionId}/settle`);
              await fetchExpenses();
              Alert.alert('Settled!', 'Expense has been marked as reimbursed.');
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to settle expense');
            } finally {
              setSettlingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Expense Summary Header */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryTopRow}>
          <Text style={styles.summaryTitle}>Expense & Reimbursement</Text>
          <View style={styles.budgetPill}>
            <Text style={styles.budgetText}>Est. Budget: ₹{errand.budget || 0}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Spent</Text>
            <Text style={styles.statValue}>₹{summary.totalAmount}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={[styles.statValue, { color: Colors.accent }]}>₹{summary.pendingAmount}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Settled</Text>
            <Text style={[styles.statValue, { color: Colors.secondaryDark }]}>
              ₹{summary.settledAmount}
            </Text>
          </View>
        </View>
      </View>

      {/* Runner: Log Expense Form */}
      {isRunner && errand.status !== 'cancelled' ? (
        <View style={styles.logCard}>
          <Text style={styles.formTitle}>Log Spent Amount</Text>
          <Text style={styles.formSubtitle}>
            Record exact money spent on this errand for requester reimbursement.
          </Text>

          <View style={styles.amountInputRow}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="e.g. 120"
              placeholderTextColor={Colors.textMuted}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>

          <TextInput
            style={styles.notesInput}
            placeholder="Notes (e.g. Amul Milk ₹65 + Bread ₹40)"
            placeholderTextColor={Colors.textMuted}
            value={notes}
            onChangeText={setNotes}
          />

          <TouchableOpacity
            onPress={handleLogExpense}
            disabled={submitting}
            style={styles.logSubmitBtnWrapper}
          >
            <LinearGradient
              colors={Colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.logSubmitBtn, submitting && styles.btnDisabled]}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Receipt size={16} color={Colors.white} />
                  <Text style={styles.logSubmitBtnText}>Record Expense</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Expense List */}
      <View style={styles.listSection}>
        <Text style={styles.listSectionTitle}>Logged Transactions</Text>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing.md }} />
        ) : expenses.length > 0 ? (
          expenses.map((item) => {
            const isSettled = item.status === 'settled';
            return (
              <View key={item._id} style={styles.transactionCard}>
                <View style={styles.transTopRow}>
                  <View style={styles.amountBox}>
                    <Text style={styles.transAmount}>₹{item.amount}</Text>
                    <Text style={styles.transPaidBy}>
                      Paid by: {item.paidBy?.name || 'Runner'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      isSettled ? styles.statusSettled : styles.statusPending,
                    ]}
                  >
                    {isSettled ? (
                      <CheckCircle2 size={12} color={Colors.secondaryDark} />
                    ) : (
                      <Clock size={12} color="#B45309" />
                    )}
                    <Text
                      style={[
                        styles.statusPillText,
                        isSettled ? styles.statusTextSettled : styles.statusTextPending,
                      ]}
                    >
                      {isSettled ? 'Settled' : 'Pending'}
                    </Text>
                  </View>
                </View>

                {item.notes ? <Text style={styles.transNotes}>"{item.notes}"</Text> : null}

                <View style={styles.transFooter}>
                  <Text style={styles.transDate}>
                    {new Date(item.createdAt).toLocaleDateString()} at{' '}
                    {new Date(item.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>

                  {/* Requester settlement action */}
                  {!isSettled && isRequester ? (
                    <TouchableOpacity
                      style={[
                        styles.settleBtn,
                        settlingId === item._id && styles.btnDisabled,
                      ]}
                      onPress={() => handleSettleExpense(item._id, item.amount)}
                      disabled={settlingId === item._id}
                    >
                      {settlingId === item._id ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                      ) : (
                        <>
                          <CheckCheck size={14} color={Colors.white} />
                          <Text style={styles.settleBtnText}>Mark Reimbursed</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyTransactions}>
            <Wallet size={32} color={Colors.textMuted} />
            <Text style={styles.emptyTransactionsText}>No expenses logged for this errand yet.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.subtle,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  summaryTitle: {
    fontSize: Typography.base,
    fontWeight: 'bold',
    color: Colors.text,
  },
  budgetPill: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  budgetText: {
    fontSize: Typography.xs - 2,
    fontWeight: 'bold',
    color: Colors.primaryDark,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: Typography.xs - 2,
    color: Colors.textSecondary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: Typography.base,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 2,
  },
  logCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.subtle,
  },
  formTitle: {
    fontSize: Typography.sm,
    fontWeight: 'bold',
    color: Colors.text,
  },
  formSubtitle: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  currencySymbol: {
    fontSize: Typography.xl,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },
  amountInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.lg,
    fontWeight: 'bold',
    color: Colors.text,
    backgroundColor: Colors.white,
  },
  notesInput: {
    height: 42,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.sm,
    color: Colors.text,
    backgroundColor: Colors.white,
    marginBottom: Spacing.sm,
  },
  logSubmitBtnWrapper: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  logSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 44,
  },
  logSubmitBtnText: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: 'bold',
  },
  listSection: {
    marginTop: Spacing.xs,
  },
  listSectionTitle: {
    fontSize: Typography.sm,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  transactionCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.subtle,
  },
  transTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  amountBox: {},
  transAmount: {
    fontSize: Typography.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  transPaidBy: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusSettled: {
    backgroundColor: '#DCFCE7',
  },
  statusPillText: {
    fontSize: Typography.xs - 2,
    fontWeight: 'bold',
  },
  statusTextPending: {
    color: '#B45309',
  },
  statusTextSettled: {
    color: Colors.secondaryDark,
  },
  transNotes: {
    fontSize: Typography.xs,
    color: Colors.text,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
    lineHeight: 16,
  },
  transFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  transDate: {
    fontSize: Typography.xs - 2,
    color: Colors.textMuted,
  },
  settleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  settleBtnText: {
    color: Colors.white,
    fontSize: Typography.xs - 1,
    fontWeight: 'bold',
  },
  emptyTransactions: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  emptyTransactionsText: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
