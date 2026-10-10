/**
 * People List block — renders the people listing from the DA-hosted shard
 * produced by the bridge (CF -> DA document, JSON in a <pre> block).
 *
 * Reads the shard through the content bus plain-html variant:
 *   /data/people -> fetch /data/people.plain.html -> parse <pre> -> JSON
 * (A path ending in .json is fetched directly, kept for flexibility.)
 *
 * Authoring: empty block, or first cell = shard doc path (default /data/people).
 */
const DEFAULT_SHARD = '/data/people';

async function fetchShard(shardPath) {
  if (shardPath.endsWith('.json')) {
    const resp = await fetch(shardPath);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json();
  }
  const resp = await fetch(`${shardPath}.plain.html`);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const html = await resp.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const payload = doc.querySelector('pre');
  if (!payload) throw new Error('shard document has no <pre> payload');
  return JSON.parse(payload.textContent);
}

export default async function decorate(block) {
  const config = [...block.querySelectorAll(':scope > div > div')]
    .map((cell) => cell.textContent.trim())
    .filter(Boolean);
  const shardPath = config[0] || DEFAULT_SHARD;

  block.textContent = '';

  let shard;
  try {
    shard = await fetchShard(shardPath);
  } catch (err) {
    console.error('people-list: could not load shard', shardPath, err);
    const msg = document.createElement('p');
    msg.className = 'people-list-error';
    msg.textContent = 'People list is temporarily unavailable.';
    block.append(msg);
    return;
  }

  const people = shard.people || [];
  const list = document.createElement('ul');
  list.className = 'people-list-grid';

  people.forEach((person) => {
    const item = document.createElement('li');
    item.className = 'people-list-card';

    const name = document.createElement('p');
    name.className = 'people-list-name';
    if (person.url) {
      const link = document.createElement('a');
      link.href = person.url;
      link.textContent = person.name;
      name.append(link);
    } else {
      name.textContent = person.name;
    }

    const meta = document.createElement('p');
    meta.className = 'people-list-meta';
    const officeTitles = (person.offices || []).map((o) => o.title).filter(Boolean).join(' / ');
    meta.textContent = [person.jobTitle?.title, officeTitles].filter(Boolean).join(' · ');

    item.append(name, meta);
    list.append(item);
  });

  const note = document.createElement('p');
  note.className = 'people-list-note';
  const stamp = shard.generatedAt ? shard.generatedAt.slice(0, 16).replace('T', ' ') : '';
  note.textContent = `Synced from Content Fragments · ${shard.count ?? people.length} people${stamp ? ` · ${stamp} UTC` : ''}`;

  block.append(list, note);
}