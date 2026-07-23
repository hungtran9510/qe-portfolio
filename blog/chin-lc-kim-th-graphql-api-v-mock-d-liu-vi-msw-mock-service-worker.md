---
title: "Chiến lược kiểm thử GraphQL API và Mock dữ liệu với MSW (Mock Service Worker)"
date: 2026-06-18
description: "Khám phá cách xây dựng chiến lược kiểm thử mạnh mẽ cho GraphQL bằng cách sử dụng Mock Service Worker (MSW) để cô lập môi trường client."
tags: ["API Testing","GraphQL","MSW"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# Chiến lược kiểm thử GraphQL API và Mock dữ liệu với MSW (Mock Service Worker)

Chào các bạn đồng nghiệp trong ngành Chất lượng Phần mềm! Tôi là Duy Trung, một QE Lead.

Trong hành trình của chúng ta trở thành những chuyên gia QA/QE thực thụ, việc kiểm thử giao diện lập trình ứng dụng (API Testing) là chủ đề không thể bỏ qua. Gần đây, GraphQL đã trở thành một tiêu chuẩn vàng cho nhiều hệ thống phức tạp nhờ khả năng Client-driven data fetching. Tuy nhiên, chính sự linh hoạt này lại mang đến những thách thức lớn trong khâu kiểm thử tự động hóa, đặc biệt là khi chúng ta cần mô phỏng (mock) dữ liệu API ở mức độ tin cậy cao.

Trong bài viết chuyên sâu hôm nay, tôi sẽ cùng các bạn giải mã chiến lược kết hợp GraphQL và Mock Service Worker (MSW)—một kỹ thuật được nhiều đội ngũ hiện đại áp dụng để xây dựng bộ test ổn định, nhanh chóng và cô lập tuyệt đối.

***

## 🚀 Phần I: Tại sao việc kiểm thử GraphQL lại phức tạp hơn REST?

Khi bắt đầu với API testing, chúng ta thường nghĩ đến các endpoint tĩnh (ví dụ: `/users/1`, `/products`). Đây là mô hình của REST. Bạn gọi một URL $\rightarrow$ bạn nhận được một tài nguyên xác định.

GraphQL thay đổi cuộc chơi. Nó không nhất thiết tuân thủ kiến trúc Resource-Oriented. Thay vào đó, nó hoạt động dựa trên **Schema** và **Queries**.

1.  **Tính linh hoạt cao (Client Agnostic):** Client tự quyết định dữ liệu nào cần (`{ user { id name email } }`). Điều này khiến chúng ta không thể chỉ Mock bằng cách kiểm tra URL request đơn thuần.
2.  **Phương thức POST duy nhất:** Hầu hết các implement GraphQL đều tập trung tất cả requests vào một endpoint `/graphql` bằng phương thức `POST`. Các biến (variables) và câu lệnh truy vấn (`query`) được chứa trong Body của request, không nằm ở đường dẫn URL.

Vấn đề chính mà QE gặp phải là: Làm sao để viết test case kiểm tra logic nghiệp vụ client (ví dụ: "Nếu user A yêu cầu danh sách bạn bè và dữ liệu trả về có trường `isActive` là false, thì UI phải hiển thị message 'User không hoạt động'") khi hệ thống API thực tế lại đang *offline* hoặc *chưa ổn định*?

Đây chính là lúc chúng ta cần các lớp mô phỏng mạnh mẽ hơn mức độ mock đơn thuần trong Jest/Vitest.

## 🧱 Phần II: MSW - Giải pháp Mock ở cấp Độ Mạng (Network Level)

Vậy, Mock Service Worker (MSW) là gì và tại sao nó lại vượt trội?

**Giải thích:**
MSW không phải là một thư viện mock dữ liệu đơn thuần. Nó hoạt động bằng cách **intercept** (can thiệp/chặn) các request HTTP của ứng dụng của bạn *ngay trước khi chúng rời khỏi trình duyệt* hoặc hệ thống test runner.

Thay vì thay đổi hành vi của một hàm JavaScript (như việc giả lập `fetch` trong Jest), MSW mô phỏng lại chính **hành vi của mạng lưới**. Nó cho phép chúng ta nói với bộ test: "Bất cứ khi nào ứng dụng gọi đến `/graphql` bằng phương thức POST, hãy coi như nó đã nhận được dữ liệu này (JSON Payload) và không cần phải thực sự gọi API thật."

**Lợi ích cốt lõi:**
*   **Isolation (Cô lập):** Test case của bạn hoàn toàn tách biệt với trạng thái của backend. Bạn chỉ kiểm tra logic client, đảm bảo rằng UI phản ứng đúng với mọi loại dữ liệu có thể xảy ra (dữ liệu thành công, lỗi 404, lỗi định dạng).
*   **Realistic Simulation:** Vì nó hoạt động ở tầng Network, các thư viện component testing như React Testing Library hoặc Vue Test Utils vẫn cảm thấy như đang chạy trong môi trường thực.

## 👨‍💻 Phần III: Chiến lược Tích hợp GraphQL và MSW

Khi kết hợp hai công nghệ này, chúng ta cần thay đổi tư duy kiểm thử từ "Test function call" sang **"Test network contract fulfillment"**.

### Bước 1: Xác định Contract (Hợp đồng Dữ liệu)
Trước khi viết test, hãy xác định các kịch bản dữ liệu mà bạn muốn mô phỏng. Ví dụ:
*   **Kịch bản thành công:** User có ít nhất 5 bài đăng và tất cả đều active.
*   **Kịch bản rỗng (Empty State):** Người dùng chưa có bất kỳ bài đăng nào.
*   **Kịch bản lỗi nghiệp vụ:** API trả về danh sách nhưng với trường `hasPermission: false`.

### Bước 2: Xây dựng Handler bằng MSW
Vì GraphQL gửi tất cả mọi thứ trong Body POST, chúng ta phải sử dụng các matcher mạnh mẽ hơn là chỉ kiểm tra URL. Chúng ta cần tìm kiếm và khớp payload JSON của request (body) để biết chính xác khi nào thì handler của mình được kích hoạt.

### Bước 3: Thực hiện Test Isolation
Khi chạy bài test, bạn sẽ thiết lập MSW Server với handlers đã định nghĩa. Khi component gọi đến GraphQL Client (ví dụ: Apollo Client), MSW sẽ chặn lại và trả về mock data mà chúng ta cung cấp, cho phép React Component Tree của bạn render/react đúng cách.

## 🛠️ Phần IV: Code Example Chi Tiết - Mocking GraphQL Query

Để minh họa tính thực tế cao nhất, tôi xin đưa ra một ví dụ cụ thể bằng JavaScript/TypeScript sử dụng `msw` và giả định ta đang test một component hiển thị danh sách sản phẩm (Product List).

**Giả định:**
*   Endpoint API: `/graphql`
*   Phương thức: POST
*   Dữ liệu gửi đi (Payload): Chứa `{ query: "...", variables: { limit: 10 } }`

### Code Setup (setupMockServer.js)

Chúng ta cần import `http` method của MSW và định nghĩa một handler kiểm tra body request.

```javascript
// setupMockServer.js (File thiết lập môi trường Mock)
import { rest, setupServer } from 'msw/node'; 

// Khởi tạo Server với các handlers
const server = setupServer();

// --- HANDLER CHO KỊCH BẢN THÀNH CÔNG (SUCCESS SCENARIO) ---
server.use(
  rest('graphql', { method: 'POST' }, async (req, res, ctx) => {
    // 1. Lấy body request thực tế từ client đang gọi API
    const requestBody = await req.json();
    
    // 2. KIỂM TRA BẰNG QUERY/VARIABLES HOẶC BODY SPECIFIC
    if (requestBody.query.includes("getProductList")) {
      console.log("🚀 MSW đã intercept request cho Product List thành công.");

      // Trả về JSON body mô phỏng dữ liệu từ API thật
      return res(ctx.status(200), ctx.json({
        data: {
          productDetails: [
            { id: "P1", name: "Laptop XYZ", price: 1200 },
            { id: "P2", name: "Mouse Wireless", price: 25 }
          ]
        }
      }));
    }

    // --- HANDLER CHO KỊCH BẢN KHÔNG TÌM THẤY QUERY NÀO ĐẶC BIỆT (DEFAULT CATCH-ALL) ---
    return res(ctx.status(400), ctx.json({
        errors: [{ message: "GraphQL Query không hợp lệ." }]
    }));

  })
);

// Export các hàm bật/tắt server để sử dụng trong file test.js
export const setupMock = {
    server,
    resetServer: async () => { 
        server.resetHandlers(); 
        await server.rest.reset(); 
    }
};
```

**Giải thích của Duy Trung:**

1.  `setupServer()`: Chúng ta thiết lập một máy chủ giả mạo.
2.  `rest('graphql', { method: 'POST' }, ...)`: Dòng này chỉ định rằng bất kỳ request nào tới `/graphql` qua POST sẽ bị chúng ta kiểm soát.
3.  `async (req, res, ctx) => {...}`: Đây là phần xử lý logic mock của chúng ta. `req` chứa tất cả thông tin về request đến (bao gồm cả body), và `res`/`ctx` dùng để trả lời response giả lập.
4.  **Điểm mấu chốt:** Thay vì chỉ kiểm tra URL, chúng ta sử dụng logic bên trong handler để phân tích `requestBody`. Điều này giúp mô phỏng sự kiện: "Nếu client gửi yêu cầu chứa chuỗi 'getProductList', thì API phải trả về danh sách sản phẩm này."
5.  `server.resetHandlers()`: Đây là bước cực kỳ quan trọng. Nó đảm bảo rằng giữa các test case khác nhau, mock server sẽ được làm sạch hoàn toàn để tránh tình trạng "mock lọt" (leakage) làm ảnh hưởng đến tính độc lập của unit/integration test.

### Code Usage (product.test.js)

```javascript
// product.test.js (File test thực tế)
import { render, screen } from '@testing-library/react';
import ProductList from '../components/ProductList';
import { setupMock } from './setupMockServer'; // Import handler đã tạo

describe('ProductList Component with GraphQL Mocking', () => {
    // SETUP: Kích hoạt server trước khi chạy bộ test này
    beforeAll(() => setupMock.server.listen()); 
    // TEARDOWN: Vô hiệu hóa server sau khi chạy xong
    afterEach(() => setupMock.resetServer());

    it('should display product list correctly when API succeeds', async () => {
        // Setup đã cấu hình ở trên, test này sẽ sử dụng mock dữ liệu thành công.
        
        render(<ProductList />); 
        
        // Do MSW trả về JSON Mock, component sẽ nhận được data và render đúng.
        expect(screen.getByText(/Laptop XYZ/i)).toBeInTheDocument();
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();

    });

    it('should display empty state when API returns no results', async () => {
        // *Cần reset server và setup handler khác cho kịch bản lỗi/rỗng*
        await setupMock.server.use(
             rest('graphql', { method: 'POST' }, (req, res) => 
                 res.status(200).json({ data: { productDetails: [] } })
             )
        );
        
        render(<ProductList />);
        await waitFor(() => {
            expect(screen.getByText("Không có sản phẩm nào được tìm thấy")).toBeInTheDocument();
        });
    });

    it('should handle network error gracefully', async () => {
        // Mô phỏng lỗi mạng (Network failure)
        await setupMock.server.use(
             rest('graphql', { method: 'POST' }, (req, res, ctx) => 
                 res(ctx.status(503), ctx.json({ error: "Service Unavailable" })) // Trả về status lỗi mạng
             )
        );

        render(<ProductList />);
        // Logic component phải nhận diện và hiển thị thông báo lỗi fallback
        await waitFor(() => {
            expect(screen.getByText(/Lỗi kết nối API/i)).toBeInTheDocument();
        });
    });
});
```

## ✨ Kết Luận: Tầm nhìn của QE trong Kiến trúc Hiện đại

Sử dụng MSW để kiểm thử GraphQL không chỉ là một mẹo vặt kỹ thuật; nó là việc xây dựng một lớp **kiểm soát hợp đồng (Contract Control Layer)** trong bộ test của bạn.

Là một QE Lead, tôi luôn nhấn mạnh rằng mục tiêu tối thượng khi kiểm thử Client-Server là: **Đảm bảo rằng giao diện người dùng hoạt động hoàn hảo cho mọi trường hợp dữ liệu có thể xảy ra trên backend, mà không cần phải triển khai và duy trì môi trường backend đầy đủ.**

MSW đã giúp chúng ta đạt được điều này. Nó biến API testing phức tạp thành một quá trình kiểm thử mô phỏng mạng (Network Simulation Testing) đơn giản hơn, nhanh hơn và tin cậy hơn bao giờ hết.

Hy vọng bài viết này sẽ cung cấp cho các bạn cái nhìn sâu sắc và chiến lược thực tiễn để nâng tầm khả năng tự động hóa test của mình! Nếu có bất kỳ thắc mắc nào về việc tối ưu hoá bộ test với kiến trúc GraphQL, đừng ngần ngại thảo luận cùng tôi nhé.

**Duy Trung**
*QE Lead - Software Quality Engineer*