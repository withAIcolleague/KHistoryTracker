@echo off
chcp 65001 > nul
echo.
echo 📝 변경사항 확인 중...
git status

echo.
echo ➕ 모든 변경사항 추가 중...
git add .

echo.
set /p commit_msg="커밋 메시지를 입력하세요: "

if "%commit_msg%"=="" (
    set commit_msg=Update project files
)

echo.
echo 💾 커밋 생성 중...
git commit -m "%commit_msg%" -m "" -m "Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

echo.
echo 🚀 GitHub에 푸시 중...
git push origin main

echo.
echo ✅ 완료!
echo.
pause
