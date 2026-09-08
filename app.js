document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const mediaTypeSelect = document.getElementById('media-type');
  const challengeButtons = document.querySelectorAll('.challenge-btn');
  const loadingIndicator = document.getElementById('loading-indicator');
  const errorBanner = document.getElementById('error-banner');
  const resultsGrid = document.getElementById('results-grid');

  const BASE_URL = 'https://pixabay.com/api/';

  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    const type = mediaTypeSelect.value;
    
    if (query) {
      fetchMedia(query, type);
    }
  });

  challengeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const query = button.getAttribute('data-query');
      const type = button.getAttribute('data-type');
      searchInput.value = query;
      mediaTypeSelect.value = type;

      fetchMedia(query, type);
    });
  });

  async function fetchMedia(query, type) {
    toggleLoading(true);
    clearError();
    resultsGrid.innerHTML = '';
    const activeConfig = (typeof config !== 'undefined') ? config : (window.config || null);
    if (!activeConfig || !activeConfig.PIXABAY_API_KEY || activeConfig.PIXABAY_API_KEY === 'YOUR_API_KEY_HERE') {
      renderError("Setup Alert: Please create your local config.js file containing your active Pixabay API key.");
      toggleLoading(false);
      return;
    }

    const API_KEY = activeConfig.PIXABAY_API_KEY;
    const safeQuery = encodeURIComponent(query);
    const endpoint = type === 'video' ? 'videos/' : '';
    const url = `${BASE_URL}${endpoint}?key=${API_KEY}&q=${safeQuery}&safe_search=true&per_page=21`;

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API returned an unexpected response code: ${response.status}`);
      }

      const data = await response.json();
      renderResults(data.hits, type);
    } catch (err) {
      renderError(`System Network Connection Failure: ${err.message}. Check your key or internet state.`);
    } finally {
      toggleLoading(false);
    }
  }

  function renderResults(hits, type) {
    if (!hits || hits.length === 0) {
      resultsGrid.innerHTML = `
        <p style="grid-column: 1/-1; text-align: center; color: #86a6da; padding: 40px; font-weight: bold;">
          No matching media entries located. Try another search term!
        </p>`;
      return;
    }

    const cardsHtml = hits.map(item => {
      const cleanTitle = cleanTags(item.tags);
      const typeTag = type === 'video' 
        ? '<span class="tag tag-project">Video</span>' 
        : '<span class="tag tag-activity">Photo</span>';
      const resolutionTag = type === 'video'
        ? '<span class="tag tag-complete">HD</span>'
        : '<span class="tag tag-building">HD</span>';

      const codingTag = '<span class="tag tag-coding">Pixabay</span>';

      if (type === 'video') {
        const streamUrl = item.videos.tiny.url || item.videos.small.url;
        return `
          <div class="card">
            <video src="${streamUrl}" controls preload="none" poster="${item.userImageURL || ''}"></video>
            <div class="card-content">
              <h3>${cleanTitle}</h3>
              <p>
                ${codingTag}
                ${typeTag}
                ${resolutionTag}
              </p>
              <a href="${item.pageURL}" target="_blank" class="set-btn btn-pj">• Video Link</a>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="card">
            <img src="${item.webformatURL}" alt="${item.tags}" loading="lazy">
            <div class="card-content">
              <h3>${cleanTitle}</h3>
              <p>
                ${codingTag}
                ${typeTag}
                ${resolutionTag}
              </p>
              <a href="${item.pageURL}" target="_blank" class="set-btn btn-act">• Photo Link</a>
            </div>
          </div>
        `;
      }
    }).join('');

    resultsGrid.innerHTML = cardsHtml;
  }

  function toggleLoading(show) {
    if (show) {
      loadingIndicator.classList.remove('hidden');
    } else {
      loadingIndicator.classList.add('hidden');
    }
  }

  function renderError(message) {
    errorBanner.textContent = message;
    errorBanner.classList.remove('hidden');
  }

  function clearError() {
    errorBanner.textContent = '';
    errorBanner.classList.add('hidden');
  }
  
  function cleanTags(tagStr) {
    if (!tagStr) return 'Untitled Collection';
    return tagStr.split(',')
      .slice(0, 3)
      .map(word => word.trim().replace(/^\w/, char => char.toUpperCase()))
      .join(', ');
  }
});