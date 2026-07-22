---
title: "Kiểm thử Accessibility (a11y) tự động trong React với axe-core và Playwright"
date: 2026-06-23
description: "Hướng dẫn chuyên sâu cách tích hợp kiểm thử a11y vào quy trình CI/CD bằng sức mạnh của Playwright và axe-core."
tags: ["Accessibility","React","Playwright"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# Kiểm thử Accessibility (a11y) tự động trong React với axe-core và Playwright

Chào các đồng nghiệp QA, tôi là Duy Trung.

Trong vai trò một QE Lead, tôi đã chứng kiến quá nhiều dự án phần mềm hoàn hảo về mặt chức năng (Functionally Correct), nhưng lại thất bại thảm hại về trải nghiệm người dùng thực tế (Real User Experience). Một trong những lỗi phổ biến và nghiêm trọng nhất chính là việc bỏ qua Accessibility – hay còn gọi là kiểm thử khả năng tiếp cận (a11y).

Accessibility không chỉ là một yêu cầu đạo đức, mà ngày nay nó đã trở thành tiêu chuẩn bắt buộc về mặt pháp lý đối với các sản phẩm công nghệ quy mô lớn. Việc phụ thuộc vào kiểm thử thủ công cho a11y là vô vọng vì tính chất phức tạp và sự đa dạng của các thiết bị hỗ trợ (Screen Readers, keyboard navigation).

Bài viết này sẽ là một bài hướng dẫn chuyên sâu, thực tế về cách chúng ta có thể tự động hóa quá trình kiểm tra a11y nghiêm ngặt ngay trong chu trình kiểm thử React bằng bộ công cụ mạnh mẽ: **Playwright** và **axe-core**.

---

## 💡 I. Cơ sở lý luận: Tại sao Playwright và axe-core?

Trước khi đi vào code, chúng ta cần hiểu rõ về các thành phần này và vai trò của chúng trong quy trình QE hiện đại.

### 1. Accessibility (a11y) là gì?
Nó là khả năng người khuyết tật (về thị giác, thính giác, vận động, nhận thức...) vẫn có thể tương tác với và sử dụng trang web/ứng dụng điện tử một cách đầy đủ như người không khuyết tật. Các tiêu chuẩn quốc tế nổi tiếng nhất bao gồm **WCAG (Web Content Accessibility Guidelines)** của W3C.

### 2. axe-core: "Bộ não" kiểm tra a11y
`axe-core` là một công cụ phân tích (engine) mã nguồn mở được phát triển bởi Deque Systems. Nó không phải là framework kiểm thử, mà là một thư viện JavaScript mạnh mẽ giúp chúng ta chạy audit các vấn đề về cấu trúc DOM, thiếu tiêu đề Alt Text, màu sắc tương phản kém, v.v., dựa trên hàng trăm quy tắc WCAG.

### 3. Playwright: "Cánh tay" thực hiện tự động hóa
Playwright là một framework End-to-End (E2E) testing mới nổi và cực kỳ ổn định của Microsoft. Nó cung cấp khả năng điều khiển trình duyệt giả lập (headless browser) với độ tin cậy cao, tốc độ nhanh, và đặc biệt quan trọng: nó cho phép chúng ta tiêm (inject) bất kỳ đoạn script nào vào DOM để thực hiện kiểm thử chuyên sâu như việc chạy `axe-core`.

**Tóm lại:** Playwright giúp bạn *truy cập* trang React và tái tạo môi trường người dùng. Khi đã ở trong môi trường đó, bạn dùng **`axe-core`** để *phân tích* mọi thứ đang xảy ra với DOM, sau đó sử dụng các assertion của Playwright để *khẳng định* (assert) rằng không có lỗi a11y nào được tìm thấy.

---

## 🛠️ II. Hướng dẫn Triển khai Thực tế

Giả sử chúng ta đang làm việc trong một dự án React và muốn tích hợp kiểm thử này vào bộ test E2E của mình.

### Bước 1: Cài đặt Dependencies
Chúng ta cần cài đặt Playwright và thư viện `axe-core`.

```bash
# Trong terminal root project
npm install @playwright/test axe-core
# Chạy lệnh để tải các binary trình duyệt cần thiết (nếu chưa có)
npx playwright install
```

### Bước 2: Xây dựng Test Case (Sử dụng TypeScript/JavaScript)

Chúng ta sẽ tạo một file test (`a11y.spec.tsx`) và mô phỏng quy trình kiểm thử trên một component React cụ thể.

**Mục tiêu của ví dụ này:** Kiểm tra xem khi người dùng nhấp vào nút, thông báo lỗi (error message) có được gắn thuộc tính ARIA cần thiết không, đồng thời kiểm tra tổng quan các vấn đề WCAG chung.

```typescript
// a11y.spec.tsx
import { test, expect, page } from '@playwright/test';
import * as axe from 'axe-core'; // Import module axe-core

/**
 * Hàm Helper để chạy audit accessibility trên một selector cụ thể
 */
async function runAxeAudit(page: page, targetSelector: string): Promise<void> {
    // 1. Tiêm thư viện axe-core vào ngữ cảnh của trang (Page Context)
    await page.evaluate((selector: string) => {
        const element = document.querySelector(selector);
        if (element && window.axe) {
            window.axe.run(element, {
                // Chỉ định các rulesets bạn muốn kiểm tra (ví dụ: WCAG 2.1 AA Level A, và best-practice chung)
                rules: ["wcag2a", "best-practice"] 
            });
        } else {
            throw new Error("Không thể chạy axe-core hoặc selector không hợp lệ.");
        }
    }, targetSelector); // Truyền selector làm tham số cho page.evaluate

    // 2. Chờ và truy xuất kết quả từ window.axe-results (được đặt trong global scope)
    const results: any = await page.evaluate(() => {
        return window.axe -core.getResponse();
    });

    if (!results || !results.violations) {
        console.log("✅ Audit a11y thành công: Không tìm thấy vi phạm nào.");
        return;
    }

    // 3. Kiểm tra Assertions
    const violations = results.violations;
    expect(violations).toHaveLength(0, `🚨 Phát hiện ${violations.length} vi phạm accessibility! Vui lòng xem chi tiết trong report.`);
}


test('Kiểm thử toàn bộ luồng chức năng và a11y của trang sản phẩm', async ({ page }) => {
    // Giả định rằng /product-page là endpoint chứa component React cần test
    await page.goto('/product-page'); 

    // Chờ một phần tử chính của ứng dụng được render hoàn toàn (Quan trọng!)
    await page.waitForSelector('#main-content', { timeout: 5000 });
    
    // --- Kịch bản tương tác trước khi Audit (Nếu cần kích hoạt state) ---
    await page.click('#add-to-cart-button'); // Giả lập click để hiển thị thông báo/popover
    
    // Tạm dừng ngắn để DOM cập nhật hoàn toàn các thuộc tính ARIA mới
    await page.waitForTimeout(100); 

    // --- THỰC HIỆN AUDIT A11Y ---
    
    // Audit toàn bộ khu vực nội dung chính của sản phẩm (Selector: #main-content)
    await runAxeAudit(page, '#main-content');

    // Bạn có thể chạy audit trên các phần tử con cụ thể nếu cần độ chi tiết cao
    // await runAxeAudit(page, '.checkout-form'); 
});
```

### Giải thích của Duy Trung (QE Lead)

Các bạn thấy đấy, điểm mấu chốt ở đây không chỉ là việc gọi hàm `axe.run()`. Độ phức tạp nằm ở cách chúng ta **tích hợp** nó vào vòng đời của Playwright và môi trường React:

1.  **`page.evaluate()`:** Đây là kỹ thuật quan trọng nhất. Chúng ta dùng `page.evaluate()` để thực thi mã JavaScript *trong* trình duyệt giả lập, đảm bảo rằng `axe-core` được chạy trên cùng ngữ cảnh DOM mà ứng dụng React của chúng ta đang hiển thị.
2.  **Time Synchronization:** Khi kiểm thử E2E, các trạng thái (state) thay đổi rất nhanh. Nếu bạn audit ngay sau khi click nút, thông báo lỗi hoặc popup có thể chưa kịp gắn các thuộc tính ARIA cần thiết. Việc sử dụng `await page.waitForTimeout(100)` (hoặc tốt hơn là chờ một selector mới xuất hiện) là bắt buộc để đảm bảo DOM đã ổn định trước khi chạy audit.
3.  **Assertion Focus:** Thay vì chỉ đơn thuần chạy audit, chúng ta phải biến nó thành một **assertion thất bại nghiêm trọng (`expect().toHaveLength(0)`)**. Nếu bất kỳ lỗi a11y nào được tìm thấy (ví dụ: thiếu label cho input), test case sẽ tự động *FAIL* và báo đỏ trong CI/CD, buộc Developer phải sửa ngay lập tức.

---

## 🚀 III. Nâng cao và Tối ưu hóa Quy trình QE (Best Practices)

Là một chuyên gia QA cấp cao, tôi muốn chia sẻ thêm vài mẹo để tối ưu việc kiểm thử a11y này khi áp dụng vào môi trường sản phẩm thực tế:

### 1. Xử lý Nội dung Động (Dynamic Content)
Nếu component của bạn sử dụng các thư viện quản lý state phức tạp hoặc có nội dung được tải bằng API (ví dụ: Loading Spinner -> Data Table), bạn phải đảm bảo rằng audit chạy **sau khi** dữ liệu cuối cùng đã render và sau khi tất cả các thuộc tính ARIA đã được áp dụng.

*   **Solution:** Sử dụng `page.waitForSelector(async Selector)` thay vì `setTimeout` để chờ một sự kiện DOM cụ thể, đó là cách đáng tin cậy nhất.

### 2. Tách biệt Module Testing và E2E Testing
Không nên chạy toàn bộ audit a11y trên mọi trang của ứng dụng trong mọi lần commit. Hãy áp dụng chiến lược này:

*   **Unit/Component Test:** Sử dụng `@testing-library/react` kết hợp với `jest-axe`. Đây là môi trường lý tưởng để kiểm tra một component React *cô lập*.
*   **E2E Test (Playwright):** Chỉ dùng cho việc audit trên các luồng người dùng quan trọng nhất (Critical User Journeys) như trang thanh toán, đăng nhập.

### 3. Tích hợp CI/CD Pipeline
Giá trị của kiểm thử a11y tự động chỉ được phát huy khi nó là một phần không thể thiếu trong quy trình Build/Deploy:

*   **Integration Point:** Đặt bước `runAxeAudit` vào giai đoạn Test cuối cùng của pipeline (Ví dụ: trên Jenkins, GitHub Actions).
*   **Policy:** Thiết lập chính sách rằng nếu bất kỳ test a11y nào thất bại $\rightarrow$ **Build sẽ FAIL**. Điều này tạo ra một lưới an toàn (safety net) cực kỳ hiệu quả cho đội phát triển.

### 4. Quản lý False Positives và Triage
Đôi khi, `axe-core` có thể báo cáo các vi phạm mà trên thực tế đã được xử lý bằng JavaScript hoặc component của bạn đã được bù đắp (mitigated).

*   **QE Role:** Đội QA phải đóng vai trò là người kiểm duyệt cuối cùng. Khi nhận diện False Positives, hãy ghi lại chi tiết và cân nhắc việc bỏ qua (suppress) quy tắc đó trong `axe-core` để tránh làm chậm tốc độ CI/CD mà vẫn đảm bảo chất lượng cao.

---

## 🏁 Kết luận từ Duy Trung

Việc tích hợp kiểm thử a11y không phải là một tính năng bổ sung (nice-to-have), nó là một **Yêu cầu Chất lượng cốt lõi** (Core Quality Requirement). Bằng cách kết hợp sức mạnh điều khiển DOM của Playwright và khả năng phân tích sâu sắc của `axe-core`, chúng ta đã nâng tầm quy trình kiểm thử E2E từ việc chỉ xác minh *"Chức năng có hoạt động không?"* sang *“Ứng dụng này có dành cho MỌI người dùng, bao gồm cả những người khuyết tật, không?”*.

Hãy biến a11y thành một phần mặc định (default part) trong bộ test của bạn. Đội ngũ QE của chúng ta phải là những người tiên phong thúc đẩy tiêu chuẩn chất lượng cao nhất này!

Chúc các bạn thành công với việc xây dựng những sản phẩm số hòa nhập và hoàn hảo!