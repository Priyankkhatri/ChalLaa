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

/**
 * RatingModal Component
 * Allows requesters and runners to exchange peer ratings and increment campus karma scores.
 */
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
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <X size={20} color={Colors.powderBlue} />
          </TouchableOpacity>

          <View style={styles.iconCircle}>
            <Star size={32} color={Colors.drySage} fill={Colors.drySage} />
          </View>

          <Text style={styles.title}>Rate {peerName}</Text>
          <Text style={styles.subtitle}>
            Your rating updates peer campus karma score and reputation.
          </Text>

          {/* Star selector */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setScore(star)} style={styles.starTouch} activeOpacity={0.8}>
                <Star
                  size={36}
                  color={star <= score ? Colors.drySage : 'rgba(52, 73, 102, 0.7)'}
                  fill={star <= score ? Colors.drySage : 'transparent'}
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
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={Colors.gradientSageGlow}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.submitBtn, submitting && styles.btnDisabled]}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.inkBlack} />
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
    backgroundColor: 'rgba(13, 24, 33, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.yaleBlue,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    ...Shadows.glow,
  },
  closeBtn: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    padding: 6,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(191, 204, 148, 0.15)',
    borderWidth: 1,
    borderColor: Colors.glassSageBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: '800',
    color: Colors.porcelain,
  },
  subtitle: {
    fontSize: Typography.xs,
    color: Colors.powderBlue,
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
    fontWeight: '800',
    color: Colors.drySage,
    marginBottom: Spacing.md,
  },
  input: {
    width: '100%',
    height: 80,
    backgroundColor: 'rgba(13, 24, 33, 0.6)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    fontSize: Typography.sm,
    color: Colors.porcelain,
    textAlignVertical: 'top',
    marginBottom: Spacing.lg,
  },
  submitBtnWrapper: {
    width: '100%',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    ...Shadows.sageGlow,
  },
  submitBtn: {
    width: '100%',
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: Colors.inkBlack,
    fontSize: Typography.sm,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
