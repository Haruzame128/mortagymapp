# Guía de Interfaz - Sistema de Sueldos

## 📍 Ubicación
**Menú Principal → Sueldos** (entre Profesores y Gastos)

---

## 🎯 Pantalla Principal

### Encabezado
```
┌─────────────────────────────────────────────────────────┐
│ Gestión de Sueldos                  Mes: [Enero 2025 ▼] │
└─────────────────────────────────────────────────────────┘
```
- **Selector de mes:** Permite elegir qué mes consultar

---

### Resumen (3 Cards)

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Total a    │  │   Total      │  │  Pendiente   │
│   Pagar      │  │   Pagado     │  │              │
│              │  │              │  │              │
│  $ 15.250,00 │  │  $ 5.100,00  │  │  $ 10.150,00 │
│   (azul)     │  │   (verde)    │  │  (rojo)      │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## 📊 Tabla de Sueldos

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Cálculo de Sueldos - Enero 2025                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ Profesor         │ %   │ Clientes │ Monto a Pagar │ Estado    │  Acciones  │
├──────────────────────────────────────────────────────────────────────────────┤
│ Juan Pérez       │ 20% │    15    │  $ 7.500,00   │ Pendiente │ 👁️ [Pagar] │
│ María López      │ 15% │     8    │  $ 3.200,00   │ Pendiente │ 👁️ [Pagar] │
│ Martin Diaz      │ 18% │    12    │  $ 4.320,00   │ Pagado    │ 👁️  [✓✓]  │
│ Laura Rodriguez  │ 22% │    10    │  $ 2.200,00   │ Pendiente │ 👁️ [Pagar] │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Columnas:**
- **Profesor:** Nombre del docente
- **%:** Porcentaje de comisión configurado
- **Clientes:** Cantidad de clientes pagos en sus horarios
- **Monto a Pagar:** Cálculo automático (monto base × porcentaje)
- **Estado:** Pendiente o Pagado
- **Acciones:** 
  - 👁️ Ver detalles (abre modal con desglose)
  - [Pagar] - Botón verde si está pendiente
  - [✓✓] - Deshabilitado si ya está pagado

---

## 📋 Modal: Ver Detalles de Cálculo

Se abre al hacer click en el icono de ojo (👁️)

```
┌─────────────────────────────────────────────────────┐
│ Detalle de Cálculo - Juan Pérez               [X]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌──────────────────────────────────────────────┐   │
│ │ Porcentaje: 20%        │ Mes: Enero 2025    │   │
│ │ Clientes Pagos: 15     │ Monto Base: $ 7.500│   │
│ └──────────────────────────────────────────────┘   │
│                                                     │
│ Fórmula de Cálculo:                                 │
│ $ 7.500 × (20 ÷ 100) = $ 1.500                     │
│                                                     │
│ Clientes en sus Horarios (15)                       │
│ ┌─────────────────────────────────────────────┐    │
│ │ Cliente              │ Precio  │ Estado    │    │
│ ├─────────────────────────────────────────────┤    │
│ │ Pedro González       │ $ 500   │ Pagado   │    │
│ │ Ana Martínez         │ $ 500   │ Pagado   │    │
│ │ [15 registros]       │ ...     │ ...      │    │
│ └─────────────────────────────────────────────┘    │
│                                                     │
│                                      [Cerrar]      │
└─────────────────────────────────────────────────────┘
```

---

## 💰 Modal: Pagar Sueldo

Se abre al hacer click en el botón [Pagar]

```
┌─────────────────────────────────────────────────────┐
│ Pagar Sueldo - Juan Pérez                   [X]     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌──────────────────────────────────────────────┐   │
│ │ Porcentaje: 20%     │ Clientes Pagos: 15    │   │
│ │─────────────────────────────────────────────│   │
│ │ Monto Total a Pagar:  $ 7.500,00 (VERDE)   │   │
│ └──────────────────────────────────────────────┘   │
│                                                     │
│ Medio de Pago *                                     │
│ ┌──────────────────────────────────────────────┐   │
│ │ -- Seleccionar --                    [▼]    │   │
│ │ □ Efectivo                                   │   │
│ │ □ Débito                                     │   │
│ │ □ Transferencia                              │   │
│ │ □ Crédito                                    │   │
│ └──────────────────────────────────────────────┘   │
│                                                     │
│ Número de Comprobante                               │
│ ┌──────────────────────────────────────────────┐   │
│ │ Ej: TRF-001, CHQ-123                     [_] │   │
│ └──────────────────────────────────────────────┘   │
│                                                     │
│ Observaciones                                       │
│ ┌──────────────────────────────────────────────┐   │
│ │                                              │   │
│ │ Notas adicionales sobre el pago         [_] │   │
│ │                                              │   │
│ └──────────────────────────────────────────────┘   │
│                                                     │
│                 [Cancelar]  [✓ Confirmar Pago]     │
└─────────────────────────────────────────────────────┘
```

**Campos:**
- **Medio de Pago** (requerido): Dropdown con opciones
- **Número de Comprobante** (opcional): Referencia del pago
- **Observaciones** (opcional): Notas adicionales

**Al confirmar:**
- Registra el pago en base de datos
- Registra egreso automático en sección Gastos
- Actualiza el estado a "Pagado"
- Muestra toast de éxito
- Cierra modal y actualiza tabla

---

## 📜 Historial de Pagos

Secc última sección de la página

```
┌────────────────────────────────────────────────────┐
│ Historial de Pagos                                 │
├────────────────────────────────────────────────────┤
│                                                    │
│ ┌──────────────────────────────────────────────┐  │
│ │ Profesor    │ Mes │ Monto  │ Pago │ Fecha   │  │
│ ├──────────────────────────────────────────────┤  │
│ │ Juan Pérez  │ Ene │ $7.500 │ TRF  │ 01/02   │  │
│ │ María López │ Ene │ $3.200 │ Efec │ 02/02   │  │
│ │ Martin Diaz │ Dic │ $4.400 │ Trans│ 15/01   │  │
│ │ Juan Pérez  │ Dic │ $7.000 │ Débito│ 15/01  │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│                 [◄] [1] [2] [3] [►]                │
└────────────────────────────────────────────────────┘
```

**Muestra:** Últimos pagos registrados en orden descendente

---

## 🔄 Flujo de Uso Completo

1. **Admin entra a Sueldos** → Selector de mes con mes actual
2. **Revisa resumen** → Ve totales, pagados y pendientes
3. **Analiza tabla** → Identifica quién cobra y cuánto
4. **Opción 1 - Ver detalles:**
   - Click en icono 👁️
   - Se abre modal con desglose de cálculo
   - Puede verificar clientes y precios
   - Cierra modal
5. **Opción 2 - Pagar:**
   - Click en [Pagar]
   - Se abre modal de confirmación
   - Selecciona medio de pago
   - Completa número de comprobante (opcional)
   - Agregar observaciones si es necesario
   - Confirma
   - Sistema registra automáticamente:
     - ✅ Registro de sueldo pagado
     - ✅ Egreso en Gastos (categoría: Sueldo)
   - Tabla se actualiza: estado → "Pagado"
   - Toast verde de éxito
6. **Revisa historial** → Verifica pagos anteriores

---

## 🎨 Estilos y Colores

- **Pendiente:** Badge amarillo/naranja
- **Pagado:** Badge verde
- **Total a Pagar:** Texto azul
- **Total Pagado:** Texto verde
- **Pendiente:** Texto rojo
- **Botón Pagar:** Verde (#198754)
- **Estado Pagado (deshabilitado):** Gris

---

## ⚡ Validaciones

✅ Mes seleccionado válido (YYYY-MM)
✅ Solo administrador puede acceder
✅ No puede pagar 2 veces el mismo sueldo en el mismo mes
✅ Medio de pago requerido
✅ Monto auto-calculado (no editable)
✅ Cada pago se integra con Gastos automáticamente

---

## 📱 Responsive

- ✅ Desktop: Tabla completa
- ✅ Tablet: Tabla con scroll horizontal
- ✅ Mobile: Adapta bien con cards

---

## 🔗 Integración con Otros Módulos

### Gastos
- Cada pago de sueldo crea automáticamente un egreso
- Categoría: "Sueldo"
- Se verá en gráficos de gastos

### Profesores
- Muestra porcentaje de cada profesor (editable en su ficha)
- Usa datos de horarios asignados

### Movimientos (API)
- Registra como egreso automáticamente
- Rastrea fecha y medio de pago
