import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { businessApi } from "@/services/api/businessService";
import { BusinessRegisterRequest } from "@/types/business.types";

const { width } = Dimensions.get('window');

export default function BusinessRegister() {
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

  const [files, setFiles] = useState({
    businessLogo: null as any,
    foodSafetyCertUrl: null as any,
    businessLicenseFile: null as any,
  });

  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const isFormValid = formData.businessName.trim() && 
                     formData.businessType.trim() && 
                     formData.businessMail.trim() && 
                     formData.businessAddress.trim() && 
                     formData.businessPhone.trim() && 
                     formData.taxCode.trim() && 
                     formData.openTime.trim() && 
                     formData.closeTime.trim() && 
                     files.businessLogo && 
                     files.foodSafetyCertUrl && 
                     files.businessLicenseFile;

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
      // Request permission
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
      Alert.alert("Lỗi", "Không thể chọn tệp. Vui lòng thử lại.");
    }
  };

  const validateForm = () => {
    if (!formData.businessName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên doanh nghiệp");
      return false;
    }
    if (!formData.businessType.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập loại hình doanh nghiệp");
      return false;
    }
    if (!formData.businessMail.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập email doanh nghiệp");
      return false;
    }
    if (!formData.businessAddress.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập địa chỉ doanh nghiệp");
      return false;
    }
    if (!formData.businessPhone.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập số điện thoại");
      return false;
    }
    if (!formData.taxCode.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập mã số thuế");
      return false;
    }
    if (!formData.openTime.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập giờ mở cửa");
      return false;
    }
    if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(formData.openTime)) {
      Alert.alert("Lỗi", "Giờ mở cửa phải theo định dạng HH:mm (ví dụ: 08:00)");
      return false;
    }
    if (!formData.closeTime.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập giờ đóng cửa");
      return false;
    }
    if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(formData.closeTime)) {
      Alert.alert("Lỗi", "Giờ đóng cửa phải theo định dạng HH:mm (ví dụ: 22:00)");
      return false;
    }
    if (!files.businessLogo) {
      Alert.alert("Lỗi", "Vui lòng tải lên logo doanh nghiệp");
      return false;
    }
    if (!files.foodSafetyCertUrl) {
      Alert.alert("Lỗi", "Vui lòng tải lên giấy chứng nhận an toàn thực phẩm");
      return false;
    }
    if (!files.businessLicenseFile) {
      Alert.alert("Lỗi", "Vui lòng tải lên giấy phép đăng ký kinh doanh");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const businessData: BusinessRegisterRequest = {
        businessName: formData.businessName.trim(),
        businessType: formData.businessType.trim(),
        businessMail: formData.businessMail.trim(),
        businessAddress: formData.businessAddress.trim(),
        businessPhone: formData.businessPhone.trim(),
        taxCode: formData.taxCode.trim(),
        openTime: formData.openTime.trim(),
        closeTime: formData.closeTime.trim(),
        businessLogo: files.businessLogo,
        foodSafetyCertUrl: files.foodSafetyCertUrl,
        businessLicenseFile: files.businessLicenseFile,
      };

      console.log('Sending business registration data:', businessData);
      
      const response = await businessApi.register(businessData);
      console.log('Business registration response:', response);
      console.log('Response success field:', response.success);
      console.log('Response message:', response.message);
      
      // Check for success indicators
      const isSuccess = response.success || 
                       (response.message && response.message.toLowerCase().includes('successfully')) ||
                       (response.message && response.message.toLowerCase().includes('created')) ||
                       (response.message && response.message.toLowerCase().includes('submitted'));
      
      console.log('Is success:', isSuccess);
      
      if (isSuccess) {
        Alert.alert(
          "Đăng ký thành công", 
          response.message || "Thông tin doanh nghiệp của bạn đã được gửi. Vui lòng đợi xét duyệt từ admin.",
          [
            {
              text: "OK",
              onPress: () => router.replace('/auth/login')
            }
          ]
        );
      } else {
        Alert.alert("Lỗi", response.message || "Đăng ký thất bại. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error('Business registration error:', error);
      
      let errorMessage = "Đăng ký thất bại. Vui lòng thử lại.";
      let showRetry = false;
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = "Kết nối quá chậm. Vui lòng kiểm tra mạng và thử lại.";
          showRetry = true;
        } else if (error.message.includes('Network')) {
          errorMessage = "Lỗi mạng. Vui lòng kiểm tra kết nối internet.";
          showRetry = true;
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = "Không thể kết nối đến server. Vui lòng thử lại sau.";
          showRetry = true;
        } else {
          errorMessage = error.message;
        }
      }
      
      if (showRetry && retryCount < 2) {
        Alert.alert(
          "Lỗi", 
          errorMessage,
          [
            { text: "Hủy", style: "cancel" },
            { 
              text: "Thử lại", 
              onPress: () => {
                setRetryCount(prev => prev + 1);
                setTimeout(() => handleSubmit(), 1000);
              }
            }
          ]
        );
      } else {
        Alert.alert("Lỗi", errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={{ uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/splash-bg.jpg-0cgAaCzoZKCdOb8naNxHzXRdZGseCS.jpeg" }}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.topHeader}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              
              <View style={styles.logoContainer}>
                <Image source={require("../../assets/images/logo.jpg")} style={styles.logo} resizeMode="contain" />
                <Text style={styles.brandText}>Back2Use</Text>
              </View>
              
              <View style={styles.placeholder} />
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              <View style={styles.titleContainer}>
                <Ionicons name="business-outline" size={28} color="#0F4D3A" style={{ marginRight: 12 }} />
                <Text style={styles.formTitle}>Đăng ký doanh nghiệp</Text>
              </View>
              <Text style={styles.formSubtitle}>Vui lòng điền đầy đủ thông tin để hoàn tất đăng ký</Text>
              
              {/* Business Name */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Tên doanh nghiệp *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="business" size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập tên doanh nghiệp"
                    placeholderTextColor="#9CA3AF"
                    value={formData.businessName}
                    onChangeText={(value) => handleInputChange('businessName', value)}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Business Type */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Loại hình doanh nghiệp *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="storefront-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ví dụ: Cafe, Nhà hàng, Cửa hàng..."
                    placeholderTextColor="#9CA3AF"
                    value={formData.businessType}
                    onChangeText={(value) => handleInputChange('businessType', value)}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Business Email */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Email doanh nghiệp *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập email doanh nghiệp"
                    placeholderTextColor="#9CA3AF"
                    value={formData.businessMail}
                    onChangeText={(value) => handleInputChange('businessMail', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Business Address */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Địa chỉ doanh nghiệp *</Text>
                <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                  <Ionicons name="location-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Nhập địa chỉ doanh nghiệp"
                    placeholderTextColor="#9CA3AF"
                    value={formData.businessAddress}
                    onChangeText={(value) => handleInputChange('businessAddress', value)}
                    multiline
                    numberOfLines={3}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Business Phone */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Số điện thoại *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="call-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập số điện thoại"
                    placeholderTextColor="#9CA3AF"
                    value={formData.businessPhone}
                    onChangeText={(value) => handleInputChange('businessPhone', value)}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Tax Code */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Mã số thuế *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="receipt-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập mã số thuế"
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
                <Text style={styles.label}>Giờ mở cửa *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="time-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="HH:mm (ví dụ: 08:00)"
                    placeholderTextColor="#9CA3AF"
                    value={formData.openTime}
                    onChangeText={(value) => handleInputChange('openTime', value)}
                    keyboardType="numbers-and-punctuation"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={5}
                  />
                </View>
                <Text style={styles.helperText}>Định dạng: HH:mm (24 giờ, ví dụ: 08:00, 09:30)</Text>
              </View>

              {/* Close Time */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Giờ đóng cửa *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="time-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="HH:mm (ví dụ: 22:00)"
                    placeholderTextColor="#9CA3AF"
                    value={formData.closeTime}
                    onChangeText={(value) => handleInputChange('closeTime', value)}
                    keyboardType="numbers-and-punctuation"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={5}
                  />
                </View>
                <Text style={styles.helperText}>Định dạng: HH:mm (24 giờ, ví dụ: 22:00, 23:30)</Text>
              </View>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Tài liệu cần thiết</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Business Logo */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Logo doanh nghiệp *</Text>
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
                      {files.businessLogo ? 'Đã chọn ảnh' : 'Chụp/Chọn logo'}
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

              {/* Food Safety Certificate */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Giấy chứng nhận an toàn thực phẩm *</Text>
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
                      {files.foodSafetyCertUrl ? 'Đã chọn ảnh' : 'Chụp/Chọn giấy chứng nhận'}
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

              {/* Business License File */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Giấy phép đăng ký kinh doanh *</Text>
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
                      {files.businessLicenseFile ? 'Đã chọn ảnh' : 'Chụp/Chọn giấy phép'}
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

              {/* Submit Button */}
              <TouchableOpacity 
                style={[styles.submitButton, (loading || !isFormValid) && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading || !isFormValid}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <View style={styles.submitButtonContent}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={styles.submitIcon} />
                    <Text style={styles.submitButtonText}>
                      {retryCount > 0 
                        ? `Thử lại lần ${retryCount + 1}` 
                        : 'Đăng ký doanh nghiệp'
                      }
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Đã có tài khoản? </Text>
                <TouchableOpacity onPress={() => router.push('/auth/login')}>
                  <Text style={styles.footerLink}>Đăng nhập ngay</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
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
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 20,
    marginRight: 0,
  },
  brandText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    includeFontPadding: false,
    marginLeft: -32,
    marginTop: 14,
  },
  placeholder: {
    width: 40,
  },
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    marginTop: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
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
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    marginLeft: 4,
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
  fileButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  footerLink: {
    fontSize: 14,
    color: '#0F4D3A',
    fontWeight: '600',
  },
});
