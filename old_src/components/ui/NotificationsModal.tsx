"use client";

import { useState, useEffect } from "react";
import { Bell, Cake, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";

interface Notification {
  id: string;
  type: "birthday";
  title: string;
  body: string;
  date: string;
  participantId?: number;
}

export function NotificationsModal({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [birthdaysToday, setBirthdaysToday] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Cargar notificaciones desde localStorage
      const saved = localStorage.getItem("app_notifications");
      if (saved) {
        setNotifications(JSON.parse(saved));
      }

      // Cargar cumpleañeros del día
      loadBirthdays();
    }
  }, [isOpen]);

  const loadBirthdays = async () => {
    try {
      const response = await fetch("/api/participants");
      if (response.ok) {
        const participants = await response.json();
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).toString().padStart(2, "0");

        const birthdays = (participants || []).filter((p) => {
          if (!p.fechaNacimiento) return false;
          const [, , birthMonthDay] = p.fechaNacimiento.split("-");
          return birthMonthDay === `${month}-${day}`;
        });

        setBirthdaysToday(birthdays);
      }
    } catch (error) {
      console.error("Error loading birthdays:", error);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    localStorage.removeItem("app_notifications");
  };

  const allNotifications = [
    ...birthdaysToday.map((p) => ({
      id: `birthday-${p.id}`,
      type: "birthday" as const,
      title: "🎂 ¡Feliz Cumpleaños!",
      body: `${p.nombre} ${p.apellido} cumple años hoy`,
      date: new Date().toISOString(),
      participantId: p.id,
    })),
    ...notifications,
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notificaciones
          </DialogTitle>
        </DialogHeader>

        {allNotifications.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No hay notificaciones</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allNotifications.map((notif) => (
              <div
                key={notif.id}
                className="bg-white rounded-xl p-4 border border-surface-dark"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {notif.type === "birthday" && (
                      <Cake className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm">{notif.title}</div>
                    <div className="text-xs text-text-muted mt-1">
                      {notif.body}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {notifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearNotifications}
                className="w-full mt-2"
              >
                Limpiar notificaciones
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}