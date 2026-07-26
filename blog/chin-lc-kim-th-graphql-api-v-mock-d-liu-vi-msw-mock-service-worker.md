---
title: "Chiến lược kiểm thử GraphQL API và Mock dữ liệu với MSW (Mock Service Worker)"
date: 2026-06-21
description: "Nắm vững cách tích hợp MSW để mock các yêu cầu GraphQL phức tạp, đảm bảo môi trường test cô lập, ổn định và hiệu suất cao."
tags: ["API Testing","GraphQL","MSW","Quality Engineering"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# Chiến lược kiểm thử GraphQL API và Mock dữ liệu với MSW (Mock Service Worker)

Chào cả nhà, tôi là Duy Trung. Trong vai trò một QE Lead, chúng ta luôn đối mặt với thách thức lớn nhất khi xây dựng các ứng dụng hiện đại: làm thế nào để viết các bài test cô lập (isolated tests)?

Khi kiến trúc backend của bạn sử dụng GraphQL, vấn đề càng trở nên phức tạp hơn. GraphQL mang lại sự linh hoạt tuyệt vời cho frontend, nhưng nó cũng khiến việc mô phỏng (mocking) các phản hồi API trong môi trường unit/integration test truyền thống gặp rất nhiều khó khăn. Chúng ta không chỉ đơn giản gọi một endpoint REST; chúng ta gửi đi một *query* có cấu trúc và mong đợi một payload khớp với *schema* phức tạp đó.

Bài viết này không chỉ là hướng dẫn về công cụ, mà là một bản chiến lược toàn diện để bạn sử dụng **MSW (Mock Service Worker)** nhằm xử lý việc kiểm thử các API GraphQL một cách chuyên nghiệp nhất.

---

## 🧠 I. Tại sao chúng ta cần MSW khi test GraphQL?

Trước khi đi vào giải pháp, chúng ta cần hiểu rõ "điểm đau" (pain point).

### 1. Hạn chế của Mocking truyền thống (Jest Mocks)
Khi bạn dùng các thư viện mocking cấp độ hàm (ví dụ: `jest.fn()`, hoặc mock Axios/Fetch toàn bộ), bạn chỉ đang mô phỏng *hành vi* (behavior) của một function, chứ không phải *tương tác mạng thực tế* (actual network interaction).

Trong trường hợp GraphQL, việc gọi API là một hành động I/O (Input/Output) qua HTTP POST. Nếu chúng ta mock ở cấp độ JS functions, chúng ta bỏ qua hoàn toàn tính chất "mạng" của yêu cầu này. Điều này dẫn đến các bài test không phản ánh đúng hành vi khi ứng dụng chạy trong môi trường thực tế.

### 2. Sức mạnh vượt trội của MSW
**MSW là gì?** Mock Service Worker hoạt động bằng cách ghi đè (override) API thứ cấp của trình duyệt hoặc Node.js trên cấp độ **Service Worker**. Điều này có nghĩa là, khi bất kỳ mã nào trong ứng dụng của bạn thực hiện một yêu cầu mạng (ví dụ: `fetch` hoặc Axios), MSW sẽ chặn nó và trả về dữ liệu giả lập mà chúng ta định nghĩa, *mà không cần phải thay đổi code client hay sử dụng Jest spies*.

**Tại sao nó hoàn hảo cho GraphQL?**
1. **Giữ tính chân thực:** Mã test của bạn vẫn gọi `fetch` (hoặc thư viện GraphQL client như Apollo), nhưng yêu cầu sẽ bị MSW intercept trước khi đến bất kỳ server nào.
2. **Isolation cao:** Bạn đảm bảo rằng các bài test không phụ thuộc vào trạng thái uptime hay cấu hình của backend QA/Staging, giúp việc chạy CI/CD cực kỳ ổn định và nhanh chóng.

---

## 🛠️ II. Chiến lược tích hợp MSW với GraphQL

GraphQL API thường gửi yêu cầu dưới dạng POST body chứa các biến (variables) và tên query. Để thành công trong việc mock, chúng ta phải tập trung vào hai điểm chính: **Method** (POST) và **Body Matching**.

### Bước 1: Thiết lập Service Worker Core
Chúng ta sẽ khởi tạo MSW tại nơi cấu hình API của mình. Đối với các dự án React/Vue sử dụng `fetch` native, việc này rất đơn giản.

```javascript
// src/mocks/handlers.js (Các Handler chính)
import { rest } from 'msw';

export const handlers = [
    // Chúng ta sẽ định nghĩa handler cho GraphQL tại đây
];
```

### Bước 2: Định nghĩa Handler GraphQL bằng `rest.post`
Vì tất cả các query và mutation đều được gửi qua HTTP POST, chúng ta phải sử dụng `rest.post()` của MSW. Điểm mấu chốt là cách kita định nghĩa bộ matcher (bộ so khớp) để nó chỉ kích hoạt khi client gọi đến endpoint GraphQL cụ thể với body phù hợp.

```javascript
import { rest } from 'msw';

export const handlers = [
    // Giả sử endpoint của bạn là /graphql và dùng POST
    rest.post('/graphql', (req, res) => {
        const body = req.body; // Lấy toàn bộ body JSON mà client gửi lên

        // 1. Xác định hành động cần mock
        if (body?.query?.includes('getUserProfile')) {
            console.log("MSW đã chặn query: getUserProfile");

            // 2. Phản hồi theo cấu trúc GraphQL tiêu chuẩn (data/errors)
            const fakeResponse = {
                data: {
                    user: {
                        id: "u-101",
                        name: "Trần Minh Anh",
                        email: "minh@test.com",
                        role: "Admin"
                    }
                }
            };

            // 3. Trả về response Mock JSON
            return res.status(200).json(fakeResponse);
        } 
        
        // Xử lý các query khác nếu cần thiết (ví dụ: mutation)
        if (body?.query?.includes('createPost')) {
             return res.status(200).json({ data: { createPost: true } });
        }

        // Nếu không khớp với bất kỳ query nào được định nghĩa, trả về 400 hoặc nội dung lỗi hợp lý
        return res.status(400).json({ errors: [{ message: "Unknown GraphQL operation" }] });
    })
];
```

### Bước 3: Triển khai Test Hook (Tích hợp vào Testing Framework)
Trong các bài test (ví dụ Jest/Testing Library), chúng ta sẽ dùng hàm `server.use(handlers)` để thiết lập bộ mock handlers trước khi test chạy, và quan trọng là **khôi phục** server ban đầu sau khi test xong (`server.resetHandlers()`).

```javascript
// src/**/MyComponent.test.js

import { setupServer } from 'msw/node';
import { handlers } from '../mocks/handlers'; // Import các handler đã định nghĩa
import React from 'react';
import MyProfileComponent from '../../components/MyProfileComponent';

// Thiết lập MSW server
const server = setupServer(...handlers);

// Bắt đầu và kết thúc mô phỏng tại các hook test
beforeAll(() => {
    server.listen(); // Kích hoạt server mock khi suite bắt đầu
});

afterEach(() => {
    server.resetHandlers(); // Xóa handler cụ thể sau mỗi lần test
});

afterAll(() => {
    server.close(); // Dừng server khi toàn bộ suite kết thúc
});

test('hiển thị thông tin người dùng thành công với mock data', async () => {
    // 1. Hành động: Component gọi GraphQL client (ví dụ: Apollo/Relay)
    render(<MyProfileComponent />);
    
    // 2. Assert: Kiểm tra xem UI có hiển thị đúng dữ liệu mô phỏng không?
    await waitFor(() => {
        expect(screen.getByText("Trần Minh Anh")).toBeInTheDocument(); // Data từ mock response
        expect(screen.getByText("Admin")).toBeInTheDocument(); 
    });

    // Kiểm tra bằng console log để xác nhận MSW đã can thiệp thành công (nếu cần)
    console.log("Kiểm test hoàn tất: Dữ liệu được lấy từ Mock Server.");
});
```

---

## ✨ III. Các chiến lược nâng cao của QE Lead

Là một chuyên gia, tôi không chỉ muốn bạn chạy code mà còn phải nghĩ đến khả năng mở rộng và độ tin cậy (Reliability) của hệ thống test. Dưới đây là ba lưu ý quan trọng:

### 1. Xử lý các trường hợp lỗi (Error Handling)
Không nên chỉ mock thành công (`200 OK`). Bạn phải mock cả các tình huống thất bại:
*   **Lỗi API mạng:** Trả về trạng thái `503 Service Unavailable`.
*   **Lỗi GraphQL Schema:** Mô phỏng phản hồi có trường `errors` (theo chuẩn GraphQL), giúp test logic fallback của client.

```javascript
// Ví dụ Mock Error
rest.post('/graphql', (req, res) => {
    if (req.body.variables.id === 'invalid') {
        const errorResponse = {
            data: null,
            errors: [{ 
                message: "User not found", 
                locations: [], 
                extensions: { code: "NOT_FOUND" } 
            }]
        };
        return res.status(200).json(errorResponse); // Vẫn là 200, nhưng data chứa lỗi
    }
    // ... (thành công)
});
```

### 2. Mocking theo Biến số (Variable-Based Mocking)
Nếu bạn có nhiều query cùng một endpoint nhưng với các biến khác nhau (`id: '1'` vs `id: '2'`), bạn cần nâng cấp khả năng match của MSW bằng cách kiểm tra nội dung payload request.

```javascript
// Lọc theo giá trị ID cụ thể trong body gửi lên
rest.post('/graphql', (req, res) => {
    const variables = req.body.variables;

    if (variables?.id === 'premium-user') {
        return res.status(200).json({ data: { user: { role: "PREMIUM" } } });
    } else if (variables?.id === 'guest') {
         return res.status(200).json({ data: { user: { role: "GUEST" } } });
    }

    // ... default error handling
});
```

### 3. Tách biệt lớp API Service
Để hệ thống test sạch sẽ và dễ bảo trì, hãy luôn tách logic gọi GraphQL ra khỏi Component UI (ví dụ: đặt trong `UserAPI.js`). Khi đó, bạn chỉ cần cấu hình MSW tại **điểm truy cập** API này.

---

## 🚀 Kết luận

Kiến trúc ứng dụng hiện đại đòi hỏi một hệ thống kiểm thử vừa toàn diện lại vừa nhanh chóng. Bằng cách áp dụng MSW, chúng ta đã chuyển đổi từ việc mô phỏng *hành vi* test sang mô phỏng *môi trường mạng thực tế*.

Đối với bất kỳ đội ngũ đang phát triển các ứng dụng GraphQL phức tạp nào, tôi khuyên bạn hãy dành thời gian để làm chủ chiến lược Mocking này. Nó không chỉ nâng cao chất lượng code mà còn giúp quy trình CI/CD của bạn trở nên cực kỳ đáng tin cậy.

Hy vọng bài viết này sẽ là nguồn tài liệu tham khảo giá trị cho các kỹ sư QA và Developers trong lĩnh vực. Nếu có bất kỳ thắc mắc nào về việc tối ưu hóa test suite, đừng ngần ngại để lại bình luận nhé! Chúc mọi người thành công với những bài kiểm thử chất lượng nhất!

**Duy Trung**
*QE Lead*