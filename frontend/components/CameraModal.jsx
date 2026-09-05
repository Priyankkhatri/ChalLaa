import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

/**
 * Camera Modal Component
 * Leverages expo-camera (CameraView) and expo-image-manipulator for native proof capture & compression.
 */
export default function CameraModal({ visible, onClose, onPhotoCaptured }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [capturedPhotoUri, setCapturedPhotoUri] = useState(null);
  const [processing, setProcessing] = useState(false);

  const cameraRef = useRef(null);

  // Take photo with expo-camera per Unit 4 conventions
  const handleCapture = async () => {
    if (!cameraRef.current) return;

    try {
      setProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (photo && photo.uri) {
        // Compress image using expo-image-manipulator for hostel network optimization
        const manipulated = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 1080 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        setCapturedPhotoUri(manipulated.uri);
      }
    } catch (error) {
      console.warn('[Camera Capture Error]', error);
      Alert.alert('Capture Error', 'Could not capture photo. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Gallery picker fallback per Unit 5 conventions
  const handlePickFromGallery = async () => {
    try {
      setProcessing(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const manipulated = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 1080 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        setCapturedPhotoUri(manipulated.uri);
      }
    } catch (error) {
      console.warn('[Gallery Pick Error]', error);
      Alert.alert('Error', 'Failed to pick image from gallery.');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmPhoto = () => {
    if (capturedPhotoUri) {
      onPhotoCaptured(capturedPhotoUri);
      setCapturedPhotoUri(null);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedPhotoUri(null);
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* If Photo is Captured: Preview Mode */}
        {capturedPhotoUri ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: capturedPhotoUri }} style={styles.previewImage} resizeMode="contain" />

            <View style={styles.previewControls}>
              <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake}>
                <Ionicons name="refresh" size={18} color={Colors.white} />
                <Text style={styles.previewBtnText}>Retake</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmPhoto}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                <Text style={styles.previewBtnText}>Use Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : !permission ? (
          /* Permission loading state */
          <View style={styles.permissionBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : !permission.granted ? (
          /* Permission request state per Unit 4 */
          <View style={styles.permissionBox}>
            <Ionicons name="camera-outline" size={64} color={Colors.textMuted} />
            <Text style={styles.permTitle}>Camera Permission Required</Text>
            <Text style={styles.permSubtext}>
              ChalLaa needs camera access to take proof of purchase and item delivery photos.
            </Text>
            <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
              <Text style={styles.permBtnText}>Grant Camera Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.galleryFallbackBtn} onPress={handlePickFromGallery}>
              <Text style={styles.galleryFallbackText}>Or choose from Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelLink} onPress={onClose}>
              <Text style={styles.cancelLinkText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Live Camera View */
          <View style={styles.cameraWrapper}>
            <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
              {/* Camera Header Overlay */}
              <View style={styles.cameraHeader}>
                <TouchableOpacity style={styles.headerIconBtn} onPress={onClose}>
                  <Ionicons name="close" size={28} color={Colors.white} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.headerIconBtn} onPress={toggleCameraFacing}>
                  <Ionicons name="camera-reverse-outline" size={28} color={Colors.white} />
                </TouchableOpacity>
              </View>

              {/* Center Guidance Frame */}
              <View style={styles.frameGuide}>
                <Text style={styles.guideText}>Align item or receipt within frame</Text>
              </View>

              {/* Bottom Controls */}
              <View style={styles.bottomControls}>
                <TouchableOpacity style={styles.galleryBtn} onPress={handlePickFromGallery}>
                  <Ionicons name="images-outline" size={28} color={Colors.white} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.captureBtnOuter}
                  onPress={handleCapture}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator color={Colors.primary} size="large" />
                  ) : (
                    <View style={styles.captureBtnInner} />
                  )}
                </TouchableOpacity>

                <View style={{ width: 44 }} />
              </View>
            </CameraView>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  cameraWrapper: {
    flex: 1,
  },
  camera: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl + 10,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameGuide: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    alignSelf: 'center',
  },
  guideText: {
    color: Colors.white,
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  galleryBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  captureBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.white,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: Colors.black,
    justifyContent: 'space-between',
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    backgroundColor: '#475569',
    borderRadius: BorderRadius.md,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.md,
  },
  previewBtnText: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: 'bold',
  },
  permissionBox: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  permTitle: {
    fontSize: Typography.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  permSubtext: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  permBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  permBtnText: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: 'bold',
  },
  galleryFallbackBtn: {
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.md,
  },
  galleryFallbackText: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  cancelLink: {
    padding: Spacing.xs,
  },
  cancelLinkText: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
  },
});
