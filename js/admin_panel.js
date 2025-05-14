import { loadCoaches, saveCoaches, saveCoach, deleteCoach } from './clientApi.js';

const DEFAULT_AVATAR = "https://img.vodonet.net/FM4Ek6rlSokBakd.png";

// Dummy bots data (single source of truth)
const dummyBots = [
  {
    id: 1,
    name: "JungleHeart",
    persona: "JungleHeart is a grizzled MOBA veteran and strategic coach with over a decade of experience in games like League of Legends and Dota 2. He speaks like a real person, often pausing to think before responding. His tone is calm, experienced, and slightly blunt — never toxic, but not afraid to call out mistakes. He uses phrases like 'Back in Season 3...' or 'classic -3 tempo swing' and often refers to past metas or pro matches. He responds with deliberate timing, taking 2–5 seconds before answering to simulate real thought, and uses ellipses or short phrases like 'hmm...', 'hold on...', or 'let’s rewind that...' to mimic natural hesitation. His focus is on coaching, analyzing gameplay decisions, and helping the user improve with realistic, scenario-based feedback. Never replies instantly — always sounds like he's mentally reviewing a VOD before speaking.",
    role: "MOBA Coach",
    avatar: "https://img.vodonet.net/gTt20tRkcKcdVwz.jpg",
    greeting: "Hello! I'm ready to help you improve in League of Legends and DOTA!"
  },
  {
    id: 2,
    name: "Coach 2",
    persona: " Expert in FPS Coach (e.g., Counter-Strike: Global Offensive, Call of Duty, Overwatch etc.)",
    role: "FPS Coach",
    avatar: DEFAULT_AVATAR,
    greeting: ""
  },
  {
    id: 3,
    name: "Coach 3",
    persona: "Expert in Racing/Simulation Coach (e.g., Forza, Gran Turismo, iRacing etc.)",
    role: "Racing/Simulation Coach",
    avatar: DEFAULT_AVATAR,
    greeting: ""
  },
  {
    id: 4,
    name: "Coach 4",
    persona: "Expert in Battle Royale Coach (e.g., Fortnite, Apex Legends, PUBG etc.)",
    role: "Battle Royale Coach",
    avatar: DEFAULT_AVATAR,
    greeting: ""
  },
  {
    id: 5,
    name: "Coach 5",
    persona: "Expert in Sandbox/Survival Games Coach (e.g., Minecraft, Terraria, Ark: Survival Evolved etc.)",
    role: "Sandbox/Survival Coach",
    avatar: DEFAULT_AVATAR,
    greeting: ""
  },
];

// Use bots as the working array, but always clone from dummyBots if needed
let bots = dummyBots.map(b => ({ ...b }));

let selectedBot = null;
let hasUnsavedChanges = false;
let pendingAction = null;

// Render bot list
function renderBots() {
  const botList = document.querySelector(".chatbot-list");
  if (!botList) return;
  
  botList.innerHTML = bots
    .map(
      (bot) => `
          <div class="bot-item p-3 mb-2 ${
            selectedBot?.id === bot.id ? "active" : ""
          }" onclick="selectBot(${bot.id})">
              <div class="d-flex align-items-center">
                  <div class="bot-item-avatar me-3" style="background-image: url('${bot.avatar || DEFAULT_AVATAR}')"></div>
                  <div>
                      <h6 class="mb-1 fw-semibold">${bot.name}</h6>
                      <p class="text-muted small mb-0">${bot.role}</p>
                  </div>
              </div>
          </div>
      `
    )
    .join("");
}

// Select bot and populate edit form
function selectBot(id) {
  if (selectedBot?.id === id) return;
  
  const selectNewBot = () => {
      const targetBot = bots.find((bot) => bot.id === id);
      if (targetBot) {
          // If current bot is new and unchanged, remove it
          if (selectedBot?.name === "New Coach" && selectedBot?.persona === "Untitled") {
              const index = bots.findIndex(b => b.id === selectedBot.id);
              if (index > -1) {
                  bots.splice(index, 1);
              }
          }
          selectedBot = targetBot;
          document.querySelector(".avatar-upload").style.backgroundImage = `url('${selectedBot.avatar}')`;
          document.querySelector('#profile-name-input').value = selectedBot.name;
          document.querySelector('#profile-description-input').value = selectedBot.persona;
          document.querySelector('#profile-role-input').value = selectedBot.role;
          document.querySelector('#profile-greeting-input').value = selectedBot.greeting;
          hasUnsavedChanges = false;
          renderBots();
      }
  };

  if (selectedBot && hasUnsavedChanges) {
      checkUnsavedChanges(selectNewBot);
  } else {
      selectNewBot();
  }
}

// Handle file upload
function handleFileUpload() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file && selectedBot) {
      const reader = new FileReader();
      reader.onload = (event) => {
        // Update the bot's avatar in data
        selectedBot.avatar = event.target.result;
        
        // Update avatar preview
        const avatarPreview = document.querySelector(".avatar-upload");
        if (avatarPreview) {
          avatarPreview.style.backgroundImage = `url('${event.target.result}')`;
        }
        
        // Mark changes as unsaved
        hasUnsavedChanges = true;
        
        // Re-render bot list to update avatar there
        renderBots();
      };
      reader.readAsDataURL(file);
    }
  };
  input.click();
}

// Add new bot
function addBot() {
  const createNewBot = () => {
      const newId = bots.length > 0 ? Math.max(...bots.map((b) => b.id)) + 1 : 1;
      const newBot = {
          id: newId,
          name: "New Coach",
          persona: "Untitled",
          role: "undefined",
          avatar: DEFAULT_AVATAR,
          greeting: ""
      };
      bots.push(newBot);
      selectedBot = newBot;
      renderBots();
      // Update form fields directly
      document.querySelector(".avatar-upload").style.backgroundImage = `url('${DEFAULT_AVATAR}')`;
      document.querySelector('#profile-name-input').value = newBot.name;
      document.querySelector('#profile-description-input').value = newBot.persona;
      document.querySelector('#profile-role-input').value = newBot.role;
      document.querySelector('#profile-greeting-input').value = newBot.greeting;
      hasUnsavedChanges = true; // Mark as unsaved when creating new bot
  };

  if (selectedBot) {
      checkUnsavedChanges(createNewBot);
  } else {
      createNewBot();
  }
}

// Delete bot
function deleteBot() {
  if (!selectedBot) return;
  const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
  document.getElementById('confirmText').textContent = `Are you sure you want to delete ${selectedBot.name}?`;
  document.getElementById('confirmDelete').textContent = 'Delete';
  document.getElementById('confirmDelete').classList.remove('btn-primary');
  document.getElementById('confirmDelete').classList.add('btn-danger');
  document.getElementById('discardChanges').classList.add('d-none');
  document.querySelector('#confirmModal .modal-title').textContent = 'Delete Confirmation';
  modal.show();
}

// Replace loadBotsFromServer with loadCoaches
async function loadBotsFromServer() {
    try {
        const serverCoaches = await loadCoaches();
        if (Array.isArray(serverCoaches) && serverCoaches.length > 0) {
            bots.length = 0;
            serverCoaches.forEach(b => bots.push(b));
            return true;
        }
    } catch (e) {
        // Ignore error, fallback will be handled by caller
    }
    return false;
}

// Replace saveBotsToServer with saveCoaches
async function saveBotsToServer(botsArray) {
    return saveCoaches(botsArray);
}

// Replace saveBotToServer with saveCoach
async function saveBotToServer(bot) {
    return saveCoach(bot);
}

// Replace deleteBotFromServer with deleteCoach
async function deleteBotFromServer(id) {
    return deleteCoach(id);
}

// Save bot changes
async function saveBot() {
  if (!selectedBot) return;

  // Update bot data from form
  selectedBot.name = document.querySelector('#profile-name-input').value;
  selectedBot.persona = document.querySelector('#profile-description-input').value;
  selectedBot.role = document.querySelector('#profile-role-input').value;
  selectedBot.greeting = document.querySelector('#profile-greeting-input').value;

  try {
      await saveBotsToServer(bots);
      hasUnsavedChanges = false;
      renderBots();
      showModal();

      // Execute pending action if exists
      if (pendingAction) {
          const action = pendingAction;
          pendingAction = null;
          action();
      }
  } catch (error) {
      alert("Error saving bot data");
  }
}

async function confirmDelete() {
  if (document.getElementById('confirmDelete').textContent === 'Save') {
      // Handle save confirmation
      const modal = bootstrap.Modal.getInstance(document.getElementById('confirmModal'));
      modal.hide();
      saveBot();
  } else {
      // Handle delete confirmation
      const index = bots.findIndex((bot) => bot.id === selectedBot.id);
      if (index > -1) {
          try {
              bots.splice(index, 1);
              await saveBotsToServer(bots);
              selectedBot = null;
              hasUnsavedChanges = false;
              renderBots();
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

// Reset form to selected bot data
async function resetFormToSelectedBot() {
    if (!selectedBot) return;

    if (selectedBot.name === "New Coach") {
        const index = bots.findIndex(b => b.id === selectedBot.id);
        if (index > -1) {
            bots.splice(index, 1);
        }
        selectedBot = null;
        clearForm();
        if (bots.length > 0) {
            selectBot(bots[0].id);
        }
    } else {
        const loaded = await loadBotsFromServer();
        if (!loaded) {
            bots = dummyBots.map(b => ({ ...b }));
        }
        // Find and select the original bot
        const originalBot = bots.find(b => b.id === selectedBot.id);
        if (originalBot) {
            selectedBot = originalBot;
            updateFormWithBot(originalBot);
        }
    }

    hasUnsavedChanges = false;
    renderBots();
}

function clearForm() {
    document.querySelector(".avatar-upload").style.backgroundImage = `url('${DEFAULT_AVATAR}')`;
    document.querySelector('#profile-name-input').value = '';
    document.querySelector('#profile-description-input').value = '';
    document.querySelector('#profile-role-input').value = '';
    document.querySelector('#profile-greeting-input').value = '';
}

function updateFormWithBot(bot) {
    document.querySelector(".avatar-upload").style.backgroundImage = `url('${bot.avatar || DEFAULT_AVATAR}')`;
    document.querySelector('#profile-name-input').value = bot.name || '';
    document.querySelector('#profile-description-input').value = bot.persona || '';
    document.querySelector('#profile-role-input').value = bot.role || '';
    document.querySelector('#profile-greeting-input').value = bot.greeting || '';
}

// Track form changes
function setupFormChangeTracking() {
    // Track input fields and textarea
    const inputs = document.querySelectorAll('#profile-name-input, #profile-role-input, #profile-description-input, #profile-greeting-input');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            if (selectedBot) {
                hasUnsavedChanges = true;
            }
        });
    });
}

// Add event listeners
document.addEventListener('DOMContentLoaded', async () => {
    document.querySelector(".upload-btn")?.addEventListener("click", handleFileUpload);
    document.querySelector("button.btn-primary.w-100")?.addEventListener("click", addBot);
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
            if (selectedBot) {
                renderBots();
            }
        }
    });
    document.getElementById("discardChanges")?.addEventListener("click", async () => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('confirmModal'));
        if (modal) modal.hide();
        if (pendingAction) {
            const loaded = await loadBotsFromServer();
            if (!loaded) {
                bots = dummyBots.map(b => ({ ...b }));
            }
            resetFormToSelectedBot();
            const action = pendingAction;
            pendingAction = null;
            action();
        }
    });
    
    let loadedFromServer = await loadBotsFromServer();
    if (!loadedFromServer) {
        bots = dummyBots.map(b => ({ ...b }));
        console.log('Using dummy bots array');
    }

    renderBots();
    setupFormChangeTracking();
    if (bots.length > 0) {
        selectBot(bots[0].id);
    }
});

// Helper to restore dummy bots array and UI
function fallbackToDummyBots() {
    bots = dummyBots.map(b => ({ ...b }));
    renderBots();
    clearForm();
    if (bots.length > 0) {
        selectBot(bots[0].id);
    }
}