---
title: "Kỹ thuật Security & Penetration Testing cơ bản cho kiểm thử viên Web"
date: 2026-05-06
description: "Hướng dẫn chuyên sâu từ Trí Trần về các kỹ thuật XSS, SQLi và hơn thế nữa. Nâng tầm khả năng QA của bạn bằng kiến thức Pentest thực chiến."
tags: ["Security","Penetration Testing","QA"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Trí Trần"
---

# 🛡️ Kỹ thuật Security & Penetration Testing cơ bản cho kiểm thử viên Web (Từ Góc nhìn của Trí Trần)

Chào các đồng nghiệp QA, tôi là Trí Trần.

Trong hành trình đảm bảo chất lượng phần mềm, chúng ta thường tập trung vào việc xác minh rằng hệ thống hoạt động đúng chức năng (Functionality). Tuy nhiên, trong kỷ nguyên số hiện nay, một ứng dụng được xem là "hoạt động tốt" chưa đủ. Nó phải **an toàn**.

Với vai trò là một QE Lead, tôi muốn nhấn mạnh rằng: Kiến thức về bảo mật không chỉ dành riêng cho các chuyên gia Security hay Red Team. Mọi kiểm thử viên Web nghiêm túc đều cần trang bị bộ công cụ tư duy của một Pen Tester. Nếu bạn bỏ qua khía cạnh này, sản phẩm của bạn có thể hoạt động trơn tru, nhưng lại dễ dàng bị vô hiệu hóa bởi những lỗ hổng bảo mật tưởng chừng nhỏ nhặt.

Bài viết này không nhằm mục đích biến các bạn thành Hacker mũ đen, mà là trang bị cho bạn một bộ kỹ thuật cơ bản nhất để nhận diện và báo cáo (report) các lỗ hổng Security quan trọng trước khi kẻ xấu nào kịp tìm ra chúng.

---

## 💡 Phần I: Hiểu rõ về Security Testing và Pentesting

Trước khi đi sâu vào kỹ thuật, chúng ta cần định nghĩa lại hai khái niệm này:

**1. Security Testing (Kiểm thử Bảo mật):**
Là quá trình kiểm tra xem ứng dụng có đáp ứng các tiêu chuẩn bảo mật đã đặt ra hay không. Nó thường mang tính hệ thống và tập trung vào việc tìm kiếm các lỗ hổng theo danh sách Checklists/Standards (ví dụ: OWASP Top 10).

**2. Penetration Testing (Kiểm thử Xâm nhập):**
Là quá trình mô phỏng một cuộc tấn công thực tế của tin tặc để khai thác sâu, xem xét mức độ thiệt hại tiềm tàng và tìm ra các đường đi tấn công (Attack Paths) mà chỉ qua kiểm thử chức năng thông thường là không thể nhận ra.

> **✨ Góc nhìn QE Lead:** Nhiệm vụ của chúng ta khi viết test case bảo mật chính là mô phỏng mindset của Pen Tester, vượt xa khuôn khổ "happy path" (đường đi thành công).

---

## 🚀 Phần II: Các Kỹ thuật Tấn công Web Cơ bản Phải Biết

Chúng ta sẽ tập trung vào ba nhóm lỗ hổng cơ bản nhất nhưng nguy hiểm nhất trong các ứng dụng web hiện đại.

### 1. Injection Flaws (Lỗ hổng Tiêm nhiễm)
Injection là lỗ hổng xảy ra khi một ứng dụng tin tưởng rằng dữ liệu đầu vào (Input) của người dùng là an toàn và không cần xử lý đặc biệt, cho phép kẻ tấn công "tiêm" mã lệnh hoặc truy vấn độc hại vào luồng dữ liệu bình thường.

#### A. Cross-Site Scripting (XSS) – Kịch bản điển hình
Đây là loại lỗ hổng phổ biến nhất. Tấn công XSS xảy ra khi kẻ tấn công đưa mã client-side script (thường là JavaScript) vào một trang web, và đoạn script này được thực thi trong trình duyệt của người dùng khác.

**✅ Cách kiểm tra:** Mọi nơi bạn nhập liệu (Comment box, Search bar, Profile name...) đều là mục tiêu tiềm năng.

**🧪 Payload ví dụ:**
```html
<script>alert('XSS by Trí Trần');</script>
```

**🔍 Giải thích của Trí Trần:**
*   Khi bạn nhập payload này vào comment và nó hiển thị trên trang web (mà không bị hệ thống lọc đi), điều đó chứng tỏ rằng ứng dụng đang nhận dữ liệu đầu vào, lưu trữ, và sau đó render trực tiếp mã JavaScript thành HTML.
*   **Hành động của Tester:** Nếu payload chạy được, bạn đã tìm ra một lỗ hổng XSS Stored/Reflected (tùy thuộc nơi nó xuất hiện).

#### B. SQL Injection (SQLi) – Mối đe dọa Backend chết người
SQLi xảy ra khi các tham số truy vấn từ đầu vào của người dùng không được chuẩn hóa (sanitized) trước khi xây dựng câu lệnh SQL. Kẻ tấn công có thể thay đổi cấu trúc truy vấn ban đầu để thực thi các lệnh SQL khác, bao gồm việc trích xuất toàn bộ cơ sở dữ liệu.

**✅ Cách kiểm tra:** Tập trung vào các chức năng liên quan đến tìm kiếm, đăng nhập, và xem chi tiết thông tin (các nơi mà ứng dụng phải tương tác với Database).

**🧪 Payload ví dụ đơn giản:**
Giả sử bạn đang ở trang Login và chỉ cần nhập tên người dùng: `admin' OR '1'='1`

**🔍 Giải thích của Trí Trần:**
*   Nếu câu lệnh SQL gốc là: `SELECT * FROM users WHERE username = '[input]' AND password = '[pass]'`
*   Khi bạn thay input thành payload trên, câu lệnh thực thi sẽ bị biến đổi (về mặt logic) thành: `SELECT * FROM users WHERE username = 'admin' OR '1'='1' AND password = '[pass]'`
*   Vì điều kiện `'1'='1'` luôn đúng trong toán học SQL, cơ sở dữ liệu sẽ coi câu lệnh này là hợp lệ và có thể trả về tài khoản quản trị mà không cần mật khẩu.

### 2. Broken Authentication & Authorization (Lỗ hổng Xác thực/Phân quyền)
Đây là lỗi liên quan đến logic nghiệp vụ, thường khó bị phát hiện bằng công cụ tự động.

#### A. Insecure Direct Object Reference (IDOR) – Lỗi truy cập dữ liệu người khác
Là lỗ hổng khi một đối tượng tài nguyên nhạy cảm được tham chiếu qua các định danh (ID) mà không kiểm tra xem người dùng đang yêu cầu nó có quyền truy cập hay không.

**✅ Cách kiểm tra:** Sau khi đăng nhập bằng User A, hãy thử thay đổi ID trong URL hoặc Request Body để truy cập thông tin của User B (ví dụ: `.../profile?user_id=123` -> đổi thành `.../profile?user_id=456`).

**💡 Ví dụ:**
*   URL hiện tại: `/order?id=789` (Xem đơn hàng của mình)
*   Thử thay đổi ID: `/order?id=101`
*   Nếu bạn thấy thông tin đơn hàng 101 thuộc về một người dùng khác, **bạn đã phát hiện ra IDOR!**

#### B. Missing Function-Level Access Control (Thiếu kiểm soát cấp tính năng)
Đây là khi các chức năng quản trị chỉ bị ẩn đi bằng UI/UX (chẳng hạn nút "Delete User" không hiển thị với người dùng thường), nhưng vẫn tồn tại ở phía API hoặc backend và có thể được gọi bằng cách thay đổi tham số HTTP.

### 3. Cross-Site Request Forgery (CSRF)
CSRF xảy ra khi kẻ tấn công buộc trình duyệt của bạn gửi một yêu cầu hợp lệ đến ứng dụng web mà bạn đang đăng nhập, nhưng yêu cầu này lại không xuất phát từ sự đồng ý của bạn.

**✅ Cách kiểm tra:** Tìm các thao tác thay đổi trạng thái tài khoản (như: Đổi mật khẩu, Thay email, Thực hiện thanh toán) và xem liệu chúng có yêu cầu bất kỳ mã bảo vệ nào ngoài dữ liệu thông thường hay không.

**💡 Kỹ thuật tấn công giả định:**
Kẻ tấn công tạo ra một trang web bên thứ ba chứa thẻ hình ảnh (<img>) hoặc script đơn giản:
```html
<!-- Tấn công buộc bạn đổi email mà không cần biết mật khẩu -->
<img src="https://yourbank.com/change_email?new_email=hacker@malicious.com" onerror="alert('CSRF Success')">
```
Nếu chỉ cần tải trang web chứa thẻ này, và ngân hàng của bạn chấp nhận yêu cầu mà không xác thực phiên (Session), thì bạn đã có CSRF.

---

## 🛠️ Phần III: Bảng tóm tắt Kỹ thuật & Payload cơ bản cho Tester

| Lỗ hổng | Mục tiêu bị tấn công | Phương thức kiểm tra điển hình | Payload gợi ý (Testing) |
| :--- | :--- | :--- | :--- |
| **XSS** | Input fields, Comment boxes | Nhập mã JS vào ô input và xem nó có chạy được không. | `<script>alert('TEST');</script>` |
| **SQLi** | Login forms, Search bar | Thêm ký tự đặc biệt hoặc logic boolean (`'`, `OR 1=1`). | `' OR '1'='1` |
| **IDOR** | Tham số URL/API | Thay đổi ID của đối tượng (User, Order, Product). | `/product?id=9999` (thay 9999) |
| **CSRF** | Change state requests (POST data) | Thử gửi yêu cầu thay đổi thông tin bằng các công cụ như Burp Suite. | Yêu cầu không đi kèm Anti-CSRF token. |

---

## ✨ Tổng kết: Tâm lý học của một QE Lead về Bảo mật

Các bạn kiểm thử viên ơi, xin nhớ rằng **bảo mật là tư duy (mindset), không chỉ là công cụ (tool).**

Thay vì cố gắng tìm ra *cách* khai thác, hãy tập trung vào việc trả lời các câu hỏi sau khi thiết kế test case:

1.  **Độ tin cậy của đầu vào:** Dữ liệu này đến từ đâu? Nó có được lọc/validate đúng cách không? (Ngăn chặn XSS, SQLi).
2.  **Phạm vi truy cập:** Người dùng A có thể xem dữ liệu của người dùng B qua các tham số URL hay không? (Kiểm tra IDOR).
3.  **Tính toàn vẹn phiên làm việc:** Mọi hành động thay đổi trạng thái đều yêu cầu xác thực đủ mạnh và mã token bảo vệ không? (Kiểm tra CSRF).

Việc kết hợp chuyên môn kiểm thử chức năng với các kỹ thuật tấn công cơ bản này sẽ giúp bạn nâng tầm vai trò của mình, từ một "người tìm lỗi" thành một "nhà kiến trúc sư chất lượng toàn diện."

Chúc các bạn luôn giữ vững tinh thần học hỏi và cùng nhau xây dựng những sản phẩm phần mềm an toàn tuyệt đối!

**Trí Trần.**
*Quality Engineering Lead | Security Advocate*