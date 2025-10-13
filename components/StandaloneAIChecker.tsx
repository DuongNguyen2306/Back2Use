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

interface ImageUpload {
  angle: string;
  uri: string | null;
  uploaded: boolean;
}

interface AIAnalysisResult {
  overallScore: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  damageDetected: boolean;
  damages: Array<{
    type: string;
    severity: 'minor' | 'moderate' | 'severe';
    location: string;
    confidence: number;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  estimatedLifespan: string;
  timeSavingAdvice?: {
    message: string;
    nearbyStores?: Array<{ name: string; distance: string }>;
  };
}

export function StandaloneAIChecker() {
  const [step, setStep] = useState<'upload' | 'analyzing' | 'results'>('upload');
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const [images, setImages] = useState<ImageUpload[]>([
    { angle: 'Above', uri: null, uploaded: false },
    { angle: 'Below', uri: null, uploaded: false },
    { angle: 'Front', uri: null, uploaded: false },
    { angle: 'Back', uri: null, uploaded: false },
    { angle: 'Left', uri: null, uploaded: false },
    { angle: 'Right', uri: null, uploaded: false },
  ]);

  const handleImageUpload = async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const newImages = [...images];
      newImages[index] = {
        ...newImages[index],
        uri: result.assets[0].uri,
        uploaded: true,
      };
      setImages(newImages);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages[index] = {
      ...newImages[index],
      uri: null,
      uploaded: false,
    };
    setImages(newImages);
  };

  const uploadedCount = images.filter((img) => img.uploaded).length;
  const canAnalyze = uploadedCount === 6; // Require all 6 images

  const runAIAnalysis = async () => {
    if (!canAnalyze) return;

    setStep('analyzing');
    setAnalysisProgress(0);

    // Simulate AI analysis progress
    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const score = Math.floor(Math.random() * 30) + 70;
    const condition = score >= 90 ? 'excellent' : score >= 80 ? 'good' : score >= 70 ? 'fair' : 'poor';

    const mockResult: AIAnalysisResult = {
      overallScore: score,
      condition,
      damageDetected: score < 80,
      damages:
        score < 80
          ? [
              {
                type: 'Surface scratches',
                severity: 'minor',
                location: 'Front panel',
                confidence: 0.87,
              },
              {
                type: 'Edge wear',
                severity: 'minor',
                location: 'Bottom edge',
                confidence: 0.73,
              },
            ]
          : [],
      recommendations: [
        {
          title: 'Quality Assessment',
          description:
            score >= 80
              ? 'Container is in excellent condition for reuse'
              : 'Container shows minor wear but remains functional',
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
      estimatedLifespan: score >= 80 ? '3-4 uses remaining' : '2-3 uses remaining',
      timeSavingAdvice: {
        message: 'Using this container will save you time and reduce environmental impact!',
      },
    };

    clearInterval(progressInterval);
    setAnalysisProgress(100);

    setTimeout(() => {
      setAnalysisResult(mockResult);
      setStep('results');
    }, 500);
  };

  const handleNewScan = () => {
    setStep('upload');
    setAnalysisResult(null);
    setAnalysisProgress(0);
    setImages([
      { angle: 'Above', uri: null, uploaded: false },
      { angle: 'Below', uri: null, uploaded: false },
      { angle: 'Front', uri: null, uploaded: false },
      { angle: 'Back', uri: null, uploaded: false },
      { angle: 'Left', uri: null, uploaded: false },
      { angle: 'Right', uri: null, uploaded: false },
    ]);
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minor':
        return '#F59E0B';
      case 'moderate':
        return '#F97316';
      case 'severe':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  if (step === 'upload') {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="sparkles" size={24} color="#00704A" />
          </View>
          <Text style={styles.headerTitle}>AI Check-in</Text>
          <Text style={styles.headerSubtitle}>
            Upload 6 images from different angles to get AI-powered condition analysis
          </Text>
        </View>

        <View style={styles.uploadCard}>
          <View style={styles.uploadHeader}>
            <Ionicons name="brain" size={20} color="#00704A" />
            <Text style={styles.uploadTitle}>Upload Item Images</Text>
          </View>
          <Text style={styles.uploadDescription}>
            Take photos from all 6 angles to get comprehensive AI analysis of the item condition
          </Text>

          <View style={styles.alertBox}>
            <Ionicons name="brain" size={16} color="#3B82F6" />
            <Text style={styles.alertText}>
              Upload clear images from all 6 angles for the most accurate AI condition assessment.
            </Text>
          </View>

          <View style={styles.imageGrid}>
            {images.map((image, index) => (
              <View key={index} style={styles.imageCard}>
                <Text style={styles.imageAngle}>{image.angle}</Text>
                {image.uri ? (
                  <View style={styles.imagePreview}>
                    <Image source={{ uri: image.uri }} style={styles.selectedImage} />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close" size={12} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.checkIcon}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => handleImageUpload(index)}
                  >
                    <Ionicons name="cloud-upload" size={24} color="#6B7280" />
                    <Text style={styles.uploadText}>Upload</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>{uploadedCount}/6 images uploaded</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(uploadedCount / 6) * 100}%` }]} />
            </View>
            {uploadedCount === 6 && (
              <View style={styles.readyBadge}>
                <Text style={styles.readyText}>Ready to analyze</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.analyzeButton, !canAnalyze && styles.disabledButton]}
            onPress={runAIAnalysis}
            disabled={!canAnalyze}
          >
            <Ionicons name="brain" size={20} color="#fff" />
            <Text style={styles.analyzeButtonText}>Run AI Analysis</Text>
          </TouchableOpacity>

          <View style={styles.privacyAlert}>
            <Ionicons name="shield-checkmark" size={16} color="#10B981" />
            <Text style={styles.privacyText}>
              <Text style={styles.privacyBold}>Privacy Protected:</Text> All analysis is done locally. No personal data is stored or shared.
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  if (step === 'analyzing') {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.analyzingCard}>
          <View style={styles.analyzingHeader}>
            <Ionicons name="sparkles" size={20} color="#00704A" />
            <Text style={styles.analyzingTitle}>AI Analysis in Progress</Text>
          </View>
          <Text style={styles.analyzingDescription}>
            Our AI is examining the item condition from all angles and generating recommendations
          </Text>

          <View style={styles.analyzingContent}>
            <View style={styles.sparkleContainer}>
              <Ionicons name="brain" size={48} color="#00704A" />
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${analysisProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {analysisProgress < 30 && 'Processing uploaded images...'}
                {analysisProgress >= 30 && analysisProgress < 60 && 'Analyzing structural integrity...'}
                {analysisProgress >= 60 && analysisProgress < 90 && 'Detecting damage patterns...'}
                {analysisProgress >= 90 && 'Generating recommendations...'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  if (step === 'results' && analysisResult) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.resultsCard}>
          <View style={styles.resultsHeader}>
            <Ionicons name="brain" size={20} color="#00704A" />
            <Text style={styles.resultsTitle}>AI Analysis Results</Text>
          </View>

          {/* Overall Condition */}
          <View style={styles.conditionCard}>
            <View>
              <Text style={styles.conditionLabel}>Overall Condition</Text>
              <Text style={[styles.conditionValue, { color: getConditionColor(analysisResult.condition) }]}>
                {analysisResult.condition.toUpperCase()}
              </Text>
            </View>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreLabel}>Condition Score</Text>
              <Text style={styles.scoreValue}>{analysisResult.overallScore}/100</Text>
            </View>
          </View>

          {/* Damage Detection */}
          {analysisResult.damageDetected && analysisResult.damages.length > 0 && (
            <View style={styles.damageCard}>
              <View style={styles.damageHeader}>
                <Ionicons name="warning" size={16} color="#F59E0B" />
                <Text style={styles.damageTitle}>Detected Issues</Text>
              </View>
              {analysisResult.damages.map((damage, index) => (
                <View key={index} style={styles.damageItem}>
                  <View>
                    <Text style={styles.damageType}>{damage.type}</Text>
                    <Text style={styles.damageLocation}>{damage.location}</Text>
                  </View>
                  <View style={styles.damageInfo}>
                    <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(damage.severity) + '20' }]}>
                      <Text style={[styles.severityText, { color: getSeverityColor(damage.severity) }]}>
                        {damage.severity}
                      </Text>
                    </View>
                    <Text style={styles.confidenceText}>{Math.round(damage.confidence * 100)}%</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Recommendations */}
          <View style={styles.recommendationsCard}>
            <Text style={styles.recommendationsTitle}>AI Recommendations</Text>
            {analysisResult.recommendations.map((rec, index) => (
              <View key={index} style={[
                styles.recommendationItem,
                rec.priority === 'high' && styles.highPriority,
                rec.priority === 'medium' && styles.mediumPriority,
                rec.priority === 'low' && styles.lowPriority,
              ]}>
                <Ionicons name="star" size={16} color="#00704A" />
                <View style={styles.recommendationContent}>
                  <Text style={styles.recommendationTitle}>{rec.title}:</Text>
                  <Text style={styles.recommendationDescription}>{rec.description}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <Text style={styles.summaryText}>Estimated lifespan: {analysisResult.estimatedLifespan}</Text>
          </View>

          {/* Time Saving Advice */}
          {analysisResult.timeSavingAdvice && (
            <View style={styles.timeSavingsCard}>
              <View style={styles.timeSavingsHeader}>
                <Ionicons name="time" size={20} color="#10B981" />
                <Text style={styles.timeSavingsTitle}>Time-Saving Advice</Text>
              </View>
              <Text style={styles.timeSavingsText}>{analysisResult.timeSavingAdvice.message}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.newScanButton} onPress={handleNewScan}>
              <Ionicons name="qr-code" size={16} color="#6B7280" />
              <Text style={styles.newScanText}>Check Another Item</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton}>
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={styles.saveText}>Save Results</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    backgroundColor: 'rgba(0,112,74,0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  uploadCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  uploadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 8,
  },
  uploadDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59,130,246,0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  alertText: {
    fontSize: 12,
    color: '#1E40AF',
    marginLeft: 8,
    flex: 1,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  imageCard: {
    width: '30%',
    alignItems: 'center',
  },
  imageAngle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  imagePreview: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  uploadButton: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(107,114,128,0.05)',
  },
  uploadText: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00704A',
    borderRadius: 4,
  },
  readyBadge: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  readyText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '600',
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00704A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 16,
  },
  analyzeButtonText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  privacyAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.1)',
    padding: 12,
    borderRadius: 8,
  },
  privacyText: {
    fontSize: 12,
    color: '#065F46',
    marginLeft: 8,
    flex: 1,
  },
  privacyBold: {
    fontWeight: '700',
  },
  analyzingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  analyzingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  analyzingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 8,
  },
  analyzingDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  analyzingContent: {
    alignItems: 'center',
  },
  sparkleContainer: {
    backgroundColor: 'rgba(0,112,74,0.1)',
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
  },
  resultsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(0,112,74,0.2)',
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 8,
  },
  conditionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,112,74,0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  conditionLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  conditionValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#00704A',
  },
  damageCard: {
    marginBottom: 16,
  },
  damageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  damageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  damageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(107,114,128,0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  damageType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  damageLocation: {
    fontSize: 12,
    color: '#6B7280',
  },
  damageInfo: {
    alignItems: 'flex-end',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  confidenceText: {
    fontSize: 10,
    color: '#6B7280',
  },
  recommendationsCard: {
    marginBottom: 16,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  highPriority: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  mediumPriority: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
  },
  lowPriority: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.2)',
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
  summaryCard: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
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
  timeSavingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeSavingsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
    marginLeft: 8,
  },
  timeSavingsText: {
    fontSize: 14,
    color: '#047857',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  newScanButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  newScanText: {
    color: '#6B7280',
    fontWeight: '600',
    marginLeft: 8,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00704A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
  },
});
