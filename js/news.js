import { translations as newsTranslations } from './translations/i18n-news.js';
import { getPreferredLanguage } from './translate.js';

// The news source is English-only; always use the English feed by default.
const FEEDS = {
    en: 'https://www.ign.com/rss/articles/feed'
};
let currentFeed = FEEDS.en;
const apiUrlFor = (feedUrl) => `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;

function localize(key) {
    const lang = getPreferredLanguage(newsTranslations);
    return (newsTranslations[lang] && newsTranslations[lang][key]) || key;
}

async function fetchNews() {
    const newsContainer = document.getElementById('news-container');
    if (!newsContainer) return; // nothing to render

    try {
        const apiUrl = apiUrlFor(currentFeed);
        const response = await fetch(apiUrl);
        const data = await response.json();

        newsContainer.innerHTML = '';

        if (!data || !Array.isArray(data.items) || data.items.length === 0) {
            newsContainer.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-muted">${localize('No news available')}</p>
                </div>
            `;
            return;
        }

        data.items.forEach(item => {
            // Determine best image: prefer thumbnail, then enclosure.link, then first <img> in content
            const extractImageFromContent = (html) => {
                if (!html) return null;
                try {
                    if (typeof DOMParser !== 'undefined') {
                        const doc = new DOMParser().parseFromString(html, 'text/html');
                        const img = doc.querySelector('img');
                        if (img && img.src) return img.src;
                    }
                } catch (e) { /* ignore DOMParser errors */ }
                // Fallback to regex
                try {
                    const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
                    if (m && m[1]) return m[1];
                } catch (e) { /* ignore */ }
                return null;
            };

            const image = item.thumbnail || (item.enclosure && item.enclosure.link) || extractImageFromContent(item.content) || 'img/placeholder.jpg';
            const newsCard = `
                <div class="col-lg-6">
                    <div class="feature-card h-100">
                        <img src="${image}" class="img-fluid mb-3 rounded" alt="${item.title}" onerror="this.src='img/placeholder.jpg'">
                        <h3 class="h5 mb-3">${item.title}</h3>
                        <p class="text-muted small mb-3">${new Date(item.pubDate).toLocaleDateString()}</p>
                        <a href="${item.link}" target="_blank" class="btn btn-primary btn-sm" data-i18n="Read More">${localize('Read More')}</a>
                    </div>
                </div>
            `;
            newsContainer.innerHTML += newsCard;
        });
    } catch (error) {
        if (newsContainer) {
            newsContainer.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-danger">Failed to load news. Please try again later.</p>
                </div>
            `;
        }
        console.error('Error fetching news:', error);
    }
}

document.addEventListener('DOMContentLoaded', fetchNews);

// Reload news when site language changes
window.addEventListener('siteLanguageChanged', (e) => {
    try {
        const lang = e?.detail?.lang || 'en';
        currentFeed = FEEDS[lang] || FEEDS.en;
        fetchNews();
    } catch (err) { /* ignore */ }
});
