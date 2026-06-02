import { useState, useRef } from "react";

// ── CSS injected once ─────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+3:wght@300;400;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Source Sans 3', sans-serif; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #F7FAFC; }
  ::-webkit-scrollbar-thumb { background: #CBD5E0; border-radius: 3px; }
  .nav-item:hover { background: rgba(255,255,255,0.10) !important; }
  .nav-sub:hover  { background: rgba(255,107,107,0.18) !important; color:#fff !important; }
  .card-hover:hover { transform: translateY(-5px); box-shadow: 0 12px 32px rgba(0,0,0,0.18) !important; }
  .btn-hover:hover { filter: brightness(1.08); transform: translateY(-1px); }
  .row-hover:hover { background: #EBF8FF !important; }
  .tab-btn:hover { background: #fff !important; color: #1A365D !important; }
  .action-btn:hover { filter: brightness(0.92); }
  @media print {
    .no-print { display: none !important; }
    .print-only { display: block !important; }
    body { background: white; }
  }
  .print-only { display: none; }
  input:focus, select:focus, textarea:focus { border-color: #2A4365 !important; box-shadow: 0 0 0 3px rgba(42,67,101,0.12); outline: none; }
  .fade-in { animation: fadeIn 0.3s ease; }
  @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
`;

// ── Tokens ────────────────────────────────────────────────────
const T = {
  white:    "#FFFFFF", slate:  "#2A4365", coral:  "#FF6B6B",
  navy:     "#1A365D", off:    "#F7FAFC", navyMid:"#2C5282",
  grey:     "#718096", greyL:  "#EDF2F7", greyM:  "#CBD5E0",
  green:    "#276749", greenL: "#C6F6D5", greenM: "#38A169",
  blue:     "#2B6CB0", blueL:  "#BEE3F8", red:    "#C53030",
  redL:     "#FED7D7", gold:   "#B7791F", goldL:  "#FEFCBF",
  purple:   "#553C9A", teal:   "#285E61",
};

// ── Programme Components ──────────────────────────────────────
const DEFAULT_COMPONENTS = [
  { id:1, name:"Sports for Development",                           icon:"⚽", color:"#C53030", light:"#FFF5F5" },
  { id:2, name:"Youth Leadership & Mentorship",                    icon:"🌟", color:"#2A4365", light:"#EBF8FF" },
  { id:3, name:"Entrepreneurship & Skills Development",            icon:"💼", color:"#B7791F", light:"#FFFFF0" },
  { id:4, name:"Education Support",                                icon:"🎓", color:"#276749", light:"#F0FFF4" },
  { id:5, name:"Health & Wellness",                                icon:"❤️", color:"#C05621", light:"#FFFAF0" },
  { id:6, name:"Disability Inclusion & Social Protection",         icon:"♿", color:"#553C9A", light:"#FAF5FF" },
  { id:7, name:"Environmental Sanitation & Community Service",     icon:"🌿", color:"#285E61", light:"#E6FFFA" },
];

// ── Users ─────────────────────────────────────────────────────
const INIT_USERS = [
  { id:1, name:"Admin Coordinator", email:"admin@ogb.org",    password:"admin123",  role:"Admin",             avatar:"AC" },
  { id:2, name:"Kofi Mensah",       email:"kofi@ogb.org",     password:"pass123",   role:"Programme Officer", avatar:"KM" },
  { id:3, name:"Abena Owusu",       email:"abena@ogb.org",    password:"pass123",   role:"Programme Officer", avatar:"AO" },
];

// ── Beneficiaries ─────────────────────────────────────────────
const INIT_BENS = [
  { id:1,  bid:"LYSBF-001", name:"Akwasi Nyarko",   age:19, gender:"Male",   dob:"2005-03-14", community:"New Juaben North", address:"H/No 12, Juaben", nationality:"Ghanaian", tribe:"Ashanti", religion:"Christian", region:"Eastern", district:"New Juaben North", city:"Koforidua", area:"Juaben", physicalDesc:"Near the main market", occupation:"Student",    employment:"Unemployed", education:"SHS",      component:1, status:"Active",    disability:"N/A",                 assignedTo:2, enrollDate:"2024-01-15", health:"Good",   vulnOnArrival:"No",  height:"170cm", weight:"65kg", ghanaCard:"GHA-000111222-0", medCondition:"None",            family:"Single parent household — mother is a petty trader", background:"Akwasi grew up in a low-income household.",  lastFollowUp:"2024-05-20", posts:[{id:1,date:"2024-05-20",author:"Kofi Mensah",text:"Client attended training. Great enthusiasm."}] },
  { id:2,  bid:"LYSBF-002", name:"Abena Asante",    age:22, gender:"Female", dob:"2002-07-08", community:"Effiduase",        address:"Plot 5, Effiduase", nationality:"Ghanaian", tribe:"Kwahu",   religion:"Christian", region:"Eastern", district:"Effiduase-Osino", city:"Effiduase", area:"Effiduase Central", physicalDesc:"Near the police station", occupation:"Trader",     employment:"Employed",   education:"JHS",      component:2, status:"Active",    disability:"N/A",                 assignedTo:2, enrollDate:"2024-01-20", health:"Good",   vulnOnArrival:"No",  height:"162cm", weight:"58kg", ghanaCard:"GHA-000222333-1", medCondition:"None",            family:"Both parents present",                            background:"Abena is an active trader.",                  lastFollowUp:"2024-05-18", posts:[{id:1,date:"2024-05-18",author:"Kofi Mensah",text:"Completed mentorship module."}] },
  { id:3,  bid:"LYSBF-003", name:"Kwame Boateng",   age:25, gender:"Male",   dob:"1999-11-22", community:"Asokore",          address:"Asokore Main St",  nationality:"Ghanaian", tribe:"Fante",   religion:"Muslim",    region:"Eastern", district:"Kwahu West",      city:"Asokore",  area:"Asokore",         physicalDesc:"Near the mosque",         occupation:"Artisan",    employment:"Employed",   education:"Tertiary", component:3, status:"Active",    disability:"N/A",                 assignedTo:3, enrollDate:"2024-02-01", health:"Good",   vulnOnArrival:"No",  height:"175cm", weight:"72kg", ghanaCard:"GHA-000333444-2", medCondition:"None",            family:"Married with one child",                          background:"Skilled carpenter.",                          lastFollowUp:"2024-05-15", posts:[] },
  { id:4,  bid:"LYSBF-004", name:"Ama Frimpong",    age:17, gender:"Female", dob:"2007-05-03", community:"Oyoko",            address:"Oyoko Road",       nationality:"Ghanaian", tribe:"Ashanti", religion:"Christian", region:"Eastern", district:"New Juaben South", city:"Oyoko",    area:"Oyoko",           physicalDesc:"Near the school",         occupation:"Student",    employment:"Unemployed", education:"JHS",      component:4, status:"Active",    disability:"N/A",                 assignedTo:2, enrollDate:"2024-02-10", health:"Fair",   vulnOnArrival:"Yes", height:"155cm", weight:"48kg", ghanaCard:"",                medCondition:"Mild anaemia",    family:"Orphan — lives with aunt",                        background:"Lost both parents early.",                    lastFollowUp:"2024-05-10", posts:[{id:1,date:"2024-05-10",author:"Kofi Mensah",text:"Scholarship support provided."}] },
  { id:5,  bid:"LYSBF-005", name:"Yaw Darko",       age:30, gender:"Male",   dob:"1994-09-18", community:"Kukurantumi",      address:"Old Road, Kukur.", nationality:"Ghanaian", tribe:"Akan",    religion:"Christian", region:"Eastern", district:"Atiwa West",      city:"Kukurantumi",area:"Old Road",       physicalDesc:"Near the market",         occupation:"Unemployed", employment:"Unemployed", education:"SHS",      component:5, status:"Completed", disability:"Hearing/Speech",      assignedTo:3, enrollDate:"2023-11-01", health:"Chronic", vulnOnArrival:"Yes", height:"168cm", weight:"62kg", ghanaCard:"GHA-000555666-4", medCondition:"Hearing impairment", family:"Single",                                         background:"Struggled with disability stigma.",           lastFollowUp:"2024-04-30", posts:[] },
  { id:6,  bid:"LYSBF-006", name:"Akosua Mensah",   age:28, gender:"Female", dob:"1996-02-14", community:"Old Estate",       address:"New Site, Estate", nationality:"Ghanaian", tribe:"Ewe",     religion:"Christian", region:"Eastern", district:"New Juaben North", city:"Koforidua", area:"Old Estate",     physicalDesc:"Near the estate road",    occupation:"Seamstress", employment:"Employed",   education:"Vocational",component:6, status:"Active",    disability:"Orthopedic/Physical", assignedTo:2, enrollDate:"2024-01-05", health:"Managed",vulnOnArrival:"Yes", height:"158cm", weight:"54kg", ghanaCard:"GHA-000666777-5", medCondition:"Mobility limitation", family:"Both parents present",                           background:"Resilient despite physical disability.",      lastFollowUp:"2024-05-22", posts:[{id:1,date:"2024-05-22",author:"Kofi Mensah",text:"Disability inclusion workshop attended."}] },
  { id:7,  bid:"LYSBF-007", name:"Fiifi Agyeman",   age:21, gender:"Male",   dob:"2003-12-01", community:"Zongo",            address:"Zongo Line",       nationality:"Ghanaian", tribe:"Dagomba", religion:"Muslim",    region:"Eastern", district:"New Juaben North", city:"Koforidua", area:"Zongo",          physicalDesc:"Near the mosque",         occupation:"Student",    employment:"Unemployed", education:"SHS",      component:7, status:"Active",    disability:"N/A",                 assignedTo:3, enrollDate:"2024-03-01", health:"Good",   vulnOnArrival:"No",  height:"172cm", weight:"68kg", ghanaCard:"GHA-000777888-6", medCondition:"None",            family:"Both parents present",                            background:"Active community member.",                    lastFollowUp:"2024-05-05", posts:[] },
  { id:8,  bid:"LYSBF-008", name:"Efua Boampong",   age:24, gender:"Female", dob:"2000-08-25", community:"Suhum",            address:"Suhum Central",    nationality:"Ghanaian", tribe:"Kwahu",   religion:"Christian", region:"Eastern", district:"Suhum",           city:"Suhum",    area:"Central",         physicalDesc:"Near Suhum Hospital",     occupation:"Nurse aide", employment:"Employed",   education:"Tertiary", component:5, status:"Active",    disability:"N/A",                 assignedTo:2, enrollDate:"2024-02-20", health:"Good",   vulnOnArrival:"No",  height:"160cm", weight:"56kg", ghanaCard:"GHA-000888999-7", medCondition:"None",            family:"Married",                                         background:"Healthcare motivated.",                       lastFollowUp:"2024-05-19", posts:[] },
];

// ── Helpers ───────────────────────────────────────────────────
const AVATAR_COLORS = [T.coral, T.slate, T.greenM, T.gold, T.purple, T.teal, "#C05621"];
function avatarColor(name) { let h=0; for(let c of name) h=(h*31+c.charCodeAt(0))%AVATAR_COLORS.length; return AVATAR_COLORS[h]; }
function initials(name) { return name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(); }
function statusPill(s) {
  if(s==="Active")    return {bg:"#C6F6D5",color:"#276749"};
  if(s==="Completed") return {bg:"#BEE3F8",color:"#2B6CB0"};
  return {bg:"#FEFCBF",color:"#B7791F"};
}
function today() { return new Date().toISOString().slice(0,10); }

// ── Reusable UI ───────────────────────────────────────────────
const Pill = ({s}) => { const {bg,color}=statusPill(s); return <span style={{background:bg,color,padding:"3px 12px",borderRadius:20,fontSize:11,fontWeight:700,display:"inline-block"}}>{s}</span>; };
const Label = ({children}) => <div style={{fontSize:11,fontWeight:700,color:T.slate,textTransform:"uppercase",letterSpacing:0.8,marginBottom:5}}>{children}</div>;
const FieldBox = ({value}) => <div style={{background:T.off,border:`1px solid ${T.greyM}`,borderRadius:8,padding:"9px 14px",fontSize:13,color:T.navy,minHeight:38}}>{value||"—"}</div>;
const Btn = ({children,onClick,variant="primary",small,style:sx}) => {
  const base = {padding:small?"6px 14px":"10px 22px",borderRadius:8,border:"none",cursor:"pointer",fontSize:small?12:13,fontWeight:700,fontFamily:"'Source Sans 3',sans-serif",transition:"all 0.18s",...sx};
  const v = variant==="primary"?{background:T.coral,color:T.white}:variant==="navy"?{background:T.navy,color:T.white}:variant==="green"?{background:T.greenM,color:T.white}:{background:T.off,color:T.navy,border:`1px solid ${T.greyM}`};
  return <button className="btn-hover" style={{...base,...v}} onClick={onClick}>{children}</button>;
};
const SectionHead = ({children}) => (
  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
    <span style={{fontSize:12,fontWeight:700,color:T.slate,textTransform:"uppercase",letterSpacing:2}}>{children}</span>
    <div style={{flex:1,height:1,background:T.greyM}}/>
  </div>
);
const FormInput = ({label,value,onChange,type="text",options,full,readOnly,placeholder}) => (
  <div style={{display:"flex",flexDirection:"column",gap:5,...(full?{gridColumn:"1/-1"}:{})}}>
    <Label>{label}</Label>
    {options
      ? <select value={value} onChange={e=>onChange&&onChange(e.target.value)} disabled={readOnly}
          style={{border:`1px solid ${T.greyM}`,borderRadius:8,padding:"9px 14px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",background:readOnly?T.off:T.white,color:T.navy}}>
          {options.map(o=><option key={o}>{o}</option>)}
        </select>
      : type==="textarea"
        ? <textarea value={value} onChange={e=>onChange&&onChange(e.target.value)} readOnly={readOnly} placeholder={placeholder||""}
            style={{border:`1px solid ${T.greyM}`,borderRadius:8,padding:"9px 14px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",background:readOnly?T.off:T.white,color:T.navy,minHeight:80,resize:"vertical"}}/>
        : <input type={type} value={value||""} onChange={e=>onChange&&onChange(e.target.value)} readOnly={readOnly} placeholder={placeholder||""}
            style={{border:`1px solid ${T.greyM}`,borderRadius:8,padding:"9px 14px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",background:readOnly?T.off:T.white,color:T.navy}}/>
    }
  </div>
);

// ══════════════════════════════════════════════════════════════
//  LOGIN
// ══════════════════════════════════════════════════════════════
function Login({onLogin,users,appName,logoUrl}) {
  const [email,setEmail]=useState(""); const [pass,setPass]=useState(""); const [err,setErr]=useState("");
  function go() {
    const u=users.find(u=>u.email.toLowerCase()===email.toLowerCase()&&u.password===pass);
    if(u){setErr("");onLogin(u);}else setErr("Invalid email or password.");
  }
  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(135deg,${T.navy} 0%,${T.slate} 55%,${T.navyMid} 100%)`,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:T.white,borderRadius:20,padding:"44px 40px",width:400,boxShadow:"0 24px 64px rgba(0,0,0,0.35)"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          {logoUrl
            ? <img src={logoUrl} alt="logo" style={{width:60,height:60,objectFit:"contain",marginBottom:10}}/>
            : <OGBLogo size={60}/>}
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,color:T.navy,marginTop:10}}>{appName||"OGB App"}</div>
          <div style={{fontSize:12,color:T.grey,marginTop:4}}>LYSBF · Community Youth Empowerment Programme</div>
        </div>
        {err&&<div style={{background:T.redL,color:T.red,borderRadius:8,padding:"10px 14px",fontSize:13,marginBottom:14,textAlign:"center"}}>{err}</div>}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <input placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} type="email" onKeyDown={e=>e.key==="Enter"&&go()}
            style={{border:`1.5px solid ${T.greyM}`,borderRadius:10,padding:"12px 16px",fontSize:14,fontFamily:"'Source Sans 3',sans-serif",color:T.navy,width:"100%"}}/>
          <input placeholder="Password" value={pass} onChange={e=>setPass(e.target.value)} type="password" onKeyDown={e=>e.key==="Enter"&&go()}
            style={{border:`1.5px solid ${T.greyM}`,borderRadius:10,padding:"12px 16px",fontSize:14,fontFamily:"'Source Sans 3',sans-serif",color:T.navy,width:"100%"}}/>
          <button onClick={go} style={{background:T.coral,color:T.white,border:"none",borderRadius:10,padding:"13px",fontSize:15,fontWeight:700,fontFamily:"'Source Sans 3',sans-serif",cursor:"pointer",marginTop:4}}>Sign In →</button>
        </div>
        <div style={{marginTop:20,padding:"12px 14px",background:T.off,borderRadius:8,fontSize:11,color:T.grey,lineHeight:1.6}}>
          <strong>Demo:</strong> admin@ogb.org / admin123<br/>Officer: kofi@ogb.org / pass123
        </div>
      </div>
    </div>
  );
}

// ── Logo SVG ──────────────────────────────────────────────────
function OGBLogo({size=40,color=T.navy}) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path d="M50 18 C44 8 28 4 18 14 C8 24 10 42 22 50 C10 58 8 76 18 86 C28 96 44 92 50 82 C56 92 72 96 82 86 C92 76 90 58 78 50 C90 42 92 24 82 14 C72 4 56 8 50 18Z"
        stroke={color} strokeWidth="6" fill="none" strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx="50" cy="13" r="4" fill={color}/>
      <circle cx="50" cy="87" r="4" fill={color}/>
      <circle cx="13" cy="50" r="4" fill={color}/>
      <circle cx="87" cy="50" r="4" fill={color}/>
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════
//  SIDEBAR
// ══════════════════════════════════════════════════════════════
function Sidebar({user,page,setPage,onLogout,appName,logoUrl}) {
  const [benOpen,setBen]=useState(true);
  const [sirOpen,setSir]=useState(false);

  const NavItem=({label,icon,p,sub})=>(<div className={sub?"nav-sub":"nav-item"} onClick={()=>setPage(p)}
    style={{display:"flex",alignItems:"center",gap:9,padding:sub?"7px 12px 7px 40px":"10px 14px",borderRadius:8,cursor:"pointer",marginBottom:2,color:page===p?"#fff":"rgba(255,255,255,0.7)",fontWeight:page===p?700:400,fontSize:sub?12:13,background:page===p?(sub?"rgba(255,107,107,0.3)":"rgba(255,255,255,0.14)"):"transparent",transition:"all 0.18s",fontFamily:"'Source Sans 3',sans-serif"}}>
    <span style={{fontSize:sub?14:16,minWidth:18,textAlign:"center"}}>{icon}</span><span>{label}</span>
  </div>);

  const Group=({label,icon,open,setOpen,children})=>(<>
    <div className="nav-item" onClick={()=>setOpen(!open)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderRadius:8,cursor:"pointer",color:"rgba(255,255,255,0.78)",fontSize:13,marginBottom:2,transition:"all 0.18s",fontFamily:"'Source Sans 3',sans-serif"}}>
      <span style={{display:"flex",alignItems:"center",gap:9}}><span style={{fontSize:16,minWidth:18,textAlign:"center"}}>{icon}</span><span>{label}</span></span>
      <span style={{fontSize:10,opacity:0.6}}>{open?"▲":"▼"}</span>
    </div>
    {open&&children}
  </>);

  return (
    <div style={{width:248,minHeight:"100vh",background:`linear-gradient(180deg,${T.navy} 0%,${T.slate} 100%)`,display:"flex",flexDirection:"column",flexShrink:0,position:"fixed",top:0,left:0,bottom:0,zIndex:100,overflowY:"auto"}}>
      {/* Brand */}
      <div style={{padding:"22px 18px 16px",borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {logoUrl?<img src={logoUrl} alt="logo" style={{width:36,height:36,objectFit:"contain",borderRadius:6}}/>:<OGBLogo size={36} color={T.white}/>}
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:T.white}}>{appName||"OGB App"}</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.45)",letterSpacing:2,textTransform:"uppercase"}}>LYSBF · CYEP</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{padding:"14px 10px",flex:1}}>
        <NavItem label="Dashboard" icon="📊" p="dashboard"/>
        <Group label="Beneficiaries" icon="👥" open={benOpen} setOpen={setBen}>
          <NavItem label="List" icon="📋" p="ben-list" sub/>
          <NavItem label="Add" icon="➕" p="ben-add" sub/>
        </Group>
        <Group label="SIR" icon="📄" open={sirOpen} setOpen={setSir}>
          <NavItem label="List" icon="📋" p="sir-list" sub/>
          <NavItem label="Add" icon="➕" p="sir-add" sub/>
          <NavItem label="Archive" icon="🗄" p="sir-archive" sub/>
        </Group>
        <NavItem label="Posts" icon="📝" p="posts"/>
        {user.role==="Admin"&&<>
          <div style={{margin:"14px 0 6px",padding:"0 14px",fontSize:10,color:"rgba(255,255,255,0.35)",letterSpacing:2,textTransform:"uppercase"}}>Admin</div>
          <NavItem label="User Management" icon="🔐" p="users"/>
          <NavItem label="Settings" icon="⚙️" p="settings"/>
        </>}
      </div>

      {/* User */}
      <div style={{padding:"14px 16px",borderTop:"1px solid rgba(255,255,255,0.1)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:T.coral,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:T.white,flexShrink:0}}>{user.avatar}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:T.white,fontSize:12,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name}</div>
            <div style={{fontSize:10,color:"rgba(255,107,107,0.9)",background:"rgba(255,107,107,0.18)",padding:"2px 8px",borderRadius:20,display:"inline-block",marginTop:2}}>{user.role}</div>
          </div>
          <span onClick={onLogout} title="Sign out" style={{color:"rgba(255,255,255,0.35)",cursor:"pointer",fontSize:18,lineHeight:1}}>⇠</span>
        </div>
      </div>
    </div>
  );
}

// ── Topbar ────────────────────────────────────────────────────
function Topbar({title,sub}) {
  return (
    <div style={{background:T.white,borderBottom:`1px solid ${T.greyM}`,padding:"0 32px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
      <div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:19,fontWeight:700,color:T.navy}}>{title}</div>
        {sub&&<div style={{fontSize:12,color:T.grey}}>{sub}</div>}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:36,height:36,borderRadius:"50%",background:T.off,border:`1px solid ${T.greyM}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:16}}>🔔</div>
        <div style={{fontSize:12,color:T.grey}}>{new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════════════
function Dashboard({bens,user,components}) {
  const vis = user.role==="Admin"?bens:bens.filter(b=>b.assignedTo===user.id);
  const stats = [
    {label:"Total Beneficiaries",v:vis.length,       icon:"👥",color:T.navy},
    {label:"Active",             v:vis.filter(b=>b.status==="Active").length,    icon:"✅",color:T.greenM},
    {label:"Completed",          v:vis.filter(b=>b.status==="Completed").length,  icon:"🏁",color:T.blue},
    {label:"Male",               v:vis.filter(b=>b.gender==="Male").length,       icon:"♂",color:T.slate},
    {label:"Female",             v:vis.filter(b=>b.gender==="Female").length,     icon:"♀",color:T.coral},
  ];
  return (
    <div className="fade-in">
      <Topbar title="Dashboard" sub="View current tasks, activities and reports"/>
      <div style={{padding:"28px 32px"}}>
        <SectionHead>Programme Summary at a Glance</SectionHead>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:14,marginBottom:32}}>
          {stats.map(s=>(
            <div key={s.label} style={{background:T.white,borderRadius:12,padding:"18px 16px",textAlign:"center",boxShadow:"0 1px 6px rgba(0,0,0,0.07)",border:`1px solid ${T.greyM}`}}>
              <div style={{fontSize:24,marginBottom:6}}>{s.icon}</div>
              <div style={{fontSize:30,fontWeight:700,color:s.color,fontFamily:"'Playfair Display',serif"}}>{s.v}</div>
              <div style={{fontSize:11,color:T.grey,marginTop:3,textTransform:"uppercase",letterSpacing:0.8}}>{s.label}</div>
            </div>
          ))}
        </div>

        <SectionHead>Beneficiaries by Programme Component</SectionHead>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16}}>
          {components.map(c=>{
            const count=vis.filter(b=>b.component===c.id).length;
            return (
              <div key={c.id} className="card-hover" style={{borderRadius:14,padding:"22px 18px",background:`linear-gradient(145deg,${c.color} 0%,${c.color}DD 100%)`,color:T.white,cursor:"pointer",boxShadow:"0 3px 10px rgba(0,0,0,0.12)",transition:"all 0.22s"}}>
                <div style={{fontSize:36,marginBottom:8,display:"block"}}>{c.icon}</div>
                <div style={{fontSize:11,fontWeight:700,opacity:0.88,lineHeight:1.4,marginBottom:8}}>{c.name}</div>
                <div style={{fontSize:42,fontWeight:700,fontFamily:"'Playfair Display',serif",lineHeight:1}}>{count}</div>
                <div style={{fontSize:11,opacity:0.75,marginTop:4}}>Total Beneficiaries</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  BENEFICIARY LIST
// ══════════════════════════════════════════════════════════════
function BenList({bens,user,components,users,onView,onEdit,onSIR}) {
  const [search,setSearch]=useState("");
  const [compF,setCompF]=useState("all");
  const [commF,setCommF]=useState("all");
  const [statF,setStatF]=useState("all");
  const [followF,setFollowF]=useState("all");
  const [sort,setSort]=useState("name-asc");

  const communities=[...new Set(INIT_BENS.map(b=>b.community))].sort();
  const vis=(user.role==="Admin"?bens:bens.filter(b=>b.assignedTo===user.id))
    .filter(b=>
      (!search||b.name.toLowerCase().includes(search.toLowerCase())||b.bid.includes(search))&&
      (compF==="all"||b.component===Number(compF))&&
      (commF==="all"||b.community===commF)&&
      (statF==="all"||b.status===statF)&&
      (followF==="all"||(followF==="recent"&&b.lastFollowUp>=today().slice(0,7))||(followF==="overdue"&&b.lastFollowUp<today().slice(0,7)))
    )
    .sort((a,b2)=>{
      if(sort==="name-asc") return a.name.localeCompare(b2.name);
      if(sort==="name-desc") return b2.name.localeCompare(a.name);
      if(sort==="updated-desc") return (b2.lastFollowUp||"").localeCompare(a.lastFollowUp||"");
      if(sort==="updated-asc") return (a.lastFollowUp||"").localeCompare(b2.lastFollowUp||"");
      if(sort==="enrolled-desc") return (b2.enrollDate||"").localeCompare(a.enrollDate||"");
      return 0;
    });

  const comp=id=>components.find(c=>c.id===id);
  const officer=id=>users.find(u=>u.id===id)?.name||"Unassigned";

  return (
    <div className="fade-in">
      <Topbar title="Beneficiaries" sub="View and manage all beneficiary profiles"/>
      <div style={{padding:"24px 32px"}}>
        {/* Filters row */}
        <div style={{background:T.white,borderRadius:12,padding:"16px 20px",marginBottom:20,boxShadow:"0 1px 4px rgba(0,0,0,0.06)",border:`1px solid ${T.greyM}`}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:10,alignItems:"flex-end"}}>
            <div style={{flex:"1 1 200px"}}>
              <Label>Search</Label>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name or Beneficiary ID..."
                style={{width:"100%",border:`1px solid ${T.greyM}`,borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",color:T.navy}}/>
            </div>
            <div style={{flex:"1 1 160px"}}>
              <Label>Component</Label>
              <select value={compF} onChange={e=>setCompF(e.target.value)} style={{width:"100%",border:`1px solid ${T.greyM}`,borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",color:T.navy}}>
                <option value="all">All Components</option>
                {components.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div style={{flex:"1 1 140px"}}>
              <Label>Community</Label>
              <select value={commF} onChange={e=>setCommF(e.target.value)} style={{width:"100%",border:`1px solid ${T.greyM}`,borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",color:T.navy}}>
                <option value="all">All Communities</option>
                {communities.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{flex:"1 1 130px"}}>
              <Label>Status</Label>
              <select value={statF} onChange={e=>setStatF(e.target.value)} style={{width:"100%",border:`1px solid ${T.greyM}`,borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",color:T.navy}}>
                <option value="all">All Statuses</option>
                <option>Active</option><option>Completed</option><option>On Hold</option>
              </select>
            </div>
            <div style={{flex:"1 1 130px"}}>
              <Label>Last Follow-Up</Label>
              <select value={followF} onChange={e=>setFollowF(e.target.value)} style={{width:"100%",border:`1px solid ${T.greyM}`,borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",color:T.navy}}>
                <option value="all">Any time</option>
                <option value="recent">This month</option>
                <option value="overdue">Past months</option>
              </select>
            </div>
            <div style={{flex:"1 1 150px"}}>
              <Label>Sort By</Label>
              <select value={sort} onChange={e=>setSort(e.target.value)} style={{width:"100%",border:`1px solid ${T.greyM}`,borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",color:T.navy}}>
                <option value="name-asc">Name A → Z</option>
                <option value="name-desc">Name Z → A</option>
                <option value="updated-desc">Last Updated ↓</option>
                <option value="updated-asc">Last Updated ↑</option>
                <option value="enrolled-desc">Newest Enrolled</option>
              </select>
            </div>
            <Btn variant="secondary" onClick={()=>{setSearch("");setCompF("all");setCommF("all");setStatF("all");setFollowF("all");setSort("name-asc");}}>Clear</Btn>
          </div>
          <div style={{marginTop:10,fontSize:12,color:T.grey}}>Showing <strong>{vis.length}</strong> record{vis.length!==1?"s":""}</div>
        </div>

        {/* Table */}
        <div style={{background:T.white,borderRadius:12,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",border:`1px solid ${T.greyM}`}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{background:T.off,borderBottom:`2px solid ${T.greyM}`}}>
                {["Beneficiary","Component","Community","Assigned Officer","Last Follow-Up","Status","Actions"].map(h=>(
                  <th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:11,fontWeight:700,color:T.slate,textTransform:"uppercase",letterSpacing:0.8}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vis.map((b,i)=>{
                const c=comp(b.component);
                return (
                  <tr key={b.id} className="row-hover" style={{background:i%2===0?T.white:T.off,borderBottom:`1px solid ${T.greyL}`,transition:"background 0.15s"}}>
                    <td style={{padding:"13px 16px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:38,height:38,borderRadius:"50%",background:avatarColor(b.name),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:T.white,flexShrink:0}}>{initials(b.name)}</div>
                        <div>
                          <div style={{fontWeight:700,fontSize:13,color:T.navy}}>{b.name}</div>
                          <div style={{fontSize:11,color:T.grey}}>Age {b.age} · {b.gender} · {b.bid}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{padding:"13px 16px"}}>
                      {c&&<span style={{background:c.light,color:c.color,padding:"4px 10px",borderRadius:20,fontSize:11,fontWeight:700,display:"inline-flex",alignItems:"center",gap:4}}><span>{c.icon}</span><span>{c.name.split(" ")[0]}</span></span>}
                    </td>
                    <td style={{padding:"13px 16px",fontSize:12,color:T.navy}}>{b.community}</td>
                    <td style={{padding:"13px 16px",fontSize:12,color:T.navy}}>{officer(b.assignedTo)}</td>
                    <td style={{padding:"13px 16px",fontSize:12,color:b.lastFollowUp?T.red:T.grey,fontWeight:b.lastFollowUp?600:400}}>{b.lastFollowUp||"Not yet"}</td>
                    <td style={{padding:"13px 16px"}}><Pill s={b.status}/></td>
                    <td style={{padding:"13px 16px"}}>
                      <div style={{display:"flex",gap:5}}>
                        <button className="action-btn" onClick={()=>onView(b)} title="View Profile" style={{padding:"5px 11px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:"#EBF8FF",color:T.blue,transition:"filter 0.15s"}}>👁 View</button>
                        {(user.role==="Admin"||b.assignedTo===user.id)&&
                          <button className="action-btn" onClick={()=>onEdit(b)} title="Edit" style={{padding:"5px 11px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:"#C6F6D5",color:T.greenM,transition:"filter 0.15s"}}>✏️ Edit</button>}
                        <button className="action-btn" onClick={()=>onSIR(b)} title="Social Inquiry Report" style={{padding:"5px 11px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:"#FEFCBF",color:T.gold,transition:"filter 0.15s"}}>📋 SIR</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {vis.length===0&&<tr><td colSpan={7} style={{padding:44,textAlign:"center",color:T.grey,fontSize:14}}>No beneficiaries found matching your filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  SIR (Social Inquiry Report) — printable
// ══════════════════════════════════════════════════════════════
function SIRView({ben,components,users,onBack,onPrint}) {
  if(!ben) return (
    <div className="fade-in">
      <Topbar title="Social Inquiry Reports" sub="Formal case assessment reports"/>
      <div style={{padding:"32px",textAlign:"center",color:T.grey}}>
        <div style={{fontSize:48,marginBottom:12}}>📋</div>
        <div style={{fontSize:16,fontWeight:700,color:T.navy,marginBottom:6}}>No beneficiary selected</div>
        <div>Open a beneficiary profile and click SIR to generate a report.</div>
      </div>
    </div>
  );
  const comp=components.find(c=>c.id===ben.component);
  const officer=users.find(u=>u.id===ben.assignedTo);
  return (
    <div className="fade-in">
      <Topbar title="Social Inquiry Report" sub={`${ben.name} · ${ben.bid}`}/>
      <div style={{padding:"24px 32px"}}>
        <div className="no-print" style={{display:"flex",gap:10,marginBottom:20}}>
          <Btn variant="secondary" onClick={onBack}>← Back</Btn>
          <Btn variant="navy" onClick={()=>window.print()}>🖨 Print as PDF</Btn>
        </div>

        {/* Printable SIR */}
        <div id="sir-print" style={{background:T.white,borderRadius:12,padding:"36px 40px",boxShadow:"0 2px 12px rgba(0,0,0,0.08)",maxWidth:800,margin:"0 auto"}}>
          {/* Header */}
          <div style={{textAlign:"center",borderBottom:`2px solid ${T.navy}`,paddingBottom:20,marginBottom:24}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:T.navy}}>LAWYER YAW SARPONG BOATENG FOUNDATION</div>
            <div style={{fontSize:13,color:T.slate,marginTop:4}}>Community Youth Empowerment Programme (CYEP)</div>
            <div style={{fontSize:16,fontWeight:700,color:T.coral,marginTop:10,textTransform:"uppercase",letterSpacing:2}}>Social Inquiry Report</div>
            <div style={{fontSize:12,color:T.grey,marginTop:4}}>Confidential Document — For Official Use Only</div>
          </div>

          {/* Report meta */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:24,padding:"12px 16px",background:T.off,borderRadius:8}}>
            {[["Report Date",today()],["Beneficiary ID",ben.bid],["Programme Component",`${comp?.icon} ${comp?.name}`],["Assigned Officer",officer?.name||"—"],["Status",ben.status],["Enrolment Date",ben.enrollDate]].map(([l,v])=>(
              <div key={l} style={{fontSize:12}}><span style={{color:T.grey,fontWeight:700}}>{l}: </span><span style={{color:T.navy}}>{v}</span></div>
            ))}
          </div>

          {/* Section 1: Basic Demographics */}
          <div style={{marginBottom:24}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:T.navy,borderLeft:`4px solid ${T.coral}`,paddingLeft:12,marginBottom:14}}>1. Basic Demographic Information</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[["Full Name",ben.name],["Date of Birth",ben.dob],["Age",ben.age],["Gender",ben.gender],["Nationality",ben.nationality],["Tribe / Ethnicity",ben.tribe],["Religion",ben.religion],["Region",ben.region],["District",ben.district],["City / Village",ben.city],["Area / Suburb",ben.area],["Physical Location",ben.physicalDesc]].map(([l,v])=>(
                <div key={l}>
                  <div style={{fontSize:10,fontWeight:700,color:T.grey,textTransform:"uppercase",letterSpacing:0.6,marginBottom:3}}>{l}</div>
                  <div style={{fontSize:13,color:T.navy,borderBottom:`1px solid ${T.greyL}`,paddingBottom:4}}>{v||"—"}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Family Background */}
          <div style={{marginBottom:24}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:T.navy,borderLeft:`4px solid ${T.coral}`,paddingLeft:12,marginBottom:14}}>2. Family Background</div>
            <div style={{fontSize:13,color:T.navy,lineHeight:1.7,padding:"12px 16px",background:T.off,borderRadius:8,borderLeft:`3px solid ${T.greyM}`}}>{ben.family||"—"}</div>
          </div>

          {/* Section 3: Background Information */}
          <div style={{marginBottom:24}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:T.navy,borderLeft:`4px solid ${T.coral}`,paddingLeft:12,marginBottom:14}}>3. Background Information</div>
            <div style={{fontSize:13,color:T.navy,lineHeight:1.7,padding:"12px 16px",background:T.off,borderRadius:8,borderLeft:`3px solid ${T.greyM}`}}>{ben.background||"—"}</div>
          </div>

          {/* Section 4: Education & Employment */}
          <div style={{marginBottom:24}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:T.navy,borderLeft:`4px solid ${T.coral}`,paddingLeft:12,marginBottom:14}}>4. Education & Employment</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[["Education Level",ben.education],["Occupation",ben.occupation],["Employment Status",ben.employment]].map(([l,v])=>(
                <div key={l}>
                  <div style={{fontSize:10,fontWeight:700,color:T.grey,textTransform:"uppercase",letterSpacing:0.6,marginBottom:3}}>{l}</div>
                  <div style={{fontSize:13,color:T.navy,borderBottom:`1px solid ${T.greyL}`,paddingBottom:4}}>{v||"—"}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Health */}
          <div style={{marginBottom:24}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:T.navy,borderLeft:`4px solid ${T.coral}`,paddingLeft:12,marginBottom:14}}>5. Health Information</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[["Vulnerability on Arrival",ben.vulnOnArrival],["Health Status",ben.health],["Height",ben.height],["Weight",ben.weight],["Ghana Card / NHIS No.",ben.ghanaCard],["Disability Status",ben.disability],["Medical Condition",ben.medCondition]].map(([l,v])=>(
                <div key={l}>
                  <div style={{fontSize:10,fontWeight:700,color:T.grey,textTransform:"uppercase",letterSpacing:0.6,marginBottom:3}}>{l}</div>
                  <div style={{fontSize:13,color:T.navy,borderBottom:`1px solid ${T.greyL}`,paddingBottom:4}}>{v||"—"}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: Follow-up Notes */}
          <div style={{marginBottom:24}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:T.navy,borderLeft:`4px solid ${T.coral}`,paddingLeft:12,marginBottom:14}}>6. Follow-Up Notes</div>
            {ben.posts.length===0
              ? <div style={{color:T.grey,fontSize:13}}>No follow-up notes recorded.</div>
              : ben.posts.map((p,i)=>(
                <div key={i} style={{marginBottom:12,padding:"10px 14px",background:T.off,borderRadius:8,borderLeft:`3px solid ${T.coral}`}}>
                  <div style={{fontSize:11,color:T.grey,marginBottom:4}}>Date: {p.date} | Officer: {p.author}</div>
                  <div style={{fontSize:13,color:T.navy,lineHeight:1.6}}>{p.text}</div>
                </div>
              ))
            }
          </div>

          {/* Signature */}
          <div style={{marginTop:32,paddingTop:20,borderTop:`1px solid ${T.greyM}`,display:"grid",gridTemplateColumns:"1fr 1fr",gap:40}}>
            {["Prepared by (Programme Officer)","Verified by (Coordinator)"].map(l=>(
              <div key={l}>
                <div style={{fontSize:11,color:T.grey,marginBottom:24}}>{l}</div>
                <div style={{borderTop:`1px solid ${T.navy}`,paddingTop:6,fontSize:11,color:T.grey}}>Signature & Date</div>
              </div>
            ))}
          </div>
          <div style={{textAlign:"center",marginTop:20,fontSize:10,color:T.grey}}>LYSBF CYEP · Confidential · {today()}</div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  CLIENT PROFILE
// ══════════════════════════════════════════════════════════════
const TABS=[
  {k:"basic",    label:"Basic Info",     icon:"👤"},
  {k:"programme",label:"Programme",      icon:"📌"},
  {k:"health",   label:"Health",         icon:"❤️"},
  {k:"education",label:"Education",      icon:"🎓"},
  {k:"family",   label:"Family",         icon:"🏠"},
  {k:"employment",label:"Employment",    icon:"💼"},
  {k:"disability",label:"Disability",    icon:"♿"},
  {k:"followups",label:"Follow-Ups",     icon:"📝"},
  {k:"documents",label:"Documents",      icon:"📁"},
];

function Profile({ben,user,components,users,onBack,onAddPost,onSIR}) {
  const [tab,setTab]=useState("basic");
  const comp=components.find(c=>c.id===ben.component);
  const officer=users.find(u=>u.id===ben.assignedTo);
  const canEdit=user.role==="Admin"||ben.assignedTo===user.id;

  return (
    <div className="fade-in">
      <Topbar title={ben.name} sub={`Profile · ${ben.bid}`}/>
      <div style={{padding:"24px 32px"}}>
        <div className="no-print" style={{display:"flex",gap:10,marginBottom:20}}>
          <Btn variant="secondary" onClick={onBack}>← Back to List</Btn>
          <Btn variant="navy" onClick={()=>onSIR(ben)}>📋 Generate SIR</Btn>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:20}}>
          {/* Left card */}
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{background:T.white,borderRadius:14,overflow:"hidden",boxShadow:"0 2px 10px rgba(0,0,0,0.08)"}}>
              <div style={{background:`linear-gradient(135deg,${comp?.color||T.navy}22,${comp?.color||T.navy}11)`,padding:"28px 20px",textAlign:"center"}}>
                <div style={{width:70,height:70,borderRadius:"50%",background:avatarColor(ben.name),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:24,color:T.white,margin:"0 auto 12px"}}>{initials(ben.name)}</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:19,fontWeight:700,color:T.navy}}>{ben.name}</div>
                <div style={{fontSize:12,color:T.grey,marginTop:3}}>{comp?.icon} {comp?.name}</div>
                <div style={{marginTop:10}}><Pill s={ben.status}/></div>
              </div>
              <div style={{padding:"0 20px 20px"}}>
                {[["Beneficiary ID",ben.bid],["Age / Gender",`${ben.age} · ${ben.gender}`],["Community",ben.community],["Enrolled",ben.enrollDate],["Officer",officer?.name||"—"]].map(([l,v])=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${T.greyL}`}}>
                    <span style={{fontSize:11,fontWeight:700,color:T.grey}}>{l}</span>
                    <span style={{fontSize:12,color:T.navy,textAlign:"right",maxWidth:160}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div style={{background:T.white,borderRadius:14,padding:"18px 20px",boxShadow:"0 2px 10px rgba(0,0,0,0.08)"}}>
              <div style={{fontSize:12,fontWeight:700,color:T.slate,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>History of Movement</div>
              {[{date:ben.enrollDate,loc:comp?.name||"Enrolled"},{date:"Initial Registration",loc:"LYSBF CYEP"}].map((h,i,arr)=>(
                <div key={i} style={{display:"flex",gap:12,marginBottom:i<arr.length-1?14:0,position:"relative"}}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                    <div style={{width:12,height:12,borderRadius:"50%",background:T.greenM,border:`2px solid ${T.white}`,boxShadow:`0 0 0 2px ${T.greenM}`,flexShrink:0}}/>
                    {i<arr.length-1&&<div style={{width:2,height:24,background:T.greyM,margin:"3px 0"}}/>}
                  </div>
                  <div>
                    <div style={{fontSize:11,color:T.grey}}>{h.date}</div>
                    <div style={{fontSize:13,fontWeight:700,color:T.navy}}>{h.loc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right tabs */}
          <div>
            <div style={{display:"flex",flexWrap:"wrap",gap:4,background:T.off,borderRadius:10,padding:4,marginBottom:16}}>
              {TABS.map(t=>(
                <button key={t.k} className="tab-btn" onClick={()=>setTab(t.k)}
                  style={{padding:"8px 13px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontFamily:"'Source Sans 3',sans-serif",display:"flex",alignItems:"center",gap:5,transition:"all 0.18s",background:tab===t.k?T.white:"transparent",color:tab===t.k?T.navy:T.grey,fontWeight:tab===t.k?700:400,boxShadow:tab===t.k?"0 1px 4px rgba(0,0,0,0.10)":"none"}}>
                  <span>{t.icon}</span><span>{t.label}</span>
                </button>
              ))}
            </div>

            <div style={{background:T.white,borderRadius:12,padding:"24px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
              {tab==="basic"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                {[["Full Name",ben.name],["Date of Birth",ben.dob],["Age",ben.age],["Gender",ben.gender],["Nationality",ben.nationality],["Tribe / Ethnicity",ben.tribe],["Religion",ben.religion],["Community",ben.community],["Address",ben.address],["Region",ben.region],["District",ben.district],["City / Village",ben.city],["Area / Suburb",ben.area],["Physical Location",ben.physicalDesc]].map(([l,v])=>(
                  <div key={l} style={l==="Address"||l==="Physical Location"?{gridColumn:"1/-1"}:{}}>
                    <Label>{l}</Label><FieldBox value={v}/>
                  </div>
                ))}
              </div>}

              {tab==="programme"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                {[["Beneficiary ID",ben.bid],["Programme Component",`${comp?.icon} ${comp?.name}`],["Enrolment Date",ben.enrollDate],["Status",ben.status]].map(([l,v])=>(
                  <div key={l}><Label>{l}</Label><FieldBox value={v}/></div>
                ))}
              </div>}

              {tab==="health"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                {[["Vulnerability on Arrival",ben.vulnOnArrival],["Health Status",ben.health],["Height",ben.height],["Weight",ben.weight],["Ghana Card / NHIS No.",ben.ghanaCard],["Disability Status",ben.disability],["Medical Condition",ben.medCondition]].map(([l,v])=>(
                  <div key={l} style={l==="Medical Condition"?{gridColumn:"1/-1"}:{}}><Label>{l}</Label><FieldBox value={v}/></div>
                ))}
              </div>}

              {tab==="education"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                {[["Educational Level",ben.education]].map(([l,v])=>(
                  <div key={l}><Label>{l}</Label><FieldBox value={v}/></div>
                ))}
              </div>}

              {tab==="family"&&<div>
                <Label>Family Background</Label><FieldBox value={ben.family}/>
              </div>}

              {tab==="employment"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                {[["Occupation",ben.occupation],["Employment Status",ben.employment]].map(([l,v])=>(
                  <div key={l}><Label>{l}</Label><FieldBox value={v}/></div>
                ))}
              </div>}

              {tab==="disability"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                {[["Disability Status",ben.disability]].map(([l,v])=>(
                  <div key={l}><Label>{l}</Label><FieldBox value={v}/></div>
                ))}
              </div>}

              {tab==="followups"&&<div>
                {canEdit&&<Btn variant="primary" onClick={()=>onAddPost(ben)} style={{marginBottom:18}}>+ Add Follow-Up Note</Btn>}
                {ben.posts.length===0&&<div style={{color:T.grey,fontSize:13,textAlign:"center",padding:24}}>No follow-up notes yet.</div>}
                {[...ben.posts].reverse().map(p=>(
                  <div key={p.id} style={{background:T.off,borderRadius:10,padding:"14px 16px",marginBottom:12,borderLeft:`3px solid ${T.coral}`}}>
                    <div style={{fontSize:11,color:T.grey,marginBottom:6}}>📅 {p.date} · ✍️ {p.author}</div>
                    <div style={{fontSize:13,color:T.navy,lineHeight:1.6}}>{p.text}</div>
                  </div>
                ))}
              </div>}

              {tab==="documents"&&<div style={{textAlign:"center",padding:"36px 0"}}>
                <div style={{fontSize:44,marginBottom:12}}>📁</div>
                <div style={{color:T.grey,fontSize:14,marginBottom:16}}>No documents uploaded yet.</div>
                <Btn variant="primary">+ Upload Document</Btn>
                <div style={{fontSize:11,color:T.grey,marginTop:10}}>Accepted: PDF, JPG, PNG, DOCX (max 10MB)</div>
              </div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  ADD / EDIT BENEFICIARY
// ══════════════════════════════════════════════════════════════
function BenForm({user,edit,components,users,onSave,onCancel}) {
  const blank={bid:"",name:"",age:"",gender:"Male",dob:"",nationality:"Ghanaian",tribe:"",religion:"Christian",region:"Eastern",district:"",city:"",area:"",physicalDesc:"",address:"",community:"New Juaben North",occupation:"",employment:"Unemployed",education:"SHS",component:1,status:"Active",disability:"N/A",vulnOnArrival:"No",height:"",weight:"",ghanaCard:"",medCondition:"None",health:"Good",family:"",background:"",assignedTo:user.role==="Admin"?2:user.id,enrollDate:today()};
  const [f,setF]=useState(edit?{...edit}:blank);
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  const communities=["New Juaben North","Effiduase","Asokore","Oyoko","Kukurantumi","Old Estate","Zongo","Suhum","Akwadum","Dansuagya"];

  return (
    <div className="fade-in">
      <Topbar title={edit?"Edit Beneficiary":"Register New Beneficiary"} sub="Fill in all required fields"/>
      <div style={{padding:"24px 32px"}}>
        <Btn variant="secondary" onClick={onCancel} style={{marginBottom:20}}>← Cancel</Btn>
        <div style={{background:T.white,borderRadius:12,padding:"28px 32px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>

          <SectionHead>Basic Demographics</SectionHead>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:28}}>
            <FormInput label="Beneficiary ID" value={f.bid} onChange={v=>s("bid",v)} placeholder="e.g. LYSBF-009"/>
            <FormInput label="Full Name *" value={f.name} onChange={v=>s("name",v)}/>
            <FormInput label="Date of Birth" value={f.dob} onChange={v=>s("dob",v)} type="date"/>
            <FormInput label="Age" value={f.age} onChange={v=>s("age",v)} type="number"/>
            <FormInput label="Gender" value={f.gender} onChange={v=>s("gender",v)} options={["Male","Female"]}/>
            <FormInput label="Nationality" value={f.nationality} onChange={v=>s("nationality",v)}/>
            <FormInput label="Tribe / Ethnicity" value={f.tribe} onChange={v=>s("tribe",v)}/>
            <FormInput label="Religion" value={f.religion} onChange={v=>s("religion",v)} options={["Christian","Muslim","Traditional","Other"]}/>
            <FormInput label="Region" value={f.region} onChange={v=>s("region",v)}/>
            <FormInput label="District" value={f.district} onChange={v=>s("district",v)}/>
            <FormInput label="City / Village" value={f.city} onChange={v=>s("city",v)}/>
            <FormInput label="Area / Suburb" value={f.area} onChange={v=>s("area",v)}/>
            <FormInput label="Community" value={f.community} onChange={v=>s("community",v)} options={communities}/>
            <FormInput label="Full Address" value={f.address} onChange={v=>s("address",v)} full/>
            <FormInput label="Physical Location / Characteristics" value={f.physicalDesc} onChange={v=>s("physicalDesc",v)} full/>
          </div>

          <SectionHead>Programme Details</SectionHead>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:28}}>
            <FormInput label="Programme Component" value={f.component} onChange={v=>s("component",Number(v))} options={components.map(c=>`${c.id}`)}/>
            <FormInput label="Status" value={f.status} onChange={v=>s("status",v)} options={["Active","Completed","On Hold"]}/>
            <FormInput label="Enrolment Date" value={f.enrollDate} onChange={v=>s("enrollDate",v)} type="date"/>
            {user.role==="Admin"&&<FormInput label="Assign to Officer" value={f.assignedTo} onChange={v=>s("assignedTo",Number(v))} options={users.filter(u=>u.role!=="Admin").map(u=>`${u.id}`)}/>}
          </div>

          <SectionHead>Health Information</SectionHead>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:28}}>
            <FormInput label="Vulnerability on Arrival" value={f.vulnOnArrival} onChange={v=>s("vulnOnArrival",v)} options={["Yes","No"]}/>
            <FormInput label="Health Status" value={f.health} onChange={v=>s("health",v)}/>
            <FormInput label="Height (cm)" value={f.height} onChange={v=>s("height",v)} placeholder="e.g. 170cm"/>
            <FormInput label="Weight (kg)" value={f.weight} onChange={v=>s("weight",v)} placeholder="e.g. 65kg"/>
            <FormInput label="Ghana Card / NHIS Number" value={f.ghanaCard} onChange={v=>s("ghanaCard",v)} full/>
            <FormInput label="Disability Status" value={f.disability} onChange={v=>s("disability",v)} options={["N/A","Visual/Seeing","Hearing/Speech","Orthopedic/Physical","Intellectual/Cognitive"]}/>
            <FormInput label="Medical Condition" value={f.medCondition} onChange={v=>s("medCondition",v)} full/>
          </div>

          <SectionHead>Education & Employment</SectionHead>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:28}}>
            <FormInput label="Education Level" value={f.education} onChange={v=>s("education",v)} options={["Primary","JHS","SHS","Vocational","Tertiary","None"]}/>
            <FormInput label="Occupation" value={f.occupation} onChange={v=>s("occupation",v)}/>
            <FormInput label="Employment Status" value={f.employment} onChange={v=>s("employment",v)} options={["Employed","Unemployed"]}/>
          </div>

          <SectionHead>Family & Background</SectionHead>
          <div style={{display:"grid",gridTemplateColumns:"1fr",gap:16,marginBottom:28}}>
            <FormInput label="Family Background" value={f.family} onChange={v=>s("family",v)} type="textarea"/>
            <FormInput label="Background Information" value={f.background} onChange={v=>s("background",v)} type="textarea"/>
          </div>

          <div style={{display:"flex",gap:12}}>
            <Btn variant="primary" onClick={()=>onSave(f)}>{edit?"Save Changes":"Register Beneficiary"}</Btn>
            <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  POSTS
// ══════════════════════════════════════════════════════════════
function PostsPage({bens,user,components}) {
  const mine=user.role==="Admin"?bens:bens.filter(b=>b.assignedTo===user.id);
  const all=mine.flatMap(b=>b.posts.map(p=>({...p,benName:b.name,bid:b.bid,comp:b.component}))).sort((a,b2)=>b2.date.localeCompare(a.date));
  return (
    <div className="fade-in">
      <Topbar title="Posts" sub="Your latest follow-up notes and updates"/>
      <div style={{padding:"24px 32px"}}>
        {all.length===0&&<div style={{textAlign:"center",color:T.grey,padding:44}}>No posts yet. Add follow-up notes from a beneficiary profile.</div>}
        {all.map((p,i)=>{
          const c=components.find(x=>x.id===p.comp);
          return (
            <div key={i} style={{background:T.white,borderRadius:12,padding:"18px 20px",marginBottom:14,borderLeft:`4px solid ${c?.color||T.coral}`,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <div style={{fontWeight:700,color:T.navy,fontSize:14}}>{p.benName} <span style={{color:T.grey,fontWeight:400,fontSize:12}}>({p.bid})</span></div>
                <div style={{fontSize:12,color:T.grey}}>{p.date}</div>
              </div>
              <div style={{fontSize:11,color:T.grey,marginBottom:8}}>{c?.icon} {c?.name}</div>
              <div style={{fontSize:13,color:T.navy,lineHeight:1.65}}>{p.text}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  USER MANAGEMENT
// ══════════════════════════════════════════════════════════════
function UserMgmt({users,setUsers}) {
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({name:"",email:"",password:"",role:"Programme Officer"});
  const s=(k,v)=>setForm(p=>({...p,[k]:v}));

  function addUser() {
    if(!form.name||!form.email||!form.password){alert("Please fill all fields.");return;}
    const av=form.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
    setUsers(u=>[...u,{...form,id:Date.now(),avatar:av}]);
    setForm({name:"",email:"",password:"",role:"Programme Officer"});
    setShowAdd(false);
  }

  return (
    <div className="fade-in">
      <Topbar title="User Management" sub="Admin only — manage platform users and credentials"/>
      <div style={{padding:"24px 32px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontSize:13,color:T.grey}}>{users.length} users registered</div>
          <Btn variant="primary" onClick={()=>setShowAdd(!showAdd)}>+ Create User Account</Btn>
        </div>

        {showAdd&&<div style={{background:T.white,borderRadius:12,padding:"24px",marginBottom:20,boxShadow:"0 2px 10px rgba(0,0,0,0.08)",border:`1px solid ${T.greyM}`}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:T.navy,marginBottom:16}}>Create New User Account</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
            <FormInput label="Full Name *" value={form.name} onChange={v=>s("name",v)}/>
            <FormInput label="Email Address * (e.g. mark.yeboah@ogb.org)" value={form.email} onChange={v=>s("email",v)} type="email"/>
            <FormInput label="Temporary Password *" value={form.password} onChange={v=>s("password",v)} type="password"/>
            <FormInput label="Role" value={form.role} onChange={v=>s("role",v)} options={["Programme Officer"]}/>
          </div>
          <div style={{fontSize:11,color:T.grey,background:T.off,padding:"10px 14px",borderRadius:8,marginBottom:14}}>
            ℹ️ The user will be able to change their password after first login, but cannot change their email address.
          </div>
          <div style={{display:"flex",gap:10}}>
            <Btn variant="primary" onClick={addUser}>Create Account</Btn>
            <Btn variant="secondary" onClick={()=>setShowAdd(false)}>Cancel</Btn>
          </div>
        </div>}

        <div style={{background:T.white,borderRadius:12,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",border:`1px solid ${T.greyM}`}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{background:T.off,borderBottom:`2px solid ${T.greyM}`}}>
                {["User","Email","Role","Actions"].map(h=><th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:11,fontWeight:700,color:T.slate,textTransform:"uppercase",letterSpacing:0.8}}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {users.map((u,i)=>(
                <tr key={u.id} style={{background:i%2===0?T.white:T.off,borderBottom:`1px solid ${T.greyL}`}}>
                  <td style={{padding:"13px 16px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:34,height:34,borderRadius:"50%",background:avatarColor(u.name),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,color:T.white}}>{u.avatar}</div>
                      <span style={{fontWeight:700,fontSize:13,color:T.navy}}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{padding:"13px 16px",fontSize:12,color:T.navy}}>{u.email}</td>
                  <td style={{padding:"13px 16px"}}>
                    <span style={{background:u.role==="Admin"?"#FED7D7":"#BEE3F8",color:u.role==="Admin"?T.red:T.blue,padding:"3px 12px",borderRadius:20,fontSize:11,fontWeight:700}}>{u.role}</span>
                  </td>
                  <td style={{padding:"13px 16px"}}>
                    {u.role!=="Admin"&&<button className="action-btn" style={{padding:"5px 12px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:"#FEFCBF",color:T.gold}}>Reset Password</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  SETTINGS
// ══════════════════════════════════════════════════════════════
function Settings({appName,setAppName,logoUrl,setLogoUrl,components,setComponents}) {
  const [newComp,setNewComp]=useState({name:"",icon:"🌍",color:"#2A4365"});
  const fileRef=useRef();

  function handleLogo(e) {
    const file=e.target.files[0];
    if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>setLogoUrl(ev.target.result);
    reader.readAsDataURL(file);
  }

  function addComp() {
    if(!newComp.name.trim()){alert("Please enter a component name.");return;}
    setComponents(c=>[...c,{...newComp,id:Date.now(),light:"#F7FAFC"}]);
    setNewComp({name:"",icon:"🌍",color:"#2A4365"});
  }

  return (
    <div className="fade-in">
      <Topbar title="Settings" sub="Customise your OGB App — Admin only"/>
      <div style={{padding:"24px 32px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>

        {/* App Identity */}
        <div style={{background:T.white,borderRadius:12,padding:"24px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
          <SectionHead>App Identity</SectionHead>
          <div style={{marginBottom:14}}>
            <Label>App Name</Label>
            <input value={appName} onChange={e=>setAppName(e.target.value)}
              style={{width:"100%",border:`1px solid ${T.greyM}`,borderRadius:8,padding:"9px 14px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",color:T.navy}}/>
          </div>
          <div style={{marginBottom:18}}>
            <Label>Logo (upload image)</Label>
            <div style={{border:`2px dashed ${T.greyM}`,borderRadius:10,padding:"20px",textAlign:"center",cursor:"pointer",background:T.off}} onClick={()=>fileRef.current.click()}>
              {logoUrl?<img src={logoUrl} alt="logo" style={{width:60,height:60,objectFit:"contain"}}/>:<div><div style={{fontSize:32,marginBottom:6}}>📷</div><div style={{fontSize:12,color:T.grey}}>Click to upload logo</div></div>}
              <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleLogo}/>
            </div>
          </div>
          {logoUrl&&<Btn variant="secondary" onClick={()=>setLogoUrl(null)}>Remove Logo</Btn>}
        </div>

        {/* Website Link */}
        <div style={{background:T.white,borderRadius:12,padding:"24px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
          <SectionHead>Official Website</SectionHead>
          <div style={{background:`linear-gradient(135deg,${T.navy},${T.slate})`,borderRadius:12,padding:"24px",textAlign:"center",color:T.white,marginBottom:14}}>
            <div style={{fontSize:32,marginBottom:8}}>🌐</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,marginBottom:4}}>LYSBF Official Website</div>
            <div style={{fontSize:12,opacity:0.75,marginBottom:16}}>lysbfoundation.com</div>
            <a href="https://lysbfoundation.com/" target="_blank" rel="noreferrer"
              style={{display:"inline-block",background:T.coral,color:T.white,padding:"10px 24px",borderRadius:8,fontSize:13,fontWeight:700,textDecoration:"none"}}>
              Visit Website ↗
            </a>
          </div>
          <div style={{fontSize:12,color:T.grey,textAlign:"center"}}>Opens in a new browser tab</div>
        </div>

        {/* Programme Components */}
        <div style={{background:T.white,borderRadius:12,padding:"24px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",gridColumn:"1/-1"}}>
          <SectionHead>Programme Components</SectionHead>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
            {components.map((c,i)=>(
              <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:c.light||T.off,borderRadius:8,border:`1px solid ${T.greyM}`}}>
                <span style={{fontSize:20}}>{c.icon}</span>
                <span style={{fontSize:12,fontWeight:700,color:c.color,flex:1}}>{c.name}</span>
                {i>=7&&<button onClick={()=>setComponents(cs=>cs.filter(x=>x.id!==c.id))} style={{background:"none",border:"none",cursor:"pointer",color:T.red,fontSize:16}}>✕</button>}
              </div>
            ))}
          </div>
          <div style={{background:T.off,borderRadius:10,padding:"16px 20px"}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Add New Programme Component</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr auto auto auto",gap:10,alignItems:"end"}}>
              <FormInput label="Component Name" value={newComp.name} onChange={v=>setNewComp(p=>({...p,name:v}))} placeholder="e.g. Digital Skills Programme"/>
              <div><Label>Icon (emoji)</Label><input value={newComp.icon} onChange={e=>setNewComp(p=>({...p,icon:e.target.value}))} style={{border:`1px solid ${T.greyM}`,borderRadius:8,padding:"9px",width:50,fontSize:18,textAlign:"center"}}/></div>
              <div><Label>Colour</Label><input type="color" value={newComp.color} onChange={e=>setNewComp(p=>({...p,color:e.target.value}))} style={{border:`1px solid ${T.greyM}`,borderRadius:8,padding:"4px",width:50,height:38,cursor:"pointer"}}/></div>
              <Btn variant="primary" onClick={addComp}>+ Add</Btn>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div style={{background:T.white,borderRadius:12,padding:"24px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
          <SectionHead>Security</SectionHead>
          <div style={{fontSize:13,color:T.grey,marginBottom:16}}>Change your account password below. Your email address cannot be changed.</div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <FormInput label="Current Password" value="" type="password"/>
            <FormInput label="New Password" value="" type="password"/>
            <FormInput label="Confirm New Password" value="" type="password"/>
            <Btn variant="navy">Update Password</Btn>
          </div>
        </div>

        {/* App Info */}
        <div style={{background:T.white,borderRadius:12,padding:"24px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
          <SectionHead>App Information</SectionHead>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[["Version","2.0.0"],["Built for","LYSBF · CYEP"],["Region","Eastern Region, Ghana"],["Contact","info@lysbfoundation.com"],["Phone","Tel: +233 050 026 4315"]].map(([l,v])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${T.greyL}`}}>
                <span style={{fontSize:12,color:T.grey,fontWeight:700}}>{l}</span>
                <span style={{fontSize:12,color:T.navy}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Add Post Modal ────────────────────────────────────────────
function PostModal({ben,user,onSave,onClose}) {
  const [text,setText]=useState("");
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{background:T.white,borderRadius:16,padding:"28px 32px",width:"100%",maxWidth:560,boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:T.navy,marginBottom:18}}>Add Follow-Up Note — {ben.name}</div>
        <Label>Note / Observation *</Label>
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Describe the follow-up visit, observations, progress, and next steps…"
          style={{width:"100%",border:`1px solid ${T.greyM}`,borderRadius:8,padding:"10px 14px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",color:T.navy,minHeight:130,resize:"vertical",marginBottom:18,marginTop:6}}/>
        <div style={{display:"flex",gap:10}}>
          <Btn variant="primary" onClick={()=>{ if(text.trim()) onSave(ben,text,user); }}>Save Note</Btn>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  ROOT APP
// ══════════════════════════════════════════════════════════════
export default function App() {
  const [user,     setUser]  = useState(null);
  const [page,     setPage]  = useState("dashboard");
  const [bens,     setBens]  = useState(INIT_BENS);
  const [users,    setUsers] = useState(INIT_USERS);
  const [viewBen,  setView]  = useState(null);
  const [editBen,  setEdit]  = useState(null);
  const [sirBen,   setSir]   = useState(null);
  const [postModal,setPost]  = useState(null);
  const [appName,  setAppName]= useState("OGB App");
  const [logoUrl,  setLogoUrl]= useState(null);
  const [components,setComps]= useState(DEFAULT_COMPONENTS);

  function navigate(p) { setView(null); setEdit(null); setSir(null); setPage(p); }

  function saveBen(f) {
    if(editBen) { setBens(bs=>bs.map(b=>b.id===editBen.id?{...editBen,...f,age:Number(f.age),component:Number(f.component),assignedTo:Number(f.assignedTo)}:b)); }
    else { setBens(bs=>[...bs,{...f,id:Date.now(),age:Number(f.age),component:Number(f.component),assignedTo:Number(f.assignedTo),posts:[],lastFollowUp:""}]); }
    setEdit(null); navigate("ben-list");
  }

  function addPost(b,text,author) {
    const p={id:Date.now(),date:today(),author:author.name,text};
    setBens(bs=>bs.map(x=>x.id===b.id?{...x,posts:[...x.posts,p],lastFollowUp:p.date}:x));
    if(viewBen?.id===b.id) setView(v=>({...v,posts:[...v.posts,p],lastFollowUp:p.date}));
    setPost(null);
  }

  // Inject CSS
  if(typeof document!=="undefined"&&!document.getElementById("ogb-css")) {
    const el=document.createElement("style"); el.id="ogb-css"; el.textContent=CSS;
    document.head.appendChild(el);
  }

  if(!user) return <Login onLogin={u=>{setUser(u);setPage("dashboard");}} users={users} appName={appName} logoUrl={logoUrl}/>;

  function renderPage() {
    if(sirBen)  return <SIRView ben={sirBen} components={components} users={users} onBack={()=>setSir(null)}/>;
    if(viewBen) return <Profile ben={viewBen} user={user} components={components} users={users} onBack={()=>setView(null)} onAddPost={b=>setPost(b)} onSIR={b=>setSir(b)}/>;
    if(editBen||page==="ben-add") return <BenForm user={user} edit={editBen} components={components} users={users} onSave={saveBen} onCancel={()=>{setEdit(null);navigate("ben-list");}}/>;
    if(page==="dashboard") return <Dashboard bens={bens} user={user} components={components}/>;
    if(page==="ben-list")  return <BenList bens={bens} user={user} components={components} users={users} onView={b=>setView(b)} onEdit={b=>setEdit(b)} onSIR={b=>setSir(b)}/>;
    if(page==="posts")     return <PostsPage bens={bens} user={user} components={components}/>;
    if(page==="users"&&user.role==="Admin") return <UserMgmt users={users} setUsers={setUsers}/>;
    if(page==="settings"&&user.role==="Admin") return <Settings appName={appName} setAppName={setAppName} logoUrl={logoUrl} setLogoUrl={setLogoUrl} components={components} setComponents={setComps}/>;
    if(page.startsWith("sir")) return <SIRView ben={null} components={components} users={users} onBack={()=>navigate("dashboard")}/>;
    return <Dashboard bens={bens} user={user} components={components}/>;
  }

  return (
    <div style={{fontFamily:"'Source Sans 3',sans-serif",minHeight:"100vh",background:T.off,display:"flex"}}>
      <Sidebar user={user} page={page} setPage={navigate} onLogout={()=>setUser(null)} appName={appName} logoUrl={logoUrl}/>
      <div style={{marginLeft:248,flex:1,minHeight:"100vh"}}>
        {renderPage()}
      </div>
      {postModal&&<PostModal ben={postModal} user={user} onSave={addPost} onClose={()=>setPost(null)}/>}
    </div>
  );
}
