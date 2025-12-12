# 🔍 Notification Debug Checklist

## ✅ Đã cải thiện trong code

1. **Response Parsing** - Đã thêm recursive parsing để handle nested structures
2. **Validation** - Đã thêm `isValidNotification()` để validate notification structure
3. **Debug Logs** - Đã thêm extensive logging ở mọi bước
4. **Zustand Store** - Đã đảm bảo luôn tạo new array reference để trigger re-render
5. **Socket Events** - Đã thêm `onAny` handler để catch tất cả events

## 📋 Checklist Debug

### 1. Kiểm tra Authentication
- [ ] Mở console/logs
- [ ] Tìm log: `📬 NotificationProvider: Effect triggered`
- [ ] Kiểm tra: `isAuthenticated: true`, `isHydrated: true`
- [ ] Kiểm tra: `userId` có giá trị không null

**Nếu userId = null:**
- User chưa đăng nhập hoặc AuthProvider chưa load xong
- Đợi vài giây hoặc refresh app

### 2. Kiểm tra API Response
- [ ] Tìm log: `📬 ========== LOAD NOTIFICATIONS START ==========`
- [ ] Tìm log: `📬 Full API Response:`
- [ ] Tìm log: `📬 ========== PARSING RESPONSE ==========`
- [ ] Kiểm tra: `📬 Response data keys:` - xem structure thực tế
- [ ] Tìm log: `✅ Found array with X items` - có tìm thấy array không?

**Nếu không tìm thấy array:**
- Response structure khác với expected
- Copy log `📬 Response data structure:` và gửi cho dev để fix parsing

**Nếu tìm thấy array nhưng rỗng:**
- Backend chưa có notifications cho user này
- Test bằng cách tạo notification từ backend

### 3. Kiểm tra Zustand Store
- [ ] Tìm log: `📬 ========== ZUSTAND STORE STATE ==========`
- [ ] Kiểm tra: `📬 Store notifications count:` - có > 0 không?
- [ ] Kiểm tra: `📬 Store unread count:` - có đúng không?

**Nếu store count = 0 nhưng API trả về data:**
- Có thể là Zustand không trigger re-render
- Kiểm tra log: `✅ SET NOTIFICATIONS DONE:` - có log này không?

### 4. Kiểm tra Socket Connection
- [ ] Tìm log: `📬 Initializing socket with:`
- [ ] Tìm log: `📬 Socket connected, registering and finding notifications`
- [ ] Kiểm tra: `socketService.isConnected()` = true

**Nếu socket không connect:**
- Kiểm tra network connection
- Kiểm tra backend socket server có chạy không
- Kiểm tra token có valid không

### 5. Kiểm tra Socket Events
- [ ] Tìm log: `🔍 ========== SOCKET ANY EVENT ==========`
- [ ] Khi có notification mới, có log này không?
- [ ] Kiểm tra: `🔍 Event name:` - backend emit event tên gì?
- [ ] Kiểm tra: `🔍 Payload:` - payload structure như thế nào?

**Nếu không thấy socket event:**
- Backend có thể không emit event
- Hoặc emit vào room khác
- Kiểm tra backend code xem emit event nào

**Nếu thấy event nhưng không add notification:**
- Kiểm tra log: `🔍 Is notification event (by name):` và `🔍 Has notification structure:`
- Nếu cả 2 đều false → payload không match notification structure
- Cần sửa logic detection trong `onAny` handler

### 6. Kiểm tra UI Components
- [ ] Mở màn hình có `NotificationBadge`
- [ ] Tìm log: `📬 NotificationBadge: notifications count:`
- [ ] Kiểm tra badge có hiện số unread không?

**Nếu badge không hiện:**
- Kiểm tra component có render không
- Kiểm tra `unreadCount > 0` không
- Kiểm tra style có ẩn badge không

### 7. Kiểm tra Notification Screen
- [ ] Mở màn hình `/(protected)/customer/notifications`
- [ ] Tìm log: `📬 Notifications Screen: Context notifications count:`
- [ ] Kiểm tra list có render không?

**Nếu list rỗng:**
- Kiểm tra `filteredNotifications.length`
- Kiểm tra filter có đang filter hết không
- Kiểm tra FlatList có render đúng không

## 🐛 Common Issues & Solutions

### Issue 1: API trả về data nhưng UI không hiện
**Nguyên nhân:** Zustand không trigger re-render
**Giải pháp:** Đã fix bằng cách clone array: `setNotifications([...notificationsList])`

### Issue 2: Socket không nhận được event
**Nguyên nhân:** Backend emit event tên khác
**Giải pháp:** Đã thêm `onAny` handler để catch tất cả events

### Issue 3: Response structure không match
**Nguyên nhân:** Backend trả về structure khác
**Giải pháp:** Đã thêm recursive parsing để handle nested structures

### Issue 4: Notification không valid
**Nguyên nhân:** Payload thiếu required fields
**Giải pháp:** Đã thêm validation và normalization

## 📝 Debug Commands

### Test API trực tiếp
```bash
# Replace {userId} với actual user ID
curl -X GET "http://your-api-url/notifications/receiver/{userId}?page=1&limit=100" \
  -H "Authorization: Bearer {token}"
```

### Test Socket connection
- Mở app mobile
- Xem console logs
- Tìm log: `📬 Socket connected`

### Test Notification creation
- Tạo notification từ backend
- Xem console logs
- Tìm log: `🔍 ========== SOCKET ANY EVENT ==========`

## 🎯 Next Steps

1. Chạy app và mở console logs
2. Follow checklist từ trên xuống
3. Copy các logs quan trọng
4. Nếu vẫn không work, gửi logs cho dev để debug tiếp

## 📞 Support

Nếu vẫn gặp vấn đề sau khi follow checklist:
1. Copy tất cả logs từ console
2. Ghi lại steps đã làm
3. Ghi lại expected vs actual behavior
4. Gửi cho dev team để investigate

