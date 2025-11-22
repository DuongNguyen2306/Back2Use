import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getDistricts, getProvinces, getWards } from '@/services/api/addressService';
import { District, Province, Ward } from '@/types/address.types';

interface AddressPickerProps {
  label: string;
  placeholder: string;
  value: string;
  onSelect: (address: {
    province: Province | null;
    district: District | null;
    ward: Ward | null;
    streetAddress: string;
  }) => void;
  streetAddress: string;
  province: Province | null;
  district: District | null;
  ward: Ward | null;
  required?: boolean;
}

export default function AddressPicker({
  label,
  placeholder,
  value,
  onSelect,
  streetAddress,
  province,
  district,
  ward,
  required = false,
}: AddressPickerProps) {
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showWardModal, setShowWardModal] = useState(false);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Load provinces when province modal opens
  useEffect(() => {
    if (showProvinceModal && provinces.length === 0) {
      loadProvinces();
    }
  }, [showProvinceModal]);

  // Load districts when district modal opens
  useEffect(() => {
    if (showDistrictModal && province && districts.length === 0) {
      loadDistricts(province.code);
    }
  }, [showDistrictModal, province]);

  // Load wards when ward modal opens
  useEffect(() => {
    if (showWardModal && district && wards.length === 0) {
      loadWards(district.code);
    }
  }, [showWardModal, district]);

  const loadProvinces = async () => {
    try {
      setLoadingProvinces(true);
      const data = await getProvinces();
      setProvinces(data);
    } catch (error) {
      console.error('Error loading provinces:', error);
    } finally {
      setLoadingProvinces(false);
    }
  };

  const loadDistricts = async (provinceCode: number) => {
    try {
      setLoadingDistricts(true);
      const data = await getDistricts(provinceCode);
      setDistricts(data);
    } catch (error) {
      console.error('Error loading districts:', error);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const loadWards = async (districtCode: number) => {
    try {
      setLoadingWards(true);
      const data = await getWards(districtCode);
      setWards(data);
    } catch (error) {
      console.error('Error loading wards:', error);
    } finally {
      setLoadingWards(false);
    }
  };

  const handleProvinceSelect = (selectedProvince: Province) => {
    // Reset district and ward when province changes
    onSelect({
      province: selectedProvince,
      district: null,
      ward: null,
      streetAddress,
    });
    setDistricts([]);
    setWards([]);
    setShowProvinceModal(false);
  };

  const handleDistrictSelect = (selectedDistrict: District) => {
    // Reset ward when district changes
    onSelect({
      province,
      district: selectedDistrict,
      ward: null,
      streetAddress,
    });
    setWards([]);
    setShowDistrictModal(false);
  };

  const handleWardSelect = (selectedWard: Ward) => {
    onSelect({
      province,
      district,
      ward: selectedWard,
      streetAddress,
    });
    setShowWardModal(false);
  };

  const renderModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    items: Array<{ name: string; code: number }>,
    loading: boolean,
    onSelect: (item: any) => void,
    selectedCode?: number
  ) => {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#0F4D3A" />
                </View>
              ) : (
                items.map((item) => (
                  <TouchableOpacity
                    key={item.code}
                    style={[
                      styles.modalItem,
                      selectedCode === item.code && styles.modalItemSelected,
                    ]}
                    onPress={() => onSelect(item)}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        selectedCode === item.code && styles.modalItemTextSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                    {selectedCode === item.code && (
                      <Ionicons name="checkmark" size={20} color="#0F4D3A" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>

      {/* Province/City Picker */}
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setShowProvinceModal(true)}
      >
        <Ionicons name="location-outline" size={20} color="#6B7280" style={styles.pickerIcon} />
        <Text
          style={[styles.pickerText, !province && styles.pickerTextPlaceholder]}
          numberOfLines={1}
        >
          {province ? province.name : 'Province/City'}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#6B7280" />
      </TouchableOpacity>

      {/* District Picker */}
      {province && (
        <TouchableOpacity
          style={[styles.pickerButton, styles.pickerButtonMargin]}
          onPress={() => setShowDistrictModal(true)}
        >
          <Ionicons name="location-outline" size={20} color="#6B7280" style={styles.pickerIcon} />
          <Text
            style={[styles.pickerText, !district && styles.pickerTextPlaceholder]}
            numberOfLines={1}
          >
            {district ? district.name : 'District'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#6B7280" />
        </TouchableOpacity>
      )}

      {/* Ward Picker */}
      {district && (
        <TouchableOpacity
          style={[styles.pickerButton, styles.pickerButtonMargin]}
          onPress={() => setShowWardModal(true)}
        >
          <Ionicons name="location-outline" size={20} color="#6B7280" style={styles.pickerIcon} />
          <Text
            style={[styles.pickerText, !ward && styles.pickerTextPlaceholder]}
            numberOfLines={1}
          >
            {ward ? ward.name : 'Ward'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#6B7280" />
        </TouchableOpacity>
      )}

      {/* Street Address Input */}
      <View style={[styles.inputWrapper, styles.pickerButtonMargin]}>
        <Ionicons name="home-outline" size={20} color="#6B7280" style={styles.pickerIcon} />
        <TextInput
          style={styles.streetInput}
          placeholder="Street Address"
          placeholderTextColor="#9CA3AF"
          value={streetAddress}
          onChangeText={(text) =>
            onSelect({
              province,
              district,
              ward,
              streetAddress: text,
            })
          }
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      {/* Province Modal */}
      {renderModal(
        showProvinceModal,
        () => setShowProvinceModal(false),
        'Select Province/City',
        provinces,
        loadingProvinces,
        handleProvinceSelect,
        province?.code
      )}

      {/* District Modal */}
      {renderModal(
        showDistrictModal,
        () => setShowDistrictModal(false),
        'Select District',
        districts,
        loadingDistricts,
        handleDistrictSelect,
        district?.code
      )}

      {/* Ward Modal */}
      {renderModal(
        showWardModal,
        () => setShowWardModal(false),
        'Select Ward',
        wards,
        loadingWards,
        handleWardSelect,
        ward?.code
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
  },
  pickerButtonMargin: {
    marginTop: 12,
  },
  pickerIcon: {
    marginRight: 12,
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  pickerTextPlaceholder: {
    color: '#9CA3AF',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
  },
  streetInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    padding: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemSelected: {
    backgroundColor: '#F0FDF4',
  },
  modalItemText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  modalItemTextSelected: {
    color: '#0F4D3A',
    fontWeight: '600',
  },
});

