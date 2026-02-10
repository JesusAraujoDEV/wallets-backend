# 📘 Documentación Técnica de la API - Wallets Backend

**Base URL:** `/api`  
**Formato:** JSON  
**Auth:** Bearer Token (header `Authorization: Bearer <token>`)

---

## 🔐 Autenticación y Seguridad
- Endpoints protegidos usan el middleware `protect` (JWT).  
- Respuestas de auth usan `{ ok: boolean, ... }`.

### 🧩 Formato de Error Estándar
```json
{
  "ok": false,
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "El campo 'email' es requerido."
}
```

### 🔑 Token
- Header: `Authorization: Bearer <token>`
- Errores comunes:
  - **401** si no hay token, token inválido o usuario no existe.

---

# 🧭 Módulos Funcionales

##  Módulo de Salud (Health)

### ✅ GET /health
**Propósito:** Verificar que el API está vivo y respondiendo.

🔐 **Permisos:** Público.

📥 **Parámetros de Entrada**
- Path Parameters: _No aplica_
- Query Parameters: _No aplica_
- Request Body: _No aplica_

📤 **Respuesta Exitosa (200 OK)**
```json
{
  "ok": true
}
```

⚠️ **Posibles Errores**
- 500 si falla el servidor.

---

## 📡 Módulo de Estado

### ✅ GET /status
**Propósito:** Estado de salud del backend (DB, servicios, uptime, etc.).

🔐 **Permisos:** Público.

📥 **Parámetros de Entrada**
- Path Parameters: _No aplica_
- Query Parameters: _No aplica_
- Request Body: _No aplica_

📤 **Respuesta Exitosa (200 OK)**
```json
{
  "ok": true,
  "info": {
    "name": "wallets-backend",
    "version": "1.0.0",
    "env": "development",
    "uptimeSeconds": 12345,
    "timestamp": "2026-02-03T12:00:00.000Z"
  },
  "components": {
    "db": { "ok": true, "latencyMs": 8, "error": null },
    "exchangeRateApi": { "ok": true, "latencyMs": 120, "error": null }
  },
  "totalLatencyMs": 130
}
```

⚠️ **Posibles Errores**
- 500 si falla la verificación interna.

---

## 👮 Módulo de Autenticación

### 🆕 POST /auth/register
**Propósito:** Registra un usuario nuevo y lo autentica inmediatamente.

🔐 **Permisos:** Público.

📥 **Request Body**
```json
{
  "username": "demo",
  "name": "Demo User",
  "email": "demo@correo.com",
  "password": "secret123"
}
```

**Validaciones:**
- `username`: mínimo 3 caracteres.
- `email`: formato válido y único.
- `password`: mínimo 6 caracteres.

📤 **Respuesta Exitosa (201 Created)**
```json
{
  "ok": true,
  "token": "eyJhbGciOi...",
  "user": {
    "id": 1,
    "username": "demo",
    "email": "demo@correo.com",
    "name": "Demo User"
  }
}
```

⚠️ **Errores Comunes**
- **400** si faltan campos o no cumplen validación.
- **409** si el usuario o email ya existe.

💡 **Nota de Lógica:** al registrarse se crea automáticamente una cuenta inicial **Efectivo** (USD) con balance 0.

---

###  POST /auth/login
**Propósito:** Inicia sesión y devuelve un token JWT.

🔐 **Permisos:** Público.

📥 **Request Body**
```json
{
  "username": "demo",
  "password": "secret"
}
```

📤 **Respuesta Exitosa (200 OK)**
```json
{
  "ok": true,
  "token": "eyJhbGciOi...",
  "user": {
    "id": 1,
    "username": "demo",
    "email": "demo@correo.com",
    "name": "Demo User"
  }
}
```

⚠️ **Posibles Errores**
- **400** si falta usuario o contraseña.
- **401** si las credenciales son inválidas.

---

### 🧩 POST /auth/google-login
**Propósito:** Valida el token de Google, crea el usuario si no existe (onboarding) y devuelve un JWT propio.

🔐 **Permisos:** Público.

📥 **Request Body**
```json
{
  "token": "eyJhbGciOi..." 
}
```

📤 **Respuesta Exitosa (200 OK)**
```json
{
  "ok": true,
  "token": "eyJhbGciOi...",
  "user": {
    "id": 1,
    "username": "demo",
    "email": "demo@correo.com",
    "name": "Demo User"
  }
}
```

⚠️ **Posibles Errores**
- **400** si el body no contiene `token`.
- **401** si el token de Google es inválido o expiró.

💡 **Nota de Lógica:** si el usuario no existe, se crea automáticamente una cuenta inicial **Efectivo** (USD, balance 0) y categorías base (Comida, Transporte, Servicios, Salario).

---

### 🔐 GET /auth/me
**Propósito:** Obtiene el usuario autenticado actual.

🔐 **Permisos:** Requiere token.

📥 **Parámetros de Entrada**
- Path Parameters: _No aplica_
- Query Parameters: _No aplica_
- Request Body: _No aplica_

📤 **Respuesta Exitosa (200 OK)**
```json
{
  "ok": true,
  "user": {
    "id": 1,
    "username": "demo",
    "email": "demo@correo.com",
    "name": "Demo User"
  }
}
```

⚠️ **Posibles Errores**
- **401** si el token es inválido o falta.

---

### 🚪 POST /auth/logout
**Propósito:** Cierra sesión simbólicamente (invalida en cliente).

🔐 **Permisos:** Público.

📥 **Parámetros de Entrada**
- Path Parameters: _No aplica_
- Query Parameters: _No aplica_
- Request Body: _No aplica_

📤 **Respuesta Exitosa (200 OK)**
```json
{
  "ok": true,
  "message": "Logout exitoso. Elimine el token en el cliente."
}
```

---

## 🤖 Módulo de Telegram

### 🔗 POST /telegram/link
**Propósito:** Vincula un chat de Telegram con el usuario autenticado y guarda el JWT actual.

🔐 **Permisos:** Requiere token.

📥 **Request Body**
```json
{
  "chatId": 123456789,
  "username": "mi_usuario"
}
```

📤 **Respuesta Exitosa (201 Created)**
```json
{
  "ok": true,
  "session": {
    "chatId": 123456789,
    "userId": 1,
    "username": "mi_usuario",
    "jwtToken": "eyJhbGciOi...",
    "createdAt": "2026-02-09T12:00:00.000Z",
    "updatedAt": "2026-02-09T12:00:00.000Z"
  }
}
```

⚠️ **Posibles Errores**
- **400** si `chatId` no es válido o falta el token en `Authorization`.
- **401** si el token es inválido o falta.

💡 **Nota de Lógica:** si el usuario reinicia el bot, el vínculo se actualiza sin duplicar registros.

---

### ✅ GET /telegram/exists
**Propósito:** Verifica si existe una sesión de Telegram por `chatId` y `username`.

🔐 **Permisos:** Público.

📥 **Query Parameters**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| chatId | int | ✅ | ID del chat de Telegram |
| username | string | ✅ | Username de Telegram |

📤 **Respuesta Exitosa (200 OK)**
```json
{
  "ok": true,
  "exists": true
}
```

⚠️ **Posibles Errores**
- **400** si `chatId` o `username` no son válidos.

---

### 📄 GET /telegram/session
**Propósito:** Obtiene la sesión de Telegram por `chatId`.

🔐 **Permisos:** Público.

📥 **Query Parameters**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| chatId | int | ✅ | ID del chat de Telegram |

📤 **Respuesta Exitosa (200 OK)**
```json
{
  "ok": true,
  "session": {
    "chatId": 123456789,
    "userId": 1,
    "username": "mi_usuario",
    "jwtToken": "eyJhbGciOi...",
    "createdAt": "2026-02-09T12:00:00.000Z",
    "updatedAt": "2026-02-09T12:00:00.000Z"
  }
}
```

⚠️ **Posibles Errores**
- **400** si `chatId` no es válido.
- **404** si la sesión no existe.

---

### 🗑️ DELETE /telegram/session
**Propósito:** Elimina la sesión de Telegram por `chatId`.

🔐 **Permisos:** Público.

📥 **Query Parameters**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| chatId | int | ✅ | ID del chat de Telegram |

📤 **Respuesta Exitosa (200 OK)**
```json
{
  "ok": true
}
```

⚠️ **Posibles Errores**
- **400** si `chatId` no es válido.
- **404** si la sesión no existe.

---

## 🏦 Módulo de Cuentas

### 📄 GET /accounts
**Propósito:** Lista todas las cuentas del usuario.

🔐 **Permisos:** Requiere token.

📥 **Parámetros de Entrada**
- Path Parameters: _No aplica_
- Query Parameters: _No aplica_
- Request Body: _No aplica_

📤 **Respuesta Exitosa (200 OK)**
```json
[
  {
    "id": 10,
    "name": "Banco",
    "type": "efectivo",
    "currency": "USD",
    "balance": "123.45",
    "userId": 1
  }
]
```

⚠️ **Posibles Errores**
- 401 si falta token.

---

### ➕ POST /accounts
**Propósito:** Crea una nueva cuenta.

🔐 **Permisos:** Requiere token.

📥 **Request Body**
```json
{
  "name": "Caja chica", 
  "type": "efectivo",
  "currency": "USD",
  "balance": 0
}
```

📤 **Respuesta Exitosa (201 Created)**
```json
{
  "id": 15
}
```

⚠️ **Posibles Errores**
- **400** si el body no cumple el esquema (validator).

---

### ✏️ PATCH /accounts?id=:id
**Propósito:** Actualiza una cuenta por `id`.

🔐 **Permisos:** Requiere token.

📥 **Query Parameters**
| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| id | int | ✅ | — | ID de la cuenta |

📥 **Request Body**
```json
{
  "name": "Banco B",
  "currency": "VES",
  "balance": 1000
}
```

📤 **Respuesta Exitosa (200 OK)**
```json
{
  "ok": true,
  "id": 10
}
```

⚠️ **Posibles Errores**
- **400** si `id` no es válido.
- **404** si la cuenta no existe.

💡 **Nota de Lógica:** si se envía `balance`, se crea automáticamente una transacción de **Ajuste de Balance** para mantener consistencia contable.

---

### 🗑️ DELETE /accounts?id=:id
**Propósito:** Elimina una cuenta por `id`.

🔐 **Permisos:** Requiere token.

📥 **Query Parameters**
| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| id | int | ✅ | — | ID de la cuenta |

📤 **Respuesta Exitosa (200 OK)**
```json
{
  "ok": true
}
```

⚠️ **Posibles Errores**
- **400** si `id` no es válido.
- **404** si la cuenta no existe.

---

## 🧩 Módulo de Categorías

### 📄 GET /categories
**Propósito:** Lista categorías del usuario.

🔐 **Permisos:** Requiere token.

📥 **Query Parameters**
| Parámetro | Tipo | Requerido | Default | Descripción/Valores Permitidos |
|-----------|------|-----------|---------|--------------------------------|
| includeInStats | boolean | ❌ | null | `true`/`false` / `1`/`0` / `yes`/`no` |
| type | string | ❌ | null | `income`, `expense`, `ingreso`, `gasto` |

📤 **Respuesta Exitosa (200 OK)**
```json
[
  {
    "id": 5,
    "name": "Comida",
    "type": "gasto",
    "includeInStats": true,
    "icon": "Pizza",
    "color": "#F59E0B",
    "colorName": "Amber",
    "userId": 1
  }
]
```

⚠️ **Posibles Errores**
- **400** si `includeInStats` o `type` no son válidos.

---

### ➕ POST /categories
**Propósito:** Crea una categoría.

🔐 **Permisos:** Requiere token.

📥 **Request Body**
```json
{
  "name": "Servicios",
  "type": "expense",
  "icon": "Plug",
  "color": "#3B82F6",
  "colorName": "Blue",
  "includeInStats": true
}
```

📤 **Respuesta Exitosa (201 Created)**
```json
{
  "id": 22
}
```

⚠️ **Posibles Errores**
- **400** por validación de esquema.

---

### ✏️ PATCH /categories?id=:id
**Propósito:** Actualiza una categoría.

🔐 **Permisos:** Requiere token.

📥 **Query Parameters**
| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| id | int | ✅ | — | ID de categoría |

📥 **Request Body**
```json
{
  "name": "Servicios hogar",
  "type": "gasto",
  "includeInStats": false
}
```

📤 **Respuesta Exitosa (200 OK)**
```json
{
  "ok": true,
  "id": 22
}
```

⚠️ **Posibles Errores**
- **400** si `id` no es válido.
- **404** si la categoría no existe.

---

### 🗑️ DELETE /categories?id=:id
**Propósito:** Elimina una categoría.

🔐 **Permisos:** Requiere token.

📥 **Query Parameters**
| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| id | int | ✅ | — | ID de categoría |

📤 **Respuesta Exitosa (200 OK)**
```json
{
  "ok": true
}
```

⚠️ **Posibles Errores**
- **400** si `id` no es válido.
- **404** si la categoría no existe.

---

### ✅ POST /categories/include-in-stats/enable
**Propósito:** Activa `includeInStats=true` en lote.

🔐 **Permisos:** Requiere token.

📥 **Request Body**
```json
{
  "ids": [1, 2, 3]
}
```

📤 **Respuesta Exitosa (200 OK)**
```json
{
  "ok": true,
  "rowCount": 3
}
```

⚠️ **Posibles Errores**
- **400** si el body no cumple el esquema.

---

### 🚫 POST /categories/include-in-stats/disable
**Propósito:** Desactiva `includeInStats=false` en lote.

🔐 **Permisos:** Requiere token.

📥 **Request Body**
```json
{
  "ids": [1, 2, 3]
}
```

📤 **Respuesta Exitosa (200 OK)**
```json
{
  "ok": true,
  "rowCount": 3
}
```

⚠️ **Posibles Errores**
- **400** si el body no cumple el esquema.

---

## 💸 Módulo de Transacciones

### 📄 GET /transactions
**Propósito:** Lista transacciones (simple o agrupadas por fecha).

🔐 **Permisos:** Requiere token.

📥 **Query Parameters**
| Parámetro | Tipo | Requerido | Default | Descripción/Valores Permitidos |
|-----------|------|-----------|---------|--------------------------------|
| grouped | string | ❌ | null | `1` para resultados agrupados |
| pageSize | int | ❌ | 20 | Solo cuando `grouped=1` |
| cursorDate | string | ❌ | null | Paginación por fecha (YYYY-MM-DD) |
| q | string | ❌ | null | Búsqueda por descripción o nombre de categoría |
| type | string | ❌ | null | `income`, `expense`, `ingreso`, `gasto` |
| categoryId | string | ❌ | null | ID o lista separada por coma |
| accountId | string | ❌ | null | ID o lista separada por coma |
| date | string | ❌ | null | Fecha exacta YYYY-MM-DD |
| dateFrom | string | ❌ | null | Inicio de rango YYYY-MM-DD |
| dateTo | string | ❌ | null | Fin de rango YYYY-MM-DD |
| month | string | ❌ | null | `YYYY-MM` |
| includeInStats | boolean | ❌ | null | true/false/1/0 |

📤 **Respuesta Exitosa (200 OK) - modo simple**
```json
[
  {
    "id": 100,
    "description": "Pago luz",
    "amount": "15.00",
    "currency": "USD",
    "amountUsd": "15.00",
    "exchangeRateUsed": "35.500000",
    "date": "2026-02-01",
    "categoryId": 2,
    "accountId": 1,
    "type": "gasto"
  }
]
```

📤 **Respuesta Exitosa (200 OK) - modo agrupado**
```json
{
  "items": [
    {
      "id": 100,
      "description": "Pago luz",
      "amount": "15.00",
      "currency": "USD",
      "amountUsd": "15.00",
      "exchangeRateUsed": "35.500000",
      "date": "2026-02-01",
      "categoryId": 2,
      "accountId": 1,
      "type": "gasto"
    }
  ],
  "hasMore": true,
  "nextCursorDate": "2026-01-15"
}
```

⚠️ **Posibles Errores**
- 401 si falta token.

💡 **Nota de Lógica:** `grouped=1` devuelve un bloque de días completo hasta `pageSize` transacciones y genera `nextCursorDate` si hay más.

---

### ➕ POST /transactions
**Propósito:** Crea una transacción de ingreso o gasto.

🔐 **Permisos:** Requiere token.

📥 **Request Body**
```json
{
  "description": "Pago luz",
  "amount": 15.00,
  "currency": "USD",
  "date": "2026-02-01",
  "categoryId": 2,
  "accountId": 1,
  "commission": 0
}
```

📤 **Respuesta Exitosa (201 Created)**
```json
{
  "ok": true,
  "newId": 101,
  "tx": {
    "id": 101,
    "description": "Pago luz",
    "amount": "15.00",
    "currency": "USD",
    "amountUsd": "15.00",
    "exchangeRateUsed": null,
    "date": "2026-02-01",
    "categoryId": 2,
    "accountId": 1,
    "type": "expense"
  },
  "commissionTx": null
}
```

⚠️ **Posibles Errores**
- **400** por validación de esquema.
- **400/500** si la categoría o cuenta no pertenece al usuario.

💡 **Nota de Lógica:** si `commission > 0`, se crea una transacción adicional de comisión.

---

### 🔁 POST /transactions/transfer
**Propósito:** Crea una transferencia entre cuentas (genera 2 o 3 transacciones).

🔐 **Permisos:** Requiere token.

📥 **Request Body**
```json
{
  "fromAccountId": 1,
  "toAccountId": 2,
  "amount": 100,
  "commission": 1.5,
  "date": "2026-02-01",
  "concept": "Ahorro"
}
```

📤 **Respuesta Exitosa (201 Created)**
```json
{
  "ok": true,
  "transfer": {
    "outTx": { "id": 200, "type": "expense" },
    "inTx": { "id": 201, "type": "income" },
    "commissionTx": { "id": 202, "type": "expense" }
  }
}
```

⚠️ **Posibles Errores**
- **400** si `fromAccountId` y `toAccountId` son iguales.
- **400** si el monto es inválido o la fecha falta.
- **400** si monedas entre cuentas son distintas (no soportado).

💡 **Nota de Lógica:** el sistema crea categorías “Transferencia” y “comision” si no existen y evita duplicados recientes (ventana de 2 minutos).

---

### ✏️ PATCH /transactions?id=:id
**Propósito:** Actualiza una transacción.

🔐 **Permisos:** Requiere token.

📥 **Query Parameters**
| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| id | int | ✅ | — | ID de transacción |

📥 **Request Body**
```json
{
  "description": "Pago luz - Feb",
  "amount": 20,
  "currency": "USD",
  "date": "2026-02-02",
  "categoryId": 2,
  "accountId": 1
}
```

📤 **Respuesta Exitosa (200 OK)**
```json
{
  "ok": true,
  "tx": {
    "id": 101,
    "description": "Pago luz - Feb",
    "amount": "20.00",
    "currency": "USD",
    "amountUsd": "20.00",
    "exchangeRateUsed": null,
    "date": "2026-02-02",
    "categoryId": 2,
    "accountId": 1,
    "type": "expense"
  },
  "message": "Transacción actualizada"
}
```

⚠️ **Posibles Errores**
- **400** si `id` es inválido.
- **404** si la transacción no existe o no pertenece al usuario.

💡 **Nota de Lógica:** se recalculan balances y tasas si cambia monto/moneda/fecha.

---

### 🗑️ DELETE /transactions?id=:id
**Propósito:** Elimina una transacción y revierte su impacto en balance.

🔐 **Permisos:** Requiere token.

📥 **Query Parameters**
| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| id | int | ✅ | — | ID de transacción |

📤 **Respuesta Exitosa (200 OK)**
```json
{
  "ok": true
}
```

⚠️ **Posibles Errores**
- **404** si la transacción no existe o no pertenece al usuario.

---

### 📤 GET /transactions/transfer/export
**Propósito:** Exporta transferencias (XLSX/PDF) con filtros simples.

🔐 **Permisos:** Requiere token.

📥 **Query Parameters**
| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| format | string | ❌ | xlsx | `pdf` o `xlsx` |
| from_date | string | ❌ | null | YYYY-MM-DD |
| to_date | string | ❌ | null | YYYY-MM-DD |
| account_id | int | ❌ | null | ID cuenta |
| include_commission | boolean | ❌ | false | Incluye comisiones |

📤 **Respuesta Exitosa (200 OK)**
- Archivo descargable `transfers_YYYY-MM-DD.pdf|xlsx`.

⚠️ **Posibles Errores**
- **400** si el formato o fechas no son válidas.

---

### 📤 POST /transactions/transfer/export
**Propósito:** Exportación avanzada de transferencias o lista de transacciones (según body).

🔐 **Permisos:** Requiere token.

📥 **Request Body (modo exportar transferencias)**
```json
{
  "format": "xlsx",
  "from_date": "2026-01-01",
  "to_date": "2026-02-01",
  "account_id": 1,
  "include_commission": false
}
```

📥 **Request Body (modo exportar lista de transacciones)**
```json
{
  "format": "pdf",
  "title": "Mis Transacciones",
  "createdBy": "demo@correo.com",
  "items": [
    {
      "id": 100,
      "description": "Pago luz",
      "amount": 15,
      "currency": "USD",
      "amountUsd": 15,
      "exchangeRateUsed": 35.5,
      "date": "2026-02-01",
      "categoryId": 2,
      "accountId": 1,
      "type": "expense"
    }
  ],
  "accounts": [
    { "id": 1, "name": "Banco", "currency": "USD" }
  ],
  "categories": [
    { "id": 2, "name": "Servicios", "type": "gasto" }
  ]
}
```

📤 **Respuesta Exitosa (200 OK)**
- Archivo descargable `transfers_YYYY-MM-DD.pdf|xlsx` o `transactions_YYYY-MM-DD.pdf|xlsx`.

⚠️ **Posibles Errores**
- **400** si el formato o fechas no son válidas.

💡 **Nota de Lógica:** si el body incluye `items[]`, se usa un renderizado más visual (React-PDF) o se fallback a PDFKit.

---

### 📤 GET /transactions/export
**Propósito:** Exporta **todas** las transacciones con filtros (PDF/XLSX) desde base de datos.

🔐 **Permisos:** Requiere token.

📥 **Query Parameters**
| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| format | string | ❌ | pdf | `pdf` o `xlsx` |
| q | string | ❌ | null | Búsqueda por descripción o categoría |
| type | string | ❌ | null | `income`, `expense`, `ingreso`, `gasto` |
| categoryId | string | ❌ | null | ID o lista separada por coma |
| accountId | string | ❌ | null | ID o lista separada por coma |
| date | string | ❌ | null | YYYY-MM-DD |
| dateFrom | string | ❌ | null | YYYY-MM-DD |
| dateTo | string | ❌ | null | YYYY-MM-DD |
| month | string | ❌ | null | YYYY-MM |
| includeInStats | boolean | ❌ | null | true/false/1/0 |

📤 **Respuesta Exitosa (200 OK)**
- Archivo descargable `transactions_YYYY-MM-DD.pdf|xlsx`.

⚠️ **Posibles Errores**
- **400** si `format` es inválido.

---

## 📊 Módulo de Resumen

### 💰 GET /summary/balance
**Propósito:** Retorna balance consolidado o de una cuenta específica (USD).

🔐 **Permisos:** Requiere token.

📥 **Query Parameters**
| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| accountId | string | ❌ | null | ID o lista separada por coma |
| q | string | ❌ | null | Filtro por descripción/categoría |
| categoryId | string | ❌ | null | ID o lista |
| date | string | ❌ | null | YYYY-MM-DD |
| dateFrom | string | ❌ | null | YYYY-MM-DD |
| dateTo | string | ❌ | null | YYYY-MM-DD |
| month | string | ❌ | null | YYYY-MM |
| includeInStats | boolean | ❌ | null | true/false/1/0 |

📤 **Respuesta Exitosa (200 OK) - múltiples cuentas**
```json
{
  "ok": true,
  "balance": {
    "accounts_total_usd": 300.50,
    "income_total_usd": 1000,
    "expense_total_usd": 699.5,
    "net_total_usd": 300.5
  }
}
```

📤 **Respuesta Exitosa (200 OK) - una sola cuenta**
```json
{
  "ok": true,
  "balance": 120.25
}
```

---

### 📈 GET /summary/income
**Propósito:** Resumen de ingresos (total o mensual).

🔐 **Permisos:** Requiere token.

📥 **Query Parameters**
| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| from_month | string | ❌ | null | YYYY-MM para resumen mensual |
| to_month | string | ❌ | null | YYYY-MM |
| includeInStats | boolean | ❌ | null | true/false/1/0 |
| q | string | ❌ | null | búsqueda |
| categoryId | string | ❌ | null | ID o lista |
| accountId | string | ❌ | null | ID o lista |
| date | string | ❌ | null | YYYY-MM-DD |
| dateFrom | string | ❌ | null | YYYY-MM-DD |
| dateTo | string | ❌ | null | YYYY-MM-DD |
| month | string | ❌ | null | YYYY-MM |

📤 **Respuesta Exitosa (200 OK) - total simple**
```json
{
  "ok": true,
  "income_total": 1000.5
}
```

📤 **Respuesta Exitosa (200 OK) - resumen mensual**
```json
{
  "ok": true,
  "income_total": 1500,
  "income": [
    {
      "income_2026-01": 500,
      "income_2026-02": 1000
    }
  ]
}
```

---

### 📉 GET /summary/expense
**Propósito:** Resumen de gastos (total o mensual).

🔐 **Permisos:** Requiere token.

📥 **Query Parameters** *(mismos que /summary/income)*

📤 **Respuesta Exitosa (200 OK) - total simple**
```json
{
  "ok": true,
  "expense_total": 700.25
}
```

📤 **Respuesta Exitosa (200 OK) - resumen mensual**
```json
{
  "ok": true,
  "expense_total": 900,
  "expense": [
    {
      "expense_2026-01": 400,
      "expense_2026-02": 500
    }
  ]
}
```

---

## 📈 Módulo de Estadísticas

### 📊 GET /stats/net-cash-flow
**Propósito:** Flujo neto de caja y tasa de ahorro por periodo.

🔐 **Permisos:** Requiere token.

📥 **Query Parameters**
| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| from_date | string | ✅ | — | YYYY-MM-DD |
| to_date | string | ✅ | — | YYYY-MM-DD |
| time_unit | string | ❌ | month | `month` o `week` |
| accountId | string | ❌ | null | ID o lista |

📤 **Respuesta Exitosa (200 OK)**
```json
{
  "summary": {
    "total_income": 1500,
    "total_expenses": 900,
    "net_cash_flow": 600,
    "avg_savings_rate": 0.4
  },
  "time_series": [
    {
      "period": "2026-01",
      "income": 700,
      "expenses": 300,
      "net_flow": 400,
      "savings_rate": 0.57
    }
  ]
}
```

⚠️ **Posibles Errores**
- **400** si faltan fechas o formato inválido.

---

### 🔥 GET /stats/spending-heatmap
**Propósito:** Heatmap de gastos por categoría y día de semana.

🔐 **Permisos:** Requiere token.

📥 **Query Parameters**
| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| from_date | string | ✅ | — | YYYY-MM-DD |
| to_date | string | ✅ | — | YYYY-MM-DD |
| accountId | string | ❌ | null | ID o lista |

📤 **Respuesta Exitosa (200 OK)**
```json
{
  "categories": ["Comida", "Servicios"],
  "weekdays": ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"],
  "data_points": [
    { "category_idx": 0, "day_idx": 2, "amount": 40 }
  ],
  "summary": {
    "peak_category": "Comida",
    "peak_day": "Martes"
  }
}
```

---

### 📦 GET /stats/expense-volatility
**Propósito:** Estadísticas de volatilidad (boxplot) por categoría de gastos.

🔐 **Permisos:** Requiere token.

📥 **Query Parameters**
| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| from_date | string | ✅ | — | YYYY-MM-DD |
| to_date | string | ✅ | — | YYYY-MM-DD |
| top_n_categories | int | ❌ | 5 | Top N categorías |

📤 **Respuesta Exitosa (200 OK)**
```json
{
  "categories_data": [
    { "category": "Comida", "count": 10, "q1": 5, "median": 10, "q3": 20, "min": 2, "max": 40, "outliers": [60] }
  ]
}
```

---

### 🔁 GET /stats/comparative-mom
**Propósito:** Comparación Month-over-Month (gastos).

🔐 **Permisos:** Requiere token.

📥 **Query Parameters**
| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| date | string | ❌ | hoy | Fecha base YYYY-MM-DD |

📤 **Respuesta Exitosa (200 OK)**
```json
{
  "summary": {
    "current_period_name": "Febrero MTD (1-3)",
    "previous_period_name": "Enero MTD (1-3)",
    "current_total": 300,
    "previous_total": 200,
    "total_delta_usd": 100,
    "total_delta_percent": 0.5
  },
  "categories_comparison": [
    { "category": "Comida", "current_amount": 120, "previous_amount": 80, "delta_percent": 0.5 }
  ]
}
```

---

### 📆 GET /stats/monthly-forecast
**Propósito:** Proyección de gasto mensual y desviación de presupuesto.

🔐 **Permisos:** Requiere token.

📥 **Query Parameters**
| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| date | string | ❌ | hoy | Fecha base YYYY-MM-DD |
| accountId | string | ❌ | null | ID o lista |
| budget_total | number | ❌ | null | Presupuesto mensual |

📤 **Respuesta Exitosa (200 OK)**
```json
{
  "current_date": "2026-02-03",
  "days_in_month": 28,
  "days_elapsed": 3,
  "current_spending_mtd": 40,
  "avg_daily_spending": 13.33,
  "projected_total_spending": 373.24,
  "budget_total": 300,
  "projected_over_under": 73.24
}
```

---

### 🌤️ GET /stats/income-heatmap
**Propósito:** Heatmap de ingresos por categoría y día.

🔐 **Permisos:** Requiere token.

📥 **Query Parameters** *(mismos que /stats/spending-heatmap)*

📤 **Respuesta Exitosa (200 OK)**
```json
{
  "categories": ["Salario"],
  "weekdays": ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"],
  "data_points": [
    { "category_idx": 0, "day_idx": 1, "amount": 1000 }
  ],
  "summary": {
    "peak_category": "Salario",
    "peak_day": "Lunes"
  }
}
```

---

### 📦 GET /stats/income-volatility
**Propósito:** Volatilidad de ingresos por categoría.

🔐 **Permisos:** Requiere token.

📥 **Query Parameters** *(mismos que /stats/expense-volatility)*

📤 **Respuesta Exitosa (200 OK)**
```json
{
  "categories_data": [
    { "category": "Salario", "count": 3, "q1": 900, "median": 1000, "q3": 1100, "min": 850, "max": 1200, "outliers": [] }
  ]
}
```

---

### 🔁 GET /stats/comparative-mom-income
**Propósito:** Comparación Month-over-Month (ingresos).

🔐 **Permisos:** Requiere token.

📥 **Query Parameters**
| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| date | string | ❌ | hoy | Fecha base YYYY-MM-DD |

📤 **Respuesta Exitosa (200 OK)**
```json
{
  "summary": {
    "current_period_name": "Febrero MTD (1-3)",
    "previous_period_name": "Enero MTD (1-3)",
    "current_total": 1500,
    "previous_total": 1300,
    "total_delta_usd": 200,
    "total_delta_percent": 0.15
  },
  "categories_comparison": [
    { "category": "Salario", "current_amount": 1500, "previous_amount": 1300, "delta_percent": 0.15 }
  ]
}
```

---

## 🧪 Errores Estándar
- **400** Validación (Joi) o parámetros inválidos.
- **401** No autorizado (token faltante/ inválido).
- **404** Recurso inexistente.
- **500** Error interno.

---

✅ **Cobertura total:** Todos los endpoints definidos en `routes/` están documentados por módulo funcional.
