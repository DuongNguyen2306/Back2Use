import { Province, District, Ward } from '@/types/address.types';

const API_BASE_URL = 'https://provinces.open-api.vn/api/v1';

/**
 * Get all provinces (cities) in Vietnam
 * API: GET /api/v1/?depth=2
 */
export const getProvinces = async (): Promise<Province[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/?depth=2`);
    if (!response.ok) {
      throw new Error(`Failed to fetch provinces: ${response.status}`);
    }
    const data = await response.json();
    return data as Province[];
  } catch (error) {
    console.error('Error fetching provinces:', error);
    throw error;
  }
};

/**
 * Get districts of a specific province
 * API: GET /api/v1/p/{province_code}?depth=2
 */
export const getDistricts = async (provinceCode: number): Promise<District[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/p/${provinceCode}?depth=2`);
    if (!response.ok) {
      throw new Error(`Failed to fetch districts: ${response.status}`);
    }
    const data = await response.json();
    return data.districts || [];
  } catch (error) {
    console.error('Error fetching districts:', error);
    throw error;
  }
};

/**
 * Get wards of a specific district
 * API: GET /api/v1/d/{district_code}?depth=2
 */
export const getWards = async (districtCode: number): Promise<Ward[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/d/${districtCode}?depth=2`);
    if (!response.ok) {
      throw new Error(`Failed to fetch wards: ${response.status}`);
    }
    const data = await response.json();
    return data.wards || [];
  } catch (error) {
    console.error('Error fetching wards:', error);
    throw error;
  }
};

