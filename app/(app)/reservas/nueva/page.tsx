'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import BookingForm from '@/components/BookingForm';

function NewBooking() {
  const params = useSearchParams();
  return <BookingForm initialDate={params.get('fecha') ?? undefined} />;
}

export default function NewBookingPage() {
  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">— Agenda</p>
          <h1>Nuevo <em>turno</em></h1>
        </div>
      </div>
      <Suspense fallback={<p className="empty">Cargando…</p>}>
        <NewBooking />
      </Suspense>
    </div>
  );
}
