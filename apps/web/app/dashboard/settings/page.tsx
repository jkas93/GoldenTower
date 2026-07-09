'use client';

import { Settings, Wrench, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
    const router = useRouter();

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-end border-b border-border/60 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Settings className="w-6 h-6 text-primary" />
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
                            Configuración
                        </h1>
                    </div>
                    <p className="text-gray-500 font-medium italic">
                        Sistema de Gestión Integral • Módulo de Preferencias
                    </p>
                </div>
            </header>

            <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-gray-300 rounded-[2rem] bg-gray-50/50">
                <div className="w-24 h-24 mb-6 rounded-full bg-primary/10 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/20 animate-pulse rounded-full" />
                    <Wrench className="w-10 h-10 text-primary relative z-10" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Próximamente a implementar
                </h2>
                
                <p className="text-gray-500 max-w-md mb-8">
                    Estamos construyendo este módulo para que puedas personalizar tu experiencia, gestionar notificaciones y configurar preferencias del sistema.
                </p>

                <button 
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-medium shadow-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver al Panel de Control
                </button>
            </div>
        </div>
    );
}
