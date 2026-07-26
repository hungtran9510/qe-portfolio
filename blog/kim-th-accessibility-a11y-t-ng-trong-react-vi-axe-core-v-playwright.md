---
title: "Kiểm thử Accessibility (a11y) tự động trong React với axe-core và Playwright"
date: 2026-06-27
description: "Hướng dẫn chuyên sâu cách tích hợp kiểm thử a11y tự động vào React bằng sự kết hợp mạnh mẽ giữa axe-core và Playwright."
tags: ["Accessibility","React","Playwright"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# Kiểm thử Accessibility (a11y) tự động trong React với axe-core và Playwright

**(Bởi Duy Trung - QE Lead)**

Chào các đồng nghiệp trong lĩnh vực Chất lượng Phần mềm,

Là một Quality Engineer (QE), chúng ta đều biết rằng chất lượng sản phẩm không chỉ đo bằng tính năng hoạt động trơn tru (Functional Correctness) mà còn phải bao gồm trải nghiệm của TẤT CẢ người dùng. Trong bối cảnh phát triển Single Page Application (SPA) hiện đại với React, việc đảm bảo **Khả năng Tiếp cận (Accessibility - a11y)** là yêu cầu tối thượng, không chỉ dừng lại ở vấn đề tuân thủ pháp lý mà còn là trách nhiệm đạo đức của sản phẩm công nghệ.

Trước đây, kiểm thử a11y thường được coi là một quá trình thủ công, tốn thời gian và dễ bỏ sót khi quy mô ứng dụng tăng lên. Nhưng may mắn thay, với sự phát triển của các công cụ automation mạnh mẽ, chúng ta có thể tự động hóa khâu này ở cấp độ cao nhất—ngay cả việc kiểm tra luồng người dùng phức tạp (user flows) trong môi trường React thực tế.

Bài viết này sẽ là một chuyên đề sâu về cách kết hợp hai "chiến binh" công nghệ hàng đầu: **`axe-core`** – bộ máy phân tích tiêu chuẩn vàng, và **Playwright** – trình duyệt tự động hóa hiện đại nhất—để xây dựng hệ thống kiểm thử a11y hoàn toàn tự động trong các dự án React của bạn.

***

## 💡 I. Vì sao chúng ta cần tự động hóa A11y?

### 1. Giới hạn của Kiểm thử Thủ công
Kiểm tra một trang web cho người dùng khiếm thị, người dùng sử dụng phím ảo (keyboard navigation), hay người dùng có màu sắc mù đòi hỏi sự chú tâm và thời gian cực lớn. Khi bạn phải kiểm thử hàng trăm thành phần và luồng người dùng khác nhau trên React, việc đánh giá thủ công trở nên bất khả thi (unscalable).

### 2. Vai trò của a11y trong QE
Một sản phẩm được coi là chất lượng cao không thể loại trừ bất kỳ nhóm người dùng nào. Bằng cách tích hợp kiểm thử a11y vào pipeline CI/CD, chúng ta đảm bảo rằng mọi lần build mới đều phải qua bài kiểm tra tiếp cận cơ bản, giảm thiểu rủi ro phát hành các lỗi vi phạm WCAG (Web Content Accessibility Guidelines).

## 🔍 II. Hiểu rõ Vai trò của từng Công cụ

Trước khi đi sâu vào code, hãy hiểu vai trò riêng biệt nhưng bổ trợ của hai công nghệ này:

### 1. axe-core: "Bộ máy kiểm tra tuân thủ"
*   **Bản chất:** `axe-core` là một thư viện JavaScript được xây dựng dựa trên tiêu chuẩn WCAG. Nó không phải là trình tự động hóa, mà là **trình luận án (auditing engine)**.
*   **Nhiệm vụ:** Nhận vào một đoạn DOM Tree và trả về danh sách các vi phạm (violations), cảnh báo (alerts) và khuyến nghị (passes).
*   **Điểm mạnh:** Được chấp nhận rộng rãi trong ngành, chi tiết đến từng thuộc tính HTML/ARIA.

### 2. Playwright: "Trình điều khiển & Người tương tác"
*   **Bản chất:** Một thư viện tự động hóa End-to-End (E2E) hiện đại từ Microsoft. Nó kiểm soát trình duyệt Chromium, Firefox và WebKit một cách ổn định và nhanh chóng.
*   **Nhiệm vụ:** Mô phỏng hành vi người dùng thực tế: click nút, nhập liệu form, cuộn trang, chờ đợi React component render.
*   **Điểm mạnh:** Khả năng xử lý sự đồng bộ (synchronization) vượt trội khi làm việc với SPA như React, giúp chúng ta chắc chắn rằng mọi thứ đã *render* xong trước khi kiểm tra a11y.

### 🤝 Sự kết hợp hoàn hảo
Playwright chịu trách nhiệm **Render** và **Interact**. Sau khi Playwright đảm bảo toàn bộ luồng người dùng đã được thực hiện (ví dụ: User click vào nút 'Đăng ký'), nó sẽ chụp lại trạng thái DOM *cuối cùng* và chuyển giao cho `axe-core` để tiến hành phân tích.

## 🚀 III. Hướng dẫn Thực tế: Tích hợp trong React Project

Chúng ta sẽ xây dựng một quy trình kiểm thử E2E đơn giản, nơi chúng ta truy cập vào một thành phần phức tạp của React (ví dụ: một modal form) và sau đó chạy audit a11y trên nó.

### 🛠️ Setup Environment

Bạn cần cài đặt các dependencies cơ bản sau trong dự án Playwright/React của mình:

```bash
# Cài đặt axe-core cho môi trường test
npm install axe-core @axe-core/react --save-dev

# Đảm bảo bạn đã có playwright và các browser drivers
npm install -D @playwright/test
```

### 📄 Ví dụ Code (Playwright Test File)

Trong file kiểm thử (`*.spec.tsx`), chúng ta sẽ thực hiện quy trình ba bước: **Truy cập $\rightarrow$ Tương tác $\rightarrow$ Audit**.

```typescript
// src/e2e.accessibility.spec.ts

import { test, expect, Page } from '@playwright/test';
import * as axe from 'axe-core'; // Import hàm axe từ axe-core

test('Should perform full end-to-end accessibility audit on the checkout flow', async ({ page }: { page: Page }) => {
    // 1. SETUP & NAVIGATION (Playwright's domain)
    await page.goto('/checkout');
    console.log("--- Bắt đầu kiểm thử a11y cho trang Thanh toán ---");

    // Chờ đợi component React Modal xuất hiện (giả sử nó xuất hiện sau khi click button)
    const checkoutButton = page.locator('#continue-to-checkout');
    await checkoutButton.click();
    await page.waitForSelector('.billing-modal', { state: 'visible' });

    // 2. INTERACTION & STABILIZATION (Playwright simulates user action)
    // Giả sử chúng ta phải tương tác với form trước khi audit
    const addressInput = page.locator('#shipping-address');
    await addressInput.fill('123 QE Street');
    await addressInput.press('Enter');

    // Đợi React cập nhật state và render các thuộc tính ARIA/label mới
    await page.waitForTimeout(500); // Tạm dừng để đảm bảo DOM ổn định

    // 3. THE ACCESSIBILITY AUDIT (axe-core's domain)
    const modalElement = await page.locator('.billing-modal');
    
    // Sử dụng Playwright API để lấy nội dung và chạy axe-core
    await test.step('Running a11y audit on the modal', async () => {
        // Hàm inject và run axe-core: 
        // Chúng ta cần đảm bảo rằng mã axe-core được thực thi trong context của trang
        const results = await page.evaluate(async (selector) => {
            // Truy cập DOM element cụ thể
            const targetElement = document.querySelector(selector);
            if (!targetElement) throw new Error(`Could not find selector: ${selector}`);

            // Chạy axe-core trên phần tử đó
            await axe.run(targetElement, {
                rules: {
                    'aria-label': { enabled: true } // Có thể tùy chỉnh rules ở đây
                }
            });
            return axe.getResults(); // Trả về JSON kết quả audit
        }, '.billing-modal');

        // 4. ASSERTION & REPORTING (Test Framework Assertions)
        const violations = results.violations;

        expect(violations).toHaveLength(0);
        console.log("✅ SUCCESS: No a11y violations found on the checkout flow.");

    }, { tag: '@a11y' }); // Gắn thẻ để chạy riêng biệt
});
```

***

## 🔬 IV. Phân tích Chuyên sâu (QE Deep Dive)

### 🧐 Giải thích về `page.evaluate()` và $Selector$

Phần quan trọng nhất trong ví dụ trên là việc sử dụng `await page.evaluate(async (...), selector)`:

1.  **Tại sao cần `evaluate`?** Playwright chạy test code của bạn ở môi trường Node.js (bên ngoài trình duyệt). Trong khi đó, `axe-core` và DOM Tree tồn tại *bên trong* trình duyệt. Hàm `page.evaluate()` cho phép chúng ta thực thi một đoạn mã JavaScript tùy chỉnh ngay lập tức trong context của trang web đang được test.
2.  **Logic bên trong:** Khi chúng ta truyền vào selector (`'.billing-modal'`), code JS này sẽ tìm đến phần tử đó, sau đó gọi `axe.run(targetElement, options)`. Điều này đảm bảo rằng axe-core không chỉ kiểm tra toàn bộ body mà nó được giới hạn (scoping) chỉ trên Modal Form cần thiết, giúp test nhanh hơn và chính xác hơn.
3.  **Kết quả:** Kết quả trả về từ `page.evaluate` là một đối tượng JSON chứa đầy đủ các vi phạm (`violations`), cảnh báo (`incomplete`) và các phần tử vượt qua kiểm tra (`passes`).

### 🧪 Best Practices của Duy Trung (QE Lead Tips)

1.  **Audit ở nhiều giai đoạn:** Đừng chỉ chạy audit ở cuối luồng E2E. Hãy tạo một helper function để chạy `axe-core` sau khi **component mount** và sau khi **state thay đổi lớn**. Điều này giúp bạn tìm ra các vi phạm *tạm thời* (transient violations) mà người dùng gặp phải trong quá trình sử dụng.
2.  **Focus on Key Flows:** Thay vì kiểm tra từng thành phần đơn lẻ, hãy tập trung kiểm thử a11y trên các **luồng người dùng quan trọng nhất** (Critical User Journeys): Đăng ký tài khoản $\rightarrow$ Thanh toán giỏ hàng $\rightarrow$ Xem profile.
3.  **Bắt buộc Check Key Events:** Luôn bao gồm bước chờ đợi và tương tác bằng bàn phím (`page.keyboard.press('Tab')`, `await page.click('button[tabindex="0"]')`) trong test case của bạn. Một thành phần được coi là "không thể tiếp cận" nếu nó không thể focus (focus-trappable) bằng Tab key.
4.  **Tích hợp CI/CD:** Thiết lập job kiểm thử này chạy trên Jenkins, GitHub Actions hoặc GitLab. Nếu bất kỳ `expect(violations).toHaveLength(0)` nào thất bại, toàn bộ build phải bị *Fail*. Đây là cách đảm bảo an toàn nhất cho sản phẩm của bạn.

## 🏁 Kết Luận

Kiểm thử Accessibility không còn là một tính năng bổ sung mà đã trở thành một yêu cầu kỹ thuật cốt lõi trong phát triển hiện đại. Bằng việc khai thác sức mạnh kết hợp giữa **Playwright** (tương tác và đồng bộ hóa) và **axe-core** (bộ máy phân tích tiêu chuẩn), chúng ta có thể tự động hóa quá trình kiểm thử a11y ở quy mô lớn, mức độ phức tạp cao nhất.

Hãy biến accessibility thành một phần mặc định (by default) trong tư duy của mọi Lập Trình Viên và QE trong đội ngũ bạn. Chúc các bạn luôn xây dựng những sản phẩm công nghệ vừa đẹp mắt, vừa tiện dụng cho tất cả mọi người!

*Duy Trung - Quality Engineer Lead*