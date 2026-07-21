---
title: "Chiến lược xử lý Flaky Tests trong các dự án kiểm thử tự động quy mô lớn"
date: 2026-06-09
description: "Khám phá chiến lược chuyên sâu từ góc độ QE Lead để xác định và loại bỏ nguyên nhân gốc rễ của Flaky Tests, đảm bảo tính tin cậy cho hệ thống tự động."
tags: ["Automation","QA Strategy","Testing"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hoàng Hiệp"
---

# Chiến lược xử lý Flaky Tests trong các dự án kiểm thử tự động quy mô lớn

Chào các đồng nghiệp và những ai đang làm việc với QA Automation. Tôi là Hoàng Hiệp, một Quality Engineer chuyên sâu về hệ thống kiểm thử tự động. Trong hành trình xây dựng và duy trì các bộ kiểm thử (Test Suite) quy mô lớn, chắc chắn chúng ta sẽ đối mặt với một kẻ thù vô hình nhưng cực kỳ nguy hiểm: **Flaky Tests** (hay còn gọi là Test không ổn định).

Bạn đã bao giờ gặp tình huống này chưa? Bạn chạy suite tests vào buổi sáng, tất cả đều xanh. Đến chiều, khi CI/CD pipeline chạy lần thứ ba, bỗng nhiên có một bài test nào đó bất ngờ bị đỏ, không rõ lý do, và việc rerun nó lại thành công ngay sau đó.

Sự kiện này khiến đội ngũ rất hoang mang. Điều tồi tệ nhất là: chúng ta bắt đầu mất niềm tin vào chính hệ thống kiểm thử của mình. Và đó là lúc một chiến lược toàn diện phải được áp dụng.

Bài viết này không chỉ dừng lại ở việc "làm sao để nó xanh"; mà tập trung vào **chiến lược QE Lead** để tìm ra nguyên nhân gốc rễ (Root Cause) và xây dựng sự tin cậy tuyệt đối cho bộ test tự động của bạn.

***

## I. Flaky Tests là gì? Tại sao chúng lại nguy hiểm ở quy mô lớn?

### 1. Định nghĩa
Flaky Test là một bài kiểm thử được thiết kế để thất bại (Fail) không ổn định: nó có thể vượt qua (Pass) thành công khi chạy trong một điều kiện nhất định, và thất bại (Fail) trong một điều kiện khác tương đương, mà không hề có sự thay đổi nào về code nghiệp vụ (Production Code).

### 2. Mức độ nguy hiểm trong hệ thống lớn
Trong các dự án quy mô nhỏ, Flaky Tests chỉ gây phiền toái. Nhưng khi bộ test của bạn đạt đến hàng trăm, hàng nghìn bài kiểm thử, chúng trở thành một **"Technical Debt"** khổng lồ:

*   **Gây mù tịt (False Negatives/Positives):** Developer mất thời gian để tìm kiếm lỗi trong hệ thống nghiệp vụ thay vì lo lắng về lỗi kiểm thử.
*   **Giảm động lực:** Cả đội QA và Dev dần nghi ngờ giá trị của việc tự động hóa, dẫn đến tình trạng "Ghosting" (bỏ bê, không quan tâm).
*   **Tăng chi phí vận hành CI/CD:** Việc chạy lại các suite tests liên tục chỉ để xác nhận một kết quả thất thường làm chậm chu kỳ phát triển.

***

## II. Các chiến lược khắc phục (Tactical Fixes): Giải pháp Tức thời

Khi mới bắt đầu, chúng ta cần những giải pháp nhanh chóng để giảm bớt tiếng ồn từ CI/CD. Đây là các kỹ thuật *tạm thời* nhưng rất hiệu quả.

### 1. Sử dụng Explicit Waits thay vì Sleep()
Đây là lỗi phổ biến nhất của người mới làm Automation. Việc dùng `time.sleep(5)` chỉ đơn thuần là ra lệnh cho test dừng lại trong 5 giây, bất kể yếu tố nào đã sẵn sàng hay chưa. Điều này khiến bài test trở nên kém hiệu quả và vẫn có thể bị Flaky nếu thời gian chờ quá ngắn hoặc quá dài.

**Giải pháp:** Luôn sử dụng **Explicit Waits**. Test chỉ đợi đúng lúc cho đến khi một điều kiện *mong muốn* được thỏa mãn (ví dụ: phần tử xuất hiện, phần tử hiển thị khả năng click).

**Ví dụ Code (Giả định sử dụng thư viện Selenium/WebDriver):**
```python
# TRƯỚC KHI SỬA (BAD PRACTICE - Dễ gây Flaky nếu thời gian server thay đổi)
from time import sleep
sleep(3) # Dừng cứng 3 giây

# SAU KHI SỬA (GOOD PRACTICE - Sử dụng Explicit Wait)
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

try:
    wait = WebDriverWait(driver, 10) # Chờ tối đa 10 giây
    # Đợi cho đến khi phần tử có ID 'submitButton' hiển thị và có thể click được
    button = wait.until(EC.element_to_be_clickable((By.ID, "submitButton")))
    button.click()

except TimeoutException:
    print("Lỗi: Hết thời gian chờ cho nút submit.")
```

**Lời giải thích của Hoàng Hiệp:** Việc sử dụng `WebDriverWait` (hoặc các hàm tương đương trong Java/C#) giúp bài test đạt được tính **Determinism** cao hơn. Thay vì nói "Tôi đợi 3 giây", bạn đang nói: "Hãy đợi cho đến khi phần tử X xuất hiện, hoặc hết thời gian." Đây là sự khác biệt giữa chờ theo thời gian và chờ theo trạng thái.

### 2. Triển khai Retries có chiến lược
Nếu một test bất ngờ bị lỗi do các race conditions rất nhỏ (ví dụ: kết nối mạng chập chờn), việc cấu hình thử lại (Retry) trong framework kiểm thử là cần thiết.

**Cảnh báo quan trọng:** Tuyệt đối không bao giờ dùng Retry như là biện pháp *duy nhất*. Nó chỉ che giấu vấn đề, biến bug thành tính năng "thiếu ổn định" của bộ test. Hãy coi Retry là lưới an toàn cuối cùng, sau khi tất cả các nguyên nhân gốc rễ đã được loại trừ.

***

## III. Các chiến lược khắc phục (Systemic Fixes): Loại bỏ Nguyên nhân Gốc rễ

Với vai trò là QE Lead, trách nhiệm của chúng ta không phải là giấu đi lỗi Flaky bằng cách thêm `Retry` hay `Wait`, mà là phải *loại bỏ khả năng* xảy ra Flakiness ngay từ nguồn.

### 1. Cải thiện Test Isolation và State Management (Quan trọng nhất)
Flaky Tests thường xuất phát từ việc các test case phụ thuộc vào trạng thái của nhau (Shared State). Nếu Test A tạo ra dữ liệu, và Test B thất bại trong việc dọn dẹp/reset dữ liệu đó, thì khi chạy riêng lẻ, Test B sẽ bị Flaky.

**Giải pháp:**
*   **Setup/Teardown Rigorous:** Sử dụng cơ chế `@BeforeSuite` / `@AfterSuite`, `@BeforeMethod` / `@AfterMethod` để đảm bảo rằng mỗi bài test đều bắt đầu từ một trạng thái sạch (clean slate).
*   **Data Management:** Tuyệt đối không dùng chung tài khoản người dùng, dữ liệu sản phẩm, hoặc phiên giao dịch giữa các tests. Hãy sử dụng API để tạo/xóa (CRUD) tất cả dữ liệu cần thiết trong `setup` và đảm bảo xóa chúng trong `teardown`.

### 2. Xử lý Dependencies bằng Mocking và Service Virtualization
Nếu bài test của bạn phụ thuộc vào một microservice ngoài (ví dụ: Payment Gateway, Inventory API), bất kỳ sự cố nào từ dịch vụ này đều có thể gây ra Flakiness mà không liên quan gì đến tính năng đang kiểm thử.

**Giải pháp:** Thay vì gọi trực tiếp tới các dịch vụ ngoài trong quá trình test, hãy sử dụng **Mocking Frameworks** (như Mockito/Mockito-Kotlin) hoặc các công cụ **Service Virtualization** (như Wiremock).
*   Bạn lập trình để test chỉ tương tác với một môi trường giả lập (Mock Service) có thể được kiểm soát hoàn toàn.
*   Điều này đảm bảo rằng kết quả của API luôn cố định, bất kể trạng thái của service thực tế là gì.

### 3. Phân lớp và Tối ưu hóa Suite Tests
Một suite quá lớn sẽ bao gồm nhiều loại test với độ tin cậy khác nhau:

| Loại Test | Mục đích | Độ nhạy Flaky | Giải pháp tối ưu |
| :--- | :--- | :--- | :--- |
| **Smoke/Sanity Suite** | Kiểm tra các luồng chức năng cốt lõi. | Rất cao (Cần nhất định phải Pass). | Phải cực kỳ ổn định, Mocking nhiều nhất có thể. |
| **Functional Tests** | Kiểm tra nghiệp vụ chi tiết. | Trung bình. | Cần State Management rõ ràng, tách biệt dữ liệu. |
| **End-to-End (E2E)** | Mô phỏng hành trình người dùng toàn diện qua UI/API. | Thấp đến Trung bình. | Chỉ sử dụng khi thật sự cần thiết; nên ưu tiên kiểm thử API layer hơn. |

**Lời khuyên của tôi:** Nếu một tính năng có thể được test bằng cách gọi API trực tiếp (Backend Test), thì đừng bao giờ dùng E2E UI Test. E2E Test là lớp chịu trách nhiệm cao nhất về độ ổn định, và mọi điểm yếu ở đó sẽ làm toàn bộ hệ thống bị Flaky.

***

## IV. Chiến lược Quản trị Chất lượng (Governance) – Duy trì sự tin cậy

Một chiến lược chỉ thành công nếu nó được áp dụng liên tục bởi cả đội ngũ.

### 1. Phân loại và Báo cáo Sự cố Flakiness
Khi một test thất bại, hãy bắt buộc phải phân tích nguyên nhân:
*   **[BUG]:** Lỗi thực sự trong code nghiệp vụ (Production Bug). $\rightarrow$ Fix Code.
*   **[FLAKY]:** Test bị lỗi do timing/state management kém. $\rightarrow$ Fix Test Code.

Việc này giúp đội ngũ không nhầm lẫn giữa việc hệ thống đang hỏng và việc bộ test đang hỏng.

### 2. Tối ưu hóa tốc độ (Test Execution Speed)
Một suite càng chậm, khả năng nó bị Flaky càng cao vì cơ hội xảy ra race conditions qua mạng cũng lớn hơn. Hãy luôn tìm cách:
1.  Giảm số bước không cần thiết trong Test Case.
2.  Tăng tỷ lệ kiểm thử API so với UI (API is faster and more stable).

### 3. Xây dựng "Golden Rule": Determinism First
Mỗi bài test tự động phải là một hàm thuần túy về mặt ý niệm: **Đầu vào ($Input$) $\rightarrow$ Luôn luôn ra Đầu ra ($Output$)**. Bất kể khi nào và ở môi trường nào, nó cũng phải cho cùng kết quả. Nếu bạn không thể đạt được điều này, đó chưa phải là một bài kiểm thử tự động đáng tin cậy.

***

## Kết luận: Niềm tin vào Automated Testing

Flaky Tests không chỉ là vấn đề kỹ thuật; chúng là vấn đề về **niềm tin** (Confidence). Một hệ thống kiểm thử bị Flakiness sẽ làm xói mòn niềm tin đó, khiến đội ngũ phát triển trở nên thờ ơ với việc chạy test tự động.

Hãy nhớ rằng: Mục tiêu của Automation không phải là chỉ để ghi lại các lần thất bại, mà là để cung cấp một **bằng chứng vững chắc** (Concrete Evidence) rằng hệ thống hoạt động ổn định và đáng tin cậy. Bắt đầu bằng việc làm sạch codebase test suite của bạn, loại bỏ sự phụ thuộc vào thời gian, và tập trung vào nguyên lý **Test Isolation**.

Chúc các đồng nghiệp luôn xây dựng được những bộ kiểm thử tự động vững chắc, mang lại chất lượng tuyệt vời cho sản phẩm!