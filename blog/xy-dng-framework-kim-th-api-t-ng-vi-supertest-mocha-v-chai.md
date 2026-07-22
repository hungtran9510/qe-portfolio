---
title: "Xây dựng Framework Kiểm thử API tự động với Supertest, Mocha và Chai"
date: 2026-07-04
description: "Hướng dẫn chuyên sâu cách thiết lập một bộ khung (framework) kiểm thử API vững chắc bằng sự kết hợp của Supertest, Mocha và Chai trong Node.js."
tags: ["API Testing","Node.js","Automation"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hùng Trần"
---

# Xây dựng Framework Kiểm thử API tự động với Supertest, Mocha và Chai

Chào các bạn đồng nghiệp trong ngành Quality Assurance (QA) và Phát triển Phần mềm. Tôi là Hùng Trần, một chuyên viên Kỹ thuật Đảm bảo Chất lượng (QE Lead).

Trong kỷ nguyên mà kiến trúc microservices và RESTful APIs đang trở thành xương sống của mọi ứng dụng hiện đại, việc kiểm thử API không chỉ là một bước cần thiết, mà còn là yêu cầu bắt buộc để đảm bảo tính ổn định và chất lượng trải nghiệm người dùng.

Tuy nhiên, nhiều dự án thường mắc phải tình trạng: Kiểm thử thủ công quá chậm, hoặc viết các script tự động nhưng thiếu cấu trúc, khó mở rộng, và dễ bị "stale" (lỗi thời).

Bài viết này sẽ là một hướng dẫn chuyên sâu về cách chúng ta xây dựng một *Framework* kiểm thử API hoàn chỉnh, mạnh mẽ, sử dụng bộ ba công cụ tiêu chuẩn vàng trong hệ sinh thái Node.js: **Supertest**, **Mocha** và **Chai**. Đây không chỉ là việc chạy code; đây là việc kiến tạo ra một quy trình QA tự động hóa có tính chuyên nghiệp cao, dễ bảo trì (maintainable) và cực kỳ mở rộng (scalable).

***

## 🏛️ Phần I: Hiểu rõ kiến trúc và vai trò của từng thành phần

Trước khi đi vào code, chúng ta cần hiểu tại sao ba công cụ này lại hoạt động hoàn hảo cùng nhau. Mỗi công cụ đảm nhiệm một vai trò riêng biệt nhưng bổ trợ cho nhau.

### 1. Mocha (The Test Runner)
*   **Vai trò:** Là bộ khung kiểm thử (Test Framework). Nó không phải là thư viện assertion, mà là công cụ quản lý vòng đời của các bài test.
*   **Chức năng chính:** Cung cấp cú pháp tổ chức các nhóm test (`describe`) và các trường hợp test cụ thể (`it` یا `specify`). Mocha chịu trách nhiệm chạy tất cả các file kiểm thử của bạn theo thứ tự logic, đồng thời cung cấp báo cáo (report) chi tiết về kết quả thành công/thất bại.

### 2. Chai (The Assertion Library)
*   **Vai trò:** Là thư viện khẳng định (Assertion). Khi chúng ta viết một bài test, bản chất là việc đặt ra các giả định: "Nếu tôi gọi API X, thì response phải có status code 200 và body phải chứa trường Y." Chai giúp chúng ta thực thi những giả định này.
*   **Chức năng chính:** Cung cấp cú pháp để so sánh giá trị một cách dễ đọc (ví dụ: `expect(actual).to.equal(expected)`). Chai nổi tiếng với nhiều *plugin* và phong cách viết assertion linh hoạt, phổ biến nhất là `chai-as-promised` khi test API.

### 3. Supertest (The HTTP Utility)
*   **Vai trò:** Là công cụ kiểm thử HTTP chuyên biệt cho ứng dụng Node.js/Express.
*   **Chức năng chính:** Thay vì phải khởi động một server thật sự chỉ để gọi request, Supertest cho phép chúng ta gửi các yêu cầu HTTP (GET, POST, PUT, DELETE...) tới một đối tượng Express App *in-memory*. Điều này giúp việc kiểm thử nhanh hơn, cô lập hơn và không cần phụ thuộc vào mạng lưới bên ngoài.

> **Tóm lại:**
> *   **Mocha:** "Hãy chạy các bài test sau." (Bộ quản lý)
> *   **Supertest:** "Đây là yêu cầu HTTP tôi muốn gửi." (Action)
> *   **Chai:** "Tôi kỳ vọng kết quả nhận được phải thỏa mãn những điều kiện này." (Kiểm tra tính hợp lệ/Assertion)

***

## 🛠️ Phần II: Thiết lập Môi trường và Cấu hình (Setup Guide)

Giả sử chúng ta đang làm việc trên một dự án Node.js đã có API backend chạy bằng Express.

### Bước 1: Khởi tạo Project
```bash
npm init -y
# Thêm các dependency cần thiết cho testing
npm install mocha chai supertest express --save-dev
```
*(Chúng tôi cài `express` và `supertest` ở đây để minh họa việc mock API app, nhưng nếu bạn đã có backend thì chỉ cần Supertest.)*

### Bước 2: Cấu hình Test Runner (package.json)
Bạn nên thêm một script `test` vào file `package.json`:

```json
"scripts": {
    "test": "mocha --timeout 5000 ./tests/**/*.spec.js"
}
```
*Giải thích:* Lệnh này yêu cầu Mocha chạy tất cả các file có đuôi `.spec.js` nằm trong thư mục `tests/`.

### Bước 3: Tạo Mock API (Ví dụ minh họa)
Tạo file `app.js` để mô phỏng API backend của chúng ta:

```javascript
// app.js - Mô hình ứng dụng Express cơ bản
const express = require('express');
const app = express();
app.use(express.json());

// Endpoint kiểm tra sự tồn tại (Basic test)
app.get('/api/status', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'API is operational' });
});

// Endpoint tạo tài nguyên mới (POST test)
app.post('/api/users', (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    // Giả lập lưu vào database
    res.status(201).json({ id: Date.now(), name, email, created_at: new Date().toISOString() });
});

module.exports = app; 
```

***

## ✍️ Phần III: Viết Bài Test API Thực tế (The Core Logic)

Chúng ta sẽ tạo một file kiểm thử tên là `api.spec.js` trong thư mục `tests/`. File này chứa sự kết hợp thần kỳ của Supertest, Mocha và Chai.

```javascript
// tests/api.spec.js

// 1. Import các công cụ cần thiết
const request = require('supertest'); // Sử dụng supertest để gọi API
const { expect } = require('chai');  // Sử dụng chai cho assertions
const app = require('../app');       // Đối tượng App Express của chúng ta

// 2. Mô tả nhóm kiểm thử (Mocha describe)
describe('API User Management Endpoints', () => {
    let userData; // Biến toàn cục để lưu dữ liệu cần thiết giữa các bài test

    // HOOK: Setup trước khi chạy bất kỳ test nào trong nhóm này
    before(() => {
        console.log('\n--- Bắt đầu bộ test API ---\n');
    });

    // HOOK: Clean up sau khi kết thúc nhóm test (nên dùng để reset trạng thái DB giả)
    after(() => {
        console.log('\n--- Kết thúc bộ test API ---');
    });


    // ============================================
    // TEST CASE 1: Kiểm tra trạng thái chung của API (GET /api/status)
    // ============================================
    describe('GET /api/status', () => {
        it('should return status code 200 OK and operational message', async () => {
            // Supertest thực hiện yêu cầu GET tới đối tượng 'app'
            const response = await request(app)
                .get('/api/status');

            // Chai assertion: Kiểm tra HTTP Status Code (Expected to be 200)
            expect(response.statusCode).to.be.equal(200);

            // Supertest tích hợp sẵn hàm 'expect' cho status code, nhưng kiểm tra body cụ thể cần chai
            const responseBody = response.body;
            expect(responseBody).to.have.property('status').that.equals('ok');
        });
    });


    // ============================================
    // TEST CASE 2: Tạo người dùng mới (POST /api/users) - Trường hợp thành công
    // ============================================
    describe('POST /api/users', () => {
        const newUserData = { name: 'Nguyen Van A', email: 'a@test.com' };

        it('should successfully create a user and return 201 Created', async () => {
            // Supertest thực hiện yêu cầu POST với dữ liệu JSON payload
            const response = await request(app)
                .post('/api/users')
                .send(newUserData)
                .set('Accept', 'application/json'); // Thao tác set header là best practice

            // Chai assertion: Kiểm tra Status Code 201
            expect(response.statusCode).to.be.equal(201);

            // Supertest và Chai: Lấy body JSON và kiểm tra cấu trúc dữ liệu
            const responseBody = response.body;
            expect(responseBody).to.have.property('id').that.isANaNumber(); // Kiểm tra kiểu dữ liệu
            expect(responseBody).to.include({ 
                name: newUserData.name, 
                email: newUserData.email 
            });
            // Vị trí và cấu trúc phải khớp (tính toán học)
            expect(responseBody).to.have.property('created_at').that.isString();
            
            userData = responseBody; // Lưu trữ dữ liệu trả về để dùng trong test case sau
        });

        // Sử dụng data từ test trước đó (giả lập sử dụng ID vừa tạo)
        it('should return the full user object structure correctly', async () => {
             const response = await request(app)
                .get(`/api/users/${userData.id}`); // Giả định thêm endpoint GET theo ID

            expect(response.statusCode).to.be.equal(200);
        });
    });


    // ============================================
    // TEST CASE 3: Tạo người dùng với dữ liệu thiếu (POST /api/users) - Trường hợp thất bại (Error Handling)
    // ============================================
    describe('POST /api/users with validation errors', () => {
        it('should return status code 400 Bad Request when required fields are missing', async () => {
            // Gửi yêu cầu POST với payload thiếu name
            const response = await request(app)
                .post('/api/users')
                .send({ email: 'invalid@test.com' });

            // Chai assertion: Kiểm tra Status Code 400
            expect(response.statusCode).to.be.equal(400);

            // Chai assertion: Kiểm tra nội dung lỗi trả về (Validation Error Message)
            const responseBody = response.body;
            expect(responseBody).to.have.property('error').that.includes('Missing required fields');
        });
    });
});
```

***

## 🚀 Phần IV: Các Best Practice của một QE Lead

Viết được code test là chưa đủ, việc quan trọng hơn là việc thiết kế kiến trúc kiểm thử sao cho nó bền bỉ và dễ bảo trì. Dưới đây là các nguyên tắc tôi áp dụng khi xây dựng framework này:

### 1. Tách biệt Logic Test (Separation of Concerns)
Tuyệt đối không để logic nghiệp vụ (business logic) bị nhầm lẫn với logic test.
*   **Giải pháp:** Tạo một lớp/module riêng chỉ chịu trách nhiệm gọi API và trả về kết quả raw (ví dụ: `apiClient.createUser(data)`). Các file `.spec.js` của chúng ta chỉ tập trung vào việc *kiểm tra* các hành vi, không phải là nơi thực hiện các cuộc gọi HTTP.

### 2. Sử dụng Hooks của Mocha
Sử dụng `before()`, `after()`, `beforeEach()` và `afterEach()` để quản lý trạng thái (state) giữa các bài test:
*   `beforeEach()`: Lý tưởng để reset dữ liệu, đảm bảo rằng mỗi `it()` chạy đều bắt đầu từ một môi trường sạch sẽ.
*   **Ví dụ:** Nếu bạn đang test CRUD trên database, hãy dùng `afterEach()` để xóa bản ghi được tạo ra trong bài test trước đó, tránh tình trạng *test dependency*.

### 3. Xử lý Asynchronicity (Async/Await)
Trong thế giới API testing, mọi thứ đều là asynchronous (hứa hẹn phải chờ phản hồi từ network). Luôn sử dụng `async`/`await` kết hợp với Promises để đảm bảo Mocha hiểu rằng bài test của bạn cần thời gian để hoàn thành và không bị race condition.

### 4. Test Data Management (Quản lý Dữ liệu Kiểm thử)
Không bao giờ hardcode dữ liệu kiểm thử trong các file test.
*   **Giải pháp:** Sử dụng các tệp JSON hoặc biến môi trường (`process.env`) để đọc các