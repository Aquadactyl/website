"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  Activity,
  Archive,
  ArrowUpRight,
  Check,
  ChevronRight,
  Cpu,
  File,
  Folder,
  HardDrive,
  MemoryStick,
  Play,
  RotateCw,
  Send,
  Settings,
  Square,
  Terminal,
  UserRound,
} from "lucide-react";

type Tab = "Console" | "Files" | "Backups" | "Settings";
type Status = "Running" | "Offline" | "Starting";
type Line = { text: string; tone?: "green" | "muted" | "yellow" };

const initialLogs: Line[] = [
  { text: "container@aquadactyl~ Server marked as starting...", tone: "muted" },
  { text: "[18:42:01 INFO]: Starting minecraft server version 1.21.4" },
  { text: "[18:42:01 INFO]: Loading properties" },
  { text: "[18:42:02 INFO]: This server is running Paper" },
  { text: '[18:42:02 INFO]: Preparing level "world"' },
  {
    text: "[18:42:03 INFO]: Preparing start region for dimension minecraft:overworld",
  },
  {
    text: '[18:42:04 INFO]: Done (2.814s)! For help, type "help"',
    tone: "green",
  },
  { text: "container@aquadactyl~ Server marked as running...", tone: "muted" },
  { text: "[18:42:12 INFO]: Rep joined the game", tone: "yellow" },
];

const tabs: { name: Tab; icon: typeof Terminal }[] = [
  { name: "Console", icon: Terminal },
  { name: "Files", icon: Folder },
  { name: "Backups", icon: Archive },
  { name: "Settings", icon: Settings },
];

function Sparkline({
  variant = 0,
  offline = false,
}: {
  variant?: number;
  offline?: boolean;
}) {
  const paths = [
    "0,45 12,45 18,35 24,42 34,40 40,29 47,35 54,20 63,32 72,29 83,35 93,20 104,27 111,12 119,22 129,19 138,28 147,24 157,31 170,21 179,27 192,18 201,25 212,20 225,24 240,15",
    "0,41 14,40 23,37 35,38 49,32 59,33 72,28 82,30 95,25 108,26 121,22 136,22 147,19 160,22 173,19 185,20 198,17 214,18 225,16 240,17",
    "0,47 20,47 27,29 35,47 57,47 64,21 72,47 95,47 101,33 110,47 127,47 134,16 143,47 172,47 179,28 187,47 211,47 219,24 228,47 240,47",
  ];
  const points = offline ? "0,49 240,49" : paths[variant];
  return (
    <svg
      className="mt-2 block h-7 w-full sm:h-7.75"
      viewBox="0 0 240 60"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        className="fill-none stroke-[#52616f] stroke-[0.6] opacity-50"
        d="M0 15H240 M0 35H240 M0 55H240"
      />
      <polygon className="fill-[#78d4cc0e]" points={`0,60 ${points} 240,60`} />
      <polyline
        className="fill-none stroke-[#78d4cc] stroke-[1.5]"
        points={points}
      />
    </svg>
  );
}

export default function PanelPreview() {
  const [tab, setTab] = useState<Tab>("Console");
  const [status, setStatus] = useState<Status>("Running");
  const [logs, setLogs] = useState<Line[]>(initialLogs);
  const [command, setCommand] = useState("");
  const [serverName, setServerName] = useState("community-survival");
  const [draftName, setDraftName] = useState(serverName);
  const [saved, setSaved] = useState(false);
  const [folder, setFolder] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [backups, setBackups] = useState(["world-backup-2026-10-07"]);
  const [creating, setCreating] = useState(false);
  const [tick, setTick] = useState(0);
  const [addressCopied, setAddressCopied] = useState(false);
  const [notice, setNotice] = useState("");
  const terminalRef = useRef<HTMLDivElement>(null);
  const powerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((t) => t + 1), 3500);
    return () => {
      window.clearInterval(timer);
      if (powerTimer.current) clearTimeout(powerTimer.current);
      if (backupTimer.current) clearTimeout(backupTimer.current);
    };
  }, []);

  useEffect(() => {
    if (terminalRef.current)
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [logs, tab]);

  function addLine(text: string, tone: Line["tone"] = "muted") {
    setLogs((previous) => [...previous.slice(-39), { text, tone }]);
  }

  function power(action: "start" | "stop" | "restart") {
    if (powerTimer.current) clearTimeout(powerTimer.current);
    setTab("Console");
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
        '[Server thread/INFO]: Done (2.814s)! For help, type "help"',
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
        addLine(
          `Paper 1.21.4 • Running • CPU ${18 + (tick % 5)}% • Memory 1.24 GiB`,
          "green",
        );
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
      await navigator.clipboard.writeText("play.example.com:25565");
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2000);
    } catch {
      setNotice("Demo address: play.example.com:25565");
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

  return (
    <div id="panel-preview" className="w-full scroll-mt-27.5">
      <div className="mb-3 flex items-center justify-between gap-2.5 text-[10px] text-[#8c9aa7] sm:gap-3 sm:text-[11px]">
        <span className="font-medium text-[#bbc5ce]">Try the panel</span>
        <span>Interactive demo · sample data</span>
      </div>
      <div
        className="overflow-hidden rounded-[9px] border border-[#3b4854] bg-[#1b232b]"
        aria-label="Interactive Aquadactyl panel demo"
      >
        <div className="flex h-11.25 items-center justify-between border-b border-[#303b45] bg-[#151c23] px-3.5 sm:h-12 sm:px-5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#e9edf0] sm:gap-2 sm:text-xs">
            <img
              src="/brand/aquadactyl-emblem.png"
              alt=""
              className="h-5.25 w-5.25 object-contain sm:h-5.75 sm:w-5.75"
            />
            Aquadactyl<span className="font-normal text-[#8c9aa7]">/</span>
            <span className="text-[10px] font-normal text-[#8c9aa7] sm:text-[11px]">
              Servers
            </span>
          </div>
          <span className="flex items-center gap-1 text-[11px] text-[#bbc5ce]">
            <UserRound size={12} /> R
          </span>
        </div>
        <div className="flex min-w-0">
          <div className="w-full min-w-0 px-3.5 pt-4.5 sm:px-5 sm:pt-5.25">
            <div className="flex items-start justify-between gap-2 sm:items-center sm:gap-3.5">
              <div>
                <div className="flex items-center gap-1.5 text-[8px] font-medium tracking-wider text-[#8c9aa7] sm:text-[9px]">
                  SERVERS <ChevronRight size={9} /> MINECRAFT
                </div>
                <h2 className="mt-2 text-lg leading-[1.35] font-medium tracking-[-0.3px] wrap-break-word text-[#e9edf0] sm:mt-2.25 sm:text-[21px]">
                  {serverName}
                </h2>
                <p className="mt-1 text-[10px] leading-[1.6] text-[#a0abb6] sm:mt-1.5 sm:text-[11px]">
                  Paper 1.21.4 <span className="px-1">·</span> Community
                  Minecraft server
                </p>
              </div>
              <span
                className={`mt-6 flex items-center gap-1.5 rounded-[5px] border px-1.5 py-1 text-[9px] font-medium whitespace-nowrap sm:mt-0 sm:px-2 sm:py-1 sm:text-[10px] ${
                  status === "Running"
                    ? "border-[#365744] bg-[#20352a] text-[#a6d5b7]"
                    : status === "Offline"
                      ? "border-[#4b424e] bg-[#302d31] text-[#b6aeb7]"
                      : "border-[#635339] bg-[#342f24] text-[#e8c38b]"
                }`}
                role="status"
              >
                <span
                  className={`h-1.25 w-1.25 shrink-0 rounded-full ${
                    status === "Running"
                      ? "bg-[#a6d5b7]"
                      : status === "Offline"
                        ? "bg-[#b6aeb7]"
                        : "bg-[#e8c38b]"
                  }`}
                />
                {status}
              </span>
            </div>
            <div
              className="mt-3.75 mb-4 flex scrollbar-none gap-4.5 overflow-x-auto border-b border-[#3b4854] sm:mt-4.5 sm:gap-5.5"
              role="tablist"
              aria-label="Demo server views"
            >
              {tabs.map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  id={`tab-${name}`}
                  role="tab"
                  aria-selected={tab === name}
                  aria-controls="preview-content"
                  tabIndex={tab === name ? 0 : -1}
                  onKeyDown={(event) => {
                    if (
                      event.key === "ArrowRight" ||
                      event.key === "ArrowLeft"
                    ) {
                      event.preventDefault();
                      const index = tabs.findIndex((item) => item.name === tab);
                      const next =
                        tabs[
                          (index + (event.key === "ArrowRight" ? 1 : 3)) %
                            tabs.length
                        ].name;
                      setTab(next);
                      document.getElementById(`tab-${next}`)?.focus();
                    }
                  }}
                  onClick={() => setTab(name)}
                  className={`relative flex cursor-pointer items-center gap-1.5 border-0 bg-transparent px-0.5 py-1.5 pb-3 text-[11px] whitespace-nowrap transition-colors sm:py-1.75 sm:pb-3.25 sm:text-xs ${
                    tab === name
                      ? "text-[#a4e3dc] after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5 after:bg-[#78d4cc] after:content-['']"
                      : "text-[#a0abb6] hover:text-[#e9edf0]"
                  }`}
                >
                  <Icon className="h-3 w-3 sm:h-3 sm:w-3" size={12} />
                  {name}
                </button>
              ))}
            </div>
            <div
              id="preview-content"
              role="tabpanel"
              aria-labelledby={`tab-${tab}`}
            >
              {tab === "Console" && (
                <>
                  <div className="mb-2.5 flex items-center justify-between gap-2.5">
                    <span className="hidden items-center gap-1.5 text-[11px] text-[#a0abb6] sm:flex">
                      <Terminal size={12} /> Console
                    </span>
                    <div className="flex w-full gap-1.5 sm:w-auto">
                      <button
                        type="button"
                        onClick={() => power("start")}
                        disabled={status !== "Offline"}
                        className="flex min-h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[5px] border border-[#2b7c80] bg-[#20696d] px-2 py-1.5 text-[11px] text-[#effcfa] transition-colors hover:enabled:brightness-115 disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-8.25 sm:flex-initial sm:px-2.5"
                        aria-label="Start demo server"
                      >
                        <Play size={10} fill="currentColor" />
                        Start
                      </button>
                      <button
                        type="button"
                        onClick={() => power("restart")}
                        disabled={status === "Starting"}
                        className="flex min-h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[5px] border border-[#52616f] bg-[#26313b] px-2 py-1.5 text-[11px] text-[#e9edf0] transition-colors hover:enabled:brightness-115 disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-8.25 sm:flex-initial sm:px-2.5"
                        aria-label="Restart demo server"
                      >
                        <RotateCw size={10} />
                        Restart
                      </button>
                      <button
                        type="button"
                        onClick={() => power("stop")}
                        disabled={status === "Offline"}
                        className="flex min-h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[5px] border border-[#87515b] bg-[#61363e] px-2 py-1.5 text-[11px] text-[#fce3e7] transition-colors hover:enabled:brightness-115 disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-8.25 sm:flex-initial sm:px-2.5"
                        aria-label="Stop demo server"
                      >
                        <Square size={9} fill="currentColor" />
                        Stop
                      </button>
                    </div>
                  </div>
                  <div
                    className="h-52.5 scrollbar-thin [scrollbar-color:#52616f_transparent] overflow-auto rounded-t-md border border-[#303b45] bg-[#0d1217] p-2.5 min-[1051px]:h-47.5 sm:h-55 sm:p-3"
                    ref={terminalRef}
                    aria-label="Demo server output"
                  >
                    {logs.map((line, index) => (
                      <div
                        key={index}
                        className={`font-mono text-[10px] leading-[1.95] wrap-break-word whitespace-pre-wrap min-[1051px]:text-[10px] sm:text-[11px] ${
                          line.tone === "muted"
                            ? "text-[#8c9aa7]"
                            : line.tone === "green"
                              ? "text-[#a6d5b7]"
                              : line.tone === "yellow"
                                ? "text-[#e8c38b]"
                                : "text-[#d7dce1]"
                        }`}
                      >
                        {line.text}
                      </div>
                    ))}
                    {status === "Starting" && (
                      <div className="font-mono text-[10px] leading-[1.95] text-[#a6d5b7] min-[1051px]:text-[10px] sm:text-[11px]">
                        Starting
                        <span className="inline-block animate-[pulse_1s_infinite]">
                          _
                        </span>
                      </div>
                    )}
                  </div>
                  <form
                    className="flex h-11 items-center gap-1.5 rounded-b-md border border-t-0 border-[#303b45] bg-[#151c23] px-2 text-[#8c9aa7] focus-within:border-[#78d4cc] focus-within:[box-shadow:inset_0_-1px_#78d4cc] sm:h-10.25 sm:gap-1.75 sm:px-3"
                    onSubmit={sendCommand}
                  >
                    <ChevronRight size={13} />
                    <input
                      aria-label="Demo console command"
                      placeholder={
                        running
                          ? "Type a command… (try help)"
                          : "Start the server to send commands"
                      }
                      value={command}
                      onChange={(event) => setCommand(event.target.value)}
                      disabled={!running}
                      autoComplete="off"
                      spellCheck={false}
                      className="min-w-0 flex-1 border-0 bg-transparent p-0 font-mono text-[10px] text-[#e9edf0] outline-none placeholder:text-[#8c9aa7] sm:text-[11px]"
                    />
                    <button
                      type="submit"
                      disabled={!running || !command.trim()}
                      aria-label="Send demo command"
                      className="flex cursor-pointer items-center justify-center rounded-sm border-0 bg-transparent p-2 text-[#a4e3dc] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Send size={12} />
                    </button>
                  </form>
                  <div className="mt-3 grid grid-cols-3 gap-1.5 sm:mt-3.25 sm:gap-2.5">
                    <div className="min-w-0 overflow-hidden rounded-md border border-[#3b4854] bg-[#202a33] p-2 pb-0 sm:p-3">
                      <span className="flex items-center gap-1 text-[9px] font-medium text-[#a0abb6] sm:text-[10px]">
                        <Cpu className="h-2.5 w-2.5 sm:h-3 sm:w-3" size={12} />
                        CPU usage
                      </span>
                      <strong className="mt-2 block text-lg font-medium whitespace-nowrap text-[#e9edf0] sm:text-xl">
                        {running ? `${18 + (tick % 5)}%` : "0%"}
                        <small className="ml-0 block text-[9px] font-normal text-[#8c9aa7] sm:ml-1 sm:inline sm:text-[10px]">
                          / 200%
                        </small>
                      </strong>
                      <Sparkline offline={!running} />
                    </div>
                    <div className="min-w-0 overflow-hidden rounded-md border border-[#3b4854] bg-[#202a33] p-2 pb-0 sm:p-3">
                      <span className="flex items-center gap-1 text-[9px] font-medium text-[#a0abb6] sm:text-[10px]">
                        <MemoryStick
                          className="h-2.5 w-2.5 sm:h-3 sm:w-3"
                          size={12}
                        />
                        Memory
                      </span>
                      <strong className="mt-2 block text-lg font-medium whitespace-nowrap text-[#e9edf0] sm:text-xl">
                        {running ? "1.24" : "0"}
                        <small className="ml-0 block text-[9px] font-normal text-[#8c9aa7] sm:ml-1 sm:inline sm:text-[10px]">
                          / 4 GiB
                        </small>
                      </strong>
                      <Sparkline variant={1} offline={!running} />
                    </div>
                    <div className="min-w-0 overflow-hidden rounded-md border border-[#3b4854] bg-[#202a33] p-2 pb-0 sm:p-3">
                      <span className="flex items-center gap-1 text-[9px] font-medium text-[#a0abb6] sm:text-[10px]">
                        <HardDrive
                          className="h-2.5 w-2.5 sm:h-3 sm:w-3"
                          size={12}
                        />
                        Disk
                      </span>
                      <strong className="mt-2 block text-lg font-medium whitespace-nowrap text-[#e9edf0] sm:text-xl">
                        2.18
                        <small className="ml-0 block text-[9px] font-normal text-[#8c9aa7] sm:ml-1 sm:inline sm:text-[10px]">
                          / 10 GiB
                        </small>
                      </strong>
                      <Sparkline variant={2} />
                    </div>
                  </div>
                </>
              )}
              {tab === "Files" && (
                <div className="max-h-96.75 min-h-96.75 scrollbar-thin [scrollbar-color:#52616f_transparent] overflow-auto py-1 min-[1051px]:max-h-96.75 min-[1051px]:min-h-96.75 sm:max-h-104.25 sm:min-h-104.25">
                  <div className="mb-4.5 flex items-center justify-between gap-2.5">
                    <h3 className="text-lg font-medium text-[#e9edf0]">
                      File manager
                    </h3>
                    <span className="text-[10px] text-[#8c9aa7]">
                      DEMO FILES
                    </span>
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
                                folder === "plugins"
                                  ? "README.txt"
                                  : "level.dat",
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
                          <ChevronRight
                            size={12}
                            className="hidden sm:inline"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {tab === "Backups" && (
                <div className="max-h-96.75 min-h-96.75 scrollbar-thin [scrollbar-color:#52616f_transparent] overflow-auto py-1 min-[1051px]:max-h-96.75 min-[1051px]:min-h-96.75 sm:max-h-104.25 sm:min-h-104.25">
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
                  className="max-h-96.75 min-h-96.75 scrollbar-thin [scrollbar-color:#52616f_transparent] overflow-auto py-1 min-[1051px]:max-h-96.75 min-[1051px]:min-h-96.75 sm:max-h-104.25 sm:min-h-104.25"
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
            </div>
            <div className="flex min-h-10.25 items-center justify-between gap-2 text-[9px] text-[#8c9aa7] sm:text-[10px]">
              <button
                type="button"
                onClick={copyAddress}
                className="flex cursor-pointer items-center gap-1.5 rounded-[3px] border-0 bg-transparent px-0 py-1.5 text-[9px] text-[#a0abb6] hover:text-[#a4e3dc] sm:text-[10px]"
              >
                {addressCopied ? <Check size={10} /> : <Activity size={10} />}{" "}
                {addressCopied ? "Address copied" : "play.example.com:25565"}{" "}
                <ArrowUpRight size={10} className="hidden sm:inline" />
              </button>
              <span className="flex items-center gap-1.5">
                <span className="h-1.25 w-1.25 shrink-0 rounded-full bg-[#a6d5b7]" />{" "}
                eu-west-01
              </span>
            </div>
            {notice && (
              <p
                className="mt-4.25 text-[11px] leading-[1.8] text-[#8c9aa7]"
                role="status"
              >
                {notice}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-[#303b45] bg-[#151c23] px-3.5 py-2.5 text-[9px] leading-[1.6] text-[#8c9aa7] sm:px-5 sm:text-[10px]">
          <span>Interactive demo · no live server connection</span>
          <span className="hidden sm:inline">Aquadactyl</span>
        </div>
      </div>
    </div>
  );
}
