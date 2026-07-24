---
title: "Continuous Testing: Thiết lập GitHub Actions CI Pipeline gửi thông báo kết quả lên Slack"
date: 2026-06-06
description: "Học cách xây dựng pipeline Continuous Integration (CI) hoàn chỉnh với GitHub Actions, tự động chạy kiểm thử và nhận báo cáo trạng thái trực tiếp qua Slack."
tags: ["CI-CD","GitHub Actions","Slack"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hồng Dung"
---

# Continuous Testing: Thiết lập GitHub Actions CI Pipeline gửi thông báo kết quả lên Slack

Chào các bạn! Tôi là Hồng Dung, và trong vai trò một Kỹ sư Đảm bảo Chất lượng (QE), tôi tin rằng chất lượng phần mềm không thể nào được đảm bảo nếu chúng ta bỏ qua việc *hiển thị* trạng thái chất lượng đó.

Trong vòng đời phát triển phần mềm hiện đại (SDLC), Continuous Integration (CI) là trụ cột cốt lõi. CI yêu cầu bất cứ khi nào mã nguồn được push, quá trình build và test phải chạy tự động ngay lập tức. Nhưng việc chỉ để kết quả test nằm gọn trong log của GitHub Actions thôi thì chưa đủ. Chúng ta cần một hệ thống nhận thông báo chủ động (Proactive Notification System).

Bài viết này sẽ hướng dẫn bạn cách thiết lập một CI Pipeline mạnh mẽ bằng **GitHub Actions** không chỉ chạy các bài kiểm thử tự động mà còn gửi báo cáo kết quả (thành công hay thất bại) trực tiếp lên kênh giao tiếp nhóm của bạn trên **Slack**. Đây là quy trình thực tế mà mọi đội ngũ DevOps/QE chuyên nghiệp đều nên áp dụng.

---

## 💡 I. Kiến Thức Nền Tảng: Tại Sao Cần Thông Báo Kết Quả?

Trước khi đi vào kỹ thuật, chúng ta cần hiểu rõ vấn đề:

1.  **Vấn đề của việc không có thông báo:** Khi một Pull Request (PR) được tạo, và nó gây ra lỗi build hoặc test suite thất bại, nếu các thành viên trong team phải tự truy cập GitHub để kiểm tra log, quá trình phát hiện lỗi sẽ bị chậm trễ.
2.  **Giải pháp:** Sử dụng kênh giao tiếp chung (như Slack) như một "bảng thông báo chất lượng". Khi CI chạy xong, nó phải tự động *thông báo* cho tất cả mọi người biết: "PR này đã Passed ✅" hoặc "⚠️ Cảnh báo: Test thất bại ở module X."

### Các Công cụ chính chúng ta sẽ sử dụng:
*   **GitHub Actions:** Nền tảng CI/CD gốc, chạy các workflow khi có sự kiện (push/pull request).
*   **Slack Webhooks:** Cơ chế cho phép ứng dụng bên ngoài gửi tin nhắn đến một kênh Slack xác định mà không cần phải kết nối API phức tạp.

---

## 🛠️ II. Chuẩn Bị Môi Trường (Prerequisites)

Chúng ta sẽ đi qua ba bước chuẩn bị quan trọng nhất trước khi viết code: thiết lập webhook, tạo token bí mật và cấu trúc dự án.

### Bước 1: Lấy Slack Webhook URL
Đây là "điểm đến" mà GitHub Actions sẽ gửi tin nhắn tới.

1.  Trong workspace Slack của bạn, truy cập **Incoming Webhooks**.
2.  Bật tính năng này và chọn tích hợp cho kênh cần nhận thông báo (ví dụ: `#devops-alerts`).
3.  Sau khi xác nhận, hệ thống sẽ cung cấp một URL dạng `https://hooks.slack.com/services/T0.../B0.../XXXXXXXXXXXXXXXXXXXXXXXX`.
4.  **Hãy sao chép URL này cẩn thận.** Đây là thông tin nhạy cảm!

### Bước 2: Lưu trữ Secret trong GitHub
Chúng ta không bao giờ được lưu các khóa bí mật trực tiếp vào file code (YAML). Chúng ta phải sử dụng **GitHub Secrets**.

1.  Vào kho lưu trữ (Repository) trên GitHub của bạn.
2.  Chọn **Settings** > **Secrets and variables** > **Actions**.
3.  Nhấn **New Repository Secret**, và tạo hai secrets sau:
    *   `SLACK_WEBHOOK_URL`: Dán toàn bộ URL Webhook đã sao chép ở Bước 1 vào đây.
    *   *(Optional)* `GITHUB_TOKEN_SECRET`: (Nếu bạn cần quyền truy cập nâng cao hơn, nhưng trong ví dụ này thì chưa cần thiết).

### Bước 3: Cấu trúc Project Giả Định
Giả sử dự án của bạn có một file test nào đó nằm ở thư mục `/tests` và chúng ta sẽ viết logic kiểm thử tại đây.

---

## 💻 III. Xây Dựng Workflow CI Pipeline (GitHub Actions YAML)

Đây là phần cốt lõi nhất. Chúng ta sẽ tạo ra một file `.github/workflows/ci_pipeline.yml` để định nghĩa toàn bộ quy trình.

### File: `.github/workflows/ci_pipeline.yml`

```yaml
name: Continuous Integration Test Suite

# 1. Kích hoạt workflow khi có sự kiện nào xảy ra
on:
  pull_request: # Chạy khi tạo PR (Khuyến nghị nhất cho QE)
    branches: [ main, develop ]
  push: # Hoặc chạy khi push lên các nhánh chính
    branches: [ main, develop ]

jobs:
  test-and-report:
    runs-on: ubuntu-latest
    # Thiết lập môi trường và dependencies cần thiết (Node.js ví dụ)
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js Environment
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      # 2. Bước Build (Kiểm tra cú pháp và thư viện)
      - name: Install Dependencies
        run: npm ci # Hoặc yarn install, composer install...

      # 3. Bước Kiểm Thử (Đây là nơi các bài test thực sự chạy)
      - name: Run Unit and Integration Tests
        id: test_runner # Gắn ID cho bước này để sử dụng kết quả sau
        run: npm test -- --json > test_results.json || echo "::error::Tests Failed!" >> $GITHUB_STEP_SUMMARY
      
      # 4. Bước Báo Cáo Kết Quả (Chỉ chạy nếu các bước trước thành công)
      - name: Send Test Results to Slack
        if: always() # Quan trọng: Đảm bảo nó chạy dù test Pass hay Fail
        run: |
          echo "--- Bắt đầu gửi báo cáo kết quả lên Slack ---"
          # Script này sử dụng curl để gửi payload JSON tới webhook URL
          curl -X POST -H 'Content-type: application/json' \
               --data '{
                 "text": ":rocket: *[CI Status]* :rainbow: CI Pipeline đã hoàn thành trên Repo ${{ github.repository }}: ${{ github.event_name }}",',
                 "blocks": [
                   {
                     "type": "section",
                     "text": {
                       "type": "mrkdwn",
                       "text": "*Người Trigger:* <${{ github.actor }}|${{ github.actor }}>\n*Nhánh:* ${{ github.ref_name }}\n*PR/Commit:* `${{ github.event.pull_request.title || 'Push Code' }}`"
                     }
                   },
                   # Logic kiểm tra trạng thái Pass/Fail
                   {
                     "type": "section",
                     "text": {
                       "type": "mrkdwn",
                       "text": ":green_circle: *✅ PASS!* Toàn bộ bài test đã vượt qua. Code sẵn sàng merge.\n(Nếu bước này chạy, nghĩa là không có error nào được báo cáo)"
                     }
                   }
                 ]
               }' \
               $SLACK_WEBHOOK_URL

```

---

## 🔬 IV. Giải Thích Chuyên Sâu Từ QE Lead (Hồng Dung)

Tôi sẽ đi sâu vào giải thích từng khối mã quan trọng để các bạn nắm vững nguyên lý vận hành của nó.

### 1. Phân tích `on:` và `jobs: test-and-report`
*   **`on: pull_request:`**: Đây là điểm mấu chốt khi xây dựng CI cho PR. Chúng ta muốn biết ngay lập tức liệu việc merge code có làm hỏng hệ thống không. Bằng cách trigger trên sự kiện này, mọi người sẽ nhận được phản hồi *trước khi* mã được hợp nhất (merge).
*   **`runs-on: ubuntu-latest`**: Đảm bảo rằng môi trường chạy test của bạn luôn sạch và ổn định với cấu hình Linux mới nhất.

### 2. Phân tích các Bước Test (`Run Unit and Integration Tests`)
```yaml
      - name: Run Unit and Integration Tests
        id: test_runner 
        run: npm test -- --json > test_results.json || echo "::error::Tests Failed!" >> $GITHUB_STEP_SUMMARY
```
*   **`npm test ... > test_results.json`**: Thay vì chỉ chạy lệnh, chúng ta ép chương trình test trả về một file JSON (`test_results.json`). Việc này giúp QE có thể phân tích sâu hơn (ví dụ: tìm ra chỉ số độ bao phủ code coverage).
*   **`|| echo "::error::Tests Failed!" >> $GITHUB_STEP_SUMMARY`**: Đây là kỹ thuật xử lý lỗi rất quan trọng! Ký hiệu `||` trong Bash nghĩa là *nếu lệnh trước thất bại*. Chúng ta dùng nó để ép GitHub Actions nhận biết rằng dù test suite fail, chúng ta vẫn muốn gửi thông báo lỗi bằng cú pháp riêng của GitHub (`::error::...`) ngay trên giao diện CI.

### 3. Phân tích Bước Báo Cáo Slack (The Notification Payload)
```yaml
      - name: Send Test Results to Slack
        if: always() # <<< Điểm then chốt nhất
        run: |
          curl -X POST ... $SLACK_WEBHOOK_URL
```

*   **`if: always()`**: **Đây là cú pháp quan trọng nhất về mặt logic CI/CD.** Theo mặc định, một bước (step) chỉ chạy nếu tất cả các bước trước đó thành công. Tuy nhiên, trong trường hợp test fail, chúng ta vẫn *muốn* gửi thông báo thất bại lên Slack. Bằng cách dùng `if: always()`, chúng ta đảm bảo rằng script báo cáo sẽ được thực thi bất kể kết quả của bước kiểm thử trước đó là gì (thành công hay thất bại).
*   **`curl ... $SLACK_WEBHOOK_URL`**: Chúng ta sử dụng `curl` để gọi tới Webhook URL, và payload JSON chứa nội dung tin nhắn.

#### Về cấu trúc Payload (Nội dung Slack):
Chúng tôi không chỉ gửi một đoạn text đơn thuần; chúng tôi dùng định dạng **Slack Blocks** và Markdown (`mrkdwn`). Điều này cho phép:
1.  In các thông tin có tính ngữ cảnh (contextual information) như `github.actor` (ai thực hiện), `github.ref_name` (nhánh nào).
2.  Tạo màu sắc, icon `:green_circle:` hoặc `:red_circle:` để báo hiệu trạng thái trực quan ngay lập tức khi thành viên nhóm xem kênh Slack.

---

## ✅ V. Tổng Kết và Best Practices Từ Góc Nhìn QE

Thiết lập CI Pipeline là một cột mốc lớn trong việc nâng cao tính tự động hóa của quy trình phát triển. Tuy nhiên, với vai trò chuyên gia QE, tôi xin nhắc thêm vài lời khuyên quan trọng sau:

1.  **Phân tách Job (Job Separation):** Không nên nhồi tất cả mọi thứ vào một job duy nhất. Hãy chia thành các `jobs` riêng biệt như:
    *   `Build`: Chỉ chạy compile code và package app.
    *   `Unit_Test`: Chạy test đơn vị.
    *   `Integration_Test`: Chạy test tương tác giữa các module/service.
    *   `E2E_Test`: Chạy Selenium/Cypress (test giao diện người dùng).
    Việc này giúp xác định chính xác bước nào gây ra lỗi, giảm thiểu Time To Debugging.

2.  **Quản lý Trạng thái (State Management):** Luôn luôn sử dụng `if: always()` khi việc thông báo kết quả là yêu cầu kinh doanh. Việc thông báo cần được đảm bảo về mặt khả năng hoạt động ngay cả khi có lỗi xảy ra.

3.  **Tài liệu hóa Thông Báo:** Định dạng tin nhắn Slack của bạn phải nhất quán (ví dụ: Luôn bắt đầu bằng emoji 🚧 để chỉ trạng thái CI, và luôn đính kèm link trực tiếp đến Build Artifacts).

Hy vọng bài viết chuyên sâu này đã giúp các bạn tự tin xây dựng một hệ thống kiểm thử liên tục không chỉ mạnh mẽ về kỹ thuật mà còn cực kỳ hiệu quả trong giao tiếp đội nhóm. Hãy biến mọi lỗi thành thông báo rõ ràng, và chất lượng sản phẩm sẽ được đảm bảo!

***
*Hồng Dung - QE Lead.*