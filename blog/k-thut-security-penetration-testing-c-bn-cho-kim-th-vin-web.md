---
title: "Kỹ thuật Security & Penetration Testing cơ bản cho kiểm thử viên Web"
date: 2026-05-12
description: "Hướng dẫn toàn diện về các kỹ thuật Security và Penetration Testing cơ bản. Nâng cao tư duy từ Functional QA lên mức độ phòng thủ ứng dụng."
tags: ["Security","Penetration Testing","QA"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Trí Trần"
---

# 🛡️ Kỹ thuật Security & Penetration Testing cơ bản cho kiểm thử viên Web

**Tác giả:** Trí Trần, QE Lead
***

Xin chào các đồng nghiệp QA và những người yêu thích chất lượng!

Trong hành trình trở thành một chuyên gia Kiểm định Chất lượng Phần mềm (QA) toàn diện, chúng ta thường dành nhiều thời gian để bao phủ các luồng chức năng (functional flows). Tuy nhiên, có một lĩnh vực cực kỳ quan trọng, mà đôi khi lại bị xem là "ngoại lệ": **Bảo mật (Security)**.

Một tính năng hoạt động hoàn hảo về mặt nghiệp vụ nhưng lại dễ dàng bị khai thác bởi lỗ hổng bảo mật thì cũng coi như đã thất bại. Chính vì lẽ đó, việc tích hợp tư duy Security Testing vào quy trình kiểm thử hàng ngày của mỗi QA không chỉ là một kỹ năng tốt—mà là yêu cầu bắt buộc trong kỷ nguyên số hiện nay.

Bài viết này, tôi sẽ không dạy bạn cách trở thành chuyên gia Ethical Hacker, mà thay vào đó, tôi sẽ trang bị cho các bạn **khuôn khổ tư duy** và các **kỹ thuật thực hành cơ bản nhất** để tự mình phát hiện những lỗ hổng bảo mật thường gặp trên ứng dụng web.

---

## 📘 Phần I: Định nghĩa – Security Testing vs Penetration Testing

Trước khi đi sâu vào kỹ thuật, chúng ta cần làm rõ hai khái niệm này:

1.  **Security Testing (Kiểm thử Bảo mật):** Là quá trình kiểm tra xem hệ thống có đáp ứng các yêu cầu bảo mật đã định ra hay không (ví dụ: Hệ thống phải mã hóa mật khẩu bằng bcrypt). Đây là hoạt động mang tính quy phạm, tập trung vào việc xác nhận các *điểm yếu theo thiết kế*.
2.  **Penetration Testing (Kiểm thử Xâm nhập):** Là quá trình mô phỏng một cuộc tấn công thực tế từ kẻ xấu để tìm ra và khai thác tất cả các lỗ hổng có thể bị lợi dụng, bao gồm cả những điểm yếu mà đội Dev chưa kịp nghĩ tới. PenTesting mang tính *khám phá rủi ro* theo góc nhìn của đối thủ.

**Đối với QA:** Mục tiêu của chúng ta là áp dụng tư duy của một Penetration Tester khi thực hiện các bài kiểm thử chức năng (Functional Testing). Chúng ta phải luôn tự hỏi: *"Nếu tôi không phải là người dùng lành tính, mà là kẻ tấn công thì tôi sẽ khai thác điểm nào?"*

---

## 🌐 Phần II: Những Lỗ hổng Phải Nắm Vững (Dựa trên OWASP Top 10)

Các lỗ hổng bảo mật ứng dụng web thường tập trung vào ba vòng đời chính: Đầu vào (Input), Xử lý (Processing), và Trình duyệt (Client-side). Dưới đây là các kỹ thuật kiểm thử cơ bản nhất.

### 1. Injection Flaws (Lỗi Tiêm nhiễm)
Injection xảy ra khi ứng dụng nhận đầu vào từ người dùng, nhưng không lọc hoặc xác thực đầy đủ, cho phép những đoạn mã độc hại được *tiêm* vào và thực thi trên hệ thống backend hoặc database.

#### A. SQL Injection (SQLi)
Đây là lỗ hổng phổ biến nhất. Kẻ tấn công sẽ thay đổi các tham số đầu vào để làm lệch luồng truy vấn SQL của ứng dụng.

**🔍 Cách kiểm thử:** Giả sử bạn đang ở trang xem thông tin sản phẩm, và nó dùng một form tìm kiếm nhận `product_id`. Thay vì nhập `10`, bạn hãy thử các payload cơ bản như:

*   `' OR '1'='1` (Giả định rằng ứng dụng truy vấn là: `SELECT * FROM products WHERE id = [input]`). Nếu payload này cho phép login hoặc dump toàn bộ dữ liệu, nghĩa là lỗ hổng đã xảy ra.
*   `'; DROP TABLE users; --` (Đây là một ví dụ cực kỳ nguy hiểm, cần thực hiện trong môi trường staging).

**💡 Giải thích của Trí Trần:** Nguyên tắc cốt lõi ở đây là: **Không bao giờ tin tưởng bất cứ đầu vào nào từ người dùng.** Nếu ứng dụng sử dụng Prepared Statements (tham số hóa truy vấn) thay vì nối chuỗi (string concatenation), thì lỗ hổng này sẽ được ngăn chặn.

#### B. Cross-Site Scripting (XSS)
Đây là việc nhúng mã client-side độc hại (thường là JavaScript) vào các trang web mà người dùng khác xem qua, khiến họ bị lừa hoặc bị đánh cắp session cookie.

**🔍 Cách kiểm thử:** Tìm bất kỳ điểm nào cho phép người dùng nhập văn bản (comment box, tên người dùng, mô tả sản phẩm). Thay vì gõ bình thường, bạn hãy gõ:

```html
<script>alert('XSS Test');</script>
```

*   **Nếu script này chạy ngay lập tức:** Chúc mừng! Bạn đã xác định được lỗ hổng XSS. Điều đó chứng tỏ ứng dụng chưa lọc hoặc *Sanitize* đầu vào JavaScript một cách đúng đắn.

**💡 Giải thích của Trí Trần:** Phân biệt rõ hai loại:
1.  **Stored XSS (Lưu trữ):** Payload bị lưu vĩnh viễn trên server và hiển thị lại cho người dùng khác (nghiêm trọng nhất).
2.  **Reflected XSS (Phản xạ):** Payload được nhúng vào URL hoặc phản hồi của trang web mà không cần lưu trữ (ví dụ: tìm kiếm lỗi).

### 2. Authentication & Authorization Flaws (Lỗi Xác thực/Ủy quyền)
Đây là việc kẻ tấn công vượt qua các rào cản an ninh logic mà không cần mã khai thác phức tạp.

#### A. IDOR (Insecure Direct Object Reference)
IDOR xảy ra khi ứng dụng sử dụng một tham số trực tiếp, có thể đoán được (như `user_id=123` hoặc `order_id=456`) để truy cập tài nguyên mà người dùng không có quyền xem.

**🔍 Cách kiểm thử:** Giả sử bạn đang đăng nhập và xem hóa đơn của mình (`https://myapp.com/profile/orders?id=A10`). Sau khi xác định ID order là `A10`, hãy thay đổi thủ công tham số trong trình duyệt thành:

```
https://myapp.com/profile/orders?id=A11 
```

*   Nếu bạn thấy nội dung của Order B (thuộc tài khoản của người khác), thì đó chính là IDOR, vì hệ thống không kiểm tra xem **người dùng đang đăng nhập có quyền truy cập Resource B hay không.**

#### B. Broken Authentication (Mật khẩu yếu/Token lỏng lẻo)
Kiểm tra các điểm sau:
*   **Thiếu rate limiting:** Thử đăng nhập thất bại nhiều lần liên tục để xác định xem hệ thống có khóa tài khoản tạm thời không (Brute Force).
*   **Cookie Session:** Sau khi login, hãy kiểm tra giá trị của cookie `Session ID`. Cookie này có thay đổi sau mỗi yêu cầu API không? Nếu nó tĩnh và dễ đoán, đó là nguy cơ lớn.

---

## 🛠️ Phần III: Phương pháp Tiếp cận Tấn công (The Attacker Mindset)

Để thực hiện các bài kiểm thử trên một cách chuyên nghiệp, bạn cần các công cụ và phương pháp sau:

### 1. Sử dụng Proxy Interception (Công cụ bắt gói tin)
Đây là kỹ thuật **quan trọng nhất** mà mọi QA cần phải thành thạo.

*   **Tool gợi ý:** [Burp Suite Community Edition](https://portswigger.net/burp/community) hoặc các proxy tool tương tự.
*   **Mục đích:** Proxy cho phép bạn chặn (Intercept) tất cả các yêu cầu HTTP/HTTPS giữa trình duyệt của bạn và server. Bạn có thể xem toàn bộ *Payload* được gửi đi, sửa đổi nó ngay lập tức, rồi gửi lại để kiểm tra phản hồi.

**📈 Quy trình cơ bản khi dùng Burp:**
1.  Cài đặt proxy trên máy Local.
2.  Thiết lập Trình duyệt trỏ qua Proxy đó.
3.  Thực hiện hành vi (Ví dụ: Submit Form A). Dữ liệu sẽ được chặn lại trong Burp Suite.
4.  **Quan trọng:** Thay đổi một tham số hoặc thêm payload độc hại vào Request Body, sau đó nhấn **Forward**.

### 2. Kiểm tra Header và Response Code
Khi kiểm thử, đừng chỉ nhìn vào giao diện người dùng (UI). Hãy mở công cụ Developer Tools của trình duyệt (F12) và kiểm tra:

*   **Security Headers:** Hệ thống có gửi các header bảo mật cần thiết không? Ví dụ: `Content-Security-Policy` (CSP), `X-Frame-Options`. Nếu thiếu, ứng dụng dễ bị tấn công Clickjacking.
*   **HTTP Status Codes:** Khi yêu cầu thất bại do lỗi authorization (không được phép xem), server nên trả về mã **403 Forbidden**, chứ không phải 500 Internal Server Error hay 200 OK (trả về trang error).

---

## ✨ Kết luận: Nâng cấp Tư duy QA

Các kỹ thuật Security Testing và PenTesting cơ bản mà tôi đã chia sẻ ở trên là nền tảng. Chúng ta không mong đợi các bạn trở thành hacker, nhưng chúng tôi yêu cầu các bạn phải làm chủ **tư duy phản biện** (Critical Thinking).

Hãy nhớ: Một báo cáo lỗi chất lượng không chỉ dừng lại ở việc nói *"Tính năng này bị lỗi."* mà phải nâng lên thành *"Hệ thống có nguy cơ lỗ hổng XSS mức độ High, được tái hiện tại đường dẫn Y với Payload Z. Cần áp dụng kỹ thuật Input Sanitization tại lớp API để khắc phục."*

Việc học hỏi về bảo mật không chỉ giúp bạn trở thành một QA giỏi hơn, mà còn giúp doanh nghiệp bạn xây dựng sản phẩm vững chắc và đáng tin cậy hơn rất nhiều.

Chúc các bạn luôn giữ được tinh thần tìm kiếm lỗi tối đa!

**Trí Trần.**
***