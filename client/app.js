const { createApp } = Vue;

createApp({
    data() {
        return {
            snags: [],
            snag: {
                description: '',
                jiraLink: '',
                dateIdentified: '',
                assignedTo: '',
                status: 'To Do',
                priority: 'Medium'
            },
            editIndex: null,
            filter: 'All',
            assigneeFilter: null,
            summary: {
                total: 0,
                open: 0,
                inProgress: 0,
                awaitingFeedback: 0,
                resolved: 0
            }
        };
    },
    computed: {
        filteredSnags() {
            return this.snags.filter(snag => (this.filter === 'All' || snag.status === this.filter) &&
                                             (!this.assigneeFilter || snag.assignedTo === this.assigneeFilter));
        }
    },
    methods: {
        fetchSnags() {
            axios.get('http://localhost:3000/snags')
                .then(response => {
                    this.snags = response.data;
                    console.log("Fetched snags:", this.snags); // Debugging line
                    this.updateSummary();
                })
                .catch(error => console.error('Error fetching snags:', error));
        },
        addOrUpdateSnag() {
            if (this.editIndex !== null) {
                const id = this.snags[this.editIndex].id;
                axios.put(`http://localhost:3000/snags/${id}`, this.snag)
                    .then(() => {
                        this.fetchSnags();
                        this.editIndex = null;
                    })
                    .catch(error => console.error('Error updating snag:', error));
            } else {
                axios.post('http://localhost:3000/snags', this.snag)
                    .then(response => {
                        this.snags.push(response.data);
                        this.updateSummary();
                    })
                    .catch(error => console.error('Error adding snag:', error));
            }
            this.snag = { description: '', jiraLink: '', dateIdentified: '', assignedTo: '', status: 'To Do', priority: 'Medium' };
        },
        editSnag(index) {
            this.snag = { ...this.snags[index] };
            this.editIndex = index;
        },
        deleteSnag(id) {
            axios.delete(`http://localhost:3000/snags/${id}`)
                .then(() => {
                    this.snags = this.snags.filter(s => s.id !== id);
                    this.updateSummary();
                })
                .catch(error => console.error('Error deleting snag:', error));
        },
        closeSnag(id) {
            const index = this.snags.findIndex(s => s.id === id);
            if (index !== -1) {
                this.snags[index].status = 'Resolved';
                axios.put(`http://localhost:3000/snags/${id}`, this.snags[index])
                    .then(() => {
                        this.updateSummary();
                    })
                    .catch(error => console.error('Error closing snag:', error));
            }
        },
        filterSnags(filter) {
            this.filter = filter;
        },
        filterByAssignee(assignee) {
            this.assigneeFilter = assignee;
        },
        updateSummary() {
            this.summary.total = this.snags.length;
            this.summary.open = this.snags.filter(s => s.status === 'To Do').length;
            this.summary.inProgress = this.snags.filter(s => s.status === 'In Progress').length;
            this.summary.awaitingFeedback = this.snags.filter(s => s.status === 'Awaiting Feedback').length;
            this.summary.resolved = this.snags.filter(s => s.status === 'Resolved').length;
            console.log("Summary updated:", this.summary); // Debugging line
        }
    },
    mounted() {
        this.fetchSnags();
    }
}).mount('#app');
