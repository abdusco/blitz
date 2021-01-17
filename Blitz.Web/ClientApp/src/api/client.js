const sleep = async (delay = 750) => new Promise(resolve => setTimeout(resolve, delay));
/**
 * @param {string} url
 * @param {Partial<RequestInit>} options
 * */
const fetchJson = async (url, options = {}) => {
    let {body} = options;
    const headers = options.headers || {};
    if (typeof body === 'object' && body !== null) {
        body = JSON.stringify(body);
        headers['content-type'] = 'application/json'
    }
    const res = await fetch(url, {...options, body, headers});
    if (res.status === 204) {
        return
    }
    return await res.json();
}


class BlitzClient {
    async listProjects() {
        return fetchJson('/api/projects');
    }

    async createProject(project) {
        return fetchJson('/api/projects', {method: 'POST', body: project})
    }

    /**
     * @param {string} id
     * */
    async deleteProject(id) {
        return fetchJson(`/api/projects/${id}`, {method: 'DELETE'});
    }

    /**
     * @param {string} id
     * */
    async getProjectDetails(id) {
        return fetchJson(`/api/projects/${id}`);
    }

    async createCronjob(cronjob) {
        return fetchJson(`/api/cronjobs`, {method: 'POST', body: cronjob});
    }

    /**
     * @param {string} id
     * */
    async getCronjobDetails(id) {
        return fetchJson(`/api/cronjobs/${id}`);
    }

    /**
     * @param {string} id
     * */
    async getCronjobExecutions(id) {
        return fetchJson(`/api/cronjobs/${id}/executions`);
    }

    /**
     * @param {string} id
     * */
    async triggerCronjob(id) {
        return fetchJson(`/api/cronjobs/${id}/trigger`, {method: 'POST'});
    }

    /**
     * @param {string} id
     * */
    async deleteCronjob(id) {
        return fetchJson(`/api/cronjobs/${id}`, {method: 'DELETE'});
    }

    /**
     * @param {string} id
     * @param {Record<string, any>} patch
     * */
    async updateCronjob(id, patch) {
        return fetchJson(`/api/cronjobs/${id}`, {method: 'PATCH', body: patch});
    }

    /**
     * @param {string} id
     * @param {boolean} enabled
     * */
    async toggleCronjob(id, enabled) {
        return this.updateCronjob(id, {enabled});
    }

    /**
     * @param {string} id
     * */
    async getExecutionDetails(id) {
        return fetchJson(`/api/executions/${id}`);
    }

    async listCronjobs() {
        return fetchJson(`/api/cronjobs`);
    }

    async listExecutions(skip = 0, take = 20) {
        return fetchJson(`/api/executions?skip=${skip}&take=${take}`);
    }
}

export default new BlitzClient(); 