---
title: "Tối ưu hóa Performance Load Testing với Grafana k6 và SLA Thresholds"
date: 2026-07-13
description: "Hướng dẫn chuyên sâu cách kết hợp k6, Grafana và SLA Thresholds để nâng tầm kiểm thử hiệu năng, đảm bảo tính ổn định hệ thống ở mức vận hành thực tế nhất."
tags: ["Performance","k6","DevOps","SRE"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hùng Trần"
---

# Tối ưu hóa Performance Load Testing với Grafana k6 và SLA Thresholds

**Bài viết của Hùng Trần – QE Lead**

Trong bối cảnh các hệ thống ứng dụng ngày càng phức tạp và đòi hỏi trải nghiệm người dùng gần như tức thời, việc thực hiện một bài kiểm thử tải (Load Test) đơn thuần không còn đủ để đảm bảo chất lượng sản phẩm. Chúng ta cần vượt qua ngưỡng "có chạy được" để đạt tới trạng thái "chạy ổn định, có thể dự đoán hiệu suất và tuân thủ các cam kết dịch vụ".

Đây chính là lúc việc tích hợp một bộ công cụ mạnh mẽ gồm **k6**, **Grafana** và khái niệm **Service Level Agreement (SLA) Thresholds** trở nên tối quan trọng. Bài viết này sẽ đi sâu vào cách chúng ta xây dựng quy trình kiểm thử hiệu năng hiện đại, không chỉ dừng lại ở số lượng người dùng ảo mà còn tập trung vào *chất lượng trải nghiệm* dưới tải cao.

***

## I. Hiểu Rõ Về Khoảng Trống Hiện Tại (The Problem Gap)

Nhiều đội ngũ QA thường bị mắc kẹt ở quy trình kiểm thử hiệu năng truyền thống:
1. **Giả lập Tải:** Sử dụng công cụ X để gửi yêu cầu đến API A với 100 người dùng ảo.
2. **Thu thập Metrics Thô:** Nhận được báo cáo về TPS (Transactions Per Second) và thời gian phản hồi trung bình (Avg Latency).
3. **Báo Cáo Kết Quả:** So sánh các con số này với kỳ vọng thủ công.

Vấn đề ở đây là: Các báo cáo thô chỉ cho biết *cái gì đã xảy ra*, nhưng không giúp ta trả lời được câu hỏi quan trọng nhất của một Kỹ sư Chất lượng (QE) và SRE: **"Liệu hệ thống có đang đáp ứng các cam kết về trải nghiệm người dùng trong mọi điều kiện vận hành, hay nó sắp đổ vỡ?"**

Để giải quyết khoảng trống này, chúng ta cần một kiến trúc Observability hoàn chỉnh.

## II. Kiến Trúc Vàng: k6 + Prometheus $\rightarrow$ Grafana (The Stack)

Chúng ta sử dụng bộ ba công cụ này vì khả năng bổ sung và mức độ tự động hóa cao của chúng:

1. **k6:** Là công cụ load testing dựa trên JavaScript/Go, nổi tiếng về hiệu suất, dễ viết script và hỗ trợ các kịch bản phức tạp (scenarios).
2. **Prometheus:** Hệ thống thu thập metrics chuỗi thời gian (time-series database). Nó là nơi k6 sẽ *ghi* kết quả kiểm thử vào để được lưu trữ có cấu trúc.
3. **Grafana:** Là lớp trực quan hóa dữ liệu (Visualization Layer). Grafana đọc các metrics từ Prometheus và giúp chúng ta hiển thị, phân tích xu hướng, và — điều quan trọng nhất — thiết lập hệ thống cảnh báo dựa trên ngưỡng SLA.

### 🚀 Bước 1: Viết Script K6 Hiện Đại Hơn
Thay vì chỉ chạy một vòng lặp yêu cầu, k6 cho phép bạn định nghĩa các **kịch bản người dùng (scenarios)** phức tạp hơn, mô phỏng hành vi thực tế hơn rất nhiều.

**Ví dụ minh họa script `advanced_test.js`:**

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  // Định nghĩa kịch bản (Scenario) và tải trọng
  scenarios: {
    loginFlow: {
      executor: 'constant-vus', // Số người dùng ảo cố định
      exec: 'loginAndFetchData', 
      vus: 50, // 50 Virtual Users
      duration: '30s', // Chạy trong 30 giây
    },
    homepageLoad: {
        executor: 'constant-vus',
        exec: 'loadHomepage',
        vus: 10, // Một nhóm tải nhẹ hơn
        duration: '30s'
    }
  },
  // Định nghĩa các ngưỡng và check failure
  thresholds: {
    // Yêu cầu mức độ trễ P95 (95th percentile) cho API chính không được vượt quá 300ms.
    'http_req_duration{api="/api/data"}': ['p(95)<300'],
    // Tỷ lệ lỗi tổng thể phải dưới 1%
    'http_req_failed': ['rate<0.01']
  },
};

export default function loginAndFetchData() {
    const res = http.get('https://api.example.com/login');
    check(res, { 'Status is 200': (r) => r.status === 200 });

    // Mô phỏng người dùng đọc trang chủ sau khi login
    http.get('https://api.example.com/data'); 
    sleep(1); // Tạm dừng 1 giây mô phỏng hành vi chờ đợi
}

export function loadHomepage() {
    const res = http.get('https://api.example.com/');
    check(res, { 'Homepage status OK': (r) => r.status === 200 });
}
```

**Giải thích của Hùng Trần:**

1. **`scenarios`:** Đây là điểm đột phá lớn nhất. Thay vì chạy tất cả kịch bản cùng lúc theo một cách đơn lẻ, chúng ta nhóm các hành vi (Login Flow và Homepage Load) vào các *kịch bản* khác nhau với tải trọng riêng. Điều này phản ánh độ phức tạp của người dùng thực tế (một số người đang login trong khi một số khác chỉ xem trang chủ).
2. **`thresholds`:** Đây là nơi k6 tích hợp kiểm tra hiệu năng cơ bản nhất. Chúng ta ép buộc script phải tự giám sát các metrics quan trọng như độ trễ P95 và tỷ lệ lỗi ngay trong quá trình chạy load test. Nếu bất kỳ ngưỡng nào bị vi phạm, k6 sẽ báo fail *ngay lập tức*.

## III. Xác Định Và Tích Hợp SLA Thresholds (The Governance Layer)

Nếu `thresholds` của k6 là các cam kết kiểm thử cục bộ (local testing contract), thì **SLA Thresholds** là các cam kết vận hành kinh doanh (business operational commitment).

*   **SLA:** Là một thỏa thuận cấp độ dịch vụ, ví dụ: "99.9% yêu cầu phải được phản hồi trong vòng 2 giây."
*   **QE's Goal:** Đảm bảo rằng mọi bài load test thành công đều chứng minh khả năng đạt SLA đó dưới các điều kiện tải cao nhất.

Trong kiến trúc Grafana-Prometheus, chúng ta không chỉ *chạy* k6; chúng ta còn phải **khẳng định (validate)** xem kết quả chạy k6 có tuân thủ SLA hay không bằng một dashboard giám sát chuyên nghiệp.

**Quy trình thực hiện:**
1. **K6 $\rightarrow$ Prometheus:** Chạy k6, cấu hình output của nó ghi metrics vào Prometheus.
2. **Prometheus $\rightarrow$ Grafana:** Thiết lập Panel trong Grafana.
3. **Grafana Alerts (SLA enforcement):** Đây là bước then chốt. Thay vì chỉ vẽ biểu đồ, chúng ta thiết lập hệ thống cảnh báo dựa trên các ngưỡng SLA:

**Ví dụ về cấu hình Alert trong Grafana:**

| Metric Tên | Ngưỡng Vi Phạm (Threshold) | Hành động Cảnh báo | Ý nghĩa Kinh doanh |
| :--- | :--- | :--- | :--- |
| `http_req_duration{api="/checkout"}` | $> 1500ms$ (1.5s) | Alert Severity: CRITICAL | Việc thanh toán chậm hơn 1.5 giây, vi phạm SLA giao dịch. Cần dừng ngay việc triển khai. |
| `rate(http_requests{status=4xx}[5m])` | $> 0.02$ (2%) | Alert Severity: WARNING | Tỷ lệ lỗi Client Side quá cao trong 5 phút qua, hệ thống đang gặp vấn đề về API key/validation. |

**Giải thích của Hùng Trần:**

Sự khác biệt ở đây là tính chủ động. k6 giúp chúng ta *tạo ra* dữ liệu tải tối đa; Prometheus lưu trữ nó; và Grafana không chỉ *trình bày* mà còn **thực thi các quy tắc kinh doanh (business rules)** thông qua hệ thống cảnh báo. Nếu trong một bài kiểm thử diễn ra, bất kỳ metric nào vi phạm ngưỡng SLA đã định nghĩa, Grafana sẽ kích hoạt cờ đỏ, buộc đội ngũ vận hành phải dừng lại và điều tra ngay lập tức.

## IV. Tóm Lược Các Phương Pháp Tối Ưu Hóa (Best Practices)

Để quy trình Load Testing đạt mức tối ưu nhất theo tiêu chuẩn QE Lead, hãy lưu ý các điểm sau:

1. **Tăng Tính Thực tế của Kịch bản:** Luôn mô phỏng hành vi người dùng thay vì chỉ chạy vòng lặp yêu cầu cơ bản (`sleep()` và `check()`). Kết hợp nhiều luồng (flows) khác nhau trong cùng một kịch bản tải.
2. **Phân Tách Load Test Metrics:** Không nhồi nhét tất cả các metrics vào một dashboard. Hãy tạo các panel chuyên biệt: Panel 1 cho Độ trễ P95/P99; Panel 2 cho Throughput và CPU utilization của backend. Điều này giúp xác định chính xác *điểm nghẽn* (bottleneck).
3. **Tích hợp trong CI/CD Pipeline:** Load testing phải là một bước tự động hóa, chạy mỗi khi có commit lớn hoặc trước mỗi lần triển khai môi trường Staging. Sử dụng GitHub Actions/GitLab CI để gọi k6 và kiểm tra mã exit code của nó dựa trên ngưỡng SLA (ví dụ: nếu k6 thất bại vì vượt P95, pipeline phải bị fail).
4. **Monitoring vs Testing:** Hiểu rõ sự khác biệt. Load Testing là việc *ép* hệ thống đạt mức tải cao nhất để tìm điểm gãy. Monitoring là hành động *giám sát liên tục* hệ thống ở tải vận hành bình thường. Grafana cho phép chúng ta bắc cầu hai khái niệm này một cách hoàn hảo.

***

## Kết Luận

Việc tối ưu hóa Performance Load Testing không chỉ đơn thuần là việc chạy một công cụ mạnh hơn (như k6), mà là xây dựng một **văn hóa giám sát và kiểm soát chất lượng liên tục** (Continuous Quality Assurance).

Bằng cách kết hợp k6 để mô phỏng tải trọng phức tạp, Prometheus để thu thập dữ liệu đáng tin cậy, và Grafana để thực thi các cam kết SLA trong thời gian thực, đội ngũ của chúng ta sẽ không chỉ biết *hiệu năng hiện tại* mà còn có khả năng *dự đoán và ngăn chặn rủi ro hiệu năng* trước khi nó ảnh hưởng đến trải nghiệm khách hàng.

Chúc quý đồng nghiệp áp dụng thành công các kỹ thuật này để nâng tầm chất lượng sản phẩm!