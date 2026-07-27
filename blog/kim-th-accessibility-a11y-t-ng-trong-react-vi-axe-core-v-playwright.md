---
title: "Kiểm thử Accessibility (a11y) tự động trong React với axe-core và Playwright"
date: 2026-06-28
description: "Hướng dẫn chuyên sâu về việc tích hợp kiểm thử khả năng truy cập a11y vào quy trình CI/CD sử dụng Playwright và axe-core."
tags: ["Accessibility","React","Playwright"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# 💡 Kiểm thử Accessibility (a11y) tự động trong React với axe-core và Playwright

Chào các đồng nghiệp QA và Developer. Tôi là Duy Trung, một chuyên gia QE Lead.

Trong kỷ nguyên phát triển phần mềm nhanh chóng của React, chúng ta thường tập trung rất nhiều vào hiệu suất, logic nghiệp vụ và trải nghiệm người dùng (UX). Tuy nhiên, có một khía cạnh cực kỳ quan trọng – **Tính khả dụng (Accessibility - a11y)** – lại thường bị coi là "tùy chọn" hoặc chỉ được xử lý thủ công. Đây là một sai lầm lớn về mặt kỹ thuật và đạo đức nghề nghiệp.

Một ứng dụng web không thể tiếp cận được bởi người dùng sử dụng trình đọc màn hình (Screen Readers) hay các thiết bị điều khiển bằng bàn phím không chỉ là một lỗi chức năng, mà còn là rào cản vật lý đối với hàng triệu người dùng có nhu cầu đặc biệt.

Bài viết này sẽ đưa ra một giải pháp mang tính kỹ thuật cao và rất thực tế: **Tự động hóa kiểm thử Accessibility trong React** bằng cách kết hợp sức mạnh của Playwright (một framework End-to-End testing hiện đại) và `axe-core` (tiêu chuẩn vàng trong kiểm thử a11y).

***

## 🔍 I. Tại sao phải tự động hóa a11y? (The "Why")

Kiểm thử Accessibility về bản chất là một quá trình phức tạp, đòi hỏi việc mô phỏng nhiều loại thiết bị và hành vi người dùng khác nhau (ví dụ: lướt bằng Tab, sử dụng các lệnh Voice Command).

Nếu chúng ta chỉ dựa vào kiểm thử thủ công hoặc các plugin đơn giản của browser, những vấn đề sau vẫn sẽ tồn tại:

1. **Tính toàn diện kém:** Con người dễ bỏ sót một lỗi nhỏ về thứ tự Focus Order (thứ tự điều hướng khi dùng Tab) nếu không thực hiện tuần tự.
2. **Tốc độ chậm:** Với các bản build phức tạp và nhiều tính năng, việc kiểm tra a11y thủ công sẽ làm giảm tốc độ của chu kỳ CI/CD.
3. **Tính nhất quán thấp:** Các quy tắc a11y cần được áp dụng đồng bộ trên mọi component.

**Giải pháp là:** Tích hợp các bài kiểm thử tự động (Automated Tests) vào pipeline, nơi chúng có thể chạy hàng trăm lần với độ bao phủ 100% đối với một bộ tiêu chuẩn đã định nghĩa (`axe-core` ruleset).

## ✨ II. Cơ chế hoạt động: Playwright + axe-core (The "How")

Để thực hiện việc này, chúng ta cần hiểu vai trò của từng công cụ trong bộ ba: React, Playwright và `axe-core`.

### ⚛️ 1. React
Là lớp UI của chúng ta. Chúng ta viết các component dưới dạng JSX. Vấn đề a11y phát sinh ở đây (ví dụ: thiếu `alt` tag trên ảnh, không có `aria-label` cho nút bấm).

### 🛠️ 2. Playwright
Đây là thư viện E2E Testing của chúng ta. Nó chịu trách nhiệm:
*   Khởi tạo một môi trường trình duyệt ảo (Browser Context).
*   Truy cập và thao tác với DOM (Document Object Model) sau khi React đã render xong component.

### 🔬 3. axe-core
Đây là trái tim của bài kiểm thử này. `axe-core` là một thư viện được phát triển bởi Deque Systems, nó chứa hàng trăm quy tắc tuân thủ các tiêu chuẩn WCAG (Web Content Accessibility Guidelines). Nó không chỉ "đoán" lỗi mà thực sự *phân tích* DOM dựa trên các nguyên tắc đã được kiểm chứng.

**Tóm lại quy trình:** Playwright render component React $\rightarrow$ Playwright lấy DOM Tree $\rightarrow$ Truyền DOM này vào `axe-core` $\rightarrow$ `axe-core` trả về danh sách các lỗi (Violations).

## 🚀 III. Hướng dẫn thực hành: Tích hợp kiểm thử a11y

Giả sử chúng ta đang viết một bài test cho Component Form Login của mình bằng Playwright và Jest/Vitest.

### Bước 1: Cài đặt Dependencies

Chúng ta cần cả `playwright` để chạy trình duyệt, và các gói hỗ trợ việc kiểm tra khả năng truy cập.

```bash
# Cài đặt thư việnหลัก (nếu chưa có)
npm install playwright @playwright/test --save-dev

# Cài đặt axe-core và bộ xử lý (wrapper)
# Playwright thường sẽ cần một lớp wrapper để gọi axe API
npm install axe-core jest-axe --save-dev 
```

### Bước 2: Viết Bài Test (Ví dụ Minh họa)

Chúng ta sẽ viết một test mô phỏng việc người dùng tương tác với Form Login, sau đó kiểm tra toàn bộ trang bằng `axe-core`.

*(Lưu ý: Trong môi trường Playwright/Jest-Axe, chúng ta cần một hàm hỗ trợ để chạy axe và assert các lỗi.)*

```javascript
// src/tests/Login.test.js

import { test, expect } from '@playwright/test';
import { checkA11y } from '../utils/axeChecker'; // Giả định bạn tạo utility này

/**
 * Hàm mô phỏng một component React đã được render và hiển thị trên trang.
 */
const setupLoginPage = async (page) => {
  await page.goto('/login');
};


test('Login Page phải đạt tiêu chuẩn Accessibility WCAG AA', async ({ page }) => {
    // 1. Setup - Tải component lên trang
    await setupLoginPage(page);

    // Thao tác người dùng: Mô phỏng việc nhập thông tin và click nút
    await page.fill('#username', 'testuser');
    await page.fill('#password', 'password');
    await page.click('#submit-button'); 
    
    // Chờ DOM cập nhật sau khi hành động (ví dụ: chuyển hướng hoặc hiển thị message)
    await page.waitForSelector('.success-message');

    // ==================================================
    // TRỌNG TÂM: VIỆC KIỂM TRA A11Y BẰNG axe-core 
    // ==================================================
    console.log("--- Starting Accessibility Check ---");
    
    try {
        // Gọi hàm checkA11y, nó sẽ lấy nội dung DOM của page hiện tại 
        // và chạy tất cả các quy tắc a11y đã định nghĩa trong axe-core
        await checkA11y(page); 

        // Nếu đến đây mà không ném exception nào, tức là KHÔNG tìm thấy lỗi nghiêm trọng.
        expect(true).toBe(true); 

    } catch (error) {
        // Bắt và báo cáo các vi phạm a11y cụ thể
        if (error.violations && error.violations.length > 0) {
            console.error("🚨 LỖI ACCESSIBILITY ĐƯỢC PHÁT HIỆN!");
            error.violations.forEach(v => {
                console.log(`[❌] ID: ${v.id} | Mô tả: ${v.description}`);
                console.log(`    - Các phần tử bị ảnh hưởng (Nodes): ${JSON.stringify(v.nodes).substring(0, 100)}...`);
            });
            // Buộc test thất bại nếu có vi phạm a11y
            expect(error.violations.length).toBe(0); 
        } else {
             throw error; // Ném lỗi khác nếu đó không phải là lỗi a11y
        }
    }

    console.log("✅ Accessibility Check Pass!");
});
```

### Giải thích các đoạn mã của Duy Trung:

**1. `await checkA11y(page)`:**
*   Đây là lệnh gọi hàm giả định (utility function) đã được bọc sẵn API của Playwright để thực hiện việc kiểm tra. Về bản chất, nó lấy nội dung HTML *hiện tại* từ trang (DOM snapshot) và đưa vào `axe-core`.
*   **Ý nghĩa:** Chúng ta không chỉ kiểm tra mã nguồn tĩnh; chúng ta kiểm tra giao diện người dùng **sau khi tất cả JavaScript đã chạy**. Điều này là cực kỳ quan trọng vì nhiều lỗi a11y (như việc thêm vai trò ARIA) chỉ được kích hoạt bởi logic client-side.

**2. `expect(error.violations.length).toBe(0)`:**
*   Đây là **nguyên tắc vàng** của kiểm thử tự động: Nếu chúng ta không mong đợi điều gì, thì sự vắng mặt của nó sẽ là một thất bại (Failure).
*   Thay vì chỉ log cảnh báo về các lỗi a11y, chúng ta phải *buộc test bị thất bại* nếu phát hiện bất kỳ vi phạm nào. Điều này đảm bảo rằng pipeline CI/CD của bạn sẽ dừng lại và không cho phép code chứa lỗi a11y được merge vào nhánh `main`.

## 💡 IV. Các Best Practices Nâng cao từ QE Lead

Để nâng tầm quy trình kiểm thử của bạn, hãy lưu ý các điểm sau:

### 1. Kiểm tra theo Component (Unit/Integration Testing)
Nếu bạn đang sử dụng Storybook với React, đừng chỉ dừng lại ở việc render component và kiểm tra nội dung tĩnh. Hãy tích hợp `axe-core` vào storybook testing layer để đảm bảo rằng *mọi trạng thái* của một component (trạng thái disabled, active, error...) đều được kiểm tra a11y.

### 2. Xử lý Focus Order (Tab Index)
Một trong những lỗi khó nhất là thứ tự điều hướng bằng Tab. Thay vì chỉ chạy `checkA11y` toàn trang, hãy viết các test Playwright riêng để:
*   Lắng nghe sự kiện `keydown` (Key Down Event).
*   Kiểm tra xem khi nhấn `Tab`, Focus có nhảy đúng thứ tự theo logic người dùng mong muốn không.

### 3. Tích hợp CI/CD Build Failure
Khi cấu hình Jenkins, GitHub Actions, hoặc GitLab CI: **Hãy đặt bài kiểm thử a11y ở giai đoạn cuối cùng và quan trọng nhất.**

Nếu bài test này thất bại (do có vi phạm `axe-core`), pipeline phải báo lỗi FAIL ngay lập tức. Đừng bao giờ để các vi phạm a11y lọt qua lớp QA mà không được phát hiện tự động.

## 📝 Kết luận

Kiểm thử Accessibility không còn là một tính năng "nice to have" (có thì tốt) nữa, nó đã trở thành **một yêu cầu chức năng cốt lõi** (Core Functional Requirement).

Bằng cách làm chủ sự kết hợp giữa khả năng mô phỏng trình duyệt của Playwright và sức mạnh phân tích tiêu chuẩn WCAG của `axe-core`, chúng ta không chỉ nâng cao chất lượng kỹ thuật mà còn xây dựng các sản phẩm công bằng, dễ tiếp cận cho toàn bộ cộng đồng người dùng.

Hãy biến việc kiểm tra a11y tự động thành một thói quen hàng ngày trong mỗi vòng đời phát triển! Chúc các bạn thành công với dự án của mình.