---
title: "Playwright E2E Testing nâng cao: Page Object Model và xử lý Dynamic Elements"
date: 2026-06-28
description: "Nắm vững Playwright với POM và kỹ thuật xử lý các phần tử động (Dynamic Elements), giúp hệ thống kiểm thử của bạn bền bỉ và dễ bảo trì."
tags: ["Automation","Playwright","TypeScript"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hoàng Hiệp"
---

# Playwright E2E Testing nâng cao: Page Object Model và xử lý Dynamic Elements

Chào các bạn đồng nghiệp trong ngành Automation! Tôi là Hoàng Hiệp, một Quality Engineer đã dành nhiều năm tháng nghiên cứu về kiến trúc kiểm thử tự động.

Trong bối cảnh ứng dụng web hiện đại ngày càng phức tạp – với các thành phần giao diện (UI component) được tải bất đồng bộ (asynchronously), ID thay đổi liên tục và luồng dữ liệu gián đoạn – việc xây dựng một bộ E2E Test Case đơn thuần chỉ bằng cú pháp cơ bản là **không đủ**. Các test case của bạn sẽ rất dễ bị lỗi vặt, phụ thuộc vào trình tự chạy (flaky) và cực kỳ khó bảo trì.

Bài viết hôm nay tôi muốn đi sâu vào hai trụ cột giúp các kỹ sư kiểm thử chuyên nghiệp vượt qua những thách thức đó: **Page Object Model (POM)** để đảm bảo tính tái sử dụng và cấu trúc mã hóa sạch sẽ, cùng với nghệ thuật xử lý **Dynamic Elements** để bộ test của bạn luôn bền bỉ trước mọi thay đổi của ứng dụng.

---

## I. Page Object Model (POM): Nền tảng cho Khả năng Bảo trì

### 💡 POM là gì?

Page Object Model (POM) là một mô hình thiết kế phần mềm nổi tiếng, áp dụng vào Automation Testing. Thay vì viết các bước tương tác người dùng trực tiếp trong test case (`test/login.spec.ts`), chúng ta sẽ tạo ra các lớp (Class) đại diện cho từng trang hoặc thành phần lớn trên ứng dụng.

Mỗi "Page Object" sẽ đóng gói:
1. **Các bộ định vị (Locators):** Ví dụ: `#username-input`, `.btn-primary`.
2. **Các phương thức tương tác (Methods):** Các hành động người dùng có thể thực hiện trên trang đó (ví dụ: `loginAs(user, password)`, `navigateToDashboard()`).

### 🎯 Lợi ích của việc áp dụng POM

1. **Tính Tái sử dụng (Reusability):** Nếu một bộ định vị cho nút "Login" thay đổi ID, bạn chỉ cần sửa nó ở *một nơi duy nhất* (trong Page Object), chứ không cần tìm và sửa nó trên hàng chục file test case khác nhau.
2. **Khả năng Đọc (Readability):** Code test của bạn sẽ giống như một kịch bản người dùng: `await dashboardPage.verifyUserProfile(expectedName);` – rất dễ hiểu.
3. **Tách biệt mối quan tâm (Separation of Concerns):** Test Case chỉ tập trung vào *những gì cần kiểm tra*, còn Page Object tập trung vào *cách thức thực hiện các hành động*.

### 💻 Ví dụ Code: Triển khai POM với Playwright và TypeScript

Chúng ta sẽ giả sử có một trang Login.

#### 1. Định nghĩa Page Object (LoginPage.ts)

```typescript
import { Page, expect } from "@playwright/test";

/**
 * Lớp đại diện cho trang Đăng nhập của ứng dụng.
 */
export class LoginPage {
    // Properties: Các bộ định vị được khai báo tại đây
    readonly page: Page;
    readonly usernameInput = this.page.getByRole("textbox", { name: "Username" });
    readonly passwordInput = this.page.getByRole("textbox", { name: "Password" });
    readonly submitButton = this.page.getByRole("button", { name: "Sign In" });

    constructor(page: Page) {
        this.page = page;
    }

    /**
     * Phương thức 1: Thực hiện hành động Login (Tương tác).
     */
    async loginAs(username: string, password: string): Promise<void> {
        console.log(`[Action] Entering credentials for ${username}...`);
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.submitButton.click(); // Playwright tự động xử lý việc chờ click
    }

    /**
     * Phương thức 2: Kiểm tra trạng thái thành công (Assertion).
     */
    async verifySuccessfulLogin(): Promise<boolean> {
        const dashboardHeader = this.page.locator('h1#dashboard-header');
        await expect(dashboardHeader).toBeVisible(); // Sử dụng Playwright assertion
        return true;
    }
}
```

#### 2. Viết Test Case (login.spec.ts)

File test case giờ đây sạch sẽ và chỉ tập trung vào logic kiểm thử:

```typescript
import { test, expect } from "@playwright/test";
// Import Page Object đã tạo
import { LoginPage } from "../page-objects/LoginPage"; 

test("Should successfully log in and verify dashboard access", async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await test.step("Bước 1: Điều hướng đến trang Login", async () => {
        await page.goto("/login");
    });

    // Gọi phương thức từ Page Object, không quan tâm logic tương tác bên trong
    await loginPage.loginAs("user@test.com", "securePass123");

    // Kiểm tra kết quả bằng các hàm kiểm tra (Assertion)
    const success = await loginPage.verifySuccessfulLogin();
    expect(success).toBe(true); 
});
```

**🔍 Giải thích của Hoàng Hiệp:**
Việc này đạt được sự tách biệt tuyệt vời. Nếu bộ định vị cho nút Sign In thay đổi từ `getByRole` sang một CSS Selector, bạn chỉ cần sửa **LoginPage.ts**, và mọi file test case khác sử dụng lớp này sẽ tự động được cập nhật mà không bị ảnh hưởng!

---

## II. Xử lý Dynamic Elements: Chìa khóa của Test Bền bỉ

Không có Page Object nào hoàn hảo nếu nó phải hoạt động trên một trang web thực tế, nơi các phần tử không ngừng thay đổi trạng thái và bộ định vị dễ hỏng (fragile locators). Đây là lúc bạn cần nâng cấp kỹ năng xử lý **Dynamic Elements**.

### 👻 Các thách thức của Dynamic Elements

1. **Timing Issues:** Test chạy quá nhanh, cố gắng tương tác với một phần tử chưa kịp tải xong (race conditions).
2. **Ephemeral Locators:** ID hoặc Class Name được tạo ra ngẫu nhiên bằng JavaScript (`id="random-abc-123"`), khiến việc định vị thủ công là bất khả thi.
3. **Visibility/Interactions:** Phần tử đã tồn tại trong DOM, nhưng bị che phủ bởi một lớp Modal Pop-up, hoặc chỉ xuất hiện sau khi thực hiện một hành động khác.

### 🛠️ Các kỹ thuật xử lý chuyên sâu với Playwright

#### 1. Chiến lược Chờ đợi Thông minh (Smart Waiting)

Thay vì dùng `sleep(5000)`, chúng ta sử dụng các cơ chế chờ *điều kiện* (condition-based waiting).

**Sử dụng `expect` và Playwright Locators:**
Playwright đã tích hợp khả năng chờ rất tốt. Thay vì cần lệnh explicit wait phức tạp, hãy để Playwright xử lý bằng cách dùng Assertions:

```typescript
// SAI - Dễ gây race condition nếu element chưa xuất hiện
// await page.click("#data-table") 

// ĐÚNG - Playwright sẽ tự động chờ cho đến khi locator này khả dụng và có thể click được
await expect(page.locator(".report-container")).toBeVisible(); 
await page.getByRole("button", { name: "View Details" }).waitFor({ state: 'visible' });
```

**Sử dụng `Locator.waitFor()`:**
Khi bạn cần xác minh một trạng thái cụ thể (ví dụ: một ô nhập liệu trở nên *enable*):

```typescript
// Chờ cho đến khi phần tử có ID "confirm-btn" xuất hiện và có thể được click
await page.locator("#confirm-btn").waitFor({ state: 'visible', timeout: 15000 });
await page.locator("#confirm-btn").click();
```

#### 2. Chọn Selector Mạnh mẽ (Robust Selectors)

Tuyệt đối tránh phụ thuộc vào ID ngẫu nhiên. Hãy ưu tiên các loại selector sau theo thứ tự:

| Độ Ưu Tiên | Loại Selector | Ví dụ & Mục đích | Lý do nên dùng |
| :--- | :--- | :--- | :--- |
| **🥇 Cao nhất** | `getByRole()` / `getByText()` | `page.getByRole('button', { name: 'Submit' })` | Định vị dựa trên ngữ nghĩa (Semantic) của người dùng, độc lập với ID/Class. **Luôn là lựa chọn hàng đầu.** |
| **🥈 Trung bình** | Text Content + Role | `.tooltip-wrapper span[data-testid='info']` | Kết hợp các thuộc tính dữ liệu (`data-testid`) mà đội Dev phải thêm vào – đây là best practice nhất trong nhóm DEV/QE. |
| **🥉 Thấp** | CSS Selector (theo cấu trúc) | `div > ul > li:nth-child(2)` | Dùng khi không thể dùng các cách trên, nhưng rất giòn (fragile) vì chỉ dựa vào thứ tự. |

### 🧠 Bảng tóm tắt về việc lựa chọn Locator (The QE Mindset)

*   **Nếu Dev cho phép:** Yêu cầu họ thêm `data-testid="login-button"` vào phần tử HTML. Đây là bộ định vị tối thượng của Automation Testing.
*   **Nếu phải dùng Playwright mặc định:** Luôn bắt đầu bằng `page.getByRole(...)`. Nó thông minh hơn bất kỳ CSS selector nào bạn tự viết.

---

## III. Tổng Kết và Hành động tiếp theo (Best Practices)

Tóm lại, một bộ E2E Test vượt trội không chỉ là việc chạy được test, mà còn phải **dễ bảo trì** và **ổn định**.

1. **Áp dụng POM:** Xây dựng lớp Page Object cho mọi trang và thành phần lớn (Component-based testing).
2. **Ưu tiên Selectors có ý nghĩa:** Luôn dùng `getByRole` hoặc yêu cầu `data-testid`. Hạn chế tuyệt đối việc dựa vào thuộc tính ngẫu nhiên.
3. **Tư duy Async:** Không bao giờ tương tác với các phần tử mà bạn không chắc chắn rằng chúng đã sẵn sàng (visible, enabled) bằng cách sử dụng cơ chế chờ điều kiện của Playwright (`await expect().toBeVisible()`).

Hãy nhớ rằng, vai trò của một QE Lead không chỉ là người thực hiện test case, mà còn là kiến trúc sư giúp hệ thống kiểm thử tự động vận hành ổn định và có thể mở rộng khi sản phẩm phát triển.

Chúc các bạn áp dụng thành công những kỹ thuật nâng cao này để xây dựng những bộ test bền bỉ nhất!

***
*Hoàng Hiệp – QE Lead.*