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
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

const DISPUTE_REASONS = [
  { key: 'incorrect_items', label: 'Wrong / Missing Items' },
  { key: 'payment_issue', label: 'Payment / Reimbursement Issue' },
  { key: 'unresponsive', label: 'Unresponsive Runner / Requester' },
  { key: 'harassment', label: 'Inappropriate Conduct' },
  { key: 'other', label: 'Other Concern' },
];

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
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.iconCircle}>
            <Ionicons name="shield-alert-outline" size={32} color={Colors.danger} />
          </View>

          <Text style={styles.title}>Report Errand Issue</Text>
          <Text style={styles.subtitle}>
            Campus admins will review transaction logs, proofs, and chat history.
          </Text>

          {/* Reason selection chips */}
          <Text style={styles.sectionLabel}>Select Reason:</Text>
          <View style={styles.reasonsContainer}>
            {DISPUTE_REASONS.map((r) => (
              <TouchableOpacity
                key={r.key}
                style={[
                  styles.reasonChip,
                  selectedReason === r.key && styles.reasonChipActive,
                ]}
                onPress={() => setSelectedReason(r.key)}
              >
                <Text
                  style={[
                    styles.reasonText,
                    selectedReason === r.key && styles.reasonTextActive,
                  ]}
                >
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    padding: 4,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.dangerBg,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: Typography.xs,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 6,
  },
  reasonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.md,
  },
  reasonChip: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reasonChipActive: {
    backgroundColor: Colors.dangerBg,
    borderColor: Colors.danger,
  },
  reasonText: {
    fontSize: Typography.xs - 1,
    color: Colors.textSecondary,
  },
  reasonTextActive: {
    color: Colors.danger,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    height: 90,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: Typography.sm,
    color: Colors.text,
    textAlignVertical: 'top',
    marginBottom: Spacing.lg,
  },
  submitBtn: {
    width: '100%',
    height: 48,
    backgroundColor: Colors.danger,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: 'bold',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
