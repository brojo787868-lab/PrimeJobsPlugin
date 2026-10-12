import React from 'react';
import { FolderArchive, CheckCircle2, Terminal, ShieldCheck, Coins } from 'lucide-react';
import { PluginConfig } from '../types/plugin';
import { downloadMavenProjectZip } from '../utils/codeGenerator';
import { MinecraftItemIcon, renderMinecraftText } from './MinecraftIcons';

interface ServerGuidePanelProps {
  config: PluginConfig;
  onSwitchTab: (tab: 'SIMULATOR' | 'EDITOR' | 'CODE' | 'GUIDE') => void;
}

export const ServerGuidePanel: React.FC<ServerGuidePanelProps> = ({ config, onSwitchTab }) => {
  return (
    <div className="space-y-6">
      {/* Step-by-Step Build & Deployment Workflow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono text-emerald-400 mb-1">01. Export Project</div>
            <h3 className="text-base font-semibold text-white mb-2">
              Download Maven Source Archive
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Export your customized 5-Job configuration, Bukkit Chest GUI classes, and Maven pom.xml in a ready-to-compile archive.
            </p>
          </div>
          <button
            onClick={() => downloadMavenProjectZip(config)}
            className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <FolderArchive className="w-4 h-4" />
            Download {config.pluginName}.zip
          </button>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono text-amber-400 mb-1">02. Compile Plugin JAR</div>
            <h3 className="text-base font-semibold text-white mb-2">
              Package with Java 21 &amp; Maven
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Unzip the folder and run Maven from your terminal. The compiled JAR will be output to the target directory.
            </p>
          </div>
          <div className="mt-4 px-3 py-2 rounded-lg bg-[#090C12] border border-slate-800 font-mono text-xs text-emerald-300">
            mvn clean package
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono text-sky-400 mb-1">03. Install on Server</div>
            <h3 className="text-base font-semibold text-white mb-2">
              Drop into /plugins with Vault
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Place <span className="font-mono text-slate-200">{config.pluginName}-{config.version}.jar</span> into your Paper or Spigot <span className="font-mono text-slate-200">plugins/</span> directory alongside Vault and EssentialsX.
            </p>
          </div>
          <button
            onClick={() => onSwitchTab('CODE')}
            className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Inspect Java &amp; YAML Files
          </button>
        </div>
      </div>

      {/* 5 Professions Economy Matrix */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-semibold text-white">
              Configured 5-Job Economy Matrix
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono tabular-nums">
            Payout Formula: Base Money × (1 + (Level - 1) × Level Bonus) × {config.boosterMultiplier.toFixed(1)}x Booster
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-[11px] font-medium text-slate-400">
                <th className="py-2.5 px-4">Profession</th>
                <th className="py-2.5 px-4">Chest Slot</th>
                <th className="py-2.5 px-4">Max Level</th>
                <th className="py-2.5 px-4">Income Scaling</th>
                <th className="py-2.5 px-4">Earnable Tasks</th>
                <th className="py-2.5 px-4 text-right">Lv.1 → Lv.50 Top Task Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {config.jobs.map((job) => {
                const topTask = [...job.tasks].sort((a, b) => b.baseMoney - a.baseMoney)[0];
                const lv1Pay = topTask ? topTask.baseMoney * config.boosterMultiplier : 0;
                const lv50Pay = topTask
                  ? topTask.baseMoney * (1 + 49 * job.incomeMultiplierPerLevel) * config.boosterMultiplier
                  : 0;

                return (
                  <tr key={job.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <MinecraftItemIcon icon={job.icon} size={22} />
                        <span className="font-mono font-semibold">
                          {renderMinecraftText(job.displayName)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300 tabular-nums">
                      Slot #{job.slot}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300 tabular-nums">
                      Lv.{job.maxLevel}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-400 tabular-nums">
                      +{Math.round(job.incomeMultiplierPerLevel * 100)}% / level
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {job.tasks.map((t) => t.material).join(' · ')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-amber-300 tabular-nums">
                      {config.economySymbol}
                      {lv1Pay.toFixed(2)} → {config.economySymbol}
                      {lv50Pay.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Commands & Permissions Reference */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-800">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">In-Game Commands</h3>
          </div>
          <div className="space-y-2.5 text-xs">
            {[
              { cmd: '/jobs', desc: 'Opens the 54-slot interactive PrimeJobs Chest GUI.' },
              { cmd: '/jobs join <job>', desc: 'Join one of the 5 professions (Miner, Lumberjack, Farmer, Hunter, Fisherman).' },
              { cmd: '/jobs leave <job>', desc: 'Leave an active profession while keeping saved level & XP.' },
              { cmd: '/jobs stats', desc: 'Display current level, XP, and lifetime Vault earnings in chat.' },
              { cmd: '/jobs boost <multiplier>', desc: 'Set a server-wide Vault money & XP multiplier (e.g. 2.0x).' },
              { cmd: '/jobs reload', desc: 'Hot-reload config.yml payouts, GUI slots, and lore lines.' },
            ].map((item) => (
              <div key={item.cmd} className="flex items-start justify-between gap-4 py-1.5 border-b border-slate-800/60 last:border-0">
                <span className="font-mono text-emerald-400 whitespace-nowrap shrink-0">{item.cmd}</span>
                <span className="text-slate-400 text-right">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-800">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-white">Permissions &amp; Anti-Exploit Checks</h3>
          </div>
          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-mono text-white">primejobs.use (default: true)</div>
                <p className="text-slate-400 mt-0.5">
                  Grants players access to open the `/jobs` Chest GUI, view task sub-menus, and earn Vault payouts.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-mono text-white">primejobs.admin (default: op)</div>
                <p className="text-slate-400 mt-0.5">
                  Allows staff to trigger `/jobs reload` and activate global server economy boosters with `/jobs boost`.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-mono text-white">Mature Crop Age Verification</div>
                <p className="text-slate-400 mt-0.5">
                  `JobTaskListener.java` verifies `Ageable#getAge() == Ageable#getMaximumAge()` so players only earn Farmer payouts on fully grown crops.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
