---
title: "Kỹ thuật Exploratory Testing có cấu trúc bằng Session-Based Test Management"
date: 2026-03-29
description: "Khám phá cách biến Exploratory Testing ngẫu hứng thành một chiến lược QA có cấu trúc, khoa học với SBTM."
tags: ["Exploratory Testing","QA Strategy","Manual Testing"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hồng Dung"
---

# Kỹ thuật Exploratory Testing có cấu trúc bằng Session-Based Test Management

**Tác giả:** Hồng Dung, QE Lead
*(Ngày 29 tháng 3 năm 2026)*

Xin chào các đồng nghiệp QA! Là một người làm việc sâu với chất lượng phần mềm, tôi hiểu rằng mọi người chúng ta đều trân trọng sự sáng tạo và khả năng "bắt lỗi bất ngờ" mà *Exploratory Testing (ET)* mang lại. ET là nghệ thuật của Tester: nó không theo kịch bản (scripted), nhưng lại đầy tính hệ thống khi được thực hiện bởi một chuyên gia giỏi.

Tuy nhiên, ranh giới giữa sự sáng tạo và sự ngẫu hứng đôi khi rất mỏng manh, dễ dẫn đến việc bỏ sót các khu vực cần kiểm tra hoặc thiếu khả năng tái lập báo cáo lỗi (reproducibility). Đây chính là vấn đề mà *Session-Based Test Management (SBTM)* ra đời để giải quyết.

Trong bài viết chuyên sâu này, tôi sẽ cùng mọi người khám phá cách kết hợp hai kỹ thuật này – biến ET ngẫu hứng thành một quy trình QA có cấu trúc, minh bạch và cực kỳ hiệu quả, giúp tối đa hóa độ bao phủ (coverage) mà vẫn giữ được tinh thần khám phá của con người.

***

## 📘 I. Tổng quan về vấn đề: Từ Nghệ thuật đến Khoa học

### 1. Exploratory Testing (ET): Bản chất sáng tạo
ET là một hình thức kiểm thử không theo kịch bản, nơi Tester sử dụng kiến thức nghiệp vụ và trực giác của mình để khám phá các góc độ chức năng chưa được biết rõ hoặc ít người chú ý. Mục tiêu cốt lõi là *học hỏi* trong khi tìm lỗi.

**Điểm mạnh:** Khả năng phát hiện những bug loại "corner case" (trường hợp biên) mà kịch bản tự động hóa hay test case truyền thống thường bỏ qua.
**Thách thức:** Thiếu cấu trúc. Nếu không được định hướng, phiên ET có thể trở nên lãng phí thời gian, thiếu trọng tâm và rất khó để ghi lại bằng chứng (evidence) về phạm vi đã kiểm tra.

### 2. Session-Based Test Management (SBTM): Khung xương định hình
SBTM là một quy trình quản lý được sử dụng trong bối cảnh ET. Thay vì xem phiên test như một hành động "lướt qua" tính năng, SBTM buộc chúng ta phải đặt nó vào **khuôn khổ có ranh giới rõ ràng**.

Một Session (Phiên) của SBTM không chỉ là việc nhấn các nút trên màn hình; nó là một quá trình được định nghĩa bởi:
1.  **Test Charter:** Mục tiêu và phạm vi test cụ thể cho phiên đó.
2.  **Timebox:** Giới hạn thời gian tối đa để thực hiện session.
3.  **Objectives & Scope:** Các mục tiêu rõ ràng (ví dụ: Kiểm tra quy trình thanh toán, không phải kiểm tra giao diện người dùng chung).

**Mục đích của SBTM:** Mang tính kỷ luật và độ sâu vào sự sáng tạo. Nó biến một buổi khám phá thành một cuộc nghiên cứu có phương pháp luận khoa học.

***

## 💡 II. Nguyên lý hoạt động: Khi ET gặp SBTM

Khi kết hợp hai khái niệm này, chúng ta không còn làm "test ngẫu nhiên" nữa; chúng ta đang thực hiện một **Kiểm thử Khám phá Có Mục tiêu (Goal-Oriented Exploratory Testing)**.

**Quy trình cốt lõi như sau:**

1.  **Xác định Phạm vi Rộng:** Dựa trên yêu cầu nghiệp vụ, kiến trúc hệ thống và các khu vực rủi ro cao, nhóm QE sẽ xác định một "Lĩnh vực" cần kiểm tra (ví dụ: Quản lý Tài khoản Người dùng).
2.  **Thiết lập Test Charter (Hợp đồng Kiểm thử):** Đây là bước quan trọng nhất. Chúng ta phải viết ra *những gì* chúng ta có thể làm, *không phải những gì* chúng ta sẽ test. Charer cung cấp quyền hạn và định hướng cho Tester.
3.  **Thực thi Session (Timeboxed):** Trong giới hạn thời gian (ví dụ: 4 giờ), nhóm chỉ tập trung vào các mục tiêu đã cam kết trong Charter. Mọi hành động đều phải phục vụ việc kiểm tra phạm vi đó.

### 📐 Minh họa về cấu trúc Charter

Để mọi thứ trở nên thực tế và dễ theo dõi, tôi xin đưa ra một pseudo-code mẫu cho việc định nghĩa **Test Charter** của một phiên test:

```yaml
# === Test Charter Definition ===
Session_ID: "AUTH_FLOW_V2.1"
Target_Feature: "Quản lý Tài khoản Người dùng (Authentication/Authorization)"
Timebox: "4 giờ"
Date: "2026-03-29"

Goals:
  - Primary Goal: Xác minh toàn bộ luồng đăng ký và đăng nhập, đặc biệt là các trường hợp quên mật khẩu.
  - Secondary Goal: Kiểm tra giới hạn Rate Limit trên API login (Kiểm thử hiệu năng cơ bản).

Scope_Inclusions:
  - Flow 1: Đăng ký thành công bằng Email/Mật khẩu.
  - Flow 2: Đăng nhập với credentials hợp lệ/không hợp lệ.
  - Flow 3: Khôi phục mật khẩu qua email (Verification Code).
  - Flow 4: Kiểm tra việc khóa tài khoản sau N lần thử sai.

Scope_Exclusions:
  - Thay đổi hồ sơ người dùng cá nhân (Profile Update - Sẽ là session khác).
  - Tích hợp OAuth với bên thứ ba (Third-party SSO).

Exit_Criteria: "Phải bao phủ đủ 4 luồng trên và ghi nhận tối thiểu 5 góc độ rủi ro tiềm ẩn."
```

**Giải thích của Hồng Dung:**

*   **`Session_ID` & `Target_Feature`**: Giúp việc theo dõi dễ dàng (Traceability). Khi báo cáo lỗi, chúng ta biết chính xác phiên test nào chịu trách nhiệm cho việc tìm ra bug đó.
*   **`Goals`**: Định hướng suy nghĩ của Tester. Thay vì nghĩ "Tôi nên thử gì?", bạn sẽ nghĩ "Mục tiêu của tôi là phải *xác minh toàn bộ luồng...*", buộc tâm trí đi theo các con đường nhất định nhưng vẫn linh hoạt trong cách thức thực hiện.
*   **`Scope_Inclusions / Scope_Exclusions`**: Đây là bức tường bảo vệ khỏi sự mất phương hướng. Việc loại bỏ rõ ràng những gì *không* phải test giúp tiết kiệm thời gian và tập trung nguồn lực. Nó cũng đóng vai trò là văn bản giao tiếp cho cả đội ngũ Stakeholder, minh bạch hóa phạm vi chất lượng đã được cam kết.
*   **`Exit_Criteria`**: Xác định dấu hiệu thành công của phiên test. Điều này biến "Hoàn thành" (Finished) thành một khái niệm có thể đo lường và chứng minh được tính bao phủ cần thiết.

***

## ⚙️ III. Hướng dẫn thực hành chuyên sâu: Tối ưu hóa quá trình

Việc áp dụng SBTM không chỉ là lập tài liệu; nó còn thay đổi tư duy làm việc của đội QA. Dưới đây là các lời khuyên từ kinh nghiệm của tôi để triển khai quy trình này hiệu quả nhất:

### 1. Chuẩn bị (Pre-Session)
Trước khi bắt đầu, hãy tổ chức một buổi họp *Kick-off* ngắn với Product Owner và Business Analyst. Hãy dùng Test Charter để thảo luận về **rủi ro nghiệp vụ cao nhất** (highest business risk). Những khu vực này sẽ được ưu tiên tuyệt đối trong Scope.

### 2. Trong Phiên Thực thi (Execution)
Hãy nhớ nguyên tắc: *Học hỏi trước, ghi chú sau*. Khi bạn gặp một lỗi hoặc tìm thấy một hành vi bất thường, đừng dừng lại để kiểm tra mọi thứ xung quanh. Hãy **ghi lại các bước thực hiện và dữ liệu đầu vào** của bug đó ngay lập tức, rồi tiếp tục khám phá theo Charter cho đến khi hết Timebox.

*   **Công cụ hỗ trợ:** Sử dụng công cụ quản lý test case/bug tracker (Jira, Azure DevOps) để tạo một phiên bản ghi lại các **Steps and Paths Taken** trong quá trình làm việc, không chỉ là lỗi tìm thấy. Điều này giúp chứng minh tính hệ thống của session.

### 3. Sau Phiên Thực thi (Post-Session)
Bắt buộc phải có buổi *Debriefing* sau mỗi Session. Trong buổi họp này, nhóm sẽ review:
*   Những gì đã làm được (Successes).
*   Những lỗi tìm thấy và mức độ nghiêm trọng (Bug Reports).
*   **Quan trọng nhất:** Những khu vực mà Charter chưa bao phủ, hoặc các khu vực mới cần ưu tiên cho phiên tiếp theo (New Charter Ideas).

***

## 🚀 IV. Kết luận: Tầm giá trị của Tính Hệ thống trong Khám phá

Kết hợp Exploratory Testing với Session-Based Test Management là bước tiến vượt bậc trong chiến lược QA hiện đại. Nó giúp chúng ta đạt được ba điều cốt yếu sau:

1.  **Tăng tính minh bạch (Transparency):** Mọi người biết chính xác phạm vi, mục tiêu và rủi ro nào đã được kiểm tra.
2.  **Tăng độ phủ có chủ đích (Intentional Coverage):** Chúng ta không còn "săn bug" một cách vô định; chúng ta đang giải quyết các giả thuyết rủi ro cụ thể bằng những kịch bản khám phá sáng tạo.
3.  **Cải thiện khả năng đo lường (Measurability):** Các phiên test được cấu trúc rõ ràng cho phép chúng ta đo lường không chỉ số lượng bug, mà còn *mật độ kiểm thử* trên từng tính năng rủi ro theo thời gian.

Hãy nhớ rằng, chất lượng phần mềm là một sự kết hợp giữa nghệ thuật và khoa học. Bằng cách sử dụng các khuôn khổ như SBTM, chúng ta đảm bảo rằng sự sáng tạo của Tester luôn được đặt trên một nền tảng kiến thức vững chắc, giúp đội ngũ QA của bạn trở thành những chuyên gia kiểm thử toàn diện và đáng tin cậy nhất!

Chúc các đồng nghiệp nhiều trải nghiệm khám phá thành công!
---