---
title: "Kỹ thuật Security & Penetration Testing cơ bản cho kiểm thử viên Web"
date: 2026-05-14
description: "Khám phá cách tư duy của một chuyên gia an ninh mạng. Nắm vững các lỗ hổng OWASP phổ biến và thực hành các kỹ thuật Pentesting căn bản trong quy trình QA hàng ngày."
tags: ["Security","Penetration Testing","QA"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Trí Trần"
---

# Kỹ thuật Security & Penetration Testing cơ bản cho kiểm thử viên Web

Chào các bạn QA và Tester, tôi là Trí Trần.

Trong vai trò của một Quality Engineer (QE), nhiệm vụ truyền thống của chúng ta là xác minh rằng sản phẩm hoạt động đúng chức năng theo yêu cầu (Functional Testing). Tuy nhiên, trong kỷ nguyên số hiện nay, "hoạt động" không chỉ nghĩa là code chạy được, mà còn phải **an toàn** và **bền vững**.

Nếu bạn bỏ qua khía cạnh bảo mật, bạn đang để lại những "lỗ hổng vô hình" cho kẻ xấu khai thác. Bài viết này không nhằm biến các bạn thành chuyên gia Penetration Tester (PT) hay lập trình viên an ninh mạng. Thay vào đó, mục tiêu của tôi là giúp các bạn **thay đổi tư duy**—tư duy từ việc hỏi *"Tính năng này có hoạt động không?"* sang *"Làm thế nào để phá vỡ tính năng này một cách tinh vi và bị động?"*.

Đây chính là kỹ thuật Security Testing (Kiểm thử bảo mật) cơ bản, kiến thức tối cần thiết cho mọi kiểm thử viên Web chuyên nghiệp.

***

## 🛡️ I. Thay đổi Tư Duy: Từ Tester sang Attacker Mindset

Trước khi đi sâu vào các loại tấn công, chúng ta cần thay đổi góc nhìn về việc kiểm thử.

**Tư duy truyền thống (Functional Thinking):**
* *Tôi nhập username và password hợp lệ.* $\rightarrow$ Hệ thống đăng nhập thành công. (OK)
* *Tôi bấm nút Thêm sản phẩm.* $\rightarrow$ Sản phẩm được thêm vào database. (OK)

**Tư duy kiểm thử bảo mật (Attacker Thinking):**
* *Thay vì dùng data hợp lệ, tôi sẽ cố gắng đưa dữ liệu không mong muốn nào đó vào hệ thống?*
* *Tôi có thể vượt qua các quy tắc quyền hạn đã đặt ra bằng cách thay đổi một chút trong yêu cầu API (API call) được không?*

Hãy nhớ: Lỗ hổng an ninh thường nằm ở **sự giả định** (assumptions) của developer. Và nhiệm vụ của chúng ta là tìm ra nơi những giả định đó bị phá vỡ.

***

## 🔪 II. Các Loại Lỗ Hổng Cốt Lõi Mà Bạn Phải Biết (OWASP Top 10 Lite)

Chúng ta sẽ tập trung vào ba nhóm lỗ hổng thường gặp nhất và dễ tái hiện nhất trong môi trường Web: XSS, Injection, và Broken Access Control.

### 1. Cross-Site Scripting (XSS) - Tấn công Mã Script Lặt vặt

**Khái niệm:** XSS xảy ra khi một trang web cho phép kẻ tấn công chèn mã script độc hại (thường là JavaScript) vào nội dung mà người khác sẽ xem. Các script này có thể đánh cắp cookie, hijack session hoặc thay đổi giao diện.

Có hai loại cơ bản:
*   **Reflected XSS:** Payload được phản ánh lại ngay lập tức từ máy chủ sang trình duyệt của nạn nhân (ví dụ: qua URL search).
*   **Stored XSS:** Payload được lưu trữ vĩnh viễn trên server (ví dụ: comment, bài đăng blog). Loại này nguy hiểm nhất.

#### 💻 Kỹ thuật thực hành với Payload mẫu:

Giả sử bạn đang test một chức năng nhận xét (Comment) và yêu cầu nhập liệu chỉ chấp nhận văn bản thuần túy.

**Payload kiểm tra (Kiểm tra Stored XSS):**
```html
<script>alert('Hello, Trí Trần đã tìm thấy lỗ hổng!');</script>
```

**Cách thực hiện:**
1.  Nhập đoạn mã trên vào ô Comment và submit (giả định rằng hệ thống lưu trữ nó).
2.  Mở trang đó bằng một trình duyệt khác hoặc chế độ ẩn danh (Incognito Mode) để kiểm tra liệu mã này có được hiển thị dưới dạng script đang chạy hay chỉ là văn bản thuần túy (`<script>...</script>`).

**Giải thích của Trí Trần:** Nếu bạn nhìn thấy hộp thoại `alert` hiện lên, chúc mừng! Bạn đã tái hiện thành công lỗ hổng XSS. Nguyên nhân là hệ thống chưa thực hiện **Output Encoding** (mã hóa đầu ra) trước khi hiển thị dữ liệu người dùng. Lỗ hổng này không phải do Javascript mà do việc *giả định* rằng mọi input đều an toàn.

### 2. Injection Flaws (Tấn công Tiêm mã) - Đặc biệt là SQLi

**Khái niệm:** Injection xảy ra khi ứng dụng web xử lý dữ liệu đầu vào của người dùng như là các phần lệnh của cơ sở dữ liệu hoặc hệ điều hành, thay vì chỉ xem nó là dữ liệu đơn thuần. Tấn công phổ biến nhất và nguy hiểm nhất chính là **SQL Injection (SQLi)**.

**Giả sử:** Bạn đang test chức năng đăng nhập:
*   `SELECT * FROM users WHERE username = 'INPUT_USER' AND password = 'INPUT_PASS';`

#### 💻 Kỹ thuật thực hành với Payload mẫu:

Để chứng minh lỗ hổng SQLi, chúng ta sẽ làm cho mệnh đề `WHERE` luôn đúng mà không cần biết mật khẩu.

**Payload kiểm tra (Tấn công logic):**
Bạn nhập username là `'` và password là `OR '1'='1`.

**Các bước thực hiện:**
1.  Thay vì cung cấp các giá trị, bạn sửa payload thành:
    *   Username: `' OR '1'='1`
    *   Password: (bất kỳ chuỗi nào)
2.  Bấm nút Login.

**Cơ chế hoạt động và Giải thích của Trí Trần:** Khi cơ sở dữ liệu nhận được input, nó sẽ hiểu câu truy vấn thành:

```sql
SELECT * FROM users WHERE username = '' OR '1'='1' AND password = '';
```
Vì `OR '1'='1'` luôn là mệnh đề ĐÚNG (TRUE), điều kiện `WHERE` sẽ trả về TRUE cho dòng đầu tiên mà nó tìm thấy, và nếu bảng người dùng của bạn có user mặc định hoặc admin, bạn đã bị đăng nhập thành công mà không cần mật khẩu.

**Vấn đề an toàn:** Lỗ hổng này xuất hiện do việc sử dụng các câu lệnh nối chuỗi (string concatenation) để xây dựng truy vấn SQL thay vì sử dụng **Prepared Statements/Parameterized Queries**. Luôn nhớ kiểm tra và báo cáo khi thấy sự can thiệp cú pháp mã lệnh như vậy.

### 3. Broken Authentication & Access Control (Kiểm soát Truy cập Yếu kém) - IDOR

**Khái niệm:** Đây là nhóm lỗ hổng phổ biến nhất, thường do thiếu sót trong việc kiểm tra quyền hạn ở phía Backend.
*   **Broken Auth:** Bạn không được xác thực đúng cách (ví dụ: session timeout quá dài).
*   **IDOR (Insecure Direct Object Reference):** Là trường hợp bạn biết một "định danh trực tiếp" (Direct Object ID) của tài nguyên và thay đổi nó để truy cập tài nguyên thuộc về người dùng khác.

#### 💻 Kỹ thuật thực hành với Payload mẫu:

Giả sử bạn là User A và đang xem chi tiết đơn hàng của mình:
*   URL: `https://app.example.com/order?id=12345` (ID của bạn)

**Kịch bản tấn công:** Bạn nghi ngờ rằng ID này chỉ là một biến số ngẫu nhiên.

**Payload kiểm tra (Thay đổi ID):**
1.  Bạn thay thế giá trị `id=12345` bằng các con số khác: `id=12346`, `id=99999`.
2.  Nếu bạn vô tình truy cập vào đơn hàng của User B mà không cần quyền hạn, đó chính là IDOR!

**Giải thích của Trí Trần:** Khi kiểm thử này thành công, điều đó chứng tỏ rằng hệ thống chỉ kiểm tra xem *bạn* có đăng nhập hay chưa (Authentication), nhưng lại quên kiểm tra xem tài nguyên bạn đang cố truy cập (`order 99999`) có thực sự **thuộc về ID người dùng hiện tại** của bạn không (Authorization). Đây là lỗi logic ở tầng Backend, và nó rất dễ bị bỏ qua trong quy trình kiểm thử thông thường.

***

## 🛠️ III. Công Cụ Hỗ Trợ Thiết Yếu: Burp Suite

Bạn sẽ cảm thấy khó khăn nếu chỉ dựa vào mắt thường. Để trở thành một QE chuyên nghiệp về bảo mật, bạn cần học cách sử dụng các công cụ intercepting proxy (Máy chủ giả lập chặn và sửa yêu cầu mạng).

**Công cụ tối thiểu phải biết:** **Burp Suite Community Edition**.

**Cách nó hoạt động trong QA:**
1.  Bạn thiết lập Burp để nghe tất cả lưu lượng HTTP/HTTPS giữa trình duyệt của bạn và máy chủ ứng dụng.
2.  Khi bạn thực hiện một thao tác (ví dụ: Submit form đăng ký), Burp sẽ chặn toàn bộ yêu cầu đó trước khi nó đến server.
3.  **Điều này cho phép bạn:**
    *   Kiểm tra xem các tham số nào bị gửi đi.
    *   Thêm/sửa giá trị của bất kỳ tham số nào (ví dụ: thêm một `role=admin` vào payload API) để kiểm tra quyền hạn vượt trội (Privilege Escalation).

Việc thành thạo việc dùng proxy này sẽ nâng tầm khả năng test của bạn lên mức độ chuyên nghiệp rất nhiều.

***

## 🔑 Tóm Lược & Lời Khuyên Từ Trí Trần

Các kỹ thuật Security và Pentesting không chỉ là một danh sách các payloads để bạn copy-paste. Chúng là một **Bộ Khung Tư Duy (Mindset Framework)** giúp bạn luôn đặt câu hỏi: *“Còn cách nào khác để làm việc này mà hệ thống chưa nghĩ tới?”*

| Lỗ hổng | Câu hỏi cần đặt ra khi Test | Vị trí lỗi thường gặp |
| :--- | :--- | :--- |
| **XSS** | Hệ thống có hiển thị nội dung người dùng *trước khi* kiểm tra/lưu trữ không? (Testing Input Output) | Frontend & Backend (Output Encoding) |
| **SQL Injection** | Hệ thống có xử lý input bằng cơ chế truy vấn tham số hóa (Parameterized Queries) không? (Testing Data Flow) | Backend Database Query Logic |
| **IDOR** | Mọi tài nguyên tôi gọi API phải được kiểm tra xem nó có thuộc về chủ sở hữu đang đăng nhập hay không? (Testing Ownership Check) | Middleware & Resource Access Layer |

Hãy biến việc nghĩ như một Hacker thành thói quen nghề nghiệp của mình. Bằng cách này, bạn không chỉ là người xác nhận tính năng hoạt động, mà còn là lá chắn đầu tiên bảo vệ doanh nghiệp khỏi những nguy cơ tiềm tàng.

Chúc các bạn luôn vững tay nghề và xây dựng nên những sản phẩm không chỉ chất lượng, mà còn an toàn!