document.addEventListener('DOMContentLoaded',()=>{
 const form=document.querySelector('#registerForm'),msg=document.querySelector('#msg');
 form?.addEventListener('submit',async e=>{
  e.preventDefault();
  const d=Object.fromEntries(new FormData(form));
  if(d.password.length<8){msg.className='notice error';msg.textContent='Use a password of at least 8 characters.';return;}
  if(d.username.trim().length<3){msg.className='notice error';msg.textContent='Username must be at least 3 characters.';return;}
  msg.className='notice';msg.textContent='Creating account…';
  try{
   const r=await EmmyAuth.register({accountType:d.type,fullName:d.name,email:d.email,phone:d.phone,country:d.country,username:d.username,password:d.password,avatar:d.avatar||'🙂'});
   EmmyJ.saveUser({id:r.user.id,name:r.user.fullName,email:r.user.email,username:r.user.username,type:r.user.accountType,avatar:r.user.avatar||'🙂'});
   location.href='onboarding.html';
  }catch(err){msg.className='notice error';msg.textContent=err.message;}
 });
});
