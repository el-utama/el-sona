import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Calendar,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { CuratorTask } from '../types/curator';
import { createGoogleTask } from '../services/googleWorkspace';
import { ConfirmationDialog } from './ConfirmationDialog';

interface TasksTabProps {
  tasks: CuratorTask[];
  onAddTask: (task: CuratorTask) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  isGoogleConnected: boolean;
  onRequireAuth: () => void;
}

export const TasksTab: React.FC<TasksTabProps> = ({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  isGoogleConnected,
  onRequireAuth,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newDue, setNewDue] = useState('');
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [newCategory, setNewCategory] = useState<
    'Review Lagu' | 'Update Stream' | 'Playlist Pitch' | 'Riset Artis'
  >('Update Stream');

  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // User Confirmation state for mutating Google Tasks
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmTask, setConfirmTask] = useState<CuratorTask | null>(null);

  const handleCreateLocalTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const task: CuratorTask = {
      id: `TSK-${Date.now().toString().slice(-4)}`,
      title: newTitle.trim(),
      notes: newNotes.trim(),
      due: newDue || undefined,
      completed: false,
      priority: newPriority,
      category: newCategory,
    };

    onAddTask(task);
    setNewTitle('');
    setNewNotes('');
    setNewDue('');
    setIsAdding(false);
  };

  const handleRequestPushToGoogleTasks = (task: CuratorTask) => {
    if (!isGoogleConnected) {
      onRequireAuth();
      return;
    }

    setConfirmTask(task);
    setShowConfirm(true);
  };

  const handleConfirmPush = async () => {
    if (!confirmTask) return;
    setIsSyncing(true);
    setSyncNotice(null);
    try {
      await createGoogleTask('@default', {
        title: confirmTask.title,
        notes: `${confirmTask.notes || ''}\nKategori: ${confirmTask.category} (Prioritas: ${confirmTask.priority})`,
        due: confirmTask.due,
      });
      setSyncNotice(`✅ Tugas "${confirmTask.title}" berhasil ditambahkan ke Google Tasks Anda!`);
      setShowConfirm(false);
    } catch (err: any) {
      setSyncNotice(`❌ Gagal menambahkan ke Google Tasks: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const priorityColors = {
    High: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Low: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  return (
    <div className="space-y-5">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-400" />
            Jadwal & Tugas Rutin Kurator (Integrasi Google Tasks)
          </h2>
          <p className="text-xs text-slate-400">
            Kelola agenda evaluasi mingguan, review audio, dan sinkronkan langsung ke akun Google Tasks Anda.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          {isAdding ? 'Tutup Form' : 'Tambah Agenda Kurasi'}
        </button>
      </div>

      {syncNotice && (
        <div className="p-3.5 bg-slate-950/80 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* Add Task Form */}
      {isAdding && (
        <form
          onSubmit={handleCreateLocalTask}
          className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl animate-in fade-in"
        >
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Buat Agenda / Tugas Kurasi Baru
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Judul Tugas *
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="misal: Cek lonjakan stream Bernadya tiap Senin"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Kategori Kurasi
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-hidden focus:border-emerald-500"
              >
                <option value="Update Stream">Update Stream & Metrik</option>
                <option value="Review Lagu">Review & Analisis Lagu</option>
                <option value="Playlist Pitch">Pitching ke Playlist</option>
                <option value="Riset Artis">Riset Artis Baru</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Tenggat Waktu (Due Date)
              </label>
              <input
                type="date"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Prioritas</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-hidden focus:border-emerald-500"
              >
                <option value="High">Tinggi (High Priority)</option>
                <option value="Medium">Sedang (Medium)</option>
                <option value="Low">Rendah (Low)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Catatan</label>
            <textarea
              rows={2}
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Instruksi spesifik atau link referensi..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md"
            >
              Simpan Tugas
            </button>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`p-4 bg-slate-900 border rounded-2xl transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              task.completed
                ? 'border-slate-850 opacity-60 bg-slate-950/40'
                : 'border-slate-800 shadow-md'
            }`}
          >
            <div className="flex items-start gap-3 flex-1">
              <button
                type="button"
                onClick={() => onToggleTask(task.id)}
                className="text-slate-400 hover:text-emerald-400 mt-0.5 shrink-0 transition-colors"
              >
                {task.completed ? (
                  <CheckSquare className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Square className="w-5 h-5 text-slate-500" />
                )}
              </button>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4
                    className={`text-sm font-semibold ${
                      task.completed ? 'line-through text-slate-400' : 'text-slate-100'
                    }`}
                  >
                    {task.title}
                  </h4>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${priorityColors[task.priority]}`}
                  >
                    {task.priority}
                  </span>
                  <span className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-md border border-slate-700">
                    {task.category}
                  </span>
                </div>

                {task.notes && <p className="text-xs text-slate-400">{task.notes}</p>}

                {task.due && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                    <Calendar className="w-3 h-3" />
                    Tenggat: {task.due}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => handleRequestPushToGoogleTasks(task)}
                title="Kirim ke aplikasi Google Tasks saya"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Kirim ke</span> Google Tasks
              </button>
              <button
                type="button"
                onClick={() => onDeleteTask(task.id)}
                className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                title="Hapus tugas"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Mandatory User Confirmation Dialog before sending to Google Tasks */}
      {confirmTask && (
        <ConfirmationDialog
          isOpen={showConfirm}
          title="Kirim Tugas ke Akun Google Tasks Anda?"
          message={`Aplikasi akan menambahkan tugas ini secara langsung ke daftar Google Tasks akun Anda:`}
          detail={`Judul: "${confirmTask.title}" (${confirmTask.category})`}
          confirmLabel="Ya, Kirim ke Google Tasks"
          isLoading={isSyncing}
          onConfirm={handleConfirmPush}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
};
