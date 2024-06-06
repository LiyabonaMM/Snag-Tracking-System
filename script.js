let snags = JSON.parse(localStorage.getItem('snags')) || [];
let editIndex = null;

document.getElementById('snagForm').addEventListener('submit', function(e) {
    e.preventDefault();
    addOrUpdateSnag();
});

function addOrUpdateSnag() {
    const description = document.getElementById('description').value;
    const dateIdentified = document.getElementById('dateIdentified').value;
    const assignedTo = document.getElementById('assignedTo').value;
    const status = document.getElementById('status').value;
    const priority = document.getElementById('priority').value;
    const recurrenceCount = parseInt(document.getElementById('recurrenceCount').value);

    if (editIndex !== null) {
        snags[editIndex] = { ...snags[editIndex], description, dateIdentified, assignedTo, status, priority, recurrenceCount };
        editIndex = null;
    } else {
        const id = snags.length ? snags[snags.length - 1].id + 1 : 1;
        snags.push({ id, description, dateIdentified, assignedTo, status, priority, recurrenceCount });
    }

    localStorage.setItem('snags', JSON.stringify(snags));
    renderSnagTable();
    updateSummary();
    document.getElementById('snagForm').reset();
}

function renderSnagTable() {
    const snagTableBody = document.getElementById('snagTableBody');
    snagTableBody.innerHTML = '';
    snags.forEach((snag, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${snag.id}</td>
            <td>${snag.description}</td>
            <td>${snag.dateIdentified}</td>
            <td>${snag.assignedTo}</td>
            <td>${snag.status}</td>
            <td>${snag.priority}</td>
            <td>${snag.recurrenceCount}</td>
            <td>
                <button class="btn btn-success btn-sm" onclick="editSnag(${index})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteSnag(${snag.id})">Delete</button>
            </td>
        `;
        snagTableBody.appendChild(row);
    });
}

function editSnag(index) {
    const snag = snags[index];
    document.getElementById('description').value = snag.description;
    document.getElementById('dateIdentified').value = snag.dateIdentified;
    document.getElementById('assignedTo').value = snag.assignedTo;
    document.getElementById('status').value = snag.status;
    document.getElementById('priority').value = snag.priority;
    document.getElementById('recurrenceCount').value = snag.recurrenceCount;

    editIndex = index;
}

function deleteSnag(id) {
    snags = snags.filter(s => s.id !== id);
    localStorage.setItem('snags', JSON.stringify(snags));
    renderSnagTable();
    updateSummary();
}

function updateSummary() {
    document.getElementById('totalSnags').innerText = snags.length;
    document.getElementById('openSnags').innerText = snags.filter(s => s.status === 'To Do').length;
    document.getElementById('inProgressSnags').innerText = snags.filter(s => s.status === 'In Progress').length;
    document.getElementById('resolvedSnags').innerText = snags.filter(s => s.status === 'Resolved').length;
}

// Initial render
renderSnagTable();
updateSummary();
