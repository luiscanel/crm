# PROMPT PARA SOFTWARE DE GESTIÓN DE LLAMADAS EN FRÍO (COLD CALLING CRM)

## Rol
Eres un arquitecto de software senior especializado en CRM comerciales, ventas B2B y gamificación, con experiencia en dashboards, seguimiento de clientes y métricas de desempeño.

## Objetivo
Diseñar un software web de gestión de llamadas en frío para un equipo de ventas compuesto inicialmente por 2 vendedores, enfocado en prospección B2B, seguimiento de leads y motivación mediante gamificación.

---

## 🧩 Funcionalidades Principales

### 👥 Gestión de Usuarios (Vendedores)
- Crear usuarios con rol Vendedor
- Asignar clientes/empresas a cada vendedor
- Visualizar desempeño individual y comparativo
- Registro automático de actividades realizadas

### 📞 Gestión de Llamadas en Frío
- Registro manual o automático de llamadas realizadas
- **Métrica diaria por vendedor:**
  - ✅ 25 llamadas por día
  - ✅ 25 empresas distintas contactadas
- **Estado de la llamada:**
  - No contestarar
  - Llamada rechazada
  - Llamada efectiva
  - Interesado
  - No interesado
- Observaciones por llamada

### 🏢 Gestión de Empresas (Leads)
Guardar y administrar la información de cada empresa:
- Nombre de la empresa
- Industria / giro
- Tamaño de empresa
- Ubicación
- **Estado del lead:**
  - Nuevo
  - Contactado
  - Interesado
  - Cita agendada
  - Seguimiento
  - Cerrado / No interesado
- Historial completo de contactos y actividades

### 👤 Gestión de Contactos
Por cada empresa:
- Nombre del contacto
- Cargo
- Teléfono
- Email
- Canal de contacto preferido
- Nivel de interés (Bajo / Medio / Alto)
- Notas personalizadas

### 📅 Agendamiento de Citas
- Agendar citas desde la llamada
- Fecha y hora
- Tipo de cita (llamada / videollamada / presencial)
- Recordatorios automáticos
- Estado de la cita (Pendiente / Realizada / Cancelada)

### 🔁 Seguimiento del Cliente
- Línea de tiempo del cliente (timeline)
- Registro de:
  - Llamadas
  - Notas
  - Citas
  - Cambios de estado
- Alertas de seguimiento pendiente
- Próxima acción sugerida

### 🎮 Gamificación y Retos

#### 🏆 Sistema de Puntos
Asignar puntos por actividades:
- +1 punto por llamada realizada
- +3 puntos por contacto efectivo
- +5 puntos por empresa interesada
- +10 puntos por cita agendada

#### 🎯 Retos y Metas
- **Reto diario:** cumplir 25 llamadas
- **Reto semanal:**
  - Más empresas contactadas
  - Más citas agendadas
- **Reto mensual:**
  - Mayor tasa de conversión

#### 📊 Ranking de vendedores (Leaderboard)

#### 🏅 Insignias (Badges)
- "Máquina de Llamadas" – 100 llamadas
- "Cazador de Citas" – 20 citas agendadas
- "Conversión Pro" – >30% tasa de interés
- Visualización en perfil del vendedor

---

## 📊 Dashboard y Reportes

### Dashboard General
- Total de llamadas del día / semana / mes
- Empresas contactadas
- Leads interesados
- Citas agendadas
- Cumplimiento de metas (%)
- Ranking de vendedores

### Dashboard por Vendedor
- Actividades realizadas
- Retos completados
- Puntos acumulados
- Conversión personal
- Historial de desempeño

### 📈 Reportes
- Reporte diario, semanal y mensual
- Exportable a Excel / PDF
- Actividades por vendedor
- Cumplimiento de metas
- Leads generados
- Resultados de gamificación

---

## 🔐 Reglas y Validaciones
- No contar llamadas duplicadas a la misma empresa el mismo día
- Obligar a completar datos mínimos de la empresa
- Historial inalterable de actividades (auditoría)
- Roles escalables (Supervisor, Admin)

---

## 🧠 Experiencia de Usuario
- Interfaz simple y enfocada en velocidad
- Flujo rápido para registrar llamadas
- Diseño tipo CRM moderno
- Indicadores visuales de progreso
- Notificaciones claras