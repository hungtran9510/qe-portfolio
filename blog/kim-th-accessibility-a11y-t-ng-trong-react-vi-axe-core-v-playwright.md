---
title: "Kiểm thử Accessibility (a11y) tự động trong React với axe-core và Playwright"
date: 2026-06-25
description: "Hướng dẫn chuyên sâu từ Duy Trung về việc tích hợp kiểm thử a11y mạnh mẽ bằng axe-core và Playwright trong các ứng dụng React hiện đại."
tags: ["Accessibility","React","Playwright"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# Kiểm thử Accessibility (a11y) tự động trong React với axe-core và Playwright

Xin chào các đồng nghiệp Dev và QE! Tôi là Duy Trung. Trong thế giới phát triển Web hiện đại, việc tạo ra những sản phẩm không chỉ *hoạt động* tốt mà còn phải *có thể sử dụng được cho mọi người* (inclusive) là một yêu cầu bắt buộc, không còn là tính năng bổ sung.

Nếu bạn đang xây dựng các ứng dụng React phức tạp và muốn đảm bảo chúng thân thiện với cả người dùng thông thường lẫn những người dùng sử dụng công nghệ hỗ trợ (như Screen Reader), thì chủ đề hôm nay chính là dành cho bạn: **Kiểm thử Accessibility (a11y) tự động bằng sự kết hợp giữa `axe-core` và Playwright.**

Bài viết này sẽ không chỉ cung cấp lý thuyết mà còn đi sâu vào thực tiễn, hướng dẫn các bước thiết lập một hệ thống kiểm thử a11y mạnh mẽ ngay trong CI/CD pipeline của bạn.

***

## 💡 I. Tại sao chúng ta cần tự động hóa Accessibility Testing?

Nhiều đội ngũ thường mắc sai lầm khi nghĩ rằng "chỉ cần làm qua Lighthouse là đủ." Mặc dù Google Lighthouse là một công cụ tuyệt vời, nó chỉ cung cấp các điểm đo lường (scores) và không thay thế được quá trình kiểm thử thực tế, đặc biệt khi chúng ta muốn nhúng quy trình này vào Unit/E2E testing.

**Vấn đề cốt lõi:**
1. **Tính nhất quán (Consistency):** Kiểm thử thủ công dễ bị sót. Tự động hóa đảm bảo mọi luồng người dùng đều được kiểm tra với cùng một tiêu chuẩn a11y.
2. **Tích hợp quy trình (Shift Left):** Việc phát hiện lỗi a11y sớm, ngay khi code được commit, giúp tiết kiệm hàng trăm giờ sửa chữa sau này.

Đây là lúc chúng ta cần đến sự kết hợp sức mạnh giữa các thư viện chuyên biệt: **`axe-core`** và **Playwright**.

*   **`axe-core`:** Là một công cụ kiểm thử a11y dựa trên WAI-ARIA, nó được xây dựng bởi Deque Systems. Vai trò của nó là quét DOM (Document Object Model) và xác định các vấn đề vi phạm tiêu chuẩn WCAG (Web Content Accessibility Guidelines).
*   **Playwright:** Là một framework E2E testing hiện đại hỗ trợ nhiều trình duyệt, hoạt động với khả năng mô phỏng người dùng thực tế (nhấp chuột, nhập liệu, chờ đợi trạng thái DOM thay đổi).

Khi kết hợp hai thứ này: Playwright giúp chúng ta **đến được** trang và kích hoạt hành vi của người dùng; còn `axe-core` giúp chúng ta **kiểm tra** tính khả dụng (usability) của nội dung tại điểm đó.

***

## 🛠️ II. Thiết lập Môi trường Phát triển (Prerequisites)

Để bắt đầu, hãy đảm bảo dự án React của bạn đã được cấu hình với Playwright.

```bash
# Cài đặt dependencies cần thiết
npm install -D @axe-core/react playwright # Hoặc chỉ dùng axe-core cho testing server side
npx playwright install
```

Do `axe-core` là một thư viện kiểm tra DOM, chúng ta sẽ sử dụng nó trong ngữ cảnh của E2E testing, nơi Playwright đã tải xong trang.

***

## 🚀 III. Triển khai Kiểm thử a11y với Playwright và axe-core (The Core Logic)

Vấn đề lớn nhất khi kiểm thử a11y là việc **thực hiện kiểm tra sau khi DOM đã được Render hoàn toàn** (ví dụ: sau một API call thành công, hoặc sau khi user click vào nút mở modal).

Playwright cung cấp một cách tuyệt vời để chúng ta đánh chặn và thực thi kiểm tra tại các thời điểm cụ thể.

### 1. Phương pháp cơ bản: Kiểm tra DOM tĩnh

Đây là trường hợp đơn giản nhất, chỉ cần quét toàn bộ trang ngay sau khi load.

**`e2e-a11y.spec.ts` (Playwright Test File):**
```typescript
import { test, expect } from '@playwright/test';
// Chúng ta có thể import axe từ các wrappers hoặc dùng cách inject script
import * as axe from 'axe-core'; 

test('Should pass basic a11y checks on the homepage', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Chờ đợi nội dung chính tải xong (quan trọng!)
    await page.waitForSelector('#main-content'); 

    // Lấy toàn bộ DOM hiện tại dưới dạng string hoặc element handle
    const dom = await page.locator('body').innerHTML(); 

    // Khởi tạo axe và chạy kiểm tra trên nội dung DOM đã lấy
    // Lưu ý: Tùy thuộc vào cách bạn tích hợp, bạn có thể cần inject script 'axe.min.js' 
    // và gọi hàm window.axe() từ môi trường Playwright.
    const results = await new Promise(resolve => {
        // Đây là pseudo-code hóa cho việc gọi axe qua context của page:
        page.evaluate((content) => {
            axe.run(document, { rules: ['wcag2a', 'wcag2aa'] }, (err, results) => {
                window.__AXE_RESULTS = results; // Lưu kết quả vào window scope
                resolve(results);
            });
        }, dom); 
    });

    // Kiểm tra xem có lỗi nào không
    const violations = results.violations;
    expect(violations).toHaveLength(0); 
    console.log("🥳 Accessibility checks passed!");
});
```

**Giải thích của Duy Trung:**
Trong ví dụ trên, tôi đã minh họa cách sử dụng `page.evaluate()` để đảm bảo rằng chúng ta đang chạy hàm kiểm tra a11y *bên trong* ngữ cảnh trình duyệt (Browser Context) mà Playwright điều khiển. Việc này cực kỳ quan trọng vì nó cho phép `axe-core` truy cập vào DOM thực tế, chứ không phải là một chuỗi HTML thuần túy.

### 2. Phương pháp nâng cao: Kiểm tra sau các hành động tương tác (Interaction Testing)

Đây là kịch bản phức tạp và phổ biến nhất trong React/SPA (Single Page Application), nơi nội dung được thêm vào hoặc thay đổi bằng JavaScript (ví dụ: mở Modal, Toggle tab). Chúng ta không thể chỉ kiểm tra DOM ban đầu.

**Giả sử:** Component `Modal` của bạn sẽ hiển thị một popup khi người dùng nhấp vào nút "Open Modal". เรา phải đảm bảo rằng modal đó có các thuộc tính ARIA cần thiết (`aria-expanded`, `role="dialog"`, Focus Trap).

```typescript
test('Should pass a11y checks when the modal is displayed', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // 1. Hành động tương tác gây thay đổi DOM
    const openButton = await page.locator('#open-modal-button');
    await openButton.click(); // Giả sử việc click này hiển thị modal

    // 2. Chờ Modal xuất hiện (quan trọng: Playwright's auto-wait giúp việc này)
    await page.waitForSelector('.modal-dialog', { state: 'visible' });

    // 3. Kiểm tra a11y trên khu vực Modal mới được tạo ra/hiển thị
    const modalDom = await page.locator('.modal-dialog').innerHTML();
    
    // Chạy axe chỉ riêng với phần tử modal (tối ưu hóa hiệu suất)
    const results = await new Promise(resolve => {
        page.evaluate((content) => {
            axe.run(document.querySelector('.modal-dialog'), { rules: ['wcag2a'] }, (err, results) => {
                window.__AXE_RESULTS__ = results; 
                resolve(results);
            });
        }, modalDom);
    });

    const violations = results.violations;
    expect(violations).toHaveLength(0);
    console.log("✅ Modal a11y checks passed!");
});
```

**Điểm nhấn chuyên môn của Duy Trung:**
Chúng ta đã áp dụng kỹ thuật **"Scoped Testing"**. Thay vì quét toàn bộ trang (có thể chứa hàng nghìn dòng mã không liên quan), chúng ta cô lập khu vực đang được thay đổi (DOM của Modal) và chỉ chạy `axe-core` trên phạm vi đó. Điều này giúp tăng tốc độ test và giúp báo cáo lỗi a11y chính xác hơn rất nhiều.

***

## 💡 IV. Tối ưu hóa và Best Practices trong CI/CD

Để việc kiểm thử a11y trở thành một phần không thể thiếu của vòng lặp Dev-Test-Deploy, hãy lưu ý những điểm sau:

### 1. Hạn chế tối đa các Rules bị bỏ qua (Rules Exemptions)
Trong quá trình phát triển, bạn có thể phải vô hiệu hóa tạm thời các luật a11y để hoàn thiện tính năng. Tuy nhiên, **tuyệt đối không** Hardcode việc loại trừ lỗi trong code production. Hãy xem việc này là một "Technical Debt" cần được giải quyết bằng cách thay đổi cấu trúc component/DOM.

### 2. Xử lý Loading States
Hãy đảm bảo rằng các khu vực chưa tải xong hoặc đang ở trạng thái loading phải có thông báo rõ ràng cho Screen Reader (ví dụ: sử dụng `aria-live="polite"`). Các công cụ kiểm thử tự động cần được thiết lập để **chờ đợi** cho đến khi trạng thái cuối cùng (End State) được render.

### 3. Sử dụng Custom Reporters
Nếu bạn muốn tích hợp báo cáo a11y vào Jest/Vitest hoặc Cypress Test Report, hãy tạo một Custom Reporter. Báo cáo này không chỉ nên liệt kê các lỗi như màu sắc hay Contrast Ratio mà còn phải kèm theo thẻ WCAG tiêu chuẩn (ví dụ: **WCAG 2.1 AA - [Name]**).

### 4. Tích hợp vào Pre-commit Hooks
Đối với những thay đổi liên quan đến component UI lớn, hãy xem xét việc chạy một lệnh `axe-core` lỏng lẻo (lightweight check) ngay trong pre-commit hook của developer để bắt các lỗi cơ bản ngay tại nguồn.

***

## 🎓 Kết luận từ QE Lead Duy Trung

Kiểm thử Accessibility không phải là một "bước kiểm tra" mà nó là một **Mindset** – một tư duy được thấm nhuần vào toàn bộ quy trình phát triển phần mềm của đội ngũ bạn.

Sự kết hợp giữa sức mạnh tương tác của Playwright và độ chính xác về tiêu chuẩn của `axe-core` không chỉ giúp code React của bạn đạt điểm 10/10 về mặt chức năng, mà còn đảm bảo nó mở ra cánh cửa cho tất cả người dùng.

Hãy bắt đầu tích hợp công cụ này vào Test Suite ngay từ hôm nay, và tôi tin rằng chất lượng sản phẩm của đội bạn sẽ tăng lên một tầm cao mới!

Chúc các bạn thành công với những dự án inclusive nhé!

***
**Duy Trung - QE Lead**