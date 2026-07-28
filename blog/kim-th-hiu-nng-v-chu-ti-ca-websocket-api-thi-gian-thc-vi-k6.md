---
title: "Kiểm thử hiệu năng và độ chịu tải của WebSocket API thời gian thực với k6"
date: 2026-02-23
description: "Khám phá phương pháp chuyên sâu để kiểm tra khả năng mở rộng (scalability) và độ bền bỉ của các API thời gian thực sử dụng k6, vượt qua giới hạn của các công cụ truyền thống."
tags: ["Performance","k6","WebSocket"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hoàng Hiệp"
---

# Kiểm thử hiệu năng và độ chịu tải của WebSocket API thời gian thực với k6

Chào các đồng nghiệp trong lĩnh vực Chất lượng Phần mềm! Tôi là Hoàng Hiệp, một Quality Engineer chuyên sâu về tự động hóa kiểm thử hiệu năng.

Trong kỷ nguyên kỹ thuật số hiện đại, các ứng dụng không còn hoạt động theo mô hình Client-Server Request/Response (REST) truyền thống nữa. Sự trỗi dậy của các trải nghiệm người dùng *thời gian thực* (real-time) đã đưa WebSocket trở thành một tiêu chuẩn vàng cho giao tiếp tức thời—từ chat app, thị trường tài chính, đến game trực tuyến.

Tuy nhiên, việc kiểm thử khả năng chịu tải (Load Testing) và hiệu năng của các kết nối WebSocket lại là một thách thức lớn đối với nhiều đội ngũ QA. Các công cụ truyền thống như JMeter thường được thiết kế cho HTTP Request/Response, gặp khó khăn khi xử lý bản chất *stateful* (trạng thái liên tục) và băng thông dữ liệu hai chiều vô hạn của WS.

Bài viết này là hướng dẫn chuyên sâu nhất của tôi về cách tận dụng sức mạnh của **k6** để thực hiện kiểm thử hiệu năng WebSocket một cách khoa học, chính xác, và mang tính thực chiến cao.

---

## 💡 I. Tại sao k6 lại phù hợp với WebSocket Testing?

WebSocket hoạt động dựa trên việc duy trì một kênh giao tiếp TCP *mở* (Persistent Connection). Điều này có nghĩa là chúng ta không chỉ đo lường độ trễ của một yêu cầu, mà chúng ta đang đo lường:
1. Khả năng thiết lập hàng nghìn kết nối đồng thời (Connection Scalability).
2. Tần suất xử lý tin nhắn qua kênh mở (Throughput Measurement).
3. Độ ổn định và khả năng chịu tải khi mất kết nối rồi tự khôi phục (Resilience).

**k6**, được xây dựng trên Go và sử dụng JavaScript/Go-scripting, cung cấp một môi trường kiểm thử hiện đại, hiệu suất cao, và quan trọng nhất là cho phép chúng ta mô phỏng các logic phức tạp của phiên giao tiếp liên tục (stateful sessions) dễ dàng hơn nhiều so với các công cụ dựa trên GUI truyền thống.

## 🛠️ II. Thiết lập và Nguyên tắc chung

### A. Các yêu cầu cần chuẩn bị
1. **Node.js/npm:** Môi trường chạy k6.
2. **k6:** Cài đặt qua npm (`npm install -g k6`).
3. **WebSocket Endpoint:** API WebSocket mà bạn muốn kiểm thử (ví dụ: `ws://localhost:8080/chat`).

### B. Mô hình kiểm thử (Test Flow)
Một kịch bản kiểm thử hiệu năng WS hoàn hảo phải đi qua các bước sau, mô phỏng hành vi của người dùng thực tế:
1. **Handshake & Connect:** Thiết lập kết nối WebSocket.
2. **Initialization (Optional):** Gửi thông tin định danh ban đầu (token, user ID) để API xác thực trạng thái phiên.
3. **Steady State Messaging:** Mô phỏng luồng dữ liệu liên tục theo một tần suất nhất định (ví dụ: mỗi 50ms gửi 1 tin nhắn).
4. **Ramp Down/Cleanup:** Đóng kết nối sau khi hoàn thành kiểm thử để đo lường tài nguyên giải phóng.

## 🚀 III. Triển khai kịch bản kiểm thử WebSocket bằng k6

Vì đặc thù của WebSocket, chúng ta không thể dùng các hàm `http.request` thông thường. Chúng ta cần sử dụng khả năng scripting mạnh mẽ của JavaScript kết hợp với tính năng hỗ trợ WS của k6 (thường đòi hỏi phải xử lý Promise và Async/Await).

Dưới đây là một ví dụ mô phỏng logic gửi-nhận liên tục:

```javascript
// load_ws.js - Kịch bản kiểm thử WebSocket hiệu năng
import { check, sleep } from 'k6';
import { WebSocket } from 'k6/x/websocket'; // Lưu ý: Sử dụng module thích hợp cho k6 phiên bản của bạn

export const options = {
    vus: 500,            // Số lượng người dùng ảo (Virtual Users) đồng thời
    duration: '2m',      // Thời gian chạy kiểm thử là 2 phút
    thresholds: {
        'data_sent': ['rate>80%'], // Tỷ lệ gửi dữ liệu thành công > 80%
        'latency': ['p(95)<100'],  // 95% độ trễ phải dưới 100ms
    },
};

let ws; // Biến toàn cục lưu trữ kết nối WebSocket

export function setup() {
    console.log('--- Bắt đầu thiết lập kịch bản WS ---');
    const uri = 'ws://localhost:8080/ws'; 
    try {
        // 1. Thiết lập kết nối WS
        ws = new WebSocket(uri);

        // Xử lý sự kiện khi kết nối thành công (On Open)
        ws.onopen = () => {
            console.log('✅ Kết nối WebSocket đã được thiết lập.');
            // 2. Gửi tin nhắn khởi tạo ngay sau khi connect
            ws.send(JSON.stringify({ type: "AUTH", token: "fake_jwt_token" }));
        };

        // Xử lý sự kiện nhận tin (On Message)
        ws.onmessage = (event) => {
            console.log(`🔔 Nhận được dữ liệu: ${event.data}`);
            // Trong bài test thực tế, ta sẽ đo độ trễ xử lý và lưu trữ metrics ở đây
        };

        // Xử lý lỗi kết nối (On Error) - Rất quan trọng trong kiểm thử tải!
        ws.onerror = (error) => {
             console.error(`❌ Lỗi WebSocket: ${error.message}`);
        };
    } catch (e) {
        console.error('Không thể thiết lập WebSocket:', e);
    }

    // Bắt buộc phải return để setup function hoạt động trong k6
    return { ws }; 
}

export default function () {
    if (!ws || ws.readyState !== 'OPEN') {
         // Nếu kết nối chưa mở, chờ và bỏ qua vòng lặp này
        sleep(1); 
        return;
    }
    
    // --- CORE LOGIC: Mô phỏng việc gửi dữ liệu liên tục ---

    const message = JSON.stringify({ type: "DATA", payload: Math.random() });
    ws.send(message); // Gửi tin nhắn
    
    // Chúng ta chờ một chút để mô phỏng khoảng thời gian giữa các sự kiện (ví dụ: 100ms)
    sleep(0.1); 

    check('WS Connection Status', {
        'Is connection open': () => ws.readyState === 'OPEN',
    });
}

export function teardown(data) {
    console.log('\n--- Kết thúc kiểm thử và đóng kết nối ---');
    if (ws && ws.readyState !== 'CLOSED') {
        // Đảm bảo rằng chúng ta chủ động đóng phiên WS để k6 có thể đo lường tài nguyên giải phóng
        ws.close(); 
        console.log('✅ WebSocket connection đã được đóng thành công.');
    }
}

```

### Giải thích chi tiết của Hoàng Hiệp:

1. **`export function setup()`**: Đây là giai đoạn *khởi tạo trạng thái* (State Setup). Trong bài test hiệu năng WS, việc kết nối phải xảy ra trước khi vòng lặp load chính bắt đầu. Tôi đã định nghĩa logic `onopen`, `onmessage`, và `onerror` ngay tại đây để đảm bảo rằng mỗi Virtual User (VU) đều có một phiên giao tiếp đầy đủ trước khi chịu tải.
2. **`ws = new WebSocket(uri)`**: Đây là dòng lệnh cốt lõi, nó thiết lập kết nối *bất đồng bộ* giữa k6 và API của bạn.
3. **`export default function()`**: Vòng lặp load chính. Ở đây, chúng ta không chỉ gọi `sleep()`. Thay vào đó, việc gửi tin nhắn (`ws.send(message)`) là hành vi mô phỏng luồng dữ liệu *thực tế* mà người dùng đang tương tác (ví dụ: người dùng gõ chữ ra chat).
4. **`export function teardown()`**: Giai đoạn này cực kỳ quan trọng. Bạn không thể chỉ để k6 kết thúc; bạn phải chủ động gọi `ws.close()`. Điều này cho phép ta đo lường hiệu năng của quá trình ngắt kết nối (cleanup time) và giải phóng tài nguyên (resource release).

## 📊 IV. Các Metrics quan trọng cần theo dõi khi test WS

Khi chạy kịch bản trên, đừng chỉ nhìn vào các con số Pass/Fail. Là QE Lead, bạn phải chú ý đến những metrics sau:

1. **Connection Stability Rate:** Tỷ lệ người dùng ảo duy trì kết nối thành công trong suốt thời gian tải. (Nếu tỷ lệ này giảm mạnh khi VU tăng, hệ thống của bạn gặp vấn đề về giới hạn tài nguyên OS/Socket).
2. **Message Throughput (TPS):** Tổng số tin nhắn mà API xử lý được trên mỗi giây *trong điều kiện tải cao nhất*. Đây là chỉ số quan trọng nhất cho khả năng mở rộng.
3. **P95 Latency (Phân tích độ trễ 95th Percentile):** Độ trễ của các luồng dữ liệu trong khoảng thời gian bình thường (không phải lúc hệ thống quá tải). Nếu P95 cao, nghĩa là *hầu hết* người dùng đều trải qua tình trạng giật lag.
4. **Error Rates:** Theo dõi tỷ lệ lỗi kết nối (`onerror` callback) hoặc lỗi xác thực token.

## 🧠 V. Tóm tắt các Best Practices từ góc nhìn QE Lead

1. **Test Scenarios phải đa dạng:** Đừng chỉ test luồng dữ liệu thành công. Hãy tạo kịch bản mô phỏng mất mạng (thực hiện disconnect cưỡng bức và đo khả năng tự reconnect của client/server).
2. **Xác thực State sau khi Load:** Sau khi chạy tải, hãy kiểm tra xem các phiên người dùng có giữ được trạng thái đã đăng nhập hay không, hay chúng bị văng ra do lỗi bộ nhớ (Memory Leak) hoặc timeout session?
3. **Sử dụng Data Parameterization:** Thay vì hardcode token/ID, luôn truyền tham số qua file dữ liệu CSV để mô phỏng hàng nghìn người dùng độc lập và thực tế nhất.

---

Kiểm thử WebSocket không chỉ là chạy load test; nó là một bài toán về *kiến trúc hệ thống* dưới góc độ chất lượng phần mềm. Bằng việc làm chủ k6, chúng ta có thể đưa ra những báo cáo hiệu năng cực kỳ thuyết phục, giúp đội ngũ phát triển xây dựng nên những sản phẩm thời gian thực vững chắc và đáng tin cậy.

Chúc các bạn thành công trong hành trình tối ưu hóa trải nghiệm người dùng!

**Hoàng Hiệp**
*Quality Engineering Lead | Performance & Scalability Expert*