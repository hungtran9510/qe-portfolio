---
title: "Kỹ thuật Exploratory Testing có cấu trúc bằng Session-Based Test Management"
date: 2026-03-30
description: "Nắm vững cách biến sự khám phá ngẫu hứng thành chiến lược kiểm thử có hệ thống với SBTM."
tags: ["Exploratory Testing","QA Strategy","Manual Testing"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hồng Dung"
---

# Kỹ thuật Exploratory Testing có cấu trúc bằng Session-Based Test Management

Xin chào các đồng nghiệp trong lĩnh vực Đảm bảo Chất lượng! Tôi là Hồng Dung.

Trong hành trình QA, chúng ta thường xuyên đối mặt với một khái niệm vừa bí ẩn, vừa mạnh mẽ: *Exploratory Testing (ET)* – Kiểm thử Khám phá. ET được ca ngợi vì khả năng tìm ra những lỗi không thể dự đoán bằng các kịch bản Test Case truyền thống. Tuy nhiên, nếu chỉ dừng lại ở việc "thử mọi thứ" một cách hoang mang, chúng ta có nguy cơ lãng phí thời gian, bị phân tán nguồn lực và quan trọng nhất là thiếu khả năng báo cáo chiến lược rõ ràng cho đội phát triển (Dev).

Vấn đề của ET không phải là bản chất, mà là sự *thiếu cấu trúc*.

Bài viết hôm nay tôi sẽ chia sẻ một giải pháp mang tính bước ngoặt: **Kết hợp Kỹ thuật Exploratory Testing với Session-Based Test Management (SBTM)**. Đây chính là cách chúng ta biến quá trình "khám phá" thành một quy trình khoa học, có thể đo lường, theo dõi và báo cáo hiệu quả cao nhất.

---

## 🔍 Phần I: Hiểu rõ bản chất của vấn đề

### 1. Exploratory Testing (ET) là gì?

Về cốt lõi, ET không phải là việc thực hiện một bộ test case đã định trước. Nó là một quá trình học hỏi và kiểm thử song song *(Simultaneous Learning and Test Design)*. Tester chủ động sử dụng kiến thức, kinh nghiệm và trực giác của mình để tìm ra các lỗ hổng (bugs), thay vì chỉ làm theo những gì tài liệu yêu cầu.

**Ưu điểm:** Khả năng phát hiện lỗi "tầng sâu" (deep-seated bugs) mà các test case truyền thống bỏ sót.
**Nhược điểm (Khi không có cấu trúc):** Thiếu sự tập trung, thiếu tính tái lập (reproducibility), và khó khăn trong việc đánh giá phạm vi kiểm thử (coverage).

### 2. Session-Based Test Management (SBTM) là gì?

Nếu ET là nghệ thuật, thì SBTM chính là bộ luật định hình nghệ thuật đó.

**SBTM** là một khuôn khổ giúp *cấu trúc hóa* quá trình Exploratory Testing bằng cách chia nó thành các phiên kiểm thử có thời hạn, mục tiêu và phạm vi rõ ràng. Thay vì khám phá vô định, tester sẽ thực hiện "khám phá có chỉ dẫn" (Guided Exploration).

Nói cách khác, SBTM cung cấp một bản đồ chiến lược, giúp chúng ta đi từ điểm A đến điểm B theo những con đường được xác định trước, nhưng vẫn giữ đủ sự linh hoạt để rẽ ngang khi phát hiện ra thứ gì đó thú vị.

---

## 🛠️ Phần II: Các thành phần cốt lõi của SBTM

Một phiên kiểm thử theo mô hình SBTM cần bốn yếu tố nền tảng sau:

### 1. Test Charter (Điều lệ Kiểm thử)
Đây là tài liệu "Bản Tuyên ngôn" của buổi session. Nó định nghĩa rõ ràng mục đích và phạm vi chính. *Tại sao chúng ta đang kiểm thử? Chúng ta muốn tìm kiếm loại bug gì?*

**Ví dụ:** Thay vì "Kiểm tra toàn bộ tính năng thanh toán," Test Charter nên là: "Xác định các kịch bản mất kết nối mạng xảy ra trong quá trình hoàn thành giao dịch bằng thẻ tín dụng."

### 2. Timebox (Khung thời gian)
Đây là giới hạn về thời gian (ví dụ: 2 giờ). Timebox giúp duy trì sự tập trung và buộc tester phải đưa ra các quyết định nhanh chóng, tránh lan man không cần thiết. Khi hết timebox, chúng ta *phải* tóm tắt những gì đã làm được.

### 3. Scope & Goal (Phạm vi và Mục tiêu)
*   **Scope:** Những tính năng/module nào **bắt buộc phải được xem xét**. Giúp loại bỏ việc "nghiên cứu sâu quá mức" ở các khu vực không quan trọng.
*   **Goal:** Kết quả cụ thể mong muốn đạt được (ví dụ: Xác minh chức năng đăng nhập bị mất mật khẩu hoạt động với các biến đổi của độ dài mã xác nhận).

### 4. Test Report / Session Log (Báo cáo phiên)
Đây là đầu ra cực kỳ quan trọng, khác hẳn với báo cáo truyền thống chỉ ghi lại "Pass/Fail". Báo cáo SBTM phải ghi lại:
*   Các **Kỹ thuật** đã được sử dụng (ví dụ: Boundary value analysis, State Transition).
*   Các **Giả định (Assumptions)** đã làm.
*   Các **Lỗi tìm thấy**.
*   **Hạn chế** của phiên kiểm thử (Những gì chưa kịp test do giới hạn thời gian/scope).

---

## 🧑‍💻 Phần III: Áp dụng thực tế - Quy trình 4 bước (The Workflow)

Tôi xin minh họa một quy trình tối ưu để tổ chức một buổi SBTM chuyên nghiệp.

### Bước 1: Lên kế hoạch Session (Pre-Session Planning)
*   **Hoạt động:** QE Lead/Team Lead làm việc với Product Owner và Dev để xác định Test Charter, Scope, Goal và Timebox.
*   **Đầu ra:** Tài liệu SBTM Charter được ký duyệt bởi các bên liên quan.

### Bước 2: Thực thi Session (Execution)
*   **Hoạt động:** Tester bắt đầu phiên làm việc. Thay vì ghi lại test case, họ phải duy trì một **Test Log/Notes**. Mỗi khi khám phá ra một hành vi, họ cần ghi chú kèm theo *lý do* và *kỹ thuật* được sử dụng.

### Bước 3: Tóm tắt và Phân tích (Debriefing)
*   **Hoạt động:** Khi hết Timebox, toàn bộ đội QA họp lại để xem xét Test Log. Các câu hỏi cần trả lời là: "Chúng ta đã khám phá những gì?" và "Những lỗ hổng nào chúng ta chưa kịp nhìn thấy?".
*   **Đầu ra:** Danh sách các hành vi đáng ngờ (Potential Bugs) và các nhiệm vụ kiểm thử ưu tiên tiếp theo (Next Session Scope).

### Bước 4: Cải tiến (Iteration)
*   Các bug tìm được sẽ được Dev xử lý. Sau khi fix, một Test Charter mới với **Scope hẹp hơn** (chỉ tập trung vào khu vực vừa sửa) sẽ được tạo ra cho lần lặp kiểm thử tiếp theo. Đây là tính tuần hoàn và quản lý rủi ro cao nhất của SBTM.

---

## ⚙️ Phần IV: Code Example Minh họa Cơ chế Chartering

Để trực quan hóa sự khác biệt giữa một lịch trình test case truyền thống và việc định nghĩa Test Charter trong SBTM, tôi xin đưa ra một ví dụ giả lập bằng ngôn ngữ Pseudocode (Ngôn ngữ Giả mã).

Giả sử chúng ta đang kiểm thử module quản lý đơn hàng.

**1. Cách tiếp cận Truyền thống (Test Case File):**
```python
# Test_Plan_V2.py
test_case("TC_ORDER_001", preconditions="User logged in", steps=["Select Product A", "Add to Cart"], expected_result="Product added"))
test_case("TC_ORDER_002", preconditions="Cart items > 0", steps=["Checkout", "Use PayPal"], expected_result="Payment successful")
# ... Chỉ là một danh sách các hành động đã biết
```

**2. Cách tiếp cận SBTM (Defining the Session Charter):**
Chúng ta không viết test case, mà định nghĩa **điều kiện khám phá**:

```python
# SBTM_Charter_OrderFlow_V1.py

session_charter(
    title="Session 003: Validation of Payment Failure States",
    timebox_hours=2,
    scope={
        "Focus_Area": ["Payment Gateway Integration", "Error Handling"],
        "Constraint": "Only focus on scenarios involving interrupted connections or rejected cards."
    },
    goal={
        "Primary_Objective": "Identify all potential dead-end states during payment processing.",
        "Success_Criteria": "Develop a matrix mapping error codes to user feedback messages."
    },
    risk_assumption="Assuming the backend API response structure is stable for this session." # Giả định rủi ro/kỹ thuật
)

# Sau khi chạy phiên:
record_session_result(
    bugs_found=3,
    new_scope_required=["Interruption during payment confirmation"],
    notes="Phát hiện rằng việc xóa sản phẩm sau khi đã bắt đầu quá trình checkout gây ra lỗi state không được xử lý."
)
```

### Giải thích Code:
Trong ví dụ này, chúng ta thấy sự dịch chuyển từ việc **ghi lại hành động** (TC\_ORDER\_001) sang việc **đặt câu hỏi và thiết lập giới hạn** (`session_charter`). Bằng cách định nghĩa `scope` và `goal`, bất kỳ thành viên nào tham gia session đều biết rằng, dù họ khám phá ra gì ngoài phạm vi đó, ưu tiên của họ vẫn phải là tìm kiếm các *lỗi liên quan đến Payment Failure*.

---

## ✨ Phần V: Lợi ích vượt trội khi áp dụng SBTM

1. **Tính Minh bạch (Transparency):** Giúp mọi người hiểu được đội QA đang kiểm thử *việc gì*, chứ không chỉ là *test case nào*.
2. **Tối ưu hóa Hiệu suất (Efficiency):** Loại bỏ việc lãng phí thời gian vào các tính năng ổn định, tập trung vào các khu vực có rủi ro cao nhất (high-risk areas) và những điểm giao tiếp phức tạp (integration points).
3. **Khả năng Tái sử dụng Chiến lược:** Các Charter đã được tạo ra trở thành tài liệu chiến lược quý giá cho lần sprint sau, giúp tối ưu hóa vòng đời kiểm thử theo thời gian.

**Lời kết của Hồng Dung:**

Exploratory Testing không phải là hành động ngẫu nhiên; đó là một quy trình có tính nghệ thuật nhưng phải được kiểm soát bằng khoa học. Bằng cách áp dụng **Session-Based Test Management**, chúng ta đã đưa sự khám phá từ tầm mức "nghệ thuật trực giác" lên thành cấp độ **"Kỹ thuật quản lý rủi ro hệ thống"**.

Tôi khuyến khích các bạn trong đội ngũ QA hãy bắt đầu bằng việc viết các Charter chi tiết, thay vì chỉ lập danh sách Test Case. Đó sẽ là bước tiến lớn giúp chiến lược kiểm thử của nhóm bạn trở nên vừa linh hoạt, vừa mạnh mẽ!

Chúc các đồng nghiệp luôn giữ vững ngọn lửa đam mê và tầm nhìn chất lượng!
***