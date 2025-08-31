// ============================================================================
//  PART 1: SETUP & CONFIGURATION (CORRECTED)
// ============================================================================

// --- Supabase Connection ---
const SUPABASE_URL = 'https://tdclhoimzksmqmnsaccw.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkY2xob2ltemtzbXFtbnNhY2N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NzAxMjUsImV4cCI6MjA3MjI0NjEyNX0.lkxHRLuT4liiDJWt4AnSk24rFY5E3sceyApZ7kVTGL4';

// **FIX:** Use a unique variable name like 'supabaseClient'
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- DOM Element References ---
const loginSection = document.getElementById('login-section');
const appSection = document.getElementById('app-section');
const loginForm = document.getElementById('login-form');
const authError = document.getElementById('auth-error');
const logoutBtn = document.getElementById('logout-btn');

const addTargetBtn = document.getElementById('add-target-btn');
const modal = document.getElementById('add-target-modal');
const closeModalBtn = document.querySelector('.close-btn');
const addTargetForm = document.getElementById('add-target-form');
const targetTypeSelect = document.getElementById('target-type');
const targetPublicationInput = document.getElementById('target-publication');


// ============================================================================
//  PART 2: AUTHENTICATION (CORRECTED)
// ============================================================================

// --- Login Handler ---
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    authError.textContent = '';

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    // **FIX:** Use 'supabaseClient'
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        authError.textContent = 'Error: ' + error.message;
    } else {
        loginSection.style.display = 'none';
        appSection.style.display = 'block';
        console.log('Logged in successfully!');
        // fetchAndDisplayTasks(); 
    }
});

// --- Logout Handler ---
logoutBtn.addEventListener('click', async () => {
    // **FIX:** Use 'supabaseClient'
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        console.error('Error logging out:', error);
    } else {
        loginSection.style.display = 'block';
        appSection.style.display = 'none';
        document.getElementById('linkedin-tasks').innerHTML = '';
        document.getElementById('media-tasks').innerHTML = '';
    }
});

// --- Session Check ---
async function checkSession() {
    // **FIX:** Use 'supabaseClient'
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        loginSection.style.display = 'none';
        appSection.style.display = 'block';
        console.log('Active session found!');
        // fetchAndDisplayTasks();
    } else {
        loginSection.style.display = 'block';
        appSection.style.display = 'none';
    }
}


// ============================================================================
//  PART 3: MODAL & UI CONTROLS
// ============================================================================

// --- Modal Controls ---
addTargetBtn.addEventListener('click', () => {
    modal.style.display = 'flex';
});

closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// --- Dynamic Form Field ---
targetTypeSelect.addEventListener('change', () => {
    if (targetTypeSelect.value === 'Media') {
        targetPublicationInput.style.display = 'block';
    } else {
        targetPublicationInput.style.display = 'none';
    }
});


// ============================================================================
//  INITIALIZATION
// ============================================================================
checkSession();
