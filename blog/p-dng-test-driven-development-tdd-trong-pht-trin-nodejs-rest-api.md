---
title: "Áp dụng Test Driven Development (TDD) trong phát triển Node.js REST API"
date: 2026-05-05
description: "Hướng dẫn chuyên sâu cách áp dụng chu trình TDD (Red-Green-Refactor) để xây dựng các Node.js REST API ổn định, dễ bảo trì và chất lượng cao."
tags: ["TDD","Node.js","Clean Code"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# Áp dụng Test Driven Development (TDD) trong phát triển Node.js REST API

Chào các đồng nghiệp và những ai đang trên hành trình xây dựng hệ thống phần mềm chất lượng! Tôi là Duy Trung, một Quality Engineer chuyên về tối ưu hóa quy trình kiểm thử tự động.

Trong thế giới của phát triển backend hiện đại, nơi mà tốc độ và tính ổn định là hai yếu tố không thể tách rời, việc viết code chỉ dựa trên kinh nghiệm là một rủi ro cực lớn. Đặc biệt với Node.js – một nền tảng asynchronous mạnh mẽ nhưng cũng phức tạp trong quản lý luồng dữ liệu.

Bài viết này không chỉ dừng lại ở việc *giới thiệu* Test Driven Development (TDD), mà tôi sẽ dẫn dắt bạn đi qua quy trình ứng dụng nó một cách thực tế nhất khi phát triển các REST API bằng Node.js. Nếu làm đúng, TDD sẽ giúp bạn biến những bản API vốn lỏng lẻo thành những cỗ máy hoạt động tin cậy đến từng miligiây.

## 🚀 I. TDD là gì và Tại sao cần nó cho REST API?

### Định nghĩa lại TDD
TDD không phải là một framework hay một công cụ; nó là một **phương pháp luận (methodology)**, được gói gọn trong chu trình ba bước huyền thoại:

1.  **🔴 Red (FAIL):** Viết test case *trước*, và đảm bảo rằng test này đang thất bại vì chưa có code nào hỗ trợ nó.
2.  **🟢 Green (PASS):** Viết lượng mã tối thiểu cần thiết để các tests vừa viết được **vượt qua**.
3.  **🟡 Refactor (CLEAN):** Cải thiện cấu trúc code, làm cho nó sạch hơn, dễ đọc hơn và hiệu quả hơn – *mà không thay đổi hành vi* đã được kiểm thử.

### Tại sao TDD là cứu cánh của Node.js Backend?
Khi phát triển API, chúng ta thường phải đối mặt với các vấn đề sau:

1.  **Asynchronous Complexity:** Code Node.js rất nhiều logic liên quan đến Promises và `async/await`. Nếu không có test case cụ thể cho từng luồng xử lý (ví dụ: gọi Database $\rightarrow$ Gọi Microservice $A \rightarrow$ Tính toán kết quả), việc tìm ra bug race condition là ác mộng.
2.  **Edge Cases:** Các API hay bị lỗi ở các trường hợp biên (ví dụ: input rỗng, giá trị âm, dữ liệu vượt quá giới hạn). TDD buộc bạn phải nghĩ đến những trường hợp "xấu" này ngay từ đầu.
3.  **Maintainability:** Khi team phát triển nhanh, code thường trở nên lộn xộn. Các bài test TDD hoạt động như một bộ *tài liệu hành vi sống* (Living Documentation), giúp mọi lập trình viên mới tham gia vào project cũng hiểu được API cần làm gì ở từng điểm.

## 🛠️ II. Hướng dẫn Thực Hành: Áp dụng TDD trong Node.js

Để minh họa, chúng ta sẽ xây dựng một module đơn giản xử lý việc tạo và lấy thông tin người dùng (`UserService`), tập trung vào logic nghiệp vụ (Business Logic) chứ không phải tầng HTTP Router hay Middleware.

**Giả định Setup:**
*   Chúng ta đang sử dụng **Jest** làm framework testing (rất phổ biến trong cộng đồng Node.js).
*   Code của chúng ta sẽ nằm trong `src/services/user.service.js`.
*   Tests sẽ nằm trong `__tests__/user.service.test.js`.

### 🔴 Bước 1: Red - Viết Test Case Thất bại (Thiếu code)

Chúng ta bắt đầu bằng việc định nghĩa hành vi mà UserService phải có: nó phải chấp nhận một object User và trả về đúng cấu trúc, đồng thời xử lý trường hợp user ID tồn tại.

**File:** `__tests__/user.service.test.js`

```javascript
// Đây là đoạn code test ban đầu của Duy Trung
const userService = require('../src/services/user.service');

describe('UserService - User Management', () => {

    // Test Case 1: Tạo user thành công (Expect successful creation)
    it('should successfully create a new user and return the unique ID', async () => {
        // Giả lập DB call, nhưng ta viết test trước!
        const userData = { name: 'Alice', email: 'alice@example.com' };
        const result = await userService.createUser(userData); 

        expect(result).toBeDefined();
        expect(typeof result.id).toBe('string'); // Xác nhận rằng ID được trả về là chuỗi
    });

    // Test Case 2: Thất bại khi email đã tồn tại (Handling unique constraint)
    it('should throw an error if the email is already in use', async () => {
        const userData = { name: 'Bob', email: 'bob@example.com' };
        
        // Jest cú pháp để kiểm tra exception/error
        await expect(userService.createUser(userData)).rejects.toThrow('Email conflict'); 
    });

    // Test Case 3: Kiểm tra trường hợp input không hợp lệ (Validation)
    it('should throw an error if the name is missing', async () => {
        const invalidData = { email: 'invalid@example.com' }; // Thiếu name
        await expect(userService.createUser(invalidData)).rejects.toThrow('Name is required');
    });
});

// Chạy thử lúc này, kết quả là 🔴 FAIL! (Vì chưa có hàm userService.createUser nào được định nghĩa)
```

### 🟢 Bước 2: Green - Viết Code Tối thiểu để Vượt qua Test

Bây giờ chúng ta quay sang viết code trong `src/services/user.service.js` chỉ để các test trên màu xanh lá. Chúng ta phải giải quyết cả ba vấn đề: tạo user, xử lý trùng email, và validation name.

**File:** `src/services/user.service.js`

```javascript
// Lưu ý: Đây là phiên bản tối thiểu nhất!
const usersDatabase = new Map(); // Giả lập DB in-memory

/**
 * Hàm này phải passing cả 3 test ở trên.
 */
const createUser = async (userData) => {
    // Bước A: Validation (Giải quyết Test Case 3)
    if (!userData.name || userData.name.trim() === '') {
        throw new Error('Name is required');
    }

    // Bước B: Kiểm tra ràng buộc duy nhất (Unique constraint - Giải quyết Test Case 2)
    const existingUser = [...usersDatabase.values()].find(u => u.email === userData.email);
    if (existingUser) {
        throw new Error('Email conflict');
    }

    // Bước C: Logic nghiệp vụ và trả kết quả (Giải quyết Test Case 1)
    const newUser = { id: `user-${Date.now()}`, ...userData };
    usersDatabase.set(newUser.id, newUser);

    return { id: newUser.id, message: 'User created successfully' };
};


module.exports = {
    createUser // Chỉ export hàm cần test
};
```
Sau khi commit code trên, bạn chạy lại Jest. Kết quả sẽ là 🟢 PASS! Tuyệt vời!

### 🟡 Bước 3: Refactor - Tối ưu hóa và Hoàn thiện Code (Bản Chất của QE)

Hiện tại, code đã qua được kiểm thử, nhưng nó *rất xấu* (Bad Code). Nếu chúng ta để thế này, khi team khác chạm vào sẽ rất khó hiểu. Nhiệm vụ của tôi với tư cách là QE Lead là làm cho code tốt hơn.

**Vấn đề cần Refactor:**
1.  Database simulation (`usersDatabase`) đang được khai báo ở phạm vi toàn cục, gây ra vấn đề trạng thái (Statefulness) giữa các lần test.
2.  Logic kiểm tra và tạo user bị trộn lẫn, không rõ ràng.

**Giải pháp Tối ưu (Refactored Code):**
Chúng ta sẽ tách lớp logic nghiệp vụ ra khỏi nơi lưu trữ giả lập để đảm bảo tính độc lập của unit test.

```javascript
// File: src/services/user.service.js - Bản Refactor Cuối cùng
const usersDatabase = new Map(); // Vẫn giữ, nhưng phải cách ly nó

/**
 * Lớp UserService giúp quản lý toàn bộ logic liên quan đến người dùng.
 */
class UserService {
    constructor(database) {
        this.db = database || usersDatabase; // Dependency Injection (DI) là Best Practice
    }

    async createUser({ name, email }) {
        // 1. Validation: Sử dụng class/utility riêng để xử lý validation logic
        if (!name || !email) {
            throw new Error('Name and Email are required');
        }
        
        // 2. Business Rule check (Unique constraint)
        const existingUser = [...this.db.values()].find(u => u.email === email);
        if (existingUser) {
            throw new DomainError('Email conflict', 'EMAIL_ALREADY_TAKEN'); // Sử dụng Domain Error thay vì Error chung
        }

        // 3. Creation logic
        const newUser = { id: `user-${Date.now()}`, name, email };
        this.db.set(newUser.id, newUser);

        return { id: newUser.id, message: 'User created successfully' };
    }
}

// Export một phiên bản instance đã được thiết lập sẵn để dễ sử dụng
module.exports = new UserService(); 


// ************ Giải thích của Duy Trung về Refactoring: **************
/* 
Tại sao tôi phải làm những thay đổi này?
1. Dependency Injection (DI): Thay vì chỉ dùng biến toàn cục, việc truyền `database` vào constructor là Best Practice. Điều này giúp khi chúng ta chạy unit test, ta có thể "giả lập" một database sạch sẽ cho mỗi lần test mà không sợ bị ảnh hưởng bởi state của các test trước đó.
2. Class Structure: Thay vì chỉ là hàm thuần túy, việc đóng gói logic vào Class `UserService` làm tăng tính module và giúp chúng ta dễ dàng thêm các phương thức khác (ví dụ: `getUserById(id)`) sau này mà không gây xung đột.
3. Xử lý lỗi chuyên biệt (`DomainError`): Thay vì dùng `throw new Error(...)`, tôi thay thế bằng một lớp Exception tùy chỉnh. Trong kiến trúc API thực tế, việc biết chính xác loại lỗi (Validation error, Auth error, Domain conflict) giúp tầng Controller/Middleware xử lý response HTTP code chuẩn hơn (ví dụ: 409 Conflict).
*/
```

## ✨ III. TDD Nâng Cao dành cho QE Lead: Những điểm cần lưu ý khi phát triển API thực tế

Khi bạn đã thuần thục chu trình Red-Green-Refactor, hãy nâng cấp tầm nhìn của mình lên hai khía cạnh sau:

### 1. Testing Dependencies (Mocking)
Trong một REST API thực tế, `UserService` sẽ không tự truy cập database hay gọi microservices bên ngoài. Nó phải *nhận* dependency đó như một tham số (Database Client, HTTP Client).

**Nguyên tắc Golden Rule:** Trong Unit Test, bạn **phải Mock** mọi thứ nằm ngoài phạm vi kiểm thử hiện tại của mình.

*   **Tình huống:** `userService.createUser(data)` cần gọi DBClient để save dữ liệu.
*   **Cách làm đúng (Test):** Thay vì để hàm này thực sự gọi DBClient, ta dùng `jest.fn()` để tạo một phiên bản giả lập (`mockDbClient`). Test sẽ khẳng định rằng: "Hàm `createUser` đã *cố gắng* gọi phương thức `saveUser` của mockDbClient với đúng dữ liệu đầu vào."
*   **Lợi ích:** Tăng tốc độ test lên đáng kể, và đảm bảo rằng lỗi không phải do kết nối mạng hay cấu hình DB.

### 2. Phân biệt Unit Test vs. Integration Test
Là một QE Lead, bạn cần biết khi nào nên dừng viết Unit Test và bắt đầu Integration Test.

| Loại Test | Mục tiêu Kiểm thử | Phạm vi Ảnh hưởng (Scope) | Công cụ Testing Phù hợp |
| :--- | :--- | :--- | :--- |
| **Unit Test** | Logic nghiệp vụ đơn lẻ, hàm thuần túy (Pure Function). | Chỉ một module/hàm. | Jest (`await` và `mock`) |
| **Integration Test** | Tương tác giữa nhiều thành phần: Service $\rightarrow$ Repository $\rightarrow$ DB Client. | Nhiều lớp kết nối với nhau. | Supertest + Kết nối DB thật (hoặc Dockerized test DB). |

TDD giúp bạn viết Unit Tests cực mạnh, và sau đó khi cần sự tin cậy tuyệt đối, các bài Integration Test sẽ xác nhận xem toàn bộ luồng dữ liệu có hoạt động trơn tru hay không.

## 📝 Lời kết từ Duy Trung

