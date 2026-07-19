---
title: "Continuous Testing: Thiết lập GitHub Actions CI Pipeline gửi thông báo kết quả lên Slack"
date: 2026-06-01
description: "Hướng dẫn chuyên sâu cách tích hợp Continuous Testing với GitHub Actions và nhận thông báo trạng thái test tự động qua Slack, giảm thiểu thời gian phản hồi sự cố."
tags: ["CI-CD","GitHub Actions","Slack"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hồng Dung"
---

# Continuous Testing: Thiết lập GitHub Actions CI Pipeline gửi thông báo kết quả lên Slack

Xin chào các đồng nghiệp QA và Dev, tôi là Hồng Dung.

Trong kỷ nguyên phát triển phần mềm hiện đại, tốc độ là yếu tố sống còn. Nhưng tốc độ không thể đi đôi với chất lượng nếu chúng ta chỉ kiểm thử thủ công (manual testing). Đó là lý do tại sao khái niệm **Continuous Testing** đã trở thành tiêu chuẩn vàng mà mọi đội ngũ QA chuyên nghiệp đều phải nắm vững.

Về bản chất, Continuous Testing là việc tự động hóa các vòng lặp kiểm thử và tích hợp chúng sâu vào quy trình CI/CD. Khi code được commit, không chỉ cần biên dịch (compile) hay chạy Unit Test; chúng ta phải đảm bảo rằng toàn bộ hành vi của hệ thống đều được xác minh ngay lập tức.

Bài viết này sẽ là một hướng dẫn thực tế, giúp bạn thiết lập một pipeline tự động bằng **GitHub Actions**, chạy các bài test phức tạp và quan trọng nhất: *tự động thông báo kết quả (thành công hay thất bại) lên kênh Slack chỉ trong vài phút*. Điều này không chỉ tiết kiệm thời gian mà còn là cơ chế cảnh báo sớm cực kỳ hiệu quả.

---

## 💡 I. Kiến thức nền tảng cần nắm vững

Trước khi đi vào mã lệnh, chúng ta hãy cùng thống nhất các thành phần:

1.  **GitHub Actions:** Công cụ tự động hóa CI/CD của GitHub. Nó cho phép chúng ta định nghĩa một chuỗi hành động (workflow) được kích hoạt bởi sự kiện (event) như `push` hoặc `pull_request`.
2.  **Continuous Testing:** Việc chạy bộ test toàn diện (Unit, Integration, E2E...) mỗi khi có thay đổi code.
3.  **Slack Webhook/API:** Là kênh giao tiếp của chúng ta. Thay vì phải theo dõi màn hình CI Dashboard, mọi người sẽ nhận được thông báo trực tiếp qua tin nhắn Slack quen thuộc.

### Các bước chuẩn bị (Prerequisites)

Bạn cần đảm bảo:

1.  Một Repository trên GitHub đã có bộ test tự động (ví dụ: sử dụng Jest cho JavaScript, Pytest cho Python).
2.  Một Workspace Slack hoạt động và một kênh (`#ci-alerts`) để nhận thông báo.
3.  **Quan trọng nhất:** Tạo một Slack Webhook URL hoặc Bot Token (tôi khuyến nghị dùng Secret Management của GitHub để chứa các token này).

---

## 🚀 II. Thiết lập Pipeline: Cấu trúc Workflow (.yaml)

Chúng ta sẽ tạo file `.github/workflows/ci_test.yml`. Đây là trái tim của quá trình CI.

Dưới đây là cấu trúc cơ bản, tôi đã thêm các comment giải thích chuyên sâu cho từng block code.

```yaml
name: Continuous Testing Pipeline

# Định nghĩa khi nào workflow này được kích hoạt
on: 
  push:
    branches: [ main ] # Chỉ chạy khi push lên nhánh 'main'
  pull_request:
    branches: [ main ] # Cũng chạy cho các PR gửi về nhánh 'main'

jobs:
  test_and_notify:
    runs-on: ubuntu-latest # Môi trường ảo Linux tiêu chuẩn của GitHub
    environment: Production # (Tùy chọn) Nếu cần gắn với môi trường cụ thể

    steps:
      # Step 1: Checkout code repository (Bắt buộc để có mã nguồn làm việc)
      - name: Checkout Code
        uses: actions/checkout@v4

      # Step 2: Thiết lập môi trường và cài đặt dependencies
      - name: Setup Node.js Environment # Ví dụ cho JavaScript/TypeScript
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      # Step 3: Cài đặt thư viện (Dependencies)
      - name: Install Dependencies
        run: npm ci # 'ci' đảm bảo việc cài đặt theo lock file, tăng tính nhất quán

      # Step 4: Chạy các bài test tự động hóa
      - name: Run Unit and Integration Tests
        run: npm run test:$GITHUB_COMMIT_REF # Giả định bạn có script 'test:' trong package.json

      # --- LOGIC BÁO CÁO (PHẦN QUAN TRỌNG NHẤT) ---
      # Bước này sẽ chạy sau khi các bước trên hoàn thành.
      - name: Check Test Status and Notify Slack
        id: slack_notifier # Gán ID để dùng trong bước tiếp theo
        if: always() # Dù test thành công hay thất bại, chúng ta vẫn muốn chạy bước thông báo

        run: |
          # Logic kiểm tra trạng thái exit code của các lệnh trước đó.
          # Trong môi trường CI/CD thực tế, bạn sẽ cần một script phức tạp hơn 
          # để parse file report (như JUnit XML).
          
          TEST_STATUS="SUCCESS"
          if [[ $? -ne 0 ]]; then
            echo "::error::Các bài kiểm thử đã thất bại!" >> $GITHUB_OUTPUT
            TEST_STATUS="FAILURE"
          fi

          # Xuất biến trạng thái để bước sau sử dụng (Best Practice)
          echo "test_status=$TEST_STATUS" >> $GITHUB_OUTPUT 
```

---

## ✨ III. Tích hợp Thông báo Slack (The Reporting Mechanism)

Sau khi chúng ta có thể biết được `TEST_STATUS` là gì (SUCCESS hay FAILURE), bước cuối cùng là gửi thông tin này lên Slack một cách chuyên nghiệp. Chúng ta sẽ sử dụng `curl` để tương tác với Slack Webhook API, vì nó đơn giản và dễ dàng tích hợp trong mọi pipeline.

### 1. Thiết lập Secrets trên GitHub

Vào **Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **GitHub Actions**. Thêm một Secret mới:
*   **Name:** `SLACK_WEBHOOK_URL`
*   **Value:** (Dán Webhook URL bạn nhận được từ Slack)

### 2. Hoàn thiện bước Notification trong Workflow

Chúng ta sẽ thay thế hoặc thêm vào cuối file `.github/workflows/ci_test.yml` bằng logic sau:

```yaml
      # ... (các bước test ở trên) ...

      - name: Check Test Status and Notify Slack
        id: slack_notifier
        if: always() # Luôn chạy dù thành công hay thất bại
        run: |
          echo "Starting status check..."
          
          # Lấy trạng thái đã tính toán từ bước trước (giả định rằng script trên hoạt động)
          TEST_STATUS=$(github.event.status || echo "N/A") 

          # Nếu test fail, nó sẽ tạo ra một error code exit-code != 0
          if [ $? -ne 0 ]; then
            TEST_STATUS="FAILURE"
            MESSAGE="#🔴 **FAILURE**🚨: Continuous Testing Failed!"
            COLOR="#FF5733" # Màu đỏ (Red) cho cảnh báo
          else
            TEST_STATUS="SUCCESS"
            MESSAGE="#🟢 **SUCCESS**✅: All Tests Passed!"
            COLOR="#33FF57" # Màu xanh lá cây (Green) khi thành công
          fi

          # Tải thông tin chi tiết về PR/Commit để đưa vào thông báo
          WORKFLOW_URL="${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
          COMMIT_MESSAGE="${{ github.event.head_commit.message }} (feat: ${{ github.ref_name }})"

          # -------------------------------------------------------
          # Bắt đầu gửi thông báo lên Slack qua cURL
          # Lưu ý: Chúng ta sử dụng JSON Payload format cho độ chuyên nghiệp cao nhất.
          # -------------------------------------------------------

          JSON_PAYLOAD=$(cat <<EOF
          {
            "text": "CI Pipeline Status Report",
            "attachments": [
              {
                "color": "$COLOR",
                "fields": [
                  {"title": "Trạng thái Test", "value": "$MESSAGE", "short": false},
                  {"title": "Triggered By", "value": "${{ github.actor }} (${{ github.event_name }})", "short": true},
                  {"title": "Commit/PR", "value": "$COMMIT_MESSAGE", "short": true}
                ],
                "actions": [
                    {"type": "button", "text": "Xem Chi tiết Log", "url": "$WORKFLOW_URL"}
                ]
              }
            ]
          }
EOF
)

          curl -X POST -H 'Content-type: application/json' \
               --data "${JSON_PAYLOAD}" \
               ${{ secrets.SLACK_WEBHOOK_URL }}

```

## 💡 IV. Giải thích chuyên sâu của Hồng Dung (The QE Insight)

### 1. Tại sao sử dụng `if: always()`?
Trong thiết kế CI/CD, chúng ta muốn các bước báo cáo phải chạy *bất kể* liệu những test ở bước trước đó có thành công hay thất bại. Nếu một bước nào đó bị lỗi (fail), luồng workflow sẽ dừng lại và không kịp gửi thông báo Slack. Bằng cách dùng `if: always()`, chúng ta đảm bảo rằng bước `$slack_notifier` luôn được thực thi, ngay cả khi bộ test đã sập vì lỗi.

### 2. Sử dụng JSON Payload cho Slack
Thay vì chỉ gửi một dòng chữ đơn giản, tôi khuyến nghị sử dụng cấu trúc **Slack Block Kit / Attachments**. Điều này cho phép bạn:
*   **Đánh dấu bằng màu sắc (Color):** Màu xanh lá cây là thành công, màu đỏ là thất bại. Điều này giúp người dùng chỉ cần nhìn vào kênh Slack cũng biết ngay tình trạng hệ thống mà không cần đọc hết nội dung.
*   **Thêm nút hành động (Actions/Button):** Việc gắn một button "Xem Chi tiết Log" trỏ trực tiếp tới GitHub Action Run ID là cực kỳ giá trị, vì nó rút ngắn tối đa thời gian *Triaging* sự cố của team Dev và QA.

### 3. Xử lý trạng thái (`$?` vs `github.outputs`)
Trong môi trường scripting Linux/Bash, biến `$?` chứa mã thoát (exit code) của lệnh gần nhất. Mã `0` nghĩa là thành công; bất kỳ giá trị nào khác `0` đều nghĩa là thất bại. Đây là cách chúng ta xác định trạng thái test. Tuy nhiên, trong các workflow phức tạp, việc sử dụng `echo "KEY=value" >> $GITHUB_OUTPUT` để lưu trữ *trạng thái logic* (như `TEST_STATUS`) sẽ linh hoạt và an toàn hơn rất nhiều cho các bước xử lý sau này.

---

## 📚 Kết luận & Lời khuyên của QE Lead

Việc thiết lập Continuous Testing không chỉ là việc viết code YAML; đó là việc xây dựng một **văn hóa feedback loop (vòng lặp phản hồi)** tốc độ cao trong toàn đội ngũ phát triển sản phẩm.

**Lời khuyên từ tôi:**

1.  **Không bao giờ tin tưởng vào thông báo Slack duy nhất:** Hãy sử dụng nó để *thông báo* sự cố, nhưng luôn đảm bảo rằng các công cụ quản lý Issue (JIRA, Trello) cũng được liên kết với pipeline này để tự động tạo Task lỗi ngay khi test fail.
2.  **Báo cáo chi tiết hơn:** Nếu bạn muốn chuyên nghiệp hơn nữa, hãy tích hợp việc parse các file báo cáo JUnit XML do các framework test tự tạo ra. Thay vì chỉ biết "FAILURES", bạn có thể báo: *"3/50 tests failed. Chi tiết lỗi ở API endpoint `/user/profile`."*
3.  **Test Environment:** Hãy xem xét các biến môi trường (`env`) trong GitHub Actions để đảm bảo rằng khi test, chúng ta đang kết nối đến Môi trường Staging (Staging environment) chứ không phải Production!

Chúc các bạn thành công trong việc xây dựng những pipeline CI/CD chất lượng và đáng tin cậy! Nếu có bất kỳ thắc mắc nào về best practices của QE, đừng ngần ngại trao đổi với tôi nhé.