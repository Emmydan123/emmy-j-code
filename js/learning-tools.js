window.EmmyLearning={
 async request(url,options={}){const r=await fetch((window.EMMY_API_URL || ((location.hostname==='localhost'||location.hostname==='127.0.0.1')&&location.port!=='3000'?'http://localhost:3000':''))+url,{credentials:'include',headers:{'Content-Type':'application/json',...(options.headers||{})},...options});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Request failed.');return d},
 notifications(){return this.request('/api/learning/notifications')},
 markRead(id){return this.request('/api/learning/notifications/'+id+'/read',{method:'POST'})},
 readAll(){return this.request('/api/learning/notifications/read-all',{method:'POST'})},
 bookmarks(){return this.request('/api/learning/bookmarks')},
 saveBookmark(lessonId,note=''){return this.request('/api/learning/bookmarks',{method:'POST',body:JSON.stringify({lessonId,note})})},
 removeBookmark(lessonId){return this.request('/api/learning/bookmarks/'+encodeURIComponent(lessonId),{method:'DELETE'})},
 getNote(lessonId){return this.request('/api/learning/notes/'+encodeURIComponent(lessonId))},
 saveNote(lessonId,note){return this.request('/api/learning/notes/'+encodeURIComponent(lessonId),{method:'PUT',body:JSON.stringify({note})})},
 revision(){return this.request('/api/learning/revision')},
 stats(){return this.request('/api/learning/stats')},
 activity(lessonId,seconds,type='lesson'){return this.request('/api/learning/activity',{method:'POST',body:JSON.stringify({lessonId,seconds,activityType:type})})}
};
