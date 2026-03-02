import { useState } from "react";
import { Bot, Send, Loader2, CheckCircle2, MapPin, Zap, AlertCircle, RotateCcw, Copy } from "lucide-react";

interface Drone {
  id: string;
  name: string;
  model: string;
  status: string;
  battery: number;
  position: { x: number; y: number; z: number };
}

interface MissionStop {
  stopNumber: number;
  droneAssigned: string;
  location: string;
  coordinates: { x: number; y: number };
  priority: "HIGH" | "MEDIUM" | "LOW";
  estimatedTime: string;
  task: string;
  batteryRequired: number;
}

interface MissionPlan {
  missionTitle: string;
  objective: string;
  totalDrones: number;
  estimatedDuration: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  stops: MissionStop[];
  flightStrategy: string;
  safetyNotes: string[];
  alternateRoutes: string;
}

interface Props {
  drones: Drone[];
}

const SAMPLE_PROMPTS = [
  "Deploy 2 drones to cover northeast quadrant, prioritize medical hubs",
  "Emergency delivery sweep — all available drones to residential zones",
  "Scout mission: map all industrial areas with low-battery fallback",
  "Optimized multi-stop delivery for 4 packages in downtown grid",
];

const ZONE_MAP: Record<string, { x: number; y: number }> = {
  "Northeast Medical Hub": { x: 75, y: 25 },
  "Downtown Logistics": { x: 50, y: 50 },
  "Residential Zone A": { x: 20, y: 30 },
  "Industrial District": { x: 80, y: 70 },
  "Commercial Center": { x: 45, y: 45 },
  "Southwest Depot": { x: 15, y: 75 },
};

export default function AIMissionPlanner({ drones }: Props) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<MissionPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [history, setHistory] = useState<{ prompt: string; plan: MissionPlan }[]>([]);

  const availableDrones = drones.filter(d => d.battery > 30 && d.status !== "MAINTENANCE" && d.status !== "EMERGENCY");

  async function generateMission() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setPlan(null);
    setConfirmed(false);

    try {
      const droneContext = availableDrones.map(d =>
        `${d.name} (${d.model}, ${d.battery.toFixed(0)}% battery, status: ${d.status})`
      ).join(", ");

      const systemPrompt = `You are an AI Drone Mission Planner for the Airborne Autopilot system.
Available drones: ${droneContext || "No drones available"}.
Available zones: ${Object.keys(ZONE_MAP).join(", ")}.

Return ONLY a valid JSON object matching this structure exactly:
{
  "missionTitle": "string",
  "objective": "string (1 sentence)",
  "totalDrones": number,
  "estimatedDuration": "string (e.g. 45 minutes)",
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "flightStrategy": "string (2 sentences)",
  "alternateRoutes": "string (1 sentence)",
  "safetyNotes": ["string", "string", "string"],
  "stops": [
    {
      "stopNumber": 1,
      "droneAssigned": "drone name from available list",
      "location": "zone name from available zones",
      "coordinates": {"x": number, "y": number},
      "priority": "HIGH" | "MEDIUM" | "LOW",
      "estimatedTime": "string (e.g. 12 minutes)",
      "task": "string (1 sentence)",
      "batteryRequired": number (percentage 10-40)
    }
  ]
}
Only assign drones with sufficient battery. Use realistic coordinates from the zones provided.`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: "user", content: `Create a mission plan for: ${prompt}` }]
        })
      });

      const data = await response.json();
      const text = data.content?.map((c: { type: string; text?: string }) => c.type === "text" ? c.text : "").join("") || "";
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed: MissionPlan = JSON.parse(cleaned);

      // Hydrate coordinates from our zone map
      parsed.stops = parsed.stops.map(stop => ({
        ...stop,
        coordinates: ZONE_MAP[stop.location] || stop.coordinates
      }));

      setPlan(parsed);
      setHistory(prev => [{ prompt, plan: parsed }, ...prev.slice(0, 4)]);
    } catch (e) {
      setError("Failed to generate mission plan. Check your connection and try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const riskColor = (r: string) =>
    r === "HIGH" ? "text-red-400 bg-red-500/10 border-red-500/30" :
    r === "MEDIUM" ? "text-amber-400 bg-amber-500/10 border-amber-500/30" :
    "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";

  const priorityColor = (p: string) =>
    p === "HIGH" ? "bg-red-500/20 text-red-400" :
    p === "MEDIUM" ? "bg-amber-500/20 text-amber-400" :
    "bg-emerald-500/20 text-emerald-400";

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-purple-500/20 rounded-lg"><Bot className="w-6 h-6 text-purple-400" /></div>
        <div>
          <h1 className="text-xl font-bold">AI Mission Planner</h1>
          <p className="text-sm text-slate-400">Natural language → autonomous mission deployment</p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <span className="text-slate-400">{availableDrones.length} drones available</span>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Input Panel */}
        <div className="col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
            <label className="text-sm font-semibold text-slate-300 block mb-3">Mission Brief</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) generateMission(); }}
              placeholder="Describe your mission in plain English..."
              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-white placeholder-slate-500 resize-none h-28 focus:outline-none focus:border-purple-500 transition-colors"
              disabled={loading}
            />
            <div className="flex gap-2 mt-3">
              <button onClick={generateMission} disabled={loading || !prompt.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Send className="w-4 h-4" /> Generate Plan</>}
              </button>
              {plan && <button onClick={() => { setPlan(null); setPrompt(""); setConfirmed(false); }}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                <RotateCcw className="w-4 h-4 text-slate-300" />
              </button>}
            </div>
            <p className="text-xs text-slate-500 mt-2">Ctrl+Enter to generate</p>
          </div>

          {/* Sample Prompts */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Templates</p>
            <div className="space-y-2">
              {SAMPLE_PROMPTS.map((sp, i) => (
                <button key={i} onClick={() => setPrompt(sp)}
                  className="w-full text-left text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 p-2.5 rounded-lg transition-colors border border-slate-700 hover:border-slate-500">
                  "{sp}"
                </button>
              ))}
            </div>
          </div>

          {/* Available Drones */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Available Drones</p>
            <div className="space-y-2">
              {availableDrones.map(d => (
                <div key={d.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-slate-200">{d.name}</span>
                  </div>
                  <span className={`text-xs font-mono ${d.battery > 50 ? "text-emerald-400" : "text-amber-400"}`}>
                    {d.battery.toFixed(0)}%
                  </span>
                </div>
              ))}
              {availableDrones.length === 0 && <p className="text-slate-500 text-xs">No drones available</p>}
            </div>
          </div>
        </div>

        {/* Plan Output */}
        <div className="col-span-7">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {loading && (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-12 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-2 border-purple-500/30 rounded-full animate-spin border-t-purple-500" />
                <Bot className="w-6 h-6 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-slate-400 text-sm">AI analyzing drones and generating mission plan...</p>
            </div>
          )}

          {plan && !loading && (
            <div className="space-y-4">
              {/* Mission Overview */}
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="font-bold text-lg text-white">{plan.missionTitle}</h2>
                    <p className="text-slate-400 text-sm mt-1">{plan.objective}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-lg border ${riskColor(plan.riskLevel)}`}>
                    {plan.riskLevel} RISK
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Drones", value: plan.totalDrones },
                    { label: "Duration", value: plan.estimatedDuration },
                    { label: "Stops", value: plan.stops.length },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-800 rounded-lg p-3 text-center">
                      <div className="text-white font-bold text-sm">{value}</div>
                      <div className="text-slate-400 text-xs">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mission Stops */}
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-4">Mission Waypoints</h3>
                <div className="space-y-3">
                  {plan.stops.map((stop, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-slate-800 rounded-lg border border-slate-700">
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {stop.stopNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-white">{stop.location}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${priorityColor(stop.priority)}`}>
                            {stop.priority}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{stop.coordinates.x},{stop.coordinates.y}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{stop.task}</p>
                        <div className="flex gap-3 mt-1 text-xs text-slate-500">
                          <span>🚁 {stop.droneAssigned}</span>
                          <span>⏱ {stop.estimatedTime}</span>
                          <span>🔋 {stop.batteryRequired}% req.</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strategy & Safety */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Flight Strategy</h3>
                  <p className="text-sm text-slate-300">{plan.flightStrategy}</p>
                  <p className="text-xs text-slate-500 mt-2">Alt: {plan.alternateRoutes}</p>
                </div>
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Safety Notes</h3>
                  <ul className="space-y-1">
                    {plan.safetyNotes.map((note, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                        <span className="text-amber-400 mt-0.5">•</span>{note}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Confirm / Copy */}
              {!confirmed ? (
                <button onClick={() => setConfirmed(true)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4" /> Confirm & Deploy Mission
                </button>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-emerald-300 font-semibold text-sm">Mission Confirmed</p>
                    <p className="text-slate-400 text-xs">Flight plans dispatched to {plan.totalDrones} drone{plan.totalDrones !== 1 ? "s" : ""}</p>
                  </div>
                  <button onClick={() => navigator.clipboard?.writeText(JSON.stringify(plan, null, 2))}
                    className="ml-auto p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                    <Copy className="w-3.5 h-3.5 text-slate-300" />
                  </button>
                </div>
              )}
            </div>
          )}

          {!plan && !loading && !error && (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-12 flex flex-col items-center justify-center gap-3 text-center">
              <Bot className="w-12 h-12 text-slate-600" />
              <p className="text-slate-400">Enter a mission brief and the AI will generate a complete deployment plan with drone assignments, waypoints, and safety protocols.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
