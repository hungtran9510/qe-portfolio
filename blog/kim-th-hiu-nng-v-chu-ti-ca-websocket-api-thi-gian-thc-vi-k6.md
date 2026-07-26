---
title: "Kiểm thử hiệu năng và độ chịu tải của WebSocket API thời gian thực với k6"
date: 2026-02-21
description: "Hướng dẫn chuyên sâu về cách sử dụng k6 để mô phỏng tải nặng, kiểm tra khả năng mở rộng và hiệu suất của các hệ thống WebSocket thời gian thực."
tags: ["Performance","k6","WebSocket"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hoàng Hiệp"
---

# Kiểm thử hiệu năng và độ chịu tải của WebSocket API thời gian thực với k6

*Từ Góc Nhìn của Một QE Lead – Hoàng Hiệp*

***

## 🚀 Lời Mở Đầu: Tại Sao WebSocket Cần Được Kiểm Tra Nghiêm Túc?

Chào các bạn kỹ sư Chất lượng!

Trong kỷ nguyên mà trải nghiệm người dùng (UX) phải là thời gian thực, WebSocket (WS) đã trở thành xương sống của nhiều ứng dụng hiện đại—từ các bảng giá chứng khoán trực tiếp, trò chơi multiplayer online, đến hệ thống thông báo tức thời. WS cho phép giao tiếp bán hai chiều qua một kết nối duy nhất, loại bỏ được độ trễ đáng kể so với REST truyền thống.

Tuy nhiên, "hiệu suất cao" (High Performance) và "thời gian thực" (Real-time) đi kèm với những thách thức khổng lồ về mặt kỹ thuật. Khi hệ thống của bạn phải đối mặt với hàng ngàn, thậm chí hàng triệu kết nối duy trì trạng thái liên tục, việc chỉ kiểm thử chức năng (Functional Testing) là hoàn toàn không đủ.

Bạn cần một công cụ mạnh mẽ để mô phỏng áp lực thực tế: đó chính là **k6**.

Bài viết này sẽ là hướng dẫn chuyên sâu nhất của tôi về cách sử dụng k6 để không chỉ kiểm tra khả năng chịu tải mà còn đo lường độ ổn định và hiệu suất *thực thụ* của WebSocket API.

## 💡 I. Cơ Sở Lý Thuyết: Kiểm Thử Hiệu Năng WS Khác Với HTTP Thế Nào?

Khi ta nói đến Load Testing cho WebSocket, chúng ta không chỉ đơn thuần là gửi yêu cầu (request) rồi chờ phản hồi (response). Chúng ta đang mô phỏng một vòng đời kết nối phức tạp hơn nhiều.

### 1. Các Yếu Tố Cần Tập Trung Kiểm Tra:

*   **Khả năng mở rộng Kết nối (Connection Scaling):** Hệ thống có thể duy trì hàng ngàn/hàng chục nghìn kết nối WS *đồng thời* hay không, và liệu việc mở/đóng kết nối có bị tắc nghẽn tài nguyên hệ điều hành (resource exhaustion) không?
*   **Thông lượng Tin nhắn (Throughput):** Sau khi kết nối được thiết lập, tốc độ tối đa mà server có thể xử lý và gửi đi các gói tin dữ liệu là bao nhiêu (ví dụ: 100 tin/giây/kết nối)?
*   **Độ trễ Kết nối (Connection Latency):** Thời gian để một client từ lúc cố gắng kết nối đến khi nhận được thông báo "Connected" phải nằm trong ngưỡng chấp nhận được.
*   **Khả năng chịu tải gián đoạn (Resilience):** Điều gì xảy ra khi server gặp sự cố nhỏ, hoặc khi mạng bị rớt và cần tái kết nối (reconnect logic)?

### 2. Tại sao k6 là lựa chọn tối ưu?

k6 (viết bằng Go và sử dụng JavaScript để viết test script) được thiết kế với hiệu suất cao, khả năng song song tuyệt vời và cú pháp viết test cực kỳ dễ đọc. Điều này giúp chúng ta tập trung vào logic kiểm thử thay vì lo lắng về việc quản lý tài nguyên của công cụ.

## 🛠️ II. Hướng Dẫn Thực Hành: Viết Test Script WebSocket bằng k6

Để kiểm thử WS với k6, chúng ta sẽ cần sử dụng các thư viện hỗ trợ WebSockets trong môi trường JavaScript/Go của k6. Về cơ bản, logic test phải mô phỏng một *vòng lặp sống* (persistent loop) thay vì chỉ là một request-response đơn lẻ.

### 1. Cài đặt và Chuẩn bị Môi trường

Đảm bảo bạn đã cài đặt k6:
```bash
brew install k6 # Hoặc theo tài liệu chính thức của k6
```

Giả sử chúng ta có một API WS mẫu chạy tại `ws://localhost:8080/ws/user/123`.

### 2. Code Mẫu (WebsocketLoadTest.js)

Đây là đoạn code mô phỏng quy trình kết nối, duy trì trạng thái lắng nghe và gửi tin nhắn liên tục trong vòng thử nghiệm.

```javascript
// websocket_load_test.js
import { WebSocketClient } from 'k6/x/webws'; // Giả định thư viện WS cho k6

export default function () {
    const ws = new WebSocketClient('ws://localhost:8080/ws/realtime');
    let connectionSuccessful = false;
    
    // 1. Thiết lập sự kiện khi kết nối thành công (Open)
    ws.onopen(() => {
        console.log("✅ Kết nối WS thành công.");
        connectionSuccessful = true;
        // Gửi tin nhắn đăng ký hoặc xác thực ban đầu
        ws.send(JSON.stringify({ action: "subscribe", topic: "price_feed" }));
    });

    // 2. Xử lý nhận dữ liệu (Message)
    ws.onmessage((event) => {
        const data = JSON.parse(event.data);
        // Ở đây, ta chỉ cần xác nhận rằng việc nhận dữ liệu diễn ra mượt mà
        if (data.type === "heartbeat") {
            console.log(`[Heartbeat] Nhận tại ${new Date().toISOString()}`);
        } else {
             console.log(`[Dữ liệu WS] ${JSON.stringify(data)}`);
        }
    });

    // 3. Xử lý lỗi (Error) và đóng kết nối (Close)
    ws.onerror((err) => {
        console.error("❌ Lỗi kết nối WebSocket:", err);
        // Trong môi trường thực tế, cần thêm logic thử reconnect ở đây!
    });

    // Logic chính: Vòng lặp gửi tin nhắn và duy trì sống
    // Chúng ta sẽ chạy vòng lặp này cho đến khi k6 kết thúc tải.
    while (connectionSuccessful) {
        try {
            // Mô phỏng việc định kỳ gửi các gói tin keep-alive hoặc dữ liệu user.
            const messageToSend = JSON.stringify({ 
                action: "keep_alive", 
                timestamp: Date.now() 
            });
            ws.send(messageToSend);

            // Tạm dừng để không làm quá tải CPU/Resource của máy chạy test
            sleep(1); // Chờ 1 giây trước khi gửi tin tiếp theo
        } catch (e) {
            // Nếu xảy ra lỗi trong vòng lặp, thoát khỏi luồng xử lý.
            console.error("Lỗi trong vòng lặp WS:", e);
            break;
        }
    }

    // 4. Dọn dẹp kết nối khi hoàn thành test case
    ws.close();
}


export let options = {
    vus: 50,             // Số lượng người dùng ảo (Virtual Users) - Bắt đầu với con số nhỏ
    duration: '30s',    // Thời gian chạy thử nghiệm
    ext: {
        loadimpact: {
            // Cấu hình thêm cho các kịch bản phức tạp hơn (ví dụ: gradient ramp-up)
        }
    }
};
```

***(Chú thích của Hoàng Hiệp):*** *Bạn thấy đấy, sự khác biệt cốt lõi ở đây không phải là việc gửi một request duy nhất, mà là việc thiết lập cả một **hệ thống lắng nghe (listener)** và một **vòng lặp liên tục (continuous loop)**. `ws.onmessage` cho phép chúng ta xử lý bất kỳ dữ liệu nào đến từ server (giả định đây là kịch bản bạn muốn test throughput của nó), trong khi vòng `while` mô phỏng hành vi client chủ động gửi keep-alive.*

## ✨ III. Các Kỹ Thuật Nâng Cao và Best Practices

Để bài kiểm thử mang tính học thuật và ứng dụng cao nhất, chúng ta cần vượt qua mức cơ bản:

### 1. Tăng cường Xử lý Tái Kết nối (Resilience Testing)

Trong thực tế, kết nối WS rất dễ bị ngắt (network hiccup). Một kịch bản test chuyên nghiệp phải mô phỏng điều này.

**Cách làm:** Thay vì chỉ gọi `ws.close()`, bạn nên bọc toàn bộ logic trong một hàm xử lý try-catch và thêm cơ chế *Exponential Backoff* cho việc kết nối lại.
*   **Mục tiêu đo lường:** Thời gian phục hồi (Recovery Time) của hệ thống sau khi gián đoạn mạng hoặc server bị khởi động lại tạm thời.

### 2. Stress Testing (Kiểm thử Quá tải)

Stress Test là ép hệ thống vượt qua giới hạn hoạt động bình thường của nó để tìm ra *điểm gãy* (breaking point).

**Cách làm:** Tăng dần số lượng `vus` (Virtual Users) trong k6 Script và chạy liên tục.
1.  Bắt đầu với 10 vus.
2.  Tăng lên 50, sau đó là 100, ... cho đến khi bạn thấy các chỉ số như *Error Rate* hoặc *Latency* tăng đột biến.
3.  Điểm mà hiệu suất bắt đầu suy giảm không phải là giới hạn chịu tải, mà là nơi bạn cần tối ưu hóa tài nguyên của server.

### 3. Phân tích Metrics (Những Chỉ Số Không Được Bỏ Qua)

Sau khi chạy k6, bảng báo cáo rất quan trọng. Với WS API, tôi đặc biệt chú ý đến:

| Metric | Ý nghĩa trong bối cảnh WS | Giá trị lý tưởng |
| :--- | :--- | :--- |
| **Latency (Average)** | Độ trễ nhận tin nhắn từ server/giữa các bước xử lý. | Càng gần 0 càng tốt (miligiây thấp). |
| **Throughput (msgs/s)** | Số lượng thông báo tối đa mà hệ thống có thể luân chuyển. | Phải vượt xa nhu cầu dự kiến của business. |
| **Error Rate** | Tỉ lệ lỗi kết nối, timeout, hoặc lỗi xử lý dữ liệu trên client side. | Bằng 0%. |
| **Connection Count** | (Metrics từ Monitoring Tool) Số lượng WS tối đa được duy trì thành công trong thời gian test. | Phải bằng với `vus` và ổn định. |

## ✅ IV. Kết Luận: Tầm Quan Trọng Của QE Trong Hệ Thống Thời Gian Thực

Kiểm thử hiệu năng cho WebSocket API không chỉ là chạy script và xem con số RPS (Requests Per Second). Nó là việc xác minh tính *ổn định*, *khả năng phục hồi* và *tốc độ truyền tải tối đa* của luồng dữ liệu theo thời gian.

Là một QE Lead, tôi luôn nhắc nhở đội ngũ rằng: Nếu API của bạn không hoạt động tốt khi dưới áp lực cao nhất, thì nó sẽ thất bại ngay khi có lượng người dùng đột biến vào dịp sale lớn hoặc sự kiện quan trọng.

Bằng việc sử dụng k6 và tư duy kiểm thử theo vòng đời kết nối (Connection Lifecycle Testing), chúng ta không chỉ tìm ra các nút thắt cổ chai về tài nguyên mà còn xây dựng được sự tự tin rằng sản phẩm sẽ hoạt động mượt mà, ổn định 24/7—yêu cầu bắt buộc của bất kỳ hệ thống thời gian thực nào.

Chúc các bạn thành công trong việc đảm bảo chất lượng cho các giải pháp hiện đại!

***
**Hoàng Hiệp**
*Quality Engineering Lead*
*(Một góc nhìn về độ vững chắc của phần mềm)*