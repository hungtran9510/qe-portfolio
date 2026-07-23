---
title: "Áp dụng Test Driven Development (TDD) trong phát triển Node.js REST API"
date: 2026-05-02
description: "Khám phá cách TDD giúp bạn xây dựng các Node.js REST API mạnh mẽ, bền vững và được kiểm thử chuyên nghiệp."
tags: ["TDD","Node.js","Clean Code"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# Áp dụng Test Driven Development (TDD) trong phát triển Node.js REST API

Chào các đồng nghiệp và các nhà phát triển hệ thống! Tôi là Duy Trung, và với vai trò là một Quality Engineer Lead, tôi đã dành nhiều năm nghiên cứu về cách thức chúng ta xây dựng không chỉ những đoạn mã chạy được, mà còn là những hệ thống *bền vững* và *dễ bảo trì*.

Trong thế giới phát triển API hiện đại – đặc biệt là với Node.js nhờ khả năng xử lý I/O bất đồng bộ (Asynchronous) vượt trội – việc đảm bảo chất lượng không thể chỉ dừng lại ở các bài kiểm thử cuối quy trình (End-to-End Testing). Chúng ta cần một triết lý làm việc thay đổi cách chúng ta viết code ngay từ đầu.

Và đó chính là **Test Driven Development (TDD)**.

Bài viết này sẽ đi sâu vào việc áp dụng TDD một cách thực tế nhất để xây dựng các Node.js REST API, biến những bài test không chỉ là "cái thứ chạy sau" mà trở thành *kim chỉ nam* cho quá trình thiết kế và triển khai của chúng ta.

***

## 📘 I. Hiểu rõ về Test Driven Development (TDD)

Nếu có một khái niệm nào định hình tư duy chất lượng cho lập trình viên, đó chính là TDD. Nó không phải là một framework hay công cụ; nó là một *chu trình thiết kế* và *kiểm thử*.

### 🔄 Chu trình Red $\to$ Green $\to$ Refactor

Tất cả các quy tắc của TDD đều xoay quanh chu trình ba bước cực kỳ đơn giản nhưng cực kỳ mạnh mẽ:

1.  **RED (Viết Test thất bại):** Chúng ta bắt đầu bằng việc viết một *bài test* cho tính năng mà chúng ta **muốn có**, ngay lập tức, trước khi viết bất kỳ dòng logic triển khai nào. Mục tiêu là để bài test này *thất bại*. Sự thất bại đó chứng minh rằng chúng ta đang kiểm tra thứ gì và tại sao nó chưa tồn tại.
2.  **GREEN (Viết code tối thiểu):** Tiếp theo, chúng ta chỉ viết đủ lượng code tối thiểu cần thiết để làm cho bài test ở bước RED kia *chạy thành công*. Mục tiêu duy nhất lúc này là làm cho màu sắc chuyển sang **XANH LÁ**. Chúng ta không quan tâm đến sự hoàn hảo hay vẻ đẹp của code; chỉ cần nó hoạt động.
3.  **REFACTOR (Tái cấu trúc):** Cuối cùng, khi mọi test đều xanh, chúng ta mới bắt đầu bước Tái cấu trúc. Lúc này, vì biết rằng bộ test đã bao phủ tính năng hiện tại một cách nghiêm ngặt, chúng ta có thể mạnh dạn làm sạch code, cải thiện kiến trúc, tối ưu hiệu suất mà không sợ làm hỏng các chức năng đã hoạt động (Regression).

> 💡 **Góc nhìn QE Lead:** Đối với tôi, TDD buộc chúng ta phải nghĩ như người dùng cuối và nhà kiểm thử. Nó là công cụ tốt nhất để phòng ngừa lỗi (Bug Prevention) thay vì chỉ phát hiện lỗi (Bug Detection).

## 🚀 II. Tại sao TDD lại tối ưu cho Node.js REST API?

Node.js, với kiến trúc bất đồng bộ (`async`/`await`), và tính chất của REST APIs – nơi sự tương tác giữa các lớp logic (Service Layer) và điều khiển luồng (Controller/Route Layer) là rất rõ ràng – khiến TDD trở thành giải pháp gần như tối ưu:

1.  **Kiểm thử Tính bất đồng bộ:** Các API thường xuyên phải xử lý kết nối database, gọi Microservices khác. TDD giúp chúng ta viết các bài test mock (giả lập) cho các dependency này, cô lập logic và đảm bảo rằng luồng `async` được quản lý chính xác trong mọi trường hợp thành công/thất bại.
2.  **Đảm bảo Hợp đồng API (API Contract):** Mỗi endpoint của REST API đều là một "hợp đồng" giữa Client và Server. TDD buộc chúng ta phải định nghĩa rõ ràng đầu vào (Request Body, Headers) và đầu ra (Response Status Code, Schema JSON) ngay từ lúc viết test.
3.  **Thiết kế Modular:** Khi bạn luôn bắt đầu bằng việc cần kiểm thử một Unit nào đó, bạn sẽ tự nhiên bị ép để tách biệt logic kinh doanh (`Business Logic`) thành các lớp nhỏ, độc lập và có thể kiểm thử được (Testable Units).

## 🛠️ III. Hướng dẫn thực hành: TDD với Express API (Sử dụng Jest)

Giả sử chúng ta đang xây dựng một API endpoint `/users` để tạo người dùng mới (`POST /users`). Chúng ta sẽ áp dụng quy trình Red-Green-Refactor cho tầng Service Layer, nơi chứa logic nghiệp vụ cốt lõi.

**Cấu trúc dự án giả định:**
*   `src/services/user.service.js`: Chứa logic kinh doanh (ví dụ: kiểm tra email trùng lặp).
*   `src/routes/user.routes.js`: Xử lý routing và gọi service.
*   `__tests__/user.test.js`: Nơi chứa các bài test TDD của chúng ta.

### Bước 1: Thiết lập (Setup)

Chúng ta cần một bộ công cụ kiểm thử mạnh mẽ. Tôi khuyến nghị sử dụng **Jest** vì sự hỗ trợ tuyệt vời cho mã bất đồng bộ và khả năng Mocking Dependency class hàng đầu.

```bash
npm install --save-dev jest supertest @types/jest
# Khởi tạo cấu hình test (jest.config.js)
```

### Bước 2: Pha RED – Viết bài kiểm thử thất bại

Chúng ta muốn đảm bảo rằng nếu người dùng cố gắng đăng ký bằng email đã tồn tại, API phải trả về lỗi `409 Conflict`. Chúng ta viết test trước tiên, giả định rằng lớp Service chưa hề tồn tại.

**`__tests__/user.service.test.js` (Bài test):**

```javascript
// Giả sử UserService là lớp chịu trách nhiệm logic nghiệp vụ
const UserService = require('../services/user.service'); 

describe('UserService', () => {
    it('SHOULD throw an error if the user email already exists', async () => {
        // Chúng ta kiểm tra xem việc gọi service có ném ra exception (lỗi) với message mong muốn không
        await expect( UserService.createUser({ name: 'John Doe', email: 'john@example.com' }) )
            .rejects.toThrow('Email already in use'); 
    });
});
```

**Kết quả:** Khi chạy `jest`, bài test này sẽ **thất bại (Red)** vì lớp `UserService` và phương thức `createUser` chưa được định nghĩa, hoặc nó sẽ ném ra một lỗi khác (ví dụ: ReferenceError). *Đây chính là tín hiệu thành công của bước RED.*

### Bước 3: Pha GREEN – Viết code tối thiểu để vượt qua test

Bây giờ chúng ta viết class và phương thức trong `src/services/user.service.js` chỉ đủ để khiến bài test ở trên chuyển sang màu xanh.

**`src/services/user.service.js` (Code tối giản):**

```javascript
class UserService {
    /**
     * Tạo người dùng mới. Giả định có một cơ chế kiểm tra email trùng lặp nào đó.
     */
    static async createUser({ name, email }) {
        // 🛑 LOGIC TỐI THIỂU ĐỂ LÀM TEST GREEN:
        if (await this._isEmailAlreadyUsed(email)) { 
            throw new Error('Email already in use'); // Phải ném chính xác thông báo này!
        }
        
        // Trả về người dùng nếu thành công
        return { id: 'new-id', name, email }; 
    }

    // Helper private method - giả lập việc kiểm tra DB/API bên ngoài
    static async _isEmailAlreadyUsed(email) {
        // Ở giai đoạn này ta chỉ cần giả định rằng nó hoạt động đúng để test pass.
        // Trong thực tế, đây sẽ là lời gọi database (e.g., SELECT count(*) FROM users WHERE email = ?)
        return false; // <-- Để bài test PASS ban đầu, ta phải trả về FALSE. 
    }
}

module.exports = UserService;
```

**Kiểm thử lại:** Chạy `jest`. Bài test sẽ **thành công (Green)**! Chúng ta đã đạt được mục tiêu tối thiểu để đáp ứng yêu cầu kiểm thử.

### Bước 4: Pha REFACTOR – Cải thiện và làm sạch code

Bây giờ, chúng ta biết rằng logic nghiệp vụ *phải* ném lỗi khi email trùng lặp. Đây là lúc chúng ta làm cho `_isEmailAlreadyUsed` trở nên thực tế hơn và đảm bảo kiến trúc sạch sẽ.

**Cập nhật TDD Logic:** Chúng ta phải làm cho test yêu cầu kiểm tra trường hợp **trùng lặp**.

1.  **Update Test (Red):**
    ```javascript
    it('SHOULD throw an error if the user email already exists', async () => {
        // Giả lập việc email 'john@example.com' đã tồn tại trong DB/service mock
        UserService._isEmailAlreadyUsed = jest.fn().mockResolvedValue(true); // Mock dependency
        await expect( UserService.createUser({ name: 'John Doe', email: 'john@example.com' }) )
            .rejects.toThrow('Email already in use'); 
    });

    it('SHOULD successfully create a user if the email is unique', async () => {
        UserService._isEmailAlreadyUsed = jest.fn().mockResolvedValue(false); // Mock dependency
        const user = await UserService.createUser({ name: 'Jane Doe', email: 'jane@example.com' });
        expect(user).toHaveProperty('id'); 
    });
    ```

2.  **Cập nhật Service (Green):** Logic vẫn giữ nguyên, nhưng chúng ta phải đảm bảo rằng `_isEmailAlreadyUsed` là một phương thức được Mocking hiệu quả.

3.  **Refactor:** Chúng ta nhận thấy việc gọi trực tiếp `$UserService._isEmailAlreadyUsed(email)` hơi cứng nhắc. Thay vào đó, chúng ta nên tách nó ra thành một *Repository Layer* (ví dụ: `UserRepository`) để mô phỏng và quản lý các tương tác với database tốt hơn.

*(Việc Refactor này không làm thay đổi logic nghiệp vụ nhưng cải thiện khả năng kiểm thử bằng cách tạo ra ranh giới rõ ràng giữa Service Logic và Data Access Logic.)*

## ✨ IV. Kết luận từ góc độ QE Lead: Lợi ích vượt trội của TDD

Tóm lại, việc áp dụng TDD khi phát triển Node.js REST API không chỉ là một phương pháp kiểm thử; đó là một *sự đầu tư vào thiết kế chất lượng*.

Khi bạn làm quen với chu trình này, bạn sẽ nhận ra những lợi ích sau:

*   **Giảm thiểu rủi ro Regression:** Khi code thay đổi, bạn chỉ cần chạy bộ test. Nếu tất cả đều Xanh, hệ thống của bạn được đảm bảo hoạt động như trước đó.
*   **Tài liệu sống (Living Documentation):** Bộ test của bạn chính là tài liệu mô tả hành vi API một cách chi tiết và có thể thực thi được. Mọi developer mới vào dự án chỉ cần xem bộ test để hiểu luồng chạy của service.
*   **Thiết kế tốt hơn:** Vì mỗi tính năng phải vượt qua bài kiểm thử trước khi được triển khai, bạn sẽ bị buộc phải viết các lớp code nhỏ, dễ cô lập và có ranh giới trách nhiệm (Single Responsibility Principle - SRP) rõ ràng.

Hãy bắt đầu từ một module nhỏ trong dự án Node.js tiếp theo của bạn. Hãy để những dòng `test()` đó dẫn dắt hành trình coding của bạn!

---
**Bạn nghĩ sao về TDD? Bạn đã áp dụng nó ở tầng nào nhất trong dự án của mình? Hãy chia sẻ kinh nghiệm tại phần bình luận bên dưới nhé!**