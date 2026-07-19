---
title: "Kiểm thử Accessibility (a11y) tự động trong React với axe-core và Playwright"
date: 2026-06-20
description: "Hướng dẫn chuyên sâu cách tích hợp axe-core vào quy trình kiểm thử e2e bằng Playwright để đảm bảo tính khả dụng trên mọi trải nghiệm người dùng."
tags: ["Accessibility","React","Playwright"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# Kiểm thử Accessibility (a11y) tự động trong React với axe-core và Playwright

Chào các bạn kỹ sư chất lượng, tôi là Duy Trung. Trong hành trình xây dựng sản phẩm phần mềm hiện đại, chúng ta thường tập trung tối đa vào chức năng (Functionality) và hiệu suất (Performance). Tuy nhiên, có một khía cạnh cực kỳ quan trọng mà nhiều đội ngũ đôi khi vô tình bỏ qua: **Khả năng Tiếp cận (Accessibility - a11y)**.

Một giao diện không thể sử dụng được bởi người dùng khiếm thị (sử dụng screen readers) hoặc người gặp khó khăn vận động, về cơ bản là một sản phẩm thất bại, bất kể chức năng của nó có hoàn hảo đến đâu.

Bài viết này sẽ là cẩm nang chuyên sâu, giúp các bạn tận dụng sức mạnh kết hợp giữa **`axe-core`** – công cụ tiêu chuẩn vàng để kiểm toán a11y – và **Playwright** – nền tảng tự động hóa E2E mạnh mẽ nhất hiện nay, để đưa việc kiểm thử a11y trở thành một phần không thể thiếu trong pipeline CI/CD của React.

***

## 💡 I. Tại sao phải kết hợp axe-core và Playwright?

Trước khi đi vào các bước kỹ thuật, chúng ta cần hiểu rõ vai trò của từng thành phần:

### 1. Axe-Core là gì?
`axe-core` không chỉ là một thư viện kiểm tra đơn thuần; nó là một **Accessibility Engine** được xây dựng dựa trên tiêu chuẩn WCAG (Web Content Accessibility Guidelines). Nó hoạt động bằng cách phân tích cấu trúc DOM (Document Object Model) và đánh giá từng phần tử có tuân thủ các quy tắc a11y hay không.

*   **Ưu điểm:** Rất toàn diện, cập nhật liên tục với các phiên bản WCAG mới nhất.
*   **Hạn chế nếu dùng standalone:** Nó chỉ kiểm tra trạng thái tĩnh (static state) của DOM tại thời điểm chạy. Nếu React component của bạn thay đổi nội dung động hoặc xử lý bằng JavaScript phức tạp, `axe` có thể bỏ sót lỗi.

### 2. Playwright đóng vai trò gì?
Playwright là một framework tự động hóa browser mới và rất mạnh mẽ. Nó cho phép chúng ta:

1.  **Mô phỏng hành vi người dùng thật:** Click, nhập liệu, chờ đợi các phần tử được render (Handling asynchronous loading).
2.  **Đảm bảo Cross-Browser Compatibility:** Kiểm tra trên nhiều trình duyệt khác nhau (Chromium, WebKit, Firefox).
3.  **Truy cập Context của Browser:** Quan trọng nhất là nó cho phép chúng ta chạy mã JavaScript phức tạp *trong ngữ cảnh* của browser đang mô phỏng (The page context), điều này giúp việc truyền tải DOM hiện tại và đánh giá bằng `axe` trở nên chính xác tuyệt đối.

### 🛠️ Tóm lại sự cộng hưởng:
Playwright đảm bảo component đã được **render đúng cách** trong môi trường trình duyệt thực, sau đó chúng ta dùng Playwright để **cung cấp toàn bộ DOM đang hoạt động đó** cho `axe-core` tiến hành kiểm toán a11y sâu nhất.

***

## 🚀 II. Hướng dẫn thiết lập và Triển khai (Setup & Implementation)

Chúng ta sẽ giả định bạn đã có một dự án React với Playwright được cài đặt sẵn.

### Bước 1: Cài đặt Dependency
Bạn cần `axe-core` và thường là các loại hỗ trợ để giao tiếp nó trong môi trường Node/Playwright.

```bash
npm install axe-core playwright --save-dev
# Hoặc nếu bạn đang sử dụng các thư viện hỗ trợ testing khác, hãy đảm bảo chúng tương thích
```

### Bước 2: Viết Logic Test Case (The Core Script)

Giả sử chúng ta có một Component React với form đăng nhập. Chúng ta muốn kiểm tra cả tính năng (Form hoạt động không?) và khả năng tiếp cận (Các nhãn, trường input đã được gắn đúng `aria-label` chưa?).

Chúng ta sẽ viết test script trong file `test/a11y.spec.ts`:

```typescript
// test/a11y.spec.ts
import { test, expect } from '@playwright/test';
import * as axe from 'axe-core'; // Import thư viện axe

test('Kiểm tra accessibility của trang đăng nhập', async ({ page }) => {
    await page.goto('/login'); // Điều hướng đến component cần kiểm tra

    // 1. Chờ đợi nội dung được tải hoàn toàn (Đặc biệt quan trọng với React SPA)
    await page.waitForLoadState('networkidle'); 

    // 2. Thực hiện tương tác người dùng để kích hoạt các trạng thái khác nhau
    // Ví dụ: Nhập email và click nút (để đảm bảo JS đã chạy và DOM đã cập nhật)
    await page.fill('#email-input', 'user@example.com');
    await page.click('#submit-button');

    // 3. Lấy toàn bộ DOM hiện tại của trang web dưới dạng chuỗi HTML/Object
    const htmlContent = await page.content();
    
    // 4. CHẠY AXE: Sử dụng page.evaluate() để chạy axe-core trực tiếp trong Context của Browser
    const axeResults: any = await page.evaluate(async () => {
        // Chạy axe trên toàn bộ body DOM hiện tại (document.body)
        const results = await axe.run(document, { 
            // Thiết lập các cấu hình nếu cần (ví dụ: chỉ kiểm tra severity error)
            rules: { 'aria-required': { enabled: true } } 
        });
        return results;
    });

    // 5. Phân tích kết quả và xác nhận Passed/Failed
    const failures = axeResults.violations;
    console.log(`\n✅ Axe Check Status: ${failures ? 'FAIL' : 'PASS'}`);
    
    if (failures && failures.length > 0) {
        // Nếu có lỗi a11y, ném ra lỗi test để CI/CD biết rằng test đã thất bại
        const message = `🚨 FAIL AXE-CORE: Phát hiện ${failures.length} vấn đề accessibility nghiêm trọng:\n` + 
                        JSON.stringify(failures, null, 2);
        expect(true).toBeFalse(message); // Buộc test fail với thông báo chi tiết
    } else {
        console.log('✅ Accessibility Check Passed! Không phát hiện lỗi WCAG nào.');
    }

});
```

### 📝 Phân tích Chiều sâu từ Duy Trung (Expert Notes)

Tôi xin giải thích từng đoạn code trên để các bạn hiểu được *tại sao* chúng ta phải làm như vậy:

1. **`await page.waitForLoadState('networkidle');`**
    *   **Ý nghĩa:** Đây là bước tối quan trọng nhất trong kiểm thử SPA (Single Page Application). React có thể render nội dung rất nhanh, nhưng nếu việc tải các tài nguyên API phụ thuộc xảy ra sau đó, Playwright cần thời gian để chờ đợi. Lệnh này đảm bảo rằng mọi thứ đã "ổn định" trước khi ta bắt đầu kiểm tra.
2. **`await page.evaluate(async () => { ... });`**
    *   **Đây là điểm mấu chốt:** Khi bạn dùng `page.textContent()` hoặc truy cập DOM bằng API Node, bạn đang làm việc ở tầng Node.js của Playwright. Tuy nhiên, `axe-core` chỉ hoạt động trong môi trường Browser (Browser context). Hàm `page.evaluate()` cho phép chúng ta thực thi một đoạn mã JavaScript *trực tiếp* trên tab trình duyệt mà Playwright đang mô phỏng. Điều này giúp chúng ta có quyền truy cập vào đối tượng `document` sống và chính xác nhất.
3. **`axe.run(document, { ... });`**
    *   Chúng ta truyền vào toàn bộ đối tượng `document`. Axe sẽ tự động chạy các kiểm tra WCAG (bao gồm Missing Alt Text, Incorrect Roles, Tab Order issues...) trên *tất cả* các phần tử đã được render tại thời điểm này.
4. **Xử lý kết quả và Báo cáo:**
    *   Sử dụng `expect(true).toBeFalse(...)` là kỹ thuật chuyên nghiệp để **ép buộc test fail** khi phát hiện lỗi a11y. Thay vì chỉ in ra console log (và khiến CI/CD nghĩ rằng test đã PASS), việc ném lỗi sẽ đảm bảo pipeline của bạn dừng lại và báo cáo lỗi này như một `Test Failure`, yêu cầu lập trình viên phải khắc phục ngay lập tức.

***

## ⚙️ III. Các Best Practices Nâng Cao cho QE Lead

Để nâng tầm quá trình kiểm thử a11y, tôi xin chia sẻ vài mẹo mà các đội ngũ chất lượng cao thường áp dụng:

### 🌟 1. Kiểm thử Trạng thái Bất thường (Error/Loading States)
Đừng chỉ test luồng thành công. Bạn phải test những trạng thái nguy hiểm nhất:
*   **Trạng thái Loading:** Đảm bảo rằng khi nội dung đang tải, component hiển thị `aria-live="polite"` để screen readers thông báo cho người dùng biết điều gì đang xảy ra (ví dụ: "Đang tải dữ liệu...")
*   **Trạng thái Lỗi Validation:** Khi form bị lỗi, các message lỗi phải được gắn đúng thuộc tính ARIA (`aria-invalid` và `aria-describedby`) để screen reader đọc to cả thông báo lỗi.

### 🌟 2. Tích hợp Kiểm tra Nội dung (Content Testing)
Bạn có thể mở rộng `axe` để không chỉ kiểm tra cấu trúc mà còn kiểm tra nội dung:
*   **Kiểm tra Văn bản thay thế:** Viết test case để đảm bảo rằng mọi hình ảnh quan trọng đều được gán thuộc tính `alt="..."` hợp lý. Nếu thiếu, axe sẽ báo lỗi (Missing Alt Text), nhưng bạn nên chủ động viết assertion cho các trường hợp đó.

### 🌟 3. Quản lý Báo cáo (Reporting)
Khi hệ thống CI/CD của bạn thất bại vì a11y violation, nó cần một report dễ đọc. Thay vì chỉ log JSON thô từ `axe`, hãy xây dựng một wrapper function để:
1.  Đếm tổng số Violation.
2.  Nhóm các lỗi theo mức độ nghiêm trọng (Critical, Serious, Minor).
3.  Tạo mô tả thân thiện cho Dev và PM biết cần phải sửa gì và vì sao việc đó lại quan trọng.

***

## 📚 Kết luận

Kiểm thử Accessibility không phải là một "tính năng bổ sung" mà nó phải là **một yêu cầu kỹ thuật cốt lõi** (Core Non-Functional Requirement). Bằng cách tích hợp `axe-core` vào Playwright, chúng ta đã biến việc kiểm toán a11y từ một quy trình thủ công tốn thời gian của Tester thành một bước tự động hóa đáng tin cậy.

Việc này giúp đội ngũ của bạn không chỉ đạt được tiêu chuẩn kỹ thuật cao mà còn thể hiện trách nhiệm xã hội (Social Responsibility) với tất cả người dùng, bao gồm cả những người có nhu cầu đặc biệt.

Chúc các bạn xây dựng nên những sản phẩm công nghệ hoàn hảo và thân thiện!

**Duy Trung**
*QE Lead | Technical Quality Advocate*