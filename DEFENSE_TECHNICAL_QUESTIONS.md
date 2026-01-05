# CÂU HỎI KỸ THUẬT BẢO VỆ ĐỒ ÁN BACK2USE
## (Dựa trên code thực tế của bạn)

---

## 🔐 1. AUTHENTICATION & TOKEN MANAGEMENT

### Q1.1: Trong code của bạn, bạn đã implement auto token refresh như thế nào? 
**Code liên quan:** `hooks/useTokenRefresh.ts`, `context/AuthProvider.tsx`

**Trả lời gợi ý:**
- Sử dụng hook `useTokenRefresh()` để tự động refresh token trước khi hết hạn 1 phút
- Tính toán thời gian: `timeUntilExpiry - 60000` (1 phút trước khi hết hạn)
- Sử dụng `setTimeout` để schedule refresh
- Gọi `actions.refreshToken()` từ AuthProvider khi đến thời điểm

**File tham khảo:** `hooks/useTokenRefresh.ts` dòng 18-31

---

### Q1.2: Bạn đã implement token provider pattern như thế nào để các API service có thể tự động lấy token?

**Code liên quan:** `src/services/api/client.ts`, `context/AuthProvider.tsx`

**Trả lời gợi ý:**
- Mỗi API service có function `setXxxTokenProvider` để set token provider
- Token provider được set trong `AuthProvider` useEffect (dòng 17-23)
- Các API service gọi `getCurrentAccessToken()` để lấy token, tự động được refresh nếu cần
- Pattern này giúp decouple API services khỏi AuthProvider

**Files:** 
- `context/AuthProvider.tsx` dòng 17-23
- `src/services/api/borrowTransactionService.ts` dòng 10-14

---

### Q1.3: Bạn xử lý token trong AsyncStorage và Context như thế nào khi app start?

**Code liên quan:** `src/features/auth/hooks/useAuth.ts`

**Trả lời gợi ý:**
- Hydrate auth state từ AsyncStorage khi component mount
- Đọc: AUTH, ROLE, ACCESS_TOKEN, REFRESH_TOKEN, TOKEN_EXPIRY
- Xử lý role có thể là array hoặc string
- Set state với `isHydrated: true` khi hoàn tất
- Có timeout check để đảm bảo không block UI

**File:** `src/features/auth/hooks/useAuth.ts` dòng 153-199

---

### Q1.4: Làm thế nào bạn prevent admin login trên mobile app?

**Code liên quan:** `src/features/auth/hooks/useAuth.ts`, `src/services/auth/googleAuthService.ts`

**Trả lời gợi ý:**
- Check role sau khi login thành công
- Nếu role === 'admin', throw error và không save tokens
- Error message: "Tài khoản Admin không thể đăng nhập trên ứng dụng di động"
- Áp dụng cho cả email/password login và Google OAuth

**Files:**
- `src/features/auth/hooks/useAuth.ts` dòng 489-493
- `src/services/auth/googleAuthService.ts` dòng 28-31

---

## 📱 2. QR CODE SCANNING

### Q2.1: Bạn đã implement laser line animation trong QR scanner như thế nào?

**Code liên quan:** `app/(protected)/customer/customer-dashboard.tsx`

**Trả lời gợi ý:**
- Sử dụng `useRef` và `setInterval` để tạo animation
- Update position mỗi 16ms (~60fps) để smooth animation
- Laser line di chuyển từ top đến bottom và ngược lại
- Sử dụng direction variable để đổi hướng
- Cleanup interval khi component unmount hoặc scanner đóng

**File:** `app/(protected)/customer/customer-dashboard.tsx` dòng 253-277

---

### Q2.2: Làm thế nào bạn prevent duplicate QR scans?

**Code liên quan:** `app/(protected)/customer/customer-dashboard.tsx`, `app/(protected)/business/transaction-processing.tsx`

**Trả lời gợi ý:**
- Sử dụng `useRef` để tạo scan lock: `scanLock.current`
- Set `scanLock.current = false` khi mở scanner
- Set `scanLock.current = true` ngay sau khi scan thành công
- Check lock trước khi xử lý scan result
- Reset lock khi đóng scanner

**Files:**
- `app/(protected)/customer/customer-dashboard.tsx` dòng 51, 224-241
- `app/(protected)/business/transaction-processing.tsx` dòng 133, nhiều nơi

---

### Q2.3: Bạn đã implement unified QR scanner cho cả borrow và return như thế nào?

**Code liên quan:** `app/(protected)/business/transaction-processing.tsx`

**Trả lời gợi ý:**
- Có state `unifiedScannerMode` với giá trị 'borrow' | 'return'
- Một scanner component nhưng xử lý khác nhau dựa trên mode
- Auto-detect mode từ URL params (`params.openQR`)
- Prevent auto-reopen với `userClosedScannerRef` khi user đóng thủ công
- Handle navigation params để auto-open scanner khi cần

**File:** `app/(protected)/business/transaction-processing.tsx` dòng 128-136, 600-800

---

## 💰 3. WALLET & PAYMENT

### Q3.1: Bạn đã xử lý payment callback từ VNPay/MoMo như thế nào trong WebView?

**Code liên quan:** `app/(protected)/customer/customer-wallet.tsx`

**Trả lời gợi ý:**
- Detect callback URL trong `onNavigationStateChange` của WebView
- Check URL pattern để xác định payment result
- Parse URL parameters để lấy transaction info
- Verify payment với backend API sau khi detect callback
- Sử dụng `callbackProcessedRef` để prevent duplicate processing
- Polling để verify payment nếu callback không reliable

**File:** `app/(protected)/customer/customer-wallet.tsx` dòng 400-600 (xem `handleWebViewNavigationStateChange`)

---

### Q3.2: Làm thế nào bạn handle wallet balance với cả `balance` và `availableBalance`?

**Code liên quan:** `app/(protected)/customer/customer-wallet.tsx`

**Trả lời gợi ý:**
- Backend có thể trả về `balance` hoặc `availableBalance`
- Sử dụng nullish coalescing: `availableBalance ?? balance ?? 0`
- Type assertion để handle different response formats
- Reload wallet data sau khi payment thành công
- Listen AppState change để reload khi app become active

**File:** `app/(protected)/customer/customer-wallet.tsx` dòng 139, 211-223

---

### Q3.3: Bạn đã implement payment verification polling như thế nào?

**Code liên quan:** `app/(protected)/customer/customer-wallet.tsx`

**Trả lời gợi ý:**
- Sử dụng `setInterval` để poll payment status
- Limit số lần retry với `paymentVerifyAttemptsRef`
- Clear interval khi payment verified hoặc timeout
- Show loading state trong quá trình verify
- Update wallet balance khi verification thành công

**File:** `app/(protected)/customer/customer-wallet.tsx` (tìm `verifyPaymentIntervalRef`)

---

## 🎯 4. PRODUCT RETURN & DAMAGE ASSESSMENT

### Q4.1: Bạn đã implement 6-face damage assessment như thế nào?

**Code liên quan:** `app/(protected)/business/transaction-processing.tsx`

**Trả lời gợi ý:**
- State `checkData` chứa 6 mặt: front, back, left, right, top, bottom
- Mỗi mặt có: image (URI) và issue (damage type)
- Upload image lên Cloudinary qua API `/borrow-transactions/{serialNumber}/check`
- Tính damage points dựa trên policy từ backend
- Xác định final condition (good/damaged) dựa trên total points

**File:** `app/(protected)/business/transaction-processing.tsx` dòng 109-125, 2653-2663

---

### Q4.2: Làm thế nào bạn calculate damage points và condition?

**Code liên quan:** `app/(protected)/business/transaction-processing.tsx`

**Trả lời gợi ý:**
- Load damage policy từ API `/borrow-transactions/damage-policy`
- Mỗi issue type có điểm số tương ứng
- Tính tổng điểm từ tất cả các mặt có damage
- So sánh với threshold để xác định condition
- Server cũng tính toán và trả về trong checkReturn response
- Ưu tiên dùng server calculation nếu có

**File:** `app/(protected)/business/transaction-processing.tsx` (tìm `calculateDamagePoints`, `loadDamagePolicy`)

---

### Q4.3: Bạn đã implement 2-step return process (check → confirm) như thế nào?

**Code liên quan:** `app/(protected)/business/transaction-processing.tsx`

**Trả lời gợi ý:**
- Step 1: `checkReturn` - Upload images, server tính toán damage, trả về preview
- Lưu `checkReturnResponse` để dùng cho step 2
- Step 2: `confirmReturn` - Gửi data từ step 1 + note (required) để xác nhận
- Server lưu tempImages từ Cloudinary, không cần upload lại
- Validation: Note phải được điền trước khi confirm

**File:** `app/(protected)/business/transaction-processing.tsx` dòng 2644-2732

---

### Q4.4: Tại sao bạn validate note phải được điền trong confirmReturn?

**Code liên quan:** `app/(protected)/business/transaction-processing.tsx` dòng 2643-2647

**Trả lời gợi ý:**
- Backend API yêu cầu note phải là string (không được undefined)
- Validate ở client-side trước khi gọi API để tránh lỗi 400
- Error handling hiển thị "You must fill in the note" thay vì technical error
- Đảm bảo note luôn là string (có thể là empty string)

**File:** `app/(protected)/business/transaction-processing.tsx` dòng 2643-2647, 2709-2716

---

## 🗺️ 5. MAPS & LOCATION

### Q5.1: Bạn đã implement distance calculation giữa user và stores như thế nào?

**Code liên quan:** `app/(protected)/customer/stores.tsx`

**Trả lời gợi ý:**
- Sử dụng Haversine formula để tính khoảng cách giữa 2 điểm
- Formula: `distance = 2 * R * atan2(√a, √(1-a))`
- Trong đó `a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlon/2)`
- R = 6371 km (bán kính Trái Đất)
- Kết quả trả về km, làm tròn 1-2 chữ số

**File:** `app/(protected)/customer/stores.tsx` dòng 216-234

---

### Q5.2: Làm thế nào bạn handle location permission và fallback location?

**Code liên quan:** `app/(protected)/customer/stores.tsx`

**Trả lời gợi ý:**
- Request permission với `Location.requestForegroundPermissionsAsync()`
- Nếu denied, hiển thị alert và dùng fallback location
- Fallback: District 1, Ho Chi Minh City (10.7769, 106.7009)
- Function `useFallbackLocation()` để set default location
- Vẫn load stores với fallback location

**File:** `app/(protected)/customer/stores.tsx` dòng 76-143

---

### Q5.3: Bạn đã implement pulsing animation cho user location marker như thế nào?

**Code liên quan:** `app/(protected)/customer/stores.tsx`

**Trả lời gợi ý:**
- Sử dụng `Animated.loop` và `Animated.sequence`
- Scale từ 1.0 đến 1.3 và ngược lại
- Duration 1000ms cho mỗi direction
- `useNativeDriver: true` cho performance
- Start animation khi component mount, stop khi unmount

**File:** `app/(protected)/customer/stores.tsx` dòng 194-212

---

## 🤖 6. AI QUALITY CHECKER

### Q6.1: Bạn đã implement StandaloneAIChecker component như thế nào?

**Code liên quan:** `components/StandaloneAIChecker.tsx`

**Trả lời gợi ý:**
- 3 steps: 'upload' → 'analyzing' → 'results'
- Yêu cầu upload đủ 6 images (Above, Below, Front, Back, Left, Right)
- Simulate AI analysis với progress bar (0-90%)
- Generate mock result với score 70-100, condition dựa trên score
- Hiển thị damages detected, recommendations, estimated lifespan

**File:** `components/StandaloneAIChecker.tsx` dòng 42-165

---

### Q6.2: Tại sao bạn simulate AI analysis thay vì gọi API thật?

**Code liên quan:** `components/StandaloneAIChecker.tsx` dòng 88-165

**Trả lời gợi ý:**
- Đây là prototype/demo feature
- AI service chưa được implement hoàn chỉnh ở backend
- Simulate để demo flow và UX
- Có thể dễ dàng thay thế bằng API call thật sau này
- Mock data giúp test UI flow mà không cần backend

**File:** `components/StandaloneAIChecker.tsx` dòng 105-156

---

## 🔄 7. STATE MANAGEMENT & DATA FLOW

### Q7.1: Bạn đã implement profile reload khi screen focus như thế nào?

**Code liên quan:** `app/(protected)/customer/customer-dashboard.tsx`

**Trả lời gợi ý:**
- Sử dụng `useFocusEffect` từ `@react-navigation/native`
- Check `PROFILE_UPDATED_TIMESTAMP` trong AsyncStorage
- Chỉ reload nếu profile được update trong 5 phút gần đây
- Reload user data để có latest balance, rank, etc.
- Prevent unnecessary API calls với timestamp check

**File:** `app/(protected)/customer/customer-dashboard.tsx` dòng 126-151

---

### Q7.2: Làm thế nào bạn handle pagination với "load more" pattern?

**Code liên quan:** `app/(protected)/customer/transaction-history.tsx`, `app/(protected)/business/transaction-processing.tsx`

**Trả lời gợi ý:**
- State: `page`, `hasMore`, `loadingMore`
- `onEndReached` của FlatList trigger load more
- `onEndReachedThreshold: 0.5` để load trước khi đến cuối
- Append new data vào existing list
- Reset pagination khi filter/search thay đổi
- Show loading footer khi loading more

**Files:**
- `app/(protected)/customer/transaction-history.tsx`
- `app/(protected)/customer/customer-wallet.tsx`

---

### Q7.3: Bạn đã implement silent error handling cho network errors như thế nào?

**Code liên quan:** Nhiều files, đặc biệt `app/(protected)/customer/customer-dashboard.tsx`

**Trả lời gợi ý:**
- Phân loại errors: network errors, token errors, validation errors, server errors
- Network errors: Không log ra UI, chỉ log warning, không crash app
- Token errors: Silent handle, user vẫn có thể sử dụng cached data
- 502 errors: Silent handle hoàn toàn
- Chỉ hiển thị errors quan trọng cho user

**Example:** `app/(protected)/customer/customer-dashboard.tsx` dòng 98-116

---

## 🎨 8. UI/UX PATTERNS

### Q8.1: Bạn đã implement show/hide balance feature như thế nào?

**Code liên quan:** `app/(protected)/customer/customer-dashboard.tsx`, `app/(protected)/customer/customer-wallet.tsx`

**Trả lời gợi ý:**
- State `showBalance: boolean` (default: false)
- Toggle button để show/hide
- Hiển thị "****" hoặc "••••" khi ẩn
- Lưu preference trong AsyncStorage (nếu cần)
- Privacy feature để bảo vệ thông tin tài chính

**Files:**
- `app/(protected)/customer/customer-dashboard.tsx` dòng 45
- `app/(protected)/customer/customer-wallet.tsx` dòng 74

---

### Q8.2: Làm thế nào bạn implement refresh control (pull-to-refresh)?

**Code liên quan:** Nhiều screens

**Trả lời gợi ý:**
- Sử dụng `RefreshControl` component từ React Native
- Wrap trong ScrollView hoặc FlatList
- `refreshing` state để track loading state
- `onRefresh` callback để reload data
- Custom colors: `colors={['#0F4D3A']}` matching app theme

**Example:** `app/(protected)/customer/rewards.tsx`, `app/(protected)/business/transaction-processing.tsx`

---

## 🔍 9. ERROR HANDLING & VALIDATION

### Q9.1: Bạn đã implement error handling cho "note must be a string" như thế nào?

**Code liên quan:** `app/(protected)/business/transaction-processing.tsx` dòng 2811-2816

**Trả lời gợi ý:**
- Validate ở client-side trước: Check note không empty
- Đảm bảo note luôn là string: `note: noteValue` (không phải undefined)
- Catch error và check error message/response message
- Hiển thị user-friendly message: "You must fill in the note"
- Không hiển thị technical errors cho user

**File:** `app/(protected)/business/transaction-processing.tsx` dòng 2643-2647, 2811-2830

---

### Q9.2: Làm thế nào bạn handle product not found khi scan QR?

**Code liên quan:** `app/(protected)/customer/customer-dashboard.tsx`

**Trả lời gợi ý:**
- Catch 404 error từ scan API
- Check xem product có đang được borrow không
- Nếu đang borrow, show message: "Product currently being borrowed"
- Nếu không tồn tại, show: "Product not found or unavailable"
- Handle gracefully, không crash app

**File:** `app/(protected)/customer/customer-dashboard.tsx` dòng 280-330

---

## 🚀 10. PERFORMANCE OPTIMIZATIONS

### Q10.1: Bạn đã optimize FlatList rendering như thế nào?

**Code liên quan:** Nhiều screens với FlatList

**Trả lời gợi ý:**
- Sử dụng `keyExtractor` với unique ID
- `removeClippedSubviews={true}` để remove off-screen items
- `maxToRenderPerBatch` và `windowSize` props
- Memoize `renderItem` function với `useCallback`
- Avoid inline functions trong renderItem

**Files:** Tất cả screens với FlatList (transaction-history, stores, rewards, etc.)

---

### Q10.2: Làm thế nào bạn prevent unnecessary re-renders?

**Code liên quan:** Nhiều components

**Trả lời gợi ý:**
- `useCallback` cho functions được pass vào children
- `useMemo` cho expensive calculations
- `React.memo` cho components (nếu cần)
- Avoid creating objects/arrays trong render
- Proper dependency arrays trong hooks

**Examples:** 
- `app/(protected)/customer/customer-dashboard.tsx` dòng 63 (useCallback)
- `app/(protected)/customer/stores.tsx` dòng 298 (useMemo)

---

## 📊 11. DATA FILTERING & SEARCH

### Q11.1: Bạn đã implement filtering và search cho stores như thế nào?

**Code liên quan:** `app/(protected)/customer/stores.tsx`

**Trả lời gợi ý:**
- State: `searchQuery`, `activeFilter` (all, open-now, nearest, top-rated)
- `useMemo` để filter stores dựa trên search và filter
- Search: Case-insensitive match với `materialName` và `description`
- Filter: Xử lý logic khác nhau cho mỗi filter type
- Combine search và filter: `filteredStores = stores.filter(...search...).filter(...filter...)`

**File:** `app/(protected)/customer/stores.tsx` dòng 298-350 (tìm `filteredStores`)

---

### Q11.2: Làm thế nào bạn implement date range filtering?

**Code liên quan:** `app/(protected)/customer/customer-co2-report.tsx`, `app/(protected)/customer/transaction-history.tsx`

**Trả lời gợi ý:**
- State: `fromDate`, `toDate` (ISO string format)
- Date picker hoặc calendar component
- Validate: fromDate <= toDate
- Send to API: `fromDate`, `toDate` query params
- Reset filters button
- Format dates cho display (DD/MM/YYYY)

**Files:**
- `app/(protected)/customer/customer-co2-report.tsx` dòng 65-75
- `app/(protected)/customer/transaction-history.tsx`

---

## 🔔 12. NOTIFICATIONS

### Q12.1: Bạn đã implement notification system như thế nào?

**Code liên quan:** `context/NotificationProvider.tsx`, `app/(protected)/customer/notifications.tsx`

**Trả lời gợi ý:**
- NotificationProvider context để manage global notification state
- Load notifications từ API
- Real-time updates với WebSocket (nếu có) hoặc polling
- Mark as read, delete, mark all as read functions
- Badge count cho unread notifications
- Filter: all / unread

**Files:**
- `context/NotificationProvider.tsx`
- `app/(protected)/customer/notifications.tsx`

---

## 🎯 13. BUSINESS LOGIC SPECIFIC

### Q13.1: Bạn đã implement borrow transaction flow như thế nào?

**Code liên quan:** `app/(protected)/customer/customer-dashboard.tsx`, `src/services/api/borrowTransactionService.ts`

**Trả lời gợi ý:**
- Scan QR → Get product info → Show product modal
- Select duration (mặc định 30 ngày)
- Calculate deposit amount
- Check wallet balance
- Create borrow transaction với API
- Deduct deposit từ wallet
- Update product status

**Flow:**
1. Scan QR (`productsApi.scan`)
2. Show product modal với deposit info
3. User confirm → `borrowTransactionsApi.create`
4. Success → Reload wallet, show transaction

**Files:**
- `app/(protected)/customer/customer-dashboard.tsx` (scan → borrow flow)
- `src/services/api/borrowTransactionService.ts` (create function)

---

### Q13.2: Làm thế nào bạn calculate CO2 reduction?

**Code liên quan:** `app/(protected)/customer/customer-co2-report.tsx`

**Trả lời gợi ý:**
- Mỗi transaction có `co2Changed` hoặc `co2Reduced` field từ backend
- Sum tất cả transactions để get total CO2 reduced
- Filter theo date range, status, product, business
- Display trong chart và list
- Format: "X.X kg CO₂" hoặc grams

**File:** `app/(protected)/customer/customer-co2-report.tsx`

---

### Q13.3: Bạn đã implement leaderboard system như thế nào?

**Code liên quan:** `app/(protected)/customer/leaderboard.tsx`, `app/(protected)/customer/customer-dashboard.tsx`

**Trả lời gợi ý:**
- Load monthly leaderboard từ API `/monthly-leaderboards`
- Filter theo month/year
- Top 100 users
- Calculate user rank: Tìm user trong leaderboard data
- Display rank, name, avatar, points
- Highlight current user
- Refresh khi month/year thay đổi

**Files:**
- `app/(protected)/customer/leaderboard.tsx`
- `app/(protected)/customer/customer-dashboard.tsx` dòng 74-97

---

## 🛠️ 14. CODE QUALITY & ARCHITECTURE

### Q14.1: Tại sao bạn có 2 API service structures (`lib/api.ts` và `src/services/api/`)?

**Code liên quan:** `lib/api.ts`, `src/services/api/`

**Trả lời gợi ý:**
- `lib/api.ts`: Legacy code, đang migration
- `src/services/api/`: New structure, better organization
- New structure: Mỗi domain có service riêng (authService, userService, etc.)
- Better type safety, token provider pattern
- Gradually migrate từ lib/api.ts sang src/services/api/

**Files:**
- `lib/api.ts` (legacy)
- `src/services/api/authService.ts` (new)
- `src/services/api/userService.ts` (new)

---

### Q14.2: Bạn đã organize types như thế nào?

**Code liên quan:** `src/types/`

**Trả lời gợi ý:**
- Separate file cho mỗi domain: `auth.types.ts`, `business.types.ts`, `product.types.ts`
- Export types từ `src/types/index.ts` để easy import
- Reusable types cho API requests/responses
- Type safety cho tất cả API calls

**Files:**
- `src/types/auth.types.ts`
- `src/types/business.types.ts`
- `src/types/product.types.ts`

---

## 🔒 15. SECURITY IMPLEMENTATIONS

### Q15.1: Làm thế nào bạn secure API calls?

**Code liên quan:** `src/services/api/client.ts`

**Trả lời gợi ý:**
- JWT token trong Authorization header
- Token được add tự động qua axios interceptor
- HTTPS cho tất cả requests
- Timeout cho requests (REQUEST_TIMEOUT)
- Token refresh khi hết hạn
- Không log sensitive data

**File:** `src/services/api/client.ts` dòng 63-87

---

### Q15.2: Bạn đã validate user input như thế nào?

**Code liên quan:** Nhiều screens

**Trả lời gợi ý:**
- Client-side validation trước khi gọi API
- Check required fields, format (email, phone), range (amount > 0)
- Show user-friendly error messages
- Backend validation là source of truth
- Validate date formats, number formats

**Examples:**
- Email validation: Regex pattern
- Amount validation: > 0, isNumber
- Date validation: Format check
- Required fields: Not empty check

---

## 📝 CÂU HỎI TỔNG HỢP

### Q16.1: Những khó khăn lớn nhất bạn gặp khi develop app này là gì? Cách giải quyết?

**Gợi ý trả lời:**
1. **Payment callback handling**: Phức tạp với WebView navigation state
   - Solution: Use `onNavigationStateChange`, detect callback URL pattern, verify với backend

2. **Token refresh race condition**: Multiple API calls cùng lúc có thể trigger nhiều refresh
   - Solution: Token provider pattern, centralized refresh logic

3. **State synchronization**: Wallet balance không update sau payment
   - Solution: AppState listener, reload khi app become active, polling verification

4. **QR scanner duplicate scans**: Scan nhiều lần cùng một code
   - Solution: Scan lock với useRef

---

### Q16.2: Nếu có thêm thời gian, bạn sẽ improve những gì?

**Gợi ý trả lời:**
1. **Testing**: Unit tests, integration tests
2. **Performance**: More optimizations, lazy loading
3. **Offline mode**: Cache data, queue actions
4. **Real-time**: WebSocket cho notifications, transaction updates
5. **AI integration**: Connect real AI API thay vì mock
6. **Analytics**: Track user behavior, errors
7. **Code cleanup**: Complete migration từ lib/api.ts

---

### Q16.3: Bạn đã apply design patterns nào trong code?

**Gợi ý trả lời:**
1. **Provider Pattern**: AuthProvider, NotificationProvider
2. **Token Provider Pattern**: Decouple API services khỏi auth
3. **Custom Hooks**: useTokenRefresh, useI18n, useAuth
4. **Service Layer**: API services separation
5. **Repository Pattern**: (implicit trong service layer)

---

## ✅ CHECKLIST CHUẨN BỊ BẢO VỆ

### Trước khi bảo vệ:
- [ ] Review lại các file quan trọng
- [ ] Test lại các chức năng chính
- [ ] Chuẩn bị demo flow: Login → Scan → Borrow → Return
- [ ] Review lại architecture và design decisions
- [ ] Chuẩn bị giải thích các technical choices

### Trong buổi bảo vệ:
- [ ] Giải thích rõ ràng, tự tin
- [ ] Mở code để demo implementation
- [ ] Thừa nhận limitations nếu có
- [ ] Discuss về improvements trong tương lai
- [ ] Show understanding về React Native best practices

---

**Chúc bạn bảo vệ thành công! 🎓🚀**
