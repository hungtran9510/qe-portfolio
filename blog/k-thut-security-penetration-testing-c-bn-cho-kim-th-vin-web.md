---
title: "Kỹ thuật Security & Penetration Testing cơ bản cho kiểm thử viên Web"
date: 2026-05-06
description: "Nâng tầm kỹ năng QA của bạn với các kỹ thuật Pentest cơ bản và cách tìm lỗ hổng bảo mật hiệu quả trên ứng dụng web."
tags: ["Security","Penetration Testing","QA"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Trí Trần"
---

# Kỹ thuật Security & Penetration Testing cơ bản cho kiểm thử viên Web

Chào các đồng nghiệp Kiểm thử Chất lượng (QA)! Tôi là Trí Trần, và trong suốt hành trình làm QA của tôi, tôi đã nhận ra một sự thật quan trọng: **Việc tìm ra lỗi chức năng (functional bugs) chỉ là bước khởi đầu.** Một ứng dụng có thể chạy hoàn hảo về mặt giao diện người dùng (UI/UX), nhưng lại sụp đổ dưới sức tấn công của lỗ hổng bảo mật.

Nhiều kiểm thử viên tin rằng, việc kiểm tra bảo mật là chuyên môn riêng của đội DevSecOps hay Security Engineer. Điều này là hiểu lầm lớn nhất trong ngành QA hiện đại. Một tester giỏi phải có tư duy của một hacker (White Hat Hacker). Nếu bạn muốn tự chủ và nâng tầm sự nghiệp của mình, bài viết này chính là bản đồ dẫn đường cho bạn.

Trong bài viết chuyên sâu này, tôi sẽ hướng dẫn các kỹ thuật Security Testing và Penetration Testing cơ bản nhất mà bất kỳ Web Tester nào cũng cần nắm vững.

---

## 💡 I. Hiểu rõ: QA vs Security Testing vs Penetration Testing

Trước khi đi vào kỹ thuật, chúng ta cần phân biệt ba khái niệm này để tránh nhầm lẫn về phạm vi công việc:

1.  **Kiểm thử Chức năng (Functional Testing - QA):** Kiểm tra xem ứng dụng có hoạt động đúng theo yêu cầu nghiệp vụ hay không (Ví dụ: Nhập Tên và Mật khẩu thành công có đăng nhập được không?).
2.  **Kiểm thử Bảo mật (Security Testing):** Xác minh các biện pháp bảo vệ dữ liệu, lớp xác thực, và quyền truy cập của ứng dụng. Mục tiêu là tìm ra lỗ hổng *tiềm tàng*.
3.  **Penetration Testing (PT - Kiểm thử Xâm nhập):** Là quá trình mô phỏng một cuộc tấn công thực tế từ bên ngoài để khai thác tối đa các lỗ hổng đã tìm thấy và đánh giá mức độ nghiêm trọng của chúng, nhằm đưa ra báo cáo chi tiết cho đội phát triển vá lỗi.

> **Tư duy của QE Lead:** Khi bạn test, đừng hỏi "Nó có làm đúng yêu cầu không?", mà hãy hỏi: "**Kẻ xấu có thể dùng nó để làm sai thứ gì không?**"

---

## 🛡️ II. Các Lỗ hổng Web Phổ biến Cần Kiểm tra (Top Vulnerabilities)

Theo chuẩn **OWASP Top 10**, đây là những mục tiêu ưu tiên bạn cần kiểm tra khi test một ứng dụng web:

### 1. Injection Flaws (Lỗ hổng Tiêm nhiễm) - Cái bẫy lớn nhất

Injection xảy ra khi dữ liệu người dùng đầu vào không được xác thực và xử lý đúng cách, cho phép kẻ tấn công "tiêm" các câu lệnh ngôn ngữ khác vào hệ thống. Hai loại phổ biến nhất là SQL Injection (SQLi) và Cross-Site Scripting (XSS).

#### A. SQL Injection (SQLi)
Đây là lỗ hổng xảy ra khi người dùng có thể thay đổi cú pháp của câu truy vấn cơ sở dữ liệu bằng cách chèn mã SQL độc hại vào các trường nhập liệu.

**🎯 Kỹ thuật kiểm tra:**

*   Tìm kiếm mọi nơi nào bạn phải nhập thông tin (Form đăng nhập, ô tìm kiếm, tham số URL).
*   Thay vì nhập giá trị hợp lệ, hãy thử các chuỗi ký tự đặc biệt: `'`, `"`, `--` (dấu comment SQL), `;`.

**🔍 Ví dụ thực tế:**
Nếu form login của bạn nhận input và xây dựng câu query như sau (về mặt logic code):
```sql
SELECT * FROM users WHERE username = 'INPUT_USER' AND password = 'INPUT_PASS';
```
Bạn hãy nhập: `admin' OR '1'='1` vào ô Username.

*   **Điều gì xảy ra:** Câu query sẽ trở thành: `... WHERE username = 'admin' OR '1'='1' AND password = '...'`.
*   Vì `'1'='1'` luôn đúng (TRUE), hệ thống sẽ bỏ qua phần kiểm tra mật khẩu và có thể cho bạn đăng nhập bằng tài khoản admin mà không cần mật khẩu.

#### B. Cross-Site Scripting (XSS)
XSS xảy ra khi ứng dụng hiển thị dữ liệu do người dùng cung cấp mà không lọc các thẻ HTML/JavaScript. Kẻ tấn công lợi dụng điều này để chạy mã độc trên trình duyệt của nạn nhân.

**🎯 Kỹ thuật kiểm tra:**

*   Kiểm tra mọi nơi cho phép bạn nhập văn bản (Bình luận, tiêu đề bài viết, ô tìm kiếm).
*   Nhập các payload JavaScript cơ bản sau:

```html
<script>alert('XSS Found by Trí Trần!');</script> 
<!-- Hoặc để tránh bị bộ lọc chặn script: -->
<img src=x onerror=alert('XSS')>
```
Nếu hộp thoại `alert` bật lên, xin chúc mừng, bạn đã tìm ra lỗi XSS!

### 2. Broken Authentication and Access Control (Lỗi Xác thực và Kiểm soát Truy cập)

Các lỗ hổng này liên quan đến việc người dùng không được kiểm tra đúng quyền hạn trước khi truy cập tài nguyên hoặc chức năng nhất định.

**🎯 Kỹ thuật kiểm tra:**

*   **Horizontal Privilege Escalation (Nâng cấp theo chiều ngang):**
    *   Giả sử bạn là user A, và muốn xem thông tin cá nhân của user B. Thay vì tìm nút "Xem thông tin người khác", hãy thử thay đổi ID người dùng trong URL:
        *   URL hiện tại: `.../profile?user_id=100` (Của tôi)
        *   Thử thành: `.../profile?user_id=1` หรือ `.../api/v1/users/2345` (UserID của một người khác).
    *   Nếu hệ thống vẫn hiển thị thông tin đó mà không yêu cầu mật khẩu hoặc xác minh quyền, bạn đã tìm ra lỗi.

*   **Vertical Privilege Escalation (Nâng cấp theo chiều dọc):**
    *   Giả sử bạn là user thường và muốn truy cập vào trang quản trị (Admin Dashboard). Hãy thử gõ trực tiếp URL của Admin: `.../admin/dashboard`.
    *   Nếu hệ thống chỉ yêu cầu mật khẩu đơn giản hoặc cho phép bạn xem mà không cần xác thực Admin, đây là lỗ hổng nghiêm trọng.

### 3. Sensitive Data Exposure (Lộ dữ liệu nhạy cảm)

Hệ thống có thể vô tình làm lộ thông tin quan trọng qua các giao diện API hoặc Header HTTP.

**🎯 Kỹ thuật kiểm tra:**

*   **Kiểm tra Response Headers:** Khi bạn sử dụng công cụ Proxy (như Burp Suite), hãy xem phần Request/Response Headers. Tìm kiếm các header chứa thông tin nhạy cảm như `API Key`, `Session Token` được đặt sai cách hoặc lộ ra ngoài luồng giao tiếp không an toàn.
*   **Kiểm tra API:** Nếu bạn gọi một endpoint API, thử thêm tham số không cần thiết vào URL. Đôi khi, hệ thống trả về cả dữ liệu người dùng đang đăng nhập và các thông tin cấu hình nhạy cảm của server chỉ vì bạn hỏi đến nó.

---

## 🛠️ III. Quy trình Tấn công Mô phỏng (Penetration Testing Workflow)

Một buổi PT thực tế không phải là việc thử ngẫu nhiên, nó cần một quy trình bài bản:

1.  **Information Gathering (Thu thập thông tin):** Giống như bạn tìm hiểu đối thủ trước khi giao đấu. Thu thập tất cả các endpoint API, tất cả các tham số form input, và kiến trúc cơ sở dữ liệu khả thi.
2.  **Vulnerability Scanning (Quét lỗ hổng):** Sử dụng công cụ tự động (như OWASP ZAP) để tìm ra các lỗ hổng rõ ràng (ví dụ: thiếu HTTPS, header lỗi). *Lưu ý: Đây chỉ là bước sàng lọc ban đầu.*
3.  **Manual Exploitation & Validation (Khai thác và Xác thực thủ công):** Đây là lúc kỹ năng của bạn lên ngôi. Bạn sẽ dùng tư duy và các payloads đã học để xác nhận xem lỗ hổng đó có thể bị khai thác thành công không, và nó ảnh hưởng đến mức độ nghiêm trọng nào.

## 📘 IV. Lời khuyên từ QE Lead Trí Trần

Để biến kiến thức lý thuyết thành kỹ năng thực tiễn, bạn cần những thứ sau:

1.  **Nắm vững HTTP Protocol:** Hiểu rõ các phương thức (GET, POST, PUT, DELETE) và cấu trúc request/response là điều kiện tiên quyết.
2.  **Công cụ Bắt buộc phải dùng:** **Burp Suite Community Edition.** Đây là công cụ Proxy cực kỳ mạnh mẽ cho phép bạn chặn, xem, sửa đổi mọi yêu cầu HTTP đi qua ứng dụng web. Học cách sử dụng Burp để nắm quyền kiểm soát luồng dữ liệu là bước đột phá lớn nhất trong sự nghiệp QA của bạn.
3.  **Tư duy "Think Like a Hacker":** Luôn hỏi: "*Nếu mình không phải là tester, mà là người cố tình gây hại, mình sẽ khai thác điểm yếu nào?*"

An toàn thông tin không chỉ là một tính năng, nó là trách nhiệm. Việc các bạn QA chủ động tìm kiếm và loại bỏ những lỗ hổng này chính là hàng rào bảo vệ quan trọng nhất cho sản phẩm của chúng ta.

Chúc các bạn thành công trên con đường trở thành những Quality Engineer toàn diện!