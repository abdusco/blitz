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
    return fetch(url, {...options, body, headers}).then(r => r.json());
}


class BlitzClient {
    async listProjects() {
        return fetchJson('/api/projects');
    }

    async createProject(project) {
        return fetchJson('/api/projects', {method: 'POST', body: project})
    }
}

export default new BlitzClient(); 