#!/bin/bash

# KHistoryTracker 변경사항 푸시 스크립트

echo "📝 변경사항 확인 중..."
git status

echo ""
echo "➕ 모든 변경사항 추가 중..."
git add .

echo ""
read -p "커밋 메시지를 입력하세요: " commit_msg

if [ -z "$commit_msg" ]; then
    commit_msg="Update project files"
fi

echo ""
echo "💾 커밋 생성 중..."
git commit -m "$commit_msg

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

echo ""
echo "🚀 GitHub에 푸시 중..."
git push origin main

echo ""
echo "✅ 완료!"
