import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/services/api';

export default function ProfileEditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // ===== Password change =====
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const profileImage = previewImage || user?.profilePicture;

  const pickImage = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to change your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setPreviewImage(asset.uri);
        uploadImage(asset.base64!);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  }, []);

  const takePhoto = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow camera access to take a profile photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setPreviewImage(asset.uri);
        uploadImage(asset.base64!);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  }, []);

  const showImageOptions = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Profile Picture', 'Choose an option', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Library', onPress: pickImage },
      ...(profileImage ? [{ text: 'Remove Photo', style: 'destructive' as const, onPress: removePhoto }] : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const uploadImage = async (base64: string) => {
    setUploadingImage(true);
    try {
      const response = await authAPI.uploadProfilePicture(base64);
      if (response.success) {
        await refreshUser();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert('Upload Failed', response.message || 'Failed to upload profile picture');
        setPreviewImage(null);
      }
    } catch (error) {
      Alert.alert('Upload Failed', 'Could not upload your profile picture. Please try again.');
      setPreviewImage(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const removePhoto = async () => {
    // Just set empty to the backend (we don't have a dedicated remove, but we can update with empty)
    setPreviewImage(null);
    // We'll handle this via a direct profile update with empty picture if needed
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Validation', 'Full name cannot be empty');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Validation', 'Phone number cannot be empty');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);

    try {
      const response = await authAPI.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
      });

      if (response.success) {
        await refreshUser();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Profile updated successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert('Validation', 'Please fill all password fields');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Validation', 'New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Validation', 'New password must be at least 6 characters');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setChangingPassword(true);

    try {
      const response = await authAPI.changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });

      if (response.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setShowPasswordSection(false);
      } else {
        Alert.alert('Error', response.message || 'Failed to change password');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={[Colors.primary, '#1E40AF']}
        style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Avatar */}
        <TouchableOpacity style={styles.avatarSection} onPress={showImageOptions} activeOpacity={0.8}>
          <View style={styles.avatarContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color={Colors.white} />
              </View>
            )}
            {uploadingImage && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator size="small" color={Colors.white} />
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={16} color={Colors.white} />
            </View>
          </View>
          <Text style={styles.changePhotoText}>Change Photo</Text>
        </TouchableOpacity>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.form}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <View style={styles.card}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="person-outline" size={18} color={Colors.gray} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Your full name"
                    placeholderTextColor={Colors.gray}
                  />
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="mail-outline" size={18} color={Colors.gray} style={styles.inputIcon} />
                  <Text style={styles.disabledInput}>{user?.email || ''}</Text>
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="call-outline" size={18} color={Colors.gray} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Your phone number"
                    placeholderTextColor={Colors.gray}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveProfile}
              disabled={saving}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[Colors.secondary, '#0891B2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButtonGradient}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color={Colors.white} />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Password Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowPasswordSection(!showPasswordSection);
                }}
              >
                <View style={styles.passwordToggleLeft}>
                  <MaterialCommunityIcons name="lock-outline" size={20} color={Colors.primary} />
                  <Text style={styles.passwordToggleText}>Change Password</Text>
                </View>
                <Ionicons
                  name={showPasswordSection ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={Colors.gray}
                />
              </TouchableOpacity>

              {showPasswordSection && (
                <View style={styles.passwordFields}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Current Password</Text>
                    <View style={styles.inputRow}>
                      <MaterialCommunityIcons name="lock-outline" size={18} color={Colors.gray} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        placeholder="Enter current password"
                        placeholderTextColor={Colors.gray}
                        secureTextEntry
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>New Password</Text>
                    <View style={styles.inputRow}>
                      <MaterialCommunityIcons name="lock-plus-outline" size={18} color={Colors.gray} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="Enter new password"
                        placeholderTextColor={Colors.gray}
                        secureTextEntry
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Confirm New Password</Text>
                    <View style={styles.inputRow}>
                      <MaterialCommunityIcons name="lock-check-outline" size={18} color={Colors.gray} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={confirmNewPassword}
                        onChangeText={setConfirmNewPassword}
                        placeholder="Confirm new password"
                        placeholderTextColor={Colors.gray}
                        secureTextEntry
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.changePasswordBtn}
                    onPress={handleChangePassword}
                    disabled={changingPassword}
                    activeOpacity={0.8}
                  >
                    {changingPassword ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <Text style={styles.changePasswordBtnText}>Update Password</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.white,
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: Spacing.sm,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 48,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  changePhotoText: {
    ...Typography.small,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  form: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.small,
    fontWeight: '600',
    color: Colors.gray,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    ...Shadows.small,
    overflow: 'hidden',
  },
  fieldGroup: {
    padding: Spacing.md,
  },
  fieldLabel: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.gray,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.dark,
    padding: 0,
    minHeight: 24,
  },
  disabledInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.gray,
  },
  verifiedBadge: {
    marginLeft: Spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginHorizontal: Spacing.md,
  },
  saveButton: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  saveButtonText: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.white,
  },
  passwordToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  passwordToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  passwordToggleText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.dark,
  },
  passwordFields: {
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    paddingTop: Spacing.sm,
  },
  changePasswordBtn: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
  },
  changePasswordBtnText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.primary,
  },
});
