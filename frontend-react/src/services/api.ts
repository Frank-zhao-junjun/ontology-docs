import axios from 'axios';
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});
export const login = (u: string, p: string) => api.post('/auth/login', { username: u, password: p });
export const chatExecute = (msg: string, sid: string, dim?: string) =>
  api.post('/chat/execute', { message: msg, session_id: sid, dimension: dim });
export const getMetaModels = () => api.get('/meta-models/definitions');
export const createMetaModel = (mt: string, name: string, content: object) =>
  api.post('/meta-models/definitions', { model_type: mt, name, version: '1.0.0', content });
export const publishRelease = (rno: string, ids: number[], op: string) =>
  api.post('/meta-models/publish', { release_no: rno, model_ids: ids, operator: op });
export const getDomains = () => api.get('/domains');
export const createDomain = (name: string, description: string) =>
  api.post('/domains', { name, description });
export const getEntitiesGrouped = () => api.get('/entities/grouped');
export const getVersions = () => api.get('/versions');
export const getVersionDiff = (from: string, to: string) =>
  api.get('/versions/diff', { params: { from, to } });
export const exportJson = (rno: string) => api.get('/export/json/' + rno);
export default api;
