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
import { Star, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';

export default function RatingModal({ visible, errand, currentUser, onClose, onRatingSubmitted }) {
  const [score, setScore] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isRequester = errand?.requesterId?._id === currentUser?._id || errand?.requesterId === currentUser?._id;
  const peerName = isRequester ? errand?.runnerId?.name || 'Runner' : errand?.requesterId?.name || 'Requester';

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post('/karma/rate', {
        errandId: errand._id,
        score,
        feedback: feedback.trim(),
      });

      Alert.alert('Karma Updated!', `Thank you for rating ${peerName}. Peer karma points have been credited.`);
      if (onRatingSubmitted) {
        onRatingSubmitted();
      }
      onClose();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit rating');
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
            <X size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.iconCircle}>
            <Star size={30} color="#F59E0B" fill="#F59E0B" />
          </View>

          <Text style={styles.title}>Rate {peerName}</Text>
          <Text style={styles.subtitle}>
            Your rating updates peer campus karma score and reputation.
          </Text>

          {/* Star selector */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setScore(star)} style={styles.starTouch}>
                <Star
                  size={34}
                  color={star <= score ? '#F59E0B' : Colors.border}
                  fill={star <= score ? '#F59E0B' : 'transparent'}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.scoreLabel}>
            {score === 5
              ? '🌟 Outstanding! (+5 Karma)'
              : score === 4
              ? '👍 Great Experience (+5 Karma)'
              : score === 3
              ? '👌 Satisfactory (+1 Karma)'
              : '⚠️ Needs Improvement (-5 Karma)'}
          </Text>

          {/* Optional feedback text */}
          <TextInput
            style={styles.input}
            placeholder="Write a peer review (optional)..."
            placeholderTextColor={Colors.textMuted}
            value={feedback}
            onChangeText={setFeedback}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            style={styles.submitBtnWrapper}
          >
            <LinearGradient
              colors={Colors.gradientAccent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.submitBtn, submitting && styles.btnDisabled]}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.submitBtnText}>Submit Karma Rating</Text>
              )}
            </LinearGradient>
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
    alignItems: 'center',
    position: 'relative',
    ...Shadows.glow,
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
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  starsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  starTouch: {
    padding: 4,
  },
  scoreLabel: {
    fontSize: Typography.xs,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  input: {
    width: '100%',
    height: 80,
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
  submitBtnWrapper: {
    width: '100%',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  submitBtn: {
    width: '100%',
    height: 48,
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
