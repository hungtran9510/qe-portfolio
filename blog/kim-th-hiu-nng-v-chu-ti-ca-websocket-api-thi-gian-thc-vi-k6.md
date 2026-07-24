---
title: "Kiểm thử hiệu năng và độ chịu tải của WebSocket API thời gian thực với k6"
date: 2026-02-19
description: "Học cách kiểm tra khả năng mở rộng và độ ổn định của các API WebSocket tốc độ cao bằng công cụ k6, đảm bảo trải nghiệm người dùng liền mạch."
tags: ["Performance","k6","WebSocket"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hoàng Hiệp"
---

# Kiểm thử hiệu năng và độ chịu tải của WebSocket API thời gian thực với k6

Chào các đồng nghiệp QA và Kỹ sư Phần mềm, tôi là Hoàng Hiệp.

Trong bối cảnh kỹ thuật số ngày nay, các ứng dụng đòi hỏi tính *thời gian thực* (real-time) như chat app, thị trường tài chính, hay hệ thống IoT đang trở nên cực kỳ phổ biến. WebSocket APIs là xương sống của các kiến trúc này, cung cấp kết nối hai chiều, toàn phần (full-duplex).

Tuy nhiên, nếu chúng ta chỉ kiểm thử REST API truyền thống, chúng ta sẽ bỏ qua một khía cạnh quan trọng nhất: **Sự ổn định và khả năng chịu tải dưới hàng nghìn kết nối duy trì cùng lúc.**

Bài viết này không chỉ là hướng dẫn cú pháp; đây là góc nhìn của một QE Lead về việc làm thế nào để kiểm thử hiệu suất WebSocket API một cách toàn diện, thực tế và chuyên nghiệp nhất bằng công cụ *k6* mạnh mẽ.

---

## 🚀 I. Tại sao cần k6 cho WebSocket Performance Testing?

### 1. Hạn chế của các phương pháp truyền thống
Nhiều người mới tiếp cận việc kiểm thử hiệu năng thường chỉ tập trung vào thông số HTTP (request/response). Nhưng với WebSocket, chúng ta đang deal với một **kết nối vật lý** duy trì liên tục (persistent connection), chứ không phải là luồng yêu cầu đóng mở.

Nếu áp dụng các công cụ truyền tải tải tiêu chuẩn bằng cách giả lập việc gửi và nhận dữ liệu sau mỗi X mili giây mà không mô phỏng đúng cơ chế *handshake* và quản lý vòng đời kết nối, kết quả kiểm thử sẽ vô cùng sai lệch.

### 2. Sức mạnh của k6
k6 là một công cụ viết bằng Go (và có API scripting bằng JavaScript) được thiết kế cho hiệu năng cao, đặc biệt trong việc tạo ra các tải trọng phức tạp và sát thực tế. Đối với WebSocket, k6 cho phép chúng ta:

*   **Mô phỏng Life Cycle:** Mô phỏng toàn bộ vòng đời của kết nối: Kết nối ($\rightarrow$ Open $\rightarrow$ Send Data $\rightarrow$ Receive Data $\rightarrow$ Keep-Alive/Heartbeat $\rightarrow$ Close).
*   **Kiểm soát Tải Lớn (Massive Concurrency):** Khả năng tạo ra hàng chục ngàn *concurrent users* với bộ nhớ và CPU tiêu thụ rất thấp.
*   **Scripting linh hoạt:** Sử dụng JavaScript, chúng ta có toàn quyền kiểm soát các thao tác gửi/nhận dữ liệu nhị phân hoặc JSON theo kịch bản phức tạp (ví dụ: giả lập người dùng ngắt kết nối đột ngột).

---

## 🛠️ II. Thiết lập Môi trường và Công cụ

Để thực hiện bài kiểm thử này, bạn cần những thứ sau:

1. **k6:** Cài đặt qua npm hoặc binary.
2. **WebSocket Endpoint:** Một API WebSocket được thiết kế để chịu tải (ví dụ: `wss://api.example.com/ws`).
3. **Kỹ năng JavaScript/TypeScript:** Để viết kịch bản kiểm thử trong k6.

### 💡 Kiến thức cốt lõi: Xử lý kết nối WebSockets bằng k6

Khác với HTTP request đơn thuần, việc test WebSocket yêu cầu chúng ta sử dụng thư viện WebSocket client có sẵn hoặc được bọc (wrap) lại trong môi trường JavaScript của k6.

Trong các phiên bản mới và các ví dụ nâng cao, ta cần triển khai logic kết nối và duy trì luồng dữ liệu bên trong hàm `default` (hoặc một vòng lặp dài).

---

## 🧪 III. Kịch bản Code Thực tế: Kết nối & Truyền tải Tải

Dưới đây là đoạn code mẫu mà tôi đã tối ưu hóa để mô phỏng kịch bản **Người dùng kết nối và duy trì việc trao đổi tin nhắn theo chu kỳ**.

*(Lưu ý: Để chạy ví dụ này, bạn cần một module WebSocket client tương thích với môi trường JS/k6. Tôi sẽ giả định cách triển khai logic chuẩn)*

```javascript
// websocket_loadtest.js

import { check, sleep } from 'k6';
import { WebSocketClient } from './websocket-client'; // Giả định thư viện client
import { Counter } from 'k6/metrics';

export const options = {
    vus: 100,       // Số lượng Virtual Users (Người dùng ảo)
    duration: '30s', // Thời gian chạy test
    scenarios: {
        websocket_stress: {
            executor: 'shared-token' // Sử dụng token để đảm bảo mỗi user có kết nối độc lập
        }
    },
    // Thiết lập các ngưỡng kiểm tra hiệu suất (Thresholds)
    thresholds: {
        'ws_successful_connections': ['count>0'], // Phải có ít nhất 1 kết nối thành công
        'p(websocket.latency):<500ms': ['rate>0'] // Tỷ lệ latency < 500ms phải > 0
    }
};

// Khởi tạo metrics (thống kê)
const ws_successful_connections = new Counter('ws_successful_connections');

export default function () {
    // Thiết lập thông tin kết nối
    const WS_URL = 'wss://your-realtime-api.com/ws';
    const client = new WebSocketClient(WS_URL); 

    let ws;
    try {
        // BƯỚC 1: Kết nối (Handshake)
        console.log(`[${__VU}] Attempting to connect to ${WS_URL}...`);
        ws = client.connect();

        // Chờ cho đến khi kết nối được thiết lập thành công (Blocking operation)
        if (!ws.isConnected()) { 
            check('WebSocket connection established', () => ws.isConnected());
            return; // Dừng script nếu không thể connect
        }
        ws_successful_connections.add(1);

        // BƯỚC 2: Gửi tin nhắn ban đầu (Initial Message)
        const initialMsg = JSON.stringify({ action: 'subscribe', topic: 'global' });
        ws.send(initialMsg);
        console.log(`[${__VU}] Connected and subscribed.`);

        // BƯỚC 3: Vòng lặp duy trì và giao tiếp (Stress Loop)
        let round = 0;
        while (round < 20 && ws.isConnected()) { // Giới hạn vòng lặp để tránh treo test
            sleep(Math.random() * 1); // Nghỉ ngẫu nhiên giữa các hành động

            // A. Kiểm tra sự kiện nhận dữ liệu (Receiving data)
            let receivedData = ws.receiveMessage();
            if (receivedData) {
                console.log(`[${__VU}] Received data: ${JSON.parse(receivedData).event}`);
                // Tại đây, ta có thể thêm logic xử lý dữ liệu nhận được vào metrics 
            }

            // B. Gửi tin nhắn Heartbeat hoặc Action định kỳ (Sending data)
            const heartbeatMsg = JSON.stringify({ action: 'keepalive', timestamp: Date.now() });
            ws.send(heartbeatMsg);

            round++;
        }

    } catch (e) {
        // Xử lý lỗi kết nối hoặc lỗi giao tiếp khác
        console.error(`[${__VU}] Test Failed: ${e.message}`);
    } finally {
        // BƯỚC 4: Dọn dẹp tài nguyên (Cleanup)
        if (ws && ws.isConnected()) {
            console.log(`[${__VU}] Closing connection.`);
            ws.close(); // Đóng kết nối một cách sạch sẽ
        }
    }
}

```

### Phân tích Chi tiết của Hoàng Hiệp

Tôi xin phép giải thích qua các đoạn code quan trọng trong kịch bản trên:

1.  **`options` và `thresholds`:** Đây là trái tim của mọi bài kiểm thử hiệu năng. Việc đặt ngưỡng (Threshold) giúp chúng ta biết khi nào hệ thống thất bại về mặt kỹ thuật hoặc kinh doanh (ví dụ: độ trễ trung bình không được vượt quá 500ms, hay tỷ lệ kết nối thành công phải đạt 99%).
2.  **`shared-token` executor:** Đây là một *trick* quan trọng khi test WebSocket. Nó đảm bảo rằng k6 quản lý việc khởi tạo và dọn dẹp tài nguyên (như phiên WebSocket) ở cấp độ tài nguyên, giúp mỗi Virtual User nhận được một kết nối độc lập và sạch sẽ.
3.  **Vòng lặp `while` & `ws.send()`:** Đây là phần mô phỏng *lưu lượng giao tiếp* liên tục. Việc gửi message định kỳ (keep-alive) không chỉ để giữ kết nối sống mà còn giúp đo khả năng xử lý tải nền của server.
4.  **Phần `finally` Block:** **Đây là điểm cực kỳ quan trọng về mặt QE.** Bất kể test thành công hay thất bại, chúng ta phải đảm bảo rằng lệnh `ws.close()` được gọi để giải phóng tài nguyên mạng (sockets) trên cả client lẫn server. Nếu bỏ qua bước này, nó sẽ gây ra rò rỉ bộ nhớ và kết nối (connection leaks).

---

## 💡 IV. Các Điểm Nhấn Chuyên Sâu cho QE Lead

Là một chuyên gia QE, tôi không chỉ dừng lại ở việc chạy script; chúng ta phải hiểu cách *đọc* và *tối ưu hóa* các metrics thu được.

### 1. Phân biệt Connection Stress vs. Data Throughput
Khi test WebSocket, bạn cần xác định rõ mục tiêu:
*   **Goal A (Connection Stress):** Test khả năng duy trì hàng chục nghìn kết nối cùng một lúc (Capacity). Metrics quan trọng: `Total Connections`, `Time to Establish Connection`.
*   **Goal B (Data Throughput Stress):** Test tốc độ xử lý và truyền tải dữ liệu (Scalability/Rate Limit). Tăng tần suất gửi/nhận tin nhắn trong vòng lặp, đo metrics `Messages Per Second` trên Server Side.

### 2. Kiểm thử Thất bại (Negative Testing)
Một hệ thống thực tế luôn bị lỗi. Hãy thêm các kịch bản sau:
*   **Network Flap:** Mô phỏng việc mất kết nối đột ngột và khả năng *tự phục hồi* (auto-reconnect) của API WebSocket (Exponential Backoff).
*   **Payload Malformation:** Gửi dữ liệu không hợp lệ hoặc quá lớn để kiểm tra cơ chế xử lý lỗi của server.

### 3. Phân tích Metrics Nâng cao
Sau khi chạy test, đừng chỉ nhìn vào `avg` latency. Hãy xem xét:
*   **P95/P99 Latency:** Độ trễ cho 95% và 99% người dùng cuối cùng (Đây là giá trị bạn nên báo cáo). Nếu P99 cao hơn nhiều so với P50, hệ thống của bạn đang có những *bottleneck* tiềm ẩn.
*   **CPU/Memory Usage:** Theo dõi tài nguyên server đi kèm với k6 để xác định điểm bão hòa (saturation point) chính xác.

---

## 🎯 V. Tổng kết: Tư duy QE cho Hệ thống Real-time

Kiểm thử hiệu năng WebSocket API không phải là chạy một công cụ, mà là việc **xây dựng một mô hình giao tiếp người dùng tối ưu** và đo lường khả năng hệ thống của bạn chịu đựng sự phức tạp đó như thế nào.

Hãy luôn nhớ rằng: Performance Test trên WebSockets là bài test về ***quản lý tài nguyên kết nối*** và ***khả năng duy trì luồng dữ liệu ổn định***, chứ không chỉ đơn thuần là kiểm tra độ phản hồi HTTP.

Hy vọng những chia sẻ này sẽ giúp các bạn tự tin xây dựng kịch bản kiểm thử hiệu năng WebSockets chuyên sâu và đạt được sự yên tâm tuyệt đối về chất lượng sản phẩm của mình.

Chúc các bạn thành công trong hành trình tìm kiếm sự hoàn hảo kỹ thuật!

**Hoàng Hiệp**
*QE Lead & Software Quality Advocate*