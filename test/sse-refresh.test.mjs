import assert from 'node:assert/strict'
import { mock, test } from 'node:test'
globalThis.document = { removeEventListener() {} }
globalThis.window = { setTimeout, clearTimeout, location: { href: 'http://localhost:5173/' } }
const { useAuthStore } = await import('../src/stores/auth-store.ts')
const { apiClient } = await import('../src/lib/api-client.ts')
const { default: axios, AxiosError } = await import('axios')
const { abrirStreamSse } = await import('../src/lib/sse.ts')
test('SSE renueva un JWT vencido y reintenta con Authorization actualizado', async (t) => {
  const usuario={id:'a',nombre:'Ana',apellido:'P',email:'a@test.example',telefono:null,emailVerificado:true,twoFactorEnabled:false,rol:{id:1,codigo:'FAMILIAR_ENCARGADO',nombre:'Familiar'},permisos:[]}
  useAuthStore.getState().setSesion({accessToken:'old-token',usuario})
  mock.method(axios,'post',async()=>({data:{accessToken:'new-token',user:usuario}}))
  const original=apiClient.defaults.adapter
  apiClient.defaults.adapter=async(config)=>{
    if(config.headers.get('Authorization')==='Bearer old-token') throw new AxiosError('expired','ERR_BAD_REQUEST',config,undefined,{status:401,headers:{},config,data:{}})
    return {status:200,headers:{},config,data:usuario}
  }
  t.after(()=>{mock.restoreAll();apiClient.defaults.adapter=original;useAuthStore.getState().clearSesion()})
  let done
  const retried=new Promise(resolve=>{done=resolve})
  const requests=[]
  window.fetch=(url,init)=>{
    requests.push({url,init})
    if(requests.length===1) return Promise.resolve(new Response('',{status:401}))
    done()
    return new Promise(()=>{})
  }
  const close=abrirStreamSse('/ubicaciones/stream?adultoId=adulto')
  t.after(close)
  await retried
  assert.equal(requests[1].init.headers.Authorization,'Bearer new-token')
  assert.equal(requests[1].url.includes('new-token'),false)
})
