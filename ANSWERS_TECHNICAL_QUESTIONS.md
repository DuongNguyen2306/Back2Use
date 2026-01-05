# TRẢ LỜI CÁC CÂU HỎI KỸ THUẬT - BACK2USE APP

## 📋 DANH SÁCH CÂU HỎI VÀ TRẢ LỜI

---

## ❓ CÂU 1: BẠN QUÉT QR BẰNG CÁCH NÀO VÀ CODE NÓ NẰM Ở ĐÂU?

### Cách quét QR:

**Sử dụng Expo Camera với CameraView component:**
- Thư viện: `expo-camera`
- Component: `CameraView` với `barcodeScannerSettings`
- Callback: `onBarcodeScanned` để nhận kết quả quét

### Code location và implementation:

**1. Customer Dashboard - Quét QR để mượn sản phẩm:**
- **File:** `app/(protected)/customer/customer-dashboard.tsx`
- **Dòng:** 1176-1181 (CameraView component)
- **Handler:** Dòng 319-499 (`onBarcode` function)

**Code cụ thể:**

```typescript
// Dòng 8: Import
import { CameraView, useCameraPermissions } from "expo-camera";

// Dòng 38-39: Permission và state
const [permission, requestPermission] = useCameraPermissions();
const [showQRScanner, setShowQRScanner] = useState(false);

// Dòng 51: Scan lock để prevent duplicate scans
const scanLock = useRef(false);

// Dòng 319-499: Handler khi scan thành công
const onBarcode = async (e: { data?: string }) => {
  if (scanLock.current) return; // Prevent duplicate
  scanLock.current = true; // Lock scanning
  
  const scannedData = e?.data ?? '';
  // Parse QR code, extract serial number hoặc transaction ID
  // Gọi API productsApi.scan() để lấy product info
  // Hiển thị product modal với thông tin sản phẩm
  
  scanLock.current = false; // Unlock sau khi xử lý xong
};

// Dòng 1176-1181: CameraView component
<CameraView 
  style={StyleSheet.absoluteFillObject} 
  barcodeScannerSettings={{ barcodeTypes: ["qr"] }} 
  onBarcodeScanned={onBarcode}
  enableTorch={flashEnabled}
/>
```

**2. Business Transaction Processing - Unified QR Scanner:**
- **File:** `app/(protected)/business/transaction-processing.tsx`
- **Dòng:** 3532, 3769 (CameraView components)
- **Handler:** Dòng 693-920 (`onUnifiedBarcodeScanned` function)

**Logic phân biệt borrow vs return:**
- State `unifiedScannerMode`: 'borrow' | 'return'
- Xử lý khác nhau trong `onUnifiedBarcodeScanned` dựa trên mode

**3. Components:**
- `components/NativeQRScanner.tsx` - Dòng 37-47
- `app/(protected)/business/qr-scanner.tsx` - Dòng 164
- `app/(protected)/business/voucher-scan.tsx` - Dòng 350

---

## ❓ CÂU 2: BẠN XỬ LÝ NHƯ THẾ NÀO ĐỂ KHI ẤN MƯỢN MÀ MẠNG LAG ẤN MƯỢN THÊM LẦN NỮA MÀ KHÔNG BỊ LỖI - CODE ĐÓ Ở ĐÂU?

### Giải pháp: Sử dụng loading state và disable button

**File:** `app/(protected)/customer/customer-dashboard.tsx`
**Dòng:** 44, 693, 775, 829, 904

### Implementation:

**1. Loading state:**
```typescript
// Dòng 44: State để track borrowing status
const [borrowing, setBorrowing] = useState(false);

// Dòng 693: Set loading = true khi bắt đầu borrow
setBorrowing(true);

// Dòng 775, 829, 904: Set loading = false khi xong (success hoặc error)
setBorrowing(false);
```

**2. Disable button khi đang processing:**
```typescript
// Dòng ~850-900: Button với disabled prop
<TouchableOpacity 
  style={[styles.borrowButton, borrowing && styles.disabledButton]}
  onPress={handleBorrow}
  disabled={borrowing} // Disable khi đang xử lý
>
  {borrowing ? (
    <ActivityIndicator color="#FFFFFF" size="small" />
  ) : (
    <Text>Borrow</Text>
  )}
</TouchableOpacity>
```

**3. Prevent duplicate API calls:**
- Check `borrowing` state trước khi gọi API
- Set `borrowing = true` ngay lập tức khi user click
- Button bị disable, không thể click lần 2
- Set `borrowing = false` trong `finally` block để đảm bảo luôn được reset

**Code cụ thể (dòng 690-829):**

```typescript
// Dòng 690-904: handleBorrow function
{
  text: 'Confirm',
  onPress: async () => {
    try {
      setBorrowing(true); // ✅ Lock ngay lập tức
      
      // ... validation code ...
      
      // Gọi API
      const response = await borrowTransactionsApi.createWithAutoRefresh(borrowDto);
      
      // Success handling
      Alert.alert('Success', '...');
      setBorrowing(false); // ✅ Unlock khi success
      
    } catch (error) {
      // Error handling
      Alert.alert('Error', error.message);
      setBorrowing(false); // ✅ Unlock khi error
    }
    // Không cần finally vì đã set ở cả success và error
    // Nhưng có thể thêm finally để chắc chắn
  }
}
```

**Lưu ý quan trọng:**
- **React state update là async**, nhưng vì button có `disabled={borrowing}`, nên khi `setBorrowing(true)` được gọi, button sẽ bị disable trong lần render tiếp theo
- Để chắc chắn hơn, có thể check `borrowing` state ở đầu function:

```typescript
const handleBorrow = async () => {
  if (borrowing) return; // ✅ Double check
  setBorrowing(true);
  // ... rest of code
};
```

**Các file có logic tương tự:**
- `app/(protected)/customer/customer-dashboard.tsx` - Customer borrow
- `app/(protected)/business/transaction-processing.tsx` - Business confirm borrow/return
  - Dòng 103, 104, 2650: `confirmingReturn`, `processingReturn` states

---

## ❓ CÂU 3: BẠN CHIA QR CONFIRM BORROW VÀ QR RETURN NHƯ THẾ NÀO VÀ CODE Ở ĐÂU?

### Cách phân biệt:

**Sử dụng unified scanner với mode switching:**
- Một scanner component nhưng có `mode` state
- Mode: 'borrow' | 'return'
- Xử lý logic khác nhau dựa trên mode

### Code location:

**File:** `app/(protected)/business/transaction-processing.tsx`

**1. State management:**
- **Dòng 128-129:** Unified scanner states
```typescript
const [showUnifiedQRScanner, setShowUnifiedQRScanner] = useState(false);
const [unifiedScannerMode, setUnifiedScannerMode] = useState<'borrow' | 'return'>('borrow');
```

**2. Mode switching:**
- **Dòng 1000-1030:** Set mode khi mở scanner
```typescript
// Mở scanner cho borrow confirmation
const openBorrowScanner = () => {
  setUnifiedScannerMode('borrow');
  setShowUnifiedQRScanner(true);
};

// Mở scanner cho return
const openReturnScanner = () => {
  setUnifiedScannerMode('return');
  setShowUnifiedQRScanner(true);
};
```

**3. Handler phân biệt mode:**
- **Dòng 693-920:** `onUnifiedBarcodeScanned` function

```typescript
const onUnifiedBarcodeScanned = async (e: any) => {
  if (unifiedScanLock.current) return;
  unifiedScanLock.current = true;
  
  const scannedData = e?.data ?? '';
  
  // ✅ PHÂN BIỆT MODE
  if (unifiedScannerMode === 'borrow') {
    // Handle borrow confirmation
    // Tìm transaction với status: 'pending' | 'waiting' | 'pending_pickup'
    // Hiển thị confirm borrow modal
  } else if (unifiedScannerMode === 'return') {
    // Handle return
    // Extract serial number
    // Mở return modal với serial number
    setReturnSerialNumber(serialNumber);
  }
  
  unifiedScanLock.current = false;
};
```

**4. Borrow confirmation logic:**
- **Dòng 719-890:** Xử lý khi mode = 'borrow'
- Tìm transaction với:
  - `borrowTransactionType === 'borrow'`
  - `status === 'pending' || 'waiting' || 'pending_pickup'`
- Show confirm borrow modal

**5. Return logic:**
- **Dòng 920-1100:** Xử lý khi mode = 'return'
- Extract serial number từ QR
- Set `returnSerialNumber` state
- Mở return modal (auto-open với useEffect)

**6. CameraView component:**
- **Dòng 3532-3540:** Unified scanner camera
```typescript
<CameraView 
  style={StyleSheet.absoluteFillObject} 
  barcodeScannerSettings={{ barcodeTypes: ['qr'] }} 
  onBarcodeScanned={onUnifiedBarcodeScanned}
  enableTorch={unifiedFlashEnabled}
/>
```

**7. Legacy scanners (backward compatibility):**
- **Dòng 138-152:** Có separate scanners cho borrow và return (legacy)
- **Dòng 2994-2999:** Borrow QR Scanner (legacy)
- **Dòng 2868-2899:** Return QR Scanner (legacy)

**Summary:**
- ✅ Một scanner component với mode switching
- ✅ Logic phân biệt trong `onUnifiedBarcodeScanned`
- ✅ Borrow: Tìm transaction pending và show confirm modal
- ✅ Return: Extract serial number và mở return modal

---

## ❓ CÂU 4: BẠN LƯU TOKEN NHƯ THẾ NÀO VÀ CODE Ở ĐÂU?

### Cách lưu token:

**Sử dụng AsyncStorage để lưu persistent storage:**
- Library: `@react-native-async-storage/async-storage`
- Lưu: ACCESS_TOKEN, REFRESH_TOKEN, TOKEN_EXPIRY, AUTH, ROLE

### Code locations:

**1. Login - Lưu token sau khi login thành công:**
- **File:** `src/features/auth/hooks/useAuth.ts`
- **Dòng:** 495-506 (`login` function)

```typescript
// Dòng 495-506: Save tokens to AsyncStorage
const tokenExpiry = Date.now() + (60 * 60 * 1000); // 1 hour

await Promise.all([
  AsyncStorage.setItem(STORAGE_KEYS.AUTH, "true"),
  AsyncStorage.setItem(STORAGE_KEYS.ROLE, String(role || "")),
  AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
  AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken || ""),
  AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, tokenExpiry.toString()),
]);
```

**2. Storage keys constants:**
- **File:** `src/features/auth/hooks/useAuth.ts`
- **Dòng:** 16-25

```typescript
const STORAGE_KEYS = {
  AUTH: "AUTH",
  ROLE: "AUTH_ROLE",
  ACCESS_TOKEN: "ACCESS_TOKEN",
  REFRESH_TOKEN: "REFRESH_TOKEN",
  TOKEN_EXPIRY: "TOKEN_EXPIRY",
} as const;
```

**3. Hydrate tokens khi app start:**
- **File:** `src/features/auth/hooks/useAuth.ts`
- **Dòng:** 153-199 (`hydrateAuth` function)

```typescript
// Đọc tokens từ AsyncStorage khi component mount
const [
  storedAuth,
  storedRole,
  storedAccessToken,
  storedRefreshToken,
  storedTokenExpiry,
] = await Promise.all([
  AsyncStorage.getItem(STORAGE_KEYS.AUTH),
  AsyncStorage.getItem(STORAGE_KEYS.ROLE),
  AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
  AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
  AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY),
]);

// Set vào state
setState({
  isAuthenticated: storedAuth === "true",
  role: parsedRole,
  accessToken: storedAccessToken,
  refreshToken: storedRefreshToken,
  tokenExpiry: storedTokenExpiry ? parseInt(storedTokenExpiry, 10) : null,
  // ...
});
```

**4. Logout - Xóa tokens:**
- **File:** `src/features/auth/hooks/useAuth.ts`
- **Dòng:** 85-89 (`logout` function)

```typescript
await Promise.all([
  AsyncStorage.removeItem(STORAGE_KEYS.AUTH),
  AsyncStorage.removeItem(STORAGE_KEYS.ROLE),
  AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
  AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
  AsyncStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY),
]);
```

**5. Token refresh - Update tokens:**
- **File:** `src/features/auth/hooks/useAuth.ts`
- **Dòng:** 664-666 (`refreshToken` function)

```typescript
// Update tokens sau khi refresh
await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
await AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, tokenExpiry.toString());
```

**6. Đọc token trong API services:**
- **File:** `src/services/api/client.ts`
- **Dòng:** 63-87 (Axios interceptor)

```typescript
apiClient.interceptors.request.use(
  async (config) => {
    // Đọc token từ AsyncStorage
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }
);
```

**7. Token provider pattern:**
- **File:** `context/AuthProvider.tsx`
- **Dòng:** 17-23

```typescript
// Set token provider để các API services có thể lấy token tự động
useEffect(() => {
  setTokenProvider(value.actions.getCurrentAccessToken);
  setBusinessTokenProvider(value.actions.getCurrentAccessToken);
  // ... other providers
}, [value.actions.getCurrentAccessToken]);
```

**Summary:**
- ✅ Lưu trong AsyncStorage (persistent storage)
- ✅ Lưu: ACCESS_TOKEN, REFRESH_TOKEN, TOKEN_EXPIRY, AUTH, ROLE
- ✅ Đọc khi app start (hydrate)
- ✅ Auto-add vào API requests qua interceptor
- ✅ Token provider pattern để share với API services

---

## ❓ CÂU 5: BẠN XÀI CÁI GÌ MÀ CÓ MAP Ở TRONG STORE NHƯ THẾ VÀ LÀM SAO ĐỂ HIỆN CÁC STORE VÀ CODE NÓ NẰM Ở ĐÂU?

### Library sử dụng:

**React Native Maps:**
- Package: `react-native-maps`
- Components: `MapView`, `Marker`, `Region`

### Code location:

**File:** `app/(protected)/customer/stores.tsx`

**1. Import:**
- **Dòng:** 24
```typescript
import MapView, { Marker, Region } from 'react-native-maps';
```

**2. Location permission và get user location:**
- **Dòng:** 76-126 (`getCurrentLocation` function)

```typescript
// Request location permission
const { status } = await Location.requestForegroundPermissionsAsync();

// Get current position
const location = await Location.getCurrentPositionAsync({
  accuracy: Location.Accuracy.High,
  timeInterval: 10000,
  distanceInterval: 10,
});

const userLocation = {
  latitude: location.coords.latitude,
  longitude: location.coords.longitude,
};
setUserLocation(userLocation);

// Set map region
setMapRegion({
  latitude: userLocation.latitude,
  longitude: userLocation.longitude,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
});
```

**3. Load businesses và hiển thị trên map:**
- **Dòng:** 145-188 (`loadAllBusinesses` function)

```typescript
// Gọi API để lấy danh sách businesses
const response = await businessesApi.getAll({
  page: page,
  limit: 20,
});

// Filter chỉ active businesses
const activeBusinesses = response.data.filter(
  business => business.isActive && !business.isBlocked
);

setBusinesses(activeBusinesses);
```

**4. MapView component:**
- **Dòng:** 410-513

```typescript
<MapView
  ref={mapRef}
  style={styles.map}
  initialRegion={mapRegion || {
    latitude: 10.7769, // Ho Chi Minh City
    longitude: 106.7009,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  }}
  region={mapRegion || undefined}
  onRegionChangeComplete={setMapRegion}
  showsUserLocation={false}
  showsMyLocationButton={false}
  showsCompass={true}
  showsScale={true}
>
  {/* User location marker */}
  {userLocation && (
    <Marker coordinate={userLocation} title="Your Location">
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <View style={styles.userLocationDot} />
      </Animated.View>
    </Marker>
  )}
  
  {/* Business markers */}
  {filteredStores.map((store, index) => {
    const [longitude, latitude] = store.location.coordinates;
    
    return (
      <Marker
        key={store._id}
        coordinate={{ latitude, longitude }}
        title={store.businessName}
        description={store.businessAddress}
        onPress={() => {
          // Select store, scroll carousel to this store
          setSelectedStoreIndex(index);
          carouselRef.current?.scrollToIndex({ index });
        }}
      >
        {/* Custom marker với logo hoặc icon */}
        <View style={styles.markerContainer}>
          {store.businessLogoUrl ? (
            <Image source={{ uri: store.businessLogoUrl }} />
          ) : (
            <Ionicons name="storefront" />
          )}
        </View>
      </Marker>
    );
  })}
</MapView>
```

**5. Distance calculation:**
- **Dòng:** 216-234 (`calculateDistance` function)

```typescript
// Sử dụng Haversine formula để tính khoảng cách
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance; // kilometers
};
```

**6. Store list carousel (phía dưới map):**
- **Dòng:** 520-700 (FlatList carousel)

```typescript
<FlatList
  ref={carouselRef}
  data={filteredStores}
  horizontal
  pagingEnabled
  showsHorizontalScrollIndicator={false}
  renderItem={({ item: store, index }) => (
    <StoreCard 
      store={store}
      distance={calculateDistance(
        userLocation?.latitude || 0,
        userLocation?.longitude || 0,
        store.location.coordinates[1],
        store.location.coordinates[0]
      )}
      onPress={() => {
        // Navigate to store detail
        router.push(`/(protected)/customer/store-detail/${store._id}`);
      }}
    />
  )}
  onMomentumScrollEnd={(e) => {
    // Update selected store index khi scroll
    const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
    setSelectedStoreIndex(index);
    
    // Center map on selected store
    const store = filteredStores[index];
    if (store && mapRef.current) {
      const [longitude, latitude] = store.location.coordinates;
      mapRef.current.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  }}
/>
```

**7. Map controls (zoom in/out, current location):**
- **Dòng:** 516-550

```typescript
<View style={styles.mapControls}>
  {/* Zoom In */}
  <TouchableOpacity onPress={handleZoomIn}>
    <Ionicons name="add" />
  </TouchableOpacity>
  
  {/* Zoom Out */}
  <TouchableOpacity onPress={handleZoomOut}>
    <Ionicons name="remove" />
  </TouchableOpacity>
  
  {/* Get Current Location */}
  <TouchableOpacity onPress={handleGetCurrentLocation}>
    <Ionicons name="locate" />
  </TouchableOpacity>
</View>
```

**8. Store card hiển thị thông tin:**
- Logo, tên, địa chỉ, khoảng cách
- Status (đang mở/đóng)
- Rating nếu có
- Nút "View Details" để navigate

**Summary:**
- ✅ **Library:** `react-native-maps`
- ✅ **Components:** MapView, Marker
- ✅ **Location:** `expo-location` để lấy user location
- ✅ **Distance:** Haversine formula để tính khoảng cách
- ✅ **Markers:** Custom markers với logo hoặc icon
- ✅ **Sync:** Map và carousel sync với nhau (click marker → scroll carousel, scroll carousel → center map)

---

## 📝 TÓM TẮT FILE LOCATIONS

### QR Scanning:
1. **Customer scan để borrow:**
   - `app/(protected)/customer/customer-dashboard.tsx` - Dòng 319-499, 1176-1181

2. **Business unified scanner:**
   - `app/(protected)/business/transaction-processing.tsx` - Dòng 693-920, 3532

3. **Components:**
   - `components/NativeQRScanner.tsx`
   - `app/(protected)/business/qr-scanner.tsx`
   - `app/(protected)/business/voucher-scan.tsx`

### Prevent duplicate borrow:
- `app/(protected)/customer/customer-dashboard.tsx` - Dòng 44, 693, 775, 829, 904

### QR Confirm Borrow vs Return:
- `app/(protected)/business/transaction-processing.tsx` - Dòng 128-129 (mode state), 693-920 (handler)

### Token Storage:
- `src/features/auth/hooks/useAuth.ts` - Dòng 495-506 (save), 153-199 (hydrate), 85-89 (remove)
- `context/AuthProvider.tsx` - Dòng 17-23 (token provider)
- `src/services/api/client.ts` - Dòng 63-87 (interceptor)

### Map & Stores:
- `app/(protected)/customer/stores.tsx` - Toàn bộ file
  - Dòng 24: Import MapView
  - Dòng 76-126: Get location
  - Dòng 145-188: Load businesses
  - Dòng 410-513: MapView component
  - Dòng 216-234: Distance calculation

---

**Tác giả:** Generated for Back2Use Project  
**Ngày:** 2024  
**Version:** 1.0

