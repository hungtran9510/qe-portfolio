---
title: "Thiết lập Mock Server nâng cao cho Mobile App Testing bằng WireMock và Appium"
date: 2026-05-18
description: "Khám phá chiến lược kiểm thử di động mạnh mẽ: Cách dùng WireMock để mô phỏng backend API phức tạp, giúp Appium tự do xác minh giao diện người dùng (UI)."
tags: ["Mobile Testing","Appium","WireMock"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Khánh Đỗ"
---

# Thiết lập Mock Server nâng cao cho Mobile App Testing bằng WireMock và Appium

Chào các bạn đồng nghiệp! Tôi là Khánh Đỗ, một QE Lead.

Trong thế giới phát triển phần mềm hiện đại, việc kiểm thử ứng dụng di động (Mobile App Testing) không chỉ đơn thuần là bấm qua nút này đến nút khác trên giao diện người dùng (UI). Một bài test chất lượng cao phải đảm bảo rằng app hoạt động ổn định dưới mọi điều kiện mạng, đặc biệt khi hệ thống backend gặp sự cố hoặc cần mô phỏng các kịch bản dữ liệu rất cụ thể.

Nếu bạn đã bao giờ thấy một vòng test thất bại chỉ vì môi trường staging của API bị lỗi, tôi hiểu cảm giác đó – đó là lúc kiểm thử của chúng ta bị "giới hạn" bởi những dependency bên ngoài.

Chính vì vậy, hôm nay, chúng ta sẽ đi sâu vào một chiến lược testing cực kỳ mạnh mẽ: **Thiết lập Mock Server nâng cao sử dụng WireMock để cô lập ứng dụng Mobile, và Appium để xác minh trải nghiệm người dùng.**

---

## 💡 Phần I: Tư duy về Isolated Testing (Kiểm thử Cô lập)

### 1. Vấn đề cần giải quyết

Khi chúng ta chạy một ứng dụng mobile thực tế, nó luôn phụ thuộc vào một hoặc nhiều dịch vụ backend API (ví dụ: xác thực người dùng, lấy danh sách sản phẩm, cập nhật trạng thái). Trong môi trường Dev/Test/QA, những service này thường nằm trên các endpoint khác nhau và có thể không hoạt động đồng bộ.

Nếu ta kiểm thử bằng cách kết nối thẳng đến Backend thật:
1. **Rủi ro:** Test của bạn bị ảnh hưởng bởi bất kỳ sự cố nào xảy ra ở backend (down-time).
2. **Khó khăn:** Bạn không thể dễ dàng mô phỏng các trường hợp lỗi đặc biệt như "API trả về mã 500 Internal Server Error" hoặc "API chậm phản hồi trong 10 giây."

### 2. Vai trò của Mocking Frameworks (WireMock)

**WireMock** là một mock server chuyên dụng, cho phép chúng ta định nghĩa các hành vi (behavior) và phản hồi (response) của một API theo ý muốn. Nó hoạt động như một "bản sao ảo" hoàn hảo của backend thực tế.

*   **Mục tiêu:** Thay vì để Mobile App gọi đến `https://api.prod.com/users`, chúng ta sẽ cấu hình nó gọi đến `http://localhost:8080/api/users` (mà WireMock đang lắng nghe).
*   **Lợi ích chính:** Đảm bảo rằng toàn bộ quy trình test chỉ phụ thuộc vào Mã nguồn của chúng ta và Mock Server. Điều này giúp các bài test trở nên **Deterministic** (xác định kết quả) và có thể chạy lại bất cứ lúc nào mà không cần lo lắng về trạng thái mạng hay backend bên ngoài.

## 🧠 Phần II: Triển khai Kỹ thuật – WireMock hoạt động thế nào?

WireMock cho phép chúng ta mô phỏng các yêu cầu HTTP ở mức độ rất cao, bao gồm cả việc khớp nối (Matching) theo phương thức (GET/POST), đường dẫn (`/users`), header, và thậm chí là body của request.

### 1. Ví dụ cấu hình WireMock (Java/JVM)

Chúng ta muốn mô phỏng một API lấy danh sách sản phẩm. Khi App gọi đến `/products`, chúng ta muốn nó phản hồi với trạng thái 200 OK, kèm theo một mảng JSON giả lập.

```java
// Giả định sử dụng com.github.tomakehurst:wiremock-standalone
WireMock(8080).stubFor(get(urlEqualTo("/products"))
    .willReturn(aResponse()
        .withStatus(200) // Thiết lập mã trạng thái thành công
        .withHeader("Content-Type", "application/json")
        .withBody("{\"products\": [" +
                    "{\"id\": 1, \"name\": \"Laptop A\", \"price\": 1200}, " +
                    "{\"id\": 2, \"name\": \"Mouse B\", \"price\": 25}]}")
    )
);

// Tùy chỉnh thêm: Mô phỏng trạng thái không tồn tại (404)
WireMock(8080).stubFor(get(urlEqualTo("/products/999"))
    .willReturn(aResponse()
        .withStatus(404) // API báo lỗi 404
        .withBody("{\"error\": \"Product not found\"}")
    )
);
```

**Giải thích chi tiết của Khánh Đỗ:**

1. **`get(urlEqualTo("/products"))`**: Đây là bộ matcher. Nó chỉ kích hoạt khi ứng dụng gửi một yêu cầu HTTP GET đến đường dẫn `/products`.
2. **`.willReturn(...)`**: Xác định hành vi phản hồi. Chúng ta buộc WireMock phải trả về các thông số sau:
    *   `withStatus(200)`: Đảm bảo rằng dù backend thực tế có bị lỗi gì đi nữa, trong quá trình test này, nó luôn giả vờ thành công (HTTP 200).
    *   `withBody(...)`: Đây là dữ liệu JSON được nhúng vào. Bằng cách kiểm soát nội dung này, chúng ta có thể đảm bảo các bài test của Appium luôn nhận đủ và chính xác bộ dữ liệu cần thiết để render UI.

### 2. Kỹ thuật nâng cao: Mô phỏng Trạng thái Lỗi (Error States)

Điều tuyệt vời nhất của WireMock là khả năng mô phỏng trạng thái lỗi, điều mà backend thật rất khó kiểm soát trong test case thông thường.

**Scenario:** Test trường hợp App hiển thị thông báo "Không có kết nối mạng" hoặc "Server đang bảo trì".

```java
// Mô phỏng API chậm phản hồi (Timeout Testing)
WireMock(8080).stubFor(get(urlEqualTo("/data"))
    .willReturn(aResponse()
        .withStatus(200)
        .withFixedDelay(5000) // Tạm dừng 5 giây!
        .withBody("{\"status\": \"ok\"}")
    )
);

// Mô phỏng kết nối bị từ chối (Network Failure)
// WireMock không thể mô phỏng tầng OS, nhưng chúng ta có thể dùng các thư viện giả lập mạng hoặc...
// Quan trọng hơn: Định nghĩa một API trả về mã 503 Service Unavailable.
WireMock(8080).stubFor(get(urlEqualTo("/data/unavailable"))
    .willReturn(aResponse()
        .withStatus(503) // Lỗi dịch vụ đang bảo trì
        .withBody("{\"message\": \"Service temporarily unavailable.\"}")
    )
);
```

## 🚀 Phần III: Tích hợp với Appium – Liên kết UI và API Mock

Sau khi WireMock đã sẵn sàng làm nhiệm vụ "người đưa dữ liệu giả", chúng ta cần sử dụng Appium để thực hiện việc tương tác. Appium chỉ đơn thuần là công cụ điều khiển các hành động của người dùng trên thiết bị mô phỏng (emulator/simulator).

**Quy trình kết hợp:**
1. **Bước 0 (Setup):** Khởi chạy Mock Server WireMock và đảm bảo tất cả các stub đã được cấu hình (như đoạn code ở Phần II).
2. **Bước 1 (Action - Appium):** Sử dụng Appium để mở ứng dụng, thực hiện hành động của người dùng (ví dụ: nhấn nút "Xem Sản phẩm").
3. **Bước 2 (Mocking - WireMock):** Ngay khi ứng dụng gọi API, yêu cầu đó sẽ bị chặn và được xử lý bởi WireMock, trả về dữ liệu giả lập đã định nghĩa.
4. **Bước 3 (Assertion - Appium/Test Code):** Appium chờ nhận dữ liệu từ Mock Server, và chúng ta sử dụng các hàm Assertion của Selenium/Appium để xác minh rằng UI đã hiển thị chính xác sản phẩm ID: 1 với tên "Laptop A".

### Ví dụ luồng kiểm thử logic:

| Hành động | Công cụ thực hiện | Mô tả kỹ thuật | Kết quả mong đợi (Test Pass) |
| :--- | :--- | :--- | :--- |
| **Setup** | WireMock | Cấu hình API `/products` trả về danh sách sản phẩm giả. | Mock Server chạy và sẵn sàng nhận request. |
| **Action** | Appium/Selenium | `driver.findElement(By.id("btn_load"))` (Click nút tải dữ liệu) | Ứng dụng bắt đầu gọi đến WireMock trên port 8080. |
| **Wait & Read** | Appium/Selenium | Chờ sự kiện UI sau khi nhận data. | Dữ liệu JSON giả từ WireMock được parse và hiển thị thành phần `TextView` với nội dung "Laptop A". |
| **Assertion** | Test Code (JUnit/TestNG) | `assertTrue(element.getText().contains("Laptop A"));` | Xác nhận sự kiện này đã xảy ra, bài test PASS. |

## ✨ Kết luận: Tại sao đây là chiến lược QE hàng đầu?

Việc kết hợp WireMock và Appium không chỉ là một mẹo kỹ thuật; nó là việc nâng tầm năng lực kiểm thử của đội ngũ QA lên một cấp độ tự động hóa và minh bạch cao nhất.

Khi bạn làm chủ được Mock Server, bạn đã đạt được:
1. **Tính ổn định (Stability):** Loại bỏ sự phụ thuộc vào môi trường mạng và Backend bên ngoài.
2. **Khả năng mở rộng (Scalability):** Bạn có thể xây dựng hàng trăm kịch bản lỗi mà không cần thay đổi bất cứ thứ gì ở API thực tế.
3. **Tốc độ (Speed):** Mocked requests thường phản hồi nhanh hơn các request qua mạng thật, giúp giảm đáng kể thời gian chạy bộ test tự động.

Nếu đội ngũ của bạn đang gặp khó khăn với việc cô lập các dependency trong quá trình kiểm thử Mobile, hãy bắt đầu nghiên cứu sâu về WireMock. Đây chính là chìa khóa để chuyển từ một quy trình test chỉ "kiểm tra" sang một quy trình test thực sự **"xác minh tính đúng đắn dưới mọi kịch bản."**

Chúc các bạn thành công trong hành trình xây dựng hệ thống test tự động mạnh mẽ!
***