---
title: "Chiến lược xử lý Flaky Tests trong các dự án kiểm thử tự động quy mô lớn"
date: 2026-06-10
description: "Hướng dẫn chuyên sâu từ QE Lead Hoàng Hiệp về các chiến lược căn cơ để khắc phục và ngăn ngừa Flaky Tests, giúp hệ thống QA của bạn luôn ổn định và đáng tin cậy."
tags: ["Automation","QA Strategy","Testing"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hoàng Hiệp"
---

# Chiến lược xử lý Flaky Tests trong các dự án kiểm thử tự động quy mô lớn

**Tác giả:** Hoàng Hiệp (QE Lead)
***

Chào cả nhà, tôi là Hoàng Hiệp. Sau nhiều năm gắn bó với lĩnh vực Kỹ thuật Đảm bảo Chất lượng Phần mềm, tôi đã chứng kiến hàng trăm hệ thống kiểm thử tự động – từ những dự án nhỏ gọn đến các tập suite khổng lồ, đồ sộ ở cấp độ doanh nghiệp (Enterprise).

Và nếu có một "vết thương" mãn tính mà mọi đội QA đều phải đối mặt, đó chính là **Flaky Tests** hay còn gọi là *Non-deterministic Tests*.

Bạn đã bao giờ gặp tình huống này chưa: Lần chạy test thứ ba trong ngày, hệ thống báo thất bại (FAIL), nhưng khi bạn chạy lại bằng tay và xác nhận chức năng đó hoạt động hoàn hảo? Cảm giác frustration đó không chỉ khiến đội ngũ mất niềm tin vào công cụ tự động hóa mà còn làm tê liệt cả quy trình CI/CD.

Flaky Tests là nỗi ám ảnh của bất cứ QE Lead nào. Chúng mang lại cái vẻ ngoài của sự thất bại nhưng thực chất chỉ là biểu hiện của sự *không ổn định (Instability)* trong môi trường hoặc thiết kế test case của chúng ta.

Bài viết này không chỉ dừng lại ở việc đưa ra các mẹo vặt (*quick fixes*), mà tôi sẽ cung cấp một **chiến lược toàn diện và có hệ thống** để bạn giải quyết tận gốc vấn đề, biến bộ suite kiểm thử tự động của mình từ "nghệ sĩ xiếc may mắn" thành một tài sản QA đáng tin cậy.

---

## 🔬 Phần I: Hiểu bản chất – Tại sao Test lại bị Flaky?

Trước khi xử lý, chúng ta phải xác định nguyên nhân gốc rễ (Root Cause Analysis). Flakiness hiếm khi đến từ code kiểm thử; nó thường là sự tương tác phức tạp của nhiều yếu tố.

Tôi đã phân loại các nguồn gây ra flakiness thành 4 nhóm chính:

### 1. Race Conditions & Timing Issues (Điều kiện chạy đua và Thời gian)
Đây là nguyên nhân phổ biến nhất, đặc biệt trong UI/Web Automation. Test script cố gắng tương tác với một phần tử giao diện trước khi nó kịp tải hoặc hiển thị.

*   **Ví dụ:** Bạn viết code tìm kiếm nút bấm X ngay sau khi trang bắt đầu load, nhưng do mạng chậm hoặc AJAX delay, phần tử đó chưa xuất hiện. Test sẽ thất bại vì *Element Not Found*.

### 2. Dependency Instability (Thiếu ổn định về phụ thuộc)
Test case của bạn phụ thuộc vào trạng thái của một hệ thống khác (ví dụ: Microservice A phải trả lời thành công trước khi Service B được kiểm thử). Nếu một trong các service này bị chậm hoặc gián đoạn, test sẽ thất bại.

### 3. Environment Flakiness (Tính không ổn định của môi trường)
Khi các bản môi trường Dev/Staging không được đồng bộ hóa hoàn hảo, hoặc khi dữ liệu mẫu (Test Data) bị thay đổi ngầm mà không báo trước, kết quả kiểm thử có thể dao động.

### 4. Test Design Flaws (Lỗi thiết kế test case)
Đây là vấn đề về logic. Ví dụ: Bạn đang test một tính năng A, nhưng lại vô tình thực hiện các bước thao tác của tính năng B, và sự tương tác không lường trước đó gây ra lỗi.

---

## 🛠️ Phần II: Các Giải pháp Chiến thuật (Tactical Fixes) – Khi cần xử lý ngay

Khi hệ thống của bạn đang gặp khủng hoảng flakiness hàng ngày, bạn cần các biện pháp can thiệp nhanh chóng. Dưới đây là ba kỹ thuật tôi khuyến nghị sử dụng và cách triển khai code mẫu bằng ngôn ngữ giả lập Python/Selenium:

### 1. Thay thế `Thread.sleep()` bằng Explicit Waits (Vánh qua vấn đề Timing)
Đây là điều tối kỵ nhất trong tự động hóa! Dùng `time.sleep(5)` nghĩa là bạn bắt test phải đợi *đúng* 5 giây, dù phần tử đã xuất hiện ở giây thứ 1 hay chưa.

Hãy luôn sử dụng **Explicit Wait** (Chờ rõ ràng). Kỹ thuật này chỉ chờ cho đến khi điều kiện mong muốn được thỏa mãn hoặc hết thời gian tối đa đã định.

**❌ Code SAI (Sử dụng Sleep cứng):**
```python
# KHÔNG BAO GIỜ DÙNG CÁCH NÀY
time.sleep(5) 
driver.find_element(By.ID, "submit_button").click() # Có thể click trước khi element load!
```

**✅ Code ĐÚNG (Sử dụng Explicit Wait):**
Giả sử chúng ta dùng một thư viện `WebDriverWait` (phổ biến trong Selenium).
```python
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By

MAX_WAIT_TIME = 10 # Giới hạn chờ tối đa là 10 giây

try:
    # Chỉ đợi cho đến khi phần tử có ID 'submit_button' hiển thị và khả dụng (clickable)
    wait = WebDriverWait(driver, MAX_WAIT_TIME)
    submit_button = wait.until(
        EC.element_to_be_clickable((By.ID, "submit_button"))
    )
    submit_button.click() # Chỉ thực hiện action khi điều kiện được thỏa mãn
except TimeoutException:
    print("Lỗi: Không tìm thấy nút submit sau 10 giây chờ.")
```

### 2. Triển khai Retry Mechanism (Cơ chế chạy lại)
Đối với các flakiness do lỗi mạng ngẫu nhiên hoặc sự dao động của hệ thống Backend, việc chỉ báo FAIL là chưa đủ. Hãy cho phép test tự động chạy lại *một số lần giới hạn* trước khi kết luận thất bại.

Các framework hiện đại như Pytest hay JUnit đều có mechanism tích hợp, nhưng nếu bạn phải tự code:
```python
from typing import Callable

def flaky_retry(func: Callable, max_retries: int = 3) -> Any:
    """Decorator để chạy lại hàm kiểm thử khi gặp ngoại lệ."""
    for attempt in range(max_retries):
        try:
            return func() # Thực thi function test case
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"Thử thất bại ở lần {attempt+1}. Đang thử lại...")
                time.sleep(2) # Nghỉ 2 giây trước khi thử lại
            else:
                raise e # Ném lỗi nếu đã hết số lần retry
```
*Lưu ý của Hiệp:* Chỉ áp dụng `flaky_retry` cho những test case mà bạn *biết chắc chắn* rằng chúng bị flakiness do môi trường. Việc lạm dụng cơ chế này sẽ che giấu các bug thực sự!

---

## 🚀 Phần III: Chiến lược Căn bản (Strategic Solutions) – Ngăn ngừa từ nguồn

Đây là phần quan trọng nhất của một QE Lead. Mục tiêu không phải là *xử lý* flakiness, mà là **loại bỏ khả năng xuất hiện** của nó ngay trong quá trình thiết kế và kiến trúc hóa hệ thống kiểm thử.

### 1. Kiến trúc hóa Test Design (Thiết kế bài test vững chắc)
Thay vì viết các chuỗi hành động tuyến tính (Linear Scripts), hãy áp dụng mô hình **Page Object Model (POM)** kết hợp với **Behavior-Driven Development (BDD)**.

*   **Tách biệt Logic:** POM buộc bạn phải cô lập logic tương tác UI khỏi logic nghiệp vụ test case. Khi một phần tử thay đổi, bạn chỉ cần cập nhật ở lớp Page Object đó, không ảnh hưởng đến hàng chục test case khác.
*   **Chia nhỏ Test Case (Small Atomic Tests):** Đừng viết một End-to-End test quá dài bao trọn toàn bộ luồng nghiệp vụ. Hãy chia nó thành các unit/component test độc lập. Nếu component A bị lỗi, bạn chỉ muốn biết rõ ràng: **"Lỗi này nằm ở Component A."**

### 2. Tăng cường Độ tin cậy của Môi trường (Environment Reliability)
Đây là nơi nhiều đội QA bỏ qua nhất nhưng lại gây ra flakiness kinh hoàng nhất.

*   **Containerization:** Sử dụng Docker hoặc Kubernetes để đảm bảo rằng tất cả các môi trường kiểm thử (Dev, Staging, Test) chạy trên cùng một phiên bản hệ điều hành, thư viện và dependency.
*   **Data Management Layer:** Xây dựng một tầng quản lý dữ liệu test case riêng biệt. Thay vì yêu cầu QA thủ công setup data, hãy viết script để **chuẩn bị (Setup)** và **dọn dẹp (Teardown)** trạng thái dữ liệu bằng mã code *trước* khi chạy test và *sau* khi kết thúc.
    *   *Ví dụ:* Luôn đảm bảo rằng nếu test A tạo ra User ID 123, thì trước khi test B bắt đầu, nó phải xóa hoặc reset User ID 123 đó.

### 3. Tích hợp Observability vào Test Suite (Quan sát và Theo dõi)
Hãy coi quá trình chạy test là một hệ thống cần được giám sát liên tục:

*   **Logging Chi tiết:** Không chỉ ghi lại `PASS`/`FAIL`. Hãy ghi lại *tại sao* nó FAIL. Ví dụ: "Timeout khi tìm kiếm phần tử X" hay "HTTP 503 Service Unavailable từ API Y".
*   **Metrics & Trending:** Theo dõi độ trễ (Latency) của các bước test theo thời gian. Nếu một step bất ngờ có độ trễ tăng lên đáng kể, đó là dấu hiệu cho thấy hệ thống phụ thuộc đang gặp vấn đề, chứ không nhất thiết phải là bug nghiệp vụ.

---

## 💡 Tổng kết: Tư duy của QE Lead

Flaky Tests không phải là thất bại của code tự động hóa, mà là **bản báo cáo về sự kém ổn định của Hệ thống** mà chúng ta đang kiểm thử.

Hãy thay đổi góc nhìn này trong toàn đội QA của bạn. Khi một test fails, đừng vội vàng đổ lỗi cho framework hay thư viện chờ (Wait). Thay vào đó, hãy đặt câu hỏi:

1. **Điều kiện tiên quyết nào đã không được đáp ứng?** (Thiếu dữ liệu/Service down?)
2. **Thao tác này có quá phụ thuộc vào thời gian tải không?** (Cần Explicit Wait hơn là Retry?)
3. **Chúng ta có thể cô lập test case này khỏi các dependency ngoại vi không?** (Giúp nó trở nên Atomic hơn?)

Bằng cách áp dụng một chiến lược có cấu trúc, chuyển từ các giải pháp vá lỗi cục bộ sang việc cải thiện kiến trúc hệ thống kiểm thử nói chung, bạn sẽ xây dựng được một bộ suite tự động hóa không chỉ chạy qua mà còn thực sự **đáng tin cậy**.

Chúc mọi người thành công trong hành trình chinh phục chất lượng!

***
*Hoàng Hiệp | QE Lead*