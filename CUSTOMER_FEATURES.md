# TỔNG HỢP TẤT CẢ CHỨC NĂNG CUSTOMER VÀ VỊ TRÍ TRONG CODE

## 📋 MỤC LỤC
1. [Dashboard (Trang chủ)](#1-dashboard-trang-chủ)
2. [Wallet (Ví điện tử)](#2-wallet-ví-điện-tử)
3. [Stores (Cửa hàng)](#3-stores-cửa-hàng)
4. [Rewards (Phần thưởng)](#4-rewards-phần-thưởng)
5. [Profile (Hồ sơ)](#5-profile-hồ-sơ)
6. [Transaction History (Lịch sử giao dịch)](#6-transaction-history-lịch-sử-giao-dịch)
7. [AI Chat (Trợ lý AI)](#7-ai-chat-trợ-lý-ai)
8. [Leaderboard (Bảng xếp hạng)](#8-leaderboard-bảng-xếp-hạng)
9. [Feedbacks (Đánh giá)](#9-feedbacks-đánh-giá)
10. [CO2 Report (Báo cáo CO2)](#10-co2-report-báo-cáo-co2)
11. [Notifications (Thông báo)](#11-notifications-thông-báo)
12. [Settings (Cài đặt)](#12-settings-cài-đặt)
13. [Product Detail (Chi tiết sản phẩm)](#13-product-detail-chi-tiết-sản-phẩm)
14. [Store Detail (Chi tiết cửa hàng)](#14-store-detail-chi-tiết-cửa-hàng)
15. [Voucher Detail (Chi tiết voucher)](#15-voucher-detail-chi-tiết-voucher)
16. [Transaction Detail (Chi tiết giao dịch)](#16-transaction-detail-chi-tiết-giao-dịch)

---

## 1. DASHBOARD (TRANG CHỦ)

### 📍 Vị trí file:
- **File chính**: `app/(protected)/customer/customer-dashboard.tsx`
- **File layout**: `app/(protected)/customer/_layout.tsx`

### 🔧 Các chức năng chính:

#### 1.1. Hiển thị thông tin người dùng
- **Vị trí**: Dòng 35-184 trong `customer-dashboard.tsx`
- **Chức năng**:
  - Hiển thị lời chào theo thời gian (Good Morning/Afternoon/Evening)
  - Hiển thị tên người dùng
  - Hiển thị số dư ví (có thể ẩn/hiện)
  - Hiển thị rank xếp hạng từ leaderboard
  - Hiển thị điểm thưởng (reward points)
- **API sử dụng**: `getCurrentUserProfileWithAutoRefresh()`, `leaderboardApi.getMonthly()`

#### 1.2. QR Code Scanner
- **Vị trí**: Dòng 38-39, 253-350 trong `customer-dashboard.tsx`
- **Chức năng**:
  - Quét QR code sản phẩm
  - Hiển thị thông tin sản phẩm sau khi quét
  - Hỗ trợ đèn flash
  - Animation laser line khi quét
- **Thư viện**: `expo-camera`, `CameraView`

#### 1.3. Mượn sản phẩm (Borrow Product)
- **Vị trí**: Dòng 44, 250-500 trong `customer-dashboard.tsx`
- **Chức năng**:
  - Mượn sản phẩm sau khi quét QR
  - Chọn số ngày mượn (mặc định 30 ngày)
  - Tính toán phí đặt cọc (deposit)
  - Xử lý thanh toán deposit
- **API sử dụng**: `borrowTransactionsApi.borrow()`

#### 1.4. Quick Actions
- **Vị trí**: Dòng 993-1040 trong `customer-dashboard.tsx`
- **Chức năng**:
  - Nạp tiền vào ví (Deposit)
  - Tìm cửa hàng (Stores)
  - Kiểm tra chất lượng AI (AI Quality Check)
  - Xem phần thưởng (Rewards)

#### 1.5. AI Quality Check
- **Vị trí**: Dòng 41-42, 1015-1032, component `StandaloneAIChecker`
- **Chức năng**:
  - Kiểm tra chất lượng sản phẩm bằng AI
  - Đánh giá tình trạng sản phẩm (tốt/xấu)
- **Component**: `components/StandaloneAIChecker.tsx`

#### 1.6. Active Borrows
- **Vị trí**: Dòng 186-230 trong `customer-dashboard.tsx`
- **Chức năng**:
  - Hiển thị danh sách sản phẩm đang mượn
  - Hiển thị ngày đáo hạn (due date)
  - Nút gia hạn (extend) và hủy (cancel)
- **API sử dụng**: `borrowTransactionsApi.getMyActive()`

#### 1.7. Transaction Statistics
- **Vị trí**: Dòng 540-650 trong `customer-dashboard.tsx`
- **Chức năng**:
  - Hiển thị thống kê số lượng giao dịch
  - Tổng số sản phẩm đã mượn
  - Tổng số CO2 đã giảm

---

## 2. WALLET (VÍ ĐIỆN TỬ)

### 📍 Vị trí file:
- **File chính**: `app/(protected)/customer/customer-wallet.tsx`

### 🔧 Các chức năng chính:

#### 2.1. Hiển thị số dư ví
- **Vị trí**: Dòng 50-179 trong `customer-wallet.tsx`
- **Chức năng**:
  - Hiển thị số dư hiện tại (balance)
  - Số dư khả dụng (available balance)
  - Có thể ẩn/hiện số dư
- **API sử dụng**: `getCurrentUserProfileWithAutoRefresh()`, `walletApi.getDetails()`

#### 2.2. Nạp tiền (Add Funds)
- **Vị trí**: Dòng 71-72, 200-600 trong `customer-wallet.tsx`
- **Chức năng**:
  - Nhập số tiền cần nạp
  - Chọn phương thức thanh toán (VNPay, MoMo)
  - Tích hợp WebView để thanh toán
  - Xử lý callback từ cổng thanh toán
- **API sử dụng**: `walletApi.deposit()`
- **Payment**: VNPay, MoMo

#### 2.3. Rút tiền (Withdraw)
- **Vị trí**: Dòng 72-73, 600-800 trong `customer-wallet.tsx`
- **Chức năng**:
  - Rút tiền từ ví
  - Nhập số tiền rút
  - Xác nhận rút tiền
- **API sử dụng**: `walletApi.withdraw()`

#### 2.4. Lịch sử giao dịch ví
- **Vị trí**: Dòng 59-70, 800-1200 trong `customer-wallet.tsx`
- **Chức năng**:
  - Hiển thị danh sách giao dịch
  - Phân loại giao dịch (nạp/rút/nội bộ/bên ngoài)
  - Lọc theo loại giao dịch
  - Phân trang (pagination)
  - Tổng thu/chi
- **API sử dụng**: `walletTransactionsApi.getAll()`

#### 2.5. Chi tiết giao dịch
- **Vị trí**: Dòng 1200-1400 trong `customer-wallet.tsx`
- **Chức năng**:
  - Xem chi tiết từng giao dịch
  - Thông tin ngày giờ, số tiền, loại giao dịch

---

## 3. STORES (CỬA HÀNG)

### 📍 Vị trí file:
- **File chính**: `app/(protected)/customer/stores.tsx`
- **File chi tiết**: `app/(protected)/customer/store-detail/[id].tsx`

### 🔧 Các chức năng chính:

#### 3.1. Danh sách cửa hàng
- **Vị trí**: Dòng 32-192 trong `stores.tsx`
- **Chức năng**:
  - Hiển thị danh sách tất cả cửa hàng
  - Lọc theo trạng thái (tất cả/đang mở/gần nhất/xếp hạng cao)
  - Tìm kiếm cửa hàng
  - Phân trang
- **API sử dụng**: `businessesApi.getAll()`

#### 3.2. Bản đồ cửa hàng
- **Vị trí**: Dòng 50-55, 200-400 trong `stores.tsx`
- **Chức năng**:
  - Hiển thị bản đồ với vị trí các cửa hàng
  - Hiển thị vị trí hiện tại của người dùng
  - Marker cho từng cửa hàng
  - Tính khoảng cách từ vị trí người dùng đến cửa hàng
- **Thư viện**: `react-native-maps`, `expo-location`

#### 3.3. Chi tiết cửa hàng
- **Vị trí**: `app/(protected)/customer/store-detail/[id].tsx`
- **Chức năng**:
  - Thông tin chi tiết cửa hàng (tên, địa chỉ, giờ mở cửa)
  - Danh sách sản phẩm của cửa hàng
  - Lọc sản phẩm theo giá, danh mục
  - Tìm kiếm sản phẩm
  - Xem đánh giá của cửa hàng
  - Voucher của cửa hàng
  - Đăng ký trở thành business (nếu chủ cửa hàng)
- **API sử dụng**: `businessesApi.getById()`, `productsApi.getByBusinessId()`, `feedbackApi.getByBusinessId()`, `voucherApi.getByBusinessId()`

---

## 4. REWARDS (PHẦN THƯỞNG)

### 📍 Vị trí file:
- **File chính**: `app/(protected)/customer/rewards.tsx`
- **File chi tiết**: `app/(protected)/customer/voucher-detail/[id].tsx`

### 🔧 Các chức năng chính:

#### 4.1. Danh sách voucher khả dụng
- **Vị trí**: Dòng 55-250 trong `rewards.tsx`
- **Chức năng**:
  - Hiển thị voucher có thể đổi
  - Hiển thị điểm cần thiết để đổi
  - Lọc theo trạng thái (active/inactive/expired)
- **API sử dụng**: `voucherApi.getAll()`

#### 4.2. Voucher của tôi
- **Vị trí**: Dòng 62-250 trong `rewards.tsx`
- **Chức năng**:
  - Hiển thị voucher đã đổi
  - Trạng thái voucher (đã dùng/chưa dùng/hết hạn)
  - Mã voucher
- **API sử dụng**: `voucherApi.getMy()`

#### 4.3. Đổi voucher (Redeem)
- **Vị trí**: Dòng 66, 400-600 trong `rewards.tsx`
- **Chức năng**:
  - Đổi điểm lấy voucher
  - Kiểm tra đủ điểm
  - Xác nhận đổi voucher
- **API sử dụng**: `voucherApi.redeem()`

#### 4.4. Lịch sử đổi voucher
- **Vị trí**: Dòng 61, 600-800 trong `rewards.tsx`
- **Chức năng**:
  - Xem lịch sử đã đổi voucher
  - Voucher đã sử dụng

#### 4.5. Chi tiết voucher
- **Vị trí**: `app/(protected)/customer/voucher-detail/[id].tsx`
- **Chức năng**:
  - Thông tin chi tiết voucher
  - Mã QR code voucher
  - Ngày hết hạn
  - Điều kiện sử dụng
- **API sử dụng**: `voucherApi.getMy()`

---

## 5. PROFILE (HỒ SƠ)

### 📍 Vị trí file:
- **File chính**: `app/(protected)/customer/my-profile.tsx`

### 🔧 Các chức năng chính:

#### 5.1. Thông tin cá nhân
- **Vị trí**: Dòng 44-250 trong `my-profile.tsx`
- **Chức năng**:
  - Xem thông tin cá nhân (tên, email, số điện thoại, địa chỉ, ngày sinh)
  - Chỉnh sửa thông tin cá nhân
  - Upload ảnh đại diện
- **API sử dụng**: `getCurrentUserProfileWithAutoRefresh()`, `updateUserProfileWithAutoRefresh()`, `uploadAvatarWithAutoRefresh()`

#### 5.2. Shortcuts (Lối tắt)
- **Vị trí**: Dòng 298-348 trong `my-profile.tsx`
- **Chức năng**:
  - Nút truy cập nhanh:
    - My Wallet
    - Stores
    - Rewards
    - History
    - My Feedbacks
    - Leaderboard
    - AI Chat

#### 5.3. Đổi mật khẩu
- **Vị trí**: Dòng 61-68, 400-500 trong `my-profile.tsx`
- **Chức năng**:
  - Đổi mật khẩu
  - Xác thực mật khẩu cũ
  - Nhập mật khẩu mới
- **API sử dụng**: `authApi.changePassword()`

#### 5.4. Đăng ký Business
- **Vị trí**: Dòng 54-56, 270-300 trong `my-profile.tsx`
- **Chức năng**:
  - Đăng ký trở thành business owner
  - Xem lịch sử đăng ký business
  - Kiểm tra trạng thái đăng ký (pending/approved/rejected)
- **Component**: `BusinessRegisterModal`, `BusinessRegisterHistoryModal`
- **API sử dụng**: `businessApi.register()`, `businessApi.getRegistrationHistory()`

#### 5.5. Cài đặt ngôn ngữ
- **Vị trí**: Dòng 46, 500-600 trong `my-profile.tsx`
- **Chức năng**:
  - Chuyển đổi ngôn ngữ (Tiếng Việt/English)
- **Hook**: `useI18n()`

---

## 6. TRANSACTION HISTORY (LỊCH SỬ GIAO DỊCH)

### 📍 Vị trí file:
- **File chính**: `app/(protected)/customer/transaction-history.tsx`
- **File chi tiết**: `app/(protected)/customer/transaction-detail/[id].tsx`

### 🔧 Các chức năng chính:

#### 6.1. Danh sách giao dịch
- **Vị trí**: `app/(protected)/customer/transaction-history.tsx`
- **Chức năng**:
  - Hiển thị tất cả giao dịch mượn/trả
  - Lọc theo trạng thái (all/active/returned/overdue/cancelled)
  - Tìm kiếm giao dịch
  - Phân trang
  - Pull to refresh
- **API sử dụng**: `borrowTransactionsApi.getAll()`

#### 6.2. Gia hạn giao dịch (Extend)
- **Vị trí**: Trong `transaction-history.tsx`
- **Chức năng**:
  - Gia hạn thời gian mượn
  - Tính phí gia hạn
  - Xác nhận gia hạn
- **API sử dụng**: `borrowTransactionsApi.extend()`

#### 6.3. Hủy giao dịch (Cancel)
- **Vị trí**: Trong `transaction-history.tsx`
- **Chức năng**:
  - Hủy giao dịch mượn
  - Hoàn tiền deposit
- **API sử dụng**: `borrowTransactionsApi.cancel()`

#### 6.4. Chi tiết giao dịch
- **Vị trí**: `app/(protected)/customer/transaction-detail/[id].tsx`
- **Chức năng**:
  - Xem chi tiết giao dịch
  - Thông tin sản phẩm
  - Lịch sử giao dịch
  - Thông tin cửa hàng

---

## 7. AI CHAT (TRỢ LÝ AI)

### 📍 Vị trí file:
- **File chính**: `app/(protected)/customer/ai-chat.tsx`

### 🔧 Các chức năng chính:

#### 7.1. Chat với AI Assistant
- **Vị trí**: Dòng 47-550 trong `ai-chat.tsx`
- **Chức năng**:
  - Chat với trợ lý AI
  - Câu hỏi thường gặp (FAQ)
  - Phản hồi tự động
- **FAQ Topics**:
  - Cách trả container
  - Nơi có thể trả
  - Mất container thì sao
  - Cách kiếm điểm
  - Số tiền đặt cọc
  - Phí trễ hạn
  - Giờ mở cửa
  - Cách đăng ký
  - Phương thức thanh toán
  - Tính bền vững

#### 7.2. Typing Indicator
- **Vị trí**: Dòng 59, 200-250 trong `ai-chat.tsx`
- **Chức năng**:
  - Hiển thị indicator khi AI đang trả lời

---

## 8. LEADERBOARD (BẢNG XẾP HẠNG)

### 📍 Vị trí file:
- **File chính**: `app/(protected)/customer/leaderboard.tsx`

### 🔧 Các chức năng chính:

#### 8.1. Bảng xếp hạng theo tháng
- **Vị trí**: Dòng 33-900 trong `leaderboard.tsx`
- **Chức năng**:
  - Hiển thị top 100 người dùng
  - Xếp hạng theo điểm (points)
  - Hiển thị rank, tên, avatar, điểm
  - Highlight vị trí của người dùng hiện tại
- **API sử dụng**: `leaderboardApi.getMonthly()`

#### 8.2. Lọc theo tháng/năm
- **Vị trí**: Dòng 44-47, 200-300 trong `leaderboard.tsx`
- **Chức năng**:
  - Chọn tháng/năm để xem bảng xếp hạng
  - Mặc định tháng/năm hiện tại

#### 8.3. Thông tin người dùng
- **Vị trí**: Dòng 39-43, 50-63 trong `leaderboard.tsx`
- **Chức năng**:
  - Hiển thị rank của người dùng
  - Điểm số hiện tại
  - Pull to refresh

---

## 9. FEEDBACKS (ĐÁNH GIÁ)

### 📍 Vị trí file:
- **File chính**: `app/(protected)/customer/my-feedbacks.tsx`

### 🔧 Các chức năng chính:

#### 9.1. Danh sách đánh giá của tôi
- **Vị trí**: Dòng 18-425 trong `my-feedbacks.tsx`
- **Chức năng**:
  - Xem tất cả đánh giá đã gửi
  - Lọc theo điểm (1-5 sao)
  - Xóa đánh giá
  - Phân trang
  - Pull to refresh
- **API sử dụng**: `feedbackApi.getMy()`, `feedbackApi.delete()`

#### 9.2. Đánh giá cửa hàng
- **Vị trí**: Trong `store-detail/[id].tsx`
- **Chức năng**:
  - Xem đánh giá của cửa hàng
  - Đánh giá trung bình
  - Số lượng đánh giá
- **API sử dụng**: `feedbackApi.getByBusinessId()`

---

## 10. CO2 REPORT (BÁO CÁO CO2)

### 📍 Vị trí file:
- **File chính**: `app/(protected)/customer/customer-co2-report.tsx`

### 🔧 Các chức năng chính:

#### 10.1. Tổng lượng CO2 đã giảm
- **Vị trí**: Dòng 48-400 trong `customer-co2-report.tsx`
- **Chức năng**:
  - Hiển thị tổng CO2 đã giảm
  - Biểu đồ CO2 theo thời gian
  - Tính toán từ tất cả giao dịch
- **API sử dụng**: `borrowTransactionsApi.getAll()`

#### 10.2. Lọc theo điều kiện
- **Vị trí**: Dòng 64-75, 400-600 trong `customer-co2-report.tsx`
- **Chức năng**:
  - Lọc theo trạng thái
  - Lọc theo khoảng thời gian (từ ngày - đến ngày)
  - Lọc theo tên sản phẩm
  - Lọc theo cửa hàng

#### 10.3. Danh sách giao dịch CO2
- **Vị trí**: Dòng 600-1200 trong `customer-co2-report.tsx`
- **Chức năng**:
  - Hiển thị từng giao dịch kèm lượng CO2 giảm
  - Phân trang
  - Pull to refresh

---

## 11. NOTIFICATIONS (THÔNG BÁO)

### 📍 Vị trí file:
- **File chính**: `app/(protected)/customer/notifications.tsx`

### 🔧 Các chức năng chính:

#### 11.1. Danh sách thông báo
- **Vị trí**: Dòng 22-445 trong `notifications.tsx`
- **Chức năng**:
  - Hiển thị tất cả thông báo
  - Lọc thông báo chưa đọc/unread
  - Đánh dấu đã đọc
  - Xóa thông báo
  - Đánh dấu tất cả đã đọc
- **Context**: `NotificationProvider`
- **API sử dụng**: Qua `NotificationProvider` context

#### 11.2. Badge thông báo
- **Vị trí**: Component `NotificationBadge`
- **Chức năng**:
  - Hiển thị số thông báo chưa đọc
  - Cập nhật real-time

---

## 12. SETTINGS (CÀI ĐẶT)

### 📍 Vị trí file:
- **File chính**: `app/(protected)/customer/settings.tsx`

### 🔧 Các chức năng chính:

#### 12.1. Ngôn ngữ
- **Vị trí**: Dòng 19, 126-170 trong `settings.tsx`
- **Chức năng**:
  - Chuyển đổi ngôn ngữ (Tiếng Việt/English)

#### 12.2. Đổi mật khẩu
- **Vị trí**: Dòng 22-29, 73-115 trong `settings.tsx`
- **Chức năng**:
  - Đổi mật khẩu
  - Xác thực mật khẩu hiện tại
- **API sử dụng**: `authApi.changePassword()`

#### 12.3. Đăng xuất
- **Vị trí**: Dòng 59-67 trong `settings.tsx`
- **Chức năng**:
  - Đăng xuất tài khoản
  - Xóa token
- **API**: Qua `authActions.logout()`

---

## 13. PRODUCT DETAIL (CHI TIẾT SẢN PHẨM)

### 📍 Vị trí file:
- **File chính**: `app/(protected)/customer/product-detail/[id].tsx`

### 🔧 Các chức năng chính:

#### 13.1. Thông tin sản phẩm
- **Vị trí**: Dòng 22-923 trong `product-detail/[id].tsx`
- **Chức năng**:
  - Hiển thị chi tiết sản phẩm
  - Ảnh sản phẩm
  - Tên, mô tả
  - Giá đặt cọc (deposit)
  - Nhóm sản phẩm (product group)
- **API sử dụng**: `productsApi.scan()`, `productsApi.getByIdWithAutoRefresh()`

#### 13.2. Mượn sản phẩm
- **Vị trí**: Trong `product-detail/[id].tsx`
- **Chức năng**:
  - Nút mượn sản phẩm
  - Chọn số ngày mượn
  - Tính phí deposit
  - Thanh toán deposit
- **API sử dụng**: `borrowTransactionsApi.borrow()`

---

## 14. STORE DETAIL (CHI TIẾT CỬA HÀNG)

### 📍 Vị trí file:
- **File chính**: `app/(protected)/customer/store-detail/[id].tsx`

### 🔧 Các chức năng chính:

#### 14.1. Thông tin cửa hàng
- **Vị trí**: Dòng 40-3781 trong `store-detail/[id].tsx`
- **Chức năng**:
  - Tên, địa chỉ cửa hàng
  - Giờ mở cửa
  - Số điện thoại
  - Logo cửa hàng
  - Bản đồ vị trí

#### 14.2. Danh sách sản phẩm
- **Vị trí**: Trong `store-detail/[id].tsx`
- **Chức năng**:
  - Hiển thị sản phẩm của cửa hàng
  - Lọc theo danh mục
  - Lọc theo giá
  - Tìm kiếm sản phẩm
  - Load more (phân trang)
- **API sử dụng**: `productsApi.getByBusinessId()`

#### 14.3. Voucher của cửa hàng
- **Vị trí**: Trong `store-detail/[id].tsx`
- **Chức năng**:
  - Hiển thị voucher có sẵn
  - Đổi voucher
- **API sử dụng**: `voucherApi.getByBusinessId()`

#### 14.4. Đánh giá cửa hàng
- **Vị trí**: Trong `store-detail/[id].tsx`
- **Chức năng**:
  - Xem đánh giá của cửa hàng
  - Điểm trung bình
  - Danh sách đánh giá
- **API sử dụng**: `feedbackApi.getByBusinessId()`

---

## 15. VOUCHER DETAIL (CHI TIẾT VOUCHER)

### 📍 Vị trí file:
- **File chính**: `app/(protected)/customer/voucher-detail/[id].tsx`

### 🔧 Các chức năng chính:

#### 15.1. Thông tin voucher
- **Vị trí**: Dòng 58-625 trong `voucher-detail/[id].tsx`
- **Chức năng**:
  - Tên voucher
  - Mô tả
  - Phần trăm giảm giá
  - Mã voucher
  - QR code
  - Ngày hết hạn
  - Điều kiện sử dụng
- **API sử dụng**: `voucherApi.getMy()`

---

## 16. TRANSACTION DETAIL (CHI TIẾT GIAO DỊCH)

### 📍 Vị trí file:
- **File chính**: `app/(protected)/customer/transaction-detail/[id].tsx`

### 🔧 Các chức năng chính:

#### 16.1. Chi tiết giao dịch
- **Vị trí**: Trong `transaction-detail/[id].tsx`
- **Chức năng**:
  - Thông tin giao dịch
  - Thông tin sản phẩm
  - Thông tin cửa hàng
  - Trạng thái giao dịch
  - Ngày mượn, ngày hết hạn
  - Phí deposit
  - Lượng CO2 giảm
- **API sử dụng**: `borrowTransactionsApi.getById()`

---

## 📱 NAVIGATION LAYOUT

### 📍 Vị trí file:
- **File**: `app/(protected)/customer/_layout.tsx`

### 🔧 Chức năng:

#### Navigation Bottom Bar
- **Vị trí**: Dòng 170-257 trong `_layout.tsx`
- **Các tab**:
  1. Dashboard (Home)
  2. Wallet
  3. Stores
  4. Rewards
  5. Profile

#### Auto Role Check
- **Vị trí**: Dòng 19-168 trong `_layout.tsx`
- **Chức năng**:
  - Tự động kiểm tra role từ backend
  - Redirect nếu user là business/staff
  - Kiểm tra khi component mount và khi pathname thay đổi

---

## 🔌 API SERVICES SỬ DỤNG

### Các service chính:
1. **Auth Service**: `src/services/api/authService.ts`
   - Login, Register, Change Password, Forgot Password

2. **User Service**: `src/services/api/userService.ts`
   - Get Profile, Update Profile, Upload Avatar, Leaderboard

3. **Wallet Service**: `src/services/api/walletService.ts`
   - Get Wallet Details, Deposit, Withdraw, Transactions

4. **Business Service**: `src/services/api/businessService.ts`
   - Get All Businesses, Get By ID

5. **Product Service**: `src/services/api/productService.ts`
   - Scan QR, Get By ID, Get By Business ID

6. **Borrow Transaction Service**: `src/services/api/borrowTransactionService.ts`
   - Borrow, Return, Extend, Cancel, Get All, Get Active

7. **Voucher Service**: `src/services/api/voucherService.ts`
   - Get All, Get My, Redeem, Get By Business ID

8. **Feedback Service**: `src/services/api/feedbackService.ts`
   - Get My, Get By Business ID, Delete

9. **Notification Service**: `src/services/api/notificationService.ts`
   - Get All, Mark As Read, Delete

---

## 🎨 COMPONENTS SỬ DỤNG

1. **CustomerHeader**: `components/CustomerHeader.tsx`
2. **SimpleHeader**: `components/SimpleHeader.tsx`
3. **StandaloneAIChecker**: `components/StandaloneAIChecker.tsx`
4. **NotificationBadge**: `components/NotificationBadge.tsx`
5. **BusinessRegisterModal**: `components/BusinessRegisterModal.tsx`
6. **BusinessRegisterHistoryModal**: `components/BusinessRegisterHistoryModal.tsx`

---

## 📦 CONTEXT PROVIDERS

1. **AuthProvider**: `context/AuthProvider.tsx`
   - Quản lý authentication state
   - Access token, refresh token
   - User role

2. **NotificationProvider**: `context/NotificationProvider.tsx`
   - Quản lý thông báo
   - Real-time updates

3. **CartProvider**: `context/CartProvider.tsx`
   - Quản lý giỏ hàng (nếu có)

---

## 🔐 HOOKS SỬ DỤNG

1. **useAuth**: Hook để truy cập AuthProvider
2. **useI18n**: Hook cho đa ngôn ngữ
3. **useTokenRefresh**: Hook tự động refresh token
4. **useNotifications**: Hook cho notifications
5. **useToast**: Hook hiển thị toast messages
6. **useBusinessRoleCheck**: Hook kiểm tra business role

---

## 📝 GHI CHÚ

- Tất cả các màn hình đều có pull-to-refresh
- Hầu hết các danh sách đều có phân trang (pagination)
- Error handling được xử lý ở mọi API call
- Loading states được hiển thị khi fetch data
- Token refresh tự động khi hết hạn
- Responsive design cho mobile

---

**Cập nhật lần cuối**: 2024
**Phiên bản**: 1.0


