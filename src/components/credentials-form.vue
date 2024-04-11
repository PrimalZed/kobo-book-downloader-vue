<script lang="ts" setup>
import { useKobo, type Credentials } from '@/stores/use-kobo';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';
import captchaGrabber from './captcha-grabber.vue';

const { credentials, authenticationFailed } = storeToRefs(useKobo());

const username = ref<string | undefined>(credentials.value?.email);
const password = ref<string | undefined>(credentials.value?.password);
const captcha = ref<string | undefined>(credentials.value?.captcha);
const failed = authenticationFailed.value;
const invalid = ref(false);

const newCredentials = computed<Credentials | undefined>(() => 
	username.value && password.value && captcha.value
		? {
			email: username.value,
			password: password.value,
			captcha: captcha.value,
		}
		: undefined
);

function submit() {
	if (!newCredentials.value) {
		invalid.value = true;
		return;
	}
	credentials.value = newCredentials.value;
}

watch(captcha, (newCaptcha) => {
	if (newCaptcha) {
		document.querySelector<HTMLButtonElement>('button[type="submit"]')?.focus();
	}
});

onMounted(() => {
	credentials.value = undefined;
});
</script>

<template>
<div v-if="failed">Authentication Failed</div>
<div v-if="invalid">Enter username/email, password, and captcha</div>
<form @submit.prevent="submit">
	<div>Username/Email</div>
	<input type="text" name="LogInModel.UserName" v-model="username">
	<div>Password</div>
	<input type="password" name="LogInModel.Password" v-model="password">

	<captcha-grabber v-if="!captcha" @update:captcha="captcha = $event" />
	<div v-else>
		<h4>Captcha received:</h4>
		<pre>{{ `${captcha.slice(0, 100)}${captcha.length > 100 ? '...' : ''}` }}</pre>
		<button type="button" @click="captcha = undefined">New Captcha</button>
	</div>

	<div>
		<button type="submit">Sign In</button>
	</div>
</form>
</template>
