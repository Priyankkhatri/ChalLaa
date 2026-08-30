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
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';

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
  const [searchQuery, setSearchQuery] = useState('');

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

  // Handle Profile Update
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
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Import Device Contacts using expo-contacts per Unit 4 conventions
  const handleOpenDeviceContacts = async () => {
    try {
      setLoadingContacts(true);
      const { status } = await Contacts.requestPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Permission to access device contacts was denied. You can add contacts manually instead.'
        );
        setLoadingContacts(false);
        return;
      }

      setContactsModalVisible(true);
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      });

      if (data && data.length > 0) {
        // Filter contacts that have valid phone numbers
        const validContacts = data
          .filter((c) => c.name && c.phoneNumbers && c.phoneNumbers.length > 0)
          .map((c) => ({
            id: c.id,
            name: c.name,
            phone: c.phoneNumbers[0].number,
          }));
        setDeviceContacts(validContacts);
      } else {
        setDeviceContacts([]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load device contacts.');
    } finally {
      setLoadingContacts(false);
    }
  };

  // Add Contact to Trusted Contacts List
  const handleAddTrustedContact = async (contactName, contactPhone) => {
    if (!contactName.trim() || !contactPhone.trim()) {
      Alert.alert('Validation Error', 'Both contact name and phone number are required.');
      return;
    }

    const currentContacts = user?.trustedContacts || [];
    // Check if duplicate
    const exists = currentContacts.some(
      (c) => c.phone.replace(/\s+/g, '') === contactPhone.replace(/\s+/g, '')
    );
    if (exists) {
      Alert.alert('Already Added', 'This contact is already in your trusted contacts list.');
      return;
    }

    const updated = [...currentContacts, { name: contactName.trim(), phone: contactPhone.trim() }];

    try {
      await updateUser({ trustedContacts: updated });
      setContactsModalVisible(false);
      setManualContactModalVisible(false);
      setNewContactName('');
      setNewContactPhone('');
      Alert.alert('Success', `${contactName} added to trusted contacts.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update trusted contacts.');
    }
  };

  // Remove Contact
  const handleRemoveContact = (indexToRemove) => {
    Alert.alert('Remove Contact', 'Are you sure you want to remove this trusted contact?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const currentContacts = user?.trustedContacts || [];
          const updated = currentContacts.filter((_, idx) => idx !== indexToRemove);
          try {
            await updateUser({ trustedContacts: updated });
          } catch (error) {
            Alert.alert('Error', 'Failed to remove contact.');
          }
        },
      },
    ]);
  };

  // Logout with confirmation
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

  const filteredDeviceContacts = deviceContacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* User Header Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>

        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email || ''}</Text>

        <View style={styles.badgeRow}>
          <View style={[styles.badge, user?.isVerified ? styles.badgeSuccess : styles.badgeWarning]}>
            <Ionicons
              name={user?.isVerified ? 'checkmark-circle' : 'time-outline'}
              size={14}
              color={user?.isVerified ? Colors.secondaryDark : Colors.accent}
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

        {user?.role === 'admin' ? (
          <View style={[styles.badge, styles.badgeAdmin]}>
            <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
            <Text style={styles.badgeTextAdmin}>Hostel / Campus Admin</Text>
          </View>
        ) : null}
      </View>

      {/* Account Details Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
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

            <Text style={styles.label}>Hostel / Room / ID</Text>
            <TextInput
              style={styles.input}
              value={hostelOrCollegeId}
              onChangeText={setHostelOrCollegeId}
              placeholder="e.g. Block B, Room 204"
            />

            <TouchableOpacity
              style={[styles.primaryButton, savingProfile && styles.buttonDisabled]}
              onPress={handleSaveProfile}
              disabled={savingProfile}
            >
              {savingProfile ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{user?.phone || 'Not set'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="home-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.infoLabel}>Hostel / ID:</Text>
              <Text style={styles.infoValue}>{user?.hostelOrCollegeId || 'Not set'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="shield-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.infoLabel}>Role:</Text>
              <Text style={styles.infoValue}>{user?.role?.toUpperCase() || 'USER'}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Trusted Contacts Section (PRD FR-1.3 & Unit 4 expo-contacts) */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Trusted Contacts</Text>
            <Text style={styles.sectionSubtitle}>
              Peers who can vouch for you and coordinate safety
            </Text>
          </View>
        </View>

        {user?.trustedContacts && user.trustedContacts.length > 0 ? (
          user.trustedContacts.map((contact, index) => (
            <View key={contact._id || index} style={styles.contactItem}>
              <View style={styles.contactIcon}>
                <Ionicons name="person" size={18} color={Colors.primary} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveContact(index)}
                style={styles.removeContactBtn}
              >
                <Ionicons name="trash-outline" size={18} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyContacts}>
            <Ionicons name="people-outline" size={36} color={Colors.textMuted} />
            <Text style={styles.emptyContactsText}>No trusted contacts added yet.</Text>
          </View>
        )}

        <View style={styles.contactActionsRow}>
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
                <Text style={styles.actionBtnSecondaryText}>Import Phone</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={() => setManualContactModalVisible(true)}
          >
            <Ionicons name="add" size={16} color={Colors.white} />
            <Text style={styles.actionBtnPrimaryText}>Add Manually</Text>
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
            <Text style={styles.modalTitle}>Import Trusted Contact</Text>
            <TouchableOpacity onPress={() => setContactsModalVisible(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchBar}
            placeholder="Search device contacts..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <FlatList
            data={filteredDeviceContacts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.deviceContactItem}
                onPress={() => handleAddTrustedContact(item.name, item.phone)}
              >
                <View style={styles.deviceContactAvatar}>
                  <Text style={styles.deviceContactInitial}>{item.name.charAt(0)}</Text>
                </View>
                <View style={styles.deviceContactDetails}>
                  <Text style={styles.deviceContactName}>{item.name}</Text>
                  <Text style={styles.deviceContactPhone}>{item.phone}</Text>
                </View>
                <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
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
  },
  profileCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatarText: {
    fontSize: Typography.title,
    fontWeight: 'bold',
    color: Colors.primary,
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
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  badgeSuccess: {
    backgroundColor: Colors.successBg,
    borderColor: Colors.secondary,
    borderWidth: 1,
  },
  badgeWarning: {
    backgroundColor: Colors.warningBg,
    borderColor: Colors.accent,
    borderWidth: 1,
  },
  badgeKarma: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
  },
  badgeAdmin: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
  badgeText: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  badgeTextSuccess: {
    color: Colors.secondaryDark,
  },
  badgeTextWarning: {
    color: '#B45309',
  },
  badgeTextKarma: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: '#B45309',
  },
  badgeTextAdmin: {
    fontSize: Typography.xs,
    fontWeight: 'bold',
    color: Colors.primaryDark,
  },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
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
  editLink: {
    fontSize: Typography.sm,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  infoList: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoLabel: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: Typography.sm,
    color: Colors.text,
    fontWeight: '600',
  },
  editForm: {
    marginTop: Spacing.xs,
  },
  label: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.xs,
    marginBottom: 4,
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    fontSize: Typography.sm,
    color: Colors.text,
    backgroundColor: Colors.white,
    marginBottom: Spacing.xs,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: 'bold',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  contactPhone: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
  removeContactBtn: {
    padding: Spacing.xs,
  },
  emptyContacts: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContactsText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  contactActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  actionBtnSecondaryText: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
  },
  actionBtnPrimaryText: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.white,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.dangerBg,
    borderColor: Colors.danger,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  logoutButtonText: {
    fontSize: Typography.base,
    fontWeight: 'bold',
    color: Colors.danger,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.md,
    paddingTop: Spacing.xl,
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
  searchBar: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
    marginBottom: Spacing.md,
  },
  deviceContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: 4,
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
  deviceContactInitial: {
    fontSize: Typography.base,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  deviceContactDetails: {
    flex: 1,
  },
  deviceContactName: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  deviceContactPhone: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  dialogCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  dialogTitle: {
    fontSize: Typography.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
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
    fontWeight: '600',
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
  },
});
