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
  { id: "2", qrCode: "QR002", type: "container", size: "large", material: "Bamboo Fiber", status: "borrowed", storeId: "1", condition: "good", maxReuses: 50, currentReuses: 8 },
  { id: "3", qrCode: "QR003", type: "bowl", size: "small", material: "Bamboo Fiber", status: "overdue", storeId: "1", condition: "good", maxReuses: 80, currentReuses: 25 },
  { id: "4", qrCode: "QR004", type: "bottle", size: "medium", material: "Bamboo Fiber", status: "available", storeId: "1", condition: "damaged", maxReuses: 60, currentReuses: 45 },
];

export const mockTransactions = [
  { id: "1", type: "borrow", itemId: "1", userId: "1", storeId: "1", borrowDate: new Date("2024-01-20"), dueDate: new Date("2024-01-22"), status: "completed", depositAmount: 50000, lateFee: 0 },
  { id: "2", type: "return", itemId: "1", userId: "1", storeId: "1", borrowDate: new Date("2024-01-20"), returnDate: new Date("2024-01-21"), status: "completed", depositAmount: 50000, refundAmount: 50000, lateFee: 0 },
  { id: "3", type: "borrow", itemId: "2", userId: "1", storeId: "1", borrowDate: new Date("2024-01-25"), dueDate: new Date("2024-01-27"), status: "overdue", depositAmount: 75000, lateFee: 10000 },
  { id: "4", type: "borrow", itemId: "3", userId: "1", storeId: "1", borrowDate: new Date("2024-01-28"), dueDate: new Date("2024-01-30"), status: "pending", depositAmount: 60000, lateFee: 0 },
];

