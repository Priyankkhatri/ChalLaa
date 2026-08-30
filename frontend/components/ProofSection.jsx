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
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import CameraModal from './CameraModal';
import ExpenseSection from './ExpenseSection';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

const getBackendBaseUrl = () => {
  const extraApiUrl = Constants.expoConfig?.extra?.apiUrl;
  if (extraApiUrl) {
    return extraApiUrl.replace('/api', '');
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
};

export default function ProofSection({ errand, currentUser, onErrandUpdated }) {
  const [cameraVisible, setCameraVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const isRunner = errand?.runnerId?._id === currentUser?._id || errand?.runnerId === currentUser?._id;
  const isRequester = errand?.requesterId?._id === currentUser?._id || errand?.requesterId === currentUser?._id;

  const handleUploadPhoto = async (localPhotoUri) => {
    try {
      setUploading(true);

      const formData = new FormData();
      const filename = localPhotoUri.split('/').pop() || 'proof.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('proof', {
        uri: localPhotoUri,
        name: filename,
        type,
      });

      const response = await api.post(`/errands/${errand._id}/proof`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Success', 'Proof photo uploaded successfully!');
      if (onErrandUpdated) {
        onErrandUpdated(response.data.errand);
      }
    } catch (error) {
      console.warn('[Upload proof error]', error);
      Alert.alert('Upload Error', error.response?.data?.message || 'Failed to upload proof photo.');
    } finally {
      setUploading(false);
    }
  };

  const images = errand?.proofImages || [];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionTitle}>Proof of Purchase & Delivery</Text>
          <Text style={styles.sectionSubtitle}>
            Receipts, purchased items, or doorstep delivery verification photos
          </Text>
        </View>
      </View>

      {/* Upload Action Button for Runner */}
      {isRunner || isRequester ? (
        <View style={styles.actionCard}>
          <Text style={styles.actionPromptText}>
            {isRunner
              ? 'Attach photo of receipt or purchased items to prevent disputes:'
              : 'Add relevant photo/reference for this errand:'}
          </Text>

          <TouchableOpacity
            style={[styles.cameraLaunchBtn, uploading && styles.btnDisabled]}
            onPress={() => setCameraVisible(true)}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="camera" size={20} color={Colors.white} />
                <Text style={styles.cameraLaunchBtnText}>Capture Proof Photo</Text>
              </>
            )}
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
                  <Ionicons name="expand" size={14} color={Colors.white} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <Ionicons name="images-outline" size={48} color={Colors.textMuted} />
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
            <Ionicons name="close" size={28} color={Colors.white} />
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
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionPromptText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  cameraLaunchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    height: 46,
    borderRadius: BorderRadius.md,
  },
  cameraLaunchBtnText: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: 'bold',
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
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
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
    borderRadius: BorderRadius.sm,
    padding: 4,
  },
  emptyBox: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    fontSize: Typography.base,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  fullModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalBtn: {
    position: 'absolute',
    top: Spacing.xl + 10,
    right: Spacing.lg,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '95%',
    height: '80%',
  },
});
