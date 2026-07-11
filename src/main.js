import { getBatches, getPages } from './api.js';
import './style.css';

// ----------------------------------------------------
// STATE MANAGEMENT & LOCAL STORAGE
// ----------------------------------------------------
const state = {
  batches: [],
  pages: [],
  enrolledBatchIds: JSON.parse(localStorage.getItem('gki_enrolled_batches')) || [],
  activeCheckoutBatch: null
};

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
  const original = parseInt(batch.originalPrice) || 0;
  const discounted = parseInt(batch.discountedPrice) || 0;
  const discountPct = Math.round(((original - discounted) / original) * 100);

  // Parse Curriculum Subjects
  const subjectsArray = batch.subjects || [];
  
  // Render Subjects and Material
  const subjectsHtml = subjectsArray.length > 0 
    ? subjectsArray.map((subj, index) => {
        const videos = subj.videos || [];
        const notes = subj.notes || [];
        const totalItems = videos.length + notes.length;
        
        let materialsRows = '';
        
        if (totalItems === 0) {
          materialsRows = `
            <div class="materials-empty-box">
              <i class="material-icons">folder_open</i>
              <p>Learning modules are being uploaded for this subject folder.</p>
            </div>`;
        } else {
          // Render videos
          const videoRows = videos.map(vid => {
            const unlocked = enrolled || vid.allowUnenrolledAccess;
            
            return `
              <li class="material-row-item">
                <div class="material-left">
                  <i class="material-icons video-icon">play_circle_filled</i>
                  <div class="title-meta">
                    <h4>${vid.title}</h4>
                    <span>Duration: ${vid.duration || 'Interactive class'}</span>
                  </div>
                </div>
                <div class="material-right">
                  ${unlocked 
                    ? `<button class="material-right-action-btn play-video-trigger" data-title="${vid.title}" data-url="${vid.videoUrl}">
                         <span>Play Lecture</span>
                         <i class="material-icons">play_arrow</i>
                       </button>`
                    : `<span class="material-right-locked">
                         <span>Locked</span>
                         <i class="material-icons">lock</i>
                       </span>`
                  }
                </div>
              </li>
            `;
          }).join('');
          
          // Render notes
          const noteRows = notes.map(note => {
            const unlocked = enrolled || note.allowUnenrolledAccess;
            
            return `
              <li class="material-row-item">
                <div class="material-left">
                  <i class="material-icons pdf-icon">description</i>
                  <div class="title-meta">
                    <h4>${note.title}</h4>
                    <span>Study Booklet (PDF)</span>
                  </div>
                </div>
                <div class="material-right">
                  ${unlocked 
                    ? `<a href="${note.fileUrl}" target="_blank" class="material-right-action-btn">
                         <span>Download PDF</span>
                         <i class="material-icons">cloud_download</i>
                       </a>`
                    : `<span class="material-right-locked">
                         <span>Locked</span>
                         <i class="material-icons">lock</i>
                       </span>`
                  }
                </div>
              </li>
            `;
          }).join('');
          
          materialsRows = `<ul class="materials-list">${videoRows}${noteRows}</ul>`;
        }

        return `
          <div class="subject-item-wrapper" id="subject-${index}">
            <button class="subject-header" data-index="${index}">
              <div class="subject-header-left">
                <div class="subject-icon-box">
                  <i class="material-icons">${subj.icon || 'folder'}</i>
                </div>
                <div class="subject-title-subtext">
                  <h3>${subj.name}</h3>
                  <span>${videos.length} videos &bull; ${notes.length} booklets</span>
                </div>
              </div>
              <div class="subject-header-right">
                <i class="material-icons chevron">keyboard_arrow_down</i>
              </div>
            </button>
            <div class="subject-content">
              ${materialsRows}
            </div>
          </div>
        `;
      }).join('')
    : `
      <div class="materials-empty-box">
        <i class="material-icons">cloud_off</i>
        <p>Curriculum is being updated by Prakhar Sir. Please check back shortly.</p>
      </div>`;

  // Parse FAQs
  const faqsArray = batch.faqs || [];
  const faqsHtml = faqsArray.length > 0
    ? faqsArray.map((faq, index) => {
        return `
          <div class="faq-item-wrapper" id="faq-${index}">
            <button class="faq-question-btn" data-index="${index}">
              <span>${faq.question}</span>
              <i class="material-icons">keyboard_arrow_down</i>
            </button>
            <div class="faq-answer">
              ${faq.answer}
            </div>
          </div>
        `;
      }).join('')
    : `<div class="materials-empty-box"><p>No FAQs available for this course.</p></div>`;

  // Count total materials
  let totalVids = 0;
  let totalNotes = 0;
  subjectsArray.forEach(s => {
    if (s.videos) totalVids += s.videos.length;
    if (s.notes) totalNotes += s.notes.length;
  });

  const enrolledBanner = enrolled ? `
    <div class="enrolled-banner" style="background:var(--success-bg); border:1px solid var(--success); padding:16px 20px; border-radius:12px; margin-bottom:24px; display:flex; align-items:center; gap:12px; animation: fadeIn 0.4s ease;">
      <i class="material-icons" style="color:var(--success); font-size:24px;">check_circle</i>
      <div>
        <strong style="color:var(--text-primary); font-size:1.05rem; display:block; margin:0 0 4px 0;">You are enrolled in this course!</strong>
        <span style="color:var(--text-secondary); font-size:0.875rem;">All video lectures, notes, mocks, and download booklets are unlocked. Select the "Curriculum" tab below to begin.</span>
      </div>
    </div>
  ` : '';

  return `
    <section class="batch-detail-header-section">
      <div class="batch-breadcrumb">
        <a href="#home">Home</a>
        <i class="material-icons" style="font-size:12px;">chevron_right</i>
        <span>Batches</span>
        <i class="material-icons" style="font-size:12px;">chevron_right</i>
        <span>${batch.title}</span>
      </div>
      
      <div class="batch-detail-title-grid">
        <div class="batch-detail-header-text">
          <span class="category">${batch.category || 'Law Entrance'}</span>
          <h1>${batch.title}</h1>
          <div class="batch-detail-header-stats">
            <span><i class="material-icons">folder</i> ${subjectsArray.length} Modules</span>
            <span><i class="material-icons">play_circle_filled</i> ${totalVids} Lecture Videos</span>
            <span><i class="material-icons">description</i> ${totalNotes} Study PDFs</span>
          </div>
        </div>
      </div>
    </section>

    <div class="batch-detail-body">
      <!-- Main Content Tabs -->
      <main class="batch-detail-main">
        ${enrolledBanner}
        <nav class="tab-headers">
          <button class="tab-btn active" data-tab="overview">Overview</button>
          <button class="tab-btn" data-tab="curriculum">Curriculum</button>
          <button class="tab-btn" data-tab="faq">FAQs</button>
        </nav>
        
        <!-- Tab Content Viewport -->
        <div class="tab-content">
          <!-- Overview Tab -->
          <div class="tab-pane active" id="pane-overview">
            <article class="overview-rich page-content-rich">
              ${batch.description}
            </article>
          </div>
          
          <!-- Curriculum Tab -->
          <div class="tab-pane" id="pane-curriculum">
            <div class="curriculum-intro-bar">
              <div class="left">
                <i class="material-icons" style="color:var(--gold);">info</i>
                <span>${enrolled ? 'All class resources unlocked!' : 'Mock materials locked. Enroll to unlock all materials.'}</span>
              </div>
              <span class="unlock-pill">
                <i class="material-icons" style="font-size:14px;">${enrolled ? 'lock_open' : 'lock'}</i>
                <span>${enrolled ? 'Access Unlocked' : 'Requires Enrollment'}</span>
              </span>
            </div>
            
            <div class="curriculum-accordion">
              ${subjectsHtml}
            </div>
          </div>
          
          <!-- FAQ Tab -->
          <div class="tab-pane" id="pane-faq">
            <div class="faq-accordion">
              ${faqsHtml}
            </div>
          </div>
        </div>
      </main>

      <!-- Sticky Purchase Sidebar -->
      <aside class="batch-detail-sidebar">
        <div class="purchase-sticky-card">
          <div class="purchase-card-img-container">
            <img src="${batch.imageUrl}" alt="${batch.title}" class="purchase-card-img" />
          </div>
          
          <div class="purchase-card-details">
            <div class="price-box">
              <span class="discounted-lg">₹${discounted.toLocaleString('en-IN')}</span>
              <span class="original-lg">₹${original.toLocaleString('en-IN')}</span>
              <span class="discount-tag">${discountPct}% OFF</span>
            </div>
            
            ${enrolled 
              ? `<button class="enroll-now-btn" style="background:var(--success); color:#fff; box-shadow:none; cursor:default;">
                   <i class="material-icons">check_circle</i>
                   <span>Unlocked & Enrolled</span>
                 </button>`
              : `<button class="enroll-now-btn" id="enroll-btn-trigger">
                   <i class="material-icons">bolt</i>
                   <span>Enroll in Batch</span>
                 </button>`
            }
            
            <ul class="purchase-highlights">
              <li><i class="material-icons">check</i><span>Access to ${totalVids} video lectures</span></li>
              <li><i class="material-icons">check</i><span>Download ${totalNotes} static GK/Mock PDFs</span></li>
              <li><i class="material-icons">check</i><span>Personal supervision by Prakhar Sir</span></li>
              <li><i class="material-icons">check</i><span>Compulsory daily submission DPPs</span></li>
              <li><i class="material-icons">check</i><span>Monthly Parents-Prakhar progress meet</span></li>
            </ul>
          </div>
        </div>
      </aside>
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
// ROUTER & NAVIGATION ENGINE
// ----------------------------------------------------
function handleRouting() {
  const hash = window.location.hash || '#home';
  const viewport = document.getElementById('app-viewport');
  if (!viewport) return;
  
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
  
  // Tab switcher logic
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tabName = e.target.getAttribute('data-tab');
      
      // Update active header button
      tabBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      // Update active content pane
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      const pane = document.getElementById(`pane-${tabName}`);
      if (pane) pane.classList.add('active');
    });
  });

  // Subjects Accordion expander
  const subjectHeaders = document.querySelectorAll('.subject-header');
  subjectHeaders.forEach(header => {
    header.addEventListener('click', (e) => {
      const wrapper = e.target.closest('.subject-item-wrapper');
      const wasExpanded = wrapper.classList.contains('expanded');
      
      // Collapse all others
      document.querySelectorAll('.subject-item-wrapper').forEach(w => w.classList.remove('expanded'));
      
      if (!wasExpanded) {
        wrapper.classList.add('expanded');
      }
    });
  });

  // FAQs Accordion expander
  const faqQuestionBtns = document.querySelectorAll('.faq-question-btn');
  faqQuestionBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const wrapper = e.target.closest('.faq-item-wrapper');
      const wasExpanded = wrapper.classList.contains('expanded');
      
      // Collapse all others
      document.querySelectorAll('.faq-item-wrapper').forEach(w => w.classList.remove('expanded'));
      
      if (!wasExpanded) {
        wrapper.classList.add('expanded');
      }
    });
  });

  // Video Play handler
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

  // Enroll button click handler
  const enrollBtn = document.getElementById('enroll-btn-trigger');
  if (enrollBtn) {
    enrollBtn.addEventListener('click', () => {
      // 1. Instantly enroll
      enrollInBatch(batch.id);
      
      // 2. Show toast
      showToast('Enrollment Successful!', `You are now enrolled in ${batch.title}`);
      
      // 3. Re-render the batch detail view so that the locked items become unlocked
      const viewport = document.getElementById('app-viewport');
      viewport.innerHTML = renderBatchDetailView(batch.id);
      attachBatchDetailListeners(batch.id);
      
      // 4. Set the Curriculum tab as active
      const tabBtns = document.querySelectorAll('.tab-btn');
      tabBtns.forEach(btn => {
        if (btn.getAttribute('data-tab') === 'curriculum') {
          btn.click();
        }
      });
      
      // 5. Scroll the user up to the main section to see the unlocked content
      const mainContainer = document.querySelector('.batch-detail-main');
      if (mainContainer) {
        mainContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

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
    // Fetch live datasets (or cache fallback)
    const [batchesData, pagesData] = await Promise.all([
      getBatches(),
      getPages()
    ]);
    
    state.batches = batchesData;
    state.pages = pagesData;
  } catch (error) {
    console.error("Critical error building datasets:", error);
  } finally {
    // Hide loader
    hideLoader();
    
    // Draw footer
    document.getElementById('footer-container').innerHTML = renderFooter();
    
    // Setup router listeners
    window.addEventListener('hashchange', handleRouting);
    
    // Mount first view
    handleRouting();
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
