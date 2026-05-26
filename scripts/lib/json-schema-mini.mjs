// 零依赖 JSON Schema 子集校验器（Draft 2020-12 子集）
// 支持：type / required / additionalProperties / properties / items / enum / const
//       minimum / maximum / minLength / maxLength / minItems / maxItems
//       pattern / $ref(同目录相对路径) / $defs / oneOf 简易支持
// 不支持：完整 $schema 元校验、远程 $ref、format（仅记录但不强校验）
//
// 用法：
//   import { loadSchema, validate } from "./json-schema-mini.mjs";
//   const schema = loadSchema("schemas/eval-run.schema.json");
//   const errors = validate(data, schema);
//   if (errors.length) ... 

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";

const refCache = new Map();

export function loadSchema(path) {
  const abs = join(process.cwd(), path);
  const raw = readFileSync(abs, "utf8");
  const schema = JSON.parse(raw);
  schema.__base_dir = dirname(abs);
  refCache.set(abs, schema);
  return schema;
}

function resolveRef(ref, baseDir, root) {
  if (ref.startsWith("#")) {
    // local pointer e.g. #/$defs/panelistRef
    const path = ref.slice(2).split("/");
    let node = root;
    for (const p of path) node = node?.[p];
    if (!node) throw new Error(`Cannot resolve local $ref ${ref}`);
    return node;
  }
  // sibling file ref like "common.provenance.json"
  const abs = join(baseDir, ref);
  if (refCache.has(abs)) return refCache.get(abs);
  const raw = readFileSync(abs, "utf8");
  const schema = JSON.parse(raw);
  schema.__base_dir = dirname(abs);
  refCache.set(abs, schema);
  return schema;
}

function typeOf(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  if (Number.isInteger(v)) return "integer";
  return typeof v;
}

function typeMatches(v, t) {
  const actual = typeOf(v);
  if (Array.isArray(t)) return t.some((x) => typeMatches(v, x));
  if (t === "number") return actual === "number" || actual === "integer";
  if (t === "integer") return actual === "integer";
  return actual === t;
}

export function validate(data, schema, opts = {}) {
  const root = opts.root || schema;
  const baseDir = schema.__base_dir || (root.__base_dir ?? process.cwd());
  const path = opts.path || "$";
  const errors = [];

  // $ref
  if (schema.$ref) {
    const target = resolveRef(schema.$ref, baseDir, root);
    return validate(data, target, { root: target.__base_dir ? target : root, path });
  }

  // const
  if ("const" in schema) {
    if (data !== schema.const) {
      errors.push(`${path}: const mismatch, expected ${JSON.stringify(schema.const)}, got ${JSON.stringify(data)}`);
    }
  }

  // enum
  if (schema.enum) {
    if (!schema.enum.includes(data)) {
      errors.push(`${path}: enum violation, allowed ${JSON.stringify(schema.enum)}, got ${JSON.stringify(data)}`);
    }
  }

  // type
  if (schema.type) {
    if (!typeMatches(data, schema.type)) {
      errors.push(`${path}: type mismatch, expected ${JSON.stringify(schema.type)}, got ${typeOf(data)}`);
      return errors;
    }
  }

  const t = typeOf(data);

  if (t === "string") {
    if (typeof schema.minLength === "number" && data.length < schema.minLength) {
      errors.push(`${path}: minLength ${schema.minLength}, got ${data.length}`);
    }
    if (typeof schema.maxLength === "number" && data.length > schema.maxLength) {
      errors.push(`${path}: maxLength ${schema.maxLength}, got ${data.length}`);
    }
    if (schema.pattern) {
      const re = new RegExp(schema.pattern);
      if (!re.test(data)) {
        errors.push(`${path}: pattern ${schema.pattern} not matched`);
      }
    }
  }

  if (t === "number" || t === "integer") {
    if (typeof schema.minimum === "number" && data < schema.minimum) {
      errors.push(`${path}: minimum ${schema.minimum}, got ${data}`);
    }
    if (typeof schema.maximum === "number" && data > schema.maximum) {
      errors.push(`${path}: maximum ${schema.maximum}, got ${data}`);
    }
  }

  if (t === "array") {
    if (typeof schema.minItems === "number" && data.length < schema.minItems) {
      errors.push(`${path}: minItems ${schema.minItems}, got ${data.length}`);
    }
    if (typeof schema.maxItems === "number" && data.length > schema.maxItems) {
      errors.push(`${path}: maxItems ${schema.maxItems}, got ${data.length}`);
    }
    if (schema.items) {
      data.forEach((it, i) => {
        const sub = validate(it, schema.items, { root, path: `${path}[${i}]` });
        errors.push(...sub);
      });
    }
  }

  if (t === "object") {
    if (Array.isArray(schema.required)) {
      for (const r of schema.required) {
        if (!(r in data)) errors.push(`${path}: missing required '${r}'`);
      }
    }
    const props = schema.properties || {};
    if (schema.additionalProperties === false) {
      const allowed = new Set(Object.keys(props));
      for (const k of Object.keys(data)) {
        if (!allowed.has(k)) errors.push(`${path}: additional property '${k}' not allowed`);
      }
    }
    for (const [k, sub] of Object.entries(props)) {
      if (k in data) {
        const subErrors = validate(data[k], sub, { root, path: `${path}.${k}` });
        errors.push(...subErrors);
      }
    }
  }

  if (Array.isArray(schema.oneOf)) {
    const matches = schema.oneOf.filter((s) => validate(data, s, { root, path }).length === 0).length;
    if (matches !== 1) {
      errors.push(`${path}: oneOf expects exactly 1 match, got ${matches}`);
    }
  }

  return errors;
}
