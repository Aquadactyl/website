"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  Archive,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowUpRight,
  Check,
  ChevronsRight,
  ChevronRight,
  Clock,
  Cpu,
  ExternalLink,
  File,
  Folder,
  HardDrive,
  LogOut,
  MemoryStick,
  Search,
  Send,
  Server,
  Settings,
  UserRound,
  Wifi,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const tabs = [
  "Console",
  "Files",
  "Databases",
  "Schedules",
  "Users",
  "Backups",
  "Network",
  "Startup",
  "Settings",
  "Activity",
] as const;
type Tab = (typeof tabs)[number];
type Status = "Running" | "Offline" | "Starting";
type Line = { text: string; tone?: "green" | "muted" | "yellow" };
type SampleTab = Exclude<Tab, "Console" | "Files" | "Backups" | "Settings">;

const demoAddress = "play.example.com:25565";
const initialLogs: Line[] = [
  "Loading properties",
  "This server is running Paper version 26.3 (Implementing API version 26.3)",
  "[spark] This server bundles the spark profiler. For more information please visit https://docs.papermc.io/paper/profiling",
  "Server Ping Player Sample Count: 12",
  "Using 4 threads for Netty based IO",
  "[MoonriseCommon] Paper is using 7 worker threads, 1 I/O threads",
  "Default game type: SURVIVAL",
  "Generating keypair",
  "Starting Minecraft server on 0.0.0.0:25565",
  "Paper: Using libdeflate (Linux x86_64) compression from Velocity.",
  "Paper: Using OpenSSL 3.x.x (Linux x86_64) cipher from Velocity.",
  'Preparing level "world"',
  "Selecting global spawn point for level 'minecraft:overworld'...",
  "Selecting global spawn point for level 'minecraft:the_nether'...",
  "Selecting global spawn point for level 'minecraft:the_end'...",
  "Loading 0 persistent chunks for level 'minecraft:overworld'...",
  "Preparing spawn area: 100%",
  "Prepared spawn area in 1790 ms",
  "Loading 0 persistent chunks for level 'minecraft:the_nether'...",
  "Preparing spawn area: 100%",
  "Prepared spawn area in 324 ms",
  "Loading 0 persistent chunks for level 'minecraft:the_end'...",
  "Preparing spawn area: 100%",
  "Prepared spawn area in 86 ms",
  'Done preparing level "world" (2.035s)',
  "[spark] Starting background profiler...",
  "Saving chunks for level 'ServerLevel[world]'/minecraft:overworld",
  "Saving chunks for level 'ServerLevel[world]'/minecraft:the_nether",
  "Saving chunks for level 'ServerLevel[world]'/minecraft:the_end",
  "Running delayed init tasks",
  'Done (7.142s)! For help, type "help"',
  "************************************************************************",
  "This is the first time you're starting this server.",
  "It's recommended you read our 'Getting Started' documentation for guidance.",
  "View this and more helpful information here: https://docs.papermc.io/paper/next-steps",
  "************************************************************************",
].map((text, index) => ({
  text: `[15:26:${index < 15 ? "17" : index < 29 ? "19" : "20"} INFO]: ${text}`,
}));

const sampleViews: Record<
  SampleTab,
  { description: string; rows: [string, string][] }
> = {
  Databases: {
    description: "Databases connected to this sample server.",
    rows: [["community", "MySQL · db.example.com:3306"]],
  },
  Schedules: {
    description: "Automate routine server tasks.",
    rows: [["Daily world backup", "Every day at 03:00 · Active"]],
  },
  Users: {
    description: "People with access to this sample server.",
    rows: [["repgraphics", "Owner · Full access"]],
  },
  Network: {
    description: "Addresses allocated to this sample server.",
    rows: [[demoAddress, "Primary allocation"]],
  },
  Startup: {
    description: "The command and runtime used to start the server.",
    rows: [
      ["Startup command", "java -Xms128M -Xmx4096M -jar paper.jar"],
      ["Docker image", "ghcr.io/pterodactyl/yolks:java_21"],
      ["Server JAR file", "paper.jar"],
    ],
  },
  Activity: {
    description: "Recent activity on this sample server.",
    rows: [
      ["Server started", "repgraphics · Today at 15:26"],
      ["Backup completed", "Daily world backup · Today at 03:00"],
    ],
  },
};

function ResourceCard({
  icon: Icon,
  label,
  value,
  unlimited = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  unlimited?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-md border border-[#2c353d] bg-[#1c2329] px-2.5 py-2 @[700px]/panel:gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#252d34] text-[#c5cbd1]">
        <Icon size={13} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] leading-4 font-medium text-[#bdc7d2]">
          {label}
        </p>
        <p className="text-[11px] leading-4 font-semibold text-[#e5e9ed] @[700px]/panel:text-xs">
          {value}
          {unlimited && (
            <span className="ml-1 text-[9px] font-normal text-[#8b9aa8]">
              / ∞
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

function ResourceChart({
  title,
  labels,
  variant,
  offline,
}: {
  title: string;
  labels: [string, string, string];
  variant: number;
  offline: boolean;
}) {
  const paths = [
    "0,99 195,99 197,18 202,10 210,5 221,6 240,3",
    "0,99 189,99 202,7 214,8 240,8",
    "0,99 204,99 209,98 217,99 240,99",
  ];
  const points = offline ? "0,99 240,99" : paths[variant];
  return (
    <div
      className="min-w-0 overflow-hidden rounded-md border border-[#2c353d] bg-[#1c2329] pt-3"
      role="img"
      aria-label={`${title} sample chart${offline ? ": server offline" : ""}`}
    >
      <div className="flex items-center justify-between px-3">
        <h3 className="text-[11px] font-medium text-[#bdc7d2]">{title}</h3>
        {title === "Network" && (
          <span
            className="hidden gap-1.5 @[400px]/panel:flex"
            aria-hidden="true"
          >
            <ArrowDownToLine size={11} className="text-[#f6c916]" />
            <ArrowUpFromLine size={11} className="text-[#47b7af]" />
          </span>
        )}
      </div>
      <div className="relative mt-3 h-20 @[400px]/panel:h-27 @[700px]/panel:h-32">
        <svg
          className="absolute inset-0 size-full"
          viewBox="0 0 240 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            className="fill-none stroke-[#303a42] stroke-[0.5]"
            d="M0 1H240 M0 50H240 M0 99H240"
          />
          <polygon
            className="fill-[#47b7af]/15"
            points={`0,100 ${points} 240,100`}
          />
          <polyline
            className="fill-none stroke-[#47b7af] stroke-[2]"
            points={points}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className="absolute inset-y-0 left-2 flex flex-col justify-between pb-1 text-[8px] text-[#b8c0c8]">
          {labels.map((label, index) => (
            <span key={index}>{label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PanelPreview() {
  const [tab, setTab] = useState<Tab>("Console");
  const [status, setStatus] = useState<Status>("Running");
  const [logs, setLogs] = useState<Line[]>(initialLogs);
  const [command, setCommand] = useState("");
  const [serverName, setServerName] = useState("Paper Server");
  const [draftName, setDraftName] = useState(serverName);
  const [saved, setSaved] = useState(false);
  const [folder, setFolder] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [backups, setBackups] = useState(["world-backup-2026-10-07"]);
  const [creating, setCreating] = useState(false);
  const [uptime, setUptime] = useState(7525);
  const [addressCopied, setAddressCopied] = useState(false);
  const [notice, setNotice] = useState("");
  const terminalRef = useRef<HTMLDivElement>(null);
  const powerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clipboardTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status !== "Running") return;
    const timer = window.setInterval(() => setUptime((time) => time + 1), 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(() => {
    return () => {
      if (powerTimer.current) clearTimeout(powerTimer.current);
      if (backupTimer.current) clearTimeout(backupTimer.current);
      if (clipboardTimer.current) clearTimeout(clipboardTimer.current);
    };
  }, []);

  useEffect(() => {
    if (terminalRef.current)
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [logs, tab]);

  function addLine(text: string, tone: Line["tone"] = "muted") {
    setLogs((previous) => [...previous.slice(-99), { text, tone }]);
  }

  function power(action: "start" | "stop" | "restart") {
    if (powerTimer.current) clearTimeout(powerTimer.current);
    setTab("Console");
    setUptime(0);
    if (action === "stop") {
      setStatus("Offline");
      addLine("[Server thread/INFO]: Saving worlds and stopping the server.");
      addLine("container@aquadactyl~ Server marked as offline...");
      return;
    }
    setStatus("Starting");
    addLine(
      `container@aquadactyl~ ${action === "restart" ? "Restarting" : "Starting"} server...`,
    );
    powerTimer.current = setTimeout(() => {
      setStatus("Running");
      addLine(
        '[Server thread/INFO]: Done (7.142s)! For help, type "help"',
        "green",
      );
      addLine("container@aquadactyl~ Server marked as running...");
    }, 1400);
  }

  function sendCommand(event: FormEvent) {
    event.preventDefault();
    const input = command.trim();
    if (!input || status !== "Running") return;
    addLine(`> ${input}`);
    switch (input.toLowerCase()) {
      case "help":
        addLine(
          "Demo commands: help, list, status, say <message>, clear, stop",
          "green",
        );
        break;
      case "list":
        addLine("There are 1 of a max of 20 players online: Rep", "green");
        break;
      case "status":
        addLine("Paper 26.3 · Running · CPU 1.75% · Memory 1.46 GiB", "green");
        break;
      case "clear":
        setLogs([]);
        break;
      case "stop":
        power("stop");
        break;
      default:
        addLine(
          input.toLowerCase().startsWith("say ")
            ? `[Server]: ${input.slice(4)}`
            : "Unknown demo command. Type help to see available commands.",
          "yellow",
        );
    }
    setCommand("");
  }

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(demoAddress);
      setNotice("");
      setAddressCopied(true);
      if (clipboardTimer.current) clearTimeout(clipboardTimer.current);
      clipboardTimer.current = setTimeout(() => setAddressCopied(false), 2000);
    } catch {
      setNotice(`Demo address: ${demoAddress}`);
    }
  }

  function createBackup() {
    setCreating(true);
    backupTimer.current = setTimeout(() => {
      setBackups((items) => [...items, `manual-backup-${items.length}`]);
      setCreating(false);
    }, 1000);
  }

  const running = status === "Running";
  const formattedUptime = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`;
  const sampleView = tab in sampleViews ? sampleViews[tab as SampleTab] : null;

  return (
    <div id="panel-preview" className="@container/panel w-full scroll-mt-27.5">
      <div className="mb-3 flex items-center justify-between gap-2 text-[10px] text-[#8c9aa7] @[560px]/panel:text-[11px]">
        <span className="font-medium text-[#bbc5ce]">Try the panel</span>
        <span>Interactive demo · sample data</span>
      </div>
      <section
        className="overflow-hidden rounded-lg border border-[#303a42] bg-[#171c21] text-[#e5e9ed] [&_button]:cursor-pointer [&_button]:transition-colors [&_button:disabled]:cursor-not-allowed [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-[-2px] [&_button:focus-visible]:outline-[#78d4cc] [&_input:focus-visible]:outline-2 [&_input:focus-visible]:outline-[#78d4cc] [&_svg]:shrink-0"
        aria-label="Interactive Aquadactyl panel demo"
      >
        <div className="flex h-12 items-center justify-between gap-3 border-b border-[#252d34] bg-[#10151a] px-3.5 @[560px]/panel:px-5">
          <img
            src="/brand/aquadactyl-wordmark.png"
            alt="Aquadactyl"
            className="w-28 shrink-0 @[700px]/panel:w-32"
          />
          <div className="flex items-center gap-3 text-[9px] text-[#8997a4] @[700px]/panel:gap-4">
            <span className="hidden items-center gap-1.5 @[560px]/panel:flex">
              <Server size={12} /> Servers
            </span>
            <span className="hidden items-center gap-1.5 @[560px]/panel:flex">
              <Settings size={12} /> Admin <ArrowUpRight size={9} />
            </span>
            <span className="hidden items-center gap-1.5 @[700px]/panel:flex">
              <Search size={12} /> Search
            </span>
            <span className="flex items-center gap-1.5">
              <span className="flex size-4.5 items-center justify-center rounded-full bg-[#557588] text-[#c9e9e1]">
                <UserRound size={11} />
              </span>
              <span className="hidden @[560px]/panel:inline">Account</span>
            </span>
            <span className="border-l border-[#2c353d] pl-2.5">
              repgraphics
            </span>
            <LogOut size={12} aria-hidden="true" />
          </div>
        </div>
        <div
          className="flex [scrollbar-width:none] overflow-x-auto border-b border-[#252d34] bg-[#10151a] px-2 @[560px]/panel:px-3"
          role="tablist"
          aria-label="Demo server views"
        >
          {tabs.map((name, index) => (
            <button
              key={name}
              id={`tab-${name}`}
              type="button"
              role="tab"
              aria-selected={tab === name}
              aria-controls="preview-content"
              tabIndex={tab === name ? 0 : -1}
              onKeyDown={(event) => {
                let nextIndex: number;
                if (event.key === "ArrowRight")
                  nextIndex = (index + 1) % tabs.length;
                else if (event.key === "ArrowLeft")
                  nextIndex = (index + tabs.length - 1) % tabs.length;
                else if (event.key === "Home") nextIndex = 0;
                else if (event.key === "End") nextIndex = tabs.length - 1;
                else return;
                event.preventDefault();
                const next = tabs[nextIndex];
                setTab(next);
                document.getElementById(`tab-${next}`)?.focus();
              }}
              onClick={() => setTab(name)}
              className={`h-9 shrink-0 border-b-2 px-2 text-[10px] whitespace-nowrap @[700px]/panel:px-2.5 ${tab === name ? "border-[#78d4cc] text-[#78d4cc]" : "border-transparent text-[#8997a4] hover:text-[#e5e9ed]"}`}
            >
              {name}
            </button>
          ))}
          <span
            className="flex items-center px-2 text-[#8997a4]"
            aria-hidden="true"
          >
            <ExternalLink size={11} />
          </span>
        </div>
        <div className="px-3.5 pt-6 @[560px]/panel:px-5">
          <div className="mb-3 grid items-center gap-3 @[560px]/panel:grid-cols-[minmax(0,1fr)_minmax(156px,0.32fr)] @[560px]/panel:gap-2.5">
            <div className="min-w-0">
              <h2 className="text-lg leading-6 font-medium wrap-break-word">
                {serverName}
              </h2>
              <p className="mt-1 text-[8px] text-[#8997a4]">
                568e7626-30a2-4bd5-81cc-56610beecbe4
              </p>
              <span className="sr-only" role="status">
                {status}
              </span>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => power("start")}
                disabled={status !== "Offline"}
                className="h-10 flex-1 rounded-[5px] border border-[#237b7e] bg-[#237b7e] text-[11px] font-semibold text-white hover:enabled:bg-[#2b9294] disabled:opacity-60 @[560px]/panel:h-8"
                aria-label="Start demo server"
              >
                Start
              </button>
              <button
                type="button"
                onClick={() => power("restart")}
                disabled={status === "Starting"}
                className="h-10 flex-1 rounded-[5px] border border-[#505c66] bg-[#252d34] text-[11px] font-semibold hover:enabled:bg-[#34404a] disabled:opacity-50 @[560px]/panel:h-8"
                aria-label="Restart demo server"
              >
                Restart
              </button>
              <button
                type="button"
                onClick={() => power("stop")}
                disabled={status === "Offline"}
                className="h-10 flex-1 rounded-[5px] border border-[#e21e26] bg-[#e21e26] text-[11px] font-semibold text-white hover:enabled:bg-[#f33038] disabled:opacity-50 @[560px]/panel:h-8"
                aria-label="Stop demo server"
              >
                Stop
              </button>
            </div>
          </div>
          <div
            id="preview-content"
            role="tabpanel"
            aria-labelledby={`tab-${tab}`}
            tabIndex={0}
          >
            {tab === "Console" && (
              <>
                <div className="grid gap-2.5 @[560px]/panel:h-[405px] @[560px]/panel:grid-cols-[minmax(0,1fr)_minmax(156px,0.32fr)]">
                  <div className="flex h-90 min-w-0 flex-col overflow-hidden rounded-md border border-[#2c353d] bg-[#0b1014] @[560px]/panel:h-full">
                    <div
                      ref={terminalRef}
                      className="min-h-0 flex-1 [scrollbar-width:thin] [scrollbar-color:#3b4854_transparent] overflow-auto p-2"
                      aria-label="Demo server output"
                    >
                      {logs.map((line, index) => (
                        <div
                          key={index}
                          className={`font-(family-name:--font-jetbrains-mono) text-[9px] leading-[1.5] wrap-anywhere whitespace-pre-wrap @[560px]/panel:text-[7px] @[560px]/panel:leading-[1.35] ${line.tone === "green" ? "text-[#a6d5b7]" : line.tone === "yellow" ? "text-[#e8c38b]" : line.tone === "muted" ? "text-[#8997a4]" : "text-[#c7cdd2]"}`}
                        >
                          {line.text}
                        </div>
                      ))}
                      {status === "Starting" && (
                        <div className="font-mono text-[9px] text-[#a6d5b7]">
                          Starting…
                        </div>
                      )}
                    </div>
                    <form
                      className="flex h-9 shrink-0 items-center gap-2 border-t border-[#252d34] bg-[#10151a] px-2.5 focus-within:border-[#78d4cc]"
                      onSubmit={sendCommand}
                    >
                      <ChevronsRight size={13} className="text-[#c7cdd2]" />
                      <input
                        aria-label="Demo console command"
                        placeholder={
                          running
                            ? "Type a command..."
                            : "Start the server to send commands"
                        }
                        value={command}
                        onChange={(event) => setCommand(event.target.value)}
                        disabled={!running}
                        autoComplete="off"
                        spellCheck={false}
                        className="min-w-0 flex-1 border-0 bg-transparent font-(family-name:--font-jetbrains-mono) text-[10px] text-[#e5e9ed] outline-none placeholder:text-[#8997a4]"
                      />
                      <button
                        type="submit"
                        disabled={!running || !command.trim()}
                        aria-label="Send demo command"
                        className="p-1.5 text-[#78d4cc] disabled:opacity-30"
                      >
                        <Send size={11} />
                      </button>
                    </form>
                  </div>
                  <div className="grid grid-cols-2 gap-2 @[560px]/panel:grid-cols-1 @[560px]/panel:grid-rows-7">
                    <button
                      type="button"
                      onClick={copyAddress}
                      aria-label="Copy demo server address"
                      className="col-span-2 flex min-w-0 items-center gap-2 rounded-md border border-[#2c353d] bg-[#1c2329] px-2.5 py-2 text-left hover:bg-[#252d34] @[560px]/panel:col-span-1 @[700px]/panel:gap-3"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#252d34] text-[#c5cbd1]">
                        {addressCopied ? (
                          <Check size={13} />
                        ) : (
                          <Wifi size={13} />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[10px] leading-4 font-medium text-[#bdc7d2]">
                          Address
                        </span>
                        <span
                          className="block truncate text-[10px] leading-4 font-semibold"
                          role="status"
                        >
                          {addressCopied ? "Address copied" : demoAddress}
                        </span>
                      </span>
                    </button>
                    <ResourceCard
                      icon={Clock}
                      label="Uptime"
                      value={running ? formattedUptime : status}
                    />
                    <ResourceCard
                      icon={Cpu}
                      label="CPU Load"
                      value={running ? "1.75%" : "0.00%"}
                      unlimited
                    />
                    <ResourceCard
                      icon={MemoryStick}
                      label="Memory"
                      value={running ? "1.46 GiB" : "0 MiB"}
                      unlimited
                    />
                    <ResourceCard
                      icon={HardDrive}
                      label="Disk"
                      value="220.18 MiB"
                      unlimited
                    />
                    <ResourceCard
                      icon={ArrowDownToLine}
                      label="Network (Inbound)"
                      value={running ? "172.13 KiB" : "0 Bytes"}
                    />
                    <ResourceCard
                      icon={ArrowUpFromLine}
                      label="Network (Outbound)"
                      value={running ? "50.09 KiB" : "0 Bytes"}
                    />
                  </div>
                </div>
                <div className="mt-2.5 grid grid-cols-3 gap-2.5">
                  <ResourceChart
                    title="CPU Load"
                    labels={["1.80%", "0.90%", "0.00%"]}
                    variant={0}
                    offline={!running}
                  />
                  <ResourceChart
                    title="Memory"
                    labels={["1600MiB", "800MiB", "0MiB"]}
                    variant={1}
                    offline={!running}
                  />
                  <ResourceChart
                    title="Network"
                    labels={["1 Bytes", "0 Bytes", "0 Bytes"]}
                    variant={2}
                    offline={!running}
                  />
                </div>
              </>
            )}
            {tab === "Files" && (
              <div className="min-h-98 rounded-md border border-[#2c353d] bg-[#1c2329] p-4">
                <div className="mb-4.5 flex items-center justify-between gap-2.5">
                  <h3 className="text-lg font-medium text-[#e9edf0]">
                    File manager
                  </h3>
                  <span className="text-[10px] text-[#8c9aa7]">DEMO FILES</span>
                </div>
                <button
                  className="flex w-full cursor-pointer items-center gap-2 rounded-[5px] border border-[#3b4854] bg-[#151c23] p-3 text-left font-mono text-[11px] text-[#bbc5ce]"
                  type="button"
                  onClick={() => {
                    setFolder("");
                    setFilePreview(null);
                  }}
                >
                  <Folder size={12} /> /home/container{folder && `/${folder}`}{" "}
                  <ChevronRight size={12} className="ml-auto" />
                </button>
                {filePreview ? (
                  <>
                    <div className="my-4.25 flex items-center gap-1.75 text-xs text-[#bbc5ce]">
                      <File size={12} />
                      {filePreview}
                      <button
                        type="button"
                        className="ml-auto cursor-pointer border-0 bg-transparent py-1.75 text-[11px] text-[#a4e3dc]"
                        onClick={() => setFilePreview(null)}
                      >
                        Back to files
                      </button>
                    </div>
                    <pre className="rounded border border-[#303b45] bg-[#0d1217] p-3.75 font-mono text-[11px] leading-[1.9] whitespace-pre-wrap text-[#d7dce1]">
                      {filePreview === "server.properties"
                        ? "# Minecraft server properties\nserver-port=25565\nmax-players=20\nmotd=An Aquadactyl community server\nonline-mode=true\ndifficulty=normal"
                        : "# Demo file preview\n# Your real panel supports viewing and editing files.\n# This preview uses sample data."}
                    </pre>
                  </>
                ) : (
                  <div className="mt-2">
                    {(folder
                      ? [
                          {
                            name:
                              folder === "plugins" ? "README.txt" : "level.dat",
                            directory: false,
                            size: "2.4 KiB",
                          },
                        ]
                      : [
                          {
                            name: "plugins",
                            directory: true,
                            size: "Directory",
                          },
                          {
                            name: "world",
                            directory: true,
                            size: "Directory",
                          },
                          {
                            name: "server.properties",
                            directory: false,
                            size: "1.2 KiB",
                          },
                          {
                            name: "paper.jar",
                            directory: false,
                            size: "48.6 MiB",
                          },
                          {
                            name: "eula.txt",
                            directory: false,
                            size: "162 B",
                          },
                        ]
                    ).map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() =>
                          item.directory
                            ? setFolder(item.name)
                            : setFilePreview(item.name)
                        }
                        className="flex w-full cursor-pointer items-center gap-2 border-0 border-b border-[#303b45] bg-transparent p-3 text-left text-xs text-[#e9edf0] transition-colors hover:bg-[#26313b] sm:gap-2.5 sm:p-3.5"
                      >
                        {item.directory ? (
                          <Folder size={15} />
                        ) : (
                          <File size={15} />
                        )}
                        <span>{item.name}</span>
                        <small className="ml-auto text-[9px] text-[#8c9aa7] sm:text-[10px]">
                          {item.size}
                        </small>
                        <ChevronRight size={12} className="hidden sm:inline" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {tab === "Backups" && (
              <div className="min-h-98 rounded-md border border-[#2c353d] bg-[#1c2329] p-4">
                <div className="mb-4.5 flex items-center justify-between gap-2.5">
                  <h3 className="text-lg font-medium text-[#e9edf0]">
                    Backups
                  </h3>
                  <button
                    type="button"
                    className="min-h-9.5 cursor-pointer rounded-[5px] border border-[#2b7c80] bg-[#20696d] px-3.5 py-2 text-xs font-medium text-[#effcfa] hover:bg-[#237c7f] disabled:opacity-60"
                    disabled={creating}
                    onClick={createBackup}
                  >
                    {creating ? "Creating…" : "Create backup"}
                  </button>
                </div>
                <p className="text-[13px] leading-[1.8] text-[#a0abb6]">
                  Keep a copy before changing your server.
                </p>
                {backups.map((name) => (
                  <div
                    className="flex items-center gap-3 border-b border-[#303b45] py-4 text-[#a4e3dc]"
                    key={name}
                  >
                    <Archive size={18} />
                    <div className="flex min-w-0 flex-col gap-1.5">
                      <strong className="text-xs font-medium wrap-break-word text-[#e9edf0]">
                        {name}
                      </strong>
                      <small className="text-[11px] text-[#8c9aa7]">
                        Sample backup · 124 MiB
                      </small>
                    </div>
                    <Check size={15} className="ml-auto" />
                  </div>
                ))}
                <p className="mt-4.25 text-[11px] leading-[1.8] text-[#8c9aa7]">
                  This preview creates sample backups in your browser.
                </p>
              </div>
            )}
            {tab === "Settings" && (
              <form
                className="min-h-98 rounded-md border border-[#2c353d] bg-[#1c2329] p-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (draftName.trim()) {
                    setServerName(draftName.trim());
                    setSaved(true);
                  }
                }}
              >
                <div className="mb-4.5 flex items-center justify-between gap-2.5">
                  <h3 className="text-lg font-medium text-[#e9edf0]">
                    Server settings
                  </h3>
                  <Settings size={15} className="text-[#a0abb6]" />
                </div>
                <label className="mb-5 flex flex-col gap-2 text-xs text-[#bbc5ce]">
                  Server name
                  <input
                    required
                    maxLength={40}
                    value={draftName}
                    onChange={(event) => {
                      setDraftName(event.target.value);
                      setSaved(false);
                    }}
                    className="min-w-0 rounded-[5px] border border-[#3b4854] bg-[#11161b] p-3 text-[13px] text-[#e9edf0] outline-none focus:border-[#78d4cc]"
                  />
                </label>
                <label className="mb-5 flex flex-col gap-2 text-xs text-[#bbc5ce]">
                  Description
                  <input
                    value="Community Minecraft server"
                    readOnly
                    className="min-w-0 rounded-[5px] border border-[#3b4854] bg-[#11161b] p-3 text-[13px] text-[#8c9aa7] outline-none"
                  />
                </label>
                <button
                  type="submit"
                  className="min-h-9.5 cursor-pointer rounded-[5px] border border-[#2b7c80] bg-[#20696d] px-3.5 py-2 text-xs font-medium text-[#effcfa] hover:bg-[#237c7f]"
                >
                  {saved ? "Changes saved" : "Save changes"}
                </button>
                <p className="mt-4.25 text-[11px] leading-[1.8] text-[#8c9aa7]">
                  Changes apply to this browser preview.
                </p>
              </form>
            )}
            {sampleView && (
              <div className="min-h-98 rounded-md border border-[#2c353d] bg-[#1c2329] p-4">
                <h3 className="mb-2 text-base font-medium">{tab}</h3>
                <p className="mb-4 text-xs leading-6 text-[#bdc7d2]">
                  {sampleView.description}
                </p>
                <dl>
                  {sampleView.rows.map(([label, value]) => (
                    <div key={label} className="border-b border-[#303a42] py-3">
                      <dt className="text-xs font-medium wrap-anywhere">
                        {label}
                      </dt>
                      <dd className="mt-1 text-[11px] leading-5 wrap-anywhere text-[#8997a4]">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-4 text-[11px] leading-6 text-[#8997a4]">
                  Sample data for the panel preview.
                </p>
              </div>
            )}
          </div>
          {notice && (
            <p className="mt-3 text-[11px] text-[#bdc7d2]" role="status">
              {notice}
            </p>
          )}
          <footer className="py-6 text-center text-[8px] leading-5 text-[#8997a4] @[560px]/panel:py-7">
            Aquadactyl · Based on Pterodactyl® · Blueprint © 2023 – 2026
          </footer>
        </div>
      </section>
    </div>
  );
}
