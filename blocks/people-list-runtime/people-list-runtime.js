/**
 * People List (runtime) — renders the people listing by calling the AEM publish
 * persisted GraphQL query directly from the browser, at page load.
 *
 * No shard, no bridge, no token: the block is a pure read-side consumer of the
 * Content Fragment API. AEM publish reflects the CORS origin for sites linked
 * to the instance (Vary: Origin), so this works on *.aem.page / *.aem.live.
 *
 * Authoring: empty block, or first cell = execute URL (default below).
 * The persisted query returns person items with reference fields already
 * resolved by AEM (jobTitle { title }, offices[] { title }).
 */
const DEFAULT_EXECUTE = '/graphql/execute.json/global/person-list-with-refs';
const PUBLISH_HOST = 'https://publish-p225475-e2307814.adobeaemcloud.com';

function resolveUrl(path) {
  if (/^https?:\/\//.test(path)) return path;
  return `${PUBLISH_HOST}${path}`;
}

async function fetchPeople(executeUrl) {
  const resp = await fetch(executeUrl, { headers: { accept: 'application/json' } });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const body = await resp.json();
  return body?.data?.personList?.items || [];
}

export default async function decorate(block) {
  const config = [...block.querySelectorAll(':scope > div > div')]
    .map((cell) => cell.textContent.trim())
    .filter(Boolean);
  const executeUrl = resolveUrl(config[0] || DEFAULT_EXECUTE);

  block.textContent = '';

  let items;
  try {
    items = await fetchPeople(executeUrl);
  } catch (err) {
    console.error('people-list-runtime: GraphQL fetch failed', executeUrl, err);
    const msg = document.createElement('p');
    msg.className = 'people-list-error';
    msg.textContent = 'People list is temporarily unavailable.';
    block.append(msg);
    return;
  }

  const list = document.createElement('ul');
  list.className = 'people-list-grid';

  items.forEach((p) => {
    const slug = String(p._path || '').split('/').filter(Boolean).pop() || '';
    const item = document.createElement('li');
    item.className = 'people-list-card';

    const name = document.createElement('p');
    name.className = 'people-list-name';
    const link = document.createElement('a');
    link.href = `/people/${slug}`;
    link.textContent = p.title || slug;
    name.append(link);

    const meta = document.createElement('p');
    meta.className = 'people-list-meta';
    const officeTitles = (p.offices || []).map((o) => o.title).filter(Boolean).join(' / ');
    meta.textContent = [p.jobTitle?.title, officeTitles].filter(Boolean).join(' · ');

    item.append(name, meta);
    list.append(item);
  });

  const note = document.createElement('p');
  note.className = 'people-list-note';
  note.textContent = `Live from AEM publish GraphQL · ${items.length} people`;

  block.append(list, note);
}
