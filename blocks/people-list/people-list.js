/**
 * People List block — renders the people listing from a static JSON shard
 * produced by the bridge (CF -> data/people.json). The shard is committed to
 * this repo and served by the code bus from the site's own origin, so the
 * block needs no AEM access (and no CORS) at runtime.
 *
 * Authoring: empty block, or first cell = shard path (default /data/people.json).
 */
export default async function decorate(block) {
  const config = [...block.querySelectorAll(':scope > div > div')]
    .map((cell) => cell.textContent.trim())
    .filter(Boolean);
  const shardUrl = config[0] || '/data/people.json';

  block.textContent = '';

  let shard;
  try {
    const resp = await fetch(shardUrl);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    shard = await resp.json();
  } catch (err) {
    console.error('people-list: could not load shard', shardUrl, err);
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