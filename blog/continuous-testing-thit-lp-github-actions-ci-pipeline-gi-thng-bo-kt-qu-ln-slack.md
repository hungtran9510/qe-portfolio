---
title: "Continuous Testing: Thiết lập GitHub Actions CI Pipeline gửi thông báo kết quả lên Slack"
date: 2026-06-07
description: "Hướng dẫn chuyên sâu thiết lập quy trình Continuous Testing tự động với GitHub Actions, tích hợp nhận báo cáo ngay tức thì trên Slack."
tags: ["CI-CD","GitHub Actions","Slack"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hồng Dung"
---

# Continuous Testing: Thiết lập GitHub Actions CI Pipeline gửi thông báo kết quả lên Slack

Chào các đồng nghiệp trong lĩnh vực chất lượng phần mềm! Tôi là Hồng Dung, và hôm nay chúng ta sẽ cùng nhau đi sâu vào một chủ đề mà bất kỳ đội phát triển hiện đại nào cũng phải nắm vững: **Continuous Testing (Kiểm thử liên tục)**.

Trong kỷ nguyên DevOps, việc chỉ chạy kiểm thử thủ công hoặc thậm chí là script cục bộ không còn đủ sức đáp ứng tốc độ phát hành (release velocity) nữa. Mục tiêu của chúng ta là xây dựng một hệ thống tự động hóa hoàn toàn, nơi mọi thay đổi mã nguồn đều được xác thực ngay lập tức—và quan trọng hơn hết, bạn cần nhận được thông báo kết quả **ngay tại điểm làm việc chung** của đội ngũ: Slack!

Bài viết này không chỉ là lý thuyết; tôi sẽ cung cấp cho bạn một lộ trình chi tiết và các đoạn mã mẫu để thiết lập toàn bộ luồng CI/CD từ GitHub đến Slack.

***

## I. Tại sao phải Continuous Testing? (The QE Perspective)

Là những chuyên gia chất lượng, chúng ta luôn hiểu rằng lỗi càng được phát hiện sớm thì chi phí khắc phục càng thấp. Continuous Testing đảm bảo điều đó bằng cách tự động hóa các bước kiểm thử và tích hợp nó vào quy trình làm việc của nhà phát triển (Developer Workflow).

**Quy trình cốt lõi:**
1. **Code Push:** Lập trình viên commit code lên một nhánh tính năng (feature branch) trên GitHub.
2. **Trigger CI:** Sự kiện `push` này kích hoạt GitHub Actions Pipeline.
3. **Execute Tests:** Action chạy các bộ test tự động (Unit tests, Integration tests, E2E tests).
4. **Report & Notify:** Dựa vào trạng thái thành công/thất bại của test suite, hệ thống sẽ gửi báo cáo chi tiết lên Slack cho cả team.

Việc này giúp chúng ta chuyển từ mô hình "Testing ở cuối vòng đời" (End-of-cycle testing) sang mô hình "Quality embedded in the cycle".

## II. Chuẩn bị Môi trường và Kết nối (Prerequisites & Setup)

Trước khi đi vào code, chúng ta cần chuẩn bị các thành phần sau:

### 1. Thiết lập GitHub Secrets
Để hành động CI của bạn có thể giao tiếp với Slack một cách bảo mật, bạn cần lấy **Webhook URL** từ kênh Slack mong muốn và lưu nó vào GitHub Secrets (Settings > Secrets and Variables > Actions).

*   **Tên Secret:** `SLACK_WEBHOOK_URL`
*   **Giá trị:** URL Webhook được tạo ra. *(Lưu ý: Tuyệt đối không commit trực tiếp webhook này lên code!)*

### 2. Cấu trúc Project (Giả định)
Chúng ta giả sử dự án của bạn là một ứng dụng web đơn giản, và các bài test tự động của bạn (ví dụ: Jest/Mocha cho Unit Test; Cypress/Playwright cho E2E Test) đã sẵn sàng để được gọi từ môi trường CI.

## III. Xây dựng GitHub Actions Workflow (`.github/workflows/ci-test.yml`)

Đây là trái tim của quy trình tự động hóa. Chúng ta sẽ tạo một file YAML trong thư mục `.github/workflows/` để định nghĩa luồng công việc (workflow).

Dưới đây là cấu hình đầy đủ:

```yaml
name: CI - Run Tests and Notify Slack

on:
  push:
    branches: [ main, develop ] # Kích hoạt khi push lên nhánh main hoặc develop
  pull_request:
    types: [ opened, synchronize, closed ] # Kích hoạt khi PR được mở/cập nhật

jobs:
  test:
    # Xác định môi trường chạy (GitHub-hosted runner)
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4 # Tải mã nguồn từ GitHub
        
      - name: Set up Node.js environment
        uses: actions/setup-node@v4
        with:
          node-version: '20' # Sử dụng phiên bản Node.js cụ thể

      # 🧪 Bước 1: Chạy Unit Tests (Ví dụ sử dụng thư viện Jest)
      - name: Install Dependencies and Run Unit Tests
        run: |
          npm install
          npm run test:unit # Giả định script này chạy unit tests
        continue-on-error: true # Rất quan trọng: Cho phép bước tiếp theo chạy ngay cả khi test thất bại
        
      # 🚀 Bước 2: Chạy E2E Tests (Chỉ chạy trên nhánh main/develop)
      - name: Run End-to-End Tests (If on main branch)
        if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop')
        run: |
          npm run test:e2e # Giả định script này chạy e2e tests

      # 📬 Bước 3: Gửi thông báo kết quả lên Slack
      - name: Send Test Results to Slack
        if: always() # Luôn chạy bước này, bất kể các bước test trước đó thành công hay thất bại
        uses: actions/github-script@v7
        with:
          script: |
            const webhookUrl = "${{ secrets.SLACK_WEBHOOK_URL }}";
            let statusMessage;
            let failureCount = 0;

            // Logic xác định trạng thái chung của workflow
            if (core.getInput('failure').trim() === 'true') {
              statusMessage = "🚨 :red_circle: **FAILURE detected!** - Continuous Testing FAILED.";
              failureCount = 1; // Set flag báo lỗi
            } else if (context.job.conclusion !== 'success') {
                // Bắt các thất bại từ job runner, nếu không có giá trị cụ thể thì mặc định fail
                statusMessage = "🛑 :red_circle: **TESTING FAILED.** Please review the CI logs immediately.";
                failureCount = 1;
            } else {
              statusMessage = "✅ :green_circle: **SUCCESS!** - Continuous Tests passed successfully!";
            }

            // Nội dung thông báo Slack
            const payload = {
              text: `${statusMessage}\n*Commit:* \`${{ github.sha }}\`\n*Branch:* \`${{ github.ref }}\`\n*User:* <${{ github.actor }}|${{ github.actor }}>`,
              attachments: [
                {
                  color: failureCount ? "#dc3545" : "#28a745", // Red for failure, Green for success
                  fields: [
                    { title: "Triggered by:", value: "${{ github.event.head_branch }}", short: true },
                    { title: "Repository:", value: "${{ github.repository }}", short: true }
                  ]
                }
              ]
            };

            await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
```

## IV. Giải thích Chi tiết của QE Lead Hồng Dung (The Deep Dive)

Trong vai trò một QA chuyên nghiệp, tôi muốn giải thích sâu ba điểm quan trọng trong script trên:

### 1. `continue-on-error: true`
**Ý nghĩa:** Đây là một chỉ thị cực kỳ quan trọng về mặt quy trình CI/CD. Nếu bước Unit Test bị lỗi (ví dụ: 50 bài test fail), mặc định GitHub Actions sẽ dừng toàn bộ Pipeline ngay lập tức, và bạn sẽ không bao giờ chạy đến E2E Tests.
**Giải pháp của QE:** Bằng cách đặt `continue-on-error: true`, chúng ta đảm bảo rằng ngay cả khi một loại test (Unit) thất bại, hệ thống vẫn cố gắng chạy các bước kiểm thử sau (E2E). Điều này giúp bạn có cái nhìn toàn diện về những gì đã bị ảnh hưởng.

### 2. Logic `if: always()`
**Ý nghĩa:** Câu lệnh này được gắn vào bước cuối cùng (`Send Test Results to Slack`). Thay vì chỉ chạy khi mọi thứ thành công, `always()` đảm bảo rằng bước thông báo **luôn luôn được thực thi**, dù các bước test trước đó có thất bại hay không.
**Tầm quan trọng:** Nếu ta để nó chạy trong điều kiện success, và bài test fail, bạn sẽ hoàn toàn mất kết nối với đội nhóm, vì Slack sẽ im lặng!

### 3. Sử dụng `actions/github-script` (The Advanced Bit)
Thay vì dùng lệnh `curl` brute force JSON payload qua Webhook, tôi đã sử dụng action **`actions/github-script`**. Tại sao?
*   **Sức mạnh:** Nó cho phép chúng ta viết logic JavaScript *trực tiếp trong pipeline*. Điều này giúp chúng ta có thể kiểm tra biến môi trường (context.job.conclusion), xác định trạng thái thất bại, và xây dựng payload thông báo một cách linh hoạt và phức tạp hơn nhiều so với việc chỉ dùng cú pháp shell cơ bản.
*   **Ví dụ logic:** Tôi đã thiết lập một logic đơn giản để nhận diện trạng thái tổng quát của job (`context.job.conclusion`) để quyết định màu sắc và nội dung thông báo trên Slack, giúp team biết ngay mức độ nghiêm trọng của vấn đề mà không cần xem log dài dòng.

## V. Kết luận: Trở thành đội nhóm phản ứng nhanh (Rapid Response Team)

Việc triển khai một Continuous Testing pipeline kết nối với Slack không chỉ là việc tự động hóa các script; nó là việc xây dựng **một cơ chế giao tiếp chất lượng**. Nó đảm bảo rằng, khi hệ thống phát hiện ra bất kỳ sự sai lệch nào giữa mã nguồn và tiêu chuẩn chất lượng, thông tin đó sẽ đến đúng người (Developer hoặc Product Owner) tại nơi họ cần nhất.

Hãy nhớ rằng, Continuous Testing không phải là đích đến; nó là một **quy trình cải tiến liên tục**. Hãy bắt đầu với những gì bạn có, đo lường độ phủ test, và dần dần mở rộng phạm vi kiểm thử!

Chúc các đồng nghiệp luôn xây dựng nên những sản phẩm chất lượng cao nhất!

***
*Hồng Dung - Quality Engineer Lead.*