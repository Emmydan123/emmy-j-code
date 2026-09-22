(function(){
  const configured = window.EMMY_API_URL || localStorage.getItem('emmyj_api_url');
  const base = configured || ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') && location.port !== '3000' ? 'http://localhost:3000' : '');
  function apiUrl(url){ return /^https?:\/\//i.test(url) ? url : base + url; }
  async function request(url,options={}){
    let r;
    try{
      r=await fetch(apiUrl(url),{credentials:'include',headers:{'Content-Type':'application/json',...(options.headers||{})},...options});
    }catch(e){ throw new Error('Emmy J Code cannot reach the backend. Start the Node.js server with "npm start", then open the app at http://localhost:3000.'); }
    const data=await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(data.error || `Server error (${r.status}).`);
    return data;
  }
  window.EmmyAuth={
    request,
    register:p=>request('/api/auth/register',{method:'POST',body:JSON.stringify(p)}),
    login:(identifier,password)=>request('/api/auth/login',{method:'POST',body:JSON.stringify({identifier,password})}),
    logout:()=>request('/api/auth/logout',{method:'POST'}),
    me:()=>request('/api/auth/me'),
    saveProgress:p=>request('/api/progress/lesson',{method:'POST',body:JSON.stringify(p)}),
    submitQuiz:p=>request('/api/quiz/submit',{method:'POST',body:JSON.stringify(p)})
  };
})();
