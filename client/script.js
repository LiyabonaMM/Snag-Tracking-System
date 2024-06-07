let editIndex = null;
let snags = [];

// Function to fetch snags from the database
function fetchSnags() {
    fetch('http://localhost:3000/snags')
        .then(response => response.json())
        .then(data => {
            snags = data;
            renderSnagTable();
            updateSummary();
        })
        .catch(error => console.error('Error fetching snags:', error));
}

document.getElementById('snagForm').addEventListener('submit', function(e) {
    e.preventDefault();
    addOrUpdateSnag();
});

function addOrUpdateSnag() {
    const description = document.getElementById('description').value;
    const jiraLink = document.getElementById('jiraLink').value;
    const dateIdentified = document.getElementById('dateIdentified').value;
    const assignedTo = document.getElementById('assignedTo').value;
    const status = document.getElementById('status').value;
    const priority = document.getElementById('priority').value;

    const snag = { description, jiraLink, dateIdentified, assignedTo, status, priority };

    if (editIndex !== null) {
        // Update existing snag
        const id = snags[editIndex].id;
        fetch(`http://localhost:3000/snags/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(snag)
        })
        .then(() => {
            fetchSnags();
            editIndex = null;
        })
        .catch(error => console.error('Error updating snag:', error));
    } else {
        // Add new snag
        fetch('http://localhost:3000/snags', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(snag)
        })
        .then(response => response.json())
        .then(newSnag => {
            snags.push(newSnag);
            renderSnagTable();
            updateSummary();
        })
        .catch(error => console.error('Error adding snag:', error));
    }

    document.getElementById('snagForm').reset();
}

function renderSnagTable(filter = 'All', assigneeFilter = null) {
    const snagTableBody = document.getElementById('snagTableBody');
    snagTableBody.innerHTML = '';
    snags.filter(snag => 
        (filter === 'All' || snag.status === filter) &&
        (!assigneeFilter || snag.assignedTo === assigneeFilter)
    ).forEach((snag, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${snag.id}</td>
            <td><a href="${snag.jiraLink}" target="_blank">${snag.description}</a></td>
            <td>${snag.dateIdentified}</td>
            <td>${snag.assignedTo}</td>
            <td>${snag.status}</td>
            <td>${snag.priority}</td>
            <td>
                <button class="btn btn-success btn-sm" onclick="editSnag(${index})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteSnag(${snag.id})">Delete</button>
                <button class="btn btn-secondary btn-sm" onclick="closeSnag(${snag.id})">Close</button>
            </td>
        `;
        snagTableBody.appendChild(row);
    });
}

function editSnag(index) {
    const snag = snags[index];
    document.getElementById('description').value = snag.description;
    document.getElementById('jiraLink').value = snag.jiraLink;
    document.getElementById('dateIdentified').value = snag.dateIdentified;
    document.getElementById('assignedTo').value = snag.assignedTo;
    document.getElementById('status').value = snag.status;
    document.getElementById('priority').value = snag.priority;

    editIndex = index;
}

function deleteSnag(id) {
    fetch(`http://localhost:3000/snags/${id}`, {
        method: 'DELETE'
    })
    .then(() => {
        snags = snags.filter(s => s.id !== id);
        renderSnagTable();
        updateSummary();
    })
    .catch(error => console.error('Error deleting snag:', error));
}

function closeSnag(id) {
    const index = snags.findIndex(s => s.id === id);
    if (index !== -1) {
        snags[index].status = 'Resolved';
        fetch(`http://localhost:3000/snags/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(snags[index])
        })
        .then(() => {
            renderSnagTable();
            updateSummary();
        })
        .catch(error => console.error('Error closing snag:', error));
    }
}

function filterSnags(filter) {
    renderSnagTable(filter);
}

function filterByAssignee(assignee) {
    renderSnagTable('All', assignee);
}

function updateSummary() {
    document.getElementById('totalSnags').innerText = snags.length;
    document.getElementById('openSnags').innerText = snags.filter(s => s.status === 'To Do').length;
    document.getElementById('inProgressSnags').innerText = snags.filter(s => s.status === 'In Progress').length;
    document.getElementById('awaitingFeedbackSnags').innerText = snags.filter(s => s.status === 'Awaiting Feedback').length;
    document.getElementById('resolvedSnags').innerText = snags.filter(s => s.status === 'Resolved').length;
}

// Initial fetch
fetchSnags();
