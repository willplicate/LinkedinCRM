// ============================================================================
//  PART 1: SETUP & CONFIGURATION
// ============================================================================

const SUPABASE_URL = 'https://tdclhoimzksmqmnsaccw.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkY2xob2ltemtzbXFtbnNhY2N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NzAxMjUsImV4cCI6MjA3MjI0NjEyNX0.lkxHRLuT4liiDJWt4AnSk24rFY5E3sceyApZ7kVTGL4';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================================
//  WAIT FOR THE PAGE TO LOAD BEFORE RUNNING THE MAIN SCRIPT
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // --- All code that touches the HTML now goes inside here ---

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
    const linkedinTasksList = document.getElementById('linkedin-tasks');
    const mediaTasksList = document.getElementById('media-tasks');

    // ============================================================================
    //  CORE APP LOGIC
    // ============================================================================
    
    // --- FETCH AND DISPLAY TASKS (DEBUGGING VERSION) ---
    const fetchAndDisplayTasks = async () => {
        const { data: targets, error } = await supabaseClient
            .from('targets')
            .select('*')
            .in('status', ['Active', 'Awaiting Reply']);

        // --- CHECKPOINT 1: See what data we get from the database ---
        console.log('--- CHECKPOINT 1: Raw data from Supabase ---');
        console.table(targets); // .table() is great for viewing arrays of objects

        if (error) {
            console.error('Error fetching targets:', error);
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0); 

        const isLastFridayOfMonth = (date) => {
            const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
            const lastDay = new Date(nextMonth - 1);
            lastDay.setDate(lastDay.getDate() - (lastDay.getDay() + 2) % 7);
            return date.toDateString() === lastDay.toDateString();
        };

        console.log(`--- CHECKPOINT 2: Filtering for today (${today.toDateString()}) ---`);
        const todaysTasks = targets.filter(target => {
            // Log each target being processed
            console.log(`- Checking "${target.name}" | Frequency: "${target.frequency}"`);

            if (!target.last_completed_at) {
                if (target.frequency === 'Daily') { console.log('  ✔️ Is a new Daily task. Should be included.'); return true; }
                if (target.frequency === 'Weekly' && today.getDay() === 5) { console.log('  ✔️ Is a new Weekly task on a Friday. Should be included.'); return true; }
                if (target.frequency === 'Monthly' && isLastFridayOfMonth(today)) { console.log('  ✔️ Is a new Monthly task on the last Friday. Should be included.'); return true; }
                console.log('  ❌ Is a new task, but not due today.');
                return false;
            }

            const lastCompleted = new Date(target.last_completed_at);
            lastCompleted.setHours(0, 0, 0, 0);

            if (lastCompleted.getTime() >= today.getTime()) {
                console.log('  ❌ Already completed today or in the future.');
                return false; 
            }

            switch (target.frequency) {
                case 'Daily': console.log('  ✔️ Is a past Daily task. Should be included.'); return true;
                case 'Weekly':
                    const isDue = today.getDay() === 5;
                    console.log(isDue ? '  ✔️ Is a past Weekly task on a Friday. Should be included.' : '  ❌ Is a past Weekly task, but not a Friday.');
                    return isDue;
                case 'Monthly':
                    const isDueMonthly = isLastFridayOfMonth(today);
                    console.log(isDueMonthly ? '  ✔️ Is a past Monthly task on the last Friday. Should be included.' : '  ❌ Is a past Monthly task, but not the last Friday.');
                    return isDueMonthly;
                default:
                    return false;
            }
        });
        
        // --- CHECKPOINT 3: See what tasks are left after filtering ---
        console.log('--- CHECKPOINT 3: Tasks remaining after filtering ---');
        console.table(todaysTasks);

        const frequencyOrder = { 'Monthly': 1, 'Weekly': 2, 'Daily': 3 };
        todaysTasks.sort((a, b) => frequencyOrder[a.frequency] - frequencyOrder[b.frequency]);

        linkedinTasksList.innerHTML = '';
        mediaTasksList.innerHTML = '';

        if (todaysTasks.length === 0) {
            console.log('--- CHECKPOINT 4: No tasks to display. ---');
            linkedinTasksList.innerHTML = '<p>No tasks due today. Great job!</p>';
            return;
        }

        console.log('--- CHECKPOINT 4: Rendering tasks... ---');
        todaysTasks.forEach(target => {
            const taskHTML = `
                <div class="task-item ${target.frequency.toLowerCase()}">
                    <div class="task-header">
                        <a href="${target.linkedin_url}" target="_blank">${target.name}</a>
                        ${target.publication ? `<span class="publication">(${target.publication})</span>` : ''}
                    </div>
                    <form class="interaction-form" data-target-id="${target.id}">
                        <div class="actions">
                            <label><input type="checkbox" name="checked"> Checked</label>
                            <label><input type="checkbox" name="commented"> Commented</label>
                            <label><input type="checkbox" name="contacted"> Contacted</label>
                            ${target.status === 'Awaiting Reply' ? `<label><input type="checkbox" name="replied"> ↩️ Replied</label>` : ''}
                        </div>
                        <textarea name="notes" placeholder="Add a note..."></textarea>
                        <button type="submit">Save Interaction</button>
                    </form>
                </div>
            `;
            if (target.target_type === 'Media') {
                mediaTasksList.innerHTML += taskHTML;
            } else {
                linkedinTasksList.innerHTML += taskHTML;
            }
        });

        // Add event listeners to the new forms
        document.querySelectorAll('.interaction-form').forEach(form => {
            form.addEventListener('submit', handleInteractionSubmit);
        });
    };

    // --- HANDLE INTERACTION SUBMIT ---
    const handleInteractionSubmit = async (event) => {
        event.preventDefault();
        const form = event.target;
        const targetId = form.dataset.targetId;
        const notes = form.elements.notes.value;
        const interactionsToLog = [];
        let newStatus = 'Active';

        // Check which boxes were ticked
        if (form.elements.checked.checked) interactionsToLog.push({ interaction_type: 'Checked', notes, target_id: targetId });
        if (form.elements.commented.checked) interactionsToLog.push({ interaction_type: 'Commented', notes, target_id: targetId });
        if (form.elements.contacted.checked) {
            interactionsToLog.push({ interaction_type: 'Contacted', notes, target_id: targetId });
            newStatus = 'Awaiting Reply'; // Set status if contacted
        }
        if (form.elements.replied && form.elements.replied.checked) {
             interactionsToLog.push({ interaction_type: 'Replied', notes, target_id: targetId });
             newStatus = 'Active'; // Status goes back to Active after reply
        }

        // 1. Log the interactions
        if (interactionsToLog.length > 0) {
            const { error: insertError } = await supabaseClient.from('interactions').insert(interactionsToLog);
            if (insertError) console.error('Error logging interaction:', insertError);
        }

        // 2. Update the target's status and last_completed_at
        const { error: updateError } = await supabaseClient
            .from('targets')
            .update({ last_completed_at: new Date().toISOString(), status: newStatus })
            .eq('id', targetId);
        
        if (updateError) console.error('Error updating target:', updateError);

        // 3. Refresh the task list
        fetchAndDisplayTasks();
    };


    // --- ADD NEW TARGET ---
    addTargetForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const newTarget = {
            name: document.getElementById('target-name').value,
            linkedin_url: document.getElementById('target-url').value,
            frequency: document.getElementById('target-frequency').value,
            target_type: document.getElementById('target-type').value,
            publication: document.getElementById('target-publication').value || null,
        };

        const { data, error } = await supabaseClient.from('targets').insert([newTarget]);

        if (error) {
            console.error('Error adding new target:', error);
            alert('Could not add target.');
        } else {
            console.log('Successfully added target:', data);
            addTargetForm.reset();
            modal.style.display = 'none';
            fetchAndDisplayTasks(); // Refresh the list to show the new target if it's due
        }
    });

    // ============================================================================
    //  AUTHENTICATION
    // ============================================================================
    
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        authError.textContent = '';
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

        if (error) {
            authError.textContent = 'Error: ' + error.message;
        } else {
            loginSection.style.display = 'none';
            appSection.style.display = 'block';
            fetchAndDisplayTasks(); // Fetch tasks on login
        }
    });

    logoutBtn.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        loginSection.style.display = 'block';
        appSection.style.display = 'none';
        linkedinTasksList.innerHTML = '';
        mediaTasksList.innerHTML = '';
    });

    async function checkSession() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            loginSection.style.display = 'none';
            appSection.style.display = 'block';
            fetchAndDisplayTasks(); // Fetch tasks if session exists
        } else {
            loginSection.style.display = 'block';
            appSection.style.display = 'none';
        }
    }

    // ============================================================================
    //  MODAL & UI CONTROLS
    // ============================================================================
    
    addTargetBtn.addEventListener('click', () => { modal.style.display = 'flex'; });
    closeModalBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    window.addEventListener('click', (event) => { if (event.target === modal) modal.style.display = 'none'; });
    targetTypeSelect.addEventListener('change', () => {
        targetPublicationInput.style.display = targetTypeSelect.value === 'Media' ? 'block' : 'none';
    });
    
    // ============================================================================
    //  INITIALIZATION
    // ============================================================================
    checkSession();
});
