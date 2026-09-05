import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Camera, Image as ImageIcon, Maximize2, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import { getSocketUrl } from '../services/socket';
import CameraModal from './CameraModal';
import ExpenseSection from './ExpenseSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';

const getBackendBaseUrl = () => getSocketUrl();

export default function ProofSection({ errand, currentUser, onErrandUpdated }) {
  const [cameraVisible, setCameraVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const isRunner = errand?.runnerId?._id === currentUser?._id || errand?.runnerId === currentUser?._id;
  const isRequester = errand?.requesterId?._id === currentUser?._id || errand?.requesterId === currentUser?._id;

  const handleUploadPhoto = async (localPhotoUri) => {
    setUploading(true);
    setCameraVisible(false);

    try {
      const formData = new FormData();
      const filename = localPhotoUri.split('/').pop() || `proof_${Date.now()}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const fileType = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append('proof', {
        uri: localPhotoUri,
        name: filename,
        type: fileType,
      });
      formData.append('proofPhoto', {
        uri: localPhotoUri,
        name: filename,
        type: fileType,
      });

      const response = await api.post(`/errands/${errand._id}/proof`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (onErrandUpdated) {
        onErrandUpdated(response.data.errand);
      }

      Alert.alert('Success', 'Proof photo uploaded and attached to this errand.');
    } catch (error) {
      console.warn('[Proof upload error]', error);
      Alert.alert('Upload Failed', error.response?.data?.message || 'Could not upload proof photo.');
    } finally {
      setUploading(false);
    }
  };

  const images = errand?.proofImages || [];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Errand Proof & Receipt Ledger</Text>
        <Text style={styles.sectionSubtitle}>
          Camera proofs and itemized expenses for transparent campus settlements.
        </Text>
      </View>

      {/* Runner Photo Upload Action Card */}
      {isRunner || isRequester ? (
        <View style={styles.actionCard}>
          <Text style={styles.actionPromptText}>
            {isRunner
              ? 'Attach photo of receipt or purchased items to prevent disputes:'
              : 'Add relevant photo/reference for this errand:'}
          </Text>

          <TouchableOpacity
            onPress={() => setCameraVisible(true)}
            disabled={uploading}
            style={styles.cameraLaunchBtnWrapper}
          >
            <LinearGradient
              colors={Colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.cameraLaunchBtn, uploading && styles.btnDisabled]}
            >
              {uploading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Camera size={18} color={Colors.white} />
                  <Text style={styles.cameraLaunchBtnText}>Capture Proof Photo</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Images Grid */}
      {images.length > 0 ? (
        <View style={styles.imageGrid}>
          {images.map((imgUrl, idx) => {
            const fullUrl = imgUrl.startsWith('http')
              ? imgUrl
              : `${getBackendBaseUrl()}${imgUrl}`;

            return (
              <TouchableOpacity
                key={idx}
                style={styles.imageThumbnailWrapper}
                onPress={() => setSelectedImage(fullUrl)}
              >
                <Image source={{ uri: fullUrl }} style={styles.imageThumbnail} resizeMode="cover" />
                <View style={styles.zoomIconBadge}>
                  <Maximize2 size={13} color={Colors.white} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <ImageIcon size={44} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No Proof Photos Attached</Text>
          <Text style={styles.emptySubtitle}>
            {isRunner
              ? 'Tap "Capture Proof Photo" above to upload bill or item photo.'
              : 'Runner has not attached any proof photos yet.'}
          </Text>
        </View>
      )}

      {/* Expense Logging & Settlement Component */}
      <ExpenseSection errand={errand} currentUser={currentUser} />

      {/* Fullscreen Photo Viewer Modal */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View style={styles.fullModalOverlay}>
          <TouchableOpacity style={styles.closeModalBtn} onPress={() => setSelectedImage(null)}>
            <X size={26} color={Colors.white} />
          </TouchableOpacity>

          {selectedImage ? (
            <Image source={{ uri: selectedImage }} style={styles.fullImage} resizeMode="contain" />
          ) : null}
        </View>
      </Modal>

      {/* Camera Capture Modal */}
      <CameraModal
        visible={cameraVisible}
        onClose={() => setCameraVisible(false)}
        onPhotoCaptured={handleUploadPhoto}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  headerRow: {
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Typography.base,
    fontWeight: 'bold',
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actionCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.subtle,
  },
  actionPromptText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  cameraLaunchBtnWrapper: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.glow,
  },
  cameraLaunchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 46,
  },
  cameraLaunchBtnText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: Typography.sm,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  imageThumbnailWrapper: {
    width: '48%',
    height: 140,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  imageThumbnail: {
    width: '100%',
    height: '100%',
  },
  zoomIconBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBox: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  emptyTitle: {
    fontSize: Typography.sm,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 16,
  },
  fullModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '90%',
    height: '80%',
  },
  closeModalBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: Spacing.sm,
  },
});
