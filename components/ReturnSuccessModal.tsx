import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import {
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
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
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const checkmarkScale = React.useRef(new Animated.Value(0)).current;
  const confettiAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      checkmarkScale.setValue(0);
      confettiAnim.setValue(0);

      // Start animations
      Animated.parallel([
        // Modal entrance
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Checkmark animation (delayed)
        Animated.sequence([
          Animated.delay(200),
          Animated.spring(checkmarkScale, {
            toValue: 1,
            tension: 100,
            friction: 5,
            useNativeDriver: true,
          }),
        ]),
        // Confetti animation
        Animated.sequence([
          Animated.delay(400),
          Animated.timing(confettiAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // Confetti particles
  const confettiColors = ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'];
  const confettiParticles = Array.from({ length: 20 }, (_, i) => {
    const angle = (i * 360) / 20;
    const radius = 150;
    const x = Math.cos((angle * Math.PI) / 180) * radius;
    const y = Math.sin((angle * Math.PI) / 180) * radius;

    return (
      <Animated.View
        key={i}
        style={[
          styles.confettiParticle,
          {
            backgroundColor: confettiColors[i % confettiColors.length],
            left: screenWidth / 2 + x,
            top: screenHeight / 2 - 100 + y,
            transform: [
              {
                scale: confettiAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 1.2, 0],
                }),
              },
              {
                rotate: confettiAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', `${360 + angle}deg`],
                }),
              },
            ],
            opacity: confettiAnim.interpolate({
              inputRange: [0, 0.3, 0.7, 1],
              outputRange: [0, 1, 1, 0],
            }),
          },
        ]}
      />
    );
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: opacityAnim,
          },
        ]}
      >
        {/* Confetti particles */}
        {confettiParticles}

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Achievement Badge Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <Animated.View
                style={[
                  styles.checkmarkContainer,
                  {
                    transform: [{ scale: checkmarkScale }],
                  },
                ]}
              >
                <Ionicons name="checkmark-circle" size={80} color="#FFFFFF" />
              </Animated.View>
            </View>
            {/* Leaf decoration */}
            <View style={styles.leafDecoration}>
              <Ionicons name="leaf" size={40} color="#10B981" />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Return Successful!</Text>

          {/* CO2 Amount - Prominent Display */}
          <View style={styles.co2Container}>
            <Text style={styles.co2Amount}>{co2Amount}</Text>
            <Text style={styles.co2Label}>CO₂ Saved</Text>
          </View>

          {/* Message */}
          <Text style={styles.message}>
            You have helped reduce waste. Keep it up! 🌱
          </Text>

          {/* Action Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>Awesome!</Text>
            <Ionicons name="sparkles" size={20} color="#FFFFFF" />
          </TouchableOpacity>
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
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 32,
    width: screenWidth * 0.85,
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 10,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  iconBackground: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  checkmarkContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  leafDecoration: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
  },
  co2Container: {
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#10B981',
    width: '100%',
    alignItems: 'center',
  },
  co2Amount: {
    fontSize: 48,
    fontWeight: '900',
    color: '#10B981',
    marginBottom: 8,
    letterSpacing: -1,
  },
  co2Label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 8,
    width: '100%',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  confettiParticle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});

