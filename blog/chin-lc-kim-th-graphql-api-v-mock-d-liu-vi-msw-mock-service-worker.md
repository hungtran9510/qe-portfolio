---
title: "Chiến lược kiểm thử GraphQL API và Mock dữ liệu với MSW (Mock Service Worker)"
date: 2026-06-19
description: "Khám phá chiến lược tiên tiến để cô lập và kiểm thử các GraphQL API phức tạp bằng sức mạnh của MSW, đảm bảo môi trường test ổn định tuyệt đối."
tags: ["API Testing","GraphQL","MSW"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# Chiến lược kiểm thử GraphQL API và Mock dữ liệu với MSW (Mock Service Worker)

Chào các đồng nghiệp trong lĩnh vực Chất lượng Phần mềm! Tôi là Duy Trung, và hôm nay chúng ta sẽ đi sâu vào một chủ đề cực kỳ quan trọng nhưng cũng thường gây nhiều đau đầu: **Làm thế nào để kiểm thử các API phức tạp như GraphQL một cách cô lập (isolated) và đáng tin cậy?**

Trong kiến trúc microservices hiện đại, GraphQL đang là lựa chọn hàng đầu nhờ khả năng *fetching* dữ liệu tối ưu. Tuy nhiên, bản chất của nó—gửi một query duy nhất đến một điểm cuối (endpoint) và nhận về cấu trúc JSON linh hoạt—lại tạo ra thách thức lớn cho việc kiểm thử: **Làm sao để tôi giả lập response dữ liệu mà không phụ thuộc vào trạng thái backend thực tế?**

Nếu bạn đang phải đối mặt với những bài test chậm chạp, giật cục vì sự thay đổi của hệ thống backend, thì bài viết này chính là dành cho bạn. Chúng ta sẽ tìm hiểu cách sử dụng **Mock Service Worker (MSW)** để giải quyết triệt để vấn đề đó.

***

## 💡 I. Hiểu rõ vấn đề: Tại sao GraphQL cần một chiến lược Mocking tinh vi?

Khi chúng ta nói về việc kiểm thử API, mục tiêu cao nhất là **tính cô lập (Isolation)**. Khi test component A, nó phải hoàn toàn không bị ảnh hưởng bởi lỗi hay thay đổi của component B hoặc service C.

### 📚 Thách thức với GraphQL:

1.  **Single Endpoint Syndrome:** Hầu hết các GraphQL API đều sử dụng một endpoint duy nhất (ví dụ: `/graphql`) và phương thức POST. Bạn không thể đơn giản mock theo đường dẫn (`/users` hay `/products`) như REST API.
2.  **Payload Dependence:** Dữ liệu response phụ thuộc hoàn toàn vào nội dung của *query* được gửi trong body request. Nếu bạn chỉ mock chung chung, bạn sẽ bỏ sót các trường hợp test cụ thể (ví dụ: khi query này yêu cầu `User` và `Posts`, nhưng query kia chỉ cần `User`).
3.  **Network Level Interception:** Việc dùng các thư viện mock ở cấp độ bộ nhớ JavaScript thuần túy (ví dụ: Jest Mock Functions) thường không đủ mạnh, vì nó bỏ qua toàn bộ quá trình tương tác mạng thực tế (fetch, axios).

Đây là nơi **Mock Service Worker (MSW)** xuất hiện.

***

## 🧠 II. Giải pháp tối ưu: Sức mạnh của MSW

**MSW là gì?**
Thay vì mock các hàm gọi API trong code của bạn, MSW hoạt động ở cấp độ mạng (Network Layer). Nó sử dụng kỹ thuật Service Worker để **ngăn chặn và đánh chặn (intercept)** mọi yêu cầu fetch/XHR *trước khi* chúng rời khỏi trình duyệt hoặc môi trường Node.js test runner.

**Tại sao nó phù hợp với GraphQL?**
Vì MSW mô phỏng lại toàn bộ quá trình hoạt động của mạng thực tế, nó cho phép bạn:
1.  Giả lập response dữ liệu chính xác (HTTP status, Headers).
2.  Kiểm soát hoàn toàn nội dung payload được trả về, bất kể request query phức tạp thế nào.

Nói cách khác, khi code của bạn gọi `fetch('/graphql', { body: JSON_PAYLOAD })`, MSW sẽ "ngồi" ở giữa và nói: *"Tôi nhận được yêu cầu này, nhưng thay vì chuyển nó đến backend thật, tôi sẽ trả về cái data giả lập mà tôi đã định nghĩa cho bạn."*

***

## 🛠️ III. Chiến lược triển khai thực tế (Hands-on Strategy)

Chúng ta cần một chiến lược Mocking đa tầng: **Lắng nghe Request $\rightarrow$ Phân tích Query $\rightarrow$ Trả về Data.**

Hãy xem xét cấu trúc cốt lõi của việc thiết lập MSW cho GraphQL.

### 1. Setup Cơ bản (Defining the Interceptor)

Trong file định nghĩa handler mock của bạn (`src/mocks/handlers.js`):

```javascript
// handlers.js
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.requestHandler((req, res, ctx) => {
    // 1. Kiểm tra xem request có phải là POST tới /graphql không?
    if (req.method === 'POST' && req.url.pathname === '/graphql') {
      const body = JSON.parse(atob(req.body)); // GraphQL thường gửi Base64 encoded
      const queryName = body.operationName;
      const variables = body.variables || {};

      // 2. Phân tích Query và xử lý logic Mocking ở đây
      if (queryName === 'GetUserProfile') {
        // Trả về data cụ thể cho Profile
        return res(ctx.status = 200, ctx.json({
          data: {
            user: {
              id: variables.userId || 'mock-1',
              username: "JaneDoe",
              email: "jane@example.com"
            }
          }
        }));
      }

      // 3. Xử lý trường hợp không khớp query nào (hoặc lỗi)
      return res(ctx.status = 400, ctx.json({ errors: [{ message: 'Unsupported query' }] }));
    }

    // Nếu là endpoint khác, để nó qua bình thường (fallback)
    return res(ctx);
  }),
];
```

**Giải thích của Duy Trung:**

1.  **`http.requestHandler((req, res, ctx) => { ... })`**: Đây là lõi của MSW. Nó nhận đối tượng `req` (Request) và `res` (Response), cho phép bạn kiểm soát mọi khía cạnh từ việc bắt request đến định hình response.
2.  **Kiểm tra Header & Method:** Chúng ta phải xác minh rằng yêu cầu khớp với cả phương thức (`POST`) và đường dẫn (`/graphql`).
3.  **Phân tích Body (The Magic):** Điểm mấu chốt là đọc `req.body`. Trong các môi trường thực tế, bạn cần giải mã Base64 nếu API của bạn gửi payload encoded. Sau đó, bạn phải truy cập vào `operationName` hoặc phân tích chuỗi query (`query`) để biết chính xác client đang hỏi gì.
4.  **Điều kiện Mocking:** Thay vì một response cố định, chúng ta dùng logic `if (queryName === 'GetUserProfile')`. Điều này giúp chúng ta tạo ra các mock theo kịch bản: *Nếu client chạy test A với query X, tôi sẽ trả về data Y*.

### 2. Test Case Thực tế (Testing the Interception)

Giả sử bạn có một component React/Vue gọi hàm `fetchUser(userId)` qua GraphQL Client (`Apollo` hoặc `Relay`).

```javascript
// UserProfileComponent.test.js
import { render, screen } from '@testing-library/react';
import { serverWorker } from '../mocks/serverWorker'; // Khởi tạo MSW
import UserProfileComponent from './UserProfileComponent';

// Thiết lập MSW interceptor trước khi chạy test suite
beforeAll(() => serverWorker);
afterAll(() => serverWorker.resetHandlers());


test('Should display user profile data when GetUserProfile is queried successfully', async () => {
    // Giả sử hàm này gọi GraphQL: query GUser(userId: "123") {}
    render(<UserProfileComponent />);

    // Mocked data sẽ được trả về bởi MSW handler ở trên.
    // Chúng ta chỉ cần đợi và kiểm tra UI dựa trên mock đó.
    await waitFor(() => {
        expect(screen.getByText('Username: JaneDoe')).toBeInTheDocument();
        expect(screen.getByText('Email: jane@example.com')).toBeInTheDocument();
    });
});

test('Should display an error message if the GraphQL query fails or returns null', async () => {
    // Ở đây, chúng ta tạm thời override handler để mô phỏng lỗi 400 từ backend.
    serverWorker.use(
        http.requestHandler((req, res) => {
            return res(ctx.status = 400, ctx.json({ errors: [{ message: 'User not found' }] }));
        })
    );

    render(<UserProfileComponent />);

    await waitFor(() => {
        expect(screen.getByText(/Error: User not found/i)).toBeInTheDocument();
    });
});
```

**Điểm nổi bật cần ghi nhớ:** Khi bạn gọi `serverWorker.use(...)` trong test, bạn đang **tạm thời thay thế (override)** logic mocking ban đầu, giúp bạn kiểm tra các kịch bản khác nhau mà không làm ảnh hưởng đến các test case còn lại—đây là cốt lõi của việc kiểm thử cô lập!

***

## ✨ IV. Tóm tắt và Lời khuyên từ QE Lead Duy Trung

Việc tích hợp GraphQL với MSW không chỉ là một mẹo vặt công nghệ, mà nó là sự thay đổi về tư duy kiến trúc test. Thay vì view API như các hàm gọi đơn lẻ (mock functions), chúng ta phải coi nó là một **hệ thống mạng mô phỏng hoàn chỉnh**.

### ✅ Những điều cần lưu ý khi áp dụng:

1.  **Sự phức tạp của Decoding:** Luôn kiểm tra cách client của bạn gửi request body (Base64, JSON string hay Binary). Handler MSW của bạn phải được viết để giải mã nó chính xác.
2.  **Phân lớp Mocking:** Đừng nhồi tất cả logic mock vào một file duy nhất. Hãy chia handler theo các module nghiệp vụ lớn (UserHandler, ProductHandler) để dễ bảo trì và kiểm thử.
3.  **Mocking State & Cache:** Đối với những API phức tạp sử dụng caching hoặc state management ở phía server (ví dụ: GraphQL Relay), bạn cần đảm bảo rằng logic mock của mình tái tạo được hành vi đó trong test (Ví dụ: Nếu `Query A` thay đổi data, thì lần gọi tiếp theo phải thấy sự khác biệt).
4.  **Tự động hóa và Tái sử dụng:** Sau khi thiết lập một bộ handlers cơ bản, hãy biến nó thành các hàm helper để việc thiết lập mock cho từng feature mới trở nên nhanh chóng và nhất quán nhất.

Áp dụng chiến lược này, bạn sẽ thấy các bài kiểm thử của mình không chỉ chạy nhanh hơn mà quan trọng hơn là **độ tin cậy (reliability)** được nâng lên mức tối đa. Giờ đây, bạn có thể tự tin xây dựng những bộ test GraphQL robust, kể cả khi backend vẫn đang trong giai đoạn phát triển!

Chúc các đồng nghiệp luôn thành công và viết ra những code chất lượng cao nhất!