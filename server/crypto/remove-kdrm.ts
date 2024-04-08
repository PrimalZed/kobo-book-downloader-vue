import aes from 'aes-js';
import JSZip from 'jszip';
import sha from 'sha.js';

function _createFileKeyAes(key: string) {
	// console.log('raw key', key);
	const hashHex = sha('sha256').update(key).digest('hex');
	const hashBytes = Buffer.from(hashHex.slice(32), 'hex');
	// console.log('hash base64', hashBytes.toString('base64'));

	return new aes.ModeOfOperation.ecb(hashBytes);
}

function _decrypt(encryptedFileBytes: Uint8Array, fileKeyBase64: string, fileKeyAes: aes.ModeOfOperation.ModeOfOperationECB): Uint8Array {
	// console.log('fileKeyBase64', fileKeyBase64);
	const encryptedFileKey = Buffer.from(fileKeyBase64, 'base64');
	const decryptedFileKey = fileKeyAes.decrypt(encryptedFileKey);
	// console.log('decryptedFileKeyBase64', Buffer.from(decryptedFileKey).toString('base64'));

	const fileAes = new aes.ModeOfOperation.ecb(decryptedFileKey);

	// const encryptedFileBase64 = Buffer.from(encryptedFileBytes).toString('base64');
	// console.log('encryptedFileBase64', encryptedFileBase64.slice(0, 20), '...', encryptedFileBase64.slice(encryptedFileBase64.length - 20));
	
	const decryptedFileBytes = fileAes.decrypt(encryptedFileBytes);

	// const decryptedFileBase64 = Buffer.from(decryptedFileBytes).toString('base64');
	// console.log('decryptedFileBase64', decryptedFileBase64.slice(decryptedFileBase64.length - 20));

	const unpadded = aes.padding.pkcs7.strip(decryptedFileBytes);

	// const unpaddedLatin1 = Buffer.from(unpadded).toString('latin1');
	// console.log('start', unpaddedLatin1.slice(0, 20));
	// console.log('end', unpaddedLatin1.slice(unpaddedLatin1.length - 20));

	return unpadded;
}

export async function removeKdrm(source: Buffer, key: string, fileKeys: Record<string, string>): Promise<Buffer> {
	const sourceZip = await new JSZip().loadAsync(source);
	const fileKeyAes = _createFileKeyAes(key)

	const outZip = await Object.entries(sourceZip.files)
		.map(([fileName, filePromise]) => async (zip: JSZip) => {
			const sourceFile = await filePromise.async('uint8array');
			const fileKeyBase64 = fileKeys[fileName];
	
			const outFile = fileKeyBase64
				? _decrypt(sourceFile, fileKeyBase64, fileKeyAes)
				: sourceFile;
	
			return zip.file(fileName, outFile);
		})
		.reduce(async (zipPromise, addFile) => await addFile(await zipPromise), Promise.resolve(new JSZip()));

	return await outZip.generateAsync({ type: 'nodebuffer' });
}
