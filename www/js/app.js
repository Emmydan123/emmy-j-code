const EmmyJ={
  getUser(){try{return JSON.parse(localStorage.getItem('emmyj_user')||'null')}catch{return null}},
  saveUser(u){localStorage.setItem('emmyj_user',JSON.stringify(u))},
  async logout(){try{await window.EmmyAuth?.logout()}catch{} localStorage.removeItem('emmyj_user');location.href='login.html'},
  requireUser(){if(!this.getUser()) location.href='login.html'},
  xp(){return Number(localStorage.getItem('emmyj_xp')||0)}, coins(){return Number(localStorage.getItem('emmyj_coins')||0)},
  rank(){const x=this.xp();if(x>=30000)return'Legend';if(x>=22000)return'Grand Master';if(x>=16000)return'Master';if(x>=11000)return'Diamond';if(x>=7000)return'Platinum';if(x>=4000)return'Gold';if(x>=2000)return'Silver';if(x>=500)return'Bronze';return'Rookie'}
};
async function hydrateAuth(){try{const d=await EmmyAuth.me();EmmyJ.saveUser({id:d.user.id,name:d.user.fullName,email:d.user.email,username:d.user.username,type:d.user.accountType,avatar:d.user.avatar||'🙂'});return d.user}catch{return null}}
document.addEventListener('DOMContentLoaded',async()=>{const u=await hydrateAuth();document.querySelectorAll('[data-user-name]').forEach(e=>e.textContent=u?.fullName||EmmyJ.getUser()?.name||'Learner');document.querySelectorAll('[data-user-avatar]').forEach(e=>e.textContent=u?.avatar||EmmyJ.getUser()?.avatar||'🙂');document.querySelectorAll('[data-xp]').forEach(e=>e.textContent=EmmyJ.xp());document.querySelectorAll('[data-coins]').forEach(e=>e.textContent=EmmyJ.coins());document.querySelectorAll('[data-rank]').forEach(e=>e.textContent=EmmyJ.rank())});
