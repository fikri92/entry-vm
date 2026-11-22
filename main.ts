import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const I = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const STEPS = 1000000;
const OUTMAX = 65536;
const SN = 256;
const CN = 64;

function run(p: Uint8Array, inp: Uint8Array): { out: number[]; code: number } {
  const D: number[] = [];
  const C: number[] = [];
  const M = new Int32Array(SN);
  const out: number[] = [];
  let pc = 0;
  let ip = 0;
  let steps = 0;
  const trap = (c: number) => ({ out, code: c });
  for (;;) {
    if (steps >= STEPS) return trap(10);
    if (pc < 0 || pc >= p.length) return trap(9);
    const op = p[pc++];
    if (op === 0x01) {
      if (pc + 1 > p.length) return trap(9);
    } else if (op === 0x02) {
      if (pc + 4 > p.length) return trap(9);
    } else if (op === 0x30 || op === 0x31 || op === 0x32 || op === 0x33) {
      if (pc + 2 > p.length) return trap(9);
    }
    let pops = 0;
    let pushes = 0;
    switch (op) {
      case 0x03: pops = 1; break;
      case 0x04: pops = 1; pushes = 2; break;
      case 0x05: pops = 2; pushes = 2; break;
      case 0x06: pops = 2; pushes = 3; break;
      case 0x07: pops = 3; pushes = 3; break;
      case 0x10: case 0x11: case 0x12: case 0x13: case 0x14: case 0x15: case 0x16:
      case 0x18: case 0x19: case 0x1a: case 0x1c: case 0x1d: case 0x1e:
      case 0x20: case 0x21: case 0x22: pops = 2; pushes = 1; break;
      case 0x17: case 0x1b: pops = 1; pushes = 1; break;
      case 0x01: case 0x02: case 0x52: pushes = 1; break;
      case 0x31: case 0x32: pops = 1; break;
      case 0x40: pops = 1; pushes = 1; break;
      case 0x41: pops = 2; break;
      case 0x50: case 0x51: case 0x53: pops = 1; break;
    }
    if (D.length < pops) return trap(2);
    if (D.length - pops + pushes > SN) return trap(3);
    steps += 1;
    if (op >= 0x10 && op <= 0x22 && op !== 0x17 && op !== 0x1b) {
      const b = D.pop()!;
      const a = D.pop()!;
      let r: number;
      if (op === 0x10) r = (a + b) | 0;
      else if (op === 0x11) r = (a - b) | 0;
      else if (op === 0x12) r = Math.imul(a, b);
      else if (op === 0x13) {
        if (b === 0) return trap(4);
        r = a === -2147483648 && b === -1 ? -2147483648 : Math.trunc(a / b);
      } else if (op === 0x14) {
        if (b === 0) return trap(4);
        r = b === -1 ? 0 : (a % b) | 0;
      } else if (op === 0x15) {
        if (b === 0) return trap(4);
        r = Math.trunc((a >>> 0) / (b >>> 0)) | 0;
      } else if (op === 0x16) {
        if (b === 0) return trap(4);
        r = ((a >>> 0) % (b >>> 0)) | 0;
      } else if (op === 0x18) r = a & b;
      else if (op === 0x19) r = a | b;
      else if (op === 0x1a) r = a ^ b;
      else if (op === 0x1c) r = a << (b & 31);
      else if (op === 0x1d) r = a >> (b & 31);
      else if (op === 0x1e) r = (a >>> (b & 31)) | 0;
      else if (op === 0x20) r = a === b ? 1 : 0;
      else if (op === 0x21) r = a < b ? 1 : 0;
      else r = (a >>> 0) < (b >>> 0) ? 1 : 0;
      D.push(r);
      continue;
    }
    switch (op) {
      case 0x00: return { out, code: 0 };
      case 0x01: {
        const b = p[pc++];
        D.push(b < 128 ? b : b - 256);
        break;
      }
      case 0x02:
        D.push((p[pc] | (p[pc + 1] << 8) | (p[pc + 2] << 16) | (p[pc + 3] << 24)) | 0);
        pc += 4;
        break;
      case 0x03: D.pop(); break;
      case 0x04: { const a = D.pop()!; D.push(a, a); break; }
      case 0x05: { const b = D.pop()!; const a = D.pop()!; D.push(b, a); break; }
      case 0x06: { const b = D.pop()!; const a = D.pop()!; D.push(a, b, a); break; }
      case 0x07: { const c = D.pop()!; const b = D.pop()!; const a = D.pop()!; D.push(b, c, a); break; }
      case 0x17: { const a = D.pop()!; D.push(-a | 0); break; }
      case 0x1b: { const a = D.pop()!; D.push(~a); break; }
      case 0x30: {
        pc += 2 + (((p[pc] | (p[pc + 1] << 8)) << 16) >> 16);
        break;
      }
      case 0x31:
      case 0x32: {
        const off = ((p[pc] | (p[pc + 1] << 8)) << 16) >> 16;
        const v = D.pop()!;
        pc += 2;
        if (op === 0x31 ? v === 0 : v !== 0) pc += off;
        break;
      }
      case 0x33: {
        const t = p[pc] | (p[pc + 1] << 8);
        pc += 2;
        if (C.length >= CN) return trap(7);
        C.push(pc);
        pc = t;
        break;
      }
      case 0x34: {
        if (C.length === 0) return trap(8);
        pc = C.pop()!;
        break;
      }
      case 0x40: {
        const a = D.pop()!;
        if (a < 0 || a > 255) return trap(6);
        D.push(M[a]);
        break;
      }
      case 0x41: {
        const a = D.pop()!;
        const v = D.pop()!;
        if (a < 0 || a > 255) return trap(6);
        M[a] = v;
        break;
      }
      case 0x50: {
        const s = String(D.pop()!);
        if (out.length + s.length > OUTMAX) return trap(11);
        for (let k = 0; k < s.length; k += 1) out.push(s.charCodeAt(k));
        break;
      }
      case 0x51: {
        if (out.length + 1 > OUTMAX) return trap(11);
        out.push(D.pop()! & 255);
        break;
      }
      case 0x52:
        D.push(ip < inp.length ? inp[ip++] : -1);
        break;
      case 0x53: {
        const v = D.pop()!;
        return { out, code: v & 255 };
      }
      default: return trap(5);
    }
  }
}

for (const id of readdirSync(I).sort()) {
  let program: Uint8Array;
  try {
    program = readFileSync(join(I, id, 'program.bin'));
  } catch {
    continue;
  }
  let input = new Uint8Array(0);
  try {
    input = readFileSync(join(I, id, 'input.bin'));
  } catch {}
  const r = run(program, input);
  mkdirSync(join(O, id), { recursive: true });
  writeFileSync(join(O, id, 'stdout.bin'), Buffer.from(r.out));
  writeFileSync(join(O, id, 'exit.txt'), `${r.code}\n`);
}
