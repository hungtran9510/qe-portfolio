---
title: "Kiểm thử hiệu năng và độ chịu tải của WebSocket API thời gian thực với k6"
date: 2026-02-19
description: "Hướng dẫn chuyên sâu cách sử dụng k6 để mô phỏng tải lớn, kiểm tra khả năng mở rộng và tối ưu hóa các ứng dụng giao tiếp WebSocket theo thời gian thực."
tags: ["Performance","k6","WebSocket"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hoàng Hiệp"
---

# Kiểm thử hiệu năng và độ chịu tải của WebSocket API thời gian thực với k6

Xin chào các đồng nghiệp! Tôi là Hoàng Hiệp, chuyên gia Kỹ thuật Đảm bảo Chất lượng Phần mềm.

Trong kiến trúc microservices hiện đại, việc xây dựng các ứng dụng giao tiếp thời gian thực (Real-time Communication) thông qua WebSocket đã trở thành tiêu chuẩn. Từ các hệ thống chat, bảng điều khiển theo dõi sự kiện trực tiếp (live dashboards), cho đến thị trường tài chính—tất cả đều dựa vào khả năng kết nối hai chiều và độ trễ cực thấp của WebSocket.

Tuy nhiên, "hiệu suất tốt" chỉ là lời nói suông nếu chúng ta không kiểm chứng bằng số liệu thực tế. Khi traffic tăng đột biến, những điểm nghẽn (bottlenecks) có thể xuất hiện ở lớp kết nối TCP/IP, bộ đệm mạng (network buffers), hoặc thậm chí là logic xử lý của server backend.

Bài viết này sẽ đi sâu vào một chủ đề nâng cao nhưng vô cùng thiết yếu: **Kiểm thử hiệu năng và độ chịu tải của WebSocket API thời gian thực bằng công cụ k6.** Chúng ta không chỉ dừng lại ở việc xem request có thành công hay không, mà còn phải biết hệ thống của mình "sụp đổ" ở đâu, và tại sao.

---

## 🚀 I. Tại sao cần kiểm thử hiệu năng cho WebSocket?

Nhiều kỹ sư mới bắt đầu thường chỉ nghĩ đến việc kiểm tra kết nối (Connection testing). Nhưng việc này là chưa đủ. Khi một ứng dụng chat có hàng nghìn người dùng cùng truy cập và gửi tin nhắn liên tục, chúng ta phải đo lường những khía cạnh sau:

1. **Khả năng mở rộng (Scalability):** Server của bạn xử lý được bao nhiêu kết nối đồng thời (Concurrent Connections)?
2. **Độ trễ dưới tải lớn (Latency under load):** Khi số lượng người dùng tăng lên, độ trễ trung bình (average latency) và p95/p99 có tăng đáng kể không?
3. **Xử lý sự kiện Burst:** Hệ thống có bị quá tải khi nhận một luồng dữ liệu đột ngột lớn (ví dụ: hàng trăm thông báo cùng lúc) hay không?
4. **Tài nguyên tiêu thụ (Resource Consumption):** CPU, bộ nhớ và băng thông mạng của server phản ứng thế nào dưới áp lực tối đa?

Nếu bỏ qua việc này, bạn có nguy cơ triển khai một tính năng "hoàn hảo" trên môi trường Dev/Staging, nhưng lại sập ngay khi ra mắt phiên bản Production.

## ⚙️ II. Tổng quan về k6 và WebSocket Testing

**k6** là công cụ kiểm thử hiệu năng mã nguồn mở, được viết bằng Go và sử dụng ngôn ngữ JavaScript để viết kịch bản (scripting). Điểm mạnh của k6 là khả năng mô phỏng tải rất thực tế và việc tích hợp sâu vào các metric hiện đại.

### 🎯 Thách thức WebSocket với k6

Khác biệt lớn nhất giữa HTTP RESTful API và WebSocket là tính chất trạng thái (stateful) và giao tiếp liên tục, hai chiều của WS. Bạn không thể chỉ gửi một request rồi nhận kết quả. Thay vào đó, bạn phải:

1. **Thiết lập kết nối (Connection):** Mở luồng WS ban đầu.
2. **Duy trì kết nối (Keep-alive):** Giữ kết nối sống bằng các tin nhắn ping/pong hoặc hoạt động định kỳ.
3. **Gửi và Nhận liên tục:** Mô phỏng việc gửi dữ liệu (Client $\to$ Server) và mong đợi nhận phản hồi theo luồng (Server $\to$ Client).

### 🧩 Giải pháp k6-websocket

Phiên bản k6 đã tích hợp các module mạnh mẽ để hỗ trợ giao thức WebSocket, giúp chúng ta thực hiện quá trình kết nối/gửi/nhận một cách tuần tự và chính xác.

---

## 💡 III. Triển khai Bài Test Mẫu (Code Walkthrough)

Giả sử chúng ta có một API WebSocket tại `ws://localhost:8080/chat` nơi mỗi client sẽ gửi một tin nhắn và nhận lại tin nhắn xác nhận với một ID duy nhất.

Đây là kịch bản `websocket_loadtest.js` mẫu mà tôi đã tối ưu hóa cho mục đích kiểm thử tải cao:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

// Cấu hình WebSocket Endpoint
const WS_URL = "ws://localhost:8080/chat"; 

export default function () {
    let ws;
    try {
        // 1. Thiết lập kết nối WebSocket (Connection)
        ws = new WebSocket(WS_URL);
        
        // Chờ sự kiện 'open' để đảm bảo kết nối đã sẵn sàng
        [WebSocket].prototype.onopen = () => {
            console.log("✅ Connection established.");
        };

        // Xử lý các tin nhắn nhận được (Server -> Client)
        ws.onmessage = (event) => {
            const receivedData = JSON.parse(event.data);
            if (receivedData.status === 'success') {
                console.log(`<- Server Acknowledged: ${receivedData.id}`);
            } else {
                console.error("Received invalid status:", receivedData);
            }
        };

        // Xử lý lỗi và đóng kết nối bất thường
        ws.onerror = (err) => {
            console.error(`❌ WebSocket Error: ${err.message}`);
            throw new Error("WebSocket Connection Failed");
        };

        // Chờ đến khi kết nối thực sự mở trước khi gửi dữ liệu
        sleep(1); 

    } catch (e) {
        console.error("Failed to initialize connection:", e);
    }

    // Vòng lặp kiểm tra tải: Gửi tin nhắn và chờ phản hồi
    for (let i = 0; i < 3; i++) {
        const messageId = `message_${Date.now()}_${i}`;
        const payload = JSON.stringify({ action: "send", data: messageId, userId: Math.random().toString(36).substr(2, 9) });

        // Gửi tin nhắn (Client -> Server)
        if (ws && ws.readyState === WebSocket.OPEN) {
            console.log(`-> Sending Message ID: ${messageId}`);
            ws.send(payload);
            
            // Quan trọng: Để mô phỏng độ trễ mạng thực tế và thời gian server xử lý
            sleep(Math.random() * 0.5 + 0.1); 
        } else {
            console.warn("Connection not open, skipping send.");
        }
    }

    // Cuối cùng: Dừng hoặc để kết nối sống cho đến khi k6 kết thúc bài test
    // Trong trường hợp cần đảm bảo đóng clean connection, ta phải quản lý việc gọi ws.close() ở đây. 
}
```

### 🔍 Giải thích chi tiết của Hoàng Hiệp (The QE Deep Dive)

1. **Sử dụng `WebSocket` Native Object:** Chúng ta không thể dựa vào các hàm HTTP đơn thuần mà phải sử dụng đối tượng `WebSocket` cơ bản của JS để mô phỏng giao thức cấp thấp, đảm bảo tính chân thực cao nhất khi kiểm thử hiệu năng mạng.
2. **Event Handling (`onopen`, `onmessage`, `onerror`):** Đây là phần quan trọng nhất. Việc xử lý các sự kiện này giúp kịch bản phản ánh chính xác vòng đời của một kết nối WebSocket: phải *mở* thành công trước, rồi mới có thể *nhận và gửi*.
3. **Thực hiện Ping/Pong (Mô phỏng Keep-Alive):** Trong bài test thực tế của tôi, bạn cần tích hợp cơ chế kiểm tra Heartbeat (Ping/Pong) định kỳ vào vòng lặp `sleep()`. Nếu kết nối bị đứt do timeout từ phía mạng hoặc server không phản hồi, chúng ta phải mô phỏng việc tự động tái kết nối để bài test là toàn diện.
4. **Độ chính xác của `sleep(Math.random())`:** Việc thêm độ trễ ngẫu nhiên giữa các lần gửi tin nhắn là cực kỳ quan trọng. Nếu bạn dùng `sleep(1)` cố định, bạn đang tạo ra một "bản tải hóa" (artificial load) không thực tế. Tải mạng luôn có tính phân tán và ngẫu nhiên.

## 📈 IV. Phân tích các Metric Hiệu năng từ k6 Report

Sau khi chạy test với lệnh: `k6 run websocket_loadtest.js --vus 100 --duration 30s`, bạn sẽ thu được một báo cáo giàu thông tin. Với vai trò là QE Lead, tôi luôn tập trung vào các metric sau:

| Metric | Ý nghĩa kỹ thuật (Engineering Insight) | Tác động khi vượt ngưỡng |
| :--- | :--- | :--- |
| **`fetch_duration` (p95/p99)** | Thời gian p95 và p99 là thời gian xử lý cho 95% hoặc 99% yêu cầu. Đây là chỉ số quan trọng nhất để đánh giá trải nghiệm người dùng thực tế. | Nếu p99 tăng cao, nghĩa là một nhóm nhỏ người dùng đang bị gián đoạn (bad experience), dù average latency có vẻ ổn. |
| **`errors::status_code`** | Phản ánh các lỗi kết nối (ví dụ: Timeout, Connection Closed). | Tỉ lệ lỗi cao cho thấy điểm nghẽn ở lớp mạng hoặc bộ nhớ của server/proxy (e.g., Nginx buffer limit). |
| **`vus` vs `iterations`** | Quan hệ giữa số lượng Virtual Users và tổng lượt lặp. Nó giúp xác định khả năng duy trì trạng thái kết nối ổn định dưới tải cực lớn. | Nếu `iter/s` giảm mạnh khi tăng `vus`, server của bạn có thể bị giới hạn tài nguyên CPU hoặc bộ nhớ Connection Handler. |
| **Kiểm tra Resource:** | Phải theo dõi đồng thời với các công cụ hệ thống (Prometheus + Grafana) để xem mức sử dụng CPU, Memory và đặc biệt là *File Descriptors* trên máy chủ. | Nếu File Descriptors bị cạn kiệt, server không thể mở thêm kết nối mới – đây là giới hạn OS chứ không phải ứng dụng! |

## 🛠️ V. Các Kịch bản Test Nâng cao (Advanced Scenarios)

Để nâng tầm việc kiểm thử WebSocket, bạn cần vượt ra khỏi kịch bản gửi/nhận đơn thuần:

### 1. Stress Testing (Kiểm tra điểm đổ vỡ)
* **Mục tiêu:** Xác định số lượng kết nối tối đa mà hệ thống chấp nhận trước khi tỷ lệ lỗi tăng đột biến.
* **Phương pháp:** Bắt đầu từ tải thấp (`--vus 10`) và tăng dần tốc độ tăng trưởng VUs (`--rate`) cho đến khi các metric hiệu suất bắt đầu giảm hoặc tỉ lệ lỗi vượt ngưỡng chấp nhận (ví dụ: > 1%).

### 2. Spike Testing (Kiểm tra khả năng chịu đột biến)
* **Mục tiêu:** Mô phỏng sự kiện đột ngột tăng tải lớn (ví dụ: tin tức hot, đợt khuyến mãi).
* **Phương pháp:** Giữ VUs ổn định trong thời gian `T` (baseline), sau đó chỉ trong một khoảng thời gian ngắn (`spike duration`), đẩy VUs lên mức cực đại, rồi trở lại baseline. Điều này kiểm tra khả năng tự phục hồi của hệ thống.

### 3. Thử nghiệm Tái kết nối (Failure Recovery Test)
* **Mục tiêu:** Đảm bảo client có thể tự động và mượt mà tái kết nối khi server cố tình ngắt luồng hoặc bị gián đoạn mạng tạm thời.
* **Phương pháp:** Kết hợp kịch bản tải với một script kiểm soát việc đóng/mở kết nối (tức là, hệ thống của bạn phải chịu được chu kỳ `CLOSE -> WAIT -> RECONNECT`).

## 🌟 Kết luận từ QE Lead Hoàng Hiệp

Kiểm thử hiệu năng cho WebSocket không chỉ là chạy code và xem các con số. Nó là một quá trình nghiên cứu hành vi của mạng lưới (network behavior) và kiến trúc hệ thống ở giới hạn chịu đựng của nó.

Khi bạn sử dụng k6, hãy nhớ rằng bản chất của việc kiểm thử WS là **giữ kết nối sống sót** và đo lường độ trễ xuyên suốt vòng đời của các sự kiện truyền qua luồng dữ liệu liên tục đó.

Hãy áp dụng phương pháp tiếp cận này vào dự án của bạn. Một hệ thống thời gian thực ổn định, có khả năng mở rộng tối đa là một tài sản vô giá!

Chúc các đồng nghiệp luôn viết code chất lượng và kiểm thử hiệu quả!
*Hoàng Hiệp.*