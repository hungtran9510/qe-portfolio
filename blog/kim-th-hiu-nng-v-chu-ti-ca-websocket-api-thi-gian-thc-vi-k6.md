---
title: "Kiểm thử hiệu năng và độ chịu tải của WebSocket API thời gian thực với k6"
date: 2026-02-16
description: "Hướng dẫn chuyên sâu về việc mô phỏng tải trọng lớn, duy trì kết nối trạng thái (stateful) cho các ứng dụng WebSocket bằng công cụ k6."
tags: ["Performance","k6","WebSocket"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hoàng Hiệp"
---

# Kiểm thử hiệu năng và độ chịu tải của WebSocket API thời gian thực với k6

Xin chào các đồng nghiệp trong lĩnh vực QA. Tôi là Hoàng Hiệp, và hôm nay chúng ta sẽ đi sâu vào một chủ đề cực kỳ quan trọng và cũng gây nhiều thách thức khi kiểm thử: **Hiệu năng của các API WebSocket thời gian thực.**

Trong kỷ nguyên số hiện đại, các ứng dụng không còn chỉ giao tiếp theo mô hình Request-Response đơn thuần như REST. Các nền tảng thương mại điện tử với chat trực tuyến, hệ thống thị trường tài chính (trading), hay các dashboard giám sát trạng thái đều dựa trên khả năng giao tiếp liên tục, hai chiều và thời gian thực – đó chính là thế mạnh của WebSocket.

Tuy nhiên, việc kiểm thử hiệu năng cho WebSockets lại phức tạp hơn rất nhiều so với HTTP thông thường. Bài viết này sẽ cung cấp một hướng dẫn toàn diện và mang tính ứng dụng cao về cách sử dụng công cụ **k6** để mô phỏng tải trọng lớn và đo lường độ chịu tải của các API WebSocket một cách chính xác nhất.

***

## 🚀 Phần I: Vì sao việc kiểm thử WebSocket lại khó khăn?

Khi chúng ta nói đến "Load Testing" (Kiểm thử Tải), đa số mọi người đều nghĩ về số lượng yêu cầu (Requests) trên giây (RPS). Nhưng với WebSockets, vấn đề cốt lõi không phải là RPS, mà là **số lượng kết nối đồng thời** và khả năng duy trì trạng thái (Stateful Connection) của chúng.

### Thách thức kỹ thuật:

1. **Tính Trạng Thái (Statefulness):** Một kết nối WebSocket là một đường ống giao tiếp *mở* liên tục. Khi người dùng A tham gia, họ không chỉ gửi yêu cầu rồi rời đi; họ duy trì kết nối đó để chờ dữ liệu cập nhật từ server.
2. **Giả lập Kết nối:** Công cụ kiểm thử truyền thống thường tối ưu cho việc tạo ra các luồng request độc lập và ngắn ngủi. Ngược lại, chúng ta cần một công cụ có khả năng mô phỏng hàng nghìn *kết nối sống* (persistent connections) cùng lúc mà không bị rò rỉ tài nguyên hay mất ổn định.
3. **Đo lường Hiệu suất:** Chúng ta phải đo các chỉ số sâu hơn như:
    *   **Latency (Độ trễ):** Thời gian từ khi server gửi tin đến client nhận được, dưới tải cao nhất.
    *   **Connection Drop Rate:** Tỷ lệ kết nối bị ngắt đột ngột do quá tải hoặc lỗi tài nguyên của server/client.
    *   **Throughput:** Số lượng thông điệp (messages) mà hệ thống có thể xử lý và truyền đi trong một giây dưới điều kiện tải tối đa.

## 💡 Phần II: Tại sao nên chọn k6 cho WebSocket Load Test?

k6, với nền tảng JavaScript/Go, là lựa chọn tuyệt vời bởi vì nó được thiết kế để là một công cụ đo lường hiệu năng mạnh mẽ và hiện đại. Quan trọng nhất, cộng đồng của k6 đã tích hợp các thư viện hỗ trợ chuẩn WebSockets, cho phép chúng ta viết logic kiểm thử phức tạp ngay trong kịch bản (script).

Thay vì chỉ gửi HTTP request, chúng ta có thể mô phỏng toàn bộ vòng đời của một kết nối WebSocket: **Connect $\rightarrow$ Send Messages $\rightarrow$ Receive Messages $\rightarrow$ Keep Alive/Ping $\rightarrow$ Close.**

## 💻 Phần III: Hướng dẫn thực hành chi tiết với k6 (The Code Deep Dive)

Giả sử chúng ta có một endpoint WebSocket tại `wss://api.example.com/ws/live-updates`. Mục tiêu của bài test là mô phỏng 100 người dùng đồng thời, mỗi người liên tục gửi và nhận thông báo trong vòng 5 phút.

Dưới đây là cấu trúc kịch bản (script) mẫu mà tôi thường áp dụng:

### **WebSocket Performance Test Script (`websocket_test.js`)**

```javascript
import { WebSocket } from 'k6/x/websocket';
import { sleep, check } from 'k6';

// 1. Định nghĩa cấu hình tài nguyên và tải trọng
export const options = {
    vus: 100,         // Số lượng Virtual Users (người dùng ảo) đồng thời
    duration: '5m',   // Thời gian chạy test
    scenarios: {
        websocket_scenario: {
            executor: 'constant-vus' // Duy trì VUs ổn định
        }
    }
};

export default function () {
    const websocket = new WebSocket('wss://api.example.com/ws/live-updates');
    
    // 2. Xử lý sự kiện kết nối (Connection setup)
    websocket.on('open', () => {
        console.log(`[VU ${__VU}] Đã thiết lập kết nối thành công.`);
        
        // Gửi thông điệp chào mừng hoặc đăng ký phiên làm việc (Subscription message)
        const subscribeMessage = JSON.stringify({ action: "subscribe", topic: "price_updates" });
        websocket.send(subscribeMessage);

        // 3. Xử lý các sự kiện nhận dữ liệu từ Server (Data reception handling)
        websocket.on('message', (data) => {
            try {
                const payload = JSON.parse(data);
                console.log(`[VU ${__VU}] Nhận tin: ${payload.status} tại ${new Date().toISOString()}`);
            } catch (e) {
                console.error("Lỗi phân tích JSON:", e);
            }
        });

        // 4. Thiết lập Heartbeat/Keep-alive Ping (Quan trọng để duy trì kết nối)
        const keepAliveInterval = setInterval(() => {
             // Định kỳ gửi một tin nhắn ping nhỏ hoặc sử dụng tính năng WebSocket ping của server
             websocket.ping(); 
        }, 30 * 1000); // Ping mỗi 30 giây

    });

    // --- Vòng lặp hoạt động chính (Simulating continuous user activity) ---
    try {
        // Đợi cho đến khi kết nối mở thành công
        websocket.on('open', () => {}); 
        sleep(1); // Tạm dừng một chút để đảm bảo kịch bản chạy ổn định

        while (WebSocket.is('open') && WebSocket.isRunning()) {
            // Mô phỏng việc người dùng gửi yêu cầu hành động (ví dụ: yêu cầu cập nhật)
            const actionMessage = JSON.stringify({ action: "request_update", user_id: __VU });
            websocket.send(actionMessage);

            // Chờ và kiểm tra khả năng hoạt động của kết nối
            sleep(Math.random() * 2 + 1); // Khoảng thời gian chờ ngẫu nhiên (1-3 giây)

        }
    } finally {
        // 5. Dọn dẹp: Đóng kết nối khi test kết thúc hoặc gặp lỗi
        clearInterval(keepAliveInterval);
        websocket.close();
        console.log(`[VU ${__VU}] Kết nối đã đóng.`);
    }
}
```

### Giải thích chi tiết từ góc độ QE Lead (Hoàng Hiệp)

Để các bạn dễ hình dung, tôi xin đi qua ý nghĩa của từng khối code trong kịch bản trên:

#### 1. Khối `websocket = new WebSocket(...)` và Event Handlers (`on('open')`, `on('message')`)
*   **Mục đích:** Chúng ta không thể coi việc kết nối là một hành động tức thời. Kết nối WS có các sự kiện (events) riêng: `open`, `message`, `close`, v.v. Việc sử dụng `.on()` giúp kịch bản chờ đợi và phản ứng với trạng thái của API, mô phỏng chính xác cách client thực tế hoạt động.
*   **Kiểm tra chuyên sâu:** Khi kiểm thử tải, bạn cần theo dõi log console để đảm bảo rằng **tất cả 100 VUs đều báo `Đã thiết lập kết nối thành công`** trước khi bắt đầu ghi nhận hiệu suất chính thức.

#### 2. Việc Gửi Thông Điệp (`websocket.send(...)`)
*   Đây là phần quan trọng nhất mô phỏng *hoạt động* của người dùng. Thay vì chỉ để chờ, chúng ta buộc các VUs phải liên tục gửi dữ liệu (ví dụ: yêu cầu cập nhật giá, chat tin nhắn). Điều này giúp kiểm tra khả năng xử lý tải **Outgoing Load** (tải đi) và **Incoming Load** (tải đến) song song của server.
*   **Mẹo thực tế:** Luôn sử dụng `JSON.stringify()` khi gửi payload để đảm bảo cấu trúc dữ liệu đồng bộ giữa kịch bản test và logic nghiệp vụ.

#### 3. Heartbeat/Keep-Alive Ping (`setInterval` và `websocket.ping()`)
*   Đây là một chi tiết mà rất nhiều người bỏ qua, nhưng nó **cực kỳ quan trọng** trong kiểm thử độ chịu tải WS. Sau một khoảng thời gian dài không hoạt động (ví dụ: 30 phút), các thiết bị mạng trung gian (Load Balancers, Firewalls) có thể coi kết nối là "rác" và tự đóng nó.
*   Việc gửi Ping/Keep-alive liên tục giúp đảm bảo đường ống giao tiếp luôn được duy trì, mô phỏng trạng thái ổn định của ứng dụng thực tế.

#### 4. Khối `finally` (Resource Cleanup)
*   Trong môi trường kiểm thử chuyên nghiệp, việc dọn dẹp tài nguyên là bắt buộc. Khi kịch bản kết thúc hoặc bị lỗi, chúng ta phải đảm bảo rằng tất cả các khoảng thời gian (`setInterval`) được hủy bỏ và nhất thiết phải gọi `websocket.close()` để giải phóng kết nối, tránh tình trạng rò rỉ socket (socket leakage) trên server test.

## 📈 Phần IV: Phân tích Kết quả Kiểm thử Hiệu năng WebSocket

Sau khi chạy kịch bản với tải lớn (ví dụ: 100 VUs), bạn sẽ nhận được các metrics từ k6. Với vai trò QE Lead, tôi khuyên bạn phải chú ý các chỉ số sau:

| Metric | Ý nghĩa kỹ thuật | Ngưỡng cảnh báo (Warning Threshold) | Hành động khắc phục (Action Item) |
| :--- | :--- | :--- | :--- |
| **p(95) - Latency** | Độ trễ tại phân vị thứ 95% của toàn bộ thông điệp. Đây là thời gian phản hồi mà 95% người dùng trải qua. | $> 200ms$ (Với API chat/trading, nên $<100ms$) | Kiểm tra băng thông và tối ưu hóa luồng xử lý message trên Server Backend. |
| **Connection Drop Rate** | Tỷ lệ các kết nối bị ngắt ngoài ý muốn. | Bất kỳ giá trị nào $> 0\%$ là nguy hiểm. | Điều chỉnh cấu hình Keep-Alive/Heartbeat; Kiểm tra giới hạn tài nguyên (OS limits) của máy chủ. |
| **Throughput (Msg/sec)** | Số thông điệp tối đa hệ thống có thể xử lý liên tục. | Giảm đột ngột khi tăng VUs, cho thấy điểm nghẽn (bottleneck). | Phân tích khả năng mở rộng (Scalability) của database và dịch vụ xử lý tin nhắn trung gian (ví dụ: Redis Pub/Sub, Kafka). |
| **Resource Utilization** | CPU/Memory Usage trên Server. | Nếu tài nguyên đạt 80-90% ở mức tải mong muốn, bạn sẽ gặp sự suy giảm hiệu năng nghiêm trọng khi tăng thêm người dùng. | Xem xét việc mở rộng quy mô (Horizontal Scaling) hoặc tối ưu code ứng dụng gây tắc nghẽn bộ nhớ/CPU. |

## Kết luận

Kiểm thử WebSocket không chỉ đơn thuần là gửi gói tin; nó là một bài toán phức tạp về **quản lý trạng thái và tính ổn định của kết nối**. Bằng việc sử dụng k6 với các event handlers chuyên sâu, chúng ta có thể mô phỏng được sự phức tạp này và đưa ra những bằng chứng khoa học để xác nhận rằng API thời gian thực của mình đủ khả năng chịu tải cho hàng nghìn người dùng đồng thời.

Nếu bạn đã sẵn sàng vượt qua rào cản kiểm thử REST truyền thống, hãy bắt đầu với k6 và các kịch bản WebSocket như trên. Chúc các bạn thành công trong việc đảm bảo chất lượng hệ thống!