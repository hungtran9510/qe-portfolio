---
title: "Áp dụng Test Driven Development (TDD) trong phát triển Node.js REST API"
date: 2026-04-29
description: "Khám phá cách áp dụng TDD một cách có hệ thống để xây dựng các REST API bằng Node.js vững chắc, đáng tin cậy và dễ bảo trì."
tags: ["TDD","Node.js","Clean Code"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# Áp dụng Test Driven Development (TDD) trong phát triển Node.js REST API

Chào các đồng nghiệp và các bạn đang theo đuổi hành trình chất lượng phần mềm! Tôi là Duy Trung, chuyên gia Kỹ thuật Đảm bảo Chất lượng Phần mềm (QE Lead).

Trong kỷ nguyên mà tốc độ phát triển là yếu tố cạnh tranh sống còn, việc xây dựng các Microservices hoặc REST API bằng Node.js trở nên vô cùng phổ biến. Tuy nhiên, sự nhanh chóng này thường đi kèm với rủi ro lớn về chất lượng và tính ổn định. Chúng ta có thể viết code hoạt động hôm nay, nhưng liệu nó có vững vàng khi đối mặt với yêu cầu thay đổi vào ngày mai?

Nếu bạn là một lập trình viên muốn nâng tầm chất lượng dự án Node.js của mình lên mức chuyên nghiệp Enterprise-grade, thì bài viết này chính là dành cho bạn. Chúng ta sẽ cùng nhau đi sâu vào cách áp dụng **Test Driven Development (TDD)**—một triết lý phát triển phần mềm mạnh mẽ—trên nền tảng Node.js để xây dựng các API không chỉ hoạt động mà còn *chứng minh* được tính đúng đắn của chúng.

---

## 🔬 TDD là gì và tại sao nó quan trọng đối với REST APIs?

Trước khi đi vào thực hành, chúng ta cần hiểu rõ bản chất của TDD.

**TDD (Test Driven Development)** không chỉ là việc viết unit test; nó là một chu trình thiết kế phần mềm. Nguyên tắc vàng của nó được tóm gọn trong ba bước lặp đi lặp lại: **Red $\rightarrow$ Green $\rightarrow$ Refactor**.

1.  **RED:** Viết một bài test thất bại (vì tính năng chưa tồn tại).
2.  **GREEN:** Viết lượng code tối thiểu nhất để khiến bài test đó vượt qua (làm cho nó thành công).
3.  **REFACTOR:** Tái cấu trúc mã nguồn và bài test, làm sạch mọi thứ mà không làm hỏng chức năng đã có.

### Tại sao QE lại yêu thích TDD khi xây dựng API?

Đối với một REST API, chúng ta đang xây dựng các hợp đồng (contracts) giao tiếp giữa các dịch vụ khác nhau. Nếu hợp đồng này bị lỗi, toàn bộ hệ thống phụ thuộc vào nó sẽ gặp sự cố nghiêm trọng.

1.  **Bảo vệ tính toán (Safety Net):** Bộ test hoạt động như một lưới an toàn vững chắc. Khi bạn thay đổi logic xử lý `GET /users/:id`, các unit test sẽ ngay lập tức chỉ ra nếu thay đổi đó vô tình làm hỏng chức năng tìm kiếm của bạn.
2.  **Thiết kế tối giản (Design for Testability):** TDD buộc chúng ta phải nghĩ về cách *kiểm thử* một module ngay từ đầu, điều này tự động giúp code của chúng ta trở nên nhỏ gọn hơn, dễ cô lập hơn và tuân thủ nguyên tắc Single Responsibility Principle (SRP).
3.  **Minh bạch hóa yêu cầu:** Mỗi test case là một tài liệu bằng mã nguồn, mô tả chính xác API phải hành xử như thế nào trong mọi kịch bản thành công hay thất bại.

---

## 🛠️ Hướng dẫn thực hành: TDD với Node.js và Express

Để minh họa tính ứng dụng của TDD, chúng ta sẽ cùng nhau xây dựng một chức năng đơn giản nhưng thiết yếu của API: **Tạo (Create) một người dùng mới**.

Chúng ta giả định đã có cấu trúc project cơ bản với các dependencies như `express` và framework testing là `Jest`.

### Bước 1: Xác định Scope và Bài Test (RED Phase)

Thay vì bắt đầu bằng việc viết Controller/Service, chúng ta bắt đầu bằng cách nghĩ về "điều gì cần được kiểm tra?".

**Yêu cầu:** API phải cho phép tạo người dùng nếu dữ liệu nhập vào có `username` (chuỗi hợp lệ), `email` (định dạng email hợp lệ) và `password` (chuỗi tối thiểu 8 ký tự). Nếu bất kỳ trường nào thiếu hoặc sai định dạng, nó phải trả về mã trạng thái HTTP 400 Bad Request.

**Viết Test Case:**
Chúng ta tập trung vào việc test tầng Service logic, vì đó là nơi chứa các quy tắc nghiệp vụ cốt lõi nhất.

*(File: `src/user.service.test.js`)*

```javascript
// Chúng ta mock (giả lập) dependency như UserRepository
const user = require('../services/user.service'); 

describe('User Service - Test TDD Cycle', () => {

    // Bài test RED (Sẽ thất bại vì hàm chưa tồn tại)
    test('should successfully create a new user with valid credentials', async () => {
        const newUserPayload = { username: 'testuser', email: 'test@example.com', password: 'securepassword123' };

        // Chúng ta mong đợi một đối tượng người dùng được trả về với ID mới và mật khẩu đã được Hash (ví dụ)
        const createdUser = await user.create(newUserPayload); 

        expect(createdUser).toHaveProperty('id');
        expect(typeof createdUser.username).toBe('string');
    });

    // Test kịch bản lỗi (RED)
    test('should throw an error if the password is less than 8 characters', async () => {
        const invalidPayload = { username: 'short', email: 'a@b.com', password: '123' }; // Password < 8

        // Chúng ta mong đợi hàm `user.create` ném ra lỗi (throw an error)
        await expect(user.create(invalidPayload)).rejects.toThrow('Password must be at least 8 characters long.');
    });
});
```

Khi chạy test này, chắc chắn bạn sẽ thấy tất cả các bài test trên *FAILED* (hoặc chưa được định nghĩa nếu hàm `user.create` không có). Đây chính là khoảnh khắc **RED**! Chúng ta xác nhận rằng: "Đây chính xác những gì code của tôi cần phải làm."

### Bước 2: Viết Code Tối thiểu để Test Pass (GREEN Phase)

Bây giờ, nhiệm vụ của chúng ta là viết lớp Service `user.service.js` sao cho hai bài test trên đều vượt qua. Mục tiêu chỉ là *đạt được màu xanh*, không cần tối ưu hay làm đẹp code lúc này.

*(File: `src/services/user.service.js`)*

```javascript
// Giả sử chúng ta có một lớp UserService với các phương thức tĩnh hoặc instance method

class UserService {
    /**
     * Tạo người dùng mới. Hàm phải xử lý validate và throw error khi thất bại.
     */
    static async create(payload) {
        const { username, email, password } = payload;

        // 1. Validation logic (Lấy từ test case để đảm bảo đúng lỗi)
        if (!username || !email || !password) {
            throw new Error('Missing required field.');
        }
        if (typeof email !== 'string' || !email.includes('@')) {
            throw new Error('Invalid email format.');
        }
        if (typeof password !== 'string' || password.length < 8) {
             // Phải đảm bảo thông báo lỗi khớp chính xác với bài test!
            throw new Error('Password must be at least 8 characters long.'); 
        }

        // 2. Simulation of hashing and saving data (Chỉ là logic giả lập)
        const hashedPassword = Buffer.from(password).toString('base64'); // Thay bằng bcrypt thực tế
        const userId = Math.floor(Math.random() * 1000);

        // Giả sử gọi đến Repository để lưu trữ
        return { 
            id: userId, 
            username: username, 
            email: email, 
            passwordHash: hashedPassword // Mật khẩu đã được bảo vệ
        };
    }
}

module.exports = UserService;
```

Sau khi triển khai code tối thiểu này, chúng ta chạy lại các bài test. **Mọi thứ phải chuyển sang màu xanh!** Chúng ta đã đạt đến giai đoạn **GREEN**. Quan trọng là: *Chỉ thêm đủ logic cần thiết để pass test.*

### Bước 3: Tái cấu trúc (REFACTOR Phase)

Code hiện tại hoạt động, nhưng nó có vẻ hơi lộn xộn và chưa tối ưu. Đây là lúc chúng ta trở lại vai trò của một QE Lead chuyên nghiệp. Mục tiêu của Refactoring là làm cho code *tốt hơn* mà không thay đổi hành vi kiểm thử (không được phá vỡ màu xanh).

Trong trường hợp này, UserService đang chứa cả logic validation và business logic. Chúng ta nên tách nó ra thành một Validator riêng biệt để tuân thủ SRP.

**1. Tách Validation Logic:**
Tạo file `user.validator.js`.

```javascript
// src/validators/user.validator.js
const validateUserCreation = (payload) => {
    const { username, email, password } = payload;
    const errors = [];

    if (!username || typeof username !== 'string') {
        errors.push('Username is required.');
    }
    if (!email || !email.includes('@')) {
        // Chúng ta chỉ cần validate form error ở đây, không nhất thiết phải throw ngay nếu logic kiểm tra nhiều trường khác.
        errors.push('Email format is invalid.'); 
    }
    if (typeof password !== 'string' || password.length < 8) {
        errors.push('Password must be at least 8 characters long.'); 
    }

    return errors; // Trả về mảng lỗi thay vì throw ngay lập tức
};

module.exports = validateUserCreation;
```

**2. Cập nhật UserService:**
Chúng ta tái cấu trúc `UserService` để sử dụng Validator, làm cho nó sạch sẽ và dễ bảo trì hơn.

*(File: `src/services/user.service.js` - Phiên bản Refactored)*

```javascript
const validateUserCreation = require('../validators/user.validator'); 
// Giả định có một hàm hashing mạnh mẽ
// const hashPassword = (password) => bcrypt.hashSync(password, 10); 

class UserService {
    static async create(payload) {
        // BƯỚC REFACTOR: Sử dụng Validator để kiểm tra lỗi ngay từ đầu.
        const validationErrors = validateUserCreation(payload);

        if (validationErrors.length > 0) {
            // Thay vì throw một Error chung, chúng ta throw một loại Custom Error chuyên biệt cho Validation
            const errorDetail = 'Validation Failed: ' + validationErrors.join(', ');
            throw new CustomValidationError(errorDetail);
        }

        // Business logic cốt lõi (Giữ nguyên)
        const { username, email, password } = payload;
        const hashedPassword = Buffer.from(password).toString('base64'); 

        // Giả lập Repository save
        return { id: Date.now(), username, email, passwordHash: hashedPassword };
    }
}

class CustomValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "CustomValidationError";
    }
}

module.exports = UserService;
```

### Kết nối với Controller (API Layer)

Cuối cùng, khi các tầng dưới đã vững chắc nhờ TDD, việc xây dựng API Gateway (Controller/Router) trở nên vô cùng dễ dàng và an toàn. Chúng ta không cần phải nghĩ lại về logic nghiệp vụ nữa; chúng ta chỉ cần bọc nó trong cấu trúc HTTP request/response của Express.

*(File: `src/controllers/user.controller.js`)*

```javascript
const UserService = require('../services/user.service');

exports.createUser = async (req, res) => {
    try {
        // Trích xuất dữ liệu từ body request
        const userData = req.body; 
        
        // Gọi Service Layer - Chỉ cần biết API này gọi hàm nào, còn logic phức tạp đã được test ở tầng service rồi!
        const user = await UserService.create(userData);

        // Thành công: Trả về HTTP 201 Created
        res.status(201).json({ 
            message: "User created successfully", 
            data: user 
        });
    } catch (error) {
        // Xử lý lỗi validation cụ thể từ tầng Service
        if (error.name === 'CustomValidationError') {
             return res.status(400).json({ message: error.message }); // Bad Request
        }
        // Xử lý các lỗi server khác
        console.error("Server Error:", error);
        res.status(500).json({ message: "Internal Server Error." }); 
    }
};
```

---

## ✨ Tóm kết và Lời khuyên từ QE Lead Duy Trung

Áp dụng TDD không chỉ là một quy trình kiểm thử; đó là một **tư duy thiết kế (Design Mindset)**. Khi bạn viết test trước, bạn buộc phải:

1.  **Xác định rõ ràng các ranh giới:** Điều kiện đầu vào là gì? Output mong đợi thế nào?
2.  **Tách biệt trách nhiệm:** Logic nghiệp vụ (Service) phải độc lập và không phụ thuộc vào HTTP context hay DB connection trực tiếp.
3.  **Dự đoán thất bại:** Hãy nghĩ về các trường hợp ngoại lệ (edge cases), input rỗng, hoặc định dạng sai ngay từ đầu.

### Lời khuyên cuối cùng: Bắt đầu nhỏ!

Đừng cố gắng viết test cho toàn bộ API lớn của bạn trong một sớm một chiều. Hãy chọn một chức năng cốt lõi, quan trọng nhất (ví dụ: Authentication, Tạo Người dùng) và áp dụng quy trình Red $\rightarrow$ Green $\rightarrow$ Refactor vào nó trước. Khi những module nhỏ đã vững vàng, sự tin tưởng vào chất lượng code sẽ lan tỏa, giúp cả đội nhóm phát triển nhanh hơn và an toàn hơn rất nhiều.

Chúc các bạn thành công trong việc nâng cao tiêu chuẩn chất lượng phần mềm của mình! Nếu có bất kỳ câu hỏi nào về thiết kế kiểm thử API hay patterns Clean Code, đừng ngần ngại để lại bình luận nhé.

**Trân trọng,**
**Duy Trung.**