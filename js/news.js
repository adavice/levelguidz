document.addEventListener('DOMContentLoaded', function() {
    const newsContainer = document.getElementById('news-container');
    const rssUrl = 'https://www.ign.com/rss/articles/feed';
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

    async function fetchNews() {
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();

            newsContainer.innerHTML = '';

            data.items.forEach(item => {
                const image = item.thumbnail || 'img/placeholder.jpg';
                const newsCard = `
                    <div class="col-lg-6">
                        <div class="feature-card h-100">
                            <img src="${image}" class="img-fluid mb-3 rounded" alt="${item.title}" onerror="this.src='img/placeholder.jpg'">
                            <h3 class="h5 mb-3">${item.title}</h3>
                            <p class="text-muted small mb-3">${new Date(item.pubDate).toLocaleDateString()}</p>
                            <a href="${item.link}" target="_blank" class="btn btn-primary btn-sm">Read More</a>
                        </div>
                    </div>
                `;
                newsContainer.innerHTML += newsCard;
            });
        } catch (error) {
            newsContainer.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-danger">Failed to load news. Please try again later.</p>
                </div>
            `;
            console.error('Error fetching news:', error);
        }
    }

    fetchNews();
});
