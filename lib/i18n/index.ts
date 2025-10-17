import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'en' | 'vi';

export interface Translations {
  // Common
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    confirm: string;
    save: string;
    edit: string;
    delete: string;
    back: string;
    next: string;
    done: string;
    close: string;
    retry: string;
  };
  
  // Navigation
  navigation: {
    home: string;
    wallet: string;
    store: string;
    rewards: string;
    profile: string;
  };
  
  // Dashboard
  dashboard: {
    title: string;
    greeting: string;
    scanToBorrow: string;
    quickActions: string;
    recommended: string;
    currentlyBorrowing: string;
    noActiveBorrows: string;
    borrowMore: string;
  };
  
  // Wallet
  wallet: {
    title: string;
    totalBalance: string;
    income: string;
    expenses: string;
    deposit: string;
    withdraw: string;
    depositWithdraw: string;
    quickAmounts: string;
    amount: string;
    enterAmount: string;
    confirmTransaction: string;
    transactionSuccess: string;
    transactionFailed: string;
  };
  
  // Stores
  stores: {
    title: string;
    searchPlaceholder: string;
    nearbyStores: string;
    all: string;
    nearby: string;
    topRated: string;
    closest: string;
    open: string;
    closed: string;
    getDirections: string;
    call: string;
    view: string;
  };
  
  // Rewards
  rewards: {
    title: string;
    expPoints: string;
    ranking: string;
    viewRankings: string;
    vouchers: string;
    myVouchers: string;
    history: string;
    useNow: string;
    used: string;
    expired: string;
    available: string;
  };
  
  // Profile
  profile: {
    title: string;
    myAccount: string;
    settings: string;
    language: string;
    notifications: string;
    security: string;
    generalSettings: string;
    accountSettings: string;
    viewRankings: string;
    transactionHistory: string;
    aiChat: string;
    support: string;
    help: string;
    aboutApp: string;
    logout: string;
    editProfile: string;
    saveProfile: string;
    cancelEdit: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    dateOfBirth: string;
    avatar: string;
    changeAvatar: string;
    profileUpdated: string;
    updateFailed: string;
  };
  
  // Leaderboard
  leaderboard: {
    title: string;
    today: string;
    week: string;
    allTime: string;
    yourRank: string;
    points: string;
    rank: string;
  };
  
  // Transaction History
  transactionHistory: {
    title: string;
    all: string;
    borrow: string;
    return: string;
    completed: string;
    pending: string;
    rejected: string;
    noTransactions: string;
    loadMore: string;
  };
}

const translations: Record<Language, Translations> = {
  en: {
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      edit: 'Edit',
      delete: 'Delete',
      back: 'Back',
      next: 'Next',
      done: 'Done',
      close: 'Close',
      retry: 'Retry',
    },
    navigation: {
      home: 'Home',
      wallet: 'Wallet',
      store: 'Store',
      rewards: 'Rewards',
      profile: 'Profile',
    },
    dashboard: {
      title: 'Dashboard',
      greeting: 'Good Morning',
      scanToBorrow: 'Scan to borrow more to rank up',
      quickActions: 'Quick Actions',
      recommended: 'Recommended',
      currentlyBorrowing: 'Currently Borrowing',
      noActiveBorrows: 'No active borrows',
      borrowMore: 'Borrow more items to increase your rank',
    },
    wallet: {
      title: 'Wallet',
      totalBalance: 'Total Balance',
      income: 'Income',
      expenses: 'Expenses',
      deposit: 'Deposit',
      withdraw: 'Withdraw',
      depositWithdraw: 'Deposit/Withdraw',
      quickAmounts: 'Quick Amounts',
      amount: 'Amount',
      enterAmount: 'Enter amount',
      confirmTransaction: 'Confirm Transaction',
      transactionSuccess: 'Transaction successful',
      transactionFailed: 'Transaction failed',
    },
    stores: {
      title: 'Stores',
      searchPlaceholder: 'Search Here',
      nearbyStores: 'Nearby Stores',
      all: 'All',
      nearby: 'Nearby',
      topRated: 'Top Rated',
      closest: 'Closest',
      open: 'Open',
      closed: 'Closed',
      getDirections: 'Get Directions',
      call: 'Call',
      view: 'View',
    },
    rewards: {
      title: 'Rewards',
      expPoints: 'Exp. Points',
      ranking: 'Ranking',
      viewRankings: 'View Rankings',
      vouchers: 'Vouchers',
      myVouchers: 'My Vouchers',
      history: 'History',
      useNow: 'Use Now',
      used: 'Used',
      expired: 'Expired',
      available: 'Available',
    },
    profile: {
      title: 'My Profile',
      myAccount: 'My Account',
      settings: 'Settings',
      language: 'Language',
      notifications: 'Notifications',
      security: 'Security',
      generalSettings: 'General Settings',
      accountSettings: 'Account Settings',
      viewRankings: 'View Rankings',
      transactionHistory: 'Transaction History',
      aiChat: 'AI Chat',
      support: 'Support',
      help: 'Help',
      aboutApp: 'About App',
      logout: 'Logout',
      editProfile: 'Edit Profile',
      saveProfile: 'Save Profile',
      cancelEdit: 'Cancel',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      address: 'Address',
      dateOfBirth: 'Date of Birth',
      avatar: 'Avatar',
      changeAvatar: 'Change Avatar',
      profileUpdated: 'Profile updated successfully',
      updateFailed: 'Failed to update profile',
    },
    leaderboard: {
      title: 'Leaderboard',
      today: 'Today',
      week: 'Week',
      allTime: 'All Time',
      yourRank: 'Your Rank',
      points: 'Points',
      rank: 'Rank',
    },
    transactionHistory: {
      title: 'Transaction History',
      all: 'All',
      borrow: 'Borrow',
      return: 'Return',
      completed: 'Completed',
      pending: 'Pending',
      rejected: 'Rejected',
      noTransactions: 'No transactions found',
      loadMore: 'Load More',
    },
  },
  vi: {
    common: {
      loading: 'Đang tải...',
      error: 'Lỗi',
      success: 'Thành công',
      cancel: 'Hủy',
      confirm: 'Xác nhận',
      save: 'Lưu',
      edit: 'Chỉnh sửa',
      delete: 'Xóa',
      back: 'Quay lại',
      next: 'Tiếp theo',
      done: 'Hoàn thành',
      close: 'Đóng',
      retry: 'Thử lại',
    },
    navigation: {
      home: 'Trang chủ',
      wallet: 'Ví',
      store: 'Cửa hàng',
      rewards: 'Phần thưởng',
      profile: 'Hồ sơ',
    },
    dashboard: {
      title: 'Bảng điều khiển',
      greeting: 'Chào buổi sáng',
      scanToBorrow: 'Quét để mượn thêm và tăng hạng',
      quickActions: 'Thao tác nhanh',
      recommended: 'Gợi ý',
      currentlyBorrowing: 'Đang mượn',
      noActiveBorrows: 'Không có mượn nào',
      borrowMore: 'Mượn thêm để tăng hạng',
    },
    wallet: {
      title: 'Ví',
      totalBalance: 'Tổng số dư',
      income: 'Thu nhập',
      expenses: 'Chi tiêu',
      deposit: 'Nạp tiền',
      withdraw: 'Rút tiền',
      depositWithdraw: 'Nạp/Rút tiền',
      quickAmounts: 'Số tiền nhanh',
      amount: 'Số tiền',
      enterAmount: 'Nhập số tiền',
      confirmTransaction: 'Xác nhận giao dịch',
      transactionSuccess: 'Giao dịch thành công',
      transactionFailed: 'Giao dịch thất bại',
    },
    stores: {
      title: 'Cửa hàng',
      searchPlaceholder: 'Tìm kiếm',
      nearbyStores: 'Cửa hàng gần đây',
      all: 'Tất cả',
      nearby: 'Gần đây',
      topRated: 'Đánh giá cao',
      closest: 'Gần nhất',
      open: 'Mở cửa',
      closed: 'Đóng cửa',
      getDirections: 'Chỉ đường',
      call: 'Gọi',
      view: 'Xem',
    },
    rewards: {
      title: 'Phần thưởng',
      expPoints: 'Điểm kinh nghiệm',
      ranking: 'Xếp hạng',
      viewRankings: 'Xem xếp hạng',
      vouchers: 'Voucher',
      myVouchers: 'Voucher của tôi',
      history: 'Lịch sử',
      useNow: 'Sử dụng ngay',
      used: 'Đã sử dụng',
      expired: 'Hết hạn',
      available: 'Có sẵn',
    },
    profile: {
      title: 'Hồ sơ của tôi',
      myAccount: 'Tài khoản của tôi',
      settings: 'Cài đặt',
      language: 'Ngôn ngữ',
      notifications: 'Thông báo',
      security: 'Bảo mật',
      generalSettings: 'Cài đặt chung',
      accountSettings: 'Cài đặt tài khoản',
      viewRankings: 'Xem xếp hạng',
      transactionHistory: 'Lịch sử giao dịch',
      aiChat: 'Trò chuyện AI',
      support: 'Hỗ trợ',
      help: 'Trợ giúp',
      aboutApp: 'Về ứng dụng',
      logout: 'Đăng xuất',
      editProfile: 'Chỉnh sửa hồ sơ',
      saveProfile: 'Lưu hồ sơ',
      cancelEdit: 'Hủy',
      name: 'Tên',
      email: 'Email',
      phone: 'Số điện thoại',
      address: 'Địa chỉ',
      dateOfBirth: 'Ngày sinh',
      avatar: 'Ảnh đại diện',
      changeAvatar: 'Đổi ảnh đại diện',
      profileUpdated: 'Cập nhật hồ sơ thành công',
      updateFailed: 'Cập nhật hồ sơ thất bại',
    },
    leaderboard: {
      title: 'Bảng xếp hạng',
      today: 'Hôm nay',
      week: 'Tuần',
      allTime: 'Tất cả',
      yourRank: 'Hạng của bạn',
      points: 'Điểm',
      rank: 'Hạng',
    },
    transactionHistory: {
      title: 'Lịch sử giao dịch',
      all: 'Tất cả',
      borrow: 'Mượn',
      return: 'Trả',
      completed: 'Hoàn thành',
      pending: 'Đang xử lý',
      rejected: 'Từ chối',
      noTransactions: 'Không có giao dịch',
      loadMore: 'Tải thêm',
    },
  },
};

class I18nManager {
  private currentLanguage: Language = 'en';
  private listeners: Array<(language: Language) => void> = [];

  constructor() {
    this.loadLanguage();
  }

  private async loadLanguage() {
    try {
      const savedLanguage = await AsyncStorage.getItem('app_language');
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'vi')) {
        this.currentLanguage = savedLanguage as Language;
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  }

  async setLanguage(language: Language) {
    try {
      this.currentLanguage = language;
      await AsyncStorage.setItem('app_language', language);
      this.notifyListeners();
    } catch (error) {
      console.error('Error saving language:', error);
    }
  }

  getLanguage(): Language {
    return this.currentLanguage;
  }

  getTranslations(): Translations {
    return translations[this.currentLanguage];
  }

  t<K extends keyof Translations>(key: K): Translations[K] {
    return translations[this.currentLanguage][key];
  }

  subscribe(listener: (language: Language) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentLanguage));
  }
}

export const i18n = new I18nManager();
export default i18n;
