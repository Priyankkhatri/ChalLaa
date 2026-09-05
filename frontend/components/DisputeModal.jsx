import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ShieldAlert, X } from 'lucide-react-native';
import api from '../services/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';

const DISPUTE_REASONS = [
  { key: 'incorrect_items', label: 'Wrong / Missing Items' },
  { key: 'payment_issue', label: 'Payment / Reimbursement Issue' },
  { key: 'unresponsive', label: 'Unresponsive Runner / Requester' },
  { key: 'harassment', label: 'Inappropriate Conduct' },
  { key: 'other', label: 'Other Concern' },
];

/**
 * Dispute Modal Component
 * Allows errand participants to submit formal dispute reports to campus moderators.
 */
export default function DisputeModal({ visible, errand, onClose }) {
  const [selectedReason, setSelectedReason] = useState('incorrect_items');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Required', 'Please enter a description of the issue.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/karma/dispute', {
        errandId: errand._id,
        reason: selectedReason,
        description: description.trim(),
      });

      Alert.alert(
        'Dispute Filed',
        'Your report has been submitted to campus moderators for review and resolution.'
      );
      setDescription('');
      onClose();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <X size={20} color={Colors.powderBlue} />
          </TouchableOpacity>

          <View style={styles.iconCircle}>
            <ShieldAlert size={30} color="#F87171" />
          </View>

          <Text style={styles.title}>Report Errand Issue</Text>
          <Text style={styles.subtitle}>
            Campus admins will review transaction logs, proofs, and chat history.
          </Text>

          {/* Reason selection chips */}
          <Text style={styles.sectionLabel}>Select Reason:</Text>
          <View style={styles.reasonsContainer}>
            {DISPUTE_REASONS.map((r) => {
              const active = selectedReason === r.key;
              return (
                <TouchableOpacity
                  key={r.key}
                  style={[
                    styles.reasonChip,
                    active && styles.reasonChipActive,
                  ]}
                  onPress={() => setSelectedReason(r.key)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.reasonText,
                      active && styles.reasonTextActive,
                    ]}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Description input */}
          <Text style={styles.sectionLabel}>Describe What Happened:</Text>
          <TextInput
            style={styles.input}
            placeholder="Provide context on what went wrong..."
            placeholderTextColor={Colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.submitBtnText}>Submit Report</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg + 4,
    position: 'relative',
    borderWidth: 1.2,
    borderColor: 'rgba(226, 232, 240, 0.90)',
    ...Shadows.card,
  },
  closeBtn: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    padding: 6,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(239, 68, 68, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: '800',
    color: Colors.porcelain,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.xs,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: Typography.xs,
    fontWeight: '800',
    color: Colors.porcelain,
    marginBottom: 6,
  },
  reasonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.md,
  },
  reasonChip: {
    backgroundColor: 'rgba(241, 245, 249, 0.90)',
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.90)',
  },
  reasonChipActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: '#DC2626',
  },
  reasonText: {
    fontSize: Typography.xs - 1,
    color: Colors.porcelain,
    fontWeight: '600',
  },
  reasonTextActive: {
    color: '#DC2626',
    fontWeight: '800',
  },
  input: {
    width: '100%',
    height: 90,
    backgroundColor: 'rgba(248, 250, 252, 0.95)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.90)',
    fontSize: Typography.sm,
    color: Colors.porcelain,
    textAlignVertical: 'top',
    marginBottom: Spacing.lg,
  },
  submitBtn: {
    width: '100%',
    height: 48,
    backgroundColor: '#DC2626',
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.glow,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.sm,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
