---
title: "Continuous Testing: Thiết lập GitHub Actions CI Pipeline gửi thông báo kết quả lên Slack"
date: 2026-06-04
description: "Hướng dẫn chuyên sâu từ QE Lead Hồng Dung về cách thiết lập luồng kiểm thử liên tục (CT) hoàn toàn tự động trên GitHub Actions và nhận báo cáo real-time qua Slack."
tags: ["CI-CD","GitHub Actions","Slack","Continuous Testing"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hồng Dung"
---

# Continuous Testing: Thiết lập GitHub Actions CI Pipeline gửi thông báo kết quả lên Slack

Chào các đồng nghiệp trong lĩnh vực Phát triển Phần mềm và Đảm bảo Chất lượng, tôi là Hồng Dung. Trong vai trò QE Lead với nhiều năm kinh nghiệm thiết kế và tối ưu hóa quy trình kiểm thử tự động, tôi nhận thấy rằng chất lượng phần mềm không chỉ nằm ở việc *chạy* test suite mà còn nằm ở khả năng bạn *phản ứng* với kết quả của các bài test đó như thế nào.

Trong kỷ nguyên phát triển DevOps hiện đại, nếu quá trình CI/CD của chúng ta thiếu sự giám sát real-time và cơ chế báo cáo rõ ràng, thì hiệu suất đội ngũ sẽ bị giảm sút nghiêm trọng. Khi một merge request (MR) được đẩy lên mà các bài test kiểm tra tính toàn vẹn dữ liệu thất bại lúc 3 giờ sáng, việc chờ đợi ai đó thông báo thủ công là không thể chấp nhận được.

Bài viết này, tôi sẽ dẫn dắt bạn đi sâu vào cách thiết lập một quy trình **Continuous Testing** hoàn chỉnh: Tự động hóa quá trình chạy test trên GitHub Actions và quan trọng nhất, tự động gửi bản báo cáo chi tiết (thành công hay thất bại) trực tiếp lên kênh Slack mà đội nhóm của bạn đang theo dõi.

---

## ⚙️ I. Continuous Testing là gì? Tại sao nó lại QUAN TRỌNG?

Trước khi đi vào code, chúng ta cần định nghĩa lại vấn đề.

**Continuous Testing (CT)** không chỉ đơn thuần là việc chạy các test tự động thường xuyên. Nó là một *chiến lược* đảm bảo rằng chất lượng được kiểm tra liên tục qua mọi giai đoạn của vòng đời phát triển phần mềm.

Mục tiêu tối thượng của CT là đạt được **Feedback Loop Tối thiểu hóa độ trễ (Minimize Latency)**. Khi lập trình viên A commit code, đội QA cần biết kết quả test chỉ trong vài phút, chứ không phải chờ đến buổi họp tổng kết cuối ngày hôm sau.

### Lợi ích cốt lõi khi tích hợp Slack:

1. **Tính tức thời (Immediacy):** Thông báo ngay lập tức cho các bên liên quan (stakeholders) qua kênh giao tiếp hàng ngày (Slack).
2. **Khả năng truy vết (Traceability):** Mỗi lần build/test đều có ID và được gắn với Commit SHA cụ thể, giúp việc điều tra lỗi sau này dễ dàng hơn nhiều.
3. **Giảm gánh nặng nhận thức:** Team không cần phải chủ động theo dõi các tab CI Pipeline; thông tin quan trọng sẽ được đẩy đến nơi họ thường xuyên kiểm tra nhất: Slack.

## 🚀 II. Chuẩn bị và Thiết lập Hệ thống (Prerequisites)

Để xây dựng pipeline này, bạn cần chuẩn bị ba thành phần chính:

1. **Kho lưu trữ GitHub:** Nơi chứa code của bạn.
2. **Slack Workspace:** Kênh nhận thông báo.
3. **Tokens Bảo mật (Secrets):** Đây là nơi chúng ta lưu trữ các chuỗi bí mật để đảm bảo an toàn khi hệ thống tự động gửi tin nhắn.

### 🛠️ Các bước thiết lập Secret:

1. **Thiết lập Slack Webhook:** Truy cập vào kênh Slack của bạn và tạo một Incoming Webhook. Bạn sẽ nhận được một URL dài, đây chính là "khóa bí mật" để tích hợp.
2. **Lưu trữ trong GitHub Secrets:** Trong repository của bạn, đi tới `Settings` > `Security` > `Secrets`. Tạo một Secret mới tên là `SLACK_WEBHOOK_URL` và dán URL Webhook đã lấy được vào đó.

## 📝 III. Xây dựng GitHub Actions Workflow (The Code)

Bây giờ là phần quan trọng nhất: viết file cấu hình workflow của chúng ta tại `.github/workflows/continuous-test.yml`.

Chúng ta sẽ giả định rằng bạn đang sử dụng Node.js và framework testing như Jest hoặc Mocha.

```yaml
# .github/workflows/continuous-test.yml

name: Continuous Test Pipeline & Slack Report
on:
  push: # Kích hoạt khi có push code lên branch chính (ví dụ: main)
    branches:
      - main
  pull_request: # Hoặc kích hoạt khi mở Pull Request (khuyến nghị mạnh mẽ)
    types: [opened, synchronize]

jobs:
  run_and_report_tests:
    runs-on: ubuntu-latest
    environment: Production # Có thể thay bằng môi trường cụ thể hơn
    steps:
      # 1. Checkout Code
      - name: Checkout Repository
        uses: actions/checkout@v4

      # 2. Setup Environment (Ví dụ: Node.js)
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      # 3. Install Dependencies
      - name: Install dependencies
        run: npm ci # Dùng npm ci để đảm bảo cài đặt chính xác từ package-lock.json

      # 4. Run Tests (Bước cốt lõi)
      - name: Execute Test Suite
        id: test_execution # Gán ID để sử dụng trong các bước sau
        run: |
          echo "--- Bắt đầu chạy bộ kiểm thử tự động ---"
          npm run test -- --ci --json > test_results.json
          # Lưu ý quan trọng: Nếu script 'npm run test' thất bại (exit code != 0), 
          # toàn bộ job này sẽ dừng lại ngay lập tức, báo hiệu lỗi Red trên GitHub Actions.

      # 5. Phân tích và Thông báo kết quả lên Slack
      - name: Send Test Report to Slack
        uses: actions/github-script@v7
        if: always() # Luôn chạy bước này, dù test thành công hay thất bại
        with:
          script: |
            const { github } = require('@actions/github');
            const fs = require('fs');
            const resultsPath = 'test_results.json';

            // Kiểm tra xem file kết quả có tồn tại không
            if (!fs.existsSync(resultsPath)) {
              console.log("Không tìm thấy tệp test_results.json. Báo cáo chung.");
            } else {
                const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

                // Tính toán số liệu cơ bản
                const failures = Object.values(results).filter(suite => suite.failed > 0);
                const totalFailures = Object.values(results).reduce((sum, suite) => sum + suite.failed, 0);
                const statusColor = totalFailures === 0 ? "✅ :success:" : "❌ :failure:";
                
                // Xây dựng Payload Slack
                const payload = {
                    text: `🚨 *Báo cáo Kiểm thử Liên tục - ${github.repository}* \n` +
                           `${statusColor} Pipeline kết thúc!`,
                    attachments: [{
                        color: totalFailures === 0 ? "#36a642" : "#dc3545", // Màu xanh lá/đỏ của Slack
                        fields: [
                            { title: "Triggered By:", value: `${github.actor} (${github.event.head_ref})`, short: true },
                            { title: "PR Number:", value: `${github.event.pull_request.number}`, short: true },
                            { title: "Failures Found:", value: totalFailures > 0 ? `${totalFailures}` : `0/None`, short: true }
                        ],
                        footer: `:robot_face:`
                    }]
                };

                // Gửi tin nhắn qua Webhook Secret
                github.rest.request('outgoing webhook', {
                  data: payload,
                  headers: { 'Authorization': `Bearer ${process.env.SLACK_WEBHOOK_URL}` }
                });
            }
```

## 📚 IV. Phân tích chuyên sâu (Giải mã từng đoạn code)

Là một QE Lead, tôi không chỉ đưa ra code mà còn phải giải thích *tại sao* và *khi nào* bạn nên sử dụng các kỹ thuật này.

### 1. `on: pull_request` vs `on: push`

**Tại sao chọn Trigger?**
Tôi khuyến nghị dùng sự kiện `pull_request`. Khi một lập trình viên A tạo PR gửi về nhánh `main`, luồng CI sẽ chạy ngay để đảm bảo rằng code mới không phá vỡ những tính năng đã có (Regression Testing). Đây là lúc giá trị của CT được thể hiện rõ nhất.

### 2. Sử dụng `id:` và `if: always()`

*   **`id: test_execution`:** Chúng ta gán ID cho bước chạy test. Điều này cực kỳ hữu ích nếu sau này bạn muốn tham chiếu đến các file output hoặc log cụ thể từ bước đó.
*   **`uses: actions/github-script@v7`:** Đây là Action rất mạnh mẽ, nó cho phép chúng ta viết JavaScript (Node.js) ngay trong GitHub Actions để thao tác với môi trường và dữ liệu của hành động.
*   **`if: always()`:** Đây là điểm then chốt nhất! Bằng cách đặt `if: always()`, chúng ta buộc bước gửi báo cáo phải chạy **bất kể** các bước trước đó (Running Test Suite) có thành công hay thất bại. Nếu không có dòng này, khi test thất bại và job dừng lại, toàn bộ workflow sẽ ngừng ngay lập tức, khiến việc thông báo lỗi bị bỏ qua.

### 3. Xử lý trạng thái Thất bại (`Exit Code`)

Bạn đã thấy trong bước `Execute Test Suite` chưa?
```bash
npm run test -- --ci --json > test_results.json
# ... nếu script này thất bại, toàn bộ job sẽ fail.
```
Khi bạn chạy một lệnh shell (`run: | ...`), nếu chương trình bên dưới nó báo lỗi (thường là exit code 1), GitHub Actions sẽ tự động coi bước đó là **FAIL**. Đây là cơ chế kiểm soát chất lượng cơ bản và mạnh mẽ nhất, đảm bảo rằng nếu test thất bại, CI Pipeline sẽ bị dừng lại và không cho phép merge.

### 4. Xây dựng Payload Thông báo (Slack Webhook)

Thay vì gửi một dòng text đơn thuần, chúng ta xây dựng một JSON `payload` có cấu trúc:

*   **Màu sắc (Color):** Sử dụng màu nền trong Slack (`#36a642` cho thành công, `#dc3545` cho thất bại).
*   **Fields:** Tổ chức thông tin theo các trường (title/value) giúp báo cáo trực quan và dễ đọc hơn rất nhiều.
*   **Thẻ emojii:** Việc sử dụng emoji (`🚨`, `✅`, `❌`) là một kỹ thuật UX/UI nhỏ nhưng lại mang lại hiệu quả lớn trong môi trường giao tiếp tức thời như Slack, tăng khả năng nhận diện thông báo lỗi.

## ✨ V. Các Lời khuyên từ QE Lead Hồng Dung (Best Practices)

Để tối ưu hóa pipeline CI của bạn lên mức độ Enterprise:

1. **Tách Test Suite:** Đừng chạy mọi thứ trong một bước duy nhất. Hãy tách thành các Job riêng biệt: `Linting`, `Unit Tests`, `Integration Tests`, và cuối cùng là `E2E Tests`. Điều này giúp bạn biết chính xác *bước nào* đã gây ra lỗi, thay vì chỉ biết rằng "Test failed".
2. **Phân tích coverage:** Luôn tích hợp việc tính toán độ bao phủ test (Code Coverage) vào báo cáo Slack của bạn. Một PR có thể thành công nhưng nếu nó làm giảm đáng kể mức độ phủ sóng sẽ là một cảnh báo đỏ cần được chú ý!
3. **Thêm Approval Gate:** Đối với các nhánh quan trọng như `main`, hãy thiết lập yêu cầu phải có sự phê duyệt thủ công (Manual Approval) trên GitHub trước khi merge, ngay cả khi CI Pipeline đã thành công.

## Kết luận

Việc tự động hóa Continuous Testing và tích hợp báo cáo real-time qua Slack không chỉ là một tính năng kỹ thuật mà là việc xây dựng *văn hóa chất lượng* trong đội nhóm của bạn. Nó giúp mọi người chuyển từ tư duy "Kiểm thử khi gần ra mắt" sang "Kiểm thử ngay lập tức, liên tục".

Hy vọng những hướng dẫn này sẽ giúp hệ thống CI/CD của bạn trở nên mạnh mẽ, tin cậy và báo cáo chất lượng một cách minh bạch nhất! Chúc các bạn thành công trong hành trình xây dựng phần mềm xuất sắc!