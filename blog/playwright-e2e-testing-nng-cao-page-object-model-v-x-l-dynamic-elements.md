---
title: "Playwright E2E Testing nâng cao: Page Object Model và xử lý Dynamic Elements"
date: 2026-06-25
description: "Nắm vững Playwright E2E testing với kiến trúc POM chuyên nghiệp và các kỹ thuật xử lý phần tử động, giảm thiểu lỗi Test Flakiness."
tags: ["Automation","Playwright","TypeScript"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hoàng Hiệp"
---

# Playwright E2E Testing nâng cao: Page Object Model và xử lý Dynamic Elements

**Tác giả:** Hoàng Hiệp - QE Lead
**Ngày xuất bản:** 25 tháng 6 năm 2026

***

Trong kỷ nguyên phát triển phần mềm liên tục (CI/CD), việc đảm bảo chất lượng trải nghiệm người dùng (User Experience) qua các giao diện phức tạp là tối quan trọng. Automated End-to-End (E2E) Testing chính là lá chắn vững chắc nhất. Với sự ra mắt của Playwright, chúng ta có một công cụ mạnh mẽ với khả năng hỗ trợ đa trình duyệt và tốc độ vượt trội.

Tuy nhiên, chỉ biết viết các lệnh `page.click()` liên tục là chưa đủ để trở thành một Kỹ sư QE (Quality Engineer) thực thụ. Để xây dựng một hệ thống kiểm thử tự động **có tính mở rộng (scalable)**, **dễ bảo trì (maintainable)** và đặc biệt là **ít lỗi giật (flaky)**, chúng ta cần làm chủ hai kỹ thuật nâng cao: **Page Object Model (POM)** và xử lý các **Dynamic Elements**.

Bài viết này sẽ đi sâu vào kiến trúc giải quyết những thách thức đó.

---

## 💡 Phần I: Tại sao cần Page Object Model (POM)?

Khi hệ thống kiểm thử của chúng ta phát triển lên quy mô lớn, bạn sẽ gặp phải một vấn đề chung: các Test Case bắt đầu trở nên dài dòng, lặp lại nhiều selector và logic tương tác giống nhau. Nếu giao diện người dùng thay đổi dù chỉ là việc đổi ID của một nút bấm, hàng chục bài test có thể bị hỏng cùng lúc.

Đây chính là lý do chúng ta cần áp dụng **Page Object Model (POM)**.

### 📚 POM là gì?

Về bản chất, POM yêu cầu bạn tạo ra một lớp (Class) đại diện cho từng trang hoặc thành phần giao diện lớn trên ứng dụng của mình. Các lớp này không chỉ chứa các selector (selectors) mà còn gói gọn các **phương thức tương tác (methods)** mà người dùng sẽ thực hiện trên trang đó.

**Mục tiêu chính:** Tách biệt hoàn toàn logic kiểm thử (Test Logic) khỏi chi tiết giao diện (UI Details/Selectors).

### 📐 Ví dụ Minh họa: Triển khai POM với Playwright và TypeScript

Giả sử chúng ta có một trang Đăng nhập (`LoginPage`). Thay vì viết selector trực tiếp trong Test File, chúng ta tạo một lớp riêng.

**1. Tạo Page Object Class:** `pages/LoginPage.ts`

```typescript
import { Page, Locator } from '@playwright/test';

export class LoginPage {
    readonly page: Page;
    // Định nghĩa selectors và lưu trữ chúng dưới dạng properties
    private readonly usernameInput: Locator = this.page.locator('#username');
    private readonly passwordInput: Locator = this.page.locator('#password');
    private readonly loginButton: Locator = this.page.locator('button[type="submit"]');

    constructor(page: Page) {
        this.page = page;
    }

    // Phương thức tương tác (Action Method)
    async navigateToLoginPage() {
        await this.page.goto('/login');
    }

    // Abstracting the Login Logic
    async loginAs(username: string, password: string): Promise<void> {
        console.log("Executing login sequence...");
        await this.usernameInput.fill(username); // Hành động 1
        await this.passwordInput.fill(password); // Hành động 2
        await this.loginButton.click(); // Hành động 3
    }
}
```

**2. Sử dụng trong Test File:** `tests/auth.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test('Should successfully log in with valid credentials', async ({ page }) => {
    // Khởi tạo Page Object
    const loginPage = new LoginPage(page); 

    await loginPage.navigateToLoginPage(); // Chỉ gọi hàm, không cần biết cách nó đi đến trang nào
    
    // Thực thi hành động qua phương thức đã được đóng gói
    await loginPage.loginAs('testuser', 'securepass123'); 
    
    // Kiểm tra kết quả sau khi thoát khỏi lớp POM (ví dụ: chuyển hướng)
    await expect(page).toHaveURL('/dashboard'); 
});
```

#### Phân tích của Hoàng Hiệp:

*   **Tính sạch sẽ (Cleanliness):** File `auth.spec.ts` giờ đây rất dễ đọc, nó kể một câu chuyện về các hành động test ("Navigate -> Login -> Assert"). Logic nghiệp vụ hoàn toàn tách khỏi selector `#username`.
*   **Bảo trì (Maintainability):** Nếu ID của ô nhập tên người dùng thay đổi từ `#username` thành `input[name="user"]`, bạn chỉ cần sửa **một dòng code** trong file `LoginPage.ts`. Toàn bộ các Test Case đang sử dụng lớp này sẽ tự động được cập nhật mà không cần chỉnh sửa bất kỳ hàm test nào.

---

## 🌪️ Phần II: Đối phó với Dynamic Elements - Bài toán của mọi QE

Trong thế giới thực, ứng dụng rất hiếm khi tĩnh. Các element như thông báo popup (notifications), các thành phần tải bằng AJAX, hoặc các danh sách kết quả được lọc theo thời gian thực đều là **Dynamic Elements**. Đây là nguồn gốc chính gây ra hiện tượng *Test Flakiness* – bài test đôi khi pass, đôi khi fail mà không có lý do rõ ràng.

Làm thế nào để Playwright xử lý chúng một cách "thông minh"?

### 🚀 Nguyên tắc vàng: Không nên chỉ dựa vào `await page.waitForTimeout(3000)`!

Sử dụng `sleep()` hay `setTimeout` là phương pháp thủ công, cực kỳ tệ hại vì nó làm chậm test và không đảm bảo element thực sự đã sẵn sàng (có thể đến sau 1 giây thay vì 3).

Playwright đã được thiết kế với các cơ chế chờ đợi thông minh hơn nhiều. Bạn phải tận dụng chúng:

### Kỹ thuật 1: Chờ đợi Sự hiện diện của Element (`await expect(locator).toBeVisible()`)

Đây là cách tốt nhất để đảm bảo element không chỉ tồn tại trong DOM mà còn *hiển thị* và sẵn sàng tương tác.

```typescript
// Sai/Thứ cấp: Chỉ kiểm tra xem selector có trả về cái gì đó hay không
// await page.waitForSelector('.dynamic-result') 

// ✅ Đúng nhất: Chờ đến khi element thực sự hiển thị và khả dụng cho hành động
await expect(page.locator('.dynamic-result')).toBeVisible();

// Sau đó mới tương tác
await page.locator('.dynamic-result').click();
```

### Kỹ thuật 2: Xử lý Selector Phức tạp (Pseudo-selectors & XPath)

Khi một element được bọc trong nhiều lớp dynamic, việc chọn selector cần phải chính xác. Hãy kết hợp các bộ chọn càng cụ thể càng tốt.

**Ví dụ:** Một nút bấm luôn nằm sau khi thanh tải AJAX biến mất.
```typescript
// Sử dụng Playwright Locator và chờ sự biến mất của loader trước
const loader = page.locator('#loading-spinner');
await expect(loader).toBeHidden(); // Chờ cho đến khi spinner không còn hiển thị

// Sau đó mới tìm nút bấm (hiện tại đã sẵn sàng)
await page.getByRole('button', { name: 'Submit' }).click(); 
```

### Kỹ thuật 3: Xử lý Danh sách động (List Rendering/Virtual Scrolling)

Khi bạn làm việc với các bảng dữ liệu lớn hoặc danh sách cuộn ảo, selector CSS truyền thống có thể không hoạt động. Bạn cần sử dụng kỹ thuật **Chờ theo số lượng** (`Locator` count).

Giả sử chúng ta muốn chờ 5 mục kết quả được tải:
```typescript
// Lấy Locator chung cho mỗi item trong danh sách
const listItemLocator = page.locator('.data-list-item');

// Chờ đợi tối đa 10 giây, và kiểm tra xem locator này có ít nhất N phần tử không.
await expect(listItemLocator).toHaveCount(5); 
```

#### Tóm tắt cách tiếp cận Dynamic Elements của Hoàng Hiệp:

| Vấn đề | Cách giải quyết nên dùng | Hàm Playwright/Best Practice |
| :--- | :--- | :--- |
| **Element chưa kịp tải** | Chờ đợi trạng thái (State Waiting) | `await expect(locator).toBeVisible()` hoặc `.toHaveCount(N)` |
| **Tương tác cần chờ sự kiện** | Sử dụng Listener / Actionability Check | `await page.waitForSelector()` + Kiểm tra hành vi (Click/Fill) |
| **Phụ thuộc nhiều selector** | Giữ POM ở lớp thành phần (Component Layer) | Tách các component UI nhỏ thành một "Sub-Page Object" riêng |

---

## 📝 Kết luận và Best Practices từ Hoàng Hiệp

Xây dựng hệ thống E2E Testing không chỉ là chạy code, mà còn là kiến trúc hóa quy trình kiểm thử.

Để nâng cao khả năng kiểm test của bạn lên cấp độ chuyên nghiệp (QE Lead Level), hãy ghi nhớ các nguyên tắc sau:

1.  **Tầng trừu tượng (Abstraction Layer):** Luôn luôn sử dụng POM. Đừng bao giờ để selector và hành động nghiệp vụ lẫn lộn trong file Test Case chính.
2.  **Ưu tiên Độ tin cậy:** Khi đối mặt với Dynamic Elements, hãy chuyển tư duy từ "Waiting" sang **"Assertion on State"**. Thay vì chờ thời gian, bạn phải chờ một *điều kiện* nào đó được thỏa mãn (`expect(locator).toBeVisible()`).
3.  **TypeScript là Vua:** Sử dụng TypeScript để khai báo rõ ràng kiểu dữ liệu cho các tham số đầu vào và hành động của các phương thức trong POM. Điều này giúp phát hiện lỗi compile-time, tiết kiệm rất nhiều thời gian debug runtime.

Hãy biến hệ thống kiểm test tự động của bạn thành một tài sản kiến trúc (Architectural Asset), chứ không chỉ là một tập hợp các đoạn script chạy tuần tự. Chúc các bạn xây dựng được những bộ test cực kỳ vững chắc!