import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import {
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

interface ReturnSuccessModalProps {
  visible: boolean;
  co2Amount: string; // e.g., "0.34 kg"
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ReturnSuccessModal({
  visible,
  co2Amount,
  onClose,
}: ReturnSuccessModalProps) {
  // Animation values
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;
  const cardScale = React.useRef(new Animated.Value(0)).current;
  const cardTranslateY = React.useRef(new Animated.Value(50)).current;
  const iconScale = React.useRef(new Animated.Value(0)).current;
  const iconRotation = React.useRef(new Animated.Value(0)).current;
  const co2Scale = React.useRef(new Animated.Value(0)).current;
  const buttonScale = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset all animations
      overlayOpacity.setValue(0);
      cardScale.setValue(0);
      cardTranslateY.setValue(50);
      iconScale.setValue(0);
      iconRotation.setValue(0);
      co2Scale.setValue(0);
      buttonScale.setValue(0);

      // Start entrance animations with sequence
      Animated.parallel([
        // Overlay fade in
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Card pop-up animation (zoom in + slide up)
        Animated.parallel([
          Animated.spring(cardScale, {
            toValue: 1,
            damping: 15,
            stiffness: 150,
            mass: 1,
            useNativeDriver: true,
          }),
          Animated.spring(cardTranslateY, {
            toValue: 0,
            damping: 15,
            stiffness: 150,
            mass: 1,
            useNativeDriver: true,
          }),
        ]),
        // Icon animation (delayed, with bounce)
        Animated.sequence([
          Animated.delay(200),
          Animated.parallel([
            Animated.sequence([
              Animated.spring(iconScale, {
                toValue: 1.2,
                damping: 8,
                stiffness: 200,
                useNativeDriver: true,
              }),
              Animated.spring(iconScale, {
                toValue: 1,
                damping: 10,
                stiffness: 150,
                useNativeDriver: true,
              }),
            ]),
            Animated.spring(iconRotation, {
              toValue: 360,
              damping: 12,
              stiffness: 100,
              useNativeDriver: true,
            }),
          ]),
        ]),
        // CO2 container animation (delayed)
        Animated.sequence([
          Animated.delay(400),
          Animated.spring(co2Scale, {
            toValue: 1,
            damping: 12,
            stiffness: 150,
            useNativeDriver: true,
          }),
        ]),
        // Button animation (delayed)
        Animated.sequence([
          Animated.delay(600),
          Animated.spring(buttonScale, {
            toValue: 1,
            damping: 10,
            stiffness: 150,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      // Exit animations
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateY, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    // Exit animations
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // Icon rotation interpolation
  const iconRotationInterpolate = iconRotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: overlayOpacity,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [
                { scale: cardScale },
                { translateY: cardTranslateY },
              ],
            },
          ]}
        >
          {/* Achievement Badge Icon - Large, Floating */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [
                  { scale: iconScale },
                  { rotate: iconRotationInterpolate },
                ],
              },
            ]}
          >
            <View style={styles.iconBackground}>
              {/* Checkmark Circle */}
              <Ionicons name="checkmark-circle" size={90} color="#FFFFFF" />
            </View>
            {/* Leaf Decoration - Overlapping */}
            <View style={styles.leafDecoration}>
              <Ionicons name="leaf" size={32} color="#4CAF50" />
            </View>
          </Animated.View>

          {/* Title */}
          <Text style={styles.title}>Return Successful!</Text>

          {/* Hero Section - CO2 Display */}
          <Animated.View
            style={[
              styles.co2Container,
              {
                transform: [{ scale: co2Scale }],
                opacity: co2Scale,
              },
            ]}
          >
            <Text style={styles.co2Amount}>{co2Amount}</Text>
            <Text style={styles.co2Label}>CO₂ SAVED</Text>
          </Animated.View>

          {/* Subtitle */}
          <Text style={styles.message}>
            You have helped reduce waste. Keep it up! 🌱
          </Text>

          {/* Action Button - Full Width, Pill Shape */}
          <Animated.View
            style={{
              transform: [{ scale: buttonScale }],
              opacity: buttonScale,
              width: '100%',
            }}
          >
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleClose}
              activeOpacity={0.9}
            >
              <Text style={styles.actionButtonText}>Awesome! ✨</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 32,
    width: screenWidth * 0.9,
    maxWidth: 420,
    alignItems: 'center',
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    // Android Shadow
    elevation: 10,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 20,
    marginTop: -20, // Partially floating out of card
  },
  iconBackground: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    // iOS Shadow
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    // Android Shadow
    elevation: 8,
  },
  leafDecoration: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 10,
    borderWidth: 2.5,
    borderColor: '#4CAF50',
    // iOS Shadow
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    // Android Shadow
    elevation: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#374151',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  co2Container: {
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    padding: 28,
    marginBottom: 24,
    borderWidth: 3,
    borderColor: '#4CAF50',
    width: '100%',
    alignItems: 'center',
    // iOS Shadow
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    // Android Shadow
    elevation: 3,
  },
  co2Amount: {
    fontSize: 56,
    fontWeight: '900',
    color: '#4CAF50',
    marginBottom: 8,
    letterSpacing: -2,
    lineHeight: 64,
  },
  co2Label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    fontWeight: '500',
    paddingHorizontal: 8,
  },
  actionButton: {
    backgroundColor: '#00C853',
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 50, // Fully rounded pill shape
    alignItems: 'center',
    justifyContent: 'center',
    // iOS Shadow
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    // Android Shadow
    elevation: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
