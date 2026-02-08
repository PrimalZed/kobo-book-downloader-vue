import { useQueryClient } from '@tanstack/vue-query';
import axios from 'axios';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { ref, readonly } from 'vue';

export interface AudiobookContents {
	Drm: { DrmType: string, Keys: never[] };
	Navigation: { Offset: number, PartId: number, Title: string }[];
	Spine: { Id: number, Bitrate: number, Duration: number, KeyId: null, MediaType: string, Url: string, FileExtension: string }[];
}

function toDownloadToken(url: string) {
	return new RegExp(/https:\/\/storedownloads\.kobo\.com\/download\?downloadToken=(.*)/).exec(url)?.[1]!;
}

export function useAudiobookDownload() {
	const queryClient = useQueryClient();
	
	const downloadsApi = axios.create({
		baseURL: 'https://storedownloads.kobo.com',
	});

	async function getContents(downloadToken: string): Promise<AudiobookContents> {
		const { data: contents } = await downloadsApi.get<AudiobookContents>('download', { params: { downloadToken } });
		return contents;
	}

	async function getFile(downloadToken: string): Promise<Blob> {
		const { data: fileBlob } = await downloadsApi.get<Blob>('download', { params: { downloadToken }, responseType: 'blob' });
		return fileBlob;
	}

	const downloading = ref<string>();
	async function downloadAudiobookZip(contentsUrl: string, title: string, author?: string): Promise<void> {
		if (downloading.value) {
			throw 'Already downloading something';
		}
		downloading.value = contentsUrl;

		const contentsToken = toDownloadToken(contentsUrl);
		const zip = await queryClient.fetchQuery({
			queryKey: ['kobo', 'downloads', 'audiobooks', contentsToken] satisfies [string, string, string, string],
			queryFn: async ({ queryKey: [,,, contentsToken]}) => {
				const contents = await getContents(contentsToken);
				const minimumIntegerDigits = (contents.Spine.length + 1).toString().length;
				const getFilePromises = contents.Spine
					.map(async ({ Url, FileExtension }, index) => ({
						fileName: `${(index + 1).toLocaleString(undefined, { minimumIntegerDigits })}.${FileExtension}`,
						blob: await getFile(toDownloadToken(Url)),
					}));
				const files = await Promise.all(getFilePromises);
				const zip = new JSZip();
				const folder = zip.folder(title)!;
				for (const { fileName, blob } of files) {
					folder.file<'blob'>(fileName, blob);
				}
				return await zip.generateAsync({ type: 'blob' });
			},
		});

		saveAs(zip, `${title}${author ? ` - ${author}` : ''}.zip`);
		downloading.value = undefined;
	}

	return {
		downloadAudiobookZip,
		downloading: readonly(downloading),
	};
}
