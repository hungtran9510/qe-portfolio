---
title: "Continuous Testing: Thiết lập GitHub Actions CI Pipeline gửi thông báo kết quả lên Slack"
date: 2026-06-06
description: "Hướng dẫn chuyên sâu từng bước thiết lập CI Pipeline bằng GitHub Actions, tự động gửi báo cáo trạng thái kiểm thử (thành công/thất bại) về kênh Slack."
tags: ["CI-CD","GitHub Actions","Slack","QE"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hồng Dung"
---

# Continuous Testing: Thiết lập GitHub Actions CI Pipeline gửi thông báo kết quả lên Slack

Xin chào các đồng nghiệp đam mê chất lượng phần mềm! Tôi là Hồng Dung, và trong vai trò một QE Lead, tôi hiểu rằng việc phát triển phần mềm không chỉ dừng lại ở việc *chạy* các bài test tự động. Thách thức thực sự nằm ở việc làm sao để chúng ta *biết ngay lập tức*, tại thời điểm nào, khi nào có lỗi xảy ra, mà không cần phải theo dõi liên tục qua màn hình terminal của GitHub Actions.

Nếu bạn đang quản lý một hệ thống CI/CD và cảm thấy mệt mỏi với việc "nhảy qua lại" giữa GitHub Actions và Slack để kiểm tra trạng thái build, thì bài viết này dành cho bạn.

Hôm nay, tôi sẽ hướng dẫn các bạn cách thiết lập một quy trình **Continuous Testing** hoàn chỉnh: Sử dụng GitHub Actions để chạy bộ test tự động và tích hợp kết quả (thành công hay thất bại) vào kênh Slack chỉ bằng vài dòng cấu hình YAML.

---

## 🚀 I. Continuous Testing là gì và Tại sao cần Thông báo Tức thì?

### 📘 Định nghĩa Nhanh
**Continuous Testing (CT)** là một bộ phận của vòng đời CI/CD, nhằm mục đích đảm bảo rằng chất lượng được kiểm tra liên tục tại mọi giai đoạn phát triển, thay vì đợi đến lúc chạy QA cuối kỳ. Mục tiêu cốt lõi là giảm thiểu "thời gian nhận biết lỗi" (Time to Detect Bug).

### 💡 Vai trò của Thông báo Slack
Trong một môi trường DevOps hiện đại, thông tin phải di chuyển nhanh như điện. Việc chờ các thành viên đội phát triển hoặc QE kiểm tra thủ công log build là *rủi ro lớn về mặt thời gian*. Bằng cách tích hợp Slack, chúng ta đạt được:

1.  **Phản ứng ngay lập tức:** Khi pipeline thất bại, mọi người liên quan nhận được thông báo ngay lập tức (Instant Feedback).
2.  **Minh bạch hóa (Visibility):** Mọi người đều có một nguồn thông tin duy nhất về trạng thái của nhánh code đó.
3.  **Giảm rào cản chú ý:** Giúp các thành viên team không bị mất tập trung vào việc theo dõi màn hình build mà vẫn nắm bắt được tình trạng hệ thống.

---

## ⚙️ II. Chuẩn bị và Tiền đề (Prerequisites)

Trước khi đi sâu vào mã nguồn, chúng ta cần chuẩn bị "nguyên liệu" quan trọng nhất: Các bí mật (Secrets). **Bạn tuyệt đối không nên lưu API Token hay Webhook URL trực tiếp trong code YAML.**

### 1. Thiết lập Slack Webhook
Cách đơn giản và hiệu quả nhất cho việc gửi thông báo là sử dụng Incoming Webhooks của Slack.

*   **Bước 1:** Truy cập mục Apps tích hợp của Slack (hoặc dùng giao diện Chat/Apps).
*   **Bước 2:** Tạo một webhook mới cho kênh mà bạn muốn nhận thông báo.
*   **Kết quả:** Bạn sẽ nhận được một URL duy nhất có dạng `https://hooks.slack.com/services/T00.../B00.../XXXXXXXXXXXXXXXXXXXXXXXX`.

### 2. Lưu Webhook vào GitHub Secrets
GitHub Actions cung cấp cơ chế bí mật (Secrets) để lưu trữ các chuỗi dữ liệu nhạy cảm này.

*   Vào Repository của bạn trên GitHub $\rightarrow$ **Settings** $\rightarrow$ **Secrets and Variables** $\rightarrow$ **Actions**.
*   Nhấn `New repository secret`.
*   Tạo Secret có tên: `SLACK_WEBHOOK_URL`
*   Dán URL Webhook vừa lấy vào giá trị của Secret này.

> 💡 **Mẹo chuyên nghiệp từ Hồng Dung:** Thay vì chỉ dùng một webhook chung, bạn nên tạo các webhooks riêng cho từng môi trường (ví dụ: `DEV_SLACK_WEBHOOK`, `PROD_SLACK_WEBHOOK`) để tăng cường khả năng bảo mật và phân quyền.

---

## 🛠️ III. Triển khai GitHub Actions Pipeline YAML

Chúng ta sẽ tạo một file quy trình tự động hóa tại đường dẫn `.github/workflows/ci_test.yml`. File này sẽ chịu trách nhiệm kiểm thử và sau đó gọi hành động gửi thông báo Slack.

### Cấu trúc Workflow Code (YAML)

```yaml
# .github/workflows/ci_test.yml
name: Automated Testing and Slack Reporting

on:
  push:
    branches:
      - main # Trigger khi push lên nhánh chính
  pull_request:
    branches:
      - main # Trigger khi mở PR vào nhánh chính

jobs:
  test_and_report:
    runs-on: ubuntu-latest

    steps:
    # 1. Checkout code
    - name: Checkout Repository Code
      uses: actions/checkout@v4

    # 2. Setup Environment (Ví dụ: Node.js cho React/Vue)
    - name: Set up Node.js Environment
      uses: actions/setup-node@v4
      with:
        node-version: '20'

    # 3. Run Tests (Đây là bước kiểm thử thực tế của bạn)
    # Giả sử bạn có lệnh test trong package.json
    - name: Execute Unit and Integration Tests
      run: |
        npm ci # Cài đặt dependencies sạch
        npm run test -- --coverage # Chạy bài test và yêu cầu tạo report coverage
      id: test_step

    # 4. Logic Gửi Thông báo Slack (Sử dụng script Conditional)
    - name: Send Slack Notification Status
      uses: actions/github-script@v7
      if: always() # Chạy bước này BẤT KỂ kết quả của bước trên (thành công hay thất bại)
      with:
        script: |
          // Xác định trạng thái build: THÀNH CÔNG hoặc THẤT BẠI
          const jobStatus = '${{ needs.test_and_report.job.status }}';

          let messageColor;
          let title;

          if (jobStatus === 'success') {
            title = "✅ CI/CD Pipeline Thành Công!";
            messageColor = "#36a64f"; // Màu xanh lá cây
          } else if (jobStatus === 'failure' || jobStatus === 'canceled') {
            title = "🚨 LỖI KHI KIỂM THỬ! Vui lòng kiểm tra ngay.";
            messageColor = "#d9534f"; // Màu đỏ
          } else {
            title = "⚠️ Cảnh báo: Pipeline kết thúc với trạng thái không xác định.";
            messageColor = "#f0ad4e"; // Màu vàng cam
          }

          // Xây dựng nội dung tin nhắn Slack sử dụng Markdown
          const payload = JSON.stringify({
            text: `:wave: *Báo cáo CI/CD cho Repository:* <${process.env['GITHUB_SERVER']}/${process.env['GITHUB_REPOSITORY']}>`,
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*Báo cáo Test Status*:\n<${title}>`
                }
              },
               {
                type: "divider"
              },
              {
                type: "section",
                fields: [
                    { type: "mrkdwn", text: `*Status:* \`${jobStatus.toUpperCase()}\`` },
                    { type: "mrkdwn", text: `*Branch:* ${process.env['GITHUB_REF']} (${process.env['GITHUB_HEAD_REF']})`}
                ]
              },
              {
                type: "actions",
                elements: [{
                  type: "button",
                  text: "Xem chi tiết Pipeline trên GitHub",
                  style: "primary",
                  url: `${process.env['GITHUB_SERVER']}/${process.env['GITHUB_REPOSITORY']}/actions/runs/${process.env['RUN_ID']}`
                }]
              }
            ]
          });

          // Gửi payload đến Slack Webhook
          fetch('https://hooks.slack.com/services/YOUR_SLACK_WEBHOOK_URL', { // <-- Thay YOUR_SLACK_WEBHOOK_URL bằng Secret của bạn
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
          });

```

---

## 🔍 IV. Giải thích Chuyên sâu từ Hồng Dung (QE Lead Analysis)

Các bạn cần nắm vững từng thành phần của file YAML này để có thể tùy chỉnh nó cho các ngôn ngữ và quy trình kiểm thử khác nhau.

### 1. Trigger và Scope (`on: push` / `pull_request`)
*   **Mục đích:** Chỉ định khi nào workflow sẽ chạy (ví dụ: mỗi lần code được push lên nhánh `main`). Điều này giúp tối ưu hóa tài nguyên CI/CD.

### 2. Tách biệt Job và Step
*   **Job (`test_and_report`):** Một nhóm các tác vụ phải cùng nhau thực hiện (trong trường hợp này là chạy test VÀ báo cáo kết quả).
*   **Step:** Các lệnh cụ thể được thực thi. Việc đặt bước chạy test trước, và bước gửi thông báo sau, giúp chúng ta có cơ hội để *bắt* trạng thái của bước trước đó.

### 3. The Magic Keyword: `if: always()`
*   Đây là phần quan trọng nhất về mặt Logic CI/CD. Theo mặc định, một step chỉ chạy nếu các step trước thành công. Tuy nhiên, chúng ta muốn *thông báo Slack vẫn được gửi*, dù cho việc kiểm thử có thất bại hay không (vì thông báo lỗi cũng là một kết quả cần thiết!).
*   `if: always()` đảm bảo rằng bước `Send Slack Notification Status` sẽ chạy kể cả khi bước `Execute Unit and Integration Tests` đã gặp lỗi.

### 4. Phân tích Lệnh `actions/github-script@v7`
Thay vì dùng cURL hay HTTP request thuần, tôi sử dụng [`actions/github-script`](https://github.com/actions/github-script) để viết một đoạn code JavaScript nhỏ gọn bên trong workflow. Điều này giúp chúng ta:

*   **Truy cập Biến Môi trường:** Dễ dàng truy cập các biến tích hợp của GitHub như `process.env['GITHUB_REPOSITORY']` (tên repo), và đặc biệt là trạng thái Job bằng cú pháp `${{ needs.test_and_report.job.status }}`.
*   **Logic Điều kiện:** Chúng ta viết một khối logic `if/else` để xác định màu sắc (`messageColor`) và tiêu đề (`title`) dựa trên trạng thái thực tế của pipeline (Success, Failure).

### 5. Cấu trúc Payload Slack
Tôi thiết kế payload theo cấu trúc `blocks` của Slack API thay vì chỉ dùng text đơn giản. Điều này cho phép chúng ta gửi các định dạng giàu thông tin như:

*   **Titles:** Sử dụng icon và màu sắc nổi bật để người nhận chú ý ngay lập tức.
*   **Fields:** Trình bày Status, Branch một cách có tổ chức (bằng hai cột).
*   **Action Buttons:** Cung cấp một nút bấm liên kết trực tiếp về log chi tiết trên GitHub Actions, giúp đội phát triển không cần mất thời gian tìm kiếm thủ công.

---

## ✨ V. Kết luận và Bước Nâng cao

Thiết lập CI Pipeline với thông báo Slack là bước đi bắt buộc đối với bất kỳ team nào nghiêm túc về chất lượng sản phẩm của mình. Nó biến một quy trình kiểm thử thụ động thành một hệ thống giám sát chủ động (Active Monitoring System).

**Thử thách tiếp theo cho các bạn:**

1.  **Quản lý nhiều môi trường:** Thay vì dùng webhook chung, hãy tạo một hàm (function) trong script để đọc từ các secrets khác nhau dựa trên nhánh hiện tại (`if branch == 'production'`).
2.  **Tích hợp Metrics:** Nếu bộ test của bạn xuất ra file JUnit XML hoặc Cobertura XML, bạn có thể tích hợp thêm bước đọc file này và gửi *số lượng tests* (ví dụ: "Chạy 120 bài Test - 1 lỗi") vào thông báo Slack để tăng tính minh bạch.

Nếu các bạn đã áp dụng quy trình này thành công, đừng quên chia sẻ kinh nghiệm của mình dưới phần bình luận nhé! Chúc chúng ta cùng nhau xây dựng những sản phẩm chất lượng nhất!

*Trân trọng,*
**Hồng Dung**
*QE Lead | DevOps Advocate*