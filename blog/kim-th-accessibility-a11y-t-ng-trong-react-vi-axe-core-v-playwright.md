---
title: "Kiểm thử Accessibility (a11y) tự động trong React với axe-core và Playwright"
date: 2026-06-23
description: "Hướng dẫn chuyên sâu cách tích hợp kiểm thử Accessibility tự động (a11y) vào quy trình CI/CD cho ứng dụng React sử dụng sức mạnh của axe-core và Playwright."
tags: ["Accessibility","React","Playwright","QE"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# Kiểm thử Accessibility (a11y) tự động trong React với axe-core và Playwright

Chào các anh em đồng nghiệp! Tôi là Duy Trung, một Quality Engineer chuyên sâu về kiểm thử hiệu năng và khả năng truy cập.

Trong thế giới phát triển phần mềm hiện đại, chất lượng không chỉ được đo bằng tốc độ hay tính ổn định, mà còn phải bao gồm cả việc **khả năng sử dụng của mọi người (Inclusivity)**. Accessibility (a11y) không còn là một "tính năng bổ sung" mà đã trở thành yêu cầu bắt buộc về mặt pháp lý và đạo đức đối với bất kỳ sản phẩm số nào.

Tuy nhiên, kiểm thử a11y bằng tay rất tốn thời gian và dễ bị bỏ sót các vi phạm nhỏ (minor violations). Vậy làm thế nào để chúng ta tích hợp việc kiểm tra khả năng truy cập một cách tự động, tin cậy và hiệu quả nhất trong quy trình CI/CD?

Bài viết này của tôi sẽ đi sâu vào giải pháp mạnh mẽ: kết hợp **`axe-core`** – công cụ tiêu chuẩn vàng để phát hiện lỗi a11y – với **Playwright** – một framework tự động hóa trình duyệt toàn diện. Đây là bộ đôi mà bất kỳ đội QE nào cũng nên làm quen.

***

## 💡 I. Vì sao phải kết hợp Axe và Playwright? (The Synergy)

Trước khi đi vào code, chúng ta cần hiểu vai trò của từng thành phần:

### 1. axe-core: Bộ não phân tích (The Analyzer)
*   **Là gì:** `axe-core` là một thư viện JavaScript nguồn mở được phát triển bởi Deque Systems. Nó không phải là công cụ tự động hóa, mà là *engine* chứa bộ quy tắc kiểm tra hàng trăm vấn đề a11y theo các tiêu chuẩn như WCAG (Web Content Accessibility Guidelines).
*   **Chức năng:** Khi bạn truyền vào một Selector hoặc DOM Element, `axe-core` sẽ chạy và trả về danh sách tất cả các **vi phạm (violations)** kèm theo mức độ nghiêm trọng (`critical`, `serious`, `minor`).

### 2. Playwright: Tay thực thi tin cậy (The Reliable Executor)
*   **Là gì:** Playwright là một framework tự động hóa trình duyệt tiên tiến, được Microsoft phát triển. Nó hỗ trợ các browser hiện đại (Chromium/Chrome, WebKit/Safari, Firefox) và đặc biệt nổi tiếng với tốc độ, tính ổn định, và khả năng xử lý các tình huống phức tạp như *ánh xạ sự kiện người dùng* hay *những thành phần React render động*.
*   **Vai trò trong bài viết:** Playwright giúp chúng ta điều khiển trình duyệt để:
    1. Tải ứng dụng React của bạn.
    2. Đợi cho nội dung được render hoàn toàn (quan trọng với các trạng thái SPA).
    3. *Chạy* `axe-core` trên DOM đã tải, sau đó thu thập kết quả.

**Tóm lại:** Playwright là người đưa ra bối cảnh và hành động; `axe-core` là bộ giám định viên đánh giá chất lượng nội dung trong bối cảnh đó.

***

## 🛠️ II. Hướng dẫn triển khai thực tế (Hands-on Implementation)

Giả sử chúng ta có một ứng dụng React đơn giản, và mục tiêu của chúng ta là kiểm tra trang "Giỏ hàng" sau khi người dùng thêm sản phẩm vào giỏ.

### Bước 1: Cài đặt các Dependency cần thiết
Trong dự án Node.js/React, bạn chỉ cần cài đặt Playwright và thư viện `axe-core` (hoặc đưa nó dưới dạng CDN dependency trong môi trường kiểm thử).

```bash
npm install playwright @playwright/test axe-core
# Hoặc đơn giản hóa bằng cách khai báo script ở file test.js 
```

### Bước 2: Viết kịch bản Test Playwright & Axe
Điểm mấu chốt của việc này là chúng ta phải *tiêm* thư viện `axe-core` vào môi trường DOM mà Playwright đang điều khiển và gọi hàm kiểm tra bằng cơ chế `page.evaluate()`.

Đây là một ví dụ mẫu trong file `test/a11y.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
// Giả định rằng 'axe' đã được nạp qua CDN hoặc import cục bộ 

test('Kiểm tra khả năng truy cập toàn trang giỏ hàng', async ({ page }) => {
    await page.goto('http://localhost:3000/cart');
    
    // 1. Chờ cho nội dung chính của Giỏ hàng được render xong
    await page.waitForSelector('.cart-container');

    // 2. Sử dụng page.evaluate() để chạy axe-core trực tiếp trong browser context
    const violations = await page.evaluate(async (selector) => {
        // @ts-ignore - Tạm bỏ qua lỗi type vì đang làm việc với window scope của browser
        const aXe = window['axe'] || require('axe-core'); 

        if (!aXe) {
            throw new Error("Axe core library not found in the test environment.");
        }

        // Chạy kiểm tra trên selector cụ thể (ví dụ: toàn bộ container giỏ hàng)
        const results = await aXe.run(selector); 
        return results;
    }, '.cart-container'); // Truyền selector là tham số thứ hai vào evaluate()

    // 3. Xử lý và Báo cáo kết quả
    const totalViolations = violations.violations.length;
    console.log(`\n✅ Total Accessibility Violations Found: ${totalViolations}`);

    if (totalViolations > 0) {
        // Nếu tìm thấy vi phạm, ta ném lỗi để CI/CD thất bại và báo động đội Dev
        throw new Error(`Accessibility Check Failed! Found ${totalViolations} violations.`);
    } else {
        console.log("🎉 All accessibility checks passed!");
    }
});
```

***

## 🔬 III. Giải thích chi tiết từ Duy Trung (Code Walkthrough)

Hãy cùng tôi phân tích từng đoạn code và lý do tại sao chúng ta lại chọn cách tiếp cận này:

### 1. `await page.goto('http://localhost:3000/cart');`
*   **Ý nghĩa:** Đây là bước chuẩn bị cơ bản nhất, mô phỏng hành vi người dùng truy cập trang đích cần kiểm thử. Playwright sẽ chờ cho đến khi trang được tải hoàn toàn (hoặc dựa trên các expectation của nó).

### 2. `await page.waitForSelector('.cart-container');`
*   **Ý nghĩa:** Với React, đặc biệt là các Single Page Applications (SPA), việc nội dung có thể không tải ngay lập tức mà chỉ xuất hiện sau một State Change hoặc API call. Lệnh này đảm bảo rằng chúng ta *chỉ* chạy kiểm thử khi phần tử DOM mục tiêu đã sẵn sàng và hiển thị.
*   **Lợi ích QE:** Đây là điểm khác biệt cốt lõi giữa việc chạy test đơn thuần và testing chất lượng người dùng, vì nó mô phỏng độ trễ thực tế của ứng dụng.

### 3. `const violations = await page.evaluate(async (selector) => { ... }, selector);`
*   **Đây là trái tim của kịch bản.**
    *   **Cơ chế:** Hàm `page.evaluate()` cho phép chúng ta chạy một đoạn mã JavaScript *trực tiếp* trong ngữ cảnh của trình duyệt (Browser Context), tách biệt với luồng Node.js đang chạy Playwright test. Điều này cực kỳ quan trọng vì nó giúp chúng ta truy cập vào các API DOM và thư viện chỉ có sẵn trong browser (như `axe-core`).
    *   **Logic:** Bên trong hàm, chúng ta khởi tạo `axe` và gọi `axe.run(selector)`. Việc truyền `selector` như một tham số ngoài cùng đảm bảo rằng dữ liệu selector được chuyển giao an toàn từ Playwright vào môi trường JavaScript nội bộ của trình duyệt.

### 4. Xử lý Báo cáo (The Assertion)
```typescript
if (totalViolations > 0) {
    throw new Error(`Accessibility Check Failed! Found ${totalViolations} violations.`);
} else {
    console.log("🎉 All accessibility checks passed!");
}
```
*   **Nguyên tắc QE:** Trong kiểm thử tự động, mục tiêu không chỉ là *kiểm tra*, mà còn phải **bắt lỗi (Fail Fast)**. Nếu chúng ta tìm thấy bất kỳ vi phạm nào, thay vì chỉ in ra log warning, chúng ta cần *ném một exception*. Việc này buộc framework test (Playwright) nhận diện sự kiện thất bại và báo cáo Failure Status trong hệ thống CI/CD (Jenkins, GitHub Actions...).

***

## 🚀 IV. Các Best Practice nâng cao từ Duy Trung

Việc tích hợp cơ bản ở trên đã giải quyết được 80% vấn đề. Tuy nhiên, để đạt đến mức độ *QE Lead* chuyên nghiệp, chúng ta cần lưu ý thêm các điểm sau:

### 1. Kiểm thử luồng người dùng (User Flow Testing)
Đừng chỉ kiểm tra một màn hình tĩnh (`/cart`). Hãy xây dựng kịch bản mô phỏng toàn bộ hành trình:
*   `click('Add to cart')` $\rightarrow$ `wait for confirmation modal` $\rightarrow$ `verify modal has ARIA roles` $\rightarrow$ `close modal`.
*   **Lưu ý:** Sau mỗi lần tương tác (ví dụ, mở Modal), việc thay đổi DOM có thể tạo ra các vi phạm mới. Hãy chèn lệnh `axe-core` sau *từng bước* tương tác quan trọng để giám sát tính nhất quán.

### 2. Xử lý nội dung động và trạng thái lỗi
Khi React hiển thị thông báo lỗi (ví dụ: "Mật khẩu yêu cầu ít nhất 8 ký tự"), thông báo này phải được gắn các thuộc tính ARIA (`aria-live="assertive"`) để các trình đọc màn hình (Screen Readers) nhận biết ngay lập tức. Bạn cần kiểm tra trạng thái này sau khi hành động Form Submit thất bại, không chỉ là khi trang tải.

### 3. Tích hợp CI/CD và Độ tin cậy
Đây là lúc Playwright tỏa sáng. Khi bạn chạy script trên GitHub Actions:
*   Đặt `totalViolations > 0` thành điều kiện *thất bại*.
*   Sử dụng các cơ chế báo cáo của Playwright để gắn kèm ảnh chụp màn hình hoặc bản tóm tắt violation vào report build, giúp đội Dev biết chính xác vấn đề ở đâu và khi nào.

## ✨ Kết luận

Kiểm thử Accessibility không phải là một bài kiểm tra "check-box" mà là một **cam kết về chất lượng người dùng**. Bằng cách sử dụng sức mạnh tự động hóa của Playwright để điều khiển môi trường, và bộ quy tắc khắt khe từ `axe-core` để giám định DOM, chúng ta đã biến việc đảm bảo khả năng truy cập phức tạp thành một bước kiểm thử đơn giản, nhanh chóng, và đáng tin cậy trong mỗi chu kỳ CI/CD.

Hy vọng bài viết này sẽ là kim chỉ nam giúp các đồng nghiệp QE của tôi áp dụng một quy trình test a11y hiện đại và toàn diện. Hãy nhớ rằng: **Chất lượng tốt nhất là chất lượng dành cho tất cả mọi người!**

---
*Duy Trung - Quality Engineer Lead.*