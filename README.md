# Agenda · Delfina Acuña Makeup

App web privada para gestionar los turnos de Delfina Acuña Makeup: carga de turnos, calendario con bloqueo de traslados, confirmaciones por WhatsApp (con un toque) y por mail (automáticas), recordatorios y dashboard.

**Tecnología:** Next.js 15 · Supabase (base de datos y login) · Resend (mails) · Vercel (hosting y recordatorios diarios).

## Qué hace

- **Inicio:** turnos de hoy con lo que hay que cobrar, mensajes para enviar, próximos turnos, ingresos del mes, saldos sin cobrar y consultas sin seña.
- **Calendario:** vista mensual con el estado de cada turno y el detalle del día, incluyendo los traslados.
- **Nuevo turno:** busca clientas existentes o crea nuevas, completa duración y precio según el servicio, calcula la hora de inicio desde la hora en que tiene que estar lista, calcula la seña del 10% o 15% y avisa si el turno se superpone con otro.
- **Detalle del turno:** estado, botones de WhatsApp para cada mensaje, mails, "Cómo llegar" y "Agregar a Google Calendar".
- **Clientas:** buscador, datos, notas e historial.
- **Servicios:** duración, precio y si llevan prueba previa. Se cargan solos la primera vez.

### Mensajes

| Mensaje | Cuándo | WhatsApp | Mail |
| --- | --- | --- | --- |
| Confirmación | Al recibir la seña | Con un toque (el turno pasa a Confirmada) | Automático al confirmar |
| Coordinar prueba | 30 días antes (novias y quinceañeras) | Recordatorio para Delfina | — |
| Indicaciones previas | 7 días antes | Con un toque | Automático, 9:00 h |
| Recordatorio | 1 día antes | Con un toque | Automático, 9:00 h |
| Agradecimiento | 1 día después | Con un toque | Automático, 9:00 h |

Los textos están en `lib/messages.ts`.

## Puesta en marcha

Ver la guía paso a paso que acompaña este código. Resumen:

1. Crear un proyecto en Supabase y correr `supabase/schema.sql` en el SQL Editor.
2. En Supabase, crear la usuaria de Delfina (Authentication → Users → Add user) y desactivar los registros nuevos.
3. Crear una cuenta en Resend y verificar el dominio `delfinamakeup.com`.
4. Subir este código a GitHub e importarlo en Vercel con las variables de `.env.example`.

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # completar los valores
npm run dev
```
