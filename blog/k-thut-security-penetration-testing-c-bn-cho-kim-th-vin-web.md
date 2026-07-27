---
title: "Kỹ thuật Security & Penetration Testing cơ bản cho kiểm thử viên Web"
date: 2026-05-13
description: "Nắm vững OWASP Top 10 và học cách nghĩ như một Hacker để nâng tầm kỹ năng QA của bạn."
tags: ["Security","Penetration Testing","QA"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Trí Trần"
---

# Kỹ thuật Security & Penetration Testing cơ bản cho kiểm thử viên Web

Chào cả nhà, tôi là Trí Trần. Với vai trò của một Quality Engineer (QE Lead), tôi đã thấy quá nhiều trường hợp các sản phẩm được coi là "hoàn hảo về mặt chức năng" nhưng lại bị đổ bể chỉ vì những lỗ hổng bảo mật cơ bản.

Ngày nay, việc kiểm thử không còn dừng lại ở việc xác minh *chức năng có hoạt động đúng hay không (Does it work?)* mà đã mở rộng sang việc tìm hiểu *nó có thể bị phá vỡ như thế nào (How can it be broken)?*

Nếu bạn là một Web Tester muốn nâng tầm bản thân từ người kiểm thử chức năng thành một chuyên gia chất lượng toàn diện, thì bài viết này chính là dành cho bạn. Chúng ta sẽ đi sâu vào những kỹ thuật Security và Penetration Testing cơ bản nhất mà mọi QA viên phải biết, dựa trên khuôn khổ của OWASP Top 10.

***Lưu ý quan trọng:*** *Việc thực hiện các kiểm thử bảo mật chỉ được phép với sự đồng ý bằng văn bản của chủ sở hữu hệ thống.*

---

## I. Hiểu đúng về Bảo mật trong QA (Mindset Shift)

Trước khi đi vào kỹ thuật, chúng ta cần thay đổi góc nhìn. Một QE không phải là một PenTester, nhưng một QE giỏi phải có *tư duy* của một PenTester.

### 💡 Tư duy Hacker vs. Tư duy Tester

1. **Kiểm thử viên (QA Tester):** Giả định rằng hệ thống được xây dựng theo quy tắc và đang kiểm tra xem việc tuân thủ các quy tắc đó có đúng không.
2. **Kẻ tấn công (PenTester/Hacker):** Không quan tâm đến luật lệ hay thiết kế ban đầu; họ giả định rằng *mọi thứ đều thất bại* và tìm cách khai thác những điểm yếu, bất kể nó nằm ở đâu.

Nhiệm vụ của bạn là học cách nghĩ bằng tư duy thứ hai. Hãy luôn tự hỏi: **"Nếu tôi cố tình nhập dữ liệu xấu (malicious data) vào đây, điều gì sẽ xảy ra?"**

### Khung tham chiếu: OWASP Top 10

Đây là bộ tiêu chuẩn vàng mà mọi kỹ sư bảo mật đều phải biết. Thay vì học thuộc lòng hàng trăm payload phức tạp, bạn hãy nắm vững các danh mục sau và cách thức tấn công cơ bản cho từng loại:

*   Injection (SQLi, Command Injection)
*   Cross-Site Scripting (XSS)
*   Broken Authentication/Session Management
*   Sensitive Data Exposure
*   Security Misconfiguration

---

## II. Kỹ thuật Tấn công Cơ bản I: Cross-Site Scripting (XSS)

XSS là lỗ hổng phổ biến nhất và dễ hiểu nhất để bắt đầu với bảo mật web. Nó xảy ra khi ứng dụng Web cho phép người dùng nhập các đoạn mã client-side (JavaScript) mà không thực hiện việc lọc hoặc thoát (escape) chúng một cách đúng đắn. Kẻ tấn công sẽ lợi dụng điều này để thực thi script trên trình duyệt của nạn nhân.

### 🧪 Cách thức kiểm thử thủ công:

Hãy tìm tất cả các điểm nhận dữ liệu (input points): thanh tìm kiếm, ô bình luận, pop-up thông tin cá nhân, v.v. Sau đó, thay vì nhập nội dung văn bản bình thường, bạn sẽ đưa vào các *payload* XSS đơn giản.

**Payload ví dụ:**
```html
<script>alert('XSS successful')</script>
```

**Giải thích của Trí Trần:**
Nếu sau khi nhấn Submit, hộp thoại `alert` xuất hiện trên màn hình (hoặc tệ hơn là script đó thực hiện hành vi lấy cookie hoặc redirect người dùng), điều đó chứng tỏ ứng dụng đã bị lỗ hổng XSS. Ứng dụng của bạn chưa *xử lý* dữ liệu đầu vào ở tầng trình duyệt client, hay chưa *lọc* nó ở tầng server.

**Lưu ý về các biến thể:**
Bạn cũng cần kiểm tra các payload không dùng thẻ `<script>` mà vẫn có thể chạy JavaScript, ví dụ: sử dụng sự kiện (event handlers) trong các tag HTML như `onerror` hoặc `onload`:
```html
<img src=x onerror=alert('XSS')>
<!-- Nếu lỗi tải ảnh sẽ kích hoạt script -->
```

---

## III. Kỹ thuật Tấn công Cơ bản II: Injection (SQL Injection - SQLi)

Injection là khi chúng ta ép hệ thống xử lý dữ liệu đầu vào của mình như thể nó là một phần của câu lệnh truy vấn cơ sở dữ liệu (Database Query), thay vì chỉ là dữ liệu đơn thuần. SQLi là hình thức nguy hiểm nhất, cho phép hacker đọc trộm, sửa đổi hoặc xóa toàn bộ dữ liệu trong database.

### 🧪 Cách thức kiểm thử thủ công:

Hãy tìm các form đăng nhập, ô tìm kiếm, hoặc bất cứ nơi nào tương tác với cơ sở dữ liệu. Thay vì cung cấp tên người dùng/mật khẩu hợp lệ, bạn sẽ đưa vào các ký tự đặc biệt để phá vỡ cú pháp SQL ban đầu và nối thêm lệnh của mình.

**Kịch bản: Form Đăng nhập (Username & Password)**
Giả sử ứng dụng đang truy vấn cơ sở dữ liệu với câu lệnh như sau:
`SELECT * FROM users WHERE username = '[input_user]' AND password = '[input_pass]';`

Bạn sẽ thử payload sau vào ô **Username**:
```sql
' OR '1'='1 -- 
```

**Giải thích của Trí Trần:**
Chúng ta phân tích hành động của các ký tự này:

1.  **`'` (Dấu nháy đơn):** Đóng gói chuỗi truy vấn ban đầu đang bị chờ dấu đóng.
2.  **`OR '1'='1'`:** Đây là một điều kiện SQL luôn đúng. Khi hệ thống gặp `WHERE... OR TRUE`, nó sẽ chấp nhận kết quả thành công mà không cần mật khẩu chính xác.
3.  **`--` (Hai gạch ngang):** Trong hầu hết các ngôn ngữ SQL, `--` hoặc `#` được dùng để comment (bình luận), khiến phần còn lại của câu lệnh gốc (`AND password = '[input_pass]'`) bị bỏ qua và không ảnh hưởng đến logic truy vấn.

Nếu bạn nhập payload này vào ô Username mà tài khoản giả định thành công đăng nhập, đó là một lỗ hổng SQL Injection nghiêm trọng!

---

## IV. Kỹ thuật Tấn công Cơ bản III: Broken Authentication & Authorization (BAC/BOP)

Đây không phải là lỗi code, mà là lỗi thiết kế logic nghiệp vụ. Các vấn đề này liên quan đến việc quản lý phiên làm việc và quyền truy cập của người dùng.

### 1. Broken Authentication (Vấn đề xác thực):
*   **Kiểm thử:** Thử tấn công brute-force (đoán mật khẩu) hoặc kiểm tra tính năng khóa tài khoản sau nhiều lần đăng nhập thất bại.
*   **Hỏi bản thân:** Hệ thống có giới hạn số lần thử không? Sau 5 lần sai, nó có yêu cầu CAPTCHA và lock account không?

### 2. Broken Authorization (Vấn đề ủy quyền - IDOR):
Đây là lỗi cực kỳ phổ biến khi làm việc với REST APIs hoặc trang quản lý. Lỗ hổng này cho phép người dùng A truy cập tài nguyên của người dùng B chỉ bằng cách thay đổi một tham số định danh (ID).

*   **Giả sử:** Bạn xem hồ sơ cá nhân của mình tại đường link: `.../profile?id=123`
*   **Kiểm thử IDOR:** Bạn bí mật thay đổi tham số này thành ID khác, ví dụ: `.../profile?id=124`.

Nếu hệ thống hiển thị thông tin của người dùng 124 mà không yêu cầu bạn phải đăng nhập hoặc có quyền tương ứng, đó là lỗ hổng IDOR.

---

## V. Tổng kết và Quy trình làm việc cho QA chuyên nghiệp

Kiểm thử bảo mật không chỉ là chạy các payload; nó là một quy trình tư duy khoa học:

| Bước | Mô tả | Mục tiêu của QE Lead |
| :--- | :--- | :--- |
| **1. Nhận diện (Identify)** | Dựa trên tài liệu, vẽ sơ đồ luồng dữ liệu (Data Flow Diagram). Nơi nào người dùng nhập input? Dữ liệu đó được truyền qua đâu (Client $\to$ Server)? | Giúp tìm ra tất cả các "điểm yếu" (trust boundary) nơi data đi vào hệ thống. |
| **2. Mô hình hóa mối đe dọa (Threat Modeling)** | Tự hỏi: "Kẻ tấn công có thể lợi dụng điều gì ở điểm này?" Ví dụ: Điểm nhập liệu tên người dùng có cần validate độ dài không? | Chủ động tìm kiếm các kịch bản thất bại thay vì chỉ kiểm tra kịch bản thành công. |
| **3. Kiểm thử (Testing)** | Áp dụng các kỹ thuật XSS, SQLi, IDOR... vào từng điểm input và logic nghiệp vụ đã xác định. | Cung cấp bằng chứng cụ thể (PoC - Proof of Concept) khi phát hiện lỗi. |

**Lời khuyên cuối cùng từ Trí Trần:**
Hãy bắt đầu việc học bảo mật bằng cách làm quen với các công cụ cơ bản như **Burp Suite Community Edition**. Đây là proxy tuyệt vời giúp bạn chặn, xem và chỉnh sửa mọi request/response giữa trình duyệt của bạn và server. Việc hiểu luồng dữ liệu HTTP sẽ nâng tầm kỹ năng QA của bạn lên một đẳng cấp hoàn toàn mới.

Chúc các bạn học tập tốt và trở thành những chuyên gia kiểm thử chất lượng hàng đầu!