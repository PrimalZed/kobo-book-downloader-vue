<script lang="ts" setup>
import { useKobo, type Credentials } from '@/stores/use-kobo';
import { computed, ref, watch } from 'vue';
import captchaGrabber from './captcha-grabber.vue';
import { storeToRefs } from 'pinia';

const emit = defineEmits<{
	'update:credentials': [value: Credentials | undefined];
}>();

const { credentials } = storeToRefs(useKobo());

const username = ref<string>();
const password = ref<string>();
const captcha = ref<string>();

watch([username, password, captcha], ([newUsername, newPassword, newCaptcha]) => {
	credentials.value = newUsername && newPassword && newCaptcha
		? {
			email: newUsername,
			password: newPassword,
			captcha: newCaptcha,
		}
		: undefined;
});
</script>

<template>
<div>Username/Email</div>
<input type="text" name="LogInModel.UserName" v-model="username">
<div>Password</div>
<input type="password" name="LogInModel.Password" v-model="password">

<captcha-grabber @update:captcha="captcha = $event" />
</template>
