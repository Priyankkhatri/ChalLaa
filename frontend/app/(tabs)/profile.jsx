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
} from 'react-native';
import { router } from 'expo-router';
import * as Contacts from 'expo-contacts';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';

export default function ProfileScreen() {
  const { user, logout, updateUser, refreshProfile } = useAuth();

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

  // Save profile changes
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

  // Device contact import via expo-contacts per Unit 4 conventions
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

  // Add trusted contact
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

  // Remove trusted contact
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
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Hero Profile Header */}
      <View style={styles.heroCard}>
        <View style={styles.avatarGlow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
        </View>

        <Text style={styles.userName}>{user?.name || 'Student'}</Text>
        <Text style={styles.userEmail}>{user?.email || ''}</Text>

        {/* Badges Row */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, user?.isVerified ? styles.badgeSuccess : styles.badgeWarning]}>
            <Ionicons
              name={user?.isVerified ? 'checkmark-circle' : 'hourglass-outline'}
              size={14}
              color={user?.isVerified ? Colors.secondaryDark : Colors.accentDark}
            />
            <Text
              style={[
                styles.badgeText,
                user?.isVerified ? styles.badgeTextSuccess : styles.badgeTextWarning,
              ]}
            >
              {user?.isVerified ? 'Verified Student' : 'Pending Verification'}
            </Text>
          </View>

          <View style={[styles.badge, styles.badgeKarma]}>
            <Ionicons name="star" size={14} color="#D97706" />
            <Text style={styles.badgeTextKarma}>Karma: {user?.karmaScore ?? 100}</Text>
          </View>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Ionicons name="sparkles" size={18} color={Colors.accent} />
            <Text style={styles.statNumber}>{user?.karmaScore ?? 100}</Text>
            <Text style={styles.statLabel}>Karma ⭐</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons name="shield-checkmark" size={18} color={Colors.secondary} />
            <Text style={styles.statNumber}>{user?.isVerified ? '100%' : '50%'}</Text>
            <Text style={styles.statLabel}>Trust Score</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons name="people" size={18} color={Colors.primary} />
            <Text style={styles.statNumber}>{user?.trustedContacts?.length || 0}</Text>
            <Text style={styles.statLabel}>Circle</Text>
          </View>
        </View>
      </View>

      {/* Admin Portal Launcher Banner (Admin Only) */}
      {user?.role === 'admin' ? (
        <TouchableOpacity
          style={styles.adminBanner}
          activeOpacity={0.85}
          onPress={() => router.push('/admin')}
        >
          <View style={styles.adminIconCircle}>
            <Ionicons name="shield-half" size={24} color={Colors.white} />
          </View>
          <View style={styles.adminBannerText}>
            <Text style={styles.adminBannerTitle}>Campus Moderation Panel</Text>
            <Text style={styles.adminBannerSub}>
              Manage disputes, student verifications & platform KPIs
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.white} />
        </TouchableOpacity>
      ) : null}

      {/* Account Details Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="person-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Campus Identity</Text>
          </View>
          <TouchableOpacity
            style={styles.editToggleBtn}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Ionicons name={isEditing ? 'close' : 'create-outline'} size={14} color={Colors.primary} />
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
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. +91 9876543210"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Hostel / College ID</Text>
            <TextInput
              style={styles.input}
              value={hostelOrCollegeId}
              onChangeText={setHostelOrCollegeId}
              placeholder="e.g. Hostel 4, Room 302"
            />

            <TouchableOpacity
              style={[styles.saveButton, savingProfile && styles.btnDisabled]}
              onPress={handleSaveProfile}
              disabled={savingProfile}
            >
              {savingProfile ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>Save Details</Text>
              )}
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
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account Role</Text>
              <Text style={[styles.infoValue, { textTransform: 'capitalize', fontWeight: 'bold' }]}>
                {user?.role || 'Student'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Trusted Contacts Section (Unit 4 expo-contacts) */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="heart-circle-outline" size={20} color={Colors.secondary} />
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
                <Ionicons name="call" size={16} color={Colors.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.contactDeleteBtn}
                onPress={() => handleRemoveContact(contact._id)}
              >
                <Ionicons name="trash-outline" size={16} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyContactsBox}>
            <Ionicons name="people-outline" size={32} color={Colors.textMuted} />
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
          >
            {loadingContacts ? (
              <ActivityIndicator color={Colors.primary} size="small" />
            ) : (
              <>
                <Ionicons name="phone-portrait-outline" size={16} color={Colors.primary} />
                <Text style={styles.actionBtnSecondaryText}>Import Contacts</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={() => setManualContactModalVisible(true)}
          >
            <Ionicons name="add-circle-outline" size={16} color={Colors.white} />
            <Text style={styles.actionBtnPrimaryText}>Add Peer</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
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
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.modalSearchInput}
            placeholder="Search contact by name or number..."
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
              >
                <View style={styles.deviceContactAvatar}>
                  <Text style={styles.deviceContactAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.deviceContactInfo}>
                  <Text style={styles.deviceContactName}>{item.name}</Text>
                  <Text style={styles.deviceContactPhone}>{item.phone}</Text>
                </View>
                <Ionicons name="add-circle" size={24} color={Colors.primary} />
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

            <Text style={styles.label}>Contact Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Roommate Aryan"
              value={newContactName}
              onChangeText={setNewContactName}
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. +91 9876543210"
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  heroCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  avatarGlow: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: Typography.title,
    fontWeight: 'bold',
    color: Colors.white,
  },
  userName: {
    fontSize: Typography.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  userEmail: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  badgeSuccess: {
    backgroundColor: '#DCFCE7',
  },
  badgeWarning: {
    backgroundColor: '#FEF3C7',
  },
  badgeKarma: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  badgeText: {
    fontSize: Typography.xs - 2,
    fontWeight: 'bold',
  },
  badgeTextSuccess: {
    color: Colors.secondaryDark,
  },
  badgeTextWarning: {
    color: '#B45309',
  },
  badgeTextKarma: {
    fontSize: Typography.xs - 2,
    fontWeight: 'bold',
    color: '#B45309',
  },
  statsGrid: {
    flexDirection: 'row',
    width: '100%',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: Typography.base,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 2,
  },
  statLabel: {
    fontSize: Typography.xs - 2,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: 2,
    fontWeight: '600',
  },
  adminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryDark,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadows.subtle,
  },
  adminIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminBannerText: {
    flex: 1,
  },
  adminBannerTitle: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: 'bold',
  },
  adminBannerSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: Typography.xs - 1,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
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
    gap: 6,
  },
  sectionTitle: {
    fontSize: Typography.base,
    fontWeight: 'bold',
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 16,
  },
  editToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.full,
  },
  editLink: {
    fontSize: Typography.xs,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  trustedCountBadge: {
    backgroundColor: Colors.secondaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  trustedCountText: {
    fontSize: Typography.xs - 2,
    fontWeight: 'bold',
    color: Colors.secondaryDark,
  },
  infoList: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoLabel: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  editForm: {
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  label: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.sm,
    color: Colors.text,
    backgroundColor: Colors.white,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  saveButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: Typography.sm,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm + 2,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  contactAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  contactAvatarText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: Typography.sm,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: Typography.sm,
    fontWeight: 'bold',
    color: Colors.text,
  },
  contactPhone: {
    fontSize: Typography.xs - 1,
    color: Colors.textSecondary,
  },
  contactCallBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  contactDeleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.dangerBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContactsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.xs,
  },
  emptyContactsTitle: {
    fontSize: Typography.sm,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  emptyContactsSub: {
    fontSize: Typography.xs - 1,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
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
    gap: 4,
    height: 42,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
  },
  actionBtnSecondaryText: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: 'bold',
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 42,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  actionBtnPrimaryText: {
    color: Colors.white,
    fontSize: Typography.xs,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: BorderRadius.lg,
    height: 48,
    marginTop: Spacing.xs,
  },
  logoutButtonText: {
    color: Colors.danger,
    fontSize: Typography.sm,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
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
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalSearchInput: {
    height: 44,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: Typography.sm,
    marginBottom: Spacing.md,
  },
  deviceContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  deviceContactAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  deviceContactAvatarText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: Typography.sm,
  },
  deviceContactInfo: {
    flex: 1,
  },
  deviceContactName: {
    fontSize: Typography.sm,
    fontWeight: 'bold',
    color: Colors.text,
  },
  deviceContactPhone: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
  emptyContacts: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyContactsText: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  dialogCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  dialogTitle: {
    fontSize: Typography.base,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  dialogButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  dialogCancelBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  dialogCancelText: {
    color: Colors.textSecondary,
    fontWeight: 'bold',
    fontSize: Typography.xs,
  },
  dialogSubmitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  dialogSubmitText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: Typography.xs,
  },
});
