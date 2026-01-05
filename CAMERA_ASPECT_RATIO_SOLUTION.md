# GIẢI PHÁP XỬ LÝ ASPECT RATIO CHO CAMERAVIEW TRÊN ANDROID

## 🎯 VẤN ĐỀ

Trên một số thiết bị Android, khi sử dụng Expo Camera với `CameraView`, tỷ lệ khung hình (aspect ratio) của camera bị méo hoặc không đúng. Điều này xảy ra vì:

1. **Các thiết bị Android có nhiều tỷ lệ màn hình khác nhau**: 16:9, 18:9, 19.5:9, 20:9, etc.
2. **Camera sensor có aspect ratio riêng**: Thường là 4:3 hoặc 16:9
3. **`StyleSheet.absoluteFillObject` không tính toán aspect ratio**: Nó chỉ fill toàn bộ container mà không giữ nguyên tỷ lệ camera

---

## ✅ GIẢI PHÁP 1: SỬ DỤNG FLEXBOX VỚI `resizeMode` PROP

### Cách implement:

```typescript
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Dimensions, StyleSheet, View } from 'react-native';

const { width, height } = Dimensions.get('window');

// Tính toán aspect ratio
const CAMERA_ASPECT_RATIO = 4 / 3; // Hoặc 16/9 tùy camera
const cameraHeight = width / CAMERA_ASPECT_RATIO;

<View style={styles.cameraContainer}>
  <CameraView 
    style={{
      width: width,
      height: cameraHeight,
      // Hoặc sử dụng aspectRatio style property
      aspectRatio: CAMERA_ASPECT_RATIO,
    }}
    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
    onBarcodeScanned={onBarcodeScanned}
    enableTorch={flashEnabled}
    // Quan trọng: resizeMode để handle aspect ratio
    resizeMode="cover" // hoặc "contain"
  />
</View>

const styles = StyleSheet.create({
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
});
```

**Ưu điểm:**
- Đơn giản, dễ implement
- Hoạt động tốt trên hầu hết thiết bị
- `resizeMode="cover"` đảm bảo fill container, crop nếu cần
- `resizeMode="contain"` đảm bảo hiển thị đầy đủ, có thể có letterboxing

**Nhược điểm:**
- Có thể có black bars nếu aspect ratio không khớp

---

## ✅ GIẢI PHÁP 2: SỬ DỤNG `useCameraDevice` VÀ TÍNH TOÁN CHÍNH XÁC

### Cách implement (cho Expo Camera SDK 50+):

```typescript
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import { useEffect, useState } from 'react';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export function QRScannerWithAspectRatio() {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraDimensions, setCameraDimensions] = useState({ width: screenWidth, height: screenHeight });

  useEffect(() => {
    // Tính toán dimensions dựa trên camera aspect ratio
    // Camera thường có aspect ratio 4:3 hoặc 16:9
    const calculateCameraDimensions = () => {
      // Mặc định camera aspect ratio là 4:3
      const cameraAspectRatio = 4 / 3;
      
      // Tính chiều cao dựa trên width và aspect ratio
      let cameraHeight = screenWidth / cameraAspectRatio;
      
      // Nếu chiều cao vượt quá màn hình, điều chỉnh lại
      if (cameraHeight > screenHeight) {
        cameraHeight = screenHeight;
        const adjustedWidth = cameraHeight * cameraAspectRatio;
        setCameraDimensions({
          width: adjustedWidth,
          height: cameraHeight,
        });
      } else {
        setCameraDimensions({
          width: screenWidth,
          height: cameraHeight,
        });
      }
    };

    calculateCameraDimensions();
  }, []);

  return (
    <View style={styles.container}>
      <CameraView
        style={{
          width: cameraDimensions.width,
          height: cameraDimensions.height,
        }}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={onBarcodeScanned}
        enableTorch={flashEnabled}
      />
      
      {/* Overlay để cover phần còn lại nếu có */}
      <View style={[StyleSheet.absoluteFill, styles.overlay]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  overlay: {
    backgroundColor: 'black',
    zIndex: -1,
  },
});
```

---

## ✅ GIẢI PHÁP 3: SỬ DỤNG ABSOLUTE POSITIONING VỚI CALCULATED DIMENSIONS (RECOMMENDED)

### Cách implement (dựa trên code hiện tại của bạn):

**File:** `app/(protected)/customer/customer-dashboard.tsx` hoặc `app/(protected)/business/transaction-processing.tsx`

```typescript
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Dimensions, StyleSheet, View, Platform } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Tính toán camera dimensions để giữ aspect ratio
const CAMERA_ASPECT_RATIO = 4 / 3; // Hoặc 16/9

// Tính chiều cao camera dựa trên width
const cameraHeight = screenWidth / CAMERA_ASPECT_RATIO;

// Nếu camera height > screen height, điều chỉnh
const finalCameraHeight = cameraHeight > screenHeight ? screenHeight : cameraHeight;
const finalCameraWidth = finalCameraHeight * CAMERA_ASPECT_RATIO;

// Center position
const cameraLeft = (screenWidth - finalCameraWidth) / 2;
const cameraTop = (screenHeight - finalCameraHeight) / 2;

// Trong component:
<View style={styles.qrScannerContainer}>
  <StatusBar hidden />
  
  {/* Camera với aspect ratio được tính toán */}
  <CameraView 
    style={{
      position: 'absolute',
      left: cameraLeft,
      top: cameraTop,
      width: finalCameraWidth,
      height: finalCameraHeight,
    }}
    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
    onBarcodeScanned={onBarcodeScanned}
    enableTorch={flashEnabled}
  />
  
  {/* Hoặc sử dụng flexbox approach */}
  <View style={styles.cameraWrapper}>
    <CameraView 
      style={styles.cameraView}
      barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      onBarcodeScanned={onBarcodeScanned}
      enableTorch={flashEnabled}
    />
  </View>
  
  {/* Overlay mask - giữ nguyên */}
  <View style={styles.overlayMask}>
    {/* ... overlay code ... */}
  </View>
</View>

const styles = StyleSheet.create({
  qrScannerContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  cameraWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraView: {
    width: finalCameraWidth,
    height: finalCameraHeight,
    // Hoặc sử dụng aspectRatio property
    aspectRatio: CAMERA_ASPECT_RATIO,
  },
  overlayMask: {
    ...StyleSheet.absoluteFillObject,
    // ... overlay styles
  },
});
```

---

## ✅ GIẢI PHÁP 4: SỬ DỤNG HOOK ĐỂ TÍNH TOÁN DYNAMIC (BEST PRACTICE)

### Tạo custom hook:

**File:** `hooks/useCameraAspectRatio.ts`

```typescript
import { useEffect, useState } from 'react';
import { Dimensions, Platform } from 'react-native';

interface CameraDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

const DEFAULT_CAMERA_ASPECT_RATIO = 4 / 3; // 4:3 là phổ biến nhất

export function useCameraAspectRatio(
  preferredAspectRatio: number = DEFAULT_CAMERA_ASPECT_RATIO
): CameraDimensions {
  const [dimensions, setDimensions] = useState<CameraDimensions>(() => {
    const { width, height } = Dimensions.get('window');
    return calculateCameraDimensions(width, height, preferredAspectRatio);
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(calculateCameraDimensions(
        window.width,
        window.height,
        preferredAspectRatio
      ));
    });

    return () => subscription?.remove();
  }, [preferredAspectRatio]);

  return dimensions;
}

function calculateCameraDimensions(
  screenWidth: number,
  screenHeight: number,
  aspectRatio: number
): CameraDimensions {
  // Tính toán để camera fill màn hình nhưng giữ aspect ratio
  let cameraWidth = screenWidth;
  let cameraHeight = screenWidth / aspectRatio;

  // Nếu chiều cao vượt quá màn hình, scale down
  if (cameraHeight > screenHeight) {
    cameraHeight = screenHeight;
    cameraWidth = cameraHeight * aspectRatio;
  }

  return {
    width: cameraWidth,
    height: cameraHeight,
    aspectRatio,
  };
}
```

### Sử dụng hook:

```typescript
import { useCameraAspectRatio } from '../../../hooks/useCameraAspectRatio';

export default function QRScannerScreen() {
  const cameraDimensions = useCameraAspectRatio(4 / 3); // 4:3 ratio
  
  return (
    <View style={styles.container}>
      <CameraView
        style={{
          width: cameraDimensions.width,
          height: cameraDimensions.height,
          alignSelf: 'center', // Center horizontally
          marginTop: (Dimensions.get('window').height - cameraDimensions.height) / 2,
        }}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={onBarcodeScanned}
        enableTorch={flashEnabled}
      />
    </View>
  );
}
```

---

## ✅ GIẢI PHÁP 5: FIX CHO CODE HIỆN TẠI CỦA BẠN

### Sửa trong `customer-dashboard.tsx`:

**Trước (có thể bị méo):**
```typescript
<CameraView 
  style={StyleSheet.absoluteFillObject} 
  barcodeScannerSettings={{ barcodeTypes: ["qr"] }} 
  onBarcodeScanned={onBarcode}
  enableTorch={flashEnabled}
/>
```

**Sau (fix aspect ratio):**
```typescript
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CAMERA_ASPECT_RATIO = 4 / 3;
const cameraWidth = screenWidth;
const cameraHeight = screenWidth / CAMERA_ASPECT_RATIO;
const cameraTop = (screenHeight - cameraHeight) / 2;

<View style={styles.qrScannerContainer}>
  <StatusBar hidden />
  
  {/* Background để cover toàn bộ màn hình */}
  <View style={StyleSheet.absoluteFillObject} style={{ backgroundColor: 'black' }} />
  
  {/* Camera với aspect ratio được tính toán */}
  <CameraView 
    style={{
      position: 'absolute',
      left: 0,
      top: cameraTop,
      width: cameraWidth,
      height: cameraHeight,
    }}
    barcodeScannerSettings={{ barcodeTypes: ["qr"] }} 
    onBarcodeScanned={onBarcode}
    enableTorch={flashEnabled}
  />
  
  {/* Các overlay khác giữ nguyên */}
  {/* ... */}
</View>
```

---

## 🔍 GIẢI PHÁP 6: SỬ DỤNG `facing` PROP VÀ XỬ LÝ ORIENTATION

Một số thiết bị Android có vấn đề với camera khi xoay màn hình:

```typescript
import { useCameraDevice } from 'expo-camera';

// Detect camera orientation
const getCameraAspectRatio = (facing: 'front' | 'back' = 'back') => {
  // Front camera thường là 4:3
  // Back camera có thể là 4:3 hoặc 16:9
  return facing === 'front' ? 4 / 3 : 16 / 9;
};

<CameraView
  style={calculatedStyle}
  facing="back"
  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
  onBarcodeScanned={onBarcodeScanned}
  enableTorch={flashEnabled}
/>
```

---

## 📱 GIẢI PHÁP 7: XỬ LÝ CHO TỪNG PLATFORM RIÊNG BIỆT

Một số thiết bị Android cần xử lý đặc biệt:

```typescript
import { Platform, Dimensions } from 'react-native';

const getCameraStyle = () => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = 4 / 3;
  
  if (Platform.OS === 'android') {
    // Android: Tính toán chính xác hơn
    const cameraHeight = width / aspectRatio;
    
    // Một số thiết bị Android cần offset
    const isAndroidSpecialCase = width / height < 0.5; // Rất dài
    
    return {
      width: width,
      height: cameraHeight,
      alignSelf: 'center',
      marginTop: isAndroidSpecialCase ? 0 : (height - cameraHeight) / 2,
    };
  } else {
    // iOS: Thường không có vấn đề
    return StyleSheet.absoluteFillObject;
  }
};

<CameraView
  style={getCameraStyle()}
  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
  onBarcodeScanned={onBarcodeScanned}
  enableTorch={flashEnabled}
/>
```

---

## 🎯 GIẢI PHÁP ĐỀ XUẤT CHO CODE CỦA BẠN

Dựa trên code hiện tại, tôi đề xuất sử dụng **Giải pháp 3 + 4** (hook + calculated dimensions):

### Bước 1: Tạo custom hook
**File:** `hooks/useCameraAspectRatio.ts` (code như trên)

### Bước 2: Update CameraView trong các screen
**File:** `app/(protected)/customer/customer-dashboard.tsx`:

```typescript
import { useCameraAspectRatio } from '../../../hooks/useCameraAspectRatio';

// Trong component:
const cameraDimensions = useCameraAspectRatio(4 / 3);
const screenDimensions = Dimensions.get('window');

<View style={styles.qrScannerContainer}>
  <StatusBar hidden />
  
  {/* Black background */}
  <View style={StyleSheet.absoluteFillObject} style={{ backgroundColor: '#000' }} />
  
  {/* Camera với aspect ratio */}
  <CameraView 
    style={{
      width: cameraDimensions.width,
      height: cameraDimensions.height,
      position: 'absolute',
      left: (screenDimensions.width - cameraDimensions.width) / 2,
      top: (screenDimensions.height - cameraDimensions.height) / 2,
    }}
    barcodeScannerSettings={{ barcodeTypes: ["qr"] }} 
    onBarcodeScanned={onBarcode}
    enableTorch={flashEnabled}
  />
  
  {/* Các overlay giữ nguyên */}
  {/* ... */}
</View>
```

---

## 📋 CHECKLIST IMPLEMENTATION

- [ ] Tạo hook `useCameraAspectRatio`
- [ ] Update `customer-dashboard.tsx` QR scanner
- [ ] Update `transaction-processing.tsx` QR scanner  
- [ ] Update `qr-scanner.tsx` nếu có
- [ ] Update `voucher-scan.tsx` nếu có
- [ ] Update `NativeQRScanner.tsx` component
- [ ] Test trên nhiều thiết bị Android khác nhau
- [ ] Test với các orientation khác nhau (nếu hỗ trợ)
- [ ] Test với front/back camera (nếu có)

---

## 🔍 DEBUGGING TIPS

1. **Log dimensions để debug:**
```typescript
console.log('Screen:', screenWidth, 'x', screenHeight);
console.log('Camera:', cameraDimensions.width, 'x', cameraDimensions.height);
console.log('Aspect Ratio:', cameraDimensions.aspectRatio);
```

2. **Test trên các thiết bị:**
- Samsung Galaxy (nhiều tỷ lệ khác nhau)
- Xiaomi/Redmi
- OnePlus
- Google Pixel

3. **Kiểm tra camera aspect ratio:**
- Một số camera là 4:3
- Một số camera là 16:9
- Có thể detect từ `useCameraDevice` hoặc thử nghiệm

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **Không sử dụng `StyleSheet.absoluteFillObject` trực tiếp** cho CameraView nếu muốn giữ aspect ratio
2. **Tính toán dimensions dựa trên screen width**, không phải height
3. **Center camera** nếu cần thiết với marginTop/marginLeft
4. **Test trên nhiều thiết bị** vì mỗi thiết bị có thể cần điều chỉnh khác nhau
5. **Xem xét orientation** nếu app hỗ trợ xoay màn hình

---

## 📚 TÀI LIỆU THAM KHẢO

- Expo Camera Documentation: https://docs.expo.dev/versions/latest/sdk/camera/
- React Native Dimensions API: https://reactnative.dev/docs/dimensions
- Android Camera Aspect Ratio Issues: https://github.com/expo/expo/issues/...

---

**Tác giả:** Generated for Back2Use Project  
**Ngày:** 2024  
**Version:** 1.0


