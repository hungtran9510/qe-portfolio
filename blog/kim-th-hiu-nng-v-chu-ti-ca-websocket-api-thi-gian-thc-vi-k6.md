---
title: "Kiểm thử hiệu năng và độ chịu tải của WebSocket API thời gian thực với k6"
date: 2026-02-21
description: "Hướng dẫn chuyên sâu cách mô phỏng tải cao lên WebSocket bằng k6, đảm bảo tính ổn định và khả năng mở rộng cho các hệ thống thời gian thực."
tags: ["Performance","k6","WebSocket"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hoàng Hiệp"
---

# Kiểm thử hiệu năng và độ chịu tải của WebSocket API thời gian thực với k6

Chào các đồng nghiệp Quality Engineering, tôi là Hoàng Hiệp. Trong kỷ nguyên số hóa hiện nay, việc xử lý dữ liệu theo thời gian thực (real-time) đã trở thành yêu cầu bắt buộc đối với hầu hết các ứng dụng hiện đại—từ giao dịch tài chính đến trò chuyện trực tuyến và IoT. WebSocket API chính là xương sống của những hệ thống này, mang lại hiệu suất vượt trội so với kiến trúc HTTP truyền thống qua cơ chế kết nối bán hai chiều (full-duplex).

Tuy nhiên, đi kèm với tính năng mạnh mẽ đó là một thách thức lớn trong kiểm thử chất lượng: **Làm thế nào để mô phỏng tải cao lên các kết nối duy trì trạng thái (stateful connections) như WebSocket?**

Nếu bạn đang xây dựng hoặc bảo trì một hệ thống thời gian thực và chưa có quy trình kiểm thử hiệu năng nghiêm ngặt, bài viết này dành cho bạn. Chúng ta sẽ cùng nhau tìm hiểu cách sử dụng công cụ k6 mạnh mẽ để tiến hành các bài kiểm tra tải (Load Testing) và độ chịu tải (Stress Testing) chuyên sâu cho WebSocket API.

---

## 📘 I. Tại sao phải quan tâm đến Performance của WebSocket?

Khi chúng ta nói về hiệu năng của một API REST, người ta thường đo lường bằng thời gian phản hồi trung bình (Average Response Time). Nhưng với WebSocket, chúng ta đối mặt với các metric phức tạp hơn:

1. **Khả năng kết nối đồng thời (Concurrent Connections):** Hệ thống có thể duy trì hàng ngàn, thậm chí hàng chục nghìn phiên kết nối mà không bị rò rỉ bộ nhớ (memory leak) hay quá tải tài nguyên hệ điều hành?
2. **Throughput của tin nhắn:** Khi luồng dữ liệu lớn (ví dụ: giá chứng khoán thay đổi liên tục), tốc độ xử lý và gửi tin nhắn có duy trì được dưới áp lực cao không?
3. **Tính ổn định khi chịu tải đột biến (Stress Tolerance):** Khi số lượng người dùng nhảy từ 10 lên 10,000 trong vài giây, hệ thống có thể xử lý việc cấp phát tài nguyên nhanh chóng và ổn định không?

Các bài kiểm thử hiệu năng thông thường chỉ tập trung vào luồng dữ liệu qua HTTP. Nếu bỏ qua WebSocket, bạn đang đánh lừa bản thân về khả năng chịu tải thực tế của hệ thống.

## 💡 II. Nguyên tắc hoạt động của k6 với WebSocket

k6 là công cụ kiểm thử tải mã nguồn mở rất mạnh mẽ, được xây dựng trên Go và sử dụng JavaScript (WebAssembly) cho các script test. Về cơ bản, khi bạn test REST API bằng k6, nó gửi một yêu cầu HTTP và chờ phản hồi.

Với WebSocket, quá trình sẽ phức tạp hơn:

1. **Thiết lập Kết nối:** Client phải thực hiện bắt tay (handshake) qua giao thức HTTP để nâng cấp kết nối sang WS/WSS.
2. **Duy trì Trạng thái:** Sau khi thiết lập, k6 phải giữ phiên WebSocket này sống và lắng nghe các tin nhắn từ Server.
3. **Gửi Tin nhắn Chủ động:** Trong quá trình test, k6 sẽ chủ động gửi các payload (tin nhắn) theo một mô hình tải đã định trước.

k6 hỗ trợ native Websockets API cho phép chúng ta thực hiện chính xác chu trình này mà không cần dùng đến thư viện bên thứ ba phức tạp nào.

## 🛠️ III. Hướng dẫn Thực hành: Viết Test Script k6 WebSocket

Hãy cùng xem một ví dụ cụ thể về việc kiểm thử khả năng duy trì kết nối và xử lý luồng tin nhắn trên một WebSocket API giả định của chúng ta (ví dụ: `ws://localhost:8080/livefeed`).

### 1. Thiết lập k6 Test Script (`websocket_test.js`)

```javascript
import { check, sleep } from 'k6';
import { WebSocket } from 'k6/experimental/websocket';

// --- Cấu hình Kịch bản (Scenario) ---
export default function () {
    const ws = new WebSocket('ws://localhost:8080/livefeed');

    // 1. Bắt đầu lắng nghe kết nối và xử lý sự kiện mở
    ws.on('open', () => {
        console.log(`[INFO] Connection established successfully.`);
        // Sau khi kết nối thành công, ta gửi tin nhắn "join" để đăng ký kênh dữ liệu
        ws.send(JSON.stringify({ action: 'subscribe', channel: 'stock_updates' }));
    });

    // 2. Xử lý sự kiện nhận dữ liệu (Server gửi)
    ws.on('message', (data) => {
        // Kiểm tra định dạng và nội dung tin nhắn phản hồi từ Server
        try {
            const message = JSON.parse(data.toString());
            check(message, { 'Message format is valid': true });
            console.log(`[RECEIVED] Data: ${JSON.stringify(message)}`);
        } catch (e) {
            // Xử lý trường hợp data không phải JSON
            console.error(`Failed to parse message: ${data}`);
        }
    });

    ws.on('close', () => {
        console.log('[INFO] Connection closed.');
    });

    // 3. Giữ kết nối hoạt động và mô phỏng hành vi của người dùng
    // Trong k6, việc gọi sleep() sẽ giữ worker chờ cho đến khi hết thời gian đó.
    sleep(2); 
}


// --- Định nghĩa Load Test (Options) ---
export const options = {
    scenarios: [
        {
            name: 'WebSocket_Load',
            executor: 'constant-vus,constant-time', // Giữ hằng số người dùng và thời gian
            vus: 500,     // Số lượng Virtual Users (Người dùng ảo): 500 kết nối đồng thời
            duration: '2m', // Thời gian chạy test: 2 phút
        }
    ],
    thresholds: {
        'http_req_failed': ['rate<0.01'],      // Tỷ lệ lỗi (lỗi WebSocket) < 1%
        'ready': ['(' + 0 + ')']                // Đảm bảo tất cả VUs đã sẵn sàng kết nối
    }
};
```

### 2. Giải thích Chi tiết của Hoàng Hiệp về Code Script

#### A. Sử dụng `WebSocket` API (Quan trọng nhất)

Thay vì sử dụng các hàm HTTP tiêu chuẩn, chúng ta phải import và sử dụng lớp `WebSocket` được cung cấp bởi k6. Điều này cho phép script của chúng ta mô phỏng chính xác giao thức WebSocket.

#### B. Xử lý sự kiện (`ws.on('open')`, `ws.on('message')`)

Đây là phần cốt lõi trong kiểm thử thời gian thực. Trong thế giới thực, kết nối chỉ xảy ra *sau khi* người dùng truy cập trang. Chúng ta không thể biết chính xác bao giờ Server đã sẵn sàng. Do đó, chúng ta phải sử dụng các trình lắng nghe sự kiện (event listeners):

*   **`ws.on('open', ...)`:** Khi kết nối được thiết lập thành công (handshake pass), chúng ta phải thực hiện hành vi đầu tiên của người dùng—thường là gửi một tin nhắn đăng ký kênh (ví dụ: `{ action: 'subscribe' }`).
*   **`ws.on('message', ...)`:** Đây là nơi dữ liệu đến từ Server. Chúng ta *bắt buộc* phải bao gồm logic `check()` và xử lý lỗi (`try-catch`) tại đây để xác minh rằng các payload nhận được có đúng định dạng, không bị mất mát, và không gây ra sự cố trong luồng kiểm thử.

#### C. Mô hình Tải (The Load Model)

Trong script trên, chúng ta sử dụng `sleep(2)` kết hợp với việc lắng nghe tin nhắn. Điều này ngụ ý rằng sau khi thiết lập kết nối và đăng ký kênh, người dùng sẽ hoạt động thụ động, chờ dữ liệu cập nhật trong 2 giây trước khi vòng lặp tiếp theo bắt đầu (hoặc đợi đến hết thời gian `duration`).

**Lưu ý quan trọng:** Khi bạn test WebSocket, không phải mọi yêu cầu đều là HTTP Request. Metric chính của bạn là **Số lượng kết nối duy trì được (Concurrent Connections)** và **Thông lượng tin nhắn tối đa (Max Throughput/Message Rate)**. k6 sẽ tự động tính toán các chỉ số này khi script chạy ổn định.

## 🚀 IV. Những Lưu ý Nâng cao cho QE Lead

Là một chuyên gia chất lượng, tôi không chỉ dừng lại ở việc chạy test mà còn quan tâm đến cách bạn *thiết kế* và *phân tích* bài test. Dưới đây là ba mẹo nâng cao:

### 1. Mô phỏng Hồi quy Kết nối (Connection Flapping)
Trong thực tế, kết nối WebSocket có thể bị ngắt bởi các yếu tố mạng hoặc server cần refresh token. Một test case mạnh mẽ phải mô phỏng hành vi **Tự phục hồi** (Self-recovery).

*   **Cách làm:** Viết một cơ chế `retry` thủ công trong JavaScript: Nếu phát hiện sự kiện `close`, sau 3 giây, hãy thử gọi lại hàm kết nối và tái đăng ký kênh.
*   **Mục tiêu kiểm test:** Xác minh rằng khi API bị ngắt và reconnect, nó vẫn có thể phục hồi trạng thái (state) mà không mất dữ liệu hoặc yêu cầu người dùng đăng nhập lại.

### 2. Kiểm thử Payload Biến đổi (Variable Payloads)
Đừng bao giờ sử dụng một payload cố định cho toàn bộ bài test. Sự biến đổi của dữ liệu là yếu tố gây áp lực lớn nhất lên tầng xử lý và database.

*   **Giải pháp:** Sử dụng hàm `SharedArray` hoặc cấu trúc dữ liệu phức tạp hơn trong k6 để luân phiên các payload khác nhau (ví dụ: 1/3 tin nhắn giá cổ phiếu, 1/3 tin nhắn thông báo giao dịch, 1/3 tin nhắn chat).
*   **Mục tiêu:** Xác minh rằng logic parsing và xử lý dữ liệu của server hoạt động ổn định khi nhận nhiều loại cấu trúc dữ liệu khác nhau cùng lúc.

### 3. Tối ưu hóa Kịch bản Lặp lại (Scenario Optimization)
Nếu ứng dụng của bạn có các hành vi đa dạng:

*   **Nhóm A:** Kết nối $\rightarrow$ Chỉ lắng nghe (Thụ động).
*   **Nhóm B:** Kết nối $\rightarrow$ Gửi dữ liệu Periodically (Tương tác thường xuyên).
*   **Nhóm C:** Kết nối $\rightarrow$ Tương tác nặng (Ví dụ: Chatroom có nhiều gửi/nhận liên tục).

Bạn nên chia thành các kịch bản riêng biệt và kết hợp chúng bằng cú pháp `scenarios` trong k6. Điều này cho phép bạn cô lập được lỗi ở từng loại tải cụ thể, giúp debug chính xác hơn rất nhiều.

## 🏆 Kết luận của Hoàng Hiệp

Kiểm thử hiệu năng WebSocket không đơn thuần là việc chạy một con số VUs lớn lên API. Đó là quá trình mô phỏng hành vi phức tạp, duy trì trạng thái và kiểm tra khả năng phục hồi (resilience) dưới áp lực cực cao.

Việc tích hợp các công cụ hiện đại như k6 vào pipeline CI/CD của bạn để thực hiện các bài test WebSocket sẽ giúp đội ngũ phát triển tự tin hơn rất nhiều khi tung sản phẩm ra thị trường, đặc biệt với những ứng dụng yêu cầu độ trễ (latency) thấp và tính sẵn sàng cao.

Hãy bắt đầu từ những bước nhỏ nhất: Đảm bảo kịch bản của bạn bao gồm cả việc xử lý sự kiện `open`, `message` và `close`. Chúc các đồng nghiệp thành công trong hành trình đảm bảo chất lượng phần mềm!