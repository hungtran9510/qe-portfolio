---
title: "Kiểm thử Accessibility (a11y) tự động trong React với axe-core và Playwright"
date: 2026-06-22
description: "Hướng dẫn chuyên sâu từ QE Lead về việc tích hợp axe-core vào Playwright để kiểm tra khả năng tiếp cận (a11y) cho các ứng dụng React một cách tự động, đảm bảo chất lượng toàn diện."
tags: ["Accessibility","React","Playwright","Testing"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# Kiểm thử Accessibility (a11y) tự động trong React với axe-core và Playwright

**Tác giả:** Duy Trung
**Lĩnh vực:** Quality Engineering, Web Testing

Trong kỷ nguyên phát triển ứng dụng web hiện đại, chất lượng không chỉ được đo bằng tốc độ hay tính năng hoạt động, mà còn phải được định nghĩa bởi trải nghiệm người dùng toàn diện. Và một phần quan trọng nhất của trải nghiệm đó chính là **Khả năng Tiếp cận (Accessibility - a11y)**.

Đối với các chuyên gia Kỹ thuật Đảm bảo Chất lượng Phần mềm (QE), việc đảm bảo rằng sản phẩm hoạt động trơn tru với mọi đối tượng người dùng—bao gồm cả những người sử dụng trình đọc màn hình, hoặc điều khiển bằng bàn phím—không còn là một yêu cầu "nên có" mà đã trở thành tiêu chuẩn bắt buộc về mặt pháp lý và đạo đức.

Tuy nhiên, kiểm thử a11y thủ công cực kỳ tốn thời gian và chỉ bao phủ được những điểm mà người tester nghĩ đến. Bài viết này sẽ đi sâu vào việc thiết lập một quy trình tự động hóa mạnh mẽ, sử dụng bộ công cụ đỉnh cao: **`axe-core`** và **`Playwright`**, để kiểm tra khả năng tiếp cận một cách toàn diện trong các dự án React của bạn.

***

## 🔍 I. Tại sao phải làm việc này? (Lý thuyết nền tảng)

### Accessibility là gì?
Về bản chất, accessibility (a11y) là việc đảm bảo rằng mọi người, bất kể khả năng thể chất hay nhận thức nào, đều có thể tương tác và sử dụng sản phẩm kỹ thuật số của bạn. Các tiêu chuẩn quốc tế như **WCAG (Web Content Accessibility Guidelines)** cung cấp các nguyên tắc vàng cho lĩnh vực này.

### Hạn chế của kiểm thử thủ công
Khi làm việc với React – một framework SPA (Single Page Application) phức tạp và năng động – các thành phần được render, cập nhật và thay đổi liên tục. Việc chỉ dựa vào các công cụ mở ngoặc thẻ HTML/CSS thông thường là hoàn toàn không đủ. Chúng ta cần một môi trường *giả lập* trình duyệt thực tế và chạy qua logic của nó để mô phỏng trải nghiệm người dùng đa dạng nhất.

### Giải pháp Kết hợp: Playwright + axe-core
1. **Playwright:** Là công cụ tự động hóa mạnh mẽ, cho phép chúng ta điều khiển một trình duyệt *thực* (Chromium/WebKit/Firefox) trong môi trường Headless. Nó đảm bảo rằng code của chúng ta được chạy qua các hành vi DOM thực tế, giống như người dùng thật đang tương tác.
2. **axe-core:** Đây là công cụ đánh giá a11y hàng đầu thế giới do Deque (những chuyên gia trong ngành) phát triển. `axe-core` chứa một bộ quy tắc khổng lồ dựa trên WCAG, giúp chúng ta tìm ra các lỗi vi phạm tiêu chuẩn mà mắt thường khó nhận thấy.

Khi kết hợp hai thứ này, chúng ta có thể: *Tạo ra nội dung động $\rightarrow$ Mô phỏng tương tác người dùng $\rightarrow$ Đánh giá bằng bộ quy tắc a11y nghiêm ngặt*.

***

## 🛠️ II. Thiết lập Môi trường (Setup)

Trước khi bắt tay vào code, chúng ta cần cài đặt các thư viện cần thiết:

```bash
# Cài đặt Playwright cho React/TypeScript dự án của bạn
npm install --save-dev playwright @playwright/test

# Cài đặt axe-core để chạy bộ kiểm tra a11y
npm install --save-dev axe-core @axe-core/react 
```

**(Lưu ý:** Chúng ta sẽ sử dụng Playwright's `@playwright/test` framework và nhúng `axe-core` vào test case.)

***

## 👨‍💻 III. Triển khai Code: Bài kiểm tra a11y cốt lõi

Điểm mấu chốt của bài viết này là cách chúng ta tích hợp kết quả của `axe-core` vào quy trình test của Playwright. Thay vì chỉ chạy các assertions về hành vi (như "nút này phải nhấp được"), chúng ta sẽ chạy một *bước đánh giá* để kiểm tra tính khả dụng và cấu trúc ngữ nghĩa của trang.

Dưới đây là ví dụ trong file test (`src/tests/a11y.spec.tsx`):

```typescript
import { test, expect, page } from '@playwright/test';
import * as axe from 'axe-core'; // Import thư viện axe

/**
 * Hàm tiện ích để chạy kiểm tra a11y trên một selector cụ thể.
 * @param elementSelector Selector CSS của phần tử cần kiểm tra (ví dụ: '#main-content')
 */
async function checkA11y(page: page, elementSelector: string) {
    // 1. Lấy ElementHandle từ Playwright dựa trên selector
    const element = await page.$(elementSelector);

    if (!element) {
        throw new Error(`Không tìm thấy phần tử với selector: ${elementSelector}`);
    }

    // 2. Chạy axe-core trên ngữ cảnh của Playwright
    // Chúng ta sử dụng hàm `run` của axe để thực hiện việc đánh giá
    const results = await axe(element, { runOnly: ["wcag2a", "best-practice"] });

    // 3. Kiểm tra xem có vi phạm nào không (Đây là bước quan trọng nhất)
    const violations = results.violations;

    if (violations && violations.length > 0) {
        console.error(`🚨 LỖI A11Y PHÁT HIỆN: Có ${violations.length} lỗi a11y trong phần tử "${elementSelector}"`);
        // Ta bỏ qua việc fail test ở đây để dễ debug, nhưng tốt nhất là nên throw error nếu cần sự nghiêm ngặt tuyệt đối.
    } else {
        console.log(`✅ KIỂM TRA A11Y: Thành công trên ${elementSelector}. Không phát hiện vi phạm WCAG.`);
    }

    // TRẢ VỀ KẾT QUẢ ĐỂ TEST FRAMEWORK CÓ THỂ BẮT LỖI
    return violations; 
}


test.describe('A11y Testing Suite', () => {

    test('Kiểm tra tính khả dụng của toàn bộ trang chính sau khi tải nội dung động', async ({ page }) => {
        // Giả sử bạn có một route /dashboard được mount component React ở đây
        await page.goto('/dashboard'); 
        
        // Chờ cho nội dung SPA (Single Page Application) được render xong và tương tác diễn ra
        await page.waitForTimeout(1000); // Thay bằng việc chờ selector cụ thể hơn
        
        const mainContentSelector = '#main-content';
        
        // Gọi hàm kiểm tra a11y
        const violations = await checkA11y(page, mainContentSelector);

        // Assertion: Nếu violations array không rỗng, test phải fail.
        expect(violations).toHaveLength(0); 
    });
});
```

### Giải thích Chuyên sâu của Duy Trung:

1. **`await page.$(elementSelector)`:** Đây là bước quan trọng nhất. Chúng ta dùng Playwright để trỏ đến phần tử DOM *thực tế* trên trang (đã được React render). `axe-core` cần một đối tượng vật lý để đánh giá, không thể chỉ đánh giá từ chuỗi HTML tĩnh.
2. **`const results = await axe(element, { runOnly: [...] });`:** Thay vì chạy toàn bộ thư viện a11y khổng lồ (có thể gây chậm), chúng ta sử dụng `{ runOnly: [] }` để chỉ định các tiêu chuẩn cụ thể mà ứng dụng của bạn cần quan tâm nhất (ví dụ: `"wcag2a"` là lớp kiểm tra cơ bản theo WCAG 2.1 Level A). Điều này giúp test nhanh và tập trung hơn.
3. **`expect(violations).toHaveLength(0);`:** Đây chính là *assertion* mạnh mẽ của quy trình QA tự động. Bằng cách yêu cầu số lượng vi phạm bằng 0, chúng ta ép buộc framework Playwright phải dừng lại và báo lỗi nếu phát hiện bất kỳ vấn đề a11y nào.

***

## ⭐ IV. Các Best Practices Nâng cao từ QE Lead

Kiểm thử a11y không chỉ là chạy một lệnh. Nó đòi hỏi tư duy hệ thống và sự kết hợp giữa code test và quy trình DevOps. Dưới đây là những lời khuyên tôi đúc kết được:

### 1. Tách biệt A11y Test thành Layer riêng
Tuyệt đối không trộn lẫn các bài kiểm tra *Business Logic* (User can click button) với bài kiểm tra *Quality Attribute* (Button has sufficient contrast). Hãy tạo một module chuyên biệt cho a11y, giúp bạn dễ dàng chèn nó vào quy trình CI/CD.

### 2. Xử lý Nội dung Động và State Changes
Vì React là SPA, nội dung DOM thay đổi rất nhiều. Bạn phải đảm bảo rằng test của bạn bao gồm cả việc kiểm tra a11y *sau* khi một thành phần phức tạp (như Modal Pop-up, Tab Panel, Carousel) được mở ra hoặc đóng lại.

**Mẹo:** Sau khi tương tác (ví dụ: `await page.click('#modal-open')`), hãy chờ thêm 1 giây (hoặc đợi cho một selector mới xuất hiện) và chạy lại hàm `checkA11y` trên vùng DOM chứa Modal đó.

### 3. Tối ưu hóa Performance của Test
Kiểm tra a11y bằng Playwright có thể làm chậm đáng kể suite test của bạn, vì mỗi lần chạy đều phải render toàn bộ nội dung trong trình duyệt.
*   **Giải pháp:** Chỉ chèn các bài test `checkA11y` vào các *component Critical Path* (các luồng chính mà người dùng chắc chắn sẽ tương tác) và không chạy trên tất cả mọi trang, trừ khi bạn đang thực hiện một lần audit toàn diện.

### 4. Xử lý False Positives
Trong quá trình phát triển, bạn có thể gặp những trường hợp `axe-core` báo cáo lỗi (False Positive). Thay vì xóa luật kiểm tra đó khỏi công cụ, hãy:
*   **Tạo lớp bỏ qua:** Dùng các thuộc tính ARIA (`aria-hidden="true"`) hoặc CSS để loại trừ vùng nội dung không quan trọng ra khỏi tầm nhìn của Screen Reader.
*   **Bắt ngoại lệ có chọn lọc:** Nếu phải ignore một luật nào đó, hãy ghi chú rõ ràng *lý do kỹ thuật* tại sao nó được bỏ qua và ai chịu trách nhiệm xác nhận việc này (Documentation is key!).

***

## 🏁 Kết luận

Việc tự động hóa kiểm thử Accessibility không chỉ là tuân thủ tiêu chuẩn; nó là sự cam kết về chất lượng trải nghiệm người dùng cho mọi thành viên trong cộng đồng.

Với bộ công cụ mạnh mẽ của **Playwright** để mô phỏng môi trường thực tế và khả năng đánh giá cực kỳ chi tiết của **axe-core**, bạn đã có đầy đủ vũ khí cần thiết để đưa các bài kiểm tra a11y tự động hóa vào lõi quy trình CI/CD.

Hãy nhớ, một ứng dụng hoàn hảo là ứng dụng không chỉ hoạt động *đúng*, mà còn phải hoạt động *cho tất cả mọi người*. Chúc bạn và đội ngũ QA thành công trong việc xây dựng nên những sản phẩm vừa đẹp mắt, vừa mạnh mẽ, lại vô cùng nhân văn!