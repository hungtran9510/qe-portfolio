---
title: "Áp dụng Test Driven Development (TDD) trong phát triển Node.js REST API"
date: 2026-04-30
description: "Hướng dẫn chuyên sâu cách áp dụng vòng đời Red-Green-Refactor của TDD vào các endpoints Node.js, giúp xây dựng API mạnh mẽ và bảo trì cao."
tags: ["TDD","Node.js","REST API","Testing"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# Áp dụng Test Driven Development (TDD) trong phát triển Node.js REST API

Chào các đồng nghiệp và các nhà phát triển! Tôi là Duy Trung, một Quality Engineer chuyên sâu về việc xây dựng quy trình kiểm thử chất lượng cao.

Khi chúng ta nói đến việc phát triển các ứng dụng Backend hiện đại bằng Node.js với kiến trúc REST API, tốc độ luôn là yếu tố quan trọng. Tuy nhiên, tốc độ không được đánh đổi bằng sự ổn định hay khả năng bảo trì.

Vấn đề lớn nhất của nhiều đội ngũ Dev là: họ viết code *sau khi* biết tính năng cần gì, thay vì thiết kế code dựa trên các yêu cầu kiểm thử (Test). Chính tại đây, Test Driven Development (TDD) phát huy sức mạnh tối đa.

Bài viết này không chỉ là lý thuyết; tôi sẽ đi sâu vào quy trình thực tế, minh họa cách áp dụng TDD để xây dựng một Endpoint API hoàn chỉnh và chất lượng cao trong môi trường Node.js/Express.

***

## 🚀 I. TDD: Không chỉ là kiểm thử, đó là kiến trúc (Architecture by Design)

### 1. TDD là gì?
TDD là phương pháp phát triển phần mềm bằng cách tuân thủ một chu trình ba bước lặp đi lặp lại, nổi tiếng với tên gọi **Red-Green-Refactor**:

*   **🔴 Red (Viết test Fail):** Viết test case cho tính năng mong muốn. Vì chưa có code logic nào được viết, bài test này sẽ *thất bại*.
*   **🟢 Green (Viết minimum code):** Viết đủ và chỉ đủ lượng code tối thiểu cần thiết để khiến tất cả các bài test đã viết ở bước Red đều *pass* (xanh).
*   **♻️ Refactor (Tái cấu trúc):** Sau khi các bài test đã pass, chúng ta có thể tự do cải tiến cấu trúc code, làm cho nó sạch hơn, dễ đọc hơn mà vẫn đảm bảo rằng **tất cả các bài test vẫn pass**.

### 2. Tại sao TDD quan trọng với Node.js REST API?
Trong môi trường Node.js, chúng ta thường xuyên xử lý:
1.  **Code Asynchronous:** Xử lý I/O (Database calls, file system) khiến việc kiểm thử trở nên phức tạp hơn nhiều so với code đồng bộ truyền thống.
2.  **Dependency Injection:** API của bạn không nên phụ thuộc trực tiếp vào một Database cụ thể hay một service ngoài nào đó.

TDD buộc chúng ta phải luôn nghĩ về **"Hợp đồng" (Contract)** mà lớp/service của chúng ta phải cung cấp, và viết test để xác minh hợp đồng đó, từ đó giúp các thành phần được tách biệt (**Isolation**) và dễ dàng Mocking (giả lập) hơn nhiều.

***

## 🛠️ II. Bài Thực Hành: Triển khai Endpoint Tạo Người Dùng (`POST /users`)

Giả sử chúng ta cần xây dựng một API Endpoint để tạo người dùng mới. Chúng ta sẽ tuân thủ TDD, tập trung vào việc kiểm thử lớp Business Logic/Service Layer, chứ không chỉ là Controller (Controller thường xử lý HTTP Request và Response).

**Công cụ giả định:**
*   Node.js / Express.js
*   Jest (Framework testing phổ biến cho Node.js)
*   Mocking Libraries (Ví dụ: `jest.fn()`)

### Bước 0: Chuẩn bị mô hình Service (Service Layer)
Chúng ta sẽ tạo một lớp gọi là `UserService` chịu trách nhiệm toàn bộ logic nghiệp vụ, tách biệt nó khỏi HTTP Request/Response. Đây chính là nơi chúng ta tập trung các bài test TDD.

```javascript
// src/services/user.service.js (Chưa có code nào)
class UserService {
    constructor(UserRepository) {
        this.userRepository = UserRepository; // Phụ thuộc vào Repository
    }

    async createNewUser(userData) {
        // Logic sẽ được điền sau
        throw new Error("Not Implemented"); 
    }
}
module.exports = UserService;
```

### Bước 1: Red - Viết các Test Fail (Thiếu chức năng và xử lý lỗi)

Thay vì viết code, chúng ta bắt đầu bằng việc định nghĩa những gì test phải làm. Chúng ta cần đảm bảo:
1. Người dùng được tạo thành công nếu dữ liệu hợp lệ.
2. Hệ thống báo lỗi nếu email đã tồn tại.
3. Hệ thống báo lỗi nếu thiếu trường bắt buộc (ví dụ: `username`).

```javascript
// __tests__/user.service.test.js

const UserService = require('../services/user.service');
// Mocking Repository để kiểm soát việc tương tác DB
const mockUserRepository = {
    findByEmail: jest.fn(), 
    save: jest.fn()
};
// Khởi tạo Service với dependency đã được mock
const userService = new UserService(mockUserRepository);


describe('UserService - TDD Cycle', () => {
    
    // Test Case 1: Tạo thành công (Happy Path)
    test('should successfully create a user with valid data', async () => {
        // Thiết lập mock cho trường hợp DB không thấy email nào trùng
        mockUserRepository.findByEmail.mockResolvedValue(null);
        
        const userData = { username: 'john_doe', email: 'john@example.com', passwordHash: '...' };

        // Giả định hàm sẽ gọi save và trả về user object
        mockUserRepository.save.mockResolvedValue({ id: 1, ...userData });

        // Thực thi test (Lúc này nó chưa fail, nhưng ta giả sử logic bên trong đã bị thiếu)
        const result = await userService.createNewUser(userData);

        // Assertion (Xác nhận kết quả mong muốn)
        expect(result).toHaveProperty('id'); 
    });

    // Test Case 2: Xử lý lỗi trùng Email
    test('should throw an error if the email already exists', async () => {
        // Thiết lập mock cho trường hợp DB tìm thấy user với email này
        mockUserRepository.findByEmail.mockResolvedValue({ id: 99, email: 'existing@example.com' });

        const userData = { username: 'newuser', email: 'existing@example.com', passwordHash: '...' };
        
        // Assertion (Đảm bảo rằng việc gọi hàm sẽ ném ra lỗi cụ thể)
        await expect(userService.createNewUser(userData)).rejects.toThrow('Email already exists');
    });

    // Test Case 3: Xử lý dữ liệu không hợp lệ
    test('should throw a validation error if username is missing', async () => {
        const userData = { email: 'missing@user.com', passwordHash: '...' }; // Thiếu username
        await expect(userService.createNewUser(userData)).rejects.toThrow('Username is required');
    });
});
```

***

### Bước 2: Green - Viết Code tối thiểu để vượt qua Test

Chúng ta cần triển khai `UserService.js` sao cho nó đáp ứng được 3 hành vi trên test case.

**Tập trung vào logic:**
1. Kiểm tra đầu vào (validate).
2. Tra cứu DB theo email (Check existence).
3. Nếu OK, lưu và trả về user (Save).

```javascript
// src/services/user.service.js - Phiên bản đã hoàn thành sau bước Green
class UserService {
    constructor(UserRepository) {
        this.userRepository = UserRepository;
    }

    async createNewUser(userData) {
        const { username, email, passwordHash } = userData;

        // [Validation Logic] 👈 Đảm bảo Test Case 3 Pass
        if (!username || !email || !passwordHash) {
            throw new Error('Missing required field: Username or Email.');
        }

        // [Check Existing User Logic] 👈 Đảm bảo Test Case 2 Pass
        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            throw new Error('Email already exists');
        }

        // [Creation Logic] 👈 Đảm bảo Test Case 1 Pass
        const newUser = await this.userRepository.save({ username, email, passwordHash });
        return newUser;
    }
}
module.exports = UserService;
```

*Giải thích của Duy Trung:* Bạn thấy không? Chúng ta đã viết những đoạn code validation và logic kiểm tra sự tồn tại **chỉ vì** bài test yêu cầu nó. Nếu bạn chỉ nghĩ đến việc xây dựng API, có thể bạn bỏ qua bước validate này. Nhưng TDD buộc chúng ta phải quan tâm đến mọi kịch bản lỗi (Failure scenario) ngay từ đầu.

### Bước 3: Refactor - Cải thiện và Tăng cường Độ mạnh

Giờ đây, tất cả các test đã Pass (Green). Chúng ta có thể cải thiện code mà không sợ hỏng tính năng nào.

**Các điểm cần Refactor:**
1. **Error Handling:** Thay vì ném `Error` chung chung, nên định nghĩa một lớp ngoại lệ tùy chỉnh (`UserCreationError`) để Controller layer có thể bắt và xử lý theo HTTP Status Code chuẩn (e.g., 409 Conflict).
2. **Code Clarity:** Tách logic validation ra thành hàm riêng để tăng tính dễ đọc.

```javascript
// src/utils/validation.js - Hàm tách biệt Validation Logic
const validateUserPayload = ({ username, email, passwordHash }) => {
    if (!username) throw new Error('Username is required');
    if (!email || !isValidEmail(email)) throw new Error('Valid Email is required');
    // ... logic validate khác
};

// src/services/user.service.js - Phiên bản Refactored
class UserService {
    //... constructor giữ nguyên ...

    async createNewUser(userData) {
        try {
            // 1. Validate: Tách biệt trách nhiệm
            validateUserPayload(userData);

            // 2. Check Existence
            const existingUser = await this.userRepository.findByEmail(userData.email);
            if (existingUser) {
                throw new UserCreationError('Email already exists', 409); // Sử dụng Custom Error
            }

            // 3. Save
            const newUser = await this.userRepository.save(userData);
            return newUser;

        } catch (error) {
            // Xử lý các lỗi validate hoặc DB và re-throw theo định dạng chuẩn
            if (error instanceof UserCreationError) {
                throw error; // Ném lỗi custom đã có status code
            }
            throw new SystemError('Failed to process user', 500, error.message);
        }
    }
}
```

*Lợi ích đạt được:* Mã nguồn sạch hơn, dễ kiểm thử hơn (bạn chỉ cần test `validateUserPayload` độc lập), và khả năng xử lý lỗi của hệ thống đã nâng cấp từ mức cơ bản lên kiến trúc chuyên nghiệp.

***

## 🌟 III. Lời Khuyên Chuyên Gia Từ QE Lead Duy Trung

TDD là một kỹ thuật tuyệt vời, nhưng nó không phải là viên đạn bạc. Để áp dụng TDD thành công trong quy mô lớn của Node.js API, các bạn cần lưu ý:

### 1. Phân tách Test Layers (The Test Pyramid)
*   **Unit Tests (Base):** Mức thấp nhất, kiểm tra lớp Service/Utility (như cách chúng ta đã làm ở trên). Đây là nơi TDD tỏa sáng nhất. **Luôn viết unit tests cho business logic.**
*   **Integration Tests (Middle):** Kiểm tra sự tương tác giữa các thành phần lớn (ví dụ: Controller $\rightarrow$ Service $\rightarrow$ Repository, hoặc kết nối với DB thật/mocked DB Connector).
*   **End-to-End (Top):** Mô phỏng hành vi người dùng cuối qua toàn bộ stack. Hãy giới hạn việc này vì chúng rất chậm và khó bảo trì.

### 2. Mastering Mocking and Stubbing
Trong Node.js, bạn sẽ phải đối mặt với các lời gọi I/O bất đồng bộ (`await someDatabaseCall()`). Tuyệt đối không được để Unit Test của bạn phụ thuộc vào một Database thật! Hãy học cách sử dụng `jest.fn()` (hoặc thư viện mocking chuyên biệt) để mô phỏng hoàn hảo hành vi của Repository Layer.

### 3. TDD cho Performance
Khi API đã ổn định, hãy xem xét việc thêm **Performance Tests** vào bộ test tự động của mình. Ví dụ: Test độ trễ khi gọi một Endpoint quan trọng với load giả lập (Load Testing), nhưng nó vẫn phải nằm trong quy trình CI/CD.

## 💡 Kết Luận

TDD không chỉ là viết nhiều test, mà là việc **nghĩ về lỗi** trước khi code. Nó buộc chúng ta phải có tư duy của một người dùng cuối và cả một vị QE chuyên nghiệp ngay từ những dòng đầu tiên.

Bằng cách làm chủ quy trình Red-Green-Refactor này, bạn sẽ không chỉ xây dựng được các REST API Node.js không chỉ *hoạt động*, mà còn **đáng tin cậy**, **dễ bảo trì** và **khả năng mở rộng cao**.

Chúc các bạn luôn code sạch và xây dựng những sản phẩm chất lượng nhất!
*Duy Trung - QE Lead.*