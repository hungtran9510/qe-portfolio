---
title: "Kiểm thử hiệu năng và độ chịu tải của WebSocket API thời gian thực với k6"
date: 2026-02-14
description: "Hướng dẫn chuyên sâu từ QE Lead Hoàng Hiệp về cách sử dụng k6 để kiểm tra khả năng mở rộng, throughput và độ ổn định khi WebSockets hoạt động dưới tải trọng lớn."
tags: ["Performance","k6","WebSocket"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hoàng Hiệp"
---

# Kiểm thử hiệu năng và độ chịu tải của WebSocket API thời gian thực với k6

Chào mọi người, tôi là Hoàng Hiệp. Là một Quality Engineer, tôi nhận thấy rằng trong kiến trúc microservices hiện đại, các kênh giao tiếp thời gian thực (real-time communication) qua WebSockets đang trở nên cực kỳ phổ biến—từ hệ thống chat, thị trường tài chính trực tuyến, đến game online.

Tuy nhiên, sự khác biệt căn bản giữa một yêu cầu HTTP request/response ngắn ngủi và một kết nối WebSocket *bền bỉ* (persistent connection) lại tạo ra những thách thức lớn khi cần đo lường khả năng chịu tải. Một API có thể xử lý 100 người dùng ổn định trong vài giờ, nhưng sẽ sụp đổ chỉ với hàng nghìn người dùng đồng thời.

Bài viết này không chỉ là một hướng dẫn kỹ thuật đơn thuần; nó là một cẩm nang chuyên sâu từ góc độ của QE Lead về cách thiết lập các kịch bản kiểm thử hiệu năng (Performance Testing) và kiểm thử tải trọng (Load Testing) cho WebSockets API bằng công cụ mạnh mẽ, **k6**.

***

## ⚡ Phần I: Tại sao việc test WebSocket khác biệt?

Khi chúng ta thực hiện load test với RESTful API truyền thống, kịch bản chỉ cần mô phỏng chu trình Request $\rightarrow$ Response. Kết thúc phiên test là xong.

Với WebSockets, vấn đề phức tạp hơn nhiều:

1. **Kết nối Bền bỉ (Persistence):** Mỗi người dùng không tạo ra một yêu cầu ngắn hạn; họ duy trì một kết nối TCP liên tục. Load test phải mô phỏng việc *duy trì* hàng nghìn phiên socket này đồng thời.
2. **Thông lượng tin nhắn (Throughput):** Metric quan trọng nhất không chỉ là số lượng kết nối, mà là tốc độ truyền tải tin nhắn ($\text{Messages}/\text{second}$) mà hệ thống có thể duy trì trong suốt thời gian thử nghiệm.
3. **Trạng thái Kết nối và Lỗi:** Chúng ta phải kiểm tra khả năng phục hồi (resilience) của API khi một socket bị ngắt kết nối đột ngột, hoặc khi cần xử lý hàng loạt các sự kiện *reconnection* đồng bộ.

Nếu chúng ta chỉ đếm số lượng user connections mà bỏ qua việc đo lường tốc độ tin nhắn và độ trễ ($\text{Latency}$) trong phiên kết nối, bài test sẽ không mang lại giá trị thực tiễn.

## 🛠️ Phần II: Chuẩn bị k6 cho WebSockets

`k6`, với nền tảng JavaScript (và Go), được thiết kế để xử lý các tác vụ đồng thời phức tạp. Để test WS bằng `k6`, chúng ta cần vượt ra khỏi khuôn khổ của các lệnh HTTP và tập trung vào việc quản lý vòng đời kết nối socket và luồng dữ liệu liên tục.

### 2.1 Kiến thức nền tảng về k6 Scripting (JS)

Chúng ta sẽ sử dụng ngôn ngữ JavaScript để viết script kiểm thử vì nó cung cấp khả năng xử lý asynchronous và các module I/O cần thiết cho WebSockets.

**Mục tiêu:**
1. Kết nối đến WebSocket Endpoint ($WSS$).
2. Gửi một thông điệp ban đầu (ví dụ: `{"action": "auth", "token": "..."}`).
3. Lắng nghe phản hồi từ server và gửi các luồng dữ liệu giả lập liên tục để mô phỏng người dùng đang hoạt động.

### 2.2 Cấu trúc k6 Script mẫu (Code Insight)

Dưới đây là cấu trúc lý tưởng của một bài test WebSockets bằng `k6`. Xin lưu ý rằng việc triển khai WebSocket trong k6 đòi hỏi các thư viện hoặc API cụ thể hỗ trợ client socket, nhưng về mặt logic, nó tuân theo mô hình sau:

```javascript
// ==============================
// Kịch bản kiểm thử WS cơ bản
// ==============================
import { check, sleep } from 'k6';

export default function () {
    const wsUrl = "wss://your-websocket-api.com/ws";
    
    // 1. Thiết lập kết nối WebSocket
    let socket;
    try {
        socket = new WebSocket(wsUrl);
    } catch (e) {
        console.error("Failed to initialize WebSocket:", e);
        return;
    }

    // 2. Xử lý sự kiện mở (Connection Open) - Bước này là quan trọng nhất
    socket.onopen = () => {
        console.log(`[Client] Kết nối WS thành công. Bắt đầu giao dịch.`);
        
        // Thực hiện handshake hoặc gửi token auth ban đầu
        const initialAuthMessage = JSON.stringify({ action: "auth", token: "fake_jwt_token" });
        socket.send(initialAuthMessage);
    };

    // 3. Xử lý sự kiện nhận tin (Message Received)
    socket.onmessage = (event) => {
        const message = event.data;
        console.log(`[Client] Nhận tin: ${message}`);
        // Ở đây, ta có thể dùng kết quả này để tính toán độ trễ round-trip time
        // hoặc xác nhận rằng server đang truyền dữ liệu đúng định dạng.
    };

    // 4. Xử lý sự kiện đóng (Connection Close)
    socket.onclose = () => {
        console.log("[Client] Kết nối WS bị đóng.");
    };

    // 5. Mô phỏng luồng dữ liệu liên tục (Giả sử mỗi user gửi tin nhắn sau 2 giây)
    setTimeout(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            const messageToSend = JSON.stringify({ action: "send_heartbeat", payload: Date.now() });
            socket.send(messageToSend);
        }
    }, 2000);
};

// Cấu hình k6 để chạy Test (thay thế bằng cấu hình thực tế của bạn)
export const options = {
    vus: 100, // Số lượng Virtual Users/Kết nối đồng thời
    duration: '5m', // Thời gian chạy test
    thresholds: {
        // Thiết lập ngưỡng chấp nhận được cho độ trễ message (quan trọng!)
        'ws.response_time < 500ms': ['rate=0.99'], 
    }
};

```

### 2.3 Giải thích các đoạn mã quan trọng của Hoàng Hiệp

*   **`socket.onopen = () => { ... }`:** Đây là nơi chúng ta nên đặt logic *khởi tạo phiên*. Thay vì dùng `http.request()`, việc gửi tin nhắn xác thực phải được xử lý ngay khi kết nối socket được thiết lập thành công.
*   **`socket.onmessage = (event) => { ... }`:** Khi nhận được message, thay vì chỉ in ra console, QE cần trích xuất các thông số sau để đo lường hiệu năng: **timestamp của lúc nhận**, và nếu có thể, so sánh với timestamp gửi đi ban đầu để tính $\text{Latency}$.
*   **`setTimeout(...) / socket.send()`:** Chúng ta phải mô phỏng hành vi *người dùng hoạt động*. Nếu chúng ta chỉ kết nối và chờ đợi (Passive Test), chúng ta sẽ không kiểm tra được khả năng xử lý thông lượng tin nhắn khi mọi người đều gửi dữ liệu cùng lúc (Active Load Test).

## 🚀 Phần III: Tối ưu hóa chiến lược Stress Testing WS

Là một QE Lead, tôi không bao giờ chỉ dừng lại ở việc chạy script trên. Chúng ta phải suy nghĩ về các kịch bản thất bại và áp dụng kỹ thuật tấn công tải trọng có chủ đích.

### 3.1 Kỹ thuật "Heartbeat Flood" (Tấn công luồng dữ liệu)

Nếu API của bạn phụ thuộc vào kết nối duy trì, chỉ việc giữ kết nối thôi là chưa đủ. Bạn phải kiểm tra khả năng hệ thống xử lý một *lượng lớn thông tin liên tục*.

**Cách làm:**
1. Trong vòng lặp mô phỏng người dùng (như trong ví dụ trên), thay vì gửi 1 message sau mỗi 2 giây, hãy cấu hình để gửi **$N$ messages/second**.
2. Tăng dần $N$ từ 10 lên 100 lên đến giới hạn tối đa lý thuyết của server bạn mong đợi.

**Mục đích:** Phát hiện điểm bão hòa (Saturation Point) về mặt xử lý CPU và I/O network của API, chứ không chỉ là mất kết nối.

### 3.2 Kiểm tra "Connection Burst" (Khả năng mở rộng tức thời)

Đây là kịch bản tệ nhất: một lượng lớn người dùng cố gắng đăng nhập/kết nối cùng lúc khi hệ thống đang ở trạng thái tĩnh.

**Cách làm:**
1. Giữ `vus` (số lượng Virtual Users) bằng 0 hoặc một mức rất thấp trong thời gian dài.
2. Sau đó, sử dụng chức năng Ramp-up của k6 để tăng $VUs$ *cực nhanh* (ví dụ: từ 1 lên 5000 người dùng chỉ trong vòng 30 giây).

**Metric cần quan tâm:** Tốc độ phản hồi (connection time) và tỷ lệ lỗi (`rate`) khi hệ thống cố gắng cấp phát socket mới cho một lượng lớn kết nối cùng lúc. Nếu API bị tắc nghẽn ở bước xác thực ban đầu, nó sẽ thất bại ngay cả khi các tài nguyên sau đó còn dư thừa.

### 3.3 Phân tích logs và Metrics (Metrics Analysis)

Khi chạy xong test, bạn cần xem xét không chỉ Output của k6 mà còn là:

1. **System Logs:** Kiểm tra Web Server/API Gateway logs để tìm ra lỗi `Too many connections` hoặc luồng CPU đột ngột tăng cao.
2. **Network Monitoring:** Theo dõi tài nguyên mạng (bandwidth usage) trên máy chủ để xác định xem giới hạn tải có phải do băng thông hay bộ nhớ.

## 💡 Tổng kết của QE Lead Hoàng Hiệp

Kiểm thử hiệu năng cho WebSocket không chỉ là một nhiệm vụ kỹ thuật, mà còn là việc mô phỏng *hành vi người dùng thực tế* trong suốt vòng đời phiên làm việc của họ.

Nếu bạn đã sẵn sàng nâng cấp quy trình kiểm test thời gian thực của mình:
1. **Đừng bao giờ coi WebSockets chỉ là HTTP.** Hãy đối xử với nó như một luồng dữ liệu liên tục.
2. **Tập trung vào Throughput và Latency:** Đo lường số lượng tin nhắn được truyền đi/nhận về mỗi giây, và độ trễ từ lúc gửi đến lúc nhận (Round Trip Time).
3. **Sử dụng các kịch bản tấn công tải trọng có chủ đích:** Vừa kiểm tra *số lượng kết nối* (Load), vừa kiểm tra *tốc độ dữ liệu* (Stress/Flood) và *khả năng phục hồi* (Resilience).

Hy vọng những chia sẻ này của tôi giúp đội ngũ QA của bạn xây dựng được các kịch bản kiểm thử WebSocket mạnh mẽ, chính xác và mang lại giá trị tối đa cho sản phẩm. Happy Testing!