import { loadCoaches, saveCoaches, saveCoach as saveCoachApi, deleteCoach as deleteCoachApi, dummyCoaches } from './clientApi.js';

const DEFAULT_AVATAR = "https://img.vodonet.net/FM4Ek6rlSokBakd.png";

// Use coaches as the working array, but always clone from dummyCoaches if needed
let coaches = dummyCoaches.map(c => ({ ...c })); // Initialize with dummy data
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
                      <p class="text-muted small mb-0">${coach.role}</p>
                  </div>
              </div>
          </div>
      `
    )
    .join("");

  // Add click listeners after rendering
  document.querySelectorAll('.coach-item').forEach(item => {
    item.addEventListener('click', () => selectCoach(parseInt(item.dataset.id)));
  });
}

// Select coach and populate edit form
function selectCoach(id) {
  if (selectedCoach?.id === id) return;
  
  const selectNewCoach = () => {
      const targetCoach = coaches.find((coach) => coach.id === id);
      if (targetCoach) {
          // If current coach is new and unchanged, remove it
          if (selectedCoach?.name === "New Coach" && selectedCoach?.persona === "Untitled") {
              const index = coaches.findIndex(c => c.id === selectedCoach.id);
              if (index > -1) {
                  coaches.splice(index, 1);
              }
          }
          selectedCoach = targetCoach;
          document.querySelector(".avatar-upload").style.backgroundImage = `url('${selectedCoach.avatar}')`;
          document.querySelector('#profile-name-input').value = selectedCoach.name;
          document.querySelector('#profile-description-input').value = selectedCoach.persona;
          document.querySelector('#profile-role-input').value = selectedCoach.role;
          document.querySelector('#profile-greeting-input').value = selectedCoach.greeting;
          hasUnsavedChanges = false;
          renderCoaches();
      }
  };

  if (selectedCoach && hasUnsavedChanges) {
      checkUnsavedChanges(selectNewCoach);
  } else {
      selectNewCoach();
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
      const newId = coaches.length > 0 ? Math.max(...coaches.map((c) => c.id)) + 1 : 1;
      const newCoach = {
          id: newId,
          name: "New Coach",
          persona: "Untitled",
          role: "undefined",
          avatar: DEFAULT_AVATAR,
          greeting: ""
      };
      coaches.push(newCoach);
      selectedCoach = newCoach;
      renderCoaches();
      // Update form fields directly
      document.querySelector(".avatar-upload").style.backgroundImage = `url('${DEFAULT_AVATAR}')`;
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
        console.error("Failed to load coaches from server, using dummy data", e);
        return false;
    }
    return false;
}

// Replace saveBotToServer with saveCoach
async function saveCoachToServer(coach) {
    return saveCoachApi(coach);
}

// Replace deleteBotFromServer with deleteCoach
async function deleteCoachFromServer(id) {
    return deleteCoachApi(id);
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
        await saveCoaches(coaches);
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
              coaches.splice(index, 1);
              await saveCoaches(coaches);
              selectedCoach = null;
              hasUnsavedChanges = false;
              renderCoaches();
              // Clear form
              document.querySelector(".avatar-upload").style.backgroundImage = `url('${DEFAULT_AVATAR}')`;
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
        const loaded = await loadCoachesFromServer();
        if (!loaded) {
            coaches = dummyCoaches.map(c => ({ ...c }));
        }
        // Find and select the original coach
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
    document.querySelector(".avatar-upload").style.backgroundImage = `url('${DEFAULT_AVATAR}')`;
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
            if (!loaded) {
                coaches = dummyCoaches.map(c => ({ ...c }));
            }
            resetFormToSelectedCoach();
            const action = pendingAction;
            pendingAction = null;
            action();
        }
    });
    
    let loadedFromServer = await loadCoachesFromServer();
    if (!loadedFromServer) {
        coaches = dummyCoaches.map(c => ({ ...c }));
        console.log('Using dummy coaches array');
    }

    renderCoaches();
    setupFormChangeTracking();
    if (coaches.length > 0) {
        selectCoach(coaches[0].id);
    }
});

// Helper to restore dummy coaches array and UI
function fallbackToDummyCoaches() {
    coaches = dummyCoaches.map(c => ({ ...c }));
    renderCoaches();
    clearForm();
    if (coaches.length > 0) {
        selectCoach(coaches[0].id);
    }
}