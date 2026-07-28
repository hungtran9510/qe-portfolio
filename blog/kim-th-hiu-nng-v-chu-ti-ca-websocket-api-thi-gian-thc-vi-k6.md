---
title: "Kiểm thử hiệu năng và độ chịu tải của WebSocket API thời gian thực với k6"
date: 2026-02-23
description: "Hướng dẫn chuyên sâu cách sử dụng k6 để mô phỏng tải lớn, kiểm tra khả năng mở rộng (scalability) và phát hiện điểm nghẽn trên các WebSocket API theo thời gian thực."
tags: ["Performance","k6","WebSocket"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hoàng Hiệp"
---

# Kiểm thử hiệu năng và độ chịu tải của WebSocket API thời gian thực với k6

Chào các đồng nghiệp QA/QE, tôi là Hoàng Hiệp. Trong thế giới phát triển ứng dụng hiện đại, giao tiếp thời gian thực (real-time communication) không còn là một tính năng cao cấp mà đã trở thành yêu cầu cơ bản của mọi sản phẩm, từ dashboard theo dõi trạng thái thị trường tài chính đến các trò chơi trực tuyến hay hệ thống thông báo tức thời.

WebSocket API chính là xương sống cho những giao tiếp này. Tuy nhiên, cùng với sự phổ biến của nó, một thách thức lớn đã xuất hiện: **Làm thế nào để kiểm thử hiệu năng và độ chịu tải (Load Testing & Stress Testing) cho các kết nối WebSocket?**

Khác biệt hoàn toàn so với mô hình HTTP request-response tiêu chuẩn (với mỗi yêu cầu là một phiên giao tiếp độc lập), WebSocket là một *protocol trạng thái* (stateful protocol). Kết nối được duy trì liên tục, và việc kiểm thử phải mô phỏng được **sự bền bỉ** của các kết nối này dưới tải lớn.

Nếu bạn đang gặp khó khăn trong việc đo lường khả năng mở rộng (scalability) hay phát hiện điểm tắc nghẽn (bottleneck) khi API hoạt động với hàng ngàn người dùng đồng thời, bài viết này sẽ là kim chỉ nam thực tiễn dành cho bạn. Chúng ta sẽ cùng nhau sử dụng k6 – công cụ kiểm thử hiệu năng tiên tiến – để giải quyết vấn đề này.

***

## 🧪 Tại sao WebSocket Testing lại phức tạp hơn HTTP?

Trước khi đi vào kỹ thuật, chúng ta cần nắm rõ bản chất của việc kiểm thử WS:

1. **Tính Trạng Thái (Statefulness):** Một kết nối WebSocket không chỉ là một yêu cầu và phản hồi; nó là một kênh liên lạc *mở*. Điều này có nghĩa là các phiên test phải duy trì trạng thái ổn định, từ khâu thiết lập (handshake), giữ kết nối sống (keep-alive messages) cho đến khi nhận dữ liệu.
2. **Tải Bền Vững (Sustained Load):** Tải không chỉ đo bằng số lượng yêu cầu (Requests Per Second - RPS), mà còn bằng khả năng duy trì *sự tồn tại* của hàng nghìn kết nối đồng thời và tốc độ truyền tải thông điệp liên tục theo thời gian.
3. **Tính Bất Đồng Bộ (Asynchronicity):** Các luồng dữ liệu thường được đẩy (push) từ máy chủ, không phải lúc nào cũng đợi client yêu cầu (pull).

## 🛠️ Tại sao lại là k6?

Tôi chọn k6 vì nó đáp ứng hoàn hảo các tiêu chí cần thiết cho việc kiểm thử WebSocket:

*   **Ngôn ngữ JavaScript:** Dễ dàng tích hợp logic xử lý luồng dữ liệu phức tạp và thao tác với asynchronous operations.
*   **Hiệu suất cao (Written in Go):** Mặc dù viết bằng JS, k6 lại chạy trên nền tảng cực kỳ hiệu quả của Go, cho phép nó mô phỏng hàng chục nghìn người dùng ảo (virtual users - VU) mà vẫn giữ được độ ổn định và tốc độ.
*   **Hỗ trợ WebSocket:** k6 cung cấp module tích hợp (`k6/experimental/ws`) chuyên biệt để xử lý các kết nối WebSocket một cách mạnh mẽ, vượt qua giới hạn của việc chỉ mô phỏng HTTP request đơn thuần.

***

## 💻 Hướng dẫn thực hành: Triển khai Test Case WebSocket với k6

Để kiểm thử hiệu năng WS API, chúng ta không thể dùng cấu trúc test HTTP thông thường được. Chúng ta phải sử dụng các hàm bất đồng bộ (asynchronous) để quản lý việc kết nối và trao đổi dữ liệu.

Dưới đây là một ví dụ minh họa chi tiết về cách bạn sẽ xây dựng file `ws_loadtest.js`. Giả sử API WebSocket của bạn chạy tại endpoint `wss://api.example.com/chat`.

```javascript
// ws_loadtest.js
import { sleep, check } from 'k6';
import { WebSocket } from './websocket_helper'; // Tách logic WS sang hàm riêng để dễ đọc

// ==============================================
// 1. CONFIGURATION (Thiết lập kịch bản)
// ==============================================
export const options = {
    vus: 50,             // Số lượng người dùng ảo (Concurrent connections)
    duration: '2m',      // Thời gian chạy test (2 phút)
    thresholds: {        // Ngưỡng chất lượng cần đạt được
        'ws_messages_sent': ['rate>10'], // Tốc độ gửi tin nhắn tối thiểu 10 msg/sec
        'http_checks': ['rate>=0.9']   // Đảm bảo ít nhất 90% yêu cầu kiểm tra thành công
    },
};

// ==============================================
// 2. SCENARIO (Luồng test chính)
// ==============================================
export default function () {
    const websocketClient = new WebSocket('wss://api.example.com/chat');
    let sendCount = 0;

    // Bước A: Thiết lập kết nối và xử lý sự kiện nhận dữ liệu
    websocketClient.onmessage = (event) => {
        console.log(`[Received message] From Server: ${event.data}`);
    };

    // Bắt đầu quá trình mở kết nối (Handshake)
    if (!websocketClient.isConnected()) {
         websocketClient.connect(); 
    } else {
        check(websocketClient.isOpen(), { 'WS connection status': (status) => status === true });
    }


    // Bước B: Mô phỏng hành vi người dùng - Gửi tin nhắn định kỳ
    try {
        const messageToSend = `User_${__VU}_${sendCount++}: Xin chào, đây là test load ${Math.floor(Math.random() * 100)}`;
        websocketClient.send(JSON.stringify({ type: 'MESSAGE', payload: messageToSend }));
    } catch (e) {
        // Bắt lỗi nếu kết nối bị đóng đột ngột trong quá trình chạy
    }

    // Giữ nhịp độ test và chờ phản hồi từ server
    sleep(Math.random() * 0.5 + 0.2); // Chờ ngẫu nhiên giữa 0.2s và 0.7s

    console.log(`[V${__VU}] Hoàn thành vòng lặp. Tổng tin đã gửi: ${sendCount}`);
}
```

### Giải thích chi tiết code của Hoàng Hiệp:

Trong vai trò QE Lead, tôi phải giải thích rõ từng khối lệnh để mọi người hiểu cơ chế hoạt động phía sau nó:

1.  **`import { WebSocket } from './websocket_helper';`**: Chúng ta nên *tách logic kết nối WS* ra khỏi hàm `default()` chính (trong file helper) để giúp code sạch sẽ, dễ tái sử dụng và tối ưu hóa việc quản lý tài nguyên (resource management).
2.  **`websocketClient.onmessage = (...) => {...}`:** Đây là phần xử lý **phản hồi của máy chủ**. Khi server đẩy dữ liệu đến client, hàm này sẽ được kích hoạt. Trong môi trường test, chúng ta sử dụng nó để *xác minh* rằng API không chỉ gửi tin mà còn gửi đúng định dạng JSON và nội dung theo kỳ vọng.
3.  **`websocketClient.connect()`:** Hàm này mô phỏng việc User làm thao tác kết nối (thực hiện HTTP Handshake Upgrade). Việc kiểm tra trạng thái (`!websocketClient.isConnected()`) giúp đảm bảo tài nguyên chỉ được mở khi cần thiết.
4.  **`websocketClient.send(...)`:** Đây là lệnh cốt lõi của quá trình tạo tải (load generation). Chúng ta mô phỏng việc người dùng liên tục gửi tin nhắn/dữ liệu lên API.
5.  **`sleep(Math.random() * 0.5 + 0.2)`:** Thay vì sử dụng `sleep(1)`, một khoảng chờ ngẫu nhiên giúp kịch bản test của bạn tự nhiên hơn, mô phỏng hành vi người dùng thực tế (không phải robot gửi tin nhắn theo nhịp đập đồng hồ).
6.  **`thresholds`:** Đây là phần quan trọng nhất của QE Lead. Chúng ta không chỉ chạy test mà còn *đặt ra tiêu chuẩn*. Ví dụ: `rate>10` yêu cầu tốc độ gửi tin nhắn trung bình phải lớn hơn 10 messages/giây, nếu không đạt thì kịch bản coi như thất bại.

***

## ✨ Phân tích kết quả và các Tips chuyên sâu (From a QE Lead Perspective)

Sau khi chạy test với tải từ 50 VU lên đến 500 VU, việc phân tích chỉ số là bước quyết định chất lượng của bạn:

### 1. Các chỉ số cần theo dõi trên Grafana/Prometheus
*   **Latency P95/P99:** Thời gian mà 95% và 99% các tin nhắn được gửi đi/nhận về phải hoàn thành. Nếu P99 tăng đột biến khi tải tăng, đó là dấu hiệu cảnh báo nghiêm trọng về điểm nghẽn tài nguyên (ví dụ: hàng đợi I/O của server bị quá tải).
*   **Connection Count:** Số lượng kết nối *duy trì ổn định*. Nếu số lượng này không thể đạt đến mức mong muốn, có thể do giới hạn tài nguyên hệ điều hành (OS limits) hoặc cấu hình firewall.
*   **Error Rate (Protocol Level):** Theo dõi các mã lỗi WebSocket cụ thể như `CloseFrame` với lý do bất ngờ (`1005 - Abnormal Closure`). Điều này cho thấy server không xử lý được tình trạng kết nối gián đoạn một cách sạch sẽ.

### 2. Tối ưu hóa kịch bản kiểm thử
*   **Scenario Chức năng (Functional Flow):** Đừng chỉ tập trung vào việc spam tin nhắn. Hãy thiết kế các luồng test phức tạp hơn, ví dụ: `Connect -> Subscribe(Topic A) -> Send Message A -> Wait for Confirmation B -> Subscribe(Topic C)`. Điều này kiểm tra cả logic nghiệp vụ của API, chứ không chỉ là khả năng truyền tải thô.
*   **Tăng cường độ gián đoạn (Emulate Jitter):** Sử dụng `Math.random()` trong các hàm chờ hoặc dữ liệu payload để mô phỏng sự biến động và ngẫu nhiên của người dùng thực tế.

### 3. Lời khuyên về mặt kiến trúc hệ thống
Nếu test k6 cho thấy hiệu năng giảm nghiêm trọng (ví dụ: ở mức 200 VU trở lên), nguyên nhân có thể không nằm ở k6, mà là tại:

*   **Tầng Broker/Message Queue:** Nếu bạn sử dụng Kafka hay RabbitMQ làm lớp trung gian, hãy kiểm tra khả năng throughput của lớp này.
*   **Kết nối DB (Database Connection Pooling):** Khi server xử lý một tin nhắn WS, nó thường phải lưu vào DB. Hãy đảm bảo rằng Database không phải là điểm nghẽn do quản lý kết nối quá kém.

***

## 📝 Kết luận

Kiểm thử hiệu năng WebSocket API với k6 không chỉ là việc viết code load test; đó là một nghệ thuật mô phỏng hành vi người dùng trong điều kiện khắc nghiệt nhất, đồng thời đòi hỏi sự hiểu biết sâu sắc về cả giao thức truyền tải (WebSocket) và kiến trúc hệ thống phía backend.

Tôi hy vọng bài viết này đã cung cấp cho bạn cái nhìn chuyên sâu và thực tiễn để xây dựng một bộ kịch bản kiểm thử WebSocket mạnh mẽ, giúp đội ngũ sản phẩm của bạn tự tin đưa các tính năng thời gian thực đến với thị trường mà không lo lắng về hiệu suất!

Chúc mọi người thành công với các dự án kiểm thử của mình.
*Hoàng Hiệp - QE Lead.*