/**
 * A small, safe formula reader for the board's graphs: "x^2 - 5x + 6", "2x+1", "sin(x)", "sqrt(x)", "x(x-1)".
 * It never runs code (no eval, no Function): the text is turned into a tree and only that tree is evaluated.
 *
 * Supported: numbers, x, pi, e, + - * / ^ (and ², ³), unary minus, parentheses, implicit multiplication ("2x", "3(x+1)", "x(x-1)"),
 * and the functions sin cos tan sqrt abs ln log exp.
 */

export class ExprError extends Error {}

type Node =
  | { k: 'num'; v: number }
  | { k: 'x' }
  | { k: 'neg'; a: Node }
  | { k: 'bin'; op: '+' | '-' | '*' | '/' | '^'; a: Node; b: Node }
  | { k: 'fn'; name: string; a: Node };

const FUNCS: Record<string, (v: number) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  sqrt: Math.sqrt,
  abs: Math.abs,
  ln: Math.log,
  log: Math.log10,
  exp: Math.exp,
};

type Tok = { t: 'num'; v: number } | { t: 'id'; v: string } | { t: 'op'; v: string };

function tokenize(src: string): Tok[] {
  const s = src.replace(/²/g, '^2').replace(/³/g, '^3').replace(/[×·]/g, '*').replace(/−/g, '-').replace(/\*\*/g, '^');
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i]!;
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) {
      const m = /^[0-9]*\.?[0-9]+(?:[eE][+-]?[0-9]+)?|^[0-9]+\.?/.exec(s.slice(i));
      if (!m) throw new ExprError('bad number');
      out.push({ t: 'num', v: Number(m[0]) });
      i += m[0].length;
    } else if (/[a-zA-Z]/.test(c)) {
      const m = /^[a-zA-Z]+/.exec(s.slice(i))!;
      out.push({ t: 'id', v: m[0].toLowerCase() });
      i += m[0].length;
    } else if ('+-*/^()'.includes(c)) {
      out.push({ t: 'op', v: c });
      i++;
    } else throw new ExprError(`unexpected "${c}"`);
  }
  return out;
}

export function parseExpr(src: string): Node {
  if (src.length > 120) throw new ExprError('too long');
  const toks = tokenize(src);
  let p = 0;
  const peek = () => toks[p];
  const isOp = (v: string) => peek()?.t === 'op' && (peek() as { v: string }).v === v;
  const startsOperand = () => {
    const t = peek();
    return !!t && (t.t === 'num' || t.t === 'id' || (t.t === 'op' && t.v === '('));
  };

  function expr(): Node {
    let a = term();
    while (isOp('+') || isOp('-')) {
      const op = (toks[p++] as { v: '+' | '-' }).v;
      a = { k: 'bin', op, a, b: term() };
    }
    return a;
  }
  function term(): Node {
    let a = unary();
    for (;;) {
      if (isOp('*') || isOp('/')) {
        const op = (toks[p++] as { v: '*' | '/' }).v;
        a = { k: 'bin', op, a, b: unary() };
      } else if (startsOperand()) a = { k: 'bin', op: '*', a, b: power() }; // implicit multiplication: 2x, 3(x+1), x(x-1)
      else return a;
    }
  }
  function unary(): Node {
    if (isOp('-')) { p++; return { k: 'neg', a: unary() }; }
    if (isOp('+')) { p++; return unary(); }
    return power();
  }
  function power(): Node {
    const base = atom();
    if (isOp('^')) { p++; return { k: 'bin', op: '^', a: base, b: unary() }; } // right-associative, and x^-2 works
    return base;
  }
  function atom(): Node {
    const t = toks[p++];
    if (!t) throw new ExprError('unexpected end');
    if (t.t === 'num') return { k: 'num', v: t.v };
    if (t.t === 'id') {
      if (t.v === 'x') return { k: 'x' };
      if (t.v === 'pi') return { k: 'num', v: Math.PI };
      if (t.v === 'e') return { k: 'num', v: Math.E };
      if (FUNCS[t.v]) {
        if (!isOp('(')) throw new ExprError(`${t.v} needs ( )`);
        p++;
        const a = expr();
        if (!isOp(')')) throw new ExprError('missing )');
        p++;
        return { k: 'fn', name: t.v, a };
      }
      throw new ExprError(`unknown name "${t.v}"`);
    }
    if (t.v === '(') {
      const a = expr();
      if (!isOp(')')) throw new ExprError('missing )');
      p++;
      return a;
    }
    throw new ExprError(`unexpected "${t.v}"`);
  }

  const tree = expr();
  if (p < toks.length) throw new ExprError('extra text');
  return tree;
}

function run(n: Node, x: number): number {
  switch (n.k) {
    case 'num': return n.v;
    case 'x': return x;
    case 'neg': return -run(n.a, x);
    case 'fn': return FUNCS[n.name]!(run(n.a, x));
    case 'bin': {
      const a = run(n.a, x), b = run(n.b, x);
      return n.op === '+' ? a + b : n.op === '-' ? a - b : n.op === '*' ? a * b : n.op === '/' ? a / b : Math.pow(a, b);
    }
  }
}

/** Turns "x^2 - 5x + 6" into a function of x. Throws ExprError for anything that is not a plain formula. */
export function compileExpr(src: string): (x: number) => number {
  const tree = parseExpr(src);
  return (x) => run(tree, x);
}
