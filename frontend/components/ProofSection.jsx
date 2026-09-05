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
import { LiquidGlassCard } from './ui/LiquidGlass';

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
        <LiquidGlassCard variant="default">
          <Text style={styles.actionPromptText}>
            {isRunner
              ? 'Attach photo of receipt or purchased items to prevent disputes:'
              : 'Add relevant photo/reference for this errand:'}
          </Text>

          <TouchableOpacity
            onPress={() => setCameraVisible(true)}
            disabled={uploading}
            style={styles.cameraLaunchBtnWrapper}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={Colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.cameraLaunchBtn, uploading && styles.btnDisabled]}
            >
              {uploading ? (
                <ActivityIndicator color={Colors.inkBlack} />
              ) : (
                <>
                  <Camera size={18} color={Colors.inkBlack} strokeWidth={2.4} />
                  <Text style={styles.cameraLaunchBtnText}>Capture Proof Photo</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </LiquidGlassCard>
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
                activeOpacity={0.85}
              >
                <Image source={{ uri: fullUrl }} style={styles.imageThumbnail} resizeMode="cover" />
                <View style={styles.zoomIconBadge}>
                  <Maximize2 size={13} color={Colors.porcelain} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <LiquidGlassCard variant="default">
          <View style={styles.emptyBox}>
            <ImageIcon size={44} color={Colors.powderBlue} />
            <Text style={styles.emptyTitle}>No Proof Photos Attached</Text>
            <Text style={styles.emptySubtitle}>
              {isRunner
                ? 'Tap "Capture Proof Photo" above to upload bill or item photo.'
                : 'Runner has not attached any proof photos yet.'}
            </Text>
          </View>
        </LiquidGlassCard>
      )}

      {/* Expense Logging & Settlement Component */}
      <ExpenseSection errand={errand} currentUser={currentUser} />

      {/* Fullscreen Photo Viewer Modal */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View style={styles.fullModalOverlay}>
          <TouchableOpacity style={styles.closeModalBtn} onPress={() => setSelectedImage(null)}>
            <X size={26} color={Colors.porcelain} />
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
    gap: Spacing.md,
  },
  headerRow: {
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Typography.base,
    fontWeight: '800',
    color: Colors.porcelain,
  },
  sectionSubtitle: {
    fontSize: Typography.xs,
    color: Colors.powderBlue,
    marginTop: 2,
  },
  actionPromptText: {
    fontSize: Typography.xs,
    color: Colors.powderBlue,
    marginBottom: Spacing.sm,
  },
  cameraLaunchBtnWrapper: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    ...Shadows.glow,
  },
  cameraLaunchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 48,
  },
  cameraLaunchBtnText: {
    color: Colors.inkBlack,
    fontWeight: '800',
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
    backgroundColor: 'rgba(52, 73, 102, 0.45)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
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
    backgroundColor: 'rgba(13, 24, 33, 0.75)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBox: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: Typography.sm,
    fontWeight: '800',
    color: Colors.porcelain,
    marginTop: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: Typography.xs,
    color: Colors.powderBlue,
    textAlign: 'center',
    marginTop: 3,
    lineHeight: 16,
  },
  fullModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 24, 33, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '92%',
    height: '82%',
  },
  closeModalBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: Spacing.sm,
  },
});
