---
title: "Kiểm thử Accessibility (a11y) tự động trong React với axe-core và Playwright"
date: 2026-06-22
description: "Hướng dẫn chuyên sâu cách tích hợp kiểm thử Accessibility mạnh mẽ vào quy trình E2E bằng sự kết hợp tối ưu giữa axe-core và Playwright."
tags: ["Accessibility","React","Playwright"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# Kiểm thử Accessibility (a11y) tự động trong React với axe-core và Playwright

Chào các bạn đồng nghiệp! Tôi là Duy Trung, một Quality Engineer chuyên sâu về đảm bảo chất lượng phần mềm.

Trong thế giới phát triển web hiện đại, việc xây dựng một ứng dụng chỉ *hoạt động* chưa đủ; nó còn phải *truy cập được* (Accessible). Accessibility hay a11y không chỉ là vấn đề tuân thủ pháp lý (như WCAG) mà còn là một yếu tố nhân văn, đảm bảo mọi người – bao gồm cả những người dùng khiếm thị, người dùng sử dụng công nghệ hỗ trợ (screen readers), hoặc người bị hạn chế vận động – đều có thể tương tác và sử dụng sản phẩm của chúng ta.

Nhiều đội phát triển thường coi a11y là một "tính năng bổ sung" được kiểm tra thủ công ở cuối chu trình QA. Đây là sai lầm lớn nhất tôi từng thấy!

Trong bài viết hôm nay, tôi sẽ chia sẻ với các bạn quy trình hiện đại và mạnh mẽ để tích hợp việc kiểm thử Accessibility tự động ngay vào khâu End-to-End (E2E) testing của React, sử dụng bộ công cụ tối ưu: **`axe-core`** và **Playwright**.

---

## 💡 I. Tại sao cần kết hợp Axe-core và Playwright?

Để hiểu được sức mạnh của combo này, chúng ta cần phân biệt vai trò của từng thành phần:

### 1. `axe-core`: Bộ động cơ (The Engine)
`axe-core` là một công cụ audit accessibility nổi tiếng do Deque Systems phát triển. Nó không phải là một thư viện kiểm thử; nó là một *bộ luật* (rule set) cực kỳ mạnh mẽ, được xây dựng dựa trên các tiêu chuẩn WCAG 2.1/2.2. Nhiệm vụ của nó là quét cây DOM hiện tại và báo cáo bất kỳ vi phạm nào về khả năng truy cập.

### 2. Playwright: Trình duyệt mô phỏng (The Browser Simulator)
Playwright là một framework tự động hóa E2E tiên tiến từ Microsoft. Điểm mạnh nhất của nó là khả năng điều khiển các trình duyệt hiện đại (Chromium, Firefox, WebKit) theo cách cô lập và thực tế cao.

### 🚀 Sức Mạnh Kết Hợp (The Synergy)
*   **Playwright** giúp bạn mô phỏng hành vi người dùng *thực thụ*: click vào nút này, cuộn đến phần kia, chờ đợi API phản hồi... Nó đảm bảo rằng việc kiểm thử được thực hiện trong môi trường trình duyệt hoàn chỉnh.
*   Khi sự kiện đó xảy ra (ví dụ: Component A hiển thị sau khi click button B), chúng ta dùng **`axe-core`** để kiểm tra trạng thái DOM *sau* khi các thay đổi đã diễn ra, đảm bảo rằng cả tương tác và cấu trúc đều tuân thủ a11y.

Kết quả là: Chúng ta không chỉ kiểm tra component tĩnh (Unit Test) mà còn kiểm tra hành trình người dùng phức tạp (E2E), đồng thời *bắt buộc* tính năng accessibility phải đi kèm với mọi hành trình đó.

---

## ⚙️ II. Hướng dẫn Triển khai Thực tế (Hands-on Implementation)

Bài viết này giả định bạn đã có một dự án React đang sử dụng Playwright cho các bài test E2E của mình.

### Bước 1: Cài đặt Dependencies

Chúng ta cần cài đặt `playwright` và đảm bảo rằng chúng ta có thể truy cập engine `axe-core`.

```bash
# Cài đặt playwright (nếu chưa có)
npm install @playwright/test
# Chạy lệnh này để tải các trình duyệt cần thiết
npx playwright install
```

### Bước 2: Viết Test Scenario A11y cơ bản

Trong Playwright, chúng ta sẽ sử dụng một hàm trợ giúp (helper function) hoặc trực tiếp gọi `axe.run` trên tài liệu (document).

Đây là cấu trúc test điển hình trong file `.spec.ts`:

```typescript
// tests/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import * as axe from 'axe-core'; // Giả định bạn đã import hoặc wrap axe-core vào module hỗ trợ

/**
 * Hàm kiểm tra Accessibility tổng thể cho một Selector Element.
 * @param page - Đối tượng Playwright Page context.
 * @param selector - CSS Selector để giới hạn phạm vi audit.
 */
async function checkAccessibility(page: any, selector: string) {
    // 1. Chờ đảm bảo tất cả các element cần thiết đã tải xong (Quan trọng cho E2E)
    await page.waitForSelector(`${selector} *`);

    // 2. Lấy nội dung DOM hiện tại trong ngữ cảnh của Playwright
    const content = await page.evaluate((sel: string) => {
        return document.querySelector(sel);
    }, selector);

    if (!content) {
         console.error(`[A11y Check Failed] Không tìm thấy phần tử với selector: ${selector}`);
         return []; // Trả về mảng rỗng nếu không tìm thấy
    }

    // 3. Chạy axe-core trên nội dung DOM đã lấy ra (cần chuyển thành Node để axe hoạt động)
    const results = await axe(content, { /* Cấu hình tùy chọn */ });

    // 4. Kiểm tra kết quả: Nếu có bất kỳ lỗi nào (violations), thì Test sẽ Fail
    if (results.violations && results.violations.length > 0) {
        console.error('🚨 [A11y VIOLATION] Phát hiện các vấn đề Accessibility!');
        // Log chi tiết để dễ debugging
        results.violations.forEach(violation => {
            console.log(`- Rule: ${violation.id} (${violation.description})`);
            console.log(`  Affected elements count: ${violation.nodes.length}`);
        });
    } else {
         console.log('✅ [A11y Success] Không phát hiện vi phạm Accessibility nào.');
    }

    // Quan trọng: Trong Playwright, chúng ta ném lỗi thủ công để buộc test FAIL khi có vi phạm.
    if (results.violations && results.violations.length > 0) {
        throw new Error(`Accessibility check failed! Found ${results.violations.length} violations.`);
    }
}


test.describe('Feature: Giỏ hàng E-commerce', () => {
    // Thiết lập trước khi chạy test group này (Nếu cần load trang tĩnh)
    test.beforeEach(async ({ page }) => {
        await page.goto('/checkout');
    });

    test('Nên hiển thị giỏ hàng đầy đủ và tuân thủ a11y', async ({ page }) => {
        // Mô phỏng hành vi người dùng: Thêm sản phẩm vào giỏ hàng
        await page.click('#add-to-cart-button');
        
        // !!! Đây là thời điểm vàng để chạy kiểm tra A11y !!!
        // Chúng ta kiểm tra phần tử chứa toàn bộ khu vực Giỏ hàng (ví dụ: class="shopping-cart")
        await checkAccessibility(page, '.shopping-cart');

        // Sau đó tiếp tục các bài test chức năng khác...
    });

    test('Nút bấm cần phải có nhãn mô tả rõ ràng', async ({ page }) => {
        // Ví dụ: Kiểm tra nút Submit Form (nên sử dụng label và aria-label)
         await checkAccessibility(page, '#checkout-form');
    });
});
```

### 📝 Phân tích chi tiết của Duy Trung về đoạn mã trên

1.  **`await page.waitForSelector(...)`**: Đây là bước tối quan trọng trong E2E testing. Trước khi kiểm tra a11y, chúng ta phải đảm bảo rằng DOM đã ổn định và tất cả các element cần kiểm tra đều đã được render xong (đặc biệt là sau các hành động như AJAX/API calls).
2.  **`page.evaluate(...)`**: Thay vì chỉ dựa vào Playwright's selector engine, chúng ta phải chạy `axe-core` trong *ngữ cảnh* của browser tab đó. `page.evaluate()` cho phép chúng ta thực thi JavaScript (trong trường hợp này là lấy một phần tử DOM cụ thể) từ góc nhìn của trình duyệt mà không bị các rào cản Cross-Origin.
3.  **`const results = await axe(content)`**: Đây là lời gọi cốt lõi. Chúng ta đưa toàn bộ nội dung được cô lập (`content`) vào `axe()` để nhận báo cáo vi phạm.
4.  **Sử dụng `throw new Error(...)`**: Về mặt chất lượng, một bài kiểm tra nên *fail* khi có lỗi. Thay vì chỉ in ra console log (mà các nhà phát triển dễ bỏ qua), việc ném Exception sẽ buộc Playwright framework phải báo cáo test case này là **FAIL**, từ đó ngăn chặn mã bị vi phạm a11y được merge vào nhánh chính.

---

## ⭐ III. Các Thực hành Tốt nhất (Best Practices) từ QE Lead

Là một chuyên gia QA, tôi muốn nhấn mạnh thêm vài điểm để việc tích hợp a11y của các bạn đạt hiệu suất cao nhất:

### 1. Đừng chỉ kiểm tra bằng công cụ tự động
Các công cụ như `axe-core` tuyệt vời ở việc phát hiện vi phạm *cấu trúc* (ví dụ: thiếu `alt text`, sai thứ tự tab). Tuy nhiên, chúng không thể bắt được các lỗi về *trải nghiệm* người dùng.

**Lời khuyên:** Luôn kết hợp kiểm thử tự động với **Kiểm thử thủ công bằng Screen Readers** (Jaws, NVDA) và **kiểm tra bằng sự đồng cảm**.

### 2. Tích hợp vào CI/CD Pipeline
Việc chạy a11y test phải là một bước *bắt buộc* trong mỗi pull request (PR). Hãy cấu hình Jenkins, GitHub Actions, hoặc GitLab Runner để khi có mã mới được push lên, Playwright sẽ tự động chạy suite kiểm thử này và thất bại nếu phát hiện lỗi.

### 3. Phân chia Phạm vi Kiểm tra (Scoped Auditing)
Không nên luôn chạy `axe(document)` trên toàn bộ trang vì nó rất chậm. Thay vào đó:
*   **Kiểm tra cấp độ component:** Khi bạn test một Modal, chỉ cần dùng `await checkAccessibility(page, '#modal-container')`. Điều này giúp tăng tốc độ và tập trung phạm vi lỗi hơn.
*   **Tạo Helper Function chuyên biệt:** Như tôi đã minh họa ở trên (`checkAccessibility`), hãy đóng gói logic này thành một hàm dễ tái sử dụng trong toàn bộ codebase test của bạn.

---

## 📚 Kết luận: A11y là Chất lượng cốt lõi (Core Quality)

Kết hợp `axe-core` và Playwright không chỉ giúp các bài test E2E của bạn hoàn chỉnh hơn về mặt chức năng, mà còn nâng tầm chúng lên thành những bộ kiểm thử chất lượng cao, bao trùm cả khía cạnh **Trách nhiệm Xã hội** (Social Responsibility).

Nếu đội ngũ phát triển áp dụng quy trình này một cách kỷ luật, tôi tin rằng chúng ta sẽ xây dựng được các sản phẩm không chỉ đẹp mắt và mạnh mẽ về mặt kỹ thuật, mà còn mở rộng khả năng tiếp cận cho mọi thành viên trong cộng đồng.

Chúc các bạn luôn tự tin với những code base vừa hoạt động tốt, vừa tử tế! Nếu có thắc mắc gì, đừng ngần ngại bình luận bên dưới nhé!