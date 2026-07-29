# Graph Report - .  (2026-07-29)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1233 nodes · 2135 edges · 113 communities (87 shown, 26 thin omitted)
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 269 edges (avg confidence: 0.51)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `179b6dd0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- sequelize.js
- transaction_service.js
- BadRequestError
- kiro-guard-code-quality.js
- transfer.js
- package.json
- build_exports.js
- crud.js
- auth_controller.js
- telegram_router.js
- budget_router.js
- setupModels
- server.js
- exchange_rate_service.js
- express
- auth_router.js
- index.js
- recurring_transaction_router.js
- pay.js
- index.js
- debt_router.js
- auth_service.js
- metrics.js
- category_group_router.js
- email_change.js
- errors.js
- user.model.js
- transaction_router.js
- category_service.js
- crud.js
- category.model.js
- bootstrap
- agenda_router.js
- account_router.js
- category_router.js
- category_group_service.js
- stats_controller.js
- { Sequelize }
- google.js
- budget.model.js
- recurring_transaction.model.js
- credentials.js
- mailer_service.js
- spec.js
- profile.js
- dependencies
- category_group_controller.js
- debt_controller.js
- summary_controller.js
- debt.model.js
- account_controller.js
- transaction.model.js
- soft_delete_purge_service.js
- exchange_rate_controller.js
- syncRecentRates
- 20260714000000-add-soft-delete-to-domain-tables.js
- 20260330000300-alter-recurring-transactions-execution-mode.js
- axios
- cookie-parser
- cors
- dayjs
- dotenv
- exceljs
- google-auth-library
- joi
- jsonwebtoken
- node-cron
- nodemailer
- passport
- passport-jwt
- pdfkit
- pg
- pg-hstore
- react
- react-dom
- @react-pdf/renderer
- sequelize
- swagger-ui-express
- config.js

## God Nodes (most connected - your core abstractions)
1. `models` - 51 edges
2. `setupModels()` - 35 edges
3. `BadRequestError` - 32 edges
4. `resolveAnalyticsCategoryFilter()` - 24 edges
5. `applyAnalyticsCategoryFilter()` - 23 edges
6. `{ Sequelize }` - 21 edges
7. `express` - 19 edges
8. `parseSinglePositiveId()` - 17 edges
9. `NotFoundError` - 16 edges
10. `bootstrap()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `parseIdFilter()` --indirect_call--> `n()`  [INFERRED]
  server/services/stats/shared.js → .kiro/crew/bin/metrics.js
- `parseIdFilter()` --indirect_call--> `n()`  [INFERRED]
  server/services/transactions/shared.js → .kiro/crew/bin/metrics.js
- `parseMonthStr()` --indirect_call--> `n()`  [INFERRED]
  server/services/transactions/shared.js → .kiro/crew/bin/metrics.js
- `getNetCashFlow()` --indirect_call--> `income()`  [INFERRED]
  server/services/stats/cash_flow.js → server/controllers/summary_controller.js
- `bootstrap()` --indirect_call--> `requestOriginLogger()`  [INFERRED]
  server/server.js → server/middlewares/request_origin_logger.js

## Import Cycles
- None detected.

## Communities (113 total, 26 thin omitted)

### Community 0 - "sequelize.js"
Cohesion: 0.05
Nodes (79): { config }, models, { setupModels }, { models }, options, passport, { Strategy: JwtStrategy, ExtractJwt }, axios (+71 more)

### Community 1 - "transaction_service.js"
Cohesion: 0.05
Nodes (66): n(), { confirmPendingTransaction }, { createTransactionInT, createTransaction }, { createTransfer }, { deleteTransaction }, { getAllTransactions }, { getGroupedTransactions }, { getMonthlySummary } (+58 more)

### Community 2 - "BadRequestError"
Cohesion: 0.05
Nodes (45): agendaService, { NotFoundError }, recurringTransactionService, recurringWorkerService, buildDebtForecast(), buildRecurringForecast(), { calculateNextDate }, dayjs (+37 more)

### Community 3 - "kiro-guard-code-quality.js"
Cohesion: 0.07
Nodes (43): { configFor }, { dirname }, { violation, isExempt, findRoot }, {
  WRITE_TOOLS,
  filePath,
  readHookInput,
  respond,
  resultingContent,
  toolName,
}, { configFor }, { existsSync, readFileSync }, {
  WRITE_TOOLS,
  filePath,
  readHookInput,
  respond,
  resultingContent,
  toolName,
}, { configFor } (+35 more)

### Community 4 - "transfer.js"
Cohesion: 0.07
Nodes (39): findCategoryGroupIdByBehavior(), findOrCreateCategoryByName(), { models }, { Op }, { BadRequestError }, createTransaction(), createTransactionInT(), { findOrCreateCategoryByName, findCategoryGroupIdByBehavior } (+31 more)

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (33): nodemon, author, description, devDependencies, nodemon, sequelize-cli, keywords, license (+25 more)

### Community 6 - "build_exports.js"
Cohesion: 0.08
Nodes (22): { BadRequestError, NotFoundError }, { buildTransfersExport, buildTransactionsListExport, buildTransactionsExportFromDb }, txService, buildTransactionsExportFromDb(), buildTransactionsListExport(), buildTransfersExport(), { config }, { createTransactionsListPdfBuffer } (+14 more)

### Community 7 - "crud.js"
Cohesion: 0.12
Nodes (31): { createBudget, listBudgets, updateBudget, deleteBudget }, { getBudgetStatus }, { BadRequestError, ConflictError, NotFoundError }, createBudget(), deleteBudget(), findDuplicateBudget(), listBudgets(), { models } (+23 more)

### Community 8 - "auth_controller.js"
Cohesion: 0.08
Nodes (28): { forgotPassword, resetPassword, changePassword }, { login, me, logout, register }, { loginGoogle, unlinkGoogle }, { requestEmailChange, verifyOldEmailOtp, confirmNewEmail }, { updateProfile }, authService, confirmNewEmail(), requestEmailChange() (+20 more)

### Community 9 - "telegram_router.js"
Cohesion: 0.07
Nodes (18): { BadRequestError, NotFoundError }, telegramService, { BadRequestError }, express, passport, router, telegramCtrl, { telegramExistsSchema, telegramGetByChatIdSchema, telegramDeleteByChatIdSchema } (+10 more)

### Community 10 - "budget_router.js"
Cohesion: 0.10
Nodes (19): budgetService, create(), status(), budgetController, {
  createBudgetSchema,
  listBudgetsQuerySchema,
  updateBudgetSchema,
  budgetIdParamSchema,
  budgetStatusQuerySchema,
}, express, { protect }, router (+11 more)

### Community 11 - "setupModels"
Cohesion: 0.13
Nodes (9): Account, Budget, CategoryGroup, Category, ExchangeRate, setupModels(), OtpCode, TelegramSession (+1 more)

### Community 12 - "server.js"
Cohesion: 0.09
Nodes (20): requestLogger(), requestOriginLogger(), buildApiRouter(), express, { buildApiRouter }, { config }, { logErrors, boomErrorHandler, ormErrorHandler, errorHandler }, net (+12 more)

### Community 13 - "exchange_rate_service.js"
Cohesion: 0.16
Nodes (20): axios, BCV_API_BASE_URL, BCV_API_TIMEOUT_MS, CACHE_TTL_MS, fetchRateFromProvider(), getCached(), getRateWithFallback(), rateCache (+12 more)

### Community 14 - "express"
Cohesion: 0.13
Nodes (16): express, jwt, { models }, protect(), exchangeRateCtrl, express, { protect }, router (+8 more)

### Community 15 - "auth_router.js"
Cohesion: 0.16
Nodes (18): authCtrl, express, { protect }, {
	registerSchema,
	googleLoginSchema,
	loginSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
	updateProfileSchema,
	requestEmailChangeSchema,
	verifyOldEmailOtpSchema,
	confirmNewEmailSchema,
	unlinkGoogleSchema,
	changePasswordSchema,
}, router, { validator }, changePasswordSchema, confirmNewEmailSchema (+10 more)

### Community 16 - "index.js"
Cohesion: 0.12
Nodes (16): ExchangeRateSchema, { Model, DataTypes, Sequelize }, { Account, AccountSchema }, { Budget, BudgetSchema }, { Category, CategorySchema }, { CategoryGroup, CategoryGroupSchema }, { Debt, DebtSchema }, { ExchangeRate, ExchangeRateSchema } (+8 more)

### Community 17 - "recurring_transaction_router.js"
Cohesion: 0.13
Nodes (17): {
  createRecurringTransactionSchema,
  updateRecurringTransactionSchema,
  recurringTransactionIdParamSchema,
  payNowSchema,
}, express, { protect }, recurringTransactionCtrl, router, { validator }, createRecurringTransactionSchema, currencyCode (+9 more)

### Community 18 - "pay.js"
Cohesion: 0.18
Nodes (14): { calcPaidAmount, computeStatus }, linkTransactions(), { NotFoundError }, { Op }, { sequelize, models }, { BadRequestError, NotFoundError }, { calcPaidAmount, computeStatus }, { getUsdRateByDate, resolveDateUtc } (+6 more)

### Community 19 - "index.js"
Cohesion: 0.14
Nodes (14): accountRoutes, app, authRoutes, categoryRoutes, cors, corsOptions, express, FRONTEND_URLS (+6 more)

### Community 20 - "debt_router.js"
Cohesion: 0.17
Nodes (14): {
  createDebtSchema,
  updateDebtSchema,
  debtIdParamSchema,
  payDebtSchema,
  listDebtsQuerySchema,
  linkTransactionsSchema,
}, debtController, express, { protect }, router, { validator }, createDebtSchema, dateOnly (+6 more)

### Community 21 - "auth_service.js"
Cohesion: 0.14
Nodes (14): unlinkGoogle(), { BadRequestError }, bcrypt, crypto, forgotPassword(), mailerService, { Op }, resetPassword() (+6 more)

### Community 22 - "metrics.js"
Cohesion: 0.15
Nodes (12): analyze(), args, csv, devs, exec, { execSync }, files, git() (+4 more)

### Community 23 - "category_group_router.js"
Cohesion: 0.17
Nodes (13): categoryGroupCtrl, {
	createCategoryGroupSchema,
	updateCategoryGroupSchema,
	idParamSchema,
	assignCategoriesSchema,
}, express, { protect }, router, { validator }, analyticsBehavior, assignCategoriesSchema (+5 more)

### Community 24 - "email_change.js"
Cohesion: 0.19
Nodes (13): { BadRequestError, UnauthorizedError, NotFoundError }, bcrypt, { buildOtpCode, buildOtpExpirationDate }, confirmNewEmail(), mailerService, { Op }, requestEmailChange(), { sequelize, models } (+5 more)

### Community 25 - "errors.js"
Cohesion: 0.15
Nodes (5): { BadRequestError, NotFoundError }, categoryService, ConflictError, ForbiddenError, NotFoundError

### Community 26 - "user.model.js"
Cohesion: 0.18
Nodes (8): AccountSchema, { Model, DataTypes, Sequelize }, { USER_TABLE }, { Model, DataTypes, Sequelize }, TelegramSessionSchema, { USER_TABLE }, { Model, DataTypes, Sequelize }, UserSchema

### Community 27 - "transaction_router.js"
Cohesion: 0.18
Nodes (12): {
	createTransactionSchema,
	transferSchema,
	confirmTransactionSchema,
}, express, { protect }, router, txCtrl, { validator }, confirmTransactionSchema, createTransactionSchema (+4 more)

### Community 28 - "category_service.js"
Cohesion: 0.20
Nodes (9): DEFAULT_CATEGORIES, DEFAULT_CATEGORY_GROUPS, { BadRequestError }, create(), { DEFAULT_CATEGORY_GROUPS, DEFAULT_CATEGORIES }, listFiltered(), { models }, normalizeType() (+1 more)

### Community 29 - "crud.js"
Cohesion: 0.20
Nodes (12): { linkTransactions }, { listDebts, getDebtById, createDebt, updateDebt, deleteDebt }, { payDebt }, { calcPaidAmount, computeStatus }, createDebt(), deleteDebt(), getDebtById(), listDebts() (+4 more)

### Community 30 - "category.model.js"
Cohesion: 0.15
Nodes (8): { CATEGORY_TABLE }, CategoryGroupSchema, { Model, DataTypes, Sequelize }, { USER_TABLE }, { CATEGORY_GROUP_TABLE }, CategorySchema, { Model, DataTypes, Sequelize }, { USER_TABLE }

### Community 31 - "bootstrap"
Cohesion: 0.23
Nodes (12): { AppError }, boom, boomErrorHandler(), errorHandler(), logErrors(), ormErrorHandler(), statusToCode(), bootstrap() (+4 more)

### Community 32 - "agenda_router.js"
Cohesion: 0.18
Nodes (10): boom, validator(), agendaController, { agendaForecastQuerySchema }, express, { protect }, router, { validator } (+2 more)

### Community 33 - "account_router.js"
Cohesion: 0.19
Nodes (11): accountCtrl, { createAccountSchema, updateAccountSchema, idQuerySchema }, express, { protect }, router, { validator }, createAccountSchema, currency (+3 more)

### Community 34 - "category_router.js"
Cohesion: 0.19
Nodes (11): categoryCtrl, { createCategorySchema, updateCategorySchema, idQuerySchema }, express, { protect }, router, { validator }, createCategorySchema, idQuerySchema (+3 more)

### Community 35 - "category_group_service.js"
Cohesion: 0.26
Nodes (9): ALLOWED_ANALYTICS_BEHAVIOR, ALLOWED_TYPES, { BadRequestError, ConflictError }, createGroup(), normalizeAnalyticsBehavior(), { sequelize, models }, updateGroup(), validateAnalyticsBehavior() (+1 more)

### Community 36 - "stats_controller.js"
Cohesion: 0.29
Nodes (11): { BadRequestError }, comparativeMoM(), comparativeMoMIncome(), expenseVolatility(), incomeHeatmap(), incomeVolatility(), monthlyForecast(), netCashFlow() (+3 more)

### Community 37 - "{ Sequelize }"
Cohesion: 0.20
Nodes (6): { Sequelize }, { sequelize }, create(), { models, sequelize }, txService, update()

### Community 38 - "google.js"
Cohesion: 0.22
Nodes (10): buildUniqueUsername(), bcrypt, { buildUniqueUsername }, categoryService, googleClient, jwt, loginWithGoogle(), { OAuth2Client } (+2 more)

### Community 39 - "budget.model.js"
Cohesion: 0.24
Nodes (8): { BUDGET_TABLE }, down(), removeIndexIfExists(), up(), BudgetSchema, { CATEGORY_TABLE }, { Model, DataTypes, Sequelize }, { USER_TABLE }

### Community 40 - "recurring_transaction.model.js"
Cohesion: 0.20
Nodes (7): { ACCOUNT_TABLE }, { CATEGORY_TABLE }, { DEBT_TABLE }, { Model, DataTypes, Sequelize }, RecurringTransaction, RecurringTransactionSchema, { USER_TABLE }

### Community 41 - "credentials.js"
Cohesion: 0.24
Nodes (9): bcrypt, categoryService, { ConflictError }, { generateToken }, login(), { Op }, register(), { sequelize, models } (+1 more)

### Community 42 - "mailer_service.js"
Cohesion: 0.24
Nodes (8): { AppError }, buildOtpEmailHtml(), buildPasswordResetHtml(), nodemailer, sendOtpEmail(), sendPasswordResetEmail(), transporter, AppError

### Community 43 - "spec.js"
Cohesion: 0.25
Nodes (6): config, { config }, options, servers, swaggerJsdoc, swaggerSpec

### Community 44 - "profile.js"
Cohesion: 0.22
Nodes (7): { BadRequestError, UnauthorizedError, NotFoundError }, bcrypt, changePassword(), { models }, { Op }, updateProfile(), UnauthorizedError

### Community 45 - "dependencies"
Cohesion: 0.25
Nodes (8): bcryptjs, @hapi/boom, dependencies, bcryptjs, express, @hapi/boom, swagger-jsdoc, swagger-jsdoc

### Community 48 - "summary_controller.js"
Cohesion: 0.46
Nodes (7): { BadRequestError }, balance(), expense(), income(), parseOptionalGroupId(), txService, validateAnalyticsBehavior()

### Community 49 - "debt.model.js"
Cohesion: 0.25
Nodes (5): { CATEGORY_TABLE }, Debt, DebtSchema, { Model, DataTypes, Sequelize }, { USER_TABLE }

### Community 51 - "transaction.model.js"
Cohesion: 0.20
Nodes (7): { ACCOUNT_TABLE }, { CATEGORY_TABLE }, { DEBT_TABLE }, { Model, DataTypes, Sequelize }, Transaction, TransactionSchema, { USER_TABLE }

### Community 52 - "soft_delete_purge_service.js"
Cohesion: 0.33
Nodes (6): cron, { models }, { Op }, PURGE_ORDER, purgeSoftDeletedRecords(), startSoftDeletePurgeCron()

### Community 54 - "syncRecentRates"
Cohesion: 0.40
Nodes (5): shiftDateUtc(), syncRecentRates(), cron, startExchangeRateWorkerCron(), { syncRecentRates }

### Community 55 - "20260714000000-add-soft-delete-to-domain-tables.js"
Cohesion: 0.60
Nodes (4): down(), removeIndexIfExists(), TABLES, up()

### Community 56 - "20260330000300-alter-recurring-transactions-execution-mode.js"
Cohesion: 0.83
Nodes (3): down(), removeIndexIfExists(), up()

## Knowledge Gaps
- **535 isolated node(s):** `{ readFileSync, readdirSync, writeFileSync, existsSync, statSync }`, `{ execSync }`, `{ join, relative, dirname, sep }`, `args`, `csv` (+530 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `models` connect `sequelize.js` to `transaction_service.js`, `BadRequestError`, `transfer.js`, `build_exports.js`, `crud.js`, `telegram_router.js`, `exchange_rate_service.js`, `express`, `pay.js`, `auth_service.js`, `email_change.js`, `category_service.js`, `crud.js`, `category_group_service.js`, `{ Sequelize }`, `google.js`, `credentials.js`, `profile.js`, `soft_delete_purge_service.js`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`, `axios`, `cookie-parser`, `cors`, `dayjs`, `dotenv`, `exceljs`, `google-auth-library`, `joi`, `jsonwebtoken`, `node-cron`, `nodemailer`, `passport`, `passport-jwt`, `pdfkit`, `pg`, `pg-hstore`, `react`, `react-dom`, `@react-pdf/renderer`, `sequelize`, `swagger-ui-express`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Why does `express` connect `express` to `agenda_router.js`, `account_router.js`, `category_router.js`, `package.json`, `telegram_router.js`, `budget_router.js`, `server.js`, `dependencies`, `auth_router.js`, `recurring_transaction_router.js`, `index.js`, `debt_router.js`, `category_group_router.js`, `transaction_router.js`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **What connects `{ readFileSync, readdirSync, writeFileSync, existsSync, statSync }`, `{ execSync }`, `{ join, relative, dirname, sep }` to the rest of the system?**
  _535 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `sequelize.js` be split into smaller, more focused modules?**
  _Cohesion score 0.050560512468542665 - nodes in this community are weakly interconnected._
- **Should `transaction_service.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05028305028305028 - nodes in this community are weakly interconnected._
- **Should `BadRequestError` be split into smaller, more focused modules?**
  _Cohesion score 0.053551912568306013 - nodes in this community are weakly interconnected._