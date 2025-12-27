# 教师 PDF 转 PPT 工具

一个帮助教师将 PDF 习题文件转换为 PPT 演示文稿的 Web 应用。

## 功能特性

- 📄 PDF 文件上传和预览
- ✂️ 鼠标框选裁剪区域
- 📑 幻灯片管理和编辑
- 🔄 幻灯片合并功能
- 📥 导出为 PPTX 格式
- 🎨 现代化的用户界面

## 技术栈

- React 19 + TypeScript
- Vite
- PDF.js (PDF 处理)
- pptxgenjs (PPT 生成)
- Tailwind CSS (样式)

## 本地开发

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3000 启动

### 构建生产版本

```bash
npm run build
```

## 部署

本项目已配置好 Netlify 部署，可以直接连接到 GitHub 仓库进行自动部署。

### Netlify 部署步骤

1. 将代码推送到 GitHub 仓库
2. 登录 [Netlify](https://www.netlify.com/)
3. 点击 "Add new site" -> "Import an existing project"
4. 选择你的 GitHub 仓库
5. 构建设置会自动识别（使用 `netlify.toml` 配置）
6. 点击 "Deploy site"

## 使用说明

1. 上传包含习题的 PDF 文件
2. 在 PDF 页面上使用鼠标框选需要裁剪的区域
3. 裁剪的区域会自动添加到幻灯片列表
4. 可以删除、合并幻灯片
5. 点击"导出 PPT"按钮生成 PPTX 文件

## 许可证

MIT License
