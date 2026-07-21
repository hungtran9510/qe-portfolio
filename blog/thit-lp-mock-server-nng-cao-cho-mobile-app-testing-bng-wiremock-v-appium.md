---
title: "Thiết lập Mock Server nâng cao cho Mobile App Testing bằng WireMock và Appium"
date: 2026-05-14
description: "Khám phá chiến lược testing hiện đại: Sử dụng WireMock để kiểm soát API response, tối ưu hóa độ tin cậy của Mobile Test bằng Appium."
tags: ["Mobile Testing","Appium","WireMock","API Mocking"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Khánh Đỗ"
---

# Thiết lập Mock Server nâng cao cho Mobile App Testing bằng WireMock và Appium

Chào các đồng nghiệp trong lĩnh vực Chất lượng phần mềm! Tôi là Khánh Đỗ, một Quality Engineer với niềm đam mê tối ưu hóa quy trình kiểm thử.

Trong kỷ nguyên phát triển DevOps và Continuous Integration/Continuous Deployment (CI/CD), việc đảm bảo chất lượng của ứng dụng di động không chỉ đơn thuần là chạy test case. Thách thức lớn nhất chúng ta thường gặp là sự phụ thuộc vào các dịch vụ backend phức tạp, đôi khi không ổn định hoặc chưa hoàn thiện (under-development).

Nếu cứ để Appium tương tác trực tiếp với môi trường API thực tế (Staging/Dev), mọi bài test E2E của chúng ta sẽ trở thành "nạn nhân" của bất kỳ sự cố nào ở phía backend – dù là một lỗi schema, một độ trễ không mong muốn hay thậm chí là downtime.

Vậy làm thế nào để xây dựng một môi trường Mobile Test hoàn toàn độc lập, đáng tin cậy và có khả năng tái tạo (repeatable) cao? Câu trả lời nằm ở việc sử dụng **Mock Server**. Bài viết hôm nay của tôi sẽ đi sâu vào chiến lược thiết lập Mock Server nâng cao bằng sự kết hợp mạnh mẽ giữa **WireMock** và **Appium**.

***

## I. Tổng quan về Triết lý Mô phỏng (The Philosophy of Mocking)

Trước khi đi vào code, chúng ta cần hiểu tại sao cách tiếp cận này lại vượt trội:

*   **Vấn đề:** Appium mô phỏng hành vi của người dùng trên thiết bị ảo/thực và tương tác với giao diện (UI). Khi Appium gọi API để lấy dữ liệu hiển thị lên UI đó, nó đang phụ thuộc vào mạng lưới.
*   **Giải pháp Mocking:** Thay vì để Appium thực hiện các lệnh `driver.findElement()` sau đó gọi `restTemplate.get("real-api")`, chúng ta sẽ cấu hình toàn bộ luồng giao tiếp mạng (network traffic) chỉ trỏ về một server giả lập (Mock Server).
*   **WireMock vai trò gì?** WireMock là một HTTP mocking tool mạnh mẽ, giúp chúng ta "ghi đè" (stubbing) hành vi của các endpoint API thực tế. Nó cho phép định nghĩa *chính xác* những yêu cầu nào sẽ được chấp nhận và phản hồi lại bằng *những dữ liệu nào*.

Sự kết hợp này đảm bảo rằng: **Appium chỉ cần quan tâm đến việc tương tác với giao diện người dùng, còn WireMock lo toàn bộ trách nhiệm của việc giả lập logic backend.**

## II. Kiến trúc hoạt động (How it Works)

Về cơ bản, luồng kiểm thử sẽ diễn ra như sau:

1.  **Cấu hình:** Thiết lập một server WireMock chạy trên một port cục bộ (ví dụ: `http://localhost:8080`).
2.  **Stubbing:** Khánh Đỗ định nghĩa các stub rules trong WireMock: "Nếu có yêu cầu POST đến `/api/v1/user/login` với body là `{username: 'test', password: '123'}` thì hãy trả về HTTP 200 và JSON response chứa `{"status": "success", "token": "mock_jwt_token"}`."
3.  **Client App:** Điều chỉnh cấu hình của Mobile App (trong môi trường test) để nó sử dụng base URL của WireMock thay vì API thật.
4.  **Execution:** Appium chạy script. Khi Appium thực hiện hành động và trigger cuộc gọi mạng, yêu cầu sẽ bị **WireMock Intercept**.
5.  **Validation:** WireMock kiểm tra request (headers, body, method) và trả về response đã được định nghĩa sẵn.

## III. Hướng dẫn Thực hành Chuyên sâu với Code Example

Chúng ta sẽ xem xét kịch bản: Kiểm thử quy trình đăng nhập người dùng và xử lý lỗi API.

### Bước 1: Thiết lập WireMock (The Stubbing Phase)

Chúng ta không chỉ cần stub response thành công, chúng ta cần kiểm soát *mọi* trạng thái. Chúng ta thường sử dụng file JSON hoặc Kotlin/Java để định nghĩa các stubs.

**Ví dụ 1: Stub Thành Công (Success State)**
Đây là cấu hình cho một request POST hợp lệ và phản hồi token thành công.

```json
// WireMock Stubs for successful login
{
  "request": {
    "method": "POST",
    "url": "/api/v1/login-mock" 
  },
  "response": {
    "status": 200,
    "body": "{\"success\": true, \"user_id\": 456, \"token\": \"MOCK_JWT_TOKEN\"}",
    "headers": {
      "Content-Type": "application/json"
    }
  },
  // Quan trọng: WireMock có thể thêm các bộ lọc để chỉ khớp với payload cụ thể
  "matchingRules": [
    {"field": "body", "equals": "{\"username\":\"testuser\",\"password\":\"correctpass\"}"} 
  ]
}
```

**Ví dụ 2: Mô phỏng lỗi API (Failure State - Advanced)**
Đây là phần nâng cao nhất. Thay vì để ứng dụng bị crash khi backend trả về 500, chúng ta buộc nó phải nhận 500 từ Mock Server. Điều này giúp kiểm tra luồng xử lý lỗi UI/UX của mình mà không cần server thật hoạt động.

```json
// WireMock Stubs for authentication failure (401 Unauthorized)
{
  "request": {
    "method": "POST",
    "url": "/api/v1/login-mock" 
  },
  "response": {
    "status": 401, // Trả về mã trạng thái lỗi
    "body": "{\"success\": false, \"error_code\": \"INVALID_CREDENTIALS\", \"message\": \"Tên đăng nhập hoặc mật khẩu không chính xác.\"}",
    "headers": {"Content-Type": "application/json"}
  }
}
```

### Bước 2: Tích hợp với Appium (The Execution Phase)

Chúng ta phải đảm bảo rằng Mobile App của chúng ta được cấu hình để giao tiếp với WireMock Server. Điều này thường yêu cầu thay đổi các biến môi trường hoặc file `config.json` trong quá trình build test.

**Trong Code Test Script (Java/Python Pseudocode):**

```java
// Thiết lập Mock Server trước khi chạy test case
setupWireMock(true); // Khởi động WireMock trên port 8080 và tải các stubs
driver.manage().deleteAllRecords();

try {
    // 1. Appium tự động điều hướng đến màn hình Login (qua UI)
    LoginPage loginPage = new LoginPage(driver);
    loginPage.enterCredentials("testuser", "correctpass");
    loginPage.clickLoginButton(); // Hành động này sẽ trigger cuộc gọi POST tới WireMock

    // 2. Appium chờ kết quả, lấy token từ màn hình sau khi đăng nhập thành công (dựa trên mock data)
    String token = driver.findElement(By.id("user_token")).getText(); 
    Assert.assertTrue(token.contains("MOCK_JWT_TOKEN")); // Xác nhận dữ liệu mô phỏng đúng

} finally {
    // Đảm bảo tắt WireMock sau khi hoàn tất test
    teardownWireMock();
}

// Ví dụ Test Failure Case (kiểm tra hiển thị popup lỗi)
public void testInvalidLoginFlow() {
    // Buộc gọi API fail trước khi chạy Appium action
    stubFailureCase(401); 
    
    driver.findElement(By.id("username")).sendKeys("baduser");
    driver.findElement(By.id("password")).sendKeys("wrongpass");
    driver.findElement(By.id("login_button")).click();

    // Kiểm tra xem UI có hiển thị thông báo lỗi do WireMock cung cấp không.
    String errorPopup = driver.findElement(By.xpath("//android:text[@resource-id='error_message']")).getText();
    Assert.assertEquals("Tên đăng nhập hoặc mật khẩu không chính xác.", errorPopup);
}
```

***

## IV. Các Chiến lược Nâng cao (Advanced Techniques)

Để nâng cấp quy trình kiểm thử của bạn từ mức cơ bản lên mức chuyên gia, hãy cân nhắc các chiến lược sau:

### 1. Giả lập độ trễ mạng và timeout (Simulating Latency & Timeout)
Khi backend bị chậm do tải nặng, ứng dụng cần phải hiển thị trạng thái Loading/Spinner một cách mượt mà, thay vì đứng hình hoặc báo lỗi không rõ nguyên nhân. WireMock cho phép bạn mô phỏng điều này:

*   **Cách làm:** Sử dụng tính năng `fixedDelay` trong WireMock stubbing.
*   **Lợi ích:** Test ability of the UI to handle asynchronous operations gracefully.

### 2. Kiểm thử theo trạng thái (Stateful Testing)
Trong các quy trình phức tạp, API thứ hai thường yêu cầu một trường dữ liệu được tạo ra từ API thứ nhất (ví dụ: Tạo Order -> Lấy ID Order đó để cập nhật Shipment). WireMock giúp bạn quản lý luồng này:

*   **Cách làm:** Sử dụng khả năng **Persistence** của WireMock hoặc các cơ chế *Context Variables* trong thư viện testing của bạn để lưu trữ giá trị trả về (ví dụ: `user_id`) và sử dụng nó làm tham số yêu cầu cho API stub tiếp theo.
*   **Lợi ích:** Mô phỏng chính xác End-to-End flow mà không cần phụ thuộc vào database thật.

### 3. Kiểm tra Schema Validation nghiêm ngặt
Đôi khi, lỗi xảy ra không phải vì server crash, mà chỉ vì schema dữ liệu thay đổi (ví dụ: tên trường `user_id` thành `userId`).

*   **Cách làm:** Định nghĩa các stub với cấu trúc JSON/XML cực kỳ chặt chẽ. Nếu backend thực tế trả về một kiểu dữ liệu sai lệch (ví dụ: chuỗi thay vì số nguyên), bạn có thể lập trình kiểm tra việc này trong môi trường staging và sử dụng WireMock để mô phỏng chính xác "kết quả hỏng" đó cho mục đích test client-side validation.

## V. Kết luận

Sử dụng Mock Server với WireMock kết hợp Appium không chỉ là một *cách làm* mà còn là một **triết lý kiểm thử** nhằm đạt được tính ổn định tuyệt đối (absolute stability) trong các bộ test tự động.

Bằng việc cô lập ứng dụng di động của bạn khỏi sự biến động của backend, chúng ta tối ưu hóa:
1.  **Tốc độ Test:** Không phải chờ đợi phản hồi chậm từ server thật.
2.  **Khả năng tái tạo (Repeatability):** Các test case luôn chạy với cùng một kết quả dự kiến.
3.  **Phạm vi bao phủ:** Chúng ta có thể chủ động buộc ứng dụng xử lý mọi trường hợp lỗi hiếm gặp nhất (như mạng mất kết nối, API 500, hoặc dữ liệu null) mà không cần phải đợi các nhà phát triển fix server trước.

Đây là một khoản đầu tư lớn về thời gian thiết lập ban đầu, nhưng nó sẽ giúp đội ngũ QA của bạn tiết kiệm hàng trăm giờ debug và dramatically tăng độ tin cậy (confidence level) cho sản phẩm cuối cùng.

Chúc các đồng nghiệp thành công trong hành trình xây dựng các bộ test tự động mạnh mẽ!

**— Khánh Đỗ —**