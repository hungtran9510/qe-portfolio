---
title: "Kỹ thuật Security & Penetration Testing cơ bản cho kiểm thử viên Web"
date: 2026-05-09
description: "Nắm vững những kỹ thuật Pentesting cơ bản nhất (XSS, SQLi) để nâng tầm từ QA Tester thành chuyên gia bảo mật ứng dụng Web."
tags: ["Security","Penetration Testing","QA"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Trí Trần"
---

# Kỹ thuật Security & Penetration Testing cơ bản cho kiểm thử viên Web

Chào các đồng nghiệp QA! Tôi là Trí Trần.

Trong suốt chặng đường làm Quality Engineering, chúng ta thường tập trung vào việc xác minh tính năng (Functional Testing), đảm bảo rằng ứng dụng hoạt động đúng như yêu cầu thiết kế ban đầu. Tuy nhiên, một điểm yếu chết người của phần mềm không chỉ đến từ việc *không* thực hiện được chức năng, mà còn đến từ việc nó bị *lạm dụng* vượt ngoài phạm vi chức năng đó.

Đó chính là nơi Security Testing và Penetration Testing (PT) phát huy vai trò tối quan trọng.

Nếu bạn muốn nâng tầm bản thân từ một QA Tester thông thường trở thành một chuyên gia bảo mật ứng dụng có khả năng tìm ra những lỗi mà các lập trình viên tưởng rằng chúng đã được "vá" kỹ lưỡng, thì bài viết này chính là lộ trình cho bạn. Chúng ta sẽ cùng nhau đi sâu vào những kỹ thuật cơ bản nhưng cực kỳ hiệu quả trong lĩnh vực kiểm thử bảo mật Web.

***

## 🧠 I. Tư Duy của một Security Tester (Mindset Shift)

Trước khi đi sâu vào kỹ thuật, chúng ta phải thay đổi góc nhìn. Khi làm QA thông thường, bạn nghĩ: *"Nếu tôi nhập email này, nó có báo lỗi không?"*

Khi làm Pentester, bạn sẽ nghĩ: *"Làm sao để tôi biến input này thành một đoạn mã lệnh mà hệ thống tin rằng đó là dữ liệu bình thường?"*

Mục tiêu của chúng ta là khai thác sự *tin tưởng mù quáng* (Blind Trust) của ứng dụng đối với bất kỳ dữ liệu nào được truyền qua giao diện người dùng.

### Kiến thức nền tảng cần nắm:

1. **HTTP Protocol:** Hiểu rõ Request/Response Cycle, Header, Method (GET, POST).
2. **OWASP Top 10:** Luôn luôn nghiên cứu danh sách các rủi ro bảo mật hàng đầu của Tổ chức Web và Phần mềm (OWASP) để biết mình đang tìm kiếm cái gì.
3. **Scope of Testing:** Biết rõ những API endpoint nào, những trường input nào là cần được kiểm tra nghiêm ngặt nhất.

***

## 🛠️ II. Ba Kỹ Thuật Bảo Mật Cốt Lõi Phải Nắm Rõ

Trong số hàng trăm lỗ hổng bảo mật có thể tồn tại, ba loại sau đây chiếm tỷ trọng lớn nhất và dễ bị khai thác nhất trên các ứng dụng Web thực tế: XSS, SQL Injection (SQLi), và Broken Access Control.

### 1. Cross-Site Scripting (XSS) - Tấn công kịch bản chéo trang

**Nguyên lý:** XSS xảy ra khi một kẻ tấn công tiêm mã JavaScript độc hại vào một website mà người dùng khác xem, khiến trình duyệt của nạn nhân tin rằng mã đó là nội dung hợp lệ và thực thi nó.

**Phân loại cơ bản:**
*   **Stored XSS (Lưu trữ):** Mã độc được lưu vĩnh viễn trên server (ví dụ: comment section, hồ sơ người dùng). Đây là loại nguy hiểm nhất.
*   **Reflected XSS (Phản chiếu):** Mã độc được gửi qua URL và phản ánh lại ngay lập tức mà không cần lưu vào database.

#### 🧪 Kịch bản kiểm thử thực tế (Payload Example)

Giả sử bạn đang test một trang comment, và hệ thống cho phép nhập HTML cơ bản nhưng chưa làm sạch (sanitize) input:

**Input độc hại:**
```html
<script>alert('XSS Success!');</script>
```

**Kết quả mong muốn (Bảo mật):** Hệ thống chỉ hiển thị chuỗi text `<script>...</script>` hoặc báo lỗi format.
**Vấn đề phát hiện (Không bảo mật):** Lệnh `alert()` chạy lên, chứng tỏ payload đã được thực thi trong ngữ cảnh trình duyệt của người xem.

### 2. SQL Injection (SQLi) - Tiêm nhiễm mã truy vấn cơ sở dữ liệu

**Nguyên lý:** Tấn công này xảy ra khi ứng dụng Web sử dụng input trực tiếp từ người dùng để xây dựng câu lệnh truy vấn cơ sở dữ liệu (query) mà không thực hiện bất kỳ quá trình chuẩn bị tham số hóa (Prepared Statement).

Khi kiểm thử, mục tiêu của chúng ta là "phá vỡ" cấu trúc cú pháp SQL bằng cách thêm các ký tự đặc biệt.

#### 🧪 Kịch bản kiểm thử thực tế (Payload Example)

Giả sử bạn đang test trang đăng nhập (`login.php`) với input Username và Password. Lập trình viên đã viết code sau:

```sql
SELECT * FROM users WHERE username = '$username' AND password = '$password';
```

**Thử nghiệm bình thường:** `('admin', 'pass')` -> Query chạy đúng, trả về kết quả hợp lệ.

**Payload tấn công (Trong trường Username):**
```
' OR 1=1 -- 
```

**Phân tích và Giải thích của Trí Trần:**

Khi hệ thống ghép input này vào câu query gốc, nó sẽ biến thành:

```sql
SELECT * FROM users WHERE username = '' OR 1=1 -- ' AND password = '$password';
```

*   `'` (Dấu nháy đơn): Đóng dấu ngoặc đơn trước đó.
*   `OR 1=1`: Đây là điều kiện luôn đúng trong SQL. Bằng cách thêm `OR 1=1`, bạn đảm bảo rằng mệnh đề WHERE sẽ luôn trả về TRUE, bất kể mật khẩu thực tế là gì.
*   `-- `: Hai dấu gạch ngang này trong nhiều hệ quản trị CSDL (như MySQL) có nghĩa là "comment" (ghi chú). Chúng khiến phần còn lại của câu query gốc (`' AND password = '$password';`) bị bỏ qua, do đó làm cho payload hoạt động trọn vẹn.

**Kết quả:** Cơ sở dữ liệu coi đây chỉ là một mệnh đề `OR` và trả về bản ghi đầu tiên (thường là quản trị viên), giúp kẻ tấn công đăng nhập mà không cần mật khẩu.

### 3. Broken Access Control (Kiểm soát truy cập bị lỗi)

**Nguyên lý:** Đây không phải là việc "nhập mã lạ" vào ô input, mà là việc khai thác các lỗ hổng logic trong hệ thống quyền hạn. Người dùng A có thể cố gắng truy cập tài nguyên của người dùng B.

**Kỹ thuật phát hiện phổ biến nhất: IDOR (Insecure Direct Object Reference)**

Giả sử bạn đang xem hóa đơn với URL sau:
`https://myapp.com/invoices?id=12345` (Hóa đơn của tôi)

Bạn thử thay đổi tham số ID thành một con số khác, ví dụ:
`https://myapp.com/invoices?id=99999`

Nếu hệ thống trả về hóa đơn thuộc quyền sở hữu của người dùng Khác (mà bạn không phải là chủ nhân), thì đây chính là lỗ hổng **IDOR**. Hệ thống đã kiểm tra xem request đó có được gửi từ user nào, nhưng chưa kiểm tra xem **user đó có quyền truy cập đối tượng (object) ID 99999 hay không.**

***

## ⚙️ III. Quy Trình Kiểm Thử Bảo Mật Cơ Bản (Testing Workflow)

Làm sao để áp dụng những kiến thức này thành một quy trình bài bản? Tôi đề xuất các bước sau khi kiểm thử bất kỳ tính năng Web nào:

1. **Identify Input Points:** Xác định tất cả các điểm nhập liệu (form, URL parameters, headers, API calls).
2. **Baseline Testing (Smoke/Happy Path):** Test chức năng bình thường trước.
3. **Boundary & Negative Testing:** Thử giới hạn giá trị (Input quá dài, quá ngắn, chỉ chứa ký tự đặc biệt).
4. **Security Payload Injection:** Áp dụng các payload cơ bản:
    *   Nhập `<script>alert(1)</script>` vào mọi trường text để kiểm tra XSS.
    *   Thử chuỗi `'` (dấu nháy đơn) và `-- ` tại các trường cần tương tác với database.
5. **Authorization Testing:** Tự thay đổi ID trong URL hoặc tham số request (ví dụ: thay `user_id=10` thành `user_id=1`) để kiểm tra quyền hạn người dùng khác.

## 🚀 IV. Lời Khuyên Từ QE Lead Trí Trần

Để trở thành một chuyên gia bảo mật thực thụ, bạn cần vượt ra khỏi việc chỉ "thử các payload" và phải hiểu **tại sao** nó lại hoạt động.

1. **Tools to Master:** Hãy làm quen với **Burp Suite Community Edition**. Đây là công cụ bắt buộc phải biết của mọi tester muốn theo mảng bảo mật. Nó cho phép bạn chặn, xem và sửa đổi toàn bộ traffic giữa trình duyệt và server.
2. **Practice with CTFs:** Tham gia các cuộc thi Capture The Flag (CTF) hoặc sử dụng các nền tảng như OWASP Juice Shop để thực hành khai thác lỗi trong môi trường an toàn.
3. **Focus on the "Why":** Khi bạn tìm thấy một lỗ hổng, đừng chỉ ghi nhận nó là *lỗi*. Hãy giải thích nguyên nhân gốc rễ (Root Cause) của lỗi: *"Lỗ hổng này tồn tại vì backend không thực hiện Input Validation cho trường X và thiếu Prepared Statement."*

Bảo mật không phải là tính năng, mà là trách nhiệm. Bằng việc bổ sung kiến thức Pentesting cơ bản vào bộ kỹ năng QA của mình, bạn không chỉ nâng cao chất lượng sản phẩm mà còn nâng tầm sự nghiệp của chính mình. Chúc các đồng nghiệp thành công!