# Especificaciones del Sistema de Sueldos

## Descripción General
Sistema de gestión de pago de sueldos a profesores basado en:
- Porcentaje configurado para cada profesor
- Cantidad de clientes activos (pagos) en sus horarios
- Cálculo automático del monto a pagar

## Endpoints Backend Requeridos

### 1. `GET /api/admin/sueldos?mes=YYYY-MM`
**Descripción:** Obtiene el cálculo de sueldos para un mes específico

**Parámetros:**
- `mes` (string, requerido): Mes en formato YYYY-MM (ej: "2025-01")

**Respuesta:**
```json
[
  {
    "profesor_id": 1,
    "profesor_nombre": "Juan Pérez",
    "porcentaje": 20,
    "clientes_pagos": 15,
    "monto": 7500.50,
    "estado": "Pendiente"
  },
  {
    "profesor_id": 2,
    "profesor_nombre": "María López",
    "porcentaje": 15,
    "clientes_pagos": 8,
    "monto": 3200.00,
    "estado": "Pagado"
  }
]
```

**Lógica Backend:**
1. Obtener todos los profesores activos
2. Para cada profesor:
   - Contar clientes **pagos** (suscripción activa) en sus horarios asignados durante el mes
   - Calcular monto = (suma de precios de inscripciones/clientes) × (porcentaje / 100)
   - Verificar si ya fue pagado este mes en tabla `sueldos_pagados`
   - Estado = "Pagado" si existe registro en `sueldos_pagados` para ese mes y profesor
3. Retornar array ordenado por profesor_nombre

---

### 2. `GET /api/admin/sueldos/historial`
**Descripción:** Obtiene el historial completo de pagos realizados

**Respuesta:**
```json
[
  {
    "id": 1,
    "profesor_id": 1,
    "profesor_nombre": "Juan Pérez",
    "mes": "2025-01",
    "monto": 7500.50,
    "medio_pago": "Transferencia",
    "numero_comprobante": "TRF-001",
    "observaciones": "Pago mensual enero",
    "fecha_pago": "2025-02-01",
    "creado_en": "2025-02-01T10:30:00Z"
  }
]
```

**Nota:** Debe estar ordenado por `fecha_pago` descendente

---

### 3. `POST /api/admin/sueldos/pago`
**Descripción:** Registra el pago de un sueldo

**Body:**
```json
{
  "profesor_id": 1,
  "profesor_nombre": "Juan Pérez",
  "mes": "2025-01",
  "monto": 7500.50,
  "medio_pago": "Transferencia",
  "numero_comprobante": "TRF-001",
  "observaciones": "Pago mensual enero",
  "fecha": "2025-02-01"
}
```

**Respuesta:**
```json
{
  "id": 1,
  "success": true,
  "message": "Sueldo registrado correctamente"
}
```

**Validaciones:**
- Verificar que no exista pago previo para ese profesor en ese mes
- Validar que profesor_id y mes sean válidos
- Registrar en tabla `sueldos_pagados`

---

### 4. `GET /api/admin/sueldos/profesor/:id?mes=YYYY-MM`
**Descripción:** Obtiene detalles de cálculo de sueldo para un profesor en un mes

**Parámetros:**
- `:id` (integer): ID del profesor
- `mes` (string): Mes en formato YYYY-MM

**Respuesta:**
```json
{
  "profesor_id": 1,
  "profesor_nombre": "Juan Pérez",
  "porcentaje": 20,
  "mes": "2025-01",
  "clientes_detalle": [
    {
      "cliente_id": 10,
      "cliente_nombre": "Pedro González",
      "inscripcion_precio": 500,
      "estado_pago": "Pagado"
    },
    {
      "cliente_id": 11,
      "cliente_nombre": "Ana Martínez",
      "inscripcion_precio": 500,
      "estado_pago": "Pagado"
    }
  ],
  "clientes_pagos": 2,
  "monto_base": 1000,
  "monto_final": 7500.50,
  "estado": "Pendiente"
}
```

---

## Tablas Base de Datos Requeridas

### Tabla: `profesores`
```sql
ALTER TABLE profesores ADD COLUMN IF NOT EXISTS porcentaje DECIMAL(5,2) DEFAULT 0;
```

### Tabla Nueva: `sueldos_pagados`
```sql
CREATE TABLE IF NOT EXISTS sueldos_pagados (
  id INT PRIMARY KEY AUTO_INCREMENT,
  profesor_id INT NOT NULL,
  mes CHAR(7) NOT NULL, -- Formato YYYY-MM
  monto DECIMAL(12,2) NOT NULL,
  medio_pago VARCHAR(50), -- Efectivo, Débito, Transferencia, Crédito
  numero_comprobante VARCHAR(100),
  observaciones TEXT,
  fecha_pago DATE NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_profesor_mes (profesor_id, mes),
  FOREIGN KEY (profesor_id) REFERENCES profesores(id) ON DELETE RESTRICT
);
```

---

## Cálculo de Monto

### Fórmula Base:
```
monto = (suma_de_precios_clientes_pagos) × (porcentaje_profesor / 100)
```

### Ejemplo:
```
Profesor: Juan Pérez
Porcentaje: 20%
Clientes pagos en su horario: 15
Precio promedio inscripción: 500

Suma de precios = 15 × 500 = $7.500
Monto = $7.500 × (20 / 100) = $1.500
```

---

## Consideraciones

1. **Clientes Activos:** Solo contar clientes con estado "Pagado" (que tengan cuota activa/vigente)
2. **Horarios:** Considerar todos los horarios asignados al profesor
3. **Mes:** El sistema usa mes completo (YYYY-MM)
4. **Evitar Duplicados:** Un profesor solo puede tener 1 pago registrado por mes
5. **Integración con Gastos:** Cada pago se registra como "Egreso" en tabla de movimientos con categoría "Sueldo"

---

## Flujo de Uso

1. **Admin entra a sección Sueldos**
2. **Selecciona mes** a calcular
3. **Sistema muestra tabla** con profesores y sueldos calculados
4. **Admin hace click en "Pagar"** en un profesor
5. **Se abre modal** con:
   - Datos del profesor (nombre, porcentaje, clientes pagos)
   - Monto total a pagar
   - Opción de seleccionar medio de pago
   - Campo para número de comprobante (opcional)
   - Campo para observaciones (opcional)
6. **Confirma el pago**
7. **Sistema registra:**
   - En tabla `sueldos_pagados`
   - En tabla `movimientos` como egreso (categoría: Sueldo)
8. **Tabla se actualiza** mostrando estado "Pagado"
9. **Se registra en historial** de pagos

---

## API Calls en Frontend

```javascript
// En sueldosApi (api.js)
export const sueldosApi = {
  getSueldosMes: (mes) => get(`/api/admin/sueldos?mes=${mes}`),
  getHistorial: () => get("/api/admin/sueldos/historial"),
  registrarPago: (data) => post("/api/admin/sueldos/pago", data),
  getDetalleProfesor: (profesorId, mes) =>
    get(`/api/admin/sueldos/profesor/${profesorId}?mes=${mes}`),
};
```

✅ Ya está implementado en el frontend
