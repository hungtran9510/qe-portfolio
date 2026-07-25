---
title: "Kiểm thử Accessibility (a11y) tự động trong React với axe-core và Playwright"
date: 2026-06-26
description: "Hướng dẫn chuyên sâu cách tích hợp kiểm thử a11y tự động vào luồng CI/CD bằng sức mạnh của Playwright và thư viện axe-core."
tags: ["Accessibility","React","Playwright"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# Kiểm thử Accessibility (a11y) tự động trong React với axe-core và Playwright

Chào các đồng nghiệp, tôi là Duy Trung, một Quality Engineer.

Trong quá trình phát triển phần mềm hiện đại, chúng ta thường tập trung rất nhiều vào tốc độ (performance), tính năng (functionality) và trải nghiệm người dùng (UX). Tuy nhiên, có một khía cạnh vô cùng quan trọng nhưng thường bị xem nhẹ, đó chính là **Khả năng tiếp cận (Accessibility - a11y)**.

Một sản phẩm được đánh giá cao về UX sẽ trở nên lỗi thời nếu nó không thể sử dụng được bởi người dùng khiếm thị, người dùng vận động kém hay bất kỳ đối tượng nào sử dụng công nghệ hỗ trợ (Assistive Technology).

Bài viết này của tôi sẽ là một bài chuyên sâu, chỉ ra cách chúng ta có thể đưa kiểm thử $\text{a}1y$ vào quy trình tự động hóa chất lượng phần mềm một cách hiệu quả nhất, cụ thể là bằng sự kết hợp mạnh mẽ giữa **Playwright** và thư viện tiêu chuẩn vàng **axe-core**.

---

## 💡 I. Hiểu rõ về vấn đề: Tại sao phải kiểm thử A11y tự động?

### 1. Accessibility (A11y) là gì?
Đơn giản, $\text{a}1y$ đảm bảo rằng mọi người, bất kể họ có khả năng thể chất hay giác quan nào, đều có thể tương tác và sử dụng sản phẩm số của bạn. Các vấn đề phổ biến bao gồm:

*   Thiếu thẻ vai trò (ARIA Roles).
*   Thiếu văn bản thay thế cho hình ảnh (`alt` text).
*   Tương phản màu sắc kém.
*   Cấu trúc DOM không hợp lý, gây khó khăn cho trình đọc màn hình (Screen Reader).

### 2. Hạn chế của kiểm thử thủ công
Khi team phát triển lớn mạnh và tốc độ release nhanh, việc yêu cầu các QA chuyên trách kiểm tra $\text{a}1y$ theo từng bước là gần như bất khả thi về mặt quy mô và thời gian. Chúng ta cần một giải pháp "tự động hóa" để đảm bảo mỗi dòng code mới được commit đều phải đáp ứng tiêu chuẩn WCAG (Web Content Accessibility Guidelines).

### 3. Giải pháp: Playwright + axe-core
*   **Playwright:** Là công cụ tự động hóa trình duyệt hiện đại, mạnh mẽ trong việc mô phỏng các hành vi người dùng thực tế (nhấp chuột, nhập liệu, chờ đợi DOM load) trên nhiều trình duyệt khác nhau.
*   **axe-core:** Đây là một thư viện kiểm tra $\text{a}1y$ dựa trên WCAG được phát triển bởi Deque Systems. Nó không chỉ "báo cáo" lỗi, mà còn thực hiện các bài kiểm tra sâu về cấu trúc ngữ nghĩa và thuộc tính ARIA.

Khi kết hợp chúng lại, Playwright đảm nhận nhiệm vụ "lên sân khấu" (tải trang, tương tác), và `axe-core` đóng vai trò là "giám khảo chuyên nghiệp" luôn theo dõi mọi chi tiết trên giao diện.

---

## ⚙️ II. Hướng dẫn triển khai thực tế: Integration Guide

Để bắt đầu dự án này, chúng ta giả định bạn đã có một dự án React/TypeScript và Playwright được cài đặt sẵn (`@playwright/test`).

### Bước 1: Cài đặt axe-core
Chúng ta cần đưa thư viện `axe` vào môi trường test.

```bash
npm install axe-core @testing-library/dom
# Hoặc nếu bạn dùng Yarn
yarn add axe-core @testing-library/dom
```

> **Ghi chú của Duy Trung:** Tôi sử dụng `@testing-library/dom` vì nó giúp chúng ta có một môi trường DOM thuần túy để chạy các bài kiểm tra $\text{a}1y$ mà không bị ảnh hưởng bởi state phức tạp của React, đảm bảo tính cô lập và chính xác.

### Bước 2: Viết Script Kiểm thử Playwright (TypeScript)

Chúng ta sẽ viết test case trong file `*.spec.tsx` của Playwright. Nguyên tắc chung là sau khi trang đã tải xong và tương tác xong với các thành phần, chúng ta sẽ "bắt" toàn bộ DOM hiện tại và đưa nó qua hàm kiểm tra của `axe-core`.

Đây là cấu trúc code mẫu:

```typescript
// src/tests/accessibility.spec.tsx
import { test, expect } from '@playwright/test';
import * as axe from 'axe-core'; // Import thư viện axe

/**
 * Test case này sẽ kiểm tra toàn bộ tính khả dụng của trang sau khi các thành phần 
 * phức tạp đã được render và tương tác.
 */
test('Should pass automated accessibility checks on the whole page', async ({ page }) => {
    // Giả sử bạn đang test một chức năng cụ thể, chúng ta cần điều hướng đến nó trước
    await page.goto('http://localhost:3000/profile'); 

    // Thao tác người dùng để kích hoạt các thành phần phức tạp (ví dụ: mở modal, click button)
    await page.getByRole('button', { name: 'Xem chi tiết' }).click();
    await page.waitForTimeout(100); // Chờ một chút cho JS render xong

    // --- BẮT ĐẦU QUY TRÌNH CHECKING A11Y ---

    // 1. Lấy nội dung HTML hiện tại của trang (hoặc phần tử cụ thể)
    const htmlContent = await page.content();

    // 2. Chạy axe-core trên DOM mô phỏng từ nội dung HTML
    // Chúng ta sử dụng `axe(domElement)` để kiểm tra toàn bộ body.
    const results = await axe(htmlContent, { runOnly: ['wcag2.at-block', 'aria-label'] });

    console.log('--- A11y Test Results ---');
    console.dir(results); // In chi tiết các lỗi được phát hiện

    // 3. Kiểm tra xem có bất kỳ lỗi nghiêm trọng nào không (Error Handling)
    const violations = results.violations;
    
    if (violations && violations.length > 0) {
        console.error(`🚨 LỖI A11Y ĐƯỢC PHÁT HIỆN: Tổng cộng ${violations.length} lỗi.`);
        // Quan trọng nhất: Nếu phát hiện lỗi, ta muốn test case FAIL ngay lập tức
        expect(violations).toHaveLength(0); 
    } else {
        console.log('✅ Kiểm tra A11y thành công! Không tìm thấy vi phạm WCAG nào.');
    }

});
```

### 🚀 Giải thích chi tiết của Duy Trung:

1.  **`await page.content()`**: Đây là bước then chốt. Playwright cho phép chúng ta truy cập được toàn bộ HTML hiện tại sau các thao tác người dùng (`page.content()`). Chúng ta cần nội dung này để truyền vào `axe-core`.
2.  **`const results = await axe(htmlContent, { runOnly: ['wcag2.at-block', 'aria-label'] });`**:
    *   Chúng ta gọi hàm `axe()` từ thư viện đã cài đặt.
    *   Tham số đầu tiên (`htmlContent`) là DOM mà chúng ta muốn kiểm tra.
    *   Tham số thứ hai (`runOnly: [...]`) cực kỳ quan trọng. Thay vì chạy toàn bộ 100+ rule, trong giai đoạn CI/CD hoặc phát triển sớm, bạn nên **chỉ tập trung vào những rules critical nhất** (ví dụ: `aria-label`, `color-contrast`, `alt` cho hình ảnh). Điều này giúp việc debug nhanh hơn và giảm nhiễu.
3.  **`expect(violations).toHaveLength(0);`**: Đây là cú pháp của Playwright/Jest để tạo ra một **điểm dừng cứng (Hard Fail)**. Nếu biến `violations` chứa bất kỳ lỗi nào, hàm `expect` này sẽ thất bại, khiến cho toàn bộ test suite bị đánh dấu **FAIL**. Đây chính là cơ chế chúng ta muốn: không thể deploy nếu $\text{a}1y$ có lỗi nghiêm trọng.

---

## 🧪 III. Những Best Practices của QE Lead (Tối ưu và Mở rộng)

Việc tích hợp này chỉ là bước khởi đầu. Để biến nó thành một quy trình chất lượng thực thụ, chúng ta cần lưu ý những điểm sau:

### 1. Xử lý Nội dung Động (Dynamic Content)
Các ứng dụng React hiện đại thường sử dụng các trạng thái phức tạp và gọi API để render nội dung. Không chỉ chạy `axe` một lần là chưa đủ. Bạn phải **mô phỏng luồng người dùng đầy đủ** trong test case:

*   Tải trang $\rightarrow$ Nhấp nút $A$ $\rightarrow$ Chờ Modal hiện ra ($\text{await}$) $\rightarrow$ Kiểm tra $\text{a}1y$ trên nội dung của Modal $\rightarrow$ Đóng Modal $\rightarrow$ Kiểm tra $\text{a}1y$ trên trạng thái đã cập nhật.
*   ***Nguyên tắc vàng:*** Không bao giờ kiểm thử `axe` bằng cách chỉ lấy `document.body` ngay sau khi tải trang; hãy kiểm tra nó *sau khi* các thành phần tương tác (như form, modal) được hiển thị hoàn chỉnh và kích hoạt sự kiện.

### 2. Tích hợp vào CI/CD Pipeline
Giá trị lớn nhất của việc tự động hóa này là việc ngăn chặn lỗi $\text{a}1y$ về môi trường Staging/Production. Hãy cấu hình Playwright chạy test này trong Jenkins, GitHub Actions hay GitLab CI. Nếu bất kỳ lần build nào khiến số lượng `violations` lớn hơn 0, quá trình deploy phải bị dừng lại ngay lập tức (Fail Fast).

### 3. Phân tầng Kiểm thử (Test Layering)
Tôi khuyến nghị không nên kiểm tra toàn bộ trang ở mọi cấp độ test. Hãy phân loại:

*   **Unit Test/Component Test:** Dùng thư viện như React Testing Library và tích hợp các công cụ $\text{a}1y$ để kiểm tra từng component cô lập (Isolation).
*   **E2E Test (Playwright):** Chỉ dành cho việc kiểm tra luồng người dùng lớn, phức tạp, nơi bạn cần xác minh tính tương tác giữa nhiều thành phần.

---

## 🎯 Kết luận

Kiểm thử Accessibility không phải là một "tính năng" mà nó là một **yêu cầu về chất lượng cơ bản (Fundamental Quality Requirement)** của mọi sản phẩm số. Bằng cách kết hợp sức mạnh mô phỏng trình duyệt của Playwright và engine kiểm tra nghiêm ngặt của axe-core, chúng ta có thể tự động hóa việc tuân thủ WCAG ngay trong pipeline CI/CD.

Hãy biến $\text{a}1y$ từ một gánh nặng khi thử nghiệm cuối cùng thành một **bộ lọc chất lượng** được thực hiện liên tục, đảm bảo sản phẩm của bạn không chỉ đẹp và nhanh mà còn vươn tới tất cả mọi người!

Chúc các đồng nghiệp của chúng ta luôn viết nên những codebase vừa mạnh mẽ về chức năng, vừa nhân văn về khả năng tiếp cận.

Trân trọng,
**Duy Trung.**