---
title: "Kiểm thử Accessibility (a11y) tự động trong React với axe-core và Playwright"
date: 2026-06-26
description: "Hướng dẫn chuyên sâu từ QE Lead Duy Trung về cách tích hợp axe-core vào Playwright để kiểm tra a11y tự động, đảm bảo sản phẩm đạt chuẩn WCAG."
tags: ["Accessibility","React","Playwright"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# Kiểm thử Accessibility (a11y) tự động trong React với axe-core và Playwright

Xin chào các đồng nghiệp kỹ thuật! Tôi là Duy Trung, một chuyên gia Kỹ thuật Đảm bảo Chất lượng Phần mềm. Trong hành trình xây dựng các sản phẩm web hiện đại bằng React, chúng ta thường tập trung rất nhiều vào tính năng (Functionality) và hiệu suất (Performance). Nhưng có một khía cạnh vô cùng quan trọng mà nếu bỏ qua sẽ gây ra rào cản lớn cho người dùng: **Tính khả dụng (Accessibility - a11y)**.

Một sản phẩm không dễ tiếp cận với người khiếm thị, người sử dụng trình đọc màn hình (Screen Reader), hay những người gặp vấn đề về vận động (Motor Disabilities) thì dù hoàn hảo đến mấy cũng coi như thất bại về mặt trải nghiệm và trách nhiệm xã hội.

Bài viết hôm nay sẽ là một hướng dẫn chuyên sâu về việc chúng ta có thể tích hợp quy trình kiểm thử Accessibility tự động, mạnh mẽ và đáng tin cậy bằng sự kết hợp giữa **`axe-core`** và **Playwright**, đặc biệt tối ưu cho các ứng dụng React hiện đại.

---

## 💡 I. Tại sao phải dùng Playwright + axe-core?

Trước khi đi vào code, chúng ta cần hiểu vai trò của từng thành phần:

### 1. Về `axe-core` (The Engine)
`axe-core` là thư viện kiểm tra khả năng tiếp cận uy tín hàng đầu thế giới, được phát triển bởi Deque Systems. Nó không chỉ đơn thuần là một công cụ tìm lỗi; nó thực hiện việc đánh giá DOM (Document Object Model) dựa trên các quy tắc của tiêu chuẩn WCAG (Web Content Accessibility Guidelines).

*   **Điểm mạnh:** Độ chính xác cao, cập nhật liên tục theo các phiên bản WCAG mới nhất.
*   **Hạn chế (Khi đứng một mình):** Nó chỉ là một bộ đánh giá rules, cần một môi trường thực thi để đọc DOM và mô phỏng hành vi người dùng.

### 2. Về Playwright (The Browser & Orchestrator)
Playwright là một framework tự động hóa web tiên tiến của Microsoft. Nó cho phép chúng ta điều khiển một trình duyệt (Chromium, Firefox, WebKit) ở mức độ rất sâu.

*   **Vai trò trong a11y:** Thay vì chỉ kiểm tra DOM tĩnh, Playwright mô phỏng toàn bộ hành vi người dùng thật: Click chuột, chờ đợi AJAX callback, xử lý sự kiện JavaScript phức tạp... Nó đảm bảo rằng khi React component được mount và cập nhật state, `axe-core` sẽ đánh giá trên trạng thái **DOM cuối cùng** (The actual rendered DOM).

### 🔑 Kết luận về sự kết hợp
Chúng ta dùng Playwright để *thực thi* hành vi người dùng và lấy DOM đã render. Sau đó, chúng ta đưa DOM này vào hàm của `axe-core` để *kiểm định* tính khả dụng theo tiêu chuẩn WCAG.

---

## 🛠️ II. Thiết lập Môi trường Phát triển (Setup)

Giả sử bạn đang có một dự án React/Playwright cơ bản (`npm create playwright@latest`).

**Bước 1: Cài đặt các dependencies cần thiết.**
Chúng ta cần `axe-core` để thực hiện việc đánh giá.

```bash
# Trong thư mục root của project
npm install axe-core
npm install -D @testing-library/jest-dom # Có thể hỗ trợ cho testing framework khác
```

**Bước 2: Cấu trúc dự án.**
Bạn sẽ cần một file kiểm thử (ví dụ: `cypress/e2e/accessibility.spec.ts`) để chứa logic của mình.

---

## 💻 III. Triển khai Kiểm thử a11y trong Playwright

Đây là phần quan trọng nhất và thể hiện vai trò chuyên môn của chúng ta. Chúng ta sẽ sử dụng cú pháp TypeScript/JavaScript tiêu chuẩn của Playwright Test Runner.

### Ví dụ: Kiểm tra một component có form input cơ bản

Giả sử bạn có một component React chứa một Form và Input field, và nhiệm vụ là kiểm tra xem việc thiếu `aria-label` hoặc nhãn (label) cho input đó có bị phát hiện không.

**Code Example (`accessibility.spec.ts`):**

```typescript
// Import các thư viện cần thiết
import { test, expect } from '@playwright/test';
import * as axe from 'axe-core';

/**
 * Hàm utility để thực hiện kiểm tra a11y trên một selector cụ thể.
 * @param elementSelector Selector CSS của phần tử cần kiểm tra (ví dụ: '#main-content')
 */
const checkAccessibility = async (elementSelector: string) => {
    console.log(`\n--- Bắt đầu kiểm tra a11y cho vùng: ${elementSelector} ---`);

    // 1. Lấy phần tử DOM bằng Playwright
    const elementHandle = await test.page.$(elementSelector);

    if (!elementHandle) {
        throw new Error(`Không tìm thấy phần tử với selector: ${elementSelector}`);
    }

    // 2. Sử dụng page.evaluate() để chạy axe-core trực tiếp trong Context của trình duyệt (Browser context)
    const results = await test.page.evaluate(async (selector) => {
        // Lấy phần tử DOM thực tế bằng document.querySelector
        const targetElement = document.querySelector(selector);

        if (!targetElement) {
            return { errors: [], passes: [] }; // Trả về rỗng nếu không tìm thấy
        }

        // Thực thi axe-core trên phần tử mục tiêu
        await axe.run(targetElement, { 
            // Tùy chọn cấu hình (ví dụ: chỉ kiểm tra các quy tắc nghiêm trọng)
            // engine: 'html',
        });

        // Trả về kết quả của axe
        return axe.getResults();

    }, elementSelector); // Truyền selector vào hàm evaluate

    const violations = results.violations;

    if (violations.length > 0) {
        console.error(`❌ [FAIL] Phát hiện ${violations.length} lỗi khả dụng.`);
        // In ra chi tiết các lỗi để báo cáo
        violations.forEach(violation => {
            console.warn(`   - Quy tắc vi phạm: ${violation.id}`);
            console.warn(`     Mô tả: ${violation.description}`);
            console.warn(`     Áp dụng trên: [${violation.nodes[0]?.target || 'Không rõ'}]`);
        });

        // Đẩy lỗi fail để Playwright báo cáo Failure
        throw new Error('Accessibility violation detected! Please fix the issues.');
    } else {
        console.log('✅ Thành công! Không phát hiện vi phạm Accessibility nào trong khu vực này.');
    }
};


test.describe("Kiểm thử tích hợp tính khả dụng (a11y)", () => {

    // Mocking một trang chứa form test
    test.beforeAll(async ({ page }) => {
        await page.goto('http://localhost:3000/form-page'); // Thay bằng URL component của bạn
        // Cho phép các thẻ element tạm thời được load xong
        await page.waitForTimeout(100); 
    });

    test("a11y kiểm tra Form Input field cơ bản (Kiểm tra nhãn thiếu)", async ({ page }) => {
        const formSelector = '#main-form'; // Selector bao quanh toàn bộ form
        
        // --- BƯỚC 1: Chạy check a11y trên DOM đã render
        await checkAccessibility(formSelector);

        // Giả sử nếu checkAccessibility thành công, chúng ta vẫn tiếp tục các test chức năng khác.
    });


    test("a11y kiểm tra sau khi tương tác (ví dụ: gửi form)", async ({ page }) => {
        const targetSelector = '#result-message'; // Khu vực sẽ hiển thị thông báo thành công/lỗi

        // 1. Mô phỏng hành vi người dùng: Điền và submit form
        await page.locator('#username').fill('testuser');
        await page.click('#submit-button');

        // 2. Chờ đợi phản hồi của hệ thống (AJAX)
        await page.waitForSelector(targetSelector, { state: 'visible' });

        // 3. Sau khi giao diện thay đổi/render thành công, chạy check a11y lại trên khu vực mới này.
        await checkAccessibility(targetSelector);
    });
});
```

### Phân tích và Giải thích Code (Từ góc nhìn của QE Lead)

#### 1. `test.page.evaluate()`: Chìa khóa Vàng
*   **Mục đích:** Khi chúng ta chạy code JavaScript/TypeScript trong file test, nó hoạt động *ngoài* ngữ cảnh trình duyệt thật. Để truy cập vào DOM đã được Playwright tải và render (cùng với các sự kiện JS của React), chúng ta phải dùng `page.evaluate()`. Hàm này cho phép chúng ta thực thi mã ngay trong **Context of the browser page**.
*   **Tối ưu:** Chúng ta truyền `elementSelector` làm tham số thứ hai khi gọi `evaluate`, giúp giữ logic sạch sẽ và linh hoạt hơn là hardcode selector bên trong hàm.

#### 2. Logic của `axe-core` Run
```javascript
// ... await axe.run(targetElement) ...
return axe.getResults();
```
*   **Ý nghĩa:** Chúng ta không chỉ chạy `axe.run()` mà còn phải dùng nó để trả về kết quả (`axe.getResults()`). Việc này là cần thiết để Playwright có thể nhận và xử lý lỗi (violation) được báo cáo từ thư viện `axe-core`.

#### 3. Xử lý Lỗi Bằng Exception Throwing
```typescript
if (violations.length > 0) {
    // ... log detailed errors ...
    throw new Error('Accessibility violation detected! Please fix the issues.');
}
```
*   **Thực tiễn QE:** Trong kiểm thử tự động, việc chỉ *log* lỗi là chưa đủ. Chúng ta phải buộc Playwright (hoặc Jest/Mocha) xem xét đây là một **Failure** thực sự. Bằng cách `throw new Error()`, chúng ta đảm bảo rằng nếu có vi phạm a11y nào xảy ra trong quá trình kiểm thử, test case đó sẽ bị đánh dấu FAIL ngay lập tức, ngăn không cho build tiếp tục và buộc developer phải sửa lỗi.

---

## 🏆 IV. Các Bài học Thực tiễn từ Kinh nghiệm QE Lead (Best Practices)

### 🚀 1. Kiểm thử Theo Luồng Người Dùng (User Flow Driven Testing)
Đừng chỉ kiểm tra một component trên trạng thái tĩnh (`Static Check`). Tính khả dụng thường bị phá vỡ khi có **tương tác** hoặc **thay đổi state**.

*   **Ví dụ:** Khi bạn nhấn nút "Submit" và form gửi thành công, một thông báo (Alert/Toast) sẽ hiện ra. Bạn phải đảm bảo rằng component chứa Toast đó được đánh dấu `aria-live` và Playwright của bạn đã kiểm tra xem Screen Reader có đọc được thông báo này hay không sau khi sự kiện AJAX hoàn tất.

### 🚀 2. Xử lý Kết quả Phức tạp (Asynchronous Checks)
Trong React, nhiều thay đổi DOM là bất đồng bộ. Luôn luôn đợi đủ lâu (`await page.waitForSelector(...)`) hoặc sử dụng các cơ chế chờ có điều kiện của Playwright để đảm bảo rằng lúc bạn gọi `checkAccessibility()`, phần tử đã ở trạng thái *cuối cùng* mà người dùng sẽ thấy.

### 🚀 3. Tích hợp vào CI/CD
Giá trị thực sự của automation là khi nó chạy tự động. Bạn phải cấu hình các pipeline CI/CD (GitHub Actions, GitLab CI) để **luôn luôn** chạy bộ test a11y này cùng với bộ test chức năng. Nếu bất kỳ quy tắc WCAG nào bị vi phạm, build phải bị thất bại (Fail Fast).

---

## 🔮 Kết Luận

Kiểm thử Accessibility không còn là một "tính năng phụ" (Nice-to-have), mà đã trở thành một yêu cầu kỹ thuật cốt lõi (Core Requirement) của mọi sản phẩm số hiện đại.

Bằng cách kết hợp sức mạnh mô phỏng trình duyệt và tương tác người dùng của **Playwright** với bộ quy tắc đánh giá cực kỳ chính xác của **`axe-core`**, chúng ta không chỉ đơn thuần là viết code, mà đang xây dựng một nền tảng phần mềm công bằng và hòa nhập cho tất cả mọi người.

Hãy biến việc kiểm thử a11y thành một thói quen hàng ngày trong quy trình phát triển của team bạn nhé!

*Trân trọng,*
**Duy Trung**
***QE Lead, Software Quality Assurance***