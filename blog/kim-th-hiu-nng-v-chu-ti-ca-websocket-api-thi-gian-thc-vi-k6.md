---
title: "Kiểm thử hiệu năng và độ chịu tải của WebSocket API thời gian thực với k6"
date: 2026-02-22
description: "Hướng dẫn chuyên sâu về cách sử dụng k6 để kiểm tra khả năng mở rộng, độ trễ và hiệu suất của các ứng dụng WebSocket real-time."
tags: ["Performance","k6","WebSocket"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hoàng Hiệp"
---

# Kiểm thử hiệu năng và độ chịu tải của WebSocket API thời gian thực với k6

Chào các đồng nghiệp, tôi là Hoàng Hiệp – một Kỹ sư Đảm bảo Chất lượng chuyên về tối ưu hóa hệ thống hiệu suất.

Trong thế giới phát triển phần mềm hiện đại, các ứng dụng thời gian thực (real-time) như giao dịch tài chính, chat trực tuyến, hay bảng điều khiển IoT đang ngày càng phổ biến. Trái tim của những ứng dụng này chính là **WebSocket**. WebSocket mang lại khả năng giao tiếp hai chiều, song công và độ trễ cực thấp, vượt trội hơn hẳn so với kiến trúc HTTP request-response truyền thống.

Tuy nhiên, đi kèm với sự tiện lợi đó là một thách thức lớn mà các đội ngũ QA/QE thường gặp: Làm thế nào để kiểm tra xem WebSocket của chúng ta có thể chịu được hàng ngàn kết nối đồng thời và tải dữ liệu liên tục trong điều kiện stress cao?

Bài viết này sẽ là cẩm nang chuyên sâu, hướng dẫn bạn sử dụng công cụ **k6** – một framework kiểm thử hiệu năng hiện đại, mạnh mẽ để thực hiện việc kiểm thử hiệu năng và độ chịu tải (Load/Stress Testing) cho các WebSocket API.

---

## 💡 I. Tại sao cần kiểm thử hiệu năng cho WebSocket?

Việc thử nghiệm hiệu năng không chỉ đơn thuần là xem "hệ thống có sập không," mà nó còn đi sâu vào việc trả lời những câu hỏi cốt lõi sau:

1. **Khả năng mở rộng (Scalability):** Hệ thống có thể xử lý tăng trưởng số lượng kết nối từ $N$ người dùng lên $2N$, $5N$... hay không?
2. **Độ trễ dưới tải cao (Latency under Load):** Khi chịu áp lực 10,000 kết nối đồng thời và luồng dữ liệu liên tục, độ trễ của mỗi tin nhắn có tăng đột biến không?
3. **Tốc độ phục hồi (Resilience):** Nếu một phần tử nào đó bị lỗi hoặc mất kết nối, toàn bộ hệ thống có ổn định và nhanh chóng khôi phục hoạt động không?

Kiểm thử WebSocket khác biệt với HTTP vì nó liên quan đến việc duy trì trạng thái kết nối (connection state) và luồng dữ liệu hai chiều. Các vấn đề thường gặp bao gồm: **Resource Leakage** (rò rỉ tài nguyên), **Connection Throttling**, và **Throughput Bottleneck**.

## 🛠️ II. Tổng quan về k6 và WebSocket Testing

### a. Giới thiệu về k6
k6 là một công cụ kiểm thử hiệu năng mã nguồn mở, viết bằng Go, sử dụng JavaScript (ES6) để định nghĩa các bài test. Điểm mạnh lớn nhất của k6 là tốc độ thực thi vượt trội, mô phỏng tải rất sát với thế giới thực và dễ dàng tích hợp vào CI/CD pipeline.

Tuy nhiên, k6 mặc định được tối ưu hóa cho HTTP. Để xử lý WebSocket, chúng ta cần sử dụng **k6 Extension** hoặc các thư viện chuyên biệt (thường là `graphql-ws` hoặc cấu hình WebSocket Client) để mô phỏng quá trình nâng cấp giao thức kết nối (Upgrade).

### b. Quy trình kiểm thử cơ bản
1. **Thiết lập tài nguyên:** Đảm bảo k6 được cài đặt và bạn có endpoint WebSocket URL hợp lệ (`wss://...`).
2. **Kết nối & Xác thực:** Thiết lập logic để Client của k6 mở kết nối (handshake) và xác thực (ví dụ: gửi token Bearer).
3. **Giữ kết nối & Tải dữ liệu:** Giả lập các hành vi người dùng: lắng nghe tin nhắn, sau đó định kỳ hoặc ngẫu nhiên gửi tin nhắn ra.
4. **Đo lường:** Theo dõi metrics về TPS (Transactions Per Second), Latency và tỷ lệ lỗi kết nối/tin nhắn.

## 🚀 III. Code Example: Kiểm thử WebSocket với k6

Để kiểm tra một API giả lập phát tán dữ liệu giá cổ phiếu qua WebSocket, chúng ta sẽ sử dụng cú pháp JavaScript trong script của k6.

**Giả định:**
*   WebSocket Endpoint: `wss://api.tranggiadongsan.com/ws/prices`
*   Client phải gửi JSON payload `{ "action": "subscribe", "symbol": "BTCUSDT" }` để bắt đầu nhận dữ liệu.
*   Mục tiêu: Mô phỏng 100 người dùng duy trì kết nối và liên tục xử lý việc nhận data (thụ động) trong 5 phút.

### k6 Script (`websocket_test.js`)

```javascript
// --- Lấy các thư viện cần thiết từ k6/experimental/websocket ---
import { check } from 'k6';
import { websocket } from 'k6/experimental/websocket';
import { sleep, SharedArray } from 'k6';
import { Counter } from 'k6/metrics';

// Thiết lập biến toàn cục (Global Setup)
export const options = {
    vus: 100, // Số lượng Virtual Users (người dùng ảo)
    duration: '5m', // Thời gian chạy test: 5 phút
    protocols: {
        'mqtt': ['mqtt'], // Ví dụ nếu API sử dụng MQTT over WS
    },
};

// Khởi tạo công tơ đo lường metrics tùy chỉnh
const messagesReceived = new Counter('ws_messages_received');

/**
 * Hàm xử lý khi kết nối WebSocket được thiết lập.
 * Đây là nơi chúng ta thực hiện các bước "handshake" và đăng ký (subscribe).
 */
function onOpen() {
    console.log(`[${__VU}] Kết nối thành công với WebSocket.`);
    // Gửi tin nhắn subscription ban đầu để bắt đầu nhận dữ liệu.
    const initialSubscriptionPayload = JSON.stringify({ 
        action: "subscribe", 
        symbol: "BTCUSDT" 
    });
    websocket.send(initialSubscriptionPayload);

    // Thiết lập cơ chế lắng nghe sự kiện (event listener)
    websocket.on('message', function (data) {
        try {
            const payload = JSON.parse(data);
            // *** Đây là nơi bạn thực hiện logic kiểm thử nghiệp vụ (Business Logic Check) ***
            if (payload && payload.price !== undefined) {
                // Mô phỏng việc xử lý dữ liệu: Tăng công tơ đếm
                messagesReceived.add(1); 
                console.log(`[${__VU}] Nhận giá mới: ${payload.price}`);
            } else {
                 console.warn(`[${__VU}] Payload không hợp lệ nhận được.`);
            }
        } catch (e) {
            console.error(`Lỗi xử lý payload JSON: ${e.message}`);
        }
    });
}

/**
 * Hàm chính của k6 - Mô phỏng vòng đời người dùng.
 */
export default function () {
    const ws = new websocket("wss://api.tranggiadongsan.com/ws/prices");

    // 1. Kết nối và xử lý sự kiện mở
    ws.connect();
    onOpen(); // Kích hoạt logic đăng ký khi kết nối thành công

    // 2. Giữ kết nối và mô phỏng hành vi (Wait and Listen)
    // Người dùng ảo này sẽ chỉ lắng nghe dữ liệu trong 10 giây, sau đó lặp lại hoặc nghỉ.
    sleep(10); 
}
```

### Giải thích chuyên sâu của Hoàng Hiệp:

1. **`import { websocket } from 'k6/experimental/websocket';`**: Đây là phần quan trọng nhất. Nó cho phép k6 truy cập API dành riêng để xử lý giao thức WebSocket, vượt qua giới hạn chỉ test HTTP thông thường.
2. **`ws.connect()`**: Thao tác này mô phỏng hành vi người dùng khởi tạo kết nối tới Server.
3. **`websocket.on('message', function (data) { ... })`**: Đây là trái tim của bài test. Thay vì chỉ kiểm tra mã trạng thái HTTP 200 OK, chúng ta phải *lắng nghe sự kiện* (`event listener`) của tin nhắn đến (`'message'`). Bất cứ thứ gì được gửi qua `ws.send()` hay nhận qua hàm callback này đều là dữ liệu cần được xử lý và kiểm tra chất lượng.
4. **`messagesReceived = new Counter(...)`**: Việc sử dụng k6 metrics không chỉ giúp chúng ta biết *bao nhiêu* tin nhắn đã đến, mà còn cho phép tính toán các chỉ số quan trọng như Tỷ lệ Xử lý Tin nhắn (Message Processing Rate) theo thời gian chạy test.
5. **Mô phỏng hành vi chờ đợi (`sleep(10)`):** Trong môi trường thực tế, người dùng không liên tục gửi dữ liệu sau khi đăng ký. Việc sử dụng `sleep` giúp k6 mô phỏng sự duy trì kết nối và lắng nghe ổn định trong một khoảng thời gian nhất định.

## 📊 IV. Phân tích và Báo cáo Kết quả (Reporting)

Sau khi chạy test, việc phân tích các chỉ số là bước quyết định chất lượng của quy trình QE Lead. Các metrics quan trọng bạn cần theo dõi:

| Metric | Ý nghĩa | Tín hiệu Cảnh báo Đỏ (Red Flag) | Hành động khắc phục tiềm năng |
| :--- | :--- | :--- | :--- |
| **Latency** | Độ trễ trung bình từ khi dữ liệu được publish đến khi Client nhận được. | Latency tăng theo tỷ lệ nghịch với số lượng VUs ($\text{VUs} \uparrow, \text{Latency} \uparrow$). | Tối ưu hóa luồng mạng (Network path), cân nhắc kiến trúc message bus (Kafka). |
| **Throughput** | Tốc độ xử lý dữ liệu tối đa (messages/giây). | Throughput bão hòa sớm khi số lượng VUs tăng, hoặc giá trị Throughput thấp hơn kỳ vọng. | Điều chỉnh quy mô của service (Scaling out), kiểm tra khả năng xử lý I/O của backend. |
| **Error Rate** | Tỷ lệ kết nối bị gián đoạn hoặc tin nhắn nhận được là lỗi JSON. | Error rate > 1% liên tục. | Kiểm tra cơ chế tự động kết nối lại (Reconnection Logic) và cơ chế xác thực phiên (Session management). |
| **Resource Utilization (Host)** | CPU, Memory trên Server lúc chạy test. | RAM hoặc CPU đạt ngưỡng 90-100% và duy trì ở mức đó. | Tối ưu code backend, xem xét sử dụng ngôn ngữ/framework hiệu suất cao hơn. |

## ✨ V. Kết luận từ góc độ QE Lead (Lời khuyên thực tế)

Kiểm thử WebSocket API không phải là một lần chạy script và kết thúc. Nó cần được tích hợp vào chu trình kiểm thử liên tục (Continuous Testing).

1. **Phân lớp Test:** Hãy chia bài test thành nhiều tầng:
    *   **Smoke Test:** Kiểm tra 1 VU duy trì kết nối ổn định trong vài phút.
    *   **Load Test:** Tăng dần tải đến điểm mong muốn (ví dụ: $X$ số người dùng).
    *   **Stress Test:** Đẩy vượt quá giới hạn dự kiến để tìm ra điểm gãy (Breaking Point) của hệ thống.
2. **Tái hiện Hạn chế và Sự cố:** Không chỉ test trường hợp thành công. Hãy chủ động làm gián đoạn kết nối giữa chừng, mô phỏng việc mất mạng, hoặc gửi các payload không định dạng (malformed payloads) để kiểm tra tính chịu lỗi (Fault Tolerance).
3. **Theo dõi Context:** Khi viết script k6, luôn ghi chú rõ ràng về bối cảnh dữ liệu và hành vi người dùng (`// Hành động này mô phỏng...`). Điều đó giúp đội ngũ phát triển hiểu được *tại sao* bạn lại kiểm thử theo cách đó.

Hi vọng những phân tích chuyên sâu này sẽ giúp các đồng nghiệp của chúng ta tự tin hơn trong việc đảm bảo chất lượng cho các ứng dụng thời gian thực, xây dựng nên những hệ thống không chỉ hoạt động tốt mà còn cực kỳ bền bỉ trước mọi áp lực tải trọng!

**Hoàng Hiệp**
*QE Lead | Specializing in High-Performance Systems Testing*