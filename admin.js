const SUPABASE_URL = 'https://hrrwoenmxuavfpecopde.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0E7DXvXoca5oAZrnDQVcTw_kQXXV8yz';

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const adminEmail = document.getElementById('adminEmail');
const adminPassword = document.getElementById('adminPassword');
const loginButton = document.getElementById('loginButton');
const loginStatus = document.getElementById('loginStatus');

loginButton.addEventListener('click', async () => {

  const email = adminEmail.value.trim();
  const password = adminPassword.value;

  if (!email) {
    loginStatus.textContent = 'Please enter your admin email.';
    return;
  }

  if (!password) {
    loginStatus.textContent = 'Please enter your password.';
    return;
  }

  loginButton.disabled = true;
  loginStatus.textContent = 'Signing in...';

  try {

    const { data, error } =
      await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error('Login failed.');
    }

    loginStatus.textContent =
      'Login successful 🤍';

    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 700);

  } catch (error) {

    console.error('Admin login error:', error);

    loginStatus.textContent =
      'Invalid email or password.';

  } finally {

    loginButton.disabled = false;

  }

});