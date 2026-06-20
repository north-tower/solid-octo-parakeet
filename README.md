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
- Phase 4 is not implemented yet: rewards redemption flow still needs to be completed.
- Phase 5 is not implemented yet: desktop mining integration is still pending.

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
| Rewards | Reward listing by game | Pending | Phase 4 |
| Rewards | Reward redemption flow | Pending | Phase 4 |
| Rewards | Manual fulfillment workflow | Pending | Phase 4 MVP |
| Desktop Mining | Electron shell | Pending | Phase 5 |
| Desktop Mining | XMRig process control | Pending | Phase 5 |
| Desktop Mining | Real mining telemetry -> backend | Pending | Phase 5 |

## Roadmap Timeline

| Phase | Name | Status | Goal | Output |
| --- | --- | --- | --- | --- |
| 1 | Database + Auth | Done | Build the foundation everything depends on | Prisma schema, JWT auth, seeded config, profile flow |
| 2 | Gamification Engine | Done | Lock in the core business math and progression loop | XP, levels, coins, dashboard, session settlement |
| 3 | Referral System | Done | Pay referrers from platform commission using level-based percentages | Referral earnings logic, referral stats endpoints |
| 4 | Rewards Store | Next | Let users exchange coins for gamer rewards | Reward browsing, redemption requests, fulfillment workflow |
| 5 | Mining Integration | Planned | Connect the real desktop miner to the backend | Electron app, XMRig control, session reporting |

## Small Architecture

Current backend structure in simple terms:
- `NestJS API layer` handles authentication, protected routes, DTO validation, and module boundaries.
- `Prisma data layer` reads and writes all persistent state in PostgreSQL.
- `Auth module` manages registration, login, JWT issuance, and referral-code-aware signup.
- `Users module` exposes profile data for the logged-in user.
- `Gamification module` contains the current Phase 2 business logic for mining session settlement, XP, levels, coins, and dashboard aggregation.
- `Referrals module` contains Phase 3 referral earnings settlement and referral dashboard aggregation.
- `Seed data` initializes level thresholds, referral percentages, and a starter reward catalog.

Current request flow:
1. the client authenticates with JWT;
2. the client starts or completes a mining session through the API;
3. the gamification service validates the user and session state;
4. the service applies business rules for XP, coins, and levels;
5. Prisma persists the updated user balance, XP events, coin transactions, and mining session summary.

Planned high-level architecture after later phases:
1. `Desktop app` will run Electron and manage the local miner process;
2. `Miner integration` will collect hashrate, duration, and CPU usage data;
3. `Backend API` will receive session updates and settle progression/rewards;
4. `Rewards subsystem` will process redemption requests and fulfillment;
5. `Referral subsystem` will calculate commission sharing from platform fees.

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
- `POST /gamification/mining-sessions/:sessionId/complete`

### Referrals

- `GET /referrals/me`

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
  "coinAmount": "25.00000000",
  "rawMinedValue": "10.00000000",
  "avgPowerPercent": 82,
  "peakPowerPercent": 90,
  "hashrate": "2500.00000000",
  "sharesAccepted": 4
}
```

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
- `coinAmount` is the internal gamified reward currency credited to the user.
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

## What Is Remaining

### Phase 4: Rewards Store

Still to build:
- rewards listing endpoints by game
- reward redemption flow
- coin deduction for approved redemptions
- reward request lifecycle management
- manual fulfillment workflow for MVP
- optional later integration with gift card providers

### Phase 5: Mining Integration

Still to build:
- Electron desktop shell
- local XMRig process management
- CPU usage configuration based on slider value
- mining stats capture from miner output
- real mining session reporting to the backend
- session heartbeat or periodic reporting strategy
- secure communication between desktop app and backend

## Suggested Next Backend Step

Recommended next phase:
1. build Phase 4 reward listing endpoints by game;
2. implement reward redemption requests with coin deduction;
3. add a manual fulfillment workflow for MVP reward requests.

## Notes About The Current State

- This repository currently contains the backend only.
- Mining itself is not connected yet; Phase 2 supports fake or simulated mining session settlement.
- The current system is ready for frontend work against auth, profile, gamification, and referral endpoints.
- The schema was designed ahead of time so the remaining phases can build on the same data model.

## Known Gaps And Assumptions

### Business Logic Assumptions

- `coinAmount` is currently treated as the internal reward currency credited to the user, not as a direct fiat value.
- The relationship between mined Monero value and internal coins is not fully defined yet and may need a formal conversion rule.
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

- `MiningPowerSample` exists in the schema but is not populated yet.
- `RefreshToken` exists in the schema but refresh-token issuance and rotation are not currently exposed in the API.
- Rewards and payouts have schema support but not full end-to-end workflows yet.
- Referral earnings are implemented end-to-end for mining session settlement and dashboard reporting.
- Desktop miner communication, telemetry validation, and secure reporting are still future work.

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

Start the API and PostgreSQL together:

```bash
docker compose up --build
```

The API is exposed on `http://localhost:3000` and PostgreSQL on `localhost:5432`.

You can override the default container environment by setting these variables before running Docker Compose:

```bash
POSTGRES_DB=miner_rewards
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432
PORT=3000
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=7d
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
