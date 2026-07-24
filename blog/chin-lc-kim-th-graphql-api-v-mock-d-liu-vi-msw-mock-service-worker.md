---
title: "Chiến lược kiểm thử GraphQL API và Mock dữ liệu với MSW (Mock Service Worker)"
date: 2026-06-19
description: "Khám phá cách QE Lead Duy Trung xây dựng chiến lược mock dữ liệu mạnh mẽ cho GraphQL bằng MSW, đảm bảo tốc độ và tính cô lập của bài test."
tags: ["API Testing","GraphQL","MSW"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# Chiến lược kiểm thử GraphQL API và Mock dữ liệu với MSW (Mock Service Worker)

Chào các đồng nghiệp trong ngành Chất lượng, tôi là Duy Trung. Trong vai trò một Quality Engineer Lead, tôi thường xuyên đối mặt với thách thức tối thượng khi phát triển ứng dụng hiện đại: **Làm thế nào để kiểm tra giao diện người dùng (UI/UX) và logic frontend mà không phụ thuộc vào sự sẵn sàng hay tốc độ của backend?**

Khi chúng ta nói về việc gọi API, hầu hết mọi người nghĩ đến REST. Nhưng ngày nay, với sự trỗi dậy của GraphQL, vấn đề trở nên phức tạp hơn một cấp độ. GraphQL mang lại sức mạnh tối ưu hóa dữ liệu tuyệt vời, nhưng đồng thời, nó cũng yêu cầu một chiến lược kiểm thử mocking khác biệt và tinh vi hơn nhiều.

Bài viết này không chỉ là lý thuyết. Tôi sẽ cung cấp cho bạn một chiến lược thực tế, toàn diện về việc kết hợp **GraphQL** với khả năng mô phỏng mạng lưới đỉnh cao từ thư viện **MSW (Mock Service Worker)**.

---

## 🚀 I. Tại sao GraphQL Testing lại khác biệt?

Trước hết, chúng ta cần hiểu rõ bản chất của vấn đề. Khi bạn kiểm thử một API REST truyền thống, bạn thường mock các endpoint cụ thể (`/users`, `/products/{id}`).

GraphQL thay đổi luật chơi:

1. **Single Endpoint, Dynamic Schema:** Bạn luôn gọi đến cùng một điểm cuối (ví dụ: `/graphql`) qua phương thức POST. Tuy nhiên, nội dung request body lại chứa toàn bộ định nghĩa về schema và các biến số (`query` và `variables`).
2. **Complexity in Payloads:** Việc kiểm thử phải tập trung vào việc xác minh rằng ứng dụng xử lý được *các trường hợp dữ liệu khác nhau* (variations) dựa trên query, chứ không chỉ là xác nhận một endpoint hoạt động.

Nếu bạn sử dụng các phương pháp mocking truyền thống như `jest.mock('axios')`, bạn đang mock cấp độ hàm Javascript, nghĩa là bạn giả lập hành vi của hàm HTTP client. Điều này thiếu tính thực tế (less realistic) vì nó bỏ qua toàn bộ lớp network overhead và cách trình duyệt *thực sự* gửi request đi.

**Đây chính là lúc MSW tỏa sáng.**

## 🛠️ II. Mô hình hoạt động của MSW: Sự khác biệt cốt lõi

MSW không phải là một library mocking hàm; **nó là một Interceptor cấp độ Service Worker**.

Khi bạn cài đặt MSW, nó lắng nghe tất cả các lời gọi mạng (network calls) từ ứng dụng của bạn (từ Fetch API hoặc XMLHttpRequest). Thay vì để các request này đi đến server thật, MSW sẽ chặn chúng lại và trả về dữ liệu mock mà bạn định nghĩa.

### Ưu điểm vượt trội khi kết hợp với GraphQL:

1. **Tính chân thực cao (High Fidelity):** Vì nó hoạt động ở lớp network interception, hành vi của bài test gần như giống hệt khi chạy trong trình duyệt thật.
2. **Isolation Tuyệt đối:** Test của bạn hoàn toàn cô lập khỏi trạng thái của backend, đảm bảo tốc độ và tính nhất quán cho bộ suite kiểm thử (Test Suite).
3. **Hỗ trợ GraphQL Payload:** Chúng ta có thể dễ dàng mô phỏng việc nhận diện một request POST cụ thể mang payload `{"query": "...", "variables": {...}}` mà không cần quan tâm đến endpoint URL.

## 💡 III. Triển khai Mocking GraphQL với MSW: Hướng dẫn thực tế

Bây giờ, chúng ta đi vào phần cốt lõi kỹ thuật. Mục tiêu là lắng nghe mọi request POST tới `/graphql`, phân tích body để xác định loại query nào đang được gửi (ví dụ: `fetchUserById`), và trả về dữ liệu giả lập phù hợp với schema của query đó.

Giả sử bạn có một endpoint GraphQL tại `/graphql` và bạn muốn mô phỏng việc lấy thông tin người dùng theo ID.

### Bước 1: Thiết lập Service Worker Handler

Chúng ta cần tạo một handler lắng nghe phương thức `POST` tới URL gốc (hoặc URL GraphQL của bạn).

```javascript
// src/mocks/handlers.js
import { rest } from 'msw';

export const handlers = [
  // Lắng nghe mọi request POST đến /graphql
  rest.post('/graphql', async (req, res) => {
    const { query, variables } = req.body;

    if (!query || !variables) {
      return res.status(400).json({ error: "GraphQL payload is missing." });
    }

    // Logic phân tích request body để quyết định dữ liệu mock nào sẽ trả về
    // Chúng ta tìm kiếm từ khóa 'fetchUser' trong chuỗi query
    if (query.includes('user(id: $userId)')) {
      const userId = variables?.userId || "defaultId";

      // --- Dữ liệu Mocking Thành công (Success Case) ---
      const mockUserData = {
        data: {
          user: {
            id: userId,
            name: `John Doe ${userId}`, // Tùy biến dữ liệu theo biến
            email: `${userId}@example.com`,
            joinDate: "2023-01-01",
            profile: { bio: "A dedicated QE." }
          }
        }
      };

      return res.status(200).json(mockUserData);

    } 
    
    // --- Dữ liệu Mocking Trạng thái Lỗi (Error Case) ---
    else if (query.includes('nonExistentField')) {
       // Mô phỏng lỗi từ Server/GraphQL layer
      return res.status(200).json({ 
        errors: [{ message: "Field 'nonExistentField' does not exist on type 'User'." }] 
      });

    } else {
      // Trả về kết quả mặc định nếu không khớp schema nào
      return res.status(406).json({ error: "Mocked Schema Not Found." });
    }
  }),
];
```

### Bước 2: Bắt đầu và Kết thúc Mocking (Setup/Teardown)

Trong môi trường test suite của bạn (ví dụ: trong `setupTests.js`), bạn sẽ khởi động MSW trước khi chạy bài test và tắt nó sau khi hoàn thành.

*(Giả định bạn đang sử dụng Vitest hoặc Jest)*

```javascript
// src/setupTests.js
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

// Thiết lập server mock bằng các handlers đã định nghĩa
const server = setupServer(...handlers);

// Start server trước khi test suite chạy
beforeAll(() => server.listen());

// End server sau khi test suite kết thúc
afterEach(() => server.resetHandlers()); // Quan trọng: Reset state giữa các test case
afterAll(() => server.close()); 
```

## ✅ IV. Chiến lược nâng cao (Advanced Strategies)

Là một QE Lead, tôi không chỉ dừng lại ở việc mock thành công hay thất bại đơn thuần. Bạn cần kiểm tra cả **tất cả các khía cạnh** của giao tiếp API:

### 1. Testing Mutations (Thao tác dữ liệu)

Đối với GraphQL Mutations (ví dụ: tạo người dùng mới), bạn sẽ mô phỏng quá trình nhận được một payload chứa xác nhận thành công, kèm theo đối tượng dữ liệu vừa được tạo ra (Create Object):

```javascript
// ... trong handlers.js
rest.post('/graphql', async (req, res) => {
    if (query.includes('createUser')) {
        const newUserData = { id: Date.now(), name: variables.name };
        return res.status(200).json({ 
            data: { createUser: newUserData } 
        });
    }
// ...
```

### 2. Mocking Trạng thái Lỗi (Error States)

Đây là phần quan trọng nhất đối với QA. Bạn phải mock các tình huống lỗi ở mọi cấp độ:

*   **Network Failure:** Tắt hoàn toàn server/mất mạng (MSW cho phép xử lý trường hợp này).
*   **GraphQL Error:** Backend trả về HTTP 200 OK nhưng trong body có mảng `errors` (ví dụ: thiếu quyền, định dạng dữ liệu sai). *Ví dụ trên đã bao gồm việc này.*
*   **Validation Error:** Dữ liệu gửi lên vi phạm quy tắc nghiệp vụ.

### 3. Xử lý Pagination và Trạng thái Tăng dần (Pagination & Cursor)

Khi bạn cần kiểm tra logic phân trang, hãy sử dụng MSW để trả về các tập dữ liệu giả lập với độ sâu khác nhau (Deep Mocking), mô phỏng quá trình gọi tiếp theo bằng cách cập nhật `cursor` hoặc `offset`:

*   **Call 1:** Trả về 20 bản ghi và Cursor X.
*   **Call 2:** Lắng nghe request chứa Cursor X, trả về 20 bản ghi tiếp theo và Cursor Y.

## 🏁 Kết luận: Tầm quan trọng của Sự Cô lập (Isolation)

Việc sử dụng MSW để mock GraphQL payload không chỉ là một mẹo vặt kỹ thuật; nó là việc thực thi nguyên tắc **Isolation** ở mức độ cao nhất.

Nó giúp bạn chuyển đổi quá trình kiểm thử từ trạng thái "Phụ thuộc vào Môi trường" sang trạng thái "**Kiểm tra tính Đúng đắn của Logic (Logic Correctness)**". Bạn có thể chạy hàng nghìn test case về mọi viền kịch bản (Edge Cases) mà không cần lo lắng về thời gian phản hồi, tình trạng tài nguyên, hay khả năng deploy thành công của backend.

Nếu bạn đang phát triển với GraphQL và nhận thấy bộ kiểm thử Unit/Integration của mình bị chậm hoặc khó tái lập (non-deterministic), thì việc tích hợp MSW là một khoản đầu tư bắt buộc cho đội ngũ Chất lượng của bạn.

Chúc các đồng nghiệp luôn giữ vững tinh thần chất lượng trong từng dòng code!
***
**Duy Trung**
*Quality Engineer Lead | Chuyên gia Test Strategy.*