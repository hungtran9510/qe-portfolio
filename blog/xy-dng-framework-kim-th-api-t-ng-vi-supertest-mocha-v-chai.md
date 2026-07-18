---
title: "Xây dựng Framework Kiểm thử API tự động với Supertest, Mocha và Chai"
date: 2026-06-30
description: "Hướng dẫn chi tiết từ chuyên gia cách thiết lập và tối ưu hóa framework kiểm thử API mạnh mẽ bằng bộ ba công cụ Supertest, Mocha và Chai."
tags: ["API Testing","Node.js","Automation"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hùng Trần"
---

# Xây dựng Framework Kiểm thử API tự động với Supertest, Mocha và Chai

Xin chào các bạn kỹ sư chất lượng! Tôi là Hùng Trần.

Trong kỷ nguyên microservices và kiến trúc API-first, việc đảm bảo chất lượng của từng endpoint không chỉ là một yêu cầu mà đã trở thành *bắt buộc sống còn*. Một lỗi nhỏ về logic nghiệp vụ (business logic) hay schema dữ liệu cũng có thể gây ra thảm họa vận hành nghiêm trọng.

Kiểm thử API tự động (API Automated Testing) là tuyến phòng thủ đầu tiên và quan trọng nhất của quy trình CI/CD. Nhưng làm sao để xây dựng một framework kiểm thử không chỉ chạy được, mà còn phải *mạnh mẽ*, *dễ mở rộng* và *bảo trì cao*?

Bài viết này sẽ là cẩm nang chi tiết của tôi, giúp các bạn nắm vững cách thiết lập một bộ ba công cụ cực kỳ mạnh mẽ: **Supertest**, **Mocha** và **Chai**. Chúng ta không chỉ dừng lại ở việc viết test case, mà còn xây dựng cả một *kiến trúc* kiểm thử chuyên nghiệp.

---

## 💡 Phần I: Hiểu Rõ "Bộ Ba Quyền Lực"

Trước khi đi vào code, chúng ta cần hiểu vai trò riêng biệt và sự cộng hưởng của ba thư viện này.

### 1. Mocha (The Test Runner)
**Vai trò:** Trình chạy kiểm thử (Test Runner).
Mocha cung cấp cấu trúc cơ bản để tổ chức các bài test bằng cú pháp `describe()` và `it()`. Nó chịu trách nhiệm biết khi nào cần bắt đầu, khi nào cần kết thúc một nhóm kiểm thử, và báo cáo trạng thái thành công/thất bại.

### 2. Chai (The Assertion Library)
**Vai trò:** Thư viện xác nhận (Assertion).
Khi Supertest thực hiện một request API và trả về một response object, chúng ta phải biết cách *xác nhận* rằng dữ liệu đó đúng như mong đợi (ví dụ: Status Code là 200, Body chứa trường X với giá trị Y). Chai chính là công cụ giúp chúng ta thực hiện việc xác nhận này bằng các cú pháp tường minh (như `expect`, `should`).

### 3. Supertest (The HTTP Client)
**Vai trò:** Utility kiểm thử Request/Response.
Supertest được xây dựng dựa trên Express/Koa và nó cho phép bạn mô phỏng các yêu cầu HTTP (GET, POST, PUT, DELETE...) gửi đến một ứng dụng web **mà không cần khởi động server vật lý**. Đây là điểm mạnh nhất vì nó giúp việc test trở nên nhanh hơn, cô lập hơn và dễ dàng setup môi trường kiểm thử.

| Công cụ | Chức năng cốt lõi | Vai trò trong Framework |
| :--- | :--- | :--- |
| **Mocha** | Cấu trúc hóa & Vòng đời Test (Lifecycle) | Giữ cho test case có tổ chức (Grouping, Hooks). |
| **Supertest** | Mock HTTP Request/Response | Thực hiện tương tác với API dưới dạng mã nguồn. |
| **Chai** | Xác minh điều kiện (Validation) | Kiểm tra tính đúng đắn của kết quả trả về (Data Integrity Check). |

---

## ⚙️ Phần II: Thiết Lập Môi Trường (Setup)

Các bước đầu tiên là cài đặt các thư viện cần thiết trong dự án Node.js của bạn.

```bash
# Khởi tạo dự án nếu chưa có
npm init -y

# Cài đặt Supertest, Chai và Mocha dưới dạng devDependency
npm install supertest chai mocha --save-dev
```

**Thiết lập `package.json`:** Để chạy các test một cách tiện lợi, chúng ta nên thêm script vào tệp này:

```json
// package.json
"scripts": {
    "test": "mocha" 
}
```

Bây giờ, bạn chỉ cần chạy lệnh `npm test` là Mocha sẽ được kích hoạt và bắt đầu tìm kiếm các file test của bạn.

---

## 🔬 Phần III: Triển Khai Test Case Đầu Tiên (The Code)

Giả sử chúng ta có một API endpoint `/api/users/:id` để lấy thông tin người dùng. Chúng ta sẽ tạo file `test/user.test.js`.

### Ví dụ Code: `test/user.test.js`

```javascript
const request = require('supertest');
const expect = require('chai').expect;
// Giả sử bạn có thể export express app instance để Supertest sử dụng
const app = require('../src/app'); 

describe('User API Endpoints', () => {
    it('should return status 200 and user data for a valid ID', async () => {
        // Sử dụng supertest.request để mô phỏng HTTP request
        const response = await request(app)
            .get('/api/users/123') // Endpoint test
            .set('Authorization', 'Bearer some_token'); // Thêm headers nếu cần

        // --------------------
        // Bắt đầu các bước Assertion bằng Chai
        // --------------------
        
        // 1. Kiểm tra Status Code
        expect(response.statusCode).to.equal(200); 

        // 2. Kiểm tra Content Type (Header)
        expect(response.headers['content-type']).to.include('application/json');

        // 3. Kiểm tra cấu trúc và nội dung của Body
        const body = response.body;
        expect(body).to.be.an('object'); // Đảm bảo body là object
        expect(body).to.have.property('id').that.is.a('number');
        expect(body).to.have.property('email').that.is.a('string');
    });

    it('should return status 404 for a non-existent user ID', async () => {
        const response = await request(app)
            .get('/api/users/999') // ID không tồn tại
            .set('Authorization', 'Bearer some_token');

        // Kiểm tra trường hợp API thất bại
        expect(response.statusCode).to.equal(404); 
    });
});
```

### 🧐 Phân tích Chi tiết Code (Hùng Trần’s Analysis)

1. **`const request = require('supertest');`**: Chúng ta import Supertest để có đối tượng `request()`. Đây là cách supertest wrapper các phương thức HTTP như `.get()`, `.post()`, v.v.
2. **`describe('...', () => { ... });`**: Mocha sử dụng khối `describe` để nhóm các test liên quan đến một module hoặc endpoint cụ thể (ví dụ: tất cả test về User API). Điều này giúp báo cáo kết quả trực quan hơn.
3. **`it('...', async () => { ... });`**: Đây là lời khẳng định rằng đây là một *Test Case* thực tế. Chúng ta sử dụng `async/await` vì Supertest và các hoạt động mạng đều là bất đồng bộ (asynchronous).
4. **`const response = await request(app).get(...)`**: Supertest nhận vào instance của Express App (`app`) và phương thức HTTP. Nó sẽ trả về một Promise chứa đối tượng `response`.
5. **`expect(response.statusCode).to.equal(200);`**: Đây là phần "chất lượng" do Chai cung cấp. Thay vì dùng câu lệnh `if (response.statusCode !== 200) { throw new Error('Fail'); }`, việc sử dụng `expect()` giúp code *sạch sẽ* và *ý định rõ ràng*.
    *   `expect(A)`: Xác nhận rằng A là đối tượng cần kiểm tra.
    *   `.to.be.an('object')`: Là một Matcher của Chai, xác minh kiểu dữ liệu.
    *   `.that.is.a('string')`: Thực hiện chuỗi kiểm tra phức tạp hơn trên cùng một property.

---

## 🚀 Phần IV: Nâng Cao Framework (Best Practices)

Một QE Lead không chỉ viết test case đơn lẻ, chúng tôi xây dựng *hệ thống*. Để framework của bạn đạt mức độ chuyên nghiệp, hãy áp dụng các kỹ thuật sau:

### 1. Sử Dụng Hooks (`before`/`after`)
Các hooks giúp chuẩn bị hoặc dọn dẹp môi trường trước và sau khi chạy nhóm test.

**Tình huống:** Khi kiểm thử API người dùng (User), bạn cần đảm bảo rằng dữ liệu người dùng đó phải TỒN TẠI trong DB ảo cho mọi test case đều sử dụng.

```javascript
describe('Authenticated User Flow', () => {
    let user; // Biến toàn cục để lưu trữ đối tượng người dùng

    // HOOK: CHẠY TRƯỚC KHI NHÓM TEST BẮT ĐẦU (before)
    before(async function() {
        // Giả định hàm này tạo một user mới và trả về object đó
        user = await createMockUserInDatabase(); 
        console.log(`[SETUP] Mock User ID created: ${user.id}`);
    });

    // HOOK: CHẠY SAU KHI TẤT CẢ TEST ĐÃ HOÀN THÀNH (after)
    after(async function() {
        // Dọn dẹp dữ liệu để tránh leak hoặc ô nhiễm trạng thái DB
        await deleteUserFromDatabase(user.id); 
        console.log('[TEARDOWN] Cleanup complete.');
    });

    it('should retrieve the setup user successfully', async () => {
        // Test case sử dụng biến 'user' đã được khởi tạo ở hook before
        const response = await request(app).get(`/api/users/${user.id}`);
        expect(response.statusCode).to.equal(200);
        expect(response.body.email).to.equal(user.email); 
    });
});
```

**Giải thích:** Việc sử dụng `before` và `after` đảm bảo rằng các test của bạn là **Cô lập (Isolated)**. Mỗi nhóm test chạy trong một môi trường sạch sẽ, không bị ảnh hưởng bởi trạng thái thất bại/thành công của các test trước đó.

### 2. Abstracting Logic với Helper Functions
Không bao giờ lặp lại code! Nếu nhiều endpoint đều cần token xác thực hoặc cùng một logic kiểm tra định dạng email, hãy tạo hàm helper.

```javascript
// src/helpers/authHelper.js
const generateAuthToken = async (email) => {
    // Logic gọi API đăng nhập để lấy JWT token
    console.log(`[Utility] Attempting to login for ${email}...`);
    return 'fake_jwt_token'; 
};

module.exports = {
    generateAuthToken
};
```

Sau đó, trong file test:
```javascript
const { generateAuthToken } = require('../helpers/authHelper');

it('should handle restricted resource access', async () => {
    // Gọi hàm helper thay vì viết lại logic lấy token 3 lần
    const token = await generateAuthToken('test@example.com');

    await request(app)
        .get('/api/admin')
        .set('Authorization', `Bearer ${token}`) // Sử dụng helper
        .expect(200);
});
```

### 3. Data-Driven Testing (Kiểm thử dựa trên Dữ liệu)
Thay vì viết nhiều test case cho các giá trị khác nhau, hãy dùng cấu trúc lặp qua một mảng dữ liệu. Điều này giúp tăng độ bao phủ kiểm thử mà không làm phình to file test.

```javascript
// Giả định bạn muốn kiểm tra tính hợp lệ của các mã sản phẩm (SKU)
const invalidSkus = [
    'ABC',          // Trường hợp valid, length 3
    'TOO_LONG_CODE', // Trường hợp inválid, quá dài
    ''               // Trường hợp null/empty string
];

describe('Product API Validation', () => {
    invalidSkus.forEach(sku => {
        it(`should reject SKU '${sku}' due to validation failure`, async () => {
            const response = await request(app)
                .post('/api/products/validate')
                .send({ sku: sku });

            // Thiết lập assertion cho trường hợp thất bại (400 Bad Request)
            expect(response.statusCode).to.equal(400); 
        });
    });
});
```

---

## ✅ Kết Luận và Cam Kết Chất Lượng

Việc xây dựng một framework kiểm thử API không chỉ là việc chạy các lệnh `npm test`. Đó là một quá trình kỹ thuật cần sự cân nhắc về kiến trúc. Bằng cách kết hợp **Supertest** để cô lập tầng HTTP, **Mocha** để cấu trúc hoá vòng đời test, và **Chai** để xác minh dữ liệu bằng các assertion mạnh mẽ, bạn đã sở hữu một bộ công cụ *Tiêu chuẩn Công nghiệp* (Industry Standard).

### Lời khuyên cuối từ Hùng Trần:
1. **Phân lớp Test:** Tách biệt Test Utility, Setup/Teardown Logic và