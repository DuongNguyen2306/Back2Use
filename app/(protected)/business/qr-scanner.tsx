import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    Vibration,
    View
} from 'react-native';
import { useAuth } from '../../../context/AuthProvider';
import { borrowTransactionsApi } from '../../../src/services/api/borrowTransactionService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const FRAME_SIZE = screenWidth * 0.7;

type ScannerMode = 'borrow' | 'return';

export default function QRScannerScreen() {
  const auth = useAuth();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scannerMode, setScannerMode] = useState<ScannerMode>('borrow');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [laserLinePosition, setLaserLinePosition] = useState(0);
  const [showScanner, setShowScanner] = useState(true);
  const scanLock = useRef(false);
  const laserAnimationRef = useRef<any>(null);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  // Laser scanning line animation
  useEffect(() => {
    if (showScanner && hasCameraPermission) {
      let direction = 1;
      let position = 10;
      
      laserAnimationRef.current = setInterval(() => {
        position += direction * 3;
        if (position >= FRAME_SIZE - 10 || position <= 10) {
          direction *= -1;
        }
        setLaserLinePosition(position);
      }, 16);
      
      return () => {
        if (laserAnimationRef.current) {
          clearInterval(laserAnimationRef.current);
          laserAnimationRef.current = null;
        }
        setLaserLinePosition(0);
      };
    } else {
      setLaserLinePosition(0);
    }
  }, [showScanner, hasCameraPermission]);

  const requestCameraPermission = async () => {
    const { Camera } = await import('expo-camera');
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasCameraPermission(status === 'granted');
  };

  const handleBarcodeScanned = async (e: any) => {
    if (scanLock.current) return;
    scanLock.current = true;
    
    const scannedData = e?.data ?? '';
    console.log('📱 QR Code scanned:', scannedData, 'Mode:', scannerMode);
    
    if (!scannedData || scannedData.trim() === '') {
      Alert.alert('Error', 'Invalid QR code');
      scanLock.current = false;
      return;
    }
    
    Vibration.vibrate(Platform.OS === 'ios' ? 30 : 50);
    
    try {
      if (scannerMode === 'borrow') {
        // Handle borrow confirmation
        const serialNumber = scannedData.replace(/^back2use:\/\/item\//, '').trim();
        
        // Search for pending borrow transaction
        const apiResponse = await borrowTransactionsApi.getBusinessHistory({
          page: 1,
          limit: 1000,
        });
        const apiTransactions = apiResponse.data?.items || (Array.isArray(apiResponse.data) ? apiResponse.data : []);
        
        const foundTransaction = apiTransactions.find((t: any) => 
          t.productId?.serialNumber === serialNumber &&
          t.borrowTransactionType === 'borrow' &&
          (t.status === 'pending' || t.status === 'waiting' || t.status === 'pending_pickup')
        );
        
        if (foundTransaction) {
          Alert.alert(
            'Borrow Request Found',
            `Transaction ID: ${foundTransaction._id}\n\nConfirm this borrow request?`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => { scanLock.current = false; } },
              {
                text: 'Confirm',
                onPress: async () => {
                  try {
                    await borrowTransactionsApi.confirmBorrow(foundTransaction._id);
                    Alert.alert('Success', 'Borrow transaction confirmed!');
                    router.back();
                  } catch (error: any) {
                    Alert.alert('Error', error.message || 'Failed to confirm borrow');
                  } finally {
                    scanLock.current = false;
                  }
                }
              }
            ]
          );
        } else {
          Alert.alert('No Borrow Request', 'This product does not have a borrow request');
          scanLock.current = false;
        }
      } else {
        // Handle return processing
        const serialNumber = scannedData.replace(/^back2use:\/\/item\//, '').trim();
        Alert.alert('Return Processing', `Serial: ${serialNumber}\n\nRedirecting to return processing...`);
        router.push('/(protected)/business/transaction-processing');
        scanLock.current = false;
      }
    } catch (error: any) {
      console.error('Error processing QR scan:', error);
      Alert.alert('Error', error.message || 'Failed to process QR code');
      scanLock.current = false;
    }
  };

  const closeScanner = () => {
    setShowScanner(false);
    setFlashEnabled(false);
    if (laserAnimationRef.current) {
      clearInterval(laserAnimationRef.current);
      laserAnimationRef.current = null;
    }
    router.back();
  };

  if (hasCameraPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasCameraPermission === false) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Camera permission denied</Text>
        <TouchableOpacity style={styles.button} onPress={requestCameraPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const frameColor = scannerMode === 'borrow' ? '#00FF88' : '#F97316';
  const frameBorderColor = scannerMode === 'borrow' ? '#00FF88' : '#F97316';

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      {showScanner && (
        <View style={styles.scannerContainer}>
          {/* Full Screen Camera */}
          <CameraView 
            style={StyleSheet.absoluteFillObject} 
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }} 
            onBarcodeScanned={handleBarcodeScanned}
            enableTorch={flashEnabled}
          />
          
          {/* Overlay Mask - Dark Semi-transparent */}
          <View style={styles.overlayMask}>
            <View style={styles.overlayTop} />
            <View style={styles.overlayBottom} />
            <View style={styles.overlayLeft} />
            <View style={styles.overlayRight} />
          </View>

          {/* Branding - Top */}
          <View style={styles.brandingContainer}>
            <Text style={styles.brandingText}>Powered by Back2Use</Text>
          </View>

          {/* Close Button - Top Right */}
          <TouchableOpacity 
            style={styles.closeButtonTop} 
            onPress={closeScanner}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Scanning Frame with Dynamic Color */}
          <View style={styles.scanningFrameContainer}>
            <View style={[styles.scanningFrame, { borderColor: frameBorderColor }]}>
              {/* Top Left Corner */}
              <View style={[styles.cornerBracket, styles.topLeftCorner, { borderColor: frameColor }]}>
                <View style={[styles.cornerBracketHorizontal, { backgroundColor: frameColor }]} />
                <View style={[styles.cornerBracketVertical, { backgroundColor: frameColor }]} />
              </View>
              {/* Top Right Corner */}
              <View style={[styles.cornerBracket, styles.topRightCorner, { borderColor: frameColor }]}>
                <View style={[styles.cornerBracketHorizontal, { backgroundColor: frameColor }]} />
                <View style={[styles.cornerBracketVertical, { backgroundColor: frameColor }]} />
              </View>
              {/* Bottom Left Corner */}
              <View style={[styles.cornerBracket, styles.bottomLeftCorner, { borderColor: frameColor }]}>
                <View style={[styles.cornerBracketHorizontal, { backgroundColor: frameColor }]} />
                <View style={[styles.cornerBracketVertical, { backgroundColor: frameColor }]} />
              </View>
              {/* Bottom Right Corner */}
              <View style={[styles.cornerBracket, styles.bottomRightCorner, { borderColor: frameColor }]}>
                <View style={[styles.cornerBracketHorizontal, { backgroundColor: frameColor }]} />
                <View style={[styles.cornerBracketVertical, { backgroundColor: frameColor }]} />
              </View>
              
              {/* Laser Scanning Line */}
              <View 
                style={[
                  styles.laserLine,
                  { 
                    top: laserLinePosition,
                    backgroundColor: scannerMode === 'borrow' 
                      ? 'rgba(0, 255, 136, 0.8)' 
                      : 'rgba(249, 115, 22, 0.8)'
                  }
                ]}
              />
            </View>
          </View>

          {/* Instructions Text */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              Align the QR code within the frame to scan
            </Text>
          </View>

          {/* Mode Switcher - Segmented Control */}
          <View style={styles.modeSwitcherContainer}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                scannerMode === 'borrow' && styles.modeButtonActive,
                scannerMode === 'borrow' && { backgroundColor: '#00FF88' }
              ]}
              onPress={() => setScannerMode('borrow')}
              activeOpacity={0.8}
            >
              <Ionicons 
                name="arrow-down-circle" 
                size={20} 
                color={scannerMode === 'borrow' ? '#FFFFFF' : '#9CA3AF'} 
              />
              <Text style={[
                styles.modeButtonText,
                scannerMode === 'borrow' && styles.modeButtonTextActive
              ]}>
                Borrow
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.modeButton,
                scannerMode === 'return' && styles.modeButtonActive,
                scannerMode === 'return' && { backgroundColor: '#F97316' }
              ]}
              onPress={() => setScannerMode('return')}
              activeOpacity={0.8}
            >
              <Ionicons 
                name="arrow-up-circle" 
                size={20} 
                color={scannerMode === 'return' ? '#FFFFFF' : '#9CA3AF'} 
              />
              <Text style={[
                styles.modeButtonText,
                scannerMode === 'return' && styles.modeButtonTextActive
              ]}>
                Return
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Controls */}
          <View style={styles.floatingControls}>
            {/* My QR Button */}
            <TouchableOpacity 
              style={styles.floatingButton}
              onPress={() => {
                Alert.alert('My QR', 'Feature coming soon');
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="qr-code-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Flash/Torch Button - Center (Large) */}
            <TouchableOpacity 
              style={[styles.floatingButton, styles.flashButton]}
              onPress={() => setFlashEnabled(!flashEnabled)}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={flashEnabled ? "flash" : "flash-outline"} 
                size={28} 
                color={flashEnabled ? "#FCD34D" : "#FFFFFF"} 
              />
            </TouchableOpacity>

            {/* Upload Image Button */}
            <TouchableOpacity 
              style={styles.floatingButton}
              onPress={() => {
                Alert.alert('Upload Image', 'Feature coming soon');
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="image-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#00704A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  overlayMask: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  overlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: (screenHeight - FRAME_SIZE) / 2,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: (screenHeight - FRAME_SIZE) / 2,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  overlayLeft: {
    position: 'absolute',
    top: (screenHeight - FRAME_SIZE) / 2,
    bottom: (screenHeight - FRAME_SIZE) / 2,
    left: 0,
    width: (screenWidth - FRAME_SIZE) / 2,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  overlayRight: {
    position: 'absolute',
    top: (screenHeight - FRAME_SIZE) / 2,
    bottom: (screenHeight - FRAME_SIZE) / 2,
    right: 0,
    width: (screenWidth - FRAME_SIZE) / 2,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  brandingContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  brandingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
  },
  closeButtonTop: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  scanningFrameContainer: {
    position: 'absolute',
    top: (screenHeight - FRAME_SIZE) / 2,
    left: (screenWidth - FRAME_SIZE) / 2,
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderWidth: 3,
    borderRadius: 20,
    position: 'relative',
  },
  cornerBracket: {
    position: 'absolute',
    width: 30,
    height: 30,
  },
  topLeftCorner: {
    top: -3,
    left: -3,
  },
  topRightCorner: {
    top: -3,
    right: -3,
  },
  bottomLeftCorner: {
    bottom: -3,
    left: -3,
  },
  bottomRightCorner: {
    bottom: -3,
    right: -3,
  },
  cornerBracketHorizontal: {
    position: 'absolute',
    width: 20,
    height: 4,
    top: 0,
    left: 0,
  },
  cornerBracketVertical: {
    position: 'absolute',
    width: 4,
    height: 20,
    top: 0,
    left: 0,
  },
  laserLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 2,
    borderRadius: 1,
  },
  instructionsContainer: {
    position: 'absolute',
    top: (screenHeight - FRAME_SIZE) / 2 + FRAME_SIZE + 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  instructionsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  // Mode Switcher
  modeSwitcherContainer: {
    position: 'absolute',
    bottom: 140,
    left: 20,
    right: 20,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 25,
    padding: 4,
    zIndex: 10,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
  },
  modeButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modeButtonText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Bottom Controls
  floatingControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    zIndex: 10,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  flashButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
});
