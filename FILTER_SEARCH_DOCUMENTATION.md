# Tài liệu về Filter và Tìm kiếm trong Back2Use

Tài liệu này mô tả chi tiết các chức năng filter và tìm kiếm trong các màn hình của ứng dụng Back2Use.

---

## 📱 MÀN HÌNH BUSINESS (Doanh nghiệp)

### 1. **Transaction Processing** (`transaction-processing.tsx`)

#### Các Filter:
- **Search Term** (`searchTerm`): Tìm kiếm theo nhiều tiêu chí
- **Tab Filter** (`activeTab`): Lọc theo tab

#### Cách hoạt động:

**Search Filter:**
- Tìm kiếm trong các trường:
  - Transaction ID (`transaction._id`)
  - Product name (`productId.productGroupId.name`)
  - Customer name (`customerId.fullName`)
  - Serial number (`productId.serialNumber`)
- So khớp không phân biệt hoa/thường (case-insensitive)
- Kết hợp với tab filter để hiển thị kết quả

**Tab Filters:**
- `'all'`: Hiển thị tất cả transactions
- `'borrow'`: Chỉ hiển thị transactions đang mượn (`borrowTransactionType === 'borrow' && status === 'borrowing'`)
- `'return-success'`: Hiển thị transactions trả thành công (sử dụng hàm `categorizeReturnTransaction`)
- `'overdue'`: Hiển thị transactions quá hạn (sử dụng hàm `calculateOverdueInfo`)

**Code Logic:**
```typescript
const getFilteredTransactions = (tabType: string) => {
  return transactions.filter((transaction) => {
    // Search matching
    const matchesSearch = 
      transaction._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      productName.includes(searchTerm.toLowerCase()) ||
      customerName.includes(searchTerm.toLowerCase()) ||
      serialNumber.includes(searchTerm.toLowerCase());

    // Tab matching
    let matchesTab = false;
    if (tabType === 'all') matchesTab = true;
    else if (tabType === 'borrow') {
      matchesTab = transaction.borrowTransactionType === 'borrow' && transaction.status === 'borrowing';
    }
    // ... các điều kiện khác

    return matchesSearch && matchesTab;
  });
};
```

---

### 2. **Business CO2 Report** (`business-co2-report.tsx`)

#### Các Filter:
- **Product Name Search** (`productName`): Tìm kiếm theo tên sản phẩm
- **Status Filter** (`statusFilter`): Lọc theo trạng thái
- **Date Range Filter** (`fromDate`, `toDate`): Lọc theo khoảng thời gian
- **Customer Filter** (`customerFilter`): Lọc theo khách hàng

#### Cách hoạt động:

**Product Name Search:**
- Tìm kiếm theo tên sản phẩm trong transactions
- Được gửi lên API qua parameter `productName`

**Status Filter:**
- Các giá trị: `'all'`, `'borrowing'`, `'pending'`, `'returned'`, `'lost'`, `'rejected'`
- Được map sang API status: `statusMap[statusFilter]`
- Gửi lên API qua parameter `status`

**Date Range Filter:**
- Chọn khoảng thời gian từ calendar picker
- Gửi lên API qua parameters `fromDate` và `toDate`
- Format hiển thị: "MM/DD/YYYY - MM/DD/YYYY" hoặc "MM/DD/YYYY" nếu chỉ có 1 ngày

**Customer Filter:**
- Hiển thị danh sách khách hàng unique từ transactions
- `'all'`: Hiển thị tất cả
- ID cụ thể: Chỉ hiển thị transactions của khách hàng đó
- Gửi lên API qua parameter `customerId`

**API Integration:**
- Tất cả filters được combine và gửi lên API endpoint
- Re-fetch data khi bất kỳ filter nào thay đổi (useEffect dependency)

---

### 3. **Staff Management** (`staff-management.tsx`)

#### Các Filter:
- **Search Query** (`searchQuery`): Tìm kiếm theo tên hoặc thông tin staff
- **Status Filter** (`statusFilter`): Lọc theo trạng thái staff

#### Cách hoạt động:

**Search Query:**
- Tìm kiếm text trong staff list
- Gửi lên API qua parameter `search`
- Debounce 500ms để tránh gọi API quá nhiều

**Status Filter:**
- Các giá trị: `'all'`, `'active'`, `'inactive'`, `'removed'`
- Gửi lên API qua parameter `status`

**Code Logic:**
```typescript
useEffect(() => {
  if (businessId) {
    const timeoutId = setTimeout(() => {
      loadStaffList();
    }, 500); // Debounce search
    return () => clearTimeout(timeoutId);
  }
}, [searchQuery, statusFilter]);
```

---

### 4. **Materials Management** (`materials.tsx`)

#### Các Filter:
- **Search Query** (`searchQuery`): Tìm kiếm trong product groups
- **Status Filter** (`statusFilter`): Lọc products theo trạng thái

#### Cách hoạt động:

**Search Query:**
- Tìm kiếm trong:
  - Product group name (`group.name`)
  - Product group description (`group.description`)
- Case-insensitive matching

**Status Filter:**
- Các giá trị: `'all'`, `'available'`, `'borrowed'`, `'non-available'`, `'damaged'`, `'retired'`
- Filter products trong mỗi group theo status
- Hiển thị số lượng products sau khi filter

**Code Logic:**
```typescript
const filteredProductGroups = productGroups.filter(group => {
  const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (group.description || '').toLowerCase().includes(searchQuery.toLowerCase());
  return matchesSearch;
});

// Trong product list:
products.filter((p) => 
  statusFilter === 'all' ? true : p.status === statusFilter
)
```

---

### 5. **Inventory Management** (`inventory.tsx`)

#### Các Filter:
- **Search Term** (`searchTerm`): Tìm kiếm trong inventory items

#### Cách hoạt động:

**Search Term:**
- Tìm kiếm trong:
  - Product type name (`type.name`)
  - QR code (`item.qrCode`)
  - Product type name từ nested object
- Case-insensitive matching

---

### 6. **Approved Materials** (`approved-materials.tsx`)

#### Các Filter:
- **Search Query** (`searchQuery`): Tìm kiếm trong materials đã được approve

#### Cách hoạt động:

**Search Query:**
- Tìm kiếm trong:
  - Material name (`material.materialName`)
  - Description (`material.description`)
- Case-insensitive matching
- Có nút clear để xóa search query

---

## 👤 MÀN HÌNH CUSTOMER (Khách hàng)

### 1. **Stores List** (`stores.tsx`)

#### Các Filter:
- **Search Query** (`searchQuery`): Tìm kiếm cửa hàng
- **Active Filter** (`activeFilter`): Lọc và sắp xếp cửa hàng

#### Cách hoạt động:

**Search Query:**
- Tìm kiếm trong:
  - Business name (`store.businessName`)
  - Business address (`store.businessAddress`)
- Case-insensitive matching

**Active Filter:**
- `'all'`: Hiển thị tất cả, sắp xếp theo khoảng cách (gần nhất trước)
- `'open-now'`: Chỉ hiển thị cửa hàng đang mở, sắp xếp theo khoảng cách
  - Kiểm tra giờ hiện tại với `openTime` và `closeTime`
- `'nearest'`: Sắp xếp theo khoảng cách (gần nhất trước)
- `'top-rated'`: Sắp xếp theo rating (cao nhất trước), nếu rating bằng nhau thì theo khoảng cách

**Distance Calculation:**
- Sử dụng Haversine formula để tính khoảng cách
- Tự động tính khoảng cách khi có user location
- Nếu không có user location, chỉ áp dụng search filter

**Code Logic:**
```typescript
const filteredStores = React.useMemo(() => {
  // Apply search filter
  let filtered = businesses;
  if (searchQuery.trim()) {
    filtered = businesses.filter(store =>
      store.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.businessAddress.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  // Calculate distance
  let stores = filtered.map(store => {
    const distance = calculateDistance(...);
    return { ...store, distance };
  });
  
  // Apply active filter and sort
  if (activeFilter === 'open-now') {
    return stores.filter(store => {
      const currentHour = new Date().getHours();
      const openHour = parseInt(store.openTime.split(':')[0]);
      const closeHour = parseInt(store.closeTime.split(':')[0]);
      return currentHour >= openHour && currentHour < closeHour;
    }).sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }
  // ... các filter khác
}, [businesses, activeFilter, userLocation, searchQuery]);
```

---

### 2. **Product Group** (`product-group/[id].tsx`)

#### Các Filter:
- **Search Query** (`searchQuery`): Tìm kiếm sản phẩm
- **Price Filter** (`priceFilter`): Lọc theo giá tiền cọc (deposit)

#### Cách hoạt động:

**Search Query:**
- Tìm kiếm trong:
  - Product group name (`product.productGroupId.name`)
  - Product size name/description (`product.productSizeId.name` hoặc `description`)
  - Serial number (`product.serialNumber`)
- Case-insensitive matching

**Price Filter:**
- `'all'`: Hiển thị tất cả
- `'low'`: Deposit < 50,000 VND
- `'medium'`: 50,000 ≤ Deposit < 150,000 VND
- `'high'`: Deposit ≥ 150,000 VND

**Code Logic:**
```typescript
const filteredProducts = React.useMemo(() => {
  let filtered = products;

  // Search filter
  if (searchQuery.trim()) {
    filtered = filtered.filter(product => {
      const groupName = (product.productGroupId as any)?.name || '';
      const sizeName = (product.productSizeId as any)?.name || '';
      const searchLower = searchQuery.toLowerCase();
      return groupName.toLowerCase().includes(searchLower) ||
             sizeName.toLowerCase().includes(searchLower) ||
             product.serialNumber.toLowerCase().includes(searchLower);
    });
  }

  // Price filter
  if (priceFilter !== 'all') {
    filtered = filtered.filter(product => {
      const depositValue = (product.productSizeId as any)?.depositValue || 0;
      if (priceFilter === 'low') return depositValue < 50000;
      if (priceFilter === 'medium') return depositValue >= 50000 && depositValue < 150000;
      if (priceFilter === 'high') return depositValue >= 150000;
      return true;
    });
  }

  return filtered;
}, [products, searchQuery, priceFilter]);
```

---

### 3. **Store Detail** (`store-detail/[id].tsx`)

#### Các Filter:
- **Search Query** (`searchQuery`): Tìm kiếm sản phẩm trong cửa hàng
- **Price Filter** (`priceFilter`): Lọc theo giá tiền cọc

#### Cách hoạt động:
- Tương tự như Product Group screen
- Filter được áp dụng trên danh sách sản phẩm của cửa hàng cụ thể

---

### 4. **Customer CO2 Report** (`customer-co2-report.tsx`)

#### Các Filter:
- **Product Name Search** (`productName`): Tìm kiếm theo tên sản phẩm
- **Status Filter** (`statusFilter`): Lọc theo trạng thái
- **Date Range Filter** (`fromDate`, `toDate`): Lọc theo khoảng thời gian
- **Business Filter** (`businessFilter`): Lọc theo cửa hàng

#### Cách hoạt động:

**Tương tự như Business CO2 Report nhưng có Business Filter thay vì Customer Filter:**
- `'all'`: Hiển thị tất cả cửa hàng
- ID cụ thể: Chỉ hiển thị transactions từ cửa hàng đó
- Gửi lên API qua parameter `businessId`

---

### 5. **Transaction History** (`transaction-history.tsx`)

#### Các Filter:
- **Status Filter** (`statusFilter`): Lọc theo trạng thái transaction

#### Cách hoạt động:

**Status Filter:**
- Các giá trị: `'all'`, `'borrowing'`, `'pending_pickup'`, `'completed'`
- Map sang API status:
  - `'borrowing'` → `'borrowing'`
  - `'pending_pickup'` → `'pending_pickup'`
  - `'completed'` → `'returned'` (API expects "returned" not "completed")
- Gửi lên API qua parameter `status`
- Re-fetch data khi filter thay đổi

**Code Logic:**
```typescript
const loadHistory = async () => {
  const params: any = { page: 1, limit: 50 };
  
  if (statusFilter !== "all") {
    const statusMap: { [key: string]: string } = {
      borrowing: "borrowing",
      pending_pickup: "pending_pickup",
      completed: "returned",
    };
    params.status = statusMap[statusFilter] || statusFilter;
  }
  
  const response = await borrowTransactionsApi.getCustomerHistory(params);
  // ...
};
```

---

### 6. **Customer Wallet** (`customer-wallet.tsx`)

#### Các Filter:
- **Transaction Filter** (`transactionFilter`): Lọc theo loại giao dịch

#### Cách hoạt động:

**Transaction Filter:**
- `'all'`: Hiển thị tất cả giao dịch
- `'external'`: Chỉ hiển thị giao dịch external (thẻ/tài khoản)
- `'internal'`: Chỉ hiển thị giao dịch internal (nội bộ hệ thống)

**Code Logic:**
- Filter được áp dụng client-side trên danh sách transactions đã load
- Filter theo trường `type` hoặc `transactionType` của transaction

---

## 📊 TỔNG KẾT

### Các Pattern Chung:

1. **Search Filters:**
   - Thường là text input với icon search
   - Case-insensitive matching
   - Có nút clear để xóa search query
   - Debounce cho API calls (nếu cần)

2. **Status Filters:**
   - Thường là chip buttons hoặc dropdown
   - Giá trị `'all'` để hiển thị tất cả
   - Có visual feedback (active state)

3. **Date Range Filters:**
   - Calendar picker cho việc chọn ngày
   - Format hiển thị rõ ràng
   - Có thể clear date range

4. **Price Filters:**
   - Chia thành các khoảng giá cụ thể
   - Dựa trên deposit value
   - Chỉ có ở customer screens (product browsing)

5. **Entity Filters (Customer/Business):**
   - Dynamic list từ data hiện có
   - Chip buttons với tên entity
   - Option "All" để hiển thị tất cả

6. **Distance-based Sorting:**
   - Chỉ có ở Stores List
   - Sử dụng Haversine formula
   - Yêu cầu user location permission

### Best Practices Được Áp Dụng:

- ✅ Sử dụng `useMemo` để optimize filter calculations
- ✅ Debounce cho search queries (tránh quá nhiều API calls)
- ✅ Clear visual feedback cho active filters
- ✅ Combine multiple filters (AND logic)
- ✅ Handle edge cases (empty search, no location, etc.)
- ✅ Responsive filter UI (horizontal scroll cho chips)



