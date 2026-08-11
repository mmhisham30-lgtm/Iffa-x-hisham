const SUPABASE_URL = 'https://hrrwoenmxuavfpecopde.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0E7DXvXoca5oAZrnDQVcTw_kQXXV8yz';

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const guestName = document.getElementById('guestName');
const guestWish = document.getElementById('guestWish');

const photoInput = document.getElementById('photoInput');
const submitButton = document.getElementById('submitButton');
const uploadStatus = document.getElementById('uploadStatus');


photoInput.addEventListener('change', () => {

  const files = Array.from(photoInput.files);

  if (!files.length) {
    uploadStatus.textContent = '';
    return;
  }

  uploadStatus.textContent =
    `${files.length} photo/video selected 🤍`;

});


submitButton.addEventListener('click', async () => {

  const name = guestName.value.trim();
  const wish = guestWish.value.trim();
  const files = Array.from(photoInput.files);


  if (!name) {
    uploadStatus.textContent =
      'Please enter your name 🤍';
    return;
  }


  if (!files.length) {
    uploadStatus.textContent =
      'Please choose at least one photo or video.';
    return;
  }


  const MAX_FILE_SIZE = 50 * 1024 * 1024;

  for (const file of files) {

    if (file.size > MAX_FILE_SIZE) {
      uploadStatus.textContent =
        `${file.name} is too large. Maximum size is 50 MB.`;
      return;
    }

  }


  submitButton.disabled = true;

  uploadStatus.textContent =
    'Uploading your memories... 🤍';


  try {

    for (const file of files) {

      const safeFileName =
        file.name.replace(
          /[^a-zA-Z0-9._-]/g,
          '_'
        );


      const filePath =
        `uploads/${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;


      const { error: uploadError } =
        await supabaseClient.storage
          .from('wedding-media')
          .upload(
            filePath,
            file,
            {
              contentType: file.type,
              upsert: false
            }
          );


      if (uploadError) {
        throw uploadError;
      }


      const { error: databaseError } =
        await supabaseClient
          .from('submissions')
          .insert({
            guest_name: name,
            wish: wish || null,
            category: null,
            media_path: filePath,
            media_type: file.type,
            status: 'pending'
          });


      if (databaseError) {
        throw databaseError;
      }

    }


    uploadStatus.textContent =
      'Thank you! Your memories have been sent 🤍';


    guestName.value = '';
    guestWish.value = '';
    photoInput.value = '';


  } catch (error) {

    console.error('Upload error:', error);

    uploadStatus.textContent =
      'Upload failed. Please try again.';


  } finally {

    submitButton.disabled = false;

  }

});