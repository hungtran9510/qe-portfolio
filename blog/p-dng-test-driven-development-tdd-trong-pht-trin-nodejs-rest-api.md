---
title: "Áp dụng Test Driven Development (TDD) trong phát triển Node.js REST API"
date: 2026-05-02
description: "Học cách biến TDD thành quy trình chuẩn mực, giúp xây dựng các REST API bằng Node.js vững chắc, dễ bảo trì và tối ưu hóa chất lượng mã nguồn."
tags: ["TDD","Node.js","Clean Code","API Testing"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# Áp dụng Test Driven Development (TDD) trong phát triển Node.js REST API

Xin chào cộng đồng kỹ thuật! Tôi là Duy Trung, và với vai trò là một Quality Engineer chuyên sâu về các hệ thống backend hiện đại, tôi nhận thấy rằng việc xây dựng một REST API không chỉ đơn thuần là viết code chạy được. Sự khác biệt giữa một sản phẩm "chạy được" và một sản phẩm "đáng tin cậy" nằm ở quy trình kiểm thử (testing process) của chúng ta.

Trong thế giới phát triển Node.js tốc độ cao, các lỗ hổng logic, race conditions, và những thay đổi vô tình sau này là mối đe dọa lớn nhất đến chất lượng hệ thống. Và để phòng ngừa điều đó, **Test Driven Development (TDD)** không chỉ là một phương pháp mà phải là một triết lý làm việc.

Bài viết này sẽ đi sâu vào cách tôi, với tư cách là một QE Lead, áp dụng TDD một cách bài bản và hiệu quả nhất khi phát triển các API backend bằng Node.js.

---

## 📘 Phần I: TDD Là Gì? Tại Sao Phải Quan Tâm Đến Nó Trong NodeJS?

### 1. Khái Niệm Cơ Bản về TDD

Test Driven Development là một phương pháp luận phần mềm, trong đó chúng ta viết các bài kiểm thử (tests) **trước khi** viết mã triển khai tính năng đó. Quá trình này thường được tóm gọn trong chu kỳ ba bước huyền thoại:

1.  **RED (Fail):** Viết test case cho chức năng bạn muốn; lúc này, code chưa tồn tại hoặc đang không đúng logic, nên test *chắc chắn* sẽ thất bại.
2.  **GREEN (Pass):** Viết đủ lượng mã tối thiểu cần thiết để vượt qua test case vừa viết. Mục tiêu là làm cho test *pass*, không phải làm cho nó hoàn hảo.
3.  **REFACTOR:** Sau khi các test đều pass, chúng ta mới bắt đầu việc dọn dẹp code (Refactor) – giảm dư thừa, cải thiện cấu trúc mà không thay đổi hành vi đã được kiểm chứng.

### 2. Lợi Ích Vượt Trội Khi Áp Dụng TDD cho Backend API

Đối với Node.js REST API, TDD mang lại những giá trị chất lượng sau:

*   **Độ Tin Cậy Cao (Confidence):** Mỗi feature mới đi kèm với một bộ test unit, đảm bảo rằng khi bạn thay đổi Service A để fix lỗi, nó sẽ không vô tình làm hỏng chức năng của Service B.
*   **Thiết Kế Tốt hơn (Design by Contract):** Vì bạn phải nghĩ cách viết *test case* trước, bạn buộc phải xác định rõ ràng các ranh giới giao diện (interface boundaries), giúp code của bạn tự động trở nên module hóa và dễ kiểm thử hơn (Testable).
*   **Giảm Thời Gian Debug:** Khi có bug xảy ra trong production, việc dựa vào bộ test đã viết sẵn sẽ giúp chúng ta cô lập lỗi nhanh chóng về đúng lớp (layer) nào.

---

## 🚀 Phần II: Thiết Lập Thực Hành TDD trong Node.js

Khi phát triển API, một bài toán thường gặp là làm sao để tách biệt logic nghiệp vụ khỏi cơ chế HTTP request/response của Express. **Đây là điểm mấu chốt.**

Thay vì test cả endpoint (`app.get('/users', ...)`) (kiểu Integration Test), chúng ta nên tập trung viết Unit Test cho lớp *Business Logic* hoặc *Service Layer*.

### 💡 Công Cụ Khuyến Nghị: Jest

Tôi khuyến nghị sử dụng **Jest** làm framework kiểm thử chính, vì nó hỗ trợ tốt tính năng mocking và có cú pháp hiện đại, dễ đọc.

```bash
# Cài đặt Jest
npm install --save-dev jest @types/jest ts-jest typescript
```

### 🧱 Kiến Trúc Mô Hình Hóa (The Layered Approach)

Trong một dự án chuẩn mực, ta nên tách biệt các lớp:

1.  **Router:** Xử lý HTTP request và gọi Service.
2.  **Controller:** Xử lý Input Validation cơ bản và truyền dữ liệu tới Service.
3.  **Service/Business Logic:** Chứa toàn bộ logic nghiệp vụ (Đây là nơi chúng ta sẽ tập trung viết Unit Test).
4.  **Repository/Model:** Tương tác với Database (cần Mocking).

---

## 🔨 Phần III: Case Study Thực Tế - Quản Lý Người Dùng (User Management)

Giả sử chúng ta cần xây dựng chức năng tạo người dùng mới (`createUser`). Tôi sẽ minh họa quy trình Red-Green-Refactor.

### 1. Kịch Bản Yêu Cầu và Thiết Lập Mocking

**Yêu cầu:** Khi tạo user, API phải kiểm tra email đã tồn tại chưa. Nếu có, nó phải báo lỗi `EmailAlreadyExistsError`.

Để unit test lớp Service này mà không cần kết nối thật với DB (nhằm đảm bảo tính cô lập - Isolation), chúng ta sẽ sử dụng **Mocking**. Chúng ta chỉ giả lập (mock) các phương thức của lớp Repository.

### 2. Bước RED: Viết Test Case (Khi Chưa Có Code)

Chúng ta viết test case khẳng định rằng nếu email tồn tại, hàm `createUser` phải ném ra một exception cụ thể.

**File:** `src/user/userService.test.js`

```javascript
// UserApiService là lớp Service chúng ta đang kiểm thử.
import { UserService } from '../service/UserService';
import UserModel from '../repository/UserModel'; 

describe('UserService - Create User Logic', () => {
    // Thiết lập mock cho các dependencies (lớp Repository)
    const mockUserRepository = {
        findByEmail: jest.fn(), // Chúng ta sẽ giả lập phương thức này
        create: jest.fn(user => user), 
    };

    let userService;
    beforeAll(() => {
        // Thay thế UserModel thật bằng mô hình mock của chúng ta
        UserService.__setMockRepo__(mockUserRepository); 
        userService = new UserService(); // Khởi tạo Service với dependency đã được mock
    });


    test('SHOULD throw EmailAlreadyExistsError nếu email đã tồn tại', async () => {
        // === RED: Chúng ta khẳng định rằng nó phải ném lỗi khi findByEmail trả về dữ liệu
        await expect(userService.createUser({ name: 'A', email: 'existing@test.com' }))
               .rejects.toThrow('EmailAlreadyExistsError'); 
    });

    // ... (Các test case thành công khác sẽ được viết ở đây)
});
```

**Giải thích từ Duy Trung (QE Lead):**
*   Bạn thấy chưa? Tôi đã viết một *kiến trúc kiểm thử* hoàn chỉnh trước. Test này đang khẳng định về **hành vi mong muốn** của hệ thống: "Nếu DB nói email tồn tại, Service PHẢI ném ra lỗi A."
*   Tại thời điểm này (trước khi code logic), test chắc chắn sẽ bị *FAIL* vì chúng ta chưa viết bất kỳ logic nào để xử lý việc tìm thấy email.

### 3. Bước GREEN: Viết Code Tối Thiểu Để Test Pass

Bây giờ, tôi phải viết class `UserService` và lớp Repository giả lập (mock) đủ để làm cho test ở trên chuyển thành xanh lá cây.

**File:** `src/service/UserService.js`

```javascript
// Giả sử đã mock các thư viện DB...
class UserService {
    constructor() {
        this.userModel = UserModel; // Lớp Repository được inject vào
    }

    async createUser({ name, email }) {
        // 1. Kiểm tra logic nghiệp vụ (Bước tối thiểu cần thiết)
        const existingUser = await this.userModel.findByEmail(email);

        if (existingUser) {
            throw new Error('EmailAlreadyExistsError'); // Hoàn thành yêu cầu của test RED
        }

        // 2. Thực hiện tạo user
        return this.userModel.create({ name, email }); 
    }
}

export { UserService };
```

**Giải thích từ Duy Trung (QE Lead):**
*   Tôi chỉ thêm *đủ* logic để pass test. Tôi chưa nghĩ đến việc xử lý case mật khẩu yếu hay giới hạn ký tự ở đây. Mục tiêu của bước GREEN là làm cho **tất cả các tests hiện tại PASS**.
*   Điều quan trọng: Lúc này, lớp `UserService` đã được định nghĩa ranh giới giao diện rõ ràng (interface). Nó chỉ biết nó cần gọi `findByEmail`, chứ không bận tâm việc hàm đó hoạt động bằng cách nào.

### 4. Bước REFACTOR: Tinh Chỉnh và Nâng Cao Độ Bền Vững

Các test đã pass! Bây giờ, code của chúng ta có thể được tối ưu hóa mà không sợ hỏng bất cứ thứ gì.

Tôi nhận thấy rằng việc ném `Error` với chuỗi `'EmailAlreadyExistsError'` là chưa đủ mạnh mẽ về mặt kỹ thuật. Tôi quyết định tạo một lớp Error tùy chỉnh (Custom Error Class) để quản lý các loại lỗi nghiệp vụ tốt hơn.

**Code Refactoring:**

1.  **Tạo Custom Error:**
    ```javascript
    class EmailAlreadyExistsError extends Error {
        constructor(message = "Email đã tồn tại.") {
            super(message);
            this.name = "EmailAlreadyExistsError"; // Cực kỳ quan trọng để bắt lỗi chính xác
        }
    }
    // ...
    ```
2.  **Cập nhật Service:**
    ```javascript
    async createUser({ name, email }) {
        const existingUser = await this.userModel.findByEmail(email);

        if (existingUser) {
            // Thay thế Error chung bằng Custom Error Class mạnh mẽ hơn
            throw new EmailAlreadyExistsError(); 
        }
        return this.userModel.create({ name, email }); 
    }
    ```
3.  **Cập nhật Test:**
    ```javascript
    test('SHOULD throw EmailAlreadyExistsError nếu email đã tồn tại', async () => {
        // Thay đổi cách kiểm tra lỗi để khớp với Custom Error Class
        await expect(userService.createUser({ name: 'A', email: 'existing@test.com' }))
               .rejects.toThrow(EmailAlreadyExistsError); 
    });
    ```

**Giải thích từ Duy Trung (QE Lead):**
*   Đây là bước quan trọng nhất! Nhờ có bộ test ban đầu, tôi đã tự tin thay đổi cơ chế xử lý lỗi thành một lớp Error chuyên biệt hơn mà không phải lo lắng việc thay đổi này làm hỏng logic nào khác. **TDD cung cấp "bảo hiểm chất lượng" cho quá trình Refactoring.**

---

## 🎯 Tổng Kết và Lời Khuyên Từ QE Lead

Áp dụng TDD khi phát triển Node.js REST API là một hành trình đòi hỏi sự thay đổi tư duy: bạn phải nghĩ về **cách kiểm tra** trước khi nghĩ về **cách viết**.

### 💡 Những Điều Cần Nhớ Khi Trở Thành Người Dùng TDD:

1.  **Không Chỉ Test Happy Path:** Đừng chỉ test luồng thành công. Hãy tập trung vào việc tạo ra các test cho:
    *   Validation (Input validation).
    *   Edge cases (Giá trị null, rỗng, giá trị max/min).
    *   Error paths (Lỗi DB, lỗi API bên ngoài).
2.  **Tách Lớp Rõ Ràng:** Luôn ưu tiên Unit Test cho Business Logic (Service Layer) thay vì kết hợp cả việc kiểm tra HTTP và logic.
3.  **Hiểu về Mocking/Stubbing:** Nắm vững cách sử dụng các công cụ mock để loại bỏ sự phụ thuộc vào database, API bên ngoài—điều này giúp test của bạn chạy cực nhanh và nhất quán.

TDD không phải là một tính năng được tích hợp sẵn; nó là **một thói quen kỹ thuật** mà chúng ta cần rèn luyện hàng ngày. Bằng cách biến việc viết test thành phần cốt lõi, các API Node.js của bạn sẽ trở nên mạnh mẽ, linh hoạt và đáng tin cậy hơn bao giờ hết.

Chúc các bạn áp dụng thành công phương pháp này! Nếu có bất kỳ thắc mắc nào về CI/CD integration testing hoặc nâng cao mocking technique, đừng ngần ngại để lại bình luận nhé!