# 上传到 GitHub 的步骤

## 已完成的工作
✅ Git 仓库已初始化
✅ 所有文件已添加到暂存区
✅ 已创建初始提交
✅ 已创建 Netlify 配置文件
✅ 已更新 README.md

## 接下来的步骤

### 1. 在 GitHub 上创建新仓库

1. 登录 GitHub: https://github.com
2. 点击右上角的 "+" 号，选择 "New repository"
3. 填写仓库信息：
   - Repository name: `teacher-ppt-splitter` (或你喜欢的名字)
   - Description: `教师 PDF 转 PPT 工具`
   - 选择 Public 或 Private
   - **不要**勾选 "Initialize this repository with a README"（我们已经有了）
4. 点击 "Create repository"

### 2. 推送代码到 GitHub

在终端中运行以下命令（将 YOUR_USERNAME 和 REPO_NAME 替换为你的实际信息）：

```bash
cd teacher-ppt-splitter2

# 添加远程仓库（替换为你的 GitHub 仓库地址）
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# 或者使用 SSH（如果你配置了 SSH key）
# git remote add origin git@github.com:YOUR_USERNAME/REPO_NAME.git

# 推送代码
git branch -M main
git push -u origin main
```

### 3. 部署到 Netlify

1. 登录 [Netlify](https://www.netlify.com/)
2. 点击 "Add new site" -> "Import an existing project"
3. 选择 "GitHub" 并授权
4. 选择你刚创建的仓库
5. Netlify 会自动检测配置：
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`
6. 点击 "Deploy site"
7. 等待部署完成（通常需要 1-2 分钟）

### 4. 配置环境变量（如果需要）

如果将来需要添加环境变量（如 API keys），可以在 Netlify 的 Site settings -> Environment variables 中添加。

## 快速命令（复制后替换 YOUR_USERNAME 和 REPO_NAME）

```bash
cd teacher-ppt-splitter2
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

