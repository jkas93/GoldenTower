'use client';

import { useEffect, useState, useRef } from 'react';
import { Bell, X, CheckCheck, AlertTriangle, Info, Zap } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { auth } from '@/lib/firebase/clientApp';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'INFO' | 'WARNING' | 'ALERT';
    isRead: boolean;
    createdAt: string;
    link?: string;
}

const TYPE_CONFIG = {
    INFO:    { icon: <Info className="w-4 h-4" />,          color: 'text-blue-400',   bg: 'bg-blue-500/10' },
    WARNING: { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-amber-400',  bg: 'bg-amber-500/10' },
    ALERT:   { icon: <Zap className="w-4 h-4" />,          color: 'text-red-400',    bg: 'bg-red-500/10' },
};

export default function NotificationBell({ userRole }: { userRole: string }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const loadNotifications = async () => {
        try {
            const user = auth.currentUser;
            if (!user) return;
            const data = await fetchApi<Notification[]>(`/notifications/${user.uid}?role=${userRole}`);
            setNotifications(data);
        } catch (e) {
            // Silently fail — notifications are not critical
        }
    };

    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, [userRole]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkRead = async (id: string) => {
        try {
            await fetchApi(`/notifications/${id}/read`, { method: 'PATCH' });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (e) {}
    };

    const handleMarkAllRead = async () => {
        const unread = notifications.filter(n => !n.isRead);
        for (const n of unread) {
            await handleMarkRead(n.id);
        }
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h`;
        return `${Math.floor(hrs / 24)}d`;
    };

    return (
        <div ref={ref} className="relative">
            <button
                id="btn-notification-bell"
                onClick={() => setOpen(o => !o)}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800/60 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all"
            >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-12 w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/60 z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <span className="font-semibold text-white text-sm">Notificaciones</span>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button onClick={handleMarkAllRead} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                                    <CheckCheck className="w-3.5 h-3.5" /> Leer todas
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="py-10 text-center text-slate-500 text-sm">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                Sin notificaciones
                            </div>
                        ) : (
                            notifications.map(n => {
                                const tc = TYPE_CONFIG[n.type];
                                return (
                                    <div
                                        key={n.id}
                                        id={`notification-${n.id}`}
                                        onClick={() => handleMarkRead(n.id)}
                                        className={`flex gap-3 px-4 py-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${!n.isRead ? 'bg-cyan-500/5' : ''}`}
                                    >
                                        <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tc.bg} ${tc.color}`}>
                                            {tc.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-sm font-medium text-white truncate">{n.title}</p>
                                                <span className="text-xs text-slate-500 flex-shrink-0">{timeAgo(n.createdAt)}</span>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                                        </div>
                                        {!n.isRead && (
                                            <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="px-4 py-2.5 border-t border-white/10 text-center">
                            <span className="text-xs text-slate-500">{notifications.length} notificación(es) totales</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
