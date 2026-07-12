export const siteConfig = {
  name: "Hung Tran Manh",
  title: "Senior Quality Engineer / Enthusiast Quality Consultant",
  description: "Portfolio website of Hung Tran Manh - Senior Quality Engineer specializing in resilient automation systems, CI/CD pipelines, and AI-integrated QA.",
  accentColor: "#1d4ed8", // Bạn có thể đổi màu này nếu muốn
  
  social: {
    email: "manhhung9510@gmail.com",
    linkedin: "https://www.linkedin.com/in/h%C3%B9ng-tr%E1%BA%A7n-ab866819a/",
    twitter: "",
    github: "",
  },
  
  aboutMe:
    "Hello! I’m a Senior Quality Engineer & Enthusiast Quality Consultant. My testing journey started from curiosity and grew into a real passion. I love building resilient automation systems, stabilizing CI/CD pipelines, and recently I’ve been experimenting with how AI can support testers. “Every time I automate a test workflow, the product becomes more resilient.”",
    
  skills: [
    "Katalon", "Appium", "Playwright", "WebdriverIO", 
    "C#", "Selenium", "Docker", "Jenkins", 
    "TypeScript", "SQL", "Postman", "BDD"
  ],
  
  projects: [
    {
      name: "AI-Integrated QA Workflows",
      description:
        "Experimenting and integrating AI tools into quality assurance processes to enhance test coverage and reduce manual effort in banking domains.",
      link: "#", // Thay bằng link bài viết hoặc repo nếu có
      skills: ["AI", "Test Automation", "QA Strategy"],
    },
    {
      name: "Mobile Automation Framework (CBX Australia)",
      description:
        "Established a robust mobile automation framework using TypeScript, Perfecto Device Farm, and Applitools for banking applications.",
      link: "#",
      skills: ["TypeScript", "Perfecto", "Applitools", "WebdriverIO"],
    },
    {
      name: "Custom Report Comparison Tool",
      description:
        "Built custom tools for automated report file comparison, decreasing manual testing time by 40% at TOOGOOD Canada.",
      link: "#",
      skills: ["C#", "Automation Tools", "Efficiency"],
    },
  ],
  
  experience: [
    {
      company: "CBX Australia",
      title: "Senior Automation QE",
      dateRange: "Sep 2023 - Present",
      bullets: [
        "Established mobile automation framework for banking apps using TypeScript, Perfecto, WebdriverIO/CucumberJS, and Playwright.",
        "Integrated UI visual checks via Applitools Execution Cloud and automated test execution in Jenkins CI/CD pipeline.",
        "Focused on Banking and Chatbot domains with Docker containerization.",
      ],
    },
    {
      company: "TOOGOOD Canada",
      title: "Senior Automation QC",
      dateRange: "Sep 2021 - Sep 2023",
      bullets: [
        "Built custom tools for report file comparison, significantly reducing manual verification effort.",
        "Managed testing activities within a 5-member QC team focusing on desktop automation and financial domain.",
        "Utilized C#, FlaUI, TestComplete, Zephyr, and Jira/Xray for comprehensive test management.",
      ],
    },
    {
      company: "BFSI Vietnam",
      title: "Senior Quality Consultant - Test Lead",
      dateRange: "Jun 2020 - Sep 2020",
      bullets: [
        "Led a 5-member team providing automation and CI/CD solutions to top Banking & Financial Services companies.",
        "Conducted PoCs for Web, Mobile, Windows, and API solutions using Katalon, Selenium, Serenity BDD, and Appium.",
        "Managed end-to-end test strategies and device lab integrations.",
      ],
    },
    {
      company: "GIC Singapore",
      title: "Senior QC",
      dateRange: "Jun 2020 - Sep 2020",
      bullets: [
        "Managed testing activities for real estate web applications.",
        "Integrated automation frameworks with ReportPortal.io and Electric Flow for enhanced reporting.",
        "Performed database validation using SQL alongside Katalon automation.",
      ],
    },
    {
      company: "O2E Canada",
      title: "Senior QC",
      dateRange: "Dec 2019 - Jun 2020",
      bullets: [
        "Created an extendable test automation framework using Katalon designed specifically for non-technical customers.",
        "Delivered web app automation solutions for home services clients in both remote and onsite setups.",
      ],
    },
    {
      company: "Qtest System Worldwide",
      title: "Data Migration Specialist",
      dateRange: "Jan 2018 - Dec 2019",
      bullets: [
        "Led data migration projects and built necessary migration scripts for enterprise clients.",
        "Developed manual test cases and supported the development of a proprietary data comparison tool.",
      ],
    },
  ],
  
  education: [
    {
      school: "Professional Certifications & Training",
      degree: "Quality Engineering & Test Automation",
      dateRange: "Continuous Learning",
      achievements: [
        "Achieved 50% increase in test coverage across multiple projects",
        "Reduced overall test cycle time by 30% through effective automation",
        "Led teams to achieve 80% defect detection rate",
        "Developed custom tools decreasing manual testing time by 40%",
      ],
    },
  ],
};