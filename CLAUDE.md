# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Smart Parking is a small Express + MongoDB (Mongoose) REST API that tracks cars entering/exiting a parking lot, computes parking fees, and accrues loyalty points per car number. The entire API lives in a single `index.js` file — there is no router/controller split.

## Commands

- `npm start` — run the server using `.env` (via Node's built-in `--env-file` flag, not dotenv)
- `npm run dev` — same, with `--watch` for auto-restart on file changes
- There is no test suite (`npm test` is a stub) and no lint config.

Environment variables (see `.env.copy` for the template, copy to `.env`):
- `PORT` — server port (defaults to 4000 if unset)
- `URL` — MongoDB connection string

## Architecture

- **`index.js`** — Express app setup, CORS allowlist (`http://example.com`, `http://localhost:3000`), Mongo connection, and all routes.
- **`models/userModel.js`** — `CarNumbers` model (Mongo collection `carnumbers`). Represents one parking session per car: `carNumber`, `pointId` (real `ObjectId` ref to a `points` doc, default `null`), `exitTime`, `price`, `paymentMethod`, plus timestamps. A car with `exitTime` unset/null is considered "still parked." Has a compound index on `{ carNumber: 1, exitTime: 1 }` (also serves plain `carNumber` lookups as a prefix).
- **`models/pointModel.js`** — `Points` model (Mongo collection `points`). One loyalty record per unique `carNumber` (enforced with a `unique` index), holding `points` (schema-capped at 25 via `max`, enforced on updates that pass `runValidators: true`), `usedTimes`, and `car_ids` (array of `ObjectId` refs to `CarNumbers` docs for that car's history).
- **`helpers/helpers.js`** — pure fee calculation:
  - `getHours(entryDateStr, exitDateStr)` — hours between two ISO date strings.
  - `getPrice(hours, discount = 0)` — hourly rate is 2000 for the first 24 hours, 1800/hr beyond that; `hours <= 0` returns `0`. `discount` is a percentage subtracted from the total.
- **`controllers/`** — route handler logic (`carController.js`, `pointController.js`), each handler wrapped in `utils/asyncHandler.js` instead of a per-route `try/catch`.
- **`routes/`** — Express routers (`carRoutes.js`, `pointRoutes.js`) mounted at the root in `index.js`.
- **`utils/asyncHandler.js`** — wraps async route handlers so rejected promises/thrown errors become a consistent `500 { state: false, message: "server error", msg }` response.
- **`utils/response.js`** — `ok(res, message, data)` / `fail(res, message, data)` helpers for the standard `{ state, message, data }` response shape (all success and business-failure responses include `data`, defaulting to `null`).

### Request flow / domain logic

1. **Car enters** (`POST /cars`): validates `carNumber` (min length 3), rejects if that car number already has an open (no `exitTime`) session. Looks up an existing `Points` doc for the car to link `pointId` immediately; if found, increments that point record's `usedTimes` and appends the new `CarNumbers._id` to `car_ids`.
2. **Price lookup while parked** (`PUT /cars`): finds the open session for a `carNumber`, computes elapsed hours from `createdAt` to now via `getHours`/`getPrice`, and returns the price + the session's `_id` (`uniqueId`) without mutating any data — used to preview the fee before payment.
3. **Car exits / pays** (`PUT /exit-car`): looked up by the `CarNumbers._id` (`req.body.unique`). Rejects if already paid (`exitTime` set). If the car already has a linked `Points` doc, increments its `points` (capped at 25); otherwise creates a new `Points` doc with `points: 1`. Then sets `exitTime`, `price`, `paymentMethod`, and `pointId` on the `CarNumbers` doc.
4. **Lookups**: `GET /cars`, `GET /points` return all records; `GET /cars/:id` returns both the `CarNumbers` history and the `Points` doc for a given `carNumber`.

### Things to watch for when editing this codebase

- `pointId` on `CarNumbers` is a real `ObjectId` ref to `points` (as of the models optimization pass) — it still serializes as a hex string in JSON responses, so the wire format for frontend consumers is unchanged.
- New `CarNumbers` docs are created with `pointId: null` when no prior `Points` doc exists yet for that car; the `Points` doc (and real `pointId`) is only created later, on exit (`PUT /exit-car`), and isn't backfilled onto earlier `CarNumbers` docs from the same session unless explicitly updated.
- `Points.points` has a schema `max: 25`, but Mongoose only enforces schema validators on `findByIdAndUpdate`/`findOneAndUpdate` when `runValidators: true` is passed — omitting it silently skips the cap check.
- Response bodies consistently use `{ state, message, data }` (or ad hoc fields like `msg` for errors) rather than HTTP status codes — success and failure both typically return HTTP 200 with `state: false` on failure.
- Some route handlers mix Uzbek and English strings in `message` fields (e.g. `"bu mashina hali chiqib ketmadi!"`); follow this existing convention rather than translating it.
- `plan/planA.drawio` contains the diagrammed data model/flow — check it for intended behavior if request logic seems ambiguous.
