"use client";

import { FormEvent, useMemo, useState } from "react";
import type { Locale } from "../../../modules/i18n";
import type { ServicePriceReference } from "../../../modules/technical-service/pricing";
import type { TradeInCatalogDevice } from "../../../modules/trade-in/catalog";

type Estimate={min:number;max:number}|null;
type Option={value:string;tr:string;en:string;code?:string};
type Question={key:string;tr:string;en:string;options:Option[]};

const Q:Record<string,Question>={
 power:{key:"power",tr:"Cihaz açılıyor mu?",en:"Does the device power on?",options:[{value:"ok",tr:"Evet",en:"Yes"},{value:"no_power",tr:"Hayır",en:"No",code:"no_power"}]},
 screen:{key:"screen",tr:"Ekran / görüntü / dokunmatik sorunu var mı?",en:"Any screen / display / touch issue?",options:[{value:"ok",tr:"Sorun yok",en:"No issue"},{value:"screen",tr:"Sorun var",en:"There is an issue",code:"screen"}]},
 rear:{key:"rear",tr:"Arka cam veya kapak hasarlı mı?",en:"Rear glass or cover damaged?",options:[{value:"ok",tr:"Hayır",en:"No"},{value:"rear_glass",tr:"Evet",en:"Yes",code:"rear_glass"}]},
 battery:{key:"battery",tr:"Batarya sorunu var mı?",en:"Any battery issue?",options:[{value:"ok",tr:"Sorun yok",en:"No issue"},{value:"battery",tr:"Değişim / servis gerekiyor",en:"Needs service / replacement",code:"battery"}]},
 charging:{key:"charging",tr:"Şarj sorunu var mı?",en:"Any charging issue?",options:[{value:"ok",tr:"Sorun yok",en:"No issue"},{value:"charging_port",tr:"Kablolu şarj / soket",en:"Wired charging / port",code:"charging_port"},{value:"wireless_charging",tr:"Kablosuz şarj",en:"Wireless charging",code:"wireless_charging"}]},
 camera:{key:"camera",tr:"Kamera sorunu var mı?",en:"Any camera issue?",options:[{value:"ok",tr:"Sorun yok",en:"No issue"},{value:"camera_lens",tr:"Lens camı",en:"Camera lens",code:"camera_lens"},{value:"front_camera",tr:"Ön kamera",en:"Front camera",code:"front_camera"},{value:"rear_camera",tr:"Arka kamera",en:"Rear camera",code:"rear_camera"}]},
 biometric:{key:"biometric",tr:"Biyometrik güvenlik çalışıyor mu?",en:"Does biometric security work?",options:[{value:"ok",tr:"Sorun yok / cihazda yok",en:"No issue / unavailable"},{value:"face_id",tr:"Yüz tanıma / Face ID",en:"Face recognition / Face ID",code:"face_id"},{value:"fingerprint",tr:"Parmak izi",en:"Fingerprint",code:"fingerprint"}]},
 audio:{key:"audio",tr:"Ses sorunu var mı?",en:"Any audio issue?",options:[{value:"ok",tr:"Sorun yok",en:"No issue"},{value:"speaker",tr:"Hoparlör",en:"Speaker",code:"speaker"},{value:"earpiece",tr:"Ahize",en:"Earpiece",code:"earpiece"},{value:"microphone",tr:"Mikrofon",en:"Microphone",code:"microphone"}]},
 buttons:{key:"buttons",tr:"Tuş / titreşim sorunu var mı?",en:"Any button / vibration issue?",options:[{value:"ok",tr:"Sorun yok",en:"No issue"},{value:"power_button",tr:"Güç tuşu",en:"Power button",code:"power_button"},{value:"volume_buttons",tr:"Ses tuşları",en:"Volume buttons",code:"volume_buttons"},{value:"vibration",tr:"Titreşim",en:"Vibration",code:"vibration"}]},
 network:{key:"network",tr:"Bağlantı sorunu var mı?",en:"Any connectivity issue?",options:[{value:"ok",tr:"Sorun yok",en:"No issue"},{value:"wireless",tr:"Wi-Fi / Bluetooth",en:"Wi-Fi / Bluetooth",code:"wireless"},{value:"cellular",tr:"Şebeke / SIM",en:"Cellular / SIM",code:"cellular"}]},
 sensor:{key:"sensor",tr:"Sensör sorunu var mı?",en:"Any sensor issue?",options:[{value:"ok",tr:"Sorun yok",en:"No issue"},{value:"proximity_sensor",tr:"Yakınlık / ışık",en:"Proximity / light",code:"proximity_sensor"},{value:"sensors",tr:"Diğer sensör",en:"Other sensor",code:"sensors"}]},
 liquid:{key:"liquid",tr:"Sıvı teması oldu mu?",en:"Any liquid contact?",options:[{value:"ok",tr:"Hayır",en:"No"},{value:"liquid_cleaning",tr:"Evet / oksit şüphesi",en:"Yes / oxidation suspected",code:"liquid_cleaning"}]},
 system:{key:"system",tr:"Sistem / anakart sorunu var mı?",en:"Any system / motherboard issue?",options:[{value:"ok",tr:"Hayır",en:"No"},{value:"motherboard",tr:"Anakart",en:"Motherboard",code:"motherboard"},{value:"software",tr:"Yazılım / sistem",en:"Software / system",code:"software"}]},
 data:{key:"data",tr:"Veri aktarımı / yedekleme istiyor musun?",en:"Need data transfer / backup?",options:[{value:"ok",tr:"Hayır",en:"No"},{value:"data_transfer",tr:"Evet",en:"Yes",code:"data_transfer"}]},
};

function questionsFor(type:string){
 if(type==="Kulaklık")return [Q.power,Q.battery,Q.charging,Q.audio,Q.buttons,Q.network,Q.liquid,Q.system];
 if(type==="Akıllı Saat")return [Q.power,Q.screen,Q.battery,Q.charging,Q.buttons,Q.network,Q.sensor,Q.liquid,Q.system];
 if(type==="Laptop / Bilgisayar")return [Q.power,Q.screen,Q.battery,Q.charging,Q.camera,Q.audio,Q.buttons,Q.network,Q.liquid,Q.system,Q.data];
 if(type==="Tablet")return [Q.power,Q.screen,Q.rear,Q.battery,Q.charging,Q.camera,Q.biometric,Q.audio,Q.buttons,Q.network,Q.sensor,Q.liquid,Q.system,Q.data];
 return [Q.power,Q.screen,Q.rear,Q.battery,Q.charging,Q.camera,Q.biometric,Q.audio,Q.buttons,Q.network,Q.sensor,Q.liquid,Q.system,Q.data];
}

export function ServiceOfferForm({whatsappNumber,prices,devices,locale}:{whatsappNumber:string;prices:ServicePriceReference[];devices:TradeInCatalogDevice[];locale:Locale}){
 const en=locale==="en";const[step,setStep]=useState(1);const[estimate,setEstimate]=useState<Estimate>(null);const[loading,setLoading]=useState(false);const[error,setError]=useState("");
 const[data,setData]=useState({deviceType:"",brand:"",model:"",storage:"",color:"",name:"",phone:"",detail:"",repairHistory:"",note:""});
 const[answers,setAnswers]=useState<Record<string,string>>({});
 const deviceTypes=useMemo(()=>Array.from(new Set(devices.map(x=>x.device_type))),[devices]);
 const brands=useMemo(()=>Array.from(new Set(devices.filter(x=>x.device_type===data.deviceType).map(x=>x.brand))),[devices,data.deviceType]);
 const models=useMemo(()=>Array.from(new Set(devices.filter(x=>x.device_type===data.deviceType&&x.brand===data.brand).map(x=>x.model))),[devices,data.deviceType,data.brand]);
 const variants=useMemo(()=>devices.filter(x=>x.device_type===data.deviceType&&x.brand===data.brand&&x.model===data.model),[devices,data.deviceType,data.brand,data.model]);
 const storages=useMemo(()=>Array.from(new Set(variants.map(x=>x.storage||"Standart"))),[variants]);
 const colors=useMemo(()=>Array.from(new Set(variants.filter(x=>(x.storage||"Standart")===data.storage).map(x=>x.color||"Standart"))),[variants,data.storage]);
 const selectedQuestions=useMemo(()=>questionsFor(data.deviceType),[data.deviceType]);
 const availableFaults=useMemo(()=>prices.filter(x=>x.device_type===data.deviceType),[prices,data.deviceType]);
 const availableCodes=useMemo(()=>new Set(availableFaults.map(x=>x.fault_code)),[availableFaults]);
 const faults=useMemo(()=>Array.from(new Set(selectedQuestions.flatMap(q=>{const selected=q.options.find(o=>o.value===answers[q.key]);return selected?.code&&availableCodes.has(selected.code)?[selected.code]:[]}))),[answers,availableCodes,selectedQuestions]);
 const completed=selectedQuestions.every(q=>Boolean(answers[q.key]));
 function resetEstimate(){setEstimate(null);setError("")}
 function change(next:Partial<typeof data>){setData(x=>({...x,...next}));resetEstimate()}
 function money(v:number){return `${Math.round(v).toLocaleString(en?"en-US":"tr-TR")} ₺`}
 async function calculate(){setLoading(true);setError("");try{const r=await fetch("/api/technical-service/estimate",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({deviceType:data.deviceType,brand:data.brand,model:data.model,storage:data.storage==="Standart"?"":data.storage,color:data.color==="Standart"?"":data.color,faultCodes:faults})});const j=await r.json();if(!r.ok)throw new Error(j.error||(en?"Price could not be calculated.":"Fiyat hesaplanamadı."));setEstimate(j)}catch(e){setEstimate(null);setError(e instanceof Error?e.message:"Fiyat hesaplanamadı.")}finally{setLoading(false)}}
 async function next(){if(step===1){if(!data.deviceType||!data.brand||!data.model||!data.storage||!data.color)return;setStep(2);return}if(step===2){if(!completed||!faults.length)return;await calculate();setStep(3)}}
 function submit(e:FormEvent){e.preventDefault();if(!data.name||!data.phone||!whatsappNumber)return;const labels=faults.map(code=>availableFaults.find(x=>x.fault_code===code)?.fault_label??code);const msg=["Merhaba Trove Teknoloji, teknik servis için detaylı teklif almak istiyorum.",estimate?`Tahmini servis aralığı: ${money(estimate.min)} - ${money(estimate.max)}`:"Tahmini fiyat mağazada kontrol edilecek.","",`Cihaz: ${data.deviceType} / ${data.brand} / ${data.model}`,`Depolama: ${data.storage}`,`Renk: ${data.color}`,"Tespit edilen servis ihtiyaçları:",...labels.map(x=>`• ${x}`),data.detail?`Belirti / şikayet: ${data.detail}`:"",data.repairHistory?`Önceki işlem: ${data.repairHistory}`:"",data.note?`Not: ${data.note}`:"","",`Ad Soyad: ${data.name}`,`Telefon: ${data.phone}`].filter(Boolean).join("\n");window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`,"_blank","noopener,noreferrer")}
 if(!devices.length)return <div className="tradeUnavailable"><strong>{en?"Service pricing variants are being prepared.":"Teknik servis fiyat varyantları hazırlanıyor."}</strong></div>;
 return <form className="tradeForm serviceOfferForm" onSubmit={submit}>
  <div className="tradeProgress"><div className="tradeProgressBar"><span style={{width:`${step/3*100}%`}}/></div><div className="tradeSteps"><button type="button" className={step===1?"active":""} onClick={()=>setStep(1)}>1 <span>{en?"Device":"Cihaz"}</span></button><button type="button" className={step===2?"active":""} onClick={()=>step>1&&setStep(2)}>2 <span>{en?"Check":"Kontrol"}</span></button><button type="button" className={step===3?"active":""} onClick={()=>step>2&&setStep(3)}>3 <span>{en?"Quote":"Teklif"}</span></button></div></div>
  {step===1?<section className="tradeStep"><div><span className="tradeEyebrow">1 / 3</span><h2>{en?"Exact Device Variant":"Cihaz Varyantı"}</h2><p>{en?"Storage and color are priced independently.":"Depolama ve renk ayrı fiyatlandırılır."}</p></div><div className="tradeGrid">
   <label>{en?"Device type":"Cihaz türü"}<select value={data.deviceType} onChange={e=>{change({deviceType:e.target.value,brand:"",model:"",storage:"",color:""});setAnswers({})}}><option value="">Seç</option>{deviceTypes.map(x=><option key={x}>{x}</option>)}</select></label>
   <label>Marka<select disabled={!data.deviceType} value={data.brand} onChange={e=>{change({brand:e.target.value,model:"",storage:"",color:""});setAnswers({})}}><option value="">Seç</option>{brands.map(x=><option key={x}>{x}</option>)}</select></label>
   <label>Model<select disabled={!data.brand} value={data.model} onChange={e=>{change({model:e.target.value,storage:"",color:""});setAnswers({})}}><option value="">Seç</option>{models.map(x=><option key={x}>{x}</option>)}</select></label>
   <label>{en?"Storage":"Depolama"}<select disabled={!data.model} value={data.storage} onChange={e=>change({storage:e.target.value,color:""})}><option value="">Seç</option>{storages.map(x=><option key={x}>{x}</option>)}</select></label>
   <label>{en?"Color":"Renk"}<select disabled={!data.storage} value={data.color} onChange={e=>change({color:e.target.value})}><option value="">Seç</option>{colors.map(x=><option key={x}>{x}</option>)}</select></label>
  </div><button className="tradePrimary" type="button" disabled={!data.deviceType||!data.brand||!data.model||!data.storage||!data.color} onClick={next}>{en?"Continue →":"Devam Et →"}</button></section>:null}
  {step===2?<section className="tradeStep"><div><span className="tradeEyebrow">2 / 3</span><h2>{en?"Device Check":"Cihaz Kontrolü"}</h2></div><div className="serviceQuestionList">{selectedQuestions.map(q=><label className="serviceQuestion" key={q.key}><span>{en?q.en:q.tr}</span><select value={answers[q.key]??""} onChange={e=>{setAnswers(x=>({...x,[q.key]:e.target.value}));resetEstimate()}}><option value="">Seç</option>{q.options.filter(o=>!o.code||availableCodes.has(o.code)).map(o=><option key={o.value} value={o.value}>{en?o.en:o.tr}</option>)}</select></label>)}</div><div className="tradeGrid"><label className="wide">{en?"Symptom / complaint":"Belirti / şikayet"}<textarea value={data.detail} onChange={e=>change({detail:e.target.value})}/></label><label className="wide">{en?"Previous repair":"Daha önce işlem gördü mü?"}<textarea value={data.repairHistory} onChange={e=>change({repairHistory:e.target.value})}/></label><label className="wide">{en?"Note":"Ek not"}<textarea value={data.note} onChange={e=>change({note:e.target.value})}/></label></div><div className="tradeActions"><button type="button" onClick={()=>setStep(1)}>← {en?"Back":"Geri"}</button><button className="tradePrimary" type="button" disabled={!completed||!faults.length||loading} onClick={next}>{loading?(en?"Calculating...":"Hesaplanıyor..."):(en?"View estimate →":"Tahmini Fiyatı Gör →")}</button></div></section>:null}
  {step===3?<section className="tradeStep"><div><span className="tradeEyebrow">3 / 3</span><h2>{en?"Estimated Service Price":"Tahmini Servis Fiyatı"}</h2></div>{estimate?<div className="tradeEstimate"><div><span>{en?"Estimated range":"Tahmini servis aralığı"}</span><strong>{money(estimate.min)} – {money(estimate.max)}</strong><small>{data.storage} · {data.color}</small></div></div>:<div className="tradeEstimate tradeEstimateUnavailable"><div><strong>{en?"Inspection required":"Kontrol gerekli"}</strong><small>{error||"Bu varyant için fiyat oluşturulamadı."}</small></div></div>}<div className="tradeGrid"><label>{en?"Full Name":"Ad Soyad"}<input value={data.name} onChange={e=>change({name:e.target.value})}/></label><label>{en?"Phone":"Telefon"}<input inputMode="tel" value={data.phone} onChange={e=>change({phone:e.target.value})}/></label></div><div className="tradeActions"><button type="button" onClick={()=>setStep(2)}>← {en?"Back":"Geri"}</button><button className="tradePrimary" type="submit" disabled={!data.name||!data.phone||!whatsappNumber}>{en?"Get Detailed Quote":"Detaylı Teklif Al"}</button></div></section>:null}
 </form>
}
