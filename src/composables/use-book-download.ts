import { useKobo } from '@/stores/use-kobo';
import { useQueryClient } from '@tanstack/vue-query';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { ref, readonly } from 'vue';

export interface AudiobookContents {
	Drm: { DrmType: string, Keys: never[] };
	Navigation: { Offset: number, PartId: number, Title: string }[];
	Spine: { Id: number, Bitrate: number, Duration: number, KeyId: null, MediaType: string, Url: string, FileExtension: string }[];
}

function toDownloadToken(url: string) {
	return new RegExp(/https:\/\/storedownloads\.kobo\.com\/download\?downloadToken=(.*)/).exec(url)?.[1]!;
}

export function useBookDownload() {
	const kobo = useKobo();
	const queryClient = useQueryClient();
	
	const downloadsApi = axios.create({ baseURL: 'https://storedownloads.kobo.com' });
	const cryptoApi = axios.create({ baseURL: import.meta.env.VITE_CRYPTO_URL });

	async function getFile(downloadToken: string): Promise<Blob> {
		const { data: fileBlob } = await downloadsApi.get<Blob>(
			'download',
			{ params: { downloadToken }, responseType: 'blob' }
		);
		return fileBlob;
	}

	async function decryptFile(source: Blob, fileKeys: Record<string, string>): Promise<Blob> {
		const form = new FormData();
		form.append('encryptedFile', source, 'encryptedFile.epub');
		form.append('key', `${kobo.deviceId}${kobo.userId!}`);
		for (const [name, value] of Object.entries(fileKeys)) {
			form.append(name, value);
		}
		const { data: fileBlob } = await cryptoApi.post<Blob>(
			'kdrm',
			form,
			{ headers: { "Content-Type": 'multipart/form-data' }, responseType: 'blob' },
		);
		return fileBlob;
	}

	const downloading = ref<string>();
	async function downloadKdrm(productId: string, url: string, title: string): Promise<void> {
		if (downloading.value) {
			throw 'Already downloading something';
		}
		downloading.value = url;

		const token = toDownloadToken(url);
		const encryptedFile = await queryClient.fetchQuery({
			queryKey: ['kobo', 'downloads', 'books', token] satisfies [string, string, string, string],
			queryFn: ({ queryKey: [,,, token]}) => getFile(token),
		});
		
		const fileKeys = await kobo.getFileKeys(productId);

		const decryptedFile = await queryClient.fetchQuery({
			queryKey: ['kobo', 'crypto', 'kdrm', token] satisfies [string, string, string, string],
			queryFn: async () => decryptFile(encryptedFile, fileKeys),
		});

		saveAs(decryptedFile, `${title}.epub`);
		downloading.value = undefined;
	}

	return {
		downloadKdrm,
		downloading: readonly(downloading),
	};
}
