let editIndex = null;
let snags = [];

// Fetch snags from the server
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

// Handle form submission for adding or updating a snag
document.getElementById('snagForm').addEventListener('submit', function(e) {
    e.preventDefault();
    addOrUpdateSnag();
});

function addOrUpdateSnag() {
    const snagDetails = document.getElementById('snagDetails').value;
    const consultantReporterName = document.getElementById('consultantReporterName').value;
    const dateReported = document.getElementById('dateReported').value;
    const assignedTo = document.getElementById('assignedTo').value;
    const status = document.getElementById('status').value;
    const dateResolved = document.getElementById('dateResolved').value;
    const wasItReportedBefore = document.getElementById('wasItReportedBefore').value === 'true';
    const previousDateReported = document.getElementById('previousDateReported').value;
    const previousWorker = document.getElementById('previousWorker').value;

    // Create the snag object
    const snag = {
        snag_details: snagDetails,
        consultant_reporter_name: consultantReporterName,
        date_reported: dateReported,
        assigned_to: assignedTo,
        status: status,
        date_resolved: dateResolved || null, // Handle optional fields
        was_it_reported_before: wasItReportedBefore,
        previous_date_reported: previousDateReported || null, // Handle optional fields
        previous_worker: previousWorker || null // Handle optional fields
    };

    console.log("Adding or Updating Snag:", snag);

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

// Render the snag table with filters
function renderSnagTable(statusFilter = 'All', assigneeFilter = 'All') {
    const snagTableBody = document.getElementById('snagTableBody');
    snagTableBody.innerHTML = '';

    const filteredSnags = snags.filter(snag =>
        (statusFilter === 'All' || snag.status === statusFilter) &&
        (assigneeFilter === 'All' || snag.assigned_to === assigneeFilter)
    );

    console.log("Filtered Snags for Rendering:", filteredSnags);

    filteredSnags.forEach((snag, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${snag.id}</td>
            <td>${snag.snag_details || ''}</td>
            <td>${snag.consultant_reporter_name || ''}</td>
            <td>${snag.date_reported || ''}</td>
            <td>${snag.assigned_to || ''}</td>
            <td>${snag.status || ''}</td>
            <td>${snag.date_resolved || ''}</td>
            <td>${snag.was_it_reported_before ? 'Yes' : 'No'}</td>
            <td>${snag.previous_date_reported || ''}</td>
            <td>${snag.previous_worker || ''}</td>
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
    document.getElementById('snagDetails').value = snag.snag_details;
    document.getElementById('consultantReporterName').value = snag.consultant_reporter_name;
    document.getElementById('dateReported').value = snag.date_reported;
    document.getElementById('assignedTo').value = snag.assigned_to;
    document.getElementById('status').value = snag.status;
    document.getElementById('dateResolved').value = snag.date_resolved || '';
    document.getElementById('wasItReportedBefore').value = snag.was_it_reported_before ? 'true' : 'false';
    document.getElementById('previousDateReported').value = snag.previous_date_reported || '';
    document.getElementById('previousWorker').value = snag.previous_worker || '';

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

function filterSnags(status) {
    currentStatusFilter = status;
    renderSnagTable(currentStatusFilter, currentAssigneeFilter);
}

let currentAssigneeFilter = 'All';
function filterByAssignee(assignee) {
    currentAssigneeFilter = assignee;
    renderSnagTable(currentStatusFilter, currentAssigneeFilter);
}

let currentStatusFilter = 'All';
function filterByStatus(status) {
    currentStatusFilter = status;
    renderSnagTable(currentStatusFilter, currentAssigneeFilter);
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
