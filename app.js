// ============================================================================
//  PART 1: SETUP & CONFIGURATION
// ============================================================================

// --- Supabase Connection ---
// Replace with your actual Supabase project URL and anon key
const SUPABASE_URL = 'https://tdclhoimzksmqmnsaccw.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkY2xob2ltemtzbXFtbnNhY2N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NzAxMjUsImV4cCI6MjA3MjI0NjEyNX0.lkxHRLuT4liiDJWt4AnSk24rFY5E3sceyApZ7kVTGL4';

// Remember to replace these with the new keys you generated after the security warning!
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- DOM Element References ---
// Get references to all the HTML elements we'll be working with
const loginSection = document.getElementById('login-section');
const appSection = document.getElementById('app-section');
const loginForm = document.getElementById('login-form');
const authError = document.getElementById('auth-error');
const logoutBtn = document.getElementById('logout-btn');

const addTargetBtn = document.getElementById('addTarget-btn');
const modal = document.getElementById('add-target-modal');
const closeModalBtn = document.querySelector('.close-btn');
const addTargetForm = document.getElementById('add-target-form');
const targetTypeSelect = document.getElementById('target-type');
const targetPublicationInput = document.getElementById('target-publication');


// ============================================================================
//  PART 2: AUTHENTICATION
// ============================================================================

// --- Login Handler ---
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent the form from refreshing the page
    authError.textContent = ''; // Clear any previous errors

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        authError.textContent = 'Error: ' + error.message;
    } else {
        // Login successful
        loginSection.style.display = 'none';
        appSection.style.display = 'block';
        console.log('Logged in successfully!');
        // We will fetch tasks here in the next step
        // fetchAndDisplayTasks(); 
    }
});

// --- Logout Handler ---
logoutBtn.addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error logging out:', error);
    } else {
        // Logout successful
        loginSection.style.display = 'block';
        appSection.style.display = 'none';
        // Clear the task lists
        document.getElementById('linkedin-tasks').innerHTML = '';
        document.getElementById('media-tasks').innerHTML = '';
    }
});

// --- Session Check ---
// Check if the user is already logged in when the page loads
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        loginSection.style.display = 'none';
        appSection.style.display = 'block';
        console.log('Active session found!');
        // We will fetch tasks here in the next step
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
// Show the modal when the "Add Target" button is clicked
addTargetBtn.addEventListener('click', () => {
    modal.style.display = 'flex';
});

// Hide the modal when the close button (x) is clicked
closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

// Hide the modal if the user clicks outside of the modal content
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// --- Dynamic Form Field ---
// Show/hide the 'Publication' input based on the selected target type
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
// Run the session check when the script loads
checkSession();
