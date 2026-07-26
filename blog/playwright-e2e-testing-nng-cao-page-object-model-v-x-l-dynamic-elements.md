---
title: "Playwright E2E Testing nâng cao: Page Object Model và xử lý Dynamic Elements"
date: 2026-07-02
description: "Nắm vững POM và chiến lược xử lý các thành phần động (Dynamic Elements) để xây dựng hệ thống E2E testing với độ tin cậy vượt trội bằng Playwright."
tags: ["Automation","Playwright","TypeScript"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hoàng Hiệp"
---

# Playwright E2E Testing nâng cao: Page Object Model và xử lý Dynamic Elements

Xin chào các đồng nghiệp trong lĩnh vực QA Automation! Tôi là Hoàng Hiệp.

Trong hành trình xây dựng một hệ thống tự động kiểm thử (Automation Test Suite) hiệu quả, chúng ta đã quen thuộc với cú pháp mạnh mẽ của Playwright. Tuy nhiên, nếu chỉ dừng lại ở việc viết các test case theo phong cách "script tuyến tính" (linear script), bạn sẽ nhanh chóng gặp phải hai vấn đề chí mạng: **Tính dễ bảo trì thấp** và **Độ tin cậy kém** do sự thay đổi liên tục của giao diện người dùng (UI).

Bài viết này được thiết kế để đưa bạn lên cấp độ chuyên gia. Chúng ta sẽ cùng nhau đào sâu vào việc áp dụng hai nguyên tắc vàng trong QA hiện đại: **Page Object Model (POM)** và các kỹ thuật xử lý **Dynamic Elements** bằng Playwright, giúp hệ thống E2E testing của bạn đạt mức độ bền vững (Robustness) cao nhất.

***

## I. Nền tảng kiến trúc: Page Object Model (POM) là gì?

### 💡 Tại sao cần POM?

Page Object Model (POM) là một mẫu thiết kế phần mềm cho phép chúng ta tách biệt logic kiểm thử khỏi các chi tiết implementation của trang web. Thay vì đặt mọi bước tương tác (`await page.click('#login-button')`) vào trong file test, chúng ta sẽ nhóm các hành vi và bộ định vị (locators) liên quan đến một trang cụ thể vào một "lớp" (class) chuyên biệt—đó chính là Page Object.

**Lợi ích cốt lõi:**

1.  **Tái sử dụng (Reusability):** Các hàm tương tác như `login(username, password)` chỉ cần được định nghĩa một lần và tái sử dụng ở hàng chục test case khác nhau.
2.  **Bảo trì dễ dàng (Maintainability):** Khi developer thay đổi ID của nút "Đăng nhập", bạn chỉ cần cập nhật **DUY NHẤT** bộ định vị trong file `LoginPage.ts`, thay vì tìm và sửa thủ công ở hàng trăm dòng code test case.
3.  **Tính rõ ràng:** Test case sẽ đọc giống như một kịch bản kinh doanh (Business Scenario), tập trung vào *what* (cái gì) đang được kiểm tra, chứ không phải *how* (làm thế nào).

### 🛠️ Ví dụ thực tiễn về POM với Playwright & TypeScript

Giả sử chúng ta có trang đăng nhập. Thay vì viết test như sau:

*(Cách làm kém hiệu quả)*
```typescript
// file-test.spec.ts
await page.goto('...');
await page.fill('#username').with('user'); // Bị phụ thuộc vào ID #username
await page.fill('#password').with('pass'); 
await page.click('.login-btn'); // Dùng class selector chung chung
```

Chúng ta áp dụng POM:

**1. Tạo Page Object:** (`pages/LoginPage.ts`)
```typescript
import { Page, Locator } from '@playwright/test';

/**
 * Lớp đại diện cho trang Đăng nhập (Login Page).
 */
export class LoginPage {
    readonly page: Page;
    // Định nghĩa các locator tại đây để tăng tính rõ ràng và khả năng tự động kiểm tra.
    private readonly usernameInput: Locator = this.page.locator('#username'); 
    private readonly passwordInput: Locator = this.page.locator('#password');
    private readonly loginButton: Locator = this.page.getByRole('button', { name: 'Đăng nhập' }); // Tốt nhất là dùng role

    constructor(page: Page) {
        this.page = page;
    }

    /** 
     * Hành động đăng nhập người dùng. 
     * Đây là một phương thức (method), không phải hành động test case. 
     */
    async login(username: string, password: string): Promise<void> {
        console.log("--- Bắt đầu quá trình login thông qua POM ---");
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }

    /**
     * Trả về Locator của một phần tử khác để dùng ở các lớp Page Object sau này (ví dụ: trang Dashboard).
     */
    getDashboardHeaderLocator(): Locator {
        return this.page.locator('h1');
    }
}
```

**2. Viết Test Case:** (`tests/auth.spec.ts`)
```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage'; // Import Page Object đã tạo

test('Nên đăng nhập thành công bằng tài khoản hợp lệ', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    // Test case chỉ gọi phương thức, không quan tâm đến cách nó click hay fill.
    await loginPage.login('user_valid', 'secure123'); 

    // Tiếp tục kiểm tra trên trang đích
    const dashboardHeader = loginPage.getDashboardHeaderLocator();
    await expect(dashboardHeader).toHaveText('Trang Bảng điều khiển');
});
```

***

## II. Vượt qua thách thức: Xử lý Dynamic Elements

Một trang web thực tế không bao giờ tĩnh. Chúng có thể tải dữ liệu bằng AJAX, các ID hoặc class name có thể được thêm ngẫu nhiên (UUIDs), và các phần tử bị giật lại (re-render) rất thường xuyên. Đây chính là nơi mà 90% test case thất bại khi chưa xử lý đúng cách.

### ❓ Vấn đề thường gặp: `StaleElementReferenceError`

Khi bạn tương tác với một phần tử DOM, sau đó trang web thay đổi hoặc tải lại phần tử đó, Playwright có thể trả về lỗi `StaleElementReferenceError`. Điều này xảy ra vì locator bạn đang giữ tham chiếu đã trở nên "lỗi thời" so với trạng thái hiện tại của DOM.

### 🎯 Các chiến lược xử lý nâng cao

#### 1. Ưu tiên sử dụng Selectors ổn định (Stable Locators)

Trước khi viết code, hãy tự hỏi: *Bộ chọn nào ít khả năng thay đổi nhất?*

*   **Best:** `role` và `aria-* attributes`. (Ví dụ: `page.getByRole('button', { name: 'Submit' })`). Các thuộc tính này là semantic và thường được giữ nguyên bởi các dev team, ngay cả khi class ID thay đổi.
*   **Good:** Data Attributes (`data-testid`). Đây là lựa chọn tuyệt vời nhất mà bạn có thể đề xuất với đội phát triển (Dev Team) để thêm vào UI: `<button data-testid="submit-btn">Gửi đi</button>`.

#### 2. Tận dụng tính năng chờ tự động của Playwright

Playwright vốn đã rất mạnh vì nó bao gồm cơ chế chờ (auto-waiting). Khi bạn gọi `page.click()`, Playwright sẽ *tự động đợi* cho đến khi phần tử đó **có thể tương tác được** (enabled and visible) chứ không chỉ là có trong DOM. Điều này giải quyết hầu hết các vấn đề về tốc độ tải cơ bản.

#### 3. Xử lý sự chờ phức tạp với `waitForSelector` và Chờ theo điều kiện

Khi cần đợi một trạng thái cụ thể (ví dụ: loading spinner biến mất, hoặc widget hiển thị dữ liệu), chúng ta cần chỉ định rõ ràng hơn:

```typescript
// Ví dụ: Đợi cho đến khi một bảng dữ liệu được điền xong (sau một API call)
test('Kiểm tra tính khả dụng của báo cáo sau tải', async ({ page }) => {
    await page.click('#load-report-btn'); 

    // Chờ đợi cho đến khi bộ định vị cột 'Tên Khách hàng' xuất hiện và có dữ liệu (ví dụ: không rỗng)
    const clientNameLocator = page.locator('[data-testid="client-name"]');
    await expect(clientNameLocator).toHaveText(/.*customer.*/, { timeout: 15000 });

    // Ví dụ 2: Đợi một class loader bị gỡ bỏ (tốt hơn là chờ nội dung xuất hiện)
    const loadingSpinner = page.locator('.loading-overlay');
    await expect(loadingSpinner).not.toBeVisible(); // Chờ cho đến khi spinner BIẾN MẤT
});
```

#### 4. Tái định vị khi cần thiết (Relocating Elements)

Nếu bạn phải thực hiện nhiều hành động trên cùng một phần tử đã bị thay đổi DOM, đừng giữ biến locator quá lâu. Hãy tạo lại `Locator` ngay trước khi tương tác tiếp theo để đảm bảo tính tươi mới:

```typescript
// Giả sử việc click 'View Details' gây ra việc re-render toàn bộ container cha.
const detailsButton = page.getByTestId('view-details'); 

// Lần 1: Click và trích xuất dữ liệu ban đầu
await detailsButton.click();
const initialLocator = page.locator('.status-badge').first(); // Đây là locator cũ

// ... (Code xử lý tạm thời)

// Lần 2: CẦN TẠO LẠI LOCCATOR CHO PHẦN TỬ ĐỂ TRÁNH STALE ELEMENT ERROR
await detailsButton.click(); // Click lại để đảm bảo ổn định DOM
const refreshedStatusLocator = page.locator('.status-badge').first(); // Tạo lại locator

// Bây giờ mới tương tác với freshwaterLocator
await expect(refreshedStatusLocator).toHaveText('Active'); 
```

***

## III. Tổng kết và lời khuyên từ QE Lead (Hoàng Hiệp)

Để xây dựng một hệ thống E2E testing đạt chuẩn chuyên nghiệp, bạn phải coi POM không chỉ là một công cụ mà là **một phong cách tư duy** trong QA:

1.  **Trừu tượng hóa tối đa:** Không bao giờ để các bước tương tác (như `click`, `fill`) bị phơi bày trực tiếp ở tầng Test Case. Luôn bọc chúng vào các phương thức của Page Object.
2.  **Tối ưu Locator chiến lược:** Hãy kiên trì vận động với đội Dev và Product để áp dụng **`data-testid`** cho tất cả các thành phần quan trọng được test. Điều này sẽ giúp bạn độc lập hoàn toàn khỏi sự thay đổi class name ngẫu nhiên của frontend.
3.  **Tư duy Anti-Fragile:** Hãy luôn nghĩ về những điểm yếu (Failure Points) của UI. Nếu một khu vực thường bị lỗi do Ajax loading, hãy viết các bước kiểm tra đặc biệt để chờ trạng thái *ổn định* thay vì chỉ chờ sự xuất hiện đơn thuần.

Việc áp dụng POM kết hợp với các kỹ thuật xử lý Dynamic Elements không chỉ giúp code test của bạn chạy trơn tru hơn mà còn nâng tầm năng lực chất lượng sản phẩm tổng thể. Chúc các bạn thành công!