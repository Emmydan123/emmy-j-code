window.EmmyStudent={
 async overview(){return EmmyAuth.request('/api/student/overview')},
 async achievements(){return EmmyAuth.request('/api/student/achievements')},
 async leaderboard(){return EmmyAuth.request('/api/student/leaderboard')},
 async certificate(){return EmmyAuth.request('/api/student/certificate',{method:'POST'})}
};
