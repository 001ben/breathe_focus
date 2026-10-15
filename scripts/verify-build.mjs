import assert from 'node:assert/strict';
import { readFile, stat, readdir } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('dist');
const manifest = JSON.parse(await readFile(path.join(root,'manifest.json'),'utf8'));
const pkg = JSON.parse(await readFile('package.json','utf8'));
assert.equal(manifest.version,pkg.version);
assert.equal(manifest.manifest_version,3);
assert.deepEqual([...manifest.permissions].sort(),['alarms','notifications','offscreen','storage']);
assert.equal(manifest.host_permissions,undefined);
assert.equal(manifest.content_scripts,undefined);
assert.ok(manifest.content_security_policy.extension_pages.includes("connect-src 'none'"));
assert.ok(!manifest.content_security_policy.extension_pages.includes('unsafe-eval'));
for(const file of [manifest.background.service_worker,manifest.action.default_popup,'offscreen.html','sounds/double-open.mp3',...Object.values(manifest.icons)]) assert.ok((await stat(path.join(root,file))).size>0,file);
let bytes=0;
async function inspect(dir) {
  for(const entry of await readdir(dir,{withFileTypes:true})) {
    const file=path.join(dir,entry.name);
    if(entry.isDirectory()) {await inspect(file);continue;}
    bytes+=(await stat(file)).size;
    if(!/\.(html|js|css)$/.test(file)) continue;
    const content=await readFile(file,'utf8');
    assert.ok(!/\beval\s*\(|new Function\s*\(/.test(content),`Dynamic code in ${file}`);
    assert.ok(!/(?:src|href)=["']https?:\/\//.test(content),`Remote asset in ${file}`);
    if(file.endsWith('.html')) {
      assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>\s*\S/.test(content),`Inline script in ${file}`);
      for(const match of content.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
        const asset=path.resolve(path.dirname(file),match[1]);
        assert.ok(asset.startsWith(root+path.sep)); await stat(asset);
      }
    }
  }
}
await inspect(root);
console.log(`Manifest, assets, CSP, and executable-code checks passed. Uncompressed extension: ${(bytes/1024).toFixed(1)} KiB.`);
