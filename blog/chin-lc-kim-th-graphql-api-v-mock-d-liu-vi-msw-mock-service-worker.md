---
title: "Chiến lược kiểm thử GraphQL API và Mock dữ liệu với MSW (Mock Service Worker)"
date: 2026-06-13
description: "Khám phá chiến lược kiểm thử GraphQL chuyên sâu, sử dụng MSW để mock các yêu cầu mạng, đảm bảo môi trường test ổn định và chính xác."
tags: ["API Testing","GraphQL","MSW"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# Chiến lược kiểm thử GraphQL API và Mock dữ liệu với MSW (Mock Service Worker)

Xin chào các đồng nghiệp! Tôi là Duy Trung, một Quality Engineer chuyên về tối ưu hóa quy trình chất lượng phần mềm.

Trong thế giới phát triển ứng dụng hiện đại, đặc biệt khi chúng ta làm việc với kiến trúc Microservices hoặc sử dụng GraphQL – nơi client có quyền kiểm soát chính xác dữ liệu cần lấy – thì vấn đề về môi trường kiểm thử (testing environment) trở thành một thách thức lớn. Việc phụ thuộc vào các service backend thật để chạy unit test hay integration test không chỉ làm chậm tốc độ CI/CD mà còn dẫn đến những lỗi khó lường do trạng thái của các dịch vụ bên ngoài.

Vậy, làm thế nào để chúng ta có thể cô lập (isolate) frontend và logic nghiệp vụ khỏi sự biến động của backend, đặc biệt với một giao thức phức tạp như GraphQL?

Hôm nay, tôi sẽ cùng các bạn đi sâu vào việc xây dựng một chiến lược kiểm thử mạnh mẽ, kết hợp sức mạnh của **GraphQL** và công cụ mock dữ liệu đột phá: **Mock Service Worker (MSW)**.

***

## 🎯 I. Vấn đề: Tại sao Mocking GraphQL lại khó hơn REST?

Nếu bạn đã quen với API kiểu REST, việc mocking các endpoint là tương đối trực quan: `GET /users/1`, `POST /create`. Bạn chỉ cần can thiệp vào request path và method.

GraphQL hoạt động rất khác. Về mặt kỹ thuật, hầu hết tất cả các truy vấn (Query), đột biến (Mutation) và đăng ký sự kiện (Subscription) đều được gửi qua **một điểm cuối (endpoint) duy nhất**, thường là `/graphql`, dưới dạng một yêu cầu `POST` với body chứa chuỗi GraphQL Query/Mutation.

Đây chính là nút thắt: Khi ta muốn mock, chúng ta không thể chỉ dựa vào URL. Chúng ta phải can thiệp sâu hơn vào *payload* của request (body) để xác định loại thao tác đang được thực hiện. Đây là lúc MSW phát huy tối đa sức mạnh của nó.

## 🚀 II. Giải pháp: Mock Service Worker (MSW) - Cấp độ Interception Mạng

**Mock Service Worker (MSW)** không chỉ là một công cụ mock dữ liệu; nó hoạt động ở tầng mạng (Network Layer). Nó cho phép bạn chặn và thay thế các phản hồi HTTP/Fetch/XHR *ngay tại trình duyệt hoặc môi trường Node.js* mà không cần phải giả lập server backend thực sự.

Sức mạnh của MSW nằm ở khả năng sử dụng **Interceptors** – cơ chế can thiệp yêu cầu mạng trước khi chúng được gửi đi. Điều này giúp chúng ta có thể đọc và phân tích toàn bộ body (dù là JSON, FormData, hay các loại payload khác) để đưa ra quyết định mock phản hồi một cách thông minh nhất.

## ⚙️ III. Triển khai Chiến lược Mocking GraphQL với MSW

Chiến lược cốt lõi của chúng ta là: **Sử dụng `rest.post` và phân tích body JSON GraphQLL trong request handler.**

Hãy xem qua các bước triển khai cụ thể (Giả sử bạn đang dùng TypeScript/ReactJS):

### 1. Cài đặt và Thiết lập MSW

Đầu tiên, chúng ta cần thiết lập bộ mô phỏng dịch vụ:

```bash
npm install msw --save-dev
# Hoặc cho TypeScript
npm install msw @types/msw --save-dev
```

Sau đó, tạo file cấu hình mock (ví dụ: `src/mocks/handlers.js`):

### 2. Định nghĩa Handler Intercepting POST Requests

Vì tất cả GraphQL đều đi qua `/graphql` bằng phương thức `POST`, chúng ta sẽ thiết lập một handler chung cho endpoint này. Đây là phần quan trọng nhất, nơi logic phân tích request của chúng ta diễn ra.

**Code Ví dụ (Duy Trung's Expert Code):**

```javascript
import { rest } from 'msw';

// Định nghĩa Handler tổng quát cho tất cả các yêu cầu đến /graphql
export const graphqlHandlers = [
  rest.post('https://api.mycorp.com/graphql', async (req, res, ctx) => {
    try {
      // 1. Lấy body request đã gửi đi
      const graphQLPayload = await req.json();
      const query = graphQLPayload.query;

      if (!query) {
        return res(ctx.status = 400, ctx.json = { errors: [{ message: "GraphQL payload missing query." }] });
      }

      // --- Bắt đầu Logic Phân tích Truy vấn (The Core Logic) ---

      // Ví dụ 1: Mock Mutation để tạo user mới
      if (query.includes("createUser")) {
        const variables = graphQLPayload.variables;
        console.log(`[MSW Intercepted] Attempting to create user with email: ${variables?.email}`);

        return res(ctx.status = 200, ctx.json = {
          data: {
            createUserInput: { 
              id: "mock-user-123", 
              username: variables.username 
            }
          }
        });
      }

      // Ví dụ 2: Mock Query để lấy danh sách products
      if (query.includes("listProducts")) {
        const productCount = graphQLPayload.variables?.limit || 10;
        console.log(`[MSW Intercepted] Requesting list of ${productCount} products.`);

        // Trả về mảng mock data cụ thể cho trường hợp này
        return res(ctx.status = 200, ctx.json = {
          data: {
            listProducts: [
              { id: "P1", name: "Mock Laptop", price: 1500 },
              { id: "P2", name: "Mock Monitor", price: 300 }
            ]
          }
        });
      }

      // Fallback (Nếu không khớp với loại query nào): Trả về lỗi giả lập
      return res(ctx.status = 500, ctx.json = { 
          errors: [{ message: `Unhandled GraphQL operation detected in mock.` }] 
      });

    } catch (error) {
      console.error("Error handling GraphQL mock:", error);
      return res(ctx.status = 500, ctx.json = { errors: [{ message: "Mock server internal error." }] });
    }
  }),
];
```

### ✨ Phân tích Chuyên sâu của Duy Trung

Trong đoạn code trên, bạn có thể thấy sức mạnh của `rest.post`:

1. **`await req.json()`**: Đây là chìa khóa! Thay vì chỉ xem xét URL (mà luôn là `/graphql`), chúng ta cần *đọc* nội dung JSON được gửi đi trong body request.
2. **Kiểm tra bằng `query.includes(...)`**: Chúng ta không thể sử dụng phương pháp so sánh chuỗi hoàn hảo vì việc đó quá phức tạp và dễ hỏng khi thay đổi cấu trúc GraphQL. Thay vào đó, chúng ta dùng kỹ thuật kiểm tra từ khóa (`includes`) để xác định mục đích của client (ví dụ: nếu truy vấn chứa chuỗi `createUser`, thì chắc chắn nó là một Mutation tạo người dùng).
3. **Sử dụng Variables**: Đối với các biến đi kèm (`variables`), chúng ta có thể lấy ra và mock phản hồi tùy chỉnh, giả lập cả trường hợp thành công lẫn thất bại (ví dụ: kiểm tra xem email đã tồn tại hay chưa).

## ✅ IV. Các Kịch bản Kiểm thử Nâng cao bằng MSW/GraphQL

Việc chỉ mocking các tình huống thành công là không đủ trong QE. Một chiến lược vững chắc phải bao gồm cả việc mô phỏng lỗi.

### 1. Mocking Lỗi Xác thực (Authentication Failure)

Bạn có thể mock phản hồi ngay khi client gửi đi request mà thiếu token, hoặc với token hết hạn:

```javascript
// Thêm logic vào handler chính ở trên
if (/* kiểm tra xem header 'Authorization' có bị thiếu không */) {
    return res(ctx.status = 401, ctx.json = { 
        errors: [{ message: "Authentication required.", extensions: { code: "UNAUTHENTICATED" } }] 
    });
}
```

### 2. Mocking Lỗi Nghiệp vụ (Business Logic Error)

Đây là kịch bản mà backend sẽ trả về lỗi nhưng với status HTTP là `200 OK` vì đó là cách GraphQL thường hoạt động khi xảy ra validation error:

```javascript
// Ví dụ: Khi user cố gắng đặt mật khẩu yếu quá
if (query.includes("updatePassword") && variables.newPassword.length < 8) {
    return res(ctx.status = 200, ctx.json = { 
        data: null, // Hoặc chỉ chứa fields error
        errors: [{ message: "Mật khẩu phải tối thiểu 8 ký tự để đảm bảo an toàn." }] 
    });
}
```

### 3. Xử lý Caching và Tái Hiện Trạng Thái (State Management)

Một kỹ thuật nâng cao là sử dụng bộ nhớ cục bộ (hoặc biến trạng thái trong mock server) để mô phỏng việc thay đổi trạng thái của dữ liệu qua các lần gọi API liên tiếp (ví dụ: khi một Mutation thành công, nó sẽ trả về ID mới và client phải dùng ID đó cho Query tiếp theo). MSW giúp chúng ta quản lý vòng đời này rất tốt.

## 💡 V. Tổng kết: Vì sao nên chọn chiến lược này?

Việc áp dụng GraphQL cùng với MSW mang lại những lợi ích vượt trội trong quy trình kiểm thử của bạn:

1. **Độ Tốc Độ (Speed):** Unit và Integration test chạy cực nhanh vì chúng không cần gọi đến bất kỳ service nào ngoài môi trường local/memory.
2. **Tính Cô Lập (Isolation):** Frontend chỉ phụ thuộc vào các phản hồi đã định nghĩa trong mock, loại bỏ rủi ro từ sự cố của backend.
3. **Độ Tin Cậy (Reliability):** Chúng ta có thể kiểm thử *tất cả* các kịch bản lỗi, bao gồm 401 Unauthorized, Validation Errors, v.v., một cách hệ thống và tự động.

***

Tóm lại, MSW không chỉ là một giải pháp thay thế cho mocking thủ công; nó là một **công cụ mô phỏng mạng lưới thông minh** (Smart Network Emulator). Bằng cách sử dụng Interceptors để phân tích nội dung GraphQL Body, chúng ta có thể xây dựng các lớp kiểm thử rất sâu và chính xác.

Tôi hy vọng bài viết này đã cung cấp cho các bạn cái nhìn tổng quan và đầy đủ về cách tối ưu hóa quá trình kiểm thử API dựa trên nền tảng GraphQL. Hãy bắt tay vào áp dụng chiến lược này để nâng tầm chất lượng phần mềm của mình nhé!

Chúc mọi người thành công trong các dự án QA sắp tới!

**Trân trọng,**
**Duy Trung**
*QE Lead | Software Quality Assurance Expert*