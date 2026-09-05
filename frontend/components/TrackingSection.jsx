import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { Navigation, Radio, Gauge, Flag, Clock, Compass } from 'lucide-react-native';
import { getSocket } from '../services/socket';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';
import { LiquidGlassCard } from './ui/LiquidGlass';

// Haversine distance calculator in kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(2);
}

/**
 * TrackingSection Component
 * Real-time runner GPS broadcasting and requester live map telemetry over WebSockets.
 */
export default function TrackingSection({ errand, currentUser }) {
  const isRunner = errand?.runnerId?._id === currentUser?._id || errand?.runnerId === currentUser?._id;
  const isRequester = errand?.requesterId?._id === currentUser?._id || errand?.requesterId === currentUser?._id;

  const destinationCoords = errand?.location?.coordinates
    ? { lng: errand.location.coordinates[0], lat: errand.location.coordinates[1] }
    : null;

  // Runner state
  const [isStreaming, setIsStreaming] = useState(false);
  const [runnerCoords, setRunnerCoords] = useState(null);
  const [lastStreamTime, setLastStreamTime] = useState(null);
  const [speedKmh, setSpeedKmh] = useState(0);

  // Requester received live state
  const [receivedRunnerCoords, setReceivedRunnerCoords] = useState(null);
  const [lastReceivedTime, setLastReceivedTime] = useState(null);

  const locationSubscriptionRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();

    const startLocationWatch = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'GPS permission is required for live runner tracking.');
          return;
        }

        setIsStreaming(true);

        locationSubscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 5,
            timeInterval: 4000,
          },
          (loc) => {
            const currentLat = loc.coords.latitude;
            const currentLng = loc.coords.longitude;
            const currentSpeed = loc.coords.speed > 0 ? (loc.coords.speed * 3.6).toFixed(1) : '0';

            setRunnerCoords({ lat: currentLat, lng: currentLng });
            setSpeedKmh(currentSpeed);
            setLastStreamTime(new Date());

            socket.emit('location_update', {
              errandId: errand._id,
              runnerId: currentUser?._id,
              lat: currentLat,
              lng: currentLng,
              speed: currentSpeed,
              heading: loc.coords.heading || 0,
            });
          }
        );
      } catch (err) {
        console.warn('[Location watch error]', err);
        setIsStreaming(false);
      }
    };

    if (isRunner && (errand.status === 'in_progress' || errand.status === 'accepted')) {
      startLocationWatch();
    }

    return () => {
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
        locationSubscriptionRef.current = null;
      }
      setIsStreaming(false);
    };
  }, [isRunner, errand?._id, errand?.status, currentUser?._id]);

  useEffect(() => {
    const socket = getSocket();

    const handleLocationBroadcast = (data) => {
      if (data && data.errandId === errand?._id) {
        setReceivedRunnerCoords({ lat: data.lat, lng: data.lng, speed: data.speed });
        setLastReceivedTime(new Date());
      }
    };

    socket.on('location_broadcast', handleLocationBroadcast);

    return () => {
      socket.off('location_broadcast', handleLocationBroadcast);
    };
  }, [errand?._id]);

  const activeRunnerLocation = isRunner ? runnerCoords : receivedRunnerCoords;
  const activeDistance =
    activeRunnerLocation && destinationCoords
      ? calculateDistance(
          activeRunnerLocation.lat,
          activeRunnerLocation.lng,
          destinationCoords.lat,
          destinationCoords.lng
        )
      : null;

  return (
    <View style={styles.container}>
      {/* Status Header Banner */}
      <LiquidGlassCard variant="default">
        <View style={styles.bannerContent}>
          <View style={styles.bannerIconBox}>
            <Navigation size={22} color={Colors.powderBlue} />
          </View>
          <View style={styles.bannerTextBox}>
            <Text style={styles.bannerTitle}>
              {errand.status === 'in_progress'
                ? 'Live Trip Tracking'
                : errand.status === 'delivered'
                ? 'Errand Completed'
                : 'Tracking Ready'}
            </Text>
            <Text style={styles.bannerSubtitle}>
              {errand.status === 'in_progress'
                ? isRunner
                  ? 'Your GPS position is actively shared with requester.'
                  : 'Runner is currently on the move for your errand.'
                : errand.status === 'accepted'
                ? 'Waiting for runner to start the errand.'
                : 'Live tracking activates when runner marks "In Progress".'}
            </Text>
          </View>
        </View>
      </LiquidGlassCard>

      {/* Visual GPS Tracking Radar Panel */}
      <LiquidGlassCard variant="default">
        <View style={styles.visualMapPlaceholder}>
          <View style={styles.radarPulse}>
            <Radio size={48} color={Colors.powderBlue} />
          </View>

          <Text style={styles.mapStatusText}>
            {isRunner && isStreaming
              ? '🔴 Live GPS Stream Active'
              : receivedRunnerCoords
              ? '🟢 Receiving Runner Position'
              : errand.status === 'in_progress'
              ? 'Connecting to runner GPS...'
              : 'GPS Stream Idle'}
          </Text>

          {activeDistance !== null ? (
            <View style={styles.etaPill}>
              <Gauge size={15} color={Colors.drySage} />
              <Text style={styles.etaPillText}>~{activeDistance} km from destination</Text>
            </View>
          ) : null}
        </View>

        {/* Live Coordinate Telemetry Grid */}
        <View style={styles.telemetryGrid}>
          <View style={styles.telemetryItem}>
            <Text style={styles.telemetryLabel}>Runner Lat</Text>
            <Text style={styles.telemetryValue}>
              {activeRunnerLocation?.lat ? activeRunnerLocation.lat.toFixed(5) : '--'}
            </Text>
          </View>

          <View style={styles.telemetryItem}>
            <Text style={styles.telemetryLabel}>Runner Lng</Text>
            <Text style={styles.telemetryValue}>
              {activeRunnerLocation?.lng ? activeRunnerLocation.lng.toFixed(5) : '--'}
            </Text>
          </View>

          <View style={styles.telemetryItem}>
            <Text style={styles.telemetryLabel}>Speed</Text>
            <Text style={styles.telemetryValue}>
              {isRunner ? `${speedKmh} km/h` : activeRunnerLocation?.speed ? `${activeRunnerLocation.speed} km/h` : '--'}
            </Text>
          </View>

          <View style={styles.telemetryItem}>
            <Text style={styles.telemetryLabel}>Last Ping</Text>
            <Text style={styles.telemetryValue}>
              {isRunner && lastStreamTime
                ? lastStreamTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : lastReceivedTime
                ? lastReceivedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : 'Waiting'}
            </Text>
          </View>
        </View>
      </LiquidGlassCard>

      {/* Destination Info Box */}
      <LiquidGlassCard variant="default">
        <View style={styles.destHeader}>
          <Flag size={18} color={Colors.powderBlue} />
          <Text style={styles.destTitle}>Delivery Destination</Text>
        </View>
        <Text style={styles.destAddress}>{errand.address || 'Campus Hostels'}</Text>
        {destinationCoords ? (
          <Text style={styles.destCoords}>
            Target: {destinationCoords.lat.toFixed(4)}, {destinationCoords.lng.toFixed(4)}
          </Text>
        ) : null}
      </LiquidGlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  bannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(180, 205, 237, 0.15)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTextBox: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: Typography.base,
    fontWeight: '800',
    color: Colors.porcelain,
  },
  bannerSubtitle: {
    fontSize: Typography.xs,
    color: Colors.powderBlue,
    marginTop: 2,
    lineHeight: 16,
  },
  visualMapPlaceholder: {
    height: 180,
    backgroundColor: 'rgba(241, 245, 249, 0.90)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.90)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  radarPulse: {
    marginBottom: Spacing.xs,
  },
  mapStatusText: {
    fontSize: Typography.sm,
    fontWeight: '800',
    color: Colors.porcelain,
  },
  etaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    borderColor: 'rgba(5, 150, 105, 0.25)',
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  etaPillText: {
    fontSize: Typography.xs,
    fontWeight: '800',
    color: Colors.drySage,
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  telemetryItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(248, 250, 252, 0.95)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.90)',
  },
  telemetryLabel: {
    fontSize: Typography.xs - 2,
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  telemetryValue: {
    fontSize: Typography.sm,
    fontWeight: '800',
    color: Colors.porcelain,
    marginTop: 2,
  },
  destHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  destTitle: {
    fontSize: Typography.sm,
    fontWeight: '800',
    color: Colors.porcelain,
  },
  destAddress: {
    fontSize: Typography.sm,
    color: '#64748B',
    marginTop: 2,
  },
  destCoords: {
    fontSize: Typography.xs,
    color: '#94A3B8',
    marginTop: 3,
  },
});
