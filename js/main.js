import { getCurrentUser, loadCoaches } from './clientApi.js';

document.addEventListener('DOMContentLoaded', function() {
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Update login button based on auth state
    const user = getCurrentUser();
    if (user) {
        // Show username dropdown, hide login button
        document.getElementById('loginButton')?.classList.add('d-none');
        const userDropdown = document.getElementById('userDropdown');
        const usernamePlaceholder = document.getElementById('usernamePlaceholder');
        
        if (userDropdown && usernamePlaceholder) {
            userDropdown.classList.remove('d-none');
            usernamePlaceholder.textContent = user.username;
        }
    }

    // Handle admin section
    if (user?.isAdmin) {
        const navbarNav = document.querySelector('.navbar-nav');
        const adminLink = document.createElement('li');
        adminLink.className = 'nav-item nav-admin';
        adminLink.innerHTML = `
            <a class="nav-link" href="./admin_panel.html" style="color: var(--primary-color); font-weight: 500;">
                <i class="bi bi-shield-lock"></i> Admin
            </a>
        `;
        navbarNav.appendChild(adminLink);
    }

    // Helper to sort coaches by role (alphabetically, or customize as needed)
    function sortCoachesByRole(coaches) {
        return coaches.slice().sort((a, b) => {
            if (!a.role && !b.role) return 0;
            if (!a.role) return 1;
            if (!b.role) return -1;
            return a.role.localeCompare(b.role, undefined, { sensitivity: 'base' });
        });
    }

    // Render coaches in the modal coachesList based on selected game
    async function renderCoachesInModal(gameKey) {
        const coachesList = document.getElementById('coachesList');
        if (!coachesList) return;
        // Check if user is NOT logged in
        const user = getCurrentUser();
        if (!user) {
            coachesList.innerHTML = `
                <div class="text-center py-4 w-100">
                    <div class="mb-3 text-muted">Please log in to view the list of available coaches.</div>
                    <a id="loginModalBtn" href="#login" class="btn btn-primary">Go to Login</a>
                </div>
            `;
            setTimeout(() => {
                const loginBtn = document.getElementById('loginModalBtn');
                if (loginBtn) {
                    loginBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        const modal = document.querySelector('#gameCoachModal .modal-content');
                        if (modal) {
                            modal.style.transition = 'opacity 0.5s';
                            modal.style.opacity = '0';
                        }
                        setTimeout(() => {
                            // Close the modal first
                            const modalInstance = bootstrap.Modal.getInstance(document.getElementById('gameCoachModal'));
                            if (modalInstance) {
                                modalInstance.hide();
                            }
                            // Wait for modal to close, then scroll
                            setTimeout(() => {
                                const loginEl = document.getElementById('login');
                                if (loginEl) {
                                    loginEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                                // Restore modal opacity for next open
                                if (modal) {
                                    modal.style.opacity = '1';
                                }
                            }, 400);
                        }, 500);
                    });
                }
            }, 0);
            return;
        }
        coachesList.innerHTML = '<div class="text-muted">Loading coaches...</div>';

        try {
            const coaches = await loadCoaches();
            // Find the genre for the selected game
            let genre = null;
            if (gameKey) {
                const game = games.find(g => g.key === gameKey);
                genre = game ? game.genre : null;
            }
            // Filter coaches by role: show those with matching genre or "all"
            let filtered = Array.isArray(coaches)
                ? coaches.filter(coach =>
                    !genre ||
                    (coach.role && (coach.role.toLowerCase() === genre.toLowerCase() || coach.role.toLowerCase() === 'all'))
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
            // Add click event to each coach card for redirect
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

    // Games array for modal
    const games = [
        {
            key: 'tft',
            name: 'Teamfight Tactics',
            genre: 'Auto Battler', // matches "Auto Battler expert"
            img: 'img/game-tft.jpg'
        },
        {
            key: 'lol',
            name: 'League of Legends',
            genre: 'MOBA', // matches "MOBA expert"
            img: 'img/game-lol.jpg'
        },
        {
            key: 'valorant',
            name: 'Valorant',
            genre: 'Tactical Shooter', // matches "Tactical Shooter expert"
            img: 'img/game-valorant.jpg'
        },
        {
            key: 'fifa24',
            name: 'EA Sports FC 24',
            genre: 'Sports', // matches "Sports expert"
            img: 'img/game-fifa24.jpg'
        },
        {
            key: 'dota2',
            name: 'Dota 2',
            genre: 'MOBA', // matches "MOBA expert"
            img: 'img/game-dota2.jpg'
        },
        {
            key: 'cs2',
            name: 'Counter-Strike 2',
            genre: 'Tactical Shooter', // matches "Tactical Shooter expert"
            img: 'img/game-cs2.jpg'
        },
        {
            key: 'apex',
            name: 'Apex Legends',
            genre: 'Battle Royale', // matches "Battle Royale expert"
            img: 'img/game-apex.jpg'
        },
        {
            key: 'fifa23',
            name: 'FIFA 23',
            genre: 'Sports', // matches "Sports expert"
            img: 'img/game-fifa23.jpg'
        }
    ];

    // Render games list in modal
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

    // Render games dynamically in modal
    renderGamesList();

    // Modal: render coaches for the initially active game
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
});

