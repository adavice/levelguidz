// Attach modal triggers for nav and hero button
export function setupCoachSelectorTriggers() {
    initCoachSelectorModal();
    // Nav link
    const coachingLink = document.getElementById('coachingNavLink');
    if (coachingLink) {
        coachingLink.addEventListener('click', function(e) {
            e.preventDefault();
            showCoachSelectorModal();
        });
    }
    // Hero CTA button
    const chooseCoachBtn = document.getElementById('chooseCoachBtn');
    if (chooseCoachBtn) {
        chooseCoachBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showCoachSelectorModal();
        });
    }
}
// coachSelector.js
// Renders and manages the game/coach selection modal for reuse on any page
// Usage: import { showCoachSelectorModal, initCoachSelectorModal } from './coachSelector.js';
// Then call initCoachSelectorModal() on page load, and showCoachSelectorModal() to open the modal

import { getCurrentUser, loadCoaches } from './clientApi.js';

const games = [
    { key: 'tft', name: 'Teamfight Tactics', genre: 'Auto Battler', img: 'img/game-tft.jpg' },
    { key: 'lol', name: 'League of Legends', genre: 'MOBA', img: 'img/game-lol.jpg' },
    { key: 'valorant', name: 'Valorant', genre: 'Tactical Shooter', img: 'img/game-valorant.jpg' },
    { key: 'fifa24', name: 'EA Sports FC 24', genre: 'Sports', img: 'img/game-fifa24.jpg' },
    { key: 'dota2', name: 'Dota 2', genre: 'MOBA', img: 'img/game-dota2.jpg' },
    { key: 'cs2', name: 'Counter-Strike 2', genre: 'Tactical Shooter', img: 'img/game-cs2.jpg' },
    { key: 'apex', name: 'Apex Legends', genre: 'Battle Royale', img: 'img/game-apex.jpg' },
    { key: 'fifa23', name: 'FIFA 23', genre: 'Sports', img: 'img/game-fifa23.jpg' }
];

function sortCoachesByRole(coaches) {
    return coaches.slice().sort((a, b) => {
        if (!a.role && !b.role) return 0;
        if (!a.role) return 1;
        if (!b.role) return -1;
        return a.role.localeCompare(b.role, undefined, { sensitivity: 'base' });
    });
}

function renderGamesList() {
    const gamesList = document.getElementById('gamesList');
    if (!gamesList) return;
    gamesList.innerHTML = games.map((game, idx) => `
        <button class="list-group-item list-group-item-action d-flex align-items-center gap-3${idx === 0 ? ' active' : ''}" data-game="${game.key}">
            <img src="${game.img}" alt="${game.name}" width="50" height="50" class="rounded">
            <div>
                <h6 class="mb-0">${game.name}</h6>
                <small class="text-muted">${game.genre}</small>
            </div>
        </button>
    `).join('');
}

async function renderCoachesInModal(gameKey) {
    const coachesList = document.getElementById('coachesList');
    if (!coachesList) return;
    const user = getCurrentUser();
    if (!user || !user.username) {
        coachesList.innerHTML = `
            <div class="text-center py-4 w-100">
                <div class="mb-3 text-muted">Please log in to view the list of available coaches.</div>
                <a id="loginModalBtn" href="index.html#login" class="btn btn-primary">Go to Login</a>
            </div>
        `;
        setTimeout(() => {
            const loginBtn = document.getElementById('loginModalBtn');
            if (loginBtn) {
                loginBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    const isIndex = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '';
                    if (isIndex) {
                        // Just close the modal and scroll to login section
                        const modalInstance = bootstrap.Modal.getInstance(document.getElementById('gameCoachModal'));
                        if (modalInstance) modalInstance.hide();
                        setTimeout(() => {
                            const loginEl = document.getElementById('login');
                            if (loginEl) {
                                loginEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        }, 400);
                    } else {
                        // Redirect to index.html#login
                        window.location.href = 'index.html#login';
                    }
                });
            }
        }, 0);
        return;
    }
    coachesList.innerHTML = '<div class="text-muted">Loading coaches...</div>';
    try {
        const coaches = await loadCoaches();
        let genre = null;
        if (gameKey) {
            const game = games.find(g => g.key === gameKey);
            genre = game ? game.genre : null;
        }
        let filtered = Array.isArray(coaches)
            ? coaches.filter(coach =>
        !genre ||
        (coach.role && (coach.role.toLowerCase() === genre.toLowerCase() || coach.role.toLowerCase() === 'gaming'))
              )
            : [];
        filtered = sortCoachesByRole(filtered);
        if (filtered.length === 0) {
            coachesList.innerHTML = '<div class="text-muted">No coaches found for this game.</div>';
            return;
        }
        coachesList.innerHTML = filtered.map(coach => `
            <div class="col-md-6">
                <div class="coach-card border p-3 rounded d-flex gap-3 align-items-center coach-selectable" data-coach-id="${coach.id}">
                    <img src="${coach.avatar || 'img/default-avatar.png'}" alt="${coach.name}" width="60" height="60" class="rounded-circle">
                    <div>
                        <h6 class="mb-1">${coach.name}</h6>
                        <small class="text-muted">${coach.role || ''} expert</small>
                        <div class="mt-1">
                            <span class="badge bg-primary">${coach.status || 'online'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        coachesList.querySelectorAll('.coach-selectable').forEach(card => {
            card.addEventListener('click', function() {
                const coachId = this.getAttribute('data-coach-id');
                if (coachId) {
                    window.location.href = `chat.html?coach=${encodeURIComponent(coachId)}`;
                }
            });
        });
    } catch (err) {
        coachesList.innerHTML = '<div class="text-danger">Failed to load coaches.</div>';
    }
}

function ensureModalHtml() {
    if (document.getElementById('gameCoachModal')) return;
    const modalHtml = `
    <div class="modal fade" id="gameCoachModal" tabindex="-1">
        <div class="modal-dialog modal-xl modal-dialog-centered">
            <div class="modal-content bg-dark">
                <div class="modal-header border-secondary">
                    <h5 class="modal-title">Select Game & Coach</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-0">
                    <div class="row g-0">
                        <div class="col-md-4 border-end border-secondary">
                            <div class="list-group list-group-flush" id="gamesList"></div>
                        </div>
                        <div class="col-md-8">
                            <div class="p-4">
                                <div class="row g-4" id="coachesList"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

export function showCoachSelectorModal() {
    ensureModalHtml();
    renderGamesList();
    const gamesList = document.getElementById('gamesList');
    if (gamesList) {
        let activeBtn = gamesList.querySelector('.list-group-item.active');
        let initialGame = activeBtn ? activeBtn.getAttribute('data-game') : null;
        renderCoachesInModal(initialGame);
        gamesList.addEventListener('click', e => {
            const btn = e.target.closest('.list-group-item');
            if (!btn) return;
            gamesList.querySelectorAll('.list-group-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderCoachesInModal(btn.getAttribute('data-game'));
        }, { once: true });
    }
    const modal = new bootstrap.Modal(document.getElementById('gameCoachModal'));
    modal.show();
}

export function initCoachSelectorModal() {
    ensureModalHtml();
    renderGamesList();
    const gamesList = document.getElementById('gamesList');
    if (gamesList) {
        let activeBtn = gamesList.querySelector('.list-group-item.active');
        let initialGame = activeBtn ? activeBtn.getAttribute('data-game') : null;
        renderCoachesInModal(initialGame);
        gamesList.addEventListener('click', e => {
            const btn = e.target.closest('.list-group-item');
            if (!btn) return;
            gamesList.querySelectorAll('.list-group-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderCoachesInModal(btn.getAttribute('data-game'));
        });
    }
}
