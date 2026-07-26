---
title: "Xây dựng Framework Kiểm thử API tự động với Supertest, Mocha và Chai"
date: 2026-07-08
description: "Hướng dẫn chi tiết từ chuyên gia QE cách xây dựng framework kiểm thử API vững chắc, hiệu suất cao bằng bộ công cụ Supertest, Mocha và Chai."
tags: ["API Testing","Node.js","Automation"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hùng Trần"
---

# Xây dựng Framework Kiểm thử API tự động với Supertest, Mocha và Chai

*(Bài viết của Hùng Trần - QE Lead)*

Trong kỷ nguyên microservices, giao diện lập trình ứng dụng (API) là xương sống vận hành toàn bộ hệ thống backend. Chất lượng của các API không chỉ quyết định tính ổn định mà còn ảnh hưởng trực tiếp đến trải nghiệm người dùng cuối. Do đó, việc xây dựng một quy trình kiểm thử API tự động (Automated API Testing Framework) mạnh mẽ là yêu cầu tối quan trọng đối với bất kỳ team phát triển phần mềm chuyên nghiệp nào.

Nếu bạn đang tìm cách nâng cấp từ những bài test thủ công kém hiệu quả sang một framework kiểm thử có khả năng mở rộng, đáng tin cậy, thì bài viết này dành cho bạn. Chúng ta sẽ cùng nhau xây dựng một framework hoàn chỉnh và thực tế chỉ bằng bộ ba thư viện quyền lực: **Supertest**, **Mocha**, và **Chai**.

---

## I. Khái Niệm Về Bộ Ba Công Cụ (The Trinity)

Để hiểu tại sao chúng ta chọn bộ công cụ này, trước hết hãy phân tích vai trò của từng thành phần:

### 1. Mocha (Test Runner/Structure)
Mocha là một **test runner** linh hoạt và phổ biến trong hệ sinh thái Node.js. Nó cung cấp cấu trúc cho các bài kiểm thử của bạn bằng cách sử dụng cú pháp BDD (Behavior-Driven Development), với các hàm `describe()` (nhóm các bài test liên quan) và `it()` (mô tả một hành vi/kiểm thử cụ thể).

*   **Vai trò:** Tổ chức, chạy và báo cáo kết quả của các bài kiểm thử.

### 2. Chai (Assertion Library)
Chai là một thư viện **assertion**. Nhiệm vụ của nó là xác định xem kết quả thực tế có khớp với kết quả mong đợi hay không. Thay vì viết `if (result !== expected)`, chúng ta sử dụng cú pháp assertion rõ ràng và dễ đọc như `expect(result).to.be.a('string')`.

*   **Vai trò:** Cung cấp các hàm khẳng định mạnh mẽ, giúp bài test của bạn đọc giống như tài liệu mô tả hành vi.

### 3. Supertest (HTTP Request Abstraction)
Đây là trái tim của framework này. Supertest không chỉ là một thư viện request thông thường; nó được thiết kế đặc biệt để **kiểm thử các ứng dụng HTTP** mà không cần phải khởi động máy chủ vật lý phức tạp nào. Nó hoạt động bằng cách intercept (chặn/lắng nghe) các request đi qua ứng dụng Node.js của bạn, cho phép chúng ta kiểm tra mọi thứ từ headers, status code đến body response một cách dễ dàng và hiệu quả cao.

*   **Vai trò:** Mô phỏng các tương tác HTTP requests (GET, POST, PUT, DELETE...) một cách an toàn và cô lập.

---

## II. Thiết Lập Môi Trường Dự Án

Trước khi bắt đầu viết code, chúng ta cần đảm bảo môi trường sạch sẽ và các gói thư viện đã được cài đặt đầy đủ.

Giả sử bạn có một ứng dụng Express.js đang chạy ở file `app.js`.

```bash
# 1. Khởi tạo dự án
npm init -y

# 2. Cài đặt các thư viện cần thiết
npm install mocha chai supertest jest-cli --save-dev

# *Lưu ý*: Mặc dù Supertest, Mocha và Chai là cốt lõi, chúng ta thường cấu hình package.json script để chạy nó một cách gọn gàng hơn.
```

### Cấu Hình Script Chạy Test (package.json)

Mở file `package.json` và thêm script test sau:

```json
"scripts": {
    "test:api": "mocha --timeout 1000 */*.spec.js"
}
```

---

## III. Hướng Dẫn Thực Hành: Kiểm Thử CRUD API

Chúng ta sẽ xây dựng một bộ kiểm thử cho chức năng Quản lý Người dùng (Users) với các tác vụ cơ bản: Tạo (Create), Đọc (Read), Cập nhật (Update), và Xóa (Delete).

**Giả định:** Chúng ta có file `app.js` export một ứng dụng Express đã được thiết lập ở biến `app`.

### Bước 1: Import Dependencies và Setup Test File

Tạo thư mục `test` và bên trong là file `user.spec.js`.

```javascript
// test/user.spec.js

const request = require('supertest'); // Supertest module
const { expect } = require('chai'); // Assertion library
const app = require('../app'); // Import ứng dụng Express của bạn (hoặc instance ứng dụng)

// Global Setup: Khai báo nhóm kiểm thử cho Users
describe('API User Management', () => {

    let createdUserId; // Biến lưu trữ ID người dùng vừa tạo để tái sử dụng trong các bài test sau

    // Sử dụng before hook để đảm bảo các setup (ví dụ: xóa dữ liệu cũ) được thực hiện trước khi chạy nhóm tests này
    before(async function() {
        console.log("--- Bắt đầu chuẩn bị bộ Test Users ---");
        // Thực hiện hành động prep - ví dụ: gọi endpoint POST /users/seed để tạo data mẫu
        const response = await request(app)
            .post('/users/seed')
            .send({ name: 'Test User', email: `test_${Date.now()}@example.com` })
            .expect('Content-Type', /json/)
            .expect(201);

        // Lấy ID người dùng từ response body để sử dụng trong các test khác
        createdUserId = response.body.id; 
    });


    // ... (Các nhóm test chi tiết sẽ được thêm vào đây)
});
```

### Bước 2: Test Case - POST /users (Create User)

Chúng ta kiểm tra hành vi khi tạo người dùng thành công và thất bại.

```javascript
// Bên trong khối describe('API User Management', ...)

describe('POST /users', () => {

    it('Should successfully create a new user and return 201 status', async () => {
        const userData = { name: 'Jane Doe', email: 'jane@test.com', password: 'securepassword' };

        await request(app) // Supertest instance hóa request với ứng dụng app
            .post('/users')
            .send(userData) // Gửi body data
            .set('Authorization', 'Bearer test-token') // Thêm Header xác thực
            .expect('Content-Type', /json/) // Khẳng định Content Type của response
            .expect(201) // Khẳng định Status Code thành công
            .then(res => {
                // Kiểm tra cấu trúc và nội dung phản hồi (Assertion sử dụng Chai)
                expect(res.body).to.have.property('id').that.isAMethod(); // Đảm bảo có trường ID
                expect(res.body.message).to.include('created'); // Kiểm tra thông báo
            });
    });

    it('Should return 409 conflict if user email already exists', async () => {
        const duplicateData = { name: 'Duplicate', email: 'existing@test.com' };

        await request(app)
            .post('/users')
            .send(duplicateData)
            .expect('Content-Type', /json/)
            .expect(409); // Khẳng định Status Code Conflict
    });
});
```

### Bước 3: Test Case - GET /users/:id (Read User)

Kiểm tra việc lấy dữ liệu một người dùng cụ thể.

```javascript
// Bên trong khối describe('API User Management', ...)

describe('GET /users/:id', () => {

    it(`Should retrieve the user with ID ${createdUserId} and return 200`, async () => {
        await request(app)
            .get(`/users/${createdUserId}`) // Sử dụng template literal cho route parameter
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then(res => {
                // Assertions kiểm tra dữ liệu trả về
                expect(res.body).to.be.an('object'); // Phải là object
                expect(res.body.id).to.equal(createdUserId); // ID phải khớp
                expect(res.body).to.have.property('name').and.not.be.null; // Tên không được rỗng
            });
    });

    it('Should return 404 if the user does not exist', async () => {
        const nonExistentId = 999999;
        await request(app)
            .get(`/users/${nonExistentId}`)
            .expect('Content-Type', /json/)
            .expect(404); // Expect 404 Not Found
    });
});
```

### Bước 4: Test Case - DELETE /users/:id (Delete User)

Kiểm tra chức năng xóa dữ liệu.

```javascript
// Bên trong khối describe('API User Management', ...)

describe('DELETE /users/:id', () => {

    it(`Should successfully delete user with ID ${createdUserId} and return 204`, async () => {
        await request(app)
            .delete(`/users/${createdUserId}`) // Gọi API xóa
            .set('Authorization', 'Bearer admin-token')
            .expect('Content-Type', /json/)
            .expect(204); // Status 204 No Content (Thành công nhưng không trả body)

        // Verification: Sau khi delete, gọi lại GET để đảm bảo resource đã biến mất
        await request(app)
            .get(`/users/${createdUserId}`)
            .expect(404); // Kiểm tra xác nhận 404 sau khi xóa
    });
});
```

---

## IV. Góc Nhìn Chuyên Gia (QE Best Practices)

Việc viết code test đơn thuần là chưa đủ. Một QE Lead luôn phải nghĩ đến tính **Bền vững (Sustainability)** và **Khả năng mở rộng (Scalability)** của framework. Dưới đây là ba chiến lược nâng cao bạn cần áp dụng:

### 1. Tách Biệt Data Fixture & Setup Data
Không bao giờ hardcode dữ liệu mẫu (`{ name: 'John', email: 'john@test.com' }`) trong bài test. Thay vào đó, hãy tạo một lớp **Fixture** riêng biệt (ví dụ: `fixtures/users.js`).

*   **Lợi ích:** Nếu cấu trúc dữ liệu thay đổi, bạn chỉ cần sửa ở file fixture, chứ không phải tìm kiếm và sửa hàng trăm nơi trong các bài test.
*   **Nâng cao hơn:** Sử dụng Context Hooks (`beforeAll`/`afterAll`) để đảm bảo tất cả dữ liệu được tạo ra ở bước `before` phải được **dọn dẹp (Teardown)** bằng `afterAll`, giúp môi trường test luôn sạch sẽ và cô lập giữa các lần chạy.

### 2. Xử Lý Dependencies Giữa Các Test (Transactional Testing)
Trong ví dụ trên, chúng ta phụ thuộc vào việc tạo user ở bước `before` để dùng trong bước `it`. Điều này gọi là **State Dependency**.

Để tránh lỗi "Test A fail làm cho Test B fail theo" (cascading failure), hãy luôn:
1.  **Tạo Data**: Ở giai đoạn Setup/Before.
2.  **Sử dụng Data ID**: Truyền các ID vừa tạo này qua biến Scope hoặc Context để sử dụng trong tất cả các test case sau đó.
3.  **Cleanup**: Xóa dữ liệu bằng After hook.

### 3. Thiết Lập Hệ Thống Logging và Reporting Mạnh Mẽ
Một framework chuyên nghiệp phải cung cấp báo cáo chi tiết (như JUnit XML Reports). Các công cụ như Jest hoặc Mocha kết hợp với các plugin reporting sẽ giúp bạn xem được:
*   Thời gian chạy của từng bài test.
*   Lý do thất bại (stack trace) một cách rõ ràng nhất.
*   Bản đồ phụ thuộc giữa các test cases.

---

## Kết Luận

Bộ công cụ **Supertest, Mocha và Chai** là sự kết hợp gần như hoàn hảo cho việc kiểm thử API tự động trên Node.js. Chúng không chỉ giúp bạn viết các bài kiểm thử đơn giản về trạng thái HTTP (Status Code) mà còn nâng tầm khả năng của bạn để mô phỏng các luồng nghiệp vụ phức tạp (Business Flows).

Hãy nhớ rằng, mục tiêu của QE Lead là xây dựng một hệ thống *test* bền vững như chính hệ thống production. Bằng cách áp dụng các best practices về cô lập dữ liệu, quản lý state và cấu trúc test rõ ràng, bạn sẽ sở hữu một bộ framework kiểm thử API không chỉ hiệu quả mà còn mang tính chuyên nghiệp cao nhất.

Chúc bạn thành công trong việc tự động hóa chất lượng phần mềm!