---
title: "Playwright E2E Testing nâng cao: Page Object Model và xử lý Dynamic Elements"
date: 2026-06-25
description: "Làm chủ các kỹ thuật kiểm thử E2E bằng Playwright: Triển khai Page Object Model (POM) và chiến lược vững chắc để đối phó với các phần tử động."
tags: ["Automation","Playwright","TypeScript"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hoàng Hiệp"
---

# Playwright E2E Testing nâng cao: Page Object Model và xử lý Dynamic Elements

Xin chào các đồng nghiệp Automation Engineer! Tôi là Hoàng Hiệp.

Trong thế giới của kiểm thử phần mềm hiện đại, khả năng tự động hóa kiểm thử đầu cuối (End-to-End - E2E) bằng Playwright là một lợi thế cực lớn. Tuy nhiên, chỉ biết viết các lệnh `await page.click()` đơn thuần sẽ nhanh chóng đưa bạn vào "bẫy của sự giòn (flakiness)". Các ứng dụng web ngày càng phức tạp với cấu trúc DOM biến đổi liên tục và các phần tử được tải bất đồng bộ (asynchronous).

Nếu bạn đã quen thuộc với việc viết test cơ bản, bài viết này dành cho bạn. Chúng ta sẽ cùng nhau đi sâu vào hai chủ đề cốt lõi để nâng tầm kỹ năng kiểm thử của mình: **Page Object Model (POM)** để đảm bảo tính cấu trúc và khả năng bảo trì, và các chiến lược nâng cao để xử lý **Dynamic Elements** một cách mạnh mẽ.

---

## I. Page Object Model (POM): Kiến trúc cho sự ổn định

### 💡 Vấn đề cần giải quyết

Khi bạn viết các test case mà không tuân thủ POM, mã nguồn của bạn sẽ trở thành một khối lộn xộn gồm hàng trăm dòng lệnh Playwright và các selector trực tiếp nhúng vào logic nghiệp vụ (Business Logic). Điều này gây ra hai vấn đề nghiêm trọng:

1. **Tính tái sử dụng thấp:** Nếu tên hoặc selector của một nút bấm thay đổi, bạn phải sửa code ở *mọi* test case mà nó được sử dụng.
2. **Khó đọc và khó bảo trì:** Các file test quá dài sẽ làm lu mờ logic kiểm thử cốt lõi.

### 🛡️ POM là gì?

POM là một mô hình thiết kế trong đó, chúng ta tạo các lớp (Class) đại diện cho các trang hoặc thành phần giao diện người dùng (UI Components). Mỗi lớp này sẽ chứa:
1. Các selector đã được định nghĩa rõ ràng.
2. Các phương thức (methods) thực hiện các hành vi nghiệp vụ trên trang đó (ví dụ: `loginWithCredentials()`, `navigateToDashboard()`).

### ✍️ Ví dụ minh họa (TypeScript/Playwright)

Giả sử chúng ta có một trang Đăng nhập (`Login Page`). Thay vì viết selectors trực tiếp trong file test, chúng ta sẽ tạo ra lớp riêng.

**1. Tạo Module Components (Selector Definitions):**
*(Best Practice: Tách selector khỏi phương thức để tăng khả năng tái sử dụng)*

```typescript
// src/pages/LoginPage/selectors.ts

export const selectors = {
  usernameInput: '#username',
  passwordInput: '#password',
  loginButton: 'button[type="submit"]', // Sử dụng attribute selector an toàn hơn ID
};
```

**2. Tạo Page Object Class:**

```typescript
// src/pages/LoginPage/Login.page.ts

import { Page, expect } from '@playwright/test';
import { selectors } from './selectors';

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Phương thức hành vi nghiệp vụ (Behavior Method)
  async login(username: string, password: string): Promise<void> {
    console.log("Bắt đầu quy trình đăng nhập...");
    await this.page.fill(selectors.usernameInput, username);
    await this.page.fill(selectors.passwordInput, password);
    // Sử dụng bộ chọn an toàn hơn (ví dụ: text=Login) thay vì chỉ dựa vào class
    await this.page.click(selectors.loginButton); 
  }

  async expectSuccessfulLogin(): Promise<void> {
    // Xác nhận rằng sau khi login, tiêu đề trang có chứa 'Dashboard'
    await expect(this.page).toHaveTitle(/Dashboard/);
  }
}
```

**3. Sử dụng trong Test File:**

```typescript
// tests/auth.spec.ts (File test đã sạch sẽ và tập trung vào logic nghiệp vụ)

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage/Login.page';

test('Kiểm thử đăng nhập thành công', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await page.goto('/login'); // Điều hướng đến trang

  // Chỉ gọi hành vi, không cần biết cách các bước đó được thực hiện!
  await loginPage.login('user@test.com', 'securepassword123');
  
  // Kiểm tra kết quả (Assertion)
  await loginPage.expectSuccessfulLogin(); 
});
```

> **💡 Góc nhìn của Hoàng Hiệp:** Nhờ POM, khi đội Frontend thay đổi ID của trường nhập liệu từ `#username` thành `[data-testid="username"]`, tôi chỉ cần sửa một dòng trong file `selectors.ts`. Hàng trăm lines code test case kia sẽ hoàn toàn không bị ảnh hưởng. Đây chính là sức mạnh bảo trì của kiến trúc này.

---

## II. Xử lý Dynamic Elements: Đối phó với sự bất đồng bộ

Trong thực tế, các trang web hiện đại rất hiếm khi tải mọi thứ cùng một lúc. Các phần tử thường xuất hiện sau một độ trễ (delay), chúng có thể được thêm vào qua AJAX, và đôi khi selector của chúng lại là các class ngẫu nhiên (`class="kj-z3x"`). Đây gọi là **Dynamic Elements**.

Việc cố gắng tương tác với một Dynamic Element chưa sẵn sàng sẽ dẫn đến lỗi `Timeout` hoặc `Element not found`. Playwright cung cấp nhiều cơ chế để giải quyết vấn đề này.

### 🚀 Kỹ thuật 1: Sử dụng Waiters tích hợp của Playwright (Implicit Waiting)

Đây là cách căn bản và hiệu quả nhất. Thay vì dùng `sleep()`, hãy tận dụng khả năng chờ đợi thông minh của Playwright bằng các hàm như `waitForSelector()` hoặc đơn giản là các hành động click/fill mà Playwright tự động thực hiện wait.

```typescript
// KHÔNG NÊN: Chỉ nên sử dụng khi cần thiết và kiểm soát được độ trễ
await page.click('#loading-spinner'); 
await page.waitForTimeout(2000); // Tệ hại, khiến test chạy chậm nếu không cần

// NÊN DÙNG: Playwright tự động chờ selector này sẵn sàng trước khi hành động
await page.fill('#searchbox', 'Laptop X'); // Nếu #searchbox chưa hiện, nó sẽ chờ
```

### 🌐 Kỹ thuật 2: Sử dụng XPath hoặc CSS Selectors theo thuộc tính ổn định (The Robust Selector)

Các class ngẫu nhiên là kẻ thù lớn nhất của automation. Hãy luôn ưu tiên những selector *ít thay đổi* hơn và mang tính ngữ nghĩa hơn.

| Độ Ưu Tiên | Loại Selector | Ví dụ | Lý do nên dùng |
| :---: | :--- | :--- | :--- |
| **Cao nhất** | `data-testid` (Custom Attribute) | `[data-testid="checkout-button"]` | Đây là selector mà đội Dev nên cung cấp cho QA, vì nó không liên quan đến CSS hay cấu trúc giao diện. |
| **Trung bình cao** | ID (`#id`) | `#userProfilePicture` | Nếu ID được thiết lập đúng cách và duy nhất. |
| **Trung bình** | Semantic Selectors | `text=Tải hồ sơ` hoặc `button:has-text("Submit")` | Dựa vào nội dung văn bản, rất mạnh mẽ cho các nút bấm. |
| **Thấp** | Class Name (`.class`) | `.bg-primary.btn` | Rất dễ bị hỏng nếu Dev thay đổi CSS framework. |

### 🌟 Kỹ thuật 3: Xử lý Interacting Elements và WaitFor

Khi bạn cần tương tác với một phần tử mà chỉ hiện ra sau khi một hành động nào đó xảy ra (ví dụ: click nút "Xem chi tiết" -> bảng dữ liệu xuất hiện), hãy sử dụng `waitForSelector()` kết hợp với **Chờ điều kiện**.

```typescript
// Giả định rằng Data Table chứa thông tin sản phẩm sẽ load sau khi bấm nút Xem Chi Tiết
const detailTableSelector = '#product-detail-table'; 

// Chờ bảng dữ liệu xuất hiện trước khi bắt đầu các tương tác trên nó.
await page.waitForSelector(detailTableSelector); 

// Sau đó mới thực hiện hành động (ví dụ: lấy giá trị từ ô thứ hai)
const priceElement = page.locator(`${detailTableSelector} tr:nth-child(2) td:nth-child(3)`);
await expect(priceElement).toBeVisible();
```

---

## III. Tổng hợp: Kết hợp POM và Chiến lược Dynamic Selectors

Sức mạnh thực sự nằm ở việc kết hợp hai kỹ thuật trên. Chúng ta cần một kiến trúc POM vững chắc, nhưng trong các lớp Page Object, chúng ta phải đảm bảo rằng selector được định nghĩa là *robust* nhất có thể.

### Ví dụ Thực hành: Form Tìm kiếm Động (Dynamic Search Form)

Giả sử trang tìm kiếm phức tạp với bộ lọc và kết quả tải bất đồng bộ.

**1. Cập nhật Selector trong POM:**
Thay vì chỉ dùng CSS thuần, chúng ta sẽ xác định cả các loại selector khác nhau.

```typescript
// src/pages/SearchPage/selectors.ts (Cải tiến)

export const selectors = {
  searchQueryInput: '[data-testid="global-search"]', // Luôn ưu tiên data-test
  filterDropdown: 'div[role="listbox"]',             // Dùng ARIA role để tìm bộ lọc
  resultListContainer: '.product-grid > div',        // Lớp container cho các kết quả sản phẩm
  itemCardTitle: ':has(h3)',                        // Selector phức tạp hơn, ví dụ: tìm thẻ H3 bên trong card nào đó
};

export class SearchPage {
    // ... constructor và page property
    async searchForProduct(query: string): Promise<void> {
        await this.page.fill(selectors.searchQueryInput, query);
        await this.page.click('#submit-search'); // Giả sử nút submit có ID ổn định
    }

    // Phương thức này phải chờ đợi một danh sách kết quả tải xong
    async getAvailableProductTitles(): Promise<string[]> {
      console.log("Chờ container chứa sản phẩm xuất hiện...");
      await this.page.waitForSelector(selectors.resultListContainer, { state: 'attached' });

      // Lấy tất cả các tiêu đề trong container đã load
      const elements = await this.page->locator(`${selectors.resultListContainer} h3`).allTextContents();
      return elements;
    }
}
```

**2. Test Case Cuối cùng (Tự tin và hiệu quả):**

File test của bạn giờ đây không chỉ sạch hơn mà còn có khả năng chịu lỗi cao, vì nó đã tích hợp các chiến lược chờ đợi và selector robust vào chính các phương thức POM.

---

## Lời kết từ Hoàng Hiệp

Kiểm thử E2E là việc mô phỏng trải nghiệm người dùng thật nhất, do đó, nó luôn là nơi gặp nhiều thách thức về mặt kỹ thuật hơn bất kỳ loại test nào khác.

Hãy ghi nhớ ba nguyên tắc vàng sau để trở thành một QE Lead thực thụ:

1. **Tư duy Kiến trúc (POM):** Luôn tách biệt giữa *Hành vi nghiệp vụ* (Business Logic - nằm trong Test file) và *Chi tiết kỹ thuật giao diện* (Implementation Details - nằm trong POM/Selectors).
2. **Ưu tiên Selector:** Không bao giờ tin tưởng vào Class Name hoặc thẻ HTML mà đội Dev không cố ý thêm vào. Hãy yêu cầu họ sử dụng `data-testid`.
3. **Không Giả định Tốc độ:** Thay vì giả định một hành động sẽ diễn ra ngay lập tức, hãy luôn hỏi: "Điều kiện nào phải được thỏa mãn trước khi tôi thực hiện bước này?" (Sử dụng `waitFor` và các cơ chế chờ điều kiện của Playwright).

Chúc các bạn thành công trong việc xây dựng những bộ test E2E bền vững và hiệu suất cao! Nếu có bất kỳ thắc mắc nào về thiết kế framework automation, đừng ngần ngại trao đổi với tôi.