---
title: "Ứng dụng Generative AI và Large Language Models trong việc tối ưu hóa kịch bản kiểm thử"
date: 2026-07-16
description: "Khám phá cách GenAI và LLM thay đổi vai trò của Tester: Từ viết thủ công sang kiến trúc sư kịch bản kiểm thử thông minh."
tags: ["AI in Testing","GenAI","LLM"]
imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600"
author: "Trí Trần"
---

# Ứng dụng Generative AI và Large Language Models trong việc tối ưu hóa kịch bản kiểm thử

**Tác giả:** Trí Trần | **Chuyên môn:** Quality Engineer Lead

***

Trong thập kỷ qua, lĩnh vực Kiểm định Chất lượng (QA) đã chứng kiến sự chuyển mình ngoạn mục nhờ các công cụ tự động hóa. Tuy nhiên, một "nút cổ chai" cố hữu vẫn tồn tại: việc xây dựng kịch bản kiểm thử (test case) ở quy mô lớn và độ phủ cao đòi hỏi nguồn lực khổng lồ về thời gian và trí tuệ con người. Các Tester giỏi phải dành phần lớn năng lượng để dịch các yêu cầu kinh doanh mơ hồ thành các bước kiểm tra rõ ràng, mạch lạc—một quá trình vừa tốn sức lại dễ bị bỏ sót góc nhìn.

Nếu bạn đã từng vật lộn với việc đối chiếu hàng trăm trang tài liệu yêu cầu (PRD) với một bộ test case chưa bao phủ hết các tình huống biên (edge cases), bài viết này dành cho bạn.

Là một QE Lead, tôi tin rằng tương lai của QA không chỉ nằm ở công cụ tự động hóa ghi lại thao tác người dùng, mà còn nằm ở khả năng *hiểu và suy luận* các yêu cầu đó. Và đây chính là lúc Generative AI (GenAI) cùng Large Language Models (LLMs) bước vào để thay đổi cuộc chơi.

## 💡 LLM & GenAI: Vượt qua việc "Tự động hóa thủ công"

Trước khi đi sâu vào ứng dụng, chúng ta cần định nghĩa rõ ràng vai trò của các mô hình này trong ngữ cảnh QA.

**Generative AI (GenAI)** là thuật ngữ bao quát chỉ khả năng tạo ra nội dung mới (văn bản, code, hình ảnh) dựa trên dữ liệu đã được học.
**Large Language Models (LLMs)** là một loại GenAI chuyên về ngôn ngữ. Chúng không chỉ đơn thuần tra cứu thông tin mà còn có khả năng *suy luận* (reasoning), *tóm tắt*, *dịch*, và quan trọng nhất trong QA: **biến đổi cấu trúc dữ liệu từ văn bản tự nhiên thành định dạng máy tính có thể thực thi.**

Thay vì yêu cầu AI viết test case, chúng ta sẽ dùng nó để phân tích các đầu vào (Input) là tài liệu Yêu cầu Kinh doanh, sau đó xuất ra các tập hợp kịch bản kiểm thử đã được cấu trúc sẵn.

## 🚀 Ba Trụ Cột Ứng Dụng Thiết Thực Nhất

Tôi xin trình bày ba khu vực mà GenAI mang lại giá trị đột phá cho đội ngũ QE/QA:

### 1. Từ Yêu cầu sang Test Case (Requirement-to-Test Mapping)

Đây là ứng dụng mạnh mẽ nhất. Các yêu cầu kinh doanh (BRDs) thường được viết bằng ngôn ngữ tự nhiên, rất mạch lạc nhưng thiếu tính máy móc. LLMs có thể nhận tài liệu này và thực hiện:
*   **Phân tích Yêu cầu:** Tách các chức năng, các điều kiện ràng buộc (constraints), và hành vi mong muốn (expected behavior).
*   **Tạo kịch bản cơ bản:** Chuyển đổi từng yêu cầu thành các User Stories và Test Steps.
*   **Bổ sung các Case phủ định/Biên:** Quan trọng hơn, LLM còn có khả năng tự động nhắc nhở về những điều *chưa được nói* nhưng cần phải kiểm tra (ví dụ: kiểm tra hiệu suất khi tải 0 người dùng hoặc trên đường truyền cực chậm).

### 2. Tối ưu hóa Kịch bản và Coverage Gap Analysis

Nếu bạn đã có một bộ test case, LLMs không chỉ dừng lại ở việc sao chép. Chúng còn hoạt động như một "đồng nghiệp trưởng thành" (Senior Peer Reviewer) chuyên về góc độ chất lượng:

*   **Phân tích Độ phủ:** So sánh các bước kiểm thử hiện tại với phạm vi yêu cầu gốc để xác định những khoảng trống lớn nhất (*Coverage Gaps*).
*   **Kiểm tra Tính mâu thuẫn:** Nhận diện các hành vi của User Story có thể xung đột nhau (ví dụ: "Người dùng A được phép chỉnh sửa giá" và "Hệ thống không cho phép thay đổi giá nếu là sản phẩm khuyến mãi").

### 3. Sinh mã kiểm thử tự động (Test Code Generation)

Một bước tiến vượt bậc. Sau khi xác định kịch bản, LLMs có thể sinh các đoạn *bản nháp code* cho kịch bản đó trong ngôn ngữ automation phổ biến của bạn (Selenium with Python/Java, Playwright, Cypress).

**Ví dụ:**
*   *Yêu cầu:* "Khi người dùng điền email không hợp lệ và nhấn Submit, hệ thống phải hiển thị thông báo 'Email format is incorrect' với mã lỗi E001."
*   *Input cho LLM:* Yêu cầu trên + Ngôn ngữ Automation (Python/Selenium).
*   *Output của LLM:* Đoạn code `findElement(By.id("email")).sendKeys("abc"); driver.findElement(By.id("submit")).click(); Assert.assertTrue("Email format is incorrect".isDisplayed());`

## 💻 Minh họa Thực tế: Trí Trần Demo Quy trình Prompt Engineering

Để hình dung rõ nhất, tôi xin minh họa một đoạn mã giả (Pseudocode) về cách chúng ta sử dụng API LLM để thực hiện việc chuyển đổi yêu cầu thành kịch bản kiểm thử theo định dạng Gherkin — một tiêu chuẩn vàng trong Behavior Driven Development (BDD).

Giả sử, chúng ta có tài liệu yêu cầu: *“Người dùng cần phải đăng ký bằng email và mật khẩu. Sau khi đăng nhập thành công, hệ thống phải chuyển hướng họ đến trang Dashboard.”*

```python
import openai # Giả định sử dụng OpenAI API hoặc tương đương

# 1. Định nghĩa vai trò (Role) và Mục tiêu (Goal) cho AI
system_prompt = "You are an expert QA Engineer specializing in BDD and Gherkin format. Your task is to convert a vague business requirement into precise, comprehensive, and structured test scenarios."

# 2. Input là yêu cầu kinh doanh thô
business_requirement = """Người dùng cần phải đăng ký bằng email và mật khẩu. Sau khi đăng nhập thành công, hệ thống phải chuyển hướng họ đến trang Dashboard."""

# 3. Xây dựng Prompt chính (Instruction)
user_prompt = f"""
Analyze the following requirement: '{business_requirement}'.
Generate a complete set of test scenarios using Gherkin syntax (Feature, Scenario, Given, When, Then).
The scenarios MUST cover:
1. Happy Path (Thành công)
2. Edge Cases (Vấn đề biên)
3. Negative Cases (Lỗi/Không hợp lệ)

Return only the structured markdown output."""


# 4. Gọi API và nhận kết quả
try:
    response = openai.ChatCompletion.create(
        model="gpt-4o",  # Sử dụng mô hình mạnh để suy luận logic tốt nhất
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    )
    generated_test_cases = response.choices[0].message['content']

except Exception as e:
    print(f"Lỗi API: {e}")
    generated_test_cases = None

# Hiển thị kết quả đã được LLM tạo ra
if generated_test_cases:
    print("--- Kịch bản kiểm thử được AI tối ưu hóa ---")
    print(generated_test_cases)
```

### 🔬 Giải thích của Trí Trần về Đoạn Code trên:

1. **`system_prompt` (Thiết lập vai trò):** Đây là bước *quan trọng nhất* trong kỹ thuật Prompt Engineering. Thay vì chỉ hỏi "Hãy viết test case," chúng ta buộc LLM phải đóng vai một "QE Expert" chuyên về BDD/Gherkin. Điều này giúp model điều chỉnh giọng văn, cấu trúc output và góc nhìn suy luận theo tiêu chuẩn ngành.
2. **`user_prompt` (Tăng cường hướng dẫn):** Chúng ta không chỉ cung cấp yêu cầu (`business_requirement`) mà còn đặt ra các *ràng buộc* (constraints) cho Output: phải bao gồm Happy Path, Edge Cases và Negative Cases. Điều này đảm bảo AI thực hiện việc suy luận sâu thay vì chỉ tóm tắt bề mặt.
3. **Model Selection (`gpt-4o`):** Đối với các tác vụ phức tạp yêu cầu khả năng lý giải và suy luận logic cao (như QA), chúng ta cần những mô hình tiên tiến nhất, không nên dùng các model cơ bản hơn.
4. **Output: Gherkin Format:** Yêu cầu LLM xuất ra định dạng BDD (Feature -> Scenario -> Given/When/Then) giúp kết quả cực kỳ dễ tích hợp vào các công cụ như Cucumber hoặc SpecFlow.

---
*(Giả lập Output từ AI sau khi chạy code)*
***

## 🛑 Những Cạm bẫy và Nguyên tắc Vận hành của QE Lead

Cuối cùng, là một chuyên gia Chất lượng, tôi phải nhắc bạn về những điều cẩn trọng cần nhớ khi làm việc với công nghệ này. GenAI không phải là viên đạn bạc (Silver Bullet). Nó là một *trợ lý siêu cấp* (Super-Powered Assistant), chứ không phải người thay thế Tester.

1. **Nguy cơ Hallucination (Ảo giác):** LLMs có xu hướng "bịa ra" các dữ kiện hoặc bước kiểm thử nghe rất hợp lý nhưng hoàn toàn sai về mặt kỹ thuật hoặc nghiệp vụ. **Bạn luôn phải là người xác minh cuối cùng.**
2. **Tùy chỉnh Prompt (Prompt Engineering):** Chất lượng Output phụ thuộc 90% vào chất lượng Input (Prompts). Hãy đào sâu nghiên cứu các mẫu prompt để buộc AI suy luận chính xác theo ngữ cảnh công ty bạn.
3. **Kiến thức Miền (Domain Knowledge) Bắt Buộc:** LLM không hiểu được *ý nghĩa* kinh doanh của một thuật ngữ chuyên ngành trong lĩnh vực cụ thể của bạn (ví dụ: nghiệp vụ ngân hàng, luật thuế). Bạn phải là người cung cấp lớp lọc kiến thức này.

## Lời Kết

Generative AI và LLMs đang định vị lại vai trò của chúng ta từ những "người thực thi các kịch bản kiểm thử" thành **"kiến trúc sư yêu cầu chất lượng"** (Quality Requirement Architects). Công việc của Tester trong kỷ nguyên này là hướng dẫn, đặt câu hỏi đúng (Ask the right questions), và điều khiển AI để nó tối ưu hóa phạm vi bao phủ.

Hãy bắt đầu thí điểm việc tích hợp các công cụ này vào quy trình CI/CD của bạn ngay hôm nay. Tôi tin rằng đây sẽ là bước nhảy vọt quan trọng nhất trong sự nghiệp QA của bạn!