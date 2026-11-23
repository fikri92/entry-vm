import{mkdirSync as M,readdirSync as R,readFileSync as F,writeFileSync as W}from'node:fs';
const I=process.env.MAKEFUN_INPUT_DIR??'/input',O=process.env.MAKEFUN_OUTPUT_DIR??'/output';
for(const d of R(I).sort()){
const p=F(`${I}/${d}/program.bin`),u=F(`${I}/${d}/input.bin`),D:any=[],C:any=[],m=new Int32Array(256),o:any=[];
let c=0,i=0,s=0,q=(x:any)=>{M(`${O}/${d}`,{recursive:!0});W(`${O}/${d}/stdout.bin`,Uint8Array.from(o));W(`${O}/${d}/exit.txt`,x+'\n')};
for(;;){
if(s>=1e6){q(10);break}
const k=p[c++],n=D.length;
if(c<1||c+(k<2?k:k<3?4:k>47&&k<52?2:0)>p.length){q(9);break}
const u0=k==3||k==4||k==23||k==27||k==49||k==50||k==64||k==80||k==81||k==83?1:k==5||k==6||k==65||k>15&&k<35?2:k==7?3:0,
v0=k==1||k==2||k==82||k==23||k==27||k==64||k>15&&k<35?1:k==4||k==5?2:k==6||k==7?3:0;
if(n<u0||n-u0+v0>256){q(n<u0?2:3);break}
s++;
if(k>15&&k<35&&k!=23&&k!=27){
const b=D.pop(),a=D.pop(),A=a>>>0,B=b>>>0;
if(k>18&&k<23&&!b){q(4);break}
D.push((k==16?a+b:k==17?a-b:k==18?Math.imul(a,b):k==19?a==-2147483648&&b==-1?a:a/b:k==20?b==-1?0:a%b:k==21?A/B:k==22?A%B:k==24?a&b:k==25?a|b:k==26?a^b:k==28?a<<b:k==29?a>>b:k==30?A>>>(b&31):k==32?a==b:k==33?a<b:A<B)|0);
continue}
const w=p[c]|p[c+1]<<8,r=w<<16>>16;
if(!k){q(0);break}
if(k<8){
if(k==1)D.push(p[c++]<<24>>24);
else if(k==2)D.push(w|p[c+2]<<16|p[c+3]<<24),c+=4;
else{const a=D.pop(),b=k>4?D.pop():0,x=k>6?D.pop():0;k==4&&D.push(a,a);k==5&&D.push(a,b);k==6&&D.push(b,a,b);k==7&&D.push(b,a,x)}
}else if(k==23)D.push(-D.pop()|0);
else if(k==27)D.push(~D.pop());
else if(k==48)c+=2+r;
else if(k==49||k==50)c+=2+((k==49)==!D.pop()?r:0);
else if(k==51){if(C.length>63){q(7);break}C.push(c+2);c=w}
else if(k==52){if(!C.length){q(8);break}c=C.pop()}
else if(k==64||k==65){const a=D.pop(),v=k>64?D.pop():0;if(a>>>8){q(6);break}k>64?m[a]=v:D.push(m[a])}
else if(k==80||k==81){const t=k>80?[D.pop()&255]:[...''+D.pop()].map(e=>e.charCodeAt(0));if(o.length+t.length>65536){q(11);break}o.push(...t)}
else if(k==82)D.push(i<u.length?u[i++]:-1);
else if(k==83){q(D.pop()&255);break}
else{q(5);break}
}}
