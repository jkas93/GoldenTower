'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase/clientApp';
import { fetchApi } from '@/lib/api';
import {
    Wrench, Truck, HardHat, Gauge, Package, Plus, X,
    CheckCircle, AlertTriangle, Clock, Edit, Calendar
} from 'lucide-react';

type EquipmentStatus = 'DISPONIBLE' | 'EN_USO' | 'EN_MANTENIMIENTO' | 'FUERA_DE_SERVICIO';
type EquipmentType = 'MAQUINARIA' | 'HERRAMIENTA' | 'VEHICULO' | 'EQUIPO_MEDICION' | 'OTRO';

interface Equipment {
    id: string;
    name: string;
    type: EquipmentType;
    model?: string;
    serialNumber?: string;
    status: EquipmentStatus;
    assignedProjectId?: string;
    lastMaintenanceDate?: string;
    nextMaintenanceDate?: string;
    notes?: string;
    createdAt: string;
}

interface MaintenanceLog {
    id: string;
    equipmentId: string;
    date: string;
    type: 'PREVENTIVO' | 'CORRECTIVO' | 'REVISION';
    description: string;
    technician?: string;
    cost?: number;
    nextMaintenanceDate?: string;
    createdAt: string;
}

const TYPE_ICONS: Record<EquipmentType, React.ReactNode> = {
    MAQUINARIA: <Truck className="w-5 h-5" />,
    HERRAMIENTA: <Wrench className="w-5 h-5" />,
    VEHICULO: <Truck className="w-5 h-5" />,
    EQUIPO_MEDICION: <Gauge className="w-5 h-5" />,
    OTRO: <Package className="w-5 h-5" />,
};

const STATUS_CONFIG: Record<EquipmentStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    DISPONIBLE:         { label: 'Disponible',         color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: <CheckCircle className="w-3.5 h-3.5" /> },
    EN_USO:             { label: 'En Uso',              color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/30',    icon: <HardHat className="w-3.5 h-3.5" /> },
    EN_MANTENIMIENTO:   { label: 'En Mantenimiento',   color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30',   icon: <Wrench className="w-3.5 h-3.5" /> },
    FUERA_DE_SERVICIO:  { label: 'Fuera de Servicio',  color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30',     icon: <AlertTriangle className="w-3.5 h-3.5" /> },
};

export default function EquipmentPage() {
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');

    const [form, setForm] = useState({
        name: '', type: 'MAQUINARIA' as EquipmentType, model: '',
        serialNumber: '', status: 'DISPONIBLE' as EquipmentStatus, notes: '',
        nextMaintenanceDate: ''
    });
    const [maintenanceForm, setMaintenanceForm] = useState({
        date: new Date().toISOString().split('T')[0],
        type: 'PREVENTIVO' as 'PREVENTIVO' | 'CORRECTIVO' | 'REVISION',
        description: '', technician: '', cost: '', nextMaintenanceDate: ''
    });

    const loadEquipment = async () => {
        setLoading(true);
        try {
            const data = await fetchApi<Equipment[]>('/equipment');
            setEquipment(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadEquipment(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetchApi('/equipment', { method: 'POST', body: JSON.stringify(form) });
            setShowModal(false);
            setForm({ name: '', type: 'MAQUINARIA', model: '', serialNumber: '', status: 'DISPONIBLE', notes: '', nextMaintenanceDate: '' });
            await loadEquipment();
        } catch (err) { alert('Error al guardar el equipo'); }
    };

    const openMaintenance = async (eq: Equipment) => {
        setSelectedEquipment(eq);
        setShowMaintenanceModal(true);
        try {
            const logs = await fetchApi<MaintenanceLog[]>(`/equipment/${eq.id}/maintenance`);
            setMaintenanceLogs(logs);
        } catch (e) { setMaintenanceLogs([]); }
    };

    const handleAddMaintenance = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEquipment) return;
        try {
            await fetchApi(`/equipment/${selectedEquipment.id}/maintenance`, {
                method: 'POST',
                body: JSON.stringify({
                    ...maintenanceForm,
                    cost: maintenanceForm.cost ? Number(maintenanceForm.cost) : undefined,
                })
            });
            const logs = await fetchApi<MaintenanceLog[]>(`/equipment/${selectedEquipment.id}/maintenance`);
            setMaintenanceLogs(logs);
            setMaintenanceForm({ date: new Date().toISOString().split('T')[0], type: 'PREVENTIVO', description: '', technician: '', cost: '', nextMaintenanceDate: '' });
            await loadEquipment();
        } catch (err) { alert('Error al registrar mantenimiento'); }
    };

    const filteredEquipment = filterStatus === 'ALL' ? equipment : equipment.filter(e => e.status === filterStatus);

    const stats = {
        total: equipment.length,
        disponible: equipment.filter(e => e.status === 'DISPONIBLE').length,
        enUso: equipment.filter(e => e.status === 'EN_USO').length,
        mantenimiento: equipment.filter(e => e.status === 'EN_MANTENIMIENTO').length,
    };

    return (
        <div className="min-h-screen bg-[#0a0f1e] text-white p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                        Equipos & Maquinaria
                    </h1>
                    <p className="text-slate-400 mt-1">Control de activos, uso y mantenimiento</p>
                </div>
                <button
                    id="btn-add-equipment"
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-cyan-500/20"
                >
                    <Plus className="w-4 h-4" /> Nuevo Equipo
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Activos', value: stats.total, color: 'from-slate-700 to-slate-800', textColor: 'text-white' },
                    { label: 'Disponibles', value: stats.disponible, color: 'from-emerald-900/60 to-emerald-800/40', textColor: 'text-emerald-400' },
                    { label: 'En Uso', value: stats.enUso, color: 'from-blue-900/60 to-blue-800/40', textColor: 'text-blue-400' },
                    { label: 'En Mantenimiento', value: stats.mantenimiento, color: 'from-amber-900/60 to-amber-800/40', textColor: 'text-amber-400' },
                ].map(({ label, value, color, textColor }) => (
                    <div key={label} className={`bg-gradient-to-br ${color} border border-white/10 rounded-2xl p-5`}>
                        <p className="text-slate-400 text-sm mb-1">{label}</p>
                        <p className={`text-3xl font-bold ${textColor}`}>{value}</p>
                    </div>
                ))}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {([['ALL', 'Todos'], ['DISPONIBLE', 'Disponibles'], ['EN_USO', 'En Uso'], ['EN_MANTENIMIENTO', 'Mantenimiento'], ['FUERA_DE_SERVICIO', 'Fuera de Servicio']] as [string, string][]).map(([val, label]) => (
                    <button
                        key={val}
                        onClick={() => setFilterStatus(val)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${filterStatus === val ? 'bg-cyan-500 border-cyan-400 text-white' : 'border-white/10 text-slate-400 hover:border-white/30'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Equipment Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filteredEquipment.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                    <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-lg">No hay equipos registrados</p>
                    <p className="text-sm mt-1">Agrega el primer equipo con el botón superior</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEquipment.map(eq => {
                        const sc = STATUS_CONFIG[eq.status];
                        const isOverdueMaintenance = eq.nextMaintenanceDate && new Date(eq.nextMaintenanceDate) < new Date();
                        return (
                            <div key={eq.id} className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 hover:border-cyan-500/30 transition-all group">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                                            {TYPE_ICONS[eq.type]}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white group-hover:text-cyan-300 transition-colors">{eq.name}</h3>
                                            <p className="text-xs text-slate-500">{eq.type} {eq.model ? `· ${eq.model}` : ''}</p>
                                        </div>
                                    </div>
                                    <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${sc.bg} ${sc.color}`}>
                                        {sc.icon} {sc.label}
                                    </span>
                                </div>

                                {eq.serialNumber && (
                                    <p className="text-xs text-slate-500 mb-3">S/N: <span className="text-slate-300">{eq.serialNumber}</span></p>
                                )}

                                {eq.nextMaintenanceDate && (
                                    <div className={`flex items-center gap-1.5 text-xs mb-3 ${isOverdueMaintenance ? 'text-red-400' : 'text-slate-400'}`}>
                                        <Calendar className="w-3.5 h-3.5" />
                                        Próx. mantenimiento: {new Date(eq.nextMaintenanceDate).toLocaleDateString('es-PE')}
                                        {isOverdueMaintenance && <AlertTriangle className="w-3.5 h-3.5 ml-1" />}
                                    </div>
                                )}

                                {eq.notes && <p className="text-xs text-slate-500 mb-4 line-clamp-2">{eq.notes}</p>}

                                <button
                                    id={`btn-maintenance-${eq.id}`}
                                    onClick={() => openMaintenance(eq)}
                                    className="w-full mt-2 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium border border-white/10 text-slate-300 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-300 transition-all"
                                >
                                    <Wrench className="w-4 h-4" /> Ver / Registrar Mantenimiento
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* New Equipment Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Nuevo Equipo</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm text-slate-400 mb-1">Nombre *</label>
                                    <input id="input-equip-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500" required />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Tipo *</label>
                                    <select id="select-equip-type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as EquipmentType }))}
                                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500">
                                        {['MAQUINARIA', 'HERRAMIENTA', 'VEHICULO', 'EQUIPO_MEDICION', 'OTRO'].map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Estado</label>
                                    <select id="select-equip-status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as EquipmentStatus }))}
                                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500">
                                        {(['DISPONIBLE', 'EN_USO', 'EN_MANTENIMIENTO', 'FUERA_DE_SERVICIO'] as EquipmentStatus[]).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Modelo</label>
                                    <input id="input-equip-model" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">N° de Serie</label>
                                    <input id="input-equip-serial" value={form.serialNumber} onChange={e => setForm(f => ({ ...f, serialNumber: e.target.value }))}
                                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm text-slate-400 mb-1">Próximo Mantenimiento</label>
                                    <input id="input-equip-maintenance-date" type="date" value={form.nextMaintenanceDate} onChange={e => setForm(f => ({ ...f, nextMaintenanceDate: e.target.value }))}
                                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm text-slate-400 mb-1">Notas</label>
                                    <textarea id="input-equip-notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                        rows={2} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 resize-none" />
                                </div>
                            </div>
                            <button id="btn-submit-equipment" type="submit"
                                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-semibold hover:opacity-90 transition-all">
                                Registrar Equipo
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Maintenance Modal */}
            {showMaintenanceModal && selectedEquipment && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-white">Mantenimiento: {selectedEquipment.name}</h2>
                                <p className="text-slate-400 text-sm">{STATUS_CONFIG[selectedEquipment.status].label}</p>
                            </div>
                            <button onClick={() => setShowMaintenanceModal(false)} className="text-slate-400 hover:text-white"><X /></button>
                        </div>

                        {/* Add Maintenance Form */}
                        <form onSubmit={handleAddMaintenance} className="space-y-3 mb-6 p-4 bg-slate-800/50 rounded-xl border border-white/5">
                            <h3 className="font-semibold text-sm text-slate-300 mb-2">+ Registrar Nuevo Mantenimiento</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-slate-400">Fecha *</label>
                                    <input id="input-maint-date" type="date" value={maintenanceForm.date} onChange={e => setMaintenanceForm(f => ({ ...f, date: e.target.value }))}
                                        className="w-full mt-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" required />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400">Tipo</label>
                                    <select id="select-maint-type" value={maintenanceForm.type} onChange={e => setMaintenanceForm(f => ({ ...f, type: e.target.value as any }))}
                                        className="w-full mt-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500">
                                        {['PREVENTIVO', 'CORRECTIVO', 'REVISION'].map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs text-slate-400">Descripción *</label>
                                    <input id="input-maint-desc" value={maintenanceForm.description} onChange={e => setMaintenanceForm(f => ({ ...f, description: e.target.value }))}
                                        className="w-full mt-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" required />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400">Técnico</label>
                                    <input id="input-maint-tech" value={maintenanceForm.technician} onChange={e => setMaintenanceForm(f => ({ ...f, technician: e.target.value }))}
                                        className="w-full mt-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400">Costo (S/)</label>
                                    <input id="input-maint-cost" type="number" step="0.01" value={maintenanceForm.cost} onChange={e => setMaintenanceForm(f => ({ ...f, cost: e.target.value }))}
                                        className="w-full mt-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs text-slate-400">Próximo Mantenimiento</label>
                                    <input id="input-maint-next-date" type="date" value={maintenanceForm.nextMaintenanceDate} onChange={e => setMaintenanceForm(f => ({ ...f, nextMaintenanceDate: e.target.value }))}
                                        className="w-full mt-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
                                </div>
                            </div>
                            <button id="btn-submit-maintenance" type="submit"
                                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg text-sm font-semibold hover:opacity-90 transition-all">
                                Registrar Mantenimiento
                            </button>
                        </form>

                        {/* Maintenance Logs */}
                        <div>
                            <h3 className="font-semibold text-sm text-slate-300 mb-3">Historial de Mantenimientos</h3>
                            {maintenanceLogs.length === 0 ? (
                                <p className="text-slate-500 text-sm text-center py-6">Sin registros de mantenimiento</p>
                            ) : (
                                <div className="space-y-2">
                                    {maintenanceLogs.map(log => (
                                        <div key={log.id} className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-white">{log.description}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                    log.type === 'PREVENTIVO' ? 'bg-emerald-500/10 text-emerald-400' :
                                                    log.type === 'CORRECTIVO' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                                                }`}>{log.type}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                                <span><Calendar className="w-3 h-3 inline mr-1" />{log.date}</span>
                                                {log.technician && <span>Técnico: {log.technician}</span>}
                                                {log.cost && <span>S/ {log.cost.toLocaleString()}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
