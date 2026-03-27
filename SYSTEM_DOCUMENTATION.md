# Tài liệu Hệ thống Backend & Database — FADA LOGICTIS AIR

> Phiên bản hệ thống: v2.4  
> Công nghệ: Next.js 15, Prisma ORM, SQLite, NextAuth.js  
> Mục đích: Quản lý vận tải hàng không (CRM nội bộ)

---

## Mục lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Hệ thống Database](#2-hệ-thống-database)
3. [Hệ thống xác thực (Auth)](#3-hệ-thống-xác-thực)
4. [Phân quyền theo vai trò (RBAC)](#4-phân-quyền-theo-vai-trò)
5. [Toàn bộ API Backend](#5-toàn-bộ-api-backend)
6. [Quy trình nghiệp vụ chính](#6-quy-trình-nghiệp-vụ-chính)
7. [Vận hành & Bảo trì](#7-vận-hành--bảo-trì)

---

## 1. Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────┐
│                   Trình duyệt (Client)               │
│          React + Tailwind CSS + Next.js App Router   │
└────────────────────────┬────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────┐
│              Next.js Server (Port 5000)              │
│                                                      │
│  ┌─────────────────┐   ┌──────────────────────────┐ │
│  │   Middleware.ts  │   │   API Route Handlers     │ │
│  │ (Kiểm tra auth  │   │  /app/api/...            │ │
│  │  cho mọi route) │   │  (23 endpoints)          │ │
│  └─────────────────┘   └──────────┬───────────────┘ │
│                                   │                  │
│  ┌────────────────────────────────▼───────────────┐ │
│  │               Prisma ORM (lib/prisma.ts)        │ │
│  └────────────────────────────────┬───────────────┘ │
└───────────────────────────────────┼─────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────┐
│              SQLite Database (prisma/dev.db)          │
│           (11 bảng dữ liệu)                          │
└─────────────────────────────────────────────────────┘
```

**Luồng xử lý mỗi request:**
1. Request từ browser → Middleware kiểm tra JWT token
2. Nếu chưa đăng nhập → Chuyển hướng về `/login`
3. Nếu đã đăng nhập → Request đến API handler
4. API handler kiểm tra quyền theo vai trò (role)
5. Truy vấn database qua Prisma
6. Trả kết quả về client dưới dạng JSON

---

## 2. Hệ thống Database

**Loại CSDL:** SQLite (file `prisma/dev.db`)  
**ORM:** Prisma 5.x  
**File schema:** `prisma/schema.prisma`

### Sơ đồ quan hệ các bảng

```
User ──────────────────────────────────────────────────┐
│ (nhân viên hệ thống)                                  │
│                                                       │
├──[roleId]──► Role                                     │
│              (vai trò tùy chỉnh)                      │
│                                                       │
├──[1:N]──► Customer ──────────────────────────────┐   │
│            (khách hàng)                           │   │
│            ├── userId (sales phụ trách)           │   │
│            └── personInChargeId (người quản lý)   │   │
│                                                   │   │
├──[1:N]──► Booking ────────────────────────────┐  │   │
│            (đơn hàng vận chuyển)              │  │   │
│            ├── customerId ───────────────────►┘  │   │
│            ├── salesId ──────────────────────────┘   │
│            ├── flightId ──► Flight                   │
│            │                (chuyến bay)             │
│            ├──[1:N]──► Invoice                       │
│            │            (hóa đơn)                    │
│            └──[1:N]──► Package                       │
│                         (kiện hàng)                  │
│                                                       │
└──[1:N]──► ActivityLog                                │
             (nhật ký hoạt động)                       │
                                                       │
PasswordResetToken ──[userId]──────────────────────────┘
EmailTemplate (độc lập — mẫu email)
AppSetting    (độc lập — cấu hình hệ thống, 1 bản ghi)
```

---

### Chi tiết từng bảng

#### Bảng `User` — Nhân viên hệ thống

| Cột | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| `id` | String (cuid) | ✅ | Khóa chính, tự sinh |
| `name` | String | ❌ | Họ tên nhân viên |
| `email` | String (unique) | ✅ | Email đăng nhập, không trùng |
| `password` | String | ✅ | Mật khẩu đã mã hóa bcrypt |
| `role` | String | ✅ | Vai trò: `ADMIN`, `DIRECTOR`, `CS`, `ACCOUNTING`, `SALE` |
| `roleId` | String | ❌ | ID vai trò tùy chỉnh (liên kết bảng Role) |
| `avatar` | String | ❌ | URL ảnh đại diện |
| `commissionRate` | Float | ✅ | Tỷ lệ hoa hồng (%), mặc định 0 |
| `createdAt` | DateTime | ✅ | Ngày tạo tài khoản |
| `updatedAt` | DateTime | ✅ | Ngày cập nhật gần nhất |

**Ghi chú:** Mật khẩu được mã hóa bằng `bcryptjs` với salt 10 rounds. Không bao giờ lưu mật khẩu thô.

---

#### Bảng `Role` — Vai trò tùy chỉnh

| Cột | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| `id` | String (cuid) | ✅ | Khóa chính |
| `name` | String (unique) | ✅ | Tên vai trò, không trùng |
| `description` | String | ❌ | Mô tả vai trò |
| `permissions` | String | ✅ | JSON array các quyền hạn |
| `createdAt` | DateTime | ✅ | Ngày tạo |
| `updatedAt` | DateTime | ✅ | Ngày cập nhật |

---

#### Bảng `Customer` — Khách hàng

| Cột | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| `id` | String (cuid) | ✅ | Khóa chính |
| `name` | String | ✅ | Tên công ty / khách hàng |
| `email` | String (unique) | ✅ | Email liên lạc |
| `phone` | String | ❌ | Số điện thoại |
| `contact` | String | ❌ | Tên người liên hệ |
| `industry` | String | ❌ | Ngành nghề |
| `taxCode` | String | ❌ | Mã số thuế |
| `address` | String | ❌ | Địa chỉ |
| `status` | String | ✅ | Trạng thái: `active`, `inactive` |
| `isApproved` | Boolean | ✅ | Đã duyệt chưa (mặc định: false) |
| `tier` | String | ✅ | Phân loại: `POTENTIAL`, `CONVERTED` |
| `userId` | String | ❌ | Sales tạo khách hàng (FK → User) |
| `personInChargeId` | String | ❌ | Người phụ trách (FK → User) |

**Quy tắc:**
- Khi Sales tạo → `isApproved = false`, chờ Director/Admin duyệt
- Khi Director/Admin tạo → `isApproved = true`, tự động duyệt
- Khi có booking đầu tiên → tự động cập nhật `tier` từ `POTENTIAL` → `CONVERTED`

---

#### Bảng `Booking` — Đơn hàng vận chuyển

| Cột | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| `id` | String (cuid) | ✅ | Khóa chính |
| `reference` | String (unique) | ✅ | Mã tham chiếu đơn hàng |
| `awbNumber` | String | ❌ | Số Air Waybill |
| `customerId` | String | ✅ | FK → Customer |
| `salesId` | String | ❌ | FK → User (nhân viên sales) |
| `flightId` | String | ❌ | FK → Flight (chuyến bay) |
| `origin` | String | ✅ | Sân bay xuất phát |
| `destination` | String | ✅ | Sân bay đến |
| `status` | String | ✅ | `pending`, `accepted`, `rejected`, `cancelled` |
| `approvalStatus` | String | ✅ | `PENDING`, `APPROVED`, `REJECTED` |
| `paymentStatus` | String | ✅ | `UNPAID`, `PARTIAL`, `PAID` |
| `amountPaid` | Float | ✅ | Số tiền đã thanh toán |
| `pieces` | Int | ✅ | Số kiện hàng |
| `weight` | Float | ✅ | Trọng lượng thực (kg) |
| `chargeableWeight` | Float | ✅ | Trọng lượng tính cước (kg) |
| `volume` | Float | ✅ | Thể tích (m³) |
| `freightRevenue` | Float | ✅ | Doanh thu cước vận chuyển |
| `surcharge` | Float | ✅ | Phụ phí |
| `otherFees` | Float | ✅ | Phí khác |
| `totalRevenue` | Float | ✅ | Tổng doanh thu |
| `totalCost` | Float | ✅ | Tổng chi phí |
| `commission` | Float | ✅ | Hoa hồng nhân viên |
| `shipper` | String | ❌ | Tên người gửi |
| `cargoType` | String | ❌ | Loại hàng hóa |
| `service` | String | ❌ | Dịch vụ vận chuyển |
| `shipDate` | DateTime | ❌ | Ngày xuất hàng |
| `etd` | DateTime | ❌ | Ngày khởi hành dự kiến |
| `eta` | DateTime | ❌ | Ngày đến dự kiến |
| `senderName/Phone/Country/...` | String | ❌ | Thông tin người gửi |
| `recipientName/Phone/Country/...` | String | ❌ | Thông tin người nhận |

**Công thức tính hoa hồng:**
```
profit = totalRevenue - totalCost
commission = profit > 0 ? profit × commissionRate : 0
```

---

#### Bảng `Invoice` — Hóa đơn

| Cột | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| `id` | String (cuid) | ✅ | Khóa chính |
| `invoiceNo` | String (unique) | ✅ | Số hóa đơn |
| `bookingId` | String | ❌ | FK → Booking |
| `amount` | Float | ✅ | Số tiền |
| `currency` | String | ✅ | Tiền tệ (mặc định: `VND`) |
| `status` | String | ✅ | `unpaid`, `paid`, `overdue` |
| `dueDate` | DateTime | ❌ | Hạn thanh toán |
| `paidDate` | DateTime | ❌ | Ngày thanh toán thực tế |

**Tự động đồng bộ với Booking:** Mỗi khi cập nhật trạng thái hóa đơn → hệ thống tự tính lại `amountPaid` và cập nhật `paymentStatus` của Booking tương ứng:
- Tổng paid = totalRevenue → `PAID`
- 0 < Tổng paid < totalRevenue → `PARTIAL`
- Tổng paid = 0 → `UNPAID`

---

#### Bảng `Flight` — Chuyến bay

| Cột | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| `id` | String (cuid) | ✅ | Khóa chính |
| `flightNo` | String (unique) | ✅ | Số hiệu chuyến bay |
| `airline` | String | ✅ | Hãng hàng không |
| `origin` | String | ✅ | Điểm xuất phát |
| `destination` | String | ✅ | Điểm đến |
| `departure` | String | ✅ | Giờ khởi hành |
| `arrival` | String | ✅ | Giờ đến |
| `capacity` | Int | ✅ | Sức chứa (mặc định: 100 tấn) |
| `status` | String | ✅ | `on_time`, `delayed`, `cancelled` |
| `type` | String | ✅ | Loại: `Cargo`, `Passenger` |
| `frequency` | String | ❌ | Tần suất bay |

---

#### Bảng `Package` — Kiện hàng (con của Booking)

| Cột | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| `id` | String (cuid) | ✅ | Khóa chính |
| `bookingId` | String | ✅ | FK → Booking (xóa cascade) |
| `packagingType` | String | ✅ | Loại đóng gói: Carton, Pallet, Roll... |
| `weight` | Float | ✅ | Trọng lượng kiện (kg) |
| `length/width/height` | Float | ❌ | Kích thước (cm) |
| `description` | String | ❌ | Mô tả hàng hóa |

---

#### Bảng `ActivityLog` — Nhật ký hoạt động

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | String (cuid) | Khóa chính |
| `action` | String | Hành động: `CREATE`, `UPDATE`, `DELETE` |
| `entityType` | String | Đối tượng: `CUSTOMER`, `BOOKING`, `INVOICE`, `USER` |
| `entityId` | String | ID của đối tượng bị tác động |
| `userId` | String | FK → User (ai thực hiện) |
| `details` | String | JSON chi tiết thay đổi |
| `createdAt` | DateTime | Thời điểm thực hiện |

---

#### Bảng `AppSetting` — Cấu hình hệ thống

Chỉ có **1 bản ghi duy nhất** với `id = "global"`.

| Cột | Mô tả |
|-----|-------|
| `systemName` | Tên hệ thống (mặc định: LOGICTIS AIR) |
| `logoUrl` | URL logo công ty |
| `companyName` | Tên công ty |
| `companyAddress` | Địa chỉ |
| `companyPhone` | Số điện thoại |
| `companyEmail` | Email công ty |
| `companyTaxCode` | Mã số thuế |
| `companyBankInfo` | Thông tin ngân hàng |
| `companyCountry/State/City` | Quốc gia/Tỉnh/Thành phố |

---

#### Bảng `EmailTemplate` — Mẫu email

| Cột | Mô tả |
|-----|-------|
| `name` | Tên mẫu (unique), ví dụ: `INVOICE` |
| `subject` | Tiêu đề email (hỗ trợ biến `{{reference}}`) |
| `body` | Nội dung HTML |
| `type` | Phân loại: `INVOICE`, `BOOKING_CONFIRMATION`... |

---

#### Bảng `PasswordResetToken` — Token đặt lại mật khẩu

| Cột | Mô tả |
|-----|-------|
| `token` | Token ngẫu nhiên (unique) |
| `userId` | FK → User (xóa cascade khi xóa user) |
| `expiresAt` | Thời điểm hết hạn |

---

## 3. Hệ thống xác thực

**Thư viện:** NextAuth.js v4 với chiến lược JWT

**File cấu hình:** `lib/auth.ts`

### Luồng đăng nhập
```
1. User nhập email + password tại /login
2. NextAuth gọi CredentialsProvider.authorize()
3. Tìm user trong DB theo email
4. So sánh password với bcrypt.compare()
5. Nếu khớp → trả về { id, name, email, role, commissionRate }
6. NextAuth tạo JWT token chứa các thông tin trên
7. JWT lưu trong cookie httpOnly (an toàn)
8. Mỗi request tiếp theo gửi cookie → middleware xác thực
```

### Cấu trúc JWT Token
```json
{
  "id": "user_id",
  "name": "Nguyễn Văn A",
  "email": "a@company.com",
  "role": "SALE",
  "commissionRate": 35
}
```

### Quên mật khẩu
- Endpoint: `POST /api/auth/forgot-password`
- Tạo token ngẫu nhiên, lưu vào bảng `PasswordResetToken` (hết hạn sau 1 giờ)
- Gửi email có link reset đến người dùng

- Endpoint: `POST /api/auth/reset-password`
- Xác thực token còn hạn → cập nhật mật khẩu mới (đã mã hóa)

---

## 4. Phân quyền theo vai trò

### Các vai trò mặc định

| Vai trò | Mô tả |
|---------|-------|
| `ADMIN` | Quản trị viên cao nhất, toàn quyền |
| `DIRECTOR` | Giám đốc, duyệt khách hàng và booking |
| `CS` | Customer Service, xem và cập nhật |
| `ACCOUNTING` | Kế toán, quản lý hóa đơn |
| `SALE` | Nhân viên kinh doanh, chỉ thấy dữ liệu của mình |

### Ma trận quyền hạn

| Chức năng | ADMIN | DIRECTOR | CS | ACCOUNTING | SALE |
|-----------|:-----:|:--------:|:--:|:----------:|:----:|
| Quản lý User | ✅ | ✅ | ❌ | ❌ | ❌ |
| Tạo khách hàng | ✅ | ✅ (tự duyệt) | ✅ | ❌ | ✅ (chờ duyệt) |
| Duyệt khách hàng | ✅ | ✅ | ❌ | ❌ | ❌ |
| Xem tất cả khách hàng | ✅ | ✅ | ✅ | ✅ | ❌ (chỉ phụ trách) |
| Tạo booking | ✅ | ✅ (tự duyệt) | ✅ | ❌ | ✅ (chờ duyệt) |
| Duyệt booking | ✅ | ✅ | ❌ | ❌ | ❌ |
| Xem tất cả booking | ✅ | ✅ | ✅ | ✅ | ❌ (chỉ của mình) |
| Quản lý hóa đơn | ✅ | ✅ | ✅ | ✅ | ❌ (chỉ xem) |
| Quản lý chuyến bay | ✅ | ✅ | ✅ | ❌ | ❌ |
| Xem báo cáo | ✅ | ✅ | ✅ | ✅ | ✅ (chỉ của mình) |
| Cấu hình hệ thống | ✅ | ❌ | ❌ | ❌ | ❌ |
| Xóa khách hàng | ✅ | ✅ | ✅ | ✅ | ❌ |

---

## 5. Toàn bộ API Backend

Tất cả API đều yêu cầu xác thực (JWT cookie), trừ khi ghi chú khác.

### Nhóm Auth

| Method | Endpoint | Quyền | Mô tả |
|--------|----------|-------|-------|
| `GET/POST` | `/api/auth/[...nextauth]` | Public | Đăng nhập, đăng xuất (NextAuth) |
| `POST` | `/api/auth/forgot-password` | Public | Gửi email reset mật khẩu |
| `POST` | `/api/auth/reset-password` | Public | Đặt mật khẩu mới bằng token |

---

### Nhóm Khách hàng

| Method | Endpoint | Quyền | Mô tả |
|--------|----------|-------|-------|
| `GET` | `/api/customers` | Tất cả | Lấy danh sách khách hàng (SALE: chỉ của mình) |
| `POST` | `/api/customers` | Tất cả | Tạo khách hàng mới |
| `GET` | `/api/customers/[id]` | Tất cả | Chi tiết khách hàng |
| `PATCH` | `/api/customers/[id]` | Tất cả | Cập nhật khách hàng |
| `DELETE` | `/api/customers/[id]` | Không phải SALE | Xóa khách hàng (chỉ khi chưa có booking) |

**Query params cho GET /api/customers:**
- `?status=pending` — Lấy khách hàng chưa duyệt
- Mặc định → Lấy khách hàng đã duyệt

---

### Nhóm Đơn hàng (Booking)

| Method | Endpoint | Quyền | Mô tả |
|--------|----------|-------|-------|
| `GET` | `/api/bookings` | Tất cả | Danh sách booking (SALE: chỉ của mình) |
| `POST` | `/api/bookings` | Tất cả | Tạo booking mới |
| `GET` | `/api/bookings/[id]` | Tất cả | Chi tiết booking |
| `PATCH` | `/api/bookings/[id]` | Tất cả | Cập nhật booking |
| `DELETE` | `/api/bookings/[id]` | ADMIN/DIRECTOR | Xóa booking |
| `GET` | `/api/bookings/[id]/activities` | Tất cả | Nhật ký thay đổi của booking |
| `POST` | `/api/bookings/[id]/send-invoice` | Tất cả | Gửi hóa đơn qua email |
| `GET` | `/api/bookings/[id]/download-invoice` | Tất cả | Tải hóa đơn PDF |
| `GET` | `/api/my-bill` | Tất cả | Danh sách booking kèm thông tin thanh toán |

**Body khi tạo booking (POST):**
```json
{
  "reference": "BK-2026-001",
  "customerId": "cuid...",
  "origin": "SGN",
  "destination": "HAN",
  "pieces": 5,
  "weight": 100.5,
  "chargeableWeight": 120.0,
  "totalRevenue": 5000000,
  "totalCost": 3500000,
  "packages": [
    { "packagingType": "Carton", "weight": 20, "length": 60, "width": 40, "height": 30 }
  ]
}
```

---

### Nhóm Hóa đơn

| Method | Endpoint | Quyền | Mô tả |
|--------|----------|-------|-------|
| `GET` | `/api/invoices` | Tất cả | Danh sách hóa đơn |
| `POST` | `/api/invoices` | Tất cả | Tạo hóa đơn |
| `GET` | `/api/invoices/[id]` | Tất cả | Chi tiết hóa đơn |
| `PATCH` | `/api/invoices/[id]` | Tất cả | Cập nhật (thanh toán...) |
| `DELETE` | `/api/invoices/[id]` | Tất cả | Xóa hóa đơn |

**Query params cho GET /api/invoices:**
- `?customerId=xxx` — Lọc theo khách hàng
- `?status=paid|unpaid|overdue` — Lọc theo trạng thái
- `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` — Lọc theo ngày

---

### Nhóm Chuyến bay

| Method | Endpoint | Quyền | Mô tả |
|--------|----------|-------|-------|
| `GET` | `/api/flights` | Tất cả | Danh sách chuyến bay |
| `POST` | `/api/flights` | Tất cả | Thêm chuyến bay mới |

---

### Nhóm Người dùng & Vai trò

| Method | Endpoint | Quyền | Mô tả |
|--------|----------|-------|-------|
| `GET` | `/api/users` | ADMIN/DIRECTOR | Danh sách nhân viên |
| `POST` | `/api/users` | ADMIN/DIRECTOR | Tạo tài khoản mới |
| `PATCH` | `/api/users` | ADMIN/DIRECTOR | Cập nhật tài khoản |
| `DELETE` | `/api/users` | ADMIN/DIRECTOR | Xóa tài khoản |
| `GET/PATCH` | `/api/users/profile` | Tất cả | Xem/cập nhật hồ sơ cá nhân |
| `GET` | `/api/roles` | Tất cả | Danh sách vai trò tùy chỉnh |
| `POST` | `/api/roles` | Tất cả | Tạo vai trò mới |
| `PATCH` | `/api/roles` | Tất cả | Cập nhật vai trò |

---

### Nhóm Báo cáo & Thống kê

| Method | Endpoint | Quyền | Mô tả |
|--------|----------|-------|-------|
| `GET` | `/api/reports` | Tất cả | Báo cáo tổng hợp (doanh thu, lợi nhuận, sales) |
| `GET` | `/api/counts` | Tất cả | Số lượng pending bookings/khách hàng |
| `GET` | `/api/activity` | Tất cả | Nhật ký hoạt động hệ thống |

**Query params cho GET /api/reports:**
- `?startDate=&endDate=` — Khoảng thời gian
- `?salesId=xxx` — Lọc theo nhân viên sales
- `?customerId=xxx` — Lọc theo khách hàng
- `?airline=xxx` — Lọc theo hãng bay

---

### Nhóm Cài đặt hệ thống

| Method | Endpoint | Quyền | Mô tả |
|--------|----------|-------|-------|
| `GET` | `/api/settings` | Public | Lấy cấu hình hệ thống |
| `PATCH` | `/api/settings` | ADMIN | Cập nhật cấu hình |
| `GET` | `/api/settings/email-templates` | Tất cả | Danh sách mẫu email |
| `POST` | `/api/settings/email-templates` | ADMIN | Tạo mẫu email |
| `PATCH` | `/api/settings/email-templates` | ADMIN | Cập nhật mẫu email |
| `POST` | `/api/setup` | Public (1 lần) | Khởi tạo dữ liệu ban đầu |

---

## 6. Quy trình nghiệp vụ chính

### Quy trình 1: Thêm khách hàng mới

```
Sales tạo khách hàng
        ↓
isApproved = false → Chờ duyệt
        ↓
Director/Admin xem danh sách "Pending Customers"
        ↓
Duyệt (PATCH /api/customers/[id] với isApproved: true)
        ↓
Khách hàng xuất hiện trong hệ thống chính
```

### Quy trình 2: Tạo đơn hàng

```
Chọn khách hàng đã duyệt → Điền thông tin hàng hóa
        ↓
Tính toán: trọng lượng, cước phí, hoa hồng
        ↓
Tạo booking (POST /api/bookings)
        ↓
SALE: approvalStatus = PENDING → chờ duyệt
ADMIN/Director: approvalStatus = APPROVED → xong
        ↓
(Nếu PENDING) Director/CS duyệt booking
        ↓
Hệ thống tự chuyển khách hàng từ POTENTIAL → CONVERTED
```

### Quy trình 3: Thanh toán hóa đơn

```
Tạo hóa đơn cho booking (POST /api/invoices)
        ↓
Khách hàng thanh toán
        ↓
Cập nhật invoice status = "paid" (PATCH /api/invoices/[id])
        ↓
Hệ thống tự tính:
  amountPaid = tổng các invoice "paid"
  paymentStatus của booking:
    = PAID    nếu amountPaid >= totalRevenue
    = PARTIAL nếu 0 < amountPaid < totalRevenue
    = UNPAID  nếu amountPaid = 0
```

### Quy trình 4: Xuất hóa đơn PDF & gửi email

```
Vào chi tiết booking → Nhấn "Gửi hóa đơn"
        ↓
POST /api/bookings/[id]/send-invoice
        ↓
Hệ thống lấy mẫu email từ EmailTemplate (type = INVOICE)
        ↓
Render PDF từ thông tin booking (lib/pdf.ts)
        ↓
Gửi email kèm PDF qua nodemailer (lib/mail.ts)
```

---

## 7. Vận hành & Bảo trì

### Khởi động hệ thống

```bash
# Phát triển (development)
npm run dev

# Production build
npm run build
npm run start
```

### Các lệnh quản lý database

```bash
# Xem dữ liệu database qua giao diện web
npx prisma studio

# Chạy migration khi thay đổi schema
npx prisma migrate dev --name "ten_thay_doi"

# Tạo lại Prisma client sau khi thay đổi schema
npx prisma generate

# Nạp dữ liệu mẫu ban đầu
npx prisma db seed

# Reset database (XÓA TOÀN BỘ DỮ LIỆU - cẩn thận!)
npx prisma migrate reset
```

### Biến môi trường cần thiết

Tạo file `.env` tại thư mục gốc với nội dung:

```env
# Database (đường dẫn file SQLite)
DATABASE_URL="file:./prisma/dev.db"

# Bắt buộc cho NextAuth - chuỗi bí mật ngẫu nhiên (tối thiểu 32 ký tự)
NEXTAUTH_SECRET="chuoi_bi_mat_rat_dai_va_ngau_nhien"

# URL của hệ thống (dùng cho email callback)
NEXTAUTH_URL="https://your-domain.com"

# Cấu hình email gửi đi (nodemailer)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="email@company.com"
EMAIL_PASS="mat_khau_ung_dung"
EMAIL_FROM="FADA LOGICTIS <email@company.com>"
```

### File và thư mục quan trọng

```
prisma/
  schema.prisma    → Định nghĩa toàn bộ cấu trúc database
  dev.db           → File database SQLite (cần backup thường xuyên)
  seed.js          → Dữ liệu khởi tạo ban đầu

lib/
  auth.ts          → Cấu hình xác thực NextAuth
  prisma.ts        → Singleton Prisma client
  activity.ts      → Hàm ghi nhật ký hoạt động
  mail.ts          → Dịch vụ gửi email
  pdf.ts           → Tạo file PDF hóa đơn

app/api/           → Toàn bộ 23 API endpoints
middleware.ts      → Bảo vệ route, kiểm tra đăng nhập
```

### Backup database

Database là file SQLite đơn giản. Để backup:

```bash
# Backup thủ công
cp prisma/dev.db prisma/backup_$(date +%Y%m%d).db

# Khuyến nghị: Thiết lập backup tự động hàng ngày (cron job)
# 0 2 * * * cp /path/prisma/dev.db /path/backup/dev_$(date +\%Y\%m\%d).db
```

### Tạo tài khoản Admin đầu tiên

Khi triển khai lần đầu, gọi endpoint setup:

```bash
POST /api/setup
Content-Type: application/json

{
  "name": "Admin",
  "email": "admin@company.com",
  "password": "mat_khau_manh"
}
```

Endpoint này chỉ hoạt động **1 lần duy nhất** khi chưa có tài khoản Admin trong hệ thống.

---

*Tài liệu cập nhật lần cuối: Tháng 3/2026*
