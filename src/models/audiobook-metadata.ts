export interface AudiobookMetadata {
	Title: string;
	ContributorRoles: { Name: string; Role: string }[];
	Series: { Name: string; Number: string; };
	Duration: number;
	DownloadUrls: { Platform: string; Size: number; Url: string; DrmType: 'None'; Format: 'MANIFEST'; }[];
}
