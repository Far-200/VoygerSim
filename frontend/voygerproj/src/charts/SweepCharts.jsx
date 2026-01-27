import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
);

function toNum(v, fallback = null) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export default function SweepCharts({ sweep }) {
  const rows = Array.isArray(sweep?.results) ? sweep.results : [];
  if (rows.length === 0) return null;

  const labels = rows.map((r) => String(r?.noise ?? ""));

  const uncodedBer = rows.map((r) => toNum(r?.uncoded?.avg_ber, null));
  const codedBer = rows.map((r) => toNum(r?.coded_hamming74?.avg_ber, null));

  const uncodedIntegrity = rows.map((r) =>
    toNum(r?.uncoded?.frame_success_rate, null),
  );
  const codedIntegrity = rows.map((r) =>
    toNum(r?.coded_hamming74?.frame_success_rate, null),
  );

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: "rgba(255,255,255,0.7)" },
        position: "top",
      },
      tooltip: {
        enabled: true,
        backgroundColor: "rgba(0,0,0,0.8)",
        titleColor: "rgba(255,255,255,0.9)",
        bodyColor: "rgba(255,255,255,0.8)",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: "rgba(255,255,255,0.45)" },
        grid: { color: "rgba(255,255,255,0.06)" },
      },
      y: {
        ticks: { color: "rgba(255,255,255,0.45)" },
        grid: { color: "rgba(255,255,255,0.06)" },
        beginAtZero: true,
      },
    },
  };

  const berData = {
    labels,
    datasets: [
      {
        label: "Uncoded BER",
        data: uncodedBer,
        tension: 0.25,
        spanGaps: true,
        borderColor: "rgba(239,68,68,0.95)", // red
        backgroundColor: "rgba(239,68,68,0.15)",
        pointRadius: 2,
        pointHoverRadius: 5,
        borderWidth: 2,
      },
      {
        label: "Hamming(7,4) BER",
        data: codedBer,
        tension: 0.25,
        spanGaps: true,
        borderColor: "rgba(56,189,248,0.95)", // sky
        backgroundColor: "rgba(56,189,248,0.15)",
        pointRadius: 2,
        pointHoverRadius: 5,
        borderWidth: 2,
      },
    ],
  };

  const integrityData = {
    labels,
    datasets: [
      {
        label: "Uncoded Integrity",
        data: uncodedIntegrity,
        tension: 0.25,
        spanGaps: true,
        borderColor: "rgba(239,68,68,0.95)", // red
        backgroundColor: "rgba(239,68,68,0.15)",
        pointRadius: 2,
        pointHoverRadius: 5,
        borderWidth: 2,
      },
      {
        label: "Hamming(7,4) Integrity",
        data: codedIntegrity,
        tension: 0.25,
        spanGaps: true,
        borderColor: "rgba(16,185,129,0.95)", // emerald
        backgroundColor: "rgba(16,185,129,0.15)",
        pointRadius: 2,
        pointHoverRadius: 5,
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
        <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.4em] text-white/20 text-center">
          BER vs Noise
        </h3>
        <div className="h-72">
          <Line data={berData} options={commonOptions} />
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
        <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.4em] text-white/20 text-center">
          Integrity vs Noise
        </h3>
        <div className="h-72">
          <Line data={integrityData} options={commonOptions} />
        </div>
      </div>
    </div>
  );
}
