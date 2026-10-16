import { readFile, writeFile } from 'node:fs/promises';
import { Parser, ModelExporter } from '@dbml/core';

const source = await readFile('schema/matchlab.dbml', 'utf8');
// dbmlv2 is the current compiler, matching dbml2sql CLI (not the legacy parser).
const database = Parser.parse(source, 'dbmlv2');
ModelExporter.export(database, 'postgres');
const { schemas } = database.export();
const tables = new Map();
const key = (schema, table) => `${schema || 'public'}.${table}`;
const alias = (schema, table) => `${schema || 'public'}_${table}`;
const identifier = (value) => {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) throw new Error(`Unsupported Mermaid identifier: ${value}`);
  return value;
};
for (const schema of schemas) {
  for (const table of schema.tables) tables.set(key(schema.name, table.name), { schema: schema.name, ...table });
}
const lines = ['erDiagram'];
const foreignKeys = new Set();
for (const ref of schemas.flatMap((schema) => schema.refs)) {
  // Inline DBML refs and explicit refs use different endpoint order.
  const [from, to] = ref.endpoints[1].relation === '*' ? [...ref.endpoints].reverse() : ref.endpoints;
  if (to.relation !== '1') throw new Error('Many-to-many refs need an explicit junction table');
  const fromTable = tables.get(key(from.schemaName, from.tableName));
  const nullable = from.fieldNames.some((name) => {
    const field = fromTable.fields.find((field) => field.name === name);
    return !field.not_null && !field.pk;
  });
  for (const field of from.fieldNames) foreignKeys.add(`${key(from.schemaName, from.tableName)}.${field}`);
  const unique = fromTable.fields.some((field) => from.fieldNames.includes(field.name) && (field.pk || field.unique)) || (fromTable.indexes || []).some((index) => (index.pk || index.unique) && index.columns.every((column) => column.type === 'column' && from.fieldNames.includes(column.value)));
  const left = from.relation === '1' || unique ? '|o' : '}o';
  const right = nullable ? 'o|' : '||';
  lines.push(`  ${identifier(alias(from.schemaName, from.tableName))} ${left}--${right} ${identifier(alias(to.schemaName, to.tableName))} : ${identifier(ref.name || from.fieldNames.join('_'))}`);
}
for (const table of tables.values()) {
  lines.push(`  ${identifier(alias(table.schema, table.name))} {`);
  for (const field of table.fields) {
    const indexes = table.indexes || [];
    const primary = field.pk || indexes.some((index) => index.pk && index.columns.some((column) => column.type === 'column' && column.value === field.name));
    const unique = field.unique || indexes.some((index) => index.unique && index.columns.length === 1 && index.columns[0].value === field.name);
    const keys = [primary && 'PK', foreignKeys.has(`${key(table.schema, table.name)}.${field.name}`) && 'FK', unique && 'UK'].filter(Boolean);
    // Keep type lengths; normalize SQL whitespace/schema punctuation for Mermaid.
    const type = field.type.type_name.replace(/[^a-zA-Z0-9_()[\]]/g, '_');
    lines.push(`    ${type} ${identifier(field.name)}${keys.length ? ` ${keys.join(', ')}` : ''}`);
  }
  lines.push('  }');
}
const diagram = `\`\`\`mermaid\n${lines.join('\n')}\n\`\`\``;
const readme = await readFile('README.md', 'utf8');
const blocks = [...readme.matchAll(/```mermaid\r?\n[\s\S]*?```/g)];
if (blocks.length !== 1) throw new Error('Expected exactly one generated Mermaid block in README.md');
const updated = readme.replace(blocks[0][0], diagram);
if (process.argv.includes('--check')) {
  if (updated !== readme) throw new Error('README diagram differs from DBML. Run npm run generate and commit README.md.');
  console.log(`DBML and generated diagram agree: ${tables.size} tables`);
} else {
  await writeFile('README.md', updated);
  console.log(`Generated README diagram: ${tables.size} tables`);
}
