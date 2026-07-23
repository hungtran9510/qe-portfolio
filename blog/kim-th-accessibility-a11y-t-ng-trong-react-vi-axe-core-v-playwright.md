---
title: "Kiểm thử Accessibility (a11y) tự động trong React với axe-core và Playwright"
date: 2026-06-24
description: "Hướng dẫn chuyên sâu cách tích hợp kiểm thử Accessibility WCAG vào quy trình CD của bạn bằng sự kết hợp mạnh mẽ giữa axe-core và Playwright."
tags: ["Accessibility","React","Playwright"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Duy Trung"
---

# Kiểm thử Accessibility (a11y) tự động trong React với axe-core và Playwright

Xin chào các đồng nghiệp! Tôi là Duy Trung, một chuyên gia Kỹ thuật Đảm bảo Chất lượng Phần mềm.

Trong kỷ nguyên phát triển ứng dụng web hiện đại, việc xây dựng một sản phẩm không chỉ phải *hoạt động* (functional) mà còn phải *dành cho tất cả mọi người* (inclusive). Và chính đó là tầm quan trọng của **Accessibility (a11y)** – hay khả năng tiếp cận.

Ngày càng có nhiều yêu cầu về tuân thủ các tiêu chuẩn WCAG (Web Content Accessibility Guidelines). Tuy nhiên, việc kiểm thử a11y truyền thống thường bị giới hạn ở các bước kiểm tra thủ công, mất thời gian và dễ bỏ sót. Nếu chúng ta muốn đưa chất lượng này vào vòng lặp phát triển liên tục (CI/CD), giải pháp của chúng ta phải là **tự động hóa**.

Trong bài viết hôm nay, tôi sẽ đi sâu vào một kiến trúc cực kỳ mạnh mẽ để đạt được điều đó: Kết hợp sức mạnh kiểm thử hành vi của **Playwright** với bộ công cụ phân tích a11y hàng đầu thế giới – **axe-core**. Đây là hướng dẫn chuyên sâu mà tôi tin rằng bất cứ QE hay Dev nào muốn nâng tầm quy trình chất lượng đều cần đọc.

***

## 💡 Tại sao chúng ta cần axe-core và Playwright? (The Problem Statement)

### 1. Giới hạn của Kiểm thử Thường lớp (Unit/Component Testing)
Khi làm việc với React, các công cụ như Jest hoặc RTL rất tuyệt vời để kiểm tra logic component. Tuy nhiên, a11y không chỉ là vấn đề của code JSX; nó là cách **DOM cuối cùng được render** và cách trình duyệt *diễn giải* DOM đó.

Ví dụ: Bạn viết nút bấm bằng thẻ `<div>` thay vì `<button>`. Về mặt React/JSX, bạn vẫn "thành công" trong unit test. Nhưng khi người dùng sử dụng bàn phím hoặc công nghệ hỗ trợ (Screen Readers), nó sẽ thất bại vì thiếu vai trò (role) và hành vi mặc định của một nút bấm thực thụ.

### 2. Vai trò của Từng Công Cụ
*   **`axe-core`**: Đây là "bộ não" kiểm tra a11y. Nó không phải là một công cụ test; nó là một **engine (công cụ lõi)** đã được cộng đồng xác nhận rộng rãi, giúp quét DOM và báo cáo các lỗi vi phạm tiêu chuẩn WCAG theo thời gian thực.
*   **Playwright**: Đây là "bàn tay" thực thi. Playwright cho phép chúng ta điều khiển trình duyệt *thực tế* (trình duyệt headless hoặc headed), mô phỏng hành vi người dùng (nhấp chuột, gõ phím, chờ đợi AJAX) và quan trọng nhất là nó cung cấp quyền truy cập vào môi trường DOM đã được render hoàn chỉnh.

**Kết luận:** Chúng ta cần Playwright để *đưa* ứng dụng React của mình vào một trạng thái cụ thể (ví dụ: sau khi người dùng nhấp qua các bước checkout), và sau đó sử dụng `axe-core` để *kiểm tra* tình trạng a11y của DOM tại khoảnh khắc đó.

***

## 🛠️ Thiết lập Môi trường (Setup Guide)

Trước khi đi vào code, chúng ta cần đảm bảo môi trường của mình sẵn sàng. Giả định bạn đã có một project React/Playwright cơ bản.

### Bước 1: Cài đặt Dependencies
```bash
# Cài đặt axe-core và thư viện phụ trợ cho testing
npm install axe-core @axe-core/react --save-dev
```

### Bước 2: Viết Trình Kiểm Thử (The Playwright Test File)
Chúng ta sẽ tạo một file test (ví dụ: `a11y.spec.js`) nơi chúng ta sẽ thực hiện các bước sau: Tải trang $\rightarrow$ Tương tác với UI $\rightarrow$ Chạy kiểm tra a11y trên khu vực mục tiêu.

Đây là bản nháp tôi thường dùng khi thiết lập quy trình này:

```javascript
// playwright.spec.js
const { test, expect } = require('@playwright/test');
const { axe, getAxeElement } = require('axe-core'); 

// Đường dẫn tới trang React của bạn
const TARGET_URL = 'http://localhost:3000/';

test.describe('Accessibility Checks on Dashboard', () => {
    
    test.beforeAll(async ({ page }) => {
        await page.goto(TARGET_URL);
        // Chờ đợi các phần tử động tải xong 
        await page.waitForSelector('#main-content'); 
    });

    test('Should pass axe accessibility audit on the main container', async ({ page }) => {
        
        // 1. Chọn selector cha bao trọn nội dung cần kiểm tra
        const targetElementLocator = page.locator('#main-content');
        
        // 2. Lấy HTMLElement thực tế từ Playwright để truyền cho axe
        const elementHandle = await targetElementLocator.elementHandle();
        
        // Chuyển đổi Handle sang DOM Node (hoặc Selector XPath/Query)
        // Lưu ý: Việc này yêu cầu thao tác với JS context hoặc sử dụng selector chính xác 
        // Ví dụ đơn giản nhất là kiểm tra toàn bộ body:
        const mainContainer = await page.evaluateHandle(() => document.body);

        // 3. Chạy axe-core trên element đó
        await getAxeElement(mainContainer); // Giả định hàm trợ giúp đã được viết để thực thi axe.run()

        let results;
        try {
            results = await axe(document.body, { 
                rules: { 'aria-required-attr': { enabled: true } }, // Chỉ bật rules quan tâm
                axeOptions: { severity: 'critical' } // Giới hạn mức độ nghiêm trọng cần báo cáo
            });
        } catch (error) {
            // Bắt lỗi nếu quá trình kiểm tra thất bại do DOM không sẵn sàng
            console.error("Accessibility check failed:", error);
        }

        // 4. Kiểm tra kết quả
        expect(results.violations.length).toBe(0);
    });
});
```

## 🔬 Phân tích Code và Quy trình Thực thi (The QE Deep Dive)

Hãy cùng tôi mổ xẻ đoạn code trên để hiểu cơ chế hoạt động của nó:

### 1. `page.locator('#main-content')` & DOM Isolation
Chúng ta không bao giờ nên chạy kiểm tra a11y trên toàn bộ trang (`document.body`) nếu khu vực đó có nội dung tĩnh (ví dụ: thanh điều hướng) và phần khác là widget test tạm thời.

**Nguyên tắc vàng:** Luôn cô lập khu vực cần được kiểm thử (Scope the audit). Bằng cách chọn selector `#main-content`, chúng ta đảm bảo rằng `axe` chỉ tập trung vào các thành phần mà luồng nghiệp vụ của người dùng tương tác trực tiếp, giúp giảm False Positives và tăng tính thực tế.

### 2. Cơ chế Truyền DOM State (The Magic Step)
Đây là bước khó nhất khi tự động hóa a11y. Chúng ta không chỉ cần HTML tĩnh; chúng ta cần *trạng thái* của DOM sau khi React đã chạy các state update, gọi API, và render kết quả.

Bằng cách sử dụng `page.evaluateHandle(() => document.body)`, chúng ta yêu cầu Playwright thực thi đoạn JavaScript đó ngay trong ngữ cảnh trình duyệt đang mở, trả về một handle đại diện cho DOM Node tại thời điểm chụp ảnh. Điều này đảm bảo rằng khi `axe` được chạy, nó đang phân tích một phiên bản DOM *chính xác* mà người dùng cuối sẽ thấy.

### 3. Phân tích Kết quả (`expect(results.violations.length).toBe(0)`)
Đây là trọng tâm của việc CI/CD. Chúng ta không chỉ mong đợi rằng hàm `axe()` chạy thành công; chúng ta phải *khẳng định* (Assert) rằng: **Số lượng vi phạm accessibility phải bằng 0.**

Nếu kết quả trả về `results.violations` có phần tử nào, điều đó đồng nghĩa với việc quy trình test sẽ thất bại (`test fails`), và CI/CD pipeline của chúng ta sẽ dừng lại, báo hiệu cho đội ngũ dev biết rằng một lỗ hổng a11y vừa được đưa vào nhánh phát triển.

***

## 🚀 Các Thực tiễn Tốt nhất (Best Practices từ QE Lead)

Với kinh nghiệm thực tế trong việc tích hợp a11y vào quy trình chất lượng sản phẩm, tôi muốn nhấn mạnh thêm vài điều sau:

### 1. Xử lý Nội dung Động (Dynamic Content Flow)
Nếu component của bạn hiển thị nội dung theo luồng (ví dụ: modal pop-up, tooltip), chỉ chạy `axe` một lần là chưa đủ. Bạn phải mô phỏng toàn bộ hành động đó trong test:

*   **Thực hiện:** Playwright click vào nút mở Modal. *Chờ đợi*: Chờ event `aria-expanded="true"` trên Modal. Sau đó mới gọi `axe`.
*   **Tại sao:** Đảm bảo rằng các thuộc tính ARIA, focus trap (bẫy tiêu điểm), và việc quản lý tab index đã được xử lý đúng khi state thay đổi.

### 2. Focus Management (Quản lý Tiêu điểm)
Đây là một lỗi a11y thường gặp nhất: Khi người dùng tương tác với form, tiêu điểm phải luôn di chuyển logic theo trình tự tab (`Tab Order`). Bạn nên viết test riêng để:
*   Kiểm tra rằng sau khi nhấn `Enter` hoặc `Space`, focus được chuyển đến đúng element kế tiếp.
*   Sử dụng các hàm như `page.evaluate()` kết hợp với JavaScript DOM API để kiểm tra thuộc tính `tabindex`.

### 3. Tích hợp vào CI/CD Pipeline
Đừng bao giờ quên bước này! Sau khi viết xong `a11y.spec.js`, hãy đảm bảo rằng:

```bash
# Thêm lệnh test a11y vào script pre-commit hoặc build step của Jenkins/GitLab Runner
npx playwright test --project=accessibility_check 
```
Điều này biến việc kiểm tra a11y thành một phần *bắt buộc* và tự động hóa, không phải là nhiệm vụ "kiểm tra thêm" lúc cuối chu kỳ phát triển.

***

## Lời Kết từ Duy Trung

Kiểm thử Accessibility là trách nhiệm chung của toàn bộ đội ngũ kỹ thuật, không chỉ riêng QE. Bằng cách biến việc kiểm tra a11y thành một bài test tự động với Playwright và axe-core, chúng ta không chỉ nâng cao chất lượng sản phẩm mà còn thực hiện lời cam kết về tính hòa nhập (Inclusivity) cho mọi người dùng tiềm năng.

Hãy bắt đầu bằng việc triển khai quy trình này ngay hôm nay để kiến trúc kiểm thử của bạn trở nên toàn diện hơn bao giờ hết! Chúc các đồng nghiệp luôn thành công trong hành trình phát triển phần mềm chất lượng cao và nhân văn!