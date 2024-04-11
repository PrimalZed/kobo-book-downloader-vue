<script lang="ts" setup>
import { useAudiobookDownload } from '@/composables/use-audiobook-download';
import { useFormatting } from '@/composables/use-formatting';
import { useKobo } from '@/stores/use-kobo';
import { storeToRefs } from 'pinia';

const { audiobooks } = storeToRefs(useKobo());

const { downloadAudiobookZip, downloading } = useAudiobookDownload();

const { formatBytes, formatDuration } = useFormatting();
</script>

<template>
<div>
	<h3 v-if="!audiobooks">Loading...</h3>
	<ul>
		<li v-for="audiobook of audiobooks">
			<h3>{{ audiobook.Title }}</h3>
			<div v-for="contributor of audiobook.ContributorRoles">{{ contributor.Role }}: {{ contributor.Name }}</div>
			<div v-if="audiobook.Series">Audiobook {{ audiobook.Series.Number }} - {{ audiobook.Series.Name }}</div>
			<div>Duration: {{ formatDuration(audiobook.Duration) }}</div>
			<ul>
				<li v-for="downloadUrl of audiobook.DownloadUrls">
					{{ downloadUrl.Platform }} ({{ formatBytes(downloadUrl.Size) }})
					<button
						v-if="downloadUrl.DrmType === 'None' && downloadUrl.Format === 'MANIFEST'"
						type="button"
						class="btn btn-sm btn-primary"
						:disabled="Boolean(downloading)"
						@click="downloadAudiobookZip(audiobook.Title, downloadUrl.Url)"
					>
						<template v-if="downloading === downloadUrl.Url">Downloading...</template>
						<template v-else>Download Zip</template>
					</button>
				</li>
			</ul>
		</li>
	</ul>
</div>
</template>
