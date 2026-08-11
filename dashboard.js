const SUPABASE_URL = 'https://hrrwoenmxuavfpecopde.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0E7DXvXoca5oAZrnDQVcTw_kQXXV8yz';

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const gallery = document.getElementById('gallery');
const statusMessage = document.getElementById('statusMessage');
const logoutButton = document.getElementById('logoutButton');
const tabButtons = document.querySelectorAll('.tab-btn');

let currentStatus = 'pending';


// ------------------------------------
// CHECK ADMIN SESSION
// ------------------------------------

async function checkSession() {
  const {
    data: { session },
    error
  } = await supabaseClient.auth.getSession();

  if (error || !session) {
    window.location.href = 'admin.html';
    return false;
  }

  return true;
}


// ------------------------------------
// CREATE PRIVATE MEDIA URL
// ------------------------------------

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


// ------------------------------------
// LOAD SUBMISSIONS
// ------------------------------------

async function loadSubmissions(status = 'pending') {
  currentStatus = status;

  gallery.innerHTML = '';
  statusMessage.textContent = 'Loading submissions...';

  const { data, error } =
    await supabaseClient
      .from('submissions')
      .select('*')
      .eq('status', status)
      .order('created_at', {
        ascending: false
      });

  if (error) {
    console.error('Load submissions error:', error);

    statusMessage.textContent =
      'Unable to load submissions.';

    return;
  }

  if (!data || data.length === 0) {
    statusMessage.textContent = '';

    gallery.innerHTML = `
      <div class="empty">
        No ${status} submissions yet.
      </div>
    `;

    return;
  }

  statusMessage.textContent =
    `${data.length} ${status} submission(s)`;

  for (const submission of data) {
    const mediaUrl =
      await getMediaUrl(
        submission.media_path
      );

    if (!mediaUrl) {
      continue;
    }

    const card =
      document.createElement('div');

    card.className = 'card';

    let mediaHTML = '';

    if (
      submission.media_type &&
      submission.media_type.startsWith('video/')
    ) {
      mediaHTML = `
        <video
          class="media"
          controls
          playsinline
          src="${mediaUrl}"
        ></video>
      `;
    } else {
      mediaHTML = `
        <img
          class="media"
          src="${mediaUrl}"
          alt="Wedding memory"
        >
      `;
    }

    const createdDate =
      new Date(
        submission.created_at
      ).toLocaleString();

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
              : 'No message'
          }
        </div>

        <div class="meta">
          ${createdDate}
        </div>

        <div class="actions">

          ${
            status === 'pending'
              ? `
                <button
                  class="action-btn approve"
                  data-id="${submission.id}"
                  data-action="approved"
                >
                  ✓ Approve
                </button>

                <button
                  class="action-btn reject"
                  data-id="${submission.id}"
                  data-action="rejected"
                >
                  ✕ Reject
                </button>
              `
              : ''
          }

          <button
            class="action-btn delete"
            data-delete-id="${submission.id}"
            data-media-path="${escapeHTML(
              submission.media_path
            )}"
          >
            🗑 Delete
          </button>

        </div>

      </div>
    `;

    gallery.appendChild(card);
  }

  attachActionButtons();
  attachDeleteButtons();
}


// ------------------------------------
// APPROVE / REJECT
// ------------------------------------

function attachActionButtons() {
  const buttons =
    document.querySelectorAll(
      '[data-action]'
    );

  buttons.forEach(button => {
    button.addEventListener(
      'click',
      async () => {

        const id =
          button.dataset.id;

        const action =
          button.dataset.action;

        button.disabled = true;

        const { error } =
          await supabaseClient
            .from('submissions')
            .update({
              status: action
            })
            .eq('id', id);

        if (error) {
          console.error(
            'Update status error:',
            error
          );

          statusMessage.textContent =
            'Unable to update submission.';

          button.disabled = false;

          return;
        }

        await loadSubmissions(
          currentStatus
        );
      }
    );
  });
}


// ------------------------------------
// DELETE
// ------------------------------------

function attachDeleteButtons() {
  const deleteButtons =
    document.querySelectorAll(
      '[data-delete-id]'
    );

  deleteButtons.forEach(button => {
    button.addEventListener(
      'click',
      async () => {

        const submissionId =
          button.dataset.deleteId;

        const mediaPath =
          button.dataset.mediaPath;

        const confirmed =
          confirm(
            'Delete this memory permanently? This cannot be undone.'
          );

        if (!confirmed) {
          return;
        }

        button.disabled = true;

        statusMessage.textContent =
          'Deleting memory...';


        // Delete file from Storage
        const {
          error: storageError
        } =
          await supabaseClient.storage
            .from('wedding-media')
            .remove([
              mediaPath
            ]);

        if (storageError) {
          console.error(
            'Storage delete error:',
            storageError
          );

          statusMessage.textContent =
            'Unable to delete media file.';

          button.disabled = false;

          return;
        }


        // Delete database row
        const {
          error: databaseError
        } =
          await supabaseClient
            .from('submissions')
            .delete()
            .eq(
              'id',
              submissionId
            );

        if (databaseError) {
          console.error(
            'Database delete error:',
            databaseError
          );

          statusMessage.textContent =
            'Media was deleted, but database record could not be removed.';

          button.disabled = false;

          return;
        }

        statusMessage.textContent =
          'Memory deleted.';

        await loadSubmissions(
          currentStatus
        );
      }
    );
  });
}


// ------------------------------------
// TABS
// ------------------------------------

tabButtons.forEach(button => {
  button.addEventListener(
    'click',
    async () => {

      tabButtons.forEach(btn =>
        btn.classList.remove('active')
      );

      button.classList.add('active');

      await loadSubmissions(
        button.dataset.status
      );
    }
  );
});


// ------------------------------------
// LOGOUT
// ------------------------------------

logoutButton.addEventListener(
  'click',
  async () => {

    await supabaseClient.auth.signOut();

    window.location.href =
      'admin.html';
  }
);


// ------------------------------------
// ESCAPE HTML
// ------------------------------------

function escapeHTML(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


// ------------------------------------
// START DASHBOARD
// ------------------------------------

async function startDashboard() {
  const loggedIn =
    await checkSession();

  if (!loggedIn) {
    return;
  }

  await loadSubmissions(
    'pending'
  );
}

startDashboard();