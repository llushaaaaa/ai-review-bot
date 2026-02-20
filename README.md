# AI Review Bot

Бесплатный AI-бот для ревью кода в GitHub PR, использующий Google Gemini.

## Возможности

- ✅ Проверка качества кода
- 🔒 Анализ безопасности (SQL инъекции, XSS, секреты)
- ⚡ Проверка производительности
- 📝 Code style рекомендации

## Установка

### 1. Получи бесплатный API ключ Gemini

1. Перейди на [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Создай API ключ (бесплатно)

### 2. Добавь секрет в GitHub

1. Открой репозиторий → Settings → Secrets and variables → Actions
2. Создай секрет `GEMINI_API_KEY` с твоим ключом

### 3. Скопируй workflow

Скопируй папку `.github/workflows/` в корень твоего репозитория.

Если бот используется как отдельный репозиторий, измени `working-directory` в workflow.

## Использование в другом репозитории

Скопируй файл workflow и измени его:

```yaml
name: AI Code Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Clone AI Review Bot
        run: |
          git clone https://github.com/YOUR_USERNAME/ai-review-bot.git /tmp/ai-review-bot
          cd /tmp/ai-review-bot && npm ci

      - name: Run AI Review
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          GITHUB_REPOSITORY: ${{ github.repository }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
        run: node /tmp/ai-review-bot/src/reviewer.js
```

## Лимиты бесплатного Gemini

- 15 запросов в минуту
- 1 000 000 токенов в минуту
- 1 500 запросов в день

Для большинства проектов этого достаточно.

## Локальный тест

```bash
export GEMINI_API_KEY="your-key"
export GITHUB_TOKEN="your-token"
export GITHUB_REPOSITORY="owner/repo"
export PR_NUMBER="123"

npm run review
```
