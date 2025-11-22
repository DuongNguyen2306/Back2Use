// Address types for Vietnam provinces API
export interface Province {
  name: string;
  code: number;
  codename: string;
  division_type: string;
  phone_code: number;
  districts?: District[];
}

export interface District {
  name: string;
  code: number;
  codename: string;
  division_type: string;
  province_code: number;
  wards?: Ward[];
}

export interface Ward {
  name: string;
  code: number;
  codename: string;
  division_type: string;
  district_code: number;
}

export interface AddressFormData {
  province: Province | null;
  district: District | null;
  ward: Ward | null;
  streetAddress: string;
}

export interface FullAddress {
  streetAddress: string;
  ward: string;
  district: string;
  province: string;
}

