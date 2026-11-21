/** Safe staging login smoke test: no real user, password, cookies or DB writes. */
const base=process.env.ANUSMITA_STAGING_URL||'https://anusmita-store-staging.mdsakibmolla545.workers.dev';
if(!/^https:\/\/anusmita-store-staging\.[a-z0-9-]+\.workers\.dev$/.test(base))throw Error('Staging-only test');
const endpoint=new URL('/api/auth/login',base);
async function probe(label,data,expected){
 const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Origin':new URL(base).origin},body:JSON.stringify(data),signal:AbortSignal.timeout(17000),redirect:'manual'});
 let code='unexpected';try{const body=await response.json();code=typeof body.error==='string'?body.error.slice(0,100):String(body.ok||'unknown');}catch{}
 console.log(JSON.stringify({probe:label,status:response.status,message:code}));
 if(response.status!==expected)throw Error(label+' expected HTTP '+expected+' but received '+response.status+'. Staging login must remain disabled until diagnosed.');
}
await probe('valid-origin-invalid-form',{email:'not-an-email',password:'x'},400);
// Guaranteed-absent identity. The login handler should only SELECT; it must not
// update attempts or set cookies for a nonexistent account.
await probe('database-read-nonexistent-user',{email:'staging-readonly-probe-20261121@invalid.example',password:'not-the-real-password'},401);
console.log('Staging login API responded with correct validation and database-read status. This does NOT prove an authorized owner can log in.');
