---
title: "Kỹ thuật Security & Penetration Testing cơ bản cho kiểm thử viên Web"
date: 2026-05-05
description: "Hướng dẫn chuyên sâu về các kỹ thuật Security và Pentesting nền tảng, giúp QA không chỉ tìm lỗi chức năng mà còn phòng thủ các lỗ hổng bảo mật của ứng dụng web."
tags: ["Security","Penetration Testing","QA"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Trí Trần"
---

# Kỹ thuật Security & Penetration Testing cơ bản cho kiểm thử viên Web

Chào các đồng nghiệp QA, tôi là Trí Trần. Trong hành trình phát triển phần mềm hiện đại, việc đảm bảo một ứng dụng hoạt động trơn tru về mặt chức năng (Functionality) đã không còn là điều kiện đủ để nó được xem là "sản phẩm hoàn chỉnh." Nếu hệ thống có thể bị bẻ khóa bởi những lỗ hổng bảo mật cơ bản, mọi nỗ lực kiểm thử khác đều trở nên vô nghĩa.

Với vai trò của một Quality Engineer (QE Lead), chúng ta cần nâng tầm tư duy kiểm thử từ việc chỉ tìm kiếm các *bug* (lỗi) thành việc xác định các *vulnerability* (điểm yếu). Bài viết này sẽ là bản đồ dẫn bạn qua những kỹ thuật Security và Penetration Testing cơ bản, giúp bạn tự tin hơn rất nhiều khi ngồi trước một ứng dụng web cần được kiểm tra.

---

## 🎯 Phần I: Hiểu rõ khái niệm – QA vs. PenTest

Trước khi đi sâu vào các kỹ thuật, chúng ta cần phân biệt rõ ràng ba khái niệm này để định hình phạm vi kiểm thử của mình:

**1. Functional Testing (Kiểm thử chức năng):**
*   Mục tiêu: Kiểm tra xem sản phẩm có hoạt động đúng theo yêu cầu nghiệp vụ hay không.
*   Ví dụ: Sau khi nhập sai email, hệ thống có trả về thông báo lỗi chính xác không?

**2. Security Testing (Kiểm thử bảo mật):**
*   Mục tiêu: Xác định các điểm yếu cho phép bên ngoài khai thác để truy cập dữ liệu hoặc chức năng trái phép.
*   Phạm vi: Kiểm tra luồng dữ liệu, quyền hạn người dùng (Authorization), và tính toàn vẹn của dữ liệu.

**3. Penetration Testing (Pentesting):**
*   Mục tiêu: Mô phỏng một cuộc tấn công thực tế từ góc nhìn của hacker để chứng minh rằng hệ thống bị xâm phạm như thế nào và mức độ thiệt hại có thể đạt tới.
*   ***Quan điểm của QA:*** Nhiệm vụ của ta là phát triển tư duy *hacker*, không phải chỉ là người kiểm tra theo kịch bản (Script). Chúng ta cần nghĩ: "Tôi sẽ làm gì để phá vỡ tính năng này?"

> ⚠️ **Lưu ý quan trọng:** Bất kỳ lỗ hổng nào được tìm thấy trong quá trình Security Testing/Pentesting đều là một loại *bug* nghiêm trọng, và phải được báo cáo (Report) cùng với các bước tái hiện (Steps to Reproduce) như khi bạn báo cáo lỗi chức năng thông thường.

## 💣 Phần II: Bộ khung kiến thức – OWASP Top 10

Để không đi lung tung, chúng ta luôn dựa vào chuẩn mực công nghiệp hàng đầu: **OWASP Top 10**. Đây là danh sách các lỗ hổng bảo mật phổ biến và nguy hiểm nhất trong các ứng dụng web. Bất kỳ QE nào cũng phải nắm vững những chủ đề này vì chúng là xương sống của mọi bài kiểm thử an toàn.

Chúng ta sẽ tập trung vào ba kỹ thuật thủ công (Manual Techniques) cơ bản, nhưng vô cùng mạnh mẽ: **SQL Injection**, **Cross-Site Scripting (XSS)**, và **Broken Access Control**.

---

## 🛠️ Phần III: Kỹ thuật sâu – Thực hành trên Web Application

### 1. SQL Injection (SQLi): Tấn công qua cơ sở dữ liệu

**Cơ chế hoạt động:**
Lỗ hổng SQL Injection xảy ra khi ứng dụng web ghép trực tiếp input của người dùng vào câu lệnh truy vấn SQL mà không có bất kỳ bước làm sạch hay chuẩn hóa nào (Input Validation/Sanitization). Kẻ tấn công sẽ chèn các ký tự đặc biệt để thay đổi cấu trúc của câu lệnh gốc.

**Ví dụ minh họa:**
Giả sử bạn đang kiểm tra chức năng đăng nhập và backend xử lý theo cú pháp sau:
`SELECT * FROM users WHERE username = '[input_user]' AND password = '[input_pass]';`

Nếu một hacker chỉ cần nhập payload vào ô `[input_user]` là `' OR 1=1 -- `, câu lệnh SQL của cơ sở dữ liệu sẽ trở thành:
```sql
SELECT * FROM users WHERE username = '' OR 1=1 -- ' AND password = '[input_pass]';
```

*   **Phân tích Payload:**
    *   `'` : Đóng dấu nháy đơn đang mở cho chuỗi username.
    *   `OR 1=1`: Bất kỳ điều kiện nào `1=1` đều là TRUE (luôn đúng). Điều này khiến mệnh đề WHERE luôn trả về True, bỏ qua việc kiểm tra mật khẩu.
    *   `-- `: Đây là ký tự comment trong SQL (hoặc `#`). Nó yêu cầu database bỏ qua phần còn lại của câu lệnh gốc (`AND password...`), khiến hệ thống chỉ cần xác thực tên người dùng mà không cần mật khẩu đúng.

**Cách QE nên kiểm thử thủ công:**
1.  **Kiểm tra độ nhạy cảm với dấu ngoặc đơn/nháy đơn:** Nhập ` '` (dấu nháy đơn) vào các ô input bắt buộc. Nếu hệ thống trả về lỗi database hoặc lỗi 500, bạn đã xác định được điểm yếu tiềm năng.
2.  **Kiểm tra tính logic:** Thay thế một bộ điều kiện bằng payload như: `A' AND '1'='1` để kiểm tra xem kết quả có thay đổi không.

### 2. Cross-Site Scripting (XSS): Lây nhiễm qua JavaScript

**Cơ chế hoạt động:**
XSS là khi kẻ tấn công chèn các script client-side (thường là JavaScript) vào một trang web mà người dùng khác sau này sẽ xem, khiến trình duyệt của nạn nhân thực thi code độc hại đó. XSS thường xảy ra ở những nơi hiển thị input mà không được mã hóa hoặc làm sạch (Sanitize).

**Phân loại phổ biến:**
*   **Stored XSS:** Payload được lưu trữ vĩnh viễn trên server và được kích hoạt khi người khác xem nó (ví dụ: Comment Section, Profile Bio).
*   **Reflected XSS:** Payload chỉ phản ánh qua URL hoặc thông báo lỗi và không lưu vào database.

**Ví dụ minh họa (Payload):**
Thay vì dùng text bình thường, bạn thử nhập payload sau vào ô comment/username:
`<script>alert('XSS Successful by Trí Trần');</script>`

**Phân tích Payload:**
*   Nếu hệ thống được lập trình kém và hiển thị nội dung này trực tiếp mà không trích xuất các thẻ HTML (`<script>`, `<img>`, v.v.), thì khi người dùng khác tải trang, script sẽ chạy và hộp alert bật lên.
*   **Hậu quả thực tế:** Thay vì chỉ là Alert box, một hacker có thể chèn đoạn code để lấy Cookie của phiên làm việc (Session Cookie) của người dùng khác và gửi nó đến máy chủ bên ngoài (Stealing session tokens).

**Cách QE nên kiểm thử thủ công:**
1.  Kiểm tra mọi điểm tiếp nhận input: Ô comment, thanh tìm kiếm, trường Tên/Họ (nơi không yêu cầu giá trị thực tế).
2.  Sử dụng các payload cơ bản như `<h1>Test</h1>`, `<script>alert(1)</script>`, và cả các ký tự escape (`&lt;`, `&gt;`) để xem hệ thống có lọc chúng hay không.

### 3. Broken Access Control (Kiểm soát truy cập bị lỗi): Vi phạm quyền hạn

Đây là lỗ hổng thường gây thiệt hại nhất nhưng lại dễ bỏ qua nhất vì nó liên quan đến tư duy nghiệp vụ hơn là kỹ thuật code.

**Cơ chế hoạt động:**
Xảy ra khi hệ thống không kiểm tra đúng xem người dùng A có quyền truy cập vào tài nguyên thuộc về người dùng B hay không.

**Kỹ thuật mô phỏng (Insecure Direct Object Reference - IDOR):**
1.  Giả sử bạn đăng nhập với vai trò **User A** và kiểm tra thông tin cá nhân của mình qua URL: `https://app.example.com/profile?id=10`.
2.  Bây giờ, thay đổi thủ công tham số `id` thành ID của một người dùng khác mà bạn không có quyền xem (ví dụ: quản trị viên) hoặc một tài khoản bị khóa: `https://app.example.com/profile?id=100` (hoặc `id=-9`).
3.  Nếu hệ thống hiển thị thông tin của User 100 mà không yêu cầu bạn phải đăng nhập bằng tài khoản đó, thì đó chính là IDOR, và bạn đã tìm thấy lỗ hổng **Broken Access Control**.

**Cách QE nên kiểm thử thủ công:**
*   Luôn luân phiên vai trò người dùng (User/Admin/Guest).
*   Khi thực hiện một tác vụ trên tài nguyên X thuộc về User A, hãy thay đổi ID của tài nguyên đó để trỏ tới tài nguyên Y của User B.

---

## 🚀 Tổng kết và Hành trình phát triển QE An toàn

Hiểu được các khái niệm cơ bản là bước đầu. Để trở thành một QA thực thụ với tư duy an ninh mạng, bạn cần nhớ:

1.  **Luôn đặt câu hỏi "Và nếu..." (What if...):** Đừng chỉ kiểm tra xem nó hoạt động đúng hay không. Hãy tự hỏi: *Nếu tôi dùng script này thì sao? Nếu tôi bỏ qua bước xác thực này thì sao?*
2.  **Hiểu về HTTP:** Nắm vững các method (GET, POST, PUT, DELETE) và Header của request/response là tối quan trọng để phát hiện CSRF hay việc thay đổi tham số.
3.  **Tự động hóa Bảo mật:** Khi đã nắm được kỹ thuật thủ công, bạn cần học cách đưa chúng vào Test Automation Framework bằng các thư viện như Selenium (kết hợp với checks bảo mật) hoặc sử dụng các công cụ chuyên biệt hơn trong CI/CD pipeline.

Kiểm thử bảo mật không phải là một *feature* (tính năng), nó là một *lớp phòng thủ* (Defense layer). Nâng cao kiến thức này, bạn không chỉ cải thiện sự nghiệp của mình mà còn góp phần xây dựng nên những sản phẩm số vững chắc cho cộng đồng. Chúc các đồng nghiệp luôn thành công trên con đường trở thành những QE toàn diện!