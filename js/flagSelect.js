// Lightweight replacement to render flags inside a custom dropdown while keeping the original <select> for form state.
export default function initFlagSelect(selectId = 'languageSelector') {
  const select = document.getElementById(selectId);
  if (!select) return null;

  // Build widget
  const wrapper = document.createElement('div');
  wrapper.className = 'flag-select';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'flag-select__button';
  button.setAttribute('aria-haspopup', 'listbox');

  const img = document.createElement('img');
  img.className = 'flag-select__flag';
  img.alt = '';
  button.appendChild(img);

  const label = document.createElement('span');
  label.className = 'flag-select__button-label';
  button.appendChild(label);

  const list = document.createElement('ul');
  list.className = 'flag-select__list';
  list.setAttribute('role', 'listbox');

  // Populate list from select options
  Array.from(select.options).forEach((opt, idx) => {
    const item = document.createElement('li');
    item.className = 'flag-select__item';
    item.setAttribute('role', 'option');
    item.dataset.value = opt.value;
    item.title = opt.title || opt.textContent || opt.getAttribute('aria-label') || opt.value;

    const itemImg = document.createElement('img');
    itemImg.className = 'flag-select__item-flag';
    const flag = opt.getAttribute('data-flag');
    itemImg.src = flag || '';
    item.appendChild(itemImg);

    const itemLabel = document.createElement('span');
    itemLabel.textContent = opt.title || opt.getAttribute('aria-label') || opt.value;
    item.appendChild(itemLabel);

    item.addEventListener('click', (e) => {
      e.preventDefault();
      select.value = item.dataset.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      updateSelected();
      hideList();
    });

    list.appendChild(item);
  });

  wrapper.appendChild(button);
  wrapper.appendChild(list);
  select.parentNode.insertBefore(wrapper, select.nextSibling);

  // Hide original select visually but keep accessible to form and scripts
  select.setAttribute('aria-hidden', 'true');

  function updateSelected() {
    const val = select.value;
    const opt = select.querySelector(`option[value="${val}"]`);
    if (!opt) return;
    const flag = opt.getAttribute('data-flag');
    img.src = flag || '';
    label.textContent = opt.title || opt.getAttribute('aria-label') || opt.value;

    // mark selected in list
    list.querySelectorAll('.flag-select__item').forEach(i => i.classList.remove('selected'));
    const sel = Array.from(list.children).find(i => i.dataset.value === val);
    if (sel) sel.classList.add('selected');
  }

  function showList() { list.style.display = 'block'; button.setAttribute('aria-expanded', 'true'); }
  function hideList() { list.style.display = 'none'; button.setAttribute('aria-expanded', 'false'); }

  button.addEventListener('click', (e) => {
    e.preventDefault();
    if (list.style.display === 'block') hideList(); else showList();
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) hideList();
  });

  // Sync when original select changes (e.g., translations or programmatic)
  select.addEventListener('change', updateSelected);

  // Init
  updateSelected();

  return { wrapper, button, list, updateSelected };
}
