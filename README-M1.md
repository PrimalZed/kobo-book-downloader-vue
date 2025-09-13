# Kobo Book Downloader - M1 Mac Build

This is a successful build of the Kobo Book Downloader for Apple Silicon (M1/M2) Macs. The original project was modified to support macOS ARM64 architecture.

## Build Process

1. Cloned the original repository
2. Modified pkg.json to target macOS ARM64:
```json
{
  "assets": [
    "dist/.env",
    "dist/frontend/**/*"
  ],
  "targets": ["node18-macos-arm64"],
  "outputPath": "artifacts"
}
```

3. Built using Node.js v23.9.0 and npm 10.9.2
4. Build commands used:
   ```bash
   npm install
   npm run build
   npm run publish
   ```

## Running the Application

1. The binary is named 'kbd' and should be made executable:
   ```bash
   chmod +x kbd
   ```

2. Run the application:
   ```bash
   ./kbd
   ```

3. Access the application at http://localhost:3000

## System Requirements

- macOS with Apple Silicon (M1/M2)
- Hosts file entry (add to /etc/hosts):
  ```
  127.0.0.1 crypto.local.gd kobo.local.gd
  ```

## Notes

- Successfully tested on macOS with M1 chip
- Application runs natively without Rosetta 2
- All functionality works the same as the Windows version

## Credits

Original project: https://github.com/PrimalZed/kobo-book-downloader-vue

