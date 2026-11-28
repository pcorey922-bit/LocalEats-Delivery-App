// CORS does not authenticate an app. Every business route still requires a valid
// Clerk session or scoped guest capability and normal server-side authorization.
export function stagingNativeOrigins(env:NodeJS.ProcessEnv=process.env){
 return env.ROCOEATS_PRIVATE_STAGING==='true' && env.PAYMENT_PROVIDER==='stripe_test'
 ? ['https://localhost','capacitor://localhost'] : [];
}
