import { getBatches, getPages } from './api.js';
import './style.css';

// ----------------------------------------------------
// STATE MANAGEMENT & LOCAL STORAGE
// ----------------------------------------------------
const state = {
  batches: [],
  pages: [],
  enrolledBatchIds: JSON.parse(localStorage.getItem('gki_enrolled_batches')) || [],
  activeCheckoutBatch: null,
  selectedSubjectIndex: null, // Active subject details index
  selectedSubTab: 'classes'   // Active sub-tab inside subject details
};

// Dynamic color coordination for curriculum subject folders
function getSubjectTheme(name, index) {
  const themes = [
    { color: 'hsl(263, 90%, 65%)', bg: 'hsla(263, 90%, 65%, 0.15)', icon: 'folder' }, // Purple
    { color: 'hsl(43, 96%, 56%)', bg: 'hsla(43, 96%, 56%, 0.15)', icon: 'palette' },   // Gold/Yellow
    { color: 'hsl(280, 85%, 60%)', bg: 'hsla(280, 85%, 60%, 0.15)', icon: 'bookmark' }, // Violet
    { color: 'hsl(195, 90%, 50%)', bg: 'hsla(195, 90%, 50%, 0.15)', icon: 'book' },     // Blue
    { color: 'hsl(142, 70%, 45%)', bg: 'hsla(142, 70%, 45%, 0.15)', icon: 'class' },    // Green
    { color: 'hsl(346, 80%, 60%)', bg: 'hsla(346, 80%, 60%, 0.15)', icon: 'school' },   // Red/Pink
    { color: 'hsl(25, 95%, 55%)', bg: 'hsla(25, 95%, 55%, 0.15)', icon: 'star' },       // Orange
    { color: 'hsl(165, 80%, 40%)', bg: 'hsla(165, 80%, 40%, 0.15)', icon: 'layers' }    // Teal
  ];

  const lower = name.toLowerCase();
  if (lower.includes('magicbox')) return { color: 'hsl(43, 96%, 56%)', bg: 'hsla(43, 96%, 56%, 0.15)', icon: 'palette' };
  if (lower.includes('mock')) return { color: 'hsl(280, 85%, 60%)', bg: 'hsla(280, 85%, 60%, 0.15)', icon: 'bookmark' };
  if (lower.includes('elixir')) return { color: 'hsl(195, 90%, 50%)', bg: 'hsla(195, 90%, 50%, 0.15)', icon: 'book' };
  if (lower.includes('current affairs')) return { color: 'hsl(142, 70%, 45%)', bg: 'hsla(142, 70%, 45%, 0.15)', icon: 'menu_book' };
  if (lower.includes('legal')) return { color: 'hsl(263, 90%, 65%)', bg: 'hsla(263, 90%, 65%, 0.15)', icon: 'gavel' };
  if (lower.includes('critical')) return { color: 'hsl(25, 95%, 55%)', bg: 'hsla(25, 95%, 55%, 0.15)', icon: 'psychology' };
  if (lower.includes('english')) return { color: 'hsl(346, 80%, 60%)', bg: 'hsla(346, 80%, 60%, 0.15)', icon: 'translate' };
  if (lower.includes('quant') || lower.includes('math')) return { color: 'hsl(195, 90%, 50%)', bg: 'hsla(195, 90%, 50%, 0.15)', icon: 'calculate' };
  if (lower.includes('general')) return { color: 'hsl(263, 90%, 65%)', bg: 'hsla(263, 90%, 65%, 0.15)', icon: 'folder' };
  
  return themes[index % themes.length];
}


function saveEnrollments() {
  localStorage.setItem('gki_enrolled_batches', JSON.stringify(state.enrolledBatchIds));
}

function isEnrolled(batchId) {
  return state.enrolledBatchIds.includes(batchId);
}

function enrollInBatch(batchId) {
  if (!state.enrolledBatchIds.includes(batchId)) {
    state.enrolledBatchIds.push(batchId);
    saveEnrollments();
  }
}

// Helper to extract YouTube video ID and return embed URL
function getYouTubeEmbedUrl(url) {
  if (!url) return '';
  if (url.includes('youtube.com/embed/')) return url;
  
  let videoId = '';
  try {
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('youtube.com/watch')) {
      const urlParts = new URL(url);
      videoId = urlParts.searchParams.get('v');
    }
  } catch (e) {
    console.error('Error parsing video URL', url, e);
  }
  
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  }
  return url;
}

// ----------------------------------------------------
// TOAST NOTIFICATIONS
// ----------------------------------------------------
function showToast(title, body) {
  const toast = document.getElementById('success-toast');
  document.getElementById('toast-title').textContent = title;
  document.getElementById('toast-body').textContent = body;
  
  toast.classList.remove('hidden');
  
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 4000);
}

// ----------------------------------------------------
// MODAL DIALOG CONTROLS
// ----------------------------------------------------
function openCheckoutModal(batch) {
  state.activeCheckoutBatch = batch;
  
  const modal = document.getElementById('checkout-modal');
  document.getElementById('modal-batch-title').textContent = `Enroll in ${batch.title}`;
  
  const original = parseInt(batch.originalPrice) || 0;
  const discounted = parseInt(batch.discountedPrice) || 0;
  const savings = original - discounted;
  
  document.getElementById('summary-original-price').textContent = `₹${original.toLocaleString('en-IN')}`;
  document.getElementById('summary-discounted-price').textContent = `₹${discounted.toLocaleString('en-IN')}`;
  document.getElementById('summary-savings-price').textContent = `₹${savings.toLocaleString('en-IN')}`;
  
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  state.activeCheckoutBatch = null;
  document.getElementById('checkout-form').reset();
}

function openVideoModal(videoTitle, videoUrl) {
  const embedUrl = getYouTubeEmbedUrl(videoUrl);
  const modal = document.getElementById('video-modal');
  const container = document.getElementById('video-container');
  
  if (!embedUrl) {
    container.innerHTML = `
      <div class="materials-empty-box">
        <i class="material-icons">error</i>
        <p>This video lecture is currently being prepared for streaming.</p>
      </div>`;
  } else {
    container.innerHTML = `<iframe src="${embedUrl}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  }
  
  document.getElementById('video-modal-title').textContent = videoTitle;
  
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
  const modal = document.getElementById('video-modal');
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  document.getElementById('video-container').innerHTML = '';
}

// ----------------------------------------------------
// UI LAYOUT RENDERERS
// ----------------------------------------------------

// Loader Management
function showLoader() {
  const loader = document.getElementById('global-loader');
  if (loader) {
    loader.classList.remove('fade-out');
  }
}

function hideLoader() {
  const loader = document.getElementById('global-loader');
  if (loader) {
    loader.classList.add('fade-out');
  }
}

// Header Navigation Renderer
function renderHeader() {
  const hash = window.location.hash || '#home';
  
  return `
    <header class="navbar" id="gki-navbar">
      <a href="#home" class="nav-brand">
        <span>♾️ GK Infinity</span>
      </a>
      
      <ul class="nav-links" id="nav-links">
        <li class="nav-item">
          <a href="#home" class="${hash === '#home' ? 'active' : ''}">Home</a>
        </li>
        <li class="nav-item">
          <a href="#home#batches-section" class="${hash.startsWith('#home#') ? 'active' : ''}">Courses</a>
        </li>
        <li class="nav-item">
          <a href="#about" class="${hash === '#about' ? 'active' : ''}">About Us</a>
        </li>
        <li class="nav-item">
          <a href="#contact" class="${hash === '#contact' ? 'active' : ''}">Contact</a>
        </li>
      </ul>
      
      <a href="#home#batches-section" class="nav-cta-btn">Get Mentored</a>
      
      <button class="mobile-menu-toggle" id="mobile-toggle" aria-label="Toggle Menu">
        <i class="material-icons">menu</i>
      </button>
    </header>
  `;
}

// Footer Renderer
function renderFooter() {
  return `
    <footer class="footer">
      <div class="footer-grid">
        <div class="footer-col">
          <h3>GK <span>Infinity</span></h3>
          <p>Supervision, not just content. GK Infinity is a premium coaching community for CLAT, AILET, and SLAT entrance exams, led by Prakhar Mishra.</p>
          <div class="footer-contact-info">
            <span><i class="material-icons">phone</i> +91 94259 21109</span>
            <span><i class="material-icons">email</i> info.gkinfinity@gmail.com</span>
            <span><i class="material-icons">place</i> HIG 17, Rajiv Gandhi Nagar, Ayodhya Bypass Road, Bhopal, MP, India</span>
          </div>
        </div>
        
        <div class="footer-col">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#home#batches-section">Our Batches</a></li>
            <li><a href="#about">About Founder</a></li>
            <li><a href="#contact">Get in Touch</a></li>
          </ul>
        </div>
        
        <div class="footer-col">
          <h3>Legals</h3>
          <ul>
            <li><a href="#terms">Terms & Conditions</a></li>
            <li><a href="#privacy">Privacy Policy</a></li>
            <li><a href="#refund">Refunds & Cancellation</a></li>
          </ul>
        </div>
        
        <div class="footer-col">
          <h3>NLU Supervision</h3>
          <p>Join the WhatsApp Channel or contact us directly to schedule a personal progress call with our mentors.</p>
          <a href="https://wa.me/919425921109" target="_blank" class="btn-primary" style="padding: 10px 20px; font-size: 0.85rem;">
            <i class="material-icons">chat</i> Chat on WhatsApp
          </a>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} GK Infinity. All rights reserved. Designed for excellence.</p>
      </div>

      <!-- Floating WhatsApp Badge -->
      <a href="https://wa.me/919425921109" target="_blank" class="whatsapp-badge" aria-label="Chat on WhatsApp">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.338 4.965L2 22l5.233-1.371a9.944 9.944 0 004.773 1.215h.005c5.506 0 9.989-4.478 9.99-9.985A9.983 9.983 0 0012.012 2zm0 17.514h-.004a8.136 8.136 0 01-4.15-1.127l-.298-.177-3.084.808.822-3.007-.194-.309a8.15 8.15 0 01-1.247-4.237c.001-4.49 3.66-8.146 8.157-8.146 2.176 0 4.223.847 5.76 2.387a8.09 8.09 0 012.385 5.766c-.001 4.49-3.66 8.148-8.146 8.148zm4.469-6.108c-.244-.122-1.448-.714-1.672-.796-.224-.082-.387-.122-.55.122-.163.245-.632.796-.775.959-.143.163-.285.184-.53.061-.244-.122-1.03-.38-1.962-1.211-.725-.647-1.215-1.445-1.357-1.69-.143-.245-.015-.378.107-.5.11-.11.245-.285.367-.428.122-.143.163-.245.245-.408.082-.163.041-.306-.02-.428-.061-.122-.55-1.326-.754-1.816-.198-.48-.4-.414-.55-.422-.142-.008-.306-.01-.469-.01-.163 0-.428.061-.652.306-.224.245-.856.837-.856 2.04 0 1.204.877 2.367.999 2.53.122.163 1.726 2.637 4.18 3.696.584.252 1.04.402 1.395.515.588.187 1.122.16 1.545.097.471-.071 1.448-.592 1.652-1.163.204-.571.204-1.061.143-1.163-.062-.102-.225-.163-.469-.285z"/>
        </svg>
      </a>
    `;
}

// ----------------------------------------------------
// VIEW 1: LANDING PAGE
// ----------------------------------------------------
function renderLandingPage() {
  const batchCards = state.batches.map(batch => {
    const original = parseInt(batch.originalPrice) || 0;
    const discounted = parseInt(batch.discountedPrice) || 0;
    const enrolled = isEnrolled(batch.id);
    
    // Custom highlights for homepage listing
    let highlights = [];
    if (batch.title.includes('Victory')) {
      highlights = ['60 Full Length Mocks', '24/7 Doubt support', 'Parents-Founder Meet'];
    } else if (batch.title.includes('Knights')) {
      highlights = ['Syllabus for CLAT 2028', 'Doubt resolution sessions', 'Sectional Tests series'];
    } else {
      highlights = ['CA Lectures & Compilations', 'Static GK structured depth', 'CLAT Elixir Magazines'];
    }

    return `
      <article class="batch-card" id="batch-card-${batch.id}">
        <div class="batch-card-hover-border"></div>
        <div class="batch-image-wrapper">
          <img src="${batch.imageUrl}" alt="${batch.title}" class="batch-image" loading="lazy" />
          <span class="batch-category-badge">${batch.category || 'Law Entrance'}</span>
          <div class="batch-enrollment-status">
            <span></span>
            ${batch.enrollmentOpen ? 'Enrollment Open' : 'Closed'}
          </div>
        </div>
        
        <div class="batch-card-content">
          <h3 class="batch-card-title">${batch.title}</h3>
          
          <ul class="batch-card-features">
            ${highlights.map(h => `<li><i class="material-icons">check_circle</i><span>${h}</span></li>`).join('')}
          </ul>
          
          <div class="batch-card-footer">
            <div class="batch-price">
              <span class="batch-price-original">₹${original.toLocaleString('en-IN')}</span>
              <span class="batch-price-discounted">₹${discounted.toLocaleString('en-IN')}</span>
            </div>
            
            <a href="#batch/${batch.id}" class="batch-view-btn">
              <span>${enrolled ? 'Access Class' : 'View Course'}</span>
              <i class="material-icons">arrow_forward</i>
            </a>
          </div>
        </div>
      </article>
    `;
  }).join('');

  return `
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-glow"></div>
      <div class="hero-tag">
        <i class="material-icons">star</i>
        <span>Premium NLU Preparation</span>
      </div>
      <h1 class="hero-title">Unlock Your Dream NLU Seat with GK Infinity</h1>
      <p class="hero-description">Structured daily supervision, live lectures, and corrections by Prakhar Mishra (AIR 972, NLU Odisha). Over 1100+ students guided to NLUs. At GK Infinity, you buy supervision, not content.</p>
      <div class="hero-ctas">
        <a href="#home#batches-section" class="btn-primary">
          <span>Explore Batches</span>
          <i class="material-icons">arrow_downward</i>
        </a>
        <a href="#about" class="btn-secondary">
          <span>Meet Prakhar Sir</span>
          <i class="material-icons">person</i>
        </a>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="stats-section">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">1100+</div>
          <div class="stat-label">Students Guided to NLUs</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">AIR 972</div>
          <div class="stat-label">Founder Rank (NLU Odisha)</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">60+</div>
          <div class="stat-label">Full Length Mocks</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">24 Hrs</div>
          <div class="stat-label">Doubt Resolution Guarantee</div>
        </div>
      </div>
    </section>

    <!-- Batches List Section -->
    <section class="section-wrapper" id="batches-section">
      <div class="section-header">
        <span class="section-badge">Featured Batches</span>
        <h2 class="section-title">Invest in Structure, Not Just Lectures</h2>
        <p class="section-desc">Our batches enforce daily consistency, tracking, and evaluation to ensure you stay ahead of the curve.</p>
      </div>
      <div class="batches-grid">
        ${batchCards}
      </div>
    </section>

    <!-- Founder Highlight Section -->
    <section class="section-wrapper founder-section">
      <div class="founder-layout">
        <div class="founder-media">
          <div class="founder-media-backdrop"></div>
          <div class="founder-card">
            <div class="founder-avatar-wrapper">
              <span class="founder-avatar-text">PM</span>
            </div>
            <h3>Prakhar Mishra</h3>
            <p class="subtitle">Founder, GK Infinity</p>
            <div class="founder-credentials">
              <span>AIR 972 (CLAT 2018)</span>
              <span>BBA LLB, NLU Odisha</span>
              <span>Ex-Physics Wallah, Ex-Careers360</span>
            </div>
          </div>
        </div>
        
        <div class="founder-text-content">
          <span class="section-badge">The Mentorship</span>
          <h2>A Journey Dedicated to Your Success</h2>
          <p class="founder-bio">Prakhar Mishra cracked CLAT alongside his boards with AIR 972. From NLU Odisha intern to founder of Success Boat, and former Legal faculty at PW Law Wallah, Prakhar has successfully coached over 1100+ students into top National Law Universities.</p>
          <div class="founder-quote">
            "YouTube gives information. GK Infinity gives structure, monitoring, and daily correction. Free content doesn't check why you are failing, we do."
          </div>
          <a href="#about" class="founder-readmore-btn">
            <span>Read full bio & credentials</span>
            <i class="material-icons">arrow_forward</i>
          </a>
        </div>
      </div>
    </section>
  `;
}

// ----------------------------------------------------
// VIEW 2: BATCH DETAIL VIEW
// ----------------------------------------------------
function renderBatchDetailView(batchId) {
  const batch = state.batches.find(b => b.id === batchId);
  if (!batch) {
    return `<div class="page-container"><div class="materials-empty-box"><i class="material-icons">error</i><p>Course not found.</p><a href="#home">Back to Home</a></div></div>`;
  }
  
  const enrolled = isEnrolled(batch.id);
  const subjectsArray = batch.subjects || [];
  
  // 1. Determine header title & sub-page rendering logic
  let headerTitle = '';
  let showSubTabs = false;
  let curriculumContentHtml = '';
  const subTab = state.selectedSubTab;
  
  if (state.selectedSubjectIndex !== null && subjectsArray[state.selectedSubjectIndex]) {
    const selectedSubj = subjectsArray[state.selectedSubjectIndex];
    headerTitle = selectedSubj.name;
    showSubTabs = true;
    
    const videos = selectedSubj.videos || [];
    const notes = selectedSubj.notes || [];
    let subTabContent = '';
    
    if (subTab === 'classes') {
      subTabContent = `
        <div class="subject-empty-placeholder">
          <span style="font-size: 4.5rem; display: block; margin-bottom: 12px; filter: drop-shadow(0 0 10px rgba(255,255,255,0.15));">😅</span>
          <h4>No Classes Available</h4>
          <p>Classes for ${selectedSubj.name} will be available soon.</p>
        </div>
      `;
    } else if (subTab === 'videos') {
      if (videos.length === 0) {
        subTabContent = `
          <div class="subject-empty-placeholder">
            <span style="font-size: 4.5rem; display: block; margin-bottom: 12px; filter: drop-shadow(0 0 10px rgba(255,255,255,0.15));">😅</span>
            <h4>No Videos Available</h4>
            <p>Videos for ${selectedSubj.name} will be available soon.</p>
          </div>
        `;
      } else {
        const videoCards = videos.map(vid => {
          const unlocked = enrolled || vid.allowUnenrolledAccess;
          const dateStr = vid.createdAt 
            ? new Date(vid.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
            : 'May 2, 2026';
          const thumbnail = vid.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=60';
          
          return `
            <div class="video-card">
              <div class="video-thumbnail-wrapper">
                <img src="${thumbnail}" class="video-thumbnail" alt="${vid.title}" />
                <div class="video-play-overlay">
                  <i class="material-icons">play_circle_filled</i>
                </div>
                ${vid.duration ? `<span class="video-duration-badge">${vid.duration}</span>` : ''}
              </div>
              <div class="video-card-info">
                <h4 class="video-title">${vid.title}</h4>
                <div class="video-date">
                  <i class="material-icons">schedule</i>
                  <span>${dateStr}</span>
                </div>
                ${unlocked 
                  ? `<button class="video-action-btn play-video-trigger" data-title="${vid.title}" data-url="${vid.videoUrl}">
                       <i class="material-icons">play_arrow</i>
                       <span>Watch Video</span>
                     </button>`
                  : `<button class="video-action-btn locked-action-trigger">
                       <i class="material-icons">lock</i>
                       <span>Watch Video</span>
                     </button>`
                }
              </div>
            </div>
          `;
        }).join('');
        
        subTabContent = `
          <h4 class="video-heading">${selectedSubj.name} Videos</h4>
          <div class="videos-grid">${videoCards}</div>
        `;
      }
    } else if (subTab === 'notes') {
      if (notes.length === 0) {
        subTabContent = `
          <div class="subject-empty-placeholder">
            <span style="font-size: 4.5rem; display: block; margin-bottom: 12px; filter: drop-shadow(0 0 10px rgba(255,255,255,0.15));">😅</span>
            <h4>No Notes Available</h4>
            <p>Notes for ${selectedSubj.name} will be available soon.</p>
          </div>
        `;
      } else {
        const noteCards = notes.map(note => {
          const unlocked = enrolled || note.allowUnenrolledAccess;
          const dateStr = note.createdAt 
            ? new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
            : 'Apr 7, 2026';
          
          return `
            <div class="note-card">
              <div class="note-icon-wrapper">
                <i class="material-icons">description</i>
              </div>
              <div class="note-card-info">
                <h4 class="note-title">${note.title}</h4>
                <div class="note-date">
                  <i class="material-icons">schedule</i>
                  <span>${dateStr}</span>
                </div>
                ${unlocked 
                  ? `<a href="${note.fileUrl}" target="_blank" class="note-action-btn">
                       <i class="material-icons">cloud_download</i>
                       <span>Download PDF</span>
                     </a>`
                  : `<button class="note-action-btn locked-action-trigger">
                       <i class="material-icons">lock</i>
                       <span>Download PDF</span>
                     </button>`
                }
              </div>
            </div>
          `;
        }).join('');
        
        subTabContent = `
          <h4 class="video-heading">${selectedSubj.name} Notes</h4>
          <div class="notes-grid">${noteCards}</div>
        `;
      }
    }
    
    curriculumContentHtml = `
      <div class="subject-sub-tab-content">
        ${subTabContent}
      </div>
    `;
  } else {
    headerTitle = batch.title;
    showSubTabs = false;
    
    if (subjectsArray.length === 0) {
      curriculumContentHtml = `
        <div class="subject-empty-placeholder">
          <span style="font-size: 4.5rem; display: block; margin-bottom: 12px; filter: drop-shadow(0 0 10px rgba(255,255,255,0.15));">📂</span>
          <h4>No Subjects Available</h4>
          <p>Curriculum is being updated by Prakhar Sir. Please check back shortly.</p>
        </div>
      `;
    } else {
      const subjectCards = subjectsArray.map((subj, index) => {
        const theme = getSubjectTheme(subj.name, index);
        const icon = subj.icon || theme.icon;
        const videos = subj.videos || [];
        const notes = subj.notes || [];
        
        return `
          <div class="subject-card" data-index="${index}" style="--subject-color: ${theme.color}; --subject-bg: ${theme.bg};">
            <div class="subject-card-icon-circle">
              <i class="material-icons">${icon}</i>
            </div>
            <h3 class="subject-card-title">${subj.name}</h3>
            <div class="subject-card-pills">
              <div class="subject-pill">
                <i class="material-icons">play_circle_outline</i>
                <span>${videos.length} Lectures</span>
              </div>
              <div class="subject-pill">
                <i class="material-icons">description</i>
                <span>${notes.length} Notes</span>
              </div>
            </div>
          </div>
        `;
      }).join('');
      
      curriculumContentHtml = `
        <div class="subjects-grid">
          ${subjectCards}
        </div>
      `;
    }
  }

  // 2. Render Full Screen Immersive Interface
  return `
    <div class="app-header-bar">
      <div class="app-header-left">
        <button class="app-back-btn" id="app-back-btn-trigger">
          <i class="material-icons">arrow_back</i>
        </button>
        <h2 class="app-header-title">${headerTitle}</h2>
      </div>
      <div class="app-header-right">
        ${!enrolled 
          ? `<button class="app-enroll-header-btn" id="app-enroll-header-trigger">
               <i class="material-icons">bolt</i>
               <span>Enroll in Course</span>
             </button>`
          : `<span class="app-enrolled-badge">
               <i class="material-icons">check_circle</i>
               <span>Enrolled</span>
             </span>`
        }
      </div>
    </div>

    <div class="app-viewport-container">
      ${showSubTabs 
        ? `<nav class="subject-sub-tabs">
             <button class="subject-sub-tab-btn ${subTab === 'classes' ? 'active' : ''}" data-subtab="classes">Classes</button>
             <button class="subject-sub-tab-btn ${subTab === 'videos' ? 'active' : ''}" data-subtab="videos">Videos</button>
             <button class="subject-sub-tab-btn ${subTab === 'notes' ? 'active' : ''}" data-subtab="notes">Notes</button>
           </nav>`
        : ''
      }
      
      <div class="app-main-content-pane">
        ${curriculumContentHtml}
      </div>
    </div>
  `;
}

// ----------------------------------------------------
// VIEW 3: POLICY & ABOUT PAGES
// ----------------------------------------------------
function renderStaticPageView(slugName) {
  let matchedPage = null;
  
  // Custom shorthand router matching
  if (slugName === 'about') {
    matchedPage = state.pages.find(p => p.slug.toLowerCase().includes('about'));
  } else if (slugName === 'privacy') {
    matchedPage = state.pages.find(p => p.slug.toLowerCase().includes('privacy'));
  } else if (slugName === 'terms') {
    matchedPage = state.pages.find(p => p.slug.toLowerCase().includes('terms-conditions') || p.slug.toLowerCase().includes('terms'));
  } else if (slugName === 'refund') {
    matchedPage = state.pages.find(p => p.slug.toLowerCase().includes('refund'));
  } else {
    // Exact mapping or slug matching
    matchedPage = state.pages.find(p => p.slug === slugName || p.id === slugName);
  }
  
  if (!matchedPage) {
    return `
      <div class="page-container">
        <div class="materials-empty-box">
          <i class="material-icons">error</i>
          <p>Page content could not be located. It may have been unpublished.</p>
          <a href="#home">Back to Home</a>
        </div>
      </div>`;
  }
  
  // Custom title filters
  let pageTitle = matchedPage.title;
  let pageContent = matchedPage.content || '';
  
  // If it's the Contact page, we render the contact panel alongside an interactive form!
  if (matchedPage.slug === 'contact' || matchedPage.id === 'wsOegE0N8Bygp30M4tVz') {
    return renderContactPage(matchedPage);
  }
  
  return `
    <article class="page-container">
      <div class="page-header-wrapper">
        <h1 class="page-title">${pageTitle}</h1>
        <p class="page-meta">GK Infinity Official Policy &bull; Last Updated: ${new Date(matchedPage.updateTime).toLocaleDateString()}</p>
      </div>
      <div class="page-content-rich">
        ${pageContent}
      </div>
    </article>
  `;
}

// Special Contact Page Renderer
function renderContactPage(contactPage) {
  return `
    <div class="page-container" style="max-width:960px;">
      <div class="page-header-wrapper">
        <h1 class="page-title">Contact Us</h1>
        <p class="page-meta">Get in touch with GK Infinity for direct supervision and mock access questions.</p>
      </div>
      
      <div class="contact-page-grid">
        <div class="contact-info-panel">
          <div class="contact-content" style="margin:0; padding:24px;">
            <h3>Direct Guidance Starts Here</h3>
            <p>Confused? Overwhelmed by CLAT GK syllabus? Let's fix it, together. Get guided directly by Prakhar Sir.</p>
          </div>
          
          <div class="contact-item-box">
            <div class="contact-item-icon"><i class="material-icons">phone</i></div>
            <div class="contact-item-texts">
              <h4>Call & WhatsApp</h4>
              <p>+91 94259 21109</p>
            </div>
          </div>
          
          <div class="contact-item-box">
            <div class="contact-item-icon"><i class="material-icons">email</i></div>
            <div class="contact-item-texts">
              <h4>Email Support</h4>
              <p>info.gkinfinity@gmail.com</p>
            </div>
          </div>
          
          <div class="contact-item-box">
            <div class="contact-item-icon"><i class="material-icons">place</i></div>
            <div class="contact-item-texts">
              <h4>Headquarters</h4>
              <p>HIG 17, Rajiv Gandhi Nagar, Ayodhya Bypass Road, Bhopal, Madhya Pradesh, India</p>
            </div>
          </div>
        </div>
        
        <div class="contact-form-panel">
          <h3>Leave a Message</h3>
          <form id="contact-us-form" class="contact-form">
            <input type="text" id="contact-name" required placeholder="Your Name" />
            <input type="email" id="contact-email" required placeholder="Your Email" />
            <input type="tel" id="contact-phone" required placeholder="WhatsApp Number" />
            <textarea id="contact-message" required rows="4" placeholder="How can Prakhar Sir help you?"></textarea>
            <button type="submit" id="submit-contact-btn">
              <span>Send Message</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------
// AUTO-UPDATE & BACKGROUND DATA SYNC ENGINE
// ----------------------------------------------------
let isSyncing = false;

async function syncData(forceRender = false) {
  if (isSyncing) return;
  isSyncing = true;
  try {
    const [batchesData, pagesData] = await Promise.all([
      getBatches(),
      getPages()
    ]);
    
    // Compare new data with current state to avoid redrawing if unchanged
    const batchesChanged = JSON.stringify(batchesData) !== JSON.stringify(state.batches);
    const pagesChanged = JSON.stringify(pagesData) !== JSON.stringify(state.pages);
    
    if (batchesChanged || pagesChanged || forceRender) {
      state.batches = batchesData;
      state.pages = pagesData;
      
      // Prevent redrawing if user is actively watching a video or checking out
      const videoModal = document.getElementById('video-modal');
      const isVideoOpen = videoModal && !videoModal.classList.contains('hidden');
      
      if (forceRender || !isVideoOpen) {
        console.log('[Sync Engine] Datasets updated from Firestore. Re-rendering current view.');
        handleRouting(true); // Skip nested sync triggering
      }
    }
  } catch (error) {
    console.error("[Sync Engine Error] Background synchronization failed:", error);
  } finally {
    isSyncing = false;
  }
}

// ----------------------------------------------------
// ROUTER & NAVIGATION ENGINE
// ----------------------------------------------------
function handleRouting(skipSync = false) {
  const hash = window.location.hash || '#home';
  const viewport = document.getElementById('app-viewport');
  if (!viewport) return;
  
  // Immersive App View configuration (hides standard header/footer inside courses)
  if (hash.startsWith('#batch/')) {
    document.body.classList.add('in-app-view');
  } else {
    document.body.classList.remove('in-app-view');
  }
  
  // Scroll to top
  window.scrollTo(0, 0);
  
  // Redraw navigation selection state
  const navbarContainer = document.getElementById('navbar-container');
  if (navbarContainer) {
    navbarContainer.innerHTML = renderHeader();
    attachNavbarListeners();
  }
  
  // Route matching
  if (hash === '#home' || hash === '') {
    viewport.innerHTML = renderLandingPage();
    attachLandingPageListeners();
  } else if (hash.startsWith('#batch/')) {
    const batchId = hash.split('#batch/')[1];
    viewport.innerHTML = renderBatchDetailView(batchId);
    attachBatchDetailListeners(batchId);
  } else if (hash === '#about') {
    viewport.innerHTML = renderStaticPageView('about');
  } else if (hash === '#contact') {
    viewport.innerHTML = renderStaticPageView('contact');
    attachContactListeners();
  } else if (hash === '#privacy') {
    viewport.innerHTML = renderStaticPageView('privacy');
  } else if (hash === '#terms') {
    viewport.innerHTML = renderStaticPageView('terms');
  } else if (hash === '#refund') {
    viewport.innerHTML = renderStaticPageView('refund');
  } else if (hash.startsWith('#page/')) {
    const pageId = hash.split('#page/')[1];
    viewport.innerHTML = renderStaticPageView(pageId);
  } else {
    // Default fallback to Home
    viewport.innerHTML = renderLandingPage();
    attachLandingPageListeners();
  }
  
  // Handle in-page anchors scroll
  if (hash.includes('#batches-section')) {
    setTimeout(() => {
      const el = document.getElementById('batches-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  // Trigger background sync on navigation if not skipped
  if (!skipSync) {
    syncData();
  }
}

// ----------------------------------------------------
// INTERACTION LISTENERS ATTACHMENT
// ----------------------------------------------------

function attachNavbarListeners() {
  const mobileToggle = document.getElementById('mobile-toggle');
  const navLinks = document.getElementById('nav-links');
  
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      const active = navLinks.style.display === 'flex';
      navLinks.style.display = active ? 'none' : 'flex';
      navLinks.style.flexDirection = 'column';
      navLinks.style.position = 'absolute';
      navLinks.style.top = '72px';
      navLinks.style.left = '0';
      navLinks.style.width = '100%';
      navLinks.style.background = 'hsl(224, 71%, 5%)';
      navLinks.style.padding = '20px';
      navLinks.style.borderBottom = '1px solid var(--border-color)';
    });
  }
}

function attachLandingPageListeners() {
  // Can attach custom analytics or animations triggers here
}

function attachBatchDetailListeners(batchId) {
  const batch = state.batches.find(b => b.id === batchId);
  if (!batch) return;
  
  // 1. Back button behavior in header
  const backBtn = document.getElementById('app-back-btn-trigger');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (state.selectedSubjectIndex !== null) {
        state.selectedSubjectIndex = null;
        const viewport = document.getElementById('app-viewport');
        viewport.innerHTML = renderBatchDetailView(batch.id);
        attachBatchDetailListeners(batch.id);
      } else {
        window.location.hash = '#home';
      }
    });
  }

  // 2. Enroll button behavior in header
  const enrollHeaderBtn = document.getElementById('app-enroll-header-trigger');
  if (enrollHeaderBtn) {
    enrollHeaderBtn.addEventListener('click', () => {
      enrollInBatch(batch.id);
      showToast('Enrollment Successful!', `You are now enrolled in ${batch.title}`);
      
      const viewport = document.getElementById('app-viewport');
      viewport.innerHTML = renderBatchDetailView(batch.id);
      attachBatchDetailListeners(batch.id);
    });
  }

  // 3. Subject Cards grid clicks
  const subjectCards = document.querySelectorAll('.subject-card');
  subjectCards.forEach(card => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.getAttribute('data-index'));
      state.selectedSubjectIndex = idx;
      state.selectedSubTab = 'classes'; // reset default subtab
      
      const viewport = document.getElementById('app-viewport');
      viewport.innerHTML = renderBatchDetailView(batch.id);
      attachBatchDetailListeners(batch.id);
    });
  });

  // 4. Sub-tab clicks
  const subTabBtns = document.querySelectorAll('.subject-sub-tab-btn');
  subTabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const subTabName = e.target.getAttribute('data-subtab');
      state.selectedSubTab = subTabName;
      
      const viewport = document.getElementById('app-viewport');
      viewport.innerHTML = renderBatchDetailView(batch.id);
      attachBatchDetailListeners(batch.id);
    });
  });

  // 5. Video Play handler
  const playTriggers = document.querySelectorAll('.play-video-trigger');
  playTriggers.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const trigger = e.target.closest('.play-video-trigger');
      const title = trigger.getAttribute('data-title');
      const url = trigger.getAttribute('data-url');
      openVideoModal(title, url);
    });
  });

  // 6. Locked item clicks (auto-enroll support)
  const lockedTriggers = document.querySelectorAll('.locked-action-trigger');
  lockedTriggers.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      enrollInBatch(batch.id);
      showToast('Enrollment Successful!', 'Course content unlocked.');
      
      const viewport = document.getElementById('app-viewport');
      viewport.innerHTML = renderBatchDetailView(batch.id);
      attachBatchDetailListeners(batch.id);
    });
  });
}

function attachContactListeners() {
  const contactForm = document.getElementById('contact-us-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const submitBtn = document.getElementById('submit-contact-btn');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Sending Message...</span>`;
      
      // Simulate API submit delay
      setTimeout(() => {
        showToast('Message Sent!', 'Prakhar Sir will contact you on WhatsApp shortly.');
        contactForm.reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }, 1500);
    });
  }
}

// ----------------------------------------------------
// APP INITIALIZER
// ----------------------------------------------------
async function initializeApp() {
  // Draw base layout container to index.html `#app`
  const appContainer = document.getElementById('app');
  
  // Insert core structural templates (Navbar, Viewport, Footer, Modals)
  appContainer.innerHTML += `
    <div id="navbar-container"></div>
    <main id="app-viewport"></main>
    <div id="footer-container"></div>
  `;
  
  // Show loader while loading Firestore data
  showLoader();
  
  try {
    // Run initial sync (force drawing the viewport)
    await syncData(true);
  } catch (error) {
    console.error("Critical error building initial datasets:", error);
  } finally {
    // Hide loader
    hideLoader();
    
    // Draw footer
    document.getElementById('footer-container').innerHTML = renderFooter();
    
    // Setup router listeners
    window.addEventListener('hashchange', () => {
      state.selectedSubjectIndex = null;
      handleRouting();
    });
    
    // Start periodic background auto-update polling (every 15 seconds)
    setInterval(() => {
      syncData();
    }, 15000);
  }

  // Setup Global Modal Listeners
  document.getElementById('close-checkout-btn').addEventListener('click', closeCheckoutModal);
  document.getElementById('checkout-modal').addEventListener('click', (e) => {
    if (e.target.id === 'checkout-modal') closeCheckoutModal();
  });
  
  document.getElementById('close-video-btn').addEventListener('click', closeVideoModal);
  document.getElementById('video-modal').addEventListener('click', (e) => {
    if (e.target.id === 'video-modal') closeVideoModal();
  });

  // Setup Checkout Submit Form listener
  document.getElementById('checkout-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!state.activeCheckoutBatch) return;
    
    const submitBtn = document.getElementById('submit-checkout-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Processing Enrollment...</span>`;
    
    setTimeout(() => {
      enrollInBatch(state.activeCheckoutBatch.id);
      showToast('Enrollment Successful!', `You are now enrolled in ${state.activeCheckoutBatch.title}`);
      
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Complete simulated enrollment</span><i class="material-icons">arrow_forward</i>`;
      
      closeCheckoutModal();
      
      // Redraw the view to unlock content!
      const currentHash = window.location.hash;
      window.location.hash = ''; // toggle change
      window.location.hash = currentHash;
    }, 1800);
  });
}

// Mount the App
document.addEventListener('DOMContentLoaded', initializeApp);
