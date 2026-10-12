import { GLASS_PANE_COLORS } from '../components/MinecraftIcons';
import { PluginConfig } from '../types/plugin';

export interface GeneratedFile {
  path: string;
  filename: string;
  language: 'java' | 'yaml' | 'xml';
  description: string;
  content: string;
}

export function generatePluginFiles(config: PluginConfig): GeneratedFile[] {
  const pkg = config.packageName || 'me.prime.jobs';
  const pkgPath = pkg.replace(/\./g, '/');
  const glassMaterial = GLASS_PANE_COLORS[config.borderGlassColor]?.material || 'BLACK_STAINED_GLASS_PANE';

  const configYml = `# ==========================================================
# ${config.pluginName} v${config.version} — Official Configuration
# Compatible with Paper / Spigot ${config.apiVersion}+ & Vault Economy
# ==========================================================

settings:
  prefix: "&8[&a&l${config.pluginName}&8] &r"
  max-jobs-per-player: ${config.maxJobsPerPlayer}
  economy-symbol: "${config.economySymbol}"
  global-booster-multiplier: ${config.boosterMultiplier.toFixed(2)}
  actionbar-notifications: ${config.actionBarEnabled}
  sound-on-earn: ${config.soundOnEarn}
  level-up-broadcast: ${config.levelUpBroadcast}

gui:
  title: "${config.guiTitle}"
  rows: ${config.guiRows}
  border-material: "${glassMaterial}"
  stats-slot: 4
  close-slot: ${(config.guiRows - 1) * 9 + 4}

# ==========================================================
# 5 Server Professions & Economy Payouts
# ==========================================================
jobs:
${config.jobs
  .map(
    (job) => `  ${job.id}:
    display-name: "${job.displayName}"
    material: "${job.materialName}"
    slot: ${job.slot}
    max-level: ${job.maxLevel}
    base-xp-requirement: ${job.baseXpRequirement}
    income-multiplier-per-level: ${job.incomeMultiplierPerLevel}
    xp-multiplier-per-level: ${job.xpMultiplierPerLevel}
    lore:
${job.lore.map((line) => `      - "${line}"`).join('\n')}
    tasks:
${job.tasks
  .map(
    (task) => `      ${task.material}:
        action: "${task.actionType}"
        money: ${task.baseMoney.toFixed(2)}
        xp: ${task.baseXp.toFixed(2)}`
  )
  .join('\n')}`
  )
  .join('\n\n')}
`;

  const pluginYml = `name: ${config.pluginName}
version: '${config.version}'
main: ${pkg}.PrimeJobsPlugin
api-version: '${config.apiVersion}'
authors: [ PrimeStudio ]
description: Prime 5-Job Economy & Interactive Chest GUI Plugin for Minecraft Servers
depend: [ Vault ]
commands:
  jobs:
    description: Open the PrimeJobs interactive GUI or manage professions
    aliases: [ job, primejobs ]
    usage: /jobs [join|leave|stats|top|boost|reload]
permissions:
  primejobs.use:
    description: Allows players to open the Job GUI and join jobs
    default: true
  primejobs.admin:
    description: Allows admins to reload config and set global economy boosters
    default: op
`;

  const pomXml = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>${pkg}</groupId>
    <artifactId>${config.pluginName}</artifactId>
    <version>${config.version}</version>
    <packaging>jar</packaging>

    <name>${config.pluginName}</name>
    <properties>
        <java.version>21</java.version>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <repositories>
        <repository>
            <id>papermc-repo</id>
            <url>https://repo.papermc.io/repository/maven-public/</url>
        </repository>
        <repository>
            <id>jitpack.io</id>
            <url>https://jitpack.io</url>
        </repository>
    </repositories>

    <dependencies>
        <dependency>
            <groupId>io.papermc.paper</groupId>
            <artifactId>paper-api</artifactId>
            <version>${config.apiVersion}.1-R0.1-SNAPSHOT</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>com.github.MilkBowl</groupId>
            <artifactId>VaultAPI</artifactId>
            <version>1.7.1</version>
            <scope>provided</scope>
        </dependency>
    </dependencies>

    <build>
        <defaultGoal>clean package</defaultGoal>
        <finalName>\${project.artifactId}-\${project.version}</finalName>
        <resources>
            <resource>
                <directory>src/main/resources</directory>
                <filtering>true</filtering>
            </resource>
        </resources>
    </build>
</project>
`;

  const mainJava = `package ${pkg};

import ${pkg}.command.JobsCommand;
import ${pkg}.gui.JobsGuiManager;
import ${pkg}.listener.JobTaskListener;
import ${pkg}.model.Job;
import ${pkg}.model.Job.TaskReward;
import ${pkg}.model.PlayerJobData;
import net.milkbowl.vault.economy.Economy;
import org.bukkit.ChatColor;
import org.bukkit.Material;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.plugin.RegisteredServiceProvider;
import org.bukkit.plugin.java.JavaPlugin;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public final class PrimeJobsPlugin extends JavaPlugin {

    private Economy economy;
    private JobsGuiManager guiManager;
    private final Map<String, Job> jobs = new LinkedHashMap<>();
    private final Map<UUID, Map<String, PlayerJobData>> playerDatabase = new ConcurrentHashMap<>();
    private double globalBooster = ${config.boosterMultiplier.toFixed(2)};

    @Override
    public void onEnable() {
        saveDefaultConfig();

        if (!setupEconomy()) {
            getLogger().severe("Vault Economy dependency not found! Disabling ${config.pluginName}.");
            getServer().getPluginManager().disablePlugin(this);
            return;
        }

        loadJobsFromConfig();
        this.guiManager = new JobsGuiManager(this);

        JobsCommand jobsCommand = new JobsCommand(this);
        Objects.requireNonNull(getCommand("jobs")).setExecutor(jobsCommand);
        Objects.requireNonNull(getCommand("jobs")).setTabCompleter(jobsCommand);

        getServer().getPluginManager().registerEvents(new JobTaskListener(this), this);
        getLogger().info("${config.pluginName} v${config.version} enabled with " + jobs.size() + " professions!");
    }

    private boolean setupEconomy() {
        if (getServer().getPluginManager().getPlugin("Vault") == null) {
            return false;
        }
        RegisteredServiceProvider<Economy> rsp = getServer().getServicesManager().getRegistration(Economy.class);
        if (rsp == null) {
            return false;
        }
        economy = rsp.getProvider();
        return economy != null;
    }

    public void loadJobsFromConfig() {
        reloadConfig();
        jobs.clear();
        this.globalBooster = getConfig().getDouble("settings.global-booster-multiplier", 1.0);

        ConfigurationSection jobsSection = getConfig().getConfigurationSection("jobs");
        if (jobsSection == null) return;

        for (String jobId : jobsSection.getKeys(false)) {
            ConfigurationSection sec = jobsSection.getConfigurationSection(jobId);
            if (sec == null) continue;

            String displayName = sec.getString("display-name", jobId);
            Material icon = Material.matchMaterial(sec.getString("material", "DIAMOND_PICKAXE"));
            int slot = sec.getInt("slot", 20);
            int maxLevel = sec.getInt("max-level", 100);
            int baseXpReq = sec.getInt("base-xp-requirement", 100);
            double incomeMult = sec.getDouble("income-multiplier-per-level", 0.05);
            double xpMult = sec.getDouble("xp-multiplier-per-level", 0.15);
            List<String> lore = sec.getStringList("lore");

            Map<String, TaskReward> tasks = new LinkedHashMap<>();
            ConfigurationSection taskSec = sec.getConfigurationSection("tasks");
            if (taskSec != null) {
                for (String matKey : taskSec.getKeys(false)) {
                    ConfigurationSection t = taskSec.getConfigurationSection(matKey);
                    if (t != null) {
                        tasks.put(matKey.toUpperCase(Locale.ROOT), new TaskReward(
                                matKey.toUpperCase(Locale.ROOT),
                                t.getString("action", "BREAK"),
                                t.getDouble("money", 1.0),
                                t.getDouble("xp", 2.0)
                        ));
                    }
                }
            }

            Job job = new Job(
                    jobId,
                    displayName,
                    icon != null ? icon : Material.DIAMOND_PICKAXE,
                    slot,
                    maxLevel,
                    baseXpReq,
                    incomeMult,
                    xpMult,
                    lore,
                    tasks
            );
            jobs.put(jobId.toLowerCase(Locale.ROOT), job);
        }
    }

    public Map<String, PlayerJobData> getPlayerJobs(UUID uuid) {
        return playerDatabase.computeIfAbsent(uuid, k -> new ConcurrentHashMap<>());
    }

    public int getActiveJobCount(UUID uuid) {
        return (int) getPlayerJobs(uuid).values().stream().filter(PlayerJobData::isJoined).count();
    }

    public Map<String, Job> getJobs() {
        return jobs;
    }

    public Economy getEconomy() {
        return economy;
    }

    public JobsGuiManager getGuiManager() {
        return guiManager;
    }

    public double getGlobalBooster() {
        return globalBooster;
    }

    public void setGlobalBooster(double globalBooster) {
        this.globalBooster = Math.max(0.1, globalBooster);
    }

    public String color(String text) {
        return ChatColor.translateAlternateColorCodes('&', text);
    }
}
`;

  const jobModelJava = `package ${pkg}.model;

import org.bukkit.Material;
import java.util.List;
import java.util.Map;

public class Job {

    private final String id;
    private final String displayName;
    private final Material material;
    private final int slot;
    private final int maxLevel;
    private final int baseXpRequirement;
    private final double incomeMultiplierPerLevel;
    private final double xpMultiplierPerLevel;
    private final List<String> lore;
    private final Map<String, TaskReward> tasks;

    public Job(
            String id,
            String displayName,
            Material material,
            int slot,
            int maxLevel,
            int baseXpRequirement,
            double incomeMultiplierPerLevel,
            double xpMultiplierPerLevel,
            List<String> lore,
            Map<String, TaskReward> tasks
    ) {
        this.id = id;
        this.displayName = displayName;
        this.material = material;
        this.slot = slot;
        this.maxLevel = maxLevel;
        this.baseXpRequirement = baseXpRequirement;
        this.incomeMultiplierPerLevel = incomeMultiplierPerLevel;
        this.xpMultiplierPerLevel = xpMultiplierPerLevel;
        this.lore = lore;
        this.tasks = tasks;
    }

    public double getRequiredXpForLevel(int level) {
        return Math.round(baseXpRequirement * Math.pow(1.0 + xpMultiplierPerLevel, Math.max(0, level - 1)));
    }

    public double calculateMoneyPayout(double baseMoney, int level, double globalBooster) {
        double levelMultiplier = 1.0 + ((level - 1) * incomeMultiplierPerLevel);
        return baseMoney * levelMultiplier * globalBooster;
    }

    public String getId() { return id; }
    public String getDisplayName() { return displayName; }
    public Material getMaterial() { return material; }
    public int getSlot() { return slot; }
    public int getMaxLevel() { return maxLevel; }
    public double getIncomeMultiplierPerLevel() { return incomeMultiplierPerLevel; }
    public List<String> getLore() { return lore; }
    public Map<String, TaskReward> getTasks() { return tasks; }

    public record TaskReward(String targetKey, String actionType, double baseMoney, double baseXp) {}
}
`;

  const playerJobDataJava = `package ${pkg}.model;

public class PlayerJobData {
    private boolean joined;
    private int level;
    private double xp;
    private double totalEarned;

    public PlayerJobData() {
        this.joined = false;
        this.level = 1;
        this.xp = 0.0;
        this.totalEarned = 0.0;
    }

    public boolean isJoined() { return joined; }
    public void setJoined(boolean joined) { this.joined = joined; }

    public int getLevel() { return level; }
    public void setLevel(int level) { this.level = level; }

    public double getXp() { return xp; }
    public void setXp(double xp) { this.xp = xp; }

    public double getTotalEarned() { return totalEarned; }
    public void addEarned(double amount) { this.totalEarned += amount; }
}
`;

  const guiManagerJava = `package ${pkg}.gui;

import ${pkg}.PrimeJobsPlugin;
import ${pkg}.model.Job;
import ${pkg}.model.Job.TaskReward;
import ${pkg}.model.PlayerJobData;
import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.enchantments.Enchantment;
import org.bukkit.entity.Player;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.InventoryHolder;
import org.bukkit.inventory.ItemFlag;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class JobsGuiManager {

    private final PrimeJobsPlugin plugin;

    public JobsGuiManager(PrimeJobsPlugin plugin) {
        this.plugin = plugin;
    }

    public void openMainGui(Player player) {
        int rows = plugin.getConfig().getInt("gui.rows", ${config.guiRows});
        int size = Math.min(54, Math.max(27, rows * 9));
        String title = plugin.color(plugin.getConfig().getString("gui.title", "${config.guiTitle}"));

        Inventory inv = Bukkit.createInventory(new PrimeGuiHolder("MAIN", null), size, title);

        // Fill decorative stained glass border
        Material borderMat = Material.matchMaterial(
                plugin.getConfig().getString("gui.border-material", "${glassMaterial}")
        );
        ItemStack filler = createItem(borderMat != null ? borderMat : Material.BLACK_STAINED_GLASS_PANE, "&8 ", List.of(), false);
        for (int i = 0; i < size; i++) {
            if (i < 9 || i >= size - 9 || i % 9 == 0 || i % 9 == 8) {
                inv.setItem(i, filler);
            }
        }

        // Player Economy Summary Item (Top Center Slot 4)
        double balance = plugin.getEconomy().getBalance(player);
        int activeJobs = plugin.getActiveJobCount(player.getUniqueId());
        int maxJobs = plugin.getConfig().getInt("settings.max-jobs-per-player", ${config.maxJobsPerPlayer});
        inv.setItem(4, createItem(
                Material.EMERALD,
                "&a&lPlayer Economy Profile",
                List.of(
                        "&7Player: &f" + player.getName(),
                        "&7Vault Balance: &a${config.economySymbol}" + String.format("%.2f", balance),
                        "&7Active Professions: &e" + activeJobs + "&7/&e" + maxJobs,
                        "&7Server Booster: &b" + String.format("%.2fx", plugin.getGlobalBooster())
                ),
                true
        ));

        // Populate all 5 Professions
        Map<String, PlayerJobData> playerJobs = plugin.getPlayerJobs(player.getUniqueId());
        for (Job job : plugin.getJobs().values()) {
            PlayerJobData data = playerJobs.computeIfAbsent(job.getId(), k -> new PlayerJobData());
            double maxXp = job.getRequiredXpForLevel(data.getLevel());
            int incomeBonus = (int) Math.round((data.getLevel() - 1) * job.getIncomeMultiplierPerLevel() * 100);

            List<String> formattedLore = new ArrayList<>();
            for (String line : job.getLore()) {
                formattedLore.add(plugin.color(line
                        .replace("%status%", data.isJoined() ? "&a&lEMPLOYED" : "&7Not Joined")
                        .replace("%level%", String.valueOf(data.getLevel()))
                        .replace("%max_level%", String.valueOf(job.getMaxLevel()))
                        .replace("%xp%", String.format("%.0f", data.getXp()))
                        .replace("%max_xp%", String.format("%.0f", maxXp))
                        .replace("%progress_bar%", buildProgressBar(data.getXp(), maxXp))
                        .replace("%income_bonus%", String.valueOf(incomeBonus))
                ));
            }

            ItemStack jobIcon = createItem(job.getMaterial(), job.getDisplayName(), formattedLore, data.isJoined());
            if (job.getSlot() >= 0 && job.getSlot() < size) {
                inv.setItem(job.getSlot(), jobIcon);
            }
        }

        // Close Button
        int closeSlot = plugin.getConfig().getInt("gui.close-slot", size - 5);
        inv.setItem(closeSlot, createItem(Material.BARRIER, "&c&lClose Menu", List.of("&7Click to close the Job menu."), false));

        player.openInventory(inv);
    }

    public void openJobTaskSubGui(Player player, Job job) {
        Inventory inv = Bukkit.createInventory(
                new PrimeGuiHolder("TASKS", job.getId()),
                36,
                plugin.color("&8Tasks &7— " + job.getDisplayName())
        );

        PlayerJobData data = plugin.getPlayerJobs(player.getUniqueId())
                .computeIfAbsent(job.getId(), k -> new PlayerJobData());

        int slot = 10;
        for (TaskReward task : job.getTasks().values()) {
            if (slot == 17) slot = 19;
            if (slot >= 26) break;

            Material mat = Material.matchMaterial(task.targetKey());
            if (mat == null) mat = job.getMaterial();

            double scaledMoney = job.calculateMoneyPayout(task.baseMoney(), data.getLevel(), plugin.getGlobalBooster());
            inv.setItem(slot++, createItem(
                    mat,
                    "&e&l" + task.targetKey().replace("_", " "),
                    List.of(
                            "&7Action Type: &f" + task.actionType(),
                            "&7Base Payout: &a${config.economySymbol}" + String.format("%.2f", task.baseMoney()),
                            "&7Your Lv." + data.getLevel() + " Payout: &a&l${config.economySymbol}" + String.format("%.2f", scaledMoney),
                            "&7Job XP Reward: &b+" + String.format("%.1f XP", task.baseXp())
                    ),
                    false
            ));
        }

        inv.setItem(31, createItem(Material.ARROW, "&e&lBack to Professions", List.of("&7Return to the main /jobs menu."), false));
        player.openInventory(inv);
    }

    private String buildProgressBar(double current, double max) {
        int totalBars = 12;
        int filled = (int) Math.round(Math.min(1.0, current / Math.max(1.0, max)) * totalBars);
        return "&a" + "■".repeat(filled) + "&8" + "■".repeat(totalBars - filled);
    }

    private ItemStack createItem(Material material, String name, List<String> lore, boolean glow) {
        ItemStack item = new ItemStack(material);
        ItemMeta meta = item.getItemMeta();
        if (meta != null) {
            meta.setDisplayName(plugin.color(name));
            List<String> coloredLore = new ArrayList<>();
            for (String line : lore) {
                coloredLore.add(plugin.color(line));
            }
            meta.setLore(coloredLore);
            meta.addItemFlags(ItemFlag.HIDE_ATTRIBUTES, ItemFlag.HIDE_ENCHANTS);
            if (glow) {
                meta.addEnchant(Enchantment.UNBREAKING, 1, true);
            }
            item.setItemMeta(meta);
        }
        return item;
    }

    public record PrimeGuiHolder(String menuType, String jobId) implements InventoryHolder {
        @Override
        public Inventory getInventory() {
            return null;
        }
    }
}
`;

  const listenerJava = `package ${pkg}.listener;

import ${pkg}.PrimeJobsPlugin;
import ${pkg}.gui.JobsGuiManager.PrimeGuiHolder;
import ${pkg}.model.Job;
import ${pkg}.model.Job.TaskReward;
import ${pkg}.model.PlayerJobData;
import net.md_5.bungee.api.ChatMessageType;
import net.md_5.bungee.api.chat.TextComponent;
import org.bukkit.Bukkit;
import org.bukkit.Sound;
import org.bukkit.block.Block;
import org.bukkit.block.data.Ageable;
import org.bukkit.entity.Item;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.block.BlockBreakEvent;
import org.bukkit.event.entity.EntityDeathEvent;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.event.player.PlayerFishEvent;

import java.util.Map;

public class JobTaskListener implements Listener {

    private final PrimeJobsPlugin plugin;

    public JobTaskListener(PrimeJobsPlugin plugin) {
        this.plugin = plugin;
    }

    @EventHandler
    public void onGuiClick(InventoryClickEvent event) {
        if (!(event.getInventory().getHolder() instanceof PrimeGuiHolder holder)) return;
        event.setCancelled(true);
        if (!(event.getWhoClicked() instanceof Player player)) return;

        int rawSlot = event.getRawSlot();
        if ("TASKS".equals(holder.menuType())) {
            if (rawSlot == 31) {
                plugin.getGuiManager().openMainGui(player);
            }
            return;
        }

        int closeSlot = plugin.getConfig().getInt("gui.close-slot", 49);
        if (rawSlot == closeSlot) {
            player.closeInventory();
            return;
        }

        for (Job job : plugin.getJobs().values()) {
            if (job.getSlot() == rawSlot) {
                if (event.isRightClick()) {
                    plugin.getGuiManager().openJobTaskSubGui(player, job);
                    return;
                }

                Map<String, PlayerJobData> dataMap = plugin.getPlayerJobs(player.getUniqueId());
                PlayerJobData data = dataMap.computeIfAbsent(job.getId(), k -> new PlayerJobData());

                if (data.isJoined()) {
                    data.setJoined(false);
                    player.sendMessage(plugin.color("&8[&a&l${config.pluginName}&8] &7You have left the " + job.getDisplayName() + " &7profession."));
                    player.playSound(player.getLocation(), Sound.UI_BUTTON_CLICK, 0.8f, 0.8f);
                } else {
                    int maxJobs = plugin.getConfig().getInt("settings.max-jobs-per-player", ${config.maxJobsPerPlayer});
                    if (plugin.getActiveJobCount(player.getUniqueId()) >= maxJobs) {
                        player.sendMessage(plugin.color("&8[&a&l${config.pluginName}&8] &cYou have reached the maximum of " + maxJobs + " active jobs!"));
                        player.playSound(player.getLocation(), Sound.ENTITY_VILLAGER_NO, 1.0f, 1.0f);
                        return;
                    }
                    data.setJoined(true);
                    player.sendMessage(plugin.color("&8[&a&l${config.pluginName}&8] &aYou joined the " + job.getDisplayName() + " &aprofession!"));
                    player.playSound(player.getLocation(), Sound.ENTITY_PLAYER_LEVELUP, 0.7f, 1.4f);
                }
                plugin.getGuiManager().openMainGui(player);
                break;
            }
        }
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onBlockBreak(BlockBreakEvent event) {
        Player player = event.getPlayer();
        Block block = event.getBlock();
        String key = block.getType().name();

        // Check mature age for farm crops
        if (block.getBlockData() instanceof Ageable ageable) {
            if (ageable.getAge() < ageable.getMaximumAge()) {
                return;
            }
        }

        rewardMatchingJobs(player, key);
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onEntityKill(EntityDeathEvent event) {
        Player killer = event.getEntity().getKiller();
        if (killer == null) return;
        String entityKey = event.getEntityType().name();
        rewardMatchingJobs(killer, entityKey);
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onPlayerFish(PlayerFishEvent event) {
        if (event.getState() != PlayerFishEvent.State.CAUGHT_FISH) return;
        if (!(event.getCaught() instanceof Item caughtItem)) return;
        String fishKey = caughtItem.getItemStack().getType().name();
        rewardMatchingJobs(event.getPlayer(), fishKey);
    }

    private void rewardMatchingJobs(Player player, String targetKey) {
        Map<String, PlayerJobData> playerJobs = plugin.getPlayerJobs(player.getUniqueId());

        for (Job job : plugin.getJobs().values()) {
            PlayerJobData data = playerJobs.get(job.getId());
            if (data == null || !data.isJoined()) continue;

            TaskReward reward = job.getTasks().get(targetKey);
            if (reward == null) continue;

            double money = job.calculateMoneyPayout(reward.baseMoney(), data.getLevel(), plugin.getGlobalBooster());
            double xp = reward.baseXp() * plugin.getGlobalBooster();

            plugin.getEconomy().depositPlayer(player, money);
            data.addEarned(money);
            data.setXp(data.getXp() + xp);

            // Check Level Up
            double reqXp = job.getRequiredXpForLevel(data.getLevel());
            if (data.getXp() >= reqXp && data.getLevel() < job.getMaxLevel()) {
                data.setXp(data.getXp() - reqXp);
                data.setLevel(data.getLevel() + 1);

                player.playSound(player.getLocation(), Sound.UI_TOAST_CHALLENGE_COMPLETE, 1.0f, 1.0f);
                if (plugin.getConfig().getBoolean("settings.level-up-broadcast", true)) {
                    Bukkit.broadcastMessage(plugin.color(
                            "&8[&a&l${config.pluginName}&8] &e" + player.getName() +
                            " &7reached &6Level " + data.getLevel() + " &7in " + job.getDisplayName() + "&7!"
                    ));
                }
            } else if (plugin.getConfig().getBoolean("settings.sound-on-earn", true)) {
                player.playSound(player.getLocation(), Sound.ENTITY_EXPERIENCE_ORB_PICKUP, 0.35f, 1.3f);
            }

            // Action Bar Feedback
            if (plugin.getConfig().getBoolean("settings.actionbar-notifications", true)) {
                String actionBar = plugin.color(
                        job.getDisplayName() + " &8| &a+${config.economySymbol}" + String.format("%.2f", money) +
                        " &8| &b+" + String.format("%.1f XP", xp) +
                        " &7(Lv." + data.getLevel() + ")"
                );
                player.spigot().sendMessage(ChatMessageType.ACTION_BAR, TextComponent.fromLegacyText(actionBar));
            }
        }
    }
}
`;

  const commandJava = `package ${pkg}.command;

import ${pkg}.PrimeJobsPlugin;
import ${pkg}.model.Job;
import ${pkg}.model.PlayerJobData;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.command.TabCompleter;
import org.bukkit.entity.Player;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class JobsCommand implements CommandExecutor, TabCompleter {

    private final PrimeJobsPlugin plugin;

    public JobsCommand(PrimeJobsPlugin plugin) {
        this.plugin = plugin;
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (args.length == 0) {
            if (!(sender instanceof Player player)) {
                sender.sendMessage("Only in-game players can open the PrimeJobs Chest GUI.");
                return true;
            }
            plugin.getGuiManager().openMainGui(player);
            return true;
        }

        String sub = args[0].toLowerCase(Locale.ROOT);
        switch (sub) {
            case "reload" -> {
                if (!sender.hasPermission("primejobs.admin")) {
                    sender.sendMessage(plugin.color("&cYou do not have permission to execute this command."));
                    return true;
                }
                plugin.loadJobsFromConfig();
                sender.sendMessage(plugin.color("&8[&a&l${config.pluginName}&8] &aConfiguration and 5 jobs reloaded successfully."));
            }
            case "boost" -> {
                if (!sender.hasPermission("primejobs.admin") || args.length < 2) {
                    sender.sendMessage(plugin.color("&cUsage: /jobs boost <multiplier>"));
                    return true;
                }
                try {
                    double mult = Double.parseDouble(args[1]);
                    plugin.setGlobalBooster(mult);
                    sender.sendMessage(plugin.color("&8[&a&l${config.pluginName}&8] &eGlobal job payout booster set to &a" + mult + "x&e!"));
                } catch (NumberFormatException ex) {
                    sender.sendMessage(plugin.color("&cInvalid multiplier number."));
                }
            }
            case "join", "leave" -> {
                if (!(sender instanceof Player player) || args.length < 2) {
                    sender.sendMessage(plugin.color("&cUsage: /jobs " + sub + " <jobName>"));
                    return true;
                }
                Job job = plugin.getJobs().get(args[1].toLowerCase(Locale.ROOT));
                if (job == null) {
                    player.sendMessage(plugin.color("&cUnknown profession. Available: " + String.join(", ", plugin.getJobs().keySet())));
                    return true;
                }
                PlayerJobData data = plugin.getPlayerJobs(player.getUniqueId()).computeIfAbsent(job.getId(), k -> new PlayerJobData());
                boolean joining = "join".equals(sub);
                data.setJoined(joining);
                player.sendMessage(plugin.color("&8[&a&l${config.pluginName}&8] &7You have " + (joining ? "&ajoined" : "&cleft") + " &7" + job.getDisplayName()));
            }
            case "stats" -> {
                if (!(sender instanceof Player player)) return true;
                player.sendMessage(plugin.color("&8&m----------------------------------------"));
                player.sendMessage(plugin.color("&a&l${config.pluginName} &7— &fYour Profession Progress"));
                Map<String, PlayerJobData> map = plugin.getPlayerJobs(player.getUniqueId());
                for (Job job : plugin.getJobs().values()) {
                    PlayerJobData d = map.computeIfAbsent(job.getId(), k -> new PlayerJobData());
                    player.sendMessage(plugin.color(
                            " &8• " + job.getDisplayName() + " &7Lv." + d.getLevel() +
                            " &8| &a${config.economySymbol}" + String.format("%.2f", d.getTotalEarned()) +
                            " &8| " + (d.isJoined() ? "&aEmployed" : "&7Idle")
                    ));
                }
                player.sendMessage(plugin.color("&8&m----------------------------------------"));
            }
            default -> {
                if (sender instanceof Player player) {
                    plugin.getGuiManager().openMainGui(player);
                }
            }
        }
        return true;
    }

    @Override
    public List<String> onTabComplete(CommandSender sender, Command command, String alias, String[] args) {
        if (args.length == 1) {
            return List.of("join", "leave", "stats", "boost", "reload");
        }
        if (args.length == 2 && ("join".equalsIgnoreCase(args[0]) || "leave".equalsIgnoreCase(args[0]))) {
            return new ArrayList<>(plugin.getJobs().keySet());
        }
        return List.of();
    }
}
`;

  return [
    {
      path: 'src/main/resources/config.yml',
      filename: 'config.yml',
      language: 'yaml',
      description: 'Complete server configuration for the 5 professions, GUI layout, and Vault payouts.',
      content: configYml,
    },
    {
      path: `src/main/java/${pkgPath}/PrimeJobsPlugin.java`,
      filename: 'PrimeJobsPlugin.java',
      language: 'java',
      description: 'Main JavaPlugin class with Vault economy registration and YAML config loader.',
      content: mainJava,
    },
    {
      path: `src/main/java/${pkgPath}/gui/JobsGuiManager.java`,
      filename: 'JobsGuiManager.java',
      language: 'java',
      description: '54-slot Chest GUI & Task Sub-GUI builder with live progress bars and enchantment glow.',
      content: guiManagerJava,
    },
    {
      path: `src/main/java/${pkgPath}/listener/JobTaskListener.java`,
      filename: 'JobTaskListener.java',
      language: 'java',
      description: 'Event listeners for mining, logging, crop harvesting, mob hunting, fishing, and GUI clicks.',
      content: listenerJava,
    },
    {
      path: `src/main/java/${pkgPath}/command/JobsCommand.java`,
      filename: 'JobsCommand.java',
      language: 'java',
      description: '/jobs command executor and tab completer supporting join, leave, stats, boost, and reload.',
      content: commandJava,
    },
    {
      path: `src/main/java/${pkgPath}/model/Job.java`,
      filename: 'Job.java',
      language: 'java',
      description: 'Immutable job definition model with level XP curve and Vault income scaling math.',
      content: jobModelJava,
    },
    {
      path: `src/main/java/${pkgPath}/model/PlayerJobData.java`,
      filename: 'PlayerJobData.java',
      language: 'java',
      description: 'Player profession state tracking joined status, current level, XP, and lifetime earnings.',
      content: playerJobDataJava,
    },
    {
      path: 'src/main/resources/plugin.yml',
      filename: 'plugin.yml',
      language: 'yaml',
      description: 'Bukkit/Paper plugin manifest registering Vault dependency, /jobs command, and permissions.',
      content: pluginYml,
    },
    {
      path: 'pom.xml',
      filename: 'pom.xml',
      language: 'xml',
      description: 'Maven project descriptor configured for PaperMC API and VaultAPI.',
      content: pomXml,
    },
  ];
}

// Pure TypeScript ZIP builder (Store mode with CRC32) for instant, dependency-free .zip project export
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function downloadMavenProjectZip(config: PluginConfig) {
  const files = generatePluginFiles(config);
  const encoder = new TextEncoder();
  const rootFolder = `${config.pluginName}-${config.version}`;

  const readmeContent = `# ${config.pluginName} v${config.version} (Spigot / Paper ${config.apiVersion}+)

Generated with PrimeJobs Studio.

## Features
- **5 Complete Server Jobs**: ${config.jobs.map((j) => j.name).join(', ')}
- **Interactive 54-Slot Chest GUI**: \`/jobs\` with live XP progress bars, income bonus multipliers, and task inspection sub-menus.
- **Vault Economy Integration**: Instant payouts with Action Bar notifications and level-up broadcasts.

## How to Compile (Maven)
1. Ensure Java 21+ and Maven are installed.
2. Run:
   \`\`\`bash
   mvn clean package
   \`\`\`
3. Copy \`target/${config.pluginName}-${config.version}.jar\` into your Minecraft server's \`plugins/\` folder alongside **Vault** and an economy provider (e.g. EssentialsX).
`;

  const allEntries = [
    ...files.map((f) => ({
      name: `${rootFolder}/${f.path}`,
      data: encoder.encode(f.content),
    })),
    {
      name: `${rootFolder}/README.md`,
      data: encoder.encode(readmeContent),
    },
  ];

  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of allEntries) {
    const nameBytes = encoder.encode(entry.name);
    const dataBytes = entry.data;
    const crc = crc32(dataBytes);

    // Local file header (30 bytes + name)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true); // signature
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0, true); // flags
    lv.setUint16(8, 0, true); // compression (0 = store)
    lv.setUint16(10, 0, true); // mod time
    lv.setUint16(12, 0, true); // mod date
    lv.setUint32(14, crc, true); // crc32
    lv.setUint32(18, dataBytes.length, true); // compressed size
    lv.setUint32(22, dataBytes.length, true); // uncompressed size
    lv.setUint16(26, nameBytes.length, true); // file name length
    lv.setUint16(28, 0, true); // extra field length
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, dataBytes);

    // Central directory header (46 bytes + name)
    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, dataBytes.length, true);
    cv.setUint32(24, dataBytes.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    centralParts.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  }

  const centralSize = centralParts.reduce((acc, arr) => acc + arr.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, allEntries.length, true);
  ev.setUint16(10, allEntries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const blob = new Blob([...localParts, ...centralParts, eocd], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${config.pluginName}-${config.version}-Maven.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
