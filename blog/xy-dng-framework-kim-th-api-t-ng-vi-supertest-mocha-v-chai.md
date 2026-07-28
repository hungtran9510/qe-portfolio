---
title: "Xây dựng Framework Kiểm thử API tự động với Supertest, Mocha và Chai"
date: 2026-07-10
description: "Hướng dẫn chuyên sâu xây dựng framework kiểm thử API robust bằng bộ công cụ Supertest, Mocha và Chai cho môi trường Node.js."
tags: ["API Testing","Node.js","Automation"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hùng Trần"
---

# Xây dựng Framework Kiểm thử API tự động với Supertest, Mocha và Chai

Chào các đồng nghiệp trong lĩnh vực Chất lượng phần mềm (QA/QE)! Tôi là Hùng Trần.

Trong kỷ nguyên kiến trúc microservices và việc phát triển ứng dụng dựa trên các giao diện lập trình ứng dụng (API) trở nên phổ biến hơn bao giờ hết, việc đảm bảo API hoạt động đúng đắn không chỉ là cần thiết mà còn là yếu tố sống còn của cả hệ thống. Nếu một API bị lỗi, toàn bộ tính năng phụ thuộc vào nó có thể sụp đổ theo "hiệu ứng domino".

Kiểm thử thủ công (Manual Testing) gần như vô dụng khi đối diện với hàng trăm endpoint và các trường hợp biên (Edge Cases). Chúng ta cần một giải pháp tự động hóa mạnh mẽ. Bài viết này sẽ đi sâu vào cách xây dựng một *Framework Kiểm thử API* chuyên nghiệp, sử dụng bộ ba công cụ tiêu chuẩn vàng trong hệ sinh thái Node.js: **Supertest**, **Mocha**, và **Chai**.

## 💡 Tại sao Supertest, Mocha, và Chai?

Trước khi viết code, chúng ta cần hiểu rõ vai trò của từng thành phần để biết cách tận dụng sức mạnh kết hợp của chúng. Đây không chỉ là việc liệt kê thư viện, mà là việc kiến tạo một hệ sinh thái kiểm thử hoàn hảo.

### 🚀 1. Mocha (The Test Runner)
Mocha là một *Test Framework* linh hoạt và tối giản. Nó đóng vai trò là "người tổ chức" hay "trình chạy bài kiểm tra".
*   **Nhiệm vụ:** Định nghĩa cấu trúc của bộ test (`describe` blocks) và quản lý vòng đời (lifecycle) của các bài kiểm tra, giúp ta biết khi nào một bài test bắt đầu và kết thúc.

### 🛡️ 2. Chai (The Assertion Library)
Chai là thư viện *Assertion* (khẳng định). Nó không chạy test, nhưng nó cho chúng ta cú pháp để **kiểm tra xem điều gì đã xảy ra có đúng với kỳ vọng của chúng ta hay không.**
*   **Nhiệm vụ:** Cung cấp các bộ assert mạnh mẽ (`expect`, `should`, `assert`). Ví dụ: thay vì viết `if (response.status !== 200)`, ta chỉ cần viết `expect(response.status).to.equal(200)`.

### 🌐 3. Supertest (The HTTP Utility)
Đây là trái tim của việc kiểm thử API trong bài viết này. Supertest được xây dựng trên cơ sở Express/Connect và cho phép chúng ta tạo ra các yêu cầu HTTP giả lập, gửi chúng đến endpoint mà không cần phải khởi động toàn bộ server vật lý một cách phức tạp.
*   **Nhiệm vụ:** Mô phỏng các hành vi của trình duyệt hoặc client thực tế (GET, POST, PUT, DELETE) và bắt lấy response headers/body để kiểm tra.

***Tóm lại:*** **Mocha** cho cấu trúc $\rightarrow$ **Supertest** gửi request $\rightarrow$ **Chai** xác nhận kết quả trả về.

## 🛠️ Bước 1: Thiết lập Môi trường Phát triển

Đầu tiên, chúng ta cần khởi tạo dự án và cài đặt các dependencies.

```bash
# Khởi tạo Node.js project
npm init -y

# Cài đặt các dependency chính
npm install supertest mocha chai express # (Express chỉ dùng để mock server)

# Cài đặt devDependency cho testing tools
npm install --save-dev mocha mocha-typescript @types/mocha
```

*Lưu ý: Tôi sử dụng `express` ở đây chỉ để tạo một ứng dụng giả lập đơn giản (`app`) mà Supertest có thể gọi tới.*

## ⚙️ Bước 2: Xây dựng Endpoint Mock (Server Cơ bản)

Để kiểm thử, chúng ta cần một API giả. Chúng ta sẽ dùng Express để setup một server nhỏ.

**`src/api.js`**
```javascript
const express = require('express');
const app = express();
app.use(express.json()); 

// Endpoint GET: Lấy thông tin người dùng theo ID
app.get('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    if (userId === 1) {
        return res.status(200).json({ id: 1, name: "Alice", email: "alice@example.com" });
    } else if (isNaN(userId)) {
         // Xử lý trường hợp ID không phải số
         return res.status(400).json({ message: "Invalid user ID format." });
    } 
    // Trả về lỗi 404 nếu không tìm thấy
    else {
        return res.status(404).json({ message: "User not found." });
    }
});

module.exports = app; // Export ứng dụng Express để Supertest có thể truy cập
```

## 🧪 Bước 3: Viết Bộ Kiểm Thử API Hoàn Chỉnh

Bây giờ, chúng ta sẽ tạo file test và bắt đầu viết các bài kiểm tra (Test Cases). Đây là phần quan trọng nhất.

**`test/user.test.js`**
```javascript
// Import các thư viện cần thiết
const request = require('supertest'); // Supertest
const expect = require('chai').expect; // Chai Assertions
const app = require('../src/api'); // Ứng dụng Express của chúng ta

describe('User API Endpoints', () => {
    // Sử dụng context: Mô tả nhóm bài kiểm tra cho tất cả các test case bên trong
    
    it('should return status 200 and correct user details for existing ID (ID=1)', async () => {
        // Supertest.expect() giúp chúng ta thực hiện yêu cầu GET
        const response = await request(app)
            .get('/users/1') // Gửi Request đến endpoint /users/1
            .expect('Content-Type', /json/) // Kiểm tra Header: Đảm bảo trả về JSON
            .expect(200); // Chai qua Supertest để kiểm tra Status Code

        // Sử dụng chai.expect để kiểm tra body payload chi tiết hơn (Functional check)
        expect(response.body).to.be.an('object');
        expect(response.body).to.have.property('id').that.is.number;
        expect(response.body).to.have.property('name').and.to.equal("Alice");
    });

    it('should return status 404 when user ID does not exist', async () => {
        // Kiểm thử trường hợp không tìm thấy (Negative Test Case)
        const response = await request(app)
            .get('/users/999')
            .expect(404); // Chai qua Supertest để kiểm tra Status Code 404

        expect(response.body).to.have.property('message').and.include('User not found');
    });

    it('should return status 400 and handle invalid ID format', async () => {
         // Kiểm thử trường hợp dữ liệu đầu vào bị sai định dạng (Edge Case)
        const response = await request(app)
            .get('/users/abc') // Truyền chuỗi không phải số
            .expect(400);

        expect(response.body).to.have.property('message').and.include('Invalid user ID format');
    });
});
```

### 🔍 Phân tích Code (Từ góc nhìn của QE Lead)

Tôi xin phép đi sâu phân tích từng đoạn code để các bạn hình dung rõ cách bộ ba này hoạt động cùng nhau:

1.  **`const request = require('supertest');`**: Chúng ta import `request`. Đây là wrapper mạnh mẽ cho tất cả việc tương tác HTTP.
2.  **`describe('User API Endpoints', () => { ... });`**: Đây là cách Mocha định nghĩa một *group* các bài test liên quan đến User API. Nó giúp báo cáo (report) của chúng ta cực kỳ rõ ràng: "Test Group User API" đã chạy, và những gì xảy ra trong group này.
3.  **`it('should return status 200...', async () => { ... });`**: `it` là nơi chứa một bài kiểm tra cụ thể (test case). Việc dùng `async/await` là best practice vì các request HTTP là các thao tác không đồng bộ (asynchronous).
4.  **`.expect('Content-Type', /json/).expect(200)`**: Đây là sự kết hợp giữa Supertest và Chai.
    *   Supertest nhận lệnh kiểm tra header (`.expect('Header', expectedValue)`).
    *   Cuối cùng, chúng ta gọi `.expect(statusCode)`. Nếu bất kỳ lần `await` nào trong chuỗi này thất bại (ví dụ: status code là 500 thay vì 200), Supertest sẽ tự động ném lỗi và Mocha sẽ bắt được nó để đánh dấu test case đó là **FAILED**.
5.  **`expect(response.body).to.be.an('object');`**: Đây thuần túy là Chai Assertion. Sau khi Supertest đã đảm bảo rằng HTTP status code và headers là đúng, chúng ta dùng `chai` để kiểm tra sâu hơn vào *nội dung* (payload/response body) của dữ liệu trả về – ví dụ: nó có phải object không? Nó có property `name` không? Giá trị của `name` có bằng "Alice" không?

## 🚀 Bước 4: Nâng cao và Thực hành Tốt nhất (Best Practices)

Để framework của bạn đạt tính chuyên nghiệp và khả năng mở rộng cao, hãy lưu ý những điểm sau:

### 1. Xử lý Môi trường (Environment Variables)
Không bao giờ hardcode URL hay API Key. Hãy sử dụng biến môi trường (ví dụ: `process.env.BASE_URL`). Điều này giúp framework của bạn có thể chuyển đổi giữa Dev, Staging và Production chỉ bằng cách thay đổi cấu hình chạy test.

### 2. Quản lý Setup/Teardown
Nếu các bài test cần một trạng thái dữ liệu sạch sẽ (ví dụ: phải tạo tài khoản người dùng trước khi kiểm tra API lấy user), hãy sử dụng Hooks của Mocha:
*   **`before()`**: Chạy code setup *trước* khi nhóm test bắt đầu.
*   **`after()`**: Dọn dẹp tài nguyên sau khi toàn bộ nhóm test kết thúc (ví dụ: xóa dữ liệu mock).

### 3. Tách biệt Logic Kiểm thử và Test Case
Đừng bao giờ đặt logic kinh doanh phức tạp vào trong file test. Hãy viết các hàm helper function riêng để thực hiện các tác vụ chung, giúp code dễ đọc, tái sử dụng và maintainable hơn.

## Kết Luận

Việc xây dựng một Framework kiểm thử API tự động không chỉ là việc chạy script mà đó là việc thiết kế *một quy trình chất lượng*. Bằng cách kết hợp sức mạnh cấu trúc của **Mocha**, khả năng gửi request mô phỏng cao cấp của **Supertest**, và khả năng khẳng định dữ liệu chi tiết của **Chai**, chúng ta đã xây dựng được một bộ công cụ kiểm thử API cực kỳ robust.

Một framework như thế này sẽ giúp đội ngũ phát triển của bạn tự tin hơn, giảm thiểu rủi ro regression, và quan trọng nhất là cho phép các bạn tập trung vào việc tạo ra giá trị kinh doanh thay vì lo lắng về lỗi runtime!

Chúc các bạn thành công với những dự án CI/CD tiếp theo! Nếu có bất kỳ thắc mắc nào về chuyên sâu kỹ thuật này, đừng ngần ngại thảo luận nhé.