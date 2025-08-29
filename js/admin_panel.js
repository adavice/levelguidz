import { loadCoaches, saveCoach, deleteCoach } from './adminApi.js';
import { DEFAULT_AVATAR } from './constants.js';

let coaches = []; // Initialize empty array
let selectedCoach = null;
let hasUnsavedChanges = false;
let pendingAction = null;
let stagedLanguages = []; // languages added before a coach is selected

// Render coach list
function renderCoaches() {
  const coachList = document.querySelector(".chatbot-list");
  if (!coachList) return;

  coachList.innerHTML = coaches
    .map(
      (coach) => `
          <div class="coach-item p-3 mb-2 ${
            selectedCoach?.id === coach.id ? "active" : ""
          }" data-id="${coach.id}">
              <div class="d-flex align-items-center">
                  <div class="coach-item-avatar me-3" style="background-image: url('${coach.avatar || DEFAULT_AVATAR}')"></div>
                  <div>
                      <h6 class="mb-1 fw-semibold">${coach.name}</h6>
                      <p class="text-muted small mb-0">${coach.role} expert</p>
                  </div>
              </div>
          </div>
      `
    )
    .join("");

  // Add click listeners after rendering
  document.querySelectorAll('.coach-item').forEach(item => {
    const coachId = item.dataset.id; // Use string directly
    if (coachId) {
      item.addEventListener('click', () => {
        console.log(`Coach clicked: ${coachId}`); // Debug log
        selectCoach(coachId);
      });
    } else {
      console.error(`Invalid coach ID: ${item.dataset.id}`); // Debug log
    }
  });
}

// Select coach and populate edit form
function selectCoach(id) {
  console.log(`selectCoach called with id: ${id}`); // Debug log
  if (selectedCoach?.id === id) return;

  const targetCoach = coaches.find((coach) => coach.id === id);
  if (targetCoach) {
    console.log(`Coach found: ${targetCoach.name}`); // Debug log
    selectedCoach = targetCoach;

    // Update active state in the coach list
    document.querySelectorAll('.coach-item').forEach(item => {
      item.classList.toggle('active', item.dataset.id === id);
    });

    // Update form fields with selected coach details
    const avatarUpload = document.querySelector(".avatar-upload");
    const nameInput = document.querySelector('#profile-name-input');
    const personaInput = document.querySelector('#profile-description-input');
    const roleInput = document.querySelector('#profile-role-input');
    const greetingInput = document.querySelector('#profile-greeting-input');

    if (avatarUpload) avatarUpload.style.backgroundImage = `url('${selectedCoach.avatar || DEFAULT_AVATAR}')`;
    if (nameInput) nameInput.value = selectedCoach.name || '';
    if (personaInput) personaInput.value = selectedCoach.persona || '';
    if (roleInput) roleInput.value = selectedCoach.role || '';
    if (greetingInput) greetingInput.value = selectedCoach.greeting || '';
    // If there were staged languages (added before selecting a coach), merge them
    if ((!selectedCoach.languages || selectedCoach.languages.length === 0) && stagedLanguages.length > 0) {
        selectedCoach.languages = Array.from(new Set([...(selectedCoach.languages || []), ...stagedLanguages]));
        stagedLanguages.length = 0;
    }
    // Render language tags for the selected coach (or staged if empty)
    renderLanguageTags(selectedCoach.languages || stagedLanguages);

    hasUnsavedChanges = false; // Reset unsaved changes flag
  } else {
    console.error(`Coach with id ${id} not found`);
  }
}

// Handle file upload
function handleFileUpload() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file && selectedCoach) {
      const reader = new FileReader();
      reader.onload = (event) => {
        // Update the coach's avatar in data
        selectedCoach.avatar = event.target.result;
        
        // Update avatar preview
        const avatarPreview = document.querySelector(".avatar-upload");
        if (avatarPreview) {
          avatarPreview.style.backgroundImage = `url('${event.target.result}')`;
        }
        
        // Mark changes as unsaved
        hasUnsavedChanges = true;
        
        // Re-render coach list to update avatar there
        renderCoaches();
      };
      reader.readAsDataURL(file);
    }
  };
  input.click();
}

// Add new coach
function addCoach() {
  const createNewCoach = () => {
      const highestId = coaches.reduce((max, coach) => {
          const idNumber = parseInt(coach.id.replace('coach', '')) || 0;
          return Math.max(max, idNumber);
      }, 0);
      const newId = `coach${highestId + 1}`;
      const newCoach = {
          id: newId,
          name: "New Coach",
          persona: "Untitled",
          role: "undefined",
          avatar: "",
              greeting: "",
              languages: stagedLanguages.length ? Array.from(new Set(stagedLanguages)) : []
      };
      coaches.push(newCoach);
      selectedCoach = newCoach;
      renderCoaches();
      // Update form fields directly
      document.querySelector(".avatar-upload").style.backgroundImage = "";
      document.querySelector('#profile-name-input').value = newCoach.name;
      document.querySelector('#profile-description-input').value = newCoach.persona;
      document.querySelector('#profile-role-input').value = newCoach.role;
      document.querySelector('#profile-greeting-input').value = newCoach.greeting;
      hasUnsavedChanges = true; // Mark as unsaved when creating new coach
  };

  if (selectedCoach) {
      checkUnsavedChanges(createNewCoach);
  } else {
      createNewCoach();
  }
}

// Delete coach button handler
function handleDeleteCoach() {
  if (!selectedCoach) return;
  const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
  document.getElementById('confirmText').textContent = `Are you sure you want to delete ${selectedCoach.name}?`;
  document.getElementById('confirmDelete').textContent = 'Delete';
  document.getElementById('confirmDelete').classList.remove('btn-primary');
  document.getElementById('confirmDelete').classList.add('btn-danger');
  document.getElementById('discardChanges').classList.add('d-none');
  document.querySelector('#confirmModal .modal-title').textContent = 'Delete Confirmation';
  modal.show();
}

// Replace loadBotsFromServer with loadCoaches
async function loadCoachesFromServer() {
    try {
        const serverCoaches = await loadCoaches();
        if (Array.isArray(serverCoaches) && serverCoaches.length > 0) {
            coaches.length = 0;
            serverCoaches.forEach(c => coaches.push(c));
            return true;
        }
    } catch (e) {
        console.error("Failed to load coaches from server", e);
        return false;
    }
    return false;
}


// Save coach changes
async function handleSaveCoach() {
    if (!selectedCoach) return;

    // Update coach data from form
    selectedCoach.name = document.querySelector('#profile-name-input').value;
    selectedCoach.persona = document.querySelector('#profile-description-input').value;
    selectedCoach.role = document.querySelector('#profile-role-input').value;
    selectedCoach.greeting = document.querySelector('#profile-greeting-input').value;

    // Merge any staged languages into the selected coach before saving
    if (stagedLanguages.length) {
        selectedCoach.languages = Array.from(new Set([...(selectedCoach.languages || []), ...stagedLanguages]));
        stagedLanguages.length = 0;
    }

    try {
        // Save only the selected coach
        const savedCoach = await saveCoach(selectedCoach);
        // Optionally update local array with returned coach (if backend returns updated coach)
        if (savedCoach && savedCoach.id) {
            const idx = coaches.findIndex(c => c.id === savedCoach.id);
            if (idx > -1) coaches[idx] = savedCoach;
        }
        hasUnsavedChanges = false;
        renderCoaches();
        showModal();

        // Execute pending action if exists
        if (pendingAction) {
            const action = pendingAction;
            pendingAction = null;
            action();
        }
    } catch (error) {
        alert("Error saving coach data");
    }
}

async function confirmDelete() {
  if (document.getElementById('confirmDelete').textContent === 'Save') {
      // Handle save confirmation
      const modal = bootstrap.Modal.getInstance(document.getElementById('confirmModal'));
      modal.hide();
      handleSaveCoach();
  } else {
      // Handle delete confirmation
      const index = coaches.findIndex((coach) => coach.id === selectedCoach.id);
      if (index > -1) {
          try {
              // Delete coach from backend
              await deleteCoach(selectedCoach.id);
              coaches.splice(index, 1);
              selectedCoach = null;
              hasUnsavedChanges = false;
              renderCoaches();
              // Clear form
              document.querySelector(".avatar-upload").style.backgroundImage = "";
              document.querySelector('#profile-name-input').value = "";
              document.querySelector('#profile-description-input').value = "";
              document.querySelector('#profile-role-input').value = "";
              document.querySelector('#profile-greeting-input').value = "";
              showModal(); // Show success message
          } catch (error) {
              alert("Error deleting coach");
          }
      }
      const modal = bootstrap.Modal.getInstance(document.getElementById('confirmModal'));
      modal.hide();
  }
}

// Show/hide modal
function showModal() {
  const modal = new bootstrap.Modal(document.getElementById('successModal'));
  modal.show();
  setTimeout(() => modal.hide(), 2000);
}

// Check unsaved changes
function checkUnsavedChanges(callback) {
  if (hasUnsavedChanges) {
      pendingAction = callback;
      const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
      document.getElementById('confirmText').textContent = 'You have unsaved changes. What would you like to do?';
      document.getElementById('confirmDelete').textContent = 'Save';
      document.getElementById('confirmDelete').classList.remove('btn-danger');
      document.getElementById('confirmDelete').classList.add('btn-primary');
      document.getElementById('discardChanges').classList.remove('d-none');
      document.querySelector('#confirmModal .modal-title').textContent = 'Unsaved Changes';
      modal.show();
  } else {
      callback();
  }
}

// Reset form to selected coach data
async function resetFormToSelectedCoach() {
    if (!selectedCoach) return;

    if (selectedCoach.name === "New Coach") {
        const index = coaches.findIndex(c => c.id === selectedCoach.id);
        if (index > -1) {
            coaches.splice(index, 1);
        }
        selectedCoach = null;
        clearForm();
        if (coaches.length > 0) {
            selectCoach(coaches[0].id);
        }
    } else {
        await loadCoachesFromServer(); // Just load the data, no need to store result
        const originalCoach = coaches.find(c => c.id === selectedCoach.id);
        if (originalCoach) {
            selectedCoach = originalCoach;
            updateFormWithCoach(originalCoach);
        }
    }

    hasUnsavedChanges = false;
    renderCoaches();
}

function clearForm() {
    document.querySelector(".avatar-upload").style.backgroundImage = "";
    document.querySelector('#profile-name-input').value = '';
    document.querySelector('#profile-description-input').value = '';
    document.querySelector('#profile-role-input').value = '';
    document.querySelector('#profile-greeting-input').value = '';
    renderLanguageTags([]);
}

function updateFormWithCoach(coach) {
    document.querySelector(".avatar-upload").style.backgroundImage = `url('${coach.avatar || DEFAULT_AVATAR}')`;
    document.querySelector('#profile-name-input').value = coach.name || '';
    document.querySelector('#profile-description-input').value = coach.persona || '';
    document.querySelector('#profile-role-input').value = coach.role || '';
    document.querySelector('#profile-greeting-input').value = coach.greeting || '';
}

// Track form changes
function setupFormChangeTracking() {
    // Track input fields and textarea
    const inputs = document.querySelectorAll('#profile-name-input, #profile-role-input, #profile-description-input, #profile-greeting-input');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            if (selectedCoach) {
                hasUnsavedChanges = true;
            }
        });
    });
}

// --- Language tags helper ---
// List of supported languages (ISO 639-1 code and display name)
const ISO_SUGGESTIONS = [
    { code: 'en', name: 'English' },
    { code: 'de', name: 'German' },
    { code: 'uk', name: 'Ukrainian' },
    { code: 'sv', name: 'Swedish' },
    { code: 'ro', name: 'Romanian' },
    { code: 'fr', name: 'French' },
    { code: 'es', name: 'Spanish' },
    { code: 'it', name: 'Italian' },
    { code: 'nl', name: 'Dutch' },
    { code: 'pl', name: 'Polish' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' }
];

function getNameForCode(code) {
    if (!code) return '';
    const found = ISO_SUGGESTIONS.find(o => o.code === code.toLowerCase());
    return found ? found.name : code;
}

// Return a relative path to the flag icon for a given ISO code.
// Uses the project's flag-icons assets folder; file may 404 if not present but that's acceptable.
function getFlagPath(code) {
    if (!code) return '';
    // flag-icons uses country codes; language codes may match country codes for many cases
    // Use the 1x1 SVGs under css/assets/flag-icons/flags/1x1
    return `css/assets/flag-icons/flags/1x1/${code.toLowerCase()}.svg`;
}

function findCodeForInput(input) {
    if (!input) return null;
    const v = input.trim().toLowerCase();
    // direct code match
    const byCode = ISO_SUGGESTIONS.find(o => o.code === v);
    if (byCode) return byCode.code;
    // name startsWith
    const byNameStart = ISO_SUGGESTIONS.find(o => o.name.toLowerCase().startsWith(v));
    if (byNameStart) return byNameStart.code;
    // name contains
    const byNameContains = ISO_SUGGESTIONS.find(o => o.name.toLowerCase().includes(v));
    if (byNameContains) return byNameContains.code;
    return null;
}

function renderLanguageTags(tags) {
    const container = document.getElementById('profile-languages-tags');
    if (!container) return;
    container.innerHTML = '';
    tags.forEach(code => {
        const el = document.createElement('span');
        el.className = 'badge bg-secondary me-1 mb-1';
        // show friendly name with flag icon, but keep code in data-lang
    // Use CSS background flag helper (flag-icons) when available
    const flagSpan = document.createElement('span');
    flagSpan.className = `fi fi-${code.toLowerCase()}`;
    // ensure visual size matches previous layout
    flagSpan.style.width = '18px';
    flagSpan.style.height = '12px';
    flagSpan.style.display = 'inline-block';
    flagSpan.style.verticalAlign = 'middle';
    flagSpan.style.marginRight = '6px';
    el.appendChild(flagSpan);
    const text = document.createTextNode(`${getNameForCode(code)} (${code})`);
    el.appendChild(text);
        el.setAttribute('data-lang', code);
    const close = document.createElement('button');
    close.type = 'button';
    // Use a visible textual close button so it's always readable on custom badges
    close.className = 'btn btn-sm btn-light btn-close-text ms-2';
    close.setAttribute('aria-label', `Remove ${code}`);
    close.textContent = '×';
    // subtle styling to fit inside the badge
    close.style.padding = '0 6px';
    close.style.lineHeight = '1';
    close.style.fontSize = '0.85rem';
    close.style.opacity = '0.9';
    close.addEventListener('click', () => removeLanguageTag(code));
        el.appendChild(close);
        container.appendChild(el);
    });
}

function addLanguageTag(input) {
    if (!input) return;
    // Allow adding tags even if no coach is currently selected (staged)
    // Allow either code or full name input
    let code = findCodeForInput(input);
    if (!code) {
        const candidate = input.trim().toLowerCase();
        if (/^[a-z]{2}$/.test(candidate)) code = candidate; // accept unknown 2-letter code
    }
    if (!code) return; // couldn't resolve
    if (selectedCoach) {
        selectedCoach.languages = selectedCoach.languages || [];
        if (!selectedCoach.languages.includes(code)) {
            selectedCoach.languages.push(code);
            hasUnsavedChanges = true;
            renderLanguageTags(selectedCoach.languages);
        }
    } else {
        // stage the language for later when a coach is selected
        if (!stagedLanguages.includes(code)) {
            stagedLanguages.push(code);
            renderLanguageTags(stagedLanguages);
        }
    }
}

function removeLanguageTag(code) {
    if (selectedCoach && selectedCoach.languages) {
        const idx = selectedCoach.languages.indexOf(code);
        if (idx > -1) {
            selectedCoach.languages.splice(idx, 1);
            hasUnsavedChanges = true;
            renderLanguageTags(selectedCoach.languages);
        }
    } else {
        const idx = stagedLanguages.indexOf(code);
        if (idx > -1) {
            stagedLanguages.splice(idx, 1);
            renderLanguageTags(stagedLanguages);
        }
    }
}

function setupLanguageInput() {
    const input = document.getElementById('profile-languages-input');
    const suggestions = document.getElementById('profile-languages-suggestions');
    if (!input) return;

    // Ensure suggestions element exists; create if missing
    let sugEl = suggestions;
    if (!sugEl) {
        sugEl = document.createElement('div');
        sugEl.id = 'profile-languages-suggestions';
        // basic classes to match expected styling
        sugEl.className = 'list-group position-absolute w-100 d-none';
        if (input.parentNode) input.parentNode.insertBefore(sugEl, input.nextSibling);
    }

    input.addEventListener('input', () => {
        const v = input.value.trim().toLowerCase();
        if (!v) { if (sugEl) sugEl.classList.add('d-none'); return; }
        // match by code or name (objects in ISO_SUGGESTIONS)
        const matches = ISO_SUGGESTIONS.filter(s => {
            const codeMatch = s.code.startsWith(v);
            const nameMatch = s.name.toLowerCase().startsWith(v) || s.name.toLowerCase().includes(v);
            const already = selectedCoach && selectedCoach.languages && selectedCoach.languages.includes(s.code);
            return (codeMatch || nameMatch) && !already;
        });
        if (!sugEl) return;
        sugEl.innerHTML = '';
        if (matches.length === 0) { sugEl.classList.add('d-none'); return; }
        matches.forEach(m => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'list-group-item list-group-item-action d-flex align-items-center';
            // flag span
            const f = document.createElement('span');
            f.className = `fi fi-${m.code}`;
            f.style.width = '18px';
            f.style.height = '12px';
            f.style.display = 'inline-block';
            f.style.marginRight = '8px';
            item.appendChild(f);
            // text
            const t = document.createTextNode(`${m.name} (${m.code})`);
            item.appendChild(t);
            item.addEventListener('click', () => {
                // pass ISO code to addLanguageTag
                addLanguageTag(m.code);
                input.value = '';
                sugEl.classList.add('d-none');
            });
            sugEl.appendChild(item);
        });
        sugEl.classList.remove('d-none');
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addLanguageTag(input.value);
            input.value = '';
            if (sugEl) sugEl.classList.add('d-none');
        }
    });

    document.addEventListener('click', (e) => {
        try {
            if (sugEl && !sugEl.contains(e.target) && e.target !== input) {
                sugEl.classList.add('d-none');
            }
        } catch (err) {
            // defensive: ignore any DOM errors
        }
    });
}

// Add event listeners
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const loadedCoaches = await loadCoaches();
        if (Array.isArray(loadedCoaches)) {
            coaches = loadedCoaches;
            renderCoaches();
            if (coaches.length > 0) {
                selectCoach(coaches[0].id);
            }
        } else {
            throw new Error('Invalid coaches data');
        }
    } catch (error) {
        console.error('Error loading coaches:', error);
        document.querySelector('.chatbot-list').innerHTML = `
            <div class="alert alert-danger">
                Failed to load coaches. Please try refreshing the page.
            </div>
        `;
    }

    document.querySelector(".upload-btn")?.addEventListener("click", handleFileUpload);
    document.querySelector("button.btn-primary.w-100")?.addEventListener("click", addCoach);
    document.getElementById("saveBtn")?.addEventListener("click", handleSaveCoach);
    document.getElementById("deleteBtn")?.addEventListener("click", handleDeleteCoach);
    document.getElementById("closeModal")?.addEventListener("click", () => {
        const modal = bootstrap.Modal.getInstance(document.getElementById("successModal"));
        if (modal) modal.hide();
    });
    document.getElementById("confirmDelete")?.addEventListener("click", confirmDelete);
    document.getElementById("cancelDelete")?.addEventListener("click", () => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('confirmModal'));
        if (modal) modal.hide();
        document.getElementById('confirmDelete').textContent = 'Delete';
        if (pendingAction) {
            pendingAction = null;
            if (selectedCoach) {
                renderCoaches();
            }
        }
    });
    document.getElementById("discardChanges")?.addEventListener("click", async () => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('confirmModal'));
        if (modal) modal.hide();
        if (pendingAction) {
            const loaded = await loadCoachesFromServer();
            resetFormToSelectedCoach();
            const action = pendingAction;
            pendingAction = null;
            action();
        }
    });

    // Ensure role selector updates selectedCoach.role immediately
    document.getElementById('profile-role-input')?.addEventListener('change', function() {
        if (selectedCoach) {
            selectedCoach.role = this.value;
            hasUnsavedChanges = true;
        }
    });

    // Initialize language autocomplete input
    try {
        setupLanguageInput();
    } catch (err) {
        console.error('Failed to initialize language input', err);
    }
});