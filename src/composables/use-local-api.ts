import axios from 'axios';

export function useLocalApi(path: string) {
	return axios.create({ baseURL: `${import.meta.env.VITE_SERVER_BASE_URL}${path}`, withCredentials: true });
}
