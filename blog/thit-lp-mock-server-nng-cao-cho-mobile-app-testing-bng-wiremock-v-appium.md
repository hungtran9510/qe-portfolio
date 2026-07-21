---
title: "Thiết lập Mock Server nâng cao cho Mobile App Testing bằng WireMock và Appium"
date: 2026-05-14
description: "Hướng dẫn chuyên sâu cách sử dụng WireMock để thiết lập các API mock server phức tạp, đảm bảo Mobile App Test chạy ổn định với Appium."
tags: ["Mobile Testing","Appium","WireMock","QA Automation"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Khánh Đỗ"
---

# Thiết lập Mock Server nâng cao cho Mobile App Testing bằng WireMock và Appium

**(Từ góc nhìn của một QE Lead)**

Trong hành trình tự động hóa kiểm thử ứng dụng di động (Mobile App Testing), chúng ta thường đối mặt với một vấn đề cốt lõi: sự phụ thuộc. Ứng dụng di động hiện đại hiếm khi hoạt động độc lập; nó liên tục giao tiếp qua API backend để lấy dữ liệu, xác thực người dùng, và xử lý logic nghiệp vụ.

Khi bạn chạy các bài kiểm thử End-to-End (E2E) bằng Appium, nếu việc kết nối tới Backend thật không ổn định, chậm chạp hoặc bị gián đoạn do lịch bảo trì hệ thống, toàn bộ chu trình kiểm thử của bạn sẽ trở nên **không đáng tin cậy (flaky)** và rất khó để gỡ lỗi.

Bài viết này là một hướng dẫn chuyên sâu dành cho các QA Engineers và SDET muốn nâng cao quy trình testing bằng cách thiết lập một kiến trúc giả lập hoàn hảo: sử dụng **WireMock** làm Mock Server mạnh mẽ, kết nối với Appium Automation Framework.

***

## 💡 Phần I: Hiểu rõ Kiến Trúc (The Architecture)

Trước khi đi sâu vào code, chúng ta cần hiểu vai trò của từng thành phần trong bộ ba này:

1.  **Appium:** Là công cụ điều khiển trình duyệt/thiết bị di động. Nó mô phỏng hành vi người dùng (click, scroll, nhập liệu) và chịu trách nhiệm gọi các API backend.
2.  **Mobile App Under Test:** Ứng dụng chúng ta muốn kiểm tra. Thay vì trỏ đến `api.production.com`, chúng ta sẽ cấu hình nó để trỏ đến địa chỉ Mock Server của mình (ví dụ: `http://localhost:8080/mock`).
3.  **WireMock:** Là trái tim của giải pháp. Nó là một HTTP mocking tool mạnh mẽ, cho phép chúng ta mô phỏng các API backend phức tạp một cách có kiểm soát tuyệt đối.

**Mục tiêu tối thượng:** Tách biệt hoàn toàn khía cạnh giao diện người dùng (Front-end/Mobile Client) khỏi sự biến động của Backend (API Server). Điều này đảm bảo rằng nếu lỗi xảy ra, chúng ta biết chắc chắn 100% là do Mobile App hay là do giả lập API.

## 🧱 Phần II: Tại sao lại chọn WireMock? (The Advanced Edge)

Nhiều người có thể nghĩ rằng chỉ cần dùng `json-server` hoặc file stub đơn giản là đủ. Tuy nhiên, trong vai trò QE Lead, tôi khuyên bạn nên dùng WireMock vì những tính năng sau mà các công cụ cơ bản không hỗ trợ:

1.  **Request Matching (Khớp yêu cầu nâng cao):** WireMock cho phép bạn khớp yêu cầu dựa trên nhiều tiêu chí phức tạp:
    *   HTTP Method (GET/POST).
    *   URI Path (`/api/user/**`).
    *   Headers (Yêu cầu phải có `Authorization` header với giá trị cụ thể).
    *   Body Content (Sử dụng Regular Expressions để kiểm tra nội dung JSON gửi lên).
2.  **State Simulation:** Nó cho phép bạn mô phỏng các trạng thái phức tạp, ví dụ: yêu cầu thứ nhất thành công, yêu cầu thứ hai thất bại do tài khoản đã bị khóa.
3.  **Error Simulation:** Không chỉ là trả về dữ liệu 200 OK. Bạn có thể chủ động kích hoạt lỗi mạng (Network failure) hoặc các mã trạng thái HTTP không mong muốn (401 Unauthorized, 503 Service Unavailable) để kiểm tra tính năng xử lý lỗi của ứng dụng di động.

## 🛠️ Phần III: Hướng Dẫn Triển Khai Thực Tế (Implementation Deep Dive)

Chúng ta sẽ giả định kịch bản sau: Người dùng cần đăng nhập bằng API `/api/v1/login` và nếu thành công, Appium sẽ kiểm tra xem token có hợp lệ hay không.

### Bước 1: Cài đặt WireMock Server

Bạn nên sử dụng các thư viện client của WireMock (ví dụ: `wiremock-standalone` hoặc tích hợp trong Maven/Gradle).

**Mục đích:** Khởi động server mock trên một cổng cụ thể (ví dụ: 8080) và định nghĩa các *Stub* API.

### Bước 2: Thiết lập Stub cho Kịch bản Thành công (Happy Path)

Chúng ta cần thiết lập kịch bản khi yêu cầu đăng nhập là hợp lệ.

*(Giả sử bạn đang dùng Java/JVM để quản lý test setup)*

```java
// Định nghĩa Stub trước khi Appium chạy
stubFor(post("/api/v1/login")
    .withHeader("Content-Type", containing("application/json"))
    .body(containing("\"username\": \"testuser\"")) // Match body content
    .willReturn(aResponse()
        .withStatus(200)
        .withHeader("Content-Type", "application/json")
        // Trả về payload JSON giả lập của API thành công
        .withBody("{\"status\": \"success\", \"token\": \"jwt_mock_token_123\"}"))); 

// Explanation từ Khánh Đỗ:
// - .post("/api/v1/login"): Xác định phương thức và endpoint cần mock.
// - .withHeader(...) & .body(containing(...)): Đây là phần quan trọng nhất. Nó đảm bảo rằng stub chỉ được kích hoạt khi yêu cầu đến Mock Server khớp chính xác với các điều kiện này (ví dụ: Content-Type phải là JSON, và request body PHẢI chứa key "username").
// - .withBody("..."): Payload trả về mô phỏng phản hồi thực tế của API. Bằng cách kiểm soát response status và payload, chúng ta kiểm tra mọi hành vi phụ thuộc vào API này.
```

### Bước 3: Thiết lập Stub cho Kịch bản Thất bại (Negative Path)

Giả sử người dùng nhập sai mật khẩu. Thay vì để Appium bị treo chờ timeout của Backend thật, WireMock sẽ ngay lập tức trả về lỗi 401.

```java
// Định nghĩa stub cho trường hợp đăng nhập thất bại
stubFor(post("/api/v1/login")
    .withHeader("Content-Type", containing("application/json"))
    .body(containing("\"username\": \"failuser\"")) // Sử dụng một username khác để tránh xung đột với test case 1
    .willReturn(aResponse()
        .withStatus(401) // Trả về mã lỗi Unauthorized
        .withHeader("Content-Type", "application/json")
        .withBody("{\"error\": \"Invalid credentials\", \"code\": 401}")));

// Explanation từ Khánh Đỗ:
// Bằng cách thiết lập trạng thái 401, chúng ta buộc Mobile App phải chạy luồng xử lý lỗi (Error Handling Flow). Chúng ta có thể kiểm tra bằng Appium rằng khi nhận được status 401, ứng dụng đã hiển thị thông báo "Sai mật khẩu" và không bị crash.
```

### Bước 4: Tích hợp với Appium (The Execution)

Trong test suite của bạn (ví dụ: TestNG/JUnit), bạn phải đảm bảo rằng Appium Driver được cấu hình để trỏ đến địa chỉ Mock Server thay vì API thật.

**Cấu hình cơ bản:**

| Biến môi trường | Giá trị thực tế | Giá trị Mocking |
| :--- | :--- | :--- |
| `BASE_API_URL` | `https://backend-production.com/api` | **`http://localhost:8080/api`** |

Trong code Appium, mọi hành vi người dùng sẽ xảy ra bình thường (input data, click button), nhưng khi ứng dụng thực hiện lệnh gọi API nền, nó sẽ gửi yêu cầu đến WireMock Server đang chạy ở background.

**Quy trình trong Test Case:**

1.  **Setup Phase:** Khởi động Appium và WireMock Server.
2.  **Stubbing Phase:** Triển khai tất cả các `stubFor()` cần thiết cho kịch bản test hiện tại (ví dụ: Stub Success, Stub Fail).
3.  **Execution Phase:** Chạy các hành động trên Appium (`driver.findElement().click()`, v.v.).
4.  **Assertion Phase:** Kiểm tra giao diện người dùng và trạng thái hệ thống theo luồng đã được Mock Server kiểm soát.

## 🚀 Phần IV: Các Kỹ thuật Nâng cao cho QE Lead

Nếu bạn muốn nâng cấp khả năng của mình lên mức chuyên gia, hãy nghiên cứu các kỹ thuật sau khi sử dụng WireMock:

### 1. Mô phỏng Độ trễ (Latency Simulation)
Bạn có thể mô phỏng tình trạng mạng chậm bằng cách thêm tiêu đề `Delay` vào phản hồi của Mock Server.

```java
// Giả lập API bị treo trong 3 giây do kết nối mạng kém
.willReturn(aResponse()
    .withStatus(200)
    .withBody("...")
    .withFixedDelay(3000)); // Thêm độ trễ 3000ms (3 giây)

// Lợi ích: Bạn có thể kiểm tra xem Mobile App của mình xử lý timeout tốt như thế nào, thay vì phải chờ đợi thời gian thực không xác định.
```

### 2. Kiểm thử Dữ liệu Biên (Boundary Testing with State)
Thay vì chỉ kiểm tra một trạng thái thành công duy nhất, hãy sử dụng WireMock để mô phỏng chuỗi sự kiện:

*   **Test Case:** Người dùng xem sản phẩm $\rightarrow$ Thêm vào giỏ hàng $\rightarrow$ Đến thanh toán.
*   **WireMock Setup:**
    1.  Thiết lập `/api/products/{id}` trả về dữ liệu OK (Lần 1).
    2.  Thiết lập `/api/cart/add` trả về success kèm theo `user_state_id=XYZ`.
    3.  Sau đó, thay đổi stub cho `/api/inventory/check` để nó chỉ thành công nếu nó nhận được `user_state_id=XYZ` trong header (hoặc body).

Điều này giúp bạn mô phỏng các luồng nghiệp vụ phức tạp và đảm bảo tính toàn vẹn của dữ liệu giữa các bước test.

## 📜 Kết Luận: Tối đa hóa Độ tin cậy Kiểm thử

Việc thiết lập Mock Server nâng cao bằng WireMock không chỉ là một thủ thuật kỹ thuật; đó là việc áp dụng tư duy chất lượng (Quality Mindset) vào tự động hóa kiểm thử.

Khi bạn làm chủ được khả năng giả lập môi trường API backend, bạn đã loại bỏ đi biến số lớn nhất trong Mobile E2E Testing: **sự không ổn định của hệ thống phụ thuộc.**

Kết quả là một bộ test Suite cực kỳ nhanh, mạnh mẽ, và quan trọng nhất – **đáng tin cậy**. Hãy áp dụng WireMock ngay hôm nay để nâng tầm chất lượng đội ngũ QA của bạn!

***
*Khánh Đỗ - QE Lead.*