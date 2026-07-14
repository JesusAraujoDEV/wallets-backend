<div align="center">

# Wallets Backend

### API de finanzas personales orientada a producción para aplicaciones Full-Stack modernas

<p>
	<img src="https://img.shields.io/badge/version-1.0.0-111827?style=for-the-badge" alt="version" />
	<img src="https://img.shields.io/badge/license-ISC-0f766e?style=for-the-badge" alt="license" />
	<img src="https://img.shields.io/badge/node.js-18%2B-16a34a?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
	<img src="https://img.shields.io/badge/express-4.18-black?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
	<img src="https://img.shields.io/badge/postgresql-Relational_DB-334155?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
	<img src="https://img.shields.io/badge/sequelize-ORM-1f2937?style=for-the-badge&logo=sequelize&logoColor=52b0e7" alt="Sequelize" />
	<img src="https://img.shields.io/badge/swagger-OpenAPI-0ea5e9?style=for-the-badge&logo=swagger&logoColor=white" alt="Swagger" />
</p>

<p>
Arquitectura limpia por capas, seguridad JWT, documentación exhaustiva y módulos financieros listos para escalar.
</p>

</div>

---

## ✨ Características Principales

### Frontend (consumidor de la API)
- Integración clara mediante contrato OpenAPI en `/api-docs`.
- CORS configurable por entorno para localhost y dominios productivos.
- Endpoints organizados por dominios para reducir acoplamiento en UI.

### Backend (este repositorio)
- API REST en Node.js + Express con separación routes/controllers/services/models.
- Seguridad con JWT (`Bearer`) y middlewares de autenticación/validación.
- Persistencia en PostgreSQL con Sequelize y migraciones versionadas.
- Módulos de negocio: auth, cuentas, categorías, presupuestos, deudas, transacciones y recurrencias.
- Capacidades avanzadas: estadísticas, agenda financiera, exportaciones y Telegram.
- Manejo consistente de errores con formato normalizado.

---

## 🏗️ Arquitectura y Tecnologías

| Capa | Stack | Propósito |
|---|---|---|
| Frontend | React / Next.js / Vue (cliente externo) | Consumo de API, visualización de datos y UX |
| Backend | Node.js, Express, Joi, Passport JWT | Endpoints, reglas de negocio, autenticación y validación |
| Base de Datos | PostgreSQL + Sequelize | Persistencia relacional y control evolutivo de esquema |
| Integraciones | Nodemailer, Google Auth, Telegram | Comunicación externa y automatizaciones |
| Documentación | Swagger JSDoc + Swagger UI | Contrato OpenAPI y exploración de endpoints |
| Infraestructura | pnpm/npm, Docker (listo), Dokploy/Nixpacks (compatible) | Build, despliegue y operación |

---

## 🔌 Documentación de la API (Endpoints)

Base URL local por defecto:

```text
http://localhost:3001/api
```

Documentación interactiva:

```text
http://localhost:3001/api-docs
```

Autenticación:
- La mayoría de endpoints requieren `Authorization: Bearer <token>`.
- Excepciones públicas: `GET /status`, `GET /health`, `POST /auth/*` (login/register/recovery), `GET /telegram/*` (según caso).

Formato de error global (referencial):

```json
{
	"ok": false,
	"statusCode": 400,
	"error": "BAD_REQUEST",
	"message": "Mensaje descriptivo"
}
```

### Mapa rápido de dominios

| Dominio | Prefijo | Endpoints |
|---|---|---:|
| Health | `/api/health` | 1 |
| Status | `/api/status` | 1 |
| Auth | `/api/auth` | 12 |
| Accounts | `/api/accounts` | 4 |
| Categories | `/api/categories` | 4 |
| Category Groups | `/api/category-groups` | 5 |
| Transactions | `/api/transactions` | 10 |
| Recurring Transactions | `/api/recurring-transactions` | 6 |
| Summary | `/api/summary` | 3 |
| Stats | `/api/stats` | 8 |
| Budgets | `/api/budgets` | 5 |
| Debts | `/api/debts` | 6 |
| Agenda | `/api/agenda` | 1 |
| Telegram | `/api/telegram` | 4 |

---

### 1) Health

#### GET /api/health
Descripción: verificación rápida de disponibilidad del router API.

Payload:
```json
{}
```

Response:
```json
{
	"ok": true
}
```

---

### 2) Status

#### GET /api/status
Descripción: estado público del servicio.

Payload:
```json
{}
```

Response:
```json
{
	"status": "ok",
	"service": "wallets-backend",
	"timestamp": "2026-05-28T12:00:00.000Z"
}
```

---

### 3) Auth

#### POST /api/auth/register
Descripción: registro de usuario local.

Payload:
```json
{
	"username": "jesus.dev",
	"name": "Jesus Araujo",
	"email": "jesus@example.com",
	"password": "SecurePass123"
}
```

Response:
```json
{
	"ok": true,
	"token": "jwt-token",
	"user": {
		"id": 1,
		"username": "jesus.dev",
		"email": "jesus@example.com"
	}
}
```

#### POST /api/auth/login
Descripción: autenticación por username o email + password.

Payload:
```json
{
	"email": "jesus@example.com",
	"password": "SecurePass123"
}
```

Response:
```json
{
	"ok": true,
	"token": "jwt-token",
	"user": {
		"id": 1,
		"username": "jesus.dev",
		"email": "jesus@example.com"
	}
}
```

#### POST /api/auth/google-login
Descripción: login/registro con token de Google.

Payload:
```json
{
	"token": "google-id-token"
}
```

Response:
```json
{
	"ok": true,
	"token": "jwt-token",
	"user": {
		"id": 2,
		"auth_provider": "google"
	}
}
```

#### POST /api/auth/forgot-password
Descripción: inicia recuperación de contraseña.

Payload:
```json
{
	"email": "jesus@example.com"
}
```

Response:
```json
{
	"success": true,
	"message": "Si el correo existe, se enviaron instrucciones."
}
```

#### POST /api/auth/reset-password
Descripción: restablece contraseña con token de recuperación.

Payload:
```json
{
	"token": "reset-token",
	"newPassword": "NewSecurePass123"
}
```

Response:
```json
{
	"success": true,
	"message": "Contraseña actualizada correctamente."
}
```

#### GET /api/auth/me
Descripción: obtiene perfil autenticado.

Payload:
```json
{}
```

Response:
```json
{
	"ok": true,
	"user": {
		"id": 1,
		"username": "jesus.dev",
		"email": "jesus@example.com"
	}
}
```

#### PATCH /api/auth/me
Descripción: actualiza datos del perfil.

Payload:
```json
{
	"name": "Jesus A.",
	"username": "jesusaraujo"
}
```

Response:
```json
{
	"ok": true,
	"message": "Perfil actualizado",
	"user": {
		"id": 1,
		"name": "Jesus A.",
		"username": "jesusaraujo"
	}
}
```

#### POST /api/auth/email-change/request
Descripción: solicita OTP para cambio de email.

Payload:
```json
{
	"currentPassword": "SecurePass123"
}
```

Response:
```json
{
	"success": true,
	"message": "OTP enviado al correo actual."
}
```

#### POST /api/auth/email-change/verify-old
Descripción: valida OTP del correo antiguo y registra nuevo email.

Payload:
```json
{
	"code": "123456",
	"newEmail": "nuevo@example.com"
}
```

Response:
```json
{
	"success": true,
	"message": "Correo antiguo verificado. OTP enviado al nuevo correo."
}
```

#### POST /api/auth/email-change/confirm
Descripción: confirma OTP recibido en el nuevo correo.

Payload:
```json
{
	"code": "654321",
	"newEmail": "nuevo@example.com"
}
```

Response:
```json
{
	"success": true,
	"message": "Email actualizado correctamente."
}
```

#### POST /api/auth/unlink-google
Descripción: desvincula proveedor Google y fija nueva contraseña local.

Payload:
```json
{
	"newPassword": "StrongPassword123"
}
```

Response:
```json
{
	"success": true,
	"message": "Cuenta Google desvinculada correctamente."
}
```

#### POST /api/auth/change-password
Descripción: cambia contraseña de usuario local autenticado.

Payload:
```json
{
	"currentPassword": "CurrentPass123",
	"newPassword": "NewPass1234"
}
```

Response:
```json
{
	"success": true,
	"message": "Contraseña actualizada correctamente."
}
```

#### POST /api/auth/logout
Descripción: logout simbólico (invalidación en cliente).

Payload:
```json
{}
```

Response:
```json
{
	"ok": true,
	"message": "Logout exitoso. Elimine el token en el cliente."
}
```

---

### 4) Accounts

#### GET /api/accounts
Descripción: lista cuentas del usuario autenticado.

Payload:
```json
{}
```

Response:
```json
[
	{
		"id": 1,
		"name": "Banesco",
		"type": "bank",
		"currency": "USD",
		"balance": 240.5
	}
]
```

#### POST /api/accounts
Descripción: crea una cuenta.

Payload:
```json
{
	"name": "Efectivo",
	"type": "efectivo",
	"currency": "USD",
	"balance": 100
}
```

Response:
```json
{
	"id": 2,
	"name": "Efectivo",
	"currency": "USD",
	"balance": 100
}
```

#### PATCH /api/accounts?id={id}
Descripción: actualiza una cuenta por query param.

Payload:
```json
{
	"name": "Caja Chica",
	"balance": 150.75
}
```

Response:
```json
{
	"ok": true,
	"id": 2,
	"name": "Caja Chica",
	"balance": 150.75
}
```

#### DELETE /api/accounts?id={id}
Descripción: elimina una cuenta.

Payload:
```json
{}
```

Response:
```json
{
	"ok": true
}
```

---

### 5) Categories

#### GET /api/categories
Descripción: lista categorías (acepta filtros por query).

Payload:
```json
{
	"query": {
		"groupId": 1,
		"type": "gasto"
	}
}
```

Response:
```json
[
	{
		"id": 10,
		"name": "Transporte",
		"type": "gasto",
		"groupId": 1
	}
]
```

#### POST /api/categories
Descripción: crea categoría.

Payload:
```json
{
	"name": "Freelance",
	"type": "ingreso",
	"groupId": null,
	"icon": "briefcase",
	"color": "#22c55e",
	"colorName": "green"
}
```

Response:
```json
{
	"id": 11,
	"name": "Freelance",
	"type": "ingreso"
}
```

#### PATCH /api/categories?id={id}
Descripción: actualiza categoría.

Payload:
```json
{
	"name": "Comida",
	"color": "#f97316"
}
```

Response:
```json
{
	"ok": true,
	"id": 11,
	"name": "Comida",
	"color": "#f97316"
}
```

#### DELETE /api/categories?id={id}
Descripción: elimina categoría.

Payload:
```json
{}
```

Response:
```json
{
	"ok": true
}
```

---

### 6) Category Groups

#### GET /api/category-groups
Descripción: lista grupos de categorías.

Payload:
```json
{}
```

Response:
```json
[
	{
		"id": 1,
		"name": "Hogar",
		"type": "gasto",
		"analyticsBehavior": "include"
	}
]
```

#### POST /api/category-groups
Descripción: crea grupo de categorías.

Payload:
```json
{
	"name": "Inversiones",
	"type": "ingreso",
	"analyticsBehavior": "include"
}
```

Response:
```json
{
	"id": 3,
	"name": "Inversiones",
	"type": "ingreso"
}
```

#### PATCH /api/category-groups/{id}
Descripción: actualiza grupo.

Payload:
```json
{
	"name": "Ingresos Variables",
	"type": "ingreso"
}
```

Response:
```json
{
	"ok": true,
	"id": 3,
	"name": "Ingresos Variables"
}
```

#### PATCH /api/category-groups/{id}/assign-categories
Descripción: asigna categorías existentes a un grupo.

Payload:
```json
{
	"categoryIds": [10, 11, 12]
}
```

Response:
```json
{
	"ok": true,
	"groupId": 3,
	"updatedCount": 3
}
```

#### DELETE /api/category-groups/{id}
Descripción: elimina grupo.

Payload:
```json
{}
```

Response:
```json
{
	"ok": true
}
```

---

### 7) Transactions

#### GET /api/transactions
Descripción: lista transacciones del usuario.

Payload:
```json
{
	"query": {
		"from": "2026-05-01",
		"to": "2026-05-31"
	}
}
```

Response:
```json
[
	{
		"id": 100,
		"description": "Pago de internet",
		"amount": 40,
		"currency": "USD",
		"date": "2026-05-10"
	}
]
```

#### GET /api/transactions/pending
Descripción: lista transacciones pendientes por confirmar.

Payload:
```json
{}
```

Response:
```json
[
	{
		"id": 110,
		"status": "pending",
		"description": "Transferencia por confirmar"
	}
]
```

#### POST /api/transactions
Descripción: crea una transacción simple.

Payload:
```json
{
	"description": "Supermercado",
	"amount": 55.9,
	"currency": "USD",
	"date": "2026-05-12",
	"categoryId": 10,
	"accountId": 1,
	"commission": 0
}
```

Response:
```json
{
	"ok": true,
	"newId": 101,
	"tx": {
		"id": 101,
		"description": "Supermercado"
	},
	"commissionTx": null
}
```

#### POST /api/transactions/transfer
Descripción: ejecuta transferencia entre cuentas.

Payload:
```json
{
	"fromAccountId": 1,
	"toAccountId": 2,
	"amount": 100,
	"destinationAmount": 98,
	"commission": 2,
	"date": "2026-05-13",
	"concept": "Cambio USD->VES"
}
```

Response:
```json
{
	"ok": true,
	"transfer": {
		"id": "trf_001"
	},
	"data": []
}
```

#### PATCH /api/transactions/{id}/confirm
Descripción: confirma una transacción pendiente.

Payload:
```json
{
	"accountId": 1,
	"date": "2026-05-13",
	"amount": 100,
	"currency": "USD"
}
```

Response:
```json
{
	"ok": true,
	"tx": {
		"id": 110,
		"status": "confirmed"
	},
	"message": "Transacción confirmada"
}
```

#### PATCH /api/transactions
Descripción: actualiza transacción por query/body según implementación.

Payload:
```json
{
	"id": 101,
	"description": "Supermercado semanal",
	"amount": 58.2
}
```

Response:
```json
{
	"ok": true,
	"tx": {
		"id": 101,
		"description": "Supermercado semanal"
	},
	"message": "Transacción actualizada"
}
```

#### DELETE /api/transactions
Descripción: elimina transacción según identificador enviado.

Payload:
```json
{
	"id": 101
}
```

Response:
```json
{
	"ok": true
}
```

#### GET /api/transactions/transfer/export
Descripción: exporta transferencias por query simple.

Payload:
```json
{
	"query": {
		"from": "2026-05-01",
		"to": "2026-05-31",
		"format": "xlsx"
	}
}
```

Response:
```json
{
	"file": "binary-stream"
}
```

#### POST /api/transactions/transfer/export
Descripción: exporta transferencias usando filtros complejos.

Payload:
```json
{
	"from": "2026-05-01",
	"to": "2026-05-31",
	"format": "pdf",
	"accounts": [1, 2]
}
```

Response:
```json
{
	"file": "binary-stream"
}
```

#### GET /api/transactions/export
Descripción: exporta todas las transacciones (PDF o XLSX).

Payload:
```json
{
	"query": {
		"format": "pdf",
		"from": "2026-01-01",
		"to": "2026-12-31"
	}
}
```

Response:
```json
{
	"file": "binary-stream"
}
```

---

### 8) Recurring Transactions

#### POST /api/recurring-transactions
Descripción: crea transacción recurrente.

Payload:
```json
{
	"type": "gasto",
	"amount": 35,
	"currency": "USD",
	"description": "Suscripción",
	"frequency": "monthly",
	"startDate": "2026-06-01",
	"accountId": 1,
	"categoryId": 10,
	"executionMode": "auto",
	"isActive": true
}
```

Response:
```json
{
	"success": true,
	"message": "Transaccion recurrente creada",
	"data": {
		"id": 1,
		"description": "Suscripción"
	}
}
```

#### GET /api/recurring-transactions
Descripción: lista transacciones recurrentes.

Payload:
```json
{}
```

Response:
```json
[
	{
		"id": 1,
		"description": "Suscripción",
		"frequency": "monthly",
		"nextDate": "2026-07-01"
	}
]
```

#### POST /api/recurring-transactions/trigger
Descripción: dispara ejecución manual del scheduler.

Payload:
```json
{}
```

Response:
```json
{
	"success": true,
	"executed": 2,
	"message": "Ejecución manual completada"
}
```

#### POST /api/recurring-transactions/{id}/pay-now
Descripción: registra pago adelantado de una recurrencia.

Payload:
```json
{
	"date": "2026-06-15",
	"accountId": 1,
	"amount": 35,
	"currency": "USD"
}
```

Response:
```json
{
	"success": true,
	"message": "Pago adelantado registrado",
	"data": {
		"transactionId": 150
	}
}
```

#### PATCH /api/recurring-transactions/{id}
Descripción: actualiza recurrencia.

Payload:
```json
{
	"amount": 40,
	"frequency": "monthly",
	"isActive": true
}
```

Response:
```json
{
	"success": true,
	"message": "Transaccion recurrente actualizada",
	"data": {
		"id": 1,
		"amount": 40
	}
}
```

#### DELETE /api/recurring-transactions/{id}
Descripción: elimina recurrencia.

Payload:
```json
{}
```

Response:
```json
{
	"success": true,
	"message": "Transaccion recurrente eliminada"
}
```

---

### 9) Summary

#### GET /api/summary/balance
Descripción: resumen de balance global.

Payload:
```json
{}
```

Response:
```json
{
	"ok": true,
	"balance": {
		"USD": 520.45,
		"VES": 18000
	}
}
```

#### GET /api/summary/income
Descripción: total de ingresos.

Payload:
```json
{
	"query": {
		"month": "2026-05"
	}
}
```

Response:
```json
{
	"ok": true,
	"income_total": 1200
}
```

#### GET /api/summary/expense
Descripción: total de gastos.

Payload:
```json
{
	"query": {
		"month": "2026-05"
	}
}
```

Response:
```json
{
	"ok": true,
	"expense_total": 680
}
```

---

### 10) Stats

#### GET /api/stats/net-cash-flow
Descripción: flujo neto y tasa de ahorro.

Payload:
```json
{
	"query": {
		"months": 6
	}
}
```

Response:
```json
{
	"series": [],
	"summary": {
		"netCashFlow": 340,
		"savingsRate": 0.28
	}
}
```

#### GET /api/stats/spending-heatmap
Descripción: calor de gastos por día/hora.

Payload:
```json
{
	"query": {
		"month": "2026-05"
	}
}
```

Response:
```json
{
	"matrix": []
}
```

#### GET /api/stats/expense-volatility
Descripción: volatilidad de gastos (estadística tipo boxplot).

Payload:
```json
{
	"query": {
		"months": 12
	}
}
```

Response:
```json
{
	"q1": 120,
	"median": 190,
	"q3": 280,
	"outliers": []
}
```

#### GET /api/stats/comparative-mom
Descripción: comparativa mes contra mes (gastos).

Payload:
```json
{
	"query": {
		"month": "2026-05"
	}
}
```

Response:
```json
{
	"current": 680,
	"previous": 640,
	"delta": 40,
	"deltaPct": 6.25
}
```

#### GET /api/stats/monthly-forecast
Descripción: proyección mensual de cierre.

Payload:
```json
{
	"query": {
		"month": "2026-05"
	}
}
```

Response:
```json
{
	"forecast": {
		"income": 1400,
		"expense": 900,
		"balance": 500
	}
}
```

#### GET /api/stats/income-heatmap
Descripción: calor de ingresos por día/hora.

Payload:
```json
{
	"query": {
		"month": "2026-05"
	}
}
```

Response:
```json
{
	"matrix": []
}
```

#### GET /api/stats/income-volatility
Descripción: volatilidad de ingresos.

Payload:
```json
{
	"query": {
		"months": 12
	}
}
```

Response:
```json
{
	"q1": 200,
	"median": 350,
	"q3": 500,
	"outliers": []
}
```

#### GET /api/stats/comparative-mom-income
Descripción: comparativa mes contra mes (ingresos).

Payload:
```json
{
	"query": {
		"month": "2026-05"
	}
}
```

Response:
```json
{
	"current": 1200,
	"previous": 1150,
	"delta": 50,
	"deltaPct": 4.35
}
```

---

### 11) Budgets

#### POST /api/budgets
Descripción: crea presupuesto.

Payload:
```json
{
	"categoryId": 10,
	"amount": 300,
	"currency": "USD",
	"period": "monthly",
	"specific_month": null
}
```

Response:
```json
{
	"success": true,
	"message": "Presupuesto creado correctamente.",
	"data": {
		"id": 1,
		"amount": 300
	}
}
```

#### GET /api/budgets
Descripción: lista presupuestos por filtros de mes/periodo.

Payload:
```json
{
	"query": {
		"month": "2026-05",
		"period": "monthly"
	}
}
```

Response:
```json
{
	"success": true,
	"data": []
}
```

#### GET /api/budgets/status
Descripción: estado de ejecución de presupuestos.

Payload:
```json
{
	"query": {
		"month": "2026-05"
	}
}
```

Response:
```json
{
	"success": true,
	"data": {
		"totals": {
			"planned": 900,
			"spent": 620
		}
	}
}
```

#### PATCH /api/budgets/{id}
Descripción: actualiza presupuesto.

Payload:
```json
{
	"amount": 350,
	"currency": "USD",
	"period": "monthly",
	"specific_month": null
}
```

Response:
```json
{
	"success": true,
	"message": "Presupuesto actualizado correctamente.",
	"data": {
		"id": 1,
		"amount": 350
	}
}
```

#### DELETE /api/budgets/{id}
Descripción: elimina presupuesto.

Payload:
```json
{}
```

Response:
```json
{
	"success": true,
	"message": "Presupuesto eliminado correctamente."
}
```

---

### 12) Debts

#### GET /api/debts
Descripción: lista deudas por estado/tipo.

Payload:
```json
{
	"query": {
		"status": "pending",
		"type": "payable"
	}
}
```

Response:
```json
{
	"success": true,
	"message": "Deudas obtenidas correctamente.",
	"data": []
}
```

#### POST /api/debts
Descripción: crea deuda por pagar o cobrar.

Payload:
```json
{
	"type": "payable",
	"contactName": "Proveedor X",
	"description": "Compra de equipos",
	"totalAmount": 800,
	"currency": "USD",
	"dueDate": "2026-06-30",
	"categoryId": 10
}
```

Response:
```json
{
	"success": true,
	"message": "Deuda creada correctamente.",
	"data": {
		"id": 1,
		"status": "pending"
	}
}
```

#### PATCH /api/debts/{id}
Descripción: actualiza deuda.

Payload:
```json
{
	"contactName": "Proveedor Y",
	"description": "Compra de oficina",
	"dueDate": "2026-07-15"
}
```

Response:
```json
{
	"success": true,
	"message": "Deuda actualizada correctamente.",
	"data": {
		"id": 1,
		"contactName": "Proveedor Y"
	}
}
```

#### DELETE /api/debts/{id}
Descripción: elimina deuda.

Payload:
```json
{}
```

Response:
```json
{
	"success": true,
	"message": "Deuda eliminada correctamente.",
	"data": {}
}
```

#### POST /api/debts/{id}/pay
Descripción: registra abono/pago de deuda.

Payload:
```json
{
	"amount": 120,
	"currency": "USD",
	"accountId": 1,
	"date": "2026-05-14",
	"categoryId": 10,
	"exchangeRate": 39.5
}
```

Response:
```json
{
	"success": true,
	"message": "Abono registrado correctamente.",
	"data": {
		"paymentTransactionId": 220,
		"remainingAmount": 680
	}
}
```

#### POST /api/debts/{id}/link-transactions
Descripción: vincula transacciones existentes con una deuda.

Payload:
```json
{
	"transactionIds": [220, 221]
}
```

Response:
```json
{
	"success": true,
	"message": "Transacciones vinculadas correctamente.",
	"data": {
		"linked": 2
	}
}
```

---

### 13) Agenda

#### GET /api/agenda/forecast
Descripción: proyección de agenda financiera.

Payload:
```json
{}
```

Response:
```json
[
	{
		"date": "2026-06-01",
		"type": "gasto",
		"description": "Suscripción mensual",
		"amount": 35,
		"currency": "USD"
	}
]
```

---

### 14) Telegram

#### POST /api/telegram/link
Descripción: vincula sesión de Telegram con usuario autenticado.

Payload:
```json
{
	"chat_id": 123456789,
	"user_id": 1,
	"username": "wallet_bot_user"
}
```

Response:
```json
{
	"ok": true,
	"session": {
		"chat_id": 123456789,
		"user_id": 1,
		"username": "wallet_bot_user"
	}
}
```

#### GET /api/telegram/exists
Descripción: verifica si existe vínculo por chatId/username.

Payload:
```json
{
	"query": {
		"chatId": 123456789,
		"username": "wallet_bot_user"
	}
}
```

Response:
```json
{
	"ok": true,
	"exists": true
}
```

#### GET /api/telegram/session
Descripción: obtiene sesión por chatId.

Payload:
```json
{
	"query": {
		"chatId": 123456789
	}
}
```

Response:
```json
{
	"ok": true,
	"session": {
		"chat_id": 123456789,
		"user_id": 1,
		"username": "wallet_bot_user"
	}
}
```

#### DELETE /api/telegram/session
Descripción: elimina sesión por chatId.

Payload:
```json
{
	"query": {
		"chatId": 123456789
	}
}
```

Response:
```json
{
	"ok": true
}
```

---

## 🚀 Guía de Inicio Rápido

### Requisitos previos
- Node.js 18+
- PostgreSQL 14+
- pnpm 9+ (o npm)
- Git

### Instalación local

```bash
# 1) Clonar repositorio
git clone https://github.com/tu-org/wallets-backend.git
cd wallets-backend

# 2) Instalar dependencias
pnpm install

# Alternativa
# npm install
```

### Variables de entorno

```bash
cp .env.example .env
```

Ejemplo recomendado para desarrollo:

```env
# PostgreSQL Database
DATABASE_URL="postgresql://usuario:password@localhost:5432/wallets_db"

# JWT
JWT_SECRET="change_this_super_secret_key"
JWT_EXPIRES_IN="7d"

# Server
NODE_ENV="development"
PORT=3001

# Swagger / OpenAPI
BACKEND_URL="http://localhost:3001"
# API_BASE_PATH="/api"

# CORS
FRONTEND_URLS="http://localhost:8080,http://localhost:5173"

# Opcionales
SQL_LOG=false
FORCE_DB_SSL=false
EXPORT_PDF_ENGINE="react-pdf"
```

### Ejecutar entorno local

```bash
# Desarrollo
pnpm dev

# Migraciones
pnpm db:migrate
```

Scripts disponibles:

| Script | Descripción |
|---|---|
| `pnpm start` | Inicia servidor en modo estándar |
| `pnpm dev` | Inicia servidor con nodemon |
| `pnpm sequelize` | CLI de Sequelize |
| `pnpm db:migrate` | Ejecuta migraciones pendientes |
| `pnpm db:migrate:undo` | Revierte última migración |
| `pnpm db:migrate:undo:all` | Revierte todas las migraciones |

---

## 🐳 Despliegue (Deployment) y Docker

El repositorio actual no versiona `Dockerfile` ni `docker-compose.yml`, pero está preparado para contenerización sin cambios estructurales.

### Ejemplo de docker-compose para backend + PostgreSQL

```yaml
services:
	api:
		build: .
		container_name: wallets-api
		restart: unless-stopped
		env_file:
			- .env
		ports:
			- "3001:3001"
		depends_on:
			- db

	db:
		image: postgres:16
		container_name: wallets-db
		restart: unless-stopped
		environment:
			POSTGRES_DB: wallets_db
			POSTGRES_USER: wallets_user
			POSTGRES_PASSWORD: wallets_pass
		ports:
			- "5432:5432"
		volumes:
			- pg_data:/var/lib/postgresql/data

volumes:
	pg_data:
```

### Comandos habituales

```bash
docker compose build
docker compose up -d
docker compose logs -f
```

### Producción
- Compatible con Dokploy al declarar variables de entorno en el panel del servicio.
- Compatible con Nixpacks/Buildpacks gracias a scripts estándar de Node.
- Recomendado ejecutar migraciones como paso obligatorio del pipeline de release.
- Recomendado activar SSL de DB en cloud (`FORCE_DB_SSL=true` o `DATABASE_URL` con `sslmode=require`).

---

## 📂 Estructura del Proyecto

```text
wallets-backend/
|-- server/
|   |-- config/                 # Configuración central
|   |-- controllers/            # Capa HTTP
|   |-- services/               # Lógica de negocio
|   |-- routes/                 # Endpoints por dominio
|   |-- models/                 # Modelos Sequelize
|   |-- db/
|   |   `-- migrations/         # Migraciones de base de datos
|   |-- middlewares/            # Auth, validación, manejo de errores
|   |-- schemas/                # Validaciones Joi
|   |-- swagger/                # Definiciones OpenAPI
|   |-- templates/              # Plantillas de exportación
|   |-- uploads/                # Archivos subidos
|   `-- server.js               # Bootstrap del servidor
|-- .env.example
|-- index.js                    # Entry point legacy
|-- package.json
`-- README.md
```

> Nota Full-Stack: este repositorio representa el backend. El frontend puede residir en otro repo o subdirectorio separado y consumir la API documentada arriba.

---

## 🤝 Contribución
1. Crear rama desde `main`.
2. Implementar cambios con commits atómicos.
3. Validar migraciones y endpoints.
4. Actualizar Swagger cuando cambie cualquier ruta o contrato.
5. Abrir Pull Request con contexto técnico y evidencia de pruebas.

## 📄 Licencia
Licencia ISC.
