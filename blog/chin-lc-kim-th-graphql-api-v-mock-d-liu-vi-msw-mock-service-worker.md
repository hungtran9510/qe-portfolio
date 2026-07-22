---
title: "Chiến lược kiểm thử GraphQL API và Mock dữ liệu với MSW (Mock Service Worker)"
date: 2026-06-17
description: "Hướng dẫn chuyên sâu chiến lược kiểm thử các endpoint GraphQL phức tạp bằng cách mô phỏng mạng hoàn toàn bằng Mock Service Worker (MSW)."
tags: ["API Testing","GraphQL","MSW","Testing Strategy"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# Chiến lược kiểm thử GraphQL API và Mock dữ liệu với MSW (Mock Service Worker)

Xin chào các đồng nghiệp trong cộng đồng chất lượng! Tôi là Duy Trung, và trong vai trò một QE Lead, tôi nhận thấy việc viết test case cho các API backend hiện đại luôn đi kèm với những thách thức riêng. Trong số đó, GraphQL là một "ngôi sao sáng" về tính linh hoạt nhưng cũng là một "hộp đen" khi nói đến kiểm thử mạng (network testing).

Nếu bạn đã quen thuộc với REST APIs vốn yêu cầu xác minh qua các đường dẫn URL (`/users/{id}`) rõ ràng và các phương thức HTTP khác nhau, thì việc chuyển sang GraphQL có thể gây bối rối. Bởi lẽ, hầu hết các query GraphQL đều được gửi qua một endpoint POST duy nhất (ví dụ: `/graphql`), với toàn bộ yêu cầu nằm ẩn sâu trong body JSON.

Làm thế nào để viết unit test hay integration test mô phỏng hành vi của network mà không cần phụ thuộc vào môi trường backend thật? Bài viết này, tôi sẽ chia sẻ chiến lược kiểm thử cực kỳ hiệu quả bằng cách sử dụng **Mock Service Worker (MSW)**.

***

## 💡 Phần I: Tại sao chúng ta cần MSW khi làm việc với GraphQL?

Trước hết, hãy cùng hiểu về vấn đề và giải pháp.

### ⚠️ Vấn đề: Sự mong manh của Network Dependency

Khi xây dựng ứng dụng Frontend, các test case lý tưởng phải là **deterministic** (xác định) – tức là kết quả chạy thử nghiệm luôn giống nhau, bất kể trạng thái mạng hay dịch vụ backend có đang hoạt động tốt hay không.

Nếu chúng ta để code gọi trực tiếp đến API thực tế trong quá trình Unit/Integration Testing:
1.  **Test bị chậm:** Phải chờ đợi phản hồi từ server thật.
2.  **Test bị gián đoạn (Flaky):** Nếu backend gặp sự cố, test của bạn sẽ thất bại, và việc debug có thể nhầm lẫn giữa lỗi logic code và lỗi mạng.

### ✨ Giải pháp: Mock Service Worker (MSW)

**Mock Service Worker (MSW)** là một thư viện tiên tiến cho phép chúng ta *giả lập* các yêu cầu API ở cấp độ service worker của trình duyệt hoặc Node.js Network Stack. Thay vì chỉ mock phần response dữ liệu (như các thư viện mocking truyền thống), MSW mô phỏng toàn bộ cơ chế network request/response, khiến ứng dụng của bạn hoàn toàn nghĩ rằng nó đang giao tiếp với một backend thực thụ, dù trên thực tế, tất cả đều là "bóng ma" được tạo ra từ mã giả lập.

**Lợi ích cốt lõi:** Test case của bạn không hề biết rằng API call này đã bị chặn và trả về dữ liệu mô phỏng; nó chỉ nhận được dữ liệu mong muốn một cách tức thời.

***

## ⚙️ Phần II: Tích hợp MSW với GraphQL - Thách thức Payload Body

GraphQL làm tăng độ phức tạp cho việc mocking network vì hai lý do chính:
1.  **Endpoint đơn nhất:** Tất cả đều là POST đến `/graphql`.
2.  **Payload động (Dynamic Body):** Dữ liệu query được gửi trong phần body JSON, và nội dung của body này chứa cấu trúc GraphQL query rất phức tạp.

MSW phải được thiết lập để không chỉ *bắt* yêu cầu POST đó mà còn phải *kiểm tra nội dung* của body request để biết mình đang đối mặt với query nào (ví dụ: `getUsers`, `getProductDetails`).

### 🛠️ Ví dụ thực chiến: Thiết lập Handler MSW cho GraphQL

Giả sử chúng ta có một service API sau:
**Query:** Lấy danh sách người dùng.
```graphql
query GetUsers {
  users {
    id
    username
    email
  }
}
```
Chúng ta cần thiết lập MSW để nó chỉ kích hoạt khi nhận được payload chứa `GetUsers`.

#### 1. Cấu hình Handlers trong Jest/Vitest (Ví dụ: `src/mocks/handlers.js`)

Trong môi trường test, chúng ta sẽ sử dụng hàm `http.post` của MSW và tận dụng khả năng kiểm tra body request bằng các điều kiện (conditional logic).

```javascript
// src/mocks/handlers.js
import { http, HttpResponse } from 'msw';

// 1. Định nghĩa Handler chung cho endpoint GraphQL
export const handlers = [
  http.post('https://api.myapp.com/graphql', async ({ request }) => {
    const jsonBody = await request.json();
    const query = jsonBody?.query;

    console.log(`[Mocking] Bắt được request với Query: ${query ? query.substring(0, 50) + '...' : 'N/A'}`);


    // 2. Xử lý Logic Mocking dựa trên nội dung GraphQL Query
    if (query && query.includes('GetUsers')) {
      // Đây là logic khi yêu cầu GetUsers được gửi tới
      const mockData = [
        { id: "u1", username: "alice_qa", email: "alice@corp.com" },
        { id: "u2", username: "bob_dev", email: "bob@corp.com" }
      ];

      // Trả về một response JSON mô phỏng cấu trúc GraphQL
      return HttpResponse.json({
          data: {
              users: mockData
          }
      }, { status: 200 }); // Thành công

    } else if (query && query.includes('GetUserById')) {
        // Ví dụ cho một query khác
        const variables = jsonBody?.variables;
        if (variables?.id === "u99") {
            return HttpResponse.json({
                data: { user: { id: "u99", username: "missing_user" } }
            }, { status: 200 });
        } else {
             // Mocking trường hợp dữ liệu không tồn tại (Business Logic Error)
             return new HttpResponse(null, { status: 404, body: JSON.stringify({ error: 'User not found' }) });
        }

    } else {
      // Fallback cho các query chưa được mock
       return HttpResponse.json({
          data: null,
          errors: [{ message: "Unsupported GraphQL query." }]
      }, { status: 400 });
    }
  }),
];
```

#### 2. Giải thích chuyên sâu của Duy Trung về đoạn code trên:

*   **`http.post('...', async ({ request }) => { ... })`**: Chúng ta khai báo rằng handler này sẽ bắt tất cả các yêu cầu POST đến đường dẫn `/graphql`. Việc sử dụng `async` và destructing `request` là chìa khóa để truy cập vào dữ liệu thô của network call.
*   **`const jsonBody = await request.json();`**: Đây là bước quan trọng nhất! Thay vì mock theo URL, chúng ta phải *đọc toàn bộ body* của yêu cầu HTTP (`request`) để trích xuất payload JSON chứa query và variables.
*   **`if (query && query.includes('GetUsers'))`**: Chúng ta sử dụng logic kiểm tra chuỗi (`includes()`) trên giá trị `query`. Điều này cho phép chúng ta phân biệt các loại query khác nhau ngay cả khi chúng cùng đi qua một endpoint POST duy nhất. Đây chính là kỹ thuật cốt lõi để mock GraphQL.
*   **`HttpResponse.json({...}, { status: 200 })`**: Chúng ta trả về cấu trúc dữ liệu JSON *giả lập* mà ứng dụng mong đợi từ API thực tế (ví dụ: `{ data: { users: [...] } }`). Việc duy trì cấu trúc này giúp giảm thiểu sai lệch giữa môi trường test và môi trường runtime.
*   **Xử lý lỗi (Error Handling)**: Trong ví dụ `GetUserById`, tôi đã thêm cả phần xử lý fallback khi ID không tồn tại, mô phỏng một trạng thái **Lỗi nghiệp vụ 404**. Điều này đảm bảo rằng unit test của bạn kiểm tra được luồng xử lý khi API thất bại về mặt logic (chứ không chỉ là lỗi mạng).

***

## ✅ Phần III: Best Practices và Chiến lược nâng cao cho QE Lead

Là một chuyên gia QA, tôi muốn nhấn mạnh thêm vài chiến lược để tối ưu hóa khả năng test với MSW.

### 1. Mocking Trạng thái và Cache (State Management)
Nếu luồng dữ liệu của bạn phụ thuộc vào trạng thái trước đó (ví dụ: "Lấy thông tin hồ sơ *của người dùng đã đăng nhập*"), đừng chỉ mock response một lần duy nhất. Hãy sử dụng biến toàn cục hoặc tham số trong test suite để điều chỉnh `mockData` giữa các bài test, mô phỏng luồng dữ liệu qua nhiều bước (multi-step flow).

### 2. Tách biệt Mocking theo Test Suite
Tuyệt đối không nên hardcode handlers chung cho tất cả các file test. Hãy gói gọn việc setup và cleanup MSW trong `beforeAll`/`afterEach` của file test đó để đảm bảo rằng một mock không vô tình ảnh hưởng đến test case khác (isolation).

### 3. Kiểm thử Tình huống Biên (Edge Cases)
Khi mock GraphQL, hãy tập trung vào các kịch bản mà API thực tế phức tạp:
*   **Timeout:** Mock response bị delay (`await new Promise(resolve => setTimeout(resolve, 5000))`). Test xem ứng dụng của bạn xử lý trạng thái chờ (loading state) và hết hạn (timeout) như thế nào.
*   **Rate Limiting:** Mock trả về lỗi HTTP 429 và kiểm tra cơ chế Exponential Backoff trong client.
*   **Thiếu quyền truy cập (Authorization):** Buộc MSW trả về response kèm theo `errors` array thay vì chỉ là status code 401, mô phỏng cách GraphQL thường báo cáo lỗi xác thực ở cấp độ payload.

***

## 🚀 Kết luận: Tăng cường sự tự tin cho QA

Việc làm chủ công cụ như Mock Service Worker không chỉ đơn thuần là một kỹ thuật coding; nó là bước tiến quan trọng trong việc nâng tầm chiến lược kiểm thử phần mềm của đội ngũ chúng ta. Nó giúp chúng ta giảm thiểu tối đa sự phụ thuộc vào môi trường network, đảm bảo rằng mọi test case chạy đều là **reliable** và **deterministic**.

Khi bạn đã nắm vững cách "cầm trịch" các lời gọi API bằng MSW, việc chuyển từ REST sang GraphQL sẽ không còn là rào cản công nghệ, mà chỉ còn là một sự thích nghi về tư duy kiểm thử.

Chúc các đồng nghiệp luôn thành công trong hành trình đảm bảo chất lượng phần mềm! Nếu có bất kỳ câu hỏi nào, đừng ngần ngại trao đổi cùng tôi nhé.

**Duy Trung**
*(QE Lead | Quality Advocate)*