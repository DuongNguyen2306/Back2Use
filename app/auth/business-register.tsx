import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { router } from "expo-router";
import { useState } from "react";
import {
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
import { businessApi, BusinessRegisterRequest } from "../../lib/api/apiconfig";

const { width } = Dimensions.get('window');

export default function BusinessRegister() {
  const [formData, setFormData] = useState({
    storeName: '',
    storeMail: '',
    storeAddress: '',
    storePhone: '',
    taxCode: '',
  });

  const [files, setFiles] = useState({
    foodLicenseFile: null as any,
    businessLicenseFile: null as any,
  });

  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFilePick = async (fileType: 'foodLicenseFile' | 'businessLicenseFile') => {
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
    if (!formData.storeName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên cửa hàng");
      return false;
    }
    if (!formData.storeMail.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập email cửa hàng");
      return false;
    }
    if (!formData.storeAddress.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập địa chỉ cửa hàng");
      return false;
    }
    if (!formData.storePhone.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập số điện thoại");
      return false;
    }
    if (!formData.taxCode.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập mã số thuế");
      return false;
    }
    if (!files.foodLicenseFile) {
      Alert.alert("Lỗi", "Vui lòng tải lên giấy phép kinh doanh thực phẩm");
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
        storeName: formData.storeName.trim(),
        storeMail: formData.storeMail.trim(),
        storeAddress: formData.storeAddress.trim(),
        storePhone: formData.storePhone.trim(),
        taxCode: formData.taxCode.trim(),
        foodLicenseFile: files.foodLicenseFile,
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
          <Text style={styles.formTitle}>Thông tin cửa hàng</Text>
          
          {/* Store Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tên cửa hàng *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập tên cửa hàng"
              value={formData.storeName}
              onChangeText={(value) => handleInputChange('storeName', value)}
            />
          </View>

          {/* Store Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email cửa hàng *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập email cửa hàng"
              value={formData.storeMail}
              onChangeText={(value) => handleInputChange('storeMail', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Store Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Địa chỉ cửa hàng *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Nhập địa chỉ cửa hàng"
              value={formData.storeAddress}
              onChangeText={(value) => handleInputChange('storeAddress', value)}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Store Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Số điện thoại *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập số điện thoại"
              value={formData.storePhone}
              onChangeText={(value) => handleInputChange('storePhone', value)}
              keyboardType="phone-pad"
            />
          </View>

          {/* Tax Code */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mã số thuế *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập mã số thuế"
              value={formData.taxCode}
              onChangeText={(value) => handleInputChange('taxCode', value)}
              keyboardType="numeric"
            />
          </View>


          {/* Image Upload Section */}
          <Text style={styles.sectionTitle}>Tài liệu cần thiết (Chụp ảnh)</Text>

          {/* Food License File */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Giấy phép kinh doanh thực phẩm *</Text>
            <TouchableOpacity 
              style={styles.fileButton}
              onPress={() => handleFilePick('foodLicenseFile')}
            >
              <Ionicons name="camera-outline" size={20} color="#0F4D3A" />
              <Text style={styles.fileButtonText}>
                {files.foodLicenseFile ? 'Đã chọn ảnh' : 'Chụp/Chọn ảnh'}
              </Text>
            </TouchableOpacity>
            {files.foodLicenseFile && (
              <Text style={styles.fileInfo}>
                Đã chọn: {files.foodLicenseFile.name}
              </Text>
            )}
          </View>

          {/* Business License File */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Giấy phép đăng ký kinh doanh *</Text>
            <TouchableOpacity 
              style={styles.fileButton}
              onPress={() => handleFilePick('businessLicenseFile')}
            >
              <Ionicons name="camera-outline" size={20} color="#0F4D3A" />
              <Text style={styles.fileButtonText}>
                {files.businessLicenseFile ? 'Đã chọn ảnh' : 'Chụp/Chọn ảnh'}
              </Text>
            </TouchableOpacity>
            {files.businessLicenseFile && (
              <Text style={styles.fileInfo}>
                Đã chọn: {files.businessLicenseFile.name}
              </Text>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading 
                ? 'Đang gửi dữ liệu...' 
                : retryCount > 0 
                  ? `Thử lại lần ${retryCount + 1}` 
                  : 'Đăng ký doanh nghiệp'
              }
            </Text>
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginLink}>
            <Text style={styles.loginText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={styles.loginLinkText}>Đăng nhập ngay</Text>
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 0,
  },
  brandText: {
    fontSize: 30,
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
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#374151',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#374151',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F4D3A',
    marginTop: 10,
    marginBottom: 15,
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0F4D3A',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  fileButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#0F4D3A',
    fontWeight: '500',
  },
  fileInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: '#0F4D3A',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 16,
    color: '#666',
  },
  loginLinkText: {
    fontSize: 16,
    color: '#0F4D3A',
    fontWeight: '600',
  },
});
