---
title: "Playwright E2E Testing nâng cao: Page Object Model và xử lý Dynamic Elements"
date: 2026-06-24
description: "Khám phá các kỹ thuật nâng cao trong Playwright để xây dựng bộ test bền vững với POM và cách chinh phục các phần tử động (Dynamic Elements)."
tags: ["Automation","Playwright","TypeScript"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hoàng Hiệp"
---

# Playwright E2E Testing nâng cao: Page Object Model và xử lý Dynamic Elements

Chào các đồng nghiệp và những người yêu thích Automation! Tôi là Hoàng Hiệp, một chuyên viên QE (Quality Engineer) đã dành nhiều năm tháng để tối ưu hóa quy trình kiểm thử tự động.

Trong hành trình xây dựng hệ thống E2E Test (End-to-End Testing), tôi nhận thấy rằng sự khác biệt giữa một bộ test hoạt động và một bộ test *bền vững* nằm ở kiến thức áp dụng các mô hình thiết kế chất lượng cao. Hôm nay, chúng ta sẽ đi sâu vào hai chủ đề cực kỳ quan trọng: **Page Object Model (POM)** để cấu trúc code sạch, và cách xử lý bài bản với các **Dynamic Elements** vốn là nỗi ám ảnh của mọi Tester Automation.

Nếu bạn đã từng gặp tình trạng test bị break bất cứ khi nào UI thay đổi một chút, thì những kiến thức dưới đây chính là "cứu cánh" cho bộ test của bạn đấy!

---

## I. Tại sao chúng ta cần Page Object Model (POM)?

### 💡 Vấn đề: Code Spaghetti và Tính Bảo Trì Thấp
Khi dự án Automation lớn lên, nếu tất cả các bước tương tác với UI được viết trực tiếp trong một file test (`test.spec.ts`), code sẽ nhanh chóng trở thành "Spaghetti Code." Việc tìm kiếm selector bị lỗi, cập nhật vị trí nút bấm (button), hay thậm chí là thay đổi luồng nghiệp vụ sẽ cực kỳ tốn kém và dễ gây nhầm lẫn.

### ✨ Giải pháp: Page Object Model
POM là một mẫu thiết kế (Design Pattern) trong Testing Automation. Nguyên tắc cốt lõi là **tách biệt hoàn toàn Logic Test (Test Script)** khỏi **Logic Tương tác UI (Element Interaction)**.

Thay vì cho phép mỗi file test chứa cả code xác nhận điều kiện *và* các selector của trang, ta sẽ tạo ra các lớp (Classes) riêng biệt đại diện cho từng trang hoặc một module lớn trên ứng dụng (ví dụ: `LoginPage`, `ProductDetailsPage`).

#### 🛠️ Triển khai POM với Playwright và TypeScript

Hãy xem qua cách áp dụng thực tế. Giả sử chúng ta có trang Đăng nhập (`/login`).

**Bước 1: Tạo Page Object Class**
Tạo file `pages/LoginPage.ts`. File này chỉ chứa các phương thức tương tác (methods) của trang đăng nhập.

```typescript
// pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
    readonly page: Page;
    // Sử dụng readonly properties cho các locator tĩnh và tái sử dụng
    private usernameInput: Locator = this.page.locator('#username');
    private passwordInput: Locator = this.page.locator('#password');
    private loginButton: Locator = this.page.locator('button[type="submit"]');

    constructor(page: Page) {
        this.page = page;
    }

    /**
     * @description Phương thức nhập thông tin và click nút đăng nhập.
     * @param username Tên người dùng
     * @param password Mật khẩu
     */
    public async login(username: string, password: string): Promise<void> {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }

    /**
     * @description Kiểm tra xem thành công đăng nhập hay chưa (Chỉ là ví dụ).
     */
    public async isDashboardVisible(): Promise<boolean> {
        // Giả sử sau khi login, sẽ chuyển hướng đến một element có ID "dashboard-header"
        return await this.page.locator('#dashboard-header').isVisible();
    }
}
```

**Bước 2: Tái cấu trúc Test File (Test Script)**
Bây giờ, file test của chúng ta chỉ tập trung vào **kịch bản nghiệp vụ (Business Scenario)**, không bao giờ cần quan tâm đến `#username` hay `button[type="submit"]`.

```typescript
// tests/login.spec.ts
import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test('Should allow user to log in successfully', async ({ page }) => {
    // 1. Khởi tạo Page Object cho trang Login
    const loginPage = new LoginPage(page);

    // 2. Thực hiện hành động nghiệp vụ: Truy cập và Đăng nhập
    await page.goto('/login');
    await loginPage.login('testuser', 'securepass123'); // Chỉ gọi phương thức!

    // 3. Xác minh kết quả (Asserts)
    const dashboardVisible = await loginPage.isDashboardVisible();
    expect(dashboardVisible).toBeTruthy(); 
});
```

> **💡 Góc Nhìn Của Hoàng Hiệp:** Bằng cách này, nếu Dev thay đổi selector từ `id="username"` thành `data-test-id="user"`, chúng ta chỉ cần sửa một nơi duy nhất: trong file `LoginPage.ts`. Toàn bộ các test case khác đều hoạt động bình thường! Đây chính là bản chất của tính **Bền Vững (Maintainability)**.

---

## II. Chinh phục Dynamic Elements: Nghệ thuật chờ đợi và Xác định phần tử

Các ứng dụng hiện đại, đặc biệt là những trang SPA (Single Page Application) sử dụng AJAX/API calls liên tục, luôn tạo ra các *Dynamic Elements*. Các element này có thể xuất hiện sau một độ trễ ngẫu nhiên (random delay), được tạo ra bằng JS, hoặc có selector thay đổi theo ID session.

Việc cố gắng tương tác với chúng bằng `await page.waitForSelector()` đơn thuần thường là chưa đủ và kém hiệu quả. Chúng ta cần phương pháp thông minh hơn.

### 🎭 Vấn đề 1: Độ trễ ngẫu nhiên (Stale Element Reference)
Khi một element được tạo ra, thay đổi hoặc bị xóa khỏi DOM *trước* khi code của bạn kịp tương tác, Playwright sẽ ném lỗi `Element is detached from DOM`.

**Giải pháp:** Không nên tin tưởng vào selector tĩnh. Chúng ta phải chờ đợi **Trạng thái (State)** mong muốn chứ không chỉ là sự tồn tại của Selector.

### 🚀 Kỹ thuật Nâng Cao I: Sử dụng Locator và Assertions
Thay vì dùng các lời gọi `page.waitFor*()`, hãy để Playwright xử lý việc chờ đợi thông qua các phương thức tương tác với `Locator`.

**Ví dụ Tệ:**
```typescript
// KHÔNG nên làm thế này nếu muốn code "smart" hơn
await page.waitForSelector('#item-list > div:nth-child(3)'); 
await page.click('#item-list > div:nth-child(3) button'); // Dễ bị stale element
```

**Ví dụ Tốt (Sử dụng Locator và Async Assertions):**
Hãy sử dụng `locator` kết hợp với các hàm chờ tích hợp của Playwright.

```typescript
// Sử dụng .waitFor() hoặc .getByText()/getByRole()
const productLocator = page.getLocator('div[data-product-id="XYZ"]'); 

// Chờ đến khi locator này hiển thị (tức là DOM đã sẵn sàng)
await productLocator.waitFor({ state: 'visible', timeout: 10000 }); 

// Sau đó, thao tác trên nó an toàn hơn nhiều
await productLocator.getByRole('button', { name: 'Add to Cart' }).click();
```
> **🔥 Lưu Ý:** Luôn ưu tiên sử dụng Selector có ngữ nghĩa (Semantic Selectors) như `role` hoặc `aria-label` thay vì CSS path phức tạp (`div:nth-child(3)`).

### 🧩 Kỹ thuật Nâng Cao II: Xử lý Dynamic Content theo Điều kiện
Đây là kịch bản khó nhất: Khi một list của các mặt hàng được load từ API, và bạn muốn click vào item thứ 5 *chỉ khi* danh sách đó đã chứa ít nhất 5 phần tử.

Chúng ta sẽ kết hợp sức mạnh của `locator` với hàm chờ có điều kiện (Conditional Waiting).

```typescript
// Giả sử chúng ta đang nằm trên trang Danh mục sản phẩm
async function waitForSpecificItem(page: Page, index: number): Promise<Locator> {
    const container = page.locator('.product-grid'); 
    
    // Cách tiếp cận mạnh mẽ nhất: Truy cập trực tiếp bằng nth() của Locator 
    // Playwright sẽ tự động xử lý việc chờ đợi element này xuất hiện và sẵn sàng tương tác.
    const itemLocator = container.getByRole('article').nth(index);

    // Tuy nhiên, nếu muốn chắc chắn nó *tồn tại* trước khi truy cập:
    try {
        await itemLocator.waitFor({ state: 'attached', timeout: 15000 });
        return itemLocator;
    } catch (error) {
        throw new Error(`Timeout chờ phần tử ở vị trí ${index}. Có thể list quá ngắn hoặc không tải.`);
    }
}

// --- Sử dụng trong test case ---
test('Should handle dynamic product listing', async ({ page }) => {
    await page.goto('/products');
    
    const targetItem = await waitForSpecificItem(page, 4); // Lấy item thứ 5 (index 4)
    
    // Bây giờ ta có thể tương tác an toàn với nó:
    await targetItem.getByText('Laptop X').click(); 
});
```

---

## Tóm Kết Từ QE Lead Hoàng Hiệp

Để tổng kết lại, nếu bạn muốn xây dựng một bộ E2E Test không chỉ chạy được mà còn phải **Bền bỉ và Dễ Bảo trì (Robust & Maintainable)**, hãy nhớ theo checklist này:

1.  **Sử dụng POM:** Luôn luôn tách biệt tầng test logic khỏi tầng tương tác UI bằng cách tạo các Page Object Class riêng.
2.  **Ưu tiên Selector có ngữ nghĩa:** Thay thế CSS Path phức tạp bằng `data-test-id`, `role`, hoặc thuộc tính `aria-*`. Đây là "nguyên tắc vàng" của việc viết Automation.
3.  **Tư duy về Trạng thái (State):** Đừng chỉ chờ selector tồn tại (`visible`), hãy chờ nó ở trạng thái tương tác được mong muốn, và luôn sử dụng các công cụ bất đồng bộ (async/await) một cách hiệu quả nhất Playwright cung cấp.

Chúc các bạn thành công trong việc xây dựng những hệ thống Automated Testing đẳng cấp quốc tế! Nếu có thắc mắc nào về Performance hoặc Design Pattern, đừng ngần ngại trao đổi với tôi nhé.