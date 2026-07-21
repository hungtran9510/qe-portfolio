---
title: "Kỹ thuật Security & Penetration Testing cơ bản cho kiểm thử viên Web"
date: 2026-05-07
description: "Nắm vững các kỹ thuật bảo mật cốt lõi (SQLi, XSS, CSRF) và quy trình Penetration Testing dành riêng cho QA Web."
tags: ["Security","Penetration Testing","QA"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Trí Trần"
---

# Kỹ thuật Security & Penetration Testing cơ bản cho kiểm thử viên Web

Chào cả nhà, tôi là Trí Trần. Với kinh nghiệm nhiều năm làm chuyên gia Đảm bảo Chất lượng (QA) và các vấn đề liên quan đến an toàn phần mềm, tôi nhận thấy một xu hướng rất quan trọng hiện nay: **Bảo mật không còn là chức năng bổ sung mà phải là yêu cầu cốt lõi trong mọi vòng đời phát triển phần mềm (SDLC).**

Nhiều kiểm thử viên Web giỏi về logic nghiệp vụ và Functional Testing. Nhưng để trở thành một QA toàn diện, chúng ta buộc phải trang bị thêm "vũ khí" của Security Tester: Kỹ thuật Penetration Testing cơ bản.

Bài viết này không nhằm mục đích biến các bạn thành chuyên gia Ethical Hacker chỉ sau vài giờ đọc, mà là cung cấp một nền tảng kiến thức cực kỳ thực tế để bạn có thể *nhận diện*, *tái hiện* và *báo cáo* (Report) các lỗ hổng bảo mật phổ biến trong quá trình kiểm thử Web.

Hãy bắt đầu hành trình này!

***

## I. Tư Duy của một Security Tester: Không chỉ là "Nó có hoạt động không?"

Khi chúng ta thực hiện Functional Testing, câu hỏi đặt ra là: *"Tính năng A có làm được điều nó cần làm không?"*

Khi bạn là một Security Tester/QE Lead, câu hỏi lại thay đổi hoàn toàn thành: ***"Làm thế nào để phá vỡ tính năng này theo những cách mà Developer chưa nghĩ tới?"***

Bạn phải chuyển từ tư duy người dùng (User Intent) sang tư duy kẻ tấn công (Attacker Mindset). Hãy luôn tự hỏi:

1. **Input Validation:** Hệ thống có kiểm tra đúng các dữ liệu tôi nhập vào không?
2. **Authorization/Authentication:** Tôi có thể truy cập khu vực này dù không được phép không?
3. **State Management:** Session của tôi có bị đánh cắp hoặc thao túng không?

## II. Ba Cột Trụ Bảo Mật Web Cần Nắm Vững (The Holy Trinity)

Có ba lỗ hổng mà mọi kiểm thử viên Web đều phải biết cách kiểm tra: SQL Injection, Cross-Site Scripting (XSS), và Cross-Site Request Forgery (CSRF). Chúng là những điểm yếu kinh điển nhưng vẫn được khai thác hàng ngày.

### 1. SQL Injection (SQLi) - Tấn công vào Cơ sở dữ liệu

**Khái niệm:** Lỗ hổng xảy ra khi ứng dụng web nhận đầu vào của người dùng và đưa nó trực tiếp vào câu lệnh truy vấn cơ sở dữ liệu (Database Query) mà không được làm sạch hoặc xác thực hóa. Kẻ tấn công sẽ chèn các cú pháp SQL độc hại để thay đổi, bỏ qua, hoặc đánh cắp toàn bộ dữ liệu.

**Nguyên tắc kiểm tra:** Thử nghiệm bằng cách nhập các ký tự đặc biệt của SQL vào mọi ô input (username, comment box, search bar...).

| Hành động | Ví dụ Input Tấn công | Kết quả mong đợi (Nếu lỗ hổng) | Giải thích QE |
| :--- | :--- | :--- | :--- |
| **Bỏ qua xác thực** | `admin' --` hoặc `' OR 1=1; --` | Hệ thống đăng nhập thành công mà không cần mật khẩu. | Ký tự `'` phá vỡ chuỗi truy vấn, và `--` (hoặc `#`) là cú pháp comment trong SQL, khiến phần còn lại của câu lệnh bị bỏ qua. `OR 1=1` luôn đúng, giúp bypass điều kiện kiểm tra mật khẩu. |
| **Kiểm tra cấu trúc** | `' ; SELECT user, password FROM users --` | Nếu bảng được hiển thị hoặc lỗi Database cụ thể xuất hiện. | Cho thấy hệ thống cho phép thực thi nhiều lệnh SQL (stacked queries). |

**⚠️ Lưu ý quan trọng:** Dấu `--` (hoặc `#-`) trong ngữ cảnh này thường đại diện cho phần còn lại của câu lệnh truy vấn bị vô hiệu hóa bởi comment.

### 2. Cross-Site Scripting (XSS) - Tấn công bằng Mã độc Client-Side

**Khái niệm:** XSS xảy ra khi một trang web tin tưởng và hiển thị mã kịch bản (Script - thường là JavaScript) do người dùng nhập vào, cho phép kẻ tấn công thực thi các đoạn script đó trên trình duyệt của nạn nhân.

*   **Stored XSS:** Mã độc được lưu trữ vĩnh viễn trong database (ví dụ: bình luận, profile).
*   **Reflected XSS:** Mã độc chỉ phản chiếu từ URL hoặc form nhập liệu và không lưu trữ.

**Nguyên tắc kiểm tra:** Sử dụng các payload JavaScript đơn giản nhất để kiểm tra khả năng thực thi script tại các khu vực input/output (comments, search results, display names...).

**Ví dụ Payload cơ bản:**
```html
<script>alert('XSS_TEST');</script>
```

**Phân tích kết quả:**

*   **Tốt nhất (Secure):** Sau khi nhập và gửi payload, bạn thấy nó được **Encode** (ví dụ: `<` thành `&lt;`, `>` thành `&gt;`) hoặc bị lọc bỏ. Trình duyệt chỉ hiển thị chuỗi ký tự, không thực thi mã lệnh.
*   **Tệ nhất (Vulnerable):** Cửa sổ pop-up `alert('XSS_TEST')` xuất hiện. Điều này xác nhận rằng hệ thống đã cho phép script chạy trên trình duyệt của bạn.

### 3. Cross-Site Request Forgery (CSRF) - Tấn công buộc thực thi hành động

**Khái niệm:** Kẻ tấn công lừa một người dùng đã *đăng nhập* vào website A, để họ vô tình nhấp vào hoặc truy cập một trang web B chứa mã lệnh được thiết kế để gửi yêu cầu giả mạo đến website A. Website A tin rằng hành động này là hợp pháp vì nó đến từ trình duyệt của nạn nhân đang đăng nhập.

**Ví dụ thực tế:** Giả sử bạn truy cập mạng xã hội và bị dẫn đến một trang độc hại có chứa đoạn mã sau:
```html
<img src="http://yourbank.com/transfer?to=hacker&amount=1000" style="opacity:0;">
```
Khi trình duyệt của bạn tải trang này, nó sẽ tự động gửi yêu cầu GET đến Bank (giả định rằng bánh này hoạt động), khiến tài khoản của bạn mất 1000 đồng mà không cần mật khẩu.

**Nguyên tắc kiểm tra:** Bạn phải xác định các hành động nhạy cảm trên web (thay đổi email, thay đổi password, chuyển tiền...). Sau đó, hãy thử tìm hiểu xem yêu cầu API/Form gửi đi có cơ chế chống CSRF nào không.

*   **Kiểm tra sâu hơn (Developer Tools):** Khi bạn tự thực hiện một hành động quan trọng, hãy kiểm tra phần **Headers** của request (cụ thể là `Origin` hoặc các token bí mật). Một hệ thống an toàn sẽ yêu cầu một *CSRF Token* (một mã nhị thức dùng một lần) mà chỉ client và server biết. Nếu không tìm thấy token này trong form POST, nó rất dễ bị tấn công CSRF.

## III. Bảng Tóm Tắt Các Bước Kiểm Thử Bảo Mật Cơ Bản

| Lỗ hổng | Mục tiêu kiểm tra | Payload/Input mẫu (Ví dụ) | Vị trí cần kiểm thử |
| :--- | :--- | :--- | :--- |
| **SQLi** | Truy cập dữ liệu nhạy cảm, Bypass logic. | `' OR 1=1 --` | Login fields, Search bars, Parametrized URLs (`?id=1`). |
| **XSS (Stored)** | Thực thi JS trên người dùng khác. | `<script>alert('TEST')</script>` | Comment boxes, User Profile forms. |
| **XSS (Reflected)** | Kiểm tra việc phản chiếu dữ liệu không được Encode. | `?q=<script>...</script>` | Search query results, Error messages. |
| **CSRF** | Thực hiện hành động nhạy cảm từ bên ngoài. | Truy cập API/Form chuyển tiền, thay đổi email... | Form Change Password, Submit Order, Logout (nếu nó không kiểm tra Session). |
| **LSM (Broken Auth)** | Xem tài nguyên của người khác. | Thay ID trong URL: `/profile?user_id=10` thành `user_id=11`. | Các trang hiển thị dữ liệu cá nhân (Profile, Order History). |

## IV. Lời Kết Từ Trí Trần: Phát triển tư duy Hệ thống

Các bạn thấy đấy, Security Testing không chỉ là việc ném các đoạn mã tấn công vào form nhập liệu. Nó đòi hỏi một tầm nhìn hệ thống rất lớn:

1. **Tìm hiểu luồng dữ liệu:** Dữ liệu đi từ đâu $\rightarrow$ qua bước xử lý nào $\rightarrow$ lưu trữ ở database như thế nào.
2. **Giả định về kẻ thù:** Luôn giả định rằng bất cứ thứ gì người dùng nhập vào (Input) đều là *Độc hại* và cần được kiểm duyệt nghiêm ngặt.

Khi bạn kết hợp kỹ năng Functional Testing với Bộ nhận thức Tấn công này, bạn không chỉ là một QA Tester; bạn là một **Quality Gatekeeper** thực thụ, góp phần bảo vệ ứng dụng khỏi những mối đe dọa tiềm tàng.

Chúc các bạn thành công trên con đường trở thành chuyên gia Đảm bảo Chất lượng toàn diện!
*Trí Trần - QE Lead.*