---
title: "Continuous Testing: Thiết lập GitHub Actions CI Pipeline gửi thông báo kết quả lên Slack"
date: 2026-06-04
description: "Hướng dẫn chi tiết cách thiết lập luồng Continuous Integration (CI) với GitHub Actions, tích hợp chạy test tự động và nhận thông báo kết quả trực tiếp qua Slack."
tags: ["CI-CD","GitHub Actions","Slack","Automation Testing"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hồng Dung"
---

# Continuous Testing: Thiết lập GitHub Actions CI Pipeline gửi thông báo kết quả lên Slack

Chào các bạn kỹ sư và chuyên gia Chất lượng! Tôi là Hồng Dung.

Trong bối cảnh phát triển phần mềm tốc độ cao ngày nay, việc đảm bảo chất lượng không còn là một bước kiểm tra cuối cùng (End-of-Cycle Testing). Thay vào đó, chúng ta phải áp dụng tư duy **Continuous Quality** — biến việc testing thành một luồng hoạt động liên tục ngay từ khi code được commit.

Nếu bạn đang gặp tình trạng các bản build bị lỗi hoặc cần biết kết quả test tự động mà không cần phải truy cập Dashboard GitHub mỗi lần, bài viết này chính là dành cho bạn. Hôm nay, tôi sẽ hướng dẫn chi tiết cách thiết lập một pipeline CI hoàn chỉnh bằng **GitHub Actions**, bao gồm việc chạy bộ kiểm thử và thông báo kết quả (thành công hay thất bại) trực tiếp lên kênh Slack của nhóm chỉ trong vài phút.

## 🎯 I. Tổng Quan Về Kiến Trúc Hệ Thống (System Architecture Overview)

Trước khi đi vào code, chúng ta cần hiểu rõ luồng dữ liệu:

1.  **Sự kiện kích hoạt (Trigger):** Một developer push commit hoặc mở Pull Request trên nhánh chính.
2.  **GitHub Actions CI Pipeline:** Được kích hoạt, nó đọc và thực thi các bước trong file `.yml` mà chúng ta định nghĩa.
3.  **Thực thi Test:** Các môi trường ảo sẽ chạy suite kiểm thử (ví dụ: Jest, Pytest, JUnit...).
4.  **Báo cáo Kết quả:** Pipeline ghi nhận trạng thái (Success/Failure).
5.  **Thông báo:** Một bước cuối cùng của Actions được gọi để gửi thông điệp đã định dạng tới Webhook của Slack.

Mục tiêu là làm cho toàn bộ quy trình này trở nên tự động, đáng tin cậy và hiển thị kết quả ngay lập tức cho tất cả các bên liên quan.

## 🛠️ II. Chuẩn Bị Các Thành Phần (Prerequisites)

Trước khi code, hãy đảm bảo bạn đã có:

1.  **Một kho lưu trữ trên GitHub:** Chứa code của ứng dụng.
2.  **Slack Workspace:** Một không gian làm việc nhóm trên Slack.
3.  **Thông báo Webhook từ Slack:** Bạn cần tạo một **Incoming Webhook URL** trong kênh mục tiêu trên Slack. Đây là "cánh cổng" cho phép bên ngoài (GitHub Actions) gửi thông tin vào Slack.

> 💡 *Bảo mật cực kỳ quan trọng!* Tuyệt đối không đưa Webhook URL này trực tiếp vào code. Chúng ta sẽ sử dụng GitHub Secrets.

### Bước 1: Lưu trữ Secrets trong GitHub Repository

Truy cập `Settings` > `Security` > `Secrets and Variables` của repository đó và thêm một Secret mới tên là **`SLACK_WEBHOOK_URL`**. Paste URL Webhook bạn đã lấy ở bước trên vào đây.

## 🧪 III. Xây Dựng Pipeline Bằng GitHub Actions (The Core Workflow)

Chúng ta sẽ tạo file workflow tại `.github/workflows/ci_pipeline.yml`. File này định nghĩa mọi thứ mà CI nên làm.

Dưới đây là cấu trúc code mẫu và lời giải thích chi tiết từ Hồng Dung:

```yaml
# .github/workflows/ci_pipeline.yml

name: 🚀 Continuous Integration & Testing

on:
  push: # Kích hoạt khi có push commit vào bất kỳ nhánh nào
    branches: [ main, develop ]
  pull_request: # Và kích hoạt khi có Pull Request
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest # Môi trường Linux mới nhất của GitHub
    steps:
      # Bước 1: Checkout code (Tải mã nguồn)
      - name: Checkout Repository
        uses: actions/checkout@v4

      # Bước 2: Thiết lập môi trường Node.js (Giả sử bạn dùng JS/TS cho test)
      - name: Setup Node.js Environment
        uses: actions/setup-node@v4
        with:
          node-version: '20' # Chọn phiên bản Node phù hợp

      # Bước 3: Cài đặt dependencies và chạy Test (Phần CI chính)
      - name: Install Dependencies & Run Tests
        run: |
          npm ci  # npm ci đảm bảo cài đặt các package đúng theo lock file
          npm test # Giả định lệnh này chạy suite kiểm thử tự động

      # Bước 4: Xử lý và thông báo kết quả lên Slack (Phần QE quan trọng)
      - name: Report Results to Slack
        uses: benc-xyz/github-script@v0.12.0 # Sử dụng Action để gọi script JS
        if: always() # QUAN TRỌNG: Luôn chạy bước này, dù test thành công hay thất bại (always())
        with:
          script: |
            // Logic gửi thông báo được viết ở đây
            const status = process.env.CI_STATUS === 'success' ? '✅ THÀNH CÔNG' : '❌ LỖI TEST';
            const repoName = "${{ github.repository }}";
            const commitSha = "${{ github.sha }}"
            
            await github.rest.webhooks.send({
              hookUrl: process.env.SLACK_WEBHOOK_URL,
              payload: {
                text: `[${status}] 🤖 CI Pipeline cho Repository ${repoName} đã hoàn tất!`,
                attachments: [{
                  fields: [
                    { title: "Triggered By", value: "${{ github.actor }}", short: true },
                    { title: "Branch", value: "${{ github.ref_name }}", short: true },
                    { title: "Commit SHA", value: `${commitSha}`
                  ]
                }]
              }
            });
          headers: {
             'Content-Type': 'application/json'
          }
```

## ⚙️ IV. Phân Tích Chi Tiết Các Thành Phần (Hồng Dung's Breakdown)

Đây là phần mà tôi muốn nhấn mạnh nhất, vì nó giải thích *tại sao* chúng ta lại viết code như thế này.

### 1. Về Kích hoạt (`on: push` & `on: pull_request`)
Việc định nghĩa các sự kiện kích hoạt giúp pipeline phản ứng đúng thời điểm. Chúng ta không muốn chạy full suite test chỉ vì một thay đổi nhỏ về tài liệu, mà nên tập trung vào những hành vi code commit hoặc mở PR.

### 2. Về Logic Thực thi Test (`npm test`)
Bước này là trái tim của CI. Nếu `npm test` trả về mã thoát (exit code) khác 0 (ví dụ: lỗi unit test), GitHub Actions sẽ tự động đánh dấu toàn bộ Job là **Failed**. Điều này đảm bảo rằng mọi thay đổi có lỗi đều bị chặn lại trước khi merge.

### 3. Về Cú pháp `if: always()`
Đây là một khái niệm cực kỳ quan trọng về mặt QE! Thông thường, các bước trong Actions chỉ chạy nếu các bước trước nó *thành công*. Tuy nhiên, chúng ta cần thông báo kết quả lên Slack **bất kể** test có thành công hay thất bại.

Sử dụng `if: always()` đảm bảo rằng khối code gửi thông báo (`Report Results to Slack`) vẫn được thực thi ngay cả khi Job ở bước 3 bị lỗi. Điều này đảm bảo độ bao phủ của thông tin trạng thái (Status Coverage).

### 4. Về Cơ chế Gửi Thông báo (`report results to slack` Step)
*   **Action:** Tôi sử dụng `benc-xyz/github-script@v0.12.0`. Đây là một cách chuyên nghiệp để chạy các script phức tạp bằng Node.js và cho phép chúng ta truy cập sâu vào ngữ cảnh (context) của GitHub Actions (`github.rest`).
*   **Biến Môi trường (Environment Variables):** Chúng ta kiểm tra `process.env.CI_STATUS`. *Lưu ý:* Trong thực tế, cách đơn giản hơn là dùng các bước Conditional Execution trong YAML để xác định trạng thái, nhưng việc kiểm tra biến môi trường (hoặc sử dụng một Action chuyên biệt) là phương pháp nâng cao giúp chúng ta điều khiển thông báo chính xác hơn.
*   **Payload:** Chúng ta xây dựng payload JSON cho Slack. Bằng cách truyền tải `repoName`, `github.actor` và `commitSha`, chúng ta không chỉ biết "có lỗi" mà còn biết *ai*, *khi nào*, và *trong dự án nào* xảy ra lỗi, giúp đội ngũ xử lý vấn đề cực kỳ nhanh chóng (Mean Time To Resolution - MTTR).

## ✨ V. Kết Luận và Khuyến Nghị Chất Lượng Từ QE Lead

Việc thiết lập CI Pipeline kết hợp với thông báo tức thời là một bước tiến lớn trong việc xây dựng Quy trình Phát triển Chất lượng cao (High-Quality Development Workflow).

**Lời khuyên của Hồng Dung:**

1.  **Đừng chỉ dừng lại ở Unit Test:** Sau khi CI cơ bản hoạt động, hãy mở rộng bằng cách thêm các bài kiểm tra tích hợp (Integration Tests) và thậm chí là kiểm thử Smoke Test tự động vào pipeline này.
2.  **Caching Dependencies:** Để tăng tốc độ Build/Test (đặc biệt với các dự án lớn), hãy sử dụng `actions/cache` để lưu cache cho các dependencies (`node_modules`, Maven repo, v.v.).
3.  **Phân tầng Workflow:** Với hệ thống phức tạp, đừng nhồi tất cả vào một file YAML. Hãy tách ra thành các jobs riêng biệt: `Build Job` -> `Test Job` -> `Deploy Job`. Điều này giúp bạn dễ dàng debug và cô lập vấn đề khi có lỗi xảy ra.

Continuous Testing không chỉ là chạy test, nó là việc xây dựng một lớp mạng lưới an toàn xung quanh quá trình phát triển của chúng ta. Áp dụng ngay hệ thống này để nâng tầm chất lượng sản phẩm và sự tự tin cho đội ngũ Dev!

Chúc các bạn thành công với hành trình CI/CD của mình!
***
*Hồng Dung - QE Lead.*