import React, { useEffect, useState } from 'react';
import {
  ChatLogEntry,
  DEFAULT_PLUGIN_CONFIG,
  JobDefinition,
  JobTask,
  PlayerJobProgress,
  PluginConfig,
} from './types/plugin';
import { ChestGuiSimulator } from './components/ChestGuiSimulator';
import { JobEditorPanel } from './components/JobEditorPanel';
import { CodeViewerPanel } from './components/CodeViewerPanel';
import { ServerGuidePanel } from './components/ServerGuidePanel';
import { downloadMavenProjectZip } from './utils/codeGenerator';
import {
  playGuiClick,
  playLevelUpFanfare,
  playXpOrbSound,
} from './utils/soundEffects';

type ActiveTab = 'SIMULATOR' | 'EDITOR' | 'CODE' | 'GUIDE';

function getTimeString(): string {
  const now = new Date();
  return now.toTimeString().slice(0, 8);
}

function createInitialProgress(config: PluginConfig): Record<string, PlayerJobProgress> {
  const map: Record<string, PlayerJobProgress> = {};
  config.jobs.forEach((job, index) => {
    map[job.id] = {
      joined: index < 2, // Pre-join Miner & Lumberjack so user can test immediately
      level: index === 0 ? 3 : index === 1 ? 2 : 1,
      xp: index === 0 ? 45 : index === 1 ? 20 : 0,
      totalEarned: index === 0 ? 142.5 : index === 1 ? 54.0 : 0,
      actionsCompleted: index === 0 ? 12 : index === 1 ? 8 : 0,
    };
  });
  return map;
}

export default function App() {
  const [config, setConfig] = useState<PluginConfig>(DEFAULT_PLUGIN_CONFIG);
  const [activeTab, setActiveTab] = useState<ActiveTab>('SIMULATOR');
  const [selectedEditorJobId, setSelectedEditorJobId] = useState<string>('miner');
  const [playerBalance, setPlayerBalance] = useState<number>(196.5);
  const [playerProgress, setPlayerProgress] = useState<Record<string, PlayerJobProgress>>(() =>
    createInitialProgress(DEFAULT_PLUGIN_CONFIG)
  );
  const [actionBarText, setActionBarText] = useState<string | null>(
    '&b&lMiner &8| &a+$26.40 &8| &b+35.0 XP &7(Lv.3 — 34%)'
  );
  const [autoGrindActive, setAutoGrindActive] = useState<boolean>(false);
  const [chatLogs, setChatLogs] = useState<ChatLogEntry[]>([
    {
      id: 'init-1',
      timestamp: getTimeString(),
      type: 'SYSTEM',
      mcFormattedText: '&8[&a&lPrimeJobs&8] &7Loaded &f5 professions &7with Vault Economy hook!',
    },
    {
      id: 'init-2',
      timestamp: getTimeString(),
      type: 'COMMAND',
      mcFormattedText: '&8[&a&lPrimeJobs&8] &aYou are currently employed as &b&lMiner &7(Lv.3) &aand &6&lLumberjack &7(Lv.2)&a.',
    },
    {
      id: 'init-3',
      timestamp: getTimeString(),
      type: 'ECONOMY',
      mcFormattedText: '&8[&a&lPrimeJobs&8] &7Tip: Click any slot in the 54-slot Chest GUI or click a task to earn money.',
    },
  ]);

  const appendLog = (type: ChatLogEntry['type'], mcFormattedText: string) => {
    setChatLogs((prev) => [
      ...prev.slice(-35),
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: getTimeString(),
        type,
        mcFormattedText,
      },
    ]);
  };

  const getRequiredXp = (job: JobDefinition, level: number) => {
    return Math.round(job.baseXpRequirement * Math.pow(1 + job.xpMultiplierPerLevel, Math.max(0, level - 1)));
  };

  const handleToggleJobJoin = (jobId: string) => {
    const job = config.jobs.find((j) => j.id === jobId);
    if (!job) return;

    const current = playerProgress[jobId] || {
      joined: false,
      level: 1,
      xp: 0,
      totalEarned: 0,
      actionsCompleted: 0,
    };

    const currentActiveCount = Object.values(playerProgress).filter((p) => p?.joined).length;

    if (current.joined) {
      playGuiClick(config.soundOnEarn);
      setPlayerProgress((prev) => ({
        ...prev,
        [jobId]: { ...current, joined: false },
      }));
      appendLog(
        'COMMAND',
        `&8[&a&l${config.pluginName}&8] &7You have left the ${job.displayName} &7profession.`
      );
      setActionBarText(`${job.displayName} &8| &cLeft Profession`);
    } else {
      if (currentActiveCount >= config.maxJobsPerPlayer) {
        playGuiClick(config.soundOnEarn);
        appendLog(
          'SYSTEM',
          `&8[&a&l${config.pluginName}&8] &cYou reached the limit of ${config.maxJobsPerPlayer} active professions! Leave a job first.`
        );
        setActionBarText(`&cMax active jobs reached (${currentActiveCount}/${config.maxJobsPerPlayer})`);
        return;
      }

      playXpOrbSound(config.soundOnEarn);
      setPlayerProgress((prev) => ({
        ...prev,
        [jobId]: { ...current, joined: true },
      }));
      appendLog(
        'COMMAND',
        `&8[&a&l${config.pluginName}&8] &aYou joined the ${job.displayName} &aprofession!`
      );
      setActionBarText(`${job.displayName} &8| &a&lEMPLOYED &7(Lv.${current.level})`);
    }
  };

  const handleExecuteTask = (job: JobDefinition, task: JobTask) => {
    const current = playerProgress[job.id] || {
      joined: false,
      level: 1,
      xp: 0,
      totalEarned: 0,
      actionsCompleted: 0,
    };

    // Auto-join if not yet joined and player has room, or allow testing directly
    let isJoined = current.joined;
    if (!isJoined) {
      const activeCount = Object.values(playerProgress).filter((p) => p?.joined).length;
      if (activeCount < config.maxJobsPerPlayer) {
        isJoined = true;
        appendLog(
          'COMMAND',
          `&8[&a&l${config.pluginName}&8] &aAuto-joined ${job.displayName} &ato perform ${task.label}!`
        );
      } else {
        appendLog(
          'SYSTEM',
          `&8[&a&l${config.pluginName}&8] &eSimulated ${task.label} for ${job.displayName} &7(Join job in GUI to save active slot).`
        );
      }
    }

    const levelMult = 1 + (current.level - 1) * job.incomeMultiplierPerLevel;
    const moneyEarned = task.baseMoney * levelMult * config.boosterMultiplier;
    const xpEarned = task.baseXp * config.boosterMultiplier;

    let nextLevel = current.level;
    let nextXp = current.xp + xpEarned;
    const reqXp = getRequiredXp(job, nextLevel);
    let leveledUp = false;

    if (nextXp >= reqXp && nextLevel < job.maxLevel) {
      nextXp -= reqXp;
      nextLevel += 1;
      leveledUp = true;
    }

    if (leveledUp) {
      playLevelUpFanfare(config.soundOnEarn);
      appendLog(
        'LEVEL_UP',
        `&8[&a&l${config.pluginName}&8] &6&lLEVEL UP! &eSteve_Prime &7reached &6Level ${nextLevel} &7in ${job.displayName}&7! (&a+${Math.round(
          (nextLevel - 1) * job.incomeMultiplierPerLevel * 100
        )}% Income&7)`
      );
    } else {
      playXpOrbSound(config.soundOnEarn);
    }

    setPlayerBalance((prev) => prev + moneyEarned);
    setPlayerProgress((prev) => ({
      ...prev,
      [job.id]: {
        joined: isJoined,
        level: nextLevel,
        xp: nextXp,
        totalEarned: current.totalEarned + moneyEarned,
        actionsCompleted: current.actionsCompleted + 1,
      },
    }));

    const newReqXp = getRequiredXp(job, nextLevel);
    const pct = Math.min(100, Math.round((nextXp / Math.max(1, newReqXp)) * 100));
    setActionBarText(
      `${job.displayName} &8| &a+${config.economySymbol}${moneyEarned.toFixed(2)} &8| &b+${xpEarned.toFixed(
        1
      )} XP &7(Lv.${nextLevel} — ${pct}%)`
    );
  };

  // Auto-Grind interval loop
  useEffect(() => {
    if (!autoGrindActive) return;
    const timer = setInterval(() => {
      const joinedJobs = config.jobs.filter((j) => playerProgress[j.id]?.joined);
      const pool = joinedJobs.length > 0 ? joinedJobs : config.jobs;
      const randomJob = pool[Math.floor(Math.random() * pool.length)];
      if (!randomJob || randomJob.tasks.length === 0) return;
      const randomTask = randomJob.tasks[Math.floor(Math.random() * randomJob.tasks.length)];
      handleExecuteTask(randomJob, randomTask);
    }, 850);

    return () => clearInterval(timer);
  });

  const handleRunCommand = (rawCmd: string) => {
    const clean = rawCmd.trim();
    const parts = clean.replace(/^\//, '').split(/\s+/);
    const sub = (parts[1] || '').toLowerCase();

    if (sub === 'stats') {
      appendLog('COMMAND', '&8&m----------------------------------------');
      appendLog('COMMAND', `&a&l${config.pluginName} &7— &fSteve_Prime Profession Stats`);
      config.jobs.forEach((job) => {
        const p = playerProgress[job.id] || { joined: false, level: 1, xp: 0, totalEarned: 0, actionsCompleted: 0 };
        appendLog(
          'COMMAND',
          ` &8• ${job.displayName} &7Lv.${p.level} &8| &a${config.economySymbol}${p.totalEarned.toFixed(
            2
          )} &8| ${p.joined ? '&aEmployed' : '&7Idle'}`
        );
      });
      appendLog('COMMAND', '&8&m----------------------------------------');
      return;
    }

    if (sub === 'boost' && parts[2]) {
      const val = parseFloat(parts[2]);
      if (!isNaN(val) && val >= 0.5 && val <= 10) {
        setConfig((prev) => ({ ...prev, boosterMultiplier: val }));
        appendLog(
          'SYSTEM',
          `&8[&a&l${config.pluginName}&8] &eGlobal Server Economy Booster set to &b&l${val.toFixed(1)}x&e!`
        );
      }
      return;
    }

    if ((sub === 'join' || sub === 'leave') && parts[2]) {
      const targetId = parts[2].toLowerCase();
      const job = config.jobs.find((j) => j.id === targetId || j.name.toLowerCase() === targetId);
      if (job) {
        handleToggleJobJoin(job.id);
      } else {
        appendLog(
          'SYSTEM',
          `&8[&a&l${config.pluginName}&8] &cUnknown job '${parts[2]}'. Available: miner, lumberjack, farmer, hunter, fisherman.`
        );
      }
      return;
    }

    if (sub === 'levelup' && parts[2]) {
      const targetId = parts[2].toLowerCase();
      const job = config.jobs.find((j) => j.id === targetId);
      if (job) {
        const cur = playerProgress[job.id] || { joined: true, level: 1, xp: 0, totalEarned: 0, actionsCompleted: 0 };
        const nextLv = Math.min(job.maxLevel, cur.level + 1);
        setPlayerProgress((prev) => ({
          ...prev,
          [job.id]: { ...cur, joined: true, level: nextLv, xp: 0 },
        }));
        appendLog(
          'LEVEL_UP',
          `&8[&a&l${config.pluginName}&8] &6&lLEVEL UP! &eSteve_Prime &7advanced to &6Level ${nextLv} &7in ${job.displayName}&7!`
        );
      }
      return;
    }

    if (sub === 'reload') {
      playGuiClick(config.soundOnEarn);
      appendLog(
        'SYSTEM',
        `&8[&a&l${config.pluginName}&8] &aConfiguration and all 5 jobs reloaded in 4ms.`
      );
      return;
    }

    appendLog(
      'COMMAND',
      `&8[&a&l${config.pluginName}&8] &7Opened interactive 54-slot &f/jobs &7Chest GUI.`
    );
  };

  const handleResetSimulation = () => {
    setAutoGrindActive(false);
    setPlayerBalance(0);
    const resetMap: Record<string, PlayerJobProgress> = {};
    config.jobs.forEach((job, idx) => {
      resetMap[job.id] = {
        joined: idx === 0,
        level: 1,
        xp: 0,
        totalEarned: 0,
        actionsCompleted: 0,
      };
    });
    setPlayerProgress(resetMap);
    setActionBarText('&7Simulation reset — Vault Balance $0.00');
    appendLog('SYSTEM', `&8[&a&l${config.pluginName}&8] &7Reset player Vault balance and job levels.`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F17] text-slate-100">
      {/* Top Navigation Bar — Strict 3-Zone Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800/90 bg-[#0B0F17]/95 sticky top-0 z-30 backdrop-blur-md">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('SIMULATOR');
          }}
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 font-display"
        >
          PrimeJobs Studio
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-400 overflow-x-auto">
          <button
            onClick={() => setActiveTab('SIMULATOR')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activeTab === 'SIMULATOR'
                ? 'text-white border-emerald-500'
                : 'border-transparent hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            GUI Simulator
          </button>
          <button
            onClick={() => setActiveTab('EDITOR')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activeTab === 'EDITOR'
                ? 'text-white border-emerald-500'
                : 'border-transparent hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            5-Job Editor
          </button>
          <button
            onClick={() => setActiveTab('CODE')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activeTab === 'CODE'
                ? 'text-white border-emerald-500'
                : 'border-transparent hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            Java Source
          </button>
          <button
            onClick={() => setActiveTab('GUIDE')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activeTab === 'GUIDE'
                ? 'text-white border-emerald-500'
                : 'border-transparent hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            GitHub &amp; Build
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action Button */}
        <div className="flex items-center shrink-0">
          <button
            onClick={() => downloadMavenProjectZip(config)}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Download Plugin (.zip)
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-[1380px] mx-auto px-4 sm:px-6 py-6">
        {/* Contextual Workspace Header with Clean Unboxed Metadata */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 mb-6 border-b border-slate-800/80">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono mb-2">
              <span>Paper &amp; Spigot {config.apiVersion}+</span>
              <span aria-hidden="true">·</span>
              <span>Vault Economy API</span>
              <span aria-hidden="true">·</span>
              <span>5 Professions (Miner / Lumberjack / Farmer / Hunter / Fisherman)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-display">
              {config.pluginName} — Interactive 5-Job GUI &amp; Plugin Generator
            </h1>
          </div>

          {/* Segmented View Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg self-start md:self-auto">
            {(
              [
                { id: 'SIMULATOR', label: 'Chest GUI Sandbox' },
                { id: 'EDITOR', label: 'Customize 5 Jobs' },
                { id: 'CODE', label: 'Java & YAML Code' },
                { id: 'GUIDE', label: 'GitHub & Build' },
              ] as { id: ActiveTab; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active View Area */}
        {activeTab === 'SIMULATOR' && (
          <ChestGuiSimulator
            config={config}
            playerBalance={playerBalance}
            playerProgress={playerProgress}
            actionBarText={actionBarText}
            chatLogs={chatLogs}
            autoGrindActive={autoGrindActive}
            onToggleAutoGrind={() => setAutoGrindActive((prev) => !prev)}
            onToggleJobJoin={handleToggleJobJoin}
            onExecuteTask={handleExecuteTask}
            onRunCommand={handleRunCommand}
            onResetSimulation={handleResetSimulation}
            onToggleSound={() =>
              setConfig((prev) => ({ ...prev, soundOnEarn: !prev.soundOnEarn }))
            }
            onSetBooster={(mult) => {
              setConfig((prev) => ({ ...prev, boosterMultiplier: mult }));
              appendLog(
                'SYSTEM',
                `&8[&a&l${config.pluginName}&8] &eServer Economy Booster updated to &b&l${mult.toFixed(1)}x&e!`
              );
            }}
            onSelectJobToEdit={(jobId) => {
              setSelectedEditorJobId(jobId);
              setActiveTab('EDITOR');
            }}
          />
        )}

        {activeTab === 'EDITOR' && (
          <JobEditorPanel
            config={config}
            selectedJobId={selectedEditorJobId}
            onSelectJobId={setSelectedEditorJobId}
            onUpdateConfig={setConfig}
            onSwitchToSimulator={() => setActiveTab('SIMULATOR')}
          />
        )}

        {activeTab === 'CODE' && <CodeViewerPanel config={config} />}

        {activeTab === 'GUIDE' && (
          <ServerGuidePanel config={config} onSwitchTab={setActiveTab} />
        )}
      </main>
    </div>
  );
}
