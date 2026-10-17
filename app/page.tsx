"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Priority = "high" | "medium" | "low";
type Report = { id:string; reason:string; key:string; user:string; uid:string; priority:Priority; time:string; mins:number; initials:string; color:string; note:string };

const seedReports: Report[] = [
  {id:"R-1084",reason:"Inappropriate drawing",key:"inappropriate",user:"Maya Fernando",uid:"User #84",priority:"high",time:"3 min ago",mins:3,initials:"MF",color:"#dfe4ff",note:"A drawing submitted in a public room may violate the community content guidelines."},
  {id:"R-1083",reason:"Harassment or bullying",key:"harassment",user:"Ravi Silva",uid:"User #38",priority:"high",time:"8 min ago",mins:8,initials:"RS",color:"#ffe0e7",note:"Repeated messages were reported as targeted harassment by another community member."},
  {id:"R-1082",reason:"Unwanted attention",key:"unwanted",user:"Emma Perera",uid:"User #85",priority:"medium",time:"19 min ago",mins:19,initials:"EP",color:"#e2f5ed",note:"The reporter received several unwanted requests after declining to connect."},
  {id:"R-1081",reason:"Hate or discrimination",key:"hate",user:"Noah Jay",uid:"User #90",priority:"high",time:"27 min ago",mins:27,initials:"NJ",color:"#fff0cc",note:"Content may include discriminatory language directed at a protected group."},
  {id:"R-1080",reason:"Threats or violence",key:"threats",user:"Asha Bandara",uid:"User #48",priority:"high",time:"41 min ago",mins:41,initials:"AB",color:"#ece1ff",note:"A direct message was reported for language that may imply a threat."},
  {id:"R-1079",reason:"Spam or misleading",key:"spam",user:"Liam Deen",uid:"User #17",priority:"low",time:"1 hr ago",mins:60,initials:"LD",color:"#dff5fb",note:"Multiple community members reported repeated promotional messages."},
  {id:"R-1078",reason:"Harassment or bullying",key:"harassment",user:"Sena Wijesinghe",uid:"User #61",priority:"medium",time:"2 hrs ago",mins:120,initials:"SW",color:"#ffe8dc",note:"The user may have posted comments intended to intimidate another member."},
  {id:"R-1077",reason:"Inappropriate content",key:"inappropriate",user:"Dilan Cruz",uid:"User #29",priority:"low",time:"3 hrs ago",mins:180,initials:"DC",color:"#e4edff",note:"A profile image was flagged for possible guideline violations."}
];

function Logo({light=false}:{light?:boolean}) { return <span className={`logo ${light?"light":""}`}>Pik<span>Me</span><i /></span> }

export default function Home() {
  const [loggedIn,setLoggedIn]=useState(false), [mobileNav,setMobileNav]=useState(false);
  const [reports,setReports]=useState(seedReports), [resolved,setResolved]=useState(24), [tab,setTab]=useState("all"), [query,setQuery]=useState(""), [reason,setReason]=useState("all"), [sort,setSort]=useState("newest"), [filters,setFilters]=useState(false), [selected,setSelected]=useState<Report|null>(null), [toast,setToast]=useState("");
  useEffect(()=>{ setLoggedIn(sessionStorage.getItem("pikme-reference-session")==="active") },[]);
  const notify=(message:string)=>{setToast(message);window.setTimeout(()=>setToast(""),2400)};
  const filtered=useMemo(()=>reports.filter(r=>(tab==="all"||(tab==="high"&&r.priority==="high")||(tab==="new"&&r.mins<30))&&(reason==="all"||r.key===reason)&&`${r.reason} ${r.user} ${r.uid} ${r.id}`.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>sort==="oldest"?b.mins-a.mins:sort==="priority"?({high:0,medium:1,low:2}[a.priority]-{high:0,medium:1,low:2}[b.priority]):a.mins-b.mins),[reports,tab,query,reason,sort]);
  const login=(e:FormEvent)=>{e.preventDefault();sessionStorage.setItem("pikme-reference-session","active");setLoggedIn(true)};
  const logout=()=>{sessionStorage.removeItem("pikme-reference-session");setLoggedIn(false)};
  const resolve=(kind:"clear"|"delete")=>{if(!selected)return;if(kind==="delete"&&!window.confirm(`Delete ${selected.user}'s account? This action cannot be undone.`))return;setReports(v=>v.filter(r=>r.id!==selected.id));setResolved(v=>v+1);setSelected(null);notify(kind==="delete"?"Account removed and report resolved":"Report cleared successfully")};
  const exportCsv=()=>{const csv=["Case,Reason,User,User ID,Priority,Received",...filtered.map(r=>[r.id,r.reason,r.user,r.uid,r.priority,r.time].map(x=>`"${x}"`).join(","))].join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="pikme-flag-reports.csv";a.click();URL.revokeObjectURL(a.href);notify("Report exported as CSV")};

  if(!loggedIn) return <main className="reference-login">
    <header className="reference-header"><span className="reference-logo">PikMe</span></header>
    <section className="reference-login-content">
      <div className="reference-form-wrap">
        <h1>Log in to PikMe</h1>
        <form onSubmit={login}>
          <label><span>EMAIL</span><input type="email" aria-label="Email" required /></label>
          <label><span>PASSWORD</span><input type="password" aria-label="Password" required /></label>
          <button type="submit">Log in</button>
        </form>
      </div>
    </section>
  </main>;

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav?"open":""}`}><div className="side-head"><Logo light/><button className="mobile-close" onClick={()=>setMobileNav(false)}>×</button></div><nav><p>WORKSPACE</p>{[["⌂","Overview"],["⚑","Flag reports"],["♙","Users"],["⌁","Analytics"]].map(([icon,name])=><button key={name} className={name==="Flag reports"?"active":""} onClick={()=>name!=="Flag reports"&&notify(`${name} is ready for the next data module`)}><span>{icon}</span>{name}{name==="Flag reports"&&<b>{reports.length}</b>}</button>)}<p>ACCOUNT</p><button onClick={()=>notify("Settings is ready for the next data module")}><span>⚙</span>Settings</button></nav><footer><span className="avatar">NK</span><div><strong>Nimal Kariyawasam</strong><small>Administrator</small></div><button onClick={logout}>↗</button></footer></aside>
    <div className="main-wrap"><header className="topbar"><button className="menu" onClick={()=>setMobileNav(true)}>☰</button><div className="crumb">PikMe <span>/</span> <b>Flag reports</b></div><div className="top-actions"><button className="notification">♢<i/></button><span>{new Intl.DateTimeFormat("en",{weekday:"short",day:"numeric",month:"short"}).format(new Date())}</span></div></header>
      <main className="content"><section className="page-intro"><div><p className="eyebrow ink">TRUST &amp; SAFETY</p><h1>Flag reports</h1><p>Review community reports and keep PikMe safe.</p></div><button className="primary" onClick={exportCsv}>↓ Export report</button></section>
        <section className="stats"><article><span className="stat-icon urgent">!</span><div><small>NEEDS REVIEW</small><strong>{reports.length}</strong><p><b>+3</b> since yesterday</p></div></article><article><span className="stat-icon resolved">✓</span><div><small>RESOLVED TODAY</small><strong>{resolved}</strong><p><b>18%</b> faster this week</p></div></article><article><span className="stat-icon time">◷</span><div><small>AVG. RESPONSE</small><strong>12m</strong><p>Target under 15m</p></div></article></section>
        <section className="reports-card"><div className="toolbar"><div className="tabs">{[["all",`All ${reports.length}`],["high","High priority"],["new","New"]].map(([key,label])=><button key={key} className={tab===key?"active":""} onClick={()=>setTab(key)}>{label}</button>)}</div><div className="tools"><label className="search">⌕<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search reports or users"/></label><button className="filter-btn" onClick={()=>setFilters(v=>!v)}>≡ Filters {reason!=="all"&&<i/>}</button></div></div>
          {filters&&<div className="filter-panel"><label>REASON<select value={reason} onChange={e=>setReason(e.target.value)}><option value="all">All reasons</option><option value="harassment">Harassment</option><option value="inappropriate">Inappropriate content</option><option value="hate">Hate or discrimination</option><option value="threats">Threats or violence</option><option value="unwanted">Unwanted attention</option></select></label><label>SORT BY<select value={sort} onChange={e=>setSort(e.target.value)}><option value="newest">Newest first</option><option value="priority">Priority</option><option value="oldest">Oldest first</option></select></label><button onClick={()=>{setReason("all");setSort("newest");setQuery("")}}>Reset</button></div>}
          <div className="table-wrap"><table><thead><tr><th>REPORT</th><th>REPORTED USER</th><th>PRIORITY</th><th>RECEIVED</th><th/></tr></thead><tbody>{filtered.map(r=><tr key={r.id} onClick={()=>setSelected(r)}><td><div className="report-main"><span className="report-icon">⚑</span><div><strong>{r.reason}</strong><small>{r.id} · Community report</small></div></div></td><td><div className="user"><span style={{background:r.color}}>{r.initials}</span><div><strong>{r.user}</strong><small>{r.uid}</small></div></div></td><td><span className={`priority ${r.priority}`}>{r.priority}</span></td><td className="received">{r.time}</td><td><button className="review">Review →</button></td></tr>)}</tbody></table></div>
          {!filtered.length&&<div className="empty"><span>✓</span><h3>All clear</h3><p>No reports match your filters.</p></div>}<footer className="table-footer"><p>Showing <b>{filtered.length}</b> of <b>{reports.length}</b> reports</p><div><button disabled>←</button><button className="page-active">1</button><button disabled>→</button></div></footer>
        </section></main></div>
    {selected&&<div className="backdrop" onMouseDown={e=>e.target===e.currentTarget&&setSelected(null)}><section className="modal" role="dialog" aria-modal="true"><button className="modal-close" onClick={()=>setSelected(null)}>×</button><div className="modal-icon">⚑</div><p className="eyebrow ink">REPORT DETAILS</p><h2>{selected.reason}</h2><p>{selected.note}</p><dl><div><dt>REPORTED USER</dt><dd>{selected.user}</dd></div><div><dt>USER ID</dt><dd>{selected.uid}</dd></div><div><dt>CASE NUMBER</dt><dd>{selected.id}</dd></div><div><dt>PRIORITY</dt><dd>{selected.priority.toUpperCase()}</dd></div></dl><div className="modal-actions"><button onClick={()=>resolve("clear")}>Clear report</button><button className="danger" onClick={()=>resolve("delete")}>Delete account</button></div></section></div>}
    <div className={`toast ${toast?"show":""}`}>{toast}</div>
  </div>;
}
