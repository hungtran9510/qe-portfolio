---
title: "Xây dựng Framework Kiểm thử API tự động với Supertest, Mocha và Chai"
date: 2026-07-04
description: "Hướng dẫn chuyên sâu từ QE Lead Hùng Trần về việc xây dựng framework kiểm thử API mạnh mẽ bằng bộ công cụ Supertest, Mocha và Chai trong môi trường Node.js."
tags: ["API Testing","Node.js","Automation"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hùng Trần"
---

# Xây dựng Framework Kiểm thử API tự động với Supertest, Mocha và Chai

Xin chào các đồng nghiệp trong lĩnh vực Chất lượng Phần mềm! Tôi là Hùng Trần. Trong hành trình làm QE (Quality Engineering), tôi nhận thấy rằng việc kiểm thử giao diện người dùng (UI) tuy quan trọng nhưng lại tốn kém tài nguyên và rất dễ bị ảnh hưởng bởi sự thay đổi của lớp hiển thị. Giải pháp tối ưu, hiệu quả nhất, chính là tập trung vào **kiểm thử API**.

Một API mạnh mẽ, ổn định sẽ là nền móng vững chắc cho bất kỳ ứng dụng nào. Nhưng làm sao để tự động hóa việc kiểm thử những điểm cuối (endpoints) này một cách toàn diện và có khả năng mở rộng cao?

Bài viết hôm nay tôi sẽ chia sẻ quy trình chi tiết về việc xây dựng một Framework Kiểm thử API hiện đại, chuyên nghiệp và cực kỳ đáng tin cậy bằng bộ ba công cụ huyền thoại của Node.js: **Supertest**, **Mocha** và **Chai**.

***

## 🚀 I. Tại sao chúng ta cần Supertest, Mocha và Chai? (The Stack Breakdown)

Thay vì sử dụng một framework duy nhất "câu hết tất cả", triết lý QE hiện đại là chọn các công cụ tối ưu cho từng nhiệm vụ (Composition over Inheritance). Bộ ba này thực hiện vai trò hoàn hảo:

### 1. Supertest: Giả lập HTTP Request
Đây là trái tim của quá trình kiểm thử API. Supertest được thiết kế để *kiểm tra* một ứng dụng Express/Koa mà không cần phải chạy nó trên cổng (port) vật lý nào cả. Nó cho phép chúng ta thực hiện các yêu cầu HTTP GET, POST, PUT, DELETE... một cách mô phỏng và liền mạch.

*   **Vai trò chính:** Tương tác với API như một client thực thụ.
*   **Ưu điểm lớn nhất:** Giả lập môi trường mạng hoàn hảo trong bộ nhớ (in-memory), giúp kiểm thử cực nhanh và cô lập (isolated).

### 2. Mocha: Test Runner & Structure
Mocha là **Test Runner**. Nhiệm vụ của nó là tổ chức, chạy và báo cáo kết quả của tất cả các bài test của bạn. Nó cung cấp cấu trúc `describe` (nhóm nhóm kiểm thử) và `it` (từng case kiểm thử cụ thể).

*   **Vai trò chính:** Định khung logic cho toàn bộ framework.
*   **Sức mạnh:** Đơn giản, linh hoạt, và dễ dàng tích hợp với các thư viện Assertion khác.

### 3. Chai: The Assertion Library
Chai là thư viện **Assertion** (tuyên bố khẳng định). Khi Supertest trả về một response, chúng ta cần xác nhận xem status code có phải `200` không, body có chứa field nào mong muốn không, hay dữ liệu có đúng kiểu (type) không. Chai cung cấp các cách thức khai báo sự thật này (`expect`, `should`).

*   **Vai trò chính:** Xác định *kết quả mong đợi*.
*   **Sự linh hoạt:** Hỗ trợ nhiều phong cách viết Assertion khác nhau (BDD, TDD), giúp code test dễ đọc như tài liệu mô tả.

***

## 🛠️ II. Thiết lập Môi trường Dự án

Trước khi bắt tay vào code, chúng ta cần cài đặt các dependencies này:

```bash
# Khởi tạo dự án Node.js
npm init -y

# Cài đặt các thư viện kiểm thử
npm install mocha chai supertest express --save-dev 
```

*Lưu ý:* Chúng ta thêm `express` vào để mô phỏng một service API đơn giản, và tất cả các tools khác là `devDependencies` vì chúng chỉ dùng khi chạy test.

**Cấu hình Scripts trong `package.json`:**

Chúng ta nên định nghĩa script chạy test ở đây:
```json
"scripts": {
  "test": "mocha --timeout 5000 test/**/*.test.js"
}
```

***

## 🧪 III. Code Example Chi tiết: Kiểm thử API Người dùng (User Service)

Giả sử chúng ta có một API quản lý người dùng với các endpoint cơ bản:
1. `GET /api/users`: Lấy danh sách user.
2. `POST /api/users`: Tạo user mới.

Chúng ta sẽ viết file kiểm thử trong thư mục `test/`.

### 3.1. Định nghĩa API Service (Mô phỏng Backend)

Tạo file `app.js` để mô phỏng API server của chúng ta:
```javascript
// app.js (Giả định đây là mã nguồn server thực tế)
const express = require('express');
const app = express();
app.use(express.json()); 

let users = [
    { id: 1, name: "Alice", email: "alice@example.com" }
];

// Endpoint GET /api/users
app.get('/api/users', (req, res) => {
    res.status(200).json({ success: true, data: users });
});

// Endpoint POST /api/users
app.post('/api/users', (req, res) => {
    const newUser = req.body;
    if (!newUser.name || !newUser.email) {
        return res.status(400).json({ success: false, message: "Vui lòng cung cấp tên và email." });
    }

    // Giả lập việc lưu vào database và trả về ID mới
    users.push({ 
        id: users.length + 1, 
        name: newUser.name, 
        email: newUser.email 
    });
    res.status(201).json({ success: true, message: "User created successfully", user: { id: users.length, name: newUser.name } });
});

module.exports = app; // Export ứng dụng Express để Supertest sử dụng
```

### 3.2. Viết Bộ Test Framework (File `test/user.test.js`)

Đây là phần quan trọng nhất. Chúng ta sẽ viết test case mô phỏng các tình huống nghiệp vụ khác nhau: thành công, thất bại do lỗi dữ liệu, và status code sai.

```javascript
// test/user.test.js 
const request = require('supertest'); // Wrapper cho Supertest (tốt hơn)
const { expect } = require('chai');   // Sử dụng Expect style của Chai
const app = require('../app');        // Import ứng dụng Express

describe('User API Endpoints Integration Test', () => {
    let createdUserId; 

    // Thiết lập Before Hook: Chạy trước mỗi nhóm test (Suite)
    before(async function() {
        console.log("\n[Setup]: Bắt đầu kiểm thử User Service...");
    });

    // --- TEST CASE GET /api/users (GET Request) ---
    describe('GET /api/users', () => {
        it('Should return status 200 and an array of users', async () => {
            const response = await request(app)
                .get('/api/users');

            // 1. Assertion Status Code: Kiểm tra mã trạng thái
            expect(response.statusCode).to.equal(200); 
            
            // 2. Assertion Response Body Structure: Kiểm tra cấu trúc JSON trả về
            expect(response.body).to.have.property('success').that.isTrue;
            expect(Array.isArray(response.body.data)).to.be.true;
        });
    });

    // --- TEST CASE POST /api/users (POST Request) ---
    describe('POST /api/users', () => {
        let userData = { name: 'John Doe', email: 'john@example.com' };

        it('Should successfully create a new user and return 201 status', async () => {
            const response = await request(app)
                .post('/api/users')
                .send(userData) // Gửi dữ liệu JSON để POST
                .set('Content-Type', 'application/json');

            // Xác nhận thành công: Status 201 (Created)
            expect(response.statusCode).to.equal(201); 

            // Xác nhận nội dung response body
            expect(response.body.success).to.be.true;
            expect(response.body.message).to.include('User created successfully');
            
            // Lưu trữ ID để sử dụng trong các test case sau (Tính liên tục)
            createdUserId = response.body.user.id; 

        }).timeout(2000); // Đặt timeout cho nhóm này

        it('Should fail with status 400 if required fields are missing', async () => {
            const badData = { name: 'MissingEmail' }; // Thiếu email
            
            const response = await request(app)
                .post('/api/users')
                .send(badData)
                .set('Content-Type', 'application/json');

            // Kiểm tra điều kiện thất bại: Status 400 (Bad Request)
            expect(response.statusCode).to.equal(400); 
            expect(response.body.success).to.be.false;
            expect(response.body.message).to.include('Vui lòng cung cấp tên và email.');
        });
    });

    // Cleanup Hook: Chạy sau khi nhóm test hoàn thành
    after(() => {
        console.log("\n[Cleanup]: Kết thúc kiểm thử User Service.");
        createdUserId = null; // Reset biến toàn cục (Best Practice)
    });
});
```

### 💡 Phân tích Chi tiết Code (From QE Lead Perspective)

1.  **Sử dụng `request(app)`:** Chúng ta truyền đối tượng `app` đã được export từ `app.js`. Supertest sẽ nhận ứng dụng này và *chạy mô phỏng* mọi request mà không cần khởi động server thực tế, đảm bảo tốc độ tối đa và môi trường cô lập hoàn hảo.
2.  **Kiểm tra Transactional Behavior:** Trong test case thứ hai (`Should successfully create...`), tôi đã lưu trữ `createdUserId` vào một biến scope rộng hơn. Điều này mô phỏng các kịch bản "multi-step transactions" (ví dụ: Tạo user -> sau đó dùng ID của user đó để tạo profile).
3.  **Tách biệt Logic Test:** Chúng ta sử dụng `describe` và `it` để nhóm các test theo tính năng (`GET /users`, `POST /users`). Điều này giúp khả năng đọc (Readability) của báo cáo kiểm thử rất cao.
4.  **Best Practice Hooks (`before`/`after`):** Việc sử dụng hooks là cực kỳ quan trọng trong QE. `before` đảm bảo môi trường đã sẵn sàng trước khi test chạy; `after` đảm bảo rằng mọi tài nguyên được dọn sạch (cleanup), giúp các lần chạy test sau không bị ảnh hưởng bởi dữ liệu thừa từ lần run trước (Test Isolation).
5.  **Khẳng định đa chiều:** Chúng ta không chỉ kiểm tra status code (`expect(response.statusCode).to.equal(201)`). Chúng ta còn kiểm tra:
    *   Cấu trúc dữ liệu trả về (`expect(Array.isArray(response.body.data))`).
    *   Giá trị nghiệp vụ cốt lõi (`expect(response.body.message).to.include(...)`).

***

## ✨ IV. Nâng cao Chất lượng Framework (QE Level Tips)

Để framework này thực sự "chuyên nghiệp", chúng ta cần vượt qua mức độ của một bài viết tutorial và áp dụng các kỹ thuật nâng cao:

### 1. Quản lý Dữ liệu Giả lập (Data Fixtures Management)
Đừng bao giờ hardcode dữ liệu kiểm thử vào test case. Hãy tạo một module `fixtures/userFixtures.js` để chứa tất cả dữ liệu cần thiết:
*   **Dữ liệu thành công:** `{ name: 'Valid User', email: 'valid@test.com' }`
*   **Dữ liệu thất bại:** `{ name: null, email: '' }`

Khi viết test, bạn chỉ import object này và sử dụng nó. Điều này giúp việc thay đổi kịch bản kiểm thử trở nên dễ dàng hơn gấp bội.

### 2. Kết nối với Database Thực tế (Integration Testing)
Đối với các bài kiểm tra End-to-End hoặc Integration sâu, Supertest vẫn là công cụ tuyệt vời để gửi request HTTP. Tuy nhiên, bạn phải đảm bảo rằng:
1.  **Setup:** Trước khi test chạy, framework phải *reset* database về trạng thái sạch (ví dụ: xóa bảng user).
2.  **Teardown:** Sau khi test kết thúc, nó cũng phải *clean up* các bản ghi đã tạo ra để không ảnh hưởng đến luồng kiểm thử tiếp theo.

### 3. Phân tầng Test (Layered Testing)
Hãy phân loại rõ ràng bài test của bạn:
*   **Unit Test:** Kiểm tra logic nghiệp vụ riêng biệt, thường là lớp service/repository (Không cần Supertest).
*   **API Contract Test:** Sử dụng Supertest để kiểm tra endpoint dựa trên giả định API Service đã ổn định