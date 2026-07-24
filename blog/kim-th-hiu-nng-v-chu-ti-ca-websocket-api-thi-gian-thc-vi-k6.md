---
title: "Kiểm thử hiệu năng và độ chịu tải của WebSocket API thời gian thực với k6"
date: 2026-02-19
description: "Hướng dẫn chuyên sâu cách sử dụng k6 để kiểm tra khả năng mở kết nối, truyền dữ liệu liên tục và tối ưu hóa hiệu suất cho các ứng dụng WebSocket thời gian thực."
tags: ["Performance","k6","WebSocket"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hoàng Hiệp"
---

# Kiểm thử hiệu năng và độ chịu tải của WebSocket API thời gian thực với k6

*Chào các bạn kỹ sư chất lượng, tôi là Hoàng Hiệp.*

Trong kiến trúc ứng dụng hiện đại, việc truyền tải dữ liệu thời gian thực (real-time) đóng vai trò cực kỳ quan trọng. Các giao thức như Signal, Live Chat, hay hệ thống theo dõi trạng thái thị trường đều dựa vào khả năng kết nối hai chiều và tức thời của WebSocket (WS).

Tuy nhiên, khi ứng dụng được đưa ra thị trường với hàng nghìn, thậm chí hàng triệu người dùng đồng thời, việc kiểm thử hiệu năng trở thành một thách thức phức tạp. Làm thế nào để chúng ta xác định liệu WebSocket API có thể duy trì độ ổn định, xử lý lượng tin nhắn khổng lồ mà không bị tắc nghẽn hay giật lag?

Bài viết này sẽ là cẩm nang chuyên sâu của tôi về cách sử dụng k6 – một công cụ kiểm thử hiệu năng hiện đại, cực kỳ mạnh mẽ – để giải quyết bài toán phức tạp: **Kiểm thử hiệu năng và độ chịu tải của WebSocket API thời gian thực.**

---

## 🎯 I. Tại sao phải dùng k6 cho WebSocket?

Các công cụ kiểm thử truyền thống thường tập trung vào các yêu cầu HTTP Request/Response đơn thuần (như REST APIs). Tuy nhiên, WebSocket là giao thức *stateful* (giữ trạng thái) và hoạt động theo cơ chế *streaming*. Nó không chỉ là một request mà là một **kênh kết nối duy trì**.

k6 được xây dựng bằng JavaScript và Golang, nổi tiếng về hiệu suất cao. Quan trọng hơn, k6 đã tích hợp khả năng hỗ trợ WebSocket API ngay trong bộ thư viện của nó, cho phép chúng ta mô phỏng hành vi người dùng thực tế:
1. **Kết nối (Connect):** Thiết lập kênh WS ban đầu.
2. **Gửi tin nhắn liên tục (Publishing):** Mô phỏng việc người dùng gửi dữ liệu định kỳ.
3. **Nhận và xử lý (Subscribing):** Xác minh rằng API có thể nhận và phản hồi đủ lượng tin nhắn mà không bị mất gói.

## 🛠️ II. Các bước triển khai kiểm thử WS với k6

Việc viết script kiểm thử WebSocket khác biệt so với REST API. Chúng ta cần tập trung vào việc mô phỏng *chu kỳ sống* của kết nối thay vì chỉ đo thời gian phản hồi một request đơn lẻ.

### 1. Chuẩn bị k6 Script (Javascript)

Để bắt đầu, bạn cần import thư viện `k6/x/websocket` và xác định các hành vi test:

```javascript
import { check } from 'https://jslib.k6.io/k6';
import { WebSocketConnection } from './ws_module'; // Giả sử chúng ta bọc logic vào module

export default function () {
    const ws = new WebSocketConnection("wss://your-websocket-endpoint");

    // BƯỚC 1: Thiết lập kết nối và xác minh trạng thái (Liveness Check)
    ws.connect();
    check(ws, { "WebSocket Connected": (c) => c === true });

    // Giả sử chúng ta có một hàm nhận dữ liệu và xử lý
    let receiveCount = 0;
    
    // BƯỚC 2: Mô phỏng việc duy trì kết nối và gửi tin nhắn định kỳ
    while (typeof ws.isConnected) {
        try {
            // Đặt hành vi lắng nghe dữ liệu nhận vào đây (Event Listener)
            ws.onMessage((data) => {
                console.log(`[RECEIVED] ${data}`);
                receiveCount++;
            });

            // Gửi một tin nhắn "heartbeat" hoặc dữ liệu giả định cứ sau 1 giây
            const heartbeatMessage = JSON.stringify({ type: "ping", data: Date.now() });
            ws.send(heartbeatMessage);

            // Wait cho đến khi kết nối bị ngắt hoặc hết thời gian test
            sleep(1); 

        } catch (e) {
            console.error("Connection Error:", e);
            break; // Thoát vòng lặp nếu có lỗi nghiêm trọng
        }
    }
    
    // BƯỚC 3: Đóng kết nối một cách sạch sẽ (Graceful Disconnect)
    ws.disconnect();
}

export let options = {
    vus: 100, // Số lượng Virtual Users (Người dùng ảo) - Tăng dần để tìm điểm giới hạn
    duration: '2m', // Thời gian chạy test
};
```

### 💡 Giải thích chuyên sâu của Hoàng Hiệp:

1. **`WebSocketConnection`:** Thay vì viết toàn bộ logic `new WebSocket()` trong script chính, tôi khuyến khích bạn bọc nó vào một lớp (Class) riêng biệt. Điều này giúp quản lý trạng thái kết nối (`isConnected`, `onMessage`, `send`) dễ dàng và tái sử dụng hơn, tuân thủ nguyên tắc OOP khi viết test automation phức tạp.
2. **Vòng lặp `while`:** Đây là trái tim của bài kiểm tra WS. Chúng ta không thể chỉ chạy một lần; chúng ta phải mô phỏng việc *duy trì* kết nối trong suốt thời gian test. Vòng lặp này đảm bảo rằng mỗi Virtual User (VU) đều thực hiện hành động "gửi dữ liệu và đợi phản hồi" liên tục.
3. **`ws.onMessage()`:** Đây là phần quan trọng nhất về mặt kiểm thử chất lượng. Chúng ta phải *lắng nghe* xem hệ thống có đang nhận được đủ tin nhắn không, chứ không chỉ kiểm tra những gì chúng ta gửi đi. Logic xử lý dữ liệu (ví dụ: ghi lại `receiveCount`) giúp chúng ta định lượng hiệu suất.
4. **`sleep(1)`:** Giả lập khoảng thời gian người dùng thực sự nghỉ ngơi hoặc chờ đợi phản hồi từ hệ thống, tạo ra tính chân thực cho load profile.

## 📈 III. Các kịch bản kiểm thử cần tối ưu (Test Scenarios)

Một bài test hiệu năng WS chỉ dừng lại ở việc "chạy nhiều VU" là chưa đủ. Bạn phải mô phỏng các tình huống kinh doanh phức tạp:

### Kịch bản 1: Kiểm tra Khả năng chịu tải Tĩnh (Steady-State Load Test)
*   **Mục đích:** Đảm bảo hệ thống duy trì kết nối ổn định và xử lý luồng tin nhắn liên tục khi đạt mức người dùng mong muốn ($N$ VUs).
*   **Cách test:** Giữ số lượng VU cố định ở mức $N$. Theo dõi độ trễ (latency) trung bình giữa lúc gửi Ping/Heartbeat và việc nhận được xác nhận phản hồi. Nếu độ trễ tăng dần theo thời gian, hệ thống đang gặp vấn đề về tài nguyên hoặc backpressure.

### Kịch bản 2: Kiểm tra Điểm giới hạn Tối đa (Stress Test - Finding the Breaking Point)
*   **Mục đích:** Tìm ra số lượng người dùng tối đa ($N_{max}$) mà API có thể chịu được trước khi tỷ lệ lỗi kết nối (`connection loss`) tăng đột biến hoặc CPU/Memory đạt 100%.
*   **Cách test:** Tăng dần `vus` (ví dụ: từ 10 -> 50 -> 100 -> 200...) và ghi lại chỉ số lỗi. Khi tỉ lệ lỗi bắt đầu vượt ngưỡng chấp nhận được (ví dụ > 5%), bạn đã tìm ra điểm giới hạn của hệ thống.

### Kịch bản 3: Kiểm tra Khả năng phục hồi (Resilience Test - Failover/Reconnection)
*   **Mục đích:** Đảm bảo người dùng trải nghiệm liền mạch ngay cả khi kết nối bị gián đoạn tạm thời (ví dụ: mất mạng, Server restart).
*   **Cách test:** Giới hạn script của bạn trong việc mô phỏng lỗi. Ví dụ: Tạm thời chặn cổng network hoặc làm cho API giả lập ngắt kết nối đột ngột. Sau đó, kiểm tra xem `WebSocketConnection` có thể tái thiết lập (reconnect) thành công và khôi phục lại trạng thái hoạt động mà không cần can thiệp thủ công của người dùng hay không.

## 📊 IV. Phân tích Kết quả Báo cáo k6 (The QE Mindset)

Sau khi chạy test, đừng chỉ nhìn vào thời gian phản hồi trung bình. Hãy xem xét các chỉ số sau:

| Chỉ số | Ý nghĩa trong WS Testing | Hành động khắc phục tiềm năng |
| :--- | :--- | :--- |
| **Connection Error Rate** (Tỷ lệ lỗi kết nối) | Cho biết khả năng duy trì kết nối của API dưới tải nặng. | Xem xét giới hạn tài nguyên server (file descriptors, memory leak). Tăng cường Heartbeat/Ping để phát hiện mất kết nối sớm hơn. |
| **Message Loss Rate** (Tỷ lệ mất tin nhắn) | Đây là chỉ số quan trọng nhất. Cho biết việc truyền dữ liệu có bị bỏ sót không. | Kiểm tra backpressure mechanism của backend. Nếu quá tải, hệ thống nên báo lỗi hoặc giảm tốc độ xử lý thay vì làm mất data. |
| **P95/P99 Latency** (Độ trễ phần trăm) | Cho biết 95% và 99% các tin nhắn được xử lý trong bao lâu. Chỉ số này tốt hơn Average Latency rất nhiều. | Nếu P99 cao, nghĩa là một nhóm nhỏ người dùng đang gặp trải nghiệm cực kỳ kém. Cần tối ưu hóa database query hoặc giới hạn luồng xử lý (throttling). |
| **Throughput** (Thông lượng) | Số lượng tin nhắn/giây mà API có thể xử lý ổn định. | Tối ưu hóa logic gửi nhận dữ liệu, giảm payload size của các message JSON. |

## Lời Kết từ Hoàng Hiệp

Kiểm thử WebSocket không chỉ là việc nhấn nút "Chạy Test" trên k6. Nó là một quy trình tư duy về trải nghiệm người dùng thời gian thực: **Kết nối có ổn định không? Dữ liệu có được truyền tải hết không? Và khi gặp sự cố, hệ thống có thể phục hồi nhanh chóng không?**

Việc áp dụng các mô hình kiểm thử phức tạp trên k6 sẽ giúp đội ngũ của bạn chuyển từ việc "chỉ biết nó chạy" sang việc "biết chính xác tại sao và đến bao giờ nó sụp đổ". Chúc các bạn thành công trong hành trình đảm bảo chất lượng phần mềm!