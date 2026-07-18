---
title: "Playwright E2E Testing nâng cao: Page Object Model và xử lý Dynamic Elements"
date: 2026-06-24
description: "Nắm vững nghệ thuật viết các test case Playwright ổn định với Page Object Model (POM) và kỹ thuật xử lý các phần tử động (Dynamic Elements)."
tags: ["Automation","Playwright","TypeScript"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hoàng Hiệp"
---

# Playwright E2E Testing nâng cao: Page Object Model và xử lý Dynamic Elements

Chào bạn, tôi là Hoàng Hiệp – một chuyên gia trong lĩnh vực Kỹ thuật Đảm bảo Chất lượng Phần mềm (QE).

Trong thế giới Tự động hóa Kiểm thử (Automation), đặc biệt là kiểm thử End-to-End (E2E) với các công cụ mạnh mẽ như Playwright, việc viết test case chỉ dừng lại ở việc "nhấn nút A rồi kiểm tra kết quả B" là chưa đủ. Một bộ khung kiểm thử chuyên nghiệp phải đảm bảo tính ổn định, dễ bảo trì và khả năng thích ứng cao với những thay đổi của giao diện người dùng (UI).

Bài viết này sẽ đào sâu vào hai trụ cột quan trọng nhất để nâng tầm kỹ năng Automation của bạn: **Page Object Model (POM)** và nghệ thuật xử lý các **Dynamic Elements**.

---

## 🧱 Phần I: Tại sao cần Page Object Model (POM)?

Khi dự án kiểm thử của bạn lớn lên, nếu tất cả logic tương tác với UI đều nằm rải rác trong các file test case (`test.spec.ts`), bạn sẽ gặp phải tình trạng *spaghetti code* và cực kỳ khó khăn khi bảo trì.

**Vấn đề cốt lõi:** Tách biệt trách nhiệm (Separation of Concerns).

POM không chỉ là một pattern; nó là một triết lý thiết kế giúp chúng ta đóng gói các selector và hành động liên quan đến một trang/một module cụ thể vào một lớp (Class) riêng.

**Lợi ích của POM:**

1.  **Tăng khả năng tái sử dụng (Reusability):** Các hàm tương tác với các thành phần chung (như đăng nhập, điều hướng cơ bản) chỉ cần được viết một lần và gọi ở nhiều nơi.
2.  **Dễ bảo trì (Maintainability):** Nếu selector của nút "Đăng nhập" thay đổi, bạn chỉ cần cập nhật *một* file POM duy nhất, chứ không phải rà soát hàng chục test file khác nhau.
3.  **Tăng tính mạch lạc (Readability):** Code kiểm thử sẽ trở nên thuần túy hơn; nó tập trung vào *logic nghiệp vụ* (Business Logic) thay vì cú pháp thao tác với UI (`page.locator('#id').click()`).

### 💡 Minh họa cấu trúc POM:

Giả sử chúng ta có trang Đăng nhập. Thay vì viết trực tiếp trong test file, chúng ta tạo một lớp `LoginPage`.

**Cấu trúc lý tưởng:**
1.  `test/`: Chứa các kịch bản kiểm thử (Test Cases).
2.  `pages/`: Chứa các Page Objects (Đóng gói UI và hành động).
3.  `utils/`: Chứa các hàm hỗ trợ chung (Ví dụ: custom wait functions, helper methods).

---

## ⚙️ Phần II: Thực thi POM với Playwright (TypeScript)

Sử dụng TypeScript là tiêu chuẩn vàng trong QE hiện đại vì nó cung cấp tính an toàn kiểu dữ liệu (Type Safety), giúp chúng ta phát hiện lỗi ngay từ giai đoạn code compile.

Hãy xem cách một `LoginPage` được cấu trúc để tối đa hóa tính chuyên nghiệp và tái sử dụng:

```typescript
// pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
    private readonly page: Page;
    
    // Định nghĩa các locator ở cấp lớp (Best Practice)
    readonly usernameInput: Locator = this.page.getByPlaceholder('Enter your username');
    readonly passwordInput: Locator = this.page.getByPlaceholder('Enter your password');
    readonly loginButton: Locator = this.page.locator('#login-submit-btn'); // Sử dụng ID nếu nó rất ổn định

    constructor(page: Page) {
        this.page = page;
    }

    /**
     * Hành động 1: Thực hiện đăng nhập với username và password cho trước.
     * @param username Tên người dùng
     * @param password Mật khẩu tương ứng
     */
    async login(username: string, password: string): Promise<void> {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        // Playwright tự xử lý chờ (auto-wait) khi ta gọi .click(), nên code sạch hơn
        await this.loginButton.click(); 
    }

    /**
     * Hành động 2: Kiểm tra trạng thái hiển thị của nút Login.
     * @returns Promise<boolean> True nếu nút có thể thấy và click được.
     */
    async isLoginButtonVisible(): Promise<boolean> {
        // Sử dụng .isVisible() để kiểm tra trạng thái, không chỉ là selector tồn tại.
        return await this.loginButton.isVisible(); 
    }
}

/*
Cách sử dụng trong test file:
test('should log in successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto('/login'); // Giả sử có hàm goto helper nào đó
    await loginPage.login('admin', 'secure123');
    // Tiếp tục các assertion khác...
});
*/
```

**Giải thích của Hoàng Hiệp:**

*   **Tính đóng gói (Encapsulation):** Chúng ta không để selector lộ ra ngoài lớp test. Lớp `LoginPage` là nơi duy nhất biết các selector này, đảm bảo tính cô lập khi thay đổi UI.
*   **Sử dụng `Locator`:** Việc khai báo các thuộc tính `readonly locator: Locator = ...` giúp Playwright thực hiện tối ưu hóa việc quản lý bộ chọn (selector management).

---

## 👻 Phần III: Nghệ thuật xử lý Dynamic Elements (Điểm khó nhất)

Các ứng dụng SPA (Single Page Application) và API-driven luôn tạo ra các phần tử động. Một phần tử có thể xuất hiện sau một khoảng delay, hoặc selector của nó thay đổi theo ngữ cảnh (ví dụ: class name được gán ngẫu nhiên).

**Nếu chỉ dùng cú pháp cơ bản (`await element.click()`), test case của bạn sẽ dễ bị lỗi `Element not found` hoặc `Stale Element Reference`.**

Đây là các chiến lược nâng cao tôi khuyên bạn nên áp dụng:

### 1. Ưu tiên Selector ổn định (Semantic Locators)

Luôn ưu tiên selector dựa trên ngữ nghĩa, thay vì chỉ dùng ID/Class ngẫu nhiên.

| Loại Selector | Độ bền vững | Khi nào nên dùng? |
| :--- | :--- | :--- |
| `getByRole()` | ⭐⭐⭐⭐⭐ | Luôn luôn. Ví dụ: Tìm nút theo vai trò "Button", tìm tiêu đề theo vai trò "Heading". |
| `getByPlaceholder()` | ⭐⭐⭐⭐ | Tốt cho các input form. |
| `text='...'` | ⭐⭐⭐ | Khi cần tương tác với nội dung văn bản hiển thị (ví dụ: thông báo lỗi). |
| ID, Class Name | ⭐⭐ | Chỉ dùng khi bạn xác nhận 100% rằng nó sẽ không bao giờ thay đổi. |

**Ví dụ sử dụng `getByRole` trong Playwright:**

```typescript
// Thay vì: page.locator('.user-list > div:nth-child(3) .item').click(); (Rất dễ hỏng!)
// Hãy dùng: 
const userItem = page.getByRole('row', { name: 'User Name A' }); // Tìm hàng chứa tên người dùng cụ thể
await userItem.getByRole('button', { name: 'View Details' }).click(); 
```

### 2. Sử dụng Chiến lược chờ có điều kiện (Conditional Waiting)

Việc gọi `await element.waitFor()` là cần thiết, nhưng đôi khi bạn không biết *cái gì* phải chờ. Bạn chỉ biết *khi nào nó sẵn sàng*.

**Giải pháp:** Kết hợp `Locator` với việc kiểm tra trạng thái của DOM hoặc nội dung văn bản (Text Content).

```typescript
// Scenario: Chờ cho đến khi một thông báo "Thành công" xuất hiện và mờ đi.
async function waitForSuccessMessage(page: Page): Promise<void> {
    const successLocator = page.getByText('Thao tác thành công');
    await successLocator.waitFor({ state: 'visible', timeout: 10000 }); // Chờ tối đa 10s

    // Thêm logic chờ nó biến mất (hoặc chuyển sang trang mới) để biết test đã hoàn thành bước này.
}
```

### 3. Sử dụng XPath cho các vấn đề phức tạp/liệt kê động

Nếu Playwright’s standard locators gặp khó khăn với cấu trúc DOM rất sâu và thay đổi, XPath vẫn là một công cụ mạnh mẽ. Tuy nhiên, hãy dùng nó như phương án cuối cùng!

**Ví dụ: Chọn phần tử thứ N trong danh sách:**
```typescript
// Chọn tất cả các mục (li) nằm trong container có class 'item-list'
const allItems = page.locator('.item-list li'); 

// Lấy item thứ 5
const fifthItem = allItems.nth(4); 
await fifthItem.click();
```
*Hoặc dùng XPath nếu cần: `page.locator('xpath=//div[@class="container"]/ul/li[5]')`.*

---

## ✨ Tổng kết và Checklist của QE Lead Hoàng Hiệp

Để xây dựng một bộ khung E2E Testing Playwright chuyên nghiệp, hãy nhớ các nguyên tắc sau:

1.  ✅ **POM là bắt buộc:** Tuyệt đối không để selector trong file test. Mọi thứ phải nằm trong Page Objects.
2.  ✅ **Prioritize `getByRole`:** Luôn tìm cách sử dụng `page.getBy*()` trước khi nghĩ đến ID hay Class Selector cố định.
3.  ✅ **Quản lý chờ (Waiting):** Tận dụng tối đa khả năng *auto-waiting* của Playwright. Nếu cần chờ, hãy wait cho một **điều kiện** (Condition) chứ không phải chỉ là thời gian (`setTimeout`).
4.  ✅ **Kiểm thử bằng Trạng thái:** Thay vì kiểm tra `element exists`, hãy kiểm tra `element is visible` hoặc `element has text 'Expected Value'`.

Áp dụng các nguyên tắc này sẽ giúp bộ khung tự động hóa của bạn không chỉ chạy được mà còn *bền bỉ* trước những lần thay đổi UI, nâng cao hiệu suất và độ tin cậy cho quy trình phát hành phần mềm của đội ngũ.

Chúc bạn thành công trong việc xây dựng một hệ thống kiểm thử vững chắc!