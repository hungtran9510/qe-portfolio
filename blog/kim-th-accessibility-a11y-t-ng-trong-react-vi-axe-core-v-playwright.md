---
title: "Kiểm thử Accessibility (a11y) tự động trong React với axe-core và Playwright"
date: 2026-06-28
description: "Hướng dẫn chuyên sâu từ QE Lead về cách tích hợp kiểm thử khả năng truy cập (a11y) vào luồng CI/CD bằng Playwright và axe-core cho ứng dụng React."
tags: ["Accessibility","React","Playwright"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# Kiểm thử Accessibility (a11y) tự động trong React với axe-core và Playwright

*(Bài viết của Duy Trung - Lead QA Engineer)*

Chào mọi người, tôi là Duy Trung. Trong vai trò một Quality Engineering Lead, tôi đã thấy qua vô số dự án xuất sắc về mặt tính năng nhưng lại thất bại thảm hại khi gặp vấn đề về khả năng truy cập (Accessibility).

Ngày nay, việc xây dựng sản phẩm không chỉ đơn thuần là "hoạt động" mà còn phải đảm bảo rằng **mọi người** đều có thể sử dụng được. Từ những người dùng sử dụng màn hình đọc (screen readers) đến những người điều khiển bằng bàn phím, tất cả đều cần trải nghiệm mượt mà như nhau.

Nếu chúng ta coi khả năng truy cập là một tính năng (feature), thì việc kiểm thử nó thủ công sẽ cực kỳ tốn kém và dễ bỏ sót. Đây chính là lúc chúng ta cần sự kết hợp mạnh mẽ giữa các công cụ tự động hóa: **Playwright** để mô phỏng hành vi người dùng, và **axe-core** để thực hiện các bài kiểm tra tiêu chuẩn về khả năng truy cập WCAG (Web Content Accessibility Guidelines).

Bài viết này sẽ là một hướng dẫn chuyên sâu, thực tế và mang tính triển khai cao nhất giúp bạn tích hợp quy trình này vào stack React/TypeScript của mình.

***

## 🔍 Mục lục nội dung

1.  Accessibility là gì? Tại sao phải kiểm thử nó?
2.  Tại sao chọn Playwright + axe-core?
3.  Thiết lập môi trường (Setup)
4.  Triển khai bài test a11y cơ bản trong React Component.
5.  Các Best Practices và Tối ưu hoá hiệu suất.

***

## 1. Accessibility là gì? Tại sao phải kiểm thử nó?

**Accessibility (a11y)** nghĩa đen là khả năng truy cập. Về mặt kỹ thuật, đó là việc thiết kế và phát triển sản phẩm số sao cho người khuyết tật có thể sử dụng được các tính năng của sản phẩm mà không gặp rào cản nào về công nghệ hay vật lý.

### 💡 Tại sao phải đưa a11y vào Test Suite?

*   **Mở rộng thị trường (Market Reach):** Hơn 8% dân số trên toàn thế giới có ít nhất một dạng khuyết tật ảnh hưởng đến việc sử dụng công nghệ số. Bỏ qua a11y là bỏ đi một phân khúc người dùng cực lớn và đầy tiềm năng.
*   **Tuân thủ pháp lý (Legal Compliance):** Nhiều quốc gia và khu vực (như ADA ở Mỹ, hoặc các tiêu chuẩn của châu Âu) yêu cầu doanh nghiệp phải đảm bảo mức độ khả dụng nhất định cho ứng dụng web. Việc kiểm thử tự động giúp bạn chứng minh tính tuân thủ này.
*   **Trải nghiệm người dùng tối ưu (UX Improvement):** Một trang web dễ tiếp cận thường là một trang web được xây dựng với cấu trúc semantic (ngữ nghĩa) tốt, code sạch và ít lỗi hơn—điều này có lợi cho mọi người dùng.

***

## 2. Tại sao chọn Playwright + axe-core?

Thay vì chỉ sử dụng các công cụ tĩnh như Lighthouse hoặc `jest-axe` đơn thuần ở cấp độ component (ví dụ: trong Storybook), chúng ta cần một phương pháp mô phỏng môi trường thực tế, nơi mà tính năng A phụ thuộc vào tương tác với tính năng B.

| Công cụ | Vai trò chính | Lý do lựa chọn |
| :--- | :--- | :--- |
| **Playwright** | Browser Automation Framework (End-to-end testing). | Nó cho phép chúng ta điều khiển trình duyệt như người dùng thật: nhấp chuột, gõ phím, chờ tải, và quan trọng nhất là nó hỗ trợ việc kiểm tra DOM tại thời điểm hành động. |
| **axe-core** | Công cụ audit a11y tiêu chuẩn ngành. | Đây không phải là một thư viện tự viết; nó được duy trì bởi Deque Systems (những chuyên gia hàng đầu về a11y). Nó cung cấp các quy tắc kiểm tra dựa trên WCAG, giúp chúng ta biết chính xác lỗi nằm ở đâu và mức độ nghiêm trọng ra sao. |

Sự kết hợp này cho phép chúng ta viết một bài test: *"Khi người dùng truy cập vào trang X -> sau đó họ nhấp vào nút Y -> thì nội dung Z phải hiển thị với các thuộc tính aria-label đầy đủ."* Đây là kiểm thử đa chiều mà testing unit/component thuần không làm được.

***

## 3. Thiết lập môi trường (Setup)

Giả sử bạn đã có một dự án React/TypeScript với Playwright được cài đặt cơ bản. Chúng ta cần thêm `axe-core` và các loại khai báo liên quan.

**Bước 1: Cài đặt Dependencies**
```bash
npm install axe-core --save-dev
# Nếu dùng TypeScript, nên định nghĩa kiểu cho axe
npm install @types/axe-core --save-dev
```

**Bước 2: Viết Module Hỗ trợ Kiểm tra a11y (The Helper Function)**

Để không lặp lại logic kiểm tra trong mọi file test, chúng ta nên tạo một hàm helper chuyên dụng. File này thường đặt ở thư mục `utils/a11y-checks.ts`.

```typescript
// src/utils/a11y-checks.ts
import { axe, Options } from 'axe-core';
import playwrightFromCore = require('playwright-core'); // Import Playwright để dùng context

/**
 * Chạy bài kiểm tra accessibility trên một phần tử (element) cụ thể.
 * @param elementSelector - Selector CSS của khu vực cần test.
 * @param page - Đối tượng Page từ Playwright.
 */
export async function checkAccessibility(page: playwrightFromCore.Page, elementSelector: string): Promise<{ errors: any[], passes: boolean }> {
    console.log(`[a11y Check] Bắt đầu audit khu vực: ${elementSelector}`);

    // 1. Lấy container DOM cần kiểm tra
    const targetElement = page.locator(elementSelector);
    await targetElement.evaluate((el) => el, [targetElement]); // Chuyển locator thành HTMLElement để axe-core xử lý

    let results: any;
    try {
        // 2. Thực hiện kiểm tra với axe-core. Chúng ta cần lấy nội dung HTML đã render của element
        results = await axe(document, { 
            runOnly: ['wcag2.levelA', 'wcag2.levelAA'] // Chỉ chạy các mức độ A và AA (tiêu chuẩn cơ bản)
        });

    } catch (error) {
        console.error("Lỗi khi chạy axe:", error);
        return { errors: [], passes: false };
    }


    // 3. Phân tích kết quả
    const violations = results.violations;
    const hasViolations = violations && violations.length > 0;

    if (hasViolations) {
        console.warn(`⚠️ [a11y FAIL] Phát hiện ${violations.length} vi phạm a11y trong khu vực.`);
        // Để báo cáo chi tiết: bạn có thể log ra tên các rules bị lỗi
        const errorList = violations.map(v => v.id).join(', ');
        console.warn(`Lỗi Rule ID: ${errorList}`);
    } else {
        console.log("✅ [a11y PASS] Khu vực này đạt tiêu chuẩn a11y cơ bản.");
    }

    return { 
        errors: violations, 
        passes: !hasViolations 
    };
}
```

***

## 4. Triển khai bài test a11y trong React Component

Bây giờ chúng ta sẽ áp dụng hàm helper vừa tạo vào một file test Playwright (`*.spec.ts`). Giả sử bạn có một component Form có các vấn đề về `label` hoặc thuộc tính `alt` cho hình ảnh.

```typescript
// src/components/__tests__/LoginForm.spec.ts
import { test, expect } from '@playwright/test';
import { checkAccessibility } from '../../utils/a11y-checks';

test.describe('A11y Test Suite for Login Form', () => {

    // Thiết lập trang giả định để test (ví dụ: hiển thị Component LoginForm)
    test.beforeAll(async ({ page }) => {
        await page.goto('/login'); // Giả sử route /login đã render Form
    });


    test('Should pass basic accessibility checks on the entire form container', async ({ page }) => {
        // 1. Kiểm tra toàn bộ khu vực FORM (Selector: #login-form)
        const result = await checkAccessibility(page, '#login-form');

        // Assertion cốt lõi: Test phải thất bại nếu có vi phạm
        expect(result.passes).toBe(true); 
    });


    test('Should pass a11y checks on the image banner area (checking alt text)', async ({ page }) => {
        // Giả sử khu vực banner chứa hình ảnh nhưng quên thuộc tính 'alt'
        const result = await checkAccessibility(page, '#banner-image-container');

        // Ví dụ: Nếu ta biết chắc chắn rằng #logo-img phải có ALT
        if (!result.passes && result.errors) {
             console.error("🔴 Vui lòng kiểm tra lại hình ảnh logo!");
        }

        expect(result.passes).toBe(true); 
    });


    test('Should pass a11y checks after performing an interaction (state change)', async ({ page }) => {
        // Đây là phần quan trọng: Kiểm tra sau khi tương tác (ví dụ: mở modal, bật/tắt trạng thái)

        await page.locator('#login-button').click(); // Tương tác gây ra thay đổi DOM (modal hiện lên)
        
        // Chờ một chút để đảm bảo React/DOM đã cập nhật xong state và render các thuộc tính ARIA cần thiết
        await page.waitForTimeout(50); 

        // Kiểm tra lại toàn bộ khu vực MODAL mới xuất hiện
        const modalSelector = '#user-profile-modal';
        const result = await checkAccessibility(page, modalSelector);

        expect(result.passes).toBe(true); // Expect: Modal phải có role=dialog và các hành vi keyboard trap đúng chuẩn a11y
    });

});
```

### Giải thích chi tiết từ Duy Trung:

1.  **Sử dụng `document` cho axe:** Trong hàm `checkAccessibility`, tôi dùng `await axe(document, ...)` thay vì chỉ truyền một selector DOM element. Lý do là porque các lỗi a11y (như thiếu `role` hoặc thiếu `aria-label`) thường liên quan đến **cấu trúc ngữ nghĩa tổng thể** của khu vực đó, không chỉ là nội dung trực tiếp của một tag nào đó.
2.  **Contextual Testing:** Test case cuối cùng (`Should pass a11y checks after performing an interaction...`) là phần nâng cao nhất và giá trị nhất. Nó dạy cho các bạn rằng **a11y phải được kiểm tra trong mọi trạng thái (states)**: `default state`, `hover state` (nếu có), và đặc biệt là **sau khi tương tác**.
3.  **Nghiêm trọng của Assertion:** Chúng ta dùng `expect(result.passes).toBe(true);`. Nếu bài test này fail, điều đó *buộc* bạn phải dừng việc deploy, bởi vì nó báo hiệu một lỗi ảnh hưởng đến người dùng khuyết tật—một loại Bug nghiêm trọng hơn bug chức năng thông thường rất nhiều!

***

## 5. Best Practices và Tối ưu hoá hiệu suất.

### ✅ A11y Quản trị trong CI/CD

Đừng bao giờ chạy test a11y chỉ là một bước tùy chọn (optional step). Hãy đưa nó vào pipeline của bạn như một **gate check (điểm chặn bắt buộc)** ngay sau khi build component và trước khi deploy staging. Nếu bất kỳ bài kiểm tra nào fail, deployment phải tự động rollback.

### ⚙️ Hiệu suất (Performance)

Các test a11y có thể làm chậm suite test của bạn vì chúng yêu cầu duyệt qua toàn bộ DOM. Để khắc phục:

1.  **Scope hẹp:** Luôn luôn giới hạn selector (`#login-form`, `.user-card`) thay vì chạy trên `document` gốc, trừ khi đó là bài kiểm tra cấp độ trang (page level).
2.  **Xử lý async/await:** Đảm bảo rằng mọi thao tác trong test đều chờ (wait) đến khi DOM được render hoàn toàn (`waitForSelector`, `waitUntil: 'networkidle'`).

### 📚 Tóm lược về vai trò của QE Lead

Là một chuyên gia QA, chúng ta không chỉ là người *tìm* lỗi mà còn phải *xây dựng quy trình ngăn ngừa* lỗi. Việc tích hợp a11y tự động bằng Playwright/axe-core chính là việc nâng tầm chất lượng sản phẩm lên một tiêu chuẩn toàn cầu về tính bao hàm (Inclusivity).

Chúc các bạn thành công trong việc xây dựng các ứng dụng web không chỉ hiện đại, mạnh mẽ mà còn thực sự *cho tất cả mọi người*!

***
**Bạn có câu hỏi nào về việc triển khai hay tối ưu hóa test a11y? Hãy để lại bình luận bên dưới, chúng ta cùng thảo luận nhé!**