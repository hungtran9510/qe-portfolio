---
title: "Chiến lược xử lý Flaky Tests trong các dự án kiểm thử tự động quy mô lớn"
date: 2026-06-11
description: "Nắm vững nguyên nhân, áp dụng chiến lược bài bản để loại bỏ 'bệnh flakiness' và xây dựng bộ test automation đáng tin cậy."
tags: ["Automation","QA Strategy","Testing"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hoàng Hiệp"
---

# Chiến lược xử lý Flaky Tests trong các dự án kiểm thử tự động quy mô lớn

Chào các anh em đồng nghiệp và các đội ngũ phát triển sản phẩm! Tôi là Hoàng Hiệp, một Quality Engineer (QE) đã có nhiều năm kinh nghiệm trực tiếp làm việc với các hệ thống kiểm thử tự động quy mô hàng triệu dòng code.

Nếu bạn đang quản lý một bộ test automation lớn – nơi mà cứ đến khi chạy nightly build, đột nhiên vài cái test bị fail mà không rõ nguyên nhân – thì tôi biết cảm giác đó. Đó là sự bực bội tột độ, và thủ phạm chính của nó thường mang tên: **Flaky Tests**.

*Flaky Tests* (hay còn gọi là *Unstable Tests*) là những bài kiểm thử chỉ thỉnh thoảng bị fail (failure rate cao), không theo bất kỳ quy luật logic nào. Chúng khiến đội ngũ QA mất niềm tin vào bộ test, và tệ hơn nữa, nó làm chậm trễ tốc độ phát triển vì mọi người luôn dành thời gian để xác định: "Liệu cái này có thực sự bị lỗi hay chỉ là một flakiness?".

Bài viết này không chỉ đơn thuần đưa ra các giải pháp chữa cháy. Tôi sẽ chia sẻ những chiến lược toàn diện và mang tính kiến trúc (architectural) giúp bạn phòng ngừa, chẩn đoán, và loại bỏ căn bệnh 'flaky' khỏi hệ thống kiểm thử của mình.

***

## 🔬 I. Flakiness là gì và tại sao nó nguy hiểm?

Về mặt kỹ thuật, một flakiness xảy ra khi kết quả của test phụ thuộc vào các yếu tố bên ngoài môi trường thực thi (environment variables), thời gian CPU load, mạng lưới, hoặc đơn giản là thứ tự thực hiện (execution order).

**Sự nguy hiểm của Flaky Tests vượt xa việc làm chậm quá trình CI/CD:**

1. **Loss of Trust (Mất niềm tin):** Đây là rủi ro lớn nhất. Khi test liên tục fail ngẫu nhiên, đội ngũ sẽ bắt đầu *bỏ qua* các báo cáo lỗi tự động và chỉ tin vào những bài kiểm thử thủ công đã được xác minh lại bằng mắt.
2. **Analysis Paralysis:** Các nhà phát triển (Developers) mất thời gian tranh cãi về việc liệu đây là bug nghiêm trọng (bug in application code) hay chỉ là một vấn đề của CI pipeline (flakiness). Điều này làm giảm Product Velocity đáng kể.
3. **Debugging Debt:** Việc gỡ lỗi các test không ổn định tốn kém tài nguyên tính toán và nhân lực hơn nhiều lần so với việc tìm kiếm bug thực tế.

***

## 💡 II. Phân loại và Nguồn gốc Flakiness (Root Cause Analysis)

Để xử lý, trước hết chúng ta phải hiểu kẻ thù của mình. Có ba nhóm nguyên nhân chính gây ra flakiness trong các dự án lớn:

### 1. Timing Issues (Vấn đề về thời gian)
Đây là loại flaki nhất, thường xảy ra với UI automation (Selenium/Playwright). Chúng xảy ra khi test cố gắng tương tác với một phần tử DOM *trước* khi nó được render hoặc tải hoàn toàn.

*   **Biểu hiện:** Test thất bại với thông báo `Element not visible` hoặc `TimeoutException`, dù về mặt logic, phần tử đó phải tồn tại.
*   **Nguyên nhân chính:** Sử dụng các phương thức chờ cứng (hard sleep - `Thread.sleep(5000)`).

### 2. Asynchronous Issues (Vấn đề bất đồng bộ)
Xảy ra khi một tác vụ cần thời gian để hoàn thành trong background, nhưng test lại giả định rằng nó đã xong ngay lập tức.

*   **Biểu hiện:** Test xác nhận dữ liệu A đã được lưu, nhưng lần thử tiếp theo truy vấn và không thấy data A (vì API trả về bất đồng bộ).
*   **Nguyên nhân chính:** Bỏ qua cơ chế chờ đợi có điều kiện (Conditional Waits) hoặc bỏ qua việc kiểm tra trạng thái tải (loading state/spinner).

### 3. Environmental & Concurrency Issues (Vấn đề môi trường và đa luồng)
Xảy ra khi các test chạy song song, và một test ghi đè dữ liệu hoặc ảnh hưởng đến trạng thái của test khác cùng lúc.

*   **Biểu hiện:** Test A chạy thành công, nhưng sau đó Test B lại fail với lỗi `Duplicate Entry` (vì Test A không dọn dẹp dữ liệu).
*   **Nguyên nhân chính:** Thiếu tính độc lập giữa các bài test (lack of idempotency), hoặc cơ sở dữ liệu chung không được quản lý trạng thái tốt.

***

## 🛡️ III. Chiến lược Kiến trúc để loại bỏ Flakiness

Là một QE Lead, tôi luôn khuyến nghị việc xử lý flakiness phải bắt đầu từ góc độ kiến trúc và quy trình, chứ không chỉ là các *fix* nhỏ lẻ trong code test. Dưới đây là chuỗi chiến lược toàn diện.

### Chiến lược 1: Tối ưu hóa Timing (Thay thế Hard Sleeps bằng Explicit Waits)
Đây là khắc phục cơ bản nhưng hiệu quả nhất đối với các vấn đề UI Automation. Tuyệt đối tránh dùng `sleep()`. Thay vào đó, hãy sử dụng **Explicit Wait** – chờ đợi *cho đến khi* một điều kiện cụ thể xảy ra.

**Ví dụ Minh họa (Sử dụng Python/Selenium Pseudo-code):**

**❌ Code SAI (Gây flakiness):**
```python
# KHÔNG NÊN DÙNG!
driver.find_element(By.ID, "submit_button").send_keys("Click")
time.sleep(5) # Đợi 5 giây cố định - Rất kém hiệu quả và gây flaky
# Sau đó mới thực hiện action tiếp theo
```

**✅ Code ĐÚNG (Sử dụng Explicit Wait):**
```python
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# KHUYÊN DÙNG: Chỉ chờ đợi cho đến khi phần tử hoạt động và visible
try:
    wait = WebDriverWait(driver, 10) # Timeout tối đa 10 giây
    submit_button = wait.until(
        EC.element_to_be_clickable((By.ID, "submit_button"))
    )
    submit_button.click() # Chỉ click khi nó thực sự clickable

except Exception as e:
    print(f"Test failed because the element did not appear within 10 seconds.")
```
**Phân tích của Hoàng Hiệp:** Bằng cách này, chúng ta không chỉ chờ đợi *thời gian* mà là *trạng thái*. Test sẽ thất bại nhanh chóng (sau tối đa 10 giây) nếu điều kiện chưa đạt được, thay vì bị trì hoãn vô nghĩa.

### Chiến lược 2: Xử lý Dependencies bằng Service Virtualization
Khi test của bạn phụ thuộc vào các hệ thống bên ngoài (Payment Gateway, Microservice B, LDAP), đó là nguồn flakiness lớn nhất. Chúng ta không thể kiểm soát độ ổn định của chúng.

**Giải pháp:** Sử dụng **Service Virtualization** hoặc Mocking Frameworks (ví dụ: WireMock).

*   Thay vì gọi API thực tế, bạn lập trình một lớp giả lập (Stub/Mock) để trả về phản hồi đã được xác định trước (Deterministic Response).
*   Điều này cô lập test của bạn khỏi sự thay đổi trạng thái, độ trễ mạng, hay việc đang bảo trì hệ thống backend.

### Chiến lược 3: Đảm bảo tính độc lập và Idempotency
Mỗi bài test phải chạy thành công **bất kể** các test khác đã chạy trước đó hay chưa, và cũng bất kể thứ tự nào mà nó được thực hiện.

*   **Trước mỗi Test (Setup):** Luôn khởi tạo dữ liệu sạch sẽ. Sử dụng `Given` trong Gherkin/BDD để đảm bảo rằng tài khoản người dùng, giỏ hàng, hoặc trạng thái hệ thống bắt đầu từ một điểm đã biết.
    *   *Ví dụ:* Thay vì dựa vào một luồng test nào đó đã tạo user ID 'XYZ', hãy viết code *tạo* user ID 'XYZ' ngay trong `setup` của test case đó.
*   **Sau mỗi Test (Teardown):** Bắt buộc phải dọn dẹp dữ liệu bằng cơ chế Transaction Rollback hoặc xóa các bản ghi do chính test tạo ra.

### Chiến lược 4: Tích hợp Retry Logic Thông minh
Trong một số trường hợp flakiness là không thể tránh khỏi (ví dụ, khi gọi API hàng loạt), việc *retry* có thể được sử dụng như một mạng lưới an toàn cuối cùng (Last Resort).

Tuy nhiên, **Retry phải được kiểm soát chặt chẽ:**

1.  **Giới hạn lần chạy:** Không bao giờ cho phép retry vô giới hạn. Tối đa 2-3 lần/test.
2.  **Nguyên nhân Retry:** Chỉ nên áp dụng khi thất bại do lỗi tạm thời (Transient Error), như mạng gián đoạn hoặc timeout nhỏ, chứ không phải khi fail vì logic sai (Assertion Failure).

***

## 🛠️ IV. Checklist của QE Lead trước khi Commit Test Code

Trước khi cho phép bất kỳ test case nào được coi là "Stable" và đưa vào bộ tài sản QA chính thức, hãy yêu cầu đội ngũ kiểm thử thực hiện qua checklist sau:

| Khía cạnh | Câu hỏi cần tự trả lời | Hành động khuyến nghị (Fix) |
| :--- | :--- | :--- |
| **Tính Tĩnh** | Test có ổn định khi chạy với dữ liệu lớn không? | Thực hiện Stress Testing trên test suite. |
| **Timing** | Có bất kỳ `sleep()` hoặc `time.sleep()` nào không? | Thay thế toàn bộ bằng Explicit Waits (WebDriverWait). |
| **Độc lập** | Bài test này có thể chạy thành công khi các test khác bị comment không? | Tách biệt Setup/Teardown, sử dụng data-driven testing. |
| **Phụ thuộc** | Test có gọi đến bất kỳ dịch vụ nào bên ngoài không thể kiểm soát được (third-party)? | Áp dụng Service Virtualization hoặc Mocking layer. |
| **Báo cáo** | Khi test fail, báo cáo có cung cấp đủ Context (screenshot/logs) hay chỉ là một dòng lỗi? | Tích hợp cơ chế chụp ảnh màn hình và log chi tiết khi failure. |

***

## 🚀 Lời kết từ Hoàng Hiệp

Xử lý Flaky Tests không phải là việc viết thêm vài dòng code, nó là việc **nâng cao mức độ trưởng thành kiến trúc (maturity level)** của toàn bộ bộ test automation. Nó đòi hỏi sự thay đổi văn hóa: biến kiểm thử tự động từ một công cụ *ghi lại lỗi* (bug recording) thành một hệ thống *minh chứng cho tính đúng đắn* (Proof of Correctness).

Hãy nhớ rằng, mục tiêu cuối cùng không phải là "không bao giờ fail", mà là "khi fail, chúng ta biết chính xác lý do tại sao nó fail".

Chúc các bạn luôn xây dựng được những bộ test suite vững mạnh và đáng tin cậy!

**Hoàng Hiệp - QE Lead**