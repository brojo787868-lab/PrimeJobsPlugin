import React, { useState } from 'react';
import { Plus, Trash2, Check, Eye } from 'lucide-react';
import {
  ActionType,
  GlassColorType,
  JobDefinition,
  JobTask,
  MinecraftIconType,
  PluginConfig,
} from '../types/plugin';
import {
  GLASS_PANE_COLORS,
  JOB_ICON_OPTIONS,
  MinecraftItemIcon,
  renderMinecraftText,
} from './MinecraftIcons';

interface JobEditorPanelProps {
  config: PluginConfig;
  selectedJobId: string;
  onSelectJobId: (id: string) => void;
  onUpdateConfig: (updated: PluginConfig) => void;
  onSwitchToSimulator: () => void;
}

export const JobEditorPanel: React.FC<JobEditorPanelProps> = ({
  config,
  selectedJobId,
  onSelectJobId,
  onUpdateConfig,
  onSwitchToSimulator,
}) => {
  const [newTaskMaterial, setNewTaskMaterial] = useState('');
  const [newTaskLabel, setNewTaskLabel] = useState('');
  const [newTaskAction, setNewTaskAction] = useState<ActionType>('BREAK');
  const [newTaskMoney, setNewTaskMoney] = useState('10.00');
  const [newTaskXp, setNewTaskXp] = useState('15.0');

  const activeJob = config.jobs.find((j) => j.id === selectedJobId) || config.jobs[0];

  const updateJob = (updatedJob: JobDefinition) => {
    onUpdateConfig({
      ...config,
      jobs: config.jobs.map((j) => (j.id === updatedJob.id ? updatedJob : j)),
    });
  };

  const handleUpdateTask = (taskId: string, patch: Partial<JobTask>) => {
    if (!activeJob) return;
    updateJob({
      ...activeJob,
      tasks: activeJob.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
    });
  };

  const handleDeleteTask = (taskId: string) => {
    if (!activeJob || activeJob.tasks.length <= 1) return;
    updateJob({
      ...activeJob,
      tasks: activeJob.tasks.filter((t) => t.id !== taskId),
    });
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJob || !newTaskMaterial.trim()) return;
    const matKey = newTaskMaterial.trim().toUpperCase().replace(/\s+/g, '_');
    const label = newTaskLabel.trim() || `Complete ${matKey}`;
    const newTask: JobTask = {
      id: `${activeJob.id}-${Date.now()}`,
      material: matKey,
      label,
      actionType: newTaskAction,
      baseMoney: Math.max(0.01, parseFloat(newTaskMoney) || 5.0),
      baseXp: Math.max(0.1, parseFloat(newTaskXp) || 5.0),
      iconType: activeJob.icon,
    };
    updateJob({
      ...activeJob,
      tasks: [...activeJob.tasks, newTask],
    });
    setNewTaskMaterial('');
    setNewTaskLabel('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Sidebar (4 cols): 5 Jobs Selector + Global Plugin Settings */}
      <div className="lg:col-span-4 flex flex-col gap-5">
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white">
              Select Profession to Configure
            </h2>
            <button
              onClick={onSwitchToSimulator}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview in GUI
            </button>
          </div>

          <div className="space-y-2">
            {config.jobs.map((job, index) => {
              const isSelected = job.id === activeJob?.id;
              return (
                <button
                  key={job.id}
                  onClick={() => onSelectJobId(job.id)}
                  className={`w-full flex items-center justify-between gap-3 p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 border-emerald-500/60'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-md bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                      <MinecraftItemIcon icon={job.icon} size={24} enchanted={isSelected} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-semibold truncate">
                        0{index + 1}. {renderMinecraftText(job.displayName)}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5">
                        Slot #{job.slot} · {job.tasks.length} Tasks · Max Lv.{job.maxLevel}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Chest GUI & Economy Settings */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white pb-3 mb-4 border-b border-slate-800">
            Global Plugin & GUI Settings
          </h3>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Chest Inventory Title (Supports &amp; Color Codes)
              </label>
              <input
                type="text"
                value={config.guiTitle}
                onChange={(e) => onUpdateConfig({ ...config, guiTitle: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
              <div className="mt-1.5 px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800/80 text-xs font-mono">
                {renderMinecraftText(config.guiTitle)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Chest Rows (3–6)
                </label>
                <select
                  value={config.guiRows}
                  onChange={(e) => onUpdateConfig({ ...config, guiRows: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value={3}>3 Rows (27 Slots)</option>
                  <option value={4}>4 Rows (36 Slots)</option>
                  <option value={5}>5 Rows (45 Slots)</option>
                  <option value={6}>6 Rows (54 Slots)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Max Jobs / Player
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={config.maxJobsPerPlayer}
                  onChange={(e) =>
                    onUpdateConfig({
                      ...config,
                      maxJobsPerPlayer: Math.min(5, Math.max(1, Number(e.target.value) || 1)),
                    })
                  }
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg text-white tabular-nums focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Java Package
                </label>
                <input
                  type="text"
                  value={config.packageName}
                  onChange={(e) => onUpdateConfig({ ...config, packageName: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Server API Version
                </label>
                <select
                  value={config.apiVersion}
                  onChange={(e) => onUpdateConfig({ ...config, apiVersion: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="1.21">Paper / Spigot 1.21</option>
                  <option value="1.20">Paper / Spigot 1.20</option>
                  <option value="1.19">Paper / Spigot 1.19</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Border Stained Glass Pane Color
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(GLASS_PANE_COLORS) as GlassColorType[]).map((colorKey) => {
                  const active = config.borderGlassColor === colorKey;
                  const pane = GLASS_PANE_COLORS[colorKey];
                  return (
                    <button
                      key={colorKey}
                      onClick={() => onUpdateConfig({ ...config, borderGlassColor: colorKey })}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-slate-800 border-emerald-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-xs shrink-0"
                        style={{ backgroundColor: pane.border }}
                      />
                      {colorKey}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column (8 cols): Active Job Detailed Configurator & Task Payout Table */}
      {activeJob && (
        <div className="lg:col-span-8 flex flex-col gap-5">
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center">
                  <MinecraftItemIcon icon={activeJob.icon} size={28} enchanted />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <span>Configure Profession:</span>
                    <span className="font-mono">{renderMinecraftText(activeJob.displayName)}</span>
                  </h2>
                  <p className="text-xs text-slate-400">{activeJob.tagline}</p>
                </div>
              </div>

              <span className="text-xs font-mono text-slate-400 tabular-nums">
                ID: {activeJob.id} · Chest Slot #{activeJob.slot}
              </span>
            </div>

            {/* Core Job Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Display Name (&amp; Codes)
                </label>
                <input
                  type="text"
                  value={activeJob.displayName}
                  onChange={(e) => updateJob({ ...activeJob, displayName: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Bukkit Item Icon
                </label>
                <select
                  value={activeJob.icon}
                  onChange={(e) => {
                    const icon = e.target.value as MinecraftIconType;
                    updateJob({ ...activeJob, icon, materialName: icon });
                  }}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                >
                  {JOB_ICON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  GUI Slot Index (0–53)
                </label>
                <input
                  type="number"
                  min={0}
                  max={53}
                  value={activeJob.slot}
                  onChange={(e) =>
                    updateJob({
                      ...activeJob,
                      slot: Math.min(53, Math.max(0, Number(e.target.value) || 0)),
                    })
                  }
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg text-white tabular-nums focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Max Level Cap
                </label>
                <input
                  type="number"
                  min={10}
                  max={500}
                  value={activeJob.maxLevel}
                  onChange={(e) =>
                    updateJob({
                      ...activeJob,
                      maxLevel: Math.min(500, Math.max(10, Number(e.target.value) || 100)),
                    })
                  }
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg text-white tabular-nums focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Income Bonus / Level (%)
                </label>
                <input
                  type="number"
                  step={1}
                  min={1}
                  max={50}
                  value={Math.round(activeJob.incomeMultiplierPerLevel * 100)}
                  onChange={(e) =>
                    updateJob({
                      ...activeJob,
                      incomeMultiplierPerLevel: Math.max(0.01, (Number(e.target.value) || 5) / 100),
                    })
                  }
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg text-white tabular-nums focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Base XP for Level 1
                </label>
                <input
                  type="number"
                  min={20}
                  max={5000}
                  value={activeJob.baseXpRequirement}
                  onChange={(e) =>
                    updateJob({
                      ...activeJob,
                      baseXpRequirement: Math.max(20, Number(e.target.value) || 100),
                    })
                  }
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg text-white tabular-nums focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  XP Growth Curve / Level (%)
                </label>
                <input
                  type="number"
                  step={1}
                  min={5}
                  max={50}
                  value={Math.round(activeJob.xpMultiplierPerLevel * 100)}
                  onChange={(e) =>
                    updateJob({
                      ...activeJob,
                      xpMultiplierPerLevel: Math.max(0.05, (Number(e.target.value) || 15) / 100),
                    })
                  }
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg text-white tabular-nums focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Task & Money Payout Table */}
            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Earnable Tasks &amp; Money Payouts ({activeJob.tasks.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Every change updates both the interactive Chest GUI and the generated config.yml
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-lg mb-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/90 border-b border-slate-800 text-[11px] font-medium text-slate-400">
                      <th className="py-2.5 px-3">Task Label</th>
                      <th className="py-2.5 px-3">Bukkit Material / Entity</th>
                      <th className="py-2.5 px-3">Trigger Event</th>
                      <th className="py-2.5 px-3 text-right">Base Money ({config.economySymbol})</th>
                      <th className="py-2.5 px-3 text-right">Base XP</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-xs">
                    {activeJob.tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={task.label}
                            onChange={(e) => handleUpdateTask(task.id, { label: e.target.value })}
                            className="w-full bg-transparent text-slate-200 focus:outline-none focus:text-white"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={task.material}
                            onChange={(e) =>
                              handleUpdateTask(task.id, {
                                material: e.target.value.toUpperCase().replace(/\s+/g, '_'),
                              })
                            }
                            className="w-full font-mono text-amber-300 bg-transparent focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-300">
                          <select
                            value={task.actionType}
                            onChange={(e) =>
                              handleUpdateTask(task.id, { actionType: e.target.value as ActionType })
                            }
                            className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                          >
                            <option value="BREAK">BREAK</option>
                            <option value="HARVEST">HARVEST</option>
                            <option value="KILL">KILL</option>
                            <option value="FISH">FISH</option>
                          </select>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            step="0.25"
                            min="0.01"
                            value={task.baseMoney}
                            onChange={(e) =>
                              handleUpdateTask(task.id, {
                                baseMoney: Math.max(0.01, parseFloat(e.target.value) || 0),
                              })
                            }
                            className="w-20 text-right font-mono text-emerald-400 bg-slate-900 border border-slate-800 rounded px-2 py-1 tabular-nums focus:outline-none focus:border-emerald-500"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            step="0.5"
                            min="0.1"
                            value={task.baseXp}
                            onChange={(e) =>
                              handleUpdateTask(task.id, {
                                baseXp: Math.max(0.1, parseFloat(e.target.value) || 0),
                              })
                            }
                            className="w-20 text-right font-mono text-sky-400 bg-slate-900 border border-slate-800 rounded px-2 py-1 tabular-nums focus:outline-none focus:border-emerald-500"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            disabled={activeJob.tasks.length <= 1}
                            title="Remove Task"
                            className="p-1 text-slate-500 hover:text-rose-400 disabled:opacity-30 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add New Task Form */}
              <form
                onSubmit={handleAddTask}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 bg-slate-900/70 p-3 rounded-lg border border-slate-800"
              >
                <input
                  type="text"
                  placeholder="Material/Entity (e.g. EMERALD_ORE)"
                  value={newTaskMaterial}
                  onChange={(e) => setNewTaskMaterial(e.target.value)}
                  className="sm:col-span-3 px-2.5 py-1.5 text-xs font-mono bg-slate-950 border border-slate-800 rounded text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Display Label (e.g. Mine Emerald Ore)"
                  value={newTaskLabel}
                  onChange={(e) => setNewTaskLabel(e.target.value)}
                  className="sm:col-span-3 px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <select
                  value={newTaskAction}
                  onChange={(e) => setNewTaskAction(e.target.value as ActionType)}
                  className="sm:col-span-2 px-2 py-1.5 text-xs font-mono bg-slate-950 border border-slate-800 rounded text-white"
                >
                  <option value="BREAK">BREAK</option>
                  <option value="HARVEST">HARVEST</option>
                  <option value="KILL">KILL</option>
                  <option value="FISH">FISH</option>
                </select>
                <input
                  type="number"
                  step="0.5"
                  placeholder="Money"
                  value={newTaskMoney}
                  onChange={(e) => setNewTaskMoney(e.target.value)}
                  className="sm:col-span-1 px-2 py-1.5 text-xs font-mono bg-slate-950 border border-slate-800 rounded text-emerald-400 tabular-nums"
                />
                <input
                  type="number"
                  step="0.5"
                  placeholder="XP"
                  value={newTaskXp}
                  onChange={(e) => setNewTaskXp(e.target.value)}
                  className="sm:col-span-1 px-2 py-1.5 text-xs font-mono bg-slate-950 border border-slate-800 rounded text-sky-400 tabular-nums"
                />
                <button
                  type="submit"
                  className="sm:col-span-2 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Task
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
