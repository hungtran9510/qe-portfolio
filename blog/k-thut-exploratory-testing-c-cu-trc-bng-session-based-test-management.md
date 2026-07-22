---
title: "Kỹ thuật Exploratory Testing có cấu trúc bằng Session-Based Test Management"
date: 2026-04-01
description: "Khám phá cách biến Exploratory Testing từ nghệ thuật thành khoa học với khuôn khổ SBTM, tối ưu hóa hiệu suất QA."
tags: ["Exploratory Testing","QA Strategy","Manual Testing"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hồng Dung"
---

# Kỹ thuật Exploratory Testing có cấu trúc bằng Session-Based Test Management

Xin chào các đồng nghiệp QA và đội ngũ chất lượng! Tôi là Hồng Dung.

Trong hành trình xây dựng phần mềm, chúng ta luôn đối mặt với một thách thức kinh điển: **Làm sao để đảm bảo rằng chúng ta đã kiểm tra mọi kịch bản có thể xảy ra?**

Nếu sử dụng Test Case thủ công (scripted testing), đội ngũ của chúng ta sẽ bị giới hạn bởi phạm vi kiến thức và thời gian lập test case. Nếu chỉ dựa vào Kiểm thử Ngẫu hứng (Ad-hoc testing) thuần túy, quá trình kiểm thử sẽ rất hỗn loạn, không thể đo lường, và khó khăn trong việc xác định các khoảng trống kiểm thử (coverage gaps).

Đây là lúc chúng ta cần một phương pháp tiếp cận vượt trội: **Kết hợp sức mạnh khám phá của Exploratory Testing (ET) với tính kỷ luật cấu trúc của Session-Based Test Management (SBTM).**

Bài viết này sẽ đi sâu vào cách biến ET từ một *nghệ thuật kiểm thử* thành một *khoa học có thể đo lường và tối ưu hóa*, giúp đội ngũ QA của bạn không chỉ tìm ra bug mà còn xây dựng được chiến lược kiểm thử vững chắc.

***

## I. Tái Định Nghĩa: Vượt Qua Giới Hạn Truyền Thống

Trước khi đi sâu vào giải pháp, chúng ta cần hiểu rõ ba khái niệm cốt lõi này và mối quan hệ của chúng.

### 💡 1. Exploratory Testing (ET) là gì?
ET không phải là chạy một tập hợp các bài test đã định trước; nó là quá trình **học hỏi, khám phá và thiết kế/thực thi kiểm thử đồng thời** dựa trên sự hiểu biết về ứng dụng, kiến thức hệ thống, và trực giác của người kiểm thử.

*   **Bản chất:** Chủ động tìm kiếm các kịch bản edge-case, lỗ hổng nghiệp vụ mà tài liệu yêu cầu (test case) đã bỏ sót.
*   **Giá trị cốt lõi:** Tận dụng trí tuệ con người để khám phá những góc chết về chức năng và trải nghiệm người dùng.

### 🧠 2. Session-Based Test Management (SBTM) là gì?
SBTM là một khuôn khổ (framework) giúp **cấu trúc hóa, giới hạn phạm vi, mục tiêu và nguồn lực** cho các hoạt động ET. Nó biến sự ngẫu hứng thành một quá trình khoa học có thể quản lý được.

Thay vì nói: *"Tôi sẽ kiểm tra mọi thứ trên trang thanh toán."*
Chúng ta thay bằng: *"Trong vòng 90 phút tiếp theo, với mục tiêu là xác định bất kỳ lỗi đồng bộ hóa nào khi người dùng thao tác từ thiết bị di động và máy tính cùng lúc (Cross-device sync issues), chúng ta sẽ tập trung vào các hành vi của trang thanh toán."*

### 🧩 3. Sự Cộng Hưởng: ET được cấu trúc bởi SBTM
Nếu ET là một chiếc ô tô mạnh mẽ, thì SBTM chính là bánh lái và bản đồ dẫn đường. SBTM cung cấp *khuôn khổ*, giúp đội ngũ biết chính xác phải tập trung vào đâu (Scope), trong bao lâu (Timebox), và với mục đích gì (Goal).

**Kết quả:** Chúng ta có thể đánh giá được hiệu suất của buổi kiểm thử, ghi nhận các kỹ thuật đã áp dụng, và – quan trọng nhất – **trình bày kết quả bằng số liệu**.

***

## II. Khung Thực Thi: 4 Bước Triển Khai SBTM Cho ET

Để một phiên ET trở thành *khoa học*, nó cần tuân theo quy trình chuẩn hóa sau đây.

### Bước 1: Xác định Phạm vi (Scope Definition)
Phạm vi phải được xác định rõ ràng, tránh lan man. Scope là những tính năng hoặc các luồng người dùng mà đội ngũ sẽ tập trung vào.

**Ví dụ thực tế:** Thay vì "Kiểm thử toàn bộ hệ thống đăng ký", chúng ta giới hạn thành: *"Chỉ kiểm tra quy trình Tải và Cập nhật Hồ sơ Người dùng (Profile Upload/Update) trong Module Quản lý tài khoản."*
*   ***Lợi ích của việc Scope rõ ràng:*** Giúp mọi thành viên trong nhóm cùng hướng tới một mục tiêu, tăng tính đồng bộ.

### Bước 2: Thiết lập Mục tiêu và Thời gian (Goal Setting & Timeboxing)
Đây là phần quan trọng nhất, nơi chúng ta biến ET thành hoạt động đo lường được.

*   **Mục tiêu (Goal):** Cần phải cụ thể và có tính giả thuyết cao. Ví dụ: *“Kiểm tra xem hệ thống có xử lý an toàn các trường hợp nhập ký tự đặc biệt (special characters) trong tên tài khoản không.”*
*   **Thời gian (Timebox):** Giới hạn thời gian (ví dụ: 60 phút). Điều này tạo ra áp lực tập trung và buộc người kiểm thử phải ưu tiên các khu vực rủi ro cao.

### Bước 3: Thực hiện Kiểm thử có Tài liệu hóa (Execution & Documentation)
Trong suốt phiên làm việc, mọi hành động đều cần được ghi lại hệ thống, không chỉ là bug. Chúng ta ghi lại **các bài test đã *suy ra* và thực thi**.

*   **Thủ tục:** Người kiểm thử luân phiên vai trò giữa "Người Thực hiện Test" (Execution) và "Người Quan sát/Ghi chép" (Observer).
*   **Ghi nhận:** Không chỉ ghi lại Bug ID, mà còn phải ghi lại *kỹ thuật kiểm thử nào đã giúp ta phát hiện bug đó*. (Ví dụ: Sử dụng kỹ thuật Boundary Value Analysis khi kiểm tra trường nhập liệu tuổi).

### Bước 4: Phân tích và Báo cáo Kết quả (Analysis & Reporting)
Sau phiên, chúng ta sẽ báo cáo không chỉ là danh sách Bug. Chúng ta trình bày bằng một bảng phân tích mang tính chiến lược:

*   **Test Coverage Gaps:** Những lĩnh vực mà đội ngũ *chưa kịp* khám phá (và cần phải có test case cho lần sau).
*   **Risk Reduction:** Các rủi ro nào đã được giảm thiểu nhờ buổi ET này.
*   **Action Items:** Đề xuất các module cần được ưu tiên kiểm thử ở chu kỳ tiếp theo.

***

## III. 🛠️ Hộp Công Cụ Thực Hành: Template Ghi Chép Phiên Kiểm Thử (Session Log)

Để làm cho SBTM trở nên thực tế, chúng ta phải có một mẫu ghi chép chuẩn hóa thay vì chỉ là sổ tay lộn xộn. Đây là phần mà kinh nghiệm của tôi yêu cầu các bạn lưu ý nhất.

Tôi xin trình bày cấu trúc log tối thiểu bằng Markdown/Pseudo-Code dưới đây:

```markdown
## [SESSION LOG] - Module Thanh toán
**Ngày:** 2026-04-01 | **Thời gian:** 9:00 AM – 10:30 AM (90 phút)

### I. Phạm vi & Mục tiêu
*   **Scope:** Quy trình Checkout và Xử lý lỗi xác thực thanh toán.
*   **Goal Hypothesis:** Tìm kiếm các vấn đề liên quan đến giao dịch không đồng bộ hoặc mất phiên làm việc khi tải lại trang từ thiết bị di động (Mobile Logout/Refresh).

### II. Các Phương pháp tiếp cận Chính (Techniques Applied)
1. Boundary Value Analysis (BVA): Kiểm tra ngưỡng tối thiểu/tối đa của số lượng mặt hàng.
2. Error Guessing: Giả định các hành vi người dùng sẽ làm sai để xem hệ thống phản ứng thế nào.
3. Misuse Case Testing: Thử cố gắng vượt qua giới hạn thanh toán quy định.

### III. Chi tiết Thực thi (Execution Details)
| Thời gian (Start-End) | Test Flow/Action (Hành động) | Expected Result (Kết quả mong đợi) | Actual Result (Kết quả thực tế) | Status (Pass/Fail/Blocked) | Notes / Technique Used |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 9:15 - 9:25 | Thêm sản phẩm A, B, C. Tăng số lượng sản phẩm A đến mức tối đa (Max limit). | Hệ thống báo cảnh báo vượt ngưỡng và giữ giá trị cũ; người dùng không thể tiến hành Checkout. | Hệ thống bỏ qua giới hạn này và tính toán một cách ngẫu nhiên. Lỗi thanh toán! | 🔴 FAIL | Technique: BVA |
| 9:45 - 10:00 | Đăng nhập bằng thiết bị A, thực hiện checkout. Ngay sau khi đến trang xác nhận OTP, đóng tab và mở lại trong 5 phút. | Hệ thống phải báo lỗi "Phiên đã hết hạn" và yêu cầu đăng nhập lại. | Người dùng vẫn có thể nhấn nút thanh toán thành công mà không cần OTP mới. | 🔴 FAIL | Technique: Session Management Test |

### IV. Kết quả Chiến lược (Strategic Outcomes)
*   **Bug Phát hiện:** Bug-AUTH-045 (Lỗi giữ phiên thanh toán).
*   **Coverage Gaps/Areas to Explore Next:** Cần xem xét sâu hơn về luồng xử lý của các loại mã giảm giá kết hợp (Combo coupon logic). Hiện tại, việc kiểm tra chỉ dừng ở mã riêng lẻ.

***
### V. Kết Luận Từ Góc Nhìn Chất Lượng (QE Lead Insight)

Việc áp dụng SBTM cho ET không chỉ là một quy trình *báo cáo* đẹp mắt; nó là cách để chúng ta **đo lường sự hiệu quả của tư duy chất lượng**.

Khi bạn có thể nói: *"Trong 90 phút với mục tiêu X, chúng tôi đã khám phá và giảm thiểu được rủi ro Y"* – đó chính là ngôn ngữ mà Quản lý Sản phẩm (Product Owner) và Cấp quản lý cấp cao mong muốn thấy. Nó nâng tầm QA từ vai trò "Người tìm bug" thành **"Đối tác Rủi ro Chất lượng"**.

Hãy bắt đầu áp dụng SBTM ngay hôm nay, biến những buổi khám phá ngẫu hứng của bạn thành một quy trình kiểm thử có cấu trúc và tính định lượng cao!

Chúc các đồng nghiệp luôn giữ lửa đam mê chất lượng!
**Trân trọng,**
**Hồng Dung.**