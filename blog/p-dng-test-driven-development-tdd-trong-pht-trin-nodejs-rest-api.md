---
title: "Áp dụng Test Driven Development (TDD) trong phát triển Node.js REST API"
date: 2026-05-05
description: "Hướng dẫn chuyên sâu cách áp dụng TDD theo chu trình Red-Green-Refactor để xây dựng các REST API mạnh mẽ, dễ bảo trì bằng Node.js."
tags: ["TDD","Node.js","REST API","Testing"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# Áp dụng Test Driven Development (TDD) trong phát triển Node.js REST API

**(Bài viết của Duy Trung – QE Lead)**

Xin chào các anh chị và em, tôi là Duy Trung, chuyên gia Kỹ thuật Đảm bảo Chất lượng Phần mềm.

Trong vòng xoáy phát triển phần mềm hiện đại với tốc độ đổ bộ của các ứng dụng microservices và API Gateway, chất lượng mã nguồn không chỉ dừng lại ở việc chạy được (functional) mà còn phải đảm bảo tính bền vững, khả năng mở rộng, và quan trọng nhất là **khả năng kiểm thử (testability)**.

Hôm nay, tôi muốn chia sẻ một chủ đề cực kỳ cốt lõi nhưng đôi khi bị xem nhẹ: **Test Driven Development (TDD)**. Đặc biệt áp dụng TDD cho các dự án Node.js REST API. Đây không chỉ là việc viết thêm unit test; nó là một *thay đổi tư duy* trong quy trình phát triển, giúp chúng ta xây dựng những API sạch sẽ và cực kỳ an toàn trước mọi thay đổi.

---

## 💡 I. TDD Là Gì? Tại Sao Cần Nó Cho Node.js API?

### Định nghĩa lại TDD
TDD không phải là việc viết test sau khi code xong (Test Driven) mà là **viết Test trước, mới viết Code**. Quy trình này tuân theo chu kỳ ba bước lặp đi lặp lại:

1.  **RED (Fail):** Viết một bài kiểm thử tự động cho chức năng mong muốn (và nó *phải* thất bại vì code chưa tồn tại).
2.  **GREEN (Pass):** Viết lượng mã sản xuất tối thiểu cần thiết để khiến bài kiểm thử đó chuyển sang trạng thái thành công.
3.  **REFACTOR (Clean):** Tái cấu trúc code và test để làm cho nó sạch hơn, hiệu quả hơn mà vẫn đảm bảo rằng tất cả các bài test đều màu xanh lục.

### Lợi ích khi áp dụng TDD vào API Development
Đối với Node.js REST API – nơi chúng ta thường xuyên xử lý luồng nghiệp vụ phức tạp (business logic) và tương tác với nhiều dependency bên ngoài (DB, cache, microservices)—TDD mang lại những lợi ích vượt trội:

1.  **Bắt lỗi ngay từ đầu:** Chúng ta buộc phải suy nghĩ về *cách sử dụng* code trước khi viết nó, giúp lộ ra các lỗ hổng thiết kế và edge case mà chúng ta dễ bỏ qua.
2.  **Cấu trúc API sạch (Design Quality):** TDD khuyến khích việc chia nhỏ chức năng (Single Responsibility Principle - SRP), khiến lớp service logic của bạn cực kỳ thuần túy và có tính module cao.
3.  **Tài liệu sống:** Bộ test case tốt chính là tài liệu kỹ thuật chi tiết, chỉ ra các hành vi (behavior) mà API phải tuân thủ ở mọi thời điểm.

---

## 🛠️ II. Thực Hành TDD với Node.js & Express: Mô Hình Service Layer

Khi xây dựng REST API bằng Node.js/Express, theo góc độ của một QE Lead, tôi luôn khuyên bạn nên áp dụng kiến trúc nhiều lớp (Multi-layered Architecture). Chúng ta tách biệt rõ ràng: **Controller $\rightarrow$ Service $\rightarrow$ Repository (hoặc Data Access Object - DAO)**.

Việc này giúp chúng ta dễ dàng *mock* các dependency bên ngoài và chỉ tập trung kiểm thử logic thuần túy của tầng service mà không bị ảnh hưởng bởi HTTP request/response cycle.

### Kịch bản ví dụ: Lấy thông tin User theo ID
Chúng ta sẽ xây dựng chức năng lấy một người dùng theo ID. Yêu cầu nghiệp vụ: Nếu user tồn tại thì trả về; nếu không tồn tại, phải ném ra lỗi 404 Not Found với message rõ ràng.

#### Bước 1: Chuẩn bị môi trường (Setup)

Giả sử chúng ta đang dùng Jest làm framework testing và đã có cấu trúc dự án cơ bản. Chúng ta tập trung vào việc kiểm thử lớp service `UserService`.

*   `src/services/user.service.js`: Lớp chứa logic nghiệp vụ.
*   `test/unit/user.service.test.js`: File test case của chúng ta.

#### Bước 2: 🔴 Red - Viết Test và Thấy Nó Thất Bại (The Failure)

Chúng ta viết bài kiểm thử cho trường hợp user không tồn tại (Edge Case). Lúc này, `UserService` chưa được định nghĩa đầy đủ, nên code sẽ thất bại.

**File:** `test/unit/user.service.test.js`
```javascript
// Giả định chúng ta đã mock tầng database client
const userService = require('../../src/services/user.service');
const dbClientMock = require('db-mock'); 

describe('UserService: Get User By ID', () => {
    
    it('should throw a specific error if the user ID does not exist (404)', async () => {
        // Arrange: Thiết lập mock database để trả về null/undefined khi tìm kiếm
        dbClientMock.findUserById.mockResolvedValue(null); 

        const userId = 'non-existent-id';

        // ACT & ASSERT: Chúng ta mong đợi một lỗi tùy chỉnh (custom error)
        await expect(async () => {
            await userService.getUserById(userId);
        }).rejects.toThrow('User not found with ID: non-existent-id'); 
    });
});
```

> **Giải thích của Duy Trung:** Tại sao chúng ta phải bắt lỗi (`expect(...).rejects.toThrow(...)`)? Vì đây là một *yêu cầu nghiệp vụ* quan trọng, không chỉ đơn thuần là kiểm tra xem hàm có chạy hay không. Chúng ta xác định rõ hành vi sai (behavior) mong muốn khi API gặp vấn đề để đảm bảo tính nhất quán của hệ thống.

#### Bước 3: 🟢 Green - Viết Code Tối Thiểu Để Test Chạy Xanh (The Pass)

Bây giờ, chúng ta chỉ quan tâm đến việc làm cho bài test trên chuyển sang màu xanh. Chúng ta cần triển khai `getUserById` trong `user.service.js`.

**File:** `src/services/user.service.js`
```javascript
const dbClient = require('../data/db-client'); // Tầng truy cập dữ liệu thực tế

/**
 * Lấy thông tin người dùng bằng ID, ném lỗi 404 nếu không tìm thấy.
 */
async function getUserById(userId) {
    // Đây là logic tối thiểu để vượt qua test Red ở trên
    const user = await dbClient.findUserById(userId); 

    if (!user) {
        // Bắt buộc phải throw một lỗi có message chính xác như trong test case
        throw new Error(`User not found with ID: ${userId}`); 
    }

    return user;
}

module.exports = {
    getUserById,
};
```
*(Sau khi viết code này và chạy lại Jest, mọi thứ đều chuyển sang màu xanh lá cây.)*

#### Bước 4: ✨ Refactor - Tái Cấu Trúc Để Mã Sạch Hơn (The Clean)

Code của chúng ta đang hoạt động đúng theo test. Bây giờ là lúc chúng ta nâng cấp chất lượng mã nguồn mà không phá vỡ bất kỳ bài test nào.

Trong ví dụ trên, việc ném `new Error()` trực tiếp là chưa đủ chuyên nghiệp cho một API. Chúng ta nên định nghĩa các lớp lỗi (Custom Errors) riêng biệt để Controller có thể bắt và chuyển thành HTTP Status Code chuẩn xác hơn (ví dụ: 404).

**Cải tiến Refactoring:**

1.  Tạo `HttpError` class.
2.  Sửa Service layer để ném `HttpNotFoundError`.

```javascript
// src/utils/http-error.js
class HttpError extends Error {
    constructor(message, status = 500) {
        super(message);
        this.status = status;
        this.name = 'HttpError';
    }
}
module.exports = HttpError;

// src/services/user.service.js (Đã Refactor)
const dbClient = require('../data/db-client'); 
const HttpError = require('../utils/http-error'); // Import custom error

async function getUserById(userId) {
    const user = await dbClient.findUserById(userId); 

    if (!user) {
        // Thay thế new Error() bằng Custom HttpError, giúp tầng cao hơn xử lý tốt hơn
        throw new HttpError(`User not found with ID: ${userId}`, 404); 
    }

    return user;
}
module.exports = { getUserById };
```

> **Lợi ích của Refactoring:** Chúng ta đã nâng cấp code từ "chạy được" thành **"có thể bảo trì và mở rộng dễ dàng"**. Nếu sau này cần thêm chức năng kiểm tra quyền truy cập (Authorization), chúng ta chỉ cần chèn logic vào Service layer, và các test case cũ vẫn đảm bảo nó hoạt động đúng.

---

## 🚀 III. Tổng kết: TDD là Tư Duy Thiết Kế

Đối với một QE Lead như tôi, việc áp dụng TDD không phải là một nhiệm vụ kỹ thuật riêng lẻ mà là một **Triết lý Thiết kế (Design Philosophy)**.

Bạn sẽ thấy rằng khi bạn thực sự buộc bản thân phải viết test trước, bộ não của bạn sẽ tự động bắt đầu suy nghĩ về:

1.  **Trường hợp biên (Edge Cases):** Xử lý input rỗng, dữ liệu null, ID không định dạng đúng...
2.  **Các giới hạn:** Giới hạn tốc độ API (rate limiting), gián đoạn kết nối mạng.
3.  **Khả năng Mocking:** Làm sao để tầng service này hoạt động mà không cần phải khởi động cả hệ thống database thực tế?

Những suy nghĩ này chính là những khu vực rủi ro tiềm ẩn của ứng dụng, và TDD đã giúp bạn vá chúng trước khi sản phẩm đến tay người dùng cuối.

### Lời khuyên từ Duy Trung:
*   **Bắt đầu nhỏ:** Đừng cố áp dụng TDD cho toàn bộ API ngay lập tức. Hãy bắt đầu với những module phức tạp nhất hoặc những nơi có logic nghiệp vụ (business logic) quan trọng nhất.
*   **Phân tách rõ ràng:** Luôn kiểm thử Service Layer và Repository Layer bằng Unit Test, giữ cho Controller/Route Handler chỉ chịu trách nhiệm về việc xử lý HTTP Request/Response duy nhất (Input validation & Output formatting).

Chúc các anh chị và em xây dựng những hệ thống Node.js API không chỉ hoạt động tốt mà còn cực kỳ đáng tin cậy! Nếu có bất kỳ câu hỏi nào, đừng ngần ngại thảo luận thêm nhé.