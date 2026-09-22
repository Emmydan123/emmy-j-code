const finalBank={
 beginner:[
 ['You need a new folder on the Desktop. What is the normal sequence?','Right-click empty Desktop → New → Folder → type name → Enter'],
 ['You accidentally delete a file. Where should you check first?','Recycle Bin'],
 ['You want to keep a document and make a second version with a different name. Which command is useful?','Save As'],
 ['Before unplugging a USB drive after copying files, what should you do?','Safely eject it'],
 ['A program is open but hidden behind another window. What can you use?','Taskbar/window switching'],
 ['You want to select several files that are next to each other. Which keyboard key is commonly used with a range selection?','Shift'],
 ['You want to copy selected text without removing it. Which shortcut?','Ctrl+C'],
 ['You want to paste copied text. Which shortcut?','Ctrl+V'],
 ['Your laptop has no internet. What should you check first?','Network/Wi-Fi connection status'],
 ['You finish editing an important document. What should you do before closing it?','Save it in a known location']
 ],
 intermediate:[
 ['In Word, you need to place page numbers at the bottom of every page. Which feature?','Insert → Page Number'],
 ['In Excel, you need to add values in cells B2 through B10. What kind of tool do you use?','A formula/function such as SUM(B2:B10)'],
 ['In PowerPoint, you want the same footer information on many slides. Which area is designed for repeated slide elements?','Slide Master'],
 ['In email, you need to send a file with your message. What do you use?','Attachment/Attach file'],
 ['A browser page is useful and you want quick access later. What feature can you use?','Bookmark/Favorite'],
 ['You need to find a word inside a long webpage. What shortcut is commonly used?','Ctrl+F'],
 ['A printer is connected but not printing. Name one sensible first check.','Check power/connection and print queue'],
 ['You want two computers to communicate on the same local network. What provides the network connection?','A network device such as a switch/router and network interface'],
 ['You receive a suspicious message asking for your password. What should you do?','Do not provide it; verify/report the message'],
 ['You need to move a file to another folder while keeping the original out of the old folder. Which operation?','Cut and paste or move']
 ],
 advanced:[
 ['A workstation gets an IP address but cannot reach a website by name. What area should you investigate?','DNS/name resolution'],
 ['A computer is slow after startup. Name a useful diagnostic area.','Startup applications/resource usage'],
 ['Why is a 3-2-1 backup strategy useful?','It keeps multiple copies, on different media, with one copy off-site'],
 ['A user receives a convincing credential-harvesting message. What controls help reduce the risk?','User verification, MFA, filtering and security awareness'],
 ['You need to diagnose intermittent network loss. What should you collect first?','Timing, affected devices, connection type and relevant logs/tests'],
 ['Why should least privilege be used?','Users/processes receive only the access they need'],
 ['A system update fails repeatedly. What should you inspect?','Error details/logs, storage, compatibility and update service status'],
 ['Why are restore tests important for backups?','A backup is only useful if data can actually be recovered'],
 ['A cloud service is unavailable. What should a resilient organization have?','A documented recovery/continuity plan and appropriate alternate access/data'],
 ['Before changing a production configuration, what should you do?','Document the change, assess risk, back up/prepare rollback and obtain required approval']
 ]
};
let level=new URLSearchParams(location.search).get('level')||'beginner';
const bank=finalBank[level]||finalBank.beginner; const letters=['A','B','C','D'];
function render(){const box=document.querySelector('#exam');box.innerHTML=bank.map((q,i)=>`<fieldset class="question"><legend><b>${i+1}. ${q[0]}</b></legend>${[q[1],'Review the lesson and choose the closest correct procedure.','This is a practical decision question.','None of the above'].map((o,n)=>`<label class="option"><input type="radio" name="q${i}" value="${n===0?'correct':String(n)}"> ${letters[n]}. ${o}</label>`).join('')}</fieldset>`).join('')}
async function submit(){let correct=0,answers={};bank.forEach((q,i)=>{const v=document.querySelector(`input[name=q${i}]:checked`)?.value||'';answers[i]=v;if(v==='correct')correct++});const score=Math.round(correct/bank.length*100);const result=document.querySelector('#result');try{const r=await EmmyAuth.request('/api/final-exam/submit',{method:'POST',body:JSON.stringify({level,score,answers})});if(r.passed){result.innerHTML=`<div class="notice success"><b>Final exam passed — ${score}% 🎓</b><br>Your certificate is now available. ${r.certificate?.certificate_code?`Certificate code: <strong>${r.certificate.certificate_code}</strong>`:''}</div><a class="btn btn-primary" href="dashboard.html">Return to dashboard →</a>`}else result.innerHTML=`<div class="notice error"><b>${score}% — not passed.</b><br>You need at least 80%. Review your level lessons and try again.</div><button class="btn btn-secondary" onclick="location.reload()">Try again</button>`}catch(e){result.innerHTML=`<div class="notice error">${e.message||'Could not submit exam.'}</div>`}}
document.addEventListener('DOMContentLoaded',async()=>{document.querySelector('#levelName').textContent=level[0].toUpperCase()+level.slice(1);try{const s=await EmmyAuth.request('/api/final-exam/status?level='+encodeURIComponent(level));if(!s.ready){document.querySelector('#exam').innerHTML='<div class="notice">Complete every lesson in this level before taking the final exam.</div>';document.querySelector('#submit').style.display='none';return}}catch{}render();document.querySelector('#submit').addEventListener('click',submit)});
