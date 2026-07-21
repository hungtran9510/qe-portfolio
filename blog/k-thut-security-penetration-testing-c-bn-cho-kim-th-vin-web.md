---
title: "Kỹ thuật Security & Penetration Testing cơ bản cho kiểm thử viên Web"
date: 2026-05-07
description: "Nắm vững các lỗ hổng phổ biến (SQLi, XSS, CSRF) và áp dụng tư duy Pentester để nâng cao chất lượng bảo mật ứng dụng web."
tags: ["Security","Penetration Testing","QA"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Trí Trần"
---

# Kỹ thuật Security & Penetration Testing cơ bản cho kiểm thử viên Web

Chào các đồng nghiệp và những người đam mê Chất lượng phần mềm, tôi là Trí Trần. Với vai trò là một Quality Engineer (QE Lead), nhiệm vụ của chúng ta không chỉ dừng lại ở việc tìm ra *bug* — mà còn phải đảm bảo rằng ứng dụng vận hành trong môi trường càng an toàn càng tốt.

Trong kỷ nguyên số hóa hiện nay, một tính năng hoạt động hoàn hảo nhưng dễ bị tấn công về mặt bảo mật thì vẫn được coi là chưa đạt chất lượng. Chính vì thế, việc hiểu biết và áp dụng các kỹ thuật cơ bản của **Security Testing** và **Penetration Testing (Pentesting)** không còn là lợi thế mà đã trở thành yêu cầu bắt buộc đối với bất kỳ kiểm thử viên web nào muốn phát triển chuyên môn.

Bài viết này sẽ là cẩm nang thực tế, giúp quý vị nắm vững cách tư duy như một kẻ tấn công để tìm ra những kẽ hở trước khi chúng rơi vào tay tin tặc ngoài đời thực.

***

## 🛡️ I. Tư Duy Của Người Kiểm Thử Bảo Mật (Security Mindset)

Trước khi đi sâu vào các loại lỗ hổng, điều quan trọng nhất là thay đổi góc nhìn của mình. Khi bạn kiểm thử một tính năng (ví dụ: form đăng nhập), đừng chỉ hỏi: *“Tính năng này có hoạt động đúng không?”* Hãy tự đặt những câu hỏi sau:

1.  **Giới hạn đầu vào (Input Validation):** Tính năng này chấp nhận loại dữ liệu nào? Nó có thực sự lọc hết các ký tự đặc biệt hay không?
2.  **Phân quyền (Authorization & Authentication):** Người dùng A có thể truy cập dữ liệu của người dùng B không? Việc kiểm tra mật khẩu có đủ mạnh mẽ không?
3.  **Giả định Tồi tệ nhất:** Điều gì xảy ra nếu tôi đưa một lượng lớn ký tự nhị phân, hoặc các lệnh SQL vào ô tìm kiếm?

Tư duy này sẽ giúp chúng ta tập trung vào **ranh giới (boundary)** và **giá trị biên (edge cases)** về mặt dữ liệu và luồng nghiệp vụ.

***

## 💥 II. Ba Lỗ Hổng "Bắt Buộc Phải Biết"

Trong hàng trăm loại lỗ hổng, ba thứ sau đây là những mục tiêu tấn công phổ biến nhất và bạn *bắt buộc* phải kiểm tra chúng: **SQL Injection (SQLi), Cross-Site Scripting (XSS),** và **Cross-Site Request Forgery (CSRF).**

### 1. SQL Injection (SQLi) - Tấn Công Truy Vấn Cơ Sở Dữ Liệu

**Khái niệm:**
SQLi xảy ra khi dữ liệu đầu vào do người dùng cung cấp không được lọc hoặc làm sạch (sanitize), cho phép kẻ tấn công chèn các đoạn lệnh SQL độc hại vào truy vấn của ứng dụng. Mục tiêu thường là đọc, sửa đổi, hoặc xóa toàn bộ dữ liệu trong cơ sở dữ liệu.

**Ví dụ Tấn Công:**
Giả sử bạn có một ô tìm kiếm hiển thị thông tin người dùng theo ID: `SELECT * FROM users WHERE user_id = '[INPUT]'`

Nếu input bình thường là `10`, truy vấn sẽ là:
`SELECT * FROM users WHERE user_id = '10'` (Hoạt động bình thường)

Kẻ tấn công chèn payload sau vào ô input: `' OR 1=1 --`

Truy vấn được thực thi thành:
`SELECT * FROM users WHERE user_id = '' OR 1=1 --'`

*   `OR 1=1`: Vì `1=1` luôn đúng, mệnh đề này khiến truy vấn trả về tất cả các bản ghi (thường là dữ liệu của quản trị viên).
*   `--`: Là ký tự comment trong SQL, nó làm vô hiệu hóa phần còn lại của câu lệnh gốc (ví dụ: dấu `'` cuối cùng).

**Cách kiểm thử và giải thích:**
Hãy luôn tìm kiếm các điểm mà ứng dụng tương tác với cơ sở dữ liệu qua input người dùng: form đăng nhập, ô tìm kiếm, bộ lọc sản phẩm.

*   **Kiểm tra bằng cách thêm ký tự đặc biệt:** Thử ` ' `, ` " ` hoặc `--` vào các trường text. Nếu hệ thống báo lỗi cú pháp SQL thay vì trả về thông báo lỗi thân thiện với người dùng, đó là một chỉ dấu đỏ (Red Flag) mạnh mẽ cho thấy ứng dụng có thể dễ bị SQLi.
*   **Giải pháp phòng ngừa:** Luôn sử dụng **Prepared Statements (Tham số hóa truy vấn)** trong code backend để đảm bảo input của người dùng luôn được coi là *dữ liệu* chứ không phải là một phần của *lệnh*.

### 2. Cross-Site Scripting (XSS) - Tấn Công Lệnh Ký Tự Web

**Khái niệm:**
XSS xảy ra khi ứng dụng hiển thị dữ liệu do người dùng nhập vào mà không kiểm tra hoặc mã hóa (encode) các ký tự HTML/JavaScript nguy hiểm. Điều này cho phép kẻ tấn công chèn một đoạn script độc hại để chạy trong trình duyệt của người dùng khác (người bị nạn).

**Các loại XSS phổ biến:**
*   **Stored XSS (Lưu trữ):** Payload được lưu vĩnh viễn vào cơ sở dữ liệu (ví dụ: Comment, Hồ sơ người dùng) và sẽ tự động chạy khi bất kỳ ai xem trang đó. (Nguy hiểm nhất).
*   **Reflected XSS (Phản ánh):** Payload chỉ tồn tại trong một URL query parameter hoặc thông báo lỗi và được phản ánh ngay lập tức trên trang mà không lưu vào DB.

**Ví dụ Tấn Công:**
Giả sử bạn tìm thấy ô comment, bạn nhập payload sau:
`<script>alert('XSS Success by Trí Trần!');</script>`

Nếu ứng dụng *không* lọc thẻ `<script>`, trình duyệt của người dùng xem trang sẽ thực thi đoạn code này, và cửa sổ `alert` sẽ hiện ra.

**Cách kiểm thử và giải thích:**
1.  Tìm mọi nơi mà dữ liệu người dùng được hiển thị trên giao diện (Input Comment, Username, Tên sản phẩm).
2.  Thử inject các payload cơ bản:
    *   `<script>alert(1)</script>`
    *   `<img><svg/onload=alert(document.domain)>` (Các thẻ ẩn thường hiệu quả hơn)

Nếu hệ thống hiển thị nội dung script này dưới dạng văn bản thô thay vì thực thi nó, tức là ứng dụng đã *encode* hoặc lọc thành công.

**Giải pháp phòng ngừa:**
1.  **Output Encoding:** Khi hiển thị bất kỳ dữ liệu người dùng nào trên HTML, luôn phải chuyển đổi các ký tự đặc biệt (`<`, `>`, `&`, `"`) thành các thực thể HTML (ví dụ: `<` thành `&lt;`).
2.  Sử dụng Content Security Policy (CSP) để hạn chế các script nguồn được phép chạy.

### 3. Cross-Site Request Forgery (CSRF) - Giả Mạo Yêu Cầu Trang

**Khái niệm:**
CSRF xảy ra khi kẻ tấn công buộc một người dùng đã đăng nhập (bên nạn nhân) phải thực hiện một hành động không mong muốn trên một trang web mà họ đang truy cập. Vì trình duyệt của nạn nhân tự động đính kèm các cookie phiên làm việc, máy chủ tin rằng yêu cầu đó là hợp pháp.

**Ví dụ Tấn Công:**
Giả sử bạn có URL chuyển mật khẩu: `https://app.example.com/password_change?newPass=Hacker123` (Yêu cầu này cần xác thực).

Kẻ tấn công tạo một trang web bên ngoài và chèn đoạn HTML sau, nhắm vào người dùng đang đăng nhập:

```html
<img src="https://app.example.com/password_change?newPass=Hacker123&confirm=HackSecure" style="display:none;">
```

Khi nạn nhân truy cập trang độc hại này, trình duyệt của họ sẽ cố gắng tải ảnh `src` đó. Hành động tải ảnh này vô tình gửi một yêu cầu GET đến máy chủ và thay đổi mật khẩu mà không cần bất kỳ sự tương tác nào từ người dùng (người dùng chỉ cần mở trang).

**Cách kiểm thử và giải thích:**
1.  Xác định các hành động quan trọng trong ứng dụng: Thay đổi email, xóa tài khoản, thực hiện giao dịch mua hàng, chuyển mật khẩu.
2.  Kiểm tra xem những yêu cầu này có được bảo vệ bằng một token chống CSRF hay không.
3.  Thử mô phỏng việc kích hoạt các hành động này từ bên ngoài (ví dụ: dùng cURL hoặc đoạn HTML đơn giản mà không cần qua form của ứng dụng).

**Giải pháp phòng ngừa:**
1.  **CSRF Token:** Đây là cơ chế quan trọng nhất. Khi tạo form, ứng dụng phải nhúng một token ngẫu nhiên, duy nhất, vào yêu cầu. Máy chủ chỉ chấp nhận yêu cầu có kèm theo token này.
2.  Kiểm tra tính hợp lệ của token trên Backend trước khi xử lý bất kỳ hành động thay đổi trạng thái (State-changing actions) nào.

***

## 🛠️ III. Bảng Tóm Tắt và Kế Hoạch Hành Động Cho QE

| Lỗ Hổng | Mô tả cơ bản | Payload gợi ý | Điểm cần kiểm tra | Giải pháp cốt lõi (Code/Design) |
| :--- | :--- | :--- | :--- | :--- |
| **SQL Injection** | Chèn lệnh SQL qua input. | `' OR 1=1 --` | Ô tìm kiếm, Form đăng nhập, API Parameters. | Prepared Statements, Parameterized Queries. |
| **XSS (Stored/Reflected)** | Thực thi script độc hại trên trình duyệt người dùng khác. | `<script>alert(1)</script>` | Comment, Username, Search Result Display. | Output Encoding, Content Security Policy (CSP). |
| **CSRF** | Buộc người dùng thực hiện hành động không mong muốn. | `<img>` tag nhắm vào endpoint quan trọng. | Thay đổi mật khẩu, Xóa tài khoản, Thanh toán. | CSRF Token trên mọi Form/API POST request. |

### Lời khuyên từ Trí Trần: Bắt đầu với Tầng API

Trong các dự án hiện đại, phần lớn logic nghiệp vụ chạy qua RESTful APIs. Khi kiểm thử Web QA ngày càng nâng cao, hãy nhớ mở rộng tầm nhìn ra cả lớp API này.

*   **Kiểm tra tham số:** Nếu một endpoint yêu cầu `user_id`, bạn phải test xem liệu nó có bị bỏ qua hay không (ví dụ: gọi `/api/data?user_id=1` nhưng lại thực sự lấy dữ liệu của người dùng 5). Đây là lỗi liên quan đến **Broken Access Control** (Kiểm soát truy cập kém) – một lỗ hổng kinh điển.

## Kết Luận

Nắm vững kỹ thuật Pentesting không có nghĩa là bạn phải trở thành Ethical Hacker, nhưng nó đòi hỏi bạn phải tư duy ở mức độ hệ thống và nguy hiểm nhất. Hãy luôn coi mọi input người dùng (dù đến từ form, API call hay URL parameter) đều là **không đáng tin cậy**.

Bằng việc tích hợp tư duy bảo mật này vào quy trình kiểm thử hàng ngày của mình, quý vị không chỉ nâng cao chất lượng sản phẩm mà còn đóng vai trò thiết yếu trong việc bảo vệ dữ liệu và niềm tin của người dùng.

Chúc các bạn luôn thành công trong hành trình tìm kiếm sự hoàn hảo – cả về chức năng lẫn tính toàn vẹn!