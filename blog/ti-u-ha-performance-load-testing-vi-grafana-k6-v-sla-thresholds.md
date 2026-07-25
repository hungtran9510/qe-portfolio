---
title: "Tối ưu hóa Performance Load Testing với Grafana k6 và SLA Thresholds"
date: 2026-07-13
description: "Nâng cao khả năng kiểm thử tải bằng cách tích hợp sức mạnh của k6, trực quan hóa dữ liệu trên Grafana, và thiết lập các ngưỡng Service Level Agreement (SLA) thực tế."
tags: ["Performance","k6","DevOps"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hùng Trần"
---

# Tối ưu hóa Performance Load Testing với Grafana k6 và SLA Thresholds

Chào các đồng nghiệp trong lĩnh vực QA/QE, tôi là Hùng Trần. Trong hành trình xây dựng sản phẩm chất lượng cao, chúng ta thường dành rất nhiều tâm huyết để kiểm tra chức năng (Functional Testing). Tuy nhiên, khi hệ thống của bạn bắt đầu phục vụ hàng trăm nghìn người dùng thực thụ, một lỗi về hiệu năng có thể gây ra thảm họa kinh doanh mà không hề ai ngờ tới.

Chỉ đo lường số lượng request hay thời gian phản hồi trung bình (Average Latency) là chưa đủ. Một QE Lead thực thụ phải chứng minh được rằng hệ thống *hoạt động ổn định* và *đáp ứng các yêu cầu nghiệp vụ ở mức độ chấp nhận được*, đó chính là lúc chúng ta cần phải tối ưu hóa Performance Load Testing bằng cách kết hợp sức mạnh của **k6**, trực quan hóa với **Grafana**, và xác định rõ ràng các **Service Level Agreement (SLA) Thresholds**.

Bài viết này sẽ đi sâu vào một kiến trúc kiểm thử hiện đại, thực tế và mang tính đo lường hiệu suất kinh doanh.

***

## I. Hiểu Vấn Đề: Tại sao Average Latency là một cái bẫy?

Trong Load Testing truyền thống, kết quả thường được báo cáo qua các số liệu đơn giản như TPS (Transactions Per Second), vUsers (Virtual Users), và độ trễ trung bình.

**Nhưng hãy hình dung thế này:**
Giả sử bạn kiểm tra chức năng Checkout với 100 người dùng, và hệ thống trả về $300ms$. Bạn ghi nhận "Pass". Tuy nhiên, nếu trong đó có 5% yêu cầu bị chậm đến $8$ giây (do kết nối database tắc nghẽn cục bộ), trải nghiệm người dùng thực tế của bạn sẽ là thất bại thảm hại.

**Mục tiêu của chúng ta không phải chỉ là đo tốc độ (Speed), mà là đo chất lượng trải nghiệm ở quy mô lớn và theo góc nhìn nghiệp vụ.**

Đây chính là lúc việc áp dụng SLA Thresholds vào quá trình kiểm thử tải trở nên tối quan trọng. SLA buộc chúng ta phải đặt ra các ranh giới hiệu suất: *Phần trăm nào* yêu cầu phải hoàn thành trong *khoảng thời gian bao nhiêu*. (Ví dụ: 95% request Checkout phải dưới $300ms$).

## II. Bộ Công Cụ Hiện Đại: k6 và Grafana

Chúng ta cần một công cụ Load Testing mạnh mẽ, dễ lập trình và khả năng hiển thị dữ liệu vượt trội.

### 🚀 1. k6 – Sức mạnh của JavaScript (Dễ viết & Hiệu suất cao)

**k6** là một công cụ load testing hiện đại được viết bằng Go nhưng sử dụng kịch bản (scripting) bằng JavaScript. Nó nổi tiếng vì hiệu suất cực kỳ tốt và cú pháp gần gũi với lập trình viên frontend, giúp các QE có thể nhanh chóng chuyển đổi từ việc viết Unit Test sang Load Test mà không gặp rào cản ngôn ngữ lớn.

### 📊 2. Grafana – Trực quan hóa & Báo động (Monitoring Dashboard)

**Grafana** là nền tảng giám sát và trực quan hóa dữ liệu số một hiện nay. Khi k6 chạy xong, nó sẽ xuất ra hàng loạt metrics (thông qua Prometheus hoặc InfluxDB). Chúng ta cần Grafana để biến các file log thô thành dashboard trực quan, dễ dàng theo dõi xu hướng Performance theo thời gian thực, từ đó xác định điểm nghẽn (bottleneck) ngay lập tức.

## III. Kỹ Thuật Trọng Tâm: Tích hợp SLA Assertions vào k6 Script

Điểm khác biệt lớn nhất của quy trình này là việc tích hợp các **Assertion Checks** (các kiểm tra khẳng định) trực tiếp trong kịch bản k6, thay vì chỉ dựa vào ngưỡng trung bình thuần túy.

Hãy xem qua một đoạn mã ví dụ về cách chúng ta xác định độ trễ cho hành động mua hàng quan trọng:

```javascript
// Ví dụ k6 script (checkout_test.js)
import http from 'k6/http';
import { check, sleep } from 'k6';

export default function () {
    const payload = JSON.stringify({
        product_id: "P123",
        quantity: 1
    });

    // Bước 1: Request API Add to Cart
    const resCart = http.post('https://api.example.com/cart', payload, {
        headers: { 'Content-Type': 'application/json' }
    });
    
    // Tích hợp Assertion Check cho độ trễ và trạng thái HTTP
    check(resCart, {
        'Status 201 OK': (r) => r.status === 201,
        'Response time < 400ms': (r) => r.timings.response < 400, // THIẾT LẬP SLA CHO TRẢ VỀ
        'Body contains confirmation message': (r) => r.body.includes('added successfully')
    });

    sleep(1);
}

export const options = {
    vus: 50,       // Số lượng người dùng ảo
    duration: '2m', // Thời gian chạy test
    thresholds: {  // THIẾT LẬP SLA TRONG CONFIG FILE k6
        'http.status == 200': ['rate>0.99'], // Tối thiểu 99% yêu cầu phải thành công
        'checks{expected_value:"Response time < 400ms"}': ['rate>0.95'] // Tối thiểu 95% check này phải pass
    }
};
```

### Giải thích của Hùng Trần:

1. **`k6/http` và `check()`:** Thay vì chỉ gọi request, chúng ta bọc kết quả bằng hàm `check()`. Điều này cho phép ta tạo ra các *kiểm tra hiệu suất* (performance checks) trực tiếp tại điểm mã nguồn.
2. **`'Response time < 400ms'`:** Đây là cú pháp của việc thiết lập SLA cục bộ. Chúng ta không chỉ kiểm tra status code, mà còn giới hạn thời gian phản hồi tối đa ($T_{max}$).
3. **`export const options = { thresholds: {...} }`:** Phần này là nơi định nghĩa các ngưỡng hiệu suất tổng thể cho toàn bộ bài kiểm tra. Ta buộc hệ thống phải đạt được 95% tỷ lệ thành công của check độ trễ đó. Nếu không đạt, k6 sẽ báo Failure ngay lập tức.

## IV. Kiến Trúc Giám Sát Hoàn Hảo: Grafana Dashboard & SLA Alerting

Sau khi chạy test bằng k6, chúng ta cần một nơi để xem xét các vấn đề phức tạp hơn là chỉ đọc log. Đó là vai trò của Grafana.

Chúng ta cấu hình Grafana kết nối với nguồn dữ liệu (ví dụ: Prometheus) nơi k6 đã đẩy các metrics theo thời gian thực. Thay vì tạo ra nhiều biểu đồ riêng lẻ, chúng ta sẽ thiết lập một Dashboard tập trung vào 3 loại métrics quan trọng nhất liên quan đến SLA:

### 1. Service Level Indicators (SLI) - Chỉ báo mức dịch vụ

Thay vì chỉ hiển thị `Latency P95` (Percentile thứ 95), chúng ta tạo ra các **Gauge panels** để so sánh giá trị thực tế với ngưỡng chấp nhận được.

*   **Biểu đồ:** Latency P95 (ms)
*   **Ngưỡng SLA:** $300ms$
*   **Tín hiệu cảnh báo:** Khi đường cong vượt quá vạch đỏ ($300ms$), hệ thống đã vi phạm SLA.

### 2. Success Rate Dashboard - Tỷ lệ thành công theo thời gian

Chúng ta phải vẽ biểu đồ tỷ lệ requests thỏa mãn điều kiện (ví dụ: Status code = 200 **VÀ** Latency < $400ms$). Nếu chỉ xem tổng throughput, chúng ta sẽ bỏ qua việc xác định nhóm request bị chậm.

### 3. Alerting (Cơ chế Cảnh báo)

Đây là phần quan trọng nhất. Thay vì đợi người dùng ngồi vào dashboard để thấy vấn đề, Grafana cho phép ta thiết lập **Alert Rules**.

**Luật cảnh báo mẫu:**
> *Trigger:* Nếu `Rate of Failed Checkout Requests` > $5\%$ trong vòng 5 phút $\rightarrow$ **Cảnh báo PagerDuty / Slack.**

Bằng cách này, Performance Testing không chỉ là một bài kiểm tra *đơn lẻ* mà nó trở thành một phần của quy trình CI/CD Pipeline liên tục. Khi Load Test thất bại vì vi phạm SLA, pipeline sẽ tự động dừng lại và thông báo cho đội Dev cần fix ngay lập tức, trước khi sản phẩm đến tay người dùng.

## V. Tóm Lược Các Thực Hành Tốt Nhất (Best Practices)

| Nguyên tắc | Mô tả | Lý do QE phải làm |
| :--- | :--- | :--- |
| **Quantify SLA** | Không chấp nhận "Nhanh hơn là được". Phải định nghĩa rõ: $95\%$ requests phải dưới $300ms$. | Biến yêu cầu nghiệp vụ mơ hồ thành các giá trị kỹ thuật đo lường được. |
| **Shift Left Testing** | Tích hợp k6 và các kiểm tra hiệu năng vào giai đoạn CI/CD sớm nhất có thể. | Giảm chi phí sửa lỗi: Phát hiện sớm, khắc phục ít tốn kém hơn nhiều lần so với phát hiện sau khi triển khai (Production). |
| **Dùng Percentiles** | Không chỉ dựa vào Average (Trung bình). Phải theo dõi P95 và P99. | Độ trễ trung bình che giấu những yêu cầu cực kỳ tệ (The outliers). P95/P99 phản ánh trải nghiệm của nhóm người dùng chậm nhất. |
| **Modular Scripting** | Tách kịch bản load test thành các module chức năng độc lập. | Giúp dễ bảo trì, tái sử dụng và cô lập lỗi performance giữa các tính năng khác nhau. |

***

## Kết Luận

Việc tối ưu hóa Performance Load Testing không chỉ là việc chạy một script với số lượng người dùng lớn. Nó là một sự chuyển đổi tư duy từ **"Chúng ta có thể xử lý bao nhiêu request?"** sang **"Chúng ta đảm bảo trải nghiệm của khách hàng luôn ở mức độ SLA nào, ngay cả khi chúng ta tăng gấp đôi lưu lượng truy cập?"**

Bằng việc sử dụng k6 để định nghĩa các kiểm tra hiệu năng nghiêm ngặt (Assertions) và Grafana để theo dõi sự tuân thủ SLA này trong thời gian thực, đội ngũ QE của bạn sẽ không chỉ là người thử nghiệm mà còn là những kỹ sư đảm bảo trải nghiệm người dùng toàn diện.

Chúc quý đồng nghiệp luôn thành công với những hệ thống chất lượng cao!

---
*Hùng Trần - Quality Engineering Lead*