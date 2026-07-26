---
title: "Chiến lược kiểm thử GraphQL API và Mock dữ liệu với MSW (Mock Service Worker)"
date: 2026-06-21
description: "Nâng tầm khả năng kiểm thử ứng dụng GraphQL bằng chiến lược mocking mạnh mẽ với MSW, đảm bảo tính ổn định và hiệu suất tối đa."
tags: ["API Testing","GraphQL","MSW"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# Chiến lược kiểm thử GraphQL API và Mock dữ liệu với MSW (Mock Service Worker)

Chào các anh em đồng nghiệp trong lĩnh vực Kiểm thử Phần mềm! Tôi là Duy Trung, một QE Lead đã dành nhiều năm nghiên cứu về việc tối ưu hóa quy trình Tự động hóa Kiểm thử.

Trong bối cảnh kiến trúc Microservices và sự phổ biến của GraphQL, việc kiểm thử API không chỉ đơn thuần là gọi các endpoint REST truyền thống. Khi chúng ta chuyển sang GraphQL – một giao diện giúp client yêu cầu chính xác dữ liệu cần thiết (Over-fetching/Under-fetching được giải quyết) – thách thức lớn nhất lại nằm ở **sự phụ thuộc vào trạng thái mạng lưới và backend phức tạp**.

Nếu không kiểm soát tốt các dependencies này, bộ test của bạn sẽ trở nên *flaky* (thất thường), chậm chạp, và khó debug khủng khiếp.

Bài viết hôm nay tôi sẽ đi sâu vào một chiến lược thực tế và cực kỳ mạnh mẽ: **Kết hợp giữa việc kiểm thử GraphQL với công cụ Mock Service Worker (MSW)** để cô lập unit/integration test của bạn khỏi bất kỳ sự biến động nào của môi trường mạng lưới thật.

## 💡 Tại sao cần một chiến lược Mocking chuyên biệt cho GraphQL?

Trước hết, chúng ta phải hiểu rõ vấn đề. Khi kiểm thử một component client gọi đến API (dù là REST hay GraphQL), việc gửi request ra ngoài thực tế mang lại những rủi ro lớn:

1. **Tốc độ chậm:** Mỗi lần test phải chờ phản hồi từ backend thật, khiến bộ suite test chạy rất lâu.
2. **Phụ thuộc môi trường:** Nếu service B tạm thời bị lỗi hoặc cần maintenance, toàn bộ test của bạn sẽ fail, dù logic client của bạn hoàn toàn đúng.
3. **Kiểm thử các kịch bản edge case:** Rất khó để mô phỏng chính xác các kịch bản như timeout, rate limiting, hay response 500 mà không ảnh hưởng đến hệ thống thật.

**MSW (Mock Service Worker)** ra đời để giải quyết vấn đề này bằng cách hoạt động ở tầng **Service Worker**. Thay vì chỉ mock HTTP request/response trong bộ nhớ của ứng dụng test (như Jest mocks), MSW chặn yêu cầu mạng lưới ngay từ trình duyệt hoặc môi trường Node.js, mô phỏng hành vi của API Server một cách chân thực nhất.

## 🚀 GraphQL và Khả năng Mocking với MSW: Vấn đề cốt lõi

GraphQL không có các endpoint riêng biệt cho từng loại dữ liệu như REST (`/users`, `/posts`). Thay vào đó, nó sử dụng **một hoặc vài endpoint duy nhất** (ví dụ: `/graphql`) và chuyển giao yêu cầu dưới dạng JSON chứa cấu trúc query.

Vậy làm thế nào để dùng MSW chặn và trả về response GraphQL?

Thực chất, bạn cần mock toàn bộ lớp giao tiếp HTTP POST gửi đến endpoint `/graphql`, đồng thời xác định được **cấu trúc payload** mà GraphQL nhận vào (chứa `query` và các biến số `variables`).

### Bước 1: Cài đặt và Thiết lập cơ bản

Chúng ta giả sử bạn đang dùng React/Vue với Apollo Client hoặc Relay.

```bash
# Cài đặt MSW và các dependency liên quan
npm install msw --save-dev
```

Trong file setup của test (ví dụ: `setupTests.js`), chúng ta khởi tạo bộ mạng giả:

```javascript
// src/mocks/handlers.js
import { http, HttpResponse } from 'msw';

/**
 * Định nghĩa các handlers cho tất cả các API calls.
 * MSW sẽ tự động intercept những yêu cầu khớp với định nghĩa này.
 */
export const graphqlHandlers = [
  // Endpoint GraphQL thường là POST tới /graphql
  http.post('https://api.your-app.com/graphql', async ({ request }) => {
    const body = await request.json();
    console.log("GraphQL Request Body Received:", body);

    // 1. Xử lý logic Mocking ở đây
    if (body.query.includes('getUserDetailsQuery')) {
      // Kịch bản thành công: Trả về User hợp lệ
      return HttpResponse.json({
        data: {
          user: { id: "u1", name: "Test User", email: "test@example.com" }
        }
      }, { status: 200 });

    } else if (body.query.includes('fetchItemsError')) {
      // Kịch bản lỗi nghiệp vụ: Trả về lỗi hợp lệ trong payload
      return HttpResponse.json({
          data: {
              items: null, // Tùy thuộc vào schema bạn muốn return
              errors: [{ message: "User not found." }] 
          }
      }, { status: 200 });

    } else {
        // Default Fallback Error
         return HttpResponse.json({ errors: [{ message: "Unknown query" }] }, { status: 400 });
    }
  }),
];
```

### Bước 2: Viết Test Case mô phỏng Query và Variables

Trong file test của component (ví dụ: `UserComponent.test.jsx`), chúng ta sử dụng `setupServer` của MSW để kích hoạt các handlers đã định nghĩa.

**Giả định:** Chúng ta có một query GraphQL tên là `getUserDetailsQuery` và nó nhận `userId` làm biến số.

```javascript
// src/components/UserComponent.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { graphqlHandlers } from '../mocks/handlers';
import UserComponent from './UserComponent';

// 1. Thiết lập Server Mocking
const server = setupServer(...graphqlHandlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers()); // Đảm bảo mỗi test là sạch sẽ
afterAll(() => server.close());

describe('User Component Testing with MSW and GraphQL', () => {
  // --- Kịch bản 1: Thành công (Success Case) ---
  test('should display user details correctly on successful fetch', async () => {
    // Server đã được cấu hình default success handler ở handlers.js
    render(<UserComponent />);

    // Chờ component gọi API và hiển thị dữ liệu mock
    await waitFor(() => expect(screen.getByText("Test User")).toBeInTheDocument());
  });

  // --- Kịch bản 2: Xử lý lỗi nghiệp vụ (Business Logic Error) ---
  test('should display error message if user is not found', async () => {
    // Override handler tạm thời để mock tình huống lỗi "User not found"
    server.use(
      http.post('https://api.your-app.com/graphql', async ({ request }) => {
        const body = await request.json();
        if (body.query.includes('getUserDetailsQuery') && body.variables.userId === 'u999') {
            // Trả về payload lỗi mà GraphQL thường dùng: data={null}, errors=[...]
             return HttpResponse.json({ 
                data: { user: null }, 
                errors: [{ message: "User with ID u999 does not exist." }] 
            }, { status: 200 });
        }
        // Giữ hành vi mặc định cho các query khác
        return HttpResponse.json({ data: {} }); 

      })
    );

    render(<UserComponent />);

    await waitFor(() => expect(screen.getByText("Error")).toBeInTheDocument());
    expect(screen.getByText(/User with ID u999 does not exist/i)).toBeVisible();
  });
});
```

## 🛠️ Phân tích chuyên sâu từ góc độ QE Lead (Duy Trung)

Các anh em cần lưu ý những điểm kỹ thuật quan trọng sau để tối ưu hóa bộ test của mình:

### 1. Ưu tiên Test Level và Mục tiêu Mocking

Chúng ta đang dùng MSW, tức là chúng ta đang thực hiện **Integration Testing** ở mức độ giả lập (mocked integration).

*   **❌ Tránh:** Dùng mocking quá sâu bên trong logic gọi GraphQL (ví dụ: mock client Apollo/Relay).
*   **✅ Nên:** Mock toàn bộ lớp giao tiếp HTTP. Việc này buộc bạn phải kiểm tra *tổng thể luồng dữ liệu*: Component -> Calling Logic -> Network Layer $\to$ Server Response Mocked.

### 2. Bắt buộc mô phỏng cấu trúc Error Response của GraphQL

Một lỗi trong API REST thường là HTTP status code (404, 500). Tuy nhiên, theo thiết kế chuẩn của GraphQL:
*   Nếu server gặp lỗi nội bộ (internal failure), nó vẫn có thể trả về mã `200 OK` nhưng payload sẽ chứa một mảng `errors`.
*   Khi mock thành công kịch bản này, bạn phải đảm bảo rằng MSW trả về status **200**, nhưng nội dung JSON lại mang các trường lỗi như: `"errors": [...]` và các field dữ liệu bị ảnh hưởng (`"data": { "user": null }`).

### 3. Xử lý Variables trong Mocking

GraphQL sử dụng biến số (variables) rất nhiều. Khi bạn mock, hãy luôn kiểm tra xem payload JSON nhận được từ MSW có chứa biến số mà component đã truyền đi hay không. Điều này giúp bạn xây dựng các handler mạnh mẽ và dễ mở rộng hơn rất nhiều so với việc chỉ dựa vào nội dung Query string thô.

## 🎯 Kết luận

Kiểm thử GraphQL API là một bước tiến lớn trong kiến trúc phần mềm hiện đại, mang lại trải nghiệm tốc độ cao cho người dùng cuối. Tuy nhiên, nó yêu cầu chúng ta phải nâng cấp chiến lược kiểm test của mình lên một tầm cao mới.

Bằng việc kết hợp MSW để chặn tầng mạng lưới và mô phỏng chính xác các cấu trúc response GraphQL (kể cả lỗi), bạn có thể xây dựng một bộ Test Suite **tốc độ cao, cô lập tuyệt đối, và cực kỳ đáng tin cậy**.

Hãy bắt đầu áp dụng chiến lược này vào dự án của bạn ngay hôm nay để thấy sự khác biệt lớn về hiệu năng và tính ổn định cho toàn đội QA!

Chúc các anh em thành công với hành trình tự động hóa kiểm thử API!
*Trân trọng,*
**Duy Trung**
*QE Lead chuyên nghiệp.*