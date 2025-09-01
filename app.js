console.log("--- app.js was loaded and is running! ---");
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
    const modalTitle = document.querySelector('#add-target-modal h3');
    const tasksView = document.getElementById('tasks-view');
    const allContactsView = document.getElementById('all-contacts-view');
    const viewTasksBtn = document.getElementById('view-tasks-btn');
    const viewAllBtn = document.getElementById('view-all-btn');
    const allContactsTableContainer = document.getElementById('all-contacts-table-container');

    // ============================================================================
    //  CORE APP LOGIC
    // ============================================================================
    
    const fetchAndDisplayTasks = async () => {
        const { data: targets, error } = await supabaseClient
            .from('targets')
            .select('*')
            .in('status', ['Active', 'Awaiting Reply']);

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

        const todaysTasks = targets.filter(target => {
            if (!target.last_completed_at) {
                if (target.frequency === 'Daily') return true;
                if (target.frequency === 'Weekly' && today.getDay() === 5) return true;
                if (target.frequency === 'Monthly' && isLastFridayOfMonth(today)) return true;
                return false;
            }
            const lastCompleted = new Date(target.last_completed_at);
            lastCompleted.setHours(0, 0, 0, 0);
            if (lastCompleted.getTime() >= today.getTime()) {
                return false; 
            }
            switch (target.frequency) {
                case 'Daily': return true;
                case 'Weekly': return today.getDay() === 5;
                case 'Monthly': return isLastFridayOfMonth(today);
                default: return false;
            }
        });
        
        const frequencyOrder = { 'Monthly': 1, 'Weekly': 2, 'Daily': 3 };
        todaysTasks.sort((a, b) => frequencyOrder[a.frequency] - frequencyOrder[b.frequency]);

        linkedinTasksList.innerHTML = '';
        mediaTasksList.innerHTML = '';

        if (todaysTasks.length === 0) {
            linkedinTasksList.innerHTML = '<p>No tasks due today. Great job!</p>';
            return;
        }

        todaysTasks.forEach(target => {
            const taskHTML = `
                <div class="task-item ${target.frequency.toLowerCase()}">
                    <div class="task-header">
                        <a href="${target.linkedin_url}" target="_blank">${target.name}</a>
                        ${target.publication ? `<span class="publication">(${target.publication})</span>` : ''}
                        <div class="task-actions">
                            <button class="edit-btn" data-target-id="${target.id}">Edit</button>
                            <button class="delete-btn" data-target-id="${target.id}">Delete</button>
                        </div>
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

        document.querySelectorAll('.interaction-form').forEach(form => {
            form.addEventListener('submit', handleInteractionSubmit);
        });
    };

    const fetchAllContactsAndDisplayTable = async () => {
        const { data: targets, error } = await supabaseClient
            .from('targets')
            .select('*')
            .order('name', { ascending: true });
        
        if (error) {
            console.error('Error fetching all targets:', error);
            allContactsTableContainer.innerHTML = '<p>Could not load contacts.</p>';
            return;
        }

        if (targets.length === 0) {
            allContactsTableContainer.innerHTML = '<p>You have not added any contacts yet.</p>';
            return;
        }

        let tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Frequency</th>
                        <th>Status</th>
                        <th>Last Completed</th>
                    </tr>
                </thead>
                <tbody>
        `;

        targets.forEach(target => {
            const lastCompletedDate = target.last_completed_at 
                ? new Date(target.last_completed_at).toLocaleDateString() 
                : 'N/A';
            
            tableHTML += `
                <tr>
                    <td><a href="${target.linkedin_url}" target="_blank">${target.name}</a></td>
                    <td>${target.target_type}</td>
                    <td>${target.frequency}</td>
                    <td>${target.status}</td>
                    <td>${lastCompletedDate}</td>
                </tr>
            `;
        });

        tableHTML += '</tbody></table>';
        allContactsTableContainer.innerHTML = tableHTML;
    };

    const handleInteractionSubmit = async (event) => {
        event.preventDefault();
        const form = event.target;
        const targetId = form.dataset.targetId;
        const notes = form.elements.notes.value;
        const interactionsToLog = [];
        let newStatus = 'Active';

        if (form.elements.checked.checked) interactionsToLog.push({ interaction_type: 'Checked', notes, target_id: targetId });
        if (form.elements.commented.checked) interactionsToLog.push({ interaction_type: 'Commented', notes, target_id: targetId });
        if (form.elements.contacted.checked) {
            interactionsToLog.push({ interaction_type: 'Contacted', notes, target_id: targetId });
            newStatus = 'Awaiting Reply';
        }
        if (form.elements.replied && form.elements.replied.checked) {
             interactionsToLog.push({ interaction_type: 'Replied', notes, target_id: targetId });
             newStatus = 'Active';
        }

        if (interactionsToLog.length > 0) {
            const { error: insertError } = await supabaseClient.from('interactions').insert(interactionsToLog);
            if (insertError) console.error('Error logging interaction:', insertError);
        }

        const { error: updateError } = await supabaseClient
            .from('targets')
            .update({ last_completed_at: new Date().toISOString(), status: newStatus })
            .eq('id', targetId);
        
        if (updateError) console.error('Error updating target:', updateError);
        fetchAndDisplayTasks();
    };

    addTargetForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const targetId = document.getElementById('edit-target-id').value;
        
        const targetData = {
            name: document.getElementById('target-name').value,
            linkedin_url: document.getElementById('target-url').value,
            frequency: document.getElementById('target-frequency').value,
            target_type: document.getElementById('target-type').value,
            publication: document.getElementById('target-publication').value || null,
        };

        let error;
        if (targetId) {
            const { error: updateError } = await supabaseClient
                .from('targets')
                .update(targetData)
                .eq('id', targetId);
            error = updateError;
        } else {
            const { error: insertError } = await supabaseClient
                .from('targets')
                .insert([targetData]);
            error = insertError;
        }

        if (error) {
            console.error('Error saving target:', error);
            alert('Could not save target.');
        } else {
            closeModal();
            if (allContactsView.style.display !== 'none') {
                fetchAllContactsAndDisplayTable();
            } else {
                fetchAndDisplayTasks();
            }
        }
    });

    function handleTaskActions(event) {
        const target = event.target;
        if (target.matches('.edit-btn')) {
            handleEditClick(target.dataset.targetId);
        } else if (target.matches('.delete-btn')) {
            handleDeleteClick(target.dataset.targetId);
        }
    }
    linkedinTasksList.addEventListener('click', handleTaskActions);
    mediaTasksList.addEventListener('click', handleTaskActions);

    const handleDeleteClick = async (targetId) => {
        if (confirm('Are you sure you want to delete this target? This action cannot be undone.')) {
            const { error } = await supabaseClient
                .from('targets')
                .delete()
                .eq('id', targetId);
            
            if (error) {
                console.error('Error deleting target:', error);
                alert('Could not delete the target.');
            } else {
                fetchAndDisplayTasks();
            }
        }
    };

    const handleEditClick = async (targetId) => {
        const { data: target, error } = await supabaseClient
            .from('targets')
            .select('*')
            .eq('id', targetId)
            .single();

        if (error) {
            console.error('Error fetching target for edit:', error);
return;
        }

        document.getElementById('target-name').value = target.name;
        document.getElementById('target-url').value = target.linkedin_url;
        document.getElementById('target-frequency').value = target.frequency;
        document.getElementById('target-type').value = target.target_type;
        document.getElementById('target-publication').value = target.publication || '';
        document.getElementById('edit-target-id').value = target.id;

        targetPublicationInput.style.display = target.target_type === 'Media' ? 'block' : 'none';
        
        modalTitle.textContent = 'Edit Target';
        modal.style.display = 'flex';
    };

    const closeModal = () => {
        addTargetForm.reset();
        document.getElementById('edit-target-id').value = '';
        modal.style.display = 'none';
        modalTitle.textContent = 'Add New Target';
        targetPublicationInput.style.display = 'none';
    };

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
            fetchAndDisplayTasks();
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
            fetchAndDisplayTasks();
        } else {
            loginSection.style.display = 'block';
            appSection.style.display = 'none';
        }
    }

    addTargetBtn.addEventListener('click', () => { 
        closeModal();
        modalTitle.textContent = 'Add New Target';
        modal.style.display = 'flex'; 
    });
    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
    targetTypeSelect.addEventListener('change', () => {
        targetPublicationInput.style.display = targetTypeSelect.value === 'Media' ? 'block' : 'none';
    });
    
    checkSession();

    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.id = 'edit-target-id';
    addTargetForm.appendChild(hiddenInput);
});
