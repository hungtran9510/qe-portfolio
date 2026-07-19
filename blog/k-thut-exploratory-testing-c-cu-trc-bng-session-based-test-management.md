---
title: "Kỹ thuật Exploratory Testing có cấu trúc bằng Session-Based Test Management"
date: 2026-03-29
description: "Khám phá cách kết hợp sức sáng tạo của E2E với kỷ luật khoa học của SBTM để tối ưu hóa chiến lược kiểm thử."
tags: ["Exploratory Testing","QA Strategy","Manual Testing"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hồng Dung"
---

# Kỹ thuật Exploratory Testing có cấu trúc bằng Session-Based Test Management

Xin chào các anh chị em và đồng nghiệp trong ngành Kiểm thử Chất lượng (QA)! Tôi là Hồng Dung.

Trong hành trình đảm bảo chất lượng phần mềm, chúng ta đã quen thuộc với các loại hình kiểm thử truyền thống: Unit Tests, Integration Tests, hay những bộ Test Case chi tiết được viết sẵn. Tuy nhiên, thế giới phát triển phần mềm luôn vận động nhanh chóng và phức tạp hơn bao giờ hết, đôi khi, các kịch bản lỗi (edge cases) lại không thể nào đoán trước bằng việc viết tài liệu hóa đầy đủ.

Đây chính là nơi mà *Exploratory Testing* (Kiểm thử Khám phá) tỏa sáng. Nhưng nếu chỉ dựa vào sự "sáng tạo" thuần túy thì sao? Nó dễ bị phân tán, thiếu mục tiêu và khó đo lường hiệu quả.

Bài viết hôm nay sẽ mang đến cho bạn một giải pháp hoàn hảo: **Kết hợp tính tự do của Exploratory Testing với kỷ luật khoa học của Session-Based Test Management (SBTM)**. Chúng ta sẽ biến sự "ngẫu hứng" thành một quy trình kiểm thử có cấu trúc, đo lường được và cực kỳ hiệu quả.

---

## 💡 I. Khám phá và Vấn đề cần giải quyết (The Problem)

**Exploratory Testing (ET)** là gì?
Nói một cách đơn giản, ET không phải là việc chạy theo kịch bản (script). Nó là quá trình học hỏi, tìm kiếm lỗi (bug finding), và xây dựng kiến thức về ứng dụng *trong khi* kiểm thử. Tester đóng vai trò của một nhà thám hiểm, sử dụng kinh nghiệm và trực giác để đi sâu vào các góc khuất mà sách vở không đề cập tới.

**Vấn đề của ET thuần túy:**
1. **Tính Chủ quan cao:** Kết quả khó tái lập (non-repeatable).
2. **Thiếu Phạm vi (Scope):** Tester dễ bị lan man, không biết nên tập trung vào khu vực nào nhất.
3. **Khó Đo lường:** Rất khó để báo cáo: "Hôm nay tôi đã kiểm thử bao nhiêu tính năng theo tiêu chuẩn X?"

Và đó là lý do tại sao chúng ta cần một bộ khung quản lý.

## ⚙️ II. Giải pháp khoa học: Session-Based Test Management (SBTM)

**Session-Based Test Management (SBTM)** không phải là một công cụ, mà là một *kỹ thuật*. SBTM cung cấp cấu trúc và tính minh bạch cho quá trình khám phá. Nó biến việc "thử mọi thứ" thành việc "tối đa hóa độ phủ theo mục tiêu định sẵn".

### 🔍 Cấu trúc của SBTM:
SBTM hoạt động bằng cách chia toàn bộ quá trình kiểm thử thành các phiên (Sessions) nhỏ, tập trung và có chủ đề rõ ràng. Mỗi Session sẽ bao gồm ba yếu tố cốt lõi:

1. **Mục tiêu (Goal):** Xác định rõ "Chúng ta đang tìm lỗi gì hôm nay?" Ví dụ: *Kiểm tra luồng thanh toán khi người dùng bị mất kết nối Internet.*
2. **Phạm vi/Giới hạn (Scope/Boundary):** Giới hạn tính năng hoặc module cụ thể để tránh việc lan man quá mức. Ví dụ: *Chỉ giới hạn trong trang giỏ hàng và checkout.*
3. **Các bước thực hiện có định hướng (Guiding Steps):** Các hành động khởi điểm, các luồng chính cần kiểm tra, nhằm đảm bảo không bỏ qua những yếu tố cơ bản.

### 🚀 Sự kết hợp hoàn hảo: SBTM + ET
Khi bạn áp dụng SBTM, bạn nhận được một bộ khung đã điền sẵn "sàn nhà" và "chiếc bàn". Sau đó, trong buổi Session thực tế (ET), bạn tự do di chuyển trên sàn và chiếc bàn đó. Bạn vẫn có sự sáng tạo của việc khám phá, nhưng mọi hoạt động đều nằm trong giới hạn mục tiêu đã được thống nhất.

---

## 👨‍💻 III. Triển khai Thực chiến: Quy trình 4 bước theo Hồng Dung

Để triển khai thành công SBTM cho Exploratory Testing, chúng ta cần tuân thủ một quy trình lặp đi lặp lại sau đây:

### Bước 1: Định nghĩa Session (The Setup)
Thay vì viết Test Case, đội QE sẽ tạo ra các **Session Plan** (Kế hoạch Phiên). Mỗi plan phải trả lời được câu hỏi: *Goals? Scope? Metrics?*

***Ví dụ về một Session Plan (Product Feature: Đăng ký người dùng mới):***
*   **Goal:** Xác minh khả năng đăng ký thành công và xử lý lỗi khi các trường dữ liệu không hợp lệ.
*   **Scope:** Chỉ giới hạn trong form "Create Account" (Chưa bao gồm phần xác nhận email).
*   **Metrics/Focus Area:** Độ phủ của các loại kiểm tra nhập liệu (Input Validation) và khả năng hiển thị thông báo lỗi cho người dùng (User Feedback).
*   **Duration:** 2 giờ.

### Bước 2: Thực hiện Session (The Execution - ET Mode)
Trong phiên làm việc, bạn đóng vai trò là nhà thám hiểm. Bạn bám sát Goals đã đặt ra nhưng hoàn toàn tự do về *cách thức*.

***Kỹ thuật quan trọng nhất tại bước này là "Timeboxing" và "Test Case Generation":*** Đừng cố gắng ghi lại mọi thứ như đang chạy test script. Hãy tập trung tìm lỗi, sau đó **ghi lại các trường hợp thực hiện (actions) và bằng chứng (evidence)** một cách nhanh chóng dưới dạng ghi chú hoặc thẻ (card).

### Bước 3: Báo cáo và Phân tích (The Synthesis)
Sau khi Session kết thúc, chúng ta không chỉ báo cáo *Bug* mà còn báo cáo *Knowledge*.

**Bản báo cáo cần bao gồm:**
1.  Mục tiêu đạt được (Goals met).
2.  Các trường hợp lỗi đã tìm thấy (Bugs found).
3.  Các lĩnh vực chưa được kiểm tra hoặc có rủi ro cao (Areas of high risk / Missing Coverage). Đây chính là input quý giá cho Session tiếp theo.

### Bước 4: Cải tiến và Lặp lại (Iteration)
Sử dụng Knowledge thu thập được ở bước 3 để điều chỉnh Scope và Goals cho phiên kế tiếp.

*Ví dụ:* Nếu phiên thứ nhất tập trung vào *Input Validation*, còn rất nhiều bug liên quan đến tốc độ tải trang (Performance), thì Session Plan tiếp theo sẽ đưa **Hiệu năng mạng** thành một Goals chính, giúp đảm bảo không bỏ sót rủi ro lớn nào.

---

## 📝 IV. Ví dụ Minh họa: Phân biệt Test Case vs. Session Notes

Khi làm việc với các công cụ quản lý kiểm thử hiện đại (như Jira/TestRail), tôi khuyên bạn nên tách biệt rõ ràng giữa **Test Cases** và **Session Notes/Knowledge**.

**Bạn không ghi những gì sau đây vào Test Cases:**
*   *(❌ SAI)* "Kiểm tra xem form có bị treo khi nhập chữ hoa hay chữ thường." (Đây là quá rộng, không phải Case)
*   *(❌ SAI)* "Ôi, làm sao mà nó lại chấp nhận ký tự đặc biệt này nhỉ? Phải thử cái này luôn!" (Đây là sự khám phá trực giác)

**Bạn nên ghi vào Session Notes:**
```python
# Ví dụ về việc ghi chú Session Note trong một công cụ quản lý:

SESSION_ID = "Login_Validation_S2" 
TARGET_FEATURE = "User Authentication Flow"

# [Start of Session]
GOALS = ["Verify password edge cases", "Confirm account lockout mechanism"]
SCOPE = ["Username/Password Fields", "Error Messaging"]

# --- Activity Log (Nội dung ghi chú): ---
Notes.add("Thử nghiệm với độ dài mật khẩu tối thiểu 7 ký tự, sau đó thay đổi thành chỉ có chữ hoa.") 
Notes.add(f"Quan sát được: Hệ thống báo lỗi chung chung 'Invalid Credentials' dù username hợp lệ nhưng password quá ngắn (Nghi ngờ va chạm logic).")

# --- Actions Taken (Hành động thực hiện): ---
Actions.append("Input Username: user_test | Password: P@ss123") 
Actions.append("Attempt Login -> Result: Success")

# --- Knowledge Gained / Bugs Found: ---
KNOWLEDGE.add("Cần xem xét lại việc thông báo lỗi mật khẩu quá ngắn, nên là error cụ thể thay vì chung 'Invalid Credentials'.")
BUG_ID = "ISSUE-452" # Địa chỉ hóa bug tìm thấy.

# [End of Session]
```
**Giải thích từ chuyên gia:** Bằng cách ghi lại cấu trúc này, bạn đã biến một hành động ngẫu hứng thành dữ liệu có thể *phân tích*, *lặp lại* (cho đến khi lỗi được khắc phục), và quan trọng nhất là **chứng minh** quá trình kiểm thử của mình cho đội ngũ Stakeholders.

## 🌟 Lời Kết từ Hồng Dung: Tư duy QE hiện đại

Các anh chị em cần thay đổi tư duy về vai trò QA/QE. Chúng ta không chỉ là những người "tìm lỗi" (Bug Finders). Chúng ta là **Kiến trúc sư Chất lượng (Quality Architects)**.

SBTM kết hợp với ET giúp chúng ta thực hiện điều đó: nó cung cấp cấu trúc để đảm bảo mọi rủi ro lớn đều được xem xét, đồng thời vẫn giữ lại tính linh hoạt và sự nhạy bén của trí tuệ con người.

Hãy bắt đầu từ Session Plan tiếp theo, đừng chỉ nghĩ đến Test Cases, mà hãy nghĩ đến **Mục tiêu nào cần được kiểm tra, bằng phương pháp khám phá nào?**

Chúc các bạn luôn tìm ra những lỗi "bất ngờ" và xây dựng nên những sản phẩm chất lượng tuyệt vời!

***
*(Hồng Dung - QE Lead)*