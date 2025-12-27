@echo off
echo ========================================
echo 上传代码到 GitHub
echo ========================================
echo.
echo 请先确保：
echo 1. 已在 GitHub 上创建了新仓库
echo 2. 知道你的 GitHub 用户名和仓库名
echo.
set /p GITHUB_USER="请输入你的 GitHub 用户名: "
set /p REPO_NAME="请输入仓库名称: "
echo.
echo 正在添加远程仓库...
git remote add origin https://github.com/%GITHUB_USER%/%REPO_NAME%.git
if errorlevel 1 (
    echo 远程仓库已存在，正在更新...
    git remote set-url origin https://github.com/%GITHUB_USER%/%REPO_NAME%.git
)
echo.
echo 正在推送代码到 GitHub...
git branch -M main
git push -u origin main
echo.
echo ========================================
echo 完成！
echo ========================================
echo.
echo 如果推送成功，你现在可以：
echo 1. 访问 https://github.com/%GITHUB_USER%/%REPO_NAME% 查看代码
echo 2. 在 Netlify 中导入这个仓库进行部署
echo.
pause

