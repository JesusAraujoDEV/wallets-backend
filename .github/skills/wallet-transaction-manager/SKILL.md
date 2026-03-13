---
name: wallet-transaction-manager
description: Reglas críticas y advertencias de seguridad para crear, editar o eliminar transacciones financieras (transactions) y transferencias (transfers) en el sistema de wallets. Usa esta habilidad siempre que modifiques lógica relacionada con dinero o saldos.
---

# 🏦 Wallet Transaction Manager Guidelines

Cuando modifiques o crees servicios relacionados con `transactions` o `accounts` en la carpeta `/server/services`, DEBES adherirte estrictamente a estas reglas de negocio:

1. **Gestión Atómica:** Todas las operaciones que afecten el balance de una cuenta (`accounts.balance`) deben estar envueltas en una transacción de Sequelize (`sequelize.transaction`).
2. **Conversión de Moneda:** Si la transacción es en `VES`, debes invocar la función de consulta de la tasa BCV (`getVesPerUsdByDate`) para guardar el `amount_usd` y el `exchange_rate_used`. Si falla, usa el fallback configurado.
3. **⚠️ ALERTA DE SEGURIDAD (Prevención de Saldos Negativos):** Actualmente el sistema tiene un riesgo de deuda técnica. Si estás creando una transacción de tipo `gasto` o una transferencia de salida, **DEBES** implementar una validación previa para verificar que `accounts.balance >= amount`. Si no hay fondos suficientes, lanza un error HTTP 400.
4. **⚠️ ALERTA DE CONCURRENCIA (Race Conditions):** Cuando actualices el balance, evita el patrón "read-modify-write" simple. Intenta usar transacciones de base de datos con nivel de aislamiento adecuado o bloqueos (`SELECT ... FOR UPDATE` si aplica en PostgreSQL) para evitar pérdida de actualizaciones concurrentes.
5. **Transferencias Internas:** Recuerda que una transferencia no es un solo registro. Debes crear dos transacciones canónicas (una de salida y una de entrada) y opcionalmente una tercera para la comisión. Usa categorías del sistema (`isSystem=true`) y pon `includeInStats=false` para la transferencia y `true` para la comisión.