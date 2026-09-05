import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Contacts from 'expo-contacts';
import {
  CheckCircle2,
  Hourglass,
  Star,
  Sparkles,
  ShieldCheck,
  Users,
  ShieldAlert,
  User,
  Phone,
  Building2,
  LogOut,
  Plus,
  PhoneCall,
  Trash2,
  X,
  ChevronRight,
  Edit3,
  Contact,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { LiquidGlassCard, LiquidGlassButton, LiquidCanvas } from '../../components/ui/LiquidGlass';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [hostelOrCollegeId, setHostelOrCollegeId] = useState(user?.hostelOrCollegeId || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Contacts modal state
  const [contactsModalVisible, setContactsModalVisible] = useState(false);
  const [deviceContacts, setDeviceContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [searchContactText, setSearchContactText] = useState('');

  // Manual contact modal state
  const [manualContactModalVisible, setManualContactModalVisible] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setHostelOrCollegeId(user.hostelOrCollegeId || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Name cannot be empty.');
      return;
    }

    setSavingProfile(true);
    try {
      await updateUser({
        name: name.trim(),
        phone: phone.trim(),
        hostelOrCollegeId: hostelOrCollegeId.trim(),
      });
      setIsEditing(false);
      Alert.alert('Profile Updated', 'Your profile details have been saved successfully.');
    } catch (error) {
      Alert.alert('Update Failed', error.response?.data?.message || 'Could not update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleOpenDeviceContacts = async () => {
    setLoadingContacts(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Contact access is required to import trusted peers directly from your phone address book.'
        );
        setLoadingContacts(false);
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
        sort: Contacts.SortTypes.FirstName,
      });

      if (data && data.length > 0) {
        const parsed = data
          .filter((c) => c.phoneNumbers && c.phoneNumbers.length > 0)
          .map((c) => ({
            id: c.id,
            name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unnamed',
            phone: c.phoneNumbers[0].number,
          }));

        setDeviceContacts(parsed);
        setContactsModalVisible(true);
      } else {
        Alert.alert('No Contacts', 'No phone contacts found on device.');
      }
    } catch (error) {
      console.warn('[Contacts error]', error);
      Alert.alert('Error', 'Failed to retrieve device contacts.');
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleAddTrustedContact = async (contactName, contactPhone) => {
    if (!contactName.trim() || !contactPhone.trim()) {
      Alert.alert('Validation Error', 'Please provide both name and phone number.');
      return;
    }

    const currentContacts = user?.trustedContacts || [];
    const exists = currentContacts.some(
      (c) => c.phone.replace(/\s+/g, '') === contactPhone.replace(/\s+/g, '')
    );

    if (exists) {
      Alert.alert('Already Added', 'This contact is already in your trusted circle.');
      return;
    }

    const updated = [...currentContacts, { name: contactName.trim(), phone: contactPhone.trim() }];

    try {
      await updateUser({ trustedContacts: updated });
      setManualContactModalVisible(false);
      setContactsModalVisible(false);
      setNewContactName('');
      setNewContactPhone('');
      Alert.alert('Added', `${contactName} has been added to your trusted circle!`);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save contact.');
    }
  };

  const handleRemoveContact = async (contactId) => {
    Alert.alert('Remove Contact', 'Are you sure you want to remove this trusted contact?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const current = user?.trustedContacts || [];
          const updated = current.filter((c) => c._id !== contactId);
          try {
            await updateUser({ trustedContacts: updated });
          } catch (err) {
            Alert.alert('Error', 'Failed to remove contact.');
          }
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of ChalLaa?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const filteredContacts = deviceContacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchContactText.toLowerCase()) ||
      c.phone.includes(searchContactText)
  );

  return (
    <LiquidCanvas style={styles.container}>
      <ScrollView style={styles.flexFill} contentContainerStyle={styles.scrollContent}>
        {/* Liquid Glass Luxury Profile Header */}
        <View style={styles.heroOuter}>
        <BlurView intensity={Platform.OS === 'ios' ? 45 : 60} tint="light" style={styles.heroBlur}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.96)', 'rgba(241, 245, 249, 0.90)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroSpecular} />

            <View style={styles.avatarGlow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            </View>

            <Text style={styles.userName}>{user?.name || 'Student'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>

            {/* Glass Status Badges */}
            <View style={styles.badgeRow}>
              <View style={styles.glassBadge}>
                {user?.isVerified ? (
                  <CheckCircle2 size={13} color={Colors.drySage} />
                ) : (
                  <Hourglass size={13} color={Colors.powderBlue} />
                )}
                <Text style={styles.glassBadgeText}>
                  {user?.isVerified ? 'Verified Student' : 'Pending ID'}
                </Text>
              </View>

              <View style={[styles.glassBadge, styles.glassBadgeSage]}>
                <Star size={13} color={Colors.drySage} fill={Colors.drySage} />
                <Text style={[styles.glassBadgeText, { color: Colors.drySage }]}>
                  Karma: {user?.karmaScore ?? 100}
                </Text>
              </View>
            </View>

            {/* Frosted Glass Quick Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.glassStatBox}>
                <Sparkles size={18} color={Colors.drySage} />
                <Text style={styles.glassStatNumber}>{user?.karmaScore ?? 100}</Text>
                <Text style={styles.glassStatLabel}>Karma ⭐</Text>
              </View>

              <View style={styles.glassStatBox}>
                <ShieldCheck size={18} color={Colors.powderBlue} />
                <Text style={styles.glassStatNumber}>{user?.isVerified ? '100%' : '50%'}</Text>
                <Text style={styles.glassStatLabel}>Trust Score</Text>
              </View>

              <View style={styles.glassStatBox}>
                <Users size={18} color={Colors.porcelain} />
                <Text style={styles.glassStatNumber}>{user?.trustedContacts?.length || 0}</Text>
                <Text style={styles.glassStatLabel}>Circle</Text>
              </View>
            </View>
          </LinearGradient>
        </BlurView>
      </View>

      {/* Admin Portal Launcher Banner (Admin Only) */}
      {user?.role === 'admin' ? (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/admin')}
          style={styles.adminBannerWrapper}
        >
          <BlurView intensity={35} tint="light" style={styles.adminBlur}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.95)', 'rgba(239, 246, 255, 0.90)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.adminBanner}
            >
              <View style={styles.adminIconCircle}>
                <ShieldAlert size={20} color={Colors.powderBlue} />
              </View>
              <View style={styles.adminBannerText}>
                <Text style={styles.adminBannerTitle}>Campus Moderation Panel</Text>
                <Text style={styles.adminBannerSub}>
                  Manage disputes, student verifications & platform KPIs
                </Text>
              </View>
              <ChevronRight size={18} color={Colors.porcelain} />
            </LinearGradient>
          </BlurView>
        </TouchableOpacity>
      ) : null}

      {/* Account Identity Section */}
      <LiquidGlassCard variant="default">
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <User size={18} color={Colors.powderBlue} />
            <Text style={styles.sectionTitle}>Campus Identity</Text>
          </View>
          <TouchableOpacity
            style={styles.editToggleBtn}
            onPress={() => setIsEditing(!isEditing)}
            activeOpacity={0.8}
          >
            <Edit3 size={13} color="#FFFFFF" />
            <Text style={styles.editLink}>{isEditing ? 'Cancel' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>

        {isEditing ? (
          <View style={styles.editForm}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. +91 9876543210"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Hostel / College ID</Text>
            <TextInput
              style={styles.input}
              value={hostelOrCollegeId}
              onChangeText={setHostelOrCollegeId}
              placeholder="e.g. Hostel 4, Room 302"
              placeholderTextColor={Colors.textMuted}
            />

            <TouchableOpacity
              onPress={handleSaveProfile}
              disabled={savingProfile}
              style={styles.saveBtnWrapper}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={Colors.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.saveButton, savingProfile && styles.btnDisabled]}
              >
                {savingProfile ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Details</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Hostel / Room</Text>
              <Text style={styles.infoValue}>{user?.hostelOrCollegeId || 'Not set'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{user?.phone || 'Not set'}</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.infoLabel}>Account Role</Text>
              <Text style={[styles.infoValue, { textTransform: 'capitalize', fontWeight: '800', color: Colors.powderBlue }]}>
                {user?.role || 'Student'}
              </Text>
            </View>
          </View>
        )}
      </LiquidGlassCard>

      {/* Trusted Contacts Section */}
      <LiquidGlassCard variant="default">
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Contact size={18} color={Colors.drySage} />
            <Text style={styles.sectionTitle}>Trusted Peer Circle</Text>
          </View>
          <View style={styles.trustedCountBadge}>
            <Text style={styles.trustedCountText}>{user?.trustedContacts?.length || 0} Peers</Text>
          </View>
        </View>

        <Text style={styles.sectionSubtitle}>
          Trusted peers are prioritized for notification dispatch and quick delivery handovers.
        </Text>

        {user?.trustedContacts && user.trustedContacts.length > 0 ? (
          user.trustedContacts.map((contact) => (
            <View key={contact._id || contact.phone} style={styles.contactCard}>
              <View style={styles.contactAvatar}>
                <Text style={styles.contactAvatarText}>{contact.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
              </View>

              <TouchableOpacity
                style={styles.contactCallBtn}
                onPress={() => Linking.openURL(`tel:${contact.phone}`)}
              >
                <PhoneCall size={14} color={Colors.powderBlue} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.contactDeleteBtn}
                onPress={() => handleRemoveContact(contact._id)}
              >
                <Trash2 size={14} color="#F87171" />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyContactsBox}>
            <Users size={32} color={Colors.powderBlue} />
            <Text style={styles.emptyContactsTitle}>No Trusted Contacts Added</Text>
            <Text style={styles.emptyContactsSub}>
              Add your roommates or close peers for safe, reliable errand coordination.
            </Text>
          </View>
        )}

        {/* Contact Action Buttons */}
        <View style={styles.contactActionButtonsRow}>
          <TouchableOpacity
            style={styles.actionBtnSecondary}
            onPress={handleOpenDeviceContacts}
            disabled={loadingContacts}
            activeOpacity={0.8}
          >
            {loadingContacts ? (
              <ActivityIndicator color={Colors.powderBlue} size="small" />
            ) : (
              <>
                <Phone size={14} color={Colors.powderBlue} />
                <Text style={styles.actionBtnSecondaryText}>Import Contacts</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={() => setManualContactModalVisible(true)}
            activeOpacity={0.8}
          >
            <Plus size={15} color={Colors.inkBlack} strokeWidth={2.6} />
            <Text style={styles.actionBtnPrimaryText}>Add Peer</Text>
          </TouchableOpacity>
        </View>
      </LiquidGlassCard>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <LogOut size={17} color="#F87171" />
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>

      {/* Modal: Device Contacts Picker */}
      <Modal
        visible={contactsModalVisible}
        animationType="slide"
        onRequestClose={() => setContactsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Import Phone Contacts</Text>
            <TouchableOpacity onPress={() => setContactsModalVisible(false)}>
              <X size={22} color={Colors.porcelain} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.modalSearchInput}
            placeholder="Search contact by name or number..."
            placeholderTextColor={Colors.textMuted}
            value={searchContactText}
            onChangeText={setSearchContactText}
          />

          <FlatList
            data={filteredContacts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.deviceContactItem}
                onPress={() => handleAddTrustedContact(item.name, item.phone)}
                activeOpacity={0.8}
              >
                <View style={styles.deviceContactAvatar}>
                  <Text style={styles.deviceContactAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.deviceContactInfo}>
                  <Text style={styles.deviceContactName}>{item.name}</Text>
                  <Text style={styles.deviceContactPhone}>{item.phone}</Text>
                </View>
                <Plus size={18} color={Colors.powderBlue} strokeWidth={2.4} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContacts}>
                <Text style={styles.emptyContactsText}>No matching contacts found on device.</Text>
              </View>
            }
          />
        </View>
      </Modal>

      {/* Modal: Manual Contact Add */}
      <Modal
        visible={manualContactModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setManualContactModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>Add Trusted Contact</Text>

            <Text style={styles.dialogLabel}>Contact Name</Text>
            <TextInput
              style={styles.dialogInput}
              placeholder="e.g. Roommate Aryan"
              placeholderTextColor={Colors.textMuted}
              value={newContactName}
              onChangeText={setNewContactName}
            />

            <Text style={styles.dialogLabel}>Phone Number</Text>
            <TextInput
              style={styles.dialogInput}
              placeholder="e.g. +91 9876543210"
              placeholderTextColor={Colors.textMuted}
              value={newContactPhone}
              onChangeText={setNewContactPhone}
              keyboardType="phone-pad"
            />

            <View style={styles.dialogButtonsRow}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => setManualContactModalVisible(false)}
              >
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogSubmitBtn}
                onPress={() => handleAddTrustedContact(newContactName, newContactPhone)}
              >
                <Text style={styles.dialogSubmitText}>Add Contact</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </LiquidCanvas>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.inkBlack,
  },
  flexFill: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl + 68,
    gap: Spacing.md,
  },
  heroOuter: {
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(226, 232, 240, 0.90)',
    ...(Platform.OS === 'web' ? {
      backdropFilter: 'blur(30px) saturate(190%)',
      WebkitBackdropFilter: 'blur(30px) saturate(190%)',
      boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05), inset 0 1px 1px #FFFFFF',
    } : {}),
    ...Shadows.subtle,
  },
  heroBlur: {
    width: '100%',
  },
  heroGradient: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  heroSpecular: {
    position: 'absolute',
    top: 0,
    left: 40,
    right: 40,
    height: 1,
    backgroundColor: '#FFFFFF',
  },
  avatarGlow: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.20)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.12)',
    } : {}),
  },
  avatarText: {
    fontSize: Typography.title,
    fontWeight: '800',
    color: Colors.powderBlue,
  },
  userName: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.porcelain,
    letterSpacing: -0.3,
  },
  userEmail: {
    fontSize: Typography.xs,
    color: '#64748B',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  glassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.90)',
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  glassBadgeSage: {
    borderColor: 'rgba(5, 150, 105, 0.25)',
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
  },
  glassBadgeText: {
    fontSize: Typography.xs - 2,
    fontWeight: '800',
    color: Colors.porcelain,
  },
  statsGrid: {
    flexDirection: 'row',
    width: '100%',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.80)',
    justifyContent: 'space-around',
  },
  glassStatBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.90)',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    minWidth: 84,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
    } : {}),
  },
  glassStatNumber: {
    fontSize: Typography.base,
    fontWeight: '800',
    color: Colors.porcelain,
    marginTop: 2,
  },
  glassStatLabel: {
    fontSize: Typography.xs - 3,
    color: '#64748B',
    textTransform: 'uppercase',
    marginTop: 2,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  adminBannerWrapper: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.90)',
    ...Shadows.subtle,
  },
  adminBlur: {
    width: '100%',
  },
  adminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  adminIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminBannerText: {
    flex: 1,
  },
  adminBannerTitle: {
    color: Colors.porcelain,
    fontSize: Typography.sm,
    fontWeight: '800',
  },
  adminBannerSub: {
    color: '#64748B',
    fontSize: Typography.xs - 1,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sectionTitle: {
    fontSize: Typography.base,
    fontWeight: '800',
    color: Colors.porcelain,
  },
  sectionSubtitle: {
    fontSize: Typography.xs,
    color: '#64748B',
    marginBottom: Spacing.md,
    lineHeight: 16,
  },
  editToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    backgroundColor: Colors.powderBlue,
    borderRadius: BorderRadius.full,
  },
  editLink: {
    fontSize: Typography.xs,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  trustedCountBadge: {
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.25)',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  trustedCountText: {
    fontSize: Typography.xs - 2,
    fontWeight: '800',
    color: Colors.drySage,
  },
  infoList: {
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm - 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.80)',
  },
  infoLabel: {
    fontSize: Typography.sm,
    color: '#64748B',
  },
  infoValue: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.porcelain,
  },
  editForm: {
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  label: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.porcelain,
    marginTop: Spacing.xs,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.90)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.sm,
    color: Colors.porcelain,
    backgroundColor: '#FFFFFF',
  },
  saveBtnWrapper: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    ...Shadows.glow,
  },
  saveButton: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: Typography.sm,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 250, 252, 0.90)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm + 2,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.85)',
  },
  contactAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.20)',
  },
  contactAvatarText: {
    color: Colors.powderBlue,
    fontWeight: '800',
    fontSize: Typography.sm,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.porcelain,
  },
  contactPhone: {
    fontSize: Typography.xs - 1,
    color: '#64748B',
  },
  contactCallBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.20)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  contactDeleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(239, 68, 68, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContactsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    backgroundColor: 'rgba(248, 250, 252, 0.90)',
    borderRadius: BorderRadius.lg,
    marginVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.85)',
  },
  emptyContactsTitle: {
    fontSize: Typography.sm,
    fontWeight: '800',
    color: Colors.porcelain,
    marginTop: Spacing.xs,
  },
  emptyContactsSub: {
    fontSize: Typography.xs - 1,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 3,
    lineHeight: 16,
  },
  contactActionButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.90)',
    borderRadius: BorderRadius.full,
  },
  actionBtnSecondaryText: {
    color: Colors.powderBlue,
    fontSize: Typography.xs,
    fontWeight: '700',
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 44,
    backgroundColor: Colors.powderBlue,
    borderRadius: BorderRadius.full,
  },
  actionBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: Typography.xs,
    fontWeight: '800',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: BorderRadius.full,
    height: 48,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  logoutButtonText: {
    color: '#DC2626',
    fontSize: Typography.sm,
    fontWeight: '800',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.inkBlack,
    paddingTop: Spacing.xxl,
    paddingHorizontal: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: '800',
    color: Colors.porcelain,
  },
  modalSearchInput: {
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.90)',
    fontSize: Typography.sm,
    color: Colors.porcelain,
    marginBottom: Spacing.md,
  },
  deviceContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.90)',
  },
  deviceContactAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  deviceContactAvatarText: {
    color: Colors.powderBlue,
    fontWeight: '800',
    fontSize: Typography.sm,
  },
  deviceContactInfo: {
    flex: 1,
  },
  deviceContactName: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.porcelain,
  },
  deviceContactPhone: {
    fontSize: Typography.xs,
    color: '#64748B',
  },
  emptyContacts: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyContactsText: {
    color: Colors.powderBlue,
    fontSize: Typography.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  dialogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 12px 35px rgba(15, 23, 42, 0.12)',
    } : {}),
  },
  dialogTitle: {
    fontSize: Typography.base,
    fontWeight: '800',
    color: Colors.porcelain,
    marginBottom: Spacing.sm,
  },
  dialogLabel: {
    fontSize: Typography.xs,
    color: '#64748B',
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  dialogInput: {
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.90)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.sm,
    color: Colors.porcelain,
    backgroundColor: 'rgba(248, 250, 252, 0.90)',
    marginTop: 4,
  },
  dialogButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.md + 4,
  },
  dialogCancelBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  dialogCancelText: {
    color: Colors.powderBlue,
    fontWeight: '700',
    fontSize: Typography.xs,
  },
  dialogSubmitBtn: {
    backgroundColor: Colors.powderBlue,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md + 4,
    borderRadius: BorderRadius.full,
  },
  dialogSubmitText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: Typography.xs,
  },
});
