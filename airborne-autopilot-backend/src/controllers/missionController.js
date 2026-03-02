const Drone = require('../models/Drone');
const redis = require('../config/redis');

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-1.5-flash'}:generateContent`;

exports.planMission = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    const drones = await Drone.find({ status: 'IDLE', battery: { $gte: 30 } });

    const systemContext = `You are an AI drone mission planner for Airborne Autopilot Pro.
Available drones: ${JSON.stringify(drones.map(d => ({ id: d.id, battery: d.battery, position: d.position })))}
City graph nodes: Depot(0), Hospital(1), Mall(2), Airport(3), Port(4), Downtown(5), University(6), Stadium(7), Park(8), Library(9), Market(10), Station(11), Hotel(12), School(13), Factory(14), Bank(15), Clinic(16), Warehouse(17), Plaza(18), Tower(19).
Respond ONLY with valid JSON, no markdown fences, containing:
{ "missionTitle": string, "objective": string, "totalDrones": number, "estimatedDuration": string, "riskLevel": "LOW"|"MEDIUM"|"HIGH", "stops": [{"nodeId":number,"name":string,"task":string,"priority":number}], "flightStrategy": string, "safetyNotes": string[], "droneAssignments": [{"droneId":string,"stops":[number]}] }`;

    const response = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${systemContext}\n\nMission Request: ${prompt}` }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
      }),
    });

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
    const geminiData = await response.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    const missionPlan = JSON.parse(cleaned);

    res.json({ success: true, data: missionPlan });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return res.status(422).json({ success: false, message: 'Gemini returned invalid JSON — retry' });
    }
    next(error);
  }
};

exports.analyzeAirspace = async (req, res, next) => {
  try {
    const { dronePositions, plannedPath } = req.body;
    const prompt = `Analyze airspace safety for these drone positions: ${JSON.stringify(dronePositions)}.
Planned path nodes: ${JSON.stringify(plannedPath)}.
Return JSON: { "safe": boolean, "riskLevel": "LOW"|"MEDIUM"|"HIGH", "conflicts": [], "recommendations": [] }`;

    const response = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }),
    });

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const result = JSON.parse(rawText.replace(/```json|```/g, '').trim());
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.getTemplates = (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, label: 'Emergency Medical Sweep', prompt: 'Deploy all available drones to hospitals and clinics for urgent medical supply delivery across all zones.' },
      { id: 2, label: 'Multi-Stop Retail',        prompt: 'Plan an optimized multi-stop delivery route covering Mall, Downtown, Plaza, and Market for standard packages.' },
      { id: 3, label: 'Scout & Survey',           prompt: 'Send 2 drones on a reconnaissance sweep of the Port and Airport zones for airspace mapping.' },
      { id: 4, label: 'Night Express Run',        prompt: 'Deploy fastest available drone for single urgent express delivery from Depot to Hospital at maximum speed.' },
    ],
  });
};

exports.deployMission = async (req, res, next) => {
  try {
    const { missionPlan } = req.body;
    const io = req.app.get('io');
    if (io) io.emit('mission:deployed', { plan: missionPlan, deployedBy: req.user.name, deployedAt: new Date() });
    res.json({ success: true, message: 'Mission deployed successfully', data: missionPlan });
  } catch (error) { next(error); }
};
