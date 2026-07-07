'use client';

import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@erp/shared";
import { useRouter } from "next/navigation";
import {
    Users,
    Briefcase,
    Clock,
    DollarSign,
    Wrench,
    TrendingUp,
} from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import SupervisorDashboard from "@/components/dashboard/SupervisorDashboard";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export default function DashboardPage() {
    const { user, role, loading: authLoading } = useAuth();
    const router = useRouter();
    const { stats, loading: statsLoading } = useDashboardStats();

    if (authLoading || !user) return null;

    if (role === UserRole.SUPERVISOR) {
        return <SupervisorDashboard />;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const MetricCard = ({ value, label, icon: Icon, color, percent }: any) => (
        <div className={`p-6 rounded-[2rem] border border-border/50 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] group hover:shadow-[0_8px_30px_rgb(212,175,55,0.15)] hover:border-primary/30 transition-all duration-300 relative overflow-hidden`}>
            {/* Background Gradient Decorative */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:opacity-20 transition-opacity`}></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-3 bg-secondary rounded-2xl text-primary group-hover:scale-110 transition-transform shadow-sm`}>
                    <Icon className="w-6 h-6" />
                </div>
                {percent && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${percent.includes('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {percent}
                    </span>
                )}
            </div>
            {statsLoading ? (
                <div className="space-y-2 animate-pulse">
                    <div className="h-8 bg-gray-200 rounded-lg w-16"></div>
                    <div className="h-4 bg-gray-100 rounded-md w-24"></div>
                </div>
            ) : (
                <div className="relative z-10">
                    <h3 className="text-3xl font-extrabold mb-1 text-gray-900 tracking-tight">{value}</h3>
                    <p className="text-sm text-gray-500 font-medium">{label}</p>
                </div>
            )}
        </div>
    );

    // Mock data for charts
    const monthlyData = [
        { name: 'Ene', costo: 4000, presupuesto: 5000, avance: 12 },
        { name: 'Feb', costo: 3000, presupuesto: 4000, avance: 25 },
        { name: 'Mar', costo: 2000, presupuesto: 3500, avance: 45 },
        { name: 'Abr', costo: 2780, presupuesto: 3908, avance: 60 },
        { name: 'May', costo: 1890, presupuesto: 4800, avance: 72 },
        { name: 'Jun', costo: 2390, presupuesto: 3800, avance: 85 },
        { name: 'Jul', costo: 3490, presupuesto: 4300, avance: 100 },
    ];

    const projectData = [
        { name: 'Edificio A', manoObra: 4000, materiales: 2400 },
        { name: 'Puente B', manoObra: 3000, materiales: 1398 },
        { name: 'Condominio C', manoObra: 2000, materiales: 9800 },
    ];

    return (
        <div className="space-y-12">
            <header className="flex justify-between items-end border-b border-border/60 pb-8">
                <div>
                    <h1 className="text-5xl font-extrabold tracking-tight mb-2 text-gray-900">
                        Bienvenido, <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-yellow-800">{user?.email?.split('@')[0]}</span>
                    </h1>
                    <p className="text-gray-500 font-medium italic">
                        Sistema de Gestión Integral • <span className="text-primary font-bold uppercase tracking-tighter">{role || 'Sin Rol'}</span>
                    </p>
                </div>
                <div className="flex items-center gap-4 text-right">
                    <div className="bg-white border border-border shadow-sm px-4 py-2 rounded-xl text-xs font-bold text-gray-500 uppercase tracking-widest">
                        {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Proyectos"
                    value={stats?.activeProjects || 0}
                    label="Proyectos Activos"
                    icon={Briefcase}
                    color="from-primary/20 to-transparent hover:text-primary"
                    percent="+12%"
                />
                <MetricCard
                    title="Equipo"
                    value={stats?.collaborators || 0}
                    label="Colaboradores"
                    icon={Users}
                    color="from-white/10 to-transparent hover:text-white"
                    percent="+4%"
                />
                <MetricCard
                    title="Finanzas"
                    value={`S/ ${((stats?.actualCost || 0) / 1000).toFixed(1)}k`}
                    label={`Ejecutado de S/ ${((stats?.totalBudget || 0) / 1000).toFixed(1)}k`}
                    icon={DollarSign}
                    color="from-primary/30 to-transparent hover:text-primary"
                    percent={`${Math.round(((stats?.actualCost || 0) / (stats?.totalBudget || 1)) * 100)}%`}
                />
                <MetricCard
                    title="Eficiencia"
                    value={`${stats?.efficiency || 0}%`}
                    label="Eficiencia Operativa"
                    icon={Clock}
                    color="from-amber-900/40 to-transparent hover:text-amber-500"
                    percent="-5%"
                />
            </div>

            {/* Business Intelligence Charts */}
            {(role === UserRole.GERENTE || role === UserRole.PMO) && (
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-border/50 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary" />
                                Ejecución Financiera Mensual
                            </h3>
                        </div>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorCosto" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorPresupuesto" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1e293b" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#1e293b" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                                    <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: '10px' }} />
                                    <Area type="monotone" name="Ejecutado" dataKey="costo" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorCosto)" />
                                    <Area type="monotone" name="Presupuesto" dataKey="presupuesto" stroke="#1e293b" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorPresupuesto)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-border/50 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-primary" />
                                Desglose de Costos por Proyecto
                            </h3>
                        </div>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={projectData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: '10px' }} />
                                    <Bar name="Mano de Obra" dataKey="manoObra" stackId="a" fill="#D4AF37" radius={[0, 0, 4, 4]} />
                                    <Bar name="Materiales" dataKey="materiales" stackId="a" fill="#1e293b" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </section>
            )}

            <section>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                        Accesos Rápidos
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {(role === UserRole.GERENTE || role === UserRole.PMO || role === UserRole.COORDINADOR || role === UserRole.SUPERVISOR) && (
                        <button
                            onClick={() => router.push("/dashboard/projects")}
                            className="p-6 rounded-3xl text-left bg-white border border-border/60 hover:border-primary/50 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-all"></div>
                            <h4 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-primary transition-colors">Gestión de Proyectos</h4>
                            <p className="text-sm text-gray-500 font-medium leading-relaxed">Accede al listado maestro de obras y asignaciones.</p>
                        </button>
                    )}

                    {(role === UserRole.GERENTE || role === UserRole.RRHH) && (
                        <button
                            onClick={() => router.push("/dashboard/rrhh")}
                            className="p-6 rounded-3xl text-left bg-white border border-border/60 hover:border-primary/50 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/15 transition-all"></div>
                            <h4 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-primary transition-colors">Recursos Humanos</h4>
                            <p className="text-sm text-gray-500 font-medium leading-relaxed">Control de asistencia, incidencias y talento humano.</p>
                        </button>
                    )}

                    {(role === UserRole.GERENTE || role === UserRole.PMO || role === UserRole.LOGISTICO || role === UserRole.SIG) && (
                        <button
                            onClick={() => router.push("/dashboard/equipment")}
                            className="p-6 rounded-3xl text-left bg-slate-900 border border-border/60 hover:border-cyan-500/50 shadow-sm hover:shadow-cyan-500/20 transition-all group relative overflow-hidden text-white"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl -mr-16 -mt-16 group-hover:bg-cyan-500/20 transition-all"></div>
                            <h4 className="font-bold text-lg mb-2 text-white group-hover:text-cyan-400 transition-colors flex items-center gap-2">
                                <Wrench className="w-5 h-5 text-cyan-500" /> Equipos y Maquinaria
                            </h4>
                            <p className="text-sm text-slate-400 font-medium leading-relaxed">Control de inventario de activos, estado y mantenimientos preventivos.</p>
                        </button>
                    )}

                    {role === UserRole.GERENTE && (
                        <button
                            onClick={() => router.push("/dashboard/users")}
                            className="p-6 rounded-3xl text-left bg-white border border-border/60 hover:border-red-500/30 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 blur-3xl -mr-16 -mt-16 group-hover:bg-red-100 transition-all"></div>
                            <h4 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-red-600 transition-colors">Control de Accesos</h4>
                            <p className="text-sm text-gray-500 font-medium leading-relaxed">Administración crítica de roles y permisos del sistema.</p>
                        </button>
                    )}
                </div>
            </section>
        </div>
    );
}
