const SUPABASE_URL = 'https://hrrwoenmxuavfpecopde.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0E7DXvXoca5oAZrnDQVcTw_kQXXV8yz';

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const gallery = document.getElementById('gallery');
const galleryStatus = document.getElementById('galleryStatus');

const lightbox = document.getElementById('lightbox');
const lightboxMedia = document.getElementById('lightboxMedia');
const closeLightbox = document.getElementById('closeLightbox');


function escapeHTML(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


async function getMediaUrl(path) {

  const { data, error } =
    await supabaseClient.storage
      .from('wedding-media')
      .createSignedUrl(path, 3600);

  if (error) {
    console.error('Signed URL error:', error);
    return null;
  }

  return data.signedUrl;
}


function openLightbox(mediaUrl, mediaType) {

  lightboxMedia.innerHTML = '';

  if (
    mediaType &&
    mediaType.startsWith('video/')
  ) {

    lightboxMedia.innerHTML = `
      <video
        src="${mediaUrl}"
        controls
        autoplay
        playsinline
      ></video>
    `;

  } else {

    lightboxMedia.innerHTML = `
      <img
        src="${mediaUrl}"
        alt="Wedding memory"
      >
    `;

  }

  lightbox.classList.add('active');

  document.body.style.overflow = 'hidden';
}


function closeViewer() {

  lightbox.classList.remove('active');

  lightboxMedia.innerHTML = '';

  document.body.style.overflow = '';
}


closeLightbox.addEventListener(
  'click',
  closeViewer
);


lightbox.addEventListener(
  'click',
  event => {

    if (event.target === lightbox) {
      closeViewer();
    }

  }
);


document.addEventListener(
  'keydown',
  event => {

    if (event.key === 'Escape') {
      closeViewer();
    }

  }
);


async function loadGallery() {

  gallery.innerHTML = '';

  galleryStatus.textContent =
    'Loading gallery...';


  const { data, error } =
    await supabaseClient
      .from('submissions')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', {
        ascending: false
      });


  if (error) {

    console.error(
      'Gallery load error:',
      error
    );

    galleryStatus.textContent =
      'Unable to load gallery.';

    return;
  }


  if (!data || data.length === 0) {

    galleryStatus.textContent = '';

    gallery.innerHTML = `
      <div class="empty">
        No approved memories yet 🤍
      </div>
    `;

    return;
  }


  galleryStatus.textContent =
    `${data.length} beautiful moment(s) 🤍`;


  for (const submission of data) {

    const mediaUrl =
      await getMediaUrl(
        submission.media_path
      );


    if (!mediaUrl) {
      continue;
    }


    const card =
      document.createElement('article');

    card.className = 'card';


    let mediaHTML = '';


    if (
      submission.media_type &&
      submission.media_type.startsWith('video/')
    ) {

      mediaHTML = `
        <video
          class="media"
          src="${mediaUrl}"
          muted
          playsinline
          preload="metadata"
        ></video>
      `;

    } else {

      mediaHTML = `
        <img
          class="media"
          src="${mediaUrl}"
          alt="Wedding memory shared by ${escapeHTML(
            submission.guest_name || 'Guest'
          )}"
          loading="lazy"
        >
      `;

    }


    card.innerHTML = `

      ${mediaHTML}

      <div class="card-body">

        <div class="guest-name">
          ${escapeHTML(
            submission.guest_name || 'Guest'
          )}
        </div>

        <div class="wish">
          ${
            submission.wish
              ? escapeHTML(submission.wish)
              : 'Shared with love 🤍'
          }
        </div>

      </div>

    `;


    card.addEventListener(
      'click',
      () => {

        openLightbox(
          mediaUrl,
          submission.media_type
        );

      }
    );


    gallery.appendChild(card);

  }

}


loadGallery();