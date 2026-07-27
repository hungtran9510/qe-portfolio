---
title: "Áp dụng Test Driven Development (TDD) trong phát triển Node.js REST API"
date: 2026-05-06
description: "Khám phá cách áp dụng TDD hiệu quả khi xây dựng các REST API bằng Node.js, từ nguyên lý cơ bản đến ví dụ thực tế với Jest."
tags: ["TDD","Node.js","Clean Code"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# Áp dụng Test Driven Development (TDD) trong phát triển Node.js REST API

Chào các đồng nghiệp và những người yêu thích chất lượng phần mềm! Tôi là Duy Trung, một chuyên gia Kỹ thuật Đảm bảo Chất lượng Phần mềm.

Trong kỷ nguyên microservices và API-first architecture, việc xây dựng một hệ thống back-end ổn định, dễ mở rộng và đặc biệt là **đáng tin cậy** là thử thách lớn nhất của bất kỳ đội ngũ phát triển nào. Khi chúng ta nói về Node.js REST API, tốc độ thường được ưu tiên hơn tính bền vững về mặt kiến trúc.

Tuy nhiên, với vai trò QE Lead, tôi luôn nhấn mạnh rằng: **Tốc độ không nên đánh đổi bằng sự ổn định**.

Bài viết này sẽ đi sâu vào chủ đề "Test Driven Development (TDD)" – một phương pháp phát triển đã được chứng minh là chìa khóa để nâng cao chất lượng mã nguồn khi làm việc với các API back-end bằng Node.js. Tôi tin rằng, sau bài viết này, bạn sẽ không chỉ hiểu TDD mà còn tự tin áp dụng nó vào dự án của mình.

---

## 🚀 I. TDD là gì và Tại sao nó quan trọng với Node.js?

### 1. Định nghĩa Test Driven Development (TDD)
TDD không phải là việc viết *thêm* tests, mà là thay đổi *cách thức* chúng ta viết code. Quy trình cốt lõi của TDD tuân theo chu kỳ sau: **Red $\rightarrow$ Green $\rightarrow$ Refactor**.

1.  **RED (Viết Test Fail):** Viết một test case cho tính năng mong muốn, nhưng chủ đích là để nó *thất bại*. Điều này buộc bạn phải xác định rõ ràng ranh giới của chức năng đó và các trường hợp biên (edge cases).
2.  **GREEN (Viết Code Tối Thiểu):** Viết lượng code tối thiểu cần thiết để tất cả các test case vừa viết đều **pass**. *Không được thêm tính năng nào khác.* Mục tiêu duy nhất là làm cho màu xanh lá xuất hiện.
3.  **REFACTOR (Cải thiện Mã nguồn):** Sau khi mọi test đều pass, chúng ta mới xem xét lại code. Đây là lúc tối ưu hóa cấu trúc class, đổi tên biến, và loại bỏ sự dư thừa mà **không được phép thay đổi hành vi đã được kiểm thử**.

### 2. Tại sao TDD cực kỳ phù hợp với API?
Node.js REST API thường xử lý các nghiệp vụ (business logic) phức tạp, liên quan đến tương tác dữ liệu và luồng điều khiển (flow control).

Khi phát triển API mà thiếu đi TDD:
*   **Thường chỉ kiểm thử ở tầng Integration:** Chúng ta test toàn bộ request/response cycle. Nếu lỗi xảy ra, rất khó để xác định là do Service layer, Controller hay Validation layer.
*   **Tính tái sử dụng thấp:** Logic nghiệp vụ thường bị trộn lẫn với việc xử lý HTTP Request, làm giảm khả năng tái sử dụng của các hàm lõi.

Áp dụng TDD giúp bạn viết **Unit Test** ngay từ đầu, cô lập (isolate) từng đơn vị logic nghiệp vụ nhỏ nhất, đảm bảo rằng mỗi module hoạt động hoàn hảo trước khi được "kết nối" vào HTTP layer.

---

## 💡 II. Hướng dẫn thực hành: Áp dụng TDD với Module Services

Để minh họa, chúng ta sẽ xem xét một bài toán kinh điển: **Quản lý Người dùng (User)**. Chúng ta muốn tạo ra một API endpoint `/users` có thể tạo người dùng mới. Nhưng thay vì test toàn bộ Endpoint đó, chúng ta chỉ focus vào lớp logic nghiệp vụ là `UserService`.

**Giả định môi trường:**
*   Sử dụng Node.js/Express framework.
*   Sử dụng **Jest** làm framework testing (vì nó phổ biến và mạnh mẽ trong cộng đồng JavaScript).
*   Ta sẽ mô phỏng việc tương tác với database bằng một lớp `UserRepository` để đảm bảo tính cô lập unit test.

### Bước 1: Thiết lập cấu trúc file (Tạm thời bỏ qua Controller/Route)
Chúng ta chỉ tập trung vào service layer (`UserService`) và repository mock (`UserRepository`).

**`src/userRepository.js` (Mock Data Layer):**
```javascript
// Giả định đây là lớp kết nối Database thực tế
class UserRepository {
    constructor(dbConnection) {
        this.db = dbConnection; // Có thể truyền connection object vào
    }
    async findById(id) {
        // Logic truy vấn DB
        console.log("DB: Querying user by ID:", id); 
        if (id === '1') return { id: '1', email: 'test@example.com', name: 'Alice' };
        return null;
    }
    async save(user) {
        // Logic INSERT/UPDATE DB
        console.log("DB: Saving user:", user);
        return { ...user, id: Math.floor(Math.random() * 1000).toString() }; // Giả lập ID mới
    }
}

module.exports = UserRepository;
```

**`src/userService.js` (Business Logic Layer - Mục tiêu TDD):**
```javascript
const UserRepository = require('./userRepository');

class UserService {
    constructor(userRepository) {
        this.repo = userRepository;
    }

    async findUserById(userId) {
        return this.repo.findById(userId);
    }

    // Phương thức chúng ta sẽ áp dụng TDD
    async createUser(userData) {
        if (!userData || !userData.email || !userData.password) {
            throw new Error("Invalid user data: Email and password are required.");
        }

        // Business Logic: Đảm bảo mật khẩu phải dài ít nhất 8 ký tự
        if (userData.password.length < 8) {
             throw new Error("Password must be at least 8 characters long.");
        }

        const userToSave = {
            email: userData.email,
            name: userData.name || "Anonymous",
            // NOTE: Ở đây cần gọi hàm hashing password thực tế (ví dụ bcrypt)
            passwordHash: 'hashed_value' // Tạm bỏ qua hashing để đơn giản hóa ví dụ
        };

        return this.repo.save(userToSave);
    }
}

module.exports = UserService;
```

### Bước 2: Viết Test (RED Phase) - `__tests__/userService.test.js`

Chúng ta bắt đầu bằng việc viết test case cho phương thức `createUser`. Chúng ta phải dự đoán các trường hợp lỗi và thành công.

**`__tests__/userService.test.js`:**
```javascript
const UserService = require('../src/userService');
// Giả lập UserRepository để không cần kết nối DB thật khi test (Mocking)
const mockUserRepository = {
    findById: jest.fn(),
    save: jest.fn()
};

describe('UserService - TDD Implementation', () => {
    let userService;

    beforeEach(() => {
        // Thiết lập instance của Service trước mỗi test
        userService = new UserService(mockUserRepository);
        // Xóa các mock call cũ để đảm bảo tính cô lập giữa các tests
        jest.clearAllMocks(); 
    });

    // === RED: Test Case 1 - Trường hợp dữ liệu thiếu (Validation failure) ===
    test('should throw error if required fields are missing', async () => {
        const invalidData = { email: 'test@example.com' }; // Thiếu password
        await expect(userService.createUser(invalidData)).rejects.toThrow("Email and password are required.");
    });

    // === RED: Test Case 2 - Trường hợp nghiệp vụ lỗi (Business logic failure) ===
    test('should throw error if password is too short', async () => {
        const dataShortPassword = { email: 'a@b.com', name: 'Bob', password: '123' }; // Quá ngắn
        await expect(userService.createUser(dataShortPassword)).rejects.toThrow("Password must be at least 8 characters long.");
    });

    // === RED: Test Case 3 - Trường hợp thành công (Success case) ===
    test('should successfully create and return a new user object', async () => {
        const userData = { email: 'alice@example.com', name: 'Alice Smith', password: 'securepassword123' };

        // Thiết lập mock cho lần gọi repository save (giả lập hành vi DB)
        mockUserRepository.save.mockResolvedValue({ 
            email: 'alice@example.com', 
            name: 'Alice Smith', 
            passwordHash: 'hashed_value', 
            id: '1234' // Trả về ID giả định thành công
        });

        // Thực thi code và kiểm tra kết quả (Expectation)
        const result = await userService.createUser(userData);

        // Kiểm tra xem hàm save của repository đã được gọi với dữ liệu chính xác chưa
        expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
        // Kiểm tra nội dung truyền vào DB mock
        expect(mockUserRepository.save).toHaveBeenCalledWith({ 
            email: 'alice@example.com', 
            name: 'Alice Smith', 
            passwordHash: expect.any(String) // Chỉ kiểm tra kiểu dữ liệu chung để tránh hardcode giá trị hash
        });
        // Kiểm tra xem kết quả trả về có đúng cấu trúc không
        expect(result).toEqual(expect.objectContaining({ id: '1234', email: 'alice@example.com' })); 
    });

    // Thêm test case cho chức năng khác...
});
```

### Phân tích quá trình TDD (Trong thực tế):

*   **Bắt đầu:** Chúng ta viết Test Case 1, 2 và 3 (RED). Chắc chắn rằng chúng đều FAIL.
*   **Lần chạy code (GREEN):** Để làm cho các test này pass, bạn buộc phải bổ sung Validation logic vào `UserService` (kiểm tra độ dài password và kiểm tra null/empty data).
    *   *(Tác giả: Bạn sẽ viết minimal code để đạt được GREEN).*
*   **Lần Refactor:** Sau khi tất cả các test đã pass (GREEN), bạn xem xét lại lớp `UserService`. Có thể bạn thấy việc xử lý validation quá dài dòng và quyết định tách nó thành một hàm helper (`validateUserData`) – **Đây là cải tiến kiến trúc mà không làm thay đổi hành vi của code, do đó nó an toàn.**

---

## ✨ III. Tối ưu hóa bằng Cách nghĩ kiểu Test (Test-Minded Coding)

Việc viết test ban đầu rất quan trọng, nhưng vai trò của QE Lead là hướng dẫn các Developer suy nghĩ đúng cách khi coding ngay từ đầu. Đây gọi là **"Thinking like a tester."**

Khi bạn đang code một module, hãy tự hỏi mình những câu sau:

1.  **Edge Cases:** Điều gì xảy ra nếu input là `null`, hoặc chuỗi rỗng (`""`), hoặc số âm?
2.  **Concurrency/Race Conditions:** Nếu hai request cùng lúc gọi hàm này, liệu kết quả có bị lỗi không? (Đây là vấn đề lớn với Node.js).
3.  **Dependencies:** Logic này phụ thuộc vào đâu? (Database? External API?). **Hãy chắc chắn rằng các dependency này được *mock* hóa hoàn toàn trong Unit Test của bạn.**

Bằng cách tập trung vào việc làm cho unit test pass, chúng ta buộc bản thân phải:
1.  Xác định rõ Input/Output (`contract`) của hàm đó là gì.
2.  Đưa ra các cơ chế xử lý lỗi (error handling) một cách tường minh.

## 🔑 IV. Kết luận và Lời khuyên từ Duy Trung

TDD không chỉ là một quy trình; nó là một **tư duy thiết kế hệ thống**. Nó chuyển trọng tâm của lập trình viên từ việc "Làm cho code chạy được" sang việc "**Đảm bảo rằng code này phải hoạt động theo đúng đặc tả (specification)**".

**Lời khuyên cuối cùng của tôi:**
*   Hãy bắt đầu nhỏ. Đừng cố gắng áp dụng TDD cho toàn bộ dự án lớn ngay lập tức. Hãy chọn một module nghiệp vụ quan trọng và có tính toán phức tạp nhất để áp dụng quy trình Red $\rightarrow$ Green $\rightarrow$ Refactor.
*   Đầu tư thời gian vào việc viết test ban đầu sẽ giúp bạn tiết kiệm hàng trăm giờ debugging trong tương lai.

Chúc các anh chị em thành công với những ứng dụng API chất lượng cao! Nếu có thắc mắc nào về thiết kế kiến trúc hoặc testing, đừng ngần ngại trao đổi nhé.

***
*Duy Trung - QE Lead*