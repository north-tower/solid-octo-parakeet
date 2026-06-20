# Gamer Mining Rewards Backend

Backend for a gamified crypto-mining rewards platform focused on gamers.

The idea is simple:
- users allow the app to use part of their computer power for Monero mining;
- the platform tracks mining value and keeps a 20% commission;
- users do not see a boring money dashboard first, they see coins, XP, levels, and reward progression;
- rewards are redeemed as game currencies, gift cards, and similar gamer-friendly items.

## Current Status

Project status as of now:
- Phase 1 is done: database foundation and authentication are implemented.
- Phase 2 is done: core gamification logic is implemented in the backend.
- Phase 3 is done: referral earnings logic and referral dashboard endpoints are implemented.
- Phase 4 is done: rewards catalog, redemption requests, and manual fulfillment are implemented.
- Phase 5 is in progress: backend mining telemetry is implemented and the Electron desktop app scaffold is available under `desktop/`; XMRig bundling and production packaging are still pending.

## Feature Checklist

| Area | Feature | Status | Notes |
| --- | --- | --- | --- |
| Auth | Register user | Done | JWT-based auth flow exists |
| Auth | Login user | Done | Returns access token and user profile |
| Users | Get current user profile | Done | Available via `GET /users/me` |
| Database | Core schema for mining, XP, referrals, rewards, payouts | Done | Prisma schema is already in place |
| Database | Seeded level config | Done | Level thresholds and referral percentages seeded |
| Database | Seeded reward catalog | Done | Starter catalog exists for MVP |
| Gamification | Update mining power | Done | Supports `0` to `90` |
| Gamification | Start mining session | Done | Prevents multiple active sessions |
| Gamification | Complete mining session | Done | Settles coins, XP, and level changes |
| Gamification | XP bonus rule | Done | `5 XP` per full hour above `80%` power |
| Gamification | Level progression | Done | Resolved from `level_config` |
| Gamification | Coin transaction history | Done | Stored in `coin_transactions` |
| Gamification | XP event history | Done | Stored in `xp_events` |
| Gamification | Dashboard endpoint | Done | Returns progression, wallet, activity, and mining summary |
| Referrals | Referral code at signup | Done | Referrer relationship can already be stored |
| Referrals | Referral earnings calculation | Done | Credited from platform commission on session completion |
| Referrals | Referral dashboard data | Done | Available via `GET /referrals/me` |
| Rewards | Reward listing by game | Done | Available via `GET /rewards/games` and `GET /rewards/games/:gameSlug` |
| Rewards | Reward redemption flow | Done | Users create pending requests via `POST /rewards/requests` |
| Rewards | Manual fulfillment workflow | Done | Protected by `FULFILLMENT_API_KEY` under `/rewards/fulfillment` |
| Desktop Mining | Session heartbeat telemetry | Done | `POST /gamification/mining-sessions/:sessionId/heartbeat` |
| Desktop Mining | Session abort flow | Done | `POST /gamification/mining-sessions/:sessionId/abort` |
| Desktop Mining | Server-side coin settlement | Done | Coins derived from `rawMinedValue` at `3.125` coins per user-reward unit |
| Desktop Mining | Electron shell | Done | `desktop/` app with auth + dashboard |
| Desktop Mining | XMRig process control | Done | Uses local XMRig when configured, simulated mode otherwise |
| Desktop Mining | Real miner -> backend reporting | Done | Heartbeats + session complete wired to API |

## Roadmap Timeline

| Phase | Name | Status | Goal | Output |
| --- | --- | --- | --- | --- |
| 1 | Database + Auth | Done | Build the foundation everything depends on | Prisma schema, JWT auth, seeded config, profile flow |
| 2 | Gamification Engine | Done | Lock in the core business math and progression loop | XP, levels, coins, dashboard, session settlement |
| 3 | Referral System | Done | Pay referrers from platform commission using level-based percentages | Referral earnings logic, referral stats endpoints |
| 4 | Rewards Store | Done | Let users exchange coins for gamer rewards | Reward browsing, redemption requests, fulfillment workflow |
| 5 | Mining Integration | In Progress | Connect the real desktop miner to the backend | Desktop app + API wiring done; packaging/hardening pending |

## Small Architecture

Current backend structure in simple terms:
- `NestJS API layer` handles authentication, protected routes, DTO validation, and module boundaries.
- `Prisma data layer` reads and writes all persistent state in PostgreSQL.
- `Auth module` manages registration, login, JWT issuance, and referral-code-aware signup.
- `Users module` exposes profile data for the logged-in user.
- `Gamification module` contains mining session settlement, XP, levels, coins, dashboard aggregation, heartbeats, abort handling, and trusted coin calculation.
- `Referrals module` contains Phase 3 referral earnings settlement and referral dashboard aggregation.
- `Rewards module` contains Phase 4 reward catalog browsing, redemption requests, and manual fulfillment.
- `Seed data` initializes level thresholds, referral percentages, and a starter reward catalog.

Current request flow:
1. the client authenticates with JWT;
2. the client starts a mining session through the API;
3. the desktop client sends periodic heartbeats with power, hashrate, and share telemetry;
4. the client completes or aborts the session through the API;
5. the gamification service validates telemetry, applies business rules for XP and server-calculated coins, and settles referrals;
6. Prisma persists balances, `MiningPowerSample` rows, coin transactions, and the mining session summary.

Planned high-level architecture still to finish:
1. `Desktop app` will run Electron and manage the local miner process;
2. `Miner integration` will collect hashrate, duration, and CPU usage data from XMRig;
3. `Backend API` already receives session heartbeats and settles progression/rewards;
4. `Referral subsystem` calculates commission sharing from platform fees.

## ERD-Style Schema Summary

Core entity relationships:

```text
User
 ├─ has many RefreshToken
 ├─ has many MiningSession
 ├─ has many XpEvent
 ├─ has many CoinTransaction
 ├─ has many RewardRequest
 ├─ has many Payout
 ├─ has many referrals -> User
 └─ may belong to referrer -> User

MiningSession
 ├─ belongs to User
 ├─ has many MiningPowerSample
 ├─ has many XpEvent
 └─ has many ReferralEarning

XpEvent
 ├─ belongs to User
 └─ may belong to MiningSession

CoinTransaction
 └─ belongs to User

ReferralEarning
 ├─ belongs to referrer -> User
 ├─ belongs to referred user -> User
 └─ belongs to MiningSession

RewardRequest
 ├─ belongs to User
 └─ belongs to RewardCatalog

Payout
 └─ belongs to User

LevelConfig
 └─ defines XP thresholds and referral percentages
```

Schema responsibility summary:
- `User` stores identity, referral ownership, XP, level, coin balance, and mining power preference.
- `MiningSession` stores the economic and activity summary of a mining run.
- `MiningPowerSample` is ready for future fine-grained power telemetry.
- `XpEvent` records why XP was awarded.
- `CoinTransaction` records changes to the internal coin balance.
- `ReferralEarning` is prepared for Phase 3 commission sharing.
- `RewardCatalog` and `RewardRequest` support the future rewards store.
- `Payout` supports future referral or manual payout flows.
- `LevelConfig` keeps progression logic configurable instead of hardcoded.

## What Has Been Built

### Phase 1: Database + Auth

Implemented:
- PostgreSQL + Prisma schema
- JWT authentication
- user registration and login
- referral code generation at signup
- user profile endpoint
- seeded level configuration
- seeded starter reward catalog

Current data models include:
- `User`
- `RefreshToken`
- `LevelConfig`
- `MiningSession`
- `MiningPowerSample`
- `XpEvent`
- `CoinTransaction`
- `ReferralEarning`
- `RewardCatalog`
- `RewardRequest`
- `Payout`

Business-ready schema fields already exist for:
- XP and level tracking
- coin balance
- mining session tracking
- referral relationships
- reward requests
- payouts
- mining power selection

### Phase 2: Gamification Engine

Implemented:
- dedicated `gamification` module
- mining power update endpoint
- mining session start endpoint
- mining session completion endpoint
- dashboard endpoint for progression and recent activity
- XP calculation for time mined above 80% power
- level resolution from `level_config`
- coin reward crediting
- platform commission split calculation
- mining session settlement in a single transaction
- persistence of XP events
- persistence of coin transactions
- active session protection so a user cannot start multiple active sessions

Current gamification rules implemented:
- users can set mining power from `0` to `90`
- XP bonus rule is `5 XP` per full hour mined above `80%` power
- level progression is resolved from seeded `level_config`
- platform commission is `20%`
- user reward value is `80%`

## Current API Surface

### Auth

- `POST /auth/register`
- `POST /auth/login`

### Users

- `GET /users/me`

### Gamification

- `GET /gamification/me`
- `PATCH /gamification/me/mining-power`
- `POST /gamification/mining-sessions/start`
- `POST /gamification/mining-sessions/:sessionId/heartbeat`
- `POST /gamification/mining-sessions/:sessionId/abort`
- `POST /gamification/mining-sessions/:sessionId/complete`

### Referrals

- `GET /referrals/me`

### Rewards

- `GET /rewards/games`
- `GET /rewards/games/:gameSlug`
- `POST /rewards/requests`
- `GET /rewards/requests/me`

### Rewards Fulfillment

Requires `x-api-key` header matching `FULFILLMENT_API_KEY`.

- `GET /rewards/fulfillment/requests`
- `PATCH /rewards/fulfillment/requests/:requestId/fulfill`
- `PATCH /rewards/fulfillment/requests/:requestId/reject`

## Phase 2 API Examples

All gamification endpoints below require a bearer token.

### `GET /gamification/me`

Example response:

```json
{
  "profile": {
    "id": "a0d79db2-92dd-42af-aeb6-320ce4d9c3d4",
    "email": "player@example.com",
    "displayName": "NightRaider",
    "referralCode": "AB12CD34",
    "miningPowerPercent": 50,
    "referralsCount": 0,
    "createdAt": "2026-06-12T10:00:00.000Z"
  },
  "progression": {
    "xp": 505,
    "level": 2,
    "referralPercent": 12,
    "currentLevelXpFloor": 500,
    "nextLevelXpTarget": 1050,
    "xpToNextLevel": 545
  },
  "wallet": {
    "coinBalance": "125.00000000"
  },
  "mining": {
    "completedSessions": 3,
    "totalSecondsMined": 12600,
    "totalBonusEligibleSeconds": 7200,
    "totalRawMinedValue": "18.50000000",
    "totalRewardValue": "14.80000000"
  },
  "activeSession": {
    "id": "94ffb0cb-22d8-4ca2-92a5-77c93b43d01f",
    "startedAt": "2026-06-12T12:00:00.000Z",
    "status": "ACTIVE"
  },
  "recentXpEvents": [
    {
      "id": "5871f9cf-5732-4f12-bd1b-3ce0ca4e8cb1",
      "amount": 5,
      "reason": "MINING_HOUR_BONUS",
      "miningSessionId": "94ffb0cb-22d8-4ca2-92a5-77c93b43d01f",
      "createdAt": "2026-06-12T13:00:00.000Z"
    }
  ],
  "recentCoinTransactions": [
    {
      "id": "b0560926-a44d-4880-a838-ec46ca314d9a",
      "amount": "25.00000000",
      "type": "MINING_REWARD",
      "referenceType": "mining_session",
      "referenceId": "94ffb0cb-22d8-4ca2-92a5-77c93b43d01f",
      "balanceAfter": "125.00000000",
      "createdAt": "2026-06-12T13:00:00.000Z"
    }
  ]
}
```

### `PATCH /gamification/me/mining-power`

Example request:

```json
{
  "miningPowerPercent": 20
}
```

Example response:

```json
{
  "miningPowerPercent": 20
}
```

### `POST /gamification/mining-sessions/start`

Example request:

```json
{
  "miningPowerPercent": 65
}
```

Example response:

```json
{
  "id": "94ffb0cb-22d8-4ca2-92a5-77c93b43d01f",
  "status": "ACTIVE",
  "startedAt": "2026-06-12T12:00:00.000Z",
  "miningPowerPercent": 65
}
```

### `POST /gamification/mining-sessions/:sessionId/complete`

Example request:

```json
{
  "totalSeconds": 3600,
  "secondsAbove80Percent": 3600,
  "rawMinedValue": "10.00000000",
  "avgPowerPercent": 82,
  "peakPowerPercent": 90,
  "hashrate": "2500.00000000",
  "sharesAccepted": 4
}
```

When heartbeats exist, duration and power aggregates are derived server-side from `MiningPowerSample` rows. Sessions longer than `60` seconds require at least one heartbeat before completion. Coin rewards are calculated server-side from `rawMinedValue`.

Example response:

```json
{
  "session": {
    "id": "94ffb0cb-22d8-4ca2-92a5-77c93b43d01f",
    "status": "COMPLETED",
    "startedAt": "2026-06-12T12:00:00.000Z",
    "endedAt": "2026-06-12T13:00:00.000Z",
    "totalSeconds": 3600,
    "secondsAbove80Percent": 3600,
    "avgPowerPercent": "82",
    "peakPowerPercent": "90",
    "rawMinedValue": "10",
    "platformCommission": "2",
    "userRewardValue": "8"
  },
  "rewards": {
    "coinAmount": "25.00000000",
    "balanceAfter": "125.00000000"
  },
  "progression": {
    "xpEarned": 5,
    "totalXp": 505,
    "previousLevel": 1,
    "currentLevel": 2,
    "leveledUp": true,
    "xpToNextLevel": 545
  }
}
```

### Notes On The Payloads

- Decimal values are generally returned as strings.
- `coinAmount` in the completion response is calculated server-side from `rawMinedValue` using `3.125` coins per user-reward unit.
- `rawMinedValue`, `platformCommission`, and `userRewardValue` represent the economic split of the mining session.
- The XP rule only awards points for full qualified hours above `80%` power.

## Phase 3 API Examples

All referral endpoints below require a bearer token.

### `GET /referrals/me`

Example response:

```json
{
  "profile": {
    "referralCode": "AB12CD34",
    "referralsCount": 2
  },
  "progression": {
    "level": 2,
    "xp": 600,
    "referralPercent": 12,
    "currentLevelXpFloor": 500,
    "nextLevelXpTarget": 1050,
    "xpToNextLevel": 450,
    "nextLevelReferralPercent": 14
  },
  "earnings": {
    "totalEarned": "3.50000000",
    "totalSessions": 4
  },
  "referredUsers": [
    {
      "id": "a0d79db2-92dd-42af-aeb6-320ce4d9c3d4",
      "displayName": "NightRaider",
      "email": "player@example.com",
      "joinedAt": "2026-06-01T10:00:00.000Z",
      "totalEarnedFromUser": "3.50000000",
      "sessionsCount": 4
    }
  ],
  "recentEarnings": [
    {
      "id": "5871f9cf-5732-4f12-bd1b-3ce0ca4e8cb1",
      "amountEarned": "0.75000000",
      "commissionBase": "2.00000000",
      "referrerRate": "12",
      "referredUser": {
        "id": "a0d79db2-92dd-42af-aeb6-320ce4d9c3d4",
        "displayName": "NightRaider",
        "email": "player@example.com"
      },
      "miningSessionId": "94ffb0cb-22d8-4ca2-92a5-77c93b43d01f",
      "createdAt": "2026-06-12T13:00:00.000Z"
    }
  ]
}
```

### Referral Payout On Session Completion

When a referred user completes a mining session, `POST /gamification/mining-sessions/:sessionId/complete` may include:

```json
{
  "referral": {
    "referrerUserId": "referrer-user-id",
    "amountEarned": "0.75000000",
    "referrerRate": "12"
  }
}
```

Referral earnings are calculated from the platform commission using the referrer's current level-based percentage. The invited user's reward is not reduced.

## Phase 4 API Examples

### `GET /rewards/games`

Example response:

```json
{
  "games": [
    { "gameSlug": "fifa", "itemCount": 1 },
    { "gameSlug": "fortnite", "itemCount": 1 },
    { "gameSlug": "steam", "itemCount": 1 }
  ]
}
```

### `GET /rewards/games/steam`

Example response:

```json
{
  "gameSlug": "steam",
  "items": [
    {
      "id": "a0d79db2-92dd-42af-aeb6-320ce4d9c3d4",
      "gameSlug": "steam",
      "name": "Steam Gift Card — $10",
      "coinCost": "1000.00000000",
      "metadata": null
    }
  ]
}
```

### `POST /rewards/requests`

Requires a bearer token.

Example request:

```json
{
  "catalogItemId": "a0d79db2-92dd-42af-aeb6-320ce4d9c3d4"
}
```

Example response:

```json
{
  "request": {
    "id": "94ffb0cb-22d8-4ca2-92a5-77c93b43d01f",
    "status": "PENDING",
    "coinCost": "1000.00000000",
    "fulfillmentNotes": null,
    "createdAt": "2026-06-12T12:00:00.000Z",
    "fulfilledAt": null,
    "catalogItem": {
      "id": "a0d79db2-92dd-42af-aeb6-320ce4d9c3d4",
      "gameSlug": "steam",
      "name": "Steam Gift Card — $10",
      "coinCost": "1000.00000000",
      "metadata": null
    }
  },
  "wallet": {
    "coinBalance": "1500.00000000"
  }
}
```

Coins are validated at request time but only deducted when the request is fulfilled.

### `PATCH /rewards/fulfillment/requests/:requestId/fulfill`

Requires `x-api-key: <FULFILLMENT_API_KEY>`.

Example request:

```json
{
  "fulfillmentNotes": "Steam code sent via email."
}
```

Example response:

```json
{
  "request": {
    "id": "94ffb0cb-22d8-4ca2-92a5-77c93b43d01f",
    "status": "FULFILLED",
    "coinCost": "1000.00000000",
    "fulfillmentNotes": "Steam code sent via email.",
    "createdAt": "2026-06-12T12:00:00.000Z",
    "fulfilledAt": "2026-06-12T13:00:00.000Z",
    "catalogItem": {
      "id": "a0d79db2-92dd-42af-aeb6-320ce4d9c3d4",
      "gameSlug": "steam",
      "name": "Steam Gift Card — $10",
      "coinCost": "1000.00000000",
      "metadata": null
    }
  },
  "wallet": {
    "coinBalance": "500.00000000"
  }
}
```

## Phase 5 API Examples

All mining integration endpoints below require a bearer token.

### `POST /gamification/mining-sessions/:sessionId/heartbeat`

Send every 30–60 seconds while mining.

Example request:

```json
{
  "powerPercent": 65,
  "hashrate": "2500.00000000",
  "sharesAccepted": 4
}
```

Example response:

```json
{
  "sessionId": "94ffb0cb-22d8-4ca2-92a5-77c93b43d01f",
  "status": "ACTIVE",
  "telemetry": {
    "totalSeconds": 120,
    "secondsAbove80Percent": 0,
    "avgPowerPercent": "65",
    "peakPowerPercent": "65",
    "hashrate": "2500.00000000",
    "sharesAccepted": 4,
    "heartbeatCount": 2
  }
}
```

### `POST /gamification/mining-sessions/:sessionId/abort`

Example response:

```json
{
  "session": {
    "id": "94ffb0cb-22d8-4ca2-92a5-77c93b43d01f",
    "status": "ABORTED",
    "startedAt": "2026-06-12T12:00:00.000Z",
    "endedAt": "2026-06-12T12:10:00.000Z",
    "totalSeconds": 600,
    "secondsAbove80Percent": 0
  }
}
```

## What Phase 2 Returns

The backend now supports a frontend dashboard with:
- user profile basics
- current XP
- current level
- referral percentage for current level
- XP needed for the next level
- coin balance
- completed mining session count
- total mined seconds
- total bonus-eligible seconds
- total raw mined value
- total reward value
- active mining session
- recent XP events
- recent coin transactions

## Files Added or Updated For Phase 2

Main Phase 2 backend work:
- `src/gamification/gamification.module.ts`
- `src/gamification/gamification.controller.ts`
- `src/gamification/gamification.service.ts`
- `src/gamification/gamification.utils.ts`
- `src/gamification/dto/start-mining-session.dto.ts`
- `src/gamification/dto/complete-mining-session.dto.ts`
- `src/gamification/dto/update-mining-power.dto.ts`
- `src/common/services/level.service.ts`
- `src/app.module.ts`

Test files added:
- `src/gamification/gamification.utils.spec.ts`
- `src/gamification/gamification.service.spec.ts`

### Phase 3: Referral System

Implemented:
- referral earnings calculation from platform commission
- level-based referral percentage payout on mining session completion
- referral dashboard endpoint with per-user earnings breakdown
- total referral earnings tracking
- XP-to-next-level and next-level referral rate visibility for the referral page
- `ReferralEarning` records and `REFERRAL_EARNING` coin transactions for referrers

Main Phase 3 backend work:
- `src/referrals/referrals.module.ts`
- `src/referrals/referrals.controller.ts`
- `src/referrals/referrals.service.ts`
- `src/gamification/gamification.utils.ts`
- `src/gamification/gamification.service.ts`
- `src/app.module.ts`

Test files added:
- `src/referrals/referrals.service.spec.ts`

### Phase 4: Rewards Store

Implemented:
- reward catalog listing by game
- authenticated redemption request creation with balance validation
- user redemption history endpoint
- manual fulfillment workflow for pending requests
- coin deduction and `REWARD_REDEMPTION` transactions on fulfillment
- rejection flow that leaves user balances unchanged

Main Phase 4 backend work:
- `src/rewards/rewards.module.ts`
- `src/rewards/rewards.controller.ts`
- `src/rewards/rewards-fulfillment.controller.ts`
- `src/rewards/rewards.service.ts`
- `src/common/guards/fulfillment-api-key.guard.ts`
- `src/app.module.ts`

Test files added:
- `src/rewards/rewards.service.spec.ts`

### Phase 5: Mining Integration (Backend)

Implemented:
- mining session heartbeat endpoint with `MiningPowerSample` persistence
- session abort endpoint for crash/cancel flows without rewards
- server-side coin calculation from `rawMinedValue`
- telemetry aggregation for duration, qualified seconds, and average/peak power
- heartbeat requirement for sessions longer than `60` seconds

Main Phase 5 backend work:
- `src/gamification/mining-integration.controller.ts`
- `src/gamification/dto/mining-session-heartbeat.dto.ts`
- `src/gamification/gamification.utils.ts`
- `src/gamification/gamification.service.ts`
- `src/gamification/gamification.module.ts`

Still to build:
- production installer / auto-update packaging
- bundled XMRig binaries per platform
- stronger desktop trust and anti-tamper checks

## Desktop App

The Electron client lives in `desktop/`.

```bash
cd desktop
pnpm install
cp .env.example .env
pnpm run dev
```

See `desktop/README.md` for XMRig configuration and development notes.

## Suggested Next Step

Recommended next work:
1. bundle XMRig per OS and validate pool payout reporting;
2. add production packaging for the desktop app;
3. harden telemetry validation and anti-abuse rules on the backend.

## Notes About The Current State

- This repository currently contains the backend only; the desktop app is the remaining Phase 5 work.
- Mining settlement now uses server-side coin calculation and optional heartbeat telemetry.
- The current system is ready for frontend or desktop work against auth, profile, gamification, referral, and rewards endpoints.
- The schema was designed ahead of time so the remaining phases can build on the same data model.

## Known Gaps And Assumptions

### Business Logic Assumptions

- `coinAmount` is calculated server-side from `rawMinedValue` using `3.125` coins per user-reward unit.
- `rawMinedValue` is still reported by the client for now and may later be validated against pool or miner data.
- The current XP rule only considers full hours above `80%` power and does not yet include streaks, daily bonuses, achievements, or anti-abuse logic.
- The level system currently depends entirely on seeded `level_config`; if progression rules change, the seed data and migration strategy will need review.
- Referral earnings are assumed to come only from platform commission, never from the invited user reward.
- Reward redemption economics are not finalized yet, so coin pricing in the seed catalog should be treated as placeholder MVP data.

### Product Assumptions

- The current backend assumes a desktop mining product will exist later, but no desktop trust model has been enforced yet.
- The API currently supports simulated mining settlement for development before real miner integration exists.
- The initial audience is gamers, so the UX is expected to emphasize coins, XP, and levels more than raw monetary values.

### Compliance And Risk Gaps

- No legal or regulatory review has been implemented for crypto mining, virtual rewards, gift cards, or jurisdiction-specific consumer rules.
- No KYC, AML, fraud prevention, sanctions screening, or tax reporting flow exists.
- No age-gating or parental-consent flow exists, which may matter if the app targets younger gamers.
- No abuse-prevention system exists yet for fake mining reports, bot accounts, referral farming, or manipulated desktop telemetry.
- No production-grade audit logging, payout reconciliation, or financial dispute workflow exists yet.
- No explicit rate limiting, quota enforcement, or suspicious activity detection has been added yet.

### Technical Gaps

- `MiningPowerSample` is populated by heartbeat requests.
- `RefreshToken` exists in the schema but refresh-token issuance and rotation are not currently exposed in the API.
- Rewards redemption and manual fulfillment are implemented end-to-end for MVP.
- Referral earnings are implemented end-to-end for mining session settlement and dashboard reporting.
- Desktop miner communication beyond API contracts is still future work.

## Local Development

Typical setup steps:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run start:dev
```

Useful commands:

```bash
npm run test
npm run test:cov
npm run lint
```

## Docker

Create a `.env` file in the project root before starting:

```bash
cp .env.example .env
```

Start the API and PostgreSQL together:

```bash
docker compose up --build -d
docker compose logs -f app
```

The API is exposed on `http://localhost:3000` and PostgreSQL on `localhost:5432`.

Important: PostgreSQL stores the password only when the data volume is first created. If you change `POSTGRES_PASSWORD` in `.env` later, reset the volume:

```bash
docker compose down -v
docker compose up --build -d
```

If the app logs `P1000: Authentication failed`, the database volume password does not match `.env`. Run the reset commands above, or set `POSTGRES_PASSWORD` back to the value used when the volume was first created.

You can override the default container environment in `.env`:

```bash
POSTGRES_DB=miner_rewards
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432
PORT=3000
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=7d
FULFILLMENT_API_KEY=change-me-for-fulfillment
```

Useful Docker commands:

```bash
docker compose up --build -d
docker compose logs -f app
docker compose down
docker compose down -v
```

This Docker setup uses `prisma db push` during container startup because the repository does not currently include committed Prisma migration files. Once migrations are added to the repo, you can switch the container startup command to `prisma migrate deploy`.

## Stack

- NestJS
- TypeScript
- Prisma
- PostgreSQL
- JWT authentication
- Jest

## Disclaimer

This project is currently in active backend development. The mining business logic, desktop integration, compliance requirements, and production hardening are not complete yet.
