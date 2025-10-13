import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface QualityCheckResult {
  overallScore: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  timeToStore?: number;
  qualityIssues?: string[];
  estimatedLifespan?: string;
  timeSavingAdvice?: {
    message: string;
    nearbyStores?: Array<{ name: string; distance: string }>;
  };
}

interface AIQualityCheckerProps {
  item: any;
  onComplete: (result: QualityCheckResult) => void;
  onSkip?: () => void;
  standalone?: boolean;
}

export function AIQualityChecker({ item, onComplete, onSkip, standalone = false }: AIQualityCheckerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<QualityCheckResult | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showImagePicker, setShowImagePicker] = useState(true);

  const pickImage = async () => {
    if (selectedImages.length >= 6) {
      Alert.alert('Maximum reached', 'You can only upload 6 images');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImages(prev => [...prev, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const startAnalysis = () => {
    if (selectedImages.length === 0) {
      Alert.alert('No images', 'Please upload at least one image to start analysis');
      return;
    }
    
    setShowImagePicker(false);
    setIsAnalyzing(true);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Simulate AI analysis delay
    setTimeout(() => {
      const score = Math.floor(Math.random() * 30) + 70; // 70-100 score
      const condition = score >= 90 ? 'excellent' : score >= 80 ? 'good' : score >= 70 ? 'fair' : 'poor';

      const mockResult: QualityCheckResult = {
        overallScore: score,
        condition,
        recommendations: [
          {
            title: 'Quality Assessment',
            description: 'This container is in excellent condition for food storage',
            priority: 'high',
          },
          {
            title: 'Usage Recommendation',
            description: 'Perfect for takeout meals and leftovers',
            priority: 'medium',
          },
          {
            title: 'Time Efficiency',
            description: `Estimated to save ${Math.floor(Math.random() * 20) + 5} minutes compared to store visit`,
            priority: 'low',
          },
        ],
        timeToStore: Math.floor(Math.random() * 20) + 5, // 5-25 minutes
        estimatedLifespan: '2-3 uses remaining',
        timeSavingAdvice: {
          message: 'Using this container will save you time and reduce environmental impact!',
        },
      };

      // Add quality issues for lower scores
      if (mockResult.overallScore < 80) {
        mockResult.qualityIssues = ['Minor scratches detected on surface', 'Slight wear on lid seal'];
        mockResult.recommendations.unshift({
          title: 'Quality Note',
          description: 'Minor wear detected but still safe for use',
          priority: 'medium',
        });
      }

      setResult(mockResult);
      setIsAnalyzing(false);
    }, 2500);
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent':
        return '#10B981';
      case 'good':
        return '#3B82F6';
      case 'fair':
        return '#F59E0B';
      case 'poor':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  if (showImagePicker) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.imagePickerContainer}>
          <Text style={styles.imagePickerTitle}>Upload Container Images</Text>
          <Text style={styles.imagePickerSubtitle}>
            Upload up to 6 images of your container for AI quality analysis
          </Text>

          <View style={styles.imageGrid}>
            {selectedImages.map((uri, index) => (
              <View key={index} style={styles.imageItem}>
                <Image source={{ uri }} style={styles.selectedImage} />
                <TouchableOpacity 
                  style={styles.removeImageButton} 
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            
            {selectedImages.length < 6 && (
              <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                <Ionicons name="camera" size={24} color="#00704A" />
                <Text style={styles.addImageText}>Add Image</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.imagePickerActions}>
            {onSkip && (
              <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                <Text style={styles.skipButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.startAnalysisButton, selectedImages.length === 0 && styles.disabledButton]} 
              onPress={startAnalysis}
              disabled={selectedImages.length === 0}
            >
              <Text style={styles.startAnalysisText}>
                Start AI Analysis ({selectedImages.length}/6)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  if (isAnalyzing) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.analyzingContainer}>
          <View style={styles.sparkleContainer}>
            <Ionicons name="sparkles" size={48} color="#00704A" />
          </View>
          <Text style={styles.analyzingTitle}>AI Quality Analysis</Text>
          <Text style={styles.analyzingSubtitle}>
            Analyzing {selectedImages.length} container images and providing recommendations...
          </Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {progress < 30 && 'Scanning container surface...'}
              {progress >= 30 && progress < 60 && 'Checking structural integrity...'}
              {progress >= 60 && progress < 90 && 'Analyzing hygiene standards...'}
              {progress >= 90 && 'Generating recommendations...'}
            </Text>
          </View>

          {onSkip && (
            <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
              <Text style={styles.skipButtonText}>Skip Analysis</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  }

  if (!result) return null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.completeContainer}>
        <View style={styles.checkIconContainer}>
          <Ionicons name="checkmark-circle" size={40} color="#00704A" />
        </View>
        <Text style={styles.completeTitle}>Quality Analysis Complete</Text>
      </View>

      {/* Overall Score */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreNumber}>{result.overallScore}</Text>
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreLabel}>Quality Score</Text>
            <View style={[styles.conditionBadge, { backgroundColor: getConditionColor(result.condition) }]}>
              <Text style={styles.conditionText}>{result.condition.toUpperCase()}</Text>
            </View>
          </View>
        </View>
        <View style={styles.scoreProgressBar}>
          <View style={[styles.scoreProgressFill, { width: `${result.overallScore}%` }]} />
        </View>
        {result.estimatedLifespan && (
          <Text style={styles.lifespanText}>Estimated lifespan: {result.estimatedLifespan}</Text>
        )}
      </View>

      {/* Recommendations */}
      <View style={styles.recommendationsCard}>
        <View style={styles.recommendationsHeader}>
          <Ionicons name="bulb" size={20} color="#00704A" />
          <Text style={styles.recommendationsTitle}>AI Recommendations</Text>
        </View>
        <View style={styles.recommendationsList}>
          {result.recommendations.map((rec, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Ionicons name="star" size={16} color="#00704A" />
              <View style={styles.recommendationContent}>
                <Text style={styles.recommendationTitle}>{rec.title}</Text>
                <Text style={styles.recommendationDescription}>{rec.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Time Savings */}
      {result.timeToStore && (
        <View style={styles.timeSavingsCard}>
          <View style={styles.timeSavingsContent}>
            <View style={styles.timeIconContainer}>
              <Ionicons name="time" size={20} color="#10B981" />
            </View>
            <View>
              <Text style={styles.timeSavingsTitle}>Time Savings</Text>
              <Text style={styles.timeSavingsDescription}>
                Save approximately {result.timeToStore} minutes compared to visiting the nearest store
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Quality Issues */}
      {result.qualityIssues && result.qualityIssues.length > 0 && (
        <View style={styles.issuesCard}>
          <View style={styles.issuesHeader}>
            <Ionicons name="warning" size={16} color="#F59E0B" />
            <Text style={styles.issuesTitle}>Minor quality notes:</Text>
          </View>
          {result.qualityIssues.map((issue, index) => (
            <Text key={index} style={styles.issueText}>• {issue}</Text>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {onSkip && (
          <TouchableOpacity style={styles.skipActionButton} onPress={onSkip}>
            <Text style={styles.skipActionText}>
              {standalone ? 'Scan Another Item' : 'Use Different Item'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.continueButton, onSkip ? styles.continueButtonHalf : styles.continueButtonFull]}
          onPress={() => onComplete(result)}
        >
          <Ionicons name="flash" size={16} color="#fff" />
          <Text style={styles.continueButtonText}>
            {standalone ? 'Save Results' : 'Continue with This Item'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
  },
  analyzingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  sparkleContainer: {
    backgroundColor: 'rgba(0,112,74,0.1)',
    padding: 24,
    borderRadius: 20,
    marginBottom: 16,
  },
  analyzingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  analyzingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00704A',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  skipButtonText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  completeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  checkIconContainer: {
    backgroundColor: 'rgba(0,112,74,0.1)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  completeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  scoreCard: {
    backgroundColor: 'rgba(0,112,74,0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,112,74,0.2)',
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: '#00704A',
  },
  scoreInfo: {
    alignItems: 'flex-end',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  conditionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  conditionText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  scoreProgressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  scoreProgressFill: {
    height: '100%',
    backgroundColor: '#00704A',
    borderRadius: 4,
  },
  lifespanText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  recommendationsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 8,
  },
  recommendationsList: {
    gap: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0,112,74,0.05)',
    padding: 12,
    borderRadius: 8,
  },
  recommendationContent: {
    flex: 1,
    marginLeft: 8,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  recommendationDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  timeSavingsCard: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.2)',
  },
  timeSavingsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIconContainer: {
    backgroundColor: 'rgba(16,185,129,0.2)',
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  timeSavingsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 4,
  },
  timeSavingsDescription: {
    fontSize: 12,
    color: '#047857',
  },
  issuesCard: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
  },
  issuesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  issuesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
  },
  issueText: {
    fontSize: 12,
    color: '#B45309',
    marginBottom: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  skipActionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  skipActionText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#00704A',
  },
  continueButtonHalf: {
    flex: 1,
  },
  continueButtonFull: {
    width: '100%',
  },
  continueButtonText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
  },
  imagePickerContainer: {
    padding: 16,
  },
  imagePickerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  imagePickerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  imageItem: {
    position: 'relative',
    width: '30%',
    aspectRatio: 1,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageButton: {
    width: '30%',
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: '#00704A',
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,112,74,0.05)',
  },
  addImageText: {
    fontSize: 12,
    color: '#00704A',
    fontWeight: '600',
    marginTop: 4,
  },
  imagePickerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  startAnalysisButton: {
    flex: 1,
    backgroundColor: '#00704A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  startAnalysisText: {
    color: '#fff',
    fontWeight: '700',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
});
