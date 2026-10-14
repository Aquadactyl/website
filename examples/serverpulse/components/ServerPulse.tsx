import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { create } from "zustand";
import { formatDistanceToNow } from "date-fns";
import { clamp } from "es-toolkit";
import { Activity, RefreshCw, Settings, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import http, { httpErrorToHuman } from "@/api/http";
import { ServerContext } from "@/state/server";

const settingsSchema = z.object({
  label: z.string().trim().min(1, "Enter a label.").max(48),
  interval: z.enum(["20", "30", "60"]),
});
type SettingsValues = z.infer<typeof settingsSchema>;

// UI preferences only: never put tokens, server data or passwords in this store.
const usePreferences = create<{
  settings: SettingsValues;
  apply: (settings: SettingsValues) => void;
}>((set) => ({
  settings: { label: "Server Pulse", interval: "30" },
  apply: (settings) => set({ settings }),
}));

// Validate the wire response rather than assuming a TypeScript cast checks it.
const statsSchema = z.object({
  object: z.literal("stats"),
  attributes: z.object({
    current_state: z.string(),
    is_suspended: z.boolean(),
    resources: z.object({
      cpu_absolute: z.number(),
      memory_bytes: z.number(),
      disk_bytes: z.number(),
    }),
  }),
});

function Pulse({ uuid, memoryLimit }: { uuid: string; memoryLimit: number }) {
  const { settings, apply } = usePreferences();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });

  // Reuse the panel's QueryClientProvider, with a key scoped to this server.
  const stats = useQuery({
    queryKey: ["serverpulse", "resources", uuid],
    queryFn: async ({ signal }) => {
      const { data } = await http.get<unknown>(
        `/api/client/servers/${encodeURIComponent(uuid)}/resources`,
        { signal },
      );
      return statsSchema.parse(data).attributes;
    },
    staleTime: 20_000,
    refetchInterval: Number(settings.interval) * 1000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const resources = stats.data?.resources;
  const memoryPercent =
    resources && memoryLimit > 0
      ? clamp(
          (resources.memory_bytes / (memoryLimit * 1024 * 1024)) * 100,
          0,
          100,
        )
      : null;

  return (
    <motion.section
      className="serverpulse"
      aria-label={settings.label}
      initial={reducedMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <header className="serverpulse-header">
        <h2>
          <Activity size={18} aria-hidden /> {settings.label}
        </h2>
        <div className="serverpulse-actions">
          <button
            type="button"
            onClick={() => void stats.refetch()}
            disabled={stats.isFetching}
            aria-label="Refresh resource usage"
          >
            <RefreshCw size={16} aria-hidden /> Refresh
          </button>
          <Dialog.Root open={settingsOpen} onOpenChange={setSettingsOpen}>
            <Dialog.Trigger className="serverpulse-button">
              <Settings size={16} aria-hidden /> Settings
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Backdrop className="serverpulse-backdrop" />
              <Dialog.Popup className="serverpulse-dialog">
                <Dialog.Title>Server Pulse settings</Dialog.Title>
                <Dialog.Description>
                  Preferences apply to this panel session. Resource data is
                  cached for 20 seconds.
                </Dialog.Description>
                <form
                  onSubmit={handleSubmit((values) => {
                    apply(values);
                    setSettingsOpen(false);
                  })}
                >
                  <label htmlFor="serverpulse-label">Card label</label>
                  <input
                    id="serverpulse-label"
                    maxLength={48}
                    aria-invalid={!!errors.label}
                    aria-describedby={
                      errors.label ? "serverpulse-label-error" : undefined
                    }
                    {...register("label")}
                  />
                  {errors.label && (
                    <p id="serverpulse-label-error" role="alert">
                      {errors.label.message}
                    </p>
                  )}
                  <label htmlFor="serverpulse-interval">Refresh interval</label>
                  <select id="serverpulse-interval" {...register("interval")}>
                    <option value="20">20 seconds</option>
                    <option value="30">30 seconds</option>
                    <option value="60">60 seconds</option>
                  </select>
                  <div className="serverpulse-actions">
                    <button type="submit">Apply preferences</button>
                    <Dialog.Close
                      className="serverpulse-button"
                      aria-label="Close settings"
                    >
                      <X size={16} aria-hidden /> Close
                    </Dialog.Close>
                  </div>
                </form>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </header>
      {stats.isPending && <p role="status">Loading resource usage…</p>}
      {stats.isError && <p role="alert">{httpErrorToHuman(stats.error)}</p>}
      {resources && stats.data && (
        <>
          <dl className="serverpulse-stats">
            <div>
              <dt>CPU</dt>
              <dd>{resources.cpu_absolute.toFixed(1)}%</dd>
            </div>
            <div>
              <dt>Memory</dt>
              <dd>{(resources.memory_bytes / 1024 / 1024).toFixed(0)} MiB</dd>
            </div>
            <div>
              <dt>Disk</dt>
              <dd>{(resources.disk_bytes / 1024 / 1024).toFixed(0)} MiB</dd>
            </div>
          </dl>
          {memoryPercent !== null && (
            <div
              className="serverpulse-meter"
              role="progressbar"
              aria-label="Memory limit used"
              aria-valuenow={Math.round(memoryPercent)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span style={{ width: `${memoryPercent}%` }} />
            </div>
          )}
          <p className="serverpulse-caption">
            {stats.isError
              ? "Last successful reading"
              : stats.data.current_state}
            {stats.data.is_suspended ? " · Suspended" : ""}
            {" · "}Updated{" "}
            {formatDistanceToNow(stats.dataUpdatedAt, { addSuffix: true })}
          </p>
        </>
      )}
    </motion.section>
  );
}

export default function ServerPulse() {
  const server = ServerContext.useStoreState((state) => state.server.data);
  // Only mount the query after the panel has loaded and authorized this server.
  return server ? (
    <Pulse
      key={server.uuid}
      uuid={server.uuid}
      memoryLimit={server.limits.memory}
    />
  ) : null;
}
