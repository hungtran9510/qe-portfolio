---
title: "Kiểm thử hiệu năng và độ chịu tải của WebSocket API thời gian thực với k6"
date: 2026-02-15
description: "Khám phá cách kiểm tra khả năng mở rộng, độ trễ và tính ổn định của các API WebSocket thời gian thực bằng công cụ k6 mạnh mẽ."
tags: ["Performance","k6","WebSocket"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hoàng Hiệp"
---

# Kiểm thử hiệu năng và độ chịu tải của WebSocket API thời gian thực với k6

**Tác giả: Hoàng Hiệp, QE Lead**

***

Chào các bạn đồng nghiệp đam mê chất lượng! Tôi là Hoàng Hiệp, chuyên viên Kỹ thuật Đảm bảo Chất lượng (QE). Trong thế giới phát triển ứng dụng hiện đại, việc giao tiếp theo thời gian thực (real-time communication) là xương sống của trải nghiệm người dùng. Từ chatbox đến bảng điều khiển chứng khoán trực tuyến, các API dựa trên WebSocket đã trở thành tiêu chuẩn vàng.

Tuy nhiên, với vai trò QE, chúng ta không chỉ chấp nhận nó hoạt động; chúng ta phải đảm bảo rằng nó **hoạt động ổn định** khi chịu tải hàng ngàn kết nối cùng lúc. Kiểm thử hiệu năng (Performance Testing) cho một API truyền thống (như RESTful HTTP) đã là phức tạp, nhưng đối với WebSocket — nơi mà sự kiện và trạng thái liên tục chảy qua — thì thách thức còn lớn hơn rất nhiều.

Bài viết này sẽ hướng dẫn các bạn cách sử dụng công cụ **k6** hiện đại và mạnh mẽ để thực hiện kiểm thử hiệu năng và độ chịu tải (Load/Stress Testing) một API WebSocket, đảm bảo hệ thống của bạn không "sập tiệm" khi có người dùng bùng nổ.

***

## I. Tại sao việc kiểm thử WebSocket lại khác biệt?

Trước hết, chúng ta cần hiểu bản chất khác biệt giữa HTTP và WebSocket để thấy được tầm quan trọng của bài kiểm tra này.

**1. Mô hình giao tiếp:**
*   **HTTP (Request-Response):** Là mô hình yêu cầu/phản hồi. Client gửi yêu cầu, Server xử lý và trả về phản hồi, sau đó kết nối đóng lại (hoặc giữ ở mức tối thiểu). Mỗi yêu cầu là một phiên độc lập.
*   **WebSocket (Bi-directional Streaming):** Thiết lập một kết nối TCP duy nhất, bền vững giữa client và server (handshake qua HTTP, nhưng duy trì bằng WS protocol). Sau khi thiết lập, hai chiều dữ liệu có thể được truyền đi bất cứ lúc nào mà không cần yêu cầu mới.

**2. Thách thức về Testing:**
Khi kiểm thử hiệu năng REST API, chúng ta đo lường *throughput* (xử lý bao nhiêu request/giây) và *latency* (độ trễ của 1 request).

Với WebSocket, chúng ta phải đo lường:
1. **Khả năng duy trì kết nối:** Hệ thống có giữ được hàng nghìn phiên TCP mà không bị rò rỉ tài nguyên bộ nhớ (memory leak)?
2. **Tần suất tin nhắn (Message Throughput):** Server có thể gửi X lượng tin nhắn/giây qua *tất cả* các kết nối đang hoạt động không?
3. **Độ trễ dữ liệu:** Độ trễ từ khi sự kiện xảy ra đến khi client nhận được nó có ổn định không?

Nếu chỉ mô phỏng việc mở và đóng nhiều kết nối, chúng ta đã bỏ sót phần quan trọng nhất: **việc duy trì luồng tin nhắn liên tục**.

## II. Thiết lập môi trường với k6 và WebSocket

k6 là lựa chọn lý tưởng vì nó được viết bằng Go (tốc độ cao) và cho phép Scripting bằng JavaScript (dễ sử dụng, cộng đồng lớn). Quan trọng hơn, k6 đã tích hợp sẵn các API dành riêng cho WebSocket, giúp việc mô phỏng phức tạp trở nên đơn giản.

### Các bước cơ bản:

1. **Cài đặt:** Đảm bảo bạn đã cài đặt `k6`.
2. **Thiết lập Endpoint:** Bạn cần biết URL của WebSocket endpoint (ví dụ: `wss://api.example.com/ws`).
3. **Viết Script:** Sử dụng vòng lặp và hàm `websocket` trong k6 để mô phỏng hành vi kết nối, gửi dữ liệu và nhận phản hồi.

## III. Hướng dẫn Code chi tiết (The Heart of the Test)

Giả sử chúng ta có một API WebSocket chat đơn giản yêu cầu client phải `$AUTH_TOKEN` để xác thực khi kết nối và sau đó sẽ trao đổi các tin nhắn "ping/pong" theo chu kỳ.

Chúng ta sẽ viết kịch bản test (`ws_test.js`) như sau:

```javascript
// ws_test.js

import http from 'k6/http';
import { check, sleep } from 'k6';

// --- Cấu hình Test ---
const WS_URL = 'wss://your-realtime-api.com/ws'; 
const AUTH_TOKEN = 'Bearer your_secret_token'; // Thay bằng token thực tế

export default function () {
    // 1. Kết nối WebSocket
    // Hàm websocket() của k6 xử lý việc handshake và duy trì kết nối
    const ws = new WebSocket(WS_URL);

    // Thiết lập sự kiện khi kết nối thành công (On Open)
    ws.onopen = function () {
        console.log(`[Client] Connected to ${WS_URL}. Sending initial auth message.`);
        
        // Bước 1: Gửi tin nhắn xác thực (Auth Message) qua WebSocket
        const authMessage = JSON.stringify({ type: "auth", token: AUTH_TOKEN });
        ws.send(authMessage);

        // Bắt đầu việc kiểm thử bằng cách gửi/nhận tin nhắn theo chu kỳ
    };

    // Thiết lập sự kiện khi nhận dữ liệu (On Message)
    ws.onmessage = function (event) {
        const receivedData = JSON.parse(event.data);
        
        // 2. Giả lập xử lý nghiệp vụ: Nếu nhận được tin nhắn 'update', hãy phản hồi lại.
        if (receivedData.type === "market_update") {
            console.log(`[Client] Received market update: ${JSON.stringify(receivedData)}`);

            // Phản hồi ngay lập tức để mô phỏng client chủ động tham gia giao tiếp 2 chiều
            const response = JSON.stringify({ type: "ack", receivedId: receivedData.id });
            ws.send(response);
        }
    };
    
    // Thiết lập sự kiện khi kết nối đóng (On Close)
    ws.onclose = function () {
        console.log("[Client] WebSocket connection closed.");
    };


    // Giữ cho kịch bản chạy ổn định trong suốt thời gian test
    sleep(5); 

    // Lưu ý: Trong môi trường Load Testing thực tế, bạn nên sử dụng một cơ chế quản lý kết nối 
    // phức tạp hơn vòng lặp đơn giản này (ví dụ: Connection Pool) để tối ưu tài nguyên.
}

export const options = {
    vus: 500, // Số lượng người dùng ảo (Virtual Users)
    duration: '30s', // Thời gian chạy test là 30 giây
    thresholds: {
        'ws_success': ['rate>0.99'], // Đảm bảo tỷ lệ thành công cao
        // Có thể thêm threshold kiểm tra độ trễ phản hồi ở đây
    }
};
```

### Giải thích chuyên sâu của Hoàng Hiệp về kịch bản trên:

1. **`new WebSocket(WS_URL)`:** Đây là bước khởi tạo kết nối. Khi k6 chạy, nó sẽ thực hiện Handshake (trao đổi HTTP upgrade) để chuyển sang giao thức WS.
2. **`ws.onopen = function () { ... }`:** Chúng ta đặt logic quan trọng nhất vào sự kiện `onopen`. Bởi vì trong môi trường sản xuất, việc xác thực và gửi tin nhắn đầu tiên phải xảy ra ngay sau khi kết nối được thiết lập thành công. Việc này mô phỏng bước **Khởi tạo phiên làm việc**.
3. **`ws.send(data)`:** Đây là phương thức cốt lõi để đẩy dữ liệu từ client ảo (k6) đến server. Việc gửi Auth Token ban đầu rất quan trọng, nó giúp hệ thống của bạn được kiểm tra khả năng xử lý *context* và *state*.
4. **`ws.onmessage = function (event) { ... }`:** Đây là nơi kịch bản mô phỏng hành vi người dùng thật: nhận dữ liệu từ server và sau đó phải làm gì với nó (ví dụ: tính toán, hiển thị, hoặc tệ hơn – gửi một yêu cầu phản hồi lại). Bằng cách **gửi ACK** khi nhận được update, chúng ta kiểm tra cả khả năng đẩy dữ liệu *và* khả năng xử lý luồng tương tác hai chiều.
5. **`sleep(5)`:** Lệnh này giúp giữ các Virtual Users (VUs) "bận rộn" và duy trì trạng thái kết nối trong suốt 5 giây, đảm bảo k6 không nhanh chóng thoát ra sau khi hoàn thành một chu trình nhỏ.

## IV. Các Scenarios kiểm thử nâng cao (Advanced Testing)

Một bài test đơn giản như trên chỉ là Load Test cơ bản. Là một QE Lead, chúng ta phải nghĩ đến các tình huống cực đoan:

### 1. Stress Testing (Kiểm tra giới hạn):
Mục tiêu: Tìm ra điểm bão hòa của hệ thống.
Cách thực hiện: Tăng dần số lượng VUs (`vus`) lên cao hơn mức người dùng tối đa dự kiến, cho đến khi độ trễ đột ngột tăng vọt hoặc tỷ lệ lỗi vượt ngưỡng chấp nhận được.

### 2. Soak Testing (Kiểm tra độ bền):
Mục tiêu: Phát hiện Memory Leak và các vấn đề rò rỉ tài nguyên sau thời gian hoạt động kéo dài.
Cách thực hiện: Giữ một số lượng VUs ổn định ở mức trung bình và chạy bài test trong nhiều giờ (ví dụ: `duration: '4h'`). Quan sát biểu đồ tiêu thụ bộ nhớ của Server (Java Heap Memory, OS memory) để đảm bảo không có sự tăng trưởng tuyến tính vô tận.

### 3. Edge Case Testing - Disconnection Handling:
Mục tiêu: Đảm bảo hệ thống xử lý graceful degradation khi mất kết nối đột ngột.
Cách mô phỏng: Thêm một cơ chế trong kịch bản client/test để chủ động đóng kết nối bằng `ws.close()` và sau đó kiểm tra khả năng **tự phục hồi (Reconnection)** của client, đồng thời đo độ trễ và sự thành công của quá trình reconnecting.

## V. Tổng kết - Checklist cho QE khi kiểm thử WebSocket

Khi thiết kế một chiến dịch Load Test WS API, bạn phải trả lời được các câu hỏi sau:

| Khía cạnh | Câu hỏi cần trả lời | Chỉ số quan trọng (Metrics) |
| :--- | :--- | :--- |
| **Khởi tạo** | Hệ thống có chịu được việc mở/đóng N phiên kết nối cùng lúc không? | Kết quả Handshake, Tỷ lệ lỗi Auth. |
| **Giữ trạng thái** | Hệ thống có xử lý tốt các tác vụ background và duy trì phiên ổn định qua thời gian dài không? | Memory Usage (Server Side), Độ ổn định của Rate. |
| **Duy trì luồng** | Khi có sự kiện A, Server có thể đẩy dữ liệu đến tất cả N clients với độ trễ tối đa là X ms không? | Message Latency (Thời gian từ phát sinh đến nhận được). |
| **Tương tác 2 chiều** | Client phản hồi (ACK) và các luồng xử lý giao dịch ngược lại có ổn định khi chịu tải lớn không? | Transaction Throughput, Độ trễ Phản hồi. |

---

Kiểm thử hiệu năng WebSocket là một lĩnh vực đòi hỏi sự hiểu biết sâu sắc về cả kiến trúc mạng lẫn công cụ testing. Bằng cách sử dụng các công cụ hiện đại như k6 và áp dụng kịch bản mô phỏng người dùng thực tế (bao gồm Auth, Send, Receive/ACK), chúng ta có thể xây dựng được những API thời gian thực không chỉ hoạt động tốt, mà còn **vượt trội** về độ ổn định dưới mọi điều kiện tải.

Chúc các bạn thành công trong việc đảm bảo chất lượng hệ thống!

***