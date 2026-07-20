---
title: "Kỹ thuật Exploratory Testing có cấu trúc bằng Session-Based Test Management"
date: 2026-03-30
description: "Khám phá cách biến sự ngẫu hứng của ET thành quy trình khoa học với SBT, tối ưu hóa độ bao phủ và chất lượng kiểm thử."
tags: ["Exploratory Testing","QA Strategy","Manual Testing"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hồng Dung"
---

# Kỹ thuật Exploratory Testing có cấu trúc bằng Session-Based Test Management

Xin chào các anh chị và bạn đồng nghiệp trong lĩnh vực QA! Tôi là Hồng Dung.

Trong suốt sự nghiệp của mình, tôi đã chứng kiến nhiều giai đoạn mà đội ngũ kiểm thử phải vật lộn với một câu hỏi muôn thuở: Làm thế nào để vừa giữ được tính *sáng tạo* cần thiết của việc khám phá (Exploration), lại vừa đảm bảo quy trình làm việc *có tổ chức* và có khả năng đo lường (Measurability)?

Các bạn đã quen thuộc với **Exploratory Testing (ET)** – kỹ thuật kiểm thử mà trong đó, người kiểm thử đồng thời học hỏi về hệ thống dưới sự vận hành, thiết kế các trường hợp kiểm thử và thực hiện chúng. Đây là nguồn gốc của nhiều bug chất lượng cao nhất!

Tuy nhiên, nếu ET bị thả trôi quá mức, nó có thể biến thành một buổi "đi chơi" không mục đích, dẫn đến việc lãng phí thời gian và thiếu khả năng báo cáo độ bao phủ (Coverage).

Đây chính là lúc chúng ta cần một **khung bảo vệ** cho sự khám phá đó. Và khung đó, theo kinh nghiệm của tôi, chính là **Session-Based Test Management (SBT)**.

Bài viết này sẽ đi sâu vào việc kết hợp hai kỹ thuật mạnh mẽ này, biến sự ngẫu hứng thành nghệ thuật kiểm thử có hệ thống và khoa học nhất.

***

## 📚 I. Hiểu Rõ Bản Chất Của Hai Khái Niệm

Để hiểu được sức mạnh của bộ đôi này, chúng ta cần định nghĩa rõ từng phần:

### 1. Exploratory Testing (ET): Nghệ Thuật Vượt Ra Ngoài Kịch Bản
**Định nghĩa:** ET không phải là việc chạy test case mà là một quá trình tìm kiếm lỗi (bug finding) bằng cách áp dụng kiến thức, kinh nghiệm và sự tò mò của người kiểm thử vào hệ thống đang vận hành. Nó đòi hỏi sự nhạy bén để thay đổi hướng đi liên tục dựa trên những gì mình vừa quan sát được.

**Điểm mạnh:** Phát hiện các loại lỗi *kết hợp* (concurrency bugs) hoặc các luồng nghiệp vụ phức tạp mà test case thủ công thường bỏ sót.
**Hạn chế khi độc lập:** Khó đo lường, rủi ro dàn trải (scattered effort), thiếu sự tập trung chiến lược.

### 2. Session-Based Test Management (SBT): Bộ Công Cụ Tổ Chức Hóa Sự Khám Phá
**Định nghĩa:** SBT là một kỹ thuật quản lý kiểm thử trong đó các hoạt động khám phá được tổ chức thành các phiên (sessions) có giới hạn về thời gian, mục tiêu và phạm vi. Thay vì làm ET không điểm dừng, bạn đang quản lý nó như một *dự án nhỏ* trong khuôn khổ một phiên.

**Mục đích của SBT:** Giới hạn sự ngẫu hứng đó vào những khu vực rủi ro cao nhất, đảm bảo rằng mọi nỗ lực đều có mục tiêu cụ thể và đo lường được đầu ra (Deliverables).

***

## 🚀 II. Sự Hợp Nhất: ET Có Cấu Trúc Bằng SBT

Khi chúng ta áp dụng SBT để quản lý ET, chúng ta đang thực hiện việc **"Kỷ luật hóa sự khám phá"**. Chúng ta vẫn giữ được tinh thần của người nhà thám hiểm (Explorer), nhưng lại có chiếc la bàn và bản đồ rõ ràng.

Sự kết hợp này không phải là việc biến ET thành Regression Testing; nó là nâng tầm cả hai lên một cấp độ quản lý rủi ro cao hơn rất nhiều.

### Quy trình hoạt động cơ bản:
1. **Xác định Phạm vi (Scope):** Thay vì "Test cái module X", chúng ta xác định "Session này sẽ tập trung kiểm tra luồng đăng ký tài khoản của người dùng từ góc độ giả mạo dữ liệu và truy cập đồng thời."
2. **Thiết lập Mục tiêu/Mục đích (Charter):** Xác định rõ điều cần tìm ("Phải tìm ra lỗi về tính toàn vẹn dữ liệu khi mất kết nối mạng trong quá trình thanh toán.").
3. **Thực thi (Execution Timebox):** Trong một khoảng thời gian cố định, người kiểm thử không chỉ thực hiện hành động mà còn phải ghi lại lý do họ đang làm điều đó và giả thuyết họ muốn bác bỏ/xác nhận.

### 💡 Minh họa bằng pseudo-code của Hồng Dung:

```python
# Pseudo-Code cho việc tổ chức một Session Exploratory Testing (ET Session)

def conduct_et_session(Timebox, Charter, Scope):
    """
    Thực hiện phiên kiểm thử khám phá theo cấu trúc SBT.
    Args:
        Timebox (duration): Giới hạn thời gian (ví dụ: 2 giờ).
        Charter (objective): Mục tiêu chính của phiên (Điều cần tìm).
        Scope (area_focus): Khu vực/Tính năng tập trung rủi ro cao nhất.
    """
    print(f"--- BẮT ĐẦU SESSION TESTMING ---")
    print(f"Mục tiêu: {Charter}")
    print(f"Phạm vi: {Scope} | Thời gian tối đa: {Timebox}")

    # Khởi tạo công cụ ghi chép trong phiên
    session_log = [] 
    bug_count = 0

    while time_remaining > 0 and bug_count < max_bugs_to_find:
        # Bước 1: Thiết lập giả thuyết (Hypothesis Generation) - QUAN TRỌNG NHẤT
        hypothesis = "Giả thuyết hiện tại: Hệ thống sẽ không bị crash khi tải quá nhiều dữ liệu cùng lúc."
        session_log.append(f"[{time}] Hypothesis: {hypothesis}")

        # Bước 2: Thực thi (Execution) - Hành động khám phá
        action = perform_stress_test_on_scope(Scope, time_remaining * 0.6) # Dùng 60% thời gian
        
        # Bước 3: Quan sát và Báo cáo (Observation & Recording)
        observation = observe_system_behavior(action) 
        session_log.append(f"[{time}] Observation: {observation}")

        if observation == "System Failure":
            bug_count += 1
            report_bug(details=observation, severity="High")
            print(f"[SUCCESS] Bug found! Số bug: {bug_count}")

        # Cập nhật thời gian và chuyển sang thử thách/giả thuyết mới
        time_remaining -= (Timebox * 0.4)

    print("--- KẾT THÚC SESSION TESTMING ---")
    return session_log, bug_count

```

**Giải thích chuyên sâu các đoạn mã giả định trên:**

1. **`Charter` và `Scope`:** Chúng là biến input quyết định sự thành công của phiên. Nếu bạn chỉ nói "Kiểm tra Module X", thì quá rộng. Thay vào đó, nó phải cụ thể: *"Module Thanh Toán - Chỉ tập trung kiểm tra trạng thái thất bại giao dịch khi Gateway Timeout"*.
2. **`Hypothesis Generation`:** Đây là bước *tư duy* quan trọng nhất. Trước khi bấm nút, người QE Lead phải tự hỏi: "Điều gì có thể sai ở đây?" và ghi lại giả thuyết đó (ví dụ: Giả định rằng dữ liệu người dùng sẽ không bị mất ngay cả khi máy chủ vật lý gặp sự cố).
3. **`Timebox`:** Nó buộc chúng ta phải tập trung, tránh lan man. Kết thúc phiên đúng giờ yêu cầu đội ngũ phải đưa ra kết quả và bài học rút ra trong 10 phút cuối cùng (Closing Talk).

***

## ✅ III. Ba Bước Quan Trọng Để Tổ Chức Một Session ET Thành Công

Nếu bạn muốn triển khai kỹ thuật này, hãy tuân thủ quy trình có cấu trúc sau:

### Bước 1: Giai Đoạn Lập Kế Hoạch (Pre-Session Planning)
Đừng bao giờ đi vào phiên mà không biết rủi ro cao nhất ở đâu.

*   **Phân tích Rủi Ro:** Yêu cầu Product Owner và các đội kỹ thuật liệt kê Top 5 khu vực có nguy cơ thất bại nhất (ví dụ: Tích hợp API bên thứ ba, Logic tính thuế phức tạp, Giỏ hàng khi mạng yếu).
*   **Xây dựng Charter:** Viết một văn bản charter chi tiết cho phiên này. Nội dung phải bao gồm: **Mục tiêu (Goal)**, **Phạm vi (Scope - những gì được phép kiểm tra)**, và **Các rủi ro trọng tâm (Key Risks/Hypotheses)**.

### Bước 2: Giai Đoạn Thực Thi (Execution)
Đây là nơi người QE Lead thể hiện vai trò dẫn dắt. Vai trò của bạn không chỉ là *người thực hiện*, mà còn là *nhà điều phối*.

*   **Vai trò Chủ động:** Trong suốt session, đừng chỉ nhấn nút. Hãy liên tục hỏi: *"Tại sao tôi lại làm bước này?"* và ghi lại lý do đó (This is called logging the reasoning/thought process).
*   **Làm việc nhóm:** Nếu có nhiều người tham gia, hãy phân chia theo các góc độ rủi ro khác nhau trong cùng một phiên. Ví dụ: Người A tập trung vào tính năng nghiệp vụ; Người B tập trung vào bảo mật API; Người C tập trung vào trải nghiệm người dùng (UX edge cases).

### Bước 3: Giai Đoạn Tổng Kết (Post-Session Retrospective)
Đây là bước mà nhiều nhóm thường bỏ qua, nhưng lại quyết định chất lượng của toàn bộ quy trình. Sau khi phiên kết thúc, hãy dành thời gian này:

*   **Review Bugs:** Phân loại các bug tìm thấy và mức độ nghiêm trọng (Severity).
*   **Tổ chức Kiến thức:** Biến những quan sát ngẫu hứng thành các *điểm kiến thức* (Knowledge Points) mới. Ví dụ: "Chúng ta đã phát hiện ra rằng nếu người dùng nhập chữ vào trường số, thì lỗi chỉ xuất hiện trên trình duyệt Safari." -> Đây là một tiêu chí kiểm thử mới cần được ghi nhận!
*   **Cập nhật Charters:** Những Knowledge Point này sẽ trở thành **Charter đầu tiên** cho phiên ET tiếp theo.

***

## 🔑 Kết Luận: Sức Mạnh Của Sự Có Tổ Chức

Tóm lại, Exploratory Testing là một năng lực (Capability), còn Session-Based Test Management là một kỹ thuật quản lý (Technique) giúp chúng ta hệ thống hóa năng lực đó.

Bằng việc áp dụng SBT để cấu trúc ET, đội ngũ QA của bạn không chỉ là những người kiểm thử giỏi mà còn trở thành những *nhà phân tích rủi ro có hệ thống*. Chúng ta đã biến sự ngẫu hứng vô định (Chaos) thành một quy trình tái tạo được và đo lường được (Measurable Process).

Nếu quý công ty đang tìm cách nâng tầm việc kiểm thử thủ công lên một cấp độ khoa học hơn, tôi khuyến nghị các anh chị hãy bắt đầu áp dụng mô hình Session-Based Exploratory Testing ngay hôm nay.

Chúc các bạn luôn thành công trong việc săn lùng những lỗi ẩn giấu! Hẹn gặp lại trong những chủ đề chuyên sâu tiếp theo của QE Lead Hồng Dung.