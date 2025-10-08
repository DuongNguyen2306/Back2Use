export const mockUsers = [
  {
    id: "1",
    email: "duong1@gmail.com",
    name: "duong1",
    role: "customer",
    password: "123456",
    phone: "+1234567890",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    email: "duong2@gmail.com",
    name: "duong2",
    role: "business",
    password: "123456",
    phone: "+1234567891",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
  },
  {
    id: "3",
    email: "duong3@gmail.com",
    name: "duong3",
    role: "admin",
    password: "123456",
    phone: "+1234567892",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

export const mockStores = [
  { 
    id: "1", 
    name: "Back2Use Store FPT HCM", 
    address: "Trường Đại học FPT TP.HCM, Quận 9, TP.HCM", 
    phone: "+84901234567", 
    operatingHours: "Mon-Sun: 7-22", 
    packagingTypes: ["cup","container","bowl","bottle"], 
    ownerId: "2", 
    isActive: true,
    latitude: 10.8412,
    longitude: 106.8099
  },
];

export const mockPackagingItems = [
  { id: "1", qrCode: "QR001", type: "cup", size: "medium", material: "Bamboo Fiber", status: "available", storeId: "1", condition: "good", maxReuses: 100, currentReuses: 15 },
  { id: "2", qrCode: "QR002", type: "container", size: "large", material: "Stainless Steel", status: "borrowed", storeId: "1", condition: "good", maxReuses: 200, currentReuses: 45 },
];

export const mockTransactions = [
  { id: "1", customerId: "1", storeId: "1", packagingItemId: "2", type: "borrow", depositAmount: 5.0, status: "completed", borrowedAt: new Date("2024-01-22T10:30:00"), dueDate: new Date("2024-01-24T10:30:00") },
  { id: "2", customerId: "1", storeId: "1", packagingItemId: "1", type: "return", depositAmount: 3.0, status: "completed", borrowedAt: new Date("2024-01-20T14:15:00"), returnedAt: new Date("2024-01-21T16:20:00"), dueDate: new Date("2024-01-22T14:15:00") },
];

export const mockEnvironmentalStats = { totalPlasticSaved: 2847, co2Reduced: 1523, totalReuses: 15420, activeUsers: 3247, partnerStores: 28, thisMonthReturns: 892, returnRate: 94.2 };


