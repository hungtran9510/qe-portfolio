---
title: "Kiểm thử Accessibility (a11y) tự động trong React với axe-core và Playwright"
date: 2026-06-24
description: "Học cách tích hợp kiểm thử khả năng truy cập (a11y) tiên tiến vào quy trình CI/CD của bạn bằng cách kết hợp sức mạnh của axe-core và Playwright trong React."
tags: ["Accessibility","React","Playwright"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# Kiểm thử Accessibility (a11y) tự động trong React với axe-core và Playwright

Chào các đồng nghiệp QA và Devs! Tôi là Duy Trung.

Trong vai trò một QE Lead, tôi nhận thấy rằng chất lượng sản phẩm không chỉ dừng lại ở việc code chạy đúng chức năng (functional correctness). Ngày nay, "chất lượng" phải bao gồm cả tính **trải nghiệm cho tất cả mọi người** – tức là Accessibility (Khả năng truy cập hay a11y).

Một trang web nếu không tương thích với các công cụ hỗ trợ như Screen Readers, hoặc cấu trúc DOM phức tạp khiến bàn phím cũng khó điều hướng, thì nó đang tạo ra rào cản số đối với người dùng khuyết tật. Đây không chỉ là vấn đề đạo đức, mà còn là yêu cầu pháp lý tại nhiều thị trường lớn.

Nếu bạn đang xây dựng Single Page Applications (SPA) bằng React và muốn đưa khả năng kiểm thử a11y vào quy trình CI/CD một cách đáng tin cậy, bài viết này chính là kim chỉ nam cho bạn. Chúng ta sẽ đi sâu vào việc kết hợp `axe-core` với Playwright để có được giải pháp tự động hóa mạnh mẽ nhất hiện nay.

---

## I. Tổng Quan Về Vấn Đề Và Giải Pháp (The Tech Stack)

Trước khi đi vào code, chúng ta cần hiểu vai trò của từng công cụ:

### 1. Accessibility (a11y) là gì?
Nói đơn giản, a11y đảm bảo rằng mọi thành phần giao diện đều có thể được tương tác bằng nhiều phương thức khác nhau: chuột, bàn phím, hoặc các thiết bị hỗ trợ (như Screen Reader). Các vấn đề phổ biến bao gồm thiếu `alt text` cho hình ảnh, không sử dụng đúng semantic HTML, và mất focus khi chuyển tab.

### 2. Tại sao cần **axe-core**?
Thay vì chỉ dựa vào việc kiểm tra cú pháp DOM đơn giản, chúng ta cần một công cụ có khả năng mô phỏng các thuật toán kiểm tra phức tạp mà Screen Readers hay các bộ tiêu chuẩn WCAG (Web Content Accessibility Guidelines) sử dụng.

`axe-core` chính là thư viện lý tưởng cho nhiệm vụ này. Nó cung cấp hàng trăm rules check độ phủ cao, giúp bạn phát hiện các lỗi a11y ở mức Depth (chiều sâu) rất lớn.

### 3. Tại sao cần **Playwright**?
React Component (ví dụ: `<MyComponent />`) khi được gọi trực tiếp trong môi trường unit testing (như Testing Library với Jest) chỉ kiểm tra logic của component đó. Tuy nhiên, a11y lại quan tâm đến *cách component đó hoạt động trên một trình duyệt thực tế*.

Playwright giải quyết vấn đề này bằng cách:
*   **Cung cấp Browser Environment:** Nó cho phép chúng ta mount (gắn kết) các thành phần React vào một page DOM được quản lý bởi Playwright, mô phỏng chính xác hành vi của người dùng thực tế.
*   **State Management & Interaction:** Chúng ta có thể mô phỏng việc click, hover, và thay đổi state để kiểm tra xem liệu mọi tương tác đó có giữ được tính truy cập hay không.

---

## II. Hướng Dẫn Triển Khai Chi Tiết (Hands-On Implementation)

Bây giờ, chúng ta sẽ bắt tay vào tích hợp ba yếu tố này. Giả định bạn đã có một dự án React/Vite và đang sử dụng Playwright cho các bài test E2E.

### Bước 1: Cài Đặt Thư Viện

Chúng ta cần cài đặt `axe-core` để thực thi bộ rules check, và đảm bảo phiên bản Playwright của chúng ta đã sẵn sàng.

```bash
npm install axe-core
# Nếu bạn chưa có package test nào chuyên dùng cho a11y, 
# bạn không cần thêm gì nữa vì nó sẽ được gọi qua 'page.evaluate'
```

### Bước 2: Chuẩn Bị Component (Ví dụ Giả Định)

Giả sử chúng ta có một component nút bấm cơ bản bị thiếu thuộc tính `aria-label` khi dùng trong ngữ cảnh phức tạp hơn, hoặc có cấu trúc DOM không tối ưu.

**`src/components/ElevatedButton.jsx`**:
```jsx
// Đây là button đơn giản của chúng ta
const ElevatedButton = ({ children }) => {
  return <button className="btn-primary">{children}</button>;
};
export default ElevatedButton;
```

### Bước 3: Viết Test Case với Playwright và axe-core

Đây là phần quan trọng nhất. Thay vì chỉ kiểm tra xem nút có bấm được không, chúng ta phải yêu cầu Playwright chạy `axe` trên toàn bộ DOM sau khi component đã render xong.

**`src/tests/a11y.spec.js`**:
```javascript
import { test, expect } from '@playwright/test';
import React from 'react';
import ReactDOMClient from 'react-dom/client';
import ElevatedButton from '../components/ElevatedButton';

// Hàm tiện ích để render component vào một container ảo (nếu bạn không dùng Storybook)
const mountComponent = (component, targetElement) => {
    // Logic mô phỏng việc React Component được gắn vào DOM của Playwright Page
    ReactDOMClient.createRoot(targetElement).render(component);
};


test('Kiểm tra Accessibility toàn bộ trang với axe-core', async ({ page }) => {
    await test.step('1. Render component mẫu vào DOM', async () => {
        // 1. Tạo một container nơi React sẽ render nội dung
        const container = await page.locator('#a11y-container');
        // Xóa nội dung cũ để đảm bảo test sạch
        await container.evaluate(el => el.innerHTML = '');

        // 2. Render Component vào container đó (Giả định việc mount này đã được chuẩn hóa)
        // Trong môi trường E2E thực tế, bạn sẽ điều hướng đến URL có chứa component này.
        const root = document.createElement('div'); // Sử dụng document API của Playwright
        root.id = 'a11y-container';
        document.body.append(root);

        // Mount Component: Chúng ta giả định rằng chúng ta có thể render bằng React Dev Tools hoặc Storybook iframe
        // Để đơn giản hóa ví dụ, chúng ta sẽ nhắm thẳng vào DOM element mà Playwright thấy
        await container.evaluate(() => {
             const button = document.createElement('button');
             button.textContent = "Submit Form";
             document.body.appendChild(button);
        });

        // **Quan trọng:** Đảm bảo DOM đã được update và sẵn sàng để kiểm tra.
        await page.waitForTimeout(100); 
    });


    await test.step('2. Chạy quét Accessibility bằng axe-core', async () => {
        const results = await page.evaluate(async () => {
            // Import axe-core vào context của browser để sử dụng nó
            // (Playwright cho phép chạy code JS trực tiếp trong môi trường browser)
            return window.axe.run(document); 
        });

        // Kiểm tra kết quả trả về từ axe.
        if (results.violations.length > 0) {
            console.error("❌ Lỗi Accessibility được tìm thấy:");
            results.violations.forEach(violation => {
                console.log(` - Rule: ${violation.id}, Description: ${violation.description}`);
                console.log(`   Element Selector (Ví dụ): ${violation.nodes[0].target}`);
            });
            // Thất bại test nếu phát hiện violation
            expect(results.violations).toHaveLength(0); 
        } else {
            console.log("✅ Thành công! Không tìm thấy lỗi Accessibility nghiêm trọng.");
        }
    });
});

```

### Giải thích Code của Duy Trung:

1.  **`page.evaluate(...)`:** Đây là cú pháp cốt lõi. Nó cho phép chúng ta chạy code JavaScript **trực tiếp trong ngữ cảnh của trình duyệt (browser context)** mà Playwright đang mô phỏng, thay vì chỉ trên môi trường Node.js.
2.  **`window.axe.run(document)`:** Khi `page.evaluate` chạy, nó có quyền truy cập vào đối tượng `window`, nơi chúng ta đã giả định rằng thư viện `axe-core` (đã được inject hoặc load) tồn tại. Chúng ta truyền toàn bộ `document` DOM hiện tại vào hàm này để quét toàn bộ cây DOM.
3.  **Kiểm tra `results.violations`:** Thay vì kiểm tra xem việc chạy code có lỗi không, chúng ta phải phân tích đối tượng trả về (`results`). Nếu mảng `violations` lớn hơn 0, điều đó nghĩa là `axe-core` đã tìm thấy ít nhất một quy tắc a11y bị vi phạm.
4.  **`expect(results.violations).toHaveLength(0)`:** Đây là bước quan trọng nhất để biến lời cảnh báo thành thất bại test tự động (Fail Fast), đảm bảo rằng pipeline CI/CD của bạn sẽ bị dừng lại ngay lập tức nếu có lỗi a11y mới nào được đưa vào.

---

## III. Các Nguyên Tắc Nâng Cao và Best Practices (Tips từ QE Lead)

Việc tích hợp basic `axe` check chỉ là bước khởi đầu. Để thực sự trở thành một đội ngũ QE chuyên nghiệp, bạn cần lưu ý những điều sau:

### 💡 1. Phân tách các loại kiểm thử A11y
Đừng gộp tất cả vào một bài test duy nhất. Hãy phân tách theo mục đích:
*   **Unit Test Level:** Kiểm tra semantic HTML/attributes (ví dụ: component này có `role` hợp lý không?). Thích hợp dùng React Testing Library + Jest.
*   **Integration Test Level (Playwright):** Kiểm tra luồng người dùng và tương tác qua các trang, đảm bảo a11y được giữ vững khi state thay đổi (Ví dụ: Sau khi form submit, focus có nhảy về nơi hợp lý không?).
*   **Visual/Smoke Test:** Chạy quét `axe` trên những đường dẫn quan trọng nhất của ứng dụng.

### 💡 2. Xử lý Ngoại lệ và Tắt tạm thời Check
Trong một số trường hợp rất hiếm, bạn muốn cố tình phá vỡ quy tắc a11y (ví dụ: trong các widget tùy chỉnh yêu cầu tương tác phức tạp), `axe-core` sẽ báo lỗi. Thay vì bỏ qua test, hãy học cách sử dụng thuộc tính `aria-hidden="true"` hoặc cung cấp cả **Code Justification** cho violation đó để hệ thống biết tại sao bạn cố tình làm vậy.

### 💡 3. Tích hợp vào CI/CD Pipeline
Đây là giá trị lớn nhất của việc tự động hóa. Hãy thêm bước chạy test này (ví dụ: `npm run playwright test -- a11y-only`) vào pipeline GitHub Actions hoặc GitLab CI. Thiết lập failure condition để mọi pull request có lỗi a11y đều bị chặn và yêu cầu fix ngay lập tức.

---

## Kết Luận

Tự động hóa kiểm thử Accessibility là một hành trình liên tục, không bao giờ kết thúc. Nó đòi hỏi sự thay đổi tư duy từ góc độ "chỉ cần hoạt động" sang "phải hoạt động cho mọi người".

Bằng cách sử dụng bộ công cụ mạnh mẽ và chuẩn mực như `axe-core` cùng môi trường mô phỏng thực tế của Playwright, chúng ta không chỉ làm tăng chất lượng code mà còn xây dựng một sản phẩm tử tế, bao gồm tất cả người dùng.

Chúc các bạn áp dụng thành công giải pháp này! Nếu có bất kỳ câu hỏi nào về việc tối ưu hóa quy trình test a11y, đừng ngần ngại trao đổi với tôi nhé!