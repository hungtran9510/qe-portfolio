---
title: "Kỹ thuật Exploratory Testing có cấu trúc bằng Session-Based Test Management"
date: 2026-04-07
description: "Nâng tầm QA của bạn: Khám phá cách kết hợp sức mạnh bộc phát của ET với sự kỷ luật khoa học của SBTM."
tags: ["Exploratory Testing","QA Strategy","Manual Testing"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hồng Dung"
---

# Kỹ thuật Exploratory Testing có cấu trúc bằng Session-Based Test Management

Chào các đồng nghiệp QA! Tôi là Hồng Dung, và trong suốt hành trình của chúng ta với Chất lượng Phần mềm (Software Quality), tôi nhận thấy một sự đối lập thú vị nhưng đầy sức mạnh: **Sự khám phá bộc phát** và **Tính cấu trúc có hệ thống**.

Nhiều người thường coi Testing chỉ là việc thực hiện các Test Case đã được định nghĩa trước. Điều đó đúng, nhưng nó sẽ không bao giờ đủ để bắt trọn mọi lỗi tiềm ẩn của một ứng dụng phức tạp trong thế giới thực. Đó chính là lúc chúng ta cần đến **Exploratory Testing (ET)**.

Tuy nhiên, ET nếu thiếu kiểm soát giống như việc đi vào rừng sâu mà không có bản đồ. Nó dễ trở nên hỗn loạn và khó báo cáo mức độ bao phủ (coverage). Bài viết hôm nay sẽ giúp bạn giải quyết vấn đề đó bằng một chiến lược đã được tôi áp dụng thành công: **Kết hợp Exploratory Testing với Session-Based Test Management (SBTM)**.

---

## 💡 Phần I: Hiểu rõ hai khái niệm cốt lõi

Để hiểu cách kết hợp chúng, trước hết chúng ta cần định nghĩa rõ từng yếu tố.

### 1. Exploratory Testing (ET) là gì?

ET không phải là một danh sách các bước kiểm thử, mà là **một kỹ thuật kiến thức (knowledge-based technique)**. Khi thực hiện ET, Tester được khuyến khích tự do khám phá ứng dụng bằng cách sử dụng kiến thức domain, kinh nghiệm người dùng và trực giác cá nhân để tìm ra các lỗi mà test case truyền thống bỏ sót.

*   **Sức mạnh:** Phát hiện các lỗi *nguồn gốc con người (human-origin defects)*; kiểm tra trải nghiệm người dùng thực tế.
*   **Điểm yếu khi không có cấu trúc:** Rủi ro Subjectivity cao, khó đo lường phạm vi, và khả năng trùng lặp nỗ lực.

### 2. Session-Based Test Management (SBTM) là gì?

SBTM là một phương pháp luận quản lý quy trình kiểm thử bằng cách **chia nhỏ thời gian và phạm vi test thành các phiên làm việc có ranh giới rõ ràng (timeboxed sessions)**, mỗi phiên đều đi kèm với một mục tiêu (Charter) cụ thể.

Mục đích của SBTM là biến sự khám phá tự do của ET trở nên *có định hướng*, chuyển từ "Tôi sẽ xem cái gì đó bị lỗi" thành "Trong 90 phút tới, tôi sẽ cố gắng làm sập tính năng A khi dữ liệu đầu vào là B."

## ✨ Phần II: Sức mạnh tổng hợp (The Synergy)

Khi kết hợp ET và SBTM, chúng ta có một hệ thống cực kỳ mạnh mẽ:

1.  **Minh bạch hóa phạm vi:** Thay vì kiểm thử "mọi thứ", bạn chỉ tập trung vào các rủi ro cao nhất (High-Risk Areas), được xác định qua Charter của phiên.
2.  **Tăng tính tái lập (Reproducibility):** Dù là khám phá, khi có cấu trúc và tiêu chí rõ ràng, đồng đội vẫn biết chính xác những gì đã được bao phủ trong một khoảng thời gian nhất định.
3.  **Cung cấp Bằng chứng Khoa học:** Bạn không chỉ báo cáo "Tôi nghĩ nó bị lỗi"; bạn báo cáo: "Trong phiên 2 giờ, với mục tiêu kiểm tra luồng giỏ hàng của người dùng Premium khi thanh toán bằng thẻ nước ngoài, chúng tôi đã phát hiện X lỗi Y."

## 🛠️ Phần III: Hướng dẫn thực hành cấu trúc SBTM cho ET (The How-To)

Để triển khai kỹ thuật này thành công, bạn cần tuân theo các giai đoạn chuẩn hóa sau. Đây là khung sườn mà mọi QE Lead nên áp dụng:

### Bước 1: Xác định Scope và Risk Charter (Mục tiêu phiên)

Trước khi bất kỳ ai chạm vào ứng dụng, đội nhóm phải họp để xác định **Charter** của session. Charter bao gồm:
*   **What:** Tính năng nào cần được kiểm tra? (Ví dụ: Quy trình đăng ký tài khoản mới).
*   **Why:** Rủi ro kinh doanh/người dùng nào đang cao nhất? (Ví dụ: Tỷ lệ thoát tại bước xác thực email rất cao).
*   **How:** Các giả thuyết thất bại (Failure Hypotheses) mà chúng ta muốn kiểm chứng.

### Bước 2: Lập kế hoạch phiên và Phân chia vai trò

Bạn cần một lịch trình cứng nhắc. Đặt giới hạn thời gian nghiêm ngặt (ví dụ: 60 - 120 phút). Trong đội nhóm, nên có sự phân chia vai trò rõ ràng:
*   **The Explorer:** Người thực hiện các hành vi khám phá theo Charter.
*   **The Recorder/Scribe:** Nhiệm vụ ghi lại *mọi thứ*: Các bước đã làm, kết quả (Pass/Fail), và đặc biệt là **Các Giả thuyết đã được kiểm chứng/bác bỏ**.

### Bước 3: Triển khai Phiên Test (Execution)

Trong phiên thực tế, hãy bám sát Charter. Khi một lỗi mới xuất hiện ngoài phạm vi dự kiến ban đầu, đó không phải là sự lạc lối; mà nó trở thành **một cơ hội khám phá thứ cấp**, được ghi nhận và thảo luận sau phiên.

### 📐 Ví dụ Minh Họa về Cấu trúc Báo cáo (Pseudo-code/Format)

Để thể hiện tính khoa học, việc ghi chép cần chi tiết hơn một Test Case truyền thống. Hãy sử dụng cấu trúc nhật ký (Log/Journal) cho mỗi phiên:

```json
{
  "session_id": "SBTM_20260407_01",
  "date": "2026-04-07",
  "duration_minutes": 90,
  "charter_focus": "Quản lý phiên (Admin Panel) - Chức năng Export Data.",
  "hypothesis": "Hệ thống sẽ không xử lý được việc export dữ liệu lớn hơn 10MB trên Chrome v120",
  "test_scenario_executed": [
    {"step": 1, "action": "Tạo bộ dữ liệu thử nghiệm (Mock data size: 15MB)", "expected_result": "Báo cáo tải thành công.", "actual_result": "Timeout sau 3 phút"},
    {"step": 2, "action": "Sử dụng trình duyệt Firefox và tăng giới hạn tài nguyên máy ảo", "expected_result": "Thành công", "actual_result": "PASS"}
  ],
  "finding": {
    "bug_id": "BUG-A456",
    "severity": "High",
    "description": "Lỗi Timeout khi export dữ liệu > 10MB trên Chrome. Cần xem xét việc tối ưu hóa luồng xử lý nền.",
    "risk_area_validated": true 
  },
  "coverage_status": {
    "hypothesis_covered": true,
    "new_areas_discovered": ["Kiểm tra quyền truy cập bộ lọc dữ liệu (Filter Permission)"],
    "follow_up_recommendation": "Cần một session tiếp theo tập trung vào việc kiểm thử các vai trò người dùng khác nhau."
  }
}
```

**Lời giải thích của Hồng Dung:** *Các bạn thấy đó, cấu trúc JSON này biến trải nghiệm chủ quan thành dữ liệu khách quan. Chúng ta không chỉ báo cáo lỗi mà còn báo cáo chính xác **Hypothesis nào đã được kiểm chứng**, và **Khoảng bao phủ (Coverage)** mà phiên làm việc này mang lại.*

## 🚀 Tổng kết: Khi nào sử dụng chiến lược này?

SBTM kết hợp với ET là công cụ vàng cho các tình huống sau:

1.  **Sau khi thực hiện vòng tích hợp lớn:** Để tìm ra những vấn đề bất ngờ (Unforeseen issues) trước khi bàn giao cho người dùng nội bộ (UAT).
2.  **Khi hệ thống có sự thay đổi kiến trúc cốt lõi:** Cần các nhóm kiểm thử tự do khám phá để xác định các điểm suy yếu mới.
3.  **Trước một bản phát hành quan trọng (Release Candidate):** Đảm bảo mức độ ổn định cao nhất trước mắt khách hàng cuối.

Đừng coi ET là hoạt động tùy hứng. Hãy biến nó thành **một quy trình được quản lý, có cấu trúc, và báo cáo được**. Đó mới là dấu hiệu của một đội ngũ QA trưởng thành và chuyên nghiệp!

Chúc các bạn luôn tìm thấy niềm vui trong việc khám phá những góc khuất chất lượng phần mềm!
***
*Hồng Dung - QE Lead.*