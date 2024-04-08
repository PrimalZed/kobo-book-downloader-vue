<script lang="ts" setup>
import captchaGrabber from '@/assets/captcha-grabber.js?raw';
const emit = defineEmits<{ 'update:captcha': [captcha: string] }>();

function copyCaptchaGrabber() {
	return navigator.clipboard.writeText(captchaGrabber);	
}
</script>

<template>
<div>Open new private browser window</div>
<div>Go to <a href="https://authorize.kobo.com/signin">https://authorize.kobo.com/signin</a> and paste code into console:</div>
<div>
	<pre style="tab-size: 2em;" @click="copyCaptchaGrabber">{{ captchaGrabber }}</pre>
</div>
<div>
	<label>Enter Captcha</label>
	<div>
		<textarea style="width:400px; height: 100px;" @input="emit('update:captcha', ($event.target as HTMLTextAreaElement).value)" />
	</div>
</div>
</template>
