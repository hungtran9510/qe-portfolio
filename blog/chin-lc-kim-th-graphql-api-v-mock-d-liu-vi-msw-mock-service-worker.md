---
title: "Chiến lược kiểm thử GraphQL API và Mock dữ liệu với MSW (Mock Service Worker)"
date: 2026-06-16
description: "Khám phá phương pháp hiện đại để cô lập và kiểm thử component giao diện khi làm việc với GraphQL bằng Mock Service Worker (MSW)."
tags: ["API Testing","GraphQL","MSW","Testing Strategy"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# Chiến lược kiểm thử GraphQL API và Mock dữ liệu với MSW (Mock Service Worker)

Chào các đồng nghiệp, tôi là Duy Trung. Trong hành trình phát triển phần mềm hiện đại, việc đảm bảo chất lượng khi tích hợp với các loại API phức tạp như GraphQL luôn là một thách thức lớn đối với các nhóm QA và QE. Chúng ta cần kiểm thử logic nghiệp vụ giao diện (UI) mà không bị phụ thuộc vào tình trạng hoạt động, tốc độ, hay sự ổn định của backend thực tế.

Bài viết này sẽ đi sâu vào một chiến lược mạnh mẽ và cực kỳ hiệu quả: **Sử dụng Mock Service Worker (MSW)** để mô phỏng các yêu cầu GraphQL API trong quá trình kiểm thử unit/integration test tại tầng client.

## 💡 Vấn đề cần giải quyết khi kiểm thử GraphQL

Trước khi đi vào giải pháp, chúng ta cần nhận diện vấn đề cốt lõi.

Khi sử dụng RESTful APIs, các lời gọi thường rõ ràng (ví dụ: `GET /users/{id}`). Với GraphQL, tất cả các loại truy vấn (Query, Mutation) đều được gói gọn trong một yêu cầu **POST** duy nhất đến một endpoint chung (thường là `/graphql`).

Vấn đề của chúng ta khi viết test case là:
1.  **Tính cô lập:** Chúng ta muốn kiểm thử Component A dựa trên phản hồi giả định (Mock Response) mà không cần phải khởi động và cấu hình toàn bộ dịch vụ backend GraphQL thực tế.
2.  **Tương thích với Browser/Environment:** Các phương pháp mocking truyền thống như *Jest Mocks* hay *Service-level stubs* thường hoạt động tốt ở tầng code, nhưng chúng khó khăn khi muốn mô phỏng các tương tác mạng (network requests) một cách chân thật nhất, đặc biệt là trong môi trường React Testing Library hoặc Cypress.

**MSW giải quyết vấn đề này bằng cách intercept request ngay tại cấp độ Service Worker của trình duyệt.**

## 🚀 MSW và GraphQL: Cơ chế hoạt động chuyên sâu

Mock Service Worker (MSW) không phải là một thư viện mocking dữ liệu; nó là một công cụ **mocking network**. Nó cho phép bạn đăng ký các "handler" để lắng nghe các yêu cầu HTTP/Fetch *trước khi* chúng rời khỏi trình duyệt, và thay thế phản hồi thực tế bằng phản hồi giả định của bạn.

Đối với GraphQL, MSW hoạt động như sau:

1. **Bắt Intercept:** Bạn thiết lập một handler trong MSW cho phương thức `POST` đến URL `/graphql`.
2. **Phân tích Body:** Khi test chạy và component gọi API, MSW sẽ chặn yêu cầu đó. Thay vì xem xét URI path, nó cần đọc và phân tích cấu trúc JSON body của request GraphQL (chứa các trường `query`, `variables`, v.v.).
3. **Trả về Mock Data:** MSW kiểm tra xem nội dung payload có khớp với điều kiện bạn định nghĩa hay không. Nếu khớp, nó sẽ trả về một đối tượng phản hồi giả lập hoàn toàn theo cấu trúc JSON của GraphQL response (bao gồm cả các trường `data` và `errors`).

### Ví dụ minh họa cơ bản về thiết lập MSW

Giả sử chúng ta có service GraphQL endpoint là `http://api.myapp/graphql`.

**1. Cài đặt Dependencies:**
```bash
npm install msw --save-dev
# (Và đảm bảo các thư viện test của bạn như @testing-library/react được cài)
```

**2. Thiết lập Handler (Mock API):**

Chúng ta cần định nghĩa một module để cấu hình các handlers này:

```typescript
// src/mocks/handlers.ts

import { graphql } from 'msw';

export const handlers = [
  // ------------------------
  // Xử lý tất cả các request POST tới endpoint /graphql
  // ------------------------
  graphql('http://api.myapp/graphql', ({ query, variables }) => {
    console.log("⚡️ MSW Intercepted GraphQL Call!");
    console.log("Query:", query);
    console.log("Variables:", JSON.stringify(variables));

    // Logic Mocking: Kiểm tra xem request có phải là "getUsers" không
    if (query.includes('getUserList')) {
      return {
        data: {
          userList: [
            { id: '1', name: 'Alice', email: 'alice@test.com' },
            { id: '2', name: 'Bob', email: 'bob@test.com' }
          ]
        }
      };
    }

    // Trường hợp fallback (ví dụ: API khác)
    return {
      errors: [{ message: "Unknown query handled by mock." }],
      data: null
    };
  }),
];
```

> **Giải thích của Duy Trung:** Sử dụng `graphql` helper từ MSW là cách hiệu quả nhất. Nó cho phép chúng ta nhận toàn bộ đối tượng payload GraphQL (bao gồm query và variables) mà không cần phải tự mình parse JSON body phức tạp, giúp code sạch sẽ và dễ bảo trì hơn rất nhiều.

## 🧑‍💻 Triển khai kiểm thử với Mocking API

Bây giờ, chúng ta áp dụng các handler này vào môi trường test (ví dụ: Jest + RTL).

**Test Case:** Giả lập việc component `UserList` hiển thị danh sách người dùng.

```typescript
// src/components/__tests__/UserList.test.tsx
import { render, screen } from '@testing-library/react';
import UserList from '../UserList';
import { server, handlers } from '../../mocks/server'; // Khởi tạo MSW Server

describe('UserList Component Testing', () => {
  // Thiết lập và cleanup server cho toàn bộ khối test
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());


  it('should display user list correctly when API call succeeds', async () => {
    // 1. Đăng ký mock cụ thể cho bài test này (hoặc dùng handler chung)
    server.use(
      graphql('http://api.myapp/graphql', ({ query, variables }) => {
        if (query.includes('getUserList')) {
          return {
            data: { userList: [{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }] }
          };
        }
      })
    );

    // 2. Thực thi component và chờ đợi (await) API call được thực hiện
    render(<UserList />);

    // Do MSW đã intercept request, fetch/axios sẽ nhận dữ liệu giả lập này
    expect(screen.getByText(/Alice/i)).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
  });

  it('should handle API failures gracefully (Error Handling)', async () => {
    // 1. Mocking tình huống lỗi (Ví dụ: Trạng thái 400 hoặc Lỗi GraphQL)
    server.use(
      graphql('http://api.myapp/graphql', ({ query, variables }) => {
        return {
          errors: [
            { message: "User ID not found." }
          ],
          data: null
        };
      })
    );

    // 2. Render component và kiểm tra khả năng xử lý lỗi của UI
    render(<UserList />);
    expect(screen.getByText(/No users found/i)).toBeInTheDocument();
  });
});
```

> **Lời khuyên thực chiến từ Duy Trung:** Bằng cách sử dụng `server.resetHandlers()`, chúng ta đảm bảo rằng state của mocking sẽ được reset sau mỗi test case, giúp các testcase độc lập (isolated). Đây là nguyên tắc vàng trong QE!

## ✨ Lợi ích tối ưu khi dùng MSW cho GraphQL Testing

Sử dụng chiến lược này mang lại ba lợi ích cực kỳ quan trọng:

1. **Tính chân thực về mạng (Network Fidelity):** Vì MSW hoạt động ở tầng Service Worker, nó mô phỏng *thực sự* cách trình duyệt tương tác với API qua Fetch/XHR. Điều này giúp loại bỏ các lỗi chỉ xảy ra khi môi trường tích hợp (E2E) mới phát hiện được.
2. **Tăng tốc độ và ổn định:** Test chạy cực nhanh vì không cần phải khởi động backend GraphQL thực tế. Chúng ta kiểm soát hoàn toàn dữ liệu và trạng thái phản hồi (thành công, thất bại, timeout, v.v.).
3. **Dễ bảo trì (Maintainability):** Khi cấu trúc API thay đổi, bạn chỉ cần cập nhật handler trong `mocks/handlers.ts` mà không cần phải chỉnh sửa logic kiểm thử phức tạp nào khác.

## 🎯 Tổng kết & Kết luận của QE Lead

Việc chuyển từ testing dựa trên stubs nội bộ sang **network mocking** bằng MSW là một bước nâng cấp đáng kể về độ tin cậy và tốc độ cho đội ngũ Quality Engineering của bạn.

Đừng bao giờ để các kiểm thử của bạn bị ràng buộc bởi sự sẵn có hay cấu hình phức tạp của môi trường backend. Hãy sử dụng MSW, nắm bắt khả năng tương tác mạng ở tầng thấp nhất, để viết nên những test suite cô lập, mạnh mẽ và đáng tin cậy cho bất kỳ ứng dụng GraphQL nào!

Chúc các bạn thành công với những chiến lược kiểm thử hiện đại này! Hẹn gặp lại trong bài viết tiếp theo.

***
*Duy Trung – QE Lead | Chuyên gia Kiểm thử Chất lượng Phần mềm.*