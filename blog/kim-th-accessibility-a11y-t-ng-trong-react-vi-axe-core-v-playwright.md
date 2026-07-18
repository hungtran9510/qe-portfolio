---
title: "Kiểm thử Accessibility (a11y) tự động trong React với axe-core và Playwright"
date: 2026-06-19
description: "Khám phá quy trình chuyên sâu để tích hợp kiểm thử Accessibility (a11y) vào pipeline E2E bằng sự kết hợp mạnh mẽ của axe-core và Playwright."
tags: ["Accessibility","React","Playwright"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# Kiểm thử Accessibility (a11y) tự động trong React với axe-core và Playwright

Chào các anh em đồng nghiệp trong lĩnh vực đảm bảo chất lượng phần mềm! Tôi là Duy Trung, một QE Lead. Trong hành trình xây dựng các sản phẩm số hiện đại bằng React, chúng ta thường dành rất nhiều tâm huyết để đạt được tính ổn định (stability) và khả năng trải nghiệm người dùng tuyệt vời (UX).

Tuy nhiên, có một khía cạnh cực kỳ quan trọng mà đôi khi bị xem nhẹ: **Khả năng tiếp cận (Accessibility - A11y)**. Một sản phẩm chỉ đúng nghĩa là "hoàn chỉnh" khi nó có thể được sử dụng bởi mọi đối tượng người dùng, bao gồm cả những người sử dụng trình đọc màn hình (Screen Readers), hoặc di chuyển bằng bàn phím duy nhất.

Bài viết này không chỉ dừng lại ở lý thuyết. Chúng ta sẽ đi sâu vào một giải pháp kỹ thuật rất mạnh mẽ và thực tế: **Cách tự động hóa kiểm thử Accessibility trong các ứng dụng React bằng sự kết hợp giữa Playwright và bộ công cụ axe-core.**

Nếu bạn đang loay hoay với việc "nhồi nhét" A11y testing thủ công, hoặc chỉ dùng những checker cơ bản, thì bài viết này chính là lộ trình nâng cấp quy trình kiểm thử của bạn.

---

## 💡 I. Tại sao chúng ta cần kết hợp Playwright và axe-core?

Trước khi đi vào kỹ thuật, chúng ta cần hiểu vai trò riêng biệt nhưng lại bổ sung hoàn hảo cho nhau của hai công cụ này:

### 1. Axe-Core: Bộ máy kiểm tra logic (The Logic Engine)
`axe-core` là một thư viện mạnh mẽ được xây dựng trên nền tảng của bộ công cụ axe accessibility testing. Nó không chỉ đơn thuần tìm kiếm các thẻ bị thiếu `alt` text hay `aria-*`. Thay vào đó, nó mô phỏng hàng trăm quy tắc và lỗi mà một người dùng khiếm thị hoặc một trình đọc màn hình sẽ gặp phải.

*   **Ưu điểm:** Cực kỳ chính xác, dựa trên WCAG (Web Content Accessibility Guidelines).
*   **Giới hạn:** Bản thân nó chỉ là công cụ kiểm tra logic; nó không chịu trách nhiệm điều hướng hay mô phỏng các hành động người dùng phức tạp.

### 2. Playwright: Bộ máy thực thi giao diện (The Execution Simulator)
Playwright, với khả năng hỗ trợ đa trình duyệt và tính ổn định cao, đóng vai trò là **driver**. Nó giúp chúng ta:
1.  Khởi động một môi trường web sạch sẽ (như một phiên bản Chrome/Firefox riêng).
2.  Tương tác mô phỏng chính xác các hành vi người dùng (Click, Type, Hover, Focus Shift).
3.  Chờ đợi các phần tử được render xong một cách đáng tin cậy (`await page.waitForSelector(...)`).

**Tóm lại:** Playwright giúp ta *đến* trang và *tương tác* với trạng thái của DOM; axe-core giúp ta *kiểm tra* xem trạng thái DOM đó có tuân thủ tiêu chuẩn A11y hay không.

---

## ⚙️ II. Thiết lập Môi trường Phát triển (Setup)

Để bắt đầu, giả sử bạn đã có một dự án React/Vite cơ bản và đang sử dụng Playwright Test.

### Bước 1: Cài đặt Dependencies
Chúng ta cần cài đặt `axe-core` vào project của mình.

```bash
# Chạy lệnh này trong thư mục gốc của dự án
npm install axe-core --save-dev
```

### Bước 2: Tạo Wrapper Hàm Kiểm tra (The Helper Function)
Thay vì gọi trực tiếp `axe.run()` ở mọi nơi, chúng ta nên tạo một hàm helper để xử lý việc inject và chạy kiểm thử một cách nhất quán trong Playwright.

**Ví dụ File: `utils/accessibility-checker.ts`**

```typescript
import { axe } from 'axe-core';
// Giả sử bạn đang ở within một test file của Playwright
// Lúc này, 'page' là đối tượng được cung cấp bởi Playwright Test Runner

/**
 * Chạy bộ kiểm tra Accessibility trên phần tử hoặc trang hiện tại.
 * @param page - Đối tượng Playwright Page object.
 * @param selector - Selector CSS của khu vực cần kiểm tra (mặc định là toàn bộ body).
 */
export async function checkAccessibility(page: any, selector: string = 'body'): Promise<{ violations: any[] }> {
    console.log(`\n🚀 Starting axe-core scan on selector: ${selector}`);

    // 1. Lấy phần tử DOM mục tiêu
    const elementHandle = page.$$(selector);
    if (!elementHandle) {
        throw new Error(`[A11y Check Failed] Cannot find the element with selector: ${selector}`);
    }

    // 2. Sử dụng axe để kiểm tra trực tiếp trên nội dung của phần tử đó
    // Lưu ý: Trong môi trường Playwright Test, việc truyền DOM node thường phức tạp. 
    // Cách đơn giản và đáng tin cậy nhất là chờ element xuất hiện và chạy check qua page context.

    // Đây là cú pháp được khuyến nghị khi kiểm tra toàn bộ trang:
    const results = await axe(page, { runOnly: ["wcag2a", "wcag2aa"] }); 

    // Sau đó, lọc ra các lỗi violation để dễ dàng báo cáo
    const violations = results.violations;
    
    return { violations };
}
```

> **Giải thích của Duy Trung:** Tôi đã sử dụng `runOnly` và chỉ định các mức độ WCAG cần kiểm tra (`wcag2a`, `wcag2aa`). Đây là một Best Practice vì nó giúp bạn loại bỏ tạm thời các quy tắc quá nghiêm ngặt, cho phép tập trung vào các vấn đề cốt lõi nhất của sản phẩm.

---

## 💻 III. Tích hợp và Kiểm thử (The Implementation)

Bây giờ, chúng ta sẽ đưa hàm `checkAccessibility` vào kịch bản kiểm thử End-to-End (E2E) thực tế. Giả sử chúng ta có một quy trình đăng nhập cần được kiểm tra A11y khi form xuất hiện và sau khi thành công.

**Ví dụ File: `tests/login.spec.tsx`**

```typescript
import { test, expect } from '@playwright/test';
import { checkAccessibility } from '../utils/accessibility-checker'; // Import hàm của chúng ta

// Giả sử trang web mẫu có form đăng nhập tại '/login'
const LOGIN_URL = '/login'; 

test.describe('A11y E2E Flow - Login Form', () => {

    // Test Case 1: Kiểm tra A11y ngay khi tải trang (Initial Load)
    test('should pass initial accessibility scan on the login page', async ({ page }) => {
        await test.step('Navigate to the login page', async () => {
            await page.goto(LOGIN_URL);
        });

        // Chờ đợi form chính hiển thị để đảm bảo DOM đã sẵn sàng
        await page.waitForSelector('#username-field'); 

        // BƯỚC QUAN TRỌNG: Gọi hàm kiểm tra A11y trên toàn bộ nội dung của trang
        const results = await checkAccessibility(page);

        // Assertions (Khẳng định)
        if (results.violations && results.violations.length > 0) {
            console.error("🛑 ACCESSIBILITY VIOLATIONS FOUND:", JSON.stringify(results.violations, null, 2));
            expect(results.violations).toHaveLength(0); // Nếu tìm thấy violation, test sẽ thất bại
        } else {
             console.log("✅ Accessibility passed! No major violations detected.");
        }
    });


    // Test Case 2: Kiểm tra A11y sau khi tương tác (After Interaction)
    test('should pass A11y scan after successful form submission', async ({ page }) => {
        await test.step('Fill and submit the form', async () => {
            await page.fill('#username-field', 'user@example.com');
            await page.fill('#password-field', 'securepass');
            await page.click('#submit-button');

            // Chờ đợi trang chuyển đến Dashboard (Giả sử nó render một thông báo thành công)
            await page.waitForURL('/dashboard'); 
        });
        
        // Giả định rằng màn hình dashboard chứa thông báo "Welcome back!"
        const notificationSelector = '#success-message';

        // BƯỚC QUAN TRỌNG: Kiểm tra khu vực mới (DOM đã thay đổi)
        await test.step('Run A11y check on the success message area', async () => {
            const results = await checkAccessibility(page, notificationSelector); 

            if (results.violations && results.violations.length > 0) {
                console.error("🛑 ACCESSIBILITY VIOLATIONS FOUND:", JSON.stringify(results.violations, null, 2));
                expect(results.violations).toHaveLength(0);
            } else {
                console.log("✅ Accessibility passed on dynamic content.");
            }
        });

    });
});
```

---

## ⭐ IV. Những Điều Nên Biết (Pro-Tips của QE Lead)

Việc tự động hóa A11y không chỉ là viết code mà còn là thay đổi tư duy testing. Dưới đây là ba điểm chuyên sâu tôi muốn chia sẻ:

### 1. Kiểm thử Trạng thái Tập trung (Focus State Management)
Vấn đề lớn nhất trong A11y tự động hóa là **sự tương tác**. Bạn không thể chỉ check DOM tĩnh khi trang load; bạn phải kiểm tra các thay đổi của Focus.
*   **Cách giải quyết:** Khi viết test, hãy mô phỏng toàn bộ luồng người dùng (User Flow). Ví dụ: `await page.focus('#input-field')` sau đó chạy `checkAccessibility(page)` để đảm bảo rằng khi element được focus, nó có state và aria attributes chính xác.

### 2. Tích hợp vào CI/CD Pipeline (Shift Left)
A11y testing phải là một phần **bắt buộc** trong pipeline kiểm thử của bạn. Nếu kết quả A11y test thất bại, build phải bị fail ngay lập tức.

*   **Lời khuyên:** Đừng chạy A11y scan chỉ khi gần release. Hãy tích hợp nó vào các bước Build/Test Unit và Integration Test ở mức độ thấp nhất để giúp developer nhận ra lỗi **ngay khi họ commit code**. (Đây chính là tinh thần "Shift Left".)

### 3. Xử lý False Negatives & False Positives
*   **False Negative:** Hệ thống PASS nhưng người dùng gặp vấn đề A11y thực tế. *Nguyên nhân:* Bạn chỉ kiểm tra một phần nhỏ của DOM, hoặc bỏ sót các luồng tương tác phức tạp (modal, accordion mở ra).
*   **False Positive:** Hệ thống FAIL do quy tắc quá chặt chẽ mà về mặt ngữ cảnh người dùng vẫn ổn. *Giải pháp:* Luôn xem xét **bối cảnh sử dụng thực tế**. Nếu axe báo lỗi `aria-label` cho một icon có chức năng rõ ràng, bạn cần quyết định: Có thể bỏ qua (Ignore) bằng cách bổ sung thuộc tính kiểm soát (`{ "ignore": "..." }`) hay cần fix code?

---

## 📚 Kết Luận

Kết hợp Playwright và axe-core mang lại cho chúng ta một bộ công cụ E2E vô cùng mạnh mẽ để đảm bảo chất lượng không chỉ về mặt chức năng (Functionality) mà còn về trải nghiệm toàn diện (Accessibility).

Việc tích hợp A11y vào quy trình kiểm thử tự động sẽ giúp đội ngũ QE của bạn giảm thiểu rủi ro pháp lý, cải thiện UX cho tất cả người dùng và xây dựng nên những sản phẩm thực sự đẳng cấp.

Chúc các anh em thành công trong việc nâng cao chất lượng phần mềm! Nếu có bất kỳ thắc mắc nào về cách tối ưu hóa cú pháp test hay quy trình CI/CD, đừng ngần ngại để lại comment nhé!