---
title: "Kỹ thuật Exploratory Testing có cấu trúc bằng Session-Based Test Management"
date: 2026-03-30
description: "Học cách biến sự khám phá (Exploratory Testing) thành một quy trình kỹ thuật, đo lường và quản lý được bằng phương pháp SBTM."
tags: ["Exploratory Testing","QA Strategy","Manual Testing"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Hồng Dung"
---

# Kỹ thuật Exploratory Testing có cấu trúc bằng Session-Based Test Management

Chào các bạn đồng nghiệp trong lĩnh vực Chất lượng phần mềm, tôi là Hồng Dung. Trong hành trình trở thành một Quality Engineer (Kỹ sư Chất lượng) chuyên nghiệp, chắc chắn chúng ta đã từng nghe về khái niệm *Exploratory Testing* (ET). Đây được xem là "cánh tay nối dài" mạnh mẽ nhất của nhóm kiểm thử thủ công, nơi các Tester không chỉ làm theo kịch bản mà còn học hỏi và thiết kế test cases ngay trong lúc thực thi.

Tuy nhiên, giống như mọi thứ sáng tạo, sự tự do đi kèm với rủi ro. Một buổi ET nếu không được quản lý bài bản có thể trở nên hỗn loạn: thiếu trọng tâm, không đo lường được mức độ bao phủ (coverage), và đặc biệt là rất khó để báo cáo bằng các chỉ số cứng nhắc cho ban quản lý dự án (PM).

Vậy làm thế nào để khai thác toàn bộ sức mạnh sáng tạo của ET mà vẫn giữ được tính kỷ luật khoa học? Câu trả lời nằm ở việc áp dụng **Session-Based Test Management (SBTM)**.

Bài viết này, tôi sẽ đi sâu vào giải thích một cách hệ thống về cách chúng ta "cấu trúc hóa" sự khám phá, biến nó thành một quy trình kỹ thuật có thể đo lường và cải tiến liên tục.

***

## 🔍 I. Hiểu rõ Vấn đề: Hỗn loạn của Exploration thuần túy

Trước khi nói đến giải pháp, chúng ta cần xác định vấn đề cốt lõi.

*   **Exploratory Testing (ET):** Là một phương pháp kiểm thử chủ động, trong đó Tester sử dụng kinh nghiệm và trực giác để tìm kiếm các lỗi không lường trước được mà không bị giới hạn bởi tài liệu test case cứng nhắc nào.
    *   *Ưu điểm:* Phát hiện các lỗ hổng phức tạp (edge cases) mà kịch bản tự động hóa hay thủ công khó với tới.
    *   *Hạn chế khi không có cấu trúc:*
        1.  **Thiếu Phạm vi (Scope Drift):** Tester dễ dàng đi chệch hướng, kiểm tra quá sâu vào một khu vực nhỏ thay vì bao phủ nhiều chức năng quan trọng.
        2.  **Khó Đo lường:** Khi kết thúc buổi ET, chúng ta khó trả lời câu hỏi: "Chúng ta đã test những gì?" và "Phạm vi nào còn bỏ sót?".
        3.  **Không có Tính Trách nhiệm (Accountability):** Kết quả thử nghiệm mang tính chủ quan cao.

Đây chính là lỗ hổng mà SBTM ra đời để giải quyết.

## 🌐 II. Giải pháp: Session-Based Test Management (SBTM)

SBTM không phải là một công cụ, mà là một **khung phương pháp luận (methodology)** được tạo ra bởi the ISTQB Foundation. Mục tiêu của nó là áp dụng các nguyên tắc quản lý dự án truyền thống (như xác định mục tiêu, thời gian, tài nguyên) vào quá trình kiểm thử khám phá.

Thay vì nói: "Hãy tự do tìm lỗi đi!", chúng ta chuyển thành: **"Trong 4 giờ tới, hãy tập trung tìm kiếm lỗ hổng về luồng xử lý giỏ hàng (Checkout Flow), giả định người dùng đang sử dụng trên thiết bị di động Android, và phải ghi lại tất cả các điều kiện biên gặp phải."**

SBTM cấu trúc buổi ET thành một phiên bản "có giới hạn" nhưng vẫn giữ được tinh thần tự do của khám phá.

### Các Thành phần cốt lõi của SBTM:

1.  **Test Charter (Điều lệ Thử nghiệm):**
    *   Đây là tài liệu quan trọng nhất, xác định rõ **Phạm vi (Scope)** và **Mục tiêu (Objectives)** của phiên kiểm thử.
    *   Nó trả lời câu hỏi: *Chúng ta đang test cái gì? Chúng ta muốn đạt được điều gì?*
2.  **Timebox (Khung thời gian):**
    *   Giới hạn về mặt thời gian, ví dụ: 3 giờ. Việc giới hạn thời gian buộc đội ngũ phải ưu tiên hóa và tập trung cao độ.
3.  **Roles (Vai trò):**
    *   Trong một phiên ET nhóm, các thành viên được phân vai rõ ràng (ví dụ: Test Lead, Tester, Recorder/Logger). Điều này tránh tình trạng mọi người cùng làm tất cả, dẫn đến sự lãng phí và thiếu tính chuyên nghiệp.

## 💡 III. Triển khai Thực tế: Thiết lập Cấu trúc Vận hành

Vậy trong thực tế, một QE Lead như chúng ta cần quản lý quá trình này bằng cách nào? Chúng ta phải xây dựng một quy trình ghi lại (logging) và theo dõi phạm vi (scope tracking).

Tôi xin phép minh họa bằng một kịch bản giả định về việc kiểm thử luồng đăng ký tài khoản người dùng mới.

### Ví dụ Mô phỏng Quản lý Phiên ET:

Trong môi trường thực tế, chúng ta có thể sử dụng các công cụ quản lý test case (như Jira/Xray, TestRail) để ghi nhận này. Nhưng về mặt nguyên tắc khoa học, nó được cấu trúc như sau:

```python
# Python Pseudocode mô phỏng quy trình SBTM
class SessionManager:
    def __init__(self, scope_focus, timebox_minutes):
        """Khởi tạo phiên kiểm thử với Charters rõ ràng."""
        self.scope_focus = scope_focus  # Ví dụ: "Đăng ký tài khoản (Registration Flow)"
        self.timebox = timebox_minutes  # Ví dụ: 180 phút (3 giờ)
        self.test_session_log = []
        print(f"[*] Bắt đầu phiên ET. Phạm vi: {scope_focus} | Thời gian: {self.timebox} phút.")

    def conduct_testing(self, tester_name, action, details):
        """Thực hiện một hành động kiểm thử và ghi lại chi tiết."""
        log_entry = {
            "Time": datetime.now(),
            "Tester": tester_name,
            "Action": action, # Hành động người dùng thực hiện (Ví dụ: Nhập email không hợp lệ)
            "Input Data": details['input'],
            "Expected Result": details['expected'],
            "Observed Bug/Deviation": details.get('bug', 'N/A'),
        }
        self.test_session_log.append(log_entry)
        print(f"[DEBUG] {tester_name}: Đã ghi lại Action: {action}")

    def finalize_and_report(self):
        """Tổng hợp kết quả sau khi hết Timebox."""
        total_bugs = len([item for item in self.test_session_log if "bug" in str(item)])
        covered_paths = set([item['Action'] for item in self.test_session_log])
        
        report = {
            "Status": "Completed",
            "Bugs Found": total_bugs,
            "Scope Covered Paths": len(covered_paths), # Số lượng luồng/chức năng được kiểm tra
            "Next Steps Recommendation": "Review edge case X và mở rộng phạm vi Y."
        }
        return report

# --- Thực thi Mô phỏng ---
from datetime import datetime

# 1. Thiết lập Charters (Define Scope & Timebox)
session = SessionManager(scope_focus="Đăng ký Tài khoản", timebox_minutes=120)

# 2. Thực hiện các Hành động khám phá (Execute Testing)
session.conduct_testing("Hùng", "Test với email có ký tự đặc biệt", {'input': 'abc@x$y', 'expected': 'Thành công'})
session.conduct_testing("Minh", "Kiểm tra trường Tên người dùng quá dài", {'input': 'ABCDEFGHIJKLMNOPQRSTUVWXYZX...', 'expected': 'Thông báo lỗi giới hạn kí tự'}) 
session.conduct_testing("Hùng", "Tạo tài khoản với thông tin trùng lặp", {'input': 'trung_lap@email.com', 'expected': 'Lỗi: Tài khoản đã tồn tại'}) 

# 3. Tổng kết và Báo cáo (Reporting)
final_report = session.finalize_and_report()
print("\n=============================")
print("BÁO CÁO PHIÊN ET HOÀN THÀNH:")
for key, value in final_report.items():
    print(f"-> {key}: {value}")

```

### Giải thích chi tiết các thành phần mã nguồn (Phân tích của QE Lead):

1.  **`__init__(self, scope_focus, timebox_minutes)`:**
    *   Đây là bước thiết lập mặt bằng chơi. Bằng cách đưa `scope_focus` và `timebox` vào hàm khởi tạo, chúng ta buộc cả đội phải đồng ý với các ràng buộc này **trước khi** bắt đầu. Điều này giúp giảm thiểu tình trạng *Scope Drift*.
2.  **`self.test_session_log = []`:**
    *   Đây là bộ nhớ quan trọng nhất. Thay vì chỉ ghi lại "Tìm thấy bug X", chúng ta ghi lại toàn bộ chuỗi hành động: **Ai làm gì $\rightarrow$ Với dữ liệu nào $\rightarrow$ Kết quả mong đợi là gì.** Điều này cung cấp tính *Traceability* cao cho việc báo cáo lỗi (bug reporting).
3.  **`conduct_testing(...)`:**
    *   Hàm này mô phỏng hành động thực tế của tester. Khi ghi lại `Action` và `Input Data`, chúng ta đang biến kinh nghiệm chủ quan thành dữ liệu định lượng. Nếu sau này cần tái lập bug, toàn bộ thông tin đã có sẵn.
4.  **`finalize_and_report()`:**
    *   Đây là nơi giá trị của SBTM tỏa sáng nhất. Nó không chỉ đếm số lỗi (`total_bugs`) mà còn tính toán `Scope Covered Paths`. Con số này cho Product Owner và PM thấy được: **"Chúng ta đã bao phủ qua những luồng xử lý nào?"** (ví dụ: 5/7 luồng đăng ký cơ bản đã được kiểm tra sâu).

## ✨ IV. Tóm tắt Lợi ích và Hành động của QE Lead

Khi áp dụng SBTM, chúng ta không chỉ thực hiện một buổi "chơi đùa tìm lỗi", mà chúng ta đang thực hiện một **Scientific Experiment** (Thí nghiệm Khoa học Chất lượng) có thể đo lường được.

| Đặc điểm | Exploratory Testing thuần túy | ET có cấu trúc bằng SBTM |
| :--- | :--- | :--- |
| **Tính tập trung** | Thấp, dễ đi lạc hướng. | Cao (Được định nghĩa bởi Test Charter). |
| **Tính đo lường** | Chủ quan (Dựa trên cảm giác). | Khách quan (Số lượng Paths được bao phủ). |
| **Báo cáo** | "Chúng tôi đã tìm thấy bug X, Y." | "Chúng tôi đã kiểm tra 5 luồng chính và 2 biên giới phức tạp. Chúng tôi đề xuất tăng cường kiểm thử vào khu vực Z." |
| **Tính tái lập** | Khó. | Dễ (Vì mọi hành động đều được ghi log). |

---

### Lời khuyên từ Hồng Dung:

Nếu đội nhóm của bạn muốn nâng tầm kỹ năng ET, đừng chỉ tập trung vào việc tìm bug. Hãy tập trung vào việc **ghi lại quá trình tìm kiếm bug**. Biến kinh nghiệm thành tài liệu (documentation) và dữ liệu (data).

Bằng cách kết hợp sự tự do sáng tạo của khám phá với kỷ luật quản lý của phiên làm việc có cấu trúc, chúng ta không chỉ cải thiện chất lượng phần mềm mà còn nâng tầm quy trình QA của đội nhóm bạn lên một cấp độ chuyên nghiệp, khoa học.

Chúc các bạn luôn thành công trong hành trình tìm kiếm và bảo vệ chất lượng sản phẩm!