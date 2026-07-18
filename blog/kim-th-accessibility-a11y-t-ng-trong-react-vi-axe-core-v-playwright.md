---
title: "Kiểm thử Accessibility (a11y) tự động trong React với axe-core và Playwright"
date: 2026-06-19
description: "Hướng dẫn chuyên sâu cách tích hợp kiểm thử Accessibility (a11y) vào CI/CD pipeline của ứng dụng React bằng sức mạnh kết hợp giữa axe-core và Playwright."
tags: ["Accessibility","React","Playwright","Testing"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# Kiểm thử Accessibility (a11y) tự động trong React với axe-core và Playwright

Chào các đồng nghiệp kỹ thuật! Tôi là Duy Trung, một Quality Engineer chuyên sâu về việc xây dựng quy trình QA hiện đại.

Trong thế giới phát triển web ngày nay, chất lượng sản phẩm không chỉ dừng lại ở tính năng (Functionality) hay hiệu suất (Performance). Một tiêu chí "BẮT BUỘC" mà chúng ta phải xem xét là **Khả năng Tiếp cận (Accessibility - a11y)**. Xây dựng một ứng dụng React hiện đại mà bỏ qua a11y chẳng khác nào xây một tòa nhà mà không tính đến lối thoát hiểm cho người khuyết tật – nó bị lỗi ngay từ gốc rễ.

Việc kiểm thử a11y bằng tay (manual testing) là cần thiết, nhưng cực kỳ tốn thời gian và kém độ bao phủ khi tích hợp vào Continuous Integration/Continuous Deployment (CI/CD).

Bài viết này sẽ đi sâu vào một giải pháp thực tế, mạnh mẽ: **Tự động hóa kiểm thử Accessibility trong ứng dụng React của bạn bằng sự kết hợp giữa `axe-core` và `Playwright`.** Đây là kiến trúc mà tôi tin rằng mọi đội ngũ QE chuyên nghiệp cần phải nắm vững.

---

## 🎯 I. Vấn đề cốt lõi: Tại sao chúng ta cần cách tiếp cận này?

### 1. Giới thiệu về axe-core
`axe-core` không chỉ là một thư viện kiểm thử; nó là bộ công cụ tiêu chuẩn ngành được phát triển bởi Deque Systems, giúp xác định các vấn đề a11y dựa trên WCAG (Web Content Accessibility Guidelines). Nó hoạt động bằng cách phân tích DOM (Document Object Model) và đưa ra danh sách các lỗi tuân thủ mà chúng ta cần khắc phục.

### 2. Giới thiệu về Playwright
Playwright là một framework kiểm thử tự động hóa mạnh mẽ, hỗ trợ nhiều trình duyệt và mô phỏng hành vi người dùng cực kỳ chân thực (ví dụ: tương tác click, nhập liệu, chờ đợi AJAX).

### 3. Sự kết hợp sức mạnh
*   **React:** Nơi chúng ta xây dựng giao diện phức tạp, thay đổi trạng thái liên tục (state changes).
*   **Playwright:** Giúp *thực thi* kịch bản tương tác người dùng trên React, đảm bảo tất cả các luồng chuyển tiếp đều được kiểm tra.
*   **axe-core:** Được Playwright *tiêm* vào môi trường DOM để phân tích bất kỳ trạng thái nào của trang web (sau khi click nút A, sau khi form submit...).

Sự kết hợp này cho phép chúng ta không chỉ check "mã tĩnh" mà còn check **"trải nghiệm động"** của người dùng.

---

## 🧪 II. Hướng dẫn Triển khai Kỹ thuật Chi tiết

Giả sử bạn đã có một dự án React cơ bản và đã cài đặt Playwright. Chúng ta sẽ tập trung vào việc tích hợp `axe-core` và viết các hàm kiểm thử chuyên biệt.

### Bước 1: Cài đặt Dependencies
Bạn cần cả `playwright` (đã bao gồm) và thư viện `axe-core`.

```bash
# Cài đặt axe-core qua npm
npm install axe-core @axe-core/react --save-dev
```

### Bước 2: Thiết lập Hàm Kiểm thử Accessibility Module (`a11yHelper.js`)

Chúng ta không muốn nhồi logic a11y vào mọi file test. Thay vào đó, chúng ta tạo một *helper module* chuyên dụng. Trong helper này, chúng ta sẽ dùng `axe-core` để quét DOM hiện tại của trang web sau khi Playwright đã tải xong nội dung.

```javascript
// src/utils/a11yHelper.js
import { axe } from 'axe-core';

/**
 * Hàm chạy quét Accessibility trên phần tử hoặc toàn bộ body.
 * @param {object} page - Đối tượng Playwright Page Context.
 * @param {string} selector - Selector CSS của khu vực cần kiểm tra (mặc định là 'body').
 */
export async function checkAccessibility(page, selector = 'body') {
    console.log(`\n--- Running Accessibility Check on selector: ${selector} ---`);
    
    // Chờ DOM ổn định trước khi quét
    await page.waitForTimeout(500); 

    try {
        // Sử dụng playwright's evaluate để chạy axe-core trong ngữ cảnh trình duyệt
        const results = await page.evaluate(async (sel) => {
            const rootElement = document.querySelector(sel);
            if (!rootElement) {
                console.error(`[a11y] Error: Could not find element with selector ${sel}`);
                return { violations: [], passes: 0 };
            }
            // Gọi axe trong ngữ cảnh DOM
            const a11y = await axe(rootElement, { 
                rules: [{ id: 'aria-required', enabled: true }], // Có thể tùy chỉnh rules ở đây
                passingStyle: true 
            });
            return a11y;
        }, selector);

        // Xử lý kết quả
        const violations = results.violations;

        if (violations && violations.length > 0) {
            console.error(`🚨 🔴 FAILED A11Y CHECK: Tìm thấy ${violations.length} vấn đề.`);
            // Logic đổ lỗi/fail test ở đây
            throw new Error(JSON.stringify({ failures: violations }));
        } else {
            console.log('✅ SUCCESS: Kiểm tra Accessibility thành công! Không tìm thấy vấn đề lớn.');
            return true; // Test pass
        }

    } catch (error) {
        console.error("❌ A11Y CHECK FAILED:", error.message);
        // Quan trọng: Ném lỗi để dừng test case nếu phát hiện lỗi nghiêm trọng a11y
        throw new Error(`Accessibility violation found during automated testing.`);
    }
}
```

### Bước 3: Tích hợp vào Playwright Test Case (Ví dụ)

Bây giờ, chúng ta sử dụng helper này trong một file test thực tế của Playwright.

```javascript
// tests/login-flow.spec.js
import { test, expect } from '@playwright/test';
import { checkAccessibility } from '../src/utils/a11yHelper'; 

test('Verify login form functionality and accessibility', async ({ page }) => {
    await page.goto('/login'); // Giả sử trang đăng nhập là /login
    await expect(page).toHaveTitle("Đăng nhập");

    // --- BƯỚC 1: Kiểm tra a11y của giao diện ban đầu (Initial Load)
    // Chúng ta quét toàn bộ body để kiểm tra các lỗi ngay khi load.
    await checkAccessibility(page, 'body'); 

    // Thao tác tương tác người dùng (User interaction simulation)
    await page.fill('#username', 'testuser');
    await page.fill('#password', 'secure123');

    // Giả sử nút submit có ID là #login-btn
    await page.click('#login-btn'); 

    // Chờ chuyển hướng trang thành công (sau khi click)
    await page.waitForURL('/dashboard');

    // --- BƯỚC 2: Kiểm tra a11y trên trạng thái mới (Post-action state)
    // Đây là phần quan trọng nhất! Các lỗi thường xuất hiện sau khi tương tác AJAX.
    await checkAccessibility(page, 'body'); 
});
```

---

## 💡 III. Phân tích Chuyên sâu từ Duy Trung (The QE Insight)

Sau khi cung cấp code, tôi muốn phân tích những điểm cốt lõi để các bạn không chỉ sao chép mà còn hiểu được bản chất của việc kiểm thử này.

### 1. Tại sao phải dùng `page.evaluate`?
Trong Playwright, chúng ta không thể trực tiếp gọi hàm DOM như trong môi trường Node.js. Chúng ta cần **thực thi** JavaScript bên trong ngữ cảnh (context) của trình duyệt mà Playwright đang điều khiển. Hàm `await page.evaluate(async (sel) => { ... }, selector)` chính là cầu nối giúp chúng ta chạy `axe-core` một cách "trong cuộc" trên DOM hiện tại, đảm bảo độ tin cậy cao nhất.

### 2. Vấn đề Time & State
*   **Trạng thái động:** Đây là điểm khác biệt lớn nhất so với kiểm thử đơn thuần. Khi React cập nhật giao diện (ví dụ: hiển thị thông báo lỗi sau khi form bị submit sai), các thuộc tính ARIA, focus management có thể bị bỏ quên. `checkAccessibility` phải được đặt **sau** mỗi hành động quan trọng (`await page.click(...)`, `await page.waitForSelector(...)`).
*   **`page.waitForTimeout(500)`:** Việc này mang tính chất "giả định" và chỉ nên dùng khi bắt buộc. Tuy nhiên, nó giúp mô phỏng thời gian chờ mà các thư viện a11y cần để DOM của React hoàn thiện sau một tác vụ AJAX phức tạp.

### 3. Quản lý Lỗi (Failure Management)
Trong helper module (`a11yHelper.js`), tôi đã thêm logic `throw new Error(...)` khi phát hiện lỗi. **Đây là nguyên tắc vàng:** Nếu hệ thống thất bại về mặt khả năng tiếp cận, nó phải được coi là một lỗi nghiêm trọng (Hard Failure), và test case đó phải FAIL ngay lập tức để cảnh báo cho đội ngũ Phát triển.

---

## 🚀 IV. Kết luận & Tóm tắt Quy trình làm việc

| Bước | Công cụ/Thành phần | Mục đích | Vai trò của QE |
| :--- | :--- | :--- | :--- |
| **1. Viết Component** | React / JSX | Xây dựng tính năng, chú trọng các thuộc tính `aria-` và Semantic HTML. | Kiểm tra Unit Test (ví dụ: Jest) với axe. |
| **2. Tích hợp Scenario** | Playwright | Mô phỏng luồng người dùng thực tế trên trình duyệt. | Viết test case mô tả hành vi từ A đến Z. |
| **3. Quét a11y** | `axe-core` + Helper Function | Kiểm tra tính tuân thủ của DOM ở các trạng thái quan trọng (Initial Load, After Interaction). | Đảm bảo lời gọi hàm `checkAccessibility` được đặt đúng vị trí trong luồng test. |
| **4. CI/CD Pipeline** | GitHub Actions / GitLab CI | Tự động chạy Playwright và báo cáo thất bại a11y. | Cấu hình môi trường để đảm bảo bất kỳ commit nào gây lỗi a11y đều bị chặn lại (Gatekeeping). |

Bằng việc tích hợp `axe-core` vào luồng test của Playwright, chúng ta nâng tầm từ việc "chạy test" sang **"đảm bảo chất lượng trải nghiệm toàn diện"**.

Chúc các bạn thành công trong việc xây dựng những sản phẩm không chỉ hoạt động tốt mà còn thân thiện với MỌI NGƯỜI!

*Trân trọng,*
**Duy Trung - QE Lead.**