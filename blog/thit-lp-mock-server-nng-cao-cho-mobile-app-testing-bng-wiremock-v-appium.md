---
title: "Thiết lập Mock Server nâng cao cho Mobile App Testing bằng WireMock và Appium"
date: 2026-05-13
description: "Khám phá kỹ thuật thiết lập Mock Server chuyên sâu với WireMock để cô lập ứng dụng di động, đảm bảo bài kiểm thử Appium ổn định và thực tế."
tags: ["Mobile Testing","Appium","WireMock"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Khánh Đỗ"
---

# Thiết lập Mock Server nâng cao cho Mobile App Testing bằng WireMock và Appium

Xin chào các đồng nghiệp Tester và Chất lượng! Tôi là Khánh Đỗ, một Quality Engineer chuyên sâu trong lĩnh vực kiểm thử hiệu năng và tích hợp.

Trong quá trình làm việc với Mobile Application Testing (MAT), chúng ta thường xuyên đối mặt với một thách thức lớn: **sự phụ thuộc vào các dịch vụ Backend không ổn định.** Một API đơn giản có thể bị lỗi tạm thời, chậm trễ do tải cao, hoặc thậm chí thay đổi cấu trúc dữ liệu mà nhóm phát triển chưa kịp thông báo.

Khi những yếu tố ngoài tầm kiểm soát này xảy ra, bộ test Appium của bạn – dù được viết hoàn hảo đến đâu – cũng sẽ thất bại và vô hiệu hóa toàn bộ quá trình CI/CD. Thất bại đó có thể do lỗi ứng dụng (App Bug), hoặc chỉ đơn thuần là lỗi mạng và Backend dịch vụ (Infrastructure Failure).

Bài viết này không chỉ là một hướng dẫn cơ bản; nó là giải pháp kỹ thuật chuyên sâu để chúng ta đạt được **Tính Cô Lập (Isolation)** hoàn hảo, giúp bộ test của bạn luôn tin cậy, tốc độ cao và chỉ thực sự báo cáo những lỗi thuộc về ứng dụng di động.

Và công cụ cho hành trình này chính là sự kết hợp quyền năng giữa **WireMock** và **Appium**.

***

## 💡 I. WireMock: Tại sao Mocking lại quan trọng?

Trước khi đi sâu vào kỹ thuật, chúng ta cần hiểu bản chất của vấn đề. Appium giúp chúng ta mô phỏng hành vi người dùng (User Flow) trên thiết bị ảo hoặc thật. Nhưng khi ứng dụng thực hiện một thao tác như "Đăng nhập" hay "Lấy danh sách sản phẩm," nó sẽ gửi HTTP request đến một endpoint nào đó.

**WireMock là gì?**
WireMock là một thư viện mocking server mạnh mẽ, chuyên dùng để mô phỏng (mock) các máy chủ API bên ngoài. Thay vì ứng dụng của bạn gọi tới `https://api-backend-thuc-te.com/user`, chúng ta sẽ cấu hình nó gọi đến địa chỉ local của WireMock: `http://localhost:8080/mock/user`.

WireMock hoạt động bằng cách ghi lại (stub) các yêu cầu (Request Matching) và trả về các phản hồi giả định (Response Stubbing) mà bạn đã định nghĩa trước.

**Lợi ích cốt lõi:**
1. **Tính Ổn Định (Stability):** Test của bạn không phụ thuộc vào trạng thái thực tế của backend. Luôn nhận được JSON mẫu hoàn hảo, bất kể API thật đang quá tải hay bị lỗi 500.
2. **Tốc Độ (Speed):** Các phản hồi từ mock server luôn tức thì, loại bỏ độ trễ mạng và xử lý Backend.
3. **Kiểm Thử Tình Huống Edge Case:** Chúng ta có thể mô phỏng các tình huống khó xảy ra trong môi trường thật: lỗi 401 (Unauthorized), timeout 504 Gateway Timeout, hoặc JSON payload bị định dạng sai.

***

## 🚀 II. Quy trình Thiết lập Nâng cao (Advanced Workflow)

Một quy trình kiểm thử Appium với Mock Server chuyên nghiệp cần tuân theo các bước sau:

**[Thiết lập] $\rightarrow$ [Tương tác] $\rightarrow$ [Kiểm tra Phản hồi]**

1. **Bước 1: Cấu hình WireMock:** Định nghĩa các stub API mà ứng dụng sẽ gọi trong kịch bản test này (ví dụ: `/login` phải nhận body `{username: "test", password: "password"}` và trả về status `200 OK`).
2. **Bước 2: Chạy Mock Server:** Khởi động WireMock trên một cổng nhất định.
3. **Bước 3: Điều chỉnh Ứng dụng (Quan trọng):** Chúng ta cần đảm bảo rằng trong môi trường Test/Staging, ứng dụng di động phải được cấu hình để trỏ các API endpoint đến địa chỉ của WireMock (`http://localhost:8080`) thay vì backend thật.
4. **Bước 4: Thực thi Appium:** Chạy script Appium. Khi người dùng hành vi (Login), Appium sẽ thực hiện hành động $\rightarrow$ Ứng dụng gửi request tới Mock Server $\rightarrow$ WireMock nhận diện và trả về response đã định sẵn $\rightarrow$ Appium kiểm tra giao diện dựa trên dữ liệu đó.

***

## 💻 III. Minh Họa Mã Giả Lập (Code Deep Dive)

Để minh họa sự phức tạp của việc xử lý phản hồi, chúng ta sẽ thực hiện kịch bản: **Kiểm thử quy trình Đăng nhập thành công và kiểm tra hiển thị tên người dùng.**

### A. Cấu hình WireMock (Java/YAML Mapping)

Đây là nơi bạn định nghĩa hành vi mong muốn. Chúng ta sẽ stub hai endpoint: một cho đăng nhập và một cho lấy profile.

```java
// --- Setup Login Stub (WireMock Runner) ---
stubFor(post("/api/v1/auth/login") // Endpoint bắt request POST
    .withRequestBody(containing("\"username\": \"testuser\"")) // Match theo nội dung body
    .willReturn(aResponse()
        .withStatus(200) // Đảm bảo thành công
        .withHeader("Content-Type", "application/json")
        .withBody("{\"success\": true, \"token\": \"mock_jwt_token\", \"user_id\": 123}") // Dữ liệu giả định trả về
    ));

// --- Setup Profile Stub (Handling State) ---
stubFor(get("/api/v1/profile")
    .willReturn(aResponse()
        .withStatus(200)
        .withBody("{\"user_id\": 123, \"display_name\": \"Mock User Khánh\"}"))); // Trả về tên người dùng giả định
```

**Giải thích kỹ thuật:**
*   `post("/api/v1/auth/login")`: Chỉ nhận yêu cầu POST đến đường dẫn này.
*   `.withRequestBody(...)`: Đây là tính năng Match nâng cao! WireMock sẽ **chỉ kích hoạt stub này** nếu request gửi tới chứa chuỗi JSON mẫu mà bạn đã định nghĩa. Điều này giúp chúng ta xác minh được luồng test đang gọi đúng API với tham số chính xác.
*   `aResponse().withStatus(200).withBody(...)`: Định nghĩa hành vi trả về không chỉ là status code, mà cả cấu trúc JSON hoàn chỉnh (Payload) mà ứng dụng sẽ phải xử lý.

### B. Kịch bản Appium Test (Python/Java Pseudo-Code)

Sau khi Mock Server đã sẵn sàng, kịch bản test của bạn sẽ đơn giản và tập trung vào việc kiểm tra UI:

```python
from appium import webdriver
# Giả định rằng WireMockServer đã chạy trên localhost:8080
MOCK_BASE_URL = "http://localhost:8080" 

def run_login_test(driver):
    # Thiết lập Appium để sử dụng các API được trỏ qua mock server (cấu hình app/device)
    # ...

    # 1. Hành động người dùng (Appium Action)
    driver.find_element_by_id("username_input").send_keys("testuser") # -> Request sent to WireMock
    driver.find_element_by_id("password_input").send_keys("mypass")   # -> Request sent to WireMock
    driver.find_element_by_id("login_button").click()

    # 2. Xử lý Loading/Navigation (Kiểm tra hành vi UI)
    WebDriverWait(driver, 10).until(EC.url_contains("/dashboard")) # Appium chờ ứng dụng điều hướng thành công

    # 3. Kiểm tra dữ liệu đã được Mocking trả về (Verification)
    display_name = driver.find_element_by_id("user_greeting").text 
    expected_mock_name = "Chào mừng, Mock User Khánh!" # Giá trị lấy từ WireMock stub ở trên

    assert expected_mock_name in display_name, f"Lỗi: Không thấy tên người dùng mong đợi. Lấy được: {display_name}"

# Execution flow
# setup_wiremock() 
# driver = start_appium_session()
# run_login_test(driver)
```

**Phân tích luồng dữ liệu:**
1. Người dùng bấm Login $\rightarrow$ App gửi request đến WireMock.
2. WireMock nhận diện và trả về `{ "token": ..., "user_id": 123}`.
3. App xử lý token, điều hướng đến màn hình Dashboard.
4. App gọi API `/profile` để lấy thông tin hiển thị $\rightarrow$ App nhận được `{"display_name": "Mock User Khánh"}` từ WireMock.
5. App cập nhật UI bằng tên này $\rightarrow$ Appium kiểm tra element và xác nhận thành công.

***

## ✨ IV. Kỹ thuật Nâng cao của QE Lead (Advanced Techniques)

Là một QE Lead, tôi muốn nhấn mạnh những khía cạnh mà các bài viết cơ bản thường bỏ qua:

### 1. Mô phỏng Tình trạng Thất bại có Cấu trúc (Structured Failure Simulation)
Không chỉ kiểm tra thành công, ta phải kiểm tra thất bại! WireMock cho phép bạn mô phỏng chính xác loại lỗi mà hệ thống thực tế có thể gây ra:

*   **Authentication Lỗi:** Stub trả về `401 Unauthorized` với payload gợi ý rằng "Tài khoản không tồn tại."
    *(Test Case: Kiểm tra xem ứng dụng có hiển thị thông báo Toast/Alert hợp lệ thay vì crash hay không.)*
*   **Timeout Lỗi (504 Gateway Timeout):** Stub được cấu hình để tạm ngừng trả lời trong 10 giây.
    *(Test Case: Xác minh logic Retry Mechanism của ứng dụng và việc xử lý trạng thái "Đang kết nối...")*

### 2. Xử lý Trạng Thái Tăng Dần (State Management)
Trong các luồng phức tạp, phản hồi ở bước 3 phải dựa trên dữ liệu được tạo ra từ bước 1 và 2. WireMock cho phép bạn thực hiện **Stateful Mapping** bằng cách sử dụng `Fixed Request Matching` hoặc thậm chí là việc lưu trữ biến tạm thời trong server để đảm bảo rằng:

*   Lần gọi Profile thứ nhất (khi vừa đăng nhập) sẽ trả về một user ID, và lần gọi tiếp theo phải dùng chính user ID đó.

### 3. Tích hợp vào CI/CD Pipeline
Thiết lập WireMock không chỉ là code; nó là một phần của môi trường test. Bạn nên tích hợp việc khởi tạo và đóng Mock Server (ví dụ: sử dụng `@BeforeAll` và `@AfterAll` trong JUnit) ngay trước khi chạy Appium Swit Suite. Điều này đảm bảo rằng mọi bộ test đều bắt đầu từ trạng thái sạch sẽ, cô lập hoàn toàn với các lần chạy trước đó.

***

## 📝 Tổng kết

Việc sử dụng Mock Server như WireMock để hỗ trợ cho Appium không còn là một tính năng bổ sung (nice-to-have) mà đã trở thành một yêu cầu bắt buộc (must-have) trong mọi quy trình kiểm thử chất lượng nghiêm túc. Nó nâng cao khả năng kiểm soát, độ tin cậy và quan trọng nhất, nó giúp đội ngũ QA của bạn tự tin chỉ trỏ đúng nơi xảy ra lỗi: **Là lỗi ở ứng dụng di động hay là do hệ thống backend.**

Nếu bạn đang loay hoay với các test case Appium không ổn định vì sự phụ thuộc vào API bên ngoài, hãy dành thời gian tìm hiểu sâu về WireMock. Tôi cam kết nó sẽ thay đổi hoàn toàn cách bạn nhìn nhận về Mobile Application Testing!

Chúc mọi người luôn thành công và viết ra những bộ test vững chắc!

**Khánh Đỗ.**
*Quality Lead | Software Quality Assurance Expert*