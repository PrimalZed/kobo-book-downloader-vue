var newCaptchaDiv = document.createElement("div");
newCaptchaDiv.id = "new-hcaptcha-container";
var siteKey = document.getElementById('hcaptcha-container')
	.getAttribute('data-sitekey');
document.body.replaceChildren(newCaptchaDiv);
grecaptcha.render( newCaptchaDiv.id, {
	sitekey: siteKey,
	callback: function(r) {
		console.log("Captcha response:");
		console.log(r);
		return navigator.clipboard.writeText(r);
	}
});
console.log('Click the checkbox to get the code');
