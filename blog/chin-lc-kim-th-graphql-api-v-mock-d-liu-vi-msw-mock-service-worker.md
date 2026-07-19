---
title: "Chiến lược kiểm thử GraphQL API và Mock dữ liệu với MSW (Mock Service Worker)"
date: 2026-06-14
description: "Khám phá chiến lược kiểm thử GraphQL API chuyên sâu bằng cách sử dụng MSW để cô lập phụ thuộc mạng, đảm bảo tốc độ và độ tin cậy cho bài test."
tags: ["API Testing","GraphQL","MSW"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# Chiến lược kiểm thử GraphQL API và Mock dữ liệu với MSW (Mock Service Worker)

Chào các đồng nghiệp kỹ thuật! Tôi là Duy Trung, một QE Lead đã dành nhiều năm nghiên cứu về việc đảm bảo chất lượng phần mềm ở mức độ kiến trúc.

Trong bối cảnh phát triển ứng dụng hiện đại, giao diện người dùng (Frontend) ngày càng trở nên phức tạp và phụ thuộc sâu sắc vào các API Backend. Đặc biệt, GraphQL với khả năng truy vấn dữ liệu linh hoạt đã trở thành lựa chọn hàng đầu cho nhiều đội ngũ. Tuy nhiên, chính tính linh hoạt này lại tạo ra một thách thức lớn khi chúng ta muốn *kiểm thử* nó: Làm thế nào để đảm bảo rằng các component của chúng ta hoạt động ổn định mà không cần phải phụ thuộc vào trạng thái uptime, độ trễ hay thậm chí là sự tồn tại của toàn bộ backend trong quá trình CI/CD?

Nếu bạn đang đối mặt với tình trạng "test flaky" (bài test thất thường) do phụ thuộc mạng, bài viết này dành cho bạn. Chúng ta sẽ cùng nhau xây dựng một chiến lược kiểm thử tối ưu bằng cách kết hợp sức mạnh mô phỏng của **MSW (Mock Service Worker)** với cấu trúc dữ liệu phức tạp của **GraphQL**.

***

## 💡 I. Vấn đề: Tại sao GraphQL Testing lại phức tạp?

Trước khi đi sâu vào giải pháp, chúng ta cần hiểu rõ vấn đề cốt lõi:

1.  **Điểm truy cập duy nhất (Single Endpoint):** GraphQL thường sử dụng một endpoint HTTP POST duy nhất (`/graphql`), bất kể bạn đang yêu cầu dữ liệu gì. Điều này khiến việc mock thủ công theo URL truyền thống trở nên vô ích.
2.  **Cấu trúc Payload phức tạp:** Yêu cầu không chỉ là tên tài nguyên, mà phải chứa toàn bộ payload JSON bao gồm `query`, `variables` và đôi khi cả `operationName`.
3.  **Phụ thuộc Mạng (Network Dependency):** Nếu chúng ta để bài test gọi tới backend thật, tốc độ CI/CD sẽ chậm đi đáng kể, chi phí mạng tăng lên, và nghiêm trọng nhất là bài test bị gián đoạn bởi các lỗi mạng ngoài dự kiến.

## ✨ II. Giải pháp: Sức mạnh của MSW

**MSW (Mock Service Worker)** giải quyết vấn đề này bằng cách thay đổi góc nhìn về Mocking. Thay vì chỉ mock dữ liệu tại tầng JavaScript (ví dụ, sử dụng `jest.mock`), MSW hoạt động ở mức **Service Worker**, chặn yêu cầu mạng (network request) *ngay trước khi* chúng rời khỏi trình duyệt hoặc môi trường kiểm thử của bạn.

**Lợi ích cốt lõi:**
*   **Isolation:** Bài test của bạn hoàn toàn cô lập, không cần kết nối mạng thật.
*   **Realism:** Logic mock mô phỏng hành vi của HTTP/Fetch API thực tế, giúp các component sử dụng React Query, SWR hay bất kỳ thư viện data fetching nào hoạt động đúng như khi ở môi trường sản phẩm.

## 🛠️ III. Triển khai Chiến lược GraphQL + MSW

Khi kết hợp hai công nghệ này, chúng ta không mock URL, mà chúng ta *mock cấu trúc yêu cầu* (Request Body) để xác định response phù hợp.

Chúng ta sẽ sử dụng các Handler của MSW để lắng nghe các request HTTP POST đến `/graphql` và phân tích nội dung payload JSON bên trong.

### 📂 Bước 1: Thiết lập Mock Server cơ bản

Đầu tiên, chúng ta cần file handler nơi định nghĩa luồng dữ liệu giả. Giả sử ứng dụng gọi tới endpoint là `http://api.example.com/graphql`.

**`src/mocks/handlers.js` (Hoặc file tương tự):**

```javascript
import { rest } from 'msw';

// Định nghĩa handler cho tất cả các request POST đến /graphql
export const graphqlHandlers = rest.post('http://api.example.com/graphql', (req, res, info) => {
  const requestBody = req.body;
  const query = requestBody?.query; 

  // Kiểm tra xem query có phải là yêu cầu lấy danh sách sản phẩm không
  if (query && query.includes('getProducts')) {
    console.log("✅ MSW: Bắt được yêu cầu lấy Product.");
    
    // Trả về payload GraphQL hợp lệ cho việc mô phỏng thành công
    const mockData = [
      { id: "P1", name: "Laptop X", price: 1200, available: true },
      { id: "P2", name: "Mouse Y", price: 25, available: false }
    ];

    return res.status(200).json({
      data: {
        getProducts: mockData
      }
    });
  } 
  
  // Xử lý trường hợp query không khớp hoặc lỗi giả định
  else if (query && query.includes('getProductById')) {
     return res.status(200).json({
        data: null, // Ví dụ: Không tìm thấy dữ liệu nào được trả về
        errors: [{ message: "Product not found." }]
      });
  } 
  
  // Xử lý các request không mong đợi hoặc lỗi 500 chung
  else {
    return res.status(400).json({ 
      errors: [{ message: "Invalid GraphQL operation detected by Mock Server" }] 
    });
  }
});
```

### 🧑‍💻 Bước 2: Viết bài kiểm thử với MSW Adapter

Bây giờ, chúng ta viết một bài test component (ví dụ sử dụng React Testing Library) và đảm bảo rằng các hàm `setupServer` của MSW được sử dụng để chặn tất cả request network.

**`src/components/__tests__/ProductList.test.jsx`:**

```javascript
import { render, screen, waitFor } from '@testing-library/react';
import ProductList from '../ProductList';
import { setupServer } from 'msw/node';
import { graphqlHandlers } from '../../mocks/handlers'; // Import handler đã định nghĩa

// Setup Server: Chỉ định các handlers của chúng ta để chặn request mạng.
const server = setupServer(...graphqlHandlers); 

// Trước khi chạy test, kích hoạt Server Mocking
beforeAll(() => server.listen());

// Sau khi xong tất cả test, reset Server Mocking
afterEach(() => server.resetHandlers());

// Khi kết thúc suite kiểm thử (group test), dừng Server
afterAll(() => server.close());


describe('ProductList Component Testing with GraphQL and MSW', () => {
  it('should render product list correctly upon successful data fetch (Success Case)', async () => {
    // Lưu ý: Trong môi trường thực, bạn có thể cần thiết lập các handlers cụ thể hơn 
    // cho từng bài test nếu muốn thay đổi phản hồi.

    render(<ProductList apiUrl="http://api.example.com/graphql" />);
    
    // Chờ đợi component fetch data và hiển thị kết quả
    await waitFor(() => {
      expect(screen.getByText(/Laptop X/i)).toBeInTheDocument();
      expect(screen.getByText(/Mouse Y/i)).toBeInTheDocument();
    });
  });

  it('should display error message when GraphQL returns an API error (Error Case)', async () => {
    // 1. Override Handler: Tạm thời thay thế handler để mô phỏng lỗi API
    server.use(graphqlHandlers); // Đảm bảo vẫn dùng handler chung trước
    
    // Bắt buộc phải thiết lập một mock cụ thể cho test này nếu muốn kiểm soát phản hồi chính xác
    server.mockResponseOnce('{"data": null, "errors": [{"message": "Permission denied."}]}', { status: 200 });

    render(<ProductList apiUrl="http://api.example.com/graphql" />);

    // Kiểm tra xem component có hiển thị thông báo lỗi từ payload GraphQL không
    await waitFor(() => {
        expect(screen.getByText(/Permission denied./i)).toBeInTheDocument();
    });
  });
});
```

## 🚀 IV. Các Chiến lược và Best Practices nâng cao (QE Tips)

Là một QE Lead, tôi muốn nhấn mạnh thêm vài điểm về cách tối ưu hóa quy trình này:

### 1. Mô phỏng Mutations (Thay đổi dữ liệu)
GraphQL không chỉ là GET. Khi bạn cần test tính năng Mutation (ví dụ: `createProduct`), đừng mock phản hồi thành công. Hãy mô phỏng cả **trạng thái Side Effect** của việc cập nhật data store giả định (hoặc sử dụng các thư viện trạng thái như Redux/Zustand trong môi trường unit test).

*   **Chiến thuật:** Sử dụng MSW để trả về một cấu trúc dữ liệu phản ánh sự thành công, nhưng đồng thời kiểm tra xem component có gọi hàm cập nhật local state hay không.

### 2. Xử lý Pagination và Trạng thái Loading
Phần lớn các lỗi API xảy ra ở việc quản lý trạng thái. Khi mô phỏng data fetching:
*   **Loading State:** Hãy đảm bảo mock handler *không trả về gì cả* trong giai đoạn đầu (hoặc chỉ setTimeout) để component nhận diện được trạng thái `isLoading`.
*   **Empty State:** Mock dữ liệu rỗng (`[]`) để kiểm tra việc hiển thị "Không có sản phẩm nào phù hợp."

### 3. Quản lý Complexity bằng Tiers
Đừng viết tất cả logic mock vào một file. Hãy chia các handlers thành tầng (Tiers) mô phỏng:
*   **Tier 1 (Success):** Phản hồi dữ liệu cơ bản, đầy đủ.
*   **Tier 2 (Error):** Trả về payload có trường `errors` theo định dạng GraphQL chuẩn (`{ errors: [...] }`).
*   **Tier 3 (Network Failure):** Sử dụng `server.use(rest.post(...).reply(500))` để mô phỏng lỗi HTTP hoàn toàn, không phải lỗi logic của API.

## Kết luận

Việc kiểm thử GraphQL với MSW là một sự đầu tư chiến lược vào tính ổn định và tốc độ phát triển sản phẩm. Nó giúp chúng ta đưa ra các bài test unit và integration gần như "100% reliable" mà vẫn giữ được sự chân thực về mặt giao tiếp mạng (Network Interception).

Hãy ngừng lo lắng về việc phụ thuộc vào môi trường backend đang chạy. Bằng cách làm chủ MSW, bạn đã nắm trong tay khả năng cô lập các đơn vị test của mình ở mức độ cao nhất, giúp quy trình QA trở nên nhanh chóng, mạnh mẽ và đáng tin cậy hơn bao giờ hết.

Chúc mọi người có những bài test chất lượng và nguồn thu nhập ổn định!

---
***Duy Trung | QE Lead***