import { Duration } from 'luxon';

export function useFormatting() {
	function formatBytes(bytes: number, decimals = 2): string {
		if (!bytes) {
			return '0 Bytes';
		}
	
		const k = 1000;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	
		const i = Math.floor(Math.log(bytes) / Math.log(k));
	
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(Math.max(0, decimals)))} ${sizes[i]}`;
	}

	function formatDuration(seconds: number): string {
		return Duration.fromObject({ hours: 0, minutes: 0, seconds: seconds })
			.normalize()
			.toFormat('hh:mm:ss');
	}

	return {
		formatBytes,
		formatDuration,
	};
}