let editIndex = null;
let snags = [];
let currentSortField = null;
let currentSortOrder = 'desc';
let currentPage = 1;
const snagsPerPage = 10;
let currentStatusFilter = 'All';
let currentAssigneeFilter = 'All';
let searchTerm = '';
let startDateFilter = '';
let endDateFilter = '';

function fetchSnags() {
    fetch('http://localhost:3000/snags')
        .then(response => response.json())
        .then(data => {
            snags = data.map(snag => ({
                ...snag,
                date_reported: new Date(snag.date_reported).toLocaleDateString('en-CA'),
                date_resolved: snag.date_resolved ? new Date(snag.date_resolved).toLocaleDateString('en-CA') : null
            }));
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
    const dateReported = new Date(document.getElementById('dateReported').value);
    const assignedTo = document.getElementById('assignedTo').value;
    const status = document.getElementById('status').value;
    const issueType = document.getElementById('issueType').value;
    const dateResolved = document.getElementById('dateResolved').value ? new Date(document.getElementById('dateResolved').value) : null;
    const wasItReportedBefore = document.getElementById('wasItReportedBefore').value === 'true';
    const previousDateReported = document.getElementById('previousDateReported').value ? new Date(document.getElementById('previousDateReported').value) : null;
    const previousWorker = document.getElementById('previousWorker').value;
    const recurringCount = parseInt(document.getElementById('recurringCount').value, 10) || 1;

    // Adjust dates to South Africa timezone (UTC+2)
    const formattedDateReported = new Date(dateReported.getTime() - (dateReported.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const formattedDateResolved = dateResolved ? new Date(dateResolved.getTime() - (dateResolved.getTimezoneOffset() * 60000)).toISOString().split('T')[0] : null;
    const formattedPreviousDateReported = previousDateReported ? new Date(previousDateReported.getTime() - (previousDateReported.getTimezoneOffset() * 60000)).toISOString().split('T')[0] : null;

    const snag = {
        snag_details: snagDetails,
        snag_link: snagLink,
        consultant_reporter_name: consultantReporterName,
        date_reported: formattedDateReported,
        assigned_to: assignedTo,
        status: status,
        issue_type: issueType,
        date_resolved: formattedDateResolved,
        was_it_reported_before: wasItReportedBefore,
        previous_date_reported: formattedPreviousDateReported,
        previous_worker: previousWorker || null,
        recurring_count: recurringCount
    };

    const alertPlaceholder = document.getElementById('alertPlaceholder');

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
            snags[editIndex] = { ...snags[editIndex], ...snag };
            editIndex = null;
            renderSnagTable();
            updateSummary();
            showAlert('Snag updated successfully!', 'success', alertPlaceholder);
        })
        .catch(error => {
            console.error('Error updating snag:', error);
            showAlert('Failed to update snag. Please try again.', 'danger', alertPlaceholder);
        });
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
            showAlert('Snag added successfully!', 'success', alertPlaceholder);
        })
        .catch(error => {
            console.error('Error adding snag:', error);
            showAlert('Failed to add snag. Please try again.', 'danger', alertPlaceholder);
        });
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

// Custom sort functions for each status
function sortByStatus(targetStatus) {
    snags.sort((a, b) => {
        if (a.status === targetStatus) return -1;
        if (b.status === targetStatus) return 1;
        return 0; // Keep original order if neither matches the targetStatus
    });

    const otherSnags = snags.filter(snag => snag.status !== targetStatus).sort((a, b) => a.status.localeCompare(b.status));
    snags = snags.filter(snag => snag.status === targetStatus).concat(otherSnags);

    renderSnagTable();
}

// Render the snag table with filters and search
function renderSnagTable(statusFilter = currentStatusFilter, assigneeFilter = currentAssigneeFilter) {
    const snagTableBody = document.getElementById('snagTableBody');
    snagTableBody.innerHTML = '';

    const filteredSnags = snags.filter(snag =>
        (statusFilter === 'All' || (statusFilter === 'Recurring' ? snag.recurring_count >= 2 : snag.status === statusFilter)) &&
        (assigneeFilter === 'All' || snag.assigned_to === assigneeFilter) &&
        (!startDateFilter || new Date(snag.date_reported) >= new Date(startDateFilter)) &&
        (!endDateFilter || new Date(snag.date_reported) <= new Date(endDateFilter)) &&
        (snag.snag_details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        snag.consultant_reporter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        snag.snag_link.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Apply pagination
    const startIndex = (currentPage - 1) * snagsPerPage;
    const endIndex = startIndex + snagsPerPage;
    const paginatedSnags = filteredSnags.slice(startIndex, endIndex);

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
            <td>${snag.issue_type || ''}</td>
            <td>
                <button class="btn btn-success btn-sm" onclick="editSnag(${filteredSnags.indexOf(snag) + startIndex})">Edit</button>
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
    const filteredSnags = snags.filter(snag =>
        (currentStatusFilter === 'All' || (currentStatusFilter === 'Recurring' ? snag.recurring_count >= 2 : snag.status === currentStatusFilter)) &&
        (currentAssigneeFilter === 'All' || snag.assigned_to === currentAssigneeFilter) &&
        (!startDateFilter || new Date(snag.date_reported) >= new Date(startDateFilter)) &&
        (!endDateFilter || new Date(snag.date_reported) <= new Date(endDateFilter)) &&
        (snag.snag_details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        snag.consultant_reporter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        snag.snag_link.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const snag = filteredSnags[index - (currentPage - 1) * snagsPerPage];
    document.getElementById('snagDetails').value = snag.snag_details;
    document.getElementById('snagLink').value = snag.snag_link;
    document.getElementById('consultantReporterName').value = snag.consultant_reporter_name;
    document.getElementById('dateReported').value = snag.date_reported;
    document.getElementById('assignedTo').value = snag.assigned_to;
    document.getElementById('status').value = snag.status;
    document.getElementById('issueType').value = snag.issue_type;
    document.getElementById('dateResolved').value = snag.date_resolved || '';
    document.getElementById('wasItReportedBefore').value = snag.was_it_reported_before ? 'true' : 'false';
    document.getElementById('previousDateReported').value = snag.previous_date_reported || '';
    document.getElementById('previousWorker').value = snag.previous_worker || '';
    document.getElementById('recurringCount').value = snag.recurring_count || 1;

    // Preserve the exact index of the selected snag for update
    editIndex = snags.findIndex(s => s.id === snag.id);
}

function deleteSnag(id) {
    const alertPlaceholder = document.getElementById('alertPlaceholder');
    fetch(`http://localhost:3000/snags/${id}`, {
        method: 'DELETE'
    })
    .then(() => {
        snags = snags.filter(s => s.id !== id);
        renderSnagTable();
        updateSummary();
        showAlert('Snag deleted successfully!', 'success', alertPlaceholder);
    })
    .catch(error => {
        console.error('Error deleting snag:', error);
        showAlert('Failed to delete snag. Please try again.', 'danger', alertPlaceholder);
    });
}

function closeSnag(id) {
    const index = snags.findIndex(s => s.id === id);
    const alertPlaceholder = document.getElementById('alertPlaceholder');
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
        .then(response => response.json())
        .then(updatedSnag => {
            snags[index] = updatedSnag; // Update the local snags array with the server response
            renderSnagTable();
            updateSummary();
            showAlert('Snag closed successfully!', 'success', alertPlaceholder);
        })
        .catch(error => {
            console.error('Error closing snag:', error);
            showAlert('Failed to close snag. Please try again.', 'danger', alertPlaceholder);
        });
    }
}

// Filter snags by date range
function filterByDate() {
    startDateFilter = document.getElementById('startDate').value;
    endDateFilter = document.getElementById('endDate').value;
    currentPage = 1;
    renderSnagTable();
}

// Clear all filters
function clearFilters() {
    currentStatusFilter = 'All';
    currentAssigneeFilter = 'All';
    startDateFilter = '';
    endDateFilter = '';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    currentPage = 1;
    renderSnagTable();
}

// Update the summary
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

// Function to generate the report with summary
function generateReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'landscape'
    });
    const dateGenerated = new Date().toLocaleDateString();
    const periodFrom = startDateFilter ? formatDate(startDateFilter) : 'N/A';
    const periodTo = endDateFilter ? formatDate(endDateFilter) : 'N/A';

    // Report Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Snag Tracking Report', 10, 20);

    // Date Generated and Period
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date Generated: ${dateGenerated}`, 10, 30);
    doc.text(`Period From: ${periodFrom} To: ${periodTo}`, 10, 40);

    // Table Headers
    const headers = [['ID', 'Details', 'Reporter', 'Reported', 'Assigned', 'Status', 'Resolved', 'Reported Before?', 'Date Reported', 'Previous Worker', 'Recurring Count', 'Issue Type']];

    // Filter the snags based on current filters and search term
    let filteredSnags = snags.filter(snag =>
        (currentStatusFilter === 'All' || (currentStatusFilter === 'Recurring' ? snag.recurring_count >= 2 : snag.status === currentStatusFilter)) &&
        (currentAssigneeFilter === 'All' || snag.assigned_to === currentAssigneeFilter) &&
        (!startDateFilter || new Date(snag.date_reported) >= new Date(startDateFilter)) &&
        (!endDateFilter || new Date(snag.date_reported) <= new Date(endDateFilter)) &&
        (snag.snag_details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        snag.consultant_reporter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        snag.snag_link.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Sort the filtered snags by date_reported in descending order
    filteredSnags.sort((a, b) => new Date(b.date_reported) - new Date(a.date_reported));

    // Prepare the main report data
    const reportData = filteredSnags.map(snag => [
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
        snag.recurring_count,
        snag.issue_type
    ]);

    // Add the main report table
    doc.autoTable({
        startY: 50,
        head: headers,
        body: reportData,
        styles: { fontSize: 10, cellWidth: 'auto' }, // Auto width for cells
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
        margin: { top: 30 }
    });

    // Summary Section at the end
    const summaryY = doc.autoTable.previous.finalY + 10;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 10, summaryY);

    // Summary Content with styled boxes
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    // Box settings
    const boxX = 10;
    const boxY = summaryY + 10;
    const boxWidth = 55;
    const boxHeight = 20;
    const boxPadding = 2;
    const spacing = 5; // Spacing between boxes

    // Draw and fill boxes for each summary item
    doc.setDrawColor(0);
    doc.setFillColor(240, 240, 240);
    doc.rect(boxX, boxY, boxWidth, boxHeight, 'FD');
    doc.rect(boxX + boxWidth + spacing, boxY, boxWidth, boxHeight, 'FD');
    doc.rect(boxX + 2 * (boxWidth + spacing), boxY, boxWidth, boxHeight, 'FD');
    doc.rect(boxX + 3 * (boxWidth + spacing), boxY, boxWidth, boxHeight, 'FD');
    doc.rect(boxX + 4 * (boxWidth + spacing), boxY, boxWidth, boxHeight, 'FD');

    // Add summary text inside the boxes
    doc.text(`Total Snags: ${snags.length}`, boxX + boxPadding, boxY + 12);
    doc.text(`Open Snags: ${snags.filter(s => s.status === 'To Do').length}`, boxX + boxWidth + spacing + boxPadding, boxY + 12);
    doc.text(`In Progress: ${snags.filter(s => s.status === 'In Progress').length}`, boxX + 2 * (boxWidth + spacing) + boxPadding, boxY + 12);
    doc.text(`Awaiting Feedback: ${snags.filter(s => s.status === 'Awaiting Feedback').length}`, boxX + 3 * (boxWidth + spacing) + boxPadding, boxY + 12);
    doc.text(`Resolved: ${snags.filter(s => s.status === 'Resolved').length}`, boxX + 4 * (boxWidth + spacing) + boxPadding, boxY + 12);

    doc.save('Snag_Tracking_Report.pdf');
}

// Function to display alert messages
function showAlert(message, type, placeholder) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
    `;
    placeholder.appendChild(wrapper);
}

// Attach search input event listener
document.getElementById('searchInput').addEventListener('input', function() {
    searchTerm = this.value;
    currentPage = 1; // Reset to first page when applying a new search term
    renderSnagTable();
});

// Export to Excel
function exportToExcel() {
    const filteredSnags = snags.filter(snag =>
        (currentStatusFilter === 'All' || (currentStatusFilter === 'Recurring' ? snag.recurring_count >= 2 : snag.status === currentStatusFilter)) &&
        (currentAssigneeFilter === 'All' || snag.assigned_to === currentAssigneeFilter) &&
        (!startDateFilter || new Date(snag.date_reported) >= new Date(startDateFilter)) &&
        (!endDateFilter || new Date(snag.date_reported) <= new Date(endDateFilter)) &&
        (snag.snag_details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        snag.consultant_reporter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        snag.snag_link.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const sortedSnags = filteredSnags.sort((a, b) => new Date(b.date_reported) - new Date(a.date_reported));

    const ws_data = [
        ['ID', 'Details', 'Reporter', 'Reported', 'Assigned', 'Status', 'Resolved', 'Reported Before?', 'Date Reported', 'Previous Worker', 'Recurring Count', 'Issue Type']
    ];

    sortedSnags.forEach(snag => {
        ws_data.push([
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
            snag.recurring_count,
            snag.issue_type
        ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    XLSX.utils.book_append_sheet(wb, ws, 'Snags');
    XLSX.writeFile(wb, 'Snag_Tracking_Report.xlsx');
}

// Export to CSV
function exportToCSV() {
    const filteredSnags = snags.filter(snag =>
        (currentStatusFilter === 'All' || (currentStatusFilter === 'Recurring' ? snag.recurring_count >= 2 : snag.status === currentStatusFilter)) &&
        (currentAssigneeFilter === 'All' || snag.assigned_to === currentAssigneeFilter) &&
        (!startDateFilter || new Date(snag.date_reported) >= new Date(startDateFilter)) &&
        (!endDateFilter || new Date(snag.date_reported) <= new Date(endDateFilter)) &&
        (snag.snag_details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        snag.consultant_reporter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        snag.snag_link.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const sortedSnags = filteredSnags.sort((a, b) => new Date(b.date_reported) - new Date(a.date_reported));

    const ws_data = [
        ['ID', 'Details', 'Reporter', 'Reported', 'Assigned', 'Status', 'Resolved', 'Reported Before?', 'Date Reported', 'Previous Worker', 'Recurring Count', 'Issue Type']
    ];

    sortedSnags.forEach(snag => {
        ws_data.push([
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
            snag.recurring_count,
            snag.issue_type
        ]);
    });

    let csvContent = 'data:text/csv;charset=utf-8,';
    ws_data.forEach(row => {
        csvContent += row.join(',') + '\r\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Snag_Tracking_Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Initial fetch
fetchSnags();
// THEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE 
