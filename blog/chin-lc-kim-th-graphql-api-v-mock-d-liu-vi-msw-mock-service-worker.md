---
title: "Chiến lược kiểm thử GraphQL API và Mock dữ liệu với MSW (Mock Service Worker)"
date: 2026-06-17
description: "Khám phá cách xây dựng chiến lược kiểm thử mạnh mẽ cho GraphQL bằng MSW, đảm bảo các bài test unit/integration không phụ thuộc vào backend thực tế."
tags: ["API Testing","GraphQL","MSW"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# Chiến lược kiểm thử GraphQL API và Mock dữ liệu với MSW (Mock Service Worker)

Xin chào các đồng nghiệp, tôi là Duy Trung. Là một Quality Engineer đã có nhiều năm kinh nghiệm trong việc bảo đảm chất lượng hệ thống Microservices phức tạp, tôi nhận thấy rằng giai đoạn kiểm thử frontend khi làm việc với các API hiện đại thường gặp phải nút thắt cổ chai lớn nhất: **sự phụ thuộc vào môi trường backend**.

GraphQL là một công cụ mạnh mẽ để giải quyết vấn đề Over-fetching và Under-fetching dữ liệu. Tuy nhiên, chính tính chất linh hoạt này cũng đặt ra thách thức cho việc kiểm thử tự động (automated testing). Bài viết này sẽ đi sâu vào một chiến lược thực tế: làm thế nào để kết hợp GraphQL với mô hình Mocking tiên tiến nhất hiện nay – **Mock Service Worker (MSW)** – để đạt được bộ test unit và integration vừa mạnh mẽ, lại cực kỳ ổn định.

---

## 🎯 1. Tại sao cần Mocking trong kiểm thử GraphQL?

Trước khi đi vào giải pháp, chúng ta cần hiểu rõ vấn đề:

### Vấn đề của Testing Against Live Backend
Khi bạn viết một bài test component React hoặc Vue, nếu nó gọi trực tiếp đến API backend (ví dụ: `/graphql`), thì bài test đó không còn là *unit test* thuần túy nữa. Nó trở thành *integration test*, nhưng lại bị phụ thuộc vào những yếu tố ngoài tầm kiểm soát của Tester và Developer Frontend:

1. **Trạng thái Backend:** Nếu hệ thống backend đang gặp sự cố, hoặc dữ liệu được thay đổi thủ công trong môi trường Dev/Staging, bài test của bạn sẽ thất bại mà không hề có lỗi logic ở phía frontend.
2. **Hiệu suất Môi trường:** Tốc độ mạng, tải tài nguyên backend có thể làm chậm và gây gián đoạn các lần chạy CI/CD.
3. **Chi phí & Bảo mật:** Việc chạy hàng trăm bài test tự động lên môi trường Staging thực tế là không hiệu quả về chi phí và tiềm ẩn rủi ro dữ liệu.

### MSW Giải quyết vấn đề gì?
Mock Service Worker (MSW) hoạt động ở tầng mạng (Network Layer), giống như việc bạn đang chặn các yêu cầu HTTP/GraphQL *trước khi* chúng rời khỏi trình duyệt hoặc Node.js runtime của bạn và trả về dữ liệu giả lập theo cấu hình bạn định nghĩa.

**Ưu điểm cốt lõi của MSW:**
1. **Kiểu mô phỏng (Type Safety):** Nó bắt chước hành vi mạng thực tế, không chỉ là mock đơn thuần ở tầng JavaScript object.
2. **Scope Rộng:** Hoạt động hiệu quả với cả các request Fetch API tiêu chuẩn lẫn việc intercept các yêu cầu gửi đến GraphQL endpoint.
3. **Tốc độ:** Cung cấp phản hồi tức thì (instantaneous response), khiến tốc độ chạy test cực nhanh.

---

## 💡 2. Chiến lược kiểm thử GraphQL Endpoint bằng MSW

Trong một dự án sử dụng Apollo Client hoặc Relay để tương tác với GraphQL, bạn thường gửi các yêu cầu POST đến một endpoint duy nhất (`/graphql`). Đây là điểm mà chúng ta cần tinh chỉnh việc Mocking.

### Cách hoạt động của việc Mocking GraphQL
Thay vì mock hóa toàn bộ logic của client (ví dụ: giả lập `useQuery()` return), chúng ta sẽ để thư viện GraphQL client thực hiện công việc của nó, nhưng **MSW sẽ can thiệp và trả về dữ liệu fake tại tầng HTTP**.

**Workflow được tối ưu:**

1. Component A yêu cầu dữ liệu người dùng qua một query GraphQL cụ thể (ví dụ: `user(id: "123")`).
2. MSW intercept request POST đến `/graphql`.
3. MSW kiểm tra nội dung của body request để xác định xem nó có phải là query cho `user(id: "123")` hay không.
4. Nếu khớp, MSW sẽ trả về payload JSON giả lập (mocked response) ngay lập tức, mô phỏng phản hồi thành công từ backend mà không cần giao tiếp thực tế.

### Ví dụ Minh họa Cấu hình Mocking bằng MSW

Giả sử chúng ta có một endpoint `/graphql` và query tìm kiếm User ID 123: `query GetUser { user(id: "123") { name, email } }`.

Chúng ta sẽ định nghĩa một handler trong MSW như sau (sử dụng JavaScript/TypeScript):

```typescript
// src/mocks/handlers.ts
import { restApiHandler } from 'msw';

export const handlers = [
  restApiHandler({
    // Định nghĩa đường dẫn API Endpoint mà ứng dụng gọi đến
    method: 'POST', 
    url: '/graphql',
    
    // Hàm xử lý request body để xác định query nào đang được gửi đi
    requestHandler: async (req, res, ctx) => {
      const graphqlBody = await req.json();

      // Kiểm tra xem đây có phải là Query GET_USER không?
      if (graphqlBody.query?.includes('user(id: "123")')) {
        return res(ctx.status(200), ctx.json({ 
          data: { 
            user: { 
              name: "John Doe Mocked", 
              email: "john@mockcorp.com" 
            } 
          }
        }));
      }

      // Xử lý trường hợp query khác (ví dụ: trả về lỗi hoặc dữ liệu mặc định)
      return res(ctx.status(400), ctx.json({ errors: [{ message: "Invalid GraphQL query." }] }));
    },
  }),
];
```

**Giải thích chuyên sâu:**
* **`restApiHandler`**: Đây là helper của MSW giúp chúng ta xử lý các request API một cách dễ dàng hơn.
* **`method: 'POST', url: '/graphql'`**: Chỉ định vị trí mà interception sẽ xảy ra.
* **`requestHandler`**: Đây là trái tim của việc Mocking GraphQL. Chúng ta không thể chỉ dựa vào `url`, vì toàn bộ yêu cầu đi đến một endpoint duy nhất. Do đó, chúng ta phải *đọc và phân tích nội dung body JSON* để xác định các tham số (query) mà ứng dụng đang cố gắng gọi.
* **`ctx.json(...)`**: Đây là payload giả lập hoàn chỉnh theo cấu trúc dữ liệu mà GraphQL client mong đợi, bao gồm cả cấu trúc `data: { ... }`.

---

## 🧪 3. Nâng cao hơn: Mocking các trường hợp lỗi và Tình huống biên (Edge Cases)

Một bộ test chỉ thành công khi mọi thứ hoạt động bình thường là chưa đủ. Chúng ta phải mô phỏng cả những tình huống thất bại.

### A. Xử lý Lỗi Client-Side (Data Not Found)
Giả sử việc gọi API trả về `null` hoặc một đối tượng trống, điều này không phải là lỗi HTTP 500 nhưng lại là lỗi logic cần được kiểm thử:

```typescript
// Trong handlers.ts
if (graphqlBody.query?.includes('user(id: "999")')) {
  return res(ctx.status(200), ctx.json({ 
    data: { user: null } // Mô phỏng trường hợp không tìm thấy dữ liệu
  }));
}
```

### B. Xử lý Lỗi Server-Side (HTTP Error)
Để test khả năng xử lý lỗi kết nối hoặc từ phía server, ta buộc MSW trả về status code khác 200:

```typescript
// Trong handlers.ts
if (graphqlBody.query?.includes('user(id: "ERROR_TEST")')) {
  return res(ctx.status(503), ctx.json({ 
    errors: [{ message: "Service Unavailable - Database connection failed." }] // GraphQL Error Format
  }));
}
```

Bằng cách này, chúng ta có thể đảm bảo component frontend của bạn xử lý đúng các trạng thái `loading`, `error` (cho lỗi mạng) và `empty data` (cho dữ liệu không tồn tại).

---

## ✨ 4. Tóm tắt Quy trình Triển khai QA với MSW

| Bước | Mô tả Hành động | Lợi ích Về Chất lượng (QE Perspective) |
| :--- | :--- | :--- |
| **1. Xác định Scope** | Phân tích các Query GraphQL và Service Endpoints cần test trong component/module hiện tại. | Đảm bảo độ bao phủ (Coverage). Giúp xác định chính xác điểm can thiệp (Interception Point). |
| **2. Xây dựng Handlers** | Viết cấu hình MSW (`handlers.ts`) để bắt các Request POST tới `/graphql`. | Loại bỏ sự phụ thuộc mạng, tăng tốc và ổn định bài test. |
| **3. Mock Dữ liệu Vàng (Golden Data)** | Tạo các payload JSON mô phỏng cho: thành công, lỗi server 5xx, không tìm thấy data (null/empty list), và dữ liệu biên (Boundary Data). | Kiểm thử toàn diện mọi kịch bản vận hành và thất bại có thể xảy ra. |
| **4. Viết Test** | Sử dụng các framework testing (Vitest/Jest) và gọi component với giả định rằng API đã được Mocking bởi MSW context. | Đảm bảo logic của frontend là độc lập, chỉ phụ thuộc vào input giả định chứ không phải môi trường thực. |

---

## 🌟 Kết luận từ Duy Trung

Việc tích hợp GraphQL vào kiến trúc hiện đại là xu hướng tất yếu, nhưng việc kiểm thử nó đòi hỏi một cách tiếp cận tinh vi hơn so với REST API truyền thống. **MSW chính là cây cầu nối hoàn hảo** giúp chúng ta tách biệt quá trình *kiểm tra logic frontend* khỏi sự phức tạp và biến động của *backend runtime*.

Nếu đội ngũ QA/QE của bạn đang vật lộn với các bài test chậm chạp, giật cục do phụ thuộc mạng, việc áp dụng MSW sẽ mang lại một bước nhảy vọt đáng kể về độ ổn định, tốc độ và khả năng bảo trì của bộ test tự động. Hãy xem xét triển khai chiến lược này ngay hôm nay để đưa chất lượng sản phẩm lên một tầm cao mới!

Chúc các bạn thành công trong hành trình đảm bảo chất lượng phần mềm!