import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface AvatarPickerProps {
  currentAvatar?: string;
  onAvatarSelected: (imageUri: string) => void;
  size?: number;
  showEditButton?: boolean;
}

export default function AvatarPicker({
  currentAvatar,
  onAvatarSelected,
  size = 100,
  showEditButton = true,
}: AvatarPickerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
      Alert.alert(
        'Quyền truy cập',
        'Vui lòng cấp quyền truy cập camera và thư viện ảnh để thay đổi avatar.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Chọn ảnh đại diện',
      'Bạn muốn chọn ảnh từ đâu?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Thư viện ảnh',
          onPress: pickImageFromLibrary,
        },
        {
          text: 'Chụp ảnh',
          onPress: takePhoto,
        },
        {
          text: 'Nhập link ảnh',
          onPress: showUrlInput,
        },
      ]
    );
  };

  const pickImageFromLibrary = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      setIsLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Validate file size (max 5MB)
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          Alert.alert('Lỗi', 'Kích thước ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB.');
          return;
        }

        // Validate image dimensions (max 2048x2048)
        if (asset.width && asset.height && (asset.width > 2048 || asset.height > 2048)) {
          Alert.alert('Lỗi', 'Kích thước ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 2048x2048 pixels.');
          return;
        }

        onAvatarSelected(asset.uri);
      }
    } catch (error) {
      console.error('Error picking image from library:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh từ thư viện. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      setIsLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Validate file size (max 5MB)
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          Alert.alert('Lỗi', 'Kích thước ảnh quá lớn. Vui lòng chụp ảnh với chất lượng thấp hơn.');
          return;
        }

        // Validate image dimensions (max 2048x2048)
        if (asset.width && asset.height && (asset.width > 2048 || asset.height > 2048)) {
          Alert.alert('Lỗi', 'Kích thước ảnh quá lớn. Vui lòng chụp ảnh với độ phân giải thấp hơn.');
          return;
        }

        onAvatarSelected(asset.uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const showUrlInput = () => {
    setUrlInput('');
    setShowUrlModal(true);
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập link ảnh');
      return;
    }

    // Basic URL validation
    const urlRegex = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;
    if (!urlRegex.test(urlInput.trim())) {
      Alert.alert('Lỗi', 'Vui lòng nhập link ảnh hợp lệ (jpg, jpeg, png, gif, webp)');
      return;
    }

    setShowUrlModal(false);
    onAvatarSelected(urlInput.trim());
  };

  const handleUrlCancel = () => {
    setShowUrlModal(false);
    setUrlInput('');
  };

  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  return (
    <View style={styles.container}>
      <View style={[styles.avatarContainer, avatarStyle]}>
        {currentAvatar ? (
          <Image source={{ uri: currentAvatar }} style={avatarStyle} />
        ) : (
          <View style={[styles.placeholderAvatar, avatarStyle]}>
            <Ionicons name="person" size={size * 0.5} color="#FFFFFF" />
          </View>
        )}
        
        {showEditButton && (
          <TouchableOpacity
            style={[styles.editButton, { bottom: size * 0.05, right: size * 0.05 }]}
            onPress={showImagePickerOptions}
            disabled={isLoading}
          >
            {isLoading ? (
              <Ionicons name="hourglass" size={16} color="#FFFFFF" />
            ) : (
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* URL Input Modal */}
      <Modal
        visible={showUrlModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleUrlCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nhập link ảnh</Text>
            <Text style={styles.modalSubtitle}>
              Nhập link ảnh từ internet (jpg, jpeg, png, gif, webp)
            </Text>
            
            <TextInput
              style={styles.urlInput}
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              onChangeText={setUrlInput}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleUrlCancel}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleUrlSubmit}
              >
                <Text style={styles.submitButtonText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeholderAvatar: {
    backgroundColor: '#00704A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    position: 'absolute',
    backgroundColor: '#00704A',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  urlInput: {
    height: 48,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  submitButton: {
    backgroundColor: '#00704A',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
