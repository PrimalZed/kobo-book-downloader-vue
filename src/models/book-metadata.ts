export interface BookMetadata {
	Id?: string;
	RevisionId?: string;
	Title: string;
	ContributorRoles: { Name: string; Role: string }[];
	Series: { Name: string; Number: string; };
	DownloadUrls: {
		Platform: string;
		Size: number;
		Url: string;
		DrmType: 'None' | 'AdobeDrm' | 'KDRM' | 'SignedNoDrm';
		Format: 'EPUB3' | 'EPUB3_SAMPLE' | 'EPUB3WEB';
	}[];
}
