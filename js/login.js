document.addEventListener('DOMContentLoaded',()=>{
 const f=document.querySelector('#loginForm'),msg=document.querySelector('#msg');
 f?.addEventListener('submit',async e=>{
  e.preventDefault();
  const identifier=f.username.value.trim(), password=f.password.value;
  if(!identifier||!password){msg.className='notice error';msg.textContent='Enter your username/email and password.';return;}
  msg.className='notice';msg.textContent='Signing in…';
  try{
   const d=await EmmyAuth.login(identifier,password);
   EmmyJ.saveUser({id:d.user.id,name:d.user.fullName,email:d.user.email,username:d.user.username,type:d.user.accountType,avatar:d.user.avatar||'🙂'});
   location.href=d.user.accountType==='teacher'?'teacher.html':d.user.accountType==='admin'?'admin.html':'dashboard.html';
  }catch(err){msg.className='notice error';msg.textContent=err.message;}
 });
});
