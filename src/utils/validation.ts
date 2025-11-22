// Validation utilities for forms

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation (Vietnamese format)
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^(\+84|0)[0-9]{9,10}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Date validation (YYYY-MM-DD format)
export const validateDate = (date: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const dateObj = new Date(date);
  const today = new Date();
  
  // Check if date is valid and not in the future
  return dateObj instanceof Date && !isNaN(dateObj.getTime()) && dateObj <= today;
};

// Name validation
export const validateName = (name: string): boolean => {
  return name.trim().length >= 2 && name.trim().length <= 50;
};

// Address validation
export const validateAddress = (address: string): boolean => {
  return address.trim().length >= 5 && address.trim().length <= 200;
};

// Profile form validation (email is read-only, so not validated)
export const validateProfileForm = (formData: {
  name: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
}): ValidationResult => {
  const errors: ValidationError[] = [];

  // Validate name
  if (!formData.name.trim()) {
    errors.push({ field: 'name', message: 'Họ và tên không được để trống' });
  } else if (!validateName(formData.name)) {
    errors.push({ field: 'name', message: 'Họ và tên phải có từ 2-50 ký tự' });
  }

  // Email is read-only, no validation needed

  // Validate phone (optional but if provided, must be valid)
  if (formData.phone.trim() && !validatePhone(formData.phone)) {
    errors.push({ field: 'phone', message: 'Số điện thoại không đúng định dạng (VD: 0987654321)' });
  }

  // Validate address (optional but if provided, must be valid)
  if (formData.address.trim() && !validateAddress(formData.address)) {
    errors.push({ field: 'address', message: 'Địa chỉ phải có từ 5-200 ký tự' });
  }

  // Validate date of birth (optional but if provided, must be valid)
  if (formData.dateOfBirth.trim() && !validateDate(formData.dateOfBirth)) {
    errors.push({ field: 'dateOfBirth', message: 'Ngày sinh không đúng định dạng (YYYY-MM-DD) hoặc không hợp lệ' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Format phone number for display
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('84')) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith('0')) {
    return `+84${cleaned.substring(1)}`;
  }
  return phone;
};

// Format date for display
export const formatDate = (date: string): string => {
  if (!date) return '';
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString('vi-VN');
};

