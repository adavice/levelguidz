import { loadCoaches, saveCoach, deleteCoach } from './adminApi.js';
import { DEFAULT_AVATAR } from './constants.js';

let coaches = []; // Initialize empty array
let selectedCoach = null;
let hasUnsavedChanges = false;
let pendingAction = null;

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
          greeting: ""
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
});