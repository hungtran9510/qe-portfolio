---
title: "Thiết lập Mock Server nâng cao cho Mobile App Testing bằng WireMock và Appium"
date: 2026-05-16
description: "Hướng dẫn chuyên sâu cách cô lập môi trường kiểm thử di động bằng WireMock và tự động hóa với Appium, tối đa hóa độ tin cậy của test case."
tags: ["Mobile Testing","Appium","WireMock"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Khánh Đỗ"
---

# Thiết lập Mock Server nâng cao cho Mobile App Testing bằng WireMock và Appium

Chào mọi người, tôi là Khánh Đỗ. Trong vai trò một QE Lead (Trưởng nhóm Kỹ thuật Đảm bảo Chất lượng), tôi nhận thấy rằng thách thức lớn nhất khi tự động hóa kiểm thử ứng dụng di động (Mobile App) không phải là viết code Selenium hay Appium, mà chính là **sự phụ thuộc vào môi trường Backend**.

Chúng ta thường gặp tình trạng "Flaky Tests" (các bài test thất thường): lúc chạy được, lúc lại fail, và nguyên nhân luôn chỉ về dịch vụ API bên ngoài. Điều này làm chậm chu kỳ CI/CD, gây lãng phí tài nguyên kiểm thử, và tệ hơn là khiến đội ngũ mất niềm tin vào hệ thống tự động hóa của chính mình.

Bài viết này không chỉ dừng lại ở việc giải quyết các test thất thường đơn thuần. Chúng ta sẽ đi sâu vào cách thiết lập một **Môi trường Kiểm thử Cô lập (Isolated Test Environment)** hoàn hảo, sử dụng bộ đôi công cụ cực kỳ mạnh mẽ: **WireMock** và **Appium**.

Nếu bạn đang tìm kiếm sự ổn định tuyệt đối cho các test case End-to-End di động, hãy cùng tôi theo dõi!

---

## 🚀 Phần I. Nắm Bắt Vấn Đề: Tại sao cần Mocking?

Trước khi đi vào giải pháp kỹ thuật, chúng ta cần hiểu rõ nguyên lý cơ bản: **Mục tiêu của Automated Test là kiểm tra logic của ứng dụng (App Logic), chứ không phải kiểm tra sự ổn định của mạng hay Backend.**

Khi bạn sử dụng một API thực tế (ví dụ: `api.production-backend.com`), các yếu tố bên ngoài như:
1.  **Tốc độ Backend:** Nếu backend quá tải, test sẽ timeout và fail vì lý do hiệu năng, không phải lỗi logic của app.
2.  **Trạng thái dữ liệu:** Dữ liệu có thể bị thay đổi bởi các process khác (data race condition).
3.  **Tính khả dụng:** Downtime là điều không tránh khỏi.

**Giải pháp Mocking bằng WireMock:** WireMock đóng vai trò là một "người mô phỏng" API Backend của bạn. Nó hoạt động như một *Proxy Server* chuyên biệt, lắng nghe các yêu cầu HTTP mà ứng dụng di động gửi đến và trả về phản hồi được kiểm soát hoàn toàn (dù là thành công 200 OK với payload dữ liệu giả định, hay lỗi 401 Unauthorized để kiểm tra luồng xử lý error).

### 💡 WireMock vs. Stubbing đơn thuần
*   **Stub:** Chỉ trả về một giá trị cố định bất kể yêu cầu là gì. (Quá đơn giản).
*   **WireMock:** Mạnh hơn nhiều. Nó cho phép bạn thiết lập các quy tắc khớp request cực kỳ chi tiết (**Request Matching**), bao gồm:
    *   Phương thức HTTP (`GET`, `POST`).
    *   URL Endpoint chính xác.
    *   Header bắt buộc (ví dụ: yêu cầu phải có Bearer Token).
    *   Giá trị tham số trong Body JSON.

Điều này cho phép chúng ta kiểm thử các trường hợp phức tạp như "Nếu request chứa UserID X, thì trả về dữ liệu A; nhưng nếu chứa Y, thì trả về lỗi B."

---

## 🛠️ Phần II. Thiết Lập Môi Trường Tích Hợp (WireMock & Appium)

Giả sử chúng ta có một ứng dụng di động tính năng "Xem chi tiết sản phẩm" (`Product Detail Screen`). Dữ liệu này được lấy qua API call từ endpoint: `GET /api/products/{id}`.

**Flow kiểm thử lý tưởng:**
1.  Appium khởi chạy Mobile App (Test Case bắt đầu).
2.  Appium điều hướng đến màn hình Product Detail, và ứng dụng gọi API với Product ID = 123.
3.  WireMock chặn request này.
4.  WireMock trả về dữ liệu JSON mô phỏng (Product Name: "Laptop X", Price: "$1500").
5.  Appium kiểm tra giao diện UI xem nó đã hiển thị đúng Product Name và Price được mock chưa.

Đây là luồng chúng ta sẽ hiện thực hóa bằng code.

### Bước 1: Thiết lập WireMock Server

Chúng ta cần khởi động WireMock trên một cổng khác với backend thật (ví dụ: `http://localhost:8080`). Chúng ta sử dụng JSON files hoặc API để định nghĩa các quy tắc khớp request.

**Ví dụ thiết lập cho Product ID = 123:**
**(Giả sử chúng ta dùng Java/JUnit Runner để khởi chạy WireMock)**

```json
// WireMock Mapping file for /api/products/123
{
  "request": {
    "method": "GET",
    "url": "/api/products/123" 
  },
  "response": {
    "status": 200,
    "body": "{\"id\": 123, \"name\": \"Smart TV Model Z\", \"price\": 1500.00}",
    "headers": {
      "Content-Type": "application/json"
    }
  },
  "matchingRules": [
    // Quy tắc này đảm bảo chỉ trả lời khi request chứa Bearer Token hợp lệ (Nâng cao)
    {"header": "Authorization", "equalTo": "Bearer valid-token"} 
  ]
}
```

**Giải thích của Khánh Đỗ:**
*   Phần `request` định nghĩa chính xác những gì chúng ta mong đợi: Phương thức GET và endpoint `/api/products/123`.
*   Phần `response` là payload mà WireMock sẽ gửi về. Quan trọng nhất, hãy lưu ý việc sử dụng **Status 200**. Nếu muốn kiểm thử luồng lỗi API (ví dụ: Network Error), chúng ta có thể cấu hình WireMock trả về Status 503 hoặc thậm chí dùng các logic để làm timeout request.
*   Phần `matchingRules` là điểm nâng cao. Nó cho phép test case của bạn không chỉ kiểm tra xem app gọi đúng URL, mà còn phải gửi kèm theo header (như token) *theo định dạng chính xác*.

### Bước 2: Cấu hình Appium Client và Test Script

Thay vì để ứng dụng di động kết nối tới `https://api.live-backend.com`, chúng ta buộc nó phải trỏ đến Mock Server của mình: `http://localhost:8080`.

**Cấu trúc Code (Ví dụ sử dụng Python/Java cho Appium và ngôn ngữ kiểm thử):**

```python
# appium_test_script.py

from appium import webdriver
import time

def run_product_detail_test():
    # 1. Khởi tạo driver Appium
    # Lưu ý: Cấu hình remote-device phải trỏ đến Mock Server của ta!
    desired_capabilities = {
        'platformName': 'Android',
        'appPackage': 'com.myapp',
        # Giả định rằng chúng ta đã thiết lập môi trường để App gọi API tại localhost:8080
        'apiBaseUrlMocked': 'http://localhost:8080/api/products/' 
    }
    driver = webdriver.Remote('http://localhost:4723/wd/hub', desired_capabilities)
    
    try:
        # 2. Appium điều hướng và kích hoạt hành động (Action Trigger)
        # Ta bấm vào sản phẩm ID 123
        time.sleep(3) # Cho app load xong màn hình list

        # Tìm element của Product ID 123 và click
        product_element = driver.find_element_by_id("product-card-123")
        product_element.click()
        
        # 3. Chờ đợi sự thay đổi UI (Kiểm tra kết quả Mock)
        time.sleep(5) # Thời gian cho App gọi API và xử lý dữ liệu
        
        # 4. Assertion (Xác nhận kết quả kiểm thử)
        # Chúng ta assertion rằng TextView Tên sản phẩm phải chứa giá trị do WireMock cung cấp: "Smart TV Model Z"
        expected_name = "Smart TV Model Z"
        actual_name_element = driver.find_element_by_id("product-detail-name")
        actual_name = actual_name_element.text

        assert actual_name == expected_name, f"FAIL: Expected '{expected_name}', but got '{actual_name}'"
        print("\n✅ Test Passed! UI hiển thị chính xác dữ liệu từ Mock Server.")


    except AssertionError as e:
        print(f"\n❌ Test Failed (Logic Error): {e}")
    except Exception as e:
        print(f"\n❌ Test Failed (Automation/Network Error): {e}")
    finally:
        driver.quit()

if __name__ == "__main__":
    run_product_detail_test()
```

**Giải thích của Khánh Đỗ:**
*   **Kiểm soát luồng:** Sự kỳ diệu ở đây là khi Appium thực hiện `product_element.click()`, hành động này khiến ứng dụng bên dưới tự động gọi API tới Endpoint (mà trong môi trường test, chúng ta đã ép nó trỏ về WireMock).
*   **Độ tin cậy tuyệt đối:** Chúng ta không cần quan tâm mạng đang ổn định hay Backend có báo lỗi 500 hay không. Khi app gọi request, WireMock sẽ đảm bảo trả về *chính xác* payload JSON mà chúng ta đã thiết lập ở Bước 1, cho phép chúng ta kiểm tra mọi luồng dữ liệu từ giao diện người dùng (UI) một cách nhất quán và lặp lại.

---

## ✨ Phần III. Các Kỹ Thuật Nâng Cao dành cho QE Lead

Để bài test không chỉ ổn định mà còn phải thực sự "Chuyên nghiệp," các bạn cần áp dụng những kỹ thuật sau:

### 1. Kiểm Thử Theo Trạng Thái (Stateful Mocking)
Thay vì coi mỗi request là độc lập, hãy mô phỏng một luồng tương tác người dùng nhiều bước (ví dụ: Đăng nhập -> Lấy Token A -> Dùng Token A để gọi API B).
*   **Kỹ thuật:** Thiết lập WireMock để yêu cầu đầu vào (Header) ở lần gọi thứ hai phải chứa kết quả (Token) được trả về từ lần gọi đầu tiên. Điều này mô phỏng các luồng bảo mật phức tạp như OAuth 2.0 hoặc JWT.

### 2. Mô Phỏng Lỗi Có Chủ Ý (Intentional Failure Simulation)
Đây là điều quan trọng nhất đối với QE Lead. Một test tốt không chỉ kiểm tra khi mọi thứ hoạt động (Happy Path), mà còn phải kiểm tra:
*   **Timeout:** Cấu hình WireMock để mất 10 giây trả lời. Appium sẽ xác nhận rằng app của bạn hiển thị thông báo "Không thể kết nối" thay vì đơn giản là treo máy.
*   **Thử nghiệm Schema/Payload Hỏng:** Trả về JSON bị sai cấu trúc (Invalid schema). Test phải đảm bảo App xử lý được exception này bằng cơ chế Graceful Degradation (giảm thiểu gián đoạn) mà không bị Crash.

### 3. Kết hợp Validation Request trong WireMock
Luôn luôn kiểm tra các điều kiện đầu vào. Nếu bạn chỉ Mock một Endpoint, hãy thêm `matchingRules` để đảm bảo rằng mọi test case đều phải gửi kèm theo những dữ liệu bắt buộc (ví dụ: tất cả requests POST đều phải có trường `user_id`).

---

## 📝 Kết Luận

Thiết lập Mock Server nâng cao bằng WireMock và tự động hóa luồng UI với Appium là một bước nhảy vọt về độ tin cậy trong quá trình kiểm thử di động. Bằng cách tách biệt logic ứng dụng khỏi sự biến đổi của môi trường Backend, chúng ta đạt được ba mục tiêu quan trọng:

1.  **Tăng tốc Độ:** Test chạy nhanh hơn nhiều vì không phải chờ đợi backend thực tế.
2.  **Đảm bảo Tính Lặp lại (Determinism):** Kết quả kiểm thử luôn giống nhau, giúp đội ngũ tự tin vào kết quả CI/CD.
3.  **Khả năng Cô lập (Isolation):** Bạn có thể test một tính năng mới mà không cần triển khai hoặc chờ đợi bất kỳ dịch vụ nào khác trong hệ sinh thái Microservices.

Hãy bắt đầu áp dụng phương pháp Mocking này ngay hôm nay, và tôi tin rằng bạn sẽ thấy sự cải thiện rõ rệt về chất lượng và tốc độ kiểm thử tự động của toàn đội!

Nếu có bất kỳ câu hỏi nào về việc tích hợp hoặc cấu hình các luồng mock phức tạp, đừng ngần ngại trao đổi với tôi nhé.

**Trân trọng,**
**Khánh Đỗ**
***QE Lead Expert***