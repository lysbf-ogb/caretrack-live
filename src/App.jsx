import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+3:wght@300;400;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Source Sans 3', sans-serif; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-thumb { background: #CBD5E0; border-radius: 3px; }
  .nav-item:hover { background: rgba(255,255,255,0.10) !important; }
  .nav-sub:hover { background: rgba(255,107,107,0.18) !important; color:#fff !important; }
  .card-hover:hover { transform: translateY(-5px); box-shadow: 0 12px 32px rgba(0,0,0,0.18) !important; }
  .btn-hover:hover { filter: brightness(1.08); transform: translateY(-1px); }
  .row-hover:hover { background: #EBF8FF !important; }
  .tab-btn:hover { background: #fff !important; color: #1A365D !important; }
  .action-btn:hover { filter: brightness(0.92); }
  @media print { .no-print { display: none !important; } body { background: white; } }
  input:focus, select:focus, textarea:focus { border-color: #2A4365 !important; box-shadow: 0 0 0 3px rgba(42,67,101,0.12); outline: none; }
  .fade-in { animation: fadeIn 0.3s ease; }
  @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
  .spin { animation: spin 1s linear infinite; display:inline-block; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

const T = {
  white:"#FFFFFF",slate:"#2A4365",coral:"#FF6B6B",navy:"#1A365D",off:"#F7FAFC",
  navyMid:"#2C5282",grey:"#718096",greyL:"#EDF2F7",greyM:"#CBD5E0",
  green:"#276749",greenL:"#C6F6D5",greenM:"#38A169",blue:"#2B6CB0",blueL:"#BEE3F8",
  red:"#C53030",redL:"#FED7D7",gold:"#B7791F",goldL:"#FEFCBF",purple:"#553C9A",teal:"#285E61",
};

const COMPONENTS = [
  {id:1,name:"Sports for Development",icon:"⚽",color:"#C53030",light:"#FFF5F5"},
  {id:2,name:"Youth Leadership & Mentorship",icon:"🌟",color:"#2A4365",light:"#EBF8FF"},
  {id:3,name:"Entrepreneurship & Skills Development",icon:"💼",color:"#B7791F",light:"#FFFFF0"},
  {id:4,name:"Education Support",icon:"🎓",color:"#276749",light:"#F0FFF4"},
  {id:5,name:"Health & Wellness",icon:"❤️",color:"#C05621",light:"#FFFAF0"},
  {id:6,name:"Disability Inclusion & Social Protection",icon:"♿",color:"#553C9A",light:"#FAF5FF"},
  {id:7,name:"Environmental Sanitation & Community Service",icon:"🌿",color:"#285E61",light:"#E6FFFA"},
];

const AC=[T.coral,T.slate,T.greenM,T.gold,T.purple,T.teal,"#C05621"];
function aColor(n=""){let h=0;for(let c of n)h=(h*31+c.charCodeAt(0))%AC.length;return AC[h];}
function inits(n=""){return n.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();}
function sPill(s){if(s==="Active")return{bg:"#C6F6D5",color:"#276749"};if(s==="Completed")return{bg:"#BEE3F8",color:"#2B6CB0"};return{bg:"#FEFCBF",color:"#B7791F"};}
function today(){return new Date().toISOString().slice(0,10);}

const Pill=({s})=>{const{bg,color}=sPill(s);return <span style={{background:bg,color,padding:"3px 12px",borderRadius:20,fontSize:11,fontWeight:700,display:"inline-block"}}>{s}</span>;};
const Lbl=({c})=><div style={{fontSize:11,fontWeight:700,color:T.slate,textTransform:"uppercase",letterSpacing:0.8,marginBottom:5}}>{c}</div>;
const FBox=({v})=><div style={{background:T.off,border:`1px solid ${T.greyM}`,borderRadius:8,padding:"9px 14px",fontSize:13,color:T.navy,minHeight:38}}>{v||"—"}</div>;

const Btn=({children,onClick,variant="primary",style:sx})=>{
  const b={padding:"10px 22px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'Source Sans 3',sans-serif",transition:"all 0.18s",...sx};
  const v=variant==="primary"?{background:T.coral,color:T.white}:variant==="navy"?{background:T.navy,color:T.white}:{background:T.off,color:T.navy,border:`1px solid ${T.greyM}`};
  return <button className="btn-hover" style={{...b,...v}} onClick={onClick}>{children}</button>;
};

const SH=({children})=>(
  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
    <span style={{fontSize:12,fontWeight:700,color:T.slate,textTransform:"uppercase",letterSpacing:2}}>{children}</span>
    <div style={{flex:1,height:1,background:T.greyM}}/>
  </div>
);

const FI=({label,value,onChange,type="text",options,full,readOnly,placeholder})=>(
  <div style={{display:"flex",flexDirection:"column",gap:5,...(full?{gridColumn:"1/-1"}:{})}}>
    <Lbl c={label}/>
    {options?<select value={value||""} onChange={e=>onChange&&onChange(e.target.value)} disabled={readOnly}
        style={{border:`1px solid ${T.greyM}`,borderRadius:8,padding:"9px 14px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",background:readOnly?T.off:T.white,color:T.navy}}>
        {options.map(o=><option key={o}>{o}</option>)}</select>
      :type==="textarea"?<textarea value={value||""} onChange={e=>onChange&&onChange(e.target.value)} readOnly={readOnly} placeholder={placeholder||""}
          style={{border:`1px solid ${T.greyM}`,borderRadius:8,padding:"9px 14px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",background:readOnly?T.off:T.white,color:T.navy,minHeight:80,resize:"vertical"}}/>
        :<input type={type} value={value||""} onChange={e=>onChange&&onChange(e.target.value)} readOnly={readOnly} placeholder={placeholder||""}
            style={{border:`1px solid ${T.greyM}`,borderRadius:8,padding:"9px 14px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",background:readOnly?T.off:T.white,color:T.navy}}/>
    }
  </div>
);

function Logo({size=40,color=T.navy}){
  return(<svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <path d="M50 18 C44 8 28 4 18 14 C8 24 10 42 22 50 C10 58 8 76 18 86 C28 96 44 92 50 82 C56 92 72 96 82 86 C92 76 90 58 78 50 C90 42 92 24 82 14 C72 4 56 8 50 18Z" stroke={color} strokeWidth="6" fill="none" strokeLinejoin="round" strokeLinecap="round"/>
    <circle cx="50" cy="13" r="4" fill={color}/><circle cx="50" cy="87" r="4" fill={color}/>
    <circle cx="13" cy="50" r="4" fill={color}/><circle cx="87" cy="50" r="4" fill={color}/>
  </svg>);
}

function Topbar({title,sub}){
  return(<div style={{background:T.white,borderBottom:`1px solid ${T.greyM}`,padding:"0 32px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
    <div><div style={{fontFamily:"'Playfair Display',serif",fontSize:19,fontWeight:700,color:T.navy}}>{title}</div>{sub&&<div style={{fontSize:12,color:T.grey}}>{sub}</div>}</div>
    <div style={{display:"flex",alignItems:"center",gap:14}}>
      <div style={{width:36,height:36,borderRadius:"50%",background:T.off,border:`1px solid ${T.greyM}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🔔</div>
      <div style={{fontSize:12,color:T.grey}}>{new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</div>
    </div>
  </div>);
}

function Login({onLogin}){
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [err,setErr]=useState("");
  const [busy,setBusy]=useState(false);

  async function go(){
    if(!email||!pass){setErr("Please enter your email and password.");return;}
    setBusy(true);setErr("");
    const {data,error}=await supabase.auth.signInWithPassword({email,password:pass});
    if(error){setErr("Invalid email or password.");setBusy(false);return;}
    const {data:prof}=await supabase.from("profiles").select("*").eq("id",data.user.id).single();
    onLogin({id:data.user.id,email:data.user.email,name:prof?.name||data.user.email,role:prof?.role||"Programme Officer",avatar:prof?.avatar||inits(prof?.name||data.user.email)});
    setBusy(false);
  }

  return(<div style={{minHeight:"100vh",background:`linear-gradient(135deg,${T.navy} 0%,${T.slate} 55%,${T.navyMid} 100%)`,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div style={{background:T.white,borderRadius:20,padding:"44px 40px",width:400,boxShadow:"0 24px 64px rgba(0,0,0,0.35)"}}>
      <div style={{textAlign:"center",marginBottom:28}}>
        <Logo size={56} color={T.navy}/>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,color:T.navy,marginTop:10}}>OGB App</div>
        <div style={{fontSize:12,color:T.grey,marginTop:4}}>LYSBF · Community Youth Empowerment Programme</div>
      </div>
      {err&&<div style={{background:T.redL,color:T.red,borderRadius:8,padding:"10px 14px",fontSize:13,marginBottom:14,textAlign:"center"}}>{err}</div>}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <input placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} type="email" onKeyDown={e=>e.key==="Enter"&&go()}
          style={{border:`1.5px solid ${T.greyM}`,borderRadius:10,padding:"12px 16px",fontSize:14,fontFamily:"'Source Sans 3',sans-serif",color:T.navy,width:"100%"}}/>
        <input placeholder="Password" value={pass} onChange={e=>setPass(e.target.value)} type="password" onKeyDown={e=>e.key==="Enter"&&go()}
          style={{border:`1.5px solid ${T.greyM}`,borderRadius:10,padding:"12px 16px",fontSize:14,fontFamily:"'Source Sans 3',sans-serif",color:T.navy,width:"100%"}}/>
        <button onClick={go} disabled={busy} style={{background:busy?T.grey:T.coral,color:T.white,border:"none",borderRadius:10,padding:"13px",fontSize:15,fontWeight:700,fontFamily:"'Source Sans 3',sans-serif",cursor:busy?"not-allowed":"pointer"}}>
          {busy?"Signing in...":"Sign In →"}
        </button>
      </div>
      <div style={{marginTop:20,padding:"12px 14px",background:T.off,borderRadius:8,fontSize:11,color:T.grey,textAlign:"center"}}>
        Contact your Coordinator for login credentials
      </div>
    </div>
  </div>);
}

function Sidebar({user,page,setPage,onLogout}){
  const [benOpen,setBen]=useState(true);
  const [sirOpen,setSir]=useState(false);
  const NI=({label,icon,p,sub})=>(<div className={sub?"nav-sub":"nav-item"} onClick={()=>setPage(p)}
    style={{display:"flex",alignItems:"center",gap:9,padding:sub?"7px 12px 7px 40px":"10px 14px",borderRadius:8,cursor:"pointer",marginBottom:2,
      color:page===p?"#fff":"rgba(255,255,255,0.7)",fontWeight:page===p?700:400,fontSize:sub?12:13,
      background:page===p?(sub?"rgba(255,107,107,0.3)":"rgba(255,255,255,0.14)"):"transparent",transition:"all 0.18s",fontFamily:"'Source Sans 3',sans-serif"}}>
    <span style={{fontSize:sub?14:16,minWidth:18,textAlign:"center"}}>{icon}</span><span>{label}</span></div>);
  const G=({label,icon,open,setOpen,children})=>(<>
    <div className="nav-item" onClick={()=>setOpen(!open)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderRadius:8,cursor:"pointer",color:"rgba(255,255,255,0.78)",fontSize:13,marginBottom:2,transition:"all 0.18s",fontFamily:"'Source Sans 3',sans-serif"}}>
      <span style={{display:"flex",alignItems:"center",gap:9}}><span style={{fontSize:16,minWidth:18,textAlign:"center"}}>{icon}</span><span>{label}</span></span>
      <span style={{fontSize:10,opacity:0.6}}>{open?"▲":"▼"}</span>
    </div>{open&&children}</>);
  return(<div style={{width:248,minHeight:"100vh",background:`linear-gradient(180deg,${T.navy} 0%,${T.slate} 100%)`,display:"flex",flexDirection:"column",flexShrink:0,position:"fixed",top:0,left:0,bottom:0,zIndex:100,overflowY:"auto"}}>
    <div style={{padding:"22px 18px 16px",borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <Logo size={36} color={T.white}/>
        <div><div style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:T.white}}>OGB App</div>
        <div style={{fontSize:9,color:"rgba(255,255,255,0.45)",letterSpacing:2,textTransform:"uppercase"}}>LYSBF · CYEP</div></div>
      </div>
    </div>
    <div style={{padding:"14px 10px",flex:1}}>
      <NI label="Dashboard" icon="📊" p="dashboard"/>
      <G label="Beneficiaries" icon="👥" open={benOpen} setOpen={setBen}>
        <NI label="List" icon="📋" p="ben-list" sub/><NI label="Add" icon="➕" p="ben-add" sub/>
      </G>
      <G label="SIR" icon="📄" open={sirOpen} setOpen={setSir}>
        <NI label="List" icon="📋" p="sir-list" sub/><NI label="Add" icon="➕" p="sir-add" sub/><NI label="Archive" icon="🗄" p="sir-archive" sub/>
      </G>
      <NI label="Posts" icon="📝" p="posts"/>
      {user.role==="Admin"&&<>
        <div style={{margin:"14px 0 6px",padding:"0 14px",fontSize:10,color:"rgba(255,255,255,0.35)",letterSpacing:2,textTransform:"uppercase"}}>Admin</div>
        <NI label="User Management" icon="🔐" p="users"/>
        <NI label="Settings" icon="⚙️" p="settings"/>
      </>}
    </div>
    <div style={{padding:"14px 16px",borderTop:"1px solid rgba(255,255,255,0.1)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:36,height:36,borderRadius:"50%",background:T.coral,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:T.white,flexShrink:0}}>{user.avatar}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{color:T.white,fontSize:12,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name}</div>
          <div style={{fontSize:10,color:"rgba(255,107,107,0.9)",background:"rgba(255,107,107,0.18)",padding:"2px 8px",borderRadius:20,display:"inline-block",marginTop:2}}>{user.role}</div>
        </div>
        <span onClick={onLogout} style={{color:"rgba(255,255,255,0.35)",cursor:"pointer",fontSize:18}}>⇠</span>
      </div>
    </div>
  </div>);
}

function Dashboard({bens,user}){
  const vis=user.role==="Admin"?bens:bens.filter(b=>b.assigned_to===user.id);
  const stats=[{label:"Total Beneficiaries",v:vis.length,icon:"👥",color:T.navy},{label:"Active",v:vis.filter(b=>b.status==="Active").length,icon:"✅",color:T.greenM},{label:"Completed",v:vis.filter(b=>b.status==="Completed").length,icon:"🏁",color:T.blue},{label:"Male",v:vis.filter(b=>b.gender==="Male").length,icon:"♂",color:T.slate},{label:"Female",v:vis.filter(b=>b.gender==="Female").length,icon:"♀",color:T.coral}];
  return(<div className="fade-in">
    <Topbar title="Dashboard" sub="View current tasks, activities and reports"/>
    <div style={{padding:"28px 32px"}}>
      <SH>Programme Summary at a Glance</SH>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:14,marginBottom:32}}>
        {stats.map(s=>(<div key={s.label} style={{background:T.white,borderRadius:12,padding:"18px 16px",textAlign:"center",boxShadow:"0 1px 6px rgba(0,0,0,0.07)",border:`1px solid ${T.greyM}`}}>
          <div style={{fontSize:24,marginBottom:6}}>{s.icon}</div>
          <div style={{fontSize:30,fontWeight:700,color:s.color,fontFamily:"'Playfair Display',serif"}}>{s.v}</div>
          <div style={{fontSize:11,color:T.grey,marginTop:3,textTransform:"uppercase",letterSpacing:0.8}}>{s.label}</div>
        </div>))}
      </div>
      <SH>Beneficiaries by Programme Component</SH>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16}}>
        {COMPONENTS.map(c=>{const count=vis.filter(b=>b.component_id===c.id).length;return(
          <div key={c.id} className="card-hover" style={{borderRadius:14,padding:"22px 18px",background:`linear-gradient(145deg,${c.color} 0%,${c.color}DD 100%)`,color:T.white,cursor:"pointer",boxShadow:"0 3px 10px rgba(0,0,0,0.12)",transition:"all 0.22s"}}>
            <div style={{fontSize:36,marginBottom:8}}>{c.icon}</div>
            <div style={{fontSize:11,fontWeight:700,opacity:0.88,lineHeight:1.4,marginBottom:8}}>{c.name}</div>
            <div style={{fontSize:42,fontWeight:700,fontFamily:"'Playfair Display',serif",lineHeight:1}}>{count}</div>
            <div style={{fontSize:11,opacity:0.75,marginTop:4}}>Total Beneficiaries</div>
          </div>);})}
      </div>
    </div>
  </div>);
}

function BenList({bens,user,profiles,onView,onEdit,onSIR}){
  const [search,setSearch]=useState("");const [compF,setCompF]=useState("all");const [commF,setCommF]=useState("all");const [statF,setStatF]=useState("all");const [sort,setSort]=useState("name-asc");
  const communities=[...new Set(bens.map(b=>b.community).filter(Boolean))].sort();
  const vis=(user.role==="Admin"?bens:bens.filter(b=>b.assigned_to===user.id))
    .filter(b=>(!search||b.name?.toLowerCase().includes(search.toLowerCase())||b.bid?.includes(search))&&(compF==="all"||b.component_id===Number(compF))&&(commF==="all"||b.community===commF)&&(statF==="all"||b.status===statF))
    .sort((a,b2)=>{if(sort==="name-asc")return(a.name||"").localeCompare(b2.name||"");if(sort==="name-desc")return(b2.name||"").localeCompare(a.name||"");if(sort==="updated-desc")return(b2.last_follow_up||"").localeCompare(a.last_follow_up||"");if(sort==="updated-asc")return(a.last_follow_up||"").localeCompare(b2.last_follow_up||"");return 0;});
  const comp=id=>COMPONENTS.find(c=>c.id===id);
  const officer=id=>profiles.find(p=>p.id===id)?.name||"Unassigned";
  return(<div className="fade-in">
    <Topbar title="Beneficiaries" sub="View and manage all beneficiary profiles"/>
    <div style={{padding:"24px 32px"}}>
      <div style={{background:T.white,borderRadius:12,padding:"16px 20px",marginBottom:20,boxShadow:"0 1px 4px rgba(0,0,0,0.06)",border:`1px solid ${T.greyM}`}}>
        <div style={{display:"flex",flexWrap:"wrap",gap:10,alignItems:"flex-end"}}>
          <div style={{flex:"1 1 180px"}}><Lbl c="Search"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name or ID..." style={{width:"100%",border:`1px solid ${T.greyM}`,borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",color:T.navy}}/></div>
          <div style={{flex:"1 1 150px"}}><Lbl c="Component"/><select value={compF} onChange={e=>setCompF(e.target.value)} style={{width:"100%",border:`1px solid ${T.greyM}`,borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",color:T.navy}}><option value="all">All Components</option>{COMPONENTS.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></div>
          <div style={{flex:"1 1 130px"}}><Lbl c="Community"/><select value={commF} onChange={e=>setCommF(e.target.value)} style={{width:"100%",border:`1px solid ${T.greyM}`,borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",color:T.navy}}><option value="all">All</option>{communities.map(c=><option key={c}>{c}</option>)}</select></div>
          <div style={{flex:"1 1 110px"}}><Lbl c="Status"/><select value={statF} onChange={e=>setStatF(e.target.value)} style={{width:"100%",border:`1px solid ${T.greyM}`,borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",color:T.navy}}><option value="all">All</option><option>Active</option><option>Completed</option><option>On Hold</option></select></div>
          <div style={{flex:"1 1 140px"}}><Lbl c="Sort By"/><select value={sort} onChange={e=>setSort(e.target.value)} style={{width:"100%",border:`1px solid ${T.greyM}`,borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",color:T.navy}}><option value="name-asc">Name A→Z</option><option value="name-desc">Name Z→A</option><option value="updated-desc">Last Updated ↓</option><option value="updated-asc">Last Updated ↑</option></select></div>
          <Btn variant="secondary" onClick={()=>{setSearch("");setCompF("all");setCommF("all");setStatF("all");setSort("name-asc");}}>Clear</Btn>
        </div>
        <div style={{marginTop:10,fontSize:12,color:T.grey}}>Showing <strong>{vis.length}</strong> records</div>
      </div>
      <div style={{background:T.white,borderRadius:12,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",border:`1px solid ${T.greyM}`}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{background:T.off,borderBottom:`2px solid ${T.greyM}`}}>
            {["Beneficiary","Component","Community","Assigned Officer","Last Follow-Up","Status","Actions"].map(h=><th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:11,fontWeight:700,color:T.slate,textTransform:"uppercase",letterSpacing:0.8}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {vis.map((b,i)=>{const c=comp(b.component_id);return(
              <tr key={b.id} className="row-hover" style={{background:i%2===0?T.white:T.off,borderBottom:`1px solid ${T.greyL}`,transition:"background 0.15s"}}>
                <td style={{padding:"13px 16px"}}><div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:38,height:38,borderRadius:"50%",background:aColor(b.name),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:T.white,flexShrink:0}}>{inits(b.name)}</div>
                  <div><div style={{fontWeight:700,fontSize:13,color:T.navy}}>{b.name}</div><div style={{fontSize:11,color:T.grey}}>Age {b.age} · {b.gender} · {b.bid}</div></div>
                </div></td>
                <td style={{padding:"13px 16px"}}>{c&&<span style={{background:c.light,color:c.color,padding:"4px 10px",borderRadius:20,fontSize:11,fontWeight:700,display:"inline-flex",alignItems:"center",gap:4}}><span>{c.icon}</span><span>{c.name.split(" ")[0]}</span></span>}</td>
                <td style={{padding:"13px 16px",fontSize:12,color:T.navy}}>{b.community}</td>
                <td style={{padding:"13px 16px",fontSize:12,color:T.navy}}>{officer(b.assigned_to)}</td>
                <td style={{padding:"13px 16px",fontSize:12,color:b.last_follow_up?T.red:T.grey,fontWeight:b.last_follow_up?600:400}}>{b.last_follow_up||"Not yet"}</td>
                <td style={{padding:"13px 16px"}}><Pill s={b.status}/></td>
                <td style={{padding:"13px 16px"}}><div style={{display:"flex",gap:5}}>
                  <button className="action-btn" onClick={()=>onView(b)} style={{padding:"5px 11px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:"#EBF8FF",color:T.blue}}>👁 View</button>
                  {(user.role==="Admin"||b.assigned_to===user.id)&&<button className="action-btn" onClick={()=>onEdit(b)} style={{padding:"5px 11px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:"#C6F6D5",color:T.greenM}}>✏️ Edit</button>}
                  <button className="action-btn" onClick={()=>onSIR(b)} style={{padding:"5px 11px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:"#FEFCBF",color:T.gold}}>📋 SIR</button>
                </div></td>
              </tr>);})}
            {vis.length===0&&<tr><td colSpan={7} style={{padding:44,textAlign:"center",color:T.grey,fontSize:14}}>No beneficiaries found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  </div>);
}

const TABS=[{k:"basic",label:"Basic Info",icon:"👤"},{k:"programme",label:"Programme",icon:"📌"},{k:"health",label:"Health",icon:"❤️"},{k:"education",label:"Education",icon:"🎓"},{k:"family",label:"Family",icon:"🏠"},{k:"employment",label:"Employment",icon:"💼"},{k:"disability",label:"Disability",icon:"♿"},{k:"followups",label:"Follow-Ups",icon:"📝"},{k:"documents",label:"Documents",icon:"📁"}];

function Profile({ben,user,profiles,onBack,onAddPost,onSIR}){
  const [tab,setTab]=useState("basic");
  const comp=COMPONENTS.find(c=>c.id===ben.component_id);
  const officer=profiles.find(p=>p.id===ben.assigned_to);
  return(<div className="fade-in">
    <Topbar title={ben.name} sub={`Profile · ${ben.bid}`}/>
    <div style={{padding:"24px 32px"}}>
      <div className="no-print" style={{display:"flex",gap:10,marginBottom:20}}>
        <Btn variant="secondary" onClick={onBack}>← Back to List</Btn>
        <Btn variant="navy" onClick={()=>onSIR(ben)}>📋 Generate SIR</Btn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:20}}>
        <div style={{background:T.white,borderRadius:14,overflow:"hidden",boxShadow:"0 2px 10px rgba(0,0,0,0.08)"}}>
          <div style={{background:`linear-gradient(135deg,${comp?.color||T.navy}22,${comp?.color||T.navy}11)`,padding:"28px 20px",textAlign:"center"}}>
            <div style={{width:70,height:70,borderRadius:"50%",background:aColor(ben.name),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:24,color:T.white,margin:"0 auto 12px"}}>{inits(ben.name)}</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:19,fontWeight:700,color:T.navy}}>{ben.name}</div>
            <div style={{fontSize:12,color:T.grey,marginTop:3}}>{comp?.icon} {comp?.name}</div>
            <div style={{marginTop:10}}><Pill s={ben.status}/></div>
          </div>
          <div style={{padding:"0 20px 20px"}}>
            {[["Beneficiary ID",ben.bid],["Age / Gender",`${ben.age} · ${ben.gender}`],["Community",ben.community],["Enrolled",ben.enroll_date],["Officer",officer?.name||"—"]].map(([l,v])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${T.greyL}`}}>
                <span style={{fontSize:11,fontWeight:700,color:T.grey}}>{l}</span>
                <span style={{fontSize:12,color:T.navy,textAlign:"right"}}>{v||"—"}</span>
              </div>))}
          </div>
        </div>
        <div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4,background:T.off,borderRadius:10,padding:4,marginBottom:16}}>
            {TABS.map(t=>(<button key={t.k} className="tab-btn" onClick={()=>setTab(t.k)}
              style={{padding:"8px 13px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontFamily:"'Source Sans 3',sans-serif",display:"flex",alignItems:"center",gap:5,transition:"all 0.18s",background:tab===t.k?T.white:"transparent",color:tab===t.k?T.navy:T.grey,fontWeight:tab===t.k?700:400,boxShadow:tab===t.k?"0 1px 4px rgba(0,0,0,0.10)":"none"}}>
              <span>{t.icon}</span><span>{t.label}</span></button>))}
          </div>
          <div style={{background:T.white,borderRadius:12,padding:"24px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
            {tab==="basic"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>{[["Full Name",ben.name],["Date of Birth",ben.dob],["Age",ben.age],["Gender",ben.gender],["Nationality",ben.nationality],["Tribe",ben.tribe],["Religion",ben.religion],["Community",ben.community],["Address",ben.address],["Region",ben.region],["District",ben.district],["City",ben.city]].map(([l,v])=><div key={l}><Lbl c={l}/><FBox v={v}/></div>)}</div>}
            {tab==="programme"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>{[["Beneficiary ID",ben.bid],["Component",`${comp?.icon} ${comp?.name}`],["Enrolment Date",ben.enroll_date],["Status",ben.status]].map(([l,v])=><div key={l}><Lbl c={l}/><FBox v={v}/></div>)}</div>}
            {tab==="health"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>{[["Vulnerability on Arrival",ben.vuln_on_arrival],["Health Status",ben.health],["Height",ben.height],["Weight",ben.weight],["Ghana Card / NHIS",ben.ghana_card],["Disability",ben.disability],["Medical Condition",ben.med_condition]].map(([l,v])=><div key={l}><Lbl c={l}/><FBox v={v}/></div>)}</div>}
            {tab==="education"&&<div><Lbl c="Educational Level"/><FBox v={ben.education}/></div>}
            {tab==="family"&&<div><Lbl c="Family Background"/><FBox v={ben.family}/></div>}
            {tab==="employment"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>{[["Occupation",ben.occupation],["Employment Status",ben.employment]].map(([l,v])=><div key={l}><Lbl c={l}/><FBox v={v}/></div>)}</div>}
            {tab==="disability"&&<div><Lbl c="Disability Status"/><FBox v={ben.disability}/></div>}
            {tab==="followups"&&<div>
              {(user.role==="Admin"||ben.assigned_to===user.id)&&<Btn variant="primary" onClick={()=>onAddPost(ben)} style={{marginBottom:18}}>+ Add Follow-Up Note</Btn>}
              {(!ben.posts||ben.posts.length===0)&&<div style={{color:T.grey,fontSize:13,textAlign:"center",padding:24}}>No follow-up notes yet.</div>}
              {(ben.posts||[]).slice().reverse().map(p=>(
                <div key={p.id} style={{background:T.off,borderRadius:10,padding:"14px 16px",marginBottom:12,borderLeft:`3px solid ${T.coral}`}}>
                  <div style={{fontSize:11,color:T.grey,marginBottom:6}}>📅 {p.date} · ✍️ {p.author}</div>
                  <div style={{fontSize:13,color:T.navy,lineHeight:1.6}}>{p.text}</div>
                </div>))}
            </div>}
            {tab==="documents"&&<div style={{textAlign:"center",padding:"36px 0"}}>
              <div style={{fontSize:44,marginBottom:12}}>📁</div>
              <div style={{color:T.grey,fontSize:14,marginBottom:16}}>No documents uploaded yet.</div>
              <Btn variant="primary">+ Upload Document</Btn>
            </div>}
          </div>
        </div>
      </div>
    </div>
  </div>);
}

function SIRView({ben,profiles,onBack}){
  if(!ben)return(<div className="fade-in"><Topbar title="Social Inquiry Reports" sub="Formal case assessment reports"/><div style={{padding:"32px",textAlign:"center",color:T.grey}}><div style={{fontSize:48,marginBottom:12}}>📋</div><div style={{fontSize:16,fontWeight:700,color:T.navy}}>Select a beneficiary and click SIR to generate a report.</div></div></div>);
  const comp=COMPONENTS.find(c=>c.id===ben.component_id);
  const officer=profiles.find(p=>p.id===ben.assigned_to);
  return(<div className="fade-in">
    <Topbar title="Social Inquiry Report" sub={`${ben.name} · ${ben.bid}`}/>
    <div style={{padding:"24px 32px"}}>
      <div className="no-print" style={{display:"flex",gap:10,marginBottom:20}}>
        <Btn variant="secondary" onClick={onBack}>← Back</Btn>
        <Btn variant="navy" onClick={()=>window.print()}>🖨 Print as PDF</Btn>
      </div>
      <div style={{background:T.white,borderRadius:12,padding:"36px 40px",boxShadow:"0 2px 12px rgba(0,0,0,0.08)",maxWidth:800,margin:"0 auto"}}>
        <div style={{textAlign:"center",borderBottom:`2px solid ${T.navy}`,paddingBottom:20,marginBottom:24}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:T.navy}}>LAWYER YAW SARPONG BOATENG FOUNDATION</div>
          <div style={{fontSize:13,color:T.slate,marginTop:4}}>Community Youth Empowerment Programme (CYEP)</div>
          <div style={{fontSize:16,fontWeight:700,color:T.coral,marginTop:10,textTransform:"uppercase",letterSpacing:2}}>Social Inquiry Report</div>
          <div style={{fontSize:12,color:T.grey,marginTop:4}}>Confidential Document — For Official Use Only</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:24,padding:"12px 16px",background:T.off,borderRadius:8}}>
          {[["Report Date",today()],["Beneficiary ID",ben.bid],["Component",`${comp?.icon} ${comp?.name}`],["Officer",officer?.name||"—"],["Status",ben.status],["Enrolled",ben.enroll_date]].map(([l,v])=>(
            <div key={l} style={{fontSize:12}}><span style={{color:T.grey,fontWeight:700}}>{l}: </span><span style={{color:T.navy}}>{v}</span></div>))}
        </div>
        {[{title:"1. Basic Demographic Information",fields:[["Full Name",ben.name],["Date of Birth",ben.dob],["Age",ben.age],["Gender",ben.gender],["Nationality",ben.nationality],["Tribe / Ethnicity",ben.tribe],["Religion",ben.religion],["Region",ben.region],["District",ben.district],["City / Village",ben.city],["Area / Suburb",ben.area],["Physical Location",ben.physical_desc]]},
          {title:"2. Family Background",single:ben.family},{title:"3. Background Information",single:ben.background},
          {title:"4. Education & Employment",fields:[["Education Level",ben.education],["Occupation",ben.occupation],["Employment Status",ben.employment]]},
          {title:"5. Health Information",fields:[["Vulnerability on Arrival",ben.vuln_on_arrival],["Health Status",ben.health],["Height",ben.height],["Weight",ben.weight],["Ghana Card / NHIS",ben.ghana_card],["Disability",ben.disability],["Medical Condition",ben.med_condition]]}
        ].map(sec=>(<div key={sec.title} style={{marginBottom:24}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:T.navy,borderLeft:`4px solid ${T.coral}`,paddingLeft:12,marginBottom:14}}>{sec.title}</div>
          {sec.single&&<div style={{fontSize:13,color:T.navy,lineHeight:1.7,padding:"12px 16px",background:T.off,borderRadius:8}}>{sec.single||"—"}</div>}
          {sec.fields&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{sec.fields.map(([l,v])=>(
            <div key={l}><div style={{fontSize:10,fontWeight:700,color:T.grey,textTransform:"uppercase",letterSpacing:0.6,marginBottom:3}}>{l}</div>
            <div style={{fontSize:13,color:T.navy,borderBottom:`1px solid ${T.greyL}`,paddingBottom:4}}>{v||"—"}</div></div>))}</div>}
        </div>))}
        <div style={{marginBottom:24}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:T.navy,borderLeft:`4px solid ${T.coral}`,paddingLeft:12,marginBottom:14}}>6. Follow-Up Notes</div>
          {(!ben.posts||ben.posts.length===0)?<div style={{color:T.grey,fontSize:13}}>No follow-up notes recorded.</div>
            :(ben.posts||[]).map((p,i)=>(<div key={i} style={{marginBottom:12,padding:"10px 14px",background:T.off,borderRadius:8,borderLeft:`3px solid ${T.coral}`}}>
              <div style={{fontSize:11,color:T.grey,marginBottom:4}}>Date: {p.date} | Officer: {p.author}</div>
              <div style={{fontSize:13,color:T.navy,lineHeight:1.6}}>{p.text}</div></div>))}
        </div>
        <div style={{marginTop:32,paddingTop:20,borderTop:`1px solid ${T.greyM}`,display:"grid",gridTemplateColumns:"1fr 1fr",gap:40}}>
          {["Prepared by (Programme Officer)","Verified by (Coordinator)"].map(l=>(
            <div key={l}><div style={{fontSize:11,color:T.grey,marginBottom:24}}>{l}</div>
            <div style={{borderTop:`1px solid ${T.navy}`,paddingTop:6,fontSize:11,color:T.grey}}>Signature & Date</div></div>))}
        </div>
        <div style={{textAlign:"center",marginTop:20,fontSize:10,color:T.grey}}>LYSBF CYEP · Confidential · {today()}</div>
      </div>
    </div>
  </div>);
}

function BenForm({user,edit,profiles,onSave,onCancel}){
  const blank={bid:"",name:"",age:"",gender:"Male",dob:"",nationality:"Ghanaian",tribe:"",religion:"Christian",region:"Eastern",district:"",city:"",area:"",physical_desc:"",address:"",community:"New Juaben North",occupation:"",employment:"Unemployed",education:"SHS",component_id:1,status:"Active",disability:"N/A",vuln_on_arrival:"No",height:"",weight:"",ghana_card:"",med_condition:"None",health:"Good",family:"",background:"",assigned_to:user.id,enroll_date:today()};
  const [f,setF]=useState(edit?{...edit}:blank);
  const [busy,setBusy]=useState(false);
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  const communities=["New Juaben North","Effiduase","Asokore","Oyoko","Kukurantumi","Old Estate","Zongo","Suhum","Akwadum","Dansuagya"];
  return(<div className="fade-in">
    <Topbar title={edit?"Edit Beneficiary":"Register New Beneficiary"} sub="Fill in all required fields"/>
    <div style={{padding:"24px 32px"}}>
      <Btn variant="secondary" onClick={onCancel} style={{marginBottom:20}}>← Cancel</Btn>
      <div style={{background:T.white,borderRadius:12,padding:"28px 32px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        <SH>Basic Demographics</SH>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:28}}>
          <FI label="Beneficiary ID" value={f.bid} onChange={v=>s("bid",v)} placeholder="e.g. LYSBF-009"/>
          <FI label="Full Name *" value={f.name} onChange={v=>s("name",v)}/>
          <FI label="Date of Birth" value={f.dob} onChange={v=>s("dob",v)} type="date"/>
          <FI label="Age" value={f.age} onChange={v=>s("age",v)} type="number"/>
          <FI label="Gender" value={f.gender} onChange={v=>s("gender",v)} options={["Male","Female"]}/>
          <FI label="Nationality" value={f.nationality} onChange={v=>s("nationality",v)}/>
          <FI label="Tribe / Ethnicity" value={f.tribe} onChange={v=>s("tribe",v)}/>
          <FI label="Religion" value={f.religion} onChange={v=>s("religion",v)} options={["Christian","Muslim","Traditional","Other"]}/>
          <FI label="Region" value={f.region} onChange={v=>s("region",v)}/>
          <FI label="District" value={f.district} onChange={v=>s("district",v)}/>
          <FI label="City / Village" value={f.city} onChange={v=>s("city",v)}/>
          <FI label="Community" value={f.community} onChange={v=>s("community",v)} options={communities}/>
          <FI label="Full Address" value={f.address} onChange={v=>s("address",v)} full/>
        </div>
        <SH>Programme Details</SH>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:28}}>
          <FI label="Programme Component" value={String(f.component_id)} onChange={v=>s("component_id",Number(v))} options={COMPONENTS.map(c=>String(c.id))}/>
          <FI label="Status" value={f.status} onChange={v=>s("status",v)} options={["Active","Completed","On Hold"]}/>
          <FI label="Enrolment Date" value={f.enroll_date} onChange={v=>s("enroll_date",v)} type="date"/>
          {user.role==="Admin"&&<FI label="Assign to Officer" value={String(f.assigned_to)} onChange={v=>s("assigned_to",v)} options={profiles.filter(p=>p.role!=="Admin").map(p=>p.id)}/>}
        </div>
        <SH>Health Information</SH>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:28}}>
          <FI label="Vulnerability on Arrival" value={f.vuln_on_arrival} onChange={v=>s("vuln_on_arrival",v)} options={["Yes","No"]}/>
          <FI label="Health Status" value={f.health} onChange={v=>s("health",v)}/>
          <FI label="Height" value={f.height} onChange={v=>s("height",v)} placeholder="e.g. 170cm"/>
          <FI label="Weight" value={f.weight} onChange={v=>s("weight",v)} placeholder="e.g. 65kg"/>
          <FI label="Ghana Card / NHIS Number" value={f.ghana_card} onChange={v=>s("ghana_card",v)} full/>
          <FI label="Disability Status" value={f.disability} onChange={v=>s("disability",v)} options={["N/A","Visual/Seeing","Hearing/Speech","Orthopedic/Physical","Intellectual/Cognitive"]}/>
          <FI label="Medical Condition" value={f.med_condition} onChange={v=>s("med_condition",v)} full/>
        </div>
        <SH>Education & Employment</SH>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:28}}>
          <FI label="Education Level" value={f.education} onChange={v=>s("education",v)} options={["Primary","JHS","SHS","Vocational","Tertiary","None"]}/>
          <FI label="Occupation" value={f.occupation} onChange={v=>s("occupation",v)}/>
          <FI label="Employment Status" value={f.employment} onChange={v=>s("employment",v)} options={["Employed","Unemployed"]}/>
        </div>
        <SH>Family & Background</SH>
        <div style={{display:"grid",gridTemplateColumns:"1fr",gap:16,marginBottom:28}}>
          <FI label="Family Background" value={f.family} onChange={v=>s("family",v)} type="textarea"/>
          <FI label="Background Information" value={f.background} onChange={v=>s("background",v)} type="textarea"/>
        </div>
        <div style={{display:"flex",gap:12}}>
          <Btn variant="primary" onClick={async()=>{if(!f.name.trim())return;setBusy(true);await onSave(f);setBusy(false);}} style={{opacity:busy?0.6:1}}>{busy?"Saving...":edit?"Save Changes":"Register Beneficiary"}</Btn>
          <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
        </div>
      </div>
    </div>
  </div>);
}

function PostsPage({bens,user}){
  const mine=user.role==="Admin"?bens:bens.filter(b=>b.assigned_to===user.id);
  const all=mine.flatMap(b=>(b.posts||[]).map(p=>({...p,benName:b.name,bid:b.bid,comp:b.component_id}))).sort((a,b2)=>(b2.date||"").localeCompare(a.date||""));
  return(<div className="fade-in">
    <Topbar title="Posts" sub="Your latest follow-up notes and updates"/>
    <div style={{padding:"24px 32px"}}>
      {all.length===0&&<div style={{textAlign:"center",color:T.grey,padding:44}}>No posts yet.</div>}
      {all.map((p,i)=>{const c=COMPONENTS.find(x=>x.id===p.comp);return(
        <div key={i} style={{background:T.white,borderRadius:12,padding:"18px 20px",marginBottom:14,borderLeft:`4px solid ${c?.color||T.coral}`,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <div style={{fontWeight:700,color:T.navy,fontSize:14}}>{p.benName} <span style={{color:T.grey,fontWeight:400,fontSize:12}}>({p.bid})</span></div>
            <div style={{fontSize:12,color:T.grey}}>{p.date}</div>
          </div>
          <div style={{fontSize:11,color:T.grey,marginBottom:8}}>{c?.icon} {c?.name}</div>
          <div style={{fontSize:13,color:T.navy,lineHeight:1.65}}>{p.text}</div>
        </div>);})}
    </div>
  </div>);
}

function UserMgmt({profiles}){
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({name:"",email:"",password:""});
  const [msg,setMsg]=useState("");
  const s=(k,v)=>setForm(p=>({...p,[k]:v}));
  async function create(){
    if(!form.name||!form.email||!form.password){setMsg("Please fill all fields.");return;}
    setMsg("Creating...");
    const {error}=await supabase.auth.signUp({email:form.email,password:form.password,options:{data:{name:form.name,role:"Programme Officer"}}});
    if(error){setMsg("Error: "+error.message);return;}
    setMsg("Account created! User can now log in.");
    setForm({name:"",email:"",password:""});setShowAdd(false);
  }
  return(<div className="fade-in">
    <Topbar title="User Management" sub="Admin only — manage platform users"/>
    <div style={{padding:"24px 32px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div style={{fontSize:13,color:T.grey}}>{profiles.length} users registered</div>
        <Btn variant="primary" onClick={()=>setShowAdd(!showAdd)}>+ Create User Account</Btn>
      </div>
      {msg&&<div style={{background:msg.includes("Error")?T.redL:T.greenL,color:msg.includes("Error")?T.red:T.green,borderRadius:8,padding:"10px 16px",marginBottom:16,fontSize:13}}>{msg}</div>}
      {showAdd&&<div style={{background:T.white,borderRadius:12,padding:"24px",marginBottom:20,boxShadow:"0 2px 10px rgba(0,0,0,0.08)"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:T.navy,marginBottom:16}}>Create New User Account</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
          <FI label="Full Name *" value={form.name} onChange={v=>s("name",v)}/>
          <FI label="Email Address *" value={form.email} onChange={v=>s("email",v)} type="email"/>
          <FI label="Temporary Password *" value={form.password} onChange={v=>s("password",v)} type="password"/>
        </div>
        <div style={{fontSize:11,color:T.grey,background:T.off,padding:"10px 14px",borderRadius:8,marginBottom:14}}>ℹ️ User can change password after login but cannot change their email address.</div>
        <div style={{display:"flex",gap:10}}><Btn variant="primary" onClick={create}>Create Account</Btn><Btn variant="secondary" onClick={()=>setShowAdd(false)}>Cancel</Btn></div>
      </div>}
      <div style={{background:T.white,borderRadius:12,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{background:T.off,borderBottom:`2px solid ${T.greyM}`}}>{["User","Email","Role"].map(h=><th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:11,fontWeight:700,color:T.slate,textTransform:"uppercase",letterSpacing:0.8}}>{h}</th>)}</tr></thead>
          <tbody>{profiles.map((u,i)=>(<tr key={u.id} style={{background:i%2===0?T.white:T.off,borderBottom:`1px solid ${T.greyL}`}}>
            <td style={{padding:"13px 16px"}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:34,height:34,borderRadius:"50%",background:aColor(u.name),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,color:T.white}}>{inits(u.name)}</div><span style={{fontWeight:700,fontSize:13,color:T.navy}}>{u.name}</span></div></td>
            <td style={{padding:"13px 16px",fontSize:12,color:T.navy}}>{u.email||"—"}</td>
            <td style={{padding:"13px 16px"}}><span style={{background:u.role==="Admin"?"#FED7D7":"#BEE3F8",color:u.role==="Admin"?T.red:T.blue,padding:"3px 12px",borderRadius:20,fontSize:11,fontWeight:700}}>{u.role}</span></td>
          </tr>))}</tbody>
        </table>
      </div>
    </div>
  </div>);
}

function Settings(){
  return(<div className="fade-in">
    <Topbar title="Settings" sub="App configuration — Admin only"/>
    <div style={{padding:"24px 32px"}}>
      <div style={{background:T.white,borderRadius:12,padding:"24px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",marginBottom:20}}>
        <SH>Official Website</SH>
        <div style={{background:`linear-gradient(135deg,${T.navy},${T.slate})`,borderRadius:12,padding:"24px",textAlign:"center",color:T.white}}>
          <div style={{fontSize:32,marginBottom:8}}>🌐</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,marginBottom:4}}>LYSBF Official Website</div>
          <div style={{fontSize:12,opacity:0.75,marginBottom:16}}>lysbfoundation.com</div>
          <a href="https://lysbfoundation.com/" target="_blank" rel="noreferrer" style={{display:"inline-block",background:T.coral,color:T.white,padding:"10px 24px",borderRadius:8,fontSize:13,fontWeight:700,textDecoration:"none"}}>Visit Website ↗</a>
        </div>
      </div>
      <div style={{background:T.white,borderRadius:12,padding:"24px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        <SH>App Information</SH>
        {[["App Name","OGB App"],["Version","2.0.0"],["Organisation","LYSBF · CYEP"],["Region","Eastern Region, Ghana"],["Contact","info@lysbfoundation.com"],["Phone","+233 050 026 4315"]].map(([l,v])=>(
          <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${T.greyL}`}}>
            <span style={{fontSize:12,color:T.grey,fontWeight:700}}>{l}</span><span style={{fontSize:12,color:T.navy}}>{v}</span>
          </div>))}
      </div>
    </div>
  </div>);
}

function PostModal({ben,user,onSave,onClose}){
  const [text,setText]=useState("");const [busy,setBusy]=useState(false);
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
    <div style={{background:T.white,borderRadius:16,padding:"28px 32px",width:"100%",maxWidth:560,boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}} onClick={e=>e.stopPropagation()}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:T.navy,marginBottom:18}}>Add Follow-Up Note — {ben.name}</div>
      <Lbl c="Note / Observation *"/>
      <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Describe the follow-up visit, observations, progress, and next steps…"
        style={{width:"100%",border:`1px solid ${T.greyM}`,borderRadius:8,padding:"10px 14px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",color:T.navy,minHeight:130,resize:"vertical",marginBottom:18,marginTop:6}}/>
      <div style={{display:"flex",gap:10}}>
        <Btn variant="primary" onClick={async()=>{if(!text.trim())return;setBusy(true);await onSave(ben,text,user);setBusy(false);}}>{busy?"Saving...":"Save Note"}</Btn>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
      </div>
    </div>
  </div>);
}

export default function App(){
  const [user,setUser]=useState(null);
  const [loading,setLoading]=useState(true);
  const [page,setPage]=useState("dashboard");
  const [bens,setBens]=useState([]);
  const [profiles,setProfiles]=useState([]);
  const [viewBen,setView]=useState(null);
  const [editBen,setEdit]=useState(null);
  const [sirBen,setSir]=useState(null);
  const [postModal,setPost]=useState(null);

  useEffect(()=>{
    if(!document.getElementById("ogb-css")){const el=document.createElement("style");el.id="ogb-css";el.textContent=CSS;document.head.appendChild(el);}
  },[]);

  useEffect(()=>{
    supabase.auth.getSession().then(async({data:{session}})=>{
      if(session){
        const {data:prof}=await supabase.from("profiles").select("*").eq("id",session.user.id).single();
        if(prof){setUser({id:session.user.id,email:session.user.email,name:prof.name,role:prof.role,avatar:prof.avatar||inits(prof.name)});await loadData(session.user.id,prof.role);}
      }
      setLoading(false);
    });
  },[]);

  async function loadData(uid,role){
    const {data:profs}=await supabase.from("profiles").select("*").order("name");
    if(profs)setProfiles(profs);
    let q=supabase.from("beneficiaries").select("*, posts(*)").order("name");
    if(role!=="Admin")q=q.eq("assigned_to",uid);
    const {data:bd}=await q;
    if(bd)setBens(bd);
  }

  function nav(p){setView(null);setEdit(null);setSir(null);setPage(p);}

  async function handleLogin(u){setUser(u);await loadData(u.id,u.role);setPage("dashboard");}

  async function handleLogout(){await supabase.auth.signOut();setUser(null);setBens([]);setProfiles([]);setPage("dashboard");}

  async function saveBen(f){
    const payload={bid:f.bid,name:f.name,age:Number(f.age)||null,gender:f.gender,dob:f.dob||null,nationality:f.nationality,tribe:f.tribe,religion:f.religion,region:f.region,district:f.district,city:f.city,area:f.area,physical_desc:f.physical_desc,address:f.address,community:f.community,occupation:f.occupation,employment:f.employment,education:f.education,component_id:Number(f.component_id),status:f.status,disability:f.disability,vuln_on_arrival:f.vuln_on_arrival,height:f.height,weight:f.weight,ghana_card:f.ghana_card,med_condition:f.med_condition,health:f.health,family:f.family,background:f.background,assigned_to:f.assigned_to||user.id,enroll_date:f.enroll_date||today()};
    if(editBen){const {data}=await supabase.from("beneficiaries").update(payload).eq("id",editBen.id).select("*,posts(*)").single();if(data)setBens(bs=>bs.map(b=>b.id===editBen.id?data:b));}
    else{const {data}=await supabase.from("beneficiaries").insert([payload]).select("*,posts(*)").single();if(data)setBens(bs=>[...bs,data]);}
    setEdit(null);nav("ben-list");
  }

  async function addPost(ben,text,author){
    const {data}=await supabase.from("posts").insert([{beneficiary_id:ben.id,author:author.name,text,date:today()}]).select().single();
    if(data){setBens(bs=>bs.map(b=>b.id===ben.id?{...b,posts:[...(b.posts||[]),data],last_follow_up:data.date}:b));if(viewBen?.id===ben.id)setView(v=>({...v,posts:[...(v.posts||[]),data],last_follow_up:data.date}));}
    setPost(null);
  }

  if(loading)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:T.off,flexDirection:"column",gap:16}}>
    <div className="spin" style={{width:44,height:44,border:`4px solid ${T.greyM}`,borderTopColor:T.coral,borderRadius:"50%"}}/>
    <div style={{color:T.grey,fontSize:14}}>Loading OGB App...</div>
  </div>);

  if(!user)return <Login onLogin={handleLogin}/>;

  function renderPage(){
    if(sirBen)return <SIRView ben={sirBen} profiles={profiles} onBack={()=>setSir(null)}/>;
    if(viewBen)return <Profile ben={viewBen} user={user} profiles={profiles} onBack={()=>setView(null)} onAddPost={b=>setPost(b)} onSIR={b=>setSir(b)}/>;
    if(editBen||page==="ben-add")return <BenForm user={user} edit={editBen} profiles={profiles} onSave={saveBen} onCancel={()=>{setEdit(null);nav("ben-list");}}/>;
    if(page==="dashboard")return <Dashboard bens={bens} user={user}/>;
    if(page==="ben-list")return <BenList bens={bens} user={user} profiles={profiles} onView={b=>setView(b)} onEdit={b=>setEdit(b)} onSIR={b=>setSir(b)}/>;
    if(page==="posts")return <PostsPage bens={bens} user={user}/>;
    if(page==="users"&&user.role==="Admin")return <UserMgmt profiles={profiles}/>;
    if(page==="settings"&&user.role==="Admin")return <Settings/>;
    if(page.startsWith("sir"))return <SIRView ben={null} profiles={profiles} onBack={()=>nav("dashboard")}/>;
    return <Dashboard bens={bens} user={user}/>;
  }

  return(<div style={{fontFamily:"'Source Sans 3',sans-serif",minHeight:"100vh",background:T.off,display:"flex"}}>
    <Sidebar user={user} page={page} setPage={nav} onLogout={handleLogout}/>
    <div style={{marginLeft:248,flex:1,minHeight:"100vh"}}>{renderPage()}</div>
    {postModal&&<PostModal ben={postModal} user={user} onSave={addPost} onClose={()=>setPost(null)}/>}
  </div>);
}
