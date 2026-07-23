---
title: "Chiến lược kiểm thử GraphQL API và Mock dữ liệu với MSW (Mock Service Worker)"
date: 2026-06-18
description: "Khám phá cách kiểm thử GraphQL bằng các chiến lược mô phỏng mạng nâng cao, sử dụng sức mạnh của Mock Service Worker (MSW)."
tags: ["API Testing","GraphQL","MSW","Quality Assurance"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# Chiến lược kiểm thử GraphQL API và Mock dữ liệu với MSW (Mock Service Worker)

Xin chào các đồng nghiệp chất lượng! Tôi là Duy Trung, và trong vai trò một Quality Engineer Lead, tôi dành rất nhiều thời gian để tối ưu hóa vòng đời kiểm thử phần mềm.

Trong kỷ nguyên của kiến trúc microservices và nhu cầu về tốc độ phát triển sản phẩm ngày càng cao, việc tích hợp GraphQL đã trở thành xu hướng chủ đạo. GraphQL mang lại sự linh hoạt tuyệt vời cho client side bằng cách cho phép client yêu cầu chính xác dữ liệu mà họ cần (solving over-fetching).

Tuy nhiên, tôi nhận thấy một thách thức lớn: **Việc kiểm thử GraphQL API trong môi trường frontend là phức tạp hơn nhiều so với việc kiểm thử các REST endpoint truyền thống.**

Bài viết hôm nay sẽ đi sâu vào giải pháp chiến lược và công cụ thực tiễn để giúp đội ngũ của bạn vượt qua rào cản này, đó chính là sử dụng **Mock Service Worker (MSW)**.

***

## 💡 I. Tại sao cần một chiến lược kiểm thử API chuyên biệt cho GraphQL?

Khi chúng ta nói về việc kiểm thử API trên frontend, mục tiêu hàng đầu của mình là làm thế nào để cô lập (isolate) code client khỏi sự phụ thuộc vào trạng thái thực tế của backend. Thay vì gọi backend thật, chúng ta muốn mô phỏng một môi trường mạng ổn định và có thể dự đoán được.

### 🛑 Hạn chế khi Mock thủ công hoặc dùng cú pháp Component Testing thông thường:

1. **Tầng trừu tượng:** Nhiều thư viện client GraphQL (như Apollo Client, Relay) tự quản lý việc gọi API dưới dạng một POST request đến một URL duy nhất (`/graphql`). Việc mock chỉ ở tầng component (ví dụ: dùng Jest mocks cho `fetch`) thường không đủ sâu và dễ bị phá vỡ khi thay đổi cách hàm fetch được gọi.
2. **Tính toàn diện:** Chúng ta cần mô phỏng cả các trường hợp lỗi mạng, timeout, và đặc biệt là việc trả về các cấu trúc dữ liệu khác nhau chỉ bằng một lời gọi query duy nhất (ví dụ: mô phỏng tình huống "không có dữ liệu" vs "dữ liệu đầy đủ").

### ✨ MSW - Giải pháp Interception ở tầng Mạng (Network Layer)

**Mock Service Worker (MSW)** là một bộ công cụ mạnh mẽ cho phép chúng ta can thiệp và thay thế các request mạng *ngay tại cấp độ service worker* (hoặc mock nó trong môi trường Node/Jest). Điều này có nghĩa là:

*   Bất kể code client của bạn gọi `fetch`, Axios, hay bất kỳ thư viện nào khác để gửi request HTTP đến `/graphql`, MSW sẽ chặn nó lại và trả về dữ liệu giả lập mà chúng ta định nghĩa.
*   Nó hoạt động ở tầng thấp hơn, đảm bảo tính cô lập cao nhất.

## 🚀 II. Chiến lược Mocking GraphQL với MSW (The Core Strategy)

Khi làm việc với REST API, bạn mock theo *Resource* (ví dụ: GET `/users/1`). Với GraphQL, chúng ta phải mô phỏng theo *Request Payload* và *Context*.

Một request GraphQL thường là một POST request JSON có cấu trúc như sau:

```json
{
  "query": "query GetUser($id: ID!) { user(id: $id) { name, email } }",
  "variables": {
    "id": "uuid-123"
  },
  "operationName": "GetUser"
}
```

**Chiến lược của chúng ta là:** Sử dụng MSW để chặn các POST request đến `/graphql`, sau đó phân tích nội dung JSON payload (cụ thể là `variables` và `query`) để quyết định phản hồi nào sẽ được trả về.

### ⚙️ Các bước thực hiện chiến lược này:

1. **Thiết lập Handlers:** Định nghĩa một handler chung cho phương thức POST tại `/graphql`.
2. **Phân tích Payload (The Brain):** Trong hàm `rest.post`, chúng ta cần truy cập vào body của request incoming để kiểm tra xem nó có chứa từ khóa nào ("GetProductList", "UserDetail") hay không.
3. **Mocking Response:** Dựa trên phân tích, trả về JSON response mô phỏng kết quả thành công (`data: {...}`) hoặc thất bại (ví dụ: `errors: [...]`).

## 💻 III. Ví dụ Mã Giả Lập (Code Walkthrough)

Hãy xem qua một ví dụ thực tế bằng JavaScript/TypeScript sử dụng MSW để xử lý hai kịch bản khác nhau cho cùng một endpoint `/graphql`.

Giả sử chúng ta có một GraphQL client đang gọi các query sau:
1. `GET_PRODUCT_LIST`: Lấy danh sách sản phẩm với giới hạn 10.
2. `GET_USER_DETAIL`: Lấy chi tiết người dùng theo ID.

### Cài đặt Dependencies:
```bash
npm install msw --save-dev
# Khởi tạo MSW và các service worker mock cần thiết trong bộ test (e.g., setupTests.js)
```

### File mô phỏng Network (`src/mocks/handlers.ts`)

```typescript
import { http, HttpResponse } from 'msw';

// 1. Handler chung cho tất cả requests tới /graphql
export const graphqlHandlers = [
  http.requestHandler({
    method: 'POST', // GraphQL luôn là POST
    url: 'http://localhost/graphql',
    logic: async ({ request }) => {
      const jsonBody = await request.json();
      // Lấy các biến và query để xác định loại request
      const variables = jsonBody?.variables;
      const operationName = jsonBody?.operationName;

      let responseData = null;
      let status = 200;
      
      /**
       * LOGIC CORE: Phân tích payload và trả về dữ liệu giả lập phù hợp
       */
      if (jsonBody.query.includes('ProductList') && variables?.limit === 10) {
        // Kịch bản A: Thành công khi lấy danh sách sản phẩm (Mocking Success State)
        responseData = {
          data: {
            productList: [
              { id: "P001", name: "Laptop X", price: 2500 },
              { id: "P002", name: "Mouse Y", price: 35 }
            ]
          }
        };

      } else if (jsonBody.query.includes('UserDetail') && variables?.id === 'user-456') {
        // Kịch bản B: Thành công khi lấy chi tiết người dùng cụ thể
         responseData = {
          data: {
            userDetail: {
              userId: "user-456", 
              name: "Nguyễn Thị A", 
              email: "a@test.com"
            }
          }
        };

      } else if (jsonBody.query.includes('ErrorQuery')) {
         // Kịch bản C: Mô phỏng lỗi GraphQL (GraphQL Error)
         return HttpResponse.json(JSON.stringify({ 
             errors: [{ message: "Không tìm thấy User ID này." }] 
         }), { status: 200 }); // Lưu ý: Lỗi GraphQL thường trả về HTTP 200 nhưng có trường 'errors'

      } else {
        // Kịch bản Mặc định/Fail-safe: Trả về lỗi không xác định
        return HttpResponse.json(JSON.stringify({ 
            errors: [{ message: "Payload không hợp lệ hoặc query chưa được định nghĩa." }] 
         }), { status: 200 });
      }

      // Đối với các kịch bản thành công, trả về phản hồi JSON tiêu chuẩn
      return HttpResponse.json(responseData, { status: status });
    },
  }),
];
```

### Phân tích đoạn mã của Duy Trung:

1. **`http.requestHandler`:** Đây là cách khai báo một bộ xử lý yêu cầu chung cho endpoint `/graphql`. Chúng ta không cần định nghĩa thủ công từng request GET/POST, mà để MSW xử lý logic bên trong.
2. **`await request.json()`:** Việc này cực kỳ quan trọng vì nó cho phép chúng ta truy cập vào toàn bộ body JSON của request *trước khi* bất kỳ mã nào của ứng dụng client được chạy.
3. **Phân tích điều kiện (`if (jsonBody.query.includes(...))`):** Đây là "bộ não" của chiến lược này. Thay vì chỉ mock một phản hồi tĩnh, chúng ta mô phỏng hành vi *phản hồi động* dựa trên các tham số và query được gửi đến.
4. **Xử lý Lỗi GraphQL:** Chúng ta đã nhận thấy rằng ngay cả khi API trả về lỗi (ví dụ: `user not found`), nó thường vẫn trả về HTTP status 200, nhưng trong payload JSON sẽ có trường `"errors"`. Do đó, việc kiểm thử phải *kiểm tra nội dung* của response body chứ không chỉ dựa vào mã trạng thái HTTP.

## ✨ IV. Các Best Practice Nâng Cao dành cho QE Leads

Để tối ưu hóa chiến lược này, tôi xin đưa ra một vài lưu ý chuyên sâu:

### 1. Quản lý State và Sequence Mocking (Advanced)
Nếu một luồng nghiệp vụ của bạn cần nhiều lệnh gọi API tuần tự (ví dụ: Bước 1: Lấy danh sách; Bước 2: Chọn sản phẩm; Bước 3: Thêm vào giỏ hàng), MSW cho phép bạn sử dụng các hooks để mô phỏng sự thay đổi trạng thái.
*   **Kỹ thuật:** Thay vì trả về dữ liệu tĩnh, hãy thiết kế handler của mình sao cho nó kiểm tra một biến đếm hoặc bộ nhớ giả lập (mock cache) trong môi trường test để đảm bảo lần gọi thứ N sẽ trả về data khác lần gọi thứ N-1.

### 2. Testing Mutation Flow
Các mutation (thay đổi dữ liệu) là nơi bạn phải đặc biệt cẩn trọng khi mock. Bạn cần mô phỏng cả kịch bản:
*   Thành công: Trả về đối tượng vừa được tạo kèm ID mới (`data: { createUser: { id: 789, ... } }`).
*   Thất bại do Validation: Backend trả về `errors` cho trường bị thiếu (ví dụ: `message: "Email is required"`).

### 3. Tách biệt Mock Logic khỏi Tests
Tuyệt đối không đặt logic phân tích payload (`if/else`) vào trong các test case riêng lẻ. Hãy giữ toàn bộ handler của MSW ở một nơi tập trung, chỉ thay đổi luồng (flow) hoặc biến điều kiện trong file mock service worker khi bạn cần kiểm thử một trường hợp lỗi mới. Điều này giúp tăng khả năng tái sử dụng và tính dễ bảo trì (Maintainability).

## 🎯 Kết luận: Tăng cường Độ tin cậy cho GraphQL Testing

Sử dụng MSW không chỉ là việc thay thế `fetch` bằng dữ liệu giả lập; nó là việc nâng cấp toàn bộ tầng kiểm thử mạng của ứng dụng bạn lên một mức độ chuyên nghiệp, có khả năng mô phỏng hành vi API ở cấp độ sâu nhất.

Khi áp dụng chiến lược mock động này, đội ngũ QA và Developer sẽ đạt được:
1. **Isolation tuyệt đối:** Code client chỉ chạy với những dữ liệu do chúng ta kiểm soát 100%.
2. **Coverage tối đa:** Có thể dễ dàng phủ các kịch bản biên (edge cases), lỗi API phức tạp mà không cần phải triển khai môi trường backend giả lập.

Tôi hy vọng bài viết này sẽ cung cấp một cái nhìn tổng quan, chuyên sâu và rất thực tế để đội ngũ của bạn có thể bắt tay vào xây dựng hệ thống kiểm thử GraphQL mạnh mẽ hơn ngay hôm nay!

Chúc các đồng nghiệp luôn vững vàng với chất lượng sản phẩm của mình!

***
**Duy Trung - QE Lead.** 🚀