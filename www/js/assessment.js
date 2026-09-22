const placementQuestions = [
['Which device do you normally use to type letters?', 'Keyboard', ['Monitor','Keyboard','Speaker','Printer']],
['What is a folder used for?', 'Organize files', ['Play sound','Organize files','Increase RAM','Connect a printer']],
['Which action safely turns off a Windows computer?', 'Use Shut down', ['Hold the power button every time','Unplug it','Use Shut down','Close the monitor']],
['Which part displays text and pictures?', 'Monitor', ['Keyboard','Monitor','Mouse','Microphone']],
['Which action makes a second copy of a file?', 'Copy and paste', ['Rename','Copy and paste','Delete','Shut down']],
['What should you do before removing a USB drive?', 'Safely eject it', ['Pull it out while copying','Safely eject it','Restart the router','Turn up brightness']],
['Which is a strong password practice?', 'Use a unique long password', ['Use 12345678','Reuse one password everywhere','Use a unique long password','Share it with friends']],
['Which program is designed for documents?', 'Microsoft Word', ['Calculator','Microsoft Word','Paint only','File Explorer']],
['Which program is mainly used for spreadsheets?', 'Microsoft Excel', ['Microsoft Excel','Notepad','Media Player','Calculator']],
['What does a web browser do?', 'Opens and uses websites', ['Prints without a printer','Opens and uses websites','Charges a laptop','Increases storage']],
['Which action creates a new email message?', 'Compose/New message', ['Refresh','Compose/New message','Archive','Sign out']],
['What is an email attachment?', 'A file sent with an email', ['A password','A file sent with an email','A browser tab','A Wi-Fi signal']],
['Which key creates a new line while typing?', 'Enter', ['Shift','Enter','Alt','Ctrl']],
['What does Ctrl+C normally do?', 'Copy selected content', ['Close Windows','Copy selected content','Print','Undo']],
['What does Ctrl+V normally do?', 'Paste', ['Paste','Save','Find','Delete']],
['Which device is used to print a document on paper?', 'Printer', ['Webcam','Printer','Router','Keyboard']],
['What is Wi-Fi mainly used for?', 'Wireless network connection', ['Printing ink','Wireless network connection','Increasing screen size','Cooling the CPU']],
['Which is a safe response to a suspicious email link?', 'Do not click it; verify the sender', ['Click quickly','Forward it to everyone','Do not click it; verify the sender','Reply with your password']],
['Which storage location is commonly inside a computer?', 'Internal SSD/HDD', ['Speaker','Internal SSD/HDD','Webcam','Mouse pad']],
['Why should you save your work regularly?', 'To reduce the chance of losing changes', ['To make the screen brighter','To reduce the chance of losing changes','To increase internet speed','To charge the battery']],
['Which Excel feature calculates numbers using a formula?', 'Formula', ['Slide transition','Formula','Browser tab','Printer queue']],
['Which PowerPoint feature controls movement between slides?', 'Transitions', ['Transitions','Spell Check only','File Explorer','Recycle Bin']],
['What is the Recycle Bin used for?', 'Temporarily holds deleted files', ['Stores passwords','Temporarily holds deleted files','Stores Wi-Fi settings','Runs antivirus']],
['What should you do if an application stops responding?', 'Try closing it normally, then use Task Manager if needed', ['Delete Windows','Try closing it normally, then use Task Manager if needed','Unplug the computer immediately','Format the drive']],
['What is a router commonly used for?', 'Connects devices to a network and routes traffic', ['Types text','Connects devices to a network and routes traffic','Displays video','Scans documents']],
['What does an operating system manage?', 'Computer hardware, software and system resources', ['Only websites','Computer hardware, software and system resources','Only email','Only printers']],
['Why is backup important?', 'It provides another copy of important data', ['It makes passwords unnecessary','It provides another copy of important data','It removes viruses automatically','It increases RAM']],
['What should you check first when a computer has no internet?', 'Check the connection and network status', ['Delete all files','Check the connection and network status','Change the wallpaper','Format the computer']],
['Which file format is commonly used for a portable document?', 'PDF', ['PDF','EXE only','MP3 only','ZIP only']],
['What should you do when you finish editing a document?', 'Save it in a known location', ['Close it without saving','Save it in a known location','Delete it','Turn off the router']]
];
function renderAssessment(){
 const box=document.querySelector('#assessment');
 placementQuestions.forEach((x,i)=>{const d=document.createElement('fieldset');d.className='question';d.innerHTML=`<legend><b>${i+1}. ${x[0]}</b></legend>${x[2].map((o,n)=>`<label class="option"><input type="radio" name="q${i}" value="${o}"> ${o}</label>`).join('')}`;box.appendChild(d)});
}
async function submitPlacement(){
 let score=0; const answers={}; placementQuestions.forEach((x,i)=>{const v=document.querySelector(`input[name=q${i}]:checked`)?.value||'';answers[i]=v;if(v===x[1])score++});
 const pct=Math.round(score/placementQuestions.length*100); let level=pct>=80?'advanced':pct>=60?'intermediate':'beginner';
 try{const r=await EmmyAuth.request('/api/placement/submit',{method:'POST',body:JSON.stringify({score:pct,answers})});level=r.level;}catch{}
 const label=level[0].toUpperCase()+level.slice(1);
 document.querySelector('#result').innerHTML=`<div class="notice success"><b>Placement complete — ${pct}%</b><br>Your starting curriculum is <strong>${label}</strong>. Your result does not remove access to other learning areas.</div><a class="btn btn-primary" href="dashboard.html">Go to dashboard →</a>`;
 document.querySelector('#submit').disabled=true;
}
document.addEventListener('DOMContentLoaded',()=>{renderAssessment();document.querySelector('#submit').addEventListener('click',submitPlacement)});
