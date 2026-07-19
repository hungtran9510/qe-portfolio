---
title: "Continuous Testing: Thiết lập GitHub Actions CI Pipeline gửi thông báo kết quả lên Slack"
date: 2026-06-01
description: "Học cách tự động hóa việc kiểm thử liên tục (Continuous Testing) bằng cách tích hợp GitHub Actions với Slack, đảm bảo đội ngũ nhận được cảnh báo tức thì khi có lỗi."
tags: ["CI-CD","GitHub Actions","Slack"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hồng Dung"
---

# Continuous Testing: Thiết lập GitHub Actions CI Pipeline gửi thông báo kết quả lên Slack

Chào các đồng nghiệp và những người yêu thích tự động hóa! Tôi là Hồng Dung, chuyên gia Kỹ thuật Đảm bảo Chất lượng (QE Lead).

Trong kỷ nguyên phát triển phần mềm tốc độ cao ngày nay, việc kiểm thử không còn là một hoạt động độc lập được thực hiện ở cuối quy trình. Nó phải trở thành một dòng chảy liên tục và không thể tách rời—đó chính là **Continuous Testing (Kiểm thử Liên tục)**. Mục tiêu cốt lõi của CT là đảm bảo rằng mọi thay đổi mã nguồn đều được kiểm tra ngay lập tức, giảm thiểu rủi ro lỗi lây lan đến môi trường Staging hay Production.

Tuy nhiên, việc xây dựng một CI/CD Pipeline phức tạp chỉ dừng lại ở chạy test suite chưa đủ. Làm thế nào để chúng ta biết khi nào pipeline thành công và quan trọng hơn, *làm sao để đội ngũ nhận được thông báo rõ ràng ngay lập tức*?

Bài viết hôm nay của tôi sẽ dẫn bạn qua quá trình thiết lập một CI Pipeline hoàn chỉnh bằng GitHub Actions, không chỉ chạy các bài test tự động mà còn gửi kết quả chi tiết (thành công hay thất bại) lên Slack một cách tài tình. Đây là kỹ thuật cực kỳ hữu ích và mang tính ứng dụng cao trong môi trường làm việc chuyên nghiệp!

***

## 💡 Khái niệm nền tảng: Tại sao phải tích hợp như vậy?

Trước khi đi vào code, chúng ta cần hiểu rõ ba khái niệm chính:

1.  **CI Pipeline (Continuous Integration):** Là quá trình tự động hóa việc xây dựng và kiểm thử mã nguồn mỗi khi có thay đổi (commit).
2.  **GitHub Actions:** Là công cụ tích hợp CI/CD được cung cấp sẵn trên GitHub, cho phép chúng ta định nghĩa các "Workflow" (quy trình làm việc) để thực thi các bước đã lập trình (ví dụ: `checkout`, `npm install`, `run-tests`).
3.  **Webhook & Slack:** Webhook là một cơ chế mà qua đó, một ứng dụng web (ở đây là GitHub Actions) có thể gửi dữ liệu tới một endpoint URL khác (Slack). Bằng cách này, chúng ta biến GitHub thành "nguồn phát" thông báo cho kênh giao tiếp chung của đội nhóm.

Mục tiêu của chúng ta là: Khi bất kỳ ai đẩy code lên nhánh `main` hoặc mở Pull Request, Actions sẽ chạy test $\rightarrow$ Nếu Test Fail $\rightarrow$ Gửi thông báo Cảnh Báo Lỗi tới Slack; nếu thành công $\rightarrow$ Gửi thông báo Hoàn Thành.

## 🛠️ Phần Chuẩn bị (Prerequisites)

Bạn cần đảm bảo những thứ sau trước khi bắt tay vào viết code:

1.  **Repository:** Một kho mã nguồn trên GitHub.
2.  **Slack Workspace & Webhook:** Bạn phải tạo một **Incoming Webhook** trong kênh Slack mong muốn. Đây là đường link API mà chúng ta sẽ sử dụng để gửi thông báo. *Hãy coi đây như mật khẩu rất quan trọng, không bao giờ chia sẻ công khai.*
3.  **Token Bí Mật (GitHub Secrets):** Tuyệt đối KHÔNG đưa trực tiếp Webhook URL vào file `.yml`. Hãy lưu nó dưới dạng Secret trong cài đặt GitHub Repository của bạn (Ví dụ: `SLACK_WEBHOOK_URL`).

## 💻 Hướng dẫn Chi tiết Triển khai Workflow

Chúng ta sẽ tạo một file workflow YAML tại thư mục `.github/workflows/slack-ci.yml`.

### Bước 1: Định nghĩa Workflow và các Dependencies

```yaml
name: Continuous Test & Slack Notification

on:
  push:
    branches: [ main ]
  pull_request:
    types: [ opened, synchronize ]

jobs:
  build-and-test:
    # Chỉ chạy job này trên các nhánh được bảo vệ (ví dụ: main) hoặc PR
    runs-on: ubuntu-latest
    environment: production # Tùy chọn môi trường nếu bạn cần xác thực nâng cao

    steps:
    # 1. Checkout code từ repo
    - name: Checkout repository
      uses: actions/checkout@v4

    # 2. Thiết lập môi trường Node.js (ví dụ cho JavaScript/TypeScript)
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'

    # 3. Cài đặt dependencies và chạy test
    - name: Install Dependencies
      run: npm ci
    
    # *********** ĐIỂM QUAN TRỌNG NHẤT: CHẠY TEST VÀ THU THẬP KẾT QUẢ ***********
    - name: Run Automated Tests
      id: testing
      continue-on-error: true # Quan trọng: Cho phép bước này thất bại nhưng vẫn chạy các bước tiếp theo để báo cáo trạng thái.
      run: npm test -- --json > test_results.json || echo "TEST_FAILURE=true" >> $GITHUB_OUTPUT

    # 4. Phân tích và Thông báo kết quả lên Slack
    - name: Send Slack Notification
      if: always() # Luôn chạy bước này, bất kể các bước trước đó thành công hay thất bại
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
      run: |
        # Logic kiểm tra trạng thái và gửi thông báo
        if [ "${{ github.event_name }}" == "pull_request" ]; then
            MESSAGE="#PR Review 📚\nLệnh phát hành PR: ${GITHUB_SHA}\nNgười thực hiện: ${{ github.actor }}\nKết quả test đã được chạy."
            # ... (Sử dụng logic kiểm tra kết quả CI)

        fi
        
        # Giả lập gọi script gửi thông báo cuối cùng
        echo "DEBUG: Testing complete. Checking final status..."
        # Trong thực tế, bạn sẽ viết một script Python/NodeJS ở đây để đọc file test_results.json và định dạng message chi tiết hơn.

        if [ "$TEST_FAILURE" = true ]; then
            curl -X POST -H 'Content-type: application/json' --data '{
                "text": ":x: *⚠️ CI FAILURE* ⚠️: Test thất bại! Yêu cầu kiểm tra gấp!\nRepo: ${{ github.repository }}\nHành động bởi: ${{ github.actor }}. Vui lòng xem log GitHub Actions chi tiết."
            }' $SLACK_WEBHOOK_URL
        elif [ "${{ job.status }}" == "success" ]; then
             curl -X POST -H 'Content-type: application/json' --data '{
                "text": ":white_check_mark: *✅ CI SUCCESS* ✅: Pipeline hoàn tất thành công!\nRepo: ${{ github.repository }}\nHành động bởi: ${{ github.actor }}. Mọi thứ đều ổn!"
            }' $SLACK_WEBHOOK_URL
        fi
```

### Giải thích Chuyên sâu của Hồng Dung (QE Lead Commentary)

Các bạn thấy đó, phần khó nhất không phải là viết YAML mà là **xây dựng logic điều kiện** trong môi trường CI/CD. Đây là những điểm mấu chốt mà các nhà quản lý chất lượng cần nắm vững:

#### 1. `continue-on-error: true` (Quan trọng tuyệt đối)
Khi chúng ta chạy test tự động, nếu bước này thất bại (ví dụ, có lỗi kiểm thử), toàn bộ job sẽ dừng lại và không thể thực thi đến bước gửi thông báo lên Slack. Bằng cách đặt `continue-on-error: true`, chúng ta *cố tình cho phép* bước Test Fail, nhưng vẫn đảm bảo luồng chương trình phải tiếp tục chạy xuống các bước sau đó (như Send Notification). Điều này rất quan trọng để báo cáo trạng thái cuối cùng một cách đầy đủ.

#### 2. `if: always()`
Đây là bộ điều kiện vàng trong GitHub Actions. Thay vì sử dụng `if: success()`, nếu chúng ta chỉ dùng `success()`, bước gửi thông báo sẽ không chạy khi test thất bại. Việc đặt `if: always()` đảm bảo rằng mã nguồn bên trong khối `run:` **sẽ luôn được thực thi**, cho phép chúng ta tự kiểm tra biến trạng thái (như `$TEST_FAILURE` hoặc `github.job.status`) để đưa ra quyết định thông báo chính xác.

#### 3. Sử dụng Shell Script Logic (`if [ ... ]`)
Vì GitHub Actions chạy các lệnh shell (shell script), chúng ta phải sử dụng cấu trúc điều kiện của Bash (Bash scripting) bên trong bước cuối cùng:
*   `TEST_FAILURE=true`: Chúng ta tạo một biến môi trường *thủ công* nếu test thất bại và truyền nó qua `$GITHUB_OUTPUT`. Điều này giúp các bước sau có thể tham chiếu đến trạng thái kiểm thử.
*   `if [ "$TEST_FAILURE" = true ]; then ...`: Đây là cách chúng ta thực thi hành động (gọi `curl`) chỉ khi điều kiện nào đó đúng.

#### 4. Về việc Gửi Thông báo (The Payload)
Tôi đã sử dụng lệnh `curl` với payload JSON để gửi thông báo tới Slack.
```json
{
    "text": ":white_check_mark: *✅ CI SUCCESS* ✅: Pipeline hoàn tất thành công!"
}
```
Sử dụng cú pháp định dạng Markdown của Slack (như `*in nghiêng*`, `:emoji:`) giúp thông báo của chúng ta không chỉ là một đoạn văn bản nhàm chán, mà là một **cảnh báo trực quan** thu hút sự chú ý ngay lập tức từ đội phát triển.

## 🚀 Tóm tắt và Bài học Kinh nghiệm (Key Takeaways)

Continuous Testing và tự động hóa CI/CD không chỉ là về việc chạy test; nó là về việc xây dựng một hệ thống **minh bạch, đáng tin cậy** và **tức thời**.

1.  **Đừng bao giờ Hardcode Secrets:** Luôn sử dụng GitHub Secrets để quản lý các token API (Slack Webhook, AWS keys, v.v.).
2.  **Kiểm soát Luồng Lỗi:** Sử dụng `continue-on-error: true` kết hợp với logic `if: always()` là kỹ thuật giúp bạn xử lý trạng thái CI/CD một cách tinh vi nhất, đảm bảo rằng ngay cả khi có lỗi, hệ thống vẫn thực hiện bước báo cáo cuối cùng.
3.  **Tính Trải nghiệm Người dùng (UX) của Thông Báo:** Một thông báo Slack cần phải *hành động* (actionable). Thay vì chỉ nói "Có lỗi", hãy nói rõ: "**Lỗi kiểm thử đã xảy ra trên nhánh `develop` do PR từ user X. Vui lòng review ngay!**"

Hy vọng hướng dẫn chi tiết này giúp các bạn tự tin thiết lập một pipeline CI/CD không chỉ mạnh mẽ về mặt kỹ thuật, mà còn thông minh về mặt giao tiếp đội nhóm. Nếu có thắc mắc nào trong quá trình triển khai, đừng ngần ngại trao đổi với tôi nhé!

Chúc các bạn xây dựng nên những hệ thống phần mềm chất lượng cao nhất!

**Hồng Dung - QE Lead.**