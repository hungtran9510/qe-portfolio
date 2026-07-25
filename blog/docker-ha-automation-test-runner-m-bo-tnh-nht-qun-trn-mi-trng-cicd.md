---
title: "Docker hóa Automation Test Runner để đảm bảo tính nhất quán trên môi trường CI/CD"
date: 2026-05-26
description: "Giải pháp chuyên sâu từ QE Lead về việc đóng gói bộ công cụ kiểm thử bằng Docker, loại bỏ các lỗi 'It works on my machine'."
tags: ["Docker","DevOps","Automation","QE"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Khánh Đỗ"
---

# Docker hóa Automation Test Runner để đảm bảo tính nhất quán trên môi trường CI/CD

Chào các đồng nghiệp, tôi là Khánh Đỗ. Trong vai trò của một QE Lead (Trưởng nhóm Kỹ thuật Chất lượng), chúng ta đã trải qua quá nhiều lần nghe câu nói kinh điển: *"Tại máy tôi thì chạy bình thường mà!"* 😅

Đây không chỉ là chuyện về sự khác biệt giữa môi trường phát triển cục bộ và môi trường Staging. Vấn đề lớn hơn, nó đe dọa trực tiếp đến khả năng tin cậy của toàn bộ pipeline kiểm thử (Test Pipeline) trong CI/CD. Khi các bài test bắt đầu thất bại một cách ngẫu nhiên – hay còn gọi là *Flaky Tests* – chúng ta sẽ mất đi niềm tin vào hệ thống tự động hóa của mình.

Vậy, làm thế nào để chúng ta có thể đảm bảo rằng bộ công cụ kiểm thử (Test Runner) chạy trong pipeline CI/CD luôn hoạt động với cùng một cấu hình tài nguyên và dependency như khi tôi chạy nó trên máy local?

Câu trả lời nằm ở Containerization, cụ thể là sử dụng **Docker**. Bài viết này sẽ cung cấp cái nhìn chuyên sâu và thực tế nhất về cách chúng ta Docker hóa Test Runner của mình.

***

## 💡 I. Vấn đề cốt lõi: Sự không nhất quán (Inconsistency)

Trước khi đi vào giải pháp, chúng ta cần hiểu rõ vấn đề mà Docker đang giải quyết.

Khi bạn chạy bộ test automation truyền thống trên CI/CD server (ví dụ: Jenkins agent), môi trường này thường là một hệ điều hành Linux cơ sở có sẵn nhiều dependency của hệ thống (System Dependencies) và các thư viện runtime khác nhau.

1. **Dependency Conflicts:** Test Runner của chúng ta yêu cầu Python 3.9, nhưng Agent lại được cấu hình mặc định với Python 3.7. Hoặc test cần một phiên bản Chrome cụ thể mà OS base image không có.
2. **OS/Library Drift:** Sự khác biệt nhỏ về version kernel, thư viện OpenSSL, hoặc các gói `apt-get` khiến việc cài đặt môi trường phụ thuộc bị lỗi hoặc mất tính tái lập (Non-reproducible).

Chúng ta cần một "hộp" khép kín, nơi mọi thứ – từ hệ điều hành tối thiểu đến phiên bản ngôn ngữ và tất cả thư viện test – đều được đóng gói cùng nhau. Đó chính là Container.

## 🐳 II. Phương pháp tiếp cận: Docker Test Runner Image

Thay vì để pipeline CI/CD chịu trách nhiệm chuẩn bị môi trường cho việc chạy test, chúng ta sẽ ép nó phải sử dụng một **Docker Image** cụ thể mà chúng ta đã kiểm soát hoàn toàn.

Quy trình chung là:
1. Xác định *tất cả* các dependency (Python, Java SDK, Node modules, Selenium/WebDriver binary, v.v.).
2. Xây dựng một `Dockerfile` chứa tất cả những thứ này.
3. Push Image lên Container Registry (Docker Hub/AWS ECR).
4. Cấu hình Job CI/CD chỉ cần chạy lệnh: `docker run [image-name] /bin/run_tests.sh`.

## 🛠️ III. Chi tiết kỹ thuật và Mã nguồn ví dụ

Giả sử chúng ta đang xây dựng một Test Runner bằng Python, sử dụng Selenium WebDriver và có các dependency hệ thống như Chrome Browser. Đây là một ví dụ thực tế về cách viết `Dockerfile` của Khánh Đỗ:

### 1. Cấu trúc dự án mẫu

```
/test-runner-repo
├── Dockerfile              # File quy định môi trường container
├── requirements.txt        # Danh sách thư viện Python cần thiết
└── tests/
    └── test_login.py       # Các bài kiểm thử thực tế
```

### 2. Nội dung `requirements.txt`

Đây là nơi liệt kê các thư viện *Python* (Runtime Dependencies):
```text
selenium==4.10.0
pytest==7.4.3
webdriver-manager # Giúp quản lý driver dễ dàng hơn
```

### 3. File `Dockerfile` (Giải thích chi tiết)

Đây là trái tim của quá trình này. Chúng ta sẽ sử dụng một image base nào đó, và thêm vào các bước cài đặt phụ thuộc hệ thống (OS dependencies).

```dockerfile
# Bước 1: Chọn Base Image
# Sử dụng Ubuntu LTS để đảm bảo tính ổn định và hỗ trợ các công cụ phổ biến.
FROM python:3.10-slim-buster

# Thiết lập biến môi trường làm việc
WORKDIR /app

# Cài đặt các dependencies hệ thống (OS Dependencies)
# Selenium yêu cầu trình duyệt và các thư viện liên quan (ví dụ: libnss3, Xorg).
RUN apt-get update && \
    apt-get install -y chromium-browser xvfb python3-venv virtualenv

# Lưu ý: Luôn dọn dẹp bộ đệm sau khi cài đặt để giảm kích thước image.
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Sao chép các file requirements và tạo môi trường ảo Python (Virtual Environment)
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install virtualenv && \
    virtualenv venv 
    
# Kích hoạt venv và cài đặt các thư viện test
ENV PATH="/app/venv/bin:$PATH"
RUN ./venv/bin/pip install -r requirements.txt

# Sao chép toàn bộ mã nguồn test
COPY tests /app/tests

# Thiết lập lệnh mặc định khi container khởi động
CMD ["pytest", "tests/"] 
```

**Phân tích chuyên sâu (Khánh Đỗ's Notes):**

*   `FROM python:3.10-slim-buster`: Chúng ta không dùng image `latest` vì nó không ổn định. Luôn chỉ định phiên bản cụ thể (`3.10`) và bản phân phối rõ ràng (`buster`) để đảm bảo tính tái lập tuyệt đối.
*   `apt-get install ... chromium-browser xvfb`: Đây là bước quan trọng nhất về mặt *thực tế*. Nếu không có `xvfb` (X Virtual Frame Buffer) hoặc các thư viện tương tự, Selenium sẽ thất bại vì nó cần một môi trường đồ họa ảo để chạy Chrome trong container. Chúng ta phải chủ động khai báo dependency này.
*   `WORKDIR /app`: Định nghĩa tất cả file sau này sẽ được xử lý tại thư mục này, giúp quản lý đường dẫn nhất quán.
*   `ENV PATH="..."`: Bằng cách thay đổi biến `PATH`, chúng ta đảm bảo rằng khi chạy bất kỳ lệnh nào (ví dụ: `selenium-webdriver`), hệ thống tìm kiếm phiên bản từ môi trường ảo (`venv`) đã được cô lập và cài đặt chính xác.

## 🚀 IV. Tích hợp vào Pipeline CI/CD (Jenkins/GitLab)

Khi container image đã được build thành công và push lên registry, việc tích hợp nó vào Jenkins hoặc GitLab Runner trở nên vô cùng đơn giản và đáng tin cậy.

Thay vì chạy các bước cài đặt dependency thủ công trong script pipeline:
❌ **Cũ:** `pip install -r requirements.txt` $\rightarrow$ `apt-get update` $\rightarrow$ ... (Dễ bị lỗi)

Chúng ta chỉ cần một lệnh duy nhất, mạnh mẽ và độc lập:
✅ **Mới:** `docker run --rm my-test-runner:v1.2.0 pytest /app/tests/`

Lệnh này mang lại 3 lợi ích vàng:
1. **Cô lập tuyệt đối (Isolation):** Mọi thứ xảy ra bên trong container, không ảnh hưởng đến môi trường CI/CD Host.
2. **Nhất quán (Consistency):** Bất kể Node nào chạy Job, nó đều sử dụng chính xác Test Runner Image đã được build và kiểm thử trước đó.
3. **Khả năng truy vết (Traceability):** Phiên bản của Test Runner (`v1.2.0`) được gắn trực tiếp với mã nguồn tại thời điểm build container.

## 💡 V. Tóm kết và Lời khuyên từ Khánh Đỗ (QE Lead)

Docker hóa test runner không chỉ là một mẹo kỹ thuật, nó là một *yêu cầu kiến trúc chất lượng* (Architectural Quality Requirement). Nó chuyển trách nhiệm về việc quản lý môi trường phức tạp từ hệ thống CI/CD sang một Artifact (Image) được đóng gói và kiểm soát nghiêm ngặt.

**Ba lời khuyên cuối cùng của tôi dành cho các đồng nghiệp:**

1. **Caching Lớp Dockerfile:** Hãy sử dụng tối đa tính năng caching của Docker Build. Việc cài đặt OS dependencies (`apt-get install`) là bước tốn thời gian nhất. Chúng ta phải đảm bảo rằng nếu chỉ thay đổi mã test, chúng ta không cần build lại toàn bộ Image để re-install các dependency nặng nề đó.
2. **Multi-Stage Builds:** Đối với các ứng dụng lớn, hãy xem xét Multi-Stage Builds. Sử dụng một stage nhẹ nhàng nhất cho việc *build* và một stage khác chỉ chứa những gì tối thiểu cần thiết để *chạy test*. Điều này giúp giảm kích thước cuối cùng của Image (Image Size) đáng kể.
3. **Kiểm thử Container:** Đừng bao giờ quên kiểm tra khả năng chạy container ở các môi trường khác nhau (Local Machine, CI Runner, Edge Worker).

Việc áp dụng Docker cho Test Runner không chỉ giải quyết vấn đề lỗi ngẫu nhiên, mà nó còn nâng tầm toàn bộ hệ thống QA của bạn lên một cấp độ chuyên nghiệp và đáng tin cậy hơn rất nhiều.

Chúc các đồng nghiệp luôn xây dựng được những pipeline tự động hóa mạnh mẽ!

**Khánh Đỗ**
*QE Lead | Expert in Reliability & CI/CD Automation*