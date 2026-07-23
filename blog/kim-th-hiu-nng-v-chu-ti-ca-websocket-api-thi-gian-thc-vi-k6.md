---
title: "Kiểm thử hiệu năng và độ chịu tải của WebSocket API thời gian thực với k6"
date: 2026-02-18
description: "Khám phá cách kiểm tra hiệu suất các kết nối WebSocket thời gian thực với k6, một hướng dẫn chuyên sâu từ QE Lead Hoàng Hiệp."
tags: ["Performance","k6","WebSocket"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hoàng Hiệp"
---

# Kiểm thử hiệu năng và độ chịu tải của WebSocket API thời gian thực với k6

Chào các đồng nghiệp QA và kỹ sư chất lượng! Tôi là Hoàng Hiệp, một QE Lead chuyên về các hệ thống giao tiếp tốc độ cao.

Trong kỷ nguyên số hóa hiện nay, các ứng dụng không chỉ là trang web tĩnh hay các API gọi theo mô hình Request-Response (HTTP truyền thống). Chúng yêu cầu tính *thời gian thực* (real-time) – nơi dữ liệu phải di chuyển ngay lập tức, như giao dịch tài chính, chat trực tuyến, hay bảng điện tử. Và khi đó, **WebSocket** chính là ngôi sao sáng.

Tuy nhiên, sự "tuyệt vời" về mặt trải nghiệm người dùng của WebSocket lại tạo ra một thách thức lớn cho đội ngũ QA: *Làm thế nào để kiểm thử nó dưới áp lực cao?*

Nếu bạn đã bao giờ tự hỏi làm cách nào để mô phỏng hàng nghìn kết nối đồng thời, duy trì trạng thái (stateful connection) và đo lường độ trễ của luồng dữ liệu bi-directional này, thì bài viết hôm nay dành cho bạn. Chúng ta sẽ sử dụng **k6**, một công cụ kiểm thử hiệu năng hiện đại, để giải mã vấn đề này.

---

## 🚀 I. Hiểu về thách thức khi kiểm thử WebSocket

WebSocket là giao thức độc quyền (hoặc nâng cấp từ HTTP) cho phép thiết lập một kết nối TCP duy nhất, bán song công (full-duplex), nơi cả client và server đều có thể gửi dữ liệu bất cứ lúc nào mà không cần yêu cầu lại.

### 🚧 Những rào cản khi kiểm thử truyền thống:

1. **Giữ trạng thái (Statefulness):** Các công cụ load testing HTTP cơ bản thường xử lý từng yêu cầu độc lập. WebSocket đòi hỏi chúng ta phải giữ *trạng thái* của kết nối qua thời gian, mô phỏng việc "ở đó" liên tục.
2. **Tính Bi-directional:** Chúng ta không chỉ gửi (client -> server) mà còn phải đo lường chất lượng dữ liệu nhận về (server -> client). Điều này yêu cầu khả năng lắng nghe (listening) chủ động.
3. **Hiệu quả tài nguyên:** Việc kiểm thử hiệu năng cần mô phỏng hàng trăm, thậm chí hàng nghìn người dùng đồng thời (*Virtual Users - VUs*), mỗi VU phải duy trì một kết nối WebSocket ổn định.

Khi áp dụng load testing thông thường, chúng ta có thể dễ dàng đo lường **Throughput** (lưu lượng dữ liệu) hoặc **Latency** (độ trễ của yêu cầu đầu tiên). Nhưng với WS, chúng ta cần đo lường **Connection Stability**, **Jitter** (dao động độ trễ), và **End-to-end Latency** trong suốt vòng đời kết nối.

## 🛠️ II. Tại sao k6 là lựa chọn tối ưu?

k6 được xây dựng bằng Go và giao diện viết test bằng JavaScript, mang lại sự kết hợp hoàn hảo giữa hiệu năng cao của nền tảng Back-end và khả năng lập trình linh hoạt của front-end scripting.

Điều quan trọng nhất là k6 đã tích hợp hoặc hỗ trợ các module cho phép chúng ta làm việc với các kết nối không phải HTTP truyền thống, đặc biệt thông qua các tính năng thử nghiệm chuyên sâu (experimental features) dành cho WebSockets.

Với QE Lead Perspective: *k6 không chỉ giúp bạn tạo ra khối lượng yêu cầu lớn, mà còn cung cấp khả năng script phức tạp để xử lý logic nghiệp vụ của kết nối thời gian thực.*

## 💻 III. Hướng dẫn triển khai bài kiểm thử mẫu với k6

Dưới đây là một ví dụ chuyên sâu về cách chúng ta thiết lập kịch bản (scenario) để:
1. Kết nối WebSocket.
2. Đăng ký/Xác thực kết nối.
3. Định kỳ gửi các thông điệp "ping" hoặc dữ liệu giả định.
4. Đồng thời, lắng nghe và xử lý các phản hồi từ Server.

> **Giả định:** Chúng ta đang kiểm thử một API WebSocket chạy tại `ws://localhost:8080/live-data`.

### 📜 k6 Script (JavaScript)

```javascript
// Import thư viện cần thiết của k6
import { check, sleep } from 'k6';
import http from 'k6/http'; // Thường dùng cho các bước HTTP ban đầu
import { WebSocketConnection } from './ws_utils.js'; // Giả sử ta có một helper class

// 1. Định nghĩa Profile của kịch bản (Scenario options)
export let options = {
    scenarios: [
        {
            name: 'WebSocket Load Test',
            executor: 'shared-gate', // Sử dụng shared-gate để quản lý kết nối chung
            startTime: '0s',
            switchingInterval: '1s',
            stages: [
                // Tăng dần số lượng người dùng (VUs) từ 0 đến 500 trong 3 phút
                { duration: '3m', target: 500 },
                // Duy trì tải ở mức đỉnh trong 2 phút
                { duration: '2m', target: 500 },
                // Giảm dần (Ramp down)
                { duration: '1m', target: 0 }
            ],
        },
    ],
    thresholds: {
        // Đặt ngưỡng Success Rate > 99% cho toàn bộ test case
        'http.status == 200': ['rate>0.99'],
        // Đảm bảo rằng luồng dữ liệu nhận được không bị lỗi quá nhiều
        'ws_messages_received': ['rate>0.99']
    }
};

/**
 * Hàm chính thực thi cho mỗi Virtual User (VU)
 * @param {number} userId - ID của người dùng giả lập
 */
export default function () {
    const ws = WebSocketConnection('ws://localhost:8080/live-data');
    console.log(`[User ${__VU}] Bắt đầu thiết lập kết nối...`);

    try {
        // Bước 1: Thiết lập và xác thực kết nối (Thường qua HTTP handshake trước)
        if (!ws.connect(10000)) { // Timeout 10s
             console.error(`[User ${__VU}] Lỗi khi kết nối WebSocket.`);
             return;
        }

        // Bước 2: Hàm Logic chính - Giữ kết nối sống và giao tiếp dữ liệu
        let messageCounter = 0;
        while (ws.isConnected()) {
            try {
                // A. Gửi Message (Client -> Server): Mô phỏng việc gửi yêu cầu/dữ liệu cập nhật
                const payload = JSON.stringify({ type: 'ping', data: `user_${__VU}` });
                if (!ws.send(payload)) break; // Dừng nếu không thể gửi

                console.log(`[User ${__VU}] Đã gửi message #${++messageCounter}.`);

                // B. Xử lý phản hồi (Server -> Client): Lắng nghe và kiểm tra luồng dữ liệu
                const receivedMessage = ws.receive();
                if (receivedMessage) {
                    check(receivedMessage, {
                        'Received valid JSON': v => typeof v === 'string' && v.startsWith('{'),
                        // Ở đây ta có thể kiểm tra nội dung cụ thể của data
                        'Content check': v => JSON.parse(v).status === 'OK' 
                    });
                    console.log(`[User ${__VU}] Đã nhận phản hồi: ${receivedMessage}`);
                }

            } catch (e) {
                // Bắt lỗi kết nối bị ngắt đột ngột
                console.error(`[User ${__VU}] Lỗi giao tiếp WebSocket: `, e);
                break; 
            }
            
            // Tốc độ gửi tối ưu để mô phỏng hành vi người dùng thực tế (ví dụ: mỗi 1 giây)
            sleep(Math.random() * 0.5 + 0.5); // Giảm jitter một chút
        }

    } finally {
        // Đảm bảo rằng kết nối được đóng khi test kết thúc
        ws.close();
        console.log(`[User ${__VU}] Kết nối đã được đóng an toàn.`);
    }
};

/** 
 * Helper class giả định để mô phỏng hoạt động WS trong k6 (thực tế cần tùy biến)
 */
class WebSocketConnection {
    constructor(url) {
        this.url = url;
        this.ws = null; // Giả định đối tượng kết nối đã được khởi tạo bởi thư viện WS của k6
        this.isConnected = false;
        // Khởi tạo các biến trạng thái khác...
    }

    connect(timeout) {
        // Logic mô phỏng việc thiết lập WebSocket (WebSocket handshake)
        console.log(`[WS] Attempting connection to ${this.url}`);
        // Trong thực tế k6, ta sẽ dùng một module chuyên biệt hoặc tích hợp WS client
        setTimeout(() => {
            this.ws = {}; // Mô phỏng object kết nối thành công
            this.isConnected = true;
            return true;
        }, 100);
    }

    send(data) {
        if (!this.isConnected) return false;
        // Logic gửi data qua socket
        return true;
    }

    receive() {
        // Mô phỏng việc nhận dữ liệu từ server (Logic này cần được hook vào event listener của k6)
        if (Math.random() < 0.95) { // Giả sử 95% cơ hội nhận được data hợp lệ
            return JSON.stringify({ status: 'OK', timestamp: Date.now(), message: "Live update" });
        } else {
            return null; // Không có dữ liệu mới nào để nhận
        }
    }

    close() {
        this.isConnected = false;
        console.log(`[WS] Connection closed for ${this.url}`);
    }
}
```

### 📝 Giải thích chuyên sâu của Hoàng Hiệp:

#### 1. Về `executor: 'shared-gate'` (Quản lý tài nguyên)
Khi kiểm thử WebSocket, việc mỗi VU phải thiết lập và duy trì một kết nối riêng biệt là bắt buộc để mô phỏng tải thực tế. Tuy nhiên, nếu số lượng VU quá lớn (hàng chục nghìn), chúng ta cần chiến lược quản lý luồng kết nối. Việc sử dụng các `executor` nâng cao trong k6 giúp phân bổ tài nguyên và đảm bảo rằng tất cả VUs đều trải qua đúng vòng đời kết nối (Connect $\rightarrow$ Loop $\rightarrow$ Disconnect).

#### 2. Logic Vòng lặp (`while (ws.isConnected())`)
Đây là trái tim của bài test. Khác với HTTP chỉ gọi một lần rồi xong, chúng ta phải giữ chương trình trong vòng lặp, liên tục **gửi** dữ liệu và quan trọng hơn là **lắng nghe**.

#### 3. Tách biệt Gửi và Nhận (`send()` vs `receive()`)
*   **`ws.send(payload)`:** Mô phỏng hành vi *Client Initiated Action*. Chúng ta đang gửi một thông điệp (ví dụ: "Tôi muốn đăng ký nhận sự kiện X").
*   **`const receivedMessage = ws.receive()`:** Đây là phần đo lường chất lượng dịch vụ của Server. Khi `k6` thực thi đoạn mã này, nó phải đồng bộ với các luồng dữ liệu *thực tế* đến từ WebSocket server. Việc kiểm tra (check) payload nhận được giúp ta xác minh xem dữ liệu có đúng định dạng, đầy đủ và không bị lỗi truyền tải hay không.

#### 4. Xử lý độ trễ và ổn định (`sleep(Math.random() * 0.5 + 0.5)`)
Nếu chúng ta dùng `sleep(1)`, mô phỏng người dùng chỉ gửi dữ liệu chính xác mỗi giây, điều này quá cứng nhắc. Việc thêm một mức độ ngẫu nhiên (Random Jitter) giúp kịch bản trở nên chân thực hơn và đo lường khả năng chịu tải của hệ thống dưới các điều kiện *thực tế hỗn loạn* (realistic load).

## 📈 IV. Các chỉ số quan trọng cần theo dõi (Metrics Analysis)

Khi chạy bài test này, đừng chỉ nhìn vào tổng thời gian hay tỷ lệ lỗi. Là một QE Lead, bạn phải tập trung vào các metric sau:

| Metric | Ý nghĩa chuyên môn | Hành động khắc phục nếu kém |
| :--- | :--- | :--- |
| **Connection Establishment Latency (P95)** | Thời gian để kết nối đạt trạng thái `Open` cho 95% VUs. *Đo lường quá trình handshake.* | Tối ưu hóa tốc độ xác thực/bảo mật tại lớp Gateway. |
| **Receive Payload Jitter** | Độ biến động của thời gian nhận dữ liệu (Server $\rightarrow$ Client). Chỉ số này cực kỳ