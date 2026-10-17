"use client";

import { FormEvent, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

type Report = { id:string; reason:string; reportedUserId:string };
const readableReason=(value:string)=>value.replaceAll("_"," ").replaceAll("-"," ").replace(/\b\w/g,l=>l.toUpperCase());

export default function Home(){
  const [user,setUser]=useState<User|null>(null),[ready,setReady]=useState(false),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState(""),[loggingIn,setLoggingIn]=useState(false),[reports,setReports]=useState<Report[]>([]),[loadingReports,setLoadingReports]=useState(false);

  useEffect(()=>onAuthStateChanged(auth,async current=>{if(!current){setUser(null);setReady(true);return}try{const admin=await getDoc(doc(db,"admins",current.uid));if(admin.exists()&&admin.data().role==="admin")setUser(current);else{await signOut(auth);setError("This account does not have admin access.")}}catch{await signOut(auth);setError("Could not verify admin access. Check Firestore rules.")}finally{setReady(true)}}),[]);
  useEffect(()=>{if(!user)return;setLoadingReports(true);const q=query(collection(db,"reports"),orderBy("createdAt","desc"));return onSnapshot(q,snapshot=>{setReports(snapshot.docs.map(item=>{const data=item.data();return{id:item.id,reason:String(data.reason??"Community report"),reportedUserId:String(data.reportedUserId??"Unknown user")}}));setLoadingReports(false)},()=>{setError("Could not load reports. Check Firestore rules.");setLoadingReports(false)})},[user]);

  async function login(event:FormEvent){event.preventDefault();setLoggingIn(true);setError("");try{const credential=await signInWithEmailAndPassword(auth,email.trim(),password);const admin=await getDoc(doc(db,"admins",credential.user.uid));if(!admin.exists()||admin.data().role!=="admin"){await signOut(auth);setError("This account does not have admin access.");return}setUser(credential.user)}catch{setError("Invalid email or password.")}finally{setLoggingIn(false)}}
  async function clearReport(report:Report){if(window.confirm("Clear this report?"))await deleteDoc(doc(db,"reports",report.id))}
  async function deleteReportedUser(report:Report){if(report.reportedUserId==="Unknown user"){setError("This report does not include a reported user ID.");return}if(!window.confirm(`Delete user ${report.reportedUserId} from Firestore?`))return;await deleteDoc(doc(db,"users",report.reportedUserId));await deleteDoc(doc(db,"reports",report.id))}

  if(!ready)return <main className="reference-login"><header className="reference-header"><span className="reference-logo">PikMe</span></header></main>;
  if(!user)return <main className="reference-login"><header className="reference-header"><span className="reference-logo">PikMe</span></header><section className="reference-login-content"><div className="reference-form-wrap"><h1>Log in to PikMe</h1><form onSubmit={login}><label><span>EMAIL</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required/></label><label><span>PASSWORD</span><input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required/></label>{error&&<p className="login-error" role="alert">{error}</p>}<button type="submit" disabled={loggingIn}>{loggingIn?"Logging in...":"Log in"}</button></form></div></section></main>;

  return <main className="flag-page"><div className="flag-page-label">Flag Reports</div><section className="flag-shell"><header className="flag-brand"><span>PikMe</span><button onClick={()=>signOut(auth)}>Log out</button></header><div className="flag-title">Flag reports</div><div className="flag-card"><h1>Flags</h1>{error&&<p className="flag-error">{error}</p>}{loadingReports&&<p className="flag-message">Loading reports...</p>}{!loadingReports&&!reports.length&&<p className="flag-message">No pending reports.</p>}<div className="flag-list">{reports.map(report=><article className="flag-row" key={report.id}><div className="flag-description"><span className="flag-clock">◷</span><span>{readableReason(report.reason)} - User #{report.reportedUserId}</span></div><div className="flag-actions"><button className="clear-action" onClick={()=>clearReport(report)}>Clear</button><button className="delete-action" onClick={()=>deleteReportedUser(report)}>Delete account</button></div></article>)}</div></div></section></main>;
}
