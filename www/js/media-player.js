(function(){
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function loadManifest(){try{const r=await fetch('/media/media-manifest.json');return await r.json()}catch{return {lessonMedia:{}}}}
  function lessonId(){return document.body?.dataset.lessonId || document.querySelector('[data-lesson-id]')?.dataset.lessonId || location.pathname.split('/').pop().replace(/\.html$/,'')}
  function player(data){
    const box=document.createElement('section'); box.className='media-player'; box.setAttribute('aria-label','Lesson media');
    const title=data.title||'Lesson media'; let html=`<h3>${esc(title)}</h3>`;
    if(data.video){html+=`<video controls preload="metadata" playsinline ${data.poster?`poster="${esc(data.poster)}"`:''}> <source src="${esc(data.video)}" type="video/mp4">${data.captions?`<track kind="captions" srclang="en" src="${esc(data.captions)}" label="English" default>`:''}</video>`}
    if(data.audio){html+=`<audio controls preload="metadata"><source src="${esc(data.audio)}" type="audio/mpeg"></audio>`}
    if(data.image){html+=`<img src="${esc(data.image)}" alt="${esc(data.imageAlt||'Lesson illustration')}" loading="lazy">`}
    if(data.transcript){html+=`<details class="transcript"><summary>Read narration / transcript</summary><p>${esc(data.transcript)}</p></details>`}
    if(data.captionNote){html+=`<p class="caption-note">${esc(data.captionNote)}</p>`}
    box.innerHTML=html;
    return box;
  }
  document.addEventListener('DOMContentLoaded',async()=>{
    const id=lessonId(); if(!id)return; const m=await loadManifest(); const data=m.lessonMedia?.[id]; if(!data)return;
    const host=document.querySelector('#lesson-media')||document.querySelector('.lesson-content')||document.querySelector('main'); if(host) host.prepend(player(data));
  });
})();
