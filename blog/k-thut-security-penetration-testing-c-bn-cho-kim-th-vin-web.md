---
title: "Kỹ thuật Security & Penetration Testing cơ bản cho kiểm thử viên Web"
date: 2026-05-07
description: "Nâng tầm kỹ năng QA bằng cách học các lỗ hổng bảo mật phổ biến (XSS, SQLi) và áp dụng tư duy của Hacker an toàn."
tags: ["Security","Penetration Testing","QA"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Trí Trần"
---

# Kỹ thuật Security & Penetration Testing cơ bản cho kiểm thử viên Web

Chào các đồng nghiệp QA và các anh em làm trong ngành Công nghệ, tôi là Trí Trần. Trong hành trình của một Quality Engineer (QE) trưởng thành, chúng ta không chỉ dừng lại ở việc xác minh tính năng hoạt động đúng (`Does it work?`). Ngày nay, câu hỏi quan trọng hơn mà bất kỳ QE chuyên nghiệp nào cần trả lời là: **"Làm thế nào để làm nó sụp đổ?"**

Việc tích hợp các kỹ thuật bảo mật (Security Testing) và tư duy của Penetration Testing vào quy trình kiểm thử web không còn là lựa chọn mà đã trở thành một yêu cầu bắt buộc trong chu kỳ phát triển phần mềm hiện đại. Bài viết này sẽ giúp các bạn củng cố kiến thức nền tảng, chuyển mình từ người kiểm tra chức năng (Functional Tester) sang một chuyên gia đánh giá mức độ an toàn của ứng dụng (Security Analyst).

---

## 💡 Chương I: Thay Đổi Tư Duy – Từ QA đến Hacker

Trước khi đi sâu vào các loại lỗ hổng cụ thể, chúng ta phải thay đổi góc nhìn. Một QE thông thường kiểm tra với vai trò người dùng hợp lệ (Logged-in User), còn một chuyên viên Pen Testing lại luôn giả định rằng mình là kẻ tấn công bên ngoài (Malicious Actor) hoặc thậm chí là một người dùng đã bị lợi dụng tài khoản của họ.

**Tư duy cơ bản cần áp dụng:**
1.  **Giả định lỗ hổng:** Luôn tự hỏi: "Nếu tôi không được phép truy cập dữ liệu này, làm sao để vượt qua bằng các input bất thường?"
2.  **Kiểm thử ranh giới (Boundary Testing):** Thay vì chỉ nhập tên hợp lệ, hãy thử các ký tự đặc biệt, các chuỗi dài/ngắn cực đại, hoặc các đoạn mã lệnh (code snippets).

---

## 💉 Chương II: Các Kỹ thuật Tấn công Vòng lặp Input (Injection Flaws)

Các lỗ hổng Injection là nhóm nguy hiểm nhất và phổ biến nhất trên các ứng dụng web. Chúng xảy ra khi dữ liệu người dùng (User Input) được nhận vào hệ thống mà không được làm sạch và xác thực đúng cách, cho phép kẻ tấn công chèn thêm lệnh hoặc code độc hại vào luồng xử lý của ứng dụng.

### 1. Cross-Site Scripting (XSS) – Tấn công kịch bản phía client

XSS xảy ra khi một trang web cho phép người dùng chèn mã script độc hại (thường là JavaScript) vào nội dung mà sau đó được hiển thị lại trên trình duyệt của người dùng khác. Đây là cách thức tấn công khiến hacker đánh cắp cookie, phiên làm việc (Session ID), hoặc thao túng giao diện người dùng.

**Cách kiểm tra:**
Hãy nhắm mục tiêu vào các khu vực chấp nhận input và hiển thị nội dung đó cho người khác: ô bình luận, tên người dùng, trường mô tả sản phẩm.

**Payload minh họa:**
```javascript
<script>alert('XSS Payload');</script>
```
Khi bạn nhập payload này vào một ô bình luận (giả sử nó được hiển thị ngay lập tức sau khi đăng), và nếu ứng dụng không lọc thẻ `<script>`, thì hộp thoại `alert` sẽ hiện lên.

**Giải thích của Trí Trần:** Nếu bạn thấy pop-up, chúc mừng, bạn đã tìm ra lỗ hổng XSS Stored (loại này lưu vào cơ sở dữ liệu). Chúng ta cần kiểm tra xem hệ thống có thực hiện **Encoding** hoặc **Sanitization** đúng cách hay không.

### 2. SQL Injection (SQLi) – Tấn công cơ sở dữ liệu

SQLi là việc kẻ tấn công chèn các câu lệnh Structured Query Language (SQL) độc hại vào các trường input để thao túng hoặc trích xuất toàn bộ dữ liệu từ cơ sở dữ liệu backend.

**Ví dụ mục tiêu:** Form đăng nhập (`username`, `password`).
Giả sử form yêu cầu: `SELECT * FROM Users WHERE Username = '$_GET[user]' AND Password = '$_GET[pass]';`

**Payload minh họa (Logic Bypass):**
Thay vì nhập mật khẩu, bạn thử payload sau vào trường password:
```sql
' OR 1=1 --
```
Nếu hệ thống backend sử dụng giá trị này và thi hành nó như một câu lệnh SQL hợp lệ, điều kiện `1=1` luôn đúng, khiến hàm truy vấn trả về kết quả TRUE mà không cần mật khẩu. Ký tự `--` (hoặc `#`) sẽ dùng để comment phần còn lại của câu lệnh gốc.

**Giải thích của Trí Trần:** Phát hiện lỗ hổng SQLi yêu cầu kiến thức cơ bản về cú pháp SQL. Mục tiêu của QE là chứng minh rằng dữ liệu input người dùng đang được truyền vào query một cách *tham số hóa* (Parameterized Query) chứ không phải là chuỗi văn bản thuần túy (String Concatenation).

---

## 🔒 Chương III: Lỗ hổng Logic và Quy trình Xác thực (Authentication & Authorization Flaws)

Đây là nhóm lỗ hổng thường bị các tester bỏ qua vì chúng yêu cầu tư duy hơn là công cụ. Chúng vi phạm quy tắc nghiệp vụ của ứng dụng.

### 1. Insecure Direct Object Reference (IDOR) – Tham chiếu đối tượng không an toàn

IDOR xảy ra khi một người dùng có thể truy cập tài nguyên (dữ liệu, trang) mà họ không được phép, chỉ bằng cách thay đổi ID trong URL hoặc tham số request.

**Kịch bản minh họa:**
Bạn xem hồ sơ của bạn qua URL: `https://myapp.com/profile?user_id=123`.
Nếu bạn thay đổi thủ công `user_id` thành `124`, và hệ thống vẫn trả về dữ liệu của người dùng 124 mà không kiểm tra xem ID đó có thuộc sở hữu của bạn không, thì đây chính là IDOR.

**Cách kiểm thử:** Luôn kiểm tra bằng cách thay thế các tham số định danh (IDs) trong URL/API request để xem hệ thống có cho phép truy cập tài nguyên lạ hay không.

### 2. Broken Authentication (Lỗ hổng Xác thực)

Đây là khi cơ chế đăng nhập, quản lý phiên làm việc (Session Management), hoặc mật khẩu quá yếu.

**Các điểm cần kiểm tra:**
*   **Brute Force Protection:** Hệ thống có khóa tài khoản sau N lần login thất bại không?
*   **Session Fixation/Hijacking:** Sau khi thành công đăng nhập, session ID có được tạo lại hay không? Nếu một kẻ tấn công lấy được Session ID của bạn đang hoạt động (qua MITM hoặc lộ trên mạng), họ sẽ giả mạo bạn.

---

## 🛠 Chương IV: Công cụ Hỗ trợ và Các Bước Thực hành Chuyên sâu

Để thực hiện các kỹ thuật này, bạn cần vượt ra ngoài trình duyệt thông thường.

### 1. Sử dụng Proxy Tools (Ví dụ: Burp Suite)
Đây là công cụ tối quan trọng nhất của một QE chuyên nghiệp về bảo mật. Proxy cho phép bạn chặn, xem và chỉnh sửa toàn bộ traffic HTTP/HTTPS giữa trình duyệt của bạn và server backend.

**Các bước sử dụng:**
1.  Cài đặt proxy (ví dụ: Burp Suite).
2.  Thiết lập trình duyệt hoạt động qua proxy đó.
3.  Thực hiện một hành động trên ứng dụng (Ví dụ: Xem giỏ hàng sản phẩm X).
4.  Dùng công cụ để chặn request khi bạn bấm nút "View Cart".
5.  **Quan trọng:** Kiểm tra xem Request Headers có chứa các giá trị giả mạo không? (Ví dụ: Thay đổi `is_admin=false` thành `is_admin=true`). Đây là cách kiểm thử cho lỗ hổng BOLA/IDOR trên API.

### 2. Chú ý đến HTTP Methods
Nhiều nhà phát triển quên rằng ngoài GET và POST, các phương thức như `PUT`, `DELETE` có thể được sử dụng để thay đổi dữ liệu quan trọng (ví dụ: Thay vì PUT một hồ sơ người dùng, bạn cần phải xác thực xem tài khoản này có quyền sở hữu ID đó hay không).

**Bài học:** Khi kiểm thử API, đừng chỉ gửi GET/POST. Hãy cố gắng mô phỏng việc xóa (`DELETE`) hoặc cập nhật (`PUT`/`PATCH`) với các tham số giả mạo để tìm ra lỗ hổng xác thực.

---

## 📝 Tổng kết và Lời khuyên từ Trí Trần

Các kỹ thuật Security Testing không phải là một danh sách cần học thuộc lòng, mà là một **tư duy hệ thống (Systematic Mindset)**. Là một QE, bạn cần luôn nghĩ như người tiêu dùng tò mò và kẻ tấn công hung hãn:

1.  **Hãy hoài nghi:** Đừng tin tưởng bất kỳ input nào từ phía client. Mọi thứ phải được validate cả ở cấp độ Backend.
2.  **Kiểm tra mọi điểm kết nối:** Tầng giao diện người dùng (UI) là vô nghĩa nếu tầng API backend bị lỗi bảo mật. Hãy tìm cách kiểm thử trực tiếp các endpoint của API bằng công cụ như Postman hoặc Burp Suite.
3.  **Không ngừng học hỏi:** Thế giới bảo mật thay đổi liên tục. Việc đọc các báo cáo CVE (Common Vulnerabilities and Exposures) và theo dõi các lỗ hổng mới nhất sẽ giúp bạn giữ vững vị thế chuyên gia của mình.

Hy vọng bài viết này là một tài liệu tham khảo hữu ích, giúp các bạn nâng cấp khả năng kiểm thử web của mình lên một tầm cao mới. Chúc mọi người luôn thành công trong việc xây dựng nên những sản phẩm phần mềm không chỉ hoạt động tốt mà còn an toàn tuyệt đối!