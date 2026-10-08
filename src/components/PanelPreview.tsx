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
      className="sparkline"
      viewBox="0 0 240 60"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path className="graph-grid" d="M0 15H240 M0 35H240 M0 55H240" />
      <polygon className="graph-area" points={`0,60 ${points} 240,60`} />
      <polyline className="graph-line" points={points} />
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
    <div id="panel-preview" className="preview-wrap">
      <div className="preview-label">
        <span>Try the panel</span>
        <span>Interactive demo · sample data</span>
      </div>
      <div
        className="panel-preview"
        aria-label="Interactive Aquadactyl panel demo"
      >
        <div className="panel-topbar">
          <div className="panel-wordmark">
            <img src="/brand/aquadactyl-emblem.png" alt="" />
            Aquadactyl<span>/</span>
            <span className="panel-context">Servers</span>
          </div>
          <span className="panel-user">
            <UserRound size={12} /> R
          </span>
        </div>
        <div className="panel-shell">
          <div className="panel-main">
            <div className="server-heading">
              <div>
                <div className="server-breadcrumb">
                  SERVERS <ChevronRight size={9} /> MINECRAFT
                </div>
                <h2>{serverName}</h2>
                <p>
                  Paper 1.21.4 <span>·</span> Community Minecraft server
                </p>
              </div>
              <span
                className={`server-status ${status.toLowerCase()}`}
                role="status"
              >
                <span className="status-dot" />
                {status}
              </span>
            </div>
            <div
              className="panel-tabs"
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
                >
                  <Icon size={12} />
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
                  <div className="console-toolbar">
                    <span>
                      <Terminal size={12} /> Console
                    </span>
                    <div className="power-controls">
                      <button
                        type="button"
                        onClick={() => power("start")}
                        disabled={status !== "Offline"}
                        className="start-control"
                        aria-label="Start demo server"
                      >
                        <Play size={10} fill="currentColor" />
                        Start
                      </button>
                      <button
                        type="button"
                        onClick={() => power("restart")}
                        disabled={status === "Starting"}
                        aria-label="Restart demo server"
                      >
                        <RotateCw size={10} />
                        Restart
                      </button>
                      <button
                        type="button"
                        onClick={() => power("stop")}
                        disabled={status === "Offline"}
                        aria-label="Stop demo server"
                      >
                        <Square size={9} fill="currentColor" />
                        Stop
                      </button>
                    </div>
                  </div>
                  <div
                    className="console-output"
                    ref={terminalRef}
                    aria-label="Demo server output"
                  >
                    {logs.map((line, index) => (
                      <div
                        key={index}
                        className={`log-line ${line.tone ?? ""}`}
                      >
                        {line.text}
                      </div>
                    ))}
                    {status === "Starting" && (
                      <div className="log-line green">
                        Starting<span className="terminal-cursor">_</span>
                      </div>
                    )}
                  </div>
                  <form className="console-input" onSubmit={sendCommand}>
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
                    />
                    <button
                      type="submit"
                      disabled={!running || !command.trim()}
                      aria-label="Send demo command"
                    >
                      <Send size={12} />
                    </button>
                  </form>
                  <div className="panel-stats">
                    <div>
                      <span>
                        <Cpu size={12} />
                        CPU usage
                      </span>
                      <strong>
                        {running ? `${18 + (tick % 5)}%` : "0%"}
                        <small>/ 200%</small>
                      </strong>
                      <Sparkline offline={!running} />
                    </div>
                    <div>
                      <span>
                        <MemoryStick size={12} />
                        Memory
                      </span>
                      <strong>
                        {running ? "1.24" : "0"}
                        <small>/ 4 GiB</small>
                      </strong>
                      <Sparkline variant={1} offline={!running} />
                    </div>
                    <div>
                      <span>
                        <HardDrive size={12} />
                        Disk
                      </span>
                      <strong>
                        2.18<small>/ 10 GiB</small>
                      </strong>
                      <Sparkline variant={2} />
                    </div>
                  </div>
                </>
              )}
              {tab === "Files" && (
                <div className="preview-secondary">
                  <div className="secondary-heading">
                    <h3>File manager</h3>
                    <span>DEMO FILES</span>
                  </div>
                  <button
                    className="file-path"
                    type="button"
                    onClick={() => {
                      setFolder("");
                      setFilePreview(null);
                    }}
                  >
                    <Folder size={12} /> /home/container{folder && `/${folder}`}{" "}
                    <ChevronRight size={12} />
                  </button>
                  {filePreview ? (
                    <>
                      <div className="file-preview-heading">
                        <File size={12} />
                        {filePreview}
                        <button
                          type="button"
                          onClick={() => setFilePreview(null)}
                        >
                          Back to files
                        </button>
                      </div>
                      <pre className="demo-file-content">
                        {filePreview === "server.properties"
                          ? "# Minecraft server properties\nserver-port=25565\nmax-players=20\nmotd=An Aquadactyl community server\nonline-mode=true\ndifficulty=normal"
                          : "# Demo file preview\n# Your real panel supports viewing and editing files.\n# This preview uses sample data."}
                      </pre>
                    </>
                  ) : (
                    <div className="file-list">
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
                        >
                          {item.directory ? (
                            <Folder size={15} />
                          ) : (
                            <File size={15} />
                          )}
                          <span>{item.name}</span>
                          <small>{item.size}</small>
                          <ChevronRight size={12} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {tab === "Backups" && (
                <div className="preview-secondary">
                  <div className="secondary-heading">
                    <h3>Backups</h3>
                    <button
                      type="button"
                      className="small-accent-button"
                      disabled={creating}
                      onClick={createBackup}
                    >
                      {creating ? "Creating…" : "Create backup"}
                    </button>
                  </div>
                  <p className="secondary-description">
                    Keep a copy before changing your server.
                  </p>
                  {backups.map((name) => (
                    <div className="backup-row" key={name}>
                      <Archive size={18} />
                      <div>
                        <strong>{name}</strong>
                        <small>Sample backup · 124 MiB</small>
                      </div>
                      <Check size={15} />
                    </div>
                  ))}
                  <p className="demo-note">
                    This preview creates sample backups in your browser.
                  </p>
                </div>
              )}
              {tab === "Settings" && (
                <form
                  className="preview-secondary"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (draftName.trim()) {
                      setServerName(draftName.trim());
                      setSaved(true);
                    }
                  }}
                >
                  <div className="secondary-heading">
                    <h3>Server settings</h3>
                    <Settings size={15} />
                  </div>
                  <label className="demo-setting">
                    Server name
                    <input
                      required
                      maxLength={40}
                      value={draftName}
                      onChange={(event) => {
                        setDraftName(event.target.value);
                        setSaved(false);
                      }}
                    />
                  </label>
                  <label className="demo-setting">
                    Description
                    <input value="Community Minecraft server" readOnly />
                  </label>
                  <button type="submit" className="small-accent-button">
                    {saved ? "Changes saved" : "Save changes"}
                  </button>
                  <p className="demo-note">
                    Changes apply to this browser preview.
                  </p>
                </form>
              )}
            </div>
            <div className="panel-statusbar">
              <button type="button" onClick={copyAddress}>
                {addressCopied ? <Check size={10} /> : <Activity size={10} />}{" "}
                {addressCopied ? "Address copied" : "play.example.com:25565"}{" "}
                <ArrowUpRight size={10} />
              </button>
              <span>
                <span className="status-dot" /> eu-west-01
              </span>
            </div>
            {notice && (
              <p className="demo-note" role="status">
                {notice}
              </p>
            )}
          </div>
        </div>
        <div className="panel-footnote">
          <span>Interactive demo · no live server connection</span>
          <span>Aquadactyl</span>
        </div>
      </div>
    </div>
  );
}
