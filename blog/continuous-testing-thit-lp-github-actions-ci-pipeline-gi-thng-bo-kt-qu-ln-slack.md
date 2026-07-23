---
title: "Continuous Testing: Thiết lập GitHub Actions CI Pipeline gửi thông báo kết quả lên Slack"
date: 2026-06-05
description: "Hướng dẫn chuyên sâu từ QE Lead Hồng Dung về việc tự động hóa kiểm thử và nhận báo cáo ngay lập tức trên Slack bằng GitHub Actions."
tags: ["CI-CD","GitHub Actions","Slack"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hồng Dung"
---

# Continuous Testing: Thiết lập GitHub Actions CI Pipeline gửi thông báo kết quả lên Slack

Xin chào các đồng nghiệp trong lĩnh vực Chất lượng Phần mềm! Tôi là Hồng Dung, và hôm nay chúng ta sẽ cùng nhau đi sâu vào một chủ đề cực kỳ quan trọng trong quy trình phát triển hiện đại: **Continuous Testing (Kiểm thử Liên tục)**.

Nếu bạn đã từng phải chờ đợi hàng giờ sau khi commit code chỉ để kiểm tra thủ công xem mọi thứ có hoạt động hay không, thì bài viết này dành cho bạn. Mục tiêu của chúng ta là thiết lập một pipeline tự động hoàn toàn bằng GitHub Actions – không chỉ chạy các bộ test mà còn gửi báo cáo kết quả (thành công hay thất bại) trực tiếp lên kênh Slack chung của team.

Sự phản hồi nhanh chóng (Fast Feedback Loop) chính là linh hồn của DevOps và Chất lượng Phần mềm hiện đại. Hãy cùng bắt đầu nhé!

***

## 🚀 Tổng quan về Kiến trúc Hệ thống (Architecture Overview)

Trong bài viết này, chúng ta sẽ kết nối ba thành phần chính:

1. **GitHub Repository:** Nơi lưu trữ mã nguồn và kích hoạt Pipeline (trigger).
2. **Testing Framework (Ví dụ):** Bộ công cụ chạy các Unit Test/Integration Test của dự án.
3. **Slack Webhook & GitHub Actions:** Cơ chế nhận biết trạng thái thành công/thất bại từ bước kiểm thử và gửi tin nhắn định dạng qua API.

Mục tiêu cuối cùng là: Khi một Pull Request được mở, mọi test sẽ tự chạy; nếu *bất kỳ* test nào fail, Slack phải nhận được thông báo đỏ ngay lập tức.

## 🛠️ Phần I: Chuẩn bị các Thiết lập Tiên quyết (Prerequisites)

Trước khi viết bất kỳ dòng code Actions nào, chúng ta cần chuẩn bị "chìa khóa" kết nối giữa GitHub và Slack.

### Bước 1: Tạo Slack Incoming Webhook

Chúng ta không nên hardcode thông tin kết nối vào repo. Thay vào đó, chúng ta sẽ dùng Webhooks để tạo một điểm nhận tin tức an toàn.

1. Truy cập **Slack API** hoặc qua kênh quản lý tích hợp của Slack.
2. Chọn tài khoản workspace và tạo một **Incoming Webhook**.
3. Bạn sẽ nhận được một URL dài dạng: `https://hooks.slack.com/services/T00xx/B00yy/zzzzzzz`.

🚨 **Lưu ý Cực Quan:** Đây là Secret Key của bạn. Tuyệt đối không commit nó trực tiếp vào mã nguồn.

### Bước 2: Lưu Webhook URL vào GitHub Secrets

1. Trong repository trên GitHub, đi tới `Settings` > `Secrets and variables` > `Actions`.
2. Click `New Repository Secret`.
3. **Name:** Đặt tên gợi nhớ, ví dụ: `SLACK_WEBHOOK_URL`.
4. **Value:** Dán URL Webhook vừa copy được ở Bước 1.

Bằng cách này, GitHub Actions sẽ có thể truy cập biến môi trường bí mật này một cách an toàn mà không ai ngoài hệ thống mới thấy được.

## 🧪 Phần II: Thiết lập Workflow CI/CD và Logic Kiểm Thử

Giờ là lúc chúng ta xây dựng file workflow tự động hóa trong thư mục `.github/workflows/`. Hãy tạo file `ci_test.yml` với nội dung sau.

### Code Example: `.github/workflows/ci_test.yml`

```yaml
name: 🧪 Continuous Testing Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    environment: production # Giúp theo dõi môi trường deploy (tùy chọn)
    steps:
      # 1. Checkout Code
      - name: Checkout code
        uses: actions/checkout@v4

      # 2. Thiết lập Environment (Java, Node, etc.)
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      # 3. Cài đặt Dependencies và Build dự án
      - name: Install dependencies
        run: npm install

      # 4. Chạy Test Suite (Bước quan trọng nhất)
      - name: Run Unit & Integration Tests
        id: tests # Đặt ID để truy cập trạng thái sau này
        run: |
          npm test -- --ci # Giả lập lệnh chạy bộ test
          echo "TEST_STATUS=SUCCESS" >> $GITHUB_OUTPUT

      # 5. Xử lý và Gửi thông báo Slack
      - name: Notify on Test Results
        if: always() && steps.tests.outcome == 'failure' || env.SLACK_WEBHOOK_URL
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
        run: |
          # Kiểm tra xem bước test có thất bại không
          if [[ "${{ steps.tests.outcome }}" == "failure" ]]; then
            MESSAGE="🔴 🚨 *CI/CD FAILED!* Hệ thống đã phát hiện lỗi trong quá trình kiểm thử tại Commit ${{ github.sha }}. Chi tiết: ${{ github.event.pull_request.head.ref }} -> ${{ github.event.pull_request.base.ref }}"
          else
            MESSAGE="🟢 *CI/CD SUCCESS!* Các bài kiểm thử đã hoàn tất thành công cho nhánh ${{ github.ref_name }}. Sẵn sàng để deploy!"
          fi
          
          # Gửi thông báo lên Slack
          curl -X POST -H 'Content-type: application/json' \
               --data "{\"text\":\"$MESSAGE\", \"username\":\"QE Lead Hồng Dung\", \"icon_emoji\":\":robot_face:\"}" \
               ${{ secrets.SLACK_WEBHOOK_URL }}

```

### 🔎 Phân tích và Giải thích Chi tiết của QE Lead Hồng Dung

Đây là phần tôi muốn nhấn mạnh nhất. Hiểu rõ *tại sao* chúng ta viết từng dòng code là cách để bạn trở thành một QE xuất sắc.

#### A. Về cấu trúc Trigger (`on:`):
```yaml
on:
  push: [ main ]
  pull_request: [ main ]
```
Chúng ta thiết lập việc chạy Pipeline không chỉ khi `push` lên nhánh `main`, mà còn cả khi có yêu cầu kéo (Pull Request). Việc kiểm tra trên PR là tối quan trọng để ngăn chặn code lỗi trước khi nó được merge.

#### B. Về Job và Test Step (`steps: [...]`):
```yaml
      - name: Run Unit & Integration Tests
        id: tests # <--- Quan trọng!
        run: |
          npm test -- --ci 
          echo "TEST_STATUS=SUCCESS" >> $GITHUB_OUTPUT
```
1. **Thiết lập `id: tests`:** Việc gán ID cho một bước (step) là mấu chốt của việc kiểm soát luồng. Nó cho phép chúng ta tham chiếu đến *kết quả* (outcome) của bước này ở các bước sau.
2. **Lệnh `$GITHUB_OUTPUT`:** Nếu test chạy thành công, dù hệ thống Actions mặc định đã báo success, tôi thêm dòng `echo "TEST_STATUS=SUCCESS" >> $GITHUB_OUTPUT`. Điều này giúp chúng ta có một biến trạng thái (status variable) dễ đọc và tin cậy hơn để sử dụng trong logic điều kiện sau này.

#### C. Về Logic Điều kiện và Gửi Thông báo (`if: always()`):
```yaml
      - name: Notify on Test Results
        if: always() && steps.tests.outcome == 'failure' || env.SLACK_WEBHOOK_URL
        # ... (body code)
```
Đây là phần thể hiện kinh nghiệm của một QE Lead:
* **`if: always()`**: Điều này đảm bảo bước `Notify on Test Results` sẽ *luôn luôn* chạy, bất kể các bước Build hay Test trước đó có thành công hay thất bại. Chúng ta cần phải gửi báo cáo dù mọi thứ có bị crash lúc nào đi nữa!
* **Tham chiếu Trạng thái:** Thay vì chỉ dựa vào lỗi cú pháp của YAML, chúng ta chủ động kiểm tra `$steps.tests.outcome`. Nếu bước `tests` trả về trạng thái `failure`, nghĩa là test đã thất bại.

#### D. Về Lệnh Cú pháp Gửi Slack (`curl -X POST ...`):
```bash
          MESSAGE="🔴 🚨 *CI/CD FAILED!* ... $IMAGE" # Biến hóa thông báo
          # ...
          curl -X POST -H 'Content-type: application/json' \
               --data "{\"text\":\"$MESSAGE\", \"username\":\"QE Lead Hồng Dung\"}" \
               ${{ secrets.SLACK_WEBHOOK_URL }}
```
1. **Biến hóa thông báo (Mensage Variable):** Chúng ta không chỉ gửi tin nhắn tĩnh. Tôi sử dụng các ngữ cảnh của GitHub Actions (`${{ github.sha }}`, `${{ github.event.pull_request.head.ref }}`) để chèn trực tiếp ID commit hoặc tên nhánh vào nội dung thông báo. Điều này giúp người nhận biết chính xác *phần nào* code đã gây ra lỗi, tăng tính khả thi (actionable) của thông báo lên rất nhiều.
2. **Webhook Call:** Chúng ta sử dụng `curl` với các header JSON chuẩn để gửi payload đến Webhook URL bí mật.

## 🥇 Tóm kết và Bài học Thực tiễn (Conclusion & Best Practices)

Thiết lập Pipeline kiểm thử liên tục là một bước tiến lớn trong việc nâng cao chất lượng sản phẩm. Với cấu hình trên, mỗi lần commit lên nhánh `main`, team của bạn sẽ tự động nhận được "báo cáo trạng thái sức khỏe" (health check report) từ hệ thống CI/CD ngay trong kênh Slack mà không cần phải mở GitHub hay bất kỳ công cụ nào khác.

**Lời khuyên của Hồng Dung:**
1. **Test Data Management:** Khi môi trường test trở nên phức tạp, hãy xem xét việc tách biệt dữ liệu kiểm thử (test data) khỏi pipeline để đảm bảo tính nhất quán và bảo mật.
2. **Phân tầng Thông báo:** Đối với các dự án lớn, đừng chỉ gửi một tin nhắn chung chung. Hãy sử dụng khả năng của Slack API để phân loại thông báo: `ALERT: Critical Failure`, `WARNING: Performance Degradation`, v.v...
3. **Mở rộng Tooling:** Nếu bạn cần nhận diện lỗi chi tiết (như dòng code nào fail), hãy tích hợp thêm các actions chuyên biệt như Codecov hoặc SonarCloud vào bước Test, và cấu trúc thông báo Slack để trích xuất báo cáo từ các công cụ đó.

Chúc các bạn áp dụng thành công kỹ thuật này và xây dựng nên những sản phẩm chất lượng tuyệt vời! Đừng quên chia sẻ kinh nghiệm của mình dưới phần bình luận nhé!