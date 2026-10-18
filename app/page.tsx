"use client";

import { FormEvent, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

type Point = { x:number; y:number };
type DrawingSnapshot = { strokes:Point[][]; width:number; height:number; strokeColor:string; strokeWidth:number; backgroundColor:string };
type Report = { id:string; reason:string; reportedUserId:string; drawing:DrawingSnapshot|null };
const readableReason=(value:string)=>value.replaceAll("_"," ").replaceAll("-"," ").replace(/\b\w/g,l=>l.toUpperCase());

function readDrawing(value:unknown):DrawingSnapshot|null{
  if(!value||typeof value!=="object")return null;
  const snapshot=value as Record<string,unknown>;
  if(!Array.isArray(snapshot.pikStrokes))return null;
  const strokes=snapshot.pikStrokes.map(stroke=>{
    if(!stroke||typeof stroke!=="object"||!Array.isArray((stroke as Record<string,unknown>).points))return [];
    return ((stroke as Record<string,unknown>).points as unknown[]).flatMap(point=>{
      if(!point||typeof point!=="object")return [];
      const {x,y}=point as Record<string,unknown>;
      return typeof x==="number"&&typeof y==="number"?[{x,y}]:[];
    });
  }).filter(stroke=>stroke.length>0);
  if(!strokes.length)return null;
  const furthest=strokes.flat().reduce((size,point)=>({x:Math.max(size.x,point.x),y:Math.max(size.y,point.y)}),{x:1,y:1});
  return {
    strokes,
    width:typeof snapshot.canvasWidth==="number"&&snapshot.canvasWidth>0?snapshot.canvasWidth:typeof snapshot.pikCanvasWidth==="number"&&snapshot.pikCanvasWidth>0?snapshot.pikCanvasWidth:furthest.x,
    height:typeof snapshot.canvasHeight==="number"&&snapshot.canvasHeight>0?snapshot.canvasHeight:typeof snapshot.pikCanvasHeight==="number"&&snapshot.pikCanvasHeight>0?snapshot.pikCanvasHeight:furthest.y,
    strokeColor:typeof snapshot.strokeColor==="string"?snapshot.strokeColor:"#222222",
    strokeWidth:typeof snapshot.strokeWidth==="number"?snapshot.strokeWidth:2,
    backgroundColor:typeof snapshot.backgroundColor==="string"?snapshot.backgroundColor:"#F7F7F7",
  };
}

function DrawingPreview({drawing}:{drawing:DrawingSnapshot|null}){
  if(!drawing)return <span className="flag-preview-fallback" aria-label="Drawing preview unavailable">◷</span>;
  return <svg className="flag-preview" viewBox={`0 0 ${drawing.width} ${drawing.height}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Reported drawing" style={{backgroundColor:drawing.backgroundColor}}>{drawing.strokes.map((stroke,index)=><polyline key={index} points={stroke.map(point=>`${point.x},${point.y}`).join(" ")} fill="none" stroke={drawing.strokeColor} strokeWidth={drawing.strokeWidth} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>)}</svg>;
}

export default function Home(){
  const [user,setUser]=useState<User|null>(null),[ready,setReady]=useState(false),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState(""),[loggingIn,setLoggingIn]=useState(false),[reports,setReports]=useState<Report[]>([]),[loadingReports,setLoadingReports]=useState(false);

  useEffect(()=>onAuthStateChanged(auth,async current=>{if(!current){setUser(null);setReady(true);return}try{const admin=await getDoc(doc(db,"admins",current.uid));if(admin.exists()&&admin.data().role==="admin")setUser(current);else{await signOut(auth);setError("This account does not have admin access.")}}catch{await signOut(auth);setError("Could not verify admin access. Check Firestore rules.")}finally{setReady(true)}}),[]);
  useEffect(()=>{if(!user)return;setLoadingReports(true);const q=query(collection(db,"reports"),orderBy("createdAt","desc"));return onSnapshot(q,async snapshot=>{const latestDrawings=new Map<string,Promise<DrawingSnapshot|null>>();const items=await Promise.all(snapshot.docs.map(async item=>{const data=item.data();const reportedUserId=String(data.reportedUserId??"Unknown user");let drawing=readDrawing(data.contentSnapshot);if(!drawing&&reportedUserId!=="Unknown user"){if(!latestDrawings.has(reportedUserId))latestDrawings.set(reportedUserId,getDoc(doc(db,"nearby_presence",reportedUserId)).then(result=>result.exists()?readDrawing(result.data()):null).catch(()=>null));drawing=await latestDrawings.get(reportedUserId)!}return{id:item.id,reason:String(data.reason??"Community report"),reportedUserId,drawing}}));setReports(items);setLoadingReports(false)},()=>{setError("Could not load reports. Check Firestore rules.");setLoadingReports(false)})},[user]);

  async function login(event:FormEvent){event.preventDefault();setLoggingIn(true);setError("");try{const credential=await signInWithEmailAndPassword(auth,email.trim(),password);const admin=await getDoc(doc(db,"admins",credential.user.uid));if(!admin.exists()||admin.data().role!=="admin"){await signOut(auth);setError("This account does not have admin access.");return}setUser(credential.user)}catch{setError("Invalid email or password.")}finally{setLoggingIn(false)}}
  async function clearReport(report:Report){if(window.confirm("Clear this report?"))await deleteDoc(doc(db,"reports",report.id))}
  async function deleteReportedUser(report:Report){if(report.reportedUserId==="Unknown user"){setError("This report does not include a reported user ID.");return}if(!window.confirm(`Delete user ${report.reportedUserId} from Firestore?`))return;await deleteDoc(doc(db,"users",report.reportedUserId));await deleteDoc(doc(db,"reports",report.id))}

  if(!ready)return <main className="reference-login"><header className="reference-header"><span className="reference-logo">PikMe</span></header></main>;
  if(!user)return <main className="reference-login"><header className="reference-header"><span className="reference-logo">PikMe</span></header><section className="reference-login-content"><div className="reference-form-wrap"><h1>Log in to PikMe</h1><form onSubmit={login}><label><span>EMAIL</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required/></label><label><span>PASSWORD</span><input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required/></label>{error&&<p className="login-error" role="alert">{error}</p>}<button type="submit" disabled={loggingIn}>{loggingIn?"Logging in...":"Log in"}</button></form></div></section></main>;

  return <main className="flag-page"><div className="flag-page-label">Flag Reports</div><section className="flag-shell"><header className="flag-brand"><span>PikMe</span><button onClick={()=>signOut(auth)}>Log out</button></header><div className="flag-title">Flag reports</div><div className="flag-card"><h1>Flags</h1>{error&&<p className="flag-error">{error}</p>}{loadingReports&&<p className="flag-message">Loading reports...</p>}{!loadingReports&&!reports.length&&<p className="flag-message">No pending reports.</p>}<div className="flag-list">{reports.map(report=><article className="flag-row" key={report.id}><div className="flag-description"><DrawingPreview drawing={report.drawing}/><span>{readableReason(report.reason)} - User #{report.reportedUserId}</span></div><div className="flag-actions"><button className="clear-action" onClick={()=>clearReport(report)}>Clear</button><button className="delete-action" onClick={()=>deleteReportedUser(report)}>Delete account</button></div></article>)}</div></div></section></main>;
}
