# Withdraw Test Assignment

Реализация страницы `Withdraw` на Next.js 14 App Router с TypeScript, Zustand, Jest и Playwright.

## Scripts

- `npm run dev` запускает локальный dev server
- `npm run build` собирает production build
- `npm run start` запускает production server
- `npm run test` запускает Jest
- `npm run test:e2e` запускает Playwright

## Stack

- Next.js 14
- React 18
- TypeScript
- Zustand
- Jest + React Testing Library + `jest-environment-jsdom`
- Playwright

## Реализовано

- форма `amount` / `destination` / `confirm`
- submit доступен только для валидной формы
- защита от двойного submit во время `loading`
- состояния `idle / loading / success / error`
- `POST /v1/withdrawals` и `GET /v1/withdrawals/{id}` через App Router
- отправка `idempotency_key`
- понятное сообщение для `409 Conflict`
- retry после сетевой ошибки без потери введенных данных
- отображение созданной заявки и ее статуса после успеха
- восстановление последней успешной заявки после reload в течение 5 минут

## Замечания по mock API

- mock API встроен в проект через Next.js route handlers
- для демонстрации `409` можно отправить `destination`, содержащий `conflict`
- access token не хранится в `localStorage`; в production-подходе токен стоило бы держать в `httpOnly` cookie или server session

## Run

```bash
npm install
npm run dev
```

## Test

```bash
npm run test
```

```bash
npm run test:e2e
```

Покрыты сценарии:

- happy-path submit
- API error (`409`)
- защита от двойного submit
- E2E happy-path submit

## Acceptance

- `npm run dev` стартует
- `npm run test` проходит
- `npm run test:e2e` проходит
- `npm run build` проходит

## Notes

- E2E запускается на отдельном dev server `127.0.0.1:3100`, чтобы не конфликтовать с обычным `npm run dev`
- mock API хранит заявки in-memory через Next.js route handlers, этого достаточно для тестового задания

# withdraw
