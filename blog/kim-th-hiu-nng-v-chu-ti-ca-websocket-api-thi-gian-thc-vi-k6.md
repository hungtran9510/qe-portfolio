---
title: "Kiểm thử hiệu năng và độ chịu tải của WebSocket API thời gian thực với k6"
date: 2026-02-13
description: "Hướng dẫn chuyên sâu cách sử dụng k6 để mô phỏng và kiểm tra khả năng chịu tải, thông lượng của các ứng dụng WebSocket realtime."
tags: ["Performance","k6","WebSocket"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hoàng Hiệp"
---

# Kiểm thử hiệu năng và độ chịu tải của WebSocket API thời gian thực với k6

Chào các bạn, tôi là Hoàng Hiệp. Là một chuyên viên Kỹ thuật Đảm bảo Chất lượng Phần mềm (QE Lead), tôi nhận thấy rằng trong kiến trúc Microservices hiện đại, các API Real-time sử dụng giao thức WebSocket đang trở nên cực kỳ phổ biến – từ các bảng giá chứng khoán trực tiếp, chatbox tức thời đến hệ thống thông báo vận hành.

Tuy nhiên, việc kiểm tra hiệu năng cho những API này lại là một thách thức lớn. Tại sao ư? Bởi vì WebSocket khác biệt căn bản so với HTTP truyền thống: nó là kết nối **stateful** (có trạng thái) và **bidirectional** (hai chiều). Các công cụ Load Testing cũ thường chỉ tập trung vào việc đo lường số lượng yêu cầu (Request Count), nhưng chúng lại bỏ qua khả năng duy trì và xử lý dữ liệu liên tục dưới áp lực cao.

Bài viết này, tôi sẽ hướng dẫn các bạn một cách chuyên sâu nhất về cách sử dụng k6 – một công cụ hiệu suất hàng đầu dựa trên JavaScript – để thực hiện việc kiểm thử hiệu năng và độ chịu tải cho WebSocket API một cách chính xác, minh bạch và khoa học.

***

## 🚀 I. Tại sao phải dùng k6 cho WebSocket? (The QE Perspective)

Khi đánh giá khả năng mở rộng của hệ thống Real-time, chúng ta không chỉ cần biết hệ thống có bao nhiêu *request* được xử lý trong giây (RPS), mà quan trọng hơn là nó duy trì được **số lượng kết nối đồng thời tối đa (Maximum Concurrent Connections)** và giữ được **thông lượng tin nhắn ổn định (Steady Message Throughput)** như thế nào dưới tải cực đại.

### Vấn đề của kiểm thử truyền thống:
1. **HTTP-centric Tools:** Nhiều công cụ tập trung vào các giao dịch request/response đơn lẻ, không tối ưu cho việc duy trì trạng thái kết nối dài hạn.
2. **State Management:** Với WebSocket, mỗi người dùng tạo ra một "session" riêng biệt. Việc kiểm thử phải mô phỏng được hành vi của hàng ngàn session hoạt động độc lập và đồng thời giao tiếp với server.

### Giải pháp với k6:
k6 cung cấp môi trường scripting bằng JavaScript mạnh mẽ (và backend Go hiệu suất cao) cho phép chúng ta:
1. **Mô hình hóa State:** Dễ dàng quản lý trạng thái của từng người dùng/session trong suốt quá trình kiểm thử.
2. **Tạo Luồng Tự nhiên:** Viết các script mô phỏng hành vi người dùng (user journey) thực tế, bao gồm cả việc thiết lập kết nối, chờ nhận sự kiện và gửi phản hồi theo chu kỳ.
3. **Đo lường Độ trễ Thực tế:** Xác định được độ trễ đầu cuối (End-to-end latency) của tin nhắn ngay khi tải tăng lên, điều mà các công cụ cũ khó làm được.

***

## 🛠️ II. Quy trình kiểm thử WebSocket với k6: Các bước đi thực tiễn

Về cơ bản, việc kiểm thử WebSocket bằng k6 không giống như việc gọi một API REST thông thường. Nó bao gồm ba giai đoạn cốt lõi: **Kết nối (Connect)** $\rightarrow$ **Gửi/Nhận dữ liệu (Send/Receive)** $\rightarrow$ **Giữ kết nối và đo tải (Sustain & Measure)**.

### A. Chuẩn bị môi trường
1. **Cài đặt k6:** Đảm bảo bạn đã cài đặt k6 CLI.
2. **Thiết lập Target Endpoint:** Xác định URL của WebSocket API cần kiểm thử (ví dụ: `ws://api.example.com/livefeed`).

### B. Xây dựng mô hình User Script
Chúng ta sẽ sử dụng các hàm và thư viện JavaScript trong k6 để thực hiện kết nối WebSocket. Mặc dù k6 không có built-in function chuyên biệt cho WS, việc tích hợp lớp `WebSocket` là cần thiết.

**Ví dụ minh họa (Code Concept):**

Do việc tích hợp trình duyệt/thư viện WebSocket client trực tiếp vào môi trường Node.js của k6 đòi hỏi các wrapper hoặc môi trường phức tạp hơn (ví dụ: phải chạy trong context có hỗ trợ WS native), tôi sẽ cung cấp một **khung mã giả lập tối ưu và thực tế nhất** để bạn nắm được logic cốt lõi.

*(Lưu ý: Trong bài viết chuyên sâu này, chúng ta tập trung vào cấu trúc k6 `script` sử dụng khả năng xử lý I/O của nó.)*

```javascript
// script.js cho k6 WebSocket Load Test

import { sleep, check } from 'k6';
import { WebSocketClient } from './websocket_client.js'; // Giả định thư viện hỗ trợ WS trong môi trường test

export default function () {
    const ws = new WebSocketClient('ws://your-api-endpoint:8080/livefeed');
    console.log(`[User ${__VU}] Attempting to connect...`);
    
    // 1. Kết nối và Handshake (Bước đầu)
    ws.connect();

    // Chờ một khoảng thời gian ngắn để đảm bảo kết nối được thiết lập
    sleep(2); 

    let messageCount = 0;
    const MAX_MESSAGES = 50; // Giới hạn số tin nhắn mô phỏng trên mỗi VU

    while (messageCount < MAX_MESSAGES) {
        // 2. Xử lý và Gửi dữ liệu: Mô phỏng việc nhận và gửi tin nhắn
        try {
            // Kích hoạt logic xử lý sự kiện (ví dụ: chat user, subscribe to topic)
            const received = ws.receiveMessage();
            if (received) {
                console.log(`[User ${__VU}] Received message: ${received}`);
                check(received, ['Received data successfully']);

                // Mô phỏng việc gửi tin nhắn phản hồi hoặc hành động tiếp theo
                const outgoingPayload = JSON.stringify({ 
                    action: "ACK", 
                    message_id: Date.now() % 100 // Payload mô phỏng
                });
                ws.sendMessage(outgoingPayload);

            } else {
                 console.log(`[User ${__VU}] No new message, waiting...`);
            }
        } catch (error) {
            // Xử lý khi kết nối bị ngắt hoặc xảy ra lỗi logic
            console.error(`[User ${__VU}] Error during WS cycle: ${error}`);
        }

        messageCount++;
        sleep(0.5); // Delay mô phỏng thời gian xử lý của người dùng/client
    }
    
    // 3. Dọn dẹp (Quan trọng)
    ws.disconnect();
}


// Cấu hình Load Test (Options)
export const options = {
    vus: 100,      // Số lượng Virtual Users (người dùng giả lập)
    duration: '2m', // Thời gian chạy test
    thresholds: {
        'http_req_failed': ['rate<0.01'], // Tỷ lệ lỗi phải cực thấp
        'ws_connection_error': ['count<5'] // Giới hạn số lần lỗi kết nối
    }
};
```

### C. Giải thích chi tiết Code (Hoàng Hiệp’s Insight)

*   **`WebSocketClient` Class:** Trong môi trường sản xuất, bạn cần một lớp `WebSocketClient` bao bọc logic kết nối, đảm bảo rằng việc xử lý `onopen`, `onerror`, và `onclose` được thực hiện chính xác. Đây là nơi quản lý **trạng thái (State)** của kết nối WS.
*   **`__VU`:** Biến này (Virtual User) giúp chúng ta theo dõi nhật ký (logs) một cách rõ ràng, cho biết hành vi nào thuộc về người dùng/session nào.
*   **Vòng lặp `while (messageCount < MAX_MESSAGES)`:** Đây là trái tim của bài test. Thay vì chỉ thực hiện một yêu cầu và thoát ra, chúng ta buộc script phải *duy trì kết nối* trong nhiều lần lặp, mô phỏng việc người dùng hoạt động liên tục theo thời gian thực.
*   **`ws.receiveMessage()` & `ws.sendMessage()`:** Đây là các hàm cốt lõi, tượng trưng cho việc luồng dữ liệu (message payload) được trích xuất và đẩy đi. Bằng cách đo lường sự thành công của những lần gọi này, ta đo được **Thông lượng tin nhắn (Throughput)** dưới tải.
*   **`sleep(0.5)`:** Việc thêm độ trễ mô phỏng (artificial delay) là cực kỳ quan trọng. Nó giúp việc test trở nên *hiện thực*, vì người dùng không gửi dữ liệu liên tục với tốc độ máy tính, họ có khoảng thời gian xử lý giữa các hành động.

***

## 🧠 III. Nâng cao và Tối ưu hóa cho Môi trường Sản xuất

Là một QE Lead, tôi luôn nhấn mạnh rằng một bài test chỉ là khởi đầu. Để đảm bảo chất lượng vượt trội, bạn cần xem xét những khía cạnh sau:

### 1. Kiểm thử Khả năng phục hồi (Resilience Testing)
Trong thực tế, mạng internet và API đều có thể bị gián đoạn. Hãy thêm các kịch bản lỗi vào test case của bạn:
*   **Simulate Disconnection:** Cố tình ngắt kết nối WS trong quá trình chạy để kiểm tra xem client của bạn có cơ chế **Tự Kết Nối Lại (Automatic Reconnect)** hay không, và việc này diễn ra bao lâu.
*   **Jitter Testing:** Thay vì `sleep(0.5)` cố định, hãy sử dụng hàm phân phối ngẫu nhiên (`Math.random() * 0.3 + 0.2`) để mô phỏng sự dao động hành vi người dùng.

### 2. Tải dữ liệu Khác nhau (Diverse Payloads)
Đừng chỉ gửi các payload đơn giản `{ "status": "ok" }`. Hãy thiết kế test case với nhiều loại payload khác nhau:
*   **Payload lớn:** Gửi một tin nhắn JSON cực lớn (ví dụ, chứa 1MB dữ liệu metadata) để kiểm tra khả năng xử lý buffer và bộ nhớ của server.
*   **Kiểu dữ liệu phức tạp:** Mô phỏng việc trao đổi các đối tượng nhị phân (binary data), không chỉ là văn bản thuần túy.

### 3. Thiết lập Độ trễ Tải (Ramping Up Load)
Thay vì áp dụng ngay lập tức 100 VUs, hãy tăng tải một cách từ từ:
*   Bắt đầu với `vus: 10` trong 5 phút.
*   Sau đó, tăng lên `vus: 50` trong 3 phút.
*   Và cuối cùng, đạt đỉnh tại `vus: 200`.

Điều này giúp bạn xác định chính xác **điểm bão hòa (Saturation Point)** của hệ thống – tức là thời điểm hiệu năng bắt đầu suy giảm đột ngột do nguồn lực bị quá tải.

***

## 📝 Kết luận và Lời khuyên từ QE Lead

Kiểm thử hiệu năng cho WebSocket API không chỉ đơn thuần là chạy công cụ load testing với số lượng người dùng lớn. Nó là việc **mô phỏng chính xác hành vi của con người** trong một môi trường giao tiếp liên tục, duy trì trạng thái và luồng dữ liệu hai chiều.

Bằng cách sử dụng k6 và cấu trúc script như trên, bạn đã chuyển từ góc nhìn "Request/Response" sang góc nhìn "Session/Event Stream," mang lại cái nhìn sâu sắc và thực tế nhất về khả năng mở rộng của hệ thống Real-time.

Chúc các bạn áp dụng thành công những kỹ thuật này để xây dựng nên những sản phẩm phần mềm chất lượng cao, đáng tin cậy!