---
title: "Continuous Testing: Thiết lập GitHub Actions CI Pipeline gửi thông báo kết quả lên Slack"
date: 2026-06-04
description: "Hướng dẫn chuyên sâu thiết lập Continuous Testing bằng GitHub Actions, tự động chạy test và nhận báo cáo kết quả ngay tức thì trên Slack."
tags: ["CI-CD","GitHub Actions","Slack"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hồng Dung"
---

# Continuous Testing: Thiết lập GitHub Actions CI Pipeline gửi thông báo kết quả lên Slack

Chào các đồng nghiệp về Chất lượng! Tôi là Hồng Dung, và hôm nay chúng ta sẽ cùng nhau khám phá một chủ đề cực kỳ quan trọng trong vòng đời phát triển phần mềm hiện đại: **Continuous Testing** (Kiểm thử Liên tục).

Trong vai trò QE Lead, tôi hiểu rằng thách thức lớn nhất của chúng ta không phải là việc viết các bài test Case phức tạp, mà là làm thế nào để đảm bảo chất lượng được duy trì liên tục và phản hồi lại với tốc độ ánh sáng. Việc phải đợi một vòng build thủ công hay nhận báo cáo kiểm thử qua email đã lỗi thời rồi.

Bài viết này sẽ là cẩm nang chi tiết giúp bạn thiết lập một **GitHub Actions CI Pipeline** mạnh mẽ, không chỉ chạy các bài kiểm tra tự động (Unit, Integration) mà còn gửi *báo cáo kết quả* trực tiếp lên kênh Slack chung của nhóm ngay khi có sự cố xảy ra.

Hãy bắt đầu nào!

***

## 💡 I. Tổng quan: Tại sao Continuous Testing là tối quan trọng?

### Continuous Testing và CI/CD là gì?

Trước hết, chúng ta cần làm rõ thuật ngữ:

1.  **CI (Continuous Integration):** Đây là quy trình các lập trình viên thường xuyên tích hợp code của họ vào một kho lưu trữ chung. Mục tiêu là phát hiện càng sớm càng tốt khi có xung đột hoặc lỗi cú pháp ở cấp độ nhóm.
2.  **CD (Continuous Delivery/Deployment):** Là việc tự động hóa việc triển khai code đã được kiểm thử thành công đến các môi trường khác nhau (Staging, Production).
3.  **Continuous Testing:** Đây là lớp *chất lượng* được tích hợp vào CI/CD Pipeline. Nó đảm bảo rằng mọi thay đổi nhỏ nhất đều được chạy qua một bộ bài kiểm tra tự động hóa và nghiêm ngặt trước khi được xem xét cho việc triển khai.

### 🎯 Mục tiêu của chúng ta: Feedback Loop siêu tốc

Mục đích cuối cùng không chỉ là *chạy* các test case, mà là thu thập trạng thái (Pass/Fail) của toàn bộ quá trình kiểm thử và đưa thông báo **có thể hành động được (actionable)** về cho tất cả thành viên qua Slack.

**Flow hoạt động:**
`Developer Commit Code` $\rightarrow$ `GitHub Actions Trigger` $\rightarrow$ `Run Test Suite` $\rightarrow$ (Nếu Fail) $\rightarrow$ `Gửi Payload Lỗi/Kết quả lên Slack` $\rightarrow$ `Nhóm Nhận Biết & Khắc phục Ngay lập tức.`

***

## ⚙️ II. Các bước tiền đề cần chuẩn bị

Trước khi đi vào mã, chúng ta cần chuẩn bị môi trường:

1.  **GitHub Repository:** Code của bạn phải nằm trên GitHub và có một bộ test tự động (ví dụ: `npm run test`, `pytest`).
2.  **Slack Workspace:** Bạn cần quyền truy cập để tạo Webhook hoặc tích hợp Bot vào kênh Slack mà team dùng chung.
3.  **Credentials Secrets:** Đây là bước *quan trọng nhất về bảo mật*. Tuyệt đối không bao giờ hardcode Token hay URL vào file YAML. Chúng ta sẽ lưu chúng dưới dạng **GitHub Secrets**.

> 🚀 **[Lưu ý từ Hồng Dung]**: Bạn cần lấy Slack Incoming Webhook URL cho kênh mục tiêu và đặt nó làm Secret trong Repository Settings $\rightarrow$ `Secrets and Variables` $\rightarrow$ `Actions`. Tôi gọi Secret này là `SLACK_WEBHOOK_URL`.

***

## 💻 III. Xây dựng Pipeline GitHub Actions (The Implementation)

Chúng ta sẽ tạo một file workflow YAML tại đường dẫn: `.github/workflows/ci_testing.yml`.

Đây là nội dung chi tiết của file:

```yaml
# .github/workflows/ci_testing.yml
name: 🧪 Continuous Testing & Report
env:
  NODE_VERSION: '18' # Xác định phiên bản Node.js dùng cho môi trường test

on:
  push:
    branches: [ main, develop ] # Kích hoạt khi push lên nhánh main hoặc develop

jobs:
  build_and_test:
    runs-on: ubuntu-latest
    steps:
      # Bước 1: Checkout code repository
      - name: Checkout Code
        uses: actions/checkout@v4

      # Bước 2: Setup Node.js environment (Thay thế bằng setup python, java nếu cần)
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      # Bước 3: Install dependencies
      - name: Install Dependencies
        run: npm ci # Sử dụng 'npm ci' để đảm bảo cài đặt chính xác nhất theo lockfile

      # Bước 4: Run Automated Tests (Core Testing Step)
      - name: Execute Unit & Integration Tests
        id: test_job # Gán ID cho job này để sử dụng kết quả sau
        run: npm run test -- --ci --json > results.json || echo "Tests Failed" && exit 1

      # Bước 5 (Conditional): Gửi thông báo Slack chỉ khi Test Fails HOẶC Passes
      - name: Send Slack Notification Report
        uses: actions/github-script@v7 # Dùng action hỗ trợ script phức tạp hơn curl đơn giản
        if: always() # Đảm bảo bước này chạy ngay cả khi các bước trước thất bại (job fail)
        with:
          script: |
            // Lấy thông tin cơ bản của Commit và Branch
            const commitSHA = process.env.GITHUB_SHA;
            const branchName = process.env.GITHUB_REF_NAME;
            let statusMessage;

            // Logic kiểm tra trạng thái (Giả định test failed nếu job hiện tại thất bại)
            if (steps['Execute Unit & Integration Tests'].outcome === 'failure') {
              statusMessage = `:x: *[FAILED]* Testing Pipeline! 🚨\nKiểm thử trên branch \`${branchName}\` đã gặp lỗi. Vui lòng kiểm tra logs để biết chi tiết.\nSHA: \`${commitSHA}\``;
            } else {
              statusMessage = `:white_check_mark: *[SUCCESS]* ✅ Testing Pipeline Complete!\nCode \`${commitSHA}\` trên branch \`${branchName}\` đã vượt qua tất cả các bài kiểm thử tự động. Sẵn sàng cho việc review code!`;
            }

            // Xây dựng Payload JSON cho Slack Webhook
            const payload = JSON.stringify({
              text: statusMessage,
              attachments: [{
                color: steps['Execute Unit & Integration Tests'].outcome === 'failure' ? '#FF0000' : '#36A64F', // Màu đỏ nếu fail, xanh lá nếu pass
                fields: [
                    { title: "Repo", value: `${process.env.GITHUB_REPOSITORY}`, short: true },
                    { title: "Triggered by", value: `${process.env.GITHUB_ACTOR}@github.com`, short: false }
                ]
              }]
            });

            // Gửi request qua Webhook
            await github.request('POST', process.env.SLACK_WEBHOOK_URL, { payload: JSON.parse(payload) });
```

***

## 🔬 IV. Phân tích chi tiết từng bước của QE Lead (Hồng Dung’s Insights)

Tôi sẽ giải thích logic đằng sau các đoạn mã trên, vì việc hiểu *tại sao* chúng ta làm điều đó quan trọng hơn là chỉ biết *cách thức* làm nó.

### 1. Thiết lập và Trigger (`on: push`)
```yaml
on:
  push:
    branches: [ main, develop ]
```
**Giải thích:** Bằng cách định nghĩa `on: push`, chúng ta đảm bảo rằng pipeline chỉ chạy khi code được đẩy (push) lên các nhánh quan trọng. Điều này giúp tiết kiệm tài nguyên và loại bỏ thông báo giả khi có hoạt động khác trên repo.

### 2. Chạy Test (The Heart of the Pipeline)
```yaml
      - name: Execute Unit & Integration Tests
        id: test_job
        run: npm run test -- --ci --json > results.json || echo "Tests Failed" && exit 1
```
**Giải thích quan trọng:** Đây là bước *kiểm thử thực tế*.
*   `npm run test`: Gọi script test đã định nghĩa trong `package.json`.
*   `--ci --json`: Các flags này giả định rằng công cụ testing của bạn (ví dụ: Jest) hỗ trợ chế độ CI và xuất kết quả ra format JSON, giúp chúng ta phân tích sâu hơn sau này (như báo cáo Codecov).
*   `|| echo "Tests Failed" && exit 1`: Đây là cấu trúc kiểm soát lỗi *rất quan trọng*. Nếu lệnh `npm run test` thất bại (exit code khác 0), toàn bộ Job sẽ bị đánh dấu là **Failed**. Chúng ta phải đảm bảo điều này xảy ra để bước báo cáo có thể nhận biết được trạng thái fail.
*   `id: test_job`: Việc gán ID giúp chúng ta truy cập và đọc *trạng thái (outcome)* của job này trong các bước tiếp theo.

### 3. Báo cáo kết quả lên Slack (The Smart Notification)
```yaml
      - name: Send Slack Notification Report
        uses: actions/github-script@v7
        if: always() # CHÌA KHÓA QUAN TRỌNG NHẤT!
        with:
          script: |
            // ... logic kiểm tra status và gửi payload
```

*   **`if: always()`**: Đây là đoạn mã thần kỳ. Thông thường, nếu một Job bị lỗi ở bước 4 (Test Failed), các bước sau sẽ *bị hủy bỏ*. Tuy nhiên, bằng cách dùng `if: always()`, chúng ta buộc bước báo cáo này phải chạy **dù kết quả của bài test trước đó là Pass hay Fail**. Nếu không có dòng này, nhóm của bạn sẽ bị "im lặng" khi mọi thứ đổ bể!
*   **`actions/github-script@v7`**: Thay vì dùng `curl`, việc sử dụng script Action giúp chúng ta thực hiện *logic điều kiện* (ví dụ: kiểm tra nếu `outcome === 'failure'` thì message phải là gì) một cách gọn gàng và mạnh mẽ hơn.
*   **Logic Condition:** Chúng ta sử dụng cú pháp `${{ steps['...'].outcome }}` để truy cập trực tiếp vào trạng thái của Job Test. Nếu nó là `'failure'`, chúng ta biết cần gửi thông báo đỏ; nếu không, đó là thành công (màu xanh lá).

***

## 🏆 V. Tổng kết và Khuyến nghị của QE Lead

Thiết lập Pipeline này chỉ là bước khởi đầu. Để tối ưu hóa góc độ Chất lượng Đảm bảo, tôi xin đưa ra vài lời khuyên:

1.  **Tổ chức Báo cáo:** Đối với các dự án lớn, không nên để Slack Webhook nhận toàn bộ thông báo. Hãy thiết kế một kênh riêng (`#ci-alerts`) và sử dụng hệ thống lọc hoặc Bot quản lý để chỉ gửi những cảnh báo có mức độ nghiêm trọng (Severity) nhất định.
2.  **Phân loại Kết quả:** Nếu test của bạn rất lớn, hãy phân loại kết quả trong Slack:
    *   `[WARNING]` - Cảnh báo lỗi nhỏ (minor regression).
    *   `[ERROR]` - Lỗi Functionality nghiêm trọng cần sửa ngay.
    *   Sử dụng màu sắc và biểu tượng cảm xúc để giúp người nhận nắm bắt tình trạng chỉ qua việc nhìn lướt qua message.
3.  **Thêm Security Testing:** Hãy tích hợp các bước kiểm thử bảo mật cơ bản (SAST/DAST) vào pipeline này. Việc phát hiện lỗ hổng ngay từ commit luôn tốt hơn nhiều so với việc tìm thấy chúng trước khi triển khai.

Bằng cách tự động hóa Continuous Testing và thiết lập luồng phản hồi tức thì qua Slack, đội ngũ của bạn sẽ không còn phải đối mặt với tình trạng "mù thông tin" nữa. Chất lượng lúc này là một tính năng (Feature) hoạt động 24/7!

Hy vọng bài viết chuyên sâu này đã cung cấp cho các bạn cái nhìn rõ ràng và phương pháp thực hiện hoàn chỉnh. Chúc chúng ta cùng nhau xây dựng nên những sản phẩm chất lượng nhất!