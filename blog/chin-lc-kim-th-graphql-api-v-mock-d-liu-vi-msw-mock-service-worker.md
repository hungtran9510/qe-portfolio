---
title: "Chiến lược kiểm thử GraphQL API và Mock dữ liệu với MSW (Mock Service Worker)"
date: 2026-06-20
description: "Học cách mô phỏng các cuộc gọi GraphQL phức tạp bằng MSW. Tăng tốc độ test và đảm bảo tính ổn định cho ứng dụng của bạn."
tags: ["API Testing","GraphQL","MSW"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# Chiến lược kiểm thử GraphQL API và Mock dữ liệu với MSW (Mock Service Worker)

*Lời đầu thư,*

Tôi là Duy Trung, chuyên gia Kỹ thuật Đảm bảo Chất lượng Phần mềm (QE Lead). Trong kỷ nguyên phát triển phần mềm hiện đại, việc đảm bảo chất lượng của các API là nhiệm vụ tối quan trọng. Tuy nhiên, khi chúng ta chuyển từ kiến trúc REST truyền thống sang GraphQL—với sự linh hoạt và khả năng truy vấn dữ liệu theo yêu cầu—các thách thức kiểm thử cũng xuất hiện kèm theo.

Nhiều nhà phát triển thường gặp khó khăn khi mock (giả lập) các cuộc gọi GraphQL vì bản chất của nó: **Gần như mọi thứ đều là một yêu cầu `POST` duy nhất, chứa toàn bộ cấu trúc truy vấn.** Bạn không chỉ cần mock một endpoint, mà còn phải mô phỏng *logic* nghiệp vụ phức tạp bên trong payload JSON.

Bài viết này sẽ đi sâu vào việc giải quyết vấn đề đó bằng cách sử dụng **Mock Service Worker (MSW)**—một công cụ mạnh mẽ và hiệu quả để kiểm thử các API GraphQL của bạn trong môi trường client-side, giúp đảm bảo test nhanh hơn, ổn định hơn, và quan trọng nhất là cô lập ứng dụng khỏi sự biến động của backend thực tế.

***

## 🎯 Tại Sao Chúng Ta Cần MSW cho GraphQL? (The Pain Point)

Trong quá trình kiểm thử tự động (Automated Testing), mục tiêu cao nhất của chúng ta là **Test Isolation**—giúp bài test chỉ phụ thuộc vào logic và trạng thái nội bộ của nó, không bị ảnh hưởng bởi tốc độ server, thay đổi schema backend đột ngột hay tình trạng mạng.

### Hạn chế của Mocking truyền thống:
1. **Jest Mocks (`jest.mock()`):** Các mock này thường hoạt động ở tầng module hoặc hàm JavaScript. Chúng có thể dễ dàng bị vượt qua nếu luồng dữ liệu (data flow) của bạn chạm đến lớp Network API gốc, vì chúng không thực sự chặn yêu cầu mạng.
2. **Mock Backend/Fixtures:** Việc dựng các API giả lập phức tạp bằng các framework như Mock Server sẽ tốn thời gian thiết lập và thường kém chân thực hơn so với việc chặn ở mức Service Worker (tầng network).

### Giải pháp: MSW - Lớp Interception Hoàn hảo
MSW hoạt động bằng cách *chặn* các yêu cầu Fetch/XHR **ngay tại tầng mạng lưới của trình duyệt** (Service Worker level). Điều này khiến các component, thư viện networking, và mọi đoạn mã sử dụng `fetch()` hoặc `axios` đều tin rằng chúng đang giao tiếp với một backend thực sự, nhưng dữ liệu trả về lại là dữ liệu giả lập theo ý muốn của chúng ta.

Đối với GraphQL, MSW giải quyết bài toán khó khăn nhất: **làm thế nào để xử lý yêu cầu `POST` chung cho tất cả các truy vấn khác nhau?**

## 🛠️ Chiến Lược Mocking GraphQL Với MSW

Bản chất của một cuộc gọi GraphQL là gửi payload JSON qua phương thức HTTP POST tới endpoint `/graphql`. Payload này chứa ít nhất ba trường quan trọng:
1. **`query`**: Chuỗi AST (Abstract Syntax Tree) định nghĩa các field bạn muốn lấy.
2. **`variables`**: Các biến dữ liệu động điền vào `query`.
3. **`operationName`**: Tên của Operation nếu schema có nhiều truy vấn trong cùng một request.

Chiến lược của chúng ta là thiết lập các MSW Handler để lắng nghe mọi yêu cầu POST tới `/graphql`, sau đó phân tích nội dung payload (`requestBody`) để xác định xem đây là *loại* dữ liệu nào (ví dụ: lấy thông tin người dùng, tạo bài viết) và trả về mock response tương ứng.

### 🚀 Ví dụ Thực Hành (Sử dụng TypeScript/Jest)

Giả sử chúng ta có một component cần gọi GraphQL để lấy chi tiết người dùng bằng ID. Endpoint là `http://api.example.com/graphql`.

#### Bước 1: Cài đặt và Thiết lập MSW
```bash
npm install msw --save-dev
# Đảm bảo bạn thiết lập server worker trong setup file của test suite
```

#### Bước 2: Viết Mock Handler (Trong `src/mocks/handlers.ts`)

Chúng ta cần sử dụng cơ chế `rest.post` và kiểm tra payload bên trong để định tuyến response.

Duy Trung xin trình bày đoạn mã mock handler mẫu này, nơi chúng ta xử lý việc nhận diện query bằng cách đọc trường `query` của body:

```typescript
// src/mocks/handlers.ts
import { rest } from 'msw';

const graphqlEndpoint = '/graphql';

export const handlers = [
  // 1. Handler chung cho tất cả các yêu cầu POST đến GraphQL
  rest.post(graphqlEndpoint, async (req, res) => {
    const requestBody = req.json();
    console.log("GraphQL Request Payload:", requestBody);

    // Phân tích payload để xác định type of operation
    if (!requestBody || !requestBody.query) {
      return res.status(400).json({ error: "Missing query in request body." });
    }

    const query = requestBody.query;

    // 2. Logic phân loại Query (Phần cốt lõi của giải pháp)
    if (query.includes("getUserDetails")) {
      // Xử lý yêu cầu lấy chi tiết người dùng
      const variables = requestBody.variables || {};
      const userId = variables.id;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required for getUserDetails." });
      }

      // Mô phỏng response JSON thành công (Schema Matching)
      const mockResponseData = {
        data: {
          getUserDetails: {
            id: userId,
            username: `user-${userId}`,
            email: `test${userId}@example.com`,
            status: "Active",
          }
        }
      };

      return res.status(200).json(mockResponseData);

    } else if (query.includes("createPost")) {
      // Xử lý yêu cầu POST tạo bài viết
      const variables = requestBody.variables || {};
      console.log("Creating post with content:", variables.content);

      return res.status(200).json({ 
          data: { 
            createPost: { 
                success: true, 
                postId: Date.now(), 
                message: "Bài viết đã được tạo thành công!" 
            } 
          } 
      });
    } else {
        // Trường hợp không nhận diện query nào (Fallback)
        return res.status(404).json({ error: "Unsupported GraphQL operation." });
    }

  }),
];
```

### Giải thích Chuyên sâu từ Duy Trung (Analysis Breakdown)

1. **Sử dụng `rest.post`:** Chúng ta không thể dùng các handler đơn giản vì mọi truy vấn đều là POST. Vì vậy, chúng ta phải "bắt" (intercept) tất cả các yêu cầu POST tới `/graphql`.
2. **Kiểm tra Payload (`req.json()`):** Điểm mạnh nhất của giải pháp này là khả năng đọc toàn bộ payload JSON gửi lên. Chúng ta không dựa vào URL path cứng mà dựa vào *nội dung* bên trong query để quyết định hành vi phản hồi (Behavior-Driven Mocking).
3. **Logic `if/else if` trên Query String:** Việc sử dụng `query.includes("TênField")` là một kỹ thuật hiệu quả để phân biệt các loại operation khác nhau mà không cần thay đổi endpoint vật lý của API. Điều này mô phỏng chính xác cách backend thực tế phải xử lý logic nghiệp vụ.
4. **Cấu trúc Mock Response:** Hãy chú ý đến việc mock response phải tuân thủ cấu trúc JSON/Schema của GraphQL (`{ data: { field: value } }`). Việc này cực kỳ quan trọng vì component client luôn mong đợi cấu trúc dữ liệu đúng để parse và hiển thị.

## 💡 Best Practices Từ QE Lead Duy Trung (Advanced Tips)

Để nâng tầm khả năng kiểm thử, tôi xin đưa ra ba mẹo thực tế mà các đội ngũ QA nên áp dụng:

### 1. Mô phỏng Tình huống Lỗi (Error State Mocking)
Không chỉ mock thành công. Một hệ thống vững chắc phải dự đoán cả lỗi.

*   **Mock Network Failure:** Giả lập trạng thái mạng mất kết nối (dù MSW khó mô phỏng điều này ở mức độ Service Worker, nhưng bạn có thể kiểm tra logic fallback của client).
*   **Mock GraphQL Error Payload:** Nếu backend trả về lỗi schema hoặc validation error (ví dụ: `errors` array trong payload), hãy bắt chước chính xác cấu trúc đó.

```typescript
// Ví dụ mô phỏng lỗi dữ liệu thiếu biến số
if (query.includes("getUserDetails")) {
    const variables = requestBody.variables || {};
    if (!variables.id) {
        return res.status(200).json({ 
            errors: [
                { message: "GraphQL validation error: User ID must be provided.", locations: [], path: ["getUserDetails", "id"] }
            ] 
        });
    }
    // ... Tiếp tục logic thành công
}
```

### 2. Xử lý Multiple Queries (Batching)
Nếu ứng dụng của bạn sử dụng các query batching hoặc thực hiện nhiều truy vấn trong một payload, handler MSW cần được nâng cấp để parse toàn bộ mảng yêu cầu và xử lý tuần tự từng phần tử một.

### 3. Mock Validation of Schema and Variables
Trong môi trường test integration cao cấp, hãy thêm logic kiểm tra nghiêm ngặt (Type Checking) trên các variables mock. Nếu client gọi API với `variables: { id: "ABC" }` (string) trong khi schema yêu cầu integer, MSW nên mô phỏng lỗi này để bắt kịp các bug tiềm ẩn từ tầng service.

## 🚀 Kết Luận

Việc kiểm thử GraphQL đòi hỏi một tư duy mock khác biệt so với REST. Chúng ta không chỉ cần mock endpoint, mà phải **mock toàn bộ logic xử lý nghiệp vụ** bằng cách phân tích cấu trúc payload phức tạp.

Bằng việc tận dụng sức mạnh của MSW và áp dụng chiến lược định tuyến handler dựa trên nội dung query (Query Content Routing), đội ngũ QE của bạn sẽ đạt được:
1. **Tốc độ Test tối đa:** Bài test chạy siêu nhanh, không bị ảnh hưởng bởi latency mạng.
2. **Tính cô lập hoàn hảo:** Ứng dụng chỉ phụ thuộc vào các hằng số mock của mình.
3. **Khả năng mô phỏng toàn diện:** Bao gồm cả trạng thái thành công và tất cả các dạng lỗi nghiệp vụ/schema.

Nếu bạn đang phát triển ứng dụng sử dụng GraphQL, việc tích hợp MSW không còn là một lựa chọn mà đã trở thành một chiến lược kiểm thử bắt buộc để đảm bảo chất lượng sản phẩm ở mức cao nhất.

Chúc các đồng nghiệp luôn thành công và viết ra những bài test mạnh mẽ!

**Duy Trung**
*QE Lead & API Testing Specialist*