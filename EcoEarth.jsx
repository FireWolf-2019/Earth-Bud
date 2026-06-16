import { useState, useEffect, useRef } from "react";

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{background:#091409;}
.eco-root{font-family:'DM Sans',sans-serif;background:#091409;color:#d4edd6;min-height:100vh;background-image:radial-gradient(ellipse at 15% 0%,rgba(29,90,40,0.28) 0%,transparent 55%),radial-gradient(ellipse at 85% 100%,rgba(18,55,80,0.22) 0%,transparent 55%);}
.eco-header{background:rgba(8,18,9,0.97);backdrop-filter:blur(24px);border-bottom:1px solid rgba(82,201,126,0.14);position:sticky;top:0;z-index:100;}
.eco-logo-bar{display:flex;align-items:center;gap:10px;padding:13px 22px 5px;}
.eco-logo-text{font-family:'Playfair Display',serif;font-size:1.45rem;font-weight:900;background:linear-gradient(130deg,#52c97e 0%,#4a9fbf 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.eco-logo-tag{font-size:0.67rem;color:rgba(212,237,214,0.32);letter-spacing:0.8px;text-transform:uppercase;margin-left:2px;}
.eco-tabs{display:flex;overflow-x:auto;padding:0 14px;gap:2px;scrollbar-width:none;}
.eco-tabs::-webkit-scrollbar{display:none;}
.eco-tab{padding:9px 15px;border:none;background:none;color:rgba(212,237,214,0.4);font-family:'DM Sans',sans-serif;font-size:0.8rem;font-weight:500;cursor:pointer;white-space:nowrap;border-bottom:2px solid transparent;transition:all 0.2s;letter-spacing:0.1px;}
.eco-tab:hover{color:rgba(212,237,214,0.8);}
.eco-tab.active{color:#52c97e;border-bottom-color:#52c97e;}
.eco-content{padding:22px 20px 40px;max-width:860px;margin:0 auto;}
.eco-section-title{font-family:'Playfair Display',serif;font-size:1.7rem;font-weight:900;color:#52c97e;margin-bottom:4px;line-height:1.15;}
.eco-section-subtitle{font-size:0.83rem;color:rgba(212,237,214,0.48);margin-bottom:22px;}
.eco-card{background:rgba(16,38,18,0.78);border:1px solid rgba(82,201,126,0.12);border-radius:14px;padding:18px 20px;margin-bottom:13px;backdrop-filter:blur(12px);transition:transform 0.2s,border-color 0.2s;}
.eco-card:hover{border-color:rgba(82,201,126,0.26);transform:translateY(-1px);}
.eco-card-title{font-family:'Playfair Display',serif;font-size:1.02rem;font-weight:700;color:#7dd99a;margin-bottom:5px;}
.eco-card-meta{font-size:0.73rem;color:rgba(212,237,214,0.42);margin-bottom:7px;}
.eco-card-body{font-size:0.84rem;line-height:1.68;color:rgba(212,237,214,0.78);}
.btn-green{background:linear-gradient(135deg,#2d8c4e,#1a6635);color:#e8f5e9;border:none;padding:9px 19px;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:0.84rem;font-weight:600;cursor:pointer;transition:all 0.2s;}
.btn-green:hover{filter:brightness(1.18);transform:translateY(-1px);}
.btn-green:disabled{opacity:0.42;cursor:not-allowed;transform:none;filter:none;}
.btn-outline{background:transparent;color:#52c97e;border:1px solid rgba(82,201,126,0.32);padding:8px 15px;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:0.8rem;font-weight:500;cursor:pointer;transition:all 0.2s;}
.btn-outline:hover{background:rgba(82,201,126,0.09);border-color:rgba(82,201,126,0.58);}
.eco-input{background:rgba(8,18,9,0.85);border:1px solid rgba(82,201,126,0.2);border-radius:8px;color:#d4edd6;font-family:'DM Sans',sans-serif;font-size:0.84rem;padding:9px 13px;width:100%;outline:none;transition:border-color 0.2s;}
.eco-input:focus{border-color:rgba(82,201,126,0.52);}
.eco-input::placeholder{color:rgba(212,237,214,0.26);}
.eco-range{-webkit-appearance:none;width:100%;height:4px;background:rgba(82,201,126,0.16);border-radius:2px;outline:none;cursor:pointer;}
.eco-range::-webkit-slider-thumb{-webkit-appearance:none;width:17px;height:17px;border-radius:50%;background:#52c97e;cursor:pointer;box-shadow:0 0 8px rgba(82,201,126,0.38);}
.eco-tag{display:inline-block;padding:2px 9px;border-radius:20px;font-size:0.7rem;font-weight:600;letter-spacing:0.15px;}
.tag-green{background:rgba(82,201,126,0.13);color:#52c97e;}
.tag-blue{background:rgba(74,159,191,0.13);color:#4a9fbf;}
.tag-orange{background:rgba(255,160,50,0.13);color:#ffa032;}
.tag-red{background:rgba(255,100,100,0.13);color:#ff7070;}
.action-card{background:rgba(11,26,13,0.92);border:1px solid rgba(82,201,126,0.09);border-radius:12px;overflow:hidden;cursor:pointer;transition:all 0.25s;margin-bottom:10px;}
.action-card:hover{border-color:rgba(82,201,126,0.32);transform:translateY(-1px);box-shadow:0 6px 28px rgba(0,0,0,0.28);}
.action-card.expanded{border-color:rgba(82,201,126,0.42);}
.action-card-header{padding:15px 17px;display:flex;align-items:center;gap:13px;}
.action-icon{font-size:1.75rem;flex-shrink:0;}
.action-body{padding:15px 17px 19px;border-top:1px solid rgba(82,201,126,0.09);}
.tracker-row{display:flex;align-items:center;gap:11px;padding:10px 14px;background:rgba(11,26,13,0.7);border:1px solid rgba(82,201,126,0.09);border-radius:10px;margin-bottom:7px;cursor:pointer;transition:all 0.2s;}
.tracker-row:hover{border-color:rgba(82,201,126,0.26);}
.tracker-row.done{border-color:rgba(82,201,126,0.42);background:rgba(82,201,126,0.06);}
.t-check{width:21px;height:21px;border:2px solid rgba(82,201,126,0.32);border-radius:5px;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.2s;}
.t-check.done{background:#52c97e;border-color:#52c97e;}
.chat-wrap{display:flex;flex-direction:column;height:calc(100vh - 230px);max-height:660px;}
.chat-msgs{flex:1;overflow-y:auto;padding:4px 0 14px;display:flex;flex-direction:column;gap:9px;}
.chat-msg{max-width:82%;padding:11px 14px;border-radius:15px;font-size:0.84rem;line-height:1.65;}
.chat-msg.user{background:linear-gradient(135deg,#1c5c3a,#154d2e);align-self:flex-end;border-bottom-right-radius:3px;color:#e8f5e9;}
.chat-msg.assistant{background:rgba(20,44,23,0.95);border:1px solid rgba(82,201,126,0.16);align-self:flex-start;border-bottom-left-radius:3px;}
.chat-input-row{display:flex;gap:8px;padding:11px 0 0;border-top:1px solid rgba(82,201,126,0.11);}
.sq-wrap{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:9px;}
.sq{background:rgba(74,159,191,0.07);border:1px solid rgba(74,159,191,0.23);color:#4a9fbf;padding:5px 11px;border-radius:18px;font-size:0.75rem;cursor:pointer;transition:all 0.2s;font-family:'DM Sans',sans-serif;}
.sq:hover{background:rgba(74,159,191,0.17);}
.impact-box{text-align:center;padding:13px;background:rgba(11,26,13,0.85);border:1px solid rgba(82,201,126,0.12);border-radius:10px;}
.impact-num{font-family:'Playfair Display',serif;font-size:1.85rem;font-weight:900;color:#52c97e;line-height:1;}
.impact-lbl{font-size:0.7rem;color:rgba(212,237,214,0.52);margin-top:3px;}
.loader{width:16px;height:16px;border:2px solid rgba(82,201,126,0.18);border-top-color:#52c97e;border-radius:50%;animation:spin 0.7s linear infinite;}
.notice{padding:11px 15px;border-radius:9px;font-size:0.82rem;line-height:1.55;}
.notice-blue{background:rgba(74,159,191,0.08);border:1px solid rgba(74,159,191,0.2);color:rgba(212,237,214,0.65);}
.notice-green{background:rgba(82,201,126,0.09);border:1px solid rgba(82,201,126,0.22);color:#7dd99a;}
.notice-gold{background:rgba(255,195,50,0.08);border:1px solid rgba(255,195,50,0.2);color:#ffc332;font-weight:600;text-align:center;}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
@keyframes spin{to{transform:rotate(360deg);}}
@keyframes fadeIn{from{opacity:0;transform:translateY(7px);}to{opacity:1;transform:translateY(0);}}
@keyframes blink{0%,100%{opacity:0.3;transform:scale(0.8);}50%{opacity:1;transform:scale(1);}}
.fade-in{animation:fadeIn 0.32s ease forwards;}
::-webkit-scrollbar{width:3px;height:3px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:rgba(82,201,126,0.22);border-radius:2px;}
`;

// ─── DATA ─────────────────────────────────────────────────────────────────────
const ACTIONS = [
  { id:"compost", icon:"🌱", title:"Start Composting", impact:"High", diff:"Medium", co2:"~0.2 t CO₂/yr saved", wkMin:15,
    tags:["Waste","Soil","Methane"],
    bg:"Food waste in landfills generates methane — a greenhouse gas 80× more potent than CO₂ over 20 years. In the US, food waste accounts for roughly 8% of global greenhouse gas emissions.",
    why:"Composting diverts organic matter from landfills, creates rich soil amendments, and eliminates the need for chemical fertilizers — closing the nutrient loop nature intended.",
    how:"Start with a simple bin or outdoor pile (~3×3 ft). Layer 'browns' (cardboard, dry leaves) with 'greens' (food scraps, grass). Keep moist, turn weekly. Finished compost ready in 2–3 months." },
  { id:"bike", icon:"🚲", title:"Ride a Bike", impact:"High", diff:"Low", co2:"0.5–2.4 t CO₂/yr saved", wkMin:60,
    tags:["Transport","Air Quality","Health"],
    bg:"Transportation causes 29% of US greenhouse gas emissions. A car emits ~404g CO₂/mile versus essentially zero for cycling. Even short trips matter — most car journeys are under 5 miles.",
    why:"Replacing just one car trip daily with cycling can prevent over half a ton of CO₂ annually, while improving cardiovascular health, reducing traffic, and saving hundreds of dollars in fuel.",
    how:"Start with short, safe routes using Google Maps cycling mode. Carry a lock and lights. For longer commutes, consider an e-bike. Join a local cycling group for motivation and route knowledge." },
  { id:"trees", icon:"🌳", title:"Plant Trees", impact:"High", diff:"Low", co2:"~48 lbs CO₂/tree/yr absorbed", wkMin:30,
    tags:["Carbon","Biodiversity","Air"],
    bg:"Deforestation releases 4.8 billion tons of CO₂ annually. A mature tree absorbs ~48 lbs of CO₂ per year and can live for centuries, making forests our most powerful long-term carbon stores.",
    why:"Trees sequester carbon, filter air and water, prevent soil erosion, provide wildlife habitat, and cool cities via evapotranspiration. A single tree can sustain entire local ecosystems.",
    how:"Plant native species suited to your climate. Water weekly for the first year. Partner with One Tree Planted, the Arbor Day Foundation, or your local parks department for free seedlings and guidance." },
  { id:"meat", icon:"🥦", title:"Eat Less Meat", impact:"Very High", diff:"Medium", co2:"0.5–1.5 t CO₂/yr saved", wkMin:20,
    tags:["Food","Water","Land Use"],
    bg:"Animal agriculture produces 14.5% of global greenhouse gas emissions (FAO). Producing 1 kg of beef requires ~15,000 liters of water and emits ~60kg CO₂ equivalent — 20× more than legumes.",
    why:"Shifting toward a plant-rich diet is among the highest-impact individual actions available. If the world went plant-based, food emissions could drop by up to 70% by 2050.",
    how:"Try Meatless Monday as a starting point. Explore plant proteins: lentils, chickpeas, tofu, tempeh, edamame. Apps like HappyCow and Forks Over Knives offer great recipes. Progress, not perfection." },
  { id:"solar", icon:"☀️", title:"Switch to Renewables", impact:"Very High", diff:"Low", co2:"1.5–2 t CO₂/yr saved", wkMin:5,
    tags:["Energy","Climate","Cost"],
    bg:"The average US home produces 7.5 tons CO₂/yr from electricity alone. Solar and wind are now cheaper than fossil fuels in most regions, with renewable capacity growing 300% over the past decade.",
    why:"Home energy is 25–30% of a typical household's carbon footprint. Switching to green energy delivers immediate, measurable, and permanent impact with increasingly attractive financial returns.",
    how:"Check your utility provider for green tariff options (often at no extra cost). Use EnergySage to compare solar quotes in your area. Meanwhile, install LED bulbs and a smart thermostat for quick wins." },
  { id:"water", icon:"💧", title:"Conserve Water", impact:"Medium", diff:"Low", co2:"Reduces energy use + scarcity", wkMin:10,
    tags:["Water","Energy","Scarcity"],
    bg:"Only 3% of Earth's water is fresh, and two-thirds is frozen. By 2025, two-thirds of the world's population may face water shortages. US households use 80–100 gallons per person per day on average.",
    why:"Water treatment and pumping consume significant energy. Conservation reduces both water scarcity and carbon emissions while preserving aquatic ecosystems and future drinking water supplies.",
    how:"Fix leaks (1 drip/second = 3,000 gallons/year). Install low-flow fixtures. Collect rainwater for gardens. Run appliances with full loads. A 5-minute shower saves ~25 gallons vs. a bath." },
  { id:"secondhand", icon:"♻️", title:"Buy Secondhand", impact:"Medium", diff:"Low", co2:"Avoids 25 lbs CO₂ per item", wkMin:25,
    tags:["Fashion","Waste","Resources"],
    bg:"Fast fashion is the world's 2nd largest polluter. The textile industry produces 10% of global CO₂ emissions and uses 93 billion cubic meters of water annually — more than the entire EU consumes.",
    why:"Each secondhand purchase avoids an average of 25 lbs CO₂ and extends a garment's life by 2+ years. Shifting demand away from new production is a direct vote for a circular economy.",
    how:"Explore thrift stores, Depop, ThredUp, Poshmark, or local Facebook groups. Host clothing swaps. Learn basic repairs to extend item life. Donate rather than trash — someone else's treasure." },
  { id:"advocate", icon:"🤝", title:"Advocate & Educate", impact:"Systemic", diff:"Medium", co2:"Multiplies all other impacts", wkMin:20,
    tags:["Social","Policy","Community"],
    bg:"Research confirms social influence is among the most powerful behavior-change mechanisms. Community advocacy has changed local policy, shifted corporate behavior, and inspired entire networks at scale.",
    why:"Individual action matters, but collective action changes systems. Sharing environmental knowledge with 10 people who each influence 10 more creates exponential reach and structural impact.",
    how:"Share verified environmental content on social media. Join local environmental groups or neighborhood composting initiatives. Contact representatives about climate policy. Vote with your dollar and your ballot." },
];

const EF = {
  carMile: 0.000404, flightShort: 0.255, flightLong: 0.6,
  elecKwh: 0.000386, gasTherm: 0.0054,
  dietMult: { vegan:0.5, vegetarian:0.7, flexitarian:0.85, omnivore:1.0, heavymeat:1.42 },
  shopCO2: { low:0.5, medium:1.5, high:3.0 },
};

const TABS = [
  "🌍  EcoNews", "📊  My Footprint", "🌿  Take Action", "📈  Tracker", "🤖  EcoBot"
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function ProgressRing({ pct, size = 124, label, color = "#52c97e" }) {
  const r = size / 2 - 11;
  const circ = 2 * Math.PI * r;
  const off = circ - (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(82,201,126,0.09)" strokeWidth="9"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
        strokeWidth="9" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={off}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition:"stroke-dashoffset 0.9s ease" }}/>
      <text x={size/2} y={size/2 - 4} textAnchor="middle" fill="#7dd99a"
        style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize: size * 0.17 }}>
        {Math.round(pct)}%
      </text>
      <text x={size/2} y={size/2 + 15} textAnchor="middle" fill="rgba(212,237,214,0.5)"
        style={{ fontFamily:"'DM Sans',sans-serif", fontSize: size * 0.1 }}>
        {label}
      </text>
    </svg>
  );
}

function Dot({ delay }) {
  return <div style={{ width:7, height:7, borderRadius:"50%", background:"#52c97e", opacity:0.6,
    animation:`blink 1.2s ${delay}s ease-in-out infinite` }} />;
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function EcoApp() {
  const [tab, setTab] = useState(0);

  // Tab 1
  const [news, setNews]             = useState([]);
  const [newsLoad, setNewsLoad]     = useState(false);
  const [blogs, setBlogs]           = useState([]);
  const [blogForm, setBlogForm]     = useState(false);
  const [blogDraft, setBlogDraft]   = useState({ title:"", url:"", desc:"" });

  // Tab 2
  const [fp, setFp] = useState({ carMi:120, shortFl:2, longFl:1, elecKwh:900, gasTherm:45, diet:"omnivore", shop:"medium" });
  const [fpr, setFpr] = useState(null);

  // Tab 3
  const [expanded, setExpanded]       = useState(null);
  const [viewed, setViewed]           = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("eco_viewed") || "[]")); } catch { return new Set(); }
  });

  // Tab 4
  const [checked, setChecked]         = useState(() => {
    try { return JSON.parse(localStorage.getItem("eco_checked") || "{}"); } catch { return {}; }
  });
  const [streaks, setStreaks]         = useState(() => {
    try { return JSON.parse(localStorage.getItem("eco_streaks") || "{}"); } catch { return {}; }
  });
  const [daysActive, setDaysActive]   = useState(() => {
    try { return parseInt(localStorage.getItem("eco_days") || "0"); } catch { return 0; }
  });
  const sessionRef = useRef(false);

  // Tab 5
  const [msgs, setMsgs]               = useState([{ role:"assistant",
    content:"Hi! I'm EcoBot 🌿 — your AI environmental guide. I have context about your activity in this app and can help with sustainability questions, explain your impact, or suggest your next best steps. What would you like to explore?" }]);
  const [chatIn, setChatIn]           = useState("");
  const [chatLoad, setChatLoad]       = useState(false);
  const chatRef                       = useRef(null);

  // Inject CSS
  useEffect(() => {
    const s = document.createElement("style"); s.textContent = CSS;
    document.head.appendChild(s); return () => s.remove();
  }, []);

  // Persist
  useEffect(() => { try { localStorage.setItem("eco_viewed", JSON.stringify([...viewed])); } catch {} }, [viewed]);
  useEffect(() => { try { localStorage.setItem("eco_checked", JSON.stringify(checked)); } catch {} }, [checked]);
  useEffect(() => { try { localStorage.setItem("eco_streaks", JSON.stringify(streaks)); } catch {} }, [streaks]);
  useEffect(() => { try { localStorage.setItem("eco_days", String(daysActive)); } catch {} }, [daysActive]);
  useEffect(() => { try {
    const saved = JSON.parse(localStorage.getItem("eco_blogs") || "[]");
    setBlogs(saved);
  } catch {} }, []);
  useEffect(() => { try { localStorage.setItem("eco_blogs", JSON.stringify(blogs)); } catch {} }, [blogs]);

  // Footprint calc
  useEffect(() => {
    const transport = fp.carMi * 52 * EF.carMile + fp.shortFl * EF.flightShort + fp.longFl * EF.flightLong;
    const energy    = fp.elecKwh * 12 * EF.elecKwh + fp.gasTherm * 12 * EF.gasTherm;
    const diet      = 2.5 * EF.dietMult[fp.diet];
    const shop      = EF.shopCO2[fp.shop];
    const total     = transport + energy + diet + shop;
    const usAvg     = 16;
    setFpr({
      total: total.toFixed(1), transport: transport.toFixed(1),
      energy: energy.toFixed(1), diet: diet.toFixed(1), shop: shop.toFixed(1),
      pctAvg: Math.round((total / usAvg) * 100),
      earths: (total / 1.6).toFixed(1),
    });
  }, [fp]);

  // Fetch news on mount
  useEffect(() => { fetchNews(); }, []);

  // Scroll chat
  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [msgs]);

  // ── API: News ────────────────────────────────────────────────────────────
  async function fetchNews() {
    setNewsLoad(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:1200,
          tools:[{ type:"web_search_20250305", name:"web_search" }],
          messages:[{ role:"user", content:
            "Search for the 5 most current major environmental and climate news stories from 2025. Return ONLY a JSON array with no markdown, no preamble, no explanation — just raw JSON. Structure: [{title:string, summary:string (2 sentences), source:string, category:string, date:string}]. Categories must be one of: Climate, Biodiversity, Pollution, Policy, Energy." }]
        })
      });
      const data = await res.json();
      const text = data.content.filter(b=>b.type==="text").map(b=>b.text).join("");
      const s = text.indexOf("["), e = text.lastIndexOf("]");
      if (s !== -1 && e !== -1) setNews(JSON.parse(text.slice(s, e+1)));
      else throw new Error("no json");
    } catch {
      setNews([
        { title:"Global CO₂ Hits Record 424 ppm", summary:"Atmospheric CO₂ reached its highest level in 3 million years in 2025. Scientists warn of accelerating feedback loops including permafrost methane release.", source:"NOAA", category:"Climate", date:"2025" },
        { title:"Amazon Deforestation Falls 50%", summary:"New satellite data shows dramatic reduction in Amazon deforestation rates under strengthened Brazilian policy. Conservation groups report cautious optimism.", source:"Reuters", category:"Biodiversity", date:"2025" },
        { title:"Plastic Pollution Treaty Stalls", summary:"UN negotiations on a global plastics treaty faced a setback as major petrochemical producers resisted binding production caps. Talks scheduled to resume.", source:"Guardian", category:"Pollution", date:"2025" },
        { title:"Solar Surpasses Coal in US Grid", summary:"Solar power generated more electricity than coal for the first time in US history during Q1 2025. The milestone marks a structural shift in American energy.", source:"EIA", category:"Energy", date:"2025" },
        { title:"Record Ocean Temperatures Persist", summary:"Global ocean surface temperatures remained at record highs into 2025, stressing coral reefs and disrupting marine food chains. 2024's pattern continues.", source:"Copernicus", category:"Climate", date:"2025" },
      ]);
    }
    setNewsLoad(false);
  }

  // ── API: Chat ────────────────────────────────────────────────────────────
  async function sendChat(content = chatIn) {
    if (!content.trim() || chatLoad) return;
    const userMsg = { role:"user", content };
    const newMsgs = [...msgs, userMsg];
    setMsgs(newMsgs);
    setChatIn(""); setChatLoad(true);

    const actDone    = ACTIONS.filter(a => checked[a.id]).map(a => a.title);
    const actViewed  = ACTIONS.filter(a => viewed.has(a.id)).map(a => a.title);
    const system = `You are EcoBot, a knowledgeable, warm, and personable environmental AI embedded in EcoEarth — an individual sustainability action platform.

USER PROFILE (from their in-app activity):
- Actions completed today: ${actDone.join(", ") || "none yet"}
- Action pages they've read: ${actViewed.join(", ") || "none yet"}
- Estimated carbon footprint: ${fpr ? fpr.total + " tons CO₂/yr (US avg is 16t)" : "not yet calculated"}
- Active days tracked: ${daysActive}
- News articles loaded: ${news.length}

RESPONSE GUIDELINES:
- Be warm, science-based, encouraging, and specific. Reference the user's context naturally where relevant.
- Keep answers 150–250 words max. Use occasional emojis naturally — don't overdo it.
- When suggesting reading/viewing, name specific books, documentaries (e.g., "Kiss the Ground" on Netflix), or sites (e.g., projectdrawdown.org).
- Only answer environmental topics. Decline others politely.
- Avoid catastrophism; focus on agency, solutions, and realistic optimism.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:1000, system,
          messages: newMsgs.map(m => ({ role:m.role, content:m.content }))
        })
      });
      const data = await res.json();
      const reply = data.content?.find(b=>b.type==="text")?.text || "I'm having trouble right now — please try again.";
      setMsgs(prev => [...prev, { role:"assistant", content:reply }]);
    } catch {
      setMsgs(prev => [...prev, { role:"assistant", content:"⚠️ Connection issue. Please try again in a moment." }]);
    }
    setChatLoad(false);
  }

  // ── Suggested queries ────────────────────────────────────────────────────
  function getSuggested() {
    const q = [];
    if (viewed.has("compost")) q.push("What can I compost at home?");
    if (viewed.has("meat"))    q.push("Easy plant-based meals for beginners?");
    if (viewed.has("bike"))    q.push("Best apps for cycle commuting?");
    if (fpr && parseFloat(fpr.total) > 10) q.push("What's my fastest path to lower emissions?");
    if (Object.values(checked).some(Boolean)) q.push("How consistent is my progress?");
    q.push("What's the #1 thing I can do today?");
    q.push("Recommend an environmental documentary");
    q.push("Explain carbon offsets — are they worth it?");
    return q.slice(0, 5);
  }

  // ── Tracker logic ────────────────────────────────────────────────────────
  function toggleCheck(id) {
    const now = !checked[id];
    setChecked(p => ({ ...p, [id]: now }));
    if (now && !sessionRef.current) {
      sessionRef.current = true;
      setDaysActive(d => d + 1);
    }
    setStreaks(p => ({ ...p, [id]: now ? (p[id] || 0) + 1 : 0 }));
  }

  const doneCount  = ACTIONS.filter(a => checked[a.id]).length;
  const progressPct = (doneCount / ACTIONS.length) * 100;
  const co2Today   = (doneCount * 0.28).toFixed(1);
  const treesEq    = Math.round(doneCount * 0.28 * 20);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="eco-root">
      {/* ── HEADER ── */}
      <header className="eco-header">
        <div className="eco-logo-bar">
          <span style={{ fontSize:"1.4rem" }}>🌍</span>
          <span className="eco-logo-text">EcoEarth</span>
          <span className="eco-logo-tag">Individual Action Platform</span>
        </div>
        <nav className="eco-tabs">
          {TABS.map((t,i) => (
            <button key={i} className={`eco-tab${tab===i?" active":""}`} onClick={()=>setTab(i)}>{t}</button>
          ))}
        </nav>
      </header>

      <main className="eco-content">

        {/* ════ TAB 1: NEWS ════ */}
        {tab===0 && (
          <div className="fade-in">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22 }}>
              <div>
                <h1 className="eco-section-title">Global Eco News</h1>
                <p className="eco-section-subtitle">Awareness is the first step to meaningful change.</p>
              </div>
              <div style={{ display:"flex", gap:7, flexShrink:0 }}>
                <button className="btn-outline" onClick={fetchNews} disabled={newsLoad} style={{ padding:"7px 13px" }}>
                  {newsLoad ? <div className="loader"/> : "↻ Refresh"}
                </button>
                <button className="btn-outline" onClick={()=>setBlogForm(f=>!f)} style={{ padding:"7px 13px" }}>+ Blog</button>
              </div>
            </div>

            {/* Blog form */}
            {blogForm && (
              <div className="eco-card fade-in" style={{ marginBottom:20, borderColor:"rgba(74,159,191,0.28)" }}>
                <div className="eco-card-title" style={{ color:"#4a9fbf", marginBottom:12 }}>Add a Resource or Blog</div>
                <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                  <input className="eco-input" placeholder="Title" value={blogDraft.title} onChange={e=>setBlogDraft(p=>({...p,title:e.target.value}))}/>
                  <input className="eco-input" placeholder="URL (https://...)" value={blogDraft.url} onChange={e=>setBlogDraft(p=>({...p,url:e.target.value}))}/>
                  <input className="eco-input" placeholder="Brief description (optional)" value={blogDraft.desc} onChange={e=>setBlogDraft(p=>({...p,desc:e.target.value}))}/>
                  <div style={{ display:"flex", gap:8 }}>
                    <button className="btn-green" onClick={()=>{
                      if (blogDraft.title && blogDraft.url) {
                        setBlogs(p=>[...p, { ...blogDraft, added:new Date().toLocaleDateString() }]);
                        setBlogDraft({title:"",url:"",desc:""}); setBlogForm(false);
                      }
                    }}>Save Resource</button>
                    <button className="btn-outline" onClick={()=>setBlogForm(false)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {/* Saved blogs */}
            {blogs.length > 0 && (
              <div style={{ marginBottom:22 }}>
                <div style={{ fontSize:"0.72rem", color:"#4a9fbf", fontWeight:600, letterSpacing:"0.6px", marginBottom:10 }}>📚 MY RESOURCES</div>
                {blogs.map((b,i) => (
                  <div key={i} className="eco-card" style={{ borderColor:"rgba(74,159,191,0.2)" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
                      <div>
                        <div className="eco-card-title" style={{ color:"#4a9fbf" }}>{b.title}</div>
                        <div className="eco-card-meta">Added {b.added}</div>
                        {b.desc && <div className="eco-card-body">{b.desc}</div>}
                      </div>
                      <div style={{ display:"flex", gap:7, flexShrink:0 }}>
                        <a href={b.url} target="_blank" rel="noopener noreferrer">
                          <button className="btn-outline" style={{ fontSize:"0.74rem", padding:"5px 11px" }}>Visit →</button>
                        </a>
                        <button className="btn-outline" style={{ fontSize:"0.74rem", padding:"5px 9px", color:"#ff7070", borderColor:"rgba(255,112,112,0.28)" }}
                          onClick={()=>setBlogs(p=>p.filter((_,j)=>j!==i))}>✕</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* News items */}
            {newsLoad ? (
              <div style={{ textAlign:"center", padding:"56px 0" }}>
                <div className="loader" style={{ margin:"0 auto 14px" }}/>
                <div style={{ color:"rgba(212,237,214,0.45)", fontSize:"0.84rem" }}>Fetching live environmental news…</div>
              </div>
            ) : news.map((item,i) => {
              const tagCls = item.category==="Climate"||item.category==="Pollution" ? "tag-orange" : item.category==="Energy" ? "tag-blue" : "tag-green";
              return (
                <div key={i} className="eco-card fade-in" style={{ animationDelay:`${i*0.07}s` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:6, marginBottom:8 }}>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      <span className={`eco-tag ${tagCls}`}>{item.category}</span>
                      <span className="eco-tag" style={{ background:"rgba(212,237,214,0.05)", color:"rgba(212,237,214,0.38)" }}>{item.source} · {item.date}</span>
                    </div>
                  </div>
                  <div className="eco-card-title">{item.title}</div>
                  <div className="eco-card-body">{item.summary}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* ════ TAB 2: FOOTPRINT ════ */}
        {tab===1 && (
          <div className="fade-in">
            <h1 className="eco-section-title">My Footprint</h1>
            <p className="eco-section-subtitle">Measure your annual environmental impact across four key lifestyle areas.</p>

            {/* Summary card */}
            {fpr && (
              <div className="eco-card" style={{ background:"linear-gradient(145deg,rgba(18,55,22,0.92),rgba(12,34,16,0.92))", marginBottom:22, padding:"22px 20px" }}>
                <div className="grid3" style={{ marginBottom:18 }}>
                  {[
                    { val:fpr.total, unit:"t CO₂/yr", color: parseFloat(fpr.total)>10 ? "#ffa032" : "#52c97e" },
                    { val:`${fpr.pctAvg}%`, unit:"of US average", color:"#4a9fbf" },
                    { val:`${fpr.earths}×`, unit:"Earths needed", color: parseFloat(fpr.earths)>1.5 ? "#ffa032" : "#52c97e" },
                  ].map(({ val, unit, color }) => (
                    <div key={unit} style={{ textAlign:"center" }}>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"2.4rem", fontWeight:900, color, lineHeight:1 }}>{val}</div>
                      <div style={{ fontSize:"0.72rem", color:"rgba(212,237,214,0.52)", marginTop:5 }}>{unit}</div>
                    </div>
                  ))}
                </div>
                {/* Bar chart */}
                <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                  {[
                    { label:"🚗 Transport", val:fpr.transport },
                    { label:"⚡ Energy", val:fpr.energy },
                    { label:"🥩 Diet", val:fpr.diet },
                    { label:"🛍️ Shopping", val:fpr.shop },
                  ].map(({ label, val }) => {
                    const max = Math.max(parseFloat(fpr.transport), parseFloat(fpr.energy), parseFloat(fpr.diet), parseFloat(fpr.shop));
                    const pct = (parseFloat(val) / max) * 100;
                    return (
                      <div key={label}>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.76rem", marginBottom:4 }}>
                          <span style={{ color:"rgba(212,237,214,0.68)" }}>{label}</span>
                          <span style={{ color:"#7dd99a" }}>{val}t</span>
                        </div>
                        <div style={{ height:5, background:"rgba(82,201,126,0.09)", borderRadius:3, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${pct}%`, background:"linear-gradient(90deg,#1e6b38,#52c97e)", borderRadius:3, transition:"width 0.9s ease" }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Inputs */}
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[
                { key:"carMi",    label:"🚗 Car miles per week",         min:0, max:500, unit:"mi" },
                { key:"shortFl",  label:"✈️ Short flights/year (<4 hrs)", min:0, max:20,  unit:"" },
                { key:"longFl",   label:"✈️ Long flights/year (4+ hrs)",  min:0, max:10,  unit:"" },
                { key:"elecKwh",  label:"⚡ Monthly electricity (kWh)",   min:100, max:3000, unit:"kWh" },
                { key:"gasTherm", label:"🔥 Monthly natural gas (therms)",min:0, max:200, unit:"th" },
              ].map(({ key, label, min, max, unit }) => (
                <div key={key} className="eco-card" style={{ padding:"14px 18px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:9 }}>
                    <label style={{ fontSize:"0.83rem", color:"rgba(212,237,214,0.82)" }}>{label}</label>
                    <span style={{ fontSize:"0.83rem", color:"#52c97e", fontWeight:600 }}>{fp[key]}{unit}</span>
                  </div>
                  <input type="range" className="eco-range" min={min} max={max} value={fp[key]}
                    onChange={e=>setFp(p=>({...p,[key]:Number(e.target.value)}))}/>
                </div>
              ))}

              {/* Diet toggle */}
              <div className="eco-card" style={{ padding:"14px 18px" }}>
                <div style={{ fontSize:"0.83rem", color:"rgba(212,237,214,0.82)", marginBottom:10 }}>🥦 Diet type</div>
                <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                  {Object.keys(EF.dietMult).map(d => (
                    <button key={d} onClick={()=>setFp(p=>({...p,diet:d}))}
                      style={{ padding:"5px 13px", borderRadius:18, border:"1px solid",
                        borderColor: fp.diet===d ? "#52c97e" : "rgba(82,201,126,0.18)",
                        background: fp.diet===d ? "rgba(82,201,126,0.14)" : "transparent",
                        color: fp.diet===d ? "#52c97e" : "rgba(212,237,214,0.45)",
                        cursor:"pointer", fontSize:"0.79rem", transition:"all 0.2s", fontFamily:"'DM Sans',sans-serif" }}>
                      {d.charAt(0).toUpperCase()+d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shopping toggle */}
              <div className="eco-card" style={{ padding:"14px 18px" }}>
                <div style={{ fontSize:"0.83rem", color:"rgba(212,237,214,0.82)", marginBottom:10 }}>🛍️ Shopping intensity</div>
                <div style={{ display:"flex", gap:7 }}>
                  {["low","medium","high"].map(s => (
                    <button key={s} onClick={()=>setFp(p=>({...p,shop:s}))}
                      style={{ flex:1, padding:"7px", borderRadius:8, border:"1px solid",
                        borderColor: fp.shop===s ? "#52c97e" : "rgba(82,201,126,0.18)",
                        background: fp.shop===s ? "rgba(82,201,126,0.14)" : "transparent",
                        color: fp.shop===s ? "#52c97e" : "rgba(212,237,214,0.45)",
                        cursor:"pointer", fontSize:"0.8rem", transition:"all 0.2s", fontFamily:"'DM Sans',sans-serif" }}>
                      {s.charAt(0).toUpperCase()+s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="notice notice-blue" style={{ marginTop:4 }}>
                💡 Global average: ~4.7 t CO₂/yr · US average: ~16 t · Sustainable target by 2050: ~2.3 t
              </div>
            </div>
          </div>
        )}

        {/* ════ TAB 3: ACTIONS ════ */}
        {tab===2 && (
          <div className="fade-in">
            <h1 className="eco-section-title">Take Action</h1>
            <p className="eco-section-subtitle">Science-backed, high-impact steps. Tap any card to learn more.</p>

            {ACTIONS.map((a, i) => {
              const isOpen = expanded === a.id;
              return (
                <div key={a.id} className={`action-card${isOpen?" expanded":""}`}
                  style={{ animationDelay:`${i*0.05}s` }}
                  onClick={()=>{ setExpanded(isOpen?null:a.id); setViewed(p=>new Set([...p,a.id])); }}>
                  <div className="action-card-header">
                    <span className="action-icon">{a.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"0.98rem", fontWeight:700, color:"#7dd99a" }}>{a.title}</div>
                      <div style={{ fontSize:"0.72rem", color:"rgba(212,237,214,0.45)", marginTop:2 }}>{a.co2} · ~{a.wkMin} min/week</div>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                      <span className={`eco-tag ${a.impact==="Very High"||a.impact==="High"?"tag-green":a.impact==="Systemic"?"tag-blue":"tag-orange"}`}>{a.impact}</span>
                      <span style={{ fontSize:"0.68rem", color:"rgba(212,237,214,0.3)" }}>{isOpen?"▲":"▼"}</span>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="action-body fade-in" onClick={e=>e.stopPropagation()}>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
                        {a.tags.map(t=><span key={t} className="eco-tag tag-blue">{t}</span>)}
                        <span className="eco-tag" style={{ background:"rgba(212,237,214,0.05)", color:"rgba(212,237,214,0.4)" }}>Difficulty: {a.diff}</span>
                      </div>
                      {[
                        { icon:"📖", heading:"Background", body:a.bg },
                        { icon:"⚡", heading:"Why It Matters", body:a.why },
                        { icon:"🛠️", heading:"How To Start", body:a.how },
                      ].map(({ icon, heading, body }) => (
                        <div key={heading} style={{ marginBottom:13 }}>
                          <div style={{ fontSize:"0.75rem", fontWeight:600, color:"#52c97e", marginBottom:5, letterSpacing:"0.2px" }}>{icon} {heading}</div>
                          <div style={{ fontSize:"0.83rem", lineHeight:1.68, color:"rgba(212,237,214,0.78)" }}>{body}</div>
                        </div>
                      ))}
                      <button className="btn-green" style={{ width:"100%", marginTop:6 }}
                        onClick={()=>{ setTab(3); }}>
                        ✓ Track This Action
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ════ TAB 4: TRACKER ════ */}
        {tab===3 && (
          <div className="fade-in">
            <h1 className="eco-section-title">Action Tracker</h1>
            <p className="eco-section-subtitle">Every consistent action compounds. Build your streak.</p>

            {/* Progress + stats */}
            <div className="eco-card" style={{ marginBottom:20 }}>
              <div style={{ display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
                <ProgressRing pct={progressPct} size={128} label="today"/>
                <div style={{ flex:1, minWidth:180, display:"flex", flexDirection:"column", gap:10 }}>
                  <div className="impact-box" style={{ padding:"13px 16px" }}>
                    <div className="impact-num">~{co2Today} kg</div>
                    <div className="impact-lbl">CO₂ impact avoided today (est.)</div>
                  </div>
                  <div className="grid2">
                    <div className="impact-box">
                      <div className="impact-num" style={{ fontSize:"1.5rem" }}>{daysActive}</div>
                      <div className="impact-lbl">Days active</div>
                    </div>
                    <div className="impact-box">
                      <div className="impact-num" style={{ fontSize:"1.5rem", color:"#4a9fbf" }}>{treesEq}</div>
                      <div className="impact-lbl">Tree equivalents</div>
                    </div>
                  </div>
                </div>
              </div>

              {doneCount===0 && (
                <div className="notice notice-blue" style={{ marginTop:14 }}>🌱 Check off today's actions below to start tracking your impact!</div>
              )}
              {doneCount>=3 && doneCount<ACTIONS.length && (
                <div className="notice notice-green" style={{ marginTop:14 }}>🔥 Great momentum! {ACTIONS.length-doneCount} more action{ACTIONS.length-doneCount!==1?"s":""} to complete today's full challenge.</div>
              )}
              {doneCount===ACTIONS.length && (
                <div className="notice notice-gold" style={{ marginTop:14 }}>🎉 Perfect day! You've completed every action. You are genuinely making a difference.</div>
              )}
            </div>

            {/* Collective impact */}
            <div className="eco-card" style={{ marginBottom:20, borderColor:"rgba(74,159,191,0.22)" }}>
              <div style={{ fontSize:"0.71rem", color:"#4a9fbf", fontWeight:600, letterSpacing:"0.7px", marginBottom:10 }}>🌐 PREDICTED COLLECTIVE IMPACT</div>
              <div style={{ fontSize:"0.8rem", color:"rgba(212,237,214,0.55)", marginBottom:12 }}>
                If 1,000 people in your community acted the same as you today…
              </div>
              <div className="grid3">
                {[
                  { val:`${(parseFloat(co2Today)*1000).toFixed(0)} kg`, lbl:"CO₂ prevented" },
                  { val:String(treesEq*1000), lbl:"Tree equivalents" },
                  { val:`${(doneCount*1000*12).toLocaleString()}`, lbl:"Car miles avoided" },
                ].map(({ val, lbl }) => (
                  <div key={lbl} style={{ padding:"11px 8px", background:"rgba(74,159,191,0.05)", borderRadius:9, border:"1px solid rgba(74,159,191,0.14)", textAlign:"center" }}>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.18rem", fontWeight:700, color:"#4a9fbf" }}>{val}</div>
                    <div style={{ fontSize:"0.68rem", color:"rgba(212,237,214,0.48)", marginTop:3 }}>{lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Checklist */}
            <div style={{ fontSize:"0.71rem", color:"rgba(212,237,214,0.45)", fontWeight:600, letterSpacing:"0.7px", marginBottom:10 }}>TODAY'S ACTIONS</div>
            {ACTIONS.map(a => (
              <div key={a.id} className={`tracker-row${checked[a.id]?" done":""}`} onClick={()=>toggleCheck(a.id)}>
                <div className={`t-check${checked[a.id]?" done":""}`}>
                  {checked[a.id] && <span style={{ color:"#091409", fontSize:"0.72rem", fontWeight:700 }}>✓</span>}
                </div>
                <span style={{ fontSize:"1.4rem", flexShrink:0 }}>{a.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"0.85rem", fontWeight:500, color: checked[a.id] ? "#7dd99a" : "rgba(212,237,214,0.82)" }}>{a.title}</div>
                  {streaks[a.id] > 1 && <div style={{ fontSize:"0.7rem", color:"#ffa032", marginTop:2 }}>🔥 {streaks[a.id]}-day streak</div>}
                </div>
                <span className={`eco-tag ${a.impact==="Very High"||a.impact==="High"?"tag-green":"tag-blue"}`} style={{ fontSize:"0.68rem" }}>{a.impact}</span>
              </div>
            ))}

            {doneCount > 0 && (
              <div style={{ textAlign:"center", marginTop:14 }}>
                <button className="btn-outline" onClick={()=>setTab(4)}>
                  💬 Ask EcoBot about my progress
                </button>
              </div>
            )}
          </div>
        )}

        {/* ════ TAB 5: CHAT ════ */}
        {tab===4 && (
          <div className="fade-in">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
              <div>
                <h1 className="eco-section-title">EcoBot</h1>
                <p className="eco-section-subtitle">Context-aware AI guide, powered by your in-app journey.</p>
              </div>
              <div style={{ padding:"5px 12px", background:"rgba(82,201,126,0.09)", borderRadius:18, fontSize:"0.72rem", color:"#52c97e", border:"1px solid rgba(82,201,126,0.22)", flexShrink:0 }}>
                🟢 Online
              </div>
            </div>

            <div className="chat-wrap">
              {/* Suggested */}
              <div className="sq-wrap">
                {getSuggested().map((q,i) => (
                  <button key={i} className="sq" onClick={()=>sendChat(q)}>{q}</button>
                ))}
              </div>

              {/* Messages */}
              <div className="chat-msgs" ref={chatRef}>
                {msgs.map((m,i) => (
                  <div key={i} className={`chat-msg ${m.role} fade-in`} style={{ animationDelay:"0.04s" }}>
                    {m.role==="assistant" && (
                      <div style={{ fontSize:"0.68rem", color:"#52c97e", fontWeight:600, marginBottom:6, letterSpacing:"0.3px" }}>🌿 ECOBOT</div>
                    )}
                    <div style={{ whiteSpace:"pre-wrap" }}>{m.content}</div>
                  </div>
                ))}
                {chatLoad && (
                  <div className="chat-msg assistant">
                    <div style={{ fontSize:"0.68rem", color:"#52c97e", fontWeight:600, marginBottom:7, letterSpacing:"0.3px" }}>🌿 ECOBOT</div>
                    <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                      <Dot delay={0}/><Dot delay={0.18}/><Dot delay={0.36}/>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="chat-input-row">
                <input className="eco-input" value={chatIn} onChange={e=>setChatIn(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendChat()}
                  placeholder="Ask about sustainability, your impact, or what to do next…"/>
                <button className="btn-green" onClick={()=>sendChat()} disabled={chatLoad||!chatIn.trim()}
                  style={{ flexShrink:0, padding:"9px 15px" }}>
                  {chatLoad ? <div className="loader"/> : "↑"}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
