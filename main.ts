// Tiny Stack VM: make.fun's tiny stack ISA v1, run as `node main.ts`.
// Reads MAKEFUN_INPUT_DIR (default /input); writes each instance's
// stdout.bin + exit.txt under MAKEFUN_OUTPUT_DIR (default /output).
// Deterministic: no clock, no randomness, no network.
import {readdirSync as R,readFileSync as F,writeFileSync as W,mkdirSync as D} from "node:fs";
// opcode -> [immediate bytes, values popped, values pushed]
const I=new Map([[0,[0,0,0]],[1,[1,0,1]],[2,[4,0,1]],[3,[0,1,0]],[4,[0,1,2]],[5,[0,2,2]],[6,[0,2,3]],[7,[0,3,3]],[16,[0,2,1]],[17,[0,2,1]],[18,[0,2,1]],[19,[0,2,1]],[20,[0,2,1]],[21,[0,2,1]],[22,[0,2,1]],[23,[0,1,1]],[24,[0,2,1]],[25,[0,2,1]],[26,[0,2,1]],[27,[0,1,1]],[28,[0,2,1]],[29,[0,2,1]],[30,[0,2,1]],[32,[0,2,1]],[33,[0,2,1]],[34,[0,2,1]],[48,[2,0,0]],[49,[2,1,0]],[50,[2,1,0]],[51,[2,0,0]],[52,[0,0,0]],[64,[0,1,1]],[65,[0,2,0]],[80,[0,1,0]],[81,[0,1,0]],[82,[0,0,1]],[83,[0,1,0]]]);
const T=c=>{throw c}; // a trap ends the program at once; its code is the exit code
// Binary ops by opcode. DIV/MOD/DIVU/MODU trap 4 on a zero divisor.
const B={16:(a,b)=>(a+b)|0,17:(a,b)=>(a-b)|0,18:Math.imul,19:(a,b)=>{if(!b)T(4);return a===-2147483648&&b===-1?a:(a/b)|0},20:(a,b)=>{if(!b)T(4);return b===-1?0:(a%b)|0},21:(a,b)=>{if(!b)T(4);return Math.floor((a>>>0)/(b>>>0))|0},22:(a,b)=>{if(!b)T(4);return((a>>>0)%(b>>>0))|0},24:(a,b)=>a&b,25:(a,b)=>a|b,26:(a,b)=>a^b,28:(a,b)=>a<<(b&31),29:(a,b)=>a>>(b&31),30:(a,b)=>(a>>>(b&31))|0,32:(a,b)=>a===b?1:0,33:(a,b)=>a<b?1:0,34:(a,b)=>(a>>>0)<(b>>>0)?1:0};
function run(p,q){
 const n=p.length,S=new Int32Array(256);let s=0;const K=new Int32Array(64);let k=0;const M=new Int32Array(256),u=new Uint8Array(65536);let o=0,j=0,x=0,t=0;
 const f=e=>({o:Buffer.from(u.subarray(0,o)),e});
 try{for(;;){
  if(t===1e6)T(10); // step limit
  if(x<0||x>=n)T(9); // pc outside the program
  const y=p[x],g=I.get(y);
  if(!g)T(5); // unknown opcode
  const[im,po,pu]=g;
  if(x+im>=n)T(9); // immediate cut off by the end of the program
  t++;
  const nx=x+1+im;
  if(s<po)T(2); // stack underflow
  if(s-po+pu>256)T(3); // stack overflow
  x=nx;
  if(y<16){
   if(y===0)return f(0); // HALT
   if(y===1)S[s++]=(p[nx-1]<<24)>>24; // PUSH8, sign-extended
   else if(y===2)S[s++]=p[nx-4]|p[nx-3]<<8|p[nx-2]<<16|p[nx-1]<<24; // PUSH32, little-endian
   else if(y===3)s--; // POP
   else if(y===4){S[s]=S[s-1];s++} // DUP
   else if(y===5){const a=S[s-1];S[s-1]=S[s-2];S[s-2]=a} // SWAP
   else if(y===6){S[s]=S[s-2];s++} // OVER
   else{const a=S[s-3];S[s-3]=S[s-2];S[s-2]=S[s-1];S[s-1]=a} // ROT
  }else if(y<48){
   if(y===23)S[s-1]=(-S[s-1])|0; // NEG, wraps
   else if(y===27)S[s-1]=~S[s-1]; // NOT
   else{const b=S[s-1],a=S[s-2];s-=2;S[s++]=B[y](a,b)} // binary op
  }else if(y<64){
   if(y===48||y===49||y===50){ // JMP / JZ / JNZ, signed 16-bit offset
    const r=((p[nx-2]|p[nx-1]<<8)<<16)>>16;let z=1;
    if(y!==48){const v=S[--s];z=y===49?v===0:v!==0}
    if(z)x=nx+r; // target unchecked: an outside target traps 9 next step
   }else if(y===51){ // CALL, unsigned 16-bit absolute address
    if(k===64)T(7);
    K[k++]=nx;x=p[nx-2]|p[nx-1]<<8;
   }else{ // RET
    if(k===0)T(8);
    x=K[--k];
   }
  }else if(y<80){
   if(y===64){const a=S[s-1];if(a<0||a>255)T(6);S[s-1]=M[a]} // LOAD
   else{const a=S[s-1],v=S[s-2];if(a<0||a>255)T(6);s-=2;M[a]=v} // STORE
  }else{
   if(y===80){ // PRINT: decimal ASCII, no newline
    const d=String(S[s-1]);
    if(o+d.length>65536)T(11); // would pass the output limit: writes nothing
    s--;for(let i=0;i<d.length;i++)u[o++]=d.charCodeAt(i);
   }
   else if(y===81){if(o+1>65536)T(11);u[o++]=S[--s]&255} // PUTC
   else if(y===82)S[s++]=j<q.length?q[j++]:-1; // IN, -1 past the input
   else return f(S[--s]&255); // EXIT, low byte
  }
 }}catch(e){return f(typeof e==="number"?e:9)}
}
// Driver: one sorted pass over every instance directory.
const A=process.env.MAKEFUN_INPUT_DIR||"/input",E=process.env.MAKEFUN_OUTPUT_DIR||"/output";
for(const id of R(A,{withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>e.name).sort()){
 let p,q;try{p=F(`${A}/${id}/program.bin`)}catch{p=Buffer.alloc(0)}try{q=F(`${A}/${id}/input.bin`)}catch{q=Buffer.alloc(0)}
 const r=run(p,q),d=`${E}/${id}`;D(d,{recursive:true});W(`${d}/stdout.bin`,r.o);W(`${d}/exit.txt`,r.e+"\n");
}
