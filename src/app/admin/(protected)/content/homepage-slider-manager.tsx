"use client";

import { createBrowserClient } from "@supabase/ssr";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { categorySliderSection, type HomepageSlide, type HomepageSlideSection, type HomepageSlideTransition } from "@/modules/homepage/slides";

const EFFECT_LABELS: Record<HomepageSlideTransition,string>={slide:"Yana Kaydır",fade:"Soluk Geçiş",zoom:"Yakınlaştır",flip:"3D Çevir",blur:"Bulanık Geçiş",stack:"Kart Destesi"};
const STATIC_PAGE_LINKS=[["/","Ana sayfa"],["/takas","Takas"],["/hakkimizda","Hakkımızda"],["/iletisim","İletişim"]] as const;
const ALLOWED_TYPES=new Set(["image/jpeg","image/png","image/webp","image/avif"]);const MAX_BYTES=10*1024*1024;

type SliderProduct={productCode:string;title:string;brand:string;model:string};
type SliderCategory={id:string;name:string;slug:string;isActive:boolean};
type SectionOption={value:HomepageSlideSection;label:string;isActive:boolean};

function sectionGuide(section: HomepageSlideSection){
 return section==="campaigns"
  ? {size:"1680 × 1200 px",ratio:1680/1200,note:"Kampanya alanı 7:5 oranında gösterilir."}
  : {size:"1600 × 900 px",ratio:16/9,note:"Kategori sliderları 16:9 oranında gösterilir."};
}

function LinkPicker({name,products,categories,defaultValue=""}:{name:string;products:SliderProduct[];categories:SliderCategory[];defaultValue?:string}){
 const categoryLinks=categories.filter(category=>category.isActive).map(category=>[`/kategori/${category.slug}`,category.name] as const);
 const pageLinks=[...STATIC_PAGE_LINKS,...categoryLinks];
 const known=defaultValue===""||pageLinks.some(([href])=>href===defaultValue)||products.some(product=>`/ilan/${product.productCode}`===defaultValue);
 return <select name={name} defaultValue={defaultValue}>
  {!known&&defaultValue?<option value={defaultValue}>Mevcut: {defaultValue}</option>:null}
  <option value="">Bağlantı yok</option>
  <optgroup label="Site sayfaları">{pageLinks.map(([href,label])=><option value={href} key={href}>{label}</option>)}</optgroup>
  <optgroup label="Yayındaki ürünler">{products.map(product=><option value={`/ilan/${product.productCode}`} key={product.productCode}>{product.title} · {product.productCode}</option>)}</optgroup>
 </select>;
}

export function HomepageSliderManager({initialSlides,products,categories,supabaseUrl,supabasePublishableKey}:{initialSlides:HomepageSlide[];products:SliderProduct[];categories:SliderCategory[];supabaseUrl:string;supabasePublishableKey:string}){
 const router=useRouter();
 const sectionOptions=useMemo<SectionOption[]>(()=>[
  {value:"campaigns",label:"Kampanyalar",isActive:true},
  ...categories.filter(category=>category.slug!=="teknik-servis").map(category=>({value:categorySliderSection(category.slug),label:category.name,isActive:category.isActive})),
 ],[categories]);
 const sectionLabel=useMemo(()=>Object.fromEntries(sectionOptions.map(option=>[option.value,option.label])),[sectionOptions]);
 const selectableSections=sectionOptions.filter(option=>option.isActive);
 const[slides,setSlides]=useState(initialSlides);
 const[section,setSection]=useState<HomepageSlideSection>(selectableSections[0]?.value??"campaigns");
 const[file,setFile]=useState<File|null>(null);const[fileHint,setFileHint]=useState<string|null>(null);const[busy,setBusy]=useState(false);const[message,setMessage]=useState<string|null>(null);const[editingId,setEditingId]=useState<string|null>(null);
 const supabase=useMemo(()=>createBrowserClient(supabaseUrl,supabasePublishableKey),[supabaseUrl,supabasePublishableKey]);
 const guide=sectionGuide(section);

 async function addSlide(event:FormEvent<HTMLFormElement>){event.preventDefault();const formElement=event.currentTarget;if(!file)return setMessage("Önce bir görsel seçin.");if(!ALLOWED_TYPES.has(file.type))return setMessage("JPG, PNG, WEBP veya AVIF yükleyin.");if(file.size>MAX_BYTES)return setMessage("Görsel 10 MB sınırını aşıyor.");const form=new FormData(formElement);setBusy(true);setMessage(null);try{const extension=file.name.split(".").pop()?.toLowerCase()||"jpg";const folder=section.replace(/[^a-z0-9-]/g,"-");const path=`${folder}/${crypto.randomUUID()}.${extension}`;const{error:uploadError}=await supabase.storage.from("homepage-slides").upload(path,file,{contentType:file.type,cacheControl:"3600"});if(uploadError)throw uploadError;const{data:publicData}=supabase.storage.from("homepage-slides").getPublicUrl(path);const transitionEffect=String(form.get("transitionEffect")||"").trim() as HomepageSlideTransition|"";const payload={section,title:String(form.get("title")||"").trim()||null,subtitle:String(form.get("subtitle")||"").trim()||null,link_url:String(form.get("linkUrl")||"").trim()||null,image_url:publicData.publicUrl,sort_order:Number(form.get("sortOrder")||0),transition_effect:transitionEffect||null,is_active:true};const{data,error}=await supabase.from("homepage_slides").insert(payload).select("id,section,title,subtitle,image_url,link_url,sort_order,is_active,transition_effect").single();if(error)throw error;setSlides(c=>[...c,data as HomepageSlide].sort((a,b)=>a.sort_order-b.sort_order));setFile(null);setFileHint(null);formElement.reset();setMessage("Slider görseli eklendi.");router.refresh()}catch(error){setMessage(error instanceof Error?error.message:"Görsel eklenemedi.")}finally{setBusy(false)}}
 async function removeSlide(slide:HomepageSlide){if(!confirm("Bu slider görseli silinsin mi?"))return;setBusy(true);const{error}=await supabase.from("homepage_slides").delete().eq("id",slide.id);if(error)setMessage(error.message);else{setSlides(c=>c.filter(i=>i.id!==slide.id));router.refresh()}setBusy(false)}
 async function toggleSlide(slide:HomepageSlide){setBusy(true);const{error}=await supabase.from("homepage_slides").update({is_active:!slide.is_active}).eq("id",slide.id);if(error)setMessage(error.message);else{setSlides(c=>c.map(i=>i.id===slide.id?{...i,is_active:!i.is_active}:i));router.refresh()}setBusy(false)}
 async function updateSlide(event:FormEvent<HTMLFormElement>,slide:HomepageSlide){event.preventDefault();const form=new FormData(event.currentTarget);const effect=String(form.get("editEffect")||"").trim() as HomepageSlideTransition|"";const payload={title:String(form.get("editTitle")||"").trim()||null,subtitle:String(form.get("editSubtitle")||"").trim()||null,link_url:String(form.get("editLink")||"").trim()||null,sort_order:Number(form.get("editSort")||0),transition_effect:effect||null};setBusy(true);const{error}=await supabase.from("homepage_slides").update(payload).eq("id",slide.id);if(error)setMessage(error.message);else{setSlides(c=>c.map(i=>i.id===slide.id?{...i,...payload}:i).sort((a,b)=>a.sort_order-b.sort_order));setEditingId(null);router.refresh()}setBusy(false)}
 function chooseFile(event:ChangeEvent<HTMLInputElement>){const selected=event.target.files?.[0]??null;setFile(selected);setFileHint(null);if(!selected||!ALLOWED_TYPES.has(selected.type))return;const url=URL.createObjectURL(selected);const image=new Image();image.onload=()=>{const difference=Math.abs(image.naturalWidth/image.naturalHeight-guide.ratio)/guide.ratio;setFileHint(difference>.08?`${image.naturalWidth} × ${image.naturalHeight}px; önerilen ${guide.size}. Kırpılabilir.`:`Görsel oranı uygun: ${image.naturalWidth} × ${image.naturalHeight}px.`);URL.revokeObjectURL(url)};image.onerror=()=>URL.revokeObjectURL(url);image.src=url}
 const activeCount=slides.filter(s=>s.is_active).length;
 const orphanSections=[...new Set(slides.map(slide=>slide.section).filter(value=>!sectionOptions.some(option=>option.value===value)))];
 const visibleSectionOptions=[...sectionOptions,...orphanSections.map(value=>({value,label:value,isActive:false}))];

 return <div className="adminSliderManager">
  <div className="adminOverviewGrid adminCompactOverview"><div><span>Toplam</span><strong>{slides.length}</strong></div><div><span>Aktif</span><strong>{activeCount}</strong></div><div><span>Kategori bölümü</span><strong>{sectionOptions.length-1}</strong></div></div>
  {message?<p className="adminStatus">{message}</p>:null}
  <details className="adminCompactPanel"><summary>+ Yeni slider görseli</summary><div className="adminCompactHint"><strong>{sectionLabel[section]??section} · {guide.size}</strong><span>{guide.note} Yeni aktif ürün kategorileri bu listede otomatik görünür.</span></div><form className="adminListingForm adminCompactForm" onSubmit={addSlide}><label className="adminField">Bölüm<select value={section} onChange={e=>{setSection(e.target.value);setFileHint(null)}}>{selectableSections.map(option=><option value={option.value} key={option.value}>{option.label}</option>)}</select></label><label className="adminField">Sıra<input name="sortOrder" type="number" defaultValue="0"/></label><label className="adminField adminFieldWide">Görsel<input accept="image/jpeg,image/png,image/webp,image/avif" type="file" onChange={chooseFile} required/>{fileHint?<small>{fileHint}</small>:null}</label><label className="adminField">Başlık<input name="title" placeholder="İsteğe bağlı"/></label><label className="adminField">Kısa metin<input name="subtitle" placeholder="İsteğe bağlı"/></label><label className="adminField">Efekt<select name="transitionEffect" defaultValue=""><option value="">Genel ayarı kullan</option>{Object.entries(EFFECT_LABELS).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label className="adminField adminFieldWide">Bağlantı<LinkPicker name="linkUrl" products={products} categories={categories}/></label><div className="adminFormActions adminFieldWide"><button className="adminButton" disabled={busy}>{busy?"Yükleniyor...":"Slider ekle"}</button></div></form></details>
  <div className="adminToolRow">{visibleSectionOptions.map(option=>{const sectionSlides=slides.filter(s=>s.section===option.value);return <details className="adminCompactPanel" key={option.value} open={option.value==="campaigns"}><summary>{option.label} ({sectionSlides.length}){!option.isActive&&option.value!=="campaigns"?" · kategori gizli":""}</summary>{sectionSlides.length?<div className="adminSliderCompactList">{sectionSlides.map(slide=><article className="adminSliderCompactRow" key={slide.id}><img src={slide.image_url} alt={slide.title||option.label}/><div className="adminSliderCompactMain">{editingId===slide.id?<form onSubmit={e=>updateSlide(e,slide)} className="adminCompactForm"><label className="adminField">Başlık<input name="editTitle" defaultValue={slide.title??""}/></label><label className="adminField">Kısa metin<input name="editSubtitle" defaultValue={slide.subtitle??""}/></label><label className="adminField">Bağlantı<LinkPicker name="editLink" products={products} categories={categories} defaultValue={slide.link_url??""}/></label><label className="adminField">Sıra<input name="editSort" type="number" defaultValue={slide.sort_order}/></label><label className="adminField">Efekt<select name="editEffect" defaultValue={slide.transition_effect??""}><option value="">Genel ayarı kullan</option>{Object.entries(EFFECT_LABELS).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><div className="adminInlineActions"><button className="adminButton" disabled={busy}>Kaydet</button><button className="adminButton adminButtonSecondary" type="button" onClick={()=>setEditingId(null)}>Vazgeç</button></div></form>:<><strong>{slide.title||"Başlıksız"}</strong><small>Sıra {slide.sort_order} · {slide.is_active?"Aktif":"Gizli"} · {slide.link_url||"Bağlantı yok"}</small></>}</div><div className="adminInlineActions">{editingId!==slide.id?<button className="adminButton adminButtonSecondary" disabled={busy} onClick={()=>setEditingId(slide.id)} type="button">Düzenle</button>:null}<button className="adminButton adminButtonSecondary" disabled={busy} onClick={()=>toggleSlide(slide)} type="button">{slide.is_active?"Gizle":"Göster"}</button><button className="adminButton adminDangerButton" disabled={busy} onClick={()=>removeSlide(slide)} type="button">Sil</button></div></article>)}</div>:<p className="emptyState">Bu bölüm boş. Ana sayfada da gösterilmez.</p>}</details>})}</div>
 </div>;
}
