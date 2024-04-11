<script lang="ts" setup>
import captchaGrabber from '@/assets/captcha-grabber.js?raw';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
const emit = defineEmits<{ 'update:captcha': [captcha: string] }>();

function copyCaptchaGrabber() {
	return navigator.clipboard.writeText(captchaGrabber);
}

async function paste() {
	const clipboardText = await navigator.clipboard.readText();
	emit('update:captcha', clipboardText);
}
</script>

<template>
<h4>Get a Captcha</h4>
<ol>
	<li>
		<button type="button" class="btn btn-sm btn-primary" @click="copyCaptchaGrabber">
			Click here to copy javascript to clipboard
			<font-awesome-icon :icon="['far', 'copy']" />
		</button>
	</li>
	<li>Open new private browser window to <a href="https://authorize.kobo.com/signin">https://authorize.kobo.com/signin</a></li>
	<li>Open browser dev tools with F12</li>
	<li>Go to Console tab of browser dev tools</li>
	<li>Paste javascript code and press Enter</li>
	<li>Click on Captcha checkbox</li>
	<li>Captcha is automatically copied to your clipboard, but you can also copy from the result in the dev tools console</li>
	<li>
		<button type="button" class="btn btn-sm btn-primary" @click="paste">
			Click here to paste Captcha from clipboard
			<font-awesome-icon :icon="['far', 'paste']" />
		</button>
	</li>
</ol>
</template>
