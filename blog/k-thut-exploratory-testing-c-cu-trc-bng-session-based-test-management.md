---
title: "Kỹ thuật Exploratory Testing có cấu trúc bằng Session-Based Test Management"
date: 2026-03-31
description: "Khám phá cách nâng tầm Exploratory Testing từ hoạt động ngẫu nhiên thành quy trình khoa học, đo lường được bằng SBTM."
tags: ["Exploratory Testing","QA Strategy","Manual Testing"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hồng Dung"
---

# Kỹ thuật Exploratory Testing có cấu trúc bằng Session-Based Test Management

Chào các đồng nghiệp QA, tôi là Hồng Dung. Sau nhiều năm làm việc trong lĩnh vực Chất lượng Phần mềm, tôi nhận thấy một điều thú vị nhưng cũng đầy thách thức: Khả năng của bộ óc con người khi thực hiện kiểm thử tự do (ad-hoc testing) luôn vượt trội hơn bất kỳ kịch bản nào được viết sẵn. Đó chính là sức mạnh cốt lõi của **Exploratory Testing (ET)**.

Tuy nhiên, với vai trò là một QE Lead, tôi cũng phải thẳng thắn chỉ ra rằng: ET thuần túy *quá tự do*. Nếu không có sự cấu trúc hóa, các phiên kiểm thử này dễ trở thành những cuộc "đi dạo" vô định, dẫn đến việc thiếu tính minh bạch, khó khăn trong báo cáo độ bao phủ (coverage), và tệ hơn là không thể lặp lại để xác nhận kết quả.

Và đó chính là lúc chúng ta cần một chiến lược mạnh mẽ: **Session-Based Test Management (SBTM)**.

Bài viết này sẽ là một hướng dẫn chuyên sâu, giúp các bạn chuyển đổi ET từ một nghệ thuật trực giác thành một quy trình kỹ thuật có cấu trúc, đo lường được và cực kỳ hiệu quả.

---

## 🔬 I. Nhắc lại kiến thức nền tảng: Tại sao cần SBTM?

### 1. Exploratory Testing (ET) là gì?
ET không phải là việc kiểm thử ngẫu nhiên. Nó là quá trình học hỏi thông qua việc thực hiện các hành động kiểm thử trong một khoảng thời gian nhất định, kết hợp giữa kỹ năng kiến thức sản phẩm và kỹ thuật test case. Người tester hoạt động như một nhà thám hiểm: họ không đi theo bản đồ (test case) mà tự vẽ ra con đường tối ưu để tìm ra lỗi.

**Sức mạnh:** Khả năng phát hiện các lỗi "khó lường" (unknown unknowns).
**Điểm yếu khi chưa cấu trúc:** Thiếu tính minh bạch về phạm vi, mục tiêu và nguồn lực sử dụng trong mỗi phiên.

### 2. Session-Based Test Management (SBTM) là gì?
SBTM là một khuôn khổ giúp các nhóm QA quản lý các buổi kiểm thử khám phá bằng cách áp dụng cấu trúc của các session thực tế vào quy trình QA. Nó biến một hành động tự do thành một *sự kiện kỹ thuật* có đầu vào, quá trình và đầu ra rõ ràng.

**Tóm lại:** SBTM không thay thế ET; nó **cấu trúc hóa (structures)** ET.

## 🎯 II. Cơ chế hoạt động: Từ "Nghệ Thuật" sang "Kỹ Thuật"

Khi áp dụng SBTM, chúng ta buộc bản thân phải trả lời các câu hỏi sau trước khi bấm nút Play/Start Test Session:

1. **Mục tiêu (Goal):** Chúng ta đang cố gắng chứng minh điều gì? (Ví dụ: Kiểm tra tính tương thích của chức năng Thanh toán trên cả 3 trình duyệt chính).
2. **Phạm vi (Scope):** Chúng ta được phép kiểm thử những khu vực nào và KHÔNG được chạm vào những khu vực nào?
3. **Thời gian (Timebox):** Chúng ta có bao nhiêu thời gian cho phiên này?

### Ví dụ minh họa về Chartering (Thiết lập Điều lệ Kiểm thử)

Thay vì chỉ viết một danh sách các bước, chúng ta cần một **Test Charter**. Đây là bản tuyên ngôn định hình toàn bộ buổi kiểm thử.

*   **❌ Truyền thống (Scripted):** `[Bước 1] Nhấp vào nút Login. [Bước 2] Điền user/pass.`
*   **✅ SBTM Charter:**
    *   **Test ID:** ET\_Payment\_BrowserCompat\_V1.1
    *   **Goal:** Xác minh tính ổn định và khả năng sử dụng của luồng thanh toán khi người dùng thay đổi viewport hoặc trình duyệt giữa các bước.
    *   **Scope (In):** Trang giỏ hàng, cổng thanh toán mô phỏng.
    *   **Scope (Out):** Hệ thống tài khoản người dùng (user profile/CRM).
    *   **Resources:** Chrome (Desktop), Safari (Mobile Viewport), Timebox: 90 phút.

Việc này giúp mọi người hiểu rõ *giới hạn và mục đích* của buổi kiểm thử, giảm thiểu rủi ro "lạc đề" và tối ưu hóa nguồn lực.

## 🛠️ III. Triển khai thực tế: Các bước thực hiện theo mô hình QE Lead

Với vai trò là QE Lead, tôi khuyến nghị áp dụng quy trình 4 pha sau để triển khai SBTM một cách bài bản nhất trong đội ngũ của bạn.

### Pha 1: Phân tích Rủi ro và Xác định Mục tiêu (Risk Analysis & Goal Setting)
Đây là bước quan trọng nhất. Chúng ta không thể kiểm thử mọi thứ, nên phải biết *phải* kiểm thử cái gì.

**Thực hành:** Sử dụng kỹ thuật **Decomposition of Scope**. Thay vì nhận scope "Toàn bộ ứng dụng", hãy chia thành các module nhỏ và phân loại theo mức độ rủi ro (Criticality).

| Module | Rủi ro Cao/Thấp | Test Goal Dự kiến |
| :---: | :---: | :---: |
| Authentication | Rất Cao (Dữ liệu người dùng) | Đảm bảo các luồng đăng nhập/logout hoạt động nhất quán trên mọi thiết bị. |
| Payment Gateway | Rất Cao (Tài chính) | Mô phỏng đủ kịch bản lỗi và thành công của giao dịch tài chính. |
| Widget Hiển thị | Thấp (Tính thẩm mỹ) | Kiểm tra sự tương thích giữa các trình duyệt, không liên quan đến nghiệp vụ cốt lõi. |

### Pha 2: Thiết lập Session Charter (The Planning Phase)
Xây dựng bản charter như đã mô tả ở phần trên, bao gồm việc phân bổ thời gian và xác định người thực hiện/người hỗ trợ (Tester/Observer).

### Pha 3: Thực thi Kiểm thử có cấu trúc (Execution)
Trong buổi session, mọi hành động của tester phải được ghi chép không chỉ là "Tìm thấy bug X" mà còn phải đi kèm với **Lý do tại sao nó xảy ra** và **Điều kiện nào đã dẫn đến lỗi đó**.

Giả sử bạn dùng công cụ quản lý test case (như TestRail hoặc Jira), thay vì tạo một kịch bản, bạn sẽ ghi lại các sự kiện:

```python
# Pseudo-Code minh họa việc ghi nhận session results
class TestSessionResult:
    def __init__(self, chartered_goal):
        self.start_time = datetime.now()
        self.goal = chartered_goal
        self.bugs_found = []
        self.test_discoveries = []

    def record_discovery(self, area, description, severity):
        # Ghi lại các điểm đáng chú ý không phải bug
        self.test_discoveries.append({'area': area, 'desc': description})

    def log_bug(self, step, actual_result, expected_condition, priority):
        # Chi tiết hóa lỗi: bước nào? Kết quả thực tế là gì? Điều kiện mong đợi ra sao?
        self.bugs_found.append({
            'step': step, 
            'actual': actual_result, 
            'expected': expected_condition, 
            'priority': priority
        })

# Ví dụ sử dụng:
session = TestSessionResult("Kiểm tra tính tương thích khi người dùng chuyển đổi ngôn ngữ.")

# Giả lập hành động khám phá
session.record_discovery("Header", "Icon giỏ hàng bị nhầm với icon tài khoản trên màn hình di động.", "Cosmetic")
session.log_bug("Chuyển vị trí", "URL trả về là 404, thay vì trang chủ.", "Phải là Trang Chủ (Homepage)", "Critical")

# Output cuối cùng: Một báo cáo rất rõ ràng và có thể truy vết được!
```

### Pha 4: Báo cáo và Phân tích Độ bao phủ (Reporting & Coverage Analysis)
Đây là giá trị cốt lõi mà SBTM mang lại. Sau khi kết thúc phiên, bạn không chỉ báo cáo "Tôi đã tìm thấy X bugs", mà bạn phải báo cáo: **"Chúng ta đã kiểm tra sâu vào phạm vi Y với các mục tiêu A và B."**

*   Sử dụng Test Charter làm cơ sở để xác định độ bao phủ (Coverage Matrix).
*   Đo lường tỷ lệ thành công/thất bại của từng module.
*   Xác định các vùng rủi ro chưa được khám phá đủ sâu (Gap Analysis) và lập kế hoạch cho phiên tiếp theo.

## 💡 IV. Kết luận từ Góc nhìn QE Lead

Các bạn thân mến, Exploratory Testing là một tài sản quý giá của đội ngũ QA. Nó mang lại khả năng phát hiện những lỗ hổng tiềm ẩn mà không kịch bản nào viết ra được.

Tuy nhiên, để biến nó thành một **Quy trình Quản lý Chất lượng (Quality Process)** thay vì chỉ là hoạt động cá nhân, các bạn cần phải áp dụng SBTM. Hãy nhớ rằng: **Chất lượng nằm ở việc đo lường và quy trình.**

Bằng cách cấu trúc hóa những phiên khám phá này, chúng ta không chỉ tăng khả năng tìm lỗi mà còn nâng cao tính minh bạch (Transparency) của toàn bộ quá trình kiểm thử, giúp báo cáo chất lượng sản phẩm trở nên chuyên nghiệp và có trọng lượng trước đội ngũ quản lý dự án.

Chúc các bạn áp dụng thành công phương pháp này và đạt được những kết quả đột phá trong công việc!

***
*Hồng Dung - QE Lead*