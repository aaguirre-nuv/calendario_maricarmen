import { useState, useEffect } from "react";

const CATEGORIES = {
  medico:    { label: "MÉDICO",    emoji: "🏥", color: "#C0392B", bg: "#FFF5F5", border: "#E74C3C" },
  familia:   { label: "FAMILIA",   emoji: "🏠", color: "#C47000", bg: "#FFFBF0", border: "#F39C12" },
  amigas:    { label: "AMIGAS",    emoji: "💜", color: "#7D6EE8", bg: "#F8F6FF", border: "#9B8FF5" },
  actividad: { label: "ACTIVIDAD", emoji: "🌸", color: "#1A8A6A", bg: "#F0FAF6", border: "#27AE80" },
  otro:      { label: "OTRO",      emoji: "📌", color: "#555",    bg: "#F7F7F7", border: "#BBBBBB" },
};

const DAYS = ["LUNES","MARTES","MIÉRCOLES","JUEVES","VIERNES","SÁBADO","DOMINGO"];

const DAY_TINTS = [
  "#FAFBFF","#FDFAF5","#F8FBFF","#FBF8FF","#F5FBFA","#FFFBF5","#F9F9F9",
];

function getTodayIndex() {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

function getWeekDates() {
  const today = new Date();
  const dow = today.getDay(); // 0=Sun, 1=Mon … 6=Sat
  const monday = new Date(today);
  // If Sunday (0), jump forward 1 day to next Monday
  const daysToMonday = dow === 0 ? 1 : -(dow - 1);
  monday.setDate(today.getDate() + daysToMonday);
  return DAYS.map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.getDate();
  });
}

const defaultEvents = { 0:[], 1:[], 2:[], 3:[], 4:[], 5:[], 6:[] };

export default function Calendario() {
  const [mode, setMode]       = useState("view");
  const [events, setEvents]   = useState(defaultEvents);
  const [editDay, setEditDay] = useState(null);
  const [editIdx, setEditIdx] = useState(null);
  const [form, setForm]       = useState({ time:"", text:"", category:"medico" });
  const [loaded, setLoaded]   = useState(false);

  const todayIdx  = getTodayIndex();
  const weekDates = getWeekDates();

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("cal-v3-events");
        if (r?.value) setEvents(JSON.parse(r.value));
      } catch (_) {}
      setLoaded(true);
    })();
  }, []);

  async function saveEvents(ne) {
    setEvents(ne);
    try { await window.storage.set("cal-v3-events", JSON.stringify(ne)); } catch (_) {}
  }

  function openAdd(dIdx)        { setEditDay(dIdx); setEditIdx(null); setForm({ time:"12:00", text:"", category:"medico" }); }
  function openEdit(dIdx, eIdx) { const e = events[dIdx][eIdx]; setEditDay(dIdx); setEditIdx(eIdx); setForm({ time:e.time, text:e.text, category:e.category }); }
  function closeModal()         { setEditDay(null); setEditIdx(null); }

  function handleSave() {
    if (!form.text.trim()) return;
    const ne = { ...events };
    const de = [...(ne[editDay] || [])];
    if (editIdx !== null) de[editIdx] = { ...form };
    else de.push({ ...form });
    de.sort((a,b) => (a.time||"").localeCompare(b.time||""));
    ne[editDay] = de;
    saveEvents(ne);
    closeModal();
  }

  function handleDelete(dIdx, eIdx) {
    const ne = { ...events };
    const de = [...ne[dIdx]];
    de.splice(eIdx, 1);
    ne[dIdx] = de;
    saveEvents(ne);
    closeModal();
  }

  if (!loaded) return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:"100vh", fontSize:32, color:"#aaa" }}>
      Cargando…
    </div>
  );

  const isView = mode === "view";

  return (
    <div style={{ minHeight:"100vh", background:"#EFEFEF", fontFamily:"'Segoe UI', Arial, sans-serif" }}>

      {/* ── HEADER ── */}
      <div style={{
        background:"#5A4FCC",
        padding: isView ? "12px 18px" : "11px 18px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        boxShadow:"0 3px 12px rgba(0,0,0,0.18)"
      }}>
        <div style={{ color:"white", fontSize: isView ? 28 : 20, fontWeight:900, textTransform:"uppercase", letterSpacing:1 }}>
          {new Date().toLocaleDateString("es-ES",{ month:"long", year:"numeric" }).toUpperCase()}
        </div>
        <button onClick={() => setMode(m => m==="view"?"edit":"view")} style={{
          background:"rgba(255,255,255,0.15)",
          border:"2px solid rgba(255,255,255,0.45)",
          borderRadius:10, color:"white",
          fontSize: isView ? 16 : 14, fontWeight:700, padding: isView ? "10px 18px" : "8px 14px",
          cursor:"pointer", whiteSpace:"nowrap"
        }}>
          {isView ? "✏️ EDITAR" : "👁️ VER"}
        </button>
      </div>

      {/* ── EDIT MODE: compact weekly overview with inline + buttons ── */}
      {!isView && (
        <div style={{ padding:"12px 12px 4px", display:"flex", flexDirection:"column", gap:6 }}>
          <div style={{ fontSize:12, color:"#999", fontWeight:600, textTransform:"uppercase", letterSpacing:2, marginBottom:4, paddingLeft:4 }}>
            Toca un día para añadir o editar eventos
          </div>
          {DAYS.map((day, dIdx) => {
            const isToday = dIdx === todayIdx;
            const dayEvts = events[dIdx] || [];
            return (
              <div key={dIdx} style={{
                background:"white",
                border: isToday ? "2px solid #6C5CE7" : "1px solid #E0E0E0",
                borderRadius:12,
                overflow:"hidden",
              }}>
                {/* Compact day row */}
                <div style={{
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  padding:"10px 14px",
                  background: isToday ? "#F0EEFF" : "#FAFAFA",
                  borderBottom: dayEvts.length > 0 ? "1px solid #EEEEEE" : "none",
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{
                      fontWeight:800, fontSize:15,
                      color: isToday ? "#6C5CE7" : "#444",
                      minWidth:90,
                    }}>
                      {day.charAt(0) + day.slice(1).toLowerCase()} {weekDates[dIdx]}
                    </div>
                    {isToday && <span style={{ fontSize:11, background:"#6C5CE7", color:"white", borderRadius:6, padding:"2px 7px", fontWeight:700, letterSpacing:1 }}>HOY</span>}
                  </div>
                  <button onClick={() => openAdd(dIdx)} style={{
                    background:"#6C5CE7", color:"white", border:"none",
                    borderRadius:8, padding:"5px 12px", fontSize:13, fontWeight:700,
                    cursor:"pointer", display:"flex", alignItems:"center", gap:5
                  }}>+ Añadir</button>
                </div>

                {/* Events in edit mode — compact rows */}
                {dayEvts.length > 0 && (
                  <div style={{ padding:"6px 10px", display:"flex", flexDirection:"column", gap:5 }}>
                    {dayEvts.map((evt, eIdx) => {
                      const cat = CATEGORIES[evt.category] || CATEGORIES.otro;
                      return (
                        <div key={eIdx} onClick={() => openEdit(dIdx, eIdx)} style={{
                          display:"flex", alignItems:"center", gap:10,
                          padding:"8px 10px",
                          background:cat.bg,
                          border:`1px solid ${cat.border}`,
                          borderLeft:`4px solid ${cat.border}`,
                          borderRadius:8, cursor:"pointer",
                        }}>
                          <span style={{ fontSize:20 }}>{cat.emoji}</span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:14, fontWeight:700, color:"#222", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                              {evt.text}
                            </div>
                            {evt.time && <div style={{ fontSize:12, color:cat.color, fontWeight:600 }}>🕐 {evt.time}</div>}
                          </div>
                          <div style={{ fontSize:13, color:cat.color, fontWeight:700, background:"white", border:`1px solid ${cat.border}`, borderRadius:6, padding:"2px 8px", whiteSpace:"nowrap" }}>
                            {cat.label}
                          </div>
                          <div style={{ color:"#CCC", fontSize:16 }}>›</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── VIEW MODE: big cards ── */}
      {isView && (
        <div style={{ padding:"12px 10px 6px", display:"flex", flexDirection:"column", gap:16 }}>
          {DAYS.map((day, dIdx) => {
            const isToday = dIdx === todayIdx;
            const dayEvts = events[dIdx] || [];
            return (
              <div key={dIdx} style={{
                background: isToday ? "#EDE9FF" : DAY_TINTS[dIdx],
                border: isToday ? "4px solid #6C5CE7" : "2px solid #D8D8D8",
                borderRadius:22,
                overflow:"hidden",
                boxShadow: isToday ? "0 6px 28px rgba(108,92,231,0.22)" : "0 2px 10px rgba(0,0,0,0.06)",
              }}>
                {/* Day header */}
                <div style={{
                  background: isToday ? "#6C5CE7" : "#DCDCDC",
                  padding:"14px 20px",
                  display:"flex", alignItems:"center", gap:16,
                }}>
                  <div style={{
                    background: isToday ? "rgba(255,255,255,0.22)" : "white",
                    borderRadius:16, width:78, height:78,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    boxShadow:"0 2px 6px rgba(0,0,0,0.12)", flexShrink:0
                  }}>
                    <div style={{ fontSize:46, fontWeight:900, color: isToday ? "white" : "#333", lineHeight:1 }}>
                      {weekDates[dIdx]}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:34, fontWeight:900, color: isToday ? "white" : "#333", lineHeight:1, letterSpacing:1 }}>
                      {day}
                    </div>
                    {isToday && (
                      <div style={{ fontSize:16, color:"rgba(255,255,255,0.9)", fontWeight:800, marginTop:4, letterSpacing:3 }}>
                        ⭐ HOY
                      </div>
                    )}
                  </div>
                </div>

                {/* Events */}
                <div style={{ padding:"12px 12px", display:"flex", flexDirection:"column", gap:10 }}>
                  {dayEvts.length === 0 && (
                    <div style={{ color:"#C0C0C0", fontSize:22, padding:"12px 8px", fontStyle:"italic", fontWeight:600 }}>
                      DÍA LIBRE 🌤️
                    </div>
                  )}
                  {dayEvts.map((evt, eIdx) => {
                    const cat = CATEGORIES[evt.category] || CATEGORIES.otro;
                    return (
                      <div key={eIdx} style={{
                        background:cat.bg,
                        border:`3px solid ${cat.border}`,
                        borderLeft:`8px solid ${cat.border}`,
                        borderRadius:18,
                        padding:"18px 20px",
                        display:"flex", alignItems:"center", gap:18,
                      }}>
                        <div style={{ fontSize:64, lineHeight:1, minWidth:72, textAlign:"center", flexShrink:0 }}>
                          {cat.emoji}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:30, fontWeight:900, color:"#111", lineHeight:1.2, textTransform:"uppercase", letterSpacing:0.5 }}>
                            {evt.text}
                          </div>
                          {evt.time && (
                            <div style={{ fontSize:28, color:cat.color, fontWeight:800, marginTop:8, display:"flex", alignItems:"center", gap:6 }}>
                              🕐 {evt.time}
                            </div>
                          )}
                          <div style={{
                            display:"inline-block", marginTop:10,
                            background:cat.border, borderRadius:8,
                            padding:"5px 14px", fontSize:15, fontWeight:900,
                            color:"white", letterSpacing:2, textTransform:"uppercase"
                          }}>{cat.label}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── LEGEND (view only) ── */}
      {isView && (
        <div style={{ padding:"10px 10px 28px" }}>
          <div style={{ background:"white", border:"2px solid #DEDEDE", borderRadius:20, padding:"16px 18px" }}>
            <div style={{ fontSize:14, fontWeight:800, color:"#AAA", marginBottom:12, letterSpacing:2, textTransform:"uppercase" }}>LEYENDA</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
              {Object.entries(CATEGORIES).map(([key,cat]) => (
                <div key={key} style={{
                  display:"flex", alignItems:"center", gap:8,
                  background:cat.bg, border:`2px solid ${cat.border}`,
                  borderRadius:12, padding:"10px 16px"
                }}>
                  <span style={{ fontSize:26 }}>{cat.emoji}</span>
                  <span style={{ fontSize:17, fontWeight:900, color:cat.color, textTransform:"uppercase", letterSpacing:1 }}>{cat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL (edit/add) ── */}
      {editDay !== null && (
        <div onClick={e => e.target===e.currentTarget && closeModal()} style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.45)",
          display:"flex", alignItems:"center", justifyContent:"center",
          zIndex:200, padding:"20px"
        }}>
          <div style={{
            background:"white", borderRadius:16,
            padding:"24px 22px 28px", width:"100%", maxWidth:420,
            boxShadow:"0 8px 32px rgba(0,0,0,0.18)", maxHeight:"90vh", overflowY:"auto"
          }}>
            {/* Modal header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <div style={{ fontSize:17, fontWeight:700, color:"#222" }}>
                {editIdx!==null
                  ? `Editar — ${DAYS[editDay].charAt(0)+DAYS[editDay].slice(1).toLowerCase()}`
                  : `Añadir — ${DAYS[editDay].charAt(0)+DAYS[editDay].slice(1).toLowerCase()} ${weekDates[editDay]}`}
              </div>
              <button onClick={closeModal} style={{
                background:"#F0F0F0", border:"none", borderRadius:"50%",
                width:34, height:34, fontSize:18, cursor:"pointer", color:"#666",
                display:"flex", alignItems:"center", justifyContent:"center"
              }}>✕</button>
            </div>

            {/* Tipo — horizontal pill selector */}
            <div style={{ marginBottom:18 }}>
              <label style={{ fontSize:12, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:1, display:"block", marginBottom:8 }}>Tipo</label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {Object.entries(CATEGORIES).map(([key,cat]) => (
                  <button key={key} onClick={() => setForm(f=>({...f,category:key}))} style={{
                    background: form.category===key ? cat.border : "white",
                    border:`2px solid ${form.category===key ? cat.border : "#DEDEDE"}`,
                    borderRadius:20, padding:"7px 14px",
                    fontSize:14, fontWeight:700, cursor:"pointer",
                    color: form.category===key ? "white" : "#888",
                    display:"flex", alignItems:"center", gap:6,
                    transition:"all 0.15s"
                  }}>
                    <span style={{ fontSize:18 }}>{cat.emoji}</span>
                    {cat.label.charAt(0)+cat.label.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Hora */}
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:1, display:"block", marginBottom:6 }}>Hora (opcional)</label>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <select
                  value={form.time ? form.time.split(":")[0] : "12"}
                  onChange={e => {
                    const mins = form.time ? form.time.split(":")[1] : "00";
                    setForm(f => ({...f, time: `${e.target.value}:${mins}`}));
                  }}
                  style={{ flex:1, padding:"10px 8px", fontSize:18, borderRadius:10, border:"1.5px solid #DEDEDE", outline:"none", fontWeight:700, color:"#333", background:"white" }}
                >
                  {Array.from({length:24},(_,i)=>String(i).padStart(2,"0")).map(h=>(
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <span style={{ fontSize:22, fontWeight:800, color:"#888" }}>:</span>
                <select
                  value={form.time ? form.time.split(":")[1] : "00"}
                  onChange={e => {
                    const hrs = form.time ? form.time.split(":")[0] : "12";
                    setForm(f => ({...f, time: `${hrs}:${e.target.value}`}));
                  }}
                  style={{ flex:1, padding:"10px 8px", fontSize:18, borderRadius:10, border:"1.5px solid #DEDEDE", outline:"none", fontWeight:700, color:"#333", background:"white" }}
                >
                  {["00","15","30","45"].map(m=>(
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Descripción */}
            <div style={{ marginBottom:22 }}>
              <label style={{ fontSize:12, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:1, display:"block", marginBottom:6 }}>¿Qué hay?</label>
              <input type="text" value={form.text} onChange={e=>setForm(f=>({...f,text:e.target.value}))}
                placeholder="Ej: Revisión con el médico"
                style={{
                  width:"100%", padding:"10px 14px", fontSize:16, borderRadius:10,
                  border:"1.5px solid #DEDEDE", outline:"none", boxSizing:"border-box",
                  fontWeight:600, color:"#333"
                }}/>
            </div>

            {/* Botones */}
            <div style={{ display:"flex", gap:10 }}>
              {editIdx!==null && (
                <button onClick={() => handleDelete(editDay,editIdx)} style={{
                  flex:1, padding:"11px", borderRadius:10,
                  border:"1.5px solid #E74C3C", background:"#FFF5F5",
                  color:"#C0392B", fontSize:14, fontWeight:700, cursor:"pointer"
                }}>🗑️ Borrar</button>
              )}
              <button onClick={handleSave} style={{
                flex:2, padding:"11px", borderRadius:10, border:"none",
                background:"#6C5CE7",
                color:"white", fontSize:15, fontWeight:700, cursor:"pointer",
                boxShadow:"0 3px 10px rgba(108,92,231,0.3)"
              }}>
                {editIdx!==null ? "Guardar cambios" : "✓ Añadir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
