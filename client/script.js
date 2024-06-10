// script.js

let editIndex = null;
let snags = [];
let currentSortField = null;
let currentSortOrder = null;
let currentPage = 1;
const snagsPerPage = 10;

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
    const snagLink = document.getElementById('snagLink').value;
    const consultantReporterName = document.getElementById('consultantReporterName').value;
    const dateReported = document.getElementById('dateReported').value;
    const assignedTo = document.getElementById('assignedTo').value;
    const status = document.getElementById('status').value;
    const dateResolved = document.getElementById('dateResolved').value;
    const wasItReportedBefore = document.getElementById('wasItReportedBefore').value === 'true';
    const previousDateReported = document.getElementById('previousDateReported').value;
    const previousWorker = document.getElementById('previousWorker').value;
    const recurringCount = parseInt(document.getElementById('recurringCount').value, 10) || 1;

    const snag = {
        snag_details: snagDetails,
        snag_link: snagLink,
        consultant_reporter_name: consultantReporterName,
        date_reported: dateReported,
        assigned_to: assignedTo,
        status: status,
        date_resolved: dateResolved || null,
        was_it_reported_before: wasItReportedBefore,
        previous_date_reported: previousDateReported || null,
        previous_worker: previousWorker || null,
        recurring_count: recurringCount
    };

    console.log("Adding or Updating Snag:", snag);

    if (editIndex !== null) {
        const id = snags[editIndex].id;
        fetch(`http://localhost:3000/snags/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(snag)
        })
        .then(() => {
            snags[editIndex] = { ...snags[editIndex], ...snag }; // Update the local snags list immediately
            editIndex = null;
            renderSnagTable();
            updateSummary();
        })
        .catch(error => console.error('Error updating snag:', error));
    } else {
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

// Sort snags based on the specified field and order
function sortSnags(field, order) {
    currentSortField = field;
    currentSortOrder = order;

    snags.sort((a, b) => {
        const dateA = new Date(a[field]);
        const dateB = new Date(b[field]);

        if (order === 'asc') {
            return dateA - dateB;
        } else {
            return dateB - dateA;
        }
    });

    renderSnagTable();
}

// Render the snag table with filters
function renderSnagTable(statusFilter = 'All', assigneeFilter = 'All') {
    const snagTableBody = document.getElementById('snagTableBody');
    snagTableBody.innerHTML = '';

    const filteredSnags = snags.filter(snag =>
        (statusFilter === 'All' || snag.status === statusFilter) &&
        (assigneeFilter === 'All' || snag.assigned_to === assigneeFilter)
    );

    // Apply pagination
    const startIndex = (currentPage - 1) * snagsPerPage;
    const endIndex = startIndex + snagsPerPage;
    const paginatedSnags = filteredSnags.slice(startIndex, endIndex);

    console.log("Filtered Snags for Rendering:", paginatedSnags);

    paginatedSnags.forEach((snag, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${snag.id}</td>
            <td>${snag.snag_details ? `<a href="${snag.snag_link}" target="_blank">${snag.snag_details}</a>` : ''}</td>
            <td>${snag.consultant_reporter_name || ''}</td>
            <td>${formatDate(snag.date_reported)}</td>
            <td>${snag.assigned_to || ''}</td>
            <td>${snag.status || ''}</td>
            <td>${formatDate(snag.date_resolved)}</td>
            <td>${snag.was_it_reported_before ? 'Yes' : 'No'}</td>
            <td>${formatDate(snag.previous_date_reported)}</td>
            <td>${snag.previous_worker || ''}</td>
            <td>${snag.recurring_count}</td>
            <td>
                <button class="btn btn-success btn-sm" onclick="editSnag(${index + startIndex})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteSnag(${snag.id})">Delete</button>
                <button class="btn btn-secondary btn-sm" onclick="closeSnag(${snag.id})">Close</button>
            </td>
        `;
        snagTableBody.appendChild(row);
    });

    renderPagination(filteredSnags.length);
}

// Render pagination controls
function renderPagination(totalItems) {
    const paginationControls = document.getElementById('paginationControls');
    paginationControls.innerHTML = '';

    const totalPages = Math.ceil(totalItems / snagsPerPage);
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.classList.add('btn', 'btn-secondary', 'mr-1');
        pageButton.innerText = i;
        pageButton.onclick = () => changePage(i);
        if (i === currentPage) {
            pageButton.classList.add('active');
        }
        paginationControls.appendChild(pageButton);
    }
}

// Change to the specified page
function changePage(pageNumber) {
    currentPage = pageNumber;
    renderSnagTable();
}

function editSnag(index) {
    const snag = snags[index];
    document.getElementById('snagDetails').value = snag.snag_details;
    document.getElementById('snagLink').value = snag.snag_link;
    document.getElementById('consultantReporterName').value = snag.consultant_reporter_name;
    document.getElementById('dateReported').value = snag.date_reported;
    document.getElementById('assignedTo').value = snag.assigned_to;
    document.getElementById('status').value = snag.status;
    document.getElementById('dateResolved').value = snag.date_resolved || '';
    document.getElementById('wasItReportedBefore').value = snag.was_it_reported_before ? 'true' : 'false';
    document.getElementById('previousDateReported').value = snag.previous_date_reported || '';
    document.getElementById('previousWorker').value = snag.previous_worker || '';
    document.getElementById('recurringCount').value = snag.recurring_count || 1; // Set recurring count

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
        snags[index].date_resolved = new Date().toISOString().split('T')[0]; // Set the current date as resolved date
        fetch(`http://localhost:3000/snags/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(snags[index])
        })
        .then(() => {
            // Update the local snags list to reflect the resolved status immediately
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

// Format date to exclude time
function formatDate(dateString) {
    return dateString ? new Date(dateString).toISOString().split('T')[0] : '';
}

// Function to generate the report
function generateReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const dateGenerated = new Date().toLocaleDateString();

    doc.setFontSize(16);
    doc.text('Snag Tracking Report', 10, 10);
    doc.setFontSize(12);
    doc.text(`Date Generated: ${dateGenerated}`, 10, 20);

    const headers = [['ID', 'Details', 'Reporter', 'Date Reported', 'Assigned To', 'Status', 'Date Resolved', 'Was it Reported Before?', 'Previous Date Reported', 'Previous Worker', 'Recurring Count']];
    
    // Fetch all snags to ensure the report includes everything, regardless of pagination
    fetch('http://localhost:3000/snags')
        .then(response => response.json())
        .then(data => {
            const reportData = data.map(snag => [
                snag.id,
                snag.snag_details,
                snag.consultant_reporter_name,
                formatDate(snag.date_reported),
                snag.assigned_to,
                snag.status,
                formatDate(snag.date_resolved),
                snag.was_it_reported_before ? 'Yes' : 'No',
                formatDate(snag.previous_date_reported),
                snag.previous_worker || '',
                snag.recurring_count
            ]);

            doc.autoTable({
                startY: 30,
                head: headers,
                body: reportData,
                didDrawCell: (data) => {
                    // Add clickable links to the snag details column
                    if (data.column.index === 1 && data.cell.raw) {
                        doc.setFontSize(10);
                        doc.setTextColor(0, 0, 255);
                        const link = snags[data.row.index].snag_link;
                        if (link) {
                            // Use cell's text position if available, otherwise fallback to cell's position
                            const x = data.cell.textPos ? data.cell.textPos.x : data.cell.x + 2; // Adjust x if necessary
                            const y = data.cell.textPos ? data.cell.textPos.y : data.cell.y + data.cell.height / 2; // Center y in cell
                            doc.textWithLink(data.cell.raw, x, y, {
                                url: link
                            });
                        }
                        doc.setTextColor(0, 0, 0); // Reset the text color after adding the link
                    }
                }
            });

            doc.save('Snag_Tracking_Report.pdf');
        })
        .catch(error => console.error('Error generating report:', error));
}

// Initial fetch
fetchSnags();
