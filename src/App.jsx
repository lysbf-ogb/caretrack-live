/* eslint-disable */
import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://hdcsjkptswmsjgcsqzki.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkY3Nqa3B0c3dtc2pnY3NxemtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MjQyNzEsImV4cCI6MjA5NjAwMDI3MX0.V5Axs0KeuKVvM83qxrcItG8MJIQYw5TL9yOkF-2DpUI",
  {auth:{storage:window.sessionStorage}}
);

const PHOTO_BUCKET="beneficiary-photos";
const BRAND_BUCKET="app-branding"; // PUBLIC bucket for the logo only, so the sign-in page can show it
const SIGNED_URL_TTL=60*60*8;

if(!window.XLSX){const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";document.head.appendChild(s);}

function photoPathFrom(stored){
  if(!stored)return null;
  if(stored.includes("/beneficiary-photos/"))return stored.split("/beneficiary-photos/")[1].split("?")[0];
  return stored;
}

async function signPhotoUrls(bens){
  const paths=[...new Set(bens.map(b=>photoPathFrom(b.photo_url)).filter(Boolean))];
  let map={};
  if(paths.length>0){
    try{
      const{data,error}=await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths,SIGNED_URL_TTL);
      if(!error&&data)data.forEach(d=>{if(d.signedUrl&&d.path)map[d.path]=d.signedUrl;});
    }catch(e){console.log("Photo sign error:",e);}
  }
  return bens.map(b=>{const p=photoPathFrom(b.photo_url);return{...b,photo_path:p,photo_url:p?(map[p]||null):null};});
}

async function loadAppUsers(){
  try{const{data,error}=await supabase.from("app_users").select("*").order("name");if(!error&&data&&data.length>0)return data;}catch(e){}
  return [];
}

async function loginUser(email,password){
  try{
    const{data:authData,error:authError}=await supabase.auth.signInWithPassword({email:email.toLowerCase(),password});
    if(authError||!authData.user)return null;
    const{data:profile,error:profileError}=await supabase.from("app_users").select("*").eq("auth_id",authData.user.id).single();
    if(profileError||!profile)return null;
    // Block inactive users from logging in
    if(profile.status==="Inactive"){
      await supabase.auth.signOut();
      return{inactive:true};
    }
    return{...profile,email:email.toLowerCase()};
  }catch(e){return null;}
}

async function updateUserPassword(userId,newPassword){
  try{const{error}=await supabase.auth.updateUser({password:newPassword});return!error;}catch(e){return false;}
}

async function saveAppUser(user){
  try{
    if(user.auth_id){
      const{error}=await supabase.from("app_users").upsert({...user},{onConflict:"id"});return!error;
    }
    // Save current admin session before creating new user
    const{data:{session:adminSession}}=await supabase.auth.getSession();
    // Sign up new user
    const{data:authData,error:authError}=await supabase.auth.signUp({
      email:user.email.toLowerCase(),
      password:user.password,
    });
    if(authError){console.log("Auth signup error:",authError.message);return false;}
    if(!authData.user){console.log("No auth user returned");return false;}
    if(authData.user.identities&&authData.user.identities.length===0){
      console.log("Email already exists in Auth");return false;
    }
    const authUserId=authData.user.id;
    // Restore admin session immediately
    if(adminSession){await supabase.auth.setSession({access_token:adminSession.access_token,refresh_token:adminSession.refresh_token});}
    // Save profile to app_users
    const{error:profileError}=await supabase.from("app_users").insert({
      id:user.id,name:user.name,email:user.email.toLowerCase(),
      role:user.role,avatar:user.avatar,auth_id:authUserId
    });
    if(profileError){console.log("Profile insert error:",profileError.message);return false;}
    return true;
  }catch(e){console.log("saveAppUser exception:",e);return false;}
}

async function deleteAppUser(userId){
  try{const{error}=await supabase.from("app_users").delete().eq("id",userId);return!error;}catch(e){return false;}
}

const CSS=`
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+3:wght@300;400;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Source Sans 3',sans-serif;background:#F7FAFC;}
  ::-webkit-scrollbar{width:6px;}::-webkit-scrollbar-thumb{background:#CBD5E0;border-radius:3px;}
  .nav-item:hover{background:rgba(255,255,255,0.12)!important;}
  .nav-sub:hover{background:rgba(255,255,255,0.10)!important;color:#fff!important;}
  .card-hover:hover{transform:translateY(-4px);box-shadow:0 16px 40px rgba(0,0,0,0.22)!important;}
  .btn-hover:hover{filter:brightness(1.08);transform:translateY(-1px);}
  .row-hover:hover{background:#EBF8FF!important;}
  .tab-btn:hover{background:#fff!important;color:#1A365D!important;}
  .action-btn:hover{filter:brightness(0.90);}
  .upload-zone-hover:hover{border-color:#27AE60!important;background:#EAFAF1!important;}
  @media print{.no-print{display:none!important;}body{background:white;}.print-main{margin-left:0!important;}@page{size:A4 landscape;margin:12mm;}}
  input:focus,select:focus,textarea:focus{border-color:#27AE60!important;box-shadow:0 0 0 3px rgba(39,174,96,0.15);outline:none;}
  .fade-in{animation:fadeIn 0.3s ease;}
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}
  .spin{animation:spin 1s linear infinite;display:inline-block;}
  @keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
  .sidebar-transition{transition:width 0.25s ease,opacity 0.25s ease;}
  .main-transition{transition:margin-left 0.25s ease;}
`;

const T={white:"#FFFFFF",navy:"#1A252F",slate:"#2A4365",green:"#27AE60",off:"#F7FAFC",grey:"#718096",greyL:"#EDF2F7",greyM:"#CBD5E0",red:"#C0392B",redL:"#FDEDEC"};

const COMPONENTS=[
  {id:1,name:"Sports for Development",icon:"🏃",color:"#E74C3C",light:"#FDEDEC"},
  {id:2,name:"Youth Leadership & Mentorship",icon:"🤝",color:"#2980B9",light:"#EBF5FB"},
  {id:3,name:"Entrepreneurship & Skills Development",icon:"🛠️",color:"#F39C12",light:"#FEF9E7"},
  {id:4,name:"Education Support",icon:"📚",color:"#27AE60",light:"#EAFAF1"},
  {id:5,name:"Health & Wellness",icon:"🏥",color:"#E67E22",light:"#FEF5E7"},
  {id:6,name:"Disability Inclusion & Social Protection",icon:"🫂",color:"#8E44AD",light:"#F5EEF8"},
  {id:7,name:"Environmental Sanitation & Community Service",icon:"♻️",color:"#16A085",light:"#E8F8F5"},
];

const STAT_CARDS=[
  {label:"Total Beneficiaries",icon:"👨‍👩‍👧‍👦",bg:"#1A252F"},
  {label:"Active",icon:"✅",bg:"#27AE60"},
  {label:"Completed",icon:"🎯",bg:"#2980B9"},
  {label:"Male",icon:"👨",bg:"#8E44AD"},
  {label:"Female",icon:"👩",bg:"#E67E22"},
];

const AC=["#E74C3C","#2980B9","#F39C12","#27AE60","#E67E22","#8E44AD","#16A085"];
function aColor(n=""){let h=0;for(let c of n)h=(h*31+c.charCodeAt(0))%AC.length;return AC[h];}
function inits(n=""){return n.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();}
function sPill(s){if(s==="Active")return{bg:"#EAFAF1",color:"#1D8348"};if(s==="Completed")return{bg:"#EBF5FB",color:"#1A5276"};return{bg:"#FEF9E7",color:"#9A7D0A"};}
function today(){return new Date().toISOString().slice(0,10);}

function BenAvatar({ben,size=38,fontSize=13}){
  if(ben&&ben.photo_url){
    return <img src={ben.photo_url} alt={ben.name} style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",flexShrink:0}}/>;
  }
  return <div style={{width:size,height:size,borderRadius:"50%",background:aColor(ben?ben.name:""),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize,color:"#fff",flexShrink:0}}>{inits(ben?ben.name:"")}</div>;
}

const Pill=({s})=>{const{bg,color}=sPill(s);return <span style={{background:bg,color,padding:"3px 12px",borderRadius:20,fontSize:11,fontWeight:700,display:"inline-block"}}>{s}</span>;};
const Lbl=({c})=><div style={{fontSize:11,fontWeight:700,color:T.slate,textTransform:"uppercase",letterSpacing:0.8,marginBottom:5}}>{c}</div>;
const FBox=({v})=><div style={{background:T.off,border:`1px solid ${T.greyM}`,borderRadius:8,padding:"9px 14px",fontSize:13,color:T.navy,minHeight:38}}>{v||"—"}</div>;
const Btn=({children,onClick,variant="primary",style:sx})=>{
  const b={padding:"10px 22px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'Source Sans 3',sans-serif",transition:"all 0.18s",...sx};
  const v=variant==="primary"?{background:"#27AE60",color:"#fff"}:variant==="navy"?{background:"#1A252F",color:"#fff"}:variant==="danger"?{background:"#C0392B",color:"#fff"}:{background:T.off,color:T.navy,border:`1px solid ${T.greyM}`};
  return <button className="btn-hover" style={{...b,...v}} onClick={onClick}>{children}</button>;
};
const SH=({children})=>(<div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}><span style={{fontSize:12,fontWeight:700,color:T.slate,textTransform:"uppercase",letterSpacing:2}}>{children}</span><div style={{flex:1,height:1,background:T.greyM}}/></div>);
const FI=({label,value,onChange,type="text",options,full,readOnly,placeholder})=>(
  <div style={{display:"flex",flexDirection:"column",gap:5,...(full?{gridColumn:"1/-1"}:{})}}>
    <Lbl c={label}/>
    {options?<select value={value||""} onChange={e=>onChange&&onChange(e.target.value)} disabled={readOnly} style={{border:`1px solid ${T.greyM}`,borderRadius:8,padding:"9px 14px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",background:readOnly?T.off:"#fff",color:T.navy}}>{options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}</select>
    :type==="textarea"?<textarea spellCheck="true" lang="en" value={value||""} onChange={e=>onChange&&onChange(e.target.value)} readOnly={readOnly} placeholder={placeholder||""} style={{border:`1px solid ${T.greyM}`,borderRadius:8,padding:"9px 14px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",background:readOnly?T.off:"#fff",color:T.navy,minHeight:80,resize:"vertical"}}/>
    :<input type={type} value={value||""} onChange={e=>onChange&&onChange(e.target.value)} readOnly={readOnly} placeholder={placeholder||""} style={{border:`1px solid ${T.greyM}`,borderRadius:8,padding:"9px 14px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",background:readOnly?T.off:"#fff",color:T.navy}}/>}
  </div>
);

function Logo({size=40,color="#fff",url=null}){
  if(url)return <img src={url} alt="logo" style={{width:size,height:size,objectFit:"contain",borderRadius:6}}/>;
  return(<svg width={size} height={size} viewBox="0 0 100 100" fill="none"><path d="M50 18 C44 8 28 4 18 14 C8 24 10 42 22 50 C10 58 8 76 18 86 C28 96 44 92 50 82 C56 92 72 96 82 86 C92 76 90 58 78 50 C90 42 92 24 82 14 C72 4 56 8 50 18Z" stroke={color} strokeWidth="6" fill="none" strokeLinejoin="round" strokeLinecap="round"/><circle cx="50" cy="13" r="4" fill={color}/><circle cx="50" cy="87" r="4" fill={color}/><circle cx="13" cy="50" r="4" fill={color}/><circle cx="87" cy="50" r="4" fill={color}/></svg>);
}

// ─── Notification helpers ────────────────────────────────────────────────────
async function createNotification(userId,type,title,message,beneficiaryId,postId){
  if(!userId)return;
  try{
    // Check user is active before sending notification
    const{data:targetUser}=await supabase.from("app_users").select("status").eq("id",userId).single();
    if(targetUser?.status==="Inactive")return;
    await supabase.from("notifications").insert([{
      user_id:userId,type,title,message,
      beneficiary_id:beneficiaryId||null,
      post_id:postId||null,
      is_read:false,
      created_at:new Date().toISOString()
    }]);
  }catch(e){console.log("Notification error:",e);}
}

function timeAgo(dateStr){
  if(!dateStr)return "";
  const diff=Math.floor((new Date()-new Date(dateStr))/1000);
  if(diff<60)return"just now";
  if(diff<3600)return Math.floor(diff/60)+"m ago";
  if(diff<86400)return Math.floor(diff/3600)+"h ago";
  return Math.floor(diff/86400)+"d ago";
}

function NotificationBell({user,onNavigateToBen}){
  const [notifs,setNotifs]=useState([]);
  const [open,setOpen]=useState(false);
  const [loading,setLoading]=useState(false);
  const ref=useRef();
  const unread=notifs.filter(n=>!n.is_read).length;

  useEffect(()=>{
    if(!user)return;
    loadNotifs();
    // Poll every 30 seconds for new notifications
    const interval=setInterval(loadNotifs,30000);
    return()=>clearInterval(interval);
  },[user]);

  useEffect(()=>{
    function handleClick(e){if(ref.current&&!ref.current.contains(e.target))setOpen(false);}
    document.addEventListener("mousedown",handleClick);
    return()=>document.removeEventListener("mousedown",handleClick);
  },[]);

  async function loadNotifs(){
    try{
      const{data}=await supabase.from("notifications").select("*").eq("user_id",user.id).order("created_at",{ascending:false}).limit(20);
      if(data)setNotifs(data);
    }catch(e){}
  }

  async function markAllRead(){
    await supabase.from("notifications").update({is_read:true}).eq("user_id",user.id).eq("is_read",false);
    setNotifs(n=>n.map(x=>({...x,is_read:true})));
  }

  async function handleNotifClick(notif){
    await supabase.from("notifications").update({is_read:true}).eq("id",notif.id);
    setNotifs(n=>n.map(x=>x.id===notif.id?{...x,is_read:true}:x));
    setOpen(false);
    if(notif.type==="plan"&&notif.post_id){
      onNavigateToBen(null,{type:"planner",targetUserId:notif.post_id});
    } else if(notif.beneficiary_id){
      onNavigateToBen(notif.beneficiary_id,null);
    }
  }

  const typeIcon=(type)=>{
    if(type==="follow_up")return"📋";
    if(type==="comment")return"💬";
    if(type==="assignment")return"👤";
    return"🔔";
  };

  return(<div ref={ref} style={{position:"relative"}}>
    <button onClick={()=>setOpen(o=>!o)} style={{position:"relative",width:34,height:34,borderRadius:8,border:`1px solid ${T.greyM}`,background:open?T.lightGreen:T.off,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,transition:"all 0.15s"}}>
      🔔
      {unread>0&&<span style={{position:"absolute",top:-4,right:-4,background:"#C0392B",color:"#fff",borderRadius:"50%",width:17,height:17,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,fontFamily:"'Source Sans 3',sans-serif"}}>{unread>9?"9+":unread}</span>}
    </button>
    {open&&<div style={{position:"absolute",right:0,top:42,width:340,background:"#fff",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,0.18)",border:`1px solid ${T.greyM}`,zIndex:300,overflow:"hidden"}}>
      <div style={{padding:"14px 16px",borderBottom:`1px solid ${T.greyL}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontWeight:700,fontSize:14,color:T.navy}}>Notifications {unread>0&&<span style={{background:"#C0392B",color:"#fff",borderRadius:20,padding:"1px 8px",fontSize:11,marginLeft:6}}>{unread}</span>}</div>
        {unread>0&&<button onClick={markAllRead} style={{fontSize:11,color:"#27AE60",background:"none",border:"none",cursor:"pointer",fontWeight:700}}>Mark all read</button>}
      </div>
      <div style={{maxHeight:380,overflowY:"auto"}}>
        {notifs.length===0&&<div style={{padding:24,textAlign:"center",color:T.grey,fontSize:13}}>No notifications yet.</div>}
        {notifs.map(n=>(<div key={n.id} onClick={()=>handleNotifClick(n)} style={{padding:"12px 16px",borderBottom:`1px solid ${T.greyL}`,cursor:"pointer",background:n.is_read?"#fff":"#F0FBF4",transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="#F7FAFC"} onMouseLeave={e=>e.currentTarget.style.background=n.is_read?"#fff":"#F0FBF4"}>
          <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:n.is_read?T.greyL:"#EAFAF1",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{typeIcon(n.type)}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:n.is_read?400:700,fontSize:13,color:T.navy,marginBottom:2}}>{n.title}</div>
              <div style={{fontSize:11,color:T.grey,lineHeight:1.4,marginBottom:3}}>{n.message}</div>
              <div style={{fontSize:10,color:T.slate}}>{timeAgo(n.created_at)}</div>
            </div>
            {!n.is_read&&<div style={{width:7,height:7,borderRadius:"50%",background:"#27AE60",flexShrink:0,marginTop:4}}/>}
          </div>
        </div>))}
      </div>
    </div>}
  </div>);
}

function Topbar({title,sub,onToggle,user,onNavigateToBen}){
  const NavBtn=({onClick,children,label})=>(<button onClick={onClick} aria-label={label} title={label} style={{width:30,height:30,borderRadius:7,border:`1px solid ${T.greyM}`,background:T.off,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:14,transition:"background 0.15s",color:T.slate}}>{children}</button>);
  return(<div className="no-print" style={{background:"#fff",borderBottom:`1px solid ${T.greyM}`,padding:"0 20px 0 14px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <NavBtn onClick={onToggle} label="Toggle sidebar">☰</NavBtn>
      <NavBtn onClick={()=>window.history.back()} label="Go back">←</NavBtn>
      <NavBtn onClick={()=>window.history.forward()} label="Go forward">→</NavBtn>
      <NavBtn onClick={()=>window.location.reload()} label="Reload page">⟳</NavBtn>
      <div style={{width:1,height:24,background:T.greyM,margin:"0 4px"}}/>
      <div><div style={{fontFamily:"'Playfair Display',serif",fontSize:19,fontWeight:700,color:T.navy}}>{title}</div>{sub&&<div style={{fontSize:12,color:T.grey}}>{sub}</div>}</div>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:12}}>
      {user&&onNavigateToBen&&<NotificationBell user={user} onNavigateToBen={onNavigateToBen}/>}
      <div style={{fontSize:12,color:T.grey}}>{new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</div>
    </div>
  </div>);
}

function Login({onLogin,users,logoUrl}){
  const [email,setEmail]=useState("");const [pass,setPass]=useState("");const [err,setErr]=useState("");const [busy,setBusy]=useState(false);
  async function go(){
    if(!email||!pass){setErr("Please enter your email and password.");return;}
    setBusy(true);setErr("");
    const u=await loginUser(email,pass);
    if(u&&u.inactive)setErr("Your account has been deactivated. Please contact your administrator.");
    else if(u)onLogin(u);else setErr("Invalid email or password.");
    setBusy(false);
  }
  return(<div style={{minHeight:"100vh",background:`linear-gradient(160deg,#1A252F 0%,#27AE60 100%)`,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div style={{background:"#fff",borderRadius:20,padding:"44px 40px",width:400,boxShadow:"0 24px 64px rgba(0,0,0,0.35)"}}>
      <div style={{textAlign:"center",marginBottom:28}}><Logo size={56} color="#27AE60" url={logoUrl}/><div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,color:T.navy,marginTop:10}}>OGB App</div><div style={{fontSize:12,color:T.grey,marginTop:4}}>LYSBF · Community Youth Empowerment Programme</div></div>
      {err&&<div style={{background:T.redL,color:T.red,borderRadius:8,padding:"10px 14px",fontSize:13,marginBottom:14,textAlign:"center"}}>{err}</div>}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <input placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} type="email" onKeyDown={e=>e.key==="Enter"&&go()} style={{border:`1.5px solid ${T.greyM}`,borderRadius:10,padding:"12px 16px",fontSize:14,fontFamily:"'Source Sans 3',sans-serif",color:T.navy,width:"100%"}}/>
        <input placeholder="Password" value={pass} onChange={e=>setPass(e.target.value)} type="password" onKeyDown={e=>e.key==="Enter"&&go()} style={{border:`1.5px solid ${T.greyM}`,borderRadius:10,padding:"12px 16px",fontSize:14,fontFamily:"'Source Sans 3',sans-serif",color:T.navy,width:"100%"}}/>
        <button onClick={go} disabled={busy} style={{background:busy?"#95a5a6":"#27AE60",color:"#fff",border:"none",borderRadius:10,padding:"13px",fontSize:15,fontWeight:700,fontFamily:"'Source Sans 3',sans-serif",cursor:busy?"not-allowed":"pointer"}}>{busy?"Signing in...":"Sign In →"}</button>
      </div>
      <div style={{marginTop:20,padding:"12px 14px",background:T.off,borderRadius:8,fontSize:11,color:T.grey,textAlign:"center"}}>Contact your Coordinator for login credentials</div>
    </div>
  </div>);
}

// Shown when a user arrives via a password-reset email link.
function ResetPassword({logoUrl,onDone}){
  const [pw,setPw]=useState("");const [pw2,setPw2]=useState("");const [msg,setMsg]=useState("");const [busy,setBusy]=useState(false);
  async function save(){
    if(pw.length<6){setMsg("Password must be at least 6 characters.");return;}
    if(pw!==pw2){setMsg("Passwords do not match.");return;}
    setBusy(true);setMsg("");
    const{error}=await supabase.auth.updateUser({password:pw});
    if(error){setMsg("Error: "+error.message);setBusy(false);return;}
    await supabase.auth.signOut();
    onDone();
  }
  return(<div style={{minHeight:"100vh",background:`linear-gradient(160deg,#1A252F 0%,#27AE60 100%)`,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div style={{background:"#fff",borderRadius:20,padding:"44px 40px",width:400,boxShadow:"0 24px 64px rgba(0,0,0,0.35)"}}>
      <div style={{textAlign:"center",marginBottom:28}}><Logo size={56} color="#27AE60" url={logoUrl}/><div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:T.navy,marginTop:10}}>Choose a New Password</div><div style={{fontSize:12,color:T.grey,marginTop:4}}>You will sign in with this password from now on</div></div>
      {msg&&<div style={{background:T.redL,color:T.red,borderRadius:8,padding:"10px 14px",fontSize:13,marginBottom:14,textAlign:"center"}}>{msg}</div>}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <input placeholder="New password" value={pw} onChange={e=>setPw(e.target.value)} type="password" style={{border:`1.5px solid ${T.greyM}`,borderRadius:10,padding:"12px 16px",fontSize:14,fontFamily:"'Source Sans 3',sans-serif",color:T.navy,width:"100%"}}/>
        <input placeholder="Confirm new password" value={pw2} onChange={e=>setPw2(e.target.value)} type="password" onKeyDown={e=>e.key==="Enter"&&save()} style={{border:`1.5px solid ${T.greyM}`,borderRadius:10,padding:"12px 16px",fontSize:14,fontFamily:"'Source Sans 3',sans-serif",color:T.navy,width:"100%"}}/>
        <button onClick={save} disabled={busy} style={{background:busy?"#95a5a6":"#27AE60",color:"#fff",border:"none",borderRadius:10,padding:"13px",fontSize:15,fontWeight:700,fontFamily:"'Source Sans 3',sans-serif",cursor:busy?"not-allowed":"pointer"}}>{busy?"Saving...":"Save Password →"}</button>
      </div>
      <div style={{marginTop:20,padding:"12px 14px",background:T.off,borderRadius:8,fontSize:11,color:T.grey,textAlign:"center"}}>After saving, sign in with your email and new password</div>
    </div>
  </div>);
}

function Sidebar({user,page,setPage,onLogout,logoUrl,isOpen,onToggle}){
  const [benOpen,setBen]=useState(true);const [sirOpen,setSir]=useState(false);
  const NI=({label,icon,p,sub})=>(<div className={sub?"nav-sub":"nav-item"} onClick={()=>setPage(p)} style={{display:"flex",alignItems:"center",gap:9,padding:sub?"7px 12px 7px 40px":"10px 14px",borderRadius:8,cursor:"pointer",marginBottom:2,color:page===p?"#fff":"rgba(255,255,255,0.78)",fontWeight:page===p?700:400,fontSize:sub?12:13,background:page===p?"rgba(255,255,255,0.20)":"transparent",transition:"all 0.18s",fontFamily:"'Source Sans 3',sans-serif",whiteSpace:"nowrap"}}><span style={{fontSize:sub?14:17,minWidth:20,textAlign:"center"}}>{icon}</span><span>{label}</span></div>);
  const G=({label,icon,open,setOpen,children})=>(<><div className="nav-item" onClick={()=>setOpen(!open)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderRadius:8,cursor:"pointer",color:"rgba(255,255,255,0.82)",fontSize:13,marginBottom:2,transition:"all 0.18s",fontFamily:"'Source Sans 3',sans-serif",whiteSpace:"nowrap"}}><span style={{display:"flex",alignItems:"center",gap:9}}><span style={{fontSize:17,minWidth:20,textAlign:"center"}}>{icon}</span><span>{label}</span></span><span style={{fontSize:10,opacity:0.6}}>{open?"▲":"▼"}</span></div>{open&&children}</>);
  return(<div className="no-print sidebar-transition" style={{width:isOpen?248:0,minHeight:"100vh",background:`linear-gradient(180deg,#1E8449 0%,#27AE60 100%)`,display:"flex",flexDirection:"column",flexShrink:0,position:"fixed",top:0,left:0,bottom:0,zIndex:100,overflowX:"hidden",overflowY:isOpen?"auto":"hidden"}}>
    <div style={{width:248,display:"flex",flexDirection:"column",flex:1}}>
      <div style={{padding:"22px 18px 16px",borderBottom:"1px solid rgba(255,255,255,0.15)"}}><div style={{display:"flex",alignItems:"center",gap:10}}><Logo size={36} color="#fff" url={logoUrl}/><div style={{flex:1,minWidth:0}}><div style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:"#fff",whiteSpace:"nowrap"}}>OGB App</div><div style={{fontSize:9,color:"rgba(255,255,255,0.55)",letterSpacing:2,textTransform:"uppercase",whiteSpace:"nowrap"}}>LYSBF · CYEP</div></div><button onClick={onToggle} aria-label="Collapse sidebar" style={{width:26,height:26,borderRadius:6,border:"1px solid rgba(255,255,255,0.25)",background:"rgba(255,255,255,0.12)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"rgba(255,255,255,0.7)",fontSize:13}}>←</button></div></div>
      <div style={{padding:"14px 10px",flex:1}}>
        <NI label="Dashboard" icon="🏠" p="dashboard"/>
        {user.role!=="Management"&&<G label="Beneficiaries" icon="👨‍👩‍👧‍👦" open={benOpen} setOpen={setBen}><NI label="List" icon="📋" p="ben-list" sub/>{user.role!=="Management"&&<NI label="Add" icon="➕" p="ben-add" sub/>}</G>}
        {user.role==="Management"&&<NI label="Beneficiaries" icon="👨‍👩‍👧‍👦" p="ben-list"/>}
        <NI label="Activity Planner" icon="📅" p="planner"/>
        {user.role!=="Management"&&<NI label="Posts" icon="💬" p="posts"/>}
        <NI label="My Account" icon="👤" p="my-account"/>
        {user.role==="Admin"&&<><div style={{margin:"14px 0 6px",padding:"0 14px",fontSize:10,color:"rgba(255,255,255,0.40)",letterSpacing:2,textTransform:"uppercase",whiteSpace:"nowrap"}}>Admin</div><NI label="User Management" icon="👥" p="users"/><NI label="Beneficiary Management" icon="🗂️" p="ben-mgmt"/><NI label="Settings" icon="🔧" p="settings"/></>}
        {user.role==="Management"&&<><div style={{margin:"14px 0 6px",padding:"0 14px",fontSize:10,color:"rgba(255,255,255,0.40)",letterSpacing:2,textTransform:"uppercase",whiteSpace:"nowrap"}}>Management</div><NI label="Org Structure" icon="🏢" p="org-structure"/><NI label="Staff Directory" icon="👥" p="staff-directory"/><NI label="Settings" icon="🔧" p="settings"/></>}
        {user.role==="Programme Coordinator"&&<><div style={{margin:"14px 0 6px",padding:"0 14px",fontSize:10,color:"rgba(255,255,255,0.40)",letterSpacing:2,textTransform:"uppercase",whiteSpace:"nowrap"}}>Coordinator</div><NI label="My Officers" icon="👥" p="my-officers"/></>}
      </div>
      <div style={{padding:"14px 16px",borderTop:"1px solid rgba(255,255,255,0.15)"}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:36,height:36,borderRadius:"50%",background:"rgba(255,255,255,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:"#fff",flexShrink:0}}>{user.avatar}</div><div style={{flex:1,minWidth:0}}><div style={{color:"#fff",fontSize:12,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name}</div><div style={{fontSize:10,color:"rgba(255,255,255,0.7)",background:"rgba(0,0,0,0.18)",padding:"2px 8px",borderRadius:20,display:"inline-block",marginTop:2,whiteSpace:"nowrap"}}>{user.role}</div></div><span onClick={onLogout} style={{color:"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:18,flexShrink:0}}>⇠</span></div></div>
    </div>
  </div>);
}

function Dashboard({bens,user,users,onNavigate,onToggle,onNavigateToBen}){
  // Dashboard stats: ALL roles see full organisation numbers — gives officers
  // the sense of collective impact. Clicking a card filters to own cases only
  // for officers (confidentiality preserved in the list).
  const vis=bens;
  const myBens=user.role==="Programme Officer"?bens.filter(b=>b.assigned_to===user.id):bens;
  const counts=[vis.length,vis.filter(b=>b.status==="Active").length,vis.filter(b=>b.status==="Completed").length,vis.filter(b=>b.gender==="Male").length,vis.filter(b=>b.gender==="Female").length];
  const statFilters=["all","Active","Completed","Male","Female"];
  const overdueCount=myBens.filter(b=>!b.last_follow_up||(new Date()-new Date(b.last_follow_up))>90*24*60*60*1000).length;
  // Officers navigate to their own filtered list when clicking cards
  function handleStatClick(filter){onNavigate("ben-list",filter);}
  return(<div className="fade-in"><Topbar user={user} onNavigateToBen={onNavigateToBen} onToggle={onToggle} title="Dashboard" sub="View current tasks, activities and reports"/>
    <div style={{padding:"28px 32px"}}>
      <SH>Programme Summary at a Glance</SH>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:16,marginBottom:36}}>
        {STAT_CARDS.map((s,i)=>(<div key={s.label} className="card-hover" onClick={()=>handleStatClick({stat:statFilters[i]})} style={{background:s.bg,borderRadius:16,padding:"32px 16px",textAlign:"center",cursor:"pointer",transition:"all 0.22s",boxShadow:"0 6px 20px rgba(0,0,0,0.20)"}}>
          <div style={{width:56,height:56,borderRadius:"50%",background:"rgba(255,255,255,0.20)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontSize:26}}>{s.icon}</div>
          <div style={{fontSize:52,fontWeight:800,color:"#fff",lineHeight:1,fontFamily:"'Playfair Display',serif"}}>{counts[i]}</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.88)",textTransform:"uppercase",letterSpacing:1.5,fontWeight:700,marginTop:10}}>{s.label}</div>
        </div>))}
      </div>
      {overdueCount>0&&(<><SH>Follow-Up Alerts</SH>
      <div onClick={()=>handleStatClick({overdue:true})} style={{background:"#FDEDEC",border:"1px solid #F1948A",borderRadius:12,padding:"18px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:36,cursor:"pointer",transition:"all 0.18s"}} className="card-hover">
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{width:48,height:48,borderRadius:"50%",background:"#C0392B",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>⚠️</div>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:"#922B21",marginBottom:3}}>{overdueCount} {overdueCount===1?"beneficiary":"beneficiaries"} overdue for a follow-up</div>
            <div style={{fontSize:12,color:"#C0392B"}}>No contact recorded in the last 3 months or more</div>
          </div>
        </div>
        <div style={{padding:"8px 18px",borderRadius:8,background:"#C0392B",color:"#fff",fontSize:12,fontWeight:700,flexShrink:0}}>View overdue list →</div>
      </div></>)}
      <SH>Beneficiaries by Programme Component</SH>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16}}>
        {COMPONENTS.map(c=>{
          const inComp=vis.filter(b=>b.component_id===c.id);
          const count=inComp.length;
          const males=inComp.filter(b=>b.gender==="Male").length;
          const females=inComp.filter(b=>b.gender==="Female").length;
          const malePct=count>0?Math.round((males/count)*100):0;
          return(
          <div key={c.id} className="card-hover" onClick={()=>handleStatClick({comp:c.id})} style={{background:c.color,borderRadius:16,padding:"32px 20px 20px",textAlign:"center",cursor:"pointer",transition:"all 0.22s",boxShadow:"0 6px 20px rgba(0,0,0,0.18)"}}>
            <div style={{width:60,height:60,borderRadius:"50%",background:"rgba(255,255,255,0.20)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontSize:28}}>{c.icon}</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.92)",fontWeight:700,marginBottom:16,lineHeight:1.4}}>{c.name}</div>
            <div style={{fontSize:56,fontWeight:800,color:"#fff",lineHeight:1,fontFamily:"'Playfair Display',serif"}}>{count}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.78)",marginTop:8,textTransform:"uppercase",letterSpacing:1.2,fontWeight:600,marginBottom:14}}>Total Beneficiaries</div>
            {count>0&&(<>
              <div style={{height:"0.5px",background:"rgba(255,255,255,0.25)",marginBottom:12}}/>
              <div style={{height:5,borderRadius:3,background:"rgba(255,255,255,0.25)",overflow:"hidden",marginBottom:8}}>
                <div style={{height:"100%",borderRadius:3,background:"rgba(255,255,255,0.85)",width:`${malePct}%`,transition:"width 0.3s"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:"rgba(255,255,255,0.88)",fontWeight:700}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:"rgba(255,255,255,0.9)"}}/>
                  {males} Male
                </div>
                <div style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:"rgba(255,255,255,0.70)",fontWeight:700}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:"rgba(255,255,255,0.45)"}}/>
                  {females} Female
                </div>
              </div>
            </>)}
          </div>);})}
      </div>
    </div>
  </div>);
}

function BenList({bens,user,users,onView,onEdit,onSIR,initialFilter={},onToggle,onNavigateToBen}){
  const isGender=initialFilter.stat==="Male"||initialFilter.stat==="Female";
  const [search,setSearch]=useState("");
  const [compF,setCompF]=useState("all");
  const [statF,setStatF]=useState("all");
  const [gendF,setGendF]=useState("all");
  const [commF,setCommF]=useState("all");  const [overdueF,setOverdueF]=useState(false);
  const [yearF,setYearF]=useState("all");
  const [quarterF,setQuarterF]=useState("all");
  const [sort,setSort]=useState("name-asc");
  const [officerF,setOfficerF]=useState(initialFilter.officer||"all");

  // Officers under this coordinator (for the filter label)
  const myOfficerIds=user.role==="Programme Coordinator"
    ?users.filter(u=>u.role==="Programme Officer"&&u.coordinator_id===user.id&&u.status!=="Inactive").map(u=>u.id)
    :null;

  useEffect(()=>{
    setCompF(initialFilter.comp?String(initialFilter.comp):"all");
    setStatF(!isGender&&initialFilter.stat&&initialFilter.stat!=="all"?initialFilter.stat:"all");
    setGendF(isGender?initialFilter.stat:"all");
    setOverdueF(initialFilter.overdue===true);
    setOfficerF(initialFilter.officer||"all");
    setSearch("");
  },[initialFilter.comp,initialFilter.stat,initialFilter.overdue,initialFilter.officer]);

  const regions=[...new Set(bens.map(b=>b.region).filter(Boolean))].sort();
  const enrollYears=[...new Set(bens.map(b=>b.enroll_date?b.enroll_date.slice(0,4):null).filter(Boolean))].sort();
  function getQuarter(dateStr){if(!dateStr)return null;const m=new Date(dateStr).getMonth()+1;if(m<=3)return"Q1";if(m<=6)return"Q2";if(m<=9)return"Q3";return"Q4";}

  // Base visibility: coordinators see only their officers' beneficiaries
  const baseBens=user.role==="Admin"||user.role==="Management"
    ?bens
    :user.role==="Programme Coordinator"
      ?bens.filter(b=>myOfficerIds.includes(b.assigned_to))
      :bens.filter(b=>b.assigned_to===user.id);

  // Viewing officer label for breadcrumb
  const viewingOfficer=officerF!=="all"?users.find(u=>u.id===officerF):null;

  const vis=baseBens
    .filter(b=>(!search||b.name?.toLowerCase().includes(search.toLowerCase())||b.bid?.includes(search))&&(compF==="all"||b.component_id===Number(compF))&&(commF==="all"||b.region===commF)&&(statF==="all"||b.status===statF)&&(gendF==="all"||b.gender===gendF)&&(!overdueF||(!b.last_follow_up||(new Date()-new Date(b.last_follow_up))>90*24*60*60*1000))&&(yearF==="all"||b.enroll_date?.slice(0,4)===yearF)&&(quarterF==="all"||getQuarter(b.enroll_date)===quarterF)&&(officerF==="all"||b.assigned_to===officerF))
    .sort((a,b2)=>{if(sort==="name-asc")return(a.name||"").localeCompare(b2.name||"");if(sort==="name-desc")return(b2.name||"").localeCompare(a.name||"");if(sort==="updated-desc")return(b2.last_follow_up||"").localeCompare(a.last_follow_up||"");return 0;});
  const comp=id=>COMPONENTS.find(c=>c.id===id);
  const officer=id=>users.find(u=>u.id===id)?.name||"Unassigned";
  const enrollTag=yearF!=="all"||quarterF!=="all"?[yearF!=="all"?yearF:null,quarterF!=="all"?quarterF:null].filter(Boolean).join(" · "):null;

  function exportToExcel(){
    const rows=vis.map(b=>({
      "Beneficiary ID":b.bid||"",
      "Full Name":b.name||"",
      "Age":b.age||"",
      "Gender":b.gender||"",
      "Community":b.community||"",
      "District":b.district||"",
      "Region":b.region||"",
      "Programme Component":COMPONENTS.find(c=>c.id===b.component_id)?.name||"",
      "Enrolment Date":b.enroll_date||"",
      "Status":b.status||"",
      "Assigned Officer":users.find(u=>u.id===b.assigned_to)?.name||"",
      "Last Follow-Up":b.last_follow_up||"Not yet",
      "Education":b.education||"",
      "Employment":b.employment||"",
      "Disability":b.disability||"",
    }));
    const ws=XLSX.utils.json_to_sheet(rows);
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,"Beneficiaries");
    const date=new Date().toISOString().slice(0,10);
    XLSX.writeFile(wb,`LYSBF_CYEP_Beneficiaries_${date}.xlsx`);
  }

  return(<div className="fade-in"><Topbar user={user} onNavigateToBen={onNavigateToBen} onToggle={onToggle} title="Beneficiaries" sub={viewingOfficer?`Viewing ${viewingOfficer.name}'s cases`:"View and manage all beneficiary profiles"}/>
    <div style={{padding:"24px 32px"}}>
      {viewingOfficer&&<div style={{background:"#EBF5FB",border:"1px solid #AED6F1",borderRadius:10,padding:"10px 16px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontSize:13,color:"#1A5276"}}>👁️ Viewing cases for <strong>{viewingOfficer.name}</strong></div>
        <button onClick={()=>setOfficerF("all")} style={{background:"none",border:"none",color:"#1A5276",cursor:"pointer",fontSize:12,fontWeight:700,textDecoration:"underline"}}>← Back to all my officers' cases</button>
      </div>}
      <div style={{background:"#fff",borderRadius:12,padding:"16px 20px",marginBottom:20,boxShadow:"0 1px 4px rgba(0,0,0,0.06)",border:`1px solid ${T.greyM}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:10}}>
          <div style={{fontSize:13,color:T.grey}}>{vis.length} {vis.length===1?"record":"records"} {(overdueF||enrollTag)?"(filtered)":""}</div>
          <button onClick={exportToExcel} style={{display:"flex",alignItems:"center",gap:7,padding:"8px 16px",borderRadius:8,background:"#1D6F42",color:"#fff",border:"none",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Source Sans 3',sans-serif"}}>📊 Export to Excel</button>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:10,alignItems:"flex-end"}}>
          <div style={{flex:"1 1 180px"}}><Lbl c="Search"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name or ID..." style={{width:"100%",border:`1px solid ${T.greyM}`,borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",color:T.navy}}/></div>
          <div style={{flex:"1 1 150px"}}><Lbl c="Component"/><select value={compF} onChange={e=>setCompF(e.target.value)} style={{width:"100%",border:`1px solid ${T.greyM}`,borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",color:T.navy}}><option value="all">All Components</option>{COMPONENTS.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></div>
          <div style={{flex:"1 1 130px"}}><Lbl c="Region"/><select value={commF} onChange={e=>setCommF(e.target.value)} style={{width:"100%",border:`1px solid ${T.greyM}`,borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",color:T.navy}}><option value="all">All Regions</option>{regions.map(r=><option key={r}>{r}</option>)}</select></div>
          <div style={{flex:"1 1 110px"}}><Lbl c="Status"/><select value={statF} onChange={e=>setStatF(e.target.value)} style={{width:"100%",border:`1px solid ${T.greyM}`,borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",color:T.navy}}><option value="all">All</option><option>Active</option><option>Completed</option><option>On Hold</option></select></div>
          <div style={{width:1,height:36,background:T.greyM,alignSelf:"flex-end",marginBottom:1}}/>
          <div style={{flex:"1 1 110px"}}><Lbl c="Enrol Year"/><select value={yearF} onChange={e=>setYearF(e.target.value)} style={{width:"100%",border:`1px solid ${T.greyM}`,borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",color:T.navy}}><option value="all">All Years</option>{enrollYears.map(y=><option key={y} value={y}>{y}</option>)}</select></div>
          <div style={{flex:"1 1 130px"}}><Lbl c="Quarter"/><select value={quarterF} onChange={e=>setQuarterF(e.target.value)} style={{width:"100%",border:`1px solid ${T.greyM}`,borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",color:T.navy}}><option value="all">All Quarters</option><option value="Q1">Q1 (Jan – Mar)</option><option value="Q2">Q2 (Apr – Jun)</option><option value="Q3">Q3 (Jul – Sep)</option><option value="Q4">Q4 (Oct – Dec)</option></select></div>
          <div style={{flex:"1 1 140px"}}><Lbl c="Sort By"/><select value={sort} onChange={e=>setSort(e.target.value)} style={{width:"100%",border:`1px solid ${T.greyM}`,borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",color:T.navy}}><option value="name-asc">Name A→Z</option><option value="name-desc">Name Z→A</option><option value="updated-desc">Last Updated ↓</option></select></div>
          <Btn variant="secondary" onClick={()=>{setSearch("");setCompF("all");setCommF("all");setStatF("all");setGendF("all");setOverdueF(false);setYearF("all");setQuarterF("all");setSort("name-asc");}}>Clear</Btn>
        </div>
        <div style={{marginTop:10,display:"flex",flexWrap:"wrap",alignItems:"center",gap:8}}>
          {overdueF&&<div style={{background:"#FDEDEC",borderRadius:6,padding:"6px 12px",fontSize:12,color:"#922B21",fontWeight:700,display:"inline-block"}}>⚠️ Showing overdue beneficiaries only — <span style={{cursor:"pointer",textDecoration:"underline"}} onClick={()=>setOverdueF(false)}>clear filter</span></div>}
          {enrollTag&&<span style={{background:"#EBF5FB",color:"#1A5276",padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:700}}>📅 Enrolled: {enrollTag}</span>}
          <div style={{fontSize:12,color:T.grey}}>Showing <strong>{vis.length}</strong> records</div>
        </div>
      </div>
      <div style={{background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",border:`1px solid ${T.greyM}`}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{background:T.off,borderBottom:`2px solid ${T.greyM}`}}>{["Beneficiary","Component","Community","Assigned Officer","Follow-Ups","Last Follow-Up","Status","Actions"].map(h=><th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:11,fontWeight:700,color:T.slate,textTransform:"uppercase",letterSpacing:0.8}}>{h}</th>)}</tr></thead>
          <tbody>
            {vis.map((b,i)=>{const c=comp(b.component_id);const fuCount=(b.posts||[]).length;const fuBg=fuCount===0?"#FDEDEC":fuCount<=3?"#FEF9E7":"#EAFAF1";const fuColor=fuCount===0?"#922B21":fuCount<=3?"#7D6608":"#1D8348";return(<tr key={b.id} className="row-hover" style={{background:i%2===0?"#fff":T.off,borderBottom:`1px solid ${T.greyL}`,transition:"background 0.15s"}}>
              <td style={{padding:"13px 16px"}}><div style={{display:"flex",alignItems:"center",gap:10}}><BenAvatar ben={b} size={38} fontSize={13}/><div><div style={{fontWeight:700,fontSize:13,color:T.navy}}>{b.name}</div><div style={{fontSize:11,color:T.grey}}>Age {b.age} · {b.gender} · {b.bid}</div></div></div></td>
              <td style={{padding:"13px 16px"}}>{c&&<span style={{background:c.light,color:c.color,padding:"4px 10px",borderRadius:20,fontSize:11,fontWeight:700,display:"inline-flex",alignItems:"center",gap:4}}><span>{c.icon}</span><span>{c.name.split(" ")[0]}</span></span>}</td>
              <td style={{padding:"13px 16px",fontSize:12,color:T.navy}}>{b.community}</td>
              <td style={{padding:"13px 16px",fontSize:12,color:T.navy}}>{officer(b.assigned_to)}</td>
              <td style={{padding:"13px 16px"}}><span style={{background:fuBg,color:fuColor,padding:"4px 10px",borderRadius:20,fontSize:11,fontWeight:700,display:"inline-block"}}>💬 {fuCount} {fuCount===1?"visit":"visits"}</span></td>
              {(()=>{const overdue=!b.last_follow_up||(new Date()-new Date(b.last_follow_up))>90*24*60*60*1000;return(<td style={{padding:"13px 16px"}}><span style={{fontSize:12,fontWeight:600,color:overdue?"#fff":T.navy,background:overdue?"#C0392B":"transparent",padding:overdue?"3px 10px":"0",borderRadius:overdue?20:0,display:"inline-block"}}>{b.last_follow_up||"Not yet"}</span></td>);})()}
              <td style={{padding:"13px 16px"}}><Pill s={b.status}/></td>
              <td style={{padding:"13px 16px"}}><div style={{display:"flex",gap:5}}>
                <button className="action-btn" onClick={()=>onView(b)} style={{padding:"5px 11px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:"#EBF5FB",color:"#1A5276"}}>👁 View</button>
                {(user.role==="Admin"||user.role==="Programme Coordinator"||b.assigned_to===user.id)&&user.role!=="Management"&&<button className="action-btn" onClick={()=>onEdit(b)} style={{padding:"5px 11px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:"#EAFAF1",color:"#1D8348"}}>✏️ Edit</button>}
                <button className="action-btn" onClick={()=>onSIR(b)} style={{padding:"5px 11px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:"#FEF9E7",color:"#9A7D0A"}}>📋 SIR</button>
              </div></td>
            </tr>);})}
            {vis.length===0&&<tr><td colSpan={8} style={{padding:44,textAlign:"center",color:T.grey,fontSize:14}}>No beneficiaries found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  </div>);
}

function BenMgmt({bens,setBens,user,onToggle,onNavigateToBen}){
  const [confirmBen,setConfirmBen]=useState(null);
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState("");

  async function removeBen(ben){
    setBusy(true);setMsg("");
    try{
      const postIds=(ben.posts||[]).map(p=>p.id);
      if(postIds.length>0){
        await supabase.from("comments").delete().in("post_id",postIds);
        await supabase.from("posts").delete().eq("beneficiary_id",ben.id);
      }
      if(ben.photo_url){
        const parts=ben.photo_url.split("/beneficiary-photos/");
        if(parts.length>1){
          const filePath=parts[1].split("?")[0];
          await supabase.storage.from("beneficiary-photos").remove([filePath]);
        }
      }
      const{error}=await supabase.from("beneficiaries").delete().eq("id",ben.id);
      if(error){setMsg("❌ Error removing beneficiary: "+error.message);setBusy(false);return;}
      setBens(bs=>bs.filter(b=>b.id!==ben.id));
      setMsg("✅ "+ben.name+" has been permanently removed.");
    }catch(e){setMsg("❌ Unexpected error. Please try again.");}
    setBusy(false);
    setConfirmBen(null);
  }

  const sorted=[...bens].sort((a,b)=>(a.name||"").localeCompare(b.name||""));

  return(<div className="fade-in"><Topbar user={user} onNavigateToBen={onNavigateToBen} onToggle={onToggle} title="Beneficiary Management" sub="Admin only — permanently remove beneficiary records"/>
    <div style={{padding:"24px 32px"}}>
      {msg&&<div style={{background:msg.includes("✅")?"#EAFAF1":"#FDEDEC",color:msg.includes("✅")?"#1D8348":"#C0392B",borderRadius:8,padding:"10px 16px",marginBottom:16,fontSize:13}}>{msg}</div>}
      <div style={{fontSize:13,color:T.grey,marginBottom:14}}>{bens.length} {bens.length===1?"beneficiary":"beneficiaries"} on record</div>

      {confirmBen&&(
        <div style={{background:"rgba(0,0,0,0.45)",borderRadius:12,padding:"32px 20px",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20}}>
          <div style={{background:"#fff",borderRadius:14,padding:"28px 32px",maxWidth:460,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:T.navy,marginBottom:10}}>Remove beneficiary?</div>
            <div style={{fontSize:13,color:T.grey,lineHeight:1.65,marginBottom:14}}>You are about to permanently remove <strong style={{color:T.navy}}>{confirmBen.name}</strong> from the system.</div>
            <div style={{background:"#FDEDEC",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#922B21",marginBottom:20,lineHeight:1.6}}>⚠️ This will also delete all their follow-up notes, comments, and profile photo. This cannot be undone.</div>
            <div style={{display:"flex",gap:10}}>
              <Btn variant="danger" onClick={()=>removeBen(confirmBen)} style={{opacity:busy?0.6:1}}>{busy?"Removing...":"Yes, remove permanently"}</Btn>
              <Btn variant="secondary" onClick={()=>setConfirmBen(null)}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}

      <div style={{background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",border:`1px solid ${T.greyM}`}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{background:T.off,borderBottom:`2px solid ${T.greyM}`}}>
            {["Beneficiary","Actions"].map(h=><th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:11,fontWeight:700,color:T.slate,textTransform:"uppercase",letterSpacing:0.8}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {sorted.map((b,i)=>(<tr key={b.id} style={{background:i%2===0?"#fff":T.off,borderBottom:`1px solid ${T.greyL}`}}>
              <td style={{padding:"13px 16px"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <BenAvatar ben={b} size={34} fontSize={12}/>
                  <span style={{fontWeight:700,fontSize:13,color:T.navy}}>{b.name}</span>
                </div>
              </td>
              <td style={{padding:"13px 16px"}}>
                <button onClick={()=>{setConfirmBen(b);setMsg("");}} style={{padding:"5px 13px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:"#FDEDEC",color:"#C0392B",fontFamily:"'Source Sans 3',sans-serif"}}>🗑 Remove</button>
              </td>
            </tr>))}
            {sorted.length===0&&<tr><td colSpan={2} style={{padding:44,textAlign:"center",color:T.grey,fontSize:14}}>No beneficiaries on record.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  </div>);
}

function FollowUpsTab({ben,user,users,onAddPost}){
  const [comments,setComments]=useState({});
  const [newComment,setNewComment]=useState({});
  const [loading,setLoading]=useState({});
  useEffect(()=>{
    if(!ben.posts||ben.posts.length===0)return;
    ben.posts.forEach(async p=>{
      const{data}=await supabase.from("comments").select("*").eq("post_id",p.id).order("created_at");
      if(data)setComments(c=>({...c,[p.id]:data}));
    });
  },[ben.posts]);

  // Reliably find coordinator: first from officer's coordinator_id, fallback to ben.coordinator_id
  function getCoordinatorId(){
    if(ben.assigned_to&&users){
      const officer=users.find(u=>u.id===ben.assigned_to);
      if(officer?.coordinator_id)return officer.coordinator_id;
    }
    return ben.coordinator_id||null;
  }

  async function submitComment(postId){
    const text=newComment[postId];if(!text||!text.trim())return;
    setLoading(l=>({...l,[postId]:true}));
    const{data}=await supabase.from("comments").insert([{post_id:postId,author:user.name,author_role:user.role,text,created_at:new Date().toISOString()}]).select().single();
    if(data){
      setComments(c=>({...c,[postId]:[...(c[postId]||[]),data]}));
      setNewComment(n=>({...n,[postId]:""}));
      const preview=`"${text.slice(0,60)}${text.length>60?"...":""}"`;
      const coordId=getCoordinatorId();
      if(user.role==="Programme Coordinator"||user.role==="Admin"){
        // Coordinator/Admin commented — notify the assigned officer
        if(ben.assigned_to&&ben.assigned_to!==user.id){
          await createNotification(
            ben.assigned_to,"comment",
            `Comment on ${ben.name}'s case`,
            `${user.name} (${user.role}) commented: ${preview}`,
            ben.id,postId
          );
        }
      } else if(user.role==="Programme Officer"){
        // Officer replied — notify their coordinator
        if(coordId&&coordId!==user.id){
          await createNotification(
            coordId,"comment",
            `Officer reply on ${ben.name}'s case`,
            `${user.name} replied: ${preview}`,
            ben.id,postId
          );
        }
      }
    }
    setLoading(l=>({...l,[postId]:false}));
  }
  return(<div>
    {(user.role==="Admin"||user.role==="Programme Coordinator"||ben.assigned_to===user.id)&&user.role!=="Management"&&<Btn variant="primary" onClick={()=>onAddPost(ben)} style={{marginBottom:18}}>+ Add Follow-Up Note</Btn>}
    {(!ben.posts||ben.posts.length===0)&&<div style={{color:T.grey,fontSize:13,textAlign:"center",padding:24}}>No follow-up notes yet.</div>}
    {(ben.posts||[]).slice().reverse().map(p=>(<div key={p.id} style={{background:T.off,borderRadius:12,padding:"16px",marginBottom:16,border:`1px solid ${T.greyM}`}}>
      <div style={{display:"flex",gap:10,marginBottom:12}}>
        <div style={{width:36,height:36,borderRadius:"50%",background:aColor(p.author),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,color:"#fff",flexShrink:0}}>{inits(p.author)}</div>
        <div style={{flex:1}}><div style={{fontSize:12,color:T.grey,marginBottom:4}}>✍️ {p.author} · 📅 {p.visit_date||p.date}{p.visit_type&&<span style={{marginLeft:8,background:"#EBF5FB",color:"#1A5276",padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:700}}>{VISIT_TYPES.find(v=>v.key===p.visit_type)?.icon||"📝"} {p.visit_type}</span>}</div><div style={{fontSize:13,color:T.navy,lineHeight:1.6,background:"#EBF5FB",borderRadius:"0 10px 10px 10px",padding:"10px 14px"}}>{p.text}</div></div>
      </div>
      {(comments[p.id]||[]).map(c=>(<div key={c.id} style={{display:"flex",gap:10,marginBottom:10,marginLeft:46,flexDirection:c.author_role==="Admin"?"row-reverse":"row"}}>
        <div style={{width:30,height:30,borderRadius:"50%",background:c.author_role==="Admin"?"#1A252F":"#2980B9",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:11,color:"#fff",flexShrink:0}}>{inits(c.author)}</div>
        <div style={{flex:1}}><div style={{fontSize:11,color:T.grey,marginBottom:3,textAlign:c.author_role==="Admin"?"right":"left"}}>{c.author} · {c.author_role}</div><div style={{fontSize:13,color:T.navy,lineHeight:1.5,background:c.author_role==="Admin"?"#EAFAF1":"#fff",borderRadius:c.author_role==="Admin"?"10px 0 10px 10px":"0 10px 10px 10px",padding:"8px 12px",border:`1px solid ${T.greyM}`}}>{c.text}</div></div>
      </div>))}
      {user.role!=="Management"&&<div style={{marginLeft:46,marginTop:10,display:"flex",gap:8}}>
        <input value={newComment[p.id]||""} onChange={e=>setNewComment(n=>({...n,[p.id]:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&submitComment(p.id)} placeholder="Write a comment or reply..." spellCheck="true" style={{flex:1,border:`1px solid ${T.greyM}`,borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",color:T.navy}}/>
        <button onClick={()=>submitComment(p.id)} disabled={loading[p.id]} style={{padding:"8px 16px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,background:"#2980B9",color:"#fff",opacity:loading[p.id]?0.6:1}}>{loading[p.id]?"...":"Send"}</button>
      </div>}
    </div>))}
  </div>);
}

function PhotoUpload({ben,user,onPhotoUpdate}){
  const fileRef=useRef();
  const [uploading,setUploading]=useState(false);
  const [msg,setMsg]=useState("");
  const canEdit=(user.role==="Admin"||user.role==="Programme Coordinator"||ben.assigned_to===user.id)&&user.role!=="Management";
  if(!canEdit)return null;
  async function handleFile(e){
    const file=e.target.files[0];
    if(!file)return;
    if(file.size>2*1024*1024){setMsg("❌ File too large. Please use an image under 2MB.");return;}
    if(!file.type.startsWith("image/")){setMsg("❌ Please select an image file (JPG or PNG).");return;}
    setUploading(true);setMsg("");
    try{
      const ext=file.name.split(".").pop();
      const path=`${ben.id}.${ext}`;
      const{error:upErr}=await supabase.storage.from(PHOTO_BUCKET).upload(storagePath,file,{upsert:true,contentType:file.type});
      if(upErr){setMsg("❌ Upload failed: "+upErr.message);setUploading(false);return;}
      // Store the bare path — signed URLs are generated on load
      const{error:dbErr}=await supabase.from("beneficiaries").update({photo_url:path}).eq("id",ben.id);
      if(dbErr){setMsg("❌ Could not save photo: "+dbErr.message);setUploading(false);return;}
      // Generate a signed URL for immediate display
      const{data:signData}=await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path,SIGNED_URL_TTL);
      const signedUrl=signData?.signedUrl||null;
      setMsg("✅ Photo uploaded successfully!");
      onPhotoUpdate(signedUrl,path);
    }catch(e){setMsg("❌ Unexpected error. Please try again.");}
    setUploading(false);
    e.target.value="";
  }
  async function removePhoto(){
    if(!window.confirm("Remove this beneficiary's profile photo?"))return;
    setUploading(true);setMsg("");
    try{
      if(ben.photo_path){
        await supabase.storage.from(PHOTO_BUCKET).remove([ben.photo_path]);
      }
      const{error:dbErr}=await supabase.from("beneficiaries").update({photo_url:null}).eq("id",ben.id);
      if(dbErr){setMsg("❌ Could not remove photo.");setUploading(false);return;}
      setMsg("✅ Photo removed.");
      onPhotoUpdate(null,null);
    }catch(e){setMsg("❌ Unexpected error. Please try again.");}
    setUploading(false);
  }
  return(<div style={{marginTop:14}}>
    <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.55)",textTransform:"uppercase",letterSpacing:1.5,marginBottom:8,textAlign:"center"}}>Profile Photo</div>
    {msg&&<div style={{fontSize:11,textAlign:"center",marginBottom:8,padding:"6px 10px",borderRadius:6,background:msg.includes("✅")?"rgba(39,174,96,0.25)":"rgba(192,57,43,0.25)",color:"#fff"}}>{msg}</div>}
    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{display:"none"}} onChange={handleFile}/>
    {!ben.photo_url?(
      <div className="upload-zone-hover" onClick={()=>!uploading&&fileRef.current.click()} style={{border:"1.5px dashed rgba(255,255,255,0.45)",borderRadius:10,padding:"12px 10px",textAlign:"center",cursor:uploading?"not-allowed":"pointer",transition:"all 0.2s"}}>
        <div style={{fontSize:22,marginBottom:4}}>📷</div>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.85)",fontWeight:700,marginBottom:2}}>{uploading?"Uploading...":"Upload Photo"}</div>
        <div style={{fontSize:10,color:"rgba(255,255,255,0.55)"}}>JPG or PNG · max 2MB</div>
      </div>
    ):(
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",marginBottom:8}}>Photo uploaded ✓</div>
        <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={()=>!uploading&&fileRef.current.click()} disabled={uploading} style={{padding:"5px 12px",borderRadius:6,border:"1px solid rgba(255,255,255,0.35)",background:"rgba(255,255,255,0.15)",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>🔄 Change</button>
          <button onClick={removePhoto} disabled={uploading} style={{padding:"5px 12px",borderRadius:6,border:"1px solid rgba(192,57,43,0.5)",background:"rgba(192,57,43,0.25)",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>🗑 Remove</button>
        </div>
      </div>
    )}
  </div>);
}

const TABS=[{k:"basic",label:"Basic Info",icon:"👤"},{k:"programme",label:"Programme",icon:"📌"},{k:"health",label:"Health",icon:"🏥"},{k:"education",label:"Education",icon:"📚"},{k:"family",label:"Family",icon:"🏠"},{k:"employment",label:"Employment",icon:"💼"},{k:"disability",label:"Disability",icon:"🫂"},{k:"followups",label:"Follow-Ups",icon:"💬"},{k:"documents",label:"Documents",icon:"📁"}];

function Profile({ben,user,users,onBack,onAddPost,onSIR,onPhotoUpdate,onToggle,onNavigateToBen}){
  const [tab,setTab]=useState("basic");
  const [localBen,setLocalBen]=useState(ben);
  useEffect(()=>{setLocalBen(ben);},[ben]);
  const comp=COMPONENTS.find(c=>c.id===localBen.component_id);
  const officer=users.find(u=>u.id===localBen.assigned_to);
  function handlePhotoUpdate(url,path){
    setLocalBen(b=>({...b,photo_url:url,photo_path:path}));
    onPhotoUpdate(localBen.id,url,path);
  }
  return(<div className="fade-in"><Topbar user={user} onNavigateToBen={onNavigateToBen} onToggle={onToggle} title={localBen.name} sub={`Profile · ${localBen.bid}`}/>
    <div style={{padding:"24px 32px"}}>
      <div className="no-print" style={{display:"flex",gap:10,marginBottom:20}}><Btn variant="secondary" onClick={onBack}>← Back to List</Btn><Btn variant="navy" onClick={()=>onSIR(localBen)}>📝 Generate SIR</Btn></div>
      <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:20}}>
        <div style={{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 2px 10px rgba(0,0,0,0.08)"}}>
          <div style={{background:comp?.color||"#27AE60",padding:"28px 20px",textAlign:"center"}}>
            <div style={{position:"relative",width:80,height:80,margin:"0 auto 12px"}}>
              {localBen.photo_url?(
                <img src={localBen.photo_url} alt={localBen.name} style={{width:80,height:80,borderRadius:"50%",objectFit:"cover",border:"3px solid rgba(255,255,255,0.6)"}}/>
              ):(
                <div style={{width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:28,color:"#fff",border:"3px solid rgba(255,255,255,0.4)"}}>{inits(localBen.name)}</div>
              )}
            </div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:19,fontWeight:700,color:"#fff"}}>{localBen.name}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.85)",marginTop:3}}>{comp?.icon} {comp?.name}</div>
            <div style={{marginTop:10}}><Pill s={localBen.status}/></div>
            <PhotoUpload ben={localBen} user={user} onPhotoUpdate={handlePhotoUpdate}/>
          </div>
          <div style={{padding:"0 20px 20px"}}>{[["Beneficiary ID",localBen.bid],["Age / Gender",`${localBen.age} · ${localBen.gender}`],["Community",localBen.community],["Enrolled",localBen.enroll_date],["Officer",officer?.name||"—"]].map(([l,v])=>(<div key={l} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${T.greyL}`}}><span style={{fontSize:11,fontWeight:700,color:T.grey}}>{l}</span><span style={{fontSize:12,color:T.navy,textAlign:"right"}}>{v||"—"}</span></div>))}</div>
        </div>
        <div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4,background:T.off,borderRadius:10,padding:4,marginBottom:16}}>
            {TABS.map(t=>(<button key={t.k} className="tab-btn" onClick={()=>setTab(t.k)} style={{padding:"8px 13px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontFamily:"'Source Sans 3',sans-serif",display:"flex",alignItems:"center",gap:5,transition:"all 0.18s",background:tab===t.k?"#fff":"transparent",color:tab===t.k?T.navy:T.grey,fontWeight:tab===t.k?700:400,boxShadow:tab===t.k?"0 1px 4px rgba(0,0,0,0.10)":"none"}}><span>{t.icon}</span><span>{t.label}</span></button>))}
          </div>
          <div style={{background:"#fff",borderRadius:12,padding:"24px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
            {tab==="basic"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>{[["Full Name",localBen.name],["Date of Birth",localBen.dob],["Age",localBen.age],["Gender",localBen.gender],["Nationality",localBen.nationality],["Tribe",localBen.tribe],["Religion",localBen.religion],["Community",localBen.community],["Address",localBen.address],["Region",localBen.region],["District",localBen.district],["City",localBen.city]].map(([l,v])=><div key={l}><Lbl c={l}/><FBox v={v}/></div>)}</div>}
            {tab==="programme"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>{[["Beneficiary ID",localBen.bid],["Component",`${comp?.icon} ${comp?.name}`],["Enrolment Date",localBen.enroll_date],["Status",localBen.status]].map(([l,v])=><div key={l}><Lbl c={l}/><FBox v={v}/></div>)}</div>}
            {tab==="health"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>{[["Vulnerability on Arrival",localBen.vuln_on_arrival],["Health Status",localBen.health],["Height",localBen.height],["Weight",localBen.weight],["Ghana Card / NHIS",localBen.ghana_card],["Disability",localBen.disability],["Medical Condition",localBen.med_condition]].map(([l,v])=><div key={l}><Lbl c={l}/><FBox v={v}/></div>)}</div>}
            {tab==="education"&&<div><Lbl c="Educational Level"/><FBox v={localBen.education}/></div>}
            {tab==="family"&&<div><Lbl c="Family Background"/><FBox v={localBen.family}/></div>}
            {tab==="employment"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>{[["Occupation",localBen.occupation],["Employment Status",localBen.employment]].map(([l,v])=><div key={l}><Lbl c={l}/><FBox v={v}/></div>)}</div>}
            {tab==="disability"&&<div><Lbl c="Disability Status"/><FBox v={localBen.disability}/></div>}
            {tab==="followups"&&<FollowUpsTab ben={localBen} user={user} users={users} onAddPost={onAddPost}/>}
            {tab==="documents"&&<DocumentsTab ben={localBen} user={user}/>}
          </div>
        </div>
      </div>
    </div>
  </div>);
}

function DocumentsTab({ben,user}){
  const DOC_BUCKET="beneficiary-documents";
  const MAX_SIZE=5*1024*1024; // 5MB
  const ALLOWED=["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","image/jpeg","image/png"];
  const ALLOWED_EXT=[".pdf",".doc",".docx",".xls",".xlsx",".jpg",".jpeg",".png"];

  const [docs,setDocs]=useState([]);
  const [loading,setLoading]=useState(true);
  const [uploading,setUploading]=useState(false);
  const [title,setTitle]=useState("");
  const [msg,setMsg]=useState("");
  const fileRef=useRef();

  useEffect(()=>{loadDocs();},[ben.id]);

  async function loadDocs(){
    setLoading(true);
    try{
      const{data,error}=await supabase.from("documents").select("*").eq("beneficiary_id",ben.id).order("created_at",{ascending:false});
      if(!error&&data)setDocs(data);
    }catch(e){}
    setLoading(false);
  }

  function fileIcon(name){
    if(!name)return"📄";
    const ext=name.split(".").pop().toLowerCase();
    if(ext==="pdf")return"📕";
    if(["doc","docx"].includes(ext))return"📘";
    if(["xls","xlsx"].includes(ext))return"📗";
    if(["jpg","jpeg","png"].includes(ext))return"🖼️";
    return"📄";
  }

  async function handleUpload(e){
    const file=e.target.files[0];
    if(!file)return;
    if(!title.trim()){setMsg("❌ Please enter a document title first.");fileRef.current.value="";return;}
    if(!ALLOWED.includes(file.type)){setMsg("❌ File type not allowed. Please upload PDF, Word, Excel, JPG or PNG.");fileRef.current.value="";return;}
    if(file.size>MAX_SIZE){setMsg("❌ File is too large. Maximum size is 5MB. Please compress and try again.");fileRef.current.value="";return;}
    setUploading(true);setMsg("");
    try{
      const ext=file.name.split(".").pop();
      const storagePath=`${ben.id}/${Date.now()}_${title.trim().replace(/\s+/g,"_")}.${ext}`;
      const{error:upErr}=await supabase.storage.from(DOC_BUCKET).upload(storagePath,file,{contentType:file.type});
      if(upErr){setMsg("❌ Upload failed: "+upErr.message);setUploading(false);return;}
      const{data:inserted,error:dbErr}=await supabase.from("documents").insert([{
        beneficiary_id:ben.id,
        file_name:title.trim(),
        file_path:storagePath,
        created_at:new Date().toISOString(),
        uploaded_by:user.id,
        uploaded_by_name:user.name,
        file_name:file.name,
        file_type:file.type,
        file_size:file.size,
      }]).select().single();
      if(dbErr){setMsg("❌ Database error: "+dbErr.message);setUploading(false);return;}
      setDocs(d=>[inserted,...d]);
      setTitle("");
      fileRef.current.value="";
      setMsg("✅ Document uploaded successfully.");
      setTimeout(()=>setMsg(""),4000);
    }catch(e){setMsg("❌ Unexpected error. Please try again.");}
    setUploading(false);
  }

  async function handleDownload(doc){
    try{
      const{data,error}=await supabase.storage.from(DOC_BUCKET).createSignedUrl(doc.file_path,60*60);
      if(error||!data?.signedUrl){setMsg("❌ Could not generate download link.");return;}
      const a=document.createElement("a");
      a.href=data.signedUrl;
      a.download=doc.file_name||'document';
      document.body.appendChild(a);a.click();document.body.removeChild(a);
    }catch(e){setMsg("❌ Download failed. Please try again.");}
  }

  async function handleDelete(doc){
    if(!window.confirm(`Delete "${doc.name}"? This cannot be undone.`))return;
    try{
      await supabase.storage.from(DOC_BUCKET).remove([doc.file_path]);
      await supabase.from("documents").delete().eq("id",doc.id);
      setDocs(d=>d.filter(x=>x.id!==doc.id));
      setMsg("✅ Document deleted.");
      setTimeout(()=>setMsg(""),3000);
    }catch(e){setMsg("❌ Delete failed.");}
  }

  function formatSize(bytes){
    if(!bytes)return"";
    if(bytes<1024)return bytes+"B";
    if(bytes<1024*1024)return(bytes/1024).toFixed(1)+"KB";
    return(bytes/(1024*1024)).toFixed(1)+"MB";
  }

  function formatDate(str){
    if(!str)return"";
    return new Date(str).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});
  }

  const canDelete=(doc)=>user.role==="Admin"||user.role==="Programme Coordinator"||(doc.uploaded_by&&doc.uploaded_by===user.id);

  return(<div>
    {/* Upload area — hidden for Management */}
    {user.role!=="Management"&&<div style={{background:T.off,borderRadius:10,padding:"18px 20px",marginBottom:20,border:`1px dashed ${T.greyM}`}}>
      <div style={{fontWeight:700,fontSize:13,color:T.navy,marginBottom:12}}>📎 Upload New Document</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:10,marginBottom:10}}>
        <input
          value={title}
          onChange={e=>setTitle(e.target.value)}
          placeholder="Document title e.g. Notification Form, Medical Bill, Consent Form..."
          spellCheck="true"
          style={{border:`1px solid ${T.greyM}`,borderRadius:8,padding:"9px 13px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",color:T.navy,outline:"none"}}
        />
        <button
          onClick={()=>title.trim()?fileRef.current.click():setMsg("❌ Please enter a document title first.")}
          disabled={uploading}
          style={{padding:"9px 18px",borderRadius:8,border:"none",cursor:uploading?"not-allowed":"pointer",fontSize:13,fontWeight:700,background:"#27AE60",color:"#fff",opacity:uploading?0.6:1,whiteSpace:"nowrap"}}
        >{uploading?"Uploading...":"+ Choose File"}</button>
      </div>
      <div style={{fontSize:11,color:T.grey}}>Allowed: PDF, Word, Excel, JPG, PNG · Maximum: 5MB per file</div>
      <input ref={fileRef} type="file" accept={ALLOWED_EXT.join(",")} onChange={handleUpload} style={{display:"none"}}/>
    </div>}

    {msg&&<div style={{background:msg.includes("✅")?"#EAFAF1":"#FDEDEC",color:msg.includes("✅")?"#1D8348":"#C0392B",borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:12,fontWeight:600}}>{msg}</div>}

    {/* Document list */}
    {loading&&<div style={{textAlign:"center",padding:"24px 0",color:T.grey,fontSize:13}}>Loading documents...</div>}
    {!loading&&docs.length===0&&<div style={{textAlign:"center",padding:"36px 0"}}>
      <div style={{fontSize:44,marginBottom:10}}>📁</div>
      <div style={{color:T.grey,fontSize:13}}>No documents uploaded yet.</div>
    </div>}
    {!loading&&docs.length>0&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
      {docs.map(doc=>(<div key={doc.id} style={{display:"flex",alignItems:"center",gap:12,background:T.off,borderRadius:10,padding:"12px 14px",border:`1px solid ${T.greyL}`}}>
        <div style={{fontSize:28,flexShrink:0}}>{fileIcon(doc.file_path)}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:700,fontSize:13,color:T.navy,marginBottom:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{doc.name}</div>
          <div style={{fontSize:11,color:T.grey}}>
            {doc.file_size&&<span style={{marginRight:8}}>· {formatSize(doc.file_size)}</span>}
            {doc.uploaded_by_name&&<span style={{marginRight:8}}>· {doc.uploaded_by_name}</span>}
            {doc.created_at&&<span>· {formatDate(doc.created_at)}</span>}
          </div>
        </div>
        <div style={{display:"flex",gap:6,flexShrink:0}}>
          <button onClick={()=>handleDownload(doc)} style={{padding:"6px 14px",borderRadius:7,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:"#EBF5FB",color:"#1A5276"}}>⬇ Download</button>
          {canDelete(doc)&&<button onClick={()=>handleDelete(doc)} style={{padding:"6px 12px",borderRadius:7,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:"#FDEDEC",color:"#C0392B"}}>🗑</button>}
        </div>
      </div>))}
    </div>}
  </div>);
}

function SIRView({ben,user,users,onBack,onToggle,onNavigateToBen}){
  if(!ben)return(<div className="fade-in"><Topbar user={user} onNavigateToBen={onNavigateToBen} onToggle={onToggle} title="Social Inquiry Reports" sub="Formal case assessment reports"/><div style={{padding:"32px",textAlign:"center",color:T.grey}}><div style={{fontSize:48,marginBottom:12}}>📝</div><div style={{fontSize:16,fontWeight:700,color:T.navy}}>Select a beneficiary and click Generate SIR.</div></div></div>);
  const comp=COMPONENTS.find(c=>c.id===ben.component_id);
  const officer=users.find(u=>u.id===ben.assigned_to);
  return(<div className="fade-in"><Topbar user={user} onNavigateToBen={onNavigateToBen} onToggle={onToggle} title="Social Inquiry Report" sub={`${ben.name} · ${ben.bid}`}/>
    <div style={{padding:"24px 32px"}}>
      <div className="no-print" style={{display:"flex",gap:10,marginBottom:20}}><Btn variant="secondary" onClick={onBack}>← Back</Btn><Btn variant="navy" onClick={()=>window.print()}>🖨 Print as PDF</Btn></div>
      <div style={{background:"#fff",borderRadius:12,padding:"36px 40px",boxShadow:"0 2px 12px rgba(0,0,0,0.08)",maxWidth:800,margin:"0 auto"}}>
        <div style={{textAlign:"center",borderBottom:`2px solid ${T.navy}`,paddingBottom:20,marginBottom:24}}>
          {ben.photo_url&&<img src={ben.photo_url} alt={ben.name} style={{width:80,height:80,borderRadius:"50%",objectFit:"cover",border:`3px solid ${T.navy}`,marginBottom:12,display:"block",margin:"0 auto 12px"}}/>}
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:T.navy}}>LAWYER YAW SARPONG BOATENG FOUNDATION</div>
          <div style={{fontSize:13,color:T.slate,marginTop:4}}>Community Youth Empowerment Programme (CYEP)</div>
          <div style={{fontSize:16,fontWeight:700,color:"#27AE60",marginTop:10,textTransform:"uppercase",letterSpacing:2}}>Social Inquiry Report</div>
          <div style={{fontSize:12,color:T.grey,marginTop:4}}>Confidential Document — For Official Use Only</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:24,padding:"12px 16px",background:T.off,borderRadius:8}}>
          {[["Report Date",today()],["Beneficiary ID",ben.bid],["Component",`${comp?.icon} ${comp?.name}`],["Officer",officer?.name||"—"],["Status",ben.status],["Enrolled",ben.enroll_date]].map(([l,v])=>(<div key={l} style={{fontSize:12}}><span style={{color:T.grey,fontWeight:700}}>{l}: </span><span style={{color:T.navy}}>{v}</span></div>))}
        </div>
        {[{title:"1. Basic Demographic Information",fields:[["Full Name",ben.name],["Date of Birth",ben.dob],["Age",ben.age],["Gender",ben.gender],["Nationality",ben.nationality],["Tribe / Ethnicity",ben.tribe],["Religion",ben.religion],["Region",ben.region],["District",ben.district],["City / Village",ben.city],["Area / Suburb",ben.area],["Physical Location",ben.physical_desc]]},
          {title:"2. Family Background",single:ben.family},{title:"3. Background Information",single:ben.background},
          {title:"4. Education & Employment",fields:[["Education Level",ben.education],["Occupation",ben.occupation],["Employment Status",ben.employment]]},
          {title:"5. Health Information",fields:[["Vulnerability on Arrival",ben.vuln_on_arrival],["Health Status",ben.health],["Height",ben.height],["Weight",ben.weight],["Ghana Card / NHIS",ben.ghana_card],["Disability",ben.disability],["Medical Condition",ben.med_condition]]}
        ].map(sec=>(<div key={sec.title} style={{marginBottom:24}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:T.navy,borderLeft:"4px solid #27AE60",paddingLeft:12,marginBottom:14}}>{sec.title}</div>
          {sec.single&&<div style={{fontSize:13,color:T.navy,lineHeight:1.7,padding:"12px 16px",background:T.off,borderRadius:8}}>{sec.single||"—"}</div>}
          {sec.fields&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{sec.fields.map(([l,v])=>(<div key={l}><div style={{fontSize:10,fontWeight:700,color:T.grey,textTransform:"uppercase",letterSpacing:0.6,marginBottom:3}}>{l}</div><div style={{fontSize:13,color:T.navy,borderBottom:`1px solid ${T.greyL}`,paddingBottom:4}}>{v||"—"}</div></div>))}</div>}
        </div>))}
        <div style={{marginBottom:24}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:T.navy,borderLeft:"4px solid #27AE60",paddingLeft:12,marginBottom:14}}>6. Follow-Up Notes</div>
          {(!ben.posts||ben.posts.length===0)?<div style={{color:T.grey,fontSize:13}}>No follow-up notes recorded.</div>:(ben.posts||[]).map((p,i)=>(<div key={i} style={{marginBottom:12,padding:"10px 14px",background:T.off,borderRadius:8,borderLeft:"3px solid #27AE60"}}><div style={{fontSize:11,color:T.grey,marginBottom:4}}>Date: {p.visit_date||p.date} | Officer: {p.author}{p.visit_type&&<span style={{marginLeft:8,fontWeight:700}}>[{p.visit_type}]</span>}</div><div style={{fontSize:13,color:T.navy,lineHeight:1.6}}>{p.text}</div></div>))}
        </div>
        <div style={{marginTop:32,paddingTop:20,borderTop:`1px solid ${T.greyM}`,display:"grid",gridTemplateColumns:"1fr 1fr",gap:40}}>
          {["Prepared by (Programme Officer)","Verified by (Coordinator)"].map(l=>(<div key={l}><div style={{fontSize:11,color:T.grey,marginBottom:24}}>{l}</div><div style={{borderTop:`1px solid ${T.navy}`,paddingTop:6,fontSize:11,color:T.grey}}>Signature & Date</div></div>))}
        </div>
        <div style={{textAlign:"center",marginTop:20,fontSize:10,color:T.grey}}>LYSBF CYEP · Confidential · {today()}</div>
      </div>
    </div>
  </div>);
}

const GHANA_REGIONS=["Ahafo","Ashanti","Bono","Bono East","Central","Eastern","Greater Accra","North East","Northern","Oti","Savannah","Upper East","Upper West","Volta","Western","Western North"];

function AutoInput({label,value,onChange,suggestions,placeholder,full}){
  const [show,setShow]=useState(false);
  const [filtered,setFiltered]=useState([]);
  const ref=useRef();
  function handleChange(v){
    onChange(v);
    if(v.trim().length>0){
      const f=suggestions.filter(s=>s.toLowerCase().includes(v.toLowerCase())&&s.toLowerCase()!==v.toLowerCase());
      setFiltered(f.slice(0,6));
      setShow(f.length>0);
    }else{setShow(false);}
  }
  function pick(v){onChange(v);setShow(false);}
  useEffect(()=>{function handleClick(e){if(ref.current&&!ref.current.contains(e.target))setShow(false);}document.addEventListener("mousedown",handleClick);return()=>document.removeEventListener("mousedown",handleClick);},[]);
  return(<div ref={ref} style={{display:"flex",flexDirection:"column",gap:5,position:"relative",...(full?{gridColumn:"1/-1"}:{})}}>
    <Lbl c={label}/>
    <input value={value||""} onChange={e=>handleChange(e.target.value)} onFocus={()=>{if(value&&value.trim().length>0){const f=suggestions.filter(s=>s.toLowerCase().includes(value.toLowerCase())&&s.toLowerCase()!==value.toLowerCase());if(f.length>0){setFiltered(f.slice(0,6));setShow(true);}}}} placeholder={placeholder||""} style={{border:`1px solid ${T.greyM}`,borderRadius:8,padding:"9px 14px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",background:"#fff",color:T.navy}}/>
    {show&&<div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",border:`1px solid ${T.greyM}`,borderRadius:8,zIndex:200,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",marginTop:2,overflow:"hidden"}}>
      {filtered.map((s,i)=>(<div key={i} onMouseDown={()=>pick(s)} style={{padding:"8px 14px",fontSize:13,color:T.navy,cursor:"pointer",borderBottom:i<filtered.length-1?`1px solid ${T.greyL}`:"none"}} onMouseEnter={e=>e.currentTarget.style.background=T.off} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>{s}</div>))}
    </div>}
  </div>);
}

function BenForm({user,edit,users,onSave,onCancel,onToggle,onNavigateToBen,communitySuggestions,districtSuggestions,citySuggestions}){
  const blank={bid:"",name:"",age:"",gender:"Male",dob:"",nationality:"Ghanaian",tribe:"",religion:"Christian",region:"",district:"",city:"",area:"",physical_desc:"",address:"",community:"",occupation:"",employment:"Unemployed",education:"SHS",component_id:1,status:"Active",disability:"N/A",vuln_on_arrival:"No",height:"",weight:"",ghana_card:"",med_condition:"None",health:"Good",family:"",background:"",assigned_to:user.id,coordinator_id:user.role==="Programme Coordinator"?user.id:null,enroll_date:today()};
  const [f,setF]=useState(edit?{...edit}:blank);const [busy,setBusy]=useState(false);
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  function handleDob(dob){const age=dob?Math.floor((new Date()-new Date(dob))/(365.25*24*60*60*1000)):null;setF(p=>({...p,dob,age:age&&age>0?String(age):p.age}));}
  // Officers available for assignment depending on role
  const myOfficers=user.role==="Programme Coordinator"
    ?users.filter(u=>u.role==="Programme Officer"&&u.coordinator_id===user.id&&u.status!=="Inactive")
    :users.filter(u=>u.role==="Programme Officer"&&u.status!=="Inactive");
  const canAssign=user.role==="Admin"||user.role==="Programme Coordinator";
  return(<div className="fade-in"><Topbar user={user} onNavigateToBen={onNavigateToBen} onToggle={onToggle} title={edit?"Edit Beneficiary":"Register New Beneficiary"} sub="Fill in all required fields"/>
    <div style={{padding:"24px 32px"}}><Btn variant="secondary" onClick={onCancel} style={{marginBottom:20}}>← Cancel</Btn>
      <div style={{background:"#fff",borderRadius:12,padding:"28px 32px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        <SH>Basic Demographics</SH>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:28}}>
          <FI label="Beneficiary ID" value={f.bid} onChange={v=>s("bid",v)} placeholder="e.g. LYSBF-009"/>
          <FI label="Full Name *" value={f.name} onChange={v=>s("name",v)}/>
          <FI label="Date of Birth" value={f.dob} onChange={handleDob} type="date"/>
          <FI label="Age" value={f.age} onChange={v=>s("age",v)} type="number"/>
          <FI label="Gender" value={f.gender} onChange={v=>s("gender",v)} options={["Male","Female"]}/>
          <FI label="Nationality" value={f.nationality} onChange={v=>s("nationality",v)}/>
          <FI label="Tribe / Ethnicity" value={f.tribe} onChange={v=>s("tribe",v)}/>
          <FI label="Religion" value={f.religion} onChange={v=>s("religion",v)} options={["Christian","Muslim","Traditional","Other"]}/>
          <FI label="Region" value={f.region} onChange={v=>s("region",v)} options={["",...GHANA_REGIONS]}/>
          <AutoInput label="District" value={f.district} onChange={v=>s("district",v)} suggestions={districtSuggestions} placeholder="e.g. New Juaben North"/>
          <AutoInput label="City / Village" value={f.city} onChange={v=>s("city",v)} suggestions={citySuggestions} placeholder="e.g. Koforidua"/>
          <AutoInput label="Community" value={f.community} onChange={v=>s("community",v)} suggestions={communitySuggestions} placeholder="e.g. Effiduase"/>
          <FI label="Full Address" value={f.address} onChange={v=>s("address",v)} full/>
        </div>
        <SH>Programme Details</SH>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:28}}>
          <FI label="Programme Component" value={String(f.component_id)} onChange={v=>s("component_id",Number(v))} options={COMPONENTS.map(c=>({value:String(c.id),label:`${c.icon} ${c.name}`}))}/>
          <FI label="Status" value={f.status} onChange={v=>s("status",v)} options={["Active","Completed","On Hold"]}/>
          <FI label="Enrolment Date" value={f.enroll_date} onChange={v=>s("enroll_date",v)} type="date"/>
          {canAssign&&myOfficers.length>0&&<FI label="Assign to Officer" value={String(f.assigned_to)} onChange={v=>s("assigned_to",v)} options={[{value:user.id,label:`Me (${user.role})`},...myOfficers.map(u=>({value:u.id,label:u.name}))]}/>}
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
          <Btn variant="primary" style={{opacity:busy?0.6:1}} onClick={async()=>{if(!f.name.trim())return;setBusy(true);await onSave(f);setBusy(false);}}>{busy?"Saving...":edit?"Save Changes":"Register Beneficiary"}</Btn>
          <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
        </div>
      </div>
    </div>
  </div>);
}

function PostsPage({bens,user,onToggle,onNavigateToBen}){
  const myOfficerIds=user.role==="Programme Coordinator"
    ?bens.flatMap(()=>[]).concat([user.id]) // coordinator sees all bens already
    :null;
  const mine=user.role==="Admin"||user.role==="Programme Coordinator"
    ?bens
    :bens.filter(b=>b.assigned_to===user.id);
  const all=mine.flatMap(b=>(b.posts||[]).map(p=>({...p,benName:b.name,bid:b.bid,comp:b.component_id,photo_url:b.photo_url}))).sort((a,b2)=>(b2.date||"").localeCompare(a.date||""));
  return(<div className="fade-in"><Topbar user={user} onNavigateToBen={onNavigateToBen} onToggle={onToggle} title="Posts" sub="Latest follow-up notes and updates"/>
    <div style={{padding:"24px 32px"}}>
      {all.length===0&&<div style={{textAlign:"center",color:T.grey,padding:44,fontSize:14}}>No posts yet.</div>}
      {all.map((p,i)=>{const c=COMPONENTS.find(x=>x.id===p.comp);return(<div key={i} style={{background:"#fff",borderRadius:12,padding:"18px 20px",marginBottom:14,borderLeft:`4px solid ${c?.color||"#27AE60"}`,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><div style={{display:"flex",alignItems:"center",gap:10}}><BenAvatar ben={{name:p.benName,photo_url:p.photo_url}} size={32} fontSize={11}/><div style={{fontWeight:700,color:T.navy,fontSize:14}}>{p.benName} <span style={{color:T.grey,fontWeight:400,fontSize:12}}>({p.bid})</span></div></div><div style={{fontSize:12,color:T.grey}}>{p.visit_date||p.date}{p.visit_type&&<span style={{marginLeft:8,background:"#EBF5FB",color:"#1A5276",padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700}}>{p.visit_type}</span>}</div></div><div style={{fontSize:11,color:T.grey,marginBottom:8}}>{c?.icon} {c?.name} · {p.author}</div><div style={{fontSize:13,color:T.navy,lineHeight:1.65}}>{p.text}</div></div>);})}
    </div>
  </div>);
}

function UserMgmt({users,setUsers,user,bens,onToggle,onNavigateToBen}){
  const [showAdd,setShowAdd]=useState(false);const [editUser,setEditUser]=useState(null);const [changePwUser,setChangePwUser]=useState(null);
  const [form,setForm]=useState({name:"",email:"",password:"",role:"Programme Officer",coordinator_id:""});
  const [msg,setMsg]=useState("");const [deleteConfirm,setDeleteConfirm]=useState(null);const [deleteText,setDeleteText]=useState("");
  const s=(k,v)=>setForm(p=>({...p,[k]:v}));
  const activeUsers=users.filter(u=>u.status!=="Inactive");
  const inactiveUsers=users.filter(u=>u.status==="Inactive");
  const coordinators=activeUsers.filter(u=>u.role==="Programme Coordinator"&&u.status!=="Inactive");
  const adminCount=activeUsers.filter(u=>u.role==="Admin").length;

  const roleColor=(role)=>{
    if(role==="Admin")return{bg:"#FDEDEC",color:"#C0392B"};
    if(role==="Management")return{bg:"#FEF9E7",color:"#9A7D0A"};
    if(role==="Programme Coordinator")return{bg:"#F5EEF8",color:"#6C3483"};
    return{bg:"#EBF5FB",color:"#1A5276"};
  };

  async function addUser(){
    if(!form.name||!form.email||!form.password){setMsg("Please fill all fields.");return;}
    if(users.find(u=>u.email===form.email)){setMsg("Email already exists.");return;}
    if(form.password.length<6){setMsg("Password must be at least 6 characters.");return;}
    const nu={id:`user-${Date.now()}`,name:form.name,email:form.email.toLowerCase(),password:form.password,role:form.role,avatar:inits(form.name),coordinator_id:form.role==="Programme Officer"?form.coordinator_id||null:null,status:"Active"};
    const ok=await saveAppUser(nu);
    if(!ok){setMsg("❌ Error creating user. This email may already be registered.");return;}
    const{data:newProfile}=await supabase.from("app_users").select("*").eq("email",form.email.toLowerCase()).single();
    if(newProfile&&nu.coordinator_id){await supabase.from("app_users").update({coordinator_id:nu.coordinator_id}).eq("id",newProfile.id);}
    setUsers(u=>[...u,newProfile||nu]);
    setMsg("✅ User created! They can now log in with the password you set.");
    setForm({name:"",email:"",password:"",role:"Programme Officer",coordinator_id:""});
    setShowAdd(false);
  }

  async function saveEdit(){
    if(!editUser.name||!editUser.email){setMsg("Name and email required.");return;}
    const updates={...editUser,name:editUser.name,email:editUser.email,avatar:inits(editUser.name),coordinator_id:editUser.coordinator_id||null};
    await saveAppUser(updates);
    await supabase.from("app_users").update({coordinator_id:editUser.coordinator_id||null}).eq("id",editUser.id);
    setUsers(u=>u.map(x=>x.id===editUser.id?{...x,...updates}:x));
    setMsg("✅ User updated!");setEditUser(null);
  }

  async function deactivateUser(u){
    // Check if officer has active beneficiaries
    if(u.role==="Programme Officer"){
      const myBens=(bens||[]).filter(b=>b.assigned_to===u.id&&b.status==="Active");
      if(myBens.length>0){setMsg(`⚠️ ${u.name} has ${myBens.length} active beneficiar${myBens.length===1?"y":"ies"}. Please reassign them before deactivating.`);return;}
    }
    // Check if coordinator has active officers
    if(u.role==="Programme Coordinator"){
      const myOfficers=activeUsers.filter(o=>o.role==="Programme Officer"&&o.coordinator_id===u.id);
      if(myOfficers.length>0){setMsg(`⚠️ ${u.name} supervises ${myOfficers.length} active officer${myOfficers.length===1?"":"s"}. Please reassign them to another coordinator before deactivating.`);return;}
    }
    // Block deactivating self
    if(u.id===user.id){setMsg("❌ You cannot deactivate your own account.");return;}
    // Block deactivating last Admin
    if(u.role==="Admin"&&adminCount<=1){setMsg("❌ Cannot deactivate the last Admin account. Create another Admin first.");return;}
    if(!window.confirm(`Deactivate ${u.name}? They will no longer be able to log in. Their data will be preserved.`))return;
    await supabase.from("app_users").update({status:"Inactive"}).eq("id",u.id);
    setUsers(us=>us.map(x=>x.id===u.id?{...x,status:"Inactive"}:x));
    setMsg(`✅ ${u.name} has been deactivated.`);
  }

  async function reactivateUser(u){
    await supabase.from("app_users").update({status:"Active"}).eq("id",u.id);
    setUsers(us=>us.map(x=>x.id===u.id?{...x,status:"Active"}:x));
    // Send password reset email so they can log back in cleanly
    const{error}=await supabase.auth.resetPasswordForEmail(u.email,{redirectTo:window.location.origin});
    if(!error){setMsg(`✅ ${u.name} has been reactivated. A password reset email has been sent to ${u.email}.`);}
    else{setMsg(`✅ ${u.name} has been reactivated. Please manually reset their password.`);}
  }

  async function confirmDelete(){
    if(deleteText!=="DELETE"){setMsg("❌ Please type DELETE to confirm.");return;}
    const u=deleteConfirm;
    if(u.id===user.id){setMsg("❌ You cannot delete your own account.");setDeleteConfirm(null);setDeleteText("");return;}
    if(u.role==="Admin"&&adminCount<=1){setMsg("❌ Cannot delete the last Admin account.");setDeleteConfirm(null);setDeleteText("");return;}
    await deleteAppUser(u.id);
    setUsers(us=>us.filter(x=>x.id!==u.id));
    setMsg(`✅ ${u.name} permanently deleted.`);
    setDeleteConfirm(null);setDeleteText("");
  }

  async function sendResetEmail(u){
    if(u.status==="Inactive"){setMsg("❌ This account is deactivated. Reactivate it first before resetting the password.");setChangePwUser(null);return;}
    const{error}=await supabase.auth.resetPasswordForEmail(u.email,{redirectTo:window.location.origin});
    if(error){setMsg("❌ Could not send reset email: "+error.message);}
    else{setMsg("✅ Password reset email sent to "+u.email+".");}
    setChangePwUser(null);
  }

  function UserRow({u,i,inactive=false}){
    const rc=roleColor(u.role);
    const coord=u.coordinator_id?users.find(x=>x.id===u.coordinator_id):null;
    return(<tr style={{background:inactive?"#FAFAFA":i%2===0?"#fff":T.off,borderBottom:`1px solid ${T.greyL}`,opacity:inactive?0.75:1}}>
      <td style={{padding:"13px 16px"}}><div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:34,height:34,borderRadius:"50%",background:inactive?"#ccc":aColor(u.name),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,color:"#fff"}}>{inits(u.name)}</div>
        <div><div style={{fontWeight:700,fontSize:13,color:inactive?T.grey:T.navy}}>{u.name}</div>
        {inactive&&<div style={{fontSize:10,color:"#C0392B",fontWeight:700}}>INACTIVE</div>}</div>
      </div></td>
      <td style={{padding:"13px 16px",fontSize:12,color:T.navy}}>{u.email}</td>
      <td style={{padding:"13px 16px"}}><span style={{background:rc.bg,color:rc.color,padding:"3px 12px",borderRadius:20,fontSize:11,fontWeight:700}}>{u.role}</span></td>
      <td style={{padding:"13px 16px",fontSize:12,color:T.grey}}>{coord?coord.name:"—"}</td>
      <td style={{padding:"13px 16px"}}><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {!inactive&&<><button onClick={()=>{setEditUser({...u});setShowAdd(false);setChangePwUser(null);}} style={{padding:"5px 11px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:"#EBF5FB",color:"#1A5276"}}>✏️ Edit</button>
        <button onClick={()=>{setChangePwUser(u);setShowAdd(false);setEditUser(null);}} style={{padding:"5px 11px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:"#FEF9E7",color:"#9A7D0A"}}>📧 Reset</button>
        {u.id!==user.id&&<button onClick={()=>deactivateUser(u)} style={{padding:"5px 11px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:"#FEF5E7",color:"#E67E22"}}>⏸ Deactivate</button>}</>}
        {inactive&&<button onClick={()=>reactivateUser(u)} style={{padding:"5px 11px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:"#EAFAF1",color:"#1D8348"}}>▶ Reactivate</button>}
        {u.id!==user.id&&<button onClick={()=>{setDeleteConfirm(u);setDeleteText("");}} style={{padding:"5px 11px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:"#FDEDEC",color:"#C0392B"}}>🗑 Delete</button>}
      </div></td>
    </tr>);
  }

  return(<div className="fade-in"><Topbar user={user} onNavigateToBen={onNavigateToBen} onToggle={onToggle} title="User Management" sub="Admin only — manage platform users"/>
    <div style={{padding:"24px 32px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div style={{fontSize:13,color:T.grey}}>{activeUsers.length} active · {inactiveUsers.length} inactive</div>
        <Btn variant="primary" onClick={()=>{setShowAdd(!showAdd);setEditUser(null);setChangePwUser(null);}}>+ Create User</Btn>
      </div>
      {msg&&<div style={{background:msg.includes("✅")?"#EAFAF1":msg.includes("⚠️")?"#FEF9E7":"#FDEDEC",color:msg.includes("✅")?"#1D8348":msg.includes("⚠️")?"#9A7D0A":"#C0392B",borderRadius:8,padding:"10px 16px",marginBottom:16,fontSize:13}}>{msg}</div>}

      {/* Delete confirmation box */}
      {deleteConfirm&&<div style={{background:"#FDEDEC",border:"1px solid #F1948A",borderRadius:12,padding:"20px 24px",marginBottom:20}}>
        <div style={{fontWeight:700,fontSize:14,color:"#922B21",marginBottom:8}}>⚠️ Permanently Delete — {deleteConfirm.name}</div>
        <div style={{fontSize:13,color:"#C0392B",marginBottom:14}}>This cannot be undone. All their data will be permanently removed. Type <strong>DELETE</strong> to confirm.</div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <input value={deleteText} onChange={e=>setDeleteText(e.target.value)} placeholder="Type DELETE to confirm" style={{border:"1px solid #F1948A",borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",width:220}}/>
          <button onClick={confirmDelete} style={{padding:"8px 18px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,background:"#C0392B",color:"#fff"}}>Confirm Delete</button>
          <button onClick={()=>{setDeleteConfirm(null);setDeleteText("");}} style={{padding:"8px 18px",borderRadius:8,border:`1px solid ${T.greyM}`,cursor:"pointer",fontSize:12,background:"#fff",color:T.grey}}>Cancel</button>
        </div>
      </div>}

      {/* Create user form */}
      {showAdd&&<div style={{background:"#fff",borderRadius:12,padding:"24px",marginBottom:20,boxShadow:"0 2px 10px rgba(0,0,0,0.08)"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:T.navy,marginBottom:16}}>Create New User</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
          <FI label="Full Name *" value={form.name} onChange={v=>s("name",v)}/>
          <FI label="Email *" value={form.email} onChange={v=>s("email",v)} type="email"/>
          <FI label="Password *" value={form.password} onChange={v=>s("password",v)} type="password"/>
          <FI label="Role" value={form.role} onChange={v=>s("role",v)} options={["Programme Officer","Programme Coordinator","Management","Admin"]}/>
          {form.role==="Programme Officer"&&coordinators.length>0&&<FI label="Assign to Coordinator" value={form.coordinator_id} onChange={v=>s("coordinator_id",v)} options={[{value:"",label:"— None —"},...coordinators.map(c=>({value:c.id,label:c.name}))]}/>}
        </div>
        <div style={{display:"flex",gap:10}}><Btn variant="primary" onClick={addUser}>Create Account</Btn><Btn variant="secondary" onClick={()=>setShowAdd(false)}>Cancel</Btn></div>
      </div>}

      {/* Edit user form */}
      {editUser&&<div style={{background:"#fff",borderRadius:12,padding:"24px",marginBottom:20,boxShadow:"0 2px 10px rgba(0,0,0,0.08)"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:T.navy,marginBottom:16}}>Edit User — {editUser.name}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
          <FI label="Full Name *" value={editUser.name} onChange={v=>setEditUser(u=>({...u,name:v}))}/>
          <FI label="Email *" value={editUser.email} onChange={v=>setEditUser(u=>({...u,email:v}))} type="email"/>
          {editUser.role==="Programme Officer"&&coordinators.length>0&&<FI label="Assigned Coordinator" value={editUser.coordinator_id||""} onChange={v=>setEditUser(u=>({...u,coordinator_id:v}))} options={[{value:"",label:"— None —"},...coordinators.map(c=>({value:c.id,label:c.name}))]}/>}
        </div>
        <div style={{display:"flex",gap:10}}><Btn variant="primary" onClick={saveEdit}>Save</Btn><Btn variant="secondary" onClick={()=>setEditUser(null)}>Cancel</Btn></div>
      </div>}

      {/* Reset password form */}
      {changePwUser&&<div style={{background:"#fff",borderRadius:12,padding:"24px",marginBottom:20,boxShadow:"0 2px 10px rgba(0,0,0,0.08)"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:T.navy,marginBottom:10}}>Reset Password — {changePwUser.name}</div>
        <div style={{fontSize:13,color:T.grey,marginBottom:16}}>A password reset email will be sent to <strong>{changePwUser.email}</strong>.</div>
        <div style={{display:"flex",gap:10}}><Btn variant="primary" onClick={()=>sendResetEmail(changePwUser)}>📧 Send Reset Email</Btn><Btn variant="secondary" onClick={()=>setChangePwUser(null)}>Cancel</Btn></div>
      </div>}

      {/* Active users table */}
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:T.navy,marginBottom:10}}>Active Users ({activeUsers.length})</div>
      <div style={{background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",marginBottom:24}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{background:T.off,borderBottom:`2px solid ${T.greyM}`}}>{["User","Email","Role","Coordinator","Actions"].map(h=><th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:11,fontWeight:700,color:T.slate,textTransform:"uppercase",letterSpacing:0.8}}>{h}</th>)}</tr></thead>
          <tbody>{activeUsers.map((u,i)=><UserRow key={u.id} u={u} i={i}/>)}</tbody>
        </table>
      </div>

      {/* Inactive users table */}
      {inactiveUsers.length>0&&<><div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:T.grey,marginBottom:10}}>Inactive Users ({inactiveUsers.length})</div>
      <div style={{background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{background:T.off,borderBottom:`2px solid ${T.greyM}`}}>{["User","Email","Role","Coordinator","Actions"].map(h=><th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:11,fontWeight:700,color:T.slate,textTransform:"uppercase",letterSpacing:0.8}}>{h}</th>)}</tr></thead>
          <tbody>{inactiveUsers.map((u,i)=><UserRow key={u.id} u={u} i={i} inactive/>)}</tbody>
        </table>
      </div></>}
    </div>
  </div>);
}

function MyAccount({user,users,setUsers,onToggle,onNavigateToBen}){
  const [pwForm,setPwForm]=useState({current:"",newPw:"",confirm:""});const [msg,setMsg]=useState("");
  async function changeMyPassword(){
    if(!pwForm.current){setMsg("Please enter your current password.");return;}
    if(pwForm.newPw.length<6){setMsg("New password must be at least 6 characters.");return;}
    if(pwForm.newPw!==pwForm.confirm){setMsg("New passwords do not match.");return;}
    const verified=await loginUser(user.email,pwForm.current);
    if(!verified){setMsg("Current password is incorrect.");return;}
    const ok=await updateUserPassword(user.id,pwForm.newPw);
    if(ok){setMsg("✅ Password changed successfully!");}
    else setMsg("Error saving. Please try again.");
    setPwForm({current:"",newPw:"",confirm:""});
  }
  return(<div className="fade-in"><Topbar user={user} onNavigateToBen={onNavigateToBen} onToggle={onToggle} title="My Account" sub="Manage your account settings"/>
    <div style={{padding:"24px 32px",maxWidth:600}}>
      <div style={{background:"#fff",borderRadius:12,padding:"24px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",marginBottom:20}}>
        <SH>Profile</SH>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{width:60,height:60,borderRadius:"50%",background:aColor(user.name),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:22,color:"#fff"}}>{inits(user.name)}</div>
          <div><div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:T.navy}}>{user.name}</div><div style={{fontSize:13,color:T.grey}}>{user.email}</div><span style={{background:user.role==="Admin"?"#FDEDEC":user.role==="Programme Coordinator"?"#F5EEF8":"#EBF5FB",color:user.role==="Admin"?"#C0392B":user.role==="Programme Coordinator"?"#6C3483":"#1A5276",padding:"3px 12px",borderRadius:20,fontSize:11,fontWeight:700,display:"inline-block",marginTop:4}}>{user.role}</span></div>
        </div>
      </div>
      <div style={{background:"#fff",borderRadius:12,padding:"24px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        <SH>Change Password</SH>
        {msg&&<div style={{background:msg.includes("✅")?"#EAFAF1":"#FDEDEC",color:msg.includes("✅")?"#1D8348":"#C0392B",borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:13}}>{msg}</div>}
        <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
          <FI label="Current Password *" value={pwForm.current} onChange={v=>setPwForm(p=>({...p,current:v}))} type="password"/>
          <FI label="New Password *" value={pwForm.newPw} onChange={v=>setPwForm(p=>({...p,newPw:v}))} type="password"/>
          <FI label="Confirm New Password *" value={pwForm.confirm} onChange={v=>setPwForm(p=>({...p,confirm:v}))} type="password"/>
        </div>
        <Btn variant="primary" onClick={changeMyPassword}>Update Password</Btn>
      </div>
    </div>
  </div>);
}

function MyOfficers({user,users,bens,onNavigate,onToggle,onNavigateToBen}){
  const myOfficers=users.filter(u=>u.role==="Programme Officer"&&u.coordinator_id===user.id&&u.status!=="Inactive");
  return(<div className="fade-in"><Topbar user={user} onNavigateToBen={onNavigateToBen} onToggle={onToggle} title="My Officers" sub="Programme officers under your supervision"/>
    <div style={{padding:"24px 32px"}}>
      {myOfficers.length===0&&<div style={{background:"#fff",borderRadius:12,padding:32,textAlign:"center",color:T.grey,fontSize:14,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>No officers assigned to you yet. Ask an Admin to assign officers under your coordination.</div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
        {myOfficers.map(officer=>{
          const myBens=bens.filter(b=>b.assigned_to===officer.id);
          const active=myBens.filter(b=>b.status==="Active").length;
          const overdue=myBens.filter(b=>{if(!b.last_follow_up)return true;const d=new Date(b.last_follow_up);const diff=(new Date()-d)/(1000*60*60*24);return diff>90;}).length;
          const totalPosts=myBens.reduce((sum,b)=>(b.posts||[]).length+sum,0);
          return(<div key={officer.id} className="card-hover" onClick={()=>onNavigate("ben-list",{officer:officer.id})} style={{background:"#fff",borderRadius:12,padding:"20px 22px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",cursor:"pointer",transition:"all 0.2s"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
              <div style={{width:44,height:44,borderRadius:"50%",background:aColor(officer.name),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:16,color:"#fff",flexShrink:0}}>{inits(officer.name)}</div>
              <div style={{flex:1}}><div style={{fontWeight:700,fontSize:15,color:T.navy}}>{officer.name}</div><div style={{fontSize:12,color:T.grey}}>{officer.email}</div></div>
              <div style={{fontSize:20,color:T.grey}}>→</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:0}}>
              <div style={{background:T.off,borderRadius:8,padding:"10px 0",textAlign:"center"}}>
                <div style={{fontSize:22,fontWeight:700,color:T.navy}}>{myBens.length}</div>
                <div style={{fontSize:10,color:T.grey,textTransform:"uppercase",letterSpacing:0.5}}>Cases</div>
              </div>
              <div style={{background:"#EAFAF1",borderRadius:8,padding:"10px 0",textAlign:"center"}}>
                <div style={{fontSize:22,fontWeight:700,color:"#1D8348"}}>{active}</div>
                <div style={{fontSize:10,color:"#1D8348",textTransform:"uppercase",letterSpacing:0.5}}>Active</div>
              </div>
              <div style={{background:overdue>0?"#FDEDEC":T.off,borderRadius:8,padding:"10px 0",textAlign:"center"}}>
                <div style={{fontSize:22,fontWeight:700,color:overdue>0?"#C0392B":T.grey}}>{overdue}</div>
                <div style={{fontSize:10,color:overdue>0?"#C0392B":T.grey,textTransform:"uppercase",letterSpacing:0.5}}>Overdue</div>
              </div>
            </div>
            <div style={{marginTop:10,fontSize:12,color:T.grey,borderTop:`1px solid ${T.greyL}`,paddingTop:10}}>
              💬 {totalPosts} follow-up note{totalPosts!==1?"s":""} · <span style={{color:"#1A5276",fontWeight:600}}>Click to view cases →</span>
            </div>
          </div>);
        })}
      </div>
    </div>
  </div>);
}

function ActivityPlanner({user,users,initialTarget,onClearTarget,onToggle,onNavigateToBen}){
  const now=new Date();
  const [year,setYear]=useState(now.getFullYear());
  const [month,setMonth]=useState(now.getMonth());
  const [plans,setPlans]=useState({});
  const [comments,setComments]=useState({});
  const [approvals,setApprovals]=useState({});
  const [viewUserId,setViewUserId]=useState(initialTarget||user.id);
  const [saving,setSaving]=useState({});
  const [draftPlans,setDraftPlans]=useState({});
  const [saveMsg,setSaveMsg]=useState("");
  const [commentInput,setCommentInput]=useState({});
  const [showCommentBox,setShowCommentBox]=useState({});
  const [approvalNote,setApprovalNote]=useState("");
  const [showApprovalBox,setShowApprovalBox]=useState(false);

  // When initialTarget changes (from notification click), switch to that officer
  useEffect(()=>{
    if(initialTarget){
      setViewUserId(initialTarget);
      onClearTarget&&onClearTarget();
    }
  },[initialTarget]);
  const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAYS=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  // Who can be viewed
  const myOfficers=users.filter(u=>u.role==="Programme Officer"&&u.coordinator_id===user.id&&u.status!=="Inactive");
  // Admin sees ALL users including inactive (for auditing past plans)
  const allOfficers=user.role==="Admin"
    ?users.filter(u=>u.role==="Programme Officer")
    :users.filter(u=>u.role==="Programme Officer"&&u.status!=="Inactive");
  const allCoordinators=user.role==="Admin"
    ?users.filter(u=>u.role==="Programme Coordinator")
    :users.filter(u=>u.role==="Programme Coordinator"&&u.status!=="Inactive");
  const viewableUsers=user.role==="Admin"
    ?[user,...allCoordinators,...allOfficers]
    :user.role==="Management"
      ?[...users.filter(u=>u.role==="Admin"&&u.id!==user.id),...users.filter(u=>u.role==="Programme Coordinator"&&u.status!=="Inactive"),...users.filter(u=>u.role==="Programme Officer"&&u.status!=="Inactive"),user]
      :user.role==="Programme Coordinator"
        ?[user,...myOfficers]
        :[user];
  const viewUser=users.find(u=>u.id===viewUserId)||user;
  const isOwnPlan=viewUserId===user.id;
  const canComment=(user.role==="Admin"||user.role==="Programme Coordinator")&&!isOwnPlan&&user.role!=="Management";
  const canApprove=user.role==="Programme Coordinator"&&viewUser.role==="Programme Officer"&&viewUser.coordinator_id===user.id;
  const canAdminApprove=user.role==="Admin"&&viewUser.role==="Programme Coordinator";

  // End of month reminder: officer, last 5 days of month, next month plan empty
  const daysInCurrentMonth=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
  const dayOfMonth=now.getDate();
  const showReminder=user.role==="Programme Officer"&&isOwnPlan&&(daysInCurrentMonth-dayOfMonth)<5;

  const monthKey=`${year}-${String(month+1).padStart(2,"0")}`;

  useEffect(()=>{
    loadData();
    setDraftPlans({});
    setSaveMsg("");
  },[viewUserId,month,year]);

  async function loadData(){
    const{data:planData}=await supabase.from("activity_plans").select("*").eq("user_id",viewUserId).like("plan_date",`${year}-${String(month+1).padStart(2,"0")}-%`);
    if(planData){const map={};planData.forEach(p=>{map[p.plan_date]=p;});setPlans(map);}
    const{data:commentData}=await supabase.from("plan_comments").select("*").eq("target_user_id",viewUserId).like("plan_date",`${year}-${String(month+1).padStart(2,"0")}-%`);
    if(commentData){const map={};commentData.forEach(c=>{if(!map[c.plan_date])map[c.plan_date]=[];map[c.plan_date].push(c);});setComments(map);}
    const{data:approvalData}=await supabase.from("plan_approvals").select("*").eq("officer_id",viewUserId).eq("month",monthKey).single();
    if(approvalData)setApprovals(a=>({...a,[viewUserId+monthKey]:approvalData}));
  }

  async function saveAllPlans(){
    const entries=Object.entries(draftPlans);
    if(entries.length===0){setSaveMsg("ℹ️ No changes to save.");setTimeout(()=>setSaveMsg(""),3000);return;}
    setSaving({all:true});
    for(const[dateStr,text]of entries){
      await supabase.from("activity_plans").upsert({user_id:user.id,plan_date:dateStr,activity:text,updated_at:new Date().toISOString()},{onConflict:"user_id,plan_date"});
      setPlans(p=>({...p,[dateStr]:{...p[dateStr],activity:text}}));
    }
    setDraftPlans({});
    setSaving({});
    setSaveMsg("✅ Plan saved successfully!");
    // Notify coordinator
    const coordId=users.find(u2=>u2.id===user.id)?.coordinator_id;
    if(coordId){
      await createNotification(
        coordId,"plan",
        `Plan submitted: ${user.name}`,
        `${user.name} has saved their activity plan for ${MONTHS[month]} ${year}. Please review.`,
        null,user.id
      );
    }
    setTimeout(()=>setSaveMsg(""),4000);
  }

  async function submitComment(dateStr){
    const text=commentInput[dateStr];
    if(!text||!text.trim())return;
    const{data}=await supabase.from("plan_comments").insert([{plan_date:dateStr,target_user_id:viewUserId,author_id:user.id,author_name:user.name,author_role:user.role,comment:text,created_at:new Date().toISOString()}]).select().single();
    if(data){
      setComments(c=>({...c,[dateStr]:[...(c[dateStr]||[]),data]}));
      setCommentInput(i=>({...i,[dateStr]:""}));
      setShowCommentBox(s=>({...s,[dateStr]:false}));
      // Notify the target user
      await createNotification(
        viewUserId,"plan",
        `New instruction on your plan`,
        `${user.name} (${user.role}) added a note to your plan for ${dateStr}: "${text.slice(0,60)}${text.length>60?"...":""}"`,
        null,user.id
      );
    }
  }

  async function setApprovalStatus(status){
    const existing=approvals[viewUserId+monthKey];
    if(existing){
      await supabase.from("plan_approvals").update({status,note:approvalNote,updated_at:new Date().toISOString()}).eq("id",existing.id);
    } else {
      await supabase.from("plan_approvals").insert([{officer_id:viewUserId,coordinator_id:user.id,month:monthKey,status,note:approvalNote}]);
    }
    setApprovals(a=>({...a,[viewUserId+monthKey]:{...(existing||{}),status,note:approvalNote}}));
    setShowApprovalBox(false);
    setApprovalNote("");
    // Notify officer/coordinator
    const msg=status==="Approved"
      ?`${user.name} approved your activity plan for ${MONTHS[month]} ${year}`
      :`${user.name} marked your plan for ${MONTHS[month]} ${year} as "${status}"${approvalNote?": "+approvalNote:""}`;
    await createNotification(viewUserId,"plan",`Plan ${status}: ${MONTHS[month]} ${year}`,msg,null,user.id);
  }

  // Build calendar grid
  function buildCalendar(){
    const firstDay=new Date(year,month,1);
    const lastDay=new Date(year,month+1,0);
    const startDow=firstDay.getDay()===0?6:firstDay.getDay()-1; // Mon=0
    const days=[];
    for(let i=0;i<startDow;i++){
      const d=new Date(year,month,1-startDow+i);
      days.push({date:d,current:false});
    }
    for(let i=1;i<=lastDay.getDate();i++){
      days.push({date:new Date(year,month,i),current:true});
    }
    while(days.length%7!==0){
      const d=new Date(year,month+1,days.length-lastDay.getDate()-startDow+1);
      days.push({date:d,current:false});
    }
    return days;
  }

  function fmtDate(d){return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
  function isToday(d){return fmtDate(d)===fmtDate(now);}

  const days=buildCalendar();
  const approval=approvals[viewUserId+monthKey];
  const approvalColor=!approval||approval.status==="Pending"?"#888":approval.status==="Approved"?"#27AE60":"#E67E22";
  const approvalBg=!approval||approval.status==="Pending"?"#F5F5F5":approval.status==="Approved"?"#EAFAF1":"#FEF5E7";

  return(<div className="fade-in">
    <Topbar user={user} onNavigateToBen={onNavigateToBen} onToggle={onToggle} title="Activity Planner" sub="Plan and track monthly field activities"/>
    <div style={{padding:"16px 24px"}}>

      {/* End of month reminder */}
      {showReminder&&<div style={{background:"#EBF5FB",border:"1px solid #AED6F1",borderRadius:10,padding:"10px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:10,fontSize:13,color:"#1A5276"}}>
        <span style={{fontSize:18}}>📅</span>
        <span>Reminder: Please fill in your activity plan for <strong>{MONTHS[month===11?0:month+1]} {month===11?year+1:year}</strong> before the month ends.</span>
      </div>}

      {/* Toolbar */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={()=>{if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1);}} style={{width:28,height:28,borderRadius:7,border:`1px solid ${T.greyM}`,background:"#fff",cursor:"pointer",fontSize:14}}>←</button>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:T.navy,minWidth:140,textAlign:"center"}}>{MONTHS[month]} {year}</div>
          <button onClick={()=>{if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1);}} style={{width:28,height:28,borderRadius:7,border:`1px solid ${T.greyM}`,background:"#fff",cursor:"pointer",fontSize:14}}>→</button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {/* Approval badge */}
          {canApprove&&<div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{background:approvalBg,color:approvalColor,padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:700,border:`1px solid ${approvalColor}`}}>
              {approval?.status||"Pending"}
            </span>
            <button onClick={()=>setShowApprovalBox(s=>!s)} style={{padding:"5px 12px",borderRadius:7,border:`1px solid ${T.greyM}`,background:"#fff",cursor:"pointer",fontSize:12,fontWeight:700,color:T.navy}}>
              ✓ Review Plan
            </button>
          </div>}
          {/* Admin can also approve coordinator plans */}
          {canAdminApprove&&<div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{background:approvalBg,color:approvalColor,padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:700,border:`1px solid ${approvalColor}`}}>
              {approval?.status||"Pending"}
            </span>
            <button onClick={()=>setShowApprovalBox(s=>!s)} style={{padding:"5px 12px",borderRadius:7,border:`1px solid ${T.greyM}`,background:"#fff",cursor:"pointer",fontSize:12,fontWeight:700,color:T.navy}}>
              ✓ Review Plan
            </button>
          </div>}
          <button onClick={()=>window.print()} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:7,border:`1px solid ${T.greyM}`,background:"#fff",cursor:"pointer",fontSize:12,color:T.navy}}>
            🖨 Print
          </button>
        </div>
      </div>

      {/* Approval box */}
      {showApprovalBox&&<div style={{background:"#fff",borderRadius:10,padding:"16px",marginBottom:12,boxShadow:"0 2px 10px rgba(0,0,0,0.08)"}}>
        <div style={{fontWeight:700,fontSize:13,color:T.navy,marginBottom:10}}>Review {viewUser.name}'s plan for {MONTHS[month]} {year}</div>
        <textarea value={approvalNote} onChange={e=>setApprovalNote(e.target.value)} placeholder="Add a note (optional)..." spellCheck="true" style={{width:"100%",border:`1px solid ${T.greyM}`,borderRadius:8,padding:"8px 12px",fontSize:12,fontFamily:"'Source Sans 3',sans-serif",marginBottom:10,resize:"vertical",minHeight:60}}/>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setApprovalStatus("Approved")} style={{padding:"6px 16px",borderRadius:7,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,background:"#EAFAF1",color:"#1D8348"}}>✓ Approve</button>
          <button onClick={()=>setApprovalStatus("Needs Revision")} style={{padding:"6px 16px",borderRadius:7,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,background:"#FEF5E7",color:"#E67E22"}}>⚠ Needs Revision</button>
          <button onClick={()=>setApprovalStatus("Pending")} style={{padding:"6px 16px",borderRadius:7,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,background:"#F5F5F5",color:"#888"}}>Reset to Pending</button>
          <button onClick={()=>setShowApprovalBox(false)} style={{padding:"6px 16px",borderRadius:7,border:`1px solid ${T.greyM}`,cursor:"pointer",fontSize:12,background:"#fff",color:T.grey}}>Cancel</button>
        </div>
      </div>}

      {/* Officer tabs for coordinator/admin */}
      {viewableUsers.length>1&&<div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:11,color:T.grey,marginRight:4}}>Viewing:</span>
        {viewableUsers.map(u=>{
          const isInactive=u.status==="Inactive";
          return(<button key={u.id} onClick={()=>setViewUserId(u.id)} style={{padding:"4px 12px",borderRadius:20,border:`1px solid ${viewUserId===u.id?"#1E6B3C":T.greyM}`,background:viewUserId===u.id?"#1E6B3C":"#fff",color:viewUserId===u.id?"#fff":isInactive?T.grey:T.navy,fontSize:11,cursor:"pointer",fontWeight:viewUserId===u.id?700:400,opacity:isInactive?0.6:1}}>
            {u.id===user.id?"My plan":u.name}
            {isInactive&&<span style={{fontSize:9,marginLeft:4,color:"#E74C3C"}}>(inactive)</span>}
            {u.role==="Programme Coordinator"&&u.id!==user.id&&<span style={{fontSize:9,marginLeft:4,opacity:0.7}}>(Coord)</span>}
          </button>);
        })}
      </div>}

      {/* Plan status for officer viewing own plan */}
      {isOwnPlan&&user.role==="Programme Officer"&&<div style={{marginBottom:10}}>
        {approval&&<div style={{display:"inline-flex",alignItems:"center",gap:6,background:approvalBg,border:`1px solid ${approvalColor}`,borderRadius:20,padding:"3px 12px",fontSize:11,color:approvalColor,fontWeight:700}}>
          {approval.status==="Approved"?"✓":"⚠"} Plan {approval.status}
          {approval.note&&<span style={{fontWeight:400,color:T.grey}}>— {approval.note}</span>}
        </div>}
      </div>}

      {/* Calendar grid */}
      <div style={{background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        {/* Day headers */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:T.off,borderBottom:`1px solid ${T.greyL}`}}>
          {DAYS.map(d=><div key={d} style={{padding:"8px 0",textAlign:"center",fontSize:10,fontWeight:700,color:T.slate,textTransform:"uppercase",letterSpacing:0.8}}>{d}</div>)}
        </div>
        {/* Weeks */}
        {Array.from({length:days.length/7},(_,wi)=>(
          <div key={wi} style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",borderBottom:wi<days.length/7-1?`1px solid ${T.greyL}`:"none"}}>
            {days.slice(wi*7,wi*7+7).map((day,di)=>{
              const dateStr=fmtDate(day.date);
              const plan=plans[dateStr];
              const dayComments=comments[dateStr]||[];
              const today=isToday(day.date);
              const showCB=showCommentBox[dateStr];
              return(<div key={di} style={{borderRight:di<6?`1px solid ${T.greyL}`:"none",padding:"6px 7px",minHeight:90,background:!day.current?"#FAFAFA":today?"#F0FBF4":"#fff",opacity:!day.current?0.5:1,position:"relative"}}>
                <div style={{fontSize:11,fontWeight:today?700:400,color:today?"#1E6B3C":T.grey,marginBottom:3}}>{day.date.getDate()}</div>
                {/* Plan text - editable if own plan */}
                {isOwnPlan
                  ?<textarea
                      value={draftPlans[dateStr]!==undefined?draftPlans[dateStr]:(plan?.activity||"")}
                      onChange={e=>day.current&&setDraftPlans(d=>({...d,[dateStr]:e.target.value}))}
                      placeholder={day.current?"Add plan...":""}
                      spellCheck="true"
                      disabled={!day.current}
                      style={{width:"100%",border:"none",background:"transparent",fontSize:10,color:T.navy,resize:"none",fontFamily:"'Source Sans 3',sans-serif",lineHeight:1.45,outline:"none",minHeight:42,cursor:day.current?"text":"default"}}
                    />
                  :<div style={{fontSize:10,color:T.navy,lineHeight:1.45,marginBottom:3,minHeight:28}}>{plan?.activity||<span style={{color:T.greyM,fontStyle:"italic"}}>No plan</span>}</div>
                }
                {/* Coordinator/Admin comments */}
                {dayComments.map((c,ci)=>(
                  <div key={ci} style={{marginTop:3,padding:"2px 5px",background:"#EBF5FB",borderRadius:4,borderLeft:"2px solid #2980B9",fontSize:9,color:"#1A5276",lineHeight:1.4}}>
                    <strong>{c.author_name.split(" ")[0]}:</strong> {c.comment}
                  </div>
                ))}
                {/* Add comment button for coordinators/admins */}
                {canComment&&day.current&&<div style={{marginTop:3}}>
                  {!showCB
                    ?<button onClick={()=>setShowCommentBox(s=>({...s,[dateStr]:true}))} style={{fontSize:9,color:"#2980B9",background:"none",border:"none",cursor:"pointer",padding:0}}>+ Add note</button>
                    :<div>
                      <input value={commentInput[dateStr]||""} onChange={e=>setCommentInput(i=>({...i,[dateStr]:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&submitComment(dateStr)} placeholder="Type instruction..." style={{width:"100%",fontSize:9,border:`1px solid ${T.greyM}`,borderRadius:4,padding:"2px 4px",fontFamily:"'Source Sans 3',sans-serif"}}/>
                      <div style={{display:"flex",gap:4,marginTop:2}}>
                        <button onClick={()=>submitComment(dateStr)} style={{fontSize:9,padding:"1px 6px",borderRadius:3,border:"none",background:"#2980B9",color:"#fff",cursor:"pointer"}}>Send</button>
                        <button onClick={()=>setShowCommentBox(s=>({...s,[dateStr]:false}))} style={{fontSize:9,padding:"1px 6px",borderRadius:3,border:`1px solid ${T.greyM}`,background:"#fff",cursor:"pointer",color:T.grey}}>✕</button>
                      </div>
                    </div>
                  }
                </div>}
                {saving[dateStr]&&<div style={{position:"absolute",top:2,right:4,fontSize:8,color:T.grey}}></div>}
              </div>);
            })}
          </div>
        ))}
      </div>

      {/* Save Plan button — only for own plan */}
      {isOwnPlan&&<div style={{marginTop:16,display:"flex",alignItems:"center",gap:12}}>
        <button
          onClick={saveAllPlans}
          disabled={saving.all}
          style={{padding:"10px 28px",borderRadius:9,border:"none",cursor:saving.all?"not-allowed":"pointer",fontSize:13,fontWeight:700,background:Object.keys(draftPlans).length>0?"#1E6B3C":"#A9DFBF",color:"#fff",transition:"background 0.2s",opacity:saving.all?0.7:1}}
        >
          {saving.all?"Saving...":"💾 Save Plan"}
        </button>
        {Object.keys(draftPlans).length>0&&!saving.all&&<span style={{fontSize:12,color:"#E67E22",fontWeight:600}}>● Unsaved changes</span>}
        {saveMsg&&<span style={{fontSize:12,color:saveMsg.includes("✅")?"#1D8348":saveMsg.includes("ℹ️")?"#1A5276":"#C0392B",fontWeight:600}}>{saveMsg}</span>}
      </div>}
    </div>
  </div>);
}

function OrgStructure({user,users,bens,onToggle,onNavigateToBen}){
  const activeUsers=users.filter(u=>u.status!=="Inactive");
  const admins=activeUsers.filter(u=>u.role==="Admin");
  const management=activeUsers.filter(u=>u.role==="Management");
  const coordinators=activeUsers.filter(u=>u.role==="Programme Coordinator");
  const officers=activeUsers.filter(u=>u.role==="Programme Officer");

  function StatBadge({label,value,color}){
    return(<div style={{background:color+"22",borderRadius:6,padding:"3px 10px",fontSize:10,color:color,fontWeight:700}}>{value} {label}</div>);
  }

  function PersonCard({u,compact=false}){
    const myBens=bens.filter(b=>b.assigned_to===u.id);
    const active=myBens.filter(b=>b.status==="Active").length;
    return(<div style={{background:"#fff",borderRadius:10,padding:compact?"10px 14px":"14px 16px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",display:"flex",alignItems:"center",gap:10}}>
      <div style={{width:compact?32:40,height:compact?32:40,borderRadius:"50%",background:aColor(u.name),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:compact?11:13,color:"#fff",flexShrink:0}}>{inits(u.name)}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontWeight:700,fontSize:compact?12:13,color:T.navy,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.name}</div>
        <div style={{fontSize:10,color:T.grey,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.email}</div>
        {u.role==="Programme Officer"&&<div style={{fontSize:10,color:T.slate,marginTop:2}}>{active} active case{active!==1?"s":""}</div>}
      </div>
    </div>);
  }

  const SectionTitle=({label,color,count})=>(
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,marginTop:24}}>
      <div style={{height:2,width:24,background:color,borderRadius:2}}/>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:T.navy}}>{label}</div>
      <div style={{background:color+"22",color:color,padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:700}}>{count}</div>
      <div style={{flex:1,height:1,background:T.greyL}}/>
    </div>
  );

  return(<div className="fade-in"><Topbar user={user} onNavigateToBen={onNavigateToBen} onToggle={onToggle} title="Org Structure" sub="Organisation hierarchy — read only"/>
    <div style={{padding:"24px 32px"}}>
      {/* Admin row */}
      {admins.length>0&&<><SectionTitle label="Administrators" color="#C0392B" count={admins.length}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10,marginBottom:8}}>
        {admins.map(u=><PersonCard key={u.id} u={u}/>)}
      </div></>}

      {/* Management row */}
      {management.length>0&&<><SectionTitle label="Management" color="#9A7D0A" count={management.length}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10,marginBottom:8}}>
        {management.map(u=><PersonCard key={u.id} u={u}/>)}
      </div></>}

      {/* Coordinators and their officers */}
      {coordinators.length>0&&<><SectionTitle label="Programme Coordinators & Their Officers" color="#6C3483" count={coordinators.length+" coordinators · "+officers.length+" officers"}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:16}}>
        {coordinators.map(coord=>{
          const myOfficers=officers.filter(o=>o.coordinator_id===coord.id);
          const totalCases=myOfficers.reduce((sum,o)=>sum+bens.filter(b=>b.assigned_to===o.id).length,0);
          const activeCases=myOfficers.reduce((sum,o)=>sum+bens.filter(b=>b.assigned_to===o.id&&b.status==="Active").length,0);
          return(<div key={coord.id} style={{background:T.off,borderRadius:12,padding:"16px",border:`1px solid ${T.greyL}`}}>
            {/* Coordinator card */}
            <div style={{background:"#F5EEF8",borderRadius:10,padding:"12px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:42,height:42,borderRadius:"50%",background:aColor(coord.name),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,color:"#fff",flexShrink:0}}>{inits(coord.name)}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:13,color:T.navy}}>{coord.name}</div>
                <div style={{fontSize:10,color:"#6C3483",fontWeight:700}}>Programme Coordinator</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:18,fontWeight:800,color:T.navy,lineHeight:1}}>{totalCases}</div>
                <div style={{fontSize:9,color:T.grey,textTransform:"uppercase",letterSpacing:0.5}}>Total Cases</div>
              </div>
            </div>
            {/* Officers under this coordinator */}
            {myOfficers.length===0&&<div style={{fontSize:12,color:T.grey,textAlign:"center",padding:"8px 0"}}>No officers assigned</div>}
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {myOfficers.map(o=>{
                const oBens=bens.filter(b=>b.assigned_to===o.id);
                const oActive=oBens.filter(b=>b.status==="Active").length;
                return(<div key={o.id} style={{background:"#fff",borderRadius:8,padding:"8px 12px",display:"flex",alignItems:"center",gap:8,borderLeft:"3px solid #27AE60"}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:aColor(o.name),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:10,color:"#fff",flexShrink:0}}>{inits(o.name)}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:12,color:T.navy,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{o.name}</div>
                    <div style={{fontSize:10,color:T.grey}}>{oBens.length} cases · {oActive} active</div>
                  </div>
                </div>);
              })}
            </div>
          </div>);
        })}
      </div></>}

      {/* Unassigned officers */}
      {officers.filter(o=>!o.coordinator_id).length>0&&<>
        <SectionTitle label="Unassigned Officers" color="#E67E22" count={officers.filter(o=>!o.coordinator_id).length}/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
          {officers.filter(o=>!o.coordinator_id).map(u=><PersonCard key={u.id} u={u}/>)}
        </div>
      </>}
    </div>
  </div>);
}

function StaffDirectory({user,users,bens,onToggle,onNavigateToBen}){
  const [roleF,setRoleF]=useState("All");
  const [statusF,setStatusF]=useState("Active");
  const roles=["All","Admin","Management","Programme Coordinator","Programme Officer"];
  const filtered=users
    .filter(u=>roleF==="All"||u.role===roleF)
    .filter(u=>statusF==="All"||(statusF==="Active"?u.status!=="Inactive":u.status==="Inactive"))
    .sort((a,b)=>a.name.localeCompare(b.name));

  const roleColor=(role)=>{
    if(role==="Admin")return{bg:"#FDEDEC",color:"#C0392B"};
    if(role==="Management")return{bg:"#FEF9E7",color:"#9A7D0A"};
    if(role==="Programme Coordinator")return{bg:"#F5EEF8",color:"#6C3483"};
    return{bg:"#EBF5FB",color:"#1A5276"};
  };

  return(<div className="fade-in"><Topbar user={user} onNavigateToBen={onNavigateToBen} onToggle={onToggle} title="Staff Directory" sub="View all staff — read only"/>
    <div style={{padding:"24px 32px"}}>
      {/* Filters */}
      <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:12,color:T.grey,fontWeight:700}}>Filter by role:</span>
        {roles.map(r=><button key={r} onClick={()=>setRoleF(r)} style={{padding:"5px 14px",borderRadius:20,border:`1px solid ${roleF===r?"#27AE60":T.greyM}`,background:roleF===r?"#27AE60":"#fff",color:roleF===r?"#fff":T.navy,fontSize:12,cursor:"pointer",fontWeight:roleF===r?700:400}}>{r}</button>)}
        <div style={{width:1,height:24,background:T.greyM,margin:"0 4px"}}/>
        <span style={{fontSize:12,color:T.grey,fontWeight:700}}>Status:</span>
        {["Active","Inactive","All"].map(s=><button key={s} onClick={()=>setStatusF(s)} style={{padding:"5px 14px",borderRadius:20,border:`1px solid ${statusF===s?"#27AE60":T.greyM}`,background:statusF===s?"#27AE60":"#fff",color:statusF===s?"#fff":T.navy,fontSize:12,cursor:"pointer",fontWeight:statusF===s?700:400}}>{s}</button>)}
      </div>
      <div style={{fontSize:12,color:T.grey,marginBottom:14}}>{filtered.length} staff member{filtered.length!==1?"s":""}</div>
      {/* Table */}
      <div style={{background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{background:T.off,borderBottom:`2px solid ${T.greyM}`}}>{["Staff Member","Email","Role","Status","Coordinator"].map(h=><th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:11,fontWeight:700,color:T.slate,textTransform:"uppercase",letterSpacing:0.8}}>{h}</th>)}</tr></thead>
          <tbody>{filtered.map((u,i)=>{
            const rc=roleColor(u.role);
            const coord=u.coordinator_id?users.find(x=>x.id===u.coordinator_id):null;
            const inactive=u.status==="Inactive";
            return(<tr key={u.id} style={{background:inactive?"#FAFAFA":i%2===0?"#fff":T.off,borderBottom:`1px solid ${T.greyL}`,opacity:inactive?0.7:1}}>
              <td style={{padding:"13px 16px"}}><div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:34,height:34,borderRadius:"50%",background:inactive?"#ccc":aColor(u.name),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,color:"#fff"}}>{inits(u.name)}</div>
                <span style={{fontWeight:700,fontSize:13,color:inactive?T.grey:T.navy}}>{u.name}</span>
              </div></td>
              <td style={{padding:"13px 16px",fontSize:12,color:T.navy}}>{u.email}</td>
              <td style={{padding:"13px 16px"}}><span style={{background:rc.bg,color:rc.color,padding:"3px 12px",borderRadius:20,fontSize:11,fontWeight:700}}>{u.role}</span></td>
              <td style={{padding:"13px 16px"}}><span style={{background:inactive?"#FDEDEC":"#EAFAF1",color:inactive?"#C0392B":"#1D8348",padding:"3px 12px",borderRadius:20,fontSize:11,fontWeight:700}}>{inactive?"Inactive":"Active"}</span></td>
              <td style={{padding:"13px 16px",fontSize:12,color:T.grey}}>{coord?coord.name:"—"}</td>
            </tr>);
          })}</tbody>
        </table>
      </div>
    </div>
  </div>);
}

function Settings({logoUrl,setLogoUrl,user,users,setUsers,onToggle,onNavigateToBen}){
  const fileRef=useRef();
  const [logoMsg,setLogoMsg]=useState("");const [logoBusy,setLogoBusy]=useState(false);

  async function handleLogo(e){
    const file=e.target.files[0];if(!file)return;
    setLogoBusy(true);setLogoMsg("");
    try{
      const ext=file.name.split(".").pop();
      const path=`app-logo/logo.${ext}`;
      // The logo goes in the PUBLIC branding bucket (not the private photo
      // bucket) so the sign-in page can display it before anyone logs in.
      const{error:upErr}=await supabase.storage.from(BRAND_BUCKET).upload(storagePath,file,{upsert:true,contentType:file.type});
      if(upErr){setLogoMsg("❌ Upload failed: "+upErr.message);setLogoBusy(false);return;}
      const{data:urlData}=supabase.storage.from(BRAND_BUCKET).getPublicUrl(path);
      const publicUrl=urlData.publicUrl+"?t="+Date.now();
      await supabase.from("settings").upsert({key:"logo_url",value:publicUrl},{onConflict:"key"});
      setLogoUrl(publicUrl);
      setLogoMsg("✅ Logo saved!");
    }catch(err){setLogoMsg("❌ Unexpected error. Please try again.");}
    setLogoBusy(false);e.target.value="";
  }
  async function removeLogo(){
    setLogoBusy(true);setLogoMsg("");
    await supabase.from("settings").upsert({key:"logo_url",value:""},{onConflict:"key"});
    setLogoUrl(null);setLogoMsg("✅ Logo removed.");
    setLogoBusy(false);
  }

  return(<div className="fade-in"><Topbar user={user} onNavigateToBen={onNavigateToBen} onToggle={onToggle} title="Settings" sub={user.role==="Management"?"Organisation information — view only":"App configuration — Admin only"}/>
    <div style={{padding:"24px 32px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <div style={{background:"#fff",borderRadius:12,padding:"24px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        <SH>App Logo</SH>
        {logoMsg&&<div style={{background:logoMsg.includes("✅")?"#EAFAF1":"#FDEDEC",color:logoMsg.includes("✅")?"#1D8348":"#C0392B",borderRadius:8,padding:"9px 13px",fontSize:12,marginBottom:12}}>{logoMsg}</div>}
        <div style={{border:`2px dashed ${T.greyM}`,borderRadius:12,padding:"28px",textAlign:"center",background:T.off,marginBottom:14,cursor:user.role==="Management"?"default":"pointer"}} onClick={()=>user.role!=="Management"&&!logoBusy&&fileRef.current.click()}>
          {logoUrl?<img src={logoUrl} alt="logo" style={{width:80,height:80,objectFit:"contain"}}/>:<div><div style={{fontSize:40,marginBottom:8}}>📷</div><div style={{fontSize:13,color:T.grey}}>{logoBusy?"Uploading...":user.role==="Management"?"No logo uploaded yet":"Click to upload your logo"}</div></div>}
          <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleLogo}/>
        </div>
        {user.role!=="Management"&&<div style={{display:"flex",gap:10}}><Btn variant="primary" onClick={()=>!logoBusy&&fileRef.current.click()}>📷 Upload Logo</Btn>{logoUrl&&<Btn variant="secondary" onClick={removeLogo}>Remove</Btn>}</div>}
        {user.role==="Management"&&<div style={{fontSize:11,color:T.grey,fontStyle:"italic"}}>Logo upload is managed by the Administrator.</div>}
      </div>
      <div style={{background:"#fff",borderRadius:12,padding:"24px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        <SH>Official Website</SH>
        <div style={{background:`linear-gradient(135deg,#1A252F,#27AE60)`,borderRadius:12,padding:"24px",textAlign:"center",color:"#fff"}}>
          <div style={{fontSize:32,marginBottom:8}}>🌐</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,marginBottom:4}}>LYSBF Official Website</div>
          <div style={{fontSize:12,opacity:0.75,marginBottom:16}}>lysbfoundation.com</div>
          <a href="https://lysbfoundation.com/" target="_blank" rel="noreferrer" style={{display:"inline-block",background:"#E74C3C",color:"#fff",padding:"10px 24px",borderRadius:8,fontSize:13,fontWeight:700,textDecoration:"none"}}>Visit Website ↗</a>
        </div>
      </div>
      <div style={{background:"#fff",borderRadius:12,padding:"24px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",gridColumn:"1/-1"}}>
        <SH>App Information</SH>
        {[["App Name","OGB App"],["Version","2.7.8"],["Organisation","LYSBF · CYEP"],["Region","Eastern Region, Ghana"],["Contact","info@lysbfoundation.com"],["Phone","+233 050 026 4315"]].map(([l,v])=>(<div key={l} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${T.greyL}`}}><span style={{fontSize:12,color:T.grey,fontWeight:700}}>{l}</span><span style={{fontSize:12,color:T.navy}}>{v}</span></div>))}
      </div>
    </div>
  </div>);
}

const VISIT_TYPES=[{key:"Call",icon:"📞"},{key:"Home Visit",icon:"🏠"},{key:"School Visit",icon:"🏫"},{key:"Work Visit",icon:"💼"},{key:"Hospital Visit",icon:"🏥"},{key:"Community Visit",icon:"🤝"},{key:"Other",icon:"📝"}];

function PostModal({ben,user,onSave,onClose}){
  const [text,setText]=useState("");
  const [visitDate,setVisitDate]=useState(today());
  const [visitTypes,setVisitTypes]=useState([]);
  const [otherType,setOtherType]=useState("");
  const [busy,setBusy]=useState(false);

  function toggleType(key){
    setVisitTypes(prev=>prev.includes(key)?prev.filter(k=>k!==key):[...prev,key]);
  }

  const finalTypes=visitTypes.map(k=>k==="Other"?(otherType.trim()||"Other"):k);
  const finalType=finalTypes.join(", ");
  const canSave=text.trim()&&visitTypes.length>0;

  async function save(){
    if(!canSave)return;
    setBusy(true);
    await onSave(ben,text,user,visitDate||today(),finalType);
    setBusy(false);
  }

  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
    <div style={{background:"#fff",borderRadius:16,padding:"28px 32px",width:"100%",maxWidth:560,boxShadow:"0 20px 60px rgba(0,0,0,0.3)",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:T.navy,marginBottom:4}}>Add Follow-Up Note</div>
      <div style={{fontSize:12,color:T.grey,marginBottom:20}}>{ben.name}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
        <div>
          <Lbl c="Date of Visit *"/>
          <input type="date" value={visitDate} onChange={e=>setVisitDate(e.target.value)} style={{width:"100%",border:`1px solid ${T.greyM}`,borderRadius:8,padding:"9px 12px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",color:T.navy}}/>
          <div style={{fontSize:11,color:T.grey,marginTop:4}}>Select the actual date of contact</div>
        </div>
        <div>
          <Lbl c="Officer"/>
          <input type="text" value={user.name} readOnly style={{width:"100%",border:`1px solid ${T.greyM}`,borderRadius:8,padding:"9px 12px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",color:T.grey,background:T.off}}/>
        </div>
      </div>
      <div style={{marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><Lbl c="Type of Follow-Up *"/><span style={{fontSize:11,color:T.grey,marginBottom:5}}>— select all that apply</span></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
          {VISIT_TYPES.map(v=>{const on=visitTypes.includes(v.key);return(<button key={v.key} onClick={()=>toggleType(v.key)} style={{padding:"10px 6px",borderRadius:8,border:`${on?"1.5px":"0.5px"} solid ${on?"#27AE60":T.greyM}`,cursor:"pointer",textAlign:"center",fontSize:11,fontFamily:"'Source Sans 3',sans-serif",background:on?"#EAFAF1":"#fff",color:on?"#1D6A3A":T.grey,fontWeight:on?700:400,transition:"all 0.15s",position:"relative"}}>
            {on&&<span style={{position:"absolute",top:4,right:6,fontSize:9,color:"#27AE60",fontWeight:700}}>✓</span>}
            <div style={{fontSize:18,marginBottom:4}}>{v.icon}</div>{v.key}
          </button>);})}
        </div>
        {visitTypes.includes("Other")&&<input value={otherType} onChange={e=>setOtherType(e.target.value)} placeholder="Please specify..." style={{width:"100%",border:`1px solid ${T.greyM}`,borderRadius:8,padding:"9px 12px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",color:T.navy,marginTop:8}}/>}
        {visitTypes.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:10}}>{finalTypes.map((t,i)=><span key={i} style={{background:"#EAFAF1",color:"#1D6A3A",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700}}>{VISIT_TYPES.find(v=>v.key===visitTypes[i])?.icon||"📝"} {t}</span>)}</div>}
        <div style={{fontSize:11,color:T.grey,marginTop:6}}>Tap again to deselect.</div>
      </div>
      <div style={{height:1,background:T.greyM,margin:"16px 0"}}/>
      <Lbl c="Follow-Up Notes *"/>
      <textarea spellCheck="true" lang="en" value={text} onChange={e=>setText(e.target.value)} placeholder="Describe the visit, observations, progress made, challenges noted, and next steps…" style={{width:"100%",border:`1px solid ${T.greyM}`,borderRadius:8,padding:"10px 14px",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",color:T.navy,minHeight:110,resize:"vertical",marginBottom:18,marginTop:6}}/>
      {!canSave&&<div style={{fontSize:12,color:"#E67E22",marginBottom:12}}>⚠️ Please select at least one visit type and add a note before saving.</div>}
      <div style={{display:"flex",gap:10}}>
        <Btn variant="primary" onClick={save} style={{opacity:busy?0.6:1}}>{busy?"Saving...":"Save Follow-Up"}</Btn>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
      </div>
    </div>
  </div>);
}

export default function App(){
  const [user,setUser]=useState(null);const [loading,setLoading]=useState(true);const [page,setPage]=useState("dashboard");
  const [bens,setBens]=useState([]);const [users,setUsers]=useState([]);
  const [viewBen,setView]=useState(null);const [editBen,setEdit]=useState(null);const [sirBen,setSir]=useState(null);const [plannerTarget,setPlannerTarget]=useState(null);
  const [postModal,setPost]=useState(null);const [logoUrl,setLogoUrl]=useState(null);const [dashFilter,setDashFilter]=useState({});
  const [sidebarOpen,setSidebarOpen]=useState(true);const [recovery,setRecovery]=useState(false);

  useEffect(()=>{
    if(!document.getElementById("ogb-css")){const el=document.createElement("style");el.id="ogb-css";el.textContent=CSS;document.head.appendChild(el);}
    // When a user opens a password-reset email link, Supabase signs them in
    // from the link and fires this event. We then show the ResetPassword
    // screen so they can choose their new password.
    const{data:{subscription}}=supabase.auth.onAuthStateChange((event)=>{if(event==="PASSWORD_RECOVERY")setRecovery(true);});
    return()=>{subscription.unsubscribe();};
  },[]);

  useEffect(()=>{
    async function restore(){
      try{
        const saved=sessionStorage.getItem("ogb_user");
        if(saved){
          const{data:{session}}=await supabase.auth.getSession();
          if(session)setUser(JSON.parse(saved));
          else{try{sessionStorage.removeItem("ogb_user");}catch(e){}}
        }
      }catch(e){}
      setLoading(false);
    }
    restore();
  },[]);

  useEffect(()=>{
    if(user)loadAppUsers().then(u=>setUsers(u));
    else setUsers([]);
  },[user]);

  useEffect(()=>{
    async function loadSettings(){
      try{
        const{data,error}=await supabase.from("settings").select("key,value");
        if(error||!data)return;
        const map={};data.forEach(r=>{if(r.key)map[r.key]=r.value;});
        const stored=map["logo_url"];
        if(stored&&stored.length>0){
          if(stored.startsWith("http")){
            // New format: public URL from the branding bucket — works on the
            // sign-in page too, which is the whole point.
            setLogoUrl(stored);
          }else if(user){
            // Legacy format: a path in the private photo bucket. Can only be
            // signed after login. Re-upload the logo in Settings once to
            // migrate to the public branding bucket.
            const{data:signData}=await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(stored,SIGNED_URL_TTL);
            if(signData?.signedUrl)setLogoUrl(signData.signedUrl);
          }
        }
      }catch(e){console.log("Settings load error:",e);}
    }
    loadSettings();
  },[user]);

  useEffect(()=>{
    if(!user){setBens([]);return;}
    let cancelled=false;
    async function load(){
      try{
        const{data:benData,error}=await supabase.from("beneficiaries").select("*").order("name");
        if(error){console.log("Load error:",error);setLoading(false);return;}
        const{data:postData}=await supabase.from("posts").select("*").order("created_at");
        let bensWithPosts=(benData||[]).map(b=>({...b,posts:(postData||[]).filter(p=>p.beneficiary_id===b.id)}));
        bensWithPosts=await signPhotoUrls(bensWithPosts);
        if(!cancelled)setBens(bensWithPosts);
      }catch(e){console.log("Load error:",e);}
      if(!cancelled)setLoading(false);
    }
    load();
    return()=>{cancelled=true;};
  },[user]);

  const PAGE_PATHS={"dashboard":"/","ben-list":"/beneficiaries","ben-add":"/add","posts":"/posts","my-account":"/account","users":"/users","ben-mgmt":"/ben-mgmt","settings":"/settings","sir-list":"/sir"};
  const PATH_PAGES={"/":"dashboard","/beneficiaries":"ben-list","/add":"ben-add","/posts":"posts","/account":"my-account","/users":"users","/ben-mgmt":"ben-mgmt","/settings":"settings","/sir":"sir-list"};

  function pushPath(path){if(window.location.pathname!==path)window.history.pushState({path},"",path);}

  function nav(p,filter){
    setView(null);setEdit(null);setSir(null);
    if(filter!==undefined)setDashFilter(filter);
    else if(p!=="ben-list")setDashFilter({});
    setPage(p);
    pushPath(PAGE_PATHS[p]||"/");
  }

  function viewProfile(b){setView(b);setEdit(null);setSir(null);pushPath("/profile");}
  function viewEdit(b){setEdit(b);setView(null);setSir(null);pushPath("/add");}
  function viewSIR(b){setSir(b);setView(null);setEdit(null);pushPath("/sir");}

  useEffect(()=>{
    function handlePop(){
      const p=PATH_PAGES[window.location.pathname]||"dashboard";
      setView(null);setEdit(null);setSir(null);setDashFilter({});
      setPage(p);
    }
    window.addEventListener("popstate",handlePop);
    return()=>window.removeEventListener("popstate",handlePop);
  },[]);

  function handlePhotoUpdate(benId,photoUrl,photoPath){
    setBens(bs=>bs.map(b=>b.id===benId?{...b,photo_url:photoUrl,photo_path:photoPath}:b));
    if(viewBen&&viewBen.id===benId)setView(v=>({...v,photo_url:photoUrl,photo_path:photoPath}));
  }

  async function saveBen(f){
    const payload={bid:f.bid,name:f.name,age:Number(f.age)||null,gender:f.gender,dob:f.dob||null,nationality:f.nationality,tribe:f.tribe,religion:f.religion,region:f.region,district:f.district,city:f.city,area:f.area,physical_desc:f.physical_desc,address:f.address,community:f.community,occupation:f.occupation,employment:f.employment,education:f.education,component_id:Number(f.component_id),status:f.status,disability:f.disability,vuln_on_arrival:f.vuln_on_arrival,height:f.height,weight:f.weight,ghana_card:f.ghana_card,med_condition:f.med_condition,health:f.health,family:f.family,background:f.background,assigned_to:f.assigned_to||user.id,coordinator_id:f.coordinator_id||null,enroll_date:f.enroll_date||today()};
    try{
      if(editBen){
        const{data,error}=await supabase.from("beneficiaries").update(payload).eq("id",editBen.id).select().single();
        if(error){alert("Error: "+error.message);return;}
        if(data){
          const{data:posts}=await supabase.from("posts").select("*").eq("beneficiary_id",data.id);
          setBens(bs=>bs.map(b=>b.id===editBen.id?{...data,photo_url:editBen.photo_url,posts:posts||[]}:b));
          // Notify officer if reassigned
          if(payload.assigned_to&&payload.assigned_to!==editBen.assigned_to&&payload.assigned_to!==user.id){
            await createNotification(payload.assigned_to,"assignment",`Case assigned: ${data.name}`,`${user.name} has assigned ${data.name}'s case to you`,data.id,null);
          }
        }
      } else {
        const{data,error}=await supabase.from("beneficiaries").insert([payload]).select().single();
        if(error){alert("Error: "+error.message);return;}
        if(data){
          setBens(bs=>[...bs,{...data,posts:[]}]);
          // Notify officer of new assignment
          if(payload.assigned_to&&payload.assigned_to!==user.id){
            await createNotification(payload.assigned_to,"assignment",`New case: ${data.name}`,`${user.name} has assigned a new beneficiary to you: ${data.name}`,data.id,null);
          }
        }
      }
    }catch(e){alert("Connection error. Please try again.");}
    setEdit(null);nav("ben-list");
  }

  async function addPost(ben,text,author,visitDate,visitType){
    try{
      const followUpDate=visitDate||today();
      const{data}=await supabase.from("posts").insert([{beneficiary_id:ben.id,author:author.name,text,date:followUpDate,visit_date:followUpDate,visit_type:visitType||""}]).select().single();
      if(data){
        // Write last_follow_up back to beneficiaries table in Supabase
        await supabase.from("beneficiaries").update({last_follow_up:followUpDate}).eq("id",ben.id);
        // Update local state
        setBens(bs=>bs.map(b=>b.id===ben.id?{...b,posts:[...(b.posts||[]),data],last_follow_up:followUpDate}:b));
        if(viewBen?.id===ben.id)setView(v=>({...v,posts:[...(v.posts||[]),data],last_follow_up:followUpDate}));
        // Notify the coordinator of the assigned officer
        const officer=users.find(u=>u.id===ben.assigned_to);
        const coordId=officer?.coordinator_id||ben.coordinator_id;
        if(coordId&&coordId!==author.id){
          const coordUser=users.find(u=>u.id===coordId);
          if(coordUser){
            await createNotification(
              coordId,"follow_up",
              `New follow-up: ${ben.name}`,
              `${author.name} logged a ${visitType||"follow-up"} visit${ben.name?" for "+ben.name:""}`,
              ben.id,data.id
            );
          }
        }
      }
    }catch(e){console.log("Post error:",e);}
    setPost(null);
  }

  if(loading)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:T.off,flexDirection:"column",gap:16}}>
    <div className="spin" style={{width:44,height:44,border:`4px solid ${T.greyM}`,borderTopColor:"#27AE60",borderRadius:"50%"}}/>
    <div style={{color:T.grey,fontSize:14}}>Loading OGB App...</div>
  </div>);

  if(recovery)return <ResetPassword logoUrl={logoUrl} onDone={()=>{setRecovery(false);setUser(null);setBens([]);try{sessionStorage.removeItem("ogb_user");}catch(e){}window.history.replaceState({},"","/");}}/>;

  if(!user)return <Login onLogin={u=>{setUser(u);setPage("dashboard");try{sessionStorage.setItem("ogb_user",JSON.stringify(u));}catch(e){};}} users={users} logoUrl={logoUrl}/>;

  function navigateToBen(beneficiaryId, extra){
    if(extra?.type==="planner"){
      // Navigate to planner with the target officer pre-selected
      setPlannerTarget(extra.targetUserId||null);
      nav("planner");
      return;
    }
    const ben=bens.find(b=>b.id===beneficiaryId);
    if(ben){viewProfile(ben);}
  }

  function renderPage(){
    const tog=()=>setSidebarOpen(o=>!o);
    const navBen=(id,extra)=>navigateToBen(id,extra);
    if(sirBen)return <SIRView ben={sirBen} user={user} users={users} onBack={()=>{setSir(null);window.history.back();}} onToggle={tog} onNavigateToBen={navBen}/>;
    if(viewBen)return <Profile ben={viewBen} user={user} users={users} onBack={()=>{setView(null);window.history.back();}} onAddPost={b=>setPost(b)} onSIR={b=>viewSIR(b)} onPhotoUpdate={handlePhotoUpdate} onToggle={tog} onNavigateToBen={navBen}/>;
    const communitySuggestions=[...new Set(bens.map(b=>b.community).filter(Boolean))].sort();
    const districtSuggestions=[...new Set(bens.map(b=>b.district).filter(Boolean))].sort();
    const citySuggestions=[...new Set(bens.map(b=>b.city).filter(Boolean))].sort();
    if((editBen||page==="ben-add")&&user.role!=="Management")return <BenForm user={user} edit={editBen} users={users} onSave={saveBen} onCancel={()=>{setEdit(null);nav("ben-list");}} onToggle={tog} communitySuggestions={communitySuggestions} districtSuggestions={districtSuggestions} citySuggestions={citySuggestions}/>;
    if(page==="dashboard")return <Dashboard bens={bens} user={user} users={users} onNavigate={(p,filter)=>nav(p,filter||{})} onToggle={tog} onNavigateToBen={navBen}/>;
    if(page==="ben-list")return <BenList bens={bens} user={user} users={users} onView={b=>viewProfile(b)} onEdit={b=>viewEdit(b)} onSIR={b=>viewSIR(b)} initialFilter={dashFilter} onToggle={tog} onNavigateToBen={navBen}/>;
    if(page==="posts")return <PostsPage bens={bens} user={user} onToggle={tog} onNavigateToBen={navBen}/>;
    if(page==="my-account")return <MyAccount user={user} users={users} setUsers={setUsers} onToggle={tog} onNavigateToBen={navBen}/>;
    if(page==="my-officers"&&user.role==="Programme Coordinator")return <MyOfficers user={user} users={users} bens={bens} onNavigate={(p,filter)=>nav(p,filter||{})} onToggle={tog} onNavigateToBen={navBen}/>;
    if(page==="users"&&user.role==="Admin")return <UserMgmt users={users} setUsers={setUsers} user={user} bens={bens} onToggle={tog} onNavigateToBen={navBen}/>;
    if(page==="ben-mgmt"&&user.role==="Admin")return <BenMgmt bens={bens} setBens={setBens} user={user} onToggle={tog} onNavigateToBen={navBen}/>;
    if(page==="settings"&&(user.role==="Admin"||user.role==="Management"))return <Settings logoUrl={logoUrl} setLogoUrl={setLogoUrl} user={user} users={users} setUsers={setUsers} onToggle={tog} onNavigateToBen={navBen}/>;
    if(page==="org-structure"&&user.role==="Management")return <OrgStructure user={user} users={users} bens={bens} onToggle={tog} onNavigateToBen={navBen}/>;
    if(page==="staff-directory"&&user.role==="Management")return <StaffDirectory user={user} users={users} bens={bens} onToggle={tog} onNavigateToBen={navBen}/>;
    if(page==="planner")return <ActivityPlanner user={user} users={users} initialTarget={plannerTarget} onClearTarget={()=>setPlannerTarget(null)} onToggle={tog} onNavigateToBen={navBen}/>;
    return <Dashboard bens={bens} user={user} onNavigate={(p,filter)=>nav(p,filter||{})} onToggle={tog} onNavigateToBen={navBen}/>;
  }

  return(<div style={{fontFamily:"'Source Sans 3',sans-serif",minHeight:"100vh",background:T.off,display:"flex"}}>
    <Sidebar user={user} page={page} setPage={nav} onLogout={async()=>{await supabase.auth.signOut();setUser(null);setBens([]);try{sessionStorage.removeItem("ogb_user");}catch(e){}}} logoUrl={logoUrl} isOpen={sidebarOpen} onToggle={()=>setSidebarOpen(o=>!o)}/>
    <div className="print-main main-transition" style={{marginLeft:sidebarOpen?248:0,flex:1,minHeight:"100vh"}}>{renderPage()}</div>
    {postModal&&<PostModal ben={postModal} user={user} onSave={addPost} onClose={()=>setPost(null)}/>}
  </div>);
}
