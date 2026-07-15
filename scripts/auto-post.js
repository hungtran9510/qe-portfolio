import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BLOG_DIR = path.join(__dirname, '../src/content/blog');

async function generateAndPost() {
  console.log("🤖 Đang yêu cầu Gemma 4 E4B viết bài...");
  
  const prompt = "Viết một bài blog ngắn (khoảng 300 từ) về chủ đề Test Automation và DevOps Integration bằng tiếng Việt. Trả về định dạng Markdown.";
  
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      body: JSON.stringify({ 
        model: 'gemma4:e4b', 
        prompt: prompt, 
        stream: false 
      })
    });
    
    const data = await response.json();
    const content = data.response;
    const slug = `post-${Date.now()}`;
    const filePath = path.join(BLOG_DIR, `${slug}.md`);

    // Tạo nội dung file Markdown hoàn chỉnh
    const mdFile = `---
title: "AI Generated Post: ${new Date().toLocaleDateString()}"
date: ${new Date().toISOString().split('T')[0]}
description: "Bài viết được tạo tự động bởi Gemma 4 E4B"
tags: ["ai", "automation", "devops"]
---

${content}
`;

    fs.writeFileSync(filePath, mdFile);
    console.log(`✅ Đã tạo bài viết tại: ${filePath}`);

    // Tự động Commit và Push
    exec('git add . && git commit -m "feat: auto post by Gemma 4 E4B" && git push', (err) => {
      if (err) console.error("❌ Lỗi khi push:", err);
      else console.log("🚀 Đã push lên Github. Vercel/Netlify sẽ tự rebuild site!");
    });

  } catch (error) {
    console.error("❌ Lỗi kết nối Ollama:", error);
  }
}

generateAndPost();