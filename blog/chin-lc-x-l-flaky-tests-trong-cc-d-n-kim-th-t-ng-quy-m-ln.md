---
title: "Chiến lược xử lý Flaky Tests trong các dự án kiểm thử tự động quy mô lớn"
date: 2026-06-10
description: "Khám phá cách nhận diện, phân tích và xây dựng chiến lược toàn diện để loại bỏ Flaky Tests, đảm bảo độ tin cậy của hệ thống CI/CD."
tags: ["Automation","QA Strategy","Testing"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hoàng Hiệp"
---

# Chiến lược xử lý Flaky Tests trong các dự án kiểm thử tự động quy mô lớn

**(Bởi Hoàng Hiệp - QE Lead)**

***

Nếu bạn đang quản lý một đội ngũ phát triển phần mềm và vận hành một bộ test tự động (automated test suite) với hàng ngàn kịch bản (scenarios), chắc chắn bạn đã từng đối mặt với nó: những bài kiểm thử thất bại mà không rõ nguyên nhân, chỉ để lại sự hoang mang tột độ trong quá trình tích hợp liên tục (CI/CD).

Đó chính là **Flaky Tests**—các bài kiểm thử có tính "không ổn định" (flakiness). Chúng thỉnh thoảng qua, thỉnh thoảng fail, mà không hề có sự thay đổi nào về code cơ sở.

Với tư cách là một QE Lead đã từng xử lý hàng trăm bộ test phức tạp, tôi hiểu rõ Flaky Tests không chỉ là một vấn đề kỹ thuật đơn thuần; chúng là **vấn đề về niềm tin (trust issue)**. Khi các QA và Dev bắt đầu nghi ngờ kết quả của Pipeline CI/CD, toàn bộ quy trình phát hành sẽ bị đình trệ.

Bài viết này sẽ không đưa ra giải pháp "vá" tạm thời. Chúng ta sẽ xây dựng một chiến lược kỹ thuật và quy trình làm việc toàn diện để loại bỏ tận gốc rễ Flakiness trong các dự án quy mô lớn.

***

## 🧠 Phần I: Hiểu Bản Chất Của Vấn Đề (The Root Cause)

Trước khi xử lý, chúng ta cần phải chẩn đoán chính xác. Flaky Tests hiếm khi do một nguyên nhân duy nhất gây ra; chúng là sự kết hợp của các lỗi đồng bộ hóa (synchronization issues), điều kiện đua tranh (race conditions), và phụ thuộc môi trường (environmental dependencies).

Dưới đây là ba nguồn gốc phổ biến nhất:

### 1. Vấn đề Đồng Bộ Hóa (Synchronization Flakiness)
Đây là nguyên nhân phổ biến nhất trong các bài kiểm thử UI/Web tự động (Selenium, Cypress...). Code của bạn chạy nhanh hơn tốc độ mà giao diện người dùng (UI) kịp tải hoặc phản hồi. Test script cố gắng tương tác với một phần tử DOM (Document Object Model) khi nó chưa tồn tại hoặc chưa nhận được trạng thái hiển thị cuối cùng.

### 2. Điều Kiện Đua Tranh (Concurrency Issues)
Xảy ra khi nhiều luồng (thread) hoặc nhiều yêu cầu API truy cập và thay đổi dữ liệu chung cùng một lúc. Nếu bài test của bạn không xử lý đúng cơ chế khóa (locking mechanism), kết quả sẽ phụ thuộc vào thứ tự thực thi ngẫu nhiên, dẫn đến thất bại khó lặp lại.

### 3. Phụ Thuộc Môi Trường & Dữ Liệu (Environmental/Data Dependencies)
Bài test thành công trên máy Developer A nhưng fail trên môi trường Staging do:
*   API bên ngoài bị chậm trễ hoặc trả về dữ liệu khác nhau (Third-party services latency).
*   Test Data không được thiết lập đúng cách trước khi chạy (Test Data Management - TDM kém).

***

## 🛠️ Phần II: Chiến Lược Kỹ Thuật Giảm Thiểu Flakiness (Mitigation Strategies)

Đây là phần cốt lõi. Chúng ta cần thay đổi tư duy từ việc "làm thế nào để test pass" sang "làm thế nào để test đáng tin cậy".

### 1. Thay Thế `time.sleep()` bằng Explicit Waits (Giải quyết Synchronization)
Tuyệt đối tránh sử dụng `time.sleep(5)` cứng nhắc. Phương pháp này là *Sleep theo thời gian* và nó làm chậm toàn bộ pipeline CI/CD mà không đảm bảo rằng ứng dụng đã sẵn sàng.

Thay vào đó, hãy sử dụng **Explicit Wait** (Chờ tường minh). Explicit Wait chỉ chờ cho đến khi một điều kiện cụ thể được thỏa mãn (ví dụ: phần tử hiển thị, hoặc phần tử có giá trị text nhất định).

**💡 Ví dụ Code Tăng Cường Độ Tin Cậy (Pseudocode/Python Style):**

❌ **BAD PRACTICE (Sleeps)**
```python
# test_login.py
driver.get("http://myapp.com/login")
time.sleep(3) # Chờ 3 giây bất kể có cần hay không
driver.find_element_by_id("username").send_keys("user")
```

✅ **BEST PRACTICE (Explicit Wait)**
Sử dụng thư viện hỗ trợ wait-for (ví dụ: Selenium's WebDriverWait).
```python
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.by import By

# Khai báo chờ tối đa 10 giây
wait = WebDriverWait(driver, 10) 

try:
    # CHỈ CHỜ CHO ĐẾN KHI PHẦN TỬ TRƯỜNG NHẬP USERNAME HIỆN RA VÀ KHẢ THI
    username_field = wait.until(
        EC.presence_of_element_located((By.ID, "username"))
    )
    username_field.send_keys("user")

except TimeoutException:
    print("Lỗi đồng bộ hóa: Không tìm thấy trường username trong 10 giây.")
    # Xử lý failure có kiểm soát
```
**Giải thích của Hoàng Hiệp:** Bằng cách sử dụng `WebDriverWait` và các `Expected Conditions` (EC), chúng ta không chỉ *chờ* mà chúng ta đang *kiểm tra điều kiện*. Hệ thống sẽ liên tục polling cho đến khi điều kiện được thỏa mãn, sau đó mới tiến hành tương tác. Điều này giảm thiểu thời gian chờ tối đa nhưng đảm bảo tính chính xác cao nhất.

### 2. Cô Lập Test Cases và Giả Lập Dịch Vụ (Isolation & Mocking)
Trong các bài test lớn, sự phụ thuộc vào API bên ngoài hoặc database thực tế là kẻ thù số một của độ ổn định. Nếu bạn không thể kiểm soát môi trường, bạn phải mô phỏng nó.

*   **Test Data Management (TDM):** Mọi bài test cần tự thiết lập dữ liệu sạch sẽ (setup) và dọn dẹp sau khi chạy xong (teardown). Không bao giờ để các testcase phụ thuộc vào trạng thái dữ liệu còn sót lại từ test case trước đó.
    *   *Giải pháp:* Sử dụng fixtures (Pytest) hoặc Seed Data Scripting chuyên biệt.
*   **Mocking/Stubbing:** Khi bài test chỉ cần kiểm tra logic nghiệp vụ của module A, bạn không nên gọi API thực tế của dịch vụ B. Hãy sử dụng các thư viện mocking (như `Mockito` trong Java hoặc `unittest.mock` trong Python) để thay thế các cuộc gọi mạng bằng các hành vi giả lập được xác định trước.

### 3. Áp Dụng Chiến Lược Retry Logic Thông Minh
Việc thiết lập cơ chế retry là cần thiết, nhưng phải *có kiểm soát*. Nếu chỉ đơn thuần chạy lại test 3 lần khi thất bại, bạn chỉ đang che giấu vấn đề Flakiness mà không giải quyết nó.

*   **Điều kiện kích hoạt Retry:** Chỉ nên áp dụng retry cho các bài test có khả năng bị ảnh hưởng bởi sự dao động mạng hoặc tài nguyên (ví dụ: việc gọi API bên ngoài).
*   **Giới hạn Lần Thử và Thời gian chờ Tăng dần (Exponential Backoff):** Nếu test thất bại, hãy đợi một khoảng thời gian ngắn hơn trước khi retry lần 2, và lại tăng lên cho lần 3.

***

## 🚀 Phần III: Chiến Lược Về Quy Trình (Process Maturity)

Kỹ thuật tốt chỉ là 50%. Nửa còn lại nằm ở quy trình làm việc của nhóm QE.

### 1. Triển khai Hệ thống Phân Loại Flakiness
Khi một test fail, nó cần được phân loại ngay lập tức:

*   **Failure Type A (True Bug):** Failure lặp lại và có thể tái hiện bởi tất cả mọi người với các điều kiện cố định. $\rightarrow$ **Ưu tiên phát hành 1.**
*   **Failure Type B (Flaky Test/Known Flakiness):** Failure chỉ xảy ra ngẫu nhiên hoặc trong điều kiện nhất định. $\rightarrow$ **Đưa vào Technical Debt Backlog và giao cho Dev/QE chuyên trách xử lý.**
*   **Failure Type C (Environment Issue):** Failure do thiếu tài nguyên, bộ nhớ, hoặc cấu hình mạng. $\rightarrow$ **Gửi cho Infrastructure Team khắc phục.**

### 2. Xây Dựng Ma trận Rủi Ro Test Case
Đối với các test case quan trọng nhất (Critical Path), hãy yêu cầu bằng chứng về tính ổn định của chúng:

1.  **Báo cáo Độ Lặp lại (Repeatability Report):** Chạy cùng một test case 50 lần và xác định tỷ lệ thất bại (Failure Rate %). Nếu Rate > 5%, nó phải được xem xét lại ngay lập tức.
2.  **Đơn vị Kiểm Thử Cô Lập:** Đảm bảo rằng các bài kiểm thử nghiệp vụ cốt lõi (Unit/Integration Tests) không phụ thuộc vào tầng UI. Khi Flaky Test xảy ra, chúng ta cần biết chắc chắn rằng Business Logic vẫn hoạt động ổn định dưới mức độ abstraction cao hơn.

## 📋 Tóm Kết và Hành Động Tiếp Theo

Flaky Tests là một vòng luẩn quẩn nguy hiểm: **Không đáng tin cậy $\rightarrow$ Giảm sự chú ý $\rightarrow$ Bỏ qua lỗi thực tế.**

Là QE Lead, vai trò của chúng ta không chỉ là viết code test mà còn là xây dựng cơ chế *tin tưởng* vào kết quả kiểm thử.

| Vấn đề (Problem) | Nguyên nhân chính (Root Cause) | Giải pháp ưu tiên (Priority Solution) | Công cụ/Kỹ thuật (Technique) |
| :--- | :--- | :--- | :--- |
| Thất bại ngẫu nhiên khi tương tác UI | Đồng bộ hóa kém (Synchronization) | Sử dụng Explicit Waits, chờ điều kiện. | `WebDriverWait`, Expected Conditions (EC). |
| Test phụ thuộc dữ liệu cũ/người khác | Quản lý Test Data kém (TDM) | Thiết lập data sạch ở đầu và dọn dẹp cuối mỗi testcase. | Pytest Fixtures, Database Transaction Rollback. |
| API bên ngoài chậm hoặc không ổn định | Phụ thuộc mạng (Network Dependency) | Mocking/Stubbing các dịch vụ ngoại vi. | Mockito, Python `unittest.mock`. |
| Test chạy quá lâu do chờ đợi vô ích | Logic Sleep cứng nhắc (`time.sleep()`) | Chỉ chờ khi có điều kiện cần thiết. | Explicit Waits kết hợp với Timeouts hợp lý. |

Việc xử lý Flakiness là một cuộc chiến không bao giờ dứt điểm, nhưng bằng cách tiếp cận nó như một vấn đề **kỹ thuật hệ thống** (System Engineering Problem) thay vì chỉ là lỗi code đơn thuần, bạn sẽ đưa độ tin cậy của quy trình tự động hóa lên một tầm cao mới.

***
*Chúc các bạn xây dựng được những bộ test không chỉ chạy nhanh mà còn cực kỳ đáng tin cậy.*