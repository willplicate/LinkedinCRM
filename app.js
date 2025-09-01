document.addEventListener('DOMContentLoaded', () => {
    console.log("Simple test script is running.");
    const allContactsButton = document.getElementById('view-all-btn');

    if (allContactsButton) {
        console.log("SUCCESS: Found the 'All Contacts' button in the HTML.");
        allContactsButton.addEventListener('click', () => {
            alert("IT WORKS! The button click was detected.");
        });
    } else {
        console.error("FAILURE: Could not find element with id 'view-all-btn' in the HTML.");
    }
});
