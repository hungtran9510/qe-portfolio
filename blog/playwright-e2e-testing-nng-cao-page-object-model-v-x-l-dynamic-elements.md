---
title: "Playwright E2E Testing nâng cao: Page Object Model và xử lý Dynamic Elements"
date: 2026-06-26
description: "Hướng dẫn chuyên sâu về việc tối ưu hóa Playwright bằng Pattern Page Object Model (POM) và kỹ thuật vượt qua các thách thức của các phần tử động trong kiểm thử E2E."
tags: ["Automation","Playwright","TypeScript"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hoàng Hiệp"
---

# Playwright E2E Testing nâng cao: Page Object Model và xử lý Dynamic Elements

Chào các đồng nghiệp QA Automation, tôi là Hoàng Hiệp. Trong vai trò là một QE Lead chuyên sâu về tự động hóa kiểm thử, tôi hiểu rằng việc viết các script E2E không chỉ đơn thuần là nhấp chuột và xác minh kết quả hiển thị. Để hệ thống test của chúng ta thực sự đáng tin cậy (reliable) và có thể bảo trì (maintainable) trước tốc độ phát triển sản phẩm ngày càng nhanh, chúng ta cần áp dụng những kỹ thuật nâng cao.

Bài viết hôm nay sẽ đi sâu vào hai chủ đề then chốt: **Page Object Model (POM)** – kiến trúc nền tảng giúp code của bạn sạch hơn; và cách xử lý **Dynamic Elements** – vấn đề gây ra sự "flaky" (không ổn định) cho bất kỳ bộ test nào.

Hãy cùng tôi nâng tầm các kỹ năng E2E Testing với Playwright!

***

## I. Tại sao phải sử dụng Page Object Model (POM)?

Nếu bạn đang xây dựng các bài kiểm thử bằng cách nhồi nhét mọi lệnh `await page.click()` và selector CSS trực tiếp trong file test (`*.spec.ts`), thì chúc mừng, bạn đang đối diện với một vấn đề rất lớn: **Vi phạm nguyên tắc DRY (Don't Repeat Yourself)**.

Mỗi khi giao diện người dùng thay đổi (ví dụ: ID của nút "Submit" chuyển từ `#submit-btn` sang `.btn-primary--save`), bạn sẽ phải rà soát và sửa *hàng chục* file test khác nhau. Đây chính là lý do POM ra đời.

### 💡 Khái niệm cốt lõi

POM là một thiết kế mẫu (Design Pattern) trong đó, chúng ta tạo các lớp đối tượng (Classes) để mô phỏng cấu trúc của từng trang hoặc module trên ứng dụng web. Mỗi Page Object sẽ chịu trách nhiệm:
1. Lưu trữ tất cả các selector liên quan đến một trang.
2. Cung cấp các phương thức (methods) đã đóng gói sẵn cho các hành vi nghiệp vụ (business actions) trên trang đó.

### 🛠️ Lợi ích của POM trong Playwright

*   **Tăng khả năng bảo trì (Maintainability):** Nếu selector thay đổi, bạn chỉ cần sửa *một nơi*: trong Page Object tương ứng.
*   **Tăng tính tái sử dụng (Reusability):** Các hàm hành vi nghiệp vụ có thể được gọi từ nhiều bài test khác nhau mà không sao chép logic.
*   **Cải thiện khả năng đọc hiểu (Readability):** File test của bạn trở thành một kịch bản (scenario) dễ theo dõi, thay vì một chuỗi lệnh kỹ thuật phức tạp.

## II. Triển khai Page Object Model với Playwright và TypeScript

Giả sử chúng ta có một trang đăng nhập (`/login`) và các hành động cơ bản bao gồm việc điền email, mật khẩu và click nút Đăng nhập.

### 📂 Cấu trúc thư mục lý tưởng:

```
tests/
├── pages/
│   ├── LoginPage.ts       // Page Object cho trang Đăng nhập
│   └── DashboardPage.ts   // Page Object cho trang Dashboard
└── e2e/
    └── login.spec.ts      // File test thực tế (sử dụng các hàm từ POM)
```

### 🚀 Code Example: LoginPage.ts (The Page Object)

Chúng ta sẽ định nghĩa `LoginPage` như một lớp JavaScript/TypeScript, kế thừa hoặc sử dụng đối tượng `page` của Playwright.

```typescript
// pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
    readonly page: Page;
    
    // 1. Khởi tạo POM bằng cách truyền vào đối tượng page (context)
    constructor(page: Page) {
        this.page = page;
    }

    // 2. Định nghĩa các Selectors (Elements) như các thuộc tính (Locator)
    readonly emailInput: Locator = this.page.locator('#email-input');
    readonly passwordInput: Locator = this.page.locator('#password-input');
    readonly loginButton: Locator = this.page.locator('button[type="submit"]'); // Selector ổn định hơn

    /**
     * @description Nhập thông tin đăng nhập và nhấn nút.
     * @param username Tên người dùng.
     * @param password Mật khẩu.
     */
    async login(username: string, password?: string): Promise<void> {
        console.log("--- Bắt đầu hành vi: Đăng nhập...");
        
        // 3. Phương thức đóng gói hành vi (Business Logic)
        await this.emailInput.fill(username);
        if (password) {
            await this.passwordInput.fill(password);
        }
        await this.loginButton.click();
    }

    /**
     * @description Kiểm tra xem người dùng có được chuyển đến Dashboard không.
     * @returns Boolean chỉ trạng thái thành công/thất bại của việc kiểm tra.
     */
    async isLoginSuccessful(): Promise<boolean> {
        // Thay selector này bằng một element CHỈ tồn tại trên Dashboard
        const dashboardElement = this.page.locator('#dashboard-title'); 
        return await dashboardElement.isVisible();
    }
}
```

### 🚀 Code Example: login.spec.ts (The Test File)

File test của chúng ta giờ đây cực kỳ gọn gàng và tập trung vào *cái gì* cần kiểm tra, chứ không phải *như thế nào* để thực hiện hành động đó.

```typescript
// e2e/login.spec.ts
import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe("Kiểm thử quy trình đăng nhập", () => {
    
    test("nên cho phép người dùng hợp lệ đăng nhập thành công và truy cập Dashboard", async ({ page }) => {
        // Khởi tạo Page Object trong mỗi test (Tối ưu hóa Context)
        const loginPage = new LoginPage(page);

        await page.goto('/login'); // Di chuyển đến trang Login
        
        // Sử dụng phương thức đóng gói của POM: Rất dễ đọc!
        await loginPage.login('testuser@example.com', 'SecurePass123!');
        
        // Xác minh trạng thái nghiệp vụ
        const success = await loginPage.isLoginSuccessful();
        expect(success).toBeTruthy(); 
    });

    test("không nên cho phép đăng nhập với mật khẩu sai", async ({ page }) => {
        const loginPage = new LoginPage(page);
        await page.goto('/login');
        
        await loginPage.login('user', 'wrongpassword');
        
        // Kiểm tra thông báo lỗi thay vì kiểm tra Dashboard (Xác minh điều kiện thất bại)
        const errorMessage = page.locator('.error-message').textContent();
        expect(errorMessage).toContain("Mật khẩu không đúng.");
    });
});
```

**Nhận xét của Hoàng Hiệp:** Bạn thấy sự khác biệt chưa? File test chỉ chứa các lời gọi phương thức `await loginPage.login(...)`. Nó sạch sẽ, dễ hiểu và hoàn toàn tách biệt khỏi chi tiết selectors phức tạp. Đây chính là sức mạnh của POM.

***

## III. Thử thách lớn nhất: Xử lý Dynamic Elements (Các phần tử động)

Dù áp dụng POM có giúp code đẹp hơn rất nhiều, nhưng việc tự động hóa trên một ứng dụng thực tế sẽ luôn gặp rủi ro về "thời gian" và "cấu trúc DOM". Đây là lúc bạn cần kỹ thuật xử lý các **Dynamic Elements**.

Các vấn đề phổ biến:
1. **Timing Issues:** Phần tử chưa kịp render khi test cố gắng tương tác (`StaleElementReferenceError`).
2. **Random Selectors:** ID hoặc class được sinh ngẫu nhiên (ví dụ: `user-auth-abc123xyz`).
3. **Conditional Rendering:** Element chỉ xuất hiện sau một thao tác AJAX thành công, và việc chờ đợi tiêu chuẩn không đủ.

### 💡 Chiến lược 1: Thay vì Sleep(), hãy WAIT TỐI ƯU

Tuyệt đối không bao giờ dùng `await page.waitForTimeout(2000)`. Điều này khiến test của bạn chậm lại một cách vô lý nếu điều kiện đã được đáp ứng sớm hơn.

Hãy sử dụng các hàm chờ có điều kiện và rõ ràng (Explicit Wait):

```typescript
// ✅ TỐT: Chờ đến khi phần tử hiển thị trên viewport, không chỉ là tồn tại trong DOM
await page.waitForSelector('.dynamic-item', { state: 'visible' }); 

// ✅ RẤT TỐT: Chờ cho đến khi phần tử KHÔNG CÒN được ẩn đi (hoặc được kích hoạt)
// Ví dụ: Wait cho đến khi một modal được xóa khỏi DOM sau khi đóng nút
await page.waitForSelector('.modal-container', { state: 'hidden' }); 

// ✅ Xử lý theo trạng thái cụ thể (Nếu cần chờ element có khả năng nhấn):
await this.page.locator('#submitBtn').waitFor({ state: 'enabled' });
```

### 💡 Chiến lược 2: Sử dụng Selectors linh hoạt (Resilient Selectors)

Khi ID là ngẫu nhiên, chúng ta phải dựa vào cấu trúc và các thuộc tính không thay đổi.

#### a) Dùng thuộc tính ngữ nghĩa hoặc Text content:
Nếu bạn cần tìm nút "Đăng nhập", đừng dùng selector chỉ chứa một phần của nó. Hãy cố gắng dùng XPath để tìm qua nội dung văn bản (Text):

```typescript
// Ví dụ: Tìm button có text là 'Login' dù class/ID thay đổi
const loginButton = this.page.getByRole('button', { name: 'Đăng nhập' }); 
await loginButton.click(); // Playwright hỗ trợ tìm theo vai trò (role) rất mạnh mẽ!

// Hoặc dùng XPath cho văn bản nội dung
const specificElement = this.page.locator(`xpath=//*[contains(text(), "Tên Sản Phẩm")]`); 
```

#### b) Xử lý danh sách động bằng Selectors `nth()` hoặc Regex (Đối với Playwright):
Khi bạn phải làm việc với một bảng chứa hàng trăm dòng dữ liệu, và bạn cần tìm item thứ N:

*   **Dùng `:nth-child(N)`:** Nếu cấu trúc là cố định.
    ```typescript
    // Lấy phần tử ở vị trí thứ 3 trong danh sách
    const thirdItem = page.locator('.product-list .item:nth-child(3)');
    await thirdItem.click();
    ```

### III. Bài toán nâng cao: Xử lý các tương tác theo luồng (Flow Interaction)

Trong nhiều trường hợp, việc nhấp vào Element A sẽ khiến một container mới xuất hiện chứa Element B. Bạn cần đảm bảo rằng cả hai bước đều được xử lý mượt mà trong POM.

**Giải pháp:** Sử dụng kết hợp `waitForSelector` và encapsulation trong Page Object.

```typescript
// Cải tiến phương thức trong LoginPage.ts 
async selectUsernameByPopup(username: string): Promise<void> {
    console.log("--- Mở popup chọn tên người dùng...");
    
    // 1. Hành động kích hoạt sự kiện (mở popup)
    await this.page.locator('#search-user').click();
    
    // 2. CHỜ cho đến khi container popup xuất hiện
    await this.page.waitForSelector('.user-popup-menu', { state: 'visible' });

    // 3. Tìm và tương tác với element *bên trong* popup (Nơi POM lại thể hiện sức mạnh)
    const userElement = this.page.locator(`.user-popup-menu [data-username="${username}"]`);
    await userElement.click(); // Bấm vào tên người dùng đã tìm thấy

    // 4. Chờ đợi hành động tiếp theo (ví dụ: popup đóng lại, hoặc form được update)
    await this.page.waitForTimeout(100); // Chỉ là ví dụ đơn giản để chờ giao diện ổn định
}
```

***

## Kết luận và Lời khuyên từ Hoàng Hiệp

Để tổng kết những điểm quan trọng nhất cho bất kỳ đội ngũ QE nào:

1. **Nắm vững POM:** Hãy coi Page Objects như những lớp trừu tượng hóa (Abstraction Layers). Chúng che giấu sự phức tạp của selectors, chỉ để lại hành vi nghiệp vụ thuần túy trong file test.
2. **Không tin vào sự may mắn:** Tuyệt đối không sử dụng `Sleep()`. Luôn dùng các cơ chế chờ có điều kiện như `waitForSelector`, `waitForTimeout` (chỉ khi thực sự cần wait cho animations).
3. **Tư duy "End-to-End" chứ không phải "Script-by-Script":** Khi viết test, hãy luôn đặt mình vào vai trò của người dùng cuối. Hành vi (Behavior) quan trọng hơn Selector (Selector).

Bằng cách áp dụng Page Object Model một cách nghiêm túc và kết hợp với các chiến thuật xử lý Dynamic Elements thông minh, bộ test Playwright E2E của bạn sẽ đạt đến mức độ ổn định mà chúng ta hằng mong đợi.

Chúc mọi người thành công trong việc xây dựng