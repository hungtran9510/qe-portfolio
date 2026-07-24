---
title: "Kiểm thử Accessibility (a11y) tự động trong React với axe-core và Playwright"
date: 2026-06-25
description: "Hướng dẫn chuyên sâu cách tích hợp kiểm thử Accessibility bằng axe-core vào quy trình test E2E của React/Playwright, đảm bảo sản phẩm thân thiện với mọi người dùng."
tags: ["Accessibility","React","Playwright"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# Kiểm thử Accessibility (a11y) tự động trong React với axe-core và Playwright

Xin chào các đồng nghiệp trên hành trình phát triển chất lượng phần mềm! Tôi là Duy Trung, một chuyên gia QE Lead.

Trong thế giới của ứng dụng web hiện đại – đặc biệt là khi chúng ta xây dựng bằng các framework component-based như React – việc đảm bảo tính năng (functionality) hoạt động trơn tru chỉ là nửa trận chiến. Nửa còn lại, nhưng không kém phần quan trọng, chính là **Tính khả dụng (Accessibility - a11y)**.

Một ứng dụng tuyệt vời mà người khuyết tật không thể sử dụng được thì bản chất vẫn chưa hoàn thiện. Nếu chúng ta dừng việc kiểm thử a11y ở việc "nhìn và đoán," chúng ta đang bỏ qua rủi ro lớn về trải nghiệm người dùng, tuân thủ pháp lý (legal compliance) và thương hiệu của công ty.

Bài viết này không chỉ là một bài hướng dẫn, mà còn là bản roadmap chuyên sâu để các bạn hiểu cách tích hợp kiểm thử a11y tự động vào bộ test End-to-End (E2E) hiện tại của mình, cụ thể với bộ đôi mạnh mẽ: **`axe-core`** và **Playwright**.

---

## 💡 Phần I: Tại sao phải kết hợp Axe-core và Playwright?

Để hiểu được giải pháp, chúng ta cần nắm rõ vai trò của từng thành phần:

### 1. React (The Application Layer)
React giúp chúng ta xây dựng giao diện người dùng theo kiến trúc component. Vấn đề là, khi React cập nhật trạng thái (state), DOM sẽ thay đổi một cách động (dynamically). Các công cụ kiểm thử tĩnh chỉ quét được cái "ảnh chụp" ban đầu, bỏ sót những lỗi a11y xuất hiện sau các tương tác người dùng phức tạp.

### 2. Playwright (The Execution Engine)
Playwright là framework tự động hóa E2E vượt trội. Nó cho phép chúng ta mô phỏng chính xác hành vi của người dùng thật: click chuột, chờ đợi AJAX response, và quan trọng nhất – **quét DOM tại những thời điểm cụ thể trong luồng hoạt động.**

### 3. axe-core (The Auditor)
`axe-core` là một thư viện kiểm thử a11y hàng đầu được hỗ trợ bởi Deque. Nó không chỉ đưa ra cảnh báo, mà còn cho biết **vì sao** nó lại coi đó là lỗi và đề xuất cách khắc phục. Nó hoạt động bằng cách thực hiện các quy tắc WCAG (Web Content Accessibility Guidelines) trên DOM.

**Sự kết hợp:** Playwright cung cấp môi trường trình duyệt và khả năng tương tác theo thời gian; `axe-core` cung cấp "bộ mắt" chuyên nghiệp để quét toàn bộ nội dung đó dưới góc độ người khuyết tật.

---

## 🔬 Phần II: Hướng dẫn Tích hợp Kỹ thuật (The Hands-On Part)

Giả sử bạn đã có một dự án React/Playwright cơ bản. Đây là các bước kỹ thuật để tích hợp a11y testing.

### Bước 1: Cài đặt Dependencies

Chúng ta cần cả `axe-core` và chắc chắn rằng chúng ta đang sử dụng phiên bản Playwright hỗ trợ việc đánh giá DOM.

```bash
# Chỉ cài axe-core vì nó là công cụ audit, không phải thư viện UI
npm install axe-core --save-dev 
```

### Bước 2: Xây dựng Hàm Audit (The Helper Function)

Chúng ta sẽ tạo một hàm wrapper để encapsulation logic kiểm thử a11y. Thay vì gọi `axe-core` trực tiếp trong file test, chúng ta nên bọc nó vào một utility function.

Vì Playwright chạy trong môi trường Node.js và việc truy cập DOM cần thực thi bên trong trình duyệt (context), chúng ta phải sử dụng `page.evaluate()` để đưa mã JavaScript của mình xuống Client-Side để quét hiệu quả nhất.

**`src/utils/a11yChecker.ts`**

```typescript
import { Page, expect } from '@playwright/test';
import * as axe from 'axe-core'; // Import axe-core type definition

/**
 * Hàm thực hiện kiểm tra accessibility bằng axe-core tại một element hoặc toàn bộ trang.
 * @param page - Đối tượng Playwright page.
 * @param selector - Selector CSS cần audit (ví dụ: '#main-content'). Sử dụng 'body' để quét toàn bộ trang.
 */
export async function checkA11y(page: Page, selector: string = 'body'): Promise<void> {
    console.log(`\n--- Running A11y Audit on selector: ${selector} ---`);

    // Sử dụng page.evaluate() để thực thi axe-core bên trong context của trình duyệt
    const results = await page.evaluate(async (sel) => {
        // Lấy container DOM cần kiểm tra
        const targetElement = document.querySelector(sel);
        if (!targetElement) {
            throw new Error(`Selector "${sel}" not found.`);
        }

        // Chạy axe-core trên element đã chọn
        await axe.run(targetElement, { 
             rules: [{ id: 'aria-label', enabled: true }] // Tùy chọn: Bật/tắt rules cụ thể
        });
        
        return axe.get(document); // Trả về kết quả global audit (hoặc có thể qua targetElement)
    }, selector);

    // Playwright test assertion: Kiểm tra xem có lỗi nào được tìm thấy không
    if (results && results.violations.length > 0) {
        const violationSummary = results.violations.map(v => 
            `Lỗi ${v.id}: ${v.description} (Severity: ${v.impact})`
        ).join('\n');

        console.error("🛑 ACCESSIBILITY VIOLATIONS FOUND!");
        console.log("-----------------------------------------");
        console.log(violationSummary); 
        
        // Thất bại test nếu tìm thấy lỗi a11y
        expect(results.violations).toHaveLength(0, `Accessibility violation detected for selector "${selector}"`);

    } else {
        console.log("✅ A11y Check Passed! Không phát hiện vi phạm WCAG nào.");
    }
}
```

### Bước 3: Viết Test Case (The Implementation)

Bây giờ, chúng ta tích hợp hàm `checkA11y` này vào các file test của Playwright. Chúng ta không chỉ kiểm thử chức năng mà còn "kích hoạt" tính khả dụng sau mỗi luồng tương tác quan trọng.

**`__tests__/feature/LoginForm.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';
import { checkA11y } from '../../utils/a11yChecker'; 
// Giả sử có một trang đăng nhập
const LOGIN_URL = 'http://localhost:3000/login';

test.describe('Login Feature - E2E Test Suite', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto(LOGIN_URL);
    });

    // === KỊCH BẢN 1: Tải trang và Kiểm tra a11y ban đầu (Initial Load) ===
    test('Should load form and pass initial a11y checks', async ({ page }) => {
        // Hành động chức năng thông thường
        await page.waitForSelector('#username');

        // !!! BƯỚC QUAN TRỌNG: Chạy kiểm tra A11y trên toàn bộ body sau khi trang load 
        // và trước khi thực hiện bất kỳ tương tác nào khác
        await checkA11y(page, 'body');
    });


    // === KỊCH BẢN 2: Tương tác phức tạp (Form Submission) ===
    test('Should successfully submit form and re-check a11y upon success', async ({ page }) => {
        const usernameInput = '#username';
        const passwordInput = '#password';

        // 1. Mô phỏng tương tác người dùng
        await page.fill(usernameInput, 'user@test.com');
        await page.fill(passwordInput, 'securePassword123');
        await page.click('#login-button');

        // 2. Chờ đợi trang chuyển hướng hoặc hiển thị thành công
        await page.waitForURL('**/dashboard');
        
        // 3. !!! BƯỚC QUAN TRỌNG: Quét A11y trên Dashboard sau khi trạng thái đã thay đổi (Dynamic Content)
        // Đây là nơi nhiều ứng dụng thất bại vì thiếu bước kiểm tra sau AJAX/SPA routing.
        await checkA11y(page, 'body'); 
    });

     // === KỊCH BẢN 3: Xử lý lỗi (Error Handling) ===
    test('Should display error message and maintain a11y after failure', async ({ page }) => {
        await page.fill('#username', 'invaliduser');
        await page.fill('#password', 'wrongpass');
        await page.click('#login-button');

        // Chờ đợi thông báo lỗi hiện ra (ví dụ: div có id 'error-message')
        const errorMessageSelector = '#error-message';
        await page.waitForSelector(errorMessageSelector);

        // !!! BƯỚC QUAN TRỌNG: Quét A11y đặc biệt tập trung vào khu vực thông báo lỗi.
        // Nếu thông báo lỗi không có role hoặc tiêu đề phù hợp, test này sẽ bắt được nó.
        await checkA11y(page, errorMessageSelector); 
    });
});

```

---

## ✨ Phần III: Góc Nhìn Chuyên Gia QE Lead (Best Practices & Tips)

Là một chuyên gia QE, tôi muốn chia sẻ thêm ba điểm cực kỳ quan trọng khi áp dụng kỹ thuật này để đảm bảo hiệu quả tối đa.

### 🎯 Tip 1: Kiểm thử tại các điểm "Thay đổi trạng thái"
Hầu hết người mới làm test E2E chỉ kiểm tra DOM lúc ban đầu. Nhưng trong React/SPA, điều tồi tệ nhất là những gì xảy ra sau khi user click vào nút X (ví dụ: một modal bật lên, hoặc thông báo lỗi hiện ra).

**Nguyên tắc:** Bất cứ khi nào dữ liệu được tải bất đồng bộ (Async Load) hoặc DOM thay đổi do tương tác người dùng, bạn PHẢI chèn lệnh `await checkA11y(page, selector)` ngay sau khi sự thay đổi đó hoàn tất.

### 🛡️ Tip 2: Phân vùng Kiểm thử A11y
Đừng cố gắng audit toàn bộ trang bằng một câu lệnh duy nhất. Hãy biết rằng mỗi khu vực có vai trò khác nhau:
*   **Toàn bộ Body:** Dành để kiểm tra cấu trúc ngữ nghĩa (Semantic Structure) chung của trang.
*   **Container Form (`#login-form`):** Tập trung kiểm tra các trường nhập liệu, nhãn (labels), và validation messages.
*   **Modal/Dialog:** Kiểm tra `role="dialog"` và khả năng focus trapping khi modal mở ra.

Bằng cách chọn selector cụ thể, chúng ta giúp báo cáo lỗi a11y trở nên **cụ thể hóa cao hơn**, dễ dàng debug hơn rất nhiều.

### ⌛ Tip 3: Xử lý Timing (Synchronization)
Hãy nhớ rằng `axe-core` chỉ quét những gì đã được render ra DOM. Nếu bạn gọi `checkA11y()` quá sớm, trước khi React kịp mount component mới hoặc sau khi API response chưa đến, thì kết quả audit sẽ bị sai.

**Giải pháp:** Luôn sử dụng các hàm chờ đợi mạnh mẽ của Playwright như `await page.waitForSelector(selector)` hoặc `await expect(locator).toBeVisible()` *trước* khi bạn gọi bất kỳ lệnh audit nào. Điều này đảm bảo rằng môi trường kiểm thử đã ổn định và hoàn chỉnh về mặt DOM.

---

## 🚀 Kết Luận

Kiểm thử Accessibility không phải là một bước kiểm thử "nên làm," mà nó là **yêu cầu bắt buộc** của chất lượng sản phẩm hiện đại và trách nhiệm đạo đức kinh doanh. Bằng việc tích hợp `axe-core` vào bộ test E2E Playwright, chúng ta không chỉ giảm thiểu rủi ro lỗi *sau này*, mà còn xây dựng một "tấm lưới an toàn" tự động (Automated Safety Net) ngay trong pipeline CI/CD của mình.

Chúc các bạn thành công và luôn nhớ: Chất lượng tuyệt vời phải là chất lượng cho MỌI NGƯỜI!

*Duy Trung.*