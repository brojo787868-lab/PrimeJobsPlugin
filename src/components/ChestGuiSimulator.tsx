import React, { useState } from 'react';
import {
  Play,
  Square,
  Volume2,
  VolumeX,
  RotateCcw,
  Terminal,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  Sliders,
} from 'lucide-react';
import {
  ChatLogEntry,
  JobDefinition,
  JobTask,
  PlayerJobProgress,
  PluginConfig,
} from '../types/plugin';
import {
  buildProgressBar,
  GLASS_PANE_COLORS,
  MinecraftItemIcon,
  renderMinecraftText,
} from './MinecraftIcons';
import { playGuiClick, playLevelUpFanfare } from '../utils/soundEffects';

interface ChestGuiSimulatorProps {
  config: PluginConfig;
  playerBalance: number;
  playerProgress: Record<string, PlayerJobProgress>;
  actionBarText: string | null;
  chatLogs: ChatLogEntry[];
  autoGrindActive: boolean;
  onToggleAutoGrind: () => void;
  onToggleJobJoin: (jobId: string) => void;
  onExecuteTask: (job: JobDefinition, task: JobTask) => void;
  onRunCommand: (cmd: string) => void;
  onResetSimulation: () => void;
  onToggleSound: () => void;
  onSetBooster: (mult: number) => void;
  onSelectJobToEdit: (jobId: string) => void;
}

interface HoveredSlotTooltip {
  title: string;
  lore: string[];
  slotIndex: number;
}

export const ChestGuiSimulator: React.FC<ChestGuiSimulatorProps> = ({
  config,
  playerBalance,
  playerProgress,
  actionBarText,
  chatLogs,
  autoGrindActive,
  onToggleAutoGrind,
  onToggleJobJoin,
  onExecuteTask,
  onRunCommand,
  onResetSimulation,
  onToggleSound,
  onSetBooster,
  onSelectJobToEdit,
}) => {
  const [subGuiJobId, setSubGuiJobId] = useState<string | null>(null);
  const [hoveredTooltip, setHoveredTooltip] = useState<HoveredSlotTooltip | null>(null);
  const [selectedSandboxJobId, setSelectedSandboxJobId] = useState<string>(config.jobs[0]?.id || 'miner');
  const [commandInput, setCommandInput] = useState<string>('/jobs stats');
  const [guiTheme, setGuiTheme] = useState<'CLASSIC' | 'DARK'>('CLASSIC');

  const rows = Math.min(6, Math.max(3, config.guiRows));
  const totalSlots = rows * 9;
  const closeSlot = (rows - 1) * 9 + 4;
  const boosterSlot = rows >= 5 ? (rows - 2) * 9 + 4 : -1;

  const activeJobsCount = Object.values(playerProgress).filter((p) => p?.joined).length;
  const activeSubGuiJob = subGuiJobId ? config.jobs.find((j) => j.id === subGuiJobId) || null : null;
  const sandboxJob = config.jobs.find((j) => j.id === selectedSandboxJobId) || config.jobs[0];

  const getRequiredXp = (job: JobDefinition, level: number) => {
    return Math.round(job.baseXpRequirement * Math.pow(1 + job.xpMultiplierPerLevel, Math.max(0, level - 1)));
  };

  const getScaledPayout = (job: JobDefinition, baseMoney: number, level: number) => {
    const levelMult = 1 + (level - 1) * job.incomeMultiplierPerLevel;
    return baseMoney * levelMult * config.boosterMultiplier;
  };

  const formatJobLore = (job: JobDefinition): string[] => {
    const prog = playerProgress[job.id] || { joined: false, level: 1, xp: 0, totalEarned: 0, actionsCompleted: 0 };
    const maxXp = getRequiredXp(job, prog.level);
    const incomeBonus = Math.round((prog.level - 1) * job.incomeMultiplierPerLevel * 100);
    const bar = buildProgressBar(prog.xp, maxXp, 10);

    return job.lore.map((line) =>
      line
        .replace('%status%', prog.joined ? '&a&lEMPLOYED' : '&7Not Joined')
        .replace('%level%', String(prog.level))
        .replace('%max_level%', String(job.maxLevel))
        .replace('%xp%', Math.floor(prog.xp).toString())
        .replace('%max_xp%', maxXp.toString())
        .replace('%progress_bar%', bar)
        .replace('%income_bonus%', incomeBonus.toString())
    );
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    onRunCommand(commandInput.trim());
    setCommandInput('');
  };

  const glassStyle = GLASS_PANE_COLORS[config.borderGlassColor] || GLASS_PANE_COLORS.BLACK;

  // Render a single slot in the main 54-slot /jobs GUI
  const renderMainGuiSlot = (slotIndex: number) => {
    const isBorder =
      slotIndex < 9 ||
      slotIndex >= totalSlots - 9 ||
      slotIndex % 9 === 0 ||
      slotIndex % 9 === 8;

    const jobAtSlot = config.jobs.find((j) => j.slot === slotIndex);

    // Slot 4: Player Economy Profile
    if (slotIndex === 4) {
      const title = '&a&lPlayer Economy Profile';
      const lore = [
        '&7Player: &fSteve_Prime',
        `&7Vault Balance: &a${config.economySymbol}${playerBalance.toFixed(2)}`,
        `&7Active Professions: &e${activeJobsCount}&7/&e${config.maxJobsPerPlayer}`,
        `&7Global Multiplier: &b${config.boosterMultiplier.toFixed(2)}x`,
        '',
        '&7All job earnings are deposited',
        '&7instantly via Vault Economy.',
      ];
      return {
        content: <MinecraftItemIcon icon="EMERALD" size={30} enchanted />,
        badge: null,
        isInteractive: true,
        onClick: () => {
          playGuiClick(config.soundOnEarn);
          onRunCommand('/jobs stats');
        },
        onRightClick: undefined,
        tooltip: { title, lore, slotIndex },
      };
    }

    // Close Slot
    if (slotIndex === closeSlot) {
      const title = '&c&lClose Menu';
      const lore = ['&7Click to reset view or close', '&7the PrimeJobs inventory.'];
      return {
        content: <MinecraftItemIcon icon="BARRIER" size={28} />,
        badge: null,
        isInteractive: true,
        onClick: () => {
          playGuiClick(config.soundOnEarn);
          setHoveredTooltip(null);
        },
        onRightClick: undefined,
        tooltip: { title, lore, slotIndex },
      };
    }

    // Booster Slot
    if (slotIndex === boosterSlot && !jobAtSlot) {
      const title = '&d&lPrime Economy Booster';
      const lore = [
        `&7Active Multiplier: &b&l${config.boosterMultiplier.toFixed(2)}x`,
        '&7Applies to all 5 jobs on the server.',
        '',
        '&e▸ Click &7to cycle Server Booster (1.0x / 1.5x / 2.0x)',
      ];
      return {
        content: <MinecraftItemIcon icon="EXPERIENCE_BOTTLE" size={28} enchanted={config.boosterMultiplier > 1} />,
        badge: config.boosterMultiplier > 1 ? `${config.boosterMultiplier}x` : null,
        isInteractive: true,
        onClick: () => {
          playGuiClick(config.soundOnEarn);
          const next = config.boosterMultiplier === 1.0 ? 1.5 : config.boosterMultiplier === 1.5 ? 2.0 : 1.0;
          onSetBooster(next);
        },
        onRightClick: undefined,
        tooltip: { title, lore, slotIndex },
      };
    }

    // One of the 5 Jobs!
    if (jobAtSlot) {
      const prog = playerProgress[jobAtSlot.id] || {
        joined: false,
        level: 1,
        xp: 0,
        totalEarned: 0,
        actionsCompleted: 0,
      };
      const lore = formatJobLore(jobAtSlot);

      return {
        content: (
          <MinecraftItemIcon
            icon={jobAtSlot.icon}
            size={32}
            enchanted={prog.joined}
          />
        ),
        badge: prog.level > 1 ? String(prog.level) : prog.joined ? 'ON' : null,
        badgeColor: prog.joined ? 'text-emerald-300' : 'text-slate-200',
        isJoinedJob: prog.joined,
        isInteractive: true,
        onClick: () => {
          onToggleJobJoin(jobAtSlot.id);
          setSelectedSandboxJobId(jobAtSlot.id);
        },
        onRightClick: (e: React.MouseEvent) => {
          e.preventDefault();
          playGuiClick(config.soundOnEarn);
          setSubGuiJobId(jobAtSlot.id);
          setSelectedSandboxJobId(jobAtSlot.id);
          setHoveredTooltip(null);
        },
        tooltip: {
          title: jobAtSlot.displayName,
          lore,
          slotIndex,
        },
      };
    }

    // Decorative Stained Glass Pane Border
    if (isBorder) {
      return {
        content: (
          <div
            className="w-6 h-6 rounded-[2px] opacity-80"
            style={{
              backgroundColor: glassStyle.fill,
              border: `1.5px solid ${glassStyle.border}`,
              boxShadow: `inset 2px 2px 0px ${glassStyle.highlight}`,
            }}
          />
        ),
        badge: null,
        isInteractive: false,
        onClick: undefined,
        onRightClick: undefined,
        tooltip: {
          title: `&8${glassStyle.name}`,
          lore: [`&8Slot #${slotIndex} (${glassStyle.material})`],
          slotIndex,
        },
      };
    }

    // Empty interior slot
    return {
      content: null,
      badge: null,
      isInteractive: false,
      onClick: undefined,
      onRightClick: undefined,
      tooltip: null,
    };
  };

  // Render a single slot in the 36-slot Job Tasks Sub-GUI
  const renderSubGuiSlot = (slotIndex: number, job: JobDefinition) => {
    const isBorder =
      slotIndex < 9 ||
      slotIndex >= 27 ||
      slotIndex % 9 === 0 ||
      slotIndex % 9 === 8;

    const prog = playerProgress[job.id] || {
      joined: false,
      level: 1,
      xp: 0,
      totalEarned: 0,
      actionsCompleted: 0,
    };

    // Slot 4: Job Header Icon
    if (slotIndex === 4) {
      return {
        content: <MinecraftItemIcon icon={job.icon} size={30} enchanted={prog.joined} />,
        badge: `Lv.${prog.level}`,
        isInteractive: true,
        onClick: () => onToggleJobJoin(job.id),
        tooltip: {
          title: job.displayName,
          lore: [
            `&7${job.tagline}`,
            '',
            `&fStatus: ${prog.joined ? '&a&lEMPLOYED' : '&7Not Joined'}`,
            `&fTotal Earned in Job: &a${config.economySymbol}${prog.totalEarned.toFixed(2)}`,
            '',
            '&e▸ Click &7to Join or Leave this Profession',
          ],
          slotIndex,
        },
      };
    }

    // Slot 31: Back Button
    if (slotIndex === 31) {
      return {
        content: <MinecraftItemIcon icon="ARROW_BACK" size={28} />,
        badge: null,
        isInteractive: true,
        onClick: () => {
          playGuiClick(config.soundOnEarn);
          setSubGuiJobId(null);
          setHoveredTooltip(null);
        },
        tooltip: {
          title: '&e&lBack to All Professions',
          lore: ['&7Return to the main 5-Job GUI menu.'],
          slotIndex,
        },
      };
    }

    // Map interior slots (10..16, 19..25) to tasks & perks
    const taskSlots = [10, 11, 12, 13, 14, 15, 16];
    const perkSlots = [20, 22, 24];

    const taskIdx = taskSlots.indexOf(slotIndex);
    if (taskIdx !== -1 && job.tasks[taskIdx]) {
      const task = job.tasks[taskIdx];
      const scaledMoney = getScaledPayout(job, task.baseMoney, prog.level);
      const scaledXp = task.baseXp * config.boosterMultiplier;
      return {
        content: <MinecraftItemIcon icon={task.iconType} size={30} />,
        badge: `${config.economySymbol}${scaledMoney.toFixed(0)}`,
        badgeColor: 'text-emerald-300',
        isInteractive: true,
        onClick: () => {
          onExecuteTask(job, task);
        },
        tooltip: {
          title: `&e&l${task.label}`,
          lore: [
            `&7Bukkit Material/Entity: &f${task.material}`,
            `&7Event Trigger: &b${task.actionType}`,
            '',
            `&7Base Money: &a${config.economySymbol}${task.baseMoney.toFixed(2)}`,
            `&7Your Lv.${prog.level} Payout: &a&l${config.economySymbol}${scaledMoney.toFixed(2)}`,
            `&7Job XP Reward: &b+${scaledXp.toFixed(1)} XP`,
            '',
            prog.joined
              ? '&a▸ Click Slot to Test Earning This Reward Now!'
              : '&e▸ Click Slot to Auto-Join & Test This Task!',
          ],
          slotIndex,
        },
      };
    }

    const perkIdx = perkSlots.indexOf(slotIndex);
    if (perkIdx !== -1 && job.perks[perkIdx]) {
      const perk = job.perks[perkIdx];
      const unlocked = prog.level >= perk.level;
      return {
        content: <MinecraftItemIcon icon={unlocked ? 'ENCHANTED_BOOK' : 'BOOK'} size={28} enchanted={unlocked} />,
        badge: `Lv.${perk.level}`,
        badgeColor: unlocked ? 'text-amber-300' : 'text-slate-400',
        isInteractive: false,
        onClick: undefined,
        tooltip: {
          title: `${unlocked ? '&a&l' : '&6&l'}Milestone Lv.${perk.level}: ${perk.title}`,
          lore: [
            `&7${perk.description}`,
            '',
            unlocked ? '&a✔ Unlocked at your current level!' : `&cRequires ${job.name} Level ${perk.level}`,
          ],
          slotIndex,
        },
      };
    }

    if (isBorder) {
      return {
        content: (
          <div
            className="w-6 h-6 rounded-[2px] opacity-80"
            style={{
              backgroundColor: glassStyle.fill,
              border: `1.5px solid ${glassStyle.border}`,
              boxShadow: `inset 2px 2px 0px ${glassStyle.highlight}`,
            }}
          />
        ),
        badge: null,
        isInteractive: false,
        onClick: undefined,
        tooltip: null,
      };
    }

    return {
      content: null,
      badge: null,
      isInteractive: false,
      onClick: undefined,
      tooltip: null,
    };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column (7 cols): Interactive Minecraft Chest GUI + Action Bar + Tooltip Inspector */}
      <div className="lg:col-span-7 flex flex-col gap-5">
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
          {/* Chest Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              {activeSubGuiJob ? (
                <button
                  onClick={() => {
                    playGuiClick(config.soundOnEarn);
                    setSubGuiJobId(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Main /jobs GUI
                </button>
              ) : (
                <span className="text-xs font-medium text-slate-400">
                  Interactive 54-Slot Bukkit Inventory · Left-Click Join · Right-Click Tasks
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                <button
                  onClick={() => setGuiTheme('CLASSIC')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    guiTheme === 'CLASSIC'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Classic Chest
                </button>
                <button
                  onClick={() => setGuiTheme('DARK')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    guiTheme === 'DARK'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Dark Pack
                </button>
              </div>

              <button
                onClick={onToggleSound}
                title={config.soundOnEarn ? 'Mute Minecraft Sound FX' : 'Enable Minecraft Sound FX'}
                className="p-2 text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {config.soundOnEarn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              </button>
            </div>
          </div>

          {/* Authentic Minecraft Chest Window */}
          <div className="flex flex-col items-center">
            <div
              className={`w-full max-w-[492px] rounded-md p-3.5 select-none transition-colors ${
                guiTheme === 'CLASSIC'
                  ? 'bg-[#C6C6C6] border-t-4 border-l-4 border-t-[#FFFFFF] border-l-[#FFFFFF] border-r-4 border-b-4 border-r-[#555555] border-b-[#555555] shadow-2xl'
                  : 'bg-[#1E222B] border-t-4 border-l-4 border-t-[#343B4A] border-l-[#343B4A] border-r-4 border-b-4 border-r-[#0D1017] border-b-[#0D1017] shadow-2xl'
              }`}
            >
              {/* Chest Title Header */}
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="font-mono text-sm tracking-tight">
                  {activeSubGuiJob
                    ? renderMinecraftText(`&8Tasks &7— ${activeSubGuiJob.displayName}`)
                    : renderMinecraftText(config.guiTitle)}
                </div>
                <span
                  className={`font-mono text-[11px] tabular-nums ${
                    guiTheme === 'CLASSIC' ? 'text-[#3F3F3F]' : 'text-slate-400'
                  }`}
                >
                  {activeSubGuiJob ? '36 Slots' : `${totalSlots} Slots`}
                </span>
              </div>

              {/* 9-Column Slot Grid */}
              <div className="grid grid-cols-9 gap-[3px] p-1 bg-[#8B8B8B]/30 rounded-sm">
                {Array.from({ length: activeSubGuiJob ? 36 : totalSlots }).map((_, idx) => {
                  const slotData = activeSubGuiJob
                    ? renderSubGuiSlot(idx, activeSubGuiJob)
                    : renderMainGuiSlot(idx);

                  const isHovered = hoveredTooltip?.slotIndex === idx;

                  return (
                    <div
                      key={idx}
                      onClick={slotData.onClick}
                      onContextMenu={slotData.onRightClick}
                      onMouseEnter={() => {
                        if (slotData.tooltip) {
                          setHoveredTooltip(slotData.tooltip);
                        } else {
                          setHoveredTooltip(null);
                        }
                      }}
                      className={`relative aspect-square flex items-center justify-center transition-transform duration-75 ${
                        guiTheme === 'CLASSIC'
                          ? 'bg-[#8B8B8B] border-t-2 border-l-2 border-t-[#373737] border-l-[#373737] border-r-2 border-b-2 border-r-[#FFFFFF] border-b-[#FFFFFF]'
                          : 'bg-[#13161C] border-t-2 border-l-2 border-t-[#090B0E] border-l-[#090B0E] border-r-2 border-b-2 border-r-[#2B313E] border-b-[#2B313E]'
                      } ${slotData.isInteractive ? 'cursor-pointer hover:brightness-125 active:scale-95' : ''}`}
                    >
                      {/* Hover highlight overlay like vanilla Minecraft */}
                      {isHovered && (
                        <div className="pointer-events-none absolute inset-0 bg-white/35 z-10" />
                      )}

                      {/* Active job subtle corner indicator */}
                      {'isJoinedJob' in slotData && slotData.isJoinedJob && (
                        <div className="pointer-events-none absolute inset-[1px] ring-1 ring-emerald-400/70 bg-emerald-500/15" />
                      )}

                      {/* Item Icon */}
                      {slotData.content}

                      {/* Stack Size / Level Badge in bottom-right of slot */}
                      {slotData.badge && (
                        <span
                          className={`pointer-events-none absolute bottom-0.5 right-1 font-mono text-[10px] font-bold leading-none tabular-nums z-20 ${
                            'badgeColor' in slotData && slotData.badgeColor
                              ? slotData.badgeColor
                              : 'text-white'
                          }`}
                          style={{ textShadow: '1px 1px 0px #000000' }}
                        >
                          {slotData.badge}
                        </span>
                      )}

                      {/* Slot Index Number (subtle top-left helper) */}
                      <span className="pointer-events-none absolute top-0.5 left-1 font-mono text-[8px] opacity-25 text-black dark:text-slate-400 tabular-nums">
                        {idx}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Quick Profession Switcher Strip inside Chest Frame Footer */}
              <div className="mt-3 pt-2 border-t border-black/15 flex flex-wrap items-center justify-between gap-1.5">
                <span
                  className={`text-[11px] font-mono ${
                    guiTheme === 'CLASSIC' ? 'text-[#373737]' : 'text-slate-400'
                  }`}
                >
                  Inspect Job Sub-GUI:
                </span>
                <div className="flex flex-wrap items-center gap-1">
                  {config.jobs.map((job) => {
                    const isViewing = subGuiJobId === job.id;
                    return (
                      <button
                        key={job.id}
                        onClick={() => {
                          playGuiClick(config.soundOnEarn);
                          setSubGuiJobId(isViewing ? null : job.id);
                          setSelectedSandboxJobId(job.id);
                        }}
                        className={`px-2 py-0.5 text-[11px] font-mono rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          isViewing
                            ? 'bg-emerald-600 text-white font-semibold'
                            : guiTheme === 'CLASSIC'
                            ? 'bg-[#8B8B8B] text-white hover:bg-[#6E6E6E]'
                            : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                        }`}
                      >
                        {job.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Live Minecraft Action Bar Notification Overlay */}
            <div className="w-full max-w-[492px] mt-3">
              <div className="h-9 px-4 rounded-lg bg-[#090C12] border border-slate-800/90 flex items-center justify-center font-mono text-xs tabular-nums">
                {actionBarText ? (
                  renderMinecraftText(actionBarText)
                ) : (
                  <span className="text-slate-500">
                    Action Bar Ready — Click any job slot or execute a task to earn Vault money
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Authentic Minecraft Hover Item Lore Tooltip Inspector */}
          <div className="mt-4">
            <div className="rounded-md bg-[#100010] p-[3px] shadow-xl">
              <div className="rounded-[3px] border-2 border-[#280064] bg-[#100010]/95 px-4 py-3 min-h-[156px] flex flex-col justify-between">
                {hoveredTooltip ? (
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="font-mono text-sm">
                        {renderMinecraftText(hoveredTooltip.title)}
                      </div>
                      <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                        Slot #{hoveredTooltip.slotIndex}
                      </span>
                    </div>
                    <div className="space-y-0.5 font-mono text-xs">
                      {hoveredTooltip.lore.map((line, i) => (
                        <div key={i} className="min-h-[16px]">
                          {renderMinecraftText(line)}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="my-auto text-center py-4">
                    <p className="font-mono text-xs text-purple-300/80 mb-1">
                      Hover over any slot in the Chest GUI above to inspect its live Minecraft item tooltip
                    </p>
                    <p className="font-mono text-[11px] text-slate-400">
                      Left-Click a profession to Join/Leave · Right-Click a profession to open its Task Payout Sub-GUI
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column (5 cols): Live Economy Sandbox, 5 Job Status Cards & In-Game Command Console */}
      <div className="lg:col-span-5 flex flex-col gap-5">
        {/* Player Economy & 5-Job Progression Summary */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-white">
                5-Job Economy Sandbox
              </h2>
              <p className="text-xs text-slate-400">
                Test earning money & leveling up across all 5 professions
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onToggleAutoGrind}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  autoGrindActive
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500'
                }`}
              >
                {autoGrindActive ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    Stop Auto-Earn
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Auto-Earn Simulation
                  </>
                )}
              </button>

              <button
                onClick={onResetSimulation}
                title="Reset Sandbox Balance & Levels"
                className="p-1.5 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Top KPI Row */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-lg p-3">
              <div className="text-[11px] text-slate-400">Vault Balance</div>
              <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums mt-0.5">
                {config.economySymbol}
                {playerBalance.toFixed(2)}
              </div>
            </div>
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-lg p-3">
              <div className="text-[11px] text-slate-400">Joined Jobs</div>
              <div className="text-lg font-bold font-mono text-white tabular-nums mt-0.5">
                {activeJobsCount} / {config.maxJobsPerPlayer}
              </div>
            </div>
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-lg p-3">
              <div className="text-[11px] text-slate-400">Server Booster</div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-lg font-bold font-mono text-sky-400 tabular-nums">
                  {config.boosterMultiplier.toFixed(1)}x
                </span>
                <button
                  onClick={() => {
                    const next =
                      config.boosterMultiplier === 1.0
                        ? 1.5
                        : config.boosterMultiplier === 1.5
                        ? 2.0
                        : 1.0;
                    onSetBooster(next);
                  }}
                  className="text-[11px] font-medium text-slate-300 hover:text-white underline cursor-pointer"
                >
                  Cycle
                </button>
              </div>
            </div>
          </div>

          {/* 5 Professions Interactive Roster */}
          <div className="space-y-2 mb-4">
            {config.jobs.map((job) => {
              const prog = playerProgress[job.id] || {
                joined: false,
                level: 1,
                xp: 0,
                totalEarned: 0,
                actionsCompleted: 0,
              };
              const reqXp = getRequiredXp(job, prog.level);
              const pct = Math.min(100, Math.round((prog.xp / Math.max(1, reqXp)) * 100));
              const isSelected = sandboxJob?.id === job.id;

              return (
                <div
                  key={job.id}
                  onClick={() => setSelectedSandboxJobId(job.id)}
                  className={`p-2.5 rounded-lg border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-slate-600'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                        <MinecraftItemIcon icon={job.icon} size={22} enchanted={prog.joined} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold truncate">
                            {renderMinecraftText(job.displayName)}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                            Lv.{prog.level} · Slot #{job.slot}
                          </span>
                        </div>
                        <div className="w-36 sm:w-44 h-1.5 bg-slate-950 rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-emerald-500 transition-transform duration-150 origin-left"
                            style={{ transform: `scaleX(${pct / 100})` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-xs text-emerald-400 tabular-nums">
                        {config.economySymbol}
                        {prog.totalEarned.toFixed(2)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleJobJoin(job.id);
                        }}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          prog.joined
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {prog.joined ? 'Employed' : 'Join Job'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectJobToEdit(job.id);
                        }}
                        title="Customize this job in Job Editor"
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700/60 transition-colors cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Profession Instant Action Buttons ("Earn Money Now") */}
          {sandboxJob && (
            <div className="pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-medium text-slate-300">
                  Simulate In-Game Tasks for {sandboxJob.name}:
                </span>
                <button
                  onClick={() => {
                    playLevelUpFanfare(config.soundOnEarn);
                    onRunCommand(`/jobs levelup ${sandboxJob.id}`);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Test Level-Up (+1 Lv)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sandboxJob.tasks.map((task) => {
                  const prog = playerProgress[sandboxJob.id] || {
                    joined: false,
                    level: 1,
                    xp: 0,
                    totalEarned: 0,
                    actionsCompleted: 0,
                  };
                  const payout = getScaledPayout(sandboxJob, task.baseMoney, prog.level);

                  return (
                    <button
                      key={task.id}
                      onClick={() => onExecuteTask(sandboxJob, task)}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 transition-colors text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <MinecraftItemIcon icon={task.iconType} size={20} />
                        <span className="text-xs font-medium text-slate-200 group-hover:text-white truncate">
                          {task.label}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-semibold text-emerald-400 tabular-nums shrink-0">
                        +{config.economySymbol}
                        {payout.toFixed(2)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Live In-Game Chat & /jobs Command Tester */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">
                Server Chat & Command Console
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              {['/jobs stats', '/jobs boost 2.0', '/jobs reload'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => onRunCommand(preset)}
                  className="px-2 py-0.5 text-[11px] font-mono text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="h-40 overflow-y-auto rounded-lg bg-[#090C12] border border-slate-800/90 p-3 space-y-1.5 font-mono text-xs">
            {chatLogs.map((entry) => (
              <div key={entry.id} className="leading-relaxed">
                <span className="text-slate-600 mr-2 tabular-nums select-none">
                  [{entry.timestamp}]
                </span>
                {renderMinecraftText(entry.mcFormattedText)}
              </div>
            ))}
          </div>

          <form onSubmit={handleCommandSubmit} className="mt-3 flex items-center gap-2">
            <div className="relative flex-1">
              <ChevronRight className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder="Type /jobs, /jobs join miner, /jobs stats, /jobs boost 2.0..."
                className="w-full pl-8 pr-3 py-2 text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Run Command
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
