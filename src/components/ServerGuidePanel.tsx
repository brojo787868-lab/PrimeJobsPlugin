import React, { useState } from 'react';
import {
  FolderArchive,
  CheckCircle2,
  Terminal,
  ShieldCheck,
  Coins,
  UploadCloud,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { PluginConfig } from '../types/plugin';
import {
  downloadMavenProjectZip,
  generatePluginFiles,
  pushPluginToGitHub,
} from '../utils/codeGenerator';
import { MinecraftItemIcon, renderMinecraftText } from './MinecraftIcons';

interface ServerGuidePanelProps {
  config: PluginConfig;
  onSwitchTab: (tab: 'SIMULATOR' | 'EDITOR' | 'CODE' | 'GUIDE') => void;
}

export const ServerGuidePanel: React.FC<ServerGuidePanelProps> = ({ config, onSwitchTab }) => {
  const [repoName, setRepoName] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [branch, setBranch] = useState('main');
  const [pushStatus, setPushStatus] = useState<'IDLE' | 'PUSHING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [progressText, setProgressText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [deployedUrls, setDeployedUrls] = useState<{
    repoUrl: string;
    actionsUrl: string;
    releasesUrl: string;
  } | null>(null);
  const [copiedWorkflow, setCopiedWorkflow] = useState(false);

  const workflowFile = generatePluginFiles(config).find((f) =>
    f.path.includes('build-plugin.yml')
  );

  const handleCopyWorkflow = async () => {
    if (!workflowFile) return;
    try {
      await navigator.clipboard.writeText(workflowFile.content);
      setCopiedWorkflow(true);
      setTimeout(() => setCopiedWorkflow(false), 1800);
    } catch {
      // ignore
    }
  };

  const handlePushToGitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoName.trim() || !githubToken.trim()) {
      setPushStatus('ERROR');
      setErrorMessage('Please enter both your GitHub repository (username/repo) and Personal Access Token.');
      return;
    }

    setPushStatus('PUSHING');
    setErrorMessage('');
    setDeployedUrls(null);

    try {
      const urls = await pushPluginToGitHub({
        config,
        repoFullName: repoName,
        token: githubToken,
        branch: branch.trim() || 'main',
        onProgress: (msg) => setProgressText(msg),
      });
      setDeployedUrls(urls);
      setPushStatus('SUCCESS');
      setProgressText('All 10 files pushed! GitHub Actions is now compiling your .jar file.');
    } catch (err) {
      setPushStatus('ERROR');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to push to GitHub.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Why GitHub Download Fails & How GitHub Auto-Builds Your .JAR */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 mb-5 border-b border-slate-800">
          <div>
            <div className="text-xs font-mono text-amber-400 mb-1">
              GitHub Hosting &amp; Automatic .JAR Compiler
            </div>
            <h2 className="text-lg font-bold text-white">
              Why You Cannot Use GitHub&apos;s &ldquo;Download ZIP&rdquo; Button Directly in Minecraft — And How to Fix It
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Minecraft servers only load compiled <span className="font-mono text-emerald-400">{config.pluginName}-{config.version}.jar</span> binary files inside the <span className="font-mono text-slate-200">plugins/</span> folder. When you click <span className="font-mono text-slate-200">Code → Download ZIP</span> on GitHub, GitHub gives you uncompiled <span className="font-mono text-amber-300">.java</span> source files. We solved this by bundling a <span className="font-mono text-sky-400">GitHub Actions Cloud Compiler (.github/workflows/build-plugin.yml)</span> that compiles and hosts the ready-to-play <span className="font-mono text-emerald-400">.jar</span> on your GitHub **Releases** page automatically!
            </p>
          </div>

          <button
            onClick={() => downloadMavenProjectZip(config)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <FolderArchive className="w-4 h-4" />
            Download GitHub-Ready .ZIP
          </button>
        </div>

        {/* Two Columns: Option A (Direct GitHub Push) & Option B (No-Token Upload Steps) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Option A: Direct 1-Click GitHub API Deployer */}
          <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">
                  Option A: 1-Click Push to Your GitHub Repository
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Direct REST API</span>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Push all 10 plugin files (including <span className="font-mono text-slate-200">pom.xml</span> and the GitHub Actions <span className="font-mono text-slate-200">.jar</span> builder) directly to your GitHub repo. GitHub will compile and publish <span className="font-mono text-emerald-400">{config.pluginName}-{config.version}.jar</span> under **Releases** in ~45 seconds.
            </p>

            <form onSubmit={handlePushToGitHub} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    GitHub Repository (owner/repo)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. yourname/PrimeJobs"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Branch
                  </label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  GitHub Personal Access Token (Requires &ldquo;repo&rdquo; &amp; &ldquo;workflow&rdquo; scopes)
                </label>
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={pushStatus === 'PUSHING'}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                {pushStatus === 'PUSHING'
                  ? progressText || 'Pushing Files to GitHub...'
                  : 'Push All 10 Files to GitHub & Build .JAR'}
              </button>
            </form>

            {pushStatus === 'ERROR' && errorMessage && (
              <div className="mt-3 p-3 rounded-lg bg-rose-950/50 border border-rose-500/40 flex items-start gap-2 text-xs text-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {pushStatus === 'SUCCESS' && deployedUrls && (
              <div className="mt-3 p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 space-y-2 text-xs">
                <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {progressText}
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <a
                    href={deployedUrls.actionsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-sky-300 hover:text-sky-200 underline"
                  >
                    1. Watch .JAR Build in GitHub Actions
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href={deployedUrls.releasesUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-emerald-300 hover:text-emerald-200 underline"
                  >
                    2. Download Compiled .JAR in Releases
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Option B: Manual GitHub Upload (Zero Token Needed) */}
          <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">
                Option B: Upload on GitHub.com (No Token or Java Needed)
              </h3>
              <button
                onClick={handleCopyWorkflow}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {copiedWorkflow ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    Copied build-plugin.yml
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy build-plugin.yml
                  </>
                )}
              </button>
            </div>

            <ol className="space-y-2.5 text-xs text-slate-300 list-decimal list-inside leading-relaxed">
              <li>
                Click <span className="font-semibold text-emerald-400">Download GitHub-Ready .ZIP</span> above and extract the ZIP folder on your device.
              </li>
              <li>
                Create a new repository on <span className="font-mono text-white">github.com/new</span>, click <span className="font-mono text-white">uploading an existing file</span>, and drag all extracted items (<span className="font-mono text-amber-300">pom.xml</span>, <span className="font-mono text-amber-300">src/</span>, and <span className="font-mono text-sky-300">.github/</span>) directly into the root of your repository.
              </li>
              <li>
                In your GitHub repository, go to <span className="font-mono text-white">Settings → Actions → General → Workflow permissions</span> and select <span className="font-mono text-emerald-400">Read and write permissions</span> so GitHub can publish Releases.
              </li>
              <li>
                Click the <span className="font-mono text-white">Actions</span> tab on GitHub. Within 45 seconds, GitHub compiles <span className="font-mono text-emerald-400">{config.pluginName}-{config.version}.jar</span> and attaches it to your repository&apos;s <span className="font-mono text-white">Releases</span> page for direct download!
              </li>
            </ol>
          </div>
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
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">In-Game Commands</h3>
            </div>
            <button
              onClick={() => onSwitchTab('CODE')}
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer"
            >
              View Java Source →
            </button>
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
