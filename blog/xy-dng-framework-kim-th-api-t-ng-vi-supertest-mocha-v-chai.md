---
title: "Xây dựng Framework Kiểm thử API tự động với Supertest, Mocha và Chai"
date: 2026-07-10
description: "Hướng dẫn chuyên sâu xây dựng framework kiểm thử API mạnh mẽ, ổn định và có khả năng mở rộng bằng bộ công cụ Supertest, Mocha và Chai."
tags: ["API Testing","Node.js","Automation","QE"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hùng Trần"
---

# Xây dựng Framework Kiểm thử API tự động với Supertest, Mocha và Chai

**Tác giả:** Hùng Trần | **Lĩnh vực:** Quality Engineering & Automation

---

Trong thế giới phát triển phần mềm hiện đại, API (Application Programming Interface) là xương sống vận hành của mọi hệ thống. Nếu frontend là giao diện người dùng mà backend là bộ não xử lý logic, thì các API chính là những mạch máu kết nối chúng lại với nhau. Vì lẽ đó, việc đảm bảo chất lượng và tính ổn định của các điểm cuối (endpoints) API là nhiệm vụ tối quan trọng của bất kỳ đội ngũ Quality Assurance nào.

Nếu bạn vẫn đang thực hiện kiểm thử API thủ công bằng Postman cho từng yêu cầu, tôi tin rằng bạn đã đến đúng nơi. Hôm nay, với vai trò một QE Lead, tôi sẽ chia sẻ kinh nghiệm và hướng dẫn chi tiết về cách xây dựng một **Framework Kiểm thử API tự động (Automated API Testing Framework)** mạnh mẽ, ổn định và có khả năng mở rộng cao bằng bộ công cụ hoàn hảo: **Supertest, Mocha và Chai**.

## 💡 Tại sao nên sử dụng Supertest + Mocha + Chai?

Việc lựa chọn đúng công nghệ là bước đầu tiên để xây dựng một framework vững chắc. Chúng ta cần hiểu rõ vai trò chuyên biệt của từng thư viện trong bộ ba này:

1.  **Mocha (The Test Runner):** Đây là khung sườn (scaffolding) cho toàn bộ các bài kiểm thử của bạn. Nó cung cấp cấu trúc `describe()` và `it()` giúp tổ chức các test case một cách logic, dễ đọc và quản lý vòng đời của các bài kiểm thử.
2.  **Chai (The Assertion Library):** Chai là thư viện dành cho việc *khẳng định* (assertion). Khi chúng ta gọi API, chúng ta không chỉ muốn biết nó có hoạt động hay không; chúng ta cần xác nhận: **Status Code phải là 200**, **Body phải chứa trường `id` và `status`**, **Dữ liệu trả về phải đúng kiểu JSON**. Chai giúp chúng ta viết các câu khẳng định này một cách cú pháp, rõ ràng (ví dụ: `expect(response.status).to.equal(200)`).
3.  **Supertest (The HTTP Utility):** Đây là ngôi sao thực thụ trong bài viết hôm nay. Supertest được thiết kế để kiểm thử các ứng dụng HTTP một cách dễ dàng và an toàn, đặc biệt hiệu quả khi làm việc với Express.js hoặc các server Node.js khác. Thay vì phải thiết lập môi trường HTTP phức tạp, nó cho phép chúng ta mô phỏng các yêu cầu `GET`, `POST`, `PUT`, `DELETE` trực tiếp trên đối tượng ứng dụng (application object).

Sự kết hợp này tạo ra một chu trình kiểm thử hoàn chỉnh: **Mocha** chạy vòng lặp $\rightarrow$ Sử dụng **Supertest** để thực hiện hành động HTTP $\rightarrow$ Dùng **Chai** để xác minh kết quả.

## 🛠️ Bước 1: Chuẩn bị Môi trường (Setup)

Trước khi bắt tay vào code, chúng ta cần cài đặt các dependencies cần thiết trong dự án Node.js của mình. Giả sử bạn đã có một ứng dụng backend Express.js đang chạy tại `http://localhost:3000`.

```bash
# Khởi tạo dự án nếu chưa có
npm init -y

# Cài đặt các thư viện kiểm thử chính
npm install mocha chai supertest --save-dev
```

Chúng ta cũng cần thiết lập script trong file `package.json` để chạy bộ test một cách tiện lợi:

**package.json**
```json
"scripts": {
  "test:api": "mocha ./tests/api_test.js" 
}
```

## 💻 Bước 2: Xây dựng Framework Test Case Đầu tiên

Trong ví dụ này, chúng ta sẽ giả lập việc kiểm thử một endpoint lấy danh sách sản phẩm (`GET /products`). Chúng ta sẽ tạo file `tests/api_test.js`.

**Ví dụ Mã Code (API Test Suite)**
```javascript
// tests/api_test.js

const request = require('supertest'); // Đối tượng Supertest
const { expect } = require('chai'); // Chai - sử dụng style Expect
const app = require('../src/server-instance'); // Giả định bạn export instance của app Express

describe('Product API Endpoints', () => {
    // Đây là khối mô tả cho toàn bộ nhóm bài test Product
    
    it('should return 200 and a list of products for GET /products', async () => {
        // Sử dụng Supertest để gửi request tới endpoint /products
        const response = await request(app)
            .get('/api/v1/products')
            .set('Authorization', 'Bearer test_token'); // Giả lập truyền header

        // 1. Kiểm tra Status Code (Assertion bằng Chai)
        expect(response.statusCode).to.equal(200); 

        // 2. Kiểm tra Content Type và Body Structure
        expect(response.type).to.equal('application/json');
        expect(Array.isArray(response.body)).to.be.true; // Khẳng định body là một mảng

        // 3. Kiểm tra dữ liệu cụ thể (ví dụ: chắc chắn không rỗng)
        expect(response.body).to.have.length.above(0);
    });

    it('should handle invalid authentication gracefully with GET /products', async () => {
        const response = await request(app)
            .get('/api/v1/products')
            // Cố tình bỏ qua header Authorization
            ; 

        // Chúng ta mong đợi API trả về mã lỗi 401 (Unauthorized)
        expect(response.statusCode).to.equal(401);
    });

    it('should successfully create a new product via POST /products', async () => {
        const newProductData = { name: 'Laptop X', price: 1200, categoryId: 5 };

        // Gửi request POST và lưu kết quả trả về để kiểm tra tính toàn vẹn (side effects)
        const response = await request(app)
            .post('/api/v1/products')
            .send(newProductData) // Gửi payload JSON
            .set('Authorization', 'Bearer test_token');

        // Khẳng định Status Code của việc tạo thành công
        expect(response.statusCode).to.equal(201); 
        
        const createdProduct = response.body;

        // Khẳng định rằng API đã gán cho nó một ID và trả về các trường cần thiết
        expect(createdProduct).to.have.property('id').that.isAN(String);
    });

});
```

### 🔍 Phân tích Code của Hùng Trần: Giải thích chi tiết

1.  **`require('supertest')` và `const { expect } = require('chai')`:** Đây là bước import các công cụ. Chúng ta cần `request(app)` để tạo ra một instance Supertest có thể thực hiện các yêu cầu HTTP giả lập.
2.  **`describe()`:** Khối này nhóm các bài kiểm thử liên quan đến cùng một module (ví dụ: Product API). Nó giúp người đọc test suite biết được phạm vi của việc kiểm thử.
3.  **`it('...', async () => {...})`:** Đây là một *Test Case* cụ thể. Chúng ta sử dụng `async/await` vì các yêu cầu HTTP qua Supertest là thao tác bất đồng bộ (asynchronous).
4.  **Supertest Call:**
    ```javascript
    const response = await request(app)
        .get('/api/v1/products') 
        .set('Authorization', 'Bearer test_token');
    ```
    Dòng này là cốt lõi. Chúng ta gọi `request(app)` và chain các phương thức (`.get()`, `.post()`) để xây dựng yêu cầu, cuối cùng xác định `header` cần thiết bằng `.set()`. Variable `response` lúc này chứa toàn bộ thông tin phản hồi (status code, body, headers).
5.  **Chai Assertions:**
    ```javascript
    expect(response.statusCode).to.equal(200); 
    ```
    Đây là nơi việc xác minh diễn ra. Chúng ta sử dụng cú pháp `expect(value).to.be...` của Chai để đảm bảo rằng giá trị thực tế (`response.statusCode`) khớp với kỳ vọng (`200`). Các assertions mạnh mẽ của Chai giúp chúng ta viết test case rõ ràng hơn nhiều so với việc kiểm tra bằng các câu lệnh `if/else`.

## 🏆 Bước 3: Nâng cao và Thực tiễn hóa Framework (Best Practices)

Một framework chỉ tốt khi nó có khả năng mở rộng. Là một QE Lead, tôi khuyên bạn nên áp dụng những nguyên tắc kiến trúc sau để nâng tầm bộ test của mình:

### 1. Tách biệt Dữ liệu Khởi tạo (Data Fixtures Separation)

**Vấn đề:** Trong ví dụ trên, chúng ta hardcode dữ liệu `{ name: 'Laptop X', ... }`. Nếu cần thay đổi kịch bản test, bạn phải sửa code.
**Giải pháp:** Sử dụng các tệp JSON hoặc JS riêng biệt để lưu trữ dữ liệu đầu vào (request payload) và dữ liệu chờ nhận (expected response body).

*Ví dụ:* Tạo file `test/fixtures/new_product_payload.json` thay vì truyền object trực tiếp trong test case.

### 2. Abstraction Layer: Service Module Pattern

Đừng để toàn bộ logic Supertest nằm rải rác trong các file test (`*.test.js`). Hãy tạo một lớp service (hoặc một module) chuyên xử lý việc gọi API. Điều này giúp *tách biệt* giữa **Logic Test** và **Gọi HTTP**.

**Cấu trúc:**
1.  `./api/productService.js`: Chứa các hàm như `getProductList(token)`, `createProduct(payload, token)`. Module này sử dụng Supertest để thực hiện gọi API và trả về đối tượng `response`.
2.  `./tests/product.eut.js`: Chỉ chịu trách nhiệm: Gọi Service $\rightarrow$ Kiểm tra kết quả bằng Chai.

**Lợi ích:** Nếu bạn thay đổi từ Express sang Koa, hoặc thay đổi cấu trúc endpoint `/v1` thành `/api/v2`, bạn chỉ cần sửa `productService.js`, mà không ảnh hưởng đến hàng trăm test case của bạn.

### 3. Xử lý Trạng thái và Tài nguyên (Setup & Teardown)

Kiểm thử API thường liên quan đến việc tạo, cập nhật và xóa tài nguyên (Create $\rightarrow$ Read $\rightarrow$ Update $\rightarrow$ Delete - CRUD). Bạn cần đảm bảo rằng sau mỗi nhóm test (`describe`), các dữ liệu được tạo ra phải được dọn dẹp.

**Sử dụng Hooks của Mocha:**
*   `before()`: Chạy trước khi bất kỳ bài test nào trong `describe` bắt đầu (Ví dụ: Khởi tạo kết nối Database, lấy Token Authentication Master).
*   `after()`: Chạy sau khi toàn bộ các bài test trong `describe` kết thúc (Ví dụ: Dọn dẹp dữ liệu đã tạo ra khỏi DB để đảm bảo môi trường sạch sẽ cho lần chạy tiếp theo).

## 🚀 Kết luận

Việc xây dựng một Framework Kiểm thử API tự động không chỉ là việc viết code, mà là việc thiết kế kiến trúc. Với sự kết hợp của **Supertest** (nhà cung cấp yêu cầu HTTP mạnh mẽ), **Mocha** (khung sườn chạy test ổn định) và **Chai** (ngôn ngữ khẳng định rõ ràng), bạn đã có một bộ công cụ chuyên nghiệp, đủ sức đối phó với các hệ thống Microservices phức tạp nhất.

Hãy nhớ rằng: Một framework chất lượng không chỉ là nơi chứa code, mà còn là nguồn tài liệu giúp toàn đội QA dễ dàng mở rộng và bảo trì khi sản phẩm phát triển. Chúc bạn thành công trong hành trình tự động hóa kiểm thử của mình!