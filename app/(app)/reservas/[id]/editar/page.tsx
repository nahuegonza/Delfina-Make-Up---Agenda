'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import BookingForm from '@/components/BookingForm';
import { fetchBooking } from '@/lib/data';
import type { BookingFull } from '@/lib/types';

export default function EditBookingPage() {
  const { id } = useParams<{ id: string }>();
  const [b, setB] = useState<BookingFull | null | undefined>(undefined);
  useEffect(() => {
    fetchBooking(id).then(setB);
  }, [id]);

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">— Editar</p>
          <h1>{b?.clients?.name ?? 'Turno'} <em>· {b?.service_name ?? ''}</em></h1>
        </div>
      </div>
      {b === undefined ? <p className="empty">Cargando…</p> : b === null ? <p className="empty">No se encontró el turno.</p> : <BookingForm initial={b} />}
    </div>
  );
}
