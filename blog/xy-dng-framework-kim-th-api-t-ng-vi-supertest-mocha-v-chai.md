---
title: "Xây dựng Framework Kiểm thử API tự động với Supertest, Mocha và Chai"
date: 2026-07-03
description: "Hướng dẫn chuyên sâu từ góc nhìn của QE Lead về cách xây dựng framework kiểm thử API robust, đáng tin cậy bằng Supertest, Mocha và Chai trên Node.js."
tags: ["API Testing","Node.js","Automation"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hùng Trần"
---

# Xây dựng Framework Kiểm thử API tự động với Supertest, Mocha và Chai

Chào các đồng nghiệp QA/QE. Tôi là Hùng Trần.

Trong kỷ nguyên mà hầu hết các ứng dụng hiện đại đều được xây dựng dựa trên kiến trúc Microservices hoặc có lớp giao tiếp cốt lõi qua API (RESTful/GraphQL), việc kiểm thử chất lượng API không chỉ là một bước cần thiết—mà nó là xương sống đảm bảo tính ổn định và khả năng mở rộng của hệ thống.

Tôi nhận thấy nhiều đội ngũ vẫn mắc kẹt ở khâu kiểm thử thủ công hoặc sử dụng các tool mang tính "ghi lại" (Record-and-playback), dẫn đến framework kém linh hoạt, khó bảo trì và đặc biệt là dễ bị lỗi thời khi logic nghiệp vụ thay đổi.

Bài viết hôm nay sẽ không chỉ dừng lại ở việc *giới thiệu* một bộ công cụ; tôi sẽ hướng dẫn bạn cách *xây dựng* một Framework Kiểm thử API hoàn chỉnh, mạnh mẽ và có khả năng mở rộng cao bằng bộ ba tiêu chuẩn vàng trong hệ sinh thái Node.js: **Supertest**, **Mocha** và **Chai**.

---

## 💡 I. Hiểu Rõ Bộ Ba Công Cụ (The Synergy)

Trước khi đi sâu vào code, chúng ta cần hiểu vai trò riêng biệt nhưng cực kỳ ăn khớp của ba thư viện này. Việc hiểu được "tại sao" sẽ giúp bạn tối ưu hóa và mở rộng framework một cách khoa học.

### 1. Mocha: Bộ Trình Hợp Phẩm (The Runner)
*   **Vai trò:** Mocha là một *test runner*. Nó không kiểm tra logic nào cả, nhiệm vụ duy nhất của nó là cung cấp cấu trúc (structure) để chạy các bài test và báo cáo kết quả.
*   **Tính năng cốt lõi:** Hỗ trợ cú pháp nhóm (describe), trường hợp test (it/specify). Đây là bộ xương cho toàn bộ framework.

### 2. Chai: Bộ Công Cụ Khẳng Định (The Asserter)
*   **Vai trò:** Chai cung cấp các hàm *assertion* (khẳng định). Khi bạn gọi `expect(response.status).to.equal(200)`, thì chính là lúc Chai vào cuộc để so sánh giá trị thực tế với giá trị mong đợi.
*   **Ưu điểm nổi bật:** Mocha hỗ trợ nhiều kiểu assertion, nhưng **Chai's BDD style (Behavior-Driven Development)** sử dụng `expect` mang lại cú pháp rất dễ đọc, mô phỏng cách viết yêu cầu nghiệp vụ bằng ngôn ngữ tự nhiên.

### 3. Supertest: Bộ Mô Phỏng HTTP Client (The Requester)
*   **Vai trò:** Đây là thành phần quan trọng nhất trong context của API testing. Thay vì gọi trực tiếp vào lớp service/controller của bạn, Supertest cho phép chúng ta *mô phỏng toàn bộ vòng đời của một request HTTP thực tế*. Nó gửi yêu cầu qua Express app instance (hoặc bất kỳ framework nào nhận diện được) và trả về response object giống hệt như khi nó đến từ mạng thật.
*   **Tại sao lại dùng Supertest?** Nó tách biệt logic test khỏi việc triển khai server vật lý, giúp quá trình unit/integration test nhanh hơn, cô lập hơn và cực kỳ ổn định.

---

## ⚙️ II. Thiết Lập Môi Trường (Setup)

Chúng ta giả định rằng bạn đã có một project Node.js cơ bản. Các bước cài đặt dependencies cần thiết như sau:

```bash
# Khởi tạo package.json nếu chưa có
npm init -y

# Cài đặt các thư viện kiểm thử và runtime
npm install mocha chai supertest express --save-dev
```

***Lưu ý từ Hùng Trần:** Chúng ta cài `express` ở đây không phải để chạy server, mà chỉ là một middleware mẫu cho Supertest biết rằng nó cần đối tượng ứng dụng nào để thực hiện các yêu cầu mô phỏng.*

### Cấu Trúc Dự Án Mẫu:
```
/api-project
├── src/         # Nơi chứa logic backend của bạn (ví dụ: routes, controllers)
├── test/
│   └── api.test.js  # Files kiểm thử của chúng ta sẽ đặt ở đây
├── package.json
```

---

## 🚀 III. Triển Khai Framework Kiểm Thử Thực Tế

Bây giờ, hãy cùng đi vào phần thực hành. Chúng ta sẽ xây dựng một test case kiểm tra endpoint lấy danh sách người dùng (`GET /api/users`).

### Bước 1: Chuẩn Bị Endpoint Giả Lập (App Instance)

Để Supertest hoạt động, chúng ta cần một đối tượng ứng dụng Express đã được cấu hình để lắng nghe các request. Trong thực tế, bạn sẽ import service/app instance của mình vào đây.

**`test/api.test.js`:**
```javascript
const request = require('supertest');
const express = require('express');

// ----------------------------------------------------
// Đây là nơi chúng ta tạo ra một ứng dụng Express giả lập
// Tương tự như việc import app instance của bạn từ backend service
const app = express();
app.use(express.json());

// Giả lập route endpoint getUsers
// Trong thực tế, đây sẽ là logic router thật sự của bạn
app.get('/api/users', (req, res) => {
    res.status(200).json([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
    ]);
});

module.exports = app; // Export ứng dụng để Supertest sử dụng
// ----------------------------------------------------
```

### Bước 2: Viết Test Case Hoàn Chỉnh

Đây là nơi sự kết hợp giữa Mocha, Supertest và Chai tỏa sáng.

**`test/api.test.js` (Tiếp tục file trên):**

*(Chúng ta sẽ dùng `require('./path/to/app')` để đảm bảo đối tượng `app` đã được export.)*

```javascript
const request = require('supertest');
const { expect } = require('chai'); 
// Lấy object 'expect' từ chai cho cú pháp BDD.

describe('API User Management - GET /api/users', () => {
    let app; // Khai báo biến ứng dụng để sử dụng trong các test case

    // Sử dụng hook beforeEach: Thiết lập môi trường trước khi chạy mỗi nhóm kiểm thử (describe)
    before(async function() {
        app = require('../test/api.test'); 
    });


    it('Should return status 200 OK and a list of users', async () => {
        // Sử dụng Supertest để mô phỏng request GET
        const response = await request(app)
            .get('/api/users') // Endpoint cần test
            .set('Accept', 'application/json'); // Mô phỏng header chấp nhận

        // --------------------------------------
        // *** Bắt đầu phần Assertion với Chai (Expect) ***
        // 1. Kiểm tra status code: response.statusCode là thuộc tính được Supertest gắn vào
        expect(response.statusCode).to.equal(200); 

        // 2. Kiểm tra Content Type và Body tồn tại
        expect(response.body).to.be.an('array').with.lengthOf.at.least(1); 

        // 3. Kiểm tra cấu trúc dữ liệu (Schema Validation)
        const firstUser = response.body[0];
        expect(firstUser).to.have.property('id').that.is.a('number');
        expect(firstUser).to.have.property('name').that.is.a('string');

    });

    it('Should handle invalid paths gracefully', async () => {
        const response = await request(app)
            .get('/api/nonexistent-endpoint');

        // Kiểm tra xem việc truy cập sai endpoint có trả về 404 không
        expect(response.statusCode).to.equal(404);
    });
});
```

### Giải Thích Chuyên Sâu Về Code:

1.  **`describe('...', () => { ... })` (Mocha):** Định nghĩa một nhóm các test case liên quan đến cùng một chức năng (User Management API).
2.  **`before(async function() { ... })` (Hook):** Đây là Best Practice của QE Lead. Hooks (`before`, `after`) đảm bảo rằng môi trường kiểm thử được thiết lập sạch sẽ trước khi bất kỳ bài test nào bắt đầu, ngăn ngừa tình trạng **test contamination**.
3.  **`it('...', async () => { ... })` (Mocha):** Định nghĩa một trường hợp kiểm thử cụ thể (một kịch bản).
4.  **`const response = await request(app).get('/api/users').set(...)` (Supertest):** Đây là sự kỳ diệu của Supertest. Nó nhận đối tượng `app`, giả lập hành vi gọi `.get()` lên endpoint `/api/users`, và chờ kết quả trả về dưới dạng promise, giúp chúng ta sử dụng cú pháp `await`.
5.  **`expect(response.statusCode).to.equal(200)` (Chai):** Đây là logic kiểm tra. Chúng ta khẳng định rằng giá trị `response.statusCode` phải bằng 200. Cú pháp `.to.equal()` của Chai giúp code cực kỳ dễ đọc, mô tả ý đồ kiểm test rõ ràng như thể đang viết Requirement BDD.

---

## ✨ IV. Các Kỹ Thuật Nâng Cao Cho QE Lead (Beyond the Basics)

Nếu bạn đã thành thạo việc chạy các test cơ bản trên, hãy chú ý đến những điểm sau để nâng cấp framework của mình lên mức độ Enterprise-Grade:

### 1. Quản Lý Dữ Liệu Giả Lập (Fixtures Management)
Tuyệt đối không nên hardcode dữ liệu vào test file. Hãy tạo một thư mục `test/fixtures` và sử dụng module I/O để đọc các tập tin JSON hoặc CSV.

*   **Ví dụ:** Khi bạn cần kiểm tra việc xóa người dùng, hãy lấy ID của user đó từ file fixture thay vì viết `@Given {user_id} 123`. Điều này giúp test tự động cập nhật khi dữ liệu mẫu thay đổi.

### 2. Xử Lý Trạng Thái (Test State Management)
Nếu Test A cần phải tạo một tài nguyên và Test B cần dùng ID của tài nguyên đó, bạn không nên để chúng chạy độc lập. Hãy sử dụng:

*   **`beforeEach` Hook:** Thiết lập trạng thái cơ bản *trước mỗi test*.
*   **`afterEach` Hook:** Dọn dẹp trạng thái (Clean up) sau mỗi test. Ví dụ: Sau khi tạo user X, dùng `await request(app).delete('/api/users/' + userId)` để xóa user X. Điều này đảm bảo môi trường sạch sẽ cho kịch bản tiếp theo.

### 3. Tách Logic Test và Assertions (DRY Principle)
Nếu bạn có nhiều test case cùng kiểm tra việc xác thực JSON Schema, đừng viết code đó lặp lại. Hãy tạo một hàm utility riêng:

```javascript
// utils/validation.js
const { expect } = require('chai');

function validateSchema(data, schemaMap) {
    expect(data).to.be.an('object').that.hasAllKeys(Object.keys(schemaMap));
    // ... logic kiểm tra chi tiết hơn ...
}
```
Sau đó gọi hàm này trong các test case của bạn.

---

## 🎓 Kết Luận

Việc xây dựng một API Test Framework không chỉ là việc cài đặt các thư viện, mà là thiết lập một *quy trình* kiểm thử có cấu trúc và kỷ luật. Bằng cách kết hợp sức mạnh của Mocha (Cấu trúc), Chai (Assertion) và Supertest (Mocking HTTP Requests), bạn đã trang bị cho mình bộ công cụ đủ tầm để viết ra những bài test không chỉ chạy được, mà còn cực kỳ dễ hiểu, dễ bảo trì, và quan trọng nhất: **đáng tin cậy.**

Lời khuyên cuối cùng từ tôi là: Đừng bao giờ nghĩ rằng việc kiểm thử tự động là một nhiệm vụ "nên có". Hãy xem nó như là tài liệu thiết kế *sống* của sản phẩm bạn đang xây dựng. Nó giúp đội ngũ phát triển và QA hiểu rõ ràng, chính xác điều gì được kỳ vọng ở mỗi API endpoint.

Chúc các bạn thành công trên hành trình nâng cấp chất lượng phần mềm!
<br>
**Hùng Trần - QE Lead.**