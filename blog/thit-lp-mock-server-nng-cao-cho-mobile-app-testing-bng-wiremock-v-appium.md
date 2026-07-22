---
title: "Thiết lập Mock Server nâng cao cho Mobile App Testing bằng WireMock và Appium"
date: 2026-05-15
description: "Làm chủ Artfact testing: Hướng dẫn chi tiết thiết lập WireMock để mô phỏng API phức tạp, tối ưu hóa kịch bản kiểm thử ứng dụng di động với Appium."
tags: ["Mobile Testing","Appium","WireMock","API Mocking"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Khánh Đỗ"
---

# Thiết lập Mock Server nâng cao cho Mobile App Testing bằng WireMock và Appium

Chào các anh chị em đồng nghiệp đang làm trong lĩnh vực Quality Engineering, tôi là Khánh Đỗ.

Trong hành trình QA chuyên sâu, chúng ta thường gặp một thách thức lớn khi kiểm thử ứng dụng di động (Mobile App). Ứng dụng của bạn luôn phải giao tiếp với nhiều API backend khác nhau. Trong môi trường Dev hoặc CI/CD cục bộ, việc phụ thuộc vào các dịch vụ backend thực tế (stagin/pre-prod) không chỉ gây chậm trễ mà còn dẫn đến tính kém ổn định khi một service nào đó bị lỗi ngoài luồng kiểm thử của chúng ta.

Và đây chính là lúc sự kết hợp giữa **WireMock** và **Appium** trở thành vũ khí tối thượng của người QA chuyên nghiệp. Bài viết này không chỉ dừng lại ở việc "cài đặt"; chúng ta sẽ đi sâu vào cách thiết lập một Mock Server nâng cao để kiểm soát hoàn toàn hành vi mạng, cho phép bạn mô phỏng các kịch bản phức tạp nhất, từ lỗi API đến độ trễ mạng (latency).

***

## 🧱 I. Nền tảng lý thuyết: Tại sao phải là WireMock?

Trước khi đi vào thực tiễn, hãy hiểu rõ vai trò của Mock Server trong bối cảnh Mobile Testing.

**Kiểm thử kiểu Tách biệt (Isolation Testing):** Mục tiêu tối thượng của QA là đảm bảo rằng ứng dụng hoạt động đúng đắn *dù* backend có lỗi hay thay đổi thế nào. Bằng cách sử dụng WireMock, chúng ta tạo ra một lớp giả lập hoàn hảo cho API backend.

### 💡 Tại sao chọn WireMock cụ thể?

Khác với các mocking đơn giản chỉ trả về mã JSON tĩnh, WireMock (và các công cụ tương tự như Mockito) cung cấp khả năng **kiểm soát luồng và hành vi HTTP** một cách tinh vi:

1.  **Mapping chính xác:** Định nghĩa các yêu cầu theo phương thức HTTP (GET/POST), path, header, và body request.
2.  **Response phức tạp:** Trả về không chỉ payload JSON mà còn cả mã trạng thái (HTTP Status Code) mong muốn.
3.  **Scenario Simulation (Mô phỏng kịch bản):** Đây là điểm mạnh nhất. Bạn có thể thiết lập WireMock để:
    *   Trả về lỗi 500 Internal Server Error sau lần gọi thứ N.
    *   Gây ra độ trễ mạng giả (latency) 2 giây.
    *   Yêu cầu một tham số đầu vào cụ thể trong request body để trả về response khác nhau (Stateful Mocking).

***

## 🛠️ II. Hướng dẫn thiết lập thực tế: WireMock với Appium

Trong bài viết này, chúng ta sẽ giả định kịch bản sau: Người dùng đăng nhập qua Mobile App và API backend của người dùng có thể bị lỗi tạm thời (ví dụ: mã 503) hoặc trả về dữ liệu bị giới hạn (Rate Limit - mã 429). Chúng ta cần kiểm tra cách ứng dụng xử lý các trường hợp này.

### Bước 1: Thiết lập WireMock Server

Chúng ta nên chạy WireMock trong một container Docker để đảm bảo tính độc lập và dễ tái tạo môi trường testing.

**Ví dụ cấu hình `mappings` (tham chiếu vào file JSON/YAML):**

Giả sử chúng ta muốn mô phỏng API `/api/v1/login`. Chúng ta cần 3 kịch bản: Thành công, Lỗi Server, và Giới hạn Rate Limit.

```json
// src/test/resources/mappings/user_login_mock.json
{
  "request": {
    "method": "POST",
    "urlPattern": "/api/v1/login"
  },
  "response": [
    {
      "status": 200,
      "body": "{\"token\": \"valid-jwt\", \"user_id\": 1}",
      "headers": {
        "Content-Type": "application/json"
      }
    },
    {
      // Kịch bản lỗi server (503)
      "status": 503,
      "body": "{\"error\": \"Service Unavailable. Please try again later.\"}"
    },
    {
      // Kịch bản rate limit (429)
      "status": 429,
      "body": "{\"error\": \"Rate Limit Exceeded.\", \"retry_after_seconds\": 60}"
    }
  ]
}
```

### Bước 2: Tích hợp WireMock vào Test Framework (JUnit/TestNG)

Trong môi trường Java (thường đi kèm với Appium), chúng ta sử dụng các thư viện như `WireMock JUnit Rule` để khởi tạo và quản lý vòng đời của Server.

**Mã giả lập quy trình Mocking:**

```java
// Class: LoginAPIMockRule.java
public class LoginAPIMockRule {
    @Rule
    public WireMockRule wiremock = new WireMockRule(
        wireMockUrl("http://localhost:8080"), 
        Options.options()
            .port(8080) // Đảm bảo port nhất quán với Appium config
            .build()
    );

    @BeforeMethod
    public void setupMocks() {
        // Xóa sạch các mapping cũ trước mỗi lần chạy test
        wiremock.reset(); 
        
        // Thiết lập 1: Kịch bản thành công (Dành cho testcase "Happy Path")
        stubFor(post(urlEqualTo("/api/v1/login"))
                .withRequestBodyContaining("testuser")
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("{\"token\": \"valid-jwt\", \"user_id\": 1}"))).inScenario("Login Flow");

        // Thiết lập 2: Kịch bản lỗi (Dành cho testcase "Failure Path")
        stubFor(post(urlEqualTo("/api/v1/login"))
                .withRequestBodyContaining("badpass") // Chỉ kích hoạt khi user nhập mật khẩu sai
                .willReturn(aResponse()
                        .withStatus(401)
                        .withBody("{\"error\": \"Invalid credentials\"}")));
    }
}
```

### Bước 3: Triển khai Appium Test Case sử dụng Mocked API

Bây giờ, chúng ta sẽ kết nối Appium (thực hiện các hành vi người dùng trên thiết bị giả lập/thực) với Server Mock đã được cấu hình.

**Giả định:** Mobile App của bạn khi gọi API, nó sẽ trỏ đến `http://localhost:8080` thay vì backend thật. Điều này phải được thực hiện thông qua việc cấu hình môi trường (Environment Variables) cho Appium Driver.

```java
// Class: LoginAppTest.java
@Ignore("Sử dụng Mobile Test Runner")
public class LoginAppTest {
    
    WebDriver driver = new AppiumDriver(); // Khởi tạo Appium session
    LoginAPIMockRule mockRules = new LoginAPIMockRule();

    @Test(priority = 1)
    public void test_successful_login_flow() {
        // 1. Thao tác trên Appium: Nhập user/pass hợp lệ (kích hoạt stub 200 OK).
        driver.findElement(By.id("username")).sendKeys("testuser");
        driver.findElement(By.id("password")).sendKeys("correctpass");
        driver.findElement(By.id("loginButton")).click();

        // EXPECTATION: Appium nên đọc được Token và điều hướng đến màn hình Dashboard (API 200 OK)
        WebElement dashboardElement = waitUntilElementIsVisible(By.id("dashboardHeader"));
        Assert.assertTrue(dashboardElement.isDisplayed(), "Đăng nhập thành công, phải hiển thị trang Dashboard.");
    }

    @Test(priority = 2)
    public void test_server_unavailable_handling() {
        // *** Kỹ thuật nâng cao: Thao túng Mock Server giữa chừng ***
        mockRules.setMockStatus(503); // Thay đổi mapping ngay trước khi chạy test

        // 1. Thao tác trên Appium: Thực hiện đăng nhập (kích hoạt stub 503).
        driver.findElement(By.id("loginButton")).click();

        // EXPECTATION: Appium không được báo lỗi API chung, mà phải hiển thị Pop-up "Service Unavailable"
        WebElement errorPopup = waitUntilElementIsDisplayed(By.id("error_popup"));
        Assert.assertTrue(errorPopup.getText().contains("Tạm thời mất kết nối"), 
                              "App phải bắt và hiển thị thông báo lỗi Server đúng cách.");
    }

    @AfterMethod
    public void tearDown() {
        mockRules.resetMock(); // Đặt lại toàn bộ mapping về trạng thái mặc định
        driver.quit();
    }
}
```

***

## 🚀 III. Phân tích chuyên sâu và Lời khuyên từ Khánh Đỗ (The QE Lead’s Insights)

Thiết lập Mock Server không chỉ là copy-paste code; nó đòi hỏi tư duy kiểm thử kiến trúc hệ thống. Dưới đây là ba điểm quan trọng mà các QA/QE cần lưu ý:

### 1. Quản lý Trạng thái (State Management) - Tăng cấp từ Test Case sang Scenario Testing

Các API thực tế thường yêu cầu trạng thái: Bạn phải đăng nhập thành công **trước** khi bạn có thể gọi API lấy profile của mình. WireMock cho phép điều này thông qua tính năng `scenarios` và `stateful matching`.

*   **Thực hành:** Thay vì tạo một endpoint `/getProfile` độc lập, hãy cấu hình nó để chỉ trả về 200 OK nếu request body chứa header **Authorization Bearer Token** được lấy thành công từ bước Mocking đăng nhập trước đó. Điều này buộc bạn phải kiểm tra luồng nghiệp vụ (business flow) thay vì chỉ kiểm tra các điểm cuối (endpoints).

### 2. Giả lập Sự cố và Tác động của Thời gian thực (Failure Injection & Time Simulation)

Một QE Lead giỏi không chỉ biết API hoạt động *khi thành công*. Họ phải biết nó hoạt động như thế nào **khi thất bại**.

*   **Hành vi cần mô phỏng:**
    *   **Timeouts:** Thiết lập WireMock để ngắt kết nối mạng sau 10 giây. Kiểm tra xem Appium có xử lý đúng trạng thái `TimeoutException` không, thay vì chỉ báo lỗi chung chung.
    *   **Payload Malformation:** Mock Server trả về một JSON hợp lệ về mặt cú pháp nhưng thiếu key bắt buộc (ví dụ: Thiếu `user_id`). Ứng dụng di động của bạn phải có lớp xử lý null pointer hoặc default value để ngăn crash.

### 3. Tối ưu hóa hiệu suất Test Suite (Test Parallelization)

Nếu các test case of Mocking được chạy quá nhiều lần, việc setup và tear down mocks sẽ tốn thời gian. Hãy luôn sử dụng tính năng **reset** của WireMock tại điểm cuối (`@AfterMethod` hoặc `tearDown()`) để đảm bảo rằng trạng thái mocking giữa hai test khác nhau không bị ảnh hưởng lẫn nhau. Điều này là yếu tố cốt lõi để duy trì khả năng chạy Test Suite song song (Parallel Execution) mà vẫn đảm bảo tính nhất quán và độ tin cậy của kết quả kiểm thử.

***

## Kết luận

Việc làm chủ Mock Server bằng WireMock và sử dụng nó cùng Appium không chỉ giúp chúng ta cách ly quá trình kiểm thử khỏi sự phụ thuộc bên ngoài, mà còn nâng tầm vai trò của QA từ người "kiểm tra lỗi" thành **Kỹ sư mô phỏng trải nghiệm hệ thống (System Simulation Engineer)**.

Hãy bắt đầu áp dụng phương pháp này vào các dự án lớn sắp tới của bạn. Tôi tin rằng, khi bạn đã làm chủ việc kiểm soát API, mọi sự cố backend sẽ không còn là nỗi sợ hãi nữa!

Chúc các anh chị em luôn vững vàng trên con đường chinh phục Chất lượng Phần mềm!

**Khánh Đỗ**
*Quality Engineering Lead*