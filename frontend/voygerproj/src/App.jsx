import { useEffect, useMemo, useState } from "react";
import { api } from "./api/client";
import SweepCharts from "./charts/SweepCharts";

// --- Sub-components ---

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4 transition-all hover:border-white/20">
      <p className="text-[8px] sm:text-[10px] text-white/40 uppercase tracking-widest font-bold">
        {label}
      </p>
      <p className="mt-1 text-lg sm:text-2xl font-mono font-semibold text-white truncate">
        {typeof value === "number" && value < 1 ? value.toFixed(4) : value}
      </p>
    </div>
  );
}

function Heartbeat({ title, subtitle, data }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/30">
          {title}
        </p>
        {subtitle && (
          <p className="text-[9px] sm:text-[10px] text-white/40 font-mono tracking-wider">
            {subtitle}
          </p>
        )}
      </div>

      {!Array.isArray(data) || data.length === 0 ? (
        <p className="text-[10px] text-white/20 italic">No signal locked...</p>
      ) : (
        <div className="overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex gap-1 sm:gap-1.5 min-w-max">
            {data.map((frame, i) => {
              const isObject = typeof frame === "object" && frame !== null;
              const status = isObject ? frame.status : frame ? "clean" : "lost";
              const errors = isObject ? frame.errors : frame ? 0 : ">1";

              const color =
                status === "clean"
                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.3)]"
                  : status === "corrected"
                    ? "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.3)]"
                    : "bg-red-500/40";

              return (
                <div
                  key={i}
                  className={`h-4 sm:h-5 w-1 sm:w-1.5 rounded-full transition-all duration-300 ${color}`}
                  title={`Frame ${i + 1} | Status: ${status.toUpperCase()} | Errors: ${errors}`}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function BitsRow({ title, bits }) {
  const formattedBits = useMemo(() => {
    if (!Array.isArray(bits)) return "";
    const bitString = bits.join("");
    return bitString.match(/.{1,8}/g)?.join(" ") ?? bitString;
  }, [bits]);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4">
      <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-2">
        {title}
      </p>
      <p className="font-mono text-[9px] sm:text-xs text-emerald-500/80 break-all leading-relaxed">
        {formattedBits || (
          <span className="text-white/10 italic font-sans">
            No signal locked...
          </span>
        )}
      </p>
    </div>
  );
}

// --- Main Application ---

export default function App() {
  const [health, setHealth] = useState(null);
  const [sim, setSim] = useState(null);
  const [sweep, setSweep] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [frames, setFrames] = useState(30);
  const [bitFlip, setBitFlip] = useState(0.05);
  const [useFec, setUseFec] = useState(true);

  useEffect(() => {
    api
      .get("/health")
      .then((res) => setHealth(res.data))
      .catch((e) => setHealth({ error: e.message }));
  }, []);

  const runSim = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await api.post("/simulate", {
        frames: Number(frames),
        bit_flip_prob: bitFlip,
        use_fec: useFec,
        bits_per_frame: 64,
      });
      setSim(res.data);
    } catch (e) {
      setErr(e.response?.data?.detail || e.message || "Simulation failed.");
    } finally {
      setLoading(false);
    }
  };

  const runSweep = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await api.post("/sweep", {
        frames: 120,
        bits_per_frame: 64,
        use_fec: true,
        noise_values: Array.from({ length: 21 }, (_, i) =>
          Number((i * 0.01).toFixed(2)),
        ),
      });
      setSweep(res.data);
    } catch (e) {
      setErr(e.response?.data?.detail || e.message || "Sweep failed.");
    } finally {
      setLoading(false);
    }
  };

  const activeMetrics = useMemo(() => {
    if (!sim?.metrics) return null;
    return useFec && sim.metrics?.coded_hamming74
      ? sim.metrics.coded_hamming74
      : sim.metrics.uncoded;
  }, [sim, useFec]);

  const activeHeartbeat = useMemo(() => {
    if (!sim?.metrics) return null;
    return useFec && sim.metrics?.coded_hamming74?.heartbeat
      ? sim.metrics.coded_hamming74.heartbeat
      : sim.metrics.uncoded?.heartbeat;
  }, [sim, useFec]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-emerald-500/30 font-sans p-4 sm:p-6 lg:p-12 overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] h-[40%] w-[40%] rounded-full bg-sky-500/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl">
        <header className="mb-8 sm:mb-12 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-3 mb-4">
            <div
              className={`h-1.5 w-1.5 rounded-full ${health?.status === "ok" ? "bg-emerald-500" : "bg-red-500 animate-pulse"}`}
            />
            <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.3em] text-white/30 font-black">
              DSN Connection: {health?.status || "Connecting..."}
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter italic leading-none">
            VOYAGER<span className="text-white/10">PULSE</span>
          </h1>
        </header>

        {/* Responsive Control Panel */}
        <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="col-span-1 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <label className="text-[9px] font-bold uppercase tracking-widest text-white/30">
              Frames
            </label>
            <input
              type="number"
              className="mt-2 w-full rounded-lg bg-zinc-900 border border-white/5 px-3 py-1.5 outline-none font-mono text-sm"
              value={frames}
              onChange={(e) => setFrames(e.target.value)}
            />
          </div>

          <div className="col-span-1 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <label className="text-[9px] font-bold uppercase tracking-widest text-white/30">
              Recovery
            </label>
            <div className="mt-2 flex items-center bg-black/40 p-1 rounded-lg border border-white/5">
              <button
                onClick={() => setUseFec(false)}
                className={`flex-1 py-1 rounded-md text-[9px] font-bold ${!useFec ? "bg-white text-black" : "text-white/40"}`}
              >
                OFF
              </button>
              <button
                onClick={() => setUseFec(true)}
                className={`flex-1 py-1 rounded-md text-[9px] font-bold ${useFec ? "bg-white text-black" : "text-white/40"}`}
              >
                ON
              </button>
            </div>
          </div>

          <div className="col-span-2 md:col-span-1 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-2 text-[9px] font-bold uppercase tracking-widest text-white/30">
              <label>Noise</label>
              <span className="text-emerald-400 font-mono">
                {Number(bitFlip).toFixed(3)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="0.2"
              step="0.001"
              value={bitFlip}
              onChange={(e) => setBitFlip(Number(e.target.value))}
              className="w-full accent-emerald-500 h-1.5"
            />
          </div>

          <button
            onClick={runSim}
            disabled={loading}
            className="col-span-1 md:col-span-1 rounded-xl bg-emerald-500 px-4 py-3 font-black text-black text-[10px] sm:text-xs transition-all hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? "SYNCING..." : "SYNC SIGNAL"}
          </button>

          <button
            onClick={runSweep}
            disabled={loading}
            className="col-span-1 md:col-span-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-black text-white text-[10px] sm:text-xs transition-all hover:border-white/20 disabled:opacity-50 uppercase"
          >
            {loading ? "RUNNING..." : "Sweep BER"}
          </button>
        </div>

        {err && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-red-400 text-[10px] font-bold uppercase">
            ⚠️ {err}
          </div>
        )}

        <div className="space-y-4 sm:space-y-6">
          {sim && (
            <div className="grid gap-4 sm:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Stat
                  label="Flipped Bits"
                  value={sim.metrics?.flipped_bits_total ?? 0}
                />
                <Stat
                  label="Recovered"
                  value={activeMetrics?.frame_success ?? 0}
                />
                <Stat
                  label="Integrity"
                  value={activeMetrics?.frame_success_rate ?? 0}
                />
                <Stat
                  label="Corrected"
                  value={sim.metrics?.coded_hamming74?.corrected_codewords ?? 0}
                />
              </div>

              <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
                <Heartbeat
                  title="Link Status (Uncoded)"
                  subtitle={`Rate: ${Number(sim.metrics?.uncoded?.frame_success_rate ?? 0).toFixed(4)}`}
                  data={sim.metrics?.uncoded?.heartbeat}
                />
                <Heartbeat
                  title={
                    useFec ? "Link Status (Hamming 7,4)" : "Link Status (Raw)"
                  }
                  subtitle={
                    useFec
                      ? `Rate: ${Number(sim.metrics?.coded_hamming74?.frame_success_rate ?? 0).toFixed(4)}`
                      : "No FEC"
                  }
                  data={activeHeartbeat}
                />
              </div>

              {/* FEC Decision Log - Mobile Optimized Table */}
              {activeHeartbeat && Array.isArray(activeHeartbeat) && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <p className="mb-3 text-[9px] uppercase tracking-[0.2em] text-white/30 font-bold">
                    FEC Decision Log
                  </p>
                  <div className="max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                    <ul className="text-[10px] font-mono space-y-1">
                      {activeHeartbeat.map((f, i) => {
                        const isObject = typeof f === "object" && f !== null;
                        const status = isObject
                          ? f.status
                          : f
                            ? "clean"
                            : "lost";
                        const errs = isObject ? f.errors : f ? 0 : ">1";
                        return (
                          <li
                            key={i}
                            className="text-white/50 flex justify-between items-center border-b border-white/[0.03] py-1"
                          >
                            <span>FR_{String(i + 1).padStart(2, "0")}</span>
                            <span
                              className={
                                status === "clean"
                                  ? "text-emerald-400"
                                  : status === "corrected"
                                    ? "text-sky-400"
                                    : "text-red-400"
                              }
                            >
                              {status.toUpperCase()}{" "}
                              <span className="opacity-40 ml-1">
                                ({errs} ERR)
                              </span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {sweep?.results && (
            <div className="space-y-4 animate-in fade-in duration-700">
              <SweepCharts sweep={sweep} />
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md overflow-hidden">
                <h3 className="mb-4 text-[9px] font-bold uppercase tracking-[0.4em] text-white/20 text-center">
                  Research Data
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] font-mono">
                    <thead className="text-white/40 border-b border-white/5">
                      <tr>
                        <th className="text-left p-2">p</th>
                        <th className="text-left p-2">U_BER</th>
                        <th className="text-left p-2">C_BER</th>
                        <th className="text-left p-2">INTEG</th>
                      </tr>
                    </thead>
                    <tbody className="text-white/70">
                      {sweep.results.slice(0, 10).map((r, i) => (
                        <tr key={i} className="border-b border-white/[0.02]">
                          <td className="p-2 text-emerald-400">{r.noise}</td>
                          <td className="p-2">
                            {Number(r.uncoded?.avg_ber ?? 0).toFixed(3)}
                          </td>
                          <td className="p-2 text-sky-400">
                            {r.coded_hamming74
                              ? Number(r.coded_hamming74.avg_ber).toFixed(3)
                              : "-"}
                          </td>
                          <td className="p-2">
                            {r.coded_hamming74
                              ? Number(
                                  r.coded_hamming74.frame_success_rate,
                                ).toFixed(3)
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-2 text-center text-[8px] text-white/20 italic uppercase">
                    Showing first 10 data points (Swipe for more)
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
