import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
    ImageBackground,
    Image,
    KeyboardAvoidingView,
    Platform
} from "react-native";
import { businessApi } from "@/services/api/businessService";
import { BusinessRegisterRequest } from "@/types/business.types";
import AddressPicker from "./AddressPicker";
import { Province, District, Ward } from "@/types/address.types";

interface BusinessRegisterModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BusinessRegisterModal({ visible, onClose, onSuccess }: BusinessRegisterModalProps) {
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    businessMail: '',
    businessAddress: '',
    businessPhone: '',
    taxCode: '',
    openTime: '08:00',
    closeTime: '22:00',
  });

  // Address form data
  const [addressData, setAddressData] = useState({
    province: null as Province | null,
    district: null as District | null,
    ward: null as Ward | null,
    streetAddress: '',
  });

  const [files, setFiles] = useState({
    businessLogo: null as any,
    foodSafetyCertUrl: null as any,
    businessLicenseFile: null as any,
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    // Auto-format time input (HH:mm)
    if (field === 'openTime' || field === 'closeTime') {
      // Remove all non-numeric characters
      let numbers = value.replace(/\D/g, '');
      
      // Format as HH:mm
      let formatted = '';
      if (numbers.length > 0) {
        formatted = numbers.substring(0, 2);
        if (numbers.length > 2) {
          formatted += ':' + numbers.substring(2, 4);
        } else if (numbers.length === 2 && value.length > 2) {
          // User added colon manually
          formatted += ':';
        }
      }
      
      // Limit to HH:mm format (5 characters max)
      if (formatted.length <= 5) {
        setFormData(prev => ({ ...prev, [field]: formatted }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleFilePick = async (fileType: 'businessLogo' | 'foodSafetyCertUrl' | 'businessLicenseFile') => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission required", "Permission to access camera roll is required!");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setFiles(prev => ({
          ...prev,
          [fileType]: {
            name: `document_${Date.now()}.jpg`,
            uri: result.assets[0].uri,
            type: 'image/jpeg',
            size: result.assets[0].fileSize || 0,
          }
        }));
      }
    } catch (error) {
      Alert.alert("Error", "Unable to select file. Please try again.");
    }
  };

  // Build full address from address components
  const buildFullAddress = (): string => {
    const parts: string[] = [];
    if (addressData.streetAddress.trim()) {
      parts.push(addressData.streetAddress.trim());
    }
    if (addressData.ward) {
      parts.push(addressData.ward.name);
    }
    if (addressData.district) {
      parts.push(addressData.district.name);
    }
    if (addressData.province) {
      parts.push(addressData.province.name);
    }
    return parts.join(', ');
  };

  const validateForm = () => {
    if (!formData.businessName.trim()) {
      Alert.alert("Error", "Please enter business name");
      return false;
    }
    if (!formData.businessType.trim()) {
      Alert.alert("Error", "Please enter business type");
      return false;
    }
    if (!formData.businessMail.trim()) {
      Alert.alert("Error", "Please enter business email");
      return false;
    }
    // Validate address components
    if (!addressData.province) {
      Alert.alert("Error", "Please select province/city");
      return false;
    }
    if (!addressData.district) {
      Alert.alert("Error", "Please select district");
      return false;
    }
    if (!addressData.ward) {
      Alert.alert("Error", "Please select ward");
      return false;
    }
    if (!addressData.streetAddress.trim()) {
      Alert.alert("Error", "Please enter street address");
      return false;
    }
    if (!formData.businessPhone.trim()) {
      Alert.alert("Error", "Please enter phone number");
      return false;
    }
    if (!formData.taxCode.trim()) {
      Alert.alert("Error", "Please enter tax code");
      return false;
    }
    if (!formData.openTime.trim()) {
      Alert.alert("Error", "Please enter opening time");
      return false;
    }
    if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(formData.openTime)) {
      Alert.alert("Error", "Opening time must be in HH:mm format (e.g., 08:00)");
      return false;
    }
    if (!formData.closeTime.trim()) {
      Alert.alert("Error", "Please enter closing time");
      return false;
    }
    if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(formData.closeTime)) {
      Alert.alert("Error", "Closing time must be in HH:mm format (e.g., 22:00)");
      return false;
    }
    if (!files.businessLogo) {
      Alert.alert("Error", "Please upload business logo");
      return false;
    }
    if (!files.foodSafetyCertUrl) {
      Alert.alert("Error", "Please upload food safety certificate");
      return false;
    }
    if (!files.businessLicenseFile) {
      Alert.alert("Error", "Please upload business license");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Build full address from components
      const fullAddress = buildFullAddress();

      const businessData: BusinessRegisterRequest = {
        businessName: formData.businessName.trim(),
        businessType: formData.businessType.trim(),
        businessMail: formData.businessMail.trim(),
        businessAddress: fullAddress,
        businessPhone: formData.businessPhone.trim(),
        taxCode: formData.taxCode.trim(),
        openTime: formData.openTime.trim(),
        closeTime: formData.closeTime.trim(),
        businessLogo: files.businessLogo,
        foodSafetyCertUrl: files.foodSafetyCertUrl,
        businessLicenseFile: files.businessLicenseFile,
      };

      const response = await businessApi.register(businessData);
      
      const isSuccess = response.success || 
                       (response.message && response.message.toLowerCase().includes('successfully')) ||
                       (response.message && response.message.toLowerCase().includes('created')) ||
                       (response.message && response.message.toLowerCase().includes('submitted'));
      
      if (isSuccess) {
        Alert.alert(
          "Registration Successful", 
          response.message || "Your business information has been submitted. Please wait for admin approval.",
          [
            {
              text: "OK",
              onPress: () => {
                onSuccess?.();
                handleClose();
              }
            }
          ]
        );
      } else {
        Alert.alert("Error", response.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error('Business registration error:', error);
      const errorMessage = error instanceof Error ? error.message : "Registration failed. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setFormData({
      businessName: '',
      businessType: '',
      businessMail: '',
      businessAddress: '',
      businessPhone: '',
      taxCode: '',
      openTime: '08:00',
      closeTime: '22:00',
    });
    setAddressData({
      province: null,
      district: null,
      ward: null,
      streetAddress: '',
    });
    setFiles({
      businessLogo: null,
      foodSafetyCertUrl: null,
      businessLicenseFile: null,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <ImageBackground
        source={{ uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/splash-bg.jpg-0cgAaCzoZKCdOb8naNxHzXRdZGseCS.jpeg" }}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
            style={styles.keyboardView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.titleContainer}>
                  <Ionicons name="business-outline" size={28} color="#0F4D3A" style={{ marginRight: 12 }} />
                  <Text style={styles.modalTitle}>Business Registration</Text>
                </View>
                <TouchableOpacity onPress={handleClose} disabled={loading} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.scrollView} 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
              >
                <Text style={styles.formSubtitle}>Please fill in all information to complete registration</Text>
                
                {/* Business Information Section */}
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Business Information</Text>
                  <Text style={styles.sectionSubtitle}>Enter your business details</Text>
                  
                  {/* Business Name */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Business Name *</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="business" size={20} color="#6B7280" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter business name"
                        placeholderTextColor="#9CA3AF"
                        value={formData.businessName}
                        onChangeText={(value) => handleInputChange('businessName', value)}
                        autoCapitalize="words"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  {/* Business Email */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Email *</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter business email"
                        placeholderTextColor="#9CA3AF"
                        value={formData.businessMail}
                        onChangeText={(value) => handleInputChange('businessMail', value)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  {/* Business Phone */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Phone Number *</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="call-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter phone number"
                        placeholderTextColor="#9CA3AF"
                        value={formData.businessPhone}
                        onChangeText={(value) => handleInputChange('businessPhone', value)}
                        keyboardType="phone-pad"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  {/* Business Type */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Business Type *</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="storefront-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g., Cafe, Restaurant, Store..."
                        placeholderTextColor="#9CA3AF"
                        value={formData.businessType}
                        onChangeText={(value) => handleInputChange('businessType', value)}
                        autoCapitalize="words"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  {/* Tax Code */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Tax Code *</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="receipt-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter tax code"
                        placeholderTextColor="#9CA3AF"
                        value={formData.taxCode}
                        onChangeText={(value) => handleInputChange('taxCode', value)}
                        keyboardType="numeric"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  {/* Open Time */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Opening Time *</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="time-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="HH:mm (e.g., 08:00)"
                        placeholderTextColor="#9CA3AF"
                        value={formData.openTime}
                        onChangeText={(value) => handleInputChange('openTime', value)}
                        keyboardType="numbers-and-punctuation"
                        autoCapitalize="none"
                        autoCorrect={false}
                        maxLength={5}
                      />
                    </View>
                    <Text style={styles.helperText}>Format: HH:mm (24-hour, e.g., 08:00, 09:30)</Text>
                  </View>

                  {/* Close Time */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Closing Time *</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="time-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="HH:mm (e.g., 22:00)"
                        placeholderTextColor="#9CA3AF"
                        value={formData.closeTime}
                        onChangeText={(value) => handleInputChange('closeTime', value)}
                        keyboardType="numbers-and-punctuation"
                        autoCapitalize="none"
                        autoCorrect={false}
                        maxLength={5}
                      />
                    </View>
                    <Text style={styles.helperText}>Format: HH:mm (24-hour, e.g., 22:00, 23:30)</Text>
                  </View>
                </View>

                {/* Business Location Section */}
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Business Location</Text>
                  <Text style={styles.sectionSubtitle}>Select your business address</Text>
                  <AddressPicker
                    label=""
                    placeholder="Select address"
                    value={buildFullAddress()}
                    province={addressData.province}
                    district={addressData.district}
                    ward={addressData.ward}
                    streetAddress={addressData.streetAddress}
                    onSelect={(address) => {
                      setAddressData(address);
                    }}
                    required={true}
                  />
                </View>

                {/* Required Documents Section */}
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Required Documents</Text>
                  <Text style={styles.sectionSubtitle}>Upload necessary business documents for verification</Text>

                  {/* Business Logo */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Business Logo *</Text>
                    <Text style={styles.fileInfoText}>Accepted formats: JPG, PNG, WEBP</Text>
                    <Text style={styles.fileInfoText}>Maximum size: 5MB</Text>
                    <TouchableOpacity 
                      style={[styles.fileButton, files.businessLogo && styles.fileButtonSelected]}
                      onPress={() => handleFilePick('businessLogo')}
                      activeOpacity={0.7}
                    >
                      <View style={styles.fileButtonContent}>
                        <Ionicons 
                          name={files.businessLogo ? "checkmark-circle" : "image-outline"} 
                          size={24} 
                          color={files.businessLogo ? "#10B981" : "#0F4D3A"} 
                        />
                        <Text style={[styles.fileButtonText, files.businessLogo && styles.fileButtonTextSelected]}>
                          {files.businessLogo ? 'Image Selected' : 'Upload Logo'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    {files.businessLogo?.uri && (
                      <View style={styles.previewContainer}>
                        <Image source={{ uri: files.businessLogo.uri }} style={styles.previewImage} />
                        <TouchableOpacity 
                          style={styles.removeButton}
                          onPress={() => setFiles(prev => ({ ...prev, businessLogo: null }))}
                        >
                          <Ionicons name="close-circle" size={20} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* Business License */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Business License *</Text>
                    <Text style={styles.fileInfoText}>Accepted formats: PDF, JPG, PNG</Text>
                    <Text style={styles.fileInfoText}>Maximum size: 5MB</Text>
                    <TouchableOpacity 
                      style={[styles.fileButton, files.businessLicenseFile && styles.fileButtonSelected]}
                      onPress={() => handleFilePick('businessLicenseFile')}
                      activeOpacity={0.7}
                    >
                      <View style={styles.fileButtonContent}>
                        <Ionicons 
                          name={files.businessLicenseFile ? "checkmark-circle" : "document-attach-outline"} 
                          size={24} 
                          color={files.businessLicenseFile ? "#10B981" : "#0F4D3A"} 
                        />
                        <Text style={[styles.fileButtonText, files.businessLicenseFile && styles.fileButtonTextSelected]}>
                          {files.businessLicenseFile ? 'Document Selected' : 'Upload License'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    {files.businessLicenseFile?.uri && (
                      <View style={styles.previewContainer}>
                        <Image source={{ uri: files.businessLicenseFile.uri }} style={styles.previewImage} />
                        <TouchableOpacity 
                          style={styles.removeButton}
                          onPress={() => setFiles(prev => ({ ...prev, businessLicenseFile: null }))}
                        >
                          <Ionicons name="close-circle" size={20} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* Food Safety Certificate */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Food Safety Certificate *</Text>
                    <Text style={styles.fileInfoText}>Accepted formats: PDF, JPG, PNG</Text>
                    <Text style={styles.fileInfoText}>Maximum size: 5MB</Text>
                    <TouchableOpacity 
                      style={[styles.fileButton, files.foodSafetyCertUrl && styles.fileButtonSelected]}
                      onPress={() => handleFilePick('foodSafetyCertUrl')}
                      activeOpacity={0.7}
                    >
                      <View style={styles.fileButtonContent}>
                        <Ionicons 
                          name={files.foodSafetyCertUrl ? "checkmark-circle" : "document-text-outline"} 
                          size={24} 
                          color={files.foodSafetyCertUrl ? "#10B981" : "#0F4D3A"} 
                        />
                        <Text style={[styles.fileButtonText, files.foodSafetyCertUrl && styles.fileButtonTextSelected]}>
                          {files.foodSafetyCertUrl ? 'Document Selected' : 'Upload Certificate'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    {files.foodSafetyCertUrl?.uri && (
                      <View style={styles.previewContainer}>
                        <Image source={{ uri: files.foodSafetyCertUrl.uri }} style={styles.previewImage} />
                        <TouchableOpacity 
                          style={styles.removeButton}
                          onPress={() => setFiles(prev => ({ ...prev, foodSafetyCertUrl: null }))}
                        >
                          <Ionicons name="close-circle" size={20} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity 
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <View style={styles.submitButtonContent}>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={styles.submitIcon} />
                      <Text style={styles.submitButtonText}>Register Business</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </ImageBackground>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject as any,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    paddingTop: 40,
    paddingBottom: 40,
  },
  keyboardView: {
    width: '100%',
    maxWidth: '100%',
    flex: 1,
  },
  modalContent: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 20,
    width: '100%',
    maxWidth: '100%',
    flex: 1,
    maxHeight: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  formSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  sectionContainer: {
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    marginLeft: 4,
  },
  fileInfoText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 4,
  },
  inputIcon: {
    marginLeft: 12,
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
    backgroundColor: 'transparent',
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
    paddingTop: 4,
    paddingBottom: 4,
  },
  textArea: {
    minHeight: 80,
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 12,
  },
  fileButton: {
    borderWidth: 2,
    borderColor: '#0F4D3A',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.55)',
    minHeight: 56,
  },
  fileButtonSelected: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderStyle: 'solid',
  },
  fileButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileButtonText: {
    fontSize: 16,
    color: '#0F4D3A',
    fontWeight: '600',
    marginLeft: 10,
  },
  fileButtonTextSelected: {
    color: '#10B981',
    fontWeight: '600',
  },
  previewContainer: {
    marginTop: 12,
    position: 'relative',
    alignSelf: 'flex-start',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
  },
  submitButton: {
    height: 54,
    backgroundColor: '#0F4D3A',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

