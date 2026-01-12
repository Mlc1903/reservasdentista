"use client";

import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { createClient } from "@supabase/supabase-js";

// Conexión a Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Las variables de entorno de Supabase no están definidas");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default function CalendarView() {
  const [events, setEvents] = useState([]);

  // Función para traer citas desde Supabase
  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id,
        appointmentDate,
        appointmentTime,
        patients:patients(fullName),
        dentists:dentists(fullName),
        treatments:treatments(name)
      `);

    if (error) {
      console.error("Error cargando citas:", error);
      return;
    }

    const formatted = data.map((a) => ({
      id: a.id,
      title: `${a.treatments.name} - ${a.patients.fullName}`,
      start: `${a.appointmentDate}T${a.appointmentTime}`,
      backgroundColor: "#3B82F6",
      borderColor: "#2563EB",
    }));

    setEvents(formatted);
  };

  // useEffect con Supabase Realtime
  useEffect(() => {
    // Inicializar citas al montar
    fetchAppointments();

    // Escuchar nuevos inserts en 'appointments'
    const subscription = supabase
      .channel("appointments_channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "appointments" },
        (payload) => {
          console.log("Nueva cita detectada:", payload.new);
          fetchAppointments(); // recargar automáticamente
        }
      )
      .subscribe();

    // Limpiar suscripción al desmontar
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <div className="p-4 bg-white rounded-2xl shadow-md">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={events}
        editable={false}
        selectable={true}
        height="auto"
        eventClick={(info) => alert(`Cita: ${info.event.title}`)}
      />
    </div>
  );
}
