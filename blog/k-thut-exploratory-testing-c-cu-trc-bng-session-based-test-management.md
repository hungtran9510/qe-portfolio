---
title: "Kỹ thuật Exploratory Testing có cấu trúc bằng Session-Based Test Management"
date: 2026-04-04
description: "Nâng tầm E2E của bạn! Khám phá cách áp dụng mô hình Session-Based Test Management để biến khám phá (discovery) thành một quy trình kiểm thử khoa học, có đo lường được."
tags: ["Exploratory Testing","QA Strategy","Manual Testing"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hồng Dung"
---

# Kỹ thuật Exploratory Testing có cấu trúc bằng Session-Based Test Management

Chào các bạn đồng nghiệp trong lĩnh vực chất lượng phần mềm. Tôi là Hồng Dung, và trong suốt hành trình sự nghiệp QA của mình, tôi nhận thấy một nghịch lý thú vị: kiểm thử tự động (Automation) giúp chúng ta đạt được độ bao phủ (coverage) cao về mặt *ghi lại* (recorded), nhưng đôi khi, nó lại bỏ sót những vấn đề đến từ *trực giác* và *sáng tạo*.

Đó chính là nơi **Exploratory Testing (E2E)** tỏa sáng.

Tuy nhiên, rất nhiều đội ngũ vẫn xem E2E như một hoạt động "đi dạo" ngẫu hứng—một sự kiểm thử bản năng không được ghi nhận hay báo cáo hệ thống. Khi E2E thiếu cấu trúc, nó sẽ dễ biến thành một hoạt động mù quáng (chaos), gây khó khăn cho việc đo lường hiệu quả, quản lý rủi ro và quan trọng nhất là việc chứng minh độ bao phủ thực tế trước khách hàng hoặc các bên liên quan.

Bài viết này của tôi không chỉ dừng lại ở việc nhắc bạn "hãy khám phá đi"; chúng ta sẽ đào sâu vào một kỹ thuật tiên tiến: **Áp dụng Session-Based Test Management (SBTM)** để biến sự khám phá thành một quy trình khoa học, có cấu trúc và cực kỳ hiệu quả.

***

## 🧩 I. Nhắc lại về Exploratory Testing (E2E)

Trước khi đi vào giải pháp, chúng ta cần thống nhất về bản chất của E2E.

**Exploratory Testing là gì?**
Đây không phải là chạy các test case đã được viết sẵn. Đây là một phương pháp kiểm thử chủ động, nơi chuyên gia QA sử dụng kiến thức sâu rộng về sản phẩm và kỹ thuật để tìm ra lỗi càng nhanh càng tốt trong một khoảng thời gian nhất định, dựa trên trực giác (Heuristics) thay vì chỉ tuân theo kịch bản (Script).

**Sức mạnh của E2E:** Khả năng khám phá các luồng lỗi (edge cases), xung đột giao diện người dùng (UI conflicts), hoặc các vấn đề tương tác giữa các module mà nhà phát triển có thể đã bỏ sót.

**Vấn đề cốt lõi khi thiếu cấu trúc:** Thiếu sự đo lường, khó khăn trong việc tái lập kết quả (reproducibility), và không khả năng trả lời câu hỏi: "Trong phiên này, chúng ta đã bao phủ được những khu vực nào?"

***

## 🚀 II. Giải pháp: Session-Based Test Management (SBTM)

Session-Based Test Management là khuôn khổ giúp đưa sự tự phát của E2E vào một quy trình có tổ chức và tính toán. Thay vì coi nó là một hoạt động vô định, chúng ta biến nó thành một "phiên làm việc" được quản lý nghiêm ngặt, giống như một buổi nghiên cứu khoa học.

**SBTM trả lời các câu hỏi quan trọng sau:**
1. **Mục tiêu (Objective):** Chúng ta đang tìm kiếm loại lỗi nào? (Ví dụ: Lỗi hiệu năng khi người dùng đa nhiệm; hoặc lỗi nghiệp vụ trên luồng thanh toán).
2. **Phạm vi (Scope):** Những tính năng/module nào sẽ được khám phá trong phiên này?
3. **Bằng chứng (Proof):** Kết quả và phương pháp luận phải được ghi lại như thế nào để đội ngũ có thể học hỏi và tái sử dụng.

### 🧭 Quy trình triển khai một Session-Based Test

Một session chuẩn theo mô hình SBTM sẽ bao gồm các bước sau:

1. **Thiết lập Charter (Charter Definition):**
   * Xác định rõ ràng chủ đề, rủi ro cao nhất, tính năng ưu tiên cần kiểm tra, và thời gian giới hạn (Timeboxing).
2. **Thực hiện Session (Execution):**
   * Trong phiên thực tế, người QA phải ghi lại *hành động*, *sự phán đoán* và *ý do* khi thực hiện từng bước. Điều này khác biệt hoàn toàn so với việc chỉ tick vào một kịch bản đã có sẵn.
3. **Báo cáo (Reporting):**
   * Không chỉ báo cáo lỗi tìm thấy (Bug Report), mà còn phải báo cáo về **Độ Bao Phủ (Coverage)** và **Hiệu Quả (Efficiency)** của phiên làm việc đó.

***

## 📝 III. Ví dụ Thực tế: Sự khác biệt giữa E2E "Mù Lẫn" và E2E Cấu Trúc

Hãy hình dung chúng ta đang kiểm thử một tính năng đăng nhập mới trên ứng dụng thương mại điện tử.

**⚡ Trường hợp 1: E2E Thiếu Cấu trúc (Chaos)**
*   QA A tự nhiên nhấn vào Đăng xuất -> Sau đó bấm nút "Quên mật khẩu" -> Nhấn xem các ảnh sản phẩm -> Quay lại trang chủ...
*   Kết quả: Có thể tìm ra lỗi, nhưng không ai biết liệu nó có liên quan đến nghiệp vụ nào, hay chỉ là sự ngẫu nhiên. Khó báo cáo cho PM và đội ngũ phát triển vì thiếu *lý thuyết hỗ trợ*.

**⚙️ Trường hợp 2: E2E Có Cấu trúc bằng SBTM (Structured)**
*   **[Charter]:** Mục tiêu là kiểm tra độ ổn định của các luồng người dùng quan trọng nhất (Happy Path) và xác minh các điểm tích hợp dữ liệu giữa Đăng nhập $\rightarrow$ Hồ sơ người dùng. Giới hạn: 90 phút.
*   **[Session Logging]:** QA sẽ theo dõi:
    1.  Thời gian làm việc tại module nào.
    2.  Bao nhiêu hành động đã được thực hiện trên mỗi thành phần (Components).
    3.  Các rủi ro tiềm ẩn đã được kiểm tra (Ví dụ: Test quên chuyển đổi ngôn ngữ sau khi đăng nhập).

### 💻 Minh họa bằng Logic Code và Tracking Log

Trong môi trường CI/CD chuyên nghiệp, bạn nên xây dựng một lớp logic để quản lý phiên làm việc này. Dưới đây là pseudo-code minh họa cách chúng ta phải cấu trúc việc ghi log (logging) trong mỗi session:

```python
# Pseudo-Code cho Session Test Management System
class SessionTestManager:
    def __init__(self, charter_objective, scope):
        self.session_id = generate_unique_uuid()
        self.start_time = datetime.now()
        self.charter = charter_objective 
        self.scope = scope

    # Phương thức ghi lại hành động và quyết định của người kiểm thử
    def log_action(self, component: str, action: str, time_spent_minutes: float, rationale: str):
        """Ghi nhận một bước di chuyển hoặc tương tác cụ thể."""
        log_entry = {
            "timestamp": datetime.now(),
            "component": component,
            "action_taken": action, # Ví dụ: Attempting login with invalid format email
            "time_allocated": time_spent_minutes,
            "rationalization": rationale # QUAN TRỌNG NHẤT: Lý do tại sao ta làm điều này.
        }
        self.session_log.append(log_entry)

    # Phương thức báo cáo kết quả sau phiên test
    def generate_report(self):
        total_actions = len(self.session_log)
        coverage_score = calculate_component_depth(self.scope, self.session_log)
        
        print("--- SESSION REPORT ---")
        print(f"Session ID: {self.session_id}")
        print(f"Objective: {self.charter}")
        print(f"Total Time Spent: {datetime.now() - self.start_time}")
        print(f"Coverage Score (Độ sâu bao phủ): {coverage_score}%")
        # Danh sách lỗi được tìm thấy...

# Usage Example (Kiểm thử Luồng Khuyến Mãi)
manager = SessionTestManager("Xác minh mọi kịch bản giảm giá", "Module Promotions and Coupon Code").__init__()

# Action 1: Kiểm tra coupon hợp lệ với điều kiện A
manager.log_action("Coupon API", "Apply Valid Code XYZ", 5, "Testing standard use case for time-limited discount.")

# Action 2: Kiểm tra trường hợp lỗi (rủi ro)
manager.log_action("Form Validation", "Enter Coupon with wrong character set", 3, "Validating input sanitization and error message display.").

# End Session -> Báo cáo chi tiết về độ bao phủ và rủi ro đã được kiểm chứng.
```

**Lời giải thích của Hồng Dung:** Điểm khác biệt mấu chốt nằm ở trường `rationalization` (Lý do tại sao). Khi bạn buộc bản thân phải trả lời câu hỏi "Tại sao tôi lại thực hiện hành động này?", bạn đang tự chuyển đổi từ tư duy người dùng thành tư duy nhà khoa học, giúp mọi bước kiểm thử đều mang tính *mục đích* và *đo lường được*.

***

## 💡 IV. Kết luận: Biến Trực Giác Thành Dữ Liệu

Kỹ thuật Exploratory Testing vẫn là một tài sản vô giá trong bộ công cụ của một QE Lead, bởi vì máy móc chưa thể thay thế được trí tuệ con người để *suy luận* về lỗi.

Tuy nhiên, việc áp dụng **Session-Based Test Management** sẽ giúp bạn:
1. **Tăng Tính Khách Quan:** Loại bỏ yếu tố "may mắn" khỏi hoạt động kiểm thử bằng cách định nghĩa mục tiêu rõ ràng từ đầu phiên.
2. **Cải Thiện Quản Lý Rủi Ro:** Báo cáo không chỉ dừng lại ở Bug Count, mà còn bao gồm **Risk Coverage**: Chúng ta đã chủ đích test những rủi ro nào?
3. **Tạo Ra Tài Sản Tri Thức (Knowledge Asset):** Các log session của bạn trở thành tài liệu quý giá cho các chu kỳ phát triển tiếp theo, giúp đội ngũ biết được *những nơi nào* cần tập trung kiểm tra sâu hơn.

Hãy nhớ rằng, với vai trò QE Lead, trách nhiệm của chúng ta là không chỉ tìm ra lỗi, mà còn phải cung cấp một bằng chứng khoa học thuyết phục về chất lượng sản phẩm. SBTM chính là cây cầu nối hoàn hảo giữa sự sáng tạo tự do và tính minh bạch kỷ luật.

Chúc các bạn áp dụng thành công những kỹ thuật này để nâng tầm chiến lược QA của mình!