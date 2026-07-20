---
title: "Chiến lược xử lý Flaky Tests trong các dự án kiểm thử tự động quy mô lớn"
date: 2026-06-08
description: "Bài viết chuyên sâu từ QE Lead Hoàng Hiệp về việc nhận diện, phân tích nguyên nhân và áp dụng chiến lược bền vững để loại bỏ Flaky Tests."
tags: ["Automation","QA Strategy","Testing"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hoàng Hiệp"
---

# Chiến lược xử lý Flaky Tests trong các dự án kiểm thử tự động quy mô lớn

Chào các đồng nghiệp QA và kỹ sư phát triển, tôi là Hoàng Hiệp. Trong hành trình xây dựng một hệ thống CI/CD (Continuous Integration/Continuous Delivery) mạnh mẽ, chúng ta thường đối mặt với những "kẻ thù vô hình" mang tên **Flaky Tests** (Kiểm thử không ổn định).

Nếu bạn đã từng chứng kiến cảnh bộ test chạy qua lần thứ nhất báo Fail do lỗi không rõ nguyên nhân, nhưng khi rerun lại 5 phút sau thì Passed một cách ngoạn mục – bạn hiểu cảm giác hoang mang đó là gì. Flaky tests làm xói mòn niềm tin vào toàn bộ hệ thống kiểm thử tự động của chúng ta.

Trong các dự án quy mô lớn, nơi có hàng trăm, thậm chí hàng nghìn kịch bản test chạy liên tục, một tỷ lệ flakiness cao không chỉ gây mất thời gian debug vô ích mà còn dẫn đến việc đội ngũ QA bắt đầu nghi ngờ chính sản phẩm mình đang kiểm thử.

Bài viết này không chỉ đưa ra các mẹo vặt (như tăng `sleep()` hay thêm cơ chế retry) mà là một cái nhìn chiến lược, chuyên sâu về cách chúng ta tiếp cận Flakiness như một vấn đề kiến trúc của hệ thống, chứ không phải là lỗi cú pháp đơn thuần.

***

## 🔎 Phần I: Hiểu bản chất của Flaky Tests

### 1. Định nghĩa và Hậu quả
**Flaky Test** là thuật ngữ chỉ các bài kiểm thử tự động có hành vi không ổn định: chúng đôi khi **Fail** và đôi khi lại **Pass**, mà mà nguyên nhân Fail đó lại phụ thuộc vào điều kiện môi trường, thứ tự chạy test, hoặc thời điểm cụ thể (timing).

**Hậu quả lớn nhất:**
*   **Thiếu niềm tin (Loss of Trust):** Đội ngũ phát triển sẽ bỏ qua báo cáo lỗi (false negative) vì họ biết rằng "có thể chỉ là do bộ test".
*   **Nghẽn luồng công việc (CI/CD Bottleneck):** Yêu cầu phải chạy lại nhiều lần, làm chậm chu kỳ phản hồi của sản phẩm.
*   **Chi phí vận hành tăng cao:** Kỹ sư phải dành thời gian quý giá để phân biệt giữa *lỗi thực tế của ứng dụng (Bug)* và *lỗi của bộ test (Flakiness)*.

### 2. Phân loại Nguyên nhân Gốc rễ (Root Causes)
Trước khi chữa trị, chúng ta cần chẩn đoán chính xác. Flaky tests chủ yếu xuất phát từ ba nhóm nguyên nhân:

1.  **Vấn đề Đồng bộ hóa (Synchronization Issues):** Đây là nguyên nhân phổ biến nhất trong kiểm thử UI/E2E. Test script cố gắng tương tác với một phần tử giao diện người dùng (DOM) trước khi nó thực sự sẵn sàng trên trình duyệt.
    *   *Ví dụ:* Code tìm kiếm nút "Submit" ngay lập tức sau khi click, nhưng hệ thống backend vẫn đang tải tài nguyên và DOM chưa kịp render button đó.
2.  **Vấn đề Điều kiện đua (Race Conditions):** Các test case phụ thuộc vào trạng thái của một test case khác hoặc môi trường bên ngoài mà không được cô lập đúng cách.
    *   *Ví dụ:* Test Case A tạo dữ liệu người dùng với ID 100, và Test Case B chạy sau đó lại thao tác trên cùng ID này khi hệ thống vẫn đang xử lý giao dịch của A.
3.  **Vấn đề Môi trường & Phụ thuộc (Environmental/Dependency Issues):**
    *   Mạng chậm, bộ nhớ máy chủ quá tải, hoặc các microservice bên ngoài không nhất quán về trạng thái (state).

***

## 🛠️ Phần II: Chiến lược Xử lý Ba Tầng (Three-Tier Strategy)

Để xử lý Flakiness, chúng ta cần tiếp cận theo từng tầng từ "Miễn dịch cục bộ" đến "Kiến trúc toàn hệ thống".

### Tier 1: Cấp độ Code Test Case (Local Fixes - Nâng cao kỹ thuật)

Đây là những giải pháp trực tiếp tại điểm thất bại, nhưng phải hết sức thận trọng.

#### A. Tuyệt đối tránh `Thread.sleep()`
Sử dụng hàm delay cố định như `time.sleep(5)` chỉ là "giải pháp băng bó" (band-aid fix). Nó không đảm bảo rằng phần tử sẽ sẵn sàng sau 5 giây; nó chỉ gây lãng phí thời gian chờ đợi một cách mù quáng, làm chậm toàn bộ suite test mà không giải quyết nguyên nhân gốc rễ.

#### B. Áp dụng Explicit Waits (Điều kiện Chờ rõ ràng)
Đây là tiêu chuẩn vàng trong kiểm thử UI tự động. Thay vì chờ một khoảng thời gian cố định, chúng ta chỉ chờ cho đến khi *điều kiện mong muốn* xảy ra.

**Ví dụ minh họa (Sử dụng cú pháp của Selenium/Playwright):**

```python
# ❌ Cách làm SAI: Sử dụng Sleep cứng
# time.sleep(5) # Rủi ro mất thời gian và không chắc chắn

# ✅ Cách làm ĐÚNG: Explicit Wait - Chờ cho đến khi element có thể click được
try:
    element = wait.until(EC.element_to_be_clickable((By.ID, "submit-button")))
    element.click()
except TimeoutException:
    print("Lỗi: Nút chưa hiển thị trong khung thời gian cho phép.")

```

#### C. Cơ chế Retry (Controlled Retries)
Cơ chế retry không phải là giải pháp chính, nhưng có thể chấp nhận được khi Flakiness bị nghi ngờ do các lỗi mạng thoáng qua (transient network errors). Tuy nhiên, việc này cần giới hạn nghiêm ngặt: chỉ thử lại 1-2 lần, và phải kết hợp với logging chi tiết để phân biệt giữa *lỗi vĩnh viễn* và *lỗi nhất thời*.

### Tier 2: Cấp độ Test Module & Thiết kế (System Design - Nâng cao quy trình)

Nếu Tầng 1 không giải quyết được vấn đề, chúng ta phải thay đổi cách viết test.

#### A. Nguyên tắc Cô lập Test Case (Isolation Principle)
Mỗi test case phải hoạt động độc lập hoàn toàn với các test case khác.

*   **Việc cần làm:** Thay vì để `Test_A` tạo dữ liệu và sau đó truyền kết quả cho `Test_B`, hãy đảm bảo rằng cả hai đều khởi động từ trạng thái sạch (Clean Slate).
*   **Giải pháp kỹ thuật:** Sử dụng các `@BeforeSuite`/`@AfterSuite` hoặc `@Setup`/`@Teardown` để **dọn dẹp dữ liệu** sau khi mỗi test case chạy xong.

#### B. Quản lý Dữ liệu Kiểm thử (Test Data Management - TDM)
Never Hardcode Test Data. Luôn sử dụng các cơ chế Mocking, Stubbing hoặc Database Seed để cấp phát dữ liệu duy nhất cho từng lần chạy.
*   Nếu bạn phải gọi API: hãy dùng *Contract Testing* để xác minh rằng API phản hồi ổn định, thay vì chỉ dựa vào việc test trên giao diện người dùng (UI).

### Tier 3: Cấp độ Kiến trúc và Hạ tầng (Architecture & Infrastructure - Nâng cao quy mô)

Đây là cấp độ của một QE Lead thực thụ. Nếu Flaky Tests vẫn tồn tại sau khi tối ưu code, vấn đề nằm ở môi trường chạy test.

#### A. Xây dựng Môi trường Kiểm thử Tách biệt (Dedicated Environments)
Tuyệt đối không nên sử dụng các môi trường Dev hoặc Staging đang được phát triển cùng lúc làm nơi chạy kiểm thử tự động chính thức. Cần một môi trường Test/QA riêng, cố định và được mô phỏng *gần nhất* với Production.

#### B. Sử dụng Service Virtualization / Mocking
Đối với các dịch vụ phụ thuộc bên ngoài (ví dụ: hệ thống thanh toán của bên thứ ba, API thời tiết), chúng ta phải cô lập chúng bằng cách sử dụng **Mock Services**. Việc này đảm bảo rằng tốc độ và trạng thái của test không bị ảnh hưởng bởi sự chậm trễ hoặc lỗi của hệ thống con.

#### C. Phân tích Tỷ lệ Flakiness (Flakiness Ratio Tracking)
Bắt buộc phải có một bảng điều khiển (Dashboard) theo dõi chỉ số quan trọng: **Tỷ lệ Fail do flakiness / Tổng số Test Case**. Nếu tỷ lệ này vượt ngưỡng an toàn (ví dụ: $>5\%$), thì việc phát hành bản build đó phải bị chặn lại cho đến khi Flaky Tests được khắc phục.

***

## 📚 Tóm tắt và Hành động Kế tiếp (Summary & Action Plan)

| Vấn đề Gặp | Nguyên nhân Chủ yếu | Giải pháp Ưu tiên Cao nhất | Mô tả Chiến lược |
| :--- | :--- | :--- | :--- |
| Test Fail ngẫu nhiên, không lặp lại được. | Synchronization Issues (DOM loading/Async calls). | **Explicit Waits** | Thay thế `time.sleep()` bằng chờ điều kiện cụ thể (Element Clickable, Visible...). |
| Test A làm hỏng trạng thái cho Test B. | Thiếu Isolation & TDM. | **Setup/Teardown Lifecycle Hooks** | Đảm bảo mỗi test bắt đầu và kết thúc ở trạng thái sạch, độc lập. |
| Test Fail do dịch vụ ngoài chậm hoặc lỗi. | Dependency on external services. | **Service Virtualization / Mocking** | Cô lập các thành phần bên ngoài để đảm bảo tốc độ test nhất quán. |
| Flakiness vẫn tồn tại sau khi tối ưu code. | Vấn đề kiến trúc, môi trường chung. | **Kiểm toán Hạ tầng (Infra Audit)** | Xem xét việc chuyển sang kiến trúc Microservice Testing hoặc container hóa môi trường Test. |

**Lời khuyên cuối cùng từ tôi:** Việc loại bỏ Flaky Tests là một quá trình liên tục và tốn kém về mặt nhân lực. Đừng coi nó là nhiệm vụ của riêng QE nào đó, mà hãy nâng nó thành một **Chỉ số Sức khỏe Chất lượng (Quality Health Metric)** được toàn đội ngũ QA/Dev chịu trách nhiệm theo dõi.

Nếu bộ test không đáng tin cậy, chúng ta sẽ chỉ đang xây dựng sự tự mãn thay vì chất lượng sản phẩm thực tế. Hãy chiến đấu để đảm bảo rằng mỗi lần chạy CI/CD báo `PASS`, đó là một niềm vui chính đáng!

Chúc các bạn thành công trong việc xây dựng các hệ thống kiểm thử tự động bền vững.

**Hoàng Hiệp**
*QE Lead, Automation Architect*