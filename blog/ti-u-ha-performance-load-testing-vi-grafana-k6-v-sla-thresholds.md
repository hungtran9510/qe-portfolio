---
title: "Tối ưu hóa Performance Load Testing với Grafana k6 và SLA Thresholds"
date: 2026-07-09
description: "Hướng dẫn chuyên sâu từ QE Lead Hùng Trần về việc sử dụng k6, Prometheus và Grafana để thiết lập các bài kiểm tra hiệu năng tự động, đảm bảo đạt chuẩn SLA."
tags: ["Performance","k6","DevOps","LoadTesting"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hùng Trần"
---

# Tối ưu hóa Performance Load Testing với Grafana k6 và SLA Thresholds

Chào các anh chị em kỹ sư chất lượng và DevOps, tôi là Hùng Trần. Trong hành trình xây dựng và vận hành các hệ thống phần mềm lớn, khâu đảm bảo hiệu năng (Performance Engineering) không còn là một hoạt động "nếu có thì tốt" mà đã trở thành yêu cầu *bắt buộc*.

Tuy nhiên, nhiều đội nhóm vẫn mắc sai lầm khi chỉ thực hiện Load Testing đơn thuần: chúng ta biết ứng dụng bị chậm, nhưng lại không thể định lượng được mức độ chậm trễ đó so với cam kết kinh doanh (Business SLO/SLA).

Bài viết này sẽ đi sâu vào một giải pháp hiện đại, cực kỳ hiệu quả để khắc phục vấn đề đó: **Tối ưu hóa Load Testing bằng k6 làm công cụ thực thi, Prometheus thu thập dữ liệu, và Grafana trực quan hóa cùng với việc thiết lập các SLA Thresholds rõ ràng.**

---

## I. Tại sao cần tối ưu hóa hơn là chỉ "chạy tải"? (The Pain Point)

Khi một sản phẩm được tung ra thị trường, khách hàng kỳ vọng nó phải hoạt động ổn định khi lượng người dùng tăng đột biến (ví dụ: dịp sale lớn).

Các bài kiểm tra hiệu năng cơ bản thường trả về các số liệu thô (raw data): *Tốc độ phản hồi trung bình là 800ms*. Đây là một thông tin, nhưng chưa đủ để ra quyết định.

**Câu hỏi thực tế của QE Lead không phải là:** *"Ứng dụng có chậm không?"*
**Mà là:** *"Khi tải đạt $N$ người dùng đồng thời, liệu 95% yêu cầu có trả về trong vòng dưới 300ms (theo cam kết SLA), và nếu không, hệ thống thất bại ở đâu?"*

Đây chính là lúc việc tích hợp các công cụ hiện đại và định nghĩa rõ ràng **Service Level Agreements (SLAs)** trở nên tối quan trọng.

## II. Bộ ba Công nghệ Hiện đại: k6 $\to$ Prometheus $\to$ Grafana

Để đạt được mục tiêu trên, chúng ta cần một kiến trúc hoàn chỉnh gồm ba thành phần chính, mỗi cái đảm nhận một vai trò riêng biệt nhưng bổ trợ nhau:

### 1. k6: Load Generation Engine (Công cụ tạo tải)
k6 là công cụ load testing mã nguồn mở mạnh mẽ của Grafana Labs. Nó viết bằng JavaScript (ES6), cho phép các kỹ sư QA dễ dàng nhúng logic nghiệp vụ phức tạp vào kịch bản kiểm thử, vượt trội hơn hẳn các công cụ truyền thống chỉ tập trung vào việc *gửi yêu cầu*.

### 2. Prometheus: Time-Series Database & Metric Collector
Prometheus là tiêu chuẩn vàng trong lĩnh vực giám sát hiệu năng hiện đại (Observability). Sau khi k6 chạy load test và thu thập các metrics (latency, throughput, error rate), chúng ta cấu hình để các chỉ số này được đẩy (push) hoặc cuộn vào (scrape) Prometheus.

### 3. Grafana: Visualization & Alerting (Trực quan hóa và Cảnh báo)
Grafana là giao diện người dùng giúp chúng ta đọc hiểu những con số khổng lồ từ Prometheus một cách trực quan nhất. Quan trọng hơn, nó cho phép chúng ta thiết lập các **Alerts** dựa trên việc vi phạm SLA đã định nghĩa.

## III. Đi sâu vào: Tích hợp SLAs Thresholds trong k6 (Phần cốt lõi)

Việc xác định SLA không nên chỉ là lời cam kết. Nó phải được đưa vào code và phải là một điều kiện PASS/FAIL tường minh của bài kiểm thử.

Trong k6, chúng ta sử dụng các hàm tích hợp sẵn để thực hiện việc này:

### 1. Định nghĩa Load Profile
Chúng ta xác định mô hình tải (load profile) - ví dụ: bắt đầu từ 5 vus (Virtual Users), tăng dần lên 20 vus trong 5 phút, và giữ ở mức cao nhất đó.

**Ví dụ về cấu trúc k6:**
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    vus: 10,             // Số người dùng ảo cố định (hoặc thay bằng rampUp)
    duration: '30s',     // Thời gian chạy test
    thresholds: {        // Đây là nơi chúng ta xác định SLA Metrics
        'http_req_failed': ['rate<0.01'], // Tỷ lệ lỗi phải dưới 1%
        'http_req_duration': ['p(95)<300'], // Quan trọng nhất: 95% yêu cầu phải hoàn thành trong vòng 300ms
        'vus_max': ['max<20']          // Giới hạn Vus tối đa (nếu muốn kiểm tra giới hạn tài nguyên)
    },
};

export default function () {
    http.get('https://api.example.com/checkout'); // API cần test
    sleep(1);
}
```

**Giải thích Chuyên sâu của Hùng Trần:**

*   **`options.thresholds`**: Đây là nơi các SLA được "viết cứng" (hardcoded) vào kịch bản kiểm thử. Khi k6 chạy xong, nó sẽ tự động đánh giá tất cả các chỉ số này. Nếu bất kỳ điều kiện nào vi phạm (ví dụ: `p(95)` là 400ms), toàn bộ bài test sẽ thất bại và báo lỗi, giúp đội QE của bạn nhận biết ngay lập tức rằng *về mặt hiệu năng*, hệ thống đã không đạt yêu cầu chấp nhận được.
*   **`http_req_duration: ['p(95)<300']`**: Đây là chỉ số quan trọng nhất về độ trễ (latency). Chúng ta hiếm khi quan tâm đến mức trung bình (Average), vì nó có thể bị các request siêu nhanh "kéo" xuống. Thay vào đó, chúng ta sử dụng **Percentile** (phân vị). `p(95)` nghĩa là 95% yêu cầu phải hoàn thành trong vòng 300ms. Đây là cách đo độ trễ mà người dùng thực tế sẽ cảm nhận được.

## IV. Thực tiễn Kết nối Grafana và Alerting

Sau khi k6 chạy test trên môi trường Staging/Pre-prod, nó sẽ đẩy metrics vào Prometheus. Việc tích hợp Grafana sẽ giúp chúng ta vượt qua bước "chạy xong - hết dữ liệu".

### 1. Dashboard Design Best Practices
Dashboard của bạn không chỉ nên hiển thị các con số mà còn phải có những **Visualizations** (biểu đồ) trực quan hóa việc vi phạm SLA:

*   **Graph 1:** Biến thiên độ trễ P95 qua thời gian (Time-series graph). Nếu đường này vượt lên ngưỡng 300ms, bạn biết hệ thống đang gặp áp lực.
*   **Graph 2:** Tỷ lệ lỗi theo mức tải (Error Rate vs. VU count). Giúp xác định điểm bão hòa (Saturation Point) của hệ thống.

### 2. Thiết lập Alerting trong Grafana
Thay vì chỉ nhìn vào biểu đồ, hãy để Grafana làm việc cho chúng ta bằng tính năng **Alerting**. Bạn thiết lập một rule:

> **IF** `rate(http_requests_total{endpoint="/checkout"}[5m]) / rate(http_requests_total[5m])` (Tỷ lệ lỗi) **IS GREATER THAN** `0.01` (1%) **FOR** 2 phút $\to$ **THEN TRIGGER ALERT.**

Điều này đảm bảo rằng ngay khi hệ thống đi chệch khỏi SLA trong môi trường thực, một cảnh báo sẽ được gửi tự động qua Slack/Email, giúp đội DevOps hành động khắc phục *trước khi* người dùng cuối nhận thấy sự cố.

## V. Tóm tắt Quy trình làm việc (Workflow Summary)

1.  **Định nghĩa Metrics & SLO:** QE và Product Owner ngồi lại cùng nhau xác định rõ ràng các SLA: Max latency cho P95, Error rate tối đa, Min throughput cần đạt được.
2.  **Viết k6 Script:** Nhúng các SLA này vào `options.thresholds` của k6 để đảm bảo tính tự động hóa Pass/Fail.
3.  **Execution & Capture:** Chạy k6 Load Test trên môi trường kiểm thử và thu thập metrics bằng Prometheus.
4.  **Visualize & Alert:** Sử dụng Grafana để vẽ dashboard tổng quan và thiết lập các cảnh báo (Alerts) dựa trên các ngưỡng SLA đã định nghĩa.

Việc áp dụng mô hình **k6 + Prometheus + Grafana + SLAs Thresholds** không chỉ giúp đội của bạn "kiểm tra xem hệ thống có chịu được tải" mà còn nâng cấp lên mức độ **"đảm bảo rằng hệ thống sẽ hoạt động đúng cam kết kinh doanh trong mọi điều kiện tải đã định."**

---
*Hy vọng những chia sẻ này sẽ cung cấp cho các anh chị em một lộ trình bài bản và chuyên nghiệp để tối ưu hóa khả năng đảm bảo chất lượng hiệu năng của sản phẩm. Hãy luôn nhớ: Hiệu năng tốt là bằng chứng không thể chối cãi.*

**Hùng Trần**
*(QE Lead | Performance Engineering Specialist)*