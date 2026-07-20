---
title: "Kỹ thuật Exploratory Testing có cấu trúc bằng Session-Based Test Management"
date: 2026-03-30
description: "Khám phá cách kết hợp sức mạnh tìm lỗi bí mật của ETT với cấu trúc khoa học của SBTM để nâng cao chất lượng kiểm thử."
tags: ["Exploratory Testing","QA Strategy","Manual Testing"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hồng Dung"
---

# Kỹ thuật Exploratory Testing có cấu trúc bằng Session-Based Test Management

Chào các đồng nghiệp QA và những người yêu thích chất lượng phần mềm! Tôi là Hồng Dung, và trong suốt nhiều năm làm việc với lĩnh vực Đảm bảo Chất lượng (QA), tôi nhận thấy rằng thế giới kiểm thử luôn thay đổi. Các ứng dụng ngày càng phức tạp, logic càng đa lớp, và việc chỉ dựa vào kịch bản (script) cố định đã không còn đủ để đảm bảo chất lượng tuyệt đối nữa.

Hôm nay, chúng ta sẽ đi sâu vào một chủ đề mang tính chiến lược cao: **Làm thế nào để kết hợp sức mạnh tìm lỗi vô phương hướng nhưng cực kỳ hiệu quả của Exploratory Testing (ETT) với khung cấu trúc khoa học của Session-Based Test Management (SBTM)**.

Đây không chỉ là việc áp dụng hai kỹ thuật riêng lẻ; đây là sự cộng hưởng, tạo ra một chiến lược kiểm thử có khả năng khám phá những lỗ hổng chưa từng được biết đến, nhưng vẫn đảm bảo tính minh bạch và đo lường được.

***

## I. Hiểu rõ bản chất của Exploratory Testing (ETT)

Trước khi tìm cách tối ưu hóa nó, chúng ta phải hiểu rõ ETT là gì.

**Exploratory Testing (Kiểm thử Khám phá)** không phải là việc nhấp chuột ngẫu nhiên (random clicking). Theo định nghĩa chuẩn mực trong ngành, nó là một quy trình học tập và kiểm thử đồng thời (*learning while testing*). Người kiểm thử đóng vai trò như một nhà khoa học thực nghiệm:

1.  **Giả thuyết:** Đưa ra giả định về hành vi của hệ thống dựa trên kinh nghiệm và yêu cầu.
2.  **Thực hiện (Execution):** Thực hiện các bước kiểm thử để xác nhận hay bác bỏ giả thuyết đó.
3.  **Học hỏi (Learning):** Điều chỉnh chiến lược kiểm thử ngay lập tức sau mỗi khám phá, tập trung vào những khu vực có rủi ro cao hoặc hành vi bất thường.

#### Ưu điểm của ETT:
*   **Tăng khả năng phát hiện lỗi:** Rất mạnh trong việc tìm các bug phức tạp, liên quan đến luồng người dùng (user flow) và trải nghiệm thực tế.
*   **Tính linh hoạt tối đa:** Không bị giới hạn bởi kịch bản cũ hay tài liệu thiếu sót.

#### Hạn chế của ETT truyền thống:
*   **Thiếu tính minh bạch:** Vì quy trình quá ngẫu hứng, rất khó để báo cáo "Tôi đã kiểm thử những gì?" (What did I test?) cho các bên liên quan hoặc quản lý dự án.
*   **Khó tái lập:** Khi một bug được tìm thấy, việc xác định chính xác chuỗi hành động *tối ưu nhất* dẫn đến lỗi đó để người khác tái hiện rất khó khăn nếu không có cấu trúc hỗ trợ.

***

## II. Giải pháp cấu trúc: Session-Based Test Management (SBTM)

Đây là lúc chúng ta cần một bộ khung (framework) để "nhốt" tính sáng tạo của ETT vào một khu vực đo lường được. Đó chính là SBTM.

**Session-Based Test Management (Quản lý kiểm thử dựa trên Phiên)** biến quá trình khám phá tự do thành các *phiên* kiểm thử có cấu trúc, giới hạn thời gian và phạm vi rõ ràng.

Mỗi "Phiên" (Session) được xác định bởi ba yếu tố cốt lõi:

1.  **Charter (Hiến chương Kiểm thử):** Đây là bản tuyên bố về mục tiêu của phiên hiện tại. Thay vì nói "Kiểm tra tính năng Thanh toán," Charter sẽ cụ thể hóa hơn: *“Trong 2 giờ tới, chúng ta sẽ tập trung kiểm tra khả năng xử lý lỗi khi thanh toán qua cổng A nhưng hệ thống mạng bị gián đoạn đột ngột.”*
2.  **Timebox (Giới hạn Thời gian):** Quy định rõ thời lượng cho một phiên (ví dụ: 1-4 giờ). Điều này tạo áp lực tích cực, buộc người kiểm thử phải tập trung cao độ và ưu tiên hóa công việc.
3.  **Metrics (Các chỉ số đo lường):** Xác định các KPI để đánh giá chất lượng session, ví dụ:
    *   Tỷ lệ bug tìm thấy/giờ.
    *   Phạm vi tính năng được bao phủ (%) trong phiên này.
    *   Số lượng luồng người dùng (user flow) phức tạp đã được khám phá.

***

## III. Sức mạnh cộng hưởng: ETT có cấu trúc bằng SBTM

Khi bạn kết hợp hai kỹ thuật này, bạn sẽ đạt được điều tuyệt vời nhất: **Tính linh hoạt của việc khám phá với tính kỷ luật của quy trình khoa học.**

| Đặc điểm | ETT thuần túy (Random) | SBTM áp dụng cho ETT (Structured) |
| :--- | :--- | :--- |
| **Mục tiêu** | Tìm kiếm mọi thứ bất ngờ. | Tìm kiếm các rủi ro đã xác định trong một phạm vi cụ thể. |
| **Đầu vào** | Sự tò mò, kinh nghiệm cá nhân. | Test Charter (Phạm vi, Rủi ro). |
| **Tính đo lường** | Khó đánh giá hiệu suất. | Có điểm metric rõ ràng: Bug/giờ, Độ bao phủ. |
| **Kết quả** | Lỗi bất ngờ và chất lượng cao, nhưng khó tái lập quy trình. | Cung cấp bản báo cáo *Process Artifact* (sản phẩm quá trình) chi tiết về những gì đã được kiểm tra. |

### 💡 Các bước triển khai thực tế cho QE Lead:

Với vai trò là QE Lead, nhiệm vụ của bạn không chỉ là tham gia phiên mà còn phải **thiết lập cấu trúc** để mọi người tuân theo một quy trình nhất quán.

**Bước 1: Phân tích rủi ro và Xác định Mục tiêu (The Strategy)**
*   Họp với Product Owner và đội phát triển. Thay vì yêu cầu "Test cái này," hãy hỏi: "Trong luồng thanh toán, phần nào có khả năng cao xảy ra lỗi nhất? Nếu tài khoản hết tiền hay bị timeout thì hệ thống sẽ phản ứng thế nào?"
*   **Kết quả:** Xác định được rủi ro cốt lõi $\rightarrow$ Tạo ra nội dung cho Test Charter.

**Bước 2: Thiết lập Charter và Timebox (The Structure)**
*   Tạo một tài liệu *Test Session Charter*. Tài liệu này phải bao gồm Phạm vi, Mục tiêu Rủi ro, Người tham gia, Giới hạn thời gian.
*   Ví dụ: **[Charter]**: "Kiểm thử các kịch bản thất bại liên quan đến việc tải dữ liệu lớn (Bulk Data Upload) khi người dùng bị gián đoạn kết nối mạng đột ngột."

**Bước 3: Thực hiện phiên kiểm thử có mục đích (The Execution)**
*   Trong suốt phiên, mọi hành động đều phải được ghi lại dưới góc độ *rủi ro đã khám phá*. Người test không chỉ bấm nút mà còn mô tả *suy nghĩ* của họ.
    *   *Ví dụ:* Thay vì ghi "Nhấn nút Save," hãy ghi "Thử nghiệm với giả định người dùng bị gián đoạn khi dữ liệu đang tải, để xem cơ chế rollback có xảy ra hay không."

**Bước 4: Phân tích và Báo cáo (The Metrics)**
*   Sau session, nhóm cần họp lại để phân tích. Các bug được tìm thấy phải được liên kết ngược với **Rủi ro/Giả định** nào đã kích hoạt chúng, chứ không chỉ báo cáo là "Bug A".
*   Điều này giúp đội phát triển hiểu được *vì sao* lỗi đó tồn tại và *loại rủi ro* nào cần được vá.

***

## IV. Ví dụ minh họa (Sử dụng cấu trúc Pseudo-code)

Giả sử chúng ta đang kiểm thử một tính năng đặt lịch hẹn trực tuyến (Appointment Scheduling). Thay vì viết các kịch bản (Test Cases) truyền thống, bạn thiết kế session theo dạng sau:

```yaml
---
Session_ID: APL-0326
Charter: Kiểm tra khả năng đặt lịch trùng lặp và xử lý xung đột qua múi giờ.
Timebox: 120 phút
Priority: Critical
Risks_Focus: [Conflict/Concurrency, Timezone Mismanagement]
Goal_Metric: Tìm ít nhất 3 kịch bản Conflict/Race Condition mới.
Test_Steps:
  - Step_ID: TZC_001 (Test Zone Check)
    Hypothesis: Hệ thống phải tự động điều chỉnh hiển thị theo múi giờ của người dùng, ngay cả khi server ở nơi khác.
    Action: Đăng nhập từ 2 khu vực Timezone khác nhau (VD: Sài Gòn & New York) và kiểm tra sự khác biệt trên lịch hẹn.
  - Step_ID: TZC_002 (Conflict Race Condition)
    Hypothesis: Khi hai người dùng cố gắng đặt cùng một slot, hệ thống phải từ chối 1 người và thông báo rõ ràng cho cả hai.
    Action: Sử dụng công cụ đồng bộ hóa để giả lập 2 request POST đến API booking trong vòng 5 giây với cùng TimeSlot ID.
```

**Phân tích đoạn mã trên:** Đây không phải là kịch bản *kiểm tra* mà là một **khung làm việc (Workframe)** cho buổi khám phá. Nó định nghĩa rõ: Cái gì cần test (Scope), Tại sao cần test (Hypothesis/Risk), và Làm thế nào để test nó bằng cơ chế đồng bộ hóa hoặc giả lập môi trường (Action).

## Lời kết từ Hồng Dung

Tóm lại, **Exploratory Testing không nên được xem là hành động ngẫu nhiên; nó phải là một quá trình khoa học có cấu trúc.**

Bằng cách sử dụng Session-Based Test Management làm khung xương cột, chúng ta biến sự tò mò sáng tạo của người kiểm thử thành các bằng chứng (evidence) đo lường và dễ báo cáo. Điều này giúp đội ngũ QA không chỉ tìm ra bug mà còn cung cấp được **giá trị chiến lược** về nơi nào là rủi ro lớn nhất của sản phẩm.

Nếu bạn đang vật lộn với việc làm sao để hệ thống kiểm thử của mình vừa linh hoạt lại vừa có thể đo lường hiệu suất, hãy bắt đầu từ việc áp dụng SBTM vào quy trình ETT.

Chúc các bạn luôn giữ vững tinh thần khám phá chất lượng!